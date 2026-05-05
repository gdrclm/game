(() => {
    const game = window.Game;
    const phase2 = game.systems.worldgenPhase2 = game.systems.worldgenPhase2 || {};
    const GROUP_ID = 'summaries';
    const PHASE_ID = 'PHASE_2';
    const SUMMARY_STATUS = 'contract_first_stub';
    const PRESSURE_SUMMARY_GENERATOR_ID = 'PressureSummaryGenerator';
    const RHYTHM_SUMMARY_GENERATOR_ID = 'RhythmSummaryGenerator';
    const PHASE_LEVEL_SUMMARY_GENERATOR_ID = 'PhaseLevelSummaryGenerator';
    const RECORD_BOUND_SUMMARY_GENERATOR_ID = 'RecordBoundSummaryGenerator';
    const IMPLEMENTED_PRESSURE_SUMMARY_STATUS = 'implemented_pressure_summaries';
    const IMPLEMENTED_RHYTHM_SUMMARY_STATUS = 'implemented_rhythm_summaries';
    const SUMMARY_SCAFFOLD_VERSION = 'phase2-summary-scaffold-v1';
    const FALLBACK_PRESSURE_SUMMARY_KEYS = Object.freeze([
        'pressureSummary',
        'traversalSummary',
        'survivalSummary',
        'fragilitySummary'
    ]);
    const FALLBACK_RHYTHM_SUMMARY_KEYS = Object.freeze([
        'rhythmSummary',
        'timingSummary',
        'recoverySummary',
        'windowSummary'
    ]);
    const FALLBACK_RECORD_TYPE_IDS = Object.freeze([
        'continents',
        'seaRegions',
        'mountainSystems',
        'volcanicZones',
        'riverBasins',
        'climateBands',
        'reliefRegions',
        'archipelagoRegions',
        'chokepoints',
        'macroRoutes',
        'isolatedZones',
        'strategicRegions'
    ]);
    const PRESSURE_FIELD_SOURCE_CONFIG = Object.freeze([
        Object.freeze({ domainId: 'climate', fieldId: 'coldPressure', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'climate', fieldId: 'heatPressure', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'climate', fieldId: 'humidityPressure', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'climate', fieldId: 'climateExposurePressure', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'terrain', fieldId: 'terrainHarshness', sourceRecordType: 'reliefRegions', collectionKey: 'perReliefScores', recordIdKey: 'reliefRegionId' }),
        Object.freeze({ domainId: 'terrain', fieldId: 'slopeBurden', sourceRecordType: 'reliefRegions', collectionKey: 'perReliefScores', recordIdKey: 'reliefRegionId' }),
        Object.freeze({ domainId: 'terrain', fieldId: 'fragmentationBurden', sourceRecordType: 'reliefRegions', collectionKey: 'perReliefScores', recordIdKey: 'reliefRegionId' }),
        Object.freeze({ domainId: 'terrain', fieldId: 'mobilityTerrainPenalty', sourceRecordType: 'reliefRegions', collectionKey: 'perReliefScores', recordIdKey: 'reliefRegionId' }),
        Object.freeze({ domainId: 'hydrology', fieldId: 'waterReliabilityInverse', sourceRecordType: 'riverBasins', collectionKey: 'perBasinScores', recordIdKey: 'riverBasinId' }),
        Object.freeze({ domainId: 'hydrology', fieldId: 'waterStress', sourceRecordType: 'riverBasins', collectionKey: 'perBasinScores', recordIdKey: 'riverBasinId' }),
        Object.freeze({ domainId: 'hydrology', fieldId: 'droughtPressure', sourceRecordType: 'riverBasins', collectionKey: 'perBasinScores', recordIdKey: 'riverBasinId' }),
        Object.freeze({ domainId: 'hydrology', fieldId: 'floodInstability', sourceRecordType: 'riverBasins', collectionKey: 'perBasinScores', recordIdKey: 'riverBasinId' }),
        Object.freeze({ domainId: 'food', fieldId: 'foodStress', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'food', fieldId: 'foodReliabilityInverse', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'food', fieldId: 'fertilitySupportInverse', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'food', fieldId: 'scarcityBaseline', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'travel', fieldId: 'travelExposure', sourceRecordType: 'macroRoutes', collectionKey: 'perRouteScores', recordIdKey: 'macroRouteId' }),
        Object.freeze({ domainId: 'travel', fieldId: 'routeReliabilityInverse', sourceRecordType: 'macroRoutes', collectionKey: 'perRouteScores', recordIdKey: 'macroRouteId' }),
        Object.freeze({ domainId: 'travel', fieldId: 'movementUncertaintyPressure', sourceRecordType: 'macroRoutes', collectionKey: 'perRouteScores', recordIdKey: 'macroRouteId' }),
        Object.freeze({ domainId: 'travel', fieldId: 'detourBurden', sourceRecordType: 'macroRoutes', collectionKey: 'perRouteScores', recordIdKey: 'macroRouteId' }),
        Object.freeze({ domainId: 'chokepoints', fieldId: 'chokepointPressure', sourceRecordType: 'chokepoints', collectionKey: 'perChokepointScores', recordIdKey: 'chokepointId' }),
        Object.freeze({ domainId: 'chokepoints', fieldId: 'failureImpactPressure', sourceRecordType: 'chokepoints', collectionKey: 'perChokepointScores', recordIdKey: 'chokepointId' }),
        Object.freeze({ domainId: 'chokepoints', fieldId: 'dependencyConcentration', sourceRecordType: 'chokepoints', collectionKey: 'perChokepointScores', recordIdKey: 'chokepointId' }),
        Object.freeze({ domainId: 'isolation', fieldId: 'isolationPressure', sourceRecordType: 'isolatedZones', collectionKey: 'perZoneScores', recordIdKey: 'isolatedZoneId' }),
        Object.freeze({ domainId: 'isolation', fieldId: 'supportDelayBurden', sourceRecordType: 'isolatedZones', collectionKey: 'perZoneScores', recordIdKey: 'isolatedZoneId' }),
        Object.freeze({ domainId: 'isolation', fieldId: 'peripheralExposure', sourceRecordType: 'isolatedZones', collectionKey: 'perZoneScores', recordIdKey: 'isolatedZoneId' }),
        Object.freeze({ domainId: 'isolation', fieldId: 'accessFragility', sourceRecordType: 'isolatedZones', collectionKey: 'perZoneScores', recordIdKey: 'isolatedZoneId' }),
        Object.freeze({ domainId: 'ecology', fieldId: 'ecologicalFragility', sourceRecordType: 'reliefRegions', collectionKey: 'perReliefScores', recordIdKey: 'reliefRegionId' }),
        Object.freeze({ domainId: 'ecology', fieldId: 'ecologicalStabilityInverse', sourceRecordType: 'reliefRegions', collectionKey: 'perReliefScores', recordIdKey: 'reliefRegionId' }),
        Object.freeze({ domainId: 'ecology', fieldId: 'regenerationWeakness', sourceRecordType: 'reliefRegions', collectionKey: 'perReliefScores', recordIdKey: 'reliefRegionId' }),
        Object.freeze({ domainId: 'ecology', fieldId: 'carryingCapacityBrittleness', sourceRecordType: 'reliefRegions', collectionKey: 'perReliefScores', recordIdKey: 'reliefRegionId' }),
        Object.freeze({ domainId: 'catastrophe', fieldId: 'catastrophePressure', sourceRecordType: 'reliefRegions', collectionKey: 'perReliefScores', recordIdKey: 'reliefRegionId' }),
        Object.freeze({ domainId: 'catastrophe', fieldId: 'stormBreakRisk', sourceRecordType: 'reliefRegions', collectionKey: 'perReliefScores', recordIdKey: 'reliefRegionId' }),
        Object.freeze({ domainId: 'catastrophe', fieldId: 'volcanicInstability', sourceRecordType: 'reliefRegions', collectionKey: 'perReliefScores', recordIdKey: 'reliefRegionId' }),
        Object.freeze({ domainId: 'catastrophe', fieldId: 'floodBreakRisk', sourceRecordType: 'reliefRegions', collectionKey: 'perReliefScores', recordIdKey: 'reliefRegionId' }),
        Object.freeze({ domainId: 'catastrophe', fieldId: 'droughtBreakRisk', sourceRecordType: 'reliefRegions', collectionKey: 'perReliefScores', recordIdKey: 'reliefRegionId' })
    ]);
    const PRESSURE_SUMMARY_SYNTHESIS_GROUPS = Object.freeze({
        pressureSummary: Object.freeze(['survivabilityPressure', 'mobilityPressure', 'supplyPressure']),
        traversalSummary: Object.freeze(['mobilityPressure', 'remotenessBurden', 'chokepointStress']),
        survivalSummary: Object.freeze(['survivabilityPressure', 'supplyPressure', 'catastropheSusceptibility']),
        fragilitySummary: Object.freeze(['ecologicalBurden', 'catastropheSusceptibility', 'chokepointStress'])
    });
    const RHYTHM_FIELD_SOURCE_CONFIG = Object.freeze([
        Object.freeze({ domainId: 'seasonality', fieldId: 'seasonalityStrength', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'seasonality', fieldId: 'annualSwingStrength', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'seasonality', fieldId: 'environmentalCycleClarity', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'storms', fieldId: 'stormCadence', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'storms', fieldId: 'stormBurstClustering', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'storms', fieldId: 'calmToStormTransitionSharpness', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'navigation', fieldId: 'navigationWindowReliability', sourceRecordType: 'macroRoutes', collectionKey: 'perRouteScores', recordIdKey: 'macroRouteId' }),
        Object.freeze({ domainId: 'navigation', fieldId: 'blockedIntervalFrequency', sourceRecordType: 'macroRoutes', collectionKey: 'perRouteScores', recordIdKey: 'macroRouteId' }),
        Object.freeze({ domainId: 'navigation', fieldId: 'safeRouteIntervalStrength', sourceRecordType: 'macroRoutes', collectionKey: 'perRouteScores', recordIdKey: 'macroRouteId' }),
        Object.freeze({ domainId: 'scarcity', fieldId: 'scarcityCadence', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'scarcity', fieldId: 'deficitPersistence', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'scarcity', fieldId: 'shortageRecurrence', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'predictability', fieldId: 'predictability', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'predictability', fieldId: 'ruptureFrequency', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'predictability', fieldId: 'cadenceIrregularity', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'predictability', fieldId: 'temporalTrustworthiness', sourceRecordType: 'climateBands', collectionKey: 'perBandScores', recordIdKey: 'climateBandId' }),
        Object.freeze({ domainId: 'recovery', fieldId: 'recoveryTempo', sourceRecordType: 'reliefRegions', collectionKey: 'perReliefScores', recordIdKey: 'reliefRegionId' }),
        Object.freeze({ domainId: 'recovery', fieldId: 'stabilizationInterval', sourceRecordType: 'reliefRegions', collectionKey: 'perReliefScores', recordIdKey: 'reliefRegionId' }),
        Object.freeze({ domainId: 'recovery', fieldId: 'reliefPersistence', sourceRecordType: 'reliefRegions', collectionKey: 'perReliefScores', recordIdKey: 'reliefRegionId' }),
        Object.freeze({ domainId: 'recovery', fieldId: 'environmentalForgiveness', sourceRecordType: 'reliefRegions', collectionKey: 'perReliefScores', recordIdKey: 'reliefRegionId' })
    ]);
    const RHYTHM_SUMMARY_SYNTHESIS_GROUPS = Object.freeze({
        rhythmSummary: Object.freeze(['seasonalityProfile', 'stormRhythm', 'predictabilityProfile']),
        timingSummary: Object.freeze(['seasonalityProfile', 'predictabilityProfile', 'ruptureProfile']),
        recoverySummary: Object.freeze(['recoveryProfile', 'predictabilityProfile']),
        windowSummary: Object.freeze(['navigationRhythm', 'stormRhythm', 'scarcityRhythm'])
    });
    const STUB = Object.freeze({
        groupId: GROUP_ID,
        status: 'partial_implemented_pressure_summaries',
        canonicalPath: 'js/worldgen/phase2/summaries/',
        uiCoupling: false,
        implementsFieldLogic: true,
        purpose: 'Contract-first summary scaffold for pressure, rhythm, phase-level, and record-bound Phase 2 summaries without narrative invention.'
    });

    function deepFreeze(value) {
        if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
            return value;
        }

        Object.freeze(value);
        Object.values(value).forEach((nestedValue) => {
            deepFreeze(nestedValue);
        });

        return value;
    }

    function cloneValue(value) {
        if (Array.isArray(value)) {
            return value.map((entry) => cloneValue(entry));
        }

        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)])
            );
        }

        return value;
    }

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function normalizeString(value, fallback = '') {
        return typeof value === 'string' ? value.trim() : fallback;
    }

    function clamp01(value) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 0;
        }

        if (numericValue <= 0) {
            return 0;
        }

        if (numericValue >= 1) {
            return 1;
        }

        return numericValue;
    }

    function roundValue(value, digits = 6) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 0;
        }

        const factor = 10 ** digits;
        return Math.round(numericValue * factor) / factor;
    }

    function mean(values = []) {
        const normalizedValues = (Array.isArray(values) ? values : [])
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value));
        if (!normalizedValues.length) {
            return 0;
        }

        return normalizedValues.reduce((sum, value) => sum + value, 0) / normalizedValues.length;
    }

    function createKeyedObject(keys = [], defaultValue = '') {
        return (Array.isArray(keys) ? keys : []).reduce((result, key) => {
            result[key] = defaultValue;
            return result;
        }, {});
    }

    function getContractSnapshot() {
        return isPlainObject(phase2.contracts) ? phase2.contracts : null;
    }

    function getPressureSummaryKeys() {
        const contracts = getContractSnapshot();
        const packageSchema = contracts && contracts.packageSchemas
            ? contracts.packageSchemas.pressureFieldPackage
            : null;
        return packageSchema && Array.isArray(packageSchema.requiredSummaries)
            ? packageSchema.requiredSummaries.slice()
            : FALLBACK_PRESSURE_SUMMARY_KEYS.slice();
    }

    function getRhythmSummaryKeys() {
        const contracts = getContractSnapshot();
        const packageSchema = contracts && contracts.packageSchemas
            ? contracts.packageSchemas.environmentalRhythmPackage
            : null;
        return packageSchema && Array.isArray(packageSchema.requiredSummaries)
            ? packageSchema.requiredSummaries.slice()
            : FALLBACK_RHYTHM_SUMMARY_KEYS.slice();
    }

    function getCanonicalRecordTypeIds() {
        if (typeof phase2.getCanonicalPhase2RecordTypeIds === 'function') {
            const recordTypeIds = phase2.getCanonicalPhase2RecordTypeIds();
            return Array.isArray(recordTypeIds) ? recordTypeIds.slice() : FALLBACK_RECORD_TYPE_IDS.slice();
        }

        return FALLBACK_RECORD_TYPE_IDS.slice();
    }

    function uniqueStrings(values = []) {
        const seen = new Set();
        return (Array.isArray(values) ? values : [])
            .map((value) => normalizeString(value, ''))
            .filter((value) => {
                if (!value || seen.has(value)) {
                    return false;
                }

                seen.add(value);
                return true;
            });
    }

    function getPressureSynthesisOutput(input = {}, deterministicSeed = null) {
        if (isPlainObject(input.pressureSynthesisOutput)) {
            return cloneValue(input.pressureSynthesisOutput);
        }

        if (isPlainObject(input.pressureFieldPackage)) {
            return {
                synthesized: cloneValue(input.pressureFieldPackage.synthesized || {}),
                domainLayers: cloneValue(input.pressureFieldPackage.domains || {}),
                metadata: {
                    sourcePackageId: normalizeString(input.pressureFieldPackage.packageId, ''),
                    recordBindingContextId: normalizeString(input.pressureFieldPackage.recordBindingContextId, '')
                }
            };
        }

        if (typeof phase2.createPressureSynthesis === 'function') {
            return phase2.createPressureSynthesis({ deterministicSeed }).run(input);
        }

        throw new Error('[worldgen/phase2] Pressure summary generation requires pressure synthesis output or createPressureSynthesis.');
    }

    function getEnvironmentalRhythmSynthesisOutput(input = {}, deterministicSeed = null) {
        if (isPlainObject(input.environmentalRhythmSynthesisOutput)) {
            return cloneValue(input.environmentalRhythmSynthesisOutput);
        }

        if (isPlainObject(input.environmentalRhythmPackage)) {
            return {
                synthesized: cloneValue(input.environmentalRhythmPackage.synthesized || {}),
                domainLayers: cloneValue(input.environmentalRhythmPackage.domains || {}),
                metadata: {
                    sourcePackageId: normalizeString(input.environmentalRhythmPackage.packageId, ''),
                    recordBindingContextId: normalizeString(input.environmentalRhythmPackage.recordBindingContextId, '')
                }
            };
        }

        if (typeof phase2.createEnvironmentalRhythmSynthesis === 'function') {
            return phase2.createEnvironmentalRhythmSynthesis({ deterministicSeed }).run(input);
        }

        throw new Error('[worldgen/phase2] Rhythm summary generation requires environmental rhythm synthesis output or createEnvironmentalRhythmSynthesis.');
    }

    function getPressureFieldMean(field) {
        if (isPlainObject(field) && isPlainObject(field.summary)) {
            return clamp01(field.summary.mean);
        }

        return 0;
    }

    function rankEntriesByValue(entries = [], limit = entries.length) {
        return (Array.isArray(entries) ? entries : [])
            .filter((entry) => Number.isFinite(Number(entry && entry.value)))
            .sort((left, right) => Number(right.value) - Number(left.value))
            .slice(0, limit)
            .map((entry) => ({
                ...entry,
                value: roundValue(clamp01(entry.value))
            }));
    }

    function formatFieldValue(entry = {}) {
        return `${entry.fieldId} (${roundValue(clamp01(entry.value), 3)})`;
    }

    function summarizeRankedFields(entries = [], fallback = 'no field-backed burden signal') {
        const ranked = rankEntriesByValue(entries, 2);
        if (!ranked.length) {
            return fallback;
        }

        if (ranked.length === 1) {
            return formatFieldValue(ranked[0]);
        }

        return `${formatFieldValue(ranked[0])} and ${formatFieldValue(ranked[1])}`;
    }

    function buildPressureDomainMeanEntries(domainLayers = {}) {
        return PRESSURE_FIELD_SOURCE_CONFIG.map((config) => {
            const domain = isPlainObject(domainLayers[config.domainId]) ? domainLayers[config.domainId] : {};
            const field = isPlainObject(domain[config.fieldId]) ? domain[config.fieldId] : null;
            return {
                domainId: config.domainId,
                fieldId: config.fieldId,
                value: getPressureFieldMean(field)
            };
        });
    }

    function buildPressureSynthesizedMeanEntries(synthesized = {}) {
        return Object.keys(synthesized).map((fieldId) => ({
            domainId: 'synthesized',
            fieldId,
            value: getPressureFieldMean(synthesized[fieldId])
        }));
    }

    function buildRhythmDomainMeanEntries(domainLayers = {}) {
        return RHYTHM_FIELD_SOURCE_CONFIG.map((config) => {
            const domain = isPlainObject(domainLayers[config.domainId]) ? domainLayers[config.domainId] : {};
            const field = isPlainObject(domain[config.fieldId]) ? domain[config.fieldId] : null;
            return {
                domainId: config.domainId,
                fieldId: config.fieldId,
                value: getPressureFieldMean(field)
            };
        });
    }

    function buildRhythmSynthesizedMeanEntries(synthesized = {}) {
        return Object.keys(synthesized).map((fieldId) => ({
            domainId: 'synthesized',
            fieldId,
            value: getPressureFieldMean(synthesized[fieldId])
        }));
    }

    function buildPressureSummaryText(summaryKey, synthesizedEntries, domainEntries) {
        const synthesizedFocusIds = PRESSURE_SUMMARY_SYNTHESIS_GROUPS[summaryKey] || [];
        const synthesizedFocus = rankEntriesByValue(
            synthesizedEntries.filter((entry) => synthesizedFocusIds.includes(entry.fieldId)),
            2
        );
        const domainFocusBySummary = {
            pressureSummary: ['climate', 'terrain', 'hydrology', 'food'],
            traversalSummary: ['terrain', 'travel', 'chokepoints', 'isolation'],
            survivalSummary: ['climate', 'hydrology', 'food', 'catastrophe'],
            fragilitySummary: ['ecology', 'catastrophe', 'chokepoints', 'isolation']
        };
        const domainFocus = rankEntriesByValue(
            domainEntries.filter((entry) => (domainFocusBySummary[summaryKey] || []).includes(entry.domainId)),
            2
        );

        const synthesizedClause = summarizeRankedFields(synthesizedFocus, 'no synthesized burden axis');
        const domainClause = summarizeRankedFields(domainFocus, 'no domain field');

        switch (summaryKey) {
        case 'traversalSummary':
            return `Traversal burden is led by ${synthesizedClause}, with field-backed support from ${domainClause}.`;
        case 'survivalSummary':
            return `Survival burden is led by ${synthesizedClause}, with field-backed support from ${domainClause}.`;
        case 'fragilitySummary':
            return `Fragility burden is led by ${synthesizedClause}, with field-backed support from ${domainClause}.`;
        case 'pressureSummary':
        default:
            return `Overall pressure is led by ${synthesizedClause}, with field-backed support from ${domainClause}.`;
        }
    }

    function buildRhythmSummaryText(summaryKey, synthesizedEntries, domainEntries) {
        const synthesizedFocusIds = RHYTHM_SUMMARY_SYNTHESIS_GROUPS[summaryKey] || [];
        const synthesizedFocus = rankEntriesByValue(
            synthesizedEntries.filter((entry) => synthesizedFocusIds.includes(entry.fieldId)),
            2
        );
        const domainFocusBySummary = {
            rhythmSummary: ['seasonality', 'storms', 'predictability'],
            timingSummary: ['seasonality', 'storms', 'predictability', 'scarcity'],
            recoverySummary: ['recovery', 'predictability'],
            windowSummary: ['navigation', 'storms', 'scarcity']
        };
        const domainFocus = rankEntriesByValue(
            domainEntries.filter((entry) => (domainFocusBySummary[summaryKey] || []).includes(entry.domainId)),
            2
        );

        const synthesizedClause = summarizeRankedFields(synthesizedFocus, 'no synthesized rhythm axis');
        const domainClause = summarizeRankedFields(domainFocus, 'no timing field');

        switch (summaryKey) {
        case 'timingSummary':
            return `Timing rhythm is shaped by ${synthesizedClause}, with field-backed cadence support from ${domainClause}.`;
        case 'recoverySummary':
            return `Recovery rhythm is carried by ${synthesizedClause}, with relief support from ${domainClause}.`;
        case 'windowSummary':
            return `Window rhythm is shaped by ${synthesizedClause}, with route-and-interval support from ${domainClause}.`;
        case 'rhythmSummary':
        default:
            return `Overall rhythm is shaped by ${synthesizedClause}, with field-backed timing support from ${domainClause}.`;
        }
    }

    function buildPressureRecordScoreIndex(domainLayers = {}) {
        return PRESSURE_FIELD_SOURCE_CONFIG.reduce((index, config) => {
            const domain = isPlainObject(domainLayers[config.domainId]) ? domainLayers[config.domainId] : {};
            const field = isPlainObject(domain[config.fieldId]) ? domain[config.fieldId] : null;
            const scoreEntries = Array.isArray(field && field[config.collectionKey]) ? field[config.collectionKey] : [];

            if (!index[config.sourceRecordType]) {
                index[config.sourceRecordType] = {};
            }

            scoreEntries.forEach((scoreEntry) => {
                const recordId = normalizeString(scoreEntry && scoreEntry[config.recordIdKey], '');
                if (!recordId) {
                    return;
                }

                if (!Array.isArray(index[config.sourceRecordType][recordId])) {
                    index[config.sourceRecordType][recordId] = [];
                }

                index[config.sourceRecordType][recordId].push({
                    domainId: config.domainId,
                    fieldId: config.fieldId,
                    value: clamp01(scoreEntry.value)
                });
            });

            return index;
        }, {});
    }

    function buildRhythmRecordScoreIndex(domainLayers = {}) {
        return RHYTHM_FIELD_SOURCE_CONFIG.reduce((index, config) => {
            const domain = isPlainObject(domainLayers[config.domainId]) ? domainLayers[config.domainId] : {};
            const field = isPlainObject(domain[config.fieldId]) ? domain[config.fieldId] : null;
            const scoreEntries = Array.isArray(field && field[config.collectionKey]) ? field[config.collectionKey] : [];

            if (!index[config.sourceRecordType]) {
                index[config.sourceRecordType] = {};
            }

            scoreEntries.forEach((scoreEntry) => {
                const recordId = normalizeString(scoreEntry && scoreEntry[config.recordIdKey], '');
                if (!recordId) {
                    return;
                }

                if (!Array.isArray(index[config.sourceRecordType][recordId])) {
                    index[config.sourceRecordType][recordId] = [];
                }

                index[config.sourceRecordType][recordId].push({
                    domainId: config.domainId,
                    fieldId: config.fieldId,
                    value: clamp01(scoreEntry.value)
                });
            });

            return index;
        }, {});
    }

    function getBindingLayer(input = {}) {
        if (isPlainObject(input.phase2RecordBindingLayer)) {
            return input.phase2RecordBindingLayer;
        }

        if (isPlainObject(input.recordBindingLayer)) {
            return input.recordBindingLayer;
        }

        if (isPlainObject(input.phase2InputBundle) && typeof phase2.createPhase2RecordBindingLayer === 'function') {
            return phase2.createPhase2RecordBindingLayer(input.phase2InputBundle);
        }

        return null;
    }

    function getContextEntry(bindingLayer, recordType, recordId) {
        const primaryTable = isPlainObject(bindingLayer && bindingLayer.primaryCarrierContextTables)
            ? bindingLayer.primaryCarrierContextTables.byRecordType
            : null;
        const secondaryTable = isPlainObject(bindingLayer && bindingLayer.secondaryContextTables)
            ? bindingLayer.secondaryContextTables.byRecordType
            : null;

        if (isPlainObject(primaryTable && primaryTable[recordType] && primaryTable[recordType].byRecordId)) {
            const entry = primaryTable[recordType].byRecordId[recordId];
            if (isPlainObject(entry)) {
                return entry;
            }
        }

        if (isPlainObject(secondaryTable && secondaryTable[recordType] && secondaryTable[recordType].byRecordId)) {
            const entry = secondaryTable[recordType].byRecordId[recordId];
            if (isPlainObject(entry)) {
                return entry;
            }
        }

        return null;
    }

    function collectRefsFromRefMap(refMap, pushRef) {
        if (!isPlainObject(refMap)) {
            return;
        }

        Object.entries(refMap).forEach(([recordType, recordIds]) => {
            uniqueStrings(recordIds).forEach((recordId) => {
                pushRef(recordType, recordId);
            });
        });
    }

    function collectRefsFromMixedBuckets(mixedCanonicalRefs, pushRef) {
        if (!isPlainObject(mixedCanonicalRefs)) {
            return;
        }

        Object.values(mixedCanonicalRefs).forEach((bucket) => {
            if (!isPlainObject(bucket)) {
                return;
            }

            collectRefsFromRefMap(bucket.primaryCarrierRefs, pushRef);
            collectRefsFromRefMap(bucket.secondaryContextRefs, pushRef);
            if (Array.isArray(bucket.orderedRefs)) {
                bucket.orderedRefs.forEach((entry) => {
                    pushRef(entry && entry.recordType, entry && entry.recordId);
                });
            }
        });
    }

    function collectPressureSourceRefs(bindingLayer, recordType, recordId, accumulator = null, visited = null) {
        const sourceRefs = accumulator || {};
        const visitedKeys = visited || new Set();
        const normalizedRecordType = normalizeString(recordType, '');
        const normalizedRecordId = normalizeString(recordId, '');
        const visitKey = `${normalizedRecordType}:${normalizedRecordId}`;

        if (!normalizedRecordType || !normalizedRecordId || visitedKeys.has(visitKey)) {
            return sourceRefs;
        }

        visitedKeys.add(visitKey);

        if (isPlainObject(sourceRefs[normalizedRecordType]) === false) {
            sourceRefs[normalizedRecordType] = {};
        }
        sourceRefs[normalizedRecordType][normalizedRecordId] = true;

        const contextEntry = getContextEntry(bindingLayer, normalizedRecordType, normalizedRecordId);
        if (!isPlainObject(contextEntry)) {
            return sourceRefs;
        }

        const pushRef = (linkedRecordType, linkedRecordId) => {
            const normalizedLinkedRecordType = normalizeString(linkedRecordType, '');
            const normalizedLinkedRecordId = normalizeString(linkedRecordId, '');
            if (!normalizedLinkedRecordType || !normalizedLinkedRecordId) {
                return;
            }

            collectPressureSourceRefs(
                bindingLayer,
                normalizedLinkedRecordType,
                normalizedLinkedRecordId,
                sourceRefs,
                visitedKeys
            );
        };

        collectRefsFromRefMap(contextEntry.primaryCarrierLeadRefs, pushRef);
        collectRefsFromRefMap(contextEntry.primaryCarrierRefs, pushRef);
        collectRefsFromRefMap(contextEntry.secondaryContextRefs, pushRef);
        collectRefsFromMixedBuckets(contextEntry.mixedCanonicalRefs, pushRef);

        return sourceRefs;
    }

    function buildRecordPressureEntries(recordType, recordId, pressureRecordScoreIndex = {}, bindingLayer = null) {
        const sourceRefs = bindingLayer
            ? collectPressureSourceRefs(bindingLayer, recordType, recordId)
            : { [recordType]: { [recordId]: true } };
        const aggregatedEntries = [];

        Object.entries(sourceRefs).forEach(([sourceRecordType, recordIdMap]) => {
            const recordIndex = isPlainObject(pressureRecordScoreIndex[sourceRecordType])
                ? pressureRecordScoreIndex[sourceRecordType]
                : {};
            Object.keys(recordIdMap).forEach((linkedRecordId) => {
                const entries = Array.isArray(recordIndex[linkedRecordId]) ? recordIndex[linkedRecordId] : [];
                entries.forEach((entry) => {
                    aggregatedEntries.push({
                        ...entry,
                        sourceRecordType,
                        sourceRecordId: linkedRecordId
                    });
                });
            });
        });

        const groupedByField = aggregatedEntries.reduce((grouped, entry) => {
            const key = `${entry.domainId}:${entry.fieldId}`;
            if (!Array.isArray(grouped[key])) {
                grouped[key] = [];
            }
            grouped[key].push(entry.value);
            return grouped;
        }, {});

        return Object.entries(groupedByField).map(([key, values]) => {
            const [domainId, fieldId] = key.split(':');
            return {
                domainId,
                fieldId,
                value: roundValue(mean(values))
            };
        });
    }

    function buildRecordRhythmEntries(recordType, recordId, rhythmRecordScoreIndex = {}, bindingLayer = null) {
        const sourceRefs = bindingLayer
            ? collectPressureSourceRefs(bindingLayer, recordType, recordId)
            : { [recordType]: { [recordId]: true } };
        const aggregatedEntries = [];

        Object.entries(sourceRefs).forEach(([sourceRecordType, recordIdMap]) => {
            const recordIndex = isPlainObject(rhythmRecordScoreIndex[sourceRecordType])
                ? rhythmRecordScoreIndex[sourceRecordType]
                : {};
            Object.keys(recordIdMap).forEach((linkedRecordId) => {
                const entries = Array.isArray(recordIndex[linkedRecordId]) ? recordIndex[linkedRecordId] : [];
                entries.forEach((entry) => {
                    aggregatedEntries.push({
                        ...entry,
                        sourceRecordType,
                        sourceRecordId: linkedRecordId
                    });
                });
            });
        });

        const groupedByField = aggregatedEntries.reduce((grouped, entry) => {
            const key = `${entry.domainId}:${entry.fieldId}`;
            if (!Array.isArray(grouped[key])) {
                grouped[key] = [];
            }
            grouped[key].push(entry.value);
            return grouped;
        }, {});

        return Object.entries(groupedByField).map(([key, values]) => {
            const [domainId, fieldId] = key.split(':');
            return {
                domainId,
                fieldId,
                value: roundValue(mean(values))
            };
        });
    }

    function buildRecordBoundPressureProfile(recordType, recordId, sourcePackageId, pressureRecordScoreIndex, bindingLayer) {
        const pressureEntries = rankEntriesByValue(
            buildRecordPressureEntries(recordType, recordId, pressureRecordScoreIndex, bindingLayer),
            4
        );
        const pressureSignals = pressureEntries.reduce((signals, entry) => {
            signals[entry.fieldId] = entry.value;
            return signals;
        }, {});
        const dominantEnvironmentalTraits = pressureEntries
            .slice(0, 3)
            .map((entry) => `${entry.fieldId}_pressure`);
        const summary = pressureEntries.length
            ? `Pressure profile is led by ${summarizeRankedFields(pressureEntries)}.`
            : 'Pressure profile has no direct burden evidence yet.';

        return createRecordBoundSummaryScaffold({
            profileId: `${recordType}:${recordId}`,
            recordType,
            recordId,
            sourcePackageId,
            pressureSignals,
            rhythmSignals: {},
            dominantEnvironmentalTraits,
            summary
        }).profile;
    }

    function buildPressureRecordBoundProfiles(bindingLayer, sourcePackageId, pressureRecordScoreIndex = {}) {
        if (!isPlainObject(bindingLayer) || !isPlainObject(bindingLayer.summarySurfaceTables)) {
            return [];
        }

        const perRecord = isPlainObject(bindingLayer.summarySurfaceTables.perRecord)
            ? bindingLayer.summarySurfaceTables.perRecord
            : {};
        const directRecordProfiles = isPlainObject(perRecord.directRecordProfiles)
            ? perRecord.directRecordProfiles.recordIdsByType
            : {};
        const derivativeRecordProfiles = isPlainObject(perRecord.derivativeRecordProfiles)
            ? perRecord.derivativeRecordProfiles.recordIdsByType
            : {};
        const mergedRecordIdsByType = {
            ...cloneValue(directRecordProfiles),
            ...cloneValue(derivativeRecordProfiles)
        };

        return Object.entries(mergedRecordIdsByType).flatMap(([recordType, recordIds]) => (
            uniqueStrings(recordIds).map((recordId) => buildRecordBoundPressureProfile(
                recordType,
                recordId,
                sourcePackageId,
                pressureRecordScoreIndex,
                bindingLayer
            ))
        ));
    }

    function buildRecordBoundRhythmProfile(recordType, recordId, sourcePackageId, rhythmRecordScoreIndex, bindingLayer) {
        const rhythmEntries = rankEntriesByValue(
            buildRecordRhythmEntries(recordType, recordId, rhythmRecordScoreIndex, bindingLayer),
            4
        );
        const rhythmSignals = rhythmEntries.reduce((signals, entry) => {
            signals[entry.fieldId] = entry.value;
            return signals;
        }, {});
        const dominantEnvironmentalTraits = rhythmEntries
            .slice(0, 3)
            .map((entry) => `${entry.fieldId}_rhythm`);
        const summary = rhythmEntries.length
            ? `Rhythm profile is shaped by ${summarizeRankedFields(rhythmEntries)}.`
            : 'Rhythm profile has no direct timing evidence yet.';

        return createRecordBoundSummaryScaffold({
            profileId: `${recordType}:${recordId}`,
            recordType,
            recordId,
            sourcePackageId,
            pressureSignals: {},
            rhythmSignals,
            dominantEnvironmentalTraits,
            summary
        }).profile;
    }

    function buildRhythmRecordBoundProfiles(bindingLayer, sourcePackageId, rhythmRecordScoreIndex = {}) {
        if (!isPlainObject(bindingLayer) || !isPlainObject(bindingLayer.summarySurfaceTables)) {
            return [];
        }

        const perRecord = isPlainObject(bindingLayer.summarySurfaceTables.perRecord)
            ? bindingLayer.summarySurfaceTables.perRecord
            : {};
        const directRecordProfiles = isPlainObject(perRecord.directRecordProfiles)
            ? perRecord.directRecordProfiles.recordIdsByType
            : {};
        const derivativeRecordProfiles = isPlainObject(perRecord.derivativeRecordProfiles)
            ? perRecord.derivativeRecordProfiles.recordIdsByType
            : {};
        const mergedRecordIdsByType = {
            ...cloneValue(directRecordProfiles),
            ...cloneValue(derivativeRecordProfiles)
        };

        return Object.entries(mergedRecordIdsByType).flatMap(([recordType, recordIds]) => (
            uniqueStrings(recordIds).map((recordId) => buildRecordBoundRhythmProfile(
                recordType,
                recordId,
                sourcePackageId,
                rhythmRecordScoreIndex,
                bindingLayer
            ))
        ));
    }

    function createPressureSummaryGeneratorOutputSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            pressure: createPressureSummaryScaffold(normalizedOverrides.pressure),
            recordBoundProfiles: Array.isArray(normalizedOverrides.recordBoundProfiles)
                ? cloneValue(normalizedOverrides.recordBoundProfiles)
                : [],
            metadata: {
                summaryStatus: IMPLEMENTED_PRESSURE_SUMMARY_STATUS,
                contractFirst: true,
                pressureSemanticsOnly: true,
                rhythmMeaningIncluded: false,
                silentlyDriftsContracts: false,
                ...(isPlainObject(normalizedOverrides.metadata) ? cloneValue(normalizedOverrides.metadata) : {})
            }
        });
    }

    function createPressureSummaryGenerator(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const deterministicSeed = Object.prototype.hasOwnProperty.call(normalizedOptions, 'deterministicSeed')
            ? normalizedOptions.deterministicSeed
            : null;

        return Object.freeze({
            generatorId: PRESSURE_SUMMARY_GENERATOR_ID,
            version: SUMMARY_SCAFFOLD_VERSION,
            phaseId: PHASE_ID,
            deterministic: true,
            deterministicSeed,
            run(input = {}) {
                const pressureOutput = getPressureSynthesisOutput(input, deterministicSeed);
                const synthesized = isPlainObject(pressureOutput.synthesized) ? pressureOutput.synthesized : {};
                const domainLayers = isPlainObject(pressureOutput.domainLayers) ? pressureOutput.domainLayers : {};
                const synthesizedEntries = buildPressureSynthesizedMeanEntries(synthesized);
                const domainEntries = buildPressureDomainMeanEntries(domainLayers);
                const sourcePackageId = normalizeString(
                    input.sourcePressureFieldPackageId,
                    normalizeString(
                        pressureOutput.metadata && pressureOutput.metadata.sourcePackageId,
                        normalizeString(input.pressureFieldPackage && input.pressureFieldPackage.packageId, '')
                    )
                );
                const bindingLayer = getBindingLayer(input);
                const pressureRecordScoreIndex = buildPressureRecordScoreIndex(domainLayers);
                const recordBoundProfiles = buildPressureRecordBoundProfiles(
                    bindingLayer,
                    sourcePackageId,
                    pressureRecordScoreIndex
                );

                return createPressureSummaryGeneratorOutputSkeleton({
                    pressure: {
                        sourcePressureFieldPackageId: sourcePackageId,
                        summaries: {
                            pressureSummary: buildPressureSummaryText('pressureSummary', synthesizedEntries, domainEntries),
                            traversalSummary: buildPressureSummaryText('traversalSummary', synthesizedEntries, domainEntries),
                            survivalSummary: buildPressureSummaryText('survivalSummary', synthesizedEntries, domainEntries),
                            fragilitySummary: buildPressureSummaryText('fragilitySummary', synthesizedEntries, domainEntries)
                        },
                        metadata: {
                            summaryStatus: IMPLEMENTED_PRESSURE_SUMMARY_STATUS,
                            contractFirst: true,
                            inventsNarrative: false,
                            pressureSemanticsOnly: true,
                            silentlyDriftsContracts: false,
                            synthesizedFieldIds: synthesizedEntries.map((entry) => entry.fieldId),
                            supportingDomainFieldIds: rankEntriesByValue(domainEntries, domainEntries.length).map((entry) => entry.fieldId)
                        }
                    },
                    recordBoundProfiles,
                    metadata: {
                        sourcePressureFieldPackageId: sourcePackageId,
                        recordBoundProfileCount: recordBoundProfiles.length,
                        rhythmMeaningIncluded: false,
                        pressureSemanticsOnly: true,
                        recordBindingContextId: normalizeString(
                            pressureOutput.metadata && pressureOutput.metadata.recordBindingContextId,
                            normalizeString(bindingLayer && bindingLayer.recordBindingContextId, '')
                        )
                    }
                });
            }
        });
    }

    function createRhythmSummaryGeneratorOutputSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            rhythm: createRhythmSummaryScaffold(normalizedOverrides.rhythm),
            recordBoundProfiles: Array.isArray(normalizedOverrides.recordBoundProfiles)
                ? cloneValue(normalizedOverrides.recordBoundProfiles)
                : [],
            metadata: {
                summaryStatus: IMPLEMENTED_RHYTHM_SUMMARY_STATUS,
                contractFirst: true,
                rhythmSemanticsOnly: true,
                pressureMeaningIncluded: false,
                silentlyDriftsContracts: false,
                ...(isPlainObject(normalizedOverrides.metadata) ? cloneValue(normalizedOverrides.metadata) : {})
            }
        });
    }

    function createRhythmSummaryGenerator(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const deterministicSeed = Object.prototype.hasOwnProperty.call(normalizedOptions, 'deterministicSeed')
            ? normalizedOptions.deterministicSeed
            : null;

        return Object.freeze({
            generatorId: RHYTHM_SUMMARY_GENERATOR_ID,
            version: SUMMARY_SCAFFOLD_VERSION,
            phaseId: PHASE_ID,
            deterministic: true,
            deterministicSeed,
            run(input = {}) {
                const rhythmOutput = getEnvironmentalRhythmSynthesisOutput(input, deterministicSeed);
                const synthesized = isPlainObject(rhythmOutput.synthesized) ? rhythmOutput.synthesized : {};
                const domainLayers = isPlainObject(rhythmOutput.domainLayers) ? rhythmOutput.domainLayers : {};
                const synthesizedEntries = buildRhythmSynthesizedMeanEntries(synthesized);
                const domainEntries = buildRhythmDomainMeanEntries(domainLayers);
                const sourcePackageId = normalizeString(
                    input.sourceEnvironmentalRhythmPackageId,
                    normalizeString(
                        rhythmOutput.metadata && rhythmOutput.metadata.sourcePackageId,
                        normalizeString(input.environmentalRhythmPackage && input.environmentalRhythmPackage.packageId, '')
                    )
                );
                const bindingLayer = getBindingLayer(input);
                const rhythmRecordScoreIndex = buildRhythmRecordScoreIndex(domainLayers);
                const recordBoundProfiles = buildRhythmRecordBoundProfiles(
                    bindingLayer,
                    sourcePackageId,
                    rhythmRecordScoreIndex
                );

                return createRhythmSummaryGeneratorOutputSkeleton({
                    rhythm: {
                        sourceEnvironmentalRhythmPackageId: sourcePackageId,
                        summaries: {
                            rhythmSummary: buildRhythmSummaryText('rhythmSummary', synthesizedEntries, domainEntries),
                            timingSummary: buildRhythmSummaryText('timingSummary', synthesizedEntries, domainEntries),
                            recoverySummary: buildRhythmSummaryText('recoverySummary', synthesizedEntries, domainEntries),
                            windowSummary: buildRhythmSummaryText('windowSummary', synthesizedEntries, domainEntries)
                        },
                        metadata: {
                            summaryStatus: IMPLEMENTED_RHYTHM_SUMMARY_STATUS,
                            contractFirst: true,
                            inventsNarrative: false,
                            recoveryExplicitnessPreserved: true,
                            silentlyDriftsContracts: false,
                            synthesizedFieldIds: synthesizedEntries.map((entry) => entry.fieldId),
                            supportingDomainFieldIds: rankEntriesByValue(domainEntries, domainEntries.length).map((entry) => entry.fieldId)
                        }
                    },
                    recordBoundProfiles,
                    metadata: {
                        sourceEnvironmentalRhythmPackageId: sourcePackageId,
                        recordBoundProfileCount: recordBoundProfiles.length,
                        pressureMeaningIncluded: false,
                        rhythmSemanticsOnly: true,
                        recordBindingContextId: normalizeString(
                            rhythmOutput.metadata && rhythmOutput.metadata.recordBindingContextId,
                            normalizeString(bindingLayer && bindingLayer.recordBindingContextId, '')
                        )
                    }
                });
            }
        });
    }

    function createPressureSummaryScaffold(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            generatorId: PRESSURE_SUMMARY_GENERATOR_ID,
            phaseId: PHASE_ID,
            sourcePressureFieldPackageId: normalizeString(normalizedOverrides.sourcePressureFieldPackageId, ''),
            summaries: {
                ...createKeyedObject(getPressureSummaryKeys(), ''),
                ...(isPlainObject(normalizedOverrides.summaries)
                    ? cloneValue(normalizedOverrides.summaries)
                    : {})
            },
            metadata: {
                summaryStatus: normalizeString(normalizedOverrides.summaryStatus, SUMMARY_STATUS),
                contractFirst: true,
                inventsNarrative: false,
                pressureSemanticsOnly: true,
                silentlyDriftsContracts: false,
                requiredSummaryKeys: getPressureSummaryKeys(),
                ...(isPlainObject(normalizedOverrides.metadata) ? cloneValue(normalizedOverrides.metadata) : {})
            }
        });
    }

    function createRhythmSummaryScaffold(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            generatorId: RHYTHM_SUMMARY_GENERATOR_ID,
            phaseId: PHASE_ID,
            sourceEnvironmentalRhythmPackageId: normalizeString(
                normalizedOverrides.sourceEnvironmentalRhythmPackageId,
                ''
            ),
            summaries: {
                ...createKeyedObject(getRhythmSummaryKeys(), ''),
                ...(isPlainObject(normalizedOverrides.summaries)
                    ? cloneValue(normalizedOverrides.summaries)
                    : {})
            },
            metadata: {
                summaryStatus: normalizeString(normalizedOverrides.summaryStatus, SUMMARY_STATUS),
                contractFirst: true,
                inventsNarrative: false,
                recoveryExplicitnessPreserved: true,
                silentlyDriftsContracts: false,
                requiredSummaryKeys: getRhythmSummaryKeys(),
                ...(isPlainObject(normalizedOverrides.metadata) ? cloneValue(normalizedOverrides.metadata) : {})
            }
        });
    }

    function createPhaseLevelSummaryScaffold(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        const phaseSummaries = isPlainObject(normalizedOverrides.summaries)
            ? cloneValue(normalizedOverrides.summaries)
            : {};
        return deepFreeze({
            generatorId: PHASE_LEVEL_SUMMARY_GENERATOR_ID,
            phaseId: PHASE_ID,
            sourcePressureFieldPackageId: normalizeString(normalizedOverrides.sourcePressureFieldPackageId, ''),
            sourceEnvironmentalRhythmPackageId: normalizeString(
                normalizedOverrides.sourceEnvironmentalRhythmPackageId,
                ''
            ),
            sourceValidationReportId: normalizeString(normalizedOverrides.sourceValidationReportId, ''),
            summaries: {
                pressure: normalizeString(phaseSummaries.pressure, ''),
                rhythm: normalizeString(phaseSummaries.rhythm, ''),
                phase: normalizeString(phaseSummaries.phase, ''),
                validation: normalizeString(phaseSummaries.validation, '')
            },
            metadata: {
                summaryStatus: SUMMARY_STATUS,
                contractFirst: true,
                inventsNarrative: false,
                pressureRhythmSeparationPreserved: true,
                silentlyDriftsContracts: false
            }
        });
    }

    function createRecordBoundSummaryScaffold(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        const profileFactory = typeof phase2.createRecordBoundProfileSkeleton === 'function'
            ? phase2.createRecordBoundProfileSkeleton
            : null;
        const profileSkeleton = profileFactory
            ? profileFactory({
                profileId: normalizeString(normalizedOverrides.profileId, ''),
                recordType: normalizeString(normalizedOverrides.recordType, ''),
                recordId: normalizeString(normalizedOverrides.recordId, ''),
                sourcePackageId: normalizeString(normalizedOverrides.sourcePackageId, ''),
                pressureSignals: isPlainObject(normalizedOverrides.pressureSignals)
                    ? cloneValue(normalizedOverrides.pressureSignals)
                    : {},
                rhythmSignals: isPlainObject(normalizedOverrides.rhythmSignals)
                    ? cloneValue(normalizedOverrides.rhythmSignals)
                    : {},
                dominantEnvironmentalTraits: Array.isArray(normalizedOverrides.dominantEnvironmentalTraits)
                    ? cloneValue(normalizedOverrides.dominantEnvironmentalTraits)
                    : [],
                summary: normalizeString(normalizedOverrides.summary, '')
            })
            : deepFreeze({
                profileId: normalizeString(normalizedOverrides.profileId, ''),
                recordType: normalizeString(normalizedOverrides.recordType, ''),
                recordId: normalizeString(normalizedOverrides.recordId, ''),
                sourcePackageId: normalizeString(normalizedOverrides.sourcePackageId, ''),
                pressureSignals: isPlainObject(normalizedOverrides.pressureSignals)
                    ? cloneValue(normalizedOverrides.pressureSignals)
                    : {},
                rhythmSignals: isPlainObject(normalizedOverrides.rhythmSignals)
                    ? cloneValue(normalizedOverrides.rhythmSignals)
                    : {},
                dominantEnvironmentalTraits: Array.isArray(normalizedOverrides.dominantEnvironmentalTraits)
                    ? cloneValue(normalizedOverrides.dominantEnvironmentalTraits)
                    : [],
                summary: normalizeString(normalizedOverrides.summary, '')
            });

        return deepFreeze({
            generatorId: RECORD_BOUND_SUMMARY_GENERATOR_ID,
            profile: cloneValue(profileSkeleton),
            metadata: {
                summaryStatus: SUMMARY_STATUS,
                contractFirst: true,
                inventsNarrative: false,
                silentlyDriftsContracts: false,
                canonicalRecordBindingRequired: true,
                allowedRecordTypes: getCanonicalRecordTypeIds()
            }
        });
    }

    function createPhase2SummaryGeneratorScaffold(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            summaryGeneratorId: 'Phase2SummaryGeneratorScaffold',
            version: SUMMARY_SCAFFOLD_VERSION,
            phaseId: PHASE_ID,
            pressure: createPressureSummaryScaffold(normalizedOverrides.pressure),
            rhythm: createRhythmSummaryScaffold(normalizedOverrides.rhythm),
            phaseLevel: createPhaseLevelSummaryScaffold(normalizedOverrides.phaseLevel),
            recordBound: createRecordBoundSummaryScaffold(normalizedOverrides.recordBound),
            metadata: {
                summaryStatus: SUMMARY_STATUS,
                contractFirst: true,
                inventsNarrative: false,
                pressureRhythmSeparationPreserved: true,
                silentlyDriftsContracts: false
            }
        });
    }

    function getPhase2SummaryModuleStub() {
        return STUB;
    }

    phase2.__contractFirstStubs = phase2.__contractFirstStubs || {};
    phase2.__contractFirstStubs[GROUP_ID] = STUB;

    Object.assign(phase2, {
        getPhase2SummaryModuleStub,
        createPressureSummaryScaffold,
        createPressureSummaryGeneratorOutputSkeleton,
        createPressureSummaryGenerator,
        createRhythmSummaryScaffold,
        createRhythmSummaryGeneratorOutputSkeleton,
        createRhythmSummaryGenerator,
        createPhaseLevelSummaryScaffold,
        createRecordBoundSummaryScaffold,
        createPhase2SummaryGeneratorScaffold
    });
})();
