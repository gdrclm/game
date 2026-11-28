'use strict';

const assert = require('node:assert/strict');

function verifyPlateContacts(macro) {
    const worldBounds = { width: 15, height: 7 };
    const plateSeeds = [2, 7, 12].map((x, index) => ({
        plateId: `p${index + 1}`, plateClass: 'continental', seedPoint: { x, y: 3 }
    }));
    const motion = [1, 0, -1].map((x, index) => ({ plateId: plateSeeds[index].plateId, motionVector: { x, y: 0 } }));
    const input = {
        macroSeed: 42, worldBounds,
        plateSeedDistribution: { worldBounds, plateSeeds },
        plateMotionVectors: { plateMotionVectors: motion }
    };
    const inherited = macro.generatePlateBoundaryClassification(input);
    const shared = macro.generatePlateBoundaryClassification(input, { useSharedFaces: true });
    const pairs = rows => rows.boundaryClassifications.map(boundary => boundary.plateIds);
    assert.deepEqual(pairs(inherited), [['p1', 'p2'], ['p1', 'p3'], ['p2', 'p3']]);
    assert.deepEqual(pairs(shared), [['p1', 'p2'], ['p2', 'p3']]);
    assert(shared.boundaryClassifications.every(row => row.boundaryType === 'collision' && row.futureSignals.upliftPotential > 0));
    const movingApart = macro.generatePlateBoundaryClassification({ ...input,
        plateMotionVectors: { plateMotionVectors: motion.map(row => ({ ...row, motionVector: { x: -row.motionVector.x, y: 0 } })) }
    }, { useSharedFaces: true });
    assert.deepEqual(pairs(movingApart), pairs(shared));
    assert(movingApart.boundaryClassifications.every(row => row.boundaryType === 'divergence' && row.futureSignals.subsidencePotential > 0));
    const reversed = macro.generatePlateBoundaryClassification({ ...input,
        plateSeedDistribution: { worldBounds, plateSeeds: plateSeeds.slice().reverse() }
    }, { useSharedFaces: true });
    assert.deepEqual(reversed, shared);
    return { inheritedPairs: 3, sharedFaces: 2, motionReversesDeformation: true, stableOrder: true };
}

function verifyContactDeformation(macro) {
    const worldBounds = { width: 33, height: 33 };
    const plateSeeds = [6, 16, 26].map((x, index) => ({
        plateId: `p${index + 1}`, plateClass: 'continental', seedPoint: { x, y: 16 }
    }));
    const generate = (normal, shear) => {
        const input = { macroSeed: 42, worldBounds, plateSeedDistribution: { worldBounds, plateSeeds },
            plateMotionVectors: { plateMotionVectors: plateSeeds.map(({ plateId }, index) => ({
                plateId, motionVector: { x: (1 - index) * normal, y: (1 - index) * shear }
            })) } };
        const plateBoundaryClassification = macro.generatePlateBoundaryClassification(input, { useContactCarrier: true });
        const sources = { ...input, plateBoundaryClassification };
        const upliftField = macro.generateUpliftField(sources);
        const subsidenceField = macro.generateSubsidenceField({ ...sources, upliftField });
        const fractureMaskField = macro.generateFractureField({ ...sources, upliftField, subsidenceField });
        const ridge = macro.generateRidgeDirectionField({ ...sources, upliftField, subsidenceField, fractureMaskField });
        return { plateBoundaryClassification, uplift: upliftField.values, subsidence: subsidenceField.values,
            fracture: fractureMaskField.values, ridge };
    };
    const convergence = generate(1, 0);
    const divergence = generate(-1, 0);
    const transform = generate(0, 1);
    const at = (x, y) => y * worldBounds.width + x;
    const observed = convergence.plateBoundaryClassification.boundaryClassifications;
    assert.deepEqual(observed.map(row => row.plateIds), [['p1', 'p2'], ['p2', 'p3']]);
    assert.deepEqual(observed[0].contactCarrier, [{ x: 11, y: -0.5 }, { x: 11, y: 32.5 }]);
    for (const y of [4, 16, 28]) {
        assert(convergence.uplift[at(11, y)] > 0 && convergence.uplift[at(6, y)] === 0);
        assert(divergence.subsidence[at(11, y)] > 0 && divergence.subsidence[at(6, y)] === 0);
        assert(transform.fracture[at(11, y)] > transform.fracture[at(6, y)]);
        assert(convergence.ridge.yValues[at(11, y)] > 0 && convergence.ridge.xValues[at(11, y)] === 0);
    }
    assert(convergence.subsidence.every(value => value === 0));
    assert(divergence.uplift.every(value => value === 0));
    assert(transform.uplift.every(value => value === 0) && transform.subsidence.every(value => value === 0));
    assert.equal(transform.ridge.ridgeLineCount, 0);
    assert.deepEqual(generate(1, 0), convergence);
    return { sharedGeometry: true, normalMotionReversesVerticalDeformation: true,
        shearProducesFractureWithoutVerticalBias: true, ridgeFollowsContactTangent: true };
}

function verifyMarineRouteSurvey(macro) {
    const worldBounds = { width: 4, height: 3 };
    const surface = { ...worldBounds, values: Array(12).fill(-1) };
    surface.values[4] = surface.values[7] = 1;
    const graph = { nodes: [
        { nodeId: 'a', anchorCellIndex: 4, waterCellIndex: 5 },
        { nodeId: 'b', anchorCellIndex: 7, waterCellIndex: 6 }
    ], edges: [{ edgeId: 'sea', edgeType: 'navigable_sea_lane', fromNodeId: 'a', toNodeId: 'b', waterPathCellIndices: [5, 6] },
        { edgeId: 'land', edgeType: 'land_edge', fromNodeId: 'a', toNodeId: 'b' }] };
    const routes = [
        { routeId: 'maritime', nodePathIds: ['b', 'a', 'b'], edgePathIds: ['sea', 'sea'] },
        { routeId: 'inland', nodePathIds: ['a', 'b'], edgePathIds: ['land'] }
    ];
    const macroRoutes = routes.map(({ routeId }) => ({ routeId }));
    const marineRouteGeometry = macro.buildMarineRouteGeometry(routes, graph, macroRoutes);
    const geography = { macroSeed: 17, worldBounds, macroRoutes, marineRouteGeometry };
    const certify = (candidate, terrain = surface) => macro.surveyMarineRouteGeometry(candidate, terrain, routes, graph);
    const marineRouteSurvey = certify(geography);
    assert.deepEqual(marineRouteGeometry[0].legs[0].waterPathCellIndices, [6, 5]);
    assert.equal(marineRouteGeometry.length, 1);
    assert.deepEqual(macro.validateMarineRouteGeometry({ ...geography, marineGeometryVersion: 1, marineRouteSurvey }), []);

    for (const cell of [4, 5]) {
        const tampered = structuredClone(surface);
        tampered.values[cell] *= -1;
        assert.deepEqual(macro.validateMarineRouteGeometry(geography), []);
        assert.throws(() => certify(geography, tampered), /crosses land or ends at a false landfall/);
    }
    const reversed = structuredClone(marineRouteGeometry);
    reversed[0].legs.reverse();
    const omittedLeg = [{ ...marineRouteGeometry[0], legs: marineRouteGeometry[0].legs.slice(0, 1) }];
    const wrongRoute = [{ ...marineRouteGeometry[0], routeId: 'inland' }];
    for (const malformed of [[], reversed, omittedLeg, wrongRoute]) {
        assert.throws(() => certify({ ...geography, marineRouteGeometry: malformed }), /every source graph leg/);
        assert(macro.validateMarineRouteGeometry({ ...geography, marineGeometryVersion: 1,
            marineRouteSurvey, marineRouteGeometry: malformed }).length);
    }
    assert(macro.validateMarineRouteGeometry({ ...geography, marineGeometryVersion: 1 }).length);
    const missingPath = structuredClone(graph);
    delete missingPath.edges[0].waterPathCellIndices;
    assert.throws(() => macro.buildMarineRouteGeometry(routes, missingPath, macroRoutes), /Missing source edge or water path/);
    assert.equal(certify(structuredClone(geography)).checksum, marineRouteSurvey.checksum);
    return { landCrossingBlocked: true, falseLandfallBlocked: true, sourceRowsAndLegsRequired: true,
        reversedAndMisattributedRoutesRejected: true, legacyModeAccepted: true };
}

function inspectMarineRouteGeometry(result, macro, land) {
    const geography = result.phase1.macroGeographyPackage;
    const bundle = result.diagnostics.physicalWorldDebugBundle;
    const graph = bundle.graphSnapshots.find(row => row.sourceLayerId === 'hybridConnectivityGraph').payload;
    const routes = bundle.intermediateOutputs.find(row => row.artifactId === 'foundation_geometry_macroRoutes').payload;
    const geometry = geography.marineRouteGeometry;
    assert(geometry?.length > 0 && Object.isFrozen(geometry[0].legs[0].waterPathCellIndices));
    assert.deepEqual(macro.validateMarineRouteGeometry(geography), []);
    const { marineRouteGeometry, marineRouteSurvey, marineGeometryVersion, ...legacy } = geography;
    assert.deepEqual(macro.validateMarineRouteGeometry(legacy), []);
    const malformed = structuredClone(marineRouteGeometry);
    malformed[0].legs[0].fromLandCellIndex = malformed[0].legs[0].waterPathCellIndices[0];
    assert(!macro.validateMacroGeographyPackage({ ...legacy, marineRouteGeometry: malformed }).isValid);

    const nodes = new Map(graph.nodes.map(node => [node.nodeId, node]));
    const edges = new Map(graph.edges.map(edge => [edge.edgeId, edge]));
    const published = new Map(geometry.map(row => [row.routeId, row.legs]));
    const storm = bundle.fieldSnapshots.find(row => row.payload.fieldId === 'stormCorridorField').payload.values;
    const surveyed = new Map(geography.marineRouteSurvey.weatherByRoute.map(row => [row.routeId, row]));
    const phase2Timing = result.phase2.environmentalRhythmPackage.domains.navigation.blockedIntervalFrequency.perRouteScores;
    const waterCellsByRoute = new Map();
    for (const { routeId, edgePathIds, nodePathIds } of routes.candidateRoutes) {
        const seaLegs = edgePathIds.map((edgeId, index) => ({ edge: edges.get(edgeId), index }))
            .filter(({ edge }) => edge.waterPathCellIndices?.length);
        assert.equal(published.get(routeId)?.length ?? 0, seaLegs.length, routeId);
        if (!seaLegs.length) continue;
        const water = new Set();
        let weatherTotal = 0, visits = 0;
        for (const [legIndex, { edge, index }] of seaLegs.entries()) {
            const { fromLandCellIndex, toLandCellIndex, waterPathCellIndices } = published.get(routeId)[legIndex];
            assert.equal(fromLandCellIndex, nodes.get(nodePathIds[index]).anchorCellIndex);
            assert.equal(toLandCellIndex, nodes.get(nodePathIds[index + 1]).anchorCellIndex);
            assert(land(fromLandCellIndex) && land(toLandCellIndex));
            const oriented = edge.fromNodeId === nodePathIds[index] ? edge.waterPathCellIndices
                : edge.waterPathCellIndices.slice().reverse();
            assert.deepEqual(waterPathCellIndices, oriented);
            for (const cell of waterPathCellIndices) {
                assert(!land(cell));
                water.add(cell);
                weatherTotal += storm[cell];
                visits += 1;
            }
        }
        const weather = surveyed.get(routeId);
        assert.equal(weather.cellVisits, visits);
        assert.equal(weather.stormMean, Math.round((weatherTotal / visits) * 1e6) / 1e6);
        assert.equal(phase2Timing.find(row => row.recordId === routeId).pathTiming.stormMean, weather.stormMean);
        waterCellsByRoute.set(routeId, water);
    }
    // A cell outage affects every registered path using it, independently of route cost.
    const usesByCell = new Map();
    for (const cells of waterCellsByRoute.values()) {
        for (const cell of cells) usesByCell.set(cell, (usesByCell.get(cell) || 0) + 1);
    }
    const partial = [...usesByCell].find(([, count]) => count > 1 && count < waterCellsByRoute.size);
    return { routeCount: geometry.length, stormRange: [Math.min(...[...surveyed.values()].map(row => row.stormMean)),
        Math.max(...[...surveyed.values()].map(row => row.stormMean))], ...(partial && {
        sharedWaterCell: partial[0], usesThatCell: partial[1], otherPaths: waterCellsByRoute.size - partial[1]
    }) };
}

module.exports = { verifyPlateContacts, verifyContactDeformation, verifyMarineRouteSurvey, inspectMarineRouteGeometry };
