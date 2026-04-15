(() => {
    const game = window.Game;
    const phase0 = game.systems.worldgenPhase0 = game.systems.worldgenPhase0 || {};
    const PHASE_VERSION = phase0.phaseVersion || 'phase0-v1';
    const UNIT_INTERVAL_RANGE = Object.freeze([0, 1]);
    const WORLD_SEED_PROFILE_CONTRACT_ID = 'worldSeedProfile';
    const DERIVED_WORLD_TENDENCIES_CONTRACT_ID = 'derivedWorldTendencies';
    const WORLD_SUB_SEED_MAP_CONTRACT_ID = 'worldSubSeedMap';
    const PHASE0_VALIDATION_REPORT_CONTRACT_ID = 'phase0ValidationReport';
    const PHASE0_EXPORT_BUNDLE_CONTRACT_ID = 'phase0ExportBundle';
    const WORLD_TONE_FALLBACK = 'fractured_maritime_age';
    const WORLD_PROFILE_NUMERIC_FIELD_IDS = Object.freeze([
        'conflictPressure',
        'dynastyPressure',
        'maritimeDependence',
        'environmentalVolatility',
        'collapseIntensity',
        'religiousInertia',
        'institutionalPlasticity',
        'migrationPressure',
        'centralizationBias',
        'memoryPersistence',
        'heroicAgencyBias',
        'routeFragilityBias',
        'culturalPermeability'
    ]);
    const WORLD_SEED_PROFILE_REQUIRED_KEYS = Object.freeze([
        'worldSeed',
        'worldTone',
        ...WORLD_PROFILE_NUMERIC_FIELD_IDS
    ]);
    const DERIVED_TENDENCY_DEFAULTS = Object.freeze({
        likelyWorldPattern: 'trade_heavy_but_fragile',
        likelyConflictMode: 'dynastic_and_route_driven',
        likelyCollapseMode: 'cascading_peripheral_failure',
        likelyReligiousPattern: 'adaptive_but_memory_bound',
        likelyArchipelagoRole: 'bridge_then_wound'
    });
    const DERIVED_TENDENCY_FIELD_IDS = Object.freeze([
        'likelyWorldPattern',
        'likelyConflictMode',
        'likelyCollapseMode',
        'likelyReligiousPattern',
        'likelyArchipelagoRole'
    ]);
    const SUB_SEED_FIELD_IDS = Object.freeze([
        'macroGeographySeed',
        'pressureSeed',
        'rhythmSeed',
        'religionSeed',
        'mentalSeed',
        'civilizationSeed',
        'dynastySeed',
        'eventSeed',
        'collapseSeed',
        'archipelagoSeed',
        'islandHistorySeed',
        'settlementSeed',
        'spatialSeed',
        'npcSeed'
    ]);
    const VALIDATION_SCORE_FIELD_IDS = Object.freeze([
        'expressiveness',
        'controlledExtremeness',
        'derivedReadability',
        'archipelagoPotential',
        'downstreamUsability'
    ]);
    const PHASE0_VALIDATION_REPORT_REQUIRED_KEYS = Object.freeze([
        'isValid',
        'warnings',
        'scores',
        'rerollAdvice',
        'blockedDownstreamPhases'
    ]);
    const PHASE0_EXPORT_BUNDLE_REQUIRED_KEYS = Object.freeze([
        'worldSeedProfile',
        'derivedWorldTendencies',
        'worldSubSeedMap',
        'validationReport'
    ]);
    const contractIds = Object.freeze([
        WORLD_SEED_PROFILE_CONTRACT_ID,
        DERIVED_WORLD_TENDENCIES_CONTRACT_ID,
        WORLD_SUB_SEED_MAP_CONTRACT_ID,
        PHASE0_VALIDATION_REPORT_CONTRACT_ID,
        PHASE0_EXPORT_BUNDLE_CONTRACT_ID
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

    function normalizeSeed(value) {
        return typeof phase0.normalizeSeed === 'function'
            ? phase0.normalizeSeed(value)
            : 0;
    }

    function clampUnitInterval(value) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 0;
        }

        return Math.max(UNIT_INTERVAL_RANGE[0], Math.min(UNIT_INTERVAL_RANGE[1], numericValue));
    }

    function normalizeString(value, fallback = '') {
        return typeof value === 'string' && value.trim()
            ? value.trim()
            : fallback;
    }

    function normalizeStringArray(value) {
        return Array.isArray(value)
            ? value.map((entry) => `${entry}`)
            : [];
    }

    function isUint32(value) {
        return Number.isInteger(value) && value >= 0 && value <= 0xffffffff;
    }

    function createValidationResult(contractId) {
        return {
            contractId,
            isValid: true,
            errors: []
        };
    }

    function finalizeValidationResult(result) {
        result.isValid = result.errors.length === 0;
        return result;
    }

    function pushError(result, message) {
        result.errors.push(message);
    }

    function validateObjectShape(result, objectValue, requiredKeys, path) {
        if (!isPlainObject(objectValue)) {
            pushError(result, `${path} must be a plain object.`);
            return false;
        }

        requiredKeys.forEach((requiredKey) => {
            if (!hasOwn(objectValue, requiredKey)) {
                pushError(result, `${path}.${requiredKey} is required.`);
            }
        });

        Object.keys(objectValue).forEach((key) => {
            if (!requiredKeys.includes(key)) {
                pushError(result, `${path}.${key} is not part of the official Phase 0 contract.`);
            }
        });

        return true;
    }

    function validateUint32Field(result, objectValue, fieldId, path) {
        if (!hasOwn(objectValue, fieldId)) {
            return;
        }

        if (!isUint32(objectValue[fieldId])) {
            pushError(result, `${path}.${fieldId} must be a uint32 seed.`);
        }
    }

    function validateNonEmptyStringField(result, objectValue, fieldId, path) {
        if (!hasOwn(objectValue, fieldId)) {
            return;
        }

        if (typeof objectValue[fieldId] !== 'string' || !objectValue[fieldId].trim()) {
            pushError(result, `${path}.${fieldId} must be a non-empty string.`);
        }
    }

    function validateUnitIntervalField(result, objectValue, fieldId, path) {
        if (!hasOwn(objectValue, fieldId)) {
            return;
        }

        const numericValue = Number(objectValue[fieldId]);
        if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 1) {
            pushError(result, `${path}.${fieldId} must be a finite normalized value in [0, 1].`);
        }
    }

    function validateStringArrayField(result, objectValue, fieldId, path) {
        if (!hasOwn(objectValue, fieldId)) {
            return;
        }

        const fieldValue = objectValue[fieldId];
        if (!Array.isArray(fieldValue)) {
            pushError(result, `${path}.${fieldId} must be an array of strings.`);
            return;
        }

        fieldValue.forEach((entry, index) => {
            if (typeof entry !== 'string') {
                pushError(result, `${path}.${fieldId}[${index}] must be a string.`);
            }
        });
    }

    function createWorldSeedProfileSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const worldSeed = normalizeSeed(
            hasOwn(normalizedInput, 'worldSeed')
                ? normalizedInput.worldSeed
                : normalizedInput.seed
        );

        return {
            worldSeed,
            worldTone: normalizeString(normalizedInput.worldTone, WORLD_TONE_FALLBACK),
            conflictPressure: clampUnitInterval(normalizedInput.conflictPressure),
            dynastyPressure: clampUnitInterval(normalizedInput.dynastyPressure),
            maritimeDependence: clampUnitInterval(normalizedInput.maritimeDependence),
            environmentalVolatility: clampUnitInterval(normalizedInput.environmentalVolatility),
            collapseIntensity: clampUnitInterval(normalizedInput.collapseIntensity),
            religiousInertia: clampUnitInterval(normalizedInput.religiousInertia),
            institutionalPlasticity: clampUnitInterval(normalizedInput.institutionalPlasticity),
            migrationPressure: clampUnitInterval(normalizedInput.migrationPressure),
            centralizationBias: clampUnitInterval(normalizedInput.centralizationBias),
            memoryPersistence: clampUnitInterval(normalizedInput.memoryPersistence),
            heroicAgencyBias: clampUnitInterval(normalizedInput.heroicAgencyBias),
            routeFragilityBias: clampUnitInterval(normalizedInput.routeFragilityBias),
            culturalPermeability: clampUnitInterval(normalizedInput.culturalPermeability)
        };
    }

    function validateWorldSeedProfile(worldSeedProfile) {
        const result = createValidationResult(WORLD_SEED_PROFILE_CONTRACT_ID);
        const path = 'worldSeedProfile';

        if (!validateObjectShape(result, worldSeedProfile, WORLD_SEED_PROFILE_REQUIRED_KEYS, path)) {
            return finalizeValidationResult(result);
        }

        validateUint32Field(result, worldSeedProfile, 'worldSeed', path);
        validateNonEmptyStringField(result, worldSeedProfile, 'worldTone', path);
        WORLD_PROFILE_NUMERIC_FIELD_IDS.forEach((fieldId) => {
            validateUnitIntervalField(result, worldSeedProfile, fieldId, path);
        });

        return finalizeValidationResult(result);
    }

    function assertWorldSeedProfile(worldSeedProfile) {
        const validationResult = validateWorldSeedProfile(worldSeedProfile);
        if (!validationResult.isValid) {
            throw new Error(`[worldgen/phase0] WorldSeedProfile contract violation: ${validationResult.errors.join(' ')}`);
        }

        return worldSeedProfile;
    }

    function createDerivedWorldTendenciesSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};

        return DERIVED_TENDENCY_FIELD_IDS.reduce((derivedWorldTendencies, fieldId) => {
            derivedWorldTendencies[fieldId] = normalizeString(normalizedInput[fieldId], DERIVED_TENDENCY_DEFAULTS[fieldId]);
            return derivedWorldTendencies;
        }, {});
    }

    function validateDerivedWorldTendencies(derivedWorldTendencies) {
        const result = createValidationResult(DERIVED_WORLD_TENDENCIES_CONTRACT_ID);
        const path = 'derivedWorldTendencies';

        if (!validateObjectShape(result, derivedWorldTendencies, DERIVED_TENDENCY_FIELD_IDS, path)) {
            return finalizeValidationResult(result);
        }

        DERIVED_TENDENCY_FIELD_IDS.forEach((fieldId) => {
            validateNonEmptyStringField(result, derivedWorldTendencies, fieldId, path);
        });

        return finalizeValidationResult(result);
    }

    function assertDerivedWorldTendencies(derivedWorldTendencies) {
        const validationResult = validateDerivedWorldTendencies(derivedWorldTendencies);
        if (!validationResult.isValid) {
            throw new Error(`[worldgen/phase0] DerivedWorldTendencies contract violation: ${validationResult.errors.join(' ')}`);
        }

        return derivedWorldTendencies;
    }

    function createWorldSubSeedMapSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};

        return SUB_SEED_FIELD_IDS.reduce((worldSubSeedMap, fieldId) => {
            worldSubSeedMap[fieldId] = normalizeSeed(normalizedInput[fieldId]);
            return worldSubSeedMap;
        }, {});
    }

    function validateWorldSubSeedMap(worldSubSeedMap) {
        const result = createValidationResult(WORLD_SUB_SEED_MAP_CONTRACT_ID);
        const path = 'worldSubSeedMap';

        if (!validateObjectShape(result, worldSubSeedMap, SUB_SEED_FIELD_IDS, path)) {
            return finalizeValidationResult(result);
        }

        SUB_SEED_FIELD_IDS.forEach((fieldId) => {
            validateUint32Field(result, worldSubSeedMap, fieldId, path);
        });

        return finalizeValidationResult(result);
    }

    function assertWorldSubSeedMap(worldSubSeedMap) {
        const validationResult = validateWorldSubSeedMap(worldSubSeedMap);
        if (!validationResult.isValid) {
            throw new Error(`[worldgen/phase0] WorldSubSeedMap contract violation: ${validationResult.errors.join(' ')}`);
        }

        return worldSubSeedMap;
    }

    function createValidationScoresSkeleton(scores = {}) {
        const normalizedScores = isPlainObject(scores) ? scores : {};

        return VALIDATION_SCORE_FIELD_IDS.reduce((validationScores, fieldId) => {
            validationScores[fieldId] = clampUnitInterval(normalizedScores[fieldId]);
            return validationScores;
        }, {});
    }

    function createPhase0ValidationReportSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};

        return {
            isValid: normalizedInput.isValid === true,
            warnings: normalizeStringArray(normalizedInput.warnings),
            scores: createValidationScoresSkeleton(normalizedInput.scores),
            rerollAdvice: normalizeStringArray(normalizedInput.rerollAdvice),
            blockedDownstreamPhases: normalizeStringArray(normalizedInput.blockedDownstreamPhases)
        };
    }

    function validatePhase0ValidationReport(validationReport) {
        const result = createValidationResult(PHASE0_VALIDATION_REPORT_CONTRACT_ID);
        const path = 'validationReport';

        if (!validateObjectShape(result, validationReport, PHASE0_VALIDATION_REPORT_REQUIRED_KEYS, path)) {
            return finalizeValidationResult(result);
        }

        if (typeof validationReport.isValid !== 'boolean') {
            pushError(result, `${path}.isValid must be a boolean.`);
        }

        validateStringArrayField(result, validationReport, 'warnings', path);
        validateStringArrayField(result, validationReport, 'rerollAdvice', path);
        validateStringArrayField(result, validationReport, 'blockedDownstreamPhases', path);

        if (validateObjectShape(result, validationReport.scores, VALIDATION_SCORE_FIELD_IDS, `${path}.scores`)) {
            VALIDATION_SCORE_FIELD_IDS.forEach((fieldId) => {
                validateUnitIntervalField(result, validationReport.scores, fieldId, `${path}.scores`);
            });
        }

        return finalizeValidationResult(result);
    }

    function assertPhase0ValidationReport(validationReport) {
        const validationResult = validatePhase0ValidationReport(validationReport);
        if (!validationResult.isValid) {
            throw new Error(`[worldgen/phase0] Phase0ValidationReport contract violation: ${validationResult.errors.join(' ')}`);
        }

        return validationReport;
    }

    function createPhase0BundleSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};

        return {
            worldSeedProfile: createWorldSeedProfileSkeleton(normalizedInput.worldSeedProfile),
            derivedWorldTendencies: createDerivedWorldTendenciesSkeleton(normalizedInput.derivedWorldTendencies),
            worldSubSeedMap: createWorldSubSeedMapSkeleton(normalizedInput.worldSubSeedMap),
            validationReport: createPhase0ValidationReportSkeleton(normalizedInput.validationReport)
        };
    }

    function validatePhase0BundleShape(bundle) {
        const result = createValidationResult(PHASE0_EXPORT_BUNDLE_CONTRACT_ID);
        const path = 'phase0Bundle';

        if (!validateObjectShape(result, bundle, PHASE0_EXPORT_BUNDLE_REQUIRED_KEYS, path)) {
            return finalizeValidationResult(result);
        }

        const worldSeedProfileValidation = validateWorldSeedProfile(bundle.worldSeedProfile);
        worldSeedProfileValidation.errors.forEach((message) => {
            pushError(result, message);
        });

        const derivedTendenciesValidation = validateDerivedWorldTendencies(bundle.derivedWorldTendencies);
        derivedTendenciesValidation.errors.forEach((message) => {
            pushError(result, message);
        });

        const subSeedMapValidation = validateWorldSubSeedMap(bundle.worldSubSeedMap);
        subSeedMapValidation.errors.forEach((message) => {
            pushError(result, message);
        });

        const validationReportValidation = validatePhase0ValidationReport(bundle.validationReport);
        validationReportValidation.errors.forEach((message) => {
            pushError(result, message);
        });

        return finalizeValidationResult(result);
    }

    function assertPhase0BundleShape(bundle) {
        const validationResult = validatePhase0BundleShape(bundle);
        if (!validationResult.isValid) {
            throw new Error(`[worldgen/phase0] Phase 0 bundle contract violation: ${validationResult.errors.join(' ')}`);
        }

        return bundle;
    }

    const WORLD_SEED_PROFILE_CONTRACT = deepFreeze({
        contractId: WORLD_SEED_PROFILE_CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        requiredKeys: WORLD_SEED_PROFILE_REQUIRED_KEYS.slice(),
        numericFields: WORLD_PROFILE_NUMERIC_FIELD_IDS.slice(),
        numericRange: UNIT_INTERVAL_RANGE.slice(),
        worldToneFallback: WORLD_TONE_FALLBACK
    });

    const DERIVED_WORLD_TENDENCIES_CONTRACT = deepFreeze({
        contractId: DERIVED_WORLD_TENDENCIES_CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        requiredKeys: DERIVED_TENDENCY_FIELD_IDS.slice(),
        defaults: cloneValue(DERIVED_TENDENCY_DEFAULTS)
    });

    const WORLD_SUB_SEED_MAP_CONTRACT = deepFreeze({
        contractId: WORLD_SUB_SEED_MAP_CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        requiredKeys: SUB_SEED_FIELD_IDS.slice(),
        valueType: 'uint32'
    });

    const PHASE0_VALIDATION_REPORT_CONTRACT = deepFreeze({
        contractId: PHASE0_VALIDATION_REPORT_CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        requiredKeys: PHASE0_VALIDATION_REPORT_REQUIRED_KEYS.slice(),
        scoreKeys: VALIDATION_SCORE_FIELD_IDS.slice(),
        scoreRange: UNIT_INTERVAL_RANGE.slice()
    });

    const PHASE0_EXPORT_BUNDLE_CONTRACT = deepFreeze({
        contractId: PHASE0_EXPORT_BUNDLE_CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        requiredKeys: PHASE0_EXPORT_BUNDLE_REQUIRED_KEYS.slice()
    });

    function getWorldSeedProfileContract() {
        return WORLD_SEED_PROFILE_CONTRACT;
    }

    function getDerivedWorldTendenciesContract() {
        return DERIVED_WORLD_TENDENCIES_CONTRACT;
    }

    function getWorldSubSeedMapContract() {
        return WORLD_SUB_SEED_MAP_CONTRACT;
    }

    function getPhase0ValidationReportContract() {
        return PHASE0_VALIDATION_REPORT_CONTRACT;
    }

    function getPhase0BundleContract() {
        return PHASE0_EXPORT_BUNDLE_CONTRACT;
    }

    function getPhase0ContractIds() {
        return contractIds.slice();
    }

    function getPhase0ContractEntryPoints() {
        return Object.freeze({
            worldSeedProfile: 'buildWorldSeedProfile',
            worldTone: 'synthesizeWorldTone',
            derivedWorldTendencies: 'deriveWorldTendencies',
            worldSubSeedMap: 'deriveWorldSubSeedMap',
            validationReport: 'validatePhase0Export',
            exportBundle: 'createPhase0World'
        });
    }

    function getPhase0ContractRegistry() {
        return Object.freeze({
            worldSeedProfile: WORLD_SEED_PROFILE_CONTRACT,
            derivedWorldTendencies: DERIVED_WORLD_TENDENCIES_CONTRACT,
            worldSubSeedMap: WORLD_SUB_SEED_MAP_CONTRACT,
            phase0ValidationReport: PHASE0_VALIDATION_REPORT_CONTRACT,
            phase0ExportBundle: PHASE0_EXPORT_BUNDLE_CONTRACT
        });
    }

    function getPhase0ContractFactories() {
        return Object.freeze({
            createWorldSeedProfileSkeleton,
            createDerivedWorldTendenciesSkeleton,
            createWorldSubSeedMapSkeleton,
            createPhase0ValidationReportSkeleton,
            createPhase0BundleSkeleton
        });
    }

    function getPhase0ContractValidators() {
        return Object.freeze({
            validateWorldSeedProfile,
            validateDerivedWorldTendencies,
            validateWorldSubSeedMap,
            validatePhase0ValidationReport,
            validatePhase0BundleShape
        });
    }

    function getPhase0ContractAssertions() {
        return Object.freeze({
            assertWorldSeedProfile,
            assertDerivedWorldTendencies,
            assertWorldSubSeedMap,
            assertPhase0ValidationReport,
            assertPhase0BundleShape
        });
    }

    function getPhase0ContractsApi() {
        return Object.freeze({
            getWorldSeedProfileContract,
            getDerivedWorldTendenciesContract,
            getWorldSubSeedMapContract,
            getPhase0ValidationReportContract,
            getPhase0BundleContract,
            getPhase0ContractIds,
            getPhase0ContractEntryPoints,
            getPhase0ContractRegistry,
            getPhase0ContractFactories,
            getPhase0ContractValidators,
            getPhase0ContractAssertions,
            createWorldSeedProfileSkeleton,
            createDerivedWorldTendenciesSkeleton,
            createWorldSubSeedMapSkeleton,
            createPhase0ValidationReportSkeleton,
            createPhase0BundleSkeleton,
            validateWorldSeedProfile,
            validateDerivedWorldTendencies,
            validateWorldSubSeedMap,
            validatePhase0ValidationReport,
            validatePhase0BundleShape,
            assertWorldSeedProfile,
            assertDerivedWorldTendencies,
            assertWorldSubSeedMap,
            assertPhase0ValidationReport,
            assertPhase0BundleShape
        });
    }

    if (typeof phase0.registerModule === 'function') {
        phase0.registerModule('contracts', {
            entry: 'getPhase0ContractsApi',
            file: 'js/worldgen/phase0/contracts.js',
            description: 'Runtime-side contract descriptors, validators, skeleton factories, and assertions for official Phase 0 outputs.'
        });
    }

    Object.assign(phase0, {
        getWorldSeedProfileContract,
        getDerivedWorldTendenciesContract,
        getWorldSubSeedMapContract,
        getPhase0ValidationReportContract,
        getPhase0BundleContract,
        getPhase0ContractIds,
        getPhase0ContractEntryPoints,
        getPhase0ContractRegistry,
        getPhase0ContractFactories,
        getPhase0ContractValidators,
        getPhase0ContractAssertions,
        getPhase0ContractsApi,
        createWorldSeedProfileSkeleton,
        createDerivedWorldTendenciesSkeleton,
        createWorldSubSeedMapSkeleton,
        createPhase0ValidationReportSkeleton,
        createPhase0BundleSkeleton,
        validateWorldSeedProfile,
        validateDerivedWorldTendencies,
        validateWorldSubSeedMap,
        validatePhase0ValidationReport,
        validatePhase0BundleShape,
        assertWorldSeedProfile,
        assertDerivedWorldTendencies,
        assertWorldSubSeedMap,
        assertPhase0ValidationReport,
        assertPhase0BundleShape
    });
})();
