'use strict';

const assert = require('node:assert/strict');

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
    return { terminalTypes: ['ocean', 'inland_water', 'local_depression'] };
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
        assert.equal(horizontal + vertical, 1, `Disconnected flow from ${cell}`);
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
    verifySaddleFixture };
