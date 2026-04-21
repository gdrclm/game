(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const MODULE_ID = 'isolationPeripheryAnalyzer';
    const PIPELINE_STEP_ID = 'isolationPeriphery';
    const STATUS = 'PARTIAL_IMPLEMENTED';
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';
    const DEFAULT_WORLD_BOUNDS = Object.freeze({
        width: 256,
        height: 128
    });
    const DEFAULT_FIELD_RANGE = Object.freeze([0, 1]);
    const FIELD_VALUE_ENCODING = 'rowMajorFloatArray';
    const ISOLATION_FIELD_ID = 'isolationField';
    const ISOLATION_ANALYSIS_OUTPUT_ID = 'isolationAnalysis';
    const ISOLATED_ZONES_OUTPUT_ID = 'isolatedZones';
    const PERIPHERY_CLUSTERS_OUTPUT_ID = 'peripheryClusters';
    const ISOLATION_STAGE_ID = 'isolationMetrics';
    const ISOLATION_MODEL_ID = 'deterministicIsolationAndPeripheryCoreDistanceV2';
    const ISOLATED_ZONES_STAGE_ID = 'isolatedZoneExtraction';
    const ISOLATED_ZONES_MODEL_ID = 'deterministicIsolatedZoneExtractionV1';
    const PERIPHERY_CLUSTER_STAGE_ID = 'peripheryClusterExtraction';
    const PERIPHERY_CLUSTER_MODEL_ID = 'deterministicPeripheryClusterExtractionV1';
    const REQUIRED_KEYS = Object.freeze([
        'macroSeed'
    ]);
    const OPTIONAL_KEYS = Object.freeze([
        'macroSeedProfile',
        'phase1Constraints',
        'worldBounds',
        'connectivityGraph',
        'continentalCohesion',
        'climateEnvelope',
        'chokepoints',
        'fields',
        'intermediateOutputs',
        'records',
        'debugOptions'
    ]);
    const INPUT_GROUPS = Object.freeze({
        graphContext: Object.freeze([
            {
                dependencyId: 'hybridConnectivityGraph',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: true,
                role: 'hybrid land-sea graph over major nodes for deterministic distance-from-core traversal'
            },
            {
                dependencyId: 'routeCostSurface',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: false,
                role: 'coarse edge friction and node pressure for resupply-cost and collapse-fragility scoring'
            },
            {
                dependencyId: 'macroRoutes',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: false,
                role: 'route-coverage support for resupply burden and autonomous survival scoring'
            },
            {
                dependencyId: 'macroCorridors',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: false,
                role: 'route fragility and corridor dependence context for collapse/periphery metrics'
            }
        ]),
        coreContext: Object.freeze([
            {
                dependencyId: 'corePotentialAnalysis',
                sourceGroup: 'continentalCohesion.outputs.intermediateOutputs',
                required: false,
                role: 'segment-level core-potential anchors for distance-from-core origin selection and autonomous survival support'
            },
            {
                dependencyId: 'continentalCohesionSummaries',
                sourceGroup: 'continentalCohesion.outputs.intermediateOutputs',
                required: false,
                role: 'optional continent-level cohesion fallback for broader periphery rollup context'
            }
        ]),
        climateContext: Object.freeze([
            {
                dependencyId: 'climateStressField',
                sourceGroup: 'climateEnvelope.outputs.fields',
                required: false,
                role: 'broad climate burden for weather-adjusted isolation and collapse risk'
            },
            {
                dependencyId: 'stormCorridorField',
                sourceGroup: 'climateEnvelope.outputs.fields',
                required: false,
                role: 'storm exposure for weather-adjusted isolation and collapse risk'
            },
            {
                dependencyId: 'coastalDecayBurdenField',
                sourceGroup: 'climateEnvelope.outputs.fields',
                required: false,
                role: 'coastal weathering burden for collapse-risk and autonomous-survival modulation'
            }
        ]),
        chokepointFragility: Object.freeze([
            {
                dependencyId: 'chokepointRecords',
                sourceGroup: 'chokepoints.outputs.intermediateOutputs',
                required: false,
                role: 'official chokepoint metrics for bypass and collapse exposure in periphery analysis'
            }
        ])
    });
    const METRICS = Object.freeze([
        'distanceFromCore',
        'resupplyCost',
        'weatherAdjustedIsolation',
        'culturalDriftPotential',
        'autonomousSurvivalScore',
        'lossInCollapseLikelihood'
    ]);
    const INTENTIONALLY_ABSENT = Object.freeze([
        'chokepointDependenceField',
        'peripheryClassification',
        'archipelagoSignificance',
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

    function hasOwn(objectValue, key) {
        return Boolean(objectValue) && Object.prototype.hasOwnProperty.call(objectValue, key);
    }

    function normalizeString(value, fallback = '') {
        return typeof value === 'string'
            ? value
            : (typeof fallback === 'string' ? fallback : '');
    }

    function normalizeNumber(value, fallback = 0) {
        const normalizedValue = Number(value);
        return Number.isFinite(normalizedValue) ? normalizedValue : fallback;
    }

    function normalizeInteger(value, fallback = 0) {
        const normalizedValue = Number.parseInt(value, 10);
        return Number.isFinite(normalizedValue) ? normalizedValue : fallback;
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

    function roundValue(value, digits = 4) {
        const normalizedValue = normalizeNumber(value, 0);
        const multiplier = 10 ** digits;
        return Math.round(normalizedValue * multiplier) / multiplier;
    }

    function isPlainObject(value) {
        if (!value || typeof value !== 'object') {
            return false;
        }

        const prototype = Object.getPrototypeOf(value);
        return prototype === Object.prototype || prototype === null;
    }

    function uniqueStrings(values = []) {
        return Array.from(new Set(
            (Array.isArray(values) ? values : [])
                .map((value) => normalizeString(value, ''))
                .filter(Boolean)
        ));
    }

    function computeMean(values = []) {
        const normalizedValues = Array.isArray(values)
            ? values.filter((value) => Number.isFinite(normalizeNumber(value, Number.NaN)))
            : [];
        if (normalizedValues.length === 0) {
            return 0;
        }

        const total = normalizedValues.reduce((sum, value) => sum + normalizeNumber(value, 0), 0);
        return total / normalizedValues.length;
    }

    function getNestedValue(source, path, fallback = undefined) {
        if (!source || typeof source !== 'object' || !path) {
            return fallback;
        }

        const pathSegments = Array.isArray(path) ? path : String(path).split('.');
        let currentValue = source;

        for (const segment of pathSegments) {
            if (!segment) {
                continue;
            }

            if (!currentValue || typeof currentValue !== 'object' || !hasOwn(currentValue, segment)) {
                return fallback;
            }

            currentValue = currentValue[segment];
        }

        return currentValue === undefined ? fallback : currentValue;
    }

    function normalizeWorldBounds(worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedBounds = isPlainObject(worldBounds) ? worldBounds : {};
        const width = Math.max(1, normalizeInteger(normalizedBounds.width, DEFAULT_WORLD_BOUNDS.width));
        const height = Math.max(1, normalizeInteger(normalizedBounds.height, DEFAULT_WORLD_BOUNDS.height));

        return {
            width,
            height
        };
    }

    function normalizePoint(point = {}) {
        return {
            x: clampUnitInterval(getNestedValue(point, 'x', 0), 0),
            y: clampUnitInterval(getNestedValue(point, 'y', 0), 0)
        };
    }

    function normalizeSeed(seed) {
        return typeof macro.normalizeSeed === 'function'
            ? macro.normalizeSeed(seed)
            : normalizeInteger(seed, 0);
    }

    function buildLookupById(values = [], idKey = 'id') {
        return new Map(
            (Array.isArray(values) ? values : [])
                .filter((value) => isPlainObject(value))
                .map((value) => [normalizeString(value[idKey], ''), value])
                .filter(([id]) => Boolean(id))
        );
    }

    function findInputField(input = {}, fieldId = '') {
        const sourceFields = [
            getNestedValue(input, 'fields', {}),
            getNestedValue(input, 'climateEnvelope.outputs.fields', {}),
            getNestedValue(input, 'connectivityGraph.outputs.fields', {}),
            getNestedValue(input, 'continentalCohesion.outputs.fields', {})
        ];

        for (const sourceFieldGroup of sourceFields) {
            if (sourceFieldGroup && typeof sourceFieldGroup === 'object' && hasOwn(sourceFieldGroup, fieldId)) {
                return sourceFieldGroup[fieldId];
            }
        }

        return null;
    }

    function findInputIntermediateOutput(input = {}, outputId = '') {
        const sourceOutputs = [
            getNestedValue(input, 'intermediateOutputs', {}),
            getNestedValue(input, 'connectivityGraph.outputs.intermediateOutputs', {}),
            getNestedValue(input, 'continentalCohesion.outputs.intermediateOutputs', {}),
            getNestedValue(input, 'climateEnvelope.outputs.intermediateOutputs', {}),
            getNestedValue(input, 'chokepoints.outputs.intermediateOutputs', {})
        ];

        for (const sourceOutputGroup of sourceOutputs) {
            if (sourceOutputGroup && typeof sourceOutputGroup === 'object' && hasOwn(sourceOutputGroup, outputId)) {
                return sourceOutputGroup[outputId];
            }
        }

        return null;
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

        const point = normalizePoint(normalizedPoint);
        const x = Math.min(width - 1, Math.max(0, Math.round(point.x * Math.max(0, width - 1))));
        const y = Math.min(height - 1, Math.max(0, Math.round(point.y * Math.max(0, height - 1))));
        const index = Math.min(size - 1, Math.max(0, (y * width) + x));
        return clampUnitInterval(values[index], fallback);
    }

    function selectDominantDriverIds(driverWeights = {}, limit = 3) {
        return Object.entries(isPlainObject(driverWeights) ? driverWeights : {})
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

    function aggregateDominantDriverIdsFromRows(rows = [], limit = 3) {
        const driverWeights = {};

        (Array.isArray(rows) ? rows : []).forEach((row) => {
            const driverIds = Array.isArray(row && row.dominantIsolationDriverIds)
                ? row.dominantIsolationDriverIds
                : [];
            driverIds.forEach((driverId, index) => {
                const normalizedDriverId = normalizeString(driverId, '');
                if (!normalizedDriverId) {
                    return;
                }

                const weight = Math.max(1, 3 - normalizeInteger(index, 0));
                driverWeights[normalizedDriverId] = normalizeNumber(driverWeights[normalizedDriverId], 0) + weight;
            });
        });

        return selectDominantDriverIds(driverWeights, limit);
    }

    function classifyIsolationScore(score) {
        const normalizedScore = clampUnitInterval(score, 0);
        if (normalizedScore >= 0.8) {
            return 'severe';
        }
        if (normalizedScore >= 0.62) {
            return 'high';
        }
        if (normalizedScore >= 0.38) {
            return 'moderate';
        }
        return 'low';
    }

    function classifyIsolatedZoneType(componentRows = []) {
        const rows = Array.isArray(componentRows) ? componentRows : [];
        const meanAutonomousSurvival = computeMean(rows.map((row) => row.autonomousSurvivalScore));
        const coastalShare = rows.length > 0
            ? rows.filter((row) => normalizeString(row.sourceCoastalNodeId, '')).length / rows.length
            : 0;

        if (coastalShare >= 0.5) {
            return 'coastal_periphery';
        }
        if (meanAutonomousSurvival >= 0.6) {
            return 'autonomous_pocket';
        }
        return 'continental_periphery';
    }

    function classifyIsolatedZoneClass(metrics = {}) {
        const meanLossInCollapseLikelihood = clampUnitInterval(metrics.meanLossInCollapseLikelihood, 0);
        const meanAutonomousSurvival = clampUnitInterval(metrics.meanAutonomousSurvivalScore, 0);
        const meanCulturalDriftPotential = clampUnitInterval(metrics.meanCulturalDriftPotential, 0);

        if (meanLossInCollapseLikelihood >= 0.62 && meanAutonomousSurvival < 0.52) {
            return 'fragile';
        }
        if (meanAutonomousSurvival >= 0.58 && meanCulturalDriftPotential >= 0.58) {
            return 'autonomous_drift';
        }
        if (meanCulturalDriftPotential >= 0.58) {
            return 'drifting';
        }
        return 'isolated';
    }

    function classifyPeripheryClusterClass(metrics = {}) {
        const meanLossInCollapseLikelihood = clampUnitInterval(metrics.meanLossInCollapseLikelihood, 0);
        const meanAutonomousSurvival = clampUnitInterval(metrics.meanAutonomousSurvivalScore, 0);
        const meanCulturalDriftPotential = clampUnitInterval(metrics.meanCulturalDriftPotential, 0);

        if (meanLossInCollapseLikelihood >= 0.62) {
            return 'fragile_margin';
        }
        if (meanAutonomousSurvival >= 0.58 && meanCulturalDriftPotential >= 0.56) {
            return 'autonomous_margin';
        }
        if (meanCulturalDriftPotential >= 0.56) {
            return 'drifting_margin';
        }
        return 'mixed_margin';
    }

    function describeIsolationPeripheryDependencyAvailability(input = {}) {
        return deepFreeze(Object.fromEntries(
            Object.entries(INPUT_GROUPS).map(([groupId, dependencies]) => {
                const resolvedDependencies = dependencies.map((dependency) => {
                    const resolvedField = dependency.sourceGroup.indexOf('.fields') >= 0
                        ? findInputField(input, dependency.dependencyId)
                        : null;
                    const resolvedOutput = dependency.sourceGroup.indexOf('.intermediateOutputs') >= 0
                        ? findInputIntermediateOutput(input, dependency.dependencyId)
                        : null;
                    const available = Boolean(resolvedField || resolvedOutput);

                    return {
                        dependencyId: dependency.dependencyId,
                        sourceGroup: dependency.sourceGroup,
                        required: Boolean(dependency.required),
                        available,
                        role: dependency.role
                    };
                });

                return [groupId, {
                    groupId,
                    availableDependencyIds: resolvedDependencies
                        .filter((dependency) => dependency.available)
                        .map((dependency) => dependency.dependencyId),
                    ready: resolvedDependencies.every((dependency) => !dependency.required || dependency.available),
                    dependencies: resolvedDependencies
                }];
            })
        ));
    }

    function buildCorePotentialLookup(corePotentialAnalysis = {}) {
        const segmentPotentials = Array.isArray(corePotentialAnalysis && corePotentialAnalysis.segmentPotentials)
            ? corePotentialAnalysis.segmentPotentials
            : [];
        const lookup = new Map();

        segmentPotentials.forEach((segmentPotential) => {
            const segmentId = normalizeString(segmentPotential.segmentId, '');
            if (!segmentId) {
                return;
            }

            lookup.set(segmentId, {
                segmentId,
                corePotentialScore: clampUnitInterval(segmentPotential.corePotentialScore, 0),
                corePotentialClass: normalizeString(segmentPotential.corePotentialClass, 'low'),
                continentId: normalizeString(segmentPotential.continentId, '')
            });
        });

        return lookup;
    }

    function resolveNodeCorePotential(node = {}, corePotentialLookup = new Map()) {
        const directScore = clampUnitInterval(node.corePotentialScore, 0);
        const segmentId = normalizeString(node.sourceRegionalSegmentId, '');
        const lookupValue = segmentId ? corePotentialLookup.get(segmentId) : null;
        const lookupScore = clampUnitInterval(getNestedValue(lookupValue, 'corePotentialScore', 0), 0);
        const resolvedScore = Math.max(directScore, lookupScore);

        return {
            score: roundValue(resolvedScore),
            corePotentialClass: normalizeString(
                node.corePotentialClass,
                normalizeString(getNestedValue(lookupValue, 'corePotentialClass', ''), resolvedScore >= 0.62 ? 'high' : 'low')
            )
        };
    }

    function selectCoreAnchorNodeIds(hybridNodes = [], corePotentialLookup = new Map()) {
        const resolvedRows = (Array.isArray(hybridNodes) ? hybridNodes : [])
            .map((node) => {
                const resolvedCorePotential = resolveNodeCorePotential(node, corePotentialLookup);
                return {
                    nodeId: normalizeString(node.nodeId, ''),
                    nodeType: normalizeString(node.nodeType, ''),
                    sourceGraphFamily: normalizeString(node.sourceGraphFamily, ''),
                    sourceRegionalSegmentId: normalizeString(node.sourceRegionalSegmentId, ''),
                    resolvedCorePotential: resolvedCorePotential.score,
                    nodeRole: normalizeString(node.nodeRole, ''),
                    meanInteriorPassability: clampUnitInterval(node.meanInteriorPassability, 0.5),
                    fracturedPeripheryScore: clampUnitInterval(node.fracturedPeripheryScore, 0)
                };
            })
            .filter((row) => row.nodeId);

        const landBiasedRows = resolvedRows.filter((row) => row.sourceGraphFamily !== 'sea' && row.nodeType !== 'sea_region');
        const regionalRows = landBiasedRows.filter((row) => row.sourceRegionalSegmentId);
        const candidateRows = regionalRows.length > 0 ? regionalRows : (landBiasedRows.length > 0 ? landBiasedRows : resolvedRows);
        const strongCoreRows = candidateRows.filter((row) => row.resolvedCorePotential >= 0.62);

        const sortedRows = candidateRows.slice().sort((left, right) => (
            right.resolvedCorePotential - left.resolvedCorePotential
            || right.meanInteriorPassability - left.meanInteriorPassability
            || left.fracturedPeripheryScore - right.fracturedPeripheryScore
            || left.nodeId.localeCompare(right.nodeId)
        ));
        const selectedRows = strongCoreRows.length > 0
            ? strongCoreRows
            : sortedRows.slice(0, Math.max(1, Math.min(3, sortedRows.length)));

        return uniqueStrings(selectedRows.map((row) => row.nodeId));
    }

    function buildRouteCoverageLookup(macroRoutes = {}) {
        const routeRows = Array.isArray(macroRoutes && macroRoutes.routes) ? macroRoutes.routes : [];
        const counts = new Map();

        routeRows.forEach((routeRow) => {
            const nodePathIds = uniqueStrings(routeRow.nodePathIds || []);
            nodePathIds.forEach((nodeId) => {
                counts.set(nodeId, normalizeInteger(counts.get(nodeId), 0) + 1);
            });
        });

        const maxCount = Array.from(counts.values()).reduce((maxValue, value) => Math.max(maxValue, normalizeInteger(value, 0)), 0);
        return {
            maxCount,
            counts
        };
    }

    function buildCorridorExposureLookup(macroCorridors = {}) {
        const corridorRows = Array.isArray(macroCorridors && macroCorridors.macroCorridors)
            ? macroCorridors.macroCorridors
            : [];
        const rowsByNodeId = new Map();

        corridorRows.forEach((corridor) => {
            const exposureRow = {
                corridorId: normalizeString(corridor.corridorId, ''),
                supportScore: clampUnitInterval(corridor.supportScore, 0),
                routeDependenceScore: clampUnitInterval(corridor.routeDependenceScore, 0),
                alternativeSupportScore: clampUnitInterval(corridor.alternativeSupportScore, 0),
                structureFragilityScore: clampUnitInterval(corridor.structureFragilityScore, 0),
                mandatoryCorridor: Boolean(corridor.mandatoryCorridor),
                brittleCorridor: Boolean(corridor.brittleCorridor),
                routeMode: normalizeString(corridor.routeMode, ''),
                meanEdgeRouteCost: clampUnitInterval(corridor.meanEdgeRouteCost, 0)
            };

            uniqueStrings(corridor.corridorNodeIds || []).forEach((nodeId) => {
                if (!rowsByNodeId.has(nodeId)) {
                    rowsByNodeId.set(nodeId, []);
                }
                rowsByNodeId.get(nodeId).push(exposureRow);
            });
        });

        return new Map(
            Array.from(rowsByNodeId.entries()).map(([nodeId, rows]) => {
                const mandatoryCount = rows.filter((row) => row.mandatoryCorridor).length;
                const brittleCount = rows.filter((row) => row.brittleCorridor).length;
                return [nodeId, {
                    corridorCount: rows.length,
                    routeDependenceScore: roundValue(computeMean(rows.map((row) => row.routeDependenceScore))),
                    alternativeSupportScore: roundValue(computeMean(rows.map((row) => row.alternativeSupportScore))),
                    structureFragilityScore: roundValue(computeMean(rows.map((row) => row.structureFragilityScore))),
                    corridorSupportScore: roundValue(computeMean(rows.map((row) => row.supportScore))),
                    meanEdgeRouteCost: roundValue(computeMean(rows.map((row) => row.meanEdgeRouteCost))),
                    mandatoryCorridorExposure: roundValue(rows.length > 0 ? mandatoryCount / rows.length : 0),
                    brittleCorridorExposure: roundValue(rows.length > 0 ? brittleCount / rows.length : 0),
                    supportingCorridorIds: uniqueStrings(rows.map((row) => row.corridorId))
                }];
            })
        );
    }

    function buildChokepointExposureLookup(chokepointRecords = {}) {
        const recordLinks = Array.isArray(chokepointRecords && chokepointRecords.recordLinks)
            ? chokepointRecords.recordLinks
            : [];
        const chokepoints = Array.isArray(chokepointRecords && chokepointRecords.chokepoints)
            ? chokepointRecords.chokepoints
            : [];
        const sourceRows = recordLinks.length > 0
            ? recordLinks.map((recordLink) => ({
                chokepointId: normalizeString(recordLink.chokepointId, ''),
                adjacentRegions: uniqueStrings(recordLink.adjacentRegions || []),
                controlValue: clampUnitInterval(getNestedValue(recordLink, 'sourceCandidateMetrics.controlValue', 0), 0),
                tradeDependency: clampUnitInterval(getNestedValue(recordLink, 'sourceCandidateMetrics.tradeDependency', 0), 0),
                bypassDifficulty: clampUnitInterval(getNestedValue(recordLink, 'sourceCandidateMetrics.bypassDifficulty', 0), 0),
                collapseSensitivity: clampUnitInterval(getNestedValue(recordLink, 'sourceCandidateMetrics.collapseSensitivity', 0), 0)
            }))
            : chokepoints.map((chokepoint) => ({
                chokepointId: normalizeString(chokepoint.chokepointId, ''),
                adjacentRegions: uniqueStrings(chokepoint.adjacentRegions || []),
                controlValue: clampUnitInterval(chokepoint.controlValue, 0),
                tradeDependency: clampUnitInterval(chokepoint.tradeDependency, 0),
                bypassDifficulty: clampUnitInterval(chokepoint.bypassDifficulty, 0),
                collapseSensitivity: clampUnitInterval(chokepoint.collapseSensitivity, 0)
            }));
        const rowsByRegionId = new Map();

        sourceRows.forEach((sourceRow) => {
            sourceRow.adjacentRegions.forEach((regionId) => {
                if (!rowsByRegionId.has(regionId)) {
                    rowsByRegionId.set(regionId, []);
                }
                rowsByRegionId.get(regionId).push(sourceRow);
            });
        });

        return new Map(
            Array.from(rowsByRegionId.entries()).map(([regionId, rows]) => [regionId, {
                chokepointCount: rows.length,
                controlValue: roundValue(computeMean(rows.map((row) => row.controlValue))),
                tradeDependency: roundValue(computeMean(rows.map((row) => row.tradeDependency))),
                bypassDifficulty: roundValue(computeMean(rows.map((row) => row.bypassDifficulty))),
                collapseSensitivity: roundValue(computeMean(rows.map((row) => row.collapseSensitivity))),
                supportingChokepointIds: uniqueStrings(rows.map((row) => row.chokepointId))
            }])
        );
    }

    function buildHybridAdjacency(hybridConnectivityGraph = {}, edgeCostLookup = new Map()) {
        const adjacency = new Map();
        const edges = Array.isArray(hybridConnectivityGraph && hybridConnectivityGraph.edges)
            ? hybridConnectivityGraph.edges
            : [];

        edges.forEach((edge) => {
            const fromNodeId = normalizeString(edge.fromNodeId, '');
            const toNodeId = normalizeString(edge.toNodeId, '');
            if (!fromNodeId || !toNodeId) {
                return;
            }

            const edgeId = normalizeString(edge.edgeId, '');
            const edgeCost = edgeId ? edgeCostLookup.get(edgeId) : null;
            const coarseRouteCost = clampUnitInterval(
                getNestedValue(edgeCost, 'coarseRouteCost', getNestedValue(edge, 'coarseRouteCost', Number.NaN)),
                Number.NaN
            );
            const coarseConnectivityStrength = clampUnitInterval(edge.coarseConnectivityStrength, 0.5);
            const transitionPenalty = Boolean(edge.transitionEdge) ? 0.08 : 0;
            const baseWeight = Number.isFinite(coarseRouteCost)
                ? (0.12 + (coarseRouteCost * 0.88))
                : (0.2 + ((1 - coarseConnectivityStrength) * 0.7));
            const edgeWeight = roundValue(Math.max(0.04, baseWeight + transitionPenalty), 6);

            if (!adjacency.has(fromNodeId)) {
                adjacency.set(fromNodeId, []);
            }
            if (!adjacency.has(toNodeId)) {
                adjacency.set(toNodeId, []);
            }

            adjacency.get(fromNodeId).push({
                edgeId,
                toNodeId,
                weight: edgeWeight
            });
            adjacency.get(toNodeId).push({
                edgeId,
                toNodeId: fromNodeId,
                weight: edgeWeight
            });
        });

        return adjacency;
    }

    function computeMultiSourceShortestPaths(hybridNodes = [], adjacency = new Map(), sourceNodeIds = []) {
        const distances = new Map();
        const queue = [];

        (Array.isArray(hybridNodes) ? hybridNodes : []).forEach((node) => {
            const nodeId = normalizeString(node.nodeId, '');
            if (nodeId) {
                distances.set(nodeId, Number.POSITIVE_INFINITY);
            }
        });

        uniqueStrings(sourceNodeIds).forEach((nodeId) => {
            if (!distances.has(nodeId)) {
                return;
            }

            distances.set(nodeId, 0);
            queue.push({
                nodeId,
                distance: 0
            });
        });

        while (queue.length > 0) {
            queue.sort((left, right) => left.distance - right.distance || left.nodeId.localeCompare(right.nodeId));
            const current = queue.shift();
            if (!current) {
                continue;
            }

            const knownDistance = normalizeNumber(distances.get(current.nodeId), Number.POSITIVE_INFINITY);
            if (current.distance > knownDistance) {
                continue;
            }

            const neighbors = adjacency.get(current.nodeId) || [];
            neighbors.forEach((neighbor) => {
                const nextDistance = current.distance + normalizeNumber(neighbor.weight, 1);
                const knownNeighborDistance = normalizeNumber(distances.get(neighbor.toNodeId), Number.POSITIVE_INFINITY);
                if (nextDistance + 1e-9 >= knownNeighborDistance) {
                    return;
                }

                distances.set(neighbor.toNodeId, nextDistance);
                queue.push({
                    nodeId: neighbor.toNodeId,
                    distance: nextDistance
                });
            });
        }

        return distances;
    }

    function buildProjectableAdjacency(nodeRows = [], adjacency = new Map()) {
        const projectableNodeIds = new Set(
            (Array.isArray(nodeRows) ? nodeRows : [])
                .filter((row) => Boolean(row.projectable))
                .map((row) => normalizeString(row.nodeId, ''))
                .filter(Boolean)
        );

        return new Map(
            Array.from(projectableNodeIds.values()).sort().map((nodeId) => [nodeId, uniqueStrings(
                (adjacency.get(nodeId) || [])
                    .map((neighbor) => normalizeString(neighbor.toNodeId, ''))
                    .filter((neighborNodeId) => projectableNodeIds.has(neighborNodeId))
            ).sort()])
        );
    }

    function collectConnectedComponents(selectedNodeIds = [], adjacency = new Map()) {
        const remainingNodeIds = new Set(uniqueStrings(selectedNodeIds));
        const components = [];

        Array.from(remainingNodeIds.values()).sort().forEach((startNodeId) => {
            if (!remainingNodeIds.has(startNodeId)) {
                return;
            }

            const queue = [startNodeId];
            const componentNodeIds = [];
            remainingNodeIds.delete(startNodeId);

            while (queue.length > 0) {
                const currentNodeId = queue.shift();
                componentNodeIds.push(currentNodeId);

                (adjacency.get(currentNodeId) || []).forEach((neighborNodeId) => {
                    if (!remainingNodeIds.has(neighborNodeId)) {
                        return;
                    }

                    remainingNodeIds.delete(neighborNodeId);
                    queue.push(neighborNodeId);
                });
            }

            componentNodeIds.sort();
            components.push(componentNodeIds);
        });

        return components.sort((left, right) => (
            right.length - left.length
            || normalizeString(left[0], '').localeCompare(normalizeString(right[0], ''))
        ));
    }

    function buildNodeIsolationRows(input = {}, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const hybridConnectivityGraph = findInputIntermediateOutput(input, 'hybridConnectivityGraph') || {};
        const routeCostSurface = findInputIntermediateOutput(input, 'routeCostSurface') || {};
        const macroRoutes = findInputIntermediateOutput(input, 'macroRoutes') || {};
        const macroCorridors = findInputIntermediateOutput(input, 'macroCorridors') || {};
        const chokepointRecords = findInputIntermediateOutput(input, 'chokepointRecords') || {};
        const corePotentialAnalysis = findInputIntermediateOutput(input, 'corePotentialAnalysis') || {};
        const climateStressField = findInputField(input, 'climateStressField') || {};
        const stormCorridorField = findInputField(input, 'stormCorridorField') || {};
        const coastalDecayBurdenField = findInputField(input, 'coastalDecayBurdenField') || {};
        const hybridNodes = Array.isArray(hybridConnectivityGraph.nodes) ? hybridConnectivityGraph.nodes : [];
        const nodePressureLookup = buildLookupById(routeCostSurface.nodePressures || [], 'nodeId');
        const edgeCostLookup = buildLookupById(routeCostSurface.edgeCosts || [], 'edgeId');
        const corePotentialLookup = buildCorePotentialLookup(corePotentialAnalysis);
        const corridorExposureLookup = buildCorridorExposureLookup(macroCorridors);
        const chokepointExposureLookup = buildChokepointExposureLookup(chokepointRecords);
        const coreAnchorNodeIds = selectCoreAnchorNodeIds(hybridNodes, corePotentialLookup);
        const routeCoverageLookup = buildRouteCoverageLookup(macroRoutes);
        const adjacency = buildHybridAdjacency(hybridConnectivityGraph, edgeCostLookup);
        const rawDistances = computeMultiSourceShortestPaths(hybridNodes, adjacency, coreAnchorNodeIds);
        const finiteDistances = hybridNodes
            .map((node) => normalizeNumber(rawDistances.get(normalizeString(node.nodeId, '')), Number.NaN))
            .filter((value) => Number.isFinite(value));
        const finiteMaxDistance = finiteDistances.reduce((maxValue, distance) => Math.max(maxValue, distance), 0);
        const unreachableDistance = finiteMaxDistance > 0 ? finiteMaxDistance + 1 : 1;
        const normalizedDistanceDenominator = hybridNodes.length > 0
            ? hybridNodes.reduce((maxValue, node) => {
                const nodeId = normalizeString(node.nodeId, '');
                const rawDistance = normalizeNumber(rawDistances.get(nodeId), Number.POSITIVE_INFINITY);
                const resolvedDistance = Number.isFinite(rawDistance) ? rawDistance : unreachableDistance;
                return Math.max(maxValue, resolvedDistance);
            }, 0)
            : 1;
        const routeCoverageMax = Math.max(1, normalizeInteger(routeCoverageLookup.maxCount, 0));

        const nodeRows = hybridNodes.map((node) => {
            const nodeId = normalizeString(node.nodeId, '');
            const sourceRegionalSegmentId = normalizeString(node.sourceRegionalSegmentId, '');
            const anchorPoint = getHybridNodeAnchorPoint(node);
            const nodePressure = nodePressureLookup.get(nodeId) || {};
            const corridorExposure = corridorExposureLookup.get(nodeId) || {};
            const chokepointExposure = sourceRegionalSegmentId
                ? (chokepointExposureLookup.get(sourceRegionalSegmentId) || {})
                : {};
            const resolvedCorePotential = resolveNodeCorePotential(node, corePotentialLookup);
            const meanInteriorPassability = clampUnitInterval(node.meanInteriorPassability, 0.5);
            const rawDistance = normalizeNumber(rawDistances.get(nodeId), Number.POSITIVE_INFINITY);
            const distanceFromCore = roundValue(clampUnitInterval(
                (Number.isFinite(rawDistance) ? rawDistance : unreachableDistance)
                / Math.max(1, normalizedDistanceDenominator),
                0
            ));
            const routePressureScore = roundValue(clampUnitInterval(
                getNestedValue(nodePressure, 'routePressureScore', 0),
                0
            ));
            const climateStress = roundValue(sampleScalarFieldAtNormalizedPoint(climateStressField, anchorPoint, 0));
            const stormExposure = roundValue(sampleScalarFieldAtNormalizedPoint(stormCorridorField, anchorPoint, 0));
            const coastalDecayBurden = roundValue(sampleScalarFieldAtNormalizedPoint(coastalDecayBurdenField, anchorPoint, 0));
            const routeCoverageCount = normalizeInteger(routeCoverageLookup.counts.get(nodeId), 0);
            const routeCoverageRelief = roundValue(clampUnitInterval(routeCoverageCount / routeCoverageMax, 0));
            const routeCoverageGap = roundValue(1 - routeCoverageRelief);
            const resupplyCost = roundValue(clampUnitInterval(
                (distanceFromCore * 0.56)
                + (routePressureScore * 0.26)
                + (routeCoverageGap * 0.18),
                0
            ));
            const weatherAdjustedIsolation = roundValue(clampUnitInterval(
                (resupplyCost * 0.5)
                + (climateStress * 0.32)
                + (stormExposure * 0.18),
                0
            ));
            const corridorDependenceScore = roundValue(clampUnitInterval(getNestedValue(corridorExposure, 'routeDependenceScore', 0), 0));
            const corridorAlternativeSupport = roundValue(clampUnitInterval(getNestedValue(corridorExposure, 'alternativeSupportScore', 0), 0));
            const corridorFragilityScore = roundValue(clampUnitInterval(getNestedValue(corridorExposure, 'structureFragilityScore', 0), 0));
            const mandatoryCorridorExposure = roundValue(clampUnitInterval(getNestedValue(corridorExposure, 'mandatoryCorridorExposure', 0), 0));
            const brittleCorridorExposure = roundValue(clampUnitInterval(getNestedValue(corridorExposure, 'brittleCorridorExposure', 0), 0));
            const chokepointControlValue = roundValue(clampUnitInterval(getNestedValue(chokepointExposure, 'controlValue', 0), 0));
            const chokepointTradeDependency = roundValue(clampUnitInterval(getNestedValue(chokepointExposure, 'tradeDependency', 0), 0));
            const chokepointBypassDifficulty = roundValue(clampUnitInterval(getNestedValue(chokepointExposure, 'bypassDifficulty', 0), 0));
            const chokepointCollapseSensitivity = roundValue(clampUnitInterval(getNestedValue(chokepointExposure, 'collapseSensitivity', 0), 0));
            const autonomousSurvivalScore = roundValue(clampUnitInterval(
                (resolvedCorePotential.score * 0.34)
                + (meanInteriorPassability * 0.14)
                + (routeCoverageGap * 0.12)
                + ((1 - climateStress) * 0.14)
                + ((1 - stormExposure) * 0.06)
                + ((1 - coastalDecayBurden) * 0.04)
                + ((1 - corridorDependenceScore) * 0.08)
                + ((1 - chokepointCollapseSensitivity) * 0.08),
                0
            ));
            const culturalDriftPotential = roundValue(clampUnitInterval(
                (weatherAdjustedIsolation * 0.3)
                + (distanceFromCore * 0.18)
                + (resupplyCost * 0.08)
                + (routeCoverageGap * 0.08)
                + (autonomousSurvivalScore * 0.18)
                + (chokepointBypassDifficulty * 0.08)
                + (corridorDependenceScore * 0.05)
                + ((1 - chokepointCollapseSensitivity) * 0.05),
                0
            ));
            const lossInCollapseLikelihood = roundValue(clampUnitInterval(
                (weatherAdjustedIsolation * 0.14)
                + (routePressureScore * 0.08)
                + (climateStress * 0.08)
                + (stormExposure * 0.04)
                + (coastalDecayBurden * 0.04)
                + (corridorDependenceScore * 0.12)
                + (corridorFragilityScore * 0.12)
                + (mandatoryCorridorExposure * 0.1)
                + (brittleCorridorExposure * 0.08)
                + (chokepointBypassDifficulty * 0.08)
                + (chokepointCollapseSensitivity * 0.08)
                + ((1 - autonomousSurvivalScore) * 0.04),
                0
            ));
            const peripheryScore = roundValue(clampUnitInterval(
                (weatherAdjustedIsolation * 0.28)
                + (culturalDriftPotential * 0.24)
                + (lossInCollapseLikelihood * 0.24)
                + (distanceFromCore * 0.12)
                + (routeCoverageGap * 0.06)
                + (autonomousSurvivalScore * 0.06),
                0
            ));
            const driverWeights = {
                distance_from_core: distanceFromCore * 0.16,
                resupply_cost: resupplyCost * 0.12,
                route_pressure: routePressureScore * 0.08,
                route_coverage_gap: routeCoverageGap * 0.08,
                climate_stress: climateStress * 0.1,
                storm_exposure: stormExposure * 0.04,
                coastal_decay: coastalDecayBurden * 0.04,
                corridor_dependence: corridorDependenceScore * 0.08,
                corridor_fragility: corridorFragilityScore * 0.08,
                chokepoint_bypass: chokepointBypassDifficulty * 0.08,
                chokepoint_collapse: chokepointCollapseSensitivity * 0.08,
                autonomous_survival: autonomousSurvivalScore * 0.14
            };
            const sourceGraphFamily = normalizeString(node.sourceGraphFamily, '');
            const nodeType = normalizeString(node.nodeType, '');
            const projectable = sourceGraphFamily !== 'sea' && nodeType !== 'sea_region';

            return {
                nodeId,
                nodeType,
                nodeRole: normalizeString(node.nodeRole, ''),
                continentId: normalizeString(node.continentId, ''),
                sourceGraphFamily,
                sourceRegionalSegmentId,
                sourceCoastalNodeId: normalizeString(node.sourceCoastalNodeId, ''),
                normalizedAnchorPoint: anchorPoint,
                coreAnchor: coreAnchorNodeIds.includes(nodeId),
                corePotentialScore: resolvedCorePotential.score,
                corePotentialClass: resolvedCorePotential.corePotentialClass,
                meanInteriorPassability,
                routeCoverageCount,
                routeCoverageRelief,
                routeCoverageGap,
                routePressureScore,
                climateStress,
                stormExposure,
                coastalDecayBurden,
                corridorDependenceScore,
                corridorAlternativeSupport,
                corridorFragilityScore,
                mandatoryCorridorExposure,
                brittleCorridorExposure,
                chokepointControlValue,
                chokepointTradeDependency,
                chokepointBypassDifficulty,
                chokepointCollapseSensitivity,
                distanceFromCore,
                resupplyCost,
                weatherAdjustedIsolation,
                culturalDriftPotential,
                autonomousSurvivalScore,
                lossInCollapseLikelihood,
                peripheryScore,
                isolationClass: classifyIsolationScore(weatherAdjustedIsolation),
                driftClass: classifyIsolationScore(culturalDriftPotential),
                collapseClass: classifyIsolationScore(lossInCollapseLikelihood),
                peripheryClass: classifyIsolationScore(peripheryScore),
                dominantIsolationDriverIds: selectDominantDriverIds(driverWeights, 3),
                supportingCorridorIds: uniqueStrings(getNestedValue(corridorExposure, 'supportingCorridorIds', [])),
                supportingChokepointIds: uniqueStrings(getNestedValue(chokepointExposure, 'supportingChokepointIds', [])),
                projectable
            };
        });

        const projectableAdjacency = buildProjectableAdjacency(nodeRows, adjacency);
        const projectionRows = nodeRows.filter((row) => row.projectable);

        return {
            worldBounds: cloneValue(worldBounds),
            hybridConnectivityGraph,
            routeCostSurface,
            macroRoutes,
            macroCorridors,
            chokepointRecords,
            corePotentialAnalysis,
            climateStressField,
            stormCorridorField,
            coastalDecayBurdenField,
            coreAnchorNodeIds,
            nodeRows,
            projectionRows: projectionRows.length > 0 ? projectionRows : nodeRows,
            projectableAdjacency
        };
    }

    function projectIsolationFieldChannels(nodeRows = [], worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedWorldBounds = normalizeWorldBounds(worldBounds);
        const width = normalizedWorldBounds.width;
        const height = normalizedWorldBounds.height;
        const size = width * height;
        const distanceFromCoreValues = new Array(size).fill(0);
        const resupplyCostValues = new Array(size).fill(0);
        const weatherAdjustedIsolationValues = new Array(size).fill(0);
        const culturalDriftPotentialValues = new Array(size).fill(0);
        const autonomousSurvivalScoreValues = new Array(size).fill(0);
        const lossInCollapseLikelihoodValues = new Array(size).fill(0);
        const projectionRows = Array.isArray(nodeRows) ? nodeRows : [];

        if (projectionRows.length === 0) {
            return {
                distanceFromCoreValues,
                resupplyCostValues,
                weatherAdjustedIsolationValues,
                culturalDriftPotentialValues,
                autonomousSurvivalScoreValues,
                lossInCollapseLikelihoodValues
            };
        }

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const index = (y * width) + x;
                const normalizedPoint = {
                    x: width <= 1 ? 0 : x / Math.max(1, width - 1),
                    y: height <= 1 ? 0 : y / Math.max(1, height - 1)
                };
                let bestRow = projectionRows[0];
                let bestDistanceSquared = Number.POSITIVE_INFINITY;

                projectionRows.forEach((row) => {
                    const anchorPoint = normalizePoint(row.normalizedAnchorPoint || {});
                    const distanceSquared = ((normalizedPoint.x - anchorPoint.x) ** 2) + ((normalizedPoint.y - anchorPoint.y) ** 2);
                    if (distanceSquared < bestDistanceSquared) {
                        bestDistanceSquared = distanceSquared;
                        bestRow = row;
                    }
                });

                distanceFromCoreValues[index] = roundValue(bestRow.distanceFromCore, 6);
                resupplyCostValues[index] = roundValue(bestRow.resupplyCost, 6);
                weatherAdjustedIsolationValues[index] = roundValue(bestRow.weatherAdjustedIsolation, 6);
                culturalDriftPotentialValues[index] = roundValue(bestRow.culturalDriftPotential, 6);
                autonomousSurvivalScoreValues[index] = roundValue(bestRow.autonomousSurvivalScore, 6);
                lossInCollapseLikelihoodValues[index] = roundValue(bestRow.lossInCollapseLikelihood, 6);
            }
        }

        return {
            distanceFromCoreValues,
            resupplyCostValues,
            weatherAdjustedIsolationValues,
            culturalDriftPotentialValues,
            autonomousSurvivalScoreValues,
            lossInCollapseLikelihoodValues
        };
    }

    function summarizeIsolationComponent(componentRows = []) {
        const rows = Array.isArray(componentRows) ? componentRows : [];
        return {
            nodeCount: rows.length,
            meanDistanceFromCore: roundValue(computeMean(rows.map((row) => row.distanceFromCore))),
            meanResupplyCost: roundValue(computeMean(rows.map((row) => row.resupplyCost))),
            meanWeatherAdjustedIsolation: roundValue(computeMean(rows.map((row) => row.weatherAdjustedIsolation))),
            meanCulturalDriftPotential: roundValue(computeMean(rows.map((row) => row.culturalDriftPotential))),
            meanAutonomousSurvivalScore: roundValue(computeMean(rows.map((row) => row.autonomousSurvivalScore))),
            meanLossInCollapseLikelihood: roundValue(computeMean(rows.map((row) => row.lossInCollapseLikelihood))),
            meanPeripheryScore: roundValue(computeMean(rows.map((row) => row.peripheryScore)))
        };
    }

    function buildIsolatedZonesOutput(nodeIsolationContext = {}, sourceOutputIds = [], dependencyAvailability = {}) {
        const nodeRows = Array.isArray(nodeIsolationContext.nodeRows) ? nodeIsolationContext.nodeRows : [];
        const projectableRows = nodeRows.filter((row) => row.projectable);
        const projectableAdjacency = nodeIsolationContext.projectableAdjacency instanceof Map
            ? nodeIsolationContext.projectableAdjacency
            : new Map();
        const qualifyingRows = projectableRows.filter((row) => (
            row.weatherAdjustedIsolation >= 0.58
            || row.culturalDriftPotential >= 0.56
            || row.lossInCollapseLikelihood >= 0.58
            || (row.autonomousSurvivalScore >= 0.66 && row.distanceFromCore >= 0.46)
        ));
        const selectedRows = qualifyingRows.length > 0
            ? qualifyingRows
            : projectableRows.slice().sort((left, right) => (
                right.peripheryScore - left.peripheryScore
                || left.nodeId.localeCompare(right.nodeId)
            )).slice(0, projectableRows.length > 0 ? 1 : 0);
        const nodeRowsById = buildLookupById(nodeRows, 'nodeId');
        const components = collectConnectedComponents(
            selectedRows.map((row) => row.nodeId),
            projectableAdjacency
        );
        const zones = components.map((componentNodeIds, index) => {
            const componentRows = componentNodeIds
                .map((nodeId) => nodeRowsById.get(nodeId))
                .filter(Boolean);
            const metrics = summarizeIsolationComponent(componentRows);
            const anchorRow = componentRows.slice().sort((left, right) => (
                right.peripheryScore - left.peripheryScore
                || left.nodeId.localeCompare(right.nodeId)
            ))[0] || null;

            return {
                zoneId: `iso_${String(index + 1).padStart(3, '0')}`,
                type: classifyIsolatedZoneType(componentRows),
                zoneClass: classifyIsolatedZoneClass(metrics),
                nodeIds: componentNodeIds.slice(),
                regionalSegmentIds: uniqueStrings(componentRows.map((row) => row.sourceRegionalSegmentId)),
                continentIds: uniqueStrings(componentRows.map((row) => row.continentId)),
                anchorNodeId: normalizeString(getNestedValue(anchorRow, 'nodeId', ''), ''),
                anchorRegionalSegmentId: normalizeString(getNestedValue(anchorRow, 'sourceRegionalSegmentId', ''), ''),
                nodeCount: componentRows.length,
                isolation: metrics.meanWeatherAdjustedIsolation,
                resupplyDifficulty: metrics.meanResupplyCost,
                culturalDriftPotential: metrics.meanCulturalDriftPotential,
                autonomousSurvivalScore: metrics.meanAutonomousSurvivalScore,
                lossInCollapseLikelihood: metrics.meanLossInCollapseLikelihood,
                peripheryScore: metrics.meanPeripheryScore,
                dominantDriverIds: aggregateDominantDriverIdsFromRows(componentRows, 3),
                supportingCorridorIds: uniqueStrings(componentRows.flatMap((row) => row.supportingCorridorIds || [])),
                supportingChokepointIds: uniqueStrings(componentRows.flatMap((row) => row.supportingChokepointIds || []))
            };
        });
        const zoneIdsByNodeId = new Map();

        zones.forEach((zone) => {
            zone.nodeIds.forEach((nodeId) => {
                if (!zoneIdsByNodeId.has(nodeId)) {
                    zoneIdsByNodeId.set(nodeId, []);
                }
                zoneIdsByNodeId.get(nodeId).push(zone.zoneId);
            });
        });

        return {
            output: {
                outputId: ISOLATED_ZONES_OUTPUT_ID,
                stageId: ISOLATED_ZONES_STAGE_ID,
                modelId: ISOLATED_ZONES_MODEL_ID,
                deterministic: true,
                worldBounds: cloneValue(nodeIsolationContext.worldBounds || {}),
                sourceOutputIds: sourceOutputIds.slice(),
                dependencyAvailability: cloneValue(dependencyAvailability),
                zones,
                summary: {
                    zoneCount: zones.length,
                    strongestZoneId: normalizeString((zones[0] || {}).zoneId, ''),
                    driftingZoneCount: zones.filter((zone) => zone.zoneClass === 'drifting' || zone.zoneClass === 'autonomous_drift').length,
                    fragileZoneCount: zones.filter((zone) => zone.zoneClass === 'fragile').length,
                    autonomousZoneCount: zones.filter((zone) => zone.type === 'autonomous_pocket' || zone.zoneClass === 'autonomous_drift').length,
                    fallbackUsed: qualifyingRows.length === 0 && zones.length > 0
                },
                compatibility: {
                    futurePackageInput: true,
                    futureStrategicLayerInput: true,
                    gameplaySemanticsOutput: false
                },
                intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
            },
            zoneIdsByNodeId
        };
    }

    function buildPeripheryClustersOutput(nodeIsolationContext = {}, isolatedZonesBundle = {}, sourceOutputIds = [], dependencyAvailability = {}) {
        const nodeRows = Array.isArray(nodeIsolationContext.nodeRows) ? nodeIsolationContext.nodeRows : [];
        const projectableRows = nodeRows.filter((row) => row.projectable);
        const projectableAdjacency = nodeIsolationContext.projectableAdjacency instanceof Map
            ? nodeIsolationContext.projectableAdjacency
            : new Map();
        const qualifyingRows = projectableRows.filter((row) => (
            row.peripheryScore >= 0.42
            || row.distanceFromCore >= 0.44
            || row.weatherAdjustedIsolation >= 0.44
            || row.culturalDriftPotential >= 0.44
            || row.lossInCollapseLikelihood >= 0.44
        ));
        const selectedRows = qualifyingRows.length > 0
            ? qualifyingRows
            : projectableRows.slice().sort((left, right) => (
                right.peripheryScore - left.peripheryScore
                || left.nodeId.localeCompare(right.nodeId)
            )).slice(0, projectableRows.length > 0 ? 1 : 0);
        const nodeRowsById = buildLookupById(nodeRows, 'nodeId');
        const zoneIdsByNodeId = isolatedZonesBundle.zoneIdsByNodeId instanceof Map
            ? isolatedZonesBundle.zoneIdsByNodeId
            : new Map();
        const components = collectConnectedComponents(
            selectedRows.map((row) => row.nodeId),
            projectableAdjacency
        );
        const clusters = components.map((componentNodeIds, index) => {
            const componentRows = componentNodeIds
                .map((nodeId) => nodeRowsById.get(nodeId))
                .filter(Boolean);
            const metrics = summarizeIsolationComponent(componentRows);
            const anchorRow = componentRows.slice().sort((left, right) => (
                right.peripheryScore - left.peripheryScore
                || left.nodeId.localeCompare(right.nodeId)
            ))[0] || null;
            const isolatedZoneIds = uniqueStrings(
                componentNodeIds.flatMap((nodeId) => zoneIdsByNodeId.get(nodeId) || [])
            );

            return {
                clusterId: `periphery_cluster_${String(index + 1).padStart(3, '0')}`,
                clusterClass: classifyPeripheryClusterClass(metrics),
                nodeIds: componentNodeIds.slice(),
                regionalSegmentIds: uniqueStrings(componentRows.map((row) => row.sourceRegionalSegmentId)),
                continentIds: uniqueStrings(componentRows.map((row) => row.continentId)),
                isolatedZoneIds,
                isolatedZoneCount: isolatedZoneIds.length,
                anchorNodeId: normalizeString(getNestedValue(anchorRow, 'nodeId', ''), ''),
                nodeCount: componentRows.length,
                meanDistanceFromCore: metrics.meanDistanceFromCore,
                meanResupplyCost: metrics.meanResupplyCost,
                meanWeatherAdjustedIsolation: metrics.meanWeatherAdjustedIsolation,
                meanCulturalDriftPotential: metrics.meanCulturalDriftPotential,
                meanAutonomousSurvivalScore: metrics.meanAutonomousSurvivalScore,
                meanLossInCollapseLikelihood: metrics.meanLossInCollapseLikelihood,
                peripheryScore: metrics.meanPeripheryScore,
                dominantDriverIds: aggregateDominantDriverIdsFromRows(componentRows, 3)
            };
        });

        return {
            outputId: PERIPHERY_CLUSTERS_OUTPUT_ID,
            stageId: PERIPHERY_CLUSTER_STAGE_ID,
            modelId: PERIPHERY_CLUSTER_MODEL_ID,
            deterministic: true,
            worldBounds: cloneValue(nodeIsolationContext.worldBounds || {}),
            sourceOutputIds: sourceOutputIds.slice(),
            dependencyAvailability: cloneValue(dependencyAvailability),
            clusters,
            summary: {
                clusterCount: clusters.length,
                strongestClusterId: normalizeString((clusters[0] || {}).clusterId, ''),
                fragileClusterCount: clusters.filter((cluster) => cluster.clusterClass === 'fragile_margin').length,
                driftingClusterCount: clusters.filter((cluster) => cluster.clusterClass === 'drifting_margin').length,
                autonomousClusterCount: clusters.filter((cluster) => cluster.clusterClass === 'autonomous_margin').length,
                fallbackUsed: qualifyingRows.length === 0 && clusters.length > 0
            },
            compatibility: {
                futurePackageInput: false,
                futureStrategicLayerInput: true,
                gameplaySemanticsOutput: false
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        };
    }

    function buildIsolationFieldAndOutputs(input = {}, context = {}) {
        const worldBounds = normalizeWorldBounds(context.worldBounds || input.worldBounds || DEFAULT_WORLD_BOUNDS);
        const dependencyAvailability = context.dependencyAvailability || describeIsolationPeripheryDependencyAvailability(input);
        const nodeIsolationContext = buildNodeIsolationRows(input, worldBounds);
        const nodeRows = Array.isArray(nodeIsolationContext.nodeRows) ? nodeIsolationContext.nodeRows : [];
        const projectionRows = Array.isArray(nodeIsolationContext.projectionRows) ? nodeIsolationContext.projectionRows : [];
        const channelValues = projectIsolationFieldChannels(projectionRows, worldBounds);
        const distanceValues = channelValues.distanceFromCoreValues;
        const resupplyValues = channelValues.resupplyCostValues;
        const weatherValues = channelValues.weatherAdjustedIsolationValues;
        const culturalDriftValues = channelValues.culturalDriftPotentialValues;
        const autonomousValues = channelValues.autonomousSurvivalScoreValues;
        const collapseValues = channelValues.lossInCollapseLikelihoodValues;
        const sourceOutputIds = uniqueStrings([
            normalizeString(getNestedValue(nodeIsolationContext.hybridConnectivityGraph, 'outputId', ''), ''),
            normalizeString(getNestedValue(nodeIsolationContext.routeCostSurface, 'outputId', ''), ''),
            normalizeString(getNestedValue(nodeIsolationContext.macroRoutes, 'outputId', ''), ''),
            normalizeString(getNestedValue(nodeIsolationContext.macroCorridors, 'outputId', ''), ''),
            normalizeString(getNestedValue(nodeIsolationContext.chokepointRecords, 'chokepointRecordOutputId', ''), ''),
            normalizeString(getNestedValue(nodeIsolationContext.corePotentialAnalysis, 'outputId', ''), ''),
            normalizeString(getNestedValue(nodeIsolationContext.climateStressField, 'fieldId', ''), ''),
            normalizeString(getNestedValue(nodeIsolationContext.stormCorridorField, 'fieldId', ''), ''),
            normalizeString(getNestedValue(nodeIsolationContext.coastalDecayBurdenField, 'fieldId', ''), '')
        ]);
        const fieldSummary = {
            nodeCount: nodeRows.length,
            coreAnchorCount: nodeIsolationContext.coreAnchorNodeIds.length,
            meanDistanceFromCore: roundValue(computeMean(distanceValues)),
            meanResupplyCost: roundValue(computeMean(resupplyValues)),
            meanWeatherAdjustedIsolation: roundValue(computeMean(weatherValues)),
            meanCulturalDriftPotential: roundValue(computeMean(culturalDriftValues)),
            meanAutonomousSurvivalScore: roundValue(computeMean(autonomousValues)),
            meanLossInCollapseLikelihood: roundValue(computeMean(collapseValues)),
            maxDistanceFromCore: roundValue(distanceValues.reduce((maxValue, value) => Math.max(maxValue, clampUnitInterval(value, 0)), 0)),
            maxResupplyCost: roundValue(resupplyValues.reduce((maxValue, value) => Math.max(maxValue, clampUnitInterval(value, 0)), 0)),
            maxWeatherAdjustedIsolation: roundValue(weatherValues.reduce((maxValue, value) => Math.max(maxValue, clampUnitInterval(value, 0)), 0)),
            maxCulturalDriftPotential: roundValue(culturalDriftValues.reduce((maxValue, value) => Math.max(maxValue, clampUnitInterval(value, 0)), 0)),
            maxAutonomousSurvivalScore: roundValue(autonomousValues.reduce((maxValue, value) => Math.max(maxValue, clampUnitInterval(value, 0)), 0)),
            maxLossInCollapseLikelihood: roundValue(collapseValues.reduce((maxValue, value) => Math.max(maxValue, clampUnitInterval(value, 0)), 0)),
            metricsImplemented: METRICS.slice()
        };
        const isolatedZonesBundle = buildIsolatedZonesOutput(
            nodeIsolationContext,
            sourceOutputIds,
            dependencyAvailability
        );
        const peripheryClusters = buildPeripheryClustersOutput(
            nodeIsolationContext,
            isolatedZonesBundle,
            sourceOutputIds,
            dependencyAvailability
        );
        const isolationField = {
            fieldId: ISOLATION_FIELD_ID,
            stageId: ISOLATION_STAGE_ID,
            modelId: ISOLATION_MODEL_ID,
            deterministic: true,
            fieldType: 'MultiChannelScalarField',
            primaryChannelId: 'weatherAdjustedIsolation',
            valueEncoding: FIELD_VALUE_ENCODING,
            worldBounds: cloneValue(worldBounds),
            width: worldBounds.width,
            height: worldBounds.height,
            size: worldBounds.width * worldBounds.height,
            range: DEFAULT_FIELD_RANGE.slice(),
            channels: METRICS.slice(),
            values: weatherValues.slice(),
            channelValues: {
                distanceFromCore: distanceValues.slice(),
                resupplyCost: resupplyValues.slice(),
                weatherAdjustedIsolation: weatherValues.slice(),
                culturalDriftPotential: culturalDriftValues.slice(),
                autonomousSurvivalScore: autonomousValues.slice(),
                lossInCollapseLikelihood: collapseValues.slice()
            },
            sourceOutputIds: sourceOutputIds.slice(),
            dependencyAvailability: cloneValue(dependencyAvailability),
            summary: fieldSummary,
            compatibility: {
                futurePeripheryInput: true,
                futureStrategicLayerInput: true,
                sameWorldBoundsRequired: true,
                gameplaySemanticsOutput: false
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        };
        const analysisSummary = {
            nodeCount: nodeRows.length,
            projectedNodeCount: projectionRows.length,
            coreAnchorCount: nodeIsolationContext.coreAnchorNodeIds.length,
            strongestIsolatedNodeId: normalizeString(
                (nodeRows.slice().sort((left, right) => (
                    right.weatherAdjustedIsolation - left.weatherAdjustedIsolation
                    || left.nodeId.localeCompare(right.nodeId)
                ))[0] || {}).nodeId,
                ''
            ),
            strongestDriftNodeId: normalizeString(
                (nodeRows.slice().sort((left, right) => (
                    right.culturalDriftPotential - left.culturalDriftPotential
                    || left.nodeId.localeCompare(right.nodeId)
                ))[0] || {}).nodeId,
                ''
            ),
            strongestCollapseRiskNodeId: normalizeString(
                (nodeRows.slice().sort((left, right) => (
                    right.lossInCollapseLikelihood - left.lossInCollapseLikelihood
                    || left.nodeId.localeCompare(right.nodeId)
                ))[0] || {}).nodeId,
                ''
            ),
            strongestAutonomousNodeId: normalizeString(
                (nodeRows.slice().sort((left, right) => (
                    right.autonomousSurvivalScore - left.autonomousSurvivalScore
                    || left.nodeId.localeCompare(right.nodeId)
                ))[0] || {}).nodeId,
                ''
            ),
            isolatedZoneCount: normalizeInteger(getNestedValue(isolatedZonesBundle, 'output.summary.zoneCount', 0), 0),
            peripheryClusterCount: normalizeInteger(getNestedValue(peripheryClusters, 'summary.clusterCount', 0), 0),
            meanDistanceFromCore: fieldSummary.meanDistanceFromCore,
            meanResupplyCost: fieldSummary.meanResupplyCost,
            meanWeatherAdjustedIsolation: fieldSummary.meanWeatherAdjustedIsolation,
            meanCulturalDriftPotential: fieldSummary.meanCulturalDriftPotential,
            meanAutonomousSurvivalScore: fieldSummary.meanAutonomousSurvivalScore,
            meanLossInCollapseLikelihood: fieldSummary.meanLossInCollapseLikelihood,
            metricsImplemented: METRICS.slice()
        };
        const isolationAnalysis = {
            outputId: ISOLATION_ANALYSIS_OUTPUT_ID,
            stageId: ISOLATION_STAGE_ID,
            modelId: ISOLATION_MODEL_ID,
            deterministic: true,
            dependencyAvailability: cloneValue(dependencyAvailability),
            worldBounds: cloneValue(worldBounds),
            sourceOutputIds: sourceOutputIds.slice(),
            coreAnchorNodeIds: nodeIsolationContext.coreAnchorNodeIds.slice(),
            nodeIsolationRows: nodeRows.map((row) => cloneValue(row)),
            summary: analysisSummary,
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        };

        return {
            field: isolationField,
            analysis: isolationAnalysis,
            isolatedZones: isolatedZonesBundle.output,
            peripheryClusters
        };
    }

    function getIsolationPeripheryAnalyzerDescriptor() {
        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            phaseVersion: PHASE_VERSION,
            description: 'Partial IsolationAndPeripheryAnalyzer with implemented distance-from-core, resupply-cost, weather-adjusted isolation, cultural-drift potential, autonomous survival, collapse-likelihood scoring, isolated zones, and periphery clusters.',
            currentOutputs: [ISOLATION_FIELD_ID, ISOLATION_ANALYSIS_OUTPUT_ID, ISOLATED_ZONES_OUTPUT_ID, PERIPHERY_CLUSTERS_OUTPUT_ID],
            deferredOutputs: INTENTIONALLY_ABSENT.slice()
        });
    }

    function getIsolationPeripheryInputContract() {
        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            requiredKeys: REQUIRED_KEYS.slice(),
            optionalKeys: OPTIONAL_KEYS.slice(),
            inputGroups: cloneValue(INPUT_GROUPS),
            description: 'Partial IsolationAndPeripheryAnalyzer input contract. The runtime now expects hybrid graph context plus optional route-cost, route/corridor fragility, official chokepoint records, core-potential, and climate fields for deterministic isolation, drift, collapse, and cluster extraction.'
        });
    }

    function getIsolationPeripheryOutputContract() {
        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            actualOutputs: {
                fields: [ISOLATION_FIELD_ID],
                intermediateOutputs: [ISOLATION_ANALYSIS_OUTPUT_ID, ISOLATED_ZONES_OUTPUT_ID, PERIPHERY_CLUSTERS_OUTPUT_ID],
                records: [],
                debugArtifacts: []
            },
            plannedOutputs: [],
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice(),
            description: 'Partial IsolationAndPeripheryAnalyzer output contract. The runtime emits a multi-channel isolation field, node-level isolation analysis, isolated zones, and periphery clusters from deterministic graph/core/climate/chokepoint context.'
        });
    }

    function analyzeIsolationPeriphery(input = {}) {
        const seed = normalizeSeed(input.macroSeed);
        const worldBounds = normalizeWorldBounds(input.worldBounds);
        const dependencyAvailability = describeIsolationPeripheryDependencyAvailability(input);
        const isolation = buildIsolationFieldAndOutputs(input, {
            seed,
            worldBounds,
            dependencyAvailability
        });
        const resolvedWorldBounds = cloneValue(isolation.field.worldBounds || worldBounds);

        return {
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            phaseVersion: PHASE_VERSION,
            status: STATUS,
            deterministic: true,
            seedNamespace: 'macro.isolationPeriphery',
            seed,
            worldBounds: resolvedWorldBounds,
            dependencyAvailability,
            outputs: {
                fields: {
                    isolationField: isolation.field
                },
                intermediateOutputs: {
                    isolationAnalysis: isolation.analysis,
                    isolatedZones: isolation.isolatedZones,
                    peripheryClusters: isolation.peripheryClusters
                },
                records: {},
                debugArtifacts: {}
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice(),
            notes: [
                'IsolationAndPeripheryAnalyzer now implements distance-from-core, resupply-cost, weather-adjusted isolation, cultural-drift potential, autonomous survival, and loss-in-collapse likelihood over the already built hybrid connectivity graph.',
                'The new drift/collapse/autonomy layer is derived from the already materialized route-cost, corridor-fragility, and official chokepoint outputs together with core-potential and climate burden.',
                'Isolated zones and periphery clusters are extracted as deterministic graph-connected components over projectable hybrid nodes; they remain analyzer-local outputs rather than final package assembly in this microstep.',
                'Archipelago significance, terrain cells, UI, and gameplay semantics remain deferred.'
            ],
            description: 'Partial isolation/periphery runtime with implemented drift/autonomy/collapse metrics plus isolated-zone and periphery-cluster extraction.'
        };
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule(MODULE_ID, {
            entry: 'analyzeIsolationPeriphery',
            file: 'js/worldgen/macro/isolation-periphery-analyzer.js',
            description: 'Partial IsolationAndPeripheryAnalyzer with implemented isolation, drift, autonomy, collapse metrics, isolated zones, and periphery clusters.',
            stub: false,
            scaffold: false
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep(PIPELINE_STEP_ID, {
            moduleId: MODULE_ID,
            file: 'js/worldgen/macro/isolation-periphery-analyzer.js',
            entry: 'analyzeIsolationPeriphery',
            description: 'Partial pipeline entry for isolation and periphery analysis; isolation, drift, autonomy, collapse metrics plus isolated-zone and periphery-cluster extraction are implemented while archipelago significance and gameplay semantics remain deferred.',
            stub: false,
            scaffold: false
        });
    }

    Object.assign(macro, {
        getIsolationPeripheryAnalyzerDescriptor,
        getIsolationPeripheryInputContract,
        getIsolationPeripheryOutputContract,
        describeIsolationPeripheryDependencyAvailability,
        analyzeIsolationPeriphery
    });
})();
