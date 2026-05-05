(() => {
    const game = window.Game;
    const phase2 = game.systems.worldgenPhase2 = game.systems.worldgenPhase2 || {};
    const GROUP_ID = 'rhythm';
    const SEASONALITY_INTERPRETER_MODULE_ID = 'SeasonalityInterpreter';
    const SEASONALITY_INTERPRETER_MODULE_VERSION = 'phase2-rhythm-seasonality-interpreter-stub-v1';
    const STORM_CADENCE_INTERPRETER_MODULE_ID = 'StormCadenceInterpreter';
    const STORM_CADENCE_INTERPRETER_MODULE_VERSION = 'phase2-rhythm-storm-cadence-interpreter-v1';
    const NAVIGATION_WINDOW_GENERATOR_MODULE_ID = 'NavigationWindowGenerator';
    const NAVIGATION_WINDOW_GENERATOR_MODULE_VERSION = 'phase2-rhythm-navigation-window-generator-v1';
    const SCARCITY_CADENCE_GENERATOR_MODULE_ID = 'ScarcityCadenceGenerator';
    const SCARCITY_CADENCE_GENERATOR_MODULE_VERSION = 'phase2-rhythm-scarcity-cadence-generator-v1';
    const PREDICTABILITY_RUPTURE_ANALYZER_MODULE_ID = 'PredictabilityRuptureAnalyzer';
    const PREDICTABILITY_RUPTURE_ANALYZER_MODULE_VERSION = 'phase2-rhythm-predictability-rupture-analyzer-v1';
    const ENVIRONMENTAL_RHYTHM_SYNTHESIS_MODULE_ID = 'EnvironmentalRhythmSynthesis';
    const ENVIRONMENTAL_RHYTHM_SYNTHESIS_MODULE_VERSION = 'phase2-rhythm-environmental-synthesis-v1';
    const RECOVERY_RELIEF_SYNTHESIS_MODULE_ID = 'RecoveryReliefSynthesis';
    const RECOVERY_RELIEF_SYNTHESIS_MODULE_VERSION = 'phase2-rhythm-recovery-relief-synthesis-v1';
    const RHYTHM_PACKAGE_CONTRACT_ID = 'EnvironmentalRhythmPackage';
    const SEASONALITY_RHYTHM_DOMAIN_CONTRACT_ID = 'Phase2SeasonalityRhythmDomain';
    const STORM_CADENCE_RHYTHM_DOMAIN_CONTRACT_ID = 'Phase2StormCadenceRhythmDomain';
    const NAVIGATION_RHYTHM_DOMAIN_CONTRACT_ID = 'Phase2NavigationRhythmDomain';
    const SCARCITY_CADENCE_RHYTHM_DOMAIN_CONTRACT_ID = 'Phase2ScarcityCadenceRhythmDomain';
    const PREDICTABILITY_RHYTHM_DOMAIN_CONTRACT_ID = 'Phase2PredictabilityRhythmDomain';
    const RECOVERY_RHYTHM_DOMAIN_CONTRACT_ID = 'Phase2RecoveryRhythmDomain';
    const PRESSURE_PACKAGE_CONTRACT_ID = 'PressureFieldPackage';
    const INPUT_BUNDLE_CONTRACT_ID = 'Phase2InputBundle';
    const RECORD_BINDING_LAYER_CONTRACT_ID = 'Phase2RecordBindingLayer';
    const SEASONALITY_RHYTHM_FIELD_IDS = Object.freeze([
        'seasonalityStrength',
        'annualSwingStrength',
        'environmentalCycleClarity'
    ]);
    const STORM_CADENCE_RHYTHM_FIELD_IDS = Object.freeze([
        'stormCadence',
        'stormBurstClustering',
        'calmToStormTransitionSharpness'
    ]);
    const NAVIGATION_RHYTHM_FIELD_IDS = Object.freeze([
        'navigationWindowReliability',
        'blockedIntervalFrequency',
        'safeRouteIntervalStrength'
    ]);
    const SCARCITY_CADENCE_RHYTHM_FIELD_IDS = Object.freeze([
        'scarcityCadence',
        'deficitPersistence',
        'shortageRecurrence'
    ]);
    const PREDICTABILITY_RHYTHM_FIELD_IDS = Object.freeze([
        'predictability',
        'ruptureFrequency',
        'cadenceIrregularity',
        'temporalTrustworthiness'
    ]);
    const RHYTHM_SYNTHESIZED_FIELD_IDS = Object.freeze([
        'seasonalityProfile',
        'stormRhythm',
        'navigationRhythm',
        'scarcityRhythm',
        'predictabilityProfile',
        'ruptureProfile',
        'recoveryProfile'
    ]);
    const RECOVERY_RHYTHM_FIELD_IDS = Object.freeze([
        'recoveryTempo',
        'stabilizationInterval',
        'reliefPersistence',
        'environmentalForgiveness'
    ]);
    const RHYTHM_DOMAIN_IDS = Object.freeze([
        'seasonality',
        'storms',
        'navigation',
        'scarcity',
        'predictability',
        'recovery'
    ]);
    const RECOVERY_RELIEF_TIMING_POLICY = Object.freeze({
        policyId: 'coarseRecoveryReliefReadabilityCalibration',
        preservesRecoveryPriority: true,
        pressureSupportContextOnly: true,
        mixesPressureAndRhythm: false,
        supportThreshold: 0.16,
        instabilityThreshold: 0.18,
        persistenceThreshold: 0.14,
        forgivenessThreshold: 0.15,
        reliefPocketThreshold: 0.58,
        mobilityReliefThreshold: 0.54,
        persistenceReliefThreshold: 0.52,
        localReliefBonusCap: 0.18,
        recoveryExponent: 0.84,
        instabilityExponent: 0.8,
        persistenceExponent: 0.82,
        forgivenessExponent: 0.86,
        reliefPocketExponent: 0.92,
        mobilityReliefExponent: 0.9
    });
    const SEASONALITY_TIMING_POLICY = Object.freeze({
        policyId: 'coarseSeasonalityCycleReadabilityCalibration',
        rebuildsClimateGeneration: false,
        pressureMixingDetected: false,
        seasonalityThreshold: 0.14,
        annualSwingThreshold: 0.16,
        cycleClarityThreshold: 0.12,
        weakCycleThreshold: 0.22,
        strongCycleStart: 0.48,
        annualSwingReadabilityThreshold: 0.24,
        seasonalityExponent: 0.84,
        annualSwingExponent: 0.8,
        clarityExponent: 0.88,
        weakCycleExponent: 1.08,
        strongCycleExponent: 0.78
    });
    const STORM_CADENCE_TIMING_POLICY = Object.freeze({
        policyId: 'coarseStormCadenceBurstReadabilityCalibration',
        rebuildsHazardGeneration: false,
        pressureMixingDetected: false,
        cadenceThreshold: 0.16,
        clusteringThreshold: 0.14,
        transitionThreshold: 0.15,
        burstThreshold: 0.46,
        regularCadenceThreshold: 0.18,
        clusterDominanceThreshold: 0.2,
        maritimePivot: 0.42,
        cadenceExponent: 0.84,
        clusteringExponent: 0.82,
        transitionExponent: 0.8,
        burstExponent: 0.78,
        maritimeExponent: 0.9,
        regularCadenceExponent: 0.88,
        clusterDominanceExponent: 0.84
    });
    const NAVIGATION_WINDOW_TIMING_POLICY = Object.freeze({
        policyId: 'coarseNavigationWindowRouteCoherenceCalibration',
        rebuildsTraversalGeneration: false,
        pressureMixingDetected: false,
        reliabilityThreshold: 0.14,
        blockedThreshold: 0.16,
        safeIntervalThreshold: 0.12,
        routeExposureThreshold: 0.2,
        chokepointDependenceThreshold: 0.22,
        routeCoherenceThreshold: 0.18,
        structuralAnchorThreshold: 0.2,
        reliabilityExponent: 0.86,
        blockedExponent: 0.82,
        safeIntervalExponent: 0.88,
        routeExposureExponent: 0.84,
        chokepointDependenceExponent: 0.86,
        routeCoherenceExponent: 0.9,
        structuralAnchorExponent: 0.88
    });
    const SCARCITY_CADENCE_TIMING_POLICY = Object.freeze({
        policyId: 'coarseScarcityCadenceAlternationCalibration',
        rebuildsScarcityGeneration: false,
        pressureMixingDetected: false,
        supportBurdenThreshold: 0.18,
        cadenceThreshold: 0.14,
        persistenceThreshold: 0.16,
        recurrenceThreshold: 0.14,
        alternationThreshold: 0.18,
        reliefWindowThreshold: 0.22,
        cadenceExponent: 0.86,
        persistenceExponent: 0.84,
        recurrenceExponent: 0.88,
        supportBurdenExponent: 0.82,
        alternationExponent: 0.86,
        reliefWindowExponent: 0.9
    });
    const PREDICTABILITY_RHYTHM_TIMING_POLICY = Object.freeze({
        policyId: 'coarsePredictabilityPlanningReadabilityCalibration',
        rebuildsVolatilityGeneration: false,
        pressureMixingDetected: false,
        predictabilityThreshold: 0.14,
        ruptureThreshold: 0.16,
        irregularityThreshold: 0.14,
        trustThreshold: 0.16,
        planningSignalThreshold: 0.22,
        ruptureSignalThreshold: 0.2,
        predictabilityExponent: 0.88,
        ruptureExponent: 0.84,
        irregularityExponent: 0.86,
        trustExponent: 0.9,
        planningSignalExponent: 0.88,
        ruptureSignalExponent: 0.84
    });
    const RHYTHM_SYNTHESIS_TIMING_POLICY = Object.freeze({
        policyId: 'coarseEnvironmentalRhythmFamilyReadabilityCalibration',
        flattensTimingStructure: false,
        preservesRecoveryExplicitness: true,
        pressureMixingDetected: false,
        familyDeviationWeight: 0.22,
        componentSpreadWeight: 0.12,
        dominantContributionWeight: 0.08,
        spreadThreshold: 0.14,
        spreadExponent: 0.88,
        dominantContributionThreshold: 0.22,
        dominantContributionExponent: 0.9
    });
    const STUB = Object.freeze({
        groupId: GROUP_ID,
        status: 'partial_implemented_recovery_seasonality_storm_navigation_scarcity_and_predictability_timing',
        canonicalPath: 'js/worldgen/phase2/rhythm/',
        uiCoupling: false,
        implementsFieldLogic: true,
        purpose: 'Rhythm-only entry point for timing structure, cadence, rupture, and predictability.'
    });

    const SEASONALITY_INTERPRETER_INPUT_SPEC = Object.freeze({
        moduleId: SEASONALITY_INTERPRETER_MODULE_ID,
        phaseId: 'PHASE_2',
        rhythmSideOnly: true,
        deterministicBy: 'explicit seasonality rhythm sub-seed input',
        requiredInputs: Object.freeze({
            inputBundleContractId: INPUT_BUNDLE_CONTRACT_ID,
            recordBindingContractId: RECORD_BINDING_LAYER_CONTRACT_ID,
            packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
            targetDomainContractId: SEASONALITY_RHYTHM_DOMAIN_CONTRACT_ID,
            deterministicSeedPurpose: 'rhythm',
            deterministicNamespace: 'phase2.rhythm.seasonality'
        }),
        mandatoryOutputFieldIds: SEASONALITY_RHYTHM_FIELD_IDS,
        forbiddenInputs: Object.freeze([
            'PressureFieldPackage',
            'coldPressure',
            'heatPressure',
            'humidityPressure',
            'climateExposurePressure',
            'survivabilityPressure',
            'recoveryTempo',
            'recoveryProfile'
        ])
    });

    const SEASONALITY_INTERPRETER_OUTPUT_SPEC = Object.freeze({
        moduleId: SEASONALITY_INTERPRETER_MODULE_ID,
        packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
        targetDomainId: 'seasonality',
        targetDomainContractId: SEASONALITY_RHYTHM_DOMAIN_CONTRACT_ID,
        deterministicStub: false,
        computesRhythmFields: true,
        rebuildsClimateGeneration: false,
        outputShape: Object.freeze({
            domain: Object.freeze({
                seasonalityStrength: null,
                annualSwingStrength: null,
                environmentalCycleClarity: null
            }),
            metadata: Object.freeze({
                interpreterId: SEASONALITY_INTERPRETER_MODULE_ID,
                interpreterVersion: SEASONALITY_INTERPRETER_MODULE_VERSION,
                deterministicSeedUsed: null,
                deterministicNamespace: 'phase2.rhythm.seasonality',
                executionMode: 'implemented_coarse_seasonality_interpretation',
                computedFieldIds: SEASONALITY_RHYTHM_FIELD_IDS,
                deferredFieldIds: Object.freeze([]),
                timingSemanticsPreserved: true,
                pressureMixingDetected: false,
                rebuildsClimateGeneration: false
            })
        })
    });

    const STORM_CADENCE_INTERPRETER_INPUT_SPEC = Object.freeze({
        moduleId: STORM_CADENCE_INTERPRETER_MODULE_ID,
        phaseId: 'PHASE_2',
        rhythmSideOnly: true,
        deterministicBy: 'explicit storm cadence rhythm sub-seed input',
        requiredInputs: Object.freeze({
            inputBundleContractId: INPUT_BUNDLE_CONTRACT_ID,
            recordBindingContractId: RECORD_BINDING_LAYER_CONTRACT_ID,
            packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
            targetDomainContractId: STORM_CADENCE_RHYTHM_DOMAIN_CONTRACT_ID,
            deterministicSeedPurpose: 'rhythm',
            deterministicNamespace: 'phase2.rhythm.storms'
        }),
        mandatoryOutputFieldIds: STORM_CADENCE_RHYTHM_FIELD_IDS,
        forbiddenInputs: Object.freeze([
            'PressureFieldPackage',
            'stormBreakRisk',
            'catastrophePressure',
            'floodBreakRisk',
            'droughtBreakRisk',
            'stormRhythm',
            'survivabilityPressure',
            'recoveryTempo'
        ])
    });

    const STORM_CADENCE_INTERPRETER_OUTPUT_SPEC = Object.freeze({
        moduleId: STORM_CADENCE_INTERPRETER_MODULE_ID,
        packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
        targetDomainId: 'storms',
        targetDomainContractId: STORM_CADENCE_RHYTHM_DOMAIN_CONTRACT_ID,
        deterministicStub: false,
        computesRhythmFields: true,
        rebuildsHazardGeneration: false,
        outputShape: Object.freeze({
            domain: Object.freeze({
                stormCadence: null,
                stormBurstClustering: null,
                calmToStormTransitionSharpness: null
            }),
            metadata: Object.freeze({
                interpreterId: STORM_CADENCE_INTERPRETER_MODULE_ID,
                interpreterVersion: STORM_CADENCE_INTERPRETER_MODULE_VERSION,
                deterministicSeedUsed: null,
                deterministicNamespace: 'phase2.rhythm.storms',
                executionMode: 'implemented_coarse_storm_cadence_interpretation',
                computedFieldIds: STORM_CADENCE_RHYTHM_FIELD_IDS,
                deferredFieldIds: Object.freeze([]),
                timingSemanticsPreserved: true,
                pressureMixingDetected: false,
                rebuildsHazardGeneration: false
            })
        })
    });

    const NAVIGATION_WINDOW_GENERATOR_INPUT_SPEC = Object.freeze({
        moduleId: NAVIGATION_WINDOW_GENERATOR_MODULE_ID,
        phaseId: 'PHASE_2',
        rhythmSideOnly: true,
        deterministicBy: 'explicit navigation rhythm sub-seed input',
        requiredInputs: Object.freeze({
            inputBundleContractId: INPUT_BUNDLE_CONTRACT_ID,
            recordBindingContractId: RECORD_BINDING_LAYER_CONTRACT_ID,
            packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
            targetDomainContractId: NAVIGATION_RHYTHM_DOMAIN_CONTRACT_ID,
            deterministicSeedPurpose: 'rhythm',
            deterministicNamespace: 'phase2.rhythm.navigation'
        }),
        mandatoryOutputFieldIds: NAVIGATION_RHYTHM_FIELD_IDS,
        forbiddenInputs: Object.freeze([
            'PressureFieldPackage',
            'travelExposure',
            'routeReliabilityInverse',
            'movementUncertaintyPressure',
            'detourBurden',
            'mobilityPressure',
            'navigationRhythm',
            'stormCadence'
        ])
    });

    const NAVIGATION_WINDOW_GENERATOR_OUTPUT_SPEC = Object.freeze({
        moduleId: NAVIGATION_WINDOW_GENERATOR_MODULE_ID,
        packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
        targetDomainId: 'navigation',
        targetDomainContractId: NAVIGATION_RHYTHM_DOMAIN_CONTRACT_ID,
        deterministicStub: false,
        computesRhythmFields: true,
        rebuildsTraversalGeneration: false,
        outputShape: Object.freeze({
            domain: Object.freeze({
                navigationWindowReliability: null,
                blockedIntervalFrequency: null,
                safeRouteIntervalStrength: null
            }),
            metadata: Object.freeze({
                generatorId: NAVIGATION_WINDOW_GENERATOR_MODULE_ID,
                generatorVersion: NAVIGATION_WINDOW_GENERATOR_MODULE_VERSION,
                deterministicSeedUsed: null,
                deterministicNamespace: 'phase2.rhythm.navigation',
                executionMode: 'implemented_coarse_navigation_window_interpretation',
                computedFieldIds: NAVIGATION_RHYTHM_FIELD_IDS,
                deferredFieldIds: Object.freeze([]),
                timingSemanticsPreserved: true,
                pressureMixingDetected: false,
                rebuildsTraversalGeneration: false
            })
        })
    });

    const SCARCITY_CADENCE_GENERATOR_INPUT_SPEC = Object.freeze({
        moduleId: SCARCITY_CADENCE_GENERATOR_MODULE_ID,
        phaseId: 'PHASE_2',
        rhythmSideOnly: true,
        deterministicBy: 'explicit scarcity rhythm sub-seed input',
        requiredInputs: Object.freeze({
            inputBundleContractId: INPUT_BUNDLE_CONTRACT_ID,
            recordBindingContractId: RECORD_BINDING_LAYER_CONTRACT_ID,
            packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
            targetDomainContractId: SCARCITY_CADENCE_RHYTHM_DOMAIN_CONTRACT_ID,
            deterministicSeedPurpose: 'rhythm',
            deterministicNamespace: 'phase2.rhythm.scarcity'
        }),
        mandatoryOutputFieldIds: SCARCITY_CADENCE_RHYTHM_FIELD_IDS,
        forbiddenInputs: Object.freeze([
            'PressureFieldPackage',
            'foodStress',
            'foodReliabilityInverse',
            'fertilitySupportInverse',
            'scarcityBaseline',
            'supplyPressure',
            'scarcityRhythm'
        ])
    });

    const SCARCITY_CADENCE_GENERATOR_OUTPUT_SPEC = Object.freeze({
        moduleId: SCARCITY_CADENCE_GENERATOR_MODULE_ID,
        packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
        targetDomainId: 'scarcity',
        targetDomainContractId: SCARCITY_CADENCE_RHYTHM_DOMAIN_CONTRACT_ID,
        deterministicStub: false,
        computesRhythmFields: true,
        rebuildsScarcityGeneration: false,
        outputShape: Object.freeze({
            domain: Object.freeze({
                scarcityCadence: null,
                deficitPersistence: null,
                shortageRecurrence: null
            }),
            metadata: Object.freeze({
                generatorId: SCARCITY_CADENCE_GENERATOR_MODULE_ID,
                generatorVersion: SCARCITY_CADENCE_GENERATOR_MODULE_VERSION,
                deterministicSeedUsed: null,
                deterministicNamespace: 'phase2.rhythm.scarcity',
                executionMode: 'implemented_coarse_scarcity_cadence_interpretation',
                computedFieldIds: SCARCITY_CADENCE_RHYTHM_FIELD_IDS,
                deferredFieldIds: Object.freeze([]),
                timingSemanticsPreserved: true,
                pressureMixingDetected: false,
                rebuildsScarcityGeneration: false
            })
        })
    });

    const PREDICTABILITY_RUPTURE_ANALYZER_INPUT_SPEC = Object.freeze({
        moduleId: PREDICTABILITY_RUPTURE_ANALYZER_MODULE_ID,
        phaseId: 'PHASE_2',
        rhythmSideOnly: true,
        deterministicBy: 'explicit predictability rhythm sub-seed input',
        requiredInputs: Object.freeze({
            inputBundleContractId: INPUT_BUNDLE_CONTRACT_ID,
            recordBindingContractId: RECORD_BINDING_LAYER_CONTRACT_ID,
            packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
            targetDomainContractId: PREDICTABILITY_RHYTHM_DOMAIN_CONTRACT_ID,
            deterministicSeedPurpose: 'rhythm',
            deterministicNamespace: 'phase2.rhythm.predictability'
        }),
        mandatoryOutputFieldIds: PREDICTABILITY_RHYTHM_FIELD_IDS,
        forbiddenInputs: Object.freeze([
            'PressureFieldPackage',
            'survivabilityPressure',
            'mobilityPressure',
            'supplyPressure',
            'catastrophePressure',
            'predictabilityProfile',
            'recoveryTempo'
        ])
    });

    const PREDICTABILITY_RUPTURE_ANALYZER_OUTPUT_SPEC = Object.freeze({
        moduleId: PREDICTABILITY_RUPTURE_ANALYZER_MODULE_ID,
        packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
        targetDomainId: 'predictability',
        targetDomainContractId: PREDICTABILITY_RHYTHM_DOMAIN_CONTRACT_ID,
        deterministicStub: false,
        computesRhythmFields: true,
        rebuildsVolatilityGeneration: false,
        outputShape: Object.freeze({
            domain: Object.freeze({
                predictability: null,
                ruptureFrequency: null,
                cadenceIrregularity: null,
                temporalTrustworthiness: null
            }),
            metadata: Object.freeze({
                analyzerId: PREDICTABILITY_RUPTURE_ANALYZER_MODULE_ID,
                analyzerVersion: PREDICTABILITY_RUPTURE_ANALYZER_MODULE_VERSION,
                deterministicSeedUsed: null,
                deterministicNamespace: 'phase2.rhythm.predictability',
                executionMode: 'implemented_coarse_predictability_rupture_analysis',
                computedFieldIds: PREDICTABILITY_RHYTHM_FIELD_IDS,
                deferredFieldIds: Object.freeze([]),
                timingSemanticsPreserved: true,
                pressureMixingDetected: false,
                rebuildsVolatilityGeneration: false
            })
        })
    });

    const ENVIRONMENTAL_RHYTHM_SYNTHESIS_INPUT_SPEC = Object.freeze({
        moduleId: ENVIRONMENTAL_RHYTHM_SYNTHESIS_MODULE_ID,
        phaseId: 'PHASE_2',
        rhythmSideOnly: true,
        deterministicBy: 'explicit rhythm synthesis sub-seed input',
        requiredInputs: Object.freeze({
            packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
            deterministicSeedPurpose: 'rhythm',
            deterministicNamespace: 'phase2.rhythm.synthesis'
        }),
        mandatorySynthesizedFieldIds: RHYTHM_SYNTHESIZED_FIELD_IDS,
        requiredDomainLayerIds: RHYTHM_DOMAIN_IDS,
        forbiddenInputs: Object.freeze([
            'PressureFieldPackage',
            'survivabilityPressure',
            'mobilityPressure',
            'supplyPressure',
            'chokepointStress',
            'remotenessBurden',
            'ecologicalBurden',
            'catastropheSusceptibility'
        ])
    });

    const ENVIRONMENTAL_RHYTHM_SYNTHESIS_OUTPUT_SPEC = Object.freeze({
        moduleId: ENVIRONMENTAL_RHYTHM_SYNTHESIS_MODULE_ID,
        packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
        deterministicStub: false,
        computesRhythmFields: true,
        outputShape: Object.freeze({
            synthesized: Object.freeze({
                seasonalityProfile: null,
                stormRhythm: null,
                navigationRhythm: null,
                scarcityRhythm: null,
                predictabilityProfile: null,
                ruptureProfile: null,
                recoveryProfile: null
            }),
            domainLayers: Object.freeze({
                seasonality: null,
                storms: null,
                navigation: null,
                scarcity: null,
                predictability: null,
                recovery: null
            }),
            metadata: Object.freeze({
                synthesisId: ENVIRONMENTAL_RHYTHM_SYNTHESIS_MODULE_ID,
                synthesisVersion: ENVIRONMENTAL_RHYTHM_SYNTHESIS_MODULE_VERSION,
                deterministicSeedUsed: null,
                deterministicNamespace: 'phase2.rhythm.synthesis',
                executionMode: 'implemented_coarse_environmental_rhythm_synthesis',
                synthesizedFieldIds: RHYTHM_SYNTHESIZED_FIELD_IDS,
                preservedDomainLayerIds: RHYTHM_DOMAIN_IDS,
                timingSemanticsPreserved: true,
                pressureMixingDetected: false,
                flattensTimingStructure: false,
                preservesRecoveryExplicitness: true,
                rhythmFamilyContrastEnhanced: true
            })
        })
    });

    const RECOVERY_RELIEF_SYNTHESIS_INPUT_SPEC = Object.freeze({
        moduleId: RECOVERY_RELIEF_SYNTHESIS_MODULE_ID,
        phaseId: 'PHASE_2',
        rhythmSideOnly: true,
        deterministicBy: 'explicit recovery rhythm sub-seed input',
        requiredInputs: Object.freeze({
            inputBundleContractId: INPUT_BUNDLE_CONTRACT_ID,
            recordBindingContractId: RECORD_BINDING_LAYER_CONTRACT_ID,
            packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
            targetDomainContractId: RECOVERY_RHYTHM_DOMAIN_CONTRACT_ID,
            upstreamPressurePackageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
            deterministicSeedPurpose: 'rhythm',
            deterministicNamespace: 'phase2.rhythm.recovery'
        }),
        mandatoryOutputFieldIds: RECOVERY_RHYTHM_FIELD_IDS,
        forbiddenInputs: Object.freeze([
            'PressureFieldPackage',
            'survivabilityPressure',
            'mobilityPressure',
            'supplyPressure',
            'chokepointStress',
            'remotenessBurden',
            'ecologicalBurden',
            'catastropheSusceptibility',
            'recoveryProfile'
        ])
    });

    const RECOVERY_RELIEF_SYNTHESIS_OUTPUT_SPEC = Object.freeze({
        moduleId: RECOVERY_RELIEF_SYNTHESIS_MODULE_ID,
        packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
        targetDomainId: 'recovery',
        targetDomainContractId: RECOVERY_RHYTHM_DOMAIN_CONTRACT_ID,
        deterministicStub: false,
        computesRhythmFields: true,
        weakensRecovery: false,
        outputShape: Object.freeze({
            domain: Object.freeze({
                recoveryTempo: null,
                stabilizationInterval: null,
                reliefPersistence: null,
                environmentalForgiveness: null
            }),
            metadata: Object.freeze({
                synthesisId: RECOVERY_RELIEF_SYNTHESIS_MODULE_ID,
                synthesisVersion: RECOVERY_RELIEF_SYNTHESIS_MODULE_VERSION,
                deterministicSeedUsed: null,
                deterministicNamespace: 'phase2.rhythm.recovery',
                executionMode: 'implemented_coarse_recovery_relief_synthesis',
                computedFieldIds: RECOVERY_RHYTHM_FIELD_IDS,
                deferredFieldIds: Object.freeze([]),
                timingSemanticsPreserved: true,
                pressureMixingDetected: false,
                weakensRecovery: false
            })
        })
    });

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

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function normalizeString(value, fallback = '') {
        return typeof value === 'string' && value.trim()
            ? value.trim()
            : fallback;
    }

    function clamp01(value) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 0;
        }

        return Math.max(0, Math.min(1, numericValue));
    }

    function roundValue(value, precision = 6) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 0;
        }

        const multiplier = 10 ** Math.max(0, Math.trunc(precision));
        return Math.round(numericValue * multiplier) / multiplier;
    }

    function mean(values = []) {
        const numericValues = Array.isArray(values)
            ? values.map((value) => Number(value)).filter((value) => Number.isFinite(value))
            : [];

        if (!numericValues.length) {
            return 0;
        }

        return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
    }

    function uniqueStrings(values = []) {
        return Array.from(new Set(
            (Array.isArray(values) ? values : [])
                .map((value) => normalizeString(value, ''))
                .filter(Boolean)
        ));
    }

    function applyContrastCurve(value, exponent = 1, pivot = 0.5) {
        const safeValue = clamp01(value);
        const safeExponent = Number.isFinite(Number(exponent)) && Number(exponent) > 0
            ? Number(exponent)
            : 1;
        const safePivot = clamp01(pivot);

        if (safeValue === safePivot || safePivot === 0 || safePivot === 1) {
            return safeValue;
        }

        if (safeValue < safePivot) {
            const ratio = safeValue / safePivot;
            return clamp01(safePivot * (ratio ** safeExponent));
        }

        const upperSpan = 1 - safePivot;
        const ratio = (1 - safeValue) / upperSpan;
        return clamp01(1 - (upperSpan * (ratio ** safeExponent)));
    }

    function applyThresholdContrast(value, threshold, exponent) {
        const safeThreshold = clamp01(threshold);
        const safeValue = clamp01(value);
        if (safeValue <= safeThreshold) {
            return 0;
        }

        return applyContrastCurve(
            clamp01((safeValue - safeThreshold) / Math.max(0.000001, 1 - safeThreshold)),
            exponent,
            0.5
        );
    }

    function resolveBindingContextId(input = {}) {
        const recordBinding = isPlainObject(input.recordBinding) ? input.recordBinding : null;
        if (recordBinding && normalizeString(recordBinding.recordBindingContextId, '')) {
            return normalizeString(recordBinding.recordBindingContextId);
        }

        return '';
    }

    function resolveInputBundle(input = {}) {
        const inputBundle = isPlainObject(input.inputBundle) ? input.inputBundle : null;
        if (!inputBundle || !isPlainObject(inputBundle.recordCollections)) {
            throw new Error('[worldgen/phase2] RecoveryReliefSynthesis requires a valid Phase2InputBundle.');
        }

        return inputBundle;
    }

    function resolveReliefRegions(input = {}) {
        const inputBundle = resolveInputBundle(input);
        if (
            !isPlainObject(inputBundle.recordCollections.physical)
            || !Array.isArray(inputBundle.recordCollections.physical.reliefRegions)
        ) {
            throw new Error('[worldgen/phase2] RecoveryReliefSynthesis requires Phase2InputBundle.recordCollections.physical.reliefRegions.');
        }

        return inputBundle.recordCollections.physical.reliefRegions;
    }

    function resolveClimateBands(input = {}) {
        const inputBundle = resolveInputBundle(input);
        if (
            !isPlainObject(inputBundle.recordCollections.physical)
            || !Array.isArray(inputBundle.recordCollections.physical.climateBands)
        ) {
            throw new Error('[worldgen/phase2] RecoveryReliefSynthesis requires Phase2InputBundle.recordCollections.physical.climateBands.');
        }

        return inputBundle.recordCollections.physical.climateBands;
    }

    function resolveSeasonalityClimateBands(input = {}) {
        const inputBundle = resolveInputBundle(input);
        if (
            !isPlainObject(inputBundle.recordCollections.physical)
            || !Array.isArray(inputBundle.recordCollections.physical.climateBands)
        ) {
            throw new Error('[worldgen/phase2] SeasonalityInterpreter requires Phase2InputBundle.recordCollections.physical.climateBands.');
        }

        return inputBundle.recordCollections.physical.climateBands;
    }

    function resolveStormClimateBands(input = {}) {
        const inputBundle = resolveInputBundle(input);
        if (
            !isPlainObject(inputBundle.recordCollections.physical)
            || !Array.isArray(inputBundle.recordCollections.physical.climateBands)
        ) {
            throw new Error('[worldgen/phase2] StormCadenceInterpreter requires Phase2InputBundle.recordCollections.physical.climateBands.');
        }

        return inputBundle.recordCollections.physical.climateBands;
    }

    function resolveSeaRegions(input = {}) {
        const inputBundle = resolveInputBundle(input);
        if (
            !isPlainObject(inputBundle.recordCollections.physical)
            || !Array.isArray(inputBundle.recordCollections.physical.seaRegions)
        ) {
            throw new Error('[worldgen/phase2] StormCadenceInterpreter requires Phase2InputBundle.recordCollections.physical.seaRegions.');
        }

        return inputBundle.recordCollections.physical.seaRegions;
    }

    function resolveRiverBasins(input = {}) {
        const inputBundle = resolveInputBundle(input);
        if (
            !isPlainObject(inputBundle.recordCollections.physical)
            || !Array.isArray(inputBundle.recordCollections.physical.riverBasins)
        ) {
            throw new Error('[worldgen/phase2] RecoveryReliefSynthesis requires Phase2InputBundle.recordCollections.physical.riverBasins.');
        }

        return inputBundle.recordCollections.physical.riverBasins;
    }

    function resolveMacroRoutes(input = {}) {
        const inputBundle = resolveInputBundle(input);
        if (
            !isPlainObject(inputBundle.recordCollections.structural)
            || !Array.isArray(inputBundle.recordCollections.structural.macroRoutes)
        ) {
            throw new Error('[worldgen/phase2] RecoveryReliefSynthesis requires Phase2InputBundle.recordCollections.structural.macroRoutes.');
        }

        return inputBundle.recordCollections.structural.macroRoutes;
    }

    function resolveChokepoints(input = {}) {
        const inputBundle = resolveInputBundle(input);
        if (
            !isPlainObject(inputBundle.recordCollections.structural)
            || !Array.isArray(inputBundle.recordCollections.structural.chokepoints)
        ) {
            throw new Error('[worldgen/phase2] RecoveryReliefSynthesis requires Phase2InputBundle.recordCollections.structural.chokepoints.');
        }

        return inputBundle.recordCollections.structural.chokepoints;
    }

    function resolveIsolatedZones(input = {}) {
        const inputBundle = resolveInputBundle(input);
        if (
            !isPlainObject(inputBundle.recordCollections.structural)
            || !Array.isArray(inputBundle.recordCollections.structural.isolatedZones)
        ) {
            throw new Error('[worldgen/phase2] RecoveryReliefSynthesis requires Phase2InputBundle.recordCollections.structural.isolatedZones.');
        }

        return inputBundle.recordCollections.structural.isolatedZones;
    }

    function createScoreMap(scoreEntries = []) {
        return (Array.isArray(scoreEntries) ? scoreEntries : []).reduce((index, entry) => {
            const recordId = normalizeString(entry && entry.recordId, '');
            if (recordId) {
                index[recordId] = clamp01(entry.value);
            }
            return index;
        }, {});
    }

    function meanByRecordIds(scoreMap = {}, recordIds = []) {
        const values = uniqueStrings(recordIds)
            .map((recordId) => scoreMap[recordId])
            .filter((value) => Number.isFinite(value));
        return mean(values);
    }

    function inferSeasonalitySignals(climateBand = {}) {
        const seasonalityBias = clamp01(climateBand.seasonalityBias);
        const temperatureBias = clamp01(climateBand.temperatureBias);
        const humidityBias = clamp01(climateBand.humidityBias);
        const bandType = normalizeString(climateBand.bandType, '').toLowerCase();
        const seaRegionIds = uniqueStrings(climateBand.seaRegionIds);
        const continentality = clamp01(seaRegionIds.length ? Math.max(0, 0.3 - (seaRegionIds.length * 0.08)) : 0.24);
        const thermalSwingPotential = clamp01(Math.abs(temperatureBias - 0.5) * 1.3);
        const humidityCycleSupport = clamp01(1 - Math.abs(humidityBias - 0.5) * 1.1);
        const drySeasonBonus = bandType.includes('dry') ? 0.08 : 0;
        const monsoonCycleBonus = bandType.includes('monsoon') || bandType.includes('seasonal') ? 0.1 : 0;
        const maritimeSoftening = seaRegionIds.length ? 0.06 : 0;

        const seasonalityBase = clamp01(
            (seasonalityBias * 0.52)
            + (thermalSwingPotential * 0.16)
            + (continentality * 0.14)
            + drySeasonBonus
            + monsoonCycleBonus
            - maritimeSoftening
        );
        const annualSwingBase = clamp01(
            (seasonalityBias * 0.38)
            + (thermalSwingPotential * 0.28)
            + (continentality * 0.18)
            + drySeasonBonus
            - (maritimeSoftening * 0.5)
        );
        const cycleClarityBase = clamp01(
            (seasonalityBias * 0.36)
            + (humidityCycleSupport * 0.18)
            + (continentality * 0.1)
            + monsoonCycleBonus
            + drySeasonBonus
            + (seaRegionIds.length ? 0.06 : 0)
        );
        const cycleStrengthBase = clamp01(
            (seasonalityBase * 0.46)
            + (annualSwingBase * 0.34)
            + (cycleClarityBase * 0.2)
        );
        const weakCycleCompression = applyThresholdContrast(
            clamp01(1 - cycleStrengthBase),
            SEASONALITY_TIMING_POLICY.weakCycleThreshold,
            SEASONALITY_TIMING_POLICY.weakCycleExponent
        );
        const strongCycleEscalation = applyThresholdContrast(
            cycleStrengthBase,
            SEASONALITY_TIMING_POLICY.strongCycleStart,
            SEASONALITY_TIMING_POLICY.strongCycleExponent
        );
        const annualSwingReadability = applyThresholdContrast(
            annualSwingBase,
            SEASONALITY_TIMING_POLICY.annualSwingReadabilityThreshold,
            SEASONALITY_TIMING_POLICY.strongCycleExponent
        );

        const seasonalityStrength = clamp01(
            applyThresholdContrast(
                seasonalityBase,
                SEASONALITY_TIMING_POLICY.seasonalityThreshold,
                SEASONALITY_TIMING_POLICY.seasonalityExponent
            )
            * (1 - (weakCycleCompression * 0.36))
            + (strongCycleEscalation * 0.16)
        );
        const annualSwingStrength = clamp01(
            applyThresholdContrast(
                annualSwingBase,
                SEASONALITY_TIMING_POLICY.annualSwingThreshold,
                SEASONALITY_TIMING_POLICY.annualSwingExponent
            )
            * (1 - (weakCycleCompression * 0.28))
            + (strongCycleEscalation * 0.18)
            + (annualSwingReadability * 0.12)
        );
        const environmentalCycleClarity = clamp01(
            applyThresholdContrast(
                cycleClarityBase,
                SEASONALITY_TIMING_POLICY.cycleClarityThreshold,
                SEASONALITY_TIMING_POLICY.clarityExponent
            )
            * (1 - (weakCycleCompression * 0.22))
            + (strongCycleEscalation * 0.12)
        );

        return {
            seasonalityBias: roundValue(seasonalityBias),
            thermalSwingPotential: roundValue(thermalSwingPotential),
            humidityCycleSupport: roundValue(humidityCycleSupport),
            continentality: roundValue(continentality),
            cycleStrengthBase: roundValue(cycleStrengthBase),
            weakCycleCompression: roundValue(weakCycleCompression),
            strongCycleEscalation: roundValue(strongCycleEscalation),
            annualSwingReadability: roundValue(annualSwingReadability),
            seasonalityStrength: roundValue(seasonalityStrength),
            annualSwingStrength: roundValue(annualSwingStrength),
            environmentalCycleClarity: roundValue(environmentalCycleClarity)
        };
    }

    function buildSeasonalityScoreEntry(climateBand = {}, signalKey, value, signals = {}) {
        return Object.freeze({
            recordType: 'climateBands',
            recordId: normalizeString(climateBand.climateBandId, ''),
            bandType: normalizeString(climateBand.bandType, ''),
            reliefRegionIds: uniqueStrings(climateBand.reliefRegionIds),
            seaRegionIds: uniqueStrings(climateBand.seaRegionIds),
            signalKey,
            value: roundValue(value),
            sourceTruth: Object.freeze({
                temperatureBias: roundValue(clamp01(climateBand.temperatureBias)),
                humidityBias: roundValue(clamp01(climateBand.humidityBias)),
                seasonalityBias: roundValue(clamp01(climateBand.seasonalityBias))
            }),
            timingContextSnapshot: Object.freeze({
                thermalSwingPotential: signals.thermalSwingPotential || 0,
                humidityCycleSupport: signals.humidityCycleSupport || 0,
                continentality: signals.continentality || 0,
                cycleStrengthBase: signals.cycleStrengthBase || 0,
                weakCycleCompression: signals.weakCycleCompression || 0,
                strongCycleEscalation: signals.strongCycleEscalation || 0,
                annualSwingReadability: signals.annualSwingReadability || 0
            })
        });
    }

    function buildSeasonalityRhythmField(fieldId, climateBands, signalKey, description, deterministicSeed) {
        const perBandScores = climateBands.map((climateBand) => {
            const signals = inferSeasonalitySignals(climateBand);
            return buildSeasonalityScoreEntry(climateBand, signalKey, signals[signalKey], signals);
        });
        const values = perBandScores.map((entry) => entry.value);

        return Object.freeze({
            type: 'phase2ScalarField',
            fieldId,
            domainId: 'seasonality',
            ownership: 'rhythm',
            deterministic: true,
            derivationMode: 'coarse_climate_truth_timing_interpretation',
            sourceRecordType: 'climateBands',
            sourceFieldIds: Object.freeze([
                'bandType',
                'temperatureBias',
                'humidityBias',
                'seasonalityBias',
                'seaRegionIds'
            ]),
            rebuildsClimateGeneration: false,
            timingSemanticsPreserved: true,
            pressureMixingDetected: false,
            contrastPolicy: SEASONALITY_TIMING_POLICY.policyId,
            description,
            deterministicSeedUsed: deterministicSeed,
            perBandScores,
            summary: Object.freeze({
                recordCount: perBandScores.length,
                mean: roundValue(mean(values)),
                min: roundValue(values.length ? Math.min(...values) : 0),
                max: roundValue(values.length ? Math.max(...values) : 0)
            })
        });
    }

    function indexById(records = [], idField) {
        return (Array.isArray(records) ? records : []).reduce((index, record) => {
            const recordId = normalizeString(record && record[idField], '');
            if (recordId) {
                index[recordId] = record;
            }
            return index;
        }, {});
    }

    function inferStormCadenceSignals(climateBand = {}, seaRegionIndex = {}) {
        const bandType = normalizeString(climateBand.bandType, '').toLowerCase();
        const humidityBias = clamp01(climateBand.humidityBias);
        const seasonalityBias = clamp01(climateBand.seasonalityBias);
        const seaRegionIds = uniqueStrings(climateBand.seaRegionIds);
        const linkedSeaRegions = seaRegionIds
            .map((seaRegionId) => seaRegionIndex[seaRegionId])
            .filter(Boolean);

        const maritimeReach = clamp01(Math.min(1, seaRegionIds.length / 2));
        const seaStormPressure = mean(linkedSeaRegions.map((seaRegion) => clamp01(seaRegion.stormPressure)));
        const seaNavigability = mean(linkedSeaRegions.map((seaRegion) => clamp01(seaRegion.navigability)));
        const seaBasinVolatility = linkedSeaRegions.some((seaRegion) => {
            const basinType = normalizeString(seaRegion.basinType, '').toLowerCase();
            return basinType.includes('open') || basinType.includes('ocean') || basinType.includes('storm');
        }) ? 0.12 : 0;
        const monsoonPulse = bandType.includes('monsoon') ? 0.16 : 0;
        const frontalPulse = bandType.includes('seasonal') || bandType.includes('temperate') ? 0.08 : 0;
        const equatorialEvening = bandType.includes('equatorial') || bandType.includes('humid_tropical') ? 0.06 : 0;
        const aridSuppression = bandType.includes('arid') || bandType.includes('desert') ? 0.16 : 0;
        const humidityStormSupport = clamp01((humidityBias * 0.72) + (seasonalityBias * 0.14));
        const maritimeModulation = clamp01(
            applyContrastCurve(
                clamp01((maritimeReach * 0.56) + (seaStormPressure * 0.32) + ((1 - seaNavigability) * 0.12)),
                STORM_CADENCE_TIMING_POLICY.maritimeExponent,
                STORM_CADENCE_TIMING_POLICY.maritimePivot
            )
        );

        const cadenceBase = clamp01(
            (humidityStormSupport * 0.34)
            + (seasonalityBias * 0.22)
            + (maritimeModulation * 0.22)
            + monsoonPulse
            + frontalPulse
            + equatorialEvening
            + seaBasinVolatility
            - (aridSuppression * 0.55)
        );
        const clusteringBase = clamp01(
            (seasonalityBias * 0.32)
            + (maritimeModulation * 0.2)
            + (seaStormPressure * 0.18)
            + monsoonPulse
            + seaBasinVolatility
            - (seaNavigability * 0.12)
            - (aridSuppression * 0.24)
        );
        const transitionBase = clamp01(
            (seasonalityBias * 0.3)
            + (seaStormPressure * 0.24)
            + (humidityStormSupport * 0.16)
            + frontalPulse
            + (monsoonPulse * 0.7)
            + seaBasinVolatility
            - (seaNavigability * 0.08)
        );
        const burstPotential = clamp01(
            (clusteringBase * 0.44)
            + (transitionBase * 0.28)
            + (seaStormPressure * 0.18)
            + (seasonalityBias * 0.1)
        );
        const burstEscalation = applyThresholdContrast(
            burstPotential,
            STORM_CADENCE_TIMING_POLICY.burstThreshold,
            STORM_CADENCE_TIMING_POLICY.burstExponent
        );
        const cadenceRegularityBase = clamp01(
            cadenceBase
            - (clusteringBase * 0.26)
            - (transitionBase * 0.12)
            + (seaNavigability * 0.08)
        );
        const regularCadenceSupport = applyThresholdContrast(
            cadenceRegularityBase,
            STORM_CADENCE_TIMING_POLICY.regularCadenceThreshold,
            STORM_CADENCE_TIMING_POLICY.regularCadenceExponent
        );
        const clusterDominanceBase = clamp01(
            burstPotential
            - (cadenceRegularityBase * 0.52)
            + (monsoonPulse * 0.12)
            + (seaBasinVolatility * 0.1)
        );
        const clusterDominance = applyThresholdContrast(
            clusterDominanceBase,
            STORM_CADENCE_TIMING_POLICY.clusterDominanceThreshold,
            STORM_CADENCE_TIMING_POLICY.clusterDominanceExponent
        );

        const stormCadence = clamp01(
            applyThresholdContrast(
                cadenceBase,
                STORM_CADENCE_TIMING_POLICY.cadenceThreshold,
                STORM_CADENCE_TIMING_POLICY.cadenceExponent
            )
            + (burstEscalation * 0.06)
            + (regularCadenceSupport * 0.18)
            - (clusterDominance * 0.08)
        );
        const stormBurstClustering = clamp01(
            applyThresholdContrast(
                clusteringBase,
                STORM_CADENCE_TIMING_POLICY.clusteringThreshold,
                STORM_CADENCE_TIMING_POLICY.clusteringExponent
            )
            + (burstEscalation * 0.22)
            + (clusterDominance * 0.18)
            - (regularCadenceSupport * 0.1)
        );
        const calmToStormTransitionSharpness = clamp01(
            applyThresholdContrast(
                transitionBase,
                STORM_CADENCE_TIMING_POLICY.transitionThreshold,
                STORM_CADENCE_TIMING_POLICY.transitionExponent
            )
            + (burstEscalation * 0.16)
            + (clusterDominance * 0.12)
            - (regularCadenceSupport * 0.06)
        );

        return {
            maritimeReach: roundValue(maritimeReach),
            seaStormPressure: roundValue(seaStormPressure),
            seaNavigability: roundValue(seaNavigability),
            humidityStormSupport: roundValue(humidityStormSupport),
            maritimeModulation: roundValue(maritimeModulation),
            monsoonPulse: roundValue(monsoonPulse),
            frontalPulse: roundValue(frontalPulse),
            equatorialEvening: roundValue(equatorialEvening),
            seaBasinVolatility: roundValue(seaBasinVolatility),
            burstPotential: roundValue(burstPotential),
            burstEscalation: roundValue(burstEscalation),
            cadenceRegularityBase: roundValue(cadenceRegularityBase),
            regularCadenceSupport: roundValue(regularCadenceSupport),
            clusterDominanceBase: roundValue(clusterDominanceBase),
            clusterDominance: roundValue(clusterDominance),
            stormCadence: roundValue(stormCadence),
            stormBurstClustering: roundValue(stormBurstClustering),
            calmToStormTransitionSharpness: roundValue(calmToStormTransitionSharpness)
        };
    }

    function buildStormCadenceScoreEntry(climateBand = {}, signalKey, value, signals = {}) {
        return Object.freeze({
            recordType: 'climateBands',
            recordId: normalizeString(climateBand.climateBandId, ''),
            bandType: normalizeString(climateBand.bandType, ''),
            reliefRegionIds: uniqueStrings(climateBand.reliefRegionIds),
            seaRegionIds: uniqueStrings(climateBand.seaRegionIds),
            signalKey,
            value: roundValue(value),
            sourceTruth: Object.freeze({
                humidityBias: roundValue(clamp01(climateBand.humidityBias)),
                seasonalityBias: roundValue(clamp01(climateBand.seasonalityBias))
            }),
            timingContextSnapshot: Object.freeze({
                maritimeReach: signals.maritimeReach || 0,
                seaStormPressure: signals.seaStormPressure || 0,
                seaNavigability: signals.seaNavigability || 0,
                humidityStormSupport: signals.humidityStormSupport || 0,
                maritimeModulation: signals.maritimeModulation || 0,
                monsoonPulse: signals.monsoonPulse || 0,
                frontalPulse: signals.frontalPulse || 0,
                equatorialEvening: signals.equatorialEvening || 0,
                seaBasinVolatility: signals.seaBasinVolatility || 0,
                burstPotential: signals.burstPotential || 0,
                burstEscalation: signals.burstEscalation || 0,
                cadenceRegularityBase: signals.cadenceRegularityBase || 0,
                regularCadenceSupport: signals.regularCadenceSupport || 0,
                clusterDominanceBase: signals.clusterDominanceBase || 0,
                clusterDominance: signals.clusterDominance || 0
            })
        });
    }

    function buildStormCadenceRhythmField(fieldId, climateBands, seaRegionIndex, signalKey, description, deterministicSeed) {
        const perBandScores = climateBands.map((climateBand) => {
            const signals = inferStormCadenceSignals(climateBand, seaRegionIndex);
            return buildStormCadenceScoreEntry(climateBand, signalKey, signals[signalKey], signals);
        });
        const values = perBandScores.map((entry) => entry.value);

        return Object.freeze({
            type: 'phase2ScalarField',
            fieldId,
            domainId: 'storms',
            ownership: 'rhythm',
            deterministic: true,
            derivationMode: 'coarse_climate_and_sea_timing_interpretation',
            sourceRecordType: 'climateBands',
            supportRecordTypes: Object.freeze(['seaRegions']),
            sourceFieldIds: Object.freeze([
                'bandType',
                'humidityBias',
                'seasonalityBias',
                'seaRegionIds'
            ]),
            supportFieldIds: Object.freeze([
                'basinType',
                'stormPressure',
                'navigability'
            ]),
            rebuildsHazardGeneration: false,
            timingSemanticsPreserved: true,
            pressureMixingDetected: false,
            contrastPolicy: STORM_CADENCE_TIMING_POLICY.policyId,
            description,
            deterministicSeedUsed: deterministicSeed,
            perBandScores,
            summary: Object.freeze({
                recordCount: perBandScores.length,
                mean: roundValue(mean(values)),
                min: roundValue(values.length ? Math.min(...values) : 0),
                max: roundValue(values.length ? Math.max(...values) : 0)
            })
        });
    }

    function inferNavigationSignals(macroRoute = {}, context = {}) {
        const routeType = normalizeString(macroRoute.type || macroRoute.routeType, '').toLowerCase();
        const reliefRegionIds = uniqueStrings(macroRoute.reliefRegionIds);
        const seaRegionIds = uniqueStrings(macroRoute.seaRegionIds);
        const chokepointIds = uniqueStrings(macroRoute.chokepointIds);
        const climateBandIds = uniqueStrings([
            ...reliefRegionIds.flatMap((reliefRegionId) => (context.climateBandIdsByReliefRegion || {})[reliefRegionId] || []),
            ...seaRegionIds.flatMap((seaRegionId) => (context.climateBandIdsBySeaRegion || {})[seaRegionId] || [])
        ]);

        const linkedChokepoints = chokepointIds
            .map((chokepointId) => (context.chokepointIndex || {})[chokepointId])
            .filter(Boolean);

        const baseCost = clamp01(macroRoute.baseCost);
        const fragility = clamp01(macroRoute.fragility);
        const redundancy = clamp01(macroRoute.redundancy);
        const routeSpanAnchor = clamp01(Math.max(
            uniqueStrings(macroRoute.through).length / 4,
            reliefRegionIds.length / 3,
            seaRegionIds.length / 2,
            chokepointIds.length / 2
        ));
        const structureCoverage = clamp01(Math.max(
            reliefRegionIds.length / 3,
            seaRegionIds.length / 2,
            chokepointIds.length / 2
        ));
        const routeLengthFactor = clamp01(Math.max(
            uniqueStrings(macroRoute.through).length / 8,
            reliefRegionIds.length / 5,
            seaRegionIds.length / 4
        ));
        const maritimeRoute = routeType.includes('sea') || routeType.includes('naval') || seaRegionIds.length > 0;
        const chokepointDependence = clamp01(Math.min(1, chokepointIds.length / 2));
        const meanStormCadence = meanByRecordIds(context.stormScores.stormCadence, climateBandIds);
        const meanStormBurstClustering = meanByRecordIds(context.stormScores.stormBurstClustering, climateBandIds);
        const meanStormTransitionSharpness = meanByRecordIds(context.stormScores.calmToStormTransitionSharpness, climateBandIds);
        const controlValue = mean(linkedChokepoints.map((chokepoint) => clamp01(chokepoint.controlValue)));
        const bypassDifficulty = mean(linkedChokepoints.map((chokepoint) => clamp01(chokepoint.bypassDifficulty)));
        const collapseSensitivity = mean(linkedChokepoints.map((chokepoint) => clamp01(chokepoint.collapseSensitivity)));
        const tradeDependency = mean(linkedChokepoints.map((chokepoint) => clamp01(chokepoint.tradeDependency)));
        const chokepointTimingDrag = clamp01(
            (controlValue * 0.12)
            + (bypassDifficulty * 0.3)
            + (collapseSensitivity * 0.26)
            + (tradeDependency * 0.18)
            + (chokepointDependence * 0.14)
        );
        const stormTimingDrag = clamp01(
            (meanStormCadence * 0.26)
            + (meanStormBurstClustering * 0.42)
            + (meanStormTransitionSharpness * 0.32)
        );
        const routeExposureBase = clamp01(
            (baseCost * 0.22)
            + (fragility * 0.22)
            + ((1 - redundancy) * 0.2)
            + (routeLengthFactor * 0.12)
            + (maritimeRoute ? 0.08 : 0.02)
            + (chokepointDependence * 0.16)
        );
        const routeExposure = applyThresholdContrast(
            routeExposureBase,
            NAVIGATION_WINDOW_TIMING_POLICY.routeExposureThreshold,
            NAVIGATION_WINDOW_TIMING_POLICY.routeExposureExponent
        );
        const chokepointTimingDependence = applyThresholdContrast(
            chokepointTimingDrag,
            NAVIGATION_WINDOW_TIMING_POLICY.chokepointDependenceThreshold,
            NAVIGATION_WINDOW_TIMING_POLICY.chokepointDependenceExponent
        );
        const structuralAnchorBase = clamp01(
            (structureCoverage * 0.24)
            + (routeLengthFactor * 0.16)
            + (routeSpanAnchor * 0.24)
            + (redundancy * 0.12)
            + (climateBandIds.length ? 0.14 : 0)
            + (maritimeRoute && seaRegionIds.length ? 0.1 : 0)
            + (chokepointIds.length ? 0.08 : 0)
        );
        const routeCoherenceBase = clamp01(
            (structuralAnchorBase * 0.52)
            + (routeSpanAnchor * 0.14)
            + ((1 - fragility) * 0.14)
            + ((1 - routeExposure) * 0.1)
            + ((1 - chokepointTimingDependence) * 0.08)
            + ((climateBandIds.length && (reliefRegionIds.length || seaRegionIds.length)) ? 0.08 : 0)
        );
        const structuralAnchor = applyThresholdContrast(
            structuralAnchorBase,
            NAVIGATION_WINDOW_TIMING_POLICY.structuralAnchorThreshold,
            NAVIGATION_WINDOW_TIMING_POLICY.structuralAnchorExponent
        );
        const routeCoherence = applyThresholdContrast(
            routeCoherenceBase,
            NAVIGATION_WINDOW_TIMING_POLICY.routeCoherenceThreshold,
            NAVIGATION_WINDOW_TIMING_POLICY.routeCoherenceExponent
        );
        const timingArtifactSuppression = clamp01(
            1 - ((routeCoherence * 0.56) + (structuralAnchor * 0.32))
        );
        const navigationWindowBase = clamp01(
            1
            - (
                (stormTimingDrag * 0.38)
                + (routeExposure * 0.22)
                + (chokepointTimingDependence * 0.2)
                + ((1 - redundancy) * 0.12)
                + (fragility * 0.08)
            )
        );
        const blockedIntervalBase = clamp01(
            (meanStormBurstClustering * 0.3)
            + (meanStormTransitionSharpness * 0.22)
            + (chokepointTimingDependence * 0.24)
            + (routeExposure * 0.14)
            + (fragility * 0.1)
        );
        const safeIntervalBase = clamp01(
            (navigationWindowBase * 0.48)
            + (redundancy * 0.24)
            + ((1 - meanStormBurstClustering) * 0.12)
            + ((1 - chokepointTimingDependence) * 0.1)
            + ((1 - fragility) * 0.06)
        );

        const navigationWindowReliability = clamp01(
            applyThresholdContrast(
                navigationWindowBase,
                NAVIGATION_WINDOW_TIMING_POLICY.reliabilityThreshold,
                NAVIGATION_WINDOW_TIMING_POLICY.reliabilityExponent
            )
            * (1 - (timingArtifactSuppression * 0.12))
            + (routeCoherence * 0.08)
        );
        const blockedIntervalFrequency = clamp01(
            applyThresholdContrast(
                blockedIntervalBase,
                NAVIGATION_WINDOW_TIMING_POLICY.blockedThreshold,
                NAVIGATION_WINDOW_TIMING_POLICY.blockedExponent
            )
            * (1 - (timingArtifactSuppression * 0.26))
            + (chokepointTimingDependence * 0.04)
        );
        const safeRouteIntervalStrength = clamp01(
            applyThresholdContrast(
                safeIntervalBase,
                NAVIGATION_WINDOW_TIMING_POLICY.safeIntervalThreshold,
                NAVIGATION_WINDOW_TIMING_POLICY.safeIntervalExponent
            )
            * (1 - (timingArtifactSuppression * 0.1))
            + (routeCoherence * 0.1)
        );

        return {
            routeSpanAnchor: roundValue(routeSpanAnchor),
            structureCoverage: roundValue(structureCoverage),
            routeLengthFactor: roundValue(routeLengthFactor),
            routeExposure: roundValue(routeExposure),
            chokepointTimingDependence: roundValue(chokepointTimingDependence),
            structuralAnchorBase: roundValue(structuralAnchorBase),
            structuralAnchor: roundValue(structuralAnchor),
            routeCoherenceBase: roundValue(routeCoherenceBase),
            routeCoherence: roundValue(routeCoherence),
            timingArtifactSuppression: roundValue(timingArtifactSuppression),
            stormCadence: roundValue(meanStormCadence),
            stormBurstClustering: roundValue(meanStormBurstClustering),
            calmToStormTransitionSharpness: roundValue(meanStormTransitionSharpness),
            navigationWindowReliability: roundValue(navigationWindowReliability),
            blockedIntervalFrequency: roundValue(blockedIntervalFrequency),
            safeRouteIntervalStrength: roundValue(safeRouteIntervalStrength)
        };
    }

    function buildNavigationScoreEntry(macroRoute = {}, signalKey, value, signals = {}) {
        return Object.freeze({
            recordType: 'macroRoutes',
            recordId: normalizeString(macroRoute.routeId, ''),
            routeType: normalizeString(macroRoute.type || macroRoute.routeType, ''),
            fromRegion: normalizeString(macroRoute.fromRegion, ''),
            toRegion: normalizeString(macroRoute.toRegion, ''),
            reliefRegionIds: uniqueStrings(macroRoute.reliefRegionIds),
            seaRegionIds: uniqueStrings(macroRoute.seaRegionIds),
            chokepointIds: uniqueStrings(macroRoute.chokepointIds),
            signalKey,
            value: roundValue(value),
            sourceTruth: Object.freeze({
                baseCost: roundValue(clamp01(macroRoute.baseCost)),
                fragility: roundValue(clamp01(macroRoute.fragility)),
                redundancy: roundValue(clamp01(macroRoute.redundancy))
            }),
            timingContextSnapshot: Object.freeze({
                routeSpanAnchor: signals.routeSpanAnchor || 0,
                structureCoverage: signals.structureCoverage || 0,
                routeLengthFactor: signals.routeLengthFactor || 0,
                routeExposure: signals.routeExposure || 0,
                chokepointTimingDependence: signals.chokepointTimingDependence || 0,
                structuralAnchorBase: signals.structuralAnchorBase || 0,
                structuralAnchor: signals.structuralAnchor || 0,
                routeCoherenceBase: signals.routeCoherenceBase || 0,
                routeCoherence: signals.routeCoherence || 0,
                timingArtifactSuppression: signals.timingArtifactSuppression || 0,
                stormCadence: signals.stormCadence || 0,
                stormBurstClustering: signals.stormBurstClustering || 0,
                calmToStormTransitionSharpness: signals.calmToStormTransitionSharpness || 0
            })
        });
    }

    function buildNavigationRhythmField(fieldId, macroRoutes, context, signalKey, description, deterministicSeed) {
        const perRouteScores = macroRoutes.map((macroRoute) => {
            const signals = inferNavigationSignals(macroRoute, context);
            return buildNavigationScoreEntry(macroRoute, signalKey, signals[signalKey], signals);
        });
        const values = perRouteScores.map((entry) => entry.value);

        return Object.freeze({
            type: 'phase2ScalarField',
            fieldId,
            domainId: 'navigation',
            ownership: 'rhythm',
            deterministic: true,
            derivationMode: 'coarse_route_timing_from_storm_and_structural_context',
            sourceRecordType: 'macroRoutes',
            supportRecordTypes: Object.freeze(['climateBands', 'chokepoints', 'seaRegions']),
            sourceFieldIds: Object.freeze([
                'baseCost',
                'fragility',
                'redundancy',
                'reliefRegionIds',
                'seaRegionIds',
                'chokepointIds'
            ]),
            supportFieldIds: Object.freeze([
                'stormCadence',
                'stormBurstClustering',
                'calmToStormTransitionSharpness',
                'controlValue',
                'tradeDependency',
                'bypassDifficulty',
                'collapseSensitivity'
            ]),
            rebuildsTraversalGeneration: false,
            timingSemanticsPreserved: true,
            pressureMixingDetected: false,
            contrastPolicy: NAVIGATION_WINDOW_TIMING_POLICY.policyId,
            description,
            deterministicSeedUsed: deterministicSeed,
            perRouteScores,
            summary: Object.freeze({
                recordCount: perRouteScores.length,
                mean: roundValue(mean(values)),
                min: roundValue(values.length ? Math.min(...values) : 0),
                max: roundValue(values.length ? Math.max(...values) : 0)
            })
        });
    }

    function inferScarcityCadenceSignals(climateBand = {}, context = {}) {
        const climateBandId = normalizeString(climateBand.climateBandId, '');
        const reliefRegionIds = uniqueStrings(climateBand.reliefRegionIds);
        const riverBasinIds = uniqueStrings(reliefRegionIds.flatMap((reliefRegionId) => {
            const basinIds = (context.riverBasinIdsByReliefRegion || {})[reliefRegionId];
            return Array.isArray(basinIds) ? basinIds : [];
        }));

        const seasonalityStrength = clamp01((context.seasonalityScores.seasonalityStrength || {})[climateBandId] || 0);
        const annualSwingStrength = clamp01((context.seasonalityScores.annualSwingStrength || {})[climateBandId] || 0);
        const environmentalCycleClarity = clamp01((context.seasonalityScores.environmentalCycleClarity || {})[climateBandId] || 0);
        const waterReliabilityInverse = meanByRecordIds(context.hydrologyScores.waterReliabilityInverse, riverBasinIds);
        const waterStress = meanByRecordIds(context.hydrologyScores.waterStress, riverBasinIds);
        const droughtPressure = meanByRecordIds(context.hydrologyScores.droughtPressure, riverBasinIds);

        const supportBurdenBase = clamp01(
            (waterReliabilityInverse * 0.34)
            + (waterStress * 0.38)
            + (droughtPressure * 0.28)
        );
        const supportBurden = applyThresholdContrast(
            supportBurdenBase,
            SCARCITY_CADENCE_TIMING_POLICY.supportBurdenThreshold,
            SCARCITY_CADENCE_TIMING_POLICY.supportBurdenExponent
        );
        const scarcityCadenceBase = clamp01(
            (supportBurden * 0.34)
            + (seasonalityStrength * 0.28)
            + (annualSwingStrength * 0.22)
            + (environmentalCycleClarity * 0.16)
        );
        const deficitPersistenceBase = clamp01(
            (supportBurden * 0.44)
            + (droughtPressure * 0.18)
            + (waterStress * 0.16)
            + ((1 - environmentalCycleClarity) * 0.14)
            + (annualSwingStrength * 0.08)
        );
        const shortageRecurrenceBase = clamp01(
            (supportBurden * 0.26)
            + (seasonalityStrength * 0.24)
            + (annualSwingStrength * 0.18)
            + (environmentalCycleClarity * 0.2)
            + (droughtPressure * 0.12)
        );
        const reliefWindowPotential = clamp01(
            (environmentalCycleClarity * 0.34)
            + ((1 - supportBurden) * 0.28)
            + ((1 - droughtPressure) * 0.18)
            + (annualSwingStrength * 0.12)
            + ((1 - waterStress) * 0.08)
        );
        const reliefWindowStrength = applyThresholdContrast(
            reliefWindowPotential,
            SCARCITY_CADENCE_TIMING_POLICY.reliefWindowThreshold,
            SCARCITY_CADENCE_TIMING_POLICY.reliefWindowExponent
        );
        const alternationBase = clamp01(
            (seasonalityStrength * 0.28)
            + (annualSwingStrength * 0.24)
            + (environmentalCycleClarity * 0.2)
            + (supportBurden * 0.16)
            + (reliefWindowStrength * 0.12)
        );
        const shortageReliefAlternation = applyThresholdContrast(
            alternationBase,
            SCARCITY_CADENCE_TIMING_POLICY.alternationThreshold,
            SCARCITY_CADENCE_TIMING_POLICY.alternationExponent
        );

        const scarcityCadence = clamp01(
            applyThresholdContrast(
                scarcityCadenceBase,
                SCARCITY_CADENCE_TIMING_POLICY.cadenceThreshold,
                SCARCITY_CADENCE_TIMING_POLICY.cadenceExponent
            )
            + (shortageReliefAlternation * 0.14)
        );
        const deficitPersistence = clamp01(
            applyThresholdContrast(
                deficitPersistenceBase,
                SCARCITY_CADENCE_TIMING_POLICY.persistenceThreshold,
                SCARCITY_CADENCE_TIMING_POLICY.persistenceExponent
            )
            * (1 - (reliefWindowStrength * 0.16))
        );
        const shortageRecurrence = clamp01(
            applyThresholdContrast(
                shortageRecurrenceBase,
                SCARCITY_CADENCE_TIMING_POLICY.recurrenceThreshold,
                SCARCITY_CADENCE_TIMING_POLICY.recurrenceExponent
            )
            + (shortageReliefAlternation * 0.12)
        );

        return {
            supportBurden: roundValue(supportBurden),
            seasonalityStrength: roundValue(seasonalityStrength),
            annualSwingStrength: roundValue(annualSwingStrength),
            environmentalCycleClarity: roundValue(environmentalCycleClarity),
            waterReliabilityInverse: roundValue(waterReliabilityInverse),
            waterStress: roundValue(waterStress),
            droughtPressure: roundValue(droughtPressure),
            reliefWindowPotential: roundValue(reliefWindowPotential),
            reliefWindowStrength: roundValue(reliefWindowStrength),
            alternationBase: roundValue(alternationBase),
            shortageReliefAlternation: roundValue(shortageReliefAlternation),
            scarcityCadence: roundValue(scarcityCadence),
            deficitPersistence: roundValue(deficitPersistence),
            shortageRecurrence: roundValue(shortageRecurrence)
        };
    }

    function buildScarcityCadenceScoreEntry(climateBand = {}, signalKey, value, signals = {}) {
        return Object.freeze({
            recordType: 'climateBands',
            recordId: normalizeString(climateBand.climateBandId, ''),
            bandType: normalizeString(climateBand.bandType, ''),
            reliefRegionIds: uniqueStrings(climateBand.reliefRegionIds),
            seaRegionIds: uniqueStrings(climateBand.seaRegionIds),
            signalKey,
            value: roundValue(value),
            sourceTruth: Object.freeze({
                temperatureBias: roundValue(clamp01(climateBand.temperatureBias)),
                humidityBias: roundValue(clamp01(climateBand.humidityBias)),
                seasonalityBias: roundValue(clamp01(climateBand.seasonalityBias))
            }),
            timingContextSnapshot: Object.freeze({
                supportBurden: signals.supportBurden || 0,
                seasonalityStrength: signals.seasonalityStrength || 0,
                annualSwingStrength: signals.annualSwingStrength || 0,
                environmentalCycleClarity: signals.environmentalCycleClarity || 0,
                waterReliabilityInverse: signals.waterReliabilityInverse || 0,
                waterStress: signals.waterStress || 0,
                droughtPressure: signals.droughtPressure || 0,
                reliefWindowPotential: signals.reliefWindowPotential || 0,
                reliefWindowStrength: signals.reliefWindowStrength || 0,
                alternationBase: signals.alternationBase || 0,
                shortageReliefAlternation: signals.shortageReliefAlternation || 0
            })
        });
    }

    function buildScarcityCadenceRhythmField(fieldId, climateBands, context, signalKey, description, deterministicSeed) {
        const perBandScores = climateBands.map((climateBand) => {
            const signals = inferScarcityCadenceSignals(climateBand, context);
            return buildScarcityCadenceScoreEntry(climateBand, signalKey, signals[signalKey], signals);
        });
        const values = perBandScores.map((entry) => entry.value);

        return Object.freeze({
            type: 'phase2ScalarField',
            fieldId,
            domainId: 'scarcity',
            ownership: 'rhythm',
            deterministic: true,
            derivationMode: 'coarse_support_burden_and_seasonality_timing_interpretation',
            sourceRecordType: 'climateBands',
            supportRecordTypes: Object.freeze(['riverBasins']),
            sourceFieldIds: Object.freeze([
                'seasonalityBias',
                'reliefRegionIds',
                'climateBandId'
            ]),
            supportFieldIds: Object.freeze([
                'seasonalityStrength',
                'annualSwingStrength',
                'environmentalCycleClarity',
                'waterReliabilityInverse',
                'waterStress',
                'droughtPressure'
            ]),
            rebuildsScarcityGeneration: false,
            timingSemanticsPreserved: true,
            pressureMixingDetected: false,
            contrastPolicy: SCARCITY_CADENCE_TIMING_POLICY.policyId,
            description,
            deterministicSeedUsed: deterministicSeed,
            perBandScores,
            summary: Object.freeze({
                recordCount: perBandScores.length,
                mean: roundValue(mean(values)),
                min: roundValue(values.length ? Math.min(...values) : 0),
                max: roundValue(values.length ? Math.max(...values) : 0)
            })
        });
    }

    function inferPredictabilitySignals(climateBand = {}, context = {}) {
        const climateBandId = normalizeString(climateBand.climateBandId, '');
        const reliefRegionIds = uniqueStrings(climateBand.reliefRegionIds);
        const routeIds = uniqueStrings(reliefRegionIds.flatMap((reliefRegionId) => {
            const ids = (context.routeIdsByReliefRegion || {})[reliefRegionId];
            return Array.isArray(ids) ? ids : [];
        }));

        const seasonalityStrength = clamp01((context.seasonalityScores.seasonalityStrength || {})[climateBandId] || 0);
        const annualSwingStrength = clamp01((context.seasonalityScores.annualSwingStrength || {})[climateBandId] || 0);
        const environmentalCycleClarity = clamp01((context.seasonalityScores.environmentalCycleClarity || {})[climateBandId] || 0);
        const stormCadence = clamp01((context.stormScores.stormCadence || {})[climateBandId] || 0);
        const stormBurstClustering = clamp01((context.stormScores.stormBurstClustering || {})[climateBandId] || 0);
        const calmToStormTransitionSharpness = clamp01((context.stormScores.calmToStormTransitionSharpness || {})[climateBandId] || 0);
        const scarcityCadence = clamp01((context.scarcityScores.scarcityCadence || {})[climateBandId] || 0);
        const deficitPersistence = clamp01((context.scarcityScores.deficitPersistence || {})[climateBandId] || 0);
        const shortageRecurrence = clamp01((context.scarcityScores.shortageRecurrence || {})[climateBandId] || 0);
        const navigationWindowReliability = meanByRecordIds(context.navigationScores.navigationWindowReliability, routeIds);
        const blockedIntervalFrequency = meanByRecordIds(context.navigationScores.blockedIntervalFrequency, routeIds);
        const safeRouteIntervalStrength = meanByRecordIds(context.navigationScores.safeRouteIntervalStrength, routeIds);

        const cadenceStability = clamp01(
            (environmentalCycleClarity * 0.34)
            + ((1 - stormBurstClustering) * 0.2)
            + ((1 - calmToStormTransitionSharpness) * 0.16)
            + ((1 - blockedIntervalFrequency) * 0.14)
            + (safeRouteIntervalStrength * 0.16)
        );
        const cadenceDisruption = clamp01(
            (stormBurstClustering * 0.28)
            + (calmToStormTransitionSharpness * 0.24)
            + (blockedIntervalFrequency * 0.18)
            + (deficitPersistence * 0.14)
            + (shortageRecurrence * 0.16)
        );
        const cadenceIrregularityBase = clamp01(
            (1 - environmentalCycleClarity) * 0.22
            + (stormBurstClustering * 0.2)
            + (calmToStormTransitionSharpness * 0.16)
            + (blockedIntervalFrequency * 0.14)
            + Math.abs(seasonalityStrength - scarcityCadence) * 0.14
            + Math.abs(annualSwingStrength - navigationWindowReliability) * 0.14
        );
        const temporalTrustBase = clamp01(
            (cadenceStability * 0.38)
            + (navigationWindowReliability * 0.2)
            + (safeRouteIntervalStrength * 0.16)
            + ((1 - deficitPersistence) * 0.14)
            + ((1 - cadenceDisruption) * 0.12)
        );
        const predictabilityBase = clamp01(
            (cadenceStability * 0.34)
            + (temporalTrustBase * 0.28)
            + (environmentalCycleClarity * 0.18)
            + ((1 - cadenceIrregularityBase) * 0.12)
            + ((1 - cadenceDisruption) * 0.08)
        );
        const ruptureFrequencyBase = clamp01(
            (cadenceDisruption * 0.34)
            + (cadenceIrregularityBase * 0.26)
            + (stormCadence * 0.1)
            + (blockedIntervalFrequency * 0.12)
            + (shortageRecurrence * 0.1)
            + ((1 - temporalTrustBase) * 0.08)
        );
        const planningSignalBase = clamp01(
            (predictabilityBase * 0.34)
            + (temporalTrustBase * 0.26)
            + (cadenceStability * 0.18)
            + ((1 - cadenceIrregularityBase) * 0.12)
            + ((1 - ruptureFrequencyBase) * 0.1)
        );
        const ruptureSignalBase = clamp01(
            (ruptureFrequencyBase * 0.38)
            + (cadenceDisruption * 0.22)
            + (cadenceIrregularityBase * 0.16)
            + ((1 - temporalTrustBase) * 0.14)
            + (blockedIntervalFrequency * 0.1)
        );
        const planningSignal = applyThresholdContrast(
            planningSignalBase,
            PREDICTABILITY_RHYTHM_TIMING_POLICY.planningSignalThreshold,
            PREDICTABILITY_RHYTHM_TIMING_POLICY.planningSignalExponent
        );
        const ruptureSignal = applyThresholdContrast(
            ruptureSignalBase,
            PREDICTABILITY_RHYTHM_TIMING_POLICY.ruptureSignalThreshold,
            PREDICTABILITY_RHYTHM_TIMING_POLICY.ruptureSignalExponent
        );

        const predictability = clamp01(
            applyThresholdContrast(
                predictabilityBase,
                PREDICTABILITY_RHYTHM_TIMING_POLICY.predictabilityThreshold,
                PREDICTABILITY_RHYTHM_TIMING_POLICY.predictabilityExponent
            )
            + (planningSignal * 0.14)
            - (ruptureSignal * 0.08)
        );
        const ruptureFrequency = clamp01(
            applyThresholdContrast(
                ruptureFrequencyBase,
                PREDICTABILITY_RHYTHM_TIMING_POLICY.ruptureThreshold,
                PREDICTABILITY_RHYTHM_TIMING_POLICY.ruptureExponent
            )
            + (ruptureSignal * 0.16)
            - (planningSignal * 0.06)
        );
        const cadenceIrregularity = clamp01(
            applyThresholdContrast(
                cadenceIrregularityBase,
                PREDICTABILITY_RHYTHM_TIMING_POLICY.irregularityThreshold,
                PREDICTABILITY_RHYTHM_TIMING_POLICY.irregularityExponent
            )
            + (ruptureSignal * 0.08)
        );
        const temporalTrustworthiness = clamp01(
            applyThresholdContrast(
                temporalTrustBase,
                PREDICTABILITY_RHYTHM_TIMING_POLICY.trustThreshold,
                PREDICTABILITY_RHYTHM_TIMING_POLICY.trustExponent
            )
            + (planningSignal * 0.12)
            - (ruptureSignal * 0.08)
        );

        return {
            seasonalityStrength: roundValue(seasonalityStrength),
            annualSwingStrength: roundValue(annualSwingStrength),
            environmentalCycleClarity: roundValue(environmentalCycleClarity),
            stormCadence: roundValue(stormCadence),
            stormBurstClustering: roundValue(stormBurstClustering),
            calmToStormTransitionSharpness: roundValue(calmToStormTransitionSharpness),
            scarcityCadence: roundValue(scarcityCadence),
            deficitPersistence: roundValue(deficitPersistence),
            shortageRecurrence: roundValue(shortageRecurrence),
            navigationWindowReliability: roundValue(navigationWindowReliability),
            blockedIntervalFrequency: roundValue(blockedIntervalFrequency),
            safeRouteIntervalStrength: roundValue(safeRouteIntervalStrength),
            cadenceStability: roundValue(cadenceStability),
            cadenceDisruption: roundValue(cadenceDisruption),
            planningSignalBase: roundValue(planningSignalBase),
            planningSignal: roundValue(planningSignal),
            ruptureSignalBase: roundValue(ruptureSignalBase),
            ruptureSignal: roundValue(ruptureSignal),
            predictability: roundValue(predictability),
            ruptureFrequency: roundValue(ruptureFrequency),
            cadenceIrregularity: roundValue(cadenceIrregularity),
            temporalTrustworthiness: roundValue(temporalTrustworthiness)
        };
    }

    function buildPredictabilityScoreEntry(climateBand = {}, signalKey, value, signals = {}) {
        return Object.freeze({
            recordType: 'climateBands',
            recordId: normalizeString(climateBand.climateBandId, ''),
            bandType: normalizeString(climateBand.bandType, ''),
            reliefRegionIds: uniqueStrings(climateBand.reliefRegionIds),
            seaRegionIds: uniqueStrings(climateBand.seaRegionIds),
            signalKey,
            value: roundValue(value),
            sourceTruth: Object.freeze({
                seasonalityBias: roundValue(clamp01(climateBand.seasonalityBias)),
                humidityBias: roundValue(clamp01(climateBand.humidityBias)),
                temperatureBias: roundValue(clamp01(climateBand.temperatureBias))
            }),
            timingContextSnapshot: Object.freeze({
                seasonalityStrength: signals.seasonalityStrength || 0,
                annualSwingStrength: signals.annualSwingStrength || 0,
                environmentalCycleClarity: signals.environmentalCycleClarity || 0,
                stormCadence: signals.stormCadence || 0,
                stormBurstClustering: signals.stormBurstClustering || 0,
                calmToStormTransitionSharpness: signals.calmToStormTransitionSharpness || 0,
                scarcityCadence: signals.scarcityCadence || 0,
                deficitPersistence: signals.deficitPersistence || 0,
                shortageRecurrence: signals.shortageRecurrence || 0,
                navigationWindowReliability: signals.navigationWindowReliability || 0,
                blockedIntervalFrequency: signals.blockedIntervalFrequency || 0,
                safeRouteIntervalStrength: signals.safeRouteIntervalStrength || 0,
                cadenceStability: signals.cadenceStability || 0,
                cadenceDisruption: signals.cadenceDisruption || 0,
                planningSignalBase: signals.planningSignalBase || 0,
                planningSignal: signals.planningSignal || 0,
                ruptureSignalBase: signals.ruptureSignalBase || 0,
                ruptureSignal: signals.ruptureSignal || 0
            })
        });
    }

    function buildPredictabilityRhythmField(fieldId, climateBands, context, signalKey, description, deterministicSeed) {
        const perBandScores = climateBands.map((climateBand) => {
            const signals = inferPredictabilitySignals(climateBand, context);
            return buildPredictabilityScoreEntry(climateBand, signalKey, signals[signalKey], signals);
        });
        const values = perBandScores.map((entry) => entry.value);

        return Object.freeze({
            type: 'phase2ScalarField',
            fieldId,
            domainId: 'predictability',
            ownership: 'rhythm',
            deterministic: true,
            derivationMode: 'coarse_predictability_from_cadence_layers',
            sourceRecordType: 'climateBands',
            supportRecordTypes: Object.freeze(['macroRoutes']),
            sourceFieldIds: Object.freeze([
                'climateBandId',
                'reliefRegionIds',
                'seasonalityBias'
            ]),
            supportFieldIds: Object.freeze([
                'seasonalityStrength',
                'annualSwingStrength',
                'environmentalCycleClarity',
                'stormCadence',
                'stormBurstClustering',
                'calmToStormTransitionSharpness',
                'navigationWindowReliability',
                'blockedIntervalFrequency',
                'safeRouteIntervalStrength',
                'scarcityCadence',
                'deficitPersistence',
                'shortageRecurrence'
            ]),
            rebuildsVolatilityGeneration: false,
            timingSemanticsPreserved: true,
            pressureMixingDetected: false,
            contrastPolicy: PREDICTABILITY_RHYTHM_TIMING_POLICY.policyId,
            description,
            deterministicSeedUsed: deterministicSeed,
            perBandScores,
            summary: Object.freeze({
                recordCount: perBandScores.length,
                mean: roundValue(mean(values)),
                min: roundValue(values.length ? Math.min(...values) : 0),
                max: roundValue(values.length ? Math.max(...values) : 0)
            })
        });
    }

    function buildRhythmDomainLayers(input, deterministicSeed) {
        if (isPlainObject(input.rhythmDomainLayers)) {
            return Object.freeze(RHYTHM_DOMAIN_IDS.reduce((layers, domainId) => {
                layers[domainId] = cloneValue(input.rhythmDomainLayers[domainId] || {});
                return layers;
            }, {}));
        }

        return Object.freeze({
            seasonality: createSeasonalityInterpreter({ deterministicSeed }).run(input).domain,
            storms: createStormCadenceInterpreter({ deterministicSeed }).run(input).domain,
            navigation: createNavigationWindowGenerator({ deterministicSeed }).run(input).domain,
            scarcity: createScarcityCadenceGenerator({ deterministicSeed }).run(input).domain,
            predictability: createPredictabilityRuptureAnalyzer({ deterministicSeed }).run(input).domain,
            recovery: createRecoveryReliefSynthesis({ deterministicSeed }).run(input).domain
        });
    }

    function getRhythmFieldMean(domainLayers, domainId, fieldId) {
        const domain = isPlainObject(domainLayers[domainId]) ? domainLayers[domainId] : {};
        const field = isPlainObject(domain[fieldId]) ? domain[fieldId] : null;
        if (!field) {
            return 0;
        }

        if (isPlainObject(field.summary) && Number.isFinite(Number(field.summary.mean))) {
            return clamp01(field.summary.mean);
        }

        const candidateCollections = [
            field.perBandScores,
            field.perRouteScores,
            field.perReliefScores,
            field.perBasinScores,
            field.perChokepointScores,
            field.perZoneScores
        ];
        const firstCollection = candidateCollections.find((collection) => Array.isArray(collection));
        if (!firstCollection) {
            return 0;
        }

        return clamp01(mean(firstCollection.map((entry) => entry && entry.value)));
    }

    function buildEnvironmentalRhythmSynthesisAxis(fieldId, domainLayers, componentWeights, description, deterministicSeed) {
        const components = Object.entries(componentWeights).map(([componentId, component]) => {
            const value = getRhythmFieldMean(domainLayers, component.domainId, component.fieldId);
            return Object.freeze({
                componentId,
                domainId: component.domainId,
                fieldId: component.fieldId,
                weight: roundValue(component.weight),
                value: roundValue(value),
                weightedValue: roundValue(value * component.weight)
            });
        });
        const totalWeight = components.reduce((sum, component) => sum + component.weight, 0);
        const synthesizedValue = totalWeight > 0
            ? components.reduce((sum, component) => sum + component.weightedValue, 0) / totalWeight
            : 0;
        const componentValues = components.map((component) => component.value);
        const componentSpread = componentValues.length
            ? Math.max(...componentValues) - Math.min(...componentValues)
            : 0;
        const dominantComponent = components.reduce((strongest, component) => {
            if (!strongest || component.weightedValue > strongest.weightedValue) {
                return component;
            }
            return strongest;
        }, null);
        const weightedTotal = components.reduce((sum, component) => sum + component.weightedValue, 0);
        const dominantContribution = weightedTotal > 0 && dominantComponent
            ? dominantComponent.weightedValue / weightedTotal
            : 0;

        return Object.freeze({
            type: 'phase2ScalarField',
            fieldId,
            ownership: 'rhythm',
            synthesized: true,
            deterministic: true,
            derivationMode: 'coarse_environmental_rhythm_synthesis',
            flattensTimingStructure: false,
            preservesRecoveryExplicitness: fieldId === 'recoveryProfile',
            timingSemanticsPreserved: true,
            pressureMixingDetected: false,
            contrastPolicy: RHYTHM_SYNTHESIS_TIMING_POLICY.policyId,
            description,
            deterministicSeedUsed: deterministicSeed,
            components,
            summary: Object.freeze({
                mean: roundValue(synthesizedValue),
                componentCount: components.length,
                componentSpread: roundValue(componentSpread),
                dominantContribution: roundValue(dominantContribution),
                dominantComponentId: dominantComponent ? dominantComponent.componentId : '',
                dominantDomainId: dominantComponent ? dominantComponent.domainId : ''
            })
        });
    }

    function calibrateEnvironmentalRhythmSynthesizedProfiles(baseSynthesized) {
        const synthesizedIds = RHYTHM_SYNTHESIZED_FIELD_IDS.filter((fieldId) => baseSynthesized[fieldId]);
        const baseMeans = synthesizedIds.map((fieldId) => baseSynthesized[fieldId].summary.mean);
        const familyMean = mean(baseMeans);
        const familySpread = baseMeans.length
            ? Math.max(...baseMeans) - Math.min(...baseMeans)
            : 0;

        return Object.freeze(synthesizedIds.reduce((calibrated, fieldId) => {
            const field = baseSynthesized[fieldId];
            const baseMean = field.summary.mean;
            const deviationFromFamilyMean = baseMean - familyMean;
            const componentSpreadSignal = applyThresholdContrast(
                field.summary.componentSpread,
                RHYTHM_SYNTHESIS_TIMING_POLICY.spreadThreshold,
                RHYTHM_SYNTHESIS_TIMING_POLICY.spreadExponent
            );
            const dominantContributionSignal = applyThresholdContrast(
                field.summary.dominantContribution,
                RHYTHM_SYNTHESIS_TIMING_POLICY.dominantContributionThreshold,
                RHYTHM_SYNTHESIS_TIMING_POLICY.dominantContributionExponent
            );
            const readabilityDelta = (
                deviationFromFamilyMean * RHYTHM_SYNTHESIS_TIMING_POLICY.familyDeviationWeight
            ) + (
                componentSpreadSignal * RHYTHM_SYNTHESIS_TIMING_POLICY.componentSpreadWeight
            ) + (
                dominantContributionSignal * RHYTHM_SYNTHESIS_TIMING_POLICY.dominantContributionWeight
            );
            const calibratedMeanCandidate = clamp01(baseMean + readabilityDelta);
            const calibratedMean = fieldId === 'recoveryProfile'
                ? Math.max(baseMean, calibratedMeanCandidate)
                : calibratedMeanCandidate;

            calibrated[fieldId] = Object.freeze({
                ...field,
                summary: Object.freeze({
                    ...field.summary,
                    mean: roundValue(calibratedMean),
                    baseMean: roundValue(baseMean),
                    familyMean: roundValue(familyMean),
                    familySpread: roundValue(familySpread),
                    deviationFromFamilyMean: roundValue(deviationFromFamilyMean),
                    componentSpreadSignal: roundValue(componentSpreadSignal),
                    dominantContributionSignal: roundValue(dominantContributionSignal),
                    readabilityDelta: roundValue(calibratedMean - baseMean)
                })
            });
            return calibrated;
        }, {}));
    }

    function buildEnvironmentalRhythmSynthesized(domainLayers, deterministicSeed) {
        const baseSynthesized = Object.freeze({
            seasonalityProfile: buildEnvironmentalRhythmSynthesisAxis(
                'seasonalityProfile',
                domainLayers,
                {
                    seasonalityStrength: { domainId: 'seasonality', fieldId: 'seasonalityStrength', weight: 0.36 },
                    annualSwingStrength: { domainId: 'seasonality', fieldId: 'annualSwingStrength', weight: 0.32 },
                    environmentalCycleClarity: { domainId: 'seasonality', fieldId: 'environmentalCycleClarity', weight: 0.32 }
                },
                'Synthesized profile of seasonality timing while preserving domain structure.',
                deterministicSeed
            ),
            stormRhythm: buildEnvironmentalRhythmSynthesisAxis(
                'stormRhythm',
                domainLayers,
                {
                    stormCadence: { domainId: 'storms', fieldId: 'stormCadence', weight: 0.34 },
                    stormBurstClustering: { domainId: 'storms', fieldId: 'stormBurstClustering', weight: 0.34 },
                    calmToStormTransitionSharpness: { domainId: 'storms', fieldId: 'calmToStormTransitionSharpness', weight: 0.32 }
                },
                'Synthesized storm rhythm while preserving cadence, burst, and transition meaning.',
                deterministicSeed
            ),
            navigationRhythm: buildEnvironmentalRhythmSynthesisAxis(
                'navigationRhythm',
                domainLayers,
                {
                    navigationWindowReliability: { domainId: 'navigation', fieldId: 'navigationWindowReliability', weight: 0.34 },
                    blockedIntervalFrequency: { domainId: 'navigation', fieldId: 'blockedIntervalFrequency', weight: 0.28 },
                    safeRouteIntervalStrength: { domainId: 'navigation', fieldId: 'safeRouteIntervalStrength', weight: 0.38 }
                },
                'Synthesized navigation rhythm while preserving timing windows, closures, and safe intervals.',
                deterministicSeed
            ),
            scarcityRhythm: buildEnvironmentalRhythmSynthesisAxis(
                'scarcityRhythm',
                domainLayers,
                {
                    scarcityCadence: { domainId: 'scarcity', fieldId: 'scarcityCadence', weight: 0.38 },
                    deficitPersistence: { domainId: 'scarcity', fieldId: 'deficitPersistence', weight: 0.28 },
                    shortageRecurrence: { domainId: 'scarcity', fieldId: 'shortageRecurrence', weight: 0.34 }
                },
                'Synthesized scarcity rhythm while preserving cadence, persistence, and recurrence meaning.',
                deterministicSeed
            ),
            predictabilityProfile: buildEnvironmentalRhythmSynthesisAxis(
                'predictabilityProfile',
                domainLayers,
                {
                    predictability: { domainId: 'predictability', fieldId: 'predictability', weight: 0.36 },
                    temporalTrustworthiness: { domainId: 'predictability', fieldId: 'temporalTrustworthiness', weight: 0.32 },
                    cadenceIrregularity: { domainId: 'predictability', fieldId: 'cadenceIrregularity', weight: 0.16 },
                    ruptureFrequency: { domainId: 'predictability', fieldId: 'ruptureFrequency', weight: 0.16 }
                },
                'Synthesized predictability profile while preserving explicit trust and cadence-readability meaning.',
                deterministicSeed
            ),
            ruptureProfile: buildEnvironmentalRhythmSynthesisAxis(
                'ruptureProfile',
                domainLayers,
                {
                    ruptureFrequency: { domainId: 'predictability', fieldId: 'ruptureFrequency', weight: 0.42 },
                    cadenceIrregularity: { domainId: 'predictability', fieldId: 'cadenceIrregularity', weight: 0.34 },
                    stormBurstClustering: { domainId: 'storms', fieldId: 'stormBurstClustering', weight: 0.14 },
                    shortageRecurrence: { domainId: 'scarcity', fieldId: 'shortageRecurrence', weight: 0.1 }
                },
                'Synthesized rupture profile while preserving cadence-break and disruption meaning.',
                deterministicSeed
            ),
            recoveryProfile: buildEnvironmentalRhythmSynthesisAxis(
                'recoveryProfile',
                domainLayers,
                {
                    recoveryTempo: { domainId: 'recovery', fieldId: 'recoveryTempo', weight: 0.3 },
                    stabilizationInterval: { domainId: 'recovery', fieldId: 'stabilizationInterval', weight: 0.24 },
                    reliefPersistence: { domainId: 'recovery', fieldId: 'reliefPersistence', weight: 0.24 },
                    environmentalForgiveness: { domainId: 'recovery', fieldId: 'environmentalForgiveness', weight: 0.22 }
                },
                'Synthesized recovery profile while keeping recovery explicit and domain-preserved.',
                deterministicSeed
            )
        });
        return calibrateEnvironmentalRhythmSynthesizedProfiles(baseSynthesized);
    }

    function buildClimateBandIdsByReliefRegion(climateBands = []) {
        return climateBands.reduce((index, climateBand) => {
            const climateBandId = normalizeString(climateBand.climateBandId, '');
            uniqueStrings(climateBand.reliefRegionIds).forEach((reliefRegionId) => {
                if (!index[reliefRegionId]) {
                    index[reliefRegionId] = [];
                }
                if (climateBandId) {
                    index[reliefRegionId].push(climateBandId);
                }
            });
            return index;
        }, {});
    }

    function buildClimateBandIdsBySeaRegion(climateBands = []) {
        return climateBands.reduce((index, climateBand) => {
            const climateBandId = normalizeString(climateBand.climateBandId, '');
            uniqueStrings(climateBand.seaRegionIds).forEach((seaRegionId) => {
                if (!index[seaRegionId]) {
                    index[seaRegionId] = [];
                }
                if (climateBandId) {
                    index[seaRegionId].push(climateBandId);
                }
            });
            return index;
        }, {});
    }

    function buildRiverBasinIdsByReliefRegion(riverBasins = []) {
        return riverBasins.reduce((index, riverBasin) => {
            const riverBasinId = normalizeString(riverBasin.riverBasinId, '');
            uniqueStrings(riverBasin.reliefRegionIds).forEach((reliefRegionId) => {
                if (!index[reliefRegionId]) {
                    index[reliefRegionId] = [];
                }
                if (riverBasinId) {
                    index[reliefRegionId].push(riverBasinId);
                }
            });
            return index;
        }, {});
    }

    function buildRouteIdsByReliefRegion(macroRoutes = []) {
        return macroRoutes.reduce((index, macroRoute) => {
            const routeId = normalizeString(macroRoute.routeId, '');
            uniqueStrings(macroRoute.reliefRegionIds).forEach((reliefRegionId) => {
                if (!index[reliefRegionId]) {
                    index[reliefRegionId] = [];
                }
                if (routeId) {
                    index[reliefRegionId].push(routeId);
                }
            });
            return index;
        }, {});
    }

    function buildChokepointIdsByReliefRegion(chokepoints = []) {
        return chokepoints.reduce((index, chokepoint) => {
            const chokepointId = normalizeString(chokepoint.chokepointId, '');
            uniqueStrings(chokepoint.adjacentRegions).forEach((reliefRegionId) => {
                if (!index[reliefRegionId]) {
                    index[reliefRegionId] = [];
                }
                if (chokepointId) {
                    index[reliefRegionId].push(chokepointId);
                }
            });
            return index;
        }, {});
    }

    function buildIsolatedZoneIdsByContinent(isolatedZones = []) {
        return isolatedZones.reduce((index, isolatedZone) => {
            const zoneId = normalizeString(isolatedZone.zoneId, '');
            uniqueStrings(isolatedZone.continentIds).forEach((continentId) => {
                if (!index[continentId]) {
                    index[continentId] = [];
                }
                if (zoneId) {
                    index[continentId].push(zoneId);
                }
            });
            return index;
        }, {});
    }

    function resolvePressureSynthesisOutput(input = {}, deterministicSeed = null) {
        if (isPlainObject(input.pressureSynthesis)) {
            return input.pressureSynthesis;
        }

        if (typeof phase2.createPressureSynthesis !== 'function') {
            throw new Error('[worldgen/phase2] RecoveryReliefSynthesis requires PressureSynthesis to be loaded before rhythm synthesis runs.');
        }

        return phase2.createPressureSynthesis({
            deterministicSeed
        }).run(input);
    }

    function resolveStormCadenceOutput(input = {}, deterministicSeed = null) {
        if (isPlainObject(input.stormCadenceInterpretation)) {
            return input.stormCadenceInterpretation;
        }

        if (isPlainObject(input.stormCadenceOutput)) {
            return input.stormCadenceOutput;
        }

        if (typeof phase2.createStormCadenceInterpreter !== 'function') {
            throw new Error('[worldgen/phase2] NavigationWindowGenerator requires StormCadenceInterpreter to be loaded before navigation timing runs.');
        }

        return phase2.createStormCadenceInterpreter({
            deterministicSeed
        }).run(input);
    }

    function resolveSeasonalityOutput(input = {}, deterministicSeed = null) {
        if (isPlainObject(input.seasonalityInterpretation)) {
            return input.seasonalityInterpretation;
        }

        if (isPlainObject(input.seasonalityOutput)) {
            return input.seasonalityOutput;
        }

        if (typeof phase2.createSeasonalityInterpreter !== 'function') {
            throw new Error('[worldgen/phase2] ScarcityCadenceGenerator requires SeasonalityInterpreter to be loaded before scarcity timing runs.');
        }

        return phase2.createSeasonalityInterpreter({
            deterministicSeed
        }).run(input);
    }

    function resolveNavigationOutput(input = {}, deterministicSeed = null) {
        if (isPlainObject(input.navigationWindowOutput)) {
            return input.navigationWindowOutput;
        }

        if (isPlainObject(input.navigationRhythmOutput)) {
            return input.navigationRhythmOutput;
        }

        if (typeof phase2.createNavigationWindowGenerator !== 'function') {
            throw new Error('[worldgen/phase2] PredictabilityRuptureAnalyzer requires NavigationWindowGenerator to be loaded before predictability timing runs.');
        }

        return phase2.createNavigationWindowGenerator({
            deterministicSeed
        }).run(input);
    }

    function resolveScarcityCadenceOutput(input = {}, deterministicSeed = null) {
        if (isPlainObject(input.scarcityCadenceOutput)) {
            return input.scarcityCadenceOutput;
        }

        if (isPlainObject(input.scarcityRhythmOutput)) {
            return input.scarcityRhythmOutput;
        }

        if (typeof phase2.createScarcityCadenceGenerator !== 'function') {
            throw new Error('[worldgen/phase2] PredictabilityRuptureAnalyzer requires ScarcityCadenceGenerator to be loaded before predictability timing runs.');
        }

        return phase2.createScarcityCadenceGenerator({
            deterministicSeed
        }).run(input);
    }

    function resolveRecoveryOutput(input = {}, deterministicSeed = null) {
        if (isPlainObject(input.recoveryRhythmOutput)) {
            return input.recoveryRhythmOutput;
        }

        if (isPlainObject(input.recoveryOutput)) {
            return input.recoveryOutput;
        }

        if (typeof phase2.createRecoveryReliefSynthesis !== 'function') {
            throw new Error('[worldgen/phase2] EnvironmentalRhythmSynthesis requires RecoveryReliefSynthesis to be loaded before rhythm synthesis runs.');
        }

        return phase2.createRecoveryReliefSynthesis({
            deterministicSeed
        }).run(input);
    }

    function inferRecoverySignals(reliefRegion = {}, context = {}) {
        const reliefRegionId = normalizeString(reliefRegion.reliefRegionId, '');
        const continentIds = uniqueStrings(reliefRegion.continentIds);
        const climateBandIds = uniqueStrings((context.climateBandIdsByReliefRegion || {})[reliefRegionId]);
        const riverBasinIds = uniqueStrings((context.riverBasinIdsByReliefRegion || {})[reliefRegionId]);
        const routeIds = uniqueStrings((context.routeIdsByReliefRegion || {})[reliefRegionId]);
        const chokepointIds = uniqueStrings((context.chokepointIdsByReliefRegion || {})[reliefRegionId]);
        const isolatedZoneIds = uniqueStrings(continentIds.flatMap((continentId) => {
            const zoneIds = (context.isolatedZoneIdsByContinent || {})[continentId];
            return Array.isArray(zoneIds) ? zoneIds : [];
        }));

        const climateExposurePressure = meanByRecordIds(context.climateScores.climateExposurePressure, climateBandIds);
        const waterStress = meanByRecordIds(context.hydrologyScores.waterStress, riverBasinIds);
        const droughtPressure = meanByRecordIds(context.hydrologyScores.droughtPressure, riverBasinIds);
        const floodInstability = meanByRecordIds(context.hydrologyScores.floodInstability, riverBasinIds);
        const foodStress = meanByRecordIds(context.foodScores.foodStress, climateBandIds);
        const scarcityBaseline = meanByRecordIds(context.foodScores.scarcityBaseline, climateBandIds);
        const routeReliabilityInverse = meanByRecordIds(context.travelScores.routeReliabilityInverse, routeIds);
        const movementUncertaintyPressure = meanByRecordIds(context.travelScores.movementUncertaintyPressure, routeIds);
        const detourBurden = meanByRecordIds(context.travelScores.detourBurden, routeIds);
        const chokepointPressure = meanByRecordIds(context.chokepointScores.chokepointPressure, chokepointIds);
        const failureImpactPressure = meanByRecordIds(context.chokepointScores.failureImpactPressure, chokepointIds);
        const isolationPressure = meanByRecordIds(context.isolationScores.isolationPressure, isolatedZoneIds);
        const supportDelayBurden = meanByRecordIds(context.isolationScores.supportDelayBurden, isolatedZoneIds);
        const accessFragility = meanByRecordIds(context.isolationScores.accessFragility, isolatedZoneIds);
        const ecologicalFragility = clamp01(context.ecologyScores.ecologicalFragility[reliefRegionId] || 0);
        const regenerationWeakness = clamp01(context.ecologyScores.regenerationWeakness[reliefRegionId] || 0);
        const catastrophePressure = clamp01(context.catastropheScores.catastrophePressure[reliefRegionId] || 0);
        const floodBreakRisk = clamp01(context.catastropheScores.floodBreakRisk[reliefRegionId] || 0);
        const droughtBreakRisk = clamp01(context.catastropheScores.droughtBreakRisk[reliefRegionId] || 0);

        const supportWindow = clamp01(
            1 - mean([
                climateExposurePressure,
                waterStress,
                foodStress,
                ecologicalFragility,
                catastrophePressure
            ])
        );
        const mobilityReentrySupport = clamp01(
            1 - mean([
                routeReliabilityInverse,
                movementUncertaintyPressure,
                detourBurden,
                chokepointPressure,
                accessFragility
            ])
        );
        const stabilizationDrag = clamp01(mean([
            catastrophePressure,
            floodInstability,
            floodBreakRisk,
            supportDelayBurden,
            isolationPressure,
            regenerationWeakness
        ]));
        const scarcityDrag = clamp01(mean([
            waterStress,
            droughtPressure,
            droughtBreakRisk,
            scarcityBaseline,
            failureImpactPressure
        ]));
        const reliefPocket = applyThresholdContrast(
            clamp01(
                (supportWindow * 0.42)
                + (mobilityReentrySupport * 0.24)
                + ((1 - stabilizationDrag) * 0.18)
                + ((1 - scarcityDrag) * 0.16)
            ),
            RECOVERY_RELIEF_TIMING_POLICY.reliefPocketThreshold,
            RECOVERY_RELIEF_TIMING_POLICY.reliefPocketExponent
        );
        const mobilityRelief = applyThresholdContrast(
            clamp01(
                (mobilityReentrySupport * 0.48)
                + ((1 - chokepointPressure) * 0.16)
                + ((1 - accessFragility) * 0.18)
                + ((1 - detourBurden) * 0.18)
            ),
            RECOVERY_RELIEF_TIMING_POLICY.mobilityReliefThreshold,
            RECOVERY_RELIEF_TIMING_POLICY.mobilityReliefExponent
        );
        const persistentReliefAnchor = applyThresholdContrast(
            clamp01(
                (supportWindow * 0.36)
                + ((1 - stabilizationDrag) * 0.28)
                + ((1 - scarcityDrag) * 0.16)
                + ((1 - catastrophePressure) * 0.2)
            ),
            RECOVERY_RELIEF_TIMING_POLICY.persistenceReliefThreshold,
            RECOVERY_RELIEF_TIMING_POLICY.reliefPocketExponent
        );
        const justifiedReliefBonus = Math.min(
            RECOVERY_RELIEF_TIMING_POLICY.localReliefBonusCap,
            (reliefPocket * 0.08) + (mobilityRelief * 0.05) + (persistentReliefAnchor * 0.05)
        );

        const recoveryTempo = clamp01(
            applyThresholdContrast(
                supportWindow,
                RECOVERY_RELIEF_TIMING_POLICY.supportThreshold,
                RECOVERY_RELIEF_TIMING_POLICY.recoveryExponent
            )
            * 0.72
            + (mobilityReentrySupport * 0.18)
            + ((1 - scarcityDrag) * 0.1)
            + justifiedReliefBonus
        );
        const stabilizationInterval = clamp01(
            applyThresholdContrast(
                stabilizationDrag,
                RECOVERY_RELIEF_TIMING_POLICY.instabilityThreshold,
                RECOVERY_RELIEF_TIMING_POLICY.instabilityExponent
            )
            * 0.74
            + (scarcityDrag * 0.18)
            + ((1 - supportWindow) * 0.08)
        );
        const reliefPersistence = clamp01(
            applyThresholdContrast(
                clamp01(
                    (supportWindow * 0.38)
                    + ((1 - stabilizationDrag) * 0.28)
                    + ((1 - catastrophePressure) * 0.18)
                    + ((1 - regenerationWeakness) * 0.16)
                ),
                RECOVERY_RELIEF_TIMING_POLICY.persistenceThreshold,
                RECOVERY_RELIEF_TIMING_POLICY.persistenceExponent
            )
            + (persistentReliefAnchor * 0.08)
            + (reliefPocket * 0.04)
        );
        const environmentalForgiveness = clamp01(
            applyThresholdContrast(
                clamp01(
                    (supportWindow * 0.32)
                    + (mobilityReentrySupport * 0.24)
                    + ((1 - chokepointPressure) * 0.14)
                    + ((1 - ecologicalFragility) * 0.14)
                    + ((1 - catastrophePressure) * 0.16)
                ),
                RECOVERY_RELIEF_TIMING_POLICY.forgivenessThreshold,
                RECOVERY_RELIEF_TIMING_POLICY.forgivenessExponent
            )
            + (mobilityRelief * 0.07)
            + (reliefPocket * 0.03)
        );

        return {
            supportWindow: roundValue(supportWindow),
            mobilityReentrySupport: roundValue(mobilityReentrySupport),
            stabilizationDrag: roundValue(stabilizationDrag),
            scarcityDrag: roundValue(scarcityDrag),
            reliefPocket: roundValue(reliefPocket),
            mobilityRelief: roundValue(mobilityRelief),
            persistentReliefAnchor: roundValue(persistentReliefAnchor),
            justifiedReliefBonus: roundValue(justifiedReliefBonus),
            climateExposurePressure: roundValue(climateExposurePressure),
            waterStress: roundValue(waterStress),
            foodStress: roundValue(foodStress),
            supportDelayBurden: roundValue(supportDelayBurden),
            ecologicalFragility: roundValue(ecologicalFragility),
            catastrophePressure: roundValue(catastrophePressure),
            recoveryTempo: roundValue(recoveryTempo),
            stabilizationInterval: roundValue(stabilizationInterval),
            reliefPersistence: roundValue(reliefPersistence),
            environmentalForgiveness: roundValue(environmentalForgiveness)
        };
    }

    function buildRecoveryScoreEntry(reliefRegion = {}, signalKey, value, signals = {}) {
        return Object.freeze({
            recordType: 'reliefRegions',
            recordId: normalizeString(reliefRegion.reliefRegionId, ''),
            reliefType: normalizeString(reliefRegion.reliefType, ''),
            continentIds: uniqueStrings(reliefRegion.continentIds),
            adjacentSeaRegionIds: uniqueStrings(reliefRegion.adjacentSeaRegionIds),
            signalKey,
            value: roundValue(value),
            sourceTruth: Object.freeze({
                elevationBias: roundValue(clamp01(reliefRegion.elevationBias)),
                ruggednessBias: roundValue(clamp01(reliefRegion.ruggednessBias)),
                coastalInfluence: roundValue(clamp01(reliefRegion.coastalInfluence))
            }),
            supportContextSnapshot: Object.freeze({
                supportWindow: signals.supportWindow || 0,
                mobilityReentrySupport: signals.mobilityReentrySupport || 0,
                stabilizationDrag: signals.stabilizationDrag || 0,
                scarcityDrag: signals.scarcityDrag || 0,
                reliefPocket: signals.reliefPocket || 0,
                mobilityRelief: signals.mobilityRelief || 0,
                persistentReliefAnchor: signals.persistentReliefAnchor || 0,
                justifiedReliefBonus: signals.justifiedReliefBonus || 0,
                climateExposurePressure: signals.climateExposurePressure || 0,
                waterStress: signals.waterStress || 0,
                foodStress: signals.foodStress || 0,
                supportDelayBurden: signals.supportDelayBurden || 0,
                ecologicalFragility: signals.ecologicalFragility || 0,
                catastrophePressure: signals.catastrophePressure || 0
            })
        });
    }

    function buildRecoveryRhythmField(fieldId, reliefRegions, context, signalKey, description, deterministicSeed) {
        const perReliefScores = reliefRegions.map((reliefRegion) => {
            const signals = inferRecoverySignals(reliefRegion, context);
            return buildRecoveryScoreEntry(reliefRegion, signalKey, signals[signalKey], signals);
        });
        const values = perReliefScores.map((entry) => entry.value);

        return Object.freeze({
            type: 'phase2ScalarField',
            fieldId,
            domainId: 'recovery',
            ownership: 'rhythm',
            deterministic: true,
            derivationMode: 'coarse_recovery_timing_interpretation',
            sourceRecordType: 'reliefRegions',
            sourceFieldIds: Object.freeze([
                'reliefType',
                'continentIds',
                'adjacentSeaRegionIds'
            ]),
            supportRecordTypes: Object.freeze([
                'climateBands',
                'riverBasins',
                'macroRoutes',
                'chokepoints',
                'isolatedZones'
            ]),
            upstreamPressureSupportOnly: true,
            timingSemanticsPreserved: true,
            pressureMixingDetected: false,
            weakensRecovery: false,
            contrastPolicy: RECOVERY_RELIEF_TIMING_POLICY.policyId,
            description,
            deterministicSeedUsed: deterministicSeed,
            perReliefScores,
            summary: Object.freeze({
                recordCount: perReliefScores.length,
                mean: roundValue(mean(values)),
                min: roundValue(values.length ? Math.min(...values) : 0),
                max: roundValue(values.length ? Math.max(...values) : 0)
            })
        });
    }

    function getSeasonalityInterpreterContract() {
        return Object.freeze({
            moduleId: SEASONALITY_INTERPRETER_MODULE_ID,
            version: SEASONALITY_INTERPRETER_MODULE_VERSION,
            input: SEASONALITY_INTERPRETER_INPUT_SPEC,
            output: SEASONALITY_INTERPRETER_OUTPUT_SPEC
        });
    }

    function createSeasonalityInterpreterOutputSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        const metadataOverrides = isPlainObject(normalizedOverrides.metadata)
            ? normalizedOverrides.metadata
            : {};
        return Object.freeze({
            domain: {
                ...cloneValue(SEASONALITY_INTERPRETER_OUTPUT_SPEC.outputShape.domain),
                ...(isPlainObject(normalizedOverrides.domain) ? cloneValue(normalizedOverrides.domain) : {})
            },
            metadata: {
                ...cloneValue(SEASONALITY_INTERPRETER_OUTPUT_SPEC.outputShape.metadata),
                ...cloneValue(metadataOverrides)
            }
        });
    }

    function getStormCadenceInterpreterContract() {
        return Object.freeze({
            moduleId: STORM_CADENCE_INTERPRETER_MODULE_ID,
            version: STORM_CADENCE_INTERPRETER_MODULE_VERSION,
            input: STORM_CADENCE_INTERPRETER_INPUT_SPEC,
            output: STORM_CADENCE_INTERPRETER_OUTPUT_SPEC
        });
    }

    function getNavigationWindowGeneratorContract() {
        return Object.freeze({
            moduleId: NAVIGATION_WINDOW_GENERATOR_MODULE_ID,
            version: NAVIGATION_WINDOW_GENERATOR_MODULE_VERSION,
            input: NAVIGATION_WINDOW_GENERATOR_INPUT_SPEC,
            output: NAVIGATION_WINDOW_GENERATOR_OUTPUT_SPEC
        });
    }

    function getScarcityCadenceGeneratorContract() {
        return Object.freeze({
            moduleId: SCARCITY_CADENCE_GENERATOR_MODULE_ID,
            version: SCARCITY_CADENCE_GENERATOR_MODULE_VERSION,
            input: SCARCITY_CADENCE_GENERATOR_INPUT_SPEC,
            output: SCARCITY_CADENCE_GENERATOR_OUTPUT_SPEC
        });
    }

    function getPredictabilityRuptureAnalyzerContract() {
        return Object.freeze({
            moduleId: PREDICTABILITY_RUPTURE_ANALYZER_MODULE_ID,
            version: PREDICTABILITY_RUPTURE_ANALYZER_MODULE_VERSION,
            input: PREDICTABILITY_RUPTURE_ANALYZER_INPUT_SPEC,
            output: PREDICTABILITY_RUPTURE_ANALYZER_OUTPUT_SPEC
        });
    }

    function getEnvironmentalRhythmSynthesisContract() {
        return Object.freeze({
            moduleId: ENVIRONMENTAL_RHYTHM_SYNTHESIS_MODULE_ID,
            version: ENVIRONMENTAL_RHYTHM_SYNTHESIS_MODULE_VERSION,
            input: ENVIRONMENTAL_RHYTHM_SYNTHESIS_INPUT_SPEC,
            output: ENVIRONMENTAL_RHYTHM_SYNTHESIS_OUTPUT_SPEC
        });
    }

    function createStormCadenceInterpreterOutputSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        const metadataOverrides = isPlainObject(normalizedOverrides.metadata)
            ? normalizedOverrides.metadata
            : {};
        return Object.freeze({
            domain: {
                ...cloneValue(STORM_CADENCE_INTERPRETER_OUTPUT_SPEC.outputShape.domain),
                ...(isPlainObject(normalizedOverrides.domain) ? cloneValue(normalizedOverrides.domain) : {})
            },
            metadata: {
                ...cloneValue(STORM_CADENCE_INTERPRETER_OUTPUT_SPEC.outputShape.metadata),
                ...cloneValue(metadataOverrides)
            }
        });
    }

    function createNavigationWindowGeneratorOutputSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        const metadataOverrides = isPlainObject(normalizedOverrides.metadata)
            ? normalizedOverrides.metadata
            : {};
        return Object.freeze({
            domain: {
                ...cloneValue(NAVIGATION_WINDOW_GENERATOR_OUTPUT_SPEC.outputShape.domain),
                ...(isPlainObject(normalizedOverrides.domain) ? cloneValue(normalizedOverrides.domain) : {})
            },
            metadata: {
                ...cloneValue(NAVIGATION_WINDOW_GENERATOR_OUTPUT_SPEC.outputShape.metadata),
                ...cloneValue(metadataOverrides)
            }
        });
    }

    function createScarcityCadenceGeneratorOutputSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        const metadataOverrides = isPlainObject(normalizedOverrides.metadata)
            ? normalizedOverrides.metadata
            : {};
        return Object.freeze({
            domain: {
                ...cloneValue(SCARCITY_CADENCE_GENERATOR_OUTPUT_SPEC.outputShape.domain),
                ...(isPlainObject(normalizedOverrides.domain) ? cloneValue(normalizedOverrides.domain) : {})
            },
            metadata: {
                ...cloneValue(SCARCITY_CADENCE_GENERATOR_OUTPUT_SPEC.outputShape.metadata),
                ...cloneValue(metadataOverrides)
            }
        });
    }

    function createPredictabilityRuptureAnalyzerOutputSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        const metadataOverrides = isPlainObject(normalizedOverrides.metadata)
            ? normalizedOverrides.metadata
            : {};
        return Object.freeze({
            domain: {
                ...cloneValue(PREDICTABILITY_RUPTURE_ANALYZER_OUTPUT_SPEC.outputShape.domain),
                ...(isPlainObject(normalizedOverrides.domain) ? cloneValue(normalizedOverrides.domain) : {})
            },
            metadata: {
                ...cloneValue(PREDICTABILITY_RUPTURE_ANALYZER_OUTPUT_SPEC.outputShape.metadata),
                ...cloneValue(metadataOverrides)
            }
        });
    }

    function createEnvironmentalRhythmSynthesisOutputSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        const metadataOverrides = isPlainObject(normalizedOverrides.metadata)
            ? normalizedOverrides.metadata
            : {};
        return Object.freeze({
            synthesized: {
                ...cloneValue(ENVIRONMENTAL_RHYTHM_SYNTHESIS_OUTPUT_SPEC.outputShape.synthesized),
                ...(isPlainObject(normalizedOverrides.synthesized) ? cloneValue(normalizedOverrides.synthesized) : {})
            },
            domainLayers: {
                ...cloneValue(ENVIRONMENTAL_RHYTHM_SYNTHESIS_OUTPUT_SPEC.outputShape.domainLayers),
                ...(isPlainObject(normalizedOverrides.domainLayers) ? cloneValue(normalizedOverrides.domainLayers) : {})
            },
            metadata: {
                ...cloneValue(ENVIRONMENTAL_RHYTHM_SYNTHESIS_OUTPUT_SPEC.outputShape.metadata),
                ...cloneValue(metadataOverrides)
            }
        });
    }

    function getRecoveryReliefSynthesisContract() {
        return Object.freeze({
            moduleId: RECOVERY_RELIEF_SYNTHESIS_MODULE_ID,
            version: RECOVERY_RELIEF_SYNTHESIS_MODULE_VERSION,
            input: RECOVERY_RELIEF_SYNTHESIS_INPUT_SPEC,
            output: RECOVERY_RELIEF_SYNTHESIS_OUTPUT_SPEC
        });
    }

    function createRecoveryReliefSynthesisOutputSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        const metadataOverrides = isPlainObject(normalizedOverrides.metadata)
            ? normalizedOverrides.metadata
            : {};
        return Object.freeze({
            domain: {
                ...cloneValue(RECOVERY_RELIEF_SYNTHESIS_OUTPUT_SPEC.outputShape.domain),
                ...(isPlainObject(normalizedOverrides.domain) ? cloneValue(normalizedOverrides.domain) : {})
            },
            metadata: {
                ...cloneValue(RECOVERY_RELIEF_SYNTHESIS_OUTPUT_SPEC.outputShape.metadata),
                ...cloneValue(metadataOverrides)
            }
        });
    }

    function createRecoveryReliefSynthesis(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const deterministicSeed = Object.prototype.hasOwnProperty.call(normalizedOptions, 'deterministicSeed')
            ? normalizedOptions.deterministicSeed
            : null;

        return Object.freeze({
            moduleId: RECOVERY_RELIEF_SYNTHESIS_MODULE_ID,
            version: RECOVERY_RELIEF_SYNTHESIS_MODULE_VERSION,
            deterministic: true,
            seedPurpose: 'rhythm',
            namespaceId: 'phase2.rhythm.recovery',
            deterministicSeed,
            input: RECOVERY_RELIEF_SYNTHESIS_INPUT_SPEC,
            output: RECOVERY_RELIEF_SYNTHESIS_OUTPUT_SPEC,
            run(input = {}) {
                const reliefRegions = resolveReliefRegions(input);
                const climateBands = resolveClimateBands(input);
                const riverBasins = resolveRiverBasins(input);
                const macroRoutes = resolveMacroRoutes(input);
                const chokepoints = resolveChokepoints(input);
                const isolatedZones = resolveIsolatedZones(input);
                const recordBindingContextId = resolveBindingContextId(input);
                const pressureSynthesis = resolvePressureSynthesisOutput(input, deterministicSeed);
                const domainLayers = isPlainObject(pressureSynthesis.domainLayers)
                    ? pressureSynthesis.domainLayers
                    : {};

                const context = {
                    climateBandIdsByReliefRegion: buildClimateBandIdsByReliefRegion(climateBands),
                    riverBasinIdsByReliefRegion: buildRiverBasinIdsByReliefRegion(riverBasins),
                    routeIdsByReliefRegion: buildRouteIdsByReliefRegion(macroRoutes),
                    chokepointIdsByReliefRegion: buildChokepointIdsByReliefRegion(chokepoints),
                    isolatedZoneIdsByContinent: buildIsolatedZoneIdsByContinent(isolatedZones),
                    climateScores: {
                        climateExposurePressure: createScoreMap(
                            (((domainLayers.climate || {}).climateExposurePressure || {}).perBandScores)
                        )
                    },
                    hydrologyScores: {
                        waterStress: createScoreMap((((domainLayers.hydrology || {}).waterStress || {}).perBasinScores)),
                        droughtPressure: createScoreMap((((domainLayers.hydrology || {}).droughtPressure || {}).perBasinScores)),
                        floodInstability: createScoreMap((((domainLayers.hydrology || {}).floodInstability || {}).perBasinScores))
                    },
                    foodScores: {
                        foodStress: createScoreMap((((domainLayers.food || {}).foodStress || {}).perBandScores)),
                        scarcityBaseline: createScoreMap((((domainLayers.food || {}).scarcityBaseline || {}).perBandScores))
                    },
                    travelScores: {
                        routeReliabilityInverse: createScoreMap((((domainLayers.travel || {}).routeReliabilityInverse || {}).perRouteScores)),
                        movementUncertaintyPressure: createScoreMap((((domainLayers.travel || {}).movementUncertaintyPressure || {}).perRouteScores)),
                        detourBurden: createScoreMap((((domainLayers.travel || {}).detourBurden || {}).perRouteScores))
                    },
                    chokepointScores: {
                        chokepointPressure: createScoreMap((((domainLayers.chokepoints || {}).chokepointPressure || {}).perChokepointScores)),
                        failureImpactPressure: createScoreMap((((domainLayers.chokepoints || {}).failureImpactPressure || {}).perChokepointScores))
                    },
                    isolationScores: {
                        isolationPressure: createScoreMap((((domainLayers.isolation || {}).isolationPressure || {}).perZoneScores)),
                        supportDelayBurden: createScoreMap((((domainLayers.isolation || {}).supportDelayBurden || {}).perZoneScores)),
                        accessFragility: createScoreMap((((domainLayers.isolation || {}).accessFragility || {}).perZoneScores))
                    },
                    ecologyScores: {
                        ecologicalFragility: createScoreMap((((domainLayers.ecology || {}).ecologicalFragility || {}).perReliefScores)),
                        regenerationWeakness: createScoreMap((((domainLayers.ecology || {}).regenerationWeakness || {}).perReliefScores))
                    },
                    catastropheScores: {
                        catastrophePressure: createScoreMap((((domainLayers.catastrophe || {}).catastrophePressure || {}).perReliefScores)),
                        floodBreakRisk: createScoreMap((((domainLayers.catastrophe || {}).floodBreakRisk || {}).perReliefScores)),
                        droughtBreakRisk: createScoreMap((((domainLayers.catastrophe || {}).droughtBreakRisk || {}).perReliefScores))
                    }
                };

                return createRecoveryReliefSynthesisOutputSkeleton({
                    domain: {
                        recoveryTempo: buildRecoveryRhythmField(
                            'recoveryTempo',
                            reliefRegions,
                            context,
                            'recoveryTempo',
                            'Coarse recovery timing support from burden/support context only.',
                            deterministicSeed
                        ),
                        stabilizationInterval: buildRecoveryRhythmField(
                            'stabilizationInterval',
                            reliefRegions,
                            context,
                            'stabilizationInterval',
                            'Coarse stabilization interval timing from recovery drag and support context only.',
                            deterministicSeed
                        ),
                        reliefPersistence: buildRecoveryRhythmField(
                            'reliefPersistence',
                            reliefRegions,
                            context,
                            'reliefPersistence',
                            'Coarse relief persistence timing from support windows and stabilization context only.',
                            deterministicSeed
                        ),
                        environmentalForgiveness: buildRecoveryRhythmField(
                            'environmentalForgiveness',
                            reliefRegions,
                            context,
                            'environmentalForgiveness',
                            'Coarse environmental forgiveness timing from recovery support context only.',
                            deterministicSeed
                        )
                    },
                    metadata: {
                        deterministicSeedUsed: deterministicSeed,
                        inputAccepted: isPlainObject(input),
                        recordBindingContextId,
                        mandatoryOutputFieldIds: RECOVERY_RHYTHM_FIELD_IDS.slice(),
                        sourceReliefRegionCount: reliefRegions.length,
                        sourceClimateBandCount: climateBands.length,
                        sourceRiverBasinCount: riverBasins.length,
                        sourceMacroRouteCount: macroRoutes.length,
                        sourceChokepointCount: chokepoints.length,
                        sourceIsolatedZoneCount: isolatedZones.length,
                        upstreamPressureSupportContextOnly: true,
                        executionMode: 'implemented_coarse_recovery_relief_synthesis',
                        timingSemanticsPreserved: true,
                        pressureMixingDetected: false,
                        weakensRecovery: false,
                        contrastPolicy: RECOVERY_RELIEF_TIMING_POLICY.policyId,
                        stubReason: ''
                    }
                });
            }
        });
    }

    function createSeasonalityInterpreter(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const deterministicSeed = Object.prototype.hasOwnProperty.call(normalizedOptions, 'deterministicSeed')
            ? normalizedOptions.deterministicSeed
            : null;

        return Object.freeze({
            moduleId: SEASONALITY_INTERPRETER_MODULE_ID,
            version: SEASONALITY_INTERPRETER_MODULE_VERSION,
            deterministic: true,
            seedPurpose: 'rhythm',
            namespaceId: 'phase2.rhythm.seasonality',
            deterministicSeed,
            input: SEASONALITY_INTERPRETER_INPUT_SPEC,
            output: SEASONALITY_INTERPRETER_OUTPUT_SPEC,
            run(input = {}) {
                const climateBands = resolveSeasonalityClimateBands(input);
                const recordBindingContextId = resolveBindingContextId(input);
                return createSeasonalityInterpreterOutputSkeleton({
                    domain: {
                        seasonalityStrength: buildSeasonalityRhythmField(
                            'seasonalityStrength',
                            climateBands,
                            'seasonalityStrength',
                            'Coarse seasonality timing from completed climate truth only.',
                            deterministicSeed
                        ),
                        annualSwingStrength: buildSeasonalityRhythmField(
                            'annualSwingStrength',
                            climateBands,
                            'annualSwingStrength',
                            'Coarse annual swing timing from completed climate truth only.',
                            deterministicSeed
                        ),
                        environmentalCycleClarity: buildSeasonalityRhythmField(
                            'environmentalCycleClarity',
                            climateBands,
                            'environmentalCycleClarity',
                            'Coarse readable environmental cycle timing from completed climate truth only.',
                            deterministicSeed
                        )
                    },
                    metadata: {
                        deterministicSeedUsed: deterministicSeed,
                        inputAccepted: isPlainObject(input),
                        recordBindingContextId,
                        mandatoryOutputFieldIds: SEASONALITY_RHYTHM_FIELD_IDS.slice(),
                        sourceClimateBandCount: climateBands.length,
                        timingSemanticsPreserved: true,
                        pressureMixingDetected: false,
                        rebuildsClimateGeneration: false,
                        executionMode: 'implemented_coarse_seasonality_interpretation',
                        contrastPolicy: SEASONALITY_TIMING_POLICY.policyId,
                        stubReason: ''
                    }
                });
            }
        });
    }

    function createStormCadenceInterpreter(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const deterministicSeed = Object.prototype.hasOwnProperty.call(normalizedOptions, 'deterministicSeed')
            ? normalizedOptions.deterministicSeed
            : null;

        return Object.freeze({
            moduleId: STORM_CADENCE_INTERPRETER_MODULE_ID,
            version: STORM_CADENCE_INTERPRETER_MODULE_VERSION,
            deterministic: true,
            seedPurpose: 'rhythm',
            namespaceId: 'phase2.rhythm.storms',
            deterministicSeed,
            input: STORM_CADENCE_INTERPRETER_INPUT_SPEC,
            output: STORM_CADENCE_INTERPRETER_OUTPUT_SPEC,
            run(input = {}) {
                const climateBands = resolveStormClimateBands(input);
                const seaRegions = resolveSeaRegions(input);
                const recordBindingContextId = resolveBindingContextId(input);
                const seaRegionIndex = indexById(seaRegions, 'seaRegionId');

                return createStormCadenceInterpreterOutputSkeleton({
                    domain: {
                        stormCadence: buildStormCadenceRhythmField(
                            'stormCadence',
                            climateBands,
                            seaRegionIndex,
                            'stormCadence',
                            'Coarse storm recurrence timing from completed climate and sea truth only.',
                            deterministicSeed
                        ),
                        stormBurstClustering: buildStormCadenceRhythmField(
                            'stormBurstClustering',
                            climateBands,
                            seaRegionIndex,
                            'stormBurstClustering',
                            'Coarse grouped storm-burst timing from completed climate and sea truth only.',
                            deterministicSeed
                        ),
                        calmToStormTransitionSharpness: buildStormCadenceRhythmField(
                            'calmToStormTransitionSharpness',
                            climateBands,
                            seaRegionIndex,
                            'calmToStormTransitionSharpness',
                            'Coarse calm-to-storm transition timing from completed climate and sea truth only.',
                            deterministicSeed
                        )
                    },
                    metadata: {
                        deterministicSeedUsed: deterministicSeed,
                        inputAccepted: isPlainObject(input),
                        recordBindingContextId,
                        mandatoryOutputFieldIds: STORM_CADENCE_RHYTHM_FIELD_IDS.slice(),
                        sourceClimateBandCount: climateBands.length,
                        sourceSeaRegionCount: seaRegions.length,
                        timingSemanticsPreserved: true,
                        pressureMixingDetected: false,
                        rebuildsHazardGeneration: false,
                        executionMode: 'implemented_coarse_storm_cadence_interpretation',
                        contrastPolicy: STORM_CADENCE_TIMING_POLICY.policyId,
                        stubReason: ''
                    }
                });
            }
        });
    }

    function createNavigationWindowGenerator(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const deterministicSeed = Object.prototype.hasOwnProperty.call(normalizedOptions, 'deterministicSeed')
            ? normalizedOptions.deterministicSeed
            : null;

        return Object.freeze({
            moduleId: NAVIGATION_WINDOW_GENERATOR_MODULE_ID,
            version: NAVIGATION_WINDOW_GENERATOR_MODULE_VERSION,
            deterministic: true,
            seedPurpose: 'rhythm',
            namespaceId: 'phase2.rhythm.navigation',
            deterministicSeed,
            input: NAVIGATION_WINDOW_GENERATOR_INPUT_SPEC,
            output: NAVIGATION_WINDOW_GENERATOR_OUTPUT_SPEC,
            run(input = {}) {
                const climateBands = resolveStormClimateBands(input);
                const macroRoutes = resolveMacroRoutes(input);
                const chokepoints = resolveChokepoints(input);
                const recordBindingContextId = resolveBindingContextId(input);
                const stormCadenceOutput = resolveStormCadenceOutput(input, deterministicSeed);

                const context = {
                    climateBandIdsByReliefRegion: buildClimateBandIdsByReliefRegion(climateBands),
                    climateBandIdsBySeaRegion: buildClimateBandIdsBySeaRegion(climateBands),
                    chokepointIndex: indexById(chokepoints, 'chokepointId'),
                    stormScores: {
                        stormCadence: createScoreMap((((stormCadenceOutput.domain || {}).stormCadence || {}).perBandScores)),
                        stormBurstClustering: createScoreMap((((stormCadenceOutput.domain || {}).stormBurstClustering || {}).perBandScores)),
                        calmToStormTransitionSharpness: createScoreMap((((stormCadenceOutput.domain || {}).calmToStormTransitionSharpness || {}).perBandScores))
                    }
                };

                return createNavigationWindowGeneratorOutputSkeleton({
                    domain: {
                        navigationWindowReliability: buildNavigationRhythmField(
                            'navigationWindowReliability',
                            macroRoutes,
                            context,
                            'navigationWindowReliability',
                            'Coarse navigation-window reliability timing from storm cadence and structural route context only.',
                            deterministicSeed
                        ),
                        blockedIntervalFrequency: buildNavigationRhythmField(
                            'blockedIntervalFrequency',
                            macroRoutes,
                            context,
                            'blockedIntervalFrequency',
                            'Coarse blocked-interval timing from storm cadence and chokepoint route context only.',
                            deterministicSeed
                        ),
                        safeRouteIntervalStrength: buildNavigationRhythmField(
                            'safeRouteIntervalStrength',
                            macroRoutes,
                            context,
                            'safeRouteIntervalStrength',
                            'Coarse safe-route interval timing from storm cadence and structural route context only.',
                            deterministicSeed
                        )
                    },
                    metadata: {
                        deterministicSeedUsed: deterministicSeed,
                        inputAccepted: isPlainObject(input),
                        recordBindingContextId,
                        mandatoryOutputFieldIds: NAVIGATION_RHYTHM_FIELD_IDS.slice(),
                        sourceClimateBandCount: climateBands.length,
                        sourceMacroRouteCount: macroRoutes.length,
                        sourceChokepointCount: chokepoints.length,
                        timingSemanticsPreserved: true,
                        pressureMixingDetected: false,
                        rebuildsTraversalGeneration: false,
                        executionMode: 'implemented_coarse_navigation_window_interpretation',
                        contrastPolicy: NAVIGATION_WINDOW_TIMING_POLICY.policyId,
                        stubReason: ''
                    }
                });
            }
        });
    }

    function createScarcityCadenceGenerator(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const deterministicSeed = Object.prototype.hasOwnProperty.call(normalizedOptions, 'deterministicSeed')
            ? normalizedOptions.deterministicSeed
            : null;

        return Object.freeze({
            moduleId: SCARCITY_CADENCE_GENERATOR_MODULE_ID,
            version: SCARCITY_CADENCE_GENERATOR_MODULE_VERSION,
            deterministic: true,
            seedPurpose: 'rhythm',
            namespaceId: 'phase2.rhythm.scarcity',
            deterministicSeed,
            input: SCARCITY_CADENCE_GENERATOR_INPUT_SPEC,
            output: SCARCITY_CADENCE_GENERATOR_OUTPUT_SPEC,
            run(input = {}) {
                const climateBands = resolveClimateBands(input);
                const riverBasins = resolveRiverBasins(input);
                const recordBindingContextId = resolveBindingContextId(input);
                const seasonalityOutput = resolveSeasonalityOutput(input, deterministicSeed);
                const pressureSynthesis = resolvePressureSynthesisOutput(input, deterministicSeed);
                const domainLayers = isPlainObject(pressureSynthesis.domainLayers)
                    ? pressureSynthesis.domainLayers
                    : {};

                const context = {
                    riverBasinIdsByReliefRegion: buildRiverBasinIdsByReliefRegion(riverBasins),
                    seasonalityScores: {
                        seasonalityStrength: createScoreMap((((seasonalityOutput.domain || {}).seasonalityStrength || {}).perBandScores)),
                        annualSwingStrength: createScoreMap((((seasonalityOutput.domain || {}).annualSwingStrength || {}).perBandScores)),
                        environmentalCycleClarity: createScoreMap((((seasonalityOutput.domain || {}).environmentalCycleClarity || {}).perBandScores))
                    },
                    hydrologyScores: {
                        waterReliabilityInverse: createScoreMap((((domainLayers.hydrology || {}).waterReliabilityInverse || {}).perBasinScores)),
                        waterStress: createScoreMap((((domainLayers.hydrology || {}).waterStress || {}).perBasinScores)),
                        droughtPressure: createScoreMap((((domainLayers.hydrology || {}).droughtPressure || {}).perBasinScores))
                    }
                };

                return createScarcityCadenceGeneratorOutputSkeleton({
                    domain: {
                        scarcityCadence: buildScarcityCadenceRhythmField(
                            'scarcityCadence',
                            climateBands,
                            context,
                            'scarcityCadence',
                            'Coarse scarcity cadence timing from support burden and seasonal context only.',
                            deterministicSeed
                        ),
                        deficitPersistence: buildScarcityCadenceRhythmField(
                            'deficitPersistence',
                            climateBands,
                            context,
                            'deficitPersistence',
                            'Coarse deficit persistence timing from support burden drag and seasonal context only.',
                            deterministicSeed
                        ),
                        shortageRecurrence: buildScarcityCadenceRhythmField(
                            'shortageRecurrence',
                            climateBands,
                            context,
                            'shortageRecurrence',
                            'Coarse shortage recurrence timing from support burden and readable seasonal return only.',
                            deterministicSeed
                        )
                    },
                    metadata: {
                        deterministicSeedUsed: deterministicSeed,
                        inputAccepted: isPlainObject(input),
                        recordBindingContextId,
                        mandatoryOutputFieldIds: SCARCITY_CADENCE_RHYTHM_FIELD_IDS.slice(),
                        sourceClimateBandCount: climateBands.length,
                        sourceRiverBasinCount: riverBasins.length,
                        timingSemanticsPreserved: true,
                        pressureMixingDetected: false,
                        rebuildsScarcityGeneration: false,
                        upstreamPressureSupportContextOnly: true,
                        executionMode: 'implemented_coarse_scarcity_cadence_interpretation',
                        contrastPolicy: SCARCITY_CADENCE_TIMING_POLICY.policyId,
                        stubReason: ''
                    }
                });
            }
        });
    }

    function createPredictabilityRuptureAnalyzer(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const deterministicSeed = Object.prototype.hasOwnProperty.call(normalizedOptions, 'deterministicSeed')
            ? normalizedOptions.deterministicSeed
            : null;

        return Object.freeze({
            moduleId: PREDICTABILITY_RUPTURE_ANALYZER_MODULE_ID,
            version: PREDICTABILITY_RUPTURE_ANALYZER_MODULE_VERSION,
            deterministic: true,
            seedPurpose: 'rhythm',
            namespaceId: 'phase2.rhythm.predictability',
            deterministicSeed,
            input: PREDICTABILITY_RUPTURE_ANALYZER_INPUT_SPEC,
            output: PREDICTABILITY_RUPTURE_ANALYZER_OUTPUT_SPEC,
            run(input = {}) {
                const climateBands = resolveClimateBands(input);
                const macroRoutes = resolveMacroRoutes(input);
                const recordBindingContextId = resolveBindingContextId(input);
                const seasonalityOutput = resolveSeasonalityOutput(input, deterministicSeed);
                const stormCadenceOutput = resolveStormCadenceOutput(input, deterministicSeed);
                const navigationOutput = resolveNavigationOutput(input, deterministicSeed);
                const scarcityOutput = resolveScarcityCadenceOutput(input, deterministicSeed);

                const context = {
                    routeIdsByReliefRegion: buildRouteIdsByReliefRegion(macroRoutes),
                    seasonalityScores: {
                        seasonalityStrength: createScoreMap((((seasonalityOutput.domain || {}).seasonalityStrength || {}).perBandScores)),
                        annualSwingStrength: createScoreMap((((seasonalityOutput.domain || {}).annualSwingStrength || {}).perBandScores)),
                        environmentalCycleClarity: createScoreMap((((seasonalityOutput.domain || {}).environmentalCycleClarity || {}).perBandScores))
                    },
                    stormScores: {
                        stormCadence: createScoreMap((((stormCadenceOutput.domain || {}).stormCadence || {}).perBandScores)),
                        stormBurstClustering: createScoreMap((((stormCadenceOutput.domain || {}).stormBurstClustering || {}).perBandScores)),
                        calmToStormTransitionSharpness: createScoreMap((((stormCadenceOutput.domain || {}).calmToStormTransitionSharpness || {}).perBandScores))
                    },
                    navigationScores: {
                        navigationWindowReliability: createScoreMap((((navigationOutput.domain || {}).navigationWindowReliability || {}).perRouteScores)),
                        blockedIntervalFrequency: createScoreMap((((navigationOutput.domain || {}).blockedIntervalFrequency || {}).perRouteScores)),
                        safeRouteIntervalStrength: createScoreMap((((navigationOutput.domain || {}).safeRouteIntervalStrength || {}).perRouteScores))
                    },
                    scarcityScores: {
                        scarcityCadence: createScoreMap((((scarcityOutput.domain || {}).scarcityCadence || {}).perBandScores)),
                        deficitPersistence: createScoreMap((((scarcityOutput.domain || {}).deficitPersistence || {}).perBandScores)),
                        shortageRecurrence: createScoreMap((((scarcityOutput.domain || {}).shortageRecurrence || {}).perBandScores))
                    }
                };

                return createPredictabilityRuptureAnalyzerOutputSkeleton({
                    domain: {
                        predictability: buildPredictabilityRhythmField(
                            'predictability',
                            climateBands,
                            context,
                            'predictability',
                            'Coarse predictability timing from rhythm cadence-layer agreement only.',
                            deterministicSeed
                        ),
                        ruptureFrequency: buildPredictabilityRhythmField(
                            'ruptureFrequency',
                            climateBands,
                            context,
                            'ruptureFrequency',
                            'Coarse rupture-frequency timing from cadence-layer disruption only.',
                            deterministicSeed
                        ),
                        cadenceIrregularity: buildPredictabilityRhythmField(
                            'cadenceIrregularity',
                            climateBands,
                            context,
                            'cadenceIrregularity',
                            'Coarse cadence irregularity from timing-layer mismatch and disruption only.',
                            deterministicSeed
                        ),
                        temporalTrustworthiness: buildPredictabilityRhythmField(
                            'temporalTrustworthiness',
                            climateBands,
                            context,
                            'temporalTrustworthiness',
                            'Coarse temporal trust from rhythm-layer stability and readable timing support only.',
                            deterministicSeed
                        )
                    },
                    metadata: {
                        deterministicSeedUsed: deterministicSeed,
                        inputAccepted: isPlainObject(input),
                        recordBindingContextId,
                        mandatoryOutputFieldIds: PREDICTABILITY_RHYTHM_FIELD_IDS.slice(),
                        sourceClimateBandCount: climateBands.length,
                        sourceMacroRouteCount: macroRoutes.length,
                        timingSemanticsPreserved: true,
                        pressureMixingDetected: false,
                        rebuildsVolatilityGeneration: false,
                        executionMode: 'implemented_coarse_predictability_rupture_analysis',
                        contrastPolicy: PREDICTABILITY_RHYTHM_TIMING_POLICY.policyId,
                        stubReason: ''
                    }
                });
            }
        });
    }

    function createEnvironmentalRhythmSynthesis(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const deterministicSeed = Object.prototype.hasOwnProperty.call(normalizedOptions, 'deterministicSeed')
            ? normalizedOptions.deterministicSeed
            : null;

        return Object.freeze({
            moduleId: ENVIRONMENTAL_RHYTHM_SYNTHESIS_MODULE_ID,
            version: ENVIRONMENTAL_RHYTHM_SYNTHESIS_MODULE_VERSION,
            deterministic: true,
            seedPurpose: 'rhythm',
            namespaceId: 'phase2.rhythm.synthesis',
            deterministicSeed,
            input: ENVIRONMENTAL_RHYTHM_SYNTHESIS_INPUT_SPEC,
            output: ENVIRONMENTAL_RHYTHM_SYNTHESIS_OUTPUT_SPEC,
            run(input = {}) {
                const recordBindingContextId = resolveBindingContextId(input);
                const domainLayers = buildRhythmDomainLayers(input, deterministicSeed);
                const synthesized = buildEnvironmentalRhythmSynthesized(domainLayers, deterministicSeed);

                return createEnvironmentalRhythmSynthesisOutputSkeleton({
                    synthesized,
                    domainLayers,
                    metadata: {
                        deterministicSeedUsed: deterministicSeed,
                        inputAccepted: isPlainObject(input),
                        recordBindingContextId,
                        synthesizedFieldIds: RHYTHM_SYNTHESIZED_FIELD_IDS.slice(),
                        preservedDomainLayerIds: RHYTHM_DOMAIN_IDS.slice(),
                        domainLayerCount: RHYTHM_DOMAIN_IDS.length,
                        sourceDomainLayersPreserved: true,
                        replacesDomainLayers: false,
                        flattensTimingStructure: false,
                        preservesRecoveryExplicitness: true,
                        rhythmFamilyContrastEnhanced: true,
                        timingSemanticsPreserved: true,
                        pressureMixingDetected: false,
                        contrastPolicy: RHYTHM_SYNTHESIS_TIMING_POLICY.policyId,
                        forbiddenPressureInputs: ENVIRONMENTAL_RHYTHM_SYNTHESIS_INPUT_SPEC.forbiddenInputs.slice(),
                        stubReason: ''
                    }
                });
            }
        });
    }

    function getPhase2RhythmModuleStub() {
        return STUB;
    }

    phase2.__contractFirstStubs = phase2.__contractFirstStubs || {};
    phase2.__contractFirstStubs[GROUP_ID] = STUB;

    Object.assign(phase2, {
        getPhase2RhythmModuleStub,
        getSeasonalityInterpreterContract,
        createSeasonalityInterpreterOutputSkeleton,
        createSeasonalityInterpreter,
        getStormCadenceInterpreterContract,
        createStormCadenceInterpreterOutputSkeleton,
        createStormCadenceInterpreter,
        getNavigationWindowGeneratorContract,
        createNavigationWindowGeneratorOutputSkeleton,
        createNavigationWindowGenerator,
        getScarcityCadenceGeneratorContract,
        createScarcityCadenceGeneratorOutputSkeleton,
        createScarcityCadenceGenerator,
        getPredictabilityRuptureAnalyzerContract,
        createPredictabilityRuptureAnalyzerOutputSkeleton,
        createPredictabilityRuptureAnalyzer,
        getEnvironmentalRhythmSynthesisContract,
        createEnvironmentalRhythmSynthesisOutputSkeleton,
        createEnvironmentalRhythmSynthesis,
        getRecoveryReliefSynthesisContract,
        createRecoveryReliefSynthesisOutputSkeleton,
        createRecoveryReliefSynthesis
    });
})();
