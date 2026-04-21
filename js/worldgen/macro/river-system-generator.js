(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const MODULE_ID = 'riverSystemGenerator';
    const PIPELINE_STEP_ID = 'riverSystem';
    const PARTIAL_STATUS = 'PARTIAL_IMPLEMENTED';
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';
    const DEFAULT_WORLD_BOUNDS = Object.freeze({
        width: 256,
        height: 128
    });
    const DEFAULT_FIELD_VALUE_ENCODING = 'rowMajorFloatArray';
    const DEFAULT_LAND_THRESHOLD = 0.5;
    const DOWNHILL_FLOW_ROUTING_STAGE_ID = 'downhillFlowRouting';
    const FLOW_ACCUMULATION_FIELD_ID = 'flowAccumulationField';
    const FLOW_ACCUMULATION_STAGE_ID = 'flowAccumulationMap';
    const DELTA_LAKE_MARSH_TAGGING_ID = 'deltaLakeMarshTagging';
    const DELTA_LAKE_MARSH_TAGGING_STAGE_ID = 'deltaLakeMarshTagging';
    const MAJOR_RIVER_CANDIDATES_ID = 'majorRiverCandidates';
    const MAJOR_RIVER_EXTRACTION_STAGE_ID = 'majorRiverExtraction';
    const RIVER_BASIN_RECORD_OUTPUT_ID = 'riverBasinRecordOutput';
    const RIVER_BASIN_RECORD_STAGE_ID = 'riverBasinRecords';
    const HYDROLOGY_DEBUG_EXPORT_ID = 'hydrologyDebugExport';
    const HYDROLOGY_DEBUG_STAGE_ID = 'hydrologyDebugExport';
    const WATERSHED_DEBUG_MASK_FIELD_ID = 'watershedSegmentationMaskField';
    const RIVER_BASIN_DEBUG_MASK_FIELD_ID = 'riverBasinRecordMaskField';
    const NO_DOWNSTREAM_INDEX = -1;
    const FLOW_DIRECTIONS = deepFreeze([
        { code: 1, directionId: 'east', dx: 1, dy: 0, distance: 1 },
        { code: 2, directionId: 'south_east', dx: 1, dy: 1, distance: Math.SQRT2 },
        { code: 3, directionId: 'south', dx: 0, dy: 1, distance: 1 },
        { code: 4, directionId: 'south_west', dx: -1, dy: 1, distance: Math.SQRT2 },
        { code: 5, directionId: 'west', dx: -1, dy: 0, distance: 1 },
        { code: 6, directionId: 'north_west', dx: -1, dy: -1, distance: Math.SQRT2 },
        { code: 7, directionId: 'north', dx: 0, dy: -1, distance: 1 },
        { code: 8, directionId: 'north_east', dx: 1, dy: -1, distance: Math.SQRT2 }
    ]);
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
            fieldId: 'seaLevelAppliedElevationField',
            sourceGroup: 'reliefElevation.outputs.fields',
            required: true,
            role: 'post-threshold elevation context for future drainage and basin scoring'
        },
        {
            fieldId: 'landmassCleanupMaskField',
            sourceGroup: 'reliefElevation.outputs.fields',
            required: true,
            role: 'cleaned land baseline for future river-basin and drainage extraction'
        },
        {
            fieldId: 'basinDepressionField',
            sourceGroup: 'reliefElevation.outputs.fields',
            required: false,
            role: 'optional basin-floor context for later basin retention and river routing'
        },
        {
            fieldId: 'mountainAmplificationField',
            sourceGroup: 'reliefElevation.outputs.fields',
            required: false,
            role: 'optional headwater context for later major-river extraction'
        },
        {
            fieldId: 'plateauCandidateField',
            sourceGroup: 'reliefElevation.outputs.fields',
            required: false,
            role: 'optional divide/highland context for later watershed refinement'
        }
    ]);
    const INTERMEDIATE_DEPENDENCIES = deepFreeze([
        {
            outputId: 'watershedSegmentation',
            sourceGroup: 'hydrosphere.outputs.intermediateOutputs',
            required: true,
            role: 'pre-record watershed grouping and RiverBasinRecord-compatible draft source'
        },
        {
            outputId: 'oceanBasinFloodFill',
            sourceGroup: 'hydrosphere.outputs.intermediateOutputs',
            required: false,
            role: 'optional terminal-water context for later exorheic/endorheic refinement'
        },
        {
            outputId: 'seaRegionClusters',
            sourceGroup: 'hydrosphere.outputs.intermediateOutputs',
            required: false,
            role: 'optional provisional sea-region terminal references for future basin records'
        },
        {
            outputId: 'coastalDepthApproximation',
            sourceGroup: 'hydrosphere.outputs.intermediateOutputs',
            required: false,
            role: 'optional coastal context for future river-mouth and landing analysis'
        },
        {
            outputId: 'reliefRegionExtraction',
            sourceGroup: 'reliefElevation.outputs.intermediateOutputs',
            required: false,
            role: 'optional relief-region bodies for later river-basin linkage'
        }
    ]);
    const RECORD_DEPENDENCIES = deepFreeze([
        {
            outputId: 'reliefRegions',
            sourceGroup: 'reliefElevation.outputs.records',
            required: false,
            role: 'optional finalized relief records for later RiverBasinRecord references'
        },
        {
            outputId: 'seaRegions',
            sourceGroup: 'hydrosphere.outputs.records',
            required: false,
            role: 'optional finalized sea regions for later terminal basin references'
        }
    ]);
    const PLANNED_OUTPUTS = deepFreeze({
        fields: [
            FLOW_ACCUMULATION_FIELD_ID,
            'surfaceDrainageTendencyField'
        ],
        intermediateOutputs: [
            'riverSystemCompositionPlan',
            DOWNHILL_FLOW_ROUTING_STAGE_ID,
            DELTA_LAKE_MARSH_TAGGING_ID,
            'riverBasinDrafts',
            MAJOR_RIVER_CANDIDATES_ID,
            'riverRoutingGraph'
        ],
        records: [
            'riverBasins'
        ],
        debugArtifacts: [
            HYDROLOGY_DEBUG_EXPORT_ID,
            'riverSystemDebugArtifacts'
        ]
    });
    const PLANNED_STAGES = deepFreeze([
        {
            stageId: 'dependencyIntake',
            seedScope: 'dependencyIntake',
            plannedOutputs: ['dependencyAvailability']
        },
        {
            stageId: 'basinDraftScaffold',
            seedScope: 'riverBasins',
            plannedOutputs: ['riverBasinDrafts']
        },
        {
            stageId: DOWNHILL_FLOW_ROUTING_STAGE_ID,
            seedScope: 'riverRouting',
            plannedOutputs: [DOWNHILL_FLOW_ROUTING_STAGE_ID]
        },
        {
            stageId: FLOW_ACCUMULATION_STAGE_ID,
            seedScope: 'flowAccumulation',
            plannedOutputs: [FLOW_ACCUMULATION_FIELD_ID]
        },
        {
            stageId: DELTA_LAKE_MARSH_TAGGING_STAGE_ID,
            seedScope: 'deltaLakeMarshTagging',
            plannedOutputs: [DELTA_LAKE_MARSH_TAGGING_ID]
        },
        {
            stageId: RIVER_BASIN_RECORD_STAGE_ID,
            seedScope: 'riverBasins',
            plannedOutputs: ['riverBasins']
        },
        {
            stageId: MAJOR_RIVER_EXTRACTION_STAGE_ID,
            seedScope: 'majorRiverCandidates',
            plannedOutputs: [MAJOR_RIVER_CANDIDATES_ID]
        },
        {
            stageId: 'riverRoutingGraphScaffold',
            seedScope: 'riverRoutingGraph',
            plannedOutputs: ['riverRoutingGraph']
        },
        {
            stageId: HYDROLOGY_DEBUG_STAGE_ID,
            seedScope: 'debugExport',
            plannedOutputs: [HYDROLOGY_DEBUG_EXPORT_ID, 'riverSystemDebugArtifacts']
        }
    ]);
    const INTENTIONALLY_ABSENT_OUTPUTS = Object.freeze([
        'surfaceDrainageTendencyField',
        'riverBasinDrafts',
        'riverRoutingGraph',
        'finalRiverDeltaSystems',
        'lakeHydrologySimulation',
        'marshBiomeConstruction',
        'biomes',
        'gameplayResources',
        'climateBlend',
        'fullPackageAssembly',
        'localRiverPlacement',
        'settlementLogic',
        'terrainCells',
        'uiOverlays',
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
            ? value.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim())
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
        const hydrosphere = isPlainObject(sourceInput.hydrosphere) ? sourceInput.hydrosphere : {};
        const directOutputs = isPlainObject(sourceInput.outputs) ? sourceInput.outputs : {};
        const reliefOutputs = isPlainObject(reliefElevation.outputs) ? reliefElevation.outputs : {};
        const hydrosphereOutputs = isPlainObject(hydrosphere.outputs) ? hydrosphere.outputs : {};

        const fieldContainers = [];
        addContainer(fieldContainers, sourceInput.fields);
        addContainer(fieldContainers, directOutputs.fields);
        addContainer(fieldContainers, reliefElevation.fields);
        addContainer(fieldContainers, reliefOutputs.fields);
        addContainer(fieldContainers, hydrosphere.fields);
        addContainer(fieldContainers, hydrosphereOutputs.fields);

        const intermediateContainers = [];
        addContainer(intermediateContainers, sourceInput.intermediateOutputs);
        addContainer(intermediateContainers, directOutputs.intermediateOutputs);
        addContainer(intermediateContainers, reliefElevation.intermediateOutputs);
        addContainer(intermediateContainers, reliefOutputs.intermediateOutputs);
        addContainer(intermediateContainers, hydrosphere.intermediateOutputs);
        addContainer(intermediateContainers, hydrosphereOutputs.intermediateOutputs);

        const recordContainers = [];
        addContainer(recordContainers, sourceInput.records);
        addContainer(recordContainers, directOutputs.records);
        addContainer(recordContainers, reliefElevation.records);
        addContainer(recordContainers, reliefOutputs.records);
        addContainer(recordContainers, hydrosphere.records);
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

    function describeRiverSystemDependencyAvailability(input = {}) {
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

    function createEmptyRiverSystemOutputs() {
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

    function normalizeSerializedField(field, fallbackBounds = DEFAULT_WORLD_BOUNDS, fallbackValue = 0) {
        const normalizedBounds = normalizeWorldBounds(fallbackBounds);
        if (!field || typeof field !== 'object') {
            return {
                fieldId: 'missingField',
                width: normalizedBounds.width,
                height: normalizedBounds.height,
                size: normalizedBounds.width * normalizedBounds.height,
                threshold: DEFAULT_LAND_THRESHOLD,
                values: new Array(normalizedBounds.width * normalizedBounds.height).fill(clampUnitInterval(fallbackValue, 0))
            };
        }

        const width = normalizeInteger(field.width, normalizedBounds.width);
        const height = normalizeInteger(field.height, normalizedBounds.height);
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
            values.push(clampUnitInterval(fallbackValue, 0));
        }

        return {
            fieldId: normalizeString(field.fieldId, 'serializedField'),
            width,
            height,
            size,
            threshold: clampUnitInterval(field.threshold, DEFAULT_LAND_THRESHOLD),
            values
        };
    }

    function getSourceInputs(input = {}) {
        const containers = buildDependencyContainers(input);
        return {
            seaLevelAppliedElevationField: findDependencyValue(containers.fields, 'seaLevelAppliedElevationField'),
            landmassCleanupMaskField: findDependencyValue(containers.fields, 'landmassCleanupMaskField'),
            basinDepressionField: findDependencyValue(containers.fields, 'basinDepressionField'),
            mountainAmplificationField: findDependencyValue(containers.fields, 'mountainAmplificationField'),
            plateauCandidateField: findDependencyValue(containers.fields, 'plateauCandidateField'),
            watershedSegmentation: findDependencyValue(containers.intermediateOutputs, 'watershedSegmentation'),
            oceanBasinFloodFill: findDependencyValue(containers.intermediateOutputs, 'oceanBasinFloodFill'),
            seaRegionClusters: findDependencyValue(containers.intermediateOutputs, 'seaRegionClusters'),
            coastalDepthApproximation: findDependencyValue(containers.intermediateOutputs, 'coastalDepthApproximation')
        };
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

    function inBounds(x, y, width, height) {
        return x >= 0 && y >= 0 && x < width && y < height;
    }

    function getNeighborEntries(index, width, height) {
        const point = pointFromIndex(index, width);
        const entries = [];

        FLOW_DIRECTIONS.forEach((direction) => {
            const neighborX = point.x + direction.dx;
            const neighborY = point.y + direction.dy;
            if (!inBounds(neighborX, neighborY, width, height)) {
                return;
            }

            entries.push({
                ...direction,
                index: indexFromPoint(neighborX, neighborY, width),
                x: neighborX,
                y: neighborY
            });
        });

        return entries;
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

    function buildFlowDirectionEncoding() {
        return [
            {
                code: 0,
                directionId: 'none',
                dx: 0,
                dy: 0,
                description: 'water cell, flat sink, or unresolved downstream step'
            },
            ...FLOW_DIRECTIONS.map((direction) => ({
                code: direction.code,
                directionId: direction.directionId,
                dx: direction.dx,
                dy: direction.dy
            }))
        ];
    }

    function findBestDownhillNeighbor(index, fields, routingSeed) {
        const point = pointFromIndex(index, fields.width);
        const currentElevation = fields.elevationValues[index];
        let bestCandidate = null;

        FLOW_DIRECTIONS.forEach((direction) => {
            const neighborX = point.x + direction.dx;
            const neighborY = point.y + direction.dy;
            if (!inBounds(neighborX, neighborY, fields.width, fields.height)) {
                return;
            }

            const neighborIndex = indexFromPoint(neighborX, neighborY, fields.width);
            const neighborElevation = fields.elevationValues[neighborIndex];
            const drop = currentElevation - neighborElevation;
            if (drop <= 0.000001) {
                return;
            }

            const slope = drop / direction.distance;
            const tieBreaker = deterministicUnitNoise(routingSeed, ((index + 1) * 257) + (direction.code * 17)) * 0.000000001;
            const score = slope + tieBreaker;
            if (!bestCandidate || score > bestCandidate.score) {
                bestCandidate = {
                    index: neighborIndex,
                    direction,
                    drop,
                    slope,
                    score,
                    isTerminalWaterStep: !fields.landCells[neighborIndex]
                };
            }
        });

        return bestCandidate;
    }

    function buildWatershedLookup(watershedSegmentation = {}) {
        const lookup = new Map();
        const watersheds = Array.isArray(watershedSegmentation.watersheds)
            ? watershedSegmentation.watersheds
            : [];

        watersheds.forEach((watershed) => {
            const watershedId = normalizeString(watershed.watershedId, '');
            const cellIndices = Array.isArray(watershed.cellIndices) ? watershed.cellIndices : [];
            cellIndices.forEach((cellIndex) => {
                lookup.set(cellIndex, watershedId);
            });
        });

        return lookup;
    }

    function summarizeWatershedRouting(watershedSegmentation = {}, routingArrays = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const watersheds = Array.isArray(watershedSegmentation.watersheds)
            ? watershedSegmentation.watersheds
            : [];

        return watersheds.map((watershed) => {
            const cellIndices = Array.isArray(watershed.cellIndices) ? watershed.cellIndices : [];
            let routedCellCount = 0;
            let sinkCellCount = 0;
            let terminalWaterStepCount = 0;
            let dropTotal = 0;
            let slopeTotal = 0;
            let maxDrop = 0;
            let maxSlope = 0;

            cellIndices.forEach((cellIndex) => {
                const downstreamIndex = routingArrays.downstreamIndices[cellIndex];
                if (downstreamIndex >= 0) {
                    routedCellCount += 1;
                    dropTotal += routingArrays.dropValues[cellIndex] || 0;
                    slopeTotal += routingArrays.slopeValues[cellIndex] || 0;
                    maxDrop = Math.max(maxDrop, routingArrays.dropValues[cellIndex] || 0);
                    maxSlope = Math.max(maxSlope, routingArrays.slopeValues[cellIndex] || 0);

                    if (!routingArrays.landCells[downstreamIndex]) {
                        terminalWaterStepCount += 1;
                    }
                    return;
                }

                if (routingArrays.landCells[cellIndex]) {
                    sinkCellCount += 1;
                }
            });

            return {
                watershedId: normalizeString(watershed.watershedId, ''),
                sourceAssignmentId: normalizeString(watershed.sourceAssignmentId, ''),
                cellCount: cellIndices.length,
                routedCellCount,
                sinkCellCount,
                terminalWaterStepCount,
                routedCellRatio: roundFieldValue(routedCellCount / Math.max(1, cellIndices.length)),
                meanDrop: roundFieldValue(dropTotal / Math.max(1, routedCellCount)),
                meanSlope: roundFieldValue(slopeTotal / Math.max(1, routedCellCount)),
                maxDrop: roundFieldValue(maxDrop),
                maxSlope: roundFieldValue(maxSlope),
                terminalWaterHint: cloneValue(watershed.terminalWaterHint || {}),
                headwaterHint: cloneValue(watershed.headwaterHint || {}),
                routingPreparation: {
                    futureAccumulationInput: true,
                    futureMajorRiverExtractionInput: true,
                    sameWorldBoundsRequired: true,
                    worldBounds: cloneValue(worldBounds)
                }
            };
        });
    }

    function isDownhillFlowRoutingPayload(value) {
        return isPlainObject(value) && Array.isArray(value.downstreamIndices);
    }

    function resolveDownhillFlowRouting(input = {}, fallbackOutput = null) {
        if (isDownhillFlowRoutingPayload(fallbackOutput)) {
            return fallbackOutput;
        }

        if (isPlainObject(fallbackOutput) && isDownhillFlowRoutingPayload(fallbackOutput.downhillFlowRouting)) {
            return fallbackOutput.downhillFlowRouting;
        }

        const containers = buildDependencyContainers(input);
        const existingRouting = findDependencyValue(containers.intermediateOutputs, DOWNHILL_FLOW_ROUTING_STAGE_ID);
        if (isDownhillFlowRoutingPayload(existingRouting)) {
            return existingRouting;
        }

        return materializeDownhillFlowRouting(input).downhillFlowRouting;
    }

    function normalizeDownstreamIndices(downhillFlowRouting = {}, size = 0) {
        const sourceIndices = Array.isArray(downhillFlowRouting.downstreamIndices)
            ? downhillFlowRouting.downstreamIndices
            : [];
        const downstreamIndices = new Array(size).fill(NO_DOWNSTREAM_INDEX);

        for (let index = 0; index < size; index += 1) {
            const downstreamIndex = Number(sourceIndices[index]);
            downstreamIndices[index] = Number.isInteger(downstreamIndex) && downstreamIndex >= 0 && downstreamIndex < size
                ? downstreamIndex
                : NO_DOWNSTREAM_INDEX;
        }

        return downstreamIndices;
    }

    function summarizeWatershedAccumulation(watershedSegmentation = {}, accumulationArrays = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const watersheds = Array.isArray(watershedSegmentation.watersheds)
            ? watershedSegmentation.watersheds
            : [];

        return watersheds.map((watershed) => {
            const cellIndices = Array.isArray(watershed.cellIndices) ? watershed.cellIndices : [];
            let landCellCount = 0;
            let rawTotal = 0;
            let maxRawAccumulation = 0;
            let maxNormalizedAccumulation = 0;

            cellIndices.forEach((cellIndex) => {
                if (!accumulationArrays.landCells[cellIndex]) {
                    return;
                }

                const rawAccumulation = accumulationArrays.rawAccumulationValues[cellIndex] || 0;
                const normalizedAccumulation = accumulationArrays.values[cellIndex] || 0;
                landCellCount += 1;
                rawTotal += rawAccumulation;
                maxRawAccumulation = Math.max(maxRawAccumulation, rawAccumulation);
                maxNormalizedAccumulation = Math.max(maxNormalizedAccumulation, normalizedAccumulation);
            });

            return {
                watershedId: normalizeString(watershed.watershedId, ''),
                sourceAssignmentId: normalizeString(watershed.sourceAssignmentId, ''),
                cellCount: cellIndices.length,
                landCellCount,
                meanRawAccumulation: roundFieldValue(rawTotal / Math.max(1, landCellCount)),
                maxRawAccumulation,
                maxNormalizedAccumulation: roundFieldValue(maxNormalizedAccumulation),
                terminalWaterHint: cloneValue(watershed.terminalWaterHint || {}),
                headwaterHint: cloneValue(watershed.headwaterHint || {}),
                accumulationPreparation: {
                    futureRiverExtractionInput: true,
                    futureRiverBasinDraftInput: true,
                    finalRiverRecordOutput: false,
                    sameWorldBoundsRequired: true,
                    worldBounds: cloneValue(worldBounds)
                }
            };
        });
    }

    function isFlowAccumulationFieldPayload(value) {
        return isPlainObject(value) && Array.isArray(value.values) && Array.isArray(value.rawAccumulationValues);
    }

    function resolveFlowAccumulationField(input = {}, fallbackOutput = null, fallbackDownhillFlowRoutingOutput = null) {
        if (isFlowAccumulationFieldPayload(fallbackOutput)) {
            return fallbackOutput;
        }

        if (isPlainObject(fallbackOutput) && isFlowAccumulationFieldPayload(fallbackOutput.flowAccumulationField)) {
            return fallbackOutput.flowAccumulationField;
        }

        const containers = buildDependencyContainers(input);
        const existingField = findDependencyValue(containers.fields, FLOW_ACCUMULATION_FIELD_ID);
        if (isFlowAccumulationFieldPayload(existingField)) {
            return existingField;
        }

        return materializeFlowAccumulationField(input, fallbackDownhillFlowRoutingOutput).flowAccumulationField;
    }

    function isWatershedSegmentationPayload(value) {
        return isPlainObject(value) && Array.isArray(value.watersheds);
    }

    function resolveWatershedSegmentation(input = {}, fallbackOutput = null) {
        if (isWatershedSegmentationPayload(fallbackOutput)) {
            return fallbackOutput;
        }

        const containers = buildDependencyContainers(input);
        const existingOutput = findDependencyValue(containers.intermediateOutputs, 'watershedSegmentation');
        if (isWatershedSegmentationPayload(existingOutput)) {
            return existingOutput;
        }

        return {
            watershedSegmentationId: 'missingWatershedSegmentation',
            stageId: 'watershedSegmentation',
            watersheds: [],
            summary: {
                watershedCount: 0
            },
            intentionallyAbsent: [
                'computedWatershedSegmentation'
            ]
        };
    }

    function createRiverBasinId(sequence) {
        return `basin_${String(Math.max(1, sequence)).padStart(3, '0')}`;
    }

    function getWatershedCellStats(watershed = {}, flowAccumulationField = {}) {
        const cellIndices = Array.isArray(watershed.cellIndices) ? watershed.cellIndices : [];
        const values = Array.isArray(flowAccumulationField.values) ? flowAccumulationField.values : [];
        const rawValues = Array.isArray(flowAccumulationField.rawAccumulationValues)
            ? flowAccumulationField.rawAccumulationValues
            : [];
        let rawTotal = 0;
        let normalizedTotal = 0;
        let maxRawAccumulation = 0;
        let maxNormalizedAccumulation = 0;

        cellIndices.forEach((cellIndex) => {
            const normalizedCellIndex = Number(cellIndex);
            if (!Number.isInteger(normalizedCellIndex) || normalizedCellIndex < 0) {
                return;
            }

            const rawAccumulation = Number(rawValues[normalizedCellIndex]) || 0;
            const normalizedAccumulation = Number(values[normalizedCellIndex]) || 0;
            rawTotal += rawAccumulation;
            normalizedTotal += normalizedAccumulation;
            maxRawAccumulation = Math.max(maxRawAccumulation, rawAccumulation);
            maxNormalizedAccumulation = Math.max(maxNormalizedAccumulation, normalizedAccumulation);
        });

        return {
            cellCount: cellIndices.length,
            meanRawAccumulation: roundFieldValue(rawTotal / Math.max(1, cellIndices.length)),
            maxRawAccumulation,
            meanNormalizedAccumulation: roundFieldValue(normalizedTotal / Math.max(1, cellIndices.length)),
            maxNormalizedAccumulation: roundFieldValue(maxNormalizedAccumulation)
        };
    }

    function resolveTerminalMode(watershed = {}) {
        const recordDraft = isPlainObject(watershed.recordDraft) ? watershed.recordDraft : {};
        const terminalWaterHint = isPlainObject(watershed.terminalWaterHint) ? watershed.terminalWaterHint : {};
        const terminalMode = normalizeString(terminalWaterHint.terminalMode, '');
        const basinType = normalizeString(recordDraft.basinType, '');
        const terminalSeaRegionIds = normalizeStringList(
            terminalWaterHint.terminalSeaRegionIds && terminalWaterHint.terminalSeaRegionIds.length
                ? terminalWaterHint.terminalSeaRegionIds
                : recordDraft.terminalSeaRegionIds
        );

        if (
            terminalMode === 'sea_terminal'
            || terminalSeaRegionIds.length > 0
            || basinType === 'exorheic'
            || basinType === 'inland_sea_feeder'
        ) {
            return 'terminal_water';
        }

        if (
            terminalMode === 'internal_unresolved'
            || terminalWaterHint.sourceBasinKind === 'enclosed_water'
            || basinType === 'endorheic'
            || basinType === 'internal_unresolved'
        ) {
            return 'internal_sink';
        }

        return 'unresolved';
    }

    function createHydrologyTaggingContext(input = {}, fallbackDownhillFlowRoutingOutput = null, fallbackFlowAccumulationOutput = null) {
        const normalizedInput = normalizeInput(input);
        const sourceInputs = getSourceInputs(input);
        const downhillFlowRouting = resolveDownhillFlowRouting(input, fallbackDownhillFlowRoutingOutput);
        const flowAccumulationField = resolveFlowAccumulationField(
            input,
            fallbackFlowAccumulationOutput,
            downhillFlowRouting
        );
        const routingWorldBounds = normalizeWorldBounds(
            downhillFlowRouting.worldBounds
                || flowAccumulationField.worldBounds
                || normalizedInput.worldBounds
        );
        const elevationField = normalizeSerializedField(
            sourceInputs.seaLevelAppliedElevationField,
            routingWorldBounds,
            0
        );
        const worldBounds = normalizeWorldBounds({
            width: elevationField.width,
            height: elevationField.height
        });
        const landMaskField = normalizeSerializedField(
            sourceInputs.landmassCleanupMaskField,
            worldBounds,
            0
        );
        const basinDepressionField = normalizeSerializedField(
            sourceInputs.basinDepressionField,
            worldBounds,
            0
        );
        const mountainAmplificationField = normalizeSerializedField(
            sourceInputs.mountainAmplificationField,
            worldBounds,
            0
        );
        const plateauCandidateField = normalizeSerializedField(
            sourceInputs.plateauCandidateField,
            worldBounds,
            0
        );
        const width = worldBounds.width;
        const height = worldBounds.height;
        const size = width * height;
        const landThreshold = clampUnitInterval(
            downhillFlowRouting.landThreshold,
            clampUnitInterval(landMaskField.threshold, DEFAULT_LAND_THRESHOLD)
        );
        const landCells = landMaskField.values.map((value) => value >= landThreshold);

        return {
            normalizedInput,
            sourceInputs,
            downhillFlowRouting,
            flowAccumulationField,
            watershedSegmentation: resolveWatershedSegmentation(input, sourceInputs.watershedSegmentation),
            worldBounds,
            width,
            height,
            size,
            landThreshold,
            landCells,
            elevationValues: elevationField.values,
            basinDepressionValues: basinDepressionField.values,
            mountainAmplificationValues: mountainAmplificationField.values,
            plateauCandidateValues: plateauCandidateField.values,
            downstreamIndices: normalizeDownstreamIndices(downhillFlowRouting, size),
            slopeValues: Array.isArray(downhillFlowRouting.slopeValues)
                ? downhillFlowRouting.slopeValues.slice(0, size)
                : new Array(size).fill(0),
            rawAccumulationValues: Array.isArray(flowAccumulationField.rawAccumulationValues)
                ? flowAccumulationField.rawAccumulationValues.slice(0, size)
                : new Array(size).fill(0),
            accumulationValues: Array.isArray(flowAccumulationField.values)
                ? flowAccumulationField.values.slice(0, size)
                : new Array(size).fill(0)
        };
    }

    function normalizeWatershedCellIndices(watershed = {}, context = {}) {
        const sourceCells = Array.isArray(watershed.cellIndices) ? watershed.cellIndices : [];
        const uniqueCells = new Set();

        sourceCells.forEach((cellIndex) => {
            const normalizedCellIndex = Number(cellIndex);
            if (
                Number.isInteger(normalizedCellIndex)
                && normalizedCellIndex >= 0
                && normalizedCellIndex < context.size
                && context.landCells[normalizedCellIndex]
            ) {
                uniqueCells.add(normalizedCellIndex);
            }
        });

        return Array.from(uniqueCells).sort((left, right) => left - right);
    }

    function getAdjacentWaterCount(cellIndex, context = {}) {
        return getNeighborEntries(cellIndex, context.width, context.height)
            .filter((neighbor) => !context.landCells[neighbor.index])
            .length;
    }

    function isTerminalWaterStep(cellIndex, context = {}) {
        const downstreamIndex = context.downstreamIndices[cellIndex];
        return downstreamIndex >= 0 && !context.landCells[downstreamIndex];
    }

    function createFeatureId(featureType, watershedId, sequence) {
        const safeWatershedId = normalizeString(watershedId, `watershed_${sequence}`);
        return `${featureType}_${safeWatershedId}`;
    }

    function summarizeFeatureCells(cellIndices = [], context = {}) {
        if (!cellIndices.length) {
            return {
                centroidPoint: { x: 0, y: 0 },
                normalizedCentroid: { x: 0, y: 0 },
                boundingBox: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
                meanAccumulation: 0,
                maxAccumulation: 0,
                meanRawAccumulation: 0,
                meanBasinDepression: 0,
                meanSlope: 0,
                meanElevation: 0,
                adjacentWaterCellCount: 0
            };
        }

        let xTotal = 0;
        let yTotal = 0;
        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = 0;
        let maxY = 0;
        let accumulationTotal = 0;
        let rawAccumulationTotal = 0;
        let basinDepressionTotal = 0;
        let slopeTotal = 0;
        let elevationTotal = 0;
        let maxAccumulation = 0;
        let adjacentWaterCellCount = 0;

        cellIndices.forEach((cellIndex) => {
            const point = pointFromIndex(cellIndex, context.width);
            const accumulation = clampUnitInterval(context.accumulationValues[cellIndex], 0);
            const rawAccumulation = Number(context.rawAccumulationValues[cellIndex]) || 0;
            const basinDepression = clampUnitInterval(context.basinDepressionValues[cellIndex], 0);
            const slope = clampUnitInterval(context.slopeValues[cellIndex], 0);
            const elevation = clampUnitInterval(context.elevationValues[cellIndex], 0);
            xTotal += point.x;
            yTotal += point.y;
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
            accumulationTotal += accumulation;
            rawAccumulationTotal += rawAccumulation;
            basinDepressionTotal += basinDepression;
            slopeTotal += slope;
            elevationTotal += elevation;
            maxAccumulation = Math.max(maxAccumulation, accumulation);
            if (getAdjacentWaterCount(cellIndex, context) > 0 || isTerminalWaterStep(cellIndex, context)) {
                adjacentWaterCellCount += 1;
            }
        });

        const count = Math.max(1, cellIndices.length);
        const centroidPoint = {
            x: roundFieldValue(xTotal / count),
            y: roundFieldValue(yTotal / count)
        };

        return {
            centroidPoint,
            normalizedCentroid: {
                x: roundFieldValue(centroidPoint.x / Math.max(1, context.width - 1)),
                y: roundFieldValue(centroidPoint.y / Math.max(1, context.height - 1))
            },
            boundingBox: { minX, minY, maxX, maxY },
            meanAccumulation: roundFieldValue(accumulationTotal / count),
            maxAccumulation: roundFieldValue(maxAccumulation),
            meanRawAccumulation: roundFieldValue(rawAccumulationTotal / count),
            meanBasinDepression: roundFieldValue(basinDepressionTotal / count),
            meanSlope: roundFieldValue(slopeTotal / count),
            meanElevation: roundFieldValue(elevationTotal / count),
            adjacentWaterCellCount
        };
    }

    function createHydrologyFeatureTag(featureType, watershed = {}, cellIndices = [], context = {}, sequence = 1, signals = {}) {
        const watershedId = normalizeString(watershed.watershedId, '');
        const recordDraft = isPlainObject(watershed.recordDraft) ? watershed.recordDraft : {};
        const cellSummary = summarizeFeatureCells(cellIndices, context);
        const strength = clampUnitInterval(
            signals.strength,
            (cellSummary.meanAccumulation * 0.45)
                + (cellSummary.meanBasinDepression * 0.25)
                + ((1 - cellSummary.meanSlope) * 0.15)
                + ((cellSummary.adjacentWaterCellCount / Math.max(1, cellIndices.length)) * 0.15)
        );
        const confidence = clampUnitInterval(
            signals.confidence,
            0.35 + (strength * 0.45) + Math.min(0.2, cellIndices.length / Math.max(1, normalizeInteger(watershed.cellCount, cellIndices.length) || cellIndices.length))
        );

        return {
            featureTagId: createFeatureId(featureType, watershedId, sequence),
            featureType,
            watershedId,
            riverBasinIdHint: normalizeString(recordDraft.riverBasinId, ''),
            basinType: normalizeString(recordDraft.basinType, ''),
            sourceAssignmentId: normalizeString(watershed.sourceAssignmentId, ''),
            cellIndices: cellIndices.slice().sort((left, right) => left - right),
            cellCount: cellIndices.length,
            normalizedArea: roundFieldValue(cellIndices.length / Math.max(1, context.size)),
            ...cellSummary,
            strength: roundFieldValue(strength),
            confidence: roundFieldValue(confidence),
            signals: cloneValue({
                ...signals,
                strength: roundFieldValue(strength),
                confidence: roundFieldValue(confidence)
            }),
            terminalWaterHint: cloneValue(watershed.terminalWaterHint || {}),
            downstreamSummary: {
                futureRiverBasinSummaryInput: true,
                futureClimateBlendInput: true,
                futureMajorRiverInterpretationInput: true,
                recordShapeMutation: false,
                biomeOutput: false,
                gameplayResourceOutput: false
            }
        };
    }

    function selectDeltaCells(watershed = {}, context = {}, taggingSeed = 0) {
        if (resolveTerminalMode(watershed) !== 'terminal_water') {
            return [];
        }

        const cells = normalizeWatershedCellIndices(watershed, context);
        const watershedMaxRaw = cells.reduce((maxValue, cellIndex) => (
            Math.max(maxValue, Number(context.rawAccumulationValues[cellIndex]) || 0)
        ), 0);
        const minRawAccumulation = Math.max(2, Math.ceil(watershedMaxRaw * 0.35));

        return cells
            .map((cellIndex) => {
                const adjacentWaterCount = getAdjacentWaterCount(cellIndex, context);
                const terminalStep = isTerminalWaterStep(cellIndex, context);
                const accumulation = clampUnitInterval(context.accumulationValues[cellIndex], 0);
                const rawAccumulation = Number(context.rawAccumulationValues[cellIndex]) || 0;
                const score = (accumulation * 0.52)
                    + ((adjacentWaterCount / Math.max(1, FLOW_DIRECTIONS.length)) * 0.24)
                    + (terminalStep ? 0.18 : 0)
                    + (deterministicUnitNoise(taggingSeed, (cellIndex + 1) * 131) * 0.0001);

                return {
                    cellIndex,
                    rawAccumulation,
                    score
                };
            })
            .filter((candidate) => (
                candidate.rawAccumulation >= minRawAccumulation
                && candidate.score >= 0.3
            ))
            .sort((left, right) => {
                if (right.score !== left.score) {
                    return right.score - left.score;
                }
                return left.cellIndex - right.cellIndex;
            })
            .slice(0, Math.max(1, Math.min(16, Math.ceil(cells.length * 0.12))))
            .map((candidate) => candidate.cellIndex)
            .sort((left, right) => left - right);
    }

    function selectLakeCells(watershed = {}, context = {}, taggingSeed = 0) {
        const terminalMode = resolveTerminalMode(watershed);
        const cells = normalizeWatershedCellIndices(watershed, context);
        const hasBasinSignal = cells.some((cellIndex) => clampUnitInterval(context.basinDepressionValues[cellIndex], 0) >= 0.45);
        if (terminalMode !== 'internal_sink' && !hasBasinSignal) {
            return [];
        }

        return cells
            .map((cellIndex) => {
                const sinkBias = context.downstreamIndices[cellIndex] < 0 ? 0.2 : 0;
                const basinDepression = clampUnitInterval(context.basinDepressionValues[cellIndex], 0);
                const lowElevationBias = 1 - clampUnitInterval(context.elevationValues[cellIndex], 0);
                const accumulation = clampUnitInterval(context.accumulationValues[cellIndex], 0);
                const mountainPenalty = clampUnitInterval(context.mountainAmplificationValues[cellIndex], 0) * 0.2;
                const score = sinkBias
                    + (basinDepression * 0.38)
                    + (lowElevationBias * 0.22)
                    + (accumulation * 0.18)
                    - mountainPenalty
                    + (deterministicUnitNoise(taggingSeed, (cellIndex + 1) * 173) * 0.0001);

                return {
                    cellIndex,
                    score
                };
            })
            .filter((candidate) => candidate.score >= 0.34)
            .sort((left, right) => {
                if (right.score !== left.score) {
                    return right.score - left.score;
                }
                return left.cellIndex - right.cellIndex;
            })
            .slice(0, Math.max(1, Math.min(18, Math.ceil(cells.length * 0.1))))
            .map((candidate) => candidate.cellIndex)
            .sort((left, right) => left - right);
    }

    function selectMarshCells(watershed = {}, context = {}, occupiedCells = new Set(), taggingSeed = 0) {
        const cells = normalizeWatershedCellIndices(watershed, context);

        return cells
            .filter((cellIndex) => !occupiedCells.has(cellIndex))
            .map((cellIndex) => {
                const slope = clampUnitInterval(context.slopeValues[cellIndex], 0);
                const lowSlopeBias = 1 - Math.min(1, slope / 0.18);
                const accumulation = clampUnitInterval(context.accumulationValues[cellIndex], 0);
                const basinDepression = clampUnitInterval(context.basinDepressionValues[cellIndex], 0);
                const adjacentWaterBias = getAdjacentWaterCount(cellIndex, context) / Math.max(1, FLOW_DIRECTIONS.length);
                const lowElevationBias = 1 - clampUnitInterval(context.elevationValues[cellIndex], 0);
                const plateauPenalty = clampUnitInterval(context.plateauCandidateValues[cellIndex], 0) * 0.16;
                const score = (lowSlopeBias * 0.28)
                    + (accumulation * 0.25)
                    + (basinDepression * 0.22)
                    + (adjacentWaterBias * 0.15)
                    + (lowElevationBias * 0.1)
                    - plateauPenalty
                    + (deterministicUnitNoise(taggingSeed, (cellIndex + 1) * 197) * 0.0001);

                return {
                    cellIndex,
                    score
                };
            })
            .filter((candidate) => candidate.score >= 0.36)
            .sort((left, right) => {
                if (right.score !== left.score) {
                    return right.score - left.score;
                }
                return left.cellIndex - right.cellIndex;
            })
            .slice(0, Math.max(1, Math.min(20, Math.ceil(cells.length * 0.12))))
            .map((candidate) => candidate.cellIndex)
            .sort((left, right) => left - right);
    }

    function summarizeDeltaLakeMarshTags(featureTags = [], watersheds = []) {
        const featureCountsByType = {
            delta: 0,
            lake: 0,
            marsh: 0
        };
        const taggedCellSet = new Set();
        const watershedFeatureMap = new Map();

        featureTags.forEach((featureTag) => {
            if (Object.prototype.hasOwnProperty.call(featureCountsByType, featureTag.featureType)) {
                featureCountsByType[featureTag.featureType] += 1;
            }
            featureTag.cellIndices.forEach((cellIndex) => taggedCellSet.add(cellIndex));
            const watershedId = normalizeString(featureTag.watershedId, '');
            if (!watershedFeatureMap.has(watershedId)) {
                watershedFeatureMap.set(watershedId, []);
            }
            watershedFeatureMap.get(watershedId).push(featureTag);
        });

        const watershedFeatureSummaries = watersheds
            .map((watershed) => {
                const watershedId = normalizeString(watershed.watershedId, '');
                const features = watershedFeatureMap.get(watershedId) || [];
                const featureIds = features.map((feature) => feature.featureTagId).sort();
                const strongestFeature = features.slice().sort((left, right) => {
                    if (right.strength !== left.strength) {
                        return right.strength - left.strength;
                    }
                    return left.featureTagId.localeCompare(right.featureTagId);
                })[0];

                return {
                    watershedId,
                    riverBasinIdHint: normalizeString(watershed.recordDraft && watershed.recordDraft.riverBasinId, ''),
                    basinType: normalizeString(watershed.recordDraft && watershed.recordDraft.basinType, ''),
                    featureTagIds: featureIds,
                    featureCount: featureIds.length,
                    deltaCount: features.filter((feature) => feature.featureType === 'delta').length,
                    lakeCount: features.filter((feature) => feature.featureType === 'lake').length,
                    marshCount: features.filter((feature) => feature.featureType === 'marsh').length,
                    strongestFeatureType: strongestFeature ? strongestFeature.featureType : 'none',
                    strongestFeatureStrength: strongestFeature ? strongestFeature.strength : 0
                };
            })
            .filter((summary) => summary.featureCount > 0)
            .sort((left, right) => left.watershedId.localeCompare(right.watershedId));

        return {
            featureCount: featureTags.length,
            taggedCellCount: taggedCellSet.size,
            deltaCount: featureCountsByType.delta,
            lakeCount: featureCountsByType.lake,
            marshCount: featureCountsByType.marsh,
            featureCountsByType,
            taggedWatershedCount: watershedFeatureSummaries.length,
            watershedFeatureSummaries
        };
    }

    function createMajorRiverCandidateId(sequence) {
        return `major_river_${String(Math.max(1, sequence)).padStart(3, '0')}`;
    }

    function buildUpstreamLookup(context = {}) {
        const lookup = new Map();

        for (let index = 0; index < context.size; index += 1) {
            if (!context.landCells[index]) {
                continue;
            }

            const downstreamIndex = context.downstreamIndices[index];
            if (downstreamIndex < 0 || !context.landCells[downstreamIndex]) {
                continue;
            }

            if (!lookup.has(downstreamIndex)) {
                lookup.set(downstreamIndex, []);
            }
            lookup.get(downstreamIndex).push(index);
        }

        lookup.forEach((upstreamCells) => {
            upstreamCells.sort((leftIndex, rightIndex) => {
                const rawDelta = (Number(context.rawAccumulationValues[rightIndex]) || 0)
                    - (Number(context.rawAccumulationValues[leftIndex]) || 0);
                if (rawDelta !== 0) {
                    return rawDelta;
                }
                return leftIndex - rightIndex;
            });
        });

        return lookup;
    }

    function buildRecordLinkLookup(riverBasinRecordOutput = {}) {
        const links = Array.isArray(riverBasinRecordOutput.recordLinks)
            ? riverBasinRecordOutput.recordLinks
            : [];

        return new Map(links.map((link) => [
            normalizeString(link.watershedId, ''),
            cloneValue(link)
        ]));
    }

    function buildFeatureTagLookup(deltaLakeMarshTagging = {}) {
        const lookup = new Map();
        const featureTags = Array.isArray(deltaLakeMarshTagging.featureTags)
            ? deltaLakeMarshTagging.featureTags
            : [];

        featureTags.forEach((featureTag) => {
            const watershedId = normalizeString(featureTag.watershedId, '');
            if (!lookup.has(watershedId)) {
                lookup.set(watershedId, []);
            }
            lookup.get(watershedId).push(featureTag);
        });

        return lookup;
    }

    function chooseMajorRiverMouthCell(watershed = {}, context = {}, cells = [], extractionSeed = 0) {
        if (!cells.length) {
            return null;
        }

        const maxRawAccumulation = cells.reduce((maxValue, cellIndex) => (
            Math.max(maxValue, Number(context.rawAccumulationValues[cellIndex]) || 0)
        ), 0);
        const minRawAccumulation = Math.max(2, Math.ceil(Math.sqrt(cells.length)));
        const terminalMode = resolveTerminalMode(watershed);
        const scoredCells = cells
            .map((cellIndex) => {
                const rawAccumulation = Number(context.rawAccumulationValues[cellIndex]) || 0;
                const normalizedAccumulation = clampUnitInterval(context.accumulationValues[cellIndex], 0);
                const terminalWaterStep = isTerminalWaterStep(cellIndex, context);
                const internalSinkStep = context.downstreamIndices[cellIndex] < 0;
                const adjacentWaterBias = getAdjacentWaterCount(cellIndex, context) / Math.max(1, FLOW_DIRECTIONS.length);
                const terminalBias = terminalWaterStep
                    ? 0.24
                    : (internalSinkStep && terminalMode === 'internal_sink' ? 0.16 : 0);
                const score = (normalizedAccumulation * 0.58)
                    + (rawAccumulation / Math.max(1, maxRawAccumulation) * 0.2)
                    + terminalBias
                    + (adjacentWaterBias * 0.08)
                    + (deterministicUnitNoise(extractionSeed, (cellIndex + 1) * 211) * 0.0001);

                return {
                    cellIndex,
                    rawAccumulation,
                    normalizedAccumulation,
                    score
                };
            })
            .filter((candidate) => (
                candidate.rawAccumulation >= minRawAccumulation
                || candidate.normalizedAccumulation >= 0.42
            ))
            .sort((left, right) => {
                if (right.score !== left.score) {
                    return right.score - left.score;
                }
                return left.cellIndex - right.cellIndex;
            });

        return scoredCells.length ? scoredCells[0].cellIndex : null;
    }

    function chooseMainstemUpstreamCell(currentCellIndex, watershedId, context = {}, upstreamLookup = new Map(), watershedLookup = new Map(), visited = new Set(), extractionSeed = 0) {
        const upstreamCells = upstreamLookup.get(currentCellIndex) || [];
        const currentRawAccumulation = Math.max(1, Number(context.rawAccumulationValues[currentCellIndex]) || 1);
        const candidates = upstreamCells
            .filter((cellIndex) => (
                !visited.has(cellIndex)
                && watershedLookup.get(cellIndex) === watershedId
                && context.landCells[cellIndex]
            ))
            .map((cellIndex) => {
                const rawAccumulation = Number(context.rawAccumulationValues[cellIndex]) || 0;
                const normalizedAccumulation = clampUnitInterval(context.accumulationValues[cellIndex], 0);
                const elevation = clampUnitInterval(context.elevationValues[cellIndex], 0);
                const score = (rawAccumulation / currentRawAccumulation * 0.48)
                    + (normalizedAccumulation * 0.32)
                    + (elevation * 0.12)
                    + (deterministicUnitNoise(extractionSeed, (cellIndex + 1) * 223) * 0.0001);

                return {
                    cellIndex,
                    rawAccumulation,
                    score
                };
            })
            .filter((candidate) => candidate.rawAccumulation > 0)
            .sort((left, right) => {
                if (right.score !== left.score) {
                    return right.score - left.score;
                }
                return left.cellIndex - right.cellIndex;
            });

        return candidates.length ? candidates[0].cellIndex : null;
    }

    function traceMajorRiverLine(mouthCellIndex, watershed = {}, context = {}, upstreamLookup = new Map(), watershedLookup = new Map(), extractionSeed = 0) {
        const watershedId = normalizeString(watershed.watershedId, '');
        const pathToHeadwater = [mouthCellIndex];
        const visited = new Set(pathToHeadwater);
        let currentCellIndex = mouthCellIndex;

        while (pathToHeadwater.length < context.size) {
            const upstreamCellIndex = chooseMainstemUpstreamCell(
                currentCellIndex,
                watershedId,
                context,
                upstreamLookup,
                watershedLookup,
                visited,
                extractionSeed
            );
            if (upstreamCellIndex === null) {
                break;
            }

            pathToHeadwater.push(upstreamCellIndex);
            visited.add(upstreamCellIndex);
            currentCellIndex = upstreamCellIndex;
        }

        return pathToHeadwater.reverse();
    }

    function calculateLineLengthCells(lineCellIndices = [], context = {}) {
        let length = 0;

        for (let index = 1; index < lineCellIndices.length; index += 1) {
            const previousPoint = pointFromIndex(lineCellIndices[index - 1], context.width);
            const currentPoint = pointFromIndex(lineCellIndices[index], context.width);
            const dx = currentPoint.x - previousPoint.x;
            const dy = currentPoint.y - previousPoint.y;
            length += Math.sqrt((dx * dx) + (dy * dy));
        }

        return roundFieldValue(length);
    }

    function findAssociatedFeatureTags(lineCellIndices = [], watershedFeatureTags = []) {
        const lineCellSet = new Set(lineCellIndices);
        return watershedFeatureTags
            .filter((featureTag) => {
                const featureCells = Array.isArray(featureTag.cellIndices) ? featureTag.cellIndices : [];
                return featureCells.some((cellIndex) => lineCellSet.has(cellIndex));
            })
            .map((featureTag) => ({
                featureTagId: normalizeString(featureTag.featureTagId, ''),
                featureType: normalizeString(featureTag.featureType, ''),
                strength: clampUnitInterval(featureTag.strength, 0)
            }))
            .filter((featureTag) => featureTag.featureTagId)
            .sort((left, right) => {
                if (left.featureType !== right.featureType) {
                    return left.featureType.localeCompare(right.featureType);
                }
                return left.featureTagId.localeCompare(right.featureTagId);
            });
    }

    function createMajorRiverCandidate(watershed = {}, sequence = 1, context = {}, upstreamLookup = new Map(), watershedLookup = new Map(), recordLink = {}, watershedFeatureTags = [], extractionSeed = 0) {
        const cells = normalizeWatershedCellIndices(watershed, context);
        if (!cells.length) {
            return null;
        }

        const mouthCellIndex = chooseMajorRiverMouthCell(watershed, context, cells, extractionSeed);
        if (mouthCellIndex === null) {
            return null;
        }

        const lineCellIndices = traceMajorRiverLine(
            mouthCellIndex,
            watershed,
            context,
            upstreamLookup,
            watershedLookup,
            extractionSeed
        );
        const minLineCellCount = Math.max(2, Math.min(8, Math.ceil(cells.length * 0.04)));
        if (lineCellIndices.length < minLineCellCount) {
            return null;
        }

        const sourceCellIndex = lineCellIndices[0];
        const terminalCellIndex = lineCellIndices[lineCellIndices.length - 1];
        const sourcePoint = pointFromIndex(sourceCellIndex, context.width);
        const mouthPoint = pointFromIndex(terminalCellIndex, context.width);
        const linePoints = lineCellIndices.map((cellIndex) => pointFromIndex(cellIndex, context.width));
        const normalizedLinePoints = linePoints.map((point) => ({
            x: roundFieldValue(point.x / Math.max(1, context.width - 1)),
            y: roundFieldValue(point.y / Math.max(1, context.height - 1))
        }));
        const associatedFeatureTags = findAssociatedFeatureTags(lineCellIndices, watershedFeatureTags);
        const watershedStats = getWatershedCellStats(watershed, context.flowAccumulationField);
        const rawDischarge = Number(context.rawAccumulationValues[terminalCellIndex]) || 0;
        const normalizedDischarge = clampUnitInterval(context.accumulationValues[terminalCellIndex], 0);
        const elevationDrop = Math.max(0, clampUnitInterval(context.elevationValues[sourceCellIndex], 0) - clampUnitInterval(context.elevationValues[terminalCellIndex], 0));
        const meanSlope = roundFieldValue(
            lineCellIndices.reduce((total, cellIndex) => total + clampUnitInterval(context.slopeValues[cellIndex], 0), 0)
            / Math.max(1, lineCellIndices.length)
        );
        const lineLengthScore = clampUnitInterval(lineCellIndices.length / Math.max(1, Math.sqrt(cells.length) * 2));
        const basinScaleScore = clampUnitInterval(rawDischarge / Math.max(1, cells.length));
        const featureSupportScore = associatedFeatureTags.reduce((maxValue, featureTag) => (
            Math.max(maxValue, clampUnitInterval(featureTag.strength, 0))
        ), 0);
        const candidateScore = clampUnitInterval(
            (normalizedDischarge * 0.46)
                + (basinScaleScore * 0.22)
                + (lineLengthScore * 0.2)
                + (featureSupportScore * 0.08)
                + (elevationDrop * 0.04)
        );
        const terminalWaterHint = isPlainObject(watershed.terminalWaterHint) ? watershed.terminalWaterHint : {};
        const recordTerminalWaterHint = isPlainObject(recordLink.terminalWaterHint)
            ? recordLink.terminalWaterHint
            : {};
        const terminalSeaRegionIds = Array.from(new Set(normalizeStringList(
            Array.isArray(terminalWaterHint.terminalSeaRegionIds) && terminalWaterHint.terminalSeaRegionIds.length
                ? terminalWaterHint.terminalSeaRegionIds
                : [
                    terminalWaterHint.seaRegionId,
                    terminalWaterHint.seaRegionClusterId,
                    recordTerminalWaterHint.seaRegionId,
                    recordTerminalWaterHint.seaRegionClusterId
                ]
        )));
        const riverBasinIdHint = normalizeString(
            recordLink.riverBasinId,
            normalizeString(watershed.recordDraft && watershed.recordDraft.riverBasinId, '')
        );

        return {
            majorRiverCandidateId: createMajorRiverCandidateId(sequence),
            stageId: MAJOR_RIVER_EXTRACTION_STAGE_ID,
            lineType: 'mainstem_candidate',
            lineEncoding: 'rowMajorCellPathSourceToMouth',
            watershedId: normalizeString(watershed.watershedId, ''),
            riverBasinIdHint,
            basinType: normalizeString(watershed.recordDraft && watershed.recordDraft.basinType, ''),
            sourceAssignmentId: normalizeString(watershed.sourceAssignmentId, ''),
            terminalMode: resolveTerminalMode(watershed),
            terminalSeaRegionIds,
            sourceCellIndex,
            mouthCellIndex: terminalCellIndex,
            sourcePoint,
            mouthPoint,
            lineCellIndices,
            linePoints,
            normalizedLinePoints,
            lineCellCount: lineCellIndices.length,
            lineLengthCells: calculateLineLengthCells(lineCellIndices, context),
            rawDischarge,
            normalizedDischarge: roundFieldValue(normalizedDischarge),
            catchmentCellCount: cells.length,
            basinScaleScore: roundFieldValue(basinScaleScore),
            lineLengthScore: roundFieldValue(lineLengthScore),
            candidateScore: roundFieldValue(candidateScore),
            elevationDrop: roundFieldValue(elevationDrop),
            meanSlope,
            associatedFeatureTags,
            watershedAccumulationSummary: cloneValue(watershedStats),
            recordLink: {
                riverBasinId: riverBasinIdHint,
                watershedId: normalizeString(watershed.watershedId, ''),
                recordValidation: cloneValue(recordLink.recordValidation || {}),
                climateLinkageStatus: normalizeString(recordLink.climateLinkageStatus, 'pending'),
                sourceMountainLinkageStatus: normalizeString(recordLink.sourceMountainLinkageStatus, 'pending')
            },
            compatibility: {
                futureRiverBasinRecordLinkageInput: true,
                futureMajorRiverReviewInput: true,
                recordShapeMutation: false,
                riverRoutingGraphOutput: false,
                localRiverPlacementOutput: false,
                settlementLogicOutput: false,
                gameplaySemanticOutput: false
            }
        };
    }

    function summarizeMajorRiverCandidates(majorRiverCandidates = []) {
        const linkedRiverBasinCount = majorRiverCandidates.filter((candidate) => candidate.riverBasinIdHint).length;
        const terminalWaterRiverCount = majorRiverCandidates.filter((candidate) => candidate.terminalMode === 'terminal_water').length;
        const internalSinkRiverCount = majorRiverCandidates.filter((candidate) => candidate.terminalMode === 'internal_sink').length;
        const totalLineCellCount = majorRiverCandidates.reduce((total, candidate) => total + candidate.lineCellCount, 0);
        const candidateScoreStats = buildFieldStats(majorRiverCandidates.map((candidate) => candidate.candidateScore));
        const dischargeStats = buildFieldStats(majorRiverCandidates.map((candidate) => candidate.normalizedDischarge));

        return {
            majorRiverCandidateCount: majorRiverCandidates.length,
            linkedRiverBasinCount,
            terminalWaterRiverCount,
            internalSinkRiverCount,
            totalLineCellCount,
            meanLineCellCount: roundFieldValue(totalLineCellCount / Math.max(1, majorRiverCandidates.length)),
            candidateScoreStats,
            normalizedDischargeStats: dischargeStats
        };
    }

    function createRiverBasinRecordFromWatershed(watershed = {}, sequence = 1) {
        const draft = isPlainObject(watershed.recordDraft) ? watershed.recordDraft : {};
        const reliefRegionIds = normalizeStringList(draft.reliefRegionIds && draft.reliefRegionIds.length
            ? draft.reliefRegionIds
            : watershed.reliefRegionIds);
        const climateBandIds = normalizeStringList(draft.climateBandIds);
        const terminalSeaRegionIds = normalizeStringList(
            draft.terminalSeaRegionIds && draft.terminalSeaRegionIds.length
                ? draft.terminalSeaRegionIds
                : watershed.terminalWaterHint && watershed.terminalWaterHint.terminalSeaRegionIds
        );
        const primaryReliefRegionId = normalizeString(
            draft.primaryReliefRegionId,
            normalizeString(watershed.primaryReliefRegionId, reliefRegionIds[0] || '')
        );
        const primaryClimateBandId = normalizeString(draft.primaryClimateBandId, climateBandIds[0] || '');
        const normalizedRecordInput = {
            riverBasinId: normalizeString(draft.riverBasinId, createRiverBasinId(sequence)),
            basinType: normalizeString(draft.basinType, 'internal_unresolved'),
            sourceMountainSystemIds: normalizeStringList(draft.sourceMountainSystemIds),
            reliefRegionIds,
            climateBandIds,
            terminalSeaRegionIds,
            primaryReliefRegionId,
            primaryClimateBandId,
            catchmentScale: clampUnitInterval(draft.catchmentScale, clampUnitInterval(watershed.normalizedArea, 0)),
            basinContinuity: clampUnitInterval(draft.basinContinuity, clampUnitInterval(watershed.compactness, 0))
        };

        return typeof macro.createRiverBasinRecordSkeleton === 'function'
            ? macro.createRiverBasinRecordSkeleton(normalizedRecordInput)
            : normalizedRecordInput;
    }

    function validateRiverBasinRecordOutput(record) {
        if (typeof macro.validateRiverBasinRecord === 'function') {
            return macro.validateRiverBasinRecord(record);
        }

        const errors = [];
        if (!normalizeString(record.riverBasinId, '')) {
            errors.push('Missing riverBasinId.');
        }
        if (!normalizeString(record.basinType, '')) {
            errors.push('Missing basinType.');
        }
        if (!normalizeString(record.primaryReliefRegionId, '')) {
            errors.push('Missing primaryReliefRegionId.');
        }
        if (!Array.isArray(record.reliefRegionIds) || !record.reliefRegionIds.length) {
            errors.push('Missing reliefRegionIds.');
        }

        return {
            contractId: 'riverBasinRecord',
            isValid: errors.length === 0,
            errors
        };
    }

    function isDeltaLakeMarshTaggingPayload(value) {
        return isPlainObject(value) && Array.isArray(value.featureTags);
    }

    function resolveDeltaLakeMarshTagging(input = {}, fallbackOutput = null, fallbackDownhillFlowRoutingOutput = null, fallbackFlowAccumulationOutput = null) {
        if (isDeltaLakeMarshTaggingPayload(fallbackOutput)) {
            return fallbackOutput;
        }

        if (isPlainObject(fallbackOutput) && isDeltaLakeMarshTaggingPayload(fallbackOutput.deltaLakeMarshTagging)) {
            return fallbackOutput.deltaLakeMarshTagging;
        }

        const containers = buildDependencyContainers(input);
        const existingOutput = findDependencyValue(containers.intermediateOutputs, DELTA_LAKE_MARSH_TAGGING_ID);
        if (isDeltaLakeMarshTaggingPayload(existingOutput)) {
            return existingOutput;
        }

        return materializeDeltaLakeMarshTagging(
            input,
            fallbackDownhillFlowRoutingOutput,
            fallbackFlowAccumulationOutput
        ).deltaLakeMarshTagging;
    }

    function materializeDeltaLakeMarshTagging(input = {}, fallbackDownhillFlowRoutingOutput = null, fallbackFlowAccumulationOutput = null) {
        const context = createHydrologyTaggingContext(
            input,
            fallbackDownhillFlowRoutingOutput,
            fallbackFlowAccumulationOutput
        );
        const normalizedInput = context.normalizedInput;
        const watershedSegmentation = context.watershedSegmentation;
        const watersheds = Array.isArray(watershedSegmentation.watersheds)
            ? watershedSegmentation.watersheds.slice().sort((left, right) => (
                normalizeString(left.watershedId, '').localeCompare(normalizeString(right.watershedId, ''))
            ))
            : [];
        const taggingNamespace = buildNamespace(PIPELINE_STEP_ID, 'deltaLakeMarshTagging');
        const taggingSeed = deriveSubSeed(normalizedInput.macroSeed, taggingNamespace);
        const featureTags = [];

        watersheds.forEach((watershed, index) => {
            const sequence = index + 1;
            const occupiedCells = new Set();
            const deltaCells = selectDeltaCells(watershed, context, taggingSeed);

            if (deltaCells.length) {
                deltaCells.forEach((cellIndex) => occupiedCells.add(cellIndex));
                featureTags.push(createHydrologyFeatureTag(
                    'delta',
                    watershed,
                    deltaCells,
                    context,
                    sequence,
                    {
                        selectionModel: 'terminalWaterHighAccumulationAdjacencyV1',
                        terminalMode: resolveTerminalMode(watershed),
                        strength: summarizeFeatureCells(deltaCells, context).meanAccumulation,
                        confidence: 0.62 + Math.min(0.28, deltaCells.length / 20)
                    }
                ));
            }

            const lakeCells = selectLakeCells(watershed, context, taggingSeed);
            if (lakeCells.length) {
                lakeCells.forEach((cellIndex) => occupiedCells.add(cellIndex));
                const lakeSummary = summarizeFeatureCells(lakeCells, context);
                featureTags.push(createHydrologyFeatureTag(
                    'lake',
                    watershed,
                    lakeCells,
                    context,
                    sequence,
                    {
                        selectionModel: 'internalSinkAndBasinDepressionV1',
                        terminalMode: resolveTerminalMode(watershed),
                        strength: (lakeSummary.meanBasinDepression * 0.55)
                            + ((1 - lakeSummary.meanElevation) * 0.25)
                            + (lakeSummary.meanAccumulation * 0.2),
                        confidence: 0.55 + Math.min(0.3, lakeCells.length / 18)
                    }
                ));
            }

            const marshCells = selectMarshCells(watershed, context, occupiedCells, taggingSeed);
            if (marshCells.length) {
                const marshSummary = summarizeFeatureCells(marshCells, context);
                featureTags.push(createHydrologyFeatureTag(
                    'marsh',
                    watershed,
                    marshCells,
                    context,
                    sequence,
                    {
                        selectionModel: 'lowSlopeWetlandRetentionV1',
                        terminalMode: resolveTerminalMode(watershed),
                        strength: ((1 - marshSummary.meanSlope) * 0.35)
                            + (marshSummary.meanBasinDepression * 0.3)
                            + (marshSummary.meanAccumulation * 0.2)
                            + ((marshSummary.adjacentWaterCellCount / Math.max(1, marshCells.length)) * 0.15),
                        confidence: 0.5 + Math.min(0.28, marshCells.length / 20)
                    }
                ));
            }
        });

        const summary = summarizeDeltaLakeMarshTags(featureTags, watersheds);

        return {
            deltaLakeMarshTagging: {
                deltaLakeMarshTaggingId: DELTA_LAKE_MARSH_TAGGING_ID,
                stageId: DELTA_LAKE_MARSH_TAGGING_STAGE_ID,
                sourceFieldIds: [
                    context.flowAccumulationField.fieldId || FLOW_ACCUMULATION_FIELD_ID,
                    'seaLevelAppliedElevationField',
                    'landmassCleanupMaskField',
                    ...(context.sourceInputs.basinDepressionField ? ['basinDepressionField'] : []),
                    ...(context.sourceInputs.mountainAmplificationField ? ['mountainAmplificationField'] : []),
                    ...(context.sourceInputs.plateauCandidateField ? ['plateauCandidateField'] : [])
                ],
                sourceOutputIds: [
                    context.downhillFlowRouting.downhillFlowRoutingId || DOWNHILL_FLOW_ROUTING_STAGE_ID,
                    context.flowAccumulationField.fieldId || FLOW_ACCUMULATION_FIELD_ID,
                    watershedSegmentation.watershedSegmentationId || 'watershedSegmentation'
                ],
                worldBounds: cloneValue(context.worldBounds),
                seedNamespace: taggingNamespace,
                seed: taggingSeed,
                taggingModel: 'deterministicDeltaLakeMarshTaggingV1',
                featureTypes: ['delta', 'lake', 'marsh'],
                featureTags,
                downstreamSummary: {
                    ...cloneValue(summary),
                    summaryConsumers: [
                        'futureRiverBasinSummaryEnrichment',
                        'futureClimateBlend',
                        'futureHydrologyReview'
                    ],
                    recordShapeMutation: false,
                    biomeOutput: false,
                    gameplayResourceOutput: false
                },
                summary,
                compatibility: {
                    futureRiverBasinSummaryInput: true,
                    futureClimateBlendInput: true,
                    futureMajorRiverContextInput: true,
                    macroGeographyPackageRecordInput: false,
                    biomeOutput: false,
                    gameplayResourceOutput: false,
                    sameWorldBoundsRequired: true
                },
                intentionallyAbsent: [
                    'majorRiverExtraction',
                    'riverRoutingGraph',
                    'finalRiverDeltaSystems',
                    'lakeHydrologySimulation',
                    'marshBiomeConstruction',
                    'biomes',
                    'gameplayResources',
                    'climateBlend',
                    'fullPackageAssembly',
                    'localRiverPlacement',
                    'settlementLogic',
                    'terrainCells',
                    'gameplaySemantics'
                ]
            }
        };
    }

    function isMajorRiverCandidatesPayload(value) {
        return isPlainObject(value) && Array.isArray(value.majorRiverCandidates);
    }

    function resolveMajorRiverCandidates(input = {}, fallbackOutput = null, fallbackDownhillFlowRoutingOutput = null, fallbackFlowAccumulationOutput = null, fallbackDeltaLakeMarshTaggingOutput = null, fallbackRiverBasinRecordOutput = null) {
        if (isMajorRiverCandidatesPayload(fallbackOutput)) {
            return fallbackOutput;
        }

        if (isPlainObject(fallbackOutput) && isMajorRiverCandidatesPayload(fallbackOutput.majorRiverCandidatesOutput)) {
            return fallbackOutput.majorRiverCandidatesOutput;
        }

        const containers = buildDependencyContainers(input);
        const existingOutput = findDependencyValue(containers.intermediateOutputs, MAJOR_RIVER_CANDIDATES_ID);
        if (isMajorRiverCandidatesPayload(existingOutput)) {
            return existingOutput;
        }

        return materializeMajorRiverCandidates(
            input,
            fallbackDownhillFlowRoutingOutput,
            fallbackFlowAccumulationOutput,
            fallbackDeltaLakeMarshTaggingOutput,
            fallbackRiverBasinRecordOutput
        ).majorRiverCandidatesOutput;
    }

    function materializeMajorRiverCandidates(input = {}, fallbackDownhillFlowRoutingOutput = null, fallbackFlowAccumulationOutput = null, fallbackDeltaLakeMarshTaggingOutput = null, fallbackRiverBasinRecordOutput = null) {
        const context = createHydrologyTaggingContext(
            input,
            fallbackDownhillFlowRoutingOutput,
            fallbackFlowAccumulationOutput
        );
        const normalizedInput = context.normalizedInput;
        const watershedSegmentation = context.watershedSegmentation;
        const watersheds = Array.isArray(watershedSegmentation.watersheds)
            ? watershedSegmentation.watersheds.slice().sort((left, right) => (
                normalizeString(left.watershedId, '').localeCompare(normalizeString(right.watershedId, ''))
            ))
            : [];
        const extractionNamespace = buildNamespace(PIPELINE_STEP_ID, 'majorRiverCandidates');
        const extractionSeed = deriveSubSeed(normalizedInput.macroSeed, extractionNamespace);
        const deltaLakeMarshTagging = resolveDeltaLakeMarshTagging(
            input,
            fallbackDeltaLakeMarshTaggingOutput,
            context.downhillFlowRouting,
            context.flowAccumulationField
        );
        const riverBasinRecordOutput = isPlainObject(fallbackRiverBasinRecordOutput)
            ? fallbackRiverBasinRecordOutput
            : materializeRiverBasinRecordOutput(input, context.flowAccumulationField).riverBasinRecordOutput;
        const upstreamLookup = buildUpstreamLookup(context);
        const watershedLookup = buildWatershedLookup(watershedSegmentation);
        const recordLinkLookup = buildRecordLinkLookup(riverBasinRecordOutput);
        const featureTagLookup = buildFeatureTagLookup(deltaLakeMarshTagging);
        const majorRiverCandidates = [];

        watersheds.forEach((watershed) => {
            const candidate = createMajorRiverCandidate(
                watershed,
                majorRiverCandidates.length + 1,
                context,
                upstreamLookup,
                watershedLookup,
                recordLinkLookup.get(normalizeString(watershed.watershedId, '')) || {},
                featureTagLookup.get(normalizeString(watershed.watershedId, '')) || [],
                extractionSeed
            );

            if (candidate) {
                majorRiverCandidates.push(candidate);
            }
        });

        const summary = summarizeMajorRiverCandidates(majorRiverCandidates);

        return {
            majorRiverCandidatesOutput: {
                majorRiverCandidatesId: MAJOR_RIVER_CANDIDATES_ID,
                stageId: MAJOR_RIVER_EXTRACTION_STAGE_ID,
                sourceFieldIds: [
                    context.flowAccumulationField.fieldId || FLOW_ACCUMULATION_FIELD_ID,
                    'seaLevelAppliedElevationField',
                    'landmassCleanupMaskField'
                ],
                sourceOutputIds: [
                    context.downhillFlowRouting.downhillFlowRoutingId || DOWNHILL_FLOW_ROUTING_STAGE_ID,
                    context.flowAccumulationField.fieldId || FLOW_ACCUMULATION_FIELD_ID,
                    watershedSegmentation.watershedSegmentationId || 'watershedSegmentation',
                    deltaLakeMarshTagging.deltaLakeMarshTaggingId || DELTA_LAKE_MARSH_TAGGING_ID,
                    riverBasinRecordOutput.riverBasinRecordOutputId || RIVER_BASIN_RECORD_OUTPUT_ID
                ],
                worldBounds: cloneValue(context.worldBounds),
                seedNamespace: extractionNamespace,
                seed: extractionSeed,
                extractionModel: 'deterministicMainstemFromAccumulationWatershedV1',
                lineEncoding: 'rowMajorCellPathSourceToMouth',
                majorRiverCandidates,
                summary,
                compatibility: {
                    futureRiverBasinRecordLinkageInput: true,
                    futureMajorRiverReviewInput: true,
                    riverRoutingGraphOutput: false,
                    localRiverPlacementOutput: false,
                    settlementLogicOutput: false,
                    terrainCellsOutput: false,
                    gameplaySemanticsOutput: false,
                    sameWorldBoundsRequired: true
                },
                intentionallyAbsent: [
                    'riverRoutingGraph',
                    'localRiverPlacement',
                    'settlementLogic',
                    'terrainCells',
                    'gameplaySemantics'
                ]
            }
        };
    }

    function materializeRiverBasinRecordOutput(input = {}, fallbackFlowAccumulationOutput = null) {
        const normalizedInput = normalizeInput(input);
        const sourceInputs = getSourceInputs(input);
        const flowAccumulationField = resolveFlowAccumulationField(input, fallbackFlowAccumulationOutput);
        const watershedSegmentation = resolveWatershedSegmentation(input, sourceInputs.watershedSegmentation);
        const worldBounds = normalizeWorldBounds(
            watershedSegmentation.worldBounds
                || flowAccumulationField.worldBounds
                || normalizedInput.worldBounds
        );
        const recordNamespace = buildNamespace(PIPELINE_STEP_ID, 'riverBasins');
        const recordSeed = deriveSubSeed(normalizedInput.macroSeed, recordNamespace);
        const watersheds = Array.isArray(watershedSegmentation.watersheds)
            ? watershedSegmentation.watersheds.slice()
            : [];
        const riverBasins = [];
        const recordLinks = [];
        const deferredRiverBasinDrafts = [];
        let climatePendingCount = 0;
        let reliefPendingCount = 0;

        watersheds
            .sort((left, right) => normalizeString(left.watershedId, '').localeCompare(normalizeString(right.watershedId, '')))
            .forEach((watershed, index) => {
                const sequence = index + 1;
                const record = createRiverBasinRecordFromWatershed(watershed, sequence);
                const validation = validateRiverBasinRecordOutput(record);
                const pendingRecordFields = normalizeStringList(watershed.pendingRecordFields);
                const accumulationSummary = getWatershedCellStats(watershed, flowAccumulationField);
                const recordLink = {
                    riverBasinId: record.riverBasinId,
                    watershedId: normalizeString(watershed.watershedId, ''),
                    sourceAssignmentId: normalizeString(watershed.sourceAssignmentId, ''),
                    pendingRecordFields,
                    terminalWaterHint: cloneValue(watershed.terminalWaterHint || {}),
                    headwaterHint: cloneValue(watershed.headwaterHint || {}),
                    accumulationSummary,
                    climateLinkageStatus: record.climateBandIds.length ? 'linked' : 'pending',
                    sourceMountainLinkageStatus: record.sourceMountainSystemIds.length ? 'linked' : 'pending',
                    recordValidation: cloneValue(validation)
                };

                if (!record.climateBandIds.length || !record.primaryClimateBandId) {
                    climatePendingCount += 1;
                }
                if (!record.reliefRegionIds.length || !record.primaryReliefRegionId) {
                    reliefPendingCount += 1;
                }

                if (validation.isValid) {
                    riverBasins.push(record);
                    recordLinks.push(recordLink);
                    return;
                }

                deferredRiverBasinDrafts.push({
                    watershedId: normalizeString(watershed.watershedId, ''),
                    recordDraft: cloneValue(record),
                    pendingRecordFields,
                    validation: cloneValue(validation)
                });
            });

        return {
            riverBasinRecordOutput: {
                riverBasinRecordOutputId: RIVER_BASIN_RECORD_OUTPUT_ID,
                stageId: RIVER_BASIN_RECORD_STAGE_ID,
                recordSetId: 'riverBasins',
                recordContract: 'RiverBasinRecord',
                sourceFieldIds: [
                    flowAccumulationField.fieldId || FLOW_ACCUMULATION_FIELD_ID
                ],
                sourceOutputIds: [
                    watershedSegmentation.watershedSegmentationId || 'watershedSegmentation',
                    flowAccumulationField.fieldId || FLOW_ACCUMULATION_FIELD_ID
                ],
                worldBounds: cloneValue(worldBounds),
                seedNamespace: recordNamespace,
                seed: recordSeed,
                materializationModel: 'deterministicWatershedDraftToRiverBasinRecordV1',
                riverBasins,
                recordLinks,
                deferredRiverBasinDrafts,
                summary: {
                    watershedCount: watersheds.length,
                    exportedRecordCount: riverBasins.length,
                    deferredDraftCount: deferredRiverBasinDrafts.length,
                    climatePendingCount,
                    reliefPendingCount
                },
                compatibility: {
                    macroGeographyPackageRecordInput: true,
                    hydrologyStageRecordOutput: true,
                    climateLinkageMayBePending: true,
                    futureClimateBlendInput: true,
                    futureMajorRiverLinkageInput: true,
                    fullPackageAssemblyOutput: false
                },
                intentionallyAbsent: [
                    'climateBlend',
                    'fullPackageAssembly',
                    'localRiverPlacement',
                    'settlementLogic',
                    'terrainCells',
                    'gameplaySemantics'
                ]
            }
        };
    }

    function clampGridCoordinate(value, size) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue) || size <= 0) {
            return 0;
        }

        return Math.max(0, Math.min(size - 1, Math.floor(numericValue)));
    }

    function createSerializedScalarFieldDebugAdapter(serializedField = {}, fallbackFieldId = 'scalarField') {
        const fieldId = normalizeString(serializedField.fieldId, fallbackFieldId);
        const width = normalizeInteger(serializedField.width, 0);
        const height = normalizeInteger(serializedField.height, 0);
        const size = normalizeInteger(serializedField.size, width * height);
        const values = Array.isArray(serializedField.values)
            ? serializedField.values.slice(0, size)
            : new Array(size).fill(0);
        while (values.length < size) {
            values.push(0);
        }
        const range = Array.isArray(serializedField.range)
            ? serializedField.range.slice(0, 2)
            : [0, 1];

        return {
            type: 'ScalarField',
            fieldId,
            width,
            height,
            size,
            values,
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

    function buildFallbackScalarFieldSnapshot(field, options = {}) {
        const descriptor = typeof field.describe === 'function' ? field.describe() : {};
        const values = Array.isArray(field.values) ? field.values.slice() : [];

        return {
            artifactId: normalizeString(options.artifactId, `${field.fieldId}.scalarHeatmap`),
            artifactKind: 'fieldSnapshot',
            registryId: 'fieldDebugRegistry',
            stageId: normalizeString(options.stageId, ''),
            sourceLayerId: normalizeString(options.sourceLayerId, field.fieldId),
            payload: {
                snapshotType: 'scalarHeatmap',
                fieldId: field.fieldId,
                width: descriptor.width || field.width,
                height: descriptor.height || field.height,
                range: Array.isArray(descriptor.range) ? descriptor.range.slice(0, 2) : [0, 1],
                valueEncoding: DEFAULT_FIELD_VALUE_ENCODING,
                values,
                stats: buildFieldStats(values)
            }
        };
    }

    function buildScalarFieldSnapshot(field, options = {}) {
        if (typeof macro.buildFieldDebugArtifact === 'function') {
            return macro.buildFieldDebugArtifact(field, {
                layerId: 'scalarHeatmap',
                ...options
            });
        }

        return buildFallbackScalarFieldSnapshot(field, options);
    }

    function createWatershedMaskField(watershedSegmentation = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedBounds = normalizeWorldBounds(worldBounds);
        const size = normalizedBounds.width * normalizedBounds.height;
        const values = new Array(size).fill(0);
        const watersheds = Array.isArray(watershedSegmentation.watersheds)
            ? watershedSegmentation.watersheds.slice()
            : [];
        watersheds
            .sort((left, right) => normalizeString(left.watershedId, '').localeCompare(normalizeString(right.watershedId, '')))
            .forEach((watershed, index) => {
                const encodedValue = roundFieldValue((index + 1) / Math.max(1, watersheds.length));
                (Array.isArray(watershed.cellIndices) ? watershed.cellIndices : []).forEach((cellIndex) => {
                    const normalizedCellIndex = Number(cellIndex);
                    if (Number.isInteger(normalizedCellIndex) && normalizedCellIndex >= 0 && normalizedCellIndex < size) {
                        values[normalizedCellIndex] = encodedValue;
                    }
                });
            });

        return createSerializedScalarFieldDebugAdapter({
            fieldId: WATERSHED_DEBUG_MASK_FIELD_ID,
            width: normalizedBounds.width,
            height: normalizedBounds.height,
            size,
            range: [0, 1],
            values
        }, WATERSHED_DEBUG_MASK_FIELD_ID);
    }

    function createRiverBasinRecordMaskField(riverBasinRecordOutput = {}, watershedSegmentation = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedBounds = normalizeWorldBounds(worldBounds);
        const size = normalizedBounds.width * normalizedBounds.height;
        const values = new Array(size).fill(0);
        const records = Array.isArray(riverBasinRecordOutput.riverBasins)
            ? riverBasinRecordOutput.riverBasins
            : [];
        const linksByWatershedId = new Map(
            (Array.isArray(riverBasinRecordOutput.recordLinks) ? riverBasinRecordOutput.recordLinks : [])
                .map((link) => [normalizeString(link.watershedId, ''), link])
        );
        const recordOrder = new Map(records.map((record, index) => [normalizeString(record.riverBasinId, ''), index + 1]));
        const watersheds = Array.isArray(watershedSegmentation.watersheds)
            ? watershedSegmentation.watersheds
            : [];

        watersheds.forEach((watershed) => {
            const link = linksByWatershedId.get(normalizeString(watershed.watershedId, ''));
            const encodedIndex = link ? recordOrder.get(normalizeString(link.riverBasinId, '')) : 0;
            if (!encodedIndex) {
                return;
            }

            const encodedValue = roundFieldValue(encodedIndex / Math.max(1, records.length));
            (Array.isArray(watershed.cellIndices) ? watershed.cellIndices : []).forEach((cellIndex) => {
                const normalizedCellIndex = Number(cellIndex);
                if (Number.isInteger(normalizedCellIndex) && normalizedCellIndex >= 0 && normalizedCellIndex < size) {
                    values[normalizedCellIndex] = encodedValue;
                }
            });
        });

        return createSerializedScalarFieldDebugAdapter({
            fieldId: RIVER_BASIN_DEBUG_MASK_FIELD_ID,
            width: normalizedBounds.width,
            height: normalizedBounds.height,
            size,
            range: [0, 1],
            values
        }, RIVER_BASIN_DEBUG_MASK_FIELD_ID);
    }

    function materializeHydrologyDebugExport(input = {}, resolvedOutputs = {}) {
        const normalizedInput = normalizeInput(input);
        const flowAccumulationField = resolveFlowAccumulationField(input, resolvedOutputs.flowAccumulationField);
        const watershedSegmentation = resolveWatershedSegmentation(input, resolvedOutputs.watershedSegmentation);
        const riverBasinRecordOutput = isPlainObject(resolvedOutputs.riverBasinRecordOutput)
            ? resolvedOutputs.riverBasinRecordOutput
            : materializeRiverBasinRecordOutput(input, flowAccumulationField).riverBasinRecordOutput;
        const deltaLakeMarshTagging = isPlainObject(resolvedOutputs.deltaLakeMarshTagging)
            ? resolvedOutputs.deltaLakeMarshTagging
            : resolveDeltaLakeMarshTagging(input, null, null, flowAccumulationField);
        const majorRiverCandidatesOutput = isPlainObject(resolvedOutputs.majorRiverCandidatesOutput)
            ? resolvedOutputs.majorRiverCandidatesOutput
            : resolveMajorRiverCandidates(
                input,
                null,
                null,
                flowAccumulationField,
                deltaLakeMarshTagging,
                riverBasinRecordOutput
            );
        const worldBounds = normalizeWorldBounds(
            riverBasinRecordOutput.worldBounds
                || watershedSegmentation.worldBounds
                || flowAccumulationField.worldBounds
                || normalizedInput.worldBounds
        );
        const flowFieldAdapter = createSerializedScalarFieldDebugAdapter(flowAccumulationField, FLOW_ACCUMULATION_FIELD_ID);
        const watershedMaskField = createWatershedMaskField(watershedSegmentation, worldBounds);
        const riverBasinMaskField = createRiverBasinRecordMaskField(riverBasinRecordOutput, watershedSegmentation, worldBounds);
        const fieldSnapshots = [
            buildScalarFieldSnapshot(flowFieldAdapter, {
                artifactId: 'riverSystem.flowAccumulationField.scalarHeatmap',
                stageId: FLOW_ACCUMULATION_STAGE_ID,
                sourceLayerId: FLOW_ACCUMULATION_FIELD_ID
            }),
            buildScalarFieldSnapshot(watershedMaskField, {
                artifactId: 'riverSystem.watershedSegmentationMaskField.scalarHeatmap',
                stageId: 'watershedSegmentation',
                sourceLayerId: 'watershedSegmentation'
            }),
            buildScalarFieldSnapshot(riverBasinMaskField, {
                artifactId: 'riverSystem.riverBasinRecordMaskField.scalarHeatmap',
                stageId: RIVER_BASIN_RECORD_STAGE_ID,
                sourceLayerId: 'riverBasins'
            })
        ];

        return {
            hydrologyDebugExport: {
                artifactId: 'riverSystem.hydrologyDebugExport',
                artifactKind: HYDROLOGY_DEBUG_EXPORT_ID,
                stageId: HYDROLOGY_DEBUG_STAGE_ID,
                registryId: 'fieldDebugRegistry',
                worldBounds: cloneValue(worldBounds),
                sourceFieldIds: [
                    flowAccumulationField.fieldId || FLOW_ACCUMULATION_FIELD_ID,
                    WATERSHED_DEBUG_MASK_FIELD_ID,
                    RIVER_BASIN_DEBUG_MASK_FIELD_ID
                ],
                sourceOutputIds: [
                    DOWNHILL_FLOW_ROUTING_STAGE_ID,
                    FLOW_ACCUMULATION_FIELD_ID,
                    'watershedSegmentation',
                    DELTA_LAKE_MARSH_TAGGING_ID,
                    MAJOR_RIVER_CANDIDATES_ID,
                    RIVER_BASIN_RECORD_OUTPUT_ID
                ],
                fieldSnapshots,
                summaries: {
                    flowAccumulation: cloneValue(flowAccumulationField.summary || {}),
                    watershedSegmentation: cloneValue(watershedSegmentation.summary || {}),
                    deltaLakeMarshTagging: cloneValue(deltaLakeMarshTagging.summary || {}),
                    majorRiverCandidates: cloneValue(majorRiverCandidatesOutput.summary || {}),
                    riverBasinRecords: cloneValue(riverBasinRecordOutput.summary || {})
                },
                compatibility: {
                    uiFreeDebugExport: true,
                    fullDebugBundleOutput: false,
                    futureHydrologyPanelInput: true
                },
                intentionallyAbsent: [
                    'debugPanel',
                    'fullPhysicalWorldDebugBundle',
                    'climateBlend',
                    'fullPackageAssembly',
                    'localRiverPlacement',
                    'settlementLogic',
                    'gameplaySemantics'
                ]
            }
        };
    }

    function materializeDownhillFlowRouting(input = {}) {
        const normalizedInput = normalizeInput(input);
        const sourceInputs = getSourceInputs(input);
        const elevationField = normalizeSerializedField(
            sourceInputs.seaLevelAppliedElevationField,
            normalizedInput.worldBounds,
            0
        );
        const worldBounds = normalizeWorldBounds({
            width: elevationField.width,
            height: elevationField.height
        });
        const landMaskField = normalizeSerializedField(
            sourceInputs.landmassCleanupMaskField,
            worldBounds,
            0
        );
        const width = worldBounds.width;
        const height = worldBounds.height;
        const size = width * height;
        const landThreshold = clampUnitInterval(landMaskField.threshold, DEFAULT_LAND_THRESHOLD);
        const landCells = landMaskField.values.map((value) => value >= landThreshold);
        const landCellCount = landCells.filter(Boolean).length;
        const routingNamespace = buildNamespace(PIPELINE_STEP_ID, 'riverRouting');
        const routingSeed = deriveSubSeed(normalizedInput.macroSeed, routingNamespace);
        const watershedSegmentation = isPlainObject(sourceInputs.watershedSegmentation)
            ? sourceInputs.watershedSegmentation
            : {};
        const watershedLookup = buildWatershedLookup(watershedSegmentation);
        const downstreamIndices = new Array(size).fill(NO_DOWNSTREAM_INDEX);
        const flowDirectionCodes = new Array(size).fill(0);
        const dropValues = new Array(size).fill(0);
        const slopeValues = new Array(size).fill(0);
        let routedLandCellCount = 0;
        let sinkCellCount = 0;
        let terminalWaterStepCount = 0;
        let assignedWatershedCellCount = 0;

        for (let index = 0; index < size; index += 1) {
            if (!landCells[index]) {
                continue;
            }

            if (watershedLookup.has(index)) {
                assignedWatershedCellCount += 1;
            }

            const bestNeighbor = findBestDownhillNeighbor(index, {
                width,
                height,
                elevationValues: elevationField.values,
                landCells
            }, routingSeed);

            if (!bestNeighbor) {
                sinkCellCount += 1;
                continue;
            }

            downstreamIndices[index] = bestNeighbor.index;
            flowDirectionCodes[index] = bestNeighbor.direction.code;
            dropValues[index] = roundFieldValue(bestNeighbor.drop);
            slopeValues[index] = roundFieldValue(bestNeighbor.slope);
            routedLandCellCount += 1;

            if (bestNeighbor.isTerminalWaterStep) {
                terminalWaterStepCount += 1;
            }
        }

        const watershedRoutingSummaries = summarizeWatershedRouting(
            watershedSegmentation,
            {
                downstreamIndices,
                dropValues,
                slopeValues,
                landCells
            },
            worldBounds
        );

        return {
            downhillFlowRouting: {
                downhillFlowRoutingId: DOWNHILL_FLOW_ROUTING_STAGE_ID,
                stageId: DOWNHILL_FLOW_ROUTING_STAGE_ID,
                sourceFieldIds: [
                    elevationField.fieldId,
                    landMaskField.fieldId
                ],
                sourceOutputIds: sourceInputs.watershedSegmentation ? ['watershedSegmentation'] : [],
                worldBounds: cloneValue(worldBounds),
                seedNamespace: routingNamespace,
                seed: routingSeed,
                routingModel: 'deterministicSteepestDescentEightNeighborV1',
                neighborModel: 'eightNeighborStrictDownhill',
                valueEncoding: DEFAULT_FIELD_VALUE_ENCODING,
                noDownstreamIndex: NO_DOWNSTREAM_INDEX,
                landThreshold,
                flowDirectionEncoding: buildFlowDirectionEncoding(),
                downstreamIndices,
                flowDirectionCodes,
                dropValues,
                slopeValues,
                stats: {
                    drop: buildFieldStats(dropValues),
                    slope: buildFieldStats(slopeValues)
                },
                landCellCount,
                routedLandCellCount,
                sinkCellCount,
                terminalWaterStepCount,
                assignedWatershedCellCount,
                watershedRoutingSummaries,
                summary: {
                    routedLandCellRatio: roundFieldValue(routedLandCellCount / Math.max(1, landCellCount)),
                    sinkCellRatio: roundFieldValue(sinkCellCount / Math.max(1, landCellCount)),
                    terminalWaterStepRatio: roundFieldValue(terminalWaterStepCount / Math.max(1, landCellCount)),
                    watershedSummaryCount: watershedRoutingSummaries.length
                },
                compatibility: {
                    futureSurfaceDrainageInput: true,
                    futureAccumulationInput: true,
                    futureRiverBasinDraftInput: true,
                    futureMajorRiverExtractionInput: true,
                    sameWorldBoundsRequired: true
                },
                intentionallyAbsent: [
                    'accumulationMap',
                    'surfaceDrainageTendencyField',
                    'riverBasinDrafts',
                    'riverBasins',
                    'majorRiverCandidates',
                    'riverRoutingGraph',
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

    function materializeFlowAccumulationField(input = {}, fallbackDownhillFlowRoutingOutput = null) {
        const normalizedInput = normalizeInput(input);
        const downhillFlowRouting = resolveDownhillFlowRouting(input, fallbackDownhillFlowRoutingOutput);
        const sourceInputs = getSourceInputs(input);
        const routingWorldBounds = normalizeWorldBounds(downhillFlowRouting.worldBounds || normalizedInput.worldBounds);
        const elevationField = normalizeSerializedField(
            sourceInputs.seaLevelAppliedElevationField,
            routingWorldBounds,
            0
        );
        const worldBounds = normalizeWorldBounds({
            width: elevationField.width,
            height: elevationField.height
        });
        const landMaskField = normalizeSerializedField(
            sourceInputs.landmassCleanupMaskField,
            worldBounds,
            0
        );
        const width = worldBounds.width;
        const height = worldBounds.height;
        const size = width * height;
        const landThreshold = clampUnitInterval(downhillFlowRouting.landThreshold, clampUnitInterval(landMaskField.threshold, DEFAULT_LAND_THRESHOLD));
        const landCells = landMaskField.values.map((value) => value >= landThreshold);
        const landIndices = [];
        const downstreamIndices = normalizeDownstreamIndices(downhillFlowRouting, size);
        const rawAccumulationValues = new Array(size).fill(0);
        const upstreamCounts = new Array(size).fill(0);
        const accumulationNamespace = buildNamespace(PIPELINE_STEP_ID, 'flowAccumulation');
        const accumulationSeed = deriveSubSeed(normalizedInput.macroSeed, accumulationNamespace);
        const watershedSegmentation = isPlainObject(sourceInputs.watershedSegmentation)
            ? sourceInputs.watershedSegmentation
            : {};
        let routedLandStepCount = 0;
        let terminalWaterReceiverCellCount = 0;
        let sinkCellCount = 0;

        for (let index = 0; index < size; index += 1) {
            if (!landCells[index]) {
                continue;
            }

            landIndices.push(index);
            rawAccumulationValues[index] = 1;

            const downstreamIndex = downstreamIndices[index];
            if (downstreamIndex < 0) {
                sinkCellCount += 1;
                continue;
            }

            if (!landCells[downstreamIndex]) {
                terminalWaterReceiverCellCount += 1;
                continue;
            }

            upstreamCounts[downstreamIndex] += 1;
            routedLandStepCount += 1;
        }

        const processingQueue = landIndices
            .filter((index) => upstreamCounts[index] === 0)
            .sort((leftIndex, rightIndex) => leftIndex - rightIndex);
        let queueCursor = 0;
        let processedLandCellCount = 0;

        while (queueCursor < processingQueue.length) {
            const index = processingQueue[queueCursor];
            queueCursor += 1;
            processedLandCellCount += 1;

            const downstreamIndex = downstreamIndices[index];
            if (downstreamIndex < 0 || !landCells[downstreamIndex]) {
                continue;
            }

            rawAccumulationValues[downstreamIndex] += rawAccumulationValues[index];
            upstreamCounts[downstreamIndex] = Math.max(0, upstreamCounts[downstreamIndex] - 1);

            if (upstreamCounts[downstreamIndex] === 0) {
                processingQueue.push(downstreamIndex);
            }
        }

        const rawLandValues = landIndices.map((index) => rawAccumulationValues[index]);
        const maxRawAccumulation = rawLandValues.reduce((currentMax, value) => Math.max(currentMax, value), 0);
        const values = rawAccumulationValues.map((value, index) => {
            if (!landCells[index] || maxRawAccumulation <= 0) {
                return 0;
            }

            return roundFieldValue(value / maxRawAccumulation);
        });
        const watershedAccumulationSummaries = summarizeWatershedAccumulation(
            watershedSegmentation,
            {
                landCells,
                rawAccumulationValues,
                values
            },
            worldBounds
        );
        const unprocessedLandCellCount = Math.max(0, landIndices.length - processedLandCellCount);

        return {
            flowAccumulationField: {
                fieldId: FLOW_ACCUMULATION_FIELD_ID,
                fieldType: 'ScalarField',
                stageId: FLOW_ACCUMULATION_STAGE_ID,
                pipelineStep: PIPELINE_STEP_ID,
                sourceFieldIds: [
                    elevationField.fieldId,
                    landMaskField.fieldId
                ],
                sourceOutputIds: [
                    downhillFlowRouting.downhillFlowRoutingId || DOWNHILL_FLOW_ROUTING_STAGE_ID,
                    ...(sourceInputs.watershedSegmentation ? ['watershedSegmentation'] : [])
                ],
                worldBounds: cloneValue(worldBounds),
                width,
                height,
                size,
                seedNamespace: accumulationNamespace,
                seed: accumulationSeed,
                accumulationModel: 'deterministicTopologicalDownstreamAccumulationV1',
                downstreamRoutingId: downhillFlowRouting.downhillFlowRoutingId || DOWNHILL_FLOW_ROUTING_STAGE_ID,
                valueEncoding: DEFAULT_FIELD_VALUE_ENCODING,
                range: [0, 1],
                normalization: 'divideByMaxLandAccumulation',
                landThreshold,
                values,
                rawAccumulationValues,
                stats: {
                    normalized: buildFieldStats(values),
                    rawLand: buildFieldStats(rawLandValues)
                },
                landCellCount: landIndices.length,
                processedLandCellCount,
                unprocessedLandCellCount,
                routedLandStepCount,
                sinkCellCount,
                terminalWaterReceiverCellCount,
                maxRawAccumulation,
                watershedAccumulationSummaries,
                summary: {
                    meanRawLandAccumulation: buildFieldStats(rawLandValues).mean,
                    maxRawAccumulation,
                    processedLandCellRatio: roundFieldValue(processedLandCellCount / Math.max(1, landIndices.length)),
                    sinkCellRatio: roundFieldValue(sinkCellCount / Math.max(1, landIndices.length)),
                    terminalWaterReceiverRatio: roundFieldValue(terminalWaterReceiverCellCount / Math.max(1, landIndices.length)),
                    watershedSummaryCount: watershedAccumulationSummaries.length
                },
                compatibility: {
                    futureSurfaceDrainageInput: true,
                    futureRiverBasinDraftInput: true,
                    futureMajorRiverExtractionInput: true,
                    finalRiverRecordOutput: false,
                    sameWorldBoundsRequired: true
                },
                intentionallyAbsent: [
                    'surfaceDrainageTendencyField',
                    'riverBasinDrafts',
                    'riverBasins',
                    'majorRiverCandidates',
                    'riverRoutingGraph',
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

    function getRiverSystemGeneratorDescriptor() {
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
            description: 'Partial RiverSystemGenerator. It materializes deterministic downhill flow routing, flow accumulation, major-river candidates, delta/lake/marsh tagging summaries, hydrology-stage RiverBasinRecord output, and UI-free hydrology debug export from elevation, cleaned land/water, and watershed context; route graph, climate blend, full package assembly, local river placement, settlement logic, terrain cells, UI, and gameplay semantics remain absent.'
        };
    }

    function getRiverSystemInputContract() {
        return {
            contractId: 'riverSystemInput',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            requiredKeys: INPUT_REQUIRED_KEYS.slice(),
            optionalKeys: INPUT_OPTIONAL_KEYS.slice(),
            fieldDependencies: cloneValue(FIELD_DEPENDENCIES),
            intermediateDependencies: cloneValue(INTERMEDIATE_DEPENDENCIES),
            recordDependencies: cloneValue(RECORD_DEPENDENCIES),
            description: 'Contract for RiverSystemGenerator input. It consumes elevation fields and hydrosphere watershed segmentation for deterministic downhill flow routing, flow accumulation, major-river candidates, delta/lake/marsh tagging summaries, hydrology-stage basin records, and debug export without route graph, climate blend, full package assembly, local river placement, or settlement logic.'
        };
    }

    function getRiverSystemOutputContract() {
        return {
            contractId: 'riverSystemOutput',
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            status: PARTIAL_STATUS,
            stub: false,
            partial: true,
            plannedOutputs: cloneValue(PLANNED_OUTPUTS),
            implementedOutputs: {
                fields: [
                    FLOW_ACCUMULATION_FIELD_ID
                ],
                intermediateOutputs: [
                    DOWNHILL_FLOW_ROUTING_STAGE_ID,
                    DELTA_LAKE_MARSH_TAGGING_ID,
                    MAJOR_RIVER_CANDIDATES_ID,
                    RIVER_BASIN_RECORD_OUTPUT_ID
                ],
                records: [
                    'riverBasins'
                ],
                debugArtifacts: [
                    HYDROLOGY_DEBUG_EXPORT_ID
                ]
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT_OUTPUTS.slice(),
            description: 'Partial RiverSystemGenerator output contract. downhillFlowRouting, flowAccumulationField, majorRiverCandidates, deltaLakeMarshTagging, hydrology-stage riverBasins records, and hydrologyDebugExport are implemented, while surface drainage tendency, route graph, climate blend, full package assembly, terrain cells, UI, and gameplay semantics remain absent.'
        };
    }

    function getDownhillFlowRoutingContract() {
        return {
            contractId: DOWNHILL_FLOW_ROUTING_STAGE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'riverRouting'),
            sourceKeys: [
                'seaLevelAppliedElevationField',
                'landmassCleanupMaskField',
                'watershedSegmentation'
            ],
            requiredKeys: [
                'downhillFlowRoutingId',
                'stageId',
                'sourceFieldIds',
                'sourceOutputIds',
                'worldBounds',
                'seedNamespace',
                'seed',
                'routingModel',
                'neighborModel',
                'valueEncoding',
                'noDownstreamIndex',
                'landThreshold',
                'flowDirectionEncoding',
                'downstreamIndices',
                'flowDirectionCodes',
                'dropValues',
                'slopeValues',
                'stats',
                'summary',
                'compatibility'
            ],
            arraySemantics: {
                downstreamIndices: 'row-major downstream cell index for each cell; -1 means water, sink, or unresolved downstream step',
                flowDirectionCodes: 'row-major direction code matching flowDirectionEncoding; 0 means none',
                dropValues: 'row-major positive elevation drop for routed land cells; 0 otherwise',
                slopeValues: 'row-major positive drop divided by neighbor distance for routed land cells; 0 otherwise'
            },
            intentionallyAbsent: [
                'accumulationMap',
                'surfaceDrainageTendencyField',
                'riverBasinDrafts',
                'riverBasins',
                'majorRiverCandidates',
                'riverRoutingGraph',
                'riverDeltas',
                'lakeFormation',
                'marshFormation',
                'climateLogic',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic eight-neighbor strict-downhill routing layer. It resolves one direct downstream step for cleaned land cells from elevation, but does not compute accumulation, major rivers, deltas, final river basins, or gameplay/climate semantics.'
        };
    }

    function getFlowAccumulationFieldContract() {
        return {
            contractId: FLOW_ACCUMULATION_FIELD_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'flowAccumulation'),
            sourceKeys: [
                DOWNHILL_FLOW_ROUTING_STAGE_ID,
                'seaLevelAppliedElevationField',
                'landmassCleanupMaskField',
                'watershedSegmentation'
            ],
            requiredKeys: [
                'fieldId',
                'fieldType',
                'stageId',
                'sourceFieldIds',
                'sourceOutputIds',
                'worldBounds',
                'seedNamespace',
                'seed',
                'accumulationModel',
                'downstreamRoutingId',
                'valueEncoding',
                'range',
                'normalization',
                'values',
                'rawAccumulationValues',
                'stats',
                'summary',
                'compatibility'
            ],
            arraySemantics: {
                values: 'row-major normalized upstream-contributor accumulation for land cells; water cells are 0',
                rawAccumulationValues: 'row-major integer count of contributing land cells before normalization; water cells are 0'
            },
            intentionallyAbsent: [
                'surfaceDrainageTendencyField',
                'riverBasinDrafts',
                'riverBasins',
                'majorRiverCandidates',
                'riverRoutingGraph',
                'riverDeltas',
                'lakeFormation',
                'marshFormation',
                'climateLogic',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic flow accumulation field over downhillFlowRouting. It sums upstream land contributors and normalizes by max land accumulation, but does not extract major rivers, final basins, deltas, lakes, marshes, climate logic, terrain cells, or gameplay semantics.'
        };
    }

    function getDeltaLakeMarshTaggingContract() {
        return {
            contractId: DELTA_LAKE_MARSH_TAGGING_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'deltaLakeMarshTagging'),
            sourceKeys: [
                DOWNHILL_FLOW_ROUTING_STAGE_ID,
                FLOW_ACCUMULATION_FIELD_ID,
                'watershedSegmentation',
                'seaLevelAppliedElevationField',
                'landmassCleanupMaskField',
                'basinDepressionField'
            ],
            featureTypes: ['delta', 'lake', 'marsh'],
            requiredKeys: [
                'deltaLakeMarshTaggingId',
                'stageId',
                'sourceFieldIds',
                'sourceOutputIds',
                'worldBounds',
                'seedNamespace',
                'seed',
                'taggingModel',
                'featureTypes',
                'featureTags',
                'downstreamSummary',
                'summary',
                'compatibility'
            ],
            featureTagKeys: [
                'featureTagId',
                'featureType',
                'watershedId',
                'riverBasinIdHint',
                'basinType',
                'cellIndices',
                'centroidPoint',
                'normalizedCentroid',
                'strength',
                'confidence',
                'signals',
                'downstreamSummary'
            ],
            summaryKeys: [
                'featureCount',
                'taggedCellCount',
                'deltaCount',
                'lakeCount',
                'marshCount',
                'featureCountsByType',
                'taggedWatershedCount',
                'watershedFeatureSummaries'
            ],
            intentionallyAbsent: [
                'majorRiverExtraction',
                'riverRoutingGraph',
                'finalRiverDeltaSystems',
                'lakeHydrologySimulation',
                'marshBiomeConstruction',
                'biomes',
                'gameplayResources',
                'climateBlend',
                'fullPackageAssembly',
                'localRiverPlacement',
                'settlementLogic',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic hydrology feature tagging for delta, lake, and marsh candidates. It emits structural feature tags and downstream summaries only; it does not build final river deltas, lake systems, marsh biomes, gameplay resources, climate blend, or package assembly.'
        };
    }

    function getMajorRiverCandidatesContract() {
        return {
            contractId: MAJOR_RIVER_CANDIDATES_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'majorRiverCandidates'),
            sourceKeys: [
                DOWNHILL_FLOW_ROUTING_STAGE_ID,
                FLOW_ACCUMULATION_FIELD_ID,
                'watershedSegmentation',
                DELTA_LAKE_MARSH_TAGGING_ID,
                RIVER_BASIN_RECORD_OUTPUT_ID
            ],
            extractionModel: 'deterministicMainstemFromAccumulationWatershedV1',
            lineEncoding: 'rowMajorCellPathSourceToMouth',
            requiredKeys: [
                'majorRiverCandidatesId',
                'stageId',
                'sourceFieldIds',
                'sourceOutputIds',
                'worldBounds',
                'seedNamespace',
                'seed',
                'extractionModel',
                'lineEncoding',
                'majorRiverCandidates',
                'summary',
                'compatibility'
            ],
            candidateKeys: [
                'majorRiverCandidateId',
                'lineType',
                'lineEncoding',
                'watershedId',
                'riverBasinIdHint',
                'basinType',
                'sourceCellIndex',
                'mouthCellIndex',
                'lineCellIndices',
                'linePoints',
                'normalizedLinePoints',
                'rawDischarge',
                'normalizedDischarge',
                'candidateScore',
                'recordLink',
                'compatibility'
            ],
            intentionallyAbsent: [
                'riverRoutingGraph',
                'localRiverPlacement',
                'settlementLogic',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic major-river candidate extraction from flow accumulation and watershed data. It emits macro-scale source-to-mouth line candidates linked to watershed / RiverBasinRecord hints without building local river placement, route graphs, settlements, terrain cells, or gameplay semantics.'
        };
    }

    function getRiverBasinRecordOutputContract() {
        return {
            contractId: RIVER_BASIN_RECORD_OUTPUT_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace(PIPELINE_STEP_ID, 'riverBasins'),
            sourceKeys: [
                'watershedSegmentation',
                FLOW_ACCUMULATION_FIELD_ID
            ],
            requiredKeys: [
                'riverBasinRecordOutputId',
                'stageId',
                'recordSetId',
                'recordContract',
                'sourceFieldIds',
                'sourceOutputIds',
                'worldBounds',
                'seedNamespace',
                'seed',
                'materializationModel',
                'riverBasins',
                'recordLinks',
                'deferredRiverBasinDrafts',
                'summary',
                'compatibility'
            ],
            recordContract: 'RiverBasinRecord',
            recordPolicy: 'Emit hydrology-stage RiverBasinRecord objects only when source watershed drafts satisfy the runtime record contract; incomplete drafts stay in deferredRiverBasinDrafts.',
            compatibilityKeys: [
                'macroGeographyPackageRecordInput',
                'hydrologyStageRecordOutput',
                'climateLinkageMayBePending',
                'futureClimateBlendInput',
                'futureMajorRiverLinkageInput',
                'fullPackageAssemblyOutput'
            ],
            intentionallyAbsent: [
                'climateBlend',
                'fullPackageAssembly',
                'localRiverPlacement',
                'settlementLogic',
                'terrainCells',
                'gameplaySemantics'
            ],
            description: 'Deterministic RiverBasinRecord output assembled from watershedSegmentation drafts plus flow-accumulation summaries. Climate refs may remain empty until the climate blend step; no full package assembly or local placement is performed.'
        };
    }

    function getHydrologyDebugExportContract() {
        return {
            contractId: HYDROLOGY_DEBUG_EXPORT_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            artifactKind: HYDROLOGY_DEBUG_EXPORT_ID,
            registryId: 'fieldDebugRegistry',
            sourceKeys: [
                DOWNHILL_FLOW_ROUTING_STAGE_ID,
                FLOW_ACCUMULATION_FIELD_ID,
                'watershedSegmentation',
                DELTA_LAKE_MARSH_TAGGING_ID,
                RIVER_BASIN_RECORD_OUTPUT_ID
            ],
            requiredKeys: [
                'artifactId',
                'artifactKind',
                'stageId',
                'registryId',
                'worldBounds',
                'sourceFieldIds',
                'sourceOutputIds',
                'fieldSnapshots',
                'summaries',
                'compatibility'
            ],
            fieldSnapshots: [
                FLOW_ACCUMULATION_FIELD_ID,
                WATERSHED_DEBUG_MASK_FIELD_ID,
                RIVER_BASIN_DEBUG_MASK_FIELD_ID
            ],
            intentionallyAbsent: [
                'debugPanel',
                'fullPhysicalWorldDebugBundle',
                'climateBlend',
                'fullPackageAssembly',
                'localRiverPlacement',
                'settlementLogic',
                'gameplaySemantics'
            ],
            description: 'UI-free hydrology debug export for RiverSystemGenerator. It packages scalar heatmap snapshots for flow accumulation, watershed segmentation, emitted river-basin record coverage, major-river candidate summaries, and delta/lake/marsh summary metadata without building a debug panel or full physical-world bundle.'
        };
    }

    function getRiverSystemSeedHooks(masterSeed = 0) {
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

    function createRiverSystemPipeline(input = {}) {
        const normalizedInput = normalizeInput(input);
        const downhillFlowRoutingOutput = materializeDownhillFlowRouting(input);
        const flowAccumulationOutput = materializeFlowAccumulationField(input, downhillFlowRoutingOutput);
        const sourceInputs = getSourceInputs(input);
        const watershedSegmentation = resolveWatershedSegmentation(input, sourceInputs.watershedSegmentation);
        const deltaLakeMarshTaggingOutput = materializeDeltaLakeMarshTagging(
            input,
            downhillFlowRoutingOutput,
            flowAccumulationOutput
        );
        const riverBasinRecordOutput = materializeRiverBasinRecordOutput(input, flowAccumulationOutput);
        const majorRiverCandidatesOutput = materializeMajorRiverCandidates(
            input,
            downhillFlowRoutingOutput,
            flowAccumulationOutput,
            deltaLakeMarshTaggingOutput.deltaLakeMarshTagging,
            riverBasinRecordOutput.riverBasinRecordOutput
        );
        const hydrologyDebugExportOutput = materializeHydrologyDebugExport(input, {
            flowAccumulationField: flowAccumulationOutput.flowAccumulationField,
            watershedSegmentation,
            deltaLakeMarshTagging: deltaLakeMarshTaggingOutput.deltaLakeMarshTagging,
            majorRiverCandidatesOutput: majorRiverCandidatesOutput.majorRiverCandidatesOutput,
            riverBasinRecordOutput: riverBasinRecordOutput.riverBasinRecordOutput
        });

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
            inputContract: getRiverSystemInputContract(),
            outputContract: getRiverSystemOutputContract(),
            deltaLakeMarshTaggingContract: getDeltaLakeMarshTaggingContract(),
            majorRiverCandidatesContract: getMajorRiverCandidatesContract(),
            riverBasinRecordOutputContract: getRiverBasinRecordOutputContract(),
            hydrologyDebugExportContract: getHydrologyDebugExportContract(),
            seedHooks: getRiverSystemSeedHooks(normalizedInput.macroSeed),
            dependencyAvailability: describeRiverSystemDependencyAvailability(input),
            plannedStages: cloneValue(PLANNED_STAGES),
            outputs: {
                ...createEmptyRiverSystemOutputs(),
                fields: {
                    flowAccumulationField: flowAccumulationOutput.flowAccumulationField
                },
                intermediateOutputs: {
                    downhillFlowRouting: downhillFlowRoutingOutput.downhillFlowRouting,
                    deltaLakeMarshTagging: deltaLakeMarshTaggingOutput.deltaLakeMarshTagging,
                    majorRiverCandidates: majorRiverCandidatesOutput.majorRiverCandidatesOutput,
                    riverBasinRecordOutput: riverBasinRecordOutput.riverBasinRecordOutput
                },
                records: {
                    riverBasins: riverBasinRecordOutput.riverBasinRecordOutput.riverBasins
                },
                debugArtifacts: [
                    hydrologyDebugExportOutput.hydrologyDebugExport
                ]
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT_OUTPUTS.slice(),
            notes: [
                'Partial river-system pipeline: downhillFlowRouting resolves one direct strict-downhill downstream step per cleaned land cell.',
                'flowAccumulationField sums upstream land contributors over downhillFlowRouting as a normalized ScalarField basis for future river extraction.',
                'majorRiverCandidates extracts deterministic macro-scale mainstem line candidates from accumulation and watershed data, linked back to river basin records.',
                'deltaLakeMarshTagging emits deterministic structural delta/lake/marsh feature tags and downstream summaries without building final hydrology systems.',
                'riverBasins are emitted as hydrology-stage RiverBasinRecord outputs from watershedSegmentation drafts when required non-climate physical refs are present; incomplete drafts stay deferred.',
                'hydrologyDebugExport emits UI-free scalar field snapshots for accumulation, watershed segmentation, and river-basin record coverage.',
                'No route graph, climate blend, full package assembly, local river placement, settlement logic, biome construction, gameplay resources, terrain cells, UI, or gameplay semantics are generated.'
            ]
        };
    }

    function generateDownhillFlowRouting(input = {}) {
        return materializeDownhillFlowRouting(input).downhillFlowRouting;
    }

    function generateFlowAccumulationField(input = {}) {
        return materializeFlowAccumulationField(input).flowAccumulationField;
    }

    function generateRiverBasinRecordOutput(input = {}) {
        return materializeRiverBasinRecordOutput(input).riverBasinRecordOutput;
    }

    function generateDeltaLakeMarshTagging(input = {}) {
        return materializeDeltaLakeMarshTagging(input).deltaLakeMarshTagging;
    }

    function generateMajorRiverCandidates(input = {}) {
        return materializeMajorRiverCandidates(input).majorRiverCandidatesOutput;
    }

    function generateHydrologyDebugExport(input = {}) {
        return materializeHydrologyDebugExport(input).hydrologyDebugExport;
    }

    function generateRiverSystem(input = {}) {
        return createRiverSystemPipeline(input);
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule(MODULE_ID, {
            entry: 'generateRiverSystem',
            file: 'js/worldgen/macro/river-system-generator.js',
            description: 'Partial RiverSystemGenerator with deterministic downhill flow routing, flow accumulation, major-river candidates, delta/lake/marsh tagging, RiverBasinRecord output, and hydrology debug export over relief/elevation plus hydrosphere outputs.',
            stub: false,
            partial: true
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep(PIPELINE_STEP_ID, {
            moduleId: MODULE_ID,
            file: 'js/worldgen/macro/river-system-generator.js',
            entry: 'generateRiverSystem',
            description: 'Partial river-system pipeline entry. Implements downhill flow routing, flow accumulation, major-river candidates, delta/lake/marsh tagging, hydrology-stage basin records, and debug export; no route graph, climate blend, full package assembly, local placement, or settlement logic.',
            stub: false,
            partial: true
        });
    }

    Object.assign(macro, {
        getRiverSystemGeneratorDescriptor,
        getRiverSystemInputContract,
        getRiverSystemOutputContract,
        getDownhillFlowRoutingContract,
        getFlowAccumulationFieldContract,
        getDeltaLakeMarshTaggingContract,
        getMajorRiverCandidatesContract,
        getRiverBasinRecordOutputContract,
        getHydrologyDebugExportContract,
        getRiverSystemSeedHooks,
        describeRiverSystemDependencyAvailability,
        generateDownhillFlowRouting,
        generateFlowAccumulationField,
        generateDeltaLakeMarshTagging,
        generateMajorRiverCandidates,
        generateRiverBasinRecordOutput,
        generateHydrologyDebugExport,
        createRiverSystemPipeline,
        generateRiverSystem
    });
})();
