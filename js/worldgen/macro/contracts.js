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
    const ROOT_REQUIRED_KEYS = Object.freeze([
        'macroSeed',
        'version',
        'continents',
        'seaRegions',
        'archipelagoRegions',
        'chokepoints',
        'macroRoutes',
        'strategicRegions',
        'validationReport'
    ]);
    const ROOT_OPTIONAL_KEYS = Object.freeze([
        'worldBounds',
        'climateBands',
        'coastalOpportunityMap',
        'isolatedZones',
        'debugArtifacts'
    ]);
    const ROOT_ARRAY_KEYS = Object.freeze([
        'continents',
        'seaRegions',
        'archipelagoRegions',
        'climateBands',
        'coastalOpportunityMap',
        'chokepoints',
        'macroRoutes',
        'isolatedZones',
        'strategicRegions'
    ]);
    const SEMANTIC_CONSTRAINTS = Object.freeze([
        Object.freeze({
            key: 'continents',
            minLength: 2,
            reason: 'World should expose at least two continent records.'
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

    function createValidationScores(overrides = {}) {
        return VALIDATION_SCORE_KEYS.reduce((scores, scoreKey) => {
            scores[scoreKey] = clampUnitInterval(overrides[scoreKey]);
            return scores;
        }, {});
    }

    function createValidationReportSkeleton(validationReport = {}) {
        const normalizedReport = isPlainObject(validationReport) ? validationReport : {};
        return {
            isValid: normalizedReport.isValid === true,
            scores: createValidationScores(normalizedReport.scores),
            failReasons: Array.isArray(normalizedReport.failReasons)
                ? normalizedReport.failReasons.map((reason) => `${reason}`)
                : [],
            rebalanceActions: Array.isArray(normalizedReport.rebalanceActions)
                ? normalizedReport.rebalanceActions.map((action) => `${action}`)
                : []
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
            'rebalanceActions'
        ],
        scores: {
            requiredKeys: VALIDATION_SCORE_KEYS.slice(),
            range: [0, 1]
        },
        diagnostics: {
            requiredKeys: VALIDATION_DIAGNOSTIC_KEYS.slice(),
            itemType: 'string'
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
            continents: normalizeArray(normalizedInput.continents),
            seaRegions: normalizeArray(normalizedInput.seaRegions),
            archipelagoRegions: normalizeArray(normalizedInput.archipelagoRegions),
            climateBands: normalizeArray(normalizedInput.climateBands),
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
                continents: {
                    type: 'array'
                },
                seaRegions: {
                    type: 'array'
                },
                archipelagoRegions: {
                    type: 'array'
                },
                climateBands: {
                    type: 'array',
                    optional: true
                },
                coastalOpportunityMap: {
                    type: 'array',
                    optional: true
                },
                chokepoints: {
                    type: 'array'
                },
                macroRoutes: {
                    type: 'array'
                },
                isolatedZones: {
                    type: 'array',
                    optional: true
                },
                strategicRegions: {
                    type: 'array'
                },
                debugArtifacts: {
                    type: 'object',
                    optional: true
                },
                validationReport: {
                    type: 'object',
                    contract: VALIDATION_REPORT_CONTRACT_ID,
                    requiredKeys: ['isValid', 'scores', 'failReasons', 'rebalanceActions']
                }
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
