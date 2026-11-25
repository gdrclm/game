'use strict';

const assert = require('node:assert/strict');

function verifySpatialAggregation(phase2) {
    const pressure = (rows, coverage) => phase2.landWeightedPressure({ perReliefScores: rows }, {
        reliefRegions: Object.fromEntries(coverage.map(([id, cells]) => [id, { landCellCount: cells }]))
    });
    const baseline = pressure([{ recordId: 'large', value: 0.75 }, { recordId: 'small', value: 0.25 }],
        [['large', 24], ['small', 8]]);
    const split = pressure([
        { recordId: 'largeOne', value: 0.75 }, { recordId: 'largeTwo', value: 0.75 }, { recordId: 'small', value: 0.25 }
    ], [['largeOne', 12], ['largeTwo', 12], ['small', 8]]);
    assert.deepEqual(baseline, { value: 0.625, landCells: 32 });
    assert.deepEqual(split, baseline);
    assert.equal(phase2.meanCarrierScore({ wet: 0.8 }, {}, ['wet']), undefined);
    assert.equal(phase2.meanCarrierScore({ wet: 0.8 }, { wet: 1 }, [], 2), 0.4);

    const field = (first, second) => ({
        perReliefScores: [
            { recordId: 'a', value: first, supportContextSnapshot: { landCellCount: 24 } },
            { recordId: 'b', value: second, supportContextSnapshot: { landCellCount: 8 } }
        ]
    });
    const synthesis = phase2.createEnvironmentalRhythmSynthesis();
    const habitat = field(0.8, 0.2);
    const recoveryAt = (first, second) => synthesis.run({ rhythmDomainLayers: { recovery: {
        recoveryTempo: habitat, reliefPersistence: habitat, environmentalForgiveness: habitat,
        stabilizationInterval: field(first, second)
    } } }).synthesized.recoveryProfile.summary;
    const delayedLarge = recoveryAt(1, 0);
    const delayedSmall = recoveryAt(0, 1);
    assert.equal(delayedLarge.stabilizationDelay, delayedSmall.stabilizationDelay);
    assert.equal(delayedLarge.mean, 0.3);
    assert.equal(delayedSmall.mean, 0.45);
    assert.equal(delayedLarge.landMean, 0.35);
    assert.equal(delayedSmall.landMean, 0.625);
    return { splitPreservesAreaMean: baseline.value, localRecovery: [delayedLarge.mean, delayedSmall.mean] };
}

function verifyLocalRecovery(phase2, canonical) {
    const { macroGeographyPackage: geography, macroGeographyHandoffPackage } = canonical.phase1;
    const { pressureSeed, rhythmSeed } = canonical.phase0.outputs.phase0Bundle.worldSubSeedMap;
    const engine = phase2.createPhase2Engine();
    const paired = (collection, idField, id, field, values) => values.map(value => engine.run({
        macroGeographyPackage: {
            ...geography,
            [collection]: geography[collection].map(row => row[idField] === id ? { ...row, [field]: value } : row)
        },
        macroGeographyHandoffPackage, pressureSeed, rhythmSeed
    }).output);
    const score = (output, reliefId) => output.environmentalRhythmPackage.domains.recovery
        .recoveryTempo.perReliefScores.find(row => row.recordId === reliefId);
    const ecology = (output, reliefId) => output.pressureFieldPackage.domains.ecology
        .ecologicalFragility.perReliefScores.find(row => row.recordId === reliefId);

    const zone = geography.isolatedZones.find(row => row.reliefRegionIds?.length && row.continentIds?.length);
    assert(zone, 'Expected a generated local isolation zone on a continent');
    const localId = zone.reliefRegionIds[0];
    const sameContinent = geography.reliefRegions.find(region => !zone.reliefRegionIds.includes(region.reliefRegionId)
        && region.continentIds.some(continentId => zone.continentIds.includes(continentId)));
    assert(sameContinent, 'Expected an independent relief region on the same continent');
    const [connected, delayed] = paired('isolatedZones', 'zoneId', zone.zoneId, 'resupplyDifficulty', [0.05, 0.95]);
    const drag = output => score(output, localId).supportContextSnapshot.stabilizationDrag;
    assert(drag(connected) < drag(delayed));
    assert(ecology(connected, localId).value < ecology(delayed, localId).value);
    assert.deepEqual(score(connected, sameContinent.reliefRegionId), score(delayed, sameContinent.reliefRegionId));
    assert.deepEqual(ecology(connected, sameContinent.reliefRegionId), ecology(delayed, sameContinent.reliefRegionId));

    const route = canonical.phase2.pressureFieldPackage.domains.travel.travelExposure.perRouteScores
        .find(row => row.reliefRegionIds?.length && row.reliefRegionIds.length < geography.reliefRegions.length);
    assert(route, 'Expected a generated route with a limited relief footprint');
    const routeRelief = route.reliefRegionIds[0];
    const independent = geography.reliefRegions.find(region => !route.reliefRegionIds.includes(region.reliefRegionId));
    const [fragile, alternate] = paired('macroRoutes', 'routeId', route.recordId, 'redundancy', [0.05, 0.95]);
    const mobility = output => score(output, routeRelief).supportContextSnapshot.mobilityReentrySupport;
    assert(mobility(fragile) < mobility(alternate));
    assert.deepEqual(score(fragile, independent.reliefRegionId), score(alternate, independent.reliefRegionId));
    assert.deepEqual(fragile.pressureFieldPackage.domains.hydrology, alternate.pressureFieldPackage.domains.hydrology);

    const [passable, rugged] = paired('reliefRegions', 'reliefRegionId', routeRelief, 'ruggednessBias', [0.15, 0.85]);
    assert(score(passable, routeRelief).value > score(rugged, routeRelief).value);
    assert.deepEqual(passable.pressureFieldPackage.domains.hydrology, rugged.pressureFieldPackage.domains.hydrology);

    return {
        isolation: { zoneId: zone.zoneId, localId, unchangedPeer: sameContinent.reliefRegionId, stabilizationDrag: [drag(connected), drag(delayed)] },
        transport: { routeId: route.recordId, reliefId: routeRelief, mobilitySupport: [mobility(fragile), mobility(alternate)] },
        terrain: { reliefId: routeRelief, recoveryTempo: [score(passable, routeRelief).value, score(rugged, routeRelief).value] }
    };
}

module.exports = { verifySpatialAggregation, verifyLocalRecovery };
