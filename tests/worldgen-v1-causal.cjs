'use strict';

const assert = require('node:assert/strict');

function field(debug, id) {
    return debug.fieldSnapshots.find(snapshot => snapshot.payload.fieldId === id)?.payload;
}

function byRecord(rows, id) {
    return rows.find(row => row.recordId === id)?.value;
}

function verifyNavigationTiming(phase2) {
    const run = (baseCost, storm) => {
        const domain = Object.fromEntries(['stormCadence', 'stormBurstClustering', 'calmToStormTransitionSharpness']
            .map(id => [id, { perBandScores: [{ recordId: 'band', value: storm }] }]));
        const inputBundle = { recordCollections: {
            physical: { climateBands: [{ climateBandId: 'band', reliefRegionIds: ['relief'] }] },
            structural: { macroRoutes: [{ routeId: 'route', reliefRegionIds: ['relief'], type: 'land',
                baseCost, fragility: 0.9, redundancy: 0.1 }], chokepoints: [] }
        } };
        return phase2.createNavigationWindowGenerator().run({ inputBundle, stormCadenceOutput: { domain } }).domain;
    };
    const reliability = domain => domain.navigationWindowReliability.summary.mean;
    const frequency = domain => domain.blockedIntervalFrequency.summary.mean;
    const [calmCheap, calmCostly] = [0.1, 0.9].map(cost => run(cost, 0));
    const [stormCheap, stormCostly] = [0.1, 0.9].map(cost => run(cost, 0.8));
    assert(reliability(calmCheap) > reliability(calmCostly));
    assert(reliability(stormCheap) > reliability(stormCostly));
    assert.deepEqual([frequency(calmCheap), frequency(calmCostly)], [0, 0]);
    assert.equal(frequency(stormCheap), frequency(stormCostly));
    assert(frequency(stormCheap) > 0);
    return { calmCosts: [reliability(calmCheap), reliability(calmCostly)],
        calmFrequency: frequency(calmCostly), stormFrequency: frequency(stormCostly) };
}

function verifyScarcityTiming(phase2) {
    const inputBundle = { recordCollections: { physical: {
        climateBands: [{ climateBandId: 'band', reliefRegionIds: ['relief'] }],
        riverBasins: [{ riverBasinId: 'basin', reliefRegionIds: ['relief'] }]
    } } };
    const run = (season, burden) => {
        const seasonality = Object.fromEntries(['seasonalityStrength', 'annualSwingStrength', 'environmentalCycleClarity']
            .map(id => [id, { perBandScores: [{ recordId: 'band', value: season }] }]));
        const hydrology = Object.fromEntries(['waterReliabilityInverse', 'waterStress', 'droughtPressure']
            .map(id => [id, { perBasinScores: [{ recordId: 'basin', value: burden }] }]));
        return phase2.createScarcityCadenceGenerator().run({ inputBundle,
            seasonalityOutput: { domain: seasonality }, pressureSynthesisOutput: { domainLayers: { hydrology } }
        }).domain;
    };
    const recurrence = domain => domain.shortageRecurrence.summary.mean;
    const fixedPressure = [0.2, 0.8].map(season => recurrence(run(season, 0.5)));
    const fixedSeason = [0.2, 0.8].map(burden => recurrence(run(0.5, burden)));
    assert(fixedPressure[1] > fixedPressure[0]);
    assert(fixedSeason[1] > fixedSeason[0]);
    return { fixedPressure, fixedSeason };
}

function verifyPathTiming(phase2) {
    const run = (stormMean, cost = 0.5) => {
        const route = { type: 'marine_assisted', seaRegionIds: ['sea'], baseCost: cost, fragility: 0.7, redundancy: 0.2 };
        const inputBundle = { rootSupport: { marinePathWeather: [
            { routeId: 'target', cellVisits: 4, stormMean, referenceStormMean: 0.5, seasonalityMean: 0.4 },
            { routeId: 'peer', cellVisits: 4, stormMean: 0.5, referenceStormMean: 0.5, seasonalityMean: 0.4 }
        ] }, recordCollections: { physical: { climateBands: [{ climateBandId: 'band', seaRegionIds: ['sea'] }] },
            structural: { macroRoutes: [{ ...route, routeId: 'target' }, { ...route, routeId: 'peer' }], chokepoints: [] } } };
        const domain = Object.fromEntries(['stormCadence', 'stormBurstClustering', 'calmToStormTransitionSharpness']
            .map(id => [id, { perBandScores: [{ recordId: 'band', value: 0.55 }] }]));
        return phase2.createNavigationWindowGenerator().run({ inputBundle, stormCadenceOutput: { domain } }).domain;
    };
    const calm = run(0), exposed = run(0.85), costly = run(0, 0.9);
    const [calmRoute, calmPeer] = calm.blockedIntervalFrequency.perRouteScores;
    const [stormRoute, stormPeer] = exposed.blockedIntervalFrequency.perRouteScores;
    assert.equal(calmRoute.value, stormRoute.value);
    assert.deepEqual(calmPeer, stormPeer);
    assert.equal(calmRoute.pathTiming.value, 0);
    assert(stormRoute.pathTiming.value > stormPeer.pathTiming.value);
    assert.equal(calmPeer.pathTiming.value, calmPeer.value);
    assert.equal(costly.blockedIntervalFrequency.perRouteScores[0].pathTiming.value, 0);
    assert(calm.navigationWindowReliability.perRouteScores[0].pathTiming.value
        > costly.navigationWindowReliability.perRouteScores[0].pathTiming.value);
    return { sameRegionalFrequency: calmRoute.value, pathFrequencies: [calmRoute.pathTiming.value, stormRoute.pathTiming.value],
        unchangedPeer: stormPeer.pathTiming.value };
}

function verifyIndependentSynthesis(phase2) {
    const fields = row => Object.fromEntries(Object.entries(row).map(([key, mean]) => [key, { summary: { mean } }]));
    const pressure = waterStress => phase2.createPressureSynthesis().run({ pressureDomainLayers: {
        terrain: fields({ mobilityTerrainPenalty: 0.8, fragmentationBurden: 0.6 }),
        travel: fields({ travelExposure: 0.55, routeReliabilityInverse: 0.45 }),
        hydrology: fields({ waterStress, floodInstability: 0.46 }), food: fields({ foodStress: 0.7 })
    } }).synthesized;
    const rhythm = stormCadence => phase2.createEnvironmentalRhythmSynthesis().run({ rhythmDomainLayers: {
        seasonality: fields({ seasonalityStrength: 0.45, annualSwingStrength: 0.52, environmentalCycleClarity: 0.67 }),
        storms: fields({ stormCadence, stormBurstClustering: 0.36, calmToStormTransitionSharpness: 0.39 }),
        navigation: fields({ navigationWindowReliability: 0.47, safeRouteIntervalStrength: 0.35 })
    } }).synthesized;
    const check = (low, high, stable, changed, mean) => {
        assert.equal(mean(low[stable]), mean(high[stable]));
        assert.notEqual(low[stable].readabilityValue, high[stable].readabilityValue);
        assert(mean(high[changed]) > mean(low[changed]));
        return { independentMean: mean(low[stable]), display: [low[stable].readabilityValue, high[stable].readabilityValue],
            affected: [mean(low[changed]), mean(high[changed])] };
    };
    return { pressure: check(pressure(0.1), pressure(0.9), 'mobilityPressure', 'survivabilityPressure', x => x.value),
        rhythm: check(rhythm(0.1), rhythm(0.9), 'seasonalityProfile', 'stormRhythm', x => x.summary.mean) };
}

function runCausalChecks(systems, canonical, saveStormPair) {
    const { worldgenMacro: macro, worldgenPhase2: phase2 } = systems;
    const { phase0Bundle, phase1SafeSummaryBundle } = canonical.phase0.outputs;
    const { macroGeographySeed, pressureSeed, rhythmSeed } = phase0Bundle.worldSubSeedMap;
    const profile = macro.intakeMasterConstraints(phase1SafeSummaryBundle);
    assert.equal(profile.routeFragilityBias, phase0Bundle.worldSeedProfile.routeFragilityBias);

    function intervene(channel, value, debug = false) {
        const intervened = { ...profile, [channel]: value };
        return macro.generateMacroGeographyEndToEnd({
            macroSeed: macroGeographySeed,
            macroSeedProfile: intervened,
            phase1Constraints: macro.normalizePhase1SeedConstraints(intervened),
            includeDebugArtifacts: debug,
            attachDebugToPackage: false
        });
    }

    function interpret(geography, handoff) {
        return phase2.createPhase2Engine().run({
            macroGeographyPackage: geography,
            macroGeographyHandoffPackage: handoff,
            pressureSeed,
            rhythmSeed
        }).output;
    }

    const weatherLow = intervene('environmentalVolatility', 0.1, true);
    const weatherHigh = intervene('environmentalVolatility', 0.9, true);
    const stormField = 'stormCorridorField';
    const lowStorm = field(weatherLow.endToEndDebugExport, stormField).values;
    const highStorm = field(weatherHigh.endToEndDebugExport, stormField).values;
    const changedStormCells = lowStorm.filter((value, index) => highStorm[index] > value).length;
    assert(changedStormCells > 0 && lowStorm.every((value, index) => highStorm[index] >= value),
        'Volatility must strengthen an existing storm opportunity');
    const physicalControls = [
        'platePressureField', 'coastJaggednessControlledLandWaterMaskField',
        'seaLevelAppliedElevationField', 'temperatureColdLoadField', 'wetnessField'
    ];
    for (const id of physicalControls) {
        assert.deepEqual(field(weatherLow.endToEndDebugExport, id).values, field(weatherHigh.endToEndDebugExport, id).values, id);
    }
    const debug = canonical.diagnostics.physicalWorldDebugBundle;
    const elevation = field(debug, 'seaLevelAppliedElevationField');
    const mountain = field(debug, 'mountainAmplificationField');
    const rainShadowFields = {
        seaLevelAppliedElevationField: elevation,
        mountainAmplificationField: mountain,
        landmassCleanupMaskField: field(debug, 'landmassCleanupMaskField'),
        oceanConnectivityMaskField: field(debug, 'oceanConnectivityMaskField'),
        coastalShelfDepthField: field(debug, 'coastalShelfDepthField')
    };
    const rainShadowAt = fields => macro.generateRainShadowEffect({
        macroSeed: macroGeographySeed, worldBounds: { width: elevation.width, height: elevation.height }, fields
    });
    const orographic = rainShadowAt(rainShadowFields);
    const flatControl = rainShadowAt({
        ...rainShadowFields,
        seaLevelAppliedElevationField: { ...elevation, values: elevation.values.map(() => 0) },
        mountainAmplificationField: { ...mountain, values: mountain.values.map(() => 0) }
    });
    assert.equal(orographic.seed, flatControl.seed);
    assert(orographic.summary.shadowedCellCount > 0);
    assert(flatControl.values.every(value => value === 0), 'Flat relief cannot cast a rain shadow');
    assert(flatControl.orographicBoostValues.every(value => value === 0));
    const lowSea = weatherLow.macroGeographyPackage.seaRegions.find(sea => sea.basinType === 'open_ocean');
    const highSea = weatherHigh.macroGeographyPackage.seaRegions.find(sea => sea.seaRegionId === lowSea.seaRegionId);
    assert(highSea.stormPressure > lowSea.stormPressure);
    assert.equal(highSea.navigability, lowSea.navigability);
    const lowWeatherOutput = interpret(weatherLow.macroGeographyPackage, weatherLow.macroGeographyHandoffPackage);
    const highWeatherOutput = interpret(weatherHigh.macroGeographyPackage, weatherHigh.macroGeographyHandoffPackage);
    assert(lowWeatherOutput.exportResult.exported && highWeatherOutput.exportResult.exported);
    const pressure = output => output.pressureFieldPackage.domains.catastrophe.stormBreakRisk.summary.mean;
    const rhythm = output => output.environmentalRhythmPackage.domains.storms.stormCadence.summary.mean;
    assert(pressure(highWeatherOutput) > pressure(lowWeatherOutput), 'Phase 2 storm break risk did not respond');
    assert(rhythm(highWeatherOutput) > rhythm(lowWeatherOutput), 'Phase 2 storm cadence did not respond');
    assert.deepEqual(lowWeatherOutput.pressureFieldPackage.domains.terrain, highWeatherOutput.pressureFieldPackage.domains.terrain);
    const travel = output => output.pressureFieldPackage.domains.travel.travelExposure.perRouteScores;
    const navigation = output => output.environmentalRhythmPackage.domains.navigation.navigationWindowReliability.perRouteScores;
    const root = canonical.phase1.macroGeographyPackage;
    const marineRoute = root.macroRoutes.find(route => route.through.some(id => root.seaRegions.some(sea => sea.seaRegionId === id)));
    assert(marineRoute, 'Expected a physically traced marine route');
    const travelRecord = travel(lowWeatherOutput).find(row => row.recordId === marineRoute.routeId);
    const navigationRecord = navigation(lowWeatherOutput).find(row => row.recordId === marineRoute.routeId);
    assert(travelRecord.seaRegionIds.length && travelRecord.reliefRegionIds.length, 'Phase 2 travel lost canonical route carriers');
    assert.deepEqual(navigationRecord.seaRegionIds, travelRecord.seaRegionIds);
    assert.deepEqual(navigationRecord.reliefRegionIds, travelRecord.reliefRegionIds);
    const domainLayers = canonical.phase2.environmentalRhythmPackage.domains;
    const navigationAtClosureFrequency = frequency => phase2.createEnvironmentalRhythmSynthesis({
        deterministicSeed: rhythmSeed
    }).run({ rhythmDomainLayers: {
        ...domainLayers,
        navigation: {
            ...domainLayers.navigation,
            blockedIntervalFrequency: {
                ...domainLayers.navigation.blockedIntervalFrequency,
                summary: { ...domainLayers.navigation.blockedIntervalFrequency.summary, mean: frequency }
            }
        }
    } }).synthesized.navigationRhythm.summary.mean;
    const navigationWindows = [navigationAtClosureFrequency(0.1), navigationAtClosureFrequency(0.9)];
    assert(navigationWindows[1] < navigationWindows[0], 'Increasing closures cannot improve navigation windows');

    const fragilityLow = intervene('routeFragilityBias', 0.1);
    const fragilityHigh = intervene('routeFragilityBias', 0.9);
    assert.deepEqual(fragilityLow.macroGeographyPackage, fragilityHigh.macroGeographyPackage);
    const getCascadeProfiles = result => result.macroGeographyHandoffPackage.collapsePressureSeeds.routeCascadeProfiles;
    const profilePairs = getCascadeProfiles(fragilityLow).map((low, index) => [low, getCascadeProfiles(fragilityHigh)[index]]);
    assert(profilePairs.every(([low, high]) => low.routeId === high.routeId
        && low.physicalFragility === high.physicalFragility && low.redundancy === high.redundancy));
    const supportedRoutes = profilePairs.filter(([low]) => low.physicalFragility > 0 && low.redundancy < 1);
    assert(supportedRoutes.length > 0);
    assert(supportedRoutes.every(([low, high]) => high.susceptibility > low.susceptibility));
    assert(profilePairs.filter(([low]) => low.physicalFragility === 0 || low.redundancy === 1)
        .every(([low, high]) => low.susceptibility === high.susceptibility));
    const lowCascadeOutput = interpret(fragilityLow.macroGeographyPackage, fragilityLow.macroGeographyHandoffPackage);
    const highCascadeOutput = interpret(fragilityHigh.macroGeographyPackage, fragilityHigh.macroGeographyHandoffPackage);
    assert.deepEqual(lowCascadeOutput.exportResult.bundle, highCascadeOutput.exportResult.bundle,
        'History-facing cascade susceptibility leaked into Phase 2');

    const socialControls = ['conflictPressure', 'collapseIntensity'].map(channel => {
        const low = intervene(channel, 0.1);
        const high = intervene(channel, 0.9);
        assert.deepEqual(low.macroGeographyPackage, high.macroGeographyPackage, channel);
        assert.deepEqual(low.macroGeographyHandoffPackage, high.macroGeographyHandoffPackage, channel);
        return { channel, phase1ControlsStable: true, phase2ReceivesSameInput: true };
    });

    const { macroGeographyPackage: original, macroGeographyHandoffPackage: handoff } = canonical.phase1;
    const basin = original.riverBasins.find(record => record.reliefRegionIds.length);
    const localRelief = basin.primaryReliefRegionId;
    const interpretCatchment = catchmentScale => interpret({
        ...original,
        riverBasins: original.riverBasins.map(row => row.riverBasinId === basin.riverBasinId ? { ...row, catchmentScale } : row)
    }, handoff);
    const scarce = interpretCatchment(0.032);
    const supported = interpretCatchment(0.42);
    const water = output => byRecord(output.pressureFieldPackage.domains.hydrology.waterReliabilityInverse.perBasinScores, basin.riverBasinId);
    const reliefTempo = output => output.environmentalRhythmPackage.domains.recovery.recoveryTempo.perReliefScores
        .find(row => row.recordId === localRelief);
    const recovery = output => reliefTempo(output).value;
    const runoff = output => reliefTempo(output).supportContextSnapshot.runoffSupport;
    assert(water(scarce) > water(supported), 'Smaller catchment did not impair water reliability');
    assert(runoff(scarce) < runoff(supported), 'More reliable water did not improve locally available runoff');
    assert(recovery(scarce) < recovery(supported), 'Reliable catchment did not support recovery');
    const localReplenishment = output => reliefTempo(output).supportContextSnapshot.localWater.replenishment;
    assert(localReplenishment(scarce));
    assert.deepEqual(localReplenishment(scarce), localReplenishment(supported),
        'Catchment scale cannot replace measured local replenishment');
    assert.deepEqual(scarce.pressureFieldPackage.domains.climate, supported.pressureFieldPackage.domains.climate);
    const bandFootprints = original.environmentalCoverage.climateBands;
    const food = (output, bandId) => byRecord(output.pressureFieldPackage.domains.food.foodStress.perBandScores, bandId);
    const linkedBands = Object.keys(bandFootprints).filter(id => bandFootprints[id].riverBasinCells?.[basin.riverBasinId]);
    const changedBand = linkedBands.find(id => food(scarce, id) > food(supported, id));
    assert(changedBand, 'Food pressure did not respond in any band supplied by the intervened basin');
    const independentBands = Object.keys(bandFootprints).filter(id => !linkedBands.includes(id));
    assert(independentBands.length);
    assert(independentBands.every(id => food(scarce, id) === food(supported, id)), 'Water pressure leaked into an independent band');
    const result = {
        seed: phase0Bundle.worldSeedProfile.worldSeed,
        fixedSubseeds: { macroGeographySeed, pressureSeed, rhythmSeed },
        routeCarriers: {
            routeId: marineRoute.routeId,
            seaRegionIds: travelRecord.seaRegionIds,
            reliefRegionIds: travelRecord.reliefRegionIds,
            navigationWindows
        },
        environmentalVolatility: {
            values: [0.1, 0.9],
            changedStormCells,
            physicalControls,
            seaRegionId: lowSea.seaRegionId,
            seaStormPressure: [lowSea.stormPressure, highSea.stormPressure],
            stormBreakRisk: [pressure(lowWeatherOutput), pressure(highWeatherOutput)],
            stormCadence: [rhythm(lowWeatherOutput), rhythm(highWeatherOutput)]
        },
        routeFragilityBias: {
            values: [0.1, 0.9],
            supportedRoutes: supportedRoutes.length,
            susceptibility: supportedRoutes.map(([low, high]) => [low.routeId, low.susceptibility, high.susceptibility]),
            phase2ControlsStable: true
        },
        socialControls,
        rainShadow: {
            namespace: orographic.seedNamespace,
            fixedSeed: orographic.seed,
            shadowedCells: [flatControl.summary.shadowedCellCount, orographic.summary.shadowedCellCount],
            mean: [flatControl.stats.mean, orographic.stats.mean]
        },
        catchmentScale: {
            range: [0.032, 0.42],
            riverBasinId: basin.riverBasinId,
            reliefRegionId: localRelief,
            waterReliabilityInverse: [water(scarce), water(supported)],
            runoffSupport: [runoff(scarce), runoff(supported)],
            recoveryTempo: [recovery(scarce), recovery(supported)],
            foodClimateBandId: changedBand,
            foodStress: [food(scarce, changedBand), food(supported, changedBand)],
            unchangedIndependentBands: independentBands.length,
            climateControlsStable: true
        }
    };
    if (saveStormPair) {
        const { width, height } = field(weatherLow.endToEndDebugExport, stormField);
        saveStormPair({
            schema: 'worldgen-storm-counterfactual-v1',
            seed: result.seed,
            ...result.environmentalVolatility,
            width,
            height,
            land: field(weatherLow.endToEndDebugExport, 'coastJaggednessControlledLandWaterMaskField').values,
            lowStorm,
            highStorm
        });
    }
    return result;
}

module.exports = { runCausalChecks, verifyNavigationTiming, verifyScarcityTiming, verifyPathTiming, verifyIndependentSynthesis };
