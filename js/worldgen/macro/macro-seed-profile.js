(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const CONTRACT_ID = 'macroSeedProfile';
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';
    const PRESSURE_FIELDS = Object.freeze([
        'conflictPressure',
        'maritimeDependence',
        'environmentalVolatility',
        'coastJaggedness',
        'collapseIntensity'
    ]);
    const WORLD_TENDENCY_FIELDS = Object.freeze([
        'likelyWorldPattern',
        'likelyConflictMode',
        'likelyCollapseMode',
        'likelyReligiousPattern',
        'likelyArchipelagoRole'
    ]);
    const ROOT_SEED_ALIAS_KEYS = Object.freeze([
        'worldSeed',
        'seed',
        'baseSeed'
    ]);
    const MACRO_SEED_ALIAS_KEYS = Object.freeze([
        'macroSeed',
        'macroGeographySeed'
    ]);
    const NAMESPACE_ALIAS_KEYS = Object.freeze([
        'seedNamespace',
        'macroSeedNamespace',
        'namespace'
    ]);
    const PHASE1_INPUT_KEYS = Object.freeze([
        'phase1Input'
    ]);
    const NESTED_PROFILE_KEYS = Object.freeze([
        'worldSeedProfile',
        'seedProfile',
        'profile'
    ]);
    const WORLD_TENDENCY_CONTAINER_KEYS = Object.freeze([
        'derivedWorldTendencies',
        'worldTendencies'
    ]);
    const SUMMARY_CONTAINER_KEYS = Object.freeze([
        'summary'
    ]);
    const OUTPUTS_CONTAINER_KEYS = Object.freeze([
        'outputs'
    ]);
    const PHASE0_BUNDLE_KEYS = Object.freeze([
        'phase0Bundle'
    ]);
    const PHASE1_SUMMARY_BUNDLE_KEYS = Object.freeze([
        'phase1SafeSummaryBundle'
    ]);
    const REQUIRED_KEYS = Object.freeze([
        'worldSeed',
        'macroSeed',
        'seedNamespace',
        'worldTone',
        'worldTendencies',
        'conflictPressure',
        'maritimeDependence',
        'environmentalVolatility',
        'coastJaggedness',
        'collapseIntensity'
    ]);
    const DEBUG_ARTIFACT_KIND = 'seedProfileSnapshot';
    const DEFAULT_NAMESPACE = typeof macro.buildMacroSubSeedNamespace === 'function'
        ? macro.buildMacroSubSeedNamespace()
        : 'macro';

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
            return value.map(cloneValue);
        }

        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)])
            );
        }

        return value;
    }

    function hasOwn(objectValue, key) {
        return Boolean(objectValue) && Object.prototype.hasOwnProperty.call(objectValue, key);
    }

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function normalizeSeed(seed) {
        return typeof macro.normalizeSeed === 'function'
            ? macro.normalizeSeed(seed)
            : 0;
    }

    function normalizeString(value, fallback = '') {
        return typeof value === 'string' && value.trim()
            ? value.trim()
            : fallback;
    }

    function clampUnitInterval(value) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 0;
        }

        return Math.max(0, Math.min(1, numericValue));
    }

    function getWorldSeedConstraintFieldIds() {
        if (typeof macro.getPhase1SeedConstraintFieldIds === 'function') {
            return macro.getPhase1SeedConstraintFieldIds();
        }

        return PRESSURE_FIELDS.slice();
    }

    function getConstraintBoundsDescriptor(fieldId) {
        if (typeof macro.getPhase1SeedConstraintDescriptor === 'function') {
            return macro.getPhase1SeedConstraintDescriptor(fieldId);
        }

        if (!PRESSURE_FIELDS.includes(fieldId)) {
            throw new Error(`[worldgen/macro] Unknown world seed constraint field "${fieldId}".`);
        }

        return {
            min: 0,
            max: 1,
            defaultValue: 0.5,
            normalization: 'clamp',
            affectsLayers: ['physical', 'macro']
        };
    }

    function getDefaultWorldSeedConstraintBounds() {
        if (typeof macro.getPhase1SeedConstraintBounds === 'function') {
            return macro.getPhase1SeedConstraintBounds();
        }

        return getWorldSeedConstraintFieldIds().reduce((bounds, fieldId) => {
            bounds[fieldId] = cloneValue(getConstraintBoundsDescriptor(fieldId));
            return bounds;
        }, {});
    }

    function normalizeWorldSeedConstraintValue(fieldId, value, boundsOverride = {}) {
        if (typeof macro.normalizePhase1SeedConstraintValue === 'function') {
            return macro.normalizePhase1SeedConstraintValue(fieldId, value, boundsOverride);
        }

        const baseDescriptor = getConstraintBoundsDescriptor(fieldId);
        const normalizedBoundsOverride = isPlainObject(boundsOverride) ? boundsOverride : {};
        const min = Number.isFinite(normalizedBoundsOverride.min)
            ? normalizedBoundsOverride.min
            : baseDescriptor.min;
        const max = Number.isFinite(normalizedBoundsOverride.max)
            ? normalizedBoundsOverride.max
            : baseDescriptor.max;
        const defaultValue = Number.isFinite(normalizedBoundsOverride.defaultValue)
            ? normalizedBoundsOverride.defaultValue
            : baseDescriptor.defaultValue;
        const numericValue = Number(value);

        if (!Number.isFinite(numericValue)) {
            return Math.max(min, Math.min(max, defaultValue));
        }

        return Math.max(min, Math.min(max, numericValue));
    }

    function createDefaultWorldSeedConstraints(overrides = {}) {
        if (typeof macro.createDefaultPhase1SeedConstraints === 'function') {
            return macro.createDefaultPhase1SeedConstraints(overrides);
        }

        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};

        return getWorldSeedConstraintFieldIds().reduce((constraints, fieldId) => {
            constraints[fieldId] = normalizeWorldSeedConstraintValue(
                fieldId,
                normalizedOverrides[fieldId]
            );
            return constraints;
        }, {});
    }

    function normalizeWorldSeedConstraints(input = {}, options = {}) {
        if (typeof macro.normalizePhase1SeedConstraints === 'function') {
            return macro.normalizePhase1SeedConstraints(input, options);
        }

        const normalizedInput = isPlainObject(input) ? input : {};
        const normalizedOptions = isPlainObject(options) ? options : {};
        const boundsOverrides = isPlainObject(normalizedOptions.bounds)
            ? normalizedOptions.bounds
            : {};

        return getWorldSeedConstraintFieldIds().reduce((constraints, fieldId) => {
            constraints[fieldId] = normalizeWorldSeedConstraintValue(
                fieldId,
                normalizedInput[fieldId],
                boundsOverrides[fieldId]
            );
            return constraints;
        }, {});
    }

    function pickFirstDefined(objects, keys) {
        const normalizedObjects = Array.isArray(objects) ? objects : [objects];

        for (let objectIndex = 0; objectIndex < normalizedObjects.length; objectIndex += 1) {
            const objectValue = normalizedObjects[objectIndex];
            if (!isPlainObject(objectValue)) {
                continue;
            }

            for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
                const key = keys[keyIndex];
                if (hasOwn(objectValue, key) && objectValue[key] !== undefined) {
                    return objectValue[key];
                }
            }
        }

        return undefined;
    }

    function extractNestedProfile(input = {}) {
        for (let index = 0; index < NESTED_PROFILE_KEYS.length; index += 1) {
            const key = NESTED_PROFILE_KEYS[index];
            if (isPlainObject(input[key])) {
                return input[key];
            }
        }

        return {};
    }

    function extractNestedObject(input = {}, keys = []) {
        const normalizedInput = isPlainObject(input) ? input : {};

        for (let index = 0; index < keys.length; index += 1) {
            const key = keys[index];
            if (isPlainObject(normalizedInput[key])) {
                return normalizedInput[key];
            }
        }

        return {};
    }

    function getMacroSeedTendencyFieldIds() {
        return WORLD_TENDENCY_FIELDS.slice();
    }

    function createDefaultWorldTendencies(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};

        return WORLD_TENDENCY_FIELDS.reduce((tendencies, fieldId) => {
            tendencies[fieldId] = normalizeString(normalizedOverrides[fieldId], '');
            return tendencies;
        }, {});
    }

    function normalizeWorldTendencies(...sources) {
        const normalizedSources = sources.filter(isPlainObject);

        return WORLD_TENDENCY_FIELDS.reduce((tendencies, fieldId) => {
            tendencies[fieldId] = normalizeString(
                pickFirstDefined(normalizedSources, [fieldId]),
                ''
            );
            return tendencies;
        }, {});
    }

    function resolveMacroSeedProfileContext(input = {}) {
        const envelope = isPlainObject(input) ? input : {};
        const outputsEnvelope = extractNestedObject(envelope, OUTPUTS_CONTAINER_KEYS);
        const phase0Bundle = extractNestedObject(outputsEnvelope, PHASE0_BUNDLE_KEYS);
        const directPhase1SafeSummaryBundle = extractNestedObject(envelope, PHASE1_SUMMARY_BUNDLE_KEYS);
        const phase1SafeSummaryBundle = isPlainObject(directPhase1SafeSummaryBundle) && Object.keys(directPhase1SafeSummaryBundle).length
            ? directPhase1SafeSummaryBundle
            : extractNestedObject(outputsEnvelope, PHASE1_SUMMARY_BUNDLE_KEYS);
        const directPhase1Input = extractNestedObject(envelope, PHASE1_INPUT_KEYS);
        const phase1Input = isPlainObject(directPhase1Input) && Object.keys(directPhase1Input).length
            ? directPhase1Input
            : extractNestedObject(phase1SafeSummaryBundle, PHASE1_INPUT_KEYS);
        const summary = extractNestedObject(phase1SafeSummaryBundle, SUMMARY_CONTAINER_KEYS);

        return {
            envelope,
            outputsEnvelope,
            phase0Bundle,
            phase1SafeSummaryBundle,
            phase1Input,
            summary,
            rootNestedProfile: extractNestedProfile(envelope),
            phase0NestedProfile: extractNestedProfile(phase0Bundle),
            phase1InputProfile: extractNestedProfile(phase1Input),
            rootTendencies: extractNestedObject(envelope, WORLD_TENDENCY_CONTAINER_KEYS),
            phase0BundleTendencies: extractNestedObject(phase0Bundle, WORLD_TENDENCY_CONTAINER_KEYS),
            phase1InputTendencies: extractNestedObject(phase1Input, WORLD_TENDENCY_CONTAINER_KEYS)
        };
    }

    function normalizeSeedNamespace(seedNamespace) {
        if (typeof macro.buildMacroSubSeedNamespace !== 'function') {
            return normalizeString(seedNamespace, DEFAULT_NAMESPACE);
        }

        try {
            if (typeof seedNamespace === 'string' && seedNamespace.trim()) {
                return macro.buildMacroSubSeedNamespace(seedNamespace.trim());
            }
        } catch (error) {
            return DEFAULT_NAMESPACE;
        }

        return DEFAULT_NAMESPACE;
    }

    function resolveMacroSeed(input, worldSeed, seedNamespace) {
        const explicitMacroSeed = pickFirstDefined(input, MACRO_SEED_ALIAS_KEYS);
        if (explicitMacroSeed !== undefined) {
            return normalizeSeed(explicitMacroSeed);
        }

        if (typeof macro.deriveMacroSubSeed === 'function') {
            return macro.deriveMacroSubSeed(worldSeed, seedNamespace);
        }

        return worldSeed;
    }

    function createMacroSeedProfileSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const normalizedConstraints = normalizeWorldSeedConstraints(normalizedInput);
        const worldSeed = normalizeSeed(
            pickFirstDefined(normalizedInput, ROOT_SEED_ALIAS_KEYS)
        );
        const seedNamespace = normalizeSeedNamespace(
            pickFirstDefined(normalizedInput, NAMESPACE_ALIAS_KEYS)
        );

        return {
            worldSeed,
            macroSeed: resolveMacroSeed(normalizedInput, worldSeed, seedNamespace),
            seedNamespace,
            worldTone: normalizeString(normalizedInput.worldTone, ''),
            worldTendencies: createDefaultWorldTendencies(normalizedInput.worldTendencies),
            conflictPressure: normalizedConstraints.conflictPressure,
            maritimeDependence: normalizedConstraints.maritimeDependence,
            environmentalVolatility: normalizedConstraints.environmentalVolatility,
            collapseIntensity: normalizedConstraints.collapseIntensity
        };
    }

    function ingestMacroSeedProfile(input = {}) {
        if (Number.isFinite(input)) {
            return deepFreeze(createMacroSeedProfileSkeleton({
                worldSeed: input
            }));
        }

        const envelope = isPlainObject(input) ? input : {};
        const context = resolveMacroSeedProfileContext(envelope);
        const profileSources = [
            context.envelope,
            context.rootNestedProfile,
            context.phase0Bundle,
            context.phase0NestedProfile,
            context.phase1SafeSummaryBundle,
            context.phase1Input,
            context.phase1InputProfile,
            context.summary
        ];
        const tendencySources = [
            context.phase1InputTendencies,
            context.rootTendencies,
            context.phase0BundleTendencies,
            context.phase1Input,
            context.summary,
            context.envelope,
            context.phase0Bundle
        ];
        const normalizedWorldTendencies = normalizeWorldTendencies(...tendencySources);

        return deepFreeze(createMacroSeedProfileSkeleton({
            worldSeed: pickFirstDefined(profileSources, ROOT_SEED_ALIAS_KEYS),
            macroSeed: pickFirstDefined(profileSources, MACRO_SEED_ALIAS_KEYS),
            seedNamespace: pickFirstDefined(profileSources, NAMESPACE_ALIAS_KEYS),
            worldTone: pickFirstDefined(profileSources, ['worldTone']),
            worldTendencies: normalizedWorldTendencies,
            conflictPressure: pickFirstDefined(profileSources, ['conflictPressure']),
            maritimeDependence: pickFirstDefined(profileSources, ['maritimeDependence']),
            environmentalVolatility: pickFirstDefined(profileSources, ['environmentalVolatility']),
            collapseIntensity: pickFirstDefined(profileSources, ['collapseIntensity'])
        }));
    }

    function serializeMacroSeedProfile(input = {}, options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const normalizedProfile = ingestMacroSeedProfile(input);
        const spacing = normalizedOptions.pretty === false
            ? 0
            : 2;

        return JSON.stringify(cloneValue(normalizedProfile), null, spacing);
    }

    function pushError(errors, message) {
        errors.push(`[${CONTRACT_ID}] ${message}`);
    }

    function validateMacroSeedProfile(candidate) {
        const errors = [];

        if (!isPlainObject(candidate)) {
            pushError(errors, 'Profile root must be a plain object.');
            return {
                contractId: CONTRACT_ID,
                contractVersion: PHASE_VERSION,
                isValid: false,
                errors
            };
        }

        REQUIRED_KEYS.forEach((key) => {
            if (!hasOwn(candidate, key)) {
                pushError(errors, `Missing required key "${key}".`);
            }
        });

        if (hasOwn(candidate, 'worldSeed')) {
            if (!Number.isInteger(candidate.worldSeed) || candidate.worldSeed < 0) {
                pushError(errors, '"worldSeed" must be a non-negative integer.');
            }
        }

        if (hasOwn(candidate, 'macroSeed')) {
            if (!Number.isInteger(candidate.macroSeed) || candidate.macroSeed < 0) {
                pushError(errors, '"macroSeed" must be a non-negative integer.');
            }
        }

        if (hasOwn(candidate, 'seedNamespace')) {
            if (typeof candidate.seedNamespace !== 'string' || !candidate.seedNamespace.trim()) {
                pushError(errors, '"seedNamespace" must be a non-empty string.');
            } else if (typeof macro.buildMacroSubSeedNamespace === 'function') {
                try {
                    const normalizedNamespace = macro.buildMacroSubSeedNamespace(candidate.seedNamespace);
                    if (normalizedNamespace !== candidate.seedNamespace.trim()) {
                        pushError(errors, '"seedNamespace" must be stored in normalized macro namespace form.');
                    }
                } catch (error) {
                    pushError(errors, '"seedNamespace" must follow the macro sub-seed namespace convention.');
                }
            }
        }

        if (hasOwn(candidate, 'worldTone')) {
            if (typeof candidate.worldTone !== 'string' || !candidate.worldTone.trim()) {
                pushError(errors, '"worldTone" must be a non-empty string.');
            }
        }

        if (hasOwn(candidate, 'worldTendencies')) {
            if (!isPlainObject(candidate.worldTendencies)) {
                pushError(errors, '"worldTendencies" must be a plain object.');
            } else {
                WORLD_TENDENCY_FIELDS.forEach((fieldId) => {
                    if (!hasOwn(candidate.worldTendencies, fieldId)) {
                        pushError(errors, `"worldTendencies.${fieldId}" is required.`);
                        return;
                    }

                    if (typeof candidate.worldTendencies[fieldId] !== 'string' || !candidate.worldTendencies[fieldId].trim()) {
                        pushError(errors, `"worldTendencies.${fieldId}" must be a non-empty string.`);
                    }
                });
            }
        }

        PRESSURE_FIELDS.forEach((field) => {
            if (!hasOwn(candidate, field)) {
                return;
            }

            const bounds = getConstraintBoundsDescriptor(field);
            if (!Number.isFinite(candidate[field]) || candidate[field] < bounds.min || candidate[field] > bounds.max) {
                pushError(errors, `"${field}" must be a number in the ${bounds.min}..${bounds.max} range.`);
            }
        });

        return {
            contractId: CONTRACT_ID,
            contractVersion: PHASE_VERSION,
            isValid: errors.length === 0,
            errors
        };
    }

    function assertMacroSeedProfile(candidate) {
        const validationResult = validateMacroSeedProfile(candidate);
        if (!validationResult.isValid) {
            const error = new Error(validationResult.errors.join(' '));
            error.code = 'MACRO_SEED_PROFILE_INVALID';
            error.validationResult = validationResult;
            throw error;
        }

        return candidate;
    }

    function createMacroSeedProfileSnapshot(input = {}) {
        const normalizedProfile = ingestMacroSeedProfile(input);
        const validationResult = validateMacroSeedProfile(normalizedProfile);

        return deepFreeze({
            artifactKind: DEBUG_ARTIFACT_KIND,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            contractId: CONTRACT_ID,
            profile: cloneValue(normalizedProfile),
            normalizedConstraints: createDefaultWorldSeedConstraints(normalizedProfile),
            constraintBounds: getDefaultWorldSeedConstraintBounds(),
            seedSummary: {
                worldSeed: normalizedProfile.worldSeed,
                macroSeed: normalizedProfile.macroSeed,
                seedNamespace: normalizedProfile.seedNamespace,
                worldTone: normalizedProfile.worldTone,
                worldTendencies: cloneValue(normalizedProfile.worldTendencies)
            },
            validation: cloneValue(validationResult)
        });
    }

    function buildMacroSeedProfileDebugExport(input = {}, options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const snapshot = createMacroSeedProfileSnapshot(input);

        return deepFreeze({
            ...cloneValue(snapshot),
            exportKind: 'macro.seedProfile.debugExport',
            serializedProfile: serializeMacroSeedProfile(snapshot.profile, normalizedOptions)
        });
    }

    const MACRO_SEED_PROFILE_CONTRACT = deepFreeze({
        contractId: CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        immutableAfterIngest: true,
        sourceContracts: [
            'WorldSeedProfile',
            'DerivedWorldTendencies'
        ],
        requiredKeys: REQUIRED_KEYS.slice(),
        constraintBounds: getDefaultWorldSeedConstraintBounds(),
        constraintBoundsModule: 'seedConstraintBounds',
        fields: {
            worldSeed: {
                type: 'uint32',
                description: 'Upstream world/base seed forwarded into Phase 1.'
            },
            macroSeed: {
                type: 'uint32',
                description: 'Phase 1 macro seed after explicit override or deterministic derivation.'
            },
            seedNamespace: {
                type: 'string',
                defaultValue: DEFAULT_NAMESPACE,
                description: 'Normalized macro namespace used when deriving the local phase seed.'
            },
            worldTone: {
                type: 'string',
                description: 'Summary world-tone label forwarded from Phase 0.'
            },
            worldTendencies: {
                type: 'object',
                sourceContract: 'DerivedWorldTendencies',
                requiredKeys: WORLD_TENDENCY_FIELDS.slice(),
                fields: {
                    likelyWorldPattern: {
                        type: 'string'
                    },
                    likelyConflictMode: {
                        type: 'string'
                    },
                    likelyCollapseMode: {
                        type: 'string'
                    },
                    likelyReligiousPattern: {
                        type: 'string'
                    },
                    likelyArchipelagoRole: {
                        type: 'string'
                    }
                },
                description: 'Descriptive Phase 0 world tendencies normalized from the official DerivedWorldTendencies contract.'
            },
            conflictPressure: {
                type: 'number',
                range: [0, 1]
            },
            maritimeDependence: {
                type: 'number',
                range: [0, 1]
            },
            environmentalVolatility: {
                type: 'number',
                range: [0, 1]
            },
            coastJaggedness: {
                type: 'number',
                range: [0, 1]
            },
            collapseIntensity: {
                type: 'number',
                range: [0, 1]
            }
        },
        ingestion: {
            phase1InputKeys: PHASE1_INPUT_KEYS.slice(),
            nestedProfileKeys: NESTED_PROFILE_KEYS.slice(),
            worldTendencyContainerKeys: WORLD_TENDENCY_CONTAINER_KEYS.slice(),
            outputsContainerKeys: OUTPUTS_CONTAINER_KEYS.slice(),
            phase0BundleKeys: PHASE0_BUNDLE_KEYS.slice(),
            phase1SummaryBundleKeys: PHASE1_SUMMARY_BUNDLE_KEYS.slice(),
            rootSeedAliasKeys: ROOT_SEED_ALIAS_KEYS.slice(),
            macroSeedAliasKeys: MACRO_SEED_ALIAS_KEYS.slice(),
            namespaceAliasKeys: NAMESPACE_ALIAS_KEYS.slice(),
            tendencyFieldIds: WORLD_TENDENCY_FIELDS.slice(),
            passthroughFields: [
                'worldTone',
                'conflictPressure',
                'maritimeDependence',
                'environmentalVolatility',
                'coastJaggedness',
                'collapseIntensity'
            ]
        }
    });

    function getMacroSeedProfileContract() {
        return cloneValue(MACRO_SEED_PROFILE_CONTRACT);
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('macroSeedProfile', {
            entry: 'ingestMacroSeedProfile',
            file: 'js/worldgen/macro/macro-seed-profile.js',
            description: 'Phase 1 macro seed-profile contract plus external-parameter ingestion, default bounds, and normalization layer.',
            stub: false
        });
    }

    Object.assign(macro, {
        getWorldSeedConstraintFieldIds,
        getMacroSeedTendencyFieldIds,
        getDefaultWorldSeedConstraintBounds,
        createDefaultWorldTendencies,
        createDefaultWorldSeedConstraints,
        normalizeWorldTendencies,
        normalizeWorldSeedConstraintValue,
        normalizeWorldSeedConstraints,
        getMacroSeedProfileContract,
        createMacroSeedProfileSkeleton,
        ingestMacroSeedProfile,
        createMacroSeedProfileSnapshot,
        serializeMacroSeedProfile,
        buildMacroSeedProfileDebugExport,
        validateMacroSeedProfile,
        assertMacroSeedProfile
    });
})();
