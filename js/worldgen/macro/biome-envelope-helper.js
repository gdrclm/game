(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const MODULE_ID = 'biomeEnvelopeHelper';
    const HELPER_ID = 'biomeEnvelopeInputBundle';
    const CLASSIFICATION_OUTPUT_ID = 'biomeEnvelopeClassification';
    const CLASSIFICATION_MODEL_ID = 'deterministicPhysicalBiomeEnvelopeV1';
    const CLASSIFICATION_ENCODING = 'rowMajorIntegerArray';
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';
    const DEFAULT_WORLD_BOUNDS = Object.freeze({
        width: 256,
        height: 128
    });
    const REQUIRED_FIELD_IDS = Object.freeze([
        'temperatureColdLoadField',
        'wetnessField',
        'seasonalityField',
        'seaLevelAppliedElevationField',
        'landmassCleanupMaskField'
    ]);
    const OPTIONAL_FIELD_IDS = Object.freeze([
        'stormCorridorField',
        'coastalDecayBurdenField',
        'mountainAmplificationField',
        'basinDepressionField'
    ]);
    const REQUIRED_INTERMEDIATE_IDS = Object.freeze([
        'climateZoneClassification'
    ]);
    const OPTIONAL_INTERMEDIATE_IDS = Object.freeze([
        'regionalClimateSummaries',
        'reliefRegionExtraction'
    ]);
    const OPTIONAL_RECORD_IDS = Object.freeze([
        'climateBands',
        'reliefRegions'
    ]);
    const CHANNEL_PLAN = Object.freeze([
        {
            channelId: 'temperatureBias',
            sourceFieldId: 'temperatureColdLoadField',
            valueKey: 'values',
            range: [0, 1]
        },
        {
            channelId: 'wetnessBias',
            sourceFieldId: 'wetnessField',
            valueKey: 'values',
            range: [0, 1]
        },
        {
            channelId: 'seasonalityBias',
            sourceFieldId: 'seasonalityField',
            valueKey: 'values',
            range: [0, 1]
        },
        {
            channelId: 'elevationBias',
            sourceFieldId: 'seaLevelAppliedElevationField',
            valueKey: 'values',
            range: [0, 1]
        },
        {
            channelId: 'landMask',
            sourceFieldId: 'landmassCleanupMaskField',
            valueKey: 'values',
            range: [0, 1]
        }
    ]);
    const ENVELOPE_LEGEND_TEMPLATE = Object.freeze([
        {
            envelopeType: 'polar_barren_envelope',
            temperatureRange: 'polar',
            moistureRange: 'any',
            elevationRange: 'low_to_high',
            physicalMeaning: 'very cold macro envelope with limited coarse productivity signal'
        },
        {
            envelopeType: 'alpine_barren_envelope',
            temperatureRange: 'cold_to_cool',
            moistureRange: 'any',
            elevationRange: 'high',
            physicalMeaning: 'high-elevation macro envelope controlled primarily by relief exposure'
        },
        {
            envelopeType: 'cold_steppe_envelope',
            temperatureRange: 'cold',
            moistureRange: 'dry_to_subhumid',
            elevationRange: 'low_to_mid',
            physicalMeaning: 'cold dry macro envelope for later natural-class interpretation'
        },
        {
            envelopeType: 'cold_wet_forest_envelope',
            temperatureRange: 'cold_to_cool',
            moistureRange: 'humid_to_wet',
            elevationRange: 'low_to_mid',
            physicalMeaning: 'cold wet macro envelope for later natural-class interpretation'
        },
        {
            envelopeType: 'temperate_steppe_envelope',
            temperatureRange: 'temperate',
            moistureRange: 'dry_to_subhumid',
            elevationRange: 'low_to_mid',
            physicalMeaning: 'temperate dry macro envelope without local grass placement semantics'
        },
        {
            envelopeType: 'temperate_mixed_forest_envelope',
            temperatureRange: 'temperate',
            moistureRange: 'subhumid_to_humid',
            elevationRange: 'low_to_mid',
            physicalMeaning: 'temperate balanced macro envelope without gameplay biome semantics'
        },
        {
            envelopeType: 'temperate_wet_forest_envelope',
            temperatureRange: 'temperate',
            moistureRange: 'wet',
            elevationRange: 'low_to_mid',
            physicalMeaning: 'temperate wet macro envelope for later coarse natural-class work'
        },
        {
            envelopeType: 'hot_desert_envelope',
            temperatureRange: 'warm_to_hot',
            moistureRange: 'arid',
            elevationRange: 'low_to_mid',
            physicalMeaning: 'hot arid macro envelope without resource or prop implications'
        },
        {
            envelopeType: 'warm_dry_scrub_envelope',
            temperatureRange: 'warm_to_hot',
            moistureRange: 'dry_to_subhumid',
            elevationRange: 'low_to_mid',
            physicalMeaning: 'warm dry macro envelope without local vegetation placement'
        },
        {
            envelopeType: 'seasonal_woodland_envelope',
            temperatureRange: 'warm_to_hot',
            moistureRange: 'subhumid_to_humid',
            elevationRange: 'low_to_mid',
            physicalMeaning: 'seasonal macro envelope driven by warmth, wetness, and seasonality'
        },
        {
            envelopeType: 'tropical_wet_forest_envelope',
            temperatureRange: 'hot',
            moistureRange: 'wet',
            elevationRange: 'low_to_mid',
            physicalMeaning: 'warm wet macro envelope without local jungle/resource truth'
        },
        {
            envelopeType: 'wetland_prone_envelope',
            temperatureRange: 'temperate_to_hot',
            moistureRange: 'very_wet',
            elevationRange: 'low',
            physicalMeaning: 'low wet macro envelope only; not marsh placement or lake hydrology'
        }
    ]);

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

    function normalizeString(value, fallback = '') {
        return typeof value === 'string' && value.trim()
            ? value.trim()
            : fallback;
    }

    function normalizeInteger(value, fallback) {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? Math.max(1, Math.floor(numericValue)) : fallback;
    }

    function normalizeSeed(seed) {
        return typeof macro.normalizeSeed === 'function'
            ? macro.normalizeSeed(seed)
            : (Number(seed) >>> 0) || 0;
    }

    function clampUnitInterval(value, fallback = 0) {
        if (typeof macro.clampFieldValue === 'function') {
            return macro.clampFieldValue(value, [0, 1], fallback);
        }

        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return fallback;
        }

        return Math.max(0, Math.min(1, numericValue));
    }

    function roundMetric(value, precision = 6) {
        return Number.isFinite(value)
            ? Number(value.toFixed(precision))
            : 0;
    }

    function normalizeWorldBounds(bounds = DEFAULT_WORLD_BOUNDS) {
        const source = bounds && typeof bounds === 'object' ? bounds : {};
        return {
            width: normalizeInteger(source.width, DEFAULT_WORLD_BOUNDS.width),
            height: normalizeInteger(source.height, DEFAULT_WORLD_BOUNDS.height)
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

    function resolveFromGroups(groups, dependencyId) {
        return groups
            .map((group) => findDependencyValue(group, dependencyId))
            .find(Boolean) || null;
    }

    function resolveField(input = {}, fieldId = '') {
        return resolveFromGroups([
            input.fields,
            getNestedValue(input, 'outputs.fields'),
            getNestedValue(input, 'climateEnvelope.fields'),
            getNestedValue(input, 'climateEnvelope.outputs.fields'),
            getNestedValue(input, 'reliefElevation.fields'),
            getNestedValue(input, 'reliefElevation.outputs.fields')
        ], fieldId);
    }

    function resolveIntermediateOutput(input = {}, outputId = '') {
        return resolveFromGroups([
            input.intermediateOutputs,
            getNestedValue(input, 'outputs.intermediateOutputs'),
            getNestedValue(input, 'climateEnvelope.intermediateOutputs'),
            getNestedValue(input, 'climateEnvelope.outputs.intermediateOutputs'),
            getNestedValue(input, 'reliefElevation.intermediateOutputs'),
            getNestedValue(input, 'reliefElevation.outputs.intermediateOutputs')
        ], outputId);
    }

    function resolveRecordCollection(input = {}, recordId = '') {
        const foundValue = resolveFromGroups([
            input,
            input.records,
            getNestedValue(input, 'outputs.records'),
            getNestedValue(input, 'climateEnvelope.records'),
            getNestedValue(input, 'climateEnvelope.outputs.records'),
            getNestedValue(input, 'reliefElevation.records'),
            getNestedValue(input, 'reliefElevation.outputs.records')
        ], recordId);

        if (Array.isArray(foundValue)) {
            return foundValue;
        }

        if (foundValue && typeof foundValue === 'object' && Array.isArray(foundValue.records)) {
            return foundValue.records;
        }

        return [];
    }

    function buildAvailability(requiredIds, optionalIds, resolver) {
        const required = requiredIds.map((dependencyId) => ({
            dependencyId,
            required: true,
            available: Boolean(resolver(dependencyId))
        }));
        const optional = optionalIds.map((dependencyId) => ({
            dependencyId,
            required: false,
            available: Boolean(resolver(dependencyId))
        }));
        const missingRequiredIds = required
            .filter((entry) => !entry.available)
            .map((entry) => entry.dependencyId);

        return {
            required,
            optional,
            missingRequiredIds
        };
    }

    function summarizeField(field, fallbackFieldId) {
        if (!field || typeof field !== 'object') {
            return null;
        }

        const worldBounds = normalizeWorldBounds(field.worldBounds);
        return {
            fieldId: normalizeString(field.fieldId, fallbackFieldId),
            stageId: normalizeString(field.stageId, ''),
            modelId: normalizeString(field.modelId, ''),
            width: normalizeInteger(field.width, worldBounds.width),
            height: normalizeInteger(field.height, worldBounds.height),
            size: normalizeInteger(field.size, worldBounds.width * worldBounds.height),
            range: Array.isArray(field.range) ? field.range.slice(0, 2) : [0, 1],
            valueEncoding: normalizeString(field.valueEncoding, ''),
            stats: field.stats && typeof field.stats === 'object' ? cloneValue(field.stats) : {}
        };
    }

    function resolveBundleWorldBounds(input, fields) {
        const explicitBounds = input && typeof input === 'object' ? input.worldBounds : null;
        if (explicitBounds && typeof explicitBounds === 'object') {
            return normalizeWorldBounds(explicitBounds);
        }

        const fieldWithBounds = Object.values(fields).find((field) => field && field.worldBounds);
        return normalizeWorldBounds(fieldWithBounds && fieldWithBounds.worldBounds);
    }

    function remapCoordinate(value, sourceSize, targetSize) {
        if (sourceSize <= 1 || targetSize <= 1) {
            return 0;
        }

        return Math.max(0, Math.min(
            sourceSize - 1,
            Math.round((value / (targetSize - 1)) * (sourceSize - 1))
        ));
    }

    function readFieldValue(field, x, y, targetWorldBounds, fallback = 0) {
        const fallbackValue = clampUnitInterval(fallback, 0);
        if (!field || typeof field !== 'object' || !Array.isArray(field.values)) {
            return fallbackValue;
        }

        const worldBounds = normalizeWorldBounds(targetWorldBounds);
        const fieldWidth = normalizeInteger(field.width, worldBounds.width);
        const fieldHeight = normalizeInteger(field.height, worldBounds.height);
        const sourceX = remapCoordinate(x, fieldWidth, worldBounds.width);
        const sourceY = remapCoordinate(y, fieldHeight, worldBounds.height);
        const sourceIndex = sourceY * fieldWidth + sourceX;
        return clampUnitInterval(field.values[sourceIndex], fallbackValue);
    }

    function buildReliefRegionMembership(reliefRegionExtraction = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedWorldBounds = normalizeWorldBounds(worldBounds);
        const size = normalizedWorldBounds.width * normalizedWorldBounds.height;
        const membership = new Map();
        const reliefRegionBodies = Array.isArray(reliefRegionExtraction && reliefRegionExtraction.reliefRegionBodies)
            ? reliefRegionExtraction.reliefRegionBodies
            : [];

        reliefRegionBodies.forEach((body) => {
            const reliefRegionId = normalizeString(
                body && body.reliefRegionId,
                normalizeString(body && body.record && body.record.reliefRegionId, '')
            );
            const cellIndices = Array.isArray(body && body.cellIndices) ? body.cellIndices : [];
            if (!reliefRegionId || !cellIndices.length) {
                return;
            }

            cellIndices.forEach((cellIndex) => {
                const normalizedIndex = Math.floor(Number(cellIndex));
                if (Number.isFinite(normalizedIndex) && normalizedIndex >= 0 && normalizedIndex < size) {
                    membership.set(normalizedIndex, reliefRegionId);
                }
            });
        });

        return membership;
    }

    function createEnvelopeLegendEntry(template, classIndex) {
        return {
            classIndex,
            envelopeType: template.envelopeType,
            temperatureRange: template.temperatureRange,
            moistureRange: template.moistureRange,
            elevationRange: template.elevationRange,
            physicalMeaning: template.physicalMeaning,
            cellCount: 0,
            landCellRatio: 0,
            meanTemperatureBias: 0,
            meanWetnessBias: 0,
            meanSeasonalityBias: 0,
            meanElevationBias: 0,
            _temperatureTotal: 0,
            _wetnessTotal: 0,
            _seasonalityTotal: 0,
            _elevationTotal: 0
        };
    }

    function classifyBiomeEnvelope({ temperature, wetness, seasonality, elevation }) {
        if (elevation >= 0.82 || (elevation >= 0.72 && temperature <= 0.46)) {
            return 'alpine_barren_envelope';
        }

        if (temperature <= 0.14) {
            return 'polar_barren_envelope';
        }

        if (wetness <= 0.16) {
            return temperature >= 0.62
                ? 'hot_desert_envelope'
                : 'temperate_steppe_envelope';
        }

        if (temperature <= 0.34) {
            return wetness >= 0.58
                ? 'cold_wet_forest_envelope'
                : 'cold_steppe_envelope';
        }

        if (elevation <= 0.24 && wetness >= 0.86) {
            return 'wetland_prone_envelope';
        }

        if (temperature >= 0.72 && wetness >= 0.72) {
            return 'tropical_wet_forest_envelope';
        }

        if (temperature >= 0.64 && wetness <= 0.38) {
            return 'warm_dry_scrub_envelope';
        }

        if (seasonality >= 0.62 || (temperature >= 0.62 && wetness < 0.72)) {
            return 'seasonal_woodland_envelope';
        }

        if (wetness >= 0.72) {
            return 'temperate_wet_forest_envelope';
        }

        if (wetness <= 0.38) {
            return 'temperate_steppe_envelope';
        }

        return 'temperate_mixed_forest_envelope';
    }

    function createReliefRegionAccumulator(reliefRegionId) {
        return {
            reliefRegionId,
            cellCount: 0,
            envelopeCounts: new Map()
        };
    }

    function prepareBiomeEnvelopeInputs(input = {}) {
        const source = input && typeof input === 'object' ? input : {};
        const macroSeed = normalizeSeed(source.macroSeed ?? source.seed);
        const fields = [...REQUIRED_FIELD_IDS, ...OPTIONAL_FIELD_IDS].reduce((collection, fieldId) => {
            const field = resolveField(source, fieldId);
            if (field) {
                collection[fieldId] = cloneValue(field);
            }
            return collection;
        }, {});
        const intermediateOutputs = [...REQUIRED_INTERMEDIATE_IDS, ...OPTIONAL_INTERMEDIATE_IDS].reduce((collection, outputId) => {
            const output = resolveIntermediateOutput(source, outputId);
            if (output) {
                collection[outputId] = cloneValue(output);
            }
            return collection;
        }, {});
        const records = OPTIONAL_RECORD_IDS.reduce((collection, recordId) => {
            const recordCollection = resolveRecordCollection(source, recordId);
            if (recordCollection.length) {
                collection[recordId] = cloneValue(recordCollection);
            }
            return collection;
        }, {});
        const worldBounds = resolveBundleWorldBounds(source, fields);
        const fieldAvailability = buildAvailability(
            REQUIRED_FIELD_IDS,
            OPTIONAL_FIELD_IDS,
            (fieldId) => fields[fieldId]
        );
        const intermediateAvailability = buildAvailability(
            REQUIRED_INTERMEDIATE_IDS,
            OPTIONAL_INTERMEDIATE_IDS,
            (outputId) => intermediateOutputs[outputId]
        );
        const recordAvailability = buildAvailability(
            [],
            OPTIONAL_RECORD_IDS,
            (recordId) => records[recordId] && records[recordId].length
        );
        const missingRequiredIds = [
            ...fieldAvailability.missingRequiredIds,
            ...intermediateAvailability.missingRequiredIds
        ];

        return {
            helperId: HELPER_ID,
            moduleId: MODULE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            macroSeed,
            worldBounds,
            readyForBiomeEnvelopeClassification: missingRequiredIds.length === 0,
            missingRequiredIds,
            sourceFieldIds: Object.keys(fields).sort((left, right) => left.localeCompare(right)),
            sourceIntermediateOutputIds: Object.keys(intermediateOutputs).sort((left, right) => left.localeCompare(right)),
            sourceRecordIds: Object.keys(records).sort((left, right) => left.localeCompare(right)),
            channelPlan: CHANNEL_PLAN.map(cloneValue),
            fieldSummaries: Object.fromEntries(
                Object.entries(fields).map(([fieldId, field]) => [fieldId, summarizeField(field, fieldId)])
            ),
            fields,
            intermediateOutputs,
            records,
            availability: {
                fields: fieldAvailability,
                intermediateOutputs: intermediateAvailability,
                records: recordAvailability
            },
            compatibility: {
                futureBiomeEnvelopeClassificationInput: true,
                physicalWorldLayerOnly: true,
                sameWorldBoundsRequired: true,
                gameplayBiomeOutput: false,
                resourcePropOutput: false,
                terrainCellOutput: false,
                uiOutput: false
            },
            intentionallyAbsent: [
                'biomeEnvelopeClassification',
                'gameplayBiomes',
                'resourceProps',
                'localTerrainDecoration',
                'terrainCells',
                'uiOverlays'
            ]
        };
    }

    function generateBiomeEnvelopeClassification(input = {}) {
        const inputBundle = prepareBiomeEnvelopeInputs(input);
        const worldBounds = normalizeWorldBounds(inputBundle.worldBounds);
        const width = worldBounds.width;
        const height = worldBounds.height;
        const size = width * height;
        const classificationIndices = new Array(size).fill(-1);
        const classificationLegend = ENVELOPE_LEGEND_TEMPLATE.map(createEnvelopeLegendEntry);
        const classIndexByEnvelopeType = new Map(
            classificationLegend.map((entry) => [entry.envelopeType, entry.classIndex])
        );
        const reliefRegionMembership = buildReliefRegionMembership(
            inputBundle.intermediateOutputs.reliefRegionExtraction,
            worldBounds
        );
        const reliefRegionAccumulators = new Map();
        let classifiedLandCellCount = 0;
        let skippedWaterOrMissingCellCount = 0;

        if (!inputBundle.readyForBiomeEnvelopeClassification) {
            return {
                outputId: CLASSIFICATION_OUTPUT_ID,
                helperId: HELPER_ID,
                moduleId: MODULE_ID,
                phaseId: macro.phaseId || 'phase1',
                phaseVersion: PHASE_VERSION,
                deterministic: true,
                macroSeed: inputBundle.macroSeed,
                worldBounds,
                width,
                height,
                size,
                modelId: CLASSIFICATION_MODEL_ID,
                classificationEncoding: CLASSIFICATION_ENCODING,
                unclassifiedValue: -1,
                classificationIndices,
                classificationLegend: classificationLegend.map((entry) => {
                    const clone = cloneValue(entry);
                    delete clone._temperatureTotal;
                    delete clone._wetnessTotal;
                    delete clone._seasonalityTotal;
                    delete clone._elevationTotal;
                    return clone;
                }),
                envelopeSummaries: [],
                reliefRegionSummaries: [],
                inputBundle,
                summary: {
                    ready: false,
                    missingRequiredIds: inputBundle.missingRequiredIds.slice(),
                    classifiedLandCellCount: 0,
                    skippedWaterOrMissingCellCount: size,
                    outputPolicy: 'No biome-envelope classes are assigned until all required physical climate/elevation inputs are available.'
                },
                compatibility: {
                    physicalWorldLayerOnly: true,
                    futureBiomeEnvelopeSummaryInput: true,
                    gameplayBiomeOutput: false,
                    localBiomePlacementOutput: false,
                    resourcePropOutput: false,
                    terrainCellOutput: false,
                    uiOutput: false
                },
                intentionallyAbsent: [
                    'localBiomePlacement',
                    'gameplayBiomes',
                    'resourceProps',
                    'ecologySimulation',
                    'terrainCells',
                    'uiOverlays'
                ]
            };
        }

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const cellIndex = y * width + x;
                const landMask = readFieldValue(inputBundle.fields.landmassCleanupMaskField, x, y, worldBounds, 0);
                if (landMask <= 0.35) {
                    skippedWaterOrMissingCellCount += 1;
                    continue;
                }

                const temperature = readFieldValue(inputBundle.fields.temperatureColdLoadField, x, y, worldBounds, 0.5);
                const wetness = readFieldValue(inputBundle.fields.wetnessField, x, y, worldBounds, 0);
                const seasonality = readFieldValue(inputBundle.fields.seasonalityField, x, y, worldBounds, 0);
                const elevation = readFieldValue(inputBundle.fields.seaLevelAppliedElevationField, x, y, worldBounds, 0);
                const envelopeType = classifyBiomeEnvelope({
                    temperature,
                    wetness,
                    seasonality,
                    elevation
                });
                const classIndex = classIndexByEnvelopeType.get(envelopeType);
                if (!Number.isFinite(classIndex)) {
                    skippedWaterOrMissingCellCount += 1;
                    continue;
                }

                classificationIndices[cellIndex] = classIndex;
                classifiedLandCellCount += 1;

                const legendEntry = classificationLegend[classIndex];
                legendEntry.cellCount += 1;
                legendEntry._temperatureTotal += temperature;
                legendEntry._wetnessTotal += wetness;
                legendEntry._seasonalityTotal += seasonality;
                legendEntry._elevationTotal += elevation;

                const reliefRegionId = reliefRegionMembership.get(cellIndex);
                if (reliefRegionId) {
                    if (!reliefRegionAccumulators.has(reliefRegionId)) {
                        reliefRegionAccumulators.set(reliefRegionId, createReliefRegionAccumulator(reliefRegionId));
                    }

                    const accumulator = reliefRegionAccumulators.get(reliefRegionId);
                    accumulator.cellCount += 1;
                    accumulator.envelopeCounts.set(
                        envelopeType,
                        (accumulator.envelopeCounts.get(envelopeType) || 0) + 1
                    );
                }
            }
        }

        classificationLegend.forEach((entry) => {
            const cellCount = Math.max(1, entry.cellCount);
            entry.landCellRatio = roundMetric(entry.cellCount / Math.max(1, classifiedLandCellCount));
            entry.meanTemperatureBias = roundMetric(entry._temperatureTotal / cellCount);
            entry.meanWetnessBias = roundMetric(entry._wetnessTotal / cellCount);
            entry.meanSeasonalityBias = roundMetric(entry._seasonalityTotal / cellCount);
            entry.meanElevationBias = roundMetric(entry._elevationTotal / cellCount);
            delete entry._temperatureTotal;
            delete entry._wetnessTotal;
            delete entry._seasonalityTotal;
            delete entry._elevationTotal;
        });

        const envelopeSummaries = classificationLegend
            .filter((entry) => entry.cellCount > 0)
            .map((entry) => ({
                classIndex: entry.classIndex,
                envelopeType: entry.envelopeType,
                cellCount: entry.cellCount,
                landCellRatio: entry.landCellRatio,
                meanTemperatureBias: entry.meanTemperatureBias,
                meanWetnessBias: entry.meanWetnessBias,
                meanSeasonalityBias: entry.meanSeasonalityBias,
                meanElevationBias: entry.meanElevationBias
            }));
        const reliefRegionSummaries = Array.from(reliefRegionAccumulators.values())
            .map((accumulator) => {
                const envelopeBreakdown = Array.from(accumulator.envelopeCounts.entries())
                    .map(([envelopeType, cellCount]) => ({
                        envelopeType,
                        cellCount,
                        contributionRatio: roundMetric(cellCount / Math.max(1, accumulator.cellCount))
                    }))
                    .sort((left, right) => {
                        if (right.cellCount !== left.cellCount) {
                            return right.cellCount - left.cellCount;
                        }

                        return left.envelopeType.localeCompare(right.envelopeType);
                    });

                return {
                    reliefRegionId: accumulator.reliefRegionId,
                    cellCount: accumulator.cellCount,
                    primaryEnvelopeType: envelopeBreakdown.length ? envelopeBreakdown[0].envelopeType : '',
                    envelopeBreakdown
                };
            })
            .sort((left, right) => left.reliefRegionId.localeCompare(right.reliefRegionId));

        return {
            outputId: CLASSIFICATION_OUTPUT_ID,
            helperId: HELPER_ID,
            moduleId: MODULE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            macroSeed: inputBundle.macroSeed,
            worldBounds,
            width,
            height,
            size,
            modelId: CLASSIFICATION_MODEL_ID,
            classificationEncoding: CLASSIFICATION_ENCODING,
            unclassifiedValue: -1,
            classificationIndices,
            classificationLegend,
            envelopeSummaries,
            reliefRegionSummaries,
            inputBundle,
            sourceFieldIds: inputBundle.sourceFieldIds.slice(),
            sourceIntermediateOutputIds: inputBundle.sourceIntermediateOutputIds.slice(),
            sourceRecordIds: inputBundle.sourceRecordIds.slice(),
            summary: {
                ready: true,
                classificationModel: 'coarse_physical_temperature_wetness_elevation_envelope',
                classifiedLandCellCount,
                skippedWaterOrMissingCellCount,
                envelopeClassCount: envelopeSummaries.length,
                reliefRegionSummaryCount: reliefRegionSummaries.length,
                valueMeaning: '-1=water or unclassified; non-negative values index classificationLegend physical envelope classes',
                outputPolicy: 'Coarse physical-world natural envelope only; no local biome placement, resource props, or ecology simulation.'
            },
            compatibility: {
                physicalWorldLayerOnly: true,
                futureBiomeEnvelopeSummaryInput: true,
                futureClimateStressInput: true,
                gameplayBiomeOutput: false,
                localBiomePlacementOutput: false,
                resourcePropOutput: false,
                ecologyTruthOutput: false,
                terrainCellOutput: false,
                uiOutput: false
            },
            intentionallyAbsent: [
                'localBiomePlacement',
                'gameplayBiomes',
                'resourceProps',
                'ecologySimulation',
                'terrainCells',
                'uiOverlays'
            ]
        };
    }

    function getBiomeEnvelopeClassificationContract() {
        return {
            contractId: CLASSIFICATION_OUTPUT_ID,
            moduleId: MODULE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            outputType: 'BiomeEnvelopeClassification',
            modelId: CLASSIFICATION_MODEL_ID,
            classificationEncoding: CLASSIFICATION_ENCODING,
            sourceKeys: [
                ...REQUIRED_FIELD_IDS,
                ...REQUIRED_INTERMEDIATE_IDS,
                ...OPTIONAL_FIELD_IDS,
                ...OPTIONAL_INTERMEDIATE_IDS,
                ...OPTIONAL_RECORD_IDS
            ],
            requiredKeys: [
                'outputId',
                'helperId',
                'moduleId',
                'worldBounds',
                'width',
                'height',
                'size',
                'modelId',
                'classificationEncoding',
                'unclassifiedValue',
                'classificationIndices',
                'classificationLegend',
                'envelopeSummaries',
                'summary',
                'compatibility'
            ],
            intentionallyAbsent: [
                'localBiomePlacement',
                'gameplayBiomes',
                'resourceProps',
                'ecologySimulation',
                'terrainCells',
                'uiOverlays'
            ],
            description: 'Coarse physical-world biome-envelope classification built from climate, wetness, elevation, and land-mask inputs. It produces row-major physical envelope classes only and must not be treated as local biome placement, resource spawning, or downstream ecology truth.'
        };
    }

    function getBiomeEnvelopeHelperDescriptor() {
        return {
            moduleId: MODULE_ID,
            helperId: HELPER_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            file: 'js/worldgen/macro/biome-envelope-helper.js',
            entry: 'prepareBiomeEnvelopeInputs',
            requiredFieldIds: REQUIRED_FIELD_IDS.slice(),
            optionalFieldIds: OPTIONAL_FIELD_IDS.slice(),
            requiredIntermediateOutputIds: REQUIRED_INTERMEDIATE_IDS.slice(),
            optionalIntermediateOutputIds: OPTIONAL_INTERMEDIATE_IDS.slice(),
            optionalRecordIds: OPTIONAL_RECORD_IDS.slice(),
            channelPlan: CHANNEL_PLAN.map(cloneValue),
            classificationOutputId: CLASSIFICATION_OUTPUT_ID,
            classificationModelId: CLASSIFICATION_MODEL_ID,
            description: 'Physical-world helper that packages climate, relief/elevation, and field-helper-compatible channels and can emit coarse biome-envelope classification without producing gameplay biomes or resource props.'
        };
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule(MODULE_ID, {
            entry: 'prepareBiomeEnvelopeInputs',
            file: 'js/worldgen/macro/biome-envelope-helper.js',
            description: 'Physical-world biome-envelope input helper. Prepares classification inputs only; no gameplay biome, terrain decoration, or resource prop output.',
            stub: false,
            helper: true
        });
    }

    Object.assign(macro, {
        getBiomeEnvelopeClassificationContract,
        getBiomeEnvelopeHelperDescriptor,
        generateBiomeEnvelopeClassification,
        prepareBiomeEnvelopeInputs
    });
})();
