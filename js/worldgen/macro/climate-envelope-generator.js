(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const MODULE_ID = 'climateEnvelopeGenerator';
    const PIPELINE_STEP_ID = 'climateEnvelope';
    const PARTIAL_STATUS = 'PARTIAL_IMPLEMENTED';
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';
    const DEFAULT_WORLD_BOUNDS = Object.freeze({
        width: 256,
        height: 128
    });
    const LATITUDE_BAND_BASELINE_FIELD_ID = 'latitudeBandBaselineField';
    const LATITUDE_BAND_STAGE_ID = 'latitudeBandsScaffold';
    const LATITUDE_BAND_MODEL_ID = 'deterministicLatitudeBaselineV1';
    const LATITUDE_BAND_VALUE_ENCODING = 'rowMajorFloatArray';
    const DEFAULT_FIELD_RANGE = Object.freeze([0, 1]);
    const PREVAILING_WIND_FIELD_ID = 'prevailingWindField';
    const PREVAILING_WIND_STAGE_ID = 'windEnvelopeScaffold';
    const PREVAILING_WIND_MODEL_ID = 'deterministicLatitudeBeltWindV1';
    const PREVAILING_WIND_VECTOR_ENCODING = 'rowMajorUnitVectorArrays';
    const PREVAILING_WIND_MAGNITUDE_ENCODING = 'rowMajorFloatArray';
    const HUMIDITY_TRANSPORT_FIELD_ID = 'humidityTransportField';
    const WETNESS_FIELD_ID = 'wetnessField';
    const HUMIDITY_TRANSPORT_STAGE_ID = 'humidityEnvelopeScaffold';
    const HUMIDITY_TRANSPORT_MODEL_ID = 'deterministicWindHydrosphereHumidityTransportV1';
    const PRE_RAIN_SHADOW_WETNESS_MODEL_ID = 'deterministicPreparedWetnessBaselineV1';
    const WETNESS_FIELD_MODEL_ID = 'deterministicRainShadowAdjustedWetnessV1';
    const HUMIDITY_TRANSPORT_VALUE_ENCODING = 'rowMajorFloatArray';
    const WETNESS_FIELD_VALUE_ENCODING = 'rowMajorFloatArray';
    const RAIN_SHADOW_EFFECT_ID = 'rainShadowEffect';
    const RAIN_SHADOW_STAGE_ID = 'rainShadowEffect';
    const RAIN_SHADOW_MODEL_ID = 'deterministicOrographicRainShadowV1';
    const RAIN_SHADOW_VALUE_ENCODING = 'rowMajorFloatArray';
    const TEMPERATURE_COLD_LOAD_FIELD_ID = 'temperatureColdLoadField';
    const TEMPERATURE_COLD_LOAD_STAGE_ID = 'temperatureEnvelopeScaffold';
    const TEMPERATURE_COLD_LOAD_MODEL_ID = 'deterministicLatitudeElevationColdLoadV1';
    const TEMPERATURE_COLD_LOAD_VALUE_ENCODING = 'rowMajorFloatArray';
    const STORM_CORRIDOR_FIELD_ID = 'stormCorridorField';
    const STORM_AND_DECAY_STAGE_ID = 'stormAndDecayScaffold';
    const STORM_CORRIDOR_MODEL_ID = 'deterministicWindWetnessStormCorridorV1';
    const STORM_CORRIDOR_VALUE_ENCODING = 'rowMajorFloatArray';
    const COASTAL_DECAY_BURDEN_FIELD_ID = 'coastalDecayBurdenField';
    const COASTAL_DECAY_BURDEN_MODEL_ID = 'deterministicCoastalStormWearBurdenV1';
    const COASTAL_DECAY_BURDEN_VALUE_ENCODING = 'rowMajorFloatArray';
    const SEASONALITY_FIELD_ID = 'seasonalityField';
    const SEASONALITY_MODEL_ID = 'deterministicLatitudeContinentalSeasonalityV1';
    const SEASONALITY_VALUE_ENCODING = 'rowMajorFloatArray';
    const CLIMATE_ZONE_CLASSIFICATION_ID = 'climateZoneClassification';
    const REGIONAL_CLIMATE_SUMMARIES_ID = 'regionalClimateSummaries';
    const CLIMATE_STRESS_FIELD_ID = 'climateStressField';
    const CLIMATE_STRESS_SUMMARIES_ID = 'climateStressRegionalSummaries';
    const CLIMATE_BIOME_FIELD_SNAPSHOTS_ID = 'climateBiomeFieldSnapshots';
    const BIOME_ENVELOPE_CLASSIFICATION_ID = 'biomeEnvelopeClassification';
    const CLIMATE_BAND_STAGE_ID = 'climateBandScaffold';
    const CLIMATE_STRESS_STAGE_ID = 'climateStressScaffold';
    const CLIMATE_BIOME_DEBUG_STAGE_ID = 'climateBiomeDebugExport';
    const CLIMATE_ZONE_CLASSIFICATION_MODEL_ID = 'deterministicClimateBandClassificationV1';
    const REGIONAL_CLIMATE_SUMMARIES_MODEL_ID = 'deterministicClimateBandRegionalSummariesV1';
    const CLIMATE_STRESS_MODEL_ID = 'deterministicClimateStressCompositeV1';
    const CLIMATE_STRESS_SUMMARIES_MODEL_ID = 'deterministicClimateStressRegionalSummariesV1';
    const CLIMATE_ZONE_CLASSIFICATION_VALUE_ENCODING = 'rowMajorIntegerArray';
    const CLIMATE_STRESS_VALUE_ENCODING = 'rowMajorFloatArray';
    const TAU = Math.PI * 2;
    const INPUT_REQUIRED_KEYS = Object.freeze([
        'macroSeed'
    ]);
    const INPUT_OPTIONAL_KEYS = Object.freeze([
        'macroSeedProfile',
        'phase1Constraints',
        'worldBounds',
        'reliefElevation',
        'hydrosphere',
        'riverSystem',
        'marineCarving',
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
            role: 'macro elevation / cold-load baseline for future latitude and temperature passes'
        },
        {
            fieldId: 'landmassCleanupMaskField',
            sourceGroup: 'reliefElevation.outputs.fields',
            required: true,
            role: 'land/water baseline for future land climate classification'
        },
        {
            fieldId: 'mountainAmplificationField',
            sourceGroup: 'reliefElevation.outputs.fields',
            required: false,
            role: 'optional orographic context for future rain-shadow and cold-load passes'
        },
        {
            fieldId: 'basinDepressionField',
            sourceGroup: 'reliefElevation.outputs.fields',
            required: false,
            role: 'optional wet-retention context for future wetness and marsh-adjacent climate summaries'
        },
        {
            fieldId: 'oceanConnectivityMaskField',
            sourceGroup: 'hydrosphere.outputs.fields',
            required: true,
            role: 'ocean exposure baseline for future humidity and storm-envelope passes'
        },
        {
            fieldId: 'coastalShelfDepthField',
            sourceGroup: 'hydrosphere.outputs.fields',
            required: false,
            role: 'optional coastal moderation context for future maritime seasonality'
        },
        {
            fieldId: 'marineInvasionField',
            sourceGroup: 'marineCarving.outputs.fields',
            required: false,
            role: 'optional coastal penetration context for future decay and storm exposure summaries'
        }
    ]);
    const INTERMEDIATE_DEPENDENCIES = deepFreeze([
        {
            outputId: 'continentBodies',
            sourceGroup: 'reliefElevation.outputs.intermediateOutputs',
            required: false,
            role: 'optional continent attribution for future climate summaries'
        },
        {
            outputId: 'reliefRegionExtraction',
            sourceGroup: 'reliefElevation.outputs.intermediateOutputs',
            required: false,
            role: 'optional geometry-backed relief attribution for ClimateBandRecord-compatible climate-zone assembly'
        },
        {
            outputId: 'seaRegionClusters',
            sourceGroup: 'hydrosphere.outputs.intermediateOutputs',
            required: false,
            role: 'optional sea-region draft attribution for future climate-band references'
        },
        {
            outputId: 'coastalDepthApproximation',
            sourceGroup: 'hydrosphere.outputs.intermediateOutputs',
            required: false,
            role: 'optional shelf/depth summary for future maritime moderation'
        },
        {
            outputId: 'watershedSegmentation',
            sourceGroup: 'hydrosphere.outputs.intermediateOutputs',
            required: false,
            role: 'optional basin attribution for future wetness and river-basin climate linkage'
        },
        {
            outputId: 'majorRiverCandidates',
            sourceGroup: 'riverSystem.outputs.intermediateOutputs',
            required: false,
            role: 'optional hydrology line context for future wetness summaries'
        }
    ]);
    const RECORD_DEPENDENCIES = deepFreeze([
        {
            outputId: 'mountainSystems',
            sourceGroup: 'records',
            required: false,
            role: 'optional mountain-system records for rain-shadow attribution'
        },
        {
            outputId: 'reliefRegions',
            sourceGroup: 'reliefElevation.outputs.records',
            required: false,
            role: 'optional physical relief records for future ClimateBandRecord linkage'
        },
        {
            outputId: 'riverBasins',
            sourceGroup: 'riverSystem.outputs.records',
            required: false,
            role: 'optional hydrology-stage records for future climate linkage'
        },
        {
            outputId: 'seaRegions',
            sourceGroup: 'hydrosphere.outputs.records',
            required: false,
            role: 'optional final sea records when that later hydrosphere output exists'
        }
    ]);
    const PLANNED_OUTPUTS = deepFreeze({
        fields: [
            LATITUDE_BAND_BASELINE_FIELD_ID,
            PREVAILING_WIND_FIELD_ID,
            HUMIDITY_TRANSPORT_FIELD_ID,
            TEMPERATURE_COLD_LOAD_FIELD_ID,
            WETNESS_FIELD_ID,
            'stormCorridorField',
            'coastalDecayBurdenField',
            'seasonalityField',
            CLIMATE_STRESS_FIELD_ID
        ],
        intermediateOutputs: [
            'climateEnvelopeCompositionPlan',
            'rainShadowEffect',
            'climateZoneClassification',
            REGIONAL_CLIMATE_SUMMARIES_ID,
            CLIMATE_STRESS_SUMMARIES_ID
        ],
        records: [
            'climateBands'
        ],
        debugArtifacts: [
            'climateEnvelopeFieldSnapshots',
            CLIMATE_BIOME_FIELD_SNAPSHOTS_ID,
            'climateEnvelopeDebugArtifacts'
        ]
    });
    const PLANNED_STAGES = deepFreeze([
        {
            stageId: 'dependencyIntake',
            seedScope: 'dependencyIntake',
            plannedOutputs: ['dependencyAvailability']
        },
        {
            stageId: LATITUDE_BAND_STAGE_ID,
            seedScope: 'latitudeBands',
            plannedOutputs: [LATITUDE_BAND_BASELINE_FIELD_ID]
        },
        {
            stageId: PREVAILING_WIND_STAGE_ID,
            seedScope: 'prevailingWind',
            plannedOutputs: [PREVAILING_WIND_FIELD_ID]
        },
        {
            stageId: HUMIDITY_TRANSPORT_STAGE_ID,
            seedScope: 'humidityTransport',
            plannedOutputs: [HUMIDITY_TRANSPORT_FIELD_ID]
        },
        {
            stageId: RAIN_SHADOW_STAGE_ID,
            seedScope: 'rainShadow',
            plannedOutputs: [RAIN_SHADOW_EFFECT_ID, WETNESS_FIELD_ID]
        },
        {
            stageId: TEMPERATURE_COLD_LOAD_STAGE_ID,
            seedScope: 'temperatureColdLoad',
            plannedOutputs: [TEMPERATURE_COLD_LOAD_FIELD_ID]
        },
        {
            stageId: STORM_AND_DECAY_STAGE_ID,
            seedScope: 'stormDecaySeasonality',
            plannedOutputs: [STORM_CORRIDOR_FIELD_ID, 'coastalDecayBurdenField', 'seasonalityField']
        },
        {
            stageId: CLIMATE_BAND_STAGE_ID,
            seedScope: 'climateBands',
            plannedOutputs: [CLIMATE_ZONE_CLASSIFICATION_ID, 'climateBands', REGIONAL_CLIMATE_SUMMARIES_ID]
        },
        {
            stageId: CLIMATE_STRESS_STAGE_ID,
            seedScope: 'climateStress',
            plannedOutputs: [CLIMATE_STRESS_FIELD_ID, CLIMATE_STRESS_SUMMARIES_ID]
        },
        {
            stageId: 'debugExportScaffold',
            seedScope: 'debugExport',
            plannedOutputs: ['climateEnvelopeFieldSnapshots', 'climateEnvelopeDebugArtifacts']
        }
    ]);
    const INTENTIONALLY_ABSENT_OUTPUTS = Object.freeze([
        'biomeEnvelope',
        'gameplayWeatherSystems',
        'weatherRuntimeRules',
        'fullPackageAssembly',
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
            return Object.fromEntries(
                Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)])
            );
        }

        return value;
    }

    function normalizeSeed(seed) {
        return typeof macro.normalizeSeed === 'function'
            ? macro.normalizeSeed(seed)
            : (Number(seed) >>> 0) || 0;
    }

    function normalizeInteger(value, fallback) {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? Math.max(1, Math.floor(numericValue)) : fallback;
    }

    function normalizeWorldBounds(bounds = DEFAULT_WORLD_BOUNDS) {
        const source = bounds && typeof bounds === 'object' ? bounds : {};
        return {
            width: normalizeInteger(source.width, DEFAULT_WORLD_BOUNDS.width),
            height: normalizeInteger(source.height, DEFAULT_WORLD_BOUNDS.height)
        };
    }

    function normalizeInput(input = {}) {
        const source = input && typeof input === 'object' ? input : {};
        return {
            macroSeed: normalizeSeed(source.macroSeed ?? source.seed),
            worldBounds: normalizeWorldBounds(source.worldBounds),
            debugOptions: source.debugOptions && typeof source.debugOptions === 'object'
                ? cloneValue(source.debugOptions)
                : {}
        };
    }

    function buildNamespace(...segments) {
        if (typeof macro.buildMacroSubSeedNamespace === 'function') {
            return macro.buildMacroSubSeedNamespace(PIPELINE_STEP_ID, ...segments);
        }

        return ['macro', PIPELINE_STEP_ID, ...segments]
            .filter((segment) => typeof segment === 'string' && segment.trim())
            .join('.');
    }

    function deriveSubSeed(masterSeed, namespace) {
        return typeof macro.deriveMacroSubSeed === 'function'
            ? macro.deriveMacroSubSeed(masterSeed, namespace)
            : normalizeSeed(masterSeed);
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

    function roundFieldValue(value, precision = 6) {
        return Number.isFinite(value)
            ? Number(value.toFixed(precision))
            : 0;
    }

    function clampUnitInterval(value, fallback = 0) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return fallback;
        }

        return Math.max(0, Math.min(1, numericValue));
    }

    function buildScalarFieldStats(values = []) {
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

    function hashString(value) {
        const source = normalizeString(value, '');
        let hash = 2166136261;
        for (let index = 0; index < source.length; index += 1) {
            hash ^= source.charCodeAt(index);
            hash = Math.imul(hash, 16777619) >>> 0;
        }

        return hash >>> 0;
    }

    function mixUint32(left, right) {
        let state = (normalizeSeed(left) ^ normalizeSeed(right) ^ 0x9e3779b9) >>> 0;
        state = Math.imul(state ^ (state >>> 16), 0x7feb352d) >>> 0;
        state = Math.imul(state ^ (state >>> 15), 0x846ca68b) >>> 0;
        return (state ^ (state >>> 16)) >>> 0;
    }

    function deterministicUnitNoise(seed, ...segments) {
        const hash = segments.reduce((currentHash, segment) => {
            const segmentHash = typeof segment === 'string'
                ? hashString(segment)
                : normalizeSeed(segment);
            return mixUint32(currentHash, segmentHash);
        }, normalizeSeed(seed));

        return hash / 0xffffffff;
    }

    function normalizeVector(x, y) {
        const numericX = Number.isFinite(x) ? x : 0;
        const numericY = Number.isFinite(y) ? y : 0;
        const magnitude = Math.hypot(numericX, numericY);
        if (magnitude <= 0) {
            return {
                x: 0,
                y: 0
            };
        }

        return {
            x: numericX / magnitude,
            y: numericY / magnitude
        };
    }

    function getLatitudeBaselineBand(normalizedLatitude) {
        const distanceFromEquator = Math.abs(normalizedLatitude - 0.5) * 2;
        const hemisphere = normalizedLatitude < 0.5 ? 'north' : 'south';

        if (distanceFromEquator >= 0.82) {
            return {
                bandId: `${hemisphere}_polar_baseline`,
                bandType: 'polar',
                temperatureBias: 0.08,
                wetnessAnchorHint: 0.18,
                seasonalityAnchorHint: 0.82
            };
        }

        if (distanceFromEquator >= 0.56) {
            return {
                bandId: `${hemisphere}_cool_temperate_baseline`,
                bandType: 'cool_temperate',
                temperatureBias: 0.32,
                wetnessAnchorHint: 0.42,
                seasonalityAnchorHint: 0.68
            };
        }

        if (distanceFromEquator >= 0.28) {
            return {
                bandId: `${hemisphere}_warm_temperate_baseline`,
                bandType: 'warm_temperate',
                temperatureBias: 0.58,
                wetnessAnchorHint: 0.48,
                seasonalityAnchorHint: 0.48
            };
        }

        if (distanceFromEquator >= 0.1) {
            return {
                bandId: `${hemisphere}_subtropical_baseline`,
                bandType: 'subtropical',
                temperatureBias: 0.78,
                wetnessAnchorHint: 0.34,
                seasonalityAnchorHint: 0.32
            };
        }

        return {
            bandId: 'equatorial_baseline',
            bandType: 'equatorial',
            temperatureBias: 0.96,
            wetnessAnchorHint: 0.72,
            seasonalityAnchorHint: 0.18
        };
    }

    function getLatitudeWindBand(normalizedY) {
        if (normalizedY < 0.16) {
            return {
                bandId: 'north_polar_easterlies',
                baseX: -0.5,
                meridionalFlow: 0.16
            };
        }

        if (normalizedY < 0.36) {
            return {
                bandId: 'north_midlatitude_westerlies',
                baseX: 0.9,
                meridionalFlow: -0.1
            };
        }

        if (normalizedY < 0.5) {
            return {
                bandId: 'north_trade_winds',
                baseX: -0.78,
                meridionalFlow: 0.18
            };
        }

        if (normalizedY < 0.64) {
            return {
                bandId: 'south_trade_winds',
                baseX: -0.78,
                meridionalFlow: -0.18
            };
        }

        if (normalizedY < 0.84) {
            return {
                bandId: 'south_midlatitude_westerlies',
                baseX: 0.9,
                meridionalFlow: 0.1
            };
        }

        return {
            bandId: 'south_polar_easterlies',
            baseX: -0.5,
            meridionalFlow: -0.16
        };
    }

    function buildDirectionalFieldStats(xValues = [], yValues = [], magnitudeValues = []) {
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
                maxMagnitude: 0,
                eastwardCellCount: 0,
                westwardCellCount: 0,
                northwardCellCount: 0,
                southwardCellCount: 0
            };
        }

        let nonZeroCount = 0;
        let totalX = 0;
        let totalY = 0;
        let totalMagnitude = 0;
        let maxMagnitude = 0;
        let eastwardCellCount = 0;
        let westwardCellCount = 0;
        let northwardCellCount = 0;
        let southwardCellCount = 0;

        for (let index = 0; index < count; index += 1) {
            const x = Number.isFinite(xValues[index]) ? xValues[index] : 0;
            const y = Number.isFinite(yValues[index]) ? yValues[index] : 0;
            const magnitude = Number.isFinite(magnitudeValues[index])
                ? magnitudeValues[index]
                : Math.hypot(x, y);

            if (magnitude > 0) {
                nonZeroCount += 1;
            }

            if (x > 0) {
                eastwardCellCount += 1;
            } else if (x < 0) {
                westwardCellCount += 1;
            }

            if (y > 0) {
                southwardCellCount += 1;
            } else if (y < 0) {
                northwardCellCount += 1;
            }

            totalX += x;
            totalY += y;
            totalMagnitude += magnitude;
            maxMagnitude = Math.max(maxMagnitude, magnitude);
        }

        return {
            nonZeroCount,
            meanX: roundFieldValue(totalX / count),
            meanY: roundFieldValue(totalY / count),
            meanMagnitude: roundFieldValue(totalMagnitude / count),
            maxMagnitude: roundFieldValue(maxMagnitude),
            eastwardCellCount,
            westwardCellCount,
            northwardCellCount,
            southwardCellCount
        };
    }

    function getNestedValue(source, path) {
        if (!source || typeof source !== 'object' || typeof path !== 'string' || !path.trim()) {
            return null;
        }

        return path.split('.').reduce((current, segment) => (
            current && typeof current === 'object' ? current[segment] : null
        ), source);
    }

    function findDependencyValue(source, dependencyId) {
        if (!source || typeof source !== 'object') {
            return null;
        }

        if (Object.prototype.hasOwnProperty.call(source, dependencyId)) {
            return source[dependencyId];
        }

        if (Array.isArray(source)) {
            return source.find((entry) => (
                entry
                && typeof entry === 'object'
                && (
                    entry.fieldId === dependencyId
                    || entry.outputId === dependencyId
                    || entry.recordSetId === dependencyId
                    || entry.stageId === dependencyId
                    || entry.contractId === dependencyId
                )
            )) || null;
        }

        return null;
    }

    function checkDependency(input, dependency) {
        const groupValue = getNestedValue(input, dependency.sourceGroup);
        const directGroups = [
            input.fields,
            input.intermediateOutputs,
            input.records
        ];
        const availableValue = findDependencyValue(groupValue, dependency.fieldId || dependency.outputId)
            || directGroups.map((group) => findDependencyValue(group, dependency.fieldId || dependency.outputId)).find(Boolean)
            || null;

        return {
            dependencyId: dependency.fieldId || dependency.outputId,
            sourceGroup: dependency.sourceGroup,
            required: dependency.required === true,
            available: Boolean(availableValue),
            role: dependency.role
        };
    }

    function remapFieldCoordinate(coordinate, sourceSize, targetSize) {
        if (sourceSize <= 1 || targetSize <= 1) {
            return 0;
        }

        const normalized = clampUnitInterval(coordinate / (targetSize - 1), 0);
        return Math.max(0, Math.min(sourceSize - 1, Math.round(normalized * (sourceSize - 1))));
    }

    function findInputField(input = {}, fieldId = '') {
        const candidateGroups = [
            input.fields,
            getNestedValue(input, 'outputs.fields'),
            getNestedValue(input, 'reliefElevation.fields'),
            getNestedValue(input, 'reliefElevation.outputs.fields'),
            getNestedValue(input, 'hydrosphere.fields'),
            getNestedValue(input, 'hydrosphere.outputs.fields'),
            getNestedValue(input, 'marineCarving.fields'),
            getNestedValue(input, 'marineCarving.outputs.fields'),
            getNestedValue(input, 'riverSystem.fields'),
            getNestedValue(input, 'riverSystem.outputs.fields')
        ];

        return candidateGroups
            .map((group) => findDependencyValue(group, fieldId))
            .find(Boolean) || null;
    }

    function findInputRecordCollection(input = {}, outputId = '') {
        const candidateGroups = [
            input,
            input.records,
            getNestedValue(input, 'outputs.records'),
            getNestedValue(input, 'reliefElevation.records'),
            getNestedValue(input, 'reliefElevation.outputs.records'),
            getNestedValue(input, 'tectonicSkeleton.records'),
            getNestedValue(input, 'tectonicSkeleton.outputs.records')
        ];
        const foundValue = candidateGroups
            .map((group) => findDependencyValue(group, outputId))
            .find(Boolean) || null;

        if (Array.isArray(foundValue)) {
            return foundValue;
        }

        if (foundValue && typeof foundValue === 'object' && Array.isArray(foundValue.records)) {
            return foundValue.records;
        }

        return [];
    }

    function findInputIntermediateOutput(input = {}, outputId = '') {
        const candidateGroups = [
            input.intermediateOutputs,
            getNestedValue(input, 'outputs.intermediateOutputs'),
            getNestedValue(input, 'reliefElevation.intermediateOutputs'),
            getNestedValue(input, 'reliefElevation.outputs.intermediateOutputs'),
            getNestedValue(input, 'hydrosphere.intermediateOutputs'),
            getNestedValue(input, 'hydrosphere.outputs.intermediateOutputs'),
            getNestedValue(input, 'marineCarving.intermediateOutputs'),
            getNestedValue(input, 'marineCarving.outputs.intermediateOutputs'),
            getNestedValue(input, 'riverSystem.intermediateOutputs'),
            getNestedValue(input, 'riverSystem.outputs.intermediateOutputs')
        ];

        return candidateGroups
            .map((group) => findDependencyValue(group, outputId))
            .find(Boolean) || null;
    }

    function extractRecordIds(records = [], preferredKeys = []) {
        return Array.isArray(records)
            ? records
                .map((record) => {
                    if (!record || typeof record !== 'object') {
                        return '';
                    }

                    const key = preferredKeys.find((candidateKey) => normalizeString(record[candidateKey], ''));
                    return key ? normalizeString(record[key], '') : '';
                })
                .filter(Boolean)
            : [];
    }

    function readScalarFieldValue(field, x, y, targetWorldBounds = DEFAULT_WORLD_BOUNDS, fallback = 0) {
        const fallbackValue = clampUnitInterval(fallback, 0);
        if (!field || typeof field !== 'object' || !Array.isArray(field.values)) {
            return fallbackValue;
        }

        const worldBounds = normalizeWorldBounds(targetWorldBounds);
        const width = normalizeInteger(field.width, worldBounds.width);
        const height = normalizeInteger(field.height, worldBounds.height);
        const sourceX = remapFieldCoordinate(x, width, worldBounds.width);
        const sourceY = remapFieldCoordinate(y, height, worldBounds.height);
        const index = sourceY * width + sourceX;
        return clampUnitInterval(field.values[index], fallbackValue);
    }

    function readScalarFieldChannelValue(field, channelKey, x, y, targetWorldBounds = DEFAULT_WORLD_BOUNDS, fallback = 0) {
        const fallbackValue = clampUnitInterval(fallback, 0);
        if (!field || typeof field !== 'object' || !normalizeString(channelKey, '')) {
            return fallbackValue;
        }

        const channelValues = field[channelKey];
        if (!Array.isArray(channelValues)) {
            return fallbackValue;
        }

        const worldBounds = normalizeWorldBounds(targetWorldBounds);
        const width = normalizeInteger(field.width, worldBounds.width);
        const height = normalizeInteger(field.height, worldBounds.height);
        const sourceX = remapFieldCoordinate(x, width, worldBounds.width);
        const sourceY = remapFieldCoordinate(y, height, worldBounds.height);
        const index = sourceY * width + sourceX;
        return clampUnitInterval(channelValues[index], fallbackValue);
    }

    function readDirectionalFieldVector(field, x, y, targetWorldBounds = DEFAULT_WORLD_BOUNDS) {
        if (!field || typeof field !== 'object') {
            return {
                x: 0,
                y: 0,
                magnitude: 0
            };
        }

        const worldBounds = normalizeWorldBounds(targetWorldBounds);
        const width = normalizeInteger(field.width, worldBounds.width);
        const height = normalizeInteger(field.height, worldBounds.height);
        const sourceX = remapFieldCoordinate(x, width, worldBounds.width);
        const sourceY = remapFieldCoordinate(y, height, worldBounds.height);
        const index = sourceY * width + sourceX;
        const rawX = Array.isArray(field.xValues) && Number.isFinite(field.xValues[index])
            ? field.xValues[index]
            : 0;
        const rawY = Array.isArray(field.yValues) && Number.isFinite(field.yValues[index])
            ? field.yValues[index]
            : 0;
        const vector = normalizeVector(rawX, rawY);
        const magnitude = Array.isArray(field.magnitudeValues) && Number.isFinite(field.magnitudeValues[index])
            ? clampUnitInterval(field.magnitudeValues[index], Math.hypot(rawX, rawY))
            : clampUnitInterval(Math.hypot(rawX, rawY), 0);

        return {
            x: vector.x,
            y: vector.y,
            magnitude
        };
    }

    function summarizeDependencyAvailability(entries = []) {
        const requiredEntries = entries.filter((entry) => entry.required);
        const missingRequired = requiredEntries.filter((entry) => !entry.available);

        return {
            dependencyCount: entries.length,
            requiredDependencyCount: requiredEntries.length,
            missingRequiredDependencyCount: missingRequired.length,
            isReadyForFutureClimateFieldGeneration: missingRequired.length === 0,
            missingRequiredDependencyIds: missingRequired.map((entry) => entry.dependencyId)
        };
    }

    function describeClimateEnvelopeDependencyAvailability(input = {}) {
        const fields = FIELD_DEPENDENCIES.map((dependency) => checkDependency(input, dependency));
        const intermediateOutputs = INTERMEDIATE_DEPENDENCIES.map((dependency) => checkDependency(input, dependency));
        const records = RECORD_DEPENDENCIES.map((dependency) => checkDependency(input, dependency));
        const allDependencies = [...fields, ...intermediateOutputs, ...records];

        return {
            fields,
            intermediateOutputs,
            records,
            summary: summarizeDependencyAvailability(allDependencies)
        };
    }

    function getClimateEnvelopeSeedHooks(macroSeed = 0) {
        const normalizedSeed = normalizeSeed(macroSeed);
        const namespaces = PLANNED_STAGES.reduce((seedHooks, stage) => {
            const namespace = buildNamespace(stage.seedScope);
            seedHooks[stage.stageId] = {
                namespace,
                seed: deriveSubSeed(normalizedSeed, namespace),
                plannedOutputs: stage.plannedOutputs.slice()
            };
            return seedHooks;
        }, {});

        return {
            rootNamespace: buildNamespace(),
            macroSeed: normalizedSeed,
            stageNamespaces: namespaces
        };
    }

    function materializeLatitudeBandBaselineField(input = {}) {
        const normalizedInput = normalizeInput(input);
        const worldBounds = normalizedInput.worldBounds;
        const width = worldBounds.width;
        const height = worldBounds.height;
        const size = width * height;
        const latitudeNamespace = buildNamespace('latitudeBands');
        const latitudeSeed = deriveSubSeed(normalizedInput.macroSeed, latitudeNamespace);
        const axialTiltBias = roundFieldValue(0.94 + (deterministicUnitNoise(latitudeSeed, 'axialTiltBias') * 0.12));
        const equatorOffset = roundFieldValue((deterministicUnitNoise(latitudeSeed, 'equatorOffset') - 0.5) * 0.04);
        const values = [];
        const rowBands = [];
        const bandCounts = {};

        for (let y = 0; y < height; y += 1) {
            const normalizedLatitude = height <= 1 ? 0.5 : y / (height - 1);
            const adjustedLatitude = clampUnitInterval(normalizedLatitude + equatorOffset, normalizedLatitude);
            const distanceFromEquator = clampUnitInterval(Math.abs(adjustedLatitude - 0.5) * 2);
            const thermalBaseline = clampUnitInterval(1 - (Math.pow(distanceFromEquator, 1.18) * axialTiltBias));
            const band = getLatitudeBaselineBand(adjustedLatitude);
            const roundedThermalBaseline = roundFieldValue(thermalBaseline);
            const roundedWetnessHint = roundFieldValue(band.wetnessAnchorHint);
            const roundedSeasonalityHint = roundFieldValue(band.seasonalityAnchorHint);

            bandCounts[band.bandId] = (bandCounts[band.bandId] || 0) + width;
            rowBands.push({
                y,
                normalizedLatitude: roundFieldValue(normalizedLatitude),
                adjustedLatitude: roundFieldValue(adjustedLatitude),
                bandId: band.bandId,
                bandType: band.bandType,
                thermalBaseline: roundedThermalBaseline,
                temperatureBias: roundFieldValue((roundedThermalBaseline + band.temperatureBias) / 2),
                wetnessAnchorHint: roundedWetnessHint,
                seasonalityAnchorHint: roundedSeasonalityHint
            });

            for (let x = 0; x < width; x += 1) {
                values.push(roundedThermalBaseline);
            }
        }

        return {
            fieldType: 'ScalarField',
            fieldId: LATITUDE_BAND_BASELINE_FIELD_ID,
            stageId: LATITUDE_BAND_STAGE_ID,
            modelId: LATITUDE_BAND_MODEL_ID,
            deterministic: true,
            seedNamespace: latitudeNamespace,
            seed: latitudeSeed,
            sourceFieldIds: [],
            worldBounds: cloneValue(worldBounds),
            width,
            height,
            size,
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: LATITUDE_BAND_VALUE_ENCODING,
            values,
            stats: buildScalarFieldStats(values),
            axialTiltBias,
            equatorOffset,
            rowBands,
            summary: {
                bandModel: 'coarse_latitude_thermal_baseline',
                bandCounts,
                coordinateConvention: 'y=0 north, y=height-1 south',
                valueMeaning: '0=cold_polar_baseline,1=warm_equatorial_baseline'
            },
            compatibility: {
                futureTemperatureColdLoadInput: true,
                futureWetnessLayerInput: true,
                futureClimateBandClassificationInput: true,
                windGenerationOutput: false,
                finalClimateZoneOutput: false,
                gameplayWeatherOutput: false,
                rendererAgnostic: true
            },
            intentionallyAbsent: [
                'windFieldMutation',
                'humidityTransportField',
                'wetnessField',
                'temperatureColdLoadField',
                'climateZoneClassification',
                'climateBands',
                'gameplayWeatherSystems',
                'terrainCells'
            ]
        };
    }

    function materializePrevailingWindField(input = {}) {
        const normalizedInput = normalizeInput(input);
        const worldBounds = normalizedInput.worldBounds;
        const width = worldBounds.width;
        const height = worldBounds.height;
        const size = width * height;
        const windNamespace = buildNamespace('prevailingWind');
        const windSeed = deriveSubSeed(normalizedInput.macroSeed, windNamespace);
        const xValues = [];
        const yValues = [];
        const magnitudeValues = [];
        const bandCounts = {};

        for (let y = 0; y < height; y += 1) {
            const normalizedY = height <= 1 ? 0.5 : y / (height - 1);
            const band = getLatitudeWindBand(normalizedY);
            bandCounts[band.bandId] = (bandCounts[band.bandId] || 0) + width;

            for (let x = 0; x < width; x += 1) {
                const normalizedX = width <= 1 ? 0.5 : x / (width - 1);
                const latWave = Math.sin((normalizedY * TAU * 2) + (deterministicUnitNoise(windSeed, y, 'lat') * TAU));
                const longWave = Math.cos((normalizedX * TAU) + (deterministicUnitNoise(windSeed, x, 'lon') * TAU));
                const cellNudgeX = (deterministicUnitNoise(windSeed, x, y, 'x') - 0.5) * 0.12;
                const cellNudgeY = (deterministicUnitNoise(windSeed, x, y, 'y') - 0.5) * 0.08;
                const rawX = band.baseX + (longWave * 0.12) + cellNudgeX;
                const rawY = band.meridionalFlow + (latWave * 0.08) + cellNudgeY;
                const vector = normalizeVector(rawX, rawY);
                const magnitude = clampUnitInterval(
                    0.58 + (Math.abs(band.baseX) * 0.22) + (Math.abs(band.meridionalFlow) * 0.18)
                );

                xValues.push(roundFieldValue(vector.x));
                yValues.push(roundFieldValue(vector.y));
                magnitudeValues.push(roundFieldValue(magnitude));
            }
        }

        const stats = buildDirectionalFieldStats(xValues, yValues, magnitudeValues);

        return {
            fieldType: 'DirectionalField',
            fieldId: PREVAILING_WIND_FIELD_ID,
            stageId: PREVAILING_WIND_STAGE_ID,
            modelId: PREVAILING_WIND_MODEL_ID,
            deterministic: true,
            seedNamespace: windNamespace,
            seed: windSeed,
            sourceFieldIds: [],
            worldBounds: cloneValue(worldBounds),
            width,
            height,
            size,
            vectorEncoding: PREVAILING_WIND_VECTOR_ENCODING,
            magnitudeEncoding: PREVAILING_WIND_MAGNITUDE_ENCODING,
            xValues,
            yValues,
            magnitudeValues,
            stats,
            summary: {
                bandModel: 'coarse_latitude_belts',
                bandCounts,
                meanFlowHint: xValues.length
                    ? (stats.meanX >= 0 ? 'eastward_bias' : 'westward_bias')
                    : 'none',
                coordinateConvention: 'x=eastward_positive,y=southward_positive'
            },
            compatibility: {
                futureHumidityTransportInput: true,
                futureStormCorridorInput: true,
                futureClimateBandInput: true,
                oceanCurrentSimulationOutput: false,
                gameplayWeatherOutput: false,
                rendererAgnostic: true
            },
            intentionallyAbsent: [
                'humidityTransportField',
                'oceanCurrentSimulation',
                'rainShadowEffect',
                'stormCorridorField',
                'gameplayWeatherSystems',
                'terrainCells'
            ]
        };
    }

    function materializeHumidityTransportFields(input = {}, baseFields = {}) {
        const normalizedInput = normalizeInput(input);
        const worldBounds = normalizedInput.worldBounds;
        const width = worldBounds.width;
        const height = worldBounds.height;
        const size = width * height;
        const humidityNamespace = buildNamespace('humidityTransport');
        const humiditySeed = deriveSubSeed(normalizedInput.macroSeed, humidityNamespace);
        const latitudeField = baseFields.latitudeBandBaselineField
            || materializeLatitudeBandBaselineField(input);
        const windField = baseFields.prevailingWindField
            || materializePrevailingWindField(input);
        const oceanConnectivityMaskField = findInputField(input, 'oceanConnectivityMaskField');
        const coastalShelfDepthField = findInputField(input, 'coastalShelfDepthField');
        const marineInvasionField = findInputField(input, 'marineInvasionField');
        const hydrosphereSourceFields = [
            oceanConnectivityMaskField,
            coastalShelfDepthField,
            marineInvasionField
        ].filter(Boolean);
        const hydrosphereSourceFieldIds = hydrosphereSourceFields.map((field) => field.fieldId);
        const hydrosphereContextAvailable = Boolean(oceanConnectivityMaskField);
        const hasHydrosphereMoistureSource = hydrosphereSourceFields.length > 0;
        const localSourceValues = new Array(size).fill(0);
        const humidityValues = new Array(size).fill(0);
        const wetnessValues = new Array(size).fill(0);
        const fetchStepCount = 4;
        let marineInfluencedCellCount = 0;
        let shelfInfluencedCellCount = 0;
        let transportedMoistureCellCount = 0;
        let wetCellCount = 0;

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const index = y * width + x;
                const latitudeWarmth = readScalarFieldValue(latitudeField, x, y, worldBounds, 0.5);
                const oceanExposure = readScalarFieldValue(oceanConnectivityMaskField, x, y, worldBounds, 0);
                const shelfExposure = readScalarFieldValue(coastalShelfDepthField, x, y, worldBounds, 0);
                const marinePenetration = readScalarFieldValue(marineInvasionField, x, y, worldBounds, 0);
                const source = clampUnitInterval(
                    ((oceanExposure * 0.56) + (shelfExposure * 0.24) + (marinePenetration * 0.2))
                    * (0.48 + (latitudeWarmth * 0.52)),
                    0
                );

                localSourceValues[index] = source;
                if (marinePenetration > 0.05) {
                    marineInfluencedCellCount += 1;
                }
                if (shelfExposure > 0.05) {
                    shelfInfluencedCellCount += 1;
                }
            }
        }

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const index = y * width + x;
                const wind = readDirectionalFieldVector(windField, x, y, worldBounds);
                const latitudeWarmth = readScalarFieldValue(latitudeField, x, y, worldBounds, 0.5);
                const localSource = localSourceValues[index];
                let weightedMoisture = localSource * 0.5;
                let totalWeight = 0.5;

                for (let step = 1; step <= fetchStepCount; step += 1) {
                    const sampleX = Math.max(0, Math.min(width - 1, Math.round(x - (wind.x * step))));
                    const sampleY = Math.max(0, Math.min(height - 1, Math.round(y - (wind.y * step))));
                    const sampleIndex = sampleY * width + sampleX;
                    const windFetchWeight = Math.pow(0.68, step) * (0.75 + (wind.magnitude * 0.25));
                    weightedMoisture += localSourceValues[sampleIndex] * windFetchWeight;
                    totalWeight += windFetchWeight;
                }

                const transportNoise = hasHydrosphereMoistureSource
                    ? (deterministicUnitNoise(humiditySeed, x, y, 'humidity') - 0.5) * 0.025
                    : 0;
                const humidity = roundFieldValue(clampUnitInterval(
                    (weightedMoisture / Math.max(0.000001, totalWeight)) + transportNoise,
                    0
                ));
                const latitudeWetnessBaseline = hasHydrosphereMoistureSource ? latitudeWarmth * 0.12 : 0;
                const wetness = roundFieldValue(clampUnitInterval(
                    (humidity * 0.72) + (localSource * 0.16) + latitudeWetnessBaseline,
                    0
                ));

                humidityValues[index] = humidity;
                wetnessValues[index] = wetness;
                if (humidity > 0.1) {
                    transportedMoistureCellCount += 1;
                }
                if (wetness > 0.35) {
                    wetCellCount += 1;
                }
            }
        }

        const commonSourceFieldIds = [
            latitudeField.fieldId,
            windField.fieldId,
            ...hydrosphereSourceFieldIds
        ].filter(Boolean);
        const humidityTransportField = {
            fieldType: 'ScalarField',
            fieldId: HUMIDITY_TRANSPORT_FIELD_ID,
            stageId: HUMIDITY_TRANSPORT_STAGE_ID,
            modelId: HUMIDITY_TRANSPORT_MODEL_ID,
            deterministic: true,
            seedNamespace: humidityNamespace,
            seed: humiditySeed,
            sourceFieldIds: commonSourceFieldIds,
            worldBounds: cloneValue(worldBounds),
            width,
            height,
            size,
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: HUMIDITY_TRANSPORT_VALUE_ENCODING,
            values: humidityValues,
            stats: buildScalarFieldStats(humidityValues),
            summary: {
                transportModel: 'deterministic_upwind_fetch_from_hydrosphere_context',
                fetchStepCount,
                hydrosphereContextAvailable,
                hasHydrosphereMoistureSource,
                hydrosphereSourceFieldIds,
                localSourceStats: buildScalarFieldStats(localSourceValues),
                marineInfluencedCellCount,
                shelfInfluencedCellCount,
                transportedMoistureCellCount,
                valueMeaning: '0=dry/no hydrosphere fetch,1=strong wind-carried moisture availability',
                coordinateConvention: 'row-major x=east,y=south; upwind samples against prevailingWindField vectors'
            },
            compatibility: {
                futureWetnessFieldInput: true,
                futureRainShadowInput: true,
                futureClimateBandInput: true,
                sameWorldBoundsRequired: true,
                rainShadowApplied: false,
                climateClassificationOutput: false,
                gameplayWeatherOutput: false,
                rendererAgnostic: true
            },
            intentionallyAbsent: [
                'rainShadowEffect',
                'temperatureColdLoadField',
                'climateZoneClassification',
                'climateBands',
                'stormCorridorField',
                'oceanCurrentSimulation',
                'gameplayWeatherSystems',
                'terrainCells'
            ]
        };
        const wetnessField = {
            fieldType: 'ScalarField',
            fieldId: WETNESS_FIELD_ID,
            stageId: HUMIDITY_TRANSPORT_STAGE_ID,
            modelId: PRE_RAIN_SHADOW_WETNESS_MODEL_ID,
            deterministic: true,
            seedNamespace: humidityNamespace,
            seed: humiditySeed,
            sourceFieldIds: [
                HUMIDITY_TRANSPORT_FIELD_ID,
                ...commonSourceFieldIds
            ],
            worldBounds: cloneValue(worldBounds),
            width,
            height,
            size,
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: WETNESS_FIELD_VALUE_ENCODING,
            values: wetnessValues,
            stats: buildScalarFieldStats(wetnessValues),
            summary: {
                wetnessModel: 'prepared_humidity_latitude_baseline',
                hydrosphereContextAvailable,
                hasHydrosphereMoistureSource,
                sourceFieldIds: [
                    HUMIDITY_TRANSPORT_FIELD_ID,
                    ...commonSourceFieldIds
                ],
                wetCellCount,
                valueMeaning: '0=dry baseline,1=wet internal pre-adjustment basis for rain-shadow and climate-band classification'
            },
            compatibility: {
                futureClimateBandInput: true,
                futureRainShadowAdjustedWetnessInput: true,
                sameWorldBoundsRequired: true,
                rainShadowApplied: false,
                finalClimateZoneOutput: false,
                gameplayWeatherOutput: false,
                rendererAgnostic: true
            },
            intentionallyAbsent: [
                'rainShadowEffect',
                'climateZoneClassification',
                'climateBands',
                'biomeEnvelope',
                'gameplayWeatherSystems',
                'terrainCells'
            ]
        };

        return {
            humidityTransportField,
            wetnessField
        };
    }

    function materializeRainShadowEffect(input = {}, baseFields = {}) {
        const normalizedInput = normalizeInput(input);
        const worldBounds = normalizedInput.worldBounds;
        const width = worldBounds.width;
        const height = worldBounds.height;
        const size = width * height;
        const rainShadowNamespace = buildNamespace('rainShadow');
        const rainShadowSeed = deriveSubSeed(normalizedInput.macroSeed, rainShadowNamespace);
        const windField = baseFields.prevailingWindField || materializePrevailingWindField(input);
        const humidityTransportField = baseFields.humidityTransportField
            || materializeHumidityTransportFields(input, {
                prevailingWindField: windField
            }).humidityTransportField;
        const baseWetnessField = baseFields.wetnessField
            || materializeHumidityTransportFields(input, {
                prevailingWindField: windField
            }).wetnessField;
        const mountainAmplificationField = findInputField(input, 'mountainAmplificationField');
        const seaLevelAppliedElevationField = findInputField(input, 'seaLevelAppliedElevationField');
        const landmassCleanupMaskField = findInputField(input, 'landmassCleanupMaskField');
        const mountainSystems = findInputRecordCollection(input, 'mountainSystems');
        const mountainSystemIds = extractRecordIds(mountainSystems, [
            'mountainSystemId',
            'recordId',
            'id'
        ]);
        const sourceFieldIds = [
            humidityTransportField.fieldId,
            baseWetnessField.fieldId,
            windField.fieldId,
            mountainAmplificationField && mountainAmplificationField.fieldId,
            seaLevelAppliedElevationField && seaLevelAppliedElevationField.fieldId,
            landmassCleanupMaskField && landmassCleanupMaskField.fieldId
        ].filter(Boolean);
        const barrierValues = new Array(size).fill(0);
        const shadowValues = new Array(size).fill(0);
        const orographicBoostValues = new Array(size).fill(0);
        const adjustedWetnessValues = new Array(size).fill(0);
        const sampleStepCount = 6;
        const hasOrographicSpatialSource = Boolean(mountainAmplificationField || seaLevelAppliedElevationField);
        const hasOrographicSource = hasOrographicSpatialSource || mountainSystems.length > 0;
        let shadowedCellCount = 0;
        let boostedCellCount = 0;

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const index = y * width + x;
                const mountainStrength = readScalarFieldValue(mountainAmplificationField, x, y, worldBounds, 0);
                const elevation = readScalarFieldValue(seaLevelAppliedElevationField, x, y, worldBounds, 0);
                const landMask = readScalarFieldValue(
                    landmassCleanupMaskField,
                    x,
                    y,
                    worldBounds,
                    elevation > 0.5 ? 1 : 0
                );
                const highElevationBias = clampUnitInterval((elevation - 0.58) / 0.42, 0);

                barrierValues[index] = roundFieldValue(clampUnitInterval(
                    landMask > 0.35
                        ? (mountainStrength * 0.72) + (highElevationBias * 0.28)
                        : 0,
                    0
                ));
            }
        }

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const index = y * width + x;
                const wind = readDirectionalFieldVector(windField, x, y, worldBounds);
                const humidity = readScalarFieldValue(humidityTransportField, x, y, worldBounds, 0);
                const baseWetness = readScalarFieldValue(baseWetnessField, x, y, worldBounds, 0);
                const localBarrier = barrierValues[index];
                let weightedBarrier = 0;
                let totalWeight = 0;

                for (let step = 1; step <= sampleStepCount; step += 1) {
                    const sampleX = Math.max(0, Math.min(width - 1, Math.round(x - (wind.x * step))));
                    const sampleY = Math.max(0, Math.min(height - 1, Math.round(y - (wind.y * step))));
                    const sampleIndex = sampleY * width + sampleX;
                    const weight = Math.pow(0.7, step) * (0.72 + (wind.magnitude * 0.28));
                    weightedBarrier += barrierValues[sampleIndex] * weight;
                    totalWeight += weight;
                }

                const upwindBarrier = totalWeight > 0 ? weightedBarrier / totalWeight : 0;
                const seedNudge = hasOrographicSpatialSource
                    ? (deterministicUnitNoise(rainShadowSeed, x, y, 'shadow') - 0.5) * 0.015
                    : 0;
                const shadow = roundFieldValue(clampUnitInterval(
                    (upwindBarrier * (1 - (localBarrier * 0.45)) * (0.58 + (wind.magnitude * 0.42))) + seedNudge,
                    0
                ));
                const orographicBoost = roundFieldValue(clampUnitInterval(localBarrier * humidity * 0.16, 0));
                const adjustedWetness = roundFieldValue(clampUnitInterval(
                    baseWetness - (shadow * 0.38) + orographicBoost,
                    0
                ));

                shadowValues[index] = shadow;
                orographicBoostValues[index] = orographicBoost;
                adjustedWetnessValues[index] = adjustedWetness;
                if (shadow > 0.08) {
                    shadowedCellCount += 1;
                }
                if (orographicBoost > 0.03) {
                    boostedCellCount += 1;
                }
            }
        }

        const rainShadowEffect = {
            effectId: RAIN_SHADOW_EFFECT_ID,
            stageId: RAIN_SHADOW_STAGE_ID,
            modelId: RAIN_SHADOW_MODEL_ID,
            deterministic: true,
            seedNamespace: rainShadowNamespace,
            seed: rainShadowSeed,
            sourceFieldIds,
            sourceRecordIds: mountainSystemIds,
            worldBounds: cloneValue(worldBounds),
            width,
            height,
            size,
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: RAIN_SHADOW_VALUE_ENCODING,
            values: shadowValues,
            barrierValues,
            orographicBoostValues,
            adjustedWetnessValues,
            stats: buildScalarFieldStats(shadowValues),
            barrierStats: buildScalarFieldStats(barrierValues),
            boostStats: buildScalarFieldStats(orographicBoostValues),
            adjustedWetnessStats: buildScalarFieldStats(adjustedWetnessValues),
            summary: {
                effectModel: 'deterministic_upwind_orographic_shadow',
                sampleStepCount,
                hasOrographicSource,
                hasOrographicSpatialSource,
                mountainSystemIds,
                shadowedCellCount,
                boostedCellCount,
                valueMeaning: '0=no drying shadow,1=strong leeward drying effect',
                adjustedWetnessMeaning: 'wetnessField values after rain-shadow drying and local orographic boost'
            },
            compatibility: {
                wetnessFieldAdjustmentInput: true,
                futureClimateBandInput: true,
                sameWorldBoundsRequired: true,
                finalClimateZoneOutput: false,
                biomeEnvelopeOutput: false,
                gameplayWeatherOutput: false,
                rendererAgnostic: true
            },
            intentionallyAbsent: [
                'climateZoneClassification',
                'climateBands',
                'biomeEnvelope',
                'terrainCells',
                'gameplayWeatherSystems'
            ]
        };
        const wetnessField = {
            ...cloneValue(baseWetnessField),
            modelId: WETNESS_FIELD_MODEL_ID,
            stageId: RAIN_SHADOW_STAGE_ID,
            seedNamespace: rainShadowNamespace,
            seed: rainShadowSeed,
            sourceFieldIds: [
                RAIN_SHADOW_EFFECT_ID,
                ...sourceFieldIds.filter((fieldId) => fieldId !== WETNESS_FIELD_ID)
            ].filter(Boolean),
            values: adjustedWetnessValues,
            stats: buildScalarFieldStats(adjustedWetnessValues),
            summary: {
                ...cloneValue(baseWetnessField.summary || {}),
                wetnessModel: 'rain_shadow_adjusted_humidity_latitude_baseline',
                rainShadowEffectId: RAIN_SHADOW_EFFECT_ID,
                rainShadowApplied: true,
                shadowedCellCount,
                boostedCellCount,
                valueMeaning: '0=dry baseline,1=wet baseline after rain-shadow adjustment before climate-band classification'
            },
            compatibility: {
                ...cloneValue(baseWetnessField.compatibility || {}),
                futureRainShadowAdjustedWetnessInput: false,
                rainShadowApplied: true,
                finalClimateZoneOutput: false,
                biomeEnvelopeOutput: false,
                gameplayWeatherOutput: false,
                rendererAgnostic: true
            },
            intentionallyAbsent: [
                'climateZoneClassification',
                'climateBands',
                'biomeEnvelope',
                'gameplayWeatherSystems',
                'terrainCells'
            ]
        };

        return {
            rainShadowEffect,
            wetnessField
        };
    }

    function materializeTemperatureColdLoadField(input = {}, baseFields = {}) {
        const normalizedInput = normalizeInput(input);
        const worldBounds = normalizedInput.worldBounds;
        const width = worldBounds.width;
        const height = worldBounds.height;
        const size = width * height;
        const temperatureNamespace = buildNamespace('temperatureColdLoad');
        const temperatureSeed = deriveSubSeed(normalizedInput.macroSeed, temperatureNamespace);
        const latitudeBandBaselineField = baseFields.latitudeBandBaselineField
            || materializeLatitudeBandBaselineField(input);
        const seaLevelAppliedElevationField = findInputField(input, 'seaLevelAppliedElevationField');
        const landmassCleanupMaskField = findInputField(input, 'landmassCleanupMaskField');
        const mountainAmplificationField = findInputField(input, 'mountainAmplificationField');
        const basinDepressionField = findInputField(input, 'basinDepressionField');
        const oceanConnectivityMaskField = findInputField(input, 'oceanConnectivityMaskField');
        const coastalShelfDepthField = findInputField(input, 'coastalShelfDepthField');
        const sourceFieldIds = [
            latitudeBandBaselineField.fieldId,
            seaLevelAppliedElevationField && seaLevelAppliedElevationField.fieldId,
            landmassCleanupMaskField && landmassCleanupMaskField.fieldId,
            mountainAmplificationField && mountainAmplificationField.fieldId,
            basinDepressionField && basinDepressionField.fieldId,
            oceanConnectivityMaskField && oceanConnectivityMaskField.fieldId,
            coastalShelfDepthField && coastalShelfDepthField.fieldId
        ].filter(Boolean);
        const maritimeContextAvailable = Boolean(oceanConnectivityMaskField || coastalShelfDepthField);
        const values = new Array(size).fill(0);
        const coldLoadValues = new Array(size).fill(0);
        const elevationPenaltyValues = new Array(size).fill(0);
        const maritimeModerationValues = new Array(size).fill(0);
        let warmCellCount = 0;
        let coldHeavyCellCount = 0;
        let alpineCellCount = 0;
        let maritimeModeratedCellCount = 0;

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const index = y * width + x;
                const latitudeWarmth = readScalarFieldValue(latitudeBandBaselineField, x, y, worldBounds, 0.5);
                const elevation = readScalarFieldValue(seaLevelAppliedElevationField, x, y, worldBounds, 0);
                const landMask = readScalarFieldValue(
                    landmassCleanupMaskField,
                    x,
                    y,
                    worldBounds,
                    elevation > 0.5 ? 1 : 0
                );
                const mountainStrength = readScalarFieldValue(mountainAmplificationField, x, y, worldBounds, 0);
                const basinRetention = readScalarFieldValue(basinDepressionField, x, y, worldBounds, 0);
                const oceanExposure = readScalarFieldValue(
                    oceanConnectivityMaskField,
                    x,
                    y,
                    worldBounds,
                    landMask > 0.35 ? 0 : 1
                );
                const shelfExposure = readScalarFieldValue(coastalShelfDepthField, x, y, worldBounds, 0);
                const maritimeModeration = clampUnitInterval(
                    landMask > 0.35
                        ? ((oceanExposure * 0.68) + (shelfExposure * 0.32)) * 0.7
                        : (oceanExposure * 0.82) + (shelfExposure * 0.18),
                    0
                );
                const elevationPenalty = clampUnitInterval(
                    landMask > 0.35
                        ? (Math.max(0, elevation - 0.54) / 0.46) * (0.72 + (mountainStrength * 0.28))
                        : (Math.max(0, elevation - 0.64) / 0.36) * 0.35,
                    0
                );
                const continentalColdBias = clampUnitInterval(
                    landMask > 0.35
                        ? ((1 - oceanExposure) * 0.7) + ((1 - shelfExposure) * 0.3)
                        : 0,
                    0
                );
                const basinColdBias = landMask > 0.35
                    ? basinRetention * (0.04 + ((1 - latitudeWarmth) * 0.12))
                    : 0;
                const seedNudge = (deterministicUnitNoise(temperatureSeed, x, y, 'temperature') - 0.5) * 0.02;
                const temperature = roundFieldValue(clampUnitInterval(
                    latitudeWarmth
                    - (elevationPenalty * 0.52)
                    - (continentalColdBias * 0.08)
                    - basinColdBias
                    + (maritimeModeration * 0.1)
                    + seedNudge,
                    0
                ));
                const coldLoad = roundFieldValue(clampUnitInterval(
                    ((1 - temperature) * 0.72)
                    + (elevationPenalty * 0.18)
                    + (continentalColdBias * 0.07)
                    + (basinColdBias * 0.12)
                    + (mountainStrength * landMask * 0.06)
                    - (maritimeModeration * 0.08),
                    0
                ));

                values[index] = temperature;
                coldLoadValues[index] = coldLoad;
                elevationPenaltyValues[index] = roundFieldValue(elevationPenalty);
                maritimeModerationValues[index] = roundFieldValue(maritimeModeration);

                if (temperature >= 0.65) {
                    warmCellCount += 1;
                }
                if (coldLoad >= 0.65) {
                    coldHeavyCellCount += 1;
                }
                if (elevationPenalty >= 0.25) {
                    alpineCellCount += 1;
                }
                if (maritimeModeration >= 0.2) {
                    maritimeModeratedCellCount += 1;
                }
            }
        }

        return {
            fieldType: 'ScalarField',
            fieldId: TEMPERATURE_COLD_LOAD_FIELD_ID,
            stageId: TEMPERATURE_COLD_LOAD_STAGE_ID,
            modelId: TEMPERATURE_COLD_LOAD_MODEL_ID,
            deterministic: true,
            seedNamespace: temperatureNamespace,
            seed: temperatureSeed,
            sourceFieldIds,
            worldBounds: cloneValue(worldBounds),
            width,
            height,
            size,
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: TEMPERATURE_COLD_LOAD_VALUE_ENCODING,
            values,
            coldLoadValues,
            elevationPenaltyValues,
            maritimeModerationValues,
            stats: buildScalarFieldStats(values),
            coldLoadStats: buildScalarFieldStats(coldLoadValues),
            summary: {
                temperatureModel: 'latitude_elevation_maritime_cold_load_baseline',
                maritimeContextAvailable,
                sourceFieldIds,
                warmCellCount,
                coldHeavyCellCount,
                alpineCellCount,
                maritimeModeratedCellCount,
                temperatureMeaning: 'values[] where 0=very cold and 1=very warm baseline before climate-band classification',
                coldLoadMeaning: 'coldLoadValues[] where 0=low cold burden and 1=high cold burden'
            },
            compatibility: {
                futureClimateBandInput: true,
                futureWetnessBandInput: false,
                futureSeasonalityInput: true,
                sameWorldBoundsRequired: true,
                finalClimateZoneOutput: false,
                gameplayWeatherOutput: false,
                rendererAgnostic: true
            },
            intentionallyAbsent: [
                'wetnessBands',
                'seasonalityField',
                'stormCorridorField',
                'climateZoneClassification',
                'climateBands',
                'biomeEnvelope',
                'gameplayWeatherSystems',
                'terrainCells',
                'uiOverlays'
            ]
        };
    }

    function materializeStormCorridorField(input = {}, baseFields = {}) {
        const normalizedInput = normalizeInput(input);
        const worldBounds = normalizedInput.worldBounds;
        const width = worldBounds.width;
        const height = worldBounds.height;
        const size = width * height;
        const stormNamespace = buildNamespace('stormDecaySeasonality');
        const stormSeed = deriveSubSeed(normalizedInput.macroSeed, stormNamespace);
        const latitudeBandBaselineField = baseFields.latitudeBandBaselineField
            || materializeLatitudeBandBaselineField(input);
        const prevailingWindField = baseFields.prevailingWindField
            || materializePrevailingWindField(input);
        const humidityTransportField = baseFields.humidityTransportField
            || materializeHumidityTransportFields(input, {
                latitudeBandBaselineField,
                prevailingWindField
            }).humidityTransportField;
        const temperatureColdLoadField = baseFields.temperatureColdLoadField
            || materializeTemperatureColdLoadField(input, {
                latitudeBandBaselineField
            });
        const wetnessField = baseFields.wetnessField
            || materializeRainShadowEffect(input, {
                prevailingWindField,
                humidityTransportField,
                wetnessField: materializeHumidityTransportFields(input, {
                    latitudeBandBaselineField,
                    prevailingWindField
                }).wetnessField
            }).wetnessField;
        const oceanConnectivityMaskField = findInputField(input, 'oceanConnectivityMaskField');
        const coastalShelfDepthField = findInputField(input, 'coastalShelfDepthField');
        const marineInvasionField = findInputField(input, 'marineInvasionField');
        const landmassCleanupMaskField = findInputField(input, 'landmassCleanupMaskField');
        const sourceFieldIds = [
            prevailingWindField.fieldId,
            humidityTransportField.fieldId,
            temperatureColdLoadField.fieldId,
            wetnessField.fieldId,
            oceanConnectivityMaskField && oceanConnectivityMaskField.fieldId,
            coastalShelfDepthField && coastalShelfDepthField.fieldId,
            marineInvasionField && marineInvasionField.fieldId,
            landmassCleanupMaskField && landmassCleanupMaskField.fieldId
        ].filter(Boolean);
        const maritimeContextAvailable = Boolean(
            oceanConnectivityMaskField
            || coastalShelfDepthField
            || marineInvasionField
        );
        const values = new Array(size).fill(0);
        const basePotentialValues = new Array(size).fill(0);
        const continuityValues = new Array(size).fill(0);
        const maritimeExposureValues = new Array(size).fill(0);
        const sampleStepCount = 5;
        let activeCorridorCellCount = 0;
        let severeCorridorCellCount = 0;
        let maritimeExposedCellCount = 0;
        let landfallRiskCellCount = 0;

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const index = y * width + x;
                const wind = readDirectionalFieldVector(prevailingWindField, x, y, worldBounds);
                const humidity = readScalarFieldValue(humidityTransportField, x, y, worldBounds, 0);
                const wetness = readScalarFieldValue(wetnessField, x, y, worldBounds, 0);
                const temperature = readScalarFieldValue(temperatureColdLoadField, x, y, worldBounds, 0.5);
                const coldLoad = readScalarFieldChannelValue(
                    temperatureColdLoadField,
                    'coldLoadValues',
                    x,
                    y,
                    worldBounds,
                    0.5
                );
                const landMask = readScalarFieldValue(
                    landmassCleanupMaskField,
                    x,
                    y,
                    worldBounds,
                    temperature > 0.45 ? 1 : 0
                );
                const oceanExposure = readScalarFieldValue(
                    oceanConnectivityMaskField,
                    x,
                    y,
                    worldBounds,
                    landMask > 0.35 ? 0 : 1
                );
                const shelfExposure = readScalarFieldValue(coastalShelfDepthField, x, y, worldBounds, 0);
                const marinePenetration = readScalarFieldValue(marineInvasionField, x, y, worldBounds, 0);
                const maritimeExposure = clampUnitInterval(
                    landMask > 0.35
                        ? ((oceanExposure * 0.48) + (shelfExposure * 0.24) + (marinePenetration * 0.28)) * 0.78
                        : (oceanExposure * 0.72) + (shelfExposure * 0.14) + (marinePenetration * 0.14),
                    0
                );
                const frontalInstability = clampUnitInterval(
                    (1 - (Math.abs(temperature - 0.48) / 0.48))
                    * (0.58 + (humidity * 0.22) + (wind.magnitude * 0.2)),
                    0
                );
                const convectivePotential = clampUnitInterval(
                    (Math.max(0, temperature - 0.58) / 0.42)
                    * (0.44 + (maritimeExposure * 0.56))
                    * (0.5 + (humidity * 0.5))
                    * (0.45 + (wind.magnitude * 0.55))
                    * (1 - (coldLoad * 0.35)),
                    0
                );
                const rawPotential = clampUnitInterval(
                    (humidity * 0.24)
                    + (wetness * 0.18)
                    + (wind.magnitude * 0.2)
                    + (maritimeExposure * 0.16)
                    + (frontalInstability * 0.12)
                    + (convectivePotential * 0.1),
                    0
                );
                const exposureWeight = landMask > 0.35
                    ? (0.34 + (maritimeExposure * 0.66))
                    : (0.72 + (maritimeExposure * 0.28));
                const basePotential = roundFieldValue(clampUnitInterval(rawPotential * exposureWeight, 0));

                basePotentialValues[index] = basePotential;
                maritimeExposureValues[index] = roundFieldValue(maritimeExposure);

                if (maritimeExposure >= 0.2) {
                    maritimeExposedCellCount += 1;
                }
            }
        }

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const index = y * width + x;
                const wind = readDirectionalFieldVector(prevailingWindField, x, y, worldBounds);
                const landMask = readScalarFieldValue(
                    landmassCleanupMaskField,
                    x,
                    y,
                    worldBounds,
                    maritimeExposureValues[index] < 0.2 ? 1 : 0
                );
                let weightedContinuity = basePotentialValues[index] * 0.6;
                let totalWeight = 0.6;

                for (let step = 1; step <= sampleStepCount; step += 1) {
                    const upwindX = Math.max(0, Math.min(width - 1, Math.round(x - (wind.x * step))));
                    const upwindY = Math.max(0, Math.min(height - 1, Math.round(y - (wind.y * step))));
                    const downwindX = Math.max(0, Math.min(width - 1, Math.round(x + (wind.x * step))));
                    const downwindY = Math.max(0, Math.min(height - 1, Math.round(y + (wind.y * step))));
                    const upwindIndex = upwindY * width + upwindX;
                    const downwindIndex = downwindY * width + downwindX;
                    const weight = Math.pow(0.72, step) * (0.76 + (wind.magnitude * 0.24));

                    weightedContinuity += ((basePotentialValues[upwindIndex] + basePotentialValues[downwindIndex]) * 0.5) * weight;
                    totalWeight += weight;
                }

                const continuity = roundFieldValue(clampUnitInterval(
                    totalWeight > 0 ? weightedContinuity / totalWeight : basePotentialValues[index],
                    0
                ));
                const seedNudge = maritimeContextAvailable
                    ? (deterministicUnitNoise(stormSeed, x, y, 'corridor') - 0.5) * 0.018
                    : 0;
                const corridor = roundFieldValue(clampUnitInterval(
                    (
                        (basePotentialValues[index] * 0.56)
                        + (continuity * 0.32)
                        + (maritimeExposureValues[index] * 0.12)
                    )
                    * (0.45 + (wind.magnitude * 0.55))
                    + seedNudge,
                    0
                ));

                continuityValues[index] = continuity;
                values[index] = corridor;

                if (corridor >= 0.42) {
                    activeCorridorCellCount += 1;
                }
                if (corridor >= 0.68) {
                    severeCorridorCellCount += 1;
                }
                if (landMask > 0.35 && corridor >= 0.45) {
                    landfallRiskCellCount += 1;
                }
            }
        }

        return {
            fieldType: 'ScalarField',
            fieldId: STORM_CORRIDOR_FIELD_ID,
            stageId: STORM_AND_DECAY_STAGE_ID,
            modelId: STORM_CORRIDOR_MODEL_ID,
            deterministic: true,
            seedNamespace: stormNamespace,
            seed: stormSeed,
            sourceFieldIds,
            worldBounds: cloneValue(worldBounds),
            width,
            height,
            size,
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: STORM_CORRIDOR_VALUE_ENCODING,
            values,
            basePotentialValues,
            continuityValues,
            maritimeExposureValues,
            stats: buildScalarFieldStats(values),
            summary: {
                corridorModel: 'wind_humidity_wetness_maritime_storm_corridor_baseline',
                maritimeContextAvailable,
                sourceFieldIds,
                sampleStepCount,
                activeCorridorCellCount,
                severeCorridorCellCount,
                maritimeExposedCellCount,
                landfallRiskCellCount,
                valueMeaning: '0=low storm-corridor pressure,1=high storm-prone corridor pressure for later route-risk and isolation analyzers'
            },
            compatibility: {
                futureRouteRiskInput: true,
                futureIsolationInput: true,
                futureClimateStressInput: true,
                sameWorldBoundsRequired: true,
                routeGraphOutput: false,
                catastropheSystemsOutput: false,
                gameplayWeatherOutput: false,
                rendererAgnostic: true
            },
            intentionallyAbsent: [
                'routeGraph',
                'catastropheSystems',
                'climateZoneClassification',
                'climateBands',
                'biomeEnvelope',
                'gameplayWeatherSystems',
                'terrainCells',
                'uiOverlays'
            ]
        };
    }

    function materializeCoastalDecayBurdenField(input = {}, baseFields = {}) {
        const normalizedInput = normalizeInput(input);
        const worldBounds = normalizedInput.worldBounds;
        const width = worldBounds.width;
        const height = worldBounds.height;
        const size = width * height;
        const decayNamespace = buildNamespace('stormDecaySeasonality');
        const decaySeed = deriveSubSeed(normalizedInput.macroSeed, decayNamespace);
        const stormCorridorField = baseFields.stormCorridorField
            || materializeStormCorridorField(input, baseFields);
        const wetnessField = baseFields.wetnessField
            || materializeRainShadowEffect(input, {
                prevailingWindField: baseFields.prevailingWindField || materializePrevailingWindField(input),
                humidityTransportField: baseFields.humidityTransportField || materializeHumidityTransportFields(input, {
                    latitudeBandBaselineField: baseFields.latitudeBandBaselineField || materializeLatitudeBandBaselineField(input),
                    prevailingWindField: baseFields.prevailingWindField || materializePrevailingWindField(input)
                }).humidityTransportField,
                wetnessField: materializeHumidityTransportFields(input, {
                    latitudeBandBaselineField: baseFields.latitudeBandBaselineField || materializeLatitudeBandBaselineField(input),
                    prevailingWindField: baseFields.prevailingWindField || materializePrevailingWindField(input)
                }).wetnessField
            }).wetnessField;
        const temperatureColdLoadField = baseFields.temperatureColdLoadField
            || materializeTemperatureColdLoadField(input, {
                latitudeBandBaselineField: baseFields.latitudeBandBaselineField || materializeLatitudeBandBaselineField(input)
            });
        const seaLevelAppliedElevationField = findInputField(input, 'seaLevelAppliedElevationField');
        const landmassCleanupMaskField = findInputField(input, 'landmassCleanupMaskField');
        const oceanConnectivityMaskField = findInputField(input, 'oceanConnectivityMaskField');
        const coastalShelfDepthField = findInputField(input, 'coastalShelfDepthField');
        const marineInvasionField = findInputField(input, 'marineInvasionField');
        const sourceFieldIds = [
            stormCorridorField.fieldId,
            wetnessField.fieldId,
            temperatureColdLoadField.fieldId,
            seaLevelAppliedElevationField && seaLevelAppliedElevationField.fieldId,
            landmassCleanupMaskField && landmassCleanupMaskField.fieldId,
            oceanConnectivityMaskField && oceanConnectivityMaskField.fieldId,
            coastalShelfDepthField && coastalShelfDepthField.fieldId,
            marineInvasionField && marineInvasionField.fieldId
        ].filter(Boolean);
        const maritimeContextAvailable = Boolean(
            oceanConnectivityMaskField
            || coastalShelfDepthField
            || marineInvasionField
        );
        const values = new Array(size).fill(0);
        const shorelineExposureValues = new Array(size).fill(0);
        const saltLoadValues = new Array(size).fill(0);
        const wetWearValues = new Array(size).fill(0);
        const freezeThawValues = new Array(size).fill(0);
        let coastalCellCount = 0;
        let heavyDecayCellCount = 0;
        let stormDrivenCellCount = 0;
        let saltDrivenCellCount = 0;
        let freezeThawCellCount = 0;

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const index = y * width + x;
                const landMask = readScalarFieldValue(
                    landmassCleanupMaskField,
                    x,
                    y,
                    worldBounds,
                    0
                );

                if (landMask <= 0.35) {
                    continue;
                }

                const elevation = readScalarFieldValue(seaLevelAppliedElevationField, x, y, worldBounds, 0);
                const stormPressure = readScalarFieldValue(stormCorridorField, x, y, worldBounds, 0);
                const wetness = readScalarFieldValue(wetnessField, x, y, worldBounds, 0);
                const coldLoad = readScalarFieldChannelValue(
                    temperatureColdLoadField,
                    'coldLoadValues',
                    x,
                    y,
                    worldBounds,
                    0.5
                );
                const oceanExposure = readScalarFieldValue(oceanConnectivityMaskField, x, y, worldBounds, 0);
                const shelfExposure = readScalarFieldValue(coastalShelfDepthField, x, y, worldBounds, 0);
                const marinePenetration = readScalarFieldValue(marineInvasionField, x, y, worldBounds, 0);

                let shorelineAdjacency = 0;
                let shorelineWaterBias = 0;
                let neighborCount = 0;
                for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
                    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
                        if (offsetX === 0 && offsetY === 0) {
                            continue;
                        }

                        const sampleX = Math.max(0, Math.min(width - 1, x + offsetX));
                        const sampleY = Math.max(0, Math.min(height - 1, y + offsetY));
                        const neighborLandMask = readScalarFieldValue(
                            landmassCleanupMaskField,
                            sampleX,
                            sampleY,
                            worldBounds,
                            0
                        );
                        const neighborOceanExposure = readScalarFieldValue(
                            oceanConnectivityMaskField,
                            sampleX,
                            sampleY,
                            worldBounds,
                            0
                        );
                        shorelineAdjacency += (1 - neighborLandMask);
                        shorelineWaterBias += neighborOceanExposure;
                        neighborCount += 1;
                    }
                }

                shorelineAdjacency = clampUnitInterval(
                    neighborCount > 0
                        ? ((shorelineAdjacency / neighborCount) * 0.72) + ((shorelineWaterBias / neighborCount) * 0.28)
                        : 0,
                    0
                );
                const coastalExposure = clampUnitInterval(
                    (oceanExposure * 0.32)
                    + (shelfExposure * 0.18)
                    + (marinePenetration * 0.22)
                    + (shorelineAdjacency * 0.28),
                    0
                );
                const lowlandSusceptibility = clampUnitInterval(
                    Math.max(0, 0.64 - elevation) / 0.64,
                    0
                );
                const saltLoad = clampUnitInterval(
                    coastalExposure * (0.52 + (stormPressure * 0.48)),
                    0
                );
                const wetWear = clampUnitInterval(
                    wetness * shorelineAdjacency * (0.34 + (coastalExposure * 0.66)),
                    0
                );
                const freezeThaw = clampUnitInterval(
                    coldLoad * shorelineAdjacency * (0.2 + (lowlandSusceptibility * 0.22)),
                    0
                );
                const seedNudge = maritimeContextAvailable
                    ? (deterministicUnitNoise(decaySeed, x, y, 'coastalDecay') - 0.5) * 0.014
                    : 0;
                const burden = roundFieldValue(clampUnitInterval(
                    (
                        (saltLoad * 0.42)
                        + (wetWear * 0.28)
                        + (stormPressure * shorelineAdjacency * 0.18)
                        + (freezeThaw * 0.12)
                    )
                    * (0.48 + (coastalExposure * 0.52))
                    + seedNudge,
                    0
                ));

                values[index] = burden;
                shorelineExposureValues[index] = roundFieldValue(coastalExposure);
                saltLoadValues[index] = roundFieldValue(saltLoad);
                wetWearValues[index] = roundFieldValue(wetWear);
                freezeThawValues[index] = roundFieldValue(freezeThaw);

                if (coastalExposure >= 0.1) {
                    coastalCellCount += 1;
                }
                if (burden >= 0.52) {
                    heavyDecayCellCount += 1;
                }
                if ((stormPressure * shorelineAdjacency) >= 0.28) {
                    stormDrivenCellCount += 1;
                }
                if (saltLoad >= 0.26) {
                    saltDrivenCellCount += 1;
                }
                if (freezeThaw >= 0.18) {
                    freezeThawCellCount += 1;
                }
            }
        }

        return {
            fieldType: 'ScalarField',
            fieldId: COASTAL_DECAY_BURDEN_FIELD_ID,
            stageId: STORM_AND_DECAY_STAGE_ID,
            modelId: COASTAL_DECAY_BURDEN_MODEL_ID,
            deterministic: true,
            seedNamespace: decayNamespace,
            seed: decaySeed,
            sourceFieldIds,
            worldBounds: cloneValue(worldBounds),
            width,
            height,
            size,
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: COASTAL_DECAY_BURDEN_VALUE_ENCODING,
            values,
            shorelineExposureValues,
            saltLoadValues,
            wetWearValues,
            freezeThawValues,
            stats: buildScalarFieldStats(values),
            summary: {
                burdenModel: 'coastal_storm_wetness_salt_decay_baseline',
                maritimeContextAvailable,
                sourceFieldIds,
                coastalCellCount,
                heavyDecayCellCount,
                stormDrivenCellCount,
                saltDrivenCellCount,
                freezeThawCellCount,
                valueMeaning: '0=low coastal decay burden,1=high coastal decay burden for later pressure/history analyzers'
            },
            compatibility: {
                futurePressureHistoryInput: true,
                futureClimateStressInput: true,
                sameWorldBoundsRequired: true,
                buildingDecaySystemsOutput: false,
                settlementLogicOutput: false,
                gameplayWeatherOutput: false,
                rendererAgnostic: true
            },
            intentionallyAbsent: [
                'buildingDecaySystems',
                'settlementLogic',
                'climateZoneClassification',
                'climateBands',
                'biomeEnvelope',
                'gameplayWeatherSystems',
                'terrainCells',
                'uiOverlays'
            ]
        };
    }

    function materializeSeasonalityField(input = {}, baseFields = {}) {
        const normalizedInput = normalizeInput(input);
        const worldBounds = normalizedInput.worldBounds;
        const width = worldBounds.width;
        const height = worldBounds.height;
        const size = width * height;
        const seasonalityNamespace = buildNamespace('stormDecaySeasonality');
        const seasonalitySeed = deriveSubSeed(normalizedInput.macroSeed, seasonalityNamespace);
        const latitudeBandBaselineField = baseFields.latitudeBandBaselineField
            || materializeLatitudeBandBaselineField(input);
        const prevailingWindField = baseFields.prevailingWindField
            || materializePrevailingWindField(input);
        const humidityFieldBundle = baseFields.humidityTransportField && baseFields.wetnessField
            ? null
            : materializeHumidityTransportFields(input, {
                latitudeBandBaselineField,
                prevailingWindField
            });
        const humidityTransportField = baseFields.humidityTransportField
            || (humidityFieldBundle && humidityFieldBundle.humidityTransportField)
            || materializeHumidityTransportFields(input, {
                latitudeBandBaselineField,
                prevailingWindField
            }).humidityTransportField;
        const preRainShadowWetnessField = humidityFieldBundle && humidityFieldBundle.wetnessField
            ? humidityFieldBundle.wetnessField
            : materializeHumidityTransportFields(input, {
                latitudeBandBaselineField,
                prevailingWindField
            }).wetnessField;
        const temperatureColdLoadField = baseFields.temperatureColdLoadField
            || materializeTemperatureColdLoadField(input, {
                latitudeBandBaselineField
            });
        const wetnessField = baseFields.wetnessField
            || materializeRainShadowEffect(input, {
                prevailingWindField,
                humidityTransportField,
                wetnessField: preRainShadowWetnessField
            }).wetnessField;
        const stormCorridorField = baseFields.stormCorridorField
            || materializeStormCorridorField(input, {
                latitudeBandBaselineField,
                prevailingWindField,
                humidityTransportField,
                temperatureColdLoadField,
                wetnessField
            });
        const coastalDecayBurdenField = baseFields.coastalDecayBurdenField
            || materializeCoastalDecayBurdenField(input, {
                latitudeBandBaselineField,
                prevailingWindField,
                humidityTransportField,
                temperatureColdLoadField,
                stormCorridorField,
                wetnessField
            });
        const landmassCleanupMaskField = findInputField(input, 'landmassCleanupMaskField');
        const oceanConnectivityMaskField = findInputField(input, 'oceanConnectivityMaskField');
        const coastalShelfDepthField = findInputField(input, 'coastalShelfDepthField');
        const seaLevelAppliedElevationField = findInputField(input, 'seaLevelAppliedElevationField');
        const sourceFieldIds = [
            latitudeBandBaselineField.fieldId,
            temperatureColdLoadField.fieldId,
            wetnessField.fieldId,
            stormCorridorField.fieldId,
            coastalDecayBurdenField.fieldId,
            landmassCleanupMaskField && landmassCleanupMaskField.fieldId,
            oceanConnectivityMaskField && oceanConnectivityMaskField.fieldId,
            coastalShelfDepthField && coastalShelfDepthField.fieldId,
            seaLevelAppliedElevationField && seaLevelAppliedElevationField.fieldId
        ].filter(Boolean);
        const maritimeContextAvailable = Boolean(
            oceanConnectivityMaskField
            || coastalShelfDepthField
        );
        const values = new Array(size).fill(0);
        const predictabilityValues = new Array(size).fill(0);
        const continentalityValues = new Array(size).fill(0);
        const volatilityValues = new Array(size).fill(0);
        const bandBuckets = {};
        const regimeBuckets = {
            oceanic: { cellCount: 0, seasonalityTotal: 0, predictabilityTotal: 0 },
            coastalLand: { cellCount: 0, seasonalityTotal: 0, predictabilityTotal: 0 },
            interiorLand: { cellCount: 0, seasonalityTotal: 0, predictabilityTotal: 0 },
            highlandLand: { cellCount: 0, seasonalityTotal: 0, predictabilityTotal: 0 }
        };
        let highSeasonalityCellCount = 0;
        let lowPredictabilityCellCount = 0;
        let highPredictabilityCellCount = 0;
        let coastalModeratedCellCount = 0;

        function ensureBucket(store, bucketId) {
            if (!store[bucketId]) {
                store[bucketId] = {
                    cellCount: 0,
                    seasonalityTotal: 0,
                    predictabilityTotal: 0
                };
            }

            return store[bucketId];
        }

        function pushBucket(bucket, seasonality, predictability) {
            bucket.cellCount += 1;
            bucket.seasonalityTotal += seasonality;
            bucket.predictabilityTotal += predictability;
        }

        function finalizeBuckets(store) {
            return Object.fromEntries(Object.entries(store).map(([bucketId, bucket]) => [
                bucketId,
                {
                    cellCount: bucket.cellCount,
                    meanSeasonality: roundFieldValue(
                        bucket.cellCount > 0 ? bucket.seasonalityTotal / bucket.cellCount : 0
                    ),
                    meanPredictability: roundFieldValue(
                        bucket.cellCount > 0 ? bucket.predictabilityTotal / bucket.cellCount : 0
                    )
                }
            ]));
        }

        const rowBands = Array.isArray(latitudeBandBaselineField.rowBands)
            ? latitudeBandBaselineField.rowBands
            : [];

        for (let y = 0; y < height; y += 1) {
            const rowBand = rowBands[y] || getLatitudeBaselineBand(height <= 1 ? 0.5 : y / (height - 1));
            const bandBucket = ensureBucket(
                bandBuckets,
                normalizeString(rowBand.bandType || rowBand.bandId, 'unknown')
            );

            for (let x = 0; x < width; x += 1) {
                const index = y * width + x;
                const temperature = readScalarFieldValue(temperatureColdLoadField, x, y, worldBounds, 0.5);
                const coldLoad = readScalarFieldChannelValue(
                    temperatureColdLoadField,
                    'coldLoadValues',
                    x,
                    y,
                    worldBounds,
                    0.5
                );
                const maritimeModeration = readScalarFieldChannelValue(
                    temperatureColdLoadField,
                    'maritimeModerationValues',
                    x,
                    y,
                    worldBounds,
                    0
                );
                const wetness = readScalarFieldValue(wetnessField, x, y, worldBounds, 0);
                const stormPressure = readScalarFieldValue(stormCorridorField, x, y, worldBounds, 0);
                const coastalDecayBurden = readScalarFieldValue(coastalDecayBurdenField, x, y, worldBounds, 0);
                const elevation = readScalarFieldValue(seaLevelAppliedElevationField, x, y, worldBounds, 0);
                const landMask = readScalarFieldValue(
                    landmassCleanupMaskField,
                    x,
                    y,
                    worldBounds,
                    elevation > 0.5 ? 1 : 0
                );
                const oceanExposure = readScalarFieldValue(
                    oceanConnectivityMaskField,
                    x,
                    y,
                    worldBounds,
                    landMask > 0.35 ? 0 : 1
                );
                const shelfExposure = readScalarFieldValue(coastalShelfDepthField, x, y, worldBounds, 0);
                const seasonalityAnchor = clampUnitInterval(
                    rowBand && Number.isFinite(rowBand.seasonalityAnchorHint)
                        ? rowBand.seasonalityAnchorHint
                        : Math.abs(temperature - 0.5) * 1.4,
                    0
                );
                const continentality = roundFieldValue(clampUnitInterval(
                    landMask > 0.35
                        ? ((1 - oceanExposure) * 0.62)
                            + ((1 - shelfExposure) * 0.18)
                            + ((1 - maritimeModeration) * 0.2)
                        : 0,
                    0
                ));
                const coastalInfluence = clampUnitInterval(
                    (oceanExposure * 0.62) + (shelfExposure * 0.38),
                    0
                );
                const thermalSwing = clampUnitInterval(
                    (seasonalityAnchor * 0.54)
                    + (continentality * 0.22)
                    + (coldLoad * 0.14)
                    + ((1 - temperature) * 0.06)
                    + (Math.max(0, elevation - 0.58) / 0.42 * 0.04)
                    - (maritimeModeration * 0.18),
                    0
                );
                const volatility = roundFieldValue(clampUnitInterval(
                    (stormPressure * 0.52)
                    + (coastalDecayBurden * 0.18)
                    + (wetness * 0.14)
                    + ((1 - maritimeModeration) * 0.08)
                    + ((1 - clampUnitInterval(Math.abs(temperature - 0.52) / 0.52, 1)) * 0.08),
                    0
                ));
                const seasonalityNudge = maritimeContextAvailable
                    ? (deterministicUnitNoise(seasonalitySeed, x, y, 'seasonality') - 0.5) * 0.014
                    : 0;
                const predictabilityNudge = maritimeContextAvailable
                    ? (deterministicUnitNoise(seasonalitySeed, x, y, 'predictability') - 0.5) * 0.012
                    : 0;
                const seasonality = roundFieldValue(clampUnitInterval(
                    (thermalSwing * 0.72)
                    + (volatility * 0.18)
                    + (continentality * 0.1)
                    + seasonalityNudge,
                    0
                ));
                const predictability = roundFieldValue(clampUnitInterval(
                    (seasonalityAnchor * 0.44)
                    + (continentality * 0.22)
                    + ((1 - volatility) * 0.26)
                    + (maritimeModeration * 0.08)
                    + predictabilityNudge,
                    0
                ));

                values[index] = seasonality;
                predictabilityValues[index] = predictability;
                continentalityValues[index] = continentality;
                volatilityValues[index] = volatility;

                pushBucket(bandBucket, seasonality, predictability);

                const regimeKey = landMask <= 0.35
                    ? 'oceanic'
                    : (elevation >= 0.72 && coldLoad >= 0.45
                        ? 'highlandLand'
                        : (coastalInfluence >= 0.28 ? 'coastalLand' : 'interiorLand'));
                pushBucket(regimeBuckets[regimeKey], seasonality, predictability);

                if (seasonality >= 0.62) {
                    highSeasonalityCellCount += 1;
                }
                if (predictability <= 0.38) {
                    lowPredictabilityCellCount += 1;
                }
                if (predictability >= 0.62) {
                    highPredictabilityCellCount += 1;
                }
                if (landMask > 0.35 && maritimeModeration >= 0.24) {
                    coastalModeratedCellCount += 1;
                }
            }
        }

        return {
            fieldType: 'ScalarField',
            fieldId: SEASONALITY_FIELD_ID,
            stageId: STORM_AND_DECAY_STAGE_ID,
            modelId: SEASONALITY_MODEL_ID,
            deterministic: true,
            seedNamespace: seasonalityNamespace,
            seed: seasonalitySeed,
            sourceFieldIds,
            worldBounds: cloneValue(worldBounds),
            width,
            height,
            size,
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: SEASONALITY_VALUE_ENCODING,
            values,
            predictabilityValues,
            continentalityValues,
            volatilityValues,
            stats: buildScalarFieldStats(values),
            summary: {
                seasonalityModel: 'latitude_continentality_storm_regime_baseline',
                maritimeContextAvailable,
                sourceFieldIds,
                highSeasonalityCellCount,
                lowPredictabilityCellCount,
                highPredictabilityCellCount,
                coastalModeratedCellCount,
                valueMeaning: '0=low seasonal variability/stable regime,1=high seasonal variability or burden',
                predictabilityMeaning: '0=low seasonal predictability/high irregularity,1=high seasonal predictability',
                regionalSummary: {
                    latitudeBandTypes: finalizeBuckets(bandBuckets),
                    surfaceRegimes: finalizeBuckets(regimeBuckets)
                }
            },
            compatibility: {
                futureClimateBandInput: true,
                futureBiomeEnvelopeInput: true,
                futureRegionalSummaryInput: true,
                sameWorldBoundsRequired: true,
                yearlySimulationOutput: false,
                gameplayTimeSystemsOutput: false,
                rendererAgnostic: true
            },
            intentionallyAbsent: [
                'yearlySimulation',
                'climateZoneClassification',
                'climateBands',
                'biomeEnvelope',
                'gameplayTimeSystems',
                'terrainCells',
                'uiOverlays'
            ]
        };
    }

    function normalizeCellIndex(value, size) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return -1;
        }

        const cellIndex = Math.floor(numericValue);
        if (cellIndex < 0 || (Number.isFinite(size) && size > 0 && cellIndex >= size)) {
            return -1;
        }

        return cellIndex;
    }

    function normalizeNonNegativeInteger(value, fallback = 0) {
        const numericValue = Number(value);
        return Number.isFinite(numericValue)
            ? Math.max(0, Math.floor(numericValue))
            : fallback;
    }

    function buildCellMembershipMap(items = [], resolveId, size = 0) {
        const membership = new Map();
        if (!Array.isArray(items) || typeof resolveId !== 'function') {
            return membership;
        }

        items.forEach((item) => {
            const sourceId = normalizeString(resolveId(item), '');
            const cellIndices = Array.isArray(item && item.cellIndices) ? item.cellIndices : [];
            if (!sourceId || !cellIndices.length) {
                return;
            }

            cellIndices.forEach((cellIndex) => {
                const normalizedIndex = normalizeCellIndex(cellIndex, size);
                if (normalizedIndex >= 0) {
                    membership.set(normalizedIndex, sourceId);
                }
            });
        });

        return membership;
    }

    function countCellMembership(cellIndices = [], membership = new Map(), size = 0) {
        const counts = new Map();
        if (!Array.isArray(cellIndices) || !(membership instanceof Map)) {
            return counts;
        }

        cellIndices.forEach((cellIndex) => {
            const normalizedIndex = normalizeCellIndex(cellIndex, size);
            const sourceId = normalizedIndex >= 0 ? membership.get(normalizedIndex) : '';
            if (!sourceId) {
                return;
            }

            counts.set(sourceId, (counts.get(sourceId) || 0) + 1);
        });

        return counts;
    }

    function createClimateSummaryAccumulator(summaryType, sourceId, metadata = {}) {
        return {
            summaryType,
            sourceId,
            metadata,
            totalWeight: 0,
            temperatureTotal: 0,
            humidityTotal: 0,
            seasonalityTotal: 0,
            climateBandIds: new Set(),
            climateBandWeights: new Map(),
            bandTypeWeights: new Map()
        };
    }

    function getClimateSummaryAccumulator(accumulators, summaryType, sourceId, metadata = {}) {
        if (!sourceId) {
            return null;
        }

        if (!accumulators.has(sourceId)) {
            accumulators.set(sourceId, createClimateSummaryAccumulator(summaryType, sourceId, metadata));
        }

        const accumulator = accumulators.get(sourceId);
        accumulator.metadata = {
            ...metadata,
            ...accumulator.metadata
        };
        return accumulator;
    }

    function addClimateSummaryContribution(accumulator, component, weight) {
        const contributionWeight = normalizeNonNegativeInteger(weight, 0);
        const climateBandId = normalizeString(component && component.climateBandId, '');
        if (!accumulator || !climateBandId || contributionWeight <= 0) {
            return;
        }

        const bandType = normalizeString(component.bandType, 'unclassified');
        accumulator.totalWeight += contributionWeight;
        accumulator.temperatureTotal += clampUnitInterval(component.meanTemperatureBias, 0) * contributionWeight;
        accumulator.humidityTotal += clampUnitInterval(component.meanHumidityBias, 0) * contributionWeight;
        accumulator.seasonalityTotal += clampUnitInterval(component.meanSeasonalityBias, 0) * contributionWeight;
        accumulator.climateBandIds.add(climateBandId);
        accumulator.climateBandWeights.set(
            climateBandId,
            (accumulator.climateBandWeights.get(climateBandId) || 0) + contributionWeight
        );

        if (!accumulator.bandTypeWeights.has(bandType)) {
            accumulator.bandTypeWeights.set(bandType, {
                bandType,
                weight: 0,
                climateBandIds: new Set()
            });
        }

        const bandTypeWeight = accumulator.bandTypeWeights.get(bandType);
        bandTypeWeight.weight += contributionWeight;
        bandTypeWeight.climateBandIds.add(climateBandId);
    }

    function sortWeightedSummaryEntries(entries = [], idKey = 'id') {
        return entries.sort((left, right) => {
            if (right.weight !== left.weight) {
                return right.weight - left.weight;
            }

            return normalizeString(left[idKey], '').localeCompare(normalizeString(right[idKey], ''));
        });
    }

    function finalizeClimateSummaryAccumulator(accumulator, options = {}) {
        if (!accumulator || accumulator.totalWeight <= 0) {
            return null;
        }

        const weightKey = normalizeString(options.weightKey, 'coveredCellCount');
        const ratioKey = normalizeString(options.ratioKey, 'coveredCellRatio');
        const targetCellCountKey = normalizeString(options.targetCellCountKey, 'sourceCellCount');
        const targetCellCount = normalizeNonNegativeInteger(options.targetCellCount, 0);
        const climateBandRankings = sortWeightedSummaryEntries(
            Array.from(accumulator.climateBandWeights.entries()).map(([climateBandId, weight]) => ({
                climateBandId,
                weight
            })),
            'climateBandId'
        );
        const bandTypeBreakdown = sortWeightedSummaryEntries(
            Array.from(accumulator.bandTypeWeights.values()).map((entry) => ({
                bandType: entry.bandType,
                climateBandIds: Array.from(entry.climateBandIds).sort((left, right) => left.localeCompare(right)),
                weight: entry.weight,
                contributionRatio: roundFieldValue(entry.weight / Math.max(1, accumulator.totalWeight))
            })),
            'bandType'
        ).map((entry) => ({
            bandType: entry.bandType,
            climateBandIds: entry.climateBandIds,
            [weightKey]: entry.weight,
            contributionRatio: entry.contributionRatio
        }));
        const summary = {
            summaryId: normalizeString(options.summaryId, `climate_summary_${accumulator.summaryType}_${accumulator.sourceId}`),
            summaryType: accumulator.summaryType,
            sourceRegionType: normalizeString(options.sourceRegionType, accumulator.summaryType),
            climateBandIds: Array.from(accumulator.climateBandIds).sort((left, right) => left.localeCompare(right)),
            primaryClimateBandId: climateBandRankings.length ? climateBandRankings[0].climateBandId : '',
            dominantBandType: bandTypeBreakdown.length ? bandTypeBreakdown[0].bandType : '',
            climateBandCount: accumulator.climateBandIds.size,
            [weightKey]: accumulator.totalWeight,
            [ratioKey]: roundFieldValue(accumulator.totalWeight / Math.max(1, targetCellCount || accumulator.totalWeight)),
            [targetCellCountKey]: targetCellCount,
            meanTemperatureBias: roundFieldValue(accumulator.temperatureTotal / Math.max(1, accumulator.totalWeight)),
            meanHumidityBias: roundFieldValue(accumulator.humidityTotal / Math.max(1, accumulator.totalWeight)),
            meanSeasonalityBias: roundFieldValue(accumulator.seasonalityTotal / Math.max(1, accumulator.totalWeight)),
            bandTypeBreakdown
        };

        return {
            ...summary,
            ...cloneValue(accumulator.metadata)
        };
    }

    function materializeRegionalClimateSummaries({
        normalizedInput,
        worldBounds,
        climateBandNamespace,
        climateBandSeed,
        sourceFieldIds,
        sourceIntermediateOutputIds,
        climateBands,
        zoneComponents,
        reliefRegionBodies,
        continentBodies,
        seaRegionClusters
    } = {}) {
        const normalizedWorldBounds = normalizeWorldBounds(worldBounds);
        const normalizedSourceFieldIds = Array.isArray(sourceFieldIds) ? sourceFieldIds : [];
        const normalizedSourceIntermediateOutputIds = Array.isArray(sourceIntermediateOutputIds)
            ? sourceIntermediateOutputIds
            : [];
        const normalizedClimateBands = Array.isArray(climateBands) ? climateBands : [];
        const normalizedZoneComponents = Array.isArray(zoneComponents) ? zoneComponents : [];
        const normalizedReliefRegionBodies = Array.isArray(reliefRegionBodies) ? reliefRegionBodies : [];
        const normalizedContinentBodies = Array.isArray(continentBodies) ? continentBodies : [];
        const normalizedSeaRegionClusters = Array.isArray(seaRegionClusters) ? seaRegionClusters : [];
        const regionAccumulators = new Map();
        const continentAccumulators = new Map();
        const seaAccumulators = new Map();
        const size = normalizedWorldBounds.width * normalizedWorldBounds.height;
        const reliefRegionInfo = new Map();
        const continentInfo = new Map();
        const seaRegionInfo = new Map();
        const continentMembership = buildCellMembershipMap(
            normalizedContinentBodies,
            (body) => body && body.recordDraft && body.recordDraft.continentId,
            size
        );

        normalizedReliefRegionBodies.forEach((body) => {
            const reliefRegionId = normalizeString(
                body && body.reliefRegionId,
                normalizeString(body && body.record && body.record.reliefRegionId, '')
            );
            if (!reliefRegionId) {
                return;
            }

            reliefRegionInfo.set(reliefRegionId, {
                reliefRegionId,
                reliefType: normalizeString(body && body.reliefType, normalizeString(body && body.record && body.record.reliefType, '')),
                sourceCellCount: normalizeNonNegativeInteger(body && body.cellCount, 0)
            });
        });

        normalizedContinentBodies.forEach((body) => {
            const continentId = normalizeString(body && body.recordDraft && body.recordDraft.continentId, '');
            if (!continentId) {
                return;
            }

            continentInfo.set(continentId, {
                continentId,
                continentBodyId: normalizeString(body && body.continentBodyId, ''),
                macroShape: normalizeString(body && body.macroShape, normalizeString(body && body.recordDraft && body.recordDraft.macroShape, '')),
                sourceCellCount: normalizeNonNegativeInteger(body && body.cellCount, 0)
            });
        });

        normalizedSeaRegionClusters.forEach((cluster) => {
            const seaRegionId = normalizeString(
                cluster && cluster.recordDraft && cluster.recordDraft.seaRegionId,
                normalizeString(cluster && cluster.seaRegionId, '')
            );
            if (!seaRegionId) {
                return;
            }

            seaRegionInfo.set(seaRegionId, {
                seaRegionId,
                seaRegionClusterId: normalizeString(cluster && cluster.seaRegionClusterId, ''),
                basinType: normalizeString(cluster && cluster.basinType, normalizeString(cluster && cluster.recordDraft && cluster.recordDraft.basinType, '')),
                sourceSeaCellCount: normalizeNonNegativeInteger(cluster && cluster.cellCount, 0)
            });
        });

        normalizedZoneComponents.forEach((component) => {
            const climateBandId = normalizeString(component && component.climateBandId, '');
            if (!climateBandId) {
                return;
            }

            const reliefOverlaps = Array.isArray(component.reliefRegionOverlap)
                ? component.reliefRegionOverlap
                : normalizeStringList(component.reliefRegionIds).map((reliefRegionId) => ({
                    reliefRegionId,
                    cellCount: component.cellCount
                }));
            reliefOverlaps.forEach((overlap) => {
                const reliefRegionId = normalizeString(overlap && overlap.reliefRegionId, '');
                const metadata = reliefRegionInfo.get(reliefRegionId) || { reliefRegionId };
                const accumulator = getClimateSummaryAccumulator(
                    regionAccumulators,
                    'reliefRegion',
                    reliefRegionId,
                    metadata
                );
                addClimateSummaryContribution(accumulator, component, overlap && overlap.cellCount);
            });

            const continentCounts = countCellMembership(component.cellIndices, continentMembership, size);
            continentCounts.forEach((cellCount, continentId) => {
                const metadata = continentInfo.get(continentId) || { continentId };
                const accumulator = getClimateSummaryAccumulator(
                    continentAccumulators,
                    'continent',
                    continentId,
                    metadata
                );
                addClimateSummaryContribution(accumulator, component, cellCount);
            });

            const seaOverlaps = Array.isArray(component.seaRegionOverlap)
                ? component.seaRegionOverlap
                : normalizeStringList(component.seaRegionIds).map((seaRegionId) => ({
                    seaRegionId,
                    adjacentCellCount: 1
                }));
            seaOverlaps.forEach((overlap) => {
                const seaRegionId = normalizeString(overlap && overlap.seaRegionId, '');
                const metadata = seaRegionInfo.get(seaRegionId) || { seaRegionId };
                const accumulator = getClimateSummaryAccumulator(
                    seaAccumulators,
                    'seaRegion',
                    seaRegionId,
                    metadata
                );
                addClimateSummaryContribution(
                    accumulator,
                    component,
                    normalizeNonNegativeInteger(overlap && overlap.adjacentCellCount, 0)
                );
            });
        });

        const regionSummaries = Array.from(regionAccumulators.values())
            .map((accumulator) => finalizeClimateSummaryAccumulator(accumulator, {
                summaryId: `climate_summary_region_${accumulator.sourceId}`,
                sourceRegionType: 'reliefRegion',
                targetCellCount: accumulator.metadata.sourceCellCount,
                targetCellCountKey: 'sourceCellCount',
                weightKey: 'coveredCellCount',
                ratioKey: 'coveredCellRatio'
            }))
            .filter(Boolean)
            .sort((left, right) => left.reliefRegionId.localeCompare(right.reliefRegionId));
        const continentSummaries = Array.from(continentAccumulators.values())
            .map((accumulator) => finalizeClimateSummaryAccumulator(accumulator, {
                summaryId: `climate_summary_continent_${accumulator.sourceId}`,
                sourceRegionType: 'continentBody',
                targetCellCount: accumulator.metadata.sourceCellCount,
                targetCellCountKey: 'sourceCellCount',
                weightKey: 'coveredCellCount',
                ratioKey: 'coveredCellRatio'
            }))
            .filter(Boolean)
            .sort((left, right) => left.continentId.localeCompare(right.continentId));
        const seaSummaries = Array.from(seaAccumulators.values())
            .map((accumulator) => finalizeClimateSummaryAccumulator(accumulator, {
                summaryId: `climate_summary_sea_${accumulator.sourceId}`,
                sourceRegionType: 'seaRegionCluster',
                targetCellCount: accumulator.metadata.sourceSeaCellCount,
                targetCellCountKey: 'sourceSeaCellCount',
                weightKey: 'adjacentLandEdgeCount',
                ratioKey: 'adjacentLandEdgeRatio'
            }))
            .filter(Boolean)
            .sort((left, right) => left.seaRegionId.localeCompare(right.seaRegionId));

        return {
            outputId: REGIONAL_CLIMATE_SUMMARIES_ID,
            stageId: CLIMATE_BAND_STAGE_ID,
            modelId: REGIONAL_CLIMATE_SUMMARIES_MODEL_ID,
            deterministic: true,
            seedNamespace: normalizeString(climateBandNamespace, buildNamespace('climateBands')),
            seed: Number.isFinite(climateBandSeed) ? climateBandSeed : 0,
            sourceFieldIds: normalizedSourceFieldIds.slice(),
            sourceIntermediateOutputIds: normalizedSourceIntermediateOutputIds.slice(),
            sourceRecordIds: ['climateBands'],
            worldBounds: cloneValue(normalizedWorldBounds),
            macroSeed: normalizedInput && Number.isFinite(normalizedInput.macroSeed) ? normalizedInput.macroSeed : 0,
            regionSummaries,
            continentSummaries,
            seaSummaries,
            summary: {
                summaryModel: 'climate_band_record_membership_rollup',
                climateBandRecordCount: normalizedClimateBands.length,
                sourceZoneCount: normalizedZoneComponents.length,
                recordCompatibleZoneCount: normalizedZoneComponents
                    .filter((component) => normalizeString(component && component.climateBandId, ''))
                    .length,
                regionSummaryCount: regionSummaries.length,
                continentSummaryCount: continentSummaries.length,
                seaSummaryCount: seaSummaries.length,
                reliefGeometryAvailable: normalizedReliefRegionBodies.length > 0,
                continentGeometryAvailable: normalizedContinentBodies.length > 0,
                seaRegionGeometryAvailable: normalizedSeaRegionClusters.length > 0,
                valueMeaning: 'summaries aggregate emitted ClimateBandRecord zones without mutating continent, sea, or package records'
            },
            compatibility: {
                climateBandRecordSummaryOutput: true,
                futureContinentRecordLinkageInput: true,
                futureSeaRegionRecordLinkageInput: true,
                futureClimateStressInput: true,
                sameWorldBoundsRequired: true,
                fullPackageAssemblyOutput: false,
                phase2PressurePackageOutput: false,
                biomeEnvelopeOutput: false,
                gameplayWeatherOutput: false,
                rendererAgnostic: true
            },
            intentionallyAbsent: [
                'fullMacroGeographyPackage',
                'phase2PressurePackage',
                'biomeEnvelope',
                'gameplayWeatherSystems',
                'terrainCells',
                'uiOverlays'
            ]
        };
    }

    function readClassificationIndexValue(classificationOutput, x, y, targetWorldBounds = DEFAULT_WORLD_BOUNDS, fallback = -1) {
        if (!classificationOutput || typeof classificationOutput !== 'object') {
            return fallback;
        }

        const classificationIndices = classificationOutput.classificationIndices;
        if (!Array.isArray(classificationIndices)) {
            return fallback;
        }

        const worldBounds = normalizeWorldBounds(targetWorldBounds);
        const width = normalizeInteger(classificationOutput.width, worldBounds.width);
        const height = normalizeInteger(classificationOutput.height, worldBounds.height);
        const sourceX = remapFieldCoordinate(x, width, worldBounds.width);
        const sourceY = remapFieldCoordinate(y, height, worldBounds.height);
        const index = sourceY * width + sourceX;
        const value = Number(classificationIndices[index]);
        return Number.isFinite(value) ? Math.trunc(value) : fallback;
    }

    function getBiomeEnvelopeStressBias(biomeEnvelopeClassification, x, y, worldBounds) {
        const classIndex = readClassificationIndexValue(biomeEnvelopeClassification, x, y, worldBounds, -1);
        if (classIndex < 0) {
            return 0;
        }

        const classificationLegend = Array.isArray(biomeEnvelopeClassification && biomeEnvelopeClassification.classificationLegend)
            ? biomeEnvelopeClassification.classificationLegend
            : [];
        const legendEntry = classificationLegend.find((entry) => entry && entry.classIndex === classIndex)
            || classificationLegend[classIndex]
            || null;
        const envelopeType = normalizeString(legendEntry && legendEntry.envelopeType, '');
        const stressByEnvelopeType = {
            polar_barren_envelope: 0.92,
            alpine_barren_envelope: 0.82,
            cold_steppe_envelope: 0.68,
            cold_wet_forest_envelope: 0.46,
            temperate_steppe_envelope: 0.48,
            temperate_mixed_forest_envelope: 0.24,
            temperate_wet_forest_envelope: 0.34,
            hot_desert_envelope: 0.9,
            warm_dry_scrub_envelope: 0.58,
            seasonal_woodland_envelope: 0.38,
            tropical_wet_forest_envelope: 0.42,
            wetland_prone_envelope: 0.64
        };

        return clampUnitInterval(stressByEnvelopeType[envelopeType], 0.35);
    }

    function resolveBiomeEnvelopeClassification(input = {}, baseFields = {}, baseIntermediateOutputs = {}) {
        const existingOutput = findInputIntermediateOutput(input, BIOME_ENVELOPE_CLASSIFICATION_ID);
        if (existingOutput) {
            return existingOutput;
        }

        if (typeof macro.generateBiomeEnvelopeClassification !== 'function') {
            return null;
        }

        const source = input && typeof input === 'object' ? input : {};
        const sourceFields = source.fields && typeof source.fields === 'object' && !Array.isArray(source.fields)
            ? source.fields
            : {};
        const sourceIntermediateOutputs = source.intermediateOutputs
            && typeof source.intermediateOutputs === 'object'
            && !Array.isArray(source.intermediateOutputs)
            ? source.intermediateOutputs
            : {};
        const sourceRecords = source.records && typeof source.records === 'object' && !Array.isArray(source.records)
            ? source.records
            : {};

        return macro.generateBiomeEnvelopeClassification({
            ...source,
            fields: {
                ...sourceFields,
                ...baseFields
            },
            intermediateOutputs: {
                ...sourceIntermediateOutputs,
                ...baseIntermediateOutputs
            },
            records: {
                ...sourceRecords,
                climateBands: Array.isArray(baseIntermediateOutputs.climateBands)
                    ? baseIntermediateOutputs.climateBands.slice()
                    : sourceRecords.climateBands
            }
        });
    }

    function materializeClimateStressField(input = {}, baseFields = {}, baseIntermediateOutputs = {}) {
        const normalizedInput = normalizeInput(input);
        const worldBounds = normalizedInput.worldBounds;
        const width = worldBounds.width;
        const height = worldBounds.height;
        const size = width * height;
        const climateStressNamespace = buildNamespace('climateStress');
        const climateStressSeed = deriveSubSeed(normalizedInput.macroSeed, climateStressNamespace);
        const latitudeBandBaselineField = baseFields.latitudeBandBaselineField
            || materializeLatitudeBandBaselineField(input);
        const prevailingWindField = baseFields.prevailingWindField
            || materializePrevailingWindField(input);
        const humidityFieldBundle = baseFields.humidityTransportField && baseFields.wetnessField
            ? null
            : materializeHumidityTransportFields(input, {
                latitudeBandBaselineField,
                prevailingWindField
            });
        const humidityTransportField = baseFields.humidityTransportField
            || (humidityFieldBundle && humidityFieldBundle.humidityTransportField)
            || materializeHumidityTransportFields(input, {
                latitudeBandBaselineField,
                prevailingWindField
            }).humidityTransportField;
        const preRainShadowWetnessField = humidityFieldBundle && humidityFieldBundle.wetnessField
            ? humidityFieldBundle.wetnessField
            : materializeHumidityTransportFields(input, {
                latitudeBandBaselineField,
                prevailingWindField
            }).wetnessField;
        const temperatureColdLoadField = baseFields.temperatureColdLoadField
            || materializeTemperatureColdLoadField(input, {
                latitudeBandBaselineField
            });
        const wetnessField = baseFields.wetnessField
            || materializeRainShadowEffect(input, {
                prevailingWindField,
                humidityTransportField,
                wetnessField: preRainShadowWetnessField
            }).wetnessField;
        const stormCorridorField = baseFields.stormCorridorField
            || materializeStormCorridorField(input, {
                latitudeBandBaselineField,
                prevailingWindField,
                humidityTransportField,
                temperatureColdLoadField,
                wetnessField
            });
        const coastalDecayBurdenField = baseFields.coastalDecayBurdenField
            || materializeCoastalDecayBurdenField(input, {
                latitudeBandBaselineField,
                prevailingWindField,
                humidityTransportField,
                temperatureColdLoadField,
                stormCorridorField,
                wetnessField
            });
        const seasonalityField = baseFields.seasonalityField
            || materializeSeasonalityField(input, {
                latitudeBandBaselineField,
                prevailingWindField,
                humidityTransportField,
                temperatureColdLoadField,
                stormCorridorField,
                coastalDecayBurdenField,
                wetnessField
            });
        const landmassCleanupMaskField = findInputField(input, 'landmassCleanupMaskField');
        const seaLevelAppliedElevationField = findInputField(input, 'seaLevelAppliedElevationField');
        const climateZoneClassification = baseIntermediateOutputs[CLIMATE_ZONE_CLASSIFICATION_ID]
            || findInputIntermediateOutput(input, CLIMATE_ZONE_CLASSIFICATION_ID)
            || null;
        const regionalClimateSummaries = baseIntermediateOutputs[REGIONAL_CLIMATE_SUMMARIES_ID]
            || findInputIntermediateOutput(input, REGIONAL_CLIMATE_SUMMARIES_ID)
            || null;
        const biomeEnvelopeClassification = baseIntermediateOutputs[BIOME_ENVELOPE_CLASSIFICATION_ID]
            || resolveBiomeEnvelopeClassification(
                input,
                {
                    latitudeBandBaselineField,
                    prevailingWindField,
                    humidityTransportField,
                    temperatureColdLoadField,
                    stormCorridorField,
                    coastalDecayBurdenField,
                    seasonalityField,
                    wetnessField,
                    ...(landmassCleanupMaskField ? { landmassCleanupMaskField } : {}),
                    ...(seaLevelAppliedElevationField ? { seaLevelAppliedElevationField } : {})
                },
                {
                    ...(climateZoneClassification ? { [CLIMATE_ZONE_CLASSIFICATION_ID]: climateZoneClassification } : {}),
                    ...(regionalClimateSummaries ? { [REGIONAL_CLIMATE_SUMMARIES_ID]: regionalClimateSummaries } : {}),
                    ...(Array.isArray(baseIntermediateOutputs.climateBands)
                        ? { climateBands: baseIntermediateOutputs.climateBands.slice() }
                        : {})
                }
            );
        const sourceFieldIds = [
            temperatureColdLoadField.fieldId,
            wetnessField.fieldId,
            stormCorridorField.fieldId,
            coastalDecayBurdenField.fieldId,
            seasonalityField.fieldId,
            landmassCleanupMaskField && landmassCleanupMaskField.fieldId,
            seaLevelAppliedElevationField && seaLevelAppliedElevationField.fieldId
        ].filter(Boolean);
        const sourceIntermediateOutputIds = [
            climateZoneClassification && CLIMATE_ZONE_CLASSIFICATION_ID,
            regionalClimateSummaries && REGIONAL_CLIMATE_SUMMARIES_ID,
            biomeEnvelopeClassification && BIOME_ENVELOPE_CLASSIFICATION_ID
        ].filter(Boolean);
        const values = new Array(size).fill(0);
        const drynessStressValues = new Array(size).fill(0);
        const coldStressValues = new Array(size).fill(0);
        const heatStressValues = new Array(size).fill(0);
        const stormStressValues = new Array(size).fill(0);
        const coastalDecayStressValues = new Array(size).fill(0);
        const seasonalityStressValues = new Array(size).fill(0);
        const biomeEnvelopeStressValues = new Array(size).fill(0);
        const landCellMaskValues = new Array(size).fill(0);
        let landCellCount = 0;
        let skippedWaterOrMissingCellCount = 0;
        let highStressCellCount = 0;

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const index = y * width + x;
                const elevation = readScalarFieldValue(seaLevelAppliedElevationField, x, y, worldBounds, 0);
                const landMask = readScalarFieldValue(
                    landmassCleanupMaskField,
                    x,
                    y,
                    worldBounds,
                    elevation > 0.5 ? 1 : 0
                );
                const roundedLandMask = roundFieldValue(landMask);
                landCellMaskValues[index] = roundedLandMask;

                if (landMask <= 0.35) {
                    skippedWaterOrMissingCellCount += 1;
                    continue;
                }

                const temperatureBias = readScalarFieldValue(temperatureColdLoadField, x, y, worldBounds, 0.5);
                const wetnessBias = readScalarFieldValue(wetnessField, x, y, worldBounds, 0);
                const coldLoad = readScalarFieldChannelValue(
                    temperatureColdLoadField,
                    'coldLoadValues',
                    x,
                    y,
                    worldBounds,
                    1 - temperatureBias
                );
                const stormStress = readScalarFieldValue(stormCorridorField, x, y, worldBounds, 0);
                const coastalDecayStress = readScalarFieldValue(coastalDecayBurdenField, x, y, worldBounds, 0);
                const seasonalityBias = readScalarFieldValue(seasonalityField, x, y, worldBounds, 0);
                const predictabilityBias = readScalarFieldChannelValue(
                    seasonalityField,
                    'predictabilityValues',
                    x,
                    y,
                    worldBounds,
                    0.5
                );
                const drynessStress = clampUnitInterval(1 - wetnessBias, 0);
                const heatStress = clampUnitInterval((temperatureBias - 0.82) / 0.18, 0);
                const seasonalityStress = clampUnitInterval(
                    (seasonalityBias * 0.72) + ((1 - predictabilityBias) * 0.28),
                    0
                );
                const biomeEnvelopeStress = getBiomeEnvelopeStressBias(
                    biomeEnvelopeClassification,
                    x,
                    y,
                    worldBounds
                );
                const climateStress = clampUnitInterval(
                    (drynessStress * 0.2)
                    + (coldLoad * 0.17)
                    + (heatStress * 0.08)
                    + (stormStress * 0.18)
                    + (coastalDecayStress * 0.12)
                    + (seasonalityStress * 0.17)
                    + (biomeEnvelopeStress * 0.08),
                    0
                );
                const roundedClimateStress = roundFieldValue(climateStress);

                values[index] = roundedClimateStress;
                drynessStressValues[index] = roundFieldValue(drynessStress);
                coldStressValues[index] = roundFieldValue(coldLoad);
                heatStressValues[index] = roundFieldValue(heatStress);
                stormStressValues[index] = roundFieldValue(stormStress);
                coastalDecayStressValues[index] = roundFieldValue(coastalDecayStress);
                seasonalityStressValues[index] = roundFieldValue(seasonalityStress);
                biomeEnvelopeStressValues[index] = roundFieldValue(biomeEnvelopeStress);
                landCellCount += 1;

                if (roundedClimateStress >= 0.66) {
                    highStressCellCount += 1;
                }
            }
        }

        return {
            fieldType: 'ScalarField',
            fieldId: CLIMATE_STRESS_FIELD_ID,
            stageId: CLIMATE_STRESS_STAGE_ID,
            modelId: CLIMATE_STRESS_MODEL_ID,
            deterministic: true,
            seedNamespace: climateStressNamespace,
            seed: climateStressSeed,
            sourceFieldIds,
            sourceIntermediateOutputIds,
            worldBounds: cloneValue(worldBounds),
            width,
            height,
            size,
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: CLIMATE_STRESS_VALUE_ENCODING,
            values,
            drynessStressValues,
            coldStressValues,
            heatStressValues,
            stormStressValues,
            coastalDecayStressValues,
            seasonalityStressValues,
            biomeEnvelopeStressValues,
            landCellMaskValues,
            stats: buildScalarFieldStats(values),
            summary: {
                stressModel: 'weighted_physical_climate_burden',
                landCellCount,
                skippedWaterOrMissingCellCount,
                highStressCellCount,
                highStressCellRatio: roundFieldValue(highStressCellCount / Math.max(1, landCellCount)),
                sourceBiomeEnvelopeAvailable: Boolean(biomeEnvelopeClassification),
                sourceBiomeEnvelopeReady: Boolean(
                    biomeEnvelopeClassification
                    && biomeEnvelopeClassification.summary
                    && biomeEnvelopeClassification.summary.ready
                ),
                sourceFieldIds,
                sourceIntermediateOutputIds,
                valueMeaning: '0=low physical climate stress, 1=high combined dry/cold/heat/storm/coastal/seasonal/envelope stress'
            },
            compatibility: {
                physicalWorldLayerOnly: true,
                regionalClimateSummaryInput: true,
                futurePressureGeneratorInput: true,
                fullPackageAssemblyOutput: false,
                downstreamPressureGeneratorOutput: false,
                biomeEnvelopeOutput: false,
                gameplayWeatherOutput: false,
                rendererAgnostic: true
            },
            intentionallyAbsent: [
                'fullMacroGeographyPackage',
                'phase2PressurePackage',
                'downstreamPressureGenerator',
                'debugPanel',
                'gameplayWeatherSystems',
                'terrainCells',
                'uiOverlays'
            ]
        };
    }

    function createClimateStressSummaryAccumulator(summaryType, sourceId, metadata = {}, climateSummary = {}) {
        return {
            summaryType,
            sourceId,
            metadata,
            climateSummary,
            stressCellCount: 0,
            climateStressTotal: 0,
            drynessStressTotal: 0,
            coldStressTotal: 0,
            heatStressTotal: 0,
            stormStressTotal: 0,
            coastalDecayStressTotal: 0,
            seasonalityStressTotal: 0,
            biomeEnvelopeStressTotal: 0,
            peakClimateStress: 0
        };
    }

    function addClimateStressSummaryContribution(accumulator, climateStressField, cellIndex) {
        const size = normalizeNonNegativeInteger(climateStressField && climateStressField.size, 0);
        const normalizedIndex = normalizeCellIndex(cellIndex, size);
        if (!accumulator || normalizedIndex < 0) {
            return;
        }

        const landMask = Array.isArray(climateStressField.landCellMaskValues)
            ? clampUnitInterval(climateStressField.landCellMaskValues[normalizedIndex], 0)
            : 0;
        if (landMask <= 0.35) {
            return;
        }

        const readChannelValue = (channelKey) => (
            Array.isArray(climateStressField[channelKey])
                ? clampUnitInterval(climateStressField[channelKey][normalizedIndex], 0)
                : 0
        );
        const climateStress = readChannelValue('values');

        accumulator.stressCellCount += 1;
        accumulator.climateStressTotal += climateStress;
        accumulator.drynessStressTotal += readChannelValue('drynessStressValues');
        accumulator.coldStressTotal += readChannelValue('coldStressValues');
        accumulator.heatStressTotal += readChannelValue('heatStressValues');
        accumulator.stormStressTotal += readChannelValue('stormStressValues');
        accumulator.coastalDecayStressTotal += readChannelValue('coastalDecayStressValues');
        accumulator.seasonalityStressTotal += readChannelValue('seasonalityStressValues');
        accumulator.biomeEnvelopeStressTotal += readChannelValue('biomeEnvelopeStressValues');
        accumulator.peakClimateStress = Math.max(accumulator.peakClimateStress, climateStress);
    }

    function deriveClimateStressRegime(meanClimateStress) {
        if (meanClimateStress >= 0.72) {
            return 'severe';
        }
        if (meanClimateStress >= 0.52) {
            return 'high';
        }
        if (meanClimateStress >= 0.32) {
            return 'moderate';
        }

        return 'low';
    }

    function createClimateSummaryLookup(regionalClimateSummaries, rowsKey, idKey) {
        const rows = Array.isArray(regionalClimateSummaries && regionalClimateSummaries[rowsKey])
            ? regionalClimateSummaries[rowsKey]
            : [];
        return new Map(rows
            .map((row) => [normalizeString(row && row[idKey], ''), row])
            .filter(([sourceId]) => sourceId));
    }

    function finalizeClimateStressSummaryAccumulator(accumulator, options = {}) {
        if (!accumulator || accumulator.stressCellCount <= 0) {
            return null;
        }

        const idKey = normalizeString(options.idKey, 'sourceId');
        const countKey = normalizeString(options.countKey, 'coveredStressCellCount');
        const ratioKey = normalizeString(options.ratioKey, 'coveredStressCellRatio');
        const targetCellCountKey = normalizeString(options.targetCellCountKey, 'sourceCellCount');
        const targetCellCount = normalizeNonNegativeInteger(options.targetCellCount, 0);
        const climateSummary = accumulator.climateSummary && typeof accumulator.climateSummary === 'object'
            ? accumulator.climateSummary
            : {};
        const meanClimateStress = roundFieldValue(
            accumulator.climateStressTotal / Math.max(1, accumulator.stressCellCount)
        );

        return {
            summaryId: normalizeString(options.summaryId, `climate_stress_${accumulator.summaryType}_${accumulator.sourceId}`),
            summaryType: accumulator.summaryType,
            sourceRegionType: normalizeString(options.sourceRegionType, accumulator.summaryType),
            sourceId: accumulator.sourceId,
            [idKey]: accumulator.sourceId,
            sourceClimateSummaryId: normalizeString(climateSummary.summaryId, ''),
            climateBandIds: Array.isArray(climateSummary.climateBandIds)
                ? climateSummary.climateBandIds.slice()
                : [],
            primaryClimateBandId: normalizeString(climateSummary.primaryClimateBandId, ''),
            dominantBandType: normalizeString(climateSummary.dominantBandType, ''),
            climateBandCount: normalizeNonNegativeInteger(climateSummary.climateBandCount, 0),
            [countKey]: accumulator.stressCellCount,
            [ratioKey]: roundFieldValue(accumulator.stressCellCount / Math.max(1, targetCellCount || accumulator.stressCellCount)),
            [targetCellCountKey]: targetCellCount,
            meanClimateStress,
            peakClimateStress: roundFieldValue(accumulator.peakClimateStress),
            stressRegime: deriveClimateStressRegime(meanClimateStress),
            meanDrynessStress: roundFieldValue(accumulator.drynessStressTotal / Math.max(1, accumulator.stressCellCount)),
            meanColdStress: roundFieldValue(accumulator.coldStressTotal / Math.max(1, accumulator.stressCellCount)),
            meanHeatStress: roundFieldValue(accumulator.heatStressTotal / Math.max(1, accumulator.stressCellCount)),
            meanStormStress: roundFieldValue(accumulator.stormStressTotal / Math.max(1, accumulator.stressCellCount)),
            meanCoastalDecayStress: roundFieldValue(accumulator.coastalDecayStressTotal / Math.max(1, accumulator.stressCellCount)),
            meanSeasonalityStress: roundFieldValue(accumulator.seasonalityStressTotal / Math.max(1, accumulator.stressCellCount)),
            meanBiomeEnvelopeStress: roundFieldValue(accumulator.biomeEnvelopeStressTotal / Math.max(1, accumulator.stressCellCount)),
            climateSummaryMeanTemperatureBias: clampUnitInterval(climateSummary.meanTemperatureBias, 0),
            climateSummaryMeanHumidityBias: clampUnitInterval(climateSummary.meanHumidityBias, 0),
            climateSummaryMeanSeasonalityBias: clampUnitInterval(climateSummary.meanSeasonalityBias, 0),
            ...cloneValue(accumulator.metadata)
        };
    }

    function getNeighborCellIndices(cellIndex, width, height) {
        const x = cellIndex % width;
        const y = Math.floor(cellIndex / width);
        const neighbors = [];

        if (x > 0) {
            neighbors.push(cellIndex - 1);
        }
        if (x < width - 1) {
            neighbors.push(cellIndex + 1);
        }
        if (y > 0) {
            neighbors.push(cellIndex - width);
        }
        if (y < height - 1) {
            neighbors.push(cellIndex + width);
        }

        return neighbors;
    }

    function materializeClimateStressRegionalSummaries(input = {}, baseOutputs = {}) {
        const normalizedInput = normalizeInput(input);
        const climateStressField = baseOutputs.climateStressField
            || materializeClimateStressField(input, baseOutputs.fields || {}, baseOutputs.intermediateOutputs || {});
        const worldBounds = normalizeWorldBounds(climateStressField.worldBounds || normalizedInput.worldBounds);
        const width = worldBounds.width;
        const height = worldBounds.height;
        const size = width * height;
        const climateStressNamespace = normalizeString(climateStressField.seedNamespace, buildNamespace('climateStress'));
        const climateStressSeed = Number.isFinite(climateStressField.seed)
            ? climateStressField.seed
            : deriveSubSeed(normalizedInput.macroSeed, climateStressNamespace);
        const regionalClimateSummaries = baseOutputs.regionalClimateSummaries
            || findInputIntermediateOutput(input, REGIONAL_CLIMATE_SUMMARIES_ID)
            || null;
        const reliefRegionExtraction = findInputIntermediateOutput(input, 'reliefRegionExtraction');
        const continentBodiesOutput = findInputIntermediateOutput(input, 'continentBodies');
        const seaRegionClustersOutput = findInputIntermediateOutput(input, 'seaRegionClusters');
        const reliefRegionBodies = Array.isArray(reliefRegionExtraction && reliefRegionExtraction.reliefRegionBodies)
            ? reliefRegionExtraction.reliefRegionBodies.slice()
            : [];
        const continentBodies = Array.isArray(continentBodiesOutput && continentBodiesOutput.continentBodies)
            ? continentBodiesOutput.continentBodies.slice()
            : [];
        const seaRegionClusters = Array.isArray(seaRegionClustersOutput && seaRegionClustersOutput.seaRegionClusters)
            ? seaRegionClustersOutput.seaRegionClusters.slice()
            : [];
        const regionClimateLookup = createClimateSummaryLookup(regionalClimateSummaries, 'regionSummaries', 'reliefRegionId');
        const continentClimateLookup = createClimateSummaryLookup(regionalClimateSummaries, 'continentSummaries', 'continentId');
        const seaClimateLookup = createClimateSummaryLookup(regionalClimateSummaries, 'seaSummaries', 'seaRegionId');

        const regionSummaries = reliefRegionBodies
            .map((body) => {
                const reliefRegionId = normalizeString(
                    body && body.reliefRegionId,
                    normalizeString(body && body.record && body.record.reliefRegionId, '')
                );
                if (!reliefRegionId) {
                    return null;
                }

                const cellIndices = Array.isArray(body && body.cellIndices) ? body.cellIndices : [];
                const accumulator = createClimateStressSummaryAccumulator(
                    'reliefRegion',
                    reliefRegionId,
                    {
                        reliefRegionId,
                        reliefType: normalizeString(body && body.reliefType, normalizeString(body && body.record && body.record.reliefType, ''))
                    },
                    regionClimateLookup.get(reliefRegionId) || {}
                );
                cellIndices.forEach((cellIndex) => {
                    addClimateStressSummaryContribution(accumulator, climateStressField, cellIndex);
                });

                return finalizeClimateStressSummaryAccumulator(accumulator, {
                    summaryId: `climate_stress_region_${reliefRegionId}`,
                    sourceRegionType: 'reliefRegion',
                    idKey: 'reliefRegionId',
                    targetCellCount: normalizeNonNegativeInteger(body && body.cellCount, cellIndices.length),
                    targetCellCountKey: 'sourceCellCount',
                    countKey: 'coveredStressCellCount',
                    ratioKey: 'coveredStressCellRatio'
                });
            })
            .filter(Boolean)
            .sort((left, right) => left.reliefRegionId.localeCompare(right.reliefRegionId));
        const continentSummaries = continentBodies
            .map((body) => {
                const continentId = normalizeString(body && body.recordDraft && body.recordDraft.continentId, '');
                if (!continentId) {
                    return null;
                }

                const cellIndices = Array.isArray(body && body.cellIndices) ? body.cellIndices : [];
                const accumulator = createClimateStressSummaryAccumulator(
                    'continent',
                    continentId,
                    {
                        continentId,
                        continentBodyId: normalizeString(body && body.continentBodyId, ''),
                        macroShape: normalizeString(body && body.macroShape, normalizeString(body && body.recordDraft && body.recordDraft.macroShape, ''))
                    },
                    continentClimateLookup.get(continentId) || {}
                );
                cellIndices.forEach((cellIndex) => {
                    addClimateStressSummaryContribution(accumulator, climateStressField, cellIndex);
                });

                return finalizeClimateStressSummaryAccumulator(accumulator, {
                    summaryId: `climate_stress_continent_${continentId}`,
                    sourceRegionType: 'continentBody',
                    idKey: 'continentId',
                    targetCellCount: normalizeNonNegativeInteger(body && body.cellCount, cellIndices.length),
                    targetCellCountKey: 'sourceCellCount',
                    countKey: 'coveredStressCellCount',
                    ratioKey: 'coveredStressCellRatio'
                });
            })
            .filter(Boolean)
            .sort((left, right) => left.continentId.localeCompare(right.continentId));
        const seaSummaries = seaRegionClusters
            .map((cluster) => {
                const seaRegionId = normalizeString(
                    cluster && cluster.recordDraft && cluster.recordDraft.seaRegionId,
                    normalizeString(cluster && cluster.seaRegionId, '')
                );
                if (!seaRegionId) {
                    return null;
                }

                const adjacentLandCellIndices = new Set();
                const seaCellIndices = Array.isArray(cluster && cluster.cellIndices) ? cluster.cellIndices : [];
                seaCellIndices.forEach((cellIndex) => {
                    const normalizedIndex = normalizeCellIndex(cellIndex, size);
                    if (normalizedIndex < 0) {
                        return;
                    }

                    getNeighborCellIndices(normalizedIndex, width, height).forEach((neighborIndex) => {
                        const landMask = Array.isArray(climateStressField.landCellMaskValues)
                            ? clampUnitInterval(climateStressField.landCellMaskValues[neighborIndex], 0)
                            : 0;
                        if (landMask > 0.35) {
                            adjacentLandCellIndices.add(neighborIndex);
                        }
                    });
                });

                const accumulator = createClimateStressSummaryAccumulator(
                    'seaRegion',
                    seaRegionId,
                    {
                        seaRegionId,
                        seaRegionClusterId: normalizeString(cluster && cluster.seaRegionClusterId, ''),
                        basinType: normalizeString(cluster && cluster.basinType, normalizeString(cluster && cluster.recordDraft && cluster.recordDraft.basinType, ''))
                    },
                    seaClimateLookup.get(seaRegionId) || {}
                );
                adjacentLandCellIndices.forEach((cellIndex) => {
                    addClimateStressSummaryContribution(accumulator, climateStressField, cellIndex);
                });

                return finalizeClimateStressSummaryAccumulator(accumulator, {
                    summaryId: `climate_stress_sea_${seaRegionId}`,
                    sourceRegionType: 'seaRegionCluster',
                    idKey: 'seaRegionId',
                    targetCellCount: normalizeNonNegativeInteger(cluster && cluster.cellCount, seaCellIndices.length),
                    targetCellCountKey: 'sourceSeaCellCount',
                    countKey: 'adjacentLandStressCellCount',
                    ratioKey: 'adjacentLandStressRatio'
                });
            })
            .filter(Boolean)
            .sort((left, right) => left.seaRegionId.localeCompare(right.seaRegionId));

        return {
            outputId: CLIMATE_STRESS_SUMMARIES_ID,
            stageId: CLIMATE_STRESS_STAGE_ID,
            modelId: CLIMATE_STRESS_SUMMARIES_MODEL_ID,
            deterministic: true,
            seedNamespace: climateStressNamespace,
            seed: climateStressSeed,
            sourceFieldIds: [
                climateStressField.fieldId,
                ...normalizeStringList(climateStressField.sourceFieldIds)
            ],
            sourceIntermediateOutputIds: [
                REGIONAL_CLIMATE_SUMMARIES_ID,
                ...normalizeStringList(climateStressField.sourceIntermediateOutputIds)
            ],
            sourceRecordIds: ['climateBands'],
            worldBounds: cloneValue(worldBounds),
            macroSeed: normalizedInput.macroSeed,
            climateStressFieldId: CLIMATE_STRESS_FIELD_ID,
            sourceRegionalClimateSummariesId: regionalClimateSummaries
                ? normalizeString(regionalClimateSummaries.outputId, REGIONAL_CLIMATE_SUMMARIES_ID)
                : '',
            regionSummaries,
            continentSummaries,
            seaSummaries,
            summary: {
                summaryModel: 'climate_stress_regional_internal_format',
                stressFieldId: CLIMATE_STRESS_FIELD_ID,
                regionSummaryCount: regionSummaries.length,
                continentSummaryCount: continentSummaries.length,
                seaSummaryCount: seaSummaries.length,
                regionalClimateSummariesAvailable: Boolean(regionalClimateSummaries),
                reliefGeometryAvailable: reliefRegionBodies.length > 0,
                continentGeometryAvailable: continentBodies.length > 0,
                seaRegionGeometryAvailable: seaRegionClusters.length > 0,
                valueMeaning: 'summary rows combine climate-band summary identity with mean physical climate stress; no final package records are mutated'
            },
            compatibility: {
                stableInternalFormat: true,
                climateStressFieldSummaryOutput: true,
                regionalClimateSummaryReferenceOutput: true,
                futurePressureGeneratorInput: true,
                fullPackageAssemblyOutput: false,
                downstreamPressureGeneratorOutput: false,
                debugPanelOutput: false,
                gameplayWeatherOutput: false,
                rendererAgnostic: true
            },
            intentionallyAbsent: [
                'fullMacroGeographyPackage',
                'phase2PressurePackage',
                'downstreamPressureGenerator',
                'debugPanel',
                'gameplayWeatherSystems',
                'terrainCells',
                'uiOverlays'
            ]
        };
    }

    function normalizeDebugCoordinate(value, size) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue) || size <= 0) {
            return 0;
        }

        return Math.max(0, Math.min(size - 1, Math.trunc(numericValue)));
    }

    function hasSerializedScalarValues(serializedField) {
        return Boolean(
            serializedField
            && typeof serializedField === 'object'
            && Array.isArray(serializedField.values)
            && serializedField.values.length > 0
        );
    }

    function hasSerializedDirectionalValues(serializedField) {
        return Boolean(
            serializedField
            && typeof serializedField === 'object'
            && Array.isArray(serializedField.xValues)
            && Array.isArray(serializedField.yValues)
            && serializedField.xValues.length > 0
            && serializedField.yValues.length > 0
        );
    }

    function createSerializedScalarFieldDebugAdapter(serializedField = {}, fallbackFieldId = 'scalarField') {
        const fieldId = normalizeString(serializedField.fieldId, fallbackFieldId);
        const width = normalizeNonNegativeInteger(serializedField.width, 0);
        const height = normalizeNonNegativeInteger(serializedField.height, 0);
        const size = normalizeNonNegativeInteger(serializedField.size, width * height);
        const values = Array.isArray(serializedField.values)
            ? serializedField.values.map((value) => Number.isFinite(value) ? value : 0)
            : new Array(size).fill(0);
        const range = Array.isArray(serializedField.range) && serializedField.range.length >= 2
            ? serializedField.range.slice(0, 2)
            : DEFAULT_FIELD_RANGE.slice();

        return {
            type: 'ScalarField',
            fieldId,
            width,
            height,
            size,
            cloneValues() {
                return values.slice();
            },
            read(x, y, fallback = 0) {
                if (width <= 0 || height <= 0) {
                    return fallback;
                }

                const normalizedX = normalizeDebugCoordinate(x, width);
                const normalizedY = normalizeDebugCoordinate(y, height);
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

    function createSerializedDirectionalFieldDebugAdapter(serializedField = {}, fallbackFieldId = 'directionalField') {
        const fieldId = normalizeString(serializedField.fieldId, fallbackFieldId);
        const width = normalizeNonNegativeInteger(serializedField.width, 0);
        const height = normalizeNonNegativeInteger(serializedField.height, 0);
        const size = normalizeNonNegativeInteger(serializedField.size, width * height);
        const xValues = Array.isArray(serializedField.xValues)
            ? serializedField.xValues.map((value) => Number.isFinite(value) ? value : 0)
            : new Array(size).fill(0);
        const yValues = Array.isArray(serializedField.yValues)
            ? serializedField.yValues.map((value) => Number.isFinite(value) ? value : 0)
            : new Array(size).fill(0);

        return {
            type: 'DirectionalField',
            fieldId,
            width,
            height,
            size,
            cloneVectors() {
                return {
                    x: xValues.slice(),
                    y: yValues.slice()
                };
            },
            read(x, y) {
                if (width <= 0 || height <= 0) {
                    return {
                        x: 0,
                        y: 0
                    };
                }

                const normalizedX = normalizeDebugCoordinate(x, width);
                const normalizedY = normalizeDebugCoordinate(y, height);
                const index = (normalizedY * width) + normalizedX;

                return {
                    x: Number.isFinite(xValues[index]) ? xValues[index] : 0,
                    y: Number.isFinite(yValues[index]) ? yValues[index] : 0
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

    function createClassificationDebugField(classificationOutput = {}, fallbackFieldId = 'classificationDebugField') {
        const outputId = normalizeString(classificationOutput.outputId, fallbackFieldId);
        const width = normalizeNonNegativeInteger(classificationOutput.width, 0);
        const height = normalizeNonNegativeInteger(classificationOutput.height, 0);
        const size = normalizeNonNegativeInteger(classificationOutput.size, width * height);
        const classificationIndices = Array.isArray(classificationOutput.classificationIndices)
            ? classificationOutput.classificationIndices.slice()
            : new Array(size).fill(-1);
        const legendCount = Array.isArray(classificationOutput.classificationLegend)
            ? classificationOutput.classificationLegend.length
            : 0;
        const maxObservedIndex = classificationIndices.reduce((maxIndex, value) => {
            const classIndex = Number(value);
            return Number.isFinite(classIndex) && classIndex >= 0
                ? Math.max(maxIndex, Math.trunc(classIndex))
                : maxIndex;
        }, -1);
        const classCount = Math.max(legendCount, maxObservedIndex + 1, 1);
        const values = classificationIndices.map((value) => {
            const classIndex = Number(value);
            if (!Number.isFinite(classIndex) || classIndex < 0) {
                return 0;
            }

            return roundFieldValue((Math.trunc(classIndex) + 1) / classCount);
        });

        return {
            field: createSerializedScalarFieldDebugAdapter({
                fieldId: outputId,
                width,
                height,
                size,
                range: DEFAULT_FIELD_RANGE.slice(),
                values
            }, outputId),
            classCount,
            classificationLegend: Array.isArray(classificationOutput.classificationLegend)
                ? cloneValue(classificationOutput.classificationLegend)
                : [],
            unclassifiedValue: Number.isFinite(classificationOutput.unclassifiedValue)
                ? classificationOutput.unclassifiedValue
                : -1,
            classificationEncoding: normalizeString(
                classificationOutput.classificationEncoding,
                'rowMajorIntegerArray'
            ),
            summary: classificationOutput.summary && typeof classificationOutput.summary === 'object'
                ? cloneValue(classificationOutput.summary)
                : {}
        };
    }

    function decorateClassificationDebugArtifact(artifact, classificationDebugField, sourceOutputId) {
        const decoratedArtifact = cloneValue(artifact);
        decoratedArtifact.payload.sourceOutputId = normalizeString(sourceOutputId, '');
        decoratedArtifact.payload.originalClassificationEncoding = classificationDebugField.classificationEncoding;
        decoratedArtifact.payload.originalUnclassifiedValue = classificationDebugField.unclassifiedValue;
        decoratedArtifact.payload.classificationLegend = classificationDebugField.classificationLegend;
        decoratedArtifact.payload.classCount = classificationDebugField.classCount;
        decoratedArtifact.payload.encodingPolicy = '0 means unclassified/water/missing context; positive values encode (classificationIndex + 1) / classCount for stable scalar heatmap export.';
        decoratedArtifact.payload.summary = cloneValue(classificationDebugField.summary);

        return decoratedArtifact;
    }

    function buildClimateBiomeFieldSnapshotsFromResolvedOutputs(input = {}, resolvedOutputs = {}) {
        if (typeof macro.buildFieldDebugArtifact !== 'function') {
            return [];
        }

        const fields = resolvedOutputs.fields && typeof resolvedOutputs.fields === 'object'
            ? resolvedOutputs.fields
            : {};
        const intermediateOutputs = resolvedOutputs.intermediateOutputs
            && typeof resolvedOutputs.intermediateOutputs === 'object'
            ? resolvedOutputs.intermediateOutputs
            : {};
        const records = resolvedOutputs.records && typeof resolvedOutputs.records === 'object'
            ? resolvedOutputs.records
            : {};
        const biomeEnvelopeClassification = intermediateOutputs[BIOME_ENVELOPE_CLASSIFICATION_ID]
            || resolveBiomeEnvelopeClassification(input, fields, {
                [CLIMATE_ZONE_CLASSIFICATION_ID]: intermediateOutputs[CLIMATE_ZONE_CLASSIFICATION_ID],
                [REGIONAL_CLIMATE_SUMMARIES_ID]: intermediateOutputs[REGIONAL_CLIMATE_SUMMARIES_ID],
                climateBands: Array.isArray(records.climateBands) ? records.climateBands.slice() : []
            });
        const snapshotSpecs = [
            {
                field: hasSerializedScalarValues(fields[LATITUDE_BAND_BASELINE_FIELD_ID])
                    ? createSerializedScalarFieldDebugAdapter(fields[LATITUDE_BAND_BASELINE_FIELD_ID], LATITUDE_BAND_BASELINE_FIELD_ID)
                    : null,
                layerId: 'scalarHeatmap',
                artifactId: 'climate.latitudeBandBaselineField.scalarHeatmap',
                stageId: normalizeString(fields[LATITUDE_BAND_BASELINE_FIELD_ID] && fields[LATITUDE_BAND_BASELINE_FIELD_ID].stageId, LATITUDE_BAND_STAGE_ID),
                sourceLayerId: LATITUDE_BAND_BASELINE_FIELD_ID
            },
            {
                field: hasSerializedDirectionalValues(fields[PREVAILING_WIND_FIELD_ID])
                    ? createSerializedDirectionalFieldDebugAdapter(fields[PREVAILING_WIND_FIELD_ID], PREVAILING_WIND_FIELD_ID)
                    : null,
                layerId: 'directionalVectors',
                artifactId: 'climate.prevailingWindField.directionalVectors',
                stageId: normalizeString(fields[PREVAILING_WIND_FIELD_ID] && fields[PREVAILING_WIND_FIELD_ID].stageId, PREVAILING_WIND_STAGE_ID),
                sourceLayerId: PREVAILING_WIND_FIELD_ID
            },
            {
                field: hasSerializedScalarValues(fields[HUMIDITY_TRANSPORT_FIELD_ID])
                    ? createSerializedScalarFieldDebugAdapter(fields[HUMIDITY_TRANSPORT_FIELD_ID], HUMIDITY_TRANSPORT_FIELD_ID)
                    : null,
                layerId: 'scalarHeatmap',
                artifactId: 'climate.humidityTransportField.scalarHeatmap',
                stageId: normalizeString(fields[HUMIDITY_TRANSPORT_FIELD_ID] && fields[HUMIDITY_TRANSPORT_FIELD_ID].stageId, HUMIDITY_TRANSPORT_STAGE_ID),
                sourceLayerId: HUMIDITY_TRANSPORT_FIELD_ID
            },
            {
                field: hasSerializedScalarValues(fields[TEMPERATURE_COLD_LOAD_FIELD_ID])
                    ? createSerializedScalarFieldDebugAdapter(fields[TEMPERATURE_COLD_LOAD_FIELD_ID], TEMPERATURE_COLD_LOAD_FIELD_ID)
                    : null,
                layerId: 'scalarHeatmap',
                artifactId: 'climate.temperatureColdLoadField.scalarHeatmap',
                stageId: normalizeString(fields[TEMPERATURE_COLD_LOAD_FIELD_ID] && fields[TEMPERATURE_COLD_LOAD_FIELD_ID].stageId, TEMPERATURE_COLD_LOAD_STAGE_ID),
                sourceLayerId: TEMPERATURE_COLD_LOAD_FIELD_ID
            },
            {
                field: hasSerializedScalarValues(fields[WETNESS_FIELD_ID])
                    ? createSerializedScalarFieldDebugAdapter(fields[WETNESS_FIELD_ID], WETNESS_FIELD_ID)
                    : null,
                layerId: 'scalarHeatmap',
                artifactId: 'climate.wetnessField.scalarHeatmap',
                stageId: normalizeString(fields[WETNESS_FIELD_ID] && fields[WETNESS_FIELD_ID].stageId, RAIN_SHADOW_STAGE_ID),
                sourceLayerId: WETNESS_FIELD_ID
            },
            {
                field: hasSerializedScalarValues(fields[STORM_CORRIDOR_FIELD_ID])
                    ? createSerializedScalarFieldDebugAdapter(fields[STORM_CORRIDOR_FIELD_ID], STORM_CORRIDOR_FIELD_ID)
                    : null,
                layerId: 'scalarHeatmap',
                artifactId: 'climate.stormCorridorField.scalarHeatmap',
                stageId: normalizeString(fields[STORM_CORRIDOR_FIELD_ID] && fields[STORM_CORRIDOR_FIELD_ID].stageId, STORM_AND_DECAY_STAGE_ID),
                sourceLayerId: STORM_CORRIDOR_FIELD_ID
            },
            {
                field: hasSerializedScalarValues(fields[COASTAL_DECAY_BURDEN_FIELD_ID])
                    ? createSerializedScalarFieldDebugAdapter(fields[COASTAL_DECAY_BURDEN_FIELD_ID], COASTAL_DECAY_BURDEN_FIELD_ID)
                    : null,
                layerId: 'scalarHeatmap',
                artifactId: 'climate.coastalDecayBurdenField.scalarHeatmap',
                stageId: normalizeString(fields[COASTAL_DECAY_BURDEN_FIELD_ID] && fields[COASTAL_DECAY_BURDEN_FIELD_ID].stageId, STORM_AND_DECAY_STAGE_ID),
                sourceLayerId: COASTAL_DECAY_BURDEN_FIELD_ID
            },
            {
                field: hasSerializedScalarValues(fields[SEASONALITY_FIELD_ID])
                    ? createSerializedScalarFieldDebugAdapter(fields[SEASONALITY_FIELD_ID], SEASONALITY_FIELD_ID)
                    : null,
                layerId: 'scalarHeatmap',
                artifactId: 'climate.seasonalityField.scalarHeatmap',
                stageId: normalizeString(fields[SEASONALITY_FIELD_ID] && fields[SEASONALITY_FIELD_ID].stageId, STORM_AND_DECAY_STAGE_ID),
                sourceLayerId: SEASONALITY_FIELD_ID
            },
            {
                field: hasSerializedScalarValues(fields[CLIMATE_STRESS_FIELD_ID])
                    ? createSerializedScalarFieldDebugAdapter(fields[CLIMATE_STRESS_FIELD_ID], CLIMATE_STRESS_FIELD_ID)
                    : null,
                layerId: 'scalarHeatmap',
                artifactId: 'climate.climateStressField.scalarHeatmap',
                stageId: normalizeString(fields[CLIMATE_STRESS_FIELD_ID] && fields[CLIMATE_STRESS_FIELD_ID].stageId, CLIMATE_STRESS_STAGE_ID),
                sourceLayerId: CLIMATE_STRESS_FIELD_ID
            },
            {
                field: hasSerializedScalarValues(intermediateOutputs[RAIN_SHADOW_EFFECT_ID])
                    ? createSerializedScalarFieldDebugAdapter(intermediateOutputs[RAIN_SHADOW_EFFECT_ID], RAIN_SHADOW_EFFECT_ID)
                    : null,
                layerId: 'scalarHeatmap',
                artifactId: 'climate.rainShadowEffect.scalarHeatmap',
                stageId: normalizeString(intermediateOutputs[RAIN_SHADOW_EFFECT_ID] && intermediateOutputs[RAIN_SHADOW_EFFECT_ID].stageId, RAIN_SHADOW_STAGE_ID),
                sourceLayerId: RAIN_SHADOW_EFFECT_ID
            }
        ];

        if (
            intermediateOutputs[CLIMATE_ZONE_CLASSIFICATION_ID]
            && Array.isArray(intermediateOutputs[CLIMATE_ZONE_CLASSIFICATION_ID].classificationIndices)
        ) {
            const climateClassificationField = createClassificationDebugField(
                intermediateOutputs[CLIMATE_ZONE_CLASSIFICATION_ID],
                CLIMATE_ZONE_CLASSIFICATION_ID
            );
            snapshotSpecs.push({
                field: climateClassificationField.field,
                layerId: 'scalarHeatmap',
                artifactId: 'climate.climateZoneClassification.scalarHeatmap',
                stageId: CLIMATE_BAND_STAGE_ID,
                sourceLayerId: CLIMATE_ZONE_CLASSIFICATION_ID,
                decorateArtifact: (artifact) => decorateClassificationDebugArtifact(
                    artifact,
                    climateClassificationField,
                    CLIMATE_ZONE_CLASSIFICATION_ID
                )
            });
        }

        if (biomeEnvelopeClassification && Array.isArray(biomeEnvelopeClassification.classificationIndices)) {
            const biomeClassificationField = createClassificationDebugField(
                biomeEnvelopeClassification,
                BIOME_ENVELOPE_CLASSIFICATION_ID
            );
            snapshotSpecs.push({
                field: biomeClassificationField.field,
                layerId: 'scalarHeatmap',
                artifactId: 'biome.biomeEnvelopeClassification.scalarHeatmap',
                stageId: CLIMATE_BIOME_DEBUG_STAGE_ID,
                sourceLayerId: BIOME_ENVELOPE_CLASSIFICATION_ID,
                decorateArtifact: (artifact) => decorateClassificationDebugArtifact(
                    artifact,
                    biomeClassificationField,
                    BIOME_ENVELOPE_CLASSIFICATION_ID
                )
            });
        }

        return snapshotSpecs
            .filter((snapshotSpec) => snapshotSpec.field)
            .map((snapshotSpec) => {
                const artifact = macro.buildFieldDebugArtifact(snapshotSpec.field, {
                    layerId: snapshotSpec.layerId,
                    artifactId: snapshotSpec.artifactId,
                    stageId: snapshotSpec.stageId,
                    sourceLayerId: snapshotSpec.sourceLayerId
                });

                return typeof snapshotSpec.decorateArtifact === 'function'
                    ? snapshotSpec.decorateArtifact(artifact)
                    : artifact;
            });
    }

    function materializeClimateZoneClassification(input = {}, baseFields = {}) {
        const normalizedInput = normalizeInput(input);
        const worldBounds = normalizedInput.worldBounds;
        const width = worldBounds.width;
        const height = worldBounds.height;
        const size = width * height;
        const climateBandNamespace = buildNamespace('climateBands');
        const climateBandSeed = deriveSubSeed(normalizedInput.macroSeed, climateBandNamespace);
        const latitudeBandBaselineField = baseFields.latitudeBandBaselineField
            || materializeLatitudeBandBaselineField(input);
        const prevailingWindField = baseFields.prevailingWindField
            || materializePrevailingWindField(input);
        const humidityFieldBundle = baseFields.humidityTransportField && baseFields.wetnessField
            ? null
            : materializeHumidityTransportFields(input, {
                latitudeBandBaselineField,
                prevailingWindField
            });
        const humidityTransportField = baseFields.humidityTransportField
            || (humidityFieldBundle && humidityFieldBundle.humidityTransportField)
            || materializeHumidityTransportFields(input, {
                latitudeBandBaselineField,
                prevailingWindField
            }).humidityTransportField;
        const preRainShadowWetnessField = humidityFieldBundle && humidityFieldBundle.wetnessField
            ? humidityFieldBundle.wetnessField
            : materializeHumidityTransportFields(input, {
                latitudeBandBaselineField,
                prevailingWindField
            }).wetnessField;
        const temperatureColdLoadField = baseFields.temperatureColdLoadField
            || materializeTemperatureColdLoadField(input, {
                latitudeBandBaselineField
            });
        const wetnessField = baseFields.wetnessField
            || materializeRainShadowEffect(input, {
                prevailingWindField,
                humidityTransportField,
                wetnessField: preRainShadowWetnessField
            }).wetnessField;
        const stormCorridorField = baseFields.stormCorridorField
            || materializeStormCorridorField(input, {
                latitudeBandBaselineField,
                prevailingWindField,
                humidityTransportField,
                temperatureColdLoadField,
                wetnessField
            });
        const coastalDecayBurdenField = baseFields.coastalDecayBurdenField
            || materializeCoastalDecayBurdenField(input, {
                latitudeBandBaselineField,
                prevailingWindField,
                humidityTransportField,
                temperatureColdLoadField,
                stormCorridorField,
                wetnessField
            });
        const seasonalityField = baseFields.seasonalityField
            || materializeSeasonalityField(input, {
                latitudeBandBaselineField,
                prevailingWindField,
                humidityTransportField,
                temperatureColdLoadField,
                stormCorridorField,
                coastalDecayBurdenField,
                wetnessField
            });
        const landmassCleanupMaskField = findInputField(input, 'landmassCleanupMaskField');
        const seaLevelAppliedElevationField = findInputField(input, 'seaLevelAppliedElevationField');
        const continentBodiesOutput = findInputIntermediateOutput(input, 'continentBodies');
        const reliefRegionExtraction = findInputIntermediateOutput(input, 'reliefRegionExtraction');
        const seaRegionClustersOutput = findInputIntermediateOutput(input, 'seaRegionClusters');
        const continentBodies = Array.isArray(continentBodiesOutput && continentBodiesOutput.continentBodies)
            ? continentBodiesOutput.continentBodies.slice()
            : [];
        const reliefRegionBodies = Array.isArray(reliefRegionExtraction && reliefRegionExtraction.reliefRegionBodies)
            ? reliefRegionExtraction.reliefRegionBodies.slice()
            : [];
        const seaRegionClusters = Array.isArray(seaRegionClustersOutput && seaRegionClustersOutput.seaRegionClusters)
            ? seaRegionClustersOutput.seaRegionClusters.slice()
            : [];
        const sourceFieldIds = [
            latitudeBandBaselineField.fieldId,
            temperatureColdLoadField.fieldId,
            humidityTransportField.fieldId,
            wetnessField.fieldId,
            stormCorridorField.fieldId,
            coastalDecayBurdenField.fieldId,
            seasonalityField.fieldId,
            landmassCleanupMaskField && landmassCleanupMaskField.fieldId,
            seaLevelAppliedElevationField && seaLevelAppliedElevationField.fieldId
        ].filter(Boolean);
        const sourceIntermediateOutputIds = [
            continentBodies.length ? 'continentBodies' : '',
            reliefRegionExtraction && 'reliefRegionExtraction',
            seaRegionClusters.length ? 'seaRegionClusters' : ''
        ].filter(Boolean);
        const classificationIndices = new Array(size).fill(-1);
        const classificationLegend = [];
        const legendIndexByKey = new Map();
        const reliefRegionIdByCell = new Map();
        const seaRegionIdByCell = new Map();
        const temperatureBiasByCell = new Array(size).fill(0);
        const humidityBiasByCell = new Array(size).fill(0);
        const stormBiasByCell = new Array(size).fill(0);
        const seasonalityBiasByCell = new Array(size).fill(0);
        const predictabilityByCell = new Array(size).fill(0);
        let classifiedCellCount = 0;
        let intenseStormZoneCellCount = 0;
        let highSeasonalityZoneCellCount = 0;
        let stableZoneCellCount = 0;

        function getNeighborCellIndices(cellIndex) {
            const x = cellIndex % width;
            const y = Math.floor(cellIndex / width);
            const neighbors = [];

            if (x > 0) {
                neighbors.push(cellIndex - 1);
            }
            if (x < width - 1) {
                neighbors.push(cellIndex + 1);
            }
            if (y > 0) {
                neighbors.push(cellIndex - width);
            }
            if (y < height - 1) {
                neighbors.push(cellIndex + width);
            }

            return neighbors;
        }

        function getTemperatureBucket(temperatureBias) {
            if (temperatureBias < 0.12) {
                return 'polar';
            }
            if (temperatureBias < 0.28) {
                return 'cold';
            }
            if (temperatureBias < 0.46) {
                return 'cool_temperate';
            }
            if (temperatureBias < 0.62) {
                return 'temperate';
            }
            if (temperatureBias < 0.76) {
                return 'warm_temperate';
            }
            if (temperatureBias < 0.9) {
                return 'subtropical';
            }

            return 'tropical';
        }

        function getHumidityBucket(humidityBias) {
            if (humidityBias < 0.16) {
                return 'arid';
            }
            if (humidityBias < 0.34) {
                return 'dry';
            }
            if (humidityBias < 0.52) {
                return 'subhumid';
            }
            if (humidityBias < 0.72) {
                return 'humid';
            }

            return 'wet';
        }

        function getStormRegime(stormBias, coastalDecayBurden) {
            if (stormBias >= 0.68 || (stormBias >= 0.56 && coastalDecayBurden >= 0.42)) {
                return 'storm';
            }
            if (stormBias <= 0.24) {
                return 'calm';
            }

            return 'variable';
        }

        function getSeasonalityRegime(seasonalityBias, predictabilityBias) {
            if (seasonalityBias >= 0.68) {
                return 'seasonal';
            }
            if (seasonalityBias <= 0.24 && predictabilityBias >= 0.58) {
                return 'stable';
            }
            if (predictabilityBias <= 0.34) {
                return 'volatile';
            }

            return 'balanced';
        }

        function deriveBandType(descriptor) {
            const temperatureBucket = descriptor.temperatureBucket;
            const humidityBucket = descriptor.humidityBucket;
            const stormRegime = descriptor.stormRegime;
            const seasonalityRegime = descriptor.seasonalityRegime;
            const maritimeModeration = descriptor.maritimeModeration;
            const humidityBias = descriptor.humidityBias;

            let bandType = `${humidityBucket}_${temperatureBucket}`;

            if (
                maritimeModeration >= 0.56
                && humidityBias >= 0.44
                && (temperatureBucket === 'cold' || temperatureBucket === 'cool_temperate')
            ) {
                bandType = `${temperatureBucket}_maritime`;
            }

            if (stormRegime === 'storm') {
                bandType = `storm_${bandType}`;
            }

            if (seasonalityRegime === 'seasonal') {
                bandType = `${bandType}_seasonal`;
            } else if (seasonalityRegime === 'stable' && stormRegime !== 'storm') {
                bandType = `${bandType}_stable`;
            }

            return bandType;
        }

        function createFallbackClimateBandRecord(inputRecord = {}) {
            return {
                climateBandId: normalizeString(inputRecord.climateBandId, ''),
                bandType: normalizeString(inputRecord.bandType, ''),
                reliefRegionIds: Array.isArray(inputRecord.reliefRegionIds) ? inputRecord.reliefRegionIds.slice() : [],
                seaRegionIds: Array.isArray(inputRecord.seaRegionIds) ? inputRecord.seaRegionIds.slice() : [],
                primaryReliefRegionId: normalizeString(inputRecord.primaryReliefRegionId, ''),
                temperatureBias: clampUnitInterval(inputRecord.temperatureBias, 0),
                humidityBias: clampUnitInterval(inputRecord.humidityBias, 0),
                seasonalityBias: clampUnitInterval(inputRecord.seasonalityBias, 0)
            };
        }

        function sortCountEntries(countMap) {
            return [...countMap.entries()].sort((left, right) => {
                if (right[1] !== left[1]) {
                    return right[1] - left[1];
                }

                return left[0].localeCompare(right[0]);
            });
        }

        function buildClimateBandId(sequence) {
            return `climate_${String(sequence).padStart(3, '0')}`;
        }

        reliefRegionBodies.forEach((body) => {
            const reliefRegionId = normalizeString(
                body && body.reliefRegionId,
                normalizeString(body && body.record && body.record.reliefRegionId, '')
            );
            if (!reliefRegionId || !Array.isArray(body && body.cellIndices)) {
                return;
            }

            body.cellIndices.forEach((cellIndex) => {
                reliefRegionIdByCell.set(cellIndex, reliefRegionId);
            });
        });

        seaRegionClusters.forEach((cluster) => {
            const seaRegionId = normalizeString(
                cluster && cluster.recordDraft && cluster.recordDraft.seaRegionId,
                normalizeString(cluster && cluster.seaRegionId, '')
            );
            if (!seaRegionId || !Array.isArray(cluster && cluster.cellIndices)) {
                return;
            }

            cluster.cellIndices.forEach((cellIndex) => {
                seaRegionIdByCell.set(cellIndex, seaRegionId);
            });
        });

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const index = y * width + x;
                const elevation = readScalarFieldValue(seaLevelAppliedElevationField, x, y, worldBounds, 0);
                const landMask = readScalarFieldValue(
                    landmassCleanupMaskField,
                    x,
                    y,
                    worldBounds,
                    elevation > 0.5 ? 1 : 0
                );

                if (landMask <= 0.35) {
                    continue;
                }

                const temperatureBias = readScalarFieldValue(temperatureColdLoadField, x, y, worldBounds, 0.5);
                const humidityBias = readScalarFieldValue(wetnessField, x, y, worldBounds, 0);
                const stormBias = readScalarFieldValue(stormCorridorField, x, y, worldBounds, 0);
                const seasonalityBias = readScalarFieldValue(seasonalityField, x, y, worldBounds, 0);
                const predictabilityBias = readScalarFieldChannelValue(
                    seasonalityField,
                    'predictabilityValues',
                    x,
                    y,
                    worldBounds,
                    0.5
                );
                const maritimeModeration = readScalarFieldChannelValue(
                    temperatureColdLoadField,
                    'maritimeModerationValues',
                    x,
                    y,
                    worldBounds,
                    0
                );
                const coastalDecayBurden = readScalarFieldValue(coastalDecayBurdenField, x, y, worldBounds, 0);
                const descriptor = {
                    temperatureBucket: getTemperatureBucket(temperatureBias),
                    humidityBucket: getHumidityBucket(humidityBias),
                    stormRegime: getStormRegime(stormBias, coastalDecayBurden),
                    seasonalityRegime: getSeasonalityRegime(seasonalityBias, predictabilityBias),
                    maritimeModeration,
                    humidityBias
                };
                const bandType = deriveBandType(descriptor);
                let legendIndex = legendIndexByKey.get(bandType);

                if (legendIndex === undefined) {
                    legendIndex = classificationLegend.length;
                    legendIndexByKey.set(bandType, legendIndex);
                    classificationLegend.push({
                        classificationIndex: legendIndex,
                        bandType,
                        temperatureBucket: descriptor.temperatureBucket,
                        humidityBucket: descriptor.humidityBucket,
                        stormRegime: descriptor.stormRegime,
                        seasonalityRegime: descriptor.seasonalityRegime,
                        cellCount: 0,
                        meanTemperatureBias: 0,
                        meanHumidityBias: 0,
                        meanStormBias: 0,
                        meanSeasonalityBias: 0,
                        meanPredictabilityBias: 0,
                        _temperatureTotal: 0,
                        _humidityTotal: 0,
                        _stormTotal: 0,
                        _seasonalityTotal: 0,
                        _predictabilityTotal: 0
                    });
                }

                classificationIndices[index] = legendIndex;
                temperatureBiasByCell[index] = temperatureBias;
                humidityBiasByCell[index] = humidityBias;
                stormBiasByCell[index] = stormBias;
                seasonalityBiasByCell[index] = seasonalityBias;
                predictabilityByCell[index] = predictabilityBias;

                const legendEntry = classificationLegend[legendIndex];
                legendEntry.cellCount += 1;
                legendEntry._temperatureTotal += temperatureBias;
                legendEntry._humidityTotal += humidityBias;
                legendEntry._stormTotal += stormBias;
                legendEntry._seasonalityTotal += seasonalityBias;
                legendEntry._predictabilityTotal += predictabilityBias;
                classifiedCellCount += 1;

                if (descriptor.stormRegime === 'storm') {
                    intenseStormZoneCellCount += 1;
                }
                if (descriptor.seasonalityRegime === 'seasonal') {
                    highSeasonalityZoneCellCount += 1;
                }
                if (descriptor.seasonalityRegime === 'stable') {
                    stableZoneCellCount += 1;
                }
            }
        }

        classificationLegend.forEach((legendEntry) => {
            const cellCount = Math.max(1, legendEntry.cellCount);
            legendEntry.meanTemperatureBias = roundFieldValue(legendEntry._temperatureTotal / cellCount);
            legendEntry.meanHumidityBias = roundFieldValue(legendEntry._humidityTotal / cellCount);
            legendEntry.meanStormBias = roundFieldValue(legendEntry._stormTotal / cellCount);
            legendEntry.meanSeasonalityBias = roundFieldValue(legendEntry._seasonalityTotal / cellCount);
            legendEntry.meanPredictabilityBias = roundFieldValue(legendEntry._predictabilityTotal / cellCount);
            delete legendEntry._temperatureTotal;
            delete legendEntry._humidityTotal;
            delete legendEntry._stormTotal;
            delete legendEntry._seasonalityTotal;
            delete legendEntry._predictabilityTotal;
        });

        const visited = new Uint8Array(size);
        const zoneComponents = [];

        for (let startIndex = 0; startIndex < size; startIndex += 1) {
            const classificationIndex = classificationIndices[startIndex];
            if (classificationIndex < 0 || visited[startIndex]) {
                continue;
            }

            const queue = [startIndex];
            visited[startIndex] = 1;
            const cellIndices = [];
            const reliefRegionCounts = new Map();
            const seaRegionCounts = new Map();
            let temperatureTotal = 0;
            let humidityTotal = 0;
            let stormTotal = 0;
            let seasonalityTotal = 0;
            let predictabilityTotal = 0;
            let minCellIndex = startIndex;

            while (queue.length) {
                const currentIndex = queue.pop();
                cellIndices.push(currentIndex);
                minCellIndex = Math.min(minCellIndex, currentIndex);
                temperatureTotal += temperatureBiasByCell[currentIndex];
                humidityTotal += humidityBiasByCell[currentIndex];
                stormTotal += stormBiasByCell[currentIndex];
                seasonalityTotal += seasonalityBiasByCell[currentIndex];
                predictabilityTotal += predictabilityByCell[currentIndex];

                const reliefRegionId = reliefRegionIdByCell.get(currentIndex);
                if (reliefRegionId) {
                    reliefRegionCounts.set(reliefRegionId, (reliefRegionCounts.get(reliefRegionId) || 0) + 1);
                }

                const neighbors = getNeighborCellIndices(currentIndex);
                neighbors.forEach((neighborIndex) => {
                    if (classificationIndices[neighborIndex] === classificationIndex) {
                        if (!visited[neighborIndex]) {
                            visited[neighborIndex] = 1;
                            queue.push(neighborIndex);
                        }
                        return;
                    }

                    const seaRegionId = seaRegionIdByCell.get(neighborIndex);
                    if (seaRegionId) {
                        seaRegionCounts.set(seaRegionId, (seaRegionCounts.get(seaRegionId) || 0) + 1);
                    }
                });
            }

            const reliefRegionOverlap = sortCountEntries(reliefRegionCounts).map(([reliefRegionId, reliefCellCount]) => ({
                reliefRegionId,
                cellCount: reliefCellCount,
                cellRatio: roundFieldValue(reliefCellCount / Math.max(1, cellIndices.length))
            }));
            const seaRegionOverlap = sortCountEntries(seaRegionCounts).map(([seaRegionId, adjacentCellCount]) => ({
                seaRegionId,
                adjacentCellCount,
                adjacentCellRatio: roundFieldValue(adjacentCellCount / Math.max(1, cellIndices.length))
            }));
            const reliefRegionIds = reliefRegionOverlap.map((entry) => entry.reliefRegionId);
            const seaRegionIds = seaRegionOverlap.map((entry) => entry.seaRegionId);
            const primaryReliefRegionId = reliefRegionIds[0] || '';
            const cellCount = cellIndices.length;
            zoneComponents.push({
                zoneIdHint: `zone_${String(zoneComponents.length + 1).padStart(3, '0')}`,
                classificationIndex,
                bandType: classificationLegend[classificationIndex].bandType,
                cellCount,
                cellIndices,
                anchorCellIndex: minCellIndex,
                reliefRegionIds,
                reliefRegionOverlap,
                seaRegionIds,
                seaRegionOverlap,
                primaryReliefRegionId,
                meanTemperatureBias: roundFieldValue(temperatureTotal / Math.max(1, cellCount)),
                meanHumidityBias: roundFieldValue(humidityTotal / Math.max(1, cellCount)),
                meanStormBias: roundFieldValue(stormTotal / Math.max(1, cellCount)),
                meanSeasonalityBias: roundFieldValue(seasonalityTotal / Math.max(1, cellCount)),
                meanPredictabilityBias: roundFieldValue(predictabilityTotal / Math.max(1, cellCount)),
                recordCompatible: Boolean(primaryReliefRegionId)
            });
        }

        zoneComponents.sort((left, right) => {
            if (left.anchorCellIndex !== right.anchorCellIndex) {
                return left.anchorCellIndex - right.anchorCellIndex;
            }

            return left.bandType.localeCompare(right.bandType);
        });

        const createClimateBandRecord = typeof macro.createClimateBandRecordSkeleton === 'function'
            ? macro.createClimateBandRecordSkeleton
            : createFallbackClimateBandRecord;
        const climateBands = [];
        let deferredZoneCount = 0;

        zoneComponents.forEach((component) => {
            if (!component.recordCompatible) {
                deferredZoneCount += 1;
                return;
            }

            const climateBandId = buildClimateBandId(climateBands.length + 1);
            component.climateBandId = climateBandId;
            const climateBandRecord = createClimateBandRecord({
                climateBandId,
                bandType: component.bandType,
                reliefRegionIds: component.reliefRegionIds,
                seaRegionIds: component.seaRegionIds,
                primaryReliefRegionId: component.primaryReliefRegionId,
                temperatureBias: component.meanTemperatureBias,
                humidityBias: component.meanHumidityBias,
                seasonalityBias: component.meanSeasonalityBias
            });

            if (typeof macro.assertClimateBandRecord === 'function') {
                macro.assertClimateBandRecord(climateBandRecord);
            }

            climateBands.push(climateBandRecord);
        });

        const climateZoneClassification = {
            outputId: CLIMATE_ZONE_CLASSIFICATION_ID,
            stageId: CLIMATE_BAND_STAGE_ID,
            modelId: CLIMATE_ZONE_CLASSIFICATION_MODEL_ID,
            deterministic: true,
            seedNamespace: climateBandNamespace,
            seed: climateBandSeed,
            sourceFieldIds,
            sourceIntermediateOutputIds,
            worldBounds: cloneValue(worldBounds),
            width,
            height,
            size,
            classificationEncoding: CLIMATE_ZONE_CLASSIFICATION_VALUE_ENCODING,
            unclassifiedValue: -1,
            classificationIndices,
            classificationLegend,
            zoneSummaries: zoneComponents.map((component) => ({
                climateBandId: normalizeString(component.climateBandId, ''),
                classificationIndex: component.classificationIndex,
                bandType: component.bandType,
                cellCount: component.cellCount,
                anchorCellIndex: component.anchorCellIndex,
                recordCompatible: component.recordCompatible,
                reliefRegionIds: component.reliefRegionIds.slice(),
                seaRegionIds: component.seaRegionIds.slice(),
                primaryReliefRegionId: component.primaryReliefRegionId,
                temperatureBias: component.meanTemperatureBias,
                humidityBias: component.meanHumidityBias,
                stormBias: component.meanStormBias,
                seasonalityBias: component.meanSeasonalityBias,
                predictabilityBias: component.meanPredictabilityBias
            })),
            summary: {
                classificationModel: 'temperature_wetness_storm_seasonality_relief_zones',
                sourceFieldIds,
                sourceIntermediateOutputIds,
                reliefGeometryAvailable: reliefRegionBodies.length > 0,
                seaRegionGeometryAvailable: seaRegionClusters.length > 0,
                classifiedCellCount,
                legendCount: classificationLegend.length,
                zoneCount: zoneComponents.length,
                climateBandRecordCount: climateBands.length,
                deferredZoneCount,
                intenseStormZoneCellCount,
                highSeasonalityZoneCellCount,
                stableZoneCellCount,
                valueMeaning: '-1=unclassified water or missing land context; non-negative values index classificationLegend entries'
            },
            compatibility: {
                climateBandRecordOutput: true,
                futureBiomeEnvelopeInput: true,
                futurePhase2PressurePackageInput: true,
                sameWorldBoundsRequired: true,
                biomeEnvelopeOutput: false,
                phase2PressurePackageOutput: false,
                gameplayWeatherOutput: false,
                rendererAgnostic: true
            },
            intentionallyAbsent: [
                'biomeEnvelope',
                'phase2PressurePackage',
                'gameplayWeatherSystems',
                'terrainCells',
                'uiOverlays'
            ]
        };

        const regionalClimateSummaries = materializeRegionalClimateSummaries({
            normalizedInput,
            worldBounds,
            climateBandNamespace,
            climateBandSeed,
            sourceFieldIds,
            sourceIntermediateOutputIds,
            climateBands,
            zoneComponents,
            reliefRegionBodies,
            continentBodies,
            seaRegionClusters
        });

        return {
            climateZoneClassification,
            regionalClimateSummaries,
            climateBands
        };
    }

    function createEmptyClimateEnvelopeOutputs() {
        return {
            fields: {},
            intermediateOutputs: {},
            records: {
                climateBands: []
            },
            debugArtifacts: []
        };
    }

    function getClimateEnvelopeGeneratorDescriptor() {
        return {
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            status: PARTIAL_STATUS,
            stub: false,
            partial: true,
            scaffold: true,
            deterministic: true,
            file: 'js/worldgen/macro/climate-envelope-generator.js',
            entry: 'generateClimateEnvelope',
            description: 'Partial ClimateEnvelopeGenerator. It materializes deterministic latitude, prevailing wind, humidity transport, temperature/cold-load, storm corridors, coastal decay burden, seasonality, climate stress, climate-zone classification, climate bands, regional climate summaries, climate-stress regional summaries, rain-shadow effect, and adjusted wetness while keeping biome envelope ownership, Phase 2 pressure packaging, debug heatmaps, and gameplay weather systems deferred.'
        };
    }

    function getClimateEnvelopeInputContract() {
        return {
            contractId: 'climateEnvelopeInput',
            pipelineStep: PIPELINE_STEP_ID,
            moduleId: MODULE_ID,
            requiredKeys: INPUT_REQUIRED_KEYS.slice(),
            optionalKeys: INPUT_OPTIONAL_KEYS.slice(),
            fieldDependencies: cloneValue(FIELD_DEPENDENCIES),
            intermediateDependencies: cloneValue(INTERMEDIATE_DEPENDENCIES),
            recordDependencies: cloneValue(RECORD_DEPENDENCIES),
            description: 'Input contract for the partial ClimateEnvelopeGenerator. It accepts geography, hydrosphere, river-system, and marine-carving context; the current runtime consumes wind, hydrosphere, mountain/elevation, coastal context, optional relief geometry, and optional sea-region geometry for humidity transport, temperature/cold-load, storm corridors, coastal decay burden, seasonality, climate-zone classification, climate-band assembly, rain-shadow, and adjusted wetness.'
        };
    }

    function getClimateEnvelopeOutputContract() {
        return {
            contractId: 'climateEnvelopeOutput',
            pipelineStep: PIPELINE_STEP_ID,
            moduleId: MODULE_ID,
            status: PARTIAL_STATUS,
            stub: false,
            partial: true,
            plannedOutputs: cloneValue(PLANNED_OUTPUTS),
            implementedOutputs: {
                fields: [
                    LATITUDE_BAND_BASELINE_FIELD_ID,
                    PREVAILING_WIND_FIELD_ID,
                    HUMIDITY_TRANSPORT_FIELD_ID,
                    TEMPERATURE_COLD_LOAD_FIELD_ID,
                    STORM_CORRIDOR_FIELD_ID,
                    COASTAL_DECAY_BURDEN_FIELD_ID,
                    SEASONALITY_FIELD_ID,
                    WETNESS_FIELD_ID,
                    CLIMATE_STRESS_FIELD_ID
                ],
                intermediateOutputs: [
                    RAIN_SHADOW_EFFECT_ID,
                    CLIMATE_ZONE_CLASSIFICATION_ID,
                    REGIONAL_CLIMATE_SUMMARIES_ID,
                    CLIMATE_STRESS_SUMMARIES_ID
                ],
                records: [
                    'climateBands'
                ],
                debugArtifacts: [
                    CLIMATE_BIOME_FIELD_SNAPSHOTS_ID
                ]
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT_OUTPUTS.slice(),
            description: 'Partial output contract for ClimateEnvelopeGenerator. Latitude, prevailing wind, humidity transport, temperature/cold-load, storm-corridor, coastal-decay burden, seasonality, climate stress, rain-shadow effect, adjusted wetness, climate-zone classification, climate-band records, regional climate summaries, climate-stress regional summaries, and UI-free climate/biome field snapshots are implemented; biome envelope ownership, Phase 2 pressure packaging, debug panels, full debug bundles, and weather/gameplay outputs remain intentionally absent.'
        };
    }

    function getLatitudeBandBaselineFieldContract() {
        return {
            contractId: LATITUDE_BAND_BASELINE_FIELD_ID,
            pipelineStep: PIPELINE_STEP_ID,
            moduleId: MODULE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace('latitudeBands'),
            fieldType: 'ScalarField',
            modelId: LATITUDE_BAND_MODEL_ID,
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: LATITUDE_BAND_VALUE_ENCODING,
            sourceKeys: [
                'macroSeed',
                'worldBounds'
            ],
            requiredKeys: [
                'fieldId',
                'stageId',
                'modelId',
                'seedNamespace',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'stats',
                'axialTiltBias',
                'equatorOffset',
                'rowBands',
                'summary',
                'compatibility'
            ],
            intentionallyAbsent: [
                'windFieldMutation',
                'humidityTransportField',
                'wetnessField',
                'temperatureColdLoadField',
                'climateZoneClassification',
                'climateBands',
                'gameplayWeatherSystems',
                'terrainCells',
                'uiOverlays'
            ],
            description: 'Seed-stable latitude-derived scalar baseline. It encodes coarse thermal latitude bands for future temperature and wetness layers without generating winds or final climate zones.'
        };
    }

    function getPrevailingWindFieldContract() {
        return {
            contractId: PREVAILING_WIND_FIELD_ID,
            pipelineStep: PIPELINE_STEP_ID,
            moduleId: MODULE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace('prevailingWind'),
            fieldType: 'DirectionalField',
            modelId: PREVAILING_WIND_MODEL_ID,
            vectorEncoding: PREVAILING_WIND_VECTOR_ENCODING,
            magnitudeEncoding: PREVAILING_WIND_MAGNITUDE_ENCODING,
            sourceKeys: [
                'macroSeed',
                'worldBounds'
            ],
            requiredKeys: [
                'fieldId',
                'stageId',
                'modelId',
                'seedNamespace',
                'worldBounds',
                'width',
                'height',
                'size',
                'vectorEncoding',
                'magnitudeEncoding',
                'xValues',
                'yValues',
                'magnitudeValues',
                'stats',
                'summary',
                'compatibility'
            ],
            intentionallyAbsent: [
                'humidityTransportField',
                'oceanCurrentSimulation',
                'rainShadowEffect',
                'stormCorridorField',
                'gameplayWeatherSystems',
                'terrainCells',
                'uiOverlays'
            ],
            description: 'Seed-driven coarse prevailing wind DirectionalField. It encodes stable row-major unit vectors for humidity/storm/climate-band consumers without itself transporting humidity or simulating ocean currents.'
        };
    }

    function getHumidityTransportFieldContract() {
        return {
            contractId: HUMIDITY_TRANSPORT_FIELD_ID,
            pipelineStep: PIPELINE_STEP_ID,
            moduleId: MODULE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace('humidityTransport'),
            fieldType: 'ScalarField',
            modelId: HUMIDITY_TRANSPORT_MODEL_ID,
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: HUMIDITY_TRANSPORT_VALUE_ENCODING,
            sourceKeys: [
                'macroSeed',
                'worldBounds',
                LATITUDE_BAND_BASELINE_FIELD_ID,
                PREVAILING_WIND_FIELD_ID,
                'oceanConnectivityMaskField',
                'coastalShelfDepthField',
                'marineInvasionField'
            ],
            requiredKeys: [
                'fieldId',
                'stageId',
                'modelId',
                'seedNamespace',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'stats',
                'summary',
                'compatibility'
            ],
            intentionallyAbsent: [
                'rainShadowEffect',
                'temperatureColdLoadField',
                'climateZoneClassification',
                'climateBands',
                'stormCorridorField',
                'oceanCurrentSimulation',
                'gameplayWeatherSystems',
                'terrainCells',
                'uiOverlays'
            ],
            description: 'Seed-stable humidity transport ScalarField. It samples hydrosphere moisture sources upwind through prevailingWindField and prepares moisture availability for wetness, rain-shadow, and climate-band work without classifying climate.'
        };
    }

    function getTemperatureColdLoadFieldContract() {
        return {
            contractId: TEMPERATURE_COLD_LOAD_FIELD_ID,
            pipelineStep: PIPELINE_STEP_ID,
            moduleId: MODULE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace('temperatureColdLoad'),
            fieldType: 'ScalarField',
            modelId: TEMPERATURE_COLD_LOAD_MODEL_ID,
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: TEMPERATURE_COLD_LOAD_VALUE_ENCODING,
            sourceKeys: [
                'macroSeed',
                'worldBounds',
                LATITUDE_BAND_BASELINE_FIELD_ID,
                'seaLevelAppliedElevationField',
                'landmassCleanupMaskField',
                'mountainAmplificationField',
                'basinDepressionField',
                'oceanConnectivityMaskField',
                'coastalShelfDepthField'
            ],
            requiredKeys: [
                'fieldId',
                'stageId',
                'modelId',
                'seedNamespace',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'coldLoadValues',
                'elevationPenaltyValues',
                'maritimeModerationValues',
                'stats',
                'coldLoadStats',
                'summary',
                'compatibility'
            ],
            intentionallyAbsent: [
                'wetnessBands',
                'seasonalityField',
                'stormCorridorField',
                'climateZoneClassification',
                'climateBands',
                'biomeEnvelope',
                'gameplayWeatherSystems',
                'terrainCells',
                'uiOverlays'
            ],
            description: 'Seed-stable scalar temperature/cold-load baseline. values[] encode coarse warmth while coldLoadValues[] encode cold burden from latitude, elevation, land/ocean context, and optional mountain/basin modifiers before climate-band classification.'
        };
    }

    function getStormCorridorFieldContract() {
        return {
            contractId: STORM_CORRIDOR_FIELD_ID,
            pipelineStep: PIPELINE_STEP_ID,
            moduleId: MODULE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace('stormDecaySeasonality'),
            fieldType: 'ScalarField',
            modelId: STORM_CORRIDOR_MODEL_ID,
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: STORM_CORRIDOR_VALUE_ENCODING,
            sourceKeys: [
                'macroSeed',
                'worldBounds',
                PREVAILING_WIND_FIELD_ID,
                HUMIDITY_TRANSPORT_FIELD_ID,
                TEMPERATURE_COLD_LOAD_FIELD_ID,
                WETNESS_FIELD_ID,
                'oceanConnectivityMaskField',
                'coastalShelfDepthField',
                'marineInvasionField',
                'landmassCleanupMaskField'
            ],
            requiredKeys: [
                'fieldId',
                'stageId',
                'modelId',
                'seedNamespace',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'basePotentialValues',
                'continuityValues',
                'maritimeExposureValues',
                'stats',
                'summary',
                'compatibility'
            ],
            intentionallyAbsent: [
                'routeGraph',
                'catastropheSystems',
                'climateZoneClassification',
                'climateBands',
                'biomeEnvelope',
                'gameplayWeatherSystems',
                'terrainCells',
                'uiOverlays'
            ],
            description: 'Seed-stable storm-corridor ScalarField. It blends prevailing wind, humidity transport, wetness, temperature/cold-load, and maritime exposure into large storm-prone belts for later route-risk and isolation analyzers without building a route graph or catastrophe system.'
        };
    }

    function getCoastalDecayBurdenFieldContract() {
        return {
            contractId: COASTAL_DECAY_BURDEN_FIELD_ID,
            pipelineStep: PIPELINE_STEP_ID,
            moduleId: MODULE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace('stormDecaySeasonality'),
            fieldType: 'ScalarField',
            modelId: COASTAL_DECAY_BURDEN_MODEL_ID,
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: COASTAL_DECAY_BURDEN_VALUE_ENCODING,
            sourceKeys: [
                'macroSeed',
                'worldBounds',
                STORM_CORRIDOR_FIELD_ID,
                WETNESS_FIELD_ID,
                TEMPERATURE_COLD_LOAD_FIELD_ID,
                'seaLevelAppliedElevationField',
                'landmassCleanupMaskField',
                'oceanConnectivityMaskField',
                'coastalShelfDepthField',
                'marineInvasionField'
            ],
            requiredKeys: [
                'fieldId',
                'stageId',
                'modelId',
                'seedNamespace',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'shorelineExposureValues',
                'saltLoadValues',
                'wetWearValues',
                'freezeThawValues',
                'stats',
                'summary',
                'compatibility'
            ],
            intentionallyAbsent: [
                'buildingDecaySystems',
                'settlementLogic',
                'climateZoneClassification',
                'climateBands',
                'biomeEnvelope',
                'gameplayWeatherSystems',
                'terrainCells',
                'uiOverlays'
            ],
            description: 'Seed-stable coastal-decay burden ScalarField. It blends coastal storm pressure, wetness, shoreline exposure, salt load, and cold-load into a coastal pressure baseline for later history analyzers without building decay systems or settlement logic.'
        };
    }

    function getSeasonalityFieldContract() {
        return {
            contractId: SEASONALITY_FIELD_ID,
            pipelineStep: PIPELINE_STEP_ID,
            moduleId: MODULE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace('stormDecaySeasonality'),
            fieldType: 'ScalarField',
            modelId: SEASONALITY_MODEL_ID,
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: SEASONALITY_VALUE_ENCODING,
            sourceKeys: [
                'macroSeed',
                'worldBounds',
                LATITUDE_BAND_BASELINE_FIELD_ID,
                TEMPERATURE_COLD_LOAD_FIELD_ID,
                WETNESS_FIELD_ID,
                STORM_CORRIDOR_FIELD_ID,
                COASTAL_DECAY_BURDEN_FIELD_ID,
                'landmassCleanupMaskField',
                'oceanConnectivityMaskField',
                'coastalShelfDepthField',
                'seaLevelAppliedElevationField'
            ],
            requiredKeys: [
                'fieldId',
                'stageId',
                'modelId',
                'seedNamespace',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'predictabilityValues',
                'continentalityValues',
                'volatilityValues',
                'stats',
                'summary',
                'compatibility'
            ],
            intentionallyAbsent: [
                'yearlySimulation',
                'climateZoneClassification',
                'climateBands',
                'biomeEnvelope',
                'gameplayTimeSystems',
                'terrainCells',
                'uiOverlays'
            ],
            description: 'Seed-stable seasonality ScalarField. It blends latitude seasonality anchors, continentality, storm/coastal volatility, and coastal moderation into seasonal-variability plus predictability scores and embeds regional summary buckets without simulating yearly time.'
        };
    }

    function getClimateZoneClassificationContract() {
        return {
            contractId: CLIMATE_ZONE_CLASSIFICATION_ID,
            pipelineStep: PIPELINE_STEP_ID,
            moduleId: MODULE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace('climateBands'),
            outputType: 'ClimateZoneClassification',
            modelId: CLIMATE_ZONE_CLASSIFICATION_MODEL_ID,
            classificationEncoding: CLIMATE_ZONE_CLASSIFICATION_VALUE_ENCODING,
            sourceKeys: [
                'macroSeed',
                'worldBounds',
                LATITUDE_BAND_BASELINE_FIELD_ID,
                TEMPERATURE_COLD_LOAD_FIELD_ID,
                HUMIDITY_TRANSPORT_FIELD_ID,
                WETNESS_FIELD_ID,
                STORM_CORRIDOR_FIELD_ID,
                COASTAL_DECAY_BURDEN_FIELD_ID,
                SEASONALITY_FIELD_ID,
                'landmassCleanupMaskField',
                'seaLevelAppliedElevationField',
                'reliefRegionExtraction',
                'seaRegionClusters'
            ],
            requiredKeys: [
                'outputId',
                'stageId',
                'modelId',
                'seedNamespace',
                'worldBounds',
                'width',
                'height',
                'size',
                'classificationEncoding',
                'unclassifiedValue',
                'classificationIndices',
                'classificationLegend',
                'zoneSummaries',
                'summary',
                'compatibility'
            ],
            intentionallyAbsent: [
                'biomeEnvelope',
                'phase2PressurePackage',
                'gameplayWeatherSystems',
                'terrainCells',
                'uiOverlays'
            ],
            description: 'Deterministic climate-zone classification intermediate output. It classifies coarse land climate zones from temperature, wetness, storm, and seasonality context and prepares ClimateBandRecord-compatible zone summaries without building a biome envelope or a Phase 2 pressure package.'
        };
    }

    function getRegionalClimateSummariesContract() {
        return {
            contractId: REGIONAL_CLIMATE_SUMMARIES_ID,
            pipelineStep: PIPELINE_STEP_ID,
            moduleId: MODULE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace('climateBands'),
            outputType: 'RegionalClimateSummaries',
            modelId: REGIONAL_CLIMATE_SUMMARIES_MODEL_ID,
            sourceKeys: [
                'macroSeed',
                'worldBounds',
                CLIMATE_ZONE_CLASSIFICATION_ID,
                'climateBands',
                'reliefRegionExtraction',
                'continentBodies',
                'seaRegionClusters'
            ],
            requiredKeys: [
                'outputId',
                'stageId',
                'modelId',
                'seedNamespace',
                'sourceFieldIds',
                'sourceIntermediateOutputIds',
                'sourceRecordIds',
                'worldBounds',
                'regionSummaries',
                'continentSummaries',
                'seaSummaries',
                'summary',
                'compatibility'
            ],
            summaryRowKeys: [
                'summaryId',
                'summaryType',
                'sourceRegionType',
                'climateBandIds',
                'primaryClimateBandId',
                'dominantBandType',
                'climateBandCount',
                'meanTemperatureBias',
                'meanHumidityBias',
                'meanSeasonalityBias',
                'bandTypeBreakdown'
            ],
            intentionallyAbsent: [
                'fullMacroGeographyPackage',
                'phase2PressurePackage',
                'biomeEnvelope',
                'gameplayWeatherSystems',
                'terrainCells',
                'uiOverlays'
            ],
            description: 'Deterministic summary-table output for emitted ClimateBandRecord records. It rolls climate-band membership up by relief-region, continent-body, and sea-region-cluster context without mutating final continent/sea records, assembling a MacroGeographyPackage, or generating downstream pressure outputs.'
        };
    }

    function getClimateStressFieldContract() {
        return {
            contractId: CLIMATE_STRESS_FIELD_ID,
            pipelineStep: PIPELINE_STEP_ID,
            moduleId: MODULE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace('climateStress'),
            fieldType: 'ScalarField',
            modelId: CLIMATE_STRESS_MODEL_ID,
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: CLIMATE_STRESS_VALUE_ENCODING,
            sourceKeys: [
                'macroSeed',
                'worldBounds',
                TEMPERATURE_COLD_LOAD_FIELD_ID,
                WETNESS_FIELD_ID,
                STORM_CORRIDOR_FIELD_ID,
                COASTAL_DECAY_BURDEN_FIELD_ID,
                SEASONALITY_FIELD_ID,
                'landmassCleanupMaskField',
                'seaLevelAppliedElevationField',
                CLIMATE_ZONE_CLASSIFICATION_ID,
                REGIONAL_CLIMATE_SUMMARIES_ID,
                BIOME_ENVELOPE_CLASSIFICATION_ID
            ],
            requiredKeys: [
                'fieldId',
                'stageId',
                'modelId',
                'seedNamespace',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'drynessStressValues',
                'coldStressValues',
                'heatStressValues',
                'stormStressValues',
                'coastalDecayStressValues',
                'seasonalityStressValues',
                'biomeEnvelopeStressValues',
                'landCellMaskValues',
                'stats',
                'summary',
                'compatibility'
            ],
            intentionallyAbsent: [
                'fullMacroGeographyPackage',
                'phase2PressurePackage',
                'downstreamPressureGenerator',
                'debugPanel',
                'gameplayWeatherSystems',
                'terrainCells',
                'uiOverlays'
            ],
            description: 'Seed-stable physical ClimateStressField. It combines dry, cold, heat, storm, coastal-decay, seasonality, and optional biome-envelope stress channels into a row-major scalar field without generating pressure packages, debug panels, or gameplay weather.'
        };
    }

    function getClimateStressRegionalSummariesContract() {
        return {
            contractId: CLIMATE_STRESS_SUMMARIES_ID,
            pipelineStep: PIPELINE_STEP_ID,
            moduleId: MODULE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace('climateStress'),
            outputType: 'ClimateStressRegionalSummaries',
            modelId: CLIMATE_STRESS_SUMMARIES_MODEL_ID,
            sourceKeys: [
                'macroSeed',
                'worldBounds',
                CLIMATE_STRESS_FIELD_ID,
                REGIONAL_CLIMATE_SUMMARIES_ID,
                'reliefRegionExtraction',
                'continentBodies',
                'seaRegionClusters'
            ],
            requiredKeys: [
                'outputId',
                'stageId',
                'modelId',
                'seedNamespace',
                'sourceFieldIds',
                'sourceIntermediateOutputIds',
                'sourceRecordIds',
                'worldBounds',
                'climateStressFieldId',
                'sourceRegionalClimateSummariesId',
                'regionSummaries',
                'continentSummaries',
                'seaSummaries',
                'summary',
                'compatibility'
            ],
            summaryRowKeys: [
                'summaryId',
                'summaryType',
                'sourceRegionType',
                'sourceClimateSummaryId',
                'climateBandIds',
                'dominantBandType',
                'meanClimateStress',
                'peakClimateStress',
                'stressRegime',
                'meanDrynessStress',
                'meanColdStress',
                'meanHeatStress',
                'meanStormStress',
                'meanCoastalDecayStress',
                'meanSeasonalityStress',
                'meanBiomeEnvelopeStress'
            ],
            intentionallyAbsent: [
                'fullMacroGeographyPackage',
                'phase2PressurePackage',
                'downstreamPressureGenerator',
                'debugPanel',
                'gameplayWeatherSystems',
                'terrainCells',
                'uiOverlays'
            ],
            description: 'Stable internal summary output that joins ClimateStressField aggregates with regionalClimateSummaries identity rows by relief region, continent body, and sea-region cluster without mutating records or exporting the final package.'
        };
    }

    function getClimateBiomeFieldSnapshotsContract() {
        return {
            contractId: CLIMATE_BIOME_FIELD_SNAPSHOTS_ID,
            pipelineStep: PIPELINE_STEP_ID,
            moduleId: MODULE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            artifactKind: 'fieldSnapshot',
            registryId: 'fieldDebugRegistry',
            snapshotTypes: [
                'scalarHeatmap',
                'directionalVectors'
            ],
            sourceLayerIds: [
                LATITUDE_BAND_BASELINE_FIELD_ID,
                PREVAILING_WIND_FIELD_ID,
                HUMIDITY_TRANSPORT_FIELD_ID,
                TEMPERATURE_COLD_LOAD_FIELD_ID,
                WETNESS_FIELD_ID,
                STORM_CORRIDOR_FIELD_ID,
                COASTAL_DECAY_BURDEN_FIELD_ID,
                SEASONALITY_FIELD_ID,
                CLIMATE_STRESS_FIELD_ID,
                RAIN_SHADOW_EFFECT_ID,
                CLIMATE_ZONE_CLASSIFICATION_ID,
                BIOME_ENVELOPE_CLASSIFICATION_ID
            ],
            outputShape: 'fieldSnapshot[]',
            intentionallyAbsent: [
                'debugPanel',
                'fullPhysicalWorldDebugBundle',
                'fullMacroGeographyPackage',
                'uiOverlays',
                'rendererState',
                'gameplaySemantics'
            ],
            description: 'UI-free climate/biome debug export that converts climate scalar/vector layers and climate/biome classification outputs into fieldDebugRegistry-compatible fieldSnapshot artifacts without building a panel or full debug bundle.'
        };
    }

    function getWetnessFieldContract() {
        return {
            contractId: WETNESS_FIELD_ID,
            pipelineStep: PIPELINE_STEP_ID,
            moduleId: MODULE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace('rainShadow'),
            fieldType: 'ScalarField',
            modelId: WETNESS_FIELD_MODEL_ID,
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: WETNESS_FIELD_VALUE_ENCODING,
            sourceKeys: [
                'macroSeed',
                'worldBounds',
                HUMIDITY_TRANSPORT_FIELD_ID,
                RAIN_SHADOW_EFFECT_ID,
                LATITUDE_BAND_BASELINE_FIELD_ID,
                PREVAILING_WIND_FIELD_ID,
                'oceanConnectivityMaskField',
                'coastalShelfDepthField',
                'marineInvasionField',
                'mountainAmplificationField',
                'seaLevelAppliedElevationField',
                'landmassCleanupMaskField'
            ],
            requiredKeys: [
                'fieldId',
                'stageId',
                'modelId',
                'seedNamespace',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'stats',
                'summary',
                'compatibility'
            ],
            intentionallyAbsent: [
                'climateZoneClassification',
                'climateBands',
                'biomeEnvelope',
                'gameplayWeatherSystems',
                'terrainCells',
                'uiOverlays'
            ],
            description: 'Rain-shadow-adjusted wetness ScalarField derived from humidity transport, hydrosphere context, latitude baseline, and mountain/elevation orographic context. It is not final climate-zone classification.'
        };
    }

    function getRainShadowEffectContract() {
        return {
            contractId: RAIN_SHADOW_EFFECT_ID,
            pipelineStep: PIPELINE_STEP_ID,
            moduleId: MODULE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            seedNamespace: buildNamespace('rainShadow'),
            effectType: 'OrographicRainShadowEffect',
            modelId: RAIN_SHADOW_MODEL_ID,
            range: DEFAULT_FIELD_RANGE.slice(),
            valueEncoding: RAIN_SHADOW_VALUE_ENCODING,
            sourceKeys: [
                HUMIDITY_TRANSPORT_FIELD_ID,
                WETNESS_FIELD_ID,
                PREVAILING_WIND_FIELD_ID,
                'mountainAmplificationField',
                'seaLevelAppliedElevationField',
                'landmassCleanupMaskField',
                'mountainSystems'
            ],
            requiredKeys: [
                'effectId',
                'stageId',
                'modelId',
                'seedNamespace',
                'worldBounds',
                'width',
                'height',
                'size',
                'range',
                'valueEncoding',
                'values',
                'barrierValues',
                'orographicBoostValues',
                'adjustedWetnessValues',
                'stats',
                'summary',
                'compatibility'
            ],
            intentionallyAbsent: [
                'climateZoneClassification',
                'climateBands',
                'biomeEnvelope',
                'terrainCells',
                'gameplayWeatherSystems',
                'uiOverlays'
            ],
            description: 'Deterministic intermediate output that estimates leeward drying and local orographic wetness boost from mountain/elevation context and prevailing wind. It updates wetness-related outputs but does not classify climate or build biomes.'
        };
    }

    function createClimateEnvelopePipeline(input = {}) {
        const normalizedInput = normalizeInput(input);
        const dependencyAvailability = describeClimateEnvelopeDependencyAvailability(input);
        const latitudeBandBaselineField = materializeLatitudeBandBaselineField(input);
        const prevailingWindField = materializePrevailingWindField(input);
        const humidityFields = materializeHumidityTransportFields(input, {
            latitudeBandBaselineField,
            prevailingWindField
        });
        const temperatureColdLoadField = materializeTemperatureColdLoadField(input, {
            latitudeBandBaselineField
        });
        const rainShadowFields = materializeRainShadowEffect(input, {
            prevailingWindField,
            humidityTransportField: humidityFields.humidityTransportField,
            wetnessField: humidityFields.wetnessField
        });
        const stormCorridorField = materializeStormCorridorField(input, {
            latitudeBandBaselineField,
            prevailingWindField,
            humidityTransportField: humidityFields.humidityTransportField,
            temperatureColdLoadField,
            wetnessField: rainShadowFields.wetnessField
        });
        const coastalDecayBurdenField = materializeCoastalDecayBurdenField(input, {
            latitudeBandBaselineField,
            prevailingWindField,
            humidityTransportField: humidityFields.humidityTransportField,
            temperatureColdLoadField,
            stormCorridorField,
            wetnessField: rainShadowFields.wetnessField
        });
        const seasonalityField = materializeSeasonalityField(input, {
            latitudeBandBaselineField,
            prevailingWindField,
            humidityTransportField: humidityFields.humidityTransportField,
            temperatureColdLoadField,
            stormCorridorField,
            coastalDecayBurdenField,
            wetnessField: rainShadowFields.wetnessField
        });
        const climateBandOutputs = materializeClimateZoneClassification(input, {
            latitudeBandBaselineField,
            prevailingWindField,
            humidityTransportField: humidityFields.humidityTransportField,
            temperatureColdLoadField,
            stormCorridorField,
            coastalDecayBurdenField,
            seasonalityField,
            wetnessField: rainShadowFields.wetnessField
        });
        const climateStressField = materializeClimateStressField(input, {
            latitudeBandBaselineField,
            prevailingWindField,
            humidityTransportField: humidityFields.humidityTransportField,
            temperatureColdLoadField,
            stormCorridorField,
            coastalDecayBurdenField,
            seasonalityField,
            wetnessField: rainShadowFields.wetnessField
        }, {
            [CLIMATE_ZONE_CLASSIFICATION_ID]: climateBandOutputs.climateZoneClassification,
            [REGIONAL_CLIMATE_SUMMARIES_ID]: climateBandOutputs.regionalClimateSummaries,
            climateBands: climateBandOutputs.climateBands
        });
        const climateStressRegionalSummaries = materializeClimateStressRegionalSummaries(input, {
            climateStressField,
            regionalClimateSummaries: climateBandOutputs.regionalClimateSummaries
        });
        const climateFields = {
            [LATITUDE_BAND_BASELINE_FIELD_ID]: latitudeBandBaselineField,
            [PREVAILING_WIND_FIELD_ID]: prevailingWindField,
            [HUMIDITY_TRANSPORT_FIELD_ID]: humidityFields.humidityTransportField,
            [TEMPERATURE_COLD_LOAD_FIELD_ID]: temperatureColdLoadField,
            [STORM_CORRIDOR_FIELD_ID]: stormCorridorField,
            [COASTAL_DECAY_BURDEN_FIELD_ID]: coastalDecayBurdenField,
            [SEASONALITY_FIELD_ID]: seasonalityField,
            [WETNESS_FIELD_ID]: rainShadowFields.wetnessField,
            [CLIMATE_STRESS_FIELD_ID]: climateStressField
        };
        const climateIntermediateOutputs = {
            [RAIN_SHADOW_EFFECT_ID]: rainShadowFields.rainShadowEffect,
            [CLIMATE_ZONE_CLASSIFICATION_ID]: climateBandOutputs.climateZoneClassification,
            [REGIONAL_CLIMATE_SUMMARIES_ID]: climateBandOutputs.regionalClimateSummaries,
            [CLIMATE_STRESS_SUMMARIES_ID]: climateStressRegionalSummaries
        };
        const climateRecords = {
            climateBands: climateBandOutputs.climateBands
        };
        const climateBiomeFieldSnapshots = buildClimateBiomeFieldSnapshotsFromResolvedOutputs(input, {
            fields: climateFields,
            intermediateOutputs: climateIntermediateOutputs,
            records: climateRecords
        });

        return {
            generatorId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            status: PARTIAL_STATUS,
            stub: false,
            partial: true,
            scaffold: true,
            deterministic: true,
            macroSeed: normalizedInput.macroSeed,
            worldBounds: cloneValue(normalizedInput.worldBounds),
            inputContract: getClimateEnvelopeInputContract(),
            outputContract: getClimateEnvelopeOutputContract(),
            latitudeBandBaselineFieldContract: getLatitudeBandBaselineFieldContract(),
            prevailingWindFieldContract: getPrevailingWindFieldContract(),
            humidityTransportFieldContract: getHumidityTransportFieldContract(),
            temperatureColdLoadFieldContract: getTemperatureColdLoadFieldContract(),
            stormCorridorFieldContract: getStormCorridorFieldContract(),
            coastalDecayBurdenFieldContract: getCoastalDecayBurdenFieldContract(),
            seasonalityFieldContract: getSeasonalityFieldContract(),
            climateZoneClassificationContract: getClimateZoneClassificationContract(),
            regionalClimateSummariesContract: getRegionalClimateSummariesContract(),
            climateStressFieldContract: getClimateStressFieldContract(),
            climateStressRegionalSummariesContract: getClimateStressRegionalSummariesContract(),
            climateBiomeFieldSnapshotsContract: getClimateBiomeFieldSnapshotsContract(),
            wetnessFieldContract: getWetnessFieldContract(),
            rainShadowEffectContract: getRainShadowEffectContract(),
            seedHooks: getClimateEnvelopeSeedHooks(normalizedInput.macroSeed),
            dependencyAvailability,
            plannedStages: cloneValue(PLANNED_STAGES),
            plannedOutputs: cloneValue(PLANNED_OUTPUTS),
            outputs: {
                ...createEmptyClimateEnvelopeOutputs(),
                fields: climateFields,
                intermediateOutputs: climateIntermediateOutputs,
                records: climateRecords,
                debugArtifacts: climateBiomeFieldSnapshots
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT_OUTPUTS.slice(),
            notes: [
                'Partial climate envelope pipeline: deterministic latitudeBandBaselineField, prevailingWindField, humidityTransportField, temperatureColdLoadField, stormCorridorField, coastalDecayBurdenField, seasonalityField, climateStressField, climateZoneClassification, regionalClimateSummaries, climateStressRegionalSummaries, climateBands, rainShadowEffect, and adjusted wetnessField are materialized from macroSeed, worldBounds, wind, hydrosphere, relief, sea-region, and orographic context.',
                'Humidity transport uses upwind hydrosphere-source sampling and falls back to dry source values when required hydrosphere fields are absent; dependencyAvailability still reports missing required inputs.',
                'temperatureColdLoadField blends latitude baseline, elevation penalty, and coarse maritime moderation into warmth and cold-load arrays for later climate-band classification, but it does not classify temperature bands or seasonality.',
                'stormCorridorField blends prevailing wind, humidity transport, adjusted wetness, temperature/cold-load, and maritime exposure into large storm-prone corridors for later route-risk and isolation analyzers, but it does not build a route graph or catastrophe system.',
                'coastalDecayBurdenField blends shoreline exposure, storm pressure, wetness, salt load, and coastal cold-load into coastal pressure burden for later history analyzers, but it does not implement building decay systems or settlement logic.',
                'seasonalityField blends latitude seasonality anchors, continentality, storm/coastal volatility, and maritime moderation into seasonal variability plus predictability scores and embeds regional summary buckets, but it does not simulate yearly cycles or gameplay time systems.',
                'climateZoneClassification classifies coarse land climate zones from temperature, wetness, storm, and seasonality context and emits ClimateBandRecord-compatible `climateBands[]` when relief geometry is available, while regionalClimateSummaries rolls those records up by relief region, continent body, and sea-region cluster.',
                'climateStressField combines dry, cold, heat, storm, coastal-decay, seasonality, and optional biome-envelope stress channels; climateStressRegionalSummaries keeps those values in an internal regional format linked to regionalClimateSummaries.',
                'climateBiomeFieldSnapshots uses fieldDebugRegistry-compatible fieldSnapshot artifacts for climate scalar/vector fields plus climate-zone and biome-envelope classification heatmaps, but it is not a UI panel or full debug bundle.',
                'Rain shadow uses mountain/elevation context for wetness adjustment only; no biome envelope, pressure package, weather runtime, UI, terrain cells, or gameplay semantics are generated by this climate step.'
            ]
        };
    }

    function generateClimateEnvelope(input = {}) {
        return createClimateEnvelopePipeline(input);
    }

    function generateLatitudeBandBaselineField(input = {}) {
        return materializeLatitudeBandBaselineField(input);
    }

    function generatePrevailingWindField(input = {}) {
        return materializePrevailingWindField(input);
    }

    function generateHumidityTransportField(input = {}) {
        return materializeHumidityTransportFields(input).humidityTransportField;
    }

    function generateTemperatureColdLoadField(input = {}) {
        return materializeTemperatureColdLoadField(input);
    }

    function generateStormCorridorField(input = {}) {
        const latitudeBandBaselineField = materializeLatitudeBandBaselineField(input);
        const prevailingWindField = materializePrevailingWindField(input);
        const humidityFields = materializeHumidityTransportFields(input, {
            latitudeBandBaselineField,
            prevailingWindField
        });
        const temperatureColdLoadField = materializeTemperatureColdLoadField(input, {
            latitudeBandBaselineField
        });
        const rainShadowFields = materializeRainShadowEffect(input, {
            prevailingWindField,
            humidityTransportField: humidityFields.humidityTransportField,
            wetnessField: humidityFields.wetnessField
        });

        return materializeStormCorridorField(input, {
            latitudeBandBaselineField,
            prevailingWindField,
            humidityTransportField: humidityFields.humidityTransportField,
            temperatureColdLoadField,
            wetnessField: rainShadowFields.wetnessField
        });
    }

    function generateCoastalDecayBurdenField(input = {}) {
        const latitudeBandBaselineField = materializeLatitudeBandBaselineField(input);
        const prevailingWindField = materializePrevailingWindField(input);
        const humidityFields = materializeHumidityTransportFields(input, {
            latitudeBandBaselineField,
            prevailingWindField
        });
        const temperatureColdLoadField = materializeTemperatureColdLoadField(input, {
            latitudeBandBaselineField
        });
        const rainShadowFields = materializeRainShadowEffect(input, {
            prevailingWindField,
            humidityTransportField: humidityFields.humidityTransportField,
            wetnessField: humidityFields.wetnessField
        });
        const stormCorridorField = materializeStormCorridorField(input, {
            latitudeBandBaselineField,
            prevailingWindField,
            humidityTransportField: humidityFields.humidityTransportField,
            temperatureColdLoadField,
            wetnessField: rainShadowFields.wetnessField
        });

        return materializeCoastalDecayBurdenField(input, {
            latitudeBandBaselineField,
            prevailingWindField,
            humidityTransportField: humidityFields.humidityTransportField,
            temperatureColdLoadField,
            stormCorridorField,
            wetnessField: rainShadowFields.wetnessField
        });
    }

    function generateSeasonalityField(input = {}) {
        return createClimateEnvelopePipeline(input).outputs.fields[SEASONALITY_FIELD_ID];
    }

    function generateClimateZoneClassification(input = {}) {
        return createClimateEnvelopePipeline(input).outputs.intermediateOutputs[CLIMATE_ZONE_CLASSIFICATION_ID];
    }

    function generateClimateBandRecords(input = {}) {
        return createClimateEnvelopePipeline(input).outputs.records.climateBands;
    }

    function generateRegionalClimateSummaries(input = {}) {
        return createClimateEnvelopePipeline(input).outputs.intermediateOutputs[REGIONAL_CLIMATE_SUMMARIES_ID];
    }

    function generateClimateStressField(input = {}) {
        return createClimateEnvelopePipeline(input).outputs.fields[CLIMATE_STRESS_FIELD_ID];
    }

    function generateClimateStressRegionalSummaries(input = {}) {
        return createClimateEnvelopePipeline(input).outputs.intermediateOutputs[CLIMATE_STRESS_SUMMARIES_ID];
    }

    function buildClimateBiomeFieldSnapshots(input = {}) {
        return createClimateEnvelopePipeline(input).outputs.debugArtifacts;
    }

    function generateWetnessField(input = {}) {
        const windField = materializePrevailingWindField(input);
        const humidityFields = materializeHumidityTransportFields(input, {
            prevailingWindField: windField
        });
        return materializeRainShadowEffect(input, {
            prevailingWindField: windField,
            humidityTransportField: humidityFields.humidityTransportField,
            wetnessField: humidityFields.wetnessField
        }).wetnessField;
    }

    function generateRainShadowEffect(input = {}) {
        const windField = materializePrevailingWindField(input);
        const humidityFields = materializeHumidityTransportFields(input, {
            prevailingWindField: windField
        });
        return materializeRainShadowEffect(input, {
            prevailingWindField: windField,
            humidityTransportField: humidityFields.humidityTransportField,
            wetnessField: humidityFields.wetnessField
        }).rainShadowEffect;
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule(MODULE_ID, {
            entry: 'generateClimateEnvelope',
            file: 'js/worldgen/macro/climate-envelope-generator.js',
            description: 'Partial ClimateEnvelopeGenerator with deterministic latitude baseline, prevailing wind, humidity transport, temperature/cold-load, storm corridors, coastal decay burden, seasonality, climate stress, climate-zone classification, climate bands, regional climate summaries, climate-stress regional summaries, climate/biome field snapshots, rain-shadow effect, and adjusted wetness fields plus deferred biome/pressure/gameplay outputs.',
            stub: false,
            partial: true,
            scaffold: true
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep(PIPELINE_STEP_ID, {
            moduleId: MODULE_ID,
            file: 'js/worldgen/macro/climate-envelope-generator.js',
            entry: 'generateClimateEnvelope',
            description: 'Partial ClimateEnvelopeGenerator: emits latitudeBandBaselineField, prevailingWindField, humidityTransportField, temperatureColdLoadField, stormCorridorField, coastalDecayBurdenField, seasonalityField, climateStressField, climateZoneClassification, climateBands, regionalClimateSummaries, climateStressRegionalSummaries, climate/biome field snapshots, rainShadowEffect, and adjusted wetnessField while keeping biome envelope ownership, Phase 2 pressure packaging, and gameplay weather deferred.',
            stub: false,
            partial: true,
            scaffold: true
        });
    }

    Object.assign(macro, {
        getClimateEnvelopeGeneratorDescriptor,
        getClimateEnvelopeInputContract,
        getClimateEnvelopeOutputContract,
        getLatitudeBandBaselineFieldContract,
        getPrevailingWindFieldContract,
        getHumidityTransportFieldContract,
        getTemperatureColdLoadFieldContract,
        getStormCorridorFieldContract,
        getCoastalDecayBurdenFieldContract,
        getSeasonalityFieldContract,
        getClimateZoneClassificationContract,
        getRegionalClimateSummariesContract,
        getClimateStressFieldContract,
        getClimateStressRegionalSummariesContract,
        getClimateBiomeFieldSnapshotsContract,
        getWetnessFieldContract,
        getRainShadowEffectContract,
        getClimateEnvelopeSeedHooks,
        describeClimateEnvelopeDependencyAvailability,
        generateLatitudeBandBaselineField,
        generatePrevailingWindField,
        generateHumidityTransportField,
        generateTemperatureColdLoadField,
        generateStormCorridorField,
        generateCoastalDecayBurdenField,
        generateSeasonalityField,
        generateClimateZoneClassification,
        generateClimateBandRecords,
        generateRegionalClimateSummaries,
        generateClimateStressField,
        generateClimateStressRegionalSummaries,
        buildClimateBiomeFieldSnapshots,
        generateWetnessField,
        generateRainShadowEffect,
        createClimateEnvelopePipeline,
        generateClimateEnvelope
    });
})();
