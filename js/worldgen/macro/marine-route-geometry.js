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

    function indexRouteLanes(hybridGraph, routes) {
        const routesByEdge = new Map();
        for (const route of routes.candidateRoutes) {
            for (const edgeId of route.edgePathIds) {
                if (!routesByEdge.has(edgeId)) routesByEdge.set(edgeId, []);
                routesByEdge.get(edgeId).push(route.routeId);
            }
        }
        const activeLanes = hybridGraph.edges.filter(edge => edge.waterPathCellIndices && routesByEdge.has(edge.edgeId));
        return { routesByEdge, activeLanes };
    }

    function findIslandPassages(topology, hybridGraph, routes, mask) {
        if (!topology?.islandGroupId || topology.islands.length < 2) return [];
        const terminals = topology.ports.map(port => port.waterCellIndex);
        const { routesByEdge, activeLanes } = indexRouteLanes(hybridGraph, routes);
        if (!activeLanes.length) return [];
        const apertures = macro.buildIslandPassageSections(topology, mask);
        const passages = [];
        const measuredSections = new Set();
        const measuredApertures = new Set();
        function measure({ from, to, sections }, requireDetourBeyondSection = false) {
            const passageId = `island_passage_${from.peakCellIndex}_${to.peakCellIndex ?? to.continentId}`;
            if (measuredApertures.has(passageId)) return;
            for (const section of sections) {
                const sectionKey = section.restrictedCellIndices.slice().sort((a, b) => a - b).join(',');
                if (measuredSections.has(sectionKey)) continue;
                const blocked = new Set(section.restrictedCellIndices);
                if (terminals.some(cell => !macro.isOpenWaterTerminal(mask, cell, blocked))) continue;
                const changes = measureChangedLanes(mask, activeLanes, blocked);
                const detours = activeLanes.filter(edge => {
                    const change = changes.get(edge.edgeId);
                    // A section outside the surveyed throat must impose more
                    // than the local cost of going around its own footprint.
                    const minimumDetour = requireDetourBeyondSection ? section.restrictedCellIndices.length : 0;
                    return change?.endpointsAccessible
                        && (!change.alternative || change.alternative.waterTravelCells - edge.waterTravelCells > minimumDetour);
                }).sort((a, b) => detourFraction(b, changes) - detourFraction(a, changes) || a.edgeId.localeCompare(b.edgeId));
                if (!detours.length) continue;
                measuredSections.add(sectionKey);
                measuredApertures.add(passageId);
                const lane = detours[0];
                const passagePath = lane.waterPathCellIndices;
                const alternative = changes.get(lane.edgeId).alternative;
                passages.push({
                    passageId,
                    ...(requireDetourBeyondSection && { surveyMode: 'active_route_transect' }),
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
                return;
            }
        }
        apertures.forEach(aperture => measure(aperture));
        const activePathCells = new Set(activeLanes.flatMap(edge => edge.waterPathCellIndices));
        for (const aperture of macro.buildIslandPassageSections(topology, mask, activePathCells)) measure(aperture, true);
        return passages;
    }

    function detourFraction(edge, changes) {
        const alternative = changes.get(edge.edgeId).alternative;
        return alternative ? (alternative.waterTravelCells - edge.waterTravelCells) / edge.waterTravelCells : Infinity;
    }

    function findCoastalInletPassages(topology, continentBodies, hybridGraph, routes, mask) {
        if (!topology || !mask) return [];
        const { routesByEdge, activeLanes } = indexRouteLanes(hybridGraph, routes);
        if (!activeLanes.length) return [];
        const activePathCells = new Set(activeLanes.flatMap(edge => edge.waterPathCellIndices));
        const ports = new Map(topology.ports.map(port => [port.waterCellIndex, port]));
        const terminals = [...ports.keys()];
        const sections = macro.buildCoastalInletSections(continentBodies, mask, activePathCells);
        const passages = [];
        const measuredLosses = new Set();
        for (const section of sections) {
            const blocked = new Set(section.restrictedCellIndices);
            if (terminals.some(cell => !macro.isOpenWaterTerminal(mask, cell, blocked))) continue;
            const changes = measureChangedLanes(mask, activeLanes, blocked);
            const disconnected = activeLanes.filter(edge => changes.has(edge.edgeId) && !changes.get(edge.edgeId).alternative);
            const lane = disconnected.find(({ waterPathCellIndices: path }) => [path[0], path.at(-1)]
                .some(cell => ports.get(cell)?.continentId === section.continentId));
            if (!lane) continue;
            // Successive cuts across the same mouth can separate the same terminal pairs.
            const lossKey = disconnected.map(edge => edge.edgeId).sort().join(',');
            if (measuredLosses.has(lossKey)) continue;
            measuredLosses.add(lossKey);
            const path = lane.waterPathCellIndices;
            const terminalCellIndices = [path[0], path.at(-1)];
            passages.push({
                passageId: `coastal_inlet_${section.shoreCellIndices.join('_')}`,
                shoreContinentId: section.continentId,
                widthCells: Math.max(1, section.gap - 1),
                shoreCellIndices: section.shoreCellIndices,
                cellIndex: path.find(cell => blocked.has(cell)),
                restrictedCellIndices: section.restrictedCellIndices,
                travelCells: lane.waterTravelCells,
                bypassTravelCells: null,
                terminalCellIndices,
                seaRegionIds: [...new Set(terminalCellIndices.map(cell => ports.get(cell)?.seaRegionId).filter(Boolean))],
                seaEdgeId: lane.sourceGraphEdgeId,
                hybridEdgeId: lane.edgeId,
                affectedHybridEdgeIds: disconnected.map(edge => edge.edgeId),
                routeIds: [...new Set(disconnected.flatMap(edge => routesByEdge.get(edge.edgeId)))].sort()
            });
        }
        return passages;
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
        if (!Array.isArray(routes) || !graph?.edges || !graph.nodes) return undefined;
        const published = new Set(routeRecords.map(row => row.routeId));
        const edges = new Map(graph.edges.map(edge => [edge.edgeId, edge]));
        const nodes = new Map(graph.nodes.map(node => [node.nodeId, node]));
        const result = [];
        for (const route of routes) {
            if (!published.has(route.routeId)) continue;
            published.delete(route.routeId);
            const legs = [];
            for (const [index, edgeId] of route.edgePathIds.entries()) {
                const edge = edges.get(edgeId);
                if (!edge || (edge.edgeType === 'navigable_sea_lane' && !edge.waterPathCellIndices?.length)) {
                    throw new Error(`[worldgen/macro] Missing source edge or water path for ${route.routeId}/${edgeId}.`);
                }
                if (!edge.waterPathCellIndices?.length) continue;
                const forward = edge.fromNodeId === route.nodePathIds[index];
                const from = nodes.get(forward ? edge.fromNodeId : edge.toNodeId);
                const to = nodes.get(forward ? edge.toNodeId : edge.fromNodeId);
                const water = edge.waterPathCellIndices;
                if (from?.nodeId !== route.nodePathIds[index] || to?.nodeId !== route.nodePathIds[index + 1]
                    || from?.waterCellIndex !== (forward ? water[0] : water.at(-1))
                    || to?.waterCellIndex !== (forward ? water.at(-1) : water[0])) {
                    throw new Error(`[worldgen/macro] Source water path has inconsistent terminals for ${route.routeId}/${edgeId}.`);
                }
                legs.push({
                    fromLandCellIndex: from.anchorCellIndex,
                    toLandCellIndex: to.anchorCellIndex,
                    waterPathCellIndices: forward ? water.slice() : water.slice().reverse()
                });
            }
            if (legs.length) result.push({ routeId: route.routeId, legs });
        }
        if (published.size) throw new Error('[worldgen/macro] A published macro route has no source graph route.');
        return result;
    }

    function routeSurveyChecksum({ macroSeed, macroRoutes, marineRouteGeometry, worldBounds, marineRouteSurvey }) {
        const payload = JSON.stringify([macroSeed, worldBounds.width, worldBounds.height,
            macroRoutes.map(row => [row.routeId, row.type, row.fromRegion, row.toRegion]),
            marineRouteGeometry.map(row => [row.routeId, row.legs.map(leg => [
                leg.fromLandCellIndex, leg.toLandCellIndex, leg.waterPathCellIndices
            ])]), marineRouteSurvey?.weatherByRoute?.map(row => [row.routeId, row.cellVisits, row.stormMean,
                row.referenceStormMean, row.seasonalityMean])]);
        let checksum = 2166136261;
        for (let index = 0; index < payload.length; index += 1) {
            checksum = Math.imul(checksum ^ payload.charCodeAt(index), 16777619) >>> 0;
        }
        return checksum;
    }

    function measureMarinePathWeather(geometry, signed, { storm, seasonality, seaClusters }) {
        if (![storm, seasonality].every(values => values?.length === signed.length)) {
            throw new Error('[worldgen/macro] Marine weather requires aligned storm and seasonality rasters.');
        }
        const regionOfCell = new Int32Array(signed.length).fill(-1);
        const wholeWater = { sum: 0, count: 0 };
        const regional = seaClusters.map(({ cellIndices }, index) => {
            const row = { sum: 0, count: 0 };
            for (const cell of cellIndices) {
                if (signed[cell] > 0) continue;
                regionOfCell[cell] = index;
                row.count += 1;
                row.sum += storm[cell];
            }
            return row;
        });
        for (let cell = 0; cell < signed.length; cell += 1) {
            if (signed[cell] > 0) continue;
            wholeWater.count += 1;
            wholeWater.sum += storm[cell];
        }
        const round = value => Math.round(value * 1e6) / 1e6;
        return geometry.map(({ routeId, legs }) => {
            let cellVisits = 0, stormSum = 0, referenceStormSum = 0, seasonalitySum = 0;
            for (const { waterPathCellIndices } of legs) {
                for (const cell of waterPathCellIndices) {
                    const reference = regional[regionOfCell[cell]] || wholeWater;
                    cellVisits += 1;
                    stormSum += storm[cell];
                    referenceStormSum += reference.sum / reference.count;
                    seasonalitySum += seasonality[cell];
                }
            }
            return { routeId, cellVisits, stormMean: round(stormSum / cellVisits),
                referenceStormMean: round(referenceStormSum / cellVisits), seasonalityMean: round(seasonalitySum / cellVisits) };
        });
    }

    function surveyMarineRouteGeometry(geography, surface, routes, graph, weather) {
        const errors = validateMarineRouteGeometry(geography);
        const { marineRouteGeometry, worldBounds } = geography;
        if (!Array.isArray(marineRouteGeometry)) errors.push('Marine survey requires the published geometry.');
        const size = worldBounds?.width * worldBounds?.height;
        if (!surface || surface.width !== worldBounds?.width || surface.height !== worldBounds?.height || surface.values?.length !== size) {
            errors.push('Marine survey requires the authoritative signed macro surface.');
        }
        if (!errors.length) {
            const expected = buildMarineRouteGeometry(routes, graph, geography.macroRoutes);
            if (JSON.stringify(expected) !== JSON.stringify(marineRouteGeometry)) {
                errors.push('Marine geometry must include every source graph leg in route order.');
            }
            for (const { routeId, legs } of marineRouteGeometry) {
                if (legs.some(({ fromLandCellIndex, toLandCellIndex, waterPathCellIndices }) =>
                    ![fromLandCellIndex, toLandCellIndex].every(cell => Number.isFinite(surface.values[cell]) && surface.values[cell] > 0)
                    || !waterPathCellIndices.every(cell => Number.isFinite(surface.values[cell]) && surface.values[cell] <= 0))) {
                    errors.push(`Marine route "${routeId}" crosses land or ends at a false landfall.`);
                }
            }
        }
        if (errors.length) throw new Error(`[worldgen/macro] ${errors.join(' ')}`);
        const marineRouteSurvey = { version: 1, landWaterSource: 'finalRelativeElevationField',
            ...(weather && { weatherByRoute: measureMarinePathWeather(marineRouteGeometry, surface.values, weather) }) };
        return { ...marineRouteSurvey, checksum: routeSurveyChecksum({ ...geography, marineRouteSurvey }) };
    }

    function validateMarineRouteGeometry(geography) {
        const { marineRouteGeometry, marineRouteSurvey, marineGeometryVersion, macroRoutes, worldBounds } = geography;
        if (marineGeometryVersion !== undefined && (marineGeometryVersion !== 1 || marineRouteSurvey === undefined)) {
            return ['A current marine geometry format requires its matching survey.'];
        }
        if (marineRouteSurvey !== undefined && marineGeometryVersion !== 1) return ['Marine route survey has no matching format version.'];
        if (marineRouteGeometry === undefined && marineRouteSurvey === undefined) return [];
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
        const weather = marineRouteSurvey?.weatherByRoute;
        if (weather !== undefined && (!Array.isArray(weather) || weather.length !== marineRouteGeometry.length
            || weather.some((row, index) => !row || row.routeId !== marineRouteGeometry[index]?.routeId
                || !Array.isArray(marineRouteGeometry[index]?.legs)
                || row.cellVisits !== marineRouteGeometry[index].legs.reduce((sum, leg) => sum + (leg?.waterPathCellIndices?.length || 0), 0)
                || ![row.stormMean, row.referenceStormMean, row.seasonalityMean].every(value => Number.isFinite(value) && value >= 0 && value <= 1)))) {
            errors.push('Marine weather survey must cover all published water legs.');
        }
        if (marineRouteSurvey !== undefined && (marineRouteSurvey?.version !== 1
            || marineRouteSurvey.landWaterSource !== 'finalRelativeElevationField' || !Array.isArray(macroRoutes)
            || macroRoutes.some(row => !row || typeof row.routeId !== 'string')
            || (!errors.length && marineRouteSurvey.checksum !== routeSurveyChecksum(geography)))) {
            errors.push('Marine route survey does not match the published route geometry and endpoints.');
        }
        return errors;
    }

    Object.assign(macro, { buildMarineAccessEdges, findIslandPassages, findCoastalInletPassages, measureChangedLanes, collectCorridorOutage,
        buildMarineRouteGeometry, surveyMarineRouteGeometry, validateMarineRouteGeometry });
})();
