(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const MODULE_ID = 'chokepointAnalyzer';
    const PIPELINE_STEP_ID = 'chokepoints';
    const STATUS = 'PARTIAL_IMPLEMENTED';
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';
    const ANALYSIS_PLAN_OUTPUT_ID = 'chokepointAnalysisPlan';
    const STRAIT_CANDIDATES_OUTPUT_ID = 'straitChokepointCandidates';
    const STRAIT_DETECTION_STAGE_ID = 'straitDetection';
    const STRAIT_DETECTION_MODEL_ID = 'deterministicNarrowStraitChokepointDetectorV1';
    const ISLAND_CHAIN_CANDIDATES_OUTPUT_ID = 'islandChainChokepointCandidates';
    const ISLAND_CHAIN_DETECTION_STAGE_ID = 'islandChainLockDetection';
    const ISLAND_CHAIN_DETECTION_MODEL_ID = 'deterministicIslandChainLockDetectorV1';
    const INLAND_BOTTLENECK_CANDIDATES_OUTPUT_ID = 'inlandBottleneckChokepointCandidates';
    const INLAND_BOTTLENECK_DETECTION_STAGE_ID = 'inlandBottleneckDetection';
    const INLAND_BOTTLENECK_DETECTION_MODEL_ID = 'deterministicInlandBottleneckDetectorV1';
    const CHOKEPOINT_RECORDS_OUTPUT_ID = 'chokepointRecords';
    const CHOKEPOINT_RECORD_STAGE_ID = 'chokepointRecordSynthesis';
    const CHOKEPOINT_RECORD_MODEL_ID = 'deterministicChokepointCandidateToRecordV1';
    const REQUIRED_KEYS = Object.freeze([
        'macroSeed'
    ]);
    const OPTIONAL_KEYS = Object.freeze([
        'macroSeedProfile',
        'phase1Constraints',
        'worldBounds',
        'marineCarving',
        'connectivityGraph',
        'continentalCohesion',
        'fields',
        'intermediateOutputs',
        'records',
        'debugOptions'
    ]);
    const INPUT_GROUPS = Object.freeze({
        straitSignals: Object.freeze([
            {
                dependencyId: 'straitCarvingSummary',
                sourceGroup: 'marineCarving.outputs.intermediateOutputs',
                required: false,
                role: 'future narrow-strait choke hints and basin-connection morphology'
            },
            {
                dependencyId: 'seaConnectivityGraph',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: false,
                role: 'future marine-basin graph context for strait-side chokepoint candidates'
            },
            {
                dependencyId: 'routeCostSurface',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: false,
                role: 'future route-pressure context for strait control and bypass pressure'
            }
        ]),
        islandChainSignals: Object.freeze([
            {
                dependencyId: 'archipelagoFragmentationSummary',
                sourceGroup: 'marineCarving.outputs.intermediateOutputs',
                required: false,
                role: 'future island-chain morphology and break-run hints'
            },
            {
                dependencyId: 'macroCorridors',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: false,
                role: 'future route-backed corridor support for island-chain chokepoint passes'
            },
            {
                dependencyId: 'seaConnectivityGraph',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: false,
                role: 'future marine-side attachment graph for island-chain passages'
            }
        ]),
        inlandBottleneckSignals: Object.freeze([
            {
                dependencyId: 'regionalSegmentationAnalysis',
                sourceGroup: 'continentalCohesion.outputs.intermediateOutputs',
                required: false,
                role: 'future inland region-block geometry for bottleneck candidates'
            },
            {
                dependencyId: 'landConnectivityGraph',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: false,
                role: 'future land-graph structure for inland bottleneck support'
            },
            {
                dependencyId: 'macroRoutes',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: false,
                role: 'future sampled-route dependence context for inland bottlenecks'
            },
            {
                dependencyId: 'macroCorridors',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: false,
                role: 'future corridor concentration context for inland bottleneck passes'
            }
        ]),
        routeDependence: Object.freeze([
            {
                dependencyId: 'hybridConnectivityGraph',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: false,
                role: 'future unified land-sea graph context for cross-family choke detection'
            },
            {
                dependencyId: 'routeCostSurface',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: false,
                role: 'future route-cost context for choke weighting and bypass difficulty'
            },
            {
                dependencyId: 'macroRoutes',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: false,
                role: 'future route dependence and route-through evidence for chokepoint scoring'
            },
            {
                dependencyId: 'macroCorridors',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: false,
                role: 'future corridor dependence and brittleness hints for chokepoint passes'
            }
        ])
    });
    const PASS_SLOTS = Object.freeze([
        {
            passId: 'straitChokepoints',
            detectorFamily: 'strait',
            plannedOutputId: STRAIT_CANDIDATES_OUTPUT_ID,
            dependencyGroupIds: ['straitSignals', 'routeDependence'],
            status: 'implemented'
        },
        {
            passId: 'islandChainChokepoints',
            detectorFamily: 'island_chain',
            plannedOutputId: ISLAND_CHAIN_CANDIDATES_OUTPUT_ID,
            dependencyGroupIds: ['islandChainSignals', 'routeDependence'],
            status: 'implemented'
        },
        {
            passId: 'inlandBottleneckChokepoints',
            detectorFamily: 'inland_bottleneck',
            plannedOutputId: INLAND_BOTTLENECK_CANDIDATES_OUTPUT_ID,
            dependencyGroupIds: ['inlandBottleneckSignals', 'routeDependence'],
            status: 'implemented'
        }
    ]);
    const INTENTIONALLY_ABSENT = Object.freeze([
        'chokepointPressureField',
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

    function findInputIntermediateOutput(input = {}, outputId = '') {
        const candidateGroups = [
            input.intermediateOutputs,
            getNestedValue(input, 'outputs.intermediateOutputs'),
            getNestedValue(input, 'marineCarving.intermediateOutputs'),
            getNestedValue(input, 'marineCarving.outputs.intermediateOutputs'),
            getNestedValue(input, 'connectivityGraph.intermediateOutputs'),
            getNestedValue(input, 'connectivityGraph.outputs.intermediateOutputs'),
            getNestedValue(input, 'continentalCohesion.intermediateOutputs'),
            getNestedValue(input, 'continentalCohesion.outputs.intermediateOutputs')
        ];

        return candidateGroups
            .map((group) => findDependencyValue(group, outputId))
            .find(Boolean) || null;
    }

    function buildLookupById(items = [], key = '') {
        const normalizedItems = Array.isArray(items) ? items : [];
        return new Map(normalizedItems
            .map((item) => [normalizeString(item && item[key], ''), item])
            .filter(([itemId]) => itemId));
    }

    function buildDependencyGroupStatus(input = {}, groupId = '', dependencies = []) {
        const dependencyRows = dependencies.map((dependency) => {
            const resolvedValue = findInputIntermediateOutput(input, dependency.dependencyId);
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

    function describeChokepointDependencyAvailability(input = {}) {
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

    function computeChokepointClassificationScore(
        controlValue = 0,
        tradeDependency = 0,
        bypassDifficulty = 0,
        collapseSensitivity = 0
    ) {
        return clampUnitInterval(
            (clampUnitInterval(controlValue, 0) * 0.24)
            + (clampUnitInterval(tradeDependency, 0) * 0.22)
            + (clampUnitInterval(bypassDifficulty, 0) * 0.24)
            + (clampUnitInterval(collapseSensitivity, 0) * 0.3),
            0
        );
    }

    function classifyStraitCandidateClass(
        controlValue = 0,
        tradeDependency = 0,
        bypassDifficulty = 0,
        collapseSensitivity = 0
    ) {
        const compositeScore = computeChokepointClassificationScore(
            controlValue,
            tradeDependency,
            bypassDifficulty,
            collapseSensitivity
        );

        if (compositeScore >= 0.74) {
            return 'primary_strait_chokepoint';
        }
        if (compositeScore >= 0.56) {
            return 'strong_strait_chokepoint';
        }
        if (compositeScore >= 0.38) {
            return 'emergent_strait_chokepoint';
        }
        return 'weak_strait_chokepoint';
    }

    function buildSeaGraphContext(seaConnectivityGraph = {}) {
        const nodes = Array.isArray(seaConnectivityGraph && seaConnectivityGraph.nodes)
            ? seaConnectivityGraph.nodes.filter((node) => normalizeString(node.nodeType, '') === 'marine_region')
            : [];
        const edges = Array.isArray(seaConnectivityGraph && seaConnectivityGraph.edges)
            ? seaConnectivityGraph.edges.filter((edge) => normalizeString(edge.edgeType, '') === 'interbasin_link')
            : [];

        return {
            nodes,
            nodeLookup: buildLookupById(nodes, 'nodeId'),
            edges
        };
    }

    function selectPreferredSeaNodeForBasinKind(seaNodes = [], basinKind = '', excludedNodeIds = new Set()) {
        const normalizedBasinKind = normalizeString(basinKind, '');
        const candidates = seaNodes.filter((node) => (
            normalizeString(node.basinKind, '') === normalizedBasinKind
            && !excludedNodeIds.has(normalizeString(node.nodeId, ''))
        ));
        const scoredCandidates = candidates.map((node) => {
            const preference = normalizedBasinKind === 'open_ocean'
                ? (
                    (clampUnitInterval(node.openWaterBias, 0) * 0.44)
                    + (clampUnitInterval(node.navigability, 0.5) * 0.34)
                    + (clampUnitInterval(node.normalizedArea, 0) * 0.22)
                )
                : (
                    (clampUnitInterval(node.constrainedWaterBias, 0) * 0.32)
                    + (clampUnitInterval(node.enclosureScore, 0) * 0.24)
                    + (clampUnitInterval(node.navigability, 0.5) * 0.24)
                    + (clampUnitInterval(node.normalizedArea, 0) * 0.2)
                );

            return {
                node,
                preference: roundValue(preference)
            };
        });

        scoredCandidates.sort((left, right) => {
            if (right.preference !== left.preference) {
                return right.preference - left.preference;
            }
            return normalizeString(left.node.nodeId, '').localeCompare(normalizeString(right.node.nodeId, ''));
        });

        return scoredCandidates.length > 0 ? scoredCandidates[0].node : null;
    }

    function resolveStraitSeaGraphMatches(straitPassage = {}, seaGraphContext = {}) {
        const connectedBasinKinds = Array.isArray(straitPassage && straitPassage.connectedBasinKinds)
            ? straitPassage.connectedBasinKinds.map((basinKind) => normalizeString(basinKind, ''))
            : [];
        const usedNodeIds = new Set();
        const matchedNodes = connectedBasinKinds.map((basinKind) => {
            const matchedNode = selectPreferredSeaNodeForBasinKind(seaGraphContext.nodes, basinKind, usedNodeIds);
            if (matchedNode) {
                usedNodeIds.add(normalizeString(matchedNode.nodeId, ''));
            }
            return matchedNode;
        }).filter(Boolean);
        const matchedNodeIds = uniqueStrings(matchedNodes.map((node) => node.nodeId));
        const matchedSeaRegionIds = uniqueStrings(matchedNodes.map((node) => node.seaRegionId));
        const supportingSeaEdges = seaGraphContext.edges.filter((edge) => {
            const fromNodeId = normalizeString(edge.fromNodeId, '');
            const toNodeId = normalizeString(edge.toNodeId, '');
            return matchedNodeIds.includes(fromNodeId) && matchedNodeIds.includes(toNodeId);
        });
        const constrainedWaterSupport = matchedNodes.length > 0
            ? matchedNodes.reduce((sum, node) => sum + clampUnitInterval(node.constrainedWaterBias, 0), 0) / matchedNodes.length
            : 0;
        const openWaterSupport = matchedNodes.length > 0
            ? matchedNodes.reduce((sum, node) => sum + clampUnitInterval(node.openWaterBias, 0), 0) / matchedNodes.length
            : 0;
        const marineAttachmentSupport = matchedNodes.length === 0
            ? 0
            : matchedNodes.length === 1
                ? 0.42
                : supportingSeaEdges.length > 0
                    ? 1
                    : 0.68;

        return {
            matchedNodes,
            matchedNodeIds,
            matchedSeaRegionIds,
            matchedSeaRegionClusterIds: uniqueStrings(matchedNodes.map((node) => node.seaRegionClusterId)),
            supportingSeaEdgeIds: uniqueStrings(supportingSeaEdges.map((edge) => edge.edgeId)),
            supportingSeaEdgeCount: supportingSeaEdges.length,
            constrainedWaterSupport: roundValue(constrainedWaterSupport),
            openWaterSupport: roundValue(openWaterSupport),
            marineAttachmentSupport: roundValue(marineAttachmentSupport),
            seaGraphMatchMode: matchedNodes.length > 0 ? 'basin_kind_heuristic' : 'unmatched'
        };
    }

    function buildStraitRecordDraft(candidateIndex = 0, straitPassage = {}, seaGraphMatch = {}) {
        const normalizedWidthCells = Math.max(1, normalizeInteger(straitPassage.widthCells, 1));
        const passageNarrowness = roundValue(clampUnitInterval(
            1 - ((normalizedWidthCells - 1) / 4),
            0
        ));
        const structuralSupport = roundValue(clampUnitInterval(
            (clampUnitInterval(straitPassage.structuralSupport, 0) * 0.34)
            + (clampUnitInterval(straitPassage.wallSupport, 0) * 0.18)
            + (clampUnitInterval(straitPassage.fractureSupport, 0) * 0.14)
            + (clampUnitInterval(straitPassage.pressureWeakness, 0) * 0.1)
            + (clampUnitInterval(straitPassage.basinSupport, 0) * 0.12)
            + (clampUnitInterval(straitPassage.connectionDepth, 0) * 0.12),
            0
        ));
        const basinSeparationSupport = roundValue(
            uniqueStrings(straitPassage.connectedBasinIds).length >= 2 ? 1 : 0.5
        );
        const controlValue = roundValue(clampUnitInterval(
            (passageNarrowness * 0.42)
            + (structuralSupport * 0.34)
            + (basinSeparationSupport * 0.12)
            + (clampUnitInterval(seaGraphMatch.marineAttachmentSupport, 0) * 0.12),
            0
        ));
        const tradeDependency = roundValue(clampUnitInterval(
            (clampUnitInterval(seaGraphMatch.marineAttachmentSupport, 0) * 0.38)
            + (clampUnitInterval(straitPassage.connectionDepth, 0) * 0.22)
            + (passageNarrowness * 0.2)
            + (basinSeparationSupport * 0.2),
            0
        ));
        const bypassDifficulty = roundValue(clampUnitInterval(
            (passageNarrowness * 0.38)
            + (structuralSupport * 0.2)
            + (clampUnitInterval(seaGraphMatch.constrainedWaterSupport, 0) * 0.24)
            + (clampUnitInterval(straitPassage.connectionDepth, 0) * 0.18),
            0
        ));
        const collapseSensitivity = roundValue(clampUnitInterval(
            (controlValue * 0.34)
            + (tradeDependency * 0.32)
            + (bypassDifficulty * 0.34),
            0
        ));
        const adjacentRegions = uniqueStrings(
            seaGraphMatch.matchedSeaRegionIds.length > 0
                ? seaGraphMatch.matchedSeaRegionIds
                : (Array.isArray(straitPassage.connectedBasinIds) ? straitPassage.connectedBasinIds : [])
        );
        const recordInput = {
            chokepointId: `chk_strait_${String(candidateIndex + 1).padStart(3, '0')}`,
            type: 'narrow_strait',
            controlValue,
            tradeDependency,
            bypassDifficulty,
            collapseSensitivity,
            adjacentRegions
        };

        return {
            passageNarrowness,
            structuralSupport,
            basinSeparationSupport,
            controlValue,
            tradeDependency,
            bypassDifficulty,
            collapseSensitivity,
            recordDraft: typeof macro.createChokepointRecordSkeleton === 'function'
                ? macro.createChokepointRecordSkeleton(recordInput)
                : recordInput
        };
    }

    function buildStraitChokepointCandidates(input = {}, dependencyAvailability = {}) {
        const straitCarvingSummary = findInputIntermediateOutput(input, 'straitCarvingSummary');
        const seaConnectivityGraph = findInputIntermediateOutput(input, 'seaConnectivityGraph');
        const straitPassages = Array.isArray(straitCarvingSummary && straitCarvingSummary.straitPassages)
            ? straitCarvingSummary.straitPassages
            : [];
        const seaGraphContext = buildSeaGraphContext(seaConnectivityGraph);
        const candidates = straitPassages.map((straitPassage, candidateIndex) => {
            const seaGraphMatch = resolveStraitSeaGraphMatches(straitPassage, seaGraphContext);
            const recordDraftBundle = buildStraitRecordDraft(candidateIndex, straitPassage, seaGraphMatch);
            const chokepointClass = classifyStraitCandidateClass(
                recordDraftBundle.controlValue,
                recordDraftBundle.tradeDependency,
                recordDraftBundle.bypassDifficulty,
                recordDraftBundle.collapseSensitivity
            );

            return {
                candidateId: `strait_chokepoint_candidate_${String(candidateIndex + 1).padStart(3, '0')}`,
                sourceStraitPassageId: normalizeString(straitPassage.straitPassageId, ''),
                chokepointType: 'narrow_strait',
                chokepointClass,
                cellIndex: normalizeInteger(straitPassage.cellIndex, -1),
                x: normalizeInteger(straitPassage.x, -1),
                y: normalizeInteger(straitPassage.y, -1),
                orientation: normalizeString(straitPassage.orientation, ''),
                widthCells: Math.max(1, normalizeInteger(straitPassage.widthCells, 1)),
                connectedBasinIds: uniqueStrings(straitPassage.connectedBasinIds),
                connectedBasinKinds: uniqueStrings(straitPassage.connectedBasinKinds),
                matchedSeaRegionClusterIds: seaGraphMatch.matchedSeaRegionClusterIds.slice(),
                matchedSeaRegionIds: seaGraphMatch.matchedSeaRegionIds.slice(),
                matchedSeaNodeIds: seaGraphMatch.matchedNodeIds.slice(),
                supportingSeaEdgeIds: seaGraphMatch.supportingSeaEdgeIds.slice(),
                supportingSeaEdgeCount: seaGraphMatch.supportingSeaEdgeCount,
                seaGraphMatchMode: seaGraphMatch.seaGraphMatchMode,
                seaGraphMatchConfidence: roundValue(clampUnitInterval(
                    (clampUnitInterval(seaGraphMatch.marineAttachmentSupport, 0) * 0.7)
                    + (Math.min(1, seaGraphMatch.supportingSeaEdgeCount) * 0.3),
                    0
                )),
                score: roundValue(clampUnitInterval(straitPassage.score, 0)),
                wallSupport: roundValue(clampUnitInterval(straitPassage.wallSupport, 0)),
                fractureSupport: roundValue(clampUnitInterval(straitPassage.fractureSupport, 0)),
                pressureWeakness: roundValue(clampUnitInterval(straitPassage.pressureWeakness, 0)),
                basinSupport: roundValue(clampUnitInterval(straitPassage.basinSupport, 0)),
                structuralSupport: recordDraftBundle.structuralSupport,
                passageNarrowness: recordDraftBundle.passageNarrowness,
                basinSeparationSupport: recordDraftBundle.basinSeparationSupport,
                marineAttachmentSupport: seaGraphMatch.marineAttachmentSupport,
                constrainedWaterSupport: seaGraphMatch.constrainedWaterSupport,
                openWaterSupport: seaGraphMatch.openWaterSupport,
                controlValue: recordDraftBundle.controlValue,
                tradeDependency: recordDraftBundle.tradeDependency,
                bypassDifficulty: recordDraftBundle.bypassDifficulty,
                collapseSensitivity: recordDraftBundle.collapseSensitivity,
                adjacentRegions: recordDraftBundle.recordDraft.adjacentRegions.slice(),
                recordDraft: cloneValue(recordDraftBundle.recordDraft),
                futureChokepointRecordInput: true
            };
        });

        return {
            outputId: STRAIT_CANDIDATES_OUTPUT_ID,
            stageId: STRAIT_DETECTION_STAGE_ID,
            modelId: STRAIT_DETECTION_MODEL_ID,
            deterministic: true,
            seedNamespace: 'macro.chokepoints.straitDetection',
            sourceOutputIds: [
                normalizeString(straitCarvingSummary && straitCarvingSummary.straitCarvingId, ''),
                normalizeString(seaConnectivityGraph && seaConnectivityGraph.outputId, '')
            ].filter(Boolean),
            dependencyAvailability: cloneValue(
                Array.isArray(dependencyAvailability && dependencyAvailability.groups)
                    ? dependencyAvailability.groups.filter((group) => group.groupId === 'straitSignals')
                    : []
            ),
            candidates,
            summary: {
                straitPassageHintCount: straitPassages.length,
                straitChokepointCandidateCount: candidates.length,
                linkedSeaGraphCandidateCount: candidates.filter((candidate) => candidate.matchedSeaNodeIds.length > 0).length,
                edgeBackedCandidateCount: candidates.filter((candidate) => candidate.supportingSeaEdgeCount > 0).length,
                strongestControlValue: candidates.reduce((maxValue, candidate) => Math.max(maxValue, clampUnitInterval(candidate.controlValue, 0)), 0),
                strongestTradeDependency: candidates.reduce((maxValue, candidate) => Math.max(maxValue, clampUnitInterval(candidate.tradeDependency, 0)), 0),
                strongestBypassDifficulty: candidates.reduce((maxValue, candidate) => Math.max(maxValue, clampUnitInterval(candidate.bypassDifficulty, 0)), 0),
                strongestCollapseSensitivity: candidates.reduce((maxValue, candidate) => Math.max(maxValue, clampUnitInterval(candidate.collapseSensitivity, 0)), 0),
                detectionPerformed: true,
                chokeMetricsComputed: true,
                valueMeaning: 'deterministic narrow-strait chokepoint candidates built from strait-carving passages plus coarse sea-graph context, with full choke metrics and final family classification'
            },
            compatibility: {
                futureChokepointRecordInput: true,
                futureRouteGraphInput: true,
                futureStrategicLayerInput: true,
                sameWorldBoundsRequired: true
            },
            intentionallyAbsent: [
                'islandChainChokepointCandidates',
                'inlandBottleneckChokepointCandidates',
                'chokepointRecords',
                'gameplaySemantics'
            ]
        };
    }

    function classifyIslandChainLockClass(
        controlValue = 0,
        tradeDependency = 0,
        bypassDifficulty = 0,
        collapseSensitivity = 0
    ) {
        const normalizedScore = computeChokepointClassificationScore(
            controlValue,
            tradeDependency,
            bypassDifficulty,
            collapseSensitivity
        );

        if (normalizedScore >= 0.72) {
            return 'primary_island_chain_lock';
        }
        if (normalizedScore >= 0.54) {
            return 'strong_island_chain_lock';
        }
        if (normalizedScore >= 0.36) {
            return 'emergent_island_chain_lock';
        }
        return 'weak_island_chain_lock';
    }

    function resolveIslandChainSeaGraphMatches(fragmentationRun = {}, seaGraphContext = {}) {
        const flankingBasinKinds = Array.isArray(fragmentationRun && fragmentationRun.flankingBasinKinds)
            ? fragmentationRun.flankingBasinKinds.map((basinKind) => normalizeString(basinKind, ''))
            : [];
        const usedNodeIds = new Set();
        const matchedNodes = flankingBasinKinds.map((basinKind) => {
            const matchedNode = selectPreferredSeaNodeForBasinKind(seaGraphContext.nodes, basinKind, usedNodeIds);
            if (matchedNode) {
                usedNodeIds.add(normalizeString(matchedNode.nodeId, ''));
            }
            return matchedNode;
        }).filter(Boolean);
        const matchedNodeIds = uniqueStrings(matchedNodes.map((node) => node.nodeId));
        const matchedSeaRegionIds = uniqueStrings(matchedNodes.map((node) => node.seaRegionId));
        const supportingSeaEdges = seaGraphContext.edges.filter((edge) => {
            const fromNodeId = normalizeString(edge.fromNodeId, '');
            const toNodeId = normalizeString(edge.toNodeId, '');
            return matchedNodeIds.includes(fromNodeId) && matchedNodeIds.includes(toNodeId);
        });
        const constrainedWaterSupport = matchedNodes.length > 0
            ? matchedNodes.reduce((sum, node) => sum + clampUnitInterval(node.constrainedWaterBias, 0), 0) / matchedNodes.length
            : 0;
        const openWaterSupport = matchedNodes.length > 0
            ? matchedNodes.reduce((sum, node) => sum + clampUnitInterval(node.openWaterBias, 0), 0) / matchedNodes.length
            : 0;
        const marineAttachmentSupport = matchedNodes.length === 0
            ? 0
            : matchedNodes.length === 1
                ? 0.38
                : supportingSeaEdges.length > 0
                    ? 1
                    : 0.64;

        return {
            matchedNodes,
            matchedNodeIds,
            matchedSeaRegionIds,
            matchedSeaRegionClusterIds: uniqueStrings(matchedNodes.map((node) => node.seaRegionClusterId)),
            supportingSeaEdgeIds: uniqueStrings(supportingSeaEdges.map((edge) => edge.edgeId)),
            supportingSeaEdgeCount: supportingSeaEdges.length,
            constrainedWaterSupport: roundValue(constrainedWaterSupport),
            openWaterSupport: roundValue(openWaterSupport),
            marineAttachmentSupport: roundValue(marineAttachmentSupport),
            seaGraphMatchMode: matchedNodes.length > 0 ? 'basin_kind_heuristic' : 'unmatched'
        };
    }

    function buildIslandChainRouteSupport(macroRoutes = {}, macroCorridors = {}) {
        const candidateRoutes = Array.isArray(macroRoutes && macroRoutes.candidateRoutes)
            ? macroRoutes.candidateRoutes
            : [];
        const corridorRows = Array.isArray(macroCorridors && macroCorridors.macroCorridors)
            ? macroCorridors.macroCorridors
            : [];
        const marineRoutes = candidateRoutes.filter((route) => (
            normalizeString(route.routeMode, '') !== 'land_only'
            && (normalizeInteger(route.seaEdgeCount, 0) > 0 || normalizeInteger(route.transitionEdgeCount, 0) > 0)
        ));
        const marineCorridors = corridorRows.filter((corridor) => (
            normalizeString(corridor.routeMode, '') !== 'land_only'
            && (normalizeInteger(corridor.seaEdgeCount, 0) > 0 || normalizeInteger(corridor.transitionEdgeCount, 0) > 0)
        ));
        const marineCorridorSupportScore = marineCorridors.length > 0
            ? computeMean(marineCorridors.map((corridor) => clampUnitInterval(corridor.supportScore, 0)))
            : 0;
        const marineRouteSupportScore = candidateRoutes.length > 0
            ? marineRoutes.length / candidateRoutes.length
            : 0;
        const marineCorridorStrengthClass = marineCorridors.length > 0
            ? normalizeString(marineCorridors
                .slice()
                .sort((left, right) => (
                    clampUnitInterval(right.supportScore, 0) - clampUnitInterval(left.supportScore, 0)
                    || normalizeString(left.corridorId, '').localeCompare(normalizeString(right.corridorId, ''))
                ))[0].corridorStrengthClass, '')
            : '';

        return {
            marineRouteSupportCount: marineRoutes.length,
            marineCorridorSupportCount: marineCorridors.length,
            marineRouteSupportScore: roundValue(clampUnitInterval(marineRouteSupportScore, 0)),
            marineCorridorSupportScore: roundValue(clampUnitInterval(marineCorridorSupportScore, 0)),
            marineCorridorStrengthClass,
            marineMeanRouteCost: roundValue(computeMean(marineRoutes.map((route) => clampUnitInterval(route.meanEdgeRouteCost, 0)))),
            marinePeakRouteCost: roundValue(Math.max(
                marineRoutes.reduce((maxValue, route) => Math.max(maxValue, clampUnitInterval(route.peakEdgeRouteCost, 0)), 0),
                marineCorridors.reduce((maxValue, corridor) => Math.max(maxValue, clampUnitInterval(corridor.peakEdgeRouteCost, 0)), 0)
            )),
            marineRouteDependenceScore: roundValue(computeMean(marineCorridors.map((corridor) => clampUnitInterval(corridor.routeDependenceScore, 0)))),
            marineAlternativeSupportScore: roundValue(computeMean(marineCorridors.map((corridor) => clampUnitInterval(corridor.alternativeSupportScore, 0)))),
            marineStructureFragilityScore: roundValue(computeMean(marineCorridors.map((corridor) => clampUnitInterval(corridor.structureFragilityScore, 0)))),
            marineMandatoryCorridorRatio: roundValue(
                marineCorridors.length > 0
                    ? marineCorridors.filter((corridor) => corridor.mandatoryCorridor).length / marineCorridors.length
                    : 0
            ),
            marineBrittleCorridorRatio: roundValue(
                marineCorridors.length > 0
                    ? marineCorridors.filter((corridor) => corridor.brittleCorridor).length / marineCorridors.length
                    : 0
            ),
            marineCorridorIds: uniqueStrings(marineCorridors.map((corridor) => corridor.corridorId)),
            marineRouteIds: uniqueStrings(marineRoutes.map((route) => route.routeId))
        };
    }

    function buildIslandChainChokepointCandidates(input = {}, dependencyAvailability = {}) {
        const archipelagoFragmentationSummary = findInputIntermediateOutput(input, 'archipelagoFragmentationSummary');
        const seaConnectivityGraph = findInputIntermediateOutput(input, 'seaConnectivityGraph');
        const macroRoutes = findInputIntermediateOutput(input, 'macroRoutes');
        const macroCorridors = findInputIntermediateOutput(input, 'macroCorridors');
        const fragmentationRuns = Array.isArray(archipelagoFragmentationSummary && archipelagoFragmentationSummary.fragmentationRuns)
            ? archipelagoFragmentationSummary.fragmentationRuns
            : [];
        const seaGraphContext = buildSeaGraphContext(seaConnectivityGraph);
        const routeSupportContext = buildIslandChainRouteSupport(macroRoutes, macroCorridors);

        const candidates = fragmentationRuns.map((fragmentationRun, candidateIndex) => {
            const seaGraphMatch = resolveIslandChainSeaGraphMatches(fragmentationRun, seaGraphContext);
            const normalizedCandidateCellCount = Math.max(1, normalizeInteger(fragmentationRun.candidateCellCount, 1));
            const projectedIslandSegmentCount = Math.max(1, normalizeInteger(fragmentationRun.projectedIslandSegmentCount, 1));
            const fragmentationSpanSupport = roundValue(clampUnitInterval(
                (normalizedCandidateCellCount - 1) / 5,
                0
            ));
            const islandSegmentLockSupport = roundValue(clampUnitInterval(
                (projectedIslandSegmentCount - 1) / 4,
                0
            ));
            const basinSeparationSupport = roundValue(
                uniqueStrings(fragmentationRun.flankingBasinIds).length >= 2 ? 1 : 0.5
            );
            const morphologyLockSupport = roundValue(clampUnitInterval(
                (clampUnitInterval(fragmentationRun.averageScore, 0) * 0.18)
                + (clampUnitInterval(fragmentationRun.strongestScore, 0) * 0.18)
                + (clampUnitInterval(fragmentationRun.openWaterExposure, 0) * 0.14)
                + (clampUnitInterval(fragmentationRun.fractureSupport, 0) * 0.1)
                + (clampUnitInterval(fragmentationRun.pressureWeakness, 0) * 0.08)
                + (clampUnitInterval(fragmentationRun.basinSupport, 0) * 0.12)
                + (fragmentationSpanSupport * 0.1)
                + (islandSegmentLockSupport * 0.1),
                0
            ));
            const routeLockSupport = roundValue(clampUnitInterval(
                (clampUnitInterval(routeSupportContext.marineCorridorSupportScore, 0) * 0.56)
                + (clampUnitInterval(routeSupportContext.marineRouteSupportScore, 0) * 0.44),
                0
            ));
            const controlValue = roundValue(clampUnitInterval(
                (morphologyLockSupport * 0.34)
                + (basinSeparationSupport * 0.18)
                + (clampUnitInterval(seaGraphMatch.marineAttachmentSupport, 0) * 0.2)
                + (clampUnitInterval(seaGraphMatch.constrainedWaterSupport, 0) * 0.14)
                + (routeLockSupport * 0.14),
                0
            ));
            const tradeDependency = roundValue(clampUnitInterval(
                (routeLockSupport * 0.34)
                + (clampUnitInterval(routeSupportContext.marineRouteSupportScore, 0) * 0.18)
                + (clampUnitInterval(routeSupportContext.marineCorridorSupportScore, 0) * 0.18)
                + (clampUnitInterval(seaGraphMatch.marineAttachmentSupport, 0) * 0.14)
                + (basinSeparationSupport * 0.08)
                + (fragmentationSpanSupport * 0.08),
                0
            ));
            const bypassDifficulty = roundValue(clampUnitInterval(
                (clampUnitInterval(seaGraphMatch.constrainedWaterSupport, 0) * 0.2)
                + (basinSeparationSupport * 0.12)
                + (routeSupportContext.marineRouteDependenceScore * 0.16)
                + ((1 - clampUnitInterval(routeSupportContext.marineAlternativeSupportScore, 0)) * 0.12)
                + (routeSupportContext.marineStructureFragilityScore * 0.14)
                + (routeSupportContext.marineMandatoryCorridorRatio * 0.1)
                + (routeSupportContext.marineBrittleCorridorRatio * 0.08)
                + (routeSupportContext.marinePeakRouteCost * 0.08),
                0
            ));
            const lockRelevanceScore = roundValue(clampUnitInterval(
                (morphologyLockSupport * 0.46)
                + (basinSeparationSupport * 0.18)
                + (clampUnitInterval(seaGraphMatch.marineAttachmentSupport, 0) * 0.18)
                + (routeLockSupport * 0.18),
                0
            ));
            const collapseSensitivity = roundValue(clampUnitInterval(
                (controlValue * 0.22)
                + (tradeDependency * 0.2)
                + (bypassDifficulty * 0.22)
                + (routeSupportContext.marineStructureFragilityScore * 0.14)
                + (routeSupportContext.marineBrittleCorridorRatio * 0.12)
                + (routeSupportContext.marinePeakRouteCost * 0.1),
                0
            ));

            return {
                candidateId: `island_chain_chokepoint_candidate_${String(candidateIndex + 1).padStart(3, '0')}`,
                sourceFragmentationRunId: normalizeString(fragmentationRun.fragmentationRunId, ''),
                chokepointType: 'island_chain_lock',
                lockClass: classifyIslandChainLockClass(
                    controlValue,
                    tradeDependency,
                    bypassDifficulty,
                    collapseSensitivity
                ),
                orientation: normalizeString(fragmentationRun.orientation, ''),
                candidateCellCount: normalizedCandidateCellCount,
                runCellIndices: Array.isArray(fragmentationRun.runCellIndices) ? fragmentationRun.runCellIndices.slice() : [],
                carvedBreakCellIndices: Array.isArray(fragmentationRun.carvedBreakCellIndices) ? fragmentationRun.carvedBreakCellIndices.slice() : [],
                projectedIslandSegmentCount,
                averageScore: roundValue(clampUnitInterval(fragmentationRun.averageScore, 0)),
                strongestScore: roundValue(clampUnitInterval(fragmentationRun.strongestScore, 0)),
                openWaterExposure: roundValue(clampUnitInterval(fragmentationRun.openWaterExposure, 0)),
                fractureSupport: roundValue(clampUnitInterval(fragmentationRun.fractureSupport, 0)),
                pressureWeakness: roundValue(clampUnitInterval(fragmentationRun.pressureWeakness, 0)),
                lowReliefBias: roundValue(clampUnitInterval(fragmentationRun.lowReliefBias, 0)),
                basinSupport: roundValue(clampUnitInterval(fragmentationRun.basinSupport, 0)),
                flankingBasinIds: uniqueStrings(fragmentationRun.flankingBasinIds),
                flankingBasinKinds: uniqueStrings(fragmentationRun.flankingBasinKinds),
                matchedSeaRegionClusterIds: seaGraphMatch.matchedSeaRegionClusterIds.slice(),
                matchedSeaRegionIds: seaGraphMatch.matchedSeaRegionIds.slice(),
                matchedSeaNodeIds: seaGraphMatch.matchedNodeIds.slice(),
                supportingSeaEdgeIds: seaGraphMatch.supportingSeaEdgeIds.slice(),
                supportingSeaEdgeCount: seaGraphMatch.supportingSeaEdgeCount,
                seaGraphMatchMode: seaGraphMatch.seaGraphMatchMode,
                seaGraphMatchConfidence: roundValue(clampUnitInterval(
                    (clampUnitInterval(seaGraphMatch.marineAttachmentSupport, 0) * 0.7)
                    + (Math.min(1, seaGraphMatch.supportingSeaEdgeCount) * 0.3),
                    0
                )),
                marineRouteSupportCount: routeSupportContext.marineRouteSupportCount,
                marineCorridorSupportCount: routeSupportContext.marineCorridorSupportCount,
                marineRouteSupportScore: routeSupportContext.marineRouteSupportScore,
                marineCorridorSupportScore: routeSupportContext.marineCorridorSupportScore,
                marineCorridorStrengthClass: routeSupportContext.marineCorridorStrengthClass,
                supportingMarineCorridorIds: routeSupportContext.marineCorridorIds.slice(),
                supportingMarineRouteIds: routeSupportContext.marineRouteIds.slice(),
                fragmentationSpanSupport,
                islandSegmentLockSupport,
                basinSeparationSupport,
                morphologyLockSupport,
                routeLockSupport,
                marineAttachmentSupport: seaGraphMatch.marineAttachmentSupport,
                constrainedWaterSupport: seaGraphMatch.constrainedWaterSupport,
                openWaterSupport: seaGraphMatch.openWaterSupport,
                controlValue,
                tradeDependency,
                bypassDifficulty,
                collapseSensitivity,
                lockRelevanceScore,
                adjacentRegions: uniqueStrings(
                    seaGraphMatch.matchedSeaRegionIds.length > 0
                        ? seaGraphMatch.matchedSeaRegionIds
                        : (Array.isArray(fragmentationRun.flankingBasinIds) ? fragmentationRun.flankingBasinIds : [])
                ),
                futureChokepointRecordInput: true
            };
        });

        return {
            outputId: ISLAND_CHAIN_CANDIDATES_OUTPUT_ID,
            stageId: ISLAND_CHAIN_DETECTION_STAGE_ID,
            modelId: ISLAND_CHAIN_DETECTION_MODEL_ID,
            deterministic: true,
            seedNamespace: 'macro.chokepoints.islandChainLockDetection',
            sourceOutputIds: [
                normalizeString(archipelagoFragmentationSummary && archipelagoFragmentationSummary.archipelagoFragmentationId, ''),
                normalizeString(seaConnectivityGraph && seaConnectivityGraph.outputId, ''),
                normalizeString(macroRoutes && macroRoutes.outputId, ''),
                normalizeString(macroCorridors && macroCorridors.outputId, '')
            ].filter(Boolean),
            dependencyAvailability: cloneValue(
                Array.isArray(dependencyAvailability && dependencyAvailability.groups)
                    ? dependencyAvailability.groups.filter((group) => (
                        group.groupId === 'islandChainSignals'
                        || group.groupId === 'routeDependence'
                    ))
                    : []
            ),
            candidates,
            summary: {
                fragmentationRunHintCount: fragmentationRuns.length,
                islandChainLockCandidateCount: candidates.length,
                linkedSeaGraphCandidateCount: candidates.filter((candidate) => candidate.matchedSeaNodeIds.length > 0).length,
                routeBackedCandidateCount: candidates.filter((candidate) => candidate.marineCorridorSupportCount > 0 || candidate.marineRouteSupportCount > 0).length,
                strongestControlValue: candidates.reduce((maxValue, candidate) => Math.max(maxValue, clampUnitInterval(candidate.controlValue, 0)), 0),
                strongestTradeDependency: candidates.reduce((maxValue, candidate) => Math.max(maxValue, clampUnitInterval(candidate.tradeDependency, 0)), 0),
                strongestBypassDifficulty: candidates.reduce((maxValue, candidate) => Math.max(maxValue, clampUnitInterval(candidate.bypassDifficulty, 0)), 0),
                strongestCollapseSensitivity: candidates.reduce((maxValue, candidate) => Math.max(maxValue, clampUnitInterval(candidate.collapseSensitivity, 0)), 0),
                strongestLockRelevanceScore: candidates.reduce((maxValue, candidate) => Math.max(maxValue, clampUnitInterval(candidate.lockRelevanceScore, 0)), 0),
                marineCorridorSupportCount: routeSupportContext.marineCorridorSupportCount,
                marineRouteSupportCount: routeSupportContext.marineRouteSupportCount,
                detectionPerformed: true,
                chokeMetricsComputed: true,
                valueMeaning: 'deterministic archipelagic lock candidates built from fragmentation runs plus coarse sea-graph and route/corridor fragility support, with full choke metrics and final family classification'
            },
            compatibility: {
                futureChokepointRecordInput: true,
                futureRouteGraphInput: true,
                futureStrategicLayerInput: true,
                sameWorldBoundsRequired: true
            },
            intentionallyAbsent: [
                'inlandBottleneckChokepointCandidates',
                'chokepointRecords',
                'gameplaySemantics'
            ]
        };
    }

    function classifyInlandBottleneckClass(
        controlValue = 0,
        tradeDependency = 0,
        bypassDifficulty = 0,
        collapseSensitivity = 0
    ) {
        const normalizedScore = computeChokepointClassificationScore(
            controlValue,
            tradeDependency,
            bypassDifficulty,
            collapseSensitivity
        );

        if (normalizedScore >= 0.72) {
            return 'primary_inland_bottleneck';
        }
        if (normalizedScore >= 0.54) {
            return 'strong_inland_bottleneck';
        }
        if (normalizedScore >= 0.36) {
            return 'emergent_inland_bottleneck';
        }
        return 'weak_inland_bottleneck';
    }

    function buildInlandAdjacencyByNodeId(landEdges = []) {
        const adjacencyByNodeId = new Map();

        (Array.isArray(landEdges) ? landEdges : []).forEach((edge) => {
            if (normalizeString(edge.edgeType, '') !== 'interregional_link') {
                return;
            }

            const fromNodeId = normalizeString(edge.fromNodeId, '');
            const toNodeId = normalizeString(edge.toNodeId, '');

            [fromNodeId, toNodeId].filter(Boolean).forEach((nodeId) => {
                if (!adjacencyByNodeId.has(nodeId)) {
                    adjacencyByNodeId.set(nodeId, new Set());
                }
            });

            if (fromNodeId && toNodeId) {
                adjacencyByNodeId.get(fromNodeId).add(toNodeId);
                adjacencyByNodeId.get(toNodeId).add(fromNodeId);
            }
        });

        return adjacencyByNodeId;
    }

    function buildInlandRouteSupport(landEdgeId = '', macroRoutes = {}, macroCorridors = {}) {
        const normalizedLandEdgeId = normalizeString(landEdgeId, '');
        const candidateRoutes = Array.isArray(macroRoutes && macroRoutes.candidateRoutes)
            ? macroRoutes.candidateRoutes
            : [];
        const corridorRows = Array.isArray(macroCorridors && macroCorridors.macroCorridors)
            ? macroCorridors.macroCorridors
            : [];
        const landRoutes = candidateRoutes.filter((route) => (
            normalizeInteger(route.landEdgeCount, 0) > 0
            && Array.isArray(route.edgePathIds)
            && route.edgePathIds.includes(normalizedLandEdgeId)
        ));
        const landCorridors = corridorRows.filter((corridor) => (
            normalizeInteger(corridor.landEdgeCount, 0) > 0
            && Array.isArray(corridor.corridorEdgeIds)
            && corridor.corridorEdgeIds.includes(normalizedLandEdgeId)
        ));
        const routeSupportScore = candidateRoutes.length > 0
            ? landRoutes.length / candidateRoutes.length
            : 0;
        const corridorSupportScore = landCorridors.length > 0
            ? landCorridors.reduce((sum, corridor) => sum + clampUnitInterval(corridor.supportScore, 0), 0) / landCorridors.length
            : 0;
        const corridorStrengthClass = landCorridors.length > 0
            ? normalizeString(landCorridors
                .slice()
                .sort((left, right) => (
                    clampUnitInterval(right.supportScore, 0) - clampUnitInterval(left.supportScore, 0)
                    || normalizeString(left.corridorId, '').localeCompare(normalizeString(right.corridorId, ''))
                ))[0].corridorStrengthClass, '')
            : '';

        return {
            landRouteSupportCount: landRoutes.length,
            landCorridorSupportCount: landCorridors.length,
            landRouteSupportScore: roundValue(clampUnitInterval(routeSupportScore, 0)),
            landCorridorSupportScore: roundValue(clampUnitInterval(corridorSupportScore, 0)),
            landCorridorStrengthClass: corridorStrengthClass,
            landMeanRouteCost: roundValue(computeMean(landRoutes.map((route) => clampUnitInterval(route.meanEdgeRouteCost, 0)))),
            landPeakRouteCost: roundValue(Math.max(
                landRoutes.reduce((maxValue, route) => Math.max(maxValue, clampUnitInterval(route.peakEdgeRouteCost, 0)), 0),
                landCorridors.reduce((maxValue, corridor) => Math.max(maxValue, clampUnitInterval(corridor.peakEdgeRouteCost, 0)), 0)
            )),
            landRouteDependenceScore: roundValue(computeMean(landCorridors.map((corridor) => clampUnitInterval(corridor.routeDependenceScore, 0)))),
            landAlternativeSupportScore: roundValue(computeMean(landCorridors.map((corridor) => clampUnitInterval(corridor.alternativeSupportScore, 0)))),
            landStructureFragilityScore: roundValue(computeMean(landCorridors.map((corridor) => clampUnitInterval(corridor.structureFragilityScore, 0)))),
            landMandatoryCorridorRatio: roundValue(
                landCorridors.length > 0
                    ? landCorridors.filter((corridor) => corridor.mandatoryCorridor).length / landCorridors.length
                    : 0
            ),
            landBrittleCorridorRatio: roundValue(
                landCorridors.length > 0
                    ? landCorridors.filter((corridor) => corridor.brittleCorridor).length / landCorridors.length
                    : 0
            ),
            supportingLandRouteIds: uniqueStrings(landRoutes.map((route) => route.routeId)),
            supportingLandCorridorIds: uniqueStrings(landCorridors.map((corridor) => corridor.corridorId))
        };
    }

    function buildInlandBottleneckCandidates(input = {}, dependencyAvailability = {}) {
        const regionalSegmentationAnalysis = findInputIntermediateOutput(input, 'regionalSegmentationAnalysis');
        const landConnectivityGraph = findInputIntermediateOutput(input, 'landConnectivityGraph');
        const macroRoutes = findInputIntermediateOutput(input, 'macroRoutes');
        const macroCorridors = findInputIntermediateOutput(input, 'macroCorridors');
        const regionalSegments = Array.isArray(regionalSegmentationAnalysis && regionalSegmentationAnalysis.regionalSegments)
            ? regionalSegmentationAnalysis.regionalSegments
            : [];
        const landNodes = Array.isArray(landConnectivityGraph && landConnectivityGraph.nodes)
            ? landConnectivityGraph.nodes.filter((node) => normalizeString(node.nodeType, '') === 'inland_region')
            : [];
        const landEdges = Array.isArray(landConnectivityGraph && landConnectivityGraph.edges)
            ? landConnectivityGraph.edges.filter((edge) => normalizeString(edge.edgeType, '') === 'interregional_link')
            : [];
        const segmentLookup = buildLookupById(regionalSegments, 'regionalSegmentId');
        const inlandNodeLookup = buildLookupById(landNodes, 'nodeId');
        const adjacencyByNodeId = buildInlandAdjacencyByNodeId(landEdges);

        const candidates = landEdges.map((landEdge, candidateIndex) => {
            const fromNodeId = normalizeString(landEdge.fromNodeId, '');
            const toNodeId = normalizeString(landEdge.toNodeId, '');
            const fromNode = inlandNodeLookup.get(fromNodeId) || {};
            const toNode = inlandNodeLookup.get(toNodeId) || {};
            const fromRegionalSegmentId = normalizeString(
                fromNode.sourceRegionalSegmentId,
                normalizeString(landEdge.fromRegionalSegmentId, '')
            );
            const toRegionalSegmentId = normalizeString(
                toNode.sourceRegionalSegmentId,
                normalizeString(landEdge.toRegionalSegmentId, '')
            );
            const fromSegment = segmentLookup.get(fromRegionalSegmentId) || {};
            const toSegment = segmentLookup.get(toRegionalSegmentId) || {};
            const fromDegree = (adjacencyByNodeId.get(fromNodeId) || new Set()).size;
            const toDegree = (adjacencyByNodeId.get(toNodeId) || new Set()).size;
            const meanBarrierContactCellRatio = roundValue(computeMean([
                clampUnitInterval(fromSegment.barrierContactCellRatio, clampUnitInterval(fromNode.barrierContactCellRatio, 0)),
                clampUnitInterval(toSegment.barrierContactCellRatio, clampUnitInterval(toNode.barrierContactCellRatio, 0))
            ]));
            const bridgeConstraintSupport = roundValue(clampUnitInterval(
                1 - (((Math.max(1, fromDegree) - 1) + (Math.max(1, toDegree) - 1)) / 6),
                0
            ));
            const passabilityCompressionSupport = roundValue(clampUnitInterval(
                1 - computeMean([
                    clampUnitInterval(fromNode.meanInteriorPassability, 0.5),
                    clampUnitInterval(toNode.meanInteriorPassability, 0.5)
                ]),
                0
            ));
            const neighborPinchSupport = roundValue(clampUnitInterval(
                1 - (computeMean([
                    Array.isArray(fromSegment.barrierSeparatedNeighborSegmentIds) ? fromSegment.barrierSeparatedNeighborSegmentIds.length : fromDegree,
                    Array.isArray(toSegment.barrierSeparatedNeighborSegmentIds) ? toSegment.barrierSeparatedNeighborSegmentIds.length : toDegree
                ]) / 4),
                0
            ));
            const routeSupport = buildInlandRouteSupport(landEdge.edgeId, macroRoutes, macroCorridors);
            const routeConstraintSupport = roundValue(clampUnitInterval(
                (routeSupport.landRouteSupportScore * 0.52)
                + (routeSupport.landCorridorSupportScore * 0.48),
                0
            ));
            const edgeConnectivityStrength = roundValue(clampUnitInterval(landEdge.coarseConnectivityStrength, 0));
            const controlValue = roundValue(clampUnitInterval(
                (bridgeConstraintSupport * 0.3)
                + (meanBarrierContactCellRatio * 0.2)
                + (neighborPinchSupport * 0.16)
                + ((1 - edgeConnectivityStrength) * 0.12)
                + (routeConstraintSupport * 0.22),
                0
            ));
            const tradeDependency = roundValue(clampUnitInterval(
                (routeConstraintSupport * 0.36)
                + (routeSupport.landRouteSupportScore * 0.2)
                + (routeSupport.landCorridorSupportScore * 0.18)
                + (bridgeConstraintSupport * 0.12)
                + (passabilityCompressionSupport * 0.08)
                + (meanBarrierContactCellRatio * 0.06),
                0
            ));
            const bypassDifficulty = roundValue(clampUnitInterval(
                (bridgeConstraintSupport * 0.24)
                + (neighborPinchSupport * 0.14)
                + (meanBarrierContactCellRatio * 0.12)
                + (routeSupport.landRouteDependenceScore * 0.16)
                + ((1 - clampUnitInterval(routeSupport.landAlternativeSupportScore, 0)) * 0.1)
                + (routeSupport.landStructureFragilityScore * 0.12)
                + (routeSupport.landMandatoryCorridorRatio * 0.06)
                + (routeSupport.landBrittleCorridorRatio * 0.06),
                0
            ));
            const bottleneckRelevanceScore = roundValue(clampUnitInterval(
                (bridgeConstraintSupport * 0.28)
                + (meanBarrierContactCellRatio * 0.2)
                + (neighborPinchSupport * 0.16)
                + (passabilityCompressionSupport * 0.12)
                + (routeConstraintSupport * 0.24),
                0
            ));
            const collapseSensitivity = roundValue(clampUnitInterval(
                (controlValue * 0.22)
                + (tradeDependency * 0.18)
                + (bypassDifficulty * 0.22)
                + (routeSupport.landStructureFragilityScore * 0.16)
                + (routeSupport.landBrittleCorridorRatio * 0.12)
                + (routeSupport.landPeakRouteCost * 0.1),
                0
            ));

            return {
                candidateId: `inland_bottleneck_candidate_${String(candidateIndex + 1).padStart(3, '0')}`,
                sourceLandEdgeId: normalizeString(landEdge.edgeId, ''),
                chokepointType: 'inland_bottleneck',
                bottleneckClass: classifyInlandBottleneckClass(
                    controlValue,
                    tradeDependency,
                    bypassDifficulty,
                    collapseSensitivity
                ),
                continentId: normalizeString(landEdge.continentId, normalizeString(fromNode.continentId, normalizeString(toNode.continentId, ''))),
                fromNodeId,
                toNodeId,
                fromRegionalSegmentId,
                toRegionalSegmentId,
                fromNodeRole: normalizeString(fromNode.nodeRole, ''),
                toNodeRole: normalizeString(toNode.nodeRole, ''),
                fromDegree,
                toDegree,
                edgeConnectivityStrength,
                connectionClass: normalizeString(landEdge.connectionClass, ''),
                crossesBarrierBand: Boolean(landEdge.crossesBarrierBand),
                fromCellCount: normalizeInteger(fromSegment.cellCount, normalizeInteger(fromNode.cellCount, 0)),
                toCellCount: normalizeInteger(toSegment.cellCount, normalizeInteger(toNode.cellCount, 0)),
                meanInteriorPassability: roundValue(computeMean([
                    clampUnitInterval(fromNode.meanInteriorPassability, 0),
                    clampUnitInterval(toNode.meanInteriorPassability, 0)
                ])),
                meanBarrierContactCellRatio,
                bridgeConstraintSupport,
                passabilityCompressionSupport,
                neighborPinchSupport,
                landRouteSupportCount: routeSupport.landRouteSupportCount,
                landCorridorSupportCount: routeSupport.landCorridorSupportCount,
                landRouteSupportScore: routeSupport.landRouteSupportScore,
                landCorridorSupportScore: routeSupport.landCorridorSupportScore,
                landCorridorStrengthClass: routeSupport.landCorridorStrengthClass,
                supportingLandRouteIds: routeSupport.supportingLandRouteIds.slice(),
                supportingLandCorridorIds: routeSupport.supportingLandCorridorIds.slice(),
                routeConstraintSupport,
                controlValue,
                tradeDependency,
                bypassDifficulty,
                collapseSensitivity,
                bottleneckRelevanceScore,
                adjacentRegions: uniqueStrings([
                    fromRegionalSegmentId,
                    toRegionalSegmentId
                ]),
                futureChokepointRecordInput: true
            };
        });

        return {
            outputId: INLAND_BOTTLENECK_CANDIDATES_OUTPUT_ID,
            stageId: INLAND_BOTTLENECK_DETECTION_STAGE_ID,
            modelId: INLAND_BOTTLENECK_DETECTION_MODEL_ID,
            deterministic: true,
            seedNamespace: 'macro.chokepoints.inlandBottleneckDetection',
            sourceOutputIds: [
                normalizeString(regionalSegmentationAnalysis && regionalSegmentationAnalysis.outputId, ''),
                normalizeString(landConnectivityGraph && landConnectivityGraph.outputId, ''),
                normalizeString(macroRoutes && macroRoutes.outputId, ''),
                normalizeString(macroCorridors && macroCorridors.outputId, '')
            ].filter(Boolean),
            dependencyAvailability: cloneValue(
                Array.isArray(dependencyAvailability && dependencyAvailability.groups)
                    ? dependencyAvailability.groups.filter((group) => (
                        group.groupId === 'inlandBottleneckSignals'
                        || group.groupId === 'routeDependence'
                    ))
                    : []
            ),
            candidates,
            summary: {
                inlandEdgeHintCount: landEdges.length,
                inlandBottleneckCandidateCount: candidates.length,
                routeBackedCandidateCount: candidates.filter((candidate) => candidate.landRouteSupportCount > 0).length,
                corridorBackedCandidateCount: candidates.filter((candidate) => candidate.landCorridorSupportCount > 0).length,
                strongestControlValue: candidates.reduce((maxValue, candidate) => Math.max(maxValue, clampUnitInterval(candidate.controlValue, 0)), 0),
                strongestTradeDependency: candidates.reduce((maxValue, candidate) => Math.max(maxValue, clampUnitInterval(candidate.tradeDependency, 0)), 0),
                strongestBypassDifficulty: candidates.reduce((maxValue, candidate) => Math.max(maxValue, clampUnitInterval(candidate.bypassDifficulty, 0)), 0),
                strongestCollapseSensitivity: candidates.reduce((maxValue, candidate) => Math.max(maxValue, clampUnitInterval(candidate.collapseSensitivity, 0)), 0),
                strongestBottleneckRelevanceScore: candidates.reduce((maxValue, candidate) => Math.max(maxValue, clampUnitInterval(candidate.bottleneckRelevanceScore, 0)), 0),
                detectionPerformed: true,
                chokeMetricsComputed: true,
                valueMeaning: 'deterministic inland bottleneck candidates built from regional segmentation, land graph topology, and route/corridor fragility support, with full choke metrics and final family classification'
            },
            compatibility: {
                futureChokepointRecordInput: true,
                futureRouteGraphInput: true,
                futureStrategicLayerInput: true,
                sameWorldBoundsRequired: true
            },
            intentionallyAbsent: [
                'chokepointRecords',
                'gameplaySemantics'
            ]
        };
    }

    function createFallbackChokepointRecordSkeleton(input = {}) {
        return {
            chokepointId: normalizeString(input.chokepointId, ''),
            type: normalizeString(input.type, ''),
            controlValue: clampUnitInterval(input.controlValue, 0),
            tradeDependency: clampUnitInterval(input.tradeDependency, 0),
            bypassDifficulty: clampUnitInterval(input.bypassDifficulty, 0),
            collapseSensitivity: clampUnitInterval(input.collapseSensitivity, 0),
            adjacentRegions: uniqueStrings(input.adjacentRegions)
        };
    }

    function createChokepointRecordFromInput(input = {}) {
        return typeof macro.createChokepointRecordSkeleton === 'function'
            ? macro.createChokepointRecordSkeleton(input)
            : createFallbackChokepointRecordSkeleton(input);
    }

    function validateChokepointRecordLocally(candidate = {}) {
        if (typeof macro.validateChokepointRecord === 'function') {
            return macro.validateChokepointRecord(candidate);
        }

        const errors = [];
        if (!isPlainObject(candidate)) {
            errors.push('Record must be a plain object.');
        }
        if (!normalizeString(candidate.chokepointId, '')) {
            errors.push('"chokepointId" must be a non-empty string.');
        }
        if (!normalizeString(candidate.type, '')) {
            errors.push('"type" must be a non-empty string.');
        }
        if (!Array.isArray(candidate.adjacentRegions) || uniqueStrings(candidate.adjacentRegions).length === 0) {
            errors.push('"adjacentRegions" must contain at least one region id.');
        }

        ['controlValue', 'tradeDependency', 'bypassDifficulty', 'collapseSensitivity'].forEach((key) => {
            const numericValue = Number(candidate[key]);
            if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 1) {
                errors.push(`"${key}" must be a number in [0, 1].`);
            }
        });

        return {
            contractId: 'chokepointRecord',
            isValid: errors.length === 0,
            errors
        };
    }

    function resolveChokepointWorldBounds(input = {}) {
        const candidates = [
            input.worldBounds,
            getNestedValue(findInputIntermediateOutput(input, STRAIT_CANDIDATES_OUTPUT_ID), 'worldBounds'),
            getNestedValue(findInputIntermediateOutput(input, ISLAND_CHAIN_CANDIDATES_OUTPUT_ID), 'worldBounds'),
            getNestedValue(findInputIntermediateOutput(input, INLAND_BOTTLENECK_CANDIDATES_OUTPUT_ID), 'worldBounds'),
            getNestedValue(findInputIntermediateOutput(input, 'landConnectivityGraph'), 'worldBounds'),
            getNestedValue(findInputIntermediateOutput(input, 'seaConnectivityGraph'), 'worldBounds'),
            getNestedValue(findInputIntermediateOutput(input, 'hybridConnectivityGraph'), 'worldBounds')
        ];
        const worldBounds = candidates.find((candidate) => isPlainObject(candidate));
        return cloneValue(worldBounds || {});
    }

    function createChokepointRecordLink(
        candidate = {},
        record = {},
        validation = {},
        familyId = '',
        sourceOutputId = '',
        classFieldId = ''
    ) {
        return {
            chokepointId: normalizeString(record.chokepointId, ''),
            candidateId: normalizeString(candidate.candidateId, ''),
            type: normalizeString(record.type, ''),
            familyId,
            sourceOutputId: normalizeString(sourceOutputId, ''),
            sourceReferenceId: normalizeString(
                candidate.sourceStraitPassageId,
                normalizeString(
                    candidate.sourceFragmentationRunId,
                    normalizeString(candidate.sourceLandEdgeId, '')
                )
            ),
            familyClassFieldId: normalizeString(classFieldId, ''),
            familyClass: normalizeString(candidate[classFieldId], ''),
            adjacentRegions: uniqueStrings(record.adjacentRegions),
            sourceCandidateMetrics: {
                controlValue: roundValue(clampUnitInterval(candidate.controlValue, 0)),
                tradeDependency: roundValue(clampUnitInterval(candidate.tradeDependency, 0)),
                bypassDifficulty: roundValue(clampUnitInterval(candidate.bypassDifficulty, 0)),
                collapseSensitivity: roundValue(clampUnitInterval(candidate.collapseSensitivity, 0))
            },
            recordValidation: cloneValue(validation)
        };
    }

    function materializeChokepointRecordOutput(
        input = {},
        straitChokepointCandidates = {},
        islandChainChokepointCandidates = {},
        inlandBottleneckChokepointCandidates = {}
    ) {
        const worldBounds = resolveChokepointWorldBounds(input);
        const normalizedSeed = normalizeInteger(input.macroSeed, 0);
        const seedNamespace = 'macro.chokepoints.records';
        const familyRows = [
            {
                familyId: 'strait',
                sourceOutputId: STRAIT_CANDIDATES_OUTPUT_ID,
                classFieldId: 'chokepointClass',
                generatedIdPrefix: 'chk_strait_',
                candidates: Array.isArray(straitChokepointCandidates && straitChokepointCandidates.candidates)
                    ? straitChokepointCandidates.candidates.slice()
                    : []
            },
            {
                familyId: 'island_chain',
                sourceOutputId: ISLAND_CHAIN_CANDIDATES_OUTPUT_ID,
                classFieldId: 'lockClass',
                generatedIdPrefix: 'chk_island_chain_',
                candidates: Array.isArray(islandChainChokepointCandidates && islandChainChokepointCandidates.candidates)
                    ? islandChainChokepointCandidates.candidates.slice()
                    : []
            },
            {
                familyId: 'inland_bottleneck',
                sourceOutputId: INLAND_BOTTLENECK_CANDIDATES_OUTPUT_ID,
                classFieldId: 'bottleneckClass',
                generatedIdPrefix: 'chk_inland_bottleneck_',
                candidates: Array.isArray(inlandBottleneckChokepointCandidates && inlandBottleneckChokepointCandidates.candidates)
                    ? inlandBottleneckChokepointCandidates.candidates.slice()
                    : []
            }
        ];
        const chokepoints = [];
        const recordLinks = [];
        const deferredChokepointDrafts = [];

        familyRows.forEach((familyRow) => {
            familyRow.candidates
                .sort((left, right) => normalizeString(left.candidateId, '').localeCompare(normalizeString(right.candidateId, '')))
                .forEach((candidate, index) => {
                    const generatedRecordId = `${familyRow.generatedIdPrefix}${String(index + 1).padStart(3, '0')}`;
                    const recordInput = {
                        chokepointId: normalizeString(getNestedValue(candidate, 'recordDraft.chokepointId'), generatedRecordId),
                        type: normalizeString(
                            getNestedValue(candidate, 'recordDraft.type'),
                            normalizeString(candidate.chokepointType, familyRow.familyId)
                        ),
                        controlValue: clampUnitInterval(candidate.controlValue, 0),
                        tradeDependency: clampUnitInterval(candidate.tradeDependency, 0),
                        bypassDifficulty: clampUnitInterval(candidate.bypassDifficulty, 0),
                        collapseSensitivity: clampUnitInterval(candidate.collapseSensitivity, 0),
                        adjacentRegions: uniqueStrings(
                            Array.isArray(getNestedValue(candidate, 'recordDraft.adjacentRegions'))
                                ? getNestedValue(candidate, 'recordDraft.adjacentRegions')
                                : candidate.adjacentRegions
                        )
                    };
                    const record = createChokepointRecordFromInput(recordInput);
                    const validation = validateChokepointRecordLocally(record);

                    if (validation.isValid) {
                        chokepoints.push(record);
                        recordLinks.push(createChokepointRecordLink(
                            candidate,
                            record,
                            validation,
                            familyRow.familyId,
                            familyRow.sourceOutputId,
                            familyRow.classFieldId
                        ));
                        return;
                    }

                    deferredChokepointDrafts.push({
                        candidateId: normalizeString(candidate.candidateId, ''),
                        familyId: familyRow.familyId,
                        sourceOutputId: familyRow.sourceOutputId,
                        recordDraft: cloneValue(record),
                        validation: cloneValue(validation)
                    });
                });
        });

        return {
            chokepointRecordOutput: {
                chokepointRecordOutputId: CHOKEPOINT_RECORDS_OUTPUT_ID,
                stageId: CHOKEPOINT_RECORD_STAGE_ID,
                recordSetId: 'chokepoints',
                recordContract: 'ChokepointRecord',
                sourceFieldIds: [],
                sourceOutputIds: [
                    normalizeString(straitChokepointCandidates && straitChokepointCandidates.outputId, ''),
                    normalizeString(islandChainChokepointCandidates && islandChainChokepointCandidates.outputId, ''),
                    normalizeString(inlandBottleneckChokepointCandidates && inlandBottleneckChokepointCandidates.outputId, '')
                ].filter(Boolean),
                worldBounds,
                seedNamespace,
                seed: normalizedSeed,
                materializationModel: CHOKEPOINT_RECORD_MODEL_ID,
                chokepoints,
                recordLinks,
                deferredChokepointDrafts,
                summary: {
                    candidateCount: familyRows.reduce((sum, familyRow) => sum + familyRow.candidates.length, 0),
                    exportedRecordCount: chokepoints.length,
                    deferredDraftCount: deferredChokepointDrafts.length,
                    straitRecordCount: chokepoints.filter((record) => record.type === 'narrow_strait').length,
                    islandChainRecordCount: chokepoints.filter((record) => record.type === 'island_chain_lock').length,
                    inlandBottleneckRecordCount: chokepoints.filter((record) => record.type === 'inland_bottleneck').length,
                    debugLinkCount: recordLinks.length
                },
                compatibility: {
                    macroGeographyPackageRecordInput: true,
                    chokepointStageRecordOutput: true,
                    futureIsolationPeripheryInput: true,
                    futureStrategicLayerInput: true,
                    fullPackageAssemblyOutput: false,
                    sameWorldBoundsRequired: true
                },
                intentionallyAbsent: [
                    'fullPackageAssembly',
                    'terrainCells',
                    'gameplaySemantics'
                ]
            }
        };
    }

    function buildChokepointAnalysisPlan(
        input = {},
        dependencyAvailability = {},
        straitChokepointCandidates = null,
        islandChainChokepointCandidates = null,
        inlandBottleneckChokepointCandidates = null,
        chokepointRecordOutput = null
    ) {
        const straitCarvingSummary = findInputIntermediateOutput(input, 'straitCarvingSummary');
        const archipelagoFragmentationSummary = findInputIntermediateOutput(input, 'archipelagoFragmentationSummary');
        const regionalSegmentationAnalysis = findInputIntermediateOutput(input, 'regionalSegmentationAnalysis');
        const landConnectivityGraph = findInputIntermediateOutput(input, 'landConnectivityGraph');
        const seaConnectivityGraph = findInputIntermediateOutput(input, 'seaConnectivityGraph');
        const hybridConnectivityGraph = findInputIntermediateOutput(input, 'hybridConnectivityGraph');
        const routeCostSurface = findInputIntermediateOutput(input, 'routeCostSurface');
        const macroRoutes = findInputIntermediateOutput(input, 'macroRoutes');
        const macroCorridors = findInputIntermediateOutput(input, 'macroCorridors');
        const dependencyGroupsById = new Map(
            Array.isArray(dependencyAvailability && dependencyAvailability.groups)
                ? dependencyAvailability.groups.map((group) => [group.groupId, group])
                : []
        );

        const sourceCounts = {
            straitPassageHintCount: Array.isArray(straitCarvingSummary && straitCarvingSummary.straitPassages)
                ? straitCarvingSummary.straitPassages.length
                : 0,
            archipelagoRunHintCount: Array.isArray(archipelagoFragmentationSummary && archipelagoFragmentationSummary.fragmentationRuns)
                ? archipelagoFragmentationSummary.fragmentationRuns.length
                : 0,
            regionalSegmentCount: Array.isArray(regionalSegmentationAnalysis && regionalSegmentationAnalysis.regionalSegments)
                ? regionalSegmentationAnalysis.regionalSegments.length
                : 0,
            landGraphNodeCount: Array.isArray(landConnectivityGraph && landConnectivityGraph.nodes)
                ? landConnectivityGraph.nodes.length
                : 0,
            seaGraphNodeCount: Array.isArray(seaConnectivityGraph && seaConnectivityGraph.nodes)
                ? seaConnectivityGraph.nodes.length
                : 0,
            hybridGraphNodeCount: Array.isArray(hybridConnectivityGraph && hybridConnectivityGraph.nodes)
                ? hybridConnectivityGraph.nodes.length
                : 0,
            routeCostEdgeCount: Array.isArray(routeCostSurface && routeCostSurface.edgeCosts)
                ? routeCostSurface.edgeCosts.length
                : 0,
            macroRouteCount: Array.isArray(macroRoutes && macroRoutes.candidateRoutes)
                ? macroRoutes.candidateRoutes.length
                : 0,
            macroCorridorCount: Array.isArray(macroCorridors && macroCorridors.macroCorridors)
                ? macroCorridors.macroCorridors.length
                : 0,
            straitChokepointCandidateCount: Array.isArray(straitChokepointCandidates && straitChokepointCandidates.candidates)
                ? straitChokepointCandidates.candidates.length
                : 0,
            islandChainLockCandidateCount: Array.isArray(islandChainChokepointCandidates && islandChainChokepointCandidates.candidates)
                ? islandChainChokepointCandidates.candidates.length
                : 0,
            inlandBottleneckCandidateCount: Array.isArray(inlandBottleneckChokepointCandidates && inlandBottleneckChokepointCandidates.candidates)
                ? inlandBottleneckChokepointCandidates.candidates.length
                : 0,
            chokepointRecordCount: Array.isArray(chokepointRecordOutput && chokepointRecordOutput.chokepoints)
                ? chokepointRecordOutput.chokepoints.length
                : 0
        };

        const passPlans = PASS_SLOTS.map((passSlot) => {
            const dependencyGroups = passSlot.dependencyGroupIds
                .map((groupId) => dependencyGroupsById.get(groupId))
                .filter(Boolean);
            const availableDependencyIds = dependencyGroups.flatMap((group) => group.dependencies)
                .filter((dependency) => dependency.available)
                .map((dependency) => dependency.dependencyId);
            const detectorImplemented = passSlot.passId === 'straitChokepoints'
                || passSlot.passId === 'islandChainChokepoints'
                || passSlot.passId === 'inlandBottleneckChokepoints';
            const detectedCandidateCount = passSlot.passId === 'straitChokepoints'
                ? sourceCounts.straitChokepointCandidateCount
                : passSlot.passId === 'islandChainChokepoints'
                    ? sourceCounts.islandChainLockCandidateCount
                    : passSlot.passId === 'inlandBottleneckChokepoints'
                        ? sourceCounts.inlandBottleneckCandidateCount
                        : 0;
            const actualOutputId = passSlot.passId === 'straitChokepoints'
                ? STRAIT_CANDIDATES_OUTPUT_ID
                : passSlot.passId === 'islandChainChokepoints'
                    ? ISLAND_CHAIN_CANDIDATES_OUTPUT_ID
                    : passSlot.passId === 'inlandBottleneckChokepoints'
                        ? INLAND_BOTTLENECK_CANDIDATES_OUTPUT_ID
                        : '';

            return {
                passId: passSlot.passId,
                detectorFamily: passSlot.detectorFamily,
                plannedOutputId: passSlot.plannedOutputId,
                actualOutputId: detectorImplemented ? actualOutputId : '',
                status: detectorImplemented ? 'implemented' : passSlot.status,
                detectorImplemented,
                dependencyGroupIds: passSlot.dependencyGroupIds.slice(),
                availableDependencyIds,
                detectedCandidateCount,
                signalCount: availableDependencyIds.length,
                readyForDetectorHandoff: availableDependencyIds.length > 0
            };
        });

        return {
            outputId: ANALYSIS_PLAN_OUTPUT_ID,
            status: STATUS,
            phaseVersion: PHASE_VERSION,
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            seedNamespace: 'macro.chokepoints',
            dependencyAvailability: cloneValue(dependencyAvailability),
            sourceCounts,
            passPlans,
            plannedOutputs: {
                straitOutputId: STRAIT_CANDIDATES_OUTPUT_ID,
                islandChainOutputId: ISLAND_CHAIN_CANDIDATES_OUTPUT_ID,
                inlandBottleneckOutputId: INLAND_BOTTLENECK_CANDIDATES_OUTPUT_ID,
                chokepointRecordOutputId: CHOKEPOINT_RECORDS_OUTPUT_ID
            },
            summary: {
                totalSignalCount: Object.values(sourceCounts).reduce((sum, value) => sum + value, 0),
                straitSignalsAvailable: sourceCounts.straitPassageHintCount > 0 || sourceCounts.straitChokepointCandidateCount > 0,
                islandChainSignalsAvailable: sourceCounts.archipelagoRunHintCount > 0 || sourceCounts.islandChainLockCandidateCount > 0,
                inlandSignalsAvailable: sourceCounts.regionalSegmentCount > 0 || sourceCounts.inlandBottleneckCandidateCount > 0,
                routeDependenceAvailable: sourceCounts.macroRouteCount > 0 || sourceCounts.routeCostEdgeCount > 0,
                detectorsImplemented: true,
                implementedDetectorCount: 3,
                recordSynthesisImplemented: true
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        };
    }

    function getChokepointAnalyzerDescriptor() {
        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            phaseVersion: PHASE_VERSION,
            description: 'Partial ChokepointAnalyzer with implemented narrow-strait, island-chain lock, inland-bottleneck detection, and official chokepoint-record synthesis over marine-carving, land-graph, and route-graph context.',
            currentOutputs: [ANALYSIS_PLAN_OUTPUT_ID, STRAIT_CANDIDATES_OUTPUT_ID, ISLAND_CHAIN_CANDIDATES_OUTPUT_ID, INLAND_BOTTLENECK_CANDIDATES_OUTPUT_ID, CHOKEPOINT_RECORDS_OUTPUT_ID],
            deferredOutputs: INTENTIONALLY_ABSENT.slice()
        });
    }

    function getChokepointInputContract() {
        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            requiredKeys: REQUIRED_KEYS.slice(),
            optionalKeys: OPTIONAL_KEYS.slice(),
            inputGroups: cloneValue(INPUT_GROUPS),
            description: 'Partial ChokepointAnalyzer input contract. The runtime now implements narrow-strait detection, island-chain lock detection, inland-bottleneck detection, and official `ChokepointRecord` synthesis from marine-carving, land-graph, and route/corridor context.'
        });
    }

    function getChokepointOutputContract() {
        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            actualOutputs: {
                fields: [],
                intermediateOutputs: [ANALYSIS_PLAN_OUTPUT_ID, STRAIT_CANDIDATES_OUTPUT_ID, ISLAND_CHAIN_CANDIDATES_OUTPUT_ID, INLAND_BOTTLENECK_CANDIDATES_OUTPUT_ID, CHOKEPOINT_RECORDS_OUTPUT_ID],
                records: ['chokepoints'],
                debugArtifacts: []
            },
            plannedOutputs: [],
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice(),
            description: 'Partial ChokepointAnalyzer output contract. The runtime emits narrow-strait candidates, island-chain lock candidates, inland-bottleneck candidates, a detector-planning scaffold, and official `ChokepointRecord` output with record links as minimal debug-friendly traceability.'
        });
    }

    function analyzeChokepoints(input = {}) {
        const dependencyAvailability = describeChokepointDependencyAvailability(input);
        const straitChokepointCandidates = buildStraitChokepointCandidates(input, dependencyAvailability);
        const islandChainChokepointCandidates = buildIslandChainChokepointCandidates(input, dependencyAvailability);
        const inlandBottleneckChokepointCandidates = buildInlandBottleneckCandidates(input, dependencyAvailability);
        const chokepointRecordOutput = materializeChokepointRecordOutput(
            input,
            straitChokepointCandidates,
            islandChainChokepointCandidates,
            inlandBottleneckChokepointCandidates
        ).chokepointRecordOutput;
        const chokepointAnalysisPlan = buildChokepointAnalysisPlan(
            input,
            dependencyAvailability,
            straitChokepointCandidates,
            islandChainChokepointCandidates,
            inlandBottleneckChokepointCandidates,
            chokepointRecordOutput
        );

        return {
            status: STATUS,
            phaseVersion: PHASE_VERSION,
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            seedNamespace: 'macro.chokepoints',
            dependencyAvailability,
            outputs: {
                fields: {},
                intermediateOutputs: {
                    chokepointAnalysisPlan,
                    straitChokepointCandidates,
                    islandChainChokepointCandidates,
                    inlandBottleneckChokepointCandidates,
                    chokepointRecords: chokepointRecordOutput
                },
                records: {
                    chokepoints: Array.isArray(chokepointRecordOutput.chokepoints)
                        ? chokepointRecordOutput.chokepoints.slice()
                        : []
                },
                debugArtifacts: {}
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice(),
            notes: [
                'ChokepointAnalyzer now emits first-class narrow-strait chokepoint candidates from `straitCarvingSummary` plus coarse `seaConnectivityGraph` context.',
                'The analyzer now also emits island-chain lock candidates from `archipelagoFragmentationSummary` and inland bottleneck candidates from `regionalSegmentationAnalysis`, then materializes official `ChokepointRecord` rows from all three detector families.',
                'Minimal debug-friendly traceability is carried inside `chokepointRecords.recordLinks`, so no separate chokepoint debug artifact is needed in this microstep.'
            ],
            description: 'Partial chokepoint-analysis runtime with implemented narrow-strait, island-chain lock, inland-bottleneck detection, and official chokepoint-record synthesis.'
        };
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule(MODULE_ID, {
            entry: 'analyzeChokepoints',
            file: 'js/worldgen/macro/chokepoint-analyzer.js',
            description: 'Partial ChokepointAnalyzer with implemented narrow-strait, island-chain lock, inland-bottleneck detection, and official chokepoint-record synthesis.',
            stub: false,
            scaffold: false
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep(PIPELINE_STEP_ID, {
            moduleId: MODULE_ID,
            file: 'js/worldgen/macro/chokepoint-analyzer.js',
            description: 'Partial pipeline entry for chokepoint analysis; narrow-strait, island-chain lock, inland-bottleneck detection, and chokepoint-record synthesis are implemented while isolation/periphery logic remains downstream.',
            stub: false,
            scaffold: false
        });
    }

    Object.assign(macro, {
        getChokepointAnalyzerDescriptor,
        getChokepointInputContract,
        getChokepointOutputContract,
        describeChokepointDependencyAvailability,
        analyzeChokepoints
    });
})();
