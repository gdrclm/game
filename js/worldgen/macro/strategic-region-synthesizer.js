(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const MODULE_ID = 'strategicRegionSynthesizer';
    const PIPELINE_STEP_ID = 'strategicRegionSynthesis';
    const STATUS = 'PARTIAL_IMPLEMENTED';
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';
    const DEFAULT_WORLD_BOUNDS = Object.freeze({
        width: 256,
        height: 128
    });
    const STRATEGIC_REGION_CANDIDATES_OUTPUT_ID = 'strategicRegionCandidates';
    const CANDIDATE_STAGE_ID = 'candidateSynthesis';
    const CANDIDATE_MODEL_ID = 'deterministicStrategicRegionCandidateSynthesisV1';
    const REQUIRED_KEYS = Object.freeze([
        'macroSeed'
    ]);
    const OPTIONAL_KEYS = Object.freeze([
        'macroSeedProfile',
        'phase1Constraints',
        'worldBounds',
        'continentalCohesion',
        'coastalOpportunity',
        'connectivityGraph',
        'chokepoints',
        'isolationPeriphery',
        'archipelagoSignificance',
        'intermediateOutputs',
        'records',
        'debugOptions'
    ]);
    const INPUT_GROUPS = Object.freeze({
        cohesionContext: Object.freeze([
            {
                dependencyId: 'continentalCohesionSummaries',
                sourceGroup: 'continentalCohesion.outputs.intermediateOutputs',
                required: false,
                role: 'continent-level cohesion summaries for imperial-core and periphery framing'
            },
            {
                dependencyId: 'corePotentialAnalysis',
                sourceGroup: 'continentalCohesion.outputs.intermediateOutputs',
                required: false,
                role: 'segment and continent core-potential ranking for imperial-core candidate synthesis'
            },
            {
                dependencyId: 'fracturedPeripheryAnalysis',
                sourceGroup: 'continentalCohesion.outputs.intermediateOutputs',
                required: false,
                role: 'coarse peripheral-fragmentation signals for fragile-periphery candidate synthesis'
            }
        ]),
        coastalContext: Object.freeze([
            {
                dependencyId: 'coastalOpportunityProfile',
                sourceGroup: 'coastalOpportunity.outputs.intermediateOutputs',
                required: false,
                role: 'coastal opportunity cluster profiles for route-facing trade-belt and coast weighting'
            },
            {
                dependencyId: 'exceptionalCoastalNodes',
                sourceGroup: 'coastalOpportunity.outputs.intermediateOutputs',
                required: false,
                role: 'exceptional coastal nodes for trade-belt and imperial-core coastal-access context'
            }
        ]),
        connectivityContext: Object.freeze([
            {
                dependencyId: 'macroRoutes',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: false,
                role: 'sampled macro routes for trade-belt linkage and route exposure'
            },
            {
                dependencyId: 'macroCorridors',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: false,
                role: 'macro corridors for trade-belt extraction and strategic dependence framing'
            }
        ]),
        chokeContext: Object.freeze([
            {
                dependencyId: 'chokepointRecords',
                sourceGroup: 'chokepoints.outputs.intermediateOutputs',
                required: false,
                role: 'official chokepoint records for disputed-region synthesis'
            }
        ]),
        isolationContext: Object.freeze([
            {
                dependencyId: 'isolatedZones',
                sourceGroup: 'isolationPeriphery.outputs.intermediateOutputs',
                required: false,
                role: 'isolated-zone rollups for fragile-periphery candidate synthesis'
            },
            {
                dependencyId: 'peripheryClusters',
                sourceGroup: 'isolationPeriphery.outputs.intermediateOutputs',
                required: false,
                role: 'periphery-cluster rollups for fragile-periphery candidate synthesis'
            }
        ]),
        archipelagoContext: Object.freeze([
            {
                dependencyId: 'archipelagoMacroZones',
                sourceGroup: 'archipelagoSignificance.outputs.intermediateOutputs',
                required: false,
                role: 'archipelago significance rollups for trade-belt, fragile-periphery, and disputed-region synthesis'
            }
        ])
    });
    const INTENTIONALLY_ABSENT = Object.freeze([
        'strategicRegionRecords',
        'validationRebalance',
        'packageAssembly',
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

    function computeMean(values = [], fallback = 0) {
        const normalizedValues = Array.isArray(values)
            ? values
                .map((value) => normalizeNumber(value, Number.NaN))
                .filter((value) => Number.isFinite(value))
            : [];

        if (!normalizedValues.length) {
            return fallback;
        }

        return normalizedValues.reduce((sum, value) => sum + value, 0) / normalizedValues.length;
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
        return {
            width: Math.max(1, normalizeInteger(normalizedBounds.width, DEFAULT_WORLD_BOUNDS.width)),
            height: Math.max(1, normalizeInteger(normalizedBounds.height, DEFAULT_WORLD_BOUNDS.height))
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
        if (!rightSet.size) {
            return false;
        }

        return uniqueStrings(leftValues).some((value) => rightSet.has(value));
    }

    function findInputIntermediateOutput(input = {}, outputId = '') {
        const sourceOutputs = [
            getNestedValue(input, 'intermediateOutputs', {}),
            getNestedValue(input, 'continentalCohesion.outputs.intermediateOutputs', {}),
            getNestedValue(input, 'coastalOpportunity.outputs.intermediateOutputs', {}),
            getNestedValue(input, 'connectivityGraph.outputs.intermediateOutputs', {}),
            getNestedValue(input, 'chokepoints.outputs.intermediateOutputs', {}),
            getNestedValue(input, 'isolationPeriphery.outputs.intermediateOutputs', {}),
            getNestedValue(input, 'archipelagoSignificance.outputs.intermediateOutputs', {})
        ];

        for (const sourceOutputGroup of sourceOutputs) {
            if (sourceOutputGroup && typeof sourceOutputGroup === 'object' && hasOwn(sourceOutputGroup, outputId)) {
                return sourceOutputGroup[outputId];
            }
        }

        return null;
    }

    function describeStrategicRegionDependencyAvailability(input = {}) {
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

    function averageUnit(values = [], fallback = 0) {
        return roundValue(clampUnitInterval(computeMean(values, fallback), fallback));
    }

    function maxUnit(values = [], fallback = 0) {
        const normalizedValues = Array.isArray(values)
            ? values
                .map((value) => clampUnitInterval(value, 0))
                .filter((value) => Number.isFinite(value))
            : [];

        if (!normalizedValues.length) {
            return roundValue(clampUnitInterval(fallback, 0));
        }

        return roundValue(normalizedValues.reduce((maxValue, value) => Math.max(maxValue, value), 0));
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

    function normalizeValueMix(valueMix = {}) {
        return {
            food: roundValue(clampUnitInterval(getNestedValue(valueMix, 'food', 0), 0)),
            routes: roundValue(clampUnitInterval(getNestedValue(valueMix, 'routes', 0), 0)),
            defense: roundValue(clampUnitInterval(getNestedValue(valueMix, 'defense', 0), 0)),
            coast: roundValue(clampUnitInterval(getNestedValue(valueMix, 'coast', 0), 0))
        };
    }

    function createStrategicRegionRecordDraftHints(input = {}) {
        const draftInput = {
            regionId: normalizeString(input.regionId, ''),
            type: normalizeString(input.type, ''),
            valueMix: normalizeValueMix(input.valueMix || {}),
            stabilityScore: clampUnitInterval(input.stabilityScore, 0),
            expansionPressure: clampUnitInterval(input.expansionPressure, 0)
        };

        if (typeof macro.createStrategicRegionRecordSkeleton === 'function') {
            return macro.createStrategicRegionRecordSkeleton(draftInput);
        }

        return draftInput;
    }

    function buildRouteContextLookups(macroRoutes = {}, macroCorridors = {}) {
        const routeRows = Array.isArray(macroRoutes && macroRoutes.candidateRoutes)
            ? macroRoutes.candidateRoutes.slice()
            : [];
        const corridorRows = Array.isArray(macroCorridors && macroCorridors.macroCorridors)
            ? macroCorridors.macroCorridors.slice()
            : [];
        const corridorRowsByRouteId = new Map();

        corridorRows.forEach((corridorRow) => {
            uniqueStrings(corridorRow.supportingRouteIds || []).forEach((routeId) => {
                if (!corridorRowsByRouteId.has(routeId)) {
                    corridorRowsByRouteId.set(routeId, []);
                }
                corridorRowsByRouteId.get(routeId).push(corridorRow);
            });
        });

        return {
            routeRows,
            routeById: buildLookupById(routeRows, 'routeId'),
            corridorRows,
            corridorById: buildLookupById(corridorRows, 'corridorId'),
            corridorRowsByRouteId
        };
    }

    function buildCohesionLookups(continentalCohesionSummaries = {}, corePotentialAnalysis = {}, fracturedPeripheryAnalysis = {}) {
        const continentSummaries = Array.isArray(continentalCohesionSummaries && continentalCohesionSummaries.continentSummaries)
            ? continentalCohesionSummaries.continentSummaries.slice()
            : [];
        const coreContinentSummaries = Array.isArray(corePotentialAnalysis && corePotentialAnalysis.continentSummaries)
            ? corePotentialAnalysis.continentSummaries.slice()
            : [];
        const coreSegmentPotentials = Array.isArray(corePotentialAnalysis && corePotentialAnalysis.segmentPotentials)
            ? corePotentialAnalysis.segmentPotentials.slice()
            : [];
        const fracturedContinentSummaries = Array.isArray(fracturedPeripheryAnalysis && fracturedPeripheryAnalysis.continentSummaries)
            ? fracturedPeripheryAnalysis.continentSummaries.slice()
            : [];

        return {
            continentSummaries,
            continentSummaryById: buildLookupById(continentSummaries, 'continentId'),
            coreContinentSummaryById: buildLookupById(coreContinentSummaries, 'continentId'),
            coreSegmentById: buildLookupById(coreSegmentPotentials, 'regionalSegmentId'),
            fracturedContinentSummaryById: buildLookupById(fracturedContinentSummaries, 'continentId')
        };
    }

    function buildCoastalLookups(coastalOpportunityProfile = {}, exceptionalCoastalNodes = {}) {
        const clusterProfiles = Array.isArray(coastalOpportunityProfile && coastalOpportunityProfile.clusterProfiles)
            ? coastalOpportunityProfile.clusterProfiles.slice()
            : [];
        const coastalNodes = Array.isArray(exceptionalCoastalNodes && exceptionalCoastalNodes.exceptionalCoastalNodes)
            ? exceptionalCoastalNodes.exceptionalCoastalNodes.slice()
            : [];
        const profilesByContinentId = new Map();
        const nodesByContinentId = new Map();
        const nodeById = buildLookupById(coastalNodes, 'coastalNodeId');

        clusterProfiles.forEach((profile) => {
            const continentId = normalizeString(profile.continentId, '');
            if (!continentId) {
                return;
            }
            if (!profilesByContinentId.has(continentId)) {
                profilesByContinentId.set(continentId, []);
            }
            profilesByContinentId.get(continentId).push(profile);
        });

        coastalNodes.forEach((node) => {
            const continentId = normalizeString(node.continentId, '');
            if (!continentId) {
                return;
            }
            if (!nodesByContinentId.has(continentId)) {
                nodesByContinentId.set(continentId, []);
            }
            nodesByContinentId.get(continentId).push(node);
        });

        return {
            clusterProfiles,
            coastalNodes,
            nodeById,
            profilesByContinentId,
            nodesByContinentId
        };
    }

    function buildChokepointLookups(chokepointRecords = {}) {
        const chokepointRows = Array.isArray(chokepointRecords && chokepointRecords.chokepoints)
            ? chokepointRecords.chokepoints.slice()
            : [];
        return {
            chokepointRows,
            chokepointById: buildLookupById(chokepointRows, 'chokepointId')
        };
    }

    function buildIsolationLookups(isolatedZones = {}, peripheryClusters = {}) {
        const zoneRows = Array.isArray(isolatedZones && isolatedZones.zones)
            ? isolatedZones.zones.slice()
            : [];
        const clusterRows = Array.isArray(peripheryClusters && peripheryClusters.clusters)
            ? peripheryClusters.clusters.slice()
            : [];

        return {
            zoneRows,
            zoneById: buildLookupById(zoneRows, 'zoneId'),
            clusterRows,
            clusterById: buildLookupById(clusterRows, 'clusterId')
        };
    }

    function buildArchipelagoLookups(archipelagoMacroZones = {}) {
        const macroZones = Array.isArray(archipelagoMacroZones && archipelagoMacroZones.macroZones)
            ? archipelagoMacroZones.macroZones.slice()
            : [];
        return {
            macroZones,
            macroZoneById: buildLookupById(macroZones, 'archipelagoId')
        };
    }

    function getLinkedRouteRowsForContinent(continentId = '', routeContext = {}) {
        return uniqueRecordsById(
            (Array.isArray(routeContext.routeRows) ? routeContext.routeRows : []).filter((routeRow) => (
                normalizeString(routeRow.fromContinentId, '') === continentId
                || normalizeString(routeRow.toContinentId, '') === continentId
            )),
            'routeId'
        );
    }

    function getLinkedCorridorRowsForRouteIds(routeIds = [], routeContext = {}) {
        const corridorRows = uniqueStrings(routeIds)
            .flatMap((routeId) => routeContext.corridorRowsByRouteId instanceof Map
                ? (routeContext.corridorRowsByRouteId.get(routeId) || [])
                : []);
        return uniqueRecordsById(corridorRows, 'corridorId');
    }

    function getArchipelagosLinkedToRoutesAndCorridors(routeIds = [], corridorIds = [], archipelagoLookups = {}) {
        return uniqueRecordsById(
            (Array.isArray(archipelagoLookups.macroZones) ? archipelagoLookups.macroZones : []).filter((macroZone) => (
                intersectsStringLists(macroZone.macroRouteIds || [], routeIds)
                || intersectsStringLists(macroZone.macroCorridorIds || [], corridorIds)
            )),
            'archipelagoId'
        );
    }

    function getArchipelagosLinkedToPeriphery(clusterId = '', isolatedZoneIds = [], archipelagoLookups = {}) {
        return uniqueRecordsById(
            (Array.isArray(archipelagoLookups.macroZones) ? archipelagoLookups.macroZones : []).filter((macroZone) => (
                intersectsStringLists(macroZone.linkedPeripheryClusterIds || [], [clusterId])
                || intersectsStringLists(macroZone.linkedIsolatedZoneIds || [], isolatedZoneIds)
            )),
            'archipelagoId'
        );
    }

    function createStrategicCandidate(input = {}) {
        const strategicCandidateId = normalizeString(input.strategicCandidateId, '');
        const type = normalizeString(input.type, '');
        const regionId = normalizeString(input.regionId, strategicCandidateId.replace('candidate_', 'str_'));
        const valueMix = normalizeValueMix(input.valueMix || {});
        const stabilityScore = roundValue(clampUnitInterval(input.stabilityScore, 0));
        const expansionPressure = roundValue(clampUnitInterval(input.expansionPressure, 0));

        return {
            strategicCandidateId,
            type,
            candidateScore: roundValue(clampUnitInterval(input.candidateScore, 0)),
            sourceContinentIds: uniqueStrings(input.sourceContinentIds || []),
            sourceRegionalSegmentIds: uniqueStrings(input.sourceRegionalSegmentIds || []),
            sourceSeaRegionIds: uniqueStrings(input.sourceSeaRegionIds || []),
            sourceRouteIds: uniqueStrings(input.sourceRouteIds || []),
            sourceCorridorIds: uniqueStrings(input.sourceCorridorIds || []),
            sourceChokepointIds: uniqueStrings(input.sourceChokepointIds || []),
            sourceIsolatedZoneIds: uniqueStrings(input.sourceIsolatedZoneIds || []),
            sourcePeripheryClusterIds: uniqueStrings(input.sourcePeripheryClusterIds || []),
            sourceArchipelagoIds: uniqueStrings(input.sourceArchipelagoIds || []),
            valueMix,
            stabilityScore,
            expansionPressure,
            dominantDriverIds: uniqueStrings(input.dominantDriverIds || []),
            recordDraftHints: createStrategicRegionRecordDraftHints({
                regionId,
                type,
                valueMix,
                stabilityScore,
                expansionPressure
            }),
            futureStrategicRegionRecordInput: true
        };
    }

    function buildImperialCoreCandidates(context = {}) {
        const allCandidates = (context.cohesionLookups.continentSummaries || []).map((continentSummary, index) => {
            const continentId = normalizeString(continentSummary.continentId, '');
            const coreSummary = context.cohesionLookups.coreContinentSummaryById.get(continentId) || {};
            const linkedRouteRows = getLinkedRouteRowsForContinent(continentId, context.routeContext);
            const routeIds = linkedRouteRows.map((routeRow) => normalizeString(routeRow.routeId, ''));
            const linkedCorridorRows = getLinkedCorridorRowsForRouteIds(routeIds, context.routeContext);
            const coastalNodes = context.coastalLookups.nodesByContinentId.get(continentId) || [];
            const coastalProfiles = context.coastalLookups.profilesByContinentId.get(continentId) || [];
            const routeSupport = clampUnitInterval(
                (clampUnitInterval(linkedRouteRows.length / 3, 0) * 0.62)
                + (averageUnit(linkedCorridorRows.map((corridorRow) => corridorRow.supportScore), 0) * 0.38),
                0
            );
            const coastalSupport = clampUnitInterval(
                (averageUnit(coastalProfiles.map((profile) => profile.coastalOpportunityScore), 0) * 0.55)
                + (maxUnit(coastalNodes.map((node) => node.exceptionalityScore), 0) * 0.45),
                0
            );
            const lowPeripherySupport = roundValue(1 - clampUnitInterval(continentSummary.meanFracturedPeriphery, 0));
            const foodValue = averageUnit([
                coreSummary.meanCorePotential,
                continentSummary.meanInteriorPassability
            ], 0);
            const routesValue = roundValue(routeSupport);
            const defenseValue = averageUnit([
                continentSummary.meanContinentalCohesion,
                lowPeripherySupport
            ], 0);
            const coastValue = roundValue(coastalSupport);
            const candidateScore = roundValue(clampUnitInterval(
                (clampUnitInterval(coreSummary.leadingCorePotentialScore, 0) * 0.24)
                + (clampUnitInterval(coreSummary.meanCorePotential, 0) * 0.18)
                + (clampUnitInterval(continentSummary.meanContinentalCohesion, 0) * 0.2)
                + (routeSupport * 0.18)
                + (coastalSupport * 0.1)
                + (lowPeripherySupport * 0.1),
                0
            ));
            const stabilityScore = roundValue(clampUnitInterval(
                (defenseValue * 0.42)
                + (clampUnitInterval(continentSummary.meanContinentalCohesion, 0) * 0.34)
                + (lowPeripherySupport * 0.24),
                0
            ));
            const expansionPressure = roundValue(clampUnitInterval(
                (routesValue * 0.32)
                + (foodValue * 0.24)
                + (coastValue * 0.16)
                + (clampUnitInterval(coreSummary.leadingCorePotentialScore, 0) * 0.28),
                0
            ));

            return createStrategicCandidate({
                strategicCandidateId: `candidate_imperial_core_${String(index + 1).padStart(3, '0')}`,
                type: 'imperial_core_candidate',
                candidateScore,
                sourceContinentIds: [continentId],
                sourceRegionalSegmentIds: uniqueStrings([
                    normalizeString(coreSummary.leadingCorePotentialSegmentId, ''),
                    ...(Array.isArray(coreSummary.supportingCorePotentialSegmentIds) ? coreSummary.supportingCorePotentialSegmentIds.slice(0, 2) : [])
                ]),
                sourceRouteIds: routeIds,
                sourceCorridorIds: linkedCorridorRows.map((corridorRow) => normalizeString(corridorRow.corridorId, '')),
                valueMix: {
                    food: foodValue,
                    routes: routesValue,
                    defense: defenseValue,
                    coast: coastValue
                },
                stabilityScore,
                expansionPressure,
                dominantDriverIds: selectTopWeightIds([
                    { id: 'core_potential', weight: coreSummary.leadingCorePotentialScore },
                    { id: 'continental_cohesion', weight: continentSummary.meanContinentalCohesion },
                    { id: 'route_support', weight: routeSupport },
                    { id: 'coastal_access', weight: coastalSupport },
                    { id: 'low_periphery', weight: lowPeripherySupport }
                ], 4)
            });
        }).sort((left, right) => (
            right.candidateScore - left.candidateScore
            || right.stabilityScore - left.stabilityScore
            || left.strategicCandidateId.localeCompare(right.strategicCandidateId)
        ));

        const candidates = allCandidates.filter((candidate) => (
            candidate.candidateScore >= 0.5
            || candidate.stabilityScore >= 0.58
            || candidate.expansionPressure >= 0.58
        ));

        if (!candidates.length) {
            return allCandidates.slice(0, 1);
        }

        return candidates.slice(0, 6);
    }

    function buildTradeBeltCandidates(context = {}) {
        const candidates = (context.routeContext.corridorRows || []).map((corridorRow, index) => {
            const routeIds = uniqueStrings(corridorRow.supportingRouteIds || []);
            const linkedRouteRows = uniqueRecordsById(
                routeIds
                    .map((routeId) => context.routeContext.routeById.get(routeId))
                    .filter(Boolean),
                'routeId'
            );
            const sourceCoastalNodeIds = uniqueStrings(corridorRow.sourceCoastalNodeIds || []);
            const linkedCoastalNodes = uniqueRecordsById(
                sourceCoastalNodeIds
                    .map((nodeId) => context.coastalLookups.nodeById.get(nodeId))
                    .filter(Boolean),
                'coastalNodeId'
            );
            const linkedArchipelagos = getArchipelagosLinkedToRoutesAndCorridors(
                routeIds,
                [normalizeString(corridorRow.corridorId, '')],
                context.archipelagoLookups
            );
            const linkedChokepointIds = uniqueStrings(linkedArchipelagos.flatMap((macroZone) => macroZone.linkedChokepointIds || []));
            const meanArchipelagoConnective = averageUnit(
                linkedArchipelagos.map((macroZone) => macroZone.connectiveValue),
                0
            );
            const routeIntensity = roundValue(clampUnitInterval(
                (clampUnitInterval(corridorRow.supportScore, 0) * 0.38)
                + ((1 - clampUnitInterval(corridorRow.meanEdgeRouteCost, 0)) * 0.18)
                + (clampUnitInterval(normalizeInteger(corridorRow.sampledRouteCount, 0) / 4, 0) * 0.18)
                + (normalizeString(corridorRow.routeMode, '') === 'marine_assisted' ? 0.16 : 0.06)
                + (normalizeInteger(corridorRow.transitionEdgeCount, 0) > 0 ? 0.1 : 0),
                0
            ));
            const coastAccess = roundValue(clampUnitInterval(
                (maxUnit(linkedCoastalNodes.map((node) => node.exceptionalityScore), 0) * 0.42)
                + (meanArchipelagoConnective * 0.24)
                + (clampUnitInterval(sourceCoastalNodeIds.length / 2, 0) * 0.2)
                + (clampUnitInterval(linkedArchipelagos.length / 2, 0) * 0.14),
                0
            ));
            const defenseValue = roundValue(clampUnitInterval(
                (averageUnit(linkedChokepointIds.map((chokepointId) => getNestedValue(context.chokepointLookups.chokepointById.get(chokepointId), 'controlValue', 0)), 0) * 0.56)
                + ((1 - clampUnitInterval(corridorRow.structureFragilityScore, 0)) * 0.24)
                + ((1 - clampUnitInterval(corridorRow.routeDependenceScore, 0)) * 0.2),
                0
            ));
            const routesValue = routeIntensity;
            const coastValue = coastAccess;
            const foodValue = averageUnit(
                linkedArchipelagos.map((macroZone) => macroZone.colonizationAppeal),
                maxUnit(linkedCoastalNodes.map((node) => node.fishingPotentialScore), 0.18)
            );
            const candidateScore = roundValue(clampUnitInterval(
                (routeIntensity * 0.38)
                + (coastAccess * 0.26)
                + (meanArchipelagoConnective * 0.16)
                + (averageUnit(linkedChokepointIds.map((chokepointId) => getNestedValue(context.chokepointLookups.chokepointById.get(chokepointId), 'tradeDependency', 0)), 0) * 0.1)
                + (foodValue * 0.1),
                0
            ));
            const stabilityScore = roundValue(clampUnitInterval(
                ((1 - clampUnitInterval(corridorRow.routeDependenceScore, 0)) * 0.36)
                + ((1 - clampUnitInterval(corridorRow.structureFragilityScore, 0)) * 0.28)
                + (foodValue * 0.16)
                + ((1 - clampUnitInterval(corridorRow.peakEdgeRouteCost, 0)) * 0.2),
                0
            ));
            const expansionPressure = roundValue(clampUnitInterval(
                (routesValue * 0.4)
                + (coastValue * 0.24)
                + (meanArchipelagoConnective * 0.18)
                + (defenseValue * 0.18),
                0
            ));

            return createStrategicCandidate({
                strategicCandidateId: `candidate_trade_belt_${String(index + 1).padStart(3, '0')}`,
                type: 'trade_belt_candidate',
                candidateScore,
                sourceContinentIds: uniqueStrings(linkedRouteRows.flatMap((routeRow) => [
                    normalizeString(routeRow.fromContinentId, ''),
                    normalizeString(routeRow.toContinentId, '')
                ]).concat(linkedCoastalNodes.map((node) => normalizeString(node.continentId, '')))),
                sourceRegionalSegmentIds: uniqueStrings(linkedRouteRows.flatMap((routeRow) => [
                    normalizeString(routeRow.fromRegionalSegmentId, ''),
                    normalizeString(routeRow.toRegionalSegmentId, '')
                ])),
                sourceRouteIds: routeIds,
                sourceCorridorIds: [normalizeString(corridorRow.corridorId, '')],
                sourceChokepointIds: linkedChokepointIds,
                sourceArchipelagoIds: linkedArchipelagos.map((macroZone) => normalizeString(macroZone.archipelagoId, '')),
                valueMix: {
                    food: foodValue,
                    routes: routesValue,
                    defense: defenseValue,
                    coast: coastValue
                },
                stabilityScore,
                expansionPressure,
                dominantDriverIds: selectTopWeightIds([
                    { id: 'corridor_support', weight: corridorRow.supportScore },
                    { id: 'coast_access', weight: coastAccess },
                    { id: 'route_intensity', weight: routeIntensity },
                    { id: 'archipelago_connectivity', weight: meanArchipelagoConnective },
                    { id: 'trade_dependency', weight: averageUnit(linkedChokepointIds.map((chokepointId) => getNestedValue(context.chokepointLookups.chokepointById.get(chokepointId), 'tradeDependency', 0)), 0) }
                ], 4)
            });
        }).filter((candidate) => (
            candidate.candidateScore >= 0.46
            || candidate.valueMix.coast >= 0.44
            || candidate.valueMix.routes >= 0.58
        )).sort((left, right) => (
            right.candidateScore - left.candidateScore
            || right.expansionPressure - left.expansionPressure
            || left.strategicCandidateId.localeCompare(right.strategicCandidateId)
        ));

        return candidates.slice(0, 8);
    }

    function buildFragilePeripheryCandidates(context = {}) {
        const clusterCandidates = (context.isolationLookups.clusterRows || []).map((clusterRow, index) => {
            const isolatedZoneIds = uniqueStrings(clusterRow.isolatedZoneIds || []);
            const linkedRouteRows = uniqueRecordsById(
                (context.routeContext.routeRows || []).filter((routeRow) => (
                    intersectsStringLists([
                        normalizeString(routeRow.fromRegionalSegmentId, ''),
                        normalizeString(routeRow.toRegionalSegmentId, '')
                    ], clusterRow.regionalSegmentIds || [])
                )),
                'routeId'
            );
            const routeIds = linkedRouteRows.map((routeRow) => normalizeString(routeRow.routeId, ''));
            const linkedCorridorRows = getLinkedCorridorRowsForRouteIds(routeIds, context.routeContext);
            const linkedArchipelagos = getArchipelagosLinkedToPeriphery(
                normalizeString(clusterRow.clusterId, ''),
                isolatedZoneIds,
                context.archipelagoLookups
            );
            const linkedArchipelagoFragility = averageUnit(
                linkedArchipelagos.map((macroZone) => averageUnit([macroZone.fragility, macroZone.collapseSusceptibility], 0)),
                0
            );
            const candidateScore = roundValue(clampUnitInterval(
                (clampUnitInterval(clusterRow.peripheryScore, 0) * 0.3)
                + (clampUnitInterval(clusterRow.meanWeatherAdjustedIsolation, 0) * 0.24)
                + (clampUnitInterval(clusterRow.meanLossInCollapseLikelihood, 0) * 0.24)
                + ((1 - clampUnitInterval(clusterRow.meanAutonomousSurvivalScore, 0)) * 0.14)
                + (linkedArchipelagoFragility * 0.08),
                0
            ));
            const routesValue = roundValue(clampUnitInterval(
                (clampUnitInterval(linkedRouteRows.length / 3, 0) * 0.58)
                + (averageUnit(linkedCorridorRows.map((corridorRow) => corridorRow.supportScore), 0) * 0.42),
                0
            ));
            const coastValue = roundValue(clampUnitInterval(
                (clampUnitInterval(linkedArchipelagos.length / 2, 0) * 0.48)
                + (isolatedZoneIds.length > 0 ? 0.2 : 0)
                + (maxUnit(linkedArchipelagos.map((macroZone) => macroZone.colonizationAppeal), 0) * 0.32),
                0
            ));
            const foodValue = roundValue(clampUnitInterval(
                (clampUnitInterval(clusterRow.meanAutonomousSurvivalScore, 0) * 0.46)
                + (averageUnit(linkedArchipelagos.map((macroZone) => macroZone.colonizationAppeal), 0.12) * 0.24)
                + ((1 - clampUnitInterval(clusterRow.meanLossInCollapseLikelihood, 0)) * 0.3),
                0
            ));
            const defenseValue = roundValue(clampUnitInterval(
                (clampUnitInterval(clusterRow.meanAutonomousSurvivalScore, 0) * 0.34)
                + ((1 - clampUnitInterval(clusterRow.meanLossInCollapseLikelihood, 0)) * 0.32)
                + ((1 - clampUnitInterval(clusterRow.peripheryScore, 0)) * 0.18)
                + (averageUnit(linkedArchipelagos.map((macroZone) => 1 - clampUnitInterval(macroZone.fragility, 0)), 0.16) * 0.16),
                0
            ));
            const stabilityScore = roundValue(clampUnitInterval(
                (defenseValue * 0.38)
                + (foodValue * 0.26)
                + ((1 - candidateScore) * 0.36),
                0
            ));
            const expansionPressure = roundValue(clampUnitInterval(
                (routesValue * 0.24)
                + (coastValue * 0.16)
                + (foodValue * 0.2)
                + ((1 - stabilityScore) * 0.4),
                0
            ));

            return createStrategicCandidate({
                strategicCandidateId: `candidate_fragile_periphery_${String(index + 1).padStart(3, '0')}`,
                type: 'fragile_periphery_candidate',
                candidateScore,
                sourceContinentIds: uniqueStrings(clusterRow.continentIds || []),
                sourceRegionalSegmentIds: uniqueStrings(clusterRow.regionalSegmentIds || []),
                sourceRouteIds: routeIds,
                sourceCorridorIds: linkedCorridorRows.map((corridorRow) => normalizeString(corridorRow.corridorId, '')),
                sourceIsolatedZoneIds: isolatedZoneIds,
                sourcePeripheryClusterIds: [normalizeString(clusterRow.clusterId, '')],
                sourceArchipelagoIds: linkedArchipelagos.map((macroZone) => normalizeString(macroZone.archipelagoId, '')),
                valueMix: {
                    food: foodValue,
                    routes: routesValue,
                    defense: defenseValue,
                    coast: coastValue
                },
                stabilityScore,
                expansionPressure,
                dominantDriverIds: selectTopWeightIds([
                    { id: 'periphery_pressure', weight: clusterRow.peripheryScore },
                    { id: 'weather_isolation', weight: clusterRow.meanWeatherAdjustedIsolation },
                    { id: 'collapse_risk', weight: clusterRow.meanLossInCollapseLikelihood },
                    { id: 'autonomous_survival', weight: clusterRow.meanAutonomousSurvivalScore },
                    { id: 'archipelago_fragility', weight: linkedArchipelagoFragility }
                ], 4)
            });
        });

        const archipelagoCandidates = (context.archipelagoLookups.macroZones || []).map((macroZone, index) => {
            const fragileSignal = averageUnit([
                macroZone.fragility,
                macroZone.collapseSusceptibility,
                1 - clampUnitInterval(macroZone.connectiveValue, 0)
            ], 0);
            if (fragileSignal < 0.54) {
                return null;
            }

            const foodValue = roundValue(clampUnitInterval(
                (clampUnitInterval(macroZone.colonizationAppeal, 0) * 0.52)
                + ((1 - clampUnitInterval(macroZone.collapseSusceptibility, 0)) * 0.2)
                + ((1 - clampUnitInterval(macroZone.fragility, 0)) * 0.28),
                0
            ));
            const routesValue = roundValue(clampUnitInterval(
                (clampUnitInterval(macroZone.connectiveValue, 0) * 0.62)
                + (clampUnitInterval(normalizeInteger((macroZone.macroRouteIds || []).length, 0) / 3, 0) * 0.38),
                0
            ));
            const defenseValue = roundValue(clampUnitInterval(
                ((1 - clampUnitInterval(macroZone.fragility, 0)) * 0.42)
                + ((1 - clampUnitInterval(macroZone.collapseSusceptibility, 0)) * 0.38)
                + (clampUnitInterval(macroZone.contestScore, 0) * 0.2),
                0
            ));
            const coastValue = 0.92;
            const candidateScore = roundValue(clampUnitInterval(
                (clampUnitInterval(macroZone.fragility, 0) * 0.38)
                + (clampUnitInterval(macroZone.collapseSusceptibility, 0) * 0.34)
                + ((1 - clampUnitInterval(macroZone.connectiveValue, 0)) * 0.18)
                + ((macroZone.roleSeedHints && macroZone.roleSeedHints.primaryRoleSeed === 'fragile_outpost_chain') ? 0.1 : 0),
                0
            ));
            const stabilityScore = roundValue(clampUnitInterval(
                (defenseValue * 0.34)
                + (foodValue * 0.24)
                + ((1 - candidateScore) * 0.42),
                0
            ));
            const expansionPressure = roundValue(clampUnitInterval(
                (routesValue * 0.22)
                + (foodValue * 0.18)
                + ((1 - stabilityScore) * 0.6),
                0
            ));

            return createStrategicCandidate({
                strategicCandidateId: `candidate_fragile_archipelago_${String(index + 1).padStart(3, '0')}`,
                type: 'fragile_periphery_candidate',
                candidateScore,
                sourceSeaRegionIds: uniqueStrings(macroZone.seaRegionIds || []),
                sourceRouteIds: uniqueStrings(macroZone.macroRouteIds || []),
                sourceCorridorIds: uniqueStrings(macroZone.macroCorridorIds || []),
                sourceChokepointIds: uniqueStrings(macroZone.linkedChokepointIds || []),
                sourceIsolatedZoneIds: uniqueStrings(macroZone.linkedIsolatedZoneIds || []),
                sourcePeripheryClusterIds: uniqueStrings(macroZone.linkedPeripheryClusterIds || []),
                sourceArchipelagoIds: [normalizeString(macroZone.archipelagoId, '')],
                valueMix: {
                    food: foodValue,
                    routes: routesValue,
                    defense: defenseValue,
                    coast: coastValue
                },
                stabilityScore,
                expansionPressure,
                dominantDriverIds: selectTopWeightIds([
                    { id: 'archipelago_fragility', weight: macroZone.fragility },
                    { id: 'collapse_susceptibility', weight: macroZone.collapseSusceptibility },
                    { id: 'low_connectivity', weight: 1 - clampUnitInterval(macroZone.connectiveValue, 0) },
                    { id: 'contested_margin', weight: macroZone.contestScore }
                ], 4)
            });
        }).filter(Boolean);

        return clusterCandidates
            .concat(archipelagoCandidates)
            .filter((candidate) => candidate.candidateScore >= 0.5)
            .sort((left, right) => (
                right.candidateScore - left.candidateScore
                || left.strategicCandidateId.localeCompare(right.strategicCandidateId)
            ))
            .slice(0, 8);
    }

    function buildDisputedStrategicRegionCandidates(context = {}) {
        const chokepointCandidates = (context.chokepointLookups.chokepointRows || []).map((chokepointRow, index) => {
            const linkedArchipelagos = uniqueRecordsById(
                (context.archipelagoLookups.macroZones || []).filter((macroZone) => (
                    intersectsStringLists(macroZone.linkedChokepointIds || [], [normalizeString(chokepointRow.chokepointId, '')])
                )),
                'archipelagoId'
            );
            const routeIds = uniqueStrings(linkedArchipelagos.flatMap((macroZone) => macroZone.macroRouteIds || []));
            const corridorIds = uniqueStrings(linkedArchipelagos.flatMap((macroZone) => macroZone.macroCorridorIds || []));
            const coastValue = roundValue(clampUnitInterval(
                (normalizeString(chokepointRow.type, '') === 'narrow_strait' ? 0.92 : 0)
                + (normalizeString(chokepointRow.type, '') === 'island_chain_lock' ? 0.8 : 0)
                + (linkedArchipelagos.length > 0 ? 0.22 : 0),
                0
            ));
            const routesValue = roundValue(clampUnitInterval(
                (clampUnitInterval(chokepointRow.tradeDependency, 0) * 0.66)
                + (clampUnitInterval(routeIds.length / 3, 0) * 0.34),
                0
            ));
            const defenseValue = averageUnit([
                chokepointRow.controlValue,
                chokepointRow.bypassDifficulty
            ], 0);
            const foodValue = averageUnit(
                linkedArchipelagos.map((macroZone) => macroZone.colonizationAppeal),
                0.18
            );
            const candidateScore = roundValue(clampUnitInterval(
                (clampUnitInterval(chokepointRow.controlValue, 0) * 0.28)
                + (clampUnitInterval(chokepointRow.tradeDependency, 0) * 0.28)
                + (clampUnitInterval(chokepointRow.bypassDifficulty, 0) * 0.22)
                + (clampUnitInterval(chokepointRow.collapseSensitivity, 0) * 0.22),
                0
            ));
            const stabilityScore = roundValue(clampUnitInterval(
                (foodValue * 0.22)
                + ((1 - candidateScore) * 0.44)
                + ((1 - clampUnitInterval(chokepointRow.collapseSensitivity, 0)) * 0.34),
                0
            ));
            const expansionPressure = roundValue(clampUnitInterval(
                (routesValue * 0.34)
                + (defenseValue * 0.3)
                + (coastValue * 0.18)
                + (clampUnitInterval(chokepointRow.controlValue, 0) * 0.18),
                0
            ));

            return createStrategicCandidate({
                strategicCandidateId: `candidate_disputed_region_${String(index + 1).padStart(3, '0')}`,
                type: 'disputed_strategic_region_candidate',
                candidateScore,
                sourceSeaRegionIds: uniqueStrings(chokepointRow.adjacentRegions || []),
                sourceRouteIds: routeIds,
                sourceCorridorIds: corridorIds,
                sourceChokepointIds: [normalizeString(chokepointRow.chokepointId, '')],
                sourceArchipelagoIds: linkedArchipelagos.map((macroZone) => normalizeString(macroZone.archipelagoId, '')),
                valueMix: {
                    food: foodValue,
                    routes: routesValue,
                    defense: defenseValue,
                    coast: coastValue
                },
                stabilityScore,
                expansionPressure,
                dominantDriverIds: selectTopWeightIds([
                    { id: 'control_value', weight: chokepointRow.controlValue },
                    { id: 'trade_dependency', weight: chokepointRow.tradeDependency },
                    { id: 'bypass_difficulty', weight: chokepointRow.bypassDifficulty },
                    { id: 'collapse_sensitivity', weight: chokepointRow.collapseSensitivity },
                    { id: 'archipelago_contest', weight: averageUnit(linkedArchipelagos.map((macroZone) => macroZone.contestScore), 0) }
                ], 4)
            });
        });

        const archipelagoCandidates = (context.archipelagoLookups.macroZones || []).map((macroZone, index) => {
            if (clampUnitInterval(macroZone.contestScore, 0) < 0.58) {
                return null;
            }

            const routesValue = averageUnit([
                macroZone.connectiveValue,
                clampUnitInterval(normalizeInteger((macroZone.macroRouteIds || []).length, 0) / 3, 0)
            ], 0);
            const defenseValue = averageUnit([
                macroZone.contestScore,
                1 - clampUnitInterval(macroZone.fragility, 0)
            ], 0);
            const coastValue = 0.9;
            const foodValue = averageUnit([
                macroZone.colonizationAppeal,
                1 - clampUnitInterval(macroZone.collapseSusceptibility, 0)
            ], 0);
            const candidateScore = averageUnit([
                macroZone.contestScore,
                clampUnitInterval(macroZone.connectiveValue, 0),
                clampUnitInterval(macroZone.collapseSusceptibility, 0)
            ], 0);
            const stabilityScore = roundValue(clampUnitInterval(
                (foodValue * 0.24)
                + ((1 - clampUnitInterval(macroZone.collapseSusceptibility, 0)) * 0.34)
                + ((1 - candidateScore) * 0.42),
                0
            ));
            const expansionPressure = roundValue(clampUnitInterval(
                (routesValue * 0.28)
                + (defenseValue * 0.24)
                + (coastValue * 0.16)
                + (clampUnitInterval(macroZone.contestScore, 0) * 0.32),
                0
            ));

            return createStrategicCandidate({
                strategicCandidateId: `candidate_disputed_archipelago_${String(index + 1).padStart(3, '0')}`,
                type: 'disputed_strategic_region_candidate',
                candidateScore,
                sourceSeaRegionIds: uniqueStrings(macroZone.seaRegionIds || []),
                sourceRouteIds: uniqueStrings(macroZone.macroRouteIds || []),
                sourceCorridorIds: uniqueStrings(macroZone.macroCorridorIds || []),
                sourceChokepointIds: uniqueStrings(macroZone.linkedChokepointIds || []),
                sourceArchipelagoIds: [normalizeString(macroZone.archipelagoId, '')],
                valueMix: {
                    food: foodValue,
                    routes: routesValue,
                    defense: defenseValue,
                    coast: coastValue
                },
                stabilityScore,
                expansionPressure,
                dominantDriverIds: selectTopWeightIds([
                    { id: 'archipelago_contest', weight: macroZone.contestScore },
                    { id: 'route_connectivity', weight: macroZone.connectiveValue },
                    { id: 'collapse_susceptibility', weight: macroZone.collapseSusceptibility },
                    { id: 'linked_chokepoints', weight: clampUnitInterval((macroZone.linkedChokepointIds || []).length / 2, 0) }
                ], 4)
            });
        }).filter(Boolean);

        return chokepointCandidates
            .concat(archipelagoCandidates)
            .filter((candidate) => (
                candidate.candidateScore >= 0.54
                || candidate.expansionPressure >= 0.58
            ))
            .sort((left, right) => (
                right.candidateScore - left.candidateScore
                || left.strategicCandidateId.localeCompare(right.strategicCandidateId)
            ))
            .slice(0, 8);
    }

    function resolveStrategicWorldBounds(input = {}) {
        const candidateWorldBounds = [
            getNestedValue(findInputIntermediateOutput(input, 'continentalCohesionSummaries'), 'worldBounds'),
            getNestedValue(findInputIntermediateOutput(input, 'coastalOpportunityProfile'), 'worldBounds'),
            getNestedValue(findInputIntermediateOutput(input, 'macroRoutes'), 'worldBounds'),
            getNestedValue(findInputIntermediateOutput(input, 'chokepointRecords'), 'worldBounds'),
            getNestedValue(findInputIntermediateOutput(input, 'isolatedZones'), 'worldBounds'),
            getNestedValue(findInputIntermediateOutput(input, 'archipelagoMacroZones'), 'worldBounds'),
            input.worldBounds
        ].find((worldBounds) => isPlainObject(worldBounds));

        return normalizeWorldBounds(candidateWorldBounds || DEFAULT_WORLD_BOUNDS);
    }

    function buildStrategicRegionCandidatesOutput(input = {}, dependencyAvailability = {}) {
        const continentalCohesionSummaries = findInputIntermediateOutput(input, 'continentalCohesionSummaries') || {};
        const corePotentialAnalysis = findInputIntermediateOutput(input, 'corePotentialAnalysis') || {};
        const fracturedPeripheryAnalysis = findInputIntermediateOutput(input, 'fracturedPeripheryAnalysis') || {};
        const coastalOpportunityProfile = findInputIntermediateOutput(input, 'coastalOpportunityProfile') || {};
        const exceptionalCoastalNodes = findInputIntermediateOutput(input, 'exceptionalCoastalNodes') || {};
        const macroRoutes = findInputIntermediateOutput(input, 'macroRoutes') || {};
        const macroCorridors = findInputIntermediateOutput(input, 'macroCorridors') || {};
        const chokepointRecords = findInputIntermediateOutput(input, 'chokepointRecords') || {};
        const isolatedZones = findInputIntermediateOutput(input, 'isolatedZones') || {};
        const peripheryClusters = findInputIntermediateOutput(input, 'peripheryClusters') || {};
        const archipelagoMacroZones = findInputIntermediateOutput(input, 'archipelagoMacroZones') || {};
        const worldBounds = resolveStrategicWorldBounds(input);
        const routeContext = buildRouteContextLookups(macroRoutes, macroCorridors);
        const cohesionLookups = buildCohesionLookups(
            continentalCohesionSummaries,
            corePotentialAnalysis,
            fracturedPeripheryAnalysis
        );
        const coastalLookups = buildCoastalLookups(
            coastalOpportunityProfile,
            exceptionalCoastalNodes
        );
        const chokepointLookups = buildChokepointLookups(chokepointRecords);
        const isolationLookups = buildIsolationLookups(
            isolatedZones,
            peripheryClusters
        );
        const archipelagoLookups = buildArchipelagoLookups(archipelagoMacroZones);
        const context = {
            routeContext,
            cohesionLookups,
            coastalLookups,
            chokepointLookups,
            isolationLookups,
            archipelagoLookups
        };
        const imperialCoreCandidates = buildImperialCoreCandidates(context);
        const tradeBeltCandidates = buildTradeBeltCandidates(context);
        const fragilePeripheryCandidates = buildFragilePeripheryCandidates(context);
        const disputedStrategicRegionCandidates = buildDisputedStrategicRegionCandidates(context);
        const allCandidates = imperialCoreCandidates
            .concat(tradeBeltCandidates)
            .concat(fragilePeripheryCandidates)
            .concat(disputedStrategicRegionCandidates);

        return {
            outputId: STRATEGIC_REGION_CANDIDATES_OUTPUT_ID,
            stageId: CANDIDATE_STAGE_ID,
            modelId: CANDIDATE_MODEL_ID,
            deterministic: true,
            seedNamespace: 'macro.strategicRegions.candidateSynthesis',
            worldBounds: cloneValue(worldBounds),
            sourceOutputIds: uniqueStrings([
                normalizeString(continentalCohesionSummaries.outputId, ''),
                normalizeString(corePotentialAnalysis.outputId, ''),
                normalizeString(fracturedPeripheryAnalysis.outputId, ''),
                normalizeString(coastalOpportunityProfile.outputId, ''),
                normalizeString(exceptionalCoastalNodes.outputId, ''),
                normalizeString(macroRoutes.outputId, ''),
                normalizeString(macroCorridors.outputId, ''),
                normalizeString(chokepointRecords.chokepointRecordOutputId, ''),
                normalizeString(isolatedZones.outputId, ''),
                normalizeString(peripheryClusters.outputId, ''),
                normalizeString(archipelagoMacroZones.outputId, '')
            ]),
            dependencyAvailability: cloneValue(dependencyAvailability),
            imperialCoreCandidates,
            tradeBeltCandidates,
            fragilePeripheryCandidates,
            disputedStrategicRegionCandidates,
            summary: {
                imperialCoreCandidateCount: imperialCoreCandidates.length,
                tradeBeltCandidateCount: tradeBeltCandidates.length,
                fragilePeripheryCandidateCount: fragilePeripheryCandidates.length,
                disputedStrategicRegionCandidateCount: disputedStrategicRegionCandidates.length,
                totalCandidateCount: allCandidates.length,
                strongestImperialCoreCandidateId: normalizeString(getNestedValue(imperialCoreCandidates[0], 'strategicCandidateId', ''), ''),
                strongestTradeBeltCandidateId: normalizeString(getNestedValue(tradeBeltCandidates[0], 'strategicCandidateId', ''), ''),
                strongestFragilePeripheryCandidateId: normalizeString(getNestedValue(fragilePeripheryCandidates[0], 'strategicCandidateId', ''), ''),
                strongestDisputedRegionCandidateId: normalizeString(getNestedValue(disputedStrategicRegionCandidates[0], 'strategicCandidateId', ''), ''),
                strategicRegionRecordOutputGenerated: false,
                validationRebalancePerformed: false
            },
            compatibility: {
                futureStrategicRegionRecordInput: true,
                validationRebalanceOutput: false,
                packageAssemblyOutput: false,
                gameplaySemanticsOutput: false,
                sameWorldBoundsRequired: true
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        };
    }

    function getStrategicRegionSynthesizerDescriptor() {
        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            phaseVersion: PHASE_VERSION,
            description: 'Partial StrategicRegionSynthesizer with implemented imperial-core, trade-belt, fragile-periphery, and disputed-region candidate synthesis over cohesion, coastal, route, choke, isolation, and archipelago context.',
            currentOutputs: [STRATEGIC_REGION_CANDIDATES_OUTPUT_ID],
            deferredOutputs: INTENTIONALLY_ABSENT.slice()
        });
    }

    function getStrategicRegionInputContract() {
        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            requiredKeys: REQUIRED_KEYS.slice(),
            optionalKeys: OPTIONAL_KEYS.slice(),
            inputGroups: cloneValue(INPUT_GROUPS),
            description: 'Partial StrategicRegionSynthesizer input contract. The runtime currently expects cohesion, coastal-opportunity, route/corridor, official chokepoint, isolation/periphery, and archipelago-significance context to assemble four groups of strategic-region candidates only.'
        });
    }

    function getStrategicRegionOutputContract() {
        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            actualOutputs: {
                fields: [],
                intermediateOutputs: [STRATEGIC_REGION_CANDIDATES_OUTPUT_ID],
                records: [],
                debugArtifacts: []
            },
            plannedOutputs: [],
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice(),
            description: 'Partial StrategicRegionSynthesizer output contract. The runtime emits four groups of strategic-region candidates with `StrategicRegionRecord`-aligned draft hints, while final records, validation/rebalance, and package assembly remain deferred.'
        });
    }

    function synthesizeStrategicRegions(input = {}) {
        const dependencyAvailability = describeStrategicRegionDependencyAvailability(input);
        const strategicRegionCandidates = buildStrategicRegionCandidatesOutput(
            input,
            dependencyAvailability
        );

        return {
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            phaseVersion: PHASE_VERSION,
            status: STATUS,
            deterministic: true,
            seedNamespace: 'macro.strategicRegions',
            seed: typeof macro.normalizeSeed === 'function'
                ? macro.normalizeSeed(input.macroSeed)
                : normalizeInteger(input.macroSeed, 0),
            worldBounds: cloneValue(strategicRegionCandidates.worldBounds),
            dependencyAvailability,
            outputs: {
                fields: {},
                intermediateOutputs: {
                    strategicRegionCandidates
                },
                records: {},
                debugArtifacts: {}
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice(),
            notes: [
                'StrategicRegionSynthesizer currently emits only four groups of structural candidate regions: imperial cores, trade belts, fragile peripheries, and disputed strategic regions.',
                'The runtime stays deterministic and uses already-materialized cohesion, coastal, connectivity, chokepoint, isolation, and archipelago outputs as synthesis context.',
                'Each candidate carries `StrategicRegionRecord`-aligned draft hints, but final record export, validation/rebalance, and package assembly remain intentionally deferred.'
            ],
            description: 'Partial strategic-region synthesis runtime with four implemented candidate groups and no validation/rebalance.'
        };
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule(MODULE_ID, {
            entry: 'synthesizeStrategicRegions',
            file: 'js/worldgen/macro/strategic-region-synthesizer.js',
            description: 'Partial StrategicRegionSynthesizer with implemented imperial-core, trade-belt, fragile-periphery, and disputed-region candidate synthesis.',
            stub: false,
            scaffold: false
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep(PIPELINE_STEP_ID, {
            moduleId: MODULE_ID,
            file: 'js/worldgen/macro/strategic-region-synthesizer.js',
            entry: 'synthesizeStrategicRegions',
            description: 'Partial strategic-region synthesis step; candidate groups are implemented while validation/rebalance and final record export remain deferred.',
            stub: false,
            scaffold: false
        });
    }

    Object.assign(macro, {
        getStrategicRegionSynthesizerDescriptor,
        getStrategicRegionInputContract,
        getStrategicRegionOutputContract,
        describeStrategicRegionDependencyAvailability,
        synthesizeStrategicRegions
    });
})();
