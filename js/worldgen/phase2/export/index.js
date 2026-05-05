(() => {
    const game = window.Game;
    const phase2 = game.systems.worldgenPhase2 = game.systems.worldgenPhase2 || {};
    const GROUP_ID = 'export';
    const PHASE_ID = 'PHASE_2';
    const EXPORT_SHELL_ID = 'Phase2ExportShell';
    const EXPORT_SHELL_VERSION = 'phase2-export-shell-v1';
    const STUB = Object.freeze({
        groupId: GROUP_ID,
        status: 'partial_implemented_phase2_export_shell',
        canonicalPath: 'js/worldgen/phase2/export/',
        uiCoupling: false,
        implementsFieldLogic: false,
        purpose: 'Validation-gated package export entry point for PressureFieldPackage and EnvironmentalRhythmPackage.'
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

    function normalizeString(value, fallback = '') {
        return typeof value === 'string' ? value.trim() : fallback;
    }

    function getPhase2ExportModuleStub() {
        return STUB;
    }

    function canExportPhase2Outputs(validationReport = {}) {
        return normalizeString(validationReport && validationReport.finalStatus) === 'pass';
    }

    function getValidationBlockingSnapshot(validationReport = {}) {
        return {
            finalStatus: normalizeString(validationReport && validationReport.finalStatus, 'not_run'),
            blockingReasonIds: Array.isArray(validationReport && validationReport.blockingReasons)
                ? validationReport.blockingReasons.map((reason) => normalizeString(reason && reason.blockingReasonId))
                : [],
            recommendationIds: Array.isArray(validationReport && validationReport.rebalanceRecommendations)
                ? validationReport.rebalanceRecommendations.map((recommendation) => normalizeString(recommendation && recommendation.recommendationId))
                : []
        };
    }

    function createPhase2ExportEnvelopeShell(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};

        return deepFreeze({
            exportShellId: EXPORT_SHELL_ID,
            phaseId: PHASE_ID,
            version: EXPORT_SHELL_VERSION,
            canonicalPath: 'js/worldgen/phase2/export/index.js',
            validationGated: true,
            run(input = {}) {
                const validationReport = isPlainObject(input.validationReport) ? input.validationReport : null;
                const pressureFieldPackage = isPlainObject(input.pressureFieldPackage) ? input.pressureFieldPackage : null;
                const environmentalRhythmPackage = isPlainObject(input.environmentalRhythmPackage)
                    ? input.environmentalRhythmPackage
                    : null;
                const pressureSummaryOutput = isPlainObject(input.pressureSummaryOutput) ? input.pressureSummaryOutput : null;
                const rhythmSummaryOutput = isPlainObject(input.rhythmSummaryOutput) ? input.rhythmSummaryOutput : null;
                const rebalancePlan = isPlainObject(input.rebalancePlan) ? input.rebalancePlan : null;
                const blockedByValidation = !canExportPhase2Outputs(validationReport);

                if (blockedByValidation) {
                    return deepFreeze({
                        exportShellId: EXPORT_SHELL_ID,
                        exported: false,
                        blocked: true,
                        reason: 'validation_gate_blocked',
                        validation: getValidationBlockingSnapshot(validationReport),
                        bundle: null,
                        metadata: {
                            validationGated: true,
                            invalidOutputsBlocked: true,
                            configuredByOptions: Object.keys(normalizedOptions).length > 0
                        }
                    });
                }

                if (typeof phase2.assertPressureFieldPackage === 'function') {
                    phase2.assertPressureFieldPackage(pressureFieldPackage);
                }
                if (typeof phase2.assertEnvironmentalRhythmPackage === 'function') {
                    phase2.assertEnvironmentalRhythmPackage(environmentalRhythmPackage);
                }

                return deepFreeze({
                    exportShellId: EXPORT_SHELL_ID,
                    exported: true,
                    blocked: false,
                    reason: '',
                    validation: getValidationBlockingSnapshot(validationReport),
                    bundle: {
                        exportBundleId: normalizeString(
                            input.exportBundleId,
                            `phase2Export:${normalizeString(validationReport && validationReport.validationId, 'unvalidated')}`
                        ),
                        phaseId: PHASE_ID,
                        version: EXPORT_SHELL_VERSION,
                        pressureFieldPackage: cloneValue(pressureFieldPackage),
                        environmentalRhythmPackage: cloneValue(environmentalRhythmPackage),
                        summaries: {
                            pressure: cloneValue(pressureSummaryOutput),
                            rhythm: cloneValue(rhythmSummaryOutput)
                        },
                        validationReport: cloneValue(validationReport),
                        rebalanceMetadata: rebalancePlan && Array.isArray(rebalancePlan.rebalanceMetadata)
                            ? cloneValue(rebalancePlan.rebalanceMetadata)
                            : []
                    },
                    metadata: {
                        validationGated: true,
                        invalidOutputsBlocked: true,
                        exportsBothPackages: true,
                        exportsSummaries: true,
                        exportsValidationReport: true,
                        configuredByOptions: Object.keys(normalizedOptions).length > 0
                    }
                });
            }
        });
    }

    phase2.__contractFirstStubs = phase2.__contractFirstStubs || {};
    phase2.__contractFirstStubs[GROUP_ID] = STUB;

    Object.assign(phase2, {
        getPhase2ExportModuleStub,
        canExportPhase2Outputs,
        createPhase2ExportEnvelopeShell
    });
})();
