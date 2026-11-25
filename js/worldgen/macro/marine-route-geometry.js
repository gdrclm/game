(() => {
    const macro = window.Game.systems.worldgenMacro;
    const { forEachCardinalNeighbor, cellPoint } = macro;

    function traceWaterPaths(mask, fromCellIndex, blockedCells = new Set()) {
        const { width, values, threshold } = mask;
        const previous = new Int32Array(values.length).fill(-1);
        const distance = new Int32Array(values.length).fill(-1);
        if (values[fromCellIndex] >= threshold || blockedCells.has(fromCellIndex)) return { previous, distance };
        const queue = [fromCellIndex];
        distance[fromCellIndex] = 0;
        for (let cursor = 0; cursor < queue.length; cursor += 1) {
            const index = queue[cursor];
            forEachCardinalNeighbor(index, width, values.length, neighbor => {
                if (distance[neighbor] >= 0 || values[neighbor] >= threshold || blockedCells.has(neighbor)) return;
                distance[neighbor] = distance[index] + 1;
                previous[neighbor] = index;
                queue.push(neighbor);
            });
        }
        return { previous, distance };
    }

    function reconstructPath(previous, target) {
        const path = [target];
        for (let index = previous[target]; index >= 0; index = previous[index]) path.push(index);
        return path.reverse();
    }

    function buildMarineAccessEdges(terminals, mask, classifyConnectionStrength) {
        const edges = [];
        const { width, height } = mask;
        for (const [index, left] of terminals.entries()) {
            const trace = traceWaterPaths(mask, left.waterCellIndex);
            for (const right of terminals.slice(index + 1)) {
                const distance = trace.distance[right.waterCellIndex];
                if (distance < 1) continue;
                const waterPathCellIndices = reconstructPath(trace.previous, right.waterCellIndex);
                const distanceRatio = Math.min(1, distance / Math.hypot(width, height));
                const coarseConnectivityStrength = 1 - distanceRatio;
                edges.push({
                    edgeId: `sea_lane_${String(edges.length + 1).padStart(3, '0')}`,
                    edgeType: 'navigable_sea_lane',
                    fromNodeId: left.nodeId,
                    toNodeId: right.nodeId,
                    fromSeaRegionClusterId: left.seaRegionClusterId,
                    toSeaRegionClusterId: right.seaRegionClusterId,
                    coarseConnectivityStrength,
                    connectionClass: classifyConnectionStrength(coarseConnectivityStrength),
                    waterPathCellIndices,
                    waterTravelCells: distance,
                    distanceRatio,
                    routeCostComputed: false,
                    futureMacroRouteInput: true
                });
            }
        }
        return edges;
    }

    function findIslandPassages(topology, seaGraph, hybridGraph, routes, mask) {
        if (!topology?.islandGroupId || topology.islands.length < 2) return [];
        const pathsByPair = new Map(seaGraph.edges.map(edge => [[edge.fromNodeId, edge.toNodeId].sort().join(':'), edge]));
        const hybridBySource = new Map(hybridGraph.edges.filter(edge => edge.seaGraphEdge).map(edge => [edge.sourceGraphEdgeId, edge]));
        const { width, height } = mask;
        const maximumPassageWidth = Math.min(width, height) * 0.13;
        const passages = [];
        for (let index = 1; index < topology.islands.length; index += 1) {
            const left = topology.islands[index - 1];
            const right = topology.islands[index];
            let nearest = { gap: Infinity };
            for (const landA of left.cellIndices) {
                for (const landB of right.cellIndices) {
                    const gap = macro.cellDistance(landA, landB, width);
                    if (gap < nearest.gap) nearest = { gap, landA, landB };
                }
            }
            if (nearest.gap > maximumPassageWidth) continue;
            const edge = pathsByPair.get([`sea_terminal_${left.portId}`, `sea_terminal_${right.portId}`].sort().join(':'));
            if (!edge) continue;
            const lane = hybridBySource.get(edge.edgeId);
            if (!lane) continue;
            const shoreA = cellPoint(nearest.landA, width);
            const shoreB = cellPoint(nearest.landB, width);
            const midpoint = { x: (shoreA.x + shoreB.x) / 2, y: (shoreA.y + shoreB.y) / 2 };
            const laneCells = edge.waterPathCellIndices.map(cellIndex => {
                const point = cellPoint(cellIndex, width);
                return { cellIndex, distance: Math.hypot(point.x - midpoint.x, point.y - midpoint.y) };
            });
            laneCells.sort((a, b) => a.distance - b.distance || a.cellIndex - b.cellIndex);
            const anchor = laneCells[0];
            if (anchor.distance > nearest.gap / 2 + 2) continue;
            const restrictedCells = new Set();
            const radius = nearest.gap / 2 + 2;
            for (let y = Math.max(0, Math.floor(midpoint.y - radius)); y <= Math.min(height - 1, midpoint.y + radius); y += 1) {
                for (let x = Math.max(0, Math.floor(midpoint.x - radius)); x <= Math.min(width - 1, midpoint.x + radius); x += 1) {
                    const cell = y * width + x;
                    if (mask.values[cell] < mask.threshold && Math.hypot(x - midpoint.x, y - midpoint.y) <= radius) restrictedCells.add(cell);
                }
            }
            const end = edge.waterPathCellIndices.at(-1);
            const start = edge.waterPathCellIndices[0];
            if (!restrictedCells.size) continue;
            const bypass = traceWaterPaths(mask, start, restrictedCells).distance[end];
            const routeIds = routes.candidateRoutes.filter(route => route.edgePathIds.includes(lane.edgeId)).map(route => route.routeId);
            if (!routeIds.length) continue;
            passages.push({
                passageId: `island_passage_${left.peakCellIndex}_${right.peakCellIndex}`,
                islandGroupId: topology.islandGroupId,
                islandIds: [left.islandId, right.islandId],
                widthCells: Math.max(1, nearest.gap - 1),
                shoreCellIndices: [nearest.landA, nearest.landB],
                cellIndex: anchor.cellIndex,
                restrictedCellIndices: [...restrictedCells].sort((a, b) => a - b),
                travelCells: edge.waterTravelCells,
                bypassTravelCells: bypass < 0 ? null : bypass,
                seaRegionIds: [...new Set([left.seaRegionId, right.seaRegionId])],
                seaEdgeId: edge.edgeId,
                hybridEdgeId: lane.edgeId,
                routeIds
            });
        }
        return passages;
    }

    Object.assign(macro, { buildMarineAccessEdges, findIslandPassages });
})();
