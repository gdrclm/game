(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const MODULE_ID = 'coastalOpportunityAnalyzer';
    const PIPELINE_STEP_ID = 'coastalOpportunity';
    const STATUS = 'PARTIAL_IMPLEMENTED';
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';
    const DEFAULT_WORLD_BOUNDS = Object.freeze({
        width: 256,
        height: 128
    });
    const DEFAULT_FIELD_RANGE = Object.freeze([0, 1]);
    const FIELD_VALUE_ENCODING = 'rowMajorFloatArray';
    const ANALYSIS_PLAN_OUTPUT_ID = 'coastalOpportunityAnalysisPlan';
    const COASTAL_OPPORTUNITY_MAP_ID = 'coastalOpportunityMap';
    const COASTAL_OPPORTUNITY_PROFILE_ID = 'coastalOpportunityProfile';
    const EXCEPTIONAL_COASTAL_NODES_ID = 'exceptionalCoastalNodes';
    const COMPOSITE_SYNTHESIS_STAGE_ID = 'compositeSynthesis';
    const COASTAL_OPPORTUNITY_COMPOSITE_MODEL_ID = 'deterministicCoastalOpportunityCompositeProfileV1';
    const HARBOR_QUALITY_FIELD_ID = 'harborQualityField';
    const HARBOR_QUALITY_ANALYSIS_ID = 'harborQualityAnalysis';
    const HARBOR_QUALITY_STAGE_ID = 'harborQuality';
    const HARBOR_QUALITY_MODEL_ID = 'deterministicCoarseHarborQualityCompositeV1';
    const LANDING_EASE_FIELD_ID = 'landingEaseField';
    const LANDING_EASE_ANALYSIS_ID = 'landingEaseAnalysis';
    const LANDING_EASE_STAGE_ID = 'landingEase';
    const LANDING_EASE_MODEL_ID = 'deterministicCoarseLandingEaseCompositeV1';
    const FISHING_POTENTIAL_FIELD_ID = 'fishingPotentialField';
    const FISHING_POTENTIAL_ANALYSIS_ID = 'fishingPotentialAnalysis';
    const FISHING_POTENTIAL_STAGE_ID = 'fishingPotential';
    const FISHING_POTENTIAL_MODEL_ID = 'deterministicCoarseFishingPotentialCompositeV1';
    const SHORE_DEFENSE_FIELD_ID = 'shoreDefenseField';
    const SHORE_DEFENSE_ANALYSIS_ID = 'shoreDefenseAnalysis';
    const SHORE_DEFENSE_STAGE_ID = 'shoreDefense';
    const SHORE_DEFENSE_MODEL_ID = 'deterministicCoarseShoreDefenseCompositeV1';
    const INLAND_LINK_FIELD_ID = 'inlandLinkField';
    const INLAND_LINK_ANALYSIS_ID = 'inlandLinkAnalysis';
    const INLAND_LINK_STAGE_ID = 'inlandLink';
    const INLAND_LINK_MODEL_ID = 'deterministicCoarseInlandLinkBonusCompositeV1';
    const COASTAL_OPPORTUNITY_COMPONENT_WEIGHTS = Object.freeze({
        harborQuality: 0.24,
        landingEase: 0.16,
        fishingPotential: 0.18,
        shoreDefense: 0.14,
        inlandLink: 0.28
    });
    const REQUIRED_KEYS = Object.freeze([
        'macroSeed'
    ]);
    const OPTIONAL_KEYS = Object.freeze([
        'macroSeedProfile',
        'phase1Constraints',
        'worldBounds',
        'reliefElevation',
        'continentalCohesion',
        'hydrosphere',
        'riverSystem',
        'climateEnvelope',
        'fields',
        'intermediateOutputs',
        'records',
        'debugOptions'
    ]);
    const INPUT_GROUPS = Object.freeze({
        coastGeometry: Object.freeze([
            {
                dependencyId: 'seaRegionClusters',
                sourceGroup: 'hydrosphere.outputs.intermediateOutputs',
                required: true,
                role: 'coastal basin and sea-cluster geometry for future harbor and landing scoring'
            },
            {
                dependencyId: 'coastalShelfDepthField',
                sourceGroup: 'hydrosphere.outputs.fields',
                required: true,
                role: 'coarse shelf-like shallow-water context for future harbor and landing scoring'
            },
            {
                dependencyId: 'coastalDepthApproximation',
                sourceGroup: 'hydrosphere.outputs.intermediateOutputs',
                required: false,
                role: 'cluster-level coastal depth-zone summaries for future harbor and landing analysis'
            },
            {
                dependencyId: 'seaNavigabilityTagging',
                sourceGroup: 'hydrosphere.outputs.intermediateOutputs',
                required: false,
                role: 'rough navigability and hazard tags for future harbor and fishing scoring'
            }
        ]),
        hydrology: Object.freeze([
            {
                dependencyId: 'watershedSegmentation',
                sourceGroup: 'hydrosphere.outputs.intermediateOutputs',
                required: false,
                role: 'coastal drainage-basin linkage for inland-link analysis'
            },
            {
                dependencyId: 'majorRiverCandidates',
                sourceGroup: 'riverSystem.outputs.intermediateOutputs',
                required: false,
                role: 'macro river-mouth and corridor context for inland-link scoring'
            },
            {
                dependencyId: 'flowAccumulationField',
                sourceGroup: 'riverSystem.outputs.fields',
                required: false,
                role: 'coarse freshwater discharge context for fishing and inland-link scoring'
            }
        ]),
        climate: Object.freeze([
            {
                dependencyId: 'coastalDecayBurdenField',
                sourceGroup: 'climateEnvelope.outputs.fields',
                required: true,
                role: 'coastal weathering and shoreline burden context for future harbor, landing, and defense scoring'
            },
            {
                dependencyId: 'stormCorridorField',
                sourceGroup: 'climateEnvelope.outputs.fields',
                required: false,
                role: 'storm exposure context for future harbor, landing, and shore-defense scoring'
            },
            {
                dependencyId: 'climateStressField',
                sourceGroup: 'climateEnvelope.outputs.fields',
                required: false,
                role: 'broad coastal climate pressure context for future coastal-opportunity summaries'
            }
        ]),
        continentalContext: Object.freeze([
            {
                dependencyId: 'continentBodies',
                sourceGroup: 'reliefElevation.outputs.intermediateOutputs',
                required: false,
                role: 'continent attribution for future coastal summary rollups'
            },
            {
                dependencyId: 'continentalCohesionSummaries',
                sourceGroup: 'continentalCohesion.outputs.intermediateOutputs',
                required: false,
                role: 'optional continent-scale interior linkage context for inland-link scoring'
            },
            {
                dependencyId: 'regionalClimateSummaries',
                sourceGroup: 'climateEnvelope.outputs.intermediateOutputs',
                required: false,
                role: 'optional climate summary rows for later coastal summary linkage'
            }
        ])
    });
    const COASTAL_SUB_SCORES = Object.freeze([
        {
            subScoreId: 'harborQuality',
            fieldId: HARBOR_QUALITY_FIELD_ID,
            outputId: HARBOR_QUALITY_ANALYSIS_ID,
            stageId: HARBOR_QUALITY_STAGE_ID,
            status: 'implemented',
            primaryInputGroups: ['coastGeometry', 'climate'],
            description: 'Coarse harbor quality from shelf/depth protection, sea-cluster shelter, navigability roughness, storm exposure, and coastal-decay burden.'
        },
        {
            subScoreId: 'landingEase',
            fieldId: LANDING_EASE_FIELD_ID,
            outputId: LANDING_EASE_ANALYSIS_ID,
            stageId: LANDING_EASE_STAGE_ID,
            status: 'implemented',
            primaryInputGroups: ['coastGeometry'],
            description: 'Coarse landing ease from shelf/depth access, coastal openness, and hydrosphere approach conditions as a separate layer.'
        },
        {
            subScoreId: 'fishingPotential',
            fieldId: FISHING_POTENTIAL_FIELD_ID,
            outputId: FISHING_POTENTIAL_ANALYSIS_ID,
            stageId: FISHING_POTENTIAL_STAGE_ID,
            status: 'implemented',
            primaryInputGroups: ['coastGeometry', 'climate', 'continentalContext'],
            description: 'Coarse fishing potential from shelf support, navigability/hazard water conditions, and sea climate summaries without resource economy.'
        },
        {
            subScoreId: 'shoreDefense',
            fieldId: SHORE_DEFENSE_FIELD_ID,
            outputId: SHORE_DEFENSE_ANALYSIS_ID,
            stageId: SHORE_DEFENSE_STAGE_ID,
            status: 'implemented',
            primaryInputGroups: ['coastGeometry', 'climate'],
            description: 'Coarse natural shore defense from enclosed coastal geometry, approach friction, and lower storm/decay exposure without military interpretation.'
        },
        {
            subScoreId: 'inlandLink',
            fieldId: INLAND_LINK_FIELD_ID,
            outputId: INLAND_LINK_ANALYSIS_ID,
            stageId: INLAND_LINK_STAGE_ID,
            status: 'implemented',
            primaryInputGroups: ['coastGeometry', 'hydrology', 'continentalContext'],
            description: 'Coarse inland-link bonus from river mouths, watershed reach, and optional continent cohesion as a separate coast-to-interior connectivity layer.'
        }
    ]);
    const STAGE_SLOTS = Object.freeze([
        {
            stageId: 'dependencyIntake',
            seedScope: 'dependencyIntake',
            status: 'implemented',
            plannedOutputs: ['dependencyAvailability']
        },
        {
            stageId: HARBOR_QUALITY_STAGE_ID,
            seedScope: HARBOR_QUALITY_STAGE_ID,
            status: 'implemented',
            plannedOutputs: [HARBOR_QUALITY_FIELD_ID, HARBOR_QUALITY_ANALYSIS_ID]
        },
        {
            stageId: LANDING_EASE_STAGE_ID,
            seedScope: LANDING_EASE_STAGE_ID,
            status: 'implemented',
            plannedOutputs: [LANDING_EASE_FIELD_ID, LANDING_EASE_ANALYSIS_ID]
        },
        {
            stageId: FISHING_POTENTIAL_STAGE_ID,
            seedScope: FISHING_POTENTIAL_STAGE_ID,
            status: 'implemented',
            plannedOutputs: [FISHING_POTENTIAL_FIELD_ID, FISHING_POTENTIAL_ANALYSIS_ID]
        },
        {
            stageId: SHORE_DEFENSE_STAGE_ID,
            seedScope: SHORE_DEFENSE_STAGE_ID,
            status: 'implemented',
            plannedOutputs: [SHORE_DEFENSE_FIELD_ID, SHORE_DEFENSE_ANALYSIS_ID]
        },
        {
            stageId: INLAND_LINK_STAGE_ID,
            seedScope: INLAND_LINK_STAGE_ID,
            status: 'implemented',
            plannedOutputs: [INLAND_LINK_FIELD_ID, INLAND_LINK_ANALYSIS_ID]
        },
        {
            stageId: COMPOSITE_SYNTHESIS_STAGE_ID,
            seedScope: COMPOSITE_SYNTHESIS_STAGE_ID,
            status: 'implemented',
            plannedOutputs: [
                COASTAL_OPPORTUNITY_MAP_ID,
                COASTAL_OPPORTUNITY_PROFILE_ID,
                EXCEPTIONAL_COASTAL_NODES_ID
            ]
        }
    ]);
    const INTENTIONALLY_ABSENT = Object.freeze([
        'coastalOpportunityRegionalSummaries',
        'coastalSettlementSuitability',
        'routeGraph',
        'macroRoutes',
        'strategicRegionSynthesis',
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

    function normalizeStringList(values = []) {
        if (!Array.isArray(values)) {
            return [];
        }

        return Array.from(new Set(
            values
                .map((value) => normalizeString(value, ''))
                .filter(Boolean)
        ));
    }

    function createPointFromCellIndex(cellIndex, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedIndex = normalizeInteger(cellIndex, -1);
        const width = normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width);
        const height = normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height);
        if (normalizedIndex < 0 || width <= 0 || height <= 0) {
            return {
                cellIndex: -1,
                point: { x: 0, y: 0 },
                normalizedPoint: { x: 0, y: 0 }
            };
        }

        const point = {
            x: normalizedIndex % width,
            y: Math.floor(normalizedIndex / width)
        };

        return {
            cellIndex: normalizedIndex,
            point,
            normalizedPoint: {
                x: roundFieldValue(width > 1 ? point.x / (width - 1) : 0),
                y: roundFieldValue(height > 1 ? point.y / (height - 1) : 0)
            }
        };
    }

    function clampUnitInterval(value, fallback = 0) {
        const numericValue = Number(value);
        const safeValue = Number.isFinite(numericValue)
            ? numericValue
            : fallback;
        return Math.max(0, Math.min(1, safeValue));
    }

    function roundFieldValue(value) {
        return Math.round(clampUnitInterval(value, 0) * 1000) / 1000;
    }

    function getNestedValue(source, path) {
        if (!source || typeof source !== 'object' || typeof path !== 'string' || !path) {
            return null;
        }

        return path.split('.').reduce((currentValue, segment) => {
            if (!currentValue || typeof currentValue !== 'object') {
                return null;
            }

            return Object.prototype.hasOwnProperty.call(currentValue, segment)
                ? currentValue[segment]
                : null;
        }, source);
    }

    function normalizeWorldBounds(worldBounds = {}) {
        return deepFreeze({
            width: normalizeInteger(worldBounds.width, DEFAULT_WORLD_BOUNDS.width),
            height: normalizeInteger(worldBounds.height, DEFAULT_WORLD_BOUNDS.height)
        });
    }

    function findDependencyValue(source, dependencyId = '') {
        if (!source || !dependencyId) {
            return null;
        }

        if (Array.isArray(source)) {
            return source.find((item) => {
                if (!item || typeof item !== 'object') {
                    return false;
                }

                return item.fieldId === dependencyId
                    || item.outputId === dependencyId
                    || item.recordId === dependencyId
                    || item.id === dependencyId;
            }) || null;
        }

        if (typeof source === 'object') {
            if (Object.prototype.hasOwnProperty.call(source, dependencyId)) {
                return source[dependencyId];
            }

            if (source.fieldId === dependencyId
                || source.outputId === dependencyId
                || source.recordId === dependencyId
                || source.id === dependencyId) {
                return source;
            }
        }

        return null;
    }

    function findSourceGroupValue(input, dependency = {}) {
        const container = getNestedValue(input, dependency.sourceGroup);
        return findDependencyValue(container, dependency.dependencyId);
    }

    function summarizeGroupAvailability(input, groupId, dependencies = []) {
        const dependencyRows = dependencies.map((dependency) => {
            const value = findSourceGroupValue(input, dependency);
            return {
                dependencyId: dependency.dependencyId,
                sourceGroup: dependency.sourceGroup,
                required: Boolean(dependency.required),
                available: Boolean(value),
                role: dependency.role
            };
        });
        const requiredRows = dependencyRows.filter((dependency) => dependency.required);
        const availableRows = dependencyRows.filter((dependency) => dependency.available);
        const availableRequiredRows = requiredRows.filter((dependency) => dependency.available);

        return {
            groupId,
            dependencyCount: dependencyRows.length,
            requiredDependencyCount: requiredRows.length,
            availableDependencyCount: availableRows.length,
            availableRequiredDependencyCount: availableRequiredRows.length,
            readiness: requiredRows.length === 0 || availableRequiredRows.length === requiredRows.length
                ? 'ready_for_partial_analysis'
                : 'missing_required_inputs',
            dependencies: dependencyRows
        };
    }

    function buildSourceSummary(groupRows = []) {
        const availableDependencyCount = groupRows.reduce((sum, group) => sum + group.availableDependencyCount, 0);
        const requiredDependencyCount = groupRows.reduce((sum, group) => sum + group.requiredDependencyCount, 0);
        const availableRequiredDependencyCount = groupRows.reduce((sum, group) => sum + group.availableRequiredDependencyCount, 0);

        return {
            groupCount: groupRows.length,
            readyGroupCount: groupRows.filter((group) => group.readiness === 'ready_for_partial_analysis').length,
            availableDependencyCount,
            requiredDependencyCount,
            availableRequiredDependencyCount,
            missingRequiredDependencyIds: groupRows.flatMap((group) => group.dependencies)
                .filter((dependency) => dependency.required && !dependency.available)
                .map((dependency) => dependency.dependencyId)
        };
    }

    function findInputField(input = {}, fieldId = '') {
        const candidateGroups = [
            input.fields,
            getNestedValue(input, 'outputs.fields'),
            getNestedValue(input, 'reliefElevation.fields'),
            getNestedValue(input, 'reliefElevation.outputs.fields'),
            getNestedValue(input, 'continentalCohesion.fields'),
            getNestedValue(input, 'continentalCohesion.outputs.fields'),
            getNestedValue(input, 'hydrosphere.fields'),
            getNestedValue(input, 'hydrosphere.outputs.fields'),
            getNestedValue(input, 'riverSystem.fields'),
            getNestedValue(input, 'riverSystem.outputs.fields'),
            getNestedValue(input, 'climateEnvelope.fields'),
            getNestedValue(input, 'climateEnvelope.outputs.fields')
        ];

        return candidateGroups
            .map((group) => findDependencyValue(group, fieldId))
            .find(Boolean) || null;
    }

    function findInputIntermediateOutput(input = {}, outputId = '') {
        const candidateGroups = [
            input.intermediateOutputs,
            getNestedValue(input, 'outputs.intermediateOutputs'),
            getNestedValue(input, 'reliefElevation.intermediateOutputs'),
            getNestedValue(input, 'reliefElevation.outputs.intermediateOutputs'),
            getNestedValue(input, 'continentalCohesion.intermediateOutputs'),
            getNestedValue(input, 'continentalCohesion.outputs.intermediateOutputs'),
            getNestedValue(input, 'hydrosphere.intermediateOutputs'),
            getNestedValue(input, 'hydrosphere.outputs.intermediateOutputs'),
            getNestedValue(input, 'riverSystem.intermediateOutputs'),
            getNestedValue(input, 'riverSystem.outputs.intermediateOutputs'),
            getNestedValue(input, 'climateEnvelope.intermediateOutputs'),
            getNestedValue(input, 'climateEnvelope.outputs.intermediateOutputs')
        ];

        return candidateGroups
            .map((group) => findDependencyValue(group, outputId))
            .find(Boolean) || null;
    }

    function buildFieldStats(values = []) {
        if (!Array.isArray(values) || values.length === 0) {
            return {
                min: 0,
                max: 0,
                mean: 0,
                nonZeroCount: 0
            };
        }

        let min = 1;
        let max = 0;
        let sum = 0;
        let nonZeroCount = 0;

        values.forEach((value) => {
            const normalizedValue = clampUnitInterval(value, 0);
            min = Math.min(min, normalizedValue);
            max = Math.max(max, normalizedValue);
            sum += normalizedValue;
            if (normalizedValue > 0) {
                nonZeroCount += 1;
            }
        });

        return {
            min: roundFieldValue(min),
            max: roundFieldValue(max),
            mean: roundFieldValue(sum / Math.max(1, values.length)),
            nonZeroCount
        };
    }

    function serializeScalarField(fieldId, worldBounds, values, extra = {}) {
        const normalizedBounds = normalizeWorldBounds(worldBounds);
        const size = normalizedBounds.width * normalizedBounds.height;
        const normalizedValues = Array.isArray(values)
            ? values.slice(0, size).map((value) => roundFieldValue(value))
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
            valueEncoding: FIELD_VALUE_ENCODING,
            values: normalizedValues,
            stats: buildFieldStats(normalizedValues),
            ...extra
        };
    }

    function readFieldIndexValue(field, index, fallback = 0) {
        if (!field || typeof field !== 'object' || !Array.isArray(field.values)) {
            return clampUnitInterval(fallback, 0);
        }

        const normalizedIndex = normalizeInteger(index, -1);
        if (normalizedIndex < 0 || normalizedIndex >= field.values.length) {
            return clampUnitInterval(fallback, 0);
        }

        return clampUnitInterval(field.values[normalizedIndex], fallback);
    }

    function getNeighborIndices(index, width, height) {
        const normalizedWidth = normalizeInteger(width, DEFAULT_WORLD_BOUNDS.width);
        const normalizedHeight = normalizeInteger(height, DEFAULT_WORLD_BOUNDS.height);
        const normalizedIndex = normalizeInteger(index, -1);
        if (normalizedIndex < 0) {
            return [];
        }

        const x = normalizedIndex % normalizedWidth;
        const y = Math.floor(normalizedIndex / normalizedWidth);
        const neighbors = [];

        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
            for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
                if (offsetX === 0 && offsetY === 0) {
                    continue;
                }

                const sampleX = x + offsetX;
                const sampleY = y + offsetY;
                if (sampleX < 0 || sampleY < 0 || sampleX >= normalizedWidth || sampleY >= normalizedHeight) {
                    continue;
                }

                neighbors.push((sampleY * normalizedWidth) + sampleX);
            }
        }

        return neighbors;
    }

    function buildLookupById(items = [], key = '') {
        const lookup = new Map();
        if (!Array.isArray(items) || !key) {
            return lookup;
        }

        items.forEach((item) => {
            if (!item || typeof item !== 'object') {
                return;
            }

            const id = normalizeString(item[key], '');
            if (id) {
                lookup.set(id, item);
            }
        });

        return lookup;
    }

    function getClusterList(seaRegionClustersOutput = {}, seaNavigabilityTagging = {}) {
        if (Array.isArray(seaNavigabilityTagging.taggedSeaRegionClusters) && seaNavigabilityTagging.taggedSeaRegionClusters.length > 0) {
            return seaNavigabilityTagging.taggedSeaRegionClusters.slice();
        }

        if (Array.isArray(seaRegionClustersOutput.seaRegionClusters)) {
            return seaRegionClustersOutput.seaRegionClusters.slice();
        }

        return [];
    }

    function scoreBasinShelter(basinType = '') {
        const normalizedBasinType = normalizeString(basinType, '');
        if (normalizedBasinType === 'inland_sea') {
            return 0.92;
        }
        if (normalizedBasinType === 'semi_enclosed_sea') {
            return 0.82;
        }
        if (normalizedBasinType === 'enclosed_water') {
            return 0.74;
        }
        if (normalizedBasinType === 'open_ocean') {
            return 0.28;
        }
        return 0.48;
    }

    function extractEnclosureScore(cluster = {}) {
        return clampUnitInterval(
            getNestedValue(cluster, 'classificationSignals.enclosureScore'),
            clampUnitInterval(getNestedValue(cluster, 'navigabilitySignals.enclosureScore'), 0.5)
        );
    }

    function extractEdgeExposure(cluster = {}) {
        return clampUnitInterval(
            getNestedValue(cluster, 'classificationSignals.edgeExposureRatio'),
            clampUnitInterval(getNestedValue(cluster, 'navigabilitySignals.edgeExposureRatio'), 0.5)
        );
    }

    function getZoneCountRatio(zoneSummary = {}, zoneId = '') {
        const zoneCounts = zoneSummary && typeof zoneSummary.zoneCounts === 'object'
            ? zoneSummary.zoneCounts
            : {};
        const cellCount = normalizeInteger(zoneSummary.cellCount, 0);
        return roundFieldValue(clampUnitInterval(
            (Number(zoneCounts[zoneId]) || 0) / Math.max(1, cellCount),
            0
        ));
    }

    function buildSeaClimateSummaryLookup(regionalClimateSummaries = {}) {
        const lookup = new Map();
        const seaSummaries = Array.isArray(regionalClimateSummaries && regionalClimateSummaries.seaSummaries)
            ? regionalClimateSummaries.seaSummaries
            : [];

        seaSummaries.forEach((summary) => {
            if (!summary || typeof summary !== 'object') {
                return;
            }

            const seaRegionClusterId = normalizeString(summary.seaRegionClusterId, '');
            const seaRegionId = normalizeString(summary.seaRegionId, '');
            if (seaRegionClusterId) {
                lookup.set(seaRegionClusterId, summary);
            }
            if (seaRegionId && !lookup.has(seaRegionId)) {
                lookup.set(seaRegionId, summary);
            }
        });

        return lookup;
    }

    function extractContinentId(continentBody = {}) {
        return normalizeString(
            continentBody.continentId,
            normalizeString(
                getNestedValue(continentBody, 'recordDraft.continentId'),
                normalizeString(continentBody.continentBodyId, '')
            )
        );
    }

    function buildContinentCellLookup(continentBodiesOutput = {}, size = 0) {
        const lookup = new Map();
        const continentBodies = Array.isArray(continentBodiesOutput && continentBodiesOutput.continentBodies)
            ? continentBodiesOutput.continentBodies
            : [];

        continentBodies.forEach((continentBody) => {
            const continentId = extractContinentId(continentBody);
            if (!continentId) {
                return;
            }

            const cellIndices = Array.isArray(continentBody.cellIndices)
                ? continentBody.cellIndices
                : [];
            cellIndices.forEach((cellIndex) => {
                const normalizedIndex = normalizeInteger(cellIndex, -1);
                if (normalizedIndex >= 0 && normalizedIndex < size && !lookup.has(normalizedIndex)) {
                    lookup.set(normalizedIndex, continentId);
                }
            });
        });

        return lookup;
    }

    function buildClusterCellLookup(seaRegionClustersOutput = {}, seaNavigabilityTagging = {}, size = 0) {
        const lookup = new Map();
        const clusters = getClusterList(seaRegionClustersOutput, seaNavigabilityTagging);

        clusters.forEach((cluster, clusterIndex) => {
            const clusterId = normalizeString(
                cluster.seaRegionClusterId,
                `seaRegionCluster_${String(clusterIndex + 1).padStart(3, '0')}`
            );
            const cellIndices = Array.isArray(cluster.cellIndices)
                ? cluster.cellIndices
                : [];
            cellIndices.forEach((cellIndex) => {
                const normalizedIndex = normalizeInteger(cellIndex, -1);
                if (normalizedIndex >= 0 && normalizedIndex < size && !lookup.has(normalizedIndex)) {
                    lookup.set(normalizedIndex, clusterId);
                }
            });
        });

        return lookup;
    }

    function buildSeaRegionIdentityLookup(seaRegionClustersOutput = {}, seaNavigabilityTagging = {}) {
        const clusterById = new Map();
        const seaRegionIdToClusterId = new Map();
        const clusters = getClusterList(seaRegionClustersOutput, seaNavigabilityTagging);

        clusters.forEach((cluster, clusterIndex) => {
            const clusterId = normalizeString(
                cluster.seaRegionClusterId,
                `seaRegionCluster_${String(clusterIndex + 1).padStart(3, '0')}`
            );
            clusterById.set(clusterId, cluster);

            const seaRegionId = normalizeString(
                getNestedValue(cluster, 'recordDraft.seaRegionId'),
                normalizeString(cluster.seaRegionId, '')
            );
            if (seaRegionId) {
                seaRegionIdToClusterId.set(seaRegionId, clusterId);
            }
        });

        return {
            clusterById,
            seaRegionIdToClusterId
        };
    }

    function buildComponentSummaryLookup(items = [], key = 'seaRegionClusterId') {
        return buildLookupById(Array.isArray(items) ? items : [], key);
    }

    function buildContinentCohesionLookup(continentalCohesionSummaries = {}) {
        return buildLookupById(
            continentalCohesionSummaries && continentalCohesionSummaries.continentSummaries,
            'continentId'
        );
    }

    function resolveClusterContinentId(cluster = {}, continentCellLookup = new Map(), worldBounds = DEFAULT_WORLD_BOUNDS) {
        if (!(continentCellLookup instanceof Map) || continentCellLookup.size === 0) {
            return '';
        }

        const counts = new Map();
        const cellIndices = Array.isArray(cluster.cellIndices)
            ? cluster.cellIndices
            : [];
        cellIndices.forEach((cellIndex) => {
            const normalizedIndex = normalizeInteger(cellIndex, -1);
            if (normalizedIndex < 0) {
                return;
            }

            getNeighborIndices(normalizedIndex, worldBounds.width, worldBounds.height).forEach((neighborIndex) => {
                const continentId = continentCellLookup.get(neighborIndex);
                if (continentId) {
                    counts.set(continentId, (counts.get(continentId) || 0) + 1);
                }
            });
        });

        return Array.from(counts.entries())
            .sort((left, right) => {
                if (right[1] !== left[1]) {
                    return right[1] - left[1];
                }
                return left[0].localeCompare(right[0]);
            })
            .map(([continentId]) => continentId)[0] || '';
    }

    function resolveSeaClimateSummary(climateLookup, cluster = {}) {
        if (!(climateLookup instanceof Map) || climateLookup.size === 0) {
            return {};
        }

        const clusterId = normalizeString(cluster.seaRegionClusterId, '');
        if (clusterId && climateLookup.has(clusterId)) {
            return climateLookup.get(clusterId) || {};
        }

        const seaRegionId = normalizeString(
            getNestedValue(cluster, 'recordDraft.seaRegionId'),
            normalizeString(cluster.seaRegionId, '')
        );
        if (seaRegionId && climateLookup.has(seaRegionId)) {
            return climateLookup.get(seaRegionId) || {};
        }

        return {};
    }

    function scoreMidrangeSupport(value, center = 0.5, spread = 0.5) {
        const normalizedValue = clampUnitInterval(value, center);
        const normalizedSpread = Math.max(0.01, Number.isFinite(Number(spread)) ? Number(spread) : 0.5);
        return roundFieldValue(clampUnitInterval(
            1 - (Math.abs(normalizedValue - center) / normalizedSpread),
            0
        ));
    }

    function extractShorelineComplexity(cluster = {}) {
        return clampUnitInterval(
            getNestedValue(cluster, 'navigabilitySignals.shorelineComplexity'),
            clampUnitInterval(getNestedValue(cluster, 'geometryMetrics.shorelineComplexity'), 0.24)
        );
    }

    function classifyHarborQuality(score) {
        const normalizedScore = clampUnitInterval(score, 0);
        if (normalizedScore >= 0.72) {
            return 'excellent';
        }
        if (normalizedScore >= 0.56) {
            return 'strong';
        }
        if (normalizedScore >= 0.38) {
            return 'workable';
        }
        if (normalizedScore >= 0.18) {
            return 'exposed';
        }
        return 'poor';
    }

    function classifyLandingEase(score) {
        const normalizedScore = clampUnitInterval(score, 0);
        if (normalizedScore >= 0.74) {
            return 'excellent';
        }
        if (normalizedScore >= 0.58) {
            return 'easy';
        }
        if (normalizedScore >= 0.42) {
            return 'workable';
        }
        if (normalizedScore >= 0.22) {
            return 'difficult';
        }
        return 'poor';
    }

    function classifyFishingPotential(score) {
        const normalizedScore = clampUnitInterval(score, 0);
        if (normalizedScore >= 0.74) {
            return 'abundant';
        }
        if (normalizedScore >= 0.58) {
            return 'rich';
        }
        if (normalizedScore >= 0.42) {
            return 'steady';
        }
        if (normalizedScore >= 0.22) {
            return 'thin';
        }
        return 'poor';
    }

    function classifyShoreDefense(score) {
        const normalizedScore = clampUnitInterval(score, 0);
        if (normalizedScore >= 0.72) {
            return 'shielded';
        }
        if (normalizedScore >= 0.56) {
            return 'buffered';
        }
        if (normalizedScore >= 0.4) {
            return 'mixed';
        }
        if (normalizedScore >= 0.22) {
            return 'open';
        }
        return 'exposed';
    }

    function classifyInlandLink(score) {
        const normalizedScore = clampUnitInterval(score, 0);
        if (normalizedScore >= 0.7) {
            return 'strong';
        }
        if (normalizedScore >= 0.54) {
            return 'linked';
        }
        if (normalizedScore >= 0.36) {
            return 'partial';
        }
        if (normalizedScore >= 0.18) {
            return 'weak';
        }
        return 'isolated';
    }

    function classifyCoastalOpportunity(score) {
        const normalizedScore = clampUnitInterval(score, 0);
        if (normalizedScore >= 0.74) {
            return 'exceptional';
        }
        if (normalizedScore >= 0.58) {
            return 'strong';
        }
        if (normalizedScore >= 0.42) {
            return 'workable';
        }
        if (normalizedScore >= 0.22) {
            return 'limited';
        }
        return 'marginal';
    }

    function classifyExceptionalCoastalNode(score) {
        const normalizedScore = clampUnitInterval(score, 0);
        if (normalizedScore >= 0.82) {
            return 'prime';
        }
        if (normalizedScore >= 0.68) {
            return 'exceptional';
        }
        return 'standout';
    }

    function deriveDominantDriverIds(componentScores = {}) {
        const rankedDrivers = Object.entries(componentScores)
            .map(([scoreId, score]) => ({
                scoreId,
                score: clampUnitInterval(score, 0)
            }))
            .sort((left, right) => {
                if (right.score !== left.score) {
                    return right.score - left.score;
                }
                return left.scoreId.localeCompare(right.scoreId);
            });
        const preferredDrivers = rankedDrivers
            .filter((driver) => driver.score >= 0.58)
            .map((driver) => driver.scoreId);

        if (preferredDrivers.length >= 2) {
            return preferredDrivers.slice(0, 3);
        }

        return rankedDrivers.slice(0, Math.min(3, rankedDrivers.length)).map((driver) => driver.scoreId);
    }

    function buildHarborQualityFieldAndAnalysis(input = {}, context = {}) {
        const seaRegionClustersOutput = findInputIntermediateOutput(input, 'seaRegionClusters');
        const coastalDepthApproximation = findInputIntermediateOutput(input, 'coastalDepthApproximation');
        const seaNavigabilityTagging = findInputIntermediateOutput(input, 'seaNavigabilityTagging');
        const coastalShelfDepthField = findInputField(input, 'coastalShelfDepthField');
        const stormCorridorField = findInputField(input, 'stormCorridorField');
        const coastalDecayBurdenField = findInputField(input, 'coastalDecayBurdenField');
        const worldBounds = normalizeWorldBounds(
            (coastalShelfDepthField && coastalShelfDepthField.worldBounds)
            || (seaRegionClustersOutput && seaRegionClustersOutput.worldBounds)
            || context.worldBounds
        );
        const size = worldBounds.width * worldBounds.height;
        const harborValues = new Array(size).fill(0);
        const analyzedMaskValues = new Array(size).fill(0);
        const clusters = getClusterList(seaRegionClustersOutput, seaNavigabilityTagging);
        const zoneLookup = buildLookupById(
            coastalDepthApproximation && coastalDepthApproximation.shelfDepthZones,
            'seaRegionClusterId'
        );
        const harborQualitySummaries = [];
        let analyzedCellCount = 0;

        clusters.forEach((cluster, clusterIndex) => {
            const seaRegionClusterId = normalizeString(
                cluster.seaRegionClusterId,
                `seaRegionCluster_${String(clusterIndex + 1).padStart(3, '0')}`
            );
            const cellIndices = Array.isArray(cluster.cellIndices)
                ? cluster.cellIndices.map((cellIndex) => normalizeInteger(cellIndex, -1)).filter((cellIndex) => cellIndex >= 0 && cellIndex < size)
                : [];
            const clusterCellSet = new Set(cellIndices);
            const zoneSummary = zoneLookup.get(seaRegionClusterId) || {};
            const basinType = normalizeString(cluster.basinType, normalizeString(zoneSummary.basinType, ''));
            const basinShelter = scoreBasinShelter(basinType);
            const enclosureSupport = extractEnclosureScore(cluster);
            const edgeExposure = extractEdgeExposure(cluster);
            const navigabilitySupport = clampUnitInterval(cluster.navigability, clampUnitInterval(zoneSummary.meanShelfScore, 0.5));
            const hazardRoughness = clampUnitInterval(cluster.hazardRoughness, clampUnitInterval(1 - navigabilitySupport, 0.25));
            const shallowShelfRatio = clampUnitInterval(zoneSummary.shelfCellRatio, 0);
            let shelfScoreTotal = 0;
            let shelfCellCount = 0;
            let stormExposureTotal = 0;
            let stormSampleCount = 0;
            let coastalDecayTotal = 0;
            let coastalDecaySampleCount = 0;
            let analyzedClusterCellCount = 0;
            let peakCellScore = 0;

            cellIndices.forEach((cellIndex) => {
                const localShelfScore = readFieldIndexValue(coastalShelfDepthField, cellIndex, 0);
                if (localShelfScore <= 0.02) {
                    return;
                }

                analyzedMaskValues[cellIndex] = 1;
                analyzedCellCount += 1;
                analyzedClusterCellCount += 1;
                shelfScoreTotal += localShelfScore;
                shelfCellCount += 1;

                if (stormCorridorField) {
                    stormExposureTotal += readFieldIndexValue(stormCorridorField, cellIndex, 0);
                    stormSampleCount += 1;
                }

                const neighbors = getNeighborIndices(cellIndex, worldBounds.width, worldBounds.height);
                let localCoastalDecayTotal = 0;
                let localCoastalDecayCount = 0;
                neighbors.forEach((neighborIndex) => {
                    if (clusterCellSet.has(neighborIndex)) {
                        return;
                    }

                    const burden = readFieldIndexValue(coastalDecayBurdenField, neighborIndex, 0);
                    if (burden > 0.01) {
                        localCoastalDecayTotal += burden;
                        localCoastalDecayCount += 1;
                    }
                });

                if (localCoastalDecayCount > 0) {
                    coastalDecayTotal += (localCoastalDecayTotal / localCoastalDecayCount);
                    coastalDecaySampleCount += 1;
                }
            });

            const meanShelfScore = roundFieldValue(
                shelfScoreTotal / Math.max(1, shelfCellCount)
            );
            const meanStormExposure = roundFieldValue(
                stormExposureTotal / Math.max(1, stormSampleCount)
            );
            const meanCoastalDecayBurden = roundFieldValue(
                coastalDecayTotal / Math.max(1, coastalDecaySampleCount)
            );
            const shelterSupport = roundFieldValue(clampUnitInterval(
                (basinShelter * 0.34)
                + (enclosureSupport * 0.38)
                + ((1 - edgeExposure) * 0.28),
                0
            ));
            const approachSupport = roundFieldValue(clampUnitInterval(
                (meanShelfScore * 0.46)
                + (shallowShelfRatio * 0.24)
                + (navigabilitySupport * 0.2)
                + ((1 - hazardRoughness) * 0.1),
                0
            ));
            const climateStability = roundFieldValue(clampUnitInterval(
                ((1 - meanStormExposure) * 0.52)
                + ((1 - meanCoastalDecayBurden) * 0.48),
                0
            ));
            const harborQualityScore = roundFieldValue(clampUnitInterval(
                (shelterSupport * 0.42)
                + (approachSupport * 0.38)
                + (climateStability * 0.2),
                0
            ));
            const harborQualityClass = classifyHarborQuality(harborQualityScore);

            cellIndices.forEach((cellIndex) => {
                const localShelfScore = readFieldIndexValue(coastalShelfDepthField, cellIndex, 0);
                if (localShelfScore <= 0.02) {
                    return;
                }

                const localStormExposure = stormCorridorField
                    ? readFieldIndexValue(stormCorridorField, cellIndex, meanStormExposure)
                    : meanStormExposure;
                const localSupport = clampUnitInterval(
                    (localShelfScore * 0.62)
                    + (shallowShelfRatio * 0.18)
                    + ((1 - localStormExposure) * 0.2),
                    0
                );
                const localHarborScore = roundFieldValue(clampUnitInterval(
                    harborQualityScore * (0.35 + (localSupport * 0.65)),
                    0
                ));
                harborValues[cellIndex] = Math.max(harborValues[cellIndex], localHarborScore);
                peakCellScore = Math.max(peakCellScore, localHarborScore);
            });

            harborQualitySummaries.push({
                seaRegionClusterId,
                basinType,
                cellCount: cellIndices.length,
                analyzedCoastalCellCount: analyzedClusterCellCount,
                meanShelfScore,
                shallowShelfRatio: roundFieldValue(shallowShelfRatio),
                meanStormExposure,
                meanCoastalDecayBurden,
                enclosureSupport: roundFieldValue(enclosureSupport),
                shelterSupport,
                approachSupport,
                climateStability,
                navigabilitySupport: roundFieldValue(navigabilitySupport),
                hazardRoughness: roundFieldValue(hazardRoughness),
                dominantDepthZone: normalizeString(zoneSummary.dominantDepthZone, ''),
                harborQualityScore,
                harborQualityClass,
                peakHarborCellScore: roundFieldValue(peakCellScore)
            });
        });

        const meanHarborQuality = roundFieldValue(
            harborQualitySummaries.reduce((total, summary) => total + summary.harborQualityScore, 0)
            / Math.max(1, harborQualitySummaries.length)
        );
        const highQualityClusterIds = harborQualitySummaries
            .filter((summary) => summary.harborQualityScore >= 0.56)
            .map((summary) => summary.seaRegionClusterId);
        const leadingHarborClusterId = harborQualitySummaries
            .slice()
            .sort((left, right) => {
                if (right.harborQualityScore !== left.harborQualityScore) {
                    return right.harborQualityScore - left.harborQualityScore;
                }
                return left.seaRegionClusterId.localeCompare(right.seaRegionClusterId);
            })
            .map((summary) => summary.seaRegionClusterId)[0] || '';
        const sourceFieldIds = [
            normalizeString(coastalShelfDepthField && coastalShelfDepthField.fieldId, ''),
            normalizeString(stormCorridorField && stormCorridorField.fieldId, ''),
            normalizeString(coastalDecayBurdenField && coastalDecayBurdenField.fieldId, '')
        ].filter(Boolean);
        const sourceOutputIds = [
            normalizeString(seaRegionClustersOutput && seaRegionClustersOutput.seaRegionClusterSetId, ''),
            normalizeString(seaNavigabilityTagging && seaNavigabilityTagging.seaNavigabilityTaggingId, ''),
            normalizeString(coastalDepthApproximation && coastalDepthApproximation.coastalDepthApproximationId, '')
        ].filter(Boolean);
        const harborQualityField = serializeScalarField(
            HARBOR_QUALITY_FIELD_ID,
            worldBounds,
            harborValues,
            {
                stageId: HARBOR_QUALITY_STAGE_ID,
                sourceFieldIds,
                sourceOutputIds,
                modelId: HARBOR_QUALITY_MODEL_ID,
                maskEncoding: 'analyzedMaskValues',
                analyzedMaskValues,
                valueMeaning: '0 = deep/unanalyzed/non-harbor coastal water, 1 = strongest coarse harbor-quality support'
            }
        );
        const harborQualityAnalysis = {
            outputId: HARBOR_QUALITY_ANALYSIS_ID,
            stageId: HARBOR_QUALITY_STAGE_ID,
            deterministic: true,
            seedNamespace: 'macro.coastalOpportunity.harborQuality',
            seed: context.seed,
            worldBounds: cloneValue(worldBounds),
            harborQualityFieldId: HARBOR_QUALITY_FIELD_ID,
            modelId: HARBOR_QUALITY_MODEL_ID,
            sourceFieldIds,
            sourceOutputIds,
            analyzedClusterCount: harborQualitySummaries.length,
            analyzedCoastalCellCount: analyzedCellCount,
            meanHarborQuality,
            leadingHarborClusterId,
            highQualityClusterIds,
            harborQualitySummaries,
            summary: {
                excellentClusterCount: harborQualitySummaries.filter((summary) => summary.harborQualityClass === 'excellent').length,
                strongClusterCount: harborQualitySummaries.filter((summary) => summary.harborQualityClass === 'strong').length,
                workableClusterCount: harborQualitySummaries.filter((summary) => summary.harborQualityClass === 'workable').length,
                exposedClusterCount: harborQualitySummaries.filter((summary) => summary.harborQualityClass === 'exposed').length,
                poorClusterCount: harborQualitySummaries.filter((summary) => summary.harborQualityClass === 'poor').length
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        };

        return {
            field: harborQualityField,
            analysis: harborQualityAnalysis
        };
    }

    function buildLandingEaseFieldAndAnalysis(input = {}, context = {}) {
        const seaRegionClustersOutput = findInputIntermediateOutput(input, 'seaRegionClusters');
        const coastalDepthApproximation = findInputIntermediateOutput(input, 'coastalDepthApproximation');
        const seaNavigabilityTagging = findInputIntermediateOutput(input, 'seaNavigabilityTagging');
        const coastalShelfDepthField = findInputField(input, 'coastalShelfDepthField');
        const worldBounds = normalizeWorldBounds(
            (coastalShelfDepthField && coastalShelfDepthField.worldBounds)
            || (seaRegionClustersOutput && seaRegionClustersOutput.worldBounds)
            || context.worldBounds
        );
        const size = worldBounds.width * worldBounds.height;
        const landingValues = new Array(size).fill(0);
        const analyzedMaskValues = new Array(size).fill(0);
        const clusters = getClusterList(seaRegionClustersOutput, seaNavigabilityTagging);
        const zoneLookup = buildLookupById(
            coastalDepthApproximation && coastalDepthApproximation.shelfDepthZones,
            'seaRegionClusterId'
        );
        const landingEaseSummaries = [];
        let analyzedCellCount = 0;

        clusters.forEach((cluster, clusterIndex) => {
            const seaRegionClusterId = normalizeString(
                cluster.seaRegionClusterId,
                `seaRegionCluster_${String(clusterIndex + 1).padStart(3, '0')}`
            );
            const cellIndices = Array.isArray(cluster.cellIndices)
                ? cluster.cellIndices.map((cellIndex) => normalizeInteger(cellIndex, -1)).filter((cellIndex) => cellIndex >= 0 && cellIndex < size)
                : [];
            const zoneSummary = zoneLookup.get(seaRegionClusterId) || {};
            const edgeExposure = extractEdgeExposure(cluster);
            const enclosureScore = extractEnclosureScore(cluster);
            const shelfApproachBias = clampUnitInterval(
                getNestedValue(zoneSummary, 'harborLandingPreparation.shelfApproachBias'),
                clampUnitInterval(zoneSummary.meanShelfScore, 0.5)
            );
            const shallowShelfRatio = clampUnitInterval(
                getNestedValue(zoneSummary, 'harborLandingPreparation.shallowShelfCellRatio'),
                clampUnitInterval(zoneSummary.shelfCellRatio, 0)
            );
            const coastalSlopeRatio = getZoneCountRatio(zoneSummary, 'coastal_slope');
            const offshoreTransitionRatio = getZoneCountRatio(zoneSummary, 'offshore_transition');
            const navigabilitySupport = clampUnitInterval(
                cluster.navigability,
                clampUnitInterval(
                    (shelfApproachBias * 0.72) + (coastalSlopeRatio * 0.28),
                    0.5
                )
            );
            const hazardRoughness = clampUnitInterval(
                cluster.hazardRoughness,
                clampUnitInterval(1 - navigabilitySupport, 0.24)
            );
            let shelfScoreTotal = 0;
            let shelfCellCount = 0;
            let peakLandingCellScore = 0;

            cellIndices.forEach((cellIndex) => {
                const localShelfScore = readFieldIndexValue(coastalShelfDepthField, cellIndex, 0);
                if (localShelfScore <= 0.02) {
                    return;
                }

                analyzedMaskValues[cellIndex] = 1;
                analyzedCellCount += 1;
                shelfScoreTotal += localShelfScore;
                shelfCellCount += 1;
            });

            const meanShelfScore = roundFieldValue(
                shelfScoreTotal / Math.max(1, shelfCellCount)
            );
            const approachDepthSupport = roundFieldValue(clampUnitInterval(
                (shelfApproachBias * 0.42)
                + (shallowShelfRatio * 0.22)
                + (coastalSlopeRatio * 0.22)
                + (offshoreTransitionRatio * 0.14),
                0
            ));
            const exposureWindowSupport = roundFieldValue(clampUnitInterval(
                (edgeExposure * 0.58)
                + ((1 - enclosureScore) * 0.42),
                0
            ));
            const maneuverSupport = roundFieldValue(clampUnitInterval(
                (navigabilitySupport * 0.56)
                + ((1 - hazardRoughness) * 0.44),
                0
            ));
            const landingEaseScore = roundFieldValue(clampUnitInterval(
                (approachDepthSupport * 0.5)
                + (exposureWindowSupport * 0.28)
                + (maneuverSupport * 0.22),
                0
            ));
            const landingEaseClass = classifyLandingEase(landingEaseScore);

            cellIndices.forEach((cellIndex) => {
                const localShelfScore = readFieldIndexValue(coastalShelfDepthField, cellIndex, 0);
                if (localShelfScore <= 0.02) {
                    return;
                }

                const localDepthSupport = clampUnitInterval(
                    (localShelfScore * 0.68)
                    + (coastalSlopeRatio * 0.18)
                    + (offshoreTransitionRatio * 0.14),
                    0
                );
                const localLandingSupport = clampUnitInterval(
                    (localDepthSupport * 0.62)
                    + (exposureWindowSupport * 0.2)
                    + (maneuverSupport * 0.18),
                    0
                );
                const localLandingScore = roundFieldValue(clampUnitInterval(
                    landingEaseScore * (0.34 + (localLandingSupport * 0.66)),
                    0
                ));
                landingValues[cellIndex] = Math.max(landingValues[cellIndex], localLandingScore);
                peakLandingCellScore = Math.max(peakLandingCellScore, localLandingScore);
            });

            landingEaseSummaries.push({
                seaRegionClusterId,
                basinType: normalizeString(cluster.basinType, normalizeString(zoneSummary.basinType, '')),
                cellCount: cellIndices.length,
                analyzedLandingCellCount: shelfCellCount,
                meanShelfScore,
                shelfApproachBias: roundFieldValue(shelfApproachBias),
                shallowShelfRatio: roundFieldValue(shallowShelfRatio),
                coastalSlopeRatio,
                offshoreTransitionRatio,
                edgeExposure: roundFieldValue(edgeExposure),
                enclosureScore: roundFieldValue(enclosureScore),
                exposureWindowSupport,
                navigabilitySupport: roundFieldValue(navigabilitySupport),
                hazardRoughness: roundFieldValue(hazardRoughness),
                maneuverSupport,
                approachDepthSupport,
                dominantDepthZone: normalizeString(zoneSummary.dominantDepthZone, ''),
                landingEaseScore,
                landingEaseClass,
                peakLandingCellScore: roundFieldValue(peakLandingCellScore)
            });
        });

        const meanLandingEase = roundFieldValue(
            landingEaseSummaries.reduce((total, summary) => total + summary.landingEaseScore, 0)
            / Math.max(1, landingEaseSummaries.length)
        );
        const easyLandingClusterIds = landingEaseSummaries
            .filter((summary) => summary.landingEaseScore >= 0.58)
            .map((summary) => summary.seaRegionClusterId);
        const leadingLandingClusterId = landingEaseSummaries
            .slice()
            .sort((left, right) => {
                if (right.landingEaseScore !== left.landingEaseScore) {
                    return right.landingEaseScore - left.landingEaseScore;
                }
                return left.seaRegionClusterId.localeCompare(right.seaRegionClusterId);
            })
            .map((summary) => summary.seaRegionClusterId)[0] || '';
        const sourceFieldIds = [
            normalizeString(coastalShelfDepthField && coastalShelfDepthField.fieldId, '')
        ].filter(Boolean);
        const sourceOutputIds = [
            normalizeString(seaRegionClustersOutput && seaRegionClustersOutput.seaRegionClusterSetId, ''),
            normalizeString(seaNavigabilityTagging && seaNavigabilityTagging.seaNavigabilityTaggingId, ''),
            normalizeString(coastalDepthApproximation && coastalDepthApproximation.coastalDepthApproximationId, '')
        ].filter(Boolean);
        const landingEaseField = serializeScalarField(
            LANDING_EASE_FIELD_ID,
            worldBounds,
            landingValues,
            {
                stageId: LANDING_EASE_STAGE_ID,
                sourceFieldIds,
                sourceOutputIds,
                modelId: LANDING_EASE_MODEL_ID,
                maskEncoding: 'analyzedMaskValues',
                analyzedMaskValues,
                valueMeaning: '0 = deep/unanalyzed/non-landing coastal water, 1 = strongest coarse landing-ease support'
            }
        );
        const landingEaseAnalysis = {
            outputId: LANDING_EASE_ANALYSIS_ID,
            stageId: LANDING_EASE_STAGE_ID,
            deterministic: true,
            seedNamespace: 'macro.coastalOpportunity.landingEase',
            seed: context.seed,
            worldBounds: cloneValue(worldBounds),
            landingEaseFieldId: LANDING_EASE_FIELD_ID,
            modelId: LANDING_EASE_MODEL_ID,
            sourceFieldIds,
            sourceOutputIds,
            analyzedClusterCount: landingEaseSummaries.length,
            analyzedLandingCellCount: analyzedCellCount,
            meanLandingEase,
            leadingLandingClusterId,
            easyLandingClusterIds,
            landingEaseSummaries,
            summary: {
                excellentClusterCount: landingEaseSummaries.filter((summary) => summary.landingEaseClass === 'excellent').length,
                easyClusterCount: landingEaseSummaries.filter((summary) => summary.landingEaseClass === 'easy').length,
                workableClusterCount: landingEaseSummaries.filter((summary) => summary.landingEaseClass === 'workable').length,
                difficultClusterCount: landingEaseSummaries.filter((summary) => summary.landingEaseClass === 'difficult').length,
                poorClusterCount: landingEaseSummaries.filter((summary) => summary.landingEaseClass === 'poor').length
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        };

        return {
            field: landingEaseField,
            analysis: landingEaseAnalysis
        };
    }

    function buildFishingPotentialFieldAndAnalysis(input = {}, context = {}) {
        const seaRegionClustersOutput = findInputIntermediateOutput(input, 'seaRegionClusters');
        const coastalDepthApproximation = findInputIntermediateOutput(input, 'coastalDepthApproximation');
        const seaNavigabilityTagging = findInputIntermediateOutput(input, 'seaNavigabilityTagging');
        const regionalClimateSummaries = findInputIntermediateOutput(input, 'regionalClimateSummaries');
        const coastalShelfDepthField = findInputField(input, 'coastalShelfDepthField');
        const worldBounds = normalizeWorldBounds(
            (coastalShelfDepthField && coastalShelfDepthField.worldBounds)
            || (seaRegionClustersOutput && seaRegionClustersOutput.worldBounds)
            || context.worldBounds
        );
        const size = worldBounds.width * worldBounds.height;
        const fishingValues = new Array(size).fill(0);
        const analyzedMaskValues = new Array(size).fill(0);
        const clusters = getClusterList(seaRegionClustersOutput, seaNavigabilityTagging);
        const zoneLookup = buildLookupById(
            coastalDepthApproximation && coastalDepthApproximation.shelfDepthZones,
            'seaRegionClusterId'
        );
        const climateLookup = buildSeaClimateSummaryLookup(regionalClimateSummaries);
        const fishingPotentialSummaries = [];
        let analyzedCellCount = 0;

        clusters.forEach((cluster, clusterIndex) => {
            const seaRegionClusterId = normalizeString(
                cluster.seaRegionClusterId,
                `seaRegionCluster_${String(clusterIndex + 1).padStart(3, '0')}`
            );
            const cellIndices = Array.isArray(cluster.cellIndices)
                ? cluster.cellIndices.map((cellIndex) => normalizeInteger(cellIndex, -1)).filter((cellIndex) => cellIndex >= 0 && cellIndex < size)
                : [];
            const zoneSummary = zoneLookup.get(seaRegionClusterId) || {};
            const climateSummary = resolveSeaClimateSummary(climateLookup, cluster);
            const basinType = normalizeString(cluster.basinType, normalizeString(zoneSummary.basinType, ''));
            const basinShelter = scoreBasinShelter(basinType);
            const meanTemperatureBias = clampUnitInterval(climateSummary.meanTemperatureBias, 0.5);
            const meanHumidityBias = clampUnitInterval(climateSummary.meanHumidityBias, 0.5);
            const meanSeasonalityBias = clampUnitInterval(climateSummary.meanSeasonalityBias, 0.5);
            const adjacentLandEdgeRatio = clampUnitInterval(climateSummary.adjacentLandEdgeRatio, 0);
            const shelfCellRatio = clampUnitInterval(zoneSummary.shelfCellRatio, 0);
            const shallowShelfRatio = clampUnitInterval(
                getNestedValue(zoneSummary, 'harborLandingPreparation.shallowShelfCellRatio'),
                shelfCellRatio
            );
            const coastalSlopeRatio = getZoneCountRatio(zoneSummary, 'coastal_slope');
            const offshoreTransitionRatio = getZoneCountRatio(zoneSummary, 'offshore_transition');
            const enclosureScore = extractEnclosureScore(cluster);
            const navigabilitySupport = clampUnitInterval(
                cluster.navigability,
                clampUnitInterval(zoneSummary.meanShelfScore, 0.5)
            );
            const hazardRoughness = clampUnitInterval(
                cluster.hazardRoughness,
                clampUnitInterval(1 - navigabilitySupport, 0.24)
            );
            let shelfScoreTotal = 0;
            let shelfCellCount = 0;
            let peakFishingCellScore = 0;

            cellIndices.forEach((cellIndex) => {
                const localShelfScore = readFieldIndexValue(coastalShelfDepthField, cellIndex, 0);
                if (localShelfScore <= 0.02) {
                    return;
                }

                analyzedMaskValues[cellIndex] = 1;
                analyzedCellCount += 1;
                shelfScoreTotal += localShelfScore;
                shelfCellCount += 1;
            });

            const meanShelfScore = roundFieldValue(
                shelfScoreTotal / Math.max(1, shelfCellCount)
            );
            const thermalProductivitySupport = scoreMidrangeSupport(meanTemperatureBias, 0.58, 0.42);
            const seasonalityMixSupport = scoreMidrangeSupport(meanSeasonalityBias, 0.52, 0.48);
            const basinHabitatSupport = roundFieldValue(clampUnitInterval(
                (basinShelter * 0.58)
                + ((1 - enclosureScore) * 0.22)
                + (adjacentLandEdgeRatio * 0.2),
                0
            ));
            const shelfBiologySupport = roundFieldValue(clampUnitInterval(
                (meanShelfScore * 0.34)
                + (shelfCellRatio * 0.22)
                + (shallowShelfRatio * 0.18)
                + (coastalSlopeRatio * 0.14)
                + (offshoreTransitionRatio * 0.12),
                0
            ));
            const waterConditionSupport = roundFieldValue(clampUnitInterval(
                (navigabilitySupport * 0.48)
                + ((1 - hazardRoughness) * 0.34)
                + ((1 - enclosureScore) * 0.18),
                0
            ));
            const climateProductivitySupport = roundFieldValue(clampUnitInterval(
                (thermalProductivitySupport * 0.38)
                + (meanHumidityBias * 0.34)
                + (seasonalityMixSupport * 0.28),
                0
            ));
            const coastalNutrientSupport = roundFieldValue(clampUnitInterval(
                (adjacentLandEdgeRatio * 0.52)
                + (coastalSlopeRatio * 0.18)
                + (offshoreTransitionRatio * 0.18)
                + (basinHabitatSupport * 0.12),
                0
            ));
            const fishingPotentialScore = roundFieldValue(clampUnitInterval(
                (shelfBiologySupport * 0.34)
                + (waterConditionSupport * 0.22)
                + (climateProductivitySupport * 0.22)
                + (coastalNutrientSupport * 0.22),
                0
            ));
            const fishingPotentialClass = classifyFishingPotential(fishingPotentialScore);

            cellIndices.forEach((cellIndex) => {
                const localShelfScore = readFieldIndexValue(coastalShelfDepthField, cellIndex, 0);
                if (localShelfScore <= 0.02) {
                    return;
                }

                const localShelfSupport = clampUnitInterval(
                    (localShelfScore * 0.58)
                    + (shallowShelfRatio * 0.18)
                    + (coastalSlopeRatio * 0.14)
                    + (offshoreTransitionRatio * 0.1),
                    0
                );
                const localFishingScore = roundFieldValue(clampUnitInterval(
                    fishingPotentialScore * (0.34 + (localShelfSupport * 0.66)),
                    0
                ));
                fishingValues[cellIndex] = Math.max(fishingValues[cellIndex], localFishingScore);
                peakFishingCellScore = Math.max(peakFishingCellScore, localFishingScore);
            });

            fishingPotentialSummaries.push({
                seaRegionClusterId,
                basinType,
                cellCount: cellIndices.length,
                analyzedFishingCellCount: shelfCellCount,
                meanShelfScore,
                shelfCellRatio: roundFieldValue(shelfCellRatio),
                shallowShelfRatio: roundFieldValue(shallowShelfRatio),
                coastalSlopeRatio,
                offshoreTransitionRatio,
                basinHabitatSupport,
                navigabilitySupport: roundFieldValue(navigabilitySupport),
                hazardRoughness: roundFieldValue(hazardRoughness),
                waterConditionSupport,
                adjacentLandEdgeRatio: roundFieldValue(adjacentLandEdgeRatio),
                meanTemperatureBias: roundFieldValue(meanTemperatureBias),
                meanHumidityBias: roundFieldValue(meanHumidityBias),
                meanSeasonalityBias: roundFieldValue(meanSeasonalityBias),
                dominantBandType: normalizeString(climateSummary.dominantBandType, ''),
                climateProductivitySupport,
                coastalNutrientSupport,
                shelfBiologySupport,
                fishingPotentialScore,
                fishingPotentialClass,
                peakFishingCellScore: roundFieldValue(peakFishingCellScore)
            });
        });

        const meanFishingPotential = roundFieldValue(
            fishingPotentialSummaries.reduce((total, summary) => total + summary.fishingPotentialScore, 0)
            / Math.max(1, fishingPotentialSummaries.length)
        );
        const richFishingClusterIds = fishingPotentialSummaries
            .filter((summary) => summary.fishingPotentialScore >= 0.58)
            .map((summary) => summary.seaRegionClusterId);
        const leadingFishingClusterId = fishingPotentialSummaries
            .slice()
            .sort((left, right) => {
                if (right.fishingPotentialScore !== left.fishingPotentialScore) {
                    return right.fishingPotentialScore - left.fishingPotentialScore;
                }
                return left.seaRegionClusterId.localeCompare(right.seaRegionClusterId);
            })
            .map((summary) => summary.seaRegionClusterId)[0] || '';
        const sourceFieldIds = [
            normalizeString(coastalShelfDepthField && coastalShelfDepthField.fieldId, '')
        ].filter(Boolean);
        const sourceOutputIds = [
            normalizeString(seaRegionClustersOutput && seaRegionClustersOutput.seaRegionClusterSetId, ''),
            normalizeString(seaNavigabilityTagging && seaNavigabilityTagging.seaNavigabilityTaggingId, ''),
            normalizeString(coastalDepthApproximation && coastalDepthApproximation.coastalDepthApproximationId, ''),
            normalizeString(regionalClimateSummaries && regionalClimateSummaries.outputId, '')
        ].filter(Boolean);
        const fishingPotentialField = serializeScalarField(
            FISHING_POTENTIAL_FIELD_ID,
            worldBounds,
            fishingValues,
            {
                stageId: FISHING_POTENTIAL_STAGE_ID,
                sourceFieldIds,
                sourceOutputIds,
                modelId: FISHING_POTENTIAL_MODEL_ID,
                maskEncoding: 'analyzedMaskValues',
                analyzedMaskValues,
                valueMeaning: '0 = deep/unanalyzed/non-fishing coastal water, 1 = strongest coarse fishing-potential support'
            }
        );
        const fishingPotentialAnalysis = {
            outputId: FISHING_POTENTIAL_ANALYSIS_ID,
            stageId: FISHING_POTENTIAL_STAGE_ID,
            deterministic: true,
            seedNamespace: 'macro.coastalOpportunity.fishingPotential',
            seed: context.seed,
            worldBounds: cloneValue(worldBounds),
            fishingPotentialFieldId: FISHING_POTENTIAL_FIELD_ID,
            modelId: FISHING_POTENTIAL_MODEL_ID,
            sourceFieldIds,
            sourceOutputIds,
            analyzedClusterCount: fishingPotentialSummaries.length,
            analyzedFishingCellCount: analyzedCellCount,
            meanFishingPotential,
            leadingFishingClusterId,
            richFishingClusterIds,
            fishingPotentialSummaries,
            summary: {
                abundantClusterCount: fishingPotentialSummaries.filter((summary) => summary.fishingPotentialClass === 'abundant').length,
                richClusterCount: fishingPotentialSummaries.filter((summary) => summary.fishingPotentialClass === 'rich').length,
                steadyClusterCount: fishingPotentialSummaries.filter((summary) => summary.fishingPotentialClass === 'steady').length,
                thinClusterCount: fishingPotentialSummaries.filter((summary) => summary.fishingPotentialClass === 'thin').length,
                poorClusterCount: fishingPotentialSummaries.filter((summary) => summary.fishingPotentialClass === 'poor').length
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        };

        return {
            field: fishingPotentialField,
            analysis: fishingPotentialAnalysis
        };
    }

    function buildShoreDefenseFieldAndAnalysis(input = {}, context = {}) {
        const seaRegionClustersOutput = findInputIntermediateOutput(input, 'seaRegionClusters');
        const coastalDepthApproximation = findInputIntermediateOutput(input, 'coastalDepthApproximation');
        const seaNavigabilityTagging = findInputIntermediateOutput(input, 'seaNavigabilityTagging');
        const coastalShelfDepthField = findInputField(input, 'coastalShelfDepthField');
        const stormCorridorField = findInputField(input, 'stormCorridorField');
        const coastalDecayBurdenField = findInputField(input, 'coastalDecayBurdenField');
        const worldBounds = normalizeWorldBounds(
            (coastalShelfDepthField && coastalShelfDepthField.worldBounds)
            || (seaRegionClustersOutput && seaRegionClustersOutput.worldBounds)
            || context.worldBounds
        );
        const size = worldBounds.width * worldBounds.height;
        const shoreDefenseValues = new Array(size).fill(0);
        const analyzedMaskValues = new Array(size).fill(0);
        const clusters = getClusterList(seaRegionClustersOutput, seaNavigabilityTagging);
        const zoneLookup = buildLookupById(
            coastalDepthApproximation && coastalDepthApproximation.shelfDepthZones,
            'seaRegionClusterId'
        );
        const shoreDefenseSummaries = [];
        let analyzedCellCount = 0;

        clusters.forEach((cluster, clusterIndex) => {
            const seaRegionClusterId = normalizeString(
                cluster.seaRegionClusterId,
                `seaRegionCluster_${String(clusterIndex + 1).padStart(3, '0')}`
            );
            const cellIndices = Array.isArray(cluster.cellIndices)
                ? cluster.cellIndices.map((cellIndex) => normalizeInteger(cellIndex, -1)).filter((cellIndex) => cellIndex >= 0 && cellIndex < size)
                : [];
            const clusterCellSet = new Set(cellIndices);
            const zoneSummary = zoneLookup.get(seaRegionClusterId) || {};
            const basinType = normalizeString(cluster.basinType, normalizeString(zoneSummary.basinType, ''));
            const basinShelter = scoreBasinShelter(basinType);
            const enclosureScore = extractEnclosureScore(cluster);
            const edgeExposure = extractEdgeExposure(cluster);
            const shorelineComplexity = extractShorelineComplexity(cluster);
            const navigabilitySupport = clampUnitInterval(
                cluster.navigability,
                clampUnitInterval(zoneSummary.meanShelfScore, 0.5)
            );
            const hazardRoughness = clampUnitInterval(
                cluster.hazardRoughness,
                clampUnitInterval(1 - navigabilitySupport, 0.24)
            );
            const shelfCellRatio = clampUnitInterval(zoneSummary.shelfCellRatio, 0);
            const shallowShelfRatio = clampUnitInterval(
                getNestedValue(zoneSummary, 'harborLandingPreparation.shallowShelfCellRatio'),
                shelfCellRatio
            );
            const coastalSlopeRatio = getZoneCountRatio(zoneSummary, 'coastal_slope');
            const offshoreTransitionRatio = getZoneCountRatio(zoneSummary, 'offshore_transition');
            let shelfScoreTotal = 0;
            let shelfCellCount = 0;
            let stormExposureTotal = 0;
            let stormSampleCount = 0;
            let coastalDecayTotal = 0;
            let coastalDecaySampleCount = 0;
            let peakShoreDefenseCellScore = 0;

            cellIndices.forEach((cellIndex) => {
                const localShelfScore = readFieldIndexValue(coastalShelfDepthField, cellIndex, 0);
                if (localShelfScore <= 0.02) {
                    return;
                }

                analyzedMaskValues[cellIndex] = 1;
                analyzedCellCount += 1;
                shelfScoreTotal += localShelfScore;
                shelfCellCount += 1;

                if (stormCorridorField) {
                    stormExposureTotal += readFieldIndexValue(stormCorridorField, cellIndex, 0);
                    stormSampleCount += 1;
                }

                const neighbors = getNeighborIndices(cellIndex, worldBounds.width, worldBounds.height);
                let localCoastalDecayTotal = 0;
                let localCoastalDecayCount = 0;
                neighbors.forEach((neighborIndex) => {
                    if (clusterCellSet.has(neighborIndex)) {
                        return;
                    }

                    const burden = readFieldIndexValue(coastalDecayBurdenField, neighborIndex, 0);
                    if (burden > 0.01) {
                        localCoastalDecayTotal += burden;
                        localCoastalDecayCount += 1;
                    }
                });

                if (localCoastalDecayCount > 0) {
                    coastalDecayTotal += (localCoastalDecayTotal / localCoastalDecayCount);
                    coastalDecaySampleCount += 1;
                }
            });

            const meanShelfScore = roundFieldValue(
                shelfScoreTotal / Math.max(1, shelfCellCount)
            );
            const meanStormExposure = roundFieldValue(
                stormExposureTotal / Math.max(1, stormSampleCount)
            );
            const meanCoastalDecayBurden = roundFieldValue(
                coastalDecayTotal / Math.max(1, coastalDecaySampleCount)
            );
            const containmentSupport = roundFieldValue(clampUnitInterval(
                (basinShelter * 0.34)
                + (enclosureScore * 0.3)
                + ((1 - edgeExposure) * 0.22)
                + (shorelineComplexity * 0.14),
                0
            ));
            const approachFrictionSupport = roundFieldValue(clampUnitInterval(
                ((1 - meanShelfScore) * 0.22)
                + ((1 - shallowShelfRatio) * 0.16)
                + (coastalSlopeRatio * 0.2)
                + ((1 - navigabilitySupport) * 0.18)
                + (hazardRoughness * 0.14)
                + (shorelineComplexity * 0.1),
                0
            ));
            const shorelinePersistenceSupport = roundFieldValue(clampUnitInterval(
                ((1 - meanStormExposure) * 0.46)
                + ((1 - meanCoastalDecayBurden) * 0.54),
                0
            ));
            const shoreDefenseScore = roundFieldValue(clampUnitInterval(
                (containmentSupport * 0.42)
                + (approachFrictionSupport * 0.34)
                + (shorelinePersistenceSupport * 0.24),
                0
            ));
            const shoreDefenseClass = classifyShoreDefense(shoreDefenseScore);

            cellIndices.forEach((cellIndex) => {
                const localShelfScore = readFieldIndexValue(coastalShelfDepthField, cellIndex, 0);
                if (localShelfScore <= 0.02) {
                    return;
                }

                const localStormExposure = stormCorridorField
                    ? readFieldIndexValue(stormCorridorField, cellIndex, meanStormExposure)
                    : meanStormExposure;
                const localDefenseSupport = clampUnitInterval(
                    (((1 - localShelfScore) * 0.44)
                    + (coastalSlopeRatio * 0.18)
                    + (hazardRoughness * 0.2)
                    + ((1 - localStormExposure) * 0.18)),
                    0
                );
                const localShoreDefenseScore = roundFieldValue(clampUnitInterval(
                    shoreDefenseScore * (0.34 + (localDefenseSupport * 0.66)),
                    0
                ));
                shoreDefenseValues[cellIndex] = Math.max(shoreDefenseValues[cellIndex], localShoreDefenseScore);
                peakShoreDefenseCellScore = Math.max(peakShoreDefenseCellScore, localShoreDefenseScore);
            });

            shoreDefenseSummaries.push({
                seaRegionClusterId,
                basinType,
                cellCount: cellIndices.length,
                analyzedDefenseCellCount: shelfCellCount,
                meanShelfScore,
                shelfCellRatio: roundFieldValue(shelfCellRatio),
                shallowShelfRatio: roundFieldValue(shallowShelfRatio),
                coastalSlopeRatio,
                offshoreTransitionRatio,
                enclosureScore: roundFieldValue(enclosureScore),
                edgeExposure: roundFieldValue(edgeExposure),
                shorelineComplexity: roundFieldValue(shorelineComplexity),
                containmentSupport,
                navigabilitySupport: roundFieldValue(navigabilitySupport),
                hazardRoughness: roundFieldValue(hazardRoughness),
                approachFrictionSupport,
                meanStormExposure,
                meanCoastalDecayBurden,
                shorelinePersistenceSupport,
                shoreDefenseScore,
                shoreDefenseClass,
                peakShoreDefenseCellScore: roundFieldValue(peakShoreDefenseCellScore)
            });
        });

        const meanShoreDefense = roundFieldValue(
            shoreDefenseSummaries.reduce((total, summary) => total + summary.shoreDefenseScore, 0)
            / Math.max(1, shoreDefenseSummaries.length)
        );
        const strongDefenseClusterIds = shoreDefenseSummaries
            .filter((summary) => summary.shoreDefenseScore >= 0.56)
            .map((summary) => summary.seaRegionClusterId);
        const leadingShoreDefenseClusterId = shoreDefenseSummaries
            .slice()
            .sort((left, right) => {
                if (right.shoreDefenseScore !== left.shoreDefenseScore) {
                    return right.shoreDefenseScore - left.shoreDefenseScore;
                }
                return left.seaRegionClusterId.localeCompare(right.seaRegionClusterId);
            })
            .map((summary) => summary.seaRegionClusterId)[0] || '';
        const sourceFieldIds = [
            normalizeString(coastalShelfDepthField && coastalShelfDepthField.fieldId, ''),
            normalizeString(stormCorridorField && stormCorridorField.fieldId, ''),
            normalizeString(coastalDecayBurdenField && coastalDecayBurdenField.fieldId, '')
        ].filter(Boolean);
        const sourceOutputIds = [
            normalizeString(seaRegionClustersOutput && seaRegionClustersOutput.seaRegionClusterSetId, ''),
            normalizeString(seaNavigabilityTagging && seaNavigabilityTagging.seaNavigabilityTaggingId, ''),
            normalizeString(coastalDepthApproximation && coastalDepthApproximation.coastalDepthApproximationId, '')
        ].filter(Boolean);
        const shoreDefenseField = serializeScalarField(
            SHORE_DEFENSE_FIELD_ID,
            worldBounds,
            shoreDefenseValues,
            {
                stageId: SHORE_DEFENSE_STAGE_ID,
                sourceFieldIds,
                sourceOutputIds,
                modelId: SHORE_DEFENSE_MODEL_ID,
                maskEncoding: 'analyzedMaskValues',
                analyzedMaskValues,
                valueMeaning: '0 = deep/unanalyzed/non-defense coastal water, 1 = strongest coarse natural shore-defense support'
            }
        );
        const shoreDefenseAnalysis = {
            outputId: SHORE_DEFENSE_ANALYSIS_ID,
            stageId: SHORE_DEFENSE_STAGE_ID,
            deterministic: true,
            seedNamespace: 'macro.coastalOpportunity.shoreDefense',
            seed: context.seed,
            worldBounds: cloneValue(worldBounds),
            shoreDefenseFieldId: SHORE_DEFENSE_FIELD_ID,
            modelId: SHORE_DEFENSE_MODEL_ID,
            sourceFieldIds,
            sourceOutputIds,
            analyzedClusterCount: shoreDefenseSummaries.length,
            analyzedDefenseCellCount: analyzedCellCount,
            meanShoreDefense,
            leadingShoreDefenseClusterId,
            strongDefenseClusterIds,
            shoreDefenseSummaries,
            summary: {
                shieldedClusterCount: shoreDefenseSummaries.filter((summary) => summary.shoreDefenseClass === 'shielded').length,
                bufferedClusterCount: shoreDefenseSummaries.filter((summary) => summary.shoreDefenseClass === 'buffered').length,
                mixedClusterCount: shoreDefenseSummaries.filter((summary) => summary.shoreDefenseClass === 'mixed').length,
                openClusterCount: shoreDefenseSummaries.filter((summary) => summary.shoreDefenseClass === 'open').length,
                exposedClusterCount: shoreDefenseSummaries.filter((summary) => summary.shoreDefenseClass === 'exposed').length
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        };

        return {
            field: shoreDefenseField,
            analysis: shoreDefenseAnalysis
        };
    }

    function buildInlandLinkFieldAndAnalysis(input = {}, context = {}) {
        const seaRegionClustersOutput = findInputIntermediateOutput(input, 'seaRegionClusters');
        const coastalDepthApproximation = findInputIntermediateOutput(input, 'coastalDepthApproximation');
        const seaNavigabilityTagging = findInputIntermediateOutput(input, 'seaNavigabilityTagging');
        const coastalShelfDepthField = findInputField(input, 'coastalShelfDepthField');
        const watershedSegmentation = findInputIntermediateOutput(input, 'watershedSegmentation');
        const majorRiverCandidates = findInputIntermediateOutput(input, 'majorRiverCandidates');
        const flowAccumulationField = findInputField(input, 'flowAccumulationField');
        const continentBodies = findInputIntermediateOutput(input, 'continentBodies');
        const continentalCohesionSummaries = findInputIntermediateOutput(input, 'continentalCohesionSummaries');
        const worldBounds = normalizeWorldBounds(
            (coastalShelfDepthField && coastalShelfDepthField.worldBounds)
            || (flowAccumulationField && flowAccumulationField.worldBounds)
            || (seaRegionClustersOutput && seaRegionClustersOutput.worldBounds)
            || context.worldBounds
        );
        const size = worldBounds.width * worldBounds.height;
        const inlandLinkValues = new Array(size).fill(0);
        const analyzedMaskValues = new Array(size).fill(0);
        const clusters = getClusterList(seaRegionClustersOutput, seaNavigabilityTagging);
        const zoneLookup = buildLookupById(
            coastalDepthApproximation && coastalDepthApproximation.shelfDepthZones,
            'seaRegionClusterId'
        );
        const continentCellLookup = buildContinentCellLookup(continentBodies, size);
        const continentCohesionLookup = buildContinentCohesionLookup(continentalCohesionSummaries);
        const seaRegionIdentityLookup = buildSeaRegionIdentityLookup(seaRegionClustersOutput, seaNavigabilityTagging);
        const clusterCellLookup = buildClusterCellLookup(seaRegionClustersOutput, seaNavigabilityTagging, size);
        const watershedByRiverBasinId = new Map();
        const watersheds = Array.isArray(watershedSegmentation && watershedSegmentation.watersheds)
            ? watershedSegmentation.watersheds
            : [];
        const hydrologyByClusterId = new Map();
        const inlandLinkSummaries = [];
        let analyzedCellCount = 0;

        function getHydrologyAccumulator(clusterId = '') {
            if (!hydrologyByClusterId.has(clusterId)) {
                hydrologyByClusterId.set(clusterId, {
                    majorRiverCandidateIds: new Set(),
                    watershedIds: new Set(),
                    mouthCellIndices: new Set(),
                    dischargeTotal: 0,
                    candidateScoreTotal: 0,
                    mouthAccumulationTotal: 0,
                    normalizedWatershedAreaTotal: 0,
                    basinContinuityTotal: 0,
                    headwaterScoreTotal: 0
                });
            }
            return hydrologyByClusterId.get(clusterId);
        }

        watersheds.forEach((watershed) => {
            const riverBasinId = normalizeString(getNestedValue(watershed, 'recordDraft.riverBasinId'), '');
            if (riverBasinId) {
                watershedByRiverBasinId.set(riverBasinId, watershed);
            }

            const clusterIds = new Set();
            const terminalClusterId = normalizeString(getNestedValue(watershed, 'terminalWaterHint.seaRegionClusterId'), '');
            if (terminalClusterId) {
                clusterIds.add(terminalClusterId);
            }
            normalizeStringList(getNestedValue(watershed, 'terminalWaterHint.terminalSeaRegionIds')).forEach((seaRegionId) => {
                const clusterId = seaRegionIdentityLookup.seaRegionIdToClusterId.get(seaRegionId);
                if (clusterId) {
                    clusterIds.add(clusterId);
                }
            });
            normalizeStringList(getNestedValue(watershed, 'recordDraft.terminalSeaRegionIds')).forEach((seaRegionId) => {
                const clusterId = seaRegionIdentityLookup.seaRegionIdToClusterId.get(seaRegionId);
                if (clusterId) {
                    clusterIds.add(clusterId);
                }
            });

            if (!clusterIds.size) {
                return;
            }

            const normalizedWatershedArea = clampUnitInterval(watershed.normalizedArea, 0);
            const basinContinuity = clampUnitInterval(
                getNestedValue(watershed, 'recordDraft.basinContinuity'),
                clampUnitInterval(watershed.compactness, 0.5)
            );
            const headwaterScore = clampUnitInterval(getNestedValue(watershed, 'headwaterHint.score'), 0);
            clusterIds.forEach((clusterId) => {
                const accumulator = getHydrologyAccumulator(clusterId);
                accumulator.watershedIds.add(normalizeString(watershed.watershedId, ''));
                accumulator.normalizedWatershedAreaTotal += normalizedWatershedArea;
                accumulator.basinContinuityTotal += basinContinuity;
                accumulator.headwaterScoreTotal += headwaterScore;
            });
        });

        const riverCandidates = Array.isArray(majorRiverCandidates && majorRiverCandidates.majorRiverCandidates)
            ? majorRiverCandidates.majorRiverCandidates
            : [];
        riverCandidates.forEach((candidate) => {
            const clusterIds = new Set();
            normalizeStringList(candidate.terminalSeaRegionIds).forEach((seaRegionId) => {
                const clusterId = seaRegionIdentityLookup.seaRegionIdToClusterId.get(seaRegionId);
                if (clusterId) {
                    clusterIds.add(clusterId);
                }
            });

            const watershed = watershedByRiverBasinId.get(normalizeString(candidate.riverBasinIdHint, '')) || null;
            const watershedClusterId = normalizeString(getNestedValue(watershed, 'terminalWaterHint.seaRegionClusterId'), '');
            if (watershedClusterId) {
                clusterIds.add(watershedClusterId);
            }

            const mouthCellIndex = normalizeInteger(candidate.mouthCellIndex, -1);
            if (mouthCellIndex >= 0) {
                const directClusterId = clusterCellLookup.get(mouthCellIndex);
                if (directClusterId) {
                    clusterIds.add(directClusterId);
                }
                getNeighborIndices(mouthCellIndex, worldBounds.width, worldBounds.height).forEach((neighborIndex) => {
                    const neighborClusterId = clusterCellLookup.get(neighborIndex);
                    if (neighborClusterId) {
                        clusterIds.add(neighborClusterId);
                    }
                });
            }

            if (!clusterIds.size) {
                return;
            }

            const normalizedDischarge = clampUnitInterval(candidate.normalizedDischarge, 0);
            const candidateScore = clampUnitInterval(candidate.candidateScore, normalizedDischarge);
            const mouthAccumulation = mouthCellIndex >= 0
                ? readFieldIndexValue(flowAccumulationField, mouthCellIndex, normalizedDischarge)
                : normalizedDischarge;

            clusterIds.forEach((clusterId) => {
                const accumulator = getHydrologyAccumulator(clusterId);
                accumulator.majorRiverCandidateIds.add(normalizeString(candidate.majorRiverCandidateId, ''));
                if (mouthCellIndex >= 0) {
                    accumulator.mouthCellIndices.add(mouthCellIndex);
                }
                accumulator.dischargeTotal += normalizedDischarge;
                accumulator.candidateScoreTotal += candidateScore;
                accumulator.mouthAccumulationTotal += mouthAccumulation;
            });
        });

        clusters.forEach((cluster, clusterIndex) => {
            const seaRegionClusterId = normalizeString(
                cluster.seaRegionClusterId,
                `seaRegionCluster_${String(clusterIndex + 1).padStart(3, '0')}`
            );
            const cellIndices = Array.isArray(cluster.cellIndices)
                ? cluster.cellIndices.map((cellIndex) => normalizeInteger(cellIndex, -1)).filter((cellIndex) => cellIndex >= 0 && cellIndex < size)
                : [];
            const zoneSummary = zoneLookup.get(seaRegionClusterId) || {};
            const hydrology = hydrologyByClusterId.get(seaRegionClusterId) || {};
            const continentId = resolveClusterContinentId(cluster, continentCellLookup, worldBounds);
            const cohesionSummary = continentCohesionLookup.get(continentId) || {};
            const meanContinentalCohesion = clampUnitInterval(cohesionSummary.meanContinentalCohesion, 0.45);
            const meanInteriorPassability = clampUnitInterval(cohesionSummary.meanInteriorPassability, meanContinentalCohesion);
            const linkedMajorRiverCount = hydrology.majorRiverCandidateIds instanceof Set
                ? hydrology.majorRiverCandidateIds.size
                : 0;
            const linkedWatershedCount = hydrology.watershedIds instanceof Set
                ? hydrology.watershedIds.size
                : 0;
            const candidateCountSupport = roundFieldValue(clampUnitInterval(linkedMajorRiverCount / 3, 0));
            const watershedCountSupport = roundFieldValue(clampUnitInterval(linkedWatershedCount / 4, 0));
            const meanDischarge = roundFieldValue(
                (Number(hydrology.dischargeTotal) || 0) / Math.max(1, linkedMajorRiverCount)
            );
            const meanCandidateScore = roundFieldValue(
                (Number(hydrology.candidateScoreTotal) || 0) / Math.max(1, linkedMajorRiverCount)
            );
            const meanMouthAccumulation = roundFieldValue(
                (Number(hydrology.mouthAccumulationTotal) || 0) / Math.max(1, linkedMajorRiverCount)
            );
            const normalizedWatershedArea = roundFieldValue(clampUnitInterval(Number(hydrology.normalizedWatershedAreaTotal) || 0, 0));
            const meanBasinContinuity = roundFieldValue(clampUnitInterval(
                (Number(hydrology.basinContinuityTotal) || 0) / Math.max(1, linkedWatershedCount),
                0.5
            ));
            const meanHeadwaterScore = roundFieldValue(clampUnitInterval(
                (Number(hydrology.headwaterScoreTotal) || 0) / Math.max(1, linkedWatershedCount),
                0
            ));
            let shelfScoreTotal = 0;
            let shelfCellCount = 0;
            let peakInlandLinkCellScore = 0;

            cellIndices.forEach((cellIndex) => {
                const localShelfScore = readFieldIndexValue(coastalShelfDepthField, cellIndex, 0);
                if (localShelfScore <= 0.02) {
                    return;
                }

                analyzedMaskValues[cellIndex] = 1;
                analyzedCellCount += 1;
                shelfScoreTotal += localShelfScore;
                shelfCellCount += 1;
            });

            const meanShelfScore = roundFieldValue(
                shelfScoreTotal / Math.max(1, shelfCellCount)
            );
            const hydrologyAnchorSupport = roundFieldValue(clampUnitInterval(
                (candidateCountSupport * 0.56)
                + (watershedCountSupport * 0.44),
                0
            ));
            const riverMouthSupport = roundFieldValue(clampUnitInterval(
                (meanDischarge * 0.38)
                + (meanCandidateScore * 0.34)
                + (meanMouthAccumulation * 0.16)
                + (candidateCountSupport * 0.12),
                0
            ));
            const watershedReachSupport = roundFieldValue(clampUnitInterval(
                (normalizedWatershedArea * 0.46)
                + (meanBasinContinuity * 0.3)
                + (meanHeadwaterScore * 0.24),
                0
            ));
            const interiorCohesionSupport = roundFieldValue(clampUnitInterval(
                (meanContinentalCohesion * 0.56)
                + (meanInteriorPassability * 0.44),
                0
            ));
            const coastalNodeProxySupport = roundFieldValue(clampUnitInterval(
                (meanShelfScore * 0.62)
                + (candidateCountSupport * 0.22)
                + (watershedCountSupport * 0.16),
                0
            ));
            const inlandLinkBase = roundFieldValue(clampUnitInterval(
                (riverMouthSupport * 0.36)
                + (watershedReachSupport * 0.3)
                + (interiorCohesionSupport * 0.22)
                + (coastalNodeProxySupport * 0.12),
                0
            ));
            const inlandLinkBonusScore = roundFieldValue(clampUnitInterval(
                inlandLinkBase * (0.25 + (hydrologyAnchorSupport * 0.75)),
                0
            ));
            const inlandLinkClass = classifyInlandLink(inlandLinkBonusScore);

            cellIndices.forEach((cellIndex) => {
                const localShelfScore = readFieldIndexValue(coastalShelfDepthField, cellIndex, 0);
                if (localShelfScore <= 0.02) {
                    return;
                }

                const localCoastalAnchorSupport = clampUnitInterval(
                    (localShelfScore * 0.46)
                    + (candidateCountSupport * 0.2)
                    + (meanDischarge * 0.18)
                    + (interiorCohesionSupport * 0.16),
                    0
                );
                const localInlandLinkScore = roundFieldValue(clampUnitInterval(
                    inlandLinkBonusScore * (0.34 + (localCoastalAnchorSupport * 0.66)),
                    0
                ));
                inlandLinkValues[cellIndex] = Math.max(inlandLinkValues[cellIndex], localInlandLinkScore);
                peakInlandLinkCellScore = Math.max(peakInlandLinkCellScore, localInlandLinkScore);
            });

            inlandLinkSummaries.push({
                seaRegionClusterId,
                continentId,
                basinType: normalizeString(cluster.basinType, normalizeString(zoneSummary.basinType, '')),
                cellCount: cellIndices.length,
                analyzedInlandLinkCellCount: shelfCellCount,
                meanShelfScore,
                linkedMajorRiverCount,
                linkedWatershedCount,
                meanNormalizedDischarge: meanDischarge,
                meanMajorRiverCandidateScore: meanCandidateScore,
                meanMouthAccumulation,
                normalizedWatershedArea,
                meanBasinContinuity,
                meanHeadwaterScore,
                meanContinentalCohesion: roundFieldValue(meanContinentalCohesion),
                meanInteriorPassability: roundFieldValue(meanInteriorPassability),
                hydrologyAnchorSupport,
                riverMouthSupport,
                watershedReachSupport,
                interiorCohesionSupport,
                coastalNodeProxySupport,
                inlandLinkBonusScore,
                inlandLinkClass,
                peakInlandLinkCellScore: roundFieldValue(peakInlandLinkCellScore)
            });
        });

        const meanInlandLinkBonus = roundFieldValue(
            inlandLinkSummaries.reduce((total, summary) => total + summary.inlandLinkBonusScore, 0)
            / Math.max(1, inlandLinkSummaries.length)
        );
        const strongInlandLinkClusterIds = inlandLinkSummaries
            .filter((summary) => summary.inlandLinkBonusScore >= 0.54)
            .map((summary) => summary.seaRegionClusterId);
        const leadingInlandLinkClusterId = inlandLinkSummaries
            .slice()
            .sort((left, right) => {
                if (right.inlandLinkBonusScore !== left.inlandLinkBonusScore) {
                    return right.inlandLinkBonusScore - left.inlandLinkBonusScore;
                }
                return left.seaRegionClusterId.localeCompare(right.seaRegionClusterId);
            })
            .map((summary) => summary.seaRegionClusterId)[0] || '';
        const sourceFieldIds = [
            normalizeString(coastalShelfDepthField && coastalShelfDepthField.fieldId, ''),
            normalizeString(flowAccumulationField && flowAccumulationField.fieldId, '')
        ].filter(Boolean);
        const sourceOutputIds = [
            normalizeString(seaRegionClustersOutput && seaRegionClustersOutput.seaRegionClusterSetId, ''),
            normalizeString(seaNavigabilityTagging && seaNavigabilityTagging.seaNavigabilityTaggingId, ''),
            normalizeString(coastalDepthApproximation && coastalDepthApproximation.coastalDepthApproximationId, ''),
            normalizeString(watershedSegmentation && watershedSegmentation.watershedSegmentationId, ''),
            normalizeString(majorRiverCandidates && majorRiverCandidates.majorRiverCandidatesId, ''),
            normalizeString(continentalCohesionSummaries && continentalCohesionSummaries.outputId, '')
        ].filter(Boolean);
        const inlandLinkField = serializeScalarField(
            INLAND_LINK_FIELD_ID,
            worldBounds,
            inlandLinkValues,
            {
                stageId: INLAND_LINK_STAGE_ID,
                sourceFieldIds,
                sourceOutputIds,
                modelId: INLAND_LINK_MODEL_ID,
                maskEncoding: 'analyzedMaskValues',
                analyzedMaskValues,
                valueMeaning: '0 = deep/unanalyzed/non-linked coastal water, 1 = strongest coarse inland-link bonus support'
            }
        );
        const inlandLinkAnalysis = {
            outputId: INLAND_LINK_ANALYSIS_ID,
            stageId: INLAND_LINK_STAGE_ID,
            deterministic: true,
            seedNamespace: 'macro.coastalOpportunity.inlandLink',
            seed: context.seed,
            worldBounds: cloneValue(worldBounds),
            inlandLinkFieldId: INLAND_LINK_FIELD_ID,
            modelId: INLAND_LINK_MODEL_ID,
            sourceFieldIds,
            sourceOutputIds,
            analyzedClusterCount: inlandLinkSummaries.length,
            analyzedInlandLinkCellCount: analyzedCellCount,
            meanInlandLinkBonus,
            leadingInlandLinkClusterId,
            strongInlandLinkClusterIds,
            inlandLinkSummaries,
            summary: {
                strongClusterCount: inlandLinkSummaries.filter((summary) => summary.inlandLinkClass === 'strong').length,
                linkedClusterCount: inlandLinkSummaries.filter((summary) => summary.inlandLinkClass === 'linked').length,
                partialClusterCount: inlandLinkSummaries.filter((summary) => summary.inlandLinkClass === 'partial').length,
                weakClusterCount: inlandLinkSummaries.filter((summary) => summary.inlandLinkClass === 'weak').length,
                isolatedClusterCount: inlandLinkSummaries.filter((summary) => summary.inlandLinkClass === 'isolated').length,
                directCoastalNodeCandidatesAvailable: false,
                coastalNodeProxyMode: 'shelfAndRiverMouthProxy'
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        };

        return {
            field: inlandLinkField,
            analysis: inlandLinkAnalysis
        };
    }

    function buildCoastalOpportunityCompositeAndNodes(input = {}, context = {}) {
        const seaRegionClustersOutput = findInputIntermediateOutput(input, 'seaRegionClusters');
        const seaNavigabilityTagging = findInputIntermediateOutput(input, 'seaNavigabilityTagging');
        const worldBounds = normalizeWorldBounds(
            context.worldBounds
            || getNestedValue(context, 'harborQuality.field.worldBounds')
            || getNestedValue(context, 'landingEase.field.worldBounds')
            || getNestedValue(context, 'fishingPotential.field.worldBounds')
            || getNestedValue(context, 'shoreDefense.field.worldBounds')
            || getNestedValue(context, 'inlandLink.field.worldBounds')
        );
        const size = worldBounds.width * worldBounds.height;
        const componentFields = {
            harborQuality: context.harborQuality && context.harborQuality.field,
            landingEase: context.landingEase && context.landingEase.field,
            fishingPotential: context.fishingPotential && context.fishingPotential.field,
            shoreDefense: context.shoreDefense && context.shoreDefense.field,
            inlandLink: context.inlandLink && context.inlandLink.field
        };
        const analyzedMaskValues = new Array(size).fill(0);
        const coastalOpportunityValues = new Array(size).fill(0);

        for (let cellIndex = 0; cellIndex < size; cellIndex += 1) {
            const harborQuality = readFieldIndexValue(componentFields.harborQuality, cellIndex, 0);
            const landingEase = readFieldIndexValue(componentFields.landingEase, cellIndex, 0);
            const fishingPotential = readFieldIndexValue(componentFields.fishingPotential, cellIndex, 0);
            const shoreDefense = readFieldIndexValue(componentFields.shoreDefense, cellIndex, 0);
            const inlandLink = readFieldIndexValue(componentFields.inlandLink, cellIndex, 0);
            const compositeValue = roundFieldValue(clampUnitInterval(
                (harborQuality * COASTAL_OPPORTUNITY_COMPONENT_WEIGHTS.harborQuality)
                + (landingEase * COASTAL_OPPORTUNITY_COMPONENT_WEIGHTS.landingEase)
                + (fishingPotential * COASTAL_OPPORTUNITY_COMPONENT_WEIGHTS.fishingPotential)
                + (shoreDefense * COASTAL_OPPORTUNITY_COMPONENT_WEIGHTS.shoreDefense)
                + (inlandLink * COASTAL_OPPORTUNITY_COMPONENT_WEIGHTS.inlandLink),
                0
            ));

            coastalOpportunityValues[cellIndex] = compositeValue;
            if (
                harborQuality > 0.01
                || landingEase > 0.01
                || fishingPotential > 0.01
                || shoreDefense > 0.01
                || inlandLink > 0.01
            ) {
                analyzedMaskValues[cellIndex] = 1;
            }
        }

        const sourceFieldIds = Object.values(componentFields)
            .map((field) => normalizeString(field && field.fieldId, ''))
            .filter(Boolean);
        const sourceOutputIds = [
            normalizeString(context.harborQuality && context.harborQuality.analysis && context.harborQuality.analysis.outputId, ''),
            normalizeString(context.landingEase && context.landingEase.analysis && context.landingEase.analysis.outputId, ''),
            normalizeString(context.fishingPotential && context.fishingPotential.analysis && context.fishingPotential.analysis.outputId, ''),
            normalizeString(context.shoreDefense && context.shoreDefense.analysis && context.shoreDefense.analysis.outputId, ''),
            normalizeString(context.inlandLink && context.inlandLink.analysis && context.inlandLink.analysis.outputId, ''),
            normalizeString(seaRegionClustersOutput && seaRegionClustersOutput.seaRegionClusterSetId, ''),
            normalizeString(seaNavigabilityTagging && seaNavigabilityTagging.seaNavigabilityTaggingId, '')
        ].filter(Boolean);
        const coastalOpportunityMap = serializeScalarField(
            COASTAL_OPPORTUNITY_MAP_ID,
            worldBounds,
            coastalOpportunityValues,
            {
                stageId: COMPOSITE_SYNTHESIS_STAGE_ID,
                sourceFieldIds,
                sourceOutputIds,
                modelId: COASTAL_OPPORTUNITY_COMPOSITE_MODEL_ID,
                maskEncoding: 'analyzedMaskValues',
                analyzedMaskValues,
                componentWeights: cloneValue(COASTAL_OPPORTUNITY_COMPONENT_WEIGHTS),
                valueMeaning: '0 = low composite coastal-opportunity support, 1 = strongest analyzer-local composite support'
            }
        );

        const harborSummaryLookup = buildComponentSummaryLookup(
            getNestedValue(context, 'harborQuality.analysis.harborQualitySummaries'),
            'seaRegionClusterId'
        );
        const landingSummaryLookup = buildComponentSummaryLookup(
            getNestedValue(context, 'landingEase.analysis.landingEaseSummaries'),
            'seaRegionClusterId'
        );
        const fishingSummaryLookup = buildComponentSummaryLookup(
            getNestedValue(context, 'fishingPotential.analysis.fishingPotentialSummaries'),
            'seaRegionClusterId'
        );
        const defenseSummaryLookup = buildComponentSummaryLookup(
            getNestedValue(context, 'shoreDefense.analysis.shoreDefenseSummaries'),
            'seaRegionClusterId'
        );
        const inlandSummaryLookup = buildComponentSummaryLookup(
            getNestedValue(context, 'inlandLink.analysis.inlandLinkSummaries'),
            'seaRegionClusterId'
        );
        const clusters = getClusterList(seaRegionClustersOutput, seaNavigabilityTagging);

        const clusterProfiles = clusters.map((cluster, clusterIndex) => {
            const seaRegionClusterId = normalizeString(
                cluster.seaRegionClusterId,
                `seaRegionCluster_${String(clusterIndex + 1).padStart(3, '0')}`
            );
            const harborSummary = harborSummaryLookup.get(seaRegionClusterId) || {};
            const landingSummary = landingSummaryLookup.get(seaRegionClusterId) || {};
            const fishingSummary = fishingSummaryLookup.get(seaRegionClusterId) || {};
            const defenseSummary = defenseSummaryLookup.get(seaRegionClusterId) || {};
            const inlandSummary = inlandSummaryLookup.get(seaRegionClusterId) || {};
            const componentScores = {
                harborQuality: clampUnitInterval(harborSummary.harborQualityScore, 0),
                landingEase: clampUnitInterval(landingSummary.landingEaseScore, 0),
                fishingPotential: clampUnitInterval(fishingSummary.fishingPotentialScore, 0),
                shoreDefense: clampUnitInterval(defenseSummary.shoreDefenseScore, 0),
                inlandLink: clampUnitInterval(inlandSummary.inlandLinkBonusScore, 0)
            };
            const dominantDriverIds = deriveDominantDriverIds(componentScores);
            const rankedDriverScores = Object.values(componentScores)
                .slice()
                .sort((left, right) => right - left);
            const topDriverMean = roundFieldValue(
                ((rankedDriverScores[0] || 0) + (rankedDriverScores[1] || 0)) / Math.max(1, Math.min(2, rankedDriverScores.length))
            );
            const highSupportDriverCount = Object.values(componentScores)
                .filter((score) => clampUnitInterval(score, 0) >= 0.58)
                .length;
            const supportiveDriverCount = Object.values(componentScores)
                .filter((score) => clampUnitInterval(score, 0) >= 0.42)
                .length;
            const baseComposite = roundFieldValue(clampUnitInterval(
                (componentScores.harborQuality * COASTAL_OPPORTUNITY_COMPONENT_WEIGHTS.harborQuality)
                + (componentScores.landingEase * COASTAL_OPPORTUNITY_COMPONENT_WEIGHTS.landingEase)
                + (componentScores.fishingPotential * COASTAL_OPPORTUNITY_COMPONENT_WEIGHTS.fishingPotential)
                + (componentScores.shoreDefense * COASTAL_OPPORTUNITY_COMPONENT_WEIGHTS.shoreDefense)
                + (componentScores.inlandLink * COASTAL_OPPORTUNITY_COMPONENT_WEIGHTS.inlandLink),
                0
            ));
            const coastalOpportunityScore = roundFieldValue(clampUnitInterval(
                (baseComposite * 0.84)
                + (topDriverMean * 0.1)
                + ((supportiveDriverCount / 5) * 0.06),
                0
            ));
            const exceptionalityScore = roundFieldValue(clampUnitInterval(
                (coastalOpportunityScore * 0.74)
                + (topDriverMean * 0.16)
                + ((highSupportDriverCount / 5) * 0.1),
                0
            ));
            const cellIndices = Array.isArray(cluster.cellIndices)
                ? cluster.cellIndices.map((cellIndex) => normalizeInteger(cellIndex, -1)).filter((cellIndex) => cellIndex >= 0 && cellIndex < size)
                : [];
            let analyzedCellCount = 0;
            let meanCompositeTotal = 0;
            let anchorCellIndex = cellIndices.length ? cellIndices[0] : -1;
            let peakCompositeCellScore = 0;

            cellIndices.forEach((cellIndex) => {
                const compositeValue = coastalOpportunityValues[cellIndex] || 0;
                if (compositeValue > 0.01) {
                    analyzedCellCount += 1;
                    meanCompositeTotal += compositeValue;
                }
                if (compositeValue >= peakCompositeCellScore) {
                    peakCompositeCellScore = compositeValue;
                    anchorCellIndex = cellIndex;
                }
            });

            const anchor = createPointFromCellIndex(anchorCellIndex, worldBounds);

            return {
                seaRegionClusterId,
                continentId: normalizeString(inlandSummary.continentId, ''),
                basinType: normalizeString(
                    cluster.basinType,
                    normalizeString(harborSummary.basinType, normalizeString(fishingSummary.basinType, ''))
                ),
                cellCount: cellIndices.length,
                analyzedCoastalCellCount: analyzedCellCount,
                meanCoastalOpportunityCellScore: roundFieldValue(
                    meanCompositeTotal / Math.max(1, analyzedCellCount)
                ),
                peakCoastalOpportunityCellScore: roundFieldValue(peakCompositeCellScore),
                anchorCellIndex: anchor.cellIndex,
                anchorPoint: anchor.point,
                normalizedAnchorPoint: anchor.normalizedPoint,
                harborQualityScore: roundFieldValue(componentScores.harborQuality),
                landingEaseScore: roundFieldValue(componentScores.landingEase),
                fishingPotentialScore: roundFieldValue(componentScores.fishingPotential),
                shoreDefenseScore: roundFieldValue(componentScores.shoreDefense),
                inlandLinkBonusScore: roundFieldValue(componentScores.inlandLink),
                dominantDepthZone: normalizeString(
                    harborSummary.dominantDepthZone,
                    normalizeString(landingSummary.dominantDepthZone, '')
                ),
                dominantBandType: normalizeString(fishingSummary.dominantBandType, ''),
                dominantDriverIds,
                supportiveDriverCount,
                highSupportDriverCount,
                coastalOpportunityScore,
                coastalOpportunityClass: classifyCoastalOpportunity(coastalOpportunityScore),
                exceptionalityScore,
                exceptionalityClass: classifyExceptionalCoastalNode(exceptionalityScore),
                futureRouteGraphInput: true,
                futureStrategicLayerInput: true
            };
        }).sort((left, right) => {
            if (right.exceptionalityScore !== left.exceptionalityScore) {
                return right.exceptionalityScore - left.exceptionalityScore;
            }
            if (right.coastalOpportunityScore !== left.coastalOpportunityScore) {
                return right.coastalOpportunityScore - left.coastalOpportunityScore;
            }
            return left.seaRegionClusterId.localeCompare(right.seaRegionClusterId);
        });

        const thresholdSelectedProfiles = clusterProfiles.filter((profile) => (
            profile.exceptionalityScore >= 0.68
            || (profile.coastalOpportunityScore >= 0.62 && profile.highSupportDriverCount >= 3)
        ));
        let fallbackSelectionApplied = false;
        let selectedProfiles = thresholdSelectedProfiles;
        if (!selectedProfiles.length && clusterProfiles.length && clusterProfiles[0].exceptionalityScore >= 0.52) {
            selectedProfiles = [clusterProfiles[0]];
            fallbackSelectionApplied = true;
        }
        selectedProfiles = selectedProfiles.slice(0, 8);

        const exceptionalCoastalNodes = selectedProfiles.map((profile, nodeIndex) => ({
            coastalNodeId: `exceptional_coastal_node_${String(nodeIndex + 1).padStart(3, '0')}`,
            nodeRank: nodeIndex + 1,
            selectionMode: fallbackSelectionApplied ? 'fallback_best_available' : 'threshold_selected',
            seaRegionClusterId: profile.seaRegionClusterId,
            continentId: profile.continentId,
            basinType: profile.basinType,
            anchorCellIndex: profile.anchorCellIndex,
            anchorPoint: cloneValue(profile.anchorPoint),
            normalizedAnchorPoint: cloneValue(profile.normalizedAnchorPoint),
            coastalOpportunityScore: profile.coastalOpportunityScore,
            exceptionalityScore: profile.exceptionalityScore,
            exceptionalityClass: profile.exceptionalityClass,
            dominantDriverIds: profile.dominantDriverIds.slice(),
            harborQualityScore: profile.harborQualityScore,
            landingEaseScore: profile.landingEaseScore,
            fishingPotentialScore: profile.fishingPotentialScore,
            shoreDefenseScore: profile.shoreDefenseScore,
            inlandLinkBonusScore: profile.inlandLinkBonusScore,
            futureRouteGraphInput: true,
            futureStrategicLayerInput: true,
            connectivityGraphBuilt: false
        }));

        const meanCoastalOpportunity = roundFieldValue(
            clusterProfiles.reduce((total, profile) => total + profile.coastalOpportunityScore, 0)
            / Math.max(1, clusterProfiles.length)
        );
        const coastalOpportunityProfile = {
            outputId: COASTAL_OPPORTUNITY_PROFILE_ID,
            stageId: COMPOSITE_SYNTHESIS_STAGE_ID,
            modelId: COASTAL_OPPORTUNITY_COMPOSITE_MODEL_ID,
            deterministic: true,
            seedNamespace: 'macro.coastalOpportunity.compositeSynthesis',
            seed: context.seed,
            worldBounds: cloneValue(worldBounds),
            coastalOpportunityMapFieldId: COASTAL_OPPORTUNITY_MAP_ID,
            sourceFieldIds: sourceFieldIds.slice(),
            sourceOutputIds: sourceOutputIds.slice(),
            clusterProfiles,
            exceptionalCoastalNodeIds: exceptionalCoastalNodes.map((node) => node.coastalNodeId),
            summary: {
                clusterProfileCount: clusterProfiles.length,
                meanCoastalOpportunity,
                strongProfileCount: clusterProfiles.filter((profile) => profile.coastalOpportunityClass === 'strong' || profile.coastalOpportunityClass === 'exceptional').length,
                exceptionalNodeCandidateCount: exceptionalCoastalNodes.length,
                directCoastalNodeCandidatesAvailable: false,
                connectivityGraphBuilt: false,
                valueMeaning: 'unified coastal opportunity profile only; no route graph or strategic synthesis'
            },
            compatibility: {
                coarseAnalysisOutput: true,
                physicalInputsOnly: true,
                futureRouteGraphInput: true,
                futureStrategicSynthesisInput: true,
                connectivityGraphOutput: false,
                macroRoutesOutput: false,
                gameplaySemanticsOutput: false
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        };
        const exceptionalCoastalNodesOutput = {
            outputId: EXCEPTIONAL_COASTAL_NODES_ID,
            stageId: COMPOSITE_SYNTHESIS_STAGE_ID,
            modelId: COASTAL_OPPORTUNITY_COMPOSITE_MODEL_ID,
            deterministic: true,
            seedNamespace: 'macro.coastalOpportunity.compositeSynthesis',
            seed: context.seed,
            worldBounds: cloneValue(worldBounds),
            coastalOpportunityMapFieldId: COASTAL_OPPORTUNITY_MAP_ID,
            coastalOpportunityProfileId: COASTAL_OPPORTUNITY_PROFILE_ID,
            sourceFieldIds: sourceFieldIds.slice(),
            sourceOutputIds: sourceOutputIds.slice(),
            exceptionalCoastalNodes,
            summary: {
                nodeCount: exceptionalCoastalNodes.length,
                fallbackSelectionApplied,
                leadingExceptionalCoastalNodeId: exceptionalCoastalNodes.length ? exceptionalCoastalNodes[0].coastalNodeId : '',
                topExceptionalityScore: exceptionalCoastalNodes.length ? exceptionalCoastalNodes[0].exceptionalityScore : 0,
                futureRouteGraphInput: true,
                futureStrategicLayerInput: true,
                connectivityGraphBuilt: false
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        };

        return {
            field: coastalOpportunityMap,
            profile: coastalOpportunityProfile,
            exceptionalNodes: exceptionalCoastalNodesOutput
        };
    }

    function getCoastalOpportunityAnalyzerDescriptor() {
        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            phaseVersion: PHASE_VERSION,
            status: STATUS,
            file: 'js/worldgen/macro/coastal-opportunity-analyzer.js',
            description: 'Partial CoastalOpportunityAnalyzer. It implements separate coarse harbor-quality, landing-ease, fishing-potential, natural shore-defense, inland-link bonus scoring, plus a unified coastal-opportunity profile with exceptional coastal nodes while route graph and strategic synthesis remain deferred.'
        });
    }

    function getCoastalOpportunityInputContract() {
        return deepFreeze({
            contractId: 'coastalOpportunityInput',
            status: STATUS,
            requiredKeys: REQUIRED_KEYS.slice(),
            optionalKeys: OPTIONAL_KEYS.slice(),
            inputGroups: cloneValue(INPUT_GROUPS),
            description: 'Input contract for the partial CoastalOpportunityAnalyzer. It consumes sea/coastal depth, hydrology, coastal-climate burden context, optional sea-climate summaries, and optional continent-cohesion summaries for separate coastal sub-score passes plus unified coastal-opportunity profile synthesis.'
        });
    }

    function getCoastalOpportunityOutputContract() {
        return deepFreeze({
            contractId: 'coastalOpportunityOutput',
            status: STATUS,
            deterministic: true,
            actualOutputs: {
                fields: [HARBOR_QUALITY_FIELD_ID, LANDING_EASE_FIELD_ID, FISHING_POTENTIAL_FIELD_ID, SHORE_DEFENSE_FIELD_ID, INLAND_LINK_FIELD_ID, COASTAL_OPPORTUNITY_MAP_ID],
                intermediateOutputs: [
                    HARBOR_QUALITY_ANALYSIS_ID,
                    LANDING_EASE_ANALYSIS_ID,
                    FISHING_POTENTIAL_ANALYSIS_ID,
                    SHORE_DEFENSE_ANALYSIS_ID,
                    INLAND_LINK_ANALYSIS_ID,
                    COASTAL_OPPORTUNITY_PROFILE_ID,
                    EXCEPTIONAL_COASTAL_NODES_ID,
                    ANALYSIS_PLAN_OUTPUT_ID
                ],
                records: [],
                debugArtifacts: []
            },
            stageSlots: cloneValue(STAGE_SLOTS),
            subScores: cloneValue(COASTAL_SUB_SCORES),
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice(),
            description: 'Partial CoastalOpportunityAnalyzer output contract. The runtime emits separate coarse coastal sub-scores, a unified `coastalOpportunityMap`, `coastalOpportunityProfile`, and `exceptionalCoastalNodes`; connectivity graph and strategic synthesis remain deferred.'
        });
    }

    function describeCoastalOpportunityDependencyAvailability(input = {}) {
        const groupRows = Object.entries(INPUT_GROUPS).map(([groupId, dependencies]) => {
            return summarizeGroupAvailability(input, groupId, dependencies);
        });

        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            groups: Object.fromEntries(groupRows.map((group) => [group.groupId, group])),
            sourceSummary: buildSourceSummary(groupRows)
        });
    }

    function buildCoastalOpportunityAnalysisPlan({ seed, worldBounds, dependencyAvailability }) {
        return {
            outputId: ANALYSIS_PLAN_OUTPUT_ID,
            stageId: PIPELINE_STEP_ID,
            deterministic: true,
            seedNamespace: 'macro.coastalOpportunity',
            seed,
            worldBounds,
            status: STATUS,
            scoringImplemented: true,
            compositeSynthesisImplemented: true,
            implementedSubScoreIds: COASTAL_SUB_SCORES
                .filter((subScore) => subScore.status === 'implemented')
                .map((subScore) => subScore.subScoreId),
            remainingSubScoreIds: COASTAL_SUB_SCORES
                .filter((subScore) => subScore.status !== 'implemented')
                .map((subScore) => subScore.subScoreId),
            stageSlots: cloneValue(STAGE_SLOTS),
            subScores: cloneValue(COASTAL_SUB_SCORES),
            compositeOutputId: COASTAL_OPPORTUNITY_MAP_ID,
            profileOutputId: COASTAL_OPPORTUNITY_PROFILE_ID,
            exceptionalCoastalNodesOutputId: EXCEPTIONAL_COASTAL_NODES_ID,
            dependencyAvailability,
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        };
    }

    function analyzeCoastalOpportunity(input = {}) {
        const seed = normalizeSeed(input.macroSeed);
        const worldBounds = normalizeWorldBounds(input.worldBounds);
        const dependencyAvailability = describeCoastalOpportunityDependencyAvailability(input);
        const harborQuality = buildHarborQualityFieldAndAnalysis(input, {
            seed,
            worldBounds
        });
        const landingEase = buildLandingEaseFieldAndAnalysis(input, {
            seed,
            worldBounds
        });
        const fishingPotential = buildFishingPotentialFieldAndAnalysis(input, {
            seed,
            worldBounds
        });
        const shoreDefense = buildShoreDefenseFieldAndAnalysis(input, {
            seed,
            worldBounds
        });
        const inlandLink = buildInlandLinkFieldAndAnalysis(input, {
            seed,
            worldBounds
        });
        const coastalOpportunityComposite = buildCoastalOpportunityCompositeAndNodes(input, {
            seed,
            worldBounds,
            harborQuality,
            landingEase,
            fishingPotential,
            shoreDefense,
            inlandLink
        });
        const resolvedWorldBounds = cloneValue(
            harborQuality.field.worldBounds
            || landingEase.field.worldBounds
            || fishingPotential.field.worldBounds
            || shoreDefense.field.worldBounds
            || inlandLink.field.worldBounds
            || coastalOpportunityComposite.field.worldBounds
            || worldBounds
        );
        const analysisPlan = buildCoastalOpportunityAnalysisPlan({
            seed,
            worldBounds: resolvedWorldBounds,
            dependencyAvailability
        });

        return {
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            phaseVersion: PHASE_VERSION,
            status: STATUS,
            deterministic: true,
            seedNamespace: 'macro.coastalOpportunity',
            seed,
            worldBounds: resolvedWorldBounds,
            dependencyAvailability,
            outputs: {
                fields: {
                    harborQualityField: harborQuality.field,
                    landingEaseField: landingEase.field,
                    fishingPotentialField: fishingPotential.field,
                    shoreDefenseField: shoreDefense.field,
                    inlandLinkField: inlandLink.field,
                    coastalOpportunityMap: coastalOpportunityComposite.field
                },
                intermediateOutputs: {
                    harborQualityAnalysis: harborQuality.analysis,
                    landingEaseAnalysis: landingEase.analysis,
                    fishingPotentialAnalysis: fishingPotential.analysis,
                    shoreDefenseAnalysis: shoreDefense.analysis,
                    inlandLinkAnalysis: inlandLink.analysis,
                    coastalOpportunityProfile: coastalOpportunityComposite.profile,
                    exceptionalCoastalNodes: coastalOpportunityComposite.exceptionalNodes,
                    coastalOpportunityAnalysisPlan: analysisPlan
                },
                records: {},
                debugArtifacts: []
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice(),
            notes: [
                'This microstep implements coarse harbor quality, landing ease, fishing potential, natural shore defense, inland-link bonus, and a unified coastal opportunity profile.',
                'The score uses sea-cluster shelter, coastal shelf support, optional navigability roughness, storm exposure, and coastal-decay burden without route logic or settlement synthesis.',
                'Landing ease uses shelf/depth access, coastal openness, and hydrosphere approach conditions only; it is not merged into harbor quality in this microstep.',
                'Fishing potential uses shelf support, water-condition proxies, and optional sea climate summaries only; it is not merged with harbor quality or landing ease in this microstep.',
                'Shore defense uses enclosed coastal geometry, approach friction, and lower shoreline exposure as a macro-geographic natural-defense proxy without military or political interpretation.',
                'Inland link uses river mouths, watershed reach, and optional continent cohesion as a coast-to-interior connectivity bonus; it remains separate from the other coastal scores in this microstep.',
                'The unified coastal opportunity profile emits exceptional coastal nodes for downstream route and strategic layers without building a connectivity graph in this microstep.',
                'Strategic synthesis, terrain cells, UI, and gameplay semantics remain deferred.'
            ]
        };
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule(MODULE_ID, {
            entry: 'analyzeCoastalOpportunity',
            file: 'js/worldgen/macro/coastal-opportunity-analyzer.js',
            description: 'Partial CoastalOpportunityAnalyzer with separate implemented coastal sub-scores, unified coastal-opportunity profile synthesis, and exceptional coastal-node extraction.',
            stub: false,
            scaffold: false
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep(PIPELINE_STEP_ID, {
            moduleId: MODULE_ID,
            file: 'js/worldgen/macro/coastal-opportunity-analyzer.js',
            entry: 'analyzeCoastalOpportunity',
            description: 'Partial pipeline entry for coastal opportunity analysis; separate coastal sub-scores, unified coastal-opportunity profile synthesis, and exceptional coastal-node extraction are implemented while connectivity graph and strategic synthesis remain deferred.',
            stub: false,
            scaffold: false
        });
    }

    Object.assign(macro, {
        getCoastalOpportunityAnalyzerDescriptor,
        getCoastalOpportunityInputContract,
        getCoastalOpportunityOutputContract,
        describeCoastalOpportunityDependencyAvailability,
        analyzeCoastalOpportunity
    });
})();
