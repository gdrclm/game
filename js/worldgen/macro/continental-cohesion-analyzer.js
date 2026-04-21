(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const MODULE_ID = 'continentalCohesionAnalyzer';
    const PIPELINE_STEP_ID = 'continentalCohesion';
    const STATUS = 'PARTIAL_IMPLEMENTED';
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';
    const INTERIOR_PASSABILITY_FIELD_ID = 'interiorPassabilityField';
    const INTERIOR_PASSABILITY_OUTPUT_ID = 'interiorPassabilityAnalysis';
    const INTERIOR_PASSABILITY_STAGE_ID = 'interiorPassability';
    const INTERIOR_PASSABILITY_MODEL_ID = 'coarseReliefClimateHydrologyCompositeV1';
    const REGIONAL_SEGMENT_MASK_FIELD_ID = 'regionalSegmentMaskField';
    const REGIONAL_SEGMENTATION_OUTPUT_ID = 'regionalSegmentationAnalysis';
    const REGIONAL_SEGMENTATION_STAGE_ID = 'regionalSegmentation';
    const REGIONAL_SEGMENTATION_MODEL_ID = 'continentInteriorPassabilityBarrierComponentsV1';
    const CORE_POTENTIAL_FIELD_ID = 'corePotentialField';
    const CORE_POTENTIAL_OUTPUT_ID = 'corePotentialAnalysis';
    const CORE_POTENTIAL_STAGE_ID = 'corePotential';
    const CORE_POTENTIAL_MODEL_ID = 'regionalSegmentCorePotentialCompositeV1';
    const FRACTURED_PERIPHERY_FIELD_ID = 'fracturedPeripheryField';
    const FRACTURED_PERIPHERY_OUTPUT_ID = 'fracturedPeripheryAnalysis';
    const FRACTURED_PERIPHERY_STAGE_ID = 'fracturedPeriphery';
    const FRACTURED_PERIPHERY_MODEL_ID = 'regionalSegmentFracturedPeripheryCompositeV1';
    const CONTINENTAL_COHESION_FIELD_ID = 'continentalCohesionField';
    const CONTINENTAL_COHESION_SUMMARIES_ID = 'continentalCohesionSummaries';
    const CONTINENTAL_COHESION_MODEL_ID = 'cohesionSuboutputCompositeV1';
    const DEFAULT_WORLD_BOUNDS = Object.freeze({
        width: 256,
        height: 128
    });
    const REQUIRED_KEYS = Object.freeze([
        'macroSeed'
    ]);
    const OPTIONAL_KEYS = Object.freeze([
        'macroSeedProfile',
        'phase1Constraints',
        'worldBounds',
        'reliefElevation',
        'hydrosphere',
        'riverSystem',
        'climateEnvelope',
        'fields',
        'intermediateOutputs',
        'records',
        'debugOptions'
    ]);
    const INPUT_GROUPS = Object.freeze({
        continentBodies: Object.freeze([
            {
                dependencyId: 'continentBodies',
                sourceGroup: 'reliefElevation.outputs.intermediateOutputs',
                required: true,
                role: 'connected continent-body geometry and ContinentRecord-compatible drafts'
            }
        ]),
        relief: Object.freeze([
            {
                dependencyId: 'reliefRegionExtraction',
                sourceGroup: 'reliefElevation.outputs.intermediateOutputs',
                required: true,
                role: 'relief-region geometry and relief body membership for later cohesion cuts'
            },
            {
                dependencyId: 'reliefRegions',
                sourceGroup: 'reliefElevation.outputs.records',
                required: false,
                role: 'final relief-region records for future ContinentRecord linkage review'
            }
        ]),
        climateStress: Object.freeze([
            {
                dependencyId: 'climateStressField',
                sourceGroup: 'climateEnvelope.outputs.fields',
                required: true,
                role: 'physical climate burden field for future cohesion pressure metrics'
            },
            {
                dependencyId: 'climateStressRegionalSummaries',
                sourceGroup: 'climateEnvelope.outputs.intermediateOutputs',
                required: false,
                role: 'regional stress rollups keyed by relief region, continent body, and sea cluster'
            },
            {
                dependencyId: 'regionalClimateSummaries',
                sourceGroup: 'climateEnvelope.outputs.intermediateOutputs',
                required: false,
                role: 'climate-band summary identity rows for future continent-climate linkage'
            }
        ]),
        hydrology: Object.freeze([
            {
                dependencyId: 'watershedSegmentation',
                sourceGroup: 'hydrosphere.outputs.intermediateOutputs',
                required: false,
                role: 'watershed geometry for future basin-connectivity metrics'
            },
            {
                dependencyId: 'downhillFlowRouting',
                sourceGroup: 'riverSystem.outputs.intermediateOutputs',
                required: false,
                role: 'downhill routing graph for future river corridor cohesion metrics'
            },
            {
                dependencyId: 'flowAccumulationField',
                sourceGroup: 'riverSystem.outputs.fields',
                required: false,
                role: 'flow accumulation field for future inland-passability and basin-core metrics'
            },
            {
                dependencyId: 'majorRiverCandidates',
                sourceGroup: 'riverSystem.outputs.intermediateOutputs',
                required: false,
                role: 'macro river-line candidates for future segmentation and corridor metrics'
            },
            {
                dependencyId: 'deltaLakeMarshTagging',
                sourceGroup: 'riverSystem.outputs.intermediateOutputs',
                required: false,
                role: 'structural water-fringe tags for future cohesion risk metrics'
            },
            {
                dependencyId: 'riverBasins',
                sourceGroup: 'riverSystem.outputs.records',
                required: false,
                role: 'hydrology-stage RiverBasinRecord outputs for future continent-basin linkage'
            }
        ])
    });
    const IMPLEMENTED_METRICS = Object.freeze([
        'interiorPassability',
        'regionalSegmentation',
        'corePotential',
        'fracturedPeriphery'
    ]);
    const PLANNED_METRICS = Object.freeze([
        'basinConnectivity',
        'ridgeBarrier',
        'stateScalePotential'
    ]);
    const RELIEF_PASSABILITY_BASE = Object.freeze({
        plain: 0.78,
        coast: 0.68,
        basin: 0.62,
        plateau: 0.48,
        mountain: 0.25
    });
    const PASSABILITY_CLASS_THRESHOLDS = Object.freeze([
        { classId: 'open', minScore: 0.68 },
        { classId: 'mixed', minScore: 0.48 },
        { classId: 'constrained', minScore: 0.28 },
        { classId: 'obstructed', minScore: 0 }
    ]);
    const ALL_COHESION_METRICS = Object.freeze([
        'interiorPassability',
        'basinConnectivity',
        'ridgeBarrier',
        'regionalSegmentation',
        'corePotential',
        'fracturedPeriphery',
        'stateScalePotential'
    ]);
    const INTENTIONALLY_ABSENT = Object.freeze([
        'basinConnectivity',
        'ridgeBarrier',
        'stateScalePotential',
        'continentCoreDetection',
        'peripheryClassification',
        'fragmentationScoring',
        'routeGraph',
        'localTraversalRuntime',
        'ContinentRecordMutation',
        'MacroGeographyPackageAssembly',
        'historyFacingAnalysis',
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

    function normalizeString(value, fallback = '') {
        return typeof value === 'string' && value.trim()
            ? value.trim()
            : fallback;
    }

    function normalizeSeed(seed) {
        return typeof macro.normalizeSeed === 'function'
            ? macro.normalizeSeed(seed)
            : (Number(seed) >>> 0) || 0;
    }

    function normalizeInteger(value, fallback = 0) {
        const numericValue = Number(value);
        return Number.isFinite(numericValue)
            ? Math.max(0, Math.trunc(numericValue))
            : fallback;
    }

    function normalizeNumber(value, fallback = 0) {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? numericValue : fallback;
    }

    function clampUnitInterval(value, fallback = 0) {
        const numericValue = normalizeNumber(value, fallback);
        return Math.min(1, Math.max(0, numericValue));
    }

    function roundFieldValue(value) {
        return Math.round(clampUnitInterval(value, 0) * 10000) / 10000;
    }

    function normalizeCellIndex(cellIndex, size) {
        const normalizedIndex = Number(cellIndex);
        if (!Number.isFinite(normalizedIndex)) {
            return -1;
        }

        const integerIndex = Math.trunc(normalizedIndex);
        return integerIndex >= 0 && integerIndex < size ? integerIndex : -1;
    }

    function normalizeWorldBounds(bounds = DEFAULT_WORLD_BOUNDS) {
        const source = bounds && typeof bounds === 'object' ? bounds : {};
        return {
            width: Math.max(1, normalizeInteger(source.width, DEFAULT_WORLD_BOUNDS.width)),
            height: Math.max(1, normalizeInteger(source.height, DEFAULT_WORLD_BOUNDS.height))
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

    function findInputDependency(input = {}, dependencyId = '', sourceGroup = '') {
        const candidateGroups = [
            getNestedValue(input, sourceGroup),
            input.fields,
            input.intermediateOutputs,
            input.records,
            getNestedValue(input, 'outputs.fields'),
            getNestedValue(input, 'outputs.intermediateOutputs'),
            getNestedValue(input, 'outputs.records'),
            getNestedValue(input, 'reliefElevation.fields'),
            getNestedValue(input, 'reliefElevation.intermediateOutputs'),
            getNestedValue(input, 'reliefElevation.records'),
            getNestedValue(input, 'reliefElevation.outputs.fields'),
            getNestedValue(input, 'reliefElevation.outputs.intermediateOutputs'),
            getNestedValue(input, 'reliefElevation.outputs.records'),
            getNestedValue(input, 'hydrosphere.fields'),
            getNestedValue(input, 'hydrosphere.intermediateOutputs'),
            getNestedValue(input, 'hydrosphere.records'),
            getNestedValue(input, 'hydrosphere.outputs.fields'),
            getNestedValue(input, 'hydrosphere.outputs.intermediateOutputs'),
            getNestedValue(input, 'hydrosphere.outputs.records'),
            getNestedValue(input, 'riverSystem.fields'),
            getNestedValue(input, 'riverSystem.intermediateOutputs'),
            getNestedValue(input, 'riverSystem.records'),
            getNestedValue(input, 'riverSystem.outputs.fields'),
            getNestedValue(input, 'riverSystem.outputs.intermediateOutputs'),
            getNestedValue(input, 'riverSystem.outputs.records'),
            getNestedValue(input, 'climateEnvelope.fields'),
            getNestedValue(input, 'climateEnvelope.intermediateOutputs'),
            getNestedValue(input, 'climateEnvelope.records'),
            getNestedValue(input, 'climateEnvelope.outputs.fields'),
            getNestedValue(input, 'climateEnvelope.outputs.intermediateOutputs'),
            getNestedValue(input, 'climateEnvelope.outputs.records')
        ];

        return candidateGroups
            .map((group) => findDependencyValue(group, dependencyId))
            .find(Boolean) || null;
    }

    function describeDependency(input, dependency) {
        const value = findInputDependency(input, dependency.dependencyId, dependency.sourceGroup);
        return {
            dependencyId: dependency.dependencyId,
            sourceGroup: dependency.sourceGroup,
            required: dependency.required === true,
            available: Boolean(value),
            role: dependency.role
        };
    }

    function summarizeDependencyGroup(entries = []) {
        const requiredEntries = entries.filter((entry) => entry.required);
        const missingRequired = requiredEntries.filter((entry) => !entry.available);
        return {
            dependencyCount: entries.length,
            requiredDependencyCount: requiredEntries.length,
            missingRequiredDependencyCount: missingRequired.length,
            missingRequiredDependencyIds: missingRequired.map((entry) => entry.dependencyId),
            availableDependencyIds: entries
                .filter((entry) => entry.available)
                .map((entry) => entry.dependencyId)
        };
    }

    function describeContinentalCohesionDependencyAvailability(input = {}) {
        const groups = Object.fromEntries(
            Object.entries(INPUT_GROUPS).map(([groupId, dependencies]) => {
                const entries = dependencies.map((dependency) => describeDependency(input, dependency));
                return [groupId, {
                    entries,
                    summary: summarizeDependencyGroup(entries)
                }];
            })
        );
        const allEntries = Object.values(groups).flatMap((group) => group.entries);
        const requiredEntries = allEntries.filter((entry) => entry.required);
        const missingRequired = requiredEntries.filter((entry) => !entry.available);

        return {
            groups,
            summary: {
                dependencyCount: allEntries.length,
                requiredDependencyCount: requiredEntries.length,
                missingRequiredDependencyCount: missingRequired.length,
                missingRequiredDependencyIds: missingRequired.map((entry) => entry.dependencyId),
                readyForFutureMetricImplementation: missingRequired.length === 0
            }
        };
    }

    function countRecords(value, collectionKey) {
        if (Array.isArray(value)) {
            return value.length;
        }

        if (value && typeof value === 'object' && Array.isArray(value[collectionKey])) {
            return value[collectionKey].length;
        }

        return 0;
    }

    function buildFieldStats(values = []) {
        const numericValues = values
            .map((value) => clampUnitInterval(value, 0))
            .filter((value) => Number.isFinite(value));

        if (!numericValues.length) {
            return {
                min: 0,
                max: 0,
                mean: 0
            };
        }

        const min = numericValues.reduce((minValue, value) => Math.min(minValue, value), 1);
        const max = numericValues.reduce((maxValue, value) => Math.max(maxValue, value), 0);
        const mean = numericValues.reduce((total, value) => total + value, 0) / numericValues.length;

        return {
            min: roundFieldValue(min),
            max: roundFieldValue(max),
            mean: roundFieldValue(mean)
        };
    }

    function readFieldValue(field, cellIndex, fallback = 0) {
        if (!field || !Array.isArray(field.values)) {
            return fallback;
        }

        const normalizedIndex = normalizeCellIndex(cellIndex, field.values.length);
        return normalizedIndex >= 0
            ? clampUnitInterval(field.values[normalizedIndex], fallback)
            : fallback;
    }

    function pointFromIndex(cellIndex, width) {
        return {
            x: cellIndex % width,
            y: Math.floor(cellIndex / width)
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

    function normalizeCellIndexList(cellIndices = [], size = 0) {
        const uniqueIndices = new Set();
        if (!Array.isArray(cellIndices)) {
            return [];
        }

        cellIndices.forEach((cellIndex) => {
            const normalizedIndex = normalizeCellIndex(cellIndex, size);
            if (normalizedIndex >= 0) {
                uniqueIndices.add(normalizedIndex);
            }
        });

        return Array.from(uniqueIndices).sort((left, right) => left - right);
    }

    function extractContinentId(continentBody = {}) {
        return normalizeString(
            continentBody.continentId,
            normalizeString(
                continentBody.recordDraft && continentBody.recordDraft.continentId,
                normalizeString(continentBody.continentBodyId, '')
            )
        );
    }

    function buildSummaryLookup(rows = [], idKey = 'sourceId') {
        const lookup = new Map();
        const normalizedRows = Array.isArray(rows) ? rows : [];
        normalizedRows.forEach((row) => {
            const sourceId = normalizeString(row && row[idKey], '');
            if (sourceId) {
                lookup.set(sourceId, row);
            }
        });
        return lookup;
    }

    function buildContinentCellLookup(continentBodies = [], size = 0) {
        const lookup = new Map();
        continentBodies.forEach((continentBody) => {
            const continentId = extractContinentId(continentBody);
            normalizeCellIndexList(continentBody && continentBody.cellIndices, size).forEach((cellIndex) => {
                lookup.set(cellIndex, {
                    continentId,
                    continentBody
                });
            });
        });

        return lookup;
    }

    function buildContinentBodyLookup(continentBodies = []) {
        const lookup = new Map();
        continentBodies.forEach((continentBody) => {
            const continentId = extractContinentId(continentBody);
            if (continentId) {
                lookup.set(continentId, continentBody);
            }
        });
        return lookup;
    }

    function resolveAnalysisWorldBounds(fallbackBounds, ...dependencyValues) {
        const sourceWithBounds = dependencyValues.find((value) => (
            value
            && typeof value === 'object'
            && value.worldBounds
            && typeof value.worldBounds === 'object'
        ));

        return normalizeWorldBounds(sourceWithBounds ? sourceWithBounds.worldBounds : fallbackBounds);
    }

    function extractReliefRegionId(regionBody = {}) {
        return normalizeString(
            regionBody.reliefRegionId,
            normalizeString(regionBody.record && regionBody.record.reliefRegionId, '')
        );
    }

    function extractReliefType(regionBody = {}) {
        return normalizeString(
            regionBody.reliefType,
            normalizeString(regionBody.record && regionBody.record.reliefType, 'plain')
        );
    }

    function buildReliefCellLookup(reliefRegionExtraction, reliefRegions, size = 0) {
        const recordLookup = new Map();
        const records = Array.isArray(reliefRegions)
            ? reliefRegions
            : (reliefRegions && Array.isArray(reliefRegions.reliefRegions) ? reliefRegions.reliefRegions : []);
        records.forEach((record) => {
            const reliefRegionId = normalizeString(record && record.reliefRegionId, '');
            if (reliefRegionId) {
                recordLookup.set(reliefRegionId, record);
            }
        });

        const lookup = new Map();
        const reliefRegionBodies = Array.isArray(reliefRegionExtraction && reliefRegionExtraction.reliefRegionBodies)
            ? reliefRegionExtraction.reliefRegionBodies
            : [];
        reliefRegionBodies.forEach((regionBody) => {
            const reliefRegionId = extractReliefRegionId(regionBody);
            const record = regionBody.record || recordLookup.get(reliefRegionId) || {};
            const reliefType = extractReliefType(regionBody);
            const sourceSignals = regionBody.sourceSignals && typeof regionBody.sourceSignals === 'object'
                ? regionBody.sourceSignals
                : {};
            const ruggedness = clampUnitInterval(
                record.ruggednessBias ?? sourceSignals.meanRidgeMagnitude ?? sourceSignals.meanMountainAmplification,
                reliefType === 'mountain' ? 0.7 : 0.25
            );
            const elevation = clampUnitInterval(
                record.elevationBias ?? sourceSignals.meanSeaLevelElevation,
                reliefType === 'mountain' || reliefType === 'plateau' ? 0.65 : 0.45
            );

            normalizeCellIndexList(regionBody.cellIndices, size).forEach((cellIndex) => {
                lookup.set(cellIndex, {
                    reliefRegionId,
                    reliefType,
                    record,
                    sourceSignals,
                    ruggedness,
                    elevation
                });
            });
        });

        return lookup;
    }

    function buildHydrologyCellLookups(watershedSegmentation, majorRiverCandidates, deltaLakeMarshTagging, size = 0) {
        const watershedByCell = new Map();
        const riverLineCells = new Set();
        const waterFringeCells = new Set();
        const watersheds = Array.isArray(watershedSegmentation && watershedSegmentation.watersheds)
            ? watershedSegmentation.watersheds
            : [];
        const riverCandidates = Array.isArray(majorRiverCandidates && majorRiverCandidates.majorRiverCandidates)
            ? majorRiverCandidates.majorRiverCandidates
            : [];
        const featureTags = Array.isArray(deltaLakeMarshTagging && deltaLakeMarshTagging.featureTags)
            ? deltaLakeMarshTagging.featureTags
            : [];

        watersheds.forEach((watershed) => {
            const watershedId = normalizeString(watershed && watershed.watershedId, '');
            normalizeCellIndexList(watershed && watershed.cellIndices, size).forEach((cellIndex) => {
                watershedByCell.set(cellIndex, {
                    watershedId,
                    basinType: normalizeString(watershed && watershed.recordDraft && watershed.recordDraft.basinType, ''),
                    cellCount: normalizeInteger(watershed && watershed.cellCount, 0)
                });
            });
        });

        riverCandidates.forEach((candidate) => {
            normalizeCellIndexList(candidate && candidate.lineCellIndices, size).forEach((cellIndex) => {
                riverLineCells.add(cellIndex);
            });
        });

        featureTags.forEach((featureTag) => {
            const featureType = normalizeString(featureTag && featureTag.featureType, '');
            if (featureType !== 'delta' && featureType !== 'lake' && featureType !== 'marsh') {
                return;
            }

            normalizeCellIndexList(featureTag && featureTag.cellIndices, size).forEach((cellIndex) => {
                waterFringeCells.add(cellIndex);
            });
        });

        return {
            watershedByCell,
            riverLineCells,
            waterFringeCells
        };
    }

    function classifyPassability(score) {
        const normalizedScore = clampUnitInterval(score, 0);
        return PASSABILITY_CLASS_THRESHOLDS.find((threshold) => (
            normalizedScore >= threshold.minScore
        )).classId;
    }

    function classifyBarrier(reliefType, passabilityScore, ruggedness) {
        if (passabilityScore <= 0.32) {
            return true;
        }
        if (reliefType === 'mountain' && (passabilityScore <= 0.46 || ruggedness >= 0.62)) {
            return true;
        }
        if (reliefType === 'plateau' && passabilityScore <= 0.36 && ruggedness >= 0.68) {
            return true;
        }

        return false;
    }

    function classifyCorePotential(score) {
        const normalizedScore = clampUnitInterval(score, 0);
        if (normalizedScore >= 0.72) {
            return 'strong';
        }
        if (normalizedScore >= 0.52) {
            return 'moderate';
        }
        if (normalizedScore >= 0.32) {
            return 'limited';
        }

        return 'weak';
    }

    function classifyFracturedPeriphery(score) {
        const normalizedScore = clampUnitInterval(score, 0);
        if (normalizedScore >= 0.68) {
            return 'fractured';
        }
        if (normalizedScore >= 0.5) {
            return 'weakly_connected';
        }
        if (normalizedScore >= 0.34) {
            return 'edge_exposed';
        }

        return 'anchored';
    }

    function classifyContinentalCohesion(score) {
        const normalizedScore = clampUnitInterval(score, 0);
        if (normalizedScore >= 0.72) {
            return 'cohesive';
        }
        if (normalizedScore >= 0.54) {
            return 'stable';
        }
        if (normalizedScore >= 0.34) {
            return 'mixed';
        }

        return 'fragile';
    }

    function getReliefTypeRatio(reliefTypeMix = [], targetReliefType = '') {
        const normalizedTarget = normalizeString(targetReliefType, '');
        if (!normalizedTarget || !Array.isArray(reliefTypeMix)) {
            return 0;
        }

        const entry = reliefTypeMix.find((item) => (
            normalizeString(item && item.reliefType, '') === normalizedTarget
        ));
        return roundFieldValue(entry ? clampUnitInterval(entry.cellRatio, 0) : 0);
    }

    function scoreCorePotentialClimateSupport(segment = {}, climateSummary = {}, stressSummary = {}) {
        const segmentClimateStress = clampUnitInterval(segment.meanClimateStress, 0.5);
        const continentClimateStress = clampUnitInterval(
            stressSummary.meanClimateStress,
            segmentClimateStress
        );
        const meanTemperatureBias = clampUnitInterval(climateSummary.meanTemperatureBias, 0.58);
        const meanHumidityBias = clampUnitInterval(climateSummary.meanHumidityBias, 0.56);
        const meanSeasonalityBias = clampUnitInterval(climateSummary.meanSeasonalityBias, segmentClimateStress);
        const stormStress = clampUnitInterval(stressSummary.meanStormStress, continentClimateStress);
        const coastalDecayStress = clampUnitInterval(stressSummary.meanCoastalDecayStress, continentClimateStress);
        const seasonalityStress = clampUnitInterval(stressSummary.meanSeasonalityStress, meanSeasonalityBias);
        const temperatureSupport = clampUnitInterval(1 - (Math.abs(meanTemperatureBias - 0.58) / 0.42), 0);
        const humiditySupport = clampUnitInterval(1 - (Math.abs(meanHumidityBias - 0.56) / 0.56), 0);
        const climateStressSupport = clampUnitInterval(
            1 - ((segmentClimateStress * 0.65) + (continentClimateStress * 0.35)),
            0
        );
        const stormStability = clampUnitInterval(1 - stormStress, 0);
        const seasonalityStability = clampUnitInterval(
            1 - ((seasonalityStress * 0.6) + (meanSeasonalityBias * 0.4)),
            0
        );
        const coastalDecayStability = clampUnitInterval(1 - coastalDecayStress, 0);

        return roundFieldValue(clampUnitInterval(
            (climateStressSupport * 0.45)
            + (temperatureSupport * 0.15)
            + (humiditySupport * 0.15)
            + (stormStability * 0.1)
            + (seasonalityStability * 0.1)
            + (coastalDecayStability * 0.05),
            0
        ));
    }

    function buildSegmentCorePotentialSummary(segment = {}, context = {}) {
        const climateSummary = context.continentClimateSummary || {};
        const stressSummary = context.continentStressSummary || {};
        const continentBody = context.continentBody || {};
        const continentSegmentCount = Math.max(1, normalizeInteger(context.continentSegmentCount, 1));
        const neighborCount = Array.isArray(segment.barrierSeparatedNeighborSegmentIds)
            ? segment.barrierSeparatedNeighborSegmentIds.length
            : 0;
        const coastReliefRatio = getReliefTypeRatio(segment.reliefTypeMix, 'coast');
        const exteriorEdgeDensity = clampUnitInterval(
            normalizeNumber(segment.exteriorEdgeCount, 0) / Math.max(1, normalizeInteger(segment.cellCount, 0) * 2),
            0
        );
        const continentCoastalCellRatio = clampUnitInterval(continentBody.coastalCellRatio, 0);
        const coastalDecayPenalty = clampUnitInterval(stressSummary.meanCoastalDecayStress, 0);
        const areaSupport = roundFieldValue(Math.sqrt(clampUnitInterval(segment.continentCellRatio, 0)));
        const passabilitySupport = roundFieldValue(clampUnitInterval(
            (clampUnitInterval(segment.meanInteriorPassability, 0) * 0.84)
            + ((1 - clampUnitInterval(segment.barrierContactCellRatio, 0)) * 0.16),
            0
        ));
        const neighborSupport = continentSegmentCount <= 1
            ? 1
            : clampUnitInterval(neighborCount / Math.max(1, continentSegmentCount - 1), 0);
        const connectivitySupport = roundFieldValue(clampUnitInterval(
            (neighborSupport * 0.72)
            + ((1 - clampUnitInterval(segment.barrierContactCellRatio, 0)) * 0.28),
            0
        ));
        const climateSupport = scoreCorePotentialClimateSupport(segment, climateSummary, stressSummary);
        const interioritySupport = roundFieldValue(clampUnitInterval(
            1 - (Math.max(0, exteriorEdgeDensity - 0.08) / 0.92),
            0
        ));
        const coastalAccessSupport = roundFieldValue(clampUnitInterval(
            (
                ((coastReliefRatio * 0.62) + (exteriorEdgeDensity * 0.38))
                * (0.76 + (continentCoastalCellRatio * 0.24))
                * (1 - (coastalDecayPenalty * 0.38))
            ),
            0
        ));
        const corePotentialScore = roundFieldValue(clampUnitInterval(
            (areaSupport * 0.22)
            + (passabilitySupport * 0.24)
            + (connectivitySupport * 0.18)
            + (climateSupport * 0.18)
            + (interioritySupport * 0.1)
            + (coastalAccessSupport * 0.08),
            0
        ));

        return {
            summaryId: `core_potential_${normalizeString(segment.regionalSegmentId, 'unknown')}`,
            regionalSegmentId: normalizeString(segment.regionalSegmentId, ''),
            continentId: normalizeString(segment.continentId, ''),
            continentBodyId: normalizeString(segment.continentBodyId, ''),
            segmentIndex: normalizeInteger(segment.segmentIndex, 0),
            cellCount: normalizeInteger(segment.cellCount, 0),
            continentCellRatio: roundFieldValue(clampUnitInterval(segment.continentCellRatio, 0)),
            meanInteriorPassability: roundFieldValue(clampUnitInterval(segment.meanInteriorPassability, 0)),
            meanClimateStress: roundFieldValue(clampUnitInterval(segment.meanClimateStress, 0)),
            dominantReliefType: normalizeString(segment.dominantReliefType, ''),
            barrierSeparatedNeighborCount: neighborCount,
            areaSupport,
            passabilitySupport,
            connectivitySupport,
            climateSupport,
            interioritySupport,
            coastalAccessSupport,
            coastReliefRatio,
            exteriorEdgeDensity: roundFieldValue(exteriorEdgeDensity),
            continentCoastalCellRatio: roundFieldValue(continentCoastalCellRatio),
            climateSummaryId: normalizeString(climateSummary.summaryId, ''),
            climateStressSummaryId: normalizeString(stressSummary.summaryId, ''),
            dominantBandType: normalizeString(climateSummary.dominantBandType, ''),
            stressRegime: normalizeString(stressSummary.stressRegime, ''),
            climateSummaryMeanTemperatureBias: roundFieldValue(clampUnitInterval(climateSummary.meanTemperatureBias, 0)),
            climateSummaryMeanHumidityBias: roundFieldValue(clampUnitInterval(climateSummary.meanHumidityBias, 0)),
            climateSummaryMeanSeasonalityBias: roundFieldValue(clampUnitInterval(climateSummary.meanSeasonalityBias, 0)),
            meanDrynessStress: roundFieldValue(clampUnitInterval(stressSummary.meanDrynessStress, 0)),
            meanStormStress: roundFieldValue(clampUnitInterval(stressSummary.meanStormStress, 0)),
            meanCoastalDecayStress: roundFieldValue(clampUnitInterval(stressSummary.meanCoastalDecayStress, 0)),
            meanSeasonalityStress: roundFieldValue(clampUnitInterval(stressSummary.meanSeasonalityStress, 0)),
            corePotentialScore,
            corePotentialClass: classifyCorePotential(corePotentialScore)
        };
    }

    function buildCorePotentialContinentSummary(
        continentId = '',
        segmentPotentials = [],
        continentBody = {},
        climateSummary = {},
        stressSummary = {}
    ) {
        const sortedPotentials = segmentPotentials.slice().sort((left, right) => {
            if (right.corePotentialScore !== left.corePotentialScore) {
                return right.corePotentialScore - left.corePotentialScore;
            }

            return left.regionalSegmentId.localeCompare(right.regionalSegmentId);
        });
        const segmentCount = sortedPotentials.length;
        const leadingSegment = sortedPotentials[0] || null;
        const strongSegmentIds = sortedPotentials
            .filter((segment) => segment.corePotentialClass === 'strong')
            .map((segment) => segment.regionalSegmentId);
        const moderateOrBetterSegmentIds = sortedPotentials
            .filter((segment) => (
                segment.corePotentialClass === 'strong'
                || segment.corePotentialClass === 'moderate'
            ))
            .map((segment) => segment.regionalSegmentId);
        const meanCorePotential = segmentCount
            ? sortedPotentials.reduce((total, segment) => total + segment.corePotentialScore, 0) / segmentCount
            : 0;

        return {
            summaryId: `core_potential_continent_${continentId || 'unknown'}`,
            continentId,
            continentBodyId: normalizeString(continentBody && continentBody.continentBodyId, ''),
            segmentCount,
            leadingCorePotentialSegmentId: leadingSegment ? leadingSegment.regionalSegmentId : '',
            leadingCorePotentialScore: leadingSegment ? leadingSegment.corePotentialScore : 0,
            strongCorePotentialSegmentIds: strongSegmentIds,
            supportingCorePotentialSegmentIds: moderateOrBetterSegmentIds.slice(0, 3),
            strongCorePotentialSegmentCount: strongSegmentIds.length,
            moderateOrBetterSegmentCount: moderateOrBetterSegmentIds.length,
            meanCorePotential: roundFieldValue(meanCorePotential),
            continentCoastalCellRatio: roundFieldValue(clampUnitInterval(continentBody && continentBody.coastalCellRatio, 0)),
            dominantBandType: normalizeString(climateSummary && climateSummary.dominantBandType, ''),
            stressRegime: normalizeString(stressSummary && stressSummary.stressRegime, ''),
            meanClimateStress: roundFieldValue(clampUnitInterval(stressSummary && stressSummary.meanClimateStress, 0)),
            climateSummaryAvailable: Boolean(climateSummary && climateSummary.summaryId),
            climateStressSummaryAvailable: Boolean(stressSummary && stressSummary.summaryId),
            valueMeaning: 'coarse physical core-potential ranking over regional segments only; no polity or periphery inference'
        };
    }

    function summarizeSegmentHydrologyBurden(cellIndices = [], context = {}) {
        const normalizedCellIndices = normalizeCellIndexList(cellIndices, context.size);
        const cellCount = Math.max(1, normalizedCellIndices.length);
        const hydrologyLookups = context.hydrologyLookups || {};
        let flowAccumulationTotal = 0;
        let riverCorridorCellCount = 0;
        let waterFringeCellCount = 0;
        const watershedIds = new Set();

        normalizedCellIndices.forEach((cellIndex) => {
            flowAccumulationTotal += readFieldValue(context.flowAccumulationField, cellIndex, 0);

            if (hydrologyLookups.riverLineCells && hydrologyLookups.riverLineCells.has(cellIndex)) {
                riverCorridorCellCount += 1;
            }
            if (hydrologyLookups.waterFringeCells && hydrologyLookups.waterFringeCells.has(cellIndex)) {
                waterFringeCellCount += 1;
            }

            const watershed = hydrologyLookups.watershedByCell
                ? hydrologyLookups.watershedByCell.get(cellIndex)
                : null;
            const watershedId = normalizeString(watershed && watershed.watershedId, '');
            if (watershedId) {
                watershedIds.add(watershedId);
            }
        });

        const meanFlowAccumulation = roundFieldValue(flowAccumulationTotal / cellCount);
        const riverCorridorCellRatio = roundFieldValue(riverCorridorCellCount / cellCount);
        const waterFringeCellRatio = roundFieldValue(waterFringeCellCount / cellCount);
        const watershedFragmentation = roundFieldValue(clampUnitInterval(
            Math.max(0, watershedIds.size - 1) / Math.max(1, Math.sqrt(cellCount)),
            0
        ));
        const hydrologySupport = roundFieldValue(clampUnitInterval(
            (meanFlowAccumulation * 0.62)
            + (riverCorridorCellRatio * 0.28)
            + ((1 - waterFringeCellRatio) * 0.1),
            0
        ));
        const hydrologyBurden = roundFieldValue(clampUnitInterval(
            ((1 - hydrologySupport) * 0.68)
            + (waterFringeCellRatio * 0.22)
            + (watershedFragmentation * 0.1),
            0
        ));

        return {
            meanFlowAccumulation,
            riverCorridorCellRatio,
            waterFringeCellRatio,
            watershedFragmentation,
            hydrologySupport,
            hydrologyBurden
        };
    }

    function buildSegmentFracturedPeripherySummary(segment = {}, context = {}) {
        const corePotential = context.corePotential || {};
        const stressSummary = context.continentStressSummary || {};
        const passabilitySummary = context.continentPassabilitySummary || {};
        const hydrologySummary = summarizeSegmentHydrologyBurden(segment.cellIndices, context);
        const segmentCorePotential = clampUnitInterval(
            corePotential.corePotentialScore,
            clampUnitInterval(segment.meanInteriorPassability, 0)
        );
        const leadingCorePotentialScore = clampUnitInterval(
            context.leadingCorePotentialScore,
            segmentCorePotential
        );
        const exteriorEdgeDensity = clampUnitInterval(
            normalizeNumber(
                corePotential.exteriorEdgeDensity,
                normalizeNumber(segment.exteriorEdgeCount, 0) / Math.max(1, normalizeInteger(segment.cellCount, 0) * 2)
            ),
            0
        );
        const connectivitySupport = clampUnitInterval(
            corePotential.connectivitySupport,
            1 - clampUnitInterval(segment.barrierContactCellRatio, 0)
        );
        const edgeExposure = roundFieldValue(clampUnitInterval(
            (exteriorEdgeDensity * 0.7)
            + (getReliefTypeRatio(segment.reliefTypeMix, 'coast') * 0.18)
            + ((1 - clampUnitInterval(corePotential.interioritySupport, 1 - exteriorEdgeDensity)) * 0.12),
            0
        ));
        const connectivityFragility = roundFieldValue(clampUnitInterval(
            ((1 - connectivitySupport) * 0.72)
            + (clampUnitInterval(segment.barrierContactCellRatio, 0) * 0.28),
            0
        ));
        const coreDistance = roundFieldValue(clampUnitInterval(
            Math.max(0, leadingCorePotentialScore - segmentCorePotential),
            0
        ));
        const climateBurden = roundFieldValue(clampUnitInterval(
            (clampUnitInterval(segment.meanClimateStress, 0) * 0.52)
            + (clampUnitInterval(stressSummary.meanClimateStress, segment.meanClimateStress) * 0.2)
            + (clampUnitInterval(stressSummary.meanStormStress, 0) * 0.1)
            + (clampUnitInterval(stressSummary.meanCoastalDecayStress, 0) * 0.12)
            + (clampUnitInterval(stressSummary.meanSeasonalityStress, 0) * 0.06),
            0
        ));
        const continentHydrologyBurden = roundFieldValue(clampUnitInterval(
            1 - clampUnitInterval(passabilitySummary.meanHydrologySupport, hydrologySummary.hydrologySupport),
            0
        ));
        const hydrologyBurden = roundFieldValue(clampUnitInterval(
            (hydrologySummary.hydrologyBurden * 0.8)
            + (continentHydrologyBurden * 0.2),
            0
        ));
        const sizeFragility = roundFieldValue(clampUnitInterval(
            1 - Math.sqrt(clampUnitInterval(segment.continentCellRatio, 0)),
            0
        ));
        const fracturedPeripheryScore = roundFieldValue(clampUnitInterval(
            (edgeExposure * 0.24)
            + (connectivityFragility * 0.22)
            + (coreDistance * 0.17)
            + (climateBurden * 0.16)
            + (hydrologyBurden * 0.12)
            + (sizeFragility * 0.09),
            0
        ));

        return {
            summaryId: `fractured_periphery_${normalizeString(segment.regionalSegmentId, 'unknown')}`,
            regionalSegmentId: normalizeString(segment.regionalSegmentId, ''),
            continentId: normalizeString(segment.continentId, ''),
            continentBodyId: normalizeString(segment.continentBodyId, ''),
            segmentIndex: normalizeInteger(segment.segmentIndex, 0),
            cellCount: normalizeInteger(segment.cellCount, 0),
            continentCellRatio: roundFieldValue(clampUnitInterval(segment.continentCellRatio, 0)),
            meanInteriorPassability: roundFieldValue(clampUnitInterval(segment.meanInteriorPassability, 0)),
            meanClimateStress: roundFieldValue(clampUnitInterval(segment.meanClimateStress, 0)),
            dominantReliefType: normalizeString(segment.dominantReliefType, ''),
            corePotentialScore: roundFieldValue(segmentCorePotential),
            corePotentialClass: normalizeString(corePotential.corePotentialClass, ''),
            leadingCorePotentialScore: roundFieldValue(leadingCorePotentialScore),
            edgeExposure,
            connectivityFragility,
            climateBurden,
            hydrologyBurden,
            sizeFragility,
            coreDistance,
            exteriorEdgeDensity: roundFieldValue(exteriorEdgeDensity),
            barrierContactCellRatio: roundFieldValue(clampUnitInterval(segment.barrierContactCellRatio, 0)),
            coastReliefRatio: roundFieldValue(getReliefTypeRatio(segment.reliefTypeMix, 'coast')),
            meanFlowAccumulation: hydrologySummary.meanFlowAccumulation,
            riverCorridorCellRatio: hydrologySummary.riverCorridorCellRatio,
            waterFringeCellRatio: hydrologySummary.waterFringeCellRatio,
            watershedFragmentation: hydrologySummary.watershedFragmentation,
            continentMeanHydrologySupport: roundFieldValue(
                clampUnitInterval(passabilitySummary.meanHydrologySupport, hydrologySummary.hydrologySupport)
            ),
            stressRegime: normalizeString(stressSummary.stressRegime, ''),
            fracturedPeripheryScore,
            fracturedPeripheryClass: classifyFracturedPeriphery(fracturedPeripheryScore)
        };
    }

    function buildFracturedPeripheryContinentSummary(
        continentId = '',
        segmentPeripheries = [],
        continentBody = {},
        coreSummary = {}
    ) {
        const sortedPeripheries = segmentPeripheries.slice().sort((left, right) => {
            if (right.fracturedPeripheryScore !== left.fracturedPeripheryScore) {
                return right.fracturedPeripheryScore - left.fracturedPeripheryScore;
            }

            return left.regionalSegmentId.localeCompare(right.regionalSegmentId);
        });
        const sourceCellCount = Math.max(
            1,
            normalizeInteger(continentBody && continentBody.cellCount, 0)
                || sortedPeripheries.reduce((total, segment) => total + normalizeInteger(segment.cellCount, 0), 0)
        );
        const leadingSegment = sortedPeripheries[0] || null;
        const fracturedSegmentIds = sortedPeripheries
            .filter((segment) => segment.fracturedPeripheryClass === 'fractured')
            .map((segment) => segment.regionalSegmentId);
        const weaklyConnectedSegmentIds = sortedPeripheries
            .filter((segment) => (
                segment.fracturedPeripheryClass === 'fractured'
                || segment.fracturedPeripheryClass === 'weakly_connected'
            ))
            .map((segment) => segment.regionalSegmentId);
        const edgeExposedSegmentIds = sortedPeripheries
            .filter((segment) => (
                segment.fracturedPeripheryClass === 'fractured'
                || segment.fracturedPeripheryClass === 'weakly_connected'
                || segment.fracturedPeripheryClass === 'edge_exposed'
            ))
            .map((segment) => segment.regionalSegmentId);
        const peripheralCellCount = sortedPeripheries
            .filter((segment) => (
                segment.fracturedPeripheryClass === 'fractured'
                || segment.fracturedPeripheryClass === 'weakly_connected'
            ))
            .reduce((total, segment) => total + normalizeInteger(segment.cellCount, 0), 0);
        const meanFracturedPeriphery = sortedPeripheries.length
            ? sortedPeripheries.reduce((total, segment) => total + segment.fracturedPeripheryScore, 0) / sortedPeripheries.length
            : 0;

        return {
            summaryId: `fractured_periphery_continent_${continentId || 'unknown'}`,
            continentId,
            continentBodyId: normalizeString(continentBody && continentBody.continentBodyId, ''),
            segmentCount: sortedPeripheries.length,
            leadingFracturedPeripherySegmentId: leadingSegment ? leadingSegment.regionalSegmentId : '',
            leadingFracturedPeripheryScore: leadingSegment ? leadingSegment.fracturedPeripheryScore : 0,
            fracturedPeripherySegmentIds: fracturedSegmentIds,
            weaklyConnectedPeripheralSegmentIds: weaklyConnectedSegmentIds,
            edgeExposedSegmentIds: edgeExposedSegmentIds,
            fracturedPeripherySegmentCount: fracturedSegmentIds.length,
            weaklyConnectedPeripheralSegmentCount: weaklyConnectedSegmentIds.length,
            peripheralCellRatio: roundFieldValue(peripheralCellCount / sourceCellCount),
            meanFracturedPeriphery: roundFieldValue(meanFracturedPeriphery),
            leadingCorePotentialSegmentId: normalizeString(coreSummary && coreSummary.leadingCorePotentialSegmentId, ''),
            leadingCorePotentialScore: roundFieldValue(clampUnitInterval(coreSummary && coreSummary.leadingCorePotentialScore, 0)),
            valueMeaning: 'coarse physical peripheral-fragmentation summary only; no strategic region or route synthesis'
        };
    }

    function summarizeFieldValuesForCellIndices(field = {}, cellIndices = [], analyzedMaskValues = null, size = 0) {
        const normalizedCellIndices = normalizeCellIndexList(cellIndices, size);
        const analyzedIndices = normalizedCellIndices.filter((cellIndex) => (
            !analyzedMaskValues || readArrayMaskValue(analyzedMaskValues, cellIndex)
        ));
        const values = analyzedIndices.map((cellIndex) => readFieldValue(field, cellIndex, 0));

        return {
            analyzedCellCount: analyzedIndices.length,
            stats: buildFieldStats(values)
        };
    }

    function buildContinentalCohesionContinentSummary(continentBody = {}, context = {}) {
        const continentId = extractContinentId(continentBody);
        const sourceCellCount = Math.max(1, normalizeInteger(continentBody && continentBody.cellCount, 0));
        const cohesionStats = summarizeFieldValuesForCellIndices(
            context.continentalCohesionField,
            continentBody && continentBody.cellIndices,
            context.analyzedMaskValues,
            context.size
        );
        const passabilitySummary = context.passabilitySummaryLookup.get(continentId) || {};
        const segmentationSummary = context.segmentationSummaryLookup.get(continentId) || {};
        const coreSummary = context.coreSummaryLookup.get(continentId) || {};
        const peripherySummary = context.peripherySummaryLookup.get(continentId) || {};
        const meanContinentalCohesion = cohesionStats.stats.mean;

        return {
            summaryId: `continental_cohesion_${continentId || 'unknown'}`,
            continentId,
            continentBodyId: normalizeString(continentBody && continentBody.continentBodyId, ''),
            sourceCellCount,
            analyzedCellCount: cohesionStats.analyzedCellCount,
            analyzedCellRatio: roundFieldValue(cohesionStats.analyzedCellCount / sourceCellCount),
            meanContinentalCohesion,
            cohesionClass: classifyContinentalCohesion(meanContinentalCohesion),
            meanInteriorPassability: roundFieldValue(clampUnitInterval(passabilitySummary.meanInteriorPassability, 0)),
            passabilityClass: normalizeString(passabilitySummary.passabilityClass, ''),
            regionalSegmentCount: normalizeInteger(segmentationSummary.regionalSegmentCount, 0),
            segmentedCellRatio: roundFieldValue(
                normalizeInteger(segmentationSummary.segmentedCellCount, 0) / sourceCellCount
            ),
            leadingCorePotentialSegmentId: normalizeString(coreSummary.leadingCorePotentialSegmentId, ''),
            leadingCorePotentialScore: roundFieldValue(
                clampUnitInterval(coreSummary.leadingCorePotentialScore, 0)
            ),
            meanCorePotential: roundFieldValue(clampUnitInterval(coreSummary.meanCorePotential, 0)),
            leadingFracturedPeripherySegmentId: normalizeString(peripherySummary.leadingFracturedPeripherySegmentId, ''),
            leadingFracturedPeripheryScore: roundFieldValue(
                clampUnitInterval(peripherySummary.leadingFracturedPeripheryScore, 0)
            ),
            meanFracturedPeriphery: roundFieldValue(
                clampUnitInterval(peripherySummary.meanFracturedPeriphery, 0)
            ),
            peripheralCellRatio: roundFieldValue(clampUnitInterval(peripherySummary.peripheralCellRatio, 0)),
            weaklyConnectedPeripheralSegmentCount: normalizeInteger(
                peripherySummary.weaklyConnectedPeripheralSegmentCount,
                0
            ),
            fracturedPeripherySegmentCount: normalizeInteger(
                peripherySummary.fracturedPeripherySegmentCount,
                0
            ),
            dominantReliefType: normalizeString(passabilitySummary.dominantReliefType, ''),
            dominantBandType: normalizeString(coreSummary.dominantBandType, ''),
            stressRegime: normalizeString(coreSummary.stressRegime, normalizeString(peripherySummary.stressRegime, '')),
            valueMeaning: 'coarse physical continent cohesion summary only; no ContinentRecord mutation or downstream strategic synthesis'
        };
    }

    function createContinentPassabilityAccumulator(continentBody = {}) {
        return {
            continentId: extractContinentId(continentBody),
            continentBodyId: normalizeString(continentBody && continentBody.continentBodyId, ''),
            macroShape: normalizeString(
                continentBody && continentBody.macroShape,
                normalizeString(continentBody && continentBody.recordDraft && continentBody.recordDraft.macroShape, '')
            ),
            sourceCellCount: normalizeInteger(continentBody && continentBody.cellCount, 0),
            analyzedCellCount: 0,
            passabilityTotal: 0,
            climateStressTotal: 0,
            ruggednessPenaltyTotal: 0,
            hydrologySupportTotal: 0,
            riverCorridorCellCount: 0,
            waterFringeCellCount: 0,
            lowPassabilityCellCount: 0,
            highPassabilityCellCount: 0,
            reliefTypeCounts: {}
        };
    }

    function addPassabilityContribution(accumulator, contribution) {
        if (!accumulator || !contribution) {
            return;
        }

        accumulator.analyzedCellCount += 1;
        accumulator.passabilityTotal += contribution.passabilityScore;
        accumulator.climateStressTotal += contribution.climateStress;
        accumulator.ruggednessPenaltyTotal += contribution.ruggednessPenalty;
        accumulator.hydrologySupportTotal += contribution.hydrologySupport;
        accumulator.reliefTypeCounts[contribution.reliefType] = normalizeInteger(
            accumulator.reliefTypeCounts[contribution.reliefType],
            0
        ) + 1;
        if (contribution.majorRiverSupport > 0) {
            accumulator.riverCorridorCellCount += 1;
        }
        if (contribution.waterFringeSupport > 0) {
            accumulator.waterFringeCellCount += 1;
        }
        if (contribution.passabilityScore <= 0.32) {
            accumulator.lowPassabilityCellCount += 1;
        }
        if (contribution.passabilityScore >= 0.68) {
            accumulator.highPassabilityCellCount += 1;
        }
    }

    function finalizeContinentPassabilityAccumulator(accumulator) {
        const analyzedCellCount = Math.max(0, normalizeInteger(accumulator && accumulator.analyzedCellCount, 0));
        const reliefEntries = Object.entries(accumulator.reliefTypeCounts || {})
            .map(([reliefType, cellCount]) => ({
                reliefType,
                cellCount: normalizeInteger(cellCount, 0),
                cellRatio: roundFieldValue(cellCount / Math.max(1, analyzedCellCount))
            }))
            .sort((left, right) => {
                if (right.cellCount !== left.cellCount) {
                    return right.cellCount - left.cellCount;
                }

                return left.reliefType.localeCompare(right.reliefType);
            });
        const meanInteriorPassability = analyzedCellCount
            ? accumulator.passabilityTotal / analyzedCellCount
            : 0;

        return {
            summaryId: `interior_passability_${accumulator.continentId || accumulator.continentBodyId || 'unknown'}`,
            continentId: accumulator.continentId,
            continentBodyId: accumulator.continentBodyId,
            macroShape: accumulator.macroShape,
            sourceCellCount: accumulator.sourceCellCount,
            analyzedCellCount,
            analyzedCellRatio: roundFieldValue(analyzedCellCount / Math.max(1, accumulator.sourceCellCount || analyzedCellCount)),
            meanInteriorPassability: roundFieldValue(meanInteriorPassability),
            passabilityClass: classifyPassability(meanInteriorPassability),
            lowPassabilityCellRatio: roundFieldValue(accumulator.lowPassabilityCellCount / Math.max(1, analyzedCellCount)),
            highPassabilityCellRatio: roundFieldValue(accumulator.highPassabilityCellCount / Math.max(1, analyzedCellCount)),
            meanClimateStress: roundFieldValue(accumulator.climateStressTotal / Math.max(1, analyzedCellCount)),
            meanRuggednessPenalty: roundFieldValue(accumulator.ruggednessPenaltyTotal / Math.max(1, analyzedCellCount)),
            meanHydrologySupport: roundFieldValue(accumulator.hydrologySupportTotal / Math.max(1, analyzedCellCount)),
            riverCorridorCellRatio: roundFieldValue(accumulator.riverCorridorCellCount / Math.max(1, analyzedCellCount)),
            waterFringeCellRatio: roundFieldValue(accumulator.waterFringeCellCount / Math.max(1, analyzedCellCount)),
            dominantReliefType: reliefEntries.length ? reliefEntries[0].reliefType : '',
            reliefTypeMix: reliefEntries
        };
    }

    function scoreInteriorPassabilityCell(cellIndex, context = {}) {
        const relief = context.reliefCellLookup.get(cellIndex) || {};
        const reliefType = normalizeString(relief.reliefType, 'plain');
        const reliefBase = clampUnitInterval(RELIEF_PASSABILITY_BASE[reliefType], RELIEF_PASSABILITY_BASE.plain);
        const climateStress = readFieldValue(context.climateStressField, cellIndex, 0);
        const flowAccumulation = readFieldValue(context.flowAccumulationField, cellIndex, 0);
        const watershed = context.hydrologyLookups.watershedByCell.get(cellIndex);
        const majorRiverSupport = context.hydrologyLookups.riverLineCells.has(cellIndex) ? 1 : 0;
        const waterFringeSupport = context.hydrologyLookups.waterFringeCells.has(cellIndex) ? 1 : 0;
        const ruggedness = clampUnitInterval(relief.ruggedness, reliefType === 'mountain' ? 0.7 : 0.25);
        const elevation = clampUnitInterval(relief.elevation, reliefType === 'mountain' || reliefType === 'plateau' ? 0.65 : 0.45);
        const ruggednessPenalty = clampUnitInterval((ruggedness * 0.26) + (Math.max(0, elevation - 0.68) * 0.12));
        const climatePenalty = clampUnitInterval(climateStress * 0.28);
        const flowSupport = clampUnitInterval(flowAccumulation * 0.08);
        const riverSupport = majorRiverSupport * 0.12;
        const fringeSupport = waterFringeSupport * 0.04;
        const basinSupport = reliefType === 'basin' ? 0.05 : 0;
        const watershedScaleSupport = watershed
            ? Math.min(0.04, Math.sqrt(Math.max(0, watershed.cellCount)) / 260)
            : 0;
        const hydrologySupport = clampUnitInterval(
            flowSupport
                + riverSupport
                + fringeSupport
                + basinSupport
                + watershedScaleSupport
        );
        const passabilityScore = clampUnitInterval(
            reliefBase
                + hydrologySupport
                - ruggednessPenalty
                - climatePenalty
        );

        return {
            passabilityScore: roundFieldValue(passabilityScore),
            reliefType,
            climateStress,
            ruggednessPenalty,
            hydrologySupport,
            majorRiverSupport,
            waterFringeSupport
        };
    }

    function buildInteriorPassabilityAnalysis(input = {}, normalizedInput = {}, seedNamespace = '', seed = 0) {
        const continentBodiesOutput = findInputDependency(input, 'continentBodies', 'reliefElevation.outputs.intermediateOutputs');
        const reliefRegionExtraction = findInputDependency(input, 'reliefRegionExtraction', 'reliefElevation.outputs.intermediateOutputs');
        const reliefRegions = findInputDependency(input, 'reliefRegions', 'reliefElevation.outputs.records');
        const climateStressField = findInputDependency(input, 'climateStressField', 'climateEnvelope.outputs.fields');
        const climateStressRegionalSummaries = findInputDependency(input, 'climateStressRegionalSummaries', 'climateEnvelope.outputs.intermediateOutputs');
        const watershedSegmentation = findInputDependency(input, 'watershedSegmentation', 'hydrosphere.outputs.intermediateOutputs');
        const flowAccumulationField = findInputDependency(input, 'flowAccumulationField', 'riverSystem.outputs.fields');
        const majorRiverCandidates = findInputDependency(input, 'majorRiverCandidates', 'riverSystem.outputs.intermediateOutputs');
        const deltaLakeMarshTagging = findInputDependency(input, 'deltaLakeMarshTagging', 'riverSystem.outputs.intermediateOutputs');
        const continentBodies = Array.isArray(continentBodiesOutput && continentBodiesOutput.continentBodies)
            ? continentBodiesOutput.continentBodies
            : [];
        const worldBounds = resolveAnalysisWorldBounds(
            normalizedInput.worldBounds,
            continentBodiesOutput,
            reliefRegionExtraction,
            climateStressField,
            watershedSegmentation,
            flowAccumulationField
        );
        const size = Math.max(1, worldBounds.width * worldBounds.height);
        const values = new Array(size).fill(0);
        const analyzedMaskValues = new Array(size).fill(0);
        const continentCellLookup = buildContinentCellLookup(continentBodies, size);
        const reliefCellLookup = buildReliefCellLookup(reliefRegionExtraction, reliefRegions, size);
        const hydrologyLookups = buildHydrologyCellLookups(
            watershedSegmentation,
            majorRiverCandidates,
            deltaLakeMarshTagging,
            size
        );
        const continentAccumulators = new Map(continentBodies.map((continentBody) => [
            extractContinentId(continentBody),
            createContinentPassabilityAccumulator(continentBody)
        ]));
        const context = {
            climateStressField,
            flowAccumulationField,
            reliefCellLookup,
            hydrologyLookups
        };

        continentCellLookup.forEach(({ continentId, continentBody }, cellIndex) => {
            if (!continentAccumulators.has(continentId)) {
                continentAccumulators.set(continentId, createContinentPassabilityAccumulator(continentBody));
            }

            const contribution = scoreInteriorPassabilityCell(cellIndex, context);
            values[cellIndex] = contribution.passabilityScore;
            analyzedMaskValues[cellIndex] = 1;
            addPassabilityContribution(continentAccumulators.get(continentId), contribution);
        });

        const continentSummaries = Array.from(continentAccumulators.values())
            .map(finalizeContinentPassabilityAccumulator)
            .sort((left, right) => left.continentId.localeCompare(right.continentId));
        const analyzedCellCount = analyzedMaskValues.reduce((total, value) => total + (value > 0 ? 1 : 0), 0);
        const representedValues = values.filter((value, index) => analyzedMaskValues[index] > 0);
        const stats = buildFieldStats(representedValues);
        const sourceFieldIds = [
            normalizeString(climateStressField && climateStressField.fieldId, ''),
            normalizeString(flowAccumulationField && flowAccumulationField.fieldId, '')
        ].filter(Boolean);
        const sourceIntermediateOutputIds = [
            continentBodiesOutput ? normalizeString(continentBodiesOutput.continentBodySetId, 'continentBodies') : '',
            reliefRegionExtraction ? normalizeString(reliefRegionExtraction.reliefRegionSetId, 'reliefRegionExtraction') : '',
            climateStressRegionalSummaries ? normalizeString(climateStressRegionalSummaries.outputId, '') : '',
            watershedSegmentation ? normalizeString(watershedSegmentation.watershedSegmentationId, '') : '',
            majorRiverCandidates ? normalizeString(majorRiverCandidates.majorRiverCandidatesId, '') : '',
            deltaLakeMarshTagging ? normalizeString(deltaLakeMarshTagging.deltaLakeMarshTaggingId, '') : ''
        ].filter(Boolean);
        const field = {
            fieldId: INTERIOR_PASSABILITY_FIELD_ID,
            stageId: INTERIOR_PASSABILITY_STAGE_ID,
            fieldType: 'ScalarField',
            range: [0, 1],
            valueEncoding: 'rowMajorFloatArray',
            width: worldBounds.width,
            height: worldBounds.height,
            size,
            worldBounds: cloneValue(worldBounds),
            values,
            analyzedMaskValues,
            stats,
            seedNamespace,
            seed,
            sourceFieldIds,
            sourceIntermediateOutputIds,
            passabilityModel: INTERIOR_PASSABILITY_MODEL_ID,
            valueMeaning: '0=blocked or unanalyzed/non-continent cell, 1=coarse physically passable interior cell',
            compatibility: {
                futureBasinConnectivityInput: true,
                futureRidgeBarrierInput: true,
                futureRegionalSegmentationInput: true,
                routeGraphOutput: false,
                localTraversalRuntimeOutput: false,
                ContinentRecordMutation: false,
                gameplaySemanticsOutput: false,
                sameWorldBoundsRequired: true
            }
        };
        const analysis = {
            outputId: INTERIOR_PASSABILITY_OUTPUT_ID,
            stageId: INTERIOR_PASSABILITY_STAGE_ID,
            modelId: INTERIOR_PASSABILITY_MODEL_ID,
            deterministic: true,
            seedNamespace,
            seed,
            sourceFieldIds,
            sourceIntermediateOutputIds,
            worldBounds: cloneValue(worldBounds),
            interiorPassabilityFieldId: INTERIOR_PASSABILITY_FIELD_ID,
            continentSummaries,
            summary: {
                continentSummaryCount: continentSummaries.length,
                analyzedCellCount,
                analyzedCellRatio: roundFieldValue(analyzedCellCount / size),
                meanInteriorPassability: stats.mean,
                reliefRegionGeometryAvailable: Boolean(reliefRegionExtraction),
                climateStressFieldAvailable: Boolean(climateStressField),
                hydrologyContextAvailable: Boolean(watershedSegmentation || flowAccumulationField || majorRiverCandidates),
                routeGraphBuilt: false,
                localTraversalRuntimeUsed: false,
                valueMeaning: 'coarse physical interior passability only; no segmentation, core extraction, periphery analysis, or local traversal runtime'
            },
            compatibility: {
                coarseAnalysisOutput: true,
                physicalInputsOnly: true,
                futureSegmentationInput: true,
                futureCorePotentialInput: true,
                localTraversalRuntimeOutput: false,
                routeGraphOutput: false,
                historyFacingAnalysisOutput: false,
                gameplaySemanticsOutput: false
            },
            intentionallyAbsent: [
                'regionalSegmentation',
                'corePotential',
                'fracturedPeriphery',
                'routeGraph',
                'localTraversalRuntime',
                'ContinentRecordMutation',
                'MacroGeographyPackageAssembly',
                'historyFacingAnalysis',
                'gameplaySemantics'
            ]
        };

        return {
            field,
            analysis
        };
    }

    function buildRegionalBarrierMaskValues(interiorPassabilityField, reliefCellLookup, continentCellLookup, size = 0) {
        const barrierMaskValues = new Array(size).fill(0);
        let barrierCellCount = 0;

        continentCellLookup.forEach((entry, cellIndex) => {
            const analyzed = readArrayMaskValue(interiorPassabilityField.analyzedMaskValues, cellIndex);
            if (!analyzed) {
                return;
            }

            const relief = reliefCellLookup.get(cellIndex) || {};
            const reliefType = normalizeString(relief.reliefType, 'plain');
            const passabilityScore = readFieldValue(interiorPassabilityField, cellIndex, 0);
            const ruggedness = clampUnitInterval(relief.ruggedness, reliefType === 'mountain' ? 0.7 : 0.25);
            const isBarrier = classifyBarrier(reliefType, passabilityScore, ruggedness);
            barrierMaskValues[cellIndex] = isBarrier ? 1 : 0;
            if (isBarrier) {
                barrierCellCount += 1;
            }
        });

        return {
            barrierMaskValues,
            barrierCellCount
        };
    }

    function readArrayMaskValue(values, cellIndex) {
        if (!Array.isArray(values)) {
            return false;
        }

        const normalizedIndex = normalizeCellIndex(cellIndex, values.length);
        return normalizedIndex >= 0 && clampUnitInterval(values[normalizedIndex], 0) > 0;
    }

    function collectSegmentComponentsForContinent(continentBody, context = {}) {
        const continentId = extractContinentId(continentBody);
        const cells = normalizeCellIndexList(continentBody && continentBody.cellIndices, context.size);
        const candidateCellSet = new Set(cells.filter((cellIndex) => (
            readArrayMaskValue(context.interiorPassabilityField.analyzedMaskValues, cellIndex)
            && context.barrierMaskValues[cellIndex] !== 1
        )));
        const visited = new Set();
        const components = [];

        candidateCellSet.forEach((startCellIndex) => {
            if (visited.has(startCellIndex)) {
                return;
            }

            const stack = [startCellIndex];
            const componentCells = [];
            visited.add(startCellIndex);

            while (stack.length) {
                const currentCellIndex = stack.pop();
                componentCells.push(currentCellIndex);

                getNeighborCellIndices(currentCellIndex, context.width, context.height).forEach((neighborIndex) => {
                    if (
                        visited.has(neighborIndex)
                        || !candidateCellSet.has(neighborIndex)
                        || (context.continentCellLookup.get(neighborIndex) || {}).continentId !== continentId
                    ) {
                        return;
                    }

                    visited.add(neighborIndex);
                    stack.push(neighborIndex);
                });
            }

            components.push(componentCells.sort((left, right) => left - right));
        });

        return components.sort((left, right) => {
            if (right.length !== left.length) {
                return right.length - left.length;
            }

            return (left[0] || 0) - (right[0] || 0);
        });
    }

    function summarizeRegionalSegmentCells(cellIndices = [], context = {}) {
        const width = context.width;
        const height = context.height;
        const reliefTypeCounts = {};
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;
        let xSum = 0;
        let ySum = 0;
        let passabilityTotal = 0;
        let climateStressTotal = 0;
        let barrierEdgeCount = 0;
        let barrierContactCellCount = 0;
        let exteriorEdgeCount = 0;

        const cellSet = new Set(cellIndices);
        cellIndices.forEach((cellIndex) => {
            const point = pointFromIndex(cellIndex, width);
            const relief = context.reliefCellLookup.get(cellIndex) || {};
            const reliefType = normalizeString(relief.reliefType, 'plain');
            let touchesBarrier = false;

            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
            xSum += point.x;
            ySum += point.y;
            passabilityTotal += readFieldValue(context.interiorPassabilityField, cellIndex, 0);
            climateStressTotal += readFieldValue(context.climateStressField, cellIndex, 0);
            reliefTypeCounts[reliefType] = normalizeInteger(reliefTypeCounts[reliefType], 0) + 1;

            getNeighborCellIndices(cellIndex, width, height).forEach((neighborIndex) => {
                if (cellSet.has(neighborIndex)) {
                    return;
                }

                const neighborContinent = context.continentCellLookup.get(neighborIndex);
                if (!neighborContinent || neighborContinent.continentId !== context.continentId) {
                    exteriorEdgeCount += 1;
                    return;
                }

                if (context.barrierMaskValues[neighborIndex] === 1) {
                    barrierEdgeCount += 1;
                    touchesBarrier = true;
                }
            });

            if (touchesBarrier) {
                barrierContactCellCount += 1;
            }
        });

        const cellCount = cellIndices.length;
        const reliefTypeMix = Object.entries(reliefTypeCounts)
            .map(([reliefType, count]) => ({
                reliefType,
                cellCount: normalizeInteger(count, 0),
                cellRatio: roundFieldValue(count / Math.max(1, cellCount))
            }))
            .sort((left, right) => {
                if (right.cellCount !== left.cellCount) {
                    return right.cellCount - left.cellCount;
                }

                return left.reliefType.localeCompare(right.reliefType);
            });
        const centroidPoint = {
            x: Math.round(xSum / Math.max(1, cellCount)),
            y: Math.round(ySum / Math.max(1, cellCount))
        };
        const meanInteriorPassability = passabilityTotal / Math.max(1, cellCount);

        return {
            cellCount,
            boundingBox: {
                minX,
                minY,
                maxX,
                maxY,
                width: Math.max(0, (maxX - minX) + 1),
                height: Math.max(0, (maxY - minY) + 1)
            },
            centroidPoint,
            normalizedCentroid: {
                x: width > 1 ? roundFieldValue(centroidPoint.x / (width - 1)) : 0,
                y: height > 1 ? roundFieldValue(centroidPoint.y / (height - 1)) : 0
            },
            meanInteriorPassability: roundFieldValue(meanInteriorPassability),
            passabilityClass: classifyPassability(meanInteriorPassability),
            meanClimateStress: roundFieldValue(climateStressTotal / Math.max(1, cellCount)),
            barrierEdgeCount,
            barrierContactCellRatio: roundFieldValue(barrierContactCellCount / Math.max(1, cellCount)),
            exteriorEdgeCount,
            dominantReliefType: reliefTypeMix.length ? reliefTypeMix[0].reliefType : '',
            reliefTypeMix
        };
    }

    function buildRegionalSegmentsForContinent(continentBody, context = {}, segmentStartIndex = 0) {
        const continentId = extractContinentId(continentBody);
        const continentBodyId = normalizeString(continentBody && continentBody.continentBodyId, '');
        const continentCellCount = normalizeInteger(continentBody && continentBody.cellCount, 0);
        const minimumSegmentCellCount = Math.max(6, Math.round(Math.max(1, continentCellCount) * 0.025));
        const components = collectSegmentComponentsForContinent(continentBody, context);
        const largeComponents = components.filter((component) => component.length >= minimumSegmentCellCount);
        const selectedComponents = largeComponents.length
            ? largeComponents
            : components.slice(0, 1);
        const skippedSmallSegmentCellCount = components
            .filter((component) => !selectedComponents.includes(component))
            .reduce((total, component) => total + component.length, 0);

        const regionalSegments = selectedComponents.map((component, componentIndex) => {
            const segmentNumber = segmentStartIndex + componentIndex + 1;
            const regionalSegmentId = `regseg_${String(segmentNumber).padStart(3, '0')}`;
            const segmentSummary = summarizeRegionalSegmentCells(component, {
                ...context,
                continentId
            });

            return {
                regionalSegmentId,
                stageId: REGIONAL_SEGMENTATION_STAGE_ID,
                segmentType: 'continent_internal_block',
                continentId,
                continentBodyId,
                segmentIndex: componentIndex + 1,
                cellCount: segmentSummary.cellCount,
                cellIndices: component.slice(),
                normalizedArea: roundFieldValue(segmentSummary.cellCount / Math.max(1, context.size)),
                continentCellRatio: roundFieldValue(segmentSummary.cellCount / Math.max(1, continentCellCount || segmentSummary.cellCount)),
                boundingBox: segmentSummary.boundingBox,
                centroidPoint: segmentSummary.centroidPoint,
                normalizedCentroid: segmentSummary.normalizedCentroid,
                meanInteriorPassability: segmentSummary.meanInteriorPassability,
                passabilityClass: segmentSummary.passabilityClass,
                meanClimateStress: segmentSummary.meanClimateStress,
                barrierEdgeCount: segmentSummary.barrierEdgeCount,
                barrierContactCellRatio: segmentSummary.barrierContactCellRatio,
                exteriorEdgeCount: segmentSummary.exteriorEdgeCount,
                dominantReliefType: segmentSummary.dominantReliefType,
                reliefTypeMix: segmentSummary.reliefTypeMix,
                barrierSeparatedNeighborSegmentIds: []
            };
        });

        return {
            regionalSegments,
            summary: {
                continentId,
                continentBodyId,
                sourceCellCount: continentCellCount,
                minimumSegmentCellCount,
                candidateComponentCount: components.length,
                regionalSegmentCount: regionalSegments.length,
                skippedSmallSegmentCellCount,
                segmentedCellCount: regionalSegments.reduce((total, segment) => total + segment.cellCount, 0)
            }
        };
    }

    function attachBarrierSeparatedSegmentNeighbors(regionalSegments = [], segmentByCell = new Map(), barrierMaskValues = [], context = {}) {
        const segmentById = new Map(regionalSegments.map((segment) => [segment.regionalSegmentId, segment]));
        const neighborSets = new Map(regionalSegments.map((segment) => [segment.regionalSegmentId, new Set()]));

        barrierMaskValues.forEach((barrierValue, cellIndex) => {
            if (barrierValue !== 1 || !context.continentCellLookup.has(cellIndex)) {
                return;
            }

            const adjacentSegmentIds = new Set();
            getNeighborCellIndices(cellIndex, context.width, context.height).forEach((neighborIndex) => {
                const segmentId = segmentByCell.get(neighborIndex);
                if (segmentId) {
                    adjacentSegmentIds.add(segmentId);
                }
            });

            const sortedSegmentIds = Array.from(adjacentSegmentIds).sort();
            if (sortedSegmentIds.length < 2) {
                return;
            }

            sortedSegmentIds.forEach((segmentId) => {
                sortedSegmentIds.forEach((otherSegmentId) => {
                    if (segmentId !== otherSegmentId) {
                        neighborSets.get(segmentId).add(otherSegmentId);
                    }
                });
            });
        });

        neighborSets.forEach((neighborSet, segmentId) => {
            const segment = segmentById.get(segmentId);
            if (segment) {
                segment.barrierSeparatedNeighborSegmentIds = Array.from(neighborSet).sort();
            }
        });
    }

    function buildRegionalSegmentationAnalysis(input = {}, normalizedInput = {}, interiorPassability = {}, seedNamespace = '', seed = 0) {
        const interiorPassabilityField = interiorPassability.field || {};
        const worldBounds = normalizeWorldBounds(interiorPassabilityField.worldBounds || normalizedInput.worldBounds);
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const size = Math.max(1, width * height);
        const continentBodiesOutput = findInputDependency(input, 'continentBodies', 'reliefElevation.outputs.intermediateOutputs');
        const reliefRegionExtraction = findInputDependency(input, 'reliefRegionExtraction', 'reliefElevation.outputs.intermediateOutputs');
        const reliefRegions = findInputDependency(input, 'reliefRegions', 'reliefElevation.outputs.records');
        const climateStressField = findInputDependency(input, 'climateStressField', 'climateEnvelope.outputs.fields');
        const continentBodies = Array.isArray(continentBodiesOutput && continentBodiesOutput.continentBodies)
            ? continentBodiesOutput.continentBodies
            : [];
        const continentCellLookup = buildContinentCellLookup(continentBodies, size);
        const reliefCellLookup = buildReliefCellLookup(reliefRegionExtraction, reliefRegions, size);
        const barrierMask = buildRegionalBarrierMaskValues(
            interiorPassabilityField,
            reliefCellLookup,
            continentCellLookup,
            size
        );
        const context = {
            width,
            height,
            size,
            interiorPassabilityField,
            climateStressField,
            continentCellLookup,
            reliefCellLookup,
            barrierMaskValues: barrierMask.barrierMaskValues
        };
        const regionalSegments = [];
        const continentSummaries = [];

        continentBodies.forEach((continentBody) => {
            const result = buildRegionalSegmentsForContinent(continentBody, context, regionalSegments.length);
            regionalSegments.push(...result.regionalSegments);
            continentSummaries.push(result.summary);
        });

        const segmentByCell = new Map();
        const values = new Array(size).fill(0);
        regionalSegments.forEach((segment, segmentIndex) => {
            const encodedValue = roundFieldValue((segmentIndex + 1) / Math.max(1, regionalSegments.length));
            segment.cellIndices.forEach((cellIndex) => {
                values[cellIndex] = encodedValue;
                segmentByCell.set(cellIndex, segment.regionalSegmentId);
            });
        });
        attachBarrierSeparatedSegmentNeighbors(regionalSegments, segmentByCell, barrierMask.barrierMaskValues, context);

        const segmentedCellCount = regionalSegments.reduce((total, segment) => total + segment.cellCount, 0);
        const analyzedCellCount = Array.isArray(interiorPassabilityField.analyzedMaskValues)
            ? interiorPassabilityField.analyzedMaskValues.reduce((total, value) => total + (clampUnitInterval(value, 0) > 0 ? 1 : 0), 0)
            : 0;
        const field = {
            fieldId: REGIONAL_SEGMENT_MASK_FIELD_ID,
            stageId: REGIONAL_SEGMENTATION_STAGE_ID,
            fieldType: 'ScalarField',
            range: [0, 1],
            valueEncoding: 'rowMajorFloatArray',
            segmentEncoding: 'normalizedSegmentOrdinal',
            width,
            height,
            size,
            worldBounds: cloneValue(worldBounds),
            values,
            barrierMaskValues: barrierMask.barrierMaskValues.slice(),
            analyzedMaskValues: Array.isArray(interiorPassabilityField.analyzedMaskValues)
                ? interiorPassabilityField.analyzedMaskValues.slice()
                : new Array(size).fill(0),
            stats: buildFieldStats(values.filter((value) => value > 0)),
            seedNamespace,
            seed,
            sourceFieldIds: [
                normalizeString(interiorPassabilityField.fieldId, INTERIOR_PASSABILITY_FIELD_ID),
                normalizeString(climateStressField && climateStressField.fieldId, '')
            ].filter(Boolean),
            sourceIntermediateOutputIds: [
                interiorPassability.analysis ? normalizeString(interiorPassability.analysis.outputId, INTERIOR_PASSABILITY_OUTPUT_ID) : INTERIOR_PASSABILITY_OUTPUT_ID,
                continentBodiesOutput ? normalizeString(continentBodiesOutput.continentBodySetId, 'continentBodies') : '',
                reliefRegionExtraction ? normalizeString(reliefRegionExtraction.reliefRegionSetId, 'reliefRegionExtraction') : ''
            ].filter(Boolean),
            segmentationModel: REGIONAL_SEGMENTATION_MODEL_ID,
            valueMeaning: '0=unanalyzed, barrier, or non-selected small component; >0=coarse regional segment ordinal',
            compatibility: {
                futureBasinConnectivityInput: true,
                futureRidgeBarrierInput: true,
                futureCorePotentialInput: true,
                corePotentialOutput: false,
                peripheryClassificationOutput: false,
                localTraversalRuntimeOutput: false,
                routeGraphOutput: false,
                gameplaySemanticsOutput: false,
                sameWorldBoundsRequired: true
            }
        };
        const analysis = {
            outputId: REGIONAL_SEGMENTATION_OUTPUT_ID,
            stageId: REGIONAL_SEGMENTATION_STAGE_ID,
            modelId: REGIONAL_SEGMENTATION_MODEL_ID,
            deterministic: true,
            seedNamespace,
            seed,
            sourceFieldIds: field.sourceFieldIds.slice(),
            sourceIntermediateOutputIds: field.sourceIntermediateOutputIds.slice(),
            worldBounds: cloneValue(worldBounds),
            regionalSegmentMaskFieldId: REGIONAL_SEGMENT_MASK_FIELD_ID,
            regionalSegments,
            continentSummaries,
            summary: {
                regionalSegmentCount: regionalSegments.length,
                continentSummaryCount: continentSummaries.length,
                analyzedCellCount,
                segmentedCellCount,
                segmentedCellRatio: roundFieldValue(segmentedCellCount / Math.max(1, analyzedCellCount || segmentedCellCount)),
                barrierCellCount: barrierMask.barrierCellCount,
                barrierCellRatio: roundFieldValue(barrierMask.barrierCellCount / Math.max(1, analyzedCellCount || barrierMask.barrierCellCount)),
                segmentationModel: REGIONAL_SEGMENTATION_MODEL_ID,
                corePotentialComputed: false,
                peripheryClassified: false,
                routeGraphBuilt: false,
                localTraversalRuntimeUsed: false,
                valueMeaning: 'large continent-internal physical segments split by low passability and rugged relief barriers'
            },
            compatibility: {
                coarseAnalysisOutput: true,
                physicalInputsOnly: true,
                futureCorePotentialInput: true,
                futurePeripheryAnalysisInput: true,
                corePotentialOutput: false,
                peripheryClassificationOutput: false,
                routeGraphOutput: false,
                localTraversalRuntimeOutput: false,
                gameplaySemanticsOutput: false
            },
            intentionallyAbsent: [
                'corePotential',
                'peripheryClassification',
                'fracturedPeriphery',
                'routeGraph',
                'localTraversalRuntime',
                'ContinentRecordMutation',
                'MacroGeographyPackageAssembly',
                'historyFacingAnalysis',
                'gameplaySemantics'
            ]
        };

        return {
            field,
            analysis
        };
    }

    function buildCorePotentialAnalysis(input = {}, normalizedInput = {}, regionalSegmentation = {}, seedNamespace = '', seed = 0) {
        const regionalSegmentationField = regionalSegmentation.field || {};
        const regionalSegmentationAnalysis = regionalSegmentation.analysis || {};
        const worldBounds = normalizeWorldBounds(regionalSegmentationField.worldBounds || normalizedInput.worldBounds);
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const size = Math.max(1, width * height);
        const continentBodiesOutput = findInputDependency(input, 'continentBodies', 'reliefElevation.outputs.intermediateOutputs');
        const climateStressField = findInputDependency(input, 'climateStressField', 'climateEnvelope.outputs.fields');
        const regionalClimateSummaries = findInputDependency(input, 'regionalClimateSummaries', 'climateEnvelope.outputs.intermediateOutputs');
        const climateStressRegionalSummaries = findInputDependency(input, 'climateStressRegionalSummaries', 'climateEnvelope.outputs.intermediateOutputs');
        const continentBodies = Array.isArray(continentBodiesOutput && continentBodiesOutput.continentBodies)
            ? continentBodiesOutput.continentBodies
            : [];
        const continentBodyLookup = buildContinentBodyLookup(continentBodies);
        const continentClimateSummaryLookup = buildSummaryLookup(
            regionalClimateSummaries && regionalClimateSummaries.continentSummaries,
            'continentId'
        );
        const continentStressSummaryLookup = buildSummaryLookup(
            climateStressRegionalSummaries && climateStressRegionalSummaries.continentSummaries,
            'continentId'
        );
        const regionalSegments = Array.isArray(regionalSegmentationAnalysis.regionalSegments)
            ? regionalSegmentationAnalysis.regionalSegments
            : [];
        const segmentGroups = new Map();

        regionalSegments.forEach((segment) => {
            const continentId = normalizeString(segment && segment.continentId, '');
            if (!segmentGroups.has(continentId)) {
                segmentGroups.set(continentId, []);
            }
            segmentGroups.get(continentId).push(segment);
        });

        const values = new Array(size).fill(0);
        const segmentPotentials = [];

        segmentGroups.forEach((continentSegments, continentId) => {
            const continentBody = continentBodyLookup.get(continentId) || {};
            const climateSummary = continentClimateSummaryLookup.get(continentId) || {};
            const stressSummary = continentStressSummaryLookup.get(continentId) || {};

            continentSegments.forEach((segment) => {
                const segmentPotential = buildSegmentCorePotentialSummary(segment, {
                    continentBody,
                    continentClimateSummary: climateSummary,
                    continentStressSummary: stressSummary,
                    continentSegmentCount: continentSegments.length
                });
                segmentPotentials.push(segmentPotential);
                normalizeCellIndexList(segment && segment.cellIndices, size).forEach((cellIndex) => {
                    values[cellIndex] = segmentPotential.corePotentialScore;
                });
            });
        });

        const sortedSegmentPotentials = segmentPotentials.sort((left, right) => {
            if (left.continentId !== right.continentId) {
                return left.continentId.localeCompare(right.continentId);
            }
            if (right.corePotentialScore !== left.corePotentialScore) {
                return right.corePotentialScore - left.corePotentialScore;
            }
            return left.regionalSegmentId.localeCompare(right.regionalSegmentId);
        });
        const continentSummaries = Array.from(segmentGroups.entries())
            .map(([continentId]) => buildCorePotentialContinentSummary(
                continentId,
                sortedSegmentPotentials.filter((segment) => segment.continentId === continentId),
                continentBodyLookup.get(continentId) || {},
                continentClimateSummaryLookup.get(continentId) || {},
                continentStressSummaryLookup.get(continentId) || {}
            ))
            .sort((left, right) => left.continentId.localeCompare(right.continentId));
        const strongCorePotentialSegmentCount = sortedSegmentPotentials
            .filter((segment) => segment.corePotentialClass === 'strong')
            .length;
        const moderateOrBetterSegmentCount = sortedSegmentPotentials
            .filter((segment) => (
                segment.corePotentialClass === 'strong'
                || segment.corePotentialClass === 'moderate'
            ))
            .length;

        const field = {
            fieldId: CORE_POTENTIAL_FIELD_ID,
            stageId: CORE_POTENTIAL_STAGE_ID,
            fieldType: 'ScalarField',
            range: [0, 1],
            valueEncoding: 'rowMajorFloatArray',
            width,
            height,
            size,
            worldBounds: cloneValue(worldBounds),
            values,
            analyzedMaskValues: Array.isArray(regionalSegmentationField.analyzedMaskValues)
                ? regionalSegmentationField.analyzedMaskValues.slice()
                : new Array(size).fill(0),
            stats: buildFieldStats(values.filter((value) => value > 0)),
            seedNamespace,
            seed,
            sourceFieldIds: [
                normalizeString(regionalSegmentationField.fieldId, REGIONAL_SEGMENT_MASK_FIELD_ID),
                normalizeString(climateStressField && climateStressField.fieldId, '')
            ].filter(Boolean),
            sourceIntermediateOutputIds: [
                normalizeString(regionalSegmentationAnalysis.outputId, REGIONAL_SEGMENTATION_OUTPUT_ID),
                normalizeString(regionalClimateSummaries && regionalClimateSummaries.outputId, ''),
                normalizeString(climateStressRegionalSummaries && climateStressRegionalSummaries.outputId, '')
            ].filter(Boolean),
            corePotentialModel: CORE_POTENTIAL_MODEL_ID,
            valueMeaning: '0=unanalyzed or non-segmented cells, 1=strongest coarse physical core-potential within analyzed continental blocks',
            compatibility: {
                futureStateScalePotentialInput: true,
                futurePeripheryAnalysisInput: true,
                continentCoreDetectionOutput: false,
                peripheryClassificationOutput: false,
                routeGraphOutput: false,
                localTraversalRuntimeOutput: false,
                ContinentRecordMutation: false,
                gameplaySemanticsOutput: false,
                sameWorldBoundsRequired: true
            }
        };
        const analysis = {
            outputId: CORE_POTENTIAL_OUTPUT_ID,
            stageId: CORE_POTENTIAL_STAGE_ID,
            modelId: CORE_POTENTIAL_MODEL_ID,
            deterministic: true,
            seedNamespace,
            seed,
            sourceFieldIds: field.sourceFieldIds.slice(),
            sourceIntermediateOutputIds: field.sourceIntermediateOutputIds.slice(),
            worldBounds: cloneValue(worldBounds),
            corePotentialFieldId: CORE_POTENTIAL_FIELD_ID,
            segmentPotentials: sortedSegmentPotentials,
            continentSummaries,
            summary: {
                segmentPotentialCount: sortedSegmentPotentials.length,
                continentSummaryCount: continentSummaries.length,
                strongCorePotentialSegmentCount,
                moderateOrBetterSegmentCount,
                climateSummaryAvailable: Boolean(regionalClimateSummaries),
                climateStressSummaryAvailable: Boolean(climateStressRegionalSummaries),
                coastContextAvailable: continentBodies.length > 0,
                fracturedPeripheryClassified: false,
                continentCoreDetected: false,
                valueMeaning: 'coarse physical core potential only; no political interpretation, core detection, or periphery classification'
            },
            compatibility: {
                coarseAnalysisOutput: true,
                physicalInputsOnly: true,
                futureStateScalePotentialInput: true,
                futurePeripheryAnalysisInput: true,
                continentCoreDetectionOutput: false,
                peripheryClassificationOutput: false,
                routeGraphOutput: false,
                localTraversalRuntimeOutput: false,
                gameplaySemanticsOutput: false
            },
            intentionallyAbsent: [
                'continentCoreDetection',
                'peripheryClassification',
                'fracturedPeriphery',
                'routeGraph',
                'localTraversalRuntime',
                'ContinentRecordMutation',
                'MacroGeographyPackageAssembly',
                'historyFacingAnalysis',
                'gameplaySemantics'
            ]
        };

        return {
            field,
            analysis
        };
    }

    function buildFracturedPeripheryAnalysis(
        input = {},
        normalizedInput = {},
        regionalSegmentation = {},
        corePotential = {},
        interiorPassability = {},
        seedNamespace = '',
        seed = 0
    ) {
        const regionalSegmentationField = regionalSegmentation.field || {};
        const regionalSegmentationAnalysis = regionalSegmentation.analysis || {};
        const corePotentialField = corePotential.field || {};
        const corePotentialAnalysis = corePotential.analysis || {};
        const interiorPassabilityAnalysis = interiorPassability.analysis || {};
        const worldBounds = normalizeWorldBounds(regionalSegmentationField.worldBounds || normalizedInput.worldBounds);
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const size = Math.max(1, width * height);
        const continentBodiesOutput = findInputDependency(input, 'continentBodies', 'reliefElevation.outputs.intermediateOutputs');
        const climateStressField = findInputDependency(input, 'climateStressField', 'climateEnvelope.outputs.fields');
        const climateStressRegionalSummaries = findInputDependency(input, 'climateStressRegionalSummaries', 'climateEnvelope.outputs.intermediateOutputs');
        const watershedSegmentation = findInputDependency(input, 'watershedSegmentation', 'hydrosphere.outputs.intermediateOutputs');
        const flowAccumulationField = findInputDependency(input, 'flowAccumulationField', 'riverSystem.outputs.fields');
        const majorRiverCandidates = findInputDependency(input, 'majorRiverCandidates', 'riverSystem.outputs.intermediateOutputs');
        const deltaLakeMarshTagging = findInputDependency(input, 'deltaLakeMarshTagging', 'riverSystem.outputs.intermediateOutputs');
        const continentBodies = Array.isArray(continentBodiesOutput && continentBodiesOutput.continentBodies)
            ? continentBodiesOutput.continentBodies
            : [];
        const continentBodyLookup = buildContinentBodyLookup(continentBodies);
        const continentStressSummaryLookup = buildSummaryLookup(
            climateStressRegionalSummaries && climateStressRegionalSummaries.continentSummaries,
            'continentId'
        );
        const continentPassabilitySummaryLookup = buildSummaryLookup(
            interiorPassabilityAnalysis && interiorPassabilityAnalysis.continentSummaries,
            'continentId'
        );
        const corePotentialSegmentLookup = buildSummaryLookup(
            corePotentialAnalysis && corePotentialAnalysis.segmentPotentials,
            'regionalSegmentId'
        );
        const corePotentialContinentSummaryLookup = buildSummaryLookup(
            corePotentialAnalysis && corePotentialAnalysis.continentSummaries,
            'continentId'
        );
        const hydrologyLookups = buildHydrologyCellLookups(
            watershedSegmentation,
            majorRiverCandidates,
            deltaLakeMarshTagging,
            size
        );
        const regionalSegments = Array.isArray(regionalSegmentationAnalysis.regionalSegments)
            ? regionalSegmentationAnalysis.regionalSegments
            : [];
        const values = new Array(size).fill(0);
        const segmentPeripheries = regionalSegments.map((segment) => {
            const continentId = normalizeString(segment && segment.continentId, '');
            return buildSegmentFracturedPeripherySummary(segment, {
                size,
                flowAccumulationField,
                hydrologyLookups,
                corePotential: corePotentialSegmentLookup.get(normalizeString(segment && segment.regionalSegmentId, '')) || {},
                continentStressSummary: continentStressSummaryLookup.get(continentId) || {},
                continentPassabilitySummary: continentPassabilitySummaryLookup.get(continentId) || {},
                leadingCorePotentialScore: clampUnitInterval(
                    corePotentialContinentSummaryLookup.get(continentId) && corePotentialContinentSummaryLookup.get(continentId).leadingCorePotentialScore,
                    0
                )
            });
        });
        const segmentGroups = new Map();

        segmentPeripheries.forEach((segmentPeriphery) => {
            if (!segmentGroups.has(segmentPeriphery.continentId)) {
                segmentGroups.set(segmentPeriphery.continentId, []);
            }
            segmentGroups.get(segmentPeriphery.continentId).push(segmentPeriphery);
        });

        segmentPeripheries.forEach((segmentPeriphery) => {
            const sourceSegment = regionalSegments.find((segment) => (
                normalizeString(segment && segment.regionalSegmentId, '') === segmentPeriphery.regionalSegmentId
            ));
            normalizeCellIndexList(sourceSegment && sourceSegment.cellIndices, size).forEach((cellIndex) => {
                values[cellIndex] = segmentPeriphery.fracturedPeripheryScore;
            });
        });

        const sortedSegmentPeripheries = segmentPeripheries.sort((left, right) => {
            if (left.continentId !== right.continentId) {
                return left.continentId.localeCompare(right.continentId);
            }
            if (right.fracturedPeripheryScore !== left.fracturedPeripheryScore) {
                return right.fracturedPeripheryScore - left.fracturedPeripheryScore;
            }
            return left.regionalSegmentId.localeCompare(right.regionalSegmentId);
        });
        const continentSummaries = Array.from(segmentGroups.entries())
            .map(([continentId, groupedSegments]) => buildFracturedPeripheryContinentSummary(
                continentId,
                groupedSegments,
                continentBodyLookup.get(continentId) || {},
                corePotentialContinentSummaryLookup.get(continentId) || {}
            ))
            .sort((left, right) => left.continentId.localeCompare(right.continentId));
        const fracturedSegmentCount = sortedSegmentPeripheries
            .filter((segment) => segment.fracturedPeripheryClass === 'fractured')
            .length;
        const weaklyConnectedSegmentCount = sortedSegmentPeripheries
            .filter((segment) => segment.fracturedPeripheryClass === 'weakly_connected')
            .length;
        const peripheralSegmentCount = sortedSegmentPeripheries
            .filter((segment) => (
                segment.fracturedPeripheryClass === 'fractured'
                || segment.fracturedPeripheryClass === 'weakly_connected'
            ))
            .length;

        const field = {
            fieldId: FRACTURED_PERIPHERY_FIELD_ID,
            stageId: FRACTURED_PERIPHERY_STAGE_ID,
            fieldType: 'ScalarField',
            range: [0, 1],
            valueEncoding: 'rowMajorFloatArray',
            width,
            height,
            size,
            worldBounds: cloneValue(worldBounds),
            values,
            analyzedMaskValues: Array.isArray(regionalSegmentationField.analyzedMaskValues)
                ? regionalSegmentationField.analyzedMaskValues.slice()
                : new Array(size).fill(0),
            stats: buildFieldStats(values.filter((value) => value > 0)),
            seedNamespace,
            seed,
            sourceFieldIds: [
                normalizeString(corePotentialField.fieldId, CORE_POTENTIAL_FIELD_ID),
                normalizeString(climateStressField && climateStressField.fieldId, ''),
                normalizeString(flowAccumulationField && flowAccumulationField.fieldId, '')
            ].filter(Boolean),
            sourceIntermediateOutputIds: [
                normalizeString(regionalSegmentationAnalysis.outputId, REGIONAL_SEGMENTATION_OUTPUT_ID),
                normalizeString(corePotentialAnalysis.outputId, CORE_POTENTIAL_OUTPUT_ID),
                normalizeString(climateStressRegionalSummaries && climateStressRegionalSummaries.outputId, ''),
                normalizeString(majorRiverCandidates && majorRiverCandidates.majorRiverCandidatesId, ''),
                normalizeString(deltaLakeMarshTagging && deltaLakeMarshTagging.deltaLakeMarshTaggingId, '')
            ].filter(Boolean),
            fracturedPeripheryModel: FRACTURED_PERIPHERY_MODEL_ID,
            valueMeaning: '0=unanalyzed or non-segmented cells, 1=strongest coarse fractured-periphery signal within analyzed continental blocks',
            compatibility: {
                futureStrategicSynthesisInput: true,
                peripheryClassificationOutput: false,
                fracturedPeripheryOutput: true,
                routeGraphOutput: false,
                localTraversalRuntimeOutput: false,
                ContinentRecordMutation: false,
                gameplaySemanticsOutput: false,
                sameWorldBoundsRequired: true
            }
        };
        const analysis = {
            outputId: FRACTURED_PERIPHERY_OUTPUT_ID,
            stageId: FRACTURED_PERIPHERY_STAGE_ID,
            modelId: FRACTURED_PERIPHERY_MODEL_ID,
            deterministic: true,
            seedNamespace,
            seed,
            sourceFieldIds: field.sourceFieldIds.slice(),
            sourceIntermediateOutputIds: field.sourceIntermediateOutputIds.slice(),
            worldBounds: cloneValue(worldBounds),
            fracturedPeripheryFieldId: FRACTURED_PERIPHERY_FIELD_ID,
            segmentPeripheries: sortedSegmentPeripheries,
            continentSummaries,
            summary: {
                segmentPeripheryCount: sortedSegmentPeripheries.length,
                continentSummaryCount: continentSummaries.length,
                fracturedSegmentCount,
                weaklyConnectedSegmentCount,
                peripheralSegmentCount,
                climateStressSummaryAvailable: Boolean(climateStressRegionalSummaries),
                hydrologyContextAvailable: Boolean(watershedSegmentation || flowAccumulationField || majorRiverCandidates || deltaLakeMarshTagging),
                strategicRegionsSynthesized: false,
                routeGraphBuilt: false,
                localTraversalRuntimeUsed: false,
                valueMeaning: 'coarse fractured-periphery analysis only; weakly connected continental outskirts without strategic synthesis or routing'
            },
            compatibility: {
                coarseAnalysisOutput: true,
                physicalInputsOnly: true,
                futureStrategicSynthesisInput: true,
                peripheryClassificationOutput: false,
                fracturedPeripheryOutput: true,
                routeGraphOutput: false,
                localTraversalRuntimeOutput: false,
                gameplaySemanticsOutput: false
            },
            intentionallyAbsent: [
                'peripheryClassification',
                'strategicRegions',
                'routeGraph',
                'localTraversalRuntime',
                'ContinentRecordMutation',
                'MacroGeographyPackageAssembly',
                'historyFacingAnalysis',
                'gameplaySemantics'
            ]
        };

        return {
            field,
            analysis
        };
    }

    function buildContinentalCohesionComposite(
        input = {},
        normalizedInput = {},
        interiorPassability = {},
        regionalSegmentation = {},
        corePotential = {},
        fracturedPeriphery = {},
        seedNamespace = '',
        seed = 0
    ) {
        const interiorPassabilityField = interiorPassability.field || {};
        const regionalSegmentationField = regionalSegmentation.field || {};
        const corePotentialField = corePotential.field || {};
        const fracturedPeripheryField = fracturedPeriphery.field || {};
        const interiorPassabilityAnalysis = interiorPassability.analysis || {};
        const regionalSegmentationAnalysis = regionalSegmentation.analysis || {};
        const corePotentialAnalysis = corePotential.analysis || {};
        const fracturedPeripheryAnalysis = fracturedPeriphery.analysis || {};
        const worldBounds = normalizeWorldBounds(
            interiorPassabilityField.worldBounds
            || regionalSegmentationField.worldBounds
            || corePotentialField.worldBounds
            || normalizedInput.worldBounds
        );
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        const size = Math.max(1, width * height);
        const continentBodiesOutput = findInputDependency(input, 'continentBodies', 'reliefElevation.outputs.intermediateOutputs');
        const continentBodies = Array.isArray(continentBodiesOutput && continentBodiesOutput.continentBodies)
            ? continentBodiesOutput.continentBodies
            : [];
        const analyzedMaskValues = Array.isArray(interiorPassabilityField.analyzedMaskValues)
            ? interiorPassabilityField.analyzedMaskValues.slice()
            : new Array(size).fill(0);
        const barrierMaskValues = Array.isArray(regionalSegmentationField.barrierMaskValues)
            ? regionalSegmentationField.barrierMaskValues
            : new Array(size).fill(0);
        const values = new Array(size).fill(0);

        analyzedMaskValues.forEach((analyzedValue, cellIndex) => {
            if (clampUnitInterval(analyzedValue, 0) <= 0) {
                return;
            }

            const interiorScore = readFieldValue(interiorPassabilityField, cellIndex, 0);
            const segmentMembership = readFieldValue(regionalSegmentationField, cellIndex, 0) > 0 ? 1 : 0;
            const coreScore = readFieldValue(corePotentialField, cellIndex, 0);
            const peripheryScore = readFieldValue(fracturedPeripheryField, cellIndex, 0);
            const barrierPenalty = readArrayMaskValue(barrierMaskValues, cellIndex) ? 0.22 : 0;
            const segmentStructureSupport = segmentMembership ? 1 : (barrierPenalty > 0 ? 0 : 0.28);
            const cohesionScore = clampUnitInterval(
                (interiorScore * 0.42)
                + (coreScore * 0.31)
                + ((1 - peripheryScore) * 0.19)
                + (segmentStructureSupport * 0.08)
                - barrierPenalty,
                0
            );

            values[cellIndex] = roundFieldValue(cohesionScore);
        });

        const passabilitySummaryLookup = buildSummaryLookup(
            interiorPassabilityAnalysis.continentSummaries,
            'continentId'
        );
        const segmentationSummaryLookup = buildSummaryLookup(
            regionalSegmentationAnalysis.continentSummaries,
            'continentId'
        );
        const coreSummaryLookup = buildSummaryLookup(
            corePotentialAnalysis.continentSummaries,
            'continentId'
        );
        const peripherySummaryLookup = buildSummaryLookup(
            fracturedPeripheryAnalysis.continentSummaries,
            'continentId'
        );
        const field = {
            fieldId: CONTINENTAL_COHESION_FIELD_ID,
            stageId: PIPELINE_STEP_ID,
            fieldType: 'ScalarField',
            range: [0, 1],
            valueEncoding: 'rowMajorFloatArray',
            width,
            height,
            size,
            worldBounds: cloneValue(worldBounds),
            values,
            analyzedMaskValues,
            stats: buildFieldStats(values.filter((value, index) => analyzedMaskValues[index] > 0)),
            seedNamespace,
            seed,
            sourceFieldIds: [
                normalizeString(interiorPassabilityField.fieldId, INTERIOR_PASSABILITY_FIELD_ID),
                normalizeString(regionalSegmentationField.fieldId, REGIONAL_SEGMENT_MASK_FIELD_ID),
                normalizeString(corePotentialField.fieldId, CORE_POTENTIAL_FIELD_ID),
                normalizeString(fracturedPeripheryField.fieldId, FRACTURED_PERIPHERY_FIELD_ID)
            ].filter(Boolean),
            sourceIntermediateOutputIds: [
                normalizeString(interiorPassabilityAnalysis.outputId, INTERIOR_PASSABILITY_OUTPUT_ID),
                normalizeString(regionalSegmentationAnalysis.outputId, REGIONAL_SEGMENTATION_OUTPUT_ID),
                normalizeString(corePotentialAnalysis.outputId, CORE_POTENTIAL_OUTPUT_ID),
                normalizeString(fracturedPeripheryAnalysis.outputId, FRACTURED_PERIPHERY_OUTPUT_ID),
                normalizeString(continentBodiesOutput && continentBodiesOutput.continentBodySetId, 'continentBodies')
            ].filter(Boolean),
            cohesionModel: CONTINENTAL_COHESION_MODEL_ID,
            valueMeaning: '0=unanalyzed or weakest coarse cohesion, 1=strongest coarse continental cohesion across analyzed cells',
            compatibility: {
                futureStrategicSynthesisInput: true,
                futureContinentSummaryInput: true,
                strategicRegionsOutput: false,
                routeGraphOutput: false,
                localTraversalRuntimeOutput: false,
                ContinentRecordMutation: false,
                gameplaySemanticsOutput: false,
                sameWorldBoundsRequired: true
            }
        };
        const continentSummaries = continentBodies
            .map((continentBody) => buildContinentalCohesionContinentSummary(continentBody, {
                continentalCohesionField: field,
                analyzedMaskValues,
                size,
                passabilitySummaryLookup,
                segmentationSummaryLookup,
                coreSummaryLookup,
                peripherySummaryLookup
            }))
            .sort((left, right) => left.continentId.localeCompare(right.continentId));
        const cohesiveContinentCount = continentSummaries
            .filter((summary) => summary.cohesionClass === 'cohesive')
            .length;
        const fragileContinentCount = continentSummaries
            .filter((summary) => summary.cohesionClass === 'fragile')
            .length;
        const summaries = {
            outputId: CONTINENTAL_COHESION_SUMMARIES_ID,
            stageId: PIPELINE_STEP_ID,
            modelId: CONTINENTAL_COHESION_MODEL_ID,
            deterministic: true,
            seedNamespace,
            seed,
            sourceFieldIds: field.sourceFieldIds.slice(),
            sourceIntermediateOutputIds: field.sourceIntermediateOutputIds.slice(),
            worldBounds: cloneValue(worldBounds),
            continentalCohesionFieldId: CONTINENTAL_COHESION_FIELD_ID,
            continentSummaries,
            summary: {
                continentSummaryCount: continentSummaries.length,
                analyzedCellCount: analyzedMaskValues.reduce((total, value) => total + (clampUnitInterval(value, 0) > 0 ? 1 : 0), 0),
                meanContinentalCohesion: field.stats.mean,
                cohesiveContinentCount,
                fragileContinentCount,
                downstreamStrategicSynthesisBuilt: false,
                valueMeaning: 'unified physical continent cohesion summaries only; no strategic synthesis or record mutation'
            },
            compatibility: {
                coarseAnalysisOutput: true,
                physicalInputsOnly: true,
                futureStrategicSynthesisInput: true,
                strategicRegionsOutput: false,
                routeGraphOutput: false,
                localTraversalRuntimeOutput: false,
                gameplaySemanticsOutput: false
            },
            intentionallyAbsent: [
                'strategicRegions',
                'routeGraph',
                'localTraversalRuntime',
                'ContinentRecordMutation',
                'MacroGeographyPackageAssembly',
                'historyFacingAnalysis',
                'gameplaySemantics'
            ]
        };

        return {
            field,
            summaries
        };
    }

    function createSourceSummary(input = {}) {
        const continentBodies = findInputDependency(input, 'continentBodies', 'reliefElevation.outputs.intermediateOutputs');
        const reliefRegionExtraction = findInputDependency(input, 'reliefRegionExtraction', 'reliefElevation.outputs.intermediateOutputs');
        const reliefRegions = findInputDependency(input, 'reliefRegions', 'reliefElevation.outputs.records');
        const climateStressField = findInputDependency(input, 'climateStressField', 'climateEnvelope.outputs.fields');
        const climateStressRegionalSummaries = findInputDependency(input, 'climateStressRegionalSummaries', 'climateEnvelope.outputs.intermediateOutputs');
        const regionalClimateSummaries = findInputDependency(input, 'regionalClimateSummaries', 'climateEnvelope.outputs.intermediateOutputs');
        const watershedSegmentation = findInputDependency(input, 'watershedSegmentation', 'hydrosphere.outputs.intermediateOutputs');
        const downhillFlowRouting = findInputDependency(input, 'downhillFlowRouting', 'riverSystem.outputs.intermediateOutputs');
        const flowAccumulationField = findInputDependency(input, 'flowAccumulationField', 'riverSystem.outputs.fields');
        const majorRiverCandidates = findInputDependency(input, 'majorRiverCandidates', 'riverSystem.outputs.intermediateOutputs');
        const deltaLakeMarshTagging = findInputDependency(input, 'deltaLakeMarshTagging', 'riverSystem.outputs.intermediateOutputs');
        const riverBasins = findInputDependency(input, 'riverBasins', 'riverSystem.outputs.records');

        return {
            continentBodies: {
                outputId: normalizeString(continentBodies && continentBodies.outputId, 'continentBodies'),
                continentBodyCount: countRecords(continentBodies, 'continentBodies')
            },
            relief: {
                reliefRegionExtractionId: normalizeString(reliefRegionExtraction && reliefRegionExtraction.outputId, 'reliefRegionExtraction'),
                reliefRegionBodyCount: countRecords(reliefRegionExtraction, 'reliefRegionBodies'),
                reliefRegionRecordCount: countRecords(reliefRegions, 'reliefRegions')
            },
            climateStress: {
                climateStressFieldId: normalizeString(climateStressField && climateStressField.fieldId, 'climateStressField'),
                stressRegionSummaryCount: countRecords(climateStressRegionalSummaries, 'regionSummaries'),
                stressContinentSummaryCount: countRecords(climateStressRegionalSummaries, 'continentSummaries'),
                regionalClimateSummaryCount: countRecords(regionalClimateSummaries, 'continentSummaries')
            },
            hydrology: {
                watershedCount: countRecords(watershedSegmentation, 'watersheds'),
                downhillRoutingAvailable: Boolean(downhillFlowRouting),
                flowAccumulationFieldId: normalizeString(flowAccumulationField && flowAccumulationField.fieldId, ''),
                majorRiverCandidateCount: countRecords(majorRiverCandidates, 'majorRiverCandidates'),
                deltaLakeMarshTagCount: countRecords(deltaLakeMarshTagging, 'featureTags'),
                riverBasinRecordCount: countRecords(riverBasins, 'riverBasins')
            },
            continentalCohesion: {
                implementedMetricCount: IMPLEMENTED_METRICS.length,
                implementedMetrics: IMPLEMENTED_METRICS.slice(),
                plannedMetrics: PLANNED_METRICS.slice()
            }
        };
    }

    function getContinentalCohesionAnalyzerDescriptor() {
        return {
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            status: STATUS,
            scaffold: false,
            stub: false,
            deterministic: true,
            metricsImplemented: true,
            implementedMetrics: IMPLEMENTED_METRICS.slice(),
            file: 'js/worldgen/macro/continental-cohesion-analyzer.js',
            entry: 'analyzeContinentalCohesion',
            description: 'Partial ContinentalCohesionAnalyzer. It computes coarse interior passability, regional segmentation, physical core-potential analysis, fractured-periphery analysis, and unified continent-cohesion summaries from continent-body, relief, climate-stress, and hydrology inputs without core detection, generic periphery classification, route graphs, record mutation, or gameplay semantics.'
        };
    }

    function getContinentalCohesionInputContract() {
        return {
            contractId: 'continentalCohesionInput',
            pipelineStep: PIPELINE_STEP_ID,
            moduleId: MODULE_ID,
            requiredKeys: REQUIRED_KEYS.slice(),
            optionalKeys: OPTIONAL_KEYS.slice(),
            inputGroups: cloneValue(INPUT_GROUPS),
            description: 'Input contract for the ContinentalCohesionAnalyzer scaffold. It consumes continent bodies, relief-region geometry/records, climate-stress outputs, and hydrology context only as explicit future analysis inputs.'
        };
    }

    function getContinentalCohesionOutputContract() {
        return {
            contractId: 'continentalCohesionOutput',
            pipelineStep: PIPELINE_STEP_ID,
            moduleId: MODULE_ID,
            status: STATUS,
            scaffold: false,
            stub: false,
            deterministic: true,
            metricsImplemented: true,
            implementedMetrics: IMPLEMENTED_METRICS.slice(),
            plannedMetrics: PLANNED_METRICS.slice(),
            requiredKeys: [
                'analyzerId',
                'pipelineStepId',
                'status',
                'dependencyAvailability',
                'sourceSummary',
                'analysisPlan',
                'outputs',
                'intentionallyAbsent'
            ],
            outputFieldIds: [
                INTERIOR_PASSABILITY_FIELD_ID,
                REGIONAL_SEGMENT_MASK_FIELD_ID,
                CORE_POTENTIAL_FIELD_ID,
                FRACTURED_PERIPHERY_FIELD_ID,
                CONTINENTAL_COHESION_FIELD_ID
            ],
            intermediateOutputIds: [
                INTERIOR_PASSABILITY_OUTPUT_ID,
                REGIONAL_SEGMENTATION_OUTPUT_ID,
                CORE_POTENTIAL_OUTPUT_ID,
                FRACTURED_PERIPHERY_OUTPUT_ID,
                CONTINENTAL_COHESION_SUMMARIES_ID,
                'continentalCohesionAnalysisPlan'
            ],
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice(),
            description: 'Partial output contract for ContinentalCohesionAnalyzer. It emits coarse interior passability, regional segmentation, physical core-potential analysis, fractured-periphery analysis, and a unified ContinentalCohesionField with per-continent summaries; basin connectivity, ridge barriers, state-scale potential, core detection, generic periphery classification, route graphs, record mutations, and package assembly remain absent.'
        };
    }

    function analyzeContinentalCohesion(input = {}) {
        const normalizedInput = normalizeInput(input);
        const seedNamespace = buildNamespace('interiorPassability');
        const seed = deriveSubSeed(normalizedInput.macroSeed, seedNamespace);
        const dependencyAvailability = describeContinentalCohesionDependencyAvailability(input);
        const sourceSummary = createSourceSummary(input);
        const interiorPassability = buildInteriorPassabilityAnalysis(input, normalizedInput, seedNamespace, seed);
        const regionalSegmentationNamespace = buildNamespace('regionalSegmentation');
        const regionalSegmentationSeed = deriveSubSeed(normalizedInput.macroSeed, regionalSegmentationNamespace);
        const regionalSegmentation = buildRegionalSegmentationAnalysis(
            input,
            normalizedInput,
            interiorPassability,
            regionalSegmentationNamespace,
            regionalSegmentationSeed
        );
        const corePotentialNamespace = buildNamespace('corePotential');
        const corePotentialSeed = deriveSubSeed(normalizedInput.macroSeed, corePotentialNamespace);
        const corePotential = buildCorePotentialAnalysis(
            input,
            normalizedInput,
            regionalSegmentation,
            corePotentialNamespace,
            corePotentialSeed
        );
        const fracturedPeripheryNamespace = buildNamespace('fracturedPeriphery');
        const fracturedPeripherySeed = deriveSubSeed(normalizedInput.macroSeed, fracturedPeripheryNamespace);
        const fracturedPeriphery = buildFracturedPeripheryAnalysis(
            input,
            normalizedInput,
            regionalSegmentation,
            corePotential,
            interiorPassability,
            fracturedPeripheryNamespace,
            fracturedPeripherySeed
        );
        const continentalCohesionComposite = buildContinentalCohesionComposite(
            input,
            normalizedInput,
            interiorPassability,
            regionalSegmentation,
            corePotential,
            fracturedPeriphery,
            buildNamespace('continentalCohesionField'),
            deriveSubSeed(normalizedInput.macroSeed, buildNamespace('continentalCohesionField'))
        );

        return {
            analyzerId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            status: STATUS,
            scaffold: false,
            stub: false,
            deterministic: true,
            metricsImplemented: true,
            implementedMetrics: IMPLEMENTED_METRICS.slice(),
            macroSeed: normalizedInput.macroSeed,
            seedNamespace,
            seed,
            worldBounds: cloneValue(normalizedInput.worldBounds),
            descriptor: getContinentalCohesionAnalyzerDescriptor(),
            inputContract: getContinentalCohesionInputContract(),
            outputContract: getContinentalCohesionOutputContract(),
            dependencyAvailability,
            sourceSummary,
            analysisPlan: {
                planId: 'continentalCohesionAnalysisPlan',
                implementedMetrics: IMPLEMENTED_METRICS.slice(),
                plannedMetrics: PLANNED_METRICS.slice(),
                plannedInputGroups: Object.keys(INPUT_GROUPS),
                metricImplementationStatus: 'interior_passability_regional_segmentation_core_potential_and_fractured_periphery_implemented_remaining_deferred',
                recordMutationPolicy: 'read_continent_bodies_and_related_outputs_only',
                outputPolicy: 'coarse interior passability, regional segmentation, physical core-potential, fractured-periphery, and unified continental-cohesion field plus summaries only; downstream strategic synthesis must be added in later explicit microsteps'
            },
            outputs: {
                fields: {
                    interiorPassabilityField: interiorPassability.field,
                    regionalSegmentMaskField: regionalSegmentation.field,
                    corePotentialField: corePotential.field,
                    fracturedPeripheryField: fracturedPeriphery.field,
                    continentalCohesionField: continentalCohesionComposite.field
                },
                intermediateOutputs: {
                    interiorPassabilityAnalysis: interiorPassability.analysis,
                    regionalSegmentationAnalysis: regionalSegmentation.analysis,
                    corePotentialAnalysis: corePotential.analysis,
                    fracturedPeripheryAnalysis: fracturedPeriphery.analysis,
                    continentalCohesionSummaries: continentalCohesionComposite.summaries,
                    continentalCohesionAnalysisPlan: {
                        outputId: 'continentalCohesionAnalysisPlan',
                        stageId: PIPELINE_STEP_ID,
                        deterministic: true,
                        seedNamespace,
                        seed,
                        dependencyAvailability,
                        sourceSummary,
                        implementedMetrics: IMPLEMENTED_METRICS.slice(),
                        plannedMetrics: PLANNED_METRICS.slice(),
                        allMetricSlots: ALL_COHESION_METRICS.slice(),
                        metricsImplemented: true,
                        intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
                    }
                },
                records: {},
                debugArtifacts: []
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice(),
            notes: [
                'Interior passability is a coarse physical analysis over continentBodies, reliefRegionExtraction/reliefRegions, climateStressField, and hydrology hints.',
                'Regional segmentation extracts coarse continent-internal physical blocks from passability and barrier masks.',
                'Core potential ranks regional segments by coarse physical support from passability, connectivity, coastal access context, and climate summaries without political interpretation.',
                'Fractured periphery highlights weakly connected continental outskirts from edge exposure, core-distance, climate burden, and hydrology burden without strategic synthesis or routing.',
                'ContinentalCohesionField fuses the analyzer suboutputs into one coarse physical cohesion scalar and continent-level summary rows without mutating ContinentRecord.',
                'No core detection, generic periphery classification, strategic regions, route graph, local traversal runtime, ContinentRecord mutation, package assembly, terrain cells, UI, or gameplay semantics are produced in this microstep.'
            ]
        };
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule(MODULE_ID, {
            entry: 'analyzeContinentalCohesion',
            file: 'js/worldgen/macro/continental-cohesion-analyzer.js',
            description: 'Partial ContinentalCohesionAnalyzer with coarse interior passability, regional segmentation, physical core-potential, fractured-periphery analysis, and unified continental-cohesion synthesis over explicit physical dependencies.',
            stub: false,
            scaffold: false
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep(PIPELINE_STEP_ID, {
            moduleId: MODULE_ID,
            file: 'js/worldgen/macro/continental-cohesion-analyzer.js',
            entry: 'analyzeContinentalCohesion',
            description: 'Partial pipeline entry for continental cohesion analysis; interior passability, regional segmentation, physical core-potential, fractured-periphery analysis, and unified continent cohesion summaries are implemented while core detection/generic periphery classification remain deferred.',
            stub: false,
            scaffold: false
        });
    }

    Object.assign(macro, {
        getContinentalCohesionAnalyzerDescriptor,
        getContinentalCohesionInputContract,
        getContinentalCohesionOutputContract,
        describeContinentalCohesionDependencyAvailability,
        analyzeContinentalCohesion
    });
})();
