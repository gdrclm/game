(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const MODULE_ID = 'marineCarvingGenerator';
    const PIPELINE_STEP_ID = 'marineCarving';
    const PARTIAL_STATUS = 'PARTIAL_IMPLEMENTED';
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';
    const DEFAULT_WORLD_BOUNDS = Object.freeze({
        width: 256,
        height: 128
    });
    const DEFAULT_FIELD_RANGE = Object.freeze([0, 1]);
    const DEFAULT_LAND_THRESHOLD = 0.5;
    const MARINE_INVASION_FIELD_ID = 'marineInvasionField';
    const MARINE_INVASION_STAGE_ID = 'marineInvasionComposite';
    const BAY_CARVED_LAND_WATER_MASK_FIELD_ID = 'bayCarvedLandWaterMaskField';
    const STRAIT_CARVED_LAND_WATER_MASK_FIELD_ID = 'straitCarvedLandWaterMaskField';
    const ISLAND_CHAIN_FRAGMENTED_LAND_WATER_MASK_FIELD_ID = 'islandChainFragmentedLandWaterMaskField';
    const COAST_JAGGEDNESS_CONTROLLED_LAND_WATER_MASK_FIELD_ID = 'coastJaggednessControlledLandWaterMaskField';
    const BAY_CARVING_STAGE_ID = 'bayCarving';
    const STRAIT_CARVING_STAGE_ID = 'straitCarving';
    const ARCHIPELAGO_FRAGMENTATION_STAGE_ID = 'archipelagoFragmentation';
    const COAST_JAGGEDNESS_CONTROL_STAGE_ID = 'coastJaggednessControl';
    const DEFAULT_BAY_CARVE_RATIO = 0.008;
    const DEFAULT_BAY_CARVE_MAX = 128;
    const DEFAULT_BAY_CARVE_MIN_WATER_NEIGHBORS = 3;
    const DEFAULT_BAY_CARVE_MAX_WATER_NEIGHBORS = 5;
    const DEFAULT_STRAIT_CARVE_MAX = 32;
    const DEFAULT_STRAIT_CARVE_RATIO = 0.35;
    const DEFAULT_STRAIT_SCORE_THRESHOLD = 0.45;
    const DEFAULT_ARCHIPELAGO_FRAGMENT_MAX = 18;
    const DEFAULT_ARCHIPELAGO_FRAGMENT_RATIO = 0.5;
    const DEFAULT_ARCHIPELAGO_MIN_CHAIN_LENGTH = 3;
    const DEFAULT_ARCHIPELAGO_SCORE_THRESHOLD = 0.38;
    const DEFAULT_COAST_JAGGEDNESS_MAX = 48;
    const DEFAULT_COAST_JAGGEDNESS_RATIO = 0.012;
    const DEFAULT_COAST_JAGGEDNESS_TOLERANCE = 0.02;
    const INPUT_REQUIRED_KEYS = Object.freeze([
        'macroSeed'
    ]);
    const INPUT_OPTIONAL_KEYS = Object.freeze([
        'macroSeedProfile',
        'phase1Constraints',
        'worldBounds',
        'reliefElevation',
        'hydrosphere',
        'fields',
        'intermediateOutputs',
        'records',
        'debugOptions'
    ]);
    const FIELD_DEPENDENCIES = deepFreeze([
        {
            fieldId: 'landmassCleanupMaskField',
            sourceGroup: 'reliefElevation.outputs.fields',
            required: true,
            role: 'cleaned coastal baseline for deterministic bay carving'
        },
        {
            fieldId: 'oceanConnectivityMaskField',
            sourceGroup: 'hydrosphere.outputs.fields',
            required: true,
            role: 'open-ocean versus enclosed-water context for coastal carve bias'
        },
        {
            fieldId: 'seaLevelAppliedElevationField',
            sourceGroup: 'reliefElevation.outputs.fields',
            required: false,
            role: 'optional low-relief coastal support for bay carving bias'
        },
        {
            fieldId: 'basinDepressionField',
            sourceGroup: 'reliefElevation.outputs.fields',
            required: false,
            role: 'optional depression support for softer bay penetration bias'
        },
        {
            fieldId: 'fractureMaskField',
            sourceGroup: 'tectonicSkeleton.outputs.fields',
            required: false,
            role: 'optional tectonic weakness support for strait carving'
        },
        {
            fieldId: 'platePressureField',
            sourceGroup: 'tectonicSkeleton.outputs.fields',
            required: false,
            role: 'optional tectonic resistance context for strait carving'
        },
        {
            fieldId: 'coastalShelfDepthField',
            sourceGroup: 'hydrosphere.outputs.fields',
            required: false,
            role: 'optional shelf-like depth context for marine invasion composite analysis'
        }
    ]);
    const INTERMEDIATE_DEPENDENCIES = deepFreeze([
        {
            outputId: 'oceanBasinFloodFill',
            sourceGroup: 'hydrosphere.outputs.intermediateOutputs',
            required: false,
            role: 'optional basin metadata for future inland-sea-aware carving refinement and distinct-basin strait tests'
        },
        {
            outputId: 'seaRegionClusters',
            sourceGroup: 'hydrosphere.outputs.intermediateOutputs',
            required: false,
            role: 'optional sea-region context for later post-carve re-clustering'
        },
        {
            outputId: 'coastalDepthApproximation',
            sourceGroup: 'hydrosphere.outputs.intermediateOutputs',
            required: false,
            role: 'optional shelf/depth-zone summary context for later coastal analyzers'
        }
    ]);
    const PLANNED_OUTPUTS = deepFreeze({
        fields: [
            MARINE_INVASION_FIELD_ID,
            BAY_CARVED_LAND_WATER_MASK_FIELD_ID,
            STRAIT_CARVED_LAND_WATER_MASK_FIELD_ID,
            ISLAND_CHAIN_FRAGMENTED_LAND_WATER_MASK_FIELD_ID,
            COAST_JAGGEDNESS_CONTROLLED_LAND_WATER_MASK_FIELD_ID
        ],
        intermediateOutputs: [
            'marineCarvingPlan',
            'bayCarvingSummary',
            'straitCarvingSummary',
            'archipelagoFragmentationSummary',
            'coastJaggednessControlSummary'
        ],
        records: [],
        debugArtifacts: []
    });
    const PLANNED_STAGES = deepFreeze([
        {
            stageId: 'dependencyIntake',
            seedScope: 'dependencyIntake',
            plannedOutputs: ['dependencyAvailability']
        },
        {
            stageId: MARINE_INVASION_STAGE_ID,
            seedScope: 'marineInvasion',
            plannedOutputs: [MARINE_INVASION_FIELD_ID]
        },
        {
            stageId: BAY_CARVING_STAGE_ID,
            seedScope: 'bayCarving',
            plannedOutputs: [
                BAY_CARVED_LAND_WATER_MASK_FIELD_ID,
                'bayCarvingSummary'
            ]
        },
        {
            stageId: STRAIT_CARVING_STAGE_ID,
            seedScope: 'straitCarving',
            plannedOutputs: [
                STRAIT_CARVED_LAND_WATER_MASK_FIELD_ID,
                'straitCarvingSummary'
            ]
        },
        {
            stageId: ARCHIPELAGO_FRAGMENTATION_STAGE_ID,
            seedScope: 'archipelagoFragmentation',
            plannedOutputs: [
                ISLAND_CHAIN_FRAGMENTED_LAND_WATER_MASK_FIELD_ID,
                'archipelagoFragmentationSummary'
            ]
        },
        {
            stageId: COAST_JAGGEDNESS_CONTROL_STAGE_ID,
            seedScope: 'coastJaggednessControl',
            plannedOutputs: [
                COAST_JAGGEDNESS_CONTROLLED_LAND_WATER_MASK_FIELD_ID,
                'coastJaggednessControlSummary'
            ]
        }
    ]);
    const INTENTIONALLY_ABSENT_OUTPUTS = Object.freeze([
        'inlandSeas',
        'islandChains',
        'archipelagoCorridors',
        'chokepoints',
        'controlMetrics',
        'seaRegions',
        'routeGraph',
        'harborScoring',
        'riverDeltas',
        'climateLogic',
        'terrainCells',
        'gameplaySemantics'
    ]);
    const EIGHT_NEIGHBOR_OFFSETS = Object.freeze([
        { dx: -1, dy: -1, label: 'northWest' },
        { dx: 0, dy: -1, label: 'north' },
        { dx: 1, dy: -1, label: 'northEast' },
        { dx: 1, dy: 0, label: 'east' },
        { dx: 1, dy: 1, label: 'southEast' },
        { dx: 0, dy: 1, label: 'south' },
        { dx: -1, dy: 1, label: 'southWest' },
        { dx: -1, dy: 0, label: 'west' }
    ]);
    const CARDINAL_RING_POSITIONS = Object.freeze({
        north: 1,
        east: 3,
        south: 5,
        west: 7
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
            return value.map(cloneValue);
        }

        if (value && typeof value === 'object') {
            return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [
                key,
                cloneValue(nestedValue)
            ]));
        }

        return value;
    }

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function normalizeSeed(seed) {
        if (typeof macro.normalizeSeed === 'function') {
            return macro.normalizeSeed(seed);
        }

        const numericSeed = Number(seed);
        return Number.isFinite(numericSeed) ? numericSeed >>> 0 : 0;
    }

    function normalizeWorldBounds(worldBounds = DEFAULT_WORLD_BOUNDS) {
        const width = Number(worldBounds.width);
        const height = Number(worldBounds.height);

        return {
            width: Number.isFinite(width) && width > 0 ? Math.trunc(width) : DEFAULT_WORLD_BOUNDS.width,
            height: Number.isFinite(height) && height > 0 ? Math.trunc(height) : DEFAULT_WORLD_BOUNDS.height
        };
    }

    function normalizeInteger(value, fallback = 0) {
        const numericValue = Number(value);
        return Number.isFinite(numericValue)
            ? Math.max(0, Math.trunc(numericValue))
            : fallback;
    }

    function normalizeString(value, fallback = '') {
        return typeof value === 'string' && value.trim()
            ? value.trim()
            : fallback;
    }

    function clampUnitInterval(value, fallback = 0) {
        const numericValue = Number(value);
        const safeValue = Number.isFinite(numericValue) ? numericValue : fallback;
        return Math.max(0, Math.min(1, safeValue));
    }

    function roundFieldValue(value) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 0;
        }

        return Math.round(numericValue * 1000000) / 1000000;
    }

    function buildNamespace(...parts) {
        if (typeof macro.buildMacroSubSeedNamespace === 'function') {
            return macro.buildMacroSubSeedNamespace(...parts);
        }

        return ['macro', ...parts].flat().filter(Boolean).join('.');
    }

    function deriveSubSeed(masterSeed, namespace) {
        if (typeof macro.deriveMacroSubSeed === 'function') {
            return macro.deriveMacroSubSeed(masterSeed, namespace);
        }

        return normalizeSeed(masterSeed);
    }

    function normalizeInput(input = {}) {
        const sourceInput = isPlainObject(input) ? input : {};
        return {
            macroSeed: normalizeSeed(sourceInput.macroSeed ?? sourceInput.seed),
            macroSeedProfile: isPlainObject(sourceInput.macroSeedProfile) ? cloneValue(sourceInput.macroSeedProfile) : {},
            phase1Constraints: isPlainObject(sourceInput.phase1Constraints) ? cloneValue(sourceInput.phase1Constraints) : {},
            worldBounds: normalizeWorldBounds(sourceInput.worldBounds),
            debugOptions: isPlainObject(sourceInput.debugOptions) ? cloneValue(sourceInput.debugOptions) : {}
        };
    }

    function normalizePhase1ConstraintValue(fieldId, value) {
        if (typeof macro.normalizePhase1SeedConstraintValue === 'function') {
            return macro.normalizePhase1SeedConstraintValue(fieldId, value);
        }

        return clampUnitInterval(value, 0.5);
    }

    function getCoastJaggednessConstraint(input = {}, normalizedInput = normalizeInput(input)) {
        const rawConstraintValue = normalizedInput.phase1Constraints.coastJaggedness
            ?? normalizedInput.macroSeedProfile.coastJaggedness
            ?? 0.5;
        return roundFieldValue(normalizePhase1ConstraintValue('coastJaggedness', rawConstraintValue));
    }

    function addContainer(containers, value) {
        if (isPlainObject(value)) {
            containers.push(value);
        }
    }

    function buildDependencyContainers(input = {}) {
        const sourceInput = isPlainObject(input) ? input : {};
        const reliefElevation = isPlainObject(sourceInput.reliefElevation) ? sourceInput.reliefElevation : {};
        const hydrosphere = isPlainObject(sourceInput.hydrosphere) ? sourceInput.hydrosphere : {};
        const directOutputs = isPlainObject(sourceInput.outputs) ? sourceInput.outputs : {};
        const reliefOutputs = isPlainObject(reliefElevation.outputs) ? reliefElevation.outputs : {};
        const hydrosphereOutputs = isPlainObject(hydrosphere.outputs) ? hydrosphere.outputs : {};

        const fieldContainers = [];
        addContainer(fieldContainers, sourceInput.fields);
        addContainer(fieldContainers, directOutputs.fields);
        addContainer(fieldContainers, reliefElevation.fields);
        addContainer(fieldContainers, hydrosphere.fields);
        addContainer(fieldContainers, reliefOutputs.fields);
        addContainer(fieldContainers, hydrosphereOutputs.fields);

        const intermediateContainers = [];
        addContainer(intermediateContainers, sourceInput.intermediateOutputs);
        addContainer(intermediateContainers, directOutputs.intermediateOutputs);
        addContainer(intermediateContainers, reliefElevation.intermediateOutputs);
        addContainer(intermediateContainers, hydrosphere.intermediateOutputs);
        addContainer(intermediateContainers, reliefOutputs.intermediateOutputs);
        addContainer(intermediateContainers, hydrosphereOutputs.intermediateOutputs);

        const recordContainers = [];
        addContainer(recordContainers, sourceInput.records);
        addContainer(recordContainers, directOutputs.records);
        addContainer(recordContainers, reliefElevation.records);
        addContainer(recordContainers, hydrosphere.records);
        addContainer(recordContainers, reliefOutputs.records);
        addContainer(recordContainers, hydrosphereOutputs.records);

        return {
            fields: fieldContainers,
            intermediateOutputs: intermediateContainers,
            records: recordContainers
        };
    }

    function dependencyExists(containers, dependencyId) {
        return containers.some((container) => Object.prototype.hasOwnProperty.call(container, dependencyId));
    }

    function findDependencyValue(containers, dependencyId) {
        for (let index = 0; index < containers.length; index += 1) {
            const container = containers[index];
            if (Object.prototype.hasOwnProperty.call(container, dependencyId)) {
                return container[dependencyId];
            }
        }

        return null;
    }

    function describeDependencyAvailability(dependencies, containers, keyName) {
        return dependencies.map((dependency) => {
            const dependencyId = dependency[keyName];
            return {
                ...cloneValue(dependency),
                available: dependencyExists(containers, dependencyId)
            };
        });
    }

    function describeMarineCarvingDependencyAvailability(input = {}) {
        const containers = buildDependencyContainers(input);
        const fields = describeDependencyAvailability(FIELD_DEPENDENCIES, containers.fields, 'fieldId');
        const intermediateOutputs = describeDependencyAvailability(INTERMEDIATE_DEPENDENCIES, containers.intermediateOutputs, 'outputId');
        const missingRequired = fields
            .concat(intermediateOutputs)
            .filter((dependency) => dependency.required && !dependency.available)
            .map((dependency) => dependency.fieldId || dependency.outputId);

        return {
            fields,
            intermediateOutputs,
            missingRequired
        };
    }

    function createEmptyMarineCarvingOutputs() {
        return {
            fields: {},
            intermediateOutputs: {},
            records: {},
            debugArtifacts: []
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

    function serializeMaskField(fieldId, worldBounds, values, extra = {}) {
        const normalizedBounds = normalizeWorldBounds(worldBounds);
        const size = normalizedBounds.width * normalizedBounds.height;
        const normalizedValues = Array.isArray(values)
            ? values.slice(0, size).map((value) => clampUnitInterval(value, 0))
            : [];

        while (normalizedValues.length < size) {
            normalizedValues.push(0);
        }

        return {
            fieldType: 'MaskField',
            fieldId,
            worldBounds: cloneValue(normalizedBounds),
            width: normalizedBounds.width,
            height: normalizedBounds.height,
            size,
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: 'rowMajorFloatArray',
            values: normalizedValues,
            stats: buildFieldStats(normalizedValues),
            ...extra
        };
    }

    function serializeScalarField(fieldId, worldBounds, values, extra = {}) {
        const normalizedBounds = normalizeWorldBounds(worldBounds);
        const size = normalizedBounds.width * normalizedBounds.height;
        const normalizedValues = Array.isArray(values)
            ? values.slice(0, size).map((value) => clampUnitInterval(value, 0))
            : [];

        while (normalizedValues.length < size) {
            normalizedValues.push(0);
        }

        return {
            fieldType: 'ScalarField',
            fieldId,
            worldBounds: cloneValue(normalizedBounds),
            width: normalizedBounds.width,
            height: normalizedBounds.height,
            size,
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: 'rowMajorFloatArray',
            values: normalizedValues,
            stats: buildFieldStats(normalizedValues),
            ...extra
        };
    }

    function normalizeSerializedField(field, fallbackBounds = DEFAULT_WORLD_BOUNDS, options = {}) {
        const fallbackValue = clampUnitInterval(options.fallbackValue, 0);
        const fallbackThreshold = clampUnitInterval(options.fallbackThreshold, DEFAULT_LAND_THRESHOLD);
        const fallbackFieldId = normalizeString(options.fallbackFieldId, 'serializedField');

        if (!field || typeof field !== 'object') {
            const fallback = normalizeWorldBounds(fallbackBounds);
            return {
                fieldId: fallbackFieldId,
                width: fallback.width,
                height: fallback.height,
                size: fallback.width * fallback.height,
                threshold: fallbackThreshold,
                values: new Array(fallback.width * fallback.height).fill(fallbackValue)
            };
        }

        const width = normalizeInteger(field.width, fallbackBounds.width);
        const height = normalizeInteger(field.height, fallbackBounds.height);
        const size = width * height;
        let values = [];

        if (Array.isArray(field.values)) {
            values = field.values.slice(0, size).map((value) => clampUnitInterval(value, fallbackValue));
        } else if (typeof field.cloneValues === 'function') {
            values = Array.from(field.cloneValues()).slice(0, size).map((value) => clampUnitInterval(value, fallbackValue));
        } else if (typeof field.read === 'function') {
            values = [];
            for (let y = 0; y < height; y += 1) {
                for (let x = 0; x < width; x += 1) {
                    values.push(clampUnitInterval(field.read(x, y, fallbackValue), fallbackValue));
                }
            }
        }

        while (values.length < size) {
            values.push(fallbackValue);
        }

        return {
            fieldId: normalizeString(field.fieldId, fallbackFieldId),
            width,
            height,
            size,
            threshold: clampUnitInterval(field.threshold, fallbackThreshold),
            values
        };
    }

    function getSourceFieldInputs(input = {}) {
        const containers = buildDependencyContainers(input);
        return {
            landmassCleanupMaskField: findDependencyValue(containers.fields, 'landmassCleanupMaskField'),
            oceanConnectivityMaskField: findDependencyValue(containers.fields, 'oceanConnectivityMaskField'),
            seaLevelAppliedElevationField: findDependencyValue(containers.fields, 'seaLevelAppliedElevationField'),
            basinDepressionField: findDependencyValue(containers.fields, 'basinDepressionField'),
            fractureMaskField: findDependencyValue(containers.fields, 'fractureMaskField'),
            platePressureField: findDependencyValue(containers.fields, 'platePressureField'),
            coastalShelfDepthField: findDependencyValue(containers.fields, 'coastalShelfDepthField')
        };
    }

    function getSourceIntermediateOutputs(input = {}) {
        const containers = buildDependencyContainers(input);
        return {
            oceanBasinFloodFill: findDependencyValue(containers.intermediateOutputs, 'oceanBasinFloodFill'),
            seaRegionClusters: findDependencyValue(containers.intermediateOutputs, 'seaRegionClusters'),
            coastalDepthApproximation: findDependencyValue(containers.intermediateOutputs, 'coastalDepthApproximation')
        };
    }

    function getBaseLandMaskField(input = {}, normalizedInput = normalizeInput(input)) {
        const sourceFields = getSourceFieldInputs(input);
        return normalizeSerializedField(
            sourceFields.landmassCleanupMaskField,
            normalizedInput.worldBounds,
            {
                fallbackValue: 1,
                fallbackThreshold: DEFAULT_LAND_THRESHOLD,
                fallbackFieldId: 'landmassCleanupMaskField'
            }
        );
    }

    function getOceanConnectivityField(input = {}, normalizedInput = normalizeInput(input)) {
        const sourceFields = getSourceFieldInputs(input);
        return normalizeSerializedField(
            sourceFields.oceanConnectivityMaskField,
            normalizedInput.worldBounds,
            {
                fallbackValue: 0,
                fallbackThreshold: 0,
                fallbackFieldId: 'oceanConnectivityMaskField'
            }
        );
    }

    function getSeaLevelField(input = {}, normalizedInput = normalizeInput(input)) {
        const sourceFields = getSourceFieldInputs(input);
        return normalizeSerializedField(
            sourceFields.seaLevelAppliedElevationField,
            normalizedInput.worldBounds,
            {
                fallbackValue: 1,
                fallbackThreshold: DEFAULT_LAND_THRESHOLD,
                fallbackFieldId: 'seaLevelAppliedElevationField'
            }
        );
    }

    function getBasinDepressionField(input = {}, normalizedInput = normalizeInput(input)) {
        const sourceFields = getSourceFieldInputs(input);
        return normalizeSerializedField(
            sourceFields.basinDepressionField,
            normalizedInput.worldBounds,
            {
                fallbackValue: 0,
                fallbackThreshold: 0,
                fallbackFieldId: 'basinDepressionField'
            }
        );
    }

    function getFractureMaskField(input = {}, normalizedInput = normalizeInput(input)) {
        const sourceFields = getSourceFieldInputs(input);
        return normalizeSerializedField(
            sourceFields.fractureMaskField,
            normalizedInput.worldBounds,
            {
                fallbackValue: 0,
                fallbackThreshold: 0,
                fallbackFieldId: 'fractureMaskField'
            }
        );
    }

    function getPlatePressureField(input = {}, normalizedInput = normalizeInput(input)) {
        const sourceFields = getSourceFieldInputs(input);
        return normalizeSerializedField(
            sourceFields.platePressureField,
            normalizedInput.worldBounds,
            {
                fallbackValue: 0.5,
                fallbackThreshold: 0,
                fallbackFieldId: 'platePressureField'
            }
        );
    }

    function getCoastalShelfDepthField(input = {}, normalizedInput = normalizeInput(input)) {
        const sourceFields = getSourceFieldInputs(input);
        return normalizeSerializedField(
            sourceFields.coastalShelfDepthField,
            normalizedInput.worldBounds,
            {
                fallbackValue: 0,
                fallbackThreshold: 0,
                fallbackFieldId: 'coastalShelfDepthField'
            }
        );
    }

    function pointFromIndex(index, width) {
        return {
            x: index % width,
            y: Math.floor(index / width)
        };
    }

    function indexFromPoint(x, y, width) {
        return (y * width) + x;
    }

    function hashUint32(seed, value) {
        let hash = normalizeSeed(seed) ^ normalizeSeed(value);
        hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
        hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
        hash ^= hash >>> 16;
        return hash >>> 0;
    }

    function deterministicUnitNoise(seed, index) {
        return roundFieldValue(hashUint32(seed, index) / 0xFFFFFFFF);
    }

    function countCircularTrueGroups(flags = []) {
        const length = flags.length;
        if (!length || !flags.some(Boolean)) {
            return 0;
        }

        let groups = 0;
        for (let index = 0; index < length; index += 1) {
            const current = Boolean(flags[index]);
            const previous = Boolean(flags[(index - 1 + length) % length]);
            if (current && !previous) {
                groups += 1;
            }
        }

        return groups;
    }

    function getMaxCircularTrueRun(flags = []) {
        const length = flags.length;
        if (!length || !flags.some(Boolean)) {
            return 0;
        }

        const doubled = flags.concat(flags);
        let maxRun = 0;
        let currentRun = 0;
        for (let index = 0; index < doubled.length; index += 1) {
            if (doubled[index]) {
                currentRun += 1;
                maxRun = Math.max(maxRun, currentRun);
            } else {
                currentRun = 0;
            }
        }

        return Math.min(length, maxRun);
    }

    function getNeighborIndices(index, width, height) {
        const point = pointFromIndex(index, width);
        const neighborIndices = [];

        for (let offsetIndex = 0; offsetIndex < EIGHT_NEIGHBOR_OFFSETS.length; offsetIndex += 1) {
            const offset = EIGHT_NEIGHBOR_OFFSETS[offsetIndex];
            const neighborX = point.x + offset.dx;
            const neighborY = point.y + offset.dy;
            if (neighborX < 0 || neighborY < 0 || neighborX >= width || neighborY >= height) {
                continue;
            }

            neighborIndices.push(indexFromPoint(neighborX, neighborY, width));
        }

        return neighborIndices;
    }

    function createRingDescriptors(index, width, height, landValues, landThreshold, oceanValues) {
        const point = pointFromIndex(index, width);
        const descriptors = [];

        for (let offsetIndex = 0; offsetIndex < EIGHT_NEIGHBOR_OFFSETS.length; offsetIndex += 1) {
            const offset = EIGHT_NEIGHBOR_OFFSETS[offsetIndex];
            const neighborX = point.x + offset.dx;
            const neighborY = point.y + offset.dy;
            if (neighborX < 0 || neighborY < 0 || neighborX >= width || neighborY >= height) {
                return null;
            }

            const neighborIndex = indexFromPoint(neighborX, neighborY, width);
            const landValue = clampUnitInterval(landValues[neighborIndex], 0);
            const oceanValue = clampUnitInterval(oceanValues[neighborIndex], 0);
            descriptors.push({
                neighborIndex,
                x: neighborX,
                y: neighborY,
                dx: offset.dx,
                dy: offset.dy,
                label: offset.label,
                landValue,
                oceanValue,
                isLand: landValue >= landThreshold
            });
        }

        return descriptors;
    }

    function measureInlandSupport(index, width, height, landValues, landThreshold, inwardDirection, maxSteps = 2) {
        if ((!inwardDirection.dx && !inwardDirection.dy) || maxSteps <= 0) {
            return 0;
        }

        const point = pointFromIndex(index, width);
        let supportDepth = 0;

        for (let step = 1; step <= maxSteps; step += 1) {
            const sampleX = point.x + (inwardDirection.dx * step);
            const sampleY = point.y + (inwardDirection.dy * step);
            if (sampleX < 0 || sampleY < 0 || sampleX >= width || sampleY >= height) {
                break;
            }

            const sampleIndex = indexFromPoint(sampleX, sampleY, width);
            if (clampUnitInterval(landValues[sampleIndex], 0) < landThreshold) {
                break;
            }

            supportDepth += 1;
        }

        return supportDepth;
    }

    function buildCandidateMetrics(index, worldBounds, baseLandMask, oceanConnectivityField, seaLevelField, basinField, stageSeed) {
        const width = worldBounds.width;
        const height = worldBounds.height;
        const point = pointFromIndex(index, width);
        if (point.x <= 0 || point.y <= 0 || point.x >= width - 1 || point.y >= height - 1) {
            return null;
        }

        const landThreshold = clampUnitInterval(baseLandMask.threshold, DEFAULT_LAND_THRESHOLD);
        const landValue = clampUnitInterval(baseLandMask.values[index], 0);
        if (landValue < landThreshold) {
            return null;
        }

        const ringDescriptors = createRingDescriptors(
            index,
            width,
            height,
            baseLandMask.values,
            landThreshold,
            oceanConnectivityField.values
        );
        if (!ringDescriptors) {
            return null;
        }

        const waterFlags = ringDescriptors.map((descriptor) => !descriptor.isLand);
        const waterNeighbors = ringDescriptors.filter((descriptor) => !descriptor.isLand);
        const waterNeighborCount = waterNeighbors.length;
        if (waterNeighborCount < DEFAULT_BAY_CARVE_MIN_WATER_NEIGHBORS || waterNeighborCount > DEFAULT_BAY_CARVE_MAX_WATER_NEIGHBORS) {
            return null;
        }

        const waterGroupCount = countCircularTrueGroups(waterFlags);
        if (waterGroupCount !== 1) {
            return null;
        }

        const maxWaterRun = getMaxCircularTrueRun(waterFlags);
        if (maxWaterRun < 3) {
            return null;
        }

        const cardinalWater = {
            north: !ringDescriptors[CARDINAL_RING_POSITIONS.north].isLand,
            east: !ringDescriptors[CARDINAL_RING_POSITIONS.east].isLand,
            south: !ringDescriptors[CARDINAL_RING_POSITIONS.south].isLand,
            west: !ringDescriptors[CARDINAL_RING_POSITIONS.west].isLand
        };
        if ((cardinalWater.north && cardinalWater.south) || (cardinalWater.east && cardinalWater.west)) {
            return null;
        }

        const openOceanNeighborCount = waterNeighbors.filter((descriptor) => descriptor.oceanValue >= 0.75).length;
        const enclosedWaterNeighborCount = waterNeighbors.filter((descriptor) => descriptor.oceanValue >= 0.25 && descriptor.oceanValue < 0.75).length;
        const coastalExposure = roundFieldValue(waterNeighborCount / ringDescriptors.length);
        const openOceanExposure = roundFieldValue(openOceanNeighborCount / Math.max(1, waterNeighborCount));
        const enclosedWaterExposure = roundFieldValue(enclosedWaterNeighborCount / Math.max(1, waterNeighborCount));
        const seaLevelValue = clampUnitInterval(seaLevelField.values[index], 1);
        const lowReliefBias = roundFieldValue(1 - seaLevelValue);
        const basinSupport = clampUnitInterval(basinField.values[index], 0);
        const waterDx = waterNeighbors.reduce((total, descriptor) => total + descriptor.dx, 0);
        const waterDy = waterNeighbors.reduce((total, descriptor) => total + descriptor.dy, 0);
        const inwardDirection = {
            dx: waterDx === 0 ? 0 : -Math.sign(waterDx),
            dy: waterDy === 0 ? 0 : -Math.sign(waterDy)
        };
        const inlandSupportDepth = measureInlandSupport(
            index,
            width,
            height,
            baseLandMask.values,
            landThreshold,
            inwardDirection,
            2
        );
        if (inlandSupportDepth < 2) {
            return null;
        }

        const noise = deterministicUnitNoise(stageSeed, index);
        const score = roundFieldValue(
            (coastalExposure * 0.28)
            + ((maxWaterRun / 8) * 0.18)
            + (openOceanExposure * 0.22)
            + (lowReliefBias * 0.16)
            + ((inlandSupportDepth / 2) * 0.1)
            + (basinSupport * 0.08)
            + (noise * 0.06)
        );

        return {
            cellIndex: index,
            x: point.x,
            y: point.y,
            score,
            waterNeighborCount,
            waterGroupCount,
            maxWaterRun,
            coastalExposure,
            openOceanNeighborCount,
            enclosedWaterNeighborCount,
            openOceanExposure,
            enclosedWaterExposure,
            seaLevelValue: roundFieldValue(seaLevelValue),
            basinSupport: roundFieldValue(basinSupport),
            lowReliefBias,
            inlandSupportDepth,
            inwardDirection,
            noise,
            edgeProfile: cloneValue(cardinalWater),
            oceanExposureType: openOceanNeighborCount > 0
                ? (enclosedWaterNeighborCount > 0 ? 'mixed' : 'open_ocean')
                : 'enclosed_water'
        };
    }

    function selectBayCandidates(candidates, width, height, carveBudget) {
        const sortedCandidates = candidates
            .slice()
            .sort((left, right) => {
                if (right.score !== left.score) {
                    return right.score - left.score;
                }
                return left.cellIndex - right.cellIndex;
            });
        const blockedIndices = new Set();
        const selected = [];

        for (let index = 0; index < sortedCandidates.length; index += 1) {
            if (selected.length >= carveBudget) {
                break;
            }

            const candidate = sortedCandidates[index];
            if (blockedIndices.has(candidate.cellIndex)) {
                continue;
            }

            selected.push(candidate);
            blockedIndices.add(candidate.cellIndex);
            getNeighborIndices(candidate.cellIndex, width, height).forEach((neighborIndex) => {
                blockedIndices.add(neighborIndex);
            });
        }

        return selected;
    }

    function materializeBayCarving(input = {}) {
        const normalizedInput = normalizeInput(input);
        const baseLandMask = getBaseLandMaskField(input, normalizedInput);
        const oceanConnectivityField = getOceanConnectivityField(input, normalizedInput);
        const seaLevelField = getSeaLevelField(input, normalizedInput);
        const basinField = getBasinDepressionField(input, normalizedInput);
        const worldBounds = normalizeWorldBounds({
            width: baseLandMask.width,
            height: baseLandMask.height
        });
        const size = worldBounds.width * worldBounds.height;
        const baseLandValues = baseLandMask.values.slice(0, size).map((value) => clampUnitInterval(value, 0));
        const landThreshold = clampUnitInterval(baseLandMask.threshold, DEFAULT_LAND_THRESHOLD);
        const stageNamespace = buildNamespace(PIPELINE_STEP_ID, 'bayCarving');
        const stageSeed = deriveSubSeed(normalizedInput.macroSeed, stageNamespace);
        const candidates = [];
        let coastalLandCellCount = 0;

        for (let index = 0; index < size; index += 1) {
            const landValue = clampUnitInterval(baseLandValues[index], 0);
            if (landValue < landThreshold) {
                continue;
            }

            const point = pointFromIndex(index, worldBounds.width);
            if (point.x <= 0 || point.y <= 0 || point.x >= worldBounds.width - 1 || point.y >= worldBounds.height - 1) {
                continue;
            }

            const ringDescriptors = createRingDescriptors(
                index,
                worldBounds.width,
                worldBounds.height,
                baseLandValues,
                landThreshold,
                oceanConnectivityField.values
            );
            if (!ringDescriptors) {
                continue;
            }

            if (ringDescriptors.some((descriptor) => !descriptor.isLand)) {
                coastalLandCellCount += 1;
            } else {
                continue;
            }

            const candidate = buildCandidateMetrics(
                index,
                worldBounds,
                baseLandMask,
                oceanConnectivityField,
                seaLevelField,
                basinField,
                stageSeed
            );
            if (candidate) {
                candidates.push(candidate);
            }
        }

        const carveBudget = Math.min(
            DEFAULT_BAY_CARVE_MAX,
            Math.max(1, Math.round(coastalLandCellCount * DEFAULT_BAY_CARVE_RATIO))
        );
        const selectedCandidates = selectBayCandidates(candidates, worldBounds.width, worldBounds.height, carveBudget);
        const carvedValues = baseLandValues.slice();
        selectedCandidates.forEach((candidate) => {
            carvedValues[candidate.cellIndex] = 0;
        });

        const bayCarvedLandWaterMaskField = serializeMaskField(
            BAY_CARVED_LAND_WATER_MASK_FIELD_ID,
            worldBounds,
            carvedValues,
            {
                stageId: BAY_CARVING_STAGE_ID,
                sourceFieldIds: [
                    baseLandMask.fieldId,
                    oceanConnectivityField.fieldId,
                    seaLevelField.fieldId,
                    basinField.fieldId
                ],
                threshold: landThreshold,
                semantics: {
                    allowedValue: 1,
                    blockedValue: 0,
                    allowedMeaning: 'land',
                    blockedMeaning: 'water'
                },
                carvingModel: 'deterministicCoastalBayNotchingV1',
                compatibility: {
                    futureStraitCarvingInput: true,
                    futureSeaRegionRebuildInput: true,
                    futureCoastalOpportunityInput: true,
                    sameWorldBoundsRequired: true
                }
            }
        );

        const bayCarvingSummary = {
            bayCarvingId: BAY_CARVING_STAGE_ID,
            stageId: BAY_CARVING_STAGE_ID,
            sourceFieldIds: [
                baseLandMask.fieldId,
                oceanConnectivityField.fieldId,
                seaLevelField.fieldId,
                basinField.fieldId
            ],
            worldBounds: cloneValue(worldBounds),
            coastalLandCellCount,
            candidateCount: candidates.length,
            carveBudget,
            carvedCellCount: selectedCandidates.length,
            carvedCellRatio: roundFieldValue(selectedCandidates.length / Math.max(1, coastalLandCellCount)),
            carvingModel: 'deterministicCoastalBayNotchingV1',
            carvedCells: selectedCandidates.map((candidate) => ({
                cellIndex: candidate.cellIndex,
                x: candidate.x,
                y: candidate.y,
                score: candidate.score,
                waterNeighborCount: candidate.waterNeighborCount,
                waterGroupCount: candidate.waterGroupCount,
                maxWaterRun: candidate.maxWaterRun,
                coastalExposure: candidate.coastalExposure,
                oceanExposureType: candidate.oceanExposureType,
                openOceanExposure: candidate.openOceanExposure,
                enclosedWaterExposure: candidate.enclosedWaterExposure,
                seaLevelValue: candidate.seaLevelValue,
                basinSupport: candidate.basinSupport,
                inlandSupportDepth: candidate.inlandSupportDepth,
                inwardDirection: cloneValue(candidate.inwardDirection),
                edgeProfile: cloneValue(candidate.edgeProfile)
            })),
            summary: {
                strongestBayCandidateScore: Math.max(0, ...selectedCandidates.map((candidate) => candidate.score)),
                strongestOpenOceanCandidateScore: Math.max(
                    0,
                    ...selectedCandidates
                        .filter((candidate) => candidate.oceanExposureType === 'open_ocean' || candidate.oceanExposureType === 'mixed')
                        .map((candidate) => candidate.score)
                ),
                strongestEnclosedWaterCandidateScore: Math.max(
                    0,
                    ...selectedCandidates
                        .filter((candidate) => candidate.oceanExposureType === 'enclosed_water')
                        .map((candidate) => candidate.score)
                ),
                usedOpenOceanCandidates: selectedCandidates.filter((candidate) => candidate.oceanExposureType !== 'enclosed_water').length,
                usedEnclosedWaterCandidates: selectedCandidates.filter((candidate) => candidate.oceanExposureType === 'enclosed_water').length
            },
            compatibility: {
                futureStraitCarvingInput: true,
                futureSeaRegionRebuildInput: true,
                futureCoastalOpportunityInput: true,
                sameWorldBoundsRequired: true
            },
            intentionallyAbsent: [
                'straits',
                'harborScoring',
                'routeGraph',
                'riverDeltas',
                'terrainCells',
                'gameplaySemantics'
            ]
        };

        return {
            bayCarvedLandWaterMaskField,
            bayCarvingSummary
        };
    }

    function buildOceanBasinLookup(worldBounds, oceanBasinFloodFill = null) {
        const normalizedBounds = normalizeWorldBounds(worldBounds);
        const size = normalizedBounds.width * normalizedBounds.height;
        const basinIds = new Array(size).fill('');
        const basinKinds = new Array(size).fill('');

        if (!oceanBasinFloodFill || !Array.isArray(oceanBasinFloodFill.waterBasins)) {
            return {
                basinIds,
                basinKinds
            };
        }

        oceanBasinFloodFill.waterBasins.forEach((basin) => {
            const basinId = normalizeString(basin.basinId, '');
            const basinKind = normalizeString(basin.basinKind, '');
            if (!basinId || !Array.isArray(basin.cellIndices)) {
                return;
            }

            basin.cellIndices.forEach((cellIndex) => {
                if (cellIndex < 0 || cellIndex >= size) {
                    return;
                }

                basinIds[cellIndex] = basinId;
                basinKinds[cellIndex] = basinKind;
            });
        });

        return {
            basinIds,
            basinKinds
        };
    }

    function resolveDirectionalWaterBody(startIndex, direction, worldBounds, landValues, landThreshold, basinLookup, maxSteps = 4) {
        const width = worldBounds.width;
        const height = worldBounds.height;
        const point = pointFromIndex(startIndex, width);

        for (let step = 1; step <= maxSteps; step += 1) {
            const sampleX = point.x + (direction.dx * step);
            const sampleY = point.y + (direction.dy * step);
            if (sampleX < 0 || sampleY < 0 || sampleX >= width || sampleY >= height) {
                return null;
            }

            const sampleIndex = indexFromPoint(sampleX, sampleY, width);
            const landValue = clampUnitInterval(landValues[sampleIndex], 0);
            if (landValue >= landThreshold) {
                return null;
            }

            const basinId = normalizeString(basinLookup.basinIds[sampleIndex], '');
            const basinKind = normalizeString(basinLookup.basinKinds[sampleIndex], '');
            if (basinId) {
                return {
                    basinId,
                    basinKind,
                    step,
                    cellIndex: sampleIndex
                };
            }
        }

        return null;
    }

    function buildStraitCandidateMetrics(index, worldBounds, straitBaseMaskField, fractureField, platePressureField, seaLevelField, basinField, basinLookup, stageSeed) {
        const width = worldBounds.width;
        const height = worldBounds.height;
        const point = pointFromIndex(index, width);
        if (point.x <= 0 || point.y <= 0 || point.x >= width - 1 || point.y >= height - 1) {
            return null;
        }

        const landThreshold = clampUnitInterval(straitBaseMaskField.threshold, DEFAULT_LAND_THRESHOLD);
        const landValue = clampUnitInterval(straitBaseMaskField.values[index], 0);
        if (landValue < landThreshold) {
            return null;
        }

        const northIndex = indexFromPoint(point.x, point.y - 1, width);
        const southIndex = indexFromPoint(point.x, point.y + 1, width);
        const eastIndex = indexFromPoint(point.x + 1, point.y, width);
        const westIndex = indexFromPoint(point.x - 1, point.y, width);

        const northIsWater = clampUnitInterval(straitBaseMaskField.values[northIndex], 0) < landThreshold;
        const southIsWater = clampUnitInterval(straitBaseMaskField.values[southIndex], 0) < landThreshold;
        const eastIsWater = clampUnitInterval(straitBaseMaskField.values[eastIndex], 0) < landThreshold;
        const westIsWater = clampUnitInterval(straitBaseMaskField.values[westIndex], 0) < landThreshold;

        const verticalPattern = northIsWater && southIsWater && !eastIsWater && !westIsWater;
        const horizontalPattern = eastIsWater && westIsWater && !northIsWater && !southIsWater;
        if (verticalPattern === horizontalPattern) {
            return null;
        }

        const orientation = verticalPattern ? 'north_south' : 'east_west';
        const wallIndices = verticalPattern ? [eastIndex, westIndex] : [northIndex, southIndex];
        const wallSupport = roundFieldValue(wallIndices.reduce((total, wallIndex) => total + clampUnitInterval(straitBaseMaskField.values[wallIndex], 0), 0) / wallIndices.length);
        if (wallSupport < 0.95) {
            return null;
        }

        const leftDirection = verticalPattern ? { dx: 0, dy: -1 } : { dx: -1, dy: 0 };
        const rightDirection = verticalPattern ? { dx: 0, dy: 1 } : { dx: 1, dy: 0 };
        const leftWaterBody = resolveDirectionalWaterBody(index, leftDirection, worldBounds, straitBaseMaskField.values, landThreshold, basinLookup, 4);
        const rightWaterBody = resolveDirectionalWaterBody(index, rightDirection, worldBounds, straitBaseMaskField.values, landThreshold, basinLookup, 4);

        if (!leftWaterBody || !rightWaterBody) {
            return null;
        }

        if (leftWaterBody.basinId === rightWaterBody.basinId) {
            return null;
        }

        const fractureSupport = clampUnitInterval(fractureField.values[index], 0);
        const pressureWeakness = roundFieldValue(1 - clampUnitInterval(platePressureField.values[index], 0.5));
        const seaLevelValue = clampUnitInterval(seaLevelField.values[index], 1);
        const lowReliefBias = roundFieldValue(1 - seaLevelValue);
        const basinSupport = clampUnitInterval(basinField.values[index], 0);
        const structuralSupport = roundFieldValue(
            (fractureSupport * 0.5)
            + (pressureWeakness * 0.3)
            + (basinSupport * 0.2)
        );
        if (structuralSupport < 0.25) {
            return null;
        }

        const connectionDepth = roundFieldValue((leftWaterBody.step + rightWaterBody.step) / 8);
        const mixedBasinBias = leftWaterBody.basinKind !== rightWaterBody.basinKind ? 1 : 0.75;
        const noise = deterministicUnitNoise(stageSeed, index);
        const score = roundFieldValue(
            (fractureSupport * 0.27)
            + (pressureWeakness * 0.2)
            + (lowReliefBias * 0.18)
            + (basinSupport * 0.1)
            + (connectionDepth * 0.12)
            + (wallSupport * 0.08)
            + (mixedBasinBias * 0.1)
            + (noise * 0.05)
        );
        if (score < DEFAULT_STRAIT_SCORE_THRESHOLD) {
            return null;
        }

        return {
            cellIndex: index,
            x: point.x,
            y: point.y,
            orientation,
            score,
            widthCells: 1,
            wallSupport,
            fractureSupport: roundFieldValue(fractureSupport),
            pressureWeakness: roundFieldValue(pressureWeakness),
            seaLevelValue: roundFieldValue(seaLevelValue),
            lowReliefBias,
            basinSupport: roundFieldValue(basinSupport),
            structuralSupport,
            connectionDepth,
            leftWaterBody,
            rightWaterBody,
            futureChokepointTypeHint: 'narrow_strait'
        };
    }

    function resolveAdjacentWaterBody(index, direction, worldBounds, landValues, landThreshold, basinLookup) {
        return resolveDirectionalWaterBody(
            index,
            direction,
            worldBounds,
            landValues,
            landThreshold,
            basinLookup,
            1
        );
    }

    function buildArchipelagoCandidateMetrics(index, worldBounds, fragmentationBaseMaskField, oceanConnectivityField, seaLevelField, fractureField, platePressureField, basinField, basinLookup, stageSeed) {
        const width = worldBounds.width;
        const height = worldBounds.height;
        const point = pointFromIndex(index, width);
        if (point.x <= 0 || point.y <= 0 || point.x >= width - 1 || point.y >= height - 1) {
            return null;
        }

        const landThreshold = clampUnitInterval(fragmentationBaseMaskField.threshold, DEFAULT_LAND_THRESHOLD);
        const landValue = clampUnitInterval(fragmentationBaseMaskField.values[index], 0);
        if (landValue < landThreshold) {
            return null;
        }

        const northIndex = indexFromPoint(point.x, point.y - 1, width);
        const southIndex = indexFromPoint(point.x, point.y + 1, width);
        const eastIndex = indexFromPoint(point.x + 1, point.y, width);
        const westIndex = indexFromPoint(point.x - 1, point.y, width);
        const northIsLand = clampUnitInterval(fragmentationBaseMaskField.values[northIndex], 0) >= landThreshold;
        const southIsLand = clampUnitInterval(fragmentationBaseMaskField.values[southIndex], 0) >= landThreshold;
        const eastIsLand = clampUnitInterval(fragmentationBaseMaskField.values[eastIndex], 0) >= landThreshold;
        const westIsLand = clampUnitInterval(fragmentationBaseMaskField.values[westIndex], 0) >= landThreshold;
        const verticalPattern = northIsLand && southIsLand && !eastIsLand && !westIsLand;
        const horizontalPattern = eastIsLand && westIsLand && !northIsLand && !southIsLand;
        if (verticalPattern === horizontalPattern) {
            return null;
        }

        const ringDescriptors = createRingDescriptors(
            index,
            width,
            height,
            fragmentationBaseMaskField.values,
            landThreshold,
            oceanConnectivityField.values
        );
        if (!ringDescriptors) {
            return null;
        }

        const waterNeighborCount = ringDescriptors.filter((descriptor) => !descriptor.isLand).length;
        if (waterNeighborCount < 4) {
            return null;
        }

        const orientation = verticalPattern ? 'north_south_chain' : 'east_west_chain';
        const axisDirection = verticalPattern ? { dx: 0, dy: 1 } : { dx: 1, dy: 0 };
        const leftDirection = verticalPattern ? { dx: -1, dy: 0 } : { dx: 0, dy: -1 };
        const rightDirection = verticalPattern ? { dx: 1, dy: 0 } : { dx: 0, dy: 1 };
        const leftWaterBody = resolveAdjacentWaterBody(
            index,
            leftDirection,
            worldBounds,
            fragmentationBaseMaskField.values,
            landThreshold,
            basinLookup
        );
        const rightWaterBody = resolveAdjacentWaterBody(
            index,
            rightDirection,
            worldBounds,
            fragmentationBaseMaskField.values,
            landThreshold,
            basinLookup
        );
        if (
            leftWaterBody
            && rightWaterBody
            && leftWaterBody.basinId
            && rightWaterBody.basinId
            && leftWaterBody.basinId !== rightWaterBody.basinId
        ) {
            return null;
        }

        const openWaterExposure = roundFieldValue(
            (
                clampUnitInterval(oceanConnectivityField.values[leftWaterBody ? leftWaterBody.cellIndex : index], 0)
                + clampUnitInterval(oceanConnectivityField.values[rightWaterBody ? rightWaterBody.cellIndex : index], 0)
            ) / 2
        );
        const seaLevelValue = clampUnitInterval(seaLevelField.values[index], 1);
        const lowReliefBias = roundFieldValue(1 - seaLevelValue);
        const fractureSupport = clampUnitInterval(fractureField.values[index], 0);
        const pressureWeakness = roundFieldValue(1 - clampUnitInterval(platePressureField.values[index], 0.5));
        const basinSupport = clampUnitInterval(basinField.values[index], 0);
        const coastalExposure = roundFieldValue(waterNeighborCount / ringDescriptors.length);
        const noise = deterministicUnitNoise(stageSeed, index);
        const score = roundFieldValue(
            (openWaterExposure * 0.24)
            + (coastalExposure * 0.2)
            + (fractureSupport * 0.18)
            + (pressureWeakness * 0.15)
            + (lowReliefBias * 0.12)
            + (basinSupport * 0.05)
            + (noise * 0.06)
        );
        if (score < DEFAULT_ARCHIPELAGO_SCORE_THRESHOLD) {
            return null;
        }

        return {
            cellIndex: index,
            x: point.x,
            y: point.y,
            orientation,
            axisDirection,
            score,
            waterNeighborCount,
            openWaterExposure,
            coastalExposure,
            fractureSupport: roundFieldValue(fractureSupport),
            pressureWeakness: roundFieldValue(pressureWeakness),
            seaLevelValue: roundFieldValue(seaLevelValue),
            lowReliefBias,
            basinSupport: roundFieldValue(basinSupport),
            flankingBasinIds: [
                normalizeString(leftWaterBody && leftWaterBody.basinId, ''),
                normalizeString(rightWaterBody && rightWaterBody.basinId, '')
            ].filter(Boolean),
            flankingBasinKinds: [
                normalizeString(leftWaterBody && leftWaterBody.basinKind, ''),
                normalizeString(rightWaterBody && rightWaterBody.basinKind, '')
            ].filter(Boolean)
        };
    }

    function collectArchipelagoRuns(candidates, width) {
        const candidateMap = new Map();
        candidates.forEach((candidate) => {
            candidateMap.set(candidate.cellIndex, candidate);
        });

        const visited = new Set();
        const runs = [];

        candidateMap.forEach((candidate) => {
            if (visited.has(candidate.cellIndex)) {
                return;
            }

            const { axisDirection } = candidate;
            let startIndex = candidate.cellIndex;
            while (true) {
                const previousPoint = pointFromIndex(startIndex, width);
                const previousX = previousPoint.x - axisDirection.dx;
                const previousY = previousPoint.y - axisDirection.dy;
                if (previousX < 0 || previousY < 0) {
                    break;
                }

                const previousIndex = indexFromPoint(previousX, previousY, width);
                const previousCandidate = candidateMap.get(previousIndex);
                if (!previousCandidate || previousCandidate.orientation !== candidate.orientation) {
                    break;
                }

                startIndex = previousIndex;
            }

            const run = [];
            let currentIndex = startIndex;
            while (candidateMap.has(currentIndex)) {
                const currentCandidate = candidateMap.get(currentIndex);
                if (!currentCandidate || currentCandidate.orientation !== candidate.orientation) {
                    break;
                }

                run.push(currentCandidate);
                visited.add(currentCandidate.cellIndex);

                const currentPoint = pointFromIndex(currentIndex, width);
                const nextX = currentPoint.x + axisDirection.dx;
                const nextY = currentPoint.y + axisDirection.dy;
                if (nextX < 0 || nextY < 0) {
                    break;
                }

                currentIndex = indexFromPoint(nextX, nextY, width);
            }

            if (run.length >= DEFAULT_ARCHIPELAGO_MIN_CHAIN_LENGTH) {
                runs.push(run);
            }
        });

        return runs;
    }

    function buildArchipelagoRunMetrics(run, stageSeed) {
        const candidateCount = run.length;
        const runCellIndices = run.map((candidate) => candidate.cellIndex);
        const strongestScore = Math.max(...run.map((candidate) => candidate.score));
        const averageScore = roundFieldValue(run.reduce((total, candidate) => total + candidate.score, 0) / candidateCount);
        const openWaterExposure = roundFieldValue(run.reduce((total, candidate) => total + candidate.openWaterExposure, 0) / candidateCount);
        const fractureSupport = roundFieldValue(run.reduce((total, candidate) => total + candidate.fractureSupport, 0) / candidateCount);
        const pressureWeakness = roundFieldValue(run.reduce((total, candidate) => total + candidate.pressureWeakness, 0) / candidateCount);
        const lowReliefBias = roundFieldValue(run.reduce((total, candidate) => total + candidate.lowReliefBias, 0) / candidateCount);
        const basinSupport = roundFieldValue(run.reduce((total, candidate) => total + candidate.basinSupport, 0) / candidateCount);
        const runLengthBias = roundFieldValue(Math.min(1, candidateCount / 7));
        const parityOffset = hashUint32(stageSeed, run[0].cellIndex) % 2;
        const carvedBreakCellIndices = [];

        for (let index = 1 + parityOffset; index < candidateCount - 1; index += 2) {
            carvedBreakCellIndices.push(run[index].cellIndex);
        }

        if (!carvedBreakCellIndices.length && candidateCount >= DEFAULT_ARCHIPELAGO_MIN_CHAIN_LENGTH) {
            carvedBreakCellIndices.push(run[Math.floor(candidateCount / 2)].cellIndex);
        }

        const score = roundFieldValue(
            (averageScore * 0.58)
            + (runLengthBias * 0.22)
            + (openWaterExposure * 0.12)
            + (fractureSupport * 0.08)
        );

        return {
            orientation: run[0].orientation,
            candidateCount,
            runCellIndices,
            carvedBreakCellIndices,
            strongestScore: roundFieldValue(strongestScore),
            averageScore,
            score,
            openWaterExposure,
            fractureSupport,
            pressureWeakness,
            lowReliefBias,
            basinSupport,
            projectedIslandSegmentCount: carvedBreakCellIndices.length + 1,
            flankingBasinIds: Array.from(new Set(run.flatMap((candidate) => candidate.flankingBasinIds))),
            flankingBasinKinds: Array.from(new Set(run.flatMap((candidate) => candidate.flankingBasinKinds)))
        };
    }

    function selectArchipelagoRuns(runs, width, height, fragmentationBudget) {
        const sortedRuns = runs
            .slice()
            .sort((left, right) => {
                if (right.score !== left.score) {
                    return right.score - left.score;
                }

                if (right.candidateCount !== left.candidateCount) {
                    return right.candidateCount - left.candidateCount;
                }

                return left.runCellIndices[0] - right.runCellIndices[0];
            });
        const blockedIndices = new Set();
        const selected = [];

        for (let index = 0; index < sortedRuns.length; index += 1) {
            if (selected.length >= fragmentationBudget) {
                break;
            }

            const run = sortedRuns[index];
            if (run.runCellIndices.some((cellIndex) => blockedIndices.has(cellIndex))) {
                continue;
            }

            selected.push(run);
            run.runCellIndices.forEach((cellIndex) => {
                blockedIndices.add(cellIndex);
                getNeighborIndices(cellIndex, width, height).forEach((neighborIndex) => {
                    blockedIndices.add(neighborIndex);
                });
            });
        }

        return selected;
    }

    function measureCoastlineMetrics(maskField) {
        const width = normalizeInteger(maskField.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(maskField.height, DEFAULT_WORLD_BOUNDS.height);
        const landThreshold = clampUnitInterval(maskField.threshold, DEFAULT_LAND_THRESHOLD);
        let coastalLandCellCount = 0;
        let coastalWaterCellCount = 0;
        let coastlineEdgeCount = 0;

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const index = indexFromPoint(x, y, width);
                const isLand = clampUnitInterval(maskField.values[index], 0) >= landThreshold;
                let hasOppositeTypeNeighbor = false;

                if (x + 1 < width) {
                    const eastIndex = indexFromPoint(x + 1, y, width);
                    const eastIsLand = clampUnitInterval(maskField.values[eastIndex], 0) >= landThreshold;
                    if (eastIsLand !== isLand) {
                        coastlineEdgeCount += 1;
                        hasOppositeTypeNeighbor = true;
                    }
                }

                if (y + 1 < height) {
                    const southIndex = indexFromPoint(x, y + 1, width);
                    const southIsLand = clampUnitInterval(maskField.values[southIndex], 0) >= landThreshold;
                    if (southIsLand !== isLand) {
                        coastlineEdgeCount += 1;
                        hasOppositeTypeNeighbor = true;
                    }
                }

                if (!hasOppositeTypeNeighbor) {
                    const neighborIndices = getNeighborIndices(index, width, height);
                    hasOppositeTypeNeighbor = neighborIndices.some((neighborIndex) => {
                        const neighborIsLand = clampUnitInterval(maskField.values[neighborIndex], 0) >= landThreshold;
                        return neighborIsLand !== isLand;
                    });
                }

                if (!hasOppositeTypeNeighbor) {
                    continue;
                }

                if (isLand) {
                    coastalLandCellCount += 1;
                } else {
                    coastalWaterCellCount += 1;
                }
            }
        }

        const coastalCellCount = coastalLandCellCount + coastalWaterCellCount;
        const coastlineEdgeDensity = coastlineEdgeCount / Math.max(1, coastalCellCount);
        const jaggednessIndex = roundFieldValue(
            Math.max(
                0,
                Math.min(
                    1,
                    (coastlineEdgeDensity - 0.45) / 0.55
                )
            )
        );

        return {
            coastalLandCellCount,
            coastalWaterCellCount,
            coastalCellCount,
            coastlineEdgeCount,
            coastlineEdgeDensity: roundFieldValue(coastlineEdgeDensity),
            jaggednessIndex
        };
    }

    function computeCardinalCoastlineEdgeDelta(index, width, height, values, landThreshold, nextIsLand) {
        const point = pointFromIndex(index, width);
        const currentIsLand = clampUnitInterval(values[index], 0) >= landThreshold;
        if (currentIsLand === nextIsLand) {
            return 0;
        }

        let edgeCountBefore = 0;
        let edgeCountAfter = 0;
        const cardinalNeighbors = [
            { x: point.x, y: point.y - 1 },
            { x: point.x + 1, y: point.y },
            { x: point.x, y: point.y + 1 },
            { x: point.x - 1, y: point.y }
        ];

        cardinalNeighbors.forEach((neighborPoint) => {
            if (
                neighborPoint.x < 0
                || neighborPoint.y < 0
                || neighborPoint.x >= width
                || neighborPoint.y >= height
            ) {
                return;
            }

            const neighborIndex = indexFromPoint(neighborPoint.x, neighborPoint.y, width);
            const neighborIsLand = clampUnitInterval(values[neighborIndex], 0) >= landThreshold;

            if (neighborIsLand !== currentIsLand) {
                edgeCountBefore += 1;
            }

            if (neighborIsLand !== nextIsLand) {
                edgeCountAfter += 1;
            }
        });

        return edgeCountAfter - edgeCountBefore;
    }

    function buildIncreaseJaggednessCandidate(index, worldBounds, baseMaskField, oceanConnectivityField, seaLevelField, fractureField, platePressureField, basinField, stageSeed) {
        const width = worldBounds.width;
        const height = worldBounds.height;
        const point = pointFromIndex(index, width);
        if (point.x <= 0 || point.y <= 0 || point.x >= width - 1 || point.y >= height - 1) {
            return null;
        }

        const landThreshold = clampUnitInterval(baseMaskField.threshold, DEFAULT_LAND_THRESHOLD);
        const landValue = clampUnitInterval(baseMaskField.values[index], 0);
        if (landValue < landThreshold) {
            return null;
        }

        const ringDescriptors = createRingDescriptors(
            index,
            width,
            height,
            baseMaskField.values,
            landThreshold,
            oceanConnectivityField.values
        );
        if (!ringDescriptors) {
            return null;
        }

        const waterNeighbors = ringDescriptors.filter((descriptor) => !descriptor.isLand);
        if (waterNeighbors.length < 2 || waterNeighbors.length > 4) {
            return null;
        }

        const waterFlags = ringDescriptors.map((descriptor) => !descriptor.isLand);
        if (countCircularTrueGroups(waterFlags) !== 1) {
            return null;
        }

        const cardinalWater = {
            north: !ringDescriptors[CARDINAL_RING_POSITIONS.north].isLand,
            east: !ringDescriptors[CARDINAL_RING_POSITIONS.east].isLand,
            south: !ringDescriptors[CARDINAL_RING_POSITIONS.south].isLand,
            west: !ringDescriptors[CARDINAL_RING_POSITIONS.west].isLand
        };
        if ((cardinalWater.north && cardinalWater.south) || (cardinalWater.east && cardinalWater.west)) {
            return null;
        }

        const coastlineEdgeDelta = computeCardinalCoastlineEdgeDelta(
            index,
            width,
            height,
            baseMaskField.values,
            landThreshold,
            false
        );
        if (coastlineEdgeDelta <= 0) {
            return null;
        }

        const openWaterExposure = roundFieldValue(
            waterNeighbors.reduce((total, descriptor) => total + clampUnitInterval(descriptor.oceanValue, 0), 0)
            / Math.max(1, waterNeighbors.length)
        );
        const edgeGain = roundFieldValue(coastlineEdgeDelta / 4);
        const seaLevelValue = clampUnitInterval(seaLevelField.values[index], 1);
        const lowReliefBias = roundFieldValue(1 - seaLevelValue);
        const fractureSupport = clampUnitInterval(fractureField.values[index], 0);
        const pressureWeakness = roundFieldValue(1 - clampUnitInterval(platePressureField.values[index], 0.5));
        const basinSupport = clampUnitInterval(basinField.values[index], 0);
        const noise = deterministicUnitNoise(stageSeed, index);
        const score = roundFieldValue(
            (edgeGain * 0.2)
            + (openWaterExposure * 0.2)
            + ((waterNeighbors.length / 4) * 0.16)
            + (lowReliefBias * 0.16)
            + (fractureSupport * 0.12)
            + (pressureWeakness * 0.1)
            + (basinSupport * 0.03)
            + (noise * 0.03)
        );

        return {
            cellIndex: index,
            x: point.x,
            y: point.y,
            score,
            adjustment: 'carve',
            coastlineEdgeDelta,
            edgeGain,
            waterNeighborCount: waterNeighbors.length,
            openWaterExposure,
            fractureSupport: roundFieldValue(fractureSupport),
            pressureWeakness,
            lowReliefBias,
            basinSupport: roundFieldValue(basinSupport)
        };
    }

    function buildDecreaseJaggednessCandidate(index, worldBounds, baseMaskField, oceanConnectivityField, seaLevelField, fractureField, platePressureField, basinField, stageSeed) {
        const width = worldBounds.width;
        const height = worldBounds.height;
        const point = pointFromIndex(index, width);
        if (point.x <= 0 || point.y <= 0 || point.x >= width - 1 || point.y >= height - 1) {
            return null;
        }

        const landThreshold = clampUnitInterval(baseMaskField.threshold, DEFAULT_LAND_THRESHOLD);
        const landValue = clampUnitInterval(baseMaskField.values[index], 0);
        if (landValue >= landThreshold) {
            return null;
        }

        const ringDescriptors = createRingDescriptors(
            index,
            width,
            height,
            baseMaskField.values,
            landThreshold,
            oceanConnectivityField.values
        );
        if (!ringDescriptors) {
            return null;
        }

        const landNeighbors = ringDescriptors.filter((descriptor) => descriptor.isLand);
        if (landNeighbors.length < 5) {
            return null;
        }

        const waterFlags = ringDescriptors.map((descriptor) => !descriptor.isLand);
        if (countCircularTrueGroups(waterFlags) !== 1) {
            return null;
        }

        const cardinalWater = {
            north: !ringDescriptors[CARDINAL_RING_POSITIONS.north].isLand,
            east: !ringDescriptors[CARDINAL_RING_POSITIONS.east].isLand,
            south: !ringDescriptors[CARDINAL_RING_POSITIONS.south].isLand,
            west: !ringDescriptors[CARDINAL_RING_POSITIONS.west].isLand
        };
        if ((cardinalWater.north && cardinalWater.south) || (cardinalWater.east && cardinalWater.west)) {
            return null;
        }

        const coastlineEdgeDelta = computeCardinalCoastlineEdgeDelta(
            index,
            width,
            height,
            baseMaskField.values,
            landThreshold,
            true
        );
        if (coastlineEdgeDelta >= 0) {
            return null;
        }

        const shelteredness = roundFieldValue(landNeighbors.length / ringDescriptors.length);
        const openWaterExposure = roundFieldValue(
            ringDescriptors
                .filter((descriptor) => !descriptor.isLand)
                .reduce((total, descriptor) => total + clampUnitInterval(descriptor.oceanValue, 0), 0)
            / Math.max(1, ringDescriptors.filter((descriptor) => !descriptor.isLand).length)
        );
        const edgeReduction = roundFieldValue(Math.abs(coastlineEdgeDelta) / 4);
        const seaLevelValue = clampUnitInterval(seaLevelField.values[index], 0);
        const lowReliefBias = roundFieldValue(1 - seaLevelValue);
        const fractureResistance = roundFieldValue(1 - clampUnitInterval(fractureField.values[index], 0));
        const pressureResistance = clampUnitInterval(platePressureField.values[index], 0.5);
        const basinResistance = roundFieldValue(1 - clampUnitInterval(basinField.values[index], 0));
        const noise = deterministicUnitNoise(stageSeed, index);
        const score = roundFieldValue(
            (edgeReduction * 0.24)
            + (shelteredness * 0.22)
            + ((1 - openWaterExposure) * 0.16)
            + (lowReliefBias * 0.12)
            + (fractureResistance * 0.1)
            + (pressureResistance * 0.08)
            + (basinResistance * 0.04)
            + (noise * 0.04)
        );

        return {
            cellIndex: index,
            x: point.x,
            y: point.y,
            score,
            adjustment: 'fill',
            coastlineEdgeDelta,
            edgeReduction,
            landNeighborCount: landNeighbors.length,
            shelteredness,
            openWaterExposure,
            fractureResistance,
            pressureResistance: roundFieldValue(pressureResistance),
            lowReliefBias,
            basinResistance
        };
    }

    function selectJaggednessCandidates(candidates, width, height, adjustmentBudget) {
        const sortedCandidates = candidates
            .slice()
            .sort((left, right) => {
                if (right.score !== left.score) {
                    return right.score - left.score;
                }

                return left.cellIndex - right.cellIndex;
            });
        const blockedIndices = new Set();
        const selected = [];

        for (let index = 0; index < sortedCandidates.length; index += 1) {
            if (selected.length >= adjustmentBudget) {
                break;
            }

            const candidate = sortedCandidates[index];
            if (blockedIndices.has(candidate.cellIndex)) {
                continue;
            }

            selected.push(candidate);
            blockedIndices.add(candidate.cellIndex);
            getNeighborIndices(candidate.cellIndex, width, height).forEach((neighborIndex) => {
                blockedIndices.add(neighborIndex);
            });
        }

        return selected;
    }

    function selectStraitCandidates(candidates, width, height, carveBudget) {
        const sortedCandidates = candidates
            .slice()
            .sort((left, right) => {
                if (right.score !== left.score) {
                    return right.score - left.score;
                }
                return left.cellIndex - right.cellIndex;
            });
        const blockedIndices = new Set();
        const selected = [];

        for (let index = 0; index < sortedCandidates.length; index += 1) {
            if (selected.length >= carveBudget) {
                break;
            }

            const candidate = sortedCandidates[index];
            if (blockedIndices.has(candidate.cellIndex)) {
                continue;
            }

            selected.push(candidate);
            blockedIndices.add(candidate.cellIndex);
            getNeighborIndices(candidate.cellIndex, width, height).forEach((neighborIndex) => {
                blockedIndices.add(neighborIndex);
            });
        }

        return selected;
    }

    function materializeStraitCarving(input = {}, fallbackBayOutput = null) {
        const normalizedInput = normalizeInput(input);
        const bayCarvingOutput = fallbackBayOutput || materializeBayCarving(input);
        const straitBaseMaskField = bayCarvingOutput.bayCarvedLandWaterMaskField;
        const seaLevelField = getSeaLevelField(input, normalizedInput);
        const basinField = getBasinDepressionField(input, normalizedInput);
        const fractureField = getFractureMaskField(input, normalizedInput);
        const platePressureField = getPlatePressureField(input, normalizedInput);
        const sourceIntermediateOutputs = getSourceIntermediateOutputs(input);
        const worldBounds = normalizeWorldBounds({
            width: straitBaseMaskField.width,
            height: straitBaseMaskField.height
        });
        const basinLookup = buildOceanBasinLookup(worldBounds, sourceIntermediateOutputs.oceanBasinFloodFill);
        const size = worldBounds.width * worldBounds.height;
        const stageNamespace = buildNamespace(PIPELINE_STEP_ID, 'straitCarving');
        const stageSeed = deriveSubSeed(normalizedInput.macroSeed, stageNamespace);
        const candidates = [];
        let thinCorridorCellCount = 0;

        for (let index = 0; index < size; index += 1) {
            const point = pointFromIndex(index, worldBounds.width);
            if (point.x <= 0 || point.y <= 0 || point.x >= worldBounds.width - 1 || point.y >= worldBounds.height - 1) {
                continue;
            }

            const northIndex = indexFromPoint(point.x, point.y - 1, worldBounds.width);
            const southIndex = indexFromPoint(point.x, point.y + 1, worldBounds.width);
            const eastIndex = indexFromPoint(point.x + 1, point.y, worldBounds.width);
            const westIndex = indexFromPoint(point.x - 1, point.y, worldBounds.width);
            const landThreshold = clampUnitInterval(straitBaseMaskField.threshold, DEFAULT_LAND_THRESHOLD);

            const northIsWater = clampUnitInterval(straitBaseMaskField.values[northIndex], 0) < landThreshold;
            const southIsWater = clampUnitInterval(straitBaseMaskField.values[southIndex], 0) < landThreshold;
            const eastIsWater = clampUnitInterval(straitBaseMaskField.values[eastIndex], 0) < landThreshold;
            const westIsWater = clampUnitInterval(straitBaseMaskField.values[westIndex], 0) < landThreshold;

            if ((northIsWater && southIsWater) || (eastIsWater && westIsWater)) {
                thinCorridorCellCount += 1;
            }

            const candidate = buildStraitCandidateMetrics(
                index,
                worldBounds,
                straitBaseMaskField,
                fractureField,
                platePressureField,
                seaLevelField,
                basinField,
                basinLookup,
                stageSeed
            );
            if (candidate) {
                candidates.push(candidate);
            }
        }

        const carveBudget = Math.min(
            DEFAULT_STRAIT_CARVE_MAX,
            Math.max(candidates.length > 0 ? 1 : 0, Math.round(candidates.length * DEFAULT_STRAIT_CARVE_RATIO))
        );
        const selectedCandidates = selectStraitCandidates(candidates, worldBounds.width, worldBounds.height, carveBudget);
        const carvedValues = straitBaseMaskField.values.slice();
        selectedCandidates.forEach((candidate) => {
            carvedValues[candidate.cellIndex] = 0;
        });

        const straitCarvedLandWaterMaskField = serializeMaskField(
            STRAIT_CARVED_LAND_WATER_MASK_FIELD_ID,
            worldBounds,
            carvedValues,
            {
                stageId: STRAIT_CARVING_STAGE_ID,
                sourceFieldIds: [
                    straitBaseMaskField.fieldId,
                    fractureField.fieldId,
                    platePressureField.fieldId,
                    seaLevelField.fieldId,
                    basinField.fieldId
                ],
                sourceOutputIds: [
                    BAY_CARVING_STAGE_ID,
                    sourceIntermediateOutputs.oceanBasinFloodFill ? 'oceanBasinFloodFill' : ''
                ].filter(Boolean),
                threshold: clampUnitInterval(straitBaseMaskField.threshold, DEFAULT_LAND_THRESHOLD),
                semantics: {
                    allowedValue: 1,
                    blockedValue: 0,
                    allowedMeaning: 'land',
                    blockedMeaning: 'water'
                },
                carvingModel: 'deterministicThinCorridorStraitCutV1',
                compatibility: {
                    futureChokepointAnalysisInput: true,
                    futureSeaRegionRebuildInput: true,
                    sameWorldBoundsRequired: true
                }
            }
        );

        const straitCarvingSummary = {
            straitCarvingId: STRAIT_CARVING_STAGE_ID,
            stageId: STRAIT_CARVING_STAGE_ID,
            sourceFieldIds: [
                straitBaseMaskField.fieldId,
                fractureField.fieldId,
                platePressureField.fieldId,
                seaLevelField.fieldId,
                basinField.fieldId
            ],
            sourceOutputIds: [
                BAY_CARVING_STAGE_ID,
                sourceIntermediateOutputs.oceanBasinFloodFill ? 'oceanBasinFloodFill' : ''
            ].filter(Boolean),
            worldBounds: cloneValue(worldBounds),
            thinCorridorCellCount,
            candidateCount: candidates.length,
            carveBudget,
            carvedStraitCount: selectedCandidates.length,
            carvingModel: 'deterministicThinCorridorStraitCutV1',
            straitPassages: selectedCandidates.map((candidate, candidateIndex) => ({
                straitPassageId: `straitPassage_${String(candidateIndex + 1).padStart(3, '0')}`,
                cellIndex: candidate.cellIndex,
                x: candidate.x,
                y: candidate.y,
                orientation: candidate.orientation,
                widthCells: candidate.widthCells,
                score: candidate.score,
                wallSupport: candidate.wallSupport,
                fractureSupport: candidate.fractureSupport,
                pressureWeakness: candidate.pressureWeakness,
                seaLevelValue: candidate.seaLevelValue,
                lowReliefBias: candidate.lowReliefBias,
                basinSupport: candidate.basinSupport,
                structuralSupport: candidate.structuralSupport,
                connectionDepth: candidate.connectionDepth,
                connectedBasinIds: [
                    candidate.leftWaterBody.basinId,
                    candidate.rightWaterBody.basinId
                ],
                connectedBasinKinds: [
                    candidate.leftWaterBody.basinKind,
                    candidate.rightWaterBody.basinKind
                ],
                futureChokepointTypeHint: candidate.futureChokepointTypeHint,
                futureChokepointInput: true
            })),
            summary: {
                strongestStraitScore: Math.max(0, ...selectedCandidates.map((candidate) => candidate.score)),
                strongestFractureSupport: Math.max(0, ...selectedCandidates.map((candidate) => candidate.fractureSupport)),
                mixedBasinKindCount: selectedCandidates.filter((candidate) => candidate.leftWaterBody.basinKind !== candidate.rightWaterBody.basinKind).length
            },
            compatibility: {
                futureChokepointAnalysisInput: true,
                futureSeaRegionRebuildInput: true,
                sameWorldBoundsRequired: true
            },
            intentionallyAbsent: [
                'chokepoints',
                'controlMetrics',
                'islandChains',
                'routeGraph',
                'harborScoring',
                'terrainCells',
                'gameplaySemantics'
            ]
        };

        return {
            straitCarvedLandWaterMaskField,
            straitCarvingSummary
        };
    }

    function getMarineCarvingSeedHooks(masterSeed = 0) {
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

    function generateBayCarvedLandWaterMaskField(input = {}) {
        return materializeBayCarving(input).bayCarvedLandWaterMaskField;
    }

    function generateBayCarvingSummary(input = {}) {
        return materializeBayCarving(input).bayCarvingSummary;
    }

    function generateStraitCarvedLandWaterMaskField(input = {}) {
        return materializeStraitCarving(input).straitCarvedLandWaterMaskField;
    }

    function generateStraitCarvingSummary(input = {}) {
        return materializeStraitCarving(input).straitCarvingSummary;
    }

    function materializeArchipelagoFragmentation(input = {}, fallbackBayOutput = null, fallbackStraitOutput = null) {
        const normalizedInput = normalizeInput(input);
        const bayCarvingOutput = fallbackBayOutput || materializeBayCarving(input);
        const straitCarvingOutput = fallbackStraitOutput || materializeStraitCarving(input, bayCarvingOutput);
        const fragmentationBaseMaskField = straitCarvingOutput.straitCarvedLandWaterMaskField;
        const oceanConnectivityField = getOceanConnectivityField(input, normalizedInput);
        const seaLevelField = getSeaLevelField(input, normalizedInput);
        const basinField = getBasinDepressionField(input, normalizedInput);
        const fractureField = getFractureMaskField(input, normalizedInput);
        const platePressureField = getPlatePressureField(input, normalizedInput);
        const sourceIntermediateOutputs = getSourceIntermediateOutputs(input);
        const worldBounds = normalizeWorldBounds({
            width: fragmentationBaseMaskField.width,
            height: fragmentationBaseMaskField.height
        });
        const size = worldBounds.width * worldBounds.height;
        const basinLookup = buildOceanBasinLookup(worldBounds, sourceIntermediateOutputs.oceanBasinFloodFill);
        const stageNamespace = buildNamespace(PIPELINE_STEP_ID, 'archipelagoFragmentation');
        const stageSeed = deriveSubSeed(normalizedInput.macroSeed, stageNamespace);
        const candidates = [];

        for (let index = 0; index < size; index += 1) {
            const candidate = buildArchipelagoCandidateMetrics(
                index,
                worldBounds,
                fragmentationBaseMaskField,
                oceanConnectivityField,
                seaLevelField,
                fractureField,
                platePressureField,
                basinField,
                basinLookup,
                stageSeed
            );
            if (candidate) {
                candidates.push(candidate);
            }
        }

        const runs = collectArchipelagoRuns(candidates, worldBounds.width)
            .map((run) => buildArchipelagoRunMetrics(run, stageSeed));
        const fragmentationBudget = Math.min(
            DEFAULT_ARCHIPELAGO_FRAGMENT_MAX,
            Math.max(runs.length > 0 ? 1 : 0, Math.round(runs.length * DEFAULT_ARCHIPELAGO_FRAGMENT_RATIO))
        );
        const selectedRuns = selectArchipelagoRuns(runs, worldBounds.width, worldBounds.height, fragmentationBudget);
        const carvedValues = fragmentationBaseMaskField.values.slice();
        const carvedBreakCellIndices = selectedRuns.flatMap((run) => run.carvedBreakCellIndices);
        carvedBreakCellIndices.forEach((cellIndex) => {
            carvedValues[cellIndex] = 0;
        });

        const islandChainFragmentedLandWaterMaskField = serializeMaskField(
            ISLAND_CHAIN_FRAGMENTED_LAND_WATER_MASK_FIELD_ID,
            worldBounds,
            carvedValues,
            {
                stageId: ARCHIPELAGO_FRAGMENTATION_STAGE_ID,
                sourceFieldIds: [
                    fragmentationBaseMaskField.fieldId,
                    oceanConnectivityField.fieldId,
                    fractureField.fieldId,
                    platePressureField.fieldId,
                    seaLevelField.fieldId,
                    basinField.fieldId
                ],
                sourceOutputIds: [
                    STRAIT_CARVING_STAGE_ID,
                    sourceIntermediateOutputs.oceanBasinFloodFill ? 'oceanBasinFloodFill' : ''
                ].filter(Boolean),
                threshold: clampUnitInterval(fragmentationBaseMaskField.threshold, DEFAULT_LAND_THRESHOLD),
                semantics: {
                    allowedValue: 1,
                    blockedValue: 0,
                    allowedMeaning: 'land',
                    blockedMeaning: 'water'
                },
                carvingModel: 'deterministicIslandChainFragmentationV1',
                compatibility: {
                    futureArchipelagoMorphologyInput: true,
                    futureSeaRegionRebuildInput: true,
                    sameWorldBoundsRequired: true
                }
            }
        );

        const archipelagoFragmentationSummary = {
            archipelagoFragmentationId: ARCHIPELAGO_FRAGMENTATION_STAGE_ID,
            stageId: ARCHIPELAGO_FRAGMENTATION_STAGE_ID,
            sourceFieldIds: [
                fragmentationBaseMaskField.fieldId,
                oceanConnectivityField.fieldId,
                fractureField.fieldId,
                platePressureField.fieldId,
                seaLevelField.fieldId,
                basinField.fieldId
            ],
            sourceOutputIds: [
                STRAIT_CARVING_STAGE_ID,
                sourceIntermediateOutputs.oceanBasinFloodFill ? 'oceanBasinFloodFill' : ''
            ].filter(Boolean),
            worldBounds: cloneValue(worldBounds),
            candidateCount: candidates.length,
            runCount: runs.length,
            fragmentationBudget,
            fragmentedRunCount: selectedRuns.length,
            fragmentedCellCount: carvedBreakCellIndices.length,
            fragmentationModel: 'deterministicIslandChainFragmentationV1',
            fragmentationRuns: selectedRuns.map((run, runIndex) => ({
                fragmentationRunId: `archipelagoRun_${String(runIndex + 1).padStart(3, '0')}`,
                orientation: run.orientation,
                candidateCellCount: run.candidateCount,
                runCellIndices: run.runCellIndices.slice(),
                carvedBreakCellIndices: run.carvedBreakCellIndices.slice(),
                projectedIslandSegmentCount: run.projectedIslandSegmentCount,
                averageScore: run.averageScore,
                strongestScore: run.strongestScore,
                openWaterExposure: run.openWaterExposure,
                fractureSupport: run.fractureSupport,
                pressureWeakness: run.pressureWeakness,
                lowReliefBias: run.lowReliefBias,
                basinSupport: run.basinSupport,
                flankingBasinIds: run.flankingBasinIds.slice(),
                flankingBasinKinds: run.flankingBasinKinds.slice(),
                futureArchipelagoMorphologyInput: true
            })),
            summary: {
                strongestFragmentationRunScore: Math.max(0, ...selectedRuns.map((run) => run.score)),
                longestFragmentedRunLength: Math.max(0, ...selectedRuns.map((run) => run.candidateCount)),
                projectedIslandSegmentCount: selectedRuns.reduce((total, run) => total + run.projectedIslandSegmentCount, 0),
                sameBasinFlankRunCount: selectedRuns.filter((run) => run.flankingBasinIds.length <= 1).length
            },
            compatibility: {
                futureArchipelagoMorphologyInput: true,
                futureSeaRegionRebuildInput: true,
                sameWorldBoundsRequired: true
            },
            intentionallyAbsent: [
                'archipelagoSignificance',
                'chokepoints',
                'controlMetrics',
                'routeGraph',
                'harborScoring',
                'terrainCells',
                'gameplaySemantics'
            ]
        };

        return {
            islandChainFragmentedLandWaterMaskField,
            archipelagoFragmentationSummary
        };
    }

    function generateIslandChainFragmentedLandWaterMaskField(input = {}) {
        return materializeArchipelagoFragmentation(input).islandChainFragmentedLandWaterMaskField;
    }

    function generateArchipelagoFragmentationSummary(input = {}) {
        return materializeArchipelagoFragmentation(input).archipelagoFragmentationSummary;
    }

    function materializeCoastJaggednessControl(input = {}, fallbackBayOutput = null, fallbackStraitOutput = null, fallbackArchipelagoOutput = null) {
        const normalizedInput = normalizeInput(input);
        const bayCarvingOutput = fallbackBayOutput || materializeBayCarving(input);
        const straitCarvingOutput = fallbackStraitOutput || materializeStraitCarving(input, bayCarvingOutput);
        const archipelagoFragmentationOutput = fallbackArchipelagoOutput || materializeArchipelagoFragmentation(
            input,
            bayCarvingOutput,
            straitCarvingOutput
        );
        const jaggednessBaseMaskField = archipelagoFragmentationOutput.islandChainFragmentedLandWaterMaskField;
        const oceanConnectivityField = getOceanConnectivityField(input, normalizedInput);
        const seaLevelField = getSeaLevelField(input, normalizedInput);
        const basinField = getBasinDepressionField(input, normalizedInput);
        const fractureField = getFractureMaskField(input, normalizedInput);
        const platePressureField = getPlatePressureField(input, normalizedInput);
        const worldBounds = normalizeWorldBounds({
            width: jaggednessBaseMaskField.width,
            height: jaggednessBaseMaskField.height
        });
        const size = worldBounds.width * worldBounds.height;
        const stageNamespace = buildNamespace(PIPELINE_STEP_ID, 'coastJaggednessControl');
        const stageSeed = deriveSubSeed(normalizedInput.macroSeed, stageNamespace);
        const jaggednessMetricsBefore = measureCoastlineMetrics(jaggednessBaseMaskField);
        const constraintJaggedness = getCoastJaggednessConstraint(input, normalizedInput);
        const seedBaselineJaggedness = roundFieldValue(deterministicUnitNoise(stageSeed, size + worldBounds.width + worldBounds.height));
        const targetJaggedness = roundFieldValue(
            Math.max(0, Math.min(1, (constraintJaggedness * 0.94) + (seedBaselineJaggedness * 0.06)))
        );
        const deltaToTargetBefore = roundFieldValue(targetJaggedness - jaggednessMetricsBefore.jaggednessIndex);
        let adjustmentMode = 'hold';
        if (deltaToTargetBefore > DEFAULT_COAST_JAGGEDNESS_TOLERANCE) {
            adjustmentMode = 'increase_jaggedness';
        } else if (deltaToTargetBefore < -DEFAULT_COAST_JAGGEDNESS_TOLERANCE) {
            adjustmentMode = 'decrease_jaggedness';
        }

        const candidates = [];
        for (let index = 0; index < size; index += 1) {
            let candidate = null;
            if (adjustmentMode === 'increase_jaggedness') {
                candidate = buildIncreaseJaggednessCandidate(
                    index,
                    worldBounds,
                    jaggednessBaseMaskField,
                    oceanConnectivityField,
                    seaLevelField,
                    fractureField,
                    platePressureField,
                    basinField,
                    stageSeed
                );
            } else if (adjustmentMode === 'decrease_jaggedness') {
                candidate = buildDecreaseJaggednessCandidate(
                    index,
                    worldBounds,
                    jaggednessBaseMaskField,
                    oceanConnectivityField,
                    seaLevelField,
                    fractureField,
                    platePressureField,
                    basinField,
                    stageSeed
                );
            }

            if (candidate) {
                candidates.push(candidate);
            }
        }

        const adjustmentBudget = adjustmentMode === 'hold'
            ? 0
            : Math.min(
                DEFAULT_COAST_JAGGEDNESS_MAX,
                Math.max(
                    candidates.length > 0 ? 1 : 0,
                    Math.round(
                        jaggednessMetricsBefore.coastalCellCount
                        * DEFAULT_COAST_JAGGEDNESS_RATIO
                        * Math.max(0, Math.abs(deltaToTargetBefore))
                    )
                )
            );
        const selectedCandidates = adjustmentBudget > 0
            ? selectJaggednessCandidates(candidates, worldBounds.width, worldBounds.height, adjustmentBudget)
            : [];
        const adjustedValues = jaggednessBaseMaskField.values.slice();
        selectedCandidates.forEach((candidate) => {
            adjustedValues[candidate.cellIndex] = candidate.adjustment === 'carve' ? 0 : 1;
        });

        const coastJaggednessControlledLandWaterMaskField = serializeMaskField(
            COAST_JAGGEDNESS_CONTROLLED_LAND_WATER_MASK_FIELD_ID,
            worldBounds,
            adjustedValues,
            {
                stageId: COAST_JAGGEDNESS_CONTROL_STAGE_ID,
                sourceFieldIds: [
                    jaggednessBaseMaskField.fieldId,
                    oceanConnectivityField.fieldId,
                    fractureField.fieldId,
                    platePressureField.fieldId,
                    seaLevelField.fieldId,
                    basinField.fieldId
                ],
                sourceOutputIds: [
                    ARCHIPELAGO_FRAGMENTATION_STAGE_ID
                ],
                threshold: clampUnitInterval(jaggednessBaseMaskField.threshold, DEFAULT_LAND_THRESHOLD),
                semantics: {
                    allowedValue: 1,
                    blockedValue: 0,
                    allowedMeaning: 'land',
                    blockedMeaning: 'water'
                },
                carvingModel: 'deterministicCoastJaggednessControlV1',
                compatibility: {
                    futureCoastalOpportunityInput: true,
                    futureHarborLandingInput: true,
                    futureValidationRebalanceInput: true,
                    futureSeaRegionRebuildInput: true,
                    sameWorldBoundsRequired: true
                }
            }
        );
        const jaggednessMetricsAfter = measureCoastlineMetrics(coastJaggednessControlledLandWaterMaskField);
        const deltaToTargetAfter = roundFieldValue(targetJaggedness - jaggednessMetricsAfter.jaggednessIndex);

        const coastJaggednessControlSummary = {
            coastJaggednessControlId: COAST_JAGGEDNESS_CONTROL_STAGE_ID,
            stageId: COAST_JAGGEDNESS_CONTROL_STAGE_ID,
            sourceFieldIds: [
                jaggednessBaseMaskField.fieldId,
                oceanConnectivityField.fieldId,
                fractureField.fieldId,
                platePressureField.fieldId,
                seaLevelField.fieldId,
                basinField.fieldId
            ],
            sourceOutputIds: [
                ARCHIPELAGO_FRAGMENTATION_STAGE_ID
            ],
            worldBounds: cloneValue(worldBounds),
            jaggednessControl: {
                validationControlField: 'coastJaggedness',
                validationControllable: true,
                seedDriven: true,
                constraintJaggedness,
                seedBaselineJaggedness,
                targetJaggedness
            },
            coastlineMetricsBefore: cloneValue(jaggednessMetricsBefore),
            coastlineMetricsAfter: cloneValue(jaggednessMetricsAfter),
            adjustmentMode,
            candidateCount: candidates.length,
            adjustmentBudget,
            adjustedCellCount: selectedCandidates.length,
            deltaToTargetBefore,
            deltaToTargetAfter,
            controlModel: 'deterministicCoastJaggednessControlV1',
            adjustedCells: selectedCandidates.map((candidate, candidateIndex) => ({
                adjustmentCellId: `coastJaggednessCell_${String(candidateIndex + 1).padStart(3, '0')}`,
                cellIndex: candidate.cellIndex,
                x: candidate.x,
                y: candidate.y,
                adjustment: candidate.adjustment,
                score: candidate.score,
                coastlineEdgeDelta: candidate.coastlineEdgeDelta ?? 0,
                openWaterExposure: candidate.openWaterExposure,
                lowReliefBias: candidate.lowReliefBias,
                fractureSignal: candidate.fractureSupport ?? candidate.fractureResistance,
                pressureSignal: candidate.pressureWeakness ?? candidate.pressureResistance,
                coastalSupport: candidate.waterNeighborCount ?? candidate.landNeighborCount ?? 0
            })),
            summary: {
                strongestAdjustmentScore: Math.max(0, ...selectedCandidates.map((candidate) => candidate.score)),
                appliedTargetImprovement: roundFieldValue(Math.abs(deltaToTargetBefore) - Math.abs(deltaToTargetAfter)),
                increasedJaggedness: adjustmentMode === 'increase_jaggedness',
                decreasedJaggedness: adjustmentMode === 'decrease_jaggedness'
            },
            compatibility: {
                futureCoastalOpportunityInput: true,
                futureHarborLandingInput: true,
                futureValidationRebalanceInput: true,
                futureSeaRegionRebuildInput: true,
                sameWorldBoundsRequired: true
            },
            intentionallyAbsent: [
                'climateEffects',
                'localTileCoastLogic',
                'routeGraph',
                'fishingScore',
                'terrainCells',
                'gameplaySemantics'
            ]
        };

        return {
            coastJaggednessControlledLandWaterMaskField,
            coastJaggednessControlSummary
        };
    }

    function normalizeCellIndex(value, size) {
        const numericValue = Number(value);
        const cellIndex = Number.isFinite(numericValue) ? Math.trunc(numericValue) : -1;
        return cellIndex >= 0 && cellIndex < size ? cellIndex : -1;
    }

    function buildCellIndexSet(entries = [], size = 0, key = 'cellIndex', predicate = null) {
        const cellIndexSet = new Set();
        const sourceEntries = Array.isArray(entries) ? entries : [];

        sourceEntries.forEach((entry) => {
            if (predicate && !predicate(entry)) {
                return;
            }

            const cellIndex = normalizeCellIndex(entry && entry[key], size);
            if (cellIndex >= 0) {
                cellIndexSet.add(cellIndex);
            }
        });

        return cellIndexSet;
    }

    function addCellIndicesToSet(cellIndexSet, cellIndices = [], size = 0) {
        const sourceCellIndices = Array.isArray(cellIndices) ? cellIndices : [];
        sourceCellIndices.forEach((cellIndex) => {
            const normalizedIndex = normalizeCellIndex(cellIndex, size);
            if (normalizedIndex >= 0) {
                cellIndexSet.add(normalizedIndex);
            }
        });

        return cellIndexSet;
    }

    function buildArchipelagoCompositeCellSets(archipelagoFragmentationSummary = {}, size = 0) {
        const breakCellIndices = new Set();
        const runCellIndices = new Set();
        const fragmentationRuns = Array.isArray(archipelagoFragmentationSummary.fragmentationRuns)
            ? archipelagoFragmentationSummary.fragmentationRuns
            : [];

        fragmentationRuns.forEach((run) => {
            addCellIndicesToSet(breakCellIndices, run.carvedBreakCellIndices, size);
            addCellIndicesToSet(runCellIndices, run.runCellIndices, size);
        });

        return {
            breakCellIndices,
            runCellIndices
        };
    }

    function materializeMarineInvasionComposite(
        input = {},
        fallbackBayOutput = null,
        fallbackStraitOutput = null,
        fallbackArchipelagoOutput = null,
        fallbackJaggednessOutput = null
    ) {
        const normalizedInput = normalizeInput(input);
        const bayCarvingOutput = fallbackBayOutput || materializeBayCarving(input);
        const straitCarvingOutput = fallbackStraitOutput || materializeStraitCarving(input, bayCarvingOutput);
        const archipelagoFragmentationOutput = fallbackArchipelagoOutput || materializeArchipelagoFragmentation(
            input,
            bayCarvingOutput,
            straitCarvingOutput
        );
        const coastJaggednessControlOutput = fallbackJaggednessOutput || materializeCoastJaggednessControl(
            input,
            bayCarvingOutput,
            straitCarvingOutput,
            archipelagoFragmentationOutput
        );
        const baseLandMask = getBaseLandMaskField(input, normalizedInput);
        const oceanConnectivityField = getOceanConnectivityField(input, normalizedInput);
        const coastalShelfDepthField = getCoastalShelfDepthField(input, normalizedInput);
        const finalCoastMaskField = coastJaggednessControlOutput.coastJaggednessControlledLandWaterMaskField;
        const worldBounds = normalizeWorldBounds({
            width: finalCoastMaskField.width,
            height: finalCoastMaskField.height
        });
        const sourceIntermediateOutputs = getSourceIntermediateOutputs(input);
        const size = worldBounds.width * worldBounds.height;
        const baseLandThreshold = clampUnitInterval(baseLandMask.threshold, DEFAULT_LAND_THRESHOLD);
        const finalLandThreshold = clampUnitInterval(finalCoastMaskField.threshold, DEFAULT_LAND_THRESHOLD);
        const stageNamespace = buildNamespace(PIPELINE_STEP_ID, 'marineInvasion');
        const stageSeed = deriveSubSeed(normalizedInput.macroSeed, stageNamespace);
        const bayCellIndices = buildCellIndexSet(
            bayCarvingOutput.bayCarvingSummary && bayCarvingOutput.bayCarvingSummary.carvedCells,
            size
        );
        const straitCellIndices = buildCellIndexSet(
            straitCarvingOutput.straitCarvingSummary && straitCarvingOutput.straitCarvingSummary.straitPassages,
            size
        );
        const archipelagoCellSets = buildArchipelagoCompositeCellSets(
            archipelagoFragmentationOutput.archipelagoFragmentationSummary,
            size
        );
        const jaggednessCarveCellIndices = buildCellIndexSet(
            coastJaggednessControlOutput.coastJaggednessControlSummary
                && coastJaggednessControlOutput.coastJaggednessControlSummary.adjustedCells,
            size,
            'cellIndex',
            (entry) => entry && entry.adjustment === 'carve'
        );
        const marineInvasionValues = new Array(size).fill(0);
        let finalWaterCellCount = 0;
        let newlyCarvedWaterCellCount = 0;
        let shelfInfluencedCellCount = 0;
        let analyzerPriorityCellCount = 0;

        for (let index = 0; index < size; index += 1) {
            const baseIsLand = clampUnitInterval(baseLandMask.values[index], 0) >= baseLandThreshold;
            const finalIsWater = clampUnitInterval(finalCoastMaskField.values[index], 0) < finalLandThreshold;
            const oceanValue = clampUnitInterval(oceanConnectivityField.values[index], 0);
            const shelfScore = finalIsWater ? clampUnitInterval(coastalShelfDepthField.values[index], 0) : 0;
            const newlyCarvedWater = baseIsLand && finalIsWater ? 1 : 0;
            const baySignal = bayCellIndices.has(index) ? 1 : 0;
            const straitSignal = straitCellIndices.has(index) ? 1 : 0;
            const islandBreakSignal = archipelagoCellSets.breakCellIndices.has(index)
                ? 1
                : (archipelagoCellSets.runCellIndices.has(index) ? 0.35 : 0);
            const jaggednessSignal = jaggednessCarveCellIndices.has(index) ? 0.45 : 0;
            const basinWaterExposure = finalIsWater
                ? (oceanValue >= 0.75 ? 1 : (oceanValue >= 0.25 ? 0.55 : 0.15))
                : 0;
            const structuralSignal = Math.max(
                finalIsWater ? 0.1 : 0,
                shelfScore,
                newlyCarvedWater,
                baySignal,
                straitSignal,
                islandBreakSignal,
                jaggednessSignal
            );

            if (finalIsWater) {
                finalWaterCellCount += 1;
            }
            if (newlyCarvedWater) {
                newlyCarvedWaterCellCount += 1;
            }
            if (shelfScore >= 0.33) {
                shelfInfluencedCellCount += 1;
            }

            if (structuralSignal <= 0) {
                continue;
            }

            const noise = deterministicUnitNoise(stageSeed, index);
            const marineInvasionScore = roundFieldValue(clampUnitInterval(
                ((finalIsWater ? 0.04 : 0) * 1)
                + (basinWaterExposure * 0.1)
                + (shelfScore * 0.24)
                + (newlyCarvedWater * 0.26)
                + (baySignal * 0.1)
                + (straitSignal * 0.16)
                + (islandBreakSignal * 0.14)
                + (jaggednessSignal * 0.06)
                + (noise * 0.025),
                0
            ));

            marineInvasionValues[index] = marineInvasionScore;
            if (marineInvasionScore >= 0.5) {
                analyzerPriorityCellCount += 1;
            }
        }

        return {
            marineInvasionField: serializeScalarField(
                MARINE_INVASION_FIELD_ID,
                worldBounds,
                marineInvasionValues,
                {
                    stageId: MARINE_INVASION_STAGE_ID,
                    sourceFieldIds: [
                        baseLandMask.fieldId,
                        oceanConnectivityField.fieldId,
                        coastalShelfDepthField.fieldId,
                        bayCarvingOutput.bayCarvedLandWaterMaskField.fieldId,
                        straitCarvingOutput.straitCarvedLandWaterMaskField.fieldId,
                        archipelagoFragmentationOutput.islandChainFragmentedLandWaterMaskField.fieldId,
                        finalCoastMaskField.fieldId
                    ],
                    sourceOutputIds: [
                        sourceIntermediateOutputs.oceanBasinFloodFill ? 'oceanBasinFloodFill' : '',
                        sourceIntermediateOutputs.seaRegionClusters ? 'seaRegionClusters' : '',
                        sourceIntermediateOutputs.coastalDepthApproximation ? 'coastalDepthApproximation' : '',
                        BAY_CARVING_STAGE_ID,
                        STRAIT_CARVING_STAGE_ID,
                        ARCHIPELAGO_FRAGMENTATION_STAGE_ID,
                        COAST_JAGGEDNESS_CONTROL_STAGE_ID
                    ].filter(Boolean),
                    compositeModel: 'deterministicMarineInvasionHydrosphereCompositeV1',
                    valueMeaning: '0 = no marine-invasion signal, 1 = strongest basin/carving/island-chain/coastal-depth composite signal',
                    componentWeights: {
                        finalWaterPresence: 0.04,
                        basinWaterExposure: 0.1,
                        coastalShelfDepth: 0.24,
                        newlyCarvedWater: 0.26,
                        bayCarving: 0.1,
                        straitCarving: 0.16,
                        islandChainFragmentation: 0.14,
                        coastJaggednessCarve: 0.06,
                        deterministicNudge: 0.025
                    },
                    componentSummary: {
                        finalWaterCellCount,
                        newlyCarvedWaterCellCount,
                        bayCarvedCellCount: bayCellIndices.size,
                        straitPassageCellCount: straitCellIndices.size,
                        archipelagoBreakCellCount: archipelagoCellSets.breakCellIndices.size,
                        archipelagoRunCellCount: archipelagoCellSets.runCellIndices.size,
                        jaggednessCarveCellCount: jaggednessCarveCellIndices.size,
                        shelfInfluencedCellCount,
                        analyzerPriorityCellCount
                    },
                    compatibility: {
                        futureCoastalOpportunityInput: true,
                        futureChokepointAnalysisInput: true,
                        futureArchipelagoMorphologyInput: true,
                        futureHydrosphereAnalyzerInput: true,
                        futureSeaRegionRebuildInput: true,
                        sameWorldBoundsRequired: true
                    },
                    intentionallyAbsent: [
                        'climateIntegration',
                        'finalPackage',
                        'seaRegions',
                        'macroRoutes',
                        'routeGraph',
                        'harborScoring',
                        'fishingScore',
                        'terrainCells',
                        'gameplaySemantics'
                    ]
                }
            )
        };
    }

    function generateMarineInvasionField(input = {}) {
        return materializeMarineInvasionComposite(input).marineInvasionField;
    }

    function generateCoastJaggednessControlledLandWaterMaskField(input = {}) {
        return materializeCoastJaggednessControl(input).coastJaggednessControlledLandWaterMaskField;
    }

    function generateCoastJaggednessControlSummary(input = {}) {
        return materializeCoastJaggednessControl(input).coastJaggednessControlSummary;
    }

    function createMarineCarvingPipeline(input = {}) {
        const normalizedInput = normalizeInput(input);
        const bayCarvingOutput = materializeBayCarving(input);
        const straitCarvingOutput = materializeStraitCarving(input, bayCarvingOutput);
        const archipelagoFragmentationOutput = materializeArchipelagoFragmentation(
            input,
            bayCarvingOutput,
            straitCarvingOutput
        );
        const coastJaggednessControlOutput = materializeCoastJaggednessControl(
            input,
            bayCarvingOutput,
            straitCarvingOutput,
            archipelagoFragmentationOutput
        );
        const marineInvasionOutput = materializeMarineInvasionComposite(
            input,
            bayCarvingOutput,
            straitCarvingOutput,
            archipelagoFragmentationOutput,
            coastJaggednessControlOutput
        );

        return {
            generatorId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            status: PARTIAL_STATUS,
            stub: false,
            partial: true,
            deterministic: true,
            macroSeed: normalizedInput.macroSeed,
            worldBounds: cloneValue(normalizedInput.worldBounds),
            inputContract: getMarineCarvingInputContract(),
            outputContract: getMarineCarvingOutputContract(),
            seedHooks: getMarineCarvingSeedHooks(normalizedInput.macroSeed),
            dependencyAvailability: describeMarineCarvingDependencyAvailability(input),
            plannedStages: cloneValue(PLANNED_STAGES),
            outputs: {
                ...createEmptyMarineCarvingOutputs(),
                fields: {
                    marineInvasionField: marineInvasionOutput.marineInvasionField,
                    bayCarvedLandWaterMaskField: bayCarvingOutput.bayCarvedLandWaterMaskField,
                    straitCarvedLandWaterMaskField: straitCarvingOutput.straitCarvedLandWaterMaskField,
                    islandChainFragmentedLandWaterMaskField: archipelagoFragmentationOutput.islandChainFragmentedLandWaterMaskField,
                    coastJaggednessControlledLandWaterMaskField: coastJaggednessControlOutput.coastJaggednessControlledLandWaterMaskField
                },
                intermediateOutputs: {
                    bayCarvingSummary: bayCarvingOutput.bayCarvingSummary,
                    straitCarvingSummary: straitCarvingOutput.straitCarvingSummary,
                    archipelagoFragmentationSummary: archipelagoFragmentationOutput.archipelagoFragmentationSummary,
                    coastJaggednessControlSummary: coastJaggednessControlOutput.coastJaggednessControlSummary
                }
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT_OUTPUTS.slice(),
            notes: [
                'Partial marine-carving pipeline: deterministic bay carving, deterministic narrow-strait carving, deterministic island-chain fragmentation, coast-jaggedness control, and marine-invasion hydrosphere composite field over cleaned coastal land using hydrosphere connectivity and physical weakness context.',
                'No inland-sea reconstruction, finalized island-chain records, archipelago significance, chokepoint control metrics, climate integration, local tile coast logic, harbor scoring, route graph, final package, river deltas, terrain cells, UI, or gameplay semantics are generated.'
            ]
        };
    }

    function generateMarineCarving(input = {}) {
        return createMarineCarvingPipeline(input);
    }

    function getMarineCarvingGeneratorDescriptor() {
        return {
            moduleId: MODULE_ID,
            pipelineStep: PIPELINE_STEP_ID,
            status: PARTIAL_STATUS,
            stub: false,
            partial: true,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID),
            requiredInputs: INPUT_REQUIRED_KEYS.slice(),
            optionalInputs: INPUT_OPTIONAL_KEYS.slice(),
            plannedStages: cloneValue(PLANNED_STAGES),
            description: 'Partial Phase 1 MarineCarvingGenerator. It implements deterministic bay carving, narrow-strait carving, island-chain fragmentation, coast-jaggedness control, and a marine-invasion hydrosphere composite field while climate integration, final package assembly, route graph, and gameplay semantics remain absent.'
        };
    }

    function getMarineCarvingInputContract() {
        return {
            contractId: 'marineCarvingInput',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            requiredKeys: INPUT_REQUIRED_KEYS.slice(),
            optionalKeys: INPUT_OPTIONAL_KEYS.slice(),
            fieldDependencies: cloneValue(FIELD_DEPENDENCIES),
            intermediateDependencies: cloneValue(INTERMEDIATE_DEPENDENCIES),
            description: 'Contract scaffold for MarineCarvingGenerator input. It consumes cleaned coast masks, hydrosphere basin/connectivity/depth context, optional tectonic weakness context, and a validation-controllable `coastJaggedness` constraint for deterministic bay carving, narrow-strait carving, island-chain fragmentation, coast-jaggedness control, and marine-invasion composite export without climate effects, final package assembly, harbor scoring, or gameplay logic.'
        };
    }

    function getMarineCarvingOutputContract() {
        return {
            contractId: 'marineCarvingOutput',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            status: PARTIAL_STATUS,
            plannedOutputs: cloneValue(PLANNED_OUTPUTS),
            implementedOutputs: {
                fields: [
                    MARINE_INVASION_FIELD_ID,
                    BAY_CARVED_LAND_WATER_MASK_FIELD_ID,
                    STRAIT_CARVED_LAND_WATER_MASK_FIELD_ID,
                    ISLAND_CHAIN_FRAGMENTED_LAND_WATER_MASK_FIELD_ID,
                    COAST_JAGGEDNESS_CONTROLLED_LAND_WATER_MASK_FIELD_ID
                ],
                intermediateOutputs: [
                    'bayCarvingSummary',
                    'straitCarvingSummary',
                    'archipelagoFragmentationSummary',
                    'coastJaggednessControlSummary'
                ],
                records: [],
                debugArtifacts: []
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT_OUTPUTS.slice(),
            description: 'Partial pipeline contract for MarineCarvingGenerator. Deterministic bay carving, narrow-strait carving, island-chain fragmentation, coast-jaggedness control, and marine-invasion composite field are materialized; inland-sea reconstruction, archipelago significance, chokepoint metrics, route graph, climate integration, final package assembly, terrain cells, and gameplay semantics remain absent.'
        };
    }

    function getMarineInvasionFieldContract() {
        return {
            contractId: MARINE_INVASION_FIELD_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'marineInvasion'),
            fieldType: 'ScalarField',
            sourceKeys: [
                'oceanBasinFloodFill',
                'oceanConnectivityMaskField',
                'coastalShelfDepthField',
                'coastalDepthApproximation',
                'bayCarvedLandWaterMaskField',
                'straitCarvedLandWaterMaskField',
                'islandChainFragmentedLandWaterMaskField',
                'coastJaggednessControlledLandWaterMaskField',
                'bayCarvingSummary',
                'straitCarvingSummary',
                'archipelagoFragmentationSummary',
                'coastJaggednessControlSummary'
            ],
            requiredKeys: [
                'fieldId',
                'stageId',
                'sourceFieldIds',
                'sourceOutputIds',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'stats',
                'compositeModel',
                'componentWeights',
                'componentSummary',
                'compatibility'
            ],
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: 'rowMajorFloatArray',
            compatibility: {
                futureCoastalOpportunityInput: true,
                futureChokepointAnalysisInput: true,
                futureArchipelagoMorphologyInput: true,
                futureHydrosphereAnalyzerInput: true,
                futureSeaRegionRebuildInput: true,
                sameWorldBoundsRequired: true
            },
            intentionallyAbsent: [
                'climateIntegration',
                'finalPackage',
                'seaRegions',
                'macroRoutes',
                'routeGraph',
                'harborScoring',
                'fishingScore',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic scalar composite field that combines water-basin exposure, coastal shelf depth, bay/strait carving, island-chain fragmentation, and coast-jaggedness carve signals for later analyzers without climate integration or final package assembly.'
        };
    }

    function getBayCarvedLandWaterMaskFieldContract() {
        return {
            contractId: BAY_CARVED_LAND_WATER_MASK_FIELD_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'bayCarving'),
            fieldType: 'MaskField',
            aliases: ['ConstraintField'],
            sourceKeys: [
                'landmassCleanupMaskField',
                'oceanConnectivityMaskField',
                'seaLevelAppliedElevationField',
                'basinDepressionField'
            ],
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
                'carvingModel',
                'compatibility'
            ],
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: 'rowMajorFloatArray',
            compatibility: {
                futureStraitCarvingInput: true,
                futureSeaRegionRebuildInput: true,
                futureCoastalOpportunityInput: true,
                sameWorldBoundsRequired: true
            },
            intentionallyAbsent: [
                'straits',
                'harborScoring',
                'routeGraph',
                'riverDeltas',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic bay-carved land/water mask built by notching selected coastal land cells into water while explicitly avoiding strait cutting and gameplay semantics.'
        };
    }

    function getBayCarvingSummaryContract() {
        return {
            contractId: 'bayCarvingSummary',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'bayCarving'),
            sourceKeys: [
                'landmassCleanupMaskField',
                'oceanConnectivityMaskField',
                'seaLevelAppliedElevationField',
                'basinDepressionField'
            ],
            requiredKeys: [
                'bayCarvingId',
                'stageId',
                'sourceFieldIds',
                'worldBounds',
                'coastalLandCellCount',
                'candidateCount',
                'carveBudget',
                'carvedCellCount',
                'carvingModel',
                'carvedCells',
                'summary',
                'compatibility'
            ],
            carvedCellKeys: [
                'cellIndex',
                'x',
                'y',
                'score',
                'waterNeighborCount',
                'waterGroupCount',
                'maxWaterRun',
                'coastalExposure',
                'oceanExposureType',
                'openOceanExposure',
                'enclosedWaterExposure',
                'seaLevelValue',
                'basinSupport',
                'inlandSupportDepth',
                'inwardDirection',
                'edgeProfile'
            ],
            intentionallyAbsent: [
                'straits',
                'harborScoring',
                'routeGraph',
                'riverDeltas',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic summary for the bay-carving pass. It records selected coastal carve cells, bounded carve budget, and compatibility hooks for later strait/coastal analysis without creating routes or harbor semantics.'
        };
    }

    function getStraitCarvedLandWaterMaskFieldContract() {
        return {
            contractId: STRAIT_CARVED_LAND_WATER_MASK_FIELD_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'straitCarving'),
            fieldType: 'MaskField',
            aliases: ['ConstraintField'],
            sourceKeys: [
                'bayCarvedLandWaterMaskField',
                'oceanBasinFloodFill',
                'fractureMaskField',
                'platePressureField',
                'seaLevelAppliedElevationField',
                'basinDepressionField'
            ],
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
                'carvingModel',
                'compatibility'
            ],
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: 'rowMajorFloatArray',
            compatibility: {
                futureChokepointAnalysisInput: true,
                futureSeaRegionRebuildInput: true,
                sameWorldBoundsRequired: true
            },
            intentionallyAbsent: [
                'chokepoints',
                'controlMetrics',
                'islandChains',
                'routeGraph',
                'harborScoring',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic strait-carved land/water mask built by cutting only thin corridor cells that connect distinct water basins and have supporting physical weakness context.'
        };
    }

    function getStraitCarvingSummaryContract() {
        return {
            contractId: 'straitCarvingSummary',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'straitCarving'),
            sourceKeys: [
                'bayCarvedLandWaterMaskField',
                'oceanBasinFloodFill',
                'fractureMaskField',
                'platePressureField',
                'seaLevelAppliedElevationField',
                'basinDepressionField'
            ],
            requiredKeys: [
                'straitCarvingId',
                'stageId',
                'sourceFieldIds',
                'sourceOutputIds',
                'worldBounds',
                'thinCorridorCellCount',
                'candidateCount',
                'carveBudget',
                'carvedStraitCount',
                'carvingModel',
                'straitPassages',
                'summary',
                'compatibility'
            ],
            straitPassageKeys: [
                'straitPassageId',
                'cellIndex',
                'x',
                'y',
                'orientation',
                'widthCells',
                'score',
                'wallSupport',
                'fractureSupport',
                'pressureWeakness',
                'seaLevelValue',
                'lowReliefBias',
                'basinSupport',
                'structuralSupport',
                'connectionDepth',
                'connectedBasinIds',
                'connectedBasinKinds',
                'futureChokepointTypeHint',
                'futureChokepointInput'
            ],
            intentionallyAbsent: [
                'chokepoints',
                'controlMetrics',
                'islandChains',
                'routeGraph',
                'harborScoring',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic summary for the narrow-strait carving pass. It records carved corridor cells and basin-connection hints for later chokepoint analysis without computing any control metrics.'
        };
    }

    function getIslandChainFragmentedLandWaterMaskFieldContract() {
        return {
            contractId: ISLAND_CHAIN_FRAGMENTED_LAND_WATER_MASK_FIELD_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'archipelagoFragmentation'),
            fieldType: 'MaskField',
            aliases: ['ConstraintField'],
            sourceKeys: [
                'straitCarvedLandWaterMaskField',
                'oceanConnectivityMaskField',
                'fractureMaskField',
                'platePressureField',
                'seaLevelAppliedElevationField',
                'basinDepressionField',
                'oceanBasinFloodFill'
            ],
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
                'carvingModel',
                'compatibility'
            ],
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: 'rowMajorFloatArray',
            compatibility: {
                futureArchipelagoMorphologyInput: true,
                futureSeaRegionRebuildInput: true,
                sameWorldBoundsRequired: true
            },
            intentionallyAbsent: [
                'archipelagoSignificance',
                'chokepoints',
                'controlMetrics',
                'routeGraph',
                'harborScoring',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic land/water mask that fragments selected narrow coastal land-bar runs into island-chain morphology while leaving archipelago scoring and choke metrics for later passes.'
        };
    }

    function getArchipelagoFragmentationSummaryContract() {
        return {
            contractId: 'archipelagoFragmentationSummary',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'archipelagoFragmentation'),
            sourceKeys: [
                'straitCarvedLandWaterMaskField',
                'oceanConnectivityMaskField',
                'fractureMaskField',
                'platePressureField',
                'seaLevelAppliedElevationField',
                'basinDepressionField',
                'oceanBasinFloodFill'
            ],
            requiredKeys: [
                'archipelagoFragmentationId',
                'stageId',
                'sourceFieldIds',
                'sourceOutputIds',
                'worldBounds',
                'candidateCount',
                'runCount',
                'fragmentationBudget',
                'fragmentedRunCount',
                'fragmentedCellCount',
                'fragmentationModel',
                'fragmentationRuns',
                'summary',
                'compatibility'
            ],
            fragmentationRunKeys: [
                'fragmentationRunId',
                'orientation',
                'candidateCellCount',
                'runCellIndices',
                'carvedBreakCellIndices',
                'projectedIslandSegmentCount',
                'averageScore',
                'strongestScore',
                'openWaterExposure',
                'fractureSupport',
                'pressureWeakness',
                'lowReliefBias',
                'basinSupport',
                'flankingBasinIds',
                'flankingBasinKinds',
                'futureArchipelagoMorphologyInput'
            ],
            intentionallyAbsent: [
                'archipelagoSignificance',
                'chokepoints',
                'controlMetrics',
                'routeGraph',
                'harborScoring',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic summary for the island-chain fragmentation pass. It records selected coastal land-bar runs, carved break cells, and future archipelago-morphology hints without computing significance or choke metrics.'
        };
    }

    function getCoastJaggednessControlledLandWaterMaskFieldContract() {
        return {
            contractId: COAST_JAGGEDNESS_CONTROLLED_LAND_WATER_MASK_FIELD_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'coastJaggednessControl'),
            fieldType: 'MaskField',
            aliases: ['ConstraintField'],
            sourceKeys: [
                'islandChainFragmentedLandWaterMaskField',
                'oceanConnectivityMaskField',
                'fractureMaskField',
                'platePressureField',
                'seaLevelAppliedElevationField',
                'basinDepressionField'
            ],
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
                'carvingModel',
                'compatibility'
            ],
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: 'rowMajorFloatArray',
            compatibility: {
                futureCoastalOpportunityInput: true,
                futureHarborLandingInput: true,
                futureValidationRebalanceInput: true,
                futureSeaRegionRebuildInput: true,
                sameWorldBoundsRequired: true
            },
            intentionallyAbsent: [
                'climateEffects',
                'localTileCoastLogic',
                'routeGraph',
                'fishingScore',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic land/water mask that adjusts coastline jaggedness toward a seed-driven and validation-controllable target without destroying large landmass forms.'
        };
    }

    function getCoastJaggednessControlSummaryContract() {
        return {
            contractId: 'coastJaggednessControlSummary',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'coastJaggednessControl'),
            sourceKeys: [
                'islandChainFragmentedLandWaterMaskField',
                'oceanConnectivityMaskField',
                'fractureMaskField',
                'platePressureField',
                'seaLevelAppliedElevationField',
                'basinDepressionField',
                'phase1Constraints.coastJaggedness'
            ],
            requiredKeys: [
                'coastJaggednessControlId',
                'stageId',
                'sourceFieldIds',
                'sourceOutputIds',
                'worldBounds',
                'jaggednessControl',
                'coastlineMetricsBefore',
                'coastlineMetricsAfter',
                'adjustmentMode',
                'candidateCount',
                'adjustmentBudget',
                'adjustedCellCount',
                'deltaToTargetBefore',
                'deltaToTargetAfter',
                'controlModel',
                'adjustedCells',
                'summary',
                'compatibility'
            ],
            adjustedCellKeys: [
                'adjustmentCellId',
                'cellIndex',
                'x',
                'y',
                'adjustment',
                'score',
                'openWaterExposure',
                'lowReliefBias',
                'fractureSignal',
                'pressureSignal',
                'coastalSupport'
            ],
            intentionallyAbsent: [
                'climateEffects',
                'localTileCoastLogic',
                'routeGraph',
                'fishingScore',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic summary for the coast-jaggedness control pass. It records the seed-driven target, validation control channel, coastline metrics before/after, and bounded coastal adjustments without introducing climate or tile-level coast logic.'
        };
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule(MODULE_ID, {
            entry: 'generateMarineCarving',
            file: 'js/worldgen/macro/marine-carving-generator.js',
            description: 'Partial Phase 1 marine carving layer with deterministic bay carving, narrow-strait carving, island-chain fragmentation, coast-jaggedness control, and marine-invasion composite export.',
            stub: false,
            partial: true
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep(PIPELINE_STEP_ID, {
            moduleId: MODULE_ID,
            file: 'js/worldgen/macro/marine-carving-generator.js',
            description: 'Partial pipeline entry for deterministic bay carving, narrow-strait carving, island-chain fragmentation, coast-jaggedness control, and marine-invasion composite export plus future coastal marine transforms.',
            stub: false,
            partial: true
        });
    }

    Object.assign(macro, {
        getMarineCarvingGeneratorDescriptor,
        getMarineCarvingInputContract,
        getMarineCarvingOutputContract,
        getMarineInvasionFieldContract,
        getBayCarvedLandWaterMaskFieldContract,
        getBayCarvingSummaryContract,
        getStraitCarvedLandWaterMaskFieldContract,
        getStraitCarvingSummaryContract,
        getIslandChainFragmentedLandWaterMaskFieldContract,
        getArchipelagoFragmentationSummaryContract,
        getCoastJaggednessControlledLandWaterMaskFieldContract,
        getCoastJaggednessControlSummaryContract,
        getMarineCarvingSeedHooks,
        describeMarineCarvingDependencyAvailability,
        generateMarineInvasionField,
        generateBayCarvedLandWaterMaskField,
        generateBayCarvingSummary,
        generateStraitCarvedLandWaterMaskField,
        generateStraitCarvingSummary,
        generateIslandChainFragmentedLandWaterMaskField,
        generateArchipelagoFragmentationSummary,
        generateCoastJaggednessControlledLandWaterMaskField,
        generateCoastJaggednessControlSummary,
        createMarineCarvingPipeline,
        generateMarineCarving
    });
})();
