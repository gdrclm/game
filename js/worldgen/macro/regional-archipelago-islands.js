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

    function preserveRegionalWaterSeparations(surface, islands, macroWidth) {
        const { grid, signed, inherited, mechanisms } = surface;
        const { width, height, subdivision, originX, originY } = grid;
        const roots = new Int32Array(signed.length).fill(-1);
        const labels = new Int32Array(signed.length);
        const uplifted = [];
        let restoredCount = 0;
        function root(cell) {
            while (roots[cell] !== cell) {
                roots[cell] = roots[roots[cell]];
                cell = roots[cell];
            }
            return cell;
        }
        function merge(cell, neighbor) {
            if (roots[neighbor] < 0) return;
            const a = root(cell);
            const b = root(neighbor);
            if (a === b) return;
            roots[a] = b;
            labels[b] ||= labels[a];
        }

        // The outer land and every named offshore body are distinct constraints.
        for (const [index, island] of islands.entries()) {
            for (const cell of island.cellIndices) {
                const x = (cell % macroWidth - originX) * subdivision;
                const y = (Math.floor(cell / macroWidth) - originY) * subdivision;
                labels[y * width + x] = index + 2;
            }
        }
        for (let cell = 0; cell < signed.length; cell += 1) {
            if (signed[cell] <= 0) continue;
            const x = cell % width;
            const y = Math.floor(cell / width);
            if (x === 0 || x === width - 1 || y === 0 || y === height - 1) labels[cell] = 1;
            if (inherited[cell] <= 0 && !labels[cell]) {
                uplifted.push(cell);
                continue;
            }
            roots[cell] = cell;
            if (x > 0) merge(cell, cell - 1);
            if (y > 0) merge(cell, cell - width);
        }

        // Retain the strongest supported uplift first. At a connection that
        // would consume an inherited separation, use the measured parent bed.
        uplifted.sort((a, b) => signed[b] - signed[a] || a - b);
        for (const cell of uplifted) {
            let label = 0;
            let wouldJoin = false;
            macro.forEachCardinalNeighbor(cell, width, signed.length, neighbor => {
                if (roots[neighbor] < 0) return;
                const neighboringLabel = labels[root(neighbor)];
                wouldJoin ||= Boolean(label && neighboringLabel && label !== neighboringLabel);
                label ||= neighboringLabel;
            });
            if (wouldJoin) {
                signed[cell] = inherited[cell];
                mechanisms[cell] = 4;
                restoredCount += 1;
                continue;
            }
            roots[cell] = cell;
            labels[cell] = label;
            macro.forEachCardinalNeighbor(cell, width, signed.length, neighbor => merge(cell, neighbor));
        }
        return restoredCount;
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

    // Validate against the canonical raster, not just a self-consistent footprint.
    function validateRegionalIslandSurface(row, land, grid, signed) {
        if (!signed || !land.size) return [];
        const errors = [];
        const { width, height, subdivision, originX, originY } = grid;
        const first = land.values().next().value;
        const seen = new Set([first]);
        const queue = [first];
        const expectedShore = new Set();
        let sumHeight = 0, minHeight = Infinity, maxHeight = -Infinity;
        let sumX = 0, sumY = 0, sumSlope = 0;
        let sumDepth = 0, minDepth = Infinity, maxDepth = -Infinity;
        let anchor = first, boundary = false, joinsOtherLand = false;
        for (let cursor = 0; cursor < queue.length; cursor += 1) {
            const cell = queue[cursor];
            const x = cell % width, y = Math.floor(cell / width);
            boundary ||= x === 0 || y === 0 || x === width - 1 || y === height - 1;
            sumX += originX + x / subdivision;
            sumY += originY + y / subdivision;
            sumHeight += signed[cell];
            minHeight = Math.min(minHeight, signed[cell]);
            maxHeight = Math.max(maxHeight, signed[cell]);
            if (signed[cell] > signed[anchor] || (signed[cell] === signed[anchor] && cell < anchor)) anchor = cell;
            let slope = 0;
            macro.forEachCardinalNeighbor(cell, width, signed.length, neighbor => {
                slope = Math.max(slope, Math.abs(signed[cell] - signed[neighbor]) * subdivision);
                if (signed[neighbor] > 0) {
                    if (!land.has(neighbor)) joinsOtherLand = true;
                    else if (!seen.has(neighbor)) { seen.add(neighbor); queue.push(neighbor); }
                } else {
                    expectedShore.add(cell + ':' + neighbor);
                    const depth = -signed[neighbor];
                    sumDepth += depth;
                    minDepth = Math.min(minDepth, depth);
                    maxDepth = Math.max(maxDepth, depth);
                }
            });
            sumSlope += slope;
        }
        if (queue.length !== land.size || joinsOtherLand || boundary) {
            errors.push('Regional island must be one complete enclosed land component: ' + row.islandId);
            return errors;
        }
        const actualShore = new Set(row.shoreEdges.map(edge => edge[0] + ':' + edge[1]));
        if (actualShore.size !== row.shoreEdges.length || expectedShore.size !== actualShore.size
            || [...expectedShore].some(edge => !actualShore.has(edge))) {
            errors.push('Regional island shoreline is incomplete or duplicated: ' + row.islandId);
        }
        const matches = (value, expected) => Number.isFinite(value) && Math.abs(value - expected) <= 1e-6;
        const n = land.size, coast = expectedShore.size;
        if (!matches(row.anchor?.x, originX + (anchor % width) / subdivision)
            || !matches(row.anchor?.y, originY + Math.floor(anchor / width) / subdivision)
            || !matches(row.centroid?.x, sumX / n) || !matches(row.centroid?.y, sumY / n)
            || !matches(row.elevation?.min, minHeight) || !matches(row.elevation?.max, maxHeight)
            || !matches(row.elevation?.mean, sumHeight / n)
            || !matches(row.meanSlopePerMacroCell, sumSlope / n)
            || !matches(row.shoreLengthMacroCellUnits, coast / subdivision)
            || !matches(row.nearshoreDepth?.min, minDepth) || !matches(row.nearshoreDepth?.max, maxDepth)
            || !matches(row.nearshoreDepth?.mean, sumDepth / coast)) {
            errors.push('Regional island measurements contradict its elevation raster: ' + row.islandId);
        }
        return errors;
    }

    macro.validateRegionalIslandSurface = validateRegionalIslandSurface;
    macro.extractRegionalArchipelagoIslands = extractRegionalArchipelagoIslands;
    macro.preserveRegionalWaterSeparations = preserveRegionalWaterSeparations;
})();
