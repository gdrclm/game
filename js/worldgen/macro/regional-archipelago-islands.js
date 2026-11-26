(() => {
    const macro = window.Game.systems.worldgenMacro;
    const MINIMUM_LAND_CELLS = 8;
    const ISLAND_ORIGINS = ['inherited', 'volcanic_satellite', 'fault_uplift', 'erosional_fragment', 'shelf_remnant'];
    const round = number => Math.round(number * 1e6) / 1e6;

    function collectLandComponents(surface) {
        const { grid, signed } = surface;
        const { width, height } = grid;
        const visited = new Uint8Array(signed.length);
        const components = [];
        for (let start = 0; start < signed.length; start += 1) {
            if (visited[start] || signed[start] <= 0) continue;
            const cells = [start];
            visited[start] = 1;
            let touchesBoundary = false;
            for (let cursor = 0; cursor < cells.length; cursor += 1) {
                const cell = cells[cursor];
                const x = cell % width;
                touchesBoundary ||= x === 0 || x === width - 1 || cell < width || cell >= width * (height - 1);
                macro.forEachCardinalNeighbor(cell, width, signed.length, neighbor => {
                    if (visited[neighbor] || signed[neighbor] <= 0) return;
                    visited[neighbor] = 1;
                    cells.push(neighbor);
                });
            }
            if (!touchesBoundary && cells.length >= MINIMUM_LAND_CELLS) components.push(cells);
        }
        return components;
    }

    function encodeLandRuns(cells, width) {
        const runs = [];
        for (const cell of cells.sort((a, b) => a - b)) {
            const run = runs.at(-1);
            if (run && run[0] + run[1] === cell && cell % width) run[1] += 1;
            else runs.push([cell, 1]);
        }
        return runs;
    }

    function measureIsland(cells, surface, macroWidth, parentByCell, peaks, hotspotPlateId, plateSeeds) {
        const { grid, signed, inherited, mechanisms } = surface;
        const sum = { x: 0, y: 0, height: 0, slope: 0, depth: 0 };
        const bands = { minimum: Infinity, maximum: -Infinity, deep: 0, shallow: Infinity };
        const support = { inheritedLandCells: 0, volcanicRaisedCells: 0, faultRaisedCells: 0,
            neighboringFaultCutEdges: 0, neighboringErosionCutEdges: 0 };
        const parentIds = new Set();
        const geologicalVents = new Set();
        const coast = [];
        let anchor = cells[0];
        for (const cell of cells) {
            const x = grid.originX + (cell % grid.width) / grid.subdivision;
            const y = grid.originY + Math.floor(cell / grid.width) / grid.subdivision;
            sum.x += x;
            sum.y += y;
            sum.height += signed[cell];
            bands.minimum = Math.min(bands.minimum, signed[cell]);
            bands.maximum = Math.max(bands.maximum, signed[cell]);
            if (signed[cell] > signed[anchor] || (signed[cell] === signed[anchor] && cell < anchor)) anchor = cell;
            if (inherited[cell] > 0) support.inheritedLandCells += 1;
            else if (mechanisms[cell] === 1) {
                support.volcanicRaisedCells += 1;
                if (surface.ventByCell[cell] >= 0) geologicalVents.add(surface.ventByCell[cell]);
            }
            else if (mechanisms[cell] === 2) support.faultRaisedCells += 1;

            if (Number.isInteger(x) && Number.isInteger(y)) {
                const parent = parentByCell.get(y * macroWidth + x);
                if (parent) parentIds.add(parent);
            }
            let maxNeighborSlope = 0;
            macro.forEachCardinalNeighbor(cell, grid.width, signed.length, neighbor => {
                maxNeighborSlope = Math.max(maxNeighborSlope, Math.abs(signed[cell] - signed[neighbor]) * grid.subdivision);
                if (signed[neighbor] > 0) return;
                coast.push([cell, neighbor]);
                const depth = -signed[neighbor];
                bands.deep = Math.max(bands.deep, depth);
                bands.shallow = Math.min(bands.shallow, depth);
                sum.depth += depth;
                if (inherited[neighbor] > 0 && mechanisms[neighbor] === 2) support.neighboringFaultCutEdges += 1;
                if (inherited[neighbor] > 0 && mechanisms[neighbor] === 3) support.neighboringErosionCutEdges += 1;
            });
            sum.slope += maxNeighborSlope;
        }
        const x = grid.originX + (anchor % grid.width) / grid.subdivision;
        const y = grid.originY + Math.floor(anchor / grid.width) / grid.subdivision;
        const ranked = peaks.map(peak => ({ peak, distance: Math.hypot(peak.x - x, peak.y - y) }))
            .sort((a, b) => a.distance - b.distance || a.peak.cellIndex - b.peak.cellIndex);
        const nearest = ranked[0];
        if (!parentIds.size && nearest.distance > nearest.peak.radius + 4) return null;
        const globalAnchorX = grid.originX * grid.subdivision + anchor % grid.width;
        const globalAnchorY = grid.originY * grid.subdivision + Math.floor(anchor / grid.width);
        const macroIslandIds = [...parentIds].sort();
        let origin = 'shelf_remnant';
        if (macroIslandIds.length) origin = 'inherited';
        else if (support.volcanicRaisedCells >= support.inheritedLandCells && support.volcanicRaisedCells > support.faultRaisedCells) origin = 'volcanic_satellite';
        else if (support.faultRaisedCells > support.inheritedLandCells || support.neighboringFaultCutEdges) origin = 'fault_uplift';
        else if (support.neighboringErosionCutEdges) origin = 'erosional_fragment';
        const volcanoSupported = origin === 'volcanic_satellite' || origin === 'inherited';
        const sourcePlateId = volcanoSupported ? hotspotPlateId
            : plateSeeds.reduce((nearest, plate) => {
                const distance = Math.hypot(plate.seedPoint.x - x, plate.seedPoint.y - y);
                return distance < nearest.distance ? { distance, id: plate.plateId } : nearest;
            }, { distance: Infinity, id: hotspotPlateId }).id;

        return {
            islandId: `regional_island_${globalAnchorX}_${globalAnchorY}`,
            anchor: { x, y },
            centroid: { x: round(sum.x / cells.length), y: round(sum.y / cells.length) },
            areaCells: cells.length,
            areaMacroCellUnits: round(cells.length / grid.subdivision ** 2),
            elevation: { min: round(bands.minimum), max: round(bands.maximum), mean: round(sum.height / cells.length) },
            meanSlopePerMacroCell: round(sum.slope / cells.length),
            shoreLengthMacroCellUnits: round(coast.length / grid.subdivision),
            nearshoreDepth: { min: round(bands.shallow), max: round(bands.deep), mean: round(sum.depth / coast.length) },
            physicalOrigin: { mechanism: origin, sourcePlateId, macroIslandIds,
                ...(volcanoSupported ? { parentPeakCell: nearest.peak.cellIndex } : {}),
                regionalVentIds: [...geologicalVents].map(index => surface.vents[index].ventId).sort(),
                ...support },
            landRuns: encodeLandRuns(cells, grid.width),
            shoreEdges: coast
        };
    }

    function extractRegionalArchipelagoIslands(surface, topology, chain, macroWidth, plateSeeds = []) {
        const parentByCell = new Map();
        for (const island of topology.islands) {
            for (const cell of island.cellIndices) parentByCell.set(cell, island.islandId);
        }
        const islands = collectLandComponents(surface)
            .map(cells => measureIsland(cells, surface, macroWidth, parentByCell, chain.peaks, chain.sourcePlateId, plateSeeds))
            .filter(Boolean)
            .sort((a, b) => b.areaCells - a.areaCells || a.islandId.localeCompare(b.islandId));
        const originCounts = Object.fromEntries(ISLAND_ORIGINS.map(origin =>
            [origin, islands.filter(row => row.physicalOrigin.mechanism === origin).length]
        ));
        return { islandRecords: islands, originCounts, minimumApproximatedAreaCells: MINIMUM_LAND_CELLS };
    }

    macro.extractRegionalArchipelagoIslands = extractRegionalArchipelagoIslands;
})();
