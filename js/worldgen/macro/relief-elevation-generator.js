(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const MODULE_ID = 'reliefElevationGenerator';
    const PIPELINE_STEP_ID = 'reliefElevation';
    const TODO_STATUS = macro.todoContractedCode || 'TODO_CONTRACTED';
    const PARTIAL_STATUS = 'PARTIAL_IMPLEMENTED';
    const IMPLEMENTED_STATUS = 'implemented';
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';
    const DEFAULT_WORLD_BOUNDS = Object.freeze({
        width: 256,
        height: 128
    });
    const DEFAULT_FIELD_RANGE = Object.freeze([0, 1]);
    const DEFAULT_BASE_CONTINENTAL_MASS_FIELD_RANGE = DEFAULT_FIELD_RANGE;
    const BASE_CONTINENTAL_MASS_VALUE_ENCODING = 'rowMajorFloatArray';
    const DEFAULT_BASE_CONTINENTAL_MASS_SMOOTHING_PASSES = 3;
    const BASE_CONTINENTAL_MASS_STAGE_ID = 'baseContinentalMassField';
    const DEFAULT_MACRO_ELEVATION_FIELD_RANGE = DEFAULT_FIELD_RANGE;
    const MACRO_ELEVATION_VALUE_ENCODING = 'rowMajorFloatArray';
    const DEFAULT_MACRO_ELEVATION_SMOOTHING_PASSES = 2;
    const MACRO_ELEVATION_STAGE_ID = 'macroElevationField';
    const DEFAULT_DOMAIN_WARPED_MACRO_ELEVATION_FIELD_RANGE = DEFAULT_FIELD_RANGE;
    const DOMAIN_WARPED_MACRO_ELEVATION_VALUE_ENCODING = 'rowMajorFloatArray';
    const DOMAIN_WARPED_MACRO_ELEVATION_STAGE_ID = 'domainWarpedMacroElevationField';
    const DEFAULT_MOUNTAIN_AMPLIFICATION_FIELD_RANGE = DEFAULT_FIELD_RANGE;
    const MOUNTAIN_AMPLIFICATION_VALUE_ENCODING = 'rowMajorFloatArray';
    const DEFAULT_MOUNTAIN_AMPLIFICATION_SMOOTHING_PASSES = 1;
    const MOUNTAIN_AMPLIFICATION_STAGE_ID = 'mountainAmplificationField';
    const DEFAULT_BASIN_DEPRESSION_FIELD_RANGE = DEFAULT_FIELD_RANGE;
    const BASIN_DEPRESSION_VALUE_ENCODING = 'rowMajorFloatArray';
    const DEFAULT_BASIN_DEPRESSION_SMOOTHING_PASSES = 2;
    const BASIN_DEPRESSION_STAGE_ID = 'basinDepressionField';
    const DEFAULT_BASIN_SEED_BASE_RADIUS_RATIO = 0.035;
    const DEFAULT_PLATEAU_CANDIDATE_FIELD_RANGE = DEFAULT_FIELD_RANGE;
    const PLATEAU_CANDIDATE_VALUE_ENCODING = 'rowMajorFloatArray';
    const DEFAULT_PLATEAU_CANDIDATE_SMOOTHING_PASSES = 2;
    const PLATEAU_CANDIDATE_STAGE_ID = 'plateauCandidateField';
    const DEFAULT_SEA_LEVEL_APPLIED_ELEVATION_FIELD_RANGE = DEFAULT_FIELD_RANGE;
    const SEA_LEVEL_APPLIED_ELEVATION_VALUE_ENCODING = 'rowMajorFloatArray';
    const DEFAULT_SEA_LEVEL_APPLIED_ELEVATION_SMOOTHING_PASSES = 1;
    const SEA_LEVEL_APPLIED_ELEVATION_STAGE_ID = 'seaLevelAppliedElevationField';
    const DEFAULT_LAND_WATER_MASK_RANGE = DEFAULT_FIELD_RANGE;
    const LAND_WATER_MASK_VALUE_ENCODING = 'rowMajorFloatArray';
    const DEFAULT_LAND_WATER_MASK_THRESHOLD = 0.5;
    const LAND_WATER_MASK_STAGE_ID = 'landWaterMaskField';
    const DEFAULT_LANDMASS_CLEANUP_MASK_RANGE = DEFAULT_FIELD_RANGE;
    const LANDMASS_CLEANUP_MASK_VALUE_ENCODING = 'rowMajorFloatArray';
    const DEFAULT_LANDMASS_CLEANUP_MASK_THRESHOLD = 0.5;
    const LANDMASS_CLEANUP_MASK_STAGE_ID = 'landmassCleanupMaskField';
    const LANDMASS_SHAPE_INTEREST_STAGE_ID = 'landmassShapeInterestScores';
    const CONTINENT_BODIES_STAGE_ID = 'continentBodies';
    const RELIEF_REGION_EXTRACTION_STAGE_ID = 'reliefRegionExtraction';
    const RELIEF_ELEVATION_FIELD_SNAPSHOTS_STAGE_ID = 'reliefElevationFieldSnapshots';
    const RELIEF_REGION_TYPE_MASK_FIELD_ID = 'reliefRegionTypeMaskField';
    const RELIEF_REGION_TYPES = Object.freeze([
        'mountain',
        'plateau',
        'plain',
        'basin',
        'coast'
    ]);
    const RELIEF_REGION_TYPE_MASK_ENCODING = deepFreeze({
        none: 0,
        mountain: 0.2,
        plateau: 0.4,
        plain: 0.6,
        basin: 0.8,
        coast: 1
    });
    const INPUT_REQUIRED_KEYS = Object.freeze([
        'macroSeed'
    ]);
    const INPUT_OPTIONAL_KEYS = Object.freeze([
        'macroSeedProfile',
        'phase1Constraints',
        'worldBounds',
        'tectonicSkeleton',
        'fields',
        'intermediateOutputs',
        'debugOptions'
    ]);
    const FIELD_DEPENDENCIES = deepFreeze([
        {
            fieldId: 'upliftField',
            sourceGroup: 'tectonicSkeleton.outputs.fields',
            required: true,
            role: 'positive relief pressure'
        },
        {
            fieldId: 'subsidenceField',
            sourceGroup: 'tectonicSkeleton.outputs.fields',
            required: true,
            role: 'negative relief pressure'
        },
        {
            fieldId: 'fractureMaskField',
            sourceGroup: 'tectonicSkeleton.outputs.fields',
            required: true,
            role: 'ruggedness and breakline context'
        },
        {
            fieldId: 'ridgeDirectionField',
            sourceGroup: 'tectonicSkeleton.outputs.fields',
            required: true,
            role: 'future mountain amplification direction'
        },
        {
            fieldId: 'platePressureField',
            sourceGroup: 'tectonicSkeleton.outputs.fields',
            required: true,
            role: 'tectonic composite pressure'
        },
        {
            fieldId: 'plainLowlandSmoothingField',
            sourceGroup: 'tectonicSkeleton.outputs.fields',
            required: true,
            role: 'plain and lowland permission mask'
        }
    ]);
    const INTERMEDIATE_DEPENDENCIES = deepFreeze([
        {
            outputId: 'plateSeedDistribution',
            sourceGroup: 'tectonicSkeleton.outputs.intermediateOutputs',
            required: false,
            role: 'optional plate-attribution context for continent-body drafts'
        },
        {
            outputId: 'basinSeeds',
            sourceGroup: 'tectonicSkeleton.outputs.intermediateOutputs',
            required: true,
            role: 'future basin depression anchors'
        },
        {
            outputId: 'mountainBeltCandidates',
            sourceGroup: 'tectonicSkeleton.outputs.intermediateOutputs',
            required: true,
            role: 'future mountain-system amplification anchors'
        },
        {
            outputId: 'arcFormationHelper',
            sourceGroup: 'tectonicSkeleton.outputs.intermediateOutputs',
            required: false,
            role: 'optional curved relief-form context'
        },
        {
            outputId: 'hotspotVolcanicSeedHelper',
            sourceGroup: 'tectonicSkeleton.outputs.intermediateOutputs',
            required: false,
            role: 'optional volcanic relief-form context'
        }
    ]);
    const PLANNED_OUTPUTS = deepFreeze({
        fields: [
            'baseContinentalMassField',
            'macroElevationField',
            'domainWarpedMacroElevationField',
            'mountainAmplificationField',
            'basinDepressionField',
            'plateauCandidateField',
            'seaLevelAppliedElevationField',
            'landWaterMaskField',
            'landmassCleanupMaskField'
        ],
        intermediateOutputs: [
            'reliefElevationCompositionPlan',
            'landmassShapeInterestScores',
            'continentBodies',
            'reliefRegionExtraction'
        ],
        records: [
            'reliefRegions'
        ],
        debugArtifacts: [
            'reliefElevationFieldSnapshots'
        ]
    });
    const PLANNED_STAGES = deepFreeze([
        {
            stageId: 'dependencyIntake',
            seedScope: 'dependencyIntake',
            plannedOutputs: ['dependencyAvailability']
        },
        {
            stageId: BASE_CONTINENTAL_MASS_STAGE_ID,
            seedScope: 'baseContinentalMass',
            plannedOutputs: ['baseContinentalMassField']
        },
        {
            stageId: MOUNTAIN_AMPLIFICATION_STAGE_ID,
            seedScope: 'mountainAmplification',
            plannedOutputs: ['mountainAmplificationField']
        },
        {
            stageId: BASIN_DEPRESSION_STAGE_ID,
            seedScope: 'basinDepression',
            plannedOutputs: ['basinDepressionField']
        },
        {
            stageId: MACRO_ELEVATION_STAGE_ID,
            seedScope: 'macroElevationComposite',
            plannedOutputs: ['macroElevationField']
        },
        {
            stageId: DOMAIN_WARPED_MACRO_ELEVATION_STAGE_ID,
            seedScope: 'domainWarping',
            plannedOutputs: ['domainWarpedMacroElevationField']
        },
        {
            stageId: PLATEAU_CANDIDATE_STAGE_ID,
            seedScope: 'plateauCandidates',
            plannedOutputs: ['plateauCandidateField']
        },
        {
            stageId: SEA_LEVEL_APPLIED_ELEVATION_STAGE_ID,
            seedScope: 'seaLevelApplication',
            plannedOutputs: ['seaLevelAppliedElevationField']
        },
        {
            stageId: LAND_WATER_MASK_STAGE_ID,
            seedScope: 'landWaterSplit',
            plannedOutputs: ['landWaterMaskField']
        },
        {
            stageId: LANDMASS_CLEANUP_MASK_STAGE_ID,
            seedScope: 'landmassCleanup',
            plannedOutputs: ['landmassCleanupMaskField']
        },
        {
            stageId: LANDMASS_SHAPE_INTEREST_STAGE_ID,
            seedScope: 'landmassShapeInterest',
            plannedOutputs: ['landmassShapeInterestScores']
        },
        {
            stageId: CONTINENT_BODIES_STAGE_ID,
            seedScope: 'continentBodies',
            plannedOutputs: ['continentBodies']
        },
        {
            stageId: RELIEF_REGION_EXTRACTION_STAGE_ID,
            seedScope: 'reliefRegions',
            plannedOutputs: ['reliefRegions']
        },
        {
            stageId: RELIEF_ELEVATION_FIELD_SNAPSHOTS_STAGE_ID,
            seedScope: 'debugExport',
            plannedOutputs: ['reliefElevationFieldSnapshots']
        }
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

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function normalizeSeed(seed) {
        return typeof macro.normalizeSeed === 'function'
            ? macro.normalizeSeed(seed)
            : 0;
    }

    function normalizeInteger(value, fallback = 0) {
        return Number.isFinite(value)
            ? Math.trunc(value)
            : fallback;
    }

    function normalizeWorldBounds(bounds) {
        const normalizedBounds = isPlainObject(bounds) ? bounds : {};
        const width = normalizeInteger(Number(normalizedBounds.width), DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(Number(normalizedBounds.height), DEFAULT_WORLD_BOUNDS.height);

        return {
            width: Math.max(1, width),
            height: Math.max(1, height)
        };
    }

    function clampUnitInterval(value, fallback = 0) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return fallback;
        }

        return Math.max(0, Math.min(1, numericValue));
    }

    function roundFieldValue(value) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 0;
        }

        return Math.round(numericValue * 1000000) / 1000000;
    }

    function normalizeString(value, fallback = '') {
        return typeof value === 'string' && value.trim()
            ? value.trim()
            : fallback;
    }

    function clampGridCoordinate(value, max) {
        return Math.max(0, Math.min(Math.max(0, max - 1), Math.trunc(Number(value) || 0)));
    }

    function createScalarFieldStorage(fieldId, worldBounds, options = {}) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const normalizedOptions = isPlainObject(options) ? options : {};
        const range = Array.isArray(normalizedOptions.range)
            ? normalizedOptions.range.slice(0, 2)
            : DEFAULT_FIELD_RANGE.slice();
        const defaultValue = clampUnitInterval(normalizedOptions.defaultValue, 0);

        if (typeof macro.createScalarField === 'function') {
            return macro.createScalarField({
                fieldId,
                width,
                height,
                range,
                defaultValue,
                defaultSampleMode: 'bilinear',
                defaultEdgeMode: 'clamp'
            });
        }

        const size = width * height;
        const values = new Array(size).fill(defaultValue);

        function inBounds(x, y) {
            return x >= 0 && y >= 0 && x < width && y < height;
        }

        function toIndex(x, y) {
            return (y * width) + x;
        }

        return {
            type: 'ScalarField',
            fieldId,
            width,
            height,
            size,
            read(x, y, fallback = defaultValue) {
                const normalizedX = Math.trunc(x);
                const normalizedY = Math.trunc(y);
                return inBounds(normalizedX, normalizedY)
                    ? values[toIndex(normalizedX, normalizedY)]
                    : fallback;
            },
            write(x, y, value) {
                const normalizedX = Math.trunc(x);
                const normalizedY = Math.trunc(y);
                if (!inBounds(normalizedX, normalizedY)) {
                    return false;
                }

                values[toIndex(normalizedX, normalizedY)] = clampUnitInterval(value, defaultValue);
                return true;
            },
            cloneValues() {
                return values.slice();
            },
            describe() {
                return {
                    type: 'ScalarField',
                    fieldId,
                    width,
                    height,
                    size,
                    range: range.slice(),
                    defaultValue,
                    defaultSampleMode: 'bilinear',
                    defaultEdgeMode: 'clamp'
                };
            }
        };
    }

    function createMaskFieldStorage(fieldId, worldBounds, options = {}) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const normalizedOptions = isPlainObject(options) ? options : {};
        const range = Array.isArray(normalizedOptions.range)
            ? normalizedOptions.range.slice(0, 2)
            : DEFAULT_FIELD_RANGE.slice();
        const defaultValue = clampUnitInterval(normalizedOptions.defaultValue, 0);
        const threshold = clampUnitInterval(normalizedOptions.threshold, DEFAULT_LAND_WATER_MASK_THRESHOLD);

        if (typeof macro.createMaskField === 'function') {
            return macro.createMaskField({
                fieldId,
                width,
                height,
                range,
                defaultValue,
                threshold,
                defaultSampleMode: 'nearest',
                defaultEdgeMode: 'clamp'
            });
        }

        const size = width * height;
        const values = new Array(size).fill(defaultValue);

        function inBounds(x, y) {
            return x >= 0 && y >= 0 && x < width && y < height;
        }

        function toIndex(x, y) {
            return (y * width) + x;
        }

        return {
            type: 'MaskField',
            aliases: [
                'ConstraintField'
            ],
            fieldId,
            width,
            height,
            size,
            threshold,
            read(x, y, fallback = defaultValue) {
                const normalizedX = Math.trunc(x);
                const normalizedY = Math.trunc(y);
                return inBounds(normalizedX, normalizedY)
                    ? values[toIndex(normalizedX, normalizedY)]
                    : fallback;
            },
            write(x, y, value) {
                const normalizedX = Math.trunc(x);
                const normalizedY = Math.trunc(y);
                if (!inBounds(normalizedX, normalizedY)) {
                    return false;
                }

                values[toIndex(normalizedX, normalizedY)] = clampUnitInterval(value, defaultValue);
                return true;
            },
            allow(x, y) {
                return this.write(x, y, 1);
            },
            block(x, y) {
                return this.write(x, y, 0);
            },
            cloneValues() {
                return values.slice();
            },
            describe() {
                return {
                    type: 'MaskField',
                    aliases: [
                        'ConstraintField'
                    ],
                    fieldId,
                    width,
                    height,
                    size,
                    range: range.slice(),
                    semantics: {
                        allowed: 1,
                        blocked: 0
                    },
                    filteringSemantics: 'thresholdedMask',
                    defaultValue,
                    threshold,
                    defaultSampleMode: 'nearest',
                    defaultEdgeMode: 'clamp'
                };
            }
        };
    }

    function buildFieldStats(values = []) {
        const numericValues = Array.isArray(values)
            ? values.filter((value) => Number.isFinite(value))
            : [];

        if (!numericValues.length) {
            return {
                min: 0,
                max: 0,
                mean: 0
            };
        }

        const min = numericValues.reduce((currentMin, value) => Math.min(currentMin, value), numericValues[0]);
        const max = numericValues.reduce((currentMax, value) => Math.max(currentMax, value), numericValues[0]);
        const sum = numericValues.reduce((total, value) => total + value, 0);

        return {
            min: roundFieldValue(min),
            max: roundFieldValue(max),
            mean: roundFieldValue(sum / numericValues.length)
        };
    }

    function buildMaskFieldStats(values = []) {
        const baseStats = buildFieldStats(values);
        const normalizedValues = Array.isArray(values)
            ? values.map((value) => clampUnitInterval(value, 0))
            : [];
        const allowedCount = normalizedValues.reduce((total, value) => total + (value >= DEFAULT_LAND_WATER_MASK_THRESHOLD ? 1 : 0), 0);
        const blockedCount = Math.max(0, normalizedValues.length - allowedCount);
        const totalCount = Math.max(1, normalizedValues.length);

        return {
            ...baseStats,
            allowedCount,
            blockedCount,
            allowedRatio: roundFieldValue(allowedCount / totalCount),
            blockedRatio: roundFieldValue(blockedCount / totalCount)
        };
    }

    function serializeScalarField(field, extra = {}, options = {}) {
        const descriptor = typeof field.describe === 'function' ? field.describe() : {};
        const width = normalizeInteger(descriptor.width, normalizeInteger(field.width, 0));
        const height = normalizeInteger(descriptor.height, normalizeInteger(field.height, 0));
        const normalizedOptions = isPlainObject(options) ? options : {};
        const range = Array.isArray(normalizedOptions.range)
            ? normalizedOptions.range.slice(0, 2)
            : (Array.isArray(descriptor.range) ? descriptor.range.slice(0, 2) : DEFAULT_FIELD_RANGE.slice());
        const valueEncoding = normalizeString(
            normalizedOptions.valueEncoding,
            BASE_CONTINENTAL_MASS_VALUE_ENCODING
        );
        const values = typeof field.cloneValues === 'function'
            ? Array.from(field.cloneValues()).map(roundFieldValue)
            : [];

        return {
            fieldType: 'ScalarField',
            fieldId: normalizeString(descriptor.fieldId, normalizeString(field.fieldId, 'scalarField')),
            width,
            height,
            size: width * height,
            range,
            valueEncoding,
            values,
            stats: buildFieldStats(values),
            ...extra
        };
    }

    function serializeMaskField(field, extra = {}, options = {}) {
        const descriptor = typeof field.describe === 'function' ? field.describe() : {};
        const width = normalizeInteger(descriptor.width, normalizeInteger(field.width, 0));
        const height = normalizeInteger(descriptor.height, normalizeInteger(field.height, 0));
        const normalizedOptions = isPlainObject(options) ? options : {};
        const range = Array.isArray(normalizedOptions.range)
            ? normalizedOptions.range.slice(0, 2)
            : (Array.isArray(descriptor.range) ? descriptor.range.slice(0, 2) : DEFAULT_FIELD_RANGE.slice());
        const valueEncoding = normalizeString(
            normalizedOptions.valueEncoding,
            LAND_WATER_MASK_VALUE_ENCODING
        );
        const values = typeof field.cloneValues === 'function'
            ? Array.from(field.cloneValues()).map(roundFieldValue)
            : [];

        return {
            fieldType: 'MaskField',
            aliases: Array.isArray(descriptor.aliases) ? descriptor.aliases.slice() : ['ConstraintField'],
            fieldId: normalizeString(descriptor.fieldId, normalizeString(field.fieldId, 'maskField')),
            width,
            height,
            size: width * height,
            range,
            valueEncoding,
            values,
            threshold: clampUnitInterval(descriptor.threshold, DEFAULT_LAND_WATER_MASK_THRESHOLD),
            semantics: isPlainObject(descriptor.semantics)
                ? cloneValue(descriptor.semantics)
                : {
                    allowed: 1,
                    blocked: 0
                },
            filteringSemantics: normalizeString(descriptor.filteringSemantics, 'thresholdedMask'),
            stats: buildMaskFieldStats(values),
            ...extra
        };
    }

    function buildNamespace(...parts) {
        if (typeof macro.buildMacroSubSeedNamespace === 'function') {
            return macro.buildMacroSubSeedNamespace(...parts);
        }

        const segments = parts
            .flatMap((part) => typeof part === 'string' ? part.split('.') : [])
            .map((segment) => segment.trim())
            .filter(Boolean);

        return ['macro', ...segments.filter((segment) => segment !== 'macro')].join('.');
    }

    function deriveSubSeed(masterSeed, namespace) {
        return typeof macro.deriveMacroSubSeed === 'function'
            ? macro.deriveMacroSubSeed(masterSeed, namespace)
            : normalizeSeed(masterSeed);
    }

    function getNestedObject(root, path = []) {
        return path.reduce((current, segment) => {
            if (!isPlainObject(current)) {
                return null;
            }

            const value = current[segment];
            return isPlainObject(value) ? value : null;
        }, root);
    }

    function findDependencySource(input, dependencyId, candidatePaths) {
        const normalizedInput = isPlainObject(input) ? input : {};

        for (const candidatePath of candidatePaths) {
            const sourceObject = getNestedObject(normalizedInput, candidatePath);
            if (sourceObject && Object.prototype.hasOwnProperty.call(sourceObject, dependencyId)) {
                return candidatePath.join('.');
            }
        }

        return '';
    }

    function resolveFieldFromInput(input, fieldId) {
        const candidatePaths = [
            ['fields'],
            ['outputs', 'fields'],
            ['tectonicSkeleton', 'outputs', 'fields']
        ];
        const normalizedInput = isPlainObject(input) ? input : {};

        for (const candidatePath of candidatePaths) {
            const sourceObject = getNestedObject(normalizedInput, candidatePath);
            if (sourceObject && sourceObject[fieldId]) {
                return sourceObject[fieldId];
            }
        }

        return null;
    }

    function resolveIntermediateFromInput(input, outputId) {
        const candidatePaths = [
            ['intermediateOutputs'],
            ['outputs', 'intermediateOutputs'],
            ['tectonicSkeleton', 'outputs', 'intermediateOutputs']
        ];
        const normalizedInput = isPlainObject(input) ? input : {};

        for (const candidatePath of candidatePaths) {
            const sourceObject = getNestedObject(normalizedInput, candidatePath);
            if (sourceObject && sourceObject[outputId]) {
                return sourceObject[outputId];
            }
        }

        return null;
    }

    function buildReliefSourceInputs(input = {}) {
        return {
            baseContinentalMassField: resolveFieldFromInput(input, 'baseContinentalMassField'),
            macroElevationField: resolveFieldFromInput(input, 'macroElevationField'),
            domainWarpedMacroElevationField: resolveFieldFromInput(input, 'domainWarpedMacroElevationField'),
            mountainAmplificationField: resolveFieldFromInput(input, 'mountainAmplificationField'),
            basinDepressionField: resolveFieldFromInput(input, 'basinDepressionField'),
            plateauCandidateField: resolveFieldFromInput(input, 'plateauCandidateField'),
            seaLevelAppliedElevationField: resolveFieldFromInput(input, 'seaLevelAppliedElevationField'),
            landWaterMaskField: resolveFieldFromInput(input, 'landWaterMaskField'),
            landmassCleanupMaskField: resolveFieldFromInput(input, 'landmassCleanupMaskField'),
            landmassShapeInterestScores: resolveIntermediateFromInput(input, 'landmassShapeInterestScores'),
            continentBodies: resolveIntermediateFromInput(input, 'continentBodies'),
            reliefRegionExtraction: resolveIntermediateFromInput(input, 'reliefRegionExtraction'),
            upliftField: resolveFieldFromInput(input, 'upliftField'),
            subsidenceField: resolveFieldFromInput(input, 'subsidenceField'),
            fractureMaskField: resolveFieldFromInput(input, 'fractureMaskField'),
            ridgeDirectionField: resolveFieldFromInput(input, 'ridgeDirectionField'),
            platePressureField: resolveFieldFromInput(input, 'platePressureField'),
            plainLowlandSmoothingField: resolveFieldFromInput(input, 'plainLowlandSmoothingField'),
            plateSeedDistribution: resolveIntermediateFromInput(input, 'plateSeedDistribution'),
            basinSeeds: resolveIntermediateFromInput(input, 'basinSeeds'),
            mountainBeltCandidates: resolveIntermediateFromInput(input, 'mountainBeltCandidates')
        };
    }

    function readSerializedScalarFieldValue(field, x, y, fallback = 0) {
        if (field && typeof field.read === 'function') {
            return clampUnitInterval(field.read(x, y, fallback), fallback);
        }

        if (field && typeof field.sample === 'function') {
            return clampUnitInterval(field.sample(x, y, { fallback }), fallback);
        }

        if (!field || !Array.isArray(field.values)) {
            return clampUnitInterval(fallback, 0);
        }

        const width = normalizeInteger(field.width, 0);
        const height = normalizeInteger(field.height, 0);
        if (width <= 0 || height <= 0) {
            return clampUnitInterval(fallback, 0);
        }

        const normalizedX = clampGridCoordinate(x, width);
        const normalizedY = clampGridCoordinate(y, height);
        const value = Number(field.values[(normalizedY * width) + normalizedX]);

        return clampUnitInterval(Number.isFinite(value) ? value : fallback, fallback);
    }

    function sampleSerializedScalarFieldValue(field, x, y, fallback = 0) {
        if (field && typeof field.sample === 'function') {
            return clampUnitInterval(field.sample(x, y, { fallback }), fallback);
        }

        if (!field || !Array.isArray(field.values)) {
            return readSerializedScalarFieldValue(field, x, y, fallback);
        }

        const width = normalizeInteger(field.width, 0);
        const height = normalizeInteger(field.height, 0);
        if (width <= 0 || height <= 0) {
            return clampUnitInterval(fallback, 0);
        }

        const normalizedX = Math.max(0, Math.min(width - 1, Number(x) || 0));
        const normalizedY = Math.max(0, Math.min(height - 1, Number(y) || 0));
        const x0 = Math.floor(normalizedX);
        const y0 = Math.floor(normalizedY);
        const x1 = Math.min(width - 1, x0 + 1);
        const y1 = Math.min(height - 1, y0 + 1);
        const tx = normalizedX - x0;
        const ty = normalizedY - y0;
        const topLeft = readSerializedScalarFieldValue(field, x0, y0, fallback);
        const topRight = readSerializedScalarFieldValue(field, x1, y0, fallback);
        const bottomLeft = readSerializedScalarFieldValue(field, x0, y1, fallback);
        const bottomRight = readSerializedScalarFieldValue(field, x1, y1, fallback);
        const top = topLeft + ((topRight - topLeft) * tx);
        const bottom = bottomLeft + ((bottomRight - bottomLeft) * tx);

        return clampUnitInterval(top + ((bottom - top) * ty), fallback);
    }

    function normalizeVector(vector, fallback = { x: 0, y: 0 }) {
        const x = Number(vector && vector.x);
        const y = Number(vector && vector.y);
        const safeX = Number.isFinite(x) ? x : Number(fallback && fallback.x) || 0;
        const safeY = Number.isFinite(y) ? y : Number(fallback && fallback.y) || 0;
        const magnitude = Math.hypot(safeX, safeY);

        if (!magnitude) {
            return { x: 0, y: 0 };
        }

        return {
            x: safeX / magnitude,
            y: safeY / magnitude
        };
    }

    function readSerializedDirectionalFieldVector(field, x, y, fallback = { x: 0, y: 0 }) {
        if (field && typeof field.read === 'function') {
            return normalizeVector(field.read(x, y, fallback), fallback);
        }

        if (!field || !Array.isArray(field.xValues) || !Array.isArray(field.yValues)) {
            return normalizeVector(fallback, { x: 0, y: 0 });
        }

        const width = normalizeInteger(field.width, 0);
        const height = normalizeInteger(field.height, 0);
        if (width <= 0 || height <= 0) {
            return normalizeVector(fallback, { x: 0, y: 0 });
        }

        const normalizedX = clampGridCoordinate(x, width);
        const normalizedY = clampGridCoordinate(y, height);
        const index = (normalizedY * width) + normalizedX;

        return normalizeVector({
            x: field.xValues[index],
            y: field.yValues[index]
        }, fallback);
    }

    function readSerializedDirectionalFieldMagnitude(field, x, y, fallback = 0) {
        if (field && typeof field.read === 'function') {
            const direction = field.read(x, y, { x: 0, y: 0 });
            return clampUnitInterval(Math.hypot(Number(direction && direction.x) || 0, Number(direction && direction.y) || 0), fallback);
        }

        if (!field || !Array.isArray(field.xValues) || !Array.isArray(field.yValues)) {
            return clampUnitInterval(fallback, 0);
        }

        const width = normalizeInteger(field.width, 0);
        const height = normalizeInteger(field.height, 0);
        if (width <= 0 || height <= 0) {
            return clampUnitInterval(fallback, 0);
        }

        const normalizedX = clampGridCoordinate(x, width);
        const normalizedY = clampGridCoordinate(y, height);
        const index = (normalizedY * width) + normalizedX;
        const vectorX = Number(field.xValues[index]);
        const vectorY = Number(field.yValues[index]);

        return clampUnitInterval(Math.hypot(
            Number.isFinite(vectorX) ? vectorX : 0,
            Number.isFinite(vectorY) ? vectorY : 0
        ), fallback);
    }

    function normalizePoint(point = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedBounds = normalizeWorldBounds(worldBounds);
        return {
            x: clampGridCoordinate(point.x, normalizedBounds.width),
            y: clampGridCoordinate(point.y, normalizedBounds.height)
        };
    }

    function getPointDistance(leftPoint, rightPoint) {
        const left = {
            x: Number(leftPoint && leftPoint.x) || 0,
            y: Number(leftPoint && leftPoint.y) || 0
        };
        const right = {
            x: Number(rightPoint && rightPoint.x) || 0,
            y: Number(rightPoint && rightPoint.y) || 0
        };
        return Math.hypot(right.x - left.x, right.y - left.y);
    }

    function getDistanceToSegment(point, startPoint, endPoint, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedPoint = normalizePoint(point, worldBounds);
        const start = normalizePoint(startPoint, worldBounds);
        const end = normalizePoint(endPoint, worldBounds);
        const segmentX = end.x - start.x;
        const segmentY = end.y - start.y;
        const segmentLengthSquared = (segmentX * segmentX) + (segmentY * segmentY);

        if (segmentLengthSquared <= 0) {
            return getPointDistance(normalizedPoint, start);
        }

        const projection = (
            ((normalizedPoint.x - start.x) * segmentX)
            + ((normalizedPoint.y - start.y) * segmentY)
        ) / segmentLengthSquared;
        const clampedProjection = Math.max(0, Math.min(1, projection));
        const projectedPoint = {
            x: start.x + (segmentX * clampedProjection),
            y: start.y + (segmentY * clampedProjection)
        };

        return getPointDistance(normalizedPoint, projectedPoint);
    }

    function readMountainBeltCandidateInfluenceAtPoint(mountainBeltCandidateSet, point, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const candidates = Array.isArray(mountainBeltCandidateSet && mountainBeltCandidateSet.mountainBeltCandidates)
            ? mountainBeltCandidateSet.mountainBeltCandidates
            : [];
        if (!candidates.length) {
            return 0;
        }

        const normalizedPoint = normalizePoint(point, worldBounds);
        let strongestInfluence = 0;

        candidates.forEach((candidate) => {
            const candidateArea = isPlainObject(candidate && candidate.candidateArea)
                ? candidate.candidateArea
                : {};
            const centerPoint = isPlainObject(candidateArea.centerPoint)
                ? normalizePoint(candidateArea.centerPoint, worldBounds)
                : normalizePoint({
                    x: Math.round((worldBounds.width - 1) / 2),
                    y: Math.round((worldBounds.height - 1) / 2)
                }, worldBounds);
            const areaRadius = Math.max(
                2,
                normalizeInteger(candidateArea.radiusX, 1),
                normalizeInteger(candidateArea.radiusY, 1)
            );
            const spineStartPoint = isPlainObject(candidate && candidate.spineStartPoint)
                ? normalizePoint(candidate.spineStartPoint, worldBounds)
                : centerPoint;
            const spineEndPoint = isPlainObject(candidate && candidate.spineEndPoint)
                ? normalizePoint(candidate.spineEndPoint, worldBounds)
                : centerPoint;
            const distanceToSpine = getDistanceToSegment(normalizedPoint, spineStartPoint, spineEndPoint, worldBounds);
            const distanceToCenter = getPointDistance(normalizedPoint, centerPoint);
            const distance = Math.min(distanceToSpine, distanceToCenter);
            const influenceRadius = Math.max(areaRadius * 1.4, 2);
            const falloff = Math.max(0, 1 - (distance / influenceRadius));
            if (falloff <= 0) {
                return;
            }

            const candidateStrength = clampUnitInterval(candidate && candidate.candidateStrength, 0);
            const amplificationBias = clampUnitInterval(candidate && candidate.mountainAmplificationBias, 0);
            const influence = clampUnitInterval(
                ((candidateStrength * 0.68) + (amplificationBias * 0.32))
                * falloff
                * falloff,
                0
            );
            strongestInfluence = Math.max(strongestInfluence, influence);
        });

        return roundFieldValue(strongestInfluence);
    }

    function getSeedAreaRadius(seedArea, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedSeedArea = isPlainObject(seedArea) ? seedArea : {};
        const radiusX = Math.max(1, normalizeInteger(normalizedSeedArea.radiusX, 0));
        const radiusY = Math.max(1, normalizeInteger(normalizedSeedArea.radiusY, radiusX));
        return Math.max(
            radiusX,
            radiusY,
            Math.round(Math.min(worldBounds.width, worldBounds.height) * DEFAULT_BASIN_SEED_BASE_RADIUS_RATIO)
        );
    }

    function readBasinSeedInfluenceAtPoint(basinSeedSet, point, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const basinSeeds = Array.isArray(basinSeedSet && basinSeedSet.basinSeeds)
            ? basinSeedSet.basinSeeds
            : [];
        if (!basinSeeds.length) {
            return 0;
        }

        const normalizedPoint = normalizePoint(point, worldBounds);
        let strongestInfluence = 0;

        basinSeeds.forEach((basinSeed) => {
            const seedPoint = normalizePoint(basinSeed && basinSeed.seedPoint, worldBounds);
            const radius = getSeedAreaRadius(basinSeed && basinSeed.seedArea, worldBounds);
            const distance = getPointDistance(normalizedPoint, seedPoint);
            const falloff = Math.max(0, 1 - (distance / Math.max(1, radius)));
            if (falloff <= 0) {
                return;
            }

            const influence = clampUnitInterval(
                (
                    (clampUnitInterval(basinSeed && basinSeed.basinSeedStrength, 0) * 0.72)
                    + (clampUnitInterval(basinSeed && basinSeed.basinRetentionBias, 0) * 0.28)
                )
                * falloff
                * falloff,
                0
            );
            strongestInfluence = Math.max(strongestInfluence, influence);
        });

        return roundFieldValue(strongestInfluence);
    }

    function describeFieldDependencyAvailability(input = {}) {
        const fieldCandidatePaths = [
            ['fields'],
            ['outputs', 'fields'],
            ['tectonicSkeleton', 'outputs', 'fields']
        ];
        const intermediateCandidatePaths = [
            ['intermediateOutputs'],
            ['outputs', 'intermediateOutputs'],
            ['tectonicSkeleton', 'outputs', 'intermediateOutputs']
        ];

        return {
            fields: FIELD_DEPENDENCIES.map((dependency) => {
                const sourcePath = findDependencySource(input, dependency.fieldId, fieldCandidatePaths);
                return {
                    ...cloneValue(dependency),
                    provided: Boolean(sourcePath),
                    sourcePath
                };
            }),
            intermediateOutputs: INTERMEDIATE_DEPENDENCIES.map((dependency) => {
                const sourcePath = findDependencySource(input, dependency.outputId, intermediateCandidatePaths);
                return {
                    ...cloneValue(dependency),
                    provided: Boolean(sourcePath),
                    sourcePath
                };
            })
        };
    }

    function readUnitGridValue(values, width, height, x, y) {
        const normalizedX = clampGridCoordinate(x, width);
        const normalizedY = clampGridCoordinate(y, height);
        const value = Number(values[(normalizedY * width) + normalizedX]);
        return clampUnitInterval(Number.isFinite(value) ? value : 0, 0);
    }

    function smoothUnitGridValues(values, width, height, passes = DEFAULT_BASE_CONTINENTAL_MASS_SMOOTHING_PASSES) {
        let currentValues = Array.isArray(values) ? values.slice() : new Array(width * height).fill(0);
        const normalizedPasses = Math.max(0, normalizeInteger(passes, DEFAULT_BASE_CONTINENTAL_MASS_SMOOTHING_PASSES));
        const kernel = [
            { x: -2, y: -2, weight: 1 },
            { x: -1, y: -2, weight: 2 },
            { x: 0, y: -2, weight: 3 },
            { x: 1, y: -2, weight: 2 },
            { x: 2, y: -2, weight: 1 },
            { x: -2, y: -1, weight: 2 },
            { x: -1, y: -1, weight: 4 },
            { x: 0, y: -1, weight: 6 },
            { x: 1, y: -1, weight: 4 },
            { x: 2, y: -1, weight: 2 },
            { x: -2, y: 0, weight: 3 },
            { x: -1, y: 0, weight: 6 },
            { x: 0, y: 0, weight: 9 },
            { x: 1, y: 0, weight: 6 },
            { x: 2, y: 0, weight: 3 },
            { x: -2, y: 1, weight: 2 },
            { x: -1, y: 1, weight: 4 },
            { x: 0, y: 1, weight: 6 },
            { x: 1, y: 1, weight: 4 },
            { x: 2, y: 1, weight: 2 },
            { x: -2, y: 2, weight: 1 },
            { x: -1, y: 2, weight: 2 },
            { x: 0, y: 2, weight: 3 },
            { x: 1, y: 2, weight: 2 },
            { x: 2, y: 2, weight: 1 }
        ];

        for (let passIndex = 0; passIndex < normalizedPasses; passIndex += 1) {
            const nextValues = new Array(width * height).fill(0);
            for (let y = 0; y < height; y += 1) {
                for (let x = 0; x < width; x += 1) {
                    let weightedTotal = 0;
                    let totalWeight = 0;
                    kernel.forEach((entry) => {
                        weightedTotal += readUnitGridValue(
                            currentValues,
                            width,
                            height,
                            x + entry.x,
                            y + entry.y
                        ) * entry.weight;
                        totalWeight += entry.weight;
                    });
                    nextValues[(y * width) + x] = clampUnitInterval(weightedTotal / Math.max(1, totalWeight), 0);
                }
            }
            currentValues = nextValues;
        }

        return currentValues;
    }

    function hashUnit(seed, x, y) {
        let value = (normalizeSeed(seed) ^ Math.imul(x + 0x9e3779b9, 374761393) ^ Math.imul(y + 0x85ebca6b, 668265263)) >>> 0;
        value = Math.imul(value ^ (value >>> 16), 2246822507) >>> 0;
        value = Math.imul(value ^ (value >>> 13), 3266489909) >>> 0;
        value = (value ^ (value >>> 16)) >>> 0;
        return value / 4294967295;
    }

    function readCoarseSeedBias(seed, x, y, worldBounds) {
        const coarseScale = Math.max(4, Math.floor(Math.min(worldBounds.width, worldBounds.height) / 8));
        const coarseX = Math.floor(x / coarseScale);
        const coarseY = Math.floor(y / coarseScale);
        const localX = (x % coarseScale) / coarseScale;
        const localY = (y % coarseScale) / coarseScale;
        const topLeft = hashUnit(seed, coarseX, coarseY);
        const topRight = hashUnit(seed, coarseX + 1, coarseY);
        const bottomLeft = hashUnit(seed, coarseX, coarseY + 1);
        const bottomRight = hashUnit(seed, coarseX + 1, coarseY + 1);
        const top = topLeft + ((topRight - topLeft) * localX);
        const bottom = bottomLeft + ((bottomRight - bottomLeft) * localX);
        return top + ((bottom - top) * localY);
    }

    function buildBaseContinentalSourceFieldIds(sourceInputs = {}) {
        return {
            upliftFieldId: normalizeString(sourceInputs.upliftField && sourceInputs.upliftField.fieldId, 'upliftField'),
            subsidenceFieldId: normalizeString(sourceInputs.subsidenceField && sourceInputs.subsidenceField.fieldId, 'subsidenceField'),
            fractureFieldId: normalizeString(sourceInputs.fractureMaskField && sourceInputs.fractureMaskField.fieldId, 'fractureMaskField'),
            ridgeDirectionFieldId: normalizeString(sourceInputs.ridgeDirectionField && sourceInputs.ridgeDirectionField.fieldId, 'ridgeDirectionField'),
            platePressureFieldId: normalizeString(sourceInputs.platePressureField && sourceInputs.platePressureField.fieldId, 'platePressureField'),
            plainLowlandSmoothingFieldId: normalizeString(sourceInputs.plainLowlandSmoothingField && sourceInputs.plainLowlandSmoothingField.fieldId, 'plainLowlandSmoothingField')
        };
    }

    function buildBaseContinentalMassCompatibility(sourceInputs = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const requiredFields = [
            'upliftField',
            'subsidenceField',
            'fractureMaskField',
            'ridgeDirectionField',
            'platePressureField',
            'plainLowlandSmoothingField'
        ];

        return {
            sourceFieldIds: buildBaseContinentalSourceFieldIds(sourceInputs),
            requiredFieldsProvided: requiredFields.every((fieldId) => Boolean(sourceInputs[fieldId])),
            futureLandmassSynthesisInput: true,
            futureMarineCarvingInput: true,
            futureContinentExtractionInput: true,
            sameWorldBoundsRequired: true,
            worldBounds: cloneValue(worldBounds)
        };
    }

    function buildMacroElevationSourceFieldIds(sourceInputs = {}) {
        return {
            baseContinentalMassFieldId: normalizeString(sourceInputs.baseContinentalMassField && sourceInputs.baseContinentalMassField.fieldId, 'baseContinentalMassField'),
            upliftFieldId: normalizeString(sourceInputs.upliftField && sourceInputs.upliftField.fieldId, 'upliftField'),
            subsidenceFieldId: normalizeString(sourceInputs.subsidenceField && sourceInputs.subsidenceField.fieldId, 'subsidenceField'),
            fractureFieldId: normalizeString(sourceInputs.fractureMaskField && sourceInputs.fractureMaskField.fieldId, 'fractureMaskField'),
            ridgeDirectionFieldId: normalizeString(sourceInputs.ridgeDirectionField && sourceInputs.ridgeDirectionField.fieldId, 'ridgeDirectionField'),
            platePressureFieldId: normalizeString(sourceInputs.platePressureField && sourceInputs.platePressureField.fieldId, 'platePressureField'),
            plainLowlandSmoothingFieldId: normalizeString(sourceInputs.plainLowlandSmoothingField && sourceInputs.plainLowlandSmoothingField.fieldId, 'plainLowlandSmoothingField')
        };
    }

    function buildMacroElevationCompatibility(sourceInputs = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const requiredFields = [
            'baseContinentalMassField',
            'upliftField',
            'subsidenceField',
            'fractureMaskField',
            'ridgeDirectionField',
            'platePressureField',
            'plainLowlandSmoothingField'
        ];

        return {
            sourceFieldIds: buildMacroElevationSourceFieldIds(sourceInputs),
            requiredFieldsProvided: requiredFields.every((fieldId) => Boolean(sourceInputs[fieldId])),
            futureMountainAmplificationInput: true,
            futureBasinDepressionInput: true,
            futurePlateauCandidateInput: true,
            futureReliefRegionInput: true,
            sameWorldBoundsRequired: true,
            worldBounds: cloneValue(worldBounds)
        };
    }

    function buildDomainWarpedMacroElevationSourceFieldIds(sourceInputs = {}) {
        return {
            macroElevationFieldId: normalizeString(sourceInputs.macroElevationField && sourceInputs.macroElevationField.fieldId, 'macroElevationField'),
            baseContinentalMassFieldId: normalizeString(sourceInputs.baseContinentalMassField && sourceInputs.baseContinentalMassField.fieldId, 'baseContinentalMassField'),
            ridgeDirectionFieldId: normalizeString(sourceInputs.ridgeDirectionField && sourceInputs.ridgeDirectionField.fieldId, 'ridgeDirectionField'),
            platePressureFieldId: normalizeString(sourceInputs.platePressureField && sourceInputs.platePressureField.fieldId, 'platePressureField'),
            fractureFieldId: normalizeString(sourceInputs.fractureMaskField && sourceInputs.fractureMaskField.fieldId, 'fractureMaskField'),
            upliftFieldId: normalizeString(sourceInputs.upliftField && sourceInputs.upliftField.fieldId, 'upliftField'),
            subsidenceFieldId: normalizeString(sourceInputs.subsidenceField && sourceInputs.subsidenceField.fieldId, 'subsidenceField'),
            plainLowlandSmoothingFieldId: normalizeString(sourceInputs.plainLowlandSmoothingField && sourceInputs.plainLowlandSmoothingField.fieldId, 'plainLowlandSmoothingField')
        };
    }

    function buildDomainWarpedMacroElevationCompatibility(sourceInputs = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const requiredFields = [
            'macroElevationField',
            'baseContinentalMassField',
            'ridgeDirectionField',
            'platePressureField',
            'fractureMaskField',
            'upliftField',
            'subsidenceField',
            'plainLowlandSmoothingField'
        ];

        return {
            sourceFieldIds: buildDomainWarpedMacroElevationSourceFieldIds(sourceInputs),
            requiredFieldsProvided: requiredFields.every((fieldId) => Boolean(sourceInputs[fieldId])),
            futureMountainAmplificationInput: true,
            futureBasinDepressionInput: true,
            futurePlateauCandidateInput: true,
            futureReliefRegionInput: true,
            futureCleanupPassInput: true,
            sameWorldBoundsRequired: true,
            worldBounds: cloneValue(worldBounds)
        };
    }

    function buildMountainAmplificationSourceFieldIds(sourceInputs = {}) {
        return {
            domainWarpedMacroElevationFieldId: normalizeString(sourceInputs.domainWarpedMacroElevationField && sourceInputs.domainWarpedMacroElevationField.fieldId, 'domainWarpedMacroElevationField'),
            macroElevationFieldId: normalizeString(sourceInputs.macroElevationField && sourceInputs.macroElevationField.fieldId, 'macroElevationField'),
            ridgeDirectionFieldId: normalizeString(sourceInputs.ridgeDirectionField && sourceInputs.ridgeDirectionField.fieldId, 'ridgeDirectionField'),
            platePressureFieldId: normalizeString(sourceInputs.platePressureField && sourceInputs.platePressureField.fieldId, 'platePressureField'),
            upliftFieldId: normalizeString(sourceInputs.upliftField && sourceInputs.upliftField.fieldId, 'upliftField'),
            subsidenceFieldId: normalizeString(sourceInputs.subsidenceField && sourceInputs.subsidenceField.fieldId, 'subsidenceField'),
            fractureFieldId: normalizeString(sourceInputs.fractureMaskField && sourceInputs.fractureMaskField.fieldId, 'fractureMaskField'),
            mountainBeltCandidateSetId: normalizeString(sourceInputs.mountainBeltCandidates && sourceInputs.mountainBeltCandidates.candidateSetId, 'mountainBeltCandidates')
        };
    }

    function buildMountainAmplificationCompatibility(sourceInputs = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const requiredInputs = [
            'domainWarpedMacroElevationField',
            'macroElevationField',
            'ridgeDirectionField',
            'platePressureField',
            'upliftField',
            'subsidenceField',
            'fractureMaskField',
            'mountainBeltCandidates'
        ];

        return {
            sourceFieldIds: buildMountainAmplificationSourceFieldIds(sourceInputs),
            requiredFieldsProvided: requiredInputs.every((fieldId) => Boolean(sourceInputs[fieldId])),
            futureRainShadowInput: true,
            futureReliefRegionInput: true,
            futureMountainSystemLinkageInput: true,
            sameWorldBoundsRequired: true,
            worldBounds: cloneValue(worldBounds)
        };
    }

    function buildBasinDepressionSourceFieldIds(sourceInputs = {}) {
        return {
            domainWarpedMacroElevationFieldId: normalizeString(sourceInputs.domainWarpedMacroElevationField && sourceInputs.domainWarpedMacroElevationField.fieldId, 'domainWarpedMacroElevationField'),
            macroElevationFieldId: normalizeString(sourceInputs.macroElevationField && sourceInputs.macroElevationField.fieldId, 'macroElevationField'),
            plainLowlandSmoothingFieldId: normalizeString(sourceInputs.plainLowlandSmoothingField && sourceInputs.plainLowlandSmoothingField.fieldId, 'plainLowlandSmoothingField'),
            subsidenceFieldId: normalizeString(sourceInputs.subsidenceField && sourceInputs.subsidenceField.fieldId, 'subsidenceField'),
            upliftFieldId: normalizeString(sourceInputs.upliftField && sourceInputs.upliftField.fieldId, 'upliftField'),
            fractureFieldId: normalizeString(sourceInputs.fractureMaskField && sourceInputs.fractureMaskField.fieldId, 'fractureMaskField'),
            platePressureFieldId: normalizeString(sourceInputs.platePressureField && sourceInputs.platePressureField.fieldId, 'platePressureField'),
            mountainAmplificationFieldId: normalizeString(sourceInputs.mountainAmplificationField && sourceInputs.mountainAmplificationField.fieldId, 'mountainAmplificationField'),
            basinSeedSetId: normalizeString(sourceInputs.basinSeeds && sourceInputs.basinSeeds.basinSeedSetId, 'basinSeeds')
        };
    }

    function buildBasinDepressionCompatibility(sourceInputs = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const requiredInputs = [
            'domainWarpedMacroElevationField',
            'macroElevationField',
            'plainLowlandSmoothingField',
            'subsidenceField',
            'upliftField',
            'fractureMaskField',
            'platePressureField',
            'mountainAmplificationField',
            'basinSeeds'
        ];

        return {
            sourceFieldIds: buildBasinDepressionSourceFieldIds(sourceInputs),
            requiredFieldsProvided: requiredInputs.every((fieldId) => Boolean(sourceInputs[fieldId])),
            futureLakeFormationInput: true,
            futureMarshFormationInput: true,
            futureWetlandRetentionInput: true,
            sameWorldBoundsRequired: true,
            worldBounds: cloneValue(worldBounds)
        };
    }

    function buildPlateauCandidateSourceFieldIds(sourceInputs = {}) {
        return {
            domainWarpedMacroElevationFieldId: normalizeString(sourceInputs.domainWarpedMacroElevationField && sourceInputs.domainWarpedMacroElevationField.fieldId, 'domainWarpedMacroElevationField'),
            macroElevationFieldId: normalizeString(sourceInputs.macroElevationField && sourceInputs.macroElevationField.fieldId, 'macroElevationField'),
            baseContinentalMassFieldId: normalizeString(sourceInputs.baseContinentalMassField && sourceInputs.baseContinentalMassField.fieldId, 'baseContinentalMassField'),
            platePressureFieldId: normalizeString(sourceInputs.platePressureField && sourceInputs.platePressureField.fieldId, 'platePressureField'),
            upliftFieldId: normalizeString(sourceInputs.upliftField && sourceInputs.upliftField.fieldId, 'upliftField'),
            subsidenceFieldId: normalizeString(sourceInputs.subsidenceField && sourceInputs.subsidenceField.fieldId, 'subsidenceField'),
            fractureFieldId: normalizeString(sourceInputs.fractureMaskField && sourceInputs.fractureMaskField.fieldId, 'fractureMaskField'),
            ridgeDirectionFieldId: normalizeString(sourceInputs.ridgeDirectionField && sourceInputs.ridgeDirectionField.fieldId, 'ridgeDirectionField'),
            plainLowlandSmoothingFieldId: normalizeString(sourceInputs.plainLowlandSmoothingField && sourceInputs.plainLowlandSmoothingField.fieldId, 'plainLowlandSmoothingField')
        };
    }

    function buildPlateauCandidateCompatibility(sourceInputs = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const requiredFields = [
            'domainWarpedMacroElevationField',
            'macroElevationField',
            'baseContinentalMassField',
            'platePressureField',
            'upliftField',
            'subsidenceField',
            'fractureMaskField',
            'ridgeDirectionField',
            'plainLowlandSmoothingField'
        ];

        return {
            sourceFieldIds: buildPlateauCandidateSourceFieldIds(sourceInputs),
            requiredFieldsProvided: requiredFields.every((fieldId) => Boolean(sourceInputs[fieldId])),
            futureReliefClassificationInput: true,
            futurePlateauReliefTypeInput: true,
            futureReliefRegionInput: true,
            sameWorldBoundsRequired: true,
            worldBounds: cloneValue(worldBounds)
        };
    }

    function buildSeaLevelAppliedElevationSourceFieldIds(sourceInputs = {}) {
        return {
            domainWarpedMacroElevationFieldId: normalizeString(sourceInputs.domainWarpedMacroElevationField && sourceInputs.domainWarpedMacroElevationField.fieldId, 'domainWarpedMacroElevationField'),
            mountainAmplificationFieldId: normalizeString(sourceInputs.mountainAmplificationField && sourceInputs.mountainAmplificationField.fieldId, 'mountainAmplificationField'),
            basinDepressionFieldId: normalizeString(sourceInputs.basinDepressionField && sourceInputs.basinDepressionField.fieldId, 'basinDepressionField'),
            plateauCandidateFieldId: normalizeString(sourceInputs.plateauCandidateField && sourceInputs.plateauCandidateField.fieldId, 'plateauCandidateField'),
            baseContinentalMassFieldId: normalizeString(sourceInputs.baseContinentalMassField && sourceInputs.baseContinentalMassField.fieldId, 'baseContinentalMassField'),
            plainLowlandSmoothingFieldId: normalizeString(sourceInputs.plainLowlandSmoothingField && sourceInputs.plainLowlandSmoothingField.fieldId, 'plainLowlandSmoothingField')
        };
    }

    function buildSeaLevelAppliedElevationCompatibility(sourceInputs = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const requiredFields = [
            'domainWarpedMacroElevationField',
            'mountainAmplificationField',
            'basinDepressionField',
            'plateauCandidateField',
            'baseContinentalMassField',
            'plainLowlandSmoothingField'
        ];

        return {
            sourceFieldIds: buildSeaLevelAppliedElevationSourceFieldIds(sourceInputs),
            requiredFieldsProvided: requiredFields.every((fieldId) => Boolean(sourceInputs[fieldId])),
            futureSeaFillInput: true,
            futureMarineFloodFillInput: true,
            futureContinentExtractionInput: true,
            futureLandWaterMaskInput: true,
            sameWorldBoundsRequired: true,
            worldBounds: cloneValue(worldBounds)
        };
    }

    function buildLandWaterMaskSourceFieldIds(sourceInputs = {}) {
        return {
            seaLevelAppliedElevationFieldId: normalizeString(sourceInputs.seaLevelAppliedElevationField && sourceInputs.seaLevelAppliedElevationField.fieldId, 'seaLevelAppliedElevationField')
        };
    }

    function buildLandWaterMaskCompatibility(sourceInputs = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        return {
            sourceFieldIds: buildLandWaterMaskSourceFieldIds(sourceInputs),
            requiredFieldsProvided: Boolean(sourceInputs.seaLevelAppliedElevationField),
            futureMarineCarvingInput: true,
            futureContinentExtractionInput: true,
            futureCoastlineRefinementInput: true,
            futureSeaRegionClusteringInput: true,
            sameWorldBoundsRequired: true,
            worldBounds: cloneValue(worldBounds)
        };
    }

    function buildLandmassCleanupMaskSourceFieldIds(sourceInputs = {}) {
        return {
            landWaterMaskFieldId: normalizeString(sourceInputs.landWaterMaskField && sourceInputs.landWaterMaskField.fieldId, 'landWaterMaskField'),
            seaLevelAppliedElevationFieldId: normalizeString(sourceInputs.seaLevelAppliedElevationField && sourceInputs.seaLevelAppliedElevationField.fieldId, 'seaLevelAppliedElevationField'),
            baseContinentalMassFieldId: normalizeString(sourceInputs.baseContinentalMassField && sourceInputs.baseContinentalMassField.fieldId, 'baseContinentalMassField'),
            mountainAmplificationFieldId: normalizeString(sourceInputs.mountainAmplificationField && sourceInputs.mountainAmplificationField.fieldId, 'mountainAmplificationField'),
            basinDepressionFieldId: normalizeString(sourceInputs.basinDepressionField && sourceInputs.basinDepressionField.fieldId, 'basinDepressionField')
        };
    }

    function buildLandmassCleanupMaskCompatibility(sourceInputs = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const requiredFields = [
            'landWaterMaskField',
            'seaLevelAppliedElevationField',
            'baseContinentalMassField',
            'mountainAmplificationField',
            'basinDepressionField'
        ];

        return {
            sourceFieldIds: buildLandmassCleanupMaskSourceFieldIds(sourceInputs),
            requiredFieldsProvided: requiredFields.every((fieldId) => Boolean(sourceInputs[fieldId])),
            futureContinentExtractionInput: true,
            futureMarineCarvingInput: true,
            futureCoastlineRefinementInput: true,
            futureSeaRegionClusteringInput: true,
            sameWorldBoundsRequired: true,
            worldBounds: cloneValue(worldBounds)
        };
    }

    function buildLandmassShapeInterestSourceFieldIds(sourceInputs = {}) {
        return {
            landmassCleanupMaskFieldId: normalizeString(sourceInputs.landmassCleanupMaskField && sourceInputs.landmassCleanupMaskField.fieldId, 'landmassCleanupMaskField'),
            landWaterMaskFieldId: normalizeString(sourceInputs.landWaterMaskField && sourceInputs.landWaterMaskField.fieldId, 'landWaterMaskField'),
            seaLevelAppliedElevationFieldId: normalizeString(sourceInputs.seaLevelAppliedElevationField && sourceInputs.seaLevelAppliedElevationField.fieldId, 'seaLevelAppliedElevationField'),
            baseContinentalMassFieldId: normalizeString(sourceInputs.baseContinentalMassField && sourceInputs.baseContinentalMassField.fieldId, 'baseContinentalMassField'),
            mountainAmplificationFieldId: normalizeString(sourceInputs.mountainAmplificationField && sourceInputs.mountainAmplificationField.fieldId, 'mountainAmplificationField'),
            basinDepressionFieldId: normalizeString(sourceInputs.basinDepressionField && sourceInputs.basinDepressionField.fieldId, 'basinDepressionField')
        };
    }

    function buildLandmassShapeInterestCompatibility(sourceInputs = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const requiredFields = [
            'landmassCleanupMaskField',
            'landWaterMaskField',
            'seaLevelAppliedElevationField',
            'baseContinentalMassField',
            'mountainAmplificationField',
            'basinDepressionField'
        ];

        return {
            sourceFieldIds: buildLandmassShapeInterestSourceFieldIds(sourceInputs),
            requiredFieldsProvided: requiredFields.every((fieldId) => Boolean(sourceInputs[fieldId])),
            futureValidationInput: true,
            futureRebalanceInput: true,
            sameWorldBoundsRequired: true,
            worldBounds: cloneValue(worldBounds)
        };
    }

    function buildContinentBodiesSourceFieldIds(sourceInputs = {}) {
        return {
            landmassCleanupMaskFieldId: normalizeString(sourceInputs.landmassCleanupMaskField && sourceInputs.landmassCleanupMaskField.fieldId, 'landmassCleanupMaskField'),
            landWaterMaskFieldId: normalizeString(sourceInputs.landWaterMaskField && sourceInputs.landWaterMaskField.fieldId, 'landWaterMaskField'),
            seaLevelAppliedElevationFieldId: normalizeString(sourceInputs.seaLevelAppliedElevationField && sourceInputs.seaLevelAppliedElevationField.fieldId, 'seaLevelAppliedElevationField'),
            baseContinentalMassFieldId: normalizeString(sourceInputs.baseContinentalMassField && sourceInputs.baseContinentalMassField.fieldId, 'baseContinentalMassField'),
            mountainAmplificationFieldId: normalizeString(sourceInputs.mountainAmplificationField && sourceInputs.mountainAmplificationField.fieldId, 'mountainAmplificationField'),
            basinDepressionFieldId: normalizeString(sourceInputs.basinDepressionField && sourceInputs.basinDepressionField.fieldId, 'basinDepressionField'),
            plateauCandidateFieldId: normalizeString(sourceInputs.plateauCandidateField && sourceInputs.plateauCandidateField.fieldId, 'plateauCandidateField'),
            plateSeedDistributionId: normalizeString(sourceInputs.plateSeedDistribution && sourceInputs.plateSeedDistribution.distributionId, 'plateSeedDistribution')
        };
    }

    function buildContinentBodiesCompatibility(sourceInputs = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const requiredInputs = [
            'landmassCleanupMaskField',
            'landWaterMaskField',
            'seaLevelAppliedElevationField',
            'baseContinentalMassField',
            'mountainAmplificationField',
            'basinDepressionField',
            'plateauCandidateField',
            'plateSeedDistribution'
        ];
        const plateSeedWorldBounds = sourceInputs.plateSeedDistribution && isPlainObject(sourceInputs.plateSeedDistribution.worldBounds)
            ? sourceInputs.plateSeedDistribution.worldBounds
            : null;

        return {
            sourceFieldIds: buildContinentBodiesSourceFieldIds(sourceInputs),
            requiredFieldsProvided: requiredInputs.every((fieldId) => Boolean(sourceInputs[fieldId])),
            futureContinentRecordInput: true,
            requiresReliefRegionLinkage: true,
            requiresClimateBandLinkage: true,
            sameWorldBoundsRequired: true,
            samePlateSeedWorldBounds: Boolean(
                plateSeedWorldBounds
                && plateSeedWorldBounds.width === worldBounds.width
                && plateSeedWorldBounds.height === worldBounds.height
            ),
            worldBounds: cloneValue(worldBounds)
        };
    }

    function createSerializedBinaryMaskValues(field, worldBounds, threshold = DEFAULT_LAND_WATER_MASK_THRESHOLD) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const normalizedThreshold = clampUnitInterval(threshold, DEFAULT_LAND_WATER_MASK_THRESHOLD);
        const values = new Array(width * height).fill(0);

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const value = readSerializedScalarFieldValue(field, x, y, 0);
                values[(y * width) + x] = value >= normalizedThreshold ? 1 : 0;
            }
        }

        return values;
    }

    function collectMaskComponents(values, width, height, targetValue) {
        const normalizedValues = Array.isArray(values) ? values : [];
        const visited = new Array(normalizedValues.length).fill(false);
        const components = [];

        function pushNeighbor(queue, visitedIndexes, x, y) {
            if (x < 0 || y < 0 || x >= width || y >= height) {
                return;
            }

            const index = (y * width) + x;
            if (visitedIndexes[index] || normalizedValues[index] !== targetValue) {
                return;
            }

            visitedIndexes[index] = true;
            queue.push(index);
        }

        for (let index = 0; index < normalizedValues.length; index += 1) {
            if (visited[index] || normalizedValues[index] !== targetValue) {
                continue;
            }

            const queue = [index];
            const cells = [];
            let touchesBorder = false;
            visited[index] = true;

            for (let cursor = 0; cursor < queue.length; cursor += 1) {
                const currentIndex = queue[cursor];
                const x = currentIndex % width;
                const y = Math.floor(currentIndex / width);
                cells.push(currentIndex);
                if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
                    touchesBorder = true;
                }

                pushNeighbor(queue, visited, x - 1, y);
                pushNeighbor(queue, visited, x + 1, y);
                pushNeighbor(queue, visited, x, y - 1);
                pushNeighbor(queue, visited, x, y + 1);
            }

            components.push({
                value: targetValue,
                cells,
                cellCount: cells.length,
                touchesBorder
            });
        }

        return components;
    }

    function countNeighborMatches(values, width, height, x, y, targetValue) {
        let matches = 0;

        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
            for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
                if (offsetX === 0 && offsetY === 0) {
                    continue;
                }

                const nextX = x + offsetX;
                const nextY = y + offsetY;
                if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) {
                    continue;
                }

                const index = (nextY * width) + nextX;
                if (values[index] === targetValue) {
                    matches += 1;
                }
            }
        }

        return matches;
    }

    function sortLandmassComponents(components = []) {
        return components.slice().sort((left, right) => {
            if (right.cellCount !== left.cellCount) {
                return right.cellCount - left.cellCount;
            }

            const leftAnchor = left.cells.length ? Math.min(...left.cells) : Number.MAX_SAFE_INTEGER;
            const rightAnchor = right.cells.length ? Math.min(...right.cells) : Number.MAX_SAFE_INTEGER;
            return leftAnchor - rightAnchor;
        });
    }

    function scoreLandmassComponentShape(component, componentIndex, width, height, sourceInputs, totalCells, minimumLandmassCellCount) {
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;
        let coastlineEdgeCount = 0;
        let coastalCellCount = 0;
        let seaLevelElevationSum = 0;
        let seaLevelElevationSquaredSum = 0;
        let mountainAmplificationSum = 0;
        let basinDepressionSum = 0;
        let baseContinentalMassSum = 0;

        component.cells.forEach((cellIndex) => {
            const x = cellIndex % width;
            const y = Math.floor(cellIndex / width);
            const seaLevelElevation = readSerializedScalarFieldValue(sourceInputs.seaLevelAppliedElevationField, x, y, 0);
            const mountainAmplification = readSerializedScalarFieldValue(sourceInputs.mountainAmplificationField, x, y, 0);
            const basinDepression = readSerializedScalarFieldValue(sourceInputs.basinDepressionField, x, y, 0);
            const baseContinentalMass = readSerializedScalarFieldValue(sourceInputs.baseContinentalMassField, x, y, 0);
            let isCoastalCell = false;

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            seaLevelElevationSum += seaLevelElevation;
            seaLevelElevationSquaredSum += seaLevelElevation * seaLevelElevation;
            mountainAmplificationSum += mountainAmplification;
            basinDepressionSum += basinDepression;
            baseContinentalMassSum += baseContinentalMass;

            [
                [x - 1, y],
                [x + 1, y],
                [x, y - 1],
                [x, y + 1]
            ].forEach(([nextX, nextY]) => {
                if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) {
                    coastlineEdgeCount += 1;
                    isCoastalCell = true;
                    return;
                }

                const neighborIndex = (nextY * width) + nextX;
                if (sourceInputs.__cleanupMaskValues[neighborIndex] === 0) {
                    coastlineEdgeCount += 1;
                    isCoastalCell = true;
                }
            });

            if (isCoastalCell) {
                coastalCellCount += 1;
            }
        });

        const cellCount = component.cellCount;
        const normalizedArea = cellCount / Math.max(1, totalCells);
        const boundingBox = {
            minX,
            minY,
            maxX,
            maxY,
            width: (maxX - minX) + 1,
            height: (maxY - minY) + 1
        };
        const bboxArea = Math.max(1, boundingBox.width * boundingBox.height);
        const compactness = clampUnitInterval(cellCount / bboxArea, 0);
        const elongationRatio = Math.max(boundingBox.width, boundingBox.height) / Math.max(1, Math.min(boundingBox.width, boundingBox.height));
        const elongationScore = clampUnitInterval((elongationRatio - 1) / 2.75, 0);
        const coastlineComplexityRaw = coastlineEdgeCount / Math.max(1, Math.sqrt(cellCount) * 4);
        const coastlineComplexityScore = clampUnitInterval((coastlineComplexityRaw - 1) / 0.85, 0);
        const meanSeaLevelElevation = seaLevelElevationSum / Math.max(1, cellCount);
        const seaLevelElevationVariance = Math.max(
            0,
            (seaLevelElevationSquaredSum / Math.max(1, cellCount)) - (meanSeaLevelElevation * meanSeaLevelElevation)
        );
        const seaLevelElevationStdDev = Math.sqrt(seaLevelElevationVariance);
        const meanMountainAmplification = mountainAmplificationSum / Math.max(1, cellCount);
        const meanBasinDepression = basinDepressionSum / Math.max(1, cellCount);
        const meanBaseContinentalMass = baseContinentalMassSum / Math.max(1, cellCount);
        const compactnessInterestScore = clampUnitInterval((1 - compactness) * 1.15, 0);
        const scaleScore = clampUnitInterval(
            (normalizedArea - (minimumLandmassCellCount / Math.max(1, totalCells))) / 0.18,
            0
        );
        const coastalPresenceScore = clampUnitInterval(coastalCellCount / Math.max(1, cellCount * 0.45), 0);
        const reliefContrastScore = clampUnitInterval(
            (seaLevelElevationStdDev * 1.8)
            + (meanMountainAmplification * 0.65)
            + (meanBasinDepression * 0.35),
            0
        );
        const shapeInterestScore = clampUnitInterval(
            (scaleScore * 0.18)
            + (coastlineComplexityScore * 0.28)
            + (compactnessInterestScore * 0.18)
            + (elongationScore * 0.12)
            + (reliefContrastScore * 0.18)
            + (coastalPresenceScore * 0.06),
            0
        );
        const anchorIndex = component.cells.length ? Math.min(...component.cells) : 0;
        const landmassId = `landmass_${String(componentIndex + 1).padStart(3, '0')}`;

        return {
            landmassId,
            anchorCellIndex: anchorIndex,
            cellCount,
            normalizedArea: roundFieldValue(normalizedArea),
            coastlineEdgeCount,
            coastalCellCount,
            coastalCellRatio: roundFieldValue(coastalCellCount / Math.max(1, cellCount)),
            boundingBox,
            compactness: roundFieldValue(compactness),
            elongationRatio: roundFieldValue(elongationRatio),
            coastlineComplexity: roundFieldValue(coastlineComplexityRaw),
            meanSeaLevelElevation: roundFieldValue(meanSeaLevelElevation),
            meanMountainAmplification: roundFieldValue(meanMountainAmplification),
            meanBasinDepression: roundFieldValue(meanBasinDepression),
            meanBaseContinentalMass: roundFieldValue(meanBaseContinentalMass),
            reliefContrast: roundFieldValue(reliefContrastScore),
            shapeInterestScore: roundFieldValue(shapeInterestScore),
            scoreBreakdown: {
                scaleScore: roundFieldValue(scaleScore),
                coastlineComplexityScore: roundFieldValue(coastlineComplexityScore),
                compactnessInterestScore: roundFieldValue(compactnessInterestScore),
                elongationScore: roundFieldValue(elongationScore),
                reliefContrastScore: roundFieldValue(reliefContrastScore),
                coastalPresenceScore: roundFieldValue(coastalPresenceScore)
            },
            validationHooks: {
                futureValidationInput: true,
                futureRebalanceInput: true,
                priorityBand: shapeInterestScore >= 0.7
                    ? 'high'
                    : shapeInterestScore >= 0.45
                        ? 'medium'
                        : 'low',
                lowInterestLandmass: shapeInterestScore < 0.4
            }
        };
    }

    function buildLandmassShapeInterestScores(sourceInputs, worldBounds, seed) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const totalCells = Math.max(1, width * height);
        const cleanupMaskValues = createSerializedBinaryMaskValues(
            sourceInputs.landmassCleanupMaskField,
            worldBounds,
            DEFAULT_LANDMASS_CLEANUP_MASK_THRESHOLD
        );
        const allLandmassComponents = sortLandmassComponents(collectMaskComponents(cleanupMaskValues, width, height, 1));
        const minimumLandmassCellCount = Math.max(12, Math.round(totalCells * 0.025));
        const scoredComponents = allLandmassComponents
            .filter((component) => component.cellCount >= minimumLandmassCellCount)
            .map((component, componentIndex) => scoreLandmassComponentShape(
                component,
                componentIndex,
                width,
                height,
                {
                    ...sourceInputs,
                    __cleanupMaskValues: cleanupMaskValues
                },
                totalCells,
                minimumLandmassCellCount
            ));
        const scoredLandCells = scoredComponents.reduce((total, landmassScore) => total + landmassScore.cellCount, 0);
        const meanShapeInterestScore = scoredComponents.length
            ? scoredComponents.reduce((total, landmassScore) => total + landmassScore.shapeInterestScore, 0) / scoredComponents.length
            : 0;
        const maxShapeInterestScore = scoredComponents.length
            ? scoredComponents.reduce((currentMax, landmassScore) => Math.max(currentMax, landmassScore.shapeInterestScore), 0)
            : 0;
        const highInterestLandmassCount = scoredComponents.filter((landmassScore) => landmassScore.shapeInterestScore >= 0.7).length;
        const lowInterestLandmassCount = scoredComponents.filter((landmassScore) => landmassScore.shapeInterestScore < 0.4).length;
        const topLandmass = scoredComponents.reduce((best, landmassScore) => {
            if (!best || landmassScore.shapeInterestScore > best.shapeInterestScore) {
                return landmassScore;
            }

            return best;
        }, null);

        return {
            scoringId: 'landmassShapeInterestScores',
            stageId: LANDMASS_SHAPE_INTEREST_STAGE_ID,
            status: IMPLEMENTED_STATUS,
            namespace: buildNamespace(PIPELINE_STEP_ID, 'landmassShapeInterest'),
            seed,
            worldBounds: cloneValue(worldBounds),
            minimumLandmassCellCount,
            landmassCount: allLandmassComponents.length,
            scoredLandmassCount: scoredComponents.length,
            selectionModel: 'cleanedLargeLandmassComponentSelectionV1',
            scoreModel: 'landmassShapeInterestScoringV1',
            sourceFieldIds: buildLandmassShapeInterestSourceFieldIds(sourceInputs),
            compatibility: buildLandmassShapeInterestCompatibility(sourceInputs, worldBounds),
            intentionallyAbsent: [
                'wholeWorldValidation',
                'validationReport',
                'rebalanceActions',
                'strategicRegions',
                'historyFacingAnalysis',
                'gameplaySemantics'
            ],
            summary: {
                totalLandCells: cleanupMaskValues.reduce((total, value) => total + (value >= DEFAULT_LANDMASS_CLEANUP_MASK_THRESHOLD ? 1 : 0), 0),
                scoredLandCells,
                scoredAreaRatio: roundFieldValue(scoredLandCells / totalCells),
                meanShapeInterestScore: roundFieldValue(meanShapeInterestScore),
                maxShapeInterestScore: roundFieldValue(maxShapeInterestScore),
                highInterestLandmassCount,
                lowInterestLandmassCount,
                topLandmassId: topLandmass ? topLandmass.landmassId : '',
                outputPolicy: 'major-landmass shape-interest input only; no whole-world validation, rebalance execution, strategic-region synthesis, or history-facing analysis'
            },
            landmassScores: scoredComponents
        };
    }

    function findNearestPlateSeed(point, plateSeeds = [], worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedPoint = normalizePoint(point, worldBounds);
        let nearestPlateSeed = null;
        let nearestDistanceSquared = Number.POSITIVE_INFINITY;

        plateSeeds.forEach((plateSeed) => {
            const seedPoint = normalizePoint(plateSeed && plateSeed.seedPoint, worldBounds);
            const deltaX = seedPoint.x - normalizedPoint.x;
            const deltaY = seedPoint.y - normalizedPoint.y;
            const distanceSquared = (deltaX * deltaX) + (deltaY * deltaY);

            if (distanceSquared < nearestDistanceSquared) {
                nearestDistanceSquared = distanceSquared;
                nearestPlateSeed = plateSeed;
                return;
            }

            if (
                distanceSquared === nearestDistanceSquared
                && nearestPlateSeed
                && normalizeString(plateSeed && plateSeed.plateId, '') < normalizeString(nearestPlateSeed.plateId, '')
            ) {
                nearestPlateSeed = plateSeed;
            }
        });

        return nearestPlateSeed;
    }

    function buildContinentMacroShape(shapeMetrics = {}) {
        const compactness = clampUnitInterval(shapeMetrics.compactness, 0);
        const coastalCellRatio = clampUnitInterval(shapeMetrics.coastalCellRatio, 0);
        const coastlineComplexity = clampUnitInterval(Number(shapeMetrics.coastlineComplexity) / 2, 0);
        const elongationRatio = Number(shapeMetrics.elongationRatio) || 1;

        if (coastlineComplexity >= 0.68 && compactness <= 0.46) {
            return 'crescent_mass';
        }

        if (coastlineComplexity >= 0.78) {
            return 'broken_mass';
        }

        if (elongationRatio >= 2.35) {
            return 'elongated_mass';
        }

        if (compactness >= 0.74 && coastalCellRatio <= 0.34) {
            return 'compact_mass';
        }

        if (coastalCellRatio >= 0.48) {
            return 'maritime_broad_mass';
        }

        return 'broad_mass';
    }

    function buildContinentRecordDraft(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        if (typeof macro.createContinentRecordSkeleton === 'function') {
            return macro.createContinentRecordSkeleton(normalizedInput);
        }

        return {
            continentId: normalizeString(normalizedInput.continentId, ''),
            nameSeed: normalizeString(normalizedInput.nameSeed, ''),
            macroShape: normalizeString(normalizedInput.macroShape, ''),
            plateIds: Array.isArray(normalizedInput.plateIds) ? normalizedInput.plateIds.slice() : [],
            reliefRegionIds: Array.isArray(normalizedInput.reliefRegionIds) ? normalizedInput.reliefRegionIds.slice() : [],
            climateBandIds: Array.isArray(normalizedInput.climateBandIds) ? normalizedInput.climateBandIds.slice() : [],
            primaryReliefRegionId: normalizeString(normalizedInput.primaryReliefRegionId, ''),
            primaryClimateBandId: normalizeString(normalizedInput.primaryClimateBandId, '')
        };
    }

    function buildPlateCompositionForCells(cells = [], plateSeeds = [], worldBounds = DEFAULT_WORLD_BOUNDS) {
        const plateCounts = new Map();

        cells.forEach((cellIndex) => {
            const x = cellIndex % worldBounds.width;
            const y = Math.floor(cellIndex / worldBounds.width);
            const nearestPlateSeed = findNearestPlateSeed({ x, y }, plateSeeds, worldBounds);
            const plateId = normalizeString(nearestPlateSeed && nearestPlateSeed.plateId, '');

            if (!plateId) {
                return;
            }

            plateCounts.set(plateId, {
                plateId,
                plateClass: normalizeString(nearestPlateSeed && nearestPlateSeed.plateClass, 'mixed'),
                cellCount: normalizeInteger((plateCounts.get(plateId) && plateCounts.get(plateId).cellCount) || 0, 0) + 1
            });
        });

        return Array.from(plateCounts.values())
            .map((entry) => ({
                ...entry,
                cellRatio: roundFieldValue(entry.cellCount / Math.max(1, cells.length))
            }))
            .sort((left, right) => {
                if (right.cellCount !== left.cellCount) {
                    return right.cellCount - left.cellCount;
                }

                return normalizeString(left.plateId, '').localeCompare(normalizeString(right.plateId, ''));
            });
    }

    function buildContinentBodies(sourceInputs, worldBounds, macroSeed) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const totalCells = Math.max(1, width * height);
        const cleanupMaskValues = createSerializedBinaryMaskValues(
            sourceInputs.landmassCleanupMaskField,
            worldBounds,
            DEFAULT_LANDMASS_CLEANUP_MASK_THRESHOLD
        );
        const allLandmassComponents = sortLandmassComponents(collectMaskComponents(cleanupMaskValues, width, height, 1));
        const minimumContinentCellCount = Math.max(12, Math.round(totalCells * 0.025));
        const selectedComponents = allLandmassComponents.filter((component) => component.cellCount >= minimumContinentCellCount);
        const continentComponents = selectedComponents.length
            ? selectedComponents
            : (allLandmassComponents.length ? [allLandmassComponents[0]] : []);
        const plateSeeds = Array.isArray(sourceInputs.plateSeedDistribution && sourceInputs.plateSeedDistribution.plateSeeds)
            ? sourceInputs.plateSeedDistribution.plateSeeds
            : [];
        const continentBodies = continentComponents.map((component, componentIndex) => {
            const continentBodyIndex = componentIndex + 1;
            const continentBodyId = `continentBody_${String(continentBodyIndex).padStart(3, '0')}`;
            const continentId = `cont_${String(continentBodyIndex).padStart(2, '0')}`;
            const bodyNamespaceId = `continent${String(continentBodyIndex).padStart(2, '0')}`;
            const bodyNamespace = buildNamespace(PIPELINE_STEP_ID, 'continentBodies', bodyNamespaceId);
            const shapeMetrics = scoreLandmassComponentShape(
                component,
                componentIndex,
                width,
                height,
                {
                    ...sourceInputs,
                    __cleanupMaskValues: cleanupMaskValues
                },
                totalCells,
                minimumContinentCellCount
            );
            const plateComposition = buildPlateCompositionForCells(component.cells, plateSeeds, worldBounds);
            const plateIds = plateComposition
                .filter((entry, index) => index === 0 || entry.cellRatio >= 0.08)
                .slice(0, 4)
                .map((entry) => entry.plateId);
            const dominantPlateId = plateIds[0] || '';
            let xSum = 0;
            let ySum = 0;
            let plateauCandidateSum = 0;

            component.cells.forEach((cellIndex) => {
                const x = cellIndex % width;
                const y = Math.floor(cellIndex / width);
                xSum += x;
                ySum += y;
                plateauCandidateSum += readSerializedScalarFieldValue(sourceInputs.plateauCandidateField, x, y, 0);
            });

            const centroidPoint = normalizePoint({
                x: Math.round(xSum / Math.max(1, component.cellCount)),
                y: Math.round(ySum / Math.max(1, component.cellCount))
            }, worldBounds);
            const normalizedCentroid = {
                x: worldBounds.width > 1 ? roundFieldValue(centroidPoint.x / (worldBounds.width - 1)) : 0,
                y: worldBounds.height > 1 ? roundFieldValue(centroidPoint.y / (worldBounds.height - 1)) : 0
            };
            const meanPlateauCandidate = roundFieldValue(plateauCandidateSum / Math.max(1, component.cellCount));
            const macroShape = buildContinentMacroShape(shapeMetrics);
            const recordDraft = buildContinentRecordDraft({
                continentId,
                nameSeed: `${bodyNamespace}.nameSeed`,
                macroShape,
                plateIds,
                reliefRegionIds: [],
                climateBandIds: [],
                primaryReliefRegionId: '',
                primaryClimateBandId: ''
            });

            return {
                continentBodyId,
                recordDraft,
                pendingRecordFields: [
                    'reliefRegionIds',
                    'climateBandIds',
                    'primaryReliefRegionId',
                    'primaryClimateBandId'
                ],
                cellCount: component.cellCount,
                cellIndices: component.cells.slice(),
                normalizedArea: roundFieldValue(component.cellCount / totalCells),
                boundingBox: cloneValue(shapeMetrics.boundingBox),
                centroidPoint,
                normalizedCentroid,
                touchesBorder: Boolean(component.touchesBorder),
                coastlineEdgeCount: shapeMetrics.coastlineEdgeCount,
                coastalCellCount: shapeMetrics.coastalCellCount,
                coastalCellRatio: shapeMetrics.coastalCellRatio,
                dominantPlateId,
                plateIds: plateIds.slice(),
                plateComposition,
                macroShape,
                macroShapeSignals: {
                    compactness: shapeMetrics.compactness,
                    elongationRatio: shapeMetrics.elongationRatio,
                    coastlineComplexity: shapeMetrics.coastlineComplexity,
                    reliefContrast: shapeMetrics.reliefContrast,
                    shapeInterestScore: shapeMetrics.shapeInterestScore
                },
                sourceSignals: {
                    meanSeaLevelElevation: shapeMetrics.meanSeaLevelElevation,
                    meanBaseContinentalMass: shapeMetrics.meanBaseContinentalMass,
                    meanMountainAmplification: shapeMetrics.meanMountainAmplification,
                    meanBasinDepression: shapeMetrics.meanBasinDepression,
                    meanPlateauCandidate
                },
                namespace: bodyNamespace,
                seed: deriveSubSeed(macroSeed, bodyNamespace)
            };
        });
        const representedLandCells = continentBodies.reduce((total, body) => total + normalizeInteger(body.cellCount, 0), 0);
        const meanBodyArea = continentBodies.length
            ? continentBodies.reduce((total, body) => total + body.normalizedArea, 0) / continentBodies.length
            : 0;
        const topBody = continentBodies[0] || null;

        return {
            continentBodySetId: 'continentBodies',
            stageId: CONTINENT_BODIES_STAGE_ID,
            status: IMPLEMENTED_STATUS,
            namespace: buildNamespace(PIPELINE_STEP_ID, 'continentBodies'),
            seed: deriveSubSeed(macroSeed, buildNamespace(PIPELINE_STEP_ID, 'continentBodies')),
            worldBounds: cloneValue(worldBounds),
            minimumContinentCellCount,
            landmassCount: allLandmassComponents.length,
            continentBodyCount: continentBodies.length,
            selectionModel: 'cleanedLargeLandmassComponentSelectionV1',
            synthesisModel: 'continentBodyDraftSynthesisV1',
            sourceFieldIds: buildContinentBodiesSourceFieldIds(sourceInputs),
            compatibility: buildContinentBodiesCompatibility(sourceInputs, worldBounds),
            intentionallyAbsent: [
                'continents',
                'continentSummaries',
                'historyFacingAnalysis',
                'strategicRegions',
                'seaRegions',
                'gameplaySemantics'
            ],
            summary: {
                totalLandCells: cleanupMaskValues.reduce((total, value) => total + (value >= DEFAULT_LANDMASS_CLEANUP_MASK_THRESHOLD ? 1 : 0), 0),
                representedLandCells,
                representedAreaRatio: roundFieldValue(representedLandCells / totalCells),
                meanBodyArea: roundFieldValue(meanBodyArea),
                dominantContinentBodyId: topBody ? topBody.continentBodyId : '',
                selectionPolicy: 'major cleaned landmass components only; relief/climate linkage and final continents[] export stay deferred'
            },
            continentBodies
        };
    }

    function buildReliefRegionsSourceFieldIds(sourceInputs = {}) {
        return {
            landmassCleanupMaskFieldId: normalizeString(sourceInputs.landmassCleanupMaskField && sourceInputs.landmassCleanupMaskField.fieldId, 'landmassCleanupMaskField'),
            landWaterMaskFieldId: normalizeString(sourceInputs.landWaterMaskField && sourceInputs.landWaterMaskField.fieldId, 'landWaterMaskField'),
            seaLevelAppliedElevationFieldId: normalizeString(sourceInputs.seaLevelAppliedElevationField && sourceInputs.seaLevelAppliedElevationField.fieldId, 'seaLevelAppliedElevationField'),
            mountainAmplificationFieldId: normalizeString(sourceInputs.mountainAmplificationField && sourceInputs.mountainAmplificationField.fieldId, 'mountainAmplificationField'),
            basinDepressionFieldId: normalizeString(sourceInputs.basinDepressionField && sourceInputs.basinDepressionField.fieldId, 'basinDepressionField'),
            plateauCandidateFieldId: normalizeString(sourceInputs.plateauCandidateField && sourceInputs.plateauCandidateField.fieldId, 'plateauCandidateField'),
            baseContinentalMassFieldId: normalizeString(sourceInputs.baseContinentalMassField && sourceInputs.baseContinentalMassField.fieldId, 'baseContinentalMassField'),
            fractureFieldId: normalizeString(sourceInputs.fractureMaskField && sourceInputs.fractureMaskField.fieldId, 'fractureMaskField'),
            ridgeDirectionFieldId: normalizeString(sourceInputs.ridgeDirectionField && sourceInputs.ridgeDirectionField.fieldId, 'ridgeDirectionField'),
            plainLowlandSmoothingFieldId: normalizeString(sourceInputs.plainLowlandSmoothingField && sourceInputs.plainLowlandSmoothingField.fieldId, 'plainLowlandSmoothingField'),
            continentBodySetId: normalizeString(sourceInputs.continentBodies && sourceInputs.continentBodies.continentBodySetId, 'continentBodies'),
            plateSeedDistributionId: normalizeString(sourceInputs.plateSeedDistribution && sourceInputs.plateSeedDistribution.distributionId, 'plateSeedDistribution')
        };
    }

    function buildReliefRegionsCompatibility(sourceInputs = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const requiredInputs = [
            'landmassCleanupMaskField',
            'landWaterMaskField',
            'seaLevelAppliedElevationField',
            'mountainAmplificationField',
            'basinDepressionField',
            'plateauCandidateField',
            'baseContinentalMassField',
            'continentBodies',
            'plateSeedDistribution'
        ];

        return {
            sourceFieldIds: buildReliefRegionsSourceFieldIds(sourceInputs),
            requiredFieldsProvided: requiredInputs.every((fieldId) => Boolean(sourceInputs[fieldId])),
            producesReliefRegionRecords: true,
            futureContinentReliefLinkageInput: true,
            futureMountainSystemReliefLinkageInput: true,
            futureSeaRegionAdjacencyLinkageInput: true,
            climateClassificationRequiredLater: true,
            sameWorldBoundsRequired: true,
            worldBounds: cloneValue(worldBounds)
        };
    }

    function isCoastalLandCell(maskValues, width, height, cellIndex) {
        const x = cellIndex % width;
        const y = Math.floor(cellIndex / width);

        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
            return true;
        }

        return [
            [x - 1, y],
            [x + 1, y],
            [x, y - 1],
            [x, y + 1]
        ].some(([nextX, nextY]) => {
            const nextIndex = (nextY * width) + nextX;
            return maskValues[nextIndex] === 0;
        });
    }

    function classifyReliefRegionCell(sourceInputs, cleanupMaskValues, width, height, cellIndex) {
        const x = cellIndex % width;
        const y = Math.floor(cellIndex / width);
        const isCoastal = isCoastalLandCell(cleanupMaskValues, width, height, cellIndex);
        const seaLevelElevation = readSerializedScalarFieldValue(sourceInputs.seaLevelAppliedElevationField, x, y, 0);
        const mountainAmplification = readSerializedScalarFieldValue(sourceInputs.mountainAmplificationField, x, y, 0);
        const basinDepression = readSerializedScalarFieldValue(sourceInputs.basinDepressionField, x, y, 0);
        const plateauCandidate = readSerializedScalarFieldValue(sourceInputs.plateauCandidateField, x, y, 0);
        const baseContinentalMass = readSerializedScalarFieldValue(sourceInputs.baseContinentalMassField, x, y, 0);
        const plainLowland = readSerializedScalarFieldValue(sourceInputs.plainLowlandSmoothingField, x, y, 0);
        const ridgeMagnitude = readSerializedDirectionalFieldMagnitude(sourceInputs.ridgeDirectionField, x, y, 0);

        if (mountainAmplification >= 0.62 || (mountainAmplification >= 0.54 && ridgeMagnitude >= 0.36)) {
            return 'mountain';
        }

        if (
            isCoastal
            && basinDepression < 0.74
            && (
                seaLevelElevation <= 0.72
                || baseContinentalMass < 0.62
                || plainLowland >= 0.35
            )
        ) {
            return 'coast';
        }

        if (basinDepression >= 0.54 && mountainAmplification < 0.52) {
            return 'basin';
        }

        if (plateauCandidate >= 0.5 && seaLevelElevation >= 0.34 && basinDepression < 0.58) {
            return 'plateau';
        }

        return 'plain';
    }

    function getReliefRegionTypeOrder(reliefType) {
        const index = RELIEF_REGION_TYPES.indexOf(reliefType);
        return index >= 0 ? index : RELIEF_REGION_TYPES.length;
    }

    function collectReliefRegionComponents(reliefTypeValues, width, height, minimumReliefRegionCellCount) {
        const candidates = [];

        RELIEF_REGION_TYPES.forEach((reliefType) => {
            const typeMaskValues = reliefTypeValues.map((value) => value === reliefType ? 1 : 0);
            const components = sortLandmassComponents(collectMaskComponents(typeMaskValues, width, height, 1));
            const typeMinimum = reliefType === 'coast'
                ? Math.max(6, Math.round(minimumReliefRegionCellCount * 0.55))
                : minimumReliefRegionCellCount;
            components
                .filter((component) => component.cellCount >= typeMinimum)
                .forEach((component) => {
                    candidates.push({
                        reliefType,
                        component
                    });
                });
        });

        if (!candidates.length) {
            const fallbackCandidates = RELIEF_REGION_TYPES
                .flatMap((reliefType) => {
                    const typeMaskValues = reliefTypeValues.map((value) => value === reliefType ? 1 : 0);
                    return sortLandmassComponents(collectMaskComponents(typeMaskValues, width, height, 1))
                        .slice(0, 1)
                        .map((component) => ({
                            reliefType,
                            component
                        }));
                })
                .filter((candidate) => candidate.component.cellCount > 0)
                .sort((left, right) => right.component.cellCount - left.component.cellCount);

            if (fallbackCandidates.length) {
                candidates.push(fallbackCandidates[0]);
            }
        }

        return candidates.sort((left, right) => {
            const leftAnchor = left.component.cells.length ? Math.min(...left.component.cells) : Number.MAX_SAFE_INTEGER;
            const rightAnchor = right.component.cells.length ? Math.min(...right.component.cells) : Number.MAX_SAFE_INTEGER;

            if (leftAnchor !== rightAnchor) {
                return leftAnchor - rightAnchor;
            }

            return getReliefRegionTypeOrder(left.reliefType) - getReliefRegionTypeOrder(right.reliefType);
        });
    }

    function buildContinentMembershipLookup(continentBodiesSet) {
        const continentBodies = Array.isArray(continentBodiesSet && continentBodiesSet.continentBodies)
            ? continentBodiesSet.continentBodies
            : [];
        const membership = new Map();

        continentBodies.forEach((continentBody) => {
            const continentId = normalizeString(
                continentBody && continentBody.recordDraft && continentBody.recordDraft.continentId,
                ''
            );
            if (!continentId || !Array.isArray(continentBody.cellIndices)) {
                return;
            }

            continentBody.cellIndices.forEach((cellIndex) => {
                membership.set(cellIndex, continentId);
            });
        });

        return membership;
    }

    function buildContinentOverlapForCells(cells = [], continentMembership = new Map()) {
        const counts = new Map();

        cells.forEach((cellIndex) => {
            const continentId = continentMembership.get(cellIndex);
            if (!continentId) {
                return;
            }

            counts.set(continentId, (counts.get(continentId) || 0) + 1);
        });

        return Array.from(counts.entries())
            .map(([continentId, cellCount]) => ({
                continentId,
                cellCount,
                cellRatio: roundFieldValue(cellCount / Math.max(1, cells.length))
            }))
            .sort((left, right) => {
                if (right.cellCount !== left.cellCount) {
                    return right.cellCount - left.cellCount;
                }

                return left.continentId.localeCompare(right.continentId);
            });
    }

    function buildReliefRegionRecord(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        if (typeof macro.createReliefRegionRecordSkeleton === 'function') {
            return macro.createReliefRegionRecordSkeleton(normalizedInput);
        }

        return {
            reliefRegionId: normalizeString(normalizedInput.reliefRegionId, ''),
            reliefType: normalizeString(normalizedInput.reliefType, ''),
            plateIds: Array.isArray(normalizedInput.plateIds) ? normalizedInput.plateIds.slice() : [],
            continentIds: Array.isArray(normalizedInput.continentIds) ? normalizedInput.continentIds.slice() : [],
            adjacentSeaRegionIds: Array.isArray(normalizedInput.adjacentSeaRegionIds) ? normalizedInput.adjacentSeaRegionIds.slice() : [],
            primaryPlateId: normalizeString(normalizedInput.primaryPlateId, ''),
            elevationBias: clampUnitInterval(normalizedInput.elevationBias, 0),
            ruggednessBias: clampUnitInterval(normalizedInput.ruggednessBias, 0),
            coastalInfluence: clampUnitInterval(normalizedInput.coastalInfluence, 0)
        };
    }

    function summarizeReliefRegionComponent(candidate, regionIndex, sourceInputs, cleanupMaskValues, worldBounds, totalCells, continentMembership, macroSeed) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const component = candidate.component;
        const reliefType = candidate.reliefType;
        const reliefRegionNumber = regionIndex + 1;
        const reliefRegionId = `relief_${String(reliefRegionNumber).padStart(3, '0')}`;
        const regionNamespaceId = `reliefRegion${String(reliefRegionNumber).padStart(3, '0')}`;
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'reliefRegions', regionNamespaceId);
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;
        let xSum = 0;
        let ySum = 0;
        let seaLevelElevationSum = 0;
        let mountainAmplificationSum = 0;
        let basinDepressionSum = 0;
        let plateauCandidateSum = 0;
        let plainLowlandSum = 0;
        let ridgeMagnitudeSum = 0;
        let fractureSum = 0;
        let coastalCellCount = 0;
        let coastlineEdgeCount = 0;

        component.cells.forEach((cellIndex) => {
            const x = cellIndex % width;
            const y = Math.floor(cellIndex / width);
            const seaLevelElevation = readSerializedScalarFieldValue(sourceInputs.seaLevelAppliedElevationField, x, y, 0);
            const mountainAmplification = readSerializedScalarFieldValue(sourceInputs.mountainAmplificationField, x, y, 0);
            const basinDepression = readSerializedScalarFieldValue(sourceInputs.basinDepressionField, x, y, 0);
            const plateauCandidate = readSerializedScalarFieldValue(sourceInputs.plateauCandidateField, x, y, 0);
            const plainLowland = readSerializedScalarFieldValue(sourceInputs.plainLowlandSmoothingField, x, y, 0);
            const ridgeMagnitude = readSerializedDirectionalFieldMagnitude(sourceInputs.ridgeDirectionField, x, y, 0);
            const fracture = readSerializedScalarFieldValue(sourceInputs.fractureMaskField, x, y, 0);
            let isCoastal = false;

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            xSum += x;
            ySum += y;
            seaLevelElevationSum += seaLevelElevation;
            mountainAmplificationSum += mountainAmplification;
            basinDepressionSum += basinDepression;
            plateauCandidateSum += plateauCandidate;
            plainLowlandSum += plainLowland;
            ridgeMagnitudeSum += ridgeMagnitude;
            fractureSum += fracture;

            [
                [x - 1, y],
                [x + 1, y],
                [x, y - 1],
                [x, y + 1]
            ].forEach(([nextX, nextY]) => {
                if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) {
                    coastlineEdgeCount += 1;
                    isCoastal = true;
                    return;
                }

                const nextIndex = (nextY * width) + nextX;
                if (cleanupMaskValues[nextIndex] === 0) {
                    coastlineEdgeCount += 1;
                    isCoastal = true;
                }
            });

            if (isCoastal) {
                coastalCellCount += 1;
            }
        });

        const cellCount = component.cellCount;
        const meanSeaLevelElevation = seaLevelElevationSum / Math.max(1, cellCount);
        const meanMountainAmplification = mountainAmplificationSum / Math.max(1, cellCount);
        const meanBasinDepression = basinDepressionSum / Math.max(1, cellCount);
        const meanPlateauCandidate = plateauCandidateSum / Math.max(1, cellCount);
        const meanPlainLowland = plainLowlandSum / Math.max(1, cellCount);
        const meanRidgeMagnitude = ridgeMagnitudeSum / Math.max(1, cellCount);
        const meanFracture = fractureSum / Math.max(1, cellCount);
        const coastalCellRatio = coastalCellCount / Math.max(1, cellCount);
        const plateComposition = buildPlateCompositionForCells(
            component.cells,
            Array.isArray(sourceInputs.plateSeedDistribution && sourceInputs.plateSeedDistribution.plateSeeds)
                ? sourceInputs.plateSeedDistribution.plateSeeds
                : [],
            worldBounds
        );
        const plateIds = plateComposition
            .filter((entry, index) => index === 0 || entry.cellRatio >= 0.08)
            .slice(0, 4)
            .map((entry) => entry.plateId);
        const normalizedPlateIds = plateIds.length ? plateIds : ['plate_01'];
        const primaryPlateId = normalizedPlateIds[0];
        const continentOverlap = buildContinentOverlapForCells(component.cells, continentMembership);
        const continentIds = continentOverlap
            .filter((entry, index) => index === 0 || entry.cellRatio >= 0.08)
            .slice(0, 4)
            .map((entry) => entry.continentId);
        const boundingBox = {
            minX,
            minY,
            maxX,
            maxY,
            width: (maxX - minX) + 1,
            height: (maxY - minY) + 1
        };
        const centroidPoint = normalizePoint({
            x: Math.round(xSum / Math.max(1, cellCount)),
            y: Math.round(ySum / Math.max(1, cellCount))
        }, worldBounds);
        const normalizedCentroid = {
            x: worldBounds.width > 1 ? roundFieldValue(centroidPoint.x / (worldBounds.width - 1)) : 0,
            y: worldBounds.height > 1 ? roundFieldValue(centroidPoint.y / (worldBounds.height - 1)) : 0
        };
        const elevationBias = clampUnitInterval(
            (meanSeaLevelElevation * 0.72)
            + (meanMountainAmplification * 0.16)
            + (meanPlateauCandidate * 0.12)
            - (meanBasinDepression * 0.18),
            0
        );
        const ruggednessBias = clampUnitInterval(
            (meanMountainAmplification * 0.52)
            + (meanRidgeMagnitude * 0.22)
            + (meanFracture * 0.16)
            + (meanPlateauCandidate * 0.08)
            - (meanPlainLowland * 0.1),
            0
        );
        const coastalInfluence = reliefType === 'coast'
            ? Math.max(coastalCellRatio, 0.68)
            : coastalCellRatio;
        const record = buildReliefRegionRecord({
            reliefRegionId,
            reliefType,
            plateIds: normalizedPlateIds,
            continentIds,
            adjacentSeaRegionIds: [],
            primaryPlateId,
            elevationBias: roundFieldValue(elevationBias),
            ruggednessBias: roundFieldValue(ruggednessBias),
            coastalInfluence: roundFieldValue(coastalInfluence)
        });

        return {
            reliefRegionId,
            reliefType,
            record,
            pendingReferenceFields: reliefType === 'coast' ? ['adjacentSeaRegionIds'] : [],
            cellCount,
            cellIndices: component.cells.slice(),
            normalizedArea: roundFieldValue(cellCount / Math.max(1, totalCells)),
            boundingBox,
            centroidPoint,
            normalizedCentroid,
            coastalCellCount,
            coastlineEdgeCount,
            coastalCellRatio: roundFieldValue(coastalCellRatio),
            plateIds: normalizedPlateIds.slice(),
            primaryPlateId,
            plateComposition,
            continentIds,
            continentOverlap,
            sourceSignals: {
                meanSeaLevelElevation: roundFieldValue(meanSeaLevelElevation),
                meanMountainAmplification: roundFieldValue(meanMountainAmplification),
                meanBasinDepression: roundFieldValue(meanBasinDepression),
                meanPlateauCandidate: roundFieldValue(meanPlateauCandidate),
                meanPlainLowland: roundFieldValue(meanPlainLowland),
                meanRidgeMagnitude: roundFieldValue(meanRidgeMagnitude),
                meanFracture: roundFieldValue(meanFracture)
            },
            namespace,
            seed: deriveSubSeed(macroSeed, namespace)
        };
    }

    function buildReliefRegions(sourceInputs, worldBounds, macroSeed) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const totalCells = Math.max(1, width * height);
        const cleanupMaskValues = createSerializedBinaryMaskValues(
            sourceInputs.landmassCleanupMaskField,
            worldBounds,
            DEFAULT_LANDMASS_CLEANUP_MASK_THRESHOLD
        );
        const reliefTypeValues = new Array(totalCells).fill('');
        const typeCellCounts = Object.fromEntries(RELIEF_REGION_TYPES.map((reliefType) => [reliefType, 0]));

        cleanupMaskValues.forEach((value, cellIndex) => {
            if (value !== 1) {
                return;
            }

            const reliefType = classifyReliefRegionCell(sourceInputs, cleanupMaskValues, width, height, cellIndex);
            reliefTypeValues[cellIndex] = reliefType;
            typeCellCounts[reliefType] = normalizeInteger(typeCellCounts[reliefType], 0) + 1;
        });

        const minimumReliefRegionCellCount = Math.max(8, Math.round(totalCells * 0.006));
        const reliefRegionCandidates = collectReliefRegionComponents(
            reliefTypeValues,
            width,
            height,
            minimumReliefRegionCellCount
        );
        const continentMembership = buildContinentMembershipLookup(sourceInputs.continentBodies);
        const reliefRegionBodies = reliefRegionCandidates.map((candidate, regionIndex) => summarizeReliefRegionComponent(
            candidate,
            regionIndex,
            sourceInputs,
            cleanupMaskValues,
            worldBounds,
            totalCells,
            continentMembership,
            macroSeed
        ));
        const reliefRegions = reliefRegionBodies.map((regionBody) => regionBody.record);
        const representedLandCells = reliefRegionBodies.reduce((total, regionBody) => total + normalizeInteger(regionBody.cellCount, 0), 0);
        const typeCounts = RELIEF_REGION_TYPES.reduce((counts, reliefType) => {
            counts[reliefType] = reliefRegionBodies.filter((regionBody) => regionBody.reliefType === reliefType).length;
            return counts;
        }, {});
        const totalLandCells = cleanupMaskValues.reduce((total, value) => total + (value === 1 ? 1 : 0), 0);

        return {
            reliefRegionSetId: 'reliefRegions',
            stageId: RELIEF_REGION_EXTRACTION_STAGE_ID,
            status: IMPLEMENTED_STATUS,
            namespace: buildNamespace(PIPELINE_STEP_ID, 'reliefRegions'),
            seed: deriveSubSeed(macroSeed, buildNamespace(PIPELINE_STEP_ID, 'reliefRegions')),
            worldBounds: cloneValue(worldBounds),
            minimumReliefRegionCellCount,
            classificationModel: 'macroReliefTypeThresholdClassificationV1',
            extractionModel: 'connectedReliefRegionExtractionV1',
            sourceFieldIds: buildReliefRegionsSourceFieldIds(sourceInputs),
            compatibility: buildReliefRegionsCompatibility(sourceInputs, worldBounds),
            intentionallyAbsent: [
                'climateClassification',
                'localBiomePlacement',
                'riverSystems',
                'seaRegions',
                'terrainCells',
                'historyFacingAnalysis',
                'gameplaySemantics'
            ],
            summary: {
                totalLandCells,
                representedLandCells,
                representedAreaRatio: roundFieldValue(representedLandCells / totalCells),
                reliefRegionCount: reliefRegions.length,
                typeCellCounts: cloneValue(typeCellCounts),
                typeCounts,
                outputPolicy: 'large connected relief-region records only; no climate classification, local biome placement, or terrain-cell emission'
            },
            reliefRegions,
            reliefRegionBodies
        };
    }

    function createSerializedScalarFieldDebugAdapter(serializedField = {}, fallbackFieldId = 'scalarField') {
        const fieldId = normalizeString(serializedField.fieldId, fallbackFieldId);
        const width = normalizeInteger(serializedField.width, 0);
        const height = normalizeInteger(serializedField.height, 0);
        const size = normalizeInteger(serializedField.size, width * height);
        const values = Array.isArray(serializedField.values)
            ? serializedField.values.slice()
            : new Array(size).fill(0);
        const range = Array.isArray(serializedField.range)
            ? serializedField.range.slice(0, 2)
            : DEFAULT_FIELD_RANGE.slice();

        return {
            type: 'ScalarField',
            fieldId,
            width,
            height,
            size,
            read(x, y, fallback = 0) {
                if (width <= 0 || height <= 0) {
                    return fallback;
                }

                const normalizedX = clampGridCoordinate(x, width);
                const normalizedY = clampGridCoordinate(y, height);
                const value = Number(values[(normalizedY * width) + normalizedX]);
                return Number.isFinite(value) ? value : fallback;
            },
            describe() {
                return {
                    type: 'ScalarField',
                    fieldId,
                    width,
                    height,
                    size,
                    range,
                    defaultValue: range[0],
                    defaultSampleMode: 'nearest',
                    defaultEdgeMode: 'clamp'
                };
            }
        };
    }

    function createReliefRegionTypeMaskField(reliefRegionExtraction, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedBounds = normalizeWorldBounds(worldBounds);
        const field = createScalarFieldStorage(RELIEF_REGION_TYPE_MASK_FIELD_ID, normalizedBounds, {
            range: DEFAULT_FIELD_RANGE,
            defaultValue: RELIEF_REGION_TYPE_MASK_ENCODING.none
        });
        const reliefRegionBodies = Array.isArray(reliefRegionExtraction && reliefRegionExtraction.reliefRegionBodies)
            ? reliefRegionExtraction.reliefRegionBodies.slice()
            : [];

        reliefRegionBodies
            .sort((left, right) => normalizeString(left && left.reliefRegionId, '').localeCompare(
                normalizeString(right && right.reliefRegionId, '')
            ))
            .forEach((regionBody) => {
                const reliefType = normalizeString(regionBody && regionBody.reliefType, '');
                const encodedValue = Number.isFinite(RELIEF_REGION_TYPE_MASK_ENCODING[reliefType])
                    ? RELIEF_REGION_TYPE_MASK_ENCODING[reliefType]
                    : RELIEF_REGION_TYPE_MASK_ENCODING.none;

                if (!Array.isArray(regionBody && regionBody.cellIndices)) {
                    return;
                }

                regionBody.cellIndices.forEach((cellIndex) => {
                    const normalizedCellIndex = normalizeInteger(cellIndex, -1);
                    if (normalizedCellIndex < 0 || normalizedCellIndex >= field.size) {
                        return;
                    }

                    field.write(
                        normalizedCellIndex % field.width,
                        Math.floor(normalizedCellIndex / field.width),
                        encodedValue
                    );
                });
            });

        return field;
    }

    function attachReliefRegionTypeMaskMetadata(artifact, reliefRegionExtraction) {
        if (!artifact || !isPlainObject(artifact.payload)) {
            return artifact;
        }

        artifact.payload.classificationEncoding = cloneValue(RELIEF_REGION_TYPE_MASK_ENCODING);
        artifact.payload.sourceRecordSetId = normalizeString(
            reliefRegionExtraction && reliefRegionExtraction.reliefRegionSetId,
            'reliefRegions'
        );
        artifact.payload.sourceRecordCount = Array.isArray(reliefRegionExtraction && reliefRegionExtraction.reliefRegions)
            ? reliefRegionExtraction.reliefRegions.length
            : 0;
        artifact.payload.encodingPolicy = '0 means no exported relief region or water; non-zero values encode large connected relief-region classes only.';

        return artifact;
    }

    function buildReliefElevationFieldSnapshotsFromResolvedOutputs(resolvedOutputs = {}) {
        if (typeof macro.buildFieldDebugArtifact !== 'function') {
            throw typeof macro.createTodoContractedError === 'function'
                ? macro.createTodoContractedError('reliefElevation.buildReliefElevationFieldSnapshots')
                : new Error('[worldgen/macro] Missing field debug registry builder.');
        }

        const fields = isPlainObject(resolvedOutputs.fields) ? resolvedOutputs.fields : {};
        const reliefRegionExtraction = isPlainObject(resolvedOutputs.reliefRegionExtraction)
            ? resolvedOutputs.reliefRegionExtraction
            : {};
        const worldBounds = normalizeWorldBounds(
            isPlainObject(resolvedOutputs.worldBounds)
                ? resolvedOutputs.worldBounds
                : (
                    isPlainObject(fields.seaLevelAppliedElevationField && fields.seaLevelAppliedElevationField.worldBounds)
                        ? fields.seaLevelAppliedElevationField.worldBounds
                        : DEFAULT_WORLD_BOUNDS
                )
        );
        const reliefRegionTypeMaskField = createReliefRegionTypeMaskField(reliefRegionExtraction, worldBounds);
        const snapshotSpecs = [
            {
                field: createSerializedScalarFieldDebugAdapter(fields.baseContinentalMassField, 'baseContinentalMassField'),
                artifactId: 'relief.baseContinentalMassField.scalarHeatmap',
                stageId: normalizeString(fields.baseContinentalMassField && fields.baseContinentalMassField.stageId, BASE_CONTINENTAL_MASS_STAGE_ID),
                sourceLayerId: 'baseContinentalMassField'
            },
            {
                field: createSerializedScalarFieldDebugAdapter(fields.macroElevationField, 'macroElevationField'),
                artifactId: 'relief.macroElevationField.scalarHeatmap',
                stageId: normalizeString(fields.macroElevationField && fields.macroElevationField.stageId, MACRO_ELEVATION_STAGE_ID),
                sourceLayerId: 'macroElevationField'
            },
            {
                field: createSerializedScalarFieldDebugAdapter(fields.domainWarpedMacroElevationField, 'domainWarpedMacroElevationField'),
                artifactId: 'relief.domainWarpedMacroElevationField.scalarHeatmap',
                stageId: normalizeString(fields.domainWarpedMacroElevationField && fields.domainWarpedMacroElevationField.stageId, DOMAIN_WARPED_MACRO_ELEVATION_STAGE_ID),
                sourceLayerId: 'domainWarpedMacroElevationField'
            },
            {
                field: createSerializedScalarFieldDebugAdapter(fields.mountainAmplificationField, 'mountainAmplificationField'),
                artifactId: 'relief.mountainAmplificationField.scalarHeatmap',
                stageId: normalizeString(fields.mountainAmplificationField && fields.mountainAmplificationField.stageId, MOUNTAIN_AMPLIFICATION_STAGE_ID),
                sourceLayerId: 'mountainAmplificationField'
            },
            {
                field: createSerializedScalarFieldDebugAdapter(fields.basinDepressionField, 'basinDepressionField'),
                artifactId: 'relief.basinDepressionField.scalarHeatmap',
                stageId: normalizeString(fields.basinDepressionField && fields.basinDepressionField.stageId, BASIN_DEPRESSION_STAGE_ID),
                sourceLayerId: 'basinDepressionField'
            },
            {
                field: createSerializedScalarFieldDebugAdapter(fields.plateauCandidateField, 'plateauCandidateField'),
                artifactId: 'relief.plateauCandidateField.scalarHeatmap',
                stageId: normalizeString(fields.plateauCandidateField && fields.plateauCandidateField.stageId, PLATEAU_CANDIDATE_STAGE_ID),
                sourceLayerId: 'plateauCandidateField'
            },
            {
                field: createSerializedScalarFieldDebugAdapter(fields.seaLevelAppliedElevationField, 'seaLevelAppliedElevationField'),
                artifactId: 'relief.seaLevelAppliedElevationField.scalarHeatmap',
                stageId: normalizeString(fields.seaLevelAppliedElevationField && fields.seaLevelAppliedElevationField.stageId, SEA_LEVEL_APPLIED_ELEVATION_STAGE_ID),
                sourceLayerId: 'seaLevelAppliedElevationField'
            },
            {
                field: createSerializedScalarFieldDebugAdapter(fields.landWaterMaskField, 'landWaterMaskField'),
                artifactId: 'relief.landWaterMaskField.scalarHeatmap',
                stageId: normalizeString(fields.landWaterMaskField && fields.landWaterMaskField.stageId, LAND_WATER_MASK_STAGE_ID),
                sourceLayerId: 'landWaterMaskField'
            },
            {
                field: createSerializedScalarFieldDebugAdapter(fields.landmassCleanupMaskField, 'landmassCleanupMaskField'),
                artifactId: 'relief.landmassCleanupMaskField.scalarHeatmap',
                stageId: normalizeString(fields.landmassCleanupMaskField && fields.landmassCleanupMaskField.stageId, LANDMASS_CLEANUP_MASK_STAGE_ID),
                sourceLayerId: 'landmassCleanupMaskField'
            },
            {
                field: reliefRegionTypeMaskField,
                artifactId: 'relief.reliefRegionTypeMaskField.scalarHeatmap',
                stageId: RELIEF_REGION_EXTRACTION_STAGE_ID,
                sourceLayerId: 'reliefRegions',
                decorateArtifact: (artifact) => attachReliefRegionTypeMaskMetadata(artifact, reliefRegionExtraction)
            }
        ];

        return snapshotSpecs.map((snapshotSpec) => {
            const artifact = macro.buildFieldDebugArtifact(snapshotSpec.field, {
                layerId: 'scalarHeatmap',
                artifactId: snapshotSpec.artifactId,
                stageId: snapshotSpec.stageId,
                sourceLayerId: snapshotSpec.sourceLayerId
            });

            return typeof snapshotSpec.decorateArtifact === 'function'
                ? snapshotSpec.decorateArtifact(artifact)
                : artifact;
        });
    }

    function materializeBaseContinentalMassField(field, worldBounds, sourceInputs, seed) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const rawValues = new Array(width * height).fill(0);
        const componentWeights = {
            platePressure: 0.34,
            uplift: 0.22,
            lowSubsidence: 0.13,
            lowFracture: 0.08,
            ridgeSupport: 0.07,
            plainLowlandSupport: 0.16,
            subsidenceSuppression: 0.18,
            fractureSuppression: 0.08,
            coarseSeedBias: 0.06
        };

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const pressure = readSerializedScalarFieldValue(sourceInputs.platePressureField, x, y, 0);
                const uplift = readSerializedScalarFieldValue(sourceInputs.upliftField, x, y, 0);
                const subsidence = readSerializedScalarFieldValue(sourceInputs.subsidenceField, x, y, 0);
                const fracture = readSerializedScalarFieldValue(sourceInputs.fractureMaskField, x, y, 0);
                const ridge = readSerializedDirectionalFieldMagnitude(sourceInputs.ridgeDirectionField, x, y, 0);
                const plainLowland = readSerializedScalarFieldValue(sourceInputs.plainLowlandSmoothingField, x, y, 0);
                const coarseBias = readCoarseSeedBias(seed, x, y, worldBounds) - 0.5;
                const support = (
                    (pressure * componentWeights.platePressure)
                    + (uplift * componentWeights.uplift)
                    + ((1 - subsidence) * componentWeights.lowSubsidence)
                    + ((1 - fracture) * componentWeights.lowFracture)
                    + (ridge * componentWeights.ridgeSupport)
                    + (plainLowland * componentWeights.plainLowlandSupport)
                    + (coarseBias * componentWeights.coarseSeedBias)
                );
                const suppression = (
                    (subsidence * componentWeights.subsidenceSuppression)
                    + (fracture * componentWeights.fractureSuppression)
                );
                rawValues[(y * width) + x] = clampUnitInterval(support - suppression, 0);
            }
        }

        const smoothedValues = smoothUnitGridValues(
            rawValues,
            width,
            height,
            DEFAULT_BASE_CONTINENTAL_MASS_SMOOTHING_PASSES
        );
        smoothedValues.forEach((value, index) => {
            const x = index % width;
            const y = Math.floor(index / width);
            field.write(x, y, value);
        });

        return {
            modelId: 'reliefBaseContinentalMassFieldV1',
            smoothingKernel: 'weighted5x5',
            smoothingPasses: DEFAULT_BASE_CONTINENTAL_MASS_SMOOTHING_PASSES,
            componentWeights,
            supportChannels: [
                'platePressureField',
                'upliftField',
                'lowSubsidence',
                'lowFracture',
                'ridgeDirectionField',
                'plainLowlandSmoothingField',
                'coarseSeedBias'
            ],
            suppressionChannels: [
                'subsidenceField',
                'fractureMaskField'
            ],
            outputPolicy: 'continuous continental mass tendency only; no coastline thresholding or continent extraction'
        };
    }

    function materializeMacroElevationField(field, worldBounds, sourceInputs, seed) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const rawValues = new Array(width * height).fill(0);
        const componentWeights = {
            baseContinentalMass: 0.42,
            platePressure: 0.17,
            uplift: 0.17,
            ridgeSupport: 0.08,
            plainLowlandSupport: 0.08,
            lowFractureSupport: 0.04,
            subsidenceSuppression: 0.17,
            fractureSuppression: 0.07,
            oceanicMassSuppression: 0.11,
            coarseSeedBias: 0.04,
            baseline: 0.06
        };

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const baseMass = readSerializedScalarFieldValue(sourceInputs.baseContinentalMassField, x, y, 0);
                const pressure = readSerializedScalarFieldValue(sourceInputs.platePressureField, x, y, 0);
                const uplift = readSerializedScalarFieldValue(sourceInputs.upliftField, x, y, 0);
                const subsidence = readSerializedScalarFieldValue(sourceInputs.subsidenceField, x, y, 0);
                const fracture = readSerializedScalarFieldValue(sourceInputs.fractureMaskField, x, y, 0);
                const ridge = readSerializedDirectionalFieldMagnitude(sourceInputs.ridgeDirectionField, x, y, 0);
                const plainLowland = readSerializedScalarFieldValue(sourceInputs.plainLowlandSmoothingField, x, y, 0);
                const coarseBias = readCoarseSeedBias(seed, x, y, worldBounds) - 0.5;
                const support = (
                    componentWeights.baseline
                    + (baseMass * componentWeights.baseContinentalMass)
                    + (pressure * componentWeights.platePressure)
                    + (uplift * componentWeights.uplift)
                    + (ridge * componentWeights.ridgeSupport)
                    + (plainLowland * componentWeights.plainLowlandSupport)
                    + ((1 - fracture) * componentWeights.lowFractureSupport)
                    + (coarseBias * componentWeights.coarseSeedBias)
                );
                const suppression = (
                    (subsidence * componentWeights.subsidenceSuppression)
                    + (fracture * componentWeights.fractureSuppression)
                    + ((1 - baseMass) * componentWeights.oceanicMassSuppression)
                );
                rawValues[(y * width) + x] = clampUnitInterval(support - suppression, 0);
            }
        }

        const smoothedValues = smoothUnitGridValues(
            rawValues,
            width,
            height,
            DEFAULT_MACRO_ELEVATION_SMOOTHING_PASSES
        );
        smoothedValues.forEach((value, index) => {
            const x = index % width;
            const y = Math.floor(index / width);
            const blendedValue = (value * 0.78) + (readUnitGridValue(rawValues, width, height, x, y) * 0.22);
            field.write(x, y, blendedValue);
        });

        return {
            modelId: 'reliefMacroElevationCompositeV1',
            smoothingKernel: 'weighted5x5',
            smoothingPasses: DEFAULT_MACRO_ELEVATION_SMOOTHING_PASSES,
            componentWeights,
            supportChannels: [
                'baseContinentalMassField',
                'platePressureField',
                'upliftField',
                'ridgeDirectionField',
                'plainLowlandSmoothingField',
                'lowFracture',
                'coarseSeedBias'
            ],
            suppressionChannels: [
                'subsidenceField',
                'fractureMaskField',
                'oceanicMassSuppression'
            ],
            outputPolicy: 'continuous normalized macro elevation only; no domain warping, sea level, coastline thresholding, or final terrain semantics'
        };
    }

    function materializeDomainWarpedMacroElevationField(field, worldBounds, sourceInputs, seed) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const minDimension = Math.max(1, Math.min(width, height));
        const maxDisplacement = Math.max(1, Math.round(minDimension * 0.055));
        const sourceField = sourceInputs.macroElevationField;
        const componentWeights = {
            noiseX: 0.52,
            noiseY: 0.52,
            ridgeAlignment: 0.34,
            fracturePerpendicular: 0.2,
            pressureAmplification: 0.26,
            upliftAmplification: 0.16,
            baseMassAmplification: 0.14,
            subsidenceDampening: 0.18,
            originalBlend: 0.24,
            warpedBlend: 0.76
        };

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const macroElevation = readSerializedScalarFieldValue(sourceField, x, y, 0);
                const baseMass = readSerializedScalarFieldValue(sourceInputs.baseContinentalMassField, x, y, 0);
                const pressure = readSerializedScalarFieldValue(sourceInputs.platePressureField, x, y, 0);
                const uplift = readSerializedScalarFieldValue(sourceInputs.upliftField, x, y, 0);
                const subsidence = readSerializedScalarFieldValue(sourceInputs.subsidenceField, x, y, 0);
                const fracture = readSerializedScalarFieldValue(sourceInputs.fractureMaskField, x, y, 0);
                const plainLowland = readSerializedScalarFieldValue(sourceInputs.plainLowlandSmoothingField, x, y, 0);
                const ridgeVector = readSerializedDirectionalFieldVector(sourceInputs.ridgeDirectionField, x, y, { x: 0, y: 0 });
                const ridgeMagnitude = readSerializedDirectionalFieldMagnitude(sourceInputs.ridgeDirectionField, x, y, 0);
                const noiseX = (readCoarseSeedBias(seed ^ 0x9e3779b9, x, y, worldBounds) - 0.5) * 2;
                const noiseY = (readCoarseSeedBias(seed ^ 0x85ebca6b, x + Math.floor(minDimension / 3), y + Math.floor(minDimension / 5), worldBounds) - 0.5) * 2;
                const reliefEnergy = clampUnitInterval(
                    0.2
                    + (pressure * componentWeights.pressureAmplification)
                    + (uplift * componentWeights.upliftAmplification)
                    + (baseMass * componentWeights.baseMassAmplification)
                    + (plainLowland * 0.08)
                    - (subsidence * componentWeights.subsidenceDampening),
                    0.2
                );
                const perpendicularVector = {
                    x: -ridgeVector.y,
                    y: ridgeVector.x
                };
                const warpX = (
                    (noiseX * componentWeights.noiseX)
                    + (ridgeVector.x * ridgeMagnitude * componentWeights.ridgeAlignment)
                    + (perpendicularVector.x * fracture * componentWeights.fracturePerpendicular)
                ) * maxDisplacement * reliefEnergy;
                const warpY = (
                    (noiseY * componentWeights.noiseY)
                    + (ridgeVector.y * ridgeMagnitude * componentWeights.ridgeAlignment)
                    + (perpendicularVector.y * fracture * componentWeights.fracturePerpendicular)
                ) * maxDisplacement * reliefEnergy;
                const warpedValue = sampleSerializedScalarFieldValue(sourceField, x + warpX, y + warpY, macroElevation);
                const blendedValue = (
                    (warpedValue * componentWeights.warpedBlend)
                    + (macroElevation * componentWeights.originalBlend)
                );

                field.write(x, y, blendedValue);
            }
        }

        return {
            modelId: 'reliefDomainWarpedMacroElevationV1',
            warpModel: 'largeScaleCoarseNoiseWithRidgeAlignmentV1',
            maxDisplacement,
            componentWeights,
            displacementChannels: [
                'coarseSeedNoiseX',
                'coarseSeedNoiseY',
                'ridgeDirectionField',
                'fracturePerpendicular'
            ],
            amplitudeChannels: [
                'baseContinentalMassField',
                'platePressureField',
                'upliftField',
                'plainLowlandSmoothingField',
                'subsidenceDampening'
            ],
            samplingPolicy: 'bilinear pull-sampling from macroElevationField with clamp edge handling',
            outputPolicy: 'large-scale distorted macro elevation only; no cleanup pass, sea level, relief-region extraction, or terrain semantics'
        };
    }

    function materializeMountainAmplificationField(field, worldBounds, sourceInputs, seed) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const rawValues = new Array(width * height).fill(0);
        const componentWeights = {
            mountainCandidateInfluence: 0.42,
            ridgeSupport: 0.16,
            upliftSupport: 0.14,
            platePressureSupport: 0.11,
            warpedElevationSupport: 0.08,
            macroElevationSupport: 0.05,
            lowFractureSupport: 0.05,
            coarseSeedBias: 0.03,
            subsidenceSuppression: 0.15,
            fractureSuppression: 0.08,
            smoothedBlend: 0.76,
            rawBlend: 0.24
        };

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const mountainCandidateInfluence = readMountainBeltCandidateInfluenceAtPoint(
                    sourceInputs.mountainBeltCandidates,
                    { x, y },
                    worldBounds
                );
                const ridgeMagnitude = readSerializedDirectionalFieldMagnitude(sourceInputs.ridgeDirectionField, x, y, 0);
                const uplift = readSerializedScalarFieldValue(sourceInputs.upliftField, x, y, 0);
                const pressure = readSerializedScalarFieldValue(sourceInputs.platePressureField, x, y, 0);
                const subsidence = readSerializedScalarFieldValue(sourceInputs.subsidenceField, x, y, 0);
                const fracture = readSerializedScalarFieldValue(sourceInputs.fractureMaskField, x, y, 0);
                const warpedElevation = readSerializedScalarFieldValue(sourceInputs.domainWarpedMacroElevationField, x, y, 0);
                const macroElevation = readSerializedScalarFieldValue(sourceInputs.macroElevationField, x, y, 0);
                const coarseBias = readCoarseSeedBias(seed ^ 0x165667b1, x, y, worldBounds) - 0.5;
                const support = (
                    (mountainCandidateInfluence * componentWeights.mountainCandidateInfluence)
                    + (ridgeMagnitude * componentWeights.ridgeSupport)
                    + (uplift * componentWeights.upliftSupport)
                    + (pressure * componentWeights.platePressureSupport)
                    + (warpedElevation * componentWeights.warpedElevationSupport)
                    + (macroElevation * componentWeights.macroElevationSupport)
                    + ((1 - fracture) * componentWeights.lowFractureSupport)
                    + (coarseBias * componentWeights.coarseSeedBias)
                );
                const suppression = (
                    (subsidence * componentWeights.subsidenceSuppression)
                    + (fracture * componentWeights.fractureSuppression)
                );
                rawValues[(y * width) + x] = clampUnitInterval(support - suppression, 0);
            }
        }

        const smoothedValues = smoothUnitGridValues(
            rawValues,
            width,
            height,
            DEFAULT_MOUNTAIN_AMPLIFICATION_SMOOTHING_PASSES
        );
        smoothedValues.forEach((value, index) => {
            const x = index % width;
            const y = Math.floor(index / width);
            const blendedValue = (
                (value * componentWeights.smoothedBlend)
                + (readUnitGridValue(rawValues, width, height, x, y) * componentWeights.rawBlend)
            );
            field.write(x, y, blendedValue);
        });

        return {
            modelId: 'reliefMountainAmplificationFieldV1',
            smoothingKernel: 'weighted5x5',
            smoothingPasses: DEFAULT_MOUNTAIN_AMPLIFICATION_SMOOTHING_PASSES,
            componentWeights,
            supportChannels: [
                'mountainBeltCandidates',
                'ridgeDirectionField',
                'upliftField',
                'platePressureField',
                'domainWarpedMacroElevationField',
                'macroElevationField',
                'lowFractureSupport',
                'coarseSeedBias'
            ],
            suppressionChannels: [
                'subsidenceField',
                'fractureMaskField'
            ],
            rainShadowPreparation: {
                futureRainShadowInput: true,
                orientationSources: [
                    'ridgeDirectionField',
                    'mountainBeltCandidates'
                ],
                note: 'Carries orographic amplification strength and ridge-aligned source context for a later rain-shadow pass only.'
            },
            outputPolicy: 'continuous mountain amplification tendency only; no mountain records, hydrology, climate logic, or final elevation semantics'
        };
    }

    function materializeBasinDepressionField(field, worldBounds, sourceInputs, seed) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const rawValues = new Array(width * height).fill(0);
        const componentWeights = {
            basinSeedInfluence: 0.36,
            subsidenceSupport: 0.2,
            plainLowlandSupport: 0.16,
            lowMountainSuppression: 0.08,
            lowPressureSupport: 0.06,
            lowUpliftSupport: 0.05,
            lowWarpedElevationSupport: 0.05,
            lowMacroElevationSupport: 0.03,
            coarseSeedBias: 0.02,
            mountainSuppression: 0.18,
            upliftSuppression: 0.12,
            pressureSuppression: 0.07,
            fractureSuppression: 0.06,
            smoothedBlend: 0.82,
            rawBlend: 0.18
        };

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const basinSeedInfluence = readBasinSeedInfluenceAtPoint(sourceInputs.basinSeeds, { x, y }, worldBounds);
                const plainLowland = readSerializedScalarFieldValue(sourceInputs.plainLowlandSmoothingField, x, y, 0);
                const subsidence = readSerializedScalarFieldValue(sourceInputs.subsidenceField, x, y, 0);
                const uplift = readSerializedScalarFieldValue(sourceInputs.upliftField, x, y, 0);
                const fracture = readSerializedScalarFieldValue(sourceInputs.fractureMaskField, x, y, 0);
                const pressure = readSerializedScalarFieldValue(sourceInputs.platePressureField, x, y, 0);
                const mountainAmplification = readSerializedScalarFieldValue(sourceInputs.mountainAmplificationField, x, y, 0);
                const warpedElevation = readSerializedScalarFieldValue(sourceInputs.domainWarpedMacroElevationField, x, y, 0);
                const macroElevation = readSerializedScalarFieldValue(sourceInputs.macroElevationField, x, y, 0);
                const coarseBias = readCoarseSeedBias(seed ^ 0x41c64e6d, x, y, worldBounds) - 0.5;
                const support = (
                    (basinSeedInfluence * componentWeights.basinSeedInfluence)
                    + (subsidence * componentWeights.subsidenceSupport)
                    + (plainLowland * componentWeights.plainLowlandSupport)
                    + ((1 - mountainAmplification) * componentWeights.lowMountainSuppression)
                    + ((1 - pressure) * componentWeights.lowPressureSupport)
                    + ((1 - uplift) * componentWeights.lowUpliftSupport)
                    + ((1 - warpedElevation) * componentWeights.lowWarpedElevationSupport)
                    + ((1 - macroElevation) * componentWeights.lowMacroElevationSupport)
                    + (coarseBias * componentWeights.coarseSeedBias)
                );
                const suppression = (
                    (mountainAmplification * componentWeights.mountainSuppression)
                    + (uplift * componentWeights.upliftSuppression)
                    + (pressure * componentWeights.pressureSuppression)
                    + (fracture * componentWeights.fractureSuppression)
                );
                rawValues[(y * width) + x] = clampUnitInterval(support - suppression, 0);
            }
        }

        const smoothedValues = smoothUnitGridValues(
            rawValues,
            width,
            height,
            DEFAULT_BASIN_DEPRESSION_SMOOTHING_PASSES
        );
        smoothedValues.forEach((value, index) => {
            const x = index % width;
            const y = Math.floor(index / width);
            const blendedValue = (
                (value * componentWeights.smoothedBlend)
                + (readUnitGridValue(rawValues, width, height, x, y) * componentWeights.rawBlend)
            );
            field.write(x, y, blendedValue);
        });

        return {
            modelId: 'reliefBasinDepressionFieldV1',
            smoothingKernel: 'weighted5x5',
            smoothingPasses: DEFAULT_BASIN_DEPRESSION_SMOOTHING_PASSES,
            componentWeights,
            supportChannels: [
                'basinSeeds',
                'subsidenceField',
                'plainLowlandSmoothingField',
                'lowMountainSuppression',
                'lowPressureSupport',
                'lowUpliftSupport',
                'lowWarpedElevationSupport',
                'lowMacroElevationSupport',
                'coarseSeedBias'
            ],
            suppressionChannels: [
                'mountainAmplificationField',
                'upliftField',
                'platePressureField',
                'fractureMaskField'
            ],
            wetlandPreparation: {
                futureLakeFormationInput: true,
                futureMarshFormationInput: true,
                retentionSources: [
                    'basinSeeds',
                    'plainLowlandSmoothingField',
                    'subsidenceField'
                ],
                note: 'Carries basin-floor depression tendency for later lake and marsh retention logic only.'
            },
            outputPolicy: 'continuous basin depression tendency only; no river systems, inland seas, hydrology, or final elevation semantics'
        };
    }

    function materializePlateauCandidateField(field, worldBounds, sourceInputs, seed) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const rawValues = new Array(width * height).fill(0);
        const componentWeights = {
            warpedElevation: 0.3,
            macroElevation: 0.12,
            baseContinentalMass: 0.14,
            uplift: 0.12,
            platePressure: 0.08,
            plainLowlandSupport: 0.17,
            lowRidgeRuggedness: 0.08,
            lowFractureRuggedness: 0.08,
            subsidenceSuppression: 0.17,
            fractureSuppression: 0.12,
            ridgeSuppression: 0.1,
            oceanicMassSuppression: 0.12,
            coarseSeedBias: 0.03,
            smoothedBlend: 0.84,
            rawBlend: 0.16
        };

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const warpedElevation = readSerializedScalarFieldValue(sourceInputs.domainWarpedMacroElevationField, x, y, 0);
                const macroElevation = readSerializedScalarFieldValue(sourceInputs.macroElevationField, x, y, 0);
                const baseMass = readSerializedScalarFieldValue(sourceInputs.baseContinentalMassField, x, y, 0);
                const pressure = readSerializedScalarFieldValue(sourceInputs.platePressureField, x, y, 0);
                const uplift = readSerializedScalarFieldValue(sourceInputs.upliftField, x, y, 0);
                const subsidence = readSerializedScalarFieldValue(sourceInputs.subsidenceField, x, y, 0);
                const fracture = readSerializedScalarFieldValue(sourceInputs.fractureMaskField, x, y, 0);
                const ridgeMagnitude = readSerializedDirectionalFieldMagnitude(sourceInputs.ridgeDirectionField, x, y, 0);
                const plainLowland = readSerializedScalarFieldValue(sourceInputs.plainLowlandSmoothingField, x, y, 0);
                const coarseBias = readCoarseSeedBias(seed ^ 0x27d4eb2d, x, y, worldBounds) - 0.5;
                const support = (
                    (warpedElevation * componentWeights.warpedElevation)
                    + (macroElevation * componentWeights.macroElevation)
                    + (baseMass * componentWeights.baseContinentalMass)
                    + (uplift * componentWeights.uplift)
                    + (pressure * componentWeights.platePressure)
                    + (plainLowland * componentWeights.plainLowlandSupport)
                    + ((1 - ridgeMagnitude) * componentWeights.lowRidgeRuggedness)
                    + ((1 - fracture) * componentWeights.lowFractureRuggedness)
                    + (coarseBias * componentWeights.coarseSeedBias)
                );
                const suppression = (
                    (subsidence * componentWeights.subsidenceSuppression)
                    + (fracture * componentWeights.fractureSuppression)
                    + (ridgeMagnitude * componentWeights.ridgeSuppression)
                    + ((1 - baseMass) * componentWeights.oceanicMassSuppression)
                );
                rawValues[(y * width) + x] = clampUnitInterval(support - suppression, 0);
            }
        }

        const smoothedValues = smoothUnitGridValues(
            rawValues,
            width,
            height,
            DEFAULT_PLATEAU_CANDIDATE_SMOOTHING_PASSES
        );
        smoothedValues.forEach((value, index) => {
            const x = index % width;
            const y = Math.floor(index / width);
            const blendedValue = (
                (value * componentWeights.smoothedBlend)
                + (readUnitGridValue(rawValues, width, height, x, y) * componentWeights.rawBlend)
            );
            field.write(x, y, blendedValue);
        });

        return {
            modelId: 'reliefPlateauCandidateFieldV1',
            smoothingKernel: 'weighted5x5',
            smoothingPasses: DEFAULT_PLATEAU_CANDIDATE_SMOOTHING_PASSES,
            componentWeights,
            supportChannels: [
                'domainWarpedMacroElevationField',
                'macroElevationField',
                'baseContinentalMassField',
                'upliftField',
                'platePressureField',
                'plainLowlandSmoothingField',
                'lowRidgeRuggedness',
                'lowFractureRuggedness',
                'coarseSeedBias'
            ],
            suppressionChannels: [
                'subsidenceField',
                'fractureMaskField',
                'ridgeDirectionField',
                'oceanicMassSuppression'
            ],
            outputPolicy: 'continuous plateau/elevated-area candidate field only; no plateau records, climate logic, relief-region extraction, or final elevation semantics'
        };
    }

    function materializeSeaLevelAppliedElevationField(field, worldBounds, sourceInputs, seed) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const rawValues = new Array(width * height).fill(0);
        const componentWeights = {
            domainWarpedMacroElevation: 0.66,
            mountainAmplification: 0.16,
            plateauCandidate: 0.08,
            baseContinentalMass: 0.07,
            plainLowlandSupport: 0.03,
            basinDepressionSuppression: 0.2,
            coarseSeedBias: 0.03,
            smoothedBlend: 0.74,
            rawBlend: 0.26
        };

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const domainWarpedElevation = readSerializedScalarFieldValue(sourceInputs.domainWarpedMacroElevationField, x, y, 0);
                const mountainAmplification = readSerializedScalarFieldValue(sourceInputs.mountainAmplificationField, x, y, 0);
                const basinDepression = readSerializedScalarFieldValue(sourceInputs.basinDepressionField, x, y, 0);
                const plateauCandidate = readSerializedScalarFieldValue(sourceInputs.plateauCandidateField, x, y, 0);
                const baseContinentalMass = readSerializedScalarFieldValue(sourceInputs.baseContinentalMassField, x, y, 0);
                const plainLowland = readSerializedScalarFieldValue(sourceInputs.plainLowlandSmoothingField, x, y, 0);
                const coarseBias = readCoarseSeedBias(seed ^ 0x5bd1e995, x, y, worldBounds) - 0.5;
                const value = clampUnitInterval(
                    (domainWarpedElevation * componentWeights.domainWarpedMacroElevation)
                    + (mountainAmplification * componentWeights.mountainAmplification)
                    + (plateauCandidate * componentWeights.plateauCandidate)
                    + (baseContinentalMass * componentWeights.baseContinentalMass)
                    + (plainLowland * componentWeights.plainLowlandSupport)
                    - (basinDepression * componentWeights.basinDepressionSuppression)
                    + (coarseBias * componentWeights.coarseSeedBias),
                    0
                );
                rawValues[(y * width) + x] = value;
            }
        }

        const smoothedValues = smoothUnitGridValues(
            rawValues,
            width,
            height,
            DEFAULT_SEA_LEVEL_APPLIED_ELEVATION_SMOOTHING_PASSES
        );
        const blendedValues = smoothedValues.map((value, index) => clampUnitInterval(
            (value * componentWeights.smoothedBlend)
            + (readUnitGridValue(rawValues, width, height, index % width, Math.floor(index / width)) * componentWeights.rawBlend),
            0
        ));
        const percentileBias = 0.5 + ((hashUnit(seed ^ 0x27d4eb2d, width, height) - 0.5) * 0.12);
        const sortedValues = blendedValues.slice().sort((left, right) => left - right);
        const thresholdIndex = Math.max(0, Math.min(
            sortedValues.length - 1,
            Math.floor((sortedValues.length - 1) * percentileBias)
        ));
        const seaLevelThreshold = clampUnitInterval(sortedValues[thresholdIndex], 0.5);
        let landCellCount = 0;
        let waterCellCount = 0;

        blendedValues.forEach((value, index) => {
            const postSeaLevelValue = value <= seaLevelThreshold
                ? 0
                : clampUnitInterval(
                    (value - seaLevelThreshold) / Math.max(0.000001, 1 - seaLevelThreshold),
                    0
                );
            const x = index % width;
            const y = Math.floor(index / width);
            field.write(x, y, postSeaLevelValue);
            if (postSeaLevelValue > 0) {
                landCellCount += 1;
            } else {
                waterCellCount += 1;
            }
        });

        return {
            modelId: 'reliefSeaLevelAppliedElevationFieldV1',
            smoothingKernel: 'weighted5x5',
            smoothingPasses: DEFAULT_SEA_LEVEL_APPLIED_ELEVATION_SMOOTHING_PASSES,
            componentWeights,
            preThresholdStats: buildFieldStats(blendedValues),
            seaLevelThreshold: roundFieldValue(seaLevelThreshold),
            thresholdPercentile: roundFieldValue(percentileBias),
            landCellCount,
            waterCellCount,
            landRatio: roundFieldValue(landCellCount / Math.max(1, blendedValues.length)),
            waterRatio: roundFieldValue(waterCellCount / Math.max(1, blendedValues.length)),
            supportChannels: [
                'domainWarpedMacroElevationField',
                'mountainAmplificationField',
                'plateauCandidateField',
                'baseContinentalMassField',
                'plainLowlandSmoothingField',
                'coarseSeedBias'
            ],
            suppressionChannels: [
                'basinDepressionField'
            ],
            outputPolicy: 'continuous post-sea-level elevation tendency only; no sea fill, marine carving, coastline refinement, inland seas, or final terrain semantics'
        };
    }

    function materializeLandWaterMaskField(field, worldBounds, sourceInputs) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        let landCellCount = 0;
        let waterCellCount = 0;

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const seaLevelAppliedElevation = readSerializedScalarFieldValue(sourceInputs.seaLevelAppliedElevationField, x, y, 0);
                if (seaLevelAppliedElevation > 0) {
                    field.allow(x, y);
                    landCellCount += 1;
                } else {
                    field.block(x, y);
                    waterCellCount += 1;
                }
            }
        }

        return {
            modelId: 'reliefLandWaterMaskFieldV1',
            sourceThreshold: 0,
            landCellCount,
            waterCellCount,
            landRatio: roundFieldValue(landCellCount / Math.max(1, width * height)),
            waterRatio: roundFieldValue(waterCellCount / Math.max(1, width * height)),
            outputPolicy: 'primary land/water split only; no sea fill, coastline refinement, sea-region extraction, inland seas, or gameplay semantics'
        };
    }

    function materializeLandmassCleanupMaskField(field, worldBounds, sourceInputs, seed) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const totalCells = Math.max(1, width * height);
        const values = createSerializedBinaryMaskValues(
            sourceInputs.landWaterMaskField,
            worldBounds,
            DEFAULT_LANDMASS_CLEANUP_MASK_THRESHOLD
        );
        const minLandArtifactCells = Math.max(3, Math.round(totalCells * 0.0035));
        const minWaterPocketCells = Math.max(2, Math.round(totalCells * 0.002));
        let removedLandArtifacts = 0;
        let removedLandCells = 0;
        let filledWaterPockets = 0;
        let filledWaterCells = 0;
        let neighborFlips = 0;

        const landComponents = collectMaskComponents(values, width, height, 1);
        landComponents.forEach((component) => {
            if (component.touchesBorder || component.cellCount > minLandArtifactCells) {
                return;
            }

            const meanSupport = component.cells.reduce((total, cellIndex) => {
                const x = cellIndex % width;
                const y = Math.floor(cellIndex / width);
                const seaLevelAppliedElevation = readSerializedScalarFieldValue(sourceInputs.seaLevelAppliedElevationField, x, y, 0);
                const baseContinentalMass = readSerializedScalarFieldValue(sourceInputs.baseContinentalMassField, x, y, 0);
                const mountainAmplification = readSerializedScalarFieldValue(sourceInputs.mountainAmplificationField, x, y, 0);
                const basinDepression = readSerializedScalarFieldValue(sourceInputs.basinDepressionField, x, y, 0);

                return total + (
                    (seaLevelAppliedElevation * 0.45)
                    + (baseContinentalMass * 0.35)
                    + (mountainAmplification * 0.15)
                    - (basinDepression * 0.10)
                );
            }, 0) / Math.max(1, component.cellCount);

            if (meanSupport >= 0.48) {
                return;
            }

            component.cells.forEach((cellIndex) => {
                values[cellIndex] = 0;
            });
            removedLandArtifacts += 1;
            removedLandCells += component.cellCount;
        });

        const waterComponents = collectMaskComponents(values, width, height, 0);
        waterComponents.forEach((component) => {
            if (component.touchesBorder || component.cellCount > minWaterPocketCells) {
                return;
            }

            let boundaryEdges = 0;
            let boundaryLandEdges = 0;
            const meanSupport = component.cells.reduce((total, cellIndex) => {
                const x = cellIndex % width;
                const y = Math.floor(cellIndex / width);
                const seaLevelAppliedElevation = readSerializedScalarFieldValue(sourceInputs.seaLevelAppliedElevationField, x, y, 0);
                const baseContinentalMass = readSerializedScalarFieldValue(sourceInputs.baseContinentalMassField, x, y, 0);
                const mountainAmplification = readSerializedScalarFieldValue(sourceInputs.mountainAmplificationField, x, y, 0);
                const basinDepression = readSerializedScalarFieldValue(sourceInputs.basinDepressionField, x, y, 0);

                [
                    [x - 1, y],
                    [x + 1, y],
                    [x, y - 1],
                    [x, y + 1]
                ].forEach(([nextX, nextY]) => {
                    if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) {
                        return;
                    }

                    boundaryEdges += 1;
                    if (values[(nextY * width) + nextX] === 1) {
                        boundaryLandEdges += 1;
                    }
                });

                return total + (
                    (baseContinentalMass * 0.65)
                    + (mountainAmplification * 0.10)
                    + ((1 - basinDepression) * 0.15)
                    + (seaLevelAppliedElevation * 0.10)
                );
            }, 0) / Math.max(1, component.cellCount);
            const boundaryLandRatio = boundaryEdges > 0
                ? boundaryLandEdges / boundaryEdges
                : 0;

            if (meanSupport < 0.52 || boundaryLandRatio < 0.72) {
                return;
            }

            component.cells.forEach((cellIndex) => {
                values[cellIndex] = 1;
            });
            filledWaterPockets += 1;
            filledWaterCells += component.cellCount;
        });

        const majorityValues = values.slice();
        for (let y = 1; y < height - 1; y += 1) {
            for (let x = 1; x < width - 1; x += 1) {
                const index = (y * width) + x;
                const currentValue = values[index];
                const landNeighbors = countNeighborMatches(values, width, height, x, y, 1);
                const waterNeighbors = 8 - landNeighbors;
                const baseContinentalMass = readSerializedScalarFieldValue(sourceInputs.baseContinentalMassField, x, y, 0);
                const mountainAmplification = readSerializedScalarFieldValue(sourceInputs.mountainAmplificationField, x, y, 0);
                const basinDepression = readSerializedScalarFieldValue(sourceInputs.basinDepressionField, x, y, 0);
                const seaLevelAppliedElevation = readSerializedScalarFieldValue(sourceInputs.seaLevelAppliedElevationField, x, y, 0);

                if (currentValue === 1) {
                    const landSupport = (seaLevelAppliedElevation * 0.55) + (baseContinentalMass * 0.30) + (mountainAmplification * 0.15);
                    if (waterNeighbors >= 7 && landSupport < 0.46) {
                        majorityValues[index] = 0;
                        neighborFlips += 1;
                    }
                    continue;
                }

                const waterRetention = (basinDepression * 0.55) + ((1 - baseContinentalMass) * 0.25) + ((1 - seaLevelAppliedElevation) * 0.20);
                const landSupport = (baseContinentalMass * 0.70) + (mountainAmplification * 0.10) + ((1 - basinDepression) * 0.20);
                if (landNeighbors >= 7 && landSupport >= 0.58 && waterRetention < 0.42) {
                    majorityValues[index] = 1;
                    neighborFlips += 1;
                }
            }
        }

        let landCellCount = 0;
        let waterCellCount = 0;
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const index = (y * width) + x;
                if (majorityValues[index] >= DEFAULT_LANDMASS_CLEANUP_MASK_THRESHOLD) {
                    field.allow(x, y);
                    landCellCount += 1;
                } else {
                    field.block(x, y);
                    waterCellCount += 1;
                }
            }
        }

        return {
            modelId: 'reliefLandmassCleanupMaskFieldV1',
            sourceThreshold: DEFAULT_LANDMASS_CLEANUP_MASK_THRESHOLD,
            minLandArtifactCells,
            minWaterPocketCells,
            removedLandArtifacts,
            removedLandCells,
            filledWaterPockets,
            filledWaterCells,
            neighborFlips,
            landCellCount,
            waterCellCount,
            landRatio: roundFieldValue(landCellCount / totalCells),
            waterRatio: roundFieldValue(waterCellCount / totalCells),
            outputPolicy: 'cleaned primary land/water mask only; no sea fill, marine carving details, inland seas, whole-world shape scoring, history-facing analysis, or gameplay semantics',
            deterministicContext: {
                seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'landmassCleanup'),
                seedHookProvided: Number.isFinite(seed)
            }
        };
    }

    function normalizeInput(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        return {
            macroSeed: normalizeSeed(normalizedInput.macroSeed),
            macroSeedProfile: isPlainObject(normalizedInput.macroSeedProfile)
                ? cloneValue(normalizedInput.macroSeedProfile)
                : null,
            phase1Constraints: isPlainObject(normalizedInput.phase1Constraints)
                ? cloneValue(normalizedInput.phase1Constraints)
                : {},
            worldBounds: normalizeWorldBounds(normalizedInput.worldBounds),
            dependencyAvailability: describeFieldDependencyAvailability(normalizedInput),
            debugOptions: isPlainObject(normalizedInput.debugOptions)
                ? cloneValue(normalizedInput.debugOptions)
                : {}
        };
    }

    function createEmptyReliefElevationOutputs() {
        return {
            fields: {},
            intermediateOutputs: {},
            records: {},
            debugArtifacts: []
        };
    }

    function getReliefElevationInputContract() {
        return {
            contractId: 'reliefElevationInput',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            requiredKeys: INPUT_REQUIRED_KEYS.slice(),
            optionalKeys: INPUT_OPTIONAL_KEYS.slice(),
            fieldDependencies: cloneValue(FIELD_DEPENDENCIES),
            intermediateDependencies: cloneValue(INTERMEDIATE_DEPENDENCIES),
            description: 'Contract scaffold for ReliefElevationGenerator input. It consumes tectonic skeleton fields and intermediates for coarse relief/elevation preparation.'
        };
    }

    function getReliefElevationOutputContract() {
        return {
            contractId: 'reliefElevationOutput',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            status: PARTIAL_STATUS,
            plannedOutputs: cloneValue(PLANNED_OUTPUTS),
            implementedOutputs: {
                fields: [
                    'baseContinentalMassField',
                    'macroElevationField',
                    'domainWarpedMacroElevationField',
                    'mountainAmplificationField',
                    'basinDepressionField',
                    'plateauCandidateField',
                    'seaLevelAppliedElevationField',
                    'landWaterMaskField',
                    'landmassCleanupMaskField'
                ],
                intermediateOutputs: [
                    'landmassShapeInterestScores',
                    'continentBodies',
                    'reliefRegionExtraction'
                ],
                records: [
                    'reliefRegions'
                ],
                debugArtifacts: [
                    'reliefElevationFieldSnapshots'
                ]
            },
            intentionallyAbsent: [
                'finalElevation',
                'seaFill',
                'marineFloodFill',
                'finalCoastlines',
                'continents',
                'continentSummaries',
                'lakeFormation',
                'marshFormation',
                'riverSystems',
                'inlandSeas',
                'seaRegions',
                'mountainRecords',
                'plateauRecords',
                'terrainCells',
                'validationReport',
                'strategicRegions',
                'historyFacingAnalysis',
                'gameplaySemantics'
            ],
            description: 'Partial pipeline contract for relief/elevation outputs. baseContinentalMassField, macroElevationField, domainWarpedMacroElevationField, mountainAmplificationField, basinDepressionField, plateauCandidateField, seaLevelAppliedElevationField, landWaterMaskField, landmassCleanupMaskField, landmassShapeInterestScores, continentBodies, reliefRegions, and reliefElevationFieldSnapshots are implemented as coarse physical fields plus local analysis/record/debug outputs; final elevation, sea fill, coastline refinement, sea-region extraction, whole-world validation, strategic synthesis, final continents[] export, lake/marsh hydrology, and climate linkage remain absent.'
        };
    }

    function getReliefElevationFieldSnapshotsContract() {
        return {
            contractId: 'reliefElevationFieldSnapshots',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            artifactKind: 'fieldSnapshot',
            registryId: 'fieldDebugRegistry',
            snapshotType: 'scalarHeatmap',
            builder: 'buildReliefElevationFieldSnapshots',
            valueEncoding: 'rowMajorFloatArray',
            sourceLayerIds: [
                'baseContinentalMassField',
                'macroElevationField',
                'domainWarpedMacroElevationField',
                'mountainAmplificationField',
                'basinDepressionField',
                'plateauCandidateField',
                'seaLevelAppliedElevationField',
                'landWaterMaskField',
                'landmassCleanupMaskField',
                'reliefRegions'
            ],
            artifactIds: [
                'relief.baseContinentalMassField.scalarHeatmap',
                'relief.macroElevationField.scalarHeatmap',
                'relief.domainWarpedMacroElevationField.scalarHeatmap',
                'relief.mountainAmplificationField.scalarHeatmap',
                'relief.basinDepressionField.scalarHeatmap',
                'relief.plateauCandidateField.scalarHeatmap',
                'relief.seaLevelAppliedElevationField.scalarHeatmap',
                'relief.landWaterMaskField.scalarHeatmap',
                'relief.landmassCleanupMaskField.scalarHeatmap',
                'relief.reliefRegionTypeMaskField.scalarHeatmap'
            ],
            reliefRegionTypeMaskEncoding: cloneValue(RELIEF_REGION_TYPE_MASK_ENCODING),
            intentionallyAbsent: [
                'fullPhysicalWorldDebugBundle',
                'debugPanel',
                'visualRenderer',
                'seaRegionSnapshots',
                'routeGraphSnapshots',
                'validationScoring'
            ],
            description: 'UI-free field debug export set for ReliefElevationGenerator. It uses the shared fieldDebugRegistry to emit stable scalar heatmap snapshots for elevation, land/water, cleanup, and a debug-only relief-region type mask.'
        };
    }

    function getBaseContinentalMassFieldContract() {
        return {
            contractId: 'baseContinentalMassField',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'baseContinentalMass'),
            fieldType: 'ScalarField',
            range: DEFAULT_BASE_CONTINENTAL_MASS_FIELD_RANGE.slice(),
            valueEncoding: BASE_CONTINENTAL_MASS_VALUE_ENCODING,
            requiredKeys: [
                'fieldId',
                'stageId',
                'sourceFieldIds',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'stats',
                'compositionModel',
                'compatibility'
            ],
            sourceKeys: [
                'platePressureField',
                'upliftField',
                'subsidenceField',
                'fractureMaskField',
                'ridgeDirectionField',
                'plainLowlandSmoothingField'
            ],
            compatibilityKeys: [
                'futureLandmassSynthesisInput',
                'futureMarineCarvingInput',
                'futureContinentExtractionInput',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'finalCoastlines',
                'continents',
                'seaFill',
                'marineFloodFill',
                'finalElevation',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic coarse scalar field for continental mass tendency over the tectonic composite. It is not a final coastline map and does not extract continents.'
        };
    }

    function getMacroElevationFieldContract() {
        return {
            contractId: 'macroElevationField',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'macroElevationComposite'),
            fieldType: 'ScalarField',
            range: DEFAULT_MACRO_ELEVATION_FIELD_RANGE.slice(),
            valueEncoding: MACRO_ELEVATION_VALUE_ENCODING,
            requiredKeys: [
                'fieldId',
                'stageId',
                'sourceFieldIds',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'stats',
                'compositionModel',
                'compatibility'
            ],
            sourceKeys: [
                'baseContinentalMassField',
                'platePressureField',
                'upliftField',
                'subsidenceField',
                'fractureMaskField',
                'ridgeDirectionField',
                'plainLowlandSmoothingField'
            ],
            compatibilityKeys: [
                'futureMountainAmplificationInput',
                'futureBasinDepressionInput',
                'futurePlateauCandidateInput',
                'futureReliefRegionInput',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'finalElevation',
                'domainWarping',
                'seaLevel',
                'seaFill',
                'marineFloodFill',
                'finalCoastlines',
                'continents',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic large-scale normalized elevation composite from base continental mass and tectonic fields. It does not apply domain warping, sea level, coastline thresholding, or final terrain semantics.'
        };
    }

    function getDomainWarpedMacroElevationFieldContract() {
        return {
            contractId: 'domainWarpedMacroElevationField',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'domainWarping'),
            fieldType: 'ScalarField',
            range: DEFAULT_DOMAIN_WARPED_MACRO_ELEVATION_FIELD_RANGE.slice(),
            valueEncoding: DOMAIN_WARPED_MACRO_ELEVATION_VALUE_ENCODING,
            requiredKeys: [
                'fieldId',
                'stageId',
                'sourceFieldIds',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'stats',
                'distortionModel',
                'compatibility'
            ],
            sourceKeys: [
                'macroElevationField',
                'baseContinentalMassField',
                'ridgeDirectionField',
                'platePressureField',
                'fractureMaskField',
                'upliftField',
                'subsidenceField',
                'plainLowlandSmoothingField'
            ],
            compatibilityKeys: [
                'futureMountainAmplificationInput',
                'futureBasinDepressionInput',
                'futurePlateauCandidateInput',
                'futureReliefRegionInput',
                'futureCleanupPassInput',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'cleanupPass',
                'reliefRegions',
                'finalElevation',
                'seaLevel',
                'seaFill',
                'marineFloodFill',
                'finalCoastlines',
                'continents',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic large-scale domain-warped macro elevation field. It distorts broad land and ridge forms without cleanup, sea level, relief-region extraction, or final terrain semantics.'
        };
    }

    function getMountainAmplificationFieldContract() {
        return {
            contractId: 'mountainAmplificationField',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'mountainAmplification'),
            fieldType: 'ScalarField',
            range: DEFAULT_MOUNTAIN_AMPLIFICATION_FIELD_RANGE.slice(),
            valueEncoding: MOUNTAIN_AMPLIFICATION_VALUE_ENCODING,
            requiredKeys: [
                'fieldId',
                'stageId',
                'sourceFieldIds',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'stats',
                'amplificationModel',
                'compatibility'
            ],
            sourceKeys: [
                'domainWarpedMacroElevationField',
                'macroElevationField',
                'ridgeDirectionField',
                'platePressureField',
                'upliftField',
                'subsidenceField',
                'fractureMaskField',
                'mountainBeltCandidates'
            ],
            compatibilityKeys: [
                'futureRainShadowInput',
                'futureReliefRegionInput',
                'futureMountainSystemLinkageInput',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'mountainRecords',
                'rainShadow',
                'climateLogic',
                'hydrology',
                'reliefRegions',
                'finalElevation',
                'seaLevel',
                'seaFill',
                'marineFloodFill',
                'finalCoastlines',
                'continents',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic scalar field for mountain elevation amplification tendency. It strengthens ridge and mountain-belt zones while only preparing compatibility for a later rain-shadow pass.'
        };
    }

    function getBasinDepressionFieldContract() {
        return {
            contractId: 'basinDepressionField',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'basinDepression'),
            fieldType: 'ScalarField',
            range: DEFAULT_BASIN_DEPRESSION_FIELD_RANGE.slice(),
            valueEncoding: BASIN_DEPRESSION_VALUE_ENCODING,
            requiredKeys: [
                'fieldId',
                'stageId',
                'sourceFieldIds',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'stats',
                'depressionModel',
                'compatibility'
            ],
            sourceKeys: [
                'domainWarpedMacroElevationField',
                'macroElevationField',
                'plainLowlandSmoothingField',
                'subsidenceField',
                'upliftField',
                'fractureMaskField',
                'platePressureField',
                'mountainAmplificationField',
                'basinSeeds'
            ],
            compatibilityKeys: [
                'futureLakeFormationInput',
                'futureMarshFormationInput',
                'futureWetlandRetentionInput',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'riverSystems',
                'lakeFormation',
                'marshFormation',
                'inlandSeas',
                'hydrology',
                'reliefRegions',
                'finalElevation',
                'seaLevel',
                'seaFill',
                'marineFloodFill',
                'finalCoastlines',
                'continents',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic scalar field for basin-floor depression tendency. It deepens basin-permissive regions inside relief/elevation logic while only preparing compatibility for later lake and marsh formation.'
        };
    }

    function getPlateauCandidateFieldContract() {
        return {
            contractId: 'plateauCandidateField',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'plateauCandidates'),
            fieldType: 'ScalarField',
            range: DEFAULT_PLATEAU_CANDIDATE_FIELD_RANGE.slice(),
            valueEncoding: PLATEAU_CANDIDATE_VALUE_ENCODING,
            requiredKeys: [
                'fieldId',
                'stageId',
                'sourceFieldIds',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'stats',
                'candidateModel',
                'compatibility'
            ],
            sourceKeys: [
                'domainWarpedMacroElevationField',
                'macroElevationField',
                'baseContinentalMassField',
                'platePressureField',
                'upliftField',
                'subsidenceField',
                'fractureMaskField',
                'ridgeDirectionField',
                'plainLowlandSmoothingField'
            ],
            compatibilityKeys: [
                'futureReliefClassificationInput',
                'futurePlateauReliefTypeInput',
                'futureReliefRegionInput',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'plateauRecords',
                'reliefRegions',
                'climateLogic',
                'finalElevation',
                'seaLevel',
                'seaFill',
                'marineFloodFill',
                'finalCoastlines',
                'continents',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic scalar candidate field for broad plateau/elevated areas. It prepares future relief classification input without extracting plateau records or applying climate logic.'
        };
    }

    function getSeaLevelAppliedElevationFieldContract() {
        return {
            contractId: 'seaLevelAppliedElevationField',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'seaLevelApplication'),
            fieldType: 'ScalarField',
            range: DEFAULT_SEA_LEVEL_APPLIED_ELEVATION_FIELD_RANGE.slice(),
            valueEncoding: SEA_LEVEL_APPLIED_ELEVATION_VALUE_ENCODING,
            requiredKeys: [
                'fieldId',
                'stageId',
                'sourceFieldIds',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'stats',
                'seaLevelModel',
                'compatibility'
            ],
            sourceKeys: [
                'domainWarpedMacroElevationField',
                'mountainAmplificationField',
                'basinDepressionField',
                'plateauCandidateField',
                'baseContinentalMassField',
                'plainLowlandSmoothingField'
            ],
            compatibilityKeys: [
                'futureSeaFillInput',
                'futureMarineFloodFillInput',
                'futureContinentExtractionInput',
                'futureLandWaterMaskInput',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'finalElevation',
                'seaFill',
                'marineFloodFill',
                'finalCoastlines',
                'seaRegions',
                'inlandSeas',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic scalar field for post-sea-level elevation tendency. It applies a primary sea-level threshold to the coarse relief composition without running sea fill, marine carving, coastline cleanup, or sea-region extraction.'
        };
    }

    function getLandWaterMaskFieldContract() {
        return {
            contractId: 'landWaterMaskField',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'landWaterSplit'),
            fieldType: 'MaskField',
            aliases: [
                'ConstraintField'
            ],
            range: DEFAULT_LAND_WATER_MASK_RANGE.slice(),
            valueEncoding: LAND_WATER_MASK_VALUE_ENCODING,
            requiredKeys: [
                'fieldId',
                'stageId',
                'sourceFieldIds',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'stats',
                'threshold',
                'semantics',
                'classificationModel',
                'compatibility'
            ],
            sourceKeys: [
                'seaLevelAppliedElevationField'
            ],
            compatibilityKeys: [
                'futureMarineCarvingInput',
                'futureContinentExtractionInput',
                'futureCoastlineRefinementInput',
                'futureSeaRegionClusteringInput',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'marineCarving',
                'seaRegions',
                'inlandSeas',
                'riverSystems',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic binary mask for the primary land/water split after sea-level application. It intentionally stops before marine carving, coastline refinement, and sea-region extraction.'
        };
    }

    function getLandmassCleanupMaskFieldContract() {
        return {
            contractId: 'landmassCleanupMaskField',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'landmassCleanup'),
            fieldType: 'MaskField',
            aliases: [
                'ConstraintField'
            ],
            range: DEFAULT_LANDMASS_CLEANUP_MASK_RANGE.slice(),
            valueEncoding: LANDMASS_CLEANUP_MASK_VALUE_ENCODING,
            requiredKeys: [
                'fieldId',
                'stageId',
                'sourceFieldIds',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'stats',
                'threshold',
                'semantics',
                'cleanupModel',
                'compatibility'
            ],
            sourceKeys: [
                'landWaterMaskField',
                'seaLevelAppliedElevationField',
                'baseContinentalMassField',
                'mountainAmplificationField',
                'basinDepressionField'
            ],
            compatibilityKeys: [
                'futureContinentExtractionInput',
                'futureMarineCarvingInput',
                'futureCoastlineRefinementInput',
                'futureSeaRegionClusteringInput',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'marineCarving',
                'finalCoastlines',
                'seaRegions',
                'continents',
                'shapeScoring',
                'historyFacingAnalysis',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic cleaned land/water mask that removes small noise artifacts while preserving large forms from the primary partition. It intentionally stops before marine carving, whole-world shape scoring, continent extraction, and history-facing analysis.'
        };
    }

    function getLandmassShapeInterestScoresContract() {
        return {
            contractId: 'landmassShapeInterestScores',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'landmassShapeInterest'),
            requiredKeys: [
                'scoringId',
                'stageId',
                'sourceFieldIds',
                'worldBounds',
                'minimumLandmassCellCount',
                'landmassCount',
                'scoredLandmassCount',
                'selectionModel',
                'scoreModel',
                'landmassScores',
                'summary',
                'compatibility'
            ],
            sourceKeys: [
                'landmassCleanupMaskField',
                'landWaterMaskField',
                'seaLevelAppliedElevationField',
                'baseContinentalMassField',
                'mountainAmplificationField',
                'basinDepressionField'
            ],
            landmassScoreKeys: [
                'landmassId',
                'cellCount',
                'normalizedArea',
                'coastlineEdgeCount',
                'coastalCellCount',
                'coastalCellRatio',
                'boundingBox',
                'compactness',
                'elongationRatio',
                'coastlineComplexity',
                'meanSeaLevelElevation',
                'meanMountainAmplification',
                'meanBasinDepression',
                'meanBaseContinentalMass',
                'reliefContrast',
                'shapeInterestScore',
                'scoreBreakdown',
                'validationHooks'
            ],
            compatibilityKeys: [
                'futureValidationInput',
                'futureRebalanceInput',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'wholeWorldValidation',
                'validationReport',
                'rebalanceActions',
                'strategicRegions',
                'historyFacingAnalysis',
                'gameplaySemantics'
            ],
            description: 'Deterministic intermediate scoring set for large cleaned landmasses. It measures local shape-interest only and prepares future validation/rebalance inputs without validating the whole world or synthesizing strategic regions.'
        };
    }

    function getContinentBodiesContract() {
        return {
            contractId: 'continentBodies',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'continentBodies'),
            requiredKeys: [
                'continentBodySetId',
                'stageId',
                'sourceFieldIds',
                'worldBounds',
                'minimumContinentCellCount',
                'continentBodyCount',
                'selectionModel',
                'synthesisModel',
                'summary',
                'continentBodies',
                'compatibility'
            ],
            sourceKeys: [
                'landmassCleanupMaskField',
                'landWaterMaskField',
                'seaLevelAppliedElevationField',
                'baseContinentalMassField',
                'mountainAmplificationField',
                'basinDepressionField',
                'plateauCandidateField',
                'plateSeedDistribution'
            ],
            continentBodyKeys: [
                'continentBodyId',
                'recordDraft',
                'pendingRecordFields',
                'cellCount',
                'cellIndices',
                'normalizedArea',
                'boundingBox',
                'centroidPoint',
                'normalizedCentroid',
                'touchesBorder',
                'coastlineEdgeCount',
                'coastalCellCount',
                'coastalCellRatio',
                'dominantPlateId',
                'plateIds',
                'plateComposition',
                'macroShape',
                'macroShapeSignals',
                'sourceSignals',
                'namespace',
                'seed'
            ],
            compatibilityKeys: [
                'futureContinentRecordInput',
                'requiresReliefRegionLinkage',
                'requiresClimateBandLinkage',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'continents',
                'continentSummaries',
                'historyFacingAnalysis',
                'strategicRegions',
                'seaRegions',
                'gameplaySemantics'
            ],
            description: 'Deterministic continent-body synthesis over cleaned major landmasses. It emits ContinentRecord-compatible drafts plus unresolved-linkage markers without exporting final continents[], continent summaries, or downstream history semantics.'
        };
    }

    function getReliefRegionExtractionContract() {
        return {
            contractId: 'reliefRegionExtraction',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'reliefRegions'),
            recordContract: 'ReliefRegionRecord',
            requiredKeys: [
                'reliefRegionSetId',
                'stageId',
                'sourceFieldIds',
                'worldBounds',
                'minimumReliefRegionCellCount',
                'classificationModel',
                'extractionModel',
                'summary',
                'reliefRegions',
                'reliefRegionBodies',
                'compatibility'
            ],
            sourceKeys: [
                'landmassCleanupMaskField',
                'landWaterMaskField',
                'seaLevelAppliedElevationField',
                'mountainAmplificationField',
                'basinDepressionField',
                'plateauCandidateField',
                'baseContinentalMassField',
                'fractureMaskField',
                'ridgeDirectionField',
                'plainLowlandSmoothingField',
                'continentBodies',
                'plateSeedDistribution'
            ],
            reliefTypes: RELIEF_REGION_TYPES.slice(),
            reliefRegionBodyKeys: [
                'reliefRegionId',
                'reliefType',
                'record',
                'pendingReferenceFields',
                'cellCount',
                'cellIndices',
                'normalizedArea',
                'boundingBox',
                'centroidPoint',
                'normalizedCentroid',
                'coastalCellCount',
                'coastlineEdgeCount',
                'coastalCellRatio',
                'plateIds',
                'primaryPlateId',
                'plateComposition',
                'continentIds',
                'continentOverlap',
                'sourceSignals',
                'namespace',
                'seed'
            ],
            compatibilityKeys: [
                'producesReliefRegionRecords',
                'futureContinentReliefLinkageInput',
                'futureMountainSystemReliefLinkageInput',
                'futureSeaRegionAdjacencyLinkageInput',
                'climateClassificationRequiredLater',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'climateClassification',
                'localBiomePlacement',
                'riverSystems',
                'seaRegions',
                'terrainCells',
                'historyFacingAnalysis',
                'gameplaySemantics'
            ],
            description: 'Deterministic extraction of large relief-region records from cleaned landmasses and relief fields. It classifies mountain, plateau, plain, basin, and coast regions into ReliefRegionRecord-compatible outputs without climate classification, biome placement, or terrain-cell semantics.'
        };
    }

    function getReliefElevationSeedHooks(masterSeed = 0) {
        const normalizedSeed = normalizeSeed(masterSeed);
        const rootNamespace = buildNamespace(PIPELINE_STEP_ID);
        return {
            root: {
                namespace: rootNamespace,
                seed: deriveSubSeed(normalizedSeed, rootNamespace)
            },
            stages: Object.fromEntries(PLANNED_STAGES.map((stage) => {
                const namespace = buildNamespace(PIPELINE_STEP_ID, stage.seedScope);
                return [
                    stage.stageId,
                    {
                        namespace,
                        seed: deriveSubSeed(normalizedSeed, namespace)
                    }
                ];
            }))
        };
    }

    function generateBaseContinentalMassField(input = {}) {
        const normalizedInput = normalizeInput(input);
        const sourceInputs = buildReliefSourceInputs(input);
        const worldBounds = sourceInputs.platePressureField && isPlainObject(sourceInputs.platePressureField.worldBounds)
            ? cloneValue(sourceInputs.platePressureField.worldBounds)
            : cloneValue(normalizedInput.worldBounds);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'baseContinentalMass');
        const seed = deriveSubSeed(normalizedInput.macroSeed, namespace);
        const field = createScalarFieldStorage('baseContinentalMassField', worldBounds, {
            range: DEFAULT_BASE_CONTINENTAL_MASS_FIELD_RANGE
        });
        const compositionModel = materializeBaseContinentalMassField(field, worldBounds, sourceInputs, seed);

        return serializeScalarField(field, {
            stageId: BASE_CONTINENTAL_MASS_STAGE_ID,
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'platePressureField.values',
                'upliftField.values',
                'subsidenceField.values',
                'fractureMaskField.values',
                'ridgeDirectionField.xValues',
                'ridgeDirectionField.yValues',
                'plainLowlandSmoothingField.values'
            ],
            namespace,
            seed,
            sourceFieldIds: buildBaseContinentalSourceFieldIds(sourceInputs),
            worldBounds,
            compositionModel,
            compatibility: buildBaseContinentalMassCompatibility(sourceInputs, worldBounds),
            intentionallyAbsent: [
                'finalCoastlines',
                'continents',
                'seaFill',
                'marineFloodFill',
                'finalElevation',
                'terrainCells',
                'gameplaySemantics'
            ]
        }, {
            range: DEFAULT_BASE_CONTINENTAL_MASS_FIELD_RANGE,
            valueEncoding: BASE_CONTINENTAL_MASS_VALUE_ENCODING
        });
    }

    function generateMacroElevationField(input = {}) {
        const normalizedInput = normalizeInput(input);
        const sourceInput = isPlainObject(input) ? input : {};
        const sourceInputs = buildReliefSourceInputs(sourceInput);
        const baseContinentalMassField = sourceInputs.baseContinentalMassField || generateBaseContinentalMassField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds
        });
        const resolvedSourceInputs = {
            ...sourceInputs,
            baseContinentalMassField
        };
        const worldBounds = baseContinentalMassField && isPlainObject(baseContinentalMassField.worldBounds)
            ? cloneValue(baseContinentalMassField.worldBounds)
            : sourceInputs.platePressureField && isPlainObject(sourceInputs.platePressureField.worldBounds)
                ? cloneValue(sourceInputs.platePressureField.worldBounds)
                : cloneValue(normalizedInput.worldBounds);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'macroElevationComposite');
        const seed = deriveSubSeed(normalizedInput.macroSeed, namespace);
        const field = createScalarFieldStorage('macroElevationField', worldBounds, {
            range: DEFAULT_MACRO_ELEVATION_FIELD_RANGE
        });
        const compositionModel = materializeMacroElevationField(field, worldBounds, resolvedSourceInputs, seed);

        return serializeScalarField(field, {
            stageId: MACRO_ELEVATION_STAGE_ID,
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'baseContinentalMassField.values',
                'platePressureField.values',
                'upliftField.values',
                'subsidenceField.values',
                'fractureMaskField.values',
                'ridgeDirectionField.xValues',
                'ridgeDirectionField.yValues',
                'plainLowlandSmoothingField.values'
            ],
            namespace,
            seed,
            sourceFieldIds: buildMacroElevationSourceFieldIds(resolvedSourceInputs),
            worldBounds,
            compositionModel,
            compatibility: buildMacroElevationCompatibility(resolvedSourceInputs, worldBounds),
            intentionallyAbsent: [
                'finalElevation',
                'domainWarping',
                'seaLevel',
                'seaFill',
                'marineFloodFill',
                'finalCoastlines',
                'continents',
                'terrainCells',
                'gameplaySemantics'
            ]
        }, {
            range: DEFAULT_MACRO_ELEVATION_FIELD_RANGE,
            valueEncoding: MACRO_ELEVATION_VALUE_ENCODING
        });
    }

    function generateDomainWarpedMacroElevationField(input = {}) {
        const normalizedInput = normalizeInput(input);
        const sourceInput = isPlainObject(input) ? input : {};
        const sourceInputs = buildReliefSourceInputs(sourceInput);
        const baseContinentalMassField = sourceInputs.baseContinentalMassField || generateBaseContinentalMassField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds
        });
        const macroElevationField = sourceInputs.macroElevationField || generateMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField
            }
        });
        const resolvedSourceInputs = {
            ...sourceInputs,
            baseContinentalMassField,
            macroElevationField
        };
        const worldBounds = macroElevationField && isPlainObject(macroElevationField.worldBounds)
            ? cloneValue(macroElevationField.worldBounds)
            : baseContinentalMassField && isPlainObject(baseContinentalMassField.worldBounds)
                ? cloneValue(baseContinentalMassField.worldBounds)
                : cloneValue(normalizedInput.worldBounds);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'domainWarping');
        const seed = deriveSubSeed(normalizedInput.macroSeed, namespace);
        const field = createScalarFieldStorage('domainWarpedMacroElevationField', worldBounds, {
            range: DEFAULT_DOMAIN_WARPED_MACRO_ELEVATION_FIELD_RANGE
        });
        const distortionModel = materializeDomainWarpedMacroElevationField(field, worldBounds, resolvedSourceInputs, seed);

        return serializeScalarField(field, {
            stageId: DOMAIN_WARPED_MACRO_ELEVATION_STAGE_ID,
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'macroElevationField.values',
                'baseContinentalMassField.values',
                'platePressureField.values',
                'upliftField.values',
                'subsidenceField.values',
                'fractureMaskField.values',
                'ridgeDirectionField.xValues',
                'ridgeDirectionField.yValues',
                'plainLowlandSmoothingField.values'
            ],
            namespace,
            seed,
            sourceFieldIds: buildDomainWarpedMacroElevationSourceFieldIds(resolvedSourceInputs),
            worldBounds,
            distortionModel,
            compatibility: buildDomainWarpedMacroElevationCompatibility(resolvedSourceInputs, worldBounds),
            intentionallyAbsent: [
                'cleanupPass',
                'reliefRegions',
                'finalElevation',
                'seaLevel',
                'seaFill',
                'marineFloodFill',
                'finalCoastlines',
                'continents',
                'terrainCells',
                'gameplaySemantics'
            ]
        }, {
            range: DEFAULT_DOMAIN_WARPED_MACRO_ELEVATION_FIELD_RANGE,
            valueEncoding: DOMAIN_WARPED_MACRO_ELEVATION_VALUE_ENCODING
        });
    }

    function generateMountainAmplificationField(input = {}) {
        const normalizedInput = normalizeInput(input);
        const sourceInput = isPlainObject(input) ? input : {};
        const sourceInputs = buildReliefSourceInputs(sourceInput);
        const baseContinentalMassField = sourceInputs.baseContinentalMassField || generateBaseContinentalMassField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds
        });
        const macroElevationField = sourceInputs.macroElevationField || generateMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField
            }
        });
        const domainWarpedMacroElevationField = sourceInputs.domainWarpedMacroElevationField || generateDomainWarpedMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField
            }
        });
        const mountainBeltCandidates = sourceInputs.mountainBeltCandidates
            || (typeof macro.generateMountainBeltCandidates === 'function'
                ? macro.generateMountainBeltCandidates({
                    ...sourceInput,
                    macroSeed: normalizedInput.macroSeed,
                    macroSeedProfile: normalizedInput.macroSeedProfile,
                    phase1Constraints: normalizedInput.phase1Constraints,
                    worldBounds: normalizedInput.worldBounds
                })
                : null);
        const resolvedSourceInputs = {
            ...sourceInputs,
            baseContinentalMassField,
            macroElevationField,
            domainWarpedMacroElevationField,
            mountainBeltCandidates
        };
        const worldBounds = domainWarpedMacroElevationField && isPlainObject(domainWarpedMacroElevationField.worldBounds)
            ? cloneValue(domainWarpedMacroElevationField.worldBounds)
            : macroElevationField && isPlainObject(macroElevationField.worldBounds)
                ? cloneValue(macroElevationField.worldBounds)
                : cloneValue(normalizedInput.worldBounds);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'mountainAmplification');
        const seed = deriveSubSeed(normalizedInput.macroSeed, namespace);
        const field = createScalarFieldStorage('mountainAmplificationField', worldBounds, {
            range: DEFAULT_MOUNTAIN_AMPLIFICATION_FIELD_RANGE
        });
        const amplificationModel = materializeMountainAmplificationField(field, worldBounds, resolvedSourceInputs, seed);

        return serializeScalarField(field, {
            stageId: MOUNTAIN_AMPLIFICATION_STAGE_ID,
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'domainWarpedMacroElevationField.values',
                'macroElevationField.values',
                'ridgeDirectionField.xValues',
                'ridgeDirectionField.yValues',
                'platePressureField.values',
                'upliftField.values',
                'subsidenceField.values',
                'fractureMaskField.values',
                'mountainBeltCandidates.mountainBeltCandidates'
            ],
            namespace,
            seed,
            sourceFieldIds: buildMountainAmplificationSourceFieldIds(resolvedSourceInputs),
            worldBounds,
            amplificationModel,
            compatibility: buildMountainAmplificationCompatibility(resolvedSourceInputs, worldBounds),
            intentionallyAbsent: [
                'mountainRecords',
                'rainShadow',
                'climateLogic',
                'hydrology',
                'reliefRegions',
                'finalElevation',
                'seaLevel',
                'seaFill',
                'marineFloodFill',
                'finalCoastlines',
                'continents',
                'terrainCells',
                'gameplaySemantics'
            ]
        }, {
            range: DEFAULT_MOUNTAIN_AMPLIFICATION_FIELD_RANGE,
            valueEncoding: MOUNTAIN_AMPLIFICATION_VALUE_ENCODING
        });
    }

    function generateBasinDepressionField(input = {}) {
        const normalizedInput = normalizeInput(input);
        const sourceInput = isPlainObject(input) ? input : {};
        const sourceInputs = buildReliefSourceInputs(sourceInput);
        const baseContinentalMassField = sourceInputs.baseContinentalMassField || generateBaseContinentalMassField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds
        });
        const macroElevationField = sourceInputs.macroElevationField || generateMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField
            }
        });
        const domainWarpedMacroElevationField = sourceInputs.domainWarpedMacroElevationField || generateDomainWarpedMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField
            }
        });
        const mountainAmplificationField = sourceInputs.mountainAmplificationField || generateMountainAmplificationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField
            }
        });
        const basinSeeds = sourceInputs.basinSeeds
            || (typeof macro.generateBasinSeeds === 'function'
                ? macro.generateBasinSeeds({
                    ...sourceInput,
                    macroSeed: normalizedInput.macroSeed,
                    macroSeedProfile: normalizedInput.macroSeedProfile,
                    phase1Constraints: normalizedInput.phase1Constraints,
                    worldBounds: normalizedInput.worldBounds
                })
                : null);
        const resolvedSourceInputs = {
            ...sourceInputs,
            baseContinentalMassField,
            macroElevationField,
            domainWarpedMacroElevationField,
            mountainAmplificationField,
            basinSeeds
        };
        const worldBounds = domainWarpedMacroElevationField && isPlainObject(domainWarpedMacroElevationField.worldBounds)
            ? cloneValue(domainWarpedMacroElevationField.worldBounds)
            : macroElevationField && isPlainObject(macroElevationField.worldBounds)
                ? cloneValue(macroElevationField.worldBounds)
                : cloneValue(normalizedInput.worldBounds);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'basinDepression');
        const seed = deriveSubSeed(normalizedInput.macroSeed, namespace);
        const field = createScalarFieldStorage('basinDepressionField', worldBounds, {
            range: DEFAULT_BASIN_DEPRESSION_FIELD_RANGE
        });
        const depressionModel = materializeBasinDepressionField(field, worldBounds, resolvedSourceInputs, seed);

        return serializeScalarField(field, {
            stageId: BASIN_DEPRESSION_STAGE_ID,
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'domainWarpedMacroElevationField.values',
                'macroElevationField.values',
                'plainLowlandSmoothingField.values',
                'subsidenceField.values',
                'upliftField.values',
                'fractureMaskField.values',
                'platePressureField.values',
                'mountainAmplificationField.values',
                'basinSeeds.basinSeeds'
            ],
            namespace,
            seed,
            sourceFieldIds: buildBasinDepressionSourceFieldIds(resolvedSourceInputs),
            worldBounds,
            depressionModel,
            compatibility: buildBasinDepressionCompatibility(resolvedSourceInputs, worldBounds),
            intentionallyAbsent: [
                'riverSystems',
                'lakeFormation',
                'marshFormation',
                'inlandSeas',
                'hydrology',
                'reliefRegions',
                'finalElevation',
                'seaLevel',
                'seaFill',
                'marineFloodFill',
                'finalCoastlines',
                'continents',
                'terrainCells',
                'gameplaySemantics'
            ]
        }, {
            range: DEFAULT_BASIN_DEPRESSION_FIELD_RANGE,
            valueEncoding: BASIN_DEPRESSION_VALUE_ENCODING
        });
    }

    function generatePlateauCandidateField(input = {}) {
        const normalizedInput = normalizeInput(input);
        const sourceInput = isPlainObject(input) ? input : {};
        const sourceInputs = buildReliefSourceInputs(sourceInput);
        const baseContinentalMassField = sourceInputs.baseContinentalMassField || generateBaseContinentalMassField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds
        });
        const macroElevationField = sourceInputs.macroElevationField || generateMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField
            }
        });
        const domainWarpedMacroElevationField = sourceInputs.domainWarpedMacroElevationField || generateDomainWarpedMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField
            }
        });
        const resolvedSourceInputs = {
            ...sourceInputs,
            baseContinentalMassField,
            macroElevationField,
            domainWarpedMacroElevationField
        };
        const worldBounds = domainWarpedMacroElevationField && isPlainObject(domainWarpedMacroElevationField.worldBounds)
            ? cloneValue(domainWarpedMacroElevationField.worldBounds)
            : macroElevationField && isPlainObject(macroElevationField.worldBounds)
                ? cloneValue(macroElevationField.worldBounds)
                : cloneValue(normalizedInput.worldBounds);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'plateauCandidates');
        const seed = deriveSubSeed(normalizedInput.macroSeed, namespace);
        const field = createScalarFieldStorage('plateauCandidateField', worldBounds, {
            range: DEFAULT_PLATEAU_CANDIDATE_FIELD_RANGE
        });
        const candidateModel = materializePlateauCandidateField(field, worldBounds, resolvedSourceInputs, seed);

        return serializeScalarField(field, {
            stageId: PLATEAU_CANDIDATE_STAGE_ID,
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'domainWarpedMacroElevationField.values',
                'macroElevationField.values',
                'baseContinentalMassField.values',
                'platePressureField.values',
                'upliftField.values',
                'subsidenceField.values',
                'fractureMaskField.values',
                'ridgeDirectionField.xValues',
                'ridgeDirectionField.yValues',
                'plainLowlandSmoothingField.values'
            ],
            namespace,
            seed,
            sourceFieldIds: buildPlateauCandidateSourceFieldIds(resolvedSourceInputs),
            worldBounds,
            candidateModel,
            compatibility: buildPlateauCandidateCompatibility(resolvedSourceInputs, worldBounds),
            intentionallyAbsent: [
                'plateauRecords',
                'reliefRegions',
                'climateLogic',
                'finalElevation',
                'seaLevel',
                'seaFill',
                'marineFloodFill',
                'finalCoastlines',
                'continents',
                'terrainCells',
                'gameplaySemantics'
            ]
        }, {
            range: DEFAULT_PLATEAU_CANDIDATE_FIELD_RANGE,
            valueEncoding: PLATEAU_CANDIDATE_VALUE_ENCODING
        });
    }

    function generateSeaLevelAppliedElevationField(input = {}) {
        const normalizedInput = normalizeInput(input);
        const sourceInput = isPlainObject(input) ? input : {};
        const sourceInputs = buildReliefSourceInputs(sourceInput);
        const baseContinentalMassField = sourceInputs.baseContinentalMassField || generateBaseContinentalMassField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds
        });
        const macroElevationField = sourceInputs.macroElevationField || generateMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField
            }
        });
        const domainWarpedMacroElevationField = sourceInputs.domainWarpedMacroElevationField || generateDomainWarpedMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField
            }
        });
        const mountainAmplificationField = sourceInputs.mountainAmplificationField || generateMountainAmplificationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField
            }
        });
        const basinDepressionField = sourceInputs.basinDepressionField || generateBasinDepressionField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField
            }
        });
        const plateauCandidateField = sourceInputs.plateauCandidateField || generatePlateauCandidateField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField
            }
        });
        const resolvedSourceInputs = {
            ...sourceInputs,
            baseContinentalMassField,
            macroElevationField,
            domainWarpedMacroElevationField,
            mountainAmplificationField,
            basinDepressionField,
            plateauCandidateField
        };
        const worldBounds = domainWarpedMacroElevationField && isPlainObject(domainWarpedMacroElevationField.worldBounds)
            ? cloneValue(domainWarpedMacroElevationField.worldBounds)
            : plateauCandidateField && isPlainObject(plateauCandidateField.worldBounds)
                ? cloneValue(plateauCandidateField.worldBounds)
                : cloneValue(normalizedInput.worldBounds);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'seaLevelApplication');
        const seed = deriveSubSeed(normalizedInput.macroSeed, namespace);
        const field = createScalarFieldStorage('seaLevelAppliedElevationField', worldBounds, {
            range: DEFAULT_SEA_LEVEL_APPLIED_ELEVATION_FIELD_RANGE
        });
        const seaLevelModel = materializeSeaLevelAppliedElevationField(field, worldBounds, resolvedSourceInputs, seed);

        return serializeScalarField(field, {
            stageId: SEA_LEVEL_APPLIED_ELEVATION_STAGE_ID,
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'domainWarpedMacroElevationField.values',
                'mountainAmplificationField.values',
                'basinDepressionField.values',
                'plateauCandidateField.values',
                'baseContinentalMassField.values',
                'plainLowlandSmoothingField.values'
            ],
            namespace,
            seed,
            sourceFieldIds: buildSeaLevelAppliedElevationSourceFieldIds(resolvedSourceInputs),
            worldBounds,
            seaLevelModel,
            compatibility: buildSeaLevelAppliedElevationCompatibility(resolvedSourceInputs, worldBounds),
            intentionallyAbsent: [
                'finalElevation',
                'seaFill',
                'marineFloodFill',
                'finalCoastlines',
                'seaRegions',
                'inlandSeas',
                'terrainCells',
                'gameplaySemantics'
            ]
        }, {
            range: DEFAULT_SEA_LEVEL_APPLIED_ELEVATION_FIELD_RANGE,
            valueEncoding: SEA_LEVEL_APPLIED_ELEVATION_VALUE_ENCODING
        });
    }

    function generateLandWaterMaskField(input = {}) {
        const normalizedInput = normalizeInput(input);
        const sourceInput = isPlainObject(input) ? input : {};
        const sourceInputs = buildReliefSourceInputs(sourceInput);
        const seaLevelAppliedElevationField = sourceInputs.seaLevelAppliedElevationField || generateSeaLevelAppliedElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds
        });
        const resolvedSourceInputs = {
            ...sourceInputs,
            seaLevelAppliedElevationField
        };
        const worldBounds = seaLevelAppliedElevationField && isPlainObject(seaLevelAppliedElevationField.worldBounds)
            ? cloneValue(seaLevelAppliedElevationField.worldBounds)
            : cloneValue(normalizedInput.worldBounds);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'landWaterSplit');
        const seed = deriveSubSeed(normalizedInput.macroSeed, namespace);
        const field = createMaskFieldStorage('landWaterMaskField', worldBounds, {
            range: DEFAULT_LAND_WATER_MASK_RANGE,
            defaultValue: 0,
            threshold: DEFAULT_LAND_WATER_MASK_THRESHOLD
        });
        const classificationModel = materializeLandWaterMaskField(field, worldBounds, resolvedSourceInputs);

        return serializeMaskField(field, {
            stageId: LAND_WATER_MASK_STAGE_ID,
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'seaLevelAppliedElevationField.values'
            ],
            namespace,
            seed,
            sourceFieldIds: buildLandWaterMaskSourceFieldIds(resolvedSourceInputs),
            worldBounds,
            classificationModel,
            compatibility: buildLandWaterMaskCompatibility(resolvedSourceInputs, worldBounds),
            intentionallyAbsent: [
                'marineCarving',
                'seaRegions',
                'inlandSeas',
                'riverSystems',
                'terrainCells',
                'gameplaySemantics'
            ]
        }, {
            range: DEFAULT_LAND_WATER_MASK_RANGE,
            valueEncoding: LAND_WATER_MASK_VALUE_ENCODING
        });
    }

    function generateLandmassCleanupMaskField(input = {}) {
        const normalizedInput = normalizeInput(input);
        const sourceInput = isPlainObject(input) ? input : {};
        const sourceInputs = buildReliefSourceInputs(sourceInput);
        const baseContinentalMassField = sourceInputs.baseContinentalMassField || generateBaseContinentalMassField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds
        });
        const macroElevationField = sourceInputs.macroElevationField || generateMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField
            }
        });
        const domainWarpedMacroElevationField = sourceInputs.domainWarpedMacroElevationField || generateDomainWarpedMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField
            }
        });
        const mountainAmplificationField = sourceInputs.mountainAmplificationField || generateMountainAmplificationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField
            }
        });
        const basinDepressionField = sourceInputs.basinDepressionField || generateBasinDepressionField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField
            }
        });
        const seaLevelAppliedElevationField = sourceInputs.seaLevelAppliedElevationField || generateSeaLevelAppliedElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField
            }
        });
        const landWaterMaskField = sourceInputs.landWaterMaskField || generateLandWaterMaskField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                seaLevelAppliedElevationField
            }
        });
        const resolvedSourceInputs = {
            ...sourceInputs,
            baseContinentalMassField,
            macroElevationField,
            domainWarpedMacroElevationField,
            mountainAmplificationField,
            basinDepressionField,
            seaLevelAppliedElevationField,
            landWaterMaskField
        };
        const worldBounds = landWaterMaskField && isPlainObject(landWaterMaskField.worldBounds)
            ? cloneValue(landWaterMaskField.worldBounds)
            : seaLevelAppliedElevationField && isPlainObject(seaLevelAppliedElevationField.worldBounds)
                ? cloneValue(seaLevelAppliedElevationField.worldBounds)
                : cloneValue(normalizedInput.worldBounds);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'landmassCleanup');
        const seed = deriveSubSeed(normalizedInput.macroSeed, namespace);
        const field = createMaskFieldStorage('landmassCleanupMaskField', worldBounds, {
            range: DEFAULT_LANDMASS_CLEANUP_MASK_RANGE,
            defaultValue: 0,
            threshold: DEFAULT_LANDMASS_CLEANUP_MASK_THRESHOLD
        });
        const cleanupModel = materializeLandmassCleanupMaskField(field, worldBounds, resolvedSourceInputs, seed);

        return serializeMaskField(field, {
            stageId: LANDMASS_CLEANUP_MASK_STAGE_ID,
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'landWaterMaskField.values',
                'seaLevelAppliedElevationField.values',
                'baseContinentalMassField.values',
                'mountainAmplificationField.values',
                'basinDepressionField.values'
            ],
            namespace,
            seed,
            sourceFieldIds: buildLandmassCleanupMaskSourceFieldIds(resolvedSourceInputs),
            worldBounds,
            cleanupModel,
            compatibility: buildLandmassCleanupMaskCompatibility(resolvedSourceInputs, worldBounds),
            intentionallyAbsent: [
                'marineCarving',
                'finalCoastlines',
                'seaRegions',
                'continents',
                'shapeScoring',
                'historyFacingAnalysis',
                'terrainCells',
                'gameplaySemantics'
            ]
        }, {
            range: DEFAULT_LANDMASS_CLEANUP_MASK_RANGE,
            valueEncoding: LANDMASS_CLEANUP_MASK_VALUE_ENCODING
        });
    }

    function generateLandmassShapeInterestScores(input = {}) {
        const normalizedInput = normalizeInput(input);
        const sourceInput = isPlainObject(input) ? input : {};
        const sourceInputs = buildReliefSourceInputs(sourceInput);
        const baseContinentalMassField = sourceInputs.baseContinentalMassField || generateBaseContinentalMassField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds
        });
        const macroElevationField = sourceInputs.macroElevationField || generateMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField
            }
        });
        const domainWarpedMacroElevationField = sourceInputs.domainWarpedMacroElevationField || generateDomainWarpedMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField
            }
        });
        const mountainAmplificationField = sourceInputs.mountainAmplificationField || generateMountainAmplificationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField
            }
        });
        const basinDepressionField = sourceInputs.basinDepressionField || generateBasinDepressionField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField
            }
        });
        const seaLevelAppliedElevationField = sourceInputs.seaLevelAppliedElevationField || generateSeaLevelAppliedElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField
            }
        });
        const landWaterMaskField = sourceInputs.landWaterMaskField || generateLandWaterMaskField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                seaLevelAppliedElevationField
            }
        });
        const landmassCleanupMaskField = sourceInputs.landmassCleanupMaskField || generateLandmassCleanupMaskField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                seaLevelAppliedElevationField,
                landWaterMaskField
            }
        });
        const resolvedSourceInputs = {
            ...sourceInputs,
            baseContinentalMassField,
            macroElevationField,
            domainWarpedMacroElevationField,
            mountainAmplificationField,
            basinDepressionField,
            seaLevelAppliedElevationField,
            landWaterMaskField,
            landmassCleanupMaskField
        };
        const worldBounds = landmassCleanupMaskField && isPlainObject(landmassCleanupMaskField.worldBounds)
            ? cloneValue(landmassCleanupMaskField.worldBounds)
            : cloneValue(normalizedInput.worldBounds);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'landmassShapeInterest');
        const seed = deriveSubSeed(normalizedInput.macroSeed, namespace);

        return {
            ...buildLandmassShapeInterestScores(resolvedSourceInputs, worldBounds, seed),
            deterministicBy: [
                'macroSeed',
                'landmassCleanupMaskField.values',
                'landWaterMaskField.values',
                'seaLevelAppliedElevationField.values',
                'baseContinentalMassField.values',
                'mountainAmplificationField.values',
                'basinDepressionField.values'
            ]
        };
    }

    function generateContinentBodies(input = {}) {
        const normalizedInput = normalizeInput(input);
        const sourceInput = isPlainObject(input) ? input : {};
        const sourceInputs = buildReliefSourceInputs(sourceInput);
        const baseContinentalMassField = sourceInputs.baseContinentalMassField || generateBaseContinentalMassField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds
        });
        const macroElevationField = sourceInputs.macroElevationField || generateMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField
            }
        });
        const domainWarpedMacroElevationField = sourceInputs.domainWarpedMacroElevationField || generateDomainWarpedMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField
            }
        });
        const mountainAmplificationField = sourceInputs.mountainAmplificationField || generateMountainAmplificationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField
            }
        });
        const basinDepressionField = sourceInputs.basinDepressionField || generateBasinDepressionField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField
            }
        });
        const plateauCandidateField = sourceInputs.plateauCandidateField || generatePlateauCandidateField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField
            }
        });
        const seaLevelAppliedElevationField = sourceInputs.seaLevelAppliedElevationField || generateSeaLevelAppliedElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                plateauCandidateField
            }
        });
        const landWaterMaskField = sourceInputs.landWaterMaskField || generateLandWaterMaskField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                plateauCandidateField,
                seaLevelAppliedElevationField
            }
        });
        const landmassCleanupMaskField = sourceInputs.landmassCleanupMaskField || generateLandmassCleanupMaskField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                plateauCandidateField,
                seaLevelAppliedElevationField,
                landWaterMaskField
            }
        });
        const plateSeedDistribution = sourceInputs.plateSeedDistribution || (
            typeof macro.generatePlateSeedDistribution === 'function'
                ? macro.generatePlateSeedDistribution({
                    ...sourceInput,
                    macroSeed: normalizedInput.macroSeed,
                    macroSeedProfile: normalizedInput.macroSeedProfile,
                    phase1Constraints: normalizedInput.phase1Constraints,
                    worldBounds: normalizedInput.worldBounds
                })
                : null
        );
        const resolvedSourceInputs = {
            ...sourceInputs,
            baseContinentalMassField,
            macroElevationField,
            domainWarpedMacroElevationField,
            mountainAmplificationField,
            basinDepressionField,
            plateauCandidateField,
            seaLevelAppliedElevationField,
            landWaterMaskField,
            landmassCleanupMaskField,
            plateSeedDistribution
        };
        const worldBounds = landmassCleanupMaskField && isPlainObject(landmassCleanupMaskField.worldBounds)
            ? cloneValue(landmassCleanupMaskField.worldBounds)
            : cloneValue(normalizedInput.worldBounds);

        return {
            ...buildContinentBodies(resolvedSourceInputs, worldBounds, normalizedInput.macroSeed),
            deterministicBy: [
                'macroSeed',
                'landmassCleanupMaskField.values',
                'landWaterMaskField.values',
                'seaLevelAppliedElevationField.values',
                'baseContinentalMassField.values',
                'mountainAmplificationField.values',
                'basinDepressionField.values',
                'plateauCandidateField.values',
                'plateSeedDistribution.plateSeeds'
            ]
        };
    }

    function generateReliefRegions(input = {}) {
        const normalizedInput = normalizeInput(input);
        const sourceInput = isPlainObject(input) ? input : {};
        const sourceInputs = buildReliefSourceInputs(sourceInput);
        const baseContinentalMassField = sourceInputs.baseContinentalMassField || generateBaseContinentalMassField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds
        });
        const macroElevationField = sourceInputs.macroElevationField || generateMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField
            }
        });
        const domainWarpedMacroElevationField = sourceInputs.domainWarpedMacroElevationField || generateDomainWarpedMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField
            }
        });
        const mountainAmplificationField = sourceInputs.mountainAmplificationField || generateMountainAmplificationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField
            }
        });
        const basinDepressionField = sourceInputs.basinDepressionField || generateBasinDepressionField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField
            }
        });
        const plateauCandidateField = sourceInputs.plateauCandidateField || generatePlateauCandidateField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField
            }
        });
        const seaLevelAppliedElevationField = sourceInputs.seaLevelAppliedElevationField || generateSeaLevelAppliedElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                plateauCandidateField
            }
        });
        const landWaterMaskField = sourceInputs.landWaterMaskField || generateLandWaterMaskField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                plateauCandidateField,
                seaLevelAppliedElevationField
            }
        });
        const landmassCleanupMaskField = sourceInputs.landmassCleanupMaskField || generateLandmassCleanupMaskField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                plateauCandidateField,
                seaLevelAppliedElevationField,
                landWaterMaskField
            }
        });
        const plateSeedDistribution = sourceInputs.plateSeedDistribution || (
            typeof macro.generatePlateSeedDistribution === 'function'
                ? macro.generatePlateSeedDistribution({
                    ...sourceInput,
                    macroSeed: normalizedInput.macroSeed,
                    macroSeedProfile: normalizedInput.macroSeedProfile,
                    phase1Constraints: normalizedInput.phase1Constraints,
                    worldBounds: normalizedInput.worldBounds
                })
                : null
        );
        const continentBodies = sourceInputs.continentBodies || generateContinentBodies({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                plateauCandidateField,
                seaLevelAppliedElevationField,
                landWaterMaskField,
                landmassCleanupMaskField
            },
            intermediateOutputs: {
                ...(isPlainObject(sourceInput.intermediateOutputs) ? sourceInput.intermediateOutputs : {}),
                plateSeedDistribution
            }
        });
        const resolvedSourceInputs = {
            ...sourceInputs,
            baseContinentalMassField,
            macroElevationField,
            domainWarpedMacroElevationField,
            mountainAmplificationField,
            basinDepressionField,
            plateauCandidateField,
            seaLevelAppliedElevationField,
            landWaterMaskField,
            landmassCleanupMaskField,
            plateSeedDistribution,
            continentBodies
        };
        const worldBounds = landmassCleanupMaskField && isPlainObject(landmassCleanupMaskField.worldBounds)
            ? cloneValue(landmassCleanupMaskField.worldBounds)
            : cloneValue(normalizedInput.worldBounds);

        return {
            ...buildReliefRegions(resolvedSourceInputs, worldBounds, normalizedInput.macroSeed),
            deterministicBy: [
                'macroSeed',
                'landmassCleanupMaskField.values',
                'landWaterMaskField.values',
                'seaLevelAppliedElevationField.values',
                'mountainAmplificationField.values',
                'basinDepressionField.values',
                'plateauCandidateField.values',
                'baseContinentalMassField.values',
                'continentBodies.continentBodies',
                'plateSeedDistribution.plateSeeds'
            ]
        };
    }

    function buildReliefElevationFieldSnapshots(input = {}) {
        const normalizedInput = normalizeInput(input);
        const sourceInput = isPlainObject(input) ? input : {};
        const sourceInputs = buildReliefSourceInputs(sourceInput);
        const baseContinentalMassField = sourceInputs.baseContinentalMassField || generateBaseContinentalMassField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds
        });
        const macroElevationField = sourceInputs.macroElevationField || generateMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField
            }
        });
        const domainWarpedMacroElevationField = sourceInputs.domainWarpedMacroElevationField || generateDomainWarpedMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField
            }
        });
        const mountainAmplificationField = sourceInputs.mountainAmplificationField || generateMountainAmplificationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField
            }
        });
        const basinDepressionField = sourceInputs.basinDepressionField || generateBasinDepressionField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField
            }
        });
        const plateauCandidateField = sourceInputs.plateauCandidateField || generatePlateauCandidateField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField
            }
        });
        const seaLevelAppliedElevationField = sourceInputs.seaLevelAppliedElevationField || generateSeaLevelAppliedElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                plateauCandidateField
            }
        });
        const landWaterMaskField = sourceInputs.landWaterMaskField || generateLandWaterMaskField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                plateauCandidateField,
                seaLevelAppliedElevationField
            }
        });
        const landmassCleanupMaskField = sourceInputs.landmassCleanupMaskField || generateLandmassCleanupMaskField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                plateauCandidateField,
                seaLevelAppliedElevationField,
                landWaterMaskField
            }
        });
        const plateSeedDistribution = sourceInputs.plateSeedDistribution || (
            typeof macro.generatePlateSeedDistribution === 'function'
                ? macro.generatePlateSeedDistribution({
                    ...sourceInput,
                    macroSeed: normalizedInput.macroSeed,
                    macroSeedProfile: normalizedInput.macroSeedProfile,
                    phase1Constraints: normalizedInput.phase1Constraints,
                    worldBounds: normalizedInput.worldBounds
                })
                : null
        );
        const continentBodies = sourceInputs.continentBodies || generateContinentBodies({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                plateauCandidateField,
                seaLevelAppliedElevationField,
                landWaterMaskField,
                landmassCleanupMaskField
            },
            intermediateOutputs: {
                ...(isPlainObject(sourceInput.intermediateOutputs) ? sourceInput.intermediateOutputs : {}),
                plateSeedDistribution
            }
        });
        const reliefRegionExtraction = sourceInputs.reliefRegionExtraction || generateReliefRegions({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...(isPlainObject(sourceInput.fields) ? sourceInput.fields : {}),
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                plateauCandidateField,
                seaLevelAppliedElevationField,
                landWaterMaskField,
                landmassCleanupMaskField
            },
            intermediateOutputs: {
                ...(isPlainObject(sourceInput.intermediateOutputs) ? sourceInput.intermediateOutputs : {}),
                plateSeedDistribution,
                continentBodies
            }
        });

        return buildReliefElevationFieldSnapshotsFromResolvedOutputs({
            worldBounds: normalizedInput.worldBounds,
            fields: {
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                plateauCandidateField,
                seaLevelAppliedElevationField,
                landWaterMaskField,
                landmassCleanupMaskField
            },
            reliefRegionExtraction
        });
    }

    function createReliefElevationPipeline(input = {}) {
        const normalizedInput = normalizeInput(input);
        const sourceInput = isPlainObject(input) ? input : {};
        const sourceFields = isPlainObject(sourceInput.fields) ? sourceInput.fields : {};
        const baseContinentalMassField = generateBaseContinentalMassField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds
        });
        const macroElevationField = generateMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...sourceFields,
                baseContinentalMassField
            }
        });
        const domainWarpedMacroElevationField = generateDomainWarpedMacroElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...sourceFields,
                baseContinentalMassField,
                macroElevationField
            }
        });
        const mountainAmplificationField = generateMountainAmplificationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...sourceFields,
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField
            }
        });
        const basinDepressionField = generateBasinDepressionField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...sourceFields,
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField
            }
        });
        const plateauCandidateField = generatePlateauCandidateField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...sourceFields,
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField
            }
        });
        const seaLevelAppliedElevationField = generateSeaLevelAppliedElevationField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...sourceFields,
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                plateauCandidateField
            }
        });
        const landWaterMaskField = generateLandWaterMaskField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...sourceFields,
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                plateauCandidateField,
                seaLevelAppliedElevationField
            }
        });
        const landmassCleanupMaskField = generateLandmassCleanupMaskField({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...sourceFields,
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                plateauCandidateField,
                seaLevelAppliedElevationField,
                landWaterMaskField
            }
        });
        const landmassShapeInterestScores = generateLandmassShapeInterestScores({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...sourceFields,
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                plateauCandidateField,
                seaLevelAppliedElevationField,
                landWaterMaskField,
                landmassCleanupMaskField
            }
        });
        const continentBodies = generateContinentBodies({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...sourceFields,
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                plateauCandidateField,
                seaLevelAppliedElevationField,
                landWaterMaskField,
                landmassCleanupMaskField
            },
            intermediateOutputs: {
                ...(isPlainObject(sourceInput.intermediateOutputs) ? sourceInput.intermediateOutputs : {}),
                plateSeedDistribution: resolveIntermediateFromInput(sourceInput, 'plateSeedDistribution'),
                basinSeeds: resolveIntermediateFromInput(sourceInput, 'basinSeeds'),
                mountainBeltCandidates: resolveIntermediateFromInput(sourceInput, 'mountainBeltCandidates')
            }
        });
        const reliefRegionExtraction = generateReliefRegions({
            ...sourceInput,
            macroSeed: normalizedInput.macroSeed,
            macroSeedProfile: normalizedInput.macroSeedProfile,
            phase1Constraints: normalizedInput.phase1Constraints,
            worldBounds: normalizedInput.worldBounds,
            fields: {
                ...sourceFields,
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                plateauCandidateField,
                seaLevelAppliedElevationField,
                landWaterMaskField,
                landmassCleanupMaskField
            },
            intermediateOutputs: {
                ...(isPlainObject(sourceInput.intermediateOutputs) ? sourceInput.intermediateOutputs : {}),
                plateSeedDistribution: resolveIntermediateFromInput(sourceInput, 'plateSeedDistribution'),
                continentBodies
            }
        });
        const reliefElevationFieldSnapshots = buildReliefElevationFieldSnapshotsFromResolvedOutputs({
            worldBounds: normalizedInput.worldBounds,
            fields: {
                baseContinentalMassField,
                macroElevationField,
                domainWarpedMacroElevationField,
                mountainAmplificationField,
                basinDepressionField,
                plateauCandidateField,
                seaLevelAppliedElevationField,
                landWaterMaskField,
                landmassCleanupMaskField
            },
            reliefRegionExtraction
        });
        const implementedStageIds = new Set([
            BASE_CONTINENTAL_MASS_STAGE_ID,
            MACRO_ELEVATION_STAGE_ID,
            DOMAIN_WARPED_MACRO_ELEVATION_STAGE_ID,
            MOUNTAIN_AMPLIFICATION_STAGE_ID,
            BASIN_DEPRESSION_STAGE_ID,
            PLATEAU_CANDIDATE_STAGE_ID,
            SEA_LEVEL_APPLIED_ELEVATION_STAGE_ID,
            LAND_WATER_MASK_STAGE_ID,
            LANDMASS_CLEANUP_MASK_STAGE_ID,
            LANDMASS_SHAPE_INTEREST_STAGE_ID,
            CONTINENT_BODIES_STAGE_ID,
            RELIEF_REGION_EXTRACTION_STAGE_ID,
            RELIEF_ELEVATION_FIELD_SNAPSHOTS_STAGE_ID
        ]);
        return {
            generatorId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            status: PARTIAL_STATUS,
            deterministicBy: [
                'macroSeed',
                'seedHooks'
            ],
            inputContract: getReliefElevationInputContract(),
            outputContract: getReliefElevationOutputContract(),
            baseContinentalMassFieldContract: getBaseContinentalMassFieldContract(),
            macroElevationFieldContract: getMacroElevationFieldContract(),
            domainWarpedMacroElevationFieldContract: getDomainWarpedMacroElevationFieldContract(),
            mountainAmplificationFieldContract: getMountainAmplificationFieldContract(),
            basinDepressionFieldContract: getBasinDepressionFieldContract(),
            plateauCandidateFieldContract: getPlateauCandidateFieldContract(),
            seaLevelAppliedElevationFieldContract: getSeaLevelAppliedElevationFieldContract(),
            landWaterMaskFieldContract: getLandWaterMaskFieldContract(),
            landmassCleanupMaskFieldContract: getLandmassCleanupMaskFieldContract(),
            landmassShapeInterestScoresContract: getLandmassShapeInterestScoresContract(),
            continentBodiesContract: getContinentBodiesContract(),
            reliefRegionExtractionContract: getReliefRegionExtractionContract(),
            reliefElevationFieldSnapshotsContract: getReliefElevationFieldSnapshotsContract(),
            input: normalizedInput,
            seedHooks: getReliefElevationSeedHooks(normalizedInput.macroSeed),
            plannedStages: PLANNED_STAGES.map((stage) => ({
                ...cloneValue(stage),
                status: implementedStageIds.has(stage.stageId)
                    ? IMPLEMENTED_STATUS
                    : TODO_STATUS
            })),
            outputs: {
                ...createEmptyReliefElevationOutputs(),
                fields: {
                    baseContinentalMassField,
                    macroElevationField,
                    domainWarpedMacroElevationField,
                    mountainAmplificationField,
                    basinDepressionField,
                    plateauCandidateField,
                    seaLevelAppliedElevationField,
                    landWaterMaskField,
                    landmassCleanupMaskField
                },
                intermediateOutputs: {
                    landmassShapeInterestScores,
                    continentBodies,
                    reliefRegionExtraction
                },
                records: {
                    reliefRegions: reliefRegionExtraction.reliefRegions
                },
                debugArtifacts: reliefElevationFieldSnapshots
            },
            notes: [
                'baseContinentalMassField is implemented as a deterministic coarse continuous continental mass tendency field.',
                'macroElevationField is implemented as a deterministic large-scale normalized elevation composite from base continental mass plus tectonic context.',
                'domainWarpedMacroElevationField is implemented as a deterministic large-scale distortion pass over macroElevationField.',
                'mountainAmplificationField is implemented as a deterministic mountain-zone amplification pass from ridge and mountain-belt candidate context.',
                'basinDepressionField is implemented as a deterministic basin-floor depression pass from basin seeds, lowland permission, and subsidence-aware relief context.',
                'plateauCandidateField is implemented as a deterministic broad elevated-area candidate field for later relief classification.',
                'seaLevelAppliedElevationField is implemented as a deterministic primary sea-level threshold over the coarse relief composition.',
                'landWaterMaskField is implemented as a deterministic primary land/water split from seaLevelAppliedElevationField.',
                'landmassCleanupMaskField is implemented as a deterministic artifact-cleanup pass over the primary land/water split while preserving large-scale forms.',
                'landmassShapeInterestScores are implemented as deterministic local scoring summaries for major cleaned landmasses and are reserved for future validation/rebalance consumers.',
                'continentBodies are implemented as deterministic connected-body drafts over cleaned landmasses and prepare ContinentRecord-compatible output without exporting final continents[] or continent summaries.',
                'reliefRegions are implemented as deterministic large connected ReliefRegionRecord-compatible records for mountains, plateaus, plains, basins, and coastal belts.',
                'reliefElevationFieldSnapshots are implemented as UI-free fieldSnapshot artifacts through fieldDebugRegistry for elevation, land/water, cleanup, and relief-region type-mask analysis.',
                'The cleanup, shape-interest, continent-body, and relief-region outputs remain separate from marine carving, final coastlines, climate classification, whole-world validation, strategic regions, final continents[] export, and history-facing analysis.',
                'TODO CONTRACTED: sea fill, marine flood fill, coastline refinement, lake formation, marsh formation, inland seas, mountain records, plateau records, rain shadow, climate classification, sea regions, terrain cells, world validation, strategic regions, and gameplay semantics remain unimplemented.'
            ]
        };
    }

    function generateReliefElevation(input = {}) {
        return createReliefElevationPipeline(input);
    }

    function getReliefElevationGeneratorDescriptor() {
        return {
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            status: PARTIAL_STATUS,
            entry: 'generateReliefElevation',
            pipelineFactory: 'createReliefElevationPipeline',
            inputContract: getReliefElevationInputContract(),
            outputContract: getReliefElevationOutputContract(),
            baseContinentalMassFieldContract: getBaseContinentalMassFieldContract(),
            macroElevationFieldContract: getMacroElevationFieldContract(),
            domainWarpedMacroElevationFieldContract: getDomainWarpedMacroElevationFieldContract(),
            mountainAmplificationFieldContract: getMountainAmplificationFieldContract(),
            basinDepressionFieldContract: getBasinDepressionFieldContract(),
            plateauCandidateFieldContract: getPlateauCandidateFieldContract(),
            seaLevelAppliedElevationFieldContract: getSeaLevelAppliedElevationFieldContract(),
            landWaterMaskFieldContract: getLandWaterMaskFieldContract(),
            landmassCleanupMaskFieldContract: getLandmassCleanupMaskFieldContract(),
            landmassShapeInterestScoresContract: getLandmassShapeInterestScoresContract(),
            continentBodiesContract: getContinentBodiesContract(),
            reliefRegionExtractionContract: getReliefRegionExtractionContract(),
            reliefElevationFieldSnapshotsContract: getReliefElevationFieldSnapshotsContract(),
            fieldDependencies: cloneValue(FIELD_DEPENDENCIES),
            intermediateDependencies: cloneValue(INTERMEDIATE_DEPENDENCIES),
            seedHooks: getReliefElevationSeedHooks(0),
            plannedStages: PLANNED_STAGES.map((stage) => cloneValue(stage)),
            description: 'Partial ReliefElevationGenerator scaffold with deterministic baseContinentalMassField, macroElevationField, domainWarpedMacroElevationField, mountainAmplificationField, basinDepressionField, plateauCandidateField, seaLevelAppliedElevationField, landWaterMaskField, landmassCleanupMaskField, landmassShapeInterestScores, continentBodies, reliefRegions, and reliefElevationFieldSnapshots implemented. Final elevation, coastline refinement, sea-region extraction, final continents[] export, rain shadow, climate classification, lake/marsh hydrology, sea fill, full debug bundle, world validation, strategic regions, and history-facing analysis remain TODO CONTRACTED.'
        };
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule(MODULE_ID, {
            entry: 'generateReliefElevation',
            file: 'js/worldgen/macro/relief-elevation-generator.js',
            description: 'Partial ReliefElevationGenerator scaffold with deterministic base continental mass, macro elevation, domain-warped macro elevation, mountain amplification, basin depression, plateau candidate, sea-level-applied elevation, land/water mask, landmass-cleanup mask, landmass shape-interest scoring, continent-body synthesis, relief-region extraction, and UI-free field debug snapshot outputs.',
            stub: true,
            partial: true
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep(PIPELINE_STEP_ID, {
            moduleId: MODULE_ID,
            file: 'js/worldgen/macro/relief-elevation-generator.js',
            entry: 'generateReliefElevation',
            description: 'Partial physical pipeline entry for relief/elevation composition with base continental mass, macro elevation, domain-warped macro elevation, mountain amplification, basin depression, plateau candidate, sea-level-applied elevation, land/water mask, landmass-cleanup mask, landmass shape-interest scoring, continent-body synthesis, relief-region extraction, and UI-free field debug snapshot outputs.',
            stub: true,
            partial: true
        });
    }

    Object.assign(macro, {
        getReliefElevationGeneratorDescriptor,
        getReliefElevationInputContract,
        getReliefElevationOutputContract,
        getBaseContinentalMassFieldContract,
        getMacroElevationFieldContract,
        getDomainWarpedMacroElevationFieldContract,
        getMountainAmplificationFieldContract,
        getBasinDepressionFieldContract,
        getPlateauCandidateFieldContract,
        getSeaLevelAppliedElevationFieldContract,
        getLandWaterMaskFieldContract,
        getLandmassCleanupMaskFieldContract,
        getLandmassShapeInterestScoresContract,
        getContinentBodiesContract,
        getReliefRegionExtractionContract,
        getReliefElevationFieldSnapshotsContract,
        getReliefElevationSeedHooks,
        generateBaseContinentalMassField,
        generateMacroElevationField,
        generateDomainWarpedMacroElevationField,
        generateMountainAmplificationField,
        generateBasinDepressionField,
        generatePlateauCandidateField,
        generateSeaLevelAppliedElevationField,
        generateLandWaterMaskField,
        generateLandmassCleanupMaskField,
        generateLandmassShapeInterestScores,
        generateContinentBodies,
        generateReliefRegions,
        buildReliefElevationFieldSnapshots,
        createReliefElevationPipeline,
        generateReliefElevation
    });
})();
