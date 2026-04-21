(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const MODULE_ID = 'macroGeographyGenerator';
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';
    const HANDOFF_VERSION = 'phase1-handoff-v1';
    const DOWNSTREAM_HOOK_VERSION = 'phase1-downstream-hook-v1';
    const DEFAULT_WORLD_BOUNDS = Object.freeze({
        width: 256,
        height: 128
    });
    const STAGE_SEQUENCE = Object.freeze([
        Object.freeze({ key: 'tectonicSkeleton', entry: 'generateTectonicSkeleton' }),
        Object.freeze({ key: 'reliefElevation', entry: 'generateReliefElevation' }),
        Object.freeze({ key: 'hydrosphere', entry: 'generateHydrosphere' }),
        Object.freeze({ key: 'riverSystem', entry: 'generateRiverSystem' }),
        Object.freeze({ key: 'marineCarving', entry: 'generateMarineCarving' }),
        Object.freeze({ key: 'climateEnvelope', entry: 'generateClimateEnvelope' }),
        Object.freeze({ key: 'continentalCohesion', entry: 'analyzeContinentalCohesion' }),
        Object.freeze({ key: 'coastalOpportunity', entry: 'analyzeCoastalOpportunity' }),
        Object.freeze({ key: 'connectivityGraph', entry: 'buildConnectivityGraph' }),
        Object.freeze({ key: 'chokepoints', entry: 'analyzeChokepoints' }),
        Object.freeze({ key: 'isolationPeriphery', entry: 'analyzeIsolationPeriphery' }),
        Object.freeze({ key: 'archipelagoSignificance', entry: 'generateArchipelagoSignificance' }),
        Object.freeze({
            key: 'strategicRegionSynthesis',
            aliases: ['strategicRegionSynthesizer'],
            entry: 'synthesizeStrategicRegions'
        })
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

    function normalizeInteger(value, fallback = 0) {
        const normalizedValue = Number.parseInt(value, 10);
        return Number.isFinite(normalizedValue) ? normalizedValue : fallback;
    }

    function normalizeNumber(value, fallback = 0) {
        const normalizedValue = Number(value);
        return Number.isFinite(normalizedValue) ? normalizedValue : fallback;
    }

    function normalizeString(value, fallback = '') {
        return typeof value === 'string'
            ? value
            : (typeof fallback === 'string' ? fallback : '');
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

    function uniqueStrings(values = []) {
        return Array.from(new Set(
            (Array.isArray(values) ? values : [])
                .map((value) => normalizeString(value, '').trim())
                .filter(Boolean)
        ));
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

    function getArrayAtPaths(source, candidatePaths = []) {
        for (const path of Array.isArray(candidatePaths) ? candidatePaths : []) {
            const value = getNestedValue(source, path, undefined);
            if (Array.isArray(value)) {
                return value.slice();
            }
        }

        return [];
    }

    function normalizeWorldBounds(worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedBounds = isPlainObject(worldBounds) ? worldBounds : {};
        return {
            width: Math.max(1, normalizeInteger(normalizedBounds.width, DEFAULT_WORLD_BOUNDS.width)),
            height: Math.max(1, normalizeInteger(normalizedBounds.height, DEFAULT_WORLD_BOUNDS.height))
        };
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

    function buildScopedIds(rows = [], {
        scope = '',
        limit = 4,
        filter = null,
        idResolver = null,
        scoreResolver = null
    } = {}) {
        const normalizedScope = normalizeString(scope, '');
        const safeRows = Array.isArray(rows) ? rows.slice() : [];
        const filteredRows = typeof filter === 'function'
            ? safeRows.filter((row) => filter(row))
            : safeRows;
        const sortedRows = typeof scoreResolver === 'function'
            ? filteredRows.sort((left, right) => (
                normalizeNumber(scoreResolver(right), 0) - normalizeNumber(scoreResolver(left), 0)
            ))
            : filteredRows;

        return uniqueStrings(
            sortedRows
                .slice(0, Math.max(0, normalizeInteger(limit, 4)))
                .map((row) => {
                    const identifier = typeof idResolver === 'function'
                        ? normalizeString(idResolver(row), '')
                        : '';
                    if (!identifier) {
                        return '';
                    }

                    return normalizedScope
                        ? `${normalizedScope}:${identifier}`
                        : identifier;
                })
        );
    }

    function getStageModuleSummary(stageBundle = {}, fallbackStageId = '') {
        const outputs = getNestedValue(stageBundle, 'outputs', {});
        return {
            moduleId: normalizeString(stageBundle.moduleId, fallbackStageId),
            fieldIds: Object.keys(getNestedValue(outputs, 'fields', {})).sort(),
            intermediateOutputIds: Object.keys(getNestedValue(outputs, 'intermediateOutputs', {})).sort(),
            recordIds: Object.keys(getNestedValue(outputs, 'records', {})).sort(),
            debugArtifactIds: Object.keys(getNestedValue(outputs, 'debugArtifacts', {})).sort()
        };
    }

    function resolveProvidedStageBundle(input = {}, stageDescriptor = {}) {
        const keys = [stageDescriptor.key].concat(stageDescriptor.aliases || []);
        for (const key of keys) {
            if (key && isPlainObject(input[key])) {
                return input[key];
            }
        }

        return null;
    }

    function invokeStageGenerator(stageDescriptor = {}, stageInput = {}) {
        const entryName = normalizeString(stageDescriptor.entry, '');
        if (entryName && typeof macro[entryName] === 'function') {
            return macro[entryName](stageInput);
        }

        throw typeof macro.createTodoContractedError === 'function'
            ? macro.createTodoContractedError(`macroGeographyGenerator.${stageDescriptor.key || 'stage'}:${entryName}`)
            : new Error(`[worldgen/macro] ${entryName} is unavailable.`);
    }

    function materializeStageBundles(input = {}, normalizedSeed = 0, worldBounds = DEFAULT_WORLD_BOUNDS) {
        const stageContext = {
            ...input,
            macroSeed: normalizedSeed,
            worldBounds
        };
        const stageBundles = {};

        STAGE_SEQUENCE.forEach((stageDescriptor) => {
            const providedBundle = resolveProvidedStageBundle(stageContext, stageDescriptor);
            const stageBundle = providedBundle || invokeStageGenerator(stageDescriptor, stageContext);
            stageBundles[stageDescriptor.key] = stageBundle;
            stageContext[stageDescriptor.key] = stageBundle;

            if (stageDescriptor.key === 'strategicRegionSynthesis') {
                stageContext.strategicRegionSynthesizer = stageBundle;
            }
        });

        return {
            stageContext,
            stageBundles
        };
    }

    function resolveValidationBundle(input = {}) {
        const providedValidationBundle = getNestedValue(input, 'validationRebalance', undefined);
        if (
            providedValidationBundle
            && getNestedValue(providedValidationBundle, 'outputs.intermediateOutputs.validationReport', undefined)
        ) {
            return providedValidationBundle;
        }

        return typeof macro.validateAndRebalanceMacroWorld === 'function'
            ? macro.validateAndRebalanceMacroWorld(input)
            : null;
    }

    function createArchipelagoSignificanceBand(archipelagoRows = []) {
        const topScore = archipelagoRows.length
            ? Math.max(...archipelagoRows.map((row) => (
                clampUnitInterval(
                    (normalizeNumber(row.connectiveValue, 0) * 0.45)
                    + (normalizeNumber(row.contestScore, 0) * 0.25)
                    + (normalizeNumber(row.colonizationAppeal, 0) * 0.15)
                    + ((1 - normalizeNumber(row.fragility, 0)) * 0.15),
                    0
                )
            )))
            : 0;

        if (topScore >= 0.67) {
            return 'high';
        }
        if (topScore >= 0.34) {
            return 'medium';
        }
        return 'low';
    }

    function buildMacroGeographyHandoffFromContext(input = {}) {
        const macroGeographyPackage = isPlainObject(input.macroGeographyPackage)
            ? input.macroGeographyPackage
            : {};
        const strategicRegions = Array.isArray(macroGeographyPackage.strategicRegions)
            ? macroGeographyPackage.strategicRegions.slice()
            : [];
        const macroRoutes = Array.isArray(macroGeographyPackage.macroRoutes)
            ? macroGeographyPackage.macroRoutes.slice()
            : [];
        const seaRegions = Array.isArray(macroGeographyPackage.seaRegions)
            ? macroGeographyPackage.seaRegions.slice()
            : [];
        const chokepoints = Array.isArray(macroGeographyPackage.chokepoints)
            ? macroGeographyPackage.chokepoints.slice()
            : [];
        const archipelagoRegions = Array.isArray(macroGeographyPackage.archipelagoRegions)
            ? macroGeographyPackage.archipelagoRegions.slice()
            : [];
        const exceptionalCoastalNodes = getArrayAtPaths(
            getNestedValue(input, 'coastalOpportunity.outputs.intermediateOutputs.exceptionalCoastalNodes', {}),
            ['exceptionalCoastalNodes']
        );
        const macroCorridors = getArrayAtPaths(
            getNestedValue(input, 'connectivityGraph.outputs.intermediateOutputs.macroCorridors', {}),
            ['macroCorridors']
        );
        const isolatedZones = getArrayAtPaths(
            getNestedValue(input, 'isolationPeriphery.outputs.intermediateOutputs.isolatedZones', {}),
            ['zones']
        );
        const peripheryClusters = getArrayAtPaths(
            getNestedValue(input, 'isolationPeriphery.outputs.intermediateOutputs.peripheryClusters', {}),
            ['clusters']
        );
        const archipelagoMacroZones = getArrayAtPaths(
            getNestedValue(input, 'archipelagoSignificance.outputs.intermediateOutputs.archipelagoMacroZones', {}),
            ['macroZones']
        );
        const validationReport = getNestedValue(macroGeographyPackage, 'validationReport', {})
            || getNestedValue(input, 'validationRebalance.outputs.intermediateOutputs.validationReport', {});
        const blockedPhases = uniqueStrings(getNestedValue(validationReport, 'diagnostics.blockedDownstreamPhases', []));
        const validationWarnings = uniqueStrings(getNestedValue(validationReport, 'diagnostics.warnings', []));
        const imperialCoreRegions = buildScopedIds(strategicRegions, {
            limit: 4,
            idResolver: (row) => row.regionId,
            scoreResolver: (row) => (
                normalizeNumber(row.stabilityScore, 0) * 0.6
                + normalizeNumber(row.expansionPressure, 0) * 0.4
            ),
            filter: (row) => normalizeString(row.type, '').includes('imperial_core')
        });
        const fragilePeripheries = uniqueStrings(
            buildScopedIds(strategicRegions, {
                scope: 'strategicRegion',
                limit: 3,
                idResolver: (row) => row.regionId,
                scoreResolver: (row) => 1 - normalizeNumber(row.stabilityScore, 0),
                filter: (row) => normalizeString(row.type, '').includes('fragile_periphery')
            }).concat(buildScopedIds(peripheryClusters, {
                scope: 'peripheryCluster',
                limit: 3,
                idResolver: (row) => row.clusterId,
                scoreResolver: (row) => (
                    normalizeNumber(row.lossInCollapseLikelihood, 0) * 0.5
                    + normalizeNumber(row.weatherAdjustedIsolation, 0) * 0.3
                    + normalizeNumber(row.culturalDriftPotential, 0) * 0.2
                )
            }))
        );
        const strategicSeas = buildScopedIds(seaRegions, {
            limit: 4,
            idResolver: (row) => row.seaRegionId,
            scoreResolver: (row) => (
                normalizeNumber(row.navigability, 0) * 0.6
                + ((1 - normalizeNumber(row.stormPressure, 0)) * 0.4)
            )
        });
        const routeBelts = buildScopedIds(macroRoutes, {
            limit: 5,
            idResolver: (row) => row.routeId,
            scoreResolver: (row) => (
                normalizeNumber(row.historicalImportance, 0) * 0.55
                + ((1 - normalizeNumber(row.baseCost, 1)) * 0.2)
                + ((1 - normalizeNumber(row.fragility, 1)) * 0.25)
            )
        });
        const chokeBelts = buildScopedIds(chokepoints, {
            limit: 5,
            idResolver: (row) => row.chokepointId,
            scoreResolver: (row) => (
                normalizeNumber(row.tradeDependency, 0) * 0.4
                + normalizeNumber(row.controlValue, 0) * 0.35
                + normalizeNumber(row.collapseSensitivity, 0) * 0.15
                + normalizeNumber(row.bypassDifficulty, 0) * 0.1
            )
        });
        const highAppealCorridors = uniqueStrings(
            archipelagoRegions
                .filter((region) => normalizeNumber(region.colonizationAppeal, 0) >= 0.55)
                .flatMap((region) => uniqueStrings(region.macroRouteIds))
                .slice(0, 5)
        );
        const replicationFriendlyCoasts = buildScopedIds(exceptionalCoastalNodes, {
            limit: 5,
            idResolver: (row) => row.coastalNodeId,
            scoreResolver: (row) => (
                normalizeNumber(row.coastalOpportunityScore, 0) * 0.65
                + normalizeNumber(row.exceptionalityScore, 0) * 0.35
            )
        });
        const frontierPressureZones = uniqueStrings(
            buildScopedIds(peripheryClusters, {
                scope: 'peripheryCluster',
                limit: 4,
                idResolver: (row) => row.clusterId,
                scoreResolver: (row) => (
                    normalizeNumber(row.lossInCollapseLikelihood, 0) * 0.55
                    + normalizeNumber(row.weatherAdjustedIsolation, 0) * 0.45
                )
            }).concat(buildScopedIds(isolatedZones, {
                scope: 'isolatedZone',
                limit: 4,
                idResolver: (row) => row.zoneId,
                scoreResolver: (row) => (
                    normalizeNumber(row.lossInCollapseLikelihood, 0) * 0.55
                    + normalizeNumber(row.weatherAdjustedIsolation, 0) * 0.45
                )
            }))
        );
        const maritimeRivalryZones = uniqueStrings(
            buildScopedIds(strategicRegions, {
                scope: 'strategicRegion',
                limit: 4,
                idResolver: (row) => row.regionId,
                scoreResolver: (row) => normalizeNumber(row.expansionPressure, 0),
                filter: (row) => normalizeString(row.type, '').includes('disputed')
            }).concat(buildScopedIds(archipelagoMacroZones, {
                scope: 'archipelago',
                limit: 4,
                idResolver: (row) => row.archipelagoId,
                scoreResolver: (row) => normalizeNumber(row.contestScore, 0)
            }))
        );
        const controlSensitiveChokepoints = buildScopedIds(chokepoints, {
            limit: 5,
            idResolver: (row) => row.chokepointId,
            scoreResolver: (row) => (
                normalizeNumber(row.controlValue, 0) * 0.5
                + normalizeNumber(row.tradeDependency, 0) * 0.3
                + normalizeNumber(row.collapseSensitivity, 0) * 0.2
            )
        });
        const coalitionPressureRegions = buildScopedIds(strategicRegions, {
            limit: 4,
            idResolver: (row) => row.regionId,
            scoreResolver: (row) => (
                normalizeNumber(row.expansionPressure, 0) * 0.55
                + normalizeNumber(row.stabilityScore, 0) * 0.2
                + (
                    normalizeString(row.type, '').includes('trade_belt')
                    || normalizeString(row.type, '').includes('disputed')
                        ? 0.25
                        : 0
                )
            ),
            filter: (row) => (
                normalizeString(row.type, '').includes('trade_belt')
                || normalizeString(row.type, '').includes('disputed')
            )
        });
        const routeCascadeCandidates = uniqueStrings(
            buildScopedIds(macroCorridors, {
                scope: 'macroCorridor',
                limit: 5,
                idResolver: (row) => row.corridorId,
                scoreResolver: (row) => (
                    normalizeNumber(row.routeDependenceScore, 0) * 0.45
                    + normalizeNumber(row.structureFragilityScore, 0) * 0.2
                    + normalizeNumber(row.supportScore, 0) * 0.15
                    + (row.mandatoryCorridor ? 0.12 : 0)
                    + (row.brittleCorridor ? 0.08 : 0)
                )
            }).concat(buildScopedIds(macroRoutes, {
                scope: 'macroRoute',
                limit: 4,
                idResolver: (row) => row.routeId,
                scoreResolver: (row) => (
                    normalizeNumber(row.fragility, 0) * 0.7
                    + normalizeNumber(row.historicalImportance, 0) * 0.3
                )
            }))
        );
        const specialistLossSensitiveRegions = uniqueStrings(
            buildScopedIds(archipelagoMacroZones, {
                scope: 'archipelago',
                limit: 4,
                idResolver: (row) => row.archipelagoId,
                scoreResolver: (row) => (
                    normalizeNumber(row.fragility, 0) * 0.4
                    + normalizeNumber(row.collapseSusceptibility, 0) * 0.35
                    + normalizeNumber(row.contestScore, 0) * 0.25
                )
            }).concat(buildScopedIds(strategicRegions, {
                scope: 'strategicRegion',
                limit: 3,
                idResolver: (row) => row.regionId,
                scoreResolver: (row) => (
                    (1 - normalizeNumber(row.stabilityScore, 0))
                    + normalizeNumber(row.expansionPressure, 0)
                ) / 2
            }))
        );
        const peripheryLossCandidates = uniqueStrings(
            buildScopedIds(peripheryClusters, {
                scope: 'peripheryCluster',
                limit: 4,
                idResolver: (row) => row.clusterId,
                scoreResolver: (row) => normalizeNumber(row.lossInCollapseLikelihood, 0)
            }).concat(buildScopedIds(isolatedZones, {
                scope: 'isolatedZone',
                limit: 4,
                idResolver: (row) => row.zoneId,
                scoreResolver: (row) => normalizeNumber(row.lossInCollapseLikelihood, 0)
            }))
        );
        const orderedArchipelagos = archipelagoMacroZones.slice().sort((left, right) => (
            (
                normalizeNumber(right.connectiveValue, 0)
                + normalizeNumber(right.contestScore, 0)
                + normalizeNumber(right.colonizationAppeal, 0)
            ) - (
                normalizeNumber(left.connectiveValue, 0)
                + normalizeNumber(left.contestScore, 0)
                + normalizeNumber(left.colonizationAppeal, 0)
            )
        ));
        const primaryArchipelago = orderedArchipelagos[0] || {};

        return deepFreeze({
            version: HANDOFF_VERSION,
            summaryForHistoryPhase: {
                coreRegions: imperialCoreRegions,
                fragilePeripheries,
                strategicSeas,
                routeBelts,
                chokeBelts,
                archipelagoSignificanceBand: createArchipelagoSignificanceBand(archipelagoMacroZones)
            },
            colonizationHints: {
                highAppealCorridors: uniqueStrings(highAppealCorridors.length ? highAppealCorridors : routeBelts.slice(0, 4)),
                replicationFriendlyCoasts,
                frontierPressureZones
            },
            strategicHintsForPolitics: {
                empireCandidates: imperialCoreRegions,
                maritimeRivalryZones,
                controlSensitiveChokepoints,
                coalitionPressureRegions
            },
            collapsePressureSeeds: {
                routeCascadeCandidates,
                specialistLossSensitiveRegions,
                peripheryLossCandidates,
                archipelagoCollapseSensitivity: clampUnitInterval(
                    computeMean(archipelagoMacroZones.map((row) => row.collapseSusceptibility), 0),
                    0
                )
            },
            archipelagoRoleSeeds: {
                archipelagoCandidates: buildScopedIds(orderedArchipelagos, {
                    limit: 4,
                    idResolver: (row) => row.archipelagoId,
                    scoreResolver: (row) => (
                        normalizeNumber(row.connectiveValue, 0) * 0.4
                        + normalizeNumber(row.contestScore, 0) * 0.25
                        + normalizeNumber(row.colonizationAppeal, 0) * 0.2
                        + ((1 - normalizeNumber(row.fragility, 0)) * 0.15)
                    )
                }),
                connectiveValue: clampUnitInterval(normalizeNumber(primaryArchipelago.connectiveValue, 0), 0),
                fragility: clampUnitInterval(normalizeNumber(primaryArchipelago.fragility, 0), 0),
                contestValue: clampUnitInterval(normalizeNumber(primaryArchipelago.contestScore, 0), 0),
                historicalRoleBias: normalizeString(
                    getNestedValue(primaryArchipelago, 'roleSeedHints.primaryRoleSeed', ''),
                    'strategic_bridge_periphery'
                )
            },
            validationSummary: {
                isUsableDownstream: getNestedValue(validationReport, 'isValid', false) !== false && blockedPhases.length === 0,
                warnings: validationWarnings,
                blockedPhases
            }
        });
    }

    function buildMacroGeographyHandoffPackage(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const macroGeographyPackage = isPlainObject(normalizedInput.macroGeographyPackage)
            ? normalizedInput.macroGeographyPackage
            : generateMacroGeographyPackage({
                ...normalizedInput,
                includeDebugArtifacts: false
            });

        return buildMacroGeographyHandoffFromContext({
            ...normalizedInput,
            macroGeographyPackage
        });
    }

    function buildDownstreamGeneratorIntegrationHook(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const macroGeographyPackage = isPlainObject(normalizedInput.macroGeographyPackage)
            ? normalizedInput.macroGeographyPackage
            : {};
        const macroGeographyHandoffPackage = isPlainObject(normalizedInput.macroGeographyHandoffPackage)
            ? normalizedInput.macroGeographyHandoffPackage
            : buildMacroGeographyHandoffPackage(normalizedInput);
        const debugBundle = isPlainObject(normalizedInput.endToEndDebugExport)
            ? normalizedInput.endToEndDebugExport
            : null;

        return deepFreeze({
            hookId: 'phase1MacroGeographyDownstream',
            version: DOWNSTREAM_HOOK_VERSION,
            deterministic: true,
            macroSeed: typeof macro.normalizeSeed === 'function'
                ? macro.normalizeSeed(getNestedValue(macroGeographyPackage, 'macroSeed', normalizedInput.macroSeed))
                : normalizeInteger(getNestedValue(macroGeographyPackage, 'macroSeed', normalizedInput.macroSeed), 0),
            packageVersion: normalizeString(macroGeographyPackage.version, PHASE_VERSION),
            handoffVersion: normalizeString(macroGeographyHandoffPackage.version, HANDOFF_VERSION),
            providedArtifacts: [
                'MacroGeographyPackage',
                'MacroGeographyHandoffPackage'
            ].concat(debugBundle ? ['physicalWorldDebugBundle'] : []),
            nextPhaseSectionMap: {
                history: 'summaryForHistoryPhase',
                colonization: 'colonizationHints',
                politics: 'strategicHintsForPolitics',
                collapse: 'collapsePressureSeeds',
                archipelago: 'archipelagoRoleSeeds'
            },
            validationSummary: cloneValue(macroGeographyHandoffPackage.validationSummary || {}),
            debugBundleIncluded: Boolean(debugBundle)
        });
    }

    function buildStageOutputIndex(stageBundles = {}) {
        return Object.fromEntries(
            Object.entries(stageBundles).map(([stageId, stageBundle]) => [
                stageId,
                getStageModuleSummary(stageBundle, stageId)
            ])
        );
    }

    function generateMacroGeographyEndToEnd(input = {}) {
        const normalizedSeed = typeof macro.normalizeSeed === 'function'
            ? macro.normalizeSeed(hasOwn(input, 'macroSeed') ? input.macroSeed : input.seed)
            : 0;
        const worldBounds = normalizeWorldBounds(
            hasOwn(input, 'worldBounds')
                ? input.worldBounds
                : getNestedValue(input, 'reliefElevation.worldBounds', DEFAULT_WORLD_BOUNDS)
        );
        const includeDebugArtifacts = hasOwn(input, 'includeDebugArtifacts')
            ? input.includeDebugArtifacts !== false
            : true;
        const stageMaterialization = materializeStageBundles(input, normalizedSeed, worldBounds);
        const stageContext = stageMaterialization.stageContext;
        const stageBundles = stageMaterialization.stageBundles;
        const validationBundle = resolveValidationBundle({
            ...stageContext,
            validationRebalance: input.validationRebalance,
            macroSeed: normalizedSeed,
            worldBounds
        });

        if (typeof macro.buildMacroGeographyPackage !== 'function') {
            throw typeof macro.createTodoContractedError === 'function'
                ? macro.createTodoContractedError(`macroGeographyGenerator.generateMacroGeographyEndToEnd(seed=${normalizedSeed})`)
                : new Error('[worldgen/macro] buildMacroGeographyPackage is unavailable.');
        }

        const packageInput = {
            ...stageContext,
            macroSeed: normalizedSeed,
            worldBounds,
            validationRebalance: validationBundle || input.validationRebalance
        };
        const baseMacroGeographyPackage = macro.buildMacroGeographyPackage(packageInput);
        const macroGeographyHandoffPackage = buildMacroGeographyHandoffFromContext({
            ...stageContext,
            macroSeed: normalizedSeed,
            worldBounds,
            validationRebalance: validationBundle,
            macroGeographyPackage: baseMacroGeographyPackage
        });
        const endToEndDebugExport = includeDebugArtifacts && typeof macro.buildDebugArtifactBundle === 'function'
            ? macro.buildDebugArtifactBundle({
                ...stageContext,
                macroSeed: normalizedSeed,
                worldBounds,
                validationRebalance: validationBundle,
                macroGeographyPackage: baseMacroGeographyPackage,
                macroGeographyHandoffPackage
            })
            : null;
        const finalMacroGeographyPackage = endToEndDebugExport
            ? macro.buildMacroGeographyPackage({
                ...packageInput,
                debugArtifacts: {
                    physicalWorldDebugBundle: endToEndDebugExport
                }
            })
            : baseMacroGeographyPackage;
        const downstreamIntegrationHook = buildDownstreamGeneratorIntegrationHook({
            macroSeed: normalizedSeed,
            macroGeographyPackage: finalMacroGeographyPackage,
            macroGeographyHandoffPackage,
            endToEndDebugExport
        });

        return deepFreeze({
            moduleId: MODULE_ID,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            deterministic: true,
            macroSeed: normalizedSeed,
            worldBounds,
            macroGeographyPackage: finalMacroGeographyPackage,
            macroGeographyHandoffPackage,
            endToEndDebugExport,
            downstreamIntegrationHook,
            stageOutputIndex: buildStageOutputIndex(stageBundles)
        });
    }

    function generateMacroGeographyPackage(input = {}) {
        return generateMacroGeographyEndToEnd({
            ...input,
            includeDebugArtifacts: hasOwn(input, 'includeDebugArtifacts')
                ? input.includeDebugArtifacts
                : false
        }).macroGeographyPackage;
    }

    function getMacroGenerationScaffoldStatus() {
        const registeredModules = typeof macro.getRegisteredModules === 'function'
            ? macro.getRegisteredModules()
            : [];
        const pipelineSteps = typeof macro.getPipelineStepDescriptors === 'function'
            ? macro.getPipelineStepDescriptors()
            : [];
        const expectedPipeline = typeof macro.getExpectedPipelineStepIds === 'function'
            ? macro.getExpectedPipelineStepIds()
            : [];

        return deepFreeze({
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            handoffVersion: HANDOFF_VERSION,
            stub: false,
            registeredModuleCount: registeredModules.length,
            registeredModules: cloneValue(registeredModules),
            expectedPipeline: cloneValue(expectedPipeline),
            pipelineSteps: cloneValue(pipelineSteps),
            builderAvailable: typeof macro.buildMacroGeographyPackage === 'function',
            validationLayerAvailable: typeof macro.validateAndRebalanceMacroWorld === 'function',
            packageContractAvailable: typeof macro.getMacroGeographyPackageContract === 'function',
            debugBundleBuilderAvailable: typeof macro.buildDebugArtifactBundle === 'function',
            handoffBuilderAvailable: true,
            endToEndGeneratorAvailable: true
        });
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule(MODULE_ID, {
            entry: 'generateMacroGeographyEndToEnd',
            file: 'js/worldgen/macro/macro-geography-generator.js',
            description: 'Seed-deterministic Phase 1 orchestrator that can materialize end-to-end stage outputs, assemble MacroGeographyPackage, build the official downstream handoff, emit the canonical debug bundle, and expose a downstream integration hook.',
            stub: false
        });
    }

    Object.assign(macro, {
        buildMacroGeographyHandoffPackage,
        buildDownstreamGeneratorIntegrationHook,
        generateMacroGeographyPackage,
        generateMacroGeographyEndToEnd,
        getMacroGenerationScaffoldStatus
    });
})();
