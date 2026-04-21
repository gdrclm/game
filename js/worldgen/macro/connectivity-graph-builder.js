(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const MODULE_ID = 'connectivityGraphBuilder';
    const PIPELINE_STEP_ID = 'connectivityGraph';
    const STATUS = 'PARTIAL_IMPLEMENTED';
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';
    const BUILD_PLAN_OUTPUT_ID = 'connectivityGraphBuildPlan';
    const LAND_GRAPH_OUTPUT_ID = 'landConnectivityGraph';
    const SEA_GRAPH_OUTPUT_ID = 'seaConnectivityGraph';
    const HYBRID_GRAPH_OUTPUT_ID = 'hybridConnectivityGraph';
    const ROUTE_COST_SURFACE_OUTPUT_ID = 'routeCostSurface';
    const MACRO_ROUTES_OUTPUT_ID = 'macroRoutes';
    const MACRO_CORRIDORS_OUTPUT_ID = 'macroCorridors';
    const GRAPH_ASSEMBLY_STAGE_ID = 'graphAssembly';
    const LAND_GRAPH_MODEL_ID = 'deterministicCoarseLandConnectivityGraphV1';
    const SEA_GRAPH_MODEL_ID = 'deterministicCoarseSeaConnectivityGraphV1';
    const HYBRID_GRAPH_MODEL_ID = 'deterministicCoarseHybridConnectivityGraphV1';
    const ROUTE_COST_MODEL_ID = 'deterministicCoarseHybridRouteCostModelV1';
    const ROUTE_SAMPLING_MODEL_ID = 'deterministicMajorRegionRouteSamplingV1';
    const MACRO_CORRIDOR_MODEL_ID = 'deterministicMacroCorridorExtractionV1';
    const MAX_MAJOR_ROUTE_ENDPOINTS = 10;
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
        'coastalOpportunity',
        'climateEnvelope',
        'marineCarving',
        'fields',
        'intermediateOutputs',
        'records',
        'debugOptions'
    ]);
    const INPUT_GROUPS = Object.freeze({
        landRegions: Object.freeze([
            {
                dependencyId: 'regionalSegmentationAnalysis',
                sourceGroup: 'continentalCohesion.outputs.intermediateOutputs',
                required: true,
                role: 'major continent-internal region blocks for coarse land-graph nodes'
            },
            {
                dependencyId: 'continentalCohesionSummaries',
                sourceGroup: 'continentalCohesion.outputs.intermediateOutputs',
                required: false,
                role: 'continent-level cohesion summaries for coarse land-node enrichment'
            },
            {
                dependencyId: 'corePotentialAnalysis',
                sourceGroup: 'continentalCohesion.outputs.intermediateOutputs',
                required: false,
                role: 'segment-level inland-node weighting for coarse land-graph prominence'
            },
            {
                dependencyId: 'fracturedPeripheryAnalysis',
                sourceGroup: 'continentalCohesion.outputs.intermediateOutputs',
                required: false,
                role: 'segment-level edge fragility context for coarse land-graph edge strength'
            }
        ]),
        marineBasins: Object.freeze([
            {
                dependencyId: 'seaRegionClusters',
                sourceGroup: 'hydrosphere.outputs.intermediateOutputs',
                required: true,
                role: 'marine basin units for coarse sea-graph nodes'
            },
            {
                dependencyId: 'seaNavigabilityTagging',
                sourceGroup: 'hydrosphere.outputs.intermediateOutputs',
                required: false,
                role: 'optional marine roughness and approach tags for coarse sea-edge strength'
            }
        ]),
        coastalNodes: Object.freeze([
            {
                dependencyId: 'exceptionalCoastalNodes',
                sourceGroup: 'coastalOpportunity.outputs.intermediateOutputs',
                required: false,
                role: 'major coastal terminal nodes for coarse land-side attachment into inland segments'
            },
            {
                dependencyId: 'coastalOpportunityProfile',
                sourceGroup: 'coastalOpportunity.outputs.intermediateOutputs',
                required: false,
                role: 'per-cluster coastal summaries for future node enrichment and hybrid bridging'
            }
        ]),
        routeRiskClimate: Object.freeze([
            {
                dependencyId: 'climateStressField',
                sourceGroup: 'climateEnvelope.outputs.fields',
                required: false,
                role: 'coarse climate-stress pressure for hybrid-node and edge route-cost modeling'
            },
            {
                dependencyId: 'stormCorridorField',
                sourceGroup: 'climateEnvelope.outputs.fields',
                required: false,
                role: 'storm exposure pressure for sea-facing and transition route-cost penalties'
            },
            {
                dependencyId: 'coastalDecayBurdenField',
                sourceGroup: 'climateEnvelope.outputs.fields',
                required: false,
                role: 'coastal wear/exposure pressure for coastal attachment and transition route-cost penalties'
            }
        ]),
        chokeHints: Object.freeze([
            {
                dependencyId: 'straitCarvingSummary',
                sourceGroup: 'marineCarving.outputs.intermediateOutputs',
                required: false,
                role: 'narrow-strait summary hints for coarse marine choke penalties in route-cost modeling'
            }
        ]),
        recordLinkage: Object.freeze([
            {
                dependencyId: 'continentBodies',
                sourceGroup: 'reliefElevation.outputs.intermediateOutputs',
                required: false,
                role: 'ContinentRecord-compatible continent-body drafts for node attribution and future route rollups'
            }
        ])
    });
    const STAGE_SLOTS = Object.freeze([
        {
            stageId: 'dependencyIntake',
            seedScope: 'dependencyIntake',
            status: 'implemented',
            plannedOutputs: ['dependencyAvailability']
        },
        {
            stageId: 'nodeHarvest',
            seedScope: 'nodeHarvest',
            status: 'implemented',
            plannedOutputs: ['sourceCounts', 'graphFamilyPlan']
        },
        {
            stageId: GRAPH_ASSEMBLY_STAGE_ID,
            seedScope: GRAPH_ASSEMBLY_STAGE_ID,
            status: 'implemented',
            plannedOutputs: [LAND_GRAPH_OUTPUT_ID, SEA_GRAPH_OUTPUT_ID, 'hybridConnectivityGraph']
        },
        {
            stageId: 'routeCostModeling',
            seedScope: 'routeCostModeling',
            status: 'implemented',
            plannedOutputs: [ROUTE_COST_SURFACE_OUTPUT_ID]
        },
        {
            stageId: 'routeSampling',
            seedScope: 'routeSampling',
            status: 'implemented',
            plannedOutputs: [MACRO_ROUTES_OUTPUT_ID]
        },
        {
            stageId: 'corridorExtraction',
            seedScope: 'corridorExtraction',
            status: 'implemented',
            plannedOutputs: [MACRO_CORRIDORS_OUTPUT_ID]
        }
    ]);
    const GRAPH_FAMILY_SLOTS = Object.freeze([
        {
            graphId: LAND_GRAPH_OUTPUT_ID,
            graphFamily: 'land',
            nodeSourceIds: ['regionalSegmentationAnalysis', 'exceptionalCoastalNodes'],
            bridgeSourceIds: ['corePotentialAnalysis', 'fracturedPeripheryAnalysis', 'continentBodies'],
            routeCostMode: 'not_computed',
            status: 'implemented'
        },
        {
            graphId: SEA_GRAPH_OUTPUT_ID,
            graphFamily: 'sea',
            nodeSourceIds: ['seaRegionClusters', 'exceptionalCoastalNodes'],
            bridgeSourceIds: ['seaNavigabilityTagging', 'coastalOpportunityProfile'],
            routeCostMode: 'not_computed',
            status: 'implemented'
        },
        {
            graphId: HYBRID_GRAPH_OUTPUT_ID,
            graphFamily: 'hybrid',
            nodeSourceIds: ['regionalSegmentationAnalysis', 'seaRegionClusters', 'exceptionalCoastalNodes'],
            bridgeSourceIds: ['coastalOpportunityProfile', 'continentBodies', 'climateStressField', 'stormCorridorField', 'coastalDecayBurdenField', 'straitCarvingSummary'],
            routeCostMode: 'coarse_edge_modeled',
            status: 'implemented'
        }
    ]);
    const INTENTIONALLY_ABSENT = Object.freeze([
        'connectivityNodeRegistry',
        'connectivityEdgeRegistry',
        'strategicRegionSynthesis',
        'terrainCells',
        'uiOverlays',
        'gameplaySemantics'
    ]);
    const MACRO_ROUTE_INTENTIONALLY_ABSENT = Object.freeze([
        'connectivityNodeRegistry',
        'connectivityEdgeRegistry',
        'macroCorridors',
        'brittlenessAnalysis',
        'gameplaySemantics'
    ]);
    const MACRO_CORRIDOR_INTENTIONALLY_ABSENT = Object.freeze([
        'connectivityNodeRegistry',
        'connectivityEdgeRegistry',
        'chokepointRecords',
        'strategicRegionSynthesis',
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

    function hasOwn(objectValue, key) {
        return Boolean(objectValue) && Object.prototype.hasOwnProperty.call(objectValue, key);
    }

    function normalizeString(value, fallback = '') {
        return typeof value === 'string'
            ? value
            : (typeof fallback === 'string' ? fallback : '');
    }

    function normalizeInteger(value, fallback = 0) {
        const normalizedValue = Number.parseInt(value, 10);
        if (Number.isFinite(normalizedValue)) {
            return normalizedValue;
        }

        const normalizedFallback = Number.parseInt(fallback, 10);
        return Number.isFinite(normalizedFallback) ? normalizedFallback : 0;
    }

    function normalizeNumber(value, fallback = 0) {
        const normalizedValue = Number(value);
        if (Number.isFinite(normalizedValue)) {
            return normalizedValue;
        }

        const normalizedFallback = Number(fallback);
        return Number.isFinite(normalizedFallback) ? normalizedFallback : 0;
    }

    function clampUnitInterval(value, fallback = 0) {
        const normalizedValue = normalizeNumber(value, fallback);
        if (normalizedValue <= 0) {
            return 0;
        }
        if (normalizedValue >= 1) {
            return 1;
        }
        return normalizedValue;
    }

    function roundValue(value) {
        return Math.round(clampUnitInterval(value, 0) * 1000) / 1000;
    }

    function roundMetric(value, digits = 3) {
        const precision = Math.max(0, normalizeInteger(digits, 3));
        const factor = 10 ** precision;
        return Math.round(normalizeNumber(value, 0) * factor) / factor;
    }

    function getNestedValue(source, path, fallback = undefined) {
        if (!source || typeof source !== 'object' || !path) {
            return fallback;
        }

        const pathSegments = Array.isArray(path) ? path : String(path).split('.');
        let currentValue = source;

        for (const pathSegment of pathSegments) {
            if (!currentValue || typeof currentValue !== 'object' || !hasOwn(currentValue, pathSegment)) {
                return fallback;
            }
            currentValue = currentValue[pathSegment];
        }

        return currentValue;
    }

    function findDependencyValue(group, dependencyId) {
        if (!group || typeof group !== 'object' || !dependencyId) {
            return null;
        }

        if (hasOwn(group, dependencyId)) {
            return group[dependencyId];
        }

        if (Array.isArray(group)) {
            return group.find((entry) => entry && (
                entry.outputId === dependencyId
                || entry.fieldId === dependencyId
                || entry.recordId === dependencyId
            )) || null;
        }

        return null;
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

    function countRecords(container, key) {
        if (!container || typeof container !== 'object') {
            return 0;
        }

        const records = container[key];
        return Array.isArray(records) ? records.length : 0;
    }

    function countDraftRecords(items = [], draftKey = '') {
        if (!Array.isArray(items) || !draftKey) {
            return 0;
        }

        return items.reduce((count, item) => {
            const recordId = normalizeString(getNestedValue(item, draftKey), '');
            return count + (recordId ? 1 : 0);
        }, 0);
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
            getNestedValue(input, 'coastalOpportunity.intermediateOutputs'),
            getNestedValue(input, 'coastalOpportunity.outputs.intermediateOutputs'),
            getNestedValue(input, 'climateEnvelope.intermediateOutputs'),
            getNestedValue(input, 'climateEnvelope.outputs.intermediateOutputs'),
            getNestedValue(input, 'marineCarving.intermediateOutputs'),
            getNestedValue(input, 'marineCarving.outputs.intermediateOutputs')
        ];

        return candidateGroups
            .map((group) => findDependencyValue(group, outputId))
            .find(Boolean) || null;
    }

    function findInputField(input = {}, fieldId = '') {
        const candidateGroups = [
            input.fields,
            getNestedValue(input, 'outputs.fields'),
            getNestedValue(input, 'reliefElevation.fields'),
            getNestedValue(input, 'reliefElevation.outputs.fields'),
            getNestedValue(input, 'hydrosphere.fields'),
            getNestedValue(input, 'hydrosphere.outputs.fields'),
            getNestedValue(input, 'coastalOpportunity.fields'),
            getNestedValue(input, 'coastalOpportunity.outputs.fields'),
            getNestedValue(input, 'climateEnvelope.fields'),
            getNestedValue(input, 'climateEnvelope.outputs.fields'),
            getNestedValue(input, 'marineCarving.fields'),
            getNestedValue(input, 'marineCarving.outputs.fields')
        ];

        return candidateGroups
            .map((group) => findDependencyValue(group, fieldId))
            .find(Boolean) || null;
    }

    function buildDependencyGroupStatus(input = {}, groupId = '', dependencies = []) {
        const dependencyRows = dependencies.map((dependency) => {
            const resolvedValue = findInputIntermediateOutput(input, dependency.dependencyId)
                || findInputField(input, dependency.dependencyId);
            return {
                dependencyId: dependency.dependencyId,
                sourceGroup: dependency.sourceGroup,
                required: Boolean(dependency.required),
                role: dependency.role,
                available: Boolean(resolvedValue)
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
                ? 'ready_for_partial_build'
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
            readyGroupCount: groupRows.filter((group) => group.readiness === 'ready_for_partial_build').length,
            availableDependencyCount,
            requiredDependencyCount,
            availableRequiredDependencyCount,
            missingRequiredDependencyIds: groupRows.flatMap((group) => group.dependencies)
                .filter((dependency) => dependency.required && !dependency.available)
                .map((dependency) => dependency.dependencyId)
        };
    }

    function normalizePoint(point = {}) {
        return {
            x: roundValue(point.x),
            y: roundValue(point.y)
        };
    }

    function computeNormalizedDistance(leftPoint = {}, rightPoint = {}) {
        const deltaX = normalizeNumber(leftPoint.x, 0) - normalizeNumber(rightPoint.x, 0);
        const deltaY = normalizeNumber(leftPoint.y, 0) - normalizeNumber(rightPoint.y, 0);
        return Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));
    }

    function classifyLandNodeRole(corePotentialScore, fracturedPeripheryScore, meanInteriorPassability) {
        const normalizedCore = clampUnitInterval(corePotentialScore, meanInteriorPassability);
        const normalizedPeriphery = clampUnitInterval(fracturedPeripheryScore, 0);
        const normalizedPassability = clampUnitInterval(meanInteriorPassability, 0);

        if (normalizedCore >= 0.62) {
            return 'major_inland_node';
        }
        if (normalizedPeriphery >= 0.6) {
            return 'peripheral_land_node';
        }
        if (normalizedPassability >= 0.52) {
            return 'interior_land_node';
        }
        return 'regional_land_node';
    }

    function classifyConnectionStrength(connectionStrength) {
        const normalizedStrength = clampUnitInterval(connectionStrength, 0);
        if (normalizedStrength >= 0.72) {
            return 'strong';
        }
        if (normalizedStrength >= 0.52) {
            return 'moderate';
        }
        if (normalizedStrength >= 0.32) {
            return 'limited';
        }
        return 'fragile';
    }

    function classifyRouteCost(routeCost) {
        const normalizedCost = clampUnitInterval(routeCost, 0);
        if (normalizedCost >= 0.78) {
            return 'severe';
        }
        if (normalizedCost >= 0.58) {
            return 'high';
        }
        if (normalizedCost >= 0.34) {
            return 'moderate';
        }
        return 'low';
    }

    function getHybridNodeAnchorPoint(node = {}) {
        const normalizedAnchorPoint = normalizePoint(node.normalizedAnchorPoint || {});
        if (normalizedAnchorPoint.x > 0 || normalizedAnchorPoint.y > 0) {
            return normalizedAnchorPoint;
        }
        return normalizePoint(node.normalizedCentroid || {});
    }

    function sampleScalarFieldAtNormalizedPoint(field = {}, normalizedPoint = {}, fallback = 0) {
        const values = Array.isArray(field && field.values) ? field.values : [];
        const width = normalizeInteger(field && field.width, 0);
        const height = normalizeInteger(field && field.height, 0);
        const size = normalizeInteger(field && field.size, values.length);

        if (!values.length || width <= 0 || height <= 0 || size <= 0) {
            return clampUnitInterval(fallback, 0);
        }

        const point = getHybridNodeAnchorPoint({ normalizedAnchorPoint: normalizedPoint });
        const x = Math.min(width - 1, Math.max(0, Math.round(clampUnitInterval(point.x, 0) * Math.max(0, width - 1))));
        const y = Math.min(height - 1, Math.max(0, Math.round(clampUnitInterval(point.y, 0) * Math.max(0, height - 1))));
        const index = Math.min(size - 1, Math.max(0, (y * width) + x));
        return clampUnitInterval(values[index], fallback);
    }

    function computeMean(values = []) {
        if (!Array.isArray(values) || values.length === 0) {
            return 0;
        }
        return values.reduce((sum, value) => sum + normalizeNumber(value, 0), 0) / values.length;
    }

    function selectDominantDriverIds(driverWeights = {}, limit = 3) {
        return Object.entries(driverWeights)
            .map(([driverId, weight]) => ({
                driverId,
                weight: Math.max(0, normalizeNumber(weight, 0))
            }))
            .filter((entry) => entry.weight > 0)
            .sort((left, right) => (
                right.weight - left.weight
                || left.driverId.localeCompare(right.driverId)
            ))
            .slice(0, Math.max(1, normalizeInteger(limit, 3)))
            .map((entry) => entry.driverId);
    }

    function buildStraitPressureContext(straitCarvingSummary = {}) {
        const carvedStraitCount = normalizeInteger(straitCarvingSummary && straitCarvingSummary.carvedStraitCount, 0);
        const candidateCount = Math.max(1, normalizeInteger(straitCarvingSummary && straitCarvingSummary.candidateCount, 0));
        const thinCorridorCellCount = normalizeInteger(straitCarvingSummary && straitCarvingSummary.thinCorridorCellCount, 0);
        const straitPassages = Array.isArray(straitCarvingSummary && straitCarvingSummary.straitPassages)
            ? straitCarvingSummary.straitPassages
            : [];

        return {
            hasStraitHints: carvedStraitCount > 0 || straitPassages.length > 0,
            carvedStraitCount,
            straitPassageCount: straitPassages.length,
            pressureBias: roundValue(clampUnitInterval(
                (carvedStraitCount / candidateCount) * 0.7
                + (thinCorridorCellCount > 0 ? 0.18 : 0)
                + (straitPassages.length > 0 ? 0.12 : 0),
                0
            ))
        };
    }

    function computeHybridNodeRoutePressure(node = {}, climateStressField = {}, stormCorridorField = {}, coastalDecayBurdenField = {}, straitPressureContext = {}) {
        const anchorPoint = getHybridNodeAnchorPoint(node);
        const climateStress = roundValue(sampleScalarFieldAtNormalizedPoint(climateStressField, anchorPoint, 0));
        const stormExposure = roundValue(sampleScalarFieldAtNormalizedPoint(stormCorridorField, anchorPoint, 0));
        const coastalDecayBurden = roundValue(sampleScalarFieldAtNormalizedPoint(coastalDecayBurdenField, anchorPoint, 0));
        const constrainedWaterBias = roundValue(clampUnitInterval(node.constrainedWaterBias, 0));
        const localChokePressure = roundValue(clampUnitInterval(
            Math.max(
                constrainedWaterBias,
                clampUnitInterval(node.edgeExposureRatio, 0) * 0.4,
                clampUnitInterval(straitPressureContext.pressureBias, 0) * (
                    (node.nodeRole === 'coastal_sea_terminal' || node.nodeRole === 'semi_enclosed_sea_node' || node.nodeRole === 'inland_sea_node' || node.nodeRole === 'confined_sea_node')
                        ? 1
                        : 0.35
                )
            ),
            0
        ));
        const coastalOpportunityRelief = roundValue(clampUnitInterval(
            Math.max(
                clampUnitInterval(node.coastalOpportunityScore, 0),
                clampUnitInterval(node.attachmentStrength, 0) * 0.82,
                clampUnitInterval(node.navigability, 0) * 0.68
            ),
            0
        ));
        const routePressureScore = roundValue(clampUnitInterval(
            (climateStress * 0.38)
            + (stormExposure * 0.22)
            + (coastalDecayBurden * 0.2)
            + (localChokePressure * 0.2)
            - (coastalOpportunityRelief * 0.12),
            0
        ));

        return {
            nodeId: normalizeString(node.nodeId, ''),
            nodeType: normalizeString(node.nodeType, ''),
            nodeRole: normalizeString(node.nodeRole, ''),
            sourceGraphFamily: normalizeString(node.sourceGraphFamily, ''),
            sourceCoastalNodeId: normalizeString(node.sourceCoastalNodeId, ''),
            sourceRegionalSegmentId: normalizeString(node.sourceRegionalSegmentId, ''),
            seaRegionClusterId: normalizeString(node.seaRegionClusterId, ''),
            normalizedAnchorPoint: anchorPoint,
            climateStress,
            stormExposure,
            coastalDecayBurden,
            chokePressure: localChokePressure,
            coastalOpportunityRelief,
            routePressureScore
        };
    }

    function computeHybridEdgeRouteCost(edge = {}, nodePressureLookup = new Map(), straitPressureContext = {}) {
        const fromPressure = nodePressureLookup.get(normalizeString(edge.fromNodeId, '')) || {};
        const toPressure = nodePressureLookup.get(normalizeString(edge.toNodeId, '')) || {};
        const climateStress = roundValue(computeMean([fromPressure.climateStress, toPressure.climateStress]));
        const stormExposure = roundValue(computeMean([fromPressure.stormExposure, toPressure.stormExposure]));
        const coastalDecayBurden = roundValue(computeMean([fromPressure.coastalDecayBurden, toPressure.coastalDecayBurden]));
        const chokePressure = roundValue(computeMean([
            fromPressure.chokePressure,
            toPressure.chokePressure,
            clampUnitInterval(straitPressureContext.pressureBias, 0) * (
                edge.edgeType === 'interbasin_link' || edge.edgeType === 'coastal_sea_attachment' || edge.edgeType === 'land_sea_transition'
                    ? 1
                    : 0.2
            )
        ]));
        const coastalOpportunityRelief = roundValue(computeMean([
            fromPressure.coastalOpportunityRelief,
            toPressure.coastalOpportunityRelief
        ]));
        const connectivityFriction = roundValue(1 - clampUnitInterval(edge.coarseConnectivityStrength, 0));
        const edgeType = normalizeString(edge.edgeType, '');
        const isMarineEdge = edgeType === 'interbasin_link' || edgeType === 'coastal_sea_attachment';
        const isTransitionEdge = edgeType === 'land_sea_transition';
        const isCoastalEdge = edgeType.indexOf('coastal') >= 0 || isTransitionEdge;
        const baseRouteCost = roundValue(
            edgeType === 'interregional_link' ? 0.28
                : edgeType === 'coastal_terminal_attachment' ? 0.32
                : edgeType === 'interbasin_link' ? 0.38
                : edgeType === 'coastal_sea_attachment' ? 0.34
                : isTransitionEdge ? 0.44
                : 0.3
        );
        const driverWeights = {
            connectivity_friction: connectivityFriction * 0.28,
            climate_stress: climateStress * (isMarineEdge ? 0.14 : 0.2),
            storm_exposure: stormExposure * (isMarineEdge || isTransitionEdge ? 0.18 : 0.08),
            coastal_decay: coastalDecayBurden * (isCoastalEdge ? 0.16 : 0.06),
            choke_penalty: chokePressure * (isMarineEdge || isTransitionEdge ? 0.16 : 0.04)
        };
        const facilitationRelief = coastalOpportunityRelief * (isCoastalEdge ? 0.14 : 0.05);
        const coarseRouteCost = roundValue(clampUnitInterval(
            baseRouteCost
            + Object.values(driverWeights).reduce((sum, value) => sum + value, 0)
            - facilitationRelief,
            0
        ));

        return {
            edgeId: normalizeString(edge.edgeId, ''),
            edgeType,
            fromNodeId: normalizeString(edge.fromNodeId, ''),
            toNodeId: normalizeString(edge.toNodeId, ''),
            sourceGraphFamily: normalizeString(edge.sourceGraphFamily, ''),
            sourceGraphEdgeId: normalizeString(edge.sourceGraphEdgeId, ''),
            transitionEdge: Boolean(edge.transitionEdge),
            landGraphEdge: Boolean(edge.landGraphEdge),
            seaGraphEdge: Boolean(edge.seaGraphEdge),
            coarseRouteCost,
            routeCostClass: classifyRouteCost(coarseRouteCost),
            routeCostComputed: true,
            climateStress,
            stormExposure,
            coastalDecayBurden,
            chokePressure,
            connectivityFriction,
            coastalOpportunityRelief: roundValue(coastalOpportunityRelief),
            dominantRouteCostDriverIds: selectDominantDriverIds(driverWeights, 3)
        };
    }

    function buildRouteCostSurface(input = {}, dependencyAvailability = {}, hybridConnectivityGraph = {}) {
        const climateStressField = findInputField(input, 'climateStressField');
        const stormCorridorField = findInputField(input, 'stormCorridorField');
        const coastalDecayBurdenField = findInputField(input, 'coastalDecayBurdenField');
        const straitCarvingSummary = findInputIntermediateOutput(input, 'straitCarvingSummary');
        const straitPressureContext = buildStraitPressureContext(straitCarvingSummary || {});
        const hybridNodes = Array.isArray(hybridConnectivityGraph.nodes) ? hybridConnectivityGraph.nodes : [];
        const hybridEdges = Array.isArray(hybridConnectivityGraph.edges) ? hybridConnectivityGraph.edges : [];
        const nodePressures = hybridNodes.map((node) => computeHybridNodeRoutePressure(
            node,
            climateStressField || {},
            stormCorridorField || {},
            coastalDecayBurdenField || {},
            straitPressureContext
        ));
        const nodePressureLookup = buildLookupById(nodePressures, 'nodeId');
        const edgeCosts = hybridEdges.map((edge) => computeHybridEdgeRouteCost(
            edge,
            nodePressureLookup,
            straitPressureContext
        ));
        const routeCosts = edgeCosts.map((edgeCost) => edgeCost.coarseRouteCost);
        const meanRouteCost = roundValue(computeMean(routeCosts));
        const highestCostEdge = edgeCosts.slice().sort((left, right) => (
            right.coarseRouteCost - left.coarseRouteCost
            || left.edgeId.localeCompare(right.edgeId)
        ))[0] || null;
        const sourceOutputIds = [
            normalizeString(hybridConnectivityGraph.outputId, ''),
            climateStressField ? normalizeString(climateStressField.fieldId, '') : '',
            stormCorridorField ? normalizeString(stormCorridorField.fieldId, '') : '',
            coastalDecayBurdenField ? normalizeString(coastalDecayBurdenField.fieldId, '') : '',
            straitCarvingSummary ? normalizeString(straitCarvingSummary.straitCarvingId, 'straitCarvingSummary') : ''
        ].filter(Boolean);

        return {
            outputId: ROUTE_COST_SURFACE_OUTPUT_ID,
            stageId: 'routeCostModeling',
            modelId: ROUTE_COST_MODEL_ID,
            deterministic: true,
            seedNamespace: 'macro.connectivityGraph.routeCostModeling',
            dependencyAvailability: cloneValue(dependencyAvailability),
            hybridGraphOutputId: normalizeString(hybridConnectivityGraph.outputId, HYBRID_GRAPH_OUTPUT_ID),
            sourceOutputIds,
            nodePressures,
            edgeCosts,
            summary: {
                nodePressureCount: nodePressures.length,
                edgeCostCount: edgeCosts.length,
                meanRouteCost,
                highestCostEdgeId: highestCostEdge ? highestCostEdge.edgeId : '',
                lowestCostEdgeId: edgeCosts.length
                    ? edgeCosts.slice().sort((left, right) => (
                        left.coarseRouteCost - right.coarseRouteCost
                        || left.edgeId.localeCompare(right.edgeId)
                    ))[0].edgeId
                    : '',
                lowCostEdgeCount: edgeCosts.filter((edgeCost) => edgeCost.routeCostClass === 'low').length,
                moderateCostEdgeCount: edgeCosts.filter((edgeCost) => edgeCost.routeCostClass === 'moderate').length,
                highCostEdgeCount: edgeCosts.filter((edgeCost) => edgeCost.routeCostClass === 'high').length,
                severeCostEdgeCount: edgeCosts.filter((edgeCost) => edgeCost.routeCostClass === 'severe').length,
                chokeAwareEdgeCount: edgeCosts.filter((edgeCost) => edgeCost.chokePressure >= 0.34).length,
                routeCostComputed: true,
                routeSamplingPerformed: false,
                corridorExtractionPerformed: false,
                valueMeaning: 'coarse edge-level route-cost model over the hybrid graph only; no route sampling or corridor extraction'
            },
            compatibility: {
                coarseGraphOutput: false,
                routeCostOutput: true,
                macroRoutesOutput: false,
                corridorOutput: false,
                gameplaySemanticsOutput: false
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        };
    }

    function applyRouteCostSurfaceToHybridGraph(hybridConnectivityGraph = {}, routeCostSurface = {}) {
        const edgeCostLookup = buildLookupById(routeCostSurface && routeCostSurface.edgeCosts, 'edgeId');
        const updatedEdges = Array.isArray(hybridConnectivityGraph.edges)
            ? hybridConnectivityGraph.edges.map((edge) => {
                const edgeCost = edgeCostLookup.get(normalizeString(edge.edgeId, '')) || {};
                return {
                    ...cloneValue(edge),
                    routeCostComputed: Boolean(edgeCost.routeCostComputed),
                    coarseRouteCost: roundValue(edgeCost.coarseRouteCost),
                    routeCostClass: normalizeString(edgeCost.routeCostClass, ''),
                    dominantRouteCostDriverIds: Array.isArray(edgeCost.dominantRouteCostDriverIds)
                        ? edgeCost.dominantRouteCostDriverIds.slice()
                        : []
                };
            })
            : [];

        return {
            ...cloneValue(hybridConnectivityGraph),
            sourceOutputIds: Array.from(new Set([
                ...(Array.isArray(hybridConnectivityGraph.sourceOutputIds) ? hybridConnectivityGraph.sourceOutputIds : []),
                normalizeString(routeCostSurface && routeCostSurface.outputId, '')
            ].filter(Boolean))).sort(),
            edges: updatedEdges,
            summary: {
                ...(hybridConnectivityGraph.summary ? cloneValue(hybridConnectivityGraph.summary) : {}),
                routeCostComputed: true,
                routeCostSurfaceOutputId: normalizeString(routeCostSurface && routeCostSurface.outputId, ''),
                meanRouteCost: roundValue(getNestedValue(routeCostSurface, 'summary.meanRouteCost', 0)),
                highestCostEdgeId: normalizeString(getNestedValue(routeCostSurface, 'summary.highestCostEdgeId'), ''),
                valueMeaning: 'coarse hybrid graph that combines land and sea graph structure with explicit coastal-terminal transition edges and coarse route-cost annotations; no route sampling or corridor extraction'
            },
            compatibility: {
                ...(hybridConnectivityGraph.compatibility ? cloneValue(hybridConnectivityGraph.compatibility) : {}),
                routeCostOutput: true,
                macroRoutesOutput: false,
                gameplaySemanticsOutput: false
            }
        };
    }

    function scoreMajorRouteEndpoint(node = {}) {
        return roundValue(clampUnitInterval(
            (clampUnitInterval(node.corePotentialScore, 0) * 0.42)
            + (clampUnitInterval(node.meanContinentalCohesion, 0) * 0.26)
            + (clampUnitInterval(node.meanInteriorPassability, 0) * 0.22)
            + ((1 - clampUnitInterval(node.fracturedPeripheryScore, 0)) * 0.1),
            0
        ));
    }

    function selectMajorRouteEndpoints(hybridConnectivityGraph = {}, maxEndpoints = MAX_MAJOR_ROUTE_ENDPOINTS) {
        const hybridNodes = Array.isArray(hybridConnectivityGraph.nodes) ? hybridConnectivityGraph.nodes : [];
        const inlandNodes = hybridNodes
            .filter((node) => node && node.nodeType === 'inland_region')
            .map((node) => ({
                node: cloneValue(node),
                routeEndpointScore: scoreMajorRouteEndpoint(node)
            }))
            .sort((left, right) => (
                right.routeEndpointScore - left.routeEndpointScore
                || normalizeString(left.node.continentId, '').localeCompare(normalizeString(right.node.continentId, ''))
                || normalizeString(left.node.nodeId, '').localeCompare(normalizeString(right.node.nodeId, ''))
            ));
        const majorPool = inlandNodes.filter((entry) => (
            entry.node.nodeRole === 'major_inland_node' || entry.routeEndpointScore >= 0.62
        ));
        const endpointPool = majorPool.length >= 2 ? majorPool : inlandNodes;
        const selectedEntries = [];
        const selectedNodeIds = new Set();
        const coveredContinents = new Set();
        const endpointLimit = Math.max(2, normalizeInteger(maxEndpoints, MAX_MAJOR_ROUTE_ENDPOINTS));

        endpointPool.forEach((entry) => {
            const nodeId = normalizeString(entry.node.nodeId, '');
            const continentId = normalizeString(entry.node.continentId, '');
            if (!nodeId || selectedEntries.length >= endpointLimit || selectedNodeIds.has(nodeId)) {
                return;
            }
            if (continentId && coveredContinents.has(continentId)) {
                return;
            }

            selectedEntries.push({
                ...entry,
                selectionReason: majorPool.length >= 2 ? 'continent_major_seed' : 'continent_prominence_seed'
            });
            selectedNodeIds.add(nodeId);
            if (continentId) {
                coveredContinents.add(continentId);
            }
        });

        endpointPool.forEach((entry) => {
            const nodeId = normalizeString(entry.node.nodeId, '');
            if (!nodeId || selectedEntries.length >= endpointLimit || selectedNodeIds.has(nodeId)) {
                return;
            }

            selectedEntries.push({
                ...entry,
                selectionReason: majorPool.length >= 2 ? 'major_inland_role' : 'prominence_fallback'
            });
            selectedNodeIds.add(nodeId);
        });

        inlandNodes.forEach((entry) => {
            const nodeId = normalizeString(entry.node.nodeId, '');
            if (!nodeId || selectedEntries.length >= endpointLimit || selectedNodeIds.has(nodeId)) {
                return;
            }

            selectedEntries.push({
                ...entry,
                selectionReason: 'coverage_fallback'
            });
            selectedNodeIds.add(nodeId);
        });

        return selectedEntries.slice(0, endpointLimit).map((entry, endpointIndex) => ({
            endpointId: `route_endpoint_${normalizeString(entry.node.sourceRegionalSegmentId, normalizeString(entry.node.nodeId, 'unknown'))}`,
            nodeId: normalizeString(entry.node.nodeId, ''),
            nodeRole: normalizeString(entry.node.nodeRole, ''),
            continentId: normalizeString(entry.node.continentId, ''),
            sourceRegionalSegmentId: normalizeString(entry.node.sourceRegionalSegmentId, ''),
            routeEndpointScore: entry.routeEndpointScore,
            routeEndpointRank: endpointIndex + 1,
            selectionReason: normalizeString(entry.selectionReason, ''),
            futureMacroCorridorInput: true
        }));
    }

    function buildHybridAdjacency(hybridConnectivityGraph = {}, routeCostSurface = {}, excludedEdgeIds = null) {
        const adjacency = new Map();
        const hybridEdges = Array.isArray(hybridConnectivityGraph.edges) ? hybridConnectivityGraph.edges.slice() : [];
        const edgeCostLookup = buildLookupById(routeCostSurface && routeCostSurface.edgeCosts, 'edgeId');
        const excludedEdgeIdSet = excludedEdgeIds instanceof Set
            ? excludedEdgeIds
            : new Set(Array.isArray(excludedEdgeIds) ? excludedEdgeIds.map((edgeId) => normalizeString(edgeId, '')).filter(Boolean) : []);

        function pushAdjacency(nodeId, entry) {
            if (!adjacency.has(nodeId)) {
                adjacency.set(nodeId, []);
            }
            adjacency.get(nodeId).push(entry);
        }

        hybridEdges
            .sort((left, right) => normalizeString(left.edgeId, '').localeCompare(normalizeString(right.edgeId, '')))
            .forEach((edge) => {
                const edgeId = normalizeString(edge.edgeId, '');
                const fromNodeId = normalizeString(edge.fromNodeId, '');
                const toNodeId = normalizeString(edge.toNodeId, '');
                if (!edgeId || !fromNodeId || !toNodeId || excludedEdgeIdSet.has(edgeId)) {
                    return;
                }

                const edgeCost = edgeCostLookup.get(edgeId) || edge;
                const traversalCost = roundMetric(Math.max(
                    0.01,
                    normalizeNumber(edgeCost.coarseRouteCost, normalizeNumber(edge.coarseRouteCost, 0.2))
                ));
                const adjacencyEntry = {
                    edgeId,
                    traversalCost,
                    edgeType: normalizeString(edge.edgeType, ''),
                    routeCostClass: normalizeString(edgeCost.routeCostClass, normalizeString(edge.routeCostClass, '')),
                    transitionEdge: Boolean(edge.transitionEdge),
                    landGraphEdge: Boolean(edge.landGraphEdge),
                    seaGraphEdge: Boolean(edge.seaGraphEdge)
                };

                pushAdjacency(fromNodeId, {
                    ...adjacencyEntry,
                    fromNodeId,
                    toNodeId,
                    neighborNodeId: toNodeId
                });
                pushAdjacency(toNodeId, {
                    ...adjacencyEntry,
                    fromNodeId: toNodeId,
                    toNodeId: fromNodeId,
                    neighborNodeId: fromNodeId
                });
            });

        adjacency.forEach((entries) => {
            entries.sort((left, right) => (
                left.traversalCost - right.traversalCost
                || left.edgeId.localeCompare(right.edgeId)
                || left.neighborNodeId.localeCompare(right.neighborNodeId)
            ));
        });

        return adjacency;
    }

    function compareRouteState(leftState = {}, rightState = {}) {
        return (
            normalizeNumber(leftState.totalCost, 0) - normalizeNumber(rightState.totalCost, 0)
            || normalizeInteger(leftState.hopCount, 0) - normalizeInteger(rightState.hopCount, 0)
            || normalizeString(leftState.pathSignature, '').localeCompare(normalizeString(rightState.pathSignature, ''))
            || normalizeString(leftState.nodeId, '').localeCompare(normalizeString(rightState.nodeId, ''))
        );
    }

    function sampleRouteBetweenEndpoints(fromEndpoint = {}, toEndpoint = {}, adjacency = new Map()) {
        const startNodeId = normalizeString(fromEndpoint.nodeId, '');
        const targetNodeId = normalizeString(toEndpoint.nodeId, '');
        if (!startNodeId || !targetNodeId || startNodeId === targetNodeId) {
            return null;
        }

        const bestStateByNodeId = new Map();
        const predecessorByNodeId = new Map();
        const frontierNodeIds = new Set();

        bestStateByNodeId.set(startNodeId, {
            nodeId: startNodeId,
            totalCost: 0,
            hopCount: 0,
            pathSignature: startNodeId
        });
        frontierNodeIds.add(startNodeId);

        while (frontierNodeIds.size > 0) {
            const currentNodeId = Array.from(frontierNodeIds)
                .sort((leftNodeId, rightNodeId) => compareRouteState(
                    bestStateByNodeId.get(leftNodeId) || {},
                    bestStateByNodeId.get(rightNodeId) || {}
                ))[0];
            frontierNodeIds.delete(currentNodeId);

            if (currentNodeId === targetNodeId) {
                break;
            }

            const currentState = bestStateByNodeId.get(currentNodeId) || {};
            const adjacencyEntries = adjacency.get(currentNodeId) || [];

            adjacencyEntries.forEach((adjacencyEntry) => {
                const neighborNodeId = normalizeString(adjacencyEntry.neighborNodeId, '');
                if (!neighborNodeId) {
                    return;
                }

                const candidateState = {
                    nodeId: neighborNodeId,
                    totalCost: roundMetric(
                        normalizeNumber(currentState.totalCost, 0) + normalizeNumber(adjacencyEntry.traversalCost, 0)
                    ),
                    hopCount: normalizeInteger(currentState.hopCount, 0) + 1,
                    pathSignature: `${normalizeString(currentState.pathSignature, startNodeId)}|${normalizeString(adjacencyEntry.edgeId, '')}`
                };
                const existingState = bestStateByNodeId.get(neighborNodeId);

                if (!existingState || compareRouteState(candidateState, existingState) < 0) {
                    bestStateByNodeId.set(neighborNodeId, candidateState);
                    predecessorByNodeId.set(neighborNodeId, {
                        previousNodeId: currentNodeId,
                        edgeId: normalizeString(adjacencyEntry.edgeId, '')
                    });
                    frontierNodeIds.add(neighborNodeId);
                }
            });
        }

        if (!bestStateByNodeId.has(targetNodeId)) {
            return null;
        }

        const nodePathIds = [targetNodeId];
        const edgePathIds = [];
        let cursorNodeId = targetNodeId;

        while (cursorNodeId !== startNodeId) {
            const predecessor = predecessorByNodeId.get(cursorNodeId);
            if (!predecessor) {
                return null;
            }
            edgePathIds.push(normalizeString(predecessor.edgeId, ''));
            nodePathIds.push(normalizeString(predecessor.previousNodeId, ''));
            cursorNodeId = normalizeString(predecessor.previousNodeId, '');
        }

        nodePathIds.reverse();
        edgePathIds.reverse();

        return {
            fromEndpointId: normalizeString(fromEndpoint.endpointId, ''),
            toEndpointId: normalizeString(toEndpoint.endpointId, ''),
            nodePathIds,
            edgePathIds,
            totalRouteCost: roundMetric(getNestedValue(bestStateByNodeId.get(targetNodeId), 'totalCost', 0)),
            hopCount: normalizeInteger(getNestedValue(bestStateByNodeId.get(targetNodeId), 'hopCount', 0), 0)
        };
    }

    function classifySampledRouteMode(landEdgeCount = 0, seaEdgeCount = 0, transitionEdgeCount = 0) {
        if (seaEdgeCount > 0 && transitionEdgeCount > 0) {
            return 'marine_assisted';
        }
        if (transitionEdgeCount > 0) {
            return 'coastal_transfer';
        }
        if (landEdgeCount > 0 && seaEdgeCount === 0) {
            return 'land_only';
        }
        return seaEdgeCount > 0 ? 'sea_only' : 'mixed';
    }

    function aggregateRouteDriverIds(edgeCostRows = []) {
        const driverWeights = {};

        edgeCostRows.forEach((edgeCostRow) => {
            const dominantDriverIds = Array.isArray(edgeCostRow.dominantRouteCostDriverIds)
                ? edgeCostRow.dominantRouteCostDriverIds
                : [];

            dominantDriverIds.forEach((driverId, driverIndex) => {
                const normalizedDriverId = normalizeString(driverId, '');
                if (!normalizedDriverId) {
                    return;
                }

                driverWeights[normalizedDriverId] = normalizeNumber(driverWeights[normalizedDriverId], 0)
                    + Math.max(1, 3 - driverIndex);
            });
        });

        return selectDominantDriverIds(driverWeights, 3);
    }

    function buildMacroRoutes(hybridConnectivityGraph = {}, routeCostSurface = {}) {
        const majorRouteEndpoints = selectMajorRouteEndpoints(hybridConnectivityGraph, MAX_MAJOR_ROUTE_ENDPOINTS);
        const adjacency = buildHybridAdjacency(hybridConnectivityGraph, routeCostSurface);
        const nodeLookup = buildLookupById(hybridConnectivityGraph && hybridConnectivityGraph.nodes, 'nodeId');
        const edgeLookup = buildLookupById(hybridConnectivityGraph && hybridConnectivityGraph.edges, 'edgeId');
        const edgeCostLookup = buildLookupById(routeCostSurface && routeCostSurface.edgeCosts, 'edgeId');
        const candidateRoutes = [];
        let unreachablePairCount = 0;

        for (let leftIndex = 0; leftIndex < majorRouteEndpoints.length; leftIndex += 1) {
            for (let rightIndex = leftIndex + 1; rightIndex < majorRouteEndpoints.length; rightIndex += 1) {
                const leftEndpoint = majorRouteEndpoints[leftIndex];
                const rightEndpoint = majorRouteEndpoints[rightIndex];
                const sampledRoute = sampleRouteBetweenEndpoints(leftEndpoint, rightEndpoint, adjacency);

                if (!sampledRoute) {
                    unreachablePairCount += 1;
                    continue;
                }

                const routeEdges = sampledRoute.edgePathIds
                    .map((edgeId) => edgeLookup.get(normalizeString(edgeId, '')) || {})
                    .filter((edge) => Boolean(edge.edgeId));
                const edgeCosts = sampledRoute.edgePathIds
                    .map((edgeId) => edgeCostLookup.get(normalizeString(edgeId, '')) || edgeLookup.get(normalizeString(edgeId, '')) || {})
                    .filter((edge) => Boolean(edge.edgeId || edge.coarseRouteCost));
                const nodePath = sampledRoute.nodePathIds
                    .map((nodeId) => nodeLookup.get(normalizeString(nodeId, '')) || {})
                    .filter((node) => Boolean(node.nodeId));
                const landEdgeCount = routeEdges.filter((edge) => edge.landGraphEdge).length;
                const seaEdgeCount = routeEdges.filter((edge) => edge.seaGraphEdge).length;
                const transitionEdgeCount = routeEdges.filter((edge) => edge.transitionEdge).length;
                const meanEdgeRouteCost = roundValue(computeMean(edgeCosts.map((edgeCost) => edgeCost.coarseRouteCost)));
                const peakEdgeRouteCost = roundValue(
                    edgeCosts.reduce((maxValue, edgeCost) => Math.max(maxValue, clampUnitInterval(edgeCost.coarseRouteCost, 0)), 0)
                );
                const routeMode = classifySampledRouteMode(landEdgeCount, seaEdgeCount, transitionEdgeCount);

                candidateRoutes.push({
                    routeId: `macro_route_${String(candidateRoutes.length + 1).padStart(3, '0')}`,
                    fromEndpointId: normalizeString(leftEndpoint.endpointId, ''),
                    toEndpointId: normalizeString(rightEndpoint.endpointId, ''),
                    fromNodeId: normalizeString(leftEndpoint.nodeId, ''),
                    toNodeId: normalizeString(rightEndpoint.nodeId, ''),
                    fromContinentId: normalizeString(leftEndpoint.continentId, ''),
                    toContinentId: normalizeString(rightEndpoint.continentId, ''),
                    fromRegionalSegmentId: normalizeString(leftEndpoint.sourceRegionalSegmentId, ''),
                    toRegionalSegmentId: normalizeString(rightEndpoint.sourceRegionalSegmentId, ''),
                    nodePathIds: sampledRoute.nodePathIds.slice(),
                    edgePathIds: sampledRoute.edgePathIds.slice(),
                    intermediateCoastalNodeIds: nodePath
                        .filter((node) => node.nodeType === 'coastal_terminal')
                        .map((node) => normalizeString(node.sourceCoastalNodeId, ''))
                        .filter(Boolean)
                        .sort(),
                    hopCount: sampledRoute.hopCount,
                    totalRouteCost: sampledRoute.totalRouteCost,
                    meanEdgeRouteCost,
                    peakEdgeRouteCost,
                    routeCostClass: classifyRouteCost(meanEdgeRouteCost),
                    routeMode,
                    landEdgeCount,
                    seaEdgeCount,
                    transitionEdgeCount,
                    crossContinentRoute: Boolean(
                        leftEndpoint.continentId
                        && rightEndpoint.continentId
                        && leftEndpoint.continentId !== rightEndpoint.continentId
                    ),
                    dominantRouteDriverIds: aggregateRouteDriverIds(edgeCosts),
                    sampledDeterministically: true,
                    futureMacroCorridorInput: true
                });
            }
        }

        const pairCount = Math.max(0, (majorRouteEndpoints.length * (majorRouteEndpoints.length - 1)) / 2);
        const totalRouteCosts = candidateRoutes.map((route) => normalizeNumber(route.totalRouteCost, 0));

        return {
            outputId: MACRO_ROUTES_OUTPUT_ID,
            stageId: 'routeSampling',
            modelId: ROUTE_SAMPLING_MODEL_ID,
            deterministic: true,
            seedNamespace: 'macro.connectivityGraph.routeSampling',
            hybridGraphOutputId: normalizeString(hybridConnectivityGraph.outputId, HYBRID_GRAPH_OUTPUT_ID),
            routeCostSurfaceOutputId: normalizeString(routeCostSurface.outputId, ROUTE_COST_SURFACE_OUTPUT_ID),
            sourceOutputIds: [
                normalizeString(hybridConnectivityGraph.outputId, ''),
                normalizeString(routeCostSurface.outputId, '')
            ].filter(Boolean),
            majorRouteEndpoints,
            candidateRoutes,
            summary: {
                majorRouteEndpointCount: majorRouteEndpoints.length,
                candidatePairCount: pairCount,
                sampledRouteCount: candidateRoutes.length,
                unreachablePairCount,
                meanSampledRouteCost: totalRouteCosts.length ? roundMetric(computeMean(totalRouteCosts)) : 0,
                landOnlyRouteCount: candidateRoutes.filter((route) => route.routeMode === 'land_only').length,
                marineAssistedRouteCount: candidateRoutes.filter((route) => route.routeMode === 'marine_assisted').length,
                crossContinentRouteCount: candidateRoutes.filter((route) => route.crossContinentRoute).length,
                routeSamplingPerformed: true,
                corridorExtractionPerformed: false,
                brittlenessDetectionPerformed: false,
                valueMeaning: 'deterministic candidate routes between selected major inland-region endpoints over the hybrid graph; no corridor extraction or brittleness analysis'
            },
            compatibility: {
                routeSamplingOutput: true,
                macroRoutesOutput: true,
                corridorOutput: false,
                brittlenessOutput: false,
                gameplaySemanticsOutput: false
            },
            intentionallyAbsent: MACRO_ROUTE_INTENTIONALLY_ABSENT.slice()
        };
    }

    function classifyCorridorStrength(supportScore = 0) {
        const normalizedSupport = clampUnitInterval(supportScore, 0);
        if (normalizedSupport >= 0.72) {
            return 'strong';
        }
        if (normalizedSupport >= 0.5) {
            return 'established';
        }
        if (normalizedSupport >= 0.34) {
            return 'emergent';
        }
        return 'weak';
    }

    function classifyCorridorDependence({
        mandatoryCorridor = false,
        redundantCorridor = false,
        brittleCorridor = false
    } = {}) {
        if (mandatoryCorridor) {
            return 'mandatory';
        }
        if (redundantCorridor) {
            return 'redundant';
        }
        if (brittleCorridor) {
            return 'brittle';
        }
        return 'mixed';
    }

    function computeCorridorStructureFragility({
        edgeCount = 0,
        nodeCount = 0,
        anchorCount = 0,
        branchCount = 0,
        transitionEdgeCount = 0,
        peakEdgeRouteCost = 0,
        routeMode = ''
    } = {}) {
        const safeEdgeCount = Math.max(1, normalizeInteger(edgeCount, 0));
        const safeNodeCount = Math.max(1, normalizeInteger(nodeCount, 0));
        const linearityPressure = branchCount === 0
            ? 1
            : clampUnitInterval(1 - (normalizeInteger(branchCount, 0) / safeNodeCount), 0);
        const transitionPressure = clampUnitInterval(
            normalizeInteger(transitionEdgeCount, 0) / safeEdgeCount,
            0
        );
        const anchorPressure = clampUnitInterval(
            Math.min(1, normalizeInteger(anchorCount, 0) / Math.max(2, safeNodeCount)),
            0
        );
        const modePressure = (
            normalizeString(routeMode, '') === 'marine_assisted' ? 0.16
                : normalizeString(routeMode, '') === 'coastal_transfer' ? 0.12
                : 0.04
        );

        return roundValue(clampUnitInterval(
            (linearityPressure * 0.38)
            + (transitionPressure * 0.22)
            + (clampUnitInterval(peakEdgeRouteCost, 0) * 0.24)
            + (anchorPressure * 0.1)
            + modePressure,
            0
        ));
    }

    function analyzeCorridorDependence(corridor = {}, macroRoutes = {}, hybridConnectivityGraph = {}, routeCostSurface = {}) {
        const candidateRoutes = Array.isArray(macroRoutes && macroRoutes.candidateRoutes)
            ? macroRoutes.candidateRoutes
            : [];
        const endpointLookup = buildLookupById(macroRoutes && macroRoutes.majorRouteEndpoints, 'endpointId');
        const excludedEdgeIdSet = new Set(
            (Array.isArray(corridor.corridorEdgeIds) ? corridor.corridorEdgeIds : [])
                .map((edgeId) => normalizeString(edgeId, ''))
                .filter(Boolean)
        );
        const affectedRoutes = candidateRoutes.filter((route) => (
            Array.isArray(route.edgePathIds)
                ? route.edgePathIds.some((edgeId) => excludedEdgeIdSet.has(normalizeString(edgeId, '')))
                : false
        ));
        const adjacencyWithoutCorridor = buildHybridAdjacency(
            hybridConnectivityGraph,
            routeCostSurface,
            excludedEdgeIdSet
        );
        const alternativeRouteRows = [];
        let blockedRouteCount = 0;
        let severeDetourCount = 0;

        affectedRoutes.forEach((route) => {
            const fromEndpoint = endpointLookup.get(normalizeString(route.fromEndpointId, '')) || {};
            const toEndpoint = endpointLookup.get(normalizeString(route.toEndpointId, '')) || {};
            const alternativeRoute = sampleRouteBetweenEndpoints(
                fromEndpoint,
                toEndpoint,
                adjacencyWithoutCorridor
            );

            if (!alternativeRoute) {
                blockedRouteCount += 1;
                alternativeRouteRows.push({
                    routeId: normalizeString(route.routeId, ''),
                    blockedWithoutCorridor: true,
                    alternativeRouteCost: null,
                    relativeDetourPenalty: null
                });
                return;
            }

            const baselineRouteCost = Math.max(0.001, normalizeNumber(route.totalRouteCost, 0.001));
            const detourPenalty = Math.max(0, normalizeNumber(alternativeRoute.totalCost, 0) - baselineRouteCost);
            const relativeDetourPenalty = roundValue(clampUnitInterval(detourPenalty / baselineRouteCost, 0));
            if (relativeDetourPenalty >= 0.38) {
                severeDetourCount += 1;
            }

            alternativeRouteRows.push({
                routeId: normalizeString(route.routeId, ''),
                blockedWithoutCorridor: false,
                alternativeRouteCost: roundMetric(normalizeNumber(alternativeRoute.totalCost, 0)),
                relativeDetourPenalty,
                alternativeEdgePathIds: Array.isArray(alternativeRoute.edgePathIds)
                    ? alternativeRoute.edgePathIds.slice()
                    : []
            });
        });

        const affectedRouteCount = affectedRoutes.length;
        const alternativeRouteCount = alternativeRouteRows.filter((row) => !row.blockedWithoutCorridor).length;
        const relativeDetourPenalties = alternativeRouteRows
            .filter((row) => !row.blockedWithoutCorridor && Number.isFinite(row.relativeDetourPenalty))
            .map((row) => normalizeNumber(row.relativeDetourPenalty, 0));
        const blockedRouteRatio = affectedRouteCount > 0
            ? blockedRouteCount / affectedRouteCount
            : 0;
        const alternativeRouteRatio = affectedRouteCount > 0
            ? alternativeRouteCount / affectedRouteCount
            : 0;
        const severeDetourRatio = affectedRouteCount > 0
            ? severeDetourCount / affectedRouteCount
            : 0;
        const meanAlternativeDetourPenalty = relativeDetourPenalties.length
            ? roundValue(computeMean(relativeDetourPenalties))
            : 0;
        const routeDependenceScore = roundValue(clampUnitInterval(
            (blockedRouteRatio * 0.62)
            + ((1 - alternativeRouteRatio) * 0.18)
            + (meanAlternativeDetourPenalty * 0.2),
            0
        ));
        const alternativeSupportScore = roundValue(clampUnitInterval(
            (alternativeRouteRatio * 0.72)
            + ((1 - meanAlternativeDetourPenalty) * 0.28),
            0
        ));
        const structureFragilityScore = computeCorridorStructureFragility({
            edgeCount: corridor.edgeCount,
            nodeCount: Array.isArray(corridor.corridorNodeIds) ? corridor.corridorNodeIds.length : 0,
            anchorCount: Array.isArray(corridor.anchorNodeIds) ? corridor.anchorNodeIds.length : 0,
            branchCount: normalizeInteger(corridor.branchNodeCount, 0),
            transitionEdgeCount: corridor.transitionEdgeCount,
            peakEdgeRouteCost: corridor.peakEdgeRouteCost,
            routeMode: corridor.routeMode
        });

        const mandatoryCorridor = affectedRouteCount > 0 && (
            blockedRouteRatio >= 0.67
            || blockedRouteCount === affectedRouteCount
        );
        const redundantCorridor = affectedRouteCount > 0
            && blockedRouteRatio <= 0.16
            && alternativeRouteRatio >= 0.84
            && meanAlternativeDetourPenalty <= 0.18;
        const brittleCorridor = affectedRouteCount > 0
            && !redundantCorridor
            && (
                mandatoryCorridor
                || (routeDependenceScore >= 0.5 && structureFragilityScore >= 0.5)
                || severeDetourRatio >= 0.4
            );

        return {
            affectedRouteCount,
            blockedRouteCount,
            alternativeRouteCount,
            severeDetourCount,
            blockedRouteRatio: roundValue(blockedRouteRatio),
            alternativeRouteRatio: roundValue(alternativeRouteRatio),
            severeDetourRatio: roundValue(severeDetourRatio),
            meanAlternativeDetourPenalty,
            routeDependenceScore,
            alternativeSupportScore,
            structureFragilityScore,
            mandatoryCorridor,
            redundantCorridor,
            brittleCorridor,
            corridorDependenceClass: classifyCorridorDependence({
                mandatoryCorridor,
                redundantCorridor,
                brittleCorridor
            }),
            dependenceSampleRows: alternativeRouteRows
        };
    }

    function buildMacroCorridors(macroRoutes = {}, hybridConnectivityGraph = {}, routeCostSurface = {}) {
        const candidateRoutes = Array.isArray(macroRoutes && macroRoutes.candidateRoutes)
            ? macroRoutes.candidateRoutes
            : [];
        const edgeLookup = buildLookupById(hybridConnectivityGraph && hybridConnectivityGraph.edges, 'edgeId');
        const nodeLookup = buildLookupById(hybridConnectivityGraph && hybridConnectivityGraph.nodes, 'nodeId');
        const edgeCostLookup = buildLookupById(routeCostSurface && routeCostSurface.edgeCosts, 'edgeId');
        const edgeSupportByEdgeId = new Map();

        candidateRoutes.forEach((route) => {
            const routeQualityWeight = roundValue(clampUnitInterval(
                0.45 + ((1 - clampUnitInterval(route.meanEdgeRouteCost, 0)) * 0.55),
                0.45
            ));

            (Array.isArray(route.edgePathIds) ? route.edgePathIds : []).forEach((edgeId) => {
                const normalizedEdgeId = normalizeString(edgeId, '');
                if (!normalizedEdgeId) {
                    return;
                }

                const edgeRecord = edgeSupportByEdgeId.get(normalizedEdgeId) || {
                    edgeId: normalizedEdgeId,
                    routeIds: new Set(),
                    usageCount: 0,
                    weightedUsage: 0
                };
                edgeRecord.usageCount += 1;
                edgeRecord.weightedUsage = roundMetric(normalizeNumber(edgeRecord.weightedUsage, 0) + routeQualityWeight);
                edgeRecord.routeIds.add(normalizeString(route.routeId, ''));
                edgeSupportByEdgeId.set(normalizedEdgeId, edgeRecord);
            });
        });

        const maxRouteCount = Math.max(1, candidateRoutes.length);
        const qualifyingEdges = Array.from(edgeSupportByEdgeId.values())
            .map((edgeSupport) => {
                const edge = edgeLookup.get(edgeSupport.edgeId) || {};
                const edgeCost = edgeCostLookup.get(edgeSupport.edgeId) || edge;
                const repeatSupport = edgeSupport.usageCount / maxRouteCount;
                const strengthSupport = clampUnitInterval(1 - normalizeNumber(edgeCost.coarseRouteCost, getNestedValue(edge, 'coarseRouteCost', 0)), 0);
                const supportScore = roundValue(clampUnitInterval(
                    (repeatSupport * 0.62)
                    + (clampUnitInterval(edgeSupport.weightedUsage / maxRouteCount, 0) * 0.22)
                    + (strengthSupport * 0.16),
                    0
                ));

                return {
                    edgeId: edgeSupport.edgeId,
                    usageCount: edgeSupport.usageCount,
                    weightedUsage: roundMetric(edgeSupport.weightedUsage),
                    supportScore,
                    routeIds: Array.from(edgeSupport.routeIds).filter(Boolean).sort(),
                    edge,
                    edgeCost
                };
            })
            .filter((edgeSupport) => edgeSupport.usageCount >= 2 || edgeSupport.supportScore >= 0.42)
            .sort((left, right) => (
                right.supportScore - left.supportScore
                || right.usageCount - left.usageCount
                || left.edgeId.localeCompare(right.edgeId)
            ));

        const nodeToEdgeIds = new Map();
        qualifyingEdges.forEach((edgeSupport) => {
            const fromNodeId = normalizeString(getNestedValue(edgeSupport.edge, 'fromNodeId'), '');
            const toNodeId = normalizeString(getNestedValue(edgeSupport.edge, 'toNodeId'), '');
            [fromNodeId, toNodeId].filter(Boolean).forEach((nodeId) => {
                if (!nodeToEdgeIds.has(nodeId)) {
                    nodeToEdgeIds.set(nodeId, []);
                }
                nodeToEdgeIds.get(nodeId).push(edgeSupport.edgeId);
            });
        });
        nodeToEdgeIds.forEach((edgeIds) => edgeIds.sort());

        const edgeSupportLookup = new Map(qualifyingEdges.map((edgeSupport) => [edgeSupport.edgeId, edgeSupport]));
        const visitedEdgeIds = new Set();
        const corridors = [];

        qualifyingEdges.forEach((edgeSupport) => {
            if (visitedEdgeIds.has(edgeSupport.edgeId)) {
                return;
            }

            const edgeQueue = [edgeSupport.edgeId];
            const corridorEdgeIds = new Set();
            const corridorNodeIds = new Set();
            const supportingRouteIds = new Set();

            while (edgeQueue.length > 0) {
                const currentEdgeId = edgeQueue.shift();
                if (!currentEdgeId || visitedEdgeIds.has(currentEdgeId)) {
                    continue;
                }
                visitedEdgeIds.add(currentEdgeId);

                const currentEdgeSupport = edgeSupportLookup.get(currentEdgeId);
                if (!currentEdgeSupport) {
                    continue;
                }

                corridorEdgeIds.add(currentEdgeId);
                currentEdgeSupport.routeIds.forEach((routeId) => supportingRouteIds.add(routeId));

                const fromNodeId = normalizeString(getNestedValue(currentEdgeSupport.edge, 'fromNodeId'), '');
                const toNodeId = normalizeString(getNestedValue(currentEdgeSupport.edge, 'toNodeId'), '');
                [fromNodeId, toNodeId].filter(Boolean).forEach((nodeId) => {
                    corridorNodeIds.add(nodeId);
                    const connectedEdgeIds = nodeToEdgeIds.get(nodeId) || [];
                    connectedEdgeIds.forEach((connectedEdgeId) => {
                        if (!visitedEdgeIds.has(connectedEdgeId)) {
                            edgeQueue.push(connectedEdgeId);
                        }
                    });
                });
            }

            const corridorEdgeRows = Array.from(corridorEdgeIds)
                .map((edgeId) => edgeSupportLookup.get(edgeId))
                .filter(Boolean);
            const routeIds = Array.from(supportingRouteIds).filter(Boolean).sort();
            const supportScore = roundValue(computeMean(corridorEdgeRows.map((row) => row.supportScore)));
            const meanEdgeRouteCost = roundValue(computeMean(corridorEdgeRows.map((row) => normalizeNumber(getNestedValue(row.edgeCost, 'coarseRouteCost'), 0))));
            const peakEdgeRouteCost = roundValue(
                corridorEdgeRows.reduce((maxValue, row) => Math.max(maxValue, clampUnitInterval(getNestedValue(row.edgeCost, 'coarseRouteCost'), 0)), 0)
            );
            const landEdgeCount = corridorEdgeRows.filter((row) => Boolean(getNestedValue(row.edge, 'landGraphEdge'))).length;
            const seaEdgeCount = corridorEdgeRows.filter((row) => Boolean(getNestedValue(row.edge, 'seaGraphEdge'))).length;
            const transitionEdgeCount = corridorEdgeRows.filter((row) => Boolean(getNestedValue(row.edge, 'transitionEdge'))).length;
            const nodeIds = Array.from(corridorNodeIds).filter(Boolean).sort();
            const nodeDegreeByNodeId = new Map(nodeIds.map((nodeId) => [nodeId, 0]));

            corridorEdgeRows.forEach((row) => {
                const fromNodeId = normalizeString(getNestedValue(row.edge, 'fromNodeId'), '');
                const toNodeId = normalizeString(getNestedValue(row.edge, 'toNodeId'), '');
                if (nodeDegreeByNodeId.has(fromNodeId)) {
                    nodeDegreeByNodeId.set(fromNodeId, normalizeInteger(nodeDegreeByNodeId.get(fromNodeId), 0) + 1);
                }
                if (nodeDegreeByNodeId.has(toNodeId)) {
                    nodeDegreeByNodeId.set(toNodeId, normalizeInteger(nodeDegreeByNodeId.get(toNodeId), 0) + 1);
                }
            });

            corridors.push({
                corridorId: `macro_corridor_${String(corridors.length + 1).padStart(3, '0')}`,
                corridorEdgeIds: corridorEdgeRows.map((row) => row.edgeId).sort(),
                corridorNodeIds: nodeIds,
                anchorNodeIds: nodeIds.filter((nodeId) => normalizeInteger(nodeDegreeByNodeId.get(nodeId), 0) <= 1),
                branchNodeIds: nodeIds.filter((nodeId) => normalizeInteger(nodeDegreeByNodeId.get(nodeId), 0) >= 3),
                branchNodeCount: nodeIds.filter((nodeId) => normalizeInteger(nodeDegreeByNodeId.get(nodeId), 0) >= 3).length,
                supportingRouteIds: routeIds,
                sampledRouteCount: routeIds.length,
                edgeCount: corridorEdgeRows.length,
                supportScore,
                corridorStrengthClass: classifyCorridorStrength(supportScore),
                meanEdgeRouteCost,
                peakEdgeRouteCost,
                routeMode: classifySampledRouteMode(landEdgeCount, seaEdgeCount, transitionEdgeCount),
                landEdgeCount,
                seaEdgeCount,
                transitionEdgeCount,
                dominantRouteDriverIds: aggregateRouteDriverIds(corridorEdgeRows.map((row) => row.edgeCost)),
                sourceCoastalNodeIds: corridorEdgeRows
                    .map((row) => normalizeString(getNestedValue(row.edge, 'sourceCoastalNodeId'), ''))
                    .filter(Boolean)
                    .sort(),
                futureBrittlenessInput: true
            });
        });

        const classifiedCorridors = corridors.map((corridor) => ({
            ...corridor,
            ...analyzeCorridorDependence(corridor, macroRoutes, hybridConnectivityGraph, routeCostSurface)
        }));

        classifiedCorridors.sort((left, right) => (
            right.supportScore - left.supportScore
            || right.sampledRouteCount - left.sampledRouteCount
            || left.corridorId.localeCompare(right.corridorId)
        ));

        return {
            outputId: MACRO_CORRIDORS_OUTPUT_ID,
            stageId: 'corridorExtraction',
            modelId: MACRO_CORRIDOR_MODEL_ID,
            deterministic: true,
            seedNamespace: 'macro.connectivityGraph.corridorExtraction',
            routeSamplingOutputId: normalizeString(macroRoutes.outputId, MACRO_ROUTES_OUTPUT_ID),
            hybridGraphOutputId: normalizeString(hybridConnectivityGraph.outputId, HYBRID_GRAPH_OUTPUT_ID),
            routeCostSurfaceOutputId: normalizeString(routeCostSurface.outputId, ROUTE_COST_SURFACE_OUTPUT_ID),
            sourceOutputIds: [
                normalizeString(macroRoutes.outputId, ''),
                normalizeString(hybridConnectivityGraph.outputId, ''),
                normalizeString(routeCostSurface.outputId, '')
            ].filter(Boolean),
            macroCorridors: classifiedCorridors,
            summary: {
                corridorCount: classifiedCorridors.length,
                sampledRouteCount: candidateRoutes.length,
                qualifyingEdgeCount: qualifyingEdges.length,
                strongestCorridorId: classifiedCorridors.length ? classifiedCorridors[0].corridorId : '',
                repeatingCorridorCount: classifiedCorridors.filter((corridor) => corridor.sampledRouteCount >= 2).length,
                landDominantCorridorCount: classifiedCorridors.filter((corridor) => corridor.routeMode === 'land_only').length,
                marineAssistedCorridorCount: classifiedCorridors.filter((corridor) => corridor.routeMode === 'marine_assisted').length,
                mandatoryCorridorCount: classifiedCorridors.filter((corridor) => corridor.mandatoryCorridor).length,
                redundantCorridorCount: classifiedCorridors.filter((corridor) => corridor.redundantCorridor).length,
                brittleCorridorCount: classifiedCorridors.filter((corridor) => corridor.brittleCorridor).length,
                routeSamplingPerformed: true,
                corridorExtractionPerformed: true,
                brittlenessDetectionPerformed: true,
                valueMeaning: 'coarse macro corridors extracted from repeated or strong sampled routes with mandatory/redundant/brittle classification from graph structure and route dependence; no chokepoint records'
            },
            compatibility: {
                routeSamplingOutput: false,
                macroRoutesOutput: false,
                corridorOutput: true,
                brittlenessOutput: true,
                gameplaySemanticsOutput: false
            },
            intentionallyAbsent: MACRO_CORRIDOR_INTENTIONALLY_ABSENT.slice()
        };
    }

    function createInlandLandNode(segment = {}, corePotential = {}, fracturedPeriphery = {}, continentSummary = {}) {
        const regionalSegmentId = normalizeString(segment.regionalSegmentId, '');
        const meanInteriorPassability = roundValue(segment.meanInteriorPassability);
        const corePotentialScore = roundValue(
            clampUnitInterval(corePotential.corePotentialScore, meanInteriorPassability)
        );
        const fracturedPeripheryScore = roundValue(
            clampUnitInterval(fracturedPeriphery.fracturedPeripheryScore, 0)
        );
        const meanContinentalCohesion = roundValue(
            clampUnitInterval(continentSummary.meanContinentalCohesion, meanInteriorPassability)
        );

        return {
            nodeId: `land_node_${regionalSegmentId}`,
            nodeType: 'inland_region',
            nodeRole: classifyLandNodeRole(corePotentialScore, fracturedPeripheryScore, meanInteriorPassability),
            sourceRegionalSegmentId: regionalSegmentId,
            continentId: normalizeString(segment.continentId, ''),
            continentBodyId: normalizeString(segment.continentBodyId, ''),
            segmentIndex: normalizeInteger(segment.segmentIndex, 0),
            centroidPoint: cloneValue(segment.centroidPoint || {}),
            normalizedCentroid: normalizePoint(segment.normalizedCentroid || {}),
            cellCount: normalizeInteger(segment.cellCount, 0),
            continentCellRatio: roundValue(segment.continentCellRatio),
            meanInteriorPassability,
            meanClimateStress: roundValue(segment.meanClimateStress),
            meanContinentalCohesion,
            corePotentialScore,
            corePotentialClass: normalizeString(corePotential.corePotentialClass, ''),
            fracturedPeripheryScore,
            fracturedPeripheryClass: normalizeString(fracturedPeriphery.fracturedPeripheryClass, ''),
            barrierContactCellRatio: roundValue(segment.barrierContactCellRatio),
            dominantReliefType: normalizeString(segment.dominantReliefType, ''),
            barrierSeparatedNeighborSegmentIds: Array.isArray(segment.barrierSeparatedNeighborSegmentIds)
                ? segment.barrierSeparatedNeighborSegmentIds.slice().sort()
                : [],
            futureMacroRouteNodeInput: true,
            futureHybridGraphBridge: false
        };
    }

    function scoreCoastalAttachment(coastalNode = {}, inlandNode = {}) {
        const proximitySupport = clampUnitInterval(
            1 - computeNormalizedDistance(
                normalizePoint(coastalNode.normalizedAnchorPoint || {}),
                normalizePoint(inlandNode.normalizedCentroid || {})
            ),
            0
        );
        return roundValue(clampUnitInterval(
            (clampUnitInterval(inlandNode.meanInteriorPassability, 0) * 0.28)
            + (clampUnitInterval(inlandNode.corePotentialScore, inlandNode.meanInteriorPassability) * 0.22)
            + ((1 - clampUnitInterval(inlandNode.fracturedPeripheryScore, 0)) * 0.14)
            + (clampUnitInterval(coastalNode.inlandLinkBonusScore, 0) * 0.2)
            + (clampUnitInterval(coastalNode.coastalOpportunityScore, 0) * 0.08)
            + (proximitySupport * 0.08),
            0
        ));
    }

    function selectBestCoastalAttachmentSegment(coastalNode = {}, inlandNodes = []) {
        const preferredCandidates = inlandNodes.filter((inlandNode) => (
            coastalNode.continentId
                ? inlandNode.continentId === coastalNode.continentId
                : true
        ));
        const candidates = preferredCandidates.length ? preferredCandidates : inlandNodes.slice();
        let bestMatch = null;

        candidates.forEach((candidate) => {
            const attachmentStrength = scoreCoastalAttachment(coastalNode, candidate);
            if (!bestMatch || attachmentStrength > bestMatch.attachmentStrength || (
                attachmentStrength === bestMatch.attachmentStrength
                && candidate.nodeId.localeCompare(bestMatch.node.nodeId) < 0
            )) {
                bestMatch = {
                    node: candidate,
                    attachmentStrength
                };
            }
        });

        return bestMatch;
    }

    function createCoastalTerminalNode(coastalNode = {}, attachment = null) {
        return {
            nodeId: `land_terminal_${normalizeString(coastalNode.coastalNodeId, 'unknown')}`,
            nodeType: 'coastal_terminal',
            nodeRole: 'coastal_land_terminal',
            sourceCoastalNodeId: normalizeString(coastalNode.coastalNodeId, ''),
            continentId: normalizeString(
                coastalNode.continentId,
                attachment ? normalizeString(attachment.node.continentId, '') : ''
            ),
            seaRegionClusterId: normalizeString(coastalNode.seaRegionClusterId, ''),
            basinType: normalizeString(coastalNode.basinType, ''),
            anchorCellIndex: normalizeInteger(coastalNode.anchorCellIndex, -1),
            anchorPoint: cloneValue(coastalNode.anchorPoint || {}),
            normalizedAnchorPoint: normalizePoint(coastalNode.normalizedAnchorPoint || {}),
            coastalOpportunityScore: roundValue(coastalNode.coastalOpportunityScore),
            exceptionalityScore: roundValue(coastalNode.exceptionalityScore),
            exceptionalityClass: normalizeString(coastalNode.exceptionalityClass, ''),
            inlandLinkBonusScore: roundValue(coastalNode.inlandLinkBonusScore),
            attachmentSegmentId: attachment ? normalizeString(attachment.node.sourceRegionalSegmentId, '') : '',
            attachmentNodeId: attachment ? normalizeString(attachment.node.nodeId, '') : '',
            attachmentStrength: attachment ? roundValue(attachment.attachmentStrength) : 0,
            futureSeaGraphBridge: true,
            futureHybridGraphBridge: true
        };
    }

    function buildInterRegionalLandEdges(inlandNodes = []) {
        const nodeBySegmentId = buildLookupById(inlandNodes, 'sourceRegionalSegmentId');
        const builtPairs = new Set();
        const edges = [];

        inlandNodes.forEach((inlandNode) => {
            const neighborSegmentIds = Array.isArray(inlandNode.barrierSeparatedNeighborSegmentIds)
                ? inlandNode.barrierSeparatedNeighborSegmentIds
                : [];

            neighborSegmentIds.forEach((neighborSegmentId) => {
                const otherNode = nodeBySegmentId.get(neighborSegmentId);
                if (!otherNode || otherNode.nodeId === inlandNode.nodeId) {
                    return;
                }
                if (inlandNode.continentId && otherNode.continentId && inlandNode.continentId !== otherNode.continentId) {
                    return;
                }

                const pairKey = [inlandNode.nodeId, otherNode.nodeId].sort().join('::');
                if (builtPairs.has(pairKey)) {
                    return;
                }
                builtPairs.add(pairKey);

                const connectionStrength = roundValue(clampUnitInterval(
                    ((inlandNode.meanInteriorPassability + otherNode.meanInteriorPassability) * 0.21)
                    + ((inlandNode.corePotentialScore + otherNode.corePotentialScore) * 0.12)
                    + (((1 - inlandNode.fracturedPeripheryScore) + (1 - otherNode.fracturedPeripheryScore)) * 0.09)
                    + (((1 - inlandNode.barrierContactCellRatio) + (1 - otherNode.barrierContactCellRatio)) * 0.08),
                    0
                ));

                edges.push({
                    edgeId: `land_edge_${String(edges.length + 1).padStart(3, '0')}`,
                    edgeType: 'interregional_link',
                    fromNodeId: inlandNode.nodeId,
                    toNodeId: otherNode.nodeId,
                    fromRegionalSegmentId: inlandNode.sourceRegionalSegmentId,
                    toRegionalSegmentId: otherNode.sourceRegionalSegmentId,
                    continentId: normalizeString(inlandNode.continentId, normalizeString(otherNode.continentId, '')),
                    coarseConnectivityStrength: connectionStrength,
                    connectionClass: classifyConnectionStrength(connectionStrength),
                    crossesBarrierBand: true,
                    routeCostComputed: false,
                    futureMacroRouteInput: true
                });
            });
        });

        return edges;
    }

    function buildCoastalAttachmentEdges(coastalTerminalNodes = []) {
        return coastalTerminalNodes
            .filter((coastalTerminalNode) => coastalTerminalNode.attachmentNodeId)
            .map((coastalTerminalNode, edgeIndex) => ({
                edgeId: `land_edge_${String(edgeIndex + 1).padStart(3, '0')}_coastal`,
                edgeType: 'coastal_terminal_attachment',
                fromNodeId: coastalTerminalNode.nodeId,
                toNodeId: coastalTerminalNode.attachmentNodeId,
                fromCoastalNodeId: coastalTerminalNode.sourceCoastalNodeId,
                toRegionalSegmentId: coastalTerminalNode.attachmentSegmentId,
                continentId: normalizeString(coastalTerminalNode.continentId, ''),
                coarseConnectivityStrength: roundValue(coastalTerminalNode.attachmentStrength),
                connectionClass: classifyConnectionStrength(coastalTerminalNode.attachmentStrength),
                crossesBarrierBand: false,
                routeCostComputed: false,
                futureSeaGraphBridge: true,
                futureHybridGraphBridge: true
            }));
    }

    function getSeaClusterList(seaRegionClustersOutput = {}, seaNavigabilityTagging = {}) {
        if (Array.isArray(seaNavigabilityTagging.taggedSeaRegionClusters) && seaNavigabilityTagging.taggedSeaRegionClusters.length > 0) {
            return seaNavigabilityTagging.taggedSeaRegionClusters.slice();
        }

        if (Array.isArray(seaRegionClustersOutput.seaRegionClusters)) {
            return seaRegionClustersOutput.seaRegionClusters.slice();
        }

        return [];
    }

    function classifySeaNodeRole(cluster = {}) {
        const basinType = normalizeString(cluster.basinType, '');
        if (basinType === 'open_ocean') {
            return 'open_ocean_node';
        }
        if (basinType === 'semi_enclosed_sea') {
            return 'semi_enclosed_sea_node';
        }
        if (basinType === 'inland_sea') {
            return 'inland_sea_node';
        }
        if (basinType === 'enclosed_water') {
            return 'confined_sea_node';
        }
        return 'marine_region_node';
    }

    function createSeaRegionNode(cluster = {}, coastalProfile = {}) {
        const seaRegionClusterId = normalizeString(cluster.seaRegionClusterId, '');
        const navigability = roundValue(
            clampUnitInterval(
                cluster.navigability,
                clampUnitInterval(getNestedValue(cluster, 'routeGraphPreparation.traversabilityBias'), 0.5)
            )
        );
        const hazardRoughness = roundValue(
            clampUnitInterval(
                cluster.hazardRoughness,
                clampUnitInterval(getNestedValue(cluster, 'routeGraphPreparation.hazardPenalty'), 0.3)
            )
        );
        const openWaterBias = roundValue(
            clampUnitInterval(
                getNestedValue(cluster, 'routeGraphPreparation.openWaterBias'),
                Boolean(cluster.touchesWorldEdge) || normalizeString(cluster.basinType, '') === 'open_ocean' ? 1 : 0
            )
        );
        const constrainedWaterBias = roundValue(
            clampUnitInterval(
                getNestedValue(cluster, 'routeGraphPreparation.constrainedWaterBias'),
                normalizeString(cluster.basinType, '') === 'inland_sea' || normalizeString(cluster.basinType, '') === 'enclosed_water' ? 1 : 0
            )
        );

        return {
            nodeId: `sea_node_${seaRegionClusterId}`,
            nodeType: 'marine_region',
            nodeRole: classifySeaNodeRole(cluster),
            seaRegionClusterId,
            seaRegionId: normalizeString(getNestedValue(cluster, 'recordDraft.seaRegionId'), ''),
            basinType: normalizeString(cluster.basinType, ''),
            basinKind: normalizeString(cluster.basinKind, ''),
            touchesWorldEdge: Boolean(cluster.touchesWorldEdge),
            cellCount: normalizeInteger(cluster.cellCount, 0),
            normalizedArea: roundValue(cluster.normalizedArea),
            centroidPoint: cloneValue(cluster.centroidPoint || {}),
            normalizedCentroid: normalizePoint(cluster.normalizedCentroid || {}),
            navigability,
            navigabilityClass: normalizeString(cluster.navigabilityClass, ''),
            hazardRoughness,
            hazardRoughnessClass: normalizeString(cluster.hazardRoughnessClass, ''),
            openWaterBias,
            constrainedWaterBias,
            enclosureScore: roundValue(getNestedValue(cluster, 'navigabilitySignals.enclosureScore', getNestedValue(cluster, 'classificationSignals.enclosureScore', 0))),
            edgeExposureRatio: roundValue(getNestedValue(cluster, 'navigabilitySignals.edgeExposureRatio', getNestedValue(cluster, 'classificationSignals.edgeExposureRatio', 0))),
            linkedCoastalOpportunityScore: roundValue(coastalProfile.coastalOpportunityScore),
            futureMacroRouteNodeInput: true,
            futureHybridGraphBridge: true
        };
    }

    function scoreSeaBasinConnection(leftNode = {}, rightNode = {}) {
        const proximitySupport = clampUnitInterval(
            1 - computeNormalizedDistance(
                normalizePoint(leftNode.normalizedCentroid || {}),
                normalizePoint(rightNode.normalizedCentroid || {})
            ),
            0
        );
        const navigabilitySupport = (
            clampUnitInterval(leftNode.navigability, 0.5)
            + clampUnitInterval(rightNode.navigability, 0.5)
        ) / 2;
        const hazardSupport = (
            (1 - clampUnitInterval(leftNode.hazardRoughness, 0.3))
            + (1 - clampUnitInterval(rightNode.hazardRoughness, 0.3))
        ) / 2;
        const openWaterSupport = Math.max(
            clampUnitInterval(leftNode.openWaterBias, 0),
            clampUnitInterval(rightNode.openWaterBias, 0)
        );
        const enclosurePenalty = Math.max(
            clampUnitInterval(leftNode.constrainedWaterBias, 0),
            clampUnitInterval(rightNode.constrainedWaterBias, 0)
        ) * 0.18;
        const exposureSupport = 1 - Math.max(
            clampUnitInterval(leftNode.edgeExposureRatio, 0),
            clampUnitInterval(rightNode.edgeExposureRatio, 0)
        );

        return roundValue(clampUnitInterval(
            (navigabilitySupport * 0.34)
            + (hazardSupport * 0.18)
            + (proximitySupport * 0.28)
            + (openWaterSupport * 0.14)
            + (exposureSupport * 0.06)
            - enclosurePenalty,
            0
        ));
    }

    function shouldCreateSeaBasinConnection(leftNode = {}, rightNode = {}, connectionStrength = 0) {
        const proximitySupport = clampUnitInterval(
            1 - computeNormalizedDistance(
                normalizePoint(leftNode.normalizedCentroid || {}),
                normalizePoint(rightNode.normalizedCentroid || {})
            ),
            0
        );
        const leftBasinType = normalizeString(leftNode.basinType, '');
        const rightBasinType = normalizeString(rightNode.basinType, '');
        const leftOpen = leftBasinType === 'open_ocean';
        const rightOpen = rightBasinType === 'open_ocean';
        const isolatedBasin = (
            leftBasinType === 'inland_sea'
            || leftBasinType === 'enclosed_water'
            || rightBasinType === 'inland_sea'
            || rightBasinType === 'enclosed_water'
        );

        if (connectionStrength < 0.34) {
            return false;
        }

        if (isolatedBasin) {
            return proximitySupport >= 0.3 && connectionStrength >= 0.42;
        }

        if (leftOpen && rightOpen) {
            return connectionStrength >= 0.42;
        }

        if (leftOpen || rightOpen) {
            return proximitySupport >= 0.18 && connectionStrength >= 0.42;
        }

        return proximitySupport >= 0.26 && connectionStrength >= 0.46;
    }

    function buildInterBasinSeaEdges(seaRegionNodes = []) {
        const edges = [];

        for (let leftIndex = 0; leftIndex < seaRegionNodes.length; leftIndex += 1) {
            for (let rightIndex = leftIndex + 1; rightIndex < seaRegionNodes.length; rightIndex += 1) {
                const leftNode = seaRegionNodes[leftIndex];
                const rightNode = seaRegionNodes[rightIndex];
                const connectionStrength = scoreSeaBasinConnection(leftNode, rightNode);

                if (!shouldCreateSeaBasinConnection(leftNode, rightNode, connectionStrength)) {
                    continue;
                }

                edges.push({
                    edgeId: `sea_edge_${String(edges.length + 1).padStart(3, '0')}`,
                    edgeType: 'interbasin_link',
                    fromNodeId: leftNode.nodeId,
                    toNodeId: rightNode.nodeId,
                    fromSeaRegionClusterId: leftNode.seaRegionClusterId,
                    toSeaRegionClusterId: rightNode.seaRegionClusterId,
                    coarseConnectivityStrength: connectionStrength,
                    connectionClass: classifyConnectionStrength(connectionStrength),
                    routeCostComputed: false,
                    futureMacroRouteInput: true
                });
            }
        }

        return edges;
    }

    function createCoastalSeaTerminalNode(coastalNode = {}, seaRegionNode = {}) {
        const attachmentStrength = roundValue(clampUnitInterval(
            (clampUnitInterval(seaRegionNode.navigability, 0.5) * 0.48)
            + (clampUnitInterval(coastalNode.coastalOpportunityScore, 0) * 0.26)
            + ((1 - clampUnitInterval(seaRegionNode.hazardRoughness, 0.3)) * 0.16)
            + (clampUnitInterval(coastalNode.inlandLinkBonusScore, 0) * 0.1),
            0
        ));

        return {
            nodeId: `sea_terminal_${normalizeString(coastalNode.coastalNodeId, 'unknown')}`,
            nodeType: 'coastal_terminal',
            nodeRole: 'coastal_sea_terminal',
            sourceCoastalNodeId: normalizeString(coastalNode.coastalNodeId, ''),
            seaRegionClusterId: normalizeString(coastalNode.seaRegionClusterId, normalizeString(seaRegionNode.seaRegionClusterId, '')),
            basinType: normalizeString(coastalNode.basinType, normalizeString(seaRegionNode.basinType, '')),
            continentId: normalizeString(coastalNode.continentId, ''),
            anchorCellIndex: normalizeInteger(coastalNode.anchorCellIndex, -1),
            anchorPoint: cloneValue(coastalNode.anchorPoint || {}),
            normalizedAnchorPoint: normalizePoint(coastalNode.normalizedAnchorPoint || {}),
            coastalOpportunityScore: roundValue(coastalNode.coastalOpportunityScore),
            exceptionalityScore: roundValue(coastalNode.exceptionalityScore),
            exceptionalityClass: normalizeString(coastalNode.exceptionalityClass, ''),
            inlandLinkBonusScore: roundValue(coastalNode.inlandLinkBonusScore),
            attachmentNodeId: normalizeString(seaRegionNode.nodeId, ''),
            attachmentSeaRegionClusterId: normalizeString(seaRegionNode.seaRegionClusterId, ''),
            attachmentStrength,
            futureLandGraphBridge: true,
            futureHybridGraphBridge: true
        };
    }

    function buildCoastalSeaAttachmentEdges(coastalSeaTerminalNodes = []) {
        return coastalSeaTerminalNodes
            .filter((coastalSeaTerminalNode) => coastalSeaTerminalNode.attachmentNodeId)
            .map((coastalSeaTerminalNode, edgeIndex) => ({
                edgeId: `sea_edge_${String(edgeIndex + 1).padStart(3, '0')}_coastal`,
                edgeType: 'coastal_sea_attachment',
                fromNodeId: coastalSeaTerminalNode.nodeId,
                toNodeId: coastalSeaTerminalNode.attachmentNodeId,
                fromCoastalNodeId: coastalSeaTerminalNode.sourceCoastalNodeId,
                toSeaRegionClusterId: coastalSeaTerminalNode.attachmentSeaRegionClusterId,
                coarseConnectivityStrength: roundValue(coastalSeaTerminalNode.attachmentStrength),
                connectionClass: classifyConnectionStrength(coastalSeaTerminalNode.attachmentStrength),
                routeCostComputed: false,
                futureLandGraphBridge: true,
                futureHybridGraphBridge: true
            }));
    }

    function scoreHybridTransitionStrength(landTerminalNode = {}, seaTerminalNode = {}) {
        const landAttachmentSupport = clampUnitInterval(
            landTerminalNode.attachmentStrength,
            clampUnitInterval(landTerminalNode.coastalOpportunityScore, 0)
        );
        const seaAttachmentSupport = clampUnitInterval(
            seaTerminalNode.attachmentStrength,
            clampUnitInterval(seaTerminalNode.coastalOpportunityScore, 0)
        );
        const coastalOpportunitySupport = (
            clampUnitInterval(landTerminalNode.coastalOpportunityScore, 0)
            + clampUnitInterval(seaTerminalNode.coastalOpportunityScore, 0)
        ) / 2;
        const inlandLinkSupport = Math.max(
            clampUnitInterval(landTerminalNode.inlandLinkBonusScore, 0),
            clampUnitInterval(seaTerminalNode.inlandLinkBonusScore, 0)
        );
        const anchorProximitySupport = clampUnitInterval(
            1 - computeNormalizedDistance(
                normalizePoint(landTerminalNode.normalizedAnchorPoint || {}),
                normalizePoint(seaTerminalNode.normalizedAnchorPoint || {})
            ),
            1
        );

        return roundValue(clampUnitInterval(
            (landAttachmentSupport * 0.34)
            + (seaAttachmentSupport * 0.34)
            + (coastalOpportunitySupport * 0.16)
            + (inlandLinkSupport * 0.08)
            + (anchorProximitySupport * 0.08),
            0
        ));
    }

    function projectHybridNodes(nodes = [], sourceGraphFamily = '') {
        return nodes.map((node) => ({
            ...cloneValue(node),
            sourceGraphFamily: normalizeString(sourceGraphFamily, ''),
            futureHybridGraphBridge: true
        }));
    }

    function projectHybridEdges(edges = [], sourceGraphFamily = '') {
        return edges.map((edge, edgeIndex) => ({
            ...cloneValue(edge),
            edgeId: `hybrid_edge_${normalizeString(sourceGraphFamily, 'graph')}_${String(edgeIndex + 1).padStart(3, '0')}`,
            sourceGraphFamily: normalizeString(sourceGraphFamily, ''),
            sourceGraphEdgeId: normalizeString(edge.edgeId, ''),
            landGraphEdge: sourceGraphFamily === 'land',
            seaGraphEdge: sourceGraphFamily === 'sea',
            transitionEdge: false,
            futureHybridGraphBridge: true
        }));
    }

    function buildHybridTransitionEdges(landGraph = {}, seaGraph = {}) {
        const landTerminalNodes = Array.isArray(landGraph.nodes)
            ? landGraph.nodes.filter((node) => node && node.nodeType === 'coastal_terminal' && node.sourceCoastalNodeId)
            : [];
        const seaTerminalNodes = Array.isArray(seaGraph.nodes)
            ? seaGraph.nodes.filter((node) => node && node.nodeType === 'coastal_terminal' && node.sourceCoastalNodeId)
            : [];
        const seaTerminalNodeLookup = buildLookupById(seaTerminalNodes, 'sourceCoastalNodeId');

        return landTerminalNodes
            .filter((landTerminalNode) => seaTerminalNodeLookup.has(normalizeString(landTerminalNode.sourceCoastalNodeId, '')))
            .map((landTerminalNode, edgeIndex) => {
                const seaTerminalNode = seaTerminalNodeLookup.get(normalizeString(landTerminalNode.sourceCoastalNodeId, '')) || {};
                const transitionStrength = scoreHybridTransitionStrength(landTerminalNode, seaTerminalNode);

                return {
                    edgeId: `hybrid_edge_transition_${String(edgeIndex + 1).padStart(3, '0')}`,
                    edgeType: 'land_sea_transition',
                    fromNodeId: normalizeString(landTerminalNode.nodeId, ''),
                    toNodeId: normalizeString(seaTerminalNode.nodeId, ''),
                    sourceCoastalNodeId: normalizeString(landTerminalNode.sourceCoastalNodeId, ''),
                    continentId: normalizeString(landTerminalNode.continentId, normalizeString(seaTerminalNode.continentId, '')),
                    seaRegionClusterId: normalizeString(seaTerminalNode.seaRegionClusterId, ''),
                    coarseConnectivityStrength: transitionStrength,
                    connectionClass: classifyConnectionStrength(transitionStrength),
                    routeCostComputed: false,
                    transitionMode: 'coastal_terminal_bridge',
                    landGraphEdge: false,
                    seaGraphEdge: false,
                    transitionEdge: true,
                    futureMacroRouteInput: true
                };
            });
    }

    function buildHybridConnectivityGraph(input = {}, dependencyAvailability = {}, landGraph = {}, seaGraph = {}) {
        const hybridLandNodes = projectHybridNodes(
            Array.isArray(landGraph.nodes) ? landGraph.nodes : [],
            'land'
        );
        const hybridSeaNodes = projectHybridNodes(
            Array.isArray(seaGraph.nodes) ? seaGraph.nodes : [],
            'sea'
        );
        const hybridLandEdges = projectHybridEdges(
            Array.isArray(landGraph.edges) ? landGraph.edges : [],
            'land'
        );
        const hybridSeaEdges = projectHybridEdges(
            Array.isArray(seaGraph.edges) ? seaGraph.edges : [],
            'sea'
        );
        const hybridTransitionEdges = buildHybridTransitionEdges(landGraph, seaGraph);
        const nodes = hybridLandNodes.concat(hybridSeaNodes)
            .sort((left, right) => left.nodeId.localeCompare(right.nodeId));
        const edges = hybridLandEdges.concat(hybridSeaEdges, hybridTransitionEdges)
            .sort((left, right) => left.edgeId.localeCompare(right.edgeId));
        const adjacencyCountByNodeId = new Map(nodes.map((node) => [node.nodeId, 0]));

        edges.forEach((edge) => {
            adjacencyCountByNodeId.set(edge.fromNodeId, (adjacencyCountByNodeId.get(edge.fromNodeId) || 0) + 1);
            adjacencyCountByNodeId.set(edge.toNodeId, (adjacencyCountByNodeId.get(edge.toNodeId) || 0) + 1);
        });

        const sourceOutputIds = Array.from(new Set([
            normalizeString(landGraph.outputId, ''),
            normalizeString(seaGraph.outputId, ''),
            ...(Array.isArray(landGraph.sourceOutputIds) ? landGraph.sourceOutputIds : []),
            ...(Array.isArray(seaGraph.sourceOutputIds) ? seaGraph.sourceOutputIds : [])
        ].filter(Boolean))).sort();

        return {
            outputId: HYBRID_GRAPH_OUTPUT_ID,
            stageId: GRAPH_ASSEMBLY_STAGE_ID,
            modelId: HYBRID_GRAPH_MODEL_ID,
            deterministic: true,
            seedNamespace: 'macro.connectivityGraph.graphAssembly',
            graphFamily: 'hybrid',
            dependencyAvailability: cloneValue(dependencyAvailability),
            sourceOutputIds,
            nodes,
            edges,
            summary: {
                nodeCount: nodes.length,
                edgeCount: edges.length,
                landNodeCount: hybridLandNodes.length,
                seaNodeCount: hybridSeaNodes.length,
                landEdgeCount: hybridLandEdges.length,
                seaEdgeCount: hybridSeaEdges.length,
                transitionEdgeCount: hybridTransitionEdges.length,
                pairedCoastalTerminalCount: hybridTransitionEdges.length,
                isolatedNodeCount: Array.from(adjacencyCountByNodeId.values()).filter((count) => count === 0).length,
                routeCostComputed: false,
                landGraphBuilt: true,
                seaGraphBuilt: true,
                hybridGraphBuilt: true,
                valueMeaning: 'coarse hybrid graph that combines land and sea graph structure with explicit coastal terminal transition edges and no route-cost modeling'
            },
            compatibility: {
                coarseGraphOutput: true,
                landGraphOutput: false,
                seaGraphOutput: false,
                hybridGraphOutput: true,
                routeCostOutput: false,
                macroRoutesOutput: false,
                gameplaySemanticsOutput: false
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        };
    }

    function buildLandConnectivityGraph(input = {}, dependencyAvailability = {}) {
        const regionalSegmentationAnalysis = findInputIntermediateOutput(input, 'regionalSegmentationAnalysis');
        const continentalCohesionSummaries = findInputIntermediateOutput(input, 'continentalCohesionSummaries');
        const corePotentialAnalysis = findInputIntermediateOutput(input, 'corePotentialAnalysis');
        const fracturedPeripheryAnalysis = findInputIntermediateOutput(input, 'fracturedPeripheryAnalysis');
        const exceptionalCoastalNodesOutput = findInputIntermediateOutput(input, 'exceptionalCoastalNodes');
        const coastalOpportunityProfile = findInputIntermediateOutput(input, 'coastalOpportunityProfile');
        const continentBodies = findInputIntermediateOutput(input, 'continentBodies');

        const regionalSegments = Array.isArray(regionalSegmentationAnalysis && regionalSegmentationAnalysis.regionalSegments)
            ? regionalSegmentationAnalysis.regionalSegments
            : [];
        const segmentPotentialLookup = buildLookupById(
            corePotentialAnalysis && corePotentialAnalysis.segmentPotentials,
            'regionalSegmentId'
        );
        const segmentPeripheryLookup = buildLookupById(
            fracturedPeripheryAnalysis && fracturedPeripheryAnalysis.segmentPeripheries,
            'regionalSegmentId'
        );
        const continentSummaryLookup = buildLookupById(
            continentalCohesionSummaries && continentalCohesionSummaries.continentSummaries,
            'continentId'
        );
        const inlandNodes = regionalSegments.map((segment) => createInlandLandNode(
            segment,
            segmentPotentialLookup.get(normalizeString(segment.regionalSegmentId, '')) || {},
            segmentPeripheryLookup.get(normalizeString(segment.regionalSegmentId, '')) || {},
            continentSummaryLookup.get(normalizeString(segment.continentId, '')) || {}
        ));
        const interRegionalEdges = buildInterRegionalLandEdges(inlandNodes);
        const exceptionalCoastalNodes = Array.isArray(exceptionalCoastalNodesOutput && exceptionalCoastalNodesOutput.exceptionalCoastalNodes)
            ? exceptionalCoastalNodesOutput.exceptionalCoastalNodes
            : [];
        const coastalTerminalNodes = exceptionalCoastalNodes.map((coastalNode) => {
            const attachment = selectBestCoastalAttachmentSegment(coastalNode, inlandNodes);
            return createCoastalTerminalNode(coastalNode, attachment);
        });
        const coastalAttachmentEdges = buildCoastalAttachmentEdges(coastalTerminalNodes);
        const nodes = inlandNodes.concat(coastalTerminalNodes)
            .sort((left, right) => left.nodeId.localeCompare(right.nodeId));
        const edges = interRegionalEdges.concat(coastalAttachmentEdges)
            .sort((left, right) => left.edgeId.localeCompare(right.edgeId));
        const adjacencyCountByNodeId = new Map(nodes.map((node) => [node.nodeId, 0]));

        edges.forEach((edge) => {
            adjacencyCountByNodeId.set(edge.fromNodeId, (adjacencyCountByNodeId.get(edge.fromNodeId) || 0) + 1);
            adjacencyCountByNodeId.set(edge.toNodeId, (adjacencyCountByNodeId.get(edge.toNodeId) || 0) + 1);
        });

        const sourceOutputIds = [
            normalizeString(regionalSegmentationAnalysis && regionalSegmentationAnalysis.outputId, ''),
            normalizeString(continentalCohesionSummaries && continentalCohesionSummaries.outputId, ''),
            normalizeString(corePotentialAnalysis && corePotentialAnalysis.outputId, ''),
            normalizeString(fracturedPeripheryAnalysis && fracturedPeripheryAnalysis.outputId, ''),
            normalizeString(exceptionalCoastalNodesOutput && exceptionalCoastalNodesOutput.outputId, ''),
            normalizeString(coastalOpportunityProfile && coastalOpportunityProfile.outputId, ''),
            continentBodies ? normalizeString(continentBodies.continentBodySetId, 'continentBodies') : ''
        ].filter(Boolean);

        return {
            outputId: LAND_GRAPH_OUTPUT_ID,
            stageId: GRAPH_ASSEMBLY_STAGE_ID,
            modelId: LAND_GRAPH_MODEL_ID,
            deterministic: true,
            seedNamespace: 'macro.connectivityGraph.graphAssembly',
            graphFamily: 'land',
            dependencyAvailability: cloneValue(dependencyAvailability),
            sourceOutputIds,
            nodes,
            edges,
            summary: {
                nodeCount: nodes.length,
                edgeCount: edges.length,
                inlandRegionNodeCount: inlandNodes.length,
                coastalTerminalNodeCount: coastalTerminalNodes.length,
                interRegionalEdgeCount: interRegionalEdges.length,
                coastalAttachmentEdgeCount: coastalAttachmentEdges.length,
                isolatedNodeCount: Array.from(adjacencyCountByNodeId.values()).filter((count) => count === 0).length,
                unattachedCoastalNodeCount: coastalTerminalNodes.filter((node) => !node.attachmentNodeId).length,
                continentCount: new Set(inlandNodes.map((node) => node.continentId).filter(Boolean)).size,
                routeCostComputed: false,
                seaGraphBuilt: false,
                hybridGraphBuilt: false,
                valueMeaning: 'coarse land graph only; interregional links and coastal-terminal attachments without sea graph or hybrid costs'
            },
            compatibility: {
                coarseGraphOutput: true,
                landGraphOutput: true,
                seaGraphOutput: false,
                hybridGraphOutput: false,
                routeCostOutput: false,
                macroRoutesOutput: false,
                gameplaySemanticsOutput: false
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        };
    }

    function buildSeaConnectivityGraph(input = {}, dependencyAvailability = {}) {
        const seaRegionClustersOutput = findInputIntermediateOutput(input, 'seaRegionClusters');
        const seaNavigabilityTagging = findInputIntermediateOutput(input, 'seaNavigabilityTagging');
        const exceptionalCoastalNodesOutput = findInputIntermediateOutput(input, 'exceptionalCoastalNodes');
        const coastalOpportunityProfile = findInputIntermediateOutput(input, 'coastalOpportunityProfile');
        const coastalProfileLookup = buildLookupById(
            coastalOpportunityProfile && coastalOpportunityProfile.clusterProfiles,
            'seaRegionClusterId'
        );
        const seaClusters = getSeaClusterList(seaRegionClustersOutput || {}, seaNavigabilityTagging || {});
        const seaRegionNodes = seaClusters.map((cluster) => createSeaRegionNode(
            cluster,
            coastalProfileLookup.get(normalizeString(cluster.seaRegionClusterId, '')) || {}
        ));
        const seaRegionNodeLookup = buildLookupById(seaRegionNodes, 'seaRegionClusterId');
        const interBasinEdges = buildInterBasinSeaEdges(seaRegionNodes);
        const exceptionalCoastalNodes = Array.isArray(exceptionalCoastalNodesOutput && exceptionalCoastalNodesOutput.exceptionalCoastalNodes)
            ? exceptionalCoastalNodesOutput.exceptionalCoastalNodes
            : [];
        const matchedCoastalNodes = exceptionalCoastalNodes.filter((coastalNode) => (
            seaRegionNodeLookup.has(normalizeString(coastalNode.seaRegionClusterId, ''))
        ));
        const coastalSeaTerminalNodes = matchedCoastalNodes.map((coastalNode) => createCoastalSeaTerminalNode(
            coastalNode,
            seaRegionNodeLookup.get(normalizeString(coastalNode.seaRegionClusterId, '')) || {}
        ));
        const coastalSeaAttachmentEdges = buildCoastalSeaAttachmentEdges(coastalSeaTerminalNodes);
        const nodes = seaRegionNodes.concat(coastalSeaTerminalNodes)
            .sort((left, right) => left.nodeId.localeCompare(right.nodeId));
        const edges = interBasinEdges.concat(coastalSeaAttachmentEdges)
            .sort((left, right) => left.edgeId.localeCompare(right.edgeId));
        const adjacencyCountByNodeId = new Map(nodes.map((node) => [node.nodeId, 0]));

        edges.forEach((edge) => {
            adjacencyCountByNodeId.set(edge.fromNodeId, (adjacencyCountByNodeId.get(edge.fromNodeId) || 0) + 1);
            adjacencyCountByNodeId.set(edge.toNodeId, (adjacencyCountByNodeId.get(edge.toNodeId) || 0) + 1);
        });

        const sourceOutputIds = [
            normalizeString(seaRegionClustersOutput && seaRegionClustersOutput.seaRegionClusterSetId, ''),
            normalizeString(seaNavigabilityTagging && seaNavigabilityTagging.seaNavigabilityTaggingId, ''),
            normalizeString(exceptionalCoastalNodesOutput && exceptionalCoastalNodesOutput.outputId, ''),
            normalizeString(coastalOpportunityProfile && coastalOpportunityProfile.outputId, '')
        ].filter(Boolean);

        return {
            outputId: SEA_GRAPH_OUTPUT_ID,
            stageId: GRAPH_ASSEMBLY_STAGE_ID,
            modelId: SEA_GRAPH_MODEL_ID,
            deterministic: true,
            seedNamespace: 'macro.connectivityGraph.graphAssembly',
            graphFamily: 'sea',
            dependencyAvailability: cloneValue(dependencyAvailability),
            sourceOutputIds,
            nodes,
            edges,
            summary: {
                nodeCount: nodes.length,
                edgeCount: edges.length,
                seaRegionNodeCount: seaRegionNodes.length,
                coastalTerminalNodeCount: coastalSeaTerminalNodes.length,
                interBasinEdgeCount: interBasinEdges.length,
                coastalAttachmentEdgeCount: coastalSeaAttachmentEdges.length,
                isolatedNodeCount: Array.from(adjacencyCountByNodeId.values()).filter((count) => count === 0).length,
                unattachedCoastalNodeCount: exceptionalCoastalNodes.length - matchedCoastalNodes.length,
                routeCostComputed: false,
                landGraphBuilt: true,
                hybridGraphBuilt: false,
                valueMeaning: 'coarse sea graph only; marine basin links and coastal-sea attachments without hybrid graph or route costs'
            },
            compatibility: {
                coarseGraphOutput: true,
                landGraphOutput: false,
                seaGraphOutput: true,
                hybridGraphOutput: false,
                routeCostOutput: false,
                macroRoutesOutput: false,
                gameplaySemanticsOutput: false
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        };
    }

    function buildConnectivityGraphPlan(input = {}, dependencyAvailability = {}) {
        const regionalSegmentationAnalysis = findInputIntermediateOutput(input, 'regionalSegmentationAnalysis');
        const continentalCohesionSummaries = findInputIntermediateOutput(input, 'continentalCohesionSummaries');
        const corePotentialAnalysis = findInputIntermediateOutput(input, 'corePotentialAnalysis');
        const fracturedPeripheryAnalysis = findInputIntermediateOutput(input, 'fracturedPeripheryAnalysis');
        const seaRegionClusters = findInputIntermediateOutput(input, 'seaRegionClusters');
        const seaNavigabilityTagging = findInputIntermediateOutput(input, 'seaNavigabilityTagging');
        const exceptionalCoastalNodes = findInputIntermediateOutput(input, 'exceptionalCoastalNodes');
        const coastalOpportunityProfile = findInputIntermediateOutput(input, 'coastalOpportunityProfile');
        const climateStressField = findInputField(input, 'climateStressField');
        const stormCorridorField = findInputField(input, 'stormCorridorField');
        const coastalDecayBurdenField = findInputField(input, 'coastalDecayBurdenField');
        const straitCarvingSummary = findInputIntermediateOutput(input, 'straitCarvingSummary');
        const continentBodies = findInputIntermediateOutput(input, 'continentBodies');

        const regionalSegments = Array.isArray(regionalSegmentationAnalysis && regionalSegmentationAnalysis.regionalSegments)
            ? regionalSegmentationAnalysis.regionalSegments
            : [];
        const segmentPotentials = Array.isArray(corePotentialAnalysis && corePotentialAnalysis.segmentPotentials)
            ? corePotentialAnalysis.segmentPotentials
            : [];
        const segmentPeripheries = Array.isArray(fracturedPeripheryAnalysis && fracturedPeripheryAnalysis.segmentPeripheries)
            ? fracturedPeripheryAnalysis.segmentPeripheries
            : [];
        const seaClusters = getSeaClusterList(seaRegionClusters || {}, seaNavigabilityTagging || {});
        const coastalNodes = Array.isArray(exceptionalCoastalNodes && exceptionalCoastalNodes.exceptionalCoastalNodes)
            ? exceptionalCoastalNodes.exceptionalCoastalNodes
            : [];
        const coastalProfiles = Array.isArray(coastalOpportunityProfile && coastalOpportunityProfile.clusterProfiles)
            ? coastalOpportunityProfile.clusterProfiles
            : [];
        const continentBodyRows = Array.isArray(continentBodies && continentBodies.continentBodies)
            ? continentBodies.continentBodies
            : [];
        const segmentPotentialLookup = buildLookupById(segmentPotentials, 'regionalSegmentId');
        const segmentPeripheryLookup = buildLookupById(segmentPeripheries, 'regionalSegmentId');
        const continentSummaryLookup = buildLookupById(
            continentalCohesionSummaries && continentalCohesionSummaries.continentSummaries,
            'continentId'
        );
        const inlandPlanningNodes = regionalSegments.map((segment) => createInlandLandNode(
            segment,
            segmentPotentialLookup.get(normalizeString(segment.regionalSegmentId, '')) || {},
            segmentPeripheryLookup.get(normalizeString(segment.regionalSegmentId, '')) || {},
            continentSummaryLookup.get(normalizeString(segment.continentId, '')) || {}
        ));
        const majorRouteEndpoints = selectMajorRouteEndpoints({ nodes: inlandPlanningNodes }, MAX_MAJOR_ROUTE_ENDPOINTS);

        const sourceCounts = {
            landRegionCandidateCount: regionalSegments.length,
            continentSummaryCount: countRecords(continentalCohesionSummaries, 'continentSummaries'),
            corePotentialSegmentCount: segmentPotentials.length,
            fracturedPeripherySegmentCount: segmentPeripheries.length,
            continentBodyCount: continentBodyRows.length,
            continentRecordDraftCount: countDraftRecords(continentBodyRows, 'recordDraft.continentId'),
            seaRegionCandidateCount: seaClusters.length,
            seaRegionRecordDraftCount: countDraftRecords(seaClusters, 'recordDraft.seaRegionId'),
            coastalProfileClusterCount: coastalProfiles.length,
            exceptionalCoastalNodeCount: coastalNodes.length,
            majorRouteEndpointCount: majorRouteEndpoints.length,
            majorRoutePairCandidateCount: Math.max(0, (majorRouteEndpoints.length * (majorRouteEndpoints.length - 1)) / 2),
            climateStressFieldAvailable: Boolean(climateStressField),
            stormCorridorFieldAvailable: Boolean(stormCorridorField),
            coastalDecayBurdenFieldAvailable: Boolean(coastalDecayBurdenField),
            straitCarvingSummaryAvailable: Boolean(straitCarvingSummary)
        };

        const graphFamilies = GRAPH_FAMILY_SLOTS.map((graphFamilySlot) => ({
            graphId: graphFamilySlot.graphId,
            graphFamily: graphFamilySlot.graphFamily,
            nodeSourceIds: graphFamilySlot.nodeSourceIds.slice(),
            bridgeSourceIds: graphFamilySlot.bridgeSourceIds.slice(),
            routeCostMode: graphFamilySlot.routeCostMode,
            status: graphFamilySlot.status
        }));

        return {
            outputId: BUILD_PLAN_OUTPUT_ID,
            status: STATUS,
            phaseVersion: PHASE_VERSION,
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            seedNamespace: 'macro.connectivityGraph',
            graphConstructionImplemented: true,
            landGraphImplemented: true,
            seaGraphImplemented: true,
            hybridGraphImplemented: true,
            routeCostImplemented: true,
            routeSamplingImplemented: true,
            corridorExtractionImplemented: true,
            hybridBridgeImplemented: true,
            dependencyAvailability: cloneValue(dependencyAvailability),
            sourceCounts,
            graphFamilies,
            stageSlots: cloneValue(STAGE_SLOTS),
            plannedOutputs: {
                landGraphOutputId: LAND_GRAPH_OUTPUT_ID,
                seaGraphOutputId: SEA_GRAPH_OUTPUT_ID,
                hybridGraphOutputId: HYBRID_GRAPH_OUTPUT_ID,
                macroRoutesOutputId: MACRO_ROUTES_OUTPUT_ID,
                macroCorridorsOutputId: MACRO_CORRIDORS_OUTPUT_ID,
                nodeRegistryOutputId: 'connectivityNodeRegistry',
                edgeRegistryOutputId: 'connectivityEdgeRegistry',
                routeCostOutputId: ROUTE_COST_SURFACE_OUTPUT_ID
            },
            summary: {
                totalSourceCandidateCount: (
                    sourceCounts.landRegionCandidateCount
                    + sourceCounts.seaRegionCandidateCount
                    + sourceCounts.exceptionalCoastalNodeCount
                ),
                landGraphReady: sourceCounts.landRegionCandidateCount > 0,
                landGraphBuilt: true,
                seaGraphReady: sourceCounts.seaRegionCandidateCount > 0,
                seaGraphBuilt: true,
                hybridGraphReady: sourceCounts.landRegionCandidateCount > 0
                    && sourceCounts.seaRegionCandidateCount > 0
                    && sourceCounts.exceptionalCoastalNodeCount > 0,
                hybridGraphBuilt: true,
                routeCostReady: sourceCounts.landRegionCandidateCount > 0
                    && sourceCounts.seaRegionCandidateCount > 0
                    && sourceCounts.exceptionalCoastalNodeCount > 0,
                routeCostBuilt: true,
                routeSamplingReady: sourceCounts.majorRouteEndpointCount > 1,
                routeSamplingBuilt: true,
                corridorExtractionReady: sourceCounts.majorRoutePairCandidateCount > 0,
                corridorExtractionBuilt: true
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        };
    }

    function describeConnectivityGraphDependencyAvailability(input = {}) {
        const groupRows = Object.entries(INPUT_GROUPS).map(([groupId, dependencies]) => (
            buildDependencyGroupStatus(input, groupId, dependencies)
        ));

        return {
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            groupCount: groupRows.length,
            groups: groupRows,
            sourceSummary: buildSourceSummary(groupRows)
        };
    }

    function getConnectivityGraphBuilderDescriptor() {
        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            phaseVersion: PHASE_VERSION,
            description: 'Partial ConnectivityGraphBuilder with coarse land, sea, and hybrid graphs, coarse route-cost modeling, deterministic major-route sampling, and macro-corridor classification; registries and chokepoint records remain deferred.',
            currentOutputs: [BUILD_PLAN_OUTPUT_ID, LAND_GRAPH_OUTPUT_ID, SEA_GRAPH_OUTPUT_ID, HYBRID_GRAPH_OUTPUT_ID, ROUTE_COST_SURFACE_OUTPUT_ID, MACRO_ROUTES_OUTPUT_ID, MACRO_CORRIDORS_OUTPUT_ID],
            deferredOutputs: INTENTIONALLY_ABSENT.slice()
        });
    }

    function getConnectivityGraphInputContract() {
        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            requiredKeys: REQUIRED_KEYS.slice(),
            optionalKeys: OPTIONAL_KEYS.slice(),
            inputGroups: cloneValue(INPUT_GROUPS),
            description: 'Partial ConnectivityGraphBuilder input contract. The runtime now builds coarse land, sea, and hybrid graphs, computes a coarse route-cost model, samples deterministic candidate routes between major regions, and classifies macro corridors as mandatory, redundant, or brittle without creating chokepoint records.'
        });
    }

    function getConnectivityGraphOutputContract() {
        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            actualOutputs: {
                fields: [],
                intermediateOutputs: [BUILD_PLAN_OUTPUT_ID, LAND_GRAPH_OUTPUT_ID, SEA_GRAPH_OUTPUT_ID, HYBRID_GRAPH_OUTPUT_ID, ROUTE_COST_SURFACE_OUTPUT_ID, MACRO_ROUTES_OUTPUT_ID, MACRO_CORRIDORS_OUTPUT_ID],
                records: [],
                debugArtifacts: []
            },
            plannedOutputs: [
                'connectivityNodeRegistry',
                'connectivityEdgeRegistry'
            ],
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice(),
            description: 'Partial ConnectivityGraphBuilder output contract. The runtime emits a build-plan scaffold, coarse land/sea/hybrid graphs, a coarse route-cost model, deterministic candidate routes, and classified macro corridors; standalone registries and chokepoint records remain deferred.'
        });
    }

    function buildConnectivityGraph(input = {}) {
        const dependencyAvailability = describeConnectivityGraphDependencyAvailability(input);
        const connectivityGraphBuildPlan = buildConnectivityGraphPlan(input, dependencyAvailability);
        const landConnectivityGraph = buildLandConnectivityGraph(input, dependencyAvailability);
        const seaConnectivityGraph = buildSeaConnectivityGraph(input, dependencyAvailability);
        const hybridConnectivityGraphBase = buildHybridConnectivityGraph(
            input,
            dependencyAvailability,
            landConnectivityGraph,
            seaConnectivityGraph
        );
        const routeCostSurface = buildRouteCostSurface(
            input,
            dependencyAvailability,
            hybridConnectivityGraphBase
        );
        const hybridConnectivityGraph = applyRouteCostSurfaceToHybridGraph(
            hybridConnectivityGraphBase,
            routeCostSurface
        );
        const macroRoutes = buildMacroRoutes(
            hybridConnectivityGraph,
            routeCostSurface
        );
        const macroCorridors = buildMacroCorridors(
            macroRoutes,
            hybridConnectivityGraph,
            routeCostSurface
        );

        return {
            status: STATUS,
            phaseVersion: PHASE_VERSION,
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            seedNamespace: 'macro.connectivityGraph',
            dependencyAvailability,
            outputs: {
                fields: {},
                intermediateOutputs: {
                    connectivityGraphBuildPlan,
                    landConnectivityGraph,
                    seaConnectivityGraph,
                    hybridConnectivityGraph,
                    routeCostSurface,
                    macroRoutes,
                    macroCorridors
                },
                records: {},
                debugArtifacts: {}
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice(),
            notes: [
                'ConnectivityGraphBuilder currently emits coarse land, sea, and hybrid graphs over regional inland blocks, marine basins, and attached exceptional coastal terminals.',
                'The runtime now samples deterministic candidate routes between selected major inland regions and classifies extracted macro corridors as mandatory, redundant, or brittle from route dependence and graph structure without creating chokepoint records.'
            ],
            description: 'Partial connectivity-graph runtime with land, sea, and hybrid graph assembly, coarse route-cost modeling, deterministic route sampling, and macro-corridor extraction.'
        };
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule(MODULE_ID, {
            entry: 'buildConnectivityGraph',
            file: 'js/worldgen/macro/connectivity-graph-builder.js',
            description: 'Partial land-sea-hybrid graph builder over inland regions, marine basins, and coastal terminals plus route-cost modeling, deterministic route sampling, and macro-corridor classification.',
            stub: false,
            scaffold: false
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep(PIPELINE_STEP_ID, {
            moduleId: MODULE_ID,
            file: 'js/worldgen/macro/connectivity-graph-builder.js',
            description: 'Partial pipeline entry for connectivity graph assembly; coarse land, sea, and hybrid graphs plus route-cost modeling, deterministic route sampling, and macro-corridor classification are implemented while chokepoint records remain deferred.',
            stub: false,
            scaffold: false
        });
    }

    Object.assign(macro, {
        getConnectivityGraphBuilderDescriptor,
        getConnectivityGraphInputContract,
        getConnectivityGraphOutputContract,
        describeConnectivityGraphDependencyAvailability,
        buildConnectivityGraph
    });
})();
