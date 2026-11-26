(() => {
    const macro = window.Game.systems.worldgenMacro;
    const round = number => Math.round(number * 1e6) / 1e6;

    function indexOpenWater({ grid, signed, coastalBoundary }) {
        const { width, height } = grid;
        const open = new Uint8Array(signed.length);
        const queue = new Int32Array(signed.length);
        let tail = 0;
        for (let cell = 0; cell < signed.length; cell += 1) {
            const x = cell % width;
            if (signed[cell] > 0 || (x > 0 && x < width - 1 && cell >= width && cell < width * (height - 1))) continue;
            if (coastalBoundary && !coastalBoundary[cell]) continue;
            open[cell] = 1;
            queue[tail++] = cell;
        }
        for (let cursor = 0; cursor < tail; cursor += 1) {
            const cell = queue[cursor];
            macro.forEachCardinalNeighbor(cell, width, signed.length, neighbor => {
                if (open[neighbor] || signed[neighbor] > 0) return;
                open[neighbor] = 1;
                queue[tail++] = neighbor;
            });
        }
        return open;
    }

    function chooseLandfalls(islands, surface, open) {
        const ports = [];
        for (const island of islands) {
            let selected;
            let minimumSlope = Infinity;
            for (const [landCell, waterCell] of island.shoreEdges) {
                if (!open[waterCell]) continue;
                const shoreSlope = surface.signed[landCell] - surface.signed[waterCell];
                if (shoreSlope < minimumSlope) {
                    selected = { islandId: island.islandId, landCell, waterCell };
                    minimumSlope = shoreSlope;
                }
            }
            if (selected) ports.push(selected);
        }
        return ports;
    }

    function linkNearestLandfalls(landfalls, surface, open) {
        const { grid, signed } = surface;
        const owner = new Int32Array(signed.length).fill(-1);
        const steps = new Int32Array(signed.length);
        const previous = new Int32Array(signed.length).fill(-1);
        const queue = new Int32Array(signed.length);
        const connections = new Map();
        let tail = 0;
        for (const [id, { waterCell }] of landfalls.entries()) {
            if (owner[waterCell] >= 0) {
                connections.set(`${owner[waterCell]}:${id}`, {
                    left: owner[waterCell], right: id, start: waterCell, end: waterCell, waterSteps: 0
                });
                continue;
            }
            owner[waterCell] = id;
            queue[tail++] = waterCell;
        }
        for (let cursor = 0; cursor < tail; cursor += 1) {
            const cell = queue[cursor];
            macro.forEachCardinalNeighbor(cell, grid.width, open.length, neighbor => {
                if (!open[neighbor]) return;
                if (owner[neighbor] < 0) {
                    owner[neighbor] = owner[cell];
                    steps[neighbor] = steps[cell] + 1;
                    previous[neighbor] = cell;
                    queue[tail++] = neighbor;
                    return;
                }
                if (owner[neighbor] === owner[cell]) return;
                const [left, right, start, end] = owner[cell] < owner[neighbor]
                    ? [owner[cell], owner[neighbor], cell, neighbor] : [owner[neighbor], owner[cell], neighbor, cell];
                const key = `${left}:${right}`;
                const waterSteps = steps[start] + 1 + steps[end];
                const saved = connections.get(key);
                if (!saved || saved.waterSteps > waterSteps) connections.set(key, { left, right, start, end, waterSteps });
            });
        }
        return [...connections.values()].map(({ left, right, start, end, waterSteps }) => {
            const path = [start];
            for (let cell = previous[start]; cell >= 0; cell = previous[cell]) path.push(cell);
            path.reverse();
            if (start !== end) {
                for (let cell = end; cell >= 0; cell = previous[cell]) path.push(cell);
            }
            const depths = path.map(cell => -signed[cell]);
            return {
                fromIslandId: landfalls[left].islandId,
                toIslandId: landfalls[right].islandId,
                waterPathCellIndices: path,
                distanceMacroCellUnits: round(waterSteps / grid.subdivision),
                shallowestDepth: round(Math.min(...depths)),
                meanDepth: round(depths.reduce((sum, depth) => sum + depth, 0) / depths.length)
            };
        });
    }

    function summarizeConnectivity(islands, links) {
        const network = new Map(islands.map(island => [island.islandId, []]));
        for (const { fromIslandId, toIslandId } of links) {
            network.get(fromIslandId).push(toIslandId);
            network.get(toIslandId).push(fromIslandId);
        }
        const seen = new Set();
        const componentSizes = [];
        for (const island of islands) {
            if (seen.has(island.islandId)) continue;
            const queue = [island.islandId];
            seen.add(island.islandId);
            for (let cursor = 0; cursor < queue.length; cursor += 1) {
                for (const neighbor of network.get(queue[cursor])) {
                    if (seen.has(neighbor)) continue;
                    queue.push(neighbor);
                    seen.add(neighbor);
                }
            }
            componentSizes.push(queue.length);
        }
        return componentSizes.sort((a, b) => b - a);
    }

    function buildRegionalArchipelagoWaterNetwork(islands, surface) {
        const open = indexOpenWater(surface);
        const landfalls = chooseLandfalls(islands, surface, open);
        const links = linkNearestLandfalls(landfalls, surface, open);
        return { landfalls, links, componentSizes: summarizeConnectivity(islands, links) };
    }

    // Physical candidates may be connected through smaller stepping stones.
    // This is not a sailing vessel capability or an expedition selection.
    function measureRegionalCarrierCapacity(islands, waterNetwork, thresholds = [0.125, 0.25, 0.5, 1]) {
        const landfalls = new Set(waterNetwork.landfalls.map(row => row.islandId));
        const byId = new Map(islands.map(row => [row.islandId, row]));
        const neighbors = new Map([...landfalls].filter(id => byId.has(id)).map(id => [id, []]));
        for (const link of waterNetwork.links) {
            const a = neighbors.get(link.fromIslandId), b = neighbors.get(link.toIslandId);
            if (a && b) { a.push(link.toIslandId); b.push(link.fromIslandId); }
        }
        const components = [], seen = new Set();
        for (const id of neighbors.keys()) {
            if (seen.has(id)) continue;
            const queue = [id]; seen.add(id);
            for (let i = 0; i < queue.length; i += 1) {
                for (const next of neighbors.get(queue[i])) {
                    if (!seen.has(next)) { seen.add(next); queue.push(next); }
                }
            }
            components.push(queue.map(key => byId.get(key)));
        }
        return thresholds.map(minAreaMacroCellUnits => ({
            minAreaMacroCellUnits,
            islandCount: islands.filter(row => row.areaMacroCellUnits >= minAreaMacroCellUnits).length,
            openWaterLandfallCount: islands.filter(row => row.areaMacroCellUnits >= minAreaMacroCellUnits && landfalls.has(row.islandId)).length,
            largestConnectedEligibleCount: Math.max(0, ...components.map(rows =>
                rows.filter(row => row.areaMacroCellUnits >= minAreaMacroCellUnits).length))
        }));
    }

    macro.measureRegionalCarrierCapacity = measureRegionalCarrierCapacity;
    macro.buildRegionalArchipelagoWaterNetwork = buildRegionalArchipelagoWaterNetwork;
})();
