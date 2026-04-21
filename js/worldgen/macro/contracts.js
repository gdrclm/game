(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';
    const CONTRACT_ID = 'macroGeographyPackage';
    const VALIDATION_REPORT_CONTRACT_ID = 'validationReport';
    const VALIDATION_SCORE_KEYS = Object.freeze([
        'diversity',
        'routeRichness',
        'chokeValue',
        'archipelagoSignificance',
        'centerPeripheryContrast',
        'historyPotential'
    ]);
    const VALIDATION_DIAGNOSTIC_KEYS = Object.freeze([
        'failReasons',
        'rebalanceActions'
    ]);
    const VALIDATION_DIAGNOSTICS_SECTION_KEYS = Object.freeze([
        'warnings',
        'blockedDownstreamPhases'
    ]);
    const VALIDATION_SELECTIVE_REROLL_RECOMMENDATION_KEYS = Object.freeze([
        'targetLayerIds',
        'recommendationType',
        'priority',
        'reason'
    ]);
    const PHYSICAL_REQUIRED_ARRAY_KEYS = Object.freeze([
        'plates',
        'continents',
        'seaRegions',
        'mountainSystems',
        'volcanicZones',
        'riverBasins',
        'climateBands',
        'reliefRegions'
    ]);
    const STRATEGIC_REQUIRED_ARRAY_KEYS = Object.freeze([
        'archipelagoRegions',
        'chokepoints',
        'macroRoutes',
        'strategicRegions'
    ]);
    const STRATEGIC_OPTIONAL_ARRAY_KEYS = Object.freeze([
        'coastalOpportunityMap',
        'isolatedZones'
    ]);
    const ROOT_REQUIRED_KEYS = Object.freeze([
        'macroSeed',
        'version',
        ...PHYSICAL_REQUIRED_ARRAY_KEYS,
        ...STRATEGIC_REQUIRED_ARRAY_KEYS,
        'validationReport'
    ]);
    const ROOT_OPTIONAL_KEYS = Object.freeze([
        'worldBounds',
        ...STRATEGIC_OPTIONAL_ARRAY_KEYS,
        'debugArtifacts'
    ]);
    const ROOT_ARRAY_KEYS = Object.freeze([
        ...PHYSICAL_REQUIRED_ARRAY_KEYS,
        ...STRATEGIC_REQUIRED_ARRAY_KEYS,
        ...STRATEGIC_OPTIONAL_ARRAY_KEYS
    ]);
    const SEMANTIC_CONSTRAINTS = Object.freeze([
        Object.freeze({
            key: 'plates',
            minLength: 1,
            reason: 'World should expose at least one tectonic plate record.'
        }),
        Object.freeze({
            key: 'continents',
            minLength: 2,
            reason: 'World should expose at least two continent records.'
        }),
        Object.freeze({
            key: 'seaRegions',
            minLength: 1,
            reason: 'World should expose at least one sea region.'
        }),
        Object.freeze({
            key: 'mountainSystems',
            minLength: 1,
            reason: 'World should expose at least one mountain system.'
        }),
        Object.freeze({
            key: 'riverBasins',
            minLength: 1,
            reason: 'World should expose at least one river basin.'
        }),
        Object.freeze({
            key: 'climateBands',
            minLength: 1,
            reason: 'World should expose at least one climate band.'
        }),
        Object.freeze({
            key: 'reliefRegions',
            minLength: 1,
            reason: 'World should expose at least one relief region.'
        }),
        Object.freeze({
            key: 'archipelagoRegions',
            minLength: 1,
            reason: 'World should expose at least one archipelago region.'
        }),
        Object.freeze({
            key: 'chokepoints',
            minLength: 1,
            reason: 'World should expose at least one chokepoint.'
        }),
        Object.freeze({
            key: 'macroRoutes',
            minLength: 1,
            reason: 'World should expose at least one macro route.'
        }),
        Object.freeze({
            key: 'strategicRegions',
            minLength: 1,
            reason: 'World should expose at least one strategic region.'
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
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function clampUnitInterval(value) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 0;
        }

        return Math.max(0, Math.min(1, numericValue));
    }

    function normalizeArray(value) {
        return Array.isArray(value) ? value.map(cloneValue) : [];
    }

    function normalizeWorldBounds(worldBounds = {}) {
        if (!isPlainObject(worldBounds)) {
            return {
                width: 0,
                height: 0
            };
        }

        const width = Number.isFinite(worldBounds.width)
            ? Math.max(0, Math.floor(worldBounds.width))
            : 0;
        const height = Number.isFinite(worldBounds.height)
            ? Math.max(0, Math.floor(worldBounds.height))
            : 0;

        return {
            width,
            height
        };
    }

    function createArrayFieldDescriptor({
        layerId,
        recordContractId = null,
        optional = false,
        itemContractStatus = ''
    } = {}) {
        const descriptor = {
            type: 'array',
            layerId: typeof layerId === 'string' && layerId.trim()
                ? layerId.trim()
                : 'macro'
        };

        if (recordContractId) {
            descriptor.recordContractId = recordContractId;
        }

        if (optional) {
            descriptor.optional = true;
        }

        if (itemContractStatus) {
            descriptor.itemContractStatus = itemContractStatus;
        }

        return descriptor;
    }

    function createValidationScores(overrides = {}) {
        return VALIDATION_SCORE_KEYS.reduce((scores, scoreKey) => {
            scores[scoreKey] = clampUnitInterval(overrides[scoreKey]);
            return scores;
        }, {});
    }

    function normalizeStringArray(values) {
        return Array.isArray(values)
            ? values.map((value) => `${value}`)
            : [];
    }

    function createValidationDiagnostics(diagnostics = {}) {
        const normalizedDiagnostics = isPlainObject(diagnostics) ? diagnostics : {};
        return {
            warnings: normalizeStringArray(normalizedDiagnostics.warnings),
            blockedDownstreamPhases: normalizeStringArray(normalizedDiagnostics.blockedDownstreamPhases)
        };
    }

    function createSelectiveRerollRecommendations(recommendations = []) {
        return Array.isArray(recommendations)
            ? recommendations.map((recommendation) => {
                const normalizedRecommendation = isPlainObject(recommendation) ? recommendation : {};
                return {
                    targetLayerIds: normalizeStringArray(normalizedRecommendation.targetLayerIds),
                    recommendationType: typeof normalizedRecommendation.recommendationType === 'string'
                        ? normalizedRecommendation.recommendationType.trim()
                        : '',
                    priority: typeof normalizedRecommendation.priority === 'string'
                        ? normalizedRecommendation.priority.trim()
                        : '',
                    reason: typeof normalizedRecommendation.reason === 'string'
                        ? normalizedRecommendation.reason.trim()
                        : ''
                };
            })
            : [];
    }

    function createValidationReportSkeleton(validationReport = {}) {
        const normalizedReport = isPlainObject(validationReport) ? validationReport : {};
        return {
            isValid: normalizedReport.isValid === true,
            scores: createValidationScores(normalizedReport.scores),
            failReasons: normalizeStringArray(normalizedReport.failReasons),
            rebalanceActions: normalizeStringArray(normalizedReport.rebalanceActions),
            diagnostics: createValidationDiagnostics(normalizedReport.diagnostics),
            selectiveRerollRecommendations: createSelectiveRerollRecommendations(
                normalizedReport.selectiveRerollRecommendations
            )
        };
    }

    const VALIDATION_REPORT_CONTRACT = deepFreeze({
        contractId: VALIDATION_REPORT_CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        requiredKeys: [
            'isValid',
            'scores',
            'failReasons',
            'rebalanceActions',
            'diagnostics',
            'selectiveRerollRecommendations'
        ],
        scores: {
            requiredKeys: VALIDATION_SCORE_KEYS.slice(),
            range: [0, 1]
        },
        diagnostics: {
            compatibilityKeys: VALIDATION_DIAGNOSTIC_KEYS.slice(),
            requiredKeys: VALIDATION_DIAGNOSTICS_SECTION_KEYS.slice(),
            itemType: 'string'
        },
        selectiveRerollRecommendations: {
            type: 'array',
            itemType: 'object',
            requiredKeys: VALIDATION_SELECTIVE_REROLL_RECOMMENDATION_KEYS.slice()
        }
    });

    function createMacroGeographyPackageSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const normalizedSeed = typeof macro.normalizeSeed === 'function'
            ? macro.normalizeSeed(
                hasOwn(normalizedInput, 'macroSeed')
                    ? normalizedInput.macroSeed
                    : normalizedInput.seed
            )
            : 0;

        return {
            macroSeed: normalizedSeed,
            version: typeof normalizedInput.version === 'string' && normalizedInput.version.trim()
                ? normalizedInput.version.trim()
                : PHASE_VERSION,
            worldBounds: normalizeWorldBounds(normalizedInput.worldBounds),
            plates: normalizeArray(normalizedInput.plates),
            continents: normalizeArray(normalizedInput.continents),
            seaRegions: normalizeArray(normalizedInput.seaRegions),
            mountainSystems: normalizeArray(normalizedInput.mountainSystems),
            volcanicZones: normalizeArray(normalizedInput.volcanicZones),
            riverBasins: normalizeArray(normalizedInput.riverBasins),
            climateBands: normalizeArray(normalizedInput.climateBands),
            reliefRegions: normalizeArray(normalizedInput.reliefRegions),
            archipelagoRegions: normalizeArray(normalizedInput.archipelagoRegions),
            coastalOpportunityMap: normalizeArray(normalizedInput.coastalOpportunityMap),
            chokepoints: normalizeArray(normalizedInput.chokepoints),
            macroRoutes: normalizeArray(normalizedInput.macroRoutes),
            isolatedZones: normalizeArray(normalizedInput.isolatedZones),
            strategicRegions: normalizeArray(normalizedInput.strategicRegions),
            debugArtifacts: isPlainObject(normalizedInput.debugArtifacts)
                ? cloneValue(normalizedInput.debugArtifacts)
                : {},
            validationReport: createValidationReportSkeleton(normalizedInput.validationReport)
        };
    }

    const MACRO_GEOGRAPHY_PACKAGE_CONTRACT = deepFreeze({
        contractId: CONTRACT_ID,
        version: PHASE_VERSION,
        root: {
            requiredKeys: ROOT_REQUIRED_KEYS.slice(),
            optionalKeys: ROOT_OPTIONAL_KEYS.slice(),
            fields: {
                macroSeed: {
                    type: 'uint32',
                    deterministic: true
                },
                version: {
                    type: 'string',
                    defaultValue: PHASE_VERSION
                },
                worldBounds: {
                    type: 'object',
                    keys: ['width', 'height']
                },
                plates: createArrayFieldDescriptor({
                    layerId: 'physical',
                    recordContractId: 'plateRecord'
                }),
                continents: createArrayFieldDescriptor({
                    layerId: 'physical',
                    recordContractId: 'continentRecord'
                }),
                seaRegions: createArrayFieldDescriptor({
                    layerId: 'physical',
                    recordContractId: 'seaRegionRecord'
                }),
                mountainSystems: createArrayFieldDescriptor({
                    layerId: 'physical',
                    recordContractId: 'mountainSystemRecord'
                }),
                volcanicZones: createArrayFieldDescriptor({
                    layerId: 'physical',
                    recordContractId: 'volcanicZoneRecord'
                }),
                riverBasins: createArrayFieldDescriptor({
                    layerId: 'physical',
                    recordContractId: 'riverBasinRecord'
                }),
                climateBands: createArrayFieldDescriptor({
                    layerId: 'physical',
                    recordContractId: 'climateBandRecord'
                }),
                reliefRegions: createArrayFieldDescriptor({
                    layerId: 'physical',
                    recordContractId: 'reliefRegionRecord'
                }),
                archipelagoRegions: createArrayFieldDescriptor({
                    layerId: 'strategic',
                    recordContractId: 'archipelagoRegionRecord'
                }),
                coastalOpportunityMap: createArrayFieldDescriptor({
                    layerId: 'strategic',
                    optional: true
                }),
                chokepoints: createArrayFieldDescriptor({
                    layerId: 'strategic',
                    recordContractId: 'chokepointRecord'
                }),
                macroRoutes: createArrayFieldDescriptor({
                    layerId: 'strategic',
                    recordContractId: 'macroRouteRecord'
                }),
                isolatedZones: createArrayFieldDescriptor({
                    layerId: 'strategic',
                    recordContractId: 'isolatedZoneRecord',
                    optional: true,
                    itemContractStatus: macro.todoContractedCode || 'TODO_CONTRACTED'
                }),
                strategicRegions: createArrayFieldDescriptor({
                    layerId: 'strategic',
                    recordContractId: 'strategicRegionRecord'
                }),
                debugArtifacts: {
                    type: 'object',
                    optional: true,
                    fields: {
                        physicalWorldDebugBundle: {
                            type: 'object',
                            contract: 'physicalWorldDebugBundle',
                            optional: true
                        }
                    }
                },
                validationReport: {
                    type: 'object',
                    contract: VALIDATION_REPORT_CONTRACT_ID,
                    requiredKeys: [
                        'isValid',
                        'scores',
                        'failReasons',
                        'rebalanceActions',
                        'diagnostics',
                        'selectiveRerollRecommendations'
                    ]
                }
            }
        },
        outputGroups: {
            physical: {
                requiredKeys: PHYSICAL_REQUIRED_ARRAY_KEYS.slice()
            },
            strategic: {
                requiredKeys: STRATEGIC_REQUIRED_ARRAY_KEYS.slice(),
                optionalKeys: STRATEGIC_OPTIONAL_ARRAY_KEYS.slice()
            }
        },
        validationReport: {
            scoreKeys: VALIDATION_SCORE_KEYS.slice()
        },
        semanticConstraints: SEMANTIC_CONSTRAINTS.map((constraint) => ({ ...constraint }))
    });

    const BASE_CONTRACT_REGISTRY = deepFreeze({
        macroGeographyPackage: MACRO_GEOGRAPHY_PACKAGE_CONTRACT,
        validationReport: VALIDATION_REPORT_CONTRACT,
        physicalWorldDebugBundle: typeof macro.getPhysicalWorldDebugBundleContract === 'function'
            ? macro.getPhysicalWorldDebugBundleContract()
            : {
                contractId: 'physicalWorldDebugBundle',
                status: macro.todoContractedCode || 'TODO_CONTRACTED'
            },
        scalarFieldHeatmapArtifact: typeof macro.getScalarFieldHeatmapArtifactContract === 'function'
            ? macro.getScalarFieldHeatmapArtifactContract()
            : {
                contractId: 'scalarFieldHeatmapArtifact',
                status: macro.todoContractedCode || 'TODO_CONTRACTED'
            },
        directionalFieldVectorArtifact: typeof macro.getDirectionalFieldVectorArtifactContract === 'function'
            ? macro.getDirectionalFieldVectorArtifactContract()
            : {
                contractId: 'directionalFieldVectorArtifact',
                status: macro.todoContractedCode || 'TODO_CONTRACTED'
            },
        fieldContracts: {
            contractId: 'fieldContracts',
            status: macro.todoContractedCode || 'TODO_CONTRACTED'
        }
    });

    function getContractIds() {
        return Object.keys(getMacroContractRegistry());
    }

    function getMacroGeographyPackageContract() {
        return cloneValue(MACRO_GEOGRAPHY_PACKAGE_CONTRACT);
    }

    function getValidationReportContract() {
        return cloneValue(VALIDATION_REPORT_CONTRACT);
    }

    function getMacroContractRegistry() {
        return {
            macroSeedProfile: typeof macro.getMacroSeedProfileContract === 'function'
                ? macro.getMacroSeedProfileContract()
                : {
                    contractId: 'macroSeedProfile',
                    status: macro.todoContractedCode || 'TODO_CONTRACTED'
                },
            ...cloneValue(BASE_CONTRACT_REGISTRY),
            regionContracts: typeof macro.getRegionContractRegistry === 'function'
                ? macro.getRegionContractRegistry()
                : {
                    contractId: 'regionContracts',
                    status: macro.todoContractedCode || 'TODO_CONTRACTED'
                }
        };
    }

    function pushError(errors, message) {
        errors.push(`[${CONTRACT_ID}] ${message}`);
    }

    function validateArrayField(candidate, key, errors) {
        if (!hasOwn(candidate, key)) {
            return;
        }

        if (!Array.isArray(candidate[key])) {
            pushError(errors, `"${key}" must be an array.`);
        }
    }

    function collectValidationReportErrors(validationReport, errors, path = 'validationReport') {
        if (!isPlainObject(validationReport)) {
            errors.push(`"${path}" must be an object.`);
            return;
        }

        if (typeof validationReport.isValid !== 'boolean') {
            errors.push(`"${path}.isValid" must be a boolean.`);
        }

        if (!isPlainObject(validationReport.scores)) {
            errors.push(`"${path}.scores" must be an object.`);
        } else {
            VALIDATION_SCORE_KEYS.forEach((scoreKey) => {
                if (!hasOwn(validationReport.scores, scoreKey)) {
                    errors.push(`"${path}.scores.${scoreKey}" is required.`);
                    return;
                }

                const scoreValue = validationReport.scores[scoreKey];
                if (!Number.isFinite(scoreValue) || scoreValue < 0 || scoreValue > 1) {
                    errors.push(`"${path}.scores.${scoreKey}" must be a number in the 0..1 range.`);
                }
            });
        }

        if (!Array.isArray(validationReport.failReasons)) {
            errors.push(`"${path}.failReasons" must be an array.`);
        } else {
            validationReport.failReasons.forEach((reason, index) => {
                if (typeof reason !== 'string') {
                    errors.push(`"${path}.failReasons[${index}]" must be a string.`);
                }
            });
        }

        if (!Array.isArray(validationReport.rebalanceActions)) {
            errors.push(`"${path}.rebalanceActions" must be an array.`);
        } else {
            validationReport.rebalanceActions.forEach((action, index) => {
                if (typeof action !== 'string') {
                    errors.push(`"${path}.rebalanceActions[${index}]" must be a string.`);
                }
            });
        }

        if (!isPlainObject(validationReport.diagnostics)) {
            errors.push(`"${path}.diagnostics" must be an object.`);
        } else {
            VALIDATION_DIAGNOSTICS_SECTION_KEYS.forEach((diagnosticKey) => {
                if (!Array.isArray(validationReport.diagnostics[diagnosticKey])) {
                    errors.push(`"${path}.diagnostics.${diagnosticKey}" must be an array.`);
                    return;
                }

                validationReport.diagnostics[diagnosticKey].forEach((entry, index) => {
                    if (typeof entry !== 'string') {
                        errors.push(`"${path}.diagnostics.${diagnosticKey}[${index}]" must be a string.`);
                    }
                });
            });
        }

        if (!Array.isArray(validationReport.selectiveRerollRecommendations)) {
            errors.push(`"${path}.selectiveRerollRecommendations" must be an array.`);
        } else {
            validationReport.selectiveRerollRecommendations.forEach((recommendation, index) => {
                const recommendationPath = `${path}.selectiveRerollRecommendations[${index}]`;
                if (!isPlainObject(recommendation)) {
                    errors.push(`"${recommendationPath}" must be an object.`);
                    return;
                }

                if (!Array.isArray(recommendation.targetLayerIds)) {
                    errors.push(`"${recommendationPath}.targetLayerIds" must be an array.`);
                } else {
                    if (recommendation.targetLayerIds.length < 1) {
                        errors.push(`"${recommendationPath}.targetLayerIds" must contain at least 1 item.`);
                    }

                    recommendation.targetLayerIds.forEach((layerId, layerIndex) => {
                        if (typeof layerId !== 'string') {
                            errors.push(`"${recommendationPath}.targetLayerIds[${layerIndex}]" must be a string.`);
                        }
                    });
                }

                ['recommendationType', 'priority', 'reason'].forEach((key) => {
                    if (typeof recommendation[key] !== 'string' || !recommendation[key].trim()) {
                        errors.push(`"${recommendationPath}.${key}" must be a non-empty string.`);
                    }
                });
            });
        }
    }

    function validateValidationReport(validationReport) {
        const errors = [];
        collectValidationReportErrors(validationReport, errors);

        return {
            contractId: VALIDATION_REPORT_CONTRACT_ID,
            contractVersion: PHASE_VERSION,
            isValid: errors.length === 0,
            errors: errors.map((message) => `[${VALIDATION_REPORT_CONTRACT_ID}] ${message}`)
        };
    }

    function assertValidationReport(validationReport) {
        const validationResult = validateValidationReport(validationReport);
        if (!validationResult.isValid) {
            const error = new Error(validationResult.errors.join(' '));
            error.code = 'VALIDATION_REPORT_INVALID';
            error.validationResult = validationResult;
            throw error;
        }

        return validationReport;
    }

    function validateSemanticConstraints(candidate, errors) {
        SEMANTIC_CONSTRAINTS.forEach((constraint) => {
            const fieldValue = candidate[constraint.key];
            if (!Array.isArray(fieldValue)) {
                return;
            }

            if (fieldValue.length < constraint.minLength) {
                pushError(
                    errors,
                    `"${constraint.key}" must contain at least ${constraint.minLength} item(s) for a semantically complete package.`
                );
            }
        });
    }

    function validateMacroGeographyPackage(candidate, options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const requireSemanticCompleteness = normalizedOptions.requireSemanticCompleteness === true;
        const errors = [];

        if (!isPlainObject(candidate)) {
            pushError(errors, 'Package root must be a plain object.');
            return {
                contractId: CONTRACT_ID,
                contractVersion: PHASE_VERSION,
                isValid: false,
                errors,
                requireSemanticCompleteness
            };
        }

        ROOT_REQUIRED_KEYS.forEach((key) => {
            if (!hasOwn(candidate, key)) {
                pushError(errors, `Missing required key "${key}".`);
            }
        });

        if (hasOwn(candidate, 'macroSeed')) {
            if (!Number.isInteger(candidate.macroSeed) || candidate.macroSeed < 0) {
                pushError(errors, '"macroSeed" must be a non-negative integer.');
            }
        }

        if (hasOwn(candidate, 'version')) {
            if (typeof candidate.version !== 'string' || !candidate.version.trim()) {
                pushError(errors, '"version" must be a non-empty string.');
            }
        }

        if (hasOwn(candidate, 'worldBounds')) {
            if (!isPlainObject(candidate.worldBounds)) {
                pushError(errors, '"worldBounds" must be an object.');
            } else {
                if (!Number.isFinite(candidate.worldBounds.width) || candidate.worldBounds.width < 0) {
                    pushError(errors, '"worldBounds.width" must be a non-negative number.');
                }

                if (!Number.isFinite(candidate.worldBounds.height) || candidate.worldBounds.height < 0) {
                    pushError(errors, '"worldBounds.height" must be a non-negative number.');
                }
            }
        }

        ROOT_ARRAY_KEYS.forEach((key) => {
            validateArrayField(candidate, key, errors);
        });

        if (hasOwn(candidate, 'debugArtifacts') && !isPlainObject(candidate.debugArtifacts)) {
            pushError(errors, '"debugArtifacts" must be a plain object when present.');
        } else if (
            hasOwn(candidate, 'debugArtifacts') &&
            isPlainObject(candidate.debugArtifacts) &&
            hasOwn(candidate.debugArtifacts, 'physicalWorldDebugBundle') &&
            typeof macro.validatePhysicalWorldDebugBundle === 'function'
        ) {
            const debugBundleValidation = macro.validatePhysicalWorldDebugBundle(
                candidate.debugArtifacts.physicalWorldDebugBundle
            );
            if (!debugBundleValidation.isValid) {
                debugBundleValidation.errors.forEach((message) => {
                    pushError(errors, message);
                });
            }
        }

        if (hasOwn(candidate, 'validationReport')) {
            const validationReportErrors = [];
            collectValidationReportErrors(candidate.validationReport, validationReportErrors);
            validationReportErrors.forEach((message) => {
                pushError(errors, message);
            });
        }

        if (requireSemanticCompleteness) {
            validateSemanticConstraints(candidate, errors);
        }

        return {
            contractId: CONTRACT_ID,
            contractVersion: PHASE_VERSION,
            isValid: errors.length === 0,
            errors,
            requireSemanticCompleteness
        };
    }

    function assertMacroGeographyPackage(candidate, options = {}) {
        const validationResult = validateMacroGeographyPackage(candidate, options);
        if (!validationResult.isValid) {
            const error = new Error(validationResult.errors.join(' '));
            error.code = 'MACRO_GEOGRAPHY_PACKAGE_INVALID';
            error.validationResult = validationResult;
            throw error;
        }

        return candidate;
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('contracts', {
            entry: 'getMacroGeographyPackageContract',
            file: 'js/worldgen/macro/contracts.js',
            description: 'Runtime contract/schema module for MacroGeographyPackage.',
            stub: false
        });
    }

    Object.assign(macro, {
        getContractIds,
        getMacroContractRegistry,
        getMacroGeographyPackageContract,
        getValidationReportContract,
        createValidationReportSkeleton,
        createMacroGeographyPackageSkeleton,
        validateValidationReport,
        assertValidationReport,
        validateMacroGeographyPackage,
        assertMacroGeographyPackage
    });
})();
