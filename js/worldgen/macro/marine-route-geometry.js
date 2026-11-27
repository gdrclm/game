(() => {
    const macro = window.Game.systems.worldgenMacro;
    const { cellPoint, forEachCardinalNeighbor } = macro;

    function traceWaterPaths(mask, fromCellIndex, blockedCells) {
        const { width, values, threshold } = mask;
        const distance = new Int32Array(values.length).fill(-1);
        if (values[fromCellIndex] >= threshold || blockedCells?.has(fromCellIndex)) return distance;
        const queue = [fromCellIndex];
        distance[fromCellIndex] = 0;
        for (let cursor = 0; cursor < queue.length; cursor += 1) {
            const index = queue[cursor];
            forEachCardinalNeighbor(index, width, values.length, neighbor => {
                if (distance[neighbor] >= 0 || values[neighbor] >= threshold || blockedCells?.has(neighbor)) return;
                distance[neighbor] = distance[index] + 1;
                queue.push(neighbor);
            });
        }
        return distance;
    }

    function reconstructPath(distance, source, target, width) {
        const start = cellPoint(source, width);
        const end = cellPoint(target, width);
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const path = [target];
        for (let cell = target; cell !== source;) {
            let next = -1;
            let bestDeviation = Infinity;
            forEachCardinalNeighbor(cell, width, distance.length, neighbor => {
                if (distance[neighbor] !== distance[cell] - 1) return;
                const point = cellPoint(neighbor, width);
                // Keep distance optimal, then prefer the heading to port over the BFS scan order.
                const deviation = Math.abs(dx * (point.y - start.y) - dy * (point.x - start.x));
                if (deviation < bestDeviation || (deviation === bestDeviation && neighbor < next)) {
                    next = neighbor;
                    bestDeviation = deviation;
                }
            });
            path.push(next);
            cell = next;
        }
        return path.reverse();
    }

    function buildMarineAccessEdges(terminals, mask, classifyConnectionStrength) {
        const edges = [];
        const { width, height } = mask;
        for (const [index, left] of terminals.entries()) {
            const distances = traceWaterPaths(mask, left.waterCellIndex);
            for (const right of terminals.slice(index + 1)) {
                const distance = distances[right.waterCellIndex];
                if (distance < 1) continue;
                const waterPathCellIndices = reconstructPath(distances, left.waterCellIndex, right.waterCellIndex, width);
                const distanceRatio = distance / Math.hypot(width, height);
                const coarseConnectivityStrength = Math.max(0, 1 - distanceRatio);
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

    function measureChangedLanes(mask, edges, blockedCells, { includePaths = false } = {}) {
        const traces = new Map();
        const changed = new Map();
        for (const edge of edges) {
            const path = edge.waterPathCellIndices;
            if (!path?.some(cell => blockedCells.has(cell))) continue;
            const start = path[0];
            const end = path.at(-1);
            const endpointsAccessible = macro.isOpenWaterTerminal(mask, start, blockedCells)
                && macro.isOpenWaterTerminal(mask, end, blockedCells);
            if (!traces.has(start)) traces.set(start, traceWaterPaths(mask, start, blockedCells));
            const distances = traces.get(start);
            const distance = distances[end];
            const alternative = distance < 0 ? null : {
                waterTravelCells: distance,
                distanceRatio: distance / Math.hypot(mask.width, mask.height),
                ...(includePaths && { waterPathCellIndices: reconstructPath(distances, start, end, mask.width) })
            };
            changed.set(edge.edgeId, { endpointsAccessible, alternative });
        }
        return changed;
    }

    function findIslandPassages(topology, hybridGraph, routes, mask) {
        if (!topology?.islandGroupId || topology.islands.length < 2) return [];
        const terminals = topology.ports.map(port => port.waterCellIndex);
        const routesByEdge = new Map();
        for (const route of routes.candidateRoutes) {
            for (const edgeId of route.edgePathIds) {
                if (!routesByEdge.has(edgeId)) routesByEdge.set(edgeId, []);
                routesByEdge.get(edgeId).push(route.routeId);
            }
        }
        const activeLanes = hybridGraph.edges.filter(edge => edge.waterPathCellIndices && routesByEdge.has(edge.edgeId));
        const apertures = macro.buildIslandPassageSections(topology, mask);
        const passages = [];
        const measuredSections = new Set();
        for (const { from, to, sections } of apertures) {
            for (const section of sections) {
                const sectionKey = section.restrictedCellIndices.slice().sort((a, b) => a - b).join(',');
                if (measuredSections.has(sectionKey)) continue;
                const blocked = new Set(section.restrictedCellIndices);
                if (terminals.some(cell => !macro.isOpenWaterTerminal(mask, cell, blocked))) continue;
                const changes = measureChangedLanes(mask, activeLanes, blocked);
                const detours = activeLanes.filter(edge => {
                    const change = changes.get(edge.edgeId);
                    return change?.endpointsAccessible
                        && (!change.alternative || change.alternative.waterTravelCells > edge.waterTravelCells);
                }).sort((a, b) => detourFraction(b, changes) - detourFraction(a, changes) || a.edgeId.localeCompare(b.edgeId));
                if (!detours.length) continue;
                measuredSections.add(sectionKey);
                const lane = detours[0];
                const passagePath = lane.waterPathCellIndices;
                const alternative = changes.get(lane.edgeId).alternative;
                passages.push({
                    passageId: `island_passage_${from.peakCellIndex}_${to.peakCellIndex ?? to.continentId}`,
                    islandGroupId: topology.islandGroupId,
                    islandIds: [from.islandId, to.islandId].filter(Boolean),
                    ...(to.continentId && { shoreContinentId: to.continentId }),
                    widthCells: Math.max(1, section.gap - 1),
                    shoreCellIndices: section.shoreCellIndices,
                    cellIndex: passagePath.find(cell => blocked.has(cell)),
                    restrictedCellIndices: section.restrictedCellIndices,
                    travelCells: lane.waterTravelCells,
                    bypassTravelCells: alternative?.waterTravelCells ?? null,
                    terminalCellIndices: [passagePath[0], passagePath.at(-1)],
                    seaRegionIds: [...new Set([from.seaRegionId,
                        to.seaRegionId || to.seaRegionByShoreCell[section.shoreCellIndices[1]]])],
                    seaEdgeId: lane.sourceGraphEdgeId,
                    hybridEdgeId: lane.edgeId,
                    affectedHybridEdgeIds: [...changes.keys()],
                    routeIds: [...new Set([...changes.keys()].flatMap(id => routesByEdge.get(id)))].sort()
                });
                break;
            }
        }
        return passages;
    }

    function detourFraction(edge, changes) {
        const alternative = changes.get(edge.edgeId).alternative;
        return alternative ? (alternative.waterTravelCells - edge.waterTravelCells) / edge.waterTravelCells : Infinity;
    }

    function collectCorridorOutage(edges, corridorEdgeIds, mask) {
        const terminalNeighborhoods = new Set();
        for (const { waterPathCellIndices: path } of edges) {
            if (!path?.length) continue;
            for (const cell of [path[0], path.at(-1)]) {
                if (terminalNeighborhoods.has(cell)) continue;
                terminalNeighborhoods.add(cell);
            }
        }
        const terminalCells = [...terminalNeighborhoods];
        for (const cell of terminalCells) {
            forEachCardinalNeighbor(cell, mask.width, mask.values.length, neighbor => terminalNeighborhoods.add(neighbor));
        }
        const restrictedCells = new Set();
        const blockedEdgeIds = new Set();
        for (const edge of edges) {
            if (!corridorEdgeIds.has(edge.edgeId)) continue;
            if (!edge.waterPathCellIndices?.length) {
                blockedEdgeIds.add(edge.edgeId);
                continue;
            }
            for (const cell of edge.waterPathCellIndices) {
                if (!terminalNeighborhoods.has(cell)) restrictedCells.add(cell);
            }
        }
        return { restrictedCells, blockedEdgeIds };
    }

    function buildMarineRouteGeometry(routes, graph, routeRecords) {
        if (!routes?.length || !graph?.edges || !graph.nodes) return undefined;
        const published = new Set(routeRecords.map(row => row.routeId));
        const edges = new Map(graph.edges.map(edge => [edge.edgeId, edge]));
        const nodes = new Map(graph.nodes.map(node => [node.nodeId, node]));
        const result = [];
        for (const route of routes) {
            if (!published.has(route.routeId)) continue;
            const legs = [];
            for (const [index, edgeId] of route.edgePathIds.entries()) {
                const edge = edges.get(edgeId);
                if (!edge?.waterPathCellIndices?.length) continue;
                const forward = edge.fromNodeId === route.nodePathIds[index];
                const from = nodes.get(forward ? edge.fromNodeId : edge.toNodeId);
                const to = nodes.get(forward ? edge.toNodeId : edge.fromNodeId);
                legs.push({
                    fromLandCellIndex: from?.anchorCellIndex,
                    toLandCellIndex: to?.anchorCellIndex,
                    waterPathCellIndices: forward ? edge.waterPathCellIndices.slice() : edge.waterPathCellIndices.slice().reverse()
                });
            }
            if (legs.length) result.push({ routeId: route.routeId, legs });
        }
        return result;
    }

    function validateMarineRouteGeometry({ marineRouteGeometry, macroRoutes, worldBounds }) {
        if (marineRouteGeometry === undefined) return [];
        const { width, height } = worldBounds || {};
        if (!Array.isArray(marineRouteGeometry) || !Number.isSafeInteger(width) || width <= 0
            || !Number.isSafeInteger(height) || height <= 0 || !Number.isSafeInteger(width * height)) {
            return ['"marineRouteGeometry" requires rows and a valid macro raster.'];
        }
        const errors = [];
        const knownRoutes = new Set(Array.isArray(macroRoutes) ? macroRoutes.map(row => row?.routeId) : []);
        const seen = new Set();
        const validCell = cell => Number.isSafeInteger(cell) && cell >= 0 && cell < width * height;
        const adjacent = (a, b) => Math.abs(a % width - b % width) + Math.abs(Math.floor(a / width) - Math.floor(b / width)) === 1;
        function validLeg(leg) {
            const { fromLandCellIndex: from, toLandCellIndex: to, waterPathCellIndices: path } = leg || {};
            return validCell(from) && validCell(to) && Array.isArray(path) && path.length > 0
                && path.every((cell, index) => validCell(cell) && cell !== from && cell !== to && (!index || adjacent(path[index - 1], cell)))
                && adjacent(from, path[0]) && adjacent(to, path.at(-1));
        }
        for (const row of marineRouteGeometry) {
            const { routeId, legs } = row || {};
            if (typeof routeId !== 'string' || !knownRoutes.has(routeId) || seen.has(routeId)
                || !Array.isArray(legs) || !legs.length || !legs.every(validLeg)) {
                errors.push(`Invalid marine path geometry for route "${routeId}".`);
            }
            seen.add(routeId);
        }
        return errors;
    }

    Object.assign(macro, { buildMarineAccessEdges, findIslandPassages, measureChangedLanes, collectCorridorOutage,
        buildMarineRouteGeometry, validateMarineRouteGeometry });
})();
