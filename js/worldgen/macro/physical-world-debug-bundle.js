(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const CONTRACT_ID = 'physicalWorldDebugBundle';
    const BUNDLE_ARTIFACT_KIND = 'physicalWorldDebugBundle';
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';
    const ROOT_REQUIRED_KEYS = Object.freeze([
        'artifactKind',
        'phaseId',
        'phaseVersion',
        'macroSeed',
        'seedArtifacts',
        'fieldSnapshots',
        'graphSnapshots',
        'summaries',
        'intermediateOutputs',
        'validationArtifacts',
        'metadata'
    ]);
    const ENTRY_REQUIRED_KEYS = Object.freeze([
        'artifactId',
        'artifactKind',
        'stageId',
        'sourceLayerId',
        'payload'
    ]);
    const ENTRY_CATEGORY_KINDS = deepFreeze({
        seedArtifacts: ['seedProfileSnapshot'],
        fieldSnapshots: ['fieldSnapshot'],
        graphSnapshots: ['graphSnapshot'],
        summaries: ['summary'],
        intermediateOutputs: ['recordSet', 'fieldSet', 'analysisStage', 'intermediateOutput'],
        validationArtifacts: ['validationReport']
    });

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
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function normalizeSeed(seed) {
        return typeof macro.normalizeSeed === 'function'
            ? macro.normalizeSeed(seed)
            : 0;
    }

    function normalizeNumber(value, fallback = 0) {
        const normalizedValue = Number(value);
        return Number.isFinite(normalizedValue) ? normalizedValue : fallback;
    }

    function normalizeInteger(value, fallback = 0) {
        const normalizedValue = Number.parseInt(value, 10);
        return Number.isFinite(normalizedValue) ? normalizedValue : fallback;
    }

    function normalizeString(value, fallback = '') {
        return typeof value === 'string' && value.trim()
            ? value.trim()
            : fallback;
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

    function uniqueStrings(values = []) {
        return Array.from(new Set(
            (Array.isArray(values) ? values : [])
                .map((value) => normalizeString(value, ''))
                .filter(Boolean)
        ));
    }

    function flattenArtifacts(collection) {
        if (Array.isArray(collection)) {
            return collection.slice();
        }

        if (!isPlainObject(collection)) {
            return [];
        }

        return Object.values(collection).flatMap((value) => flattenArtifacts(value));
    }

    function summarizeArray(values = []) {
        const normalizedValues = Array.isArray(values) ? values : [];
        const sampleRows = normalizedValues.slice(0, 3);
        const sampleIds = uniqueStrings(sampleRows.map((row) => (
            isPlainObject(row)
                ? row.id
                    || row.routeId
                    || row.regionId
                    || row.archipelagoId
                    || row.chokepointId
                    || row.zoneId
                    || row.clusterId
                    || row.continentId
                    || row.seaRegionId
                    || row.reliefRegionId
                    || row.mountainSystemId
                    || row.volcanicZoneId
                    || row.riverBasinId
                    || row.plateId
                    || row.climateBandId
                    || row.coastalNodeId
                    || row.strategicCandidateId
                    || row.corridorId
                    || row.artifactId
                : ''
        )));

        return {
            valueType: 'array',
            count: normalizedValues.length,
            sampleIds,
            sampleKeys: sampleRows.length && isPlainObject(sampleRows[0])
                ? Object.keys(sampleRows[0]).slice(0, 10)
                : []
        };
    }

    function summarizeObject(value = {}) {
        const normalizedValue = isPlainObject(value) ? value : {};
        const summary = {
            valueType: 'object',
            keyCount: Object.keys(normalizedValue).length,
            keys: Object.keys(normalizedValue).slice(0, 16)
        };

        if (Array.isArray(normalizedValue.nodes)) {
            summary.nodeCount = normalizedValue.nodes.length;
        }

        if (Array.isArray(normalizedValue.edges)) {
            summary.edgeCount = normalizedValue.edges.length;
        }

        if (Array.isArray(normalizedValue.continentSummaries)) {
            summary.continentSummaryCount = normalizedValue.continentSummaries.length;
        }

        if (Array.isArray(normalizedValue.candidateRoutes)) {
            summary.sampledRouteCount = normalizedValue.candidateRoutes.length;
        }

        if (Array.isArray(normalizedValue.macroCorridors)) {
            summary.corridorCount = normalizedValue.macroCorridors.length;
        }

        if (Array.isArray(normalizedValue.macroZones)) {
            summary.archipelagoMacrozoneCount = normalizedValue.macroZones.length;
        }

        if (Array.isArray(normalizedValue.zones)) {
            summary.zoneCount = normalizedValue.zones.length;
        }

        if (Array.isArray(normalizedValue.clusters)) {
            summary.clusterCount = normalizedValue.clusters.length;
        }

        if (Array.isArray(normalizedValue.chokepoints)) {
            summary.chokepointCount = normalizedValue.chokepoints.length;
        }

        if (Array.isArray(normalizedValue.candidateRoutes)) {
            summary.routeModeMix = uniqueStrings(normalizedValue.candidateRoutes.map((route) => route.routeMode));
        }

        if (typeof normalizedValue.width === 'number' || typeof normalizedValue.height === 'number') {
            summary.worldBounds = {
                width: Math.max(0, normalizeInteger(normalizedValue.width, 0)),
                height: Math.max(0, normalizeInteger(normalizedValue.height, 0))
            };
        }

        return summary;
    }

    function summarizeValue(value) {
        if (Array.isArray(value)) {
            return summarizeArray(value);
        }

        if (isPlainObject(value)) {
            return summarizeObject(value);
        }

        if (typeof value === 'string') {
            return {
                valueType: 'string',
                value: value.slice(0, 128)
            };
        }

        if (typeof value === 'number' || typeof value === 'boolean') {
            return {
                valueType: typeof value,
                value
            };
        }

        if (value === null) {
            return {
                valueType: 'null',
                value: null
            };
        }

        return {
            valueType: typeof value,
            value: value === undefined ? null : `${value}`
        };
    }

    function createArtifactEntry({
        artifactId = '',
        artifactKind = '',
        stageId = '',
        sourceLayerId = '',
        payload = {}
    } = {}, categoryId = '') {
        return normalizeArtifactEntry({
            artifactId,
            artifactKind,
            stageId,
            sourceLayerId,
            payload
        }, categoryId);
    }

    function collectStageDebugArtifacts(stageId, stageBundle, categories) {
        const debugArtifacts = flattenArtifacts(getNestedValue(stageBundle, 'outputs.debugArtifacts', []));
        debugArtifacts.forEach((artifact, index) => {
            if (!isPlainObject(artifact)) {
                return;
            }

            const artifactKind = normalizeString(artifact.artifactKind, '');
            const normalizedStageId = normalizeString(artifact.stageId, stageId);
            const sourceLayerId = normalizeString(artifact.sourceLayerId, normalizedStageId);
            const artifactId = normalizeString(
                artifact.artifactId,
                `${normalizedStageId}_debug_${String(index + 1).padStart(3, '0')}`
            );
            const payload = isPlainObject(artifact.payload)
                ? artifact.payload
                : summarizeValue(artifact);

            if (artifactKind === 'fieldSnapshot') {
                categories.fieldSnapshots.push(createArtifactEntry({
                    artifactId,
                    artifactKind,
                    stageId: normalizedStageId,
                    sourceLayerId,
                    payload
                }, 'fieldSnapshots'));
            } else if (artifactKind === 'graphSnapshot') {
                categories.graphSnapshots.push(createArtifactEntry({
                    artifactId,
                    artifactKind,
                    stageId: normalizedStageId,
                    sourceLayerId,
                    payload
                }, 'graphSnapshots'));
            } else if (artifactKind === 'summary') {
                categories.summaries.push(createArtifactEntry({
                    artifactId,
                    artifactKind,
                    stageId: normalizedStageId,
                    sourceLayerId,
                    payload
                }, 'summaries'));
            } else if (artifactKind === 'validationReport') {
                categories.validationArtifacts.push(createArtifactEntry({
                    artifactId,
                    artifactKind,
                    stageId: normalizedStageId,
                    sourceLayerId,
                    payload
                }, 'validationArtifacts'));
            }
        });
    }

    function collectStageOutputSummaries(stageId, stageBundle, intermediateOutputs) {
        const fields = getNestedValue(stageBundle, 'outputs.fields', {});
        const records = getNestedValue(stageBundle, 'outputs.records', {});
        const outputs = getNestedValue(stageBundle, 'outputs.intermediateOutputs', {});

        if (isPlainObject(fields) && Object.keys(fields).length) {
            intermediateOutputs.push(createArtifactEntry({
                artifactId: `${stageId}_fields`,
                artifactKind: 'fieldSet',
                stageId,
                sourceLayerId: 'fields',
                payload: {
                    fieldIds: Object.keys(fields).sort(),
                    fieldCount: Object.keys(fields).length,
                    summaries: Object.fromEntries(
                        Object.keys(fields)
                            .sort()
                            .map((fieldId) => [fieldId, summarizeValue(fields[fieldId])])
                    )
                }
            }, 'intermediateOutputs'));
        }

        if (isPlainObject(records) && Object.keys(records).length) {
            intermediateOutputs.push(createArtifactEntry({
                artifactId: `${stageId}_records`,
                artifactKind: 'recordSet',
                stageId,
                sourceLayerId: 'records',
                payload: {
                    recordIds: Object.keys(records).sort(),
                    recordCount: Object.keys(records).length,
                    summaries: Object.fromEntries(
                        Object.keys(records)
                            .sort()
                            .map((recordId) => [recordId, summarizeValue(records[recordId])])
                    )
                }
            }, 'intermediateOutputs'));
        }

        if (isPlainObject(outputs) && Object.keys(outputs).length) {
            Object.keys(outputs)
                .sort()
                .forEach((outputId) => {
                    intermediateOutputs.push(createArtifactEntry({
                        artifactId: `${stageId}_${outputId}`,
                        artifactKind: 'intermediateOutput',
                        stageId,
                        sourceLayerId: outputId,
                        payload: summarizeValue(outputs[outputId])
                    }, 'intermediateOutputs'));
                });
        }
    }

    function buildConnectivityGraphSnapshots(input = {}) {
        const graphDescriptors = [
            ['landConnectivityGraph', 'land_connectivity_graph'],
            ['seaConnectivityGraph', 'sea_connectivity_graph'],
            ['hybridConnectivityGraph', 'hybrid_connectivity_graph']
        ];
        const snapshots = [];

        graphDescriptors.forEach(([outputId, artifactId]) => {
            const graph = getNestedValue(input, `connectivityGraph.outputs.intermediateOutputs.${outputId}`, null);
            if (!isPlainObject(graph)) {
                return;
            }

            snapshots.push(createArtifactEntry({
                artifactId,
                artifactKind: 'graphSnapshot',
                stageId: 'connectivityGraph',
                sourceLayerId: outputId,
                payload: summarizeValue(graph)
            }, 'graphSnapshots'));
        });

        return snapshots;
    }

    function buildSummaryEntries(input = {}) {
        const summaries = [];
        const macroGeographyPackage = getNestedValue(input, 'macroGeographyPackage', null);
        const macroGeographyHandoffPackage = getNestedValue(input, 'macroGeographyHandoffPackage', null);
        const validationReport = getNestedValue(input, 'validationRebalance.outputs.intermediateOutputs.validationReport', null)
            || getNestedValue(input, 'validationReport', null)
            || getNestedValue(macroGeographyPackage, 'validationReport', null);

        if (isPlainObject(macroGeographyPackage)) {
            summaries.push(createArtifactEntry({
                artifactId: 'macro_geography_package_summary',
                artifactKind: 'summary',
                stageId: 'macroGeographyGenerator',
                sourceLayerId: 'macroGeographyPackage',
                payload: {
                    version: normalizeString(macroGeographyPackage.version, PHASE_VERSION),
                    macroSeed: normalizeSeed(macroGeographyPackage.macroSeed),
                    worldBounds: summarizeObject(getNestedValue(macroGeographyPackage, 'worldBounds', {})).worldBounds || {},
                    counts: {
                        plates: Array.isArray(macroGeographyPackage.plates) ? macroGeographyPackage.plates.length : 0,
                        continents: Array.isArray(macroGeographyPackage.continents) ? macroGeographyPackage.continents.length : 0,
                        seaRegions: Array.isArray(macroGeographyPackage.seaRegions) ? macroGeographyPackage.seaRegions.length : 0,
                        mountainSystems: Array.isArray(macroGeographyPackage.mountainSystems) ? macroGeographyPackage.mountainSystems.length : 0,
                        volcanicZones: Array.isArray(macroGeographyPackage.volcanicZones) ? macroGeographyPackage.volcanicZones.length : 0,
                        riverBasins: Array.isArray(macroGeographyPackage.riverBasins) ? macroGeographyPackage.riverBasins.length : 0,
                        climateBands: Array.isArray(macroGeographyPackage.climateBands) ? macroGeographyPackage.climateBands.length : 0,
                        reliefRegions: Array.isArray(macroGeographyPackage.reliefRegions) ? macroGeographyPackage.reliefRegions.length : 0,
                        archipelagoRegions: Array.isArray(macroGeographyPackage.archipelagoRegions) ? macroGeographyPackage.archipelagoRegions.length : 0,
                        chokepoints: Array.isArray(macroGeographyPackage.chokepoints) ? macroGeographyPackage.chokepoints.length : 0,
                        macroRoutes: Array.isArray(macroGeographyPackage.macroRoutes) ? macroGeographyPackage.macroRoutes.length : 0,
                        strategicRegions: Array.isArray(macroGeographyPackage.strategicRegions) ? macroGeographyPackage.strategicRegions.length : 0
                    },
                    validationStatus: {
                        isValid: getNestedValue(macroGeographyPackage, 'validationReport.isValid', false) !== false,
                        blockedDownstreamPhases: getNestedValue(
                            macroGeographyPackage,
                            'validationReport.diagnostics.blockedDownstreamPhases',
                            []
                        )
                    }
                }
            }, 'summaries'));
        }

        if (isPlainObject(macroGeographyHandoffPackage)) {
            summaries.push(createArtifactEntry({
                artifactId: 'macro_geography_handoff_summary',
                artifactKind: 'summary',
                stageId: 'macroGeographyGenerator',
                sourceLayerId: 'macroGeographyHandoffPackage',
                payload: {
                    version: normalizeString(macroGeographyHandoffPackage.version, 'phase1-handoff-v1'),
                    coreRegionCount: Array.isArray(getNestedValue(macroGeographyHandoffPackage, 'summaryForHistoryPhase.coreRegions', []))
                        ? macroGeographyHandoffPackage.summaryForHistoryPhase.coreRegions.length
                        : 0,
                    routeBeltCount: Array.isArray(getNestedValue(macroGeographyHandoffPackage, 'summaryForHistoryPhase.routeBelts', []))
                        ? macroGeographyHandoffPackage.summaryForHistoryPhase.routeBelts.length
                        : 0,
                    chokeBeltCount: Array.isArray(getNestedValue(macroGeographyHandoffPackage, 'summaryForHistoryPhase.chokeBelts', []))
                        ? macroGeographyHandoffPackage.summaryForHistoryPhase.chokeBelts.length
                        : 0,
                    archipelagoRoleBias: normalizeString(getNestedValue(macroGeographyHandoffPackage, 'archipelagoRoleSeeds.historicalRoleBias', ''), ''),
                    downstreamUsable: getNestedValue(macroGeographyHandoffPackage, 'validationSummary.isUsableDownstream', false) === true
                }
            }, 'summaries'));
        }

        if (isPlainObject(validationReport)) {
            summaries.push(createArtifactEntry({
                artifactId: 'macro_validation_summary',
                artifactKind: 'summary',
                stageId: 'macroValidationAndRebalance',
                sourceLayerId: 'validationReport',
                payload: summarizeValue(validationReport)
            }, 'summaries'));
        }

        return summaries;
    }

    function buildValidationArtifacts(input = {}) {
        const validationReport = getNestedValue(input, 'validationRebalance.outputs.intermediateOutputs.validationReport', null)
            || getNestedValue(input, 'validationReport', null)
            || getNestedValue(input, 'macroGeographyPackage.validationReport', null);

        if (!isPlainObject(validationReport)) {
            return [];
        }

        return [
            createArtifactEntry({
                artifactId: 'macro_validation_report',
                artifactKind: 'validationReport',
                stageId: 'macroValidationAndRebalance',
                sourceLayerId: 'validationReport',
                payload: validationReport
            }, 'validationArtifacts')
        ];
    }

    function buildSeedArtifacts(input = {}) {
        const macroSeed = normalizeSeed(
            hasOwn(input, 'macroSeed')
                ? input.macroSeed
                : getNestedValue(input, 'macroGeographyPackage.macroSeed', 0)
        );
        const worldBounds = getNestedValue(input, 'worldBounds', {})
            || getNestedValue(input, 'macroGeographyPackage.worldBounds', {});

        return [
            createArtifactEntry({
                artifactId: 'macro_seed_context',
                artifactKind: 'seedProfileSnapshot',
                stageId: 'macroGeographyGenerator',
                sourceLayerId: 'macroSeed',
                payload: {
                    macroSeed,
                    phaseId: macro.phaseId || 'phase1',
                    phaseVersion: PHASE_VERSION,
                    worldBounds: summarizeObject(worldBounds).worldBounds || {},
                    providedTopLevelKeys: Object.keys(isPlainObject(input) ? input : {}).sort()
                }
            }, 'seedArtifacts')
        ];
    }

    function buildBundleMetadata({
        seedArtifacts = [],
        fieldSnapshots = [],
        graphSnapshots = [],
        summaries = [],
        intermediateOutputs = [],
        validationArtifacts = [],
        stageIds = [],
        input = {}
    } = {}) {
        return {
            bundleScope: 'phase1_end_to_end',
            deterministic: true,
            stageIds: uniqueStrings(stageIds).sort(),
            categoryCounts: {
                seedArtifacts: seedArtifacts.length,
                fieldSnapshots: fieldSnapshots.length,
                graphSnapshots: graphSnapshots.length,
                summaries: summaries.length,
                intermediateOutputs: intermediateOutputs.length,
                validationArtifacts: validationArtifacts.length
            },
            includesPackage: isPlainObject(getNestedValue(input, 'macroGeographyPackage', null)),
            includesHandoffPackage: isPlainObject(getNestedValue(input, 'macroGeographyHandoffPackage', null)),
            includesValidationBundle: isPlainObject(getNestedValue(input, 'validationRebalance', null))
        };
    }

    function normalizeArtifactEntry(entry = {}, categoryId = '') {
        const normalizedEntry = isPlainObject(entry) ? entry : {};
        const allowedKinds = hasOwn(ENTRY_CATEGORY_KINDS, categoryId)
            ? ENTRY_CATEGORY_KINDS[categoryId]
            : [];

        return {
            artifactId: normalizeString(normalizedEntry.artifactId, ''),
            artifactKind: normalizeString(normalizedEntry.artifactKind, allowedKinds[0] || ''),
            stageId: normalizeString(normalizedEntry.stageId, ''),
            sourceLayerId: normalizeString(normalizedEntry.sourceLayerId, ''),
            payload: isPlainObject(normalizedEntry.payload)
                ? cloneValue(normalizedEntry.payload)
                : {}
        };
    }

    function normalizeArtifactEntries(entries = [], categoryId = '') {
        return Array.isArray(entries)
            ? entries.map((entry) => normalizeArtifactEntry(entry, categoryId))
            : [];
    }

    function createPhysicalWorldDebugBundleSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};

        return {
            artifactKind: BUNDLE_ARTIFACT_KIND,
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: PHASE_VERSION,
            macroSeed: normalizeSeed(normalizedInput.macroSeed),
            seedArtifacts: normalizeArtifactEntries(normalizedInput.seedArtifacts, 'seedArtifacts'),
            fieldSnapshots: normalizeArtifactEntries(normalizedInput.fieldSnapshots, 'fieldSnapshots'),
            graphSnapshots: normalizeArtifactEntries(normalizedInput.graphSnapshots, 'graphSnapshots'),
            summaries: normalizeArtifactEntries(normalizedInput.summaries, 'summaries'),
            intermediateOutputs: normalizeArtifactEntries(normalizedInput.intermediateOutputs, 'intermediateOutputs'),
            validationArtifacts: normalizeArtifactEntries(normalizedInput.validationArtifacts, 'validationArtifacts'),
            metadata: isPlainObject(normalizedInput.metadata)
                ? cloneValue(normalizedInput.metadata)
                : {}
        };
    }

    function pushError(errors, message) {
        errors.push(`[${CONTRACT_ID}] ${message}`);
    }

    function collectArtifactEntryErrors(entries, categoryId, errors, path) {
        if (!Array.isArray(entries)) {
            pushError(errors, `"${path}" must be an array.`);
            return;
        }

        const allowedKinds = ENTRY_CATEGORY_KINDS[categoryId] || [];

        entries.forEach((entry, index) => {
            const entryPath = `${path}[${index}]`;
            if (!isPlainObject(entry)) {
                pushError(errors, `"${entryPath}" must be an object.`);
                return;
            }

            ENTRY_REQUIRED_KEYS.forEach((key) => {
                if (!hasOwn(entry, key)) {
                    pushError(errors, `"${entryPath}.${key}" is required.`);
                }
            });

            ['artifactId', 'artifactKind', 'stageId', 'sourceLayerId'].forEach((key) => {
                if (hasOwn(entry, key) && (typeof entry[key] !== 'string' || !entry[key].trim())) {
                    pushError(errors, `"${entryPath}.${key}" must be a non-empty string.`);
                }
            });

            if (hasOwn(entry, 'artifactKind') && allowedKinds.length && !allowedKinds.includes(entry.artifactKind)) {
                pushError(errors, `"${entryPath}.artifactKind" must be one of: ${allowedKinds.join(', ')}.`);
            }

            if (hasOwn(entry, 'payload') && !isPlainObject(entry.payload)) {
                pushError(errors, `"${entryPath}.payload" must be a plain object.`);
            }
        });
    }

    function validatePhysicalWorldDebugBundle(candidate) {
        const errors = [];

        if (!isPlainObject(candidate)) {
            pushError(errors, 'Bundle root must be a plain object.');
            return {
                contractId: CONTRACT_ID,
                contractVersion: PHASE_VERSION,
                isValid: false,
                errors
            };
        }

        ROOT_REQUIRED_KEYS.forEach((key) => {
            if (!hasOwn(candidate, key)) {
                pushError(errors, `Missing required key "${key}".`);
            }
        });

        if (hasOwn(candidate, 'artifactKind') && candidate.artifactKind !== BUNDLE_ARTIFACT_KIND) {
            pushError(errors, `"artifactKind" must be "${BUNDLE_ARTIFACT_KIND}".`);
        }

        if (hasOwn(candidate, 'phaseId') && (typeof candidate.phaseId !== 'string' || !candidate.phaseId.trim())) {
            pushError(errors, '"phaseId" must be a non-empty string.');
        }

        if (hasOwn(candidate, 'phaseVersion') && (typeof candidate.phaseVersion !== 'string' || !candidate.phaseVersion.trim())) {
            pushError(errors, '"phaseVersion" must be a non-empty string.');
        }

        if (hasOwn(candidate, 'macroSeed') && (!Number.isInteger(candidate.macroSeed) || candidate.macroSeed < 0)) {
            pushError(errors, '"macroSeed" must be a non-negative integer.');
        }

        if (hasOwn(candidate, 'metadata') && !isPlainObject(candidate.metadata)) {
            pushError(errors, '"metadata" must be a plain object.');
        }

        collectArtifactEntryErrors(candidate.seedArtifacts, 'seedArtifacts', errors, 'seedArtifacts');
        collectArtifactEntryErrors(candidate.fieldSnapshots, 'fieldSnapshots', errors, 'fieldSnapshots');
        collectArtifactEntryErrors(candidate.graphSnapshots, 'graphSnapshots', errors, 'graphSnapshots');
        collectArtifactEntryErrors(candidate.summaries, 'summaries', errors, 'summaries');
        collectArtifactEntryErrors(candidate.intermediateOutputs, 'intermediateOutputs', errors, 'intermediateOutputs');
        collectArtifactEntryErrors(candidate.validationArtifacts, 'validationArtifacts', errors, 'validationArtifacts');

        return {
            contractId: CONTRACT_ID,
            contractVersion: PHASE_VERSION,
            isValid: errors.length === 0,
            errors
        };
    }

    function assertPhysicalWorldDebugBundle(candidate) {
        const validationResult = validatePhysicalWorldDebugBundle(candidate);
        if (!validationResult.isValid) {
            const error = new Error(validationResult.errors.join(' '));
            error.code = 'PHYSICAL_WORLD_DEBUG_BUNDLE_INVALID';
            error.validationResult = validationResult;
            throw error;
        }

        return candidate;
    }

    const PHYSICAL_WORLD_DEBUG_BUNDLE_CONTRACT = deepFreeze({
        contractId: CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        bundleArtifactKind: BUNDLE_ARTIFACT_KIND,
        requiredKeys: ROOT_REQUIRED_KEYS.slice(),
        entryRequiredKeys: ENTRY_REQUIRED_KEYS.slice(),
        categories: cloneValue(ENTRY_CATEGORY_KINDS),
        description: 'Canonical UI-free debug bundle contract for Phase 1 field snapshots, summaries, intermediate outputs, and validation-facing artifacts.'
    });

    function getPhysicalWorldDebugBundleContract() {
        return cloneValue(PHYSICAL_WORLD_DEBUG_BUNDLE_CONTRACT);
    }

    function buildPhysicalWorldDebugBundle(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const stageIds = [];
        const categories = {
            seedArtifacts: buildSeedArtifacts(normalizedInput),
            fieldSnapshots: [],
            graphSnapshots: buildConnectivityGraphSnapshots(normalizedInput),
            summaries: buildSummaryEntries(normalizedInput),
            intermediateOutputs: [],
            validationArtifacts: buildValidationArtifacts(normalizedInput)
        };

        [
            'tectonicSkeleton',
            'reliefElevation',
            'hydrosphere',
            'riverSystem',
            'marineCarving',
            'climateEnvelope',
            'continentalCohesion',
            'coastalOpportunity',
            'connectivityGraph',
            'chokepoints',
            'isolationPeriphery',
            'archipelagoSignificance',
            'strategicRegionSynthesis',
            'validationRebalance'
        ].forEach((stageId) => {
            const stageBundle = normalizedInput[stageId];
            if (!isPlainObject(stageBundle)) {
                return;
            }

            stageIds.push(stageId);
            collectStageDebugArtifacts(stageId, stageBundle, categories);
            collectStageOutputSummaries(stageId, stageBundle, categories.intermediateOutputs);
        });

        const debugBundle = createPhysicalWorldDebugBundleSkeleton({
            macroSeed: normalizeSeed(
                hasOwn(normalizedInput, 'macroSeed')
                    ? normalizedInput.macroSeed
                    : getNestedValue(normalizedInput, 'macroGeographyPackage.macroSeed', 0)
            ),
            seedArtifacts: categories.seedArtifacts,
            fieldSnapshots: categories.fieldSnapshots,
            graphSnapshots: categories.graphSnapshots,
            summaries: categories.summaries,
            intermediateOutputs: categories.intermediateOutputs,
            validationArtifacts: categories.validationArtifacts,
            metadata: buildBundleMetadata({
                ...categories,
                stageIds,
                input: normalizedInput
            })
        });

        assertPhysicalWorldDebugBundle(debugBundle);
        return deepFreeze(debugBundle);
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('physicalWorldDebugBundle', {
            entry: 'getPhysicalWorldDebugBundleContract',
            file: 'js/worldgen/macro/physical-world-debug-bundle.js',
            description: 'Runtime contract/module for canonical Phase 1 debug bundle exports plus deterministic end-to-end bundle assembly.',
            stub: false
        });
    }

    Object.assign(macro, {
        getPhysicalWorldDebugBundleContract,
        createPhysicalWorldDebugBundleSkeleton,
        buildPhysicalWorldDebugBundle,
        validatePhysicalWorldDebugBundle,
        assertPhysicalWorldDebugBundle
    });
})();
