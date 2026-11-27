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

function inspectMarineRouteGeometry(result, macro, land) {
    const geography = result.phase1.macroGeographyPackage;
    const bundle = result.diagnostics.physicalWorldDebugBundle;
    const graph = bundle.graphSnapshots.find(row => row.sourceLayerId === 'hybridConnectivityGraph').payload;
    const routes = bundle.intermediateOutputs.find(row => row.artifactId === 'foundation_geometry_macroRoutes').payload;
    const geometry = geography.marineRouteGeometry;
    assert(geometry?.length > 0 && Object.isFrozen(geometry[0].legs[0].waterPathCellIndices));
    assert.deepEqual(macro.validateMarineRouteGeometry(geography), []);
    const { marineRouteGeometry, ...legacy } = geography;
    assert.deepEqual(macro.validateMarineRouteGeometry(legacy), []);
    const malformed = structuredClone(marineRouteGeometry);
    malformed[0].legs[0].fromLandCellIndex = malformed[0].legs[0].waterPathCellIndices[0];
    assert(!macro.validateMacroGeographyPackage({ ...legacy, marineRouteGeometry: malformed }).isValid);

    const nodes = new Map(graph.nodes.map(node => [node.nodeId, node]));
    const edges = new Map(graph.edges.map(edge => [edge.edgeId, edge]));
    const published = new Map(geometry.map(row => [row.routeId, row.legs]));
    const waterCellsByRoute = new Map();
    for (const { routeId, edgePathIds, nodePathIds } of routes.candidateRoutes) {
        const seaLegs = edgePathIds.map((edgeId, index) => ({ edge: edges.get(edgeId), index }))
            .filter(({ edge }) => edge.waterPathCellIndices?.length);
        assert.equal(published.get(routeId)?.length ?? 0, seaLegs.length, routeId);
        if (!seaLegs.length) continue;
        const water = new Set();
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
            }
        }
        waterCellsByRoute.set(routeId, water);
    }
    // A cell outage affects every registered path using it, independently of route cost.
    const usesByCell = new Map();
    for (const cells of waterCellsByRoute.values()) {
        for (const cell of cells) usesByCell.set(cell, (usesByCell.get(cell) || 0) + 1);
    }
    const partial = [...usesByCell].find(([, count]) => count > 1 && count < waterCellsByRoute.size);
    return { routeCount: geometry.length, ...(partial && {
        sharedWaterCell: partial[0], usesThatCell: partial[1], otherPaths: waterCellsByRoute.size - partial[1]
    }) };
}

module.exports = { verifyPlateContacts, inspectMarineRouteGeometry };
