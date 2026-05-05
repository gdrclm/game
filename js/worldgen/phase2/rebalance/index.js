(() => {
    const game = window.Game;
    const phase2 = game.systems.worldgenPhase2 = game.systems.worldgenPhase2 || {};
    const GROUP_ID = 'rebalance';
    const PHASE_ID = 'PHASE_2';
    const REBALANCE_SHELL_ID = 'Phase2SelectiveRebalanceShell';
    const REBALANCE_SHELL_VERSION = 'phase2-selective-rebalance-shell-v1';
    const REBALANCE_EXECUTION_ORDER = Object.freeze([
        'validate_failure_type',
        'classify_severity',
        'select_smallest_valid_rebalance_loop',
        'rerun_affected_phase2_layer_only',
        'rerun_validation',
        'record_rebalance_metadata'
    ]);
    const REBALANCE_TRIGGER_RULES = Object.freeze({
        pressure_flattening: Object.freeze({
            triggerId: 'pressure_flattening',
            ruleId: 'trigger_a',
            allowedAdjustmentSurfaces: Object.freeze([
                'pressure_weighting',
                'synthesis_normalization',
                'contrast_thresholds'
            ]),
            affectedSubgenerators: Object.freeze([
                'PressureSynthesis',
                'ClimateBurdenInterpreter',
                'TerrainHarshnessGenerator',
                'HydrologyStressGenerator',
                'FoodReliabilityGenerator',
                'TravelExposureGenerator',
                'ChokepointPressureGenerator',
                'IsolationBurdenGenerator',
                'EcologicalFragilityGenerator',
                'CatastropheSusceptibilityGenerator'
            ]),
            smallestValidLoop: 'pressure_synthesis_and_normalization_only'
        }),
        rhythm_monotony: Object.freeze({
            triggerId: 'rhythm_monotony',
            ruleId: 'trigger_b',
            allowedAdjustmentSurfaces: Object.freeze([
                'cadence_synthesis',
                'storm_timing_thresholds',
                'scarcity_timing_thresholds'
            ]),
            affectedSubgenerators: Object.freeze([
                'EnvironmentalRhythmSynthesis',
                'StormCadenceInterpreter',
                'ScarcityCadenceGenerator',
                'PredictabilityRuptureAnalyzer'
            ]),
            smallestValidLoop: 'rhythm_synthesis_and_timing_thresholds_only'
        }),
        relief_collapse: Object.freeze({
            triggerId: 'relief_collapse',
            ruleId: 'trigger_c',
            allowedAdjustmentSurfaces: Object.freeze([
                'recovery_tempo',
                'relief_thresholds',
                'stabilization_interval_logic'
            ]),
            affectedSubgenerators: Object.freeze([
                'RecoveryReliefSynthesis',
                'EnvironmentalRhythmSynthesis'
            ]),
            smallestValidLoop: 'recovery_relief_synthesis_only'
        }),
        broken_route_logic: Object.freeze({
            triggerId: 'broken_route_logic',
            ruleId: 'trigger_d',
            allowedAdjustmentSurfaces: Object.freeze([
                'travel_exposure_interpretation',
                'chokepoint_pressure_interpretation',
                'navigation_window_interpretation'
            ]),
            affectedSubgenerators: Object.freeze([
                'TravelExposureGenerator',
                'ChokepointPressureGenerator',
                'NavigationWindowGenerator'
            ]),
            smallestValidLoop: 'route_specific_interpretation_only'
        }),
        causal_incoherence: Object.freeze({
            triggerId: 'causal_incoherence',
            ruleId: 'trigger_e',
            allowedAdjustmentSurfaces: Object.freeze([
                'weighting_and_source_binding_inside_phase2',
                'normalization_path',
                'record_binding_aggregation_logic'
            ]),
            affectedSubgenerators: Object.freeze([
                'Phase2RecordBindingLayer',
                'Phase2NormalizationLayer',
                'PressureSynthesis',
                'EnvironmentalRhythmSynthesis'
            ]),
            smallestValidLoop: 'binding_and_normalization_only'
        }),
        gameplay_irrelevance: Object.freeze({
            triggerId: 'gameplay_irrelevance',
            ruleId: 'trigger_f',
            allowedAdjustmentSurfaces: Object.freeze([
                'synthesized_layer_tuning',
                'summary_logic',
                'gameplay_projection_compatibility_thresholds'
            ]),
            affectedSubgenerators: Object.freeze([
                'PressureSynthesis',
                'EnvironmentalRhythmSynthesis',
                'PressureSummaryGenerator',
                'RhythmSummaryGenerator',
                'PredictabilityRuptureAnalyzer',
                'RecoveryReliefSynthesis'
            ]),
            smallestValidLoop: 'summary_and_projection_surface_only'
        })
    });
    const FORBIDDEN_ACTIONS = Object.freeze([
        'reroll_phase1_generators',
        'mutate_root_package_record_meaning',
        'import_political_or_history_handoff_fields',
        'flatten_world_for_readability',
        'remove_recovery_or_relief'
    ]);
    const STUB = Object.freeze({
        groupId: GROUP_ID,
        status: 'partial_implemented_selective_rebalance_paths',
        canonicalPath: 'js/worldgen/phase2/rebalance/',
        uiCoupling: false,
        implementsFieldLogic: false,
        purpose: 'Selective Phase 2-only rebalance planner for validation-triggered local corrections without rerolling Phase 1 truth.'
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

    function getDeterministicSeed(input = {}) {
        if (Object.prototype.hasOwnProperty.call(input, 'deterministicSeed')) {
            return input.deterministicSeed;
        }

        if (isPlainObject(input.phase2InputBundle) && Object.prototype.hasOwnProperty.call(input.phase2InputBundle, 'macroSeed')) {
            return input.phase2InputBundle.macroSeed;
        }

        return null;
    }

    function getPhase2RebalanceModuleStub() {
        return STUB;
    }

    function getValidationFamilyKeyById() {
        if (typeof phase2.getPhase2ValidationReportContract === 'function') {
            const contract = phase2.getPhase2ValidationReportContract();
            if (contract && isPlainObject(contract.familyRootKeyById)) {
                return cloneValue(contract.familyRootKeyById);
            }
        }

        return {
            structural: 'structuralChecks',
            causal: 'causalChecks',
            boundary: 'boundaryChecks',
            distribution: 'distributionChecks',
            design: 'designChecks',
            gameplay: 'gameplayChecks',
            summary: 'summaryChecks'
        };
    }

    function getFamilySection(report, familyId) {
        const familyKey = getValidationFamilyKeyById()[familyId];
        return familyKey && isPlainObject(report && report[familyKey])
            ? report[familyKey]
            : null;
    }

    function getCheckStatuses(report, familyId) {
        const section = getFamilySection(report, familyId);
        const checks = Array.isArray(section && section.checks) ? section.checks : [];
        return checks.reduce((index, check) => {
            index[normalizeString(check && check.checkId)] = normalizeString(check && check.status);
            return index;
        }, {});
    }

    function getMatchingCheckIds(report, familyId, allowedStatuses = []) {
        const statuses = new Set(uniqueStrings(allowedStatuses));
        return Object.entries(getCheckStatuses(report, familyId))
            .filter(([, status]) => statuses.has(status))
            .map(([checkId]) => checkId);
    }

    function classifyTriggerSeverity(checkIds = []) {
        const count = uniqueStrings(checkIds).length;
        if (count >= 3) {
            return 'high';
        }

        if (count >= 2) {
            return 'medium';
        }

        return 'low';
    }

    function buildSelectiveRebalanceTrigger(triggerId, checkIds = [], sourceValidationFamilies = []) {
        const triggerRule = REBALANCE_TRIGGER_RULES[triggerId];
        if (!triggerRule) {
            return null;
        }

        const normalizedCheckIds = uniqueStrings(checkIds);
        if (!normalizedCheckIds.length) {
            return null;
        }

        return deepFreeze({
            triggerId: triggerRule.triggerId,
            ruleId: triggerRule.ruleId,
            severity: classifyTriggerSeverity(normalizedCheckIds),
            sourceValidationFamilies: uniqueStrings(sourceValidationFamilies),
            sourceCheckIds: normalizedCheckIds,
            allowedAdjustmentSurfaces: triggerRule.allowedAdjustmentSurfaces.slice(),
            affectedSubgenerators: triggerRule.affectedSubgenerators.slice(),
            smallestValidLoop: triggerRule.smallestValidLoop,
            forbiddenActions: FORBIDDEN_ACTIONS.slice(),
            rerunsPhase1Truth: false
        });
    }

    function cloneRebalanceInput(input = {}) {
        return cloneValue(isPlainObject(input) ? input : {});
    }

    function getValidationShell() {
        return typeof phase2.createPhase2ValidationOrchestrationShell === 'function'
            ? phase2.createPhase2ValidationOrchestrationShell()
            : null;
    }

    function getPressureSummaryGenerator(deterministicSeed) {
        return typeof phase2.createPressureSummaryGenerator === 'function'
            ? phase2.createPressureSummaryGenerator({ deterministicSeed })
            : null;
    }

    function getRhythmSummaryGenerator(deterministicSeed) {
        return typeof phase2.createRhythmSummaryGenerator === 'function'
            ? phase2.createRhythmSummaryGenerator({ deterministicSeed })
            : null;
    }

    function runModuleFactory(factoryName, deterministicSeed, input = {}) {
        if (typeof phase2[factoryName] !== 'function') {
            return {
                ok: false,
                factoryName,
                error: `missing_factory:${factoryName}`
            };
        }

        try {
            return {
                ok: true,
                factoryName,
                output: phase2[factoryName]({ deterministicSeed }).run(input)
            };
        } catch (error) {
            return {
                ok: false,
                factoryName,
                error: normalizeString(error && error.message, 'unknown_rebalance_rerun_error')
            };
        }
    }

    function ensurePressurePackage(workingInput = {}) {
        if (!isPlainObject(workingInput.pressureFieldPackage)) {
            workingInput.pressureFieldPackage = {};
        }

        if (!isPlainObject(workingInput.pressureFieldPackage.domains)) {
            workingInput.pressureFieldPackage.domains = {};
        }

        if (!isPlainObject(workingInput.pressureFieldPackage.synthesized)) {
            workingInput.pressureFieldPackage.synthesized = {};
        }

        if (!isPlainObject(workingInput.pressureFieldPackage.summaries)) {
            workingInput.pressureFieldPackage.summaries = {};
        }

        if (!Array.isArray(workingInput.pressureFieldPackage.regionalProfiles)) {
            workingInput.pressureFieldPackage.regionalProfiles = [];
        }

        if (!isPlainObject(workingInput.pressureFieldPackage.summaryMetadata)) {
            workingInput.pressureFieldPackage.summaryMetadata = {};
        }

        return workingInput.pressureFieldPackage;
    }

    function ensureRhythmPackage(workingInput = {}) {
        if (!isPlainObject(workingInput.environmentalRhythmPackage)) {
            workingInput.environmentalRhythmPackage = {};
        }

        if (!isPlainObject(workingInput.environmentalRhythmPackage.domains)) {
            workingInput.environmentalRhythmPackage.domains = {};
        }

        if (!isPlainObject(workingInput.environmentalRhythmPackage.synthesized)) {
            workingInput.environmentalRhythmPackage.synthesized = {};
        }

        if (!isPlainObject(workingInput.environmentalRhythmPackage.summaries)) {
            workingInput.environmentalRhythmPackage.summaries = {};
        }

        if (!Array.isArray(workingInput.environmentalRhythmPackage.regionalProfiles)) {
            workingInput.environmentalRhythmPackage.regionalProfiles = [];
        }

        if (!isPlainObject(workingInput.environmentalRhythmPackage.summaryMetadata)) {
            workingInput.environmentalRhythmPackage.summaryMetadata = {};
        }

        return workingInput.environmentalRhythmPackage;
    }

    function mergePressureSynthesisIntoInput(workingInput, synthesisOutput) {
        const pressurePackage = ensurePressurePackage(workingInput);
        pressurePackage.domains = cloneValue(synthesisOutput.domainLayers || {});
        pressurePackage.synthesized = cloneValue(synthesisOutput.synthesized || {});
        pressurePackage.metadata = {
            ...(isPlainObject(pressurePackage.metadata) ? cloneValue(pressurePackage.metadata) : {}),
            synthesis: cloneValue(synthesisOutput.metadata || {})
        };
        workingInput.pressureSynthesisOutput = cloneValue(synthesisOutput);
    }

    function mergeRhythmSynthesisIntoInput(workingInput, synthesisOutput) {
        const rhythmPackage = ensureRhythmPackage(workingInput);
        rhythmPackage.domains = cloneValue(synthesisOutput.domainLayers || {});
        rhythmPackage.synthesized = cloneValue(synthesisOutput.synthesized || {});
        rhythmPackage.metadata = {
            ...(isPlainObject(rhythmPackage.metadata) ? cloneValue(rhythmPackage.metadata) : {}),
            synthesis: cloneValue(synthesisOutput.metadata || {})
        };
        workingInput.environmentalRhythmSynthesisOutput = cloneValue(synthesisOutput);
    }

    function mergePressureDomainIntoInput(workingInput, domainId, domainOutput) {
        const pressurePackage = ensurePressurePackage(workingInput);
        pressurePackage.domains[domainId] = cloneValue(domainOutput.domain || {});
    }

    function mergeRhythmDomainIntoInput(workingInput, domainId, domainOutput) {
        const rhythmPackage = ensureRhythmPackage(workingInput);
        rhythmPackage.domains[domainId] = cloneValue(domainOutput.domain || {});
    }

    function mergePressureSummaryIntoInput(workingInput, summaryOutput) {
        const pressurePackage = ensurePressurePackage(workingInput);
        if (isPlainObject(summaryOutput.pressure)) {
            pressurePackage.summaries = cloneValue(summaryOutput.pressure.summaries || {});
            pressurePackage.summaryMetadata.pressure = cloneValue(summaryOutput.pressure.metadata || {});
        }
        if (Array.isArray(summaryOutput.recordBoundProfiles)) {
            pressurePackage.regionalProfiles = cloneValue(summaryOutput.recordBoundProfiles);
        }
        workingInput.pressureSummaryOutput = cloneValue(summaryOutput);
    }

    function mergeRhythmSummaryIntoInput(workingInput, summaryOutput) {
        const rhythmPackage = ensureRhythmPackage(workingInput);
        if (isPlainObject(summaryOutput.rhythm)) {
            rhythmPackage.summaries = cloneValue(summaryOutput.rhythm.summaries || {});
            rhythmPackage.summaryMetadata.rhythm = cloneValue(summaryOutput.rhythm.metadata || {});
        }
        if (Array.isArray(summaryOutput.recordBoundProfiles)) {
            rhythmPackage.regionalProfiles = cloneValue(summaryOutput.recordBoundProfiles);
        }
        workingInput.rhythmSummaryOutput = cloneValue(summaryOutput);
    }

    function rerunPressureSynthesisPath(workingInput, deterministicSeed, rerunLog) {
        const synthesisResult = runModuleFactory('createPressureSynthesis', deterministicSeed, workingInput);
        rerunLog.push({
            moduleId: 'PressureSynthesis',
            ok: synthesisResult.ok,
            error: synthesisResult.error || ''
        });
        if (synthesisResult.ok) {
            mergePressureSynthesisIntoInput(workingInput, synthesisResult.output);
        }

        return synthesisResult.ok;
    }

    function rerunRhythmSynthesisPath(workingInput, deterministicSeed, rerunLog) {
        const synthesisResult = runModuleFactory('createEnvironmentalRhythmSynthesis', deterministicSeed, workingInput);
        rerunLog.push({
            moduleId: 'EnvironmentalRhythmSynthesis',
            ok: synthesisResult.ok,
            error: synthesisResult.error || ''
        });
        if (synthesisResult.ok) {
            mergeRhythmSynthesisIntoInput(workingInput, synthesisResult.output);
        }

        return synthesisResult.ok;
    }

    function rerunPressureSummaryPath(workingInput, deterministicSeed, rerunLog) {
        const generator = getPressureSummaryGenerator(deterministicSeed);
        if (!generator) {
            rerunLog.push({
                moduleId: 'PressureSummaryGenerator',
                ok: false,
                error: 'missing_factory:createPressureSummaryGenerator'
            });
            return false;
        }

        try {
            const output = generator.run(workingInput);
            mergePressureSummaryIntoInput(workingInput, output);
            rerunLog.push({
                moduleId: 'PressureSummaryGenerator',
                ok: true,
                error: ''
            });
            return true;
        } catch (error) {
            rerunLog.push({
                moduleId: 'PressureSummaryGenerator',
                ok: false,
                error: normalizeString(error && error.message, 'unknown_rebalance_rerun_error')
            });
            return false;
        }
    }

    function rerunRhythmSummaryPath(workingInput, deterministicSeed, rerunLog) {
        const generator = getRhythmSummaryGenerator(deterministicSeed);
        if (!generator) {
            rerunLog.push({
                moduleId: 'RhythmSummaryGenerator',
                ok: false,
                error: 'missing_factory:createRhythmSummaryGenerator'
            });
            return false;
        }

        try {
            const output = generator.run(workingInput);
            mergeRhythmSummaryIntoInput(workingInput, output);
            rerunLog.push({
                moduleId: 'RhythmSummaryGenerator',
                ok: true,
                error: ''
            });
            return true;
        } catch (error) {
            rerunLog.push({
                moduleId: 'RhythmSummaryGenerator',
                ok: false,
                error: normalizeString(error && error.message, 'unknown_rebalance_rerun_error')
            });
            return false;
        }
    }

    function rerunRecordBindingLayer(workingInput, rerunLog) {
        if (!isPlainObject(workingInput.phase2InputBundle) || typeof phase2.createPhase2RecordBindingLayer !== 'function') {
            rerunLog.push({
                moduleId: 'Phase2RecordBindingLayer',
                ok: false,
                error: 'missing_phase2_input_bundle_or_binding_factory'
            });
            return false;
        }

        try {
            workingInput.phase2RecordBindingLayer = phase2.createPhase2RecordBindingLayer(workingInput.phase2InputBundle);
            rerunLog.push({
                moduleId: 'Phase2RecordBindingLayer',
                ok: true,
                error: ''
            });
            return true;
        } catch (error) {
            rerunLog.push({
                moduleId: 'Phase2RecordBindingLayer',
                ok: false,
                error: normalizeString(error && error.message, 'unknown_rebalance_rerun_error')
            });
            return false;
        }
    }

    function rerunRouteSpecificModules(workingInput, deterministicSeed, rerunLog) {
        const pressureModuleRuns = [
            ['travel', 'createTravelExposureGenerator', 'TravelExposureGenerator'],
            ['chokepoints', 'createChokepointPressureGenerator', 'ChokepointPressureGenerator']
        ];
        pressureModuleRuns.forEach(([domainId, factoryName, moduleId]) => {
            const result = runModuleFactory(factoryName, deterministicSeed, workingInput);
            rerunLog.push({
                moduleId,
                ok: result.ok,
                error: result.error || ''
            });
            if (result.ok) {
                mergePressureDomainIntoInput(workingInput, domainId, result.output);
            }
        });

        const navigationResult = runModuleFactory('createNavigationWindowGenerator', deterministicSeed, workingInput);
        rerunLog.push({
            moduleId: 'NavigationWindowGenerator',
            ok: navigationResult.ok,
            error: navigationResult.error || ''
        });
        if (navigationResult.ok) {
            mergeRhythmDomainIntoInput(workingInput, 'navigation', navigationResult.output);
        }
    }

    function rerunRecoveryModules(workingInput, deterministicSeed, rerunLog) {
        const recoveryResult = runModuleFactory('createRecoveryReliefSynthesis', deterministicSeed, workingInput);
        rerunLog.push({
            moduleId: 'RecoveryReliefSynthesis',
            ok: recoveryResult.ok,
            error: recoveryResult.error || ''
        });
        if (recoveryResult.ok) {
            mergeRhythmDomainIntoInput(workingInput, 'recovery', recoveryResult.output);
        }
    }

    function buildRebalanceMetadataEntry(trigger, rerunLog, beforeReport, afterReport) {
        return deepFreeze({
            triggerId: trigger.triggerId,
            affectedSubgenerators: trigger.affectedSubgenerators.slice(),
            changedThresholdsOrWeights: [],
            validationResultBefore: {
                finalStatus: normalizeString(beforeReport && beforeReport.finalStatus, 'not_run'),
                sourceCheckIds: trigger.sourceCheckIds.slice()
            },
            validationResultAfter: {
                finalStatus: normalizeString(afterReport && afterReport.finalStatus, 'not_run'),
                sourceCheckIds: trigger.sourceCheckIds.slice()
            },
            localPhase2Only: true,
            rerunsPhase1Truth: false,
            importsForbiddenHandoffSemantics: false,
            rerunLog: cloneValue(rerunLog)
        });
    }

    function executeSelectiveRebalanceTriggerPath(trigger, baseInput = {}, validationReport = null) {
        const workingInput = cloneRebalanceInput(baseInput);
        const deterministicSeed = getDeterministicSeed(workingInput);
        const rerunLog = [];

        switch (trigger.triggerId) {
        case 'pressure_flattening':
            rerunPressureSynthesisPath(workingInput, deterministicSeed, rerunLog);
            rerunPressureSummaryPath(workingInput, deterministicSeed, rerunLog);
            break;
        case 'rhythm_monotony':
            rerunRhythmSynthesisPath(workingInput, deterministicSeed, rerunLog);
            rerunRhythmSummaryPath(workingInput, deterministicSeed, rerunLog);
            break;
        case 'relief_collapse':
            rerunRecoveryModules(workingInput, deterministicSeed, rerunLog);
            rerunRhythmSynthesisPath(workingInput, deterministicSeed, rerunLog);
            rerunRhythmSummaryPath(workingInput, deterministicSeed, rerunLog);
            break;
        case 'broken_route_logic':
            rerunRouteSpecificModules(workingInput, deterministicSeed, rerunLog);
            rerunPressureSynthesisPath(workingInput, deterministicSeed, rerunLog);
            rerunRhythmSynthesisPath(workingInput, deterministicSeed, rerunLog);
            rerunPressureSummaryPath(workingInput, deterministicSeed, rerunLog);
            rerunRhythmSummaryPath(workingInput, deterministicSeed, rerunLog);
            break;
        case 'causal_incoherence':
            rerunRecordBindingLayer(workingInput, rerunLog);
            rerunPressureSynthesisPath(workingInput, deterministicSeed, rerunLog);
            rerunRhythmSynthesisPath(workingInput, deterministicSeed, rerunLog);
            rerunPressureSummaryPath(workingInput, deterministicSeed, rerunLog);
            rerunRhythmSummaryPath(workingInput, deterministicSeed, rerunLog);
            break;
        case 'gameplay_irrelevance':
            rerunPressureSynthesisPath(workingInput, deterministicSeed, rerunLog);
            rerunRhythmSynthesisPath(workingInput, deterministicSeed, rerunLog);
            rerunPressureSummaryPath(workingInput, deterministicSeed, rerunLog);
            rerunRhythmSummaryPath(workingInput, deterministicSeed, rerunLog);
            break;
        default:
            break;
        }

        const validationShell = getValidationShell();
        const revalidated = validationShell
            ? validationShell.run({
                ...workingInput,
                validationId: `${REBALANCE_SHELL_ID}:${trigger.triggerId}:revalidated`
            })
            : { report: validationReport };
        const rebalanceMetadata = buildRebalanceMetadataEntry(
            trigger,
            rerunLog,
            validationReport,
            revalidated.report
        );

        return deepFreeze({
            triggerId: trigger.triggerId,
            ruleId: trigger.ruleId,
            localResponsePathId: `${trigger.triggerId}:${trigger.smallestValidLoop}`,
            smallestValidLoop: trigger.smallestValidLoop,
            localPhase2Only: true,
            rerunsPhase1Truth: false,
            importsForbiddenHandoffSemantics: false,
            affectedSubgenerators: trigger.affectedSubgenerators.slice(),
            rerunLog: cloneValue(rerunLog),
            rebalanceMetadata,
            revalidatedReport: cloneValue(revalidated.report || null),
            workingInput
        });
    }

    function classifyPhase2SelectiveRebalanceTriggers(validationReport = {}) {
        const triggers = [];
        const distributionRebalance = getMatchingCheckIds(validationReport, 'distribution', ['rebalance_required', 'fail']);
        const designRebalance = getMatchingCheckIds(validationReport, 'design', ['rebalance_required', 'fail']);
        const gameplayRebalance = getMatchingCheckIds(validationReport, 'gameplay', ['rebalance_required', 'fail']);
        const summaryRebalance = getMatchingCheckIds(validationReport, 'summary', ['rebalance_required', 'fail']);
        const causalFailures = getMatchingCheckIds(validationReport, 'causal', ['rebalance_required', 'fail']);

        const pressureTrigger = buildSelectiveRebalanceTrigger(
            'pressure_flattening',
            distributionRebalance.filter((checkId) => (
                checkId === 'phase2.distribution.pressure_contrast'
                || checkId === 'phase2.distribution.pressure_rhythm_differentiation'
            )).concat(
                designRebalance.filter((checkId) => (
                    checkId === 'phase2.design.planning_differentiation'
                    || checkId === 'phase2.design.profile_readability'
                ))
            ),
            ['distribution', 'design']
        );
        if (pressureTrigger) {
            triggers.push(pressureTrigger);
        }

        const rhythmTrigger = buildSelectiveRebalanceTrigger(
            'rhythm_monotony',
            distributionRebalance.filter((checkId) => checkId === 'phase2.distribution.rhythm_contrast')
                .concat(designRebalance.filter((checkId) => checkId === 'phase2.design.profile_readability')),
            ['distribution', 'design']
        );
        if (rhythmTrigger) {
            triggers.push(rhythmTrigger);
        }

        const reliefTrigger = buildSelectiveRebalanceTrigger(
            'relief_collapse',
            distributionRebalance.filter((checkId) => checkId === 'phase2.distribution.relief_presence')
                .concat(designRebalance.filter((checkId) => checkId === 'phase2.design.tension_vs_relief'))
                .concat(gameplayRebalance.filter((checkId) => checkId === 'phase2.gameplay.relief_relevance')),
            ['distribution', 'design', 'gameplay']
        );
        if (reliefTrigger) {
            triggers.push(reliefTrigger);
        }

        const routeTrigger = buildSelectiveRebalanceTrigger(
            'broken_route_logic',
            gameplayRebalance.filter((checkId) => checkId === 'phase2.gameplay.traversal_relevance'),
            ['gameplay']
        );
        if (routeTrigger) {
            triggers.push(routeTrigger);
        }

        const causalTrigger = buildSelectiveRebalanceTrigger(
            'causal_incoherence',
            causalFailures,
            ['causal']
        );
        if (causalTrigger) {
            triggers.push(causalTrigger);
        }

        const gameplayTrigger = buildSelectiveRebalanceTrigger(
            'gameplay_irrelevance',
            gameplayRebalance.concat(summaryRebalance),
            ['gameplay', 'summary']
        );
        if (gameplayTrigger) {
            triggers.push(gameplayTrigger);
        }

        return deepFreeze(triggers);
    }

    function createPhase2SelectiveRebalancePlanSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            shellId: REBALANCE_SHELL_ID,
            version: REBALANCE_SHELL_VERSION,
            phaseId: PHASE_ID,
            validationReportId: normalizeString(normalizedOverrides.validationReportId),
            validationFinalStatus: normalizeString(normalizedOverrides.validationFinalStatus, 'not_run'),
            triggerCount: Number.isFinite(normalizedOverrides.triggerCount)
                ? normalizedOverrides.triggerCount
                : 0,
            triggers: Array.isArray(normalizedOverrides.triggers)
                ? cloneValue(normalizedOverrides.triggers)
                : [],
            triggerResponses: Array.isArray(normalizedOverrides.triggerResponses)
                ? cloneValue(normalizedOverrides.triggerResponses)
                : [],
            rebalanceMetadata: Array.isArray(normalizedOverrides.rebalanceMetadata)
                ? cloneValue(normalizedOverrides.rebalanceMetadata)
                : [],
            executionOrder: REBALANCE_EXECUTION_ORDER.slice(),
            metadata: {
                selectivePhase2Only: true,
                rerollsPhase1Truth: false,
                mutatesPhase1Records: false,
                importsForbiddenHandoffSemantics: false,
                recordsRebalanceMetadata: true,
                smallestValidLoopRequired: true,
                ...(isPlainObject(normalizedOverrides.metadata) ? cloneValue(normalizedOverrides.metadata) : {})
            }
        });
    }

    function createPhase2SelectiveRebalanceShell(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};

        return deepFreeze({
            shellId: REBALANCE_SHELL_ID,
            phaseId: PHASE_ID,
            version: REBALANCE_SHELL_VERSION,
            canonicalPath: 'js/worldgen/phase2/rebalance/index.js',
            usesUpdatedRebalanceRules: true,
            run(input = {}) {
                const validationReport = isPlainObject(input.validationReport)
                    ? input.validationReport
                    : null;
                const triggers = validationReport
                    ? classifyPhase2SelectiveRebalanceTriggers(validationReport)
                    : [];
                const triggerResponses = triggers.map((trigger) => {
                    return executeSelectiveRebalanceTriggerPath(trigger, input, validationReport);
                });
                const rebalanceMetadata = triggerResponses.map((response) => response.rebalanceMetadata);

                return createPhase2SelectiveRebalancePlanSkeleton({
                    validationReportId: normalizeString(validationReport && validationReport.validationId),
                    validationFinalStatus: normalizeString(validationReport && validationReport.finalStatus, 'not_run'),
                    triggerCount: triggers.length,
                    triggers,
                    triggerResponses,
                    rebalanceMetadata,
                    metadata: {
                        selectivePhase2Only: true,
                        rerollsPhase1Truth: false,
                        mutatesPhase1Records: false,
                        importsForbiddenHandoffSemantics: false,
                        recordsRebalanceMetadata: true,
                        smallestValidLoopRequired: true,
                        usesUpdatedRebalanceRules: true,
                        configuredByOptions: Object.keys(normalizedOptions).length > 0,
                        executesLocalResponsePaths: true
                    }
                });
            }
        });
    }

    phase2.__contractFirstStubs = phase2.__contractFirstStubs || {};
    phase2.__contractFirstStubs[GROUP_ID] = STUB;

    Object.assign(phase2, {
        getPhase2RebalanceModuleStub,
        createPhase2SelectiveRebalancePlanSkeleton,
        classifyPhase2SelectiveRebalanceTriggers,
        executeSelectiveRebalanceTriggerPath,
        createPhase2SelectiveRebalanceShell
    });
})();
