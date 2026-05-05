(() => {
    const game = window.Game;
    const phase2 = game.systems.worldgenPhase2 = game.systems.worldgenPhase2 || {};
    const GROUP_ID = 'orchestration';
    const PHASE_ID = 'PHASE_2';
    const ENGINE_ID = 'Phase2Engine';
    const ENGINE_VERSION = 'phase2-engine-v1';
    const OFFICIAL_EXECUTION_ORDER = Object.freeze([
        'intake',
        'binding',
        'pressure',
        'recovery',
        'rhythm',
        'summaries',
        'validation',
        'rebalance',
        'export'
    ]);
    const STUB = Object.freeze({
        groupId: GROUP_ID,
        status: 'partial_implemented_phase2_engine',
        canonicalPath: 'js/worldgen/phase2/orchestration/',
        uiCoupling: false,
        implementsFieldLogic: false,
        purpose: 'Official Phase 2 execution-order entry point from intake through validation-gated export.'
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

    function getPhase2OrchestrationModuleStub() {
        return STUB;
    }

    function createStageResult(stageId, status, details = {}) {
        return deepFreeze({
            stageId,
            status,
            details: cloneValue(details)
        });
    }

    function getPressureSeed(input = {}, bundle = null) {
        if (Object.prototype.hasOwnProperty.call(input, 'pressureSeed')) {
            return input.pressureSeed;
        }

        return bundle ? bundle.sourceMacroSeed : null;
    }

    function getRhythmSeed(input = {}, bundle = null) {
        if (Object.prototype.hasOwnProperty.call(input, 'rhythmSeed')) {
            return input.rhythmSeed;
        }

        return bundle ? bundle.sourceMacroSeed : null;
    }

    function getPressurePackageContractFactory() {
        return typeof phase2.createPressureFieldPackageSkeleton === 'function'
            ? phase2.createPressureFieldPackageSkeleton
            : null;
    }

    function getRhythmPackageContractFactory() {
        return typeof phase2.createEnvironmentalRhythmPackageSkeleton === 'function'
            ? phase2.createEnvironmentalRhythmPackageSkeleton
            : null;
    }

    function getValidationShell() {
        return typeof phase2.createPhase2ValidationOrchestrationShell === 'function'
            ? phase2.createPhase2ValidationOrchestrationShell()
            : null;
    }

    function getRebalanceShell() {
        return typeof phase2.createPhase2SelectiveRebalanceShell === 'function'
            ? phase2.createPhase2SelectiveRebalanceShell()
            : null;
    }

    function getExportShell() {
        return typeof phase2.createPhase2ExportEnvelopeShell === 'function'
            ? phase2.createPhase2ExportEnvelopeShell()
            : null;
    }

    function buildProvisionalPressureValidationMeta() {
        return {
            fieldRangeStatus: 'pass',
            determinismStatus: 'pass',
            distributionStatus: 'pass',
            correlationStatus: 'pass',
            recordBindingStatus: 'pass',
            summaryStatus: 'pass'
        };
    }

    function buildProvisionalRhythmValidationMeta() {
        return {
            fieldRangeStatus: 'pass',
            determinismStatus: 'pass',
            distributionStatus: 'pass',
            cadenceStatus: 'pass',
            reliefStatus: 'pass',
            recordBindingStatus: 'pass',
            summaryStatus: 'pass'
        };
    }

    function resolveFamilyStatus(report, familyKey, fallback = 'rebalance_required') {
        const status = normalizeString(report && report[familyKey] && report[familyKey].status, '');
        return status || fallback;
    }

    function resolveDominantStatus(statuses = [], fallback = 'rebalance_required') {
        const priority = {
            not_run: 0,
            pass: 1,
            warning: 2,
            rebalance_required: 3,
            fail: 4
        };
        return (Array.isArray(statuses) ? statuses : []).reduce((dominant, status) => {
            const normalized = normalizeString(status, fallback);
            return (priority[normalized] || 0) > (priority[dominant] || 0) ? normalized : dominant;
        }, fallback);
    }

    function buildPressureValidationMetaFromReport(report) {
        return {
            fieldRangeStatus: resolveFamilyStatus(report, 'structuralChecks'),
            determinismStatus: resolveFamilyStatus(report, 'structuralChecks'),
            distributionStatus: resolveFamilyStatus(report, 'distributionChecks'),
            correlationStatus: resolveFamilyStatus(report, 'causalChecks'),
            recordBindingStatus: resolveFamilyStatus(report, 'causalChecks'),
            summaryStatus: resolveFamilyStatus(report, 'summaryChecks')
        };
    }

    function buildRhythmValidationMetaFromReport(report) {
        return {
            fieldRangeStatus: resolveFamilyStatus(report, 'structuralChecks'),
            determinismStatus: resolveFamilyStatus(report, 'structuralChecks'),
            distributionStatus: resolveFamilyStatus(report, 'distributionChecks'),
            cadenceStatus: resolveFamilyStatus(report, 'distributionChecks'),
            reliefStatus: resolveDominantStatus([
                resolveFamilyStatus(report, 'distributionChecks'),
                resolveFamilyStatus(report, 'designChecks'),
                resolveFamilyStatus(report, 'gameplayChecks')
            ]),
            recordBindingStatus: resolveFamilyStatus(report, 'causalChecks'),
            summaryStatus: resolveFamilyStatus(report, 'summaryChecks')
        };
    }

    function assemblePressureFieldPackage(workingState, validationMeta) {
        const factory = getPressurePackageContractFactory();
        if (!factory) {
            throw new Error('[worldgen/phase2] Missing createPressureFieldPackageSkeleton.');
        }

        const bundle = workingState.phase2InputBundle;
        const bindingLayer = workingState.phase2RecordBindingLayer;
        const synthesisOutput = workingState.pressureSynthesisOutput;
        const summaryOutput = workingState.pressureSummaryOutput;

        return factory({
            packageId: `pressureFieldPackage:${normalizeString(bundle && bundle.sourceMacroGeographyPackageId, 'unknown')}`,
            sourceMacroGeographyPackageId: normalizeString(bundle && bundle.sourceMacroGeographyPackageId),
            sourceMacroGeographyVersion: normalizeString(bundle && bundle.sourceMacroGeographyVersion),
            sourceHandoffPackageId: normalizeString(
                bundle && bundle.filteredHandoff && bundle.filteredHandoff.sourceHandoffPackageId,
                ''
            ) || null,
            sourceWorldSeedProfileId: null,
            recordBindingContextId: normalizeString(bindingLayer && bindingLayer.recordBindingContextId),
            domains: cloneValue(synthesisOutput && synthesisOutput.domainLayers),
            synthesized: cloneValue(synthesisOutput && synthesisOutput.synthesized),
            regionalProfiles: cloneValue(summaryOutput && summaryOutput.recordBoundProfiles),
            summaries: cloneValue(summaryOutput && summaryOutput.pressure && summaryOutput.pressure.summaries),
            validationMeta: cloneValue(validationMeta)
        });
    }

    function assembleEnvironmentalRhythmPackage(workingState, validationMeta) {
        const factory = getRhythmPackageContractFactory();
        if (!factory) {
            throw new Error('[worldgen/phase2] Missing createEnvironmentalRhythmPackageSkeleton.');
        }

        const bundle = workingState.phase2InputBundle;
        const bindingLayer = workingState.phase2RecordBindingLayer;
        const synthesisOutput = workingState.environmentalRhythmSynthesisOutput;
        const summaryOutput = workingState.rhythmSummaryOutput;

        return factory({
            packageId: `environmentalRhythmPackage:${normalizeString(bundle && bundle.sourceMacroGeographyPackageId, 'unknown')}`,
            sourceMacroGeographyPackageId: normalizeString(bundle && bundle.sourceMacroGeographyPackageId),
            sourceMacroGeographyVersion: normalizeString(bundle && bundle.sourceMacroGeographyVersion),
            sourceHandoffPackageId: normalizeString(
                bundle && bundle.filteredHandoff && bundle.filteredHandoff.sourceHandoffPackageId,
                ''
            ) || null,
            sourceWorldSeedProfileId: null,
            recordBindingContextId: normalizeString(bindingLayer && bindingLayer.recordBindingContextId),
            domains: cloneValue(synthesisOutput && synthesisOutput.domainLayers),
            synthesized: cloneValue(synthesisOutput && synthesisOutput.synthesized),
            regionalProfiles: cloneValue(summaryOutput && summaryOutput.recordBoundProfiles),
            summaries: cloneValue(summaryOutput && summaryOutput.rhythm && summaryOutput.rhythm.summaries),
            validationMeta: cloneValue(validationMeta)
        });
    }

    function restampPackagesFromReport(workingState, report) {
        workingState.pressureFieldPackage = assemblePressureFieldPackage(
            workingState,
            buildPressureValidationMetaFromReport(report)
        );
        workingState.environmentalRhythmPackage = assembleEnvironmentalRhythmPackage(
            workingState,
            buildRhythmValidationMetaFromReport(report)
        );
    }

    function createPhase2Engine(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};

        return deepFreeze({
            engineId: ENGINE_ID,
            phaseId: PHASE_ID,
            version: ENGINE_VERSION,
            canonicalPath: 'js/worldgen/phase2/orchestration/index.js',
            officialExecutionOrder: OFFICIAL_EXECUTION_ORDER.slice(),
            run(input = {}) {
                const workingState = cloneValue(input);
                const stageResults = [];

                workingState.phase2InputBundle = phase2.createPhase2InputBundle(input, normalizedOptions.intakeOptions);
                stageResults.push(createStageResult('intake', 'pass', {
                    bundleId: workingState.phase2InputBundle.bundleId
                }));

                workingState.phase2RecordBindingLayer = phase2.createPhase2RecordBindingLayer(workingState.phase2InputBundle);
                stageResults.push(createStageResult('binding', 'pass', {
                    recordBindingContextId: workingState.phase2RecordBindingLayer.recordBindingContextId
                }));

                const pressureSeed = getPressureSeed(input, workingState.phase2InputBundle);
                const rhythmSeed = getRhythmSeed(input, workingState.phase2InputBundle);

                workingState.pressureSynthesisOutput = phase2.createPressureSynthesis({
                    deterministicSeed: pressureSeed
                }).run(workingState);
                stageResults.push(createStageResult('pressure', 'pass', {
                    synthesizedFieldCount: Object.keys(workingState.pressureSynthesisOutput.synthesized || {}).length
                }));

                workingState.recoveryReliefOutput = phase2.createRecoveryReliefSynthesis({
                    deterministicSeed: rhythmSeed
                }).run(workingState);
                stageResults.push(createStageResult('recovery', 'pass', {
                    recoveryFieldCount: Object.keys(
                        (workingState.recoveryReliefOutput && workingState.recoveryReliefOutput.domain) || {}
                    ).length
                }));

                workingState.environmentalRhythmSynthesisOutput = phase2.createEnvironmentalRhythmSynthesis({
                    deterministicSeed: rhythmSeed
                }).run({
                    ...workingState,
                    recoveryReliefSynthesisOutput: workingState.recoveryReliefOutput
                });
                stageResults.push(createStageResult('rhythm', 'pass', {
                    synthesizedFieldCount: Object.keys(
                        workingState.environmentalRhythmSynthesisOutput.synthesized || {}
                    ).length
                }));

                workingState.pressureSummaryOutput = phase2.createPressureSummaryGenerator({
                    deterministicSeed: pressureSeed
                }).run(workingState);
                workingState.rhythmSummaryOutput = phase2.createRhythmSummaryGenerator({
                    deterministicSeed: rhythmSeed
                }).run(workingState);
                stageResults.push(createStageResult('summaries', 'pass', {
                    pressureProfileCount: Array.isArray(workingState.pressureSummaryOutput.recordBoundProfiles)
                        ? workingState.pressureSummaryOutput.recordBoundProfiles.length
                        : 0,
                    rhythmProfileCount: Array.isArray(workingState.rhythmSummaryOutput.recordBoundProfiles)
                        ? workingState.rhythmSummaryOutput.recordBoundProfiles.length
                        : 0
                }));

                workingState.pressureFieldPackage = assemblePressureFieldPackage(
                    workingState,
                    buildProvisionalPressureValidationMeta()
                );
                workingState.environmentalRhythmPackage = assembleEnvironmentalRhythmPackage(
                    workingState,
                    buildProvisionalRhythmValidationMeta()
                );

                const validationShell = getValidationShell();
                if (!validationShell) {
                    throw new Error('[worldgen/phase2] Missing validation orchestration shell.');
                }

                const initialValidation = validationShell.run(workingState);
                restampPackagesFromReport(workingState, initialValidation.report);
                const validation = validationShell.run(workingState);
                workingState.validationReport = validation.report;
                stageResults.push(createStageResult('validation', 'pass', {
                    initialStatus: normalizeString(initialValidation.report.finalStatus, 'not_run'),
                    finalStatus: normalizeString(validation.report.finalStatus, 'not_run')
                }));

                let rebalancePlan = null;
                let selectedRebalancedState = null;
                if (normalizeString(validation.report.finalStatus) !== 'pass') {
                    const rebalanceShell = getRebalanceShell();
                    if (!rebalanceShell) {
                        throw new Error('[worldgen/phase2] Missing selective rebalance shell.');
                    }

                    rebalancePlan = rebalanceShell.run({
                        ...workingState,
                        validationReport: validation.report
                    });
                    const firstPassingResponse = Array.isArray(rebalancePlan.triggerResponses)
                        ? rebalancePlan.triggerResponses.find((response) => {
                            return normalizeString(
                                response && response.revalidatedReport && response.revalidatedReport.finalStatus
                            ) === 'pass';
                        })
                        : null;

                    if (firstPassingResponse && isPlainObject(firstPassingResponse.workingInput)) {
                        selectedRebalancedState = cloneValue(firstPassingResponse.workingInput);
                        selectedRebalancedState.validationReport = cloneValue(firstPassingResponse.revalidatedReport);
                    }

                    stageResults.push(createStageResult('rebalance', firstPassingResponse ? 'pass' : 'blocked', {
                        triggerCount: rebalancePlan.triggerCount,
                        metadataCount: Array.isArray(rebalancePlan.rebalanceMetadata)
                            ? rebalancePlan.rebalanceMetadata.length
                            : 0,
                        foundPassingResponse: Boolean(firstPassingResponse)
                    }));
                } else {
                    stageResults.push(createStageResult('rebalance', 'pass', {
                        triggerCount: 0,
                        metadataCount: 0,
                        foundPassingResponse: false
                    }));
                }

                const exportState = selectedRebalancedState || workingState;
                const finalValidationInput = cloneValue(exportState);
                if (isPlainObject(finalValidationInput.validationReport)) {
                    restampPackagesFromReport(finalValidationInput, finalValidationInput.validationReport);
                }
                const finalValidation = validationShell.run(finalValidationInput);
                finalValidationInput.validationReport = finalValidation.report;
                restampPackagesFromReport(finalValidationInput, finalValidation.report);

                const exportShell = getExportShell();
                if (!exportShell) {
                    throw new Error('[worldgen/phase2] Missing export shell.');
                }

                const exportResult = exportShell.run({
                    pressureFieldPackage: finalValidationInput.pressureFieldPackage,
                    environmentalRhythmPackage: finalValidationInput.environmentalRhythmPackage,
                    pressureSummaryOutput: finalValidationInput.pressureSummaryOutput,
                    rhythmSummaryOutput: finalValidationInput.rhythmSummaryOutput,
                    validationReport: finalValidation.report,
                    rebalancePlan
                });

                stageResults.push(createStageResult('export', exportResult.exported ? 'pass' : 'blocked', {
                    exported: exportResult.exported,
                    validationStatus: normalizeString(finalValidation.report.finalStatus, 'not_run')
                }));

                return deepFreeze({
                    engineId: ENGINE_ID,
                    phaseId: PHASE_ID,
                    version: ENGINE_VERSION,
                    executionOrder: OFFICIAL_EXECUTION_ORDER.slice(),
                    stageResults,
                    output: {
                        phase2InputBundle: cloneValue(finalValidationInput.phase2InputBundle),
                        phase2RecordBindingLayer: cloneValue(finalValidationInput.phase2RecordBindingLayer),
                        pressureFieldPackage: cloneValue(finalValidationInput.pressureFieldPackage),
                        environmentalRhythmPackage: cloneValue(finalValidationInput.environmentalRhythmPackage),
                        pressureSummaryOutput: cloneValue(finalValidationInput.pressureSummaryOutput),
                        rhythmSummaryOutput: cloneValue(finalValidationInput.rhythmSummaryOutput),
                        validationReport: cloneValue(finalValidation.report),
                        rebalancePlan: cloneValue(rebalancePlan),
                        exportResult: cloneValue(exportResult)
                    },
                    metadata: {
                        executionOrderMatchesPipeline: true,
                        blocksInvalidOutputs: true,
                        skipsRecordBinding: false,
                        skipsValidationGate: false
                    }
                });
            }
        });
    }

    phase2.__contractFirstStubs = phase2.__contractFirstStubs || {};
    phase2.__contractFirstStubs[GROUP_ID] = STUB;

    Object.assign(phase2, {
        getPhase2OrchestrationModuleStub,
        createPhase2Engine
    });
})();
