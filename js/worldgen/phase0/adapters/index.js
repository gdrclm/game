(() => {
    const game = window.Game;
    const phase0 = game.systems.worldgenPhase0 = game.systems.worldgenPhase0 || {};
    const adapterIds = Object.freeze([
        'phase1SafeSummaryBundle',
        'frozenOutputWrappers',
        'phase1SeedBridge',
        'orchestrationBridge',
        'freezeWrapper'
    ]);
    const PHASE1_SAFE_SUMMARY_EXPORT_KIND = 'phase0.phase1_safe_summary_bundle';
    const FROZEN_OUTPUT_WRAPPERS_EXPORT_KIND = 'phase0.frozen_output_wrappers';
    const PHASE1_SAFE_GEOGRAPHY_HINT_FIELD_IDS = Object.freeze([
        'maritimeDependence',
        'routeFragilityBias',
        'centralizationBias',
        'environmentalVolatility',
        'collapseIntensity',
        'culturalPermeability'
    ]);

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

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function unwrapPhase0AdapterInput(input = {}) {
        if (!isPlainObject(input)) {
            return {};
        }

        if (isPlainObject(input.phase0Bundle)) {
            return input.phase0Bundle;
        }

        if (isPlainObject(input.bundle)) {
            return input.bundle;
        }

        return input;
    }

    function pickComponent(input, canonicalKey, aliasKeys = []) {
        if (!isPlainObject(input)) {
            return {};
        }

        if (Object.prototype.hasOwnProperty.call(input, canonicalKey)) {
            return input[canonicalKey];
        }

        for (const aliasKey of aliasKeys) {
            if (Object.prototype.hasOwnProperty.call(input, aliasKey)) {
                return input[aliasKey];
            }
        }

        return {};
    }

    function normalizePhase1SafeSummarySource(input = {}) {
        const source = unwrapPhase0AdapterInput(input);

        if (typeof phase0.assemblePhase0Bundle !== 'function') {
            throw new Error('[worldgen/phase0] Phase 1-safe summary bundle export requires assemblePhase0Bundle().');
        }

        return phase0.assemblePhase0Bundle({
            worldSeedProfile: pickComponent(source, 'worldSeedProfile', [
                'profile',
                'seedProfile'
            ]),
            derivedWorldTendencies: pickComponent(source, 'derivedWorldTendencies', [
                'tendencies',
                'derivedTendencies'
            ]),
            worldSubSeedMap: pickComponent(source, 'worldSubSeedMap', [
                'subSeedMap',
                'subSeeds'
            ]),
            validationReport: pickComponent(source, 'validationReport', [
                'report',
                'phase0ValidationReport'
            ])
        });
    }

    function getPhase0AdapterIds() {
        return adapterIds.slice();
    }

    function getPhase1SafeSummaryBundleContract() {
        return deepFreeze({
            exportKind: PHASE1_SAFE_SUMMARY_EXPORT_KIND,
            requiredKeys: Object.freeze([
                'exportKind',
                'phaseId',
                'phaseVersion',
                'freezePoint',
                'immutable',
                'phase1Input',
                'summary'
            ]),
            phase1InputShape: Object.freeze([
                'worldSeedProfile',
                'derivedWorldTendencies',
                'macroGeographySeed'
            ]),
            summaryShape: Object.freeze([
                'worldSeed',
                'worldTone',
                'macroGeographySeed',
                'likelyWorldPattern',
                'likelyConflictMode',
                'likelyArchipelagoRole',
                'geographyBiasSnapshot'
            ]),
            geographyBiasSnapshotShape: PHASE1_SAFE_GEOGRAPHY_HINT_FIELD_IDS.slice()
        });
    }

    function buildPhase1SafeSummaryBundle(input = {}) {
        const bundle = normalizePhase1SafeSummarySource(input);
        const worldSeedProfile = bundle.worldSeedProfile;
        const derivedWorldTendencies = bundle.derivedWorldTendencies;
        const worldSubSeedMap = bundle.worldSubSeedMap;
        const geographyBiasSnapshot = PHASE1_SAFE_GEOGRAPHY_HINT_FIELD_IDS.reduce((snapshot, fieldId) => {
            snapshot[fieldId] = worldSeedProfile[fieldId];
            return snapshot;
        }, {});

        return deepFreeze({
            exportKind: PHASE1_SAFE_SUMMARY_EXPORT_KIND,
            phaseId: phase0.phaseId || 'phase0',
            phaseVersion: phase0.phaseVersion || 'phase0-v1',
            freezePoint: 'A',
            immutable: true,
            phase1Input: {
                worldSeedProfile,
                derivedWorldTendencies,
                macroGeographySeed: worldSubSeedMap.macroGeographySeed
            },
            summary: {
                worldSeed: worldSeedProfile.worldSeed,
                worldTone: worldSeedProfile.worldTone,
                macroGeographySeed: worldSubSeedMap.macroGeographySeed,
                likelyWorldPattern: derivedWorldTendencies.likelyWorldPattern,
                likelyConflictMode: derivedWorldTendencies.likelyConflictMode,
                likelyArchipelagoRole: derivedWorldTendencies.likelyArchipelagoRole,
                geographyBiasSnapshot
            }
        });
    }

    function getFrozenPhase0OutputWrappersContract() {
        return deepFreeze({
            exportKind: FROZEN_OUTPUT_WRAPPERS_EXPORT_KIND,
            requiredKeys: Object.freeze([
                'exportKind',
                'phaseId',
                'phaseVersion',
                'freezePoint',
                'handoffSemantics',
                'immutable',
                'outputs'
            ]),
            outputsShape: Object.freeze([
                'phase0Bundle',
                'phase1SafeSummaryBundle'
            ]),
            handoffSemantics: 'read_only_frozen'
        });
    }

    function buildFrozenPhase0OutputWrappers(input = {}) {
        const phase0Bundle = normalizePhase1SafeSummarySource(input);
        const phase1SafeSummaryBundle = buildPhase1SafeSummaryBundle(phase0Bundle);

        return deepFreeze({
            exportKind: FROZEN_OUTPUT_WRAPPERS_EXPORT_KIND,
            phaseId: phase0.phaseId || 'phase0',
            phaseVersion: phase0.phaseVersion || 'phase0-v1',
            freezePoint: 'A',
            handoffSemantics: 'read_only_frozen',
            immutable: true,
            outputs: {
                phase0Bundle,
                phase1SafeSummaryBundle
            }
        });
    }

    function createPhase0OrchestrationAdapter() {
        throw typeof phase0.createTodoContractedError === 'function'
            ? phase0.createTodoContractedError('adapters.createPhase0OrchestrationAdapter')
            : new Error('[worldgen/phase0] TODO CONTRACTED stub.');
    }

    if (typeof phase0.registerModule === 'function') {
        phase0.registerModule('adapters', {
            entry: 'buildFrozenPhase0OutputWrappers',
            file: 'js/worldgen/phase0/adapters/index.js',
            description: 'Phase 0 adapter layer for immutable handoff wrappers plus a Phase 1-safe summary bundle export.',
            stub: false
        });
    }

    Object.assign(phase0, {
        getPhase0AdapterIds,
        getPhase1SafeSummaryBundleContract,
        buildPhase1SafeSummaryBundle,
        getFrozenPhase0OutputWrappersContract,
        buildFrozenPhase0OutputWrappers,
        createPhase0OrchestrationAdapter
    });
})();
