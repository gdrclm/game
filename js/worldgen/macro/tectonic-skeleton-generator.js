(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const MODULE_ID = 'tectonicSkeletonGenerator';
    const PIPELINE_STEP_ID = 'tectonicSkeleton';
    const TODO_STATUS = macro.todoContractedCode || 'TODO_CONTRACTED';
    const PARTIAL_STATUS = 'PARTIAL_IMPLEMENTED';
    const IMPLEMENTED_STATUS = 'implemented';
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';
    const DEFAULT_WORLD_BOUNDS = Object.freeze({
        width: 256,
        height: 128
    });
    const DEFAULT_PLATE_COUNT_MIN = 4;
    const DEFAULT_PLATE_COUNT_MAX = 12;
    const MAX_PLATE_COUNT = 64;
    const DEFAULT_JITTER_RATIO = 0.62;
    const DEFAULT_MARGIN_RATIO = 0.06;
    const NEUTRAL_PLATE_BIAS = 0.5;
    const TWO_PI = Math.PI * 2;
    const DEFAULT_PLATE_MOTION_MIN_MAGNITUDE = 0.15;
    const DEFAULT_PLATE_MOTION_MAX_MAGNITUDE = 1;
    const MOTION_VECTOR_PRECISION = 6;
    const DEFAULT_BOUNDARY_NEIGHBOR_MIN = 1;
    const DEFAULT_BOUNDARY_NEIGHBOR_MAX = 4;
    const MAX_RELATIVE_MOTION_MAGNITUDE = DEFAULT_PLATE_MOTION_MAX_MAGNITUDE * 2;
    const DEFAULT_TECTONIC_SCALAR_FIELD_RANGE = Object.freeze([0, 1]);
    const DEFAULT_UPLIFT_FIELD_RANGE = DEFAULT_TECTONIC_SCALAR_FIELD_RANGE;
    const DEFAULT_SUBSIDENCE_FIELD_RANGE = DEFAULT_TECTONIC_SCALAR_FIELD_RANGE;
    const DEFAULT_FRACTURE_FIELD_RANGE = DEFAULT_TECTONIC_SCALAR_FIELD_RANGE;
    const DEFAULT_PLATE_PRESSURE_FIELD_RANGE = DEFAULT_TECTONIC_SCALAR_FIELD_RANGE;
    const DEFAULT_PLAIN_LOWLAND_SMOOTHING_FIELD_RANGE = DEFAULT_TECTONIC_SCALAR_FIELD_RANGE;
    const RIDGE_DIRECTION_FIELD_VECTOR_ENCODING = 'rowMajorUnitVectorArrays';
    const DEFAULT_UPLIFT_INFLUENCE_RADIUS_RATIO = 0.08;
    const DEFAULT_SUBSIDENCE_INFLUENCE_RADIUS_RATIO = 0.1;
    const DEFAULT_FRACTURE_INFLUENCE_RADIUS_RATIO = 0.055;
    const DEFAULT_RIDGE_INFLUENCE_RADIUS_RATIO = 0.065;
    const DEFAULT_RIDGE_STRENGTH_THRESHOLD = 0.18;
    const DEFAULT_BASIN_SEED_MIN_STRENGTH = 0.22;
    const DEFAULT_BASIN_SEED_MIN_SPACING_RATIO = 0.09;
    const DEFAULT_BASIN_SEED_BASE_RADIUS_RATIO = 0.035;
    const DEFAULT_ARC_HELPER_MIN_STRENGTH = 0.24;
    const DEFAULT_ARC_HELPER_SAMPLE_COUNT = 5;
    const DEFAULT_ARC_APEX_OFFSET_RATIO = 0.18;
    const DEFAULT_HOTSPOT_SEED_MIN_STRENGTH = 0.28;
    const DEFAULT_HOTSPOT_TRAIL_SAMPLE_COUNT = 5;
    const DEFAULT_HOTSPOT_BASE_RADIUS_RATIO = 0.028;
    const DEFAULT_MOUNTAIN_BELT_MIN_STRENGTH = 0.28;
    const DEFAULT_MOUNTAIN_BELT_CLUSTER_DISTANCE_RATIO = 0.16;
    const DEFAULT_MOUNTAIN_BELT_MIN_CLUSTER_SIZE = 1;
    const DEFAULT_PLAIN_LOWLAND_SMOOTHING_PASSES = 2;
    const TECTONIC_SCALAR_FIELD_VALUE_ENCODING = 'rowMajorFloatArray';
    const UPLIFT_FIELD_VALUE_ENCODING = TECTONIC_SCALAR_FIELD_VALUE_ENCODING;
    const SUBSIDENCE_FIELD_VALUE_ENCODING = TECTONIC_SCALAR_FIELD_VALUE_ENCODING;
    const FRACTURE_FIELD_VALUE_ENCODING = TECTONIC_SCALAR_FIELD_VALUE_ENCODING;
    const PLATE_PRESSURE_FIELD_VALUE_ENCODING = TECTONIC_SCALAR_FIELD_VALUE_ENCODING;
    const PLAIN_LOWLAND_SMOOTHING_FIELD_VALUE_ENCODING = TECTONIC_SCALAR_FIELD_VALUE_ENCODING;
    const BOUNDARY_TYPES = Object.freeze([
        'collision',
        'divergence',
        'transform'
    ]);
    const PLATE_CLASSES = Object.freeze([
        'continental',
        'oceanic',
        'mixed'
    ]);
    const INPUT_REQUIRED_KEYS = Object.freeze([
        'macroSeed'
    ]);
    const INPUT_OPTIONAL_KEYS = Object.freeze([
        'macroSeedProfile',
        'phase1Constraints',
        'worldBounds',
        'plateSeedOptions',
        'debugOptions'
    ]);
    const OUTPUT_GROUPS = deepFreeze({
        fields: [
            'upliftField',
            'subsidenceField',
            'platePressureField',
            'fractureMaskField',
            'ridgeDirectionField',
            'plainLowlandSmoothingField',
            'basinTendencyField'
        ],
        intermediateOutputs: [
            'plateSeedDistribution',
            'plateMotionVectors',
            'plateBoundaryClassification',
            'basinSeeds',
            'arcFormationHelper',
            'hotspotVolcanicSeedHelper',
            'mountainBeltCandidates'
        ],
        records: [
            'plates',
            'reliefRegions',
            'mountainSystems',
            'volcanicZones'
        ],
        debugArtifacts: [
            'tectonicFieldSnapshots'
        ]
    });
    const PLANNED_STAGES = deepFreeze([
        {
            stageId: 'plateSeedDistribution',
            seedScope: 'plateSeedDistribution',
            plannedOutputs: ['plateSeedDistribution', 'plates']
        },
        {
            stageId: 'plateMotionVectors',
            seedScope: 'plateMotionVectors',
            plannedOutputs: ['plateMotionVectors']
        },
        {
            stageId: 'plateBoundaryClassification',
            seedScope: 'plateBoundaryClassification',
            plannedOutputs: ['plateBoundaryClassification']
        },
        {
            stageId: 'upliftField',
            seedScope: 'upliftField',
            plannedOutputs: ['upliftField']
        },
        {
            stageId: 'subsidenceField',
            seedScope: 'subsidenceField',
            plannedOutputs: ['subsidenceField']
        },
        {
            stageId: 'fractureField',
            seedScope: 'fractureField',
            plannedOutputs: ['fractureMaskField']
        },
        {
            stageId: 'ridgeLineSynthesis',
            seedScope: 'ridgeDirection',
            plannedOutputs: ['ridgeDirectionField']
        },
        {
            stageId: 'basinSeedPlacement',
            seedScope: 'basinSeeds',
            plannedOutputs: ['basinSeeds']
        },
        {
            stageId: 'arcFormationHelper',
            seedScope: 'arcFormation',
            plannedOutputs: ['arcFormationHelper']
        },
        {
            stageId: 'hotspotVolcanicSeedHelper',
            seedScope: 'hotspotVolcanicSeeds',
            plannedOutputs: ['hotspotVolcanicSeedHelper']
        },
        {
            stageId: 'platePressureCompositeField',
            seedScope: 'platePressureComposite',
            plannedOutputs: ['platePressureField']
        },
        {
            stageId: 'mountainBeltCandidates',
            seedScope: 'mountainBelts',
            plannedOutputs: ['mountainBeltCandidates']
        },
        {
            stageId: 'plainLowlandSmoothingPass',
            seedScope: 'plainLowlandSmoothing',
            plannedOutputs: ['plainLowlandSmoothingField']
        },
        {
            stageId: 'basinTendencyScaffold',
            seedScope: 'basinTendency',
            plannedOutputs: ['basinTendencyField', 'reliefRegions', 'volcanicZones']
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

    function clampInteger(value, min, max, fallback = min) {
        const normalizedValue = normalizeInteger(value, fallback);
        return Math.max(min, Math.min(max, normalizedValue));
    }

    function clampUnitInterval(value, fallback = 0) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return fallback;
        }

        return Math.max(0, Math.min(1, numericValue));
    }

    function normalizeString(value, fallback = '') {
        return typeof value === 'string' && value.trim()
            ? value.trim()
            : fallback;
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

    function createScopedRng(masterSeed, namespace) {
        const seed = deriveSubSeed(masterSeed, namespace);
        if (typeof macro.createMacroRng === 'function') {
            return macro.createMacroRng(seed, {
                scopeId: namespace
            });
        }

        let state = seed >>> 0;
        function nextFloat() {
            state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
            return state / 4294967296;
        }

        function nextInt(maxExclusive = 0) {
            const max = normalizeInteger(maxExclusive, 0);
            if (max <= 0) {
                return 0;
            }

            return Math.floor(nextFloat() * max);
        }

        return {
            nextFloat,
            nextInt,
            shuffle(list = []) {
                const shuffled = Array.isArray(list) ? list.slice() : [];
                for (let index = shuffled.length - 1; index > 0; index -= 1) {
                    const swapIndex = nextInt(index + 1);
                    const currentValue = shuffled[index];
                    shuffled[index] = shuffled[swapIndex];
                    shuffled[swapIndex] = currentValue;
                }
                return shuffled;
            }
        };
    }

    function normalizeWorldBounds(worldBounds = {}) {
        const normalizedBounds = isPlainObject(worldBounds) ? worldBounds : {};
        const width = normalizeInteger(normalizedBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(normalizedBounds.height, DEFAULT_WORLD_BOUNDS.height);

        return {
            width: width > 0 ? width : DEFAULT_WORLD_BOUNDS.width,
            height: height > 0 ? height : DEFAULT_WORLD_BOUNDS.height
        };
    }

    function deriveDefaultPlateCount(worldBounds) {
        const area = worldBounds.width * worldBounds.height;
        return clampInteger(
            Math.round(area / 4096),
            DEFAULT_PLATE_COUNT_MIN,
            DEFAULT_PLATE_COUNT_MAX,
            DEFAULT_PLATE_COUNT_MIN
        );
    }

    function normalizePlateSeedOptions(input = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const explicitOptions = isPlainObject(normalizedInput.plateSeedOptions)
            ? normalizedInput.plateSeedOptions
            : {};
        const plateCount = clampInteger(
            explicitOptions.plateCount ?? explicitOptions.count,
            1,
            MAX_PLATE_COUNT,
            deriveDefaultPlateCount(worldBounds)
        );

        return {
            plateCount,
            jitterRatio: clampUnitInterval(explicitOptions.jitterRatio, DEFAULT_JITTER_RATIO),
            marginRatio: clampUnitInterval(explicitOptions.marginRatio, DEFAULT_MARGIN_RATIO)
        };
    }

    function normalizeInput(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const macroSeed = normalizeSeed(
            normalizedInput.macroSeed ?? normalizedInput.seed ?? normalizedInput.worldSeed
        );

        return {
            macroSeed,
            macroSeedProfile: isPlainObject(normalizedInput.macroSeedProfile)
                ? cloneValue(normalizedInput.macroSeedProfile)
                : null,
            phase1Constraints: isPlainObject(normalizedInput.phase1Constraints)
                ? cloneValue(normalizedInput.phase1Constraints)
                : {},
            worldBounds: normalizeWorldBounds(normalizedInput.worldBounds),
            plateSeedOptions: normalizePlateSeedOptions(
                normalizedInput,
                normalizeWorldBounds(normalizedInput.worldBounds)
            ),
            debugOptions: isPlainObject(normalizedInput.debugOptions)
                ? cloneValue(normalizedInput.debugOptions)
                : {}
        };
    }

    function getTectonicSkeletonInputContract() {
        return {
            contractId: 'tectonicSkeletonInput',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            requiredKeys: INPUT_REQUIRED_KEYS.slice(),
            optionalKeys: INPUT_OPTIONAL_KEYS.slice(),
            description: 'Contract scaffold for TectonicSkeletonGenerator input. The only required deterministic driver is macroSeed.'
        };
    }

    function getTectonicSkeletonOutputContract() {
        return {
            contractId: 'tectonicSkeletonOutput',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            status: PARTIAL_STATUS,
            outputGroups: cloneValue(OUTPUT_GROUPS),
            description: 'Contract scaffold for tectonic outputs. Plate seed distribution, plate motion vectors, plate boundary classification, uplift field, subsidence field, fracture mask field, ridge direction field, basin seeds, arc formation helper, hotspot volcanic seed helper, plate pressure composite field, mountain-belt candidates, and plain/lowland smoothing field are implemented; downstream landmass synthesis, elevation composition, basin extraction, and relief construction remain TODO CONTRACTED.'
        };
    }

    function getPlateSeedDistributionContract() {
        return {
            contractId: 'plateSeedDistribution',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'plateSeedDistribution'),
            requiredKeys: [
                'distributionId',
                'stageId',
                'worldBounds',
                'plateCount',
                'plateSeeds'
            ],
            plateSeedKeys: [
                'plateId',
                'plateClass',
                'seedPoint',
                'normalizedPoint',
                'cell',
                'namespace',
                'seed'
            ],
            description: 'Deterministic plate seed distribution for future tectonic passes. This output alone does not model plate motion, uplift, or subsidence.'
        };
    }

    function getPlateMotionVectorsContract() {
        return {
            contractId: 'plateMotionVectors',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'plateMotionVectors'),
            requiredKeys: [
                'vectorSetId',
                'stageId',
                'sourceDistributionId',
                'worldBounds',
                'plateCount',
                'plateMotionVectors'
            ],
            plateMotionVectorKeys: [
                'plateId',
                'plateClass',
                'seedPoint',
                'angleRadians',
                'angleTurns',
                'magnitude',
                'unitVector',
                'motionVector',
                'namespace',
                'seed'
            ],
            boundaryAnalysisKeys: [
                'plateId',
                'seedPoint',
                'motionVector',
                'magnitude'
            ],
            description: 'Deterministic per-plate motion vectors for future boundary analysis. Does not classify plate boundaries or generate relief.'
        };
    }

    function getPlateBoundaryClassificationContract() {
        return {
            contractId: 'plateBoundaryClassification',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'plateBoundaryClassification'),
            requiredKeys: [
                'classificationId',
                'stageId',
                'sourceDistributionId',
                'sourceVectorSetId',
                'worldBounds',
                'plateCount',
                'boundaryCount',
                'boundaryClassifications'
            ],
            boundaryTypes: BOUNDARY_TYPES.slice(),
            boundaryClassificationKeys: [
                'boundaryId',
                'plateIds',
                'boundaryType',
                'distance',
                'normalizedDistance',
                'boundaryVector',
                'relativeMotion',
                'scores',
                'futureSignals'
            ],
            futureSignalKeys: [
                'upliftPotential',
                'subsidencePotential',
                'volcanicPotential',
                'volcanicSourceHint'
            ],
            description: 'Deterministic nearest-seed plate boundary classification for future uplift, subsidence, and volcanic passes. Does not build relief or climate effects.'
        };
    }

    function getUpliftFieldContract() {
        return {
            contractId: 'upliftField',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'upliftField'),
            fieldType: 'ScalarField',
            range: DEFAULT_UPLIFT_FIELD_RANGE.slice(),
            valueEncoding: UPLIFT_FIELD_VALUE_ENCODING,
            requiredKeys: [
                'fieldId',
                'stageId',
                'sourceClassificationId',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'stats'
            ],
            sourceKeys: [
                'plateSeedDistribution',
                'plateBoundaryClassification'
            ],
            intentionallyAbsent: [
                'elevationComposite',
                'reliefRegions',
                'climateEffects'
            ],
            description: 'Deterministic scalar uplift field derived from plate seed and boundary classification data. Does not generate a full elevation composite.'
        };
    }

    function getSubsidenceFieldContract() {
        return {
            contractId: 'subsidenceField',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'subsidenceField'),
            fieldType: 'ScalarField',
            range: DEFAULT_SUBSIDENCE_FIELD_RANGE.slice(),
            valueEncoding: SUBSIDENCE_FIELD_VALUE_ENCODING,
            requiredKeys: [
                'fieldId',
                'stageId',
                'sourceClassificationId',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'stats',
                'compatibility'
            ],
            sourceKeys: [
                'plateSeedDistribution',
                'plateBoundaryClassification'
            ],
            compatibilityKeys: [
                'upliftFieldId',
                'futureElevationCompositeOperation',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'marineFloodFill',
                'basinRegions',
                'elevationComposite',
                'reliefRegions',
                'climateEffects'
            ],
            description: 'Deterministic scalar subsidence field derived from plate boundary divergence signals. Compatible with uplift/elevation layers but does not flood marine areas or build basins.'
        };
    }

    function getFractureFieldContract() {
        return {
            contractId: 'fractureField',
            outputFieldId: 'fractureMaskField',
            aliases: [
                'fractureMaskField'
            ],
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'fractureField'),
            fieldType: 'ScalarField',
            range: DEFAULT_FRACTURE_FIELD_RANGE.slice(),
            valueEncoding: FRACTURE_FIELD_VALUE_ENCODING,
            requiredKeys: [
                'fieldId',
                'stageId',
                'sourceClassificationId',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'stats',
                'compatibility'
            ],
            sourceKeys: [
                'plateSeedDistribution',
                'plateBoundaryClassification',
                'upliftField',
                'subsidenceField'
            ],
            compatibilityKeys: [
                'upliftFieldId',
                'subsidenceFieldId',
                'futureRidgeInput',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'ridgeLines',
                'landmasses',
                'elevationComposite',
                'reliefRegions',
                'climateEffects'
            ],
            description: 'Deterministic scalar fracture mask field derived from plate boundary shear and stress signals. Compatible with uplift/subsidence fields but does not synthesize ridge lines or final landmasses.'
        };
    }

    function getRidgeDirectionFieldContract() {
        return {
            contractId: 'ridgeDirectionField',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'ridgeDirection'),
            fieldType: 'DirectionalField',
            vectorEncoding: RIDGE_DIRECTION_FIELD_VECTOR_ENCODING,
            requiredKeys: [
                'fieldId',
                'stageId',
                'sourceClassificationId',
                'worldBounds',
                'width',
                'height',
                'size',
                'vectorEncoding',
                'xValues',
                'yValues',
                'stats',
                'ridgeLines',
                'compatibility'
            ],
            sourceKeys: [
                'plateBoundaryClassification',
                'upliftField',
                'subsidenceField',
                'fractureMaskField'
            ],
            ridgeLineKeys: [
                'ridgeLineId',
                'boundaryId',
                'plateIds',
                'sourceBoundaryType',
                'startPoint',
                'endPoint',
                'normalizedStartPoint',
                'normalizedEndPoint',
                'orientationVector',
                'ridgeStrength',
                'ridgeLength',
                'influenceRadius',
                'mountainAmplificationBias',
                'namespace',
                'seed'
            ],
            compatibilityKeys: [
                'upliftFieldId',
                'subsidenceFieldId',
                'fractureFieldId',
                'futureMountainAmplificationInput',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'basinRegions',
                'elevationComposite',
                'mountainSystems',
                'climateEffects'
            ],
            description: 'Deterministic ridge direction field with ridge-line candidates derived from tectonic uplift and fracture context. Prepares mountain amplification data without building basin logic or final elevation.'
        };
    }

    function getBasinSeedsContract() {
        return {
            contractId: 'basinSeeds',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'basinSeeds'),
            requiredKeys: [
                'basinSeedSetId',
                'stageId',
                'sourceClassificationId',
                'worldBounds',
                'basinSeedCount',
                'selectionModel',
                'basinSeeds',
                'compatibility'
            ],
            sourceKeys: [
                'plateSeedDistribution',
                'plateBoundaryClassification',
                'upliftField',
                'subsidenceField',
                'fractureMaskField',
                'ridgeDirectionField'
            ],
            basinSeedKeys: [
                'basinSeedId',
                'sourceKind',
                'sourceBoundaryId',
                'sourcePlateIds',
                'seedPoint',
                'normalizedPoint',
                'seedArea',
                'basinSeedStrength',
                'basinRetentionBias',
                'basinTypeHint',
                'sourceSignals',
                'namespace',
                'seed'
            ],
            compatibilityKeys: [
                'futureBasinTendencyInput',
                'futureRiverBasinInput',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'continentBodies',
                'hydrologyRouting',
                'basinRegions',
                'climateEffects'
            ],
            description: 'Deterministic basin seed points/areas derived from tectonic subsidence context. Prepares future basin tendency and river-basin extraction without building continent bodies or hydrology routing.'
        };
    }

    function getArcFormationHelperContract() {
        return {
            contractId: 'arcFormationHelper',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'arcFormation'),
            requiredKeys: [
                'arcHelperId',
                'stageId',
                'sourceClassificationId',
                'worldBounds',
                'arcGuideCount',
                'guideSelectionModel',
                'arcGuides',
                'compatibility'
            ],
            sourceKeys: [
                'plateBoundaryClassification',
                'upliftField',
                'subsidenceField',
                'fractureMaskField',
                'ridgeDirectionField'
            ],
            arcGuideKeys: [
                'arcGuideId',
                'sourceBoundaryId',
                'sourcePlateIds',
                'sourceHint',
                'carrierPlateId',
                'carrierPlateClass',
                'startPoint',
                'endPoint',
                'midpoint',
                'apexPoint',
                'normalizedApexPoint',
                'controlPoints',
                'curveSamples',
                'guideArea',
                'tangentVector',
                'bowVector',
                'arcStrength',
                'arcCurvature',
                'curvedFormBias',
                'volcanicArcBias',
                'sourceSignals',
                'namespace',
                'seed'
            ],
            compatibilityKeys: [
                'futureVolcanicArcInput',
                'futureVolcanicZoneSourceType',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'tectonicComposite',
                'oceanCarving',
                'volcanicZones',
                'climateEffects'
            ],
            description: 'Deterministic helper for island arcs and curved tectonic forms. Prepares later volcanic-arc extraction without building a full tectonic composite or ocean carving.'
        };
    }

    function getHotspotVolcanicSeedHelperContract() {
        return {
            contractId: 'hotspotVolcanicSeedHelper',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'hotspotVolcanicSeeds'),
            requiredKeys: [
                'hotspotHelperId',
                'stageId',
                'sourceDistributionId',
                'sourceVectorSetId',
                'worldBounds',
                'hotspotSeedCount',
                'selectionModel',
                'hotspotSeeds',
                'compatibility'
            ],
            sourceKeys: [
                'plateSeedDistribution',
                'plateMotionVectors',
                'upliftField',
                'subsidenceField',
                'fractureMaskField',
                'ridgeDirectionField',
                'arcFormationHelper'
            ],
            hotspotSeedKeys: [
                'hotspotSeedId',
                'sourcePlateId',
                'sourcePlateClass',
                'sourceKind',
                'seedPoint',
                'normalizedPoint',
                'seedArea',
                'trailVector',
                'trailLength',
                'trailSamples',
                'hotspotStrength',
                'persistenceBias',
                'volcanicZoneBias',
                'arcAvoidanceBias',
                'sourceSignals',
                'namespace',
                'seed'
            ],
            compatibilityKeys: [
                'plateMotionVectorSetId',
                'arcFormationHelperId',
                'futureVolcanicZoneInput',
                'futureVolcanicZoneSourceType',
                'supportsTrailChains',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'volcanicZones',
                'geologicResources',
                'oceanCarving',
                'tectonicComposite'
            ],
            description: 'Deterministic helper for hotspot-like volcanic seeds and trail geometry. Prepares later volcanic-zone extraction without building actual volcanic zones or geology/resource logic.'
        };
    }

    function getPlatePressureFieldContract() {
        return {
            contractId: 'platePressureField',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'platePressureComposite'),
            fieldType: 'ScalarField',
            range: DEFAULT_PLATE_PRESSURE_FIELD_RANGE.slice(),
            valueEncoding: PLATE_PRESSURE_FIELD_VALUE_ENCODING,
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
                'upliftField',
                'subsidenceField',
                'fractureMaskField',
                'ridgeDirectionField',
                'basinSeeds',
                'arcFormationHelper'
            ],
            compatibilityKeys: [
                'upliftFieldId',
                'subsidenceFieldId',
                'fractureFieldId',
                'ridgeDirectionFieldId',
                'basinSeedSetId',
                'arcFormationHelperId',
                'futureLandTendencyInput',
                'futureMountainAmplificationInput',
                'futureReliefInput',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'landTendencyMap',
                'finalElevation',
                'marineFloodFill',
                'climateEffects'
            ],
            description: 'Deterministic composite scalar field combining uplift, subsidence, fracture, ridge, basin, and arc helper data. Prepares later tectonic interpretation layers without building land tendency maps or final elevation.'
        };
    }

    function getMountainBeltCandidatesContract() {
        return {
            contractId: 'mountainBeltCandidates',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'mountainBelts'),
            requiredKeys: [
                'candidateSetId',
                'stageId',
                'sourceFieldIds',
                'worldBounds',
                'mountainBeltCandidateCount',
                'selectionModel',
                'mountainBeltCandidates',
                'compatibility'
            ],
            sourceKeys: [
                'ridgeDirectionField',
                'upliftField',
                'subsidenceField',
                'fractureMaskField',
                'platePressureField',
                'arcFormationHelper'
            ],
            mountainBeltCandidateKeys: [
                'mountainBeltCandidateId',
                'recordDraft',
                'pendingRecordFields',
                'sourceRidgeLineIds',
                'sourceBoundaryIds',
                'sourceBoundaryTypes',
                'plateIds',
                'spineStartPoint',
                'spineEndPoint',
                'normalizedStartPoint',
                'normalizedEndPoint',
                'spineLength',
                'candidateArea',
                'candidateStrength',
                'mountainAmplificationBias',
                'pressureBias',
                'arcInfluenceBias',
                'sourceSignals',
                'namespace',
                'seed'
            ],
            compatibilityKeys: [
                'ridgeDirectionFieldId',
                'platePressureFieldId',
                'arcFormationHelperId',
                'futureMountainSystemRecordInput',
                'requiresReliefRegionLinkage',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'climateShadow',
                'reliefRegions',
                'finalElevation',
                'mountainSystemFinalization'
            ],
            description: 'Deterministic mountain-belt candidate set extracted from tectonic ridge and pressure layers. Prepares MountainSystemRecord-ready drafts without extracting relief regions, climate shadows, or final elevation.'
        };
    }

    function getPlainLowlandSmoothingFieldContract() {
        return {
            contractId: 'plainLowlandSmoothingField',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'plainLowlandSmoothing'),
            fieldType: 'ScalarField',
            range: DEFAULT_PLAIN_LOWLAND_SMOOTHING_FIELD_RANGE.slice(),
            valueEncoding: PLAIN_LOWLAND_SMOOTHING_FIELD_VALUE_ENCODING,
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
                'smoothingModel',
                'compatibility'
            ],
            sourceKeys: [
                'upliftField',
                'subsidenceField',
                'fractureMaskField',
                'ridgeDirectionField',
                'platePressureField',
                'basinSeeds',
                'mountainBeltCandidates'
            ],
            compatibilityKeys: [
                'upliftFieldId',
                'subsidenceFieldId',
                'fractureFieldId',
                'ridgeDirectionFieldId',
                'platePressureFieldId',
                'basinSeedSetId',
                'mountainBeltCandidateSetId',
                'futureBasinTendencyInput',
                'futurePlateauLogicCompatible',
                'futureReliefRegionInput',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'fertilityScoring',
                'gameplaySemantics',
                'basinDepression',
                'plateauExtraction',
                'reliefRegions'
            ],
            description: 'Deterministic scalar smoothing field for broad plain and lowland candidates. It is compatible with later basin/plateau logic but does not score fertility, create gameplay semantics, depress basins, extract plateaus, or finalize relief regions.'
        };
    }

    function getTectonicSkeletonSeedHooks(masterSeed = 0) {
        const normalizedSeed = normalizeSeed(masterSeed);
        const rootNamespace = buildNamespace(PIPELINE_STEP_ID);
        const stageHooks = PLANNED_STAGES.map((stage) => {
            const namespace = buildNamespace(PIPELINE_STEP_ID, stage.seedScope);
            return {
                stageId: stage.stageId,
                seedScope: stage.seedScope,
                namespace,
                seed: deriveSubSeed(normalizedSeed, namespace)
            };
        });

        return {
            masterSeed: normalizedSeed,
            root: {
                scopeId: PIPELINE_STEP_ID,
                namespace: rootNamespace,
                seed: deriveSubSeed(normalizedSeed, rootNamespace)
            },
            stages: stageHooks
        };
    }

    function createEmptyTectonicOutputs() {
        return {
            fields: {},
            intermediateOutputs: {},
            records: {},
            debugArtifacts: []
        };
    }

    function padPlateIndex(index) {
        return String(index + 1).padStart(2, '0');
    }

    function buildGridCells(plateCount, columns, rows) {
        const cells = [];
        for (let row = 0; row < rows; row += 1) {
            for (let column = 0; column < columns; column += 1) {
                cells.push({
                    row,
                    column
                });
            }
        }

        return cells.slice(0, Math.max(plateCount, cells.length));
    }

    function choosePlateClass(rng, index) {
        if (index < PLATE_CLASSES.length) {
            return PLATE_CLASSES[index];
        }

        return PLATE_CLASSES[rng.nextInt(PLATE_CLASSES.length)];
    }

    function clampGridCoordinate(value, maxExclusive) {
        return Math.max(0, Math.min(maxExclusive - 1, Math.floor(value)));
    }

    function roundMotionValue(value) {
        const rounded = Math.round(value * (10 ** MOTION_VECTOR_PRECISION)) / (10 ** MOTION_VECTOR_PRECISION);
        return Object.is(rounded, -0) ? 0 : rounded;
    }

    function getImplementedStageIds() {
        return new Set([
            'plateSeedDistribution',
            'plateMotionVectors',
            'plateBoundaryClassification',
            'upliftField',
            'subsidenceField',
            'fractureField',
            'ridgeLineSynthesis',
            'basinSeedPlacement',
            'arcFormationHelper',
            'hotspotVolcanicSeedHelper',
            'platePressureCompositeField',
            'mountainBeltCandidates',
            'plainLowlandSmoothingPass'
        ]);
    }

    function normalizePoint(point = {}) {
        const normalizedPoint = isPlainObject(point) ? point : {};
        return {
            x: normalizeInteger(normalizedPoint.x, 0),
            y: normalizeInteger(normalizedPoint.y, 0)
        };
    }

    function normalizeVector(vector = {}) {
        const normalizedVector = isPlainObject(vector) ? vector : {};
        const x = Number(normalizedVector.x);
        const y = Number(normalizedVector.y);

        return {
            x: Number.isFinite(x) ? x : 0,
            y: Number.isFinite(y) ? y : 0
        };
    }

    function getPointDistance(pointA, pointB) {
        const deltaX = pointB.x - pointA.x;
        const deltaY = pointB.y - pointA.y;

        return Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));
    }

    function getDistanceToSegment(point, segmentStart, segmentEnd) {
        const deltaX = segmentEnd.x - segmentStart.x;
        const deltaY = segmentEnd.y - segmentStart.y;
        const segmentLengthSquared = (deltaX * deltaX) + (deltaY * deltaY);

        if (segmentLengthSquared <= 0) {
            return getPointDistance(point, segmentStart);
        }

        const projection = ((point.x - segmentStart.x) * deltaX + (point.y - segmentStart.y) * deltaY)
            / segmentLengthSquared;
        const clampedProjection = Math.max(0, Math.min(1, projection));
        const closestPoint = {
            x: segmentStart.x + (deltaX * clampedProjection),
            y: segmentStart.y + (deltaY * clampedProjection)
        };

        return getPointDistance(point, closestPoint);
    }

    function getWorldDiagonal(worldBounds = DEFAULT_WORLD_BOUNDS) {
        const width = Number(worldBounds.width) || DEFAULT_WORLD_BOUNDS.width;
        const height = Number(worldBounds.height) || DEFAULT_WORLD_BOUNDS.height;

        return Math.sqrt((width * width) + (height * height));
    }

    function createPlateMotionLookup(plateMotionVectors = []) {
        return plateMotionVectors.reduce((lookup, motionVector) => {
            if (motionVector && typeof motionVector.plateId === 'string') {
                lookup.set(motionVector.plateId, motionVector);
            }

            return lookup;
        }, new Map());
    }

    function normalizePlateSeedForBoundary(plateSeed, index) {
        const normalizedPlateSeed = isPlainObject(plateSeed) ? plateSeed : {};
        const plateIndex = padPlateIndex(index);
        return {
            plateId: normalizeString(normalizedPlateSeed.plateId, `plate_${plateIndex}`),
            plateClass: normalizeString(normalizedPlateSeed.plateClass, 'mixed'),
            seedPoint: normalizePoint(normalizedPlateSeed.seedPoint)
        };
    }

    function createScalarFieldStorage(fieldId, worldBounds, options = {}) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const normalizedOptions = isPlainObject(options) ? options : {};
        const range = Array.isArray(normalizedOptions.range)
            ? normalizedOptions.range.slice(0, 2)
            : DEFAULT_TECTONIC_SCALAR_FIELD_RANGE.slice();
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
            read(x, y, fallback = 0) {
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

                values[toIndex(normalizedX, normalizedY)] = clampUnitInterval(value, 0);
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

    function createDirectionalFieldStorage(fieldId, worldBounds, options = {}) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const normalizedOptions = isPlainObject(options) ? options : {};
        const defaultDirection = normalizeVector(normalizedOptions.defaultDirection);

        if (typeof macro.createDirectionalField === 'function') {
            return macro.createDirectionalField({
                fieldId,
                width,
                height,
                defaultDirection,
                defaultSampleMode: 'bilinear',
                defaultEdgeMode: 'clamp'
            });
        }

        const size = width * height;
        const xValues = new Array(size).fill(defaultDirection.x);
        const yValues = new Array(size).fill(defaultDirection.y);

        function inBounds(x, y) {
            return x >= 0 && y >= 0 && x < width && y < height;
        }

        function toIndex(x, y) {
            return (y * width) + x;
        }

        return {
            type: 'DirectionalField',
            fieldId,
            width,
            height,
            size,
            read(x, y, fallback = defaultDirection) {
                const normalizedX = Math.trunc(x);
                const normalizedY = Math.trunc(y);
                if (!inBounds(normalizedX, normalizedY)) {
                    return normalizeVector(fallback, defaultDirection);
                }

                const index = toIndex(normalizedX, normalizedY);
                return {
                    x: xValues[index],
                    y: yValues[index]
                };
            },
            write(x, y, directionLike) {
                const normalizedX = Math.trunc(x);
                const normalizedY = Math.trunc(y);
                if (!inBounds(normalizedX, normalizedY)) {
                    return false;
                }

                const index = toIndex(normalizedX, normalizedY);
                const direction = normalizeVector(directionLike, defaultDirection);
                xValues[index] = direction.x;
                yValues[index] = direction.y;
                return true;
            },
            cloneVectors() {
                return {
                    x: xValues.slice(),
                    y: yValues.slice()
                };
            },
            describe() {
                return {
                    type: 'DirectionalField',
                    fieldId,
                    width,
                    height,
                    size,
                    defaultDirection: cloneValue(defaultDirection),
                    defaultSampleMode: 'bilinear',
                    defaultEdgeMode: 'clamp'
                };
            }
        };
    }

    function writeMaxFieldValue(field, x, y, value) {
        const currentValue = typeof field.read === 'function'
            ? field.read(x, y, 0)
            : 0;
        const nextValue = Math.max(currentValue, clampUnitInterval(value, 0));

        if (typeof field.write === 'function') {
            field.write(x, y, nextValue);
        }
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
            min: roundMotionValue(min),
            max: roundMotionValue(max),
            mean: roundMotionValue(sum / numericValues.length)
        };
    }

    function buildDirectionalFieldStats(xValues = [], yValues = []) {
        const count = Math.min(
            Array.isArray(xValues) ? xValues.length : 0,
            Array.isArray(yValues) ? yValues.length : 0
        );

        if (count <= 0) {
            return {
                nonZeroCount: 0,
                meanX: 0,
                meanY: 0,
                meanMagnitude: 0,
                maxMagnitude: 0
            };
        }

        let nonZeroCount = 0;
        let totalX = 0;
        let totalY = 0;
        let totalMagnitude = 0;
        let maxMagnitude = 0;

        for (let index = 0; index < count; index += 1) {
            const x = Number.isFinite(xValues[index]) ? xValues[index] : 0;
            const y = Number.isFinite(yValues[index]) ? yValues[index] : 0;
            const magnitude = Math.hypot(x, y);

            if (magnitude > 0) {
                nonZeroCount += 1;
            }

            totalX += x;
            totalY += y;
            totalMagnitude += magnitude;
            maxMagnitude = Math.max(maxMagnitude, magnitude);
        }

        return {
            nonZeroCount,
            meanX: roundMotionValue(totalX / count),
            meanY: roundMotionValue(totalY / count),
            meanMagnitude: roundMotionValue(totalMagnitude / count),
            maxMagnitude: roundMotionValue(maxMagnitude)
        };
    }

    function serializeScalarField(field, extra = {}, options = {}) {
        const descriptor = typeof field.describe === 'function' ? field.describe() : {};
        const width = normalizeInteger(descriptor.width, normalizeInteger(field.width, 0));
        const height = normalizeInteger(descriptor.height, normalizeInteger(field.height, 0));
        const normalizedOptions = isPlainObject(options) ? options : {};
        const range = Array.isArray(normalizedOptions.range)
            ? normalizedOptions.range.slice(0, 2)
            : (Array.isArray(descriptor.range)
                ? descriptor.range.slice(0, 2)
                : DEFAULT_TECTONIC_SCALAR_FIELD_RANGE.slice());
        const valueEncoding = normalizeString(
            normalizedOptions.valueEncoding,
            TECTONIC_SCALAR_FIELD_VALUE_ENCODING
        );
        const values = typeof field.cloneValues === 'function'
            ? Array.from(field.cloneValues()).map(roundMotionValue)
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

    function serializeDirectionalField(field, extra = {}, options = {}) {
        const descriptor = typeof field.describe === 'function' ? field.describe() : {};
        const width = normalizeInteger(descriptor.width, normalizeInteger(field.width, 0));
        const height = normalizeInteger(descriptor.height, normalizeInteger(field.height, 0));
        const normalizedOptions = isPlainObject(options) ? options : {};
        const vectorEncoding = normalizeString(
            normalizedOptions.vectorEncoding,
            RIDGE_DIRECTION_FIELD_VECTOR_ENCODING
        );
        const vectors = typeof field.cloneVectors === 'function'
            ? field.cloneVectors()
            : {
                x: [],
                y: []
            };
        const xValues = Array.isArray(vectors.x)
            ? vectors.x.map(roundMotionValue)
            : [];
        const yValues = Array.isArray(vectors.y)
            ? vectors.y.map(roundMotionValue)
            : [];

        return {
            fieldType: 'DirectionalField',
            fieldId: normalizeString(descriptor.fieldId, normalizeString(field.fieldId, 'directionalField')),
            width,
            height,
            size: width * height,
            vectorEncoding,
            xValues,
            yValues,
            stats: buildDirectionalFieldStats(xValues, yValues),
            ...extra
        };
    }

    function createPlateRecordFromSeed(plateSeed) {
        const input = {
            plateId: plateSeed.plateId,
            plateClass: plateSeed.plateClass,
            seedPoint: plateSeed.seedPoint,
            upliftBias: NEUTRAL_PLATE_BIAS,
            fractureBias: NEUTRAL_PLATE_BIAS,
            compressionBias: NEUTRAL_PLATE_BIAS,
            driftBias: NEUTRAL_PLATE_BIAS,
            arcFormationBias: NEUTRAL_PLATE_BIAS
        };

        return typeof macro.createPlateRecordSkeleton === 'function'
            ? macro.createPlateRecordSkeleton(input)
            : input;
    }

    function generatePlateSeedDistribution(input = {}) {
        const normalizedInput = normalizeInput(input);
        const worldBounds = normalizedInput.worldBounds;
        const options = normalizedInput.plateSeedOptions;
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'plateSeedDistribution');
        const rng = createScopedRng(normalizedInput.macroSeed, namespace);
        const aspectRatio = worldBounds.width / Math.max(1, worldBounds.height);
        const columns = Math.max(1, Math.ceil(Math.sqrt(options.plateCount * aspectRatio)));
        const rows = Math.max(1, Math.ceil(options.plateCount / columns));
        const cellWidth = worldBounds.width / columns;
        const cellHeight = worldBounds.height / rows;
        const marginX = cellWidth * options.marginRatio;
        const marginY = cellHeight * options.marginRatio;
        const jitterWidth = Math.max(0, (cellWidth - (marginX * 2)) * options.jitterRatio);
        const jitterHeight = Math.max(0, (cellHeight - (marginY * 2)) * options.jitterRatio);
        const cells = rng.shuffle(buildGridCells(options.plateCount, columns, rows)).slice(0, options.plateCount);
        const plateSeeds = cells.map((cell, index) => {
            const plateIndex = padPlateIndex(index);
            const centerX = (cell.column + 0.5) * cellWidth;
            const centerY = (cell.row + 0.5) * cellHeight;
            const jitterX = (rng.nextFloat() - 0.5) * jitterWidth;
            const jitterY = (rng.nextFloat() - 0.5) * jitterHeight;
            const x = clampGridCoordinate(centerX + jitterX, worldBounds.width);
            const y = clampGridCoordinate(centerY + jitterY, worldBounds.height);
            const plateNamespace = buildNamespace(PIPELINE_STEP_ID, 'plateSeedDistribution', `plate${plateIndex}`);

            return {
                plateId: `plate_${plateIndex}`,
                plateClass: choosePlateClass(rng, index),
                seedPoint: {
                    x,
                    y
                },
                normalizedPoint: {
                    x: worldBounds.width > 1 ? x / (worldBounds.width - 1) : 0,
                    y: worldBounds.height > 1 ? y / (worldBounds.height - 1) : 0
                },
                cell,
                namespace: plateNamespace,
                seed: deriveSubSeed(normalizedInput.macroSeed, plateNamespace)
            };
        });

        return {
            distributionId: 'plateSeedDistribution',
            stageId: 'plateSeedDistribution',
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'macro.tectonicSkeleton.plateSeedDistribution'
            ],
            namespace,
            seed: deriveSubSeed(normalizedInput.macroSeed, namespace),
            worldBounds,
            plateCount: plateSeeds.length,
            grid: {
                columns,
                rows,
                cellWidth,
                cellHeight
            },
            options,
            biasPolicy: 'neutralPlateRecordBiasPlaceholders',
            plateSeeds
        };
    }

    function resolvePlateSeedDistribution(input = {}, normalizedInput = normalizeInput(input)) {
        if (isPlainObject(input.plateSeedDistribution)) {
            return cloneValue(input.plateSeedDistribution);
        }

        if (
            isPlainObject(input.intermediateOutputs)
            && isPlainObject(input.intermediateOutputs.plateSeedDistribution)
        ) {
            return cloneValue(input.intermediateOutputs.plateSeedDistribution);
        }

        if (
            isPlainObject(input.outputs)
            && isPlainObject(input.outputs.intermediateOutputs)
            && isPlainObject(input.outputs.intermediateOutputs.plateSeedDistribution)
        ) {
            return cloneValue(input.outputs.intermediateOutputs.plateSeedDistribution);
        }

        return generatePlateSeedDistribution(normalizedInput);
    }

    function resolvePlateMotionVectors(input = {}, normalizedInput = normalizeInput(input), plateSeedDistribution = null) {
        if (isPlainObject(input.plateMotionVectors)) {
            return cloneValue(input.plateMotionVectors);
        }

        if (
            isPlainObject(input.intermediateOutputs)
            && isPlainObject(input.intermediateOutputs.plateMotionVectors)
        ) {
            return cloneValue(input.intermediateOutputs.plateMotionVectors);
        }

        if (
            isPlainObject(input.outputs)
            && isPlainObject(input.outputs.intermediateOutputs)
            && isPlainObject(input.outputs.intermediateOutputs.plateMotionVectors)
        ) {
            return cloneValue(input.outputs.intermediateOutputs.plateMotionVectors);
        }

        return generatePlateMotionVectors({
            ...normalizedInput,
            plateSeedDistribution: plateSeedDistribution || resolvePlateSeedDistribution(input, normalizedInput)
        });
    }

    function generatePlateMotionVectors(input = {}) {
        const normalizedInput = normalizeInput(input);
        const plateSeedDistribution = resolvePlateSeedDistribution(input, normalizedInput);
        const plateSeeds = Array.isArray(plateSeedDistribution.plateSeeds)
            ? plateSeedDistribution.plateSeeds
            : [];
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'plateMotionVectors');
        const plateMotionVectors = plateSeeds.map((plateSeed, index) => {
            const plateIndex = padPlateIndex(index);
            const plateNamespace = buildNamespace(PIPELINE_STEP_ID, 'plateMotionVectors', `plate${plateIndex}`);
            const plateRng = createScopedRng(normalizedInput.macroSeed, plateNamespace);
            const angleTurns = plateRng.nextFloat();
            const magnitude = DEFAULT_PLATE_MOTION_MIN_MAGNITUDE
                + ((DEFAULT_PLATE_MOTION_MAX_MAGNITUDE - DEFAULT_PLATE_MOTION_MIN_MAGNITUDE) * plateRng.nextFloat());
            const angleRadians = angleTurns * TWO_PI;
            const unitX = Math.cos(angleRadians);
            const unitY = Math.sin(angleRadians);

            return {
                plateId: normalizeString(plateSeed.plateId, `plate_${plateIndex}`),
                plateClass: normalizeString(plateSeed.plateClass, 'mixed'),
                seedPoint: isPlainObject(plateSeed.seedPoint)
                    ? cloneValue(plateSeed.seedPoint)
                    : {
                        x: 0,
                        y: 0
                    },
                angleRadians: roundMotionValue(angleRadians),
                angleTurns: roundMotionValue(angleTurns),
                magnitude: roundMotionValue(magnitude),
                unitVector: {
                    x: roundMotionValue(unitX),
                    y: roundMotionValue(unitY)
                },
                motionVector: {
                    x: roundMotionValue(unitX * magnitude),
                    y: roundMotionValue(unitY * magnitude)
                },
                namespace: plateNamespace,
                seed: deriveSubSeed(normalizedInput.macroSeed, plateNamespace)
            };
        });

        return {
            vectorSetId: 'plateMotionVectors',
            stageId: 'plateMotionVectors',
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'macro.tectonicSkeleton.plateMotionVectors',
                'plateSeedDistribution.plateSeeds'
            ],
            namespace,
            seed: deriveSubSeed(normalizedInput.macroSeed, namespace),
            sourceDistributionId: normalizeString(
                plateSeedDistribution.distributionId,
                'plateSeedDistribution'
            ),
            worldBounds: isPlainObject(plateSeedDistribution.worldBounds)
                ? cloneValue(plateSeedDistribution.worldBounds)
                : cloneValue(normalizedInput.worldBounds),
            plateCount: plateMotionVectors.length,
            motionModel: 'seededPlateMotionVectorsV1',
            vectorEncoding: 'unitVectorMagnitudeAndMotionVector',
            magnitudeRange: {
                min: DEFAULT_PLATE_MOTION_MIN_MAGNITUDE,
                max: DEFAULT_PLATE_MOTION_MAX_MAGNITUDE
            },
            boundaryAnalysisCompatibility: {
                compatible: true,
                requiredKeys: [
                    'plateId',
                    'seedPoint',
                    'motionVector',
                    'magnitude'
                ],
                intentionallyAbsent: [
                    'boundaryType',
                    'uplift',
                    'subsidence',
                    'relief'
                ]
            },
            plateMotionVectors
        };
    }

    function getBoundaryPairId(plateIdA, plateIdB) {
        return [plateIdA, plateIdB]
            .slice()
            .sort()
            .join('__');
    }

    function createBoundaryId(plateIdA, plateIdB) {
        return `boundary_${getBoundaryPairId(plateIdA, plateIdB).replace('__', '_')}`;
    }

    function getBoundaryNeighborTarget(plateCount) {
        if (plateCount <= 1) {
            return 0;
        }

        return clampInteger(
            Math.ceil(Math.sqrt(plateCount)),
            DEFAULT_BOUNDARY_NEIGHBOR_MIN,
            Math.min(DEFAULT_BOUNDARY_NEIGHBOR_MAX, plateCount - 1),
            DEFAULT_BOUNDARY_NEIGHBOR_MIN
        );
    }

    function buildBoundaryPairs(plateSeeds = []) {
        const normalizedSeeds = plateSeeds.map(normalizePlateSeedForBoundary);
        const neighborTarget = getBoundaryNeighborTarget(normalizedSeeds.length);
        const pairMap = new Map();

        normalizedSeeds.forEach((sourcePlate) => {
            const nearestPlates = normalizedSeeds
                .filter((targetPlate) => targetPlate.plateId !== sourcePlate.plateId)
                .map((targetPlate) => ({
                    sourcePlate,
                    targetPlate,
                    distance: getPointDistance(sourcePlate.seedPoint, targetPlate.seedPoint)
                }))
                .sort((left, right) => {
                    if (left.distance !== right.distance) {
                        return left.distance - right.distance;
                    }

                    return left.targetPlate.plateId.localeCompare(right.targetPlate.plateId);
                });

            nearestPlates.slice(0, neighborTarget).forEach((candidate) => {
                const pairId = getBoundaryPairId(candidate.sourcePlate.plateId, candidate.targetPlate.plateId);
                if (pairMap.has(pairId)) {
                    return;
                }

                const orderedPlates = [candidate.sourcePlate, candidate.targetPlate]
                    .sort((left, right) => left.plateId.localeCompare(right.plateId));

                pairMap.set(pairId, {
                    boundaryId: createBoundaryId(orderedPlates[0].plateId, orderedPlates[1].plateId),
                    plateA: orderedPlates[0],
                    plateB: orderedPlates[1],
                    distance: getPointDistance(orderedPlates[0].seedPoint, orderedPlates[1].seedPoint)
                });
            });
        });

        return {
            neighborTarget,
            pairs: Array.from(pairMap.values()).sort((left, right) => left.boundaryId.localeCompare(right.boundaryId))
        };
    }

    function scoreBoundaryType(collisionScore, divergenceScore, transformScore) {
        if (collisionScore === 0 && divergenceScore === 0 && transformScore === 0) {
            return 'transform';
        }

        if (transformScore >= collisionScore && transformScore >= divergenceScore) {
            return 'transform';
        }

        if (collisionScore >= divergenceScore) {
            return 'collision';
        }

        return 'divergence';
    }

    function getVolcanicSourceHint(boundaryType, plateClassA, plateClassB) {
        const plateClasses = new Set([plateClassA, plateClassB]);
        const hasOceanicInfluence = plateClasses.has('oceanic') || plateClasses.has('mixed');
        const hasContinentalInfluence = plateClasses.has('continental') || plateClasses.has('mixed');

        if (boundaryType === 'collision') {
            if (hasOceanicInfluence && hasContinentalInfluence) {
                return 'arcCandidate';
            }

            if (plateClasses.has('oceanic')) {
                return 'islandArcCandidate';
            }

            return 'orogenyCandidate';
        }

        if (boundaryType === 'divergence') {
            return 'riftCandidate';
        }

        return 'shearCandidate';
    }

    function classifyBoundaryPair(pair, motionLookup, worldDiagonal) {
        const pointA = pair.plateA.seedPoint;
        const pointB = pair.plateB.seedPoint;
        const deltaX = pointB.x - pointA.x;
        const deltaY = pointB.y - pointA.y;
        const distance = pair.distance || getPointDistance(pointA, pointB);
        const safeDistance = distance > 0 ? distance : 1;
        const boundaryVector = {
            x: roundMotionValue(deltaX / safeDistance),
            y: roundMotionValue(deltaY / safeDistance)
        };
        const tangentVector = {
            x: -boundaryVector.y,
            y: boundaryVector.x
        };
        const motionA = normalizeVector((motionLookup.get(pair.plateA.plateId) || {}).motionVector);
        const motionB = normalizeVector((motionLookup.get(pair.plateB.plateId) || {}).motionVector);
        const relativeMotionVector = {
            x: motionB.x - motionA.x,
            y: motionB.y - motionA.y
        };
        const normalComponent = (relativeMotionVector.x * boundaryVector.x)
            + (relativeMotionVector.y * boundaryVector.y);
        const tangentialComponent = (relativeMotionVector.x * tangentVector.x)
            + (relativeMotionVector.y * tangentVector.y);
        const relativeMagnitude = Math.sqrt(
            (relativeMotionVector.x * relativeMotionVector.x)
            + (relativeMotionVector.y * relativeMotionVector.y)
        );
        const collisionScore = clampUnitInterval(-normalComponent / MAX_RELATIVE_MOTION_MAGNITUDE, 0);
        const divergenceScore = clampUnitInterval(normalComponent / MAX_RELATIVE_MOTION_MAGNITUDE, 0);
        const transformScore = clampUnitInterval(Math.abs(tangentialComponent) / MAX_RELATIVE_MOTION_MAGNITUDE, 0);
        const boundaryType = scoreBoundaryType(collisionScore, divergenceScore, transformScore);
        const volcanicSourceHint = getVolcanicSourceHint(
            boundaryType,
            pair.plateA.plateClass,
            pair.plateB.plateClass
        );
        const oceanicFactor = volcanicSourceHint === 'arcCandidate' || volcanicSourceHint === 'islandArcCandidate'
            ? 0.9
            : 0.35;

        return {
            boundaryId: pair.boundaryId,
            plateIds: [
                pair.plateA.plateId,
                pair.plateB.plateId
            ],
            plateClasses: {
                [pair.plateA.plateId]: pair.plateA.plateClass,
                [pair.plateB.plateId]: pair.plateB.plateClass
            },
            seedPoints: {
                [pair.plateA.plateId]: cloneValue(pair.plateA.seedPoint),
                [pair.plateB.plateId]: cloneValue(pair.plateB.seedPoint)
            },
            boundaryType,
            distance: roundMotionValue(distance),
            normalizedDistance: roundMotionValue(distance / Math.max(1, worldDiagonal)),
            boundaryVector,
            relativeMotion: {
                vector: {
                    x: roundMotionValue(relativeMotionVector.x),
                    y: roundMotionValue(relativeMotionVector.y)
                },
                normalComponent: roundMotionValue(normalComponent),
                tangentialComponent: roundMotionValue(tangentialComponent),
                magnitude: roundMotionValue(relativeMagnitude)
            },
            scores: {
                collision: roundMotionValue(collisionScore),
                divergence: roundMotionValue(divergenceScore),
                transform: roundMotionValue(transformScore)
            },
            futureSignals: {
                upliftPotential: roundMotionValue(clampUnitInterval(collisionScore + (transformScore * 0.1), 0)),
                subsidencePotential: roundMotionValue(divergenceScore),
                volcanicPotential: roundMotionValue(clampUnitInterval(
                    (collisionScore * oceanicFactor)
                    + (divergenceScore * 0.55)
                    + (transformScore * 0.1),
                    0
                )),
                volcanicSourceHint
            }
        };
    }

    function generatePlateBoundaryClassification(input = {}) {
        const normalizedInput = normalizeInput(input);
        const plateSeedDistribution = resolvePlateSeedDistribution(input, normalizedInput);
        const plateMotionVectors = resolvePlateMotionVectors(input, normalizedInput, plateSeedDistribution);
        const plateSeeds = Array.isArray(plateSeedDistribution.plateSeeds)
            ? plateSeedDistribution.plateSeeds
            : [];
        const motionVectors = Array.isArray(plateMotionVectors.plateMotionVectors)
            ? plateMotionVectors.plateMotionVectors
            : [];
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'plateBoundaryClassification');
        const motionLookup = createPlateMotionLookup(motionVectors);
        const worldBounds = isPlainObject(plateSeedDistribution.worldBounds)
            ? cloneValue(plateSeedDistribution.worldBounds)
            : cloneValue(normalizedInput.worldBounds);
        const worldDiagonal = getWorldDiagonal(worldBounds);
        const boundaryPairs = buildBoundaryPairs(plateSeeds);
        const boundaryClassifications = boundaryPairs.pairs.map((pair) => classifyBoundaryPair(
            pair,
            motionLookup,
            worldDiagonal
        ));

        return {
            classificationId: 'plateBoundaryClassification',
            stageId: 'plateBoundaryClassification',
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'plateSeedDistribution.plateSeeds',
                'plateMotionVectors.plateMotionVectors'
            ],
            namespace,
            seed: deriveSubSeed(normalizedInput.macroSeed, namespace),
            sourceDistributionId: normalizeString(
                plateSeedDistribution.distributionId,
                'plateSeedDistribution'
            ),
            sourceVectorSetId: normalizeString(
                plateMotionVectors.vectorSetId,
                'plateMotionVectors'
            ),
            worldBounds,
            plateCount: plateSeeds.length,
            boundaryCount: boundaryClassifications.length,
            adjacencyModel: 'nearestSeedGraphV1',
            classificationModel: 'relativeMotionNormalTangentialV1',
            options: {
                neighborTarget: boundaryPairs.neighborTarget,
                boundaryTypes: BOUNDARY_TYPES.slice()
            },
            preparationTargets: [
                'uplift',
                'subsidence',
                'volcanic'
            ],
            intentionallyAbsent: [
                'relief',
                'climateEffects',
                'terrainCells'
            ],
            boundaryClassifications
        };
    }

    function resolvePlateBoundaryClassification(input = {}, normalizedInput = normalizeInput(input), sourceOutputs = {}) {
        if (isPlainObject(input.plateBoundaryClassification)) {
            return cloneValue(input.plateBoundaryClassification);
        }

        if (
            isPlainObject(input.intermediateOutputs)
            && isPlainObject(input.intermediateOutputs.plateBoundaryClassification)
        ) {
            return cloneValue(input.intermediateOutputs.plateBoundaryClassification);
        }

        if (
            isPlainObject(input.outputs)
            && isPlainObject(input.outputs.intermediateOutputs)
            && isPlainObject(input.outputs.intermediateOutputs.plateBoundaryClassification)
        ) {
            return cloneValue(input.outputs.intermediateOutputs.plateBoundaryClassification);
        }

        return generatePlateBoundaryClassification({
            ...normalizedInput,
            ...sourceOutputs
        });
    }

    function getBoundarySeedPoint(boundary, plateId) {
        if (
            isPlainObject(boundary.seedPoints)
            && isPlainObject(boundary.seedPoints[plateId])
        ) {
            return normalizePoint(boundary.seedPoints[plateId]);
        }

        return {
            x: 0,
            y: 0
        };
    }

    function getBoundaryUpliftPotential(boundary) {
        if (
            isPlainObject(boundary.futureSignals)
            && Number.isFinite(boundary.futureSignals.upliftPotential)
        ) {
            return clampUnitInterval(boundary.futureSignals.upliftPotential, 0);
        }

        const scores = isPlainObject(boundary.scores) ? boundary.scores : {};
        const collisionScore = Number.isFinite(scores.collision) ? scores.collision : 0;
        const transformScore = Number.isFinite(scores.transform) ? scores.transform : 0;

        return clampUnitInterval(collisionScore + (transformScore * 0.1), 0);
    }

    function getBoundarySubsidencePotential(boundary) {
        if (
            isPlainObject(boundary.futureSignals)
            && Number.isFinite(boundary.futureSignals.subsidencePotential)
        ) {
            return clampUnitInterval(boundary.futureSignals.subsidencePotential, 0);
        }

        const scores = isPlainObject(boundary.scores) ? boundary.scores : {};
        const divergenceScore = Number.isFinite(scores.divergence) ? scores.divergence : 0;
        const transformScore = Number.isFinite(scores.transform) ? scores.transform : 0;

        return clampUnitInterval(divergenceScore + (transformScore * 0.05), 0);
    }

    function getBoundaryFracturePotential(boundary) {
        const scores = isPlainObject(boundary.scores) ? boundary.scores : {};
        const transformScore = Number.isFinite(scores.transform) ? scores.transform : 0;
        const collisionScore = Number.isFinite(scores.collision) ? scores.collision : 0;
        const divergenceScore = Number.isFinite(scores.divergence) ? scores.divergence : 0;
        const normalStressScore = Math.max(collisionScore, divergenceScore);
        const relativeMagnitude = Number(
            boundary
            && boundary.relativeMotion
            && boundary.relativeMotion.magnitude
        );
        const relativeMotionScore = Number.isFinite(relativeMagnitude)
            ? clampUnitInterval(relativeMagnitude / MAX_RELATIVE_MOTION_MAGNITUDE, 0)
            : 0;

        return clampUnitInterval(
            (transformScore * 0.7)
            + (normalStressScore * 0.2)
            + (relativeMotionScore * 0.1),
            0
        );
    }

    function getUpliftInfluenceRadius(worldBounds) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);

        return Math.max(1, Math.min(width, height) * DEFAULT_UPLIFT_INFLUENCE_RADIUS_RATIO);
    }

    function getSubsidenceInfluenceRadius(worldBounds) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);

        return Math.max(1, Math.min(width, height) * DEFAULT_SUBSIDENCE_INFLUENCE_RADIUS_RATIO);
    }

    function getFractureInfluenceRadius(worldBounds) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);

        return Math.max(1, Math.min(width, height) * DEFAULT_FRACTURE_INFLUENCE_RADIUS_RATIO);
    }

    function getRidgeInfluenceRadius(worldBounds) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);

        return Math.max(1, Math.min(width, height) * DEFAULT_RIDGE_INFLUENCE_RADIUS_RATIO);
    }

    function buildNormalizedPoint(point, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const normalizedPoint = normalizePoint(point);

        return {
            x: roundMotionValue(width > 1 ? normalizedPoint.x / (width - 1) : 0),
            y: roundMotionValue(height > 1 ? normalizedPoint.y / (height - 1) : 0)
        };
    }

    function canonicalizeDirection(directionLike = {}) {
        const normalizedDirection = normalizeVector(directionLike);
        if (normalizedDirection.x < 0 || (normalizedDirection.x === 0 && normalizedDirection.y < 0)) {
            return {
                x: roundMotionValue(-normalizedDirection.x),
                y: roundMotionValue(-normalizedDirection.y)
            };
        }

        return {
            x: roundMotionValue(normalizedDirection.x),
            y: roundMotionValue(normalizedDirection.y)
        };
    }

    function readSerializedScalarFieldValue(field, point, fallback = 0) {
        if (!field || !Array.isArray(field.values)) {
            return clampUnitInterval(fallback, 0);
        }

        const width = normalizeInteger(field.width, 0);
        const height = normalizeInteger(field.height, 0);
        if (width <= 0 || height <= 0) {
            return clampUnitInterval(fallback, 0);
        }

        const normalizedPoint = normalizePoint(point);
        const x = clampGridCoordinate(normalizedPoint.x, width);
        const y = clampGridCoordinate(normalizedPoint.y, height);
        const value = Number(field.values[(y * width) + x]);

        return clampUnitInterval(Number.isFinite(value) ? value : fallback, 0);
    }

    function readSerializedDirectionalFieldMagnitude(field, point, fallback = 0) {
        if (!field || !Array.isArray(field.xValues) || !Array.isArray(field.yValues)) {
            return clampUnitInterval(fallback, 0);
        }

        const width = normalizeInteger(field.width, 0);
        const height = normalizeInteger(field.height, 0);
        if (width <= 0 || height <= 0) {
            return clampUnitInterval(fallback, 0);
        }

        const normalizedPoint = normalizePoint(point);
        const x = clampGridCoordinate(normalizedPoint.x, width);
        const y = clampGridCoordinate(normalizedPoint.y, height);
        const index = (y * width) + x;
        const vectorX = Number(field.xValues[index]);
        const vectorY = Number(field.yValues[index]);
        const magnitude = Math.hypot(
            Number.isFinite(vectorX) ? vectorX : 0,
            Number.isFinite(vectorY) ? vectorY : 0
        );

        return clampUnitInterval(magnitude, fallback);
    }

    function createStrengthTracker(worldBounds = DEFAULT_WORLD_BOUNDS) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const values = new Array(width * height).fill(-1);

        function toIndex(x, y) {
            return (y * width) + x;
        }

        return {
            read(x, y) {
                return values[toIndex(x, y)];
            },
            write(x, y, value) {
                values[toIndex(x, y)] = value;
            }
        };
    }

    function writeDirectionalFieldValue(field, strengthTracker, x, y, direction, strength) {
        const nextStrength = clampUnitInterval(strength, 0);
        const currentStrength = strengthTracker.read(x, y);
        if (currentStrength >= nextStrength) {
            return;
        }

        strengthTracker.write(x, y, nextStrength);
        field.write(x, y, direction);
    }

    function normalizeUnitVector(directionLike = {}, fallback = { x: 1, y: 0 }) {
        const normalizedDirection = normalizeVector(directionLike);
        const magnitude = Math.hypot(normalizedDirection.x, normalizedDirection.y);
        if (magnitude <= 0) {
            const fallbackDirection = normalizeVector(fallback);
            const fallbackMagnitude = Math.hypot(fallbackDirection.x, fallbackDirection.y);
            if (fallbackMagnitude <= 0) {
                return {
                    x: 1,
                    y: 0
                };
            }

            return {
                x: roundMotionValue(fallbackDirection.x / fallbackMagnitude),
                y: roundMotionValue(fallbackDirection.y / fallbackMagnitude)
            };
        }

        return {
            x: roundMotionValue(normalizedDirection.x / magnitude),
            y: roundMotionValue(normalizedDirection.y / magnitude)
        };
    }

    function clampPointToWorldBounds(point, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const normalizedPoint = normalizePoint(point);

        return {
            x: clampGridCoordinate(normalizedPoint.x, width),
            y: clampGridCoordinate(normalizedPoint.y, height)
        };
    }

    function buildQuadraticCurveSamples(startPoint, controlPoint, endPoint, sampleCount = DEFAULT_ARC_HELPER_SAMPLE_COUNT, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const samples = [];
        const normalizedSampleCount = Math.max(2, normalizeInteger(sampleCount, DEFAULT_ARC_HELPER_SAMPLE_COUNT));

        for (let index = 0; index < normalizedSampleCount; index += 1) {
            const t = normalizedSampleCount <= 1
                ? 0
                : index / (normalizedSampleCount - 1);
            const inverseT = 1 - t;
            samples.push(clampPointToWorldBounds({
                x: Math.round(
                    (inverseT * inverseT * startPoint.x)
                    + (2 * inverseT * t * controlPoint.x)
                    + (t * t * endPoint.x)
                ),
                y: Math.round(
                    (inverseT * inverseT * startPoint.y)
                    + (2 * inverseT * t * controlPoint.y)
                    + (t * t * endPoint.y)
                )
            }, worldBounds));
        }

        return samples;
    }

    function buildPointBounds(points = [], worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedPoints = Array.isArray(points) ? points.map(normalizePoint) : [];
        if (!normalizedPoints.length) {
            return {
                bounds: {
                    minX: 0,
                    maxX: 0,
                    minY: 0,
                    maxY: 0
                }
            };
        }

        const xs = normalizedPoints.map((point) => point.x);
        const ys = normalizedPoints.map((point) => point.y);
        return {
            bounds: {
                minX: Math.max(0, Math.min(...xs)),
                maxX: Math.min(normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width) - 1, Math.max(...xs)),
                minY: Math.max(0, Math.min(...ys)),
                maxY: Math.min(normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height) - 1, Math.max(...ys))
            }
        };
    }

    function getHotspotPlateBias(plateClass = 'mixed') {
        switch (normalizeString(plateClass, 'mixed')) {
        case 'oceanic':
            return 0.74;
        case 'continental':
            return 0.42;
        case 'mixed':
        default:
            return 0.58;
        }
    }

    function getHotspotSourceKind(plateClass = 'mixed') {
        switch (normalizeString(plateClass, 'mixed')) {
        case 'oceanic':
            return 'oceanicHotspotLike';
        case 'continental':
            return 'continentalHotspotLike';
        case 'mixed':
        default:
            return 'mixedHotspotLike';
        }
    }

    function buildHotspotTrailSamples(seedPoint, trailVector, trailLength, worldBounds = DEFAULT_WORLD_BOUNDS, rng = null) {
        const normalizedSeedPoint = normalizePoint(seedPoint);
        const normalizedTrailVector = normalizeUnitVector(trailVector, { x: -1, y: 0 });
        const lateralVector = normalizeUnitVector({
            x: -normalizedTrailVector.y,
            y: normalizedTrailVector.x
        }, { x: 0, y: 1 });
        const trailSamples = [];

        for (let index = 0; index < DEFAULT_HOTSPOT_TRAIL_SAMPLE_COUNT; index += 1) {
            const t = DEFAULT_HOTSPOT_TRAIL_SAMPLE_COUNT <= 1
                ? 0
                : index / (DEFAULT_HOTSPOT_TRAIL_SAMPLE_COUNT - 1);
            const lateralJitter = rng && typeof rng.nextFloat === 'function'
                ? (rng.nextFloat() - 0.5) * trailLength * 0.08 * (1 - (t * 0.55))
                : 0;
            trailSamples.push(clampPointToWorldBounds({
                x: Math.round(
                    normalizedSeedPoint.x
                    + (normalizedTrailVector.x * trailLength * t)
                    + (lateralVector.x * lateralJitter)
                ),
                y: Math.round(
                    normalizedSeedPoint.y
                    + (normalizedTrailVector.y * trailLength * t)
                    + (lateralVector.y * lateralJitter)
                )
            }, worldBounds));
        }

        return trailSamples;
    }

    function getArcGuideProximityPenalty(point, arcFormationHelper, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const arcGuides = Array.isArray(arcFormationHelper && arcFormationHelper.arcGuides)
            ? arcFormationHelper.arcGuides
            : [];
        if (!arcGuides.length) {
            return 0;
        }

        const shortestAxis = Math.max(1, Math.min(worldBounds.width, worldBounds.height));
        let penalty = 0;

        arcGuides.forEach((guide) => {
            const guidePoints = Array.isArray(guide && guide.curveSamples) && guide.curveSamples.length
                ? guide.curveSamples
                : [guide && guide.startPoint, guide && guide.midpoint, guide && guide.apexPoint, guide && guide.endPoint]
                    .filter((candidatePoint) => isPlainObject(candidatePoint));
            const influenceRadius = Math.max(
                2,
                Number(guide && guide.guideArea && guide.guideArea.influenceRadius)
                || (shortestAxis * DEFAULT_HOTSPOT_BASE_RADIUS_RATIO * 2.5)
            );

            guidePoints.forEach((guidePoint) => {
                const distance = getPointDistance(normalizePoint(point), normalizePoint(guidePoint));
                penalty = Math.max(
                    penalty,
                    clampUnitInterval(1 - (distance / (influenceRadius * 1.8)), 0)
                );
            });
        });

        return roundMotionValue(penalty);
    }

    function materializeUpliftField(field, boundaryClassifications = [], worldBounds = DEFAULT_WORLD_BOUNDS) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const influenceRadius = getUpliftInfluenceRadius(worldBounds);

        boundaryClassifications.forEach((boundary) => {
            if (!boundary || !Array.isArray(boundary.plateIds) || boundary.plateIds.length < 2) {
                return;
            }

            const upliftPotential = getBoundaryUpliftPotential(boundary);
            if (upliftPotential <= 0) {
                return;
            }

            const startPoint = getBoundarySeedPoint(boundary, boundary.plateIds[0]);
            const endPoint = getBoundarySeedPoint(boundary, boundary.plateIds[1]);
            const minX = Math.max(0, Math.floor(Math.min(startPoint.x, endPoint.x) - influenceRadius));
            const maxX = Math.min(width - 1, Math.ceil(Math.max(startPoint.x, endPoint.x) + influenceRadius));
            const minY = Math.max(0, Math.floor(Math.min(startPoint.y, endPoint.y) - influenceRadius));
            const maxY = Math.min(height - 1, Math.ceil(Math.max(startPoint.y, endPoint.y) + influenceRadius));

            for (let y = minY; y <= maxY; y += 1) {
                for (let x = minX; x <= maxX; x += 1) {
                    const distance = getDistanceToSegment(
                        {
                            x,
                            y
                        },
                        startPoint,
                        endPoint
                    );
                    const falloff = Math.max(0, 1 - (distance / influenceRadius));
                    if (falloff <= 0) {
                        continue;
                    }

                    writeMaxFieldValue(field, x, y, upliftPotential * falloff * falloff);
                }
            }
        });

        return {
            influenceRadius: roundMotionValue(influenceRadius),
            blendMode: 'maxBoundaryContribution'
        };
    }

    function generateUpliftField(input = {}) {
        const normalizedInput = normalizeInput(input);
        const plateSeedDistribution = resolvePlateSeedDistribution(input, normalizedInput);
        const plateMotionVectors = resolvePlateMotionVectors(input, normalizedInput, plateSeedDistribution);
        const plateBoundaryClassification = resolvePlateBoundaryClassification(input, normalizedInput, {
            plateSeedDistribution,
            plateMotionVectors
        });
        const worldBounds = isPlainObject(plateBoundaryClassification.worldBounds)
            ? cloneValue(plateBoundaryClassification.worldBounds)
            : cloneValue(normalizedInput.worldBounds);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'upliftField');
        const field = createScalarFieldStorage('upliftField', worldBounds, {
            range: DEFAULT_UPLIFT_FIELD_RANGE
        });
        const boundaryClassifications = Array.isArray(plateBoundaryClassification.boundaryClassifications)
            ? plateBoundaryClassification.boundaryClassifications
            : [];
        const materialization = materializeUpliftField(field, boundaryClassifications, worldBounds);

        return serializeScalarField(field, {
            stageId: 'upliftField',
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'plateBoundaryClassification.boundaryClassifications'
            ],
            namespace,
            seed: deriveSubSeed(normalizedInput.macroSeed, namespace),
            sourceClassificationId: normalizeString(
                plateBoundaryClassification.classificationId,
                'plateBoundaryClassification'
            ),
            worldBounds,
            generationModel: 'boundaryUpliftFalloffV1',
            influenceModel: materialization,
            intentionallyAbsent: [
                'elevationComposite',
                'reliefRegions',
                'climateEffects'
            ]
        }, {
            range: DEFAULT_UPLIFT_FIELD_RANGE,
            valueEncoding: UPLIFT_FIELD_VALUE_ENCODING
        });
    }

    function materializeSubsidenceField(field, boundaryClassifications = [], worldBounds = DEFAULT_WORLD_BOUNDS) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const influenceRadius = getSubsidenceInfluenceRadius(worldBounds);

        boundaryClassifications.forEach((boundary) => {
            if (!boundary || !Array.isArray(boundary.plateIds) || boundary.plateIds.length < 2) {
                return;
            }

            const subsidencePotential = getBoundarySubsidencePotential(boundary);
            if (subsidencePotential <= 0) {
                return;
            }

            const startPoint = getBoundarySeedPoint(boundary, boundary.plateIds[0]);
            const endPoint = getBoundarySeedPoint(boundary, boundary.plateIds[1]);
            const minX = Math.max(0, Math.floor(Math.min(startPoint.x, endPoint.x) - influenceRadius));
            const maxX = Math.min(width - 1, Math.ceil(Math.max(startPoint.x, endPoint.x) + influenceRadius));
            const minY = Math.max(0, Math.floor(Math.min(startPoint.y, endPoint.y) - influenceRadius));
            const maxY = Math.min(height - 1, Math.ceil(Math.max(startPoint.y, endPoint.y) + influenceRadius));

            for (let y = minY; y <= maxY; y += 1) {
                for (let x = minX; x <= maxX; x += 1) {
                    const distance = getDistanceToSegment(
                        {
                            x,
                            y
                        },
                        startPoint,
                        endPoint
                    );
                    const falloff = Math.max(0, 1 - (distance / influenceRadius));
                    if (falloff <= 0) {
                        continue;
                    }

                    writeMaxFieldValue(field, x, y, subsidencePotential * falloff * falloff);
                }
            }
        });

        return {
            influenceRadius: roundMotionValue(influenceRadius),
            blendMode: 'maxBoundaryContribution'
        };
    }

    function resolveUpliftFieldForCompatibility(input = {}) {
        if (isPlainObject(input.upliftField)) {
            return cloneValue(input.upliftField);
        }

        if (
            isPlainObject(input.fields)
            && isPlainObject(input.fields.upliftField)
        ) {
            return cloneValue(input.fields.upliftField);
        }

        if (
            isPlainObject(input.outputs)
            && isPlainObject(input.outputs.fields)
            && isPlainObject(input.outputs.fields.upliftField)
        ) {
            return cloneValue(input.outputs.fields.upliftField);
        }

        return null;
    }

    function buildSubsidenceCompatibility(input, worldBounds) {
        const upliftField = resolveUpliftFieldForCompatibility(input);
        const upliftWorldBounds = upliftField && isPlainObject(upliftField.worldBounds)
            ? upliftField.worldBounds
            : null;
        const sameWorldBounds = upliftWorldBounds
            ? upliftWorldBounds.width === worldBounds.width && upliftWorldBounds.height === worldBounds.height
            : null;

        return {
            upliftFieldId: normalizeString(upliftField && upliftField.fieldId, 'upliftField'),
            upliftFieldAvailable: Boolean(upliftField),
            sameWorldBoundsRequired: true,
            sameWorldBounds,
            futureElevationCompositeOperation: 'upliftField - subsidenceField',
            note: 'Compatibility metadata only; elevation composition is intentionally not built in this microstep.'
        };
    }

    function generateSubsidenceField(input = {}) {
        const normalizedInput = normalizeInput(input);
        const plateSeedDistribution = resolvePlateSeedDistribution(input, normalizedInput);
        const plateMotionVectors = resolvePlateMotionVectors(input, normalizedInput, plateSeedDistribution);
        const plateBoundaryClassification = resolvePlateBoundaryClassification(input, normalizedInput, {
            plateSeedDistribution,
            plateMotionVectors
        });
        const worldBounds = isPlainObject(plateBoundaryClassification.worldBounds)
            ? cloneValue(plateBoundaryClassification.worldBounds)
            : cloneValue(normalizedInput.worldBounds);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'subsidenceField');
        const field = createScalarFieldStorage('subsidenceField', worldBounds, {
            range: DEFAULT_SUBSIDENCE_FIELD_RANGE
        });
        const boundaryClassifications = Array.isArray(plateBoundaryClassification.boundaryClassifications)
            ? plateBoundaryClassification.boundaryClassifications
            : [];
        const materialization = materializeSubsidenceField(field, boundaryClassifications, worldBounds);

        return serializeScalarField(field, {
            stageId: 'subsidenceField',
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'plateBoundaryClassification.boundaryClassifications'
            ],
            namespace,
            seed: deriveSubSeed(normalizedInput.macroSeed, namespace),
            sourceClassificationId: normalizeString(
                plateBoundaryClassification.classificationId,
                'plateBoundaryClassification'
            ),
            worldBounds,
            generationModel: 'boundarySubsidenceFalloffV1',
            influenceModel: materialization,
            compatibility: buildSubsidenceCompatibility(input, worldBounds),
            intentionallyAbsent: [
                'marineFloodFill',
                'basinRegions',
                'elevationComposite',
                'reliefRegions',
                'climateEffects'
            ]
        }, {
            range: DEFAULT_SUBSIDENCE_FIELD_RANGE,
            valueEncoding: SUBSIDENCE_FIELD_VALUE_ENCODING
        });
    }

    function materializeFractureField(field, boundaryClassifications = [], worldBounds = DEFAULT_WORLD_BOUNDS) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const influenceRadius = getFractureInfluenceRadius(worldBounds);

        boundaryClassifications.forEach((boundary) => {
            if (!boundary || !Array.isArray(boundary.plateIds) || boundary.plateIds.length < 2) {
                return;
            }

            const fracturePotential = getBoundaryFracturePotential(boundary);
            if (fracturePotential <= 0) {
                return;
            }

            const startPoint = getBoundarySeedPoint(boundary, boundary.plateIds[0]);
            const endPoint = getBoundarySeedPoint(boundary, boundary.plateIds[1]);
            const minX = Math.max(0, Math.floor(Math.min(startPoint.x, endPoint.x) - influenceRadius));
            const maxX = Math.min(width - 1, Math.ceil(Math.max(startPoint.x, endPoint.x) + influenceRadius));
            const minY = Math.max(0, Math.floor(Math.min(startPoint.y, endPoint.y) - influenceRadius));
            const maxY = Math.min(height - 1, Math.ceil(Math.max(startPoint.y, endPoint.y) + influenceRadius));

            for (let y = minY; y <= maxY; y += 1) {
                for (let x = minX; x <= maxX; x += 1) {
                    const distance = getDistanceToSegment(
                        {
                            x,
                            y
                        },
                        startPoint,
                        endPoint
                    );
                    const falloff = Math.max(0, 1 - (distance / influenceRadius));
                    if (falloff <= 0) {
                        continue;
                    }

                    writeMaxFieldValue(field, x, y, fracturePotential * falloff);
                }
            }
        });

        return {
            influenceRadius: roundMotionValue(influenceRadius),
            blendMode: 'maxBoundaryContribution',
            falloffPower: 1
        };
    }

    function resolveSubsidenceFieldForCompatibility(input = {}) {
        if (isPlainObject(input.subsidenceField)) {
            return cloneValue(input.subsidenceField);
        }

        if (
            isPlainObject(input.fields)
            && isPlainObject(input.fields.subsidenceField)
        ) {
            return cloneValue(input.fields.subsidenceField);
        }

        if (
            isPlainObject(input.outputs)
            && isPlainObject(input.outputs.fields)
            && isPlainObject(input.outputs.fields.subsidenceField)
        ) {
            return cloneValue(input.outputs.fields.subsidenceField);
        }

        return null;
    }

    function resolveFractureFieldForCompatibility(input = {}) {
        if (isPlainObject(input.fractureMaskField)) {
            return cloneValue(input.fractureMaskField);
        }

        if (isPlainObject(input.fractureField)) {
            return cloneValue(input.fractureField);
        }

        if (
            isPlainObject(input.fields)
            && isPlainObject(input.fields.fractureMaskField)
        ) {
            return cloneValue(input.fields.fractureMaskField);
        }

        if (
            isPlainObject(input.outputs)
            && isPlainObject(input.outputs.fields)
            && isPlainObject(input.outputs.fields.fractureMaskField)
        ) {
            return cloneValue(input.outputs.fields.fractureMaskField);
        }

        return null;
    }

    function resolveRidgeDirectionFieldForCompatibility(input = {}) {
        if (isPlainObject(input.ridgeDirectionField)) {
            return cloneValue(input.ridgeDirectionField);
        }

        if (
            isPlainObject(input.fields)
            && isPlainObject(input.fields.ridgeDirectionField)
        ) {
            return cloneValue(input.fields.ridgeDirectionField);
        }

        if (
            isPlainObject(input.outputs)
            && isPlainObject(input.outputs.fields)
            && isPlainObject(input.outputs.fields.ridgeDirectionField)
        ) {
            return cloneValue(input.outputs.fields.ridgeDirectionField);
        }

        return null;
    }

    function resolveArcFormationHelperForCompatibility(input = {}) {
        if (isPlainObject(input.arcFormationHelper)) {
            return cloneValue(input.arcFormationHelper);
        }

        if (
            isPlainObject(input.intermediateOutputs)
            && isPlainObject(input.intermediateOutputs.arcFormationHelper)
        ) {
            return cloneValue(input.intermediateOutputs.arcFormationHelper);
        }

        if (
            isPlainObject(input.outputs)
            && isPlainObject(input.outputs.intermediateOutputs)
            && isPlainObject(input.outputs.intermediateOutputs.arcFormationHelper)
        ) {
            return cloneValue(input.outputs.intermediateOutputs.arcFormationHelper);
        }

        return null;
    }

    function resolveBasinSeedsForCompatibility(input = {}) {
        if (isPlainObject(input.basinSeeds)) {
            return cloneValue(input.basinSeeds);
        }

        if (
            isPlainObject(input.intermediateOutputs)
            && isPlainObject(input.intermediateOutputs.basinSeeds)
        ) {
            return cloneValue(input.intermediateOutputs.basinSeeds);
        }

        if (
            isPlainObject(input.outputs)
            && isPlainObject(input.outputs.intermediateOutputs)
            && isPlainObject(input.outputs.intermediateOutputs.basinSeeds)
        ) {
            return cloneValue(input.outputs.intermediateOutputs.basinSeeds);
        }

        return null;
    }

    function resolvePlatePressureFieldForCompatibility(input = {}) {
        if (isPlainObject(input.platePressureField)) {
            return cloneValue(input.platePressureField);
        }

        if (
            isPlainObject(input.fields)
            && isPlainObject(input.fields.platePressureField)
        ) {
            return cloneValue(input.fields.platePressureField);
        }

        if (
            isPlainObject(input.outputs)
            && isPlainObject(input.outputs.fields)
            && isPlainObject(input.outputs.fields.platePressureField)
        ) {
            return cloneValue(input.outputs.fields.platePressureField);
        }

        return null;
    }

    function resolveMountainBeltCandidatesForCompatibility(input = {}) {
        if (isPlainObject(input.mountainBeltCandidates)) {
            return cloneValue(input.mountainBeltCandidates);
        }

        if (
            isPlainObject(input.intermediateOutputs)
            && isPlainObject(input.intermediateOutputs.mountainBeltCandidates)
        ) {
            return cloneValue(input.intermediateOutputs.mountainBeltCandidates);
        }

        if (
            isPlainObject(input.outputs)
            && isPlainObject(input.outputs.intermediateOutputs)
            && isPlainObject(input.outputs.intermediateOutputs.mountainBeltCandidates)
        ) {
            return cloneValue(input.outputs.intermediateOutputs.mountainBeltCandidates);
        }

        return null;
    }

    function compareFieldWorldBounds(field, worldBounds) {
        if (!field || !isPlainObject(field.worldBounds)) {
            return null;
        }

        return field.worldBounds.width === worldBounds.width
            && field.worldBounds.height === worldBounds.height;
    }

    function buildFractureCompatibility(input, worldBounds) {
        const upliftField = resolveUpliftFieldForCompatibility(input);
        const subsidenceField = resolveSubsidenceFieldForCompatibility(input);

        return {
            upliftFieldId: normalizeString(upliftField && upliftField.fieldId, 'upliftField'),
            subsidenceFieldId: normalizeString(subsidenceField && subsidenceField.fieldId, 'subsidenceField'),
            upliftFieldAvailable: Boolean(upliftField),
            subsidenceFieldAvailable: Boolean(subsidenceField),
            sameWorldBoundsRequired: true,
            sameWorldBounds: {
                upliftField: compareFieldWorldBounds(upliftField, worldBounds),
                subsidenceField: compareFieldWorldBounds(subsidenceField, worldBounds)
            },
            futureRidgeInput: true,
            futureLandmassInput: true,
            note: 'Compatibility metadata only; ridge line synthesis and final landmass synthesis are intentionally not built in this microstep.'
        };
    }

    function generateFractureField(input = {}) {
        const normalizedInput = normalizeInput(input);
        const plateSeedDistribution = resolvePlateSeedDistribution(input, normalizedInput);
        const plateMotionVectors = resolvePlateMotionVectors(input, normalizedInput, plateSeedDistribution);
        const plateBoundaryClassification = resolvePlateBoundaryClassification(input, normalizedInput, {
            plateSeedDistribution,
            plateMotionVectors
        });
        const worldBounds = isPlainObject(plateBoundaryClassification.worldBounds)
            ? cloneValue(plateBoundaryClassification.worldBounds)
            : cloneValue(normalizedInput.worldBounds);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'fractureField');
        const field = createScalarFieldStorage('fractureMaskField', worldBounds, {
            range: DEFAULT_FRACTURE_FIELD_RANGE
        });
        const boundaryClassifications = Array.isArray(plateBoundaryClassification.boundaryClassifications)
            ? plateBoundaryClassification.boundaryClassifications
            : [];
        const materialization = materializeFractureField(field, boundaryClassifications, worldBounds);

        return serializeScalarField(field, {
            stageId: 'fractureField',
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'plateBoundaryClassification.boundaryClassifications'
            ],
            namespace,
            seed: deriveSubSeed(normalizedInput.macroSeed, namespace),
            sourceClassificationId: normalizeString(
                plateBoundaryClassification.classificationId,
                'plateBoundaryClassification'
            ),
            worldBounds,
            generationModel: 'boundaryFractureFalloffV1',
            influenceModel: materialization,
            compatibility: buildFractureCompatibility(input, worldBounds),
            intentionallyAbsent: [
                'ridgeLines',
                'landmasses',
                'elevationComposite',
                'reliefRegions',
                'climateEffects'
            ]
        }, {
            range: DEFAULT_FRACTURE_FIELD_RANGE,
            valueEncoding: FRACTURE_FIELD_VALUE_ENCODING
        });
    }

    function buildRidgeDirectionCompatibility(input, worldBounds) {
        const upliftField = resolveUpliftFieldForCompatibility(input);
        const subsidenceField = resolveSubsidenceFieldForCompatibility(input);
        const fractureField = resolveFractureFieldForCompatibility(input);

        return {
            upliftFieldId: normalizeString(upliftField && upliftField.fieldId, 'upliftField'),
            subsidenceFieldId: normalizeString(subsidenceField && subsidenceField.fieldId, 'subsidenceField'),
            fractureFieldId: normalizeString(fractureField && fractureField.fieldId, 'fractureMaskField'),
            upliftFieldAvailable: Boolean(upliftField),
            subsidenceFieldAvailable: Boolean(subsidenceField),
            fractureFieldAvailable: Boolean(fractureField),
            sameWorldBoundsRequired: true,
            sameWorldBounds: {
                upliftField: compareFieldWorldBounds(upliftField, worldBounds),
                subsidenceField: compareFieldWorldBounds(subsidenceField, worldBounds),
                fractureField: compareFieldWorldBounds(fractureField, worldBounds)
            },
            futureMountainAmplificationInput: true,
            note: 'Compatibility metadata only; mountain amplification is prepared but basin logic and final elevation remain intentionally unbuilt in this microstep.'
        };
    }

    function getBasinSeedMinSpacing(worldBounds = DEFAULT_WORLD_BOUNDS) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        return Math.max(1, Math.min(width, height) * DEFAULT_BASIN_SEED_MIN_SPACING_RATIO);
    }

    function buildSeedArea(seedPoint, radiusX, radiusY, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const normalizedSeedPoint = normalizePoint(seedPoint);
        const normalizedRadiusX = Math.max(1, normalizeInteger(radiusX, 1));
        const normalizedRadiusY = Math.max(1, normalizeInteger(radiusY, normalizedRadiusX));

        return {
            radiusX: normalizedRadiusX,
            radiusY: normalizedRadiusY,
            bounds: {
                minX: Math.max(0, normalizedSeedPoint.x - normalizedRadiusX),
                maxX: Math.min(width - 1, normalizedSeedPoint.x + normalizedRadiusX),
                minY: Math.max(0, normalizedSeedPoint.y - normalizedRadiusY),
                maxY: Math.min(height - 1, normalizedSeedPoint.y + normalizedRadiusY)
            }
        };
    }

    function summarizeBasinTypeHint(sourceKind, sourcePlateIds, boundary) {
        const plateClasses = sourcePlateIds.reduce((set, plateId) => {
            const classMap = isPlainObject(boundary && boundary.plateClasses) ? boundary.plateClasses : {};
            const plateClass = normalizeString(classMap[plateId], '');
            if (plateClass) {
                set.add(plateClass);
            }
            return set;
        }, new Set());

        if (sourceKind === 'divergenceBoundary') {
            if (plateClasses.has('continental') && !plateClasses.has('oceanic')) {
                return 'rift_basin';
            }

            if (plateClasses.has('oceanic')) {
                return 'marginal_basin';
            }

            return 'extensional_basin';
        }

        if (plateClasses.has('continental')) {
            return 'interior_basin';
        }

        if (plateClasses.has('oceanic')) {
            return 'marine_depression';
        }

        return 'sag_basin';
    }

    function buildBasinSeedCompatibility(input, worldBounds) {
        const upliftField = resolveUpliftFieldForCompatibility(input);
        const subsidenceField = resolveSubsidenceFieldForCompatibility(input);
        const fractureField = resolveFractureFieldForCompatibility(input);
        const ridgeDirectionField = resolveRidgeDirectionFieldForCompatibility(input);

        return {
            upliftFieldId: normalizeString(upliftField && upliftField.fieldId, 'upliftField'),
            subsidenceFieldId: normalizeString(subsidenceField && subsidenceField.fieldId, 'subsidenceField'),
            fractureFieldId: normalizeString(fractureField && fractureField.fieldId, 'fractureMaskField'),
            ridgeDirectionFieldId: normalizeString(ridgeDirectionField && ridgeDirectionField.fieldId, 'ridgeDirectionField'),
            futureBasinTendencyInput: true,
            futureRiverBasinInput: true,
            sameWorldBoundsRequired: true,
            sameWorldBounds: {
                upliftField: compareFieldWorldBounds(upliftField, worldBounds),
                subsidenceField: compareFieldWorldBounds(subsidenceField, worldBounds),
                fractureField: compareFieldWorldBounds(fractureField, worldBounds),
                ridgeDirectionField: compareFieldWorldBounds(ridgeDirectionField, worldBounds)
            },
            note: 'Seed metadata only; basin extraction, continent bodies, and hydrology routing are intentionally absent in this microstep.'
        };
    }

    function sortBasinCandidates(left, right) {
        if (right.basinSeedStrength !== left.basinSeedStrength) {
            return right.basinSeedStrength - left.basinSeedStrength;
        }

        if (right.basinRetentionBias !== left.basinRetentionBias) {
            return right.basinRetentionBias - left.basinRetentionBias;
        }

        return normalizeString(left.sortKey, '').localeCompare(normalizeString(right.sortKey, ''));
    }

    function buildBasinSeedCandidates(worldBounds, sourceInputs, macroSeed) {
        const normalizedWorldBounds = isPlainObject(worldBounds)
            ? cloneValue(worldBounds)
            : cloneValue(DEFAULT_WORLD_BOUNDS);
        const plateSeedDistribution = sourceInputs.plateSeedDistribution || {};
        const plateBoundaryClassification = sourceInputs.plateBoundaryClassification || {};
        const upliftField = sourceInputs.upliftField || null;
        const subsidenceField = sourceInputs.subsidenceField || null;
        const fractureMaskField = sourceInputs.fractureMaskField || null;
        const ridgeDirectionField = sourceInputs.ridgeDirectionField || null;
        const plateSeeds = Array.isArray(plateSeedDistribution.plateSeeds)
            ? plateSeedDistribution.plateSeeds
            : [];
        const boundaryClassifications = Array.isArray(plateBoundaryClassification.boundaryClassifications)
            ? plateBoundaryClassification.boundaryClassifications
            : [];
        const shortestAxis = Math.max(
            1,
            Math.min(normalizedWorldBounds.width, normalizedWorldBounds.height)
        );
        const radiusBase = shortestAxis * DEFAULT_BASIN_SEED_BASE_RADIUS_RATIO;
        const candidates = [];

        boundaryClassifications.forEach((boundary, boundaryIndex) => {
            if (!boundary || normalizeString(boundary.boundaryType, '') !== 'divergence') {
                return;
            }

            const startPoint = getBoundarySeedPoint(boundary, boundary.plateIds[0]);
            const endPoint = getBoundarySeedPoint(boundary, boundary.plateIds[1]);
            const seedPoint = {
                x: Math.round((startPoint.x + endPoint.x) / 2),
                y: Math.round((startPoint.y + endPoint.y) / 2)
            };
            const subsidencePotential = getBoundarySubsidencePotential(boundary);
            const sampledSubsidence = readSerializedScalarFieldValue(subsidenceField, seedPoint, subsidencePotential);
            const sampledUplift = readSerializedScalarFieldValue(upliftField, seedPoint, 0);
            const sampledFracture = readSerializedScalarFieldValue(fractureMaskField, seedPoint, 0);
            const ridgePenalty = readSerializedDirectionalFieldMagnitude(ridgeDirectionField, seedPoint, 0);
            const basinRetentionBias = clampUnitInterval(
                (sampledSubsidence * 0.48)
                + ((1 - sampledUplift) * 0.18)
                + (sampledFracture * 0.16)
                + ((1 - ridgePenalty) * 0.18),
                0
            );
            const basinSeedStrength = clampUnitInterval(
                (subsidencePotential * 0.45)
                + (sampledSubsidence * 0.32)
                + (sampledFracture * 0.11)
                + (basinRetentionBias * 0.12)
                - (sampledUplift * 0.18)
                - (ridgePenalty * 0.2),
                0
            );

            const radiusX = Math.max(1, Math.round(radiusBase * (1.1 + basinSeedStrength)));
            const radiusY = Math.max(1, Math.round(radiusBase * (0.9 + basinRetentionBias)));
            candidates.push({
                sourceKind: 'divergenceBoundary',
                sourceBoundaryId: normalizeString(boundary.boundaryId, `boundary_${boundaryIndex + 1}`),
                sourcePlateIds: Array.isArray(boundary.plateIds) ? boundary.plateIds.slice() : [],
                seedPoint,
                normalizedPoint: buildNormalizedPoint(seedPoint, normalizedWorldBounds),
                seedArea: buildSeedArea(seedPoint, radiusX, radiusY, normalizedWorldBounds),
                basinSeedStrength: roundMotionValue(basinSeedStrength),
                basinRetentionBias: roundMotionValue(basinRetentionBias),
                basinTypeHint: summarizeBasinTypeHint('divergenceBoundary', Array.isArray(boundary.plateIds) ? boundary.plateIds : [], boundary),
                sourceSignals: {
                    subsidencePotential: roundMotionValue(subsidencePotential),
                    sampledSubsidence: roundMotionValue(sampledSubsidence),
                    sampledUplift: roundMotionValue(sampledUplift),
                    sampledFracture: roundMotionValue(sampledFracture),
                    ridgePenalty: roundMotionValue(ridgePenalty)
                },
                sortKey: `divergence:${normalizeString(boundary.boundaryId, `boundary_${boundaryIndex + 1}`)}`
            });
        });

        plateSeeds.forEach((plateSeed, plateIndex) => {
            const seedPoint = normalizePoint(plateSeed.seedPoint);
            const sampledSubsidence = readSerializedScalarFieldValue(subsidenceField, seedPoint, 0);
            const sampledUplift = readSerializedScalarFieldValue(upliftField, seedPoint, 0);
            const sampledFracture = readSerializedScalarFieldValue(fractureMaskField, seedPoint, 0);
            const ridgePenalty = readSerializedDirectionalFieldMagnitude(ridgeDirectionField, seedPoint, 0);
            const plateClass = normalizeString(plateSeed.plateClass, 'mixed');
            const plateBias = plateClass === 'continental'
                ? 0.08
                : (plateClass === 'mixed' ? 0.05 : 0.03);
            const basinRetentionBias = clampUnitInterval(
                (sampledSubsidence * 0.55)
                + ((1 - sampledUplift) * 0.22)
                + ((1 - ridgePenalty) * 0.18)
                + (plateBias * 0.5),
                0
            );
            const basinSeedStrength = clampUnitInterval(
                (sampledSubsidence * 0.58)
                + (sampledFracture * 0.08)
                + (basinRetentionBias * 0.16)
                + plateBias
                - (sampledUplift * 0.16)
                - (ridgePenalty * 0.24),
                0
            );
            const radiusX = Math.max(1, Math.round(radiusBase * (1.15 + basinSeedStrength)));
            const radiusY = Math.max(1, Math.round(radiusBase * (1.05 + basinRetentionBias)));

            candidates.push({
                sourceKind: 'plateInterior',
                sourceBoundaryId: null,
                sourcePlateIds: [
                    normalizeString(plateSeed.plateId, `plate_${padPlateIndex(plateIndex)}`)
                ],
                seedPoint,
                normalizedPoint: buildNormalizedPoint(seedPoint, normalizedWorldBounds),
                seedArea: buildSeedArea(seedPoint, radiusX, radiusY, normalizedWorldBounds),
                basinSeedStrength: roundMotionValue(basinSeedStrength),
                basinRetentionBias: roundMotionValue(basinRetentionBias),
                basinTypeHint: summarizeBasinTypeHint('plateInterior', [
                    normalizeString(plateSeed.plateId, `plate_${padPlateIndex(plateIndex)}`)
                ], {
                    plateClasses: {
                        [normalizeString(plateSeed.plateId, `plate_${padPlateIndex(plateIndex)}`)]: plateClass
                    }
                }),
                sourceSignals: {
                    sampledSubsidence: roundMotionValue(sampledSubsidence),
                    sampledUplift: roundMotionValue(sampledUplift),
                    sampledFracture: roundMotionValue(sampledFracture),
                    ridgePenalty: roundMotionValue(ridgePenalty),
                    plateBias: roundMotionValue(plateBias)
                },
                sortKey: `plate:${normalizeString(plateSeed.plateId, `plate_${padPlateIndex(plateIndex)}`)}`
            });
        });

        return candidates.sort(sortBasinCandidates);
    }

    function selectBasinSeeds(candidates, worldBounds, plateCount, macroSeed) {
        const normalizedWorldBounds = isPlainObject(worldBounds)
            ? cloneValue(worldBounds)
            : cloneValue(DEFAULT_WORLD_BOUNDS);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'basinSeeds');
        const rng = createScopedRng(macroSeed, namespace);
        const minSpacing = getBasinSeedMinSpacing(normalizedWorldBounds);
        const maxSeedCount = Math.max(
            1,
            Math.min(
                Array.isArray(candidates) ? candidates.length : 0,
                clampInteger(Math.round(Math.max(1, plateCount) * 0.75), 1, Math.max(1, plateCount + 1))
            )
        );
        const accepted = [];

        (Array.isArray(candidates) ? candidates : []).forEach((candidate) => {
            if (accepted.length >= maxSeedCount) {
                return;
            }

            if (candidate.basinSeedStrength < DEFAULT_BASIN_SEED_MIN_STRENGTH && accepted.length > 0) {
                return;
            }

            const isFarEnough = accepted.every((existingSeed) => {
                const minimumDistance = Math.max(
                    minSpacing,
                    ((candidate.seedArea.radiusX + candidate.seedArea.radiusY) * 0.35)
                    + ((existingSeed.seedArea.radiusX + existingSeed.seedArea.radiusY) * 0.35)
                );
                return getPointDistance(candidate.seedPoint, existingSeed.seedPoint) >= minimumDistance;
            });

            if (!isFarEnough) {
                return;
            }

            const basinSeedIndex = accepted.length + 1;
            const basinSeedId = `basin_seed_${String(basinSeedIndex).padStart(2, '0')}`;
            const candidateNamespace = buildNamespace(PIPELINE_STEP_ID, 'basinSeeds', `seed${String(basinSeedIndex).padStart(2, '0')}`);
            const areaJitter = 0.95 + (rng.nextFloat() * 0.1);
            const jitteredArea = buildSeedArea(
                candidate.seedPoint,
                Math.max(1, Math.round(candidate.seedArea.radiusX * areaJitter)),
                Math.max(1, Math.round(candidate.seedArea.radiusY * areaJitter)),
                normalizedWorldBounds
            );

            accepted.push({
                basinSeedId,
                sourceKind: candidate.sourceKind,
                sourceBoundaryId: candidate.sourceBoundaryId,
                sourcePlateIds: candidate.sourcePlateIds.slice(),
                seedPoint: cloneValue(candidate.seedPoint),
                normalizedPoint: cloneValue(candidate.normalizedPoint),
                seedArea: jitteredArea,
                basinSeedStrength: candidate.basinSeedStrength,
                basinRetentionBias: candidate.basinRetentionBias,
                basinTypeHint: candidate.basinTypeHint,
                sourceSignals: cloneValue(candidate.sourceSignals),
                namespace: candidateNamespace,
                seed: deriveSubSeed(macroSeed, candidateNamespace)
            });
        });

        if (!accepted.length && Array.isArray(candidates) && candidates.length) {
            const fallbackCandidate = candidates[0];
            const basinSeedId = 'basin_seed_01';
            const candidateNamespace = buildNamespace(PIPELINE_STEP_ID, 'basinSeeds', 'seed01');
            accepted.push({
                basinSeedId,
                sourceKind: fallbackCandidate.sourceKind,
                sourceBoundaryId: fallbackCandidate.sourceBoundaryId,
                sourcePlateIds: fallbackCandidate.sourcePlateIds.slice(),
                seedPoint: cloneValue(fallbackCandidate.seedPoint),
                normalizedPoint: cloneValue(fallbackCandidate.normalizedPoint),
                seedArea: cloneValue(fallbackCandidate.seedArea),
                basinSeedStrength: fallbackCandidate.basinSeedStrength,
                basinRetentionBias: fallbackCandidate.basinRetentionBias,
                basinTypeHint: fallbackCandidate.basinTypeHint,
                sourceSignals: cloneValue(fallbackCandidate.sourceSignals),
                namespace: candidateNamespace,
                seed: deriveSubSeed(macroSeed, candidateNamespace)
            });
        }

        return {
            basinSeeds: accepted,
            selectionParameters: {
                minStrength: DEFAULT_BASIN_SEED_MIN_STRENGTH,
                minSpacing: roundMotionValue(minSpacing),
                maxSeedCount
            },
            candidateCount: Array.isArray(candidates) ? candidates.length : 0
        };
    }

    function buildRidgeLineCandidates(boundaryClassifications, worldBounds, sourceFields, macroSeed) {
        const normalizedWorldBounds = isPlainObject(worldBounds)
            ? cloneValue(worldBounds)
            : cloneValue(DEFAULT_WORLD_BOUNDS);
        const directionField = createDirectionalFieldStorage('ridgeDirectionField', normalizedWorldBounds, {
            defaultDirection: {
                x: 0,
                y: 0
            }
        });
        const strengthTracker = createStrengthTracker(normalizedWorldBounds);
        const influenceRadiusBase = getRidgeInfluenceRadius(normalizedWorldBounds);
        const ridgeLines = [];
        const upliftField = sourceFields.upliftField || null;
        const subsidenceField = sourceFields.subsidenceField || null;
        const fractureField = sourceFields.fractureMaskField || null;
        const width = normalizeInteger(normalizedWorldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(normalizedWorldBounds.height, DEFAULT_WORLD_BOUNDS.height);

        (Array.isArray(boundaryClassifications) ? boundaryClassifications : []).forEach((boundary, boundaryIndex) => {
            if (!boundary || !Array.isArray(boundary.plateIds) || boundary.plateIds.length < 2) {
                return;
            }

            const startPoint = getBoundarySeedPoint(boundary, boundary.plateIds[0]);
            const endPoint = getBoundarySeedPoint(boundary, boundary.plateIds[1]);
            const midpoint = {
                x: Math.round((startPoint.x + endPoint.x) / 2),
                y: Math.round((startPoint.y + endPoint.y) / 2)
            };
            const upliftPotential = getBoundaryUpliftPotential(boundary);
            const fracturePotential = getBoundaryFracturePotential(boundary);
            const subsidencePotential = getBoundarySubsidencePotential(boundary);
            const sampledUplift = readSerializedScalarFieldValue(upliftField, midpoint, upliftPotential);
            const sampledSubsidence = readSerializedScalarFieldValue(subsidenceField, midpoint, subsidencePotential);
            const sampledFracture = readSerializedScalarFieldValue(fractureField, midpoint, fracturePotential);
            const boundaryTypeBonus = boundary.boundaryType === 'collision'
                ? 0.12
                : (boundary.boundaryType === 'transform' ? 0.03 : -0.08);
            const ridgeStrength = clampUnitInterval(
                (upliftPotential * 0.52)
                + (sampledUplift * 0.28)
                + (fracturePotential * 0.08)
                + (sampledFracture * 0.16)
                + boundaryTypeBonus
                - (sampledSubsidence * 0.22),
                0
            );

            if (ridgeStrength < DEFAULT_RIDGE_STRENGTH_THRESHOLD) {
                return;
            }

            const boundaryVector = normalizeVector(boundary.boundaryVector);
            const orientationVector = canonicalizeDirection({
                x: -boundaryVector.y,
                y: boundaryVector.x
            });
            if (orientationVector.x === 0 && orientationVector.y === 0) {
                return;
            }

            const influenceRadius = Math.max(
                1,
                Math.round(influenceRadiusBase * (0.85 + ridgeStrength))
            );
            const minX = Math.max(0, Math.floor(Math.min(startPoint.x, endPoint.x) - influenceRadius));
            const maxX = Math.min(width - 1, Math.ceil(Math.max(startPoint.x, endPoint.x) + influenceRadius));
            const minY = Math.max(0, Math.floor(Math.min(startPoint.y, endPoint.y) - influenceRadius));
            const maxY = Math.min(height - 1, Math.ceil(Math.max(startPoint.y, endPoint.y) + influenceRadius));

            for (let y = minY; y <= maxY; y += 1) {
                for (let x = minX; x <= maxX; x += 1) {
                    const distance = getDistanceToSegment(
                        {
                            x,
                            y
                        },
                        startPoint,
                        endPoint
                    );
                    const falloff = Math.max(0, 1 - (distance / influenceRadius));
                    if (falloff <= 0) {
                        continue;
                    }

                    writeDirectionalFieldValue(
                        directionField,
                        strengthTracker,
                        x,
                        y,
                        orientationVector,
                        ridgeStrength * falloff * falloff
                    );
                }
            }

            const ridgeIndex = ridgeLines.length + 1;
            const ridgeNamespace = buildNamespace(PIPELINE_STEP_ID, 'ridgeDirection', `ridge${String(ridgeIndex).padStart(2, '0')}`);
            ridgeLines.push({
                ridgeLineId: `ridge_${String(ridgeIndex).padStart(2, '0')}`,
                boundaryId: normalizeString(boundary.boundaryId, `boundary_${boundaryIndex + 1}`),
                plateIds: boundary.plateIds.slice(),
                sourceBoundaryType: normalizeString(boundary.boundaryType, 'collision'),
                startPoint,
                endPoint,
                normalizedStartPoint: buildNormalizedPoint(startPoint, normalizedWorldBounds),
                normalizedEndPoint: buildNormalizedPoint(endPoint, normalizedWorldBounds),
                orientationVector,
                ridgeStrength: roundMotionValue(ridgeStrength),
                ridgeLength: roundMotionValue(getPointDistance(startPoint, endPoint)),
                influenceRadius: roundMotionValue(influenceRadius),
                mountainAmplificationBias: roundMotionValue(clampUnitInterval(
                    ridgeStrength + (sampledUplift * 0.15) + (sampledFracture * 0.05),
                    0
                )),
                sourceSignals: {
                    upliftPotential: roundMotionValue(upliftPotential),
                    sampledUplift: roundMotionValue(sampledUplift),
                    sampledSubsidence: roundMotionValue(sampledSubsidence),
                    fracturePotential: roundMotionValue(fracturePotential),
                    sampledFracture: roundMotionValue(sampledFracture)
                },
                namespace: ridgeNamespace,
                seed: deriveSubSeed(macroSeed, ridgeNamespace)
            });
        });

        return {
            directionField,
            ridgeLines,
            influenceRadiusBase: roundMotionValue(influenceRadiusBase),
            threshold: DEFAULT_RIDGE_STRENGTH_THRESHOLD
        };
    }

    function generateRidgeDirectionField(input = {}) {
        const normalizedInput = normalizeInput(input);
        const plateSeedDistribution = resolvePlateSeedDistribution(input, normalizedInput);
        const plateMotionVectors = resolvePlateMotionVectors(input, normalizedInput, plateSeedDistribution);
        const plateBoundaryClassification = resolvePlateBoundaryClassification(input, normalizedInput, {
            plateSeedDistribution,
            plateMotionVectors
        });
        const upliftField = resolveUpliftFieldForCompatibility(input) || generateUpliftField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification
        });
        const subsidenceField = resolveSubsidenceFieldForCompatibility(input) || generateSubsidenceField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField
        });
        const fractureMaskField = resolveFractureFieldForCompatibility(input) || generateFractureField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField
        });
        const worldBounds = isPlainObject(plateBoundaryClassification.worldBounds)
            ? cloneValue(plateBoundaryClassification.worldBounds)
            : cloneValue(normalizedInput.worldBounds);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'ridgeDirection');
        const ridgeArtifacts = buildRidgeLineCandidates(
            plateBoundaryClassification.boundaryClassifications,
            worldBounds,
            {
                upliftField,
                subsidenceField,
                fractureMaskField
            },
            normalizedInput.macroSeed
        );

        return serializeDirectionalField(ridgeArtifacts.directionField, {
            stageId: 'ridgeLineSynthesis',
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'plateBoundaryClassification.boundaryClassifications',
                'upliftField.values',
                'subsidenceField.values',
                'fractureMaskField.values'
            ],
            namespace,
            seed: deriveSubSeed(normalizedInput.macroSeed, namespace),
            sourceClassificationId: normalizeString(
                plateBoundaryClassification.classificationId,
                'plateBoundaryClassification'
            ),
            worldBounds,
            generationModel: 'tectonicRidgeLineSynthesisV1',
            ridgeLineCount: ridgeArtifacts.ridgeLines.length,
            ridgeLines: ridgeArtifacts.ridgeLines,
            synthesisParameters: {
                influenceRadiusBase: ridgeArtifacts.influenceRadiusBase,
                ridgeStrengthThreshold: ridgeArtifacts.threshold,
                lineOrientation: 'boundaryTangent'
            },
            compatibility: buildRidgeDirectionCompatibility({
                ...input,
                upliftField,
                subsidenceField,
                fractureMaskField
            }, worldBounds),
            intentionallyAbsent: [
                'basinRegions',
                'elevationComposite',
                'mountainSystems',
                'climateEffects'
            ]
        }, {
            vectorEncoding: RIDGE_DIRECTION_FIELD_VECTOR_ENCODING
        });
    }

    function generateBasinSeeds(input = {}) {
        const normalizedInput = normalizeInput(input);
        const plateSeedDistribution = resolvePlateSeedDistribution(input, normalizedInput);
        const plateMotionVectors = resolvePlateMotionVectors(input, normalizedInput, plateSeedDistribution);
        const plateBoundaryClassification = resolvePlateBoundaryClassification(input, normalizedInput, {
            plateSeedDistribution,
            plateMotionVectors
        });
        const upliftField = resolveUpliftFieldForCompatibility(input) || generateUpliftField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification
        });
        const subsidenceField = resolveSubsidenceFieldForCompatibility(input) || generateSubsidenceField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField
        });
        const fractureMaskField = resolveFractureFieldForCompatibility(input) || generateFractureField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField
        });
        const ridgeDirectionField = resolveRidgeDirectionFieldForCompatibility(input) || generateRidgeDirectionField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField
        });
        const worldBounds = isPlainObject(plateBoundaryClassification.worldBounds)
            ? cloneValue(plateBoundaryClassification.worldBounds)
            : cloneValue(normalizedInput.worldBounds);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'basinSeeds');
        const candidates = buildBasinSeedCandidates(worldBounds, {
            plateSeedDistribution,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField,
            ridgeDirectionField
        }, normalizedInput.macroSeed);
        const selection = selectBasinSeeds(
            candidates,
            worldBounds,
            normalizeInteger(plateSeedDistribution.plateCount, 0),
            normalizedInput.macroSeed
        );

        return {
            basinSeedSetId: 'basinSeeds',
            stageId: 'basinSeedPlacement',
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'plateSeedDistribution.plateSeeds',
                'plateBoundaryClassification.boundaryClassifications',
                'upliftField.values',
                'subsidenceField.values',
                'fractureMaskField.values',
                'ridgeDirectionField.xValues',
                'ridgeDirectionField.yValues'
            ],
            namespace,
            seed: deriveSubSeed(normalizedInput.macroSeed, namespace),
            sourceClassificationId: normalizeString(
                plateBoundaryClassification.classificationId,
                'plateBoundaryClassification'
            ),
            worldBounds,
            basinSeedCount: selection.basinSeeds.length,
            candidateCount: selection.candidateCount,
            selectionModel: 'tectonicBasinSeedSelectionV1',
            selectionParameters: selection.selectionParameters,
            compatibility: buildBasinSeedCompatibility({
                ...input,
                upliftField,
                subsidenceField,
                fractureMaskField,
                ridgeDirectionField
            }, worldBounds),
            intentionallyAbsent: [
                'continentBodies',
                'hydrologyRouting',
                'basinRegions',
                'climateEffects'
            ],
            basinSeeds: selection.basinSeeds
        };
    }

    function getPlateClassPriority(plateClass) {
        switch (normalizeString(plateClass, '')) {
        case 'continental':
            return 3;
        case 'mixed':
            return 2;
        case 'oceanic':
            return 1;
        default:
            return 0;
        }
    }

    function chooseArcCarrier(boundary, midpoint) {
        const plateIds = Array.isArray(boundary && boundary.plateIds) ? boundary.plateIds : [];
        const classMap = isPlainObject(boundary && boundary.plateClasses) ? boundary.plateClasses : {};
        const normalizedMidpoint = normalizePoint(midpoint);
        const fallbackVector = normalizeUnitVector(boundary && boundary.boundaryVector, { x: 1, y: 0 });
        const tangentialComponent = Number(boundary && boundary.relativeMotion && boundary.relativeMotion.tangentialComponent);
        const fallbackSign = Number.isFinite(tangentialComponent) && tangentialComponent < 0 ? -1 : 1;
        let carrierPlateId = plateIds[0] || '';

        plateIds.forEach((plateId) => {
            const currentPriority = getPlateClassPriority(classMap[plateId]);
            const bestPriority = getPlateClassPriority(classMap[carrierPlateId]);
            if (currentPriority > bestPriority) {
                carrierPlateId = plateId;
                return;
            }

            if (currentPriority === bestPriority && plateId) {
                carrierPlateId = fallbackSign > 0
                    ? [carrierPlateId, plateId].sort()[0]
                    : [carrierPlateId, plateId].sort().slice(-1)[0];
            }
        });

        const carrierPoint = getBoundarySeedPoint(boundary, carrierPlateId);
        const bowVector = normalizeUnitVector({
            x: carrierPoint.x - normalizedMidpoint.x,
            y: carrierPoint.y - normalizedMidpoint.y
        }, {
            x: fallbackVector.x * fallbackSign,
            y: fallbackVector.y * fallbackSign
        });

        return {
            carrierPlateId,
            carrierPlateClass: normalizeString(classMap[carrierPlateId], 'mixed'),
            bowVector
        };
    }

    function buildArcFormationCompatibility(input, worldBounds) {
        const ridgeDirectionField = resolveRidgeDirectionFieldForCompatibility(input);
        const fractureField = resolveFractureFieldForCompatibility(input);
        const upliftField = resolveUpliftFieldForCompatibility(input);
        const subsidenceField = resolveSubsidenceFieldForCompatibility(input);

        return {
            ridgeDirectionFieldId: normalizeString(ridgeDirectionField && ridgeDirectionField.fieldId, 'ridgeDirectionField'),
            fractureFieldId: normalizeString(fractureField && fractureField.fieldId, 'fractureMaskField'),
            upliftFieldId: normalizeString(upliftField && upliftField.fieldId, 'upliftField'),
            subsidenceFieldId: normalizeString(subsidenceField && subsidenceField.fieldId, 'subsidenceField'),
            futureVolcanicArcInput: true,
            futureVolcanicZoneSourceType: 'arc',
            sameWorldBoundsRequired: true,
            sameWorldBounds: {
                ridgeDirectionField: compareFieldWorldBounds(ridgeDirectionField, worldBounds),
                fractureField: compareFieldWorldBounds(fractureField, worldBounds),
                upliftField: compareFieldWorldBounds(upliftField, worldBounds),
                subsidenceField: compareFieldWorldBounds(subsidenceField, worldBounds)
            },
            note: 'Helper metadata only; volcanic zones, tectonic composite, and ocean carving remain intentionally unbuilt in this microstep.'
        };
    }

    function buildHotspotVolcanicSeedCompatibility(sourceInputs, worldBounds) {
        const plateMotionVectors = isPlainObject(sourceInputs.plateMotionVectors)
            ? sourceInputs.plateMotionVectors
            : null;
        const arcFormationHelper = isPlainObject(sourceInputs.arcFormationHelper)
            ? sourceInputs.arcFormationHelper
            : null;
        const upliftField = isPlainObject(sourceInputs.upliftField)
            ? sourceInputs.upliftField
            : null;
        const subsidenceField = isPlainObject(sourceInputs.subsidenceField)
            ? sourceInputs.subsidenceField
            : null;
        const fractureMaskField = isPlainObject(sourceInputs.fractureMaskField)
            ? sourceInputs.fractureMaskField
            : null;
        const ridgeDirectionField = isPlainObject(sourceInputs.ridgeDirectionField)
            ? sourceInputs.ridgeDirectionField
            : null;

        return {
            plateMotionVectorSetId: normalizeString(
                plateMotionVectors && plateMotionVectors.vectorSetId,
                'plateMotionVectors'
            ),
            arcFormationHelperId: normalizeString(
                arcFormationHelper && arcFormationHelper.arcHelperId,
                'arcFormationHelper'
            ),
            futureVolcanicZoneInput: true,
            futureVolcanicZoneSourceType: 'hotspot',
            supportsTrailChains: true,
            sameWorldBoundsRequired: true,
            sameWorldBounds: {
                plateMotionVectors: compareFieldWorldBounds(plateMotionVectors, worldBounds),
                arcFormationHelper: compareFieldWorldBounds(arcFormationHelper, worldBounds),
                upliftField: compareFieldWorldBounds(upliftField, worldBounds),
                subsidenceField: compareFieldWorldBounds(subsidenceField, worldBounds),
                fractureMaskField: compareFieldWorldBounds(fractureMaskField, worldBounds),
                ridgeDirectionField: compareFieldWorldBounds(ridgeDirectionField, worldBounds)
            },
            note: 'Helper metadata only; hotspot seeds feed future volcanic-zone extraction and remain separate from actual volcanic zones or geology/resource logic.'
        };
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

        const normalizedPoint = normalizePoint(point);
        let strongestInfluence = 0;

        basinSeeds.forEach((basinSeed) => {
            const seedPoint = normalizePoint(basinSeed && basinSeed.seedPoint);
            const radius = getSeedAreaRadius(basinSeed && basinSeed.seedArea, worldBounds);
            const distance = getPointDistance(normalizedPoint, seedPoint);
            const falloff = Math.max(0, 1 - (distance / Math.max(1, radius)));
            if (falloff <= 0) {
                return;
            }

            const influence = clampUnitInterval(
                clampUnitInterval(basinSeed && basinSeed.basinSeedStrength, 0)
                * falloff
                * falloff,
                0
            );
            strongestInfluence = Math.max(strongestInfluence, influence);
        });

        return roundMotionValue(strongestInfluence);
    }

    function readArcGuideInfluenceAtPoint(arcFormationHelper, point, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const arcGuides = Array.isArray(arcFormationHelper && arcFormationHelper.arcGuides)
            ? arcFormationHelper.arcGuides
            : [];
        if (!arcGuides.length) {
            return 0;
        }

        const normalizedPoint = normalizePoint(point);
        const shortestAxis = Math.max(1, Math.min(worldBounds.width, worldBounds.height));
        let strongestInfluence = 0;

        arcGuides.forEach((guide) => {
            const guidePoints = Array.isArray(guide && guide.curveSamples) && guide.curveSamples.length >= 2
                ? guide.curveSamples
                : [guide && guide.startPoint, guide && guide.apexPoint, guide && guide.endPoint]
                    .filter((candidatePoint) => isPlainObject(candidatePoint));
            if (guidePoints.length < 2) {
                return;
            }

            const influenceRadius = Math.max(
                2,
                Number(guide && guide.guideArea && guide.guideArea.influenceRadius)
                || Math.round(shortestAxis * DEFAULT_ARC_APEX_OFFSET_RATIO)
            );
            let minDistance = Number.POSITIVE_INFINITY;

            for (let index = 0; index < guidePoints.length - 1; index += 1) {
                minDistance = Math.min(
                    minDistance,
                    getDistanceToSegment(
                        normalizedPoint,
                        normalizePoint(guidePoints[index]),
                        normalizePoint(guidePoints[index + 1])
                    )
                );
            }

            const falloff = Math.max(0, 1 - (minDistance / influenceRadius));
            if (falloff <= 0) {
                return;
            }

            const strength = clampUnitInterval(
                (clampUnitInterval(guide && guide.arcStrength, 0) * 0.82)
                + (clampUnitInterval(guide && guide.volcanicArcBias, 0) * 0.18),
                0
            );
            strongestInfluence = Math.max(strongestInfluence, strength * falloff * falloff);
        });

        return roundMotionValue(strongestInfluence);
    }

    function readHotspotSeedInfluenceAtPoint(hotspotVolcanicSeedHelper, point, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const hotspotSeeds = Array.isArray(hotspotVolcanicSeedHelper && hotspotVolcanicSeedHelper.hotspotSeeds)
            ? hotspotVolcanicSeedHelper.hotspotSeeds
            : [];
        if (!hotspotSeeds.length) {
            return 0;
        }

        const normalizedPoint = normalizePoint(point);
        let strongestInfluence = 0;

        hotspotSeeds.forEach((hotspotSeed) => {
            const trailSamples = Array.isArray(hotspotSeed && hotspotSeed.trailSamples) && hotspotSeed.trailSamples.length >= 2
                ? hotspotSeed.trailSamples
                : [hotspotSeed && hotspotSeed.seedPoint].filter((candidatePoint) => isPlainObject(candidatePoint));
            const influenceRadius = Math.max(
                2,
                Number(hotspotSeed && hotspotSeed.seedArea && hotspotSeed.seedArea.influenceRadius)
                || getSeedAreaRadius(hotspotSeed && hotspotSeed.seedArea, worldBounds)
            );
            let minDistance = Number.POSITIVE_INFINITY;

            if (trailSamples.length === 1) {
                minDistance = getPointDistance(normalizedPoint, normalizePoint(trailSamples[0]));
            } else {
                for (let index = 0; index < trailSamples.length - 1; index += 1) {
                    minDistance = Math.min(
                        minDistance,
                        getDistanceToSegment(
                            normalizedPoint,
                            normalizePoint(trailSamples[index]),
                            normalizePoint(trailSamples[index + 1])
                        )
                    );
                }
            }

            const falloff = Math.max(0, 1 - (minDistance / influenceRadius));
            if (falloff <= 0) {
                return;
            }

            const strength = clampUnitInterval(
                (clampUnitInterval(hotspotSeed && hotspotSeed.hotspotStrength, 0) * 0.76)
                + (clampUnitInterval(hotspotSeed && hotspotSeed.volcanicZoneBias, 0) * 0.24),
                0
            );
            strongestInfluence = Math.max(strongestInfluence, strength * falloff * falloff);
        });

        return roundMotionValue(strongestInfluence);
    }

    function readMountainBeltCandidateInfluenceAtPoint(mountainBeltCandidateSet, point, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const candidates = Array.isArray(mountainBeltCandidateSet && mountainBeltCandidateSet.mountainBeltCandidates)
            ? mountainBeltCandidateSet.mountainBeltCandidates
            : [];
        if (!candidates.length) {
            return 0;
        }

        const normalizedPoint = normalizePoint(point);
        let strongestInfluence = 0;

        candidates.forEach((candidate) => {
            const candidateArea = isPlainObject(candidate && candidate.candidateArea)
                ? candidate.candidateArea
                : {};
            const centerPoint = isPlainObject(candidateArea.centerPoint)
                ? normalizePoint(candidateArea.centerPoint)
                : normalizePoint({
                    x: Math.round((worldBounds.width - 1) / 2),
                    y: Math.round((worldBounds.height - 1) / 2)
                });
            const areaRadius = Math.max(
                2,
                normalizeInteger(candidateArea.radiusX, 1),
                normalizeInteger(candidateArea.radiusY, 1)
            );
            const spineStartPoint = isPlainObject(candidate && candidate.spineStartPoint)
                ? normalizePoint(candidate.spineStartPoint)
                : centerPoint;
            const spineEndPoint = isPlainObject(candidate && candidate.spineEndPoint)
                ? normalizePoint(candidate.spineEndPoint)
                : centerPoint;
            const distanceToSpine = getDistanceToSegment(normalizedPoint, spineStartPoint, spineEndPoint);
            const distanceToCenter = getPointDistance(normalizedPoint, centerPoint);
            const distance = Math.min(distanceToSpine, distanceToCenter);
            const influenceRadius = Math.max(areaRadius * 1.35, 2);
            const falloff = Math.max(0, 1 - (distance / influenceRadius));
            if (falloff <= 0) {
                return;
            }

            const candidateStrength = clampUnitInterval(candidate && candidate.candidateStrength, 0);
            const amplificationBias = clampUnitInterval(candidate && candidate.mountainAmplificationBias, 0);
            const influence = clampUnitInterval(
                ((candidateStrength * 0.7) + (amplificationBias * 0.3))
                * falloff
                * falloff,
                0
            );
            strongestInfluence = Math.max(strongestInfluence, influence);
        });

        return roundMotionValue(strongestInfluence);
    }

    function createSerializedScalarFieldDebugAdapter(serializedField = {}) {
        const fieldId = normalizeString(serializedField.fieldId, 'scalarField');
        const width = normalizeInteger(serializedField.width, 0);
        const height = normalizeInteger(serializedField.height, 0);
        const size = normalizeInteger(serializedField.size, width * height);
        const values = Array.isArray(serializedField.values)
            ? serializedField.values.slice()
            : new Array(size).fill(0);
        const range = Array.isArray(serializedField.range)
            ? serializedField.range.slice(0, 2)
            : DEFAULT_TECTONIC_SCALAR_FIELD_RANGE.slice();

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

    function createSerializedDirectionalFieldDebugAdapter(serializedField = {}) {
        const fieldId = normalizeString(serializedField.fieldId, 'directionalField');
        const width = normalizeInteger(serializedField.width, 0);
        const height = normalizeInteger(serializedField.height, 0);
        const size = normalizeInteger(serializedField.size, width * height);
        const xValues = Array.isArray(serializedField.xValues)
            ? serializedField.xValues.slice()
            : new Array(size).fill(0);
        const yValues = Array.isArray(serializedField.yValues)
            ? serializedField.yValues.slice()
            : new Array(size).fill(0);

        return {
            type: 'DirectionalField',
            fieldId,
            width,
            height,
            size,
            read(x, y, fallback = { x: 0, y: 0 }) {
                if (width <= 0 || height <= 0) {
                    return normalizeVector(fallback);
                }

                const normalizedX = clampGridCoordinate(x, width);
                const normalizedY = clampGridCoordinate(y, height);
                const index = (normalizedY * width) + normalizedX;
                return {
                    x: Number.isFinite(xValues[index]) ? xValues[index] : fallback.x,
                    y: Number.isFinite(yValues[index]) ? yValues[index] : fallback.y
                };
            },
            describe() {
                return {
                    type: 'DirectionalField',
                    fieldId,
                    width,
                    height,
                    size,
                    defaultDirection: {
                        x: 0,
                        y: 0
                    },
                    defaultSampleMode: 'nearest',
                    defaultEdgeMode: 'clamp'
                };
            }
        };
    }

    function materializeScalarInfluenceDebugField(field, worldBounds, influenceReader) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const nextValue = clampUnitInterval(influenceReader({ x, y }), 0);
                if (typeof field.write === 'function') {
                    field.write(x, y, nextValue);
                }
            }
        }

        return field;
    }

    function buildTectonicFieldSnapshots(input = {}) {
        if (typeof macro.buildFieldDebugArtifact !== 'function') {
            throw typeof macro.createTodoContractedError === 'function'
                ? macro.createTodoContractedError('tectonicSkeleton.buildTectonicFieldSnapshots')
                : new Error('[worldgen/macro] Missing field debug registry builder.');
        }

        const normalizedInput = normalizeInput(input);
        const plateSeedDistribution = resolvePlateSeedDistribution(input, normalizedInput);
        const plateMotionVectors = resolvePlateMotionVectors(input, normalizedInput, plateSeedDistribution);
        const plateBoundaryClassification = resolvePlateBoundaryClassification(input, normalizedInput, {
            plateSeedDistribution,
            plateMotionVectors
        });
        const upliftField = resolveUpliftFieldForCompatibility(input) || generateUpliftField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification
        });
        const subsidenceField = resolveSubsidenceFieldForCompatibility(input) || generateSubsidenceField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField
        });
        const fractureMaskField = resolveFractureFieldForCompatibility(input) || generateFractureField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField
        });
        const ridgeDirectionField = resolveRidgeDirectionFieldForCompatibility(input) || generateRidgeDirectionField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField
        });
        const basinSeeds = resolveBasinSeedsForCompatibility(input) || generateBasinSeeds({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField,
            ridgeDirectionField
        });
        const arcFormationHelper = resolveArcFormationHelperForCompatibility(input) || generateArcFormationHelper({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField,
            ridgeDirectionField
        });
        const hotspotVolcanicSeedHelper = isPlainObject(input.hotspotVolcanicSeedHelper)
            ? cloneValue(input.hotspotVolcanicSeedHelper)
            : (
                isPlainObject(input.intermediateOutputs)
                && isPlainObject(input.intermediateOutputs.hotspotVolcanicSeedHelper)
            )
                ? cloneValue(input.intermediateOutputs.hotspotVolcanicSeedHelper)
                : (
                    isPlainObject(input.outputs)
                    && isPlainObject(input.outputs.intermediateOutputs)
                    && isPlainObject(input.outputs.intermediateOutputs.hotspotVolcanicSeedHelper)
                )
                    ? cloneValue(input.outputs.intermediateOutputs.hotspotVolcanicSeedHelper)
                    : generateHotspotVolcanicSeedHelper({
                        ...normalizedInput,
                        plateSeedDistribution,
                        plateMotionVectors,
                        plateBoundaryClassification,
                        upliftField,
                        subsidenceField,
                        fractureMaskField,
                        ridgeDirectionField,
                        arcFormationHelper
                    });
        const platePressureField = isPlainObject(input.platePressureField)
            ? cloneValue(input.platePressureField)
            : (
                isPlainObject(input.fields)
                && isPlainObject(input.fields.platePressureField)
            )
                ? cloneValue(input.fields.platePressureField)
                : (
                    isPlainObject(input.outputs)
                    && isPlainObject(input.outputs.fields)
                    && isPlainObject(input.outputs.fields.platePressureField)
                )
                    ? cloneValue(input.outputs.fields.platePressureField)
                    : generatePlatePressureField({
                        ...normalizedInput,
                        plateSeedDistribution,
                        plateMotionVectors,
                        plateBoundaryClassification,
                        upliftField,
                        subsidenceField,
                        fractureMaskField,
                        ridgeDirectionField,
                        basinSeeds,
                        arcFormationHelper
                    });
        const worldBounds = isPlainObject(upliftField.worldBounds)
            ? cloneValue(upliftField.worldBounds)
            : cloneValue(normalizedInput.worldBounds);
        const basinSeedInfluenceField = createScalarFieldStorage('basinSeedInfluenceField', worldBounds, {
            range: DEFAULT_TECTONIC_SCALAR_FIELD_RANGE
        });
        materializeScalarInfluenceDebugField(
            basinSeedInfluenceField,
            worldBounds,
            (point) => readBasinSeedInfluenceAtPoint(basinSeeds, point, worldBounds)
        );
        const arcFormationInfluenceField = createScalarFieldStorage('arcFormationInfluenceField', worldBounds, {
            range: DEFAULT_TECTONIC_SCALAR_FIELD_RANGE
        });
        materializeScalarInfluenceDebugField(
            arcFormationInfluenceField,
            worldBounds,
            (point) => readArcGuideInfluenceAtPoint(arcFormationHelper, point, worldBounds)
        );
        const hotspotVolcanicSeedInfluenceField = createScalarFieldStorage('hotspotVolcanicSeedInfluenceField', worldBounds, {
            range: DEFAULT_TECTONIC_SCALAR_FIELD_RANGE
        });
        materializeScalarInfluenceDebugField(
            hotspotVolcanicSeedInfluenceField,
            worldBounds,
            (point) => readHotspotSeedInfluenceAtPoint(hotspotVolcanicSeedHelper, point, worldBounds)
        );

        const snapshotSpecs = [
            {
                field: createSerializedScalarFieldDebugAdapter(upliftField),
                layerId: 'scalarHeatmap',
                artifactId: 'tectonic.upliftField.scalarHeatmap',
                stageId: normalizeString(upliftField.stageId, 'upliftField'),
                sourceLayerId: 'upliftField'
            },
            {
                field: createSerializedScalarFieldDebugAdapter(subsidenceField),
                layerId: 'scalarHeatmap',
                artifactId: 'tectonic.subsidenceField.scalarHeatmap',
                stageId: normalizeString(subsidenceField.stageId, 'subsidenceField'),
                sourceLayerId: 'subsidenceField'
            },
            {
                field: createSerializedScalarFieldDebugAdapter(fractureMaskField),
                layerId: 'scalarHeatmap',
                artifactId: 'tectonic.fractureMaskField.scalarHeatmap',
                stageId: normalizeString(fractureMaskField.stageId, 'fractureField'),
                sourceLayerId: 'fractureMaskField'
            },
            {
                field: createSerializedDirectionalFieldDebugAdapter(ridgeDirectionField),
                layerId: 'directionalVectors',
                artifactId: 'tectonic.ridgeDirectionField.directionalVectors',
                stageId: normalizeString(ridgeDirectionField.stageId, 'ridgeLineSynthesis'),
                sourceLayerId: 'ridgeDirectionField'
            },
            {
                field: createSerializedScalarFieldDebugAdapter(platePressureField),
                layerId: 'scalarHeatmap',
                artifactId: 'tectonic.platePressureField.scalarHeatmap',
                stageId: normalizeString(platePressureField.stageId, 'platePressureCompositeField'),
                sourceLayerId: 'platePressureField'
            },
            {
                field: basinSeedInfluenceField,
                layerId: 'scalarHeatmap',
                artifactId: 'tectonic.basinSeedInfluenceField.scalarHeatmap',
                stageId: 'tectonicDebugExport',
                sourceLayerId: 'basinSeeds'
            },
            {
                field: arcFormationInfluenceField,
                layerId: 'scalarHeatmap',
                artifactId: 'tectonic.arcFormationInfluenceField.scalarHeatmap',
                stageId: 'tectonicDebugExport',
                sourceLayerId: 'arcFormationHelper'
            },
            {
                field: hotspotVolcanicSeedInfluenceField,
                layerId: 'scalarHeatmap',
                artifactId: 'tectonic.hotspotVolcanicSeedInfluenceField.scalarHeatmap',
                stageId: 'tectonicDebugExport',
                sourceLayerId: 'hotspotVolcanicSeedHelper'
            }
        ];

        return snapshotSpecs.map((snapshotSpec) => macro.buildFieldDebugArtifact(
            snapshotSpec.field,
            {
                layerId: snapshotSpec.layerId,
                artifactId: snapshotSpec.artifactId,
                stageId: snapshotSpec.stageId,
                sourceLayerId: snapshotSpec.sourceLayerId
            }
        ));
    }

    function buildPlatePressureSourceFieldIds(sourceInputs) {
        return {
            upliftFieldId: normalizeString(sourceInputs.upliftField && sourceInputs.upliftField.fieldId, 'upliftField'),
            subsidenceFieldId: normalizeString(sourceInputs.subsidenceField && sourceInputs.subsidenceField.fieldId, 'subsidenceField'),
            fractureFieldId: normalizeString(sourceInputs.fractureMaskField && sourceInputs.fractureMaskField.fieldId, 'fractureMaskField'),
            ridgeDirectionFieldId: normalizeString(sourceInputs.ridgeDirectionField && sourceInputs.ridgeDirectionField.fieldId, 'ridgeDirectionField'),
            basinSeedSetId: normalizeString(sourceInputs.basinSeeds && sourceInputs.basinSeeds.basinSeedSetId, 'basinSeeds'),
            arcFormationHelperId: normalizeString(sourceInputs.arcFormationHelper && sourceInputs.arcFormationHelper.arcHelperId, 'arcFormationHelper')
        };
    }

    function buildPlatePressureCompatibility(sourceInputs, worldBounds) {
        return {
            upliftFieldId: normalizeString(sourceInputs.upliftField && sourceInputs.upliftField.fieldId, 'upliftField'),
            subsidenceFieldId: normalizeString(sourceInputs.subsidenceField && sourceInputs.subsidenceField.fieldId, 'subsidenceField'),
            fractureFieldId: normalizeString(sourceInputs.fractureMaskField && sourceInputs.fractureMaskField.fieldId, 'fractureMaskField'),
            ridgeDirectionFieldId: normalizeString(sourceInputs.ridgeDirectionField && sourceInputs.ridgeDirectionField.fieldId, 'ridgeDirectionField'),
            basinSeedSetId: normalizeString(sourceInputs.basinSeeds && sourceInputs.basinSeeds.basinSeedSetId, 'basinSeeds'),
            arcFormationHelperId: normalizeString(sourceInputs.arcFormationHelper && sourceInputs.arcFormationHelper.arcHelperId, 'arcFormationHelper'),
            futureLandTendencyInput: true,
            futureMountainAmplificationInput: true,
            futureReliefInput: true,
            sameWorldBoundsRequired: true,
            sameWorldBounds: {
                upliftField: compareFieldWorldBounds(sourceInputs.upliftField, worldBounds),
                subsidenceField: compareFieldWorldBounds(sourceInputs.subsidenceField, worldBounds),
                fractureField: compareFieldWorldBounds(sourceInputs.fractureMaskField, worldBounds),
                ridgeDirectionField: compareFieldWorldBounds(sourceInputs.ridgeDirectionField, worldBounds),
                basinSeeds: compareFieldWorldBounds(sourceInputs.basinSeeds, worldBounds),
                arcFormationHelper: compareFieldWorldBounds(sourceInputs.arcFormationHelper, worldBounds)
            },
            note: 'Compatibility metadata only; future land tendency, mountain amplification, and relief passes may consume this composite, but they are intentionally not built in this microstep.'
        };
    }

    function materializePlatePressureField(field, worldBounds, sourceInputs) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const upliftField = sourceInputs.upliftField || null;
        const subsidenceField = sourceInputs.subsidenceField || null;
        const fractureMaskField = sourceInputs.fractureMaskField || null;
        const ridgeDirectionField = sourceInputs.ridgeDirectionField || null;
        const basinSeeds = sourceInputs.basinSeeds || null;
        const arcFormationHelper = sourceInputs.arcFormationHelper || null;
        const componentWeights = {
            uplift: 0.44,
            fracture: 0.14,
            ridge: 0.16,
            arc: 0.18,
            subsidenceRelease: 0.18,
            basinRelease: 0.14
        };

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const point = { x, y };
                const uplift = readSerializedScalarFieldValue(upliftField, point, 0);
                const subsidence = readSerializedScalarFieldValue(subsidenceField, point, 0);
                const fracture = readSerializedScalarFieldValue(fractureMaskField, point, 0);
                const ridge = readSerializedDirectionalFieldMagnitude(ridgeDirectionField, point, 0);
                const basinRelease = readBasinSeedInfluenceAtPoint(basinSeeds, point, worldBounds);
                const arc = readArcGuideInfluenceAtPoint(arcFormationHelper, point, worldBounds);
                const compression = (
                    (uplift * componentWeights.uplift)
                    + (fracture * componentWeights.fracture)
                    + (ridge * componentWeights.ridge)
                    + (arc * componentWeights.arc)
                );
                const release = (
                    (subsidence * componentWeights.subsidenceRelease)
                    + (basinRelease * componentWeights.basinRelease)
                );
                writeMaxFieldValue(field, x, y, compression - release);
            }
        }

        return {
            componentWeights,
            releaseChannels: [
                'subsidenceField',
                'basinSeeds'
            ],
            concentrationChannels: [
                'upliftField',
                'fractureMaskField',
                'ridgeDirectionField',
                'arcFormationHelper'
            ]
        };
    }

    function buildMountainSystemRecordDraft(input = {}) {
        if (typeof macro.createMountainSystemRecordSkeleton === 'function') {
            return macro.createMountainSystemRecordSkeleton(input);
        }

        const normalizedInput = isPlainObject(input) ? input : {};
        return {
            mountainSystemId: normalizeString(normalizedInput.mountainSystemId, ''),
            systemType: normalizeString(normalizedInput.systemType, ''),
            plateIds: Array.isArray(normalizedInput.plateIds)
                ? normalizedInput.plateIds.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim())
                : [],
            reliefRegionIds: Array.isArray(normalizedInput.reliefRegionIds)
                ? normalizedInput.reliefRegionIds.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim())
                : [],
            primaryReliefRegionId: normalizeString(normalizedInput.primaryReliefRegionId, ''),
            spineOrientation: normalizeString(normalizedInput.spineOrientation, ''),
            upliftBias: clampUnitInterval(normalizedInput.upliftBias, 0),
            ridgeContinuity: clampUnitInterval(normalizedInput.ridgeContinuity, 0)
        };
    }

    function summarizeSpineOrientation(directionLike = {}) {
        const direction = normalizeUnitVector(directionLike, { x: 1, y: 0 });
        const absoluteX = Math.abs(direction.x);
        const absoluteY = Math.abs(direction.y);

        if (absoluteX >= 0.9238795325) {
            return 'east_west';
        }

        if (absoluteY >= 0.9238795325) {
            return 'north_south';
        }

        return (direction.x * direction.y) >= 0
            ? 'northwest_southeast'
            : 'northeast_southwest';
    }

    function computeMountainBeltArea(points, worldBounds = DEFAULT_WORLD_BOUNDS, padding = 0) {
        const normalizedPoints = (Array.isArray(points) ? points : [])
            .filter((point) => isPlainObject(point))
            .map((point) => normalizePoint(point));

        if (!normalizedPoints.length) {
            const centerPoint = {
                x: Math.max(0, Math.round((worldBounds.width - 1) / 2)),
                y: Math.max(0, Math.round((worldBounds.height - 1) / 2))
            };
            return {
                centerPoint,
                normalizedCenterPoint: buildNormalizedPoint(centerPoint, worldBounds),
                radiusX: 1,
                radiusY: 1
            };
        }

        const minX = Math.max(0, Math.min(...normalizedPoints.map((point) => point.x)) - padding);
        const maxX = Math.min(worldBounds.width - 1, Math.max(...normalizedPoints.map((point) => point.x)) + padding);
        const minY = Math.max(0, Math.min(...normalizedPoints.map((point) => point.y)) - padding);
        const maxY = Math.min(worldBounds.height - 1, Math.max(...normalizedPoints.map((point) => point.y)) + padding);
        const centerPoint = {
            x: Math.round((minX + maxX) / 2),
            y: Math.round((minY + maxY) / 2)
        };

        return {
            centerPoint,
            normalizedCenterPoint: buildNormalizedPoint(centerPoint, worldBounds),
            radiusX: Math.max(1, Math.round((maxX - minX) / 2)),
            radiusY: Math.max(1, Math.round((maxY - minY) / 2))
        };
    }

    function computeFarthestPointPair(points = []) {
        const normalizedPoints = (Array.isArray(points) ? points : [])
            .filter((point) => isPlainObject(point))
            .map((point) => normalizePoint(point));

        if (!normalizedPoints.length) {
            return {
                startPoint: { x: 0, y: 0 },
                endPoint: { x: 0, y: 0 },
                distance: 0
            };
        }

        let startPoint = normalizedPoints[0];
        let endPoint = normalizedPoints[0];
        let maxDistance = 0;

        for (let leftIndex = 0; leftIndex < normalizedPoints.length; leftIndex += 1) {
            for (let rightIndex = leftIndex + 1; rightIndex < normalizedPoints.length; rightIndex += 1) {
                const distance = getPointDistance(normalizedPoints[leftIndex], normalizedPoints[rightIndex]);
                if (distance > maxDistance) {
                    maxDistance = distance;
                    startPoint = normalizedPoints[leftIndex];
                    endPoint = normalizedPoints[rightIndex];
                }
            }
        }

        return {
            startPoint,
            endPoint,
            distance: roundMotionValue(maxDistance)
        };
    }

    function summarizeMountainSystemType(summary = {}) {
        const arcInfluenceBias = clampUnitInterval(summary.arcInfluenceBias, 0);
        const pressureBias = clampUnitInterval(summary.pressureBias, 0);
        const ridgeContinuity = clampUnitInterval(summary.ridgeContinuity, 0);
        const upliftBias = clampUnitInterval(summary.upliftBias, 0);
        const sourceBoundaryTypes = Array.isArray(summary.sourceBoundaryTypes)
            ? summary.sourceBoundaryTypes
            : [];

        if (arcInfluenceBias >= 0.58 && sourceBoundaryTypes.includes('collision')) {
            return 'volcanic_arc';
        }

        if (pressureBias >= 0.72 && upliftBias >= 0.68 && ridgeContinuity >= 0.62) {
            return 'highland_wall';
        }

        if (upliftBias >= 0.56 && ridgeContinuity >= 0.46) {
            return 'folded_range';
        }

        return 'broken_ridge';
    }

    function buildMountainBeltSourceFieldIds(sourceInputs) {
        return {
            ridgeDirectionFieldId: normalizeString(sourceInputs.ridgeDirectionField && sourceInputs.ridgeDirectionField.fieldId, 'ridgeDirectionField'),
            upliftFieldId: normalizeString(sourceInputs.upliftField && sourceInputs.upliftField.fieldId, 'upliftField'),
            subsidenceFieldId: normalizeString(sourceInputs.subsidenceField && sourceInputs.subsidenceField.fieldId, 'subsidenceField'),
            fractureFieldId: normalizeString(sourceInputs.fractureMaskField && sourceInputs.fractureMaskField.fieldId, 'fractureMaskField'),
            platePressureFieldId: normalizeString(sourceInputs.platePressureField && sourceInputs.platePressureField.fieldId, 'platePressureField'),
            arcFormationHelperId: normalizeString(sourceInputs.arcFormationHelper && sourceInputs.arcFormationHelper.arcHelperId, 'arcFormationHelper')
        };
    }

    function buildMountainBeltCompatibility(sourceInputs, worldBounds) {
        return {
            ridgeDirectionFieldId: normalizeString(sourceInputs.ridgeDirectionField && sourceInputs.ridgeDirectionField.fieldId, 'ridgeDirectionField'),
            platePressureFieldId: normalizeString(sourceInputs.platePressureField && sourceInputs.platePressureField.fieldId, 'platePressureField'),
            arcFormationHelperId: normalizeString(sourceInputs.arcFormationHelper && sourceInputs.arcFormationHelper.arcHelperId, 'arcFormationHelper'),
            futureMountainSystemRecordInput: true,
            futureMountainAmplificationInput: true,
            requiresReliefRegionLinkage: true,
            sameWorldBoundsRequired: true,
            sameWorldBounds: {
                ridgeDirectionField: compareFieldWorldBounds(sourceInputs.ridgeDirectionField, worldBounds),
                upliftField: compareFieldWorldBounds(sourceInputs.upliftField, worldBounds),
                subsidenceField: compareFieldWorldBounds(sourceInputs.subsidenceField, worldBounds),
                fractureMaskField: compareFieldWorldBounds(sourceInputs.fractureMaskField, worldBounds),
                platePressureField: compareFieldWorldBounds(sourceInputs.platePressureField, worldBounds),
                arcFormationHelper: compareFieldWorldBounds(sourceInputs.arcFormationHelper, worldBounds)
            },
            note: 'Candidate metadata only; MountainSystemRecord relief links, climate shadow, relief regions, and final elevation remain intentionally absent in this microstep.'
        };
    }

    function buildMountainBeltLineCandidates(worldBounds, sourceInputs) {
        const ridgeLines = Array.isArray(sourceInputs.ridgeDirectionField && sourceInputs.ridgeDirectionField.ridgeLines)
            ? sourceInputs.ridgeDirectionField.ridgeLines
            : [];
        const upliftField = sourceInputs.upliftField || null;
        const subsidenceField = sourceInputs.subsidenceField || null;
        const fractureMaskField = sourceInputs.fractureMaskField || null;
        const platePressureField = sourceInputs.platePressureField || null;
        const arcFormationHelper = sourceInputs.arcFormationHelper || null;
        const candidates = ridgeLines.map((ridgeLine, index) => {
            const startPoint = normalizePoint(ridgeLine.startPoint);
            const endPoint = normalizePoint(ridgeLine.endPoint);
            const midpoint = {
                x: Math.round((startPoint.x + endPoint.x) / 2),
                y: Math.round((startPoint.y + endPoint.y) / 2)
            };
            const sampledUplift = readSerializedScalarFieldValue(
                upliftField,
                midpoint,
                ridgeLine && ridgeLine.sourceSignals && ridgeLine.sourceSignals.sampledUplift
            );
            const sampledSubsidence = readSerializedScalarFieldValue(
                subsidenceField,
                midpoint,
                ridgeLine && ridgeLine.sourceSignals && ridgeLine.sourceSignals.sampledSubsidence
            );
            const sampledFracture = readSerializedScalarFieldValue(
                fractureMaskField,
                midpoint,
                ridgeLine && ridgeLine.sourceSignals && ridgeLine.sourceSignals.sampledFracture
            );
            const pressureBias = readSerializedScalarFieldValue(platePressureField, midpoint, 0);
            const arcInfluenceBias = readArcGuideInfluenceAtPoint(arcFormationHelper, midpoint, worldBounds);
            const mountainAmplificationBias = clampUnitInterval(ridgeLine.mountainAmplificationBias, 0);
            const ridgeStrength = clampUnitInterval(ridgeLine.ridgeStrength, 0);
            const candidateStrength = clampUnitInterval(
                (ridgeStrength * 0.32)
                + (mountainAmplificationBias * 0.22)
                + (pressureBias * 0.24)
                + (sampledUplift * 0.12)
                + (arcInfluenceBias * 0.1)
                - (sampledSubsidence * 0.08),
                0
            );

            return {
                sourceRidgeLineId: normalizeString(ridgeLine.ridgeLineId, `ridge_${String(index + 1).padStart(2, '0')}`),
                sourceBoundaryId: normalizeString(ridgeLine.boundaryId, ''),
                sourceBoundaryType: normalizeString(ridgeLine.sourceBoundaryType, 'collision'),
                plateIds: Array.isArray(ridgeLine.plateIds) ? ridgeLine.plateIds.slice() : [],
                startPoint,
                endPoint,
                midpoint,
                normalizedMidpoint: buildNormalizedPoint(midpoint, worldBounds),
                spineOrientation: summarizeSpineOrientation(ridgeLine.orientationVector),
                orientationVector: normalizeUnitVector(ridgeLine.orientationVector, { x: 1, y: 0 }),
                ridgeLength: Number.isFinite(ridgeLine.ridgeLength)
                    ? ridgeLine.ridgeLength
                    : roundMotionValue(getPointDistance(startPoint, endPoint)),
                influenceRadius: Number.isFinite(ridgeLine.influenceRadius)
                    ? ridgeLine.influenceRadius
                    : 0,
                ridgeStrength: roundMotionValue(ridgeStrength),
                mountainAmplificationBias: roundMotionValue(mountainAmplificationBias),
                upliftBias: roundMotionValue(sampledUplift),
                subsidenceBias: roundMotionValue(sampledSubsidence),
                fractureBias: roundMotionValue(sampledFracture),
                pressureBias: roundMotionValue(pressureBias),
                arcInfluenceBias: roundMotionValue(arcInfluenceBias),
                candidateStrength: roundMotionValue(candidateStrength)
            };
        });

        const selected = candidates.filter((candidate) => candidate.candidateStrength >= DEFAULT_MOUNTAIN_BELT_MIN_STRENGTH);
        if (selected.length) {
            return selected;
        }

        return candidates.length
            ? [candidates.slice().sort((left, right) => right.candidateStrength - left.candidateStrength)[0]]
            : [];
    }

    function averageClusterMetric(lines, fieldName) {
        const normalizedLines = Array.isArray(lines) ? lines : [];
        if (!normalizedLines.length) {
            return 0;
        }

        const total = normalizedLines.reduce((sum, line) => sum + clampUnitInterval(line && line[fieldName], 0), 0);
        return roundMotionValue(total / normalizedLines.length);
    }

    function shouldMergeMountainBeltCluster(cluster, candidate, clusterDistance) {
        if (!cluster || !candidate) {
            return false;
        }

        if (normalizeString(cluster.spineOrientation, '') !== normalizeString(candidate.spineOrientation, '')) {
            return false;
        }

        const clusterPlateIds = Array.isArray(cluster.plateIds) ? cluster.plateIds : [];
        const sharesPlate = (Array.isArray(candidate.plateIds) ? candidate.plateIds : []).some((plateId) => clusterPlateIds.includes(plateId));
        if (!sharesPlate) {
            return false;
        }

        return getPointDistance(cluster.centerPoint, candidate.midpoint) <= clusterDistance;
    }

    function finalizeMountainBeltCluster(cluster, worldBounds, macroSeed) {
        const lines = Array.isArray(cluster.lines) ? cluster.lines.slice() : [];
        const allPoints = lines.flatMap((line) => [line.startPoint, line.endPoint]);
        const farthestPair = computeFarthestPointPair(allPoints);
        const candidateArea = computeMountainBeltArea(
            allPoints,
            worldBounds,
            Math.max(1, Math.round(cluster.maxInfluenceRadius * 0.4))
        );
        const lineCount = Math.max(1, lines.length);
        const lengthWeight = clampUnitInterval(farthestPair.distance / Math.max(1, getWorldDiagonal(worldBounds)), 0);
        const ridgeContinuity = clampUnitInterval(
            (cluster.averageMountainAmplificationBias * 0.44)
            + (cluster.averageCandidateStrength * 0.24)
            + (Math.min(1, lineCount / 3) * 0.2)
            + (lengthWeight * 0.12),
            0
        );
        const upliftBias = clampUnitInterval(
            (cluster.averageUpliftBias * 0.5)
            + (cluster.averagePressureBias * 0.22)
            + (cluster.averageCandidateStrength * 0.16)
            + (cluster.averageArcInfluenceBias * 0.12),
            0
        );
        const candidateStrength = clampUnitInterval(
            (cluster.averageCandidateStrength * 0.46)
            + (cluster.averagePressureBias * 0.2)
            + (cluster.averageMountainAmplificationBias * 0.18)
            + (cluster.averageArcInfluenceBias * 0.1)
            + (lengthWeight * 0.06),
            0
        );
        const systemType = summarizeMountainSystemType({
            arcInfluenceBias: cluster.averageArcInfluenceBias,
            pressureBias: cluster.averagePressureBias,
            ridgeContinuity,
            upliftBias,
            sourceBoundaryTypes: cluster.sourceBoundaryTypes
        });
        const recordDraft = buildMountainSystemRecordDraft({
            mountainSystemId: cluster.recordId,
            systemType,
            plateIds: cluster.plateIds,
            reliefRegionIds: [],
            primaryReliefRegionId: '',
            spineOrientation: cluster.spineOrientation,
            upliftBias,
            ridgeContinuity
        });

        return {
            mountainBeltCandidateId: cluster.candidateId,
            recordDraft,
            pendingRecordFields: [
                'reliefRegionIds',
                'primaryReliefRegionId'
            ],
            sourceRidgeLineIds: cluster.sourceRidgeLineIds.slice(),
            sourceBoundaryIds: cluster.sourceBoundaryIds.slice(),
            sourceBoundaryTypes: cluster.sourceBoundaryTypes.slice(),
            plateIds: cluster.plateIds.slice(),
            spineStartPoint: farthestPair.startPoint,
            spineEndPoint: farthestPair.endPoint,
            normalizedStartPoint: buildNormalizedPoint(farthestPair.startPoint, worldBounds),
            normalizedEndPoint: buildNormalizedPoint(farthestPair.endPoint, worldBounds),
            spineLength: roundMotionValue(farthestPair.distance),
            candidateArea,
            candidateStrength: roundMotionValue(candidateStrength),
            mountainAmplificationBias: roundMotionValue(cluster.averageMountainAmplificationBias),
            pressureBias: roundMotionValue(cluster.averagePressureBias),
            arcInfluenceBias: roundMotionValue(cluster.averageArcInfluenceBias),
            sourceSignals: {
                lineCount,
                averageUpliftBias: roundMotionValue(cluster.averageUpliftBias),
                averageSubsidenceBias: roundMotionValue(cluster.averageSubsidenceBias),
                averageFractureBias: roundMotionValue(cluster.averageFractureBias),
                averagePressureBias: roundMotionValue(cluster.averagePressureBias),
                averageArcInfluenceBias: roundMotionValue(cluster.averageArcInfluenceBias),
                averageRidgeStrength: roundMotionValue(cluster.averageRidgeStrength)
            },
            namespace: cluster.namespace,
            seed: deriveSubSeed(macroSeed, cluster.namespace)
        };
    }

    function buildMountainBeltCandidates(worldBounds, sourceInputs, macroSeed) {
        const normalizedWorldBounds = isPlainObject(worldBounds)
            ? cloneValue(worldBounds)
            : cloneValue(DEFAULT_WORLD_BOUNDS);
        const lineCandidates = buildMountainBeltLineCandidates(normalizedWorldBounds, sourceInputs);
        const clusterDistance = roundMotionValue(getWorldDiagonal(normalizedWorldBounds) * DEFAULT_MOUNTAIN_BELT_CLUSTER_DISTANCE_RATIO);
        const sortedCandidates = lineCandidates.slice().sort((left, right) => {
            if (right.candidateStrength !== left.candidateStrength) {
                return right.candidateStrength - left.candidateStrength;
            }

            return normalizeString(left.sourceRidgeLineId, '').localeCompare(normalizeString(right.sourceRidgeLineId, ''));
        });
        const clusters = [];

        sortedCandidates.forEach((candidate) => {
            const matchedCluster = clusters.find((cluster) => shouldMergeMountainBeltCluster(cluster, candidate, clusterDistance));
            if (matchedCluster) {
                matchedCluster.lines.push(candidate);
                matchedCluster.plateIds = Array.from(new Set([...matchedCluster.plateIds, ...candidate.plateIds])).sort();
                matchedCluster.sourceRidgeLineIds = Array.from(new Set([...matchedCluster.sourceRidgeLineIds, candidate.sourceRidgeLineId])).sort();
                matchedCluster.sourceBoundaryIds = Array.from(new Set([...matchedCluster.sourceBoundaryIds, candidate.sourceBoundaryId].filter(Boolean))).sort();
                matchedCluster.sourceBoundaryTypes = Array.from(new Set([...matchedCluster.sourceBoundaryTypes, candidate.sourceBoundaryType])).sort();
                matchedCluster.centerPoint = {
                    x: Math.round((matchedCluster.centerPoint.x + candidate.midpoint.x) / 2),
                    y: Math.round((matchedCluster.centerPoint.y + candidate.midpoint.y) / 2)
                };
                matchedCluster.maxInfluenceRadius = Math.max(matchedCluster.maxInfluenceRadius, candidate.influenceRadius);
                matchedCluster.averageCandidateStrength = averageClusterMetric(matchedCluster.lines, 'candidateStrength');
                matchedCluster.averageMountainAmplificationBias = averageClusterMetric(matchedCluster.lines, 'mountainAmplificationBias');
                matchedCluster.averageUpliftBias = averageClusterMetric(matchedCluster.lines, 'upliftBias');
                matchedCluster.averageSubsidenceBias = averageClusterMetric(matchedCluster.lines, 'subsidenceBias');
                matchedCluster.averageFractureBias = averageClusterMetric(matchedCluster.lines, 'fractureBias');
                matchedCluster.averagePressureBias = averageClusterMetric(matchedCluster.lines, 'pressureBias');
                matchedCluster.averageArcInfluenceBias = averageClusterMetric(matchedCluster.lines, 'arcInfluenceBias');
                matchedCluster.averageRidgeStrength = averageClusterMetric(matchedCluster.lines, 'ridgeStrength');
                return;
            }

            const clusterIndex = clusters.length + 1;
            const namespace = buildNamespace(PIPELINE_STEP_ID, 'mountainBelts', `candidate${String(clusterIndex).padStart(2, '0')}`);
            clusters.push({
                candidateId: `mountain_belt_candidate_${String(clusterIndex).padStart(2, '0')}`,
                recordId: `mnt_${String(clusterIndex).padStart(2, '0')}`,
                namespace,
                lines: [candidate],
                spineOrientation: candidate.spineOrientation,
                plateIds: Array.from(new Set(candidate.plateIds)).sort(),
                sourceRidgeLineIds: [candidate.sourceRidgeLineId],
                sourceBoundaryIds: candidate.sourceBoundaryId ? [candidate.sourceBoundaryId] : [],
                sourceBoundaryTypes: [candidate.sourceBoundaryType],
                centerPoint: cloneValue(candidate.midpoint),
                maxInfluenceRadius: Math.max(1, candidate.influenceRadius),
                averageCandidateStrength: candidate.candidateStrength,
                averageMountainAmplificationBias: candidate.mountainAmplificationBias,
                averageUpliftBias: candidate.upliftBias,
                averageSubsidenceBias: candidate.subsidenceBias,
                averageFractureBias: candidate.fractureBias,
                averagePressureBias: candidate.pressureBias,
                averageArcInfluenceBias: candidate.arcInfluenceBias,
                averageRidgeStrength: candidate.ridgeStrength
            });
        });

        return {
            mountainBeltCandidates: clusters
                .filter((cluster) => cluster.lines.length >= DEFAULT_MOUNTAIN_BELT_MIN_CLUSTER_SIZE)
                .map((cluster) => finalizeMountainBeltCluster(cluster, normalizedWorldBounds, macroSeed))
                .sort((left, right) => {
                    if (right.candidateStrength !== left.candidateStrength) {
                        return right.candidateStrength - left.candidateStrength;
                    }

                    return normalizeString(left.mountainBeltCandidateId, '').localeCompare(normalizeString(right.mountainBeltCandidateId, ''));
                }),
            selectionParameters: {
                minStrength: DEFAULT_MOUNTAIN_BELT_MIN_STRENGTH,
                clusterDistance,
                minClusterSize: DEFAULT_MOUNTAIN_BELT_MIN_CLUSTER_SIZE
            },
            lineCandidateCount: lineCandidates.length
        };
    }

    function generateMountainBeltCandidates(input = {}) {
        const normalizedInput = normalizeInput(input);
        const plateSeedDistribution = resolvePlateSeedDistribution(input, normalizedInput);
        const plateMotionVectors = resolvePlateMotionVectors(input, normalizedInput, plateSeedDistribution);
        const plateBoundaryClassification = resolvePlateBoundaryClassification(input, normalizedInput, {
            plateSeedDistribution,
            plateMotionVectors
        });
        const upliftField = resolveUpliftFieldForCompatibility(input) || generateUpliftField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification
        });
        const subsidenceField = resolveSubsidenceFieldForCompatibility(input) || generateSubsidenceField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField
        });
        const fractureMaskField = resolveFractureFieldForCompatibility(input) || generateFractureField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField
        });
        const ridgeDirectionField = resolveRidgeDirectionFieldForCompatibility(input) || generateRidgeDirectionField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField
        });
        const arcFormationHelper = resolveArcFormationHelperForCompatibility(input) || generateArcFormationHelper({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField,
            ridgeDirectionField
        });
        const basinSeeds = resolveBasinSeedsForCompatibility(input) || generateBasinSeeds({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField,
            ridgeDirectionField
        });
        const platePressureField = isPlainObject(input.platePressureField)
            ? cloneValue(input.platePressureField)
            : (
                isPlainObject(input.fields)
                && isPlainObject(input.fields.platePressureField)
            )
                ? cloneValue(input.fields.platePressureField)
                : (
                    isPlainObject(input.outputs)
                    && isPlainObject(input.outputs.fields)
                    && isPlainObject(input.outputs.fields.platePressureField)
                )
                    ? cloneValue(input.outputs.fields.platePressureField)
                    : generatePlatePressureField({
                        ...normalizedInput,
                        plateSeedDistribution,
                        plateMotionVectors,
                        plateBoundaryClassification,
                        upliftField,
                        subsidenceField,
                        fractureMaskField,
                        ridgeDirectionField,
                        basinSeeds,
                        arcFormationHelper
                    });
        const worldBounds = isPlainObject(platePressureField.worldBounds)
            ? cloneValue(platePressureField.worldBounds)
            : cloneValue(normalizedInput.worldBounds);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'mountainBelts');
        const sourceInputs = {
            ridgeDirectionField,
            upliftField,
            subsidenceField,
            fractureMaskField,
            platePressureField,
            arcFormationHelper
        };
        const selection = buildMountainBeltCandidates(worldBounds, sourceInputs, normalizedInput.macroSeed);

        return {
            candidateSetId: 'mountainBeltCandidates',
            stageId: 'mountainBeltCandidates',
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'ridgeDirectionField.ridgeLines',
                'upliftField.values',
                'subsidenceField.values',
                'fractureMaskField.values',
                'platePressureField.values',
                'arcFormationHelper.arcGuides'
            ],
            namespace,
            seed: deriveSubSeed(normalizedInput.macroSeed, namespace),
            sourceFieldIds: buildMountainBeltSourceFieldIds(sourceInputs),
            worldBounds,
            mountainBeltCandidateCount: selection.mountainBeltCandidates.length,
            lineCandidateCount: selection.lineCandidateCount,
            selectionModel: 'tectonicMountainBeltCandidateExtractionV1',
            selectionParameters: selection.selectionParameters,
            compatibility: buildMountainBeltCompatibility(sourceInputs, worldBounds),
            intentionallyAbsent: [
                'climateShadow',
                'reliefRegions',
                'finalElevation',
                'mountainSystemFinalization'
            ],
            mountainBeltCandidates: selection.mountainBeltCandidates
        };
    }

    function buildPlainLowlandSourceFieldIds(sourceInputs) {
        return {
            upliftFieldId: normalizeString(sourceInputs.upliftField && sourceInputs.upliftField.fieldId, 'upliftField'),
            subsidenceFieldId: normalizeString(sourceInputs.subsidenceField && sourceInputs.subsidenceField.fieldId, 'subsidenceField'),
            fractureFieldId: normalizeString(sourceInputs.fractureMaskField && sourceInputs.fractureMaskField.fieldId, 'fractureMaskField'),
            ridgeDirectionFieldId: normalizeString(sourceInputs.ridgeDirectionField && sourceInputs.ridgeDirectionField.fieldId, 'ridgeDirectionField'),
            platePressureFieldId: normalizeString(sourceInputs.platePressureField && sourceInputs.platePressureField.fieldId, 'platePressureField'),
            basinSeedSetId: normalizeString(sourceInputs.basinSeeds && sourceInputs.basinSeeds.basinSeedSetId, 'basinSeeds'),
            mountainBeltCandidateSetId: normalizeString(sourceInputs.mountainBeltCandidates && sourceInputs.mountainBeltCandidates.candidateSetId, 'mountainBeltCandidates')
        };
    }

    function buildPlainLowlandCompatibility(sourceInputs, worldBounds) {
        return {
            ...buildPlainLowlandSourceFieldIds(sourceInputs),
            futureBasinTendencyInput: true,
            futurePlateauLogicCompatible: true,
            futureReliefRegionInput: true,
            sameWorldBoundsRequired: true,
            sameWorldBounds: {
                upliftField: compareFieldWorldBounds(sourceInputs.upliftField, worldBounds),
                subsidenceField: compareFieldWorldBounds(sourceInputs.subsidenceField, worldBounds),
                fractureMaskField: compareFieldWorldBounds(sourceInputs.fractureMaskField, worldBounds),
                ridgeDirectionField: compareFieldWorldBounds(sourceInputs.ridgeDirectionField, worldBounds),
                platePressureField: compareFieldWorldBounds(sourceInputs.platePressureField, worldBounds),
                basinSeeds: compareFieldWorldBounds(sourceInputs.basinSeeds, worldBounds),
                mountainBeltCandidates: compareFieldWorldBounds(sourceInputs.mountainBeltCandidates, worldBounds)
            },
            note: 'Compatibility metadata only; this pass prepares broad plain/lowland smoothing for later basin, plateau, and relief logic without extracting regions or adding gameplay semantics.'
        };
    }

    function readUnitGridValue(values, width, height, x, y) {
        const normalizedX = clampGridCoordinate(x, width);
        const normalizedY = clampGridCoordinate(y, height);
        const value = Number(values[(normalizedY * width) + normalizedX]);
        return clampUnitInterval(Number.isFinite(value) ? value : 0, 0);
    }

    function smoothUnitGridValues(values, width, height, passes = DEFAULT_PLAIN_LOWLAND_SMOOTHING_PASSES) {
        let currentValues = Array.isArray(values) ? values.slice() : new Array(width * height).fill(0);
        const normalizedPasses = Math.max(0, normalizeInteger(passes, DEFAULT_PLAIN_LOWLAND_SMOOTHING_PASSES));
        const kernel = [
            { x: -1, y: -1, weight: 1 },
            { x: 0, y: -1, weight: 2 },
            { x: 1, y: -1, weight: 1 },
            { x: -1, y: 0, weight: 2 },
            { x: 0, y: 0, weight: 4 },
            { x: 1, y: 0, weight: 2 },
            { x: -1, y: 1, weight: 1 },
            { x: 0, y: 1, weight: 2 },
            { x: 1, y: 1, weight: 1 }
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

    function materializePlainLowlandSmoothingField(field, worldBounds, sourceInputs) {
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const upliftField = sourceInputs.upliftField || null;
        const subsidenceField = sourceInputs.subsidenceField || null;
        const fractureMaskField = sourceInputs.fractureMaskField || null;
        const ridgeDirectionField = sourceInputs.ridgeDirectionField || null;
        const platePressureField = sourceInputs.platePressureField || null;
        const basinSeeds = sourceInputs.basinSeeds || null;
        const mountainBeltCandidates = sourceInputs.mountainBeltCandidates || null;
        const rawValues = new Array(width * height).fill(0);
        const componentWeights = {
            subsidenceSupport: 0.3,
            basinSupport: 0.24,
            quietPlatePressure: 0.18,
            lowRuggedness: 0.18,
            lowUpliftShelf: 0.1,
            upliftSuppression: 0.13,
            ridgeSuppression: 0.17,
            fractureSuppression: 0.11,
            pressureSuppression: 0.1,
            mountainBeltSuppression: 0.32
        };

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const point = { x, y };
                const uplift = readSerializedScalarFieldValue(upliftField, point, 0);
                const subsidence = readSerializedScalarFieldValue(subsidenceField, point, 0);
                const fracture = readSerializedScalarFieldValue(fractureMaskField, point, 0);
                const ridge = readSerializedDirectionalFieldMagnitude(ridgeDirectionField, point, 0);
                const pressure = readSerializedScalarFieldValue(platePressureField, point, 0);
                const basinSupport = readBasinSeedInfluenceAtPoint(basinSeeds, point, worldBounds);
                const mountainBeltInfluence = readMountainBeltCandidateInfluenceAtPoint(
                    mountainBeltCandidates,
                    point,
                    worldBounds
                );
                const lowRuggedness = clampUnitInterval(((1 - fracture) * 0.55) + ((1 - ridge) * 0.45), 0);
                const support = (
                    (subsidence * componentWeights.subsidenceSupport)
                    + (basinSupport * componentWeights.basinSupport)
                    + ((1 - pressure) * componentWeights.quietPlatePressure)
                    + (lowRuggedness * componentWeights.lowRuggedness)
                    + ((1 - uplift) * componentWeights.lowUpliftShelf)
                );
                const suppression = (
                    (uplift * componentWeights.upliftSuppression)
                    + (ridge * componentWeights.ridgeSuppression)
                    + (fracture * componentWeights.fractureSuppression)
                    + (pressure * componentWeights.pressureSuppression)
                    + (mountainBeltInfluence * componentWeights.mountainBeltSuppression)
                );
                rawValues[(y * width) + x] = clampUnitInterval(support - suppression, 0);
            }
        }

        const smoothedValues = smoothUnitGridValues(
            rawValues,
            width,
            height,
            DEFAULT_PLAIN_LOWLAND_SMOOTHING_PASSES
        );
        smoothedValues.forEach((value, index) => {
            const x = index % width;
            const y = Math.floor(index / width);
            field.write(x, y, value);
        });

        return {
            modelId: 'tectonicPlainLowlandSmoothingV1',
            smoothingKernel: 'weighted3x3',
            smoothingPasses: DEFAULT_PLAIN_LOWLAND_SMOOTHING_PASSES,
            componentWeights,
            supportChannels: [
                'subsidenceField',
                'basinSeeds',
                'quietPlatePressure',
                'lowRuggedness'
            ],
            suppressionChannels: [
                'upliftField',
                'ridgeDirectionField',
                'fractureMaskField',
                'platePressureField',
                'mountainBeltCandidates'
            ],
            plateauCompatibilityPolicy: 'preserve uplift/ridge/fracture shelves for later plateau logic'
        };
    }

    function generatePlainLowlandSmoothingField(input = {}) {
        const normalizedInput = normalizeInput(input);
        const plateSeedDistribution = resolvePlateSeedDistribution(input, normalizedInput);
        const plateMotionVectors = resolvePlateMotionVectors(input, normalizedInput, plateSeedDistribution);
        const plateBoundaryClassification = resolvePlateBoundaryClassification(input, normalizedInput, {
            plateSeedDistribution,
            plateMotionVectors
        });
        const upliftField = resolveUpliftFieldForCompatibility(input) || generateUpliftField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification
        });
        const subsidenceField = resolveSubsidenceFieldForCompatibility(input) || generateSubsidenceField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField
        });
        const fractureMaskField = resolveFractureFieldForCompatibility(input) || generateFractureField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField
        });
        const ridgeDirectionField = resolveRidgeDirectionFieldForCompatibility(input) || generateRidgeDirectionField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField
        });
        const basinSeeds = resolveBasinSeedsForCompatibility(input) || generateBasinSeeds({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField,
            ridgeDirectionField
        });
        const arcFormationHelper = resolveArcFormationHelperForCompatibility(input) || generateArcFormationHelper({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField,
            ridgeDirectionField
        });
        const platePressureField = resolvePlatePressureFieldForCompatibility(input) || generatePlatePressureField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField,
            ridgeDirectionField,
            basinSeeds,
            arcFormationHelper
        });
        const mountainBeltCandidates = resolveMountainBeltCandidatesForCompatibility(input) || generateMountainBeltCandidates({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField,
            ridgeDirectionField,
            basinSeeds,
            arcFormationHelper,
            platePressureField
        });
        const worldBounds = isPlainObject(platePressureField.worldBounds)
            ? cloneValue(platePressureField.worldBounds)
            : cloneValue(normalizedInput.worldBounds);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'plainLowlandSmoothing');
        const field = createScalarFieldStorage('plainLowlandSmoothingField', worldBounds, {
            range: DEFAULT_PLAIN_LOWLAND_SMOOTHING_FIELD_RANGE
        });
        const sourceInputs = {
            upliftField,
            subsidenceField,
            fractureMaskField,
            ridgeDirectionField,
            platePressureField,
            basinSeeds,
            mountainBeltCandidates
        };
        const smoothingModel = materializePlainLowlandSmoothingField(field, worldBounds, sourceInputs);

        return serializeScalarField(field, {
            stageId: 'plainLowlandSmoothingPass',
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'upliftField.values',
                'subsidenceField.values',
                'fractureMaskField.values',
                'ridgeDirectionField.xValues',
                'ridgeDirectionField.yValues',
                'platePressureField.values',
                'basinSeeds.basinSeeds',
                'mountainBeltCandidates.mountainBeltCandidates'
            ],
            namespace,
            seed: deriveSubSeed(normalizedInput.macroSeed, namespace),
            sourceFieldIds: buildPlainLowlandSourceFieldIds(sourceInputs),
            worldBounds,
            smoothingModel,
            compatibility: buildPlainLowlandCompatibility(sourceInputs, worldBounds),
            intentionallyAbsent: [
                'fertilityScoring',
                'gameplaySemantics',
                'basinDepression',
                'plateauExtraction',
                'reliefRegions'
            ]
        }, {
            range: DEFAULT_PLAIN_LOWLAND_SMOOTHING_FIELD_RANGE,
            valueEncoding: PLAIN_LOWLAND_SMOOTHING_FIELD_VALUE_ENCODING
        });
    }

    function buildArcFormationGuides(boundaryClassifications, worldBounds, sourceInputs, macroSeed) {
        const normalizedWorldBounds = isPlainObject(worldBounds)
            ? cloneValue(worldBounds)
            : cloneValue(DEFAULT_WORLD_BOUNDS);
        const upliftField = sourceInputs.upliftField || null;
        const subsidenceField = sourceInputs.subsidenceField || null;
        const fractureMaskField = sourceInputs.fractureMaskField || null;
        const ridgeDirectionField = sourceInputs.ridgeDirectionField || null;
        const shortestAxis = Math.max(1, Math.min(normalizedWorldBounds.width, normalizedWorldBounds.height));
        const guides = [];

        (Array.isArray(boundaryClassifications) ? boundaryClassifications : []).forEach((boundary, boundaryIndex) => {
            const futureSignals = isPlainObject(boundary && boundary.futureSignals) ? boundary.futureSignals : {};
            const sourceHint = normalizeString(futureSignals.volcanicSourceHint, '');
            if (sourceHint !== 'arcCandidate' && sourceHint !== 'islandArcCandidate') {
                return;
            }

            const volcanicPotential = clampUnitInterval(futureSignals.volcanicPotential, 0);
            if (volcanicPotential <= 0) {
                return;
            }

            const startPoint = getBoundarySeedPoint(boundary, boundary.plateIds[0]);
            const endPoint = getBoundarySeedPoint(boundary, boundary.plateIds[1]);
            const midpoint = {
                x: Math.round((startPoint.x + endPoint.x) / 2),
                y: Math.round((startPoint.y + endPoint.y) / 2)
            };
            const sampledUplift = readSerializedScalarFieldValue(upliftField, midpoint, getBoundaryUpliftPotential(boundary));
            const sampledSubsidence = readSerializedScalarFieldValue(subsidenceField, midpoint, getBoundarySubsidencePotential(boundary));
            const sampledFracture = readSerializedScalarFieldValue(fractureMaskField, midpoint, getBoundaryFracturePotential(boundary));
            const ridgeSupport = readSerializedDirectionalFieldMagnitude(ridgeDirectionField, midpoint, 0);
            const arcStrength = clampUnitInterval(
                (volcanicPotential * 0.48)
                + (sampledUplift * 0.16)
                + (sampledFracture * 0.12)
                + (ridgeSupport * 0.18)
                + (sourceHint === 'islandArcCandidate' ? 0.08 : 0.05)
                - (sampledSubsidence * 0.08),
                0
            );
            if (arcStrength < DEFAULT_ARC_HELPER_MIN_STRENGTH) {
                return;
            }

            const guideIndex = guides.length + 1;
            const guideNamespace = buildNamespace(PIPELINE_STEP_ID, 'arcFormation', `guide${String(guideIndex).padStart(2, '0')}`);
            const guideRng = createScopedRng(macroSeed, guideNamespace);
            const tangentVector = normalizeUnitVector({
                x: -(boundary.boundaryVector && boundary.boundaryVector.y),
                y: boundary.boundaryVector && boundary.boundaryVector.x
            }, { x: 1, y: 0 });
            const carrier = chooseArcCarrier(boundary, midpoint);
            const boundaryLength = getPointDistance(startPoint, endPoint);
            const arcCurvature = clampUnitInterval(
                0.22 + (arcStrength * 0.42) + (guideRng.nextFloat() * 0.1),
                0.25
            );
            const apexOffset = Math.max(
                2,
                Math.min(shortestAxis * DEFAULT_ARC_APEX_OFFSET_RATIO, boundaryLength * (0.18 + (arcCurvature * 0.32)))
            );
            const tangentShift = (guideRng.nextFloat() - 0.5) * boundaryLength * 0.12;
            const apexPoint = clampPointToWorldBounds({
                x: Math.round(midpoint.x + (carrier.bowVector.x * apexOffset) + (tangentVector.x * tangentShift)),
                y: Math.round(midpoint.y + (carrier.bowVector.y * apexOffset) + (tangentVector.y * tangentShift))
            }, normalizedWorldBounds);
            const curveSamples = buildQuadraticCurveSamples(
                startPoint,
                apexPoint,
                endPoint,
                DEFAULT_ARC_HELPER_SAMPLE_COUNT,
                normalizedWorldBounds
            );
            const curvedFormBias = clampUnitInterval(
                (arcStrength * 0.6)
                + (arcCurvature * 0.4),
                0
            );

            guides.push({
                arcGuideId: `arc_guide_${String(guideIndex).padStart(2, '0')}`,
                sourceBoundaryId: normalizeString(boundary.boundaryId, `boundary_${boundaryIndex + 1}`),
                sourcePlateIds: Array.isArray(boundary.plateIds) ? boundary.plateIds.slice() : [],
                sourceHint,
                carrierPlateId: carrier.carrierPlateId,
                carrierPlateClass: carrier.carrierPlateClass,
                startPoint,
                endPoint,
                midpoint,
                apexPoint,
                normalizedApexPoint: buildNormalizedPoint(apexPoint, normalizedWorldBounds),
                controlPoints: [
                    cloneValue(startPoint),
                    cloneValue(apexPoint),
                    cloneValue(endPoint)
                ],
                curveSamples,
                guideArea: {
                    ...buildPointBounds([startPoint, apexPoint, endPoint, ...curveSamples], normalizedWorldBounds),
                    influenceRadius: roundMotionValue(apexOffset)
                },
                tangentVector,
                bowVector: carrier.bowVector,
                arcStrength: roundMotionValue(arcStrength),
                arcCurvature: roundMotionValue(arcCurvature),
                curvedFormBias: roundMotionValue(curvedFormBias),
                volcanicArcBias: roundMotionValue(clampUnitInterval(
                    (volcanicPotential * 0.72)
                    + (ridgeSupport * 0.18)
                    + (arcCurvature * 0.1),
                    0
                )),
                sourceSignals: {
                    volcanicPotential: roundMotionValue(volcanicPotential),
                    sampledUplift: roundMotionValue(sampledUplift),
                    sampledSubsidence: roundMotionValue(sampledSubsidence),
                    sampledFracture: roundMotionValue(sampledFracture),
                    ridgeSupport: roundMotionValue(ridgeSupport)
                },
                namespace: guideNamespace,
                seed: deriveSubSeed(macroSeed, guideNamespace)
            });
        });

        return guides;
    }

    function generateArcFormationHelper(input = {}) {
        const normalizedInput = normalizeInput(input);
        const plateSeedDistribution = resolvePlateSeedDistribution(input, normalizedInput);
        const plateMotionVectors = resolvePlateMotionVectors(input, normalizedInput, plateSeedDistribution);
        const plateBoundaryClassification = resolvePlateBoundaryClassification(input, normalizedInput, {
            plateSeedDistribution,
            plateMotionVectors
        });
        const upliftField = resolveUpliftFieldForCompatibility(input) || generateUpliftField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification
        });
        const subsidenceField = resolveSubsidenceFieldForCompatibility(input) || generateSubsidenceField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField
        });
        const fractureMaskField = resolveFractureFieldForCompatibility(input) || generateFractureField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField
        });
        const ridgeDirectionField = resolveRidgeDirectionFieldForCompatibility(input) || generateRidgeDirectionField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField
        });
        const worldBounds = isPlainObject(plateBoundaryClassification.worldBounds)
            ? cloneValue(plateBoundaryClassification.worldBounds)
            : cloneValue(normalizedInput.worldBounds);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'arcFormation');
        const arcGuides = buildArcFormationGuides(
            plateBoundaryClassification.boundaryClassifications,
            worldBounds,
            {
                upliftField,
                subsidenceField,
                fractureMaskField,
                ridgeDirectionField
            },
            normalizedInput.macroSeed
        );

        return {
            arcHelperId: 'arcFormationHelper',
            stageId: 'arcFormationHelper',
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'plateBoundaryClassification.boundaryClassifications',
                'upliftField.values',
                'subsidenceField.values',
                'fractureMaskField.values',
                'ridgeDirectionField.xValues',
                'ridgeDirectionField.yValues'
            ],
            namespace,
            seed: deriveSubSeed(normalizedInput.macroSeed, namespace),
            sourceClassificationId: normalizeString(
                plateBoundaryClassification.classificationId,
                'plateBoundaryClassification'
            ),
            worldBounds,
            arcGuideCount: arcGuides.length,
            guideSelectionModel: 'tectonicArcFormationHelperV1',
            compatibility: buildArcFormationCompatibility({
                ...input,
                upliftField,
                subsidenceField,
                fractureMaskField,
                ridgeDirectionField
            }, worldBounds),
            intentionallyAbsent: [
                'tectonicComposite',
                'oceanCarving',
                'volcanicZones',
                'climateEffects'
            ],
            arcGuides
        };
    }

    function buildHotspotVolcanicSeeds(plateSeedDistribution, plateMotionVectors, worldBounds, sourceInputs, macroSeed) {
        const plateSeeds = Array.isArray(plateSeedDistribution && plateSeedDistribution.plateSeeds)
            ? plateSeedDistribution.plateSeeds
            : [];
        const plateMotionList = Array.isArray(plateMotionVectors && plateMotionVectors.plateMotionVectors)
            ? plateMotionVectors.plateMotionVectors
            : [];
        const upliftField = sourceInputs.upliftField || null;
        const subsidenceField = sourceInputs.subsidenceField || null;
        const fractureMaskField = sourceInputs.fractureMaskField || null;
        const ridgeDirectionField = sourceInputs.ridgeDirectionField || null;
        const arcFormationHelper = sourceInputs.arcFormationHelper || null;
        const plateSeedLookup = plateSeeds.reduce((lookup, plateSeed) => {
            const plateId = normalizeString(plateSeed && plateSeed.plateId, '');
            if (plateId) {
                lookup.set(plateId, plateSeed);
            }

            return lookup;
        }, new Map());
        const shortestAxis = Math.max(1, Math.min(worldBounds.width, worldBounds.height));
        const candidates = plateMotionList.map((plateMotionVector, index) => {
            const plateId = normalizeString(plateMotionVector && plateMotionVector.plateId, `plate_${padPlateIndex(index)}`);
            const plateSeed = plateSeedLookup.get(plateId) || plateMotionVector || {};
            const sourcePlateClass = normalizeString(
                plateMotionVector && plateMotionVector.plateClass,
                normalizeString(plateSeed && plateSeed.plateClass, 'mixed')
            );
            const seedPoint = normalizePoint(
                (plateSeed && plateSeed.seedPoint)
                || (plateMotionVector && plateMotionVector.seedPoint)
            );
            const motionDirection = normalizeUnitVector(
                plateMotionVector && (plateMotionVector.unitVector || plateMotionVector.motionVector),
                { x: 1, y: 0 }
            );
            const trailVector = {
                x: roundMotionValue(-motionDirection.x),
                y: roundMotionValue(-motionDirection.y)
            };
            const lateralVector = normalizeUnitVector({
                x: -motionDirection.y,
                y: motionDirection.x
            }, { x: 0, y: 1 });
            const candidateNamespace = buildNamespace(PIPELINE_STEP_ID, 'hotspotVolcanicSeeds', `plate${padPlateIndex(index)}`);
            const candidateRng = createScopedRng(macroSeed, candidateNamespace);
            const axialOffset = shortestAxis * (0.03 + (candidateRng.nextFloat() * 0.05));
            const lateralOffset = shortestAxis * ((candidateRng.nextFloat() - 0.5) * 0.12);
            const candidatePoint = clampPointToWorldBounds({
                x: Math.round(seedPoint.x + (motionDirection.x * axialOffset) + (lateralVector.x * lateralOffset)),
                y: Math.round(seedPoint.y + (motionDirection.y * axialOffset) + (lateralVector.y * lateralOffset))
            }, worldBounds);
            const motionMagnitude = clampUnitInterval(plateMotionVector && plateMotionVector.magnitude, DEFAULT_PLATE_MOTION_MIN_MAGNITUDE);
            const sampledUplift = readSerializedScalarFieldValue(upliftField, candidatePoint, 0);
            const sampledSubsidence = readSerializedScalarFieldValue(subsidenceField, candidatePoint, 0);
            const sampledFracture = readSerializedScalarFieldValue(fractureMaskField, candidatePoint, 0);
            const ridgeSupport = readSerializedDirectionalFieldMagnitude(ridgeDirectionField, candidatePoint, 0);
            const arcProximityPenalty = getArcGuideProximityPenalty(candidatePoint, arcFormationHelper, worldBounds);
            const plateBias = getHotspotPlateBias(sourcePlateClass);
            const intraplateStability = clampUnitInterval(
                1 - ((sampledUplift * 0.45) + (sampledSubsidence * 0.35) + (ridgeSupport * 0.2)),
                0
            );
            const hotspotStrength = clampUnitInterval(
                (plateBias * 0.42)
                + (motionMagnitude * 0.12)
                + (sampledFracture * 0.16)
                + (intraplateStability * 0.2)
                + ((1 - arcProximityPenalty) * 0.12)
                + (candidateRng.nextFloat() * 0.08)
                - 0.04,
                0
            );
            const persistenceBias = clampUnitInterval(
                (intraplateStability * 0.45)
                + ((1 - sampledSubsidence) * 0.15)
                + ((1 - arcProximityPenalty) * 0.15)
                + (motionMagnitude * 0.25),
                0
            );
            const trailLength = Math.max(
                4,
                shortestAxis * (0.05 + (motionMagnitude * 0.08) + (hotspotStrength * 0.04))
            );
            const trailSamples = buildHotspotTrailSamples(
                candidatePoint,
                trailVector,
                trailLength,
                worldBounds,
                candidateRng
            );
            const influenceRadius = roundMotionValue(
                Math.max(2, shortestAxis * (DEFAULT_HOTSPOT_BASE_RADIUS_RATIO + (hotspotStrength * 0.02)))
            );

            return {
                sourcePlateId: plateId,
                sourcePlateClass,
                sourceKind: getHotspotSourceKind(sourcePlateClass),
                seedPoint: candidatePoint,
                normalizedPoint: buildNormalizedPoint(candidatePoint, worldBounds),
                seedArea: {
                    ...buildPointBounds([candidatePoint, ...trailSamples], worldBounds),
                    influenceRadius
                },
                trailVector,
                trailLength: roundMotionValue(trailLength),
                trailSamples,
                hotspotStrength: roundMotionValue(hotspotStrength),
                persistenceBias: roundMotionValue(persistenceBias),
                volcanicZoneBias: roundMotionValue(clampUnitInterval(
                    (hotspotStrength * 0.58)
                    + (persistenceBias * 0.18)
                    + (plateBias * 0.14)
                    + (sampledFracture * 0.1),
                    0
                )),
                arcAvoidanceBias: roundMotionValue(clampUnitInterval(1 - arcProximityPenalty, 0)),
                sourceSignals: {
                    motionMagnitude: roundMotionValue(motionMagnitude),
                    sampledUplift: roundMotionValue(sampledUplift),
                    sampledSubsidence: roundMotionValue(sampledSubsidence),
                    sampledFracture: roundMotionValue(sampledFracture),
                    ridgeSupport: roundMotionValue(ridgeSupport),
                    intraplateStability: roundMotionValue(intraplateStability),
                    arcProximityPenalty: roundMotionValue(arcProximityPenalty)
                },
                namespace: candidateNamespace,
                seed: deriveSubSeed(macroSeed, candidateNamespace)
            };
        }).sort((left, right) => {
            if (left.hotspotStrength !== right.hotspotStrength) {
                return right.hotspotStrength - left.hotspotStrength;
            }

            return left.sourcePlateId.localeCompare(right.sourcePlateId);
        });

        const selected = candidates.filter((candidate) => candidate.hotspotStrength >= DEFAULT_HOTSPOT_SEED_MIN_STRENGTH);
        const accepted = selected.length ? selected : candidates.slice(0, 1);

        return accepted.map((candidate, index) => ({
            hotspotSeedId: `hotspot_seed_${String(index + 1).padStart(2, '0')}`,
            ...candidate
        }));
    }

    function generateHotspotVolcanicSeedHelper(input = {}) {
        const normalizedInput = normalizeInput(input);
        const plateSeedDistribution = resolvePlateSeedDistribution(input, normalizedInput);
        const plateMotionVectors = resolvePlateMotionVectors(input, normalizedInput, plateSeedDistribution);
        const plateBoundaryClassification = resolvePlateBoundaryClassification(input, normalizedInput, {
            plateSeedDistribution,
            plateMotionVectors
        });
        const upliftField = resolveUpliftFieldForCompatibility(input) || generateUpliftField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification
        });
        const subsidenceField = resolveSubsidenceFieldForCompatibility(input) || generateSubsidenceField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField
        });
        const fractureMaskField = resolveFractureFieldForCompatibility(input) || generateFractureField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField
        });
        const ridgeDirectionField = resolveRidgeDirectionFieldForCompatibility(input) || generateRidgeDirectionField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField
        });
        const arcFormationHelper = resolveArcFormationHelperForCompatibility(input) || generateArcFormationHelper({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField,
            ridgeDirectionField
        });
        const worldBounds = isPlainObject(plateSeedDistribution.worldBounds)
            ? cloneValue(plateSeedDistribution.worldBounds)
            : cloneValue(normalizedInput.worldBounds);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'hotspotVolcanicSeeds');
        const hotspotSeeds = buildHotspotVolcanicSeeds(
            plateSeedDistribution,
            plateMotionVectors,
            worldBounds,
            {
                upliftField,
                subsidenceField,
                fractureMaskField,
                ridgeDirectionField,
                arcFormationHelper
            },
            normalizedInput.macroSeed
        );

        return {
            hotspotHelperId: 'hotspotVolcanicSeedHelper',
            stageId: 'hotspotVolcanicSeedHelper',
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'plateSeedDistribution.plateSeeds',
                'plateMotionVectors.plateMotionVectors',
                'upliftField.values',
                'subsidenceField.values',
                'fractureMaskField.values',
                'ridgeDirectionField.xValues',
                'ridgeDirectionField.yValues',
                'arcFormationHelper.arcGuides'
            ],
            namespace,
            seed: deriveSubSeed(normalizedInput.macroSeed, namespace),
            sourceDistributionId: normalizeString(
                plateSeedDistribution.distributionId,
                'plateSeedDistribution'
            ),
            sourceVectorSetId: normalizeString(
                plateMotionVectors.vectorSetId,
                'plateMotionVectors'
            ),
            worldBounds,
            hotspotSeedCount: hotspotSeeds.length,
            selectionModel: 'tectonicHotspotVolcanicSeedHelperV1',
            compatibility: buildHotspotVolcanicSeedCompatibility({
                plateMotionVectors,
                arcFormationHelper,
                upliftField,
                subsidenceField,
                fractureMaskField,
                ridgeDirectionField
            }, worldBounds),
            intentionallyAbsent: [
                'volcanicZones',
                'geologicResources',
                'oceanCarving',
                'tectonicComposite'
            ],
            hotspotSeeds
        };
    }

    function generatePlatePressureField(input = {}) {
        const normalizedInput = normalizeInput(input);
        const plateSeedDistribution = resolvePlateSeedDistribution(input, normalizedInput);
        const plateMotionVectors = resolvePlateMotionVectors(input, normalizedInput, plateSeedDistribution);
        const plateBoundaryClassification = resolvePlateBoundaryClassification(input, normalizedInput, {
            plateSeedDistribution,
            plateMotionVectors
        });
        const upliftField = resolveUpliftFieldForCompatibility(input) || generateUpliftField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification
        });
        const subsidenceField = resolveSubsidenceFieldForCompatibility(input) || generateSubsidenceField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField
        });
        const fractureMaskField = resolveFractureFieldForCompatibility(input) || generateFractureField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField
        });
        const ridgeDirectionField = resolveRidgeDirectionFieldForCompatibility(input) || generateRidgeDirectionField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField
        });
        const basinSeeds = resolveBasinSeedsForCompatibility(input) || generateBasinSeeds({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField,
            ridgeDirectionField
        });
        const arcFormationHelper = resolveArcFormationHelperForCompatibility(input) || generateArcFormationHelper({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField,
            ridgeDirectionField
        });
        const worldBounds = isPlainObject(upliftField.worldBounds)
            ? cloneValue(upliftField.worldBounds)
            : cloneValue(normalizedInput.worldBounds);
        const namespace = buildNamespace(PIPELINE_STEP_ID, 'platePressureComposite');
        const field = createScalarFieldStorage('platePressureField', worldBounds, {
            range: DEFAULT_PLATE_PRESSURE_FIELD_RANGE
        });
        const sourceInputs = {
            upliftField,
            subsidenceField,
            fractureMaskField,
            ridgeDirectionField,
            basinSeeds,
            arcFormationHelper
        };
        const compositionModel = materializePlatePressureField(field, worldBounds, sourceInputs);

        return serializeScalarField(field, {
            stageId: 'platePressureCompositeField',
            status: IMPLEMENTED_STATUS,
            deterministicBy: [
                'macroSeed',
                'upliftField.values',
                'subsidenceField.values',
                'fractureMaskField.values',
                'ridgeDirectionField.xValues',
                'ridgeDirectionField.yValues',
                'basinSeeds.basinSeeds',
                'arcFormationHelper.arcGuides'
            ],
            namespace,
            seed: deriveSubSeed(normalizedInput.macroSeed, namespace),
            sourceFieldIds: buildPlatePressureSourceFieldIds(sourceInputs),
            worldBounds,
            compositionModel: {
                modelId: 'tectonicPlatePressureCompositeV1',
                ...compositionModel
            },
            compatibility: buildPlatePressureCompatibility(sourceInputs, worldBounds),
            intentionallyAbsent: [
                'landTendencyMap',
                'finalElevation',
                'marineFloodFill',
                'climateEffects'
            ]
        }, {
            range: DEFAULT_PLATE_PRESSURE_FIELD_RANGE,
            valueEncoding: PLATE_PRESSURE_FIELD_VALUE_ENCODING
        });
    }

    function createTectonicSkeletonPipeline(input = {}) {
        const normalizedInput = normalizeInput(input);
        const plateSeedDistribution = generatePlateSeedDistribution(normalizedInput);
        const plateMotionVectors = generatePlateMotionVectors({
            ...normalizedInput,
            plateSeedDistribution
        });
        const plateBoundaryClassification = generatePlateBoundaryClassification({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors
        });
        const upliftField = generateUpliftField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification
        });
        const subsidenceField = generateSubsidenceField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField
        });
        const fractureMaskField = generateFractureField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField
        });
        const ridgeDirectionField = generateRidgeDirectionField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField
        });
        const basinSeeds = generateBasinSeeds({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField,
            ridgeDirectionField
        });
        const arcFormationHelper = generateArcFormationHelper({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField,
            ridgeDirectionField
        });
        const hotspotVolcanicSeedHelper = generateHotspotVolcanicSeedHelper({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField,
            ridgeDirectionField,
            arcFormationHelper
        });
        const platePressureField = generatePlatePressureField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField,
            ridgeDirectionField,
            basinSeeds,
            arcFormationHelper
        });
        const mountainBeltCandidates = generateMountainBeltCandidates({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField,
            ridgeDirectionField,
            basinSeeds,
            arcFormationHelper,
            platePressureField
        });
        const plainLowlandSmoothingField = generatePlainLowlandSmoothingField({
            ...normalizedInput,
            plateSeedDistribution,
            plateMotionVectors,
            plateBoundaryClassification,
            upliftField,
            subsidenceField,
            fractureMaskField,
            ridgeDirectionField,
            basinSeeds,
            arcFormationHelper,
            platePressureField,
            mountainBeltCandidates
        });
        const plates = plateSeedDistribution.plateSeeds.map(createPlateRecordFromSeed);
        const implementedStageIds = getImplementedStageIds();

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
            inputContract: getTectonicSkeletonInputContract(),
            outputContract: getTectonicSkeletonOutputContract(),
            plateSeedDistributionContract: getPlateSeedDistributionContract(),
            plateMotionVectorsContract: getPlateMotionVectorsContract(),
            plateBoundaryClassificationContract: getPlateBoundaryClassificationContract(),
            upliftFieldContract: getUpliftFieldContract(),
            subsidenceFieldContract: getSubsidenceFieldContract(),
            fractureFieldContract: getFractureFieldContract(),
            ridgeDirectionFieldContract: getRidgeDirectionFieldContract(),
            basinSeedsContract: getBasinSeedsContract(),
            arcFormationHelperContract: getArcFormationHelperContract(),
            hotspotVolcanicSeedHelperContract: getHotspotVolcanicSeedHelperContract(),
            platePressureFieldContract: getPlatePressureFieldContract(),
            mountainBeltCandidatesContract: getMountainBeltCandidatesContract(),
            plainLowlandSmoothingFieldContract: getPlainLowlandSmoothingFieldContract(),
            input: normalizedInput,
            seedHooks: getTectonicSkeletonSeedHooks(normalizedInput.macroSeed),
            plannedStages: PLANNED_STAGES.map((stage) => ({
                ...cloneValue(stage),
                status: implementedStageIds.has(stage.stageId)
                    ? IMPLEMENTED_STATUS
                    : TODO_STATUS
            })),
            outputs: {
                ...createEmptyTectonicOutputs(),
                fields: {
                    upliftField,
                    subsidenceField,
                    fractureMaskField,
                    ridgeDirectionField,
                    platePressureField,
                    plainLowlandSmoothingField
                },
                intermediateOutputs: {
                    plateSeedDistribution,
                    plateMotionVectors,
                    plateBoundaryClassification,
                    basinSeeds,
                    arcFormationHelper,
                    hotspotVolcanicSeedHelper,
                    mountainBeltCandidates
                },
                records: {
                    plates
                }
            },
            notes: [
                'Plate seed distribution is implemented and deterministic by macroSeed.',
                'Plate motion vectors are implemented as boundary-analysis-ready intermediate data without classifying boundaries.',
                'Plate boundary classification is implemented as relative-motion metadata for future uplift, subsidence, and volcanic passes.',
                'Uplift field is implemented as a scalar field derived from plate boundary classification.',
                'Subsidence field is implemented as a scalar field derived from plate boundary classification and remains compatible with uplift/elevation layers.',
                'Fracture mask field is implemented as a scalar field derived from boundary shear and remains compatible with uplift/subsidence layers.',
                'Ridge direction field is implemented as a directional field with deterministic ridge-line candidates for later mountain amplification.',
                'Basin seeds are implemented as deterministic seed points/areas derived from tectonic subsidence context for later basin tendency and river-basin extraction.',
                'Arc formation helper is implemented as deterministic curved arc guides for later volcanic-arc and curved tectonic-form extraction.',
                'Hotspot volcanic seed helper is implemented as deterministic hotspot-like seed points and trail geometry for later hotspot volcanic-zone extraction.',
                'Plate pressure field is implemented as a deterministic composite scalar field over uplift/subsidence/fracture/ridge/basin/arc inputs for later tectonic interpretation layers.',
                'Mountain-belt candidates are implemented as deterministic contract-ready drafts from ridge/pressure/arc tectonic layers, but they intentionally stop before relief-region linkage and final MountainSystemRecord extraction.',
                'Plain/lowland smoothing field is implemented as a deterministic scalar pass over quiet tectonic, subsidence, basin, pressure, and mountain-belt context for later basin/plateau/relief logic.',
                'TODO CONTRACTED: final landmass synthesis, marine flood fill, basin depression, plateau extraction, basin extraction, full elevation composite, relief construction, mountain-system extraction, fertility scoring, and phase orchestration remain unimplemented.',
                'PlateRecord bias slots are neutral placeholders and must not be interpreted as generated uplift or generated motion data.'
            ]
        };
    }

    function generateTectonicSkeleton(input = {}) {
        return createTectonicSkeletonPipeline(input);
    }

    function getTectonicSkeletonGeneratorDescriptor() {
        return {
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            status: PARTIAL_STATUS,
            entry: 'generateTectonicSkeleton',
            pipelineFactory: 'createTectonicSkeletonPipeline',
            inputContract: getTectonicSkeletonInputContract(),
            outputContract: getTectonicSkeletonOutputContract(),
            plateSeedDistributionContract: getPlateSeedDistributionContract(),
            plateMotionVectorsContract: getPlateMotionVectorsContract(),
            plateBoundaryClassificationContract: getPlateBoundaryClassificationContract(),
            upliftFieldContract: getUpliftFieldContract(),
            subsidenceFieldContract: getSubsidenceFieldContract(),
            fractureFieldContract: getFractureFieldContract(),
            ridgeDirectionFieldContract: getRidgeDirectionFieldContract(),
            basinSeedsContract: getBasinSeedsContract(),
            arcFormationHelperContract: getArcFormationHelperContract(),
            hotspotVolcanicSeedHelperContract: getHotspotVolcanicSeedHelperContract(),
            platePressureFieldContract: getPlatePressureFieldContract(),
            mountainBeltCandidatesContract: getMountainBeltCandidatesContract(),
            plainLowlandSmoothingFieldContract: getPlainLowlandSmoothingFieldContract(),
            seedHooks: getTectonicSkeletonSeedHooks(0),
            plannedStages: PLANNED_STAGES.map((stage) => cloneValue(stage)),
            description: 'TectonicSkeletonGenerator scaffold with deterministic plate seed distribution, plate motion vectors, plate boundary classification, uplift field, subsidence field, fracture mask field, ridge direction field, basin seeds, arc formation helper, hotspot volcanic seed helper, plate pressure composite field, mountain-belt candidates, and plain/lowland smoothing field implemented; downstream landmass synthesis, marine flood fill, basin extraction, finalized mountain extraction, volcanic-zone extraction, and elevation composition remain TODO CONTRACTED.'
        };
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule(MODULE_ID, {
            entry: 'generateTectonicSkeleton',
            file: 'js/worldgen/macro/tectonic-skeleton-generator.js',
            description: 'Partial TectonicSkeletonGenerator scaffold with deterministic plate seed distribution, motion vectors, boundary classification, uplift field, subsidence field, fracture mask field, ridge direction field, basin seeds, arc formation helper, hotspot volcanic seed helper, plate pressure composite field, mountain-belt candidates, and plain/lowland smoothing field.',
            stub: true,
            partial: true
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep(PIPELINE_STEP_ID, {
            moduleId: MODULE_ID,
            file: 'js/worldgen/macro/tectonic-skeleton-generator.js',
            entry: 'generateTectonicSkeleton',
            description: 'Partial pipeline entry for tectonic skeleton generation with plate seed distribution, motion vectors, boundary classification, uplift field, subsidence field, fracture mask field, ridge direction field, basin seeds, arc formation helper, hotspot volcanic seed helper, plate pressure composite field, mountain-belt candidates, and plain/lowland smoothing field implemented.',
            stub: true,
            partial: true
        });
    }

    Object.assign(macro, {
        getTectonicSkeletonGeneratorDescriptor,
        getTectonicSkeletonInputContract,
        getTectonicSkeletonOutputContract,
        getPlateSeedDistributionContract,
        getPlateMotionVectorsContract,
        getPlateBoundaryClassificationContract,
        getUpliftFieldContract,
        getSubsidenceFieldContract,
        getFractureFieldContract,
        getRidgeDirectionFieldContract,
        getBasinSeedsContract,
        getArcFormationHelperContract,
        getHotspotVolcanicSeedHelperContract,
        getPlatePressureFieldContract,
        getMountainBeltCandidatesContract,
        getPlainLowlandSmoothingFieldContract,
        getTectonicSkeletonSeedHooks,
        generatePlateSeedDistribution,
        generatePlateMotionVectors,
        generatePlateBoundaryClassification,
        generateUpliftField,
        generateSubsidenceField,
        generateFractureField,
        generateRidgeDirectionField,
        generateBasinSeeds,
        generateArcFormationHelper,
        generateHotspotVolcanicSeedHelper,
        generatePlatePressureField,
        generateMountainBeltCandidates,
        generatePlainLowlandSmoothingField,
        buildTectonicFieldSnapshots,
        createTectonicSkeletonPipeline,
        generateTectonicSkeleton
    });
})();
