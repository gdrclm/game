(() => {
    const macro = window.Game.systems.worldgenMacro;
    const channels = {
        temperature: ['temperatureColdLoadField', 'values'],
        coldLoad: ['temperatureColdLoadField', 'coldLoadValues'],
        wetness: ['wetnessField', 'values'],
        storm: ['stormCorridorField', 'values'],
        seasonality: ['seasonalityField', 'values']
    };
    const round = n => Math.round(n * 1e6) / 1e6;
    function sample(values, width, height, x, y) {
        const left = Math.floor(x), top = Math.floor(y);
        const right = Math.min(width - 1, left + 1), bottom = Math.min(height - 1, top + 1);
        const dx = x-left, dy = y-top;
        return values[top*width+left]*(1-dx)*(1-dy) + values[top*width+right]*dx*(1-dy)
            + values[bottom*width+left]*(1-dx)*dy + values[bottom*width+right]*dx*dy;
    }

    function toIslandCatchment(outlet, runoffByCell, subdivision) {
        const { outletCellIndex, receivingCellIndex, receiver, contributingCells } = outlet;
        return { outletCellIndex, receivingCellIndex, receiver, contributingCells,
            runoffPotential: round(runoffByCell[outletCellIndex] / subdivision ** 2) };
    }

    function measureIslandDrainage(cells, grid, signed, wetness, open) {
        const samples = [];
        for (const cell of cells) samples[cell] = wetness(cell);
        const drainage = macro.routeSurfaceDrainage({ signed, width: grid.width, wetness: samples,
            landCells: cells, receiverAt: cell => open[cell] ? 'ocean' : 'inland_water' });
        return drainage.outlets.map(outlet => toIslandCatchment(outlet, drainage.runoffPotentialByCell, grid.subdivision))
            .sort((a, b) => a.outletCellIndex - b.outletCellIndex);
    }

    function buildRegionalIslandEnvironment(islands, surface, climateOutput, bounds, network) {
        const fields=climateOutput?.fields;
        if (!fields || !Object.values(channels).every(([id,key])=>fields[id]?.[key]?.length===bounds.width*bounds.height)) {
            throw Error('Regional island environment requires canonical macro climate fields');
        }
        const {grid,signed}=surface;
        const validBands=new Set((climateOutput.records?.climateBands||[]).map(row=>row.climateBandId));
        const byCell=new Map();
        for(const zone of climateOutput.intermediateOutputs?.climateZoneClassification?.zoneSummaries||[]) {
            if(validBands.has(zone.climateBandId)) for(const cell of zone.cellIndices) byCell.set(cell,zone.climateBandId);
        }
        const open=macro.indexRegionalOpenWater(surface);
        const coordinates=cell=>[grid.originX+(cell%grid.width)/grid.subdivision,grid.originY+Math.floor(cell/grid.width)/grid.subdivision];
        const read=(cell,channel)=>{
            const [id,key]=channels[channel], [x,y]=coordinates(cell);
            return sample(fields[id][key],bounds.width,bounds.height,x,y);
        };
        const islandByCell = [];
        const cellsByIsland = new Map();
        const landCells = [];
        const wetness = [];
        const seasonality = [];
        const records=islands.map(island=>{
            const cells=island.landRuns.flatMap(([start,length])=>Array.from({length},(_,i)=>start+i));
            cellsByIsland.set(island.islandId, cells);
            const sums=Object.fromEntries(Object.keys(channels).map(key=>[key,0]));
            const climateBandCells={};
            let unmatchedClimateCells=0;
            for(const cell of cells) {
                islandByCell[cell] = island.islandId;
                landCells.push(cell);
                for (const key of Object.keys(channels)) {
                    const value = read(cell, key);
                    sums[key] += value;
                    if (key === 'wetness') wetness[cell] = value;
                    if (key === 'seasonality') seasonality[cell] = value;
                }
                const [x,y]=coordinates(cell);
                const band=byCell.get(Math.round(y)*bounds.width+Math.round(x));
                if(band) climateBandCells[band]=(climateBandCells[band]||0)+1;
                else unmatchedClimateCells++;
            }
            const climate=Object.fromEntries(Object.entries(sums).map(([key,value])=>[key,round(value/cells.length)]));
            return {islandId:island.islandId,landCellCount:cells.length,climate,climateBandCells,unmatchedClimateCells,
                catchments: []};
        });
        const drainage = macro.routeSurfaceDrainage({ signed, width: grid.width, wetness, landCells,
            receiverAt: cell => open[cell] ? 'ocean' : 'inland_water' });
        const water = macro.measureLocalWater({ signed, width: grid.width, subdivision: grid.subdivision, drainage, wetness, seasonality });
        const byId = new Map(records.map(row => [row.islandId, { record: row, summary: macro.createWaterAccessSummary() }]));
        for (const cell of landCells) macro.addWaterAccessCell(byId.get(islandByCell[cell]).summary, water, cell);
        for (const outlet of drainage.outlets.sort((a, b) => a.outletCellIndex - b.outletCellIndex)) {
            const { lowInputPotential, spillElevation, storageSpace } = macro.serializeDrainageBranch(water.branches.get(outlet.outletCellIndex));
            byId.get(islandByCell[outlet.outletCellIndex]).record.catchments.push({
                ...toIslandCatchment(outlet, drainage.runoffPotentialByCell, grid.subdivision),
                lowInputPotential, spillElevation, storageSpace
            });
        }
        for (const { record, summary } of byId.values()) {
            record.waterAccess = macro.summarizeWaterAccess(summary);
            record.runoffPotential = record.waterAccess.inputPotential;
        }
        const wind = fields.prevailingWindField;
        if (wind?.xValues && wind?.yValues && network) {
            const readWind = cell => {
                const [x, y] = coordinates(cell);
                return [sample(wind.xValues, bounds.width, bounds.height, x, y),
                    sample(wind.yValues, bounds.width, bounds.height, x, y)];
            };
            const ports = new Map(network.landfalls.map(port => [port.islandId, port]));
            const linkCounts = countIslandSeaLinks(network.links);
            const landTravel = macro.traceDryLandAccess(signed, grid.width, cell => Boolean(islandByCell[cell]),
                network.landfalls.map(port => port.landCell));
            for (const record of records) {
                record.physicalSetting = macro.measureIslandPhysicalSetting({ cells: cellsByIsland.get(record.islandId),
                    surface, readClimate: read, readWind, landTravel, landfall: ports.get(record.islandId),
                    seaLinkCount: linkCounts.get(record.islandId) || 0 });
            }
        }
        return {version:1,climateResolution:'interpolated_macro_baseline',runoffUnits:'wetness_times_macro_cell_area',
            sourceFieldIds:[...new Set(Object.values(channels).map(([id])=>id)), ...(wind && network ? ['prevailingWindField'] : [])],
            records};
    }

    function countIslandSeaLinks(links) {
        const counts = new Map();
        for (const link of links) {
            for (const id of [link.fromIslandId, link.toIslandId]) counts.set(id, (counts.get(id) || 0) + 1);
        }
        return counts;
    }

    function validateRegionalIslandEnvironment(regional, geography) {
        const env=regional?.islandEnvironment;
        if(env===undefined)return [];
        if(env?.version!==1 || env.climateResolution!=='interpolated_macro_baseline'
            || env.runoffUnits!=='wetness_times_macro_cell_area' || !Array.isArray(env.records)
            || !Array.isArray(regional.islandRecords))return ['Invalid regional island environment contract.'];
        const errors=[], ids=new Map(regional.islandRecords.map(row=>[row.islandId,row]));
        const bands=new Set((geography.climateBands||[]).map(row=>row.climateBandId));
        const seen=new Set();
        const signed=macro.decodeRegionalElevation(regional);
        const grid=regional.grid;
        const landfalls = new Map((regional.waterNetwork?.landfalls || []).map(port => [port.islandId, port]));
        const linkCounts = countIslandSeaLinks(regional.waterNetwork?.links || []);
        for(const row of env.records) {
            const island=ids.get(row?.islandId);
            if(!island||seen.has(row.islandId)||row.landCellCount!==island.areaCells
                || !Object.keys(channels).every(key=>Number.isFinite(row.climate?.[key])&&row.climate[key]>=0&&row.climate[key]<=1)
                || !Number.isSafeInteger(row.unmatchedClimateCells)||row.unmatchedClimateCells<0
                || !row.climateBandCells||!Array.isArray(row.catchments)||!Number.isFinite(row.runoffPotential)
                ||row.runoffPotential<0){errors.push('Invalid regional environmental record: '+row?.islandId);continue;}
            seen.add(row.islandId);
            let covered=row.unmatchedClimateCells;
            for(const [id,n] of Object.entries(row.climateBandCells)){
                if(!bands.has(id)||!Number.isSafeInteger(n)||n<=0)errors.push('Invalid regional climate band reference: '+id);
                covered+=n;
            }
            if(covered!==row.landCellCount)errors.push('Regional climate coverage does not conserve land area.');
            const land=new Set(island.landRuns.flatMap(([start,length])=>Array.from({length},(_,i)=>start+i)));
            let counted=0, runoff=0;
            const outlets=new Set();
            let lowInput = 0;
            let storageSpace = 0;
            for(const c of row.catchments){
                const next=c?.receivingCellIndex, cell=c?.outletCellIndex;
                let adjacent=false;
                if(signed&&land.has(cell))macro.forEachCardinalNeighbor(cell,grid.width,signed.length,n=>{if(n===next)adjacent=true;});
                if(!land.has(cell)||outlets.has(cell)||!Number.isSafeInteger(c.contributingCells)||c.contributingCells<=0
                    ||!Number.isFinite(c.runoffPotential)||c.runoffPotential<0||c.runoffPotential>c.contributingCells/grid.subdivision**2+1e-6
                    ||(next===-1?c.receiver!=='local_depression':!['ocean','inland_water'].includes(c.receiver)
                    ||!Number.isSafeInteger(next)||next<0||next>=grid.width*grid.height||land.has(next)||(signed&&(!adjacent||signed[next]>0)))){
                    errors.push('Invalid regional catchment in '+row.islandId);continue;
                }
                if (row.waterAccess && (!Number.isFinite(c.lowInputPotential) || c.lowInputPotential < 0
                    || c.lowInputPotential > c.runoffPotential + 1e-6 || !Number.isFinite(c.storageSpace) || c.storageSpace < 0
                    || (c.spillElevation === null ? c.storageSpace !== 0
                        : !Number.isFinite(c.spillElevation) || c.receiver !== 'local_depression'
                            || (signed && c.spillElevation < signed[cell])))) {
                    errors.push(`Invalid water retention or seasonal input in ${row.islandId}.`);
                }
                lowInput += c.lowInputPotential ?? 0;
                storageSpace += c.storageSpace ?? 0;
                outlets.add(cell);counted+=c.contributingCells;runoff+=c.runoffPotential;
            }
            if(counted!==row.landCellCount||Math.abs(runoff-row.runoffPotential)>(row.catchments.length+1)*1e-6
                ||Math.abs(row.runoffPotential-row.climate.wetness*island.areaMacroCellUnits)>(island.areaMacroCellUnits+1)*1e-6)
                errors.push('Regional catchment area or runoff is inconsistent: '+row.islandId);
            if (row.waterAccess !== undefined && (!macro.validateWaterAccessSummary(row.waterAccess, row.landCellCount, grid.subdivision)
                || Math.abs(row.waterAccess.inputPotential - row.runoffPotential) > 1e-6
                || Math.abs(row.waterAccess.lowInputPotential - lowInput) > (row.catchments.length + 1) * 1e-6
                || Math.abs(row.waterAccess.storageSpace - storageSpace) > (row.catchments.length + 1) * 1e-6)) {
                errors.push(`Regional access or retention disagrees with catchments in ${row.islandId}.`);
            }
            if (!macro.validateIslandPhysicalSetting(row.physicalSetting, island, landfalls.get(row.islandId), linkCounts.get(row.islandId) || 0)) {
                errors.push(`Regional terrain, local climate or landfall access is invalid in ${row.islandId}.`);
            }
        }
        if(seen.size!==ids.size)errors.push('Regional island environment does not cover every island.');
        return errors;
    }
    Object.assign(macro,{buildRegionalIslandEnvironment,validateRegionalIslandEnvironment,measureIslandDrainage});
})();
