(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const MODULE_ID = 'macroValidationAndRebalance';
    const PIPELINE_STEP_ID = 'validationRebalance';
    const STATUS = 'PARTIAL_IMPLEMENTED';
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';
    const DEFAULT_WORLD_BOUNDS = Object.freeze({
        width: 256,
        height: 128
    });
    const VALIDATION_REPORT_OUTPUT_ID = 'validationReport';
    const VALIDATION_DIAGNOSTICS_OUTPUT_ID = 'macroValidationDiagnostics';
    const REBALANCE_PASS_OUTPUT_ID = 'partialRegenerationRebalancePass';
    const VALIDATION_STAGE_ID = 'scoreDiagnostics';
    const VALIDATION_MODEL_ID = 'deterministicMacroValidationScoringV1';
    const REBALANCE_STAGE_ID = 'partialRegenerationRebalance';
    const REBALANCE_MODEL_ID = 'deterministicPartialRegenerationRebalanceV1';
    const PASS_THRESHOLD = 0.55;
    const WARN_THRESHOLD = 0.4;
    const FAIL_THRESHOLD = 0.3;
    const SCORE_LABELS = Object.freeze({
        diversity: 'macro diversity',
        routeRichness: 'route richness',
        chokeValue: 'choke usefulness',
        archipelagoSignificance: 'archipelago significance',
        centerPeripheryContrast: 'center-periphery contrast',
        historyPotential: 'history potential'
    });
    const SCORE_KEYS = Object.freeze([
        'diversity',
        'routeRichness',
        'chokeValue',
        'archipelagoSignificance',
        'centerPeripheryContrast',
        'historyPotential'
    ]);
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
        'strategicRegionSynthesis',
        'strategicRegionSynthesizer',
        'hydrosphere',
        'climateEnvelope',
        'intermediateOutputs',
        'records',
        'debugOptions'
    ]);
    const INPUT_GROUPS = Object.freeze({
        structuralDiversityContext: Object.freeze([
            {
                dependencyId: 'continentalCohesionSummaries',
                sourceGroup: 'continentalCohesion.outputs.intermediateOutputs',
                required: false,
                role: 'continent-scale cohesion summaries for macro diversity and center-periphery contrast'
            },
            {
                dependencyId: 'seaRegionClusters',
                sourceGroup: 'hydrosphere.outputs.intermediateOutputs',
                required: false,
                role: 'optional sea-region clustering for broader diversity scoring'
            },
            {
                dependencyId: 'regionalClimateSummaries',
                sourceGroup: 'climateEnvelope.outputs.intermediateOutputs',
                required: false,
                role: 'optional climate spread summaries for structural variety scoring'
            }
        ]),
        connectivityContext: Object.freeze([
            {
                dependencyId: 'coastalOpportunityProfile',
                sourceGroup: 'coastalOpportunity.outputs.intermediateOutputs',
                required: false,
                role: 'coastal-opportunity rollups for route richness and maritime access weighting'
            },
            {
                dependencyId: 'exceptionalCoastalNodes',
                sourceGroup: 'coastalOpportunity.outputs.intermediateOutputs',
                required: false,
                role: 'coastal access anchors for route-richness scoring'
            },
            {
                dependencyId: 'macroRoutes',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: false,
                role: 'coarse sampled macro routes for route richness and history-potential scoring'
            },
            {
                dependencyId: 'macroCorridors',
                sourceGroup: 'connectivityGraph.outputs.intermediateOutputs',
                required: false,
                role: 'macro corridor extractions for route richness, fragility, and history-potential scoring'
            }
        ]),
        chokeArchipelagoContext: Object.freeze([
            {
                dependencyId: 'chokepointRecords',
                sourceGroup: 'chokepoints.outputs.intermediateOutputs',
                required: false,
                role: 'official chokepoint rows for choke-usefulness scoring'
            },
            {
                dependencyId: 'archipelagoMacroZones',
                sourceGroup: 'archipelagoSignificance.outputs.intermediateOutputs',
                required: false,
                role: 'archipelago macrozones and significance metrics for validation scoring'
            }
        ]),
        centerPeripheryContext: Object.freeze([
            {
                dependencyId: 'corePotentialAnalysis',
                sourceGroup: 'continentalCohesion.outputs.intermediateOutputs',
                required: false,
                role: 'core-potential summaries for center strength and imperial-core validation'
            },
            {
                dependencyId: 'fracturedPeripheryAnalysis',
                sourceGroup: 'continentalCohesion.outputs.intermediateOutputs',
                required: false,
                role: 'continent-edge fragility summaries for center-periphery contrast'
            },
            {
                dependencyId: 'isolatedZones',
                sourceGroup: 'isolationPeriphery.outputs.intermediateOutputs',
                required: false,
                role: 'isolated-zone rollups for periphery pressure scoring'
            },
            {
                dependencyId: 'peripheryClusters',
                sourceGroup: 'isolationPeriphery.outputs.intermediateOutputs',
                required: false,
                role: 'periphery-cluster rollups for center-periphery contrast and history potential'
            }
        ]),
        strategicContext: Object.freeze([
            {
                dependencyId: 'strategicRegionCandidates',
                sourceGroup: 'strategicRegionSynthesis.outputs.intermediateOutputs',
                required: false,
                role: 'candidate-only strategic synthesis surface for validation scoring'
            }
        ])
    });
    const INTENTIONALLY_ABSENT = Object.freeze([
        'packageAssembly',
        'wholePhaseOrchestration',
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

    function normalizeWorldBounds(worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedBounds = isPlainObject(worldBounds) ? worldBounds : {};
        return {
            width: Math.max(1, normalizeInteger(normalizedBounds.width, DEFAULT_WORLD_BOUNDS.width)),
            height: Math.max(1, normalizeInteger(normalizedBounds.height, DEFAULT_WORLD_BOUNDS.height))
        };
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

    function averageUnit(values = [], fallback = 0) {
        return clampUnitInterval(computeMean(values, fallback), fallback);
    }

    function maxUnit(values = [], fallback = 0) {
        const normalizedValues = Array.isArray(values)
            ? values
                .map((value) => clampUnitInterval(value, Number.NaN))
                .filter((value) => Number.isFinite(value))
            : [];

        if (!normalizedValues.length) {
            return fallback;
        }

        return normalizedValues.reduce((maxValue, value) => Math.max(maxValue, value), 0);
    }

    function saturateCount(count, target = 1) {
        const normalizedTarget = Math.max(1, normalizeNumber(target, 1));
        const normalizedCount = Math.max(0, normalizeNumber(count, 0));
        return clampUnitInterval(normalizedCount / normalizedTarget);
    }

    function weightedAverage(weightedParts = [], fallback = 0) {
        const normalizedParts = (Array.isArray(weightedParts) ? weightedParts : [])
            .map((part) => ({
                value: clampUnitInterval(part && part.value, Number.NaN),
                weight: Math.max(0, normalizeNumber(part && part.weight, 0))
            }))
            .filter((part) => Number.isFinite(part.value) && part.weight > 0);

        if (!normalizedParts.length) {
            return fallback;
        }

        const weightedSum = normalizedParts.reduce((sum, part) => sum + (part.value * part.weight), 0);
        const totalWeight = normalizedParts.reduce((sum, part) => sum + part.weight, 0);
        return totalWeight > 0 ? clampUnitInterval(weightedSum / totalWeight) : fallback;
    }

    function classifyScoreBand(score) {
        const normalizedScore = clampUnitInterval(score, 0);
        if (normalizedScore >= 0.7) {
            return 'strong';
        }
        if (normalizedScore >= PASS_THRESHOLD) {
            return 'healthy';
        }
        if (normalizedScore >= WARN_THRESHOLD) {
            return 'thin';
        }
        if (normalizedScore >= FAIL_THRESHOLD) {
            return 'weak';
        }
        return 'critical';
    }

    function buildTopDriverIds(componentScores = {}, limit = 3) {
        return Object.entries(isPlainObject(componentScores) ? componentScores : {})
            .map(([driverId, value]) => [driverId, clampUnitInterval(value, 0)])
            .filter(([, value]) => value > 0)
            .sort((left, right) => right[1] - left[1])
            .slice(0, Math.max(1, normalizeInteger(limit, 3)))
            .map(([driverId]) => driverId);
    }

    function getArrayAtPaths(source, candidatePaths = []) {
        for (const path of Array.isArray(candidatePaths) ? candidatePaths : []) {
            const value = getNestedValue(source, path, undefined);
            if (Array.isArray(value)) {
                return value.slice();
            }
        }

        return [];
    }

    function findInputIntermediateOutput(input = {}, outputId = '') {
        const normalizedOutputId = normalizeString(outputId, '');
        if (!normalizedOutputId) {
            return null;
        }

        const sourceOutputGroups = [
            input && input.intermediateOutputs,
            getNestedValue(input, 'continentalCohesion.outputs.intermediateOutputs', null),
            getNestedValue(input, 'coastalOpportunity.outputs.intermediateOutputs', null),
            getNestedValue(input, 'connectivityGraph.outputs.intermediateOutputs', null),
            getNestedValue(input, 'chokepoints.outputs.intermediateOutputs', null),
            getNestedValue(input, 'isolationPeriphery.outputs.intermediateOutputs', null),
            getNestedValue(input, 'archipelagoSignificance.outputs.intermediateOutputs', null),
            getNestedValue(input, 'strategicRegionSynthesis.outputs.intermediateOutputs', null),
            getNestedValue(input, 'strategicRegionSynthesizer.outputs.intermediateOutputs', null),
            getNestedValue(input, 'hydrosphere.outputs.intermediateOutputs', null),
            getNestedValue(input, 'climateEnvelope.outputs.intermediateOutputs', null)
        ];

        for (const sourceOutputGroup of sourceOutputGroups) {
            if (sourceOutputGroup && typeof sourceOutputGroup === 'object' && hasOwn(sourceOutputGroup, normalizedOutputId)) {
                return sourceOutputGroup[normalizedOutputId];
            }
        }

        return null;
    }

    function describeMacroValidationDependencyAvailability(input = {}) {
        const groups = {};
        let totalDependencyCount = 0;
        let availableDependencyCount = 0;
        const missingDependencyIds = [];

        Object.entries(INPUT_GROUPS).forEach(([groupId, dependencies]) => {
            groups[groupId] = dependencies.map((dependency) => {
                const dependencyOutput = findInputIntermediateOutput(input, dependency.dependencyId);
                const available = Boolean(dependencyOutput);

                totalDependencyCount += 1;
                if (available) {
                    availableDependencyCount += 1;
                } else {
                    missingDependencyIds.push(dependency.dependencyId);
                }

                return {
                    dependencyId: dependency.dependencyId,
                    sourceGroup: dependency.sourceGroup,
                    required: dependency.required === true,
                    role: dependency.role,
                    available,
                    outputId: normalizeString(dependencyOutput && dependencyOutput.outputId, dependency.dependencyId)
                };
            });
        });

        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            groups,
            summary: {
                totalDependencyCount,
                availableDependencyCount,
                missingDependencyCount: totalDependencyCount - availableDependencyCount,
                missingDependencyIds: uniqueStrings(missingDependencyIds)
            }
        });
    }

    function getStrategicCandidateFamilies(strategicRegionCandidates = {}) {
        return {
            imperialCoreCandidates: getArrayAtPaths(strategicRegionCandidates, ['imperialCoreCandidates']),
            tradeBeltCandidates: getArrayAtPaths(strategicRegionCandidates, ['tradeBeltCandidates']),
            fragilePeripheryCandidates: getArrayAtPaths(strategicRegionCandidates, ['fragilePeripheryCandidates']),
            disputedStrategicRegionCandidates: getArrayAtPaths(strategicRegionCandidates, ['disputedStrategicRegionCandidates'])
        };
    }

    function collectSeaIdentitySet(context = {}) {
        return uniqueStrings(
            []
                .concat((context.coastalProfiles || []).map((profile) => normalizeString(profile.seaRegionClusterId, '')))
                .concat((context.seaRegionRows || []).map((row) => normalizeString(row.seaRegionId || row.clusterId || row.id, '')))
                .concat((context.archipelagoZoneRows || []).flatMap((zone) => uniqueStrings(zone.seaRegionIds)))
                .concat((context.chokepointRows || []).flatMap((row) => uniqueStrings(row.adjacentRegions)))
        );
    }

    function buildValidationContext(input = {}, dependencyAvailability = {}) {
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
        const strategicRegionCandidates = findInputIntermediateOutput(input, 'strategicRegionCandidates') || {};
        const seaRegionClusters = findInputIntermediateOutput(input, 'seaRegionClusters') || {};
        const regionalClimateSummaries = findInputIntermediateOutput(input, 'regionalClimateSummaries') || {};
        const candidateFamilies = getStrategicCandidateFamilies(strategicRegionCandidates);
        const allStrategicCandidates = []
            .concat(candidateFamilies.imperialCoreCandidates)
            .concat(candidateFamilies.tradeBeltCandidates)
            .concat(candidateFamilies.fragilePeripheryCandidates)
            .concat(candidateFamilies.disputedStrategicRegionCandidates);

        return {
            worldBounds: normalizeWorldBounds(input.worldBounds),
            dependencyAvailability,
            continentalCohesionSummaries,
            corePotentialAnalysis,
            fracturedPeripheryAnalysis,
            coastalOpportunityProfile,
            exceptionalCoastalNodes,
            macroRoutes,
            macroCorridors,
            chokepointRecords,
            isolatedZones,
            peripheryClusters,
            archipelagoMacroZones,
            strategicRegionCandidates,
            seaRegionClusters,
            regionalClimateSummaries,
            continentSummaries: getArrayAtPaths(continentalCohesionSummaries, ['continentSummaries']),
            coreSummaries: getArrayAtPaths(corePotentialAnalysis, ['continentSummaries']),
            fracturedPeripherySummaries: getArrayAtPaths(fracturedPeripheryAnalysis, ['continentSummaries']),
            coastalProfiles: getArrayAtPaths(coastalOpportunityProfile, ['clusterProfiles']),
            coastalNodes: getArrayAtPaths(exceptionalCoastalNodes, ['exceptionalCoastalNodes']),
            routeRows: getArrayAtPaths(macroRoutes, ['candidateRoutes']),
            corridorRows: getArrayAtPaths(macroCorridors, ['macroCorridors']),
            chokepointRows: getArrayAtPaths(chokepointRecords, ['chokepoints']),
            isolatedZoneRows: getArrayAtPaths(isolatedZones, ['zones']),
            peripheryClusterRows: getArrayAtPaths(peripheryClusters, ['clusters']),
            archipelagoZoneRows: getArrayAtPaths(archipelagoMacroZones, ['macroZones']),
            seaRegionRows: getArrayAtPaths(seaRegionClusters, ['seaRegionClusters', 'clusters', 'regionClusters']),
            climateContinentSummaries: getArrayAtPaths(regionalClimateSummaries, ['continentSummaries']),
            candidateFamilies,
            allStrategicCandidates,
            sourceOutputIds: uniqueStrings([
                normalizeString(continentalCohesionSummaries.outputId, ''),
                normalizeString(corePotentialAnalysis.outputId, ''),
                normalizeString(fracturedPeripheryAnalysis.outputId, ''),
                normalizeString(coastalOpportunityProfile.outputId, ''),
                normalizeString(exceptionalCoastalNodes.outputId, ''),
                normalizeString(macroRoutes.outputId, ''),
                normalizeString(macroCorridors.outputId, ''),
                normalizeString(chokepointRecords.chokepointRecordOutputId || chokepointRecords.outputId, ''),
                normalizeString(isolatedZones.outputId, ''),
                normalizeString(peripheryClusters.outputId, ''),
                normalizeString(archipelagoMacroZones.outputId, ''),
                normalizeString(strategicRegionCandidates.outputId, ''),
                normalizeString(seaRegionClusters.outputId, ''),
                normalizeString(regionalClimateSummaries.outputId, '')
            ])
        };
    }

    function buildScoreEntry(scoreKey, componentScores = {}, score) {
        const normalizedComponents = Object.fromEntries(
            Object.entries(isPlainObject(componentScores) ? componentScores : {})
                .map(([componentId, componentScore]) => [componentId, roundValue(clampUnitInterval(componentScore, 0))])
        );
        const normalizedScore = roundValue(clampUnitInterval(score, 0));
        return {
            scoreKey,
            label: normalizeString(SCORE_LABELS[scoreKey], scoreKey),
            score: normalizedScore,
            band: classifyScoreBand(normalizedScore),
            componentScores: normalizedComponents,
            dominantDriverIds: buildTopDriverIds(normalizedComponents)
        };
    }

    function evaluateDiversity(context = {}) {
        const strategicFamilies = context.candidateFamilies || {};
        const familyCoverage = [
            strategicFamilies.imperialCoreCandidates,
            strategicFamilies.tradeBeltCandidates,
            strategicFamilies.fragilePeripheryCandidates,
            strategicFamilies.disputedStrategicRegionCandidates
        ].filter((familyRows) => Array.isArray(familyRows) && familyRows.length > 0).length;
        const componentScores = {
            continent_variety: saturateCount((context.continentSummaries || []).length, 4),
            sea_variety: saturateCount(collectSeaIdentitySet(context).length, 4),
            strategic_family_coverage: clampUnitInterval(familyCoverage / 4),
            macro_feature_density: saturateCount(
                (context.archipelagoZoneRows || []).length
                + (context.chokepointRows || []).length
                + (context.isolatedZoneRows || []).length
                + (context.peripheryClusterRows || []).length,
                8
            ),
            coastal_distribution: Math.max(
                saturateCount((context.coastalNodes || []).length, 4),
                averageUnit((context.coastalProfiles || []).map((profile) => profile.coastalOpportunityScore), 0)
            ),
            climate_spread: saturateCount((context.climateContinentSummaries || []).length, 4)
        };

        return buildScoreEntry('diversity', componentScores, weightedAverage([
            { value: componentScores.continent_variety, weight: 1.2 },
            { value: componentScores.sea_variety, weight: 1 },
            { value: componentScores.strategic_family_coverage, weight: 1.1 },
            { value: componentScores.macro_feature_density, weight: 1 },
            { value: componentScores.coastal_distribution, weight: 0.9 },
            { value: componentScores.climate_spread, weight: 0.6 }
        ], 0));
    }

    function evaluateRouteRichness(context = {}) {
        const routeModes = uniqueStrings(
            []
                .concat((context.routeRows || []).map((route) => normalizeString(route.routeMode, '')))
                .concat((context.corridorRows || []).map((corridor) => normalizeString(corridor.routeMode, '')))
        );
        const meanRouteCost = computeMean(
            []
                .concat((context.routeRows || []).map((route) => route.meanEdgeRouteCost))
                .concat((context.corridorRows || []).map((corridor) => corridor.meanEdgeRouteCost)),
            0.5
        );
        const componentScores = {
            route_count: saturateCount((context.routeRows || []).length, 4),
            corridor_count: saturateCount((context.corridorRows || []).length, 3),
            mode_diversity: saturateCount(routeModes.length, 3),
            coastal_access: Math.max(
                saturateCount((context.coastalNodes || []).length, 4),
                averageUnit((context.coastalProfiles || []).map((profile) => profile.coastalOpportunityScore), 0)
            ),
            route_accessibility: clampUnitInterval(1 - clampUnitInterval(meanRouteCost, 0.5), 0.5)
        };

        return buildScoreEntry('routeRichness', componentScores, weightedAverage([
            { value: componentScores.route_count, weight: 1.2 },
            { value: componentScores.corridor_count, weight: 1.2 },
            { value: componentScores.mode_diversity, weight: 0.9 },
            { value: componentScores.coastal_access, weight: 0.8 },
            { value: componentScores.route_accessibility, weight: 1 }
        ], 0));
    }

    function evaluateChokeValue(context = {}) {
        const chokepointTypes = uniqueStrings((context.chokepointRows || []).map((row) => normalizeString(row.type, '')));
        const disputedCandidates = context.candidateFamilies && Array.isArray(context.candidateFamilies.disputedStrategicRegionCandidates)
            ? context.candidateFamilies.disputedStrategicRegionCandidates
            : [];
        const controlTradeRows = (context.chokepointRows || []).map((row) => weightedAverage([
            { value: row.controlValue, weight: 1 },
            { value: row.tradeDependency, weight: 1 }
        ], 0));
        const resilienceRows = (context.chokepointRows || []).map((row) => weightedAverage([
            { value: row.bypassDifficulty, weight: 0.7 },
            { value: 1 - clampUnitInterval(row.collapseSensitivity, 0), weight: 0.3 }
        ], 0));
        const componentScores = {
            chokepoint_count: saturateCount((context.chokepointRows || []).length, 3),
            chokepoint_type_diversity: saturateCount(chokepointTypes.length, 3),
            control_trade_strength: averageUnit(controlTradeRows, 0),
            structural_resilience: averageUnit(resilienceRows, 0),
            disputed_region_support: Math.max(
                saturateCount(disputedCandidates.length, 2),
                averageUnit(disputedCandidates.map((candidate) => candidate.candidateScore), 0)
            )
        };

        return buildScoreEntry('chokeValue', componentScores, weightedAverage([
            { value: componentScores.chokepoint_count, weight: 0.9 },
            { value: componentScores.chokepoint_type_diversity, weight: 0.7 },
            { value: componentScores.control_trade_strength, weight: 1.3 },
            { value: componentScores.structural_resilience, weight: 1 },
            { value: componentScores.disputed_region_support, weight: 0.8 }
        ], 0));
    }

    function evaluateArchipelagoSignificance(context = {}) {
        const roleSeedCoverage = averageUnit((context.archipelagoZoneRows || []).map((zone) => {
            const primaryRoleSeed = normalizeString(getNestedValue(zone, 'roleSeedHints.primaryRoleSeed', ''), '');
            return primaryRoleSeed ? 1 : 0;
        }), 0);
        const routeLinkedCoverage = averageUnit((context.archipelagoZoneRows || []).map((zone) => {
            const routeIdCount = uniqueStrings(
                []
                    .concat(zone.macroRouteIds)
                    .concat(zone.macroCorridorIds)
            ).length;
            return saturateCount(routeIdCount, 2);
        }), 0);
        const componentScores = {
            macrozone_count: saturateCount((context.archipelagoZoneRows || []).length, 2),
            connective_value: averageUnit((context.archipelagoZoneRows || []).map((zone) => zone.connectiveValue), 0),
            contest_value: averageUnit((context.archipelagoZoneRows || []).map((zone) => zone.contestScore), 0),
            colonization_appeal: averageUnit((context.archipelagoZoneRows || []).map((zone) => zone.colonizationAppeal), 0),
            role_seed_coverage: roleSeedCoverage,
            route_linkage: routeLinkedCoverage
        };

        return buildScoreEntry('archipelagoSignificance', componentScores, weightedAverage([
            { value: componentScores.macrozone_count, weight: 0.8 },
            { value: componentScores.connective_value, weight: 1.2 },
            { value: componentScores.contest_value, weight: 0.9 },
            { value: componentScores.colonization_appeal, weight: 0.8 },
            { value: componentScores.role_seed_coverage, weight: 0.7 },
            { value: componentScores.route_linkage, weight: 0.8 }
        ], 0));
    }

    function evaluateCenterPeripheryContrast(context = {}) {
        const imperialCoreCandidates = context.candidateFamilies && Array.isArray(context.candidateFamilies.imperialCoreCandidates)
            ? context.candidateFamilies.imperialCoreCandidates
            : [];
        const fragilePeripheryCandidates = context.candidateFamilies && Array.isArray(context.candidateFamilies.fragilePeripheryCandidates)
            ? context.candidateFamilies.fragilePeripheryCandidates
            : [];
        const coreStrength = weightedAverage([
            { value: averageUnit((context.coreSummaries || []).map((summary) => summary.leadingCorePotentialScore || summary.meanCorePotential), 0), weight: 1.2 },
            { value: averageUnit((imperialCoreCandidates || []).map((candidate) => candidate.candidateScore), 0), weight: 1 },
            { value: averageUnit((context.continentSummaries || []).map((summary) => summary.meanContinentalCohesion || summary.meanInteriorPassability), 0), weight: 0.8 }
        ], 0);
        const peripheryPressure = weightedAverage([
            { value: averageUnit((context.peripheryClusterRows || []).map((cluster) => cluster.peripheryScore), 0), weight: 1 },
            { value: averageUnit((context.peripheryClusterRows || []).map((cluster) => cluster.meanWeatherAdjustedIsolation || cluster.meanLossInCollapseLikelihood), 0), weight: 1.1 },
            { value: averageUnit((fragilePeripheryCandidates || []).map((candidate) => candidate.candidateScore), 0), weight: 1 },
            { value: averageUnit((context.archipelagoZoneRows || []).map((zone) => zone.fragility || zone.collapseSusceptibility), 0), weight: 0.6 },
            { value: averageUnit((context.fracturedPeripherySummaries || []).map((summary) => summary.meanFracturedPeriphery), 0), weight: 0.8 }
        ], 0);
        const componentScores = {
            center_strength: coreStrength,
            periphery_pressure: peripheryPressure,
            dual_presence: clampUnitInterval(Math.min(coreStrength, peripheryPressure) * 1.3),
            contrast_gap: clampUnitInterval((coreStrength + peripheryPressure) / 2)
        };

        return buildScoreEntry('centerPeripheryContrast', componentScores, weightedAverage([
            { value: componentScores.center_strength, weight: 0.9 },
            { value: componentScores.periphery_pressure, weight: 1.2 },
            { value: componentScores.dual_presence, weight: 1.1 },
            { value: componentScores.contrast_gap, weight: 0.8 }
        ], 0));
    }

    function evaluateHistoryPotential(context = {}, priorScores = {}) {
        const routeFragility = averageUnit(
            []
                .concat((context.corridorRows || []).map((corridor) => corridor.routeDependenceScore))
                .concat((context.corridorRows || []).map((corridor) => corridor.structureFragilityScore))
                .concat((context.archipelagoZoneRows || []).map((zone) => zone.collapseSusceptibility)),
            0
        );
        const candidateTension = averageUnit([
            saturateCount((context.candidateFamilies && context.candidateFamilies.imperialCoreCandidates || []).length, 2),
            saturateCount((context.candidateFamilies && context.candidateFamilies.tradeBeltCandidates || []).length, 2),
            saturateCount((context.candidateFamilies && context.candidateFamilies.fragilePeripheryCandidates || []).length, 2),
            saturateCount((context.candidateFamilies && context.candidateFamilies.disputedStrategicRegionCandidates || []).length, 2)
        ], 0);
        const componentScores = {
            structural_variety: clampUnitInterval(priorScores.diversity, 0),
            connective_depth: weightedAverage([
                { value: priorScores.routeRichness, weight: 1 },
                { value: priorScores.archipelagoSignificance, weight: 0.8 }
            ], 0),
            contention_pressure: weightedAverage([
                { value: priorScores.chokeValue, weight: 0.9 },
                { value: averageUnit((context.archipelagoZoneRows || []).map((zone) => zone.contestScore), 0), weight: 1 }
            ], 0),
            center_edge_drama: clampUnitInterval(priorScores.centerPeripheryContrast, 0),
            route_fragility: routeFragility,
            candidate_tension: candidateTension
        };

        return buildScoreEntry('historyPotential', componentScores, weightedAverage([
            { value: componentScores.structural_variety, weight: 0.9 },
            { value: componentScores.connective_depth, weight: 1.1 },
            { value: componentScores.contention_pressure, weight: 1.1 },
            { value: componentScores.center_edge_drama, weight: 1 },
            { value: componentScores.route_fragility, weight: 0.8 },
            { value: componentScores.candidate_tension, weight: 0.9 }
        ], 0));
    }

    function createSelectiveRerollRecommendation(targetLayerIds = [], recommendationType = '', priority = '', reason = '') {
        return {
            targetLayerIds: uniqueStrings(targetLayerIds),
            recommendationType: normalizeString(recommendationType, ''),
            priority: normalizeString(priority, ''),
            reason: normalizeString(reason, '')
        };
    }

    function buildRebalanceActionLabel(action = {}) {
        const targetLayerIds = uniqueStrings(action.targetLayerIds);
        const priority = normalizeString(action.priority, 'medium');
        const actionType = normalizeString(action.actionType, 'selective_partial_regeneration');
        return `${priority}:${actionType}:${targetLayerIds.join('+') || 'none'}`;
    }

    function buildPartialRegenerationRebalancePass(input = {}, context = {}, scoreEntries = {}, recommendations = []) {
        const macroSeed = typeof macro.normalizeSeed === 'function'
            ? macro.normalizeSeed(hasOwn(input, 'macroSeed') ? input.macroSeed : input.seed)
            : 0;
        const sortedRecommendations = (Array.isArray(recommendations) ? recommendations : [])
            .slice()
            .sort((left, right) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                const leftOrder = priorityOrder[normalizeString(left && left.priority, 'medium')] ?? 1;
                const rightOrder = priorityOrder[normalizeString(right && right.priority, 'medium')] ?? 1;
                if (leftOrder !== rightOrder) {
                    return leftOrder - rightOrder;
                }

                return normalizeString(left && left.reason, '').localeCompare(normalizeString(right && right.reason, ''));
            });
        const plannedActions = sortedRecommendations.map((recommendation, actionIndex) => {
            const targetLayerIds = uniqueStrings(recommendation && recommendation.targetLayerIds);
            const seedDelta = (macroSeed + ((actionIndex + 1) * 2654435761)) >>> 0;
            return {
                actionId: `rebalance_action_${String(actionIndex + 1).padStart(3, '0')}`,
                actionType: 'selective_partial_regeneration',
                priority: normalizeString(recommendation && recommendation.priority, 'medium'),
                targetLayerIds,
                recommendationType: normalizeString(recommendation && recommendation.recommendationType, 'selective_reroll'),
                reason: normalizeString(recommendation && recommendation.reason, ''),
                deterministicSeedDelta: seedDelta,
                pipelineReentryMode: 'targeted_recompute',
                upstreamRerunExecuted: false,
                scoreKeys: Object.keys(isPlainObject(scoreEntries) ? scoreEntries : {})
            };
        });
        const targetedLayerIds = uniqueStrings(plannedActions.flatMap((action) => action.targetLayerIds));

        return deepFreeze({
            outputId: REBALANCE_PASS_OUTPUT_ID,
            stageId: REBALANCE_STAGE_ID,
            modelId: REBALANCE_MODEL_ID,
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            macroSeed,
            sourceOutputIds: uniqueStrings(context && context.sourceOutputIds),
            plannedActions,
            summary: {
                plannedActionCount: plannedActions.length,
                highPriorityActionCount: plannedActions.filter((action) => action.priority === 'high').length,
                targetedLayerCount: targetedLayerIds.length,
                targetedLayerIds,
                partialRegenerationSupported: true,
                upstreamRerunExecuted: false,
                rebalancePassImplemented: true
            },
            intentionallyAbsent: [
                'wholeWorldReroll',
                'executedUpstreamRegeneration',
                'debugBundle',
                'downstreamSemanticMutation'
            ]
        });
    }

    function buildRecommendations(scoreEntries = {}) {
        const recommendations = [];

        function pushRecommendation(scoreKey, targetLayerIds, reason) {
            const entry = scoreEntries[scoreKey];
            if (!entry || entry.score >= PASS_THRESHOLD) {
                return;
            }

            recommendations.push(createSelectiveRerollRecommendation(
                targetLayerIds,
                'selective_reroll',
                entry.score < FAIL_THRESHOLD ? 'high' : 'medium',
                reason
            ));
        }

        pushRecommendation(
            'diversity',
            ['tectonicSkeleton', 'reliefElevation', 'hydrosphere', 'climateEnvelope'],
            'Structural variety is thin; upstream land/sea/climate composition likely needs a selective refresh.'
        );
        pushRecommendation(
            'routeRichness',
            ['coastalOpportunity', 'flowRoutes'],
            'Route richness is below target; maritime access and macro-route structure should be refreshed together.'
        );
        pushRecommendation(
            'chokeValue',
            ['marineCarving', 'chokepoints', 'flowRoutes'],
            'Choke usefulness is underpowered; straits, corridor dependence, or choke structure likely need a selective reroll.'
        );
        pushRecommendation(
            'archipelagoSignificance',
            ['marineCarving', 'archipelagoSignificance'],
            'Archipelago significance is low; island-chain morphology or archipelago linkage likely needs a targeted refresh.'
        );
        pushRecommendation(
            'centerPeripheryContrast',
            ['continentalCohesion', 'isolationPeriphery', 'strategicRegionSynthesis'],
            'Center-periphery contrast is muted; core/periphery balance likely needs a selective recalculation.'
        );
        pushRecommendation(
            'historyPotential',
            ['flowRoutes', 'chokepoints', 'archipelagoSignificance', 'strategicRegionSynthesis'],
            'History potential is too thin; route, choke, archipelago, and strategic tension layers need a coordinated selective reroll.'
        );

        return recommendations;
    }

    function createValidationReport(validationReport = {}) {
        if (typeof macro.createValidationReportSkeleton === 'function') {
            return macro.createValidationReportSkeleton(validationReport);
        }

        const scores = Object.fromEntries(
            SCORE_KEYS.map((scoreKey) => [scoreKey, clampUnitInterval(getNestedValue(validationReport, ['scores', scoreKey], 0), 0)])
        );

        return {
            isValid: validationReport.isValid === true,
            scores,
            failReasons: Array.isArray(validationReport.failReasons) ? validationReport.failReasons.map((value) => `${value}`) : [],
            rebalanceActions: Array.isArray(validationReport.rebalanceActions) ? validationReport.rebalanceActions.map((value) => `${value}`) : [],
            diagnostics: {
                warnings: getArrayAtPaths(validationReport, ['diagnostics.warnings']).map((value) => `${value}`),
                blockedDownstreamPhases: getArrayAtPaths(validationReport, ['diagnostics.blockedDownstreamPhases']).map((value) => `${value}`)
            },
            selectiveRerollRecommendations: Array.isArray(validationReport.selectiveRerollRecommendations)
                ? validationReport.selectiveRerollRecommendations.map((recommendation) => ({
                    targetLayerIds: uniqueStrings(recommendation && recommendation.targetLayerIds),
                    recommendationType: normalizeString(recommendation && recommendation.recommendationType, ''),
                    priority: normalizeString(recommendation && recommendation.priority, ''),
                    reason: normalizeString(recommendation && recommendation.reason, '')
                }))
                : []
        };
    }

    function buildValidationOutputs(input = {}, dependencyAvailability = {}) {
        const context = buildValidationContext(input, dependencyAvailability);
        const diversityEntry = evaluateDiversity(context);
        const routeRichnessEntry = evaluateRouteRichness(context);
        const chokeValueEntry = evaluateChokeValue(context);
        const archipelagoSignificanceEntry = evaluateArchipelagoSignificance(context);
        const centerPeripheryContrastEntry = evaluateCenterPeripheryContrast(context);
        const historyPotentialEntry = evaluateHistoryPotential(context, {
            diversity: diversityEntry.score,
            routeRichness: routeRichnessEntry.score,
            chokeValue: chokeValueEntry.score,
            archipelagoSignificance: archipelagoSignificanceEntry.score,
            centerPeripheryContrast: centerPeripheryContrastEntry.score
        });
        const scoreEntries = {
            diversity: diversityEntry,
            routeRichness: routeRichnessEntry,
            chokeValue: chokeValueEntry,
            archipelagoSignificance: archipelagoSignificanceEntry,
            centerPeripheryContrast: centerPeripheryContrastEntry,
            historyPotential: historyPotentialEntry
        };
        const scores = Object.fromEntries(
            Object.entries(scoreEntries).map(([scoreKey, entry]) => [scoreKey, entry.score])
        );
        const meanScore = computeMean(Object.values(scores), 0);
        const sortedScoreEntries = Object.entries(scoreEntries)
            .sort((left, right) => right[1].score - left[1].score);
        const lowestScoreEntry = sortedScoreEntries[sortedScoreEntries.length - 1] || ['diversity', diversityEntry];
        const failReasons = [];
        const warnings = [];

        Object.entries(scoreEntries).forEach(([scoreKey, entry]) => {
            const label = normalizeString(SCORE_LABELS[scoreKey], scoreKey);
            if (entry.score < FAIL_THRESHOLD) {
                failReasons.push(`${label} score ${entry.score.toFixed(2)} is below the minimum threshold.`);
                return;
            }

            if (entry.score < WARN_THRESHOLD) {
                warnings.push(`${label} score ${entry.score.toFixed(2)} is weak and may produce a shallow macro world.`);
                return;
            }

            if (entry.score < PASS_THRESHOLD) {
                warnings.push(`${label} score ${entry.score.toFixed(2)} is thinner than target and may benefit from selective rerolling.`);
            }
        });

        if (context.sourceOutputIds.length < 4) {
            warnings.push('Validation ran with degraded upstream context; several major Phase 1 outputs are still missing.');
        }

        if ((context.routeRows || []).length === 0 && (context.corridorRows || []).length === 0) {
            failReasons.push('No macro routes or macro corridors are available for validation.');
        }

        if ((context.allStrategicCandidates || []).length === 0) {
            failReasons.push('No strategic region candidates are available for downstream validation.');
        }

        if ((context.chokepointRows || []).length === 0) {
            warnings.push('No official chokepoint records are available; choke usefulness was scored from degraded context.');
        }

        const selectiveRerollRecommendations = buildRecommendations(scoreEntries);
        const isValid = failReasons.length === 0 && meanScore >= PASS_THRESHOLD;
        const blockedDownstreamPhases = isValid
            ? []
            : uniqueStrings([
                'exportPackage',
                'MacroGeographyPackageAssembly'
            ]);

        const partialRegenerationRebalancePass = buildPartialRegenerationRebalancePass(
            input,
            context,
            scoreEntries,
            selectiveRerollRecommendations
        );
        const validationReport = createValidationReport({
            isValid,
            scores,
            failReasons,
            rebalanceActions: partialRegenerationRebalancePass.plannedActions.map(buildRebalanceActionLabel),
            diagnostics: {
                warnings,
                blockedDownstreamPhases
            },
            selectiveRerollRecommendations
        });

        const macroValidationDiagnostics = deepFreeze({
            outputId: VALIDATION_DIAGNOSTICS_OUTPUT_ID,
            stageId: VALIDATION_STAGE_ID,
            modelId: VALIDATION_MODEL_ID,
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            worldBounds: cloneValue(context.worldBounds),
            sourceOutputIds: context.sourceOutputIds.slice(),
            sourceCounts: {
                continentSummaryCount: (context.continentSummaries || []).length,
                seaIdentityCount: collectSeaIdentitySet(context).length,
                coastalProfileCount: (context.coastalProfiles || []).length,
                exceptionalCoastalNodeCount: (context.coastalNodes || []).length,
                routeCount: (context.routeRows || []).length,
                corridorCount: (context.corridorRows || []).length,
                chokepointCount: (context.chokepointRows || []).length,
                isolatedZoneCount: (context.isolatedZoneRows || []).length,
                peripheryClusterCount: (context.peripheryClusterRows || []).length,
                archipelagoMacrozoneCount: (context.archipelagoZoneRows || []).length,
                strategicCandidateCount: (context.allStrategicCandidates || []).length
            },
            dependencyAvailability: cloneValue(dependencyAvailability),
            scoreBreakdown: cloneValue(scoreEntries),
            thresholds: {
                passThreshold: PASS_THRESHOLD,
                warnThreshold: WARN_THRESHOLD,
                failThreshold: FAIL_THRESHOLD
            },
            summary: {
                meanScore: roundValue(meanScore),
                highestScoreKey: normalizeString(sortedScoreEntries[0] && sortedScoreEntries[0][0], 'diversity'),
                highestScore: roundValue(sortedScoreEntries[0] && sortedScoreEntries[0][1] && sortedScoreEntries[0][1].score, 0),
                lowestScoreKey: normalizeString(lowestScoreEntry[0], 'diversity'),
                lowestScore: roundValue(lowestScoreEntry[1] && lowestScoreEntry[1].score, 0),
                validationReportCompatible: true,
                validationPassed: validationReport.isValid === true,
                rebalancePassImplemented: true,
                recommendationCount: validationReport.selectiveRerollRecommendations.length,
                blockedDownstreamPhaseCount: validationReport.diagnostics.blockedDownstreamPhases.length
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        });

        return {
            validationReport,
            macroValidationDiagnostics,
            partialRegenerationRebalancePass
        };
    }

    function getMacroValidationAndRebalanceDescriptor() {
        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            phaseVersion: PHASE_VERSION,
            description: 'Partial macro validation layer that scores the Phase 1 macro world and emits diagnostics without executing rebalance or orchestration.'
        });
    }

    function getMacroValidationAndRebalanceInputContract() {
        return deepFreeze({
            requiredKeys: REQUIRED_KEYS.slice(),
            optionalKeys: OPTIONAL_KEYS.slice(),
            inputGroups: cloneValue(INPUT_GROUPS),
            scoreKeys: SCORE_KEYS.slice()
        });
    }

    function getMacroValidationAndRebalanceOutputContract() {
        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            actualOutputs: {
                fields: [],
                intermediateOutputs: [
                    VALIDATION_REPORT_OUTPUT_ID,
                    VALIDATION_DIAGNOSTICS_OUTPUT_ID,
                    REBALANCE_PASS_OUTPUT_ID
                ],
                records: [],
                debugArtifacts: []
            },
            plannedOutputs: [],
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        });
    }

    function validateAndRebalanceMacroWorld(input = {}) {
        const dependencyAvailability = describeMacroValidationDependencyAvailability(input);
        const validationOutputs = buildValidationOutputs(input, dependencyAvailability);

        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            phaseVersion: PHASE_VERSION,
            outputs: {
                fields: {},
                intermediateOutputs: {
                    [VALIDATION_REPORT_OUTPUT_ID]: validationOutputs.validationReport,
                    [VALIDATION_DIAGNOSTICS_OUTPUT_ID]: validationOutputs.macroValidationDiagnostics,
                    [REBALANCE_PASS_OUTPUT_ID]: validationOutputs.partialRegenerationRebalancePass
                },
                records: {},
                debugArtifacts: {}
            }
        });
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule(MODULE_ID, {
            entry: 'validateAndRebalanceMacroWorld',
            file: 'js/worldgen/macro/macro-validation-and-rebalance.js',
            description: 'Partial macro validation layer with six validation scores, diagnostics, and a deterministic partial-regeneration rebalance plan; upstream reruns remain orchestrator-controlled.',
            stub: false
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep(PIPELINE_STEP_ID, {
            moduleId: MODULE_ID,
            file: 'js/worldgen/macro/macro-validation-and-rebalance.js',
            description: 'Validation scoring plus deterministic partial-regeneration rebalance planning for Phase 1 macro geography.',
            stub: false
        });
    }

    Object.assign(macro, {
        getMacroValidationAndRebalanceDescriptor,
        getMacroValidationAndRebalanceInputContract,
        getMacroValidationAndRebalanceOutputContract,
        describeMacroValidationDependencyAvailability,
        validateAndRebalanceMacroWorld
    });
})();
