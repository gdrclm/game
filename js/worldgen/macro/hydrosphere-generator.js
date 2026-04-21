(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const MODULE_ID = 'hydrosphereGenerator';
    const PIPELINE_STEP_ID = 'hydrosphere';
    const TODO_STATUS = macro.todoContractedCode || 'TODO_CONTRACTED';
    const PARTIAL_STATUS = 'PARTIAL_IMPLEMENTED';
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';
    const DEFAULT_WORLD_BOUNDS = Object.freeze({
        width: 256,
        height: 128
    });
    const DEFAULT_FIELD_RANGE = Object.freeze([0, 1]);
    const DEFAULT_WATER_THRESHOLD = 0.5;
    const INLAND_SEA_MIN_AREA_RATIO = 0.003;
    const SEMI_ENCLOSED_SEA_MIN_AREA_RATIO = 0.01;
    const SEMI_ENCLOSED_EDGE_EXPOSURE_THRESHOLD = 0.18;
    const OCEAN_CONNECTIVITY_MASK_FIELD_ID = 'oceanConnectivityMaskField';
    const OCEAN_BASIN_FLOOD_FILL_STAGE_ID = 'oceanBasinFloodFill';
    const SEA_REGION_CLUSTERING_STAGE_ID = 'seaRegionClustering';
    const SEA_NAVIGABILITY_TAGGING_STAGE_ID = 'seaNavigabilityTagging';
    const COASTAL_SHELF_DEPTH_FIELD_ID = 'coastalShelfDepthField';
    const COASTAL_DEPTH_APPROXIMATION_STAGE_ID = 'coastalDepthApproximation';
    const WATERSHED_SEGMENTATION_STAGE_ID = 'watershedSegmentation';
    const DEFAULT_SHELF_DISTANCE_CELLS = 5;
    const DEFAULT_WATERSHED_MIN_AREA_RATIO = 0.001;
    const OCEAN_CONNECTIVITY_VALUE_ENCODING = 'rowMajorFloatArray';
    const OCEAN_CONNECTIVITY_ENCODING = deepFreeze({
        land: 0,
        enclosedWater: 0.5,
        openOcean: 1
    });
    const INPUT_REQUIRED_KEYS = Object.freeze([
        'macroSeed'
    ]);
    const INPUT_OPTIONAL_KEYS = Object.freeze([
        'macroSeedProfile',
        'phase1Constraints',
        'worldBounds',
        'reliefElevation',
        'fields',
        'intermediateOutputs',
        'records',
        'debugOptions'
    ]);
    const FIELD_DEPENDENCIES = deepFreeze([
        {
            fieldId: 'seaLevelAppliedElevationField',
            sourceGroup: 'reliefElevation.outputs.fields',
            required: true,
            role: 'post-threshold elevation surface for future sea fill and marine flood-fill passes'
        },
        {
            fieldId: 'landWaterMaskField',
            sourceGroup: 'reliefElevation.outputs.fields',
            required: true,
            role: 'primary land/water partition for future hydrosphere region growth'
        },
        {
            fieldId: 'landmassCleanupMaskField',
            sourceGroup: 'reliefElevation.outputs.fields',
            required: true,
            role: 'cleaned land/water baseline for future oceans, coasts, and river-basin extraction'
        },
        {
            fieldId: 'basinDepressionField',
            sourceGroup: 'reliefElevation.outputs.fields',
            required: false,
            role: 'optional basin-floor context for later lake, marsh, and river-basin logic'
        },
        {
            fieldId: 'mountainAmplificationField',
            sourceGroup: 'reliefElevation.outputs.fields',
            required: false,
            role: 'optional source-relief context for later river-basin headwaters'
        },
        {
            fieldId: 'plateauCandidateField',
            sourceGroup: 'reliefElevation.outputs.fields',
            required: false,
            role: 'optional drainage-divide context for later river-basin logic'
        }
    ]);
    const INTERMEDIATE_DEPENDENCIES = deepFreeze([
        {
            outputId: 'continentBodies',
            sourceGroup: 'reliefElevation.outputs.intermediateOutputs',
            required: false,
            role: 'optional macro landmass attribution for later sea and river-basin records'
        },
        {
            outputId: 'reliefRegionExtraction',
            sourceGroup: 'reliefElevation.outputs.intermediateOutputs',
            required: false,
            role: 'optional relief-region set metadata for later hydrosphere linkage'
        }
    ]);
    const RECORD_DEPENDENCIES = deepFreeze([
        {
            outputId: 'reliefRegions',
            sourceGroup: 'reliefElevation.outputs.records',
            required: false,
            role: 'optional finalized relief records for future sea-region adjacency and river-basin linkage'
        }
    ]);
    const PLANNED_OUTPUTS = deepFreeze({
        fields: [
            'marineInvasionField',
            'oceanConnectivityMaskField',
            COASTAL_SHELF_DEPTH_FIELD_ID,
            'surfaceDrainageTendencyField'
        ],
        intermediateOutputs: [
            'hydrosphereCompositionPlan',
            'oceanBasinFloodFill',
            'seaRegionClusters',
            'seaNavigabilityTagging',
            COASTAL_DEPTH_APPROXIMATION_STAGE_ID,
            WATERSHED_SEGMENTATION_STAGE_ID,
            'riverBasinSeeds'
        ],
        records: [
            'seaRegions',
            'riverBasins'
        ],
        debugArtifacts: [
            'hydrosphereFieldSnapshots'
        ]
    });
    const PLANNED_STAGES = deepFreeze([
        {
            stageId: 'dependencyIntake',
            seedScope: 'dependencyIntake',
            plannedOutputs: ['dependencyAvailability']
        },
        {
            stageId: 'marineInvasionScaffold',
            seedScope: 'marineInvasion',
            plannedOutputs: ['marineInvasionField']
        },
        {
            stageId: OCEAN_BASIN_FLOOD_FILL_STAGE_ID,
            seedScope: 'oceanFill',
            plannedOutputs: ['oceanBasinFloodFill', 'oceanConnectivityMaskField']
        },
        {
            stageId: SEA_REGION_CLUSTERING_STAGE_ID,
            seedScope: 'seaRegions',
            plannedOutputs: ['seaRegionClusters']
        },
        {
            stageId: SEA_NAVIGABILITY_TAGGING_STAGE_ID,
            seedScope: 'seaNavigability',
            plannedOutputs: ['seaNavigabilityTagging']
        },
        {
            stageId: COASTAL_DEPTH_APPROXIMATION_STAGE_ID,
            seedScope: 'coastalDepth',
            plannedOutputs: [
                COASTAL_SHELF_DEPTH_FIELD_ID,
                COASTAL_DEPTH_APPROXIMATION_STAGE_ID
            ]
        },
        {
            stageId: WATERSHED_SEGMENTATION_STAGE_ID,
            seedScope: 'riverBasins',
            plannedOutputs: [WATERSHED_SEGMENTATION_STAGE_ID]
        },
        {
            stageId: 'debugExportScaffold',
            seedScope: 'debugExport',
            plannedOutputs: ['hydrosphereFieldSnapshots']
        }
    ]);
    const INTENTIONALLY_ABSENT_OUTPUTS = Object.freeze([
        'marineInvasionField',
        'surfaceDrainageTendencyField',
        'seaRegions',
        'riverBasins',
        'riverRouting',
        'majorRivers',
        'deltaLogic',
        'bays',
        'straits',
        'routeGraph',
        'navigabilityScoring',
        'fishingScore',
        'harborScoring',
        'landingEaseScoring',
        'lakeFormation',
        'marshFormation',
        'climateLogic',
        'terrainCells',
        'gameplaySemantics'
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

    function normalizeStringList(value) {
        return Array.isArray(value)
            ? value
                .filter((entry) => typeof entry === 'string' && entry.trim())
                .map((entry) => entry.trim())
            : [];
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

    function addContainer(containers, value) {
        if (isPlainObject(value)) {
            containers.push(value);
        }
    }

    function buildDependencyContainers(input = {}) {
        const sourceInput = isPlainObject(input) ? input : {};
        const reliefElevation = isPlainObject(sourceInput.reliefElevation) ? sourceInput.reliefElevation : {};
        const directOutputs = isPlainObject(sourceInput.outputs) ? sourceInput.outputs : {};
        const reliefOutputs = isPlainObject(reliefElevation.outputs) ? reliefElevation.outputs : {};

        const fieldContainers = [];
        addContainer(fieldContainers, sourceInput.fields);
        addContainer(fieldContainers, directOutputs.fields);
        addContainer(fieldContainers, reliefElevation.fields);
        addContainer(fieldContainers, reliefOutputs.fields);

        const intermediateContainers = [];
        addContainer(intermediateContainers, sourceInput.intermediateOutputs);
        addContainer(intermediateContainers, directOutputs.intermediateOutputs);
        addContainer(intermediateContainers, reliefElevation.intermediateOutputs);
        addContainer(intermediateContainers, reliefOutputs.intermediateOutputs);

        const recordContainers = [];
        addContainer(recordContainers, sourceInput.records);
        addContainer(recordContainers, directOutputs.records);
        addContainer(recordContainers, reliefElevation.records);
        addContainer(recordContainers, reliefOutputs.records);

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

    function describeHydrosphereDependencyAvailability(input = {}) {
        const containers = buildDependencyContainers(input);
        const fields = describeDependencyAvailability(FIELD_DEPENDENCIES, containers.fields, 'fieldId');
        const intermediateOutputs = describeDependencyAvailability(INTERMEDIATE_DEPENDENCIES, containers.intermediateOutputs, 'outputId');
        const records = describeDependencyAvailability(RECORD_DEPENDENCIES, containers.records, 'outputId');
        const missingRequired = fields
            .concat(intermediateOutputs, records)
            .filter((dependency) => dependency.required && !dependency.available)
            .map((dependency) => dependency.fieldId || dependency.outputId);

        return {
            fields,
            intermediateOutputs,
            records,
            missingRequired
        };
    }

    function createEmptyHydrosphereOutputs() {
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

    function serializeScalarField(fieldId, worldBounds, values, extra = {}) {
        const normalizedBounds = normalizeWorldBounds(worldBounds);
        const size = normalizedBounds.width * normalizedBounds.height;
        const normalizedValues = Array.isArray(values)
            ? values.slice(0, size).map(roundFieldValue)
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
            valueEncoding: OCEAN_CONNECTIVITY_VALUE_ENCODING,
            values: normalizedValues,
            stats: buildFieldStats(normalizedValues),
            ...extra
        };
    }

    function normalizeSerializedField(field, fallbackBounds = DEFAULT_WORLD_BOUNDS) {
        if (!field || typeof field !== 'object') {
            const fallback = normalizeWorldBounds(fallbackBounds);
            return {
                fieldId: 'missingField',
                width: fallback.width,
                height: fallback.height,
                size: fallback.width * fallback.height,
                threshold: DEFAULT_WATER_THRESHOLD,
                values: new Array(fallback.width * fallback.height).fill(1)
            };
        }

        const width = normalizeInteger(field.width, fallbackBounds.width);
        const height = normalizeInteger(field.height, fallbackBounds.height);
        const size = width * height;
        let values = [];

        if (Array.isArray(field.values)) {
            values = field.values.slice(0, size).map((value) => clampUnitInterval(value, 0));
        } else if (typeof field.cloneValues === 'function') {
            values = Array.from(field.cloneValues()).slice(0, size).map((value) => clampUnitInterval(value, 0));
        } else if (typeof field.read === 'function') {
            values = [];
            for (let y = 0; y < height; y += 1) {
                for (let x = 0; x < width; x += 1) {
                    values.push(clampUnitInterval(field.read(x, y, 1), 1));
                }
            }
        }

        while (values.length < size) {
            values.push(1);
        }

        return {
            fieldId: normalizeString(field.fieldId, 'serializedField'),
            width,
            height,
            size,
            threshold: clampUnitInterval(field.threshold, DEFAULT_WATER_THRESHOLD),
            values
        };
    }

    function getSourceFieldInputs(input = {}) {
        const containers = buildDependencyContainers(input);
        return {
            seaLevelAppliedElevationField: findDependencyValue(containers.fields, 'seaLevelAppliedElevationField'),
            landWaterMaskField: findDependencyValue(containers.fields, 'landWaterMaskField'),
            landmassCleanupMaskField: findDependencyValue(containers.fields, 'landmassCleanupMaskField'),
            basinDepressionField: findDependencyValue(containers.fields, 'basinDepressionField'),
            mountainAmplificationField: findDependencyValue(containers.fields, 'mountainAmplificationField'),
            plateauCandidateField: findDependencyValue(containers.fields, 'plateauCandidateField')
        };
    }

    function createConstantSourceField(fieldId, worldBounds, value = 0, threshold = DEFAULT_WATER_THRESHOLD) {
        const normalizedBounds = normalizeWorldBounds(worldBounds);
        const normalizedValue = clampUnitInterval(value, 0);
        return {
            fieldId,
            width: normalizedBounds.width,
            height: normalizedBounds.height,
            size: normalizedBounds.width * normalizedBounds.height,
            threshold: clampUnitInterval(threshold, DEFAULT_WATER_THRESHOLD),
            values: new Array(normalizedBounds.width * normalizedBounds.height).fill(normalizedValue)
        };
    }

    function getBasinDepressionField(input = {}, normalizedInput = normalizeInput(input)) {
        const sourceFields = getSourceFieldInputs(input);
        if (!sourceFields.basinDepressionField) {
            return createConstantSourceField('basinDepressionField', normalizedInput.worldBounds, 0, 0);
        }

        return normalizeSerializedField(sourceFields.basinDepressionField, normalizedInput.worldBounds);
    }

    function getMountainAmplificationField(input = {}, normalizedInput = normalizeInput(input)) {
        const sourceFields = getSourceFieldInputs(input);
        if (!sourceFields.mountainAmplificationField) {
            return createConstantSourceField('mountainAmplificationField', normalizedInput.worldBounds, 0, 0);
        }

        return normalizeSerializedField(sourceFields.mountainAmplificationField, normalizedInput.worldBounds);
    }

    function getPlateauCandidateField(input = {}, normalizedInput = normalizeInput(input)) {
        const sourceFields = getSourceFieldInputs(input);
        if (!sourceFields.plateauCandidateField) {
            return createConstantSourceField('plateauCandidateField', normalizedInput.worldBounds, 0, 0);
        }

        return normalizeSerializedField(sourceFields.plateauCandidateField, normalizedInput.worldBounds);
    }

    function getFloodFillSourceField(input = {}, normalizedInput = normalizeInput(input)) {
        const sourceFields = getSourceFieldInputs(input);
        const selectedField = sourceFields.landmassCleanupMaskField
            || sourceFields.landWaterMaskField
            || sourceFields.seaLevelAppliedElevationField
            || null;

        return normalizeSerializedField(selectedField, normalizedInput.worldBounds);
    }

    function pointFromIndex(index, width) {
        return {
            x: index % width,
            y: Math.floor(index / width)
        };
    }

    function hashUint32(seed, value) {
        let hash = normalizeSeed(seed) ^ normalizeSeed(value);
        hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
        hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
        hash ^= hash >>> 16;
        return hash >>> 0;
    }

    function deterministicUnitNoise(seed, value) {
        return hashUint32(seed, value) / 0xffffffff;
    }

    function createBoundingBox() {
        return {
            minX: Number.POSITIVE_INFINITY,
            minY: Number.POSITIVE_INFINITY,
            maxX: Number.NEGATIVE_INFINITY,
            maxY: Number.NEGATIVE_INFINITY
        };
    }

    function updateBoundingBox(boundingBox, x, y) {
        boundingBox.minX = Math.min(boundingBox.minX, x);
        boundingBox.minY = Math.min(boundingBox.minY, y);
        boundingBox.maxX = Math.max(boundingBox.maxX, x);
        boundingBox.maxY = Math.max(boundingBox.maxY, y);
    }

    function normalizeBoundingBox(boundingBox) {
        if (!Number.isFinite(boundingBox.minX)) {
            return {
                minX: 0,
                minY: 0,
                maxX: 0,
                maxY: 0
            };
        }

        return {
            minX: boundingBox.minX,
            minY: boundingBox.minY,
            maxX: boundingBox.maxX,
            maxY: boundingBox.maxY
        };
    }

    function createOceanBasinId(kind, sequence) {
        const prefix = kind === 'open_ocean' ? 'open_ocean' : 'enclosed_water';
        return `${prefix}_${String(sequence).padStart(2, '0')}`;
    }

    function createSeaRegionClusterId(sequence) {
        return `seaRegionCluster_${String(sequence).padStart(3, '0')}`;
    }

    function createSeaRegionId(sequence) {
        return `sea_${String(sequence).padStart(2, '0')}`;
    }

    function getNeighborIndices(index, width, height) {
        const point = pointFromIndex(index, width);
        const neighbors = [];

        if (point.x > 0) {
            neighbors.push(index - 1);
        }
        if (point.x < width - 1) {
            neighbors.push(index + 1);
        }
        if (point.y > 0) {
            neighbors.push(index - width);
        }
        if (point.y < height - 1) {
            neighbors.push(index + width);
        }

        return neighbors;
    }

    function materializeOceanBasinFloodFill(input = {}) {
        const normalizedInput = normalizeInput(input);
        const sourceField = getFloodFillSourceField(input, normalizedInput);
        const width = sourceField.width;
        const height = sourceField.height;
        const size = width * height;
        const threshold = clampUnitInterval(sourceField.threshold, DEFAULT_WATER_THRESHOLD);
        const waterCells = sourceField.values.map((value) => value < threshold);
        const visited = new Array(size).fill(false);
        const connectivityValues = new Array(size).fill(OCEAN_CONNECTIVITY_ENCODING.land);
        const basins = [];
        let openOceanSequence = 0;
        let enclosedWaterSequence = 0;
        let waterCellCount = 0;

        for (let index = 0; index < size; index += 1) {
            if (visited[index] || !waterCells[index]) {
                continue;
            }

            const queue = [index];
            const cellIndices = [];
            const boundingBox = createBoundingBox();
            let queueIndex = 0;
            let touchesWorldEdge = false;
            let centroidXTotal = 0;
            let centroidYTotal = 0;

            visited[index] = true;

            while (queueIndex < queue.length) {
                const currentIndex = queue[queueIndex];
                queueIndex += 1;
                cellIndices.push(currentIndex);
                waterCellCount += 1;

                const point = pointFromIndex(currentIndex, width);
                updateBoundingBox(boundingBox, point.x, point.y);
                centroidXTotal += point.x;
                centroidYTotal += point.y;

                if (point.x === 0 || point.y === 0 || point.x === width - 1 || point.y === height - 1) {
                    touchesWorldEdge = true;
                }

                getNeighborIndices(currentIndex, width, height).forEach((neighborIndex) => {
                    if (!visited[neighborIndex] && waterCells[neighborIndex]) {
                        visited[neighborIndex] = true;
                        queue.push(neighborIndex);
                    }
                });
            }

            const basinKind = touchesWorldEdge ? 'open_ocean' : 'enclosed_water';
            if (basinKind === 'open_ocean') {
                openOceanSequence += 1;
            } else {
                enclosedWaterSequence += 1;
            }

            const basinSequence = basinKind === 'open_ocean' ? openOceanSequence : enclosedWaterSequence;
            const connectivityValue = basinKind === 'open_ocean'
                ? OCEAN_CONNECTIVITY_ENCODING.openOcean
                : OCEAN_CONNECTIVITY_ENCODING.enclosedWater;

            cellIndices.forEach((cellIndex) => {
                connectivityValues[cellIndex] = connectivityValue;
            });

            const cellCount = cellIndices.length;
            const centroidPoint = {
                x: roundFieldValue(centroidXTotal / Math.max(1, cellCount)),
                y: roundFieldValue(centroidYTotal / Math.max(1, cellCount))
            };

            basins.push({
                basinId: createOceanBasinId(basinKind, basinSequence),
                basinKind,
                touchesWorldEdge,
                cellCount,
                normalizedArea: roundFieldValue(cellCount / Math.max(1, size)),
                boundingBox: normalizeBoundingBox(boundingBox),
                centroidPoint,
                normalizedCentroid: {
                    x: roundFieldValue(width > 1 ? centroidPoint.x / (width - 1) : 0),
                    y: roundFieldValue(height > 1 ? centroidPoint.y / (height - 1) : 0)
                },
                cellIndices
            });
        }

        const openOceanBasinCount = basins.filter((basin) => basin.basinKind === 'open_ocean').length;
        const enclosedWaterBasinCount = basins.filter((basin) => basin.basinKind === 'enclosed_water').length;
        const oceanConnectivityMaskField = serializeScalarField(
            OCEAN_CONNECTIVITY_MASK_FIELD_ID,
            { width, height },
            connectivityValues,
            {
                stageId: OCEAN_BASIN_FLOOD_FILL_STAGE_ID,
                sourceFieldIds: [
                    sourceField.fieldId
                ],
                threshold,
                classificationEncoding: cloneValue(OCEAN_CONNECTIVITY_ENCODING),
                compatibility: {
                    futureSeaRegionClusteringInput: true,
                    distinguishesOpenOceanAndEnclosedWater: true,
                    sameWorldBoundsRequired: true
                }
            }
        );
        const oceanBasinFloodFill = {
            floodFillId: OCEAN_BASIN_FLOOD_FILL_STAGE_ID,
            stageId: OCEAN_BASIN_FLOOD_FILL_STAGE_ID,
            sourceFieldIds: [
                sourceField.fieldId
            ],
            worldBounds: {
                width,
                height
            },
            waterThreshold: threshold,
            connectivityFieldId: OCEAN_CONNECTIVITY_MASK_FIELD_ID,
            connectivityEncoding: cloneValue(OCEAN_CONNECTIVITY_ENCODING),
            basinCount: basins.length,
            openOceanBasinCount,
            enclosedWaterBasinCount,
            waterCellCount,
            landCellCount: Math.max(0, size - waterCellCount),
            waterCellRatio: roundFieldValue(waterCellCount / Math.max(1, size)),
            floodFillModel: 'cardinalConnectedWaterComponentsV1',
            classificationModel: 'touchesWorldEdgeOpenOceanV1',
            waterBasins: basins,
            summary: {
                hasOpenOcean: openOceanBasinCount > 0,
                hasEnclosedWater: enclosedWaterBasinCount > 0,
                largestOpenOceanCellCount: Math.max(0, ...basins
                    .filter((basin) => basin.basinKind === 'open_ocean')
                    .map((basin) => basin.cellCount)),
                largestEnclosedWaterCellCount: Math.max(0, ...basins
                    .filter((basin) => basin.basinKind === 'enclosed_water')
                    .map((basin) => basin.cellCount))
            },
            compatibility: {
                futureSeaRegionClusteringInput: true,
                futureMarineCarvingInput: true,
                futureRiverBasinTerminalInput: true,
                distinguishesOpenOceanAndEnclosedWater: true,
                sameWorldBoundsRequired: true
            },
            intentionallyAbsent: [
                'seaRegions',
                'seaRegionClustering',
                'navigability',
                'macroRoutes',
                'riverRouting',
                'climateLogic',
                'terrainCells',
                'gameplaySemantics'
            ]
        };

        return {
            oceanBasinFloodFill,
            oceanConnectivityMaskField
        };
    }

    function createSeaRegionRecordDraft(input = {}) {
        if (typeof macro.createSeaRegionRecordSkeleton === 'function') {
            return macro.createSeaRegionRecordSkeleton(input);
        }

        return {
            seaRegionId: normalizeString(input.seaRegionId, ''),
            basinType: normalizeString(input.basinType, ''),
            stormPressure: clampUnitInterval(input.stormPressure, 0),
            navigability: clampUnitInterval(input.navigability, 0),
            climateBandIds: Array.isArray(input.climateBandIds)
                ? input.climateBandIds.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim())
                : [],
            primaryClimateBandId: normalizeString(input.primaryClimateBandId, '')
        };
    }

    function createRiverBasinRecordDraft(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        if (typeof macro.createRiverBasinRecordSkeleton === 'function') {
            return macro.createRiverBasinRecordSkeleton(normalizedInput);
        }

        return {
            riverBasinId: normalizeString(normalizedInput.riverBasinId, ''),
            basinType: normalizeString(normalizedInput.basinType, ''),
            sourceMountainSystemIds: normalizeStringList(normalizedInput.sourceMountainSystemIds),
            reliefRegionIds: normalizeStringList(normalizedInput.reliefRegionIds),
            climateBandIds: normalizeStringList(normalizedInput.climateBandIds),
            terminalSeaRegionIds: normalizeStringList(normalizedInput.terminalSeaRegionIds),
            primaryReliefRegionId: normalizeString(normalizedInput.primaryReliefRegionId, ''),
            primaryClimateBandId: normalizeString(normalizedInput.primaryClimateBandId, ''),
            catchmentScale: clampUnitInterval(normalizedInput.catchmentScale, 0),
            basinContinuity: clampUnitInterval(normalizedInput.basinContinuity, 0)
        };
    }

    function createRiverBasinId(sequence) {
        return `basin_${String(sequence).padStart(3, '0')}`;
    }

    function createWatershedId(sequence) {
        return `watershed_${String(sequence).padStart(3, '0')}`;
    }

    function resolveOceanBasinFloodFill(input = {}, fallbackOutput = null) {
        if (fallbackOutput && fallbackOutput.oceanBasinFloodFill) {
            return fallbackOutput.oceanBasinFloodFill;
        }

        const containers = buildDependencyContainers(input);
        const existing = findDependencyValue(containers.intermediateOutputs, OCEAN_BASIN_FLOOD_FILL_STAGE_ID);
        if (existing && Array.isArray(existing.waterBasins)) {
            return existing;
        }

        return materializeOceanBasinFloodFill(input).oceanBasinFloodFill;
    }

    function resolveSeaRegionClusters(input = {}, fallbackFloodFillOutput = null, fallbackSeaRegionClusterOutput = null) {
        if (fallbackSeaRegionClusterOutput && fallbackSeaRegionClusterOutput.seaRegionClusters) {
            return fallbackSeaRegionClusterOutput.seaRegionClusters;
        }

        const containers = buildDependencyContainers(input);
        const existing = findDependencyValue(containers.intermediateOutputs, 'seaRegionClusters');
        if (existing && Array.isArray(existing.seaRegionClusters)) {
            return existing;
        }

        return materializeSeaRegionClusters(input, fallbackFloodFillOutput).seaRegionClusters;
    }

    function buildSeaRegionGeometryMetrics(basin = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedBounds = normalizeWorldBounds(worldBounds);
        const boundingBox = normalizeBoundingBox(basin.boundingBox || {});
        const boundingBoxWidth = Math.max(1, (boundingBox.maxX - boundingBox.minX) + 1);
        const boundingBoxHeight = Math.max(1, (boundingBox.maxY - boundingBox.minY) + 1);
        const boundingBoxArea = Math.max(1, boundingBoxWidth * boundingBoxHeight);
        const cellCount = normalizeInteger(basin.cellCount, 0);
        const normalizedArea = clampUnitInterval(basin.normalizedArea, 0);
        const cellIndexSet = new Set(Array.isArray(basin.cellIndices) ? basin.cellIndices : []);
        let shorelineEdgeCount = 0;

        cellIndexSet.forEach((cellIndex) => {
            const neighborIndices = getNeighborIndices(cellIndex, normalizedBounds.width, normalizedBounds.height);
            shorelineEdgeCount += Math.max(0, 4 - neighborIndices.length);

            neighborIndices.forEach((neighborIndex) => {
                if (!cellIndexSet.has(neighborIndex)) {
                    shorelineEdgeCount += 1;
                }
            });
        });

        const compactness = clampUnitInterval(cellCount / boundingBoxArea, 0);
        const elongationRatio = roundFieldValue(
            Math.max(boundingBoxWidth, boundingBoxHeight) / Math.max(1, Math.min(boundingBoxWidth, boundingBoxHeight))
        );
        const shorelineComplexity = roundFieldValue(
            shorelineEdgeCount / Math.max(1, Math.sqrt(Math.max(1, cellCount)) * 4)
        );
        const enclosureBias = basin.basinKind === 'open_ocean' ? 0 : 1;

        return {
            geometryClass: basin.basinKind === 'open_ocean'
                ? 'edgeConnectedBasin'
                : 'enclosedBasin',
            metrics: {
                boundingBoxWidth,
                boundingBoxHeight,
                compactness: roundFieldValue(compactness),
                elongationRatio,
                shorelineEdgeCount,
                shorelineComplexity,
                normalizedArea: roundFieldValue(normalizedArea),
                enclosureBias
            }
        };
    }

    function analyzeSeaRegionEnclosure(basin = {}, worldBounds = DEFAULT_WORLD_BOUNDS, geometryMetrics = {}) {
        const normalizedBounds = normalizeWorldBounds(worldBounds);
        const totalCells = Math.max(1, normalizedBounds.width * normalizedBounds.height);
        const cellIndices = Array.isArray(basin.cellIndices) ? basin.cellIndices : [];
        const cellCount = normalizeInteger(basin.cellCount, cellIndices.length);
        const edgeContactSides = new Set();
        let edgeContactCellCount = 0;

        cellIndices.forEach((cellIndex) => {
            const point = pointFromIndex(cellIndex, normalizedBounds.width);
            let touchesEdge = false;

            if (point.x === 0) {
                touchesEdge = true;
                edgeContactSides.add('west');
            }
            if (point.x === normalizedBounds.width - 1) {
                touchesEdge = true;
                edgeContactSides.add('east');
            }
            if (point.y === 0) {
                touchesEdge = true;
                edgeContactSides.add('north');
            }
            if (point.y === normalizedBounds.height - 1) {
                touchesEdge = true;
                edgeContactSides.add('south');
            }

            if (touchesEdge) {
                edgeContactCellCount += 1;
            }
        });

        const edgeExposureRatio = roundFieldValue(edgeContactCellCount / Math.max(1, cellCount));
        const edgeExposureSideCount = edgeContactSides.size;
        const compactness = clampUnitInterval(geometryMetrics.compactness, 0);
        const shorelineComplexity = Math.max(0, Number(geometryMetrics.shorelineComplexity) || 0);
        const minimumInlandSeaCellCount = Math.max(4, Math.round(totalCells * INLAND_SEA_MIN_AREA_RATIO));
        const minimumSemiEnclosedCellCount = Math.max(6, Math.round(totalCells * SEMI_ENCLOSED_SEA_MIN_AREA_RATIO));
        const isInlandSeaCandidate = basin.basinKind === 'enclosed_water'
            && cellCount >= minimumInlandSeaCellCount;
        const isSemiEnclosedSeaCandidate = basin.basinKind === 'open_ocean'
            && cellCount >= minimumSemiEnclosedCellCount
            && edgeExposureSideCount > 0
            && edgeExposureSideCount <= 2
            && edgeExposureRatio <= SEMI_ENCLOSED_EDGE_EXPOSURE_THRESHOLD
            && (compactness <= 0.85 || shorelineComplexity >= 1);
        const enclosureScore = roundFieldValue(clampUnitInterval(
            ((1 - edgeExposureRatio) * 0.45)
            + ((1 - Math.min(1, edgeExposureSideCount / 4)) * 0.35)
            + ((1 - compactness) * 0.2),
            0
        ));
        const basinType = isInlandSeaCandidate
            ? 'inland_sea'
            : (isSemiEnclosedSeaCandidate ? 'semi_enclosed_sea' : normalizeString(basin.basinKind, 'enclosed_water'));

        return {
            basinType,
            seaRegionFlags: {
                isInlandSeaCandidate,
                isSemiEnclosedSeaCandidate,
                isFullyEnclosed: basin.basinKind === 'enclosed_water',
                isEdgeConnected: basin.basinKind === 'open_ocean'
            },
            classificationSignals: {
                edgeContactSideCount: edgeExposureSideCount,
                edgeContactCellCount,
                edgeExposureRatio,
                enclosureScore,
                minimumInlandSeaCellCount,
                minimumSemiEnclosedCellCount
            }
        };
    }

    function materializeSeaRegionClusters(input = {}, fallbackOutput = null) {
        const normalizedInput = normalizeInput(input);
        const oceanBasinFloodFill = resolveOceanBasinFloodFill(input, fallbackOutput);
        const worldBounds = normalizeWorldBounds(oceanBasinFloodFill.worldBounds || normalizedInput.worldBounds);
        const waterBasins = Array.isArray(oceanBasinFloodFill.waterBasins)
            ? oceanBasinFloodFill.waterBasins
            : [];
        const seaRegionClusters = waterBasins.map((basin, basinIndex) => {
            const sequence = basinIndex + 1;
            const geometry = buildSeaRegionGeometryMetrics(basin, worldBounds);
            const enclosure = analyzeSeaRegionEnclosure(basin, worldBounds, geometry.metrics);
            const basinType = enclosure.basinType;
            const namespace = buildNamespace(PIPELINE_STEP_ID, 'seaRegions', `seaRegion${String(sequence).padStart(2, '0')}`);
            const recordDraft = createSeaRegionRecordDraft({
                seaRegionId: createSeaRegionId(sequence),
                basinType,
                stormPressure: 0,
                navigability: 0,
                climateBandIds: [],
                primaryClimateBandId: ''
            });

            return {
                seaRegionClusterId: createSeaRegionClusterId(sequence),
                sourceBasinId: normalizeString(basin.basinId, ''),
                sourceBasinKind: normalizeString(basin.basinKind, ''),
                recordDraft,
                pendingRecordFields: [
                    'stormPressure',
                    'navigability',
                    'climateBandIds',
                    'primaryClimateBandId'
                ],
                basinKind: normalizeString(basin.basinKind, ''),
                basinType,
                cellCount: normalizeInteger(basin.cellCount, 0),
                cellIndices: Array.isArray(basin.cellIndices) ? basin.cellIndices.slice() : [],
                normalizedArea: clampUnitInterval(basin.normalizedArea, 0),
                boundingBox: normalizeBoundingBox(basin.boundingBox || {}),
                centroidPoint: {
                    x: normalizeInteger(basin.centroidPoint && basin.centroidPoint.x, 0),
                    y: normalizeInteger(basin.centroidPoint && basin.centroidPoint.y, 0)
                },
                normalizedCentroid: {
                    x: clampUnitInterval(basin.normalizedCentroid && basin.normalizedCentroid.x, 0),
                    y: clampUnitInterval(basin.normalizedCentroid && basin.normalizedCentroid.y, 0)
                },
                touchesWorldEdge: Boolean(basin.touchesWorldEdge),
                geometryClass: geometry.geometryClass,
                geometryMetrics: geometry.metrics,
                seaRegionFlags: enclosure.seaRegionFlags,
                classificationSignals: enclosure.classificationSignals,
                namespace,
                seed: deriveSubSeed(normalizedInput.macroSeed, namespace)
            };
        });
        const openOceanClusterCount = seaRegionClusters.filter((cluster) => cluster.basinType === 'open_ocean').length;
        const enclosedWaterClusterCount = seaRegionClusters.filter((cluster) => cluster.basinType === 'enclosed_water').length;
        const inlandSeaClusterCount = seaRegionClusters.filter((cluster) => cluster.basinType === 'inland_sea').length;
        const semiEnclosedSeaClusterCount = seaRegionClusters.filter((cluster) => cluster.basinType === 'semi_enclosed_sea').length;

        return {
            seaRegionClusters: {
                seaRegionClusterSetId: SEA_REGION_CLUSTERING_STAGE_ID,
                stageId: SEA_REGION_CLUSTERING_STAGE_ID,
                sourceOutputIds: [
                    OCEAN_BASIN_FLOOD_FILL_STAGE_ID,
                    OCEAN_CONNECTIVITY_MASK_FIELD_ID
                ],
                worldBounds: cloneValue(worldBounds),
                clusterCount: seaRegionClusters.length,
                clusteringModel: 'connectedWaterGeometryClustersV1',
                sourceBasinCount: waterBasins.length,
                seaRegionClusters,
                summary: {
                    openOceanClusterCount,
                    enclosedWaterClusterCount,
                    inlandSeaClusterCount,
                    semiEnclosedSeaClusterCount,
                    largestClusterCellCount: Math.max(0, ...seaRegionClusters.map((cluster) => cluster.cellCount)),
                    largestOpenOceanClusterCellCount: Math.max(
                        0,
                        ...seaRegionClusters
                            .filter((cluster) => cluster.basinType === 'open_ocean')
                            .map((cluster) => cluster.cellCount)
                    ),
                    largestEnclosedWaterClusterCellCount: Math.max(
                        0,
                        ...seaRegionClusters
                            .filter((cluster) => cluster.basinType === 'enclosed_water')
                            .map((cluster) => cluster.cellCount)
                    ),
                    largestInlandSeaClusterCellCount: Math.max(
                        0,
                        ...seaRegionClusters
                            .filter((cluster) => cluster.basinType === 'inland_sea')
                            .map((cluster) => cluster.cellCount)
                    ),
                    largestSemiEnclosedSeaClusterCellCount: Math.max(
                        0,
                        ...seaRegionClusters
                            .filter((cluster) => cluster.basinType === 'semi_enclosed_sea')
                            .map((cluster) => cluster.cellCount)
                    )
                },
                compatibility: {
                    futureSeaRegionRecordInput: true,
                    requiresClimateBandLinkage: true,
                    requiresNavigabilityScoring: true,
                    futureInlandSeaFormationInput: true,
                    sameWorldBoundsRequired: true
                },
                intentionallyAbsent: [
                    'seaRegions',
                    'bays',
                    'straits',
                    'routeGraph',
                    'macroRoutes',
                    'riverRouting',
                    'riverDeltas',
                    'climateLogic',
                    'terrainCells',
                    'gameplaySemantics'
                ]
            }
        };
    }

    function classifyNavigabilityScore(score) {
        const normalizedScore = clampUnitInterval(score, 0);
        if (normalizedScore >= 0.67) {
            return 'high_navigability';
        }
        if (normalizedScore >= 0.42) {
            return 'restricted_navigability';
        }

        return 'hazard_limited';
    }

    function classifyHazardRoughness(score) {
        const normalizedScore = clampUnitInterval(score, 0);
        if (normalizedScore >= 0.67) {
            return 'rough_hazard';
        }
        if (normalizedScore >= 0.38) {
            return 'mixed_hazard';
        }

        return 'calm_hazard';
    }

    function buildSeaNavigabilitySignals(cluster = {}, stageSeed = 0, clusterIndex = 0) {
        const geometryMetrics = isPlainObject(cluster.geometryMetrics) ? cluster.geometryMetrics : {};
        const classificationSignals = isPlainObject(cluster.classificationSignals) ? cluster.classificationSignals : {};
        const seaRegionFlags = isPlainObject(cluster.seaRegionFlags) ? cluster.seaRegionFlags : {};
        const basinType = normalizeString(cluster.basinType, 'enclosed_water');
        const normalizedArea = clampUnitInterval(cluster.normalizedArea, 0);
        const compactness = clampUnitInterval(geometryMetrics.compactness, 0);
        const shorelineComplexity = clampUnitInterval((Number(geometryMetrics.shorelineComplexity) || 0) / 2);
        const elongationPenalty = clampUnitInterval(((Number(geometryMetrics.elongationRatio) || 1) - 1) / 4);
        const enclosureScore = clampUnitInterval(classificationSignals.enclosureScore, 0);
        const edgeExposureRatio = clampUnitInterval(classificationSignals.edgeExposureRatio, 0);
        const areaSupport = clampUnitInterval(normalizedArea / 0.18);
        const openWaterBias = seaRegionFlags.isEdgeConnected ? 1 : 0;
        const constrainedWaterBias = seaRegionFlags.isFullyEnclosed
            ? 1
            : (basinType === 'semi_enclosed_sea' ? 0.6 : 0);
        const basinBaseNavigability = basinType === 'open_ocean'
            ? 0.72
            : (basinType === 'semi_enclosed_sea'
                ? 0.6
                : (basinType === 'inland_sea' ? 0.46 : 0.52));
        const noise = deterministicUnitNoise(stageSeed, clusterIndex + 1 + normalizeInteger(cluster.cellCount, 0));
        const hazardRoughness = roundFieldValue(clampUnitInterval(
            (shorelineComplexity * 0.34)
            + (enclosureScore * 0.22)
            + (edgeExposureRatio * (openWaterBias ? 0.2 : 0.08))
            + (elongationPenalty * 0.1)
            + (constrainedWaterBias * 0.08)
            + (noise * 0.06),
            0
        ));
        const navigability = roundFieldValue(clampUnitInterval(
            basinBaseNavigability
            + (areaSupport * 0.12)
            + (compactness * 0.06)
            - (hazardRoughness * 0.28)
            - (shorelineComplexity * 0.08)
            - (enclosureScore * 0.08)
            - (elongationPenalty * 0.05)
            + ((noise - 0.5) * 0.08),
            basinBaseNavigability
        ));
        const navigabilityClass = classifyNavigabilityScore(navigability);
        const hazardRoughnessClass = classifyHazardRoughness(hazardRoughness);

        return {
            navigability,
            navigabilityClass,
            hazardRoughness,
            hazardRoughnessClass,
            openWaterBias: roundFieldValue(openWaterBias),
            constrainedWaterBias: roundFieldValue(constrainedWaterBias),
            areaSupport: roundFieldValue(areaSupport),
            compactness: roundFieldValue(compactness),
            shorelineComplexity,
            elongationPenalty: roundFieldValue(elongationPenalty),
            enclosureScore: roundFieldValue(enclosureScore),
            edgeExposureRatio: roundFieldValue(edgeExposureRatio),
            navigabilityTags: [
                basinType,
                navigabilityClass,
                hazardRoughnessClass,
                openWaterBias ? 'edge_connected' : 'confined_water'
            ]
        };
    }

    function materializeSeaNavigabilityTagging(input = {}, fallbackFloodFillOutput = null, fallbackSeaRegionClusterOutput = null) {
        const normalizedInput = normalizeInput(input);
        const oceanBasinFloodFill = resolveOceanBasinFloodFill(input, fallbackFloodFillOutput);
        const seaRegionClustersOutput = resolveSeaRegionClusters(input, fallbackFloodFillOutput, fallbackSeaRegionClusterOutput);
        const worldBounds = normalizeWorldBounds(seaRegionClustersOutput.worldBounds || oceanBasinFloodFill.worldBounds || normalizedInput.worldBounds);
        const seaRegionClusters = Array.isArray(seaRegionClustersOutput.seaRegionClusters)
            ? seaRegionClustersOutput.seaRegionClusters
            : [];
        const stageNamespace = buildNamespace(PIPELINE_STEP_ID, 'seaNavigability');
        const stageSeed = deriveSubSeed(normalizedInput.macroSeed, stageNamespace);
        const taggedSeaRegionClusters = seaRegionClusters.map((cluster, clusterIndex) => {
            const clusterNamespace = buildNamespace(
                normalizeString(cluster.namespace, buildNamespace(PIPELINE_STEP_ID, 'seaRegions', `seaRegion${String(clusterIndex + 1).padStart(2, '0')}`)),
                'navigability'
            );
            const clusterSeed = deriveSubSeed(stageSeed, clusterNamespace);
            const navigabilitySignals = buildSeaNavigabilitySignals(cluster, clusterSeed, clusterIndex);
            const recordDraft = createSeaRegionRecordDraft({
                ...(isPlainObject(cluster.recordDraft) ? cluster.recordDraft : {}),
                seaRegionId: normalizeString(cluster.recordDraft && cluster.recordDraft.seaRegionId, createSeaRegionId(clusterIndex + 1)),
                basinType: normalizeString(cluster.basinType, normalizeString(cluster.recordDraft && cluster.recordDraft.basinType, 'enclosed_water')),
                stormPressure: navigabilitySignals.hazardRoughness,
                navigability: navigabilitySignals.navigability,
                climateBandIds: Array.isArray(cluster.recordDraft && cluster.recordDraft.climateBandIds)
                    ? cluster.recordDraft.climateBandIds
                    : [],
                primaryClimateBandId: normalizeString(cluster.recordDraft && cluster.recordDraft.primaryClimateBandId, '')
            });
            const pendingRecordFields = Array.isArray(cluster.pendingRecordFields)
                ? Array.from(new Set(cluster.pendingRecordFields.filter((fieldId) => fieldId !== 'stormPressure' && fieldId !== 'navigability')))
                : ['climateBandIds', 'primaryClimateBandId'];

            return {
                seaRegionClusterId: normalizeString(cluster.seaRegionClusterId, createSeaRegionClusterId(clusterIndex + 1)),
                sourceBasinId: normalizeString(cluster.sourceBasinId, ''),
                sourceBasinKind: normalizeString(cluster.sourceBasinKind, normalizeString(cluster.basinKind, '')),
                recordDraft,
                pendingRecordFields,
                basinKind: normalizeString(cluster.basinKind, ''),
                basinType: normalizeString(cluster.basinType, recordDraft.basinType),
                cellCount: normalizeInteger(cluster.cellCount, 0),
                cellIndices: Array.isArray(cluster.cellIndices) ? cluster.cellIndices.slice() : [],
                normalizedArea: clampUnitInterval(cluster.normalizedArea, 0),
                boundingBox: normalizeBoundingBox(cluster.boundingBox || {}),
                centroidPoint: {
                    x: normalizeInteger(cluster.centroidPoint && cluster.centroidPoint.x, 0),
                    y: normalizeInteger(cluster.centroidPoint && cluster.centroidPoint.y, 0)
                },
                normalizedCentroid: {
                    x: clampUnitInterval(cluster.normalizedCentroid && cluster.normalizedCentroid.x, 0),
                    y: clampUnitInterval(cluster.normalizedCentroid && cluster.normalizedCentroid.y, 0)
                },
                touchesWorldEdge: Boolean(cluster.touchesWorldEdge),
                geometryClass: normalizeString(cluster.geometryClass, ''),
                geometryMetrics: cloneValue(cluster.geometryMetrics || {}),
                seaRegionFlags: cloneValue(cluster.seaRegionFlags || {}),
                classificationSignals: cloneValue(cluster.classificationSignals || {}),
                navigability: navigabilitySignals.navigability,
                navigabilityClass: navigabilitySignals.navigabilityClass,
                hazardRoughness: navigabilitySignals.hazardRoughness,
                hazardRoughnessClass: navigabilitySignals.hazardRoughnessClass,
                navigabilityTags: navigabilitySignals.navigabilityTags.slice(),
                routeGraphPreparation: {
                    futureRouteGraphInput: true,
                    traversabilityBias: navigabilitySignals.navigability,
                    hazardPenalty: navigabilitySignals.hazardRoughness,
                    openWaterBias: navigabilitySignals.openWaterBias,
                    constrainedWaterBias: navigabilitySignals.constrainedWaterBias
                },
                navigabilitySignals: {
                    areaSupport: navigabilitySignals.areaSupport,
                    compactness: navigabilitySignals.compactness,
                    shorelineComplexity: navigabilitySignals.shorelineComplexity,
                    elongationPenalty: navigabilitySignals.elongationPenalty,
                    enclosureScore: navigabilitySignals.enclosureScore,
                    edgeExposureRatio: navigabilitySignals.edgeExposureRatio
                },
                namespace: clusterNamespace,
                seed: clusterSeed
            };
        });
        const highNavigabilityCount = taggedSeaRegionClusters.filter((cluster) => cluster.navigabilityClass === 'high_navigability').length;
        const restrictedNavigabilityCount = taggedSeaRegionClusters.filter((cluster) => cluster.navigabilityClass === 'restricted_navigability').length;
        const hazardLimitedCount = taggedSeaRegionClusters.filter((cluster) => cluster.navigabilityClass === 'hazard_limited').length;
        const calmHazardCount = taggedSeaRegionClusters.filter((cluster) => cluster.hazardRoughnessClass === 'calm_hazard').length;
        const mixedHazardCount = taggedSeaRegionClusters.filter((cluster) => cluster.hazardRoughnessClass === 'mixed_hazard').length;
        const roughHazardCount = taggedSeaRegionClusters.filter((cluster) => cluster.hazardRoughnessClass === 'rough_hazard').length;

        return {
            seaNavigabilityTagging: {
                seaNavigabilityTaggingId: SEA_NAVIGABILITY_TAGGING_STAGE_ID,
                stageId: SEA_NAVIGABILITY_TAGGING_STAGE_ID,
                sourceOutputIds: [
                    SEA_REGION_CLUSTERING_STAGE_ID,
                    OCEAN_BASIN_FLOOD_FILL_STAGE_ID,
                    OCEAN_CONNECTIVITY_MASK_FIELD_ID
                ],
                worldBounds: cloneValue(worldBounds),
                taggedClusterCount: taggedSeaRegionClusters.length,
                taggingModel: 'deterministicSeaNavigabilityTaggingV1',
                taggedSeaRegionClusters,
                summary: {
                    highNavigabilityCount,
                    restrictedNavigabilityCount,
                    hazardLimitedCount,
                    calmHazardCount,
                    mixedHazardCount,
                    roughHazardCount,
                    meanNavigability: roundFieldValue(
                        taggedSeaRegionClusters.reduce((total, cluster) => total + cluster.navigability, 0)
                        / Math.max(1, taggedSeaRegionClusters.length)
                    ),
                    meanHazardRoughness: roundFieldValue(
                        taggedSeaRegionClusters.reduce((total, cluster) => total + cluster.hazardRoughness, 0)
                        / Math.max(1, taggedSeaRegionClusters.length)
                    )
                },
                compatibility: {
                    futureSeaRegionRecordInput: true,
                    futureRouteGraphInput: true,
                    requiresClimateBandLinkage: true,
                    sameWorldBoundsRequired: true
                },
                intentionallyAbsent: [
                    'seaRegions',
                    'macroRoutes',
                    'routeGraph',
                    'gameplaySailingRules',
                    'climateLogic',
                    'terrainCells',
                    'gameplaySemantics'
                ]
            }
        };
    }

    function resolveSeaNavigabilityTagging(input = {}, fallbackFloodFillOutput = null, fallbackSeaRegionClusterOutput = null, fallbackSeaNavigabilityOutput = null) {
        if (fallbackSeaNavigabilityOutput && fallbackSeaNavigabilityOutput.seaNavigabilityTagging) {
            return fallbackSeaNavigabilityOutput.seaNavigabilityTagging;
        }

        const containers = buildDependencyContainers(input);
        const existing = findDependencyValue(containers.intermediateOutputs, SEA_NAVIGABILITY_TAGGING_STAGE_ID);
        if (existing && Array.isArray(existing.taggedSeaRegionClusters)) {
            return existing;
        }

        return materializeSeaNavigabilityTagging(
            input,
            fallbackFloodFillOutput,
            fallbackSeaRegionClusterOutput
        ).seaNavigabilityTagging;
    }

    function buildWaterCellMask(oceanBasinFloodFill = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedBounds = normalizeWorldBounds(worldBounds);
        const size = normalizedBounds.width * normalizedBounds.height;
        const waterCells = new Array(size).fill(false);
        const basins = Array.isArray(oceanBasinFloodFill.waterBasins) ? oceanBasinFloodFill.waterBasins : [];

        basins.forEach((basin) => {
            const cellIndices = Array.isArray(basin.cellIndices) ? basin.cellIndices : [];
            cellIndices.forEach((cellIndex) => {
                const normalizedIndex = Number.isFinite(Number(cellIndex)) ? Math.trunc(Number(cellIndex)) : -1;
                if (normalizedIndex >= 0 && normalizedIndex < size) {
                    waterCells[normalizedIndex] = true;
                }
            });
        });

        return waterCells;
    }

    function computeCoastalWaterDistances(waterCells = [], worldBounds = DEFAULT_WORLD_BOUNDS, maxDistance = DEFAULT_SHELF_DISTANCE_CELLS) {
        const normalizedBounds = normalizeWorldBounds(worldBounds);
        const size = normalizedBounds.width * normalizedBounds.height;
        const shelfDistanceLimit = Math.max(1, normalizeInteger(maxDistance, DEFAULT_SHELF_DISTANCE_CELLS));
        const distances = new Array(size).fill(Number.POSITIVE_INFINITY);
        const queue = [];

        for (let index = 0; index < size; index += 1) {
            if (!waterCells[index]) {
                continue;
            }

            const touchesLand = getNeighborIndices(index, normalizedBounds.width, normalizedBounds.height)
                .some((neighborIndex) => !waterCells[neighborIndex]);
            if (!touchesLand) {
                continue;
            }

            distances[index] = 1;
            queue.push(index);
        }

        for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
            const currentIndex = queue[queueIndex];
            const nextDistance = distances[currentIndex] + 1;
            if (nextDistance > shelfDistanceLimit) {
                continue;
            }

            getNeighborIndices(currentIndex, normalizedBounds.width, normalizedBounds.height).forEach((neighborIndex) => {
                if (!waterCells[neighborIndex] || distances[neighborIndex] <= nextDistance) {
                    return;
                }

                distances[neighborIndex] = nextDistance;
                queue.push(neighborIndex);
            });
        }

        return distances;
    }

    function classifyShelfDepthZone(score) {
        const normalizedScore = clampUnitInterval(score, 0);
        if (normalizedScore >= 0.66) {
            return 'nearshore_shelf';
        }
        if (normalizedScore >= 0.33) {
            return 'coastal_slope';
        }
        if (normalizedScore > 0) {
            return 'offshore_transition';
        }

        return 'deep_or_land';
    }

    function buildCoastalDepthZoneSummary(cluster = {}, shelfValues = [], waterCells = [], worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedBounds = normalizeWorldBounds(worldBounds);
        const size = normalizedBounds.width * normalizedBounds.height;
        const cellIndices = Array.isArray(cluster.cellIndices) ? cluster.cellIndices : [];
        let validWaterCellCount = 0;
        let nearshoreShelfCellCount = 0;
        let coastalSlopeCellCount = 0;
        let offshoreTransitionCellCount = 0;
        let deepWaterCellCount = 0;
        let shelfScoreSum = 0;
        let maxShelfScore = 0;

        cellIndices.forEach((cellIndex) => {
            const normalizedIndex = Number.isFinite(Number(cellIndex)) ? Math.trunc(Number(cellIndex)) : -1;
            if (normalizedIndex < 0 || normalizedIndex >= size || !waterCells[normalizedIndex]) {
                return;
            }

            const shelfScore = clampUnitInterval(shelfValues[normalizedIndex], 0);
            validWaterCellCount += 1;
            shelfScoreSum += shelfScore;
            maxShelfScore = Math.max(maxShelfScore, shelfScore);

            const zone = classifyShelfDepthZone(shelfScore);
            if (zone === 'nearshore_shelf') {
                nearshoreShelfCellCount += 1;
            } else if (zone === 'coastal_slope') {
                coastalSlopeCellCount += 1;
            } else if (zone === 'offshore_transition') {
                offshoreTransitionCellCount += 1;
            } else {
                deepWaterCellCount += 1;
            }
        });

        const zoneCounts = {
            nearshore_shelf: nearshoreShelfCellCount,
            coastal_slope: coastalSlopeCellCount,
            offshore_transition: offshoreTransitionCellCount,
            deep_or_land: deepWaterCellCount
        };
        const dominantDepthZone = validWaterCellCount > 0
            ? Object.entries(zoneCounts)
                .sort((left, right) => {
                    if (right[1] !== left[1]) {
                        return right[1] - left[1];
                    }
                    return left[0].localeCompare(right[0]);
                })[0][0]
            : 'deep_or_land';
        const meanShelfScore = roundFieldValue(shelfScoreSum / Math.max(1, validWaterCellCount));
        const shelfCellRatio = roundFieldValue(nearshoreShelfCellCount / Math.max(1, validWaterCellCount));

        return {
            seaRegionClusterId: normalizeString(cluster.seaRegionClusterId, ''),
            basinType: normalizeString(cluster.basinType, ''),
            cellCount: validWaterCellCount,
            meanShelfScore,
            maxShelfScore: roundFieldValue(maxShelfScore),
            shelfCellRatio,
            dominantDepthZone,
            zoneCounts,
            harborLandingPreparation: {
                futureHarborLandingInput: true,
                shelfApproachBias: meanShelfScore,
                shallowShelfCellRatio: shelfCellRatio,
                dominantDepthZone
            }
        };
    }

    function materializeCoastalDepthApproximation(input = {}, fallbackFloodFillOutput = null, fallbackSeaRegionClusterOutput = null, fallbackSeaNavigabilityOutput = null) {
        const normalizedInput = normalizeInput(input);
        const oceanBasinFloodFill = resolveOceanBasinFloodFill(input, fallbackFloodFillOutput);
        const seaRegionClustersOutput = resolveSeaRegionClusters(input, fallbackFloodFillOutput, fallbackSeaRegionClusterOutput);
        const seaNavigabilityTagging = resolveSeaNavigabilityTagging(
            input,
            fallbackFloodFillOutput,
            fallbackSeaRegionClusterOutput,
            fallbackSeaNavigabilityOutput
        );
        const worldBounds = normalizeWorldBounds(oceanBasinFloodFill.worldBounds || normalizedInput.worldBounds);
        const sourceFields = getSourceFieldInputs(input);
        const seaLevelField = normalizeSerializedField(
            sourceFields.seaLevelAppliedElevationField
                || sourceFields.landWaterMaskField
                || sourceFields.landmassCleanupMaskField,
            worldBounds
        );
        const basinDepressionField = getBasinDepressionField(input, {
            ...normalizedInput,
            worldBounds
        });
        const size = worldBounds.width * worldBounds.height;
        const stageNamespace = buildNamespace(PIPELINE_STEP_ID, 'coastalDepth');
        const stageSeed = deriveSubSeed(normalizedInput.macroSeed, stageNamespace);
        const waterCells = buildWaterCellMask(oceanBasinFloodFill, worldBounds);
        const coastalDistances = computeCoastalWaterDistances(waterCells, worldBounds, DEFAULT_SHELF_DISTANCE_CELLS);
        const seaThreshold = clampUnitInterval(seaLevelField.threshold, DEFAULT_WATER_THRESHOLD);
        const shelfValues = new Array(size).fill(0);
        let shelfWaterCellCount = 0;
        let coastalSlopeCellCount = 0;
        let offshoreTransitionCellCount = 0;
        let deepWaterCellCount = 0;

        for (let index = 0; index < size; index += 1) {
            if (!waterCells[index]) {
                continue;
            }

            const distance = coastalDistances[index];
            if (!Number.isFinite(distance)) {
                deepWaterCellCount += 1;
                continue;
            }

            const distanceShelfBias = clampUnitInterval(
                1 - ((distance - 1) / Math.max(1, DEFAULT_SHELF_DISTANCE_CELLS))
            );
            const seaLevelShallowBias = clampUnitInterval(
                clampUnitInterval(seaLevelField.values[index], 0) / Math.max(0.000001, seaThreshold)
            );
            const basinDepthPenalty = clampUnitInterval(basinDepressionField.values[index], 0);
            const noise = deterministicUnitNoise(stageSeed, index);
            const shelfScore = roundFieldValue(clampUnitInterval(
                (distanceShelfBias * 0.68)
                + (seaLevelShallowBias * 0.24)
                + (noise * 0.04)
                - (basinDepthPenalty * 0.16),
                0
            ));

            shelfValues[index] = shelfScore;
            const zone = classifyShelfDepthZone(shelfScore);
            if (zone === 'nearshore_shelf') {
                shelfWaterCellCount += 1;
            } else if (zone === 'coastal_slope') {
                coastalSlopeCellCount += 1;
            } else if (zone === 'offshore_transition') {
                offshoreTransitionCellCount += 1;
            } else {
                deepWaterCellCount += 1;
            }
        }

        const sourceClusters = Array.isArray(seaNavigabilityTagging.taggedSeaRegionClusters)
            ? seaNavigabilityTagging.taggedSeaRegionClusters
            : (Array.isArray(seaRegionClustersOutput.seaRegionClusters) ? seaRegionClustersOutput.seaRegionClusters : []);
        const shelfDepthZones = sourceClusters.map((cluster) => buildCoastalDepthZoneSummary(
            cluster,
            shelfValues,
            waterCells,
            worldBounds
        ));
        const coastalShelfDepthField = serializeScalarField(
            COASTAL_SHELF_DEPTH_FIELD_ID,
            worldBounds,
            shelfValues,
            {
                stageId: COASTAL_DEPTH_APPROXIMATION_STAGE_ID,
                sourceFieldIds: [
                    seaLevelField.fieldId,
                    basinDepressionField.fieldId
                ],
                sourceOutputIds: [
                    OCEAN_BASIN_FLOOD_FILL_STAGE_ID,
                    SEA_REGION_CLUSTERING_STAGE_ID,
                    SEA_NAVIGABILITY_TAGGING_STAGE_ID
                ],
                shelfDistanceCells: DEFAULT_SHELF_DISTANCE_CELLS,
                depthApproximationModel: 'deterministicCoastalShelfDistanceV1',
                valueMeaning: '0 = land/deep/unresolved, 1 = strongest shelf-like shallow coastal water',
                compatibility: {
                    futureHarborLandingInput: true,
                    futureCoastalOpportunityInput: true,
                    futureMarineCompositeInput: true,
                    sameWorldBoundsRequired: true
                }
            }
        );
        const coastalDepthApproximation = {
            coastalDepthApproximationId: COASTAL_DEPTH_APPROXIMATION_STAGE_ID,
            stageId: COASTAL_DEPTH_APPROXIMATION_STAGE_ID,
            fieldId: COASTAL_SHELF_DEPTH_FIELD_ID,
            sourceFieldIds: [
                seaLevelField.fieldId,
                basinDepressionField.fieldId
            ],
            sourceOutputIds: [
                OCEAN_BASIN_FLOOD_FILL_STAGE_ID,
                SEA_REGION_CLUSTERING_STAGE_ID,
                SEA_NAVIGABILITY_TAGGING_STAGE_ID
            ],
            worldBounds: cloneValue(worldBounds),
            shelfDistanceCells: DEFAULT_SHELF_DISTANCE_CELLS,
            approximationModel: 'deterministicCoastalShelfDistanceV1',
            shelfDepthZones,
            summary: {
                waterCellCount: waterCells.filter(Boolean).length,
                shelfWaterCellCount,
                coastalSlopeCellCount,
                offshoreTransitionCellCount,
                deepWaterCellCount,
                shelfZoneCount: shelfDepthZones.length,
                meanShelfScore: coastalShelfDepthField.stats.mean,
                strongestShelfScore: coastalShelfDepthField.stats.max
            },
            compatibility: {
                futureHarborLandingInput: true,
                futureCoastalOpportunityInput: true,
                futureMarineCompositeInput: true,
                sameWorldBoundsRequired: true
            },
            intentionallyAbsent: [
                'fishingScore',
                'harborQuality',
                'landingEase',
                'macroRoutes',
                'routeGraph',
                'gameplaySailingRules',
                'terrainCells',
                'gameplaySemantics'
            ]
        };

        return {
            coastalShelfDepthField,
            coastalDepthApproximation
        };
    }

    function resolveReliefRegionExtraction(input = {}) {
        const containers = buildDependencyContainers(input);
        const existing = findDependencyValue(containers.intermediateOutputs, 'reliefRegionExtraction');

        return existing && Array.isArray(existing.reliefRegionBodies)
            ? existing
            : null;
    }

    function buildReliefRegionMembership(reliefRegionExtraction = {}) {
        const reliefRegionBodies = Array.isArray(reliefRegionExtraction.reliefRegionBodies)
            ? reliefRegionExtraction.reliefRegionBodies
            : [];
        const membership = new Map();

        reliefRegionBodies.forEach((regionBody) => {
            const reliefRegionId = normalizeString(
                regionBody.reliefRegionId || (regionBody.record && regionBody.record.reliefRegionId),
                ''
            );
            const cellIndices = Array.isArray(regionBody.cellIndices) ? regionBody.cellIndices : [];
            if (!reliefRegionId) {
                return;
            }

            cellIndices.forEach((cellIndex) => {
                const normalizedIndex = normalizeInteger(cellIndex, -1);
                if (normalizedIndex >= 0) {
                    membership.set(normalizedIndex, reliefRegionId);
                }
            });
        });

        return membership;
    }

    function summarizeReliefRegionRefs(cellIndices = [], reliefRegionMembership = new Map()) {
        const counts = new Map();

        cellIndices.forEach((cellIndex) => {
            const reliefRegionId = reliefRegionMembership.get(cellIndex);
            if (!reliefRegionId) {
                return;
            }

            counts.set(reliefRegionId, (counts.get(reliefRegionId) || 0) + 1);
        });

        const rankedRefs = Array.from(counts.entries())
            .map(([reliefRegionId, cellCount]) => ({
                reliefRegionId,
                cellCount,
                cellRatio: roundFieldValue(cellCount / Math.max(1, cellIndices.length))
            }))
            .sort((left, right) => {
                if (right.cellCount !== left.cellCount) {
                    return right.cellCount - left.cellCount;
                }

                return left.reliefRegionId.localeCompare(right.reliefRegionId);
            });

        return {
            reliefRegionIds: rankedRefs.map((entry) => entry.reliefRegionId),
            primaryReliefRegionId: rankedRefs.length ? rankedRefs[0].reliefRegionId : '',
            reliefRegionOverlap: rankedRefs
        };
    }

    function buildWaterBasinLookup(oceanBasinFloodFill = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedBounds = normalizeWorldBounds(worldBounds);
        const size = normalizedBounds.width * normalizedBounds.height;
        const basinByCell = new Array(size).fill(null);
        const basinById = new Map();
        const waterBasins = Array.isArray(oceanBasinFloodFill.waterBasins)
            ? oceanBasinFloodFill.waterBasins
            : [];

        waterBasins.forEach((basin) => {
            const basinId = normalizeString(basin.basinId, '');
            if (!basinId) {
                return;
            }

            basinById.set(basinId, basin);
            (Array.isArray(basin.cellIndices) ? basin.cellIndices : []).forEach((cellIndex) => {
                const normalizedIndex = normalizeInteger(cellIndex, -1);
                if (normalizedIndex >= 0 && normalizedIndex < size) {
                    basinByCell[normalizedIndex] = basin;
                }
            });
        });

        return {
            basinByCell,
            basinById
        };
    }

    function buildSeaRegionClusterLookup(seaRegionClustersOutput = {}) {
        const clusters = Array.isArray(seaRegionClustersOutput.seaRegionClusters)
            ? seaRegionClustersOutput.seaRegionClusters
            : [];
        const clusterBySourceBasinId = new Map();

        clusters.forEach((cluster) => {
            const sourceBasinId = normalizeString(cluster.sourceBasinId, '');
            if (sourceBasinId) {
                clusterBySourceBasinId.set(sourceBasinId, cluster);
            }
        });

        return clusterBySourceBasinId;
    }

    function buildWatershedAssignments(landCells = [], waterBasinLookup = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedBounds = normalizeWorldBounds(worldBounds);
        const size = normalizedBounds.width * normalizedBounds.height;
        const assignments = new Array(size).fill(null);
        const distances = new Array(size).fill(Number.POSITIVE_INFINITY);
        const queue = [];

        for (let index = 0; index < size; index += 1) {
            if (!landCells[index]) {
                continue;
            }

            const terminalBasins = getNeighborIndices(index, normalizedBounds.width, normalizedBounds.height)
                .map((neighborIndex) => waterBasinLookup.basinByCell[neighborIndex])
                .filter(Boolean)
                .sort((left, right) => normalizeString(left.basinId, '').localeCompare(normalizeString(right.basinId, '')));

            if (!terminalBasins.length) {
                continue;
            }

            const terminalBasin = terminalBasins[0];
            assignments[index] = normalizeString(terminalBasin.basinId, 'unresolved_terminal');
            distances[index] = 0;
            queue.push(index);
        }

        for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
            const currentIndex = queue[queueIndex];
            const nextDistance = distances[currentIndex] + 1;
            getNeighborIndices(currentIndex, normalizedBounds.width, normalizedBounds.height).forEach((neighborIndex) => {
                if (!landCells[neighborIndex] || distances[neighborIndex] <= nextDistance) {
                    return;
                }

                assignments[neighborIndex] = assignments[currentIndex];
                distances[neighborIndex] = nextDistance;
                queue.push(neighborIndex);
            });
        }

        let internalSequence = 0;
        for (let index = 0; index < size; index += 1) {
            if (!landCells[index] || assignments[index]) {
                continue;
            }

            internalSequence += 1;
            const internalAssignment = `internal_watershed_${String(internalSequence).padStart(3, '0')}`;
            const internalQueue = [index];
            assignments[index] = internalAssignment;

            for (let queueIndex = 0; queueIndex < internalQueue.length; queueIndex += 1) {
                const currentIndex = internalQueue[queueIndex];
                getNeighborIndices(currentIndex, normalizedBounds.width, normalizedBounds.height).forEach((neighborIndex) => {
                    if (!landCells[neighborIndex] || assignments[neighborIndex]) {
                        return;
                    }

                    assignments[neighborIndex] = internalAssignment;
                    internalQueue.push(neighborIndex);
                });
            }
        }

        return assignments;
    }

    function buildWatershedGroups(assignments = []) {
        const groups = new Map();

        assignments.forEach((assignmentId, cellIndex) => {
            if (!assignmentId) {
                return;
            }

            if (!groups.has(assignmentId)) {
                groups.set(assignmentId, []);
            }

            groups.get(assignmentId).push(cellIndex);
        });

        return Array.from(groups.entries())
            .map(([assignmentId, cellIndices]) => ({
                assignmentId,
                cellIndices
            }))
            .sort((left, right) => {
                if (right.cellIndices.length !== left.cellIndices.length) {
                    return right.cellIndices.length - left.cellIndices.length;
                }

                return left.assignmentId.localeCompare(right.assignmentId);
            });
    }

    function summarizeWatershedCells(cellIndices = [], worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedBounds = normalizeWorldBounds(worldBounds);
        const boundingBox = createBoundingBox();
        let centroidXTotal = 0;
        let centroidYTotal = 0;

        cellIndices.forEach((cellIndex) => {
            const point = pointFromIndex(cellIndex, normalizedBounds.width);
            updateBoundingBox(boundingBox, point.x, point.y);
            centroidXTotal += point.x;
            centroidYTotal += point.y;
        });

        const cellCount = cellIndices.length;
        const normalizedBoundingBox = normalizeBoundingBox(boundingBox);
        const boundingBoxArea = Math.max(
            1,
            ((normalizedBoundingBox.maxX - normalizedBoundingBox.minX) + 1)
            * ((normalizedBoundingBox.maxY - normalizedBoundingBox.minY) + 1)
        );
        const centroidPoint = {
            x: roundFieldValue(centroidXTotal / Math.max(1, cellCount)),
            y: roundFieldValue(centroidYTotal / Math.max(1, cellCount))
        };

        return {
            cellCount,
            normalizedArea: roundFieldValue(cellCount / Math.max(1, normalizedBounds.width * normalizedBounds.height)),
            boundingBox: normalizedBoundingBox,
            compactness: roundFieldValue(cellCount / boundingBoxArea),
            centroidPoint,
            normalizedCentroid: {
                x: roundFieldValue(normalizedBounds.width > 1 ? centroidPoint.x / (normalizedBounds.width - 1) : 0),
                y: roundFieldValue(normalizedBounds.height > 1 ? centroidPoint.y / (normalizedBounds.height - 1) : 0)
            }
        };
    }

    function summarizeWatershedSignals(cellIndices = [], fields = {}, stageSeed = 0) {
        let elevationSum = 0;
        let basinDepressionSum = 0;
        let mountainAmplificationSum = 0;
        let plateauCandidateSum = 0;
        let headwaterCellIndex = cellIndices.length ? cellIndices[0] : 0;
        let headwaterScore = Number.NEGATIVE_INFINITY;

        cellIndices.forEach((cellIndex) => {
            const elevation = clampUnitInterval(fields.seaLevelField.values[cellIndex], 0);
            const basinDepression = clampUnitInterval(fields.basinDepressionField.values[cellIndex], 0);
            const mountainAmplification = clampUnitInterval(fields.mountainAmplificationField.values[cellIndex], 0);
            const plateauCandidate = clampUnitInterval(fields.plateauCandidateField.values[cellIndex], 0);
            const score = (elevation * 0.45)
                + (mountainAmplification * 0.32)
                + (plateauCandidate * 0.18)
                - (basinDepression * 0.08)
                + (deterministicUnitNoise(stageSeed, cellIndex) * 0.02);

            elevationSum += elevation;
            basinDepressionSum += basinDepression;
            mountainAmplificationSum += mountainAmplification;
            plateauCandidateSum += plateauCandidate;

            if (score > headwaterScore || (score === headwaterScore && cellIndex < headwaterCellIndex)) {
                headwaterScore = score;
                headwaterCellIndex = cellIndex;
            }
        });

        const cellCount = Math.max(1, cellIndices.length);
        return {
            meanSeaLevelElevation: roundFieldValue(elevationSum / cellCount),
            meanBasinDepression: roundFieldValue(basinDepressionSum / cellCount),
            meanMountainAmplification: roundFieldValue(mountainAmplificationSum / cellCount),
            meanPlateauCandidate: roundFieldValue(plateauCandidateSum / cellCount),
            headwaterCellIndex,
            headwaterScore: roundFieldValue(Math.max(0, headwaterScore))
        };
    }

    function buildTerminalWaterHint(assignmentId, waterBasinLookup = {}, seaRegionClusterLookup = new Map()) {
        const basin = waterBasinLookup.basinById.get(assignmentId);
        if (!basin) {
            return {
                terminalMode: 'internal_unresolved',
                sourceBasinId: '',
                sourceBasinKind: '',
                seaRegionClusterId: '',
                provisionalSeaRegionId: '',
                terminalSeaRegionIds: []
            };
        }

        const sourceBasinId = normalizeString(basin.basinId, '');
        const cluster = seaRegionClusterLookup.get(sourceBasinId) || null;
        const provisionalSeaRegionId = normalizeString(
            cluster && cluster.recordDraft && cluster.recordDraft.seaRegionId,
            ''
        );

        return {
            terminalMode: normalizeString(basin.basinKind, '') === 'enclosed_water'
                ? 'enclosed_water_terminal'
                : 'sea_terminal',
            sourceBasinId,
            sourceBasinKind: normalizeString(basin.basinKind, ''),
            seaRegionClusterId: normalizeString(cluster && cluster.seaRegionClusterId, ''),
            provisionalSeaRegionId,
            terminalSeaRegionIds: provisionalSeaRegionId ? [provisionalSeaRegionId] : []
        };
    }

    function classifyWatershedBasinType(terminalWaterHint = {}, drainageSignals = {}) {
        if (terminalWaterHint.terminalMode === 'internal_unresolved') {
            return 'internal_unresolved';
        }

        if (terminalWaterHint.sourceBasinKind === 'enclosed_water') {
            return 'endorheic';
        }

        if (drainageSignals.meanBasinDepression >= 0.62) {
            return 'inland_sea_feeder';
        }

        return 'exorheic';
    }

    function materializeWatershedSegmentation(
        input = {},
        fallbackFloodFillOutput = null,
        fallbackSeaRegionClusterOutput = null,
        fallbackSeaNavigabilityOutput = null,
        fallbackCoastalDepthOutput = null
    ) {
        const normalizedInput = normalizeInput(input);
        const oceanBasinFloodFill = resolveOceanBasinFloodFill(input, fallbackFloodFillOutput);
        const seaRegionClustersOutput = resolveSeaRegionClusters(input, fallbackFloodFillOutput, fallbackSeaRegionClusterOutput);
        const seaNavigabilityTagging = resolveSeaNavigabilityTagging(
            input,
            fallbackFloodFillOutput,
            fallbackSeaRegionClusterOutput,
            fallbackSeaNavigabilityOutput
        );
        const coastalDepthApproximation = fallbackCoastalDepthOutput && fallbackCoastalDepthOutput.coastalDepthApproximation
            ? fallbackCoastalDepthOutput.coastalDepthApproximation
            : materializeCoastalDepthApproximation(
                input,
                fallbackFloodFillOutput,
                fallbackSeaRegionClusterOutput,
                { seaNavigabilityTagging }
            ).coastalDepthApproximation;
        const worldBounds = normalizeWorldBounds(oceanBasinFloodFill.worldBounds || normalizedInput.worldBounds);
        const sourceFields = getSourceFieldInputs(input);
        const sourceField = normalizeSerializedField(
            sourceFields.landmassCleanupMaskField
                || sourceFields.landWaterMaskField
                || sourceFields.seaLevelAppliedElevationField,
            worldBounds
        );
        const seaLevelField = normalizeSerializedField(
            sourceFields.seaLevelAppliedElevationField
                || sourceFields.landWaterMaskField
                || sourceFields.landmassCleanupMaskField,
            worldBounds
        );
        const basinDepressionField = getBasinDepressionField(input, {
            ...normalizedInput,
            worldBounds
        });
        const mountainAmplificationField = getMountainAmplificationField(input, {
            ...normalizedInput,
            worldBounds
        });
        const plateauCandidateField = getPlateauCandidateField(input, {
            ...normalizedInput,
            worldBounds
        });
        const size = worldBounds.width * worldBounds.height;
        const threshold = clampUnitInterval(sourceField.threshold, DEFAULT_WATER_THRESHOLD);
        const landCells = sourceField.values.map((value) => value >= threshold);
        const landCellCount = landCells.filter(Boolean).length;
        const minimumWatershedCellCount = Math.max(4, Math.round(size * DEFAULT_WATERSHED_MIN_AREA_RATIO));
        const waterBasinLookup = buildWaterBasinLookup(oceanBasinFloodFill, worldBounds);
        const seaRegionClusterLookup = buildSeaRegionClusterLookup(seaRegionClustersOutput);
        const reliefRegionMembership = buildReliefRegionMembership(resolveReliefRegionExtraction(input) || {});
        const stageNamespace = buildNamespace(PIPELINE_STEP_ID, 'riverBasins');
        const stageSeed = deriveSubSeed(normalizedInput.macroSeed, stageNamespace);
        const assignments = buildWatershedAssignments(landCells, waterBasinLookup, worldBounds);
        const watershedGroups = buildWatershedGroups(assignments);
        const fields = {
            seaLevelField,
            basinDepressionField,
            mountainAmplificationField,
            plateauCandidateField
        };
        let skippedSmallWatershedCellCount = 0;
        let smallWatershedCount = 0;
        const watersheds = watershedGroups
            .filter((group) => {
                if (group.cellIndices.length >= minimumWatershedCellCount || watershedGroups.length <= 1) {
                    return true;
                }

                skippedSmallWatershedCellCount += group.cellIndices.length;
                smallWatershedCount += 1;
                return false;
            })
            .map((group, groupIndex) => {
                const watershedSequence = groupIndex + 1;
                const watershedId = createWatershedId(watershedSequence);
                const riverBasinId = createRiverBasinId(watershedSequence);
                const cellSummary = summarizeWatershedCells(group.cellIndices, worldBounds);
                const drainageSignals = summarizeWatershedSignals(group.cellIndices, fields, stageSeed);
                const terminalWaterHint = buildTerminalWaterHint(
                    group.assignmentId,
                    waterBasinLookup,
                    seaRegionClusterLookup
                );
                const reliefRefs = summarizeReliefRegionRefs(group.cellIndices, reliefRegionMembership);
                const headwaterPoint = pointFromIndex(drainageSignals.headwaterCellIndex, worldBounds.width);
                const basinType = classifyWatershedBasinType(terminalWaterHint, drainageSignals);
                const namespace = buildNamespace(PIPELINE_STEP_ID, 'riverBasins', watershedId);
                const terminalSeaRegionIds = terminalWaterHint.terminalSeaRegionIds.slice();
                const pendingRecordFields = [
                    'sourceMountainSystemIds',
                    'climateBandIds',
                    'primaryClimateBandId'
                ];

                if (!reliefRefs.reliefRegionIds.length) {
                    pendingRecordFields.push('reliefRegionIds', 'primaryReliefRegionId');
                }
                if (!terminalSeaRegionIds.length) {
                    pendingRecordFields.push('terminalSeaRegionIds');
                }

                const recordDraft = createRiverBasinRecordDraft({
                    riverBasinId,
                    basinType,
                    sourceMountainSystemIds: [],
                    reliefRegionIds: reliefRefs.reliefRegionIds,
                    climateBandIds: [],
                    terminalSeaRegionIds,
                    primaryReliefRegionId: reliefRefs.primaryReliefRegionId,
                    primaryClimateBandId: '',
                    catchmentScale: clampUnitInterval(cellSummary.cellCount / Math.max(1, landCellCount), 0),
                    basinContinuity: clampUnitInterval(cellSummary.compactness, 0)
                });

                return {
                    watershedId,
                    sourceAssignmentId: group.assignmentId,
                    recordDraft,
                    pendingRecordFields: Array.from(new Set(pendingRecordFields)),
                    cellCount: cellSummary.cellCount,
                    cellIndices: group.cellIndices.slice(),
                    normalizedArea: cellSummary.normalizedArea,
                    boundingBox: cellSummary.boundingBox,
                    centroidPoint: cellSummary.centroidPoint,
                    normalizedCentroid: cellSummary.normalizedCentroid,
                    compactness: cellSummary.compactness,
                    reliefRegionIds: reliefRefs.reliefRegionIds,
                    primaryReliefRegionId: reliefRefs.primaryReliefRegionId,
                    reliefRegionOverlap: reliefRefs.reliefRegionOverlap,
                    headwaterHint: {
                        cellIndex: drainageSignals.headwaterCellIndex,
                        point: headwaterPoint,
                        normalizedPoint: {
                            x: roundFieldValue(worldBounds.width > 1 ? headwaterPoint.x / (worldBounds.width - 1) : 0),
                            y: roundFieldValue(worldBounds.height > 1 ? headwaterPoint.y / (worldBounds.height - 1) : 0)
                        },
                        score: drainageSignals.headwaterScore
                    },
                    terminalWaterHint,
                    drainageSignals: {
                        meanSeaLevelElevation: drainageSignals.meanSeaLevelElevation,
                        meanBasinDepression: drainageSignals.meanBasinDepression,
                        meanMountainAmplification: drainageSignals.meanMountainAmplification,
                        meanPlateauCandidate: drainageSignals.meanPlateauCandidate
                    },
                    namespace,
                    seed: deriveSubSeed(stageSeed, namespace)
                };
            });
        const exorheicCount = watersheds.filter((watershed) => watershed.recordDraft.basinType === 'exorheic').length;
        const endorheicCount = watersheds.filter((watershed) => watershed.recordDraft.basinType === 'endorheic').length;
        const inlandSeaFeederCount = watersheds.filter((watershed) => watershed.recordDraft.basinType === 'inland_sea_feeder').length;
        const unresolvedInternalCount = watersheds.filter((watershed) => watershed.recordDraft.basinType === 'internal_unresolved').length;

        return {
            watershedSegmentation: {
                watershedSegmentationId: WATERSHED_SEGMENTATION_STAGE_ID,
                stageId: WATERSHED_SEGMENTATION_STAGE_ID,
                sourceFieldIds: [
                    sourceField.fieldId,
                    seaLevelField.fieldId,
                    basinDepressionField.fieldId,
                    mountainAmplificationField.fieldId,
                    plateauCandidateField.fieldId
                ],
                sourceOutputIds: [
                    OCEAN_BASIN_FLOOD_FILL_STAGE_ID,
                    SEA_REGION_CLUSTERING_STAGE_ID,
                    SEA_NAVIGABILITY_TAGGING_STAGE_ID,
                    COASTAL_DEPTH_APPROXIMATION_STAGE_ID
                ],
                worldBounds: cloneValue(worldBounds),
                segmentationModel: 'deterministicNearestTerminalWaterWatershedsV1',
                minimumWatershedCellCount,
                watershedCount: watersheds.length,
                watersheds,
                summary: {
                    landCellCount,
                    assignedLandCellCount: watersheds.reduce((total, watershed) => total + watershed.cellCount, 0),
                    skippedSmallWatershedCount: smallWatershedCount,
                    skippedSmallWatershedCellCount,
                    exorheicCount,
                    endorheicCount,
                    inlandSeaFeederCount,
                    unresolvedInternalCount,
                    sourceSeaRegionClusterCount: Array.isArray(seaRegionClustersOutput.seaRegionClusters)
                        ? seaRegionClustersOutput.seaRegionClusters.length
                        : 0,
                    sourceTaggedSeaRegionClusterCount: Array.isArray(seaNavigabilityTagging.taggedSeaRegionClusters)
                        ? seaNavigabilityTagging.taggedSeaRegionClusters.length
                        : 0,
                    coastalDepthZoneCount: Array.isArray(coastalDepthApproximation.shelfDepthZones)
                        ? coastalDepthApproximation.shelfDepthZones.length
                        : 0
                },
                compatibility: {
                    futureRiverBasinRecordInput: true,
                    emitsRecordDraftsOnly: true,
                    requiresClimateBandLinkage: true,
                    requiresMountainSystemLinkage: true,
                    futureMajorRiverExtractionInput: true,
                    sameWorldBoundsRequired: true
                },
                intentionallyAbsent: [
                    'riverBasins',
                    'majorRivers',
                    'riverRouting',
                    'riverDeltas',
                    'lakeFormation',
                    'marshFormation',
                    'climateLogic',
                    'terrainCells',
                    'gameplaySemantics'
                ]
            }
        };
    }

    function getHydrosphereGeneratorDescriptor() {
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
            description: 'Partial Phase 1 HydrosphereGenerator. It implements ocean basin flood-fill, geometry-based sea-region clustering drafts, sea navigability tagging, coastal shelf-depth approximation, and watershed segmentation drafts while final sea records, major rivers, climate, and gameplay data remain absent.'
        };
    }

    function getHydrosphereInputContract() {
        return {
            contractId: 'hydrosphereInput',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            requiredKeys: INPUT_REQUIRED_KEYS.slice(),
            optionalKeys: INPUT_OPTIONAL_KEYS.slice(),
            fieldDependencies: cloneValue(FIELD_DEPENDENCIES),
            intermediateDependencies: cloneValue(INTERMEDIATE_DEPENDENCIES),
            recordDependencies: cloneValue(RECORD_DEPENDENCIES),
            description: 'Contract scaffold for HydrosphereGenerator input. It consumes elevation/relief outputs for ocean basin flood-fill, inland/semi-enclosed sea-region classification, coastal-depth approximation, and watershed segmentation without running final river extraction, deltas, or climate logic.'
        };
    }

    function getHydrosphereOutputContract() {
        return {
            contractId: 'hydrosphereOutput',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            status: PARTIAL_STATUS,
            plannedOutputs: cloneValue(PLANNED_OUTPUTS),
            implementedOutputs: {
                fields: [
                    'oceanConnectivityMaskField',
                    COASTAL_SHELF_DEPTH_FIELD_ID
                ],
                intermediateOutputs: [
                    'oceanBasinFloodFill',
                    'seaRegionClusters',
                    'seaNavigabilityTagging',
                    COASTAL_DEPTH_APPROXIMATION_STAGE_ID,
                    WATERSHED_SEGMENTATION_STAGE_ID
                ],
                records: [],
                debugArtifacts: []
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT_OUTPUTS.slice(),
            description: 'Partial pipeline contract for HydrosphereGenerator. oceanBasinFloodFill, oceanConnectivityMaskField, seaRegionClusters with inland-sea classification, seaNavigabilityTagging, coastalDepthApproximation, and watershedSegmentation are implemented; final sea-region records, final river basins, major rivers, route graphs, climate logic, terrain cells, and gameplay semantics remain absent.'
        };
    }

    function getOceanBasinFloodFillContract() {
        return {
            contractId: OCEAN_BASIN_FLOOD_FILL_STAGE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'oceanFill'),
            sourceKeys: [
                'landmassCleanupMaskField',
                'landWaterMaskField',
                'seaLevelAppliedElevationField'
            ],
            requiredKeys: [
                'floodFillId',
                'stageId',
                'sourceFieldIds',
                'worldBounds',
                'waterThreshold',
                'connectivityFieldId',
                'connectivityEncoding',
                'basinCount',
                'openOceanBasinCount',
                'enclosedWaterBasinCount',
                'waterCellCount',
                'landCellCount',
                'waterBasins',
                'summary',
                'compatibility'
            ],
            waterBasinKeys: [
                'basinId',
                'basinKind',
                'touchesWorldEdge',
                'cellCount',
                'normalizedArea',
                'boundingBox',
                'centroidPoint',
                'normalizedCentroid',
                'cellIndices'
            ],
            basinKinds: [
                'open_ocean',
                'enclosed_water'
            ],
            intentionallyAbsent: [
                'seaRegions',
                'seaRegionClustering',
                'navigability',
                'macroRoutes',
                'riverRouting',
                'climateLogic',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic cardinal flood-fill over water cells from the cleaned land/water mask. It separates open-ocean water connected to world edges from enclosed water without creating SeaRegionRecord outputs.'
        };
    }

    function getSeaRegionClustersContract() {
        return {
            contractId: 'seaRegionClusters',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'seaRegions'),
            requiredKeys: [
                'seaRegionClusterSetId',
                'stageId',
                'sourceOutputIds',
                'worldBounds',
                'clusterCount',
                'clusteringModel',
                'seaRegionClusters',
                'summary',
                'compatibility'
            ],
            sourceKeys: [
                'oceanBasinFloodFill',
                'oceanConnectivityMaskField'
            ],
            seaRegionClusterKeys: [
                'seaRegionClusterId',
                'sourceBasinId',
                'sourceBasinKind',
                'recordDraft',
                'pendingRecordFields',
                'basinKind',
                'basinType',
                'cellCount',
                'cellIndices',
                'normalizedArea',
                'boundingBox',
                'centroidPoint',
                'normalizedCentroid',
                'touchesWorldEdge',
                'geometryClass',
                'geometryMetrics',
                'seaRegionFlags',
                'classificationSignals',
                'namespace',
                'seed'
            ],
            compatibilityKeys: [
                'futureSeaRegionRecordInput',
                'requiresClimateBandLinkage',
                'requiresNavigabilityScoring',
                'futureInlandSeaFormationInput',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'seaRegions',
                'bays',
                'straits',
                'routeGraph',
                'macroRoutes',
                'riverRouting',
                'climateLogic',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic geometry-based clustering layer that converts connected water basins into SeaRegionRecord-compatible drafts and classifies inland / semi-enclosed seas without yet emitting final seaRegions[], bay/strait detail, or route semantics.'
        };
    }

    function getSeaNavigabilityTaggingContract() {
        return {
            contractId: 'seaNavigabilityTagging',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'seaNavigability'),
            requiredKeys: [
                'seaNavigabilityTaggingId',
                'stageId',
                'sourceOutputIds',
                'worldBounds',
                'taggedClusterCount',
                'taggingModel',
                'taggedSeaRegionClusters',
                'summary',
                'compatibility'
            ],
            sourceKeys: [
                'seaRegionClusters',
                'oceanBasinFloodFill',
                'oceanConnectivityMaskField'
            ],
            taggedSeaRegionClusterKeys: [
                'seaRegionClusterId',
                'sourceBasinId',
                'sourceBasinKind',
                'recordDraft',
                'pendingRecordFields',
                'basinKind',
                'basinType',
                'cellCount',
                'cellIndices',
                'normalizedArea',
                'boundingBox',
                'centroidPoint',
                'normalizedCentroid',
                'touchesWorldEdge',
                'geometryClass',
                'geometryMetrics',
                'seaRegionFlags',
                'classificationSignals',
                'navigability',
                'navigabilityClass',
                'hazardRoughness',
                'hazardRoughnessClass',
                'navigabilityTags',
                'routeGraphPreparation',
                'navigabilitySignals',
                'namespace',
                'seed'
            ],
            compatibilityKeys: [
                'futureSeaRegionRecordInput',
                'futureRouteGraphInput',
                'requiresClimateBandLinkage',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'seaRegions',
                'macroRoutes',
                'routeGraph',
                'gameplaySailingRules',
                'climateLogic',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic sea-region tagging layer that enriches seaRegionClusters with preliminary navigability and hazard roughness labels for future route-graph consumers without emitting macro routes or gameplay sailing rules.'
        };
    }

    function getOceanConnectivityMaskFieldContract() {
        return {
            contractId: OCEAN_CONNECTIVITY_MASK_FIELD_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'oceanFill'),
            fieldType: 'ScalarField',
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: OCEAN_CONNECTIVITY_VALUE_ENCODING,
            classificationEncoding: cloneValue(OCEAN_CONNECTIVITY_ENCODING),
            sourceKeys: [
                'landmassCleanupMaskField',
                'landWaterMaskField',
                'seaLevelAppliedElevationField'
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
                'classificationEncoding',
                'compatibility'
            ],
            intentionallyAbsent: [
                'seaRegions',
                'seaRegionClustering',
                'navigability',
                'riverRouting',
                'climateLogic',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Renderer-agnostic scalar classification field produced by ocean basin flood-fill: land = 0, enclosed water = 0.5, open ocean = 1.'
        };
    }

    function getCoastalShelfDepthFieldContract() {
        return {
            contractId: COASTAL_SHELF_DEPTH_FIELD_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'coastalDepth'),
            fieldType: 'ScalarField',
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: OCEAN_CONNECTIVITY_VALUE_ENCODING,
            sourceKeys: [
                'oceanBasinFloodFill',
                'seaRegionClusters',
                'seaNavigabilityTagging',
                'seaLevelAppliedElevationField',
                'basinDepressionField'
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
                'shelfDistanceCells',
                'depthApproximationModel',
                'compatibility'
            ],
            intentionallyAbsent: [
                'fishingScore',
                'harborQuality',
                'landingEase',
                'macroRoutes',
                'routeGraph',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Renderer-agnostic scalar approximation of shelf-like shallow coastal water. Values are future harbor/landing inputs only, not fishing scores, route graph costs, or gameplay rules.'
        };
    }

    function getCoastalDepthApproximationContract() {
        return {
            contractId: COASTAL_DEPTH_APPROXIMATION_STAGE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'coastalDepth'),
            requiredKeys: [
                'coastalDepthApproximationId',
                'stageId',
                'fieldId',
                'sourceFieldIds',
                'sourceOutputIds',
                'worldBounds',
                'shelfDistanceCells',
                'approximationModel',
                'shelfDepthZones',
                'summary',
                'compatibility'
            ],
            sourceKeys: [
                'coastalShelfDepthField',
                'seaNavigabilityTagging',
                'seaRegionClusters',
                'oceanBasinFloodFill'
            ],
            shelfDepthZoneKeys: [
                'seaRegionClusterId',
                'basinType',
                'cellCount',
                'meanShelfScore',
                'maxShelfScore',
                'shelfCellRatio',
                'dominantDepthZone',
                'zoneCounts',
                'harborLandingPreparation'
            ],
            compatibilityKeys: [
                'futureHarborLandingInput',
                'futureCoastalOpportunityInput',
                'futureMarineCompositeInput',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'fishingScore',
                'harborQuality',
                'landingEase',
                'macroRoutes',
                'routeGraph',
                'gameplaySailingRules',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic shelf/coastal-depth approximation summary for later harbor/landing logic. It does not score fishing, construct route graphs, or add gameplay sailing semantics.'
        };
    }

    function getWatershedSegmentationContract() {
        return {
            contractId: WATERSHED_SEGMENTATION_STAGE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'riverBasins'),
            requiredKeys: [
                'watershedSegmentationId',
                'stageId',
                'sourceFieldIds',
                'sourceOutputIds',
                'worldBounds',
                'segmentationModel',
                'minimumWatershedCellCount',
                'watershedCount',
                'watersheds',
                'summary',
                'compatibility'
            ],
            sourceKeys: [
                'landmassCleanupMaskField',
                'seaLevelAppliedElevationField',
                'basinDepressionField',
                'mountainAmplificationField',
                'plateauCandidateField',
                'oceanBasinFloodFill',
                'seaRegionClusters',
                'seaNavigabilityTagging',
                'coastalDepthApproximation',
                'reliefRegionExtraction'
            ],
            watershedKeys: [
                'watershedId',
                'sourceAssignmentId',
                'recordDraft',
                'pendingRecordFields',
                'cellCount',
                'cellIndices',
                'normalizedArea',
                'boundingBox',
                'centroidPoint',
                'normalizedCentroid',
                'compactness',
                'reliefRegionIds',
                'primaryReliefRegionId',
                'reliefRegionOverlap',
                'headwaterHint',
                'terminalWaterHint',
                'drainageSignals',
                'namespace',
                'seed'
            ],
            recordDraftContract: 'RiverBasinRecord',
            compatibilityKeys: [
                'futureRiverBasinRecordInput',
                'emitsRecordDraftsOnly',
                'requiresClimateBandLinkage',
                'requiresMountainSystemLinkage',
                'futureMajorRiverExtractionInput',
                'sameWorldBoundsRequired'
            ],
            intentionallyAbsent: [
                'riverBasins',
                'majorRivers',
                'riverRouting',
                'riverDeltas',
                'lakeFormation',
                'marshFormation',
                'climateLogic',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic watershed segmentation over cleaned land cells. It groups land by nearest terminal water basin and emits RiverBasinRecord-compatible drafts for later hydrology, without final river basins, major rivers, routing, or delta logic.'
        };
    }

    function getHydrosphereSeedHooks(masterSeed = 0) {
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

    function generateOceanBasinFloodFill(input = {}) {
        return materializeOceanBasinFloodFill(input).oceanBasinFloodFill;
    }

    function generateOceanConnectivityMaskField(input = {}) {
        return materializeOceanBasinFloodFill(input).oceanConnectivityMaskField;
    }

    function generateSeaRegionClusters(input = {}) {
        return materializeSeaRegionClusters(input).seaRegionClusters;
    }

    function generateSeaNavigabilityTagging(input = {}) {
        return materializeSeaNavigabilityTagging(input).seaNavigabilityTagging;
    }

    function generateCoastalShelfDepthField(input = {}) {
        return materializeCoastalDepthApproximation(input).coastalShelfDepthField;
    }

    function generateCoastalDepthApproximation(input = {}) {
        return materializeCoastalDepthApproximation(input).coastalDepthApproximation;
    }

    function generateWatershedSegmentation(input = {}) {
        return materializeWatershedSegmentation(input).watershedSegmentation;
    }

    function createHydrospherePipeline(input = {}) {
        const normalizedInput = normalizeInput(input);
        const oceanBasinFloodFillOutput = materializeOceanBasinFloodFill(input);
        const seaRegionClusterOutput = materializeSeaRegionClusters(input, oceanBasinFloodFillOutput);
        const seaNavigabilityTaggingOutput = materializeSeaNavigabilityTagging(
            input,
            oceanBasinFloodFillOutput,
            seaRegionClusterOutput
        );
        const coastalDepthApproximationOutput = materializeCoastalDepthApproximation(
            input,
            oceanBasinFloodFillOutput,
            seaRegionClusterOutput,
            seaNavigabilityTaggingOutput
        );
        const watershedSegmentationOutput = materializeWatershedSegmentation(
            input,
            oceanBasinFloodFillOutput,
            seaRegionClusterOutput,
            seaNavigabilityTaggingOutput,
            coastalDepthApproximationOutput
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
            inputContract: getHydrosphereInputContract(),
            outputContract: getHydrosphereOutputContract(),
            seedHooks: getHydrosphereSeedHooks(normalizedInput.macroSeed),
            dependencyAvailability: describeHydrosphereDependencyAvailability(input),
            plannedStages: cloneValue(PLANNED_STAGES),
            outputs: {
                ...createEmptyHydrosphereOutputs(),
                fields: {
                    oceanConnectivityMaskField: oceanBasinFloodFillOutput.oceanConnectivityMaskField,
                    coastalShelfDepthField: coastalDepthApproximationOutput.coastalShelfDepthField
                },
                intermediateOutputs: {
                    oceanBasinFloodFill: oceanBasinFloodFillOutput.oceanBasinFloodFill,
                    seaRegionClusters: seaRegionClusterOutput.seaRegionClusters,
                    seaNavigabilityTagging: seaNavigabilityTaggingOutput.seaNavigabilityTagging,
                    coastalDepthApproximation: coastalDepthApproximationOutput.coastalDepthApproximation,
                    watershedSegmentation: watershedSegmentationOutput.watershedSegmentation
                }
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT_OUTPUTS.slice(),
            notes: [
                'Partial hydrosphere pipeline: ocean basin flood-fill, geometry-based sea-region clustering drafts with inland-sea classification, deterministic sea navigability tagging, shelf-like coastal depth approximation, and watershed segmentation drafts.',
                'No final seaRegions[], bay/strait detail, fishing score, macro routes, route graph, final riverBasins[], major rivers, river deltas, climate logic, terrain cells, UI, or gameplay semantics are generated.'
            ]
        };
    }

    function generateHydrosphere(input = {}) {
        return createHydrospherePipeline(input);
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule(MODULE_ID, {
            entry: 'generateHydrosphere',
            file: 'js/worldgen/macro/hydrosphere-generator.js',
            description: 'Partial Phase 1 hydrosphere layer with ocean basin flood-fill, sea-region clustering, preliminary sea navigability tagging, coastal shelf-depth approximation, and watershed segmentation drafts.',
            stub: false,
            partial: true
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep(PIPELINE_STEP_ID, {
            moduleId: MODULE_ID,
            file: 'js/worldgen/macro/hydrosphere-generator.js',
            description: 'Partial pipeline entry for ocean basin flood-fill, sea-region clustering, preliminary navigability tagging, shelf-depth approximation, and watershed segmentation drafts.',
            stub: false,
            partial: true
        });
    }

    Object.assign(macro, {
        getHydrosphereGeneratorDescriptor,
        getHydrosphereInputContract,
        getHydrosphereOutputContract,
        getOceanBasinFloodFillContract,
        getOceanConnectivityMaskFieldContract,
        getSeaRegionClustersContract,
        getSeaNavigabilityTaggingContract,
        getCoastalShelfDepthFieldContract,
        getCoastalDepthApproximationContract,
        getWatershedSegmentationContract,
        getHydrosphereSeedHooks,
        describeHydrosphereDependencyAvailability,
        generateOceanBasinFloodFill,
        generateOceanConnectivityMaskField,
        generateSeaRegionClusters,
        generateSeaNavigabilityTagging,
        generateCoastalShelfDepthField,
        generateCoastalDepthApproximation,
        generateWatershedSegmentation,
        createHydrospherePipeline,
        generateHydrosphere
    });
})();
