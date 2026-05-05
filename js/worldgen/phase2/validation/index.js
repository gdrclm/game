(() => {
    const game = window.Game;
    const phase2 = game.systems.worldgenPhase2 = game.systems.worldgenPhase2 || {};
    const GROUP_ID = 'validation';
    const PHASE_ID = 'PHASE_2';
    const VALIDATION_HELPERS_ID = 'Phase2ValidationReportHelpers';
    const VALIDATION_HELPERS_VERSION = 'phase2-validation-helpers-v1';
    const VALIDATION_ORCHESTRATOR_ID = 'Phase2ValidationOrchestrationShell';
    const VALIDATION_ORCHESTRATOR_VERSION = 'phase2-validation-orchestration-shell-v1';
    const FALLBACK_VALIDATION_FAMILY_IDS = Object.freeze([
        'structural',
        'causal',
        'boundary',
        'distribution',
        'design',
        'gameplay',
        'summary'
    ]);
    const FALLBACK_VALIDATION_FAMILY_KEY_BY_ID = Object.freeze({
        structural: 'structuralChecks',
        causal: 'causalChecks',
        boundary: 'boundaryChecks',
        distribution: 'distributionChecks',
        design: 'designChecks',
        gameplay: 'gameplayChecks',
        summary: 'summaryChecks'
    });
    const FALLBACK_VALIDATION_STATUS_ENUMS = Object.freeze({
        familyAndCheck: Object.freeze([
            'not_run',
            'pass',
            'warning',
            'rebalance_required',
            'fail'
        ]),
        final: Object.freeze([
            'pass',
            'rebalance_required',
            'fail'
        ]),
        recommendationPriority: Object.freeze([
            'low',
            'medium',
            'high',
            'critical'
        ])
    });
    const STUB = Object.freeze({
        groupId: GROUP_ID,
        status: 'partial_implemented_validation_orchestration',
        canonicalPath: 'js/worldgen/phase2/validation/',
        uiCoupling: false,
        implementsFieldLogic: true,
        purpose: 'Phase2ValidationReport schema helpers, collectors, status orchestration, and validation-flow shell for structural, causal, boundary, distribution, design, gameplay, and summary checks.'
    });

    function getPhase2ValidationModuleStub() {
        return STUB;
    }

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
            return value.map((entry) => cloneValue(entry));
        }

        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)])
            );
        }

        return value;
    }

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function normalizeString(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function uniqueStrings(values = []) {
        const seen = new Set();
        return (Array.isArray(values) ? values : [])
            .map((value) => normalizeString(value))
            .filter((value) => {
                if (!value || seen.has(value)) {
                    return false;
                }

                seen.add(value);
                return true;
            });
    }

    function mean(values = []) {
        const normalizedValues = (Array.isArray(values) ? values : [])
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value));
        if (!normalizedValues.length) {
            return 0;
        }

        return normalizedValues.reduce((sum, value) => sum + value, 0) / normalizedValues.length;
    }

    function getPhase2ValidationReportContractSnapshot() {
        if (typeof phase2.getPhase2ValidationReportContract === 'function') {
            return phase2.getPhase2ValidationReportContract();
        }

        if (
            phase2.contracts
            && phase2.contracts.validationSchemas
            && phase2.contracts.validationSchemas.phase2ValidationReport
        ) {
            return phase2.contracts.validationSchemas.phase2ValidationReport;
        }

        return null;
    }

    function getPhase2ValidationFamilyIds() {
        const contract = getPhase2ValidationReportContractSnapshot();
        return contract && Array.isArray(contract.familyIds)
            ? contract.familyIds.slice()
            : FALLBACK_VALIDATION_FAMILY_IDS.slice();
    }

    function getPhase2ValidationStatusEnums() {
        const contract = getPhase2ValidationReportContractSnapshot();
        const contractStatusEnums = contract && contract.statusEnums ? contract.statusEnums : null;

        if (contractStatusEnums) {
            return deepFreeze({
                familyAndCheck: Array.isArray(contractStatusEnums.familyAndCheck)
                    ? contractStatusEnums.familyAndCheck.slice()
                    : FALLBACK_VALIDATION_STATUS_ENUMS.familyAndCheck.slice(),
                final: Array.isArray(contractStatusEnums.final)
                    ? contractStatusEnums.final.slice()
                    : FALLBACK_VALIDATION_STATUS_ENUMS.final.slice(),
                recommendationPriority: Array.isArray(contractStatusEnums.recommendationPriority)
                    ? contractStatusEnums.recommendationPriority.slice()
                    : FALLBACK_VALIDATION_STATUS_ENUMS.recommendationPriority.slice()
            });
        }

        return deepFreeze({
            familyAndCheck: FALLBACK_VALIDATION_STATUS_ENUMS.familyAndCheck.slice(),
            final: FALLBACK_VALIDATION_STATUS_ENUMS.final.slice(),
            recommendationPriority: FALLBACK_VALIDATION_STATUS_ENUMS.recommendationPriority.slice()
        });
    }

    function getPhase2ValidationFamilyKeyById() {
        const contract = typeof phase2.getPhase2ValidationReportContract === 'function'
            ? phase2.getPhase2ValidationReportContract()
            : null;

        return contract && contract.familyRootKeyById
            ? cloneValue(contract.familyRootKeyById)
            : cloneValue(FALLBACK_VALIDATION_FAMILY_KEY_BY_ID);
    }

    function createPhase2ValidationCheckIfAvailable(check = {}) {
        const factory = typeof phase2.createPhase2ValidationCheck === 'function'
            ? phase2.createPhase2ValidationCheck
            : null;
        return factory ? factory(check) : cloneValue(check);
    }

    function getPhase2ValidationFactory(factoryName) {
        if (typeof phase2[factoryName] === 'function') {
            return phase2[factoryName];
        }

        throw new Error(`[worldgen/phase2] Missing validation contract factory: ${factoryName}.`);
    }

    function createPhase2ValidationReport(input = {}) {
        const createValidationReportSkeleton = getPhase2ValidationFactory('createPhase2ValidationReportSkeleton');
        const assertValidationReport = typeof phase2.assertPhase2ValidationReport === 'function'
            ? phase2.assertPhase2ValidationReport
            : null;
        const validationReport = createValidationReportSkeleton(input);

        if (assertValidationReport) {
            assertValidationReport(validationReport);
        }

        return validationReport;
    }

    function resolveValidationFamilyId(familyId) {
        const normalizedFamilyId = normalizeString(familyId);
        return getPhase2ValidationFamilyIds().includes(normalizedFamilyId) ? normalizedFamilyId : '';
    }

    function resolveValidationStatus(status, fallbackStatus = 'not_run') {
        const normalizedStatus = normalizeString(status);
        return getPhase2ValidationStatusEnums().familyAndCheck.includes(normalizedStatus)
            ? normalizedStatus
            : fallbackStatus;
    }

    function resolveValidationFinalStatus(status, fallbackStatus = 'pass') {
        const normalizedStatus = normalizeString(status);
        return getPhase2ValidationStatusEnums().final.includes(normalizedStatus)
            ? normalizedStatus
            : fallbackStatus;
    }

    function resolveValidationStatusWeight(status) {
        switch (resolveValidationStatus(status)) {
        case 'fail':
            return 4;
        case 'rebalance_required':
            return 3;
        case 'warning':
            return 2;
        case 'pass':
            return 1;
        default:
            return 0;
        }
    }

    function resolveDominantValidationStatus(statuses = [], fallbackStatus = 'not_run') {
        const normalizedStatuses = Array.isArray(statuses) ? statuses : [];
        let dominantStatus = resolveValidationStatus(fallbackStatus, 'not_run');

        normalizedStatuses.forEach((status) => {
            const resolvedStatus = resolveValidationStatus(status, dominantStatus);
            if (resolveValidationStatusWeight(resolvedStatus) > resolveValidationStatusWeight(dominantStatus)) {
                dominantStatus = resolvedStatus;
            }
        });

        return dominantStatus;
    }

    function getValidationFamilySection(report, familyId) {
        const familyKeyById = getPhase2ValidationFamilyKeyById();
        const resolvedFamilyId = resolveValidationFamilyId(familyId);
        const familyKey = familyKeyById[resolvedFamilyId];

        if (!familyKey) {
            throw new Error(`[worldgen/phase2] Unknown validation family: ${familyId}.`);
        }

        return {
            familyId: resolvedFamilyId,
            familyKey,
            section: report[familyKey]
        };
    }

    function rebuildPhase2ValidationReport(report, mutator) {
        const workingReport = cloneValue(createPhase2ValidationReport(report));
        mutator(workingReport);
        return createPhase2ValidationReport(workingReport);
    }

    function setPhase2ValidationFamilyStatus(report, familyId, status) {
        return rebuildPhase2ValidationReport(report, (workingReport) => {
            const family = getValidationFamilySection(workingReport, familyId);
            workingReport[family.familyKey].status = resolveValidationStatus(status);
        });
    }

    function upsertByStableId(items, stableIdKey, nextItem) {
        const normalizedStableId = normalizeString(nextItem && nextItem[stableIdKey]);
        const nextItems = Array.isArray(items) ? items.map((item) => cloneValue(item)) : [];

        if (!normalizedStableId) {
            nextItems.push(cloneValue(nextItem));
            return nextItems;
        }

        const existingIndex = nextItems.findIndex((item) => {
            return normalizeString(item && item[stableIdKey]) === normalizedStableId;
        });

        if (existingIndex >= 0) {
            nextItems[existingIndex] = cloneValue(nextItem);
            return nextItems;
        }

        nextItems.push(cloneValue(nextItem));
        return nextItems;
    }

    function addPhase2ValidationCheck(report, familyId, check) {
        const createValidationCheck = getPhase2ValidationFactory('createPhase2ValidationCheck');
        const normalizedCheck = createValidationCheck(check);

        return rebuildPhase2ValidationReport(report, (workingReport) => {
            const family = getValidationFamilySection(workingReport, familyId);
            const nextChecks = upsertByStableId(family.section.checks, 'checkId', normalizedCheck);
            const nextStatus = resolveDominantValidationStatus(
                nextChecks.map((entry) => entry.status),
                family.section.status
            );

            workingReport[family.familyKey].checks = nextChecks;
            workingReport[family.familyKey].status = nextStatus;
        });
    }

    function collectPhase2ValidationRecommendation(report, recommendation) {
        const createValidationRecommendation = getPhase2ValidationFactory(
            'createPhase2ValidationRecommendation'
        );
        const normalizedRecommendation = createValidationRecommendation(recommendation);
        const familyId = resolveValidationFamilyId(normalizedRecommendation.familyId);

        if (!familyId) {
            throw new Error('[worldgen/phase2] Validation recommendation requires a supported familyId.');
        }

        return rebuildPhase2ValidationReport(report, (workingReport) => {
            const family = getValidationFamilySection(workingReport, familyId);
            const nextRecommendations = upsertByStableId(
                workingReport.rebalanceRecommendations,
                'recommendationId',
                normalizedRecommendation
            );
            const nextRecommendationIds = uniqueStrings(
                family.section.recommendationIds.concat([normalizedRecommendation.recommendationId])
            );

            workingReport.rebalanceRecommendations = nextRecommendations;
            workingReport[family.familyKey].recommendationIds = nextRecommendationIds;
            workingReport[family.familyKey].status = resolveDominantValidationStatus(
                [family.section.status, 'rebalance_required'],
                family.section.status
            );
        });
    }

    function addPhase2ValidationRecommendation(report, recommendation) {
        return collectPhase2ValidationRecommendation(report, recommendation);
    }

    function collectPhase2ValidationBlockingReason(report, blockingReason) {
        const createValidationBlockingReason = getPhase2ValidationFactory(
            'createPhase2ValidationBlockingReason'
        );
        const normalizedBlockingReason = createValidationBlockingReason(blockingReason);
        const familyId = resolveValidationFamilyId(normalizedBlockingReason.familyId);

        if (!familyId) {
            throw new Error('[worldgen/phase2] Validation blocking reason requires a supported familyId.');
        }

        return rebuildPhase2ValidationReport(report, (workingReport) => {
            const family = getValidationFamilySection(workingReport, familyId);
            const nextBlockingReasons = upsertByStableId(
                workingReport.blockingReasons,
                'blockingReasonId',
                normalizedBlockingReason
            );
            const nextBlockingReasonIds = uniqueStrings(
                family.section.blockingReasonIds.concat([normalizedBlockingReason.blockingReasonId])
            );

            workingReport.blockingReasons = nextBlockingReasons;
            workingReport[family.familyKey].blockingReasonIds = nextBlockingReasonIds;
            workingReport[family.familyKey].status = 'fail';
        });
    }

    function addPhase2ValidationBlockingReason(report, blockingReason) {
        return collectPhase2ValidationBlockingReason(report, blockingReason);
    }

    function finalizePhase2ValidationReport(report) {
        return rebuildPhase2ValidationReport(report, (workingReport) => {
            const familyStatuses = getPhase2ValidationFamilyIds().map((familyId) => {
                const family = getValidationFamilySection(workingReport, familyId);
                const nextStatus = resolveDominantValidationStatus(
                    []
                        .concat(family.section.status)
                        .concat((family.section.checks || []).map((check) => check.status))
                        .concat(family.section.recommendationIds.length ? ['rebalance_required'] : [])
                        .concat(family.section.blockingReasonIds.length ? ['fail'] : []),
                    family.section.status
                );

                workingReport[family.familyKey].status = nextStatus;
                return nextStatus;
            });

            if (workingReport.blockingReasons.length || familyStatuses.includes('fail')) {
                workingReport.finalStatus = 'fail';
                return;
            }

            if (
                workingReport.rebalanceRecommendations.length
                || familyStatuses.includes('rebalance_required')
                || familyStatuses.includes('not_run')
            ) {
                workingReport.finalStatus = 'rebalance_required';
                return;
            }

            workingReport.finalStatus = resolveValidationFinalStatus('pass');
        });
    }

    function getStructuralValidationDependencies() {
        return {
            validatePressureFieldPackage: typeof phase2.validatePressureFieldPackage === 'function'
                ? phase2.validatePressureFieldPackage
                : null,
            validateEnvironmentalRhythmPackage: typeof phase2.validateEnvironmentalRhythmPackage === 'function'
                ? phase2.validateEnvironmentalRhythmPackage
                : null
        };
    }

    function getStructuralPackageCandidate(input = {}, packageKey) {
        const directCandidate = input[packageKey];
        return isPlainObject(directCandidate) ? directCandidate : null;
    }

    function getStructuralValidationIssueDetails(issues = [], limit = 4) {
        return (Array.isArray(issues) ? issues : [])
            .slice(0, limit)
            .map((issue) => `${normalizeString(issue.code)} at ${normalizeString(issue.path)}`);
    }

    function getStructuralValidationAffectedPaths(issues = [], limit = 8) {
        return uniqueStrings(
            (Array.isArray(issues) ? issues : [])
                .slice(0, limit)
                .map((issue) => normalizeString(issue.path))
        );
    }

    function resolveStructuralMetaStatus(metaValue) {
        const resolvedStatus = resolveValidationStatus(metaValue, 'not_run');
        if (resolvedStatus === 'not_run') {
            return 'rebalance_required';
        }

        return resolvedStatus;
    }

    function readValidationMetaStatus(packageCandidate, metaKey) {
        const validationMeta = isPlainObject(packageCandidate && packageCandidate.validationMeta)
            ? packageCandidate.validationMeta
            : {};
        return resolveStructuralMetaStatus(validationMeta[metaKey]);
    }

    function addStructuralValidationCheck(report, check) {
        return addPhase2ValidationCheck(report, 'structural', check);
    }

    function addStructuralValidationBlockingReason(report, blockingReason) {
        return addPhase2ValidationBlockingReason(report, {
            ...blockingReason,
            familyId: 'structural'
        });
    }

    function runStructuralPackageContractValidation(report, packageCandidate, validator, options = {}) {
        const packageLabel = normalizeString(options.packageLabel);
        const packageKey = normalizeString(options.packageKey);
        const missingPackageBlockingReasonId = normalizeString(options.missingPackageBlockingReasonId);
        const missingPackageReasonCode = normalizeString(options.missingPackageReasonCode);
        const missingPackageMessage = normalizeString(options.missingPackageMessage);
        const schemaCheckId = normalizeString(options.schemaCheckId);

        if (!isPlainObject(packageCandidate)) {
            let nextReport = addStructuralValidationCheck(report, {
                checkId: schemaCheckId,
                status: 'fail',
                message: `${packageLabel} is missing, so structural package completeness cannot pass.`,
                details: [missingPackageMessage],
                affectedPaths: [packageKey],
                meta: {
                    structuralValidation: true,
                    packageKey,
                    packageLabel,
                    packagePresent: false
                }
            });
            nextReport = addStructuralValidationBlockingReason(nextReport, {
                blockingReasonId: missingPackageBlockingReasonId,
                reasonCode: missingPackageReasonCode,
                message: missingPackageMessage,
                affectedPaths: [packageKey],
                meta: {
                    packageKey,
                    packageLabel,
                    structuralValidation: true
                }
            });
            return nextReport;
        }

        if (typeof validator !== 'function') {
            return addStructuralValidationCheck(report, {
                checkId: schemaCheckId,
                status: 'fail',
                message: `${packageLabel} structural validation is unavailable because its contract validator is missing.`,
                details: [`Missing validator for ${packageKey}.`],
                affectedPaths: [packageKey],
                meta: {
                    structuralValidation: true,
                    packageKey,
                    packageLabel,
                    validatorPresent: false
                }
            });
        }

        const validation = validator(packageCandidate);
        const issues = Array.isArray(validation && validation.issues) ? validation.issues : [];
        let nextReport = addStructuralValidationCheck(report, {
            checkId: schemaCheckId,
            status: validation && validation.isValid ? 'pass' : 'fail',
            message: validation && validation.isValid
                ? `${packageLabel} is structurally complete and contract-valid.`
                : `${packageLabel} has explicit structural contract failures.`,
            details: validation && validation.isValid
                ? [`${packageLabel} passed completeness and schema stability checks.`]
                : getStructuralValidationIssueDetails(issues),
            affectedPaths: validation && validation.isValid
                ? []
                : getStructuralValidationAffectedPaths(issues),
            meta: {
                structuralValidation: true,
                packageKey,
                packageLabel,
                issueCount: issues.length,
                contractId: normalizeString(validation && validation.contractId)
            }
        });

        if (!(validation && validation.isValid)) {
            nextReport = addStructuralValidationBlockingReason(nextReport, {
                blockingReasonId: `${schemaCheckId}:blocking`,
                reasonCode: `${packageKey}_structural_contract_failure`,
                message: `${packageLabel} must be structurally valid before downstream validation can pass.`,
                affectedPaths: getStructuralValidationAffectedPaths(issues),
                meta: {
                    packageKey,
                    packageLabel,
                    issueCount: issues.length,
                    structuralValidation: true
                }
            });
        }

        return nextReport;
    }

    function runStructuralValidationMetaCheck(report, packageCandidate, options = {}) {
        const packageLabel = normalizeString(options.packageLabel);
        const packageKey = normalizeString(options.packageKey);
        const metaKey = normalizeString(options.metaKey);
        const checkId = normalizeString(options.checkId);
        const messagePrefix = normalizeString(options.messagePrefix);
        const resolvedStatus = readValidationMetaStatus(packageCandidate, metaKey);

        return addStructuralValidationCheck(report, {
            checkId,
            status: resolvedStatus,
            message: `${packageLabel} ${messagePrefix} status is ${resolvedStatus}.`,
            details: [`validationMeta.${metaKey}=${normalizeString(packageCandidate.validationMeta && packageCandidate.validationMeta[metaKey]) || 'not_run'}`],
            affectedPaths: [`${packageKey}.validationMeta.${metaKey}`],
            meta: {
                structuralValidation: true,
                packageKey,
                packageLabel,
                metaKey
            }
        });
    }

    function runStructuralRegionalProfilePresenceCheck(report, packageCandidate, options = {}) {
        const packageLabel = normalizeString(options.packageLabel);
        const packageKey = normalizeString(options.packageKey);
        const checkId = normalizeString(options.checkId);
        const profiles = Array.isArray(packageCandidate && packageCandidate.regionalProfiles)
            ? packageCandidate.regionalProfiles
            : [];
        const hasProfiles = profiles.length > 0;
        let nextReport = addStructuralValidationCheck(report, {
            checkId,
            status: hasProfiles ? 'pass' : 'fail',
            message: hasProfiles
                ? `${packageLabel} exposes record-bound profiles.`
                : `${packageLabel} is missing required record-bound profiles.`,
            details: [
                hasProfiles
                    ? `regionalProfiles count=${profiles.length}`
                    : 'regionalProfiles must contain at least one contract-valid profile.'
            ],
            affectedPaths: [`${packageKey}.regionalProfiles`],
            meta: {
                structuralValidation: true,
                packageKey,
                packageLabel,
                profileCount: profiles.length
            }
        });

        if (!hasProfiles) {
            nextReport = addStructuralValidationBlockingReason(nextReport, {
                blockingReasonId: `${checkId}:blocking`,
                reasonCode: `${packageKey}_missing_regional_profiles`,
                message: `${packageLabel} must expose record-bound profiles before structural validation can pass.`,
                affectedPaths: [`${packageKey}.regionalProfiles`],
                meta: {
                    packageKey,
                    packageLabel,
                    structuralValidation: true
                }
            });
        }

        return nextReport;
    }

    function runStructuralValidationFamily(report, input = {}, context = {}) {
        const dependencies = getStructuralValidationDependencies();
        const pressureFieldPackage = getStructuralPackageCandidate(input, 'pressureFieldPackage');
        const environmentalRhythmPackage = getStructuralPackageCandidate(input, 'environmentalRhythmPackage');

        let nextReport = report;

        nextReport = runStructuralPackageContractValidation(
            nextReport,
            pressureFieldPackage,
            dependencies.validatePressureFieldPackage,
            {
                packageLabel: 'PressureFieldPackage',
                packageKey: 'pressureFieldPackage',
                schemaCheckId: 'phase2.structural.pressure_package_schema',
                missingPackageBlockingReasonId: 'phase2.structural.pressure_package_missing',
                missingPackageReasonCode: 'missing_pressure_field_package',
                missingPackageMessage: 'Structural validation requires a PressureFieldPackage candidate.'
            }
        );
        if (isPlainObject(pressureFieldPackage)) {
            nextReport = runStructuralValidationMetaCheck(nextReport, pressureFieldPackage, {
                packageLabel: 'PressureFieldPackage',
                packageKey: 'pressureFieldPackage',
                metaKey: 'fieldRangeStatus',
                checkId: 'phase2.structural.pressure_field_ranges',
                messagePrefix: 'field range'
            });
            nextReport = runStructuralValidationMetaCheck(nextReport, pressureFieldPackage, {
                packageLabel: 'PressureFieldPackage',
                packageKey: 'pressureFieldPackage',
                metaKey: 'determinismStatus',
                checkId: 'phase2.structural.pressure_determinism',
                messagePrefix: 'determinism'
            });
            nextReport = runStructuralRegionalProfilePresenceCheck(nextReport, pressureFieldPackage, {
                packageLabel: 'PressureFieldPackage',
                packageKey: 'pressureFieldPackage',
                checkId: 'phase2.structural.pressure_record_profiles'
            });
        }

        nextReport = runStructuralPackageContractValidation(
            nextReport,
            environmentalRhythmPackage,
            dependencies.validateEnvironmentalRhythmPackage,
            {
                packageLabel: 'EnvironmentalRhythmPackage',
                packageKey: 'environmentalRhythmPackage',
                schemaCheckId: 'phase2.structural.rhythm_package_schema',
                missingPackageBlockingReasonId: 'phase2.structural.rhythm_package_missing',
                missingPackageReasonCode: 'missing_environmental_rhythm_package',
                missingPackageMessage: 'Structural validation requires an EnvironmentalRhythmPackage candidate.'
            }
        );
        if (isPlainObject(environmentalRhythmPackage)) {
            nextReport = runStructuralValidationMetaCheck(nextReport, environmentalRhythmPackage, {
                packageLabel: 'EnvironmentalRhythmPackage',
                packageKey: 'environmentalRhythmPackage',
                metaKey: 'fieldRangeStatus',
                checkId: 'phase2.structural.rhythm_field_ranges',
                messagePrefix: 'field range'
            });
            nextReport = runStructuralValidationMetaCheck(nextReport, environmentalRhythmPackage, {
                packageLabel: 'EnvironmentalRhythmPackage',
                packageKey: 'environmentalRhythmPackage',
                metaKey: 'determinismStatus',
                checkId: 'phase2.structural.rhythm_determinism',
                messagePrefix: 'determinism'
            });
            nextReport = runStructuralRegionalProfilePresenceCheck(nextReport, environmentalRhythmPackage, {
                packageLabel: 'EnvironmentalRhythmPackage',
                packageKey: 'environmentalRhythmPackage',
                checkId: 'phase2.structural.rhythm_record_profiles'
            });
        }

        const familySection = getValidationFamilySection(nextReport, 'structural').section;
        return {
            report: nextReport,
            stageResult: deepFreeze({
                familyId: 'structural',
                stageId: 'phase2.validation.structural',
                status: resolveValidationStatus(familySection.status, 'not_run'),
                usedCustomRunner: true,
                context: {
                    recordBindingContextId: normalizeString(context.recordBindingContextId),
                    sourcePressureFieldPackageId: normalizeString(context.sourcePressureFieldPackageId),
                    sourceEnvironmentalRhythmPackageId: normalizeString(context.sourceEnvironmentalRhythmPackageId)
                }
            })
        };
    }

    function getCausalValidationDependencies() {
        return {
            validatePhase2InputBundle: typeof phase2.validatePhase2InputBundle === 'function'
                ? phase2.validatePhase2InputBundle
                : null,
            validatePhase2RecordBindingLayer: typeof phase2.validatePhase2RecordBindingLayer === 'function'
                ? phase2.validatePhase2RecordBindingLayer
                : null
        };
    }

    function getCausalInputBundle(input = {}) {
        if (isPlainObject(input.phase2InputBundle)) {
            return input.phase2InputBundle;
        }

        return null;
    }

    function getCausalBindingLayer(input = {}) {
        if (isPlainObject(input.phase2RecordBindingLayer)) {
            return input.phase2RecordBindingLayer;
        }

        if (isPlainObject(input.recordBindingLayer)) {
            return input.recordBindingLayer;
        }

        if (isPlainObject(input.phase2InputBundle) && typeof phase2.createPhase2RecordBindingLayer === 'function') {
            return phase2.createPhase2RecordBindingLayer(input.phase2InputBundle);
        }

        return null;
    }

    function addCausalValidationCheck(report, check) {
        return addPhase2ValidationCheck(report, 'causal', check);
    }

    function addCausalValidationBlockingReason(report, blockingReason) {
        return addPhase2ValidationBlockingReason(report, {
            ...blockingReason,
            familyId: 'causal'
        });
    }

    function runCausalRootTruthCorrelationCheck(report, packageCandidate, bundleCandidate, options = {}) {
        const packageLabel = normalizeString(options.packageLabel);
        const packageKey = normalizeString(options.packageKey);
        const checkId = normalizeString(options.checkId);
        const packageSourceId = normalizeString(packageCandidate && packageCandidate.sourceMacroGeographyPackageId);
        const bundleSourceId = normalizeString(bundleCandidate && bundleCandidate.sourceMacroGeographyPackageId);
        const aligned = Boolean(packageSourceId && bundleSourceId && packageSourceId === bundleSourceId);

        let nextReport = addCausalValidationCheck(report, {
            checkId,
            status: aligned ? 'pass' : 'fail',
            message: aligned
                ? `${packageLabel} preserves correlation with the completed Phase 1 root package id.`
                : `${packageLabel} has lost correlation with the completed Phase 1 root package id.`,
            details: [
                `package.sourceMacroGeographyPackageId=${packageSourceId || '<missing>'}`,
                `bundle.sourceMacroGeographyPackageId=${bundleSourceId || '<missing>'}`
            ],
            affectedPaths: [
                `${packageKey}.sourceMacroGeographyPackageId`,
                'phase2InputBundle.sourceMacroGeographyPackageId'
            ],
            meta: {
                causalValidation: true,
                packageKey,
                packageLabel
            }
        });

        if (!aligned) {
            nextReport = addCausalValidationBlockingReason(nextReport, {
                blockingReasonId: `${checkId}:blocking`,
                reasonCode: `${packageKey}_root_truth_misalignment`,
                message: `${packageLabel} must remain correlated to the completed MacroGeographyPackage root truth.`,
                affectedPaths: [
                    `${packageKey}.sourceMacroGeographyPackageId`,
                    'phase2InputBundle.sourceMacroGeographyPackageId'
                ],
                meta: {
                    packageKey,
                    packageLabel,
                    causalValidation: true
                }
            });
        }

        return nextReport;
    }

    function runCausalBindingValidationCheck(report, bindingLayer, validator) {
        if (!isPlainObject(bindingLayer)) {
            let nextReport = addCausalValidationCheck(report, {
                checkId: 'phase2.causal.binding_layer_presence',
                status: 'fail',
                message: 'Causal validation requires a Phase2RecordBindingLayer candidate.',
                details: ['phase2RecordBindingLayer is missing.'],
                affectedPaths: ['phase2RecordBindingLayer'],
                meta: {
                    causalValidation: true,
                    bindingLayerPresent: false
                }
            });
            nextReport = addCausalValidationBlockingReason(nextReport, {
                blockingReasonId: 'phase2.causal.binding_layer_missing',
                reasonCode: 'missing_phase2_record_binding_layer',
                message: 'Causal validation cannot pass without a Phase2RecordBindingLayer.',
                affectedPaths: ['phase2RecordBindingLayer'],
                meta: {
                    causalValidation: true
                }
            });
            return nextReport;
        }

        const validation = typeof validator === 'function'
            ? validator(bindingLayer)
            : { isValid: false, issues: [{ code: 'missing_binding_validator', path: 'phase2RecordBindingLayer' }] };
        const issues = Array.isArray(validation.issues) ? validation.issues : [];
        let nextReport = addCausalValidationCheck(report, {
            checkId: 'phase2.causal.binding_layer_integrity',
            status: validation.isValid ? 'pass' : 'fail',
            message: validation.isValid
                ? 'Phase2RecordBindingLayer preserves canonical binding integrity.'
                : 'Phase2RecordBindingLayer has explicit binding-integrity failures.',
            details: validation.isValid
                ? ['Binding tables, target surfaces, and canonical ids are structurally aligned.']
                : getStructuralValidationIssueDetails(issues),
            affectedPaths: validation.isValid ? [] : getStructuralValidationAffectedPaths(issues),
            meta: {
                causalValidation: true,
                bindingLayerId: normalizeString(bindingLayer.bindingLayerId),
                issueCount: issues.length
            }
        });

        if (!validation.isValid) {
            nextReport = addCausalValidationBlockingReason(nextReport, {
                blockingReasonId: 'phase2.causal.binding_layer_integrity:blocking',
                reasonCode: 'invalid_phase2_record_binding_layer',
                message: 'Phase2RecordBindingLayer must preserve canonical binding integrity before causal validation can pass.',
                affectedPaths: getStructuralValidationAffectedPaths(issues),
                meta: {
                    causalValidation: true,
                    issueCount: issues.length
                }
            });
        }

        return nextReport;
    }

    function runCausalRecordBindingContextAlignmentCheck(report, packageCandidate, bindingLayer, options = {}) {
        const packageLabel = normalizeString(options.packageLabel);
        const packageKey = normalizeString(options.packageKey);
        const checkId = normalizeString(options.checkId);
        const packageBindingContextId = normalizeString(packageCandidate && packageCandidate.recordBindingContextId);
        const bindingLayerContextId = normalizeString(bindingLayer && bindingLayer.recordBindingContextId);
        const aligned = Boolean(packageBindingContextId && bindingLayerContextId && packageBindingContextId === bindingLayerContextId);

        let nextReport = addCausalValidationCheck(report, {
            checkId,
            status: aligned ? 'pass' : 'fail',
            message: aligned
                ? `${packageLabel} preserves record-binding context integrity.`
                : `${packageLabel} has lost record-binding context integrity.`,
            details: [
                `package.recordBindingContextId=${packageBindingContextId || '<missing>'}`,
                `binding.recordBindingContextId=${bindingLayerContextId || '<missing>'}`
            ],
            affectedPaths: [
                `${packageKey}.recordBindingContextId`,
                'phase2RecordBindingLayer.recordBindingContextId'
            ],
            meta: {
                causalValidation: true,
                packageKey,
                packageLabel
            }
        });

        if (!aligned) {
            nextReport = addCausalValidationBlockingReason(nextReport, {
                blockingReasonId: `${checkId}:blocking`,
                reasonCode: `${packageKey}_record_binding_context_misalignment`,
                message: `${packageLabel} must preserve the canonical recordBindingContextId emitted by Phase2RecordBindingLayer.`,
                affectedPaths: [
                    `${packageKey}.recordBindingContextId`,
                    'phase2RecordBindingLayer.recordBindingContextId'
                ],
                meta: {
                    packageKey,
                    packageLabel,
                    causalValidation: true
                }
            });
        }

        return nextReport;
    }

    function validateCausalRegionalProfilesAgainstBinding(report, packageCandidate, bindingLayer, options = {}) {
        const packageLabel = normalizeString(options.packageLabel);
        const packageKey = normalizeString(options.packageKey);
        const checkId = normalizeString(options.checkId);
        const packageId = normalizeString(packageCandidate && packageCandidate.packageId);
        const profiles = Array.isArray(packageCandidate && packageCandidate.regionalProfiles)
            ? packageCandidate.regionalProfiles
            : [];
        const byRecordType = isPlainObject(bindingLayer && bindingLayer.profileTargetTables && bindingLayer.profileTargetTables.byRecordType)
            ? bindingLayer.profileTargetTables.byRecordType
            : {};
        const failures = [];

        profiles.forEach((profile, index) => {
            const recordType = normalizeString(profile && profile.recordType);
            const recordId = normalizeString(profile && profile.recordId);
            const sourcePackageId = normalizeString(profile && profile.sourcePackageId);
            const targetEntry = isPlainObject(byRecordType[recordType]) ? byRecordType[recordType] : null;
            const allowedRecordIds = Array.isArray(targetEntry && targetEntry.recordIds) ? targetEntry.recordIds : [];

            if (!targetEntry) {
                failures.push({
                    code: 'unknown_causal_profile_record_type',
                    path: `${packageKey}.regionalProfiles[${index}].recordType`
                });
            } else if (!allowedRecordIds.includes(recordId)) {
                failures.push({
                    code: 'unknown_causal_profile_record_id',
                    path: `${packageKey}.regionalProfiles[${index}].recordId`
                });
            }

            if (packageId && sourcePackageId !== packageId) {
                failures.push({
                    code: 'causal_profile_source_package_mismatch',
                    path: `${packageKey}.regionalProfiles[${index}].sourcePackageId`
                });
            }
        });

        let nextReport = addCausalValidationCheck(report, {
            checkId,
            status: failures.length ? 'fail' : 'pass',
            message: failures.length
                ? `${packageLabel} has record-bound profiles that do not align with canonical binding targets.`
                : `${packageLabel} record-bound profiles align with canonical binding targets.`,
            details: failures.length
                ? failures.slice(0, 6).map((failure) => `${failure.code} at ${failure.path}`)
                : [`regionalProfiles count=${profiles.length}`],
            affectedPaths: failures.length
                ? uniqueStrings(failures.map((failure) => failure.path))
                : [],
            meta: {
                causalValidation: true,
                packageKey,
                packageLabel,
                profileCount: profiles.length,
                failureCount: failures.length
            }
        });

        if (failures.length) {
            nextReport = addCausalValidationBlockingReason(nextReport, {
                blockingReasonId: `${checkId}:blocking`,
                reasonCode: `${packageKey}_regional_profile_binding_mismatch`,
                message: `${packageLabel} regionalProfiles must align with canonical binding targets and preserve sourcePackageId integrity.`,
                affectedPaths: uniqueStrings(failures.map((failure) => failure.path)),
                meta: {
                    packageKey,
                    packageLabel,
                    causalValidation: true,
                    failureCount: failures.length
                }
            });
        }

        return nextReport;
    }

    function runCausalValidationFamily(report, input = {}, context = {}) {
        const dependencies = getCausalValidationDependencies();
        const bundleCandidate = getCausalInputBundle(input);
        const bindingLayer = getCausalBindingLayer(input);
        const pressureFieldPackage = getStructuralPackageCandidate(input, 'pressureFieldPackage');
        const environmentalRhythmPackage = getStructuralPackageCandidate(input, 'environmentalRhythmPackage');
        let nextReport = report;

        if (!isPlainObject(bundleCandidate)) {
            nextReport = addCausalValidationCheck(nextReport, {
                checkId: 'phase2.causal.root_truth_bundle_presence',
                status: 'fail',
                message: 'Causal validation requires a Phase2InputBundle candidate.',
                details: ['phase2InputBundle is missing, so root-package correlation cannot be verified.'],
                affectedPaths: ['phase2InputBundle'],
                meta: {
                    causalValidation: true,
                    bundlePresent: false
                }
            });
            nextReport = addCausalValidationBlockingReason(nextReport, {
                blockingReasonId: 'phase2.causal.root_truth_bundle_missing',
                reasonCode: 'missing_phase2_input_bundle',
                message: 'Causal validation cannot pass without a Phase2InputBundle.',
                affectedPaths: ['phase2InputBundle'],
                meta: {
                    causalValidation: true
                }
            });
        } else if (typeof dependencies.validatePhase2InputBundle === 'function') {
            const bundleValidation = dependencies.validatePhase2InputBundle(bundleCandidate);
            const bundleIssues = Array.isArray(bundleValidation.issues) ? bundleValidation.issues : [];
            nextReport = addCausalValidationCheck(nextReport, {
                checkId: 'phase2.causal.root_truth_bundle_integrity',
                status: bundleValidation.isValid ? 'pass' : 'fail',
                message: bundleValidation.isValid
                    ? 'Phase2InputBundle preserves completed Phase 1 root-package truth.'
                    : 'Phase2InputBundle has explicit root-truth integrity failures.',
                details: bundleValidation.isValid
                    ? ['Bundle support and record collections are structurally aligned with completed Phase 1 truth.']
                    : getStructuralValidationIssueDetails(bundleIssues),
                affectedPaths: bundleValidation.isValid ? [] : getStructuralValidationAffectedPaths(bundleIssues),
                meta: {
                    causalValidation: true,
                    issueCount: bundleIssues.length
                }
            });
        }

        nextReport = runCausalBindingValidationCheck(
            nextReport,
            bindingLayer,
            dependencies.validatePhase2RecordBindingLayer
        );

        if (isPlainObject(pressureFieldPackage) && isPlainObject(bundleCandidate)) {
            nextReport = runCausalRootTruthCorrelationCheck(nextReport, pressureFieldPackage, bundleCandidate, {
                packageLabel: 'PressureFieldPackage',
                packageKey: 'pressureFieldPackage',
                checkId: 'phase2.causal.pressure_root_truth_correlation'
            });
        }
        if (isPlainObject(environmentalRhythmPackage) && isPlainObject(bundleCandidate)) {
            nextReport = runCausalRootTruthCorrelationCheck(nextReport, environmentalRhythmPackage, bundleCandidate, {
                packageLabel: 'EnvironmentalRhythmPackage',
                packageKey: 'environmentalRhythmPackage',
                checkId: 'phase2.causal.rhythm_root_truth_correlation'
            });
        }

        if (isPlainObject(pressureFieldPackage) && isPlainObject(bindingLayer)) {
            nextReport = runCausalRecordBindingContextAlignmentCheck(nextReport, pressureFieldPackage, bindingLayer, {
                packageLabel: 'PressureFieldPackage',
                packageKey: 'pressureFieldPackage',
                checkId: 'phase2.causal.pressure_record_binding_context'
            });
            nextReport = validateCausalRegionalProfilesAgainstBinding(nextReport, pressureFieldPackage, bindingLayer, {
                packageLabel: 'PressureFieldPackage',
                packageKey: 'pressureFieldPackage',
                checkId: 'phase2.causal.pressure_regional_profile_binding'
            });
        }

        if (isPlainObject(environmentalRhythmPackage) && isPlainObject(bindingLayer)) {
            nextReport = runCausalRecordBindingContextAlignmentCheck(nextReport, environmentalRhythmPackage, bindingLayer, {
                packageLabel: 'EnvironmentalRhythmPackage',
                packageKey: 'environmentalRhythmPackage',
                checkId: 'phase2.causal.rhythm_record_binding_context'
            });
            nextReport = validateCausalRegionalProfilesAgainstBinding(nextReport, environmentalRhythmPackage, bindingLayer, {
                packageLabel: 'EnvironmentalRhythmPackage',
                packageKey: 'environmentalRhythmPackage',
                checkId: 'phase2.causal.rhythm_regional_profile_binding'
            });
        }

        const familySection = getValidationFamilySection(nextReport, 'causal').section;
        return {
            report: nextReport,
            stageResult: deepFreeze({
                familyId: 'causal',
                stageId: 'phase2.validation.causal',
                status: resolveValidationStatus(familySection.status, 'not_run'),
                usedCustomRunner: true,
                context: {
                    recordBindingContextId: normalizeString(context.recordBindingContextId),
                    sourceMacroGeographyPackageId: normalizeString(context.sourceMacroGeographyPackageId)
                }
            })
        };
    }

    function getBoundaryValidationDependencies() {
        return {
            validatePhase2InputBundle: typeof phase2.validatePhase2InputBundle === 'function'
                ? phase2.validatePhase2InputBundle
                : null
        };
    }

    function addBoundaryValidationCheck(report, check) {
        return addPhase2ValidationCheck(report, 'boundary', check);
    }

    function addBoundaryValidationBlockingReason(report, blockingReason) {
        return addPhase2ValidationBlockingReason(report, {
            ...blockingReason,
            familyId: 'boundary'
        });
    }

    function collectTruthyFlagPaths(candidate, targetKeys = [], path = '', matches = []) {
        if (!candidate || typeof candidate !== 'object') {
            return matches;
        }

        Object.entries(candidate).forEach(([key, value]) => {
            const nextPath = path ? `${path}.${key}` : key;
            if (targetKeys.includes(key) && value === true) {
                matches.push(nextPath);
            }

            if (value && typeof value === 'object') {
                collectTruthyFlagPaths(value, targetKeys, nextPath, matches);
            }
        });

        return matches;
    }

    function runBoundaryClimateDuplicationCheck(report, packageCandidate, options = {}) {
        const packageLabel = normalizeString(options.packageLabel);
        const packageKey = normalizeString(options.packageKey);
        const checkId = normalizeString(options.checkId);
        const duplicatedClimatePaths = collectTruthyFlagPaths(
            packageCandidate,
            ['climateGenerationRebuilt', 'rebuildsClimateGeneration']
        );

        let nextReport = addBoundaryValidationCheck(report, {
            checkId,
            status: duplicatedClimatePaths.length ? 'fail' : 'pass',
            message: duplicatedClimatePaths.length
                ? `${packageLabel} contains explicit climate-duplication markers.`
                : `${packageLabel} preserves the anti-climate-duplication boundary.`,
            details: duplicatedClimatePaths.length
                ? duplicatedClimatePaths.slice(0, 6).map((entry) => `climate duplication flag at ${entry}`)
                : ['No field or synthesis surface claims to rebuild climate generation.'],
            affectedPaths: duplicatedClimatePaths,
            meta: {
                boundaryValidation: true,
                packageKey,
                packageLabel,
                duplicatedClimatePathCount: duplicatedClimatePaths.length
            }
        });

        if (duplicatedClimatePaths.length) {
            nextReport = addBoundaryValidationBlockingReason(nextReport, {
                blockingReasonId: `${checkId}:blocking`,
                reasonCode: `${packageKey}_climate_duplication_detected`,
                message: `${packageLabel} must not duplicate completed Phase 1 climate generation.`,
                affectedPaths: duplicatedClimatePaths,
                meta: {
                    boundaryValidation: true,
                    packageKey,
                    packageLabel
                }
            });
        }

        return nextReport;
    }

    function runBoundaryHandoffLeakageCheck(report, bundleCandidate, validator) {
        if (!isPlainObject(bundleCandidate)) {
            return addBoundaryValidationCheck(report, {
                checkId: 'phase2.boundary.handoff_bundle_presence',
                status: 'warning',
                message: 'Boundary validation could not inspect handoff leakage because Phase2InputBundle is missing.',
                details: ['phase2InputBundle is absent.'],
                affectedPaths: ['phase2InputBundle'],
                meta: {
                    boundaryValidation: true,
                    bundlePresent: false
                }
            });
        }

        const validation = typeof validator === 'function'
            ? validator(bundleCandidate)
            : { isValid: false, issues: [] };
        const issues = Array.isArray(validation.issues) ? validation.issues : [];
        const leakageIssues = issues.filter((issue) => {
            const code = normalizeString(issue && issue.code);
            return code.includes('handoff')
                || code.includes('filtered_handoff')
                || code.includes('forbidden_filtered')
                || code.includes('blocked_forbidden_handoff')
                || code.includes('promoted_to_root_truth');
        });
        const affectedPaths = uniqueStrings(leakageIssues.map((issue) => normalizeString(issue.path)));

        let nextReport = addBoundaryValidationCheck(report, {
            checkId: 'phase2.boundary.handoff_leakage',
            status: leakageIssues.length ? 'fail' : 'pass',
            message: leakageIssues.length
                ? 'Phase2InputBundle shows explicit handoff-leakage boundary failures.'
                : 'Phase2InputBundle preserves the anti-handoff-leakage boundary.',
            details: leakageIssues.length
                ? leakageIssues.slice(0, 6).map((issue) => `${normalizeString(issue.code)} at ${normalizeString(issue.path)}`)
                : ['Filtered handoff remains bounded and is not promoted to root truth.'],
            affectedPaths,
            meta: {
                boundaryValidation: true,
                leakageIssueCount: leakageIssues.length
            }
        });

        if (leakageIssues.length) {
            nextReport = addBoundaryValidationBlockingReason(nextReport, {
                blockingReasonId: 'phase2.boundary.handoff_leakage:blocking',
                reasonCode: 'phase2_handoff_leakage_detected',
                message: 'Phase 2 must preserve filtered handoff boundaries and must not leak handoff semantics into root truth.',
                affectedPaths,
                meta: {
                    boundaryValidation: true,
                    leakageIssueCount: leakageIssues.length
                }
            });
        }

        return nextReport;
    }

    function runBoundaryNonInventionCheck(report, bindingLayer) {
        if (!isPlainObject(bindingLayer)) {
            let nextReport = addBoundaryValidationCheck(report, {
                checkId: 'phase2.boundary.non_invention_binding_presence',
                status: 'fail',
                message: 'Boundary validation requires a Phase2RecordBindingLayer to verify non-invention rules.',
                details: ['phase2RecordBindingLayer is missing.'],
                affectedPaths: ['phase2RecordBindingLayer'],
                meta: {
                    boundaryValidation: true,
                    bindingLayerPresent: false
                }
            });
            nextReport = addBoundaryValidationBlockingReason(nextReport, {
                blockingReasonId: 'phase2.boundary.non_invention_binding_missing',
                reasonCode: 'missing_phase2_record_binding_layer_for_boundary_validation',
                message: 'Boundary validation cannot verify non-invention rules without a Phase2RecordBindingLayer.',
                affectedPaths: ['phase2RecordBindingLayer'],
                meta: {
                    boundaryValidation: true
                }
            });
            return nextReport;
        }

        const inventsRecordIds = Boolean(
            bindingLayer.bindingMeta
            && Object.prototype.hasOwnProperty.call(bindingLayer.bindingMeta, 'inventsRecordIds')
            && bindingLayer.bindingMeta.inventsRecordIds
        );
        let nextReport = addBoundaryValidationCheck(report, {
            checkId: 'phase2.boundary.non_invention_rules',
            status: inventsRecordIds ? 'fail' : 'pass',
            message: inventsRecordIds
                ? 'Phase2RecordBindingLayer violates non-invention rules.'
                : 'Phase2RecordBindingLayer preserves non-invention rules.',
            details: [
                `bindingMeta.inventsRecordIds=${String(
                    bindingLayer.bindingMeta && bindingLayer.bindingMeta.inventsRecordIds
                )}`
            ],
            affectedPaths: ['phase2RecordBindingLayer.bindingMeta.inventsRecordIds'],
            meta: {
                boundaryValidation: true,
                bindingLayerId: normalizeString(bindingLayer.bindingLayerId)
            }
        });

        if (inventsRecordIds) {
            nextReport = addBoundaryValidationBlockingReason(nextReport, {
                blockingReasonId: 'phase2.boundary.non_invention_rules:blocking',
                reasonCode: 'phase2_invents_record_ids',
                message: 'Phase2RecordBindingLayer must not invent canonical record ids.',
                affectedPaths: ['phase2RecordBindingLayer.bindingMeta.inventsRecordIds'],
                meta: {
                    boundaryValidation: true
                }
            });
        }

        return nextReport;
    }

    function runBoundaryValidationFamily(report, input = {}, context = {}) {
        const dependencies = getBoundaryValidationDependencies();
        const bundleCandidate = getCausalInputBundle(input);
        const bindingLayer = getCausalBindingLayer(input);
        const pressureFieldPackage = getStructuralPackageCandidate(input, 'pressureFieldPackage');
        const environmentalRhythmPackage = getStructuralPackageCandidate(input, 'environmentalRhythmPackage');
        let nextReport = report;

        if (isPlainObject(pressureFieldPackage)) {
            nextReport = runBoundaryClimateDuplicationCheck(nextReport, pressureFieldPackage, {
                packageLabel: 'PressureFieldPackage',
                packageKey: 'pressureFieldPackage',
                checkId: 'phase2.boundary.pressure_climate_duplication'
            });
        }

        if (isPlainObject(environmentalRhythmPackage)) {
            nextReport = runBoundaryClimateDuplicationCheck(nextReport, environmentalRhythmPackage, {
                packageLabel: 'EnvironmentalRhythmPackage',
                packageKey: 'environmentalRhythmPackage',
                checkId: 'phase2.boundary.rhythm_climate_duplication'
            });
        }

        nextReport = runBoundaryHandoffLeakageCheck(
            nextReport,
            bundleCandidate,
            dependencies.validatePhase2InputBundle
        );
        nextReport = runBoundaryNonInventionCheck(nextReport, bindingLayer);

        const familySection = getValidationFamilySection(nextReport, 'boundary').section;
        return {
            report: nextReport,
            stageResult: deepFreeze({
                familyId: 'boundary',
                stageId: 'phase2.validation.boundary',
                status: resolveValidationStatus(familySection.status, 'not_run'),
                usedCustomRunner: true,
                context: {
                    recordBindingContextId: normalizeString(context.recordBindingContextId),
                    sourceMacroGeographyPackageId: normalizeString(context.sourceMacroGeographyPackageId)
                }
            })
        };
    }

    function addDistributionValidationCheck(report, check) {
        return addPhase2ValidationCheck(report, 'distribution', check);
    }

    function getFieldMeanValue(fieldCandidate) {
        if (isPlainObject(fieldCandidate) && isPlainObject(fieldCandidate.summary)) {
            const summaryMean = Number(fieldCandidate.summary.mean);
            if (Number.isFinite(summaryMean)) {
                return summaryMean;
            }
        }

        const value = Number(fieldCandidate && fieldCandidate.value);
        return Number.isFinite(value) ? value : null;
    }

    function collectNumericFieldValues(fieldMap = {}, preferredKeys = []) {
        const keys = Array.isArray(preferredKeys) && preferredKeys.length
            ? preferredKeys
            : Object.keys(isPlainObject(fieldMap) ? fieldMap : {});

        return keys
            .map((fieldId) => ({
                fieldId,
                value: getFieldMeanValue(fieldMap[fieldId])
            }))
            .filter((entry) => Number.isFinite(entry.value));
    }

    function computeDistributionStats(entries = []) {
        const values = (Array.isArray(entries) ? entries : [])
            .map((entry) => Number(entry && entry.value))
            .filter((value) => Number.isFinite(value));
        if (!values.length) {
            return {
                count: 0,
                mean: 0,
                min: 0,
                max: 0,
                spread: 0,
                uniqueRoundedCount: 0
            };
        }

        const min = Math.min(...values);
        const max = Math.max(...values);
        return {
            count: values.length,
            mean: values.reduce((sum, value) => sum + value, 0) / values.length,
            min,
            max,
            spread: max - min,
            uniqueRoundedCount: new Set(values.map((value) => value.toFixed(3))).size
        };
    }

    function rankDistributionEntries(entries = [], limit = 3) {
        return (Array.isArray(entries) ? entries : [])
            .slice()
            .sort((left, right) => Number(right.value) - Number(left.value))
            .slice(0, limit)
            .map((entry) => `${normalizeString(entry.fieldId)}=${Number(entry.value).toFixed(3)}`);
    }

    function runDistributionContrastCheck(report, packageCandidate, options = {}) {
        const packageLabel = normalizeString(options.packageLabel);
        const packageKey = normalizeString(options.packageKey);
        const synthesizedKeys = Array.isArray(options.synthesizedKeys) ? options.synthesizedKeys : [];
        const checkId = normalizeString(options.checkId);
        const spreadThreshold = Number(options.spreadThreshold) || 0.1;
        const minUniqueRoundedCount = Number(options.minUniqueRoundedCount) || 3;
        const fieldMap = isPlainObject(packageCandidate && packageCandidate.synthesized)
            ? packageCandidate.synthesized
            : {};
        const entries = collectNumericFieldValues(fieldMap, synthesizedKeys);
        const stats = computeDistributionStats(entries);
        const flattened = stats.count === 0
            || stats.spread < spreadThreshold
            || stats.uniqueRoundedCount < minUniqueRoundedCount;

        return addDistributionValidationCheck(report, {
            checkId,
            status: flattened ? 'fail' : 'pass',
            message: flattened
                ? `${packageLabel} synthesized contrast is too flat or monotone.`
                : `${packageLabel} synthesized contrast remains readable.`,
            details: [
                `spread=${stats.spread.toFixed(3)}`,
                `uniqueRoundedCount=${stats.uniqueRoundedCount}`,
                `leaders=${rankDistributionEntries(entries, 3).join(', ') || '<none>'}`
            ],
            affectedPaths: [`${packageKey}.synthesized`],
            meta: {
                distributionValidation: true,
                packageKey,
                packageLabel,
                spreadThreshold,
                spread: Number(stats.spread.toFixed(6)),
                uniqueRoundedCount: stats.uniqueRoundedCount
            }
        });
    }

    function runDistributionReliefPresenceCheck(report, rhythmPackage) {
        const recoveryDomain = isPlainObject(rhythmPackage && rhythmPackage.domains && rhythmPackage.domains.recovery)
            ? rhythmPackage.domains.recovery
            : {};
        const synthesized = isPlainObject(rhythmPackage && rhythmPackage.synthesized)
            ? rhythmPackage.synthesized
            : {};
        const recoveryEntries = collectNumericFieldValues(recoveryDomain, [
            'recoveryTempo',
            'stabilizationInterval',
            'reliefPersistence',
            'environmentalForgiveness'
        ]);
        const reliefStats = computeDistributionStats(recoveryEntries);
        const recoveryProfileMean = getFieldMeanValue(synthesized.recoveryProfile);
        const reliefSignalPresent = (
            Number.isFinite(recoveryProfileMean) && recoveryProfileMean >= 0.18
        ) || reliefStats.max >= 0.22;

        return addDistributionValidationCheck(report, {
            checkId: 'phase2.distribution.relief_presence',
            status: reliefSignalPresent ? 'pass' : 'fail',
            message: reliefSignalPresent
                ? 'Rhythm layer preserves explicit relief presence.'
                : 'Rhythm layer lacks meaningful relief presence.',
            details: [
                `recoveryProfileMean=${Number.isFinite(recoveryProfileMean) ? recoveryProfileMean.toFixed(3) : '<missing>'}`,
                `recoveryFieldMax=${reliefStats.max.toFixed(3)}`,
                `recoveryFieldSpread=${reliefStats.spread.toFixed(3)}`
            ],
            affectedPaths: [
                'environmentalRhythmPackage.synthesized.recoveryProfile',
                'environmentalRhythmPackage.domains.recovery'
            ],
            meta: {
                distributionValidation: true,
                recoveryProfileMean: Number.isFinite(recoveryProfileMean)
                    ? Number(recoveryProfileMean.toFixed(6))
                    : null,
                recoveryFieldMax: Number(reliefStats.max.toFixed(6))
            }
        });
    }

    function runDistributionDifferentiationCheck(report, pressurePackage, rhythmPackage) {
        const pressureEntries = collectNumericFieldValues(
            isPlainObject(pressurePackage && pressurePackage.synthesized) ? pressurePackage.synthesized : {}
        );
        const rhythmEntries = collectNumericFieldValues(
            isPlainObject(rhythmPackage && rhythmPackage.synthesized) ? rhythmPackage.synthesized : {}
        );
        const pressureValues = pressureEntries.map((entry) => entry.value).sort((left, right) => right - left);
        const rhythmValues = rhythmEntries.map((entry) => entry.value).sort((left, right) => right - left);
        const pairCount = Math.min(pressureValues.length, rhythmValues.length);
        const meanAbsDifference = pairCount
            ? pressureValues
                .slice(0, pairCount)
                .reduce((sum, value, index) => sum + Math.abs(value - rhythmValues[index]), 0) / pairCount
            : 0;
        const pressureStats = computeDistributionStats(pressureEntries);
        const rhythmStats = computeDistributionStats(rhythmEntries);
        const differentiated = (
            meanAbsDifference >= 0.05
            || Math.abs(pressureStats.spread - rhythmStats.spread) >= 0.04
            || Math.abs(pressureStats.mean - rhythmStats.mean) >= 0.05
        );

        return addDistributionValidationCheck(report, {
            checkId: 'phase2.distribution.pressure_rhythm_differentiation',
            status: differentiated ? 'pass' : 'fail',
            message: differentiated
                ? 'Pressure and rhythm layers remain distributionally differentiated.'
                : 'Pressure and rhythm layers are too distributionally similar and risk monotony.',
            details: [
                `meanAbsDifference=${meanAbsDifference.toFixed(3)}`,
                `pressureSpread=${pressureStats.spread.toFixed(3)}`,
                `rhythmSpread=${rhythmStats.spread.toFixed(3)}`
            ],
            affectedPaths: [
                'pressureFieldPackage.synthesized',
                'environmentalRhythmPackage.synthesized'
            ],
            meta: {
                distributionValidation: true,
                meanAbsDifference: Number(meanAbsDifference.toFixed(6)),
                pressureSpread: Number(pressureStats.spread.toFixed(6)),
                rhythmSpread: Number(rhythmStats.spread.toFixed(6))
            }
        });
    }

    function runDistributionValidationFamily(report, input = {}, context = {}) {
        const pressurePackage = getStructuralPackageCandidate(input, 'pressureFieldPackage');
        const rhythmPackage = getStructuralPackageCandidate(input, 'environmentalRhythmPackage');
        let nextReport = report;

        if (!isPlainObject(pressurePackage) || !isPlainObject(rhythmPackage)) {
            nextReport = addDistributionValidationCheck(nextReport, {
                checkId: 'phase2.distribution.package_presence',
                status: 'warning',
                message: 'Distribution validation could not fully run because one or both package candidates are missing.',
                details: [
                    `pressureFieldPackagePresent=${String(isPlainObject(pressurePackage))}`,
                    `environmentalRhythmPackagePresent=${String(isPlainObject(rhythmPackage))}`
                ],
                affectedPaths: ['pressureFieldPackage', 'environmentalRhythmPackage'],
                meta: {
                    distributionValidation: true
                }
            });
        }

        if (isPlainObject(pressurePackage)) {
            nextReport = runDistributionContrastCheck(nextReport, pressurePackage, {
                packageLabel: 'PressureFieldPackage',
                packageKey: 'pressureFieldPackage',
                synthesizedKeys: [
                    'survivabilityPressure',
                    'mobilityPressure',
                    'supplyPressure',
                    'chokepointStress',
                    'remotenessBurden',
                    'ecologicalBurden',
                    'catastropheSusceptibility'
                ],
                checkId: 'phase2.distribution.pressure_contrast',
                spreadThreshold: 0.12,
                minUniqueRoundedCount: 3
            });
        }

        if (isPlainObject(rhythmPackage)) {
            nextReport = runDistributionContrastCheck(nextReport, rhythmPackage, {
                packageLabel: 'EnvironmentalRhythmPackage',
                packageKey: 'environmentalRhythmPackage',
                synthesizedKeys: [
                    'seasonalityProfile',
                    'stormRhythm',
                    'navigationRhythm',
                    'scarcityRhythm',
                    'predictabilityProfile',
                    'ruptureProfile'
                ],
                checkId: 'phase2.distribution.rhythm_contrast',
                spreadThreshold: 0.1,
                minUniqueRoundedCount: 3
            });
            nextReport = runDistributionReliefPresenceCheck(nextReport, rhythmPackage);
        }

        if (isPlainObject(pressurePackage) && isPlainObject(rhythmPackage)) {
            nextReport = runDistributionDifferentiationCheck(nextReport, pressurePackage, rhythmPackage);
        }

        const familySection = getValidationFamilySection(nextReport, 'distribution').section;
        return {
            report: nextReport,
            stageResult: deepFreeze({
                familyId: 'distribution',
                stageId: 'phase2.validation.distribution',
                status: resolveValidationStatus(familySection.status, 'not_run'),
                usedCustomRunner: true,
                context: {
                    recordBindingContextId: normalizeString(context.recordBindingContextId),
                    sourcePressureFieldPackageId: normalizeString(context.sourcePressureFieldPackageId),
                    sourceEnvironmentalRhythmPackageId: normalizeString(context.sourceEnvironmentalRhythmPackageId)
                }
            })
        };
    }

    function addDesignValidationCheck(report, check) {
        return addPhase2ValidationCheck(report, 'design', check);
    }

    function getPackageSynthesizedEntries(packageCandidate, preferredKeys = []) {
        const synthesized = isPlainObject(packageCandidate && packageCandidate.synthesized)
            ? packageCandidate.synthesized
            : {};
        return collectNumericFieldValues(synthesized, preferredKeys);
    }

    function getPackageRegionalProfiles(packageCandidate) {
        return Array.isArray(packageCandidate && packageCandidate.regionalProfiles)
            ? packageCandidate.regionalProfiles
            : [];
    }

    function getProfileSignalCount(profile, signalKey) {
        const signals = isPlainObject(profile && profile[signalKey]) ? profile[signalKey] : {};
        return Object.keys(signals).length;
    }

    function getProfileTraitCount(profile) {
        return Array.isArray(profile && profile.dominantEnvironmentalTraits)
            ? profile.dominantEnvironmentalTraits.length
            : 0;
    }

    function readFieldDiagnostic(fieldCandidate, diagnosticKey) {
        const diagnostics = isPlainObject(fieldCandidate && fieldCandidate.diagnostics)
            ? fieldCandidate.diagnostics
            : {};
        const summary = isPlainObject(fieldCandidate && fieldCandidate.summary)
            ? fieldCandidate.summary
            : {};
        const candidateValue = Object.prototype.hasOwnProperty.call(diagnostics, diagnosticKey)
            ? diagnostics[diagnosticKey]
            : summary[diagnosticKey];
        const numericValue = Number(candidateValue);
        return Number.isFinite(numericValue) ? numericValue : null;
    }

    function runDesignTensionReliefCheck(report, pressurePackage, rhythmPackage) {
        const pressureStats = computeDistributionStats(getPackageSynthesizedEntries(pressurePackage));
        const recoveryProfileMean = getFieldMeanValue(
            isPlainObject(rhythmPackage && rhythmPackage.synthesized)
                ? rhythmPackage.synthesized.recoveryProfile
                : null
        );
        const recoveryDomainStats = computeDistributionStats(collectNumericFieldValues(
            isPlainObject(rhythmPackage && rhythmPackage.domains && rhythmPackage.domains.recovery)
                ? rhythmPackage.domains.recovery
                : {},
            ['recoveryTempo', 'stabilizationInterval', 'reliefPersistence', 'environmentalForgiveness']
        ));
        const resolvedRecoveryMean = Number.isFinite(recoveryProfileMean)
            ? recoveryProfileMean
            : recoveryDomainStats.mean;
        const tensionReliefDelta = pressureStats.mean - resolvedRecoveryMean;
        const overlyPunishing = pressureStats.mean >= 0.55 && resolvedRecoveryMean < 0.18;
        const overlySoft = resolvedRecoveryMean > pressureStats.mean + 0.08;
        const status = (overlyPunishing || overlySoft) ? 'rebalance_required' : 'pass';

        return addDesignValidationCheck(report, {
            checkId: 'phase2.design.tension_vs_relief',
            status,
            message: status === 'pass'
                ? 'Pressure tension and recovery relief remain in a usable design balance.'
                : 'Pressure tension and recovery relief have drifted out of useful design balance.',
            details: [
                `pressureMean=${pressureStats.mean.toFixed(3)}`,
                `recoveryMean=${resolvedRecoveryMean.toFixed(3)}`,
                `tensionReliefDelta=${tensionReliefDelta.toFixed(3)}`
            ],
            affectedPaths: [
                'pressureFieldPackage.synthesized',
                'environmentalRhythmPackage.synthesized.recoveryProfile',
                'environmentalRhythmPackage.domains.recovery'
            ],
            meta: {
                designValidation: true,
                tensionReliefDelta: Number(tensionReliefDelta.toFixed(6)),
                pressureMean: Number(pressureStats.mean.toFixed(6)),
                recoveryMean: Number(resolvedRecoveryMean.toFixed(6))
            }
        });
    }

    function runDesignPlanningDifferentiationCheck(report, pressurePackage, rhythmPackage) {
        const pressureEntries = getPackageSynthesizedEntries(pressurePackage);
        const rhythmEntries = getPackageSynthesizedEntries(rhythmPackage, [
            'seasonalityProfile',
            'stormRhythm',
            'navigationRhythm',
            'scarcityRhythm',
            'predictabilityProfile',
            'ruptureProfile'
        ]);
        const pressureStats = computeDistributionStats(pressureEntries);
        const rhythmStats = computeDistributionStats(rhythmEntries);
        const differentiated = pressureStats.spread >= 0.14 && rhythmStats.spread >= 0.08;
        const status = differentiated ? 'pass' : 'rebalance_required';

        return addDesignValidationCheck(report, {
            checkId: 'phase2.design.planning_differentiation',
            status,
            message: status === 'pass'
                ? 'Pressure and rhythm layers expose planning-style differentiation.'
                : 'Pressure and rhythm layers are not yet differentiated enough for planning-style read decisions.',
            details: [
                `pressureSpread=${pressureStats.spread.toFixed(3)}`,
                `rhythmSpread=${rhythmStats.spread.toFixed(3)}`,
                `pressureLeaders=${rankDistributionEntries(pressureEntries, 3).join(', ') || '<none>'}`,
                `rhythmLeaders=${rankDistributionEntries(rhythmEntries, 3).join(', ') || '<none>'}`
            ],
            affectedPaths: [
                'pressureFieldPackage.synthesized',
                'environmentalRhythmPackage.synthesized'
            ],
            meta: {
                designValidation: true,
                pressureSpread: Number(pressureStats.spread.toFixed(6)),
                rhythmSpread: Number(rhythmStats.spread.toFixed(6))
            }
        });
    }

    function runDesignProgressionUsefulnessCheck(report, pressurePackage, rhythmPackage) {
        const pressureProfiles = getPackageRegionalProfiles(pressurePackage);
        const rhythmProfiles = getPackageRegionalProfiles(rhythmPackage);
        const pressureSignalDensity = pressureProfiles.length
            ? mean(pressureProfiles.map((profile) => getProfileSignalCount(profile, 'pressureSignals')))
            : 0;
        const rhythmSignalDensity = rhythmProfiles.length
            ? mean(rhythmProfiles.map((profile) => getProfileSignalCount(profile, 'rhythmSignals')))
            : 0;
        const traitDensity = mean(
            pressureProfiles.concat(rhythmProfiles).map((profile) => getProfileTraitCount(profile))
        );
        const useful = pressureSignalDensity >= 2 && rhythmSignalDensity >= 2 && traitDensity >= 2;
        const status = useful ? 'pass' : 'rebalance_required';

        return addDesignValidationCheck(report, {
            checkId: 'phase2.design.progression_usefulness',
            status,
            message: status === 'pass'
                ? 'Record-bound profiles expose enough distinct signals for progression and planning use.'
                : 'Record-bound profiles are too sparse to carry useful progression/planning differentiation yet.',
            details: [
                `pressureSignalDensity=${pressureSignalDensity.toFixed(3)}`,
                `rhythmSignalDensity=${rhythmSignalDensity.toFixed(3)}`,
                `traitDensity=${traitDensity.toFixed(3)}`
            ],
            affectedPaths: [
                'pressureFieldPackage.regionalProfiles',
                'environmentalRhythmPackage.regionalProfiles'
            ],
            meta: {
                designValidation: true,
                pressureSignalDensity: Number(pressureSignalDensity.toFixed(6)),
                rhythmSignalDensity: Number(rhythmSignalDensity.toFixed(6)),
                traitDensity: Number(traitDensity.toFixed(6))
            }
        });
    }

    function runDesignProfileReadabilityCheck(report, pressurePackage, rhythmPackage) {
        const pressureReadabilityEntries = getPackageSynthesizedEntries(pressurePackage).map((entry) => {
            const field = pressurePackage.synthesized[entry.fieldId];
            return {
                fieldId: entry.fieldId,
                value: readFieldDiagnostic(field, 'axisSpreadSignal') ?? readFieldDiagnostic(field, 'componentSpread') ?? 0
            };
        });
        const rhythmReadabilityEntries = getPackageSynthesizedEntries(rhythmPackage).map((entry) => {
            const field = rhythmPackage.synthesized[entry.fieldId];
            return {
                fieldId: entry.fieldId,
                value: readFieldDiagnostic(field, 'componentSpreadSignal') ?? readFieldDiagnostic(field, 'componentSpread') ?? 0
            };
        });
        const pressureReadability = computeDistributionStats(pressureReadabilityEntries);
        const rhythmReadability = computeDistributionStats(rhythmReadabilityEntries);
        const readable = pressureReadability.max >= 0.08 && rhythmReadability.max >= 0.08;
        const status = readable ? 'pass' : 'rebalance_required';

        return addDesignValidationCheck(report, {
            checkId: 'phase2.design.profile_readability',
            status,
            message: status === 'pass'
                ? 'Synthesized profiles carry explicit readability signals.'
                : 'Synthesized profiles lack enough readability signal for clean downstream interpretation.',
            details: [
                `pressureReadabilityMax=${pressureReadability.max.toFixed(3)}`,
                `rhythmReadabilityMax=${rhythmReadability.max.toFixed(3)}`,
                `pressureReadabilityLeaders=${rankDistributionEntries(pressureReadabilityEntries, 3).join(', ') || '<none>'}`,
                `rhythmReadabilityLeaders=${rankDistributionEntries(rhythmReadabilityEntries, 3).join(', ') || '<none>'}`
            ],
            affectedPaths: [
                'pressureFieldPackage.synthesized',
                'environmentalRhythmPackage.synthesized'
            ],
            meta: {
                designValidation: true,
                pressureReadabilityMax: Number(pressureReadability.max.toFixed(6)),
                rhythmReadabilityMax: Number(rhythmReadability.max.toFixed(6))
            }
        });
    }

    function runDesignValidationFamily(report, input = {}, context = {}) {
        const pressurePackage = getStructuralPackageCandidate(input, 'pressureFieldPackage');
        const rhythmPackage = getStructuralPackageCandidate(input, 'environmentalRhythmPackage');
        let nextReport = report;

        if (!isPlainObject(pressurePackage) || !isPlainObject(rhythmPackage)) {
            nextReport = addDesignValidationCheck(nextReport, {
                checkId: 'phase2.design.package_presence',
                status: 'warning',
                message: 'Design validation could not fully run because one or both package candidates are missing.',
                details: [
                    `pressureFieldPackagePresent=${String(isPlainObject(pressurePackage))}`,
                    `environmentalRhythmPackagePresent=${String(isPlainObject(rhythmPackage))}`
                ],
                affectedPaths: ['pressureFieldPackage', 'environmentalRhythmPackage'],
                meta: {
                    designValidation: true
                }
            });
        }

        if (isPlainObject(pressurePackage) && isPlainObject(rhythmPackage)) {
            nextReport = runDesignTensionReliefCheck(nextReport, pressurePackage, rhythmPackage);
            nextReport = runDesignPlanningDifferentiationCheck(nextReport, pressurePackage, rhythmPackage);
            nextReport = runDesignProgressionUsefulnessCheck(nextReport, pressurePackage, rhythmPackage);
            nextReport = runDesignProfileReadabilityCheck(nextReport, pressurePackage, rhythmPackage);
        }

        const familySection = getValidationFamilySection(nextReport, 'design').section;
        return {
            report: nextReport,
            stageResult: deepFreeze({
                familyId: 'design',
                stageId: 'phase2.validation.design',
                status: resolveValidationStatus(familySection.status, 'not_run'),
                usedCustomRunner: true,
                context: {
                    recordBindingContextId: normalizeString(context.recordBindingContextId),
                    sourcePressureFieldPackageId: normalizeString(context.sourcePressureFieldPackageId),
                    sourceEnvironmentalRhythmPackageId: normalizeString(context.sourceEnvironmentalRhythmPackageId)
                }
            })
        };
    }

    function addGameplayValidationCheck(report, check) {
        return addPhase2ValidationCheck(report, 'gameplay', check);
    }

    function getPackageSummaries(packageCandidate) {
        return isPlainObject(packageCandidate && packageCandidate.summaries)
            ? packageCandidate.summaries
            : {};
    }

    function hasNonEmptyString(value) {
        return typeof value === 'string' && value.trim().length > 0;
    }

    function runGameplayTraversalRelevanceCheck(report, pressurePackage, rhythmPackage) {
        const pressureSynthesized = isPlainObject(pressurePackage && pressurePackage.synthesized)
            ? pressurePackage.synthesized
            : {};
        const rhythmSynthesized = isPlainObject(rhythmPackage && rhythmPackage.synthesized)
            ? rhythmPackage.synthesized
            : {};
        const traversalSignals = {
            mobilityPressure: getFieldMeanValue(pressureSynthesized.mobilityPressure),
            chokepointStress: getFieldMeanValue(pressureSynthesized.chokepointStress),
            remotenessBurden: getFieldMeanValue(pressureSynthesized.remotenessBurden),
            navigationRhythm: getFieldMeanValue(rhythmSynthesized.navigationRhythm)
        };
        const presentCount = Object.values(traversalSignals).filter((value) => Number.isFinite(value) && value > 0).length;
        const summaries = getPackageSummaries(pressurePackage);
        const status = presentCount >= 3 && hasNonEmptyString(summaries.traversalSummary)
            ? 'pass'
            : 'rebalance_required';

        return addGameplayValidationCheck(report, {
            checkId: 'phase2.gameplay.traversal_relevance',
            status,
            message: status === 'pass'
                ? 'Phase 2 outputs are sufficient to project traversal gameplay relevance.'
                : 'Traversal gameplay projection is under-specified or weakly grounded.',
            details: [
                `signalCount=${presentCount}`,
                `mobilityPressure=${Number.isFinite(traversalSignals.mobilityPressure) ? traversalSignals.mobilityPressure.toFixed(3) : '<missing>'}`,
                `navigationRhythm=${Number.isFinite(traversalSignals.navigationRhythm) ? traversalSignals.navigationRhythm.toFixed(3) : '<missing>'}`
            ],
            affectedPaths: [
                'pressureFieldPackage.synthesized.mobilityPressure',
                'pressureFieldPackage.synthesized.chokepointStress',
                'pressureFieldPackage.synthesized.remotenessBurden',
                'environmentalRhythmPackage.synthesized.navigationRhythm',
                'pressureFieldPackage.summaries.traversalSummary'
            ],
            meta: {
                gameplayValidation: true,
                traversalSignalCount: presentCount
            }
        });
    }

    function runGameplaySurvivalRelevanceCheck(report, pressurePackage, rhythmPackage) {
        const pressureSynthesized = isPlainObject(pressurePackage && pressurePackage.synthesized)
            ? pressurePackage.synthesized
            : {};
        const recoveryDomain = isPlainObject(rhythmPackage && rhythmPackage.domains && rhythmPackage.domains.recovery)
            ? rhythmPackage.domains.recovery
            : {};
        const survivalSignals = {
            survivabilityPressure: getFieldMeanValue(pressureSynthesized.survivabilityPressure),
            supplyPressure: getFieldMeanValue(pressureSynthesized.supplyPressure),
            recoveryTempo: getFieldMeanValue(recoveryDomain.recoveryTempo),
            reliefPersistence: getFieldMeanValue(recoveryDomain.reliefPersistence)
        };
        const presentCount = Object.values(survivalSignals).filter((value) => Number.isFinite(value) && value > 0).length;
        const summaries = getPackageSummaries(pressurePackage);
        const status = presentCount >= 3 && hasNonEmptyString(summaries.survivalSummary)
            ? 'pass'
            : 'rebalance_required';

        return addGameplayValidationCheck(report, {
            checkId: 'phase2.gameplay.survival_relevance',
            status,
            message: status === 'pass'
                ? 'Phase 2 outputs are sufficient to project survival gameplay relevance.'
                : 'Survival gameplay projection is under-specified or weakly grounded.',
            details: [
                `signalCount=${presentCount}`,
                `survivabilityPressure=${Number.isFinite(survivalSignals.survivabilityPressure) ? survivalSignals.survivabilityPressure.toFixed(3) : '<missing>'}`,
                `recoveryTempo=${Number.isFinite(survivalSignals.recoveryTempo) ? survivalSignals.recoveryTempo.toFixed(3) : '<missing>'}`
            ],
            affectedPaths: [
                'pressureFieldPackage.synthesized.survivabilityPressure',
                'pressureFieldPackage.synthesized.supplyPressure',
                'environmentalRhythmPackage.domains.recovery.recoveryTempo',
                'environmentalRhythmPackage.domains.recovery.reliefPersistence',
                'pressureFieldPackage.summaries.survivalSummary'
            ],
            meta: {
                gameplayValidation: true,
                survivalSignalCount: presentCount
            }
        });
    }

    function runGameplayHazardRelevanceCheck(report, pressurePackage, rhythmPackage) {
        const pressureSynthesized = isPlainObject(pressurePackage && pressurePackage.synthesized)
            ? pressurePackage.synthesized
            : {};
        const rhythmSynthesized = isPlainObject(rhythmPackage && rhythmPackage.synthesized)
            ? rhythmPackage.synthesized
            : {};
        const hazardSignals = {
            catastropheSusceptibility: getFieldMeanValue(pressureSynthesized.catastropheSusceptibility),
            ruptureProfile: getFieldMeanValue(rhythmSynthesized.ruptureProfile),
            stormRhythm: getFieldMeanValue(rhythmSynthesized.stormRhythm)
        };
        const presentCount = Object.values(hazardSignals).filter((value) => Number.isFinite(value) && value > 0).length;
        const status = presentCount >= 3 ? 'pass' : 'rebalance_required';

        return addGameplayValidationCheck(report, {
            checkId: 'phase2.gameplay.hazard_relevance',
            status,
            message: status === 'pass'
                ? 'Phase 2 outputs are sufficient to project hazard gameplay relevance.'
                : 'Hazard gameplay projection is under-specified or weakly grounded.',
            details: [
                `signalCount=${presentCount}`,
                `catastropheSusceptibility=${Number.isFinite(hazardSignals.catastropheSusceptibility) ? hazardSignals.catastropheSusceptibility.toFixed(3) : '<missing>'}`,
                `ruptureProfile=${Number.isFinite(hazardSignals.ruptureProfile) ? hazardSignals.ruptureProfile.toFixed(3) : '<missing>'}`
            ],
            affectedPaths: [
                'pressureFieldPackage.synthesized.catastropheSusceptibility',
                'environmentalRhythmPackage.synthesized.ruptureProfile',
                'environmentalRhythmPackage.synthesized.stormRhythm'
            ],
            meta: {
                gameplayValidation: true,
                hazardSignalCount: presentCount
            }
        });
    }

    function runGameplayReliefRelevanceCheck(report, rhythmPackage) {
        const rhythmSynthesized = isPlainObject(rhythmPackage && rhythmPackage.synthesized)
            ? rhythmPackage.synthesized
            : {};
        const recoveryDomain = isPlainObject(rhythmPackage && rhythmPackage.domains && rhythmPackage.domains.recovery)
            ? rhythmPackage.domains.recovery
            : {};
        const reliefSignals = {
            recoveryProfile: getFieldMeanValue(rhythmSynthesized.recoveryProfile),
            navigationRhythm: getFieldMeanValue(rhythmSynthesized.navigationRhythm),
            recoveryTempo: getFieldMeanValue(recoveryDomain.recoveryTempo),
            reliefPersistence: getFieldMeanValue(recoveryDomain.reliefPersistence),
            environmentalForgiveness: getFieldMeanValue(recoveryDomain.environmentalForgiveness)
        };
        const presentCount = Object.values(reliefSignals).filter((value) => Number.isFinite(value) && value >= 0.18).length;
        const summaries = getPackageSummaries(rhythmPackage);
        const status = presentCount >= 3
            && hasNonEmptyString(summaries.recoverySummary)
            && hasNonEmptyString(summaries.windowSummary)
            ? 'pass'
            : 'fail';

        return addGameplayValidationCheck(report, {
            checkId: 'phase2.gameplay.relief_relevance',
            status,
            message: status === 'pass'
                ? 'Phase 2 outputs are sufficient to project explicit relief gameplay relevance.'
                : 'Relief gameplay projection is incomplete or too weak.',
            details: [
                `signalCount=${presentCount}`,
                `recoveryProfile=${Number.isFinite(reliefSignals.recoveryProfile) ? reliefSignals.recoveryProfile.toFixed(3) : '<missing>'}`,
                `reliefPersistence=${Number.isFinite(reliefSignals.reliefPersistence) ? reliefSignals.reliefPersistence.toFixed(3) : '<missing>'}`
            ],
            affectedPaths: [
                'environmentalRhythmPackage.synthesized.recoveryProfile',
                'environmentalRhythmPackage.synthesized.navigationRhythm',
                'environmentalRhythmPackage.domains.recovery',
                'environmentalRhythmPackage.summaries.recoverySummary',
                'environmentalRhythmPackage.summaries.windowSummary'
            ],
            meta: {
                gameplayValidation: true,
                reliefSignalCount: presentCount
            }
        });
    }

    function runGameplayRuntimeAdapterSufficiencyCheck(report, pressurePackage, rhythmPackage) {
        const pressureProfiles = getPackageRegionalProfiles(pressurePackage);
        const rhythmProfiles = getPackageRegionalProfiles(rhythmPackage);
        const pressureSummaryCount = Object.values(getPackageSummaries(pressurePackage)).filter(hasNonEmptyString).length;
        const rhythmSummaryCount = Object.values(getPackageSummaries(rhythmPackage)).filter(hasNonEmptyString).length;
        const pressureProfileSignalDensity = pressureProfiles.length
            ? mean(pressureProfiles.map((profile) => getProfileSignalCount(profile, 'pressureSignals')))
            : 0;
        const rhythmProfileSignalDensity = rhythmProfiles.length
            ? mean(rhythmProfiles.map((profile) => getProfileSignalCount(profile, 'rhythmSignals')))
            : 0;
        const sufficient = (
            pressureSummaryCount >= 3
            && rhythmSummaryCount >= 3
            && pressureProfiles.length > 0
            && rhythmProfiles.length > 0
            && pressureProfileSignalDensity >= 2
            && rhythmProfileSignalDensity >= 2
        );
        const status = sufficient ? 'pass' : 'rebalance_required';

        return addGameplayValidationCheck(report, {
            checkId: 'phase2.gameplay.runtime_adapter_sufficiency',
            status,
            message: status === 'pass'
                ? 'Phase 2 outputs are sufficient for a later runtime adapter to map gameplay meaning without inventing new environmental truth.'
                : 'Phase 2 outputs are not yet sufficient for a later runtime adapter to map gameplay meaning cleanly.',
            details: [
                `pressureSummaryCount=${pressureSummaryCount}`,
                `rhythmSummaryCount=${rhythmSummaryCount}`,
                `pressureProfileSignalDensity=${pressureProfileSignalDensity.toFixed(3)}`,
                `rhythmProfileSignalDensity=${rhythmProfileSignalDensity.toFixed(3)}`
            ],
            affectedPaths: [
                'pressureFieldPackage.summaries',
                'environmentalRhythmPackage.summaries',
                'pressureFieldPackage.regionalProfiles',
                'environmentalRhythmPackage.regionalProfiles'
            ],
            meta: {
                gameplayValidation: true,
                pressureSummaryCount,
                rhythmSummaryCount,
                pressureProfileSignalDensity: Number(pressureProfileSignalDensity.toFixed(6)),
                rhythmProfileSignalDensity: Number(rhythmProfileSignalDensity.toFixed(6))
            }
        });
    }

    function runGameplayValidationFamily(report, input = {}, context = {}) {
        const pressurePackage = getStructuralPackageCandidate(input, 'pressureFieldPackage');
        const rhythmPackage = getStructuralPackageCandidate(input, 'environmentalRhythmPackage');
        let nextReport = report;

        if (!isPlainObject(pressurePackage) || !isPlainObject(rhythmPackage)) {
            nextReport = addGameplayValidationCheck(nextReport, {
                checkId: 'phase2.gameplay.package_presence',
                status: 'warning',
                message: 'Gameplay validation could not fully run because one or both package candidates are missing.',
                details: [
                    `pressureFieldPackagePresent=${String(isPlainObject(pressurePackage))}`,
                    `environmentalRhythmPackagePresent=${String(isPlainObject(rhythmPackage))}`
                ],
                affectedPaths: ['pressureFieldPackage', 'environmentalRhythmPackage'],
                meta: {
                    gameplayValidation: true
                }
            });
        }

        if (isPlainObject(pressurePackage) && isPlainObject(rhythmPackage)) {
            nextReport = runGameplayTraversalRelevanceCheck(nextReport, pressurePackage, rhythmPackage);
            nextReport = runGameplaySurvivalRelevanceCheck(nextReport, pressurePackage, rhythmPackage);
            nextReport = runGameplayHazardRelevanceCheck(nextReport, pressurePackage, rhythmPackage);
            nextReport = runGameplayReliefRelevanceCheck(nextReport, rhythmPackage);
            nextReport = runGameplayRuntimeAdapterSufficiencyCheck(nextReport, pressurePackage, rhythmPackage);
        }

        const familySection = getValidationFamilySection(nextReport, 'gameplay').section;
        return {
            report: nextReport,
            stageResult: deepFreeze({
                familyId: 'gameplay',
                stageId: 'phase2.validation.gameplay',
                status: resolveValidationStatus(familySection.status, 'not_run'),
                usedCustomRunner: true,
                context: {
                    recordBindingContextId: normalizeString(context.recordBindingContextId),
                    sourcePressureFieldPackageId: normalizeString(context.sourcePressureFieldPackageId),
                    sourceEnvironmentalRhythmPackageId: normalizeString(context.sourceEnvironmentalRhythmPackageId)
                }
            })
        };
    }

    function addSummaryValidationCheck(report, check) {
        return addPhase2ValidationCheck(report, 'summary', check);
    }

    function getPackageSummariesObject(packageCandidate) {
        return isPlainObject(packageCandidate && packageCandidate.summaries)
            ? packageCandidate.summaries
            : {};
    }

    function getPackageRegionalProfiles(packageCandidate) {
        return Array.isArray(packageCandidate && packageCandidate.regionalProfiles)
            ? packageCandidate.regionalProfiles
            : [];
    }

    function tokenizeSummaryText(summaryText) {
        return uniqueStrings(
            normalizeString(summaryText)
                .toLowerCase()
                .split(/[^a-z0-9_]+/g)
        );
    }

    function getSummarySignalCoverage(profile) {
        const pressureSignals = isPlainObject(profile && profile.pressureSignals)
            ? Object.keys(profile.pressureSignals)
            : [];
        const rhythmSignals = isPlainObject(profile && profile.rhythmSignals)
            ? Object.keys(profile.rhythmSignals)
            : [];
        return uniqueStrings(pressureSignals.concat(rhythmSignals));
    }

    function getPressureSummaryFieldIds(packageCandidate) {
        const metadata = isPlainObject(packageCandidate && packageCandidate.summaryMetadata)
            ? packageCandidate.summaryMetadata
            : {};
        const summaryMetadata = isPlainObject(metadata.pressure)
            ? metadata.pressure
            : {};
        const directMetadata = isPlainObject(packageCandidate && packageCandidate.metadata)
            ? packageCandidate.metadata
            : {};
        const summariesMetadata = isPlainObject(directMetadata.summaries)
            ? directMetadata.summaries
            : {};
        return uniqueStrings(
            []
                .concat(summaryMetadata.synthesizedFieldIds || [])
                .concat(summaryMetadata.supportingDomainFieldIds || [])
                .concat(summariesMetadata.synthesizedFieldIds || [])
                .concat(summariesMetadata.supportingDomainFieldIds || [])
        );
    }

    function getRhythmSummaryFieldIds(packageCandidate) {
        const metadata = isPlainObject(packageCandidate && packageCandidate.summaryMetadata)
            ? packageCandidate.summaryMetadata
            : {};
        const summaryMetadata = isPlainObject(metadata.rhythm)
            ? metadata.rhythm
            : {};
        const directMetadata = isPlainObject(packageCandidate && packageCandidate.metadata)
            ? packageCandidate.metadata
            : {};
        const summariesMetadata = isPlainObject(directMetadata.summaries)
            ? directMetadata.summaries
            : {};
        return uniqueStrings(
            []
                .concat(summaryMetadata.synthesizedFieldIds || [])
                .concat(summaryMetadata.supportingDomainFieldIds || [])
                .concat(summariesMetadata.synthesizedFieldIds || [])
                .concat(summariesMetadata.supportingDomainFieldIds || [])
        );
    }

    function runPressureSummaryValidationCheck(report, pressurePackage) {
        const summaries = getPackageSummariesObject(pressurePackage);
        const requiredKeys = uniqueStrings([
            'pressureSummary',
            'traversalSummary',
            'survivalSummary',
            'fragilitySummary'
        ]);
        const missingKeys = requiredKeys.filter((key) => !hasNonEmptyString(summaries[key]));
        const summaryTexts = requiredKeys.map((key) => normalizeString(summaries[key]));
        const combinedTokens = uniqueStrings(summaryTexts.flatMap((summaryText) => tokenizeSummaryText(summaryText)));
        const fieldIds = getPressureSummaryFieldIds(pressurePackage);
        const fieldBacked = fieldIds.some((fieldId) => combinedTokens.includes(normalizeString(fieldId).toLowerCase()));
        const rhythmLeakageTerms = [
            'seasonalityprofile',
            'stormrhythm',
            'navigationrhythm',
            'scarcityrhythm',
            'predictabilityprofile',
            'ruptureprofile',
            'recoveryprofile',
            'recoverytempo',
            'reliefpersistence'
        ];
        const leakedTerms = rhythmLeakageTerms.filter((term) => combinedTokens.includes(term));
        const metadata = isPlainObject(pressurePackage && pressurePackage.summaryMetadata)
            ? pressurePackage.summaryMetadata.pressure
            : null;
        const pressureOnlySemantics = metadata
            ? metadata.pressureSemanticsOnly !== false && metadata.rhythmMeaningIncluded !== true
            : leakedTerms.length === 0;
        const uniqueSummaryTexts = uniqueStrings(summaryTexts);
        const useful = uniqueSummaryTexts.length >= 3 && summaryTexts.every((summaryText) => summaryText.length >= 32);
        const status = (missingKeys.length || leakedTerms.length || !fieldBacked)
            ? 'fail'
            : (useful && pressureOnlySemantics ? 'pass' : 'rebalance_required');
        let nextReport = addSummaryValidationCheck(report, {
            checkId: 'phase2.summary.pressure_summary_correctness',
            status,
            message: status === 'pass'
                ? 'Pressure summaries are present, field-backed, and remain burden-only.'
                : 'Pressure summaries are missing required coverage, leak rhythm meaning, or need stronger field-backed usefulness.',
            details: [
                `missingKeys=${missingKeys.join(',') || 'none'}`,
                `fieldBacked=${String(fieldBacked)}`,
                `pressureOnlySemantics=${String(pressureOnlySemantics)}`,
                `distinctSummaryCount=${String(uniqueSummaryTexts.length)}`,
                `rhythmLeakageTerms=${leakedTerms.join(',') || 'none'}`
            ],
            affectedPaths: [
                'pressureFieldPackage.summaries',
                'pressureFieldPackage.summaryMetadata'
            ],
            meta: {
                summaryValidation: true,
                packageSide: 'pressure',
                fieldIds,
                uniqueSummaryCount: uniqueSummaryTexts.length
            }
        });

        if (status === 'rebalance_required') {
            nextReport = addPhase2ValidationRecommendation(nextReport, {
                recommendationId: 'phase2.summary.pressure_summary_usefulness_rebalance',
                familyId: 'summary',
                recommendationType: 'selective_rebalance',
                priority: 'medium',
                message: 'Pressure summaries should stay burden-only while becoming more distinct and more directly field-backed.',
                targetIds: ['pressure_summaries', 'summary_logic', 'gameplay_projection_compatibility'],
                meta: {
                    triggerId: 'gameplay_irrelevance',
                    smallestValidLoop: 'summary_logic'
                }
            });
        }

        return nextReport;
    }

    function runRhythmSummaryValidationCheck(report, rhythmPackage) {
        const summaries = getPackageSummariesObject(rhythmPackage);
        const requiredKeys = uniqueStrings([
            'rhythmSummary',
            'timingSummary',
            'recoverySummary',
            'windowSummary'
        ]);
        const missingKeys = requiredKeys.filter((key) => !hasNonEmptyString(summaries[key]));
        const summaryTexts = requiredKeys.map((key) => normalizeString(summaries[key]));
        const combinedTokens = uniqueStrings(summaryTexts.flatMap((summaryText) => tokenizeSummaryText(summaryText)));
        const fieldIds = getRhythmSummaryFieldIds(rhythmPackage);
        const fieldBacked = fieldIds.some((fieldId) => combinedTokens.includes(normalizeString(fieldId).toLowerCase()));
        const pressureLeakageTerms = [
            'survivabilitypressure',
            'mobilitypressure',
            'supplypressure',
            'chokepointstress',
            'remotenessburden',
            'ecologicalburden',
            'catastrophesusceptibility',
            'terrainharshness',
            'travelexposure'
        ];
        const leakedTerms = pressureLeakageTerms.filter((term) => combinedTokens.includes(term));
        const recoveryExplicit = combinedTokens.includes('recoveryprofile')
            || combinedTokens.includes('recovery')
            || combinedTokens.includes('relief');
        const uniqueSummaryTexts = uniqueStrings(summaryTexts);
        const useful = uniqueSummaryTexts.length >= 3 && summaryTexts.every((summaryText) => summaryText.length >= 32);
        const status = (missingKeys.length || leakedTerms.length || !fieldBacked || !recoveryExplicit)
            ? 'fail'
            : (useful ? 'pass' : 'rebalance_required');
        let nextReport = addSummaryValidationCheck(report, {
            checkId: 'phase2.summary.rhythm_summary_correctness',
            status,
            message: status === 'pass'
                ? 'Rhythm summaries preserve timing meaning and keep recovery explicit.'
                : 'Rhythm summaries are missing timing coverage, leak burden meaning, or under-express recovery/relief.',
            details: [
                `missingKeys=${missingKeys.join(',') || 'none'}`,
                `fieldBacked=${String(fieldBacked)}`,
                `recoveryExplicit=${String(recoveryExplicit)}`,
                `distinctSummaryCount=${String(uniqueSummaryTexts.length)}`,
                `pressureLeakageTerms=${leakedTerms.join(',') || 'none'}`
            ],
            affectedPaths: [
                'environmentalRhythmPackage.summaries',
                'environmentalRhythmPackage.summaryMetadata'
            ],
            meta: {
                summaryValidation: true,
                packageSide: 'rhythm',
                fieldIds,
                uniqueSummaryCount: uniqueSummaryTexts.length
            }
        });

        if (status === 'rebalance_required') {
            nextReport = addPhase2ValidationRecommendation(nextReport, {
                recommendationId: 'phase2.summary.rhythm_summary_usefulness_rebalance',
                familyId: 'summary',
                recommendationType: 'selective_rebalance',
                priority: 'medium',
                message: 'Rhythm summaries should stay timing-focused while making recovery and planning windows clearer.',
                targetIds: ['rhythm_summaries', 'summary_logic', 'gameplay_projection_compatibility'],
                meta: {
                    triggerId: 'gameplay_irrelevance',
                    smallestValidLoop: 'summary_logic'
                }
            });
        }

        return nextReport;
    }

    function runRecordBoundSummaryValidationCheck(report, pressurePackage, rhythmPackage) {
        const pressureProfiles = getPackageRegionalProfiles(pressurePackage);
        const rhythmProfiles = getPackageRegionalProfiles(rhythmPackage);
        const allProfiles = pressureProfiles.concat(rhythmProfiles);
        const invalidProfiles = allProfiles.filter((profile) => {
            const signalCoverage = getSummarySignalCoverage(profile);
            return !hasNonEmptyString(profile && profile.recordType)
                || !hasNonEmptyString(profile && profile.recordId)
                || !hasNonEmptyString(profile && profile.sourcePackageId)
                || !hasNonEmptyString(profile && profile.summary)
                || signalCoverage.length === 0;
        });
        const summaryBearingProfiles = allProfiles.filter((profile) => hasNonEmptyString(profile && profile.summary));
        const useful = summaryBearingProfiles.length >= 4;
        const status = invalidProfiles.length
            ? 'fail'
            : (useful ? 'pass' : 'rebalance_required');
        let nextReport = addSummaryValidationCheck(report, {
            checkId: 'phase2.summary.record_bound_summary_presence',
            status,
            message: status === 'pass'
                ? 'Record-bound summaries are present and carry signal-backed profile meaning.'
                : 'Record-bound summaries are missing required binding-backed summary support or remain too thin.',
            details: [
                `pressureProfileCount=${String(pressureProfiles.length)}`,
                `rhythmProfileCount=${String(rhythmProfiles.length)}`,
                `invalidProfileCount=${String(invalidProfiles.length)}`,
                `summaryBearingProfiles=${String(summaryBearingProfiles.length)}`
            ],
            affectedPaths: [
                'pressureFieldPackage.regionalProfiles',
                'environmentalRhythmPackage.regionalProfiles'
            ],
            meta: {
                summaryValidation: true,
                invalidProfiles: invalidProfiles.slice(0, 6).map((profile) => ({
                    profileId: normalizeString(profile && profile.profileId),
                    recordType: normalizeString(profile && profile.recordType),
                    recordId: normalizeString(profile && profile.recordId)
                }))
            }
        });

        if (status === 'rebalance_required') {
            nextReport = addPhase2ValidationRecommendation(nextReport, {
                recommendationId: 'phase2.summary.record_bound_profile_density_rebalance',
                familyId: 'summary',
                recommendationType: 'selective_rebalance',
                priority: 'medium',
                message: 'Record-bound summaries should preserve canonical binding while carrying denser field-backed signals for downstream use.',
                targetIds: ['record_bound_profiles', 'summary_logic', 'binding_aware_summary_surface'],
                meta: {
                    triggerId: 'gameplay_irrelevance',
                    smallestValidLoop: 'summary_logic'
                }
            });
        }

        return nextReport;
    }

    function runSummaryValidationFamily(report, input = {}, context = {}) {
        const pressurePackage = getStructuralPackageCandidate(input, 'pressureFieldPackage');
        const rhythmPackage = getStructuralPackageCandidate(input, 'environmentalRhythmPackage');
        let nextReport = report;

        if (!isPlainObject(pressurePackage) || !isPlainObject(rhythmPackage)) {
            nextReport = addSummaryValidationCheck(nextReport, {
                checkId: 'phase2.summary.package_presence',
                status: 'warning',
                message: 'Summary validation could not fully run because one or both package candidates are missing.',
                details: [
                    `pressureFieldPackagePresent=${String(isPlainObject(pressurePackage))}`,
                    `environmentalRhythmPackagePresent=${String(isPlainObject(rhythmPackage))}`
                ],
                affectedPaths: ['pressureFieldPackage', 'environmentalRhythmPackage'],
                meta: {
                    summaryValidation: true
                }
            });
        }

        if (isPlainObject(pressurePackage) && isPlainObject(rhythmPackage)) {
            nextReport = runPressureSummaryValidationCheck(nextReport, pressurePackage);
            nextReport = runRhythmSummaryValidationCheck(nextReport, rhythmPackage);
            nextReport = runRecordBoundSummaryValidationCheck(nextReport, pressurePackage, rhythmPackage);
        }

        const familySection = getValidationFamilySection(nextReport, 'summary').section;
        return {
            report: nextReport,
            stageResult: deepFreeze({
                familyId: 'summary',
                stageId: 'phase2.validation.summary',
                status: resolveValidationStatus(familySection.status, 'not_run'),
                usedCustomRunner: true,
                context: {
                    recordBindingContextId: normalizeString(context.recordBindingContextId),
                    sourcePressureFieldPackageId: normalizeString(context.sourcePressureFieldPackageId),
                    sourceEnvironmentalRhythmPackageId: normalizeString(context.sourceEnvironmentalRhythmPackageId)
                }
            })
        };
    }

    function getBuiltInValidationFamilyValidators() {
        return {
            structural: runStructuralValidationFamily,
            causal: runCausalValidationFamily,
            boundary: runBoundaryValidationFamily,
            distribution: runDistributionValidationFamily,
            design: runDesignValidationFamily,
            gameplay: runGameplayValidationFamily,
            summary: runSummaryValidationFamily
        };
    }

    function getPhase2ValidationOrchestrationFamilySequence() {
        return getPhase2ValidationFamilyIds();
    }

    function resolveValidationStageRunnerFamilyValidators(options = {}) {
        return isPlainObject(options.familyValidators) ? options.familyValidators : {};
    }

    function createPhase2ValidationFamilyStageDescriptor(familyId, sequenceIndex) {
        const resolvedFamilyId = resolveValidationFamilyId(familyId);
        if (!resolvedFamilyId) {
            throw new Error(`[worldgen/phase2] Unsupported validation family for orchestration: ${familyId}.`);
        }

        return deepFreeze({
            familyId: resolvedFamilyId,
            sequenceIndex,
            familyKey: getPhase2ValidationFamilyKeyById()[resolvedFamilyId],
            stageId: `phase2.validation.${resolvedFamilyId}`,
            defaultCheckId: `phase2.${resolvedFamilyId}.orchestration_shell`,
            defaultStatus: 'not_run',
            blocksOnFailure: true,
            summaryFamily: resolvedFamilyId === 'summary'
        });
    }

    function createDefaultValidationStageRunner(stageDescriptor) {
        return function defaultValidationStageRunner(report, input = {}, context = {}) {
            const nextReport = addPhase2ValidationCheck(report, stageDescriptor.familyId, {
                checkId: stageDescriptor.defaultCheckId,
                status: stageDescriptor.defaultStatus,
                message: `${stageDescriptor.familyId} validation is wired into the orchestration shell but awaits dedicated family implementation.`,
                details: [
                    `${stageDescriptor.familyId} family was reached in sequence position ${stageDescriptor.sequenceIndex}.`,
                    stageDescriptor.summaryFamily
                        ? 'Summary validation is explicitly included without drifting pressure/rhythm contracts.'
                        : 'Family orchestration remains separate from detailed validator logic.'
                ],
                affectedPaths: [],
                meta: {
                    orchestrationShell: true,
                    familyId: stageDescriptor.familyId,
                    sequenceIndex: stageDescriptor.sequenceIndex,
                    recordBindingContextId: normalizeString(context.recordBindingContextId),
                    sourcePressureFieldPackageId: normalizeString(context.sourcePressureFieldPackageId),
                    sourceEnvironmentalRhythmPackageId: normalizeString(context.sourceEnvironmentalRhythmPackageId)
                }
            });

            return {
                report: setPhase2ValidationFamilyStatus(nextReport, stageDescriptor.familyId, 'not_run'),
                stageResult: deepFreeze({
                    familyId: stageDescriptor.familyId,
                    stageId: stageDescriptor.stageId,
                    status: 'not_run',
                    usedCustomRunner: false
                })
            };
        };
    }

    function createPhase2ValidationFamilyStage(stageDescriptor, familyRunner) {
        const defaultRunner = createDefaultValidationStageRunner(stageDescriptor);
        const resolvedRunner = typeof familyRunner === 'function' ? familyRunner : defaultRunner;

        return deepFreeze({
            familyId: stageDescriptor.familyId,
            stageId: stageDescriptor.stageId,
            sequenceIndex: stageDescriptor.sequenceIndex,
            run(report, input = {}, context = {}) {
                const stageOutput = resolvedRunner(report, input, context);
                if (!isPlainObject(stageOutput) || !isPlainObject(stageOutput.report)) {
                    throw new Error(`[worldgen/phase2] Validation stage "${stageDescriptor.stageId}" must return { report, stageResult }.`);
                }

                return {
                    report: createPhase2ValidationReport(stageOutput.report),
                    stageResult: deepFreeze({
                        familyId: stageDescriptor.familyId,
                        stageId: stageDescriptor.stageId,
                        status: resolveValidationStatus(
                            normalizeString(stageOutput.stageResult && stageOutput.stageResult.status),
                            'not_run'
                        ),
                        usedCustomRunner: resolvedRunner !== defaultRunner
                    })
                };
            }
        });
    }

    function createPhase2ValidationOrchestrationStages(options = {}) {
        const familyValidators = {
            ...getBuiltInValidationFamilyValidators(),
            ...resolveValidationStageRunnerFamilyValidators(options)
        };
        return deepFreeze(getPhase2ValidationOrchestrationFamilySequence().map((familyId, sequenceIndex) => {
            const descriptor = createPhase2ValidationFamilyStageDescriptor(familyId, sequenceIndex);
            return createPhase2ValidationFamilyStage(descriptor, familyValidators[familyId]);
        }));
    }

    function createPhase2ValidationOrchestrationContext(input = {}) {
        return deepFreeze({
            recordBindingContextId: normalizeString(
                input.recordBindingContextId
                || (input.phase2RecordBindingLayer && input.phase2RecordBindingLayer.recordBindingContextId)
            ),
            sourcePressureFieldPackageId: normalizeString(
                input.sourcePressureFieldPackageId
                || (input.pressureFieldPackage && input.pressureFieldPackage.packageId)
            ) || 'phase2-unresolved-pressure-field-package',
            sourceEnvironmentalRhythmPackageId: normalizeString(
                input.sourceEnvironmentalRhythmPackageId
                || (input.environmentalRhythmPackage && input.environmentalRhythmPackage.packageId)
            ) || 'phase2-unresolved-environmental-rhythm-package',
            sourceMacroGeographyPackageId: normalizeString(
                input.sourceMacroGeographyPackageId
                || (input.phase2InputBundle && input.phase2InputBundle.sourceMacroGeographyPackageId)
            ) || 'phase2-unresolved-macro-geography-package',
            sourceMacroGeographyHandoffPackageId: normalizeString(
                input.sourceMacroGeographyHandoffPackageId
                || (input.phase2InputBundle && input.phase2InputBundle.sourceHandoffPackageId)
            ) || null
        });
    }

    function createPhase2ValidationOrchestrationShell(options = {}) {
        const stages = createPhase2ValidationOrchestrationStages(options);

        return deepFreeze({
            orchestratorId: VALIDATION_ORCHESTRATOR_ID,
            phaseId: PHASE_ID,
            version: VALIDATION_ORCHESTRATOR_VERSION,
            canonicalPath: 'js/worldgen/phase2/validation/index.js',
            familySequence: getPhase2ValidationOrchestrationFamilySequence(),
            stages,
            run(input = {}) {
                const context = createPhase2ValidationOrchestrationContext(input);
                let report = createPhase2ValidationReport({
                    validationId: normalizeString(input.validationId) || `${VALIDATION_ORCHESTRATOR_ID}:${Date.now()}`,
                    sourcePressureFieldPackageId: context.sourcePressureFieldPackageId,
                    sourceEnvironmentalRhythmPackageId: context.sourceEnvironmentalRhythmPackageId,
                    sourceMacroGeographyPackageId: context.sourceMacroGeographyPackageId,
                    sourceMacroGeographyHandoffPackageId: context.sourceMacroGeographyHandoffPackageId
                });
                const stageResults = [];

                stages.forEach((stage) => {
                    const stageOutput = stage.run(report, input, context);
                    report = stageOutput.report;
                    stageResults.push(stageOutput.stageResult);
                });

                report = finalizePhase2ValidationReport(report);
                return deepFreeze({
                    report,
                    orchestration: {
                        orchestratorId: VALIDATION_ORCHESTRATOR_ID,
                        version: VALIDATION_ORCHESTRATOR_VERSION,
                        stageCount: stages.length,
                        familySequence: getPhase2ValidationOrchestrationFamilySequence(),
                        stageResults
                    }
                });
            }
        });
    }

    function getPhase2ValidationReportHelpersDescriptor() {
        const statusEnums = getPhase2ValidationStatusEnums();

        return deepFreeze({
            helperId: VALIDATION_HELPERS_ID,
            phaseId: PHASE_ID,
            version: VALIDATION_HELPERS_VERSION,
            canonicalPath: 'js/worldgen/phase2/validation/index.js',
            supportedFamilies: getPhase2ValidationFamilyIds(),
            statusEnums,
            supportOnly: true,
            embedsDesignLogic: false,
            exposesCollectors: true,
            exposesBlockingReasonSupport: true,
            exposesValidationOrchestrationShell: true
        });
    }

    phase2.__contractFirstStubs = phase2.__contractFirstStubs || {};
    phase2.__contractFirstStubs[GROUP_ID] = STUB;
    phase2.validation = deepFreeze({
        getPhase2ValidationModuleStub,
        getPhase2ValidationReportHelpersDescriptor,
        getPhase2ValidationFamilyIds,
        getPhase2ValidationStatusEnums,
        createPhase2ValidationReport,
        createPhase2ValidationOrchestrationShell,
        createPhase2ValidationOrchestrationStages,
        setPhase2ValidationFamilyStatus,
        addPhase2ValidationCheck,
        collectPhase2ValidationRecommendation,
        addPhase2ValidationRecommendation,
        collectPhase2ValidationBlockingReason,
        addPhase2ValidationBlockingReason,
        finalizePhase2ValidationReport
    });

    Object.assign(phase2, {
        getPhase2ValidationModuleStub,
        getPhase2ValidationReportHelpersDescriptor,
        getPhase2ValidationFamilyIds,
        getPhase2ValidationStatusEnums,
        createPhase2ValidationReport,
        createPhase2ValidationOrchestrationShell,
        createPhase2ValidationOrchestrationStages,
        setPhase2ValidationFamilyStatus,
        addPhase2ValidationCheck,
        collectPhase2ValidationRecommendation,
        addPhase2ValidationRecommendation,
        collectPhase2ValidationBlockingReason,
        addPhase2ValidationBlockingReason,
        finalizePhase2ValidationReport
    });
})();
