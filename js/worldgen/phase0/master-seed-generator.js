(() => {
    const game = window.Game;
    const phase0 = game.systems.worldgenPhase0 = game.systems.worldgenPhase0 || {};
    const NULL_PRESET_MODE_ALIASES = Object.freeze([
        'none',
        'default',
        'neutral',
        'seed_only',
        'seed-only'
    ]);
    const PHASE0_OPTION_KEYS = Object.freeze([
        'worldPresetMode',
        'hardConstraintsProfile'
    ]);
    const PRESET_MODE_PATTERN = /^[a-z][a-z0-9_]*$/;
    const HARD_CONSTRAINT_FIELD_IDS = Object.freeze([
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

    function formatKeyList(keys) {
        return keys.map((key) => `"${key}"`).join(', ');
    }

    function collectUnknownKeys(objectValue, allowedKeys) {
        if (!isPlainObject(objectValue)) {
            return [];
        }

        return Object.keys(objectValue).filter((key) => !allowedKeys.includes(key));
    }

    function assertValidHardConstraintsProfile(hardConstraintsProfile) {
        if (hardConstraintsProfile === undefined || hardConstraintsProfile === null) {
            return;
        }

        if (!isPlainObject(hardConstraintsProfile)) {
            throw new Error('[worldgen/phase0] hardConstraintsProfile must be a plain object when provided.');
        }

        const unknownConstraintKeys = collectUnknownKeys(
            hardConstraintsProfile,
            HARD_CONSTRAINT_FIELD_IDS
        );
        if (unknownConstraintKeys.length) {
            throw new Error(
                `[worldgen/phase0] Unknown hardConstraintsProfile key(s): ${formatKeyList(unknownConstraintKeys)}. `
                + `Allowed keys: ${formatKeyList(HARD_CONSTRAINT_FIELD_IDS)}.`
            );
        }
    }

    function assertValidPhase0Options(options) {
        if (options === undefined || options === null) {
            return;
        }

        if (!isPlainObject(options)) {
            throw new Error('[worldgen/phase0] options must be a plain object when provided.');
        }

        const unknownOptionKeys = collectUnknownKeys(options, PHASE0_OPTION_KEYS);
        if (unknownOptionKeys.length) {
            throw new Error(
                `[worldgen/phase0] Unknown Phase 0 option key(s): ${formatKeyList(unknownOptionKeys)}. `
                + `Allowed keys: ${formatKeyList(PHASE0_OPTION_KEYS)}.`
            );
        }

        assertValidHardConstraintsProfile(options.hardConstraintsProfile);
    }

    function pickBundleComponent(components, canonicalKey, aliasKeys = []) {
        if (!isPlainObject(components)) {
            return {};
        }

        if (Object.prototype.hasOwnProperty.call(components, canonicalKey)) {
            return components[canonicalKey];
        }

        for (const aliasKey of aliasKeys) {
            if (Object.prototype.hasOwnProperty.call(components, aliasKey)) {
                return components[aliasKey];
            }
        }

        return {};
    }

    function intakeBaseRandomSeed(baseRandomSeed) {
        if (baseRandomSeed === undefined || baseRandomSeed === null) {
            throw new Error('[worldgen/phase0] baseRandomSeed is required.');
        }

        if (typeof baseRandomSeed === 'string' && !baseRandomSeed.trim()) {
            throw new Error('[worldgen/phase0] baseRandomSeed must not be an empty string.');
        }

        const numericSeed = Number(baseRandomSeed);
        if (!Number.isFinite(numericSeed)) {
            throw new Error('[worldgen/phase0] baseRandomSeed must be a finite number.');
        }

        return typeof phase0.normalizeSeed === 'function'
            ? phase0.normalizeSeed(numericSeed)
            : numericSeed >>> 0;
    }

    function intakeWorldPresetMode(worldPresetMode) {
        if (worldPresetMode === undefined || worldPresetMode === null) {
            return null;
        }

        if (typeof worldPresetMode !== 'string') {
            throw new Error('[worldgen/phase0] worldPresetMode must be a string when provided.');
        }

        const trimmedPresetMode = worldPresetMode.trim();
        if (!trimmedPresetMode) {
            return null;
        }

        const normalizedPresetMode = trimmedPresetMode
            .toLowerCase()
            .replace(/[\s-]+/g, '_');

        if (NULL_PRESET_MODE_ALIASES.includes(normalizedPresetMode)) {
            return null;
        }

        if (!PRESET_MODE_PATTERN.test(normalizedPresetMode)) {
            throw new Error('[worldgen/phase0] worldPresetMode must normalize to a lowercase underscore identifier.');
        }

        return normalizedPresetMode;
    }

    function normalizeHardConstraintValue(fieldId, value) {
        if (value === undefined || value === null) {
            return null;
        }

        if (typeof value === 'string' && !value.trim()) {
            return null;
        }

        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            throw new Error(`[worldgen/phase0] hardConstraintsProfile.${fieldId} must be a finite number when provided.`);
        }

        return Math.max(0, Math.min(1, numericValue));
    }

    function intakeHardConstraintsProfile(hardConstraintsProfile) {
        if (hardConstraintsProfile === undefined || hardConstraintsProfile === null) {
            return null;
        }

        assertValidHardConstraintsProfile(hardConstraintsProfile);

        // TODO CONTRACTED: richer constraint descriptors, bounds systems, and
        // latent-axis application belong to later option-normalization steps.
        const normalizedProfile = HARD_CONSTRAINT_FIELD_IDS.reduce((constraints, fieldId) => {
            if (!Object.prototype.hasOwnProperty.call(hardConstraintsProfile, fieldId)) {
                return constraints;
            }

            const normalizedValue = normalizeHardConstraintValue(
                fieldId,
                hardConstraintsProfile[fieldId]
            );

            if (normalizedValue !== null) {
                constraints[fieldId] = normalizedValue;
            }

            return constraints;
        }, {});

        if (!Object.keys(normalizedProfile).length) {
            return null;
        }

        return deepFreeze(normalizedProfile);
    }

    function normalizePhase0Options(options = {}) {
        assertValidPhase0Options(options);
        const normalizedOptions = isPlainObject(options) ? options : {};

        return deepFreeze({
            worldPresetMode: intakeWorldPresetMode(normalizedOptions.worldPresetMode),
            hardConstraintsProfile: intakeHardConstraintsProfile(
                normalizedOptions.hardConstraintsProfile
            )
        });
    }

    function normalizePhase0Input(baseSeed, options = {}) {
        const normalizedSeed = intakeBaseRandomSeed(baseSeed);
        const normalizedOptions = normalizePhase0Options(options);

        return deepFreeze({
            baseRandomSeed: normalizedSeed,
            worldPresetMode: normalizedOptions.worldPresetMode,
            hardConstraintsProfile: normalizedOptions.hardConstraintsProfile
        });
    }

    function assemblePhase0Bundle(components = {}) {
        const normalizedComponents = isPlainObject(components) ? components : {};
        const contractFactories = typeof phase0.getPhase0ContractFactories === 'function'
            ? phase0.getPhase0ContractFactories()
            : {};
        const createWorldSeedProfileSkeleton = typeof contractFactories.createWorldSeedProfileSkeleton === 'function'
            ? contractFactories.createWorldSeedProfileSkeleton
            : phase0.createWorldSeedProfileSkeleton;
        const createDerivedWorldTendenciesSkeleton = typeof contractFactories.createDerivedWorldTendenciesSkeleton === 'function'
            ? contractFactories.createDerivedWorldTendenciesSkeleton
            : phase0.createDerivedWorldTendenciesSkeleton;
        const createWorldSubSeedMapSkeleton = typeof contractFactories.createWorldSubSeedMapSkeleton === 'function'
            ? contractFactories.createWorldSubSeedMapSkeleton
            : phase0.createWorldSubSeedMapSkeleton;
        const createPhase0ValidationReportSkeleton = typeof contractFactories.createPhase0ValidationReportSkeleton === 'function'
            ? contractFactories.createPhase0ValidationReportSkeleton
            : phase0.createPhase0ValidationReportSkeleton;

        if (typeof createWorldSeedProfileSkeleton !== 'function'
            || typeof createDerivedWorldTendenciesSkeleton !== 'function'
            || typeof createWorldSubSeedMapSkeleton !== 'function'
            || typeof createPhase0ValidationReportSkeleton !== 'function') {
            throw new Error('[worldgen/phase0] Phase 0 bundle assembler requires contract skeleton factories.');
        }

        const assembledBundle = {
            worldSeedProfile: createWorldSeedProfileSkeleton(
                pickBundleComponent(normalizedComponents, 'worldSeedProfile', [
                    'profile',
                    'seedProfile'
                ])
            ),
            derivedWorldTendencies: createDerivedWorldTendenciesSkeleton(
                pickBundleComponent(normalizedComponents, 'derivedWorldTendencies', [
                    'tendencies',
                    'derivedTendencies'
                ])
            ),
            worldSubSeedMap: createWorldSubSeedMapSkeleton(
                pickBundleComponent(normalizedComponents, 'worldSubSeedMap', [
                    'subSeedMap',
                    'subSeeds'
                ])
            ),
            validationReport: createPhase0ValidationReportSkeleton(
                pickBundleComponent(normalizedComponents, 'validationReport', [
                    'report',
                    'phase0ValidationReport'
                ])
            )
        };

        if (typeof phase0.assertPhase0BundleShape === 'function') {
            phase0.assertPhase0BundleShape(assembledBundle);
        }

        return deepFreeze(assembledBundle);
    }

    function createPhase0World(baseSeed, options = {}) {
        const normalizedSeed = typeof phase0.normalizeSeed === 'function'
            ? phase0.normalizeSeed(baseSeed)
            : 0;
        void options;

        throw typeof phase0.createTodoContractedError === 'function'
            ? phase0.createTodoContractedError(`masterSeedGenerator.createPhase0World(seed=${normalizedSeed})`)
            : new Error('[worldgen/phase0] TODO CONTRACTED stub.');
    }

    function getPhase0GenerationScaffoldStatus() {
        const registeredModules = typeof phase0.getRegisteredModules === 'function'
            ? phase0.getRegisteredModules()
            : [];
        const pipelineSteps = typeof phase0.getPipelineStepDescriptors === 'function'
            ? phase0.getPipelineStepDescriptors()
            : [];
        const expectedPipeline = typeof phase0.getExpectedPipelineStepIds === 'function'
            ? phase0.getExpectedPipelineStepIds()
            : [];

        return {
            phaseId: phase0.phaseId || 'phase0',
            phaseVersion: phase0.phaseVersion || 'phase0-v1',
            stub: true,
            registeredModuleCount: registeredModules.length,
            registeredModules,
            expectedPipeline,
            pipelineSteps
        };
    }

    if (typeof phase0.registerModule === 'function') {
        phase0.registerModule('masterSeedGenerator', {
            entry: 'createPhase0World',
            file: 'js/worldgen/phase0/master-seed-generator.js',
            description: 'Top-level Phase 0 orchestration scaffold with root export bundle assembly and no synthesis logic.'
        });
        phase0.registerPipelineStep('inputIntake', {
            entry: 'normalizePhase0Input',
            file: 'js/worldgen/phase0/master-seed-generator.js',
            description: 'Phase 0 input intake layer with required base seed plus normalized optional preset-mode and hard-constraints options, including readable invalid-option rejection.',
            stub: false
        });
        phase0.registerPipelineStep('exportBundleAssembly', {
            entry: 'assemblePhase0Bundle',
            file: 'js/worldgen/phase0/master-seed-generator.js',
            description: 'Phase 0 export bundle assembly layer for canonical root packaging and freeze-after-assembly behavior.',
            stub: false
        });
    }

    Object.assign(phase0, {
        intakeBaseRandomSeed,
        intakeWorldPresetMode,
        intakeHardConstraintsProfile,
        normalizePhase0Options,
        normalizePhase0Input,
        assemblePhase0Bundle,
        createPhase0World,
        getPhase0GenerationScaffoldStatus
    });
})();
