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
    assert.equal(delayedLarge.stabilizationDelay, 0.75);
    assert.equal(delayedSmall.stabilizationDelay, 0.25);
    assert.equal(delayedLarge.mean, 0.35);
    assert.equal(delayedSmall.mean, 0.625);
    assert.equal(delayedLarge.regionMean, 0.3);
    assert.equal(delayedSmall.regionMean, 0.45);

    const splitField = ({ perReliefScores: [first, second] }) => ({ perReliefScores: [
        ...['a1', 'a2'].map(recordId => ({ ...first, recordId, supportContextSnapshot: { landCellCount: 12 } })),
        second
    ] });
    const splitHabitat = splitField(habitat);
    const splitRecovery = synthesis.run({ rhythmDomainLayers: { recovery: {
        recoveryTempo: splitHabitat, reliefPersistence: splitHabitat, environmentalForgiveness: splitHabitat,
        stabilizationInterval: splitField(field(1, 0))
    } } }).synthesized.recoveryProfile.summary;
    assert.equal(splitRecovery.mean, delayedLarge.mean);
    assert.notEqual(splitRecovery.regionMean, delayedLarge.regionMean);
    return { splitPreservesPressure: baseline.value, splitPreservesRecovery: splitRecovery.mean,
        recoveryByDelayLocation: [delayedLarge.mean, delayedSmall.mean] };
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

    const climateBandId = score({ environmentalRhythmPackage: canonical.phase2.environmentalRhythmPackage }, localId)
        .supportContextSnapshot.climateBandIds[0];
    assert(climateBandId);
    const [cold, temperate] = paired('climateBands', 'climateBandId', climateBandId, 'temperatureBias', [0.01, 0.5]);
    const coldContext = score(cold, localId).supportContextSnapshot;
    const temperateContext = score(temperate, localId).supportContextSnapshot;
    assert(coldContext.supportWindow < temperateContext.supportWindow);
    assert.deepEqual(coldContext.localWater, temperateContext.localWater);

    const localOnly = output => output.environmentalRhythmPackage.domains.recovery.recoveryTempo.perReliefScores
        .filter(row => !row.supportContextSnapshot.routeIds.length);
    const undriven = localOnly(canonical.phase2);
    assert(undriven.length, 'Expected recovery regions without a sampled macro route');
    assert(undriven.every(row => row.supportContextSnapshot.mobilityRelief === 0));

    return {
        isolation: { zoneId: zone.zoneId, localId, unchangedPeer: sameContinent.reliefRegionId, stabilizationDrag: [drag(connected), drag(delayed)] },
        transport: { routeId: route.recordId, reliefId: routeRelief, mobilitySupport: [mobility(fragile), mobility(alternate)],
            regionsWithoutRouteBonus: undriven.map(row => row.recordId) },
        terrain: { reliefId: routeRelief, recoveryTempo: [score(passable, routeRelief).value, score(rugged, routeRelief).value] },
        climate: { climateBandId, supportWindow: [coldContext.supportWindow, temperateContext.supportWindow] }
    };
}

function verifySeasonalRecovery(phase2, canonical) {
    const { pressureSeed, rhythmSeed } = canonical.phase0.outputs.phase0Bundle.worldSubSeedMap;
    const { output } = phase2.createPhase2Engine().run({ ...canonical.phase1, pressureSeed, rhythmSeed });
    const { phase2InputBundle, phase2RecordBindingLayer, pressureFieldPackage, environmentalRhythmPackage } = output;
    const { rootSupport } = phase2InputBundle;
    const synthesis = phase2.createRecoveryReliefSynthesis({ deterministicSeed: rhythmSeed });
    const run = (support, domainLayers = pressureFieldPackage.domains) => synthesis.run({
        inputBundle: { ...phase2InputBundle, rootSupport: support },
        phase2RecordBindingLayer,
        pressureSynthesisOutput: { domainLayers }
    }).domain;
    const reference = run(rootSupport);
    assert.deepEqual(reference, environmentalRhythmPackage.domains.recovery);
    const target = reference.environmentalForgiveness.perReliefScores
        .find(row => row.supportContextSnapshot.localWater?.repeatedRunoffSupport > 0
            && rootSupport.reliefWaterAccess[row.recordId].reachableCellCount > 0);
    assert(target, 'Control must have a refuge supported by measured seasonal inflow');
    const id = target.recordId;
    const measure = rootSupport.reliefWaterAccess[id];
    const replaceWater = update => run({
        ...rootSupport, reliefWaterAccess: { ...rootSupport.reliefWaterAccess, [id]: { ...measure, ...update } }
    });
    const score = (recovery, key) => recovery[key].perReliefScores.find(row => row.recordId === id);
    const context = recovery => score(recovery, 'environmentalForgiveness').supportContextSnapshot.localWater;

    // Only the observed season changes. Source delivery, retention and pressure stay fixed.
    const dry = replaceWater({ lowInputPotential: 0 });
    assert.equal(context(dry).seasonalInflowFraction, 0);
    assert.equal(context(dry).repeatedRunoffSupport, 0);
    assert.deepEqual(context(dry).sourceAccess, context(reference).sourceAccess);
    for (const key of ['recoveryTempo', 'stabilizationInterval', 'reliefPersistence']) {
        assert.equal(score(dry, key).value, score(reference, key).value);
    }
    assert(score(dry, 'environmentalForgiveness').value < target.value);
    for (const key of Object.keys(reference)) {
        const peers = domain => domain[key].perReliefScores.filter(row => row.recordId !== id);
        assert.deepEqual(peers(dry), peers(reference));
    }

    // Lose source access and increase potential storage independently of precipitation.
    const unreachable = replaceWater({ reachableCellCount: 0, sourceCellCount: 0, meanDistance: null, meanAscent: null,
        meanSourceFlow: null, meanSourceLowFlow: null, allocatedSupplyPerArea: null, allocatedLowSupplyPerArea: null });
    const longer = replaceWater({ meanDistance: measure.meanDistance + 1, meanAscent: measure.meanAscent + 0.05 });
    const storage = replaceWater({ storageSpace: measure.storageSpace + 0.1 });
    const scaled = replaceWater({ inputPotential: measure.inputPotential / 2, lowInputPotential: measure.lowInputPotential / 2 });
    for (const candidate of [unreachable, longer, storage, scaled]) {
        for (const key of Object.keys(reference)) assert.equal(score(candidate, key).value, score(reference, key).value);
    }
    assert.equal(context(unreachable).sourceAccess.reachableLandFraction, 0);
    assert(context(longer).sourceAccess.meanDistance > context(reference).sourceAccess.meanDistance);
    assert(context(longer).sourceAccess.meanAscent > context(reference).sourceAccess.meanAscent);
    assert(context(storage).potentialRetention > context(reference).potentialRetention);
    assert.equal(context(scaled).meanInflowPerLandArea, context(reference).meanInflowPerLandArea / 2);

    const { hydrology } = pressureFieldPackage.domains;
    const drought = hydrology.droughtPressure;
    const basinId = target.supportContextSnapshot.riverBasinIds[0];
    assert(drought.perBasinScores.some(row => row.recordId === basinId));
    const withDrought = value => run(rootSupport, {
        ...pressureFieldPackage.domains,
        hydrology: { ...hydrology, droughtPressure: { ...drought, perBasinScores: drought.perBasinScores
            .map(row => row.recordId === basinId ? { ...row, value } : row) } }
    });
    const [lowRisk, highRisk] = [0, 1].map(value => score(withDrought(value), 'recoveryTempo').supportContextSnapshot);
    assert(lowRisk.scarcityDrag < highRisk.scarcityDrag);
    assert.equal(lowRisk.recoveryCapacity, highRisk.recoveryCapacity);

    const { regionalIslandEnvironment, reliefWaterAccess, ...otherSupport } = rootSupport;
    // The fine island wind measure does not supply macro shelter truth.
    const windChanged = run({ ...rootSupport, regionalIslandEnvironment: {
        ...regionalIslandEnvironment,
        records: regionalIslandEnvironment.records.map(row => {
            const setting = row.physicalSetting;
            if (!setting) return row;
            return { ...row, physicalSetting: { ...setting, terrainShelter: {
                ...setting.terrainShelter, shelteredLandCells: 0,
                meanStormOnShelteredLand: null, meanStormOnExposedLand: setting.climateRange.storm.mean
            } } };
        })
    } });
    assert(regionalIslandEnvironment.records.some(row => row.physicalSetting?.terrainShelter.shelteredLandCells > 0));
    assert.deepEqual(windChanged, reference);
    const legacy = run({ ...otherSupport, regionalIslandEnvironment });
    assert.equal(context(legacy), undefined);
    assert(score(legacy, 'recoveryTempo').value <= score(reference, 'recoveryTempo').value);
    assert.equal(score(legacy, 'reliefPersistence').value, score(reference, 'reliefPersistence').value);
    assert(score(legacy, 'environmentalForgiveness').value >= target.value);
    return { reliefRegionId: id, seasonalFraction: context(reference).seasonalInflowFraction,
        forgivenessAfterSeasonChange: [target.value, score(dry, 'environmentalForgiveness').value],
        scarcityDragWithDrought: [lowRisk.scarcityDrag, highRisk.scarcityDrag],
        pressureHeldFixed: true, accessRetentionAndIslandWindIndependent: true, legacyInputAccepted: true };
}

module.exports = { verifySpatialAggregation, verifyLocalRecovery, verifySeasonalRecovery };
