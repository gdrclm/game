(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const MODULE_ID = 'archipelagoSignificanceGenerator';
    const PIPELINE_STEP_ID = 'archipelagoSignificance';
    const STATUS = 'PARTIAL_IMPLEMENTED';
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';
    const DEFAULT_WORLD_BOUNDS = Object.freeze({
        width: 256,
        height: 128
    });
    const ARCHIPELAGO_MACRO_ZONES_OUTPUT_ID = 'archipelagoMacroZones';
    const MACROZONE_DETECTION_STAGE_ID = 'macrozoneDetection';
    const MACROZONE_DETECTION_MODEL_ID = 'deterministicArchipelagoMacrozoneDetectionV1';
    const REQUIRED_KEYS = Object.freeze([
        'macroSeed'
    ]);
    const OPTIONAL_KEYS = Object.freeze([
        'macroSeedProfile',
        'phase1Constraints',
        'worldBounds',
        'hydrosphere',
        'marineCarving',
        'connectivityGraph',
        'chokepoints',
        'isolationPeriphery',
        'fields',
        'intermediateOutputs',
        'records',
        'debugOptions'
    ]);
    const INPUT_GROUPS = Object.freeze({
        marineMorphology: Object.freeze([
            {
                dependencyId: 'archipelagoFragmentationSummary',
                sourceGroup: 'marineCarving.outputs.intermediateOutputs',
                required: true,
                role: 'fragmented island-chain runs that seed archipelago macrozone detection'
            },
            {
                dependencyId: 'seaRegionClusters',
                sourceGroup: 'hydrosphere.outputs.intermediateOutputs',
                required: false,
                role: 'coarse sea-region identity and basin linkage around detected island-chain runs'
            },
            {
                dependencyId: 'seaNavigabilityTagging',
                sourceGroup: 'hydrosphere.outputs.intermediateOutputs',
                required: false,
                role: 'optional tagged sea-region geometry and basin semantics for better macrozone linkage'
            }
        ]),
        routeContext: Object.freeze([
            {
                dependencyId: 'macroRoutes',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: false,
                role: 'marine-assisted route ids for future archipelago significance linkage'
            },
            {
                dependencyId: 'macroCorridors',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: false,
                role: 'marine corridor ids for later significance and fragility passes'
            }
        ]),
        islandChainContext: Object.freeze([
            {
                dependencyId: 'islandChainChokepointCandidates',
                sourceGroup: 'chokepoints.outputs.intermediateOutputs',
                required: false,
                role: 'archipelagic lock candidates that can be folded into macrozone detection and linkage'
            }
        ]),
        chokepointContext: Object.freeze([
            {
                dependencyId: 'chokepointRecords',
                sourceGroup: 'chokepoints.outputs.intermediateOutputs',
                required: false,
                role: 'official chokepoint records for contest and collapse linkage around archipelago macrozones'
            }
        ]),
        isolationContext: Object.freeze([
            {
                dependencyId: 'isolationAnalysis',
                sourceGroup: 'isolationPeriphery.outputs.intermediateOutputs',
                required: false,
                role: 'node-level isolation context for route-linked archipelago endpoints'
            },
            {
                dependencyId: 'isolatedZones',
                sourceGroup: 'isolationPeriphery.outputs.intermediateOutputs',
                required: false,
                role: 'deterministic isolated-zone summaries for linked inland-route surroundings'
            },
            {
                dependencyId: 'peripheryClusters',
                sourceGroup: 'isolationPeriphery.outputs.intermediateOutputs',
                required: false,
                role: 'broader periphery-cluster pressure around archipelago-linked inland route anchors'
            }
        ])
    });
    const INTENTIONALLY_ABSENT = Object.freeze([
        'archipelagoRegionRecords',
        'strategicSynthesis',
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

    function isPlainObject(value) {
        if (!value || typeof value !== 'object') {
            return false;
        }

        const prototype = Object.getPrototypeOf(value);
        return prototype === Object.prototype || prototype === null;
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

    function buildLookupById(values = [], idKey = 'id') {
        return new Map(
            (Array.isArray(values) ? values : [])
                .filter((value) => isPlainObject(value))
                .map((value) => [normalizeString(value[idKey], ''), value])
                .filter(([id]) => Boolean(id))
        );
    }

    function findInputIntermediateOutput(input = {}, outputId = '') {
        const sourceOutputs = [
            getNestedValue(input, 'intermediateOutputs', {}),
            getNestedValue(input, 'hydrosphere.outputs.intermediateOutputs', {}),
            getNestedValue(input, 'marineCarving.outputs.intermediateOutputs', {}),
            getNestedValue(input, 'connectivityGraph.outputs.intermediateOutputs', {}),
            getNestedValue(input, 'chokepoints.outputs.intermediateOutputs', {}),
            getNestedValue(input, 'isolationPeriphery.outputs.intermediateOutputs', {})
        ];

        for (const sourceOutputGroup of sourceOutputs) {
            if (sourceOutputGroup && typeof sourceOutputGroup === 'object' && hasOwn(sourceOutputGroup, outputId)) {
                return sourceOutputGroup[outputId];
            }
        }

        return null;
    }

    function describeArchipelagoDependencyAvailability(input = {}) {
        return deepFreeze(Object.fromEntries(
            Object.entries(INPUT_GROUPS).map(([groupId, dependencies]) => {
                const resolvedDependencies = dependencies.map((dependency) => {
                    const resolvedOutput = findInputIntermediateOutput(input, dependency.dependencyId);
                    return {
                        dependencyId: dependency.dependencyId,
                        sourceGroup: dependency.sourceGroup,
                        required: Boolean(dependency.required),
                        available: Boolean(resolvedOutput),
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

    function getSeaClusterList(seaRegionClustersOutput = {}, seaNavigabilityTagging = {}) {
        if (Array.isArray(seaNavigabilityTagging.taggedSeaRegionClusters) && seaNavigabilityTagging.taggedSeaRegionClusters.length > 0) {
            return seaNavigabilityTagging.taggedSeaRegionClusters.slice();
        }

        if (Array.isArray(seaRegionClustersOutput.seaRegionClusters)) {
            return seaRegionClustersOutput.seaRegionClusters.slice();
        }

        return [];
    }

    function buildSeaClusterLookups(seaClusters = []) {
        const clustersByBasinId = new Map();
        const clusterById = new Map();

        (Array.isArray(seaClusters) ? seaClusters : []).forEach((cluster, clusterIndex) => {
            const seaRegionClusterId = normalizeString(
                cluster.seaRegionClusterId,
                `seaRegionCluster_${String(clusterIndex + 1).padStart(3, '0')}`
            );
            const sourceBasinId = normalizeString(cluster.sourceBasinId, '');
            const seaRegionId = normalizeString(
                getNestedValue(cluster, 'recordDraft.seaRegionId', ''),
                normalizeString(cluster.seaRegionId, '')
            );
            const normalizedCluster = {
                seaRegionClusterId,
                sourceBasinId,
                seaRegionId,
                basinType: normalizeString(cluster.basinType, normalizeString(cluster.sourceBasinKind, '')),
                cellIndices: Array.isArray(cluster.cellIndices) ? cluster.cellIndices.slice() : [],
                normalizedCentroid: cloneValue(cluster.normalizedCentroid || {}),
                boundingBox: cloneValue(cluster.boundingBox || {})
            };

            clusterById.set(seaRegionClusterId, normalizedCluster);

            if (!sourceBasinId) {
                return;
            }
            if (!clustersByBasinId.has(sourceBasinId)) {
                clustersByBasinId.set(sourceBasinId, []);
            }
            clustersByBasinId.get(sourceBasinId).push(normalizedCluster);
        });

        return {
            clusterById,
            clustersByBasinId
        };
    }

    function buildRouteIdSets(macroRoutes = {}, macroCorridors = {}) {
        return {
            routeIds: new Set(
                (Array.isArray(macroRoutes && macroRoutes.candidateRoutes) ? macroRoutes.candidateRoutes : [])
                    .map((route) => normalizeString(route.routeId, ''))
                    .filter(Boolean)
            ),
            corridorIds: new Set(
                (Array.isArray(macroCorridors && macroCorridors.macroCorridors) ? macroCorridors.macroCorridors : [])
                    .map((corridor) => normalizeString(corridor.corridorId, ''))
                    .filter(Boolean)
            )
        };
    }

    function uniqueRecordsById(values = [], idKey = 'id') {
        const seenIds = new Set();
        const uniqueValues = [];

        (Array.isArray(values) ? values : []).forEach((value) => {
            if (!isPlainObject(value)) {
                return;
            }

            const recordId = normalizeString(value[idKey], '');
            const fallbackId = JSON.stringify(value);
            const dedupeId = recordId || fallbackId;

            if (!dedupeId || seenIds.has(dedupeId)) {
                return;
            }

            seenIds.add(dedupeId);
            uniqueValues.push(value);
        });

        return uniqueValues;
    }

    function intersectsStringLists(leftValues = [], rightValues = []) {
        const rightSet = new Set(uniqueStrings(rightValues));
        if (rightSet.size === 0) {
            return false;
        }

        return uniqueStrings(leftValues).some((value) => rightSet.has(value));
    }

    function computeAverageUnit(values = [], fallback = 0) {
        return roundValue(clampUnitInterval(computeMean(values), fallback));
    }

    function computeMaxUnit(values = [], fallback = 0) {
        const normalizedValues = Array.isArray(values)
            ? values.map((value) => clampUnitInterval(value, 0))
            : [];

        return roundValue(
            normalizedValues.length > 0
                ? normalizedValues.reduce((maxValue, value) => Math.max(maxValue, value), 0)
                : clampUnitInterval(fallback, 0)
        );
    }

    function selectTopWeightIds(weightEntries = [], limit = 3) {
        return (Array.isArray(weightEntries) ? weightEntries : [])
            .map((entry) => ({
                id: normalizeString(entry.id, ''),
                weight: clampUnitInterval(entry.weight, 0)
            }))
            .filter((entry) => entry.id && entry.weight > 0)
            .sort((left, right) => (
                right.weight - left.weight
                || left.id.localeCompare(right.id)
            ))
            .slice(0, Math.max(0, normalizeInteger(limit, 0)))
            .map((entry) => entry.id);
    }

    function buildRouteContextLookups(macroRoutes = {}, macroCorridors = {}) {
        const routeRows = Array.isArray(macroRoutes && macroRoutes.candidateRoutes)
            ? macroRoutes.candidateRoutes.slice()
            : [];
        const corridorRows = Array.isArray(macroCorridors && macroCorridors.macroCorridors)
            ? macroCorridors.macroCorridors.slice()
            : [];

        return {
            routeRows,
            corridorRows,
            routeById: buildLookupById(routeRows, 'routeId'),
            corridorById: buildLookupById(corridorRows, 'corridorId')
        };
    }

    function buildChokepointLookups(chokepointRecords = {}) {
        const chokepointRows = Array.isArray(chokepointRecords && chokepointRecords.chokepoints)
            ? chokepointRecords.chokepoints.slice()
            : [];
        const recordLinks = Array.isArray(chokepointRecords && chokepointRecords.recordLinks)
            ? chokepointRecords.recordLinks.slice()
            : [];
        const linksByCandidateId = new Map();
        const linksBySourceReferenceId = new Map();

        recordLinks.forEach((recordLink) => {
            const candidateId = normalizeString(recordLink.candidateId, '');
            const sourceReferenceId = normalizeString(recordLink.sourceReferenceId, '');

            if (candidateId) {
                if (!linksByCandidateId.has(candidateId)) {
                    linksByCandidateId.set(candidateId, []);
                }
                linksByCandidateId.get(candidateId).push(recordLink);
            }

            if (sourceReferenceId) {
                if (!linksBySourceReferenceId.has(sourceReferenceId)) {
                    linksBySourceReferenceId.set(sourceReferenceId, []);
                }
                linksBySourceReferenceId.get(sourceReferenceId).push(recordLink);
            }
        });

        return {
            chokepointRows,
            chokepointById: buildLookupById(chokepointRows, 'chokepointId'),
            recordLinks,
            linksByCandidateId,
            linksBySourceReferenceId
        };
    }

    function buildIsolationLookups(isolationAnalysis = {}, isolatedZones = {}, peripheryClusters = {}) {
        const nodeRows = Array.isArray(isolationAnalysis && isolationAnalysis.nodeIsolationRows)
            ? isolationAnalysis.nodeIsolationRows.slice()
            : [];
        const zoneRows = Array.isArray(isolatedZones && isolatedZones.zones)
            ? isolatedZones.zones.slice()
            : [];
        const clusterRows = Array.isArray(peripheryClusters && peripheryClusters.clusters)
            ? peripheryClusters.clusters.slice()
            : [];

        return {
            nodeRows,
            nodeById: buildLookupById(nodeRows, 'nodeId'),
            zoneRows,
            zoneById: buildLookupById(zoneRows, 'zoneId'),
            clusterRows,
            clusterById: buildLookupById(clusterRows, 'clusterId'),
            isolationSummary: cloneValue(getNestedValue(isolationAnalysis, 'summary', {}))
        };
    }

    function buildArchipelagoSupportContext(
        macroZone = {},
        routeContextLookups = {},
        chokepointLookups = {},
        isolationLookups = {}
    ) {
        const routeRows = uniqueRecordsById(
            uniqueStrings(macroZone.macroRouteIds || [])
                .map((routeId) => routeContextLookups.routeById instanceof Map ? routeContextLookups.routeById.get(routeId) : null)
                .filter(Boolean),
            'routeId'
        );
        const corridorRows = uniqueRecordsById(
            uniqueStrings(macroZone.macroCorridorIds || [])
                .map((corridorId) => routeContextLookups.corridorById instanceof Map ? routeContextLookups.corridorById.get(corridorId) : null)
                .filter(Boolean),
            'corridorId'
        );
        const linkedNodeIds = uniqueStrings(routeRows.flatMap((routeRow) => [
            normalizeString(routeRow.fromNodeId, ''),
            normalizeString(routeRow.toNodeId, '')
        ]));
        const linkedRegionalSegmentIds = uniqueStrings(routeRows.flatMap((routeRow) => [
            normalizeString(routeRow.fromRegionalSegmentId, ''),
            normalizeString(routeRow.toRegionalSegmentId, '')
        ]));
        const linkedNodeRows = uniqueRecordsById(
            linkedNodeIds
                .map((nodeId) => isolationLookups.nodeById instanceof Map ? isolationLookups.nodeById.get(nodeId) : null)
                .filter(Boolean),
            'nodeId'
        );
        const linkedIsolatedZones = uniqueRecordsById(
            (Array.isArray(isolationLookups.zoneRows) ? isolationLookups.zoneRows : [])
                .filter((zoneRow) => (
                    intersectsStringLists(zoneRow.nodeIds || [], linkedNodeIds)
                    || intersectsStringLists(zoneRow.regionalSegmentIds || [], linkedRegionalSegmentIds)
                )),
            'zoneId'
        );
        const linkedPeripheryClusters = uniqueRecordsById(
            (Array.isArray(isolationLookups.clusterRows) ? isolationLookups.clusterRows : [])
                .filter((clusterRow) => (
                    intersectsStringLists(clusterRow.nodeIds || [], linkedNodeIds)
                    || intersectsStringLists(clusterRow.regionalSegmentIds || [], linkedRegionalSegmentIds)
                )),
            'clusterId'
        );
        const rawRecordLinks = uniqueRecordsById(
            uniqueStrings(macroZone.sourceIslandChainCandidateIds || [])
                .flatMap((candidateId) => chokepointLookups.linksByCandidateId instanceof Map
                    ? (chokepointLookups.linksByCandidateId.get(candidateId) || [])
                    : [])
                .concat(
                    uniqueStrings(macroZone.sourceFragmentationRunIds || [])
                        .flatMap((sourceReferenceId) => chokepointLookups.linksBySourceReferenceId instanceof Map
                            ? (chokepointLookups.linksBySourceReferenceId.get(sourceReferenceId) || [])
                            : [])
                )
                .filter((recordLink) => normalizeString(recordLink.familyId, '') === 'island_chain'),
            'chokepointId'
        );
        const linkedChokepointIds = uniqueStrings(rawRecordLinks.map((recordLink) => recordLink.chokepointId));
        const linkedChokepointRows = uniqueRecordsById(
            linkedChokepointIds
                .map((chokepointId) => chokepointLookups.chokepointById instanceof Map ? chokepointLookups.chokepointById.get(chokepointId) : null)
                .filter(Boolean),
            'chokepointId'
        );

        return {
            routeRows,
            corridorRows,
            linkedNodeIds,
            linkedRegionalSegmentIds,
            linkedNodeRows,
            linkedIsolatedZones,
            linkedPeripheryClusters,
            linkedChokepointIds,
            linkedChokepointRows
        };
    }

    function computeLinkedIsolationSignals(supportContext = {}, isolationLookups = {}) {
        const linkedNodeRows = Array.isArray(supportContext.linkedNodeRows)
            ? supportContext.linkedNodeRows
            : [];
        const linkedZones = Array.isArray(supportContext.linkedIsolatedZones)
            ? supportContext.linkedIsolatedZones
            : [];
        const linkedClusters = Array.isArray(supportContext.linkedPeripheryClusters)
            ? supportContext.linkedPeripheryClusters
            : [];
        const isolationSummary = isPlainObject(isolationLookups.isolationSummary)
            ? isolationLookups.isolationSummary
            : {};

        return {
            meanWeatherAdjustedIsolation: computeAverageUnit([
                ...linkedNodeRows.map((row) => row.weatherAdjustedIsolation),
                ...linkedZones.map((zone) => zone.isolation),
                ...linkedClusters.map((cluster) => cluster.meanWeatherAdjustedIsolation)
            ], isolationSummary.meanWeatherAdjustedIsolation),
            meanLossInCollapseLikelihood: computeAverageUnit([
                ...linkedNodeRows.map((row) => row.lossInCollapseLikelihood),
                ...linkedZones.map((zone) => zone.lossInCollapseLikelihood),
                ...linkedClusters.map((cluster) => cluster.meanLossInCollapseLikelihood)
            ], isolationSummary.meanLossInCollapseLikelihood),
            meanPeripheryPressure: computeAverageUnit([
                ...linkedNodeRows.map((row) => row.peripheryScore),
                ...linkedZones.map((zone) => zone.peripheryScore),
                ...linkedClusters.map((cluster) => cluster.peripheryScore)
            ], 0),
            meanAutonomousSurvivalScore: computeAverageUnit([
                ...linkedNodeRows.map((row) => row.autonomousSurvivalScore),
                ...linkedZones.map((zone) => zone.autonomousSurvivalScore),
                ...linkedClusters.map((cluster) => cluster.meanAutonomousSurvivalScore)
            ], isolationSummary.meanAutonomousSurvivalScore)
        };
    }

    function computeArchipelagoSignificanceMetrics(
        macroZone = {},
        supportContext = {},
        isolationSignals = {}
    ) {
        const routeRows = Array.isArray(supportContext.routeRows) ? supportContext.routeRows : [];
        const corridorRows = Array.isArray(supportContext.corridorRows) ? supportContext.corridorRows : [];
        const chokepointRows = Array.isArray(supportContext.linkedChokepointRows) ? supportContext.linkedChokepointRows : [];
        const routeSupport = clampUnitInterval(routeRows.length / 3, 0);
        const corridorSupport = clampUnitInterval(corridorRows.length / 2, 0);
        const seaRegionReach = clampUnitInterval(
            (
                uniqueStrings(macroZone.seaRegionIds || []).length
                + (uniqueStrings(macroZone.seaRegionClusterIds || []).length * 0.5)
            ) / 3,
            0
        );
        const routeQuality = roundValue(1 - computeAverageUnit(routeRows.map((routeRow) => routeRow.meanEdgeRouteCost), 0));
        const marineAssistedShare = roundValue(
            routeRows.length > 0
                ? routeRows.filter((routeRow) => {
                    const routeMode = normalizeString(routeRow.routeMode, '');
                    return routeMode === 'marine_assisted' || routeMode === 'coastal_transfer';
                }).length / routeRows.length
                : 0
        );
        const corridorStrength = computeAverageUnit(corridorRows.map((corridorRow) => corridorRow.supportScore), 0);
        const corridorBrittleness = computeAverageUnit(
            corridorRows.map((corridorRow) => clampUnitInterval(
                (clampUnitInterval(corridorRow.routeDependenceScore, 0) * 0.4)
                + (clampUnitInterval(corridorRow.structureFragilityScore, 0) * 0.35)
                + ((corridorRow.brittleCorridor ? 1 : 0) * 0.25),
                0
            )),
            0
        );
        const chokepointControl = computeAverageUnit(chokepointRows.map((row) => row.controlValue), 0);
        const chokepointTrade = computeAverageUnit(chokepointRows.map((row) => row.tradeDependency), 0);
        const chokepointBypass = computeAverageUnit(chokepointRows.map((row) => row.bypassDifficulty), 0);
        const chokepointCollapse = computeAverageUnit(chokepointRows.map((row) => row.collapseSensitivity), 0);
        const weatherIsolation = clampUnitInterval(isolationSignals.meanWeatherAdjustedIsolation, 0);
        const collapseIsolation = clampUnitInterval(isolationSignals.meanLossInCollapseLikelihood, 0);
        const peripheryPressure = clampUnitInterval(isolationSignals.meanPeripheryPressure, 0);
        const autonomousSurvival = clampUnitInterval(isolationSignals.meanAutonomousSurvivalScore, 0);
        const connectiveValue = roundValue(clampUnitInterval(
            (routeSupport * 0.24)
            + (corridorSupport * 0.18)
            + (corridorStrength * 0.14)
            + (routeQuality * 0.14)
            + (seaRegionReach * 0.16)
            + (marineAssistedShare * 0.08)
            + (chokepointTrade * 0.06),
            0
        ));
        const contestScore = roundValue(clampUnitInterval(
            (chokepointControl * 0.28)
            + (chokepointTrade * 0.24)
            + (corridorSupport * 0.12)
            + (routeSupport * 0.12)
            + (marineAssistedShare * 0.12)
            + (clampUnitInterval(uniqueStrings(macroZone.seaRegionIds || []).length / 2, 0) * 0.12),
            0
        ));
        const fragility = roundValue(clampUnitInterval(
            ((1 - routeQuality) * 0.18)
            + (corridorBrittleness * 0.26)
            + (chokepointBypass * 0.24)
            + (Math.max(weatherIsolation, peripheryPressure) * 0.18)
            + ((1 - corridorStrength) * 0.14),
            0
        ));
        const collapseSusceptibility = roundValue(clampUnitInterval(
            (chokepointCollapse * 0.26)
            + (collapseIsolation * 0.24)
            + (corridorBrittleness * 0.22)
            + (fragility * 0.18)
            + ((supportContext.linkedIsolatedZones || []).length > 0 ? 0.1 : 0),
            0
        ));
        const colonizationAppeal = roundValue(clampUnitInterval(
            (connectiveValue * 0.28)
            + (routeQuality * 0.18)
            + (clampUnitInterval(macroZone.detectionConfidence, 0) * 0.14)
            + ((1 - fragility) * 0.16)
            + ((1 - contestScore) * 0.12)
            + ((1 - weatherIsolation) * 0.12),
            0
        ));
        const dominantDriverIds = selectTopWeightIds([
            { id: 'route_support', weight: routeSupport },
            { id: 'corridor_support', weight: corridorSupport },
            { id: 'sea_region_reach', weight: seaRegionReach },
            { id: 'chokepoint_control', weight: chokepointControl },
            { id: 'corridor_brittleness', weight: corridorBrittleness },
            { id: 'weather_isolation', weight: weatherIsolation },
            { id: 'collapse_isolation', weight: collapseIsolation }
        ], 4);

        return {
            routeSupport,
            corridorSupport,
            seaRegionReach,
            routeQuality,
            marineAssistedShare,
            corridorStrength,
            corridorBrittleness,
            chokepointControl,
            chokepointTrade,
            chokepointBypass,
            chokepointCollapse,
            weatherIsolation,
            collapseIsolation,
            peripheryPressure,
            autonomousSurvival,
            connectiveValue,
            fragility,
            colonizationAppeal,
            contestScore,
            collapseSusceptibility,
            dominantDriverIds
        };
    }

    function buildArchipelagoRoleSeedHints(macroZone = {}, supportContext = {}, significanceMetrics = {}) {
        const roleSeedWeights = [
            {
                seedId: 'hinge_lock_chain',
                weight: clampUnitInterval(
                    (significanceMetrics.connectiveValue * 0.35)
                    + (significanceMetrics.contestScore * 0.35)
                    + (significanceMetrics.chokepointControl * 0.2)
                    + (((supportContext.linkedChokepointIds || []).length > 0 ? 1 : 0) * 0.1),
                    0
                )
            },
            {
                seedId: 'bridge_chain',
                weight: clampUnitInterval(
                    (significanceMetrics.connectiveValue * 0.42)
                    + (significanceMetrics.seaRegionReach * 0.26)
                    + (significanceMetrics.routeSupport * 0.18)
                    + (clampUnitInterval((macroZone.projectedIslandSegmentCount || 0) / 6, 0) * 0.14),
                    0
                )
            },
            {
                seedId: 'corridor_lattice',
                weight: clampUnitInterval(
                    (significanceMetrics.corridorSupport * 0.36)
                    + (significanceMetrics.corridorStrength * 0.28)
                    + (significanceMetrics.connectiveValue * 0.2)
                    + (significanceMetrics.marineAssistedShare * 0.16),
                    0
                )
            },
            {
                seedId: 'stepping_stone_haven',
                weight: clampUnitInterval(
                    (significanceMetrics.colonizationAppeal * 0.44)
                    + ((1 - significanceMetrics.contestScore) * 0.18)
                    + ((1 - significanceMetrics.collapseSusceptibility) * 0.2)
                    + ((1 - significanceMetrics.weatherIsolation) * 0.18),
                    0
                )
            },
            {
                seedId: 'fragile_outpost_chain',
                weight: clampUnitInterval(
                    (significanceMetrics.fragility * 0.36)
                    + (significanceMetrics.collapseSusceptibility * 0.34)
                    + (significanceMetrics.corridorBrittleness * 0.16)
                    + (significanceMetrics.chokepointBypass * 0.14),
                    0
                )
            },
            {
                seedId: 'remote_fragment_chain',
                weight: clampUnitInterval(
                    (significanceMetrics.weatherIsolation * 0.34)
                    + ((1 - significanceMetrics.connectiveValue) * 0.28)
                    + (significanceMetrics.peripheryPressure * 0.18)
                    + ((1 - significanceMetrics.autonomousSurvival) * 0.2),
                    0
                )
            }
        ].sort((left, right) => (
            right.weight - left.weight
            || left.seedId.localeCompare(right.seedId)
        ));
        const primaryRoleSeed = normalizeString(getNestedValue(roleSeedWeights[0], 'seedId', ''), 'sea_margin_cluster');
        const seedStrength = roundValue(clampUnitInterval(getNestedValue(roleSeedWeights[0], 'weight', 0), 0));
        const secondaryRoleSeedIds = roleSeedWeights
            .slice(1)
            .filter((roleSeed) => roleSeed.weight >= Math.max(0.34, seedStrength - 0.18))
            .slice(0, 2)
            .map((roleSeed) => roleSeed.seedId);
        const seedTags = uniqueStrings([
            significanceMetrics.connectiveValue >= 0.58 ? 'connected' : '',
            significanceMetrics.contestScore >= 0.54 ? 'contested' : '',
            significanceMetrics.fragility >= 0.56 ? 'fragile' : '',
            significanceMetrics.colonizationAppeal >= 0.58 ? 'approachable' : '',
            significanceMetrics.collapseSusceptibility >= 0.56 ? 'collapse_prone' : '',
            uniqueStrings(macroZone.seaRegionIds || []).length >= 2 ? 'multi_basin' : '',
            (supportContext.linkedChokepointIds || []).length > 0 ? 'chokepoint_linked' : '',
            (supportContext.linkedIsolatedZones || []).length > 0 ? 'isolated_margin' : ''
        ]);

        return {
            primaryRoleSeed,
            secondaryRoleSeedIds,
            seedStrength,
            seedTags,
            dominantRoleDriverIds: significanceMetrics.dominantDriverIds.slice(0, 3),
            historicalInterpretationDeferred: true
        };
    }

    function buildIslandChainSupportLookup(islandChainChokepointCandidates = {}, macroRoutes = {}, macroCorridors = {}) {
        const routeIdSets = buildRouteIdSets(macroRoutes, macroCorridors);
        const candidates = Array.isArray(islandChainChokepointCandidates && islandChainChokepointCandidates.candidates)
            ? islandChainChokepointCandidates.candidates
            : [];
        const supportLookup = new Map();

        candidates.forEach((candidate) => {
            const runId = normalizeString(candidate.sourceFragmentationRunId, '');
            if (!runId) {
                return;
            }

            const existingSupport = supportLookup.get(runId) || {
                sourceIslandChainCandidateIds: [],
                seaRegionIds: [],
                seaRegionClusterIds: [],
                routeIds: [],
                corridorIds: []
            };
            const routeIds = uniqueStrings(candidate.supportingMarineRouteIds || [])
                .filter((routeId) => routeIdSets.routeIds.has(routeId));
            const corridorIds = uniqueStrings(candidate.supportingMarineCorridorIds || [])
                .filter((corridorId) => routeIdSets.corridorIds.has(corridorId));

            supportLookup.set(runId, {
                sourceIslandChainCandidateIds: uniqueStrings(
                    existingSupport.sourceIslandChainCandidateIds.concat(normalizeString(candidate.candidateId, ''))
                ),
                seaRegionIds: uniqueStrings(
                    existingSupport.seaRegionIds.concat(candidate.matchedSeaRegionIds || [])
                ),
                seaRegionClusterIds: uniqueStrings(
                    existingSupport.seaRegionClusterIds.concat(candidate.matchedSeaRegionClusterIds || [])
                ),
                routeIds: uniqueStrings(existingSupport.routeIds.concat(routeIds)),
                corridorIds: uniqueStrings(existingSupport.corridorIds.concat(corridorIds))
            });
        });

        return supportLookup;
    }

    function indexToPoint(index, width) {
        const normalizedIndex = Math.max(0, normalizeInteger(index, 0));
        const normalizedWidth = Math.max(1, normalizeInteger(width, DEFAULT_WORLD_BOUNDS.width));
        return {
            x: normalizedIndex % normalizedWidth,
            y: Math.floor(normalizedIndex / normalizedWidth)
        };
    }

    function computeCellGeometry(cellIndices = [], worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedWorldBounds = normalizeWorldBounds(worldBounds);
        const validCellIndices = Array.isArray(cellIndices)
            ? cellIndices
                .map((cellIndex) => normalizeInteger(cellIndex, -1))
                .filter((cellIndex) => cellIndex >= 0)
            : [];

        if (validCellIndices.length === 0) {
            return {
                cellIndices: [],
                boundingBox: {
                    minX: 0,
                    minY: 0,
                    maxX: 0,
                    maxY: 0
                },
                centroidPoint: {
                    x: 0,
                    y: 0
                },
                normalizedCentroid: {
                    x: 0,
                    y: 0
                }
            };
        }

        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;
        let totalX = 0;
        let totalY = 0;

        validCellIndices.forEach((cellIndex) => {
            const point = indexToPoint(cellIndex, normalizedWorldBounds.width);
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
            totalX += point.x;
            totalY += point.y;
        });

        const centroidPoint = {
            x: roundValue(totalX / validCellIndices.length, 2),
            y: roundValue(totalY / validCellIndices.length, 2)
        };

        return {
            cellIndices: validCellIndices.slice().sort((left, right) => left - right),
            boundingBox: {
                minX,
                minY,
                maxX,
                maxY
            },
            centroidPoint,
            normalizedCentroid: {
                x: roundValue(
                    normalizedWorldBounds.width <= 1
                        ? 0
                        : centroidPoint.x / Math.max(1, normalizedWorldBounds.width - 1),
                    4
                ),
                y: roundValue(
                    normalizedWorldBounds.height <= 1
                        ? 0
                        : centroidPoint.y / Math.max(1, normalizedWorldBounds.height - 1),
                    4
                )
            }
        };
    }

    function buildRunDetectionRows(fragmentationSummary = {}, seaClusterLookups = {}, supportLookup = new Map(), worldBounds = DEFAULT_WORLD_BOUNDS) {
        const fragmentationRuns = Array.isArray(fragmentationSummary && fragmentationSummary.fragmentationRuns)
            ? fragmentationSummary.fragmentationRuns
            : [];

        return fragmentationRuns.map((fragmentationRun, runIndex) => {
            const sourceFragmentationRunId = normalizeString(
                fragmentationRun.fragmentationRunId,
                `archipelagoRun_${String(runIndex + 1).padStart(3, '0')}`
            );
            const support = supportLookup.get(sourceFragmentationRunId) || {
                sourceIslandChainCandidateIds: [],
                seaRegionIds: [],
                seaRegionClusterIds: [],
                routeIds: [],
                corridorIds: []
            };
            const flankingBasinIds = uniqueStrings(fragmentationRun.flankingBasinIds || []);
            const linkedClusters = flankingBasinIds.flatMap((basinId) => seaClusterLookups.clustersByBasinId.get(basinId) || []);
            const linkedSeaRegionClusterIds = uniqueStrings(
                linkedClusters.map((cluster) => cluster.seaRegionClusterId).concat(support.seaRegionClusterIds || [])
            );
            const linkedSeaRegionIds = uniqueStrings(
                linkedClusters.map((cluster) => cluster.seaRegionId).concat(support.seaRegionIds || [])
            );
            const geometry = computeCellGeometry(
                uniqueStrings([])
                    .concat(fragmentationRun.runCellIndices || [])
                    .concat(fragmentationRun.carvedBreakCellIndices || [])
                    .map((value) => String(value)),
                worldBounds
            );

            return {
                sourceFragmentationRunId,
                sourceIslandChainCandidateIds: support.sourceIslandChainCandidateIds.slice(),
                orientation: normalizeString(fragmentationRun.orientation, ''),
                candidateCellCount: Math.max(0, normalizeInteger(fragmentationRun.candidateCellCount, 0)),
                projectedIslandSegmentCount: Math.max(0, normalizeInteger(fragmentationRun.projectedIslandSegmentCount, 0)),
                averageScore: clampUnitInterval(fragmentationRun.averageScore, 0),
                strongestScore: clampUnitInterval(fragmentationRun.strongestScore, 0),
                basinSupport: clampUnitInterval(fragmentationRun.basinSupport, 0),
                flankingBasinIds,
                flankingBasinKinds: uniqueStrings(fragmentationRun.flankingBasinKinds || []),
                linkedSeaRegionClusterIds,
                linkedSeaRegionIds,
                routeIds: support.routeIds.slice(),
                corridorIds: support.corridorIds.slice(),
                runCellIndices: Array.isArray(fragmentationRun.runCellIndices) ? fragmentationRun.runCellIndices.slice() : [],
                carvedBreakCellIndices: Array.isArray(fragmentationRun.carvedBreakCellIndices) ? fragmentationRun.carvedBreakCellIndices.slice() : [],
                geometry
            };
        });
    }

    function getRunDistance(leftRun = {}, rightRun = {}) {
        const leftCentroid = getNestedValue(leftRun, 'geometry.normalizedCentroid', {});
        const rightCentroid = getNestedValue(rightRun, 'geometry.normalizedCentroid', {});
        const dx = normalizeNumber(leftCentroid.x, 0) - normalizeNumber(rightCentroid.x, 0);
        const dy = normalizeNumber(leftCentroid.y, 0) - normalizeNumber(rightCentroid.y, 0);
        return Math.sqrt((dx * dx) + (dy * dy));
    }

    function runsBelongToSameMacrozone(leftRun = {}, rightRun = {}) {
        const sharedBasinIds = uniqueStrings(leftRun.flankingBasinIds || []).some((basinId) => uniqueStrings(rightRun.flankingBasinIds || []).includes(basinId));
        const sharedSeaRegionIds = uniqueStrings(leftRun.linkedSeaRegionIds || []).some((seaRegionId) => uniqueStrings(rightRun.linkedSeaRegionIds || []).includes(seaRegionId));
        const sharedSeaRegionClusterIds = uniqueStrings(leftRun.linkedSeaRegionClusterIds || []).some((clusterId) => uniqueStrings(rightRun.linkedSeaRegionClusterIds || []).includes(clusterId));
        const sharedRouteIds = uniqueStrings(leftRun.routeIds || []).some((routeId) => uniqueStrings(rightRun.routeIds || []).includes(routeId));

        if (sharedBasinIds || sharedSeaRegionIds || sharedSeaRegionClusterIds || sharedRouteIds) {
            return true;
        }

        const distance = getRunDistance(leftRun, rightRun);
        return distance <= 0.12 && normalizeString(leftRun.orientation, '') === normalizeString(rightRun.orientation, '');
    }

    function collectRunComponents(runRows = []) {
        const rows = Array.isArray(runRows) ? runRows.slice() : [];
        const rowById = buildLookupById(rows, 'sourceFragmentationRunId');
        const visitedRunIds = new Set();
        const components = [];

        rows
            .slice()
            .sort((left, right) => left.sourceFragmentationRunId.localeCompare(right.sourceFragmentationRunId))
            .forEach((runRow) => {
                const runId = normalizeString(runRow.sourceFragmentationRunId, '');
                if (!runId || visitedRunIds.has(runId)) {
                    return;
                }

                const queue = [runId];
                const componentRunIds = [];
                visitedRunIds.add(runId);

                while (queue.length > 0) {
                    const currentRunId = queue.shift();
                    const currentRun = rowById.get(currentRunId);
                    if (!currentRun) {
                        continue;
                    }

                    componentRunIds.push(currentRunId);

                    rows.forEach((otherRun) => {
                        const otherRunId = normalizeString(otherRun.sourceFragmentationRunId, '');
                        if (!otherRunId || visitedRunIds.has(otherRunId)) {
                            return;
                        }

                        if (!runsBelongToSameMacrozone(currentRun, otherRun)) {
                            return;
                        }

                        visitedRunIds.add(otherRunId);
                        queue.push(otherRunId);
                    });
                }

                componentRunIds.sort();
                components.push(componentRunIds);
            });

        return components;
    }

    function classifyMorphologyType(metrics = {}) {
        const runCount = Math.max(1, normalizeInteger(metrics.runCount, 1));
        const projectedIslandSegmentCount = Math.max(0, normalizeInteger(metrics.projectedIslandSegmentCount, 0));
        const uniqueSeaRegionCount = Math.max(0, normalizeInteger(metrics.uniqueSeaRegionCount, 0));
        const routeSupportCount = Math.max(0, normalizeInteger(metrics.routeSupportCount, 0));

        if (uniqueSeaRegionCount >= 2 && projectedIslandSegmentCount >= 4) {
            return 'fragmented_bridge';
        }
        if (runCount >= 2 && projectedIslandSegmentCount >= 4) {
            return 'broken_chain';
        }
        if (routeSupportCount > 0 || projectedIslandSegmentCount >= 3) {
            return 'clustered_arc';
        }
        return 'chain';
    }

    function createArchipelagoRecordDraftHints(input = {}) {
        const draftInput = {
            archipelagoId: normalizeString(input.archipelagoId, ''),
            morphologyType: normalizeString(input.morphologyType, ''),
            roleProfile: '',
            seaRegionIds: uniqueStrings(input.seaRegionIds || []),
            climateBandIds: [],
            primarySeaRegionId: normalizeString(input.primarySeaRegionId, ''),
            primaryClimateBandId: '',
            macroRouteIds: uniqueStrings(input.macroRouteIds || []),
            chokepointIds: uniqueStrings(input.chokepointIds || []),
            strategicRegionIds: [],
            connectiveValue: clampUnitInterval(input.connectiveValue, 0),
            fragility: clampUnitInterval(input.fragility, 0),
            colonizationAppeal: clampUnitInterval(input.colonizationAppeal, 0),
            longTermSustainability: 0,
            historicalVolatility: 0
        };

        if (typeof macro.createArchipelagoRegionRecordSkeleton === 'function') {
            return macro.createArchipelagoRegionRecordSkeleton(draftInput);
        }

        return draftInput;
    }

    function buildArchipelagoMacroZones(input = {}, dependencyAvailability = {}) {
        const archipelagoFragmentationSummary = findInputIntermediateOutput(input, 'archipelagoFragmentationSummary') || {};
        const seaRegionClustersOutput = findInputIntermediateOutput(input, 'seaRegionClusters') || {};
        const seaNavigabilityTagging = findInputIntermediateOutput(input, 'seaNavigabilityTagging') || {};
        const macroRoutes = findInputIntermediateOutput(input, 'macroRoutes') || {};
        const macroCorridors = findInputIntermediateOutput(input, 'macroCorridors') || {};
        const islandChainChokepointCandidates = findInputIntermediateOutput(input, 'islandChainChokepointCandidates') || {};
        const chokepointRecords = findInputIntermediateOutput(input, 'chokepointRecords') || {};
        const isolationAnalysis = findInputIntermediateOutput(input, 'isolationAnalysis') || {};
        const isolatedZones = findInputIntermediateOutput(input, 'isolatedZones') || {};
        const peripheryClusters = findInputIntermediateOutput(input, 'peripheryClusters') || {};
        const worldBounds = normalizeWorldBounds(
            archipelagoFragmentationSummary.worldBounds
            || seaRegionClustersOutput.worldBounds
            || seaNavigabilityTagging.worldBounds
            || input.worldBounds
        );
        const seaClusters = getSeaClusterList(seaRegionClustersOutput, seaNavigabilityTagging);
        const seaClusterLookups = buildSeaClusterLookups(seaClusters);
        const supportLookup = buildIslandChainSupportLookup(
            islandChainChokepointCandidates,
            macroRoutes,
            macroCorridors
        );
        const routeContextLookups = buildRouteContextLookups(macroRoutes, macroCorridors);
        const chokepointLookups = buildChokepointLookups(chokepointRecords);
        const isolationLookups = buildIsolationLookups(
            isolationAnalysis,
            isolatedZones,
            peripheryClusters
        );
        const runRows = buildRunDetectionRows(
            archipelagoFragmentationSummary,
            seaClusterLookups,
            supportLookup,
            worldBounds
        );
        const rowsById = buildLookupById(runRows, 'sourceFragmentationRunId');
        const components = collectRunComponents(runRows);
        const macroZones = components.map((componentRunIds, componentIndex) => {
            const componentRuns = componentRunIds
                .map((runId) => rowsById.get(runId))
                .filter(Boolean);
            const cellGeometry = computeCellGeometry(
                componentRuns.flatMap((run) => getNestedValue(run, 'geometry.cellIndices', [])),
                worldBounds
            );
            const seaRegionClusterIds = uniqueStrings(componentRuns.flatMap((run) => run.linkedSeaRegionClusterIds || []));
            const seaRegionIds = uniqueStrings(componentRuns.flatMap((run) => run.linkedSeaRegionIds || []));
            const macroRouteIds = uniqueStrings(componentRuns.flatMap((run) => run.routeIds || []));
            const macroCorridorIds = uniqueStrings(componentRuns.flatMap((run) => run.corridorIds || []));
            const sourceIslandChainCandidateIds = uniqueStrings(componentRuns.flatMap((run) => run.sourceIslandChainCandidateIds || []));
            const projectedIslandSegmentCount = componentRuns.reduce((sum, run) => sum + Math.max(0, normalizeInteger(run.projectedIslandSegmentCount, 0)), 0);
            const meanRunScore = roundValue(computeMean(componentRuns.map((run) => run.averageScore)));
            const strongestRunScore = roundValue(
                componentRuns.reduce((maxValue, run) => Math.max(maxValue, clampUnitInterval(run.strongestScore, 0)), 0)
            );
            const morphologyType = classifyMorphologyType({
                runCount: componentRuns.length,
                projectedIslandSegmentCount,
                uniqueSeaRegionCount: seaRegionIds.length,
                routeSupportCount: macroRouteIds.length
            });
            const primarySeaRegionId = normalizeString(
                seaRegionIds[0],
                normalizeString(
                    (seaRegionClusterIds.map((clusterId) => getNestedValue(seaClusterLookups.clusterById.get(clusterId), 'seaRegionId', ''))
                        .filter(Boolean)[0]),
                    ''
                )
            );
            const archipelagoId = `arch_${String(componentIndex + 1).padStart(3, '0')}`;
            const detectionConfidence = roundValue(clampUnitInterval(
                (meanRunScore * 0.44)
                + (strongestRunScore * 0.18)
                + (clampUnitInterval(projectedIslandSegmentCount / 6, 0) * 0.16)
                + (clampUnitInterval(seaRegionIds.length / 3, 0) * 0.12)
                + (Math.min(1, macroRouteIds.length) * 0.1),
                0
            ));
            const baseMacroZone = {
                archipelagoId,
                morphologyType,
                sourceFragmentationRunIds: componentRunIds.slice(),
                sourceIslandChainCandidateIds,
                seaRegionClusterIds,
                seaRegionIds,
                macroRouteIds,
                macroCorridorIds,
                projectedIslandSegmentCount,
                detectionConfidence
            };
            const supportContext = buildArchipelagoSupportContext(
                baseMacroZone,
                routeContextLookups,
                chokepointLookups,
                isolationLookups
            );
            const isolationSignals = computeLinkedIsolationSignals(
                supportContext,
                isolationLookups
            );
            const significanceMetrics = computeArchipelagoSignificanceMetrics(
                baseMacroZone,
                supportContext,
                isolationSignals
            );
            const roleSeedHints = buildArchipelagoRoleSeedHints(
                baseMacroZone,
                supportContext,
                significanceMetrics
            );

            return {
                archipelagoId,
                morphologyType,
                sourceFragmentationRunIds: componentRunIds.slice(),
                sourceIslandChainCandidateIds,
                runCount: componentRuns.length,
                candidateCellCount: componentRuns.reduce((sum, run) => sum + Math.max(0, normalizeInteger(run.candidateCellCount, 0)), 0),
                projectedIslandSegmentCount,
                runCellIndices: uniqueStrings(componentRuns.flatMap((run) => run.runCellIndices || []).map(String)).map((value) => normalizeInteger(value, 0)),
                carvedBreakCellIndices: uniqueStrings(componentRuns.flatMap((run) => run.carvedBreakCellIndices || []).map(String)).map((value) => normalizeInteger(value, 0)),
                cellIndices: cellGeometry.cellIndices.slice(),
                boundingBox: cloneValue(cellGeometry.boundingBox),
                centroidPoint: cloneValue(cellGeometry.centroidPoint),
                normalizedCentroid: cloneValue(cellGeometry.normalizedCentroid),
                seaRegionClusterIds,
                seaRegionIds,
                primarySeaRegionId,
                flankingBasinIds: uniqueStrings(componentRuns.flatMap((run) => run.flankingBasinIds || [])),
                flankingBasinKinds: uniqueStrings(componentRuns.flatMap((run) => run.flankingBasinKinds || [])),
                macroRouteIds,
                macroCorridorIds,
                linkedRegionalSegmentIds: supportContext.linkedRegionalSegmentIds.slice(),
                linkedNodeIds: supportContext.linkedNodeIds.slice(),
                linkedChokepointIds: supportContext.linkedChokepointIds.slice(),
                linkedIsolatedZoneIds: uniqueStrings(
                    (supportContext.linkedIsolatedZones || []).map((zone) => normalizeString(zone.zoneId, ''))
                ),
                linkedPeripheryClusterIds: uniqueStrings(
                    (supportContext.linkedPeripheryClusters || []).map((cluster) => normalizeString(cluster.clusterId, ''))
                ),
                routeSupportCount: macroRouteIds.length,
                corridorSupportCount: macroCorridorIds.length,
                meanRunScore,
                strongestRunScore,
                detectionConfidence,
                connectiveValue: significanceMetrics.connectiveValue,
                fragility: significanceMetrics.fragility,
                colonizationAppeal: significanceMetrics.colonizationAppeal,
                contestScore: significanceMetrics.contestScore,
                collapseSusceptibility: significanceMetrics.collapseSusceptibility,
                dominantSignificanceDriverIds: significanceMetrics.dominantDriverIds.slice(),
                roleSeedHints,
                pendingRecordFields: [
                    'roleProfile',
                    'climateBandIds',
                    'primaryClimateBandId',
                    'longTermSustainability',
                    'historicalVolatility',
                    'strategicRegionIds'
                ],
                recordDraftHints: createArchipelagoRecordDraftHints({
                    archipelagoId,
                    morphologyType,
                    seaRegionIds,
                    primarySeaRegionId,
                    macroRouteIds,
                    chokepointIds: supportContext.linkedChokepointIds,
                    connectiveValue: significanceMetrics.connectiveValue,
                    fragility: significanceMetrics.fragility,
                    colonizationAppeal: significanceMetrics.colonizationAppeal
                }),
                futureArchipelagoRegionRecordInput: true,
                significanceMetricsComputed: true
            };
        }).sort((left, right) => (
            right.connectiveValue - left.connectiveValue
            || right.contestScore - left.contestScore
            || right.colonizationAppeal - left.colonizationAppeal
            || left.archipelagoId.localeCompare(right.archipelagoId)
        ));

        return {
            outputId: ARCHIPELAGO_MACRO_ZONES_OUTPUT_ID,
            stageId: MACROZONE_DETECTION_STAGE_ID,
            modelId: MACROZONE_DETECTION_MODEL_ID,
            deterministic: true,
            seedNamespace: 'macro.archipelagoSignificance.macrozoneDetection',
            worldBounds: cloneValue(worldBounds),
            sourceOutputIds: uniqueStrings([
                normalizeString(archipelagoFragmentationSummary.archipelagoFragmentationId, ''),
                normalizeString(seaRegionClustersOutput.seaRegionClusterSetId, ''),
                normalizeString(seaNavigabilityTagging.seaNavigabilityTaggingId, ''),
                normalizeString(macroRoutes.outputId, ''),
                normalizeString(macroCorridors.outputId, ''),
                normalizeString(islandChainChokepointCandidates.outputId, '')
            ]),
            dependencyAvailability: cloneValue(dependencyAvailability),
            macroZones,
            summary: {
                macrozoneCount: macroZones.length,
                detectedRunCount: runRows.length,
                fragmentedRunCount: normalizeInteger(archipelagoFragmentationSummary.fragmentedRunCount, 0),
                routedMacrozoneCount: macroZones.filter((macroZone) => macroZone.routeSupportCount > 0).length,
                chokepointLinkedMacrozoneCount: macroZones.filter((macroZone) => macroZone.sourceIslandChainCandidateIds.length > 0).length,
                strongestMacrozoneId: normalizeString((macroZones[0] || {}).archipelagoId, ''),
                strongestConnectiveValue: computeMaxUnit(macroZones.map((macroZone) => macroZone.connectiveValue), 0),
                strongestContestScore: computeMaxUnit(macroZones.map((macroZone) => macroZone.contestScore), 0),
                strongestCollapseSusceptibility: computeMaxUnit(macroZones.map((macroZone) => macroZone.collapseSusceptibility), 0),
                roleSeedGenerationImplemented: true,
                significanceMetricsComputed: true
            },
            compatibility: {
                futureArchipelagoRegionRecordInput: true,
                futureArchipelagoSignificanceInput: true,
                sameWorldBoundsRequired: true,
                gameplaySemanticsOutput: false
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        };
    }

    function getArchipelagoSignificanceGeneratorDescriptor() {
        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            phaseVersion: PHASE_VERSION,
            description: 'Partial ArchipelagoSignificanceGenerator with deterministic archipelago-macrozone detection over island-chain morphology, sea-region identity, and route-linkage context.',
            currentOutputs: [ARCHIPELAGO_MACRO_ZONES_OUTPUT_ID],
            deferredOutputs: INTENTIONALLY_ABSENT.slice()
        });
    }

    function getArchipelagoSignificanceInputContract() {
        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            requiredKeys: REQUIRED_KEYS.slice(),
            optionalKeys: OPTIONAL_KEYS.slice(),
            inputGroups: cloneValue(INPUT_GROUPS),
            description: 'Partial ArchipelagoSignificanceGenerator input contract. The runtime now expects archipelago-fragmentation morphology plus optional sea-region, route/corridor, official chokepoint, and isolation/periphery outputs to score archipelago macrozones and seed future archipelago roles.'
        });
    }

    function getArchipelagoSignificanceOutputContract() {
        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            actualOutputs: {
                fields: [],
                intermediateOutputs: [ARCHIPELAGO_MACRO_ZONES_OUTPUT_ID],
                records: [],
                debugArtifacts: []
            },
            plannedOutputs: [],
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice(),
            description: 'Partial ArchipelagoSignificanceGenerator output contract. The runtime emits archipelago macrozones enriched with five significance metrics and role-seed hints, while final `ArchipelagoRegionRecord` export and strategic-region synthesis remain deferred.'
        });
    }

    function generateArchipelagoSignificance(input = {}) {
        const dependencyAvailability = describeArchipelagoDependencyAvailability(input);
        const archipelagoMacroZones = buildArchipelagoMacroZones(input, dependencyAvailability);

        return {
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            phaseVersion: PHASE_VERSION,
            status: STATUS,
            deterministic: true,
            seedNamespace: 'macro.archipelagoSignificance',
            seed: typeof macro.normalizeSeed === 'function'
                ? macro.normalizeSeed(input.macroSeed)
                : normalizeInteger(input.macroSeed, 0),
            worldBounds: cloneValue(archipelagoMacroZones.worldBounds),
            dependencyAvailability,
            outputs: {
                fields: {},
                intermediateOutputs: {
                    archipelagoMacroZones
                },
                records: {},
                debugArtifacts: {}
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice(),
            notes: [
                'ArchipelagoSignificanceGenerator now combines archipelago-macrozone detection with deterministic scoring of connective value, fragility, colonization appeal, contest score, and collapse susceptibility.',
                'The generator folds in route/corridor, official chokepoint, and isolation/periphery context, then emits role-seed hints without stepping into full historical interpretation or strategic-region synthesis.',
                'Detected macrozones carry future `ArchipelagoRegionRecord` draft hints with contract-aligned connective/fragility/appeal fields, while roleProfile finalization, climate linkage, sustainability, volatility, and final record export remain intentionally pending.'
            ],
            description: 'Partial archipelago-significance runtime with implemented archipelago-macrozone significance metrics and role-seed generation.'
        };
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule(MODULE_ID, {
            entry: 'generateArchipelagoSignificance',
            file: 'js/worldgen/macro/archipelago-significance-generator.js',
            description: 'Partial ArchipelagoSignificanceGenerator with implemented archipelago-macrozone detection, significance metrics, and role-seed hints.',
            stub: false,
            scaffold: false
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep(PIPELINE_STEP_ID, {
            moduleId: MODULE_ID,
            file: 'js/worldgen/macro/archipelago-significance-generator.js',
            entry: 'generateArchipelagoSignificance',
            description: 'Partial pipeline entry for archipelago significance; archipelago-macrozone detection, five significance metrics, and role-seed hints are implemented while final record materialization and strategic-region synthesis remain deferred.',
            stub: false,
            scaffold: false
        });
    }

    Object.assign(macro, {
        getArchipelagoSignificanceGeneratorDescriptor,
        getArchipelagoSignificanceInputContract,
        getArchipelagoSignificanceOutputContract,
        describeArchipelagoDependencyAvailability,
        generateArchipelagoSignificance
    });
})();
