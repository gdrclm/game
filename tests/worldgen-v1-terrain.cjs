'use strict';

const assert = require('node:assert/strict');

function verifySeaBoundaryFixture(macro) {
    const width = 7;
    const height = 5;
    const values = new Array(width * height).fill(1);
    for (const cell of [0, 1, 6, 13, 20, 19, 16]) values[cell] = 0;
    const input = { worldBounds: { width, height },
        fields: { landmassCleanupMaskField: { fieldId: 'landmassCleanupMaskField', width, height, values } } };
    const flood = macro.generateOceanBasinFloodFill(input);
    const clusters = macro.generateSeaRegionClusters(input);
    assert.deepEqual(clusters.boundaryOnlyWater.map(row => row.cellIndices), [[0, 1]]);
    assert.equal(flood.waterBasins.length, 3);
    assert.deepEqual(clusters.seaRegionClusters.map(row => row.recordDraft.seaRegionId), ['sea_02', 'sea_03']);
    assert(clusters.seaRegionClusters.some(row => row.basinKind === 'enclosed_water' && row.cellIndices.includes(16)));
    assert(clusters.seaRegionClusters.some(row => row.basinKind === 'open_ocean' && row.cellIndices.includes(19)));
    return { boundaryWaterRetainedInFloodFill: true, observedInteriorRequiredForOpenSea: true,
        enclosedWaterUnaffected: true };
}

function verifyInlandChokepointFixture(macro) {
    const a = { regionalSegmentId: 'segment_a', continentId: 'continent_a', cellIndices: [1, 2, 3] };
    const b = { regionalSegmentId: 'segment_b', continentId: 'continent_a', cellIndices: [4, 5, 6] };
    const from = { nodeId: 'node_a', nodeType: 'inland_region', sourceRegionalSegmentId: a.regionalSegmentId };
    const to = { nodeId: 'node_b', nodeType: 'inland_region', sourceRegionalSegmentId: b.regionalSegmentId };
    const edge = { edgeId: 'edge_a', edgeType: 'interregional_link', fromNodeId: from.nodeId, toNodeId: to.nodeId,
        continentId: 'continent_a' };
    const build = reliefRegionBodies => macro.analyzeChokepoints({ intermediateOutputs: {
        regionalSegmentationAnalysis: { regionalSegments: [a, b] },
        reliefRegionExtraction: { reliefRegionBodies },
        landConnectivityGraph: { nodes: [from, to], edges: [edge] }
    } }).outputs.intermediateOutputs.chokepointRecords;
    const reliefA = { reliefRegionId: 'relief_a', cellIndices: [1, 2] };
    const reliefB = { reliefRegionId: 'relief_b', cellIndices: [3, 5, 6] };
    const output = build([reliefA, reliefB]);
    assert.deepEqual(output.chokepoints[0].adjacentRegions, ['relief_a', 'relief_b']);
    assert.deepEqual(output.recordLinks[0].sourceRegionalSegmentIds, ['segment_a', 'segment_b']);
    assert.deepEqual(build([reliefA]).chokepoints[0].adjacentRegions, ['relief_a', 'continent_a']);
    return { adjacentRecordsFollowActualReliefOverlap: true, internalSegmentProvenanceRetained: true };
}

function verifyFinalTerrainFixture(macro) {
    const width = 5;
    const height = 1;
    const field = (fieldId, values) => ({ fieldId, width, height, threshold: 0.5, values });
    const source = {
        fieldId: 'seaLevelAppliedElevationField',
        relativeElevationValues: [0.18, 0.08, 0.03, -0.02, -0.08]
    };
    const cleaned = field('landmassCleanupMaskField', [1, 1, 0, 1, 0]);
    const final = field('coastJaggednessControlledLandWaterMaskField', [1, 0, 0, 1, 0]);
    const input = { reliefElevation: { outputs: { fields: {
        seaLevelAppliedElevationField: source,
        landmassCleanupMaskField: cleaned
    } } } };
    const result = macro.buildFinalTerrain(input, final);
    assert.deepEqual(result.finalSurfaceOriginField.values, [0, 3, 1, 2, 0]);
    assert.deepEqual(result.finalRelativeElevationField.values, [0.18, -0.000001, -0.000001, 0.000001, -0.08]);
    assert.deepEqual(source.relativeElevationValues, [0.18, 0.08, 0.03, -0.02, -0.08]);
    const reconnected = macro.buildFinalTerrain(input, field(final.fieldId, [1, 0, 0, 0, 0]));
    assert.deepEqual(reconnected.finalRelativeElevationField.values, [0.18, -0.006667, -0.01, -0.02, -0.08]);
    return { assignments: result.finalSurfaceOriginField.valueEncoding, alteredBedFollowsAvailableWater: true };
}

function verifyFinalDrainageFixture(macro) {
    const surface = { fieldId: 'bed', width: 4, height: 1, values: [-0.8, 0.2, 0.12, -0.02] };
    const seafloor = { fieldId: 'water', valueEncoding: ['ocean', 'inland_water'], values: [1, 0, 0, 0] };
    const mixed = macro.buildFinalDrainage(surface, seafloor, [0, 0.3, 0.5, 0]);
    assert.deepEqual(mixed.downstreamCellIndices, [-1, 0, 3, -1]);
    assert.deepEqual(Object.fromEntries(mixed.outlets.map(row => [row.outletCellIndex, row.receiver])),
        { 1: 'inland_water', 2: 'ocean' });
    const closed = macro.buildFinalDrainage({ ...surface, values: [0.4, 0.2, 0.12, 0.3] }, seafloor);
    assert.deepEqual(closed.downstreamCellIndices, [1, 2, -1, 2]);
    assert.deepEqual(closed.outlets.map(row => [row.receiver, row.contributingCells]), [['local_depression', 4]]);
    const diagonal = values => macro.routeSurfaceDrainage({ signed: values, width: 2, receiverAt: () => 'ocean' });
    assert.equal(diagonal([0.3, 0.28, 0.27, 0.05]).downstreamCellIndices[0], 3);
    assert.equal(diagonal([0.3, 0.35, 0.4, 0.05]).downstreamCellIndices[0], -1);
    assert.notEqual(diagonal([0.3, -0.1, -0.1, 0.05]).downstreamCellIndices[0], 3);
    return { terminalTypes: ['ocean', 'inland_water', 'local_depression'], diagonalRequiresContinuousDescent: true };
}

function verifySaddleFixture(macro) {
    const width = 13;
    const cell = 6 * width + 6;
    const field = values => ({ fieldId: 'coast', width, height: width, values, threshold: 0.5 });
    function terrain(shape) {
        const source = Array.from({ length: width * width }, (_, index) =>
            0.2 + shape(index % width - 6, Math.floor(index / width) - 6));
        const mask = field(source.map(value => Number(value > 0)));
        return macro.buildFinalTerrain({ reliefElevation: { outputs: { fields: {
            seaLevelAppliedElevationField: { fieldId: 'elevation', relativeElevationValues: source },
            landmassCleanupMaskField: mask
        } } } }, mask).macroLandformField;
    }
    const classifyCenter = shape => {
        const raster = terrain(shape);
        return raster.valueEncoding[raster.values[cell]];
    };
    assert.equal(classifyCenter((x, y) => 0.005 * (y * y - x * x)), 'saddle');
    assert.notEqual(classifyCenter((x, y) => 0.005 * (y * y + x * x)), 'saddle');
    return { saddleRequiresOppositeSlopes: true };
}

function inspectDrainage(bundle, elevation, width) {
    const { payload: drainage } = bundle.intermediateOutputs.find(row => row.artifactId === 'foundation_geometry_finalDrainage');
    const outlets = new Map(drainage.outlets.map(row => [row.outletCellIndex, row]));
    const members = new Map();
    for (const [cell, value] of elevation.entries()) {
        const next = drainage.downstreamCellIndices[cell];
        const root = drainage.terminalLandCellIndices[cell];
        if (value < 0) {
            assert.equal(next, -1);
            assert.equal(root, -1);
            continue;
        }
        assert(outlets.has(root));
        members.set(root, (members.get(root) || 0) + 1);
        if (next < 0 || elevation[next] < 0) assert.equal(cell, root);
        if (next < 0) continue;
        const horizontal = Math.abs(next % width - cell % width);
        const vertical = Math.abs(Math.floor(next / width) - Math.floor(cell / width));
        assert(horizontal <= 1 && vertical <= 1 && horizontal + vertical, `Disconnected flow from ${cell}`);
        if (horizontal && vertical) {
            const sideX = Math.max(0, elevation[Math.floor(cell / width) * width + next % width]);
            const sideY = Math.max(0, elevation[Math.floor(next / width) * width + cell % width]);
            assert(elevation[next] > 0 && (sideX > 0 || sideY > 0));
            assert(sideX + sideY <= 2 * value && sideX + sideY >= 2 * elevation[next]);
        }
        assert(elevation[next] < value, `Uphill flow from ${cell}`);
        if (elevation[next] > 0) assert.equal(drainage.terminalLandCellIndices[next], root);
    }
    for (const [cell, row] of outlets) assert.equal(row.contributingCells, members.get(cell));
    return drainage.summary;
}

function inspectFinalTerrain(result) {
    const bundle = result.diagnostics.physicalWorldDebugBundle;
    const field = id => bundle.fieldSnapshots.find(row => row.artifactId === `foundation_field_${id}`).payload;
    const before = field('preMarineRelativeElevationField').values;
    const final = field('finalRelativeElevationField').values;
    const mask = field('coastJaggednessControlledLandWaterMaskField');
    const origin = field('finalSurfaceOriginField');
    const landform = field('macroLandformField');
    const seafloor = field('macroSeafloorFormField');
    const uplift = field('offshoreHotspotUpliftField').values;
    const countCodes = artifact => Object.fromEntries(artifact.valueEncoding.map(key => [key, 0]));
    const landForms = countCodes(landform);
    const seaForms = countCodes(seafloor);
    const origins = countCodes(origin);
    let deepest = 0;
    let highest = 0;
    let hotspotSupportCells = 0;
    for (const [cell, value] of final.entries()) {
        const isLand = mask.values[cell] >= mask.threshold;
        assert(Number.isFinite(value) && Math.abs(value) <= 1 && value !== 0, `Invalid elevation at ${cell}`);
        assert.equal(value > 0, isLand, `Elevation sign conflicts with land mask at ${cell}`);
        const source = origin.values[cell];
        if (source === 0) assert.equal(value, isLand ? before[cell] : Math.min(-0.000001, before[cell]));
        else assert.notEqual(value > 0, before[cell] > 0, `Unnecessary surface change at ${cell}`);
        const landClass = landform.valueEncoding[landform.values[cell]];
        const seaClass = seafloor.valueEncoding[seafloor.values[cell]];
        assert.equal(landClass === 'water', !isLand);
        assert.equal(seaClass === 'land', isLand);
        if (seaClass === 'volcanic_flank') assert(uplift[cell] > 0.006);
        if (uplift[cell] > 0) hotspotSupportCells += 1;
        origins[origin.valueEncoding[source]] += 1;
        landForms[landClass] += 1;
        seaForms[seaClass] += 1;
        deepest = Math.min(deepest, value);
        highest = Math.max(highest, value);
    }
    return { deepest, highest, origins, landForms, seaForms, hotspotSupportCells,
        drainage: inspectDrainage(bundle, final, mask.width) };
}

function inspectClimateAndPressure(result) {
    const bundle = result.diagnostics.physicalWorldDebugBundle;
    const mask = bundle.fieldSnapshots.find(row => row.artifactId === 'foundation_field_coastJaggednessControlledLandWaterMaskField').payload;
    const climate = bundle.intermediateOutputs.find(row => row.artifactId === 'foundation_geometry_climateZoneClassification').payload;
    const tags = ['temperatureColdLoadField', 'wetnessField', 'stormCorridorField', 'seasonalityField'];
    const range = values => {
        const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
        if (!sorted.length) return null;
        return [0.05, 0.5, 0.95].map(p => sorted[Math.floor((sorted.length - 1) * p)]);
    };
    const landClimate = Object.fromEntries(tags.map(id => {
        const values = bundle.fieldSnapshots.find(row => row.payload.fieldId === id).payload.values;
        return [id, range(values.filter((_, cell) => mask.values[cell] >= mask.threshold))];
    }));
    const climateCellsByType = {};
    for (const zone of climate.zoneSummaries) {
        const cells = zone.cellIndices.filter(cell => mask.values[cell] >= mask.threshold).length;
        climateCellsByType[zone.bandType] = (climateCellsByType[zone.bandType] || 0) + cells;
    }
    const tempo = result.phase2.environmentalRhythmPackage.domains.recovery.recoveryTempo.perReliefScores;
    const pressure = result.phase2.pressureFieldPackage.regionalProfiles.filter(row => row.recordType === 'reliefRegions');
    return {
        quantiles: [0.05, 0.5, 0.95],
        landClimate,
        climateCellsByType,
        localRecoveryTempo: range(tempo.map(row => row.value)),
        localSurvivabilityPressure: range(pressure.map(row => row.synthesizedSnapshot.survivabilityPressure))
    };
}

module.exports = { inspectClimateAndPressure, inspectFinalTerrain, verifyFinalTerrainFixture, verifyFinalDrainageFixture,
    verifySaddleFixture, verifySeaBoundaryFixture, verifyInlandChokepointFixture };
