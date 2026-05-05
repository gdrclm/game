(() => {
    const game = window.Game;
    const phase2 = game.systems.worldgenPhase2 = game.systems.worldgenPhase2 || {};
    const GROUP_ID = 'pressure';
    const MODULE_ID = 'ClimateBurdenInterpreter';
    const MODULE_VERSION = 'phase2-pressure-climate-burden-interpreter-stub-v1';
    const TERRAIN_MODULE_ID = 'TerrainHarshnessGenerator';
    const TERRAIN_MODULE_VERSION = 'phase2-pressure-terrain-harshness-generator-stub-v1';
    const HYDROLOGY_MODULE_ID = 'HydrologyStressGenerator';
    const HYDROLOGY_MODULE_VERSION = 'phase2-pressure-hydrology-stress-generator-stub-v1';
    const FOOD_MODULE_ID = 'FoodReliabilityGenerator';
    const FOOD_MODULE_VERSION = 'phase2-pressure-food-reliability-generator-stub-v1';
    const TRAVEL_MODULE_ID = 'TravelExposureGenerator';
    const TRAVEL_MODULE_VERSION = 'phase2-pressure-travel-exposure-generator-stub-v1';
    const CHOKEPOINT_MODULE_ID = 'ChokepointPressureGenerator';
    const CHOKEPOINT_MODULE_VERSION = 'phase2-pressure-chokepoint-pressure-generator-stub-v1';
    const ISOLATION_MODULE_ID = 'IsolationBurdenGenerator';
    const ISOLATION_MODULE_VERSION = 'phase2-pressure-isolation-burden-generator-stub-v1';
    const ECOLOGY_MODULE_ID = 'EcologicalFragilityGenerator';
    const ECOLOGY_MODULE_VERSION = 'phase2-pressure-ecological-fragility-generator-stub-v1';
    const CATASTROPHE_MODULE_ID = 'CatastropheSusceptibilityGenerator';
    const CATASTROPHE_MODULE_VERSION = 'phase2-pressure-catastrophe-susceptibility-generator-stub-v1';
    const PRESSURE_SYNTHESIS_MODULE_ID = 'PressureSynthesis';
    const PRESSURE_SYNTHESIS_MODULE_VERSION = 'phase2-pressure-synthesis-v1';
    const PRESSURE_PACKAGE_CONTRACT_ID = 'PressureFieldPackage';
    const CLIMATE_DOMAIN_CONTRACT_ID = 'Phase2ClimatePressureDomain';
    const TERRAIN_DOMAIN_CONTRACT_ID = 'Phase2TerrainPressureDomain';
    const HYDROLOGY_DOMAIN_CONTRACT_ID = 'Phase2HydrologyPressureDomain';
    const FOOD_DOMAIN_CONTRACT_ID = 'Phase2FoodPressureDomain';
    const TRAVEL_DOMAIN_CONTRACT_ID = 'Phase2TravelPressureDomain';
    const CHOKEPOINT_DOMAIN_CONTRACT_ID = 'Phase2ChokepointPressureDomain';
    const ISOLATION_DOMAIN_CONTRACT_ID = 'Phase2IsolationPressureDomain';
    const ECOLOGY_DOMAIN_CONTRACT_ID = 'Phase2EcologyPressureDomain';
    const CATASTROPHE_DOMAIN_CONTRACT_ID = 'Phase2CatastrophePressureDomain';
    const PRESSURE_SYNTHESIZED_SCHEMA_CONTRACT_ID = 'Phase2PressureSynthesizedSchema';
    const RECORD_BINDING_LAYER_CONTRACT_ID = 'Phase2RecordBindingLayer';
    const INPUT_BUNDLE_CONTRACT_ID = 'Phase2InputBundle';
    const PRESSURE_DOMAIN_IDS = Object.freeze([
        'climate',
        'terrain',
        'hydrology',
        'food',
        'travel',
        'chokepoints',
        'isolation',
        'ecology',
        'catastrophe'
    ]);
    const PRESSURE_SYNTHESIZED_FIELD_IDS = Object.freeze([
        'survivabilityPressure',
        'mobilityPressure',
        'supplyPressure',
        'chokepointStress',
        'remotenessBurden',
        'ecologicalBurden',
        'catastropheSusceptibility'
    ]);
    const CLIMATE_BURDEN_CONTRAST_POLICY = Object.freeze({
        policyId: 'coarseClimateContrastCalibration',
        preserveOrdering: true,
        preserveInterpretiveOnlySemantics: true,
        rebuildsClimateGeneration: false,
        mixesTimingSemantics: false,
        coldPivot: 0.48,
        heatPivot: 0.52,
        humidityPivot: 0.42,
        contrastExponent: 0.78,
        exposureExponent: 0.82
    });
    const TERRAIN_BURDEN_CONTRAST_POLICY = Object.freeze({
        policyId: 'coarseTerrainNoiseCalibration',
        preserveOrdering: true,
        preserveMacroBarriers: true,
        preserveInterpretiveOnlySemantics: true,
        rebuildsTerrainGeneration: false,
        mixesTimingSemantics: false,
        harshnessThreshold: 0.16,
        slopeThreshold: 0.14,
        fragmentationThreshold: 0.18,
        mobilityThreshold: 0.16,
        contrastExponent: 0.8,
        barrierExponent: 0.74
    });
    const HYDROLOGY_BURDEN_CONTRAST_POLICY = Object.freeze({
        policyId: 'coarseHydrologyBasinSensitivityCalibration',
        preserveOrdering: true,
        preserveInterpretiveOnlySemantics: true,
        rebuildsHydrologyGeneration: false,
        mixesTimingSemantics: false,
        reliabilityThreshold: 0.18,
        stressThreshold: 0.16,
        droughtThreshold: 0.18,
        floodThreshold: 0.14,
        contrastExponent: 0.79,
        brittleExponent: 0.73,
        stableExponent: 0.84
    });
    const FOOD_BURDEN_CONTRAST_POLICY = Object.freeze({
        policyId: 'coarseFoodSupportContrastCalibration',
        preserveOrdering: true,
        preserveInterpretiveOnlySemantics: true,
        mixesTimingSemantics: false,
        introducesScarcityTiming: false,
        improveSupportZoneReadability: true,
        supportRichDeadband: 0.12,
        brittleEscalationStart: 0.34,
        foodStressThreshold: 0.18,
        foodReliabilityThreshold: 0.18,
        fertilityThreshold: 0.17,
        scarcityBaselineThreshold: 0.2,
        contrastExponent: 0.8,
        brittleExponent: 0.74,
        supportExponent: 1.12
    });
    const TRAVEL_BURDEN_CONTRAST_POLICY = Object.freeze({
        policyId: 'coarseTravelRouteReadabilityCalibration',
        preserveOrdering: true,
        preserveInterpretiveOnlySemantics: true,
        mixesTimingSemantics: false,
        improveSafeVsHostileReadability: true,
        safeRouteDeadband: 0.14,
        hostileEscalationStart: 0.32,
        travelExposureThreshold: 0.18,
        reliabilityThreshold: 0.18,
        uncertaintyThreshold: 0.17,
        detourThreshold: 0.17,
        contrastExponent: 0.8,
        hostileExponent: 0.74,
        safeExponent: 1.14
    });
    const CHOKEPOINT_BURDEN_CONTRAST_POLICY = Object.freeze({
        policyId: 'coarseChokepointFalsePositiveCalibration',
        preserveOrdering: true,
        preserveInterpretiveOnlySemantics: true,
        mixesTimingSemantics: false,
        separateFromGenericRouteStress: true,
        specificityThreshold: 0.18,
        leakageThreshold: 0.16,
        escalationThreshold: 0.34,
        contrastExponent: 0.78,
        specificityExponent: 0.76,
        leakageExponent: 1.08
    });
    const ISOLATION_BURDEN_CONTRAST_POLICY = Object.freeze({
        policyId: 'coarseIsolationCorePeripheryReadabilityCalibration',
        preserveOrdering: true,
        preserveInterpretiveOnlySemantics: true,
        mixesTimingSemantics: false,
        improveCorePeripheryReadability: true,
        coreAnchorThreshold: 0.14,
        peripheryEscalationStart: 0.34,
        isolationThreshold: 0.18,
        supportDelayThreshold: 0.18,
        peripheralExposureThreshold: 0.17,
        accessFragilityThreshold: 0.17,
        contrastExponent: 0.8,
        peripheryExponent: 0.74,
        coreExponent: 1.12
    });
    const ECOLOGY_BURDEN_CONTRAST_POLICY = Object.freeze({
        policyId: 'coarseEcologyResilientBrittleCalibration',
        preserveOrdering: true,
        preserveInterpretiveOnlySemantics: true,
        mixesTimingSemantics: false,
        avoidGenericHarshnessFlattening: true,
        resilienceThreshold: 0.14,
        brittlenessEscalationStart: 0.34,
        ecologicalFragilityThreshold: 0.17,
        stabilityInverseThreshold: 0.18,
        regenerationWeaknessThreshold: 0.17,
        carryingCapacityThreshold: 0.18,
        contrastExponent: 0.8,
        brittleExponent: 0.74,
        resilienceExponent: 1.12
    });
    const CATASTROPHE_BURDEN_CONTRAST_POLICY = Object.freeze({
        policyId: 'coarseCatastropheCauseSeparationCalibration',
        preserveOrdering: true,
        preserveInterpretiveOnlySemantics: true,
        mixesTimingSemantics: false,
        preventCauseCollapse: true,
        stormThreshold: 0.18,
        volcanicThreshold: 0.16,
        floodThreshold: 0.17,
        droughtThreshold: 0.18,
        aggregateThreshold: 0.18,
        contrastExponent: 0.8,
        causeExponent: 0.76,
        separationExponent: 1.08
    });
    const PRESSURE_SYNTHESIS_READABILITY_POLICY = Object.freeze({
        policyId: 'planningStylePressureProfileReadabilityCalibration',
        preserveOrdering: true,
        preserveInterpretiveOnlySemantics: true,
        preserveRecoveryPriority: true,
        modifiesRhythmPackage: false,
        flattensToDifficultyScalar: false,
        profileDeviationBoost: 0.24,
        profileSpreadThreshold: 0.08,
        axisSpreadThreshold: 0.12,
        dominantComponentThreshold: 0.16,
        profileContrastExponent: 0.9,
        dominantComponentExponent: 0.84,
        concentratedAxisExponent: 0.78
    });
    const STUB = Object.freeze({
        groupId: GROUP_ID,
        status: 'partial_implemented_climate_burden_interpreter',
        canonicalPath: 'js/worldgen/phase2/pressure/',
        uiCoupling: false,
        implementsFieldLogic: true,
        purpose: 'Pressure-only entry point for burden magnitude and persistence domains.'
    });
    const CLIMATE_BURDEN_INTERPRETER_INPUT_SPEC = Object.freeze({
        moduleId: MODULE_ID,
        phaseId: 'PHASE_2',
        pressureSideOnly: true,
        deterministicBy: 'explicit climate pressure sub-seed input',
        requiredInputs: Object.freeze({
            inputBundleContractId: INPUT_BUNDLE_CONTRACT_ID,
            recordBindingContractId: RECORD_BINDING_LAYER_CONTRACT_ID,
            targetDomainContractId: CLIMATE_DOMAIN_CONTRACT_ID,
            deterministicSeedPurpose: 'pressure',
            deterministicNamespace: 'phase2.pressure.climate'
        }),
        sourceCollections: Object.freeze([
            'rootRecords.physical.climateBands',
            'rootRecords.physical.reliefRegions',
            'rootRecords.physical.seaRegions',
            'rootRecords.physical.riverBasins'
        ]),
        forbiddenInputs: Object.freeze([
            'EnvironmentalRhythmPackage',
            'seasonalityStrength',
            'annualSwingStrength',
            'environmentalCycleClarity',
            'stormCadence',
            'recoveryTempo'
        ])
    });
    const CLIMATE_BURDEN_INTERPRETER_OUTPUT_SPEC = Object.freeze({
        moduleId: MODULE_ID,
        packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
        targetDomainId: 'climate',
        targetDomainContractId: CLIMATE_DOMAIN_CONTRACT_ID,
        deterministicStub: false,
        computesBurdenFields: true,
        outputShape: Object.freeze({
            domain: Object.freeze({
                coldPressure: null,
                heatPressure: null,
                humidityPressure: null,
                climateExposurePressure: null
            }),
            metadata: Object.freeze({
                interpreterId: MODULE_ID,
                interpreterVersion: MODULE_VERSION,
                deterministicSeedUsed: null,
                deterministicNamespace: 'phase2.pressure.climate',
                executionMode: 'coarse_record_interpretation',
                computedFieldIds: Object.freeze([
                    'coldPressure',
                    'heatPressure',
                    'humidityPressure',
                    'climateExposurePressure'
                ]),
                deferredFieldIds: Object.freeze([])
            })
        })
    });
    const TERRAIN_HARSHNESS_GENERATOR_INPUT_SPEC = Object.freeze({
        moduleId: TERRAIN_MODULE_ID,
        phaseId: 'PHASE_2',
        pressureSideOnly: true,
        deterministicBy: 'explicit terrain pressure sub-seed input',
        requiredInputs: Object.freeze({
            inputBundleContractId: INPUT_BUNDLE_CONTRACT_ID,
            recordBindingContractId: RECORD_BINDING_LAYER_CONTRACT_ID,
            targetDomainContractId: TERRAIN_DOMAIN_CONTRACT_ID,
            deterministicSeedPurpose: 'pressure',
            deterministicNamespace: 'phase2.pressure.terrain'
        }),
        sourceCollections: Object.freeze([
            'rootRecords.physical.reliefRegions',
            'rootRecords.physical.mountainSystems',
            'rootRecords.physical.volcanicZones'
        ]),
        forbiddenInputs: Object.freeze([
            'EnvironmentalRhythmPackage',
            'stormCadence',
            'navigationWindowReliability',
            'scarcityCadence',
            'recoveryTempo'
        ])
    });
    const TERRAIN_HARSHNESS_GENERATOR_OUTPUT_SPEC = Object.freeze({
        moduleId: TERRAIN_MODULE_ID,
        packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
        targetDomainId: 'terrain',
        targetDomainContractId: TERRAIN_DOMAIN_CONTRACT_ID,
        deterministicStub: false,
        computesBurdenFields: true,
        outputShape: Object.freeze({
            domain: Object.freeze({
                terrainHarshness: null,
                slopeBurden: null,
                fragmentationBurden: null,
                mobilityTerrainPenalty: null
            }),
            metadata: Object.freeze({
                generatorId: TERRAIN_MODULE_ID,
                generatorVersion: TERRAIN_MODULE_VERSION,
                deterministicSeedUsed: null,
                deterministicNamespace: 'phase2.pressure.terrain',
                executionMode: 'coarse_record_interpretation',
                computedFieldIds: Object.freeze([
                    'terrainHarshness',
                    'slopeBurden',
                    'fragmentationBurden',
                    'mobilityTerrainPenalty'
                ]),
                deferredFieldIds: Object.freeze([])
            })
        })
    });
    const HYDROLOGY_STRESS_GENERATOR_INPUT_SPEC = Object.freeze({
        moduleId: HYDROLOGY_MODULE_ID,
        phaseId: 'PHASE_2',
        pressureSideOnly: true,
        deterministicBy: 'explicit hydrology pressure sub-seed input',
        requiredInputs: Object.freeze({
            inputBundleContractId: INPUT_BUNDLE_CONTRACT_ID,
            recordBindingContractId: RECORD_BINDING_LAYER_CONTRACT_ID,
            targetDomainContractId: HYDROLOGY_DOMAIN_CONTRACT_ID,
            deterministicSeedPurpose: 'pressure',
            deterministicNamespace: 'phase2.pressure.hydrology'
        }),
        sourceCollections: Object.freeze([
            'rootRecords.physical.riverBasins',
            'rootRecords.physical.mountainSystems',
            'rootRecords.physical.seaRegions'
        ]),
        forbiddenInputs: Object.freeze([
            'EnvironmentalRhythmPackage',
            'navigationWindowReliability',
            'scarcityCadence',
            'predictability',
            'recoveryTempo'
        ])
    });
    const HYDROLOGY_STRESS_GENERATOR_OUTPUT_SPEC = Object.freeze({
        moduleId: HYDROLOGY_MODULE_ID,
        packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
        targetDomainId: 'hydrology',
        targetDomainContractId: HYDROLOGY_DOMAIN_CONTRACT_ID,
        deterministicStub: false,
        computesBurdenFields: true,
        outputShape: Object.freeze({
            domain: Object.freeze({
                waterReliabilityInverse: null,
                waterStress: null,
                droughtPressure: null,
                floodInstability: null
            }),
            metadata: Object.freeze({
                generatorId: HYDROLOGY_MODULE_ID,
                generatorVersion: HYDROLOGY_MODULE_VERSION,
                deterministicSeedUsed: null,
                deterministicNamespace: 'phase2.pressure.hydrology',
                executionMode: 'coarse_record_interpretation',
                computedFieldIds: Object.freeze([
                    'waterReliabilityInverse',
                    'waterStress',
                    'droughtPressure',
                    'floodInstability'
                ]),
                deferredFieldIds: Object.freeze([])
            })
        })
    });
    const FOOD_RELIABILITY_GENERATOR_INPUT_SPEC = Object.freeze({
        moduleId: FOOD_MODULE_ID,
        phaseId: 'PHASE_2',
        pressureSideOnly: true,
        deterministicBy: 'explicit food pressure sub-seed input',
        requiredInputs: Object.freeze({
            inputBundleContractId: INPUT_BUNDLE_CONTRACT_ID,
            recordBindingContractId: RECORD_BINDING_LAYER_CONTRACT_ID,
            targetDomainContractId: FOOD_DOMAIN_CONTRACT_ID,
            deterministicSeedPurpose: 'pressure',
            deterministicNamespace: 'phase2.pressure.food'
        }),
        upstreamPressureDependencies: Object.freeze([
            CLIMATE_DOMAIN_CONTRACT_ID,
            TERRAIN_DOMAIN_CONTRACT_ID,
            HYDROLOGY_DOMAIN_CONTRACT_ID
        ]),
        sourceCollections: Object.freeze([
            'rootRecords.physical.climateBands',
            'rootRecords.physical.reliefRegions',
            'rootRecords.physical.riverBasins'
        ]),
        forbiddenInputs: Object.freeze([
            'EnvironmentalRhythmPackage',
            'scarcityCadence',
            'shortageRecurrence',
            'navigationWindowReliability',
            'recoveryTempo'
        ])
    });
    const FOOD_RELIABILITY_GENERATOR_OUTPUT_SPEC = Object.freeze({
        moduleId: FOOD_MODULE_ID,
        packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
        targetDomainId: 'food',
        targetDomainContractId: FOOD_DOMAIN_CONTRACT_ID,
        deterministicStub: true,
        computesBurdenFields: false,
        outputShape: Object.freeze({
            domain: Object.freeze({
                foodStress: null,
                foodReliabilityInverse: null,
                fertilitySupportInverse: null,
                scarcityBaseline: null
            }),
            metadata: Object.freeze({
                generatorId: FOOD_MODULE_ID,
                generatorVersion: FOOD_MODULE_VERSION,
                deterministicSeedUsed: null,
                deterministicNamespace: 'phase2.pressure.food',
                executionMode: 'stub',
                computedFieldIds: Object.freeze([]),
                deferredFieldIds: Object.freeze([
                    'foodStress',
                    'foodReliabilityInverse',
                    'fertilitySupportInverse',
                    'scarcityBaseline'
                ])
            })
        })
    });
    const TRAVEL_EXPOSURE_GENERATOR_INPUT_SPEC = Object.freeze({
        moduleId: TRAVEL_MODULE_ID,
        phaseId: 'PHASE_2',
        pressureSideOnly: true,
        deterministicBy: 'explicit travel pressure sub-seed input',
        requiredInputs: Object.freeze({
            inputBundleContractId: INPUT_BUNDLE_CONTRACT_ID,
            recordBindingContractId: RECORD_BINDING_LAYER_CONTRACT_ID,
            targetDomainContractId: TRAVEL_DOMAIN_CONTRACT_ID,
            deterministicSeedPurpose: 'pressure',
            deterministicNamespace: 'phase2.pressure.travel'
        }),
        sourceCollections: Object.freeze([
            'rootRecords.structural.macroRoutes',
            'rootRecords.physical.reliefRegions',
            'rootRecords.physical.mountainSystems',
            'rootRecords.physical.seaRegions',
            'rootRecords.physical.riverBasins'
        ]),
        upstreamPressureDependencies: Object.freeze([
            TERRAIN_DOMAIN_CONTRACT_ID,
            HYDROLOGY_DOMAIN_CONTRACT_ID
        ]),
        routeAwareInputs: Object.freeze([
            'macroRouteId',
            'routeType',
            'reliefRegionIds',
            'seaRegionIds',
            'chokepointIds',
            'riverBasinIds'
        ]),
        forbiddenInputs: Object.freeze([
            'EnvironmentalRhythmPackage',
            'navigationWindowReliability',
            'blockedIntervalFrequency',
            'safeRouteIntervalStrength',
            'stormCadence',
            'recoveryTempo'
        ])
    });
    const TRAVEL_EXPOSURE_GENERATOR_OUTPUT_SPEC = Object.freeze({
        moduleId: TRAVEL_MODULE_ID,
        packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
        targetDomainId: 'travel',
        targetDomainContractId: TRAVEL_DOMAIN_CONTRACT_ID,
        deterministicStub: true,
        computesBurdenFields: false,
        outputShape: Object.freeze({
            domain: Object.freeze({
                travelExposure: null,
                routeReliabilityInverse: null,
                movementUncertaintyPressure: null,
                detourBurden: null
            }),
            metadata: Object.freeze({
                generatorId: TRAVEL_MODULE_ID,
                generatorVersion: TRAVEL_MODULE_VERSION,
                deterministicSeedUsed: null,
                deterministicNamespace: 'phase2.pressure.travel',
                executionMode: 'contract_first_stub',
                computedFieldIds: Object.freeze([]),
                deferredFieldIds: Object.freeze([
                    'travelExposure',
                    'routeReliabilityInverse',
                    'movementUncertaintyPressure',
                    'detourBurden'
                ])
            })
        })
    });
    const CHOKEPOINT_PRESSURE_GENERATOR_INPUT_SPEC = Object.freeze({
        moduleId: CHOKEPOINT_MODULE_ID,
        phaseId: 'PHASE_2',
        pressureSideOnly: true,
        deterministicBy: 'explicit chokepoint pressure sub-seed input',
        requiredInputs: Object.freeze({
            inputBundleContractId: INPUT_BUNDLE_CONTRACT_ID,
            recordBindingContractId: RECORD_BINDING_LAYER_CONTRACT_ID,
            targetDomainContractId: CHOKEPOINT_DOMAIN_CONTRACT_ID,
            deterministicSeedPurpose: 'pressure',
            deterministicNamespace: 'phase2.pressure.chokepoints'
        }),
        sourceCollections: Object.freeze([
            'rootRecords.structural.chokepoints',
            'rootRecords.structural.macroRoutes',
            'rootRecords.physical.reliefRegions',
            'rootRecords.physical.seaRegions'
        ]),
        upstreamPressureDependencies: Object.freeze([
            TRAVEL_DOMAIN_CONTRACT_ID
        ]),
        chokepointAwareInputs: Object.freeze([
            'chokepointId',
            'type',
            'macroRouteIds',
            'reliefRegionIds',
            'seaRegionIds',
            'throughputBias',
            'fragility'
        ]),
        forbiddenInputs: Object.freeze([
            'EnvironmentalRhythmPackage',
            'navigationWindowReliability',
            'blockedIntervalFrequency',
            'safeRouteIntervalStrength',
            'stormCadence',
            'recoveryTempo'
        ])
    });
    const CHOKEPOINT_PRESSURE_GENERATOR_OUTPUT_SPEC = Object.freeze({
        moduleId: CHOKEPOINT_MODULE_ID,
        packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
        targetDomainId: 'chokepoints',
        targetDomainContractId: CHOKEPOINT_DOMAIN_CONTRACT_ID,
        deterministicStub: true,
        computesBurdenFields: false,
        outputShape: Object.freeze({
            domain: Object.freeze({
                chokepointPressure: null,
                failureImpactPressure: null,
                dependencyConcentration: null
            }),
            metadata: Object.freeze({
                generatorId: CHOKEPOINT_MODULE_ID,
                generatorVersion: CHOKEPOINT_MODULE_VERSION,
                deterministicSeedUsed: null,
                deterministicNamespace: 'phase2.pressure.chokepoints',
                executionMode: 'contract_first_stub',
                computedFieldIds: Object.freeze([]),
                deferredFieldIds: Object.freeze([
                    'chokepointPressure',
                    'failureImpactPressure',
                    'dependencyConcentration'
                ])
            })
        })
    });
    const ISOLATION_BURDEN_GENERATOR_INPUT_SPEC = Object.freeze({
        moduleId: ISOLATION_MODULE_ID,
        phaseId: 'PHASE_2',
        pressureSideOnly: true,
        deterministicBy: 'explicit isolation pressure sub-seed input',
        requiredInputs: Object.freeze({
            inputBundleContractId: INPUT_BUNDLE_CONTRACT_ID,
            recordBindingContractId: RECORD_BINDING_LAYER_CONTRACT_ID,
            targetDomainContractId: ISOLATION_DOMAIN_CONTRACT_ID,
            deterministicSeedPurpose: 'pressure',
            deterministicNamespace: 'phase2.pressure.isolation'
        }),
        sourceCollections: Object.freeze([
            'rootRecords.structural.isolatedZones',
            'rootRecords.structural.macroRoutes',
            'rootRecords.structural.chokepoints',
            'rootRecords.physical.reliefRegions'
        ]),
        upstreamPressureDependencies: Object.freeze([
            TRAVEL_DOMAIN_CONTRACT_ID,
            CHOKEPOINT_DOMAIN_CONTRACT_ID
        ]),
        isolationAwareInputs: Object.freeze([
            'zoneId',
            'type',
            'isolation',
            'resupplyDifficulty',
            'autonomousSurvivalScore',
            'lossInCollapseLikelihood'
        ]),
        forbiddenInputs: Object.freeze([
            'EnvironmentalRhythmPackage',
            'navigationWindowReliability',
            'blockedIntervalFrequency',
            'safeRouteIntervalStrength',
            'stormCadence',
            'recoveryTempo'
        ])
    });
    const ISOLATION_BURDEN_GENERATOR_OUTPUT_SPEC = Object.freeze({
        moduleId: ISOLATION_MODULE_ID,
        packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
        targetDomainId: 'isolation',
        targetDomainContractId: ISOLATION_DOMAIN_CONTRACT_ID,
        deterministicStub: true,
        computesBurdenFields: false,
        outputShape: Object.freeze({
            domain: Object.freeze({
                isolationPressure: null,
                supportDelayBurden: null,
                peripheralExposure: null,
                accessFragility: null
            }),
            metadata: Object.freeze({
                generatorId: ISOLATION_MODULE_ID,
                generatorVersion: ISOLATION_MODULE_VERSION,
                deterministicSeedUsed: null,
                deterministicNamespace: 'phase2.pressure.isolation',
                executionMode: 'contract_first_stub',
                computedFieldIds: Object.freeze([]),
                deferredFieldIds: Object.freeze([
                    'isolationPressure',
                    'supportDelayBurden',
                    'peripheralExposure',
                    'accessFragility'
                ])
            })
        })
    });
    const ECOLOGICAL_FRAGILITY_GENERATOR_INPUT_SPEC = Object.freeze({
        moduleId: ECOLOGY_MODULE_ID,
        phaseId: 'PHASE_2',
        pressureSideOnly: true,
        deterministicBy: 'explicit ecology pressure sub-seed input',
        requiredInputs: Object.freeze({
            inputBundleContractId: INPUT_BUNDLE_CONTRACT_ID,
            recordBindingContractId: RECORD_BINDING_LAYER_CONTRACT_ID,
            targetDomainContractId: ECOLOGY_DOMAIN_CONTRACT_ID,
            deterministicSeedPurpose: 'pressure',
            deterministicNamespace: 'phase2.pressure.ecology'
        }),
        sourceCollections: Object.freeze([
            'rootRecords.physical.reliefRegions',
            'rootRecords.physical.climateBands',
            'rootRecords.physical.riverBasins',
            'rootRecords.structural.isolatedZones'
        ]),
        upstreamPressureDependencies: Object.freeze([
            CLIMATE_DOMAIN_CONTRACT_ID,
            HYDROLOGY_DOMAIN_CONTRACT_ID,
            ISOLATION_DOMAIN_CONTRACT_ID
        ]),
        supportSystemInputs: Object.freeze([
            'reliefRegionId',
            'climateBandId',
            'riverBasinId',
            'isolationZoneId',
            'resilienceSupport',
            'regenerationConstraints'
        ]),
        forbiddenInputs: Object.freeze([
            'EnvironmentalRhythmPackage',
            'seasonalityStrength',
            'scarcityCadence',
            'stormCadence',
            'recoveryTempo'
        ])
    });
    const ECOLOGICAL_FRAGILITY_GENERATOR_OUTPUT_SPEC = Object.freeze({
        moduleId: ECOLOGY_MODULE_ID,
        packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
        targetDomainId: 'ecology',
        targetDomainContractId: ECOLOGY_DOMAIN_CONTRACT_ID,
        deterministicStub: true,
        computesBurdenFields: false,
        outputShape: Object.freeze({
            domain: Object.freeze({
                ecologicalFragility: null,
                ecologicalStabilityInverse: null,
                regenerationWeakness: null,
                carryingCapacityBrittleness: null
            }),
            metadata: Object.freeze({
                generatorId: ECOLOGY_MODULE_ID,
                generatorVersion: ECOLOGY_MODULE_VERSION,
                deterministicSeedUsed: null,
                deterministicNamespace: 'phase2.pressure.ecology',
                executionMode: 'contract_first_stub',
                computedFieldIds: Object.freeze([]),
                deferredFieldIds: Object.freeze([
                    'ecologicalFragility',
                    'ecologicalStabilityInverse',
                    'regenerationWeakness',
                    'carryingCapacityBrittleness'
                ])
            })
        })
    });
    const CATASTROPHE_SUSCEPTIBILITY_GENERATOR_INPUT_SPEC = Object.freeze({
        moduleId: CATASTROPHE_MODULE_ID,
        phaseId: 'PHASE_2',
        pressureSideOnly: true,
        deterministicBy: 'explicit catastrophe pressure sub-seed input',
        requiredInputs: Object.freeze({
            inputBundleContractId: INPUT_BUNDLE_CONTRACT_ID,
            recordBindingContractId: RECORD_BINDING_LAYER_CONTRACT_ID,
            targetDomainContractId: CATASTROPHE_DOMAIN_CONTRACT_ID,
            deterministicSeedPurpose: 'pressure',
            deterministicNamespace: 'phase2.pressure.catastrophe'
        }),
        sourceCollections: Object.freeze([
            'rootRecords.physical.volcanicZones',
            'rootRecords.physical.climateBands',
            'rootRecords.physical.riverBasins',
            'rootRecords.physical.seaRegions',
            'rootRecords.physical.reliefRegions'
        ]),
        upstreamPressureDependencies: Object.freeze([
            CLIMATE_DOMAIN_CONTRACT_ID,
            HYDROLOGY_DOMAIN_CONTRACT_ID
        ]),
        causeSpecificInputs: Object.freeze([
            'volcanicZoneId',
            'climateBandId',
            'riverBasinId',
            'seaRegionId',
            'reliefRegionId',
            'stormSusceptibility',
            'floodSusceptibility',
            'droughtSusceptibility'
        ]),
        forbiddenInputs: Object.freeze([
            'EnvironmentalRhythmPackage',
            'stormCadence',
            'navigationWindowReliability',
            'scarcityCadence',
            'recoveryTempo'
        ])
    });
    const CATASTROPHE_SUSCEPTIBILITY_GENERATOR_OUTPUT_SPEC = Object.freeze({
        moduleId: CATASTROPHE_MODULE_ID,
        packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
        targetDomainId: 'catastrophe',
        targetDomainContractId: CATASTROPHE_DOMAIN_CONTRACT_ID,
        deterministicStub: false,
        computesBurdenFields: true,
        outputShape: Object.freeze({
            domain: Object.freeze({
                catastrophePressure: null,
                stormBreakRisk: null,
                volcanicInstability: null,
                floodBreakRisk: null,
                droughtBreakRisk: null
            }),
            metadata: Object.freeze({
                generatorId: CATASTROPHE_MODULE_ID,
                generatorVersion: CATASTROPHE_MODULE_VERSION,
                deterministicSeedUsed: null,
                deterministicNamespace: 'phase2.pressure.catastrophe',
                executionMode: 'implemented_coarse_pressure_interpreter',
                computedFieldIds: Object.freeze([
                    'catastrophePressure',
                    'stormBreakRisk',
                    'volcanicInstability',
                    'floodBreakRisk',
                    'droughtBreakRisk'
                ]),
                deferredFieldIds: Object.freeze([])
            })
        })
    });
    const PRESSURE_SYNTHESIS_INPUT_SPEC = Object.freeze({
        moduleId: PRESSURE_SYNTHESIS_MODULE_ID,
        phaseId: 'PHASE_2',
        pressureSideOnly: true,
        deterministicBy: 'explicit pressure synthesis sub-seed input',
        requiredInputs: Object.freeze({
            inputBundleContractId: INPUT_BUNDLE_CONTRACT_ID,
            recordBindingContractId: RECORD_BINDING_LAYER_CONTRACT_ID,
            pressurePackageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
            synthesizedSchemaContractId: PRESSURE_SYNTHESIZED_SCHEMA_CONTRACT_ID,
            deterministicSeedPurpose: 'pressure',
            deterministicNamespace: 'phase2.pressure.synthesis'
        }),
        requiredDomainLayers: PRESSURE_DOMAIN_IDS,
        synthesizedFieldIds: PRESSURE_SYNTHESIZED_FIELD_IDS,
        forbiddenInputs: Object.freeze([
            'EnvironmentalRhythmPackage',
            'seasonalityStrength',
            'stormCadence',
            'navigationWindowReliability',
            'scarcityCadence',
            'predictability',
            'ruptureFrequency',
            'recoveryTempo'
        ])
    });
    const PRESSURE_SYNTHESIS_OUTPUT_SPEC = Object.freeze({
        moduleId: PRESSURE_SYNTHESIS_MODULE_ID,
        packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
        synthesizedSchemaContractId: PRESSURE_SYNTHESIZED_SCHEMA_CONTRACT_ID,
        deterministicStub: false,
        computesSynthesizedFields: true,
        preservesDomainLayers: true,
        flattensToDifficultyScalar: false,
        outputShape: Object.freeze({
            synthesized: Object.freeze({
                survivabilityPressure: null,
                mobilityPressure: null,
                supplyPressure: null,
                chokepointStress: null,
                remotenessBurden: null,
                ecologicalBurden: null,
                catastropheSusceptibility: null
            }),
            domainLayers: Object.freeze({
                climate: null,
                terrain: null,
                hydrology: null,
                food: null,
                travel: null,
                chokepoints: null,
                isolation: null,
                ecology: null,
                catastrophe: null
            }),
            metadata: Object.freeze({
                synthesisId: PRESSURE_SYNTHESIS_MODULE_ID,
                synthesisVersion: PRESSURE_SYNTHESIS_MODULE_VERSION,
                deterministicSeedUsed: null,
                deterministicNamespace: 'phase2.pressure.synthesis',
                executionMode: 'implemented_pressure_synthesis',
                computedFieldIds: PRESSURE_SYNTHESIZED_FIELD_IDS,
                preservedDomainLayerIds: PRESSURE_DOMAIN_IDS,
                deferredFieldIds: Object.freeze([])
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

    function normalizeNumber(value, fallback = 0) {
        const numericValue = Number(value);
        return Number.isFinite(numericValue)
            ? numericValue
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

    function inferClimateSignals(climateBand = {}) {
        const temperatureBias = clamp01(climateBand.temperatureBias);
        const humidityBias = clamp01(climateBand.humidityBias);
        const bandType = normalizeString(climateBand.bandType, '').toLowerCase();
        const seaRegionIds = Array.isArray(climateBand.seaRegionIds) ? climateBand.seaRegionIds : [];
        const humidBandBonus = bandType.includes('humid') ? 0.18 : 0;
        const dryBandBonus = bandType.includes('dry') ? 0.22 : 0;
        const maritimeExposure = seaRegionIds.length ? 0.08 : 0;

        const coldBase = clamp01((CLIMATE_BURDEN_CONTRAST_POLICY.coldPivot - temperatureBias) / CLIMATE_BURDEN_CONTRAST_POLICY.coldPivot);
        const heatBase = clamp01((temperatureBias - CLIMATE_BURDEN_CONTRAST_POLICY.heatPivot) / (1 - CLIMATE_BURDEN_CONTRAST_POLICY.heatPivot));
        const humidityBase = clamp01(((humidityBias - CLIMATE_BURDEN_CONTRAST_POLICY.humidityPivot) / (1 - CLIMATE_BURDEN_CONTRAST_POLICY.humidityPivot)) + humidBandBonus - (dryBandBonus * 0.35));
        const drynessSignal = applyContrastCurve(
            clamp01(((1 - humidityBias) * 0.72) + dryBandBonus),
            CLIMATE_BURDEN_CONTRAST_POLICY.contrastExponent,
            0.5
        );

        const coldSignal = applyThresholdContrast(coldBase, 0.08, CLIMATE_BURDEN_CONTRAST_POLICY.contrastExponent);
        const heatSignal = applyThresholdContrast(heatBase, 0.08, CLIMATE_BURDEN_CONTRAST_POLICY.contrastExponent);
        const humiditySignal = applyThresholdContrast(humidityBase, 0.12, CLIMATE_BURDEN_CONTRAST_POLICY.contrastExponent);
        const thermalExtremity = Math.max(coldSignal, heatSignal);
        const exposureBase = clamp01(
            (thermalExtremity * 0.56)
            + (humiditySignal * 0.16)
            + (drynessSignal * 0.2)
            + maritimeExposure
        );
        const climateExposureSignal = applyContrastCurve(
            exposureBase,
            CLIMATE_BURDEN_CONTRAST_POLICY.exposureExponent,
            0.48
        );

        return {
            bandType,
            temperatureBias,
            humidityBias,
            coldSignal: roundValue(coldSignal),
            heatSignal: roundValue(heatSignal),
            humiditySignal: roundValue(humiditySignal),
            drynessSignal: roundValue(drynessSignal),
            climateExposureSignal: roundValue(climateExposureSignal)
        };
    }

    function resolveClimateBands(input = {}) {
        const inputBundle = isPlainObject(input.inputBundle) ? input.inputBundle : null;
        if (
            !inputBundle
            || !isPlainObject(inputBundle.recordCollections)
            || !isPlainObject(inputBundle.recordCollections.physical)
            || !Array.isArray(inputBundle.recordCollections.physical.climateBands)
        ) {
            throw new Error('[worldgen/phase2] ClimateBurdenInterpreter requires Phase2InputBundle.recordCollections.physical.climateBands.');
        }

        return inputBundle.recordCollections.physical.climateBands;
    }

    function resolveBindingContextId(input = {}) {
        const recordBinding = isPlainObject(input.recordBinding) ? input.recordBinding : null;
        if (recordBinding && normalizeString(recordBinding.recordBindingContextId, '')) {
            return normalizeString(recordBinding.recordBindingContextId);
        }

        return '';
    }

    function resolveReliefRegions(input = {}) {
        const inputBundle = isPlainObject(input.inputBundle) ? input.inputBundle : null;
        if (
            !inputBundle
            || !isPlainObject(inputBundle.recordCollections)
            || !isPlainObject(inputBundle.recordCollections.physical)
            || !Array.isArray(inputBundle.recordCollections.physical.reliefRegions)
        ) {
            throw new Error('[worldgen/phase2] TerrainHarshnessGenerator requires Phase2InputBundle.recordCollections.physical.reliefRegions.');
        }

        return inputBundle.recordCollections.physical.reliefRegions;
    }

    function resolveMountainSystems(input = {}) {
        const inputBundle = isPlainObject(input.inputBundle) ? input.inputBundle : null;
        if (
            !inputBundle
            || !isPlainObject(inputBundle.recordCollections)
            || !isPlainObject(inputBundle.recordCollections.physical)
            || !Array.isArray(inputBundle.recordCollections.physical.mountainSystems)
        ) {
            throw new Error('[worldgen/phase2] TerrainHarshnessGenerator requires Phase2InputBundle.recordCollections.physical.mountainSystems.');
        }

        return inputBundle.recordCollections.physical.mountainSystems;
    }

    function resolveRiverBasins(input = {}) {
        const inputBundle = isPlainObject(input.inputBundle) ? input.inputBundle : null;
        if (
            !inputBundle
            || !isPlainObject(inputBundle.recordCollections)
            || !isPlainObject(inputBundle.recordCollections.physical)
            || !Array.isArray(inputBundle.recordCollections.physical.riverBasins)
        ) {
            throw new Error('[worldgen/phase2] HydrologyStressGenerator requires Phase2InputBundle.recordCollections.physical.riverBasins.');
        }

        return inputBundle.recordCollections.physical.riverBasins;
    }

    function resolveSeaRegions(input = {}) {
        const inputBundle = isPlainObject(input.inputBundle) ? input.inputBundle : null;
        if (
            !inputBundle
            || !isPlainObject(inputBundle.recordCollections)
            || !isPlainObject(inputBundle.recordCollections.physical)
            || !Array.isArray(inputBundle.recordCollections.physical.seaRegions)
        ) {
            throw new Error('[worldgen/phase2] HydrologyStressGenerator requires Phase2InputBundle.recordCollections.physical.seaRegions.');
        }

        return inputBundle.recordCollections.physical.seaRegions;
    }

    function resolveVolcanicZones(input = {}) {
        const inputBundle = isPlainObject(input.inputBundle) ? input.inputBundle : null;
        if (
            !inputBundle
            || !isPlainObject(inputBundle.recordCollections)
            || !isPlainObject(inputBundle.recordCollections.physical)
            || !Array.isArray(inputBundle.recordCollections.physical.volcanicZones)
        ) {
            throw new Error('[worldgen/phase2] CatastropheSusceptibilityGenerator requires Phase2InputBundle.recordCollections.physical.volcanicZones.');
        }

        return inputBundle.recordCollections.physical.volcanicZones;
    }

    function resolveMacroRoutes(input = {}) {
        const inputBundle = isPlainObject(input.inputBundle) ? input.inputBundle : null;
        if (
            !inputBundle
            || !isPlainObject(inputBundle.recordCollections)
            || !isPlainObject(inputBundle.recordCollections.structural)
            || !Array.isArray(inputBundle.recordCollections.structural.macroRoutes)
        ) {
            throw new Error('[worldgen/phase2] TravelExposureGenerator requires Phase2InputBundle.recordCollections.structural.macroRoutes.');
        }

        return inputBundle.recordCollections.structural.macroRoutes;
    }

    function resolveChokepoints(input = {}) {
        const inputBundle = isPlainObject(input.inputBundle) ? input.inputBundle : null;
        if (
            !inputBundle
            || !isPlainObject(inputBundle.recordCollections)
            || !isPlainObject(inputBundle.recordCollections.structural)
            || !Array.isArray(inputBundle.recordCollections.structural.chokepoints)
        ) {
            throw new Error('[worldgen/phase2] ChokepointPressureGenerator requires Phase2InputBundle.recordCollections.structural.chokepoints.');
        }

        return inputBundle.recordCollections.structural.chokepoints;
    }

    function resolveIsolatedZones(input = {}) {
        const inputBundle = isPlainObject(input.inputBundle) ? input.inputBundle : null;
        if (
            !inputBundle
            || !isPlainObject(inputBundle.recordCollections)
            || !isPlainObject(inputBundle.recordCollections.structural)
            || !Array.isArray(inputBundle.recordCollections.structural.isolatedZones)
        ) {
            throw new Error('[worldgen/phase2] IsolationBurdenGenerator requires Phase2InputBundle.recordCollections.structural.isolatedZones.');
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

    function buildClimateBandScoreEntry(climateBand = {}, signalKey, value) {
        return Object.freeze({
            recordType: 'climateBands',
            recordId: normalizeString(climateBand.climateBandId, ''),
            bandType: normalizeString(climateBand.bandType, ''),
            primaryReliefRegionId: normalizeString(climateBand.primaryReliefRegionId, ''),
            reliefRegionIds: uniqueStrings(climateBand.reliefRegionIds),
            seaRegionIds: uniqueStrings(climateBand.seaRegionIds),
            signalKey,
            value: roundValue(value),
            sourceTruth: Object.freeze({
                temperatureBias: roundValue(clamp01(climateBand.temperatureBias)),
                humidityBias: roundValue(clamp01(climateBand.humidityBias)),
                seasonalityBias: roundValue(clamp01(climateBand.seasonalityBias))
            })
        });
    }

    function buildClimatePressureField(fieldId, climateBands, signalKey, description, interpreterSeed) {
        const perBandScores = climateBands.map((climateBand) => {
            const signals = inferClimateSignals(climateBand);
            return buildClimateBandScoreEntry(climateBand, signalKey, signals[signalKey]);
        });
        const values = perBandScores.map((entry) => entry.value);

        return Object.freeze({
            type: 'phase2ScalarField',
            fieldId,
            domainId: 'climate',
            ownership: 'pressure',
            deterministic: true,
            derivationMode: 'coarse_record_truth_only',
            sourceRecordType: 'climateBands',
            sourceFieldIds: Object.freeze([
                'bandType',
                'temperatureBias',
                'humidityBias'
            ]),
            climateGenerationRebuilt: false,
            mixesTimingSemantics: false,
            contrastPolicy: CLIMATE_BURDEN_CONTRAST_POLICY.policyId,
            description,
            deterministicSeedUsed: interpreterSeed,
            perBandScores,
            summary: Object.freeze({
                recordCount: perBandScores.length,
                mean: roundValue(mean(values)),
                min: roundValue(values.length ? Math.min(...values) : 0),
                max: roundValue(values.length ? Math.max(...values) : 0)
            })
        });
    }

    function indexMountainSystemsByReliefRegion(mountainSystems = []) {
        return mountainSystems.reduce((index, mountainSystem) => {
            const reliefRegionIds = uniqueStrings(mountainSystem.reliefRegionIds);
            reliefRegionIds.forEach((reliefRegionId) => {
                if (!index[reliefRegionId]) {
                    index[reliefRegionId] = [];
                }
                index[reliefRegionId].push(mountainSystem);
            });
            return index;
        }, {});
    }

    function inferTerrainSignals(reliefRegion = {}, linkedMountainSystems = []) {
        const elevationBias = clamp01(reliefRegion.elevationBias);
        const ruggednessBias = clamp01(reliefRegion.ruggednessBias);
        const coastalInfluence = clamp01(reliefRegion.coastalInfluence);
        const reliefType = normalizeString(reliefRegion.reliefType, '').toLowerCase();

        const linkedCount = linkedMountainSystems.length;
        const mountainUplift = mean(linkedMountainSystems.map((mountainSystem) => clamp01(mountainSystem.upliftBias)));
        const ridgeContinuity = mean(linkedMountainSystems.map((mountainSystem) => clamp01(mountainSystem.ridgeContinuity)));
        const mountainTypeBonus = linkedMountainSystems.some((mountainSystem) => {
            const systemType = normalizeString(mountainSystem.systemType, '').toLowerCase();
            return systemType.includes('folded') || systemType.includes('highland') || systemType.includes('ridge');
        }) ? 0.08 : 0;

        const reliefTypeHarshnessBonus = (
            reliefType.includes('mountain')
            || reliefType.includes('escarpment')
            || reliefType.includes('upland')
        ) ? 0.1 : 0;
        const reliefTypeSlopeBonus = (
            reliefType.includes('mountain')
            || reliefType.includes('escarpment')
        ) ? 0.12 : 0;
        const reliefTypeFragmentationBonus = (
            reliefType.includes('coast')
            || reliefType.includes('basin')
            || reliefType.includes('broken')
        ) ? 0.08 : 0;
        const terrainHarshnessBase = clamp01(
            (elevationBias * 0.28)
            + (ruggednessBias * 0.4)
            + (mountainUplift * 0.2)
            + (ridgeContinuity * 0.04)
            + reliefTypeHarshnessBonus
            + mountainTypeBonus
        );
        const slopeBurdenBase = clamp01(
            (elevationBias * 0.48)
            + (ruggednessBias * 0.24)
            + (mountainUplift * 0.2)
            + reliefTypeSlopeBonus
        );
        const fragmentationBurdenBase = clamp01(
            (ruggednessBias * 0.32)
            + ((1 - ridgeContinuity) * 0.18)
            + (coastalInfluence * 0.22)
            + (Math.min(linkedCount, 3) / 3 * 0.12)
            + reliefTypeFragmentationBonus
        );
        const terrainHarshness = applyThresholdContrast(
            terrainHarshnessBase,
            TERRAIN_BURDEN_CONTRAST_POLICY.harshnessThreshold,
            mountainUplift > 0.4 || reliefType.includes('mountain')
                ? TERRAIN_BURDEN_CONTRAST_POLICY.barrierExponent
                : TERRAIN_BURDEN_CONTRAST_POLICY.contrastExponent
        );
        const slopeBurden = applyThresholdContrast(
            slopeBurdenBase,
            TERRAIN_BURDEN_CONTRAST_POLICY.slopeThreshold,
            elevationBias > 0.65
                ? TERRAIN_BURDEN_CONTRAST_POLICY.barrierExponent
                : TERRAIN_BURDEN_CONTRAST_POLICY.contrastExponent
        );
        const fragmentationBurden = applyThresholdContrast(
            fragmentationBurdenBase,
            TERRAIN_BURDEN_CONTRAST_POLICY.fragmentationThreshold,
            reliefType.includes('coast') || ruggednessBias > 0.55
                ? TERRAIN_BURDEN_CONTRAST_POLICY.barrierExponent
                : TERRAIN_BURDEN_CONTRAST_POLICY.contrastExponent
        );
        const mobilityTerrainPenaltyBase = clamp01(
            (terrainHarshness * 0.36)
            + (slopeBurden * 0.32)
            + (fragmentationBurden * 0.22)
            + (mountainUplift * 0.1)
        );
        const mobilityTerrainPenalty = applyThresholdContrast(
            mobilityTerrainPenaltyBase,
            TERRAIN_BURDEN_CONTRAST_POLICY.mobilityThreshold,
            terrainHarshness > 0.45 || slopeBurden > 0.45
                ? TERRAIN_BURDEN_CONTRAST_POLICY.barrierExponent
                : TERRAIN_BURDEN_CONTRAST_POLICY.contrastExponent
        );

        return {
            reliefType,
            elevationBias,
            ruggednessBias,
            coastalInfluence,
            linkedMountainSystemCount: linkedCount,
            mountainUplift: roundValue(mountainUplift),
            ridgeContinuity: roundValue(ridgeContinuity),
            terrainHarshness: roundValue(terrainHarshness),
            slopeBurden: roundValue(slopeBurden),
            fragmentationBurden: roundValue(fragmentationBurden),
            mobilityTerrainPenalty: roundValue(mobilityTerrainPenalty)
        };
    }

    function buildTerrainScoreEntry(reliefRegion = {}, signalKey, value, linkedMountainSystems = []) {
        return Object.freeze({
            recordType: 'reliefRegions',
            recordId: normalizeString(reliefRegion.reliefRegionId, ''),
            reliefType: normalizeString(reliefRegion.reliefType, ''),
            continentIds: uniqueStrings(reliefRegion.continentIds),
            adjacentSeaRegionIds: uniqueStrings(reliefRegion.adjacentSeaRegionIds),
            linkedMountainSystemIds: uniqueStrings(linkedMountainSystems.map((mountainSystem) => mountainSystem.mountainSystemId)),
            signalKey,
            value: roundValue(value),
            sourceTruth: Object.freeze({
                elevationBias: roundValue(clamp01(reliefRegion.elevationBias)),
                ruggednessBias: roundValue(clamp01(reliefRegion.ruggednessBias)),
                coastalInfluence: roundValue(clamp01(reliefRegion.coastalInfluence))
            })
        });
    }

    function buildTerrainPressureField(fieldId, reliefRegions, mountainIndex, signalKey, description, generatorSeed) {
        const perReliefScores = reliefRegions.map((reliefRegion) => {
            const reliefRegionId = normalizeString(reliefRegion.reliefRegionId, '');
            const linkedMountainSystems = Array.isArray(mountainIndex[reliefRegionId])
                ? mountainIndex[reliefRegionId]
                : [];
            const signals = inferTerrainSignals(reliefRegion, linkedMountainSystems);
            return buildTerrainScoreEntry(
                reliefRegion,
                signalKey,
                signals[signalKey],
                linkedMountainSystems
            );
        });
        const values = perReliefScores.map((entry) => entry.value);

        return Object.freeze({
            type: 'phase2ScalarField',
            fieldId,
            domainId: 'terrain',
            ownership: 'pressure',
            deterministic: true,
            derivationMode: 'coarse_record_truth_only',
            sourceRecordType: 'reliefRegions',
            sourceFieldIds: Object.freeze([
                'reliefType',
                'elevationBias',
                'ruggednessBias',
                'coastalInfluence'
            ]),
            supportRecordType: 'mountainSystems',
            supportFieldIds: Object.freeze([
                'systemType',
                'upliftBias',
                'ridgeContinuity',
                'reliefRegionIds'
            ]),
            climateGenerationRebuilt: false,
            mixesTimingSemantics: false,
            contrastPolicy: TERRAIN_BURDEN_CONTRAST_POLICY.policyId,
            description,
            deterministicSeedUsed: generatorSeed,
            perReliefScores,
            summary: Object.freeze({
                recordCount: perReliefScores.length,
                mean: roundValue(mean(values)),
                min: roundValue(values.length ? Math.min(...values) : 0),
                max: roundValue(values.length ? Math.max(...values) : 0)
            })
        });
    }

    function indexById(records = [], idKey) {
        return records.reduce((index, record) => {
            const recordId = normalizeString(record && record[idKey], '');
            if (recordId) {
                index[recordId] = record;
            }
            return index;
        }, {});
    }

    function inferHydrologySignals(riverBasin = {}, mountainIndex = {}, seaRegionIndex = {}) {
        const basinType = normalizeString(riverBasin.basinType, '').toLowerCase();
        const catchmentScale = clamp01(riverBasin.catchmentScale);
        const basinContinuity = clamp01(riverBasin.basinContinuity);
        const sourceMountainSystemIds = uniqueStrings(riverBasin.sourceMountainSystemIds);
        const terminalSeaRegionIds = uniqueStrings(riverBasin.terminalSeaRegionIds);

        const linkedMountains = sourceMountainSystemIds
            .map((mountainSystemId) => mountainIndex[mountainSystemId])
            .filter(Boolean);
        const linkedTerminalSeas = terminalSeaRegionIds
            .map((seaRegionId) => seaRegionIndex[seaRegionId])
            .filter(Boolean);

        const mountainUplift = mean(linkedMountains.map((mountainSystem) => clamp01(mountainSystem.upliftBias)));
        const ridgeContinuity = mean(linkedMountains.map((mountainSystem) => clamp01(mountainSystem.ridgeContinuity)));
        const terminalDrainageSupport = terminalSeaRegionIds.length
            ? clamp01(0.35 + (Math.min(terminalSeaRegionIds.length, 2) * 0.18))
            : 0;
        const endorheicPenalty = basinType.includes('endorheic') ? 0.28 : 0;
        const deltaicFloodBonus = basinType.includes('deltaic') ? 0.18 : 0;
        const exorheicReliabilityBonus = basinType.includes('exorheic') ? 0.12 : 0;
        const inlandSeaModifier = basinType.includes('inland_sea') ? 0.08 : 0;

        const waterReliabilityBase = clamp01(
            (catchmentScale * 0.28)
            + (basinContinuity * 0.3)
            + (mountainUplift * 0.16)
            + (ridgeContinuity * 0.08)
            + terminalDrainageSupport
            + exorheicReliabilityBonus
            + inlandSeaModifier
            - endorheicPenalty
        );
        const brittleBasin = basinType.includes('endorheic') || basinContinuity < 0.45;
        const stableBasin = basinType.includes('exorheic') && terminalSeaRegionIds.length > 0 && basinContinuity > 0.62;
        const waterReliabilityInverseBase = clamp01(1 - waterReliabilityBase);
        const waterReliabilityInverse = applyThresholdContrast(
            waterReliabilityInverseBase,
            HYDROLOGY_BURDEN_CONTRAST_POLICY.reliabilityThreshold,
            brittleBasin
                ? HYDROLOGY_BURDEN_CONTRAST_POLICY.brittleExponent
                : HYDROLOGY_BURDEN_CONTRAST_POLICY.stableExponent
        );
        const waterStressBase = clamp01(
            (waterReliabilityInverseBase * 0.52)
            + ((1 - basinContinuity) * 0.2)
            + (endorheicPenalty * 0.5)
            + ((1 - catchmentScale) * 0.18)
        );
        const waterStress = applyThresholdContrast(
            waterStressBase,
            HYDROLOGY_BURDEN_CONTRAST_POLICY.stressThreshold,
            brittleBasin
                ? HYDROLOGY_BURDEN_CONTRAST_POLICY.brittleExponent
                : HYDROLOGY_BURDEN_CONTRAST_POLICY.contrastExponent
        );
        const droughtPressureBase = clamp01(
            (waterReliabilityInverseBase * 0.46)
            + ((1 - catchmentScale) * 0.24)
            + ((1 - mountainUplift) * 0.12)
            + (endorheicPenalty * 0.4)
        );
        const droughtPressure = applyThresholdContrast(
            droughtPressureBase,
            HYDROLOGY_BURDEN_CONTRAST_POLICY.droughtThreshold,
            brittleBasin
                ? HYDROLOGY_BURDEN_CONTRAST_POLICY.brittleExponent
                : HYDROLOGY_BURDEN_CONTRAST_POLICY.contrastExponent
        );
        const floodInstabilityBase = clamp01(
            (catchmentScale * 0.24)
            + (mountainUplift * 0.2)
            + ((1 - basinContinuity) * 0.18)
            + (deltaicFloodBonus * 0.6)
            + (terminalSeaRegionIds.length ? 0.08 : 0)
        );
        const floodInstability = applyThresholdContrast(
            floodInstabilityBase,
            HYDROLOGY_BURDEN_CONTRAST_POLICY.floodThreshold,
            stableBasin && !deltaicFloodBonus
                ? HYDROLOGY_BURDEN_CONTRAST_POLICY.stableExponent
                : HYDROLOGY_BURDEN_CONTRAST_POLICY.contrastExponent
        );

        return {
            basinType,
            catchmentScale,
            basinContinuity,
            linkedMountainSystemCount: linkedMountains.length,
            linkedTerminalSeaCount: linkedTerminalSeas.length,
            mountainUplift: roundValue(mountainUplift),
            ridgeContinuity: roundValue(ridgeContinuity),
            waterReliabilityInverse: roundValue(waterReliabilityInverse),
            waterStress: roundValue(waterStress),
            droughtPressure: roundValue(droughtPressure),
            floodInstability: roundValue(floodInstability)
        };
    }

    function buildHydrologyScoreEntry(riverBasin = {}, signalKey, value) {
        return Object.freeze({
            recordType: 'riverBasins',
            recordId: normalizeString(riverBasin.riverBasinId, ''),
            basinType: normalizeString(riverBasin.basinType, ''),
            primaryReliefRegionId: normalizeString(riverBasin.primaryReliefRegionId, ''),
            primaryClimateBandId: normalizeString(riverBasin.primaryClimateBandId, ''),
            reliefRegionIds: uniqueStrings(riverBasin.reliefRegionIds),
            sourceMountainSystemIds: uniqueStrings(riverBasin.sourceMountainSystemIds),
            terminalSeaRegionIds: uniqueStrings(riverBasin.terminalSeaRegionIds),
            signalKey,
            value: roundValue(value),
            sourceTruth: Object.freeze({
                catchmentScale: roundValue(clamp01(riverBasin.catchmentScale)),
                basinContinuity: roundValue(clamp01(riverBasin.basinContinuity))
            })
        });
    }

    function buildHydrologyPressureField(fieldId, riverBasins, mountainIndex, seaRegionIndex, signalKey, description, generatorSeed) {
        const perBasinScores = riverBasins.map((riverBasin) => {
            const signals = inferHydrologySignals(riverBasin, mountainIndex, seaRegionIndex);
            return buildHydrologyScoreEntry(riverBasin, signalKey, signals[signalKey]);
        });
        const values = perBasinScores.map((entry) => entry.value);

        return Object.freeze({
            type: 'phase2ScalarField',
            fieldId,
            domainId: 'hydrology',
            ownership: 'pressure',
            deterministic: true,
            derivationMode: 'coarse_record_truth_only',
            sourceRecordType: 'riverBasins',
            sourceFieldIds: Object.freeze([
                'basinType',
                'catchmentScale',
                'basinContinuity'
            ]),
            supportRecordTypes: Object.freeze([
                'mountainSystems',
                'seaRegions'
            ]),
            supportFieldIds: Object.freeze([
                'sourceMountainSystemIds',
                'terminalSeaRegionIds',
                'upliftBias',
                'ridgeContinuity'
            ]),
            hydrologyGenerationRebuilt: false,
            mixesTimingSemantics: false,
            contrastPolicy: HYDROLOGY_BURDEN_CONTRAST_POLICY.policyId,
            description,
            deterministicSeedUsed: generatorSeed,
            perBasinScores,
            summary: Object.freeze({
                recordCount: perBasinScores.length,
                mean: roundValue(mean(values)),
                min: roundValue(values.length ? Math.min(...values) : 0),
                max: roundValue(values.length ? Math.max(...values) : 0)
            })
        });
    }

    function inferFoodSignals(climateBand = {}, context = {}) {
        const climateScores = context.climateScores || {};
        const terrainScores = context.terrainScores || {};
        const hydrologyScores = context.hydrologyScores || {};
        const climateBandId = normalizeString(climateBand.climateBandId, '');
        const reliefRegionIds = uniqueStrings(climateBand.reliefRegionIds);
        const climateBandIds = climateBandId ? [climateBandId] : [];

        const coldPressure = clamp01(climateScores.coldPressure[climateBandId] || 0);
        const heatPressure = clamp01(climateScores.heatPressure[climateBandId] || 0);
        const humidityPressure = clamp01(climateScores.humidityPressure[climateBandId] || 0);
        const climateExposurePressure = clamp01(climateScores.climateExposurePressure[climateBandId] || 0);

        const terrainHarshness = clamp01(meanByRecordIds(terrainScores.terrainHarshness, reliefRegionIds));
        const slopeBurden = clamp01(meanByRecordIds(terrainScores.slopeBurden, reliefRegionIds));
        const fragmentationBurden = clamp01(meanByRecordIds(terrainScores.fragmentationBurden, reliefRegionIds));
        const mobilityTerrainPenalty = clamp01(meanByRecordIds(terrainScores.mobilityTerrainPenalty, reliefRegionIds));

        const waterReliabilityInverse = clamp01(meanByRecordIds(hydrologyScores.waterReliabilityInverse, climateBandIds));
        const waterStress = clamp01(meanByRecordIds(hydrologyScores.waterStress, climateBandIds));
        const droughtPressure = clamp01(meanByRecordIds(hydrologyScores.droughtPressure, climateBandIds));
        const floodInstability = clamp01(meanByRecordIds(hydrologyScores.floodInstability, climateBandIds));

        const climateBurdenBlend = clamp01(
            (coldPressure * 0.18)
            + (heatPressure * 0.2)
            + (humidityPressure * 0.14)
            + (climateExposurePressure * 0.22)
        );
        const terrainBurdenBlend = clamp01(
            (terrainHarshness * 0.22)
            + (slopeBurden * 0.18)
            + (fragmentationBurden * 0.16)
            + (mobilityTerrainPenalty * 0.12)
        );
        const hydrologyBurdenBlend = clamp01(
            (waterReliabilityInverse * 0.28)
            + (waterStress * 0.26)
            + (droughtPressure * 0.22)
            + (floodInstability * 0.12)
        );

        const foodReliabilityInverseBase = clamp01(
            (hydrologyBurdenBlend * 0.54)
            + (terrainBurdenBlend * 0.2)
            + (climateBurdenBlend * 0.18)
        );
        const fertilitySupportInverseBase = clamp01(
            (climateBurdenBlend * 0.42)
            + (terrainHarshness * 0.18)
            + (slopeBurden * 0.12)
            + (waterStress * 0.16)
            + (droughtPressure * 0.08)
        );
        const scarcityBaselineBase = clamp01(
            (foodReliabilityInverseBase * 0.38)
            + (fertilitySupportInverseBase * 0.28)
            + (waterStress * 0.16)
            + (mobilityTerrainPenalty * 0.1)
            + (fragmentationBurden * 0.08)
        );
        const foodStressBase = clamp01(
            (foodReliabilityInverseBase * 0.34)
            + (fertilitySupportInverseBase * 0.28)
            + (scarcityBaselineBase * 0.24)
            + (climateExposurePressure * 0.08)
            + (waterStress * 0.06)
        );
        const supportRichness = clamp01(
            1
            - (
                (foodReliabilityInverseBase * 0.36)
                + (fertilitySupportInverseBase * 0.28)
                + (scarcityBaselineBase * 0.2)
                + (climateExposurePressure * 0.08)
                + (terrainHarshness * 0.04)
                + (waterStress * 0.04)
            )
        );
        const supportCompression = applyThresholdContrast(
            supportRichness,
            FOOD_BURDEN_CONTRAST_POLICY.supportRichDeadband,
            FOOD_BURDEN_CONTRAST_POLICY.supportExponent
        );
        const brittleEscalation = applyThresholdContrast(
            clamp01(foodReliabilityInverseBase),
            FOOD_BURDEN_CONTRAST_POLICY.brittleEscalationStart,
            FOOD_BURDEN_CONTRAST_POLICY.brittleExponent
        );
        const calibratedFoodReliabilityInverse = clamp01(
            applyThresholdContrast(
                foodReliabilityInverseBase,
                FOOD_BURDEN_CONTRAST_POLICY.foodReliabilityThreshold,
                FOOD_BURDEN_CONTRAST_POLICY.brittleExponent
            )
            * (1 - (supportCompression * 0.52))
            + (brittleEscalation * 0.16)
        );
        const calibratedFertilitySupportInverse = clamp01(
            applyThresholdContrast(
                fertilitySupportInverseBase,
                FOOD_BURDEN_CONTRAST_POLICY.fertilityThreshold,
                FOOD_BURDEN_CONTRAST_POLICY.contrastExponent
            )
            * (1 - (supportCompression * 0.38))
        );
        const calibratedScarcityBaseline = clamp01(
            applyThresholdContrast(
                scarcityBaselineBase,
                FOOD_BURDEN_CONTRAST_POLICY.scarcityBaselineThreshold,
                FOOD_BURDEN_CONTRAST_POLICY.brittleExponent
            )
            * (1 - (supportCompression * 0.34))
            + (brittleEscalation * 0.12)
        );
        const calibratedFoodStress = clamp01(
            applyThresholdContrast(
                foodStressBase,
                FOOD_BURDEN_CONTRAST_POLICY.foodStressThreshold,
                FOOD_BURDEN_CONTRAST_POLICY.contrastExponent
            )
            * (1 - (supportCompression * 0.28))
            + (brittleEscalation * 0.1)
        );

        return {
            reliefRegionIds,
            coldPressure: roundValue(coldPressure),
            heatPressure: roundValue(heatPressure),
            humidityPressure: roundValue(humidityPressure),
            climateExposurePressure: roundValue(climateExposurePressure),
            terrainHarshness: roundValue(terrainHarshness),
            slopeBurden: roundValue(slopeBurden),
            fragmentationBurden: roundValue(fragmentationBurden),
            mobilityTerrainPenalty: roundValue(mobilityTerrainPenalty),
            waterReliabilityInverse: roundValue(waterReliabilityInverse),
            waterStress: roundValue(waterStress),
            droughtPressure: roundValue(droughtPressure),
            floodInstability: roundValue(floodInstability),
            supportRichness: roundValue(supportRichness),
            foodReliabilityInverse: roundValue(calibratedFoodReliabilityInverse),
            fertilitySupportInverse: roundValue(calibratedFertilitySupportInverse),
            scarcityBaseline: roundValue(calibratedScarcityBaseline),
            foodStress: roundValue(calibratedFoodStress)
        };
    }

    function buildFoodScoreEntry(climateBand = {}, signalKey, value, signals = {}) {
        return Object.freeze({
            recordType: 'climateBands',
            recordId: normalizeString(climateBand.climateBandId, ''),
            bandType: normalizeString(climateBand.bandType, ''),
            primaryReliefRegionId: normalizeString(climateBand.primaryReliefRegionId, ''),
            reliefRegionIds: uniqueStrings(climateBand.reliefRegionIds),
            seaRegionIds: uniqueStrings(climateBand.seaRegionIds),
            signalKey,
            value: roundValue(value),
            sourceTruth: Object.freeze({
                temperatureBias: roundValue(clamp01(climateBand.temperatureBias)),
                humidityBias: roundValue(clamp01(climateBand.humidityBias)),
                seasonalityBias: roundValue(clamp01(climateBand.seasonalityBias))
            }),
            upstreamBurdenSnapshot: Object.freeze({
                climateExposurePressure: signals.climateExposurePressure || 0,
                terrainHarshness: signals.terrainHarshness || 0,
                waterStress: signals.waterStress || 0,
                droughtPressure: signals.droughtPressure || 0,
                supportRichness: signals.supportRichness || 0
            })
        });
    }

    function buildFoodPressureField(fieldId, climateBands, context, signalKey, description, generatorSeed) {
        const perBandScores = climateBands.map((climateBand) => {
            const signals = inferFoodSignals(climateBand, context);
            return buildFoodScoreEntry(climateBand, signalKey, signals[signalKey], signals);
        });
        const values = perBandScores.map((entry) => entry.value);

        return Object.freeze({
            type: 'phase2ScalarField',
            fieldId,
            domainId: 'food',
            ownership: 'pressure',
            deterministic: true,
            derivationMode: 'coarse_pressure_interpretation_only',
            sourceRecordType: 'climateBands',
            sourceFieldIds: Object.freeze([
                'bandType',
                'temperatureBias',
                'humidityBias',
                'reliefRegionIds'
            ]),
            upstreamPressureDependencies: FOOD_RELIABILITY_GENERATOR_INPUT_SPEC.upstreamPressureDependencies.slice(),
            introducesScarcityTiming: false,
            mixesTimingSemantics: false,
            contrastPolicy: FOOD_BURDEN_CONTRAST_POLICY.policyId,
            description,
            deterministicSeedUsed: generatorSeed,
            perBandScores,
            summary: Object.freeze({
                recordCount: perBandScores.length,
                mean: roundValue(mean(values)),
                min: roundValue(values.length ? Math.min(...values) : 0),
                max: roundValue(values.length ? Math.max(...values) : 0)
            })
        });
    }

    function inferTravelSignals(macroRoute = {}, context = {}) {
        const routeType = normalizeString(macroRoute.type || macroRoute.routeType, '').toLowerCase();
        const reliefRegionIds = uniqueStrings(macroRoute.reliefRegionIds);
        const seaRegionIds = uniqueStrings(macroRoute.seaRegionIds);
        const chokepointIds = uniqueStrings(macroRoute.chokepointIds);
        const riverBasinIds = uniqueStrings(macroRoute.riverBasinIds);
        const throughIds = uniqueStrings(macroRoute.through);

        const baseCost = clamp01(macroRoute.baseCost);
        const fragility = clamp01(macroRoute.fragility);
        const redundancy = clamp01(macroRoute.redundancy);

        const terrainHarshness = meanByRecordIds(context.terrainScores.terrainHarshness, reliefRegionIds);
        const slopeBurden = meanByRecordIds(context.terrainScores.slopeBurden, reliefRegionIds);
        const fragmentationBurden = meanByRecordIds(context.terrainScores.fragmentationBurden, reliefRegionIds);
        const mobilityTerrainPenalty = meanByRecordIds(context.terrainScores.mobilityTerrainPenalty, reliefRegionIds);
        const waterReliabilityInverse = meanByRecordIds(context.hydrologyScores.waterReliabilityInverse, riverBasinIds);
        const waterStress = meanByRecordIds(context.hydrologyScores.waterStress, riverBasinIds);
        const floodInstability = meanByRecordIds(context.hydrologyScores.floodInstability, riverBasinIds);

        const maritimeSegmentBonus = seaRegionIds.length ? 0.08 : 0;
        const chokepointAdjacency = Math.min(1, chokepointIds.length / 2);
        const routeLengthFactor = clamp01(Math.max(
            throughIds.length / 8,
            reliefRegionIds.length / 5,
            riverBasinIds.length / 4
        ));
        const routeTypeBonus = (
            routeType.includes('mountain')
            || routeType.includes('land')
            || routeType.includes('hybrid')
        ) ? 0.06 : 0;

        const travelExposureBase = clamp01(
            (baseCost * 0.24)
            + (terrainHarshness * 0.16)
            + (slopeBurden * 0.14)
            + (fragmentationBurden * 0.12)
            + (mobilityTerrainPenalty * 0.16)
            + (waterStress * 0.08)
            + (routeLengthFactor * 0.04)
            + maritimeSegmentBonus
            + routeTypeBonus
        );
        const routeReliabilityInverseBase = clamp01(
            (fragility * 0.34)
            + ((1 - redundancy) * 0.28)
            + (mobilityTerrainPenalty * 0.16)
            + (waterReliabilityInverse * 0.1)
            + (floodInstability * 0.06)
            + (chokepointAdjacency * 0.06)
        );
        const movementUncertaintyPressureBase = clamp01(
            (fragility * 0.24)
            + (fragmentationBurden * 0.18)
            + (waterStress * 0.16)
            + (floodInstability * 0.12)
            + ((1 - redundancy) * 0.16)
            + (routeLengthFactor * 0.08)
            + (chokepointAdjacency * 0.06)
        );
        const detourBurdenBase = clamp01(
            ((1 - redundancy) * 0.38)
            + (mobilityTerrainPenalty * 0.18)
            + (terrainHarshness * 0.12)
            + (waterStress * 0.08)
            + (baseCost * 0.1)
            + (chokepointAdjacency * 0.08)
            + (routeLengthFactor * 0.06)
        );
        const routeHostility = clamp01(
            (travelExposureBase * 0.28)
            + (routeReliabilityInverseBase * 0.26)
            + (movementUncertaintyPressureBase * 0.22)
            + (detourBurdenBase * 0.18)
            + (fragility * 0.06)
        );
        const safeRouteConfidence = clamp01(
            1
            - (
                (travelExposureBase * 0.26)
                + (routeReliabilityInverseBase * 0.24)
                + (movementUncertaintyPressureBase * 0.18)
                + (detourBurdenBase * 0.16)
                + ((1 - redundancy) * 0.08)
                + (fragility * 0.08)
            )
        );
        const safeCompression = applyThresholdContrast(
            safeRouteConfidence,
            TRAVEL_BURDEN_CONTRAST_POLICY.safeRouteDeadband,
            TRAVEL_BURDEN_CONTRAST_POLICY.safeExponent
        );
        const hostileEscalation = applyThresholdContrast(
            routeHostility,
            TRAVEL_BURDEN_CONTRAST_POLICY.hostileEscalationStart,
            TRAVEL_BURDEN_CONTRAST_POLICY.hostileExponent
        );
        const calibratedTravelExposure = clamp01(
            applyThresholdContrast(
                travelExposureBase,
                TRAVEL_BURDEN_CONTRAST_POLICY.travelExposureThreshold,
                TRAVEL_BURDEN_CONTRAST_POLICY.contrastExponent
            )
            * (1 - (safeCompression * 0.42))
            + (hostileEscalation * 0.18)
        );
        const calibratedRouteReliabilityInverse = clamp01(
            applyThresholdContrast(
                routeReliabilityInverseBase,
                TRAVEL_BURDEN_CONTRAST_POLICY.reliabilityThreshold,
                TRAVEL_BURDEN_CONTRAST_POLICY.hostileExponent
            )
            * (1 - (safeCompression * 0.46))
            + (hostileEscalation * 0.16)
        );
        const calibratedMovementUncertaintyPressure = clamp01(
            applyThresholdContrast(
                movementUncertaintyPressureBase,
                TRAVEL_BURDEN_CONTRAST_POLICY.uncertaintyThreshold,
                TRAVEL_BURDEN_CONTRAST_POLICY.contrastExponent
            )
            * (1 - (safeCompression * 0.36))
            + (hostileEscalation * 0.14)
        );
        const calibratedDetourBurden = clamp01(
            applyThresholdContrast(
                detourBurdenBase,
                TRAVEL_BURDEN_CONTRAST_POLICY.detourThreshold,
                TRAVEL_BURDEN_CONTRAST_POLICY.hostileExponent
            )
            * (1 - (safeCompression * 0.34))
            + (hostileEscalation * 0.12)
        );

        return {
            routeType,
            reliefRegionIds,
            seaRegionIds,
            chokepointIds,
            riverBasinIds,
            terrainHarshness: roundValue(terrainHarshness),
            slopeBurden: roundValue(slopeBurden),
            fragmentationBurden: roundValue(fragmentationBurden),
            mobilityTerrainPenalty: roundValue(mobilityTerrainPenalty),
            waterReliabilityInverse: roundValue(waterReliabilityInverse),
            waterStress: roundValue(waterStress),
            floodInstability: roundValue(floodInstability),
            chokepointAdjacency: roundValue(chokepointAdjacency),
            routeLengthFactor: roundValue(routeLengthFactor),
            safeRouteConfidence: roundValue(safeRouteConfidence),
            routeHostility: roundValue(routeHostility),
            travelExposure: roundValue(calibratedTravelExposure),
            routeReliabilityInverse: roundValue(calibratedRouteReliabilityInverse),
            movementUncertaintyPressure: roundValue(calibratedMovementUncertaintyPressure),
            detourBurden: roundValue(calibratedDetourBurden)
        };
    }

    function buildTravelScoreEntry(macroRoute = {}, signalKey, value, signals = {}) {
        return Object.freeze({
            recordType: 'macroRoutes',
            recordId: normalizeString(macroRoute.routeId, ''),
            routeType: normalizeString(macroRoute.type || macroRoute.routeType, ''),
            fromRegion: normalizeString(macroRoute.fromRegion, ''),
            toRegion: normalizeString(macroRoute.toRegion, ''),
            reliefRegionIds: uniqueStrings(macroRoute.reliefRegionIds),
            seaRegionIds: uniqueStrings(macroRoute.seaRegionIds),
            chokepointIds: uniqueStrings(macroRoute.chokepointIds),
            riverBasinIds: uniqueStrings(macroRoute.riverBasinIds),
            signalKey,
            value: roundValue(value),
            sourceTruth: Object.freeze({
                baseCost: roundValue(clamp01(macroRoute.baseCost)),
                fragility: roundValue(clamp01(macroRoute.fragility)),
                redundancy: roundValue(clamp01(macroRoute.redundancy))
            }),
            upstreamBurdenSnapshot: Object.freeze({
                terrainHarshness: signals.terrainHarshness || 0,
                mobilityTerrainPenalty: signals.mobilityTerrainPenalty || 0,
                waterStress: signals.waterStress || 0,
                floodInstability: signals.floodInstability || 0,
                safeRouteConfidence: signals.safeRouteConfidence || 0,
                routeHostility: signals.routeHostility || 0
            })
        });
    }

    function buildTravelPressureField(fieldId, macroRoutes, context, signalKey, description, generatorSeed) {
        const perRouteScores = macroRoutes.map((macroRoute) => {
            const signals = inferTravelSignals(macroRoute, context);
            return buildTravelScoreEntry(macroRoute, signalKey, signals[signalKey], signals);
        });
        const values = perRouteScores.map((entry) => entry.value);

        return Object.freeze({
            type: 'phase2ScalarField',
            fieldId,
            domainId: 'travel',
            ownership: 'pressure',
            deterministic: true,
            derivationMode: 'coarse_pressure_interpretation_only',
            sourceRecordType: 'macroRoutes',
            sourceFieldIds: Object.freeze([
                'type',
                'baseCost',
                'fragility',
                'redundancy',
                'through'
            ]),
            supportRecordTypes: Object.freeze([
                'reliefRegions',
                'riverBasins'
            ]),
            upstreamPressureDependencies: TRAVEL_EXPOSURE_GENERATOR_INPUT_SPEC.upstreamPressureDependencies.slice(),
            introducesTimingSemantics: false,
            mixesTimingSemantics: false,
            contrastPolicy: TRAVEL_BURDEN_CONTRAST_POLICY.policyId,
            description,
            deterministicSeedUsed: generatorSeed,
            perRouteScores,
            summary: Object.freeze({
                recordCount: perRouteScores.length,
                mean: roundValue(mean(values)),
                min: roundValue(values.length ? Math.min(...values) : 0),
                max: roundValue(values.length ? Math.max(...values) : 0)
            })
        });
    }

    function inferChokepointSignals(chokepoint = {}) {
        const chokepointType = normalizeString(chokepoint.type, '').toLowerCase();
        const controlValue = clamp01(chokepoint.controlValue);
        const tradeDependency = clamp01(chokepoint.tradeDependency);
        const bypassDifficulty = clamp01(chokepoint.bypassDifficulty);
        const collapseSensitivity = clamp01(chokepoint.collapseSensitivity);
        const adjacentRegions = uniqueStrings(chokepoint.adjacentRegions);

        const narrowTypeBonus = (
            chokepointType.includes('strait')
            || chokepointType.includes('lock')
            || chokepointType.includes('pass')
            || chokepointType.includes('bottleneck')
        ) ? 0.08 : 0;
        const adjacencyConcentration = clamp01(Math.max(0, 1 - ((Math.max(1, adjacentRegions.length) - 1) / 4)));

        const chokepointPressureBase = clamp01(
            (controlValue * 0.34)
            + (tradeDependency * 0.22)
            + (bypassDifficulty * 0.24)
            + (collapseSensitivity * 0.12)
            + (adjacencyConcentration * 0.08)
            + narrowTypeBonus
        );
        const failureImpactPressureBase = clamp01(
            (collapseSensitivity * 0.36)
            + (tradeDependency * 0.28)
            + (controlValue * 0.16)
            + (bypassDifficulty * 0.12)
            + (adjacencyConcentration * 0.08)
        );
        const dependencyConcentrationBase = clamp01(
            (tradeDependency * 0.42)
            + (controlValue * 0.24)
            + (bypassDifficulty * 0.18)
            + (adjacencyConcentration * 0.16)
        );
        const chokepointSpecificity = clamp01(
            (controlValue * 0.32)
            + (tradeDependency * 0.3)
            + (bypassDifficulty * 0.24)
            + (adjacencyConcentration * 0.14)
        );
        const genericRouteStressLeakage = clamp01(
            (collapseSensitivity * 0.28)
            + ((1 - adjacencyConcentration) * 0.26)
            + ((1 - controlValue) * 0.18)
            + ((1 - tradeDependency) * 0.14)
            + (narrowTypeBonus ? 0 : 0.14)
        );
        const specificitySignal = applyThresholdContrast(
            chokepointSpecificity,
            CHOKEPOINT_BURDEN_CONTRAST_POLICY.specificityThreshold,
            CHOKEPOINT_BURDEN_CONTRAST_POLICY.specificityExponent
        );
        const falsePositiveSuppression = applyThresholdContrast(
            genericRouteStressLeakage,
            CHOKEPOINT_BURDEN_CONTRAST_POLICY.leakageThreshold,
            CHOKEPOINT_BURDEN_CONTRAST_POLICY.leakageExponent
        );
        const chokepointEscalation = applyThresholdContrast(
            chokepointSpecificity,
            CHOKEPOINT_BURDEN_CONTRAST_POLICY.escalationThreshold,
            CHOKEPOINT_BURDEN_CONTRAST_POLICY.contrastExponent
        );
        const calibratedChokepointPressure = clamp01(
            applyThresholdContrast(
                chokepointPressureBase,
                0.16,
                CHOKEPOINT_BURDEN_CONTRAST_POLICY.contrastExponent
            )
            * (1 - (falsePositiveSuppression * 0.42))
            + (specificitySignal * 0.14)
            + (chokepointEscalation * 0.1)
        );
        const calibratedFailureImpactPressure = clamp01(
            applyThresholdContrast(
                failureImpactPressureBase,
                0.18,
                CHOKEPOINT_BURDEN_CONTRAST_POLICY.contrastExponent
            )
            * (1 - (falsePositiveSuppression * 0.3))
            + (specificitySignal * 0.1)
        );
        const calibratedDependencyConcentration = clamp01(
            applyThresholdContrast(
                dependencyConcentrationBase,
                0.17,
                CHOKEPOINT_BURDEN_CONTRAST_POLICY.specificityExponent
            )
            * (1 - (falsePositiveSuppression * 0.46))
            + (specificitySignal * 0.16)
        );

        return {
            chokepointType,
            controlValue: roundValue(controlValue),
            tradeDependency: roundValue(tradeDependency),
            bypassDifficulty: roundValue(bypassDifficulty),
            collapseSensitivity: roundValue(collapseSensitivity),
            adjacentRegionCount: adjacentRegions.length,
            adjacencyConcentration: roundValue(adjacencyConcentration),
            chokepointSpecificity: roundValue(chokepointSpecificity),
            genericRouteStressLeakage: roundValue(genericRouteStressLeakage),
            chokepointPressure: roundValue(calibratedChokepointPressure),
            failureImpactPressure: roundValue(calibratedFailureImpactPressure),
            dependencyConcentration: roundValue(calibratedDependencyConcentration)
        };
    }

    function buildChokepointScoreEntry(chokepoint = {}, signalKey, value, signals = {}) {
        return Object.freeze({
            recordType: 'chokepoints',
            recordId: normalizeString(chokepoint.chokepointId, ''),
            chokepointType: normalizeString(chokepoint.type, ''),
            adjacentRegions: uniqueStrings(chokepoint.adjacentRegions),
            signalKey,
            value: roundValue(value),
            sourceTruth: Object.freeze({
                controlValue: roundValue(clamp01(chokepoint.controlValue)),
                tradeDependency: roundValue(clamp01(chokepoint.tradeDependency)),
                bypassDifficulty: roundValue(clamp01(chokepoint.bypassDifficulty)),
                collapseSensitivity: roundValue(clamp01(chokepoint.collapseSensitivity))
            }),
            upstreamBurdenSnapshot: Object.freeze({
                adjacencyConcentration: signals.adjacencyConcentration || 0,
                chokepointSpecificity: signals.chokepointSpecificity || 0,
                genericRouteStressLeakage: signals.genericRouteStressLeakage || 0
            })
        });
    }

    function buildChokepointPressureField(fieldId, chokepoints, signalKey, description, generatorSeed) {
        const perChokepointScores = chokepoints.map((chokepoint) => {
            const signals = inferChokepointSignals(chokepoint);
            return buildChokepointScoreEntry(chokepoint, signalKey, signals[signalKey], signals);
        });
        const values = perChokepointScores.map((entry) => entry.value);

        return Object.freeze({
            type: 'phase2ScalarField',
            fieldId,
            domainId: 'chokepoints',
            ownership: 'pressure',
            deterministic: true,
            derivationMode: 'coarse_record_truth_only',
            sourceRecordType: 'chokepoints',
            sourceFieldIds: Object.freeze([
                'type',
                'controlValue',
                'tradeDependency',
                'bypassDifficulty',
                'collapseSensitivity',
                'adjacentRegions'
            ]),
            introducesTimingSemantics: false,
            mixesTimingSemantics: false,
            contrastPolicy: CHOKEPOINT_BURDEN_CONTRAST_POLICY.policyId,
            description,
            deterministicSeedUsed: generatorSeed,
            perChokepointScores,
            summary: Object.freeze({
                recordCount: perChokepointScores.length,
                mean: roundValue(mean(values)),
                min: roundValue(values.length ? Math.min(...values) : 0),
                max: roundValue(values.length ? Math.max(...values) : 0)
            })
        });
    }

    function inferIsolationSignals(isolatedZone = {}) {
        const zoneType = normalizeString(isolatedZone.type, '').toLowerCase();
        const isolation = clamp01(isolatedZone.isolation);
        const resupplyDifficulty = clamp01(isolatedZone.resupplyDifficulty);
        const autonomousSurvivalScore = clamp01(isolatedZone.autonomousSurvivalScore);
        const lossInCollapseLikelihood = clamp01(isolatedZone.lossInCollapseLikelihood);

        const fragmentedZoneBonus = (
            zoneType.includes('fragment')
            || zoneType.includes('archipelago')
            || zoneType.includes('remote')
        ) ? 0.08 : 0;

        const isolationPressureBase = clamp01(
            (isolation * 0.42)
            + (resupplyDifficulty * 0.28)
            + (lossInCollapseLikelihood * 0.18)
            + ((1 - autonomousSurvivalScore) * 0.08)
            + fragmentedZoneBonus
        );
        const supportDelayBurdenBase = clamp01(
            (resupplyDifficulty * 0.44)
            + (isolation * 0.24)
            + (lossInCollapseLikelihood * 0.14)
            + ((1 - autonomousSurvivalScore) * 0.12)
            + fragmentedZoneBonus
        );
        const peripheralExposureBase = clamp01(
            (isolation * 0.34)
            + (lossInCollapseLikelihood * 0.26)
            + ((1 - autonomousSurvivalScore) * 0.22)
            + (resupplyDifficulty * 0.12)
            + fragmentedZoneBonus
        );
        const accessFragilityBase = clamp01(
            (resupplyDifficulty * 0.34)
            + (lossInCollapseLikelihood * 0.24)
            + (isolation * 0.22)
            + ((1 - autonomousSurvivalScore) * 0.14)
            + fragmentedZoneBonus
        );
        const peripherySignal = clamp01(
            (isolationPressureBase * 0.3)
            + (supportDelayBurdenBase * 0.26)
            + (peripheralExposureBase * 0.24)
            + (accessFragilityBase * 0.14)
            + (fragmentedZoneBonus * 0.06)
        );
        const coreAnchoring = clamp01(
            1
            - (
                (isolationPressureBase * 0.28)
                + (supportDelayBurdenBase * 0.24)
                + (peripheralExposureBase * 0.18)
                + (accessFragilityBase * 0.16)
                + ((1 - autonomousSurvivalScore) * 0.08)
            )
        );
        const coreCompression = applyThresholdContrast(
            coreAnchoring,
            ISOLATION_BURDEN_CONTRAST_POLICY.coreAnchorThreshold,
            ISOLATION_BURDEN_CONTRAST_POLICY.coreExponent
        );
        const peripheryEscalation = applyThresholdContrast(
            peripherySignal,
            ISOLATION_BURDEN_CONTRAST_POLICY.peripheryEscalationStart,
            ISOLATION_BURDEN_CONTRAST_POLICY.peripheryExponent
        );
        const calibratedIsolationPressure = clamp01(
            applyThresholdContrast(
                isolationPressureBase,
                ISOLATION_BURDEN_CONTRAST_POLICY.isolationThreshold,
                ISOLATION_BURDEN_CONTRAST_POLICY.contrastExponent
            )
            * (1 - (coreCompression * 0.4))
            + (peripheryEscalation * 0.16)
        );
        const calibratedSupportDelayBurden = clamp01(
            applyThresholdContrast(
                supportDelayBurdenBase,
                ISOLATION_BURDEN_CONTRAST_POLICY.supportDelayThreshold,
                ISOLATION_BURDEN_CONTRAST_POLICY.contrastExponent
            )
            * (1 - (coreCompression * 0.36))
            + (peripheryEscalation * 0.14)
        );
        const calibratedPeripheralExposure = clamp01(
            applyThresholdContrast(
                peripheralExposureBase,
                ISOLATION_BURDEN_CONTRAST_POLICY.peripheralExposureThreshold,
                ISOLATION_BURDEN_CONTRAST_POLICY.peripheryExponent
            )
            * (1 - (coreCompression * 0.32))
            + (peripheryEscalation * 0.16)
        );
        const calibratedAccessFragility = clamp01(
            applyThresholdContrast(
                accessFragilityBase,
                ISOLATION_BURDEN_CONTRAST_POLICY.accessFragilityThreshold,
                ISOLATION_BURDEN_CONTRAST_POLICY.contrastExponent
            )
            * (1 - (coreCompression * 0.34))
            + (peripheryEscalation * 0.12)
        );

        return {
            zoneType,
            isolation: roundValue(isolation),
            resupplyDifficulty: roundValue(resupplyDifficulty),
            autonomousSurvivalScore: roundValue(autonomousSurvivalScore),
            lossInCollapseLikelihood: roundValue(lossInCollapseLikelihood),
            peripherySignal: roundValue(peripherySignal),
            coreAnchoring: roundValue(coreAnchoring),
            isolationPressure: roundValue(calibratedIsolationPressure),
            supportDelayBurden: roundValue(calibratedSupportDelayBurden),
            peripheralExposure: roundValue(calibratedPeripheralExposure),
            accessFragility: roundValue(calibratedAccessFragility)
        };
    }

    function buildIsolationScoreEntry(isolatedZone = {}, signalKey, value, signals = {}) {
        return Object.freeze({
            recordType: 'isolatedZones',
            recordId: normalizeString(isolatedZone.zoneId, ''),
            zoneType: normalizeString(isolatedZone.type, ''),
            signalKey,
            value: roundValue(value),
            sourceTruth: Object.freeze({
                isolation: roundValue(clamp01(isolatedZone.isolation)),
                resupplyDifficulty: roundValue(clamp01(isolatedZone.resupplyDifficulty)),
                autonomousSurvivalScore: roundValue(clamp01(isolatedZone.autonomousSurvivalScore)),
                lossInCollapseLikelihood: roundValue(clamp01(isolatedZone.lossInCollapseLikelihood))
            }),
            upstreamBurdenSnapshot: Object.freeze({
                supportDelayContext: signals.resupplyDifficulty || 0,
                coreAnchoring: signals.coreAnchoring || 0,
                peripherySignal: signals.peripherySignal || 0
            })
        });
    }

    function buildIsolationPressureField(fieldId, isolatedZones, signalKey, description, generatorSeed) {
        const perZoneScores = isolatedZones.map((isolatedZone) => {
            const signals = inferIsolationSignals(isolatedZone);
            return buildIsolationScoreEntry(isolatedZone, signalKey, signals[signalKey], signals);
        });
        const values = perZoneScores.map((entry) => entry.value);

        return Object.freeze({
            type: 'phase2ScalarField',
            fieldId,
            domainId: 'isolation',
            ownership: 'pressure',
            deterministic: true,
            derivationMode: 'coarse_record_truth_only',
            sourceRecordType: 'isolatedZones',
            sourceFieldIds: Object.freeze([
                'type',
                'isolation',
                'resupplyDifficulty',
                'autonomousSurvivalScore',
                'lossInCollapseLikelihood'
            ]),
            introducesTimingSemantics: false,
            mixesTimingSemantics: false,
            contrastPolicy: ISOLATION_BURDEN_CONTRAST_POLICY.policyId,
            description,
            deterministicSeedUsed: generatorSeed,
            perZoneScores,
            summary: Object.freeze({
                recordCount: perZoneScores.length,
                mean: roundValue(mean(values)),
                min: roundValue(values.length ? Math.min(...values) : 0),
                max: roundValue(values.length ? Math.max(...values) : 0)
            })
        });
    }

    function buildIsolationZoneIndexByContinent(isolatedZones = []) {
        return isolatedZones.reduce((index, isolatedZone) => {
            const continentIds = uniqueStrings(isolatedZone.continentIds);
            continentIds.forEach((continentId) => {
                if (!index[continentId]) {
                    index[continentId] = [];
                }
                index[continentId].push(isolatedZone);
            });
            return index;
        }, {});
    }

    function inferEcologySignals(reliefRegion = {}, context = {}) {
        const reliefRegionId = normalizeString(reliefRegion.reliefRegionId, '');
        const continentIds = uniqueStrings(reliefRegion.continentIds);
        const climateBandIds = uniqueStrings((context.climateBandIdsByReliefRegion || {})[reliefRegionId]);
        const riverBasinIds = uniqueStrings((context.riverBasinIdsByReliefRegion || {})[reliefRegionId]);
        const isolatedZoneIds = uniqueStrings(continentIds.flatMap((continentId) => {
            const zones = (context.isolationZonesByContinent || {})[continentId];
            return Array.isArray(zones) ? zones.map((zone) => zone.zoneId) : [];
        }));

        const climateExposurePressure = meanByRecordIds(context.climateScores.climateExposurePressure, climateBandIds);
        const humidityPressure = meanByRecordIds(context.climateScores.humidityPressure, climateBandIds);
        const waterStress = meanByRecordIds(context.hydrologyScores.waterStress, riverBasinIds);
        const droughtPressure = meanByRecordIds(context.hydrologyScores.droughtPressure, riverBasinIds);
        const floodInstability = meanByRecordIds(context.hydrologyScores.floodInstability, riverBasinIds);
        const isolationPressure = meanByRecordIds(context.isolationScores.isolationPressure, isolatedZoneIds);
        const supportDelayBurden = meanByRecordIds(context.isolationScores.supportDelayBurden, isolatedZoneIds);
        const accessFragility = meanByRecordIds(context.isolationScores.accessFragility, isolatedZoneIds);

        const ruggednessBias = clamp01(reliefRegion.ruggednessBias);
        const elevationBias = clamp01(reliefRegion.elevationBias);
        const ecologicalFragilityBase = clamp01(
            (climateExposurePressure * 0.24)
            + (humidityPressure * 0.14)
            + (waterStress * 0.18)
            + (droughtPressure * 0.14)
            + (floodInstability * 0.08)
            + (isolationPressure * 0.12)
            + (supportDelayBurden * 0.06)
            + (ruggednessBias * 0.04)
        );
        const ecologicalStabilityInverseBase = clamp01(
            (waterStress * 0.22)
            + (droughtPressure * 0.2)
            + (climateExposurePressure * 0.18)
            + (accessFragility * 0.12)
            + (supportDelayBurden * 0.1)
            + (elevationBias * 0.08)
            + (ruggednessBias * 0.1)
        );
        const regenerationWeaknessBase = clamp01(
            (droughtPressure * 0.26)
            + (waterStress * 0.18)
            + (climateExposurePressure * 0.18)
            + (supportDelayBurden * 0.14)
            + (accessFragility * 0.12)
            + (ruggednessBias * 0.08)
            + (elevationBias * 0.04)
        );
        const carryingCapacityBrittlenessBase = clamp01(
            (ecologicalFragilityBase * 0.28)
            + (ecologicalStabilityInverseBase * 0.24)
            + (regenerationWeaknessBase * 0.22)
            + (waterStress * 0.12)
            + (isolationPressure * 0.08)
            + (supportDelayBurden * 0.06)
        );
        const ecologicalResilience = clamp01(
            1
            - (
                (ecologicalFragilityBase * 0.28)
                + (ecologicalStabilityInverseBase * 0.22)
                + (regenerationWeaknessBase * 0.18)
                + (carryingCapacityBrittlenessBase * 0.16)
                + (supportDelayBurden * 0.08)
                + (accessFragility * 0.08)
            )
        );
        const ecologicalBrittleness = clamp01(
            (ecologicalFragilityBase * 0.3)
            + (ecologicalStabilityInverseBase * 0.24)
            + (regenerationWeaknessBase * 0.22)
            + (carryingCapacityBrittlenessBase * 0.18)
            + (droughtPressure * 0.06)
        );
        const resilienceCompression = applyThresholdContrast(
            ecologicalResilience,
            ECOLOGY_BURDEN_CONTRAST_POLICY.resilienceThreshold,
            ECOLOGY_BURDEN_CONTRAST_POLICY.resilienceExponent
        );
        const brittlenessEscalation = applyThresholdContrast(
            ecologicalBrittleness,
            ECOLOGY_BURDEN_CONTRAST_POLICY.brittlenessEscalationStart,
            ECOLOGY_BURDEN_CONTRAST_POLICY.brittleExponent
        );
        const calibratedEcologicalFragility = clamp01(
            applyThresholdContrast(
                ecologicalFragilityBase,
                ECOLOGY_BURDEN_CONTRAST_POLICY.ecologicalFragilityThreshold,
                ECOLOGY_BURDEN_CONTRAST_POLICY.contrastExponent
            )
            * (1 - (resilienceCompression * 0.34))
            + (brittlenessEscalation * 0.16)
        );
        const calibratedEcologicalStabilityInverse = clamp01(
            applyThresholdContrast(
                ecologicalStabilityInverseBase,
                ECOLOGY_BURDEN_CONTRAST_POLICY.stabilityInverseThreshold,
                ECOLOGY_BURDEN_CONTRAST_POLICY.contrastExponent
            )
            * (1 - (resilienceCompression * 0.32))
            + (brittlenessEscalation * 0.14)
        );
        const calibratedRegenerationWeakness = clamp01(
            applyThresholdContrast(
                regenerationWeaknessBase,
                ECOLOGY_BURDEN_CONTRAST_POLICY.regenerationWeaknessThreshold,
                ECOLOGY_BURDEN_CONTRAST_POLICY.brittleExponent
            )
            * (1 - (resilienceCompression * 0.28))
            + (brittlenessEscalation * 0.16)
        );
        const calibratedCarryingCapacityBrittleness = clamp01(
            applyThresholdContrast(
                carryingCapacityBrittlenessBase,
                ECOLOGY_BURDEN_CONTRAST_POLICY.carryingCapacityThreshold,
                ECOLOGY_BURDEN_CONTRAST_POLICY.brittleExponent
            )
            * (1 - (resilienceCompression * 0.3))
            + (brittlenessEscalation * 0.14)
        );

        return {
            reliefRegionId,
            climateBandIds,
            riverBasinIds,
            isolatedZoneIds,
            climateExposurePressure: roundValue(climateExposurePressure),
            humidityPressure: roundValue(humidityPressure),
            waterStress: roundValue(waterStress),
            droughtPressure: roundValue(droughtPressure),
            floodInstability: roundValue(floodInstability),
            isolationPressureContext: roundValue(isolationPressure),
            supportDelayContext: roundValue(supportDelayBurden),
            accessFragilityContext: roundValue(accessFragility),
            ecologicalResilience: roundValue(ecologicalResilience),
            ecologicalBrittleness: roundValue(ecologicalBrittleness),
            ecologicalFragility: roundValue(calibratedEcologicalFragility),
            ecologicalStabilityInverse: roundValue(calibratedEcologicalStabilityInverse),
            regenerationWeakness: roundValue(calibratedRegenerationWeakness),
            carryingCapacityBrittleness: roundValue(calibratedCarryingCapacityBrittleness)
        };
    }

    function buildEcologyScoreEntry(reliefRegion = {}, signalKey, value, signals = {}) {
        return Object.freeze({
            recordType: 'reliefRegions',
            recordId: normalizeString(reliefRegion.reliefRegionId, ''),
            reliefType: normalizeString(reliefRegion.reliefType, ''),
            continentIds: uniqueStrings(reliefRegion.continentIds),
            signalKey,
            value: roundValue(value),
            sourceTruth: Object.freeze({
                elevationBias: roundValue(clamp01(reliefRegion.elevationBias)),
                ruggednessBias: roundValue(clamp01(reliefRegion.ruggednessBias)),
                coastalInfluence: roundValue(clamp01(reliefRegion.coastalInfluence))
            }),
            upstreamBurdenSnapshot: Object.freeze({
                climateExposurePressure: signals.climateExposurePressure || 0,
                waterStress: signals.waterStress || 0,
                droughtPressure: signals.droughtPressure || 0,
                supportDelayContext: signals.supportDelayContext || 0,
                ecologicalResilience: signals.ecologicalResilience || 0,
                ecologicalBrittleness: signals.ecologicalBrittleness || 0
            })
        });
    }

    function buildEcologyPressureField(fieldId, reliefRegions, context, signalKey, description, generatorSeed) {
        const perReliefScores = reliefRegions.map((reliefRegion) => {
            const signals = inferEcologySignals(reliefRegion, context);
            return buildEcologyScoreEntry(reliefRegion, signalKey, signals[signalKey], signals);
        });
        const values = perReliefScores.map((entry) => entry.value);

        return Object.freeze({
            type: 'phase2ScalarField',
            fieldId,
            domainId: 'ecology',
            ownership: 'pressure',
            deterministic: true,
            derivationMode: 'coarse_pressure_interpretation_only',
            sourceRecordType: 'reliefRegions',
            sourceFieldIds: Object.freeze([
                'reliefType',
                'elevationBias',
                'ruggednessBias',
                'continentIds'
            ]),
            upstreamPressureDependencies: ECOLOGICAL_FRAGILITY_GENERATOR_INPUT_SPEC.upstreamPressureDependencies.slice(),
            introducesTimingSemantics: false,
            mixesTimingSemantics: false,
            contrastPolicy: ECOLOGY_BURDEN_CONTRAST_POLICY.policyId,
            description,
            deterministicSeedUsed: generatorSeed,
            perReliefScores,
            summary: Object.freeze({
                recordCount: perReliefScores.length,
                mean: roundValue(mean(values)),
                min: roundValue(values.length ? Math.min(...values) : 0),
                max: roundValue(values.length ? Math.max(...values) : 0)
            })
        });
    }

    function buildVolcanicZoneIndexByReliefRegion(volcanicZones = []) {
        return volcanicZones.reduce((index, volcanicZone) => {
            uniqueStrings(volcanicZone.reliefRegionIds).forEach((reliefRegionId) => {
                if (!index[reliefRegionId]) {
                    index[reliefRegionId] = [];
                }
                index[reliefRegionId].push(volcanicZone);
            });
            return index;
        }, {});
    }

    function inferCatastropheSignals(reliefRegion = {}, context = {}) {
        const reliefRegionId = normalizeString(reliefRegion.reliefRegionId, '');
        const climateBandIds = uniqueStrings((context.climateBandIdsByReliefRegion || {})[reliefRegionId]);
        const riverBasinIds = uniqueStrings((context.riverBasinIdsByReliefRegion || {})[reliefRegionId]);
        const adjacentSeaRegionIds = uniqueStrings(reliefRegion.adjacentSeaRegionIds);
        const linkedVolcanicZones = Array.isArray((context.volcanicZonesByReliefRegion || {})[reliefRegionId])
            ? (context.volcanicZonesByReliefRegion || {})[reliefRegionId]
            : [];

        const climateExposurePressure = meanByRecordIds(context.climateScores.climateExposurePressure, climateBandIds);
        const waterStress = meanByRecordIds(context.hydrologyScores.waterStress, riverBasinIds);
        const droughtPressureContext = meanByRecordIds(context.hydrologyScores.droughtPressure, riverBasinIds);
        const floodInstabilityContext = meanByRecordIds(context.hydrologyScores.floodInstability, riverBasinIds);
        const maritimeAdjacency = clamp01(adjacentSeaRegionIds.length ? Math.min(1, adjacentSeaRegionIds.length / 2) : 0);

        const activityBias = mean(linkedVolcanicZones.map((zone) => clamp01(zone.activityBias)));
        const zoneContinuity = mean(linkedVolcanicZones.map((zone) => clamp01(zone.zoneContinuity)));
        const volcanicArcBonus = linkedVolcanicZones.some((zone) => {
            const sourceType = normalizeString(zone.sourceType, '').toLowerCase();
            return sourceType.includes('arc') || sourceType.includes('fissure') || sourceType.includes('hotspot');
        }) ? 0.08 : 0;

        const stormBreakRiskBase = clamp01(
            (climateExposurePressure * 0.46)
            + (floodInstabilityContext * 0.18)
            + (maritimeAdjacency * 0.18)
            + (waterStress * 0.06)
        );
        const volcanicInstabilityBase = clamp01(
            (activityBias * 0.52)
            + (zoneContinuity * 0.18)
            + (clamp01(reliefRegion.elevationBias) * 0.08)
            + volcanicArcBonus
        );
        const floodBreakRiskBase = clamp01(
            (floodInstabilityContext * 0.48)
            + (maritimeAdjacency * 0.16)
            + (climateExposurePressure * 0.14)
            + (clamp01(reliefRegion.coastalInfluence) * 0.12)
            + (waterStress * 0.06)
        );
        const droughtBreakRiskBase = clamp01(
            (droughtPressureContext * 0.52)
            + (waterStress * 0.2)
            + (climateExposurePressure * 0.14)
            + ((1 - maritimeAdjacency) * 0.08)
        );
        const catastrophePressureBase = clamp01(
            (stormBreakRiskBase * 0.24)
            + (volcanicInstabilityBase * 0.22)
            + (floodBreakRiskBase * 0.22)
            + (droughtBreakRiskBase * 0.22)
            + (climateExposurePressure * 0.06)
            + (waterStress * 0.04)
        );
        const causeMean = mean([
            stormBreakRiskBase,
            volcanicInstabilityBase,
            floodBreakRiskBase,
            droughtBreakRiskBase
        ]);
        const stormSpecificity = clamp01(Math.max(0, stormBreakRiskBase - mean([
            volcanicInstabilityBase,
            floodBreakRiskBase,
            droughtBreakRiskBase
        ])));
        const volcanicSpecificity = clamp01(Math.max(0, volcanicInstabilityBase - mean([
            stormBreakRiskBase,
            floodBreakRiskBase,
            droughtBreakRiskBase
        ])));
        const floodSpecificity = clamp01(Math.max(0, floodBreakRiskBase - mean([
            stormBreakRiskBase,
            volcanicInstabilityBase,
            droughtBreakRiskBase
        ])));
        const droughtSpecificity = clamp01(Math.max(0, droughtBreakRiskBase - mean([
            stormBreakRiskBase,
            volcanicInstabilityBase,
            floodBreakRiskBase
        ])));
        const causeConvergence = clamp01(
            1 - mean([
                Math.abs(stormBreakRiskBase - causeMean),
                Math.abs(volcanicInstabilityBase - causeMean),
                Math.abs(floodBreakRiskBase - causeMean),
                Math.abs(droughtBreakRiskBase - causeMean)
            ]) * 2
        );
        const separationSuppression = applyThresholdContrast(
            causeConvergence,
            0.22,
            CATASTROPHE_BURDEN_CONTRAST_POLICY.separationExponent
        );
        const calibratedStormBreakRisk = clamp01(
            applyThresholdContrast(
                stormBreakRiskBase,
                CATASTROPHE_BURDEN_CONTRAST_POLICY.stormThreshold,
                CATASTROPHE_BURDEN_CONTRAST_POLICY.contrastExponent
            )
            * (1 - (separationSuppression * 0.28))
            + (stormSpecificity * 0.22)
        );
        const calibratedVolcanicInstability = clamp01(
            applyThresholdContrast(
                volcanicInstabilityBase,
                CATASTROPHE_BURDEN_CONTRAST_POLICY.volcanicThreshold,
                CATASTROPHE_BURDEN_CONTRAST_POLICY.causeExponent
            )
            * (1 - (separationSuppression * 0.24))
            + (volcanicSpecificity * 0.24)
        );
        const calibratedFloodBreakRisk = clamp01(
            applyThresholdContrast(
                floodBreakRiskBase,
                CATASTROPHE_BURDEN_CONTRAST_POLICY.floodThreshold,
                CATASTROPHE_BURDEN_CONTRAST_POLICY.contrastExponent
            )
            * (1 - (separationSuppression * 0.28))
            + (floodSpecificity * 0.22)
        );
        const calibratedDroughtBreakRisk = clamp01(
            applyThresholdContrast(
                droughtBreakRiskBase,
                CATASTROPHE_BURDEN_CONTRAST_POLICY.droughtThreshold,
                CATASTROPHE_BURDEN_CONTRAST_POLICY.contrastExponent
            )
            * (1 - (separationSuppression * 0.28))
            + (droughtSpecificity * 0.22)
        );
        const calibratedCatastrophePressure = clamp01(
            applyThresholdContrast(
                catastrophePressureBase,
                CATASTROPHE_BURDEN_CONTRAST_POLICY.aggregateThreshold,
                CATASTROPHE_BURDEN_CONTRAST_POLICY.contrastExponent
            )
            * (1 - (separationSuppression * 0.12))
            + (mean([
                stormSpecificity,
                volcanicSpecificity,
                floodSpecificity,
                droughtSpecificity
            ]) * 0.08)
        );

        return {
            climateExposurePressure: roundValue(climateExposurePressure),
            waterStress: roundValue(waterStress),
            droughtPressureContext: roundValue(droughtPressureContext),
            floodInstabilityContext: roundValue(floodInstabilityContext),
            maritimeAdjacency: roundValue(maritimeAdjacency),
            volcanicActivityBias: roundValue(activityBias),
            volcanicZoneContinuity: roundValue(zoneContinuity),
            stormSpecificity: roundValue(stormSpecificity),
            volcanicSpecificity: roundValue(volcanicSpecificity),
            floodSpecificity: roundValue(floodSpecificity),
            droughtSpecificity: roundValue(droughtSpecificity),
            causeConvergence: roundValue(causeConvergence),
            catastrophePressure: roundValue(calibratedCatastrophePressure),
            stormBreakRisk: roundValue(calibratedStormBreakRisk),
            volcanicInstability: roundValue(calibratedVolcanicInstability),
            floodBreakRisk: roundValue(calibratedFloodBreakRisk),
            droughtBreakRisk: roundValue(calibratedDroughtBreakRisk)
        };
    }

    function buildCatastropheScoreEntry(reliefRegion = {}, signalKey, value, signals = {}) {
        return Object.freeze({
            recordType: 'reliefRegions',
            recordId: normalizeString(reliefRegion.reliefRegionId, ''),
            reliefType: normalizeString(reliefRegion.reliefType, ''),
            adjacentSeaRegionIds: uniqueStrings(reliefRegion.adjacentSeaRegionIds),
            signalKey,
            value: roundValue(value),
            sourceTruth: Object.freeze({
                elevationBias: roundValue(clamp01(reliefRegion.elevationBias)),
                ruggednessBias: roundValue(clamp01(reliefRegion.ruggednessBias)),
                coastalInfluence: roundValue(clamp01(reliefRegion.coastalInfluence))
            }),
            upstreamBurdenSnapshot: Object.freeze({
                climateExposurePressure: signals.climateExposurePressure || 0,
                waterStress: signals.waterStress || 0,
                droughtPressureContext: signals.droughtPressureContext || 0,
                floodInstabilityContext: signals.floodInstabilityContext || 0,
                volcanicActivityBias: signals.volcanicActivityBias || 0,
                stormSpecificity: signals.stormSpecificity || 0,
                volcanicSpecificity: signals.volcanicSpecificity || 0,
                floodSpecificity: signals.floodSpecificity || 0,
                droughtSpecificity: signals.droughtSpecificity || 0,
                causeConvergence: signals.causeConvergence || 0
            })
        });
    }

    function buildCatastrophePressureField(fieldId, reliefRegions, context, signalKey, description, generatorSeed) {
        const perReliefScores = reliefRegions.map((reliefRegion) => {
            const signals = inferCatastropheSignals(reliefRegion, context);
            return buildCatastropheScoreEntry(reliefRegion, signalKey, signals[signalKey], signals);
        });
        const values = perReliefScores.map((entry) => entry.value);

        return Object.freeze({
            type: 'phase2ScalarField',
            fieldId,
            domainId: 'catastrophe',
            ownership: 'pressure',
            deterministic: true,
            derivationMode: 'coarse_pressure_interpretation_only',
            sourceRecordType: 'reliefRegions',
            sourceFieldIds: Object.freeze([
                'reliefType',
                'elevationBias',
                'ruggednessBias',
                'coastalInfluence',
                'adjacentSeaRegionIds'
            ]),
            supportRecordTypes: Object.freeze([
                'climateBands',
                'riverBasins',
                'volcanicZones'
            ]),
            upstreamPressureDependencies: CATASTROPHE_SUSCEPTIBILITY_GENERATOR_INPUT_SPEC.upstreamPressureDependencies.slice(),
            introducesTimingSemantics: false,
            mixesTimingSemantics: false,
            contrastPolicy: CATASTROPHE_BURDEN_CONTRAST_POLICY.policyId,
            description,
            deterministicSeedUsed: generatorSeed,
            perReliefScores,
            summary: Object.freeze({
                recordCount: perReliefScores.length,
                mean: roundValue(mean(values)),
                min: roundValue(values.length ? Math.min(...values) : 0),
                max: roundValue(values.length ? Math.max(...values) : 0)
            })
        });
    }

    function getFieldMean(field) {
        if (isPlainObject(field) && isPlainObject(field.summary)) {
            return clamp01(field.summary.mean);
        }

        return 0;
    }

    function getDomainFieldMean(domainLayers = {}, domainId, fieldId) {
        const domain = isPlainObject(domainLayers[domainId]) ? domainLayers[domainId] : {};
        return getFieldMean(domain[fieldId]);
    }

    function buildPressureDomainLayers(input, generatorSeed) {
        if (isPlainObject(input.pressureDomainLayers)) {
            return Object.freeze(PRESSURE_DOMAIN_IDS.reduce((layers, domainId) => {
                layers[domainId] = cloneValue(input.pressureDomainLayers[domainId] || {});
                return layers;
            }, {}));
        }

        return Object.freeze({
            climate: createClimateBurdenInterpreter({ deterministicSeed: generatorSeed }).run(input).domain,
            terrain: createTerrainHarshnessGenerator({ deterministicSeed: generatorSeed }).run(input).domain,
            hydrology: createHydrologyStressGenerator({ deterministicSeed: generatorSeed }).run(input).domain,
            food: createFoodReliabilityGenerator({ deterministicSeed: generatorSeed }).run(input).domain,
            travel: createTravelExposureGenerator({ deterministicSeed: generatorSeed }).run(input).domain,
            chokepoints: createChokepointPressureGenerator({ deterministicSeed: generatorSeed }).run(input).domain,
            isolation: createIsolationBurdenGenerator({ deterministicSeed: generatorSeed }).run(input).domain,
            ecology: createEcologicalFragilityGenerator({ deterministicSeed: generatorSeed }).run(input).domain,
            catastrophe: createCatastropheSusceptibilityGenerator({ deterministicSeed: generatorSeed }).run(input).domain
        });
    }

    function buildPressureSynthesisAxis(fieldId, domainLayers, componentWeights, description, generatorSeed) {
        const components = Object.entries(componentWeights).map(([componentId, component]) => {
            const value = getDomainFieldMean(domainLayers, component.domainId, component.fieldId);
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
        const dominantComponentStrength = dominantComponent
            ? applyThresholdContrast(
                dominantComponent.value,
                PRESSURE_SYNTHESIS_READABILITY_POLICY.dominantComponentThreshold,
                PRESSURE_SYNTHESIS_READABILITY_POLICY.dominantComponentExponent
            )
            : 0;

        return Object.freeze({
            type: 'phase2ScalarField',
            fieldId,
            domainId: 'synthesized',
            ownership: 'pressure',
            synthesized: true,
            deterministic: true,
            derivationMode: 'multi_axis_pressure_synthesis',
            description,
            deterministicSeedUsed: generatorSeed,
            sourceDomainIds: Object.freeze(Array.from(new Set(components.map((component) => component.domainId)))),
            sourceFieldIds: Object.freeze(components.map((component) => component.fieldId)),
            components: Object.freeze(components),
            value: roundValue(clamp01(synthesizedValue)),
            summary: Object.freeze({
                recordCount: components.length,
                mean: roundValue(clamp01(synthesizedValue)),
                min: roundValue(components.length ? Math.min(...components.map((component) => component.value)) : 0),
                max: roundValue(components.length ? Math.max(...components.map((component) => component.value)) : 0)
            }),
            diagnostics: Object.freeze({
                preCalibrationValue: roundValue(clamp01(synthesizedValue)),
                componentSpread: roundValue(componentSpread),
                dominantComponentId: dominantComponent ? dominantComponent.componentId : '',
                dominantComponentStrength: roundValue(dominantComponentStrength)
            }),
            replacesDomainLayers: false,
            flattensToDifficultyScalar: false,
            introducesTimingSemantics: false,
            mixesTimingSemantics: false
        });
    }

    function calibratePressureSynthesizedProfile(baseSynthesized) {
        const axisEntries = Object.entries(baseSynthesized);
        const baseValues = axisEntries.map(([, field]) => clamp01(field.value));
        const profileMean = mean(baseValues);
        const profileSpread = baseValues.length
            ? Math.max(...baseValues) - Math.min(...baseValues)
            : 0;
        const profileSpreadSignal = applyThresholdContrast(
            profileSpread,
            PRESSURE_SYNTHESIS_READABILITY_POLICY.profileSpreadThreshold,
            PRESSURE_SYNTHESIS_READABILITY_POLICY.profileContrastExponent
        );

        return Object.freeze(Object.fromEntries(axisEntries.map(([fieldId, field]) => {
            const baseValue = clamp01(field.value);
            const deviation = baseValue - profileMean;
            const deviationScale = profileSpread > 0.000001
                ? Math.min(1, Math.abs(deviation) / profileSpread)
                : 0;
            const componentSpread = clamp01(
                (field.diagnostics && Number.isFinite(field.diagnostics.componentSpread))
                    ? field.diagnostics.componentSpread
                    : 0
            );
            const dominantComponentStrength = clamp01(
                (field.diagnostics && Number.isFinite(field.diagnostics.dominantComponentStrength))
                    ? field.diagnostics.dominantComponentStrength
                    : 0
            );
            const axisSpreadSignal = applyThresholdContrast(
                componentSpread,
                PRESSURE_SYNTHESIS_READABILITY_POLICY.axisSpreadThreshold,
                PRESSURE_SYNTHESIS_READABILITY_POLICY.concentratedAxisExponent
            );
            const separationBoost = deviation * PRESSURE_SYNTHESIS_READABILITY_POLICY.profileDeviationBoost * (0.55 + (deviationScale * 0.45));
            const readabilityLift = dominantComponentStrength * 0.04 + axisSpreadSignal * 0.03;
            const calibratedValue = clamp01(
                profileMean
                + deviation
                + separationBoost
                + (deviation >= 0 ? readabilityLift * profileSpreadSignal : -(readabilityLift * profileSpreadSignal * 0.6))
            );

            return [fieldId, Object.freeze({
                ...field,
                value: roundValue(calibratedValue),
                summary: Object.freeze({
                    ...field.summary,
                    mean: roundValue(calibratedValue)
                }),
                diagnostics: Object.freeze({
                    ...(isPlainObject(field.diagnostics) ? field.diagnostics : {}),
                    calibratedValue: roundValue(calibratedValue),
                    profileMean: roundValue(profileMean),
                    profileSpread: roundValue(profileSpread),
                    profileSpreadSignal: roundValue(profileSpreadSignal),
                    deviationFromProfileMean: roundValue(deviation),
                    axisSpreadSignal: roundValue(axisSpreadSignal)
                }),
                contrastPolicy: PRESSURE_SYNTHESIS_READABILITY_POLICY.policyId,
                planningReadable: true
            })];
        })));
    }

    function buildPressureSynthesizedFields(domainLayers, generatorSeed) {
        const baseSynthesized = Object.freeze({
            survivabilityPressure: buildPressureSynthesisAxis(
                'survivabilityPressure',
                domainLayers,
                {
                    climateExposurePressure: { domainId: 'climate', fieldId: 'climateExposurePressure', weight: 0.16 },
                    waterStress: { domainId: 'hydrology', fieldId: 'waterStress', weight: 0.16 },
                    foodStress: { domainId: 'food', fieldId: 'foodStress', weight: 0.2 },
                    scarcityBaseline: { domainId: 'food', fieldId: 'scarcityBaseline', weight: 0.12 },
                    ecologicalFragility: { domainId: 'ecology', fieldId: 'ecologicalFragility', weight: 0.16 },
                    catastrophePressure: { domainId: 'catastrophe', fieldId: 'catastrophePressure', weight: 0.2 }
                },
                'Synthesized survivability pressure from burden domains only.',
                generatorSeed
            ),
            mobilityPressure: buildPressureSynthesisAxis(
                'mobilityPressure',
                domainLayers,
                {
                    mobilityTerrainPenalty: { domainId: 'terrain', fieldId: 'mobilityTerrainPenalty', weight: 0.24 },
                    fragmentationBurden: { domainId: 'terrain', fieldId: 'fragmentationBurden', weight: 0.14 },
                    travelExposure: { domainId: 'travel', fieldId: 'travelExposure', weight: 0.24 },
                    routeReliabilityInverse: { domainId: 'travel', fieldId: 'routeReliabilityInverse', weight: 0.18 },
                    movementUncertaintyPressure: { domainId: 'travel', fieldId: 'movementUncertaintyPressure', weight: 0.12 },
                    floodInstability: { domainId: 'hydrology', fieldId: 'floodInstability', weight: 0.08 }
                },
                'Synthesized mobility pressure from terrain, hydrology, and route burden only.',
                generatorSeed
            ),
            supplyPressure: buildPressureSynthesisAxis(
                'supplyPressure',
                domainLayers,
                {
                    waterReliabilityInverse: { domainId: 'hydrology', fieldId: 'waterReliabilityInverse', weight: 0.16 },
                    waterStress: { domainId: 'hydrology', fieldId: 'waterStress', weight: 0.12 },
                    foodReliabilityInverse: { domainId: 'food', fieldId: 'foodReliabilityInverse', weight: 0.24 },
                    scarcityBaseline: { domainId: 'food', fieldId: 'scarcityBaseline', weight: 0.2 },
                    routeReliabilityInverse: { domainId: 'travel', fieldId: 'routeReliabilityInverse', weight: 0.14 },
                    supportDelayBurden: { domainId: 'isolation', fieldId: 'supportDelayBurden', weight: 0.14 }
                },
                'Synthesized supply pressure from water, food, travel, and support-delay burden only.',
                generatorSeed
            ),
            chokepointStress: buildPressureSynthesisAxis(
                'chokepointStress',
                domainLayers,
                {
                    chokepointPressure: { domainId: 'chokepoints', fieldId: 'chokepointPressure', weight: 0.36 },
                    failureImpactPressure: { domainId: 'chokepoints', fieldId: 'failureImpactPressure', weight: 0.28 },
                    dependencyConcentration: { domainId: 'chokepoints', fieldId: 'dependencyConcentration', weight: 0.24 },
                    detourBurden: { domainId: 'travel', fieldId: 'detourBurden', weight: 0.12 }
                },
                'Synthesized chokepoint stress while preserving chokepoint domain detail.',
                generatorSeed
            ),
            remotenessBurden: buildPressureSynthesisAxis(
                'remotenessBurden',
                domainLayers,
                {
                    isolationPressure: { domainId: 'isolation', fieldId: 'isolationPressure', weight: 0.28 },
                    supportDelayBurden: { domainId: 'isolation', fieldId: 'supportDelayBurden', weight: 0.22 },
                    peripheralExposure: { domainId: 'isolation', fieldId: 'peripheralExposure', weight: 0.2 },
                    accessFragility: { domainId: 'isolation', fieldId: 'accessFragility', weight: 0.18 },
                    routeReliabilityInverse: { domainId: 'travel', fieldId: 'routeReliabilityInverse', weight: 0.12 }
                },
                'Synthesized remoteness burden from isolation and access fragility only.',
                generatorSeed
            ),
            ecologicalBurden: buildPressureSynthesisAxis(
                'ecologicalBurden',
                domainLayers,
                {
                    ecologicalFragility: { domainId: 'ecology', fieldId: 'ecologicalFragility', weight: 0.28 },
                    ecologicalStabilityInverse: { domainId: 'ecology', fieldId: 'ecologicalStabilityInverse', weight: 0.22 },
                    regenerationWeakness: { domainId: 'ecology', fieldId: 'regenerationWeakness', weight: 0.22 },
                    carryingCapacityBrittleness: { domainId: 'ecology', fieldId: 'carryingCapacityBrittleness', weight: 0.18 },
                    droughtPressure: { domainId: 'hydrology', fieldId: 'droughtPressure', weight: 0.1 }
                },
                'Synthesized ecological burden from brittleness and regeneration weakness only.',
                generatorSeed
            ),
            catastropheSusceptibility: buildPressureSynthesisAxis(
                'catastropheSusceptibility',
                domainLayers,
                {
                    catastrophePressure: { domainId: 'catastrophe', fieldId: 'catastrophePressure', weight: 0.28 },
                    stormBreakRisk: { domainId: 'catastrophe', fieldId: 'stormBreakRisk', weight: 0.16 },
                    volcanicInstability: { domainId: 'catastrophe', fieldId: 'volcanicInstability', weight: 0.16 },
                    floodBreakRisk: { domainId: 'catastrophe', fieldId: 'floodBreakRisk', weight: 0.16 },
                    droughtBreakRisk: { domainId: 'catastrophe', fieldId: 'droughtBreakRisk', weight: 0.16 },
                    climateExposurePressure: { domainId: 'climate', fieldId: 'climateExposurePressure', weight: 0.08 }
                },
                'Synthesized catastrophe susceptibility from cause-separated pressure channels only.',
                generatorSeed
            )
        });

        return calibratePressureSynthesizedProfile(baseSynthesized);
    }

    function getClimateBurdenInterpreterContract() {
        return Object.freeze({
            moduleId: MODULE_ID,
            version: MODULE_VERSION,
            input: CLIMATE_BURDEN_INTERPRETER_INPUT_SPEC,
            output: CLIMATE_BURDEN_INTERPRETER_OUTPUT_SPEC
        });
    }

    function createClimateBurdenInterpreterOutputSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        const metadataOverrides = isPlainObject(normalizedOverrides.metadata)
            ? normalizedOverrides.metadata
            : {};
        return Object.freeze({
            domain: {
                ...cloneValue(CLIMATE_BURDEN_INTERPRETER_OUTPUT_SPEC.outputShape.domain),
                ...(isPlainObject(normalizedOverrides.domain) ? cloneValue(normalizedOverrides.domain) : {})
            },
            metadata: {
                ...cloneValue(CLIMATE_BURDEN_INTERPRETER_OUTPUT_SPEC.outputShape.metadata),
                ...cloneValue(metadataOverrides)
            }
        });
    }

    function getTerrainHarshnessGeneratorContract() {
        return Object.freeze({
            moduleId: TERRAIN_MODULE_ID,
            version: TERRAIN_MODULE_VERSION,
            input: TERRAIN_HARSHNESS_GENERATOR_INPUT_SPEC,
            output: TERRAIN_HARSHNESS_GENERATOR_OUTPUT_SPEC
        });
    }

    function createTerrainHarshnessGeneratorOutputSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        const metadataOverrides = isPlainObject(normalizedOverrides.metadata)
            ? normalizedOverrides.metadata
            : {};
        return Object.freeze({
            domain: {
                ...cloneValue(TERRAIN_HARSHNESS_GENERATOR_OUTPUT_SPEC.outputShape.domain),
                ...(isPlainObject(normalizedOverrides.domain) ? cloneValue(normalizedOverrides.domain) : {})
            },
            metadata: {
                ...cloneValue(TERRAIN_HARSHNESS_GENERATOR_OUTPUT_SPEC.outputShape.metadata),
                ...cloneValue(metadataOverrides)
            }
        });
    }

    function getHydrologyStressGeneratorContract() {
        return Object.freeze({
            moduleId: HYDROLOGY_MODULE_ID,
            version: HYDROLOGY_MODULE_VERSION,
            input: HYDROLOGY_STRESS_GENERATOR_INPUT_SPEC,
            output: HYDROLOGY_STRESS_GENERATOR_OUTPUT_SPEC
        });
    }

    function createHydrologyStressGeneratorOutputSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        const metadataOverrides = isPlainObject(normalizedOverrides.metadata)
            ? normalizedOverrides.metadata
            : {};
        return Object.freeze({
            domain: {
                ...cloneValue(HYDROLOGY_STRESS_GENERATOR_OUTPUT_SPEC.outputShape.domain),
                ...(isPlainObject(normalizedOverrides.domain) ? cloneValue(normalizedOverrides.domain) : {})
            },
            metadata: {
                ...cloneValue(HYDROLOGY_STRESS_GENERATOR_OUTPUT_SPEC.outputShape.metadata),
                ...cloneValue(metadataOverrides)
            }
        });
    }

    function getFoodReliabilityGeneratorContract() {
        return Object.freeze({
            moduleId: FOOD_MODULE_ID,
            version: FOOD_MODULE_VERSION,
            input: FOOD_RELIABILITY_GENERATOR_INPUT_SPEC,
            output: FOOD_RELIABILITY_GENERATOR_OUTPUT_SPEC
        });
    }

    function createFoodReliabilityGeneratorOutputSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        const metadataOverrides = isPlainObject(normalizedOverrides.metadata)
            ? normalizedOverrides.metadata
            : {};
        return Object.freeze({
            domain: {
                ...cloneValue(FOOD_RELIABILITY_GENERATOR_OUTPUT_SPEC.outputShape.domain),
                ...(isPlainObject(normalizedOverrides.domain) ? cloneValue(normalizedOverrides.domain) : {})
            },
            metadata: {
                ...cloneValue(FOOD_RELIABILITY_GENERATOR_OUTPUT_SPEC.outputShape.metadata),
                ...cloneValue(metadataOverrides)
            }
        });
    }

    function getTravelExposureGeneratorContract() {
        return Object.freeze({
            moduleId: TRAVEL_MODULE_ID,
            version: TRAVEL_MODULE_VERSION,
            input: TRAVEL_EXPOSURE_GENERATOR_INPUT_SPEC,
            output: TRAVEL_EXPOSURE_GENERATOR_OUTPUT_SPEC
        });
    }

    function createTravelExposureGeneratorOutputSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        const metadataOverrides = isPlainObject(normalizedOverrides.metadata)
            ? normalizedOverrides.metadata
            : {};
        return Object.freeze({
            domain: {
                ...cloneValue(TRAVEL_EXPOSURE_GENERATOR_OUTPUT_SPEC.outputShape.domain),
                ...(isPlainObject(normalizedOverrides.domain) ? cloneValue(normalizedOverrides.domain) : {})
            },
            metadata: {
                ...cloneValue(TRAVEL_EXPOSURE_GENERATOR_OUTPUT_SPEC.outputShape.metadata),
                ...cloneValue(metadataOverrides)
            }
        });
    }

    function getChokepointPressureGeneratorContract() {
        return Object.freeze({
            moduleId: CHOKEPOINT_MODULE_ID,
            version: CHOKEPOINT_MODULE_VERSION,
            input: CHOKEPOINT_PRESSURE_GENERATOR_INPUT_SPEC,
            output: CHOKEPOINT_PRESSURE_GENERATOR_OUTPUT_SPEC
        });
    }

    function createChokepointPressureGeneratorOutputSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        const metadataOverrides = isPlainObject(normalizedOverrides.metadata)
            ? normalizedOverrides.metadata
            : {};
        return Object.freeze({
            domain: {
                ...cloneValue(CHOKEPOINT_PRESSURE_GENERATOR_OUTPUT_SPEC.outputShape.domain),
                ...(isPlainObject(normalizedOverrides.domain) ? cloneValue(normalizedOverrides.domain) : {})
            },
            metadata: {
                ...cloneValue(CHOKEPOINT_PRESSURE_GENERATOR_OUTPUT_SPEC.outputShape.metadata),
                ...cloneValue(metadataOverrides)
            }
        });
    }

    function getIsolationBurdenGeneratorContract() {
        return Object.freeze({
            moduleId: ISOLATION_MODULE_ID,
            version: ISOLATION_MODULE_VERSION,
            input: ISOLATION_BURDEN_GENERATOR_INPUT_SPEC,
            output: ISOLATION_BURDEN_GENERATOR_OUTPUT_SPEC
        });
    }

    function createIsolationBurdenGeneratorOutputSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        const metadataOverrides = isPlainObject(normalizedOverrides.metadata)
            ? normalizedOverrides.metadata
            : {};
        return Object.freeze({
            domain: {
                ...cloneValue(ISOLATION_BURDEN_GENERATOR_OUTPUT_SPEC.outputShape.domain),
                ...(isPlainObject(normalizedOverrides.domain) ? cloneValue(normalizedOverrides.domain) : {})
            },
            metadata: {
                ...cloneValue(ISOLATION_BURDEN_GENERATOR_OUTPUT_SPEC.outputShape.metadata),
                ...cloneValue(metadataOverrides)
            }
        });
    }

    function getEcologicalFragilityGeneratorContract() {
        return Object.freeze({
            moduleId: ECOLOGY_MODULE_ID,
            version: ECOLOGY_MODULE_VERSION,
            input: ECOLOGICAL_FRAGILITY_GENERATOR_INPUT_SPEC,
            output: ECOLOGICAL_FRAGILITY_GENERATOR_OUTPUT_SPEC
        });
    }

    function createEcologicalFragilityGeneratorOutputSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        const metadataOverrides = isPlainObject(normalizedOverrides.metadata)
            ? normalizedOverrides.metadata
            : {};
        return Object.freeze({
            domain: {
                ...cloneValue(ECOLOGICAL_FRAGILITY_GENERATOR_OUTPUT_SPEC.outputShape.domain),
                ...(isPlainObject(normalizedOverrides.domain) ? cloneValue(normalizedOverrides.domain) : {})
            },
            metadata: {
                ...cloneValue(ECOLOGICAL_FRAGILITY_GENERATOR_OUTPUT_SPEC.outputShape.metadata),
                ...cloneValue(metadataOverrides)
            }
        });
    }

    function getCatastropheSusceptibilityGeneratorContract() {
        return Object.freeze({
            moduleId: CATASTROPHE_MODULE_ID,
            version: CATASTROPHE_MODULE_VERSION,
            input: CATASTROPHE_SUSCEPTIBILITY_GENERATOR_INPUT_SPEC,
            output: CATASTROPHE_SUSCEPTIBILITY_GENERATOR_OUTPUT_SPEC
        });
    }

    function createCatastropheSusceptibilityGeneratorOutputSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        const metadataOverrides = isPlainObject(normalizedOverrides.metadata)
            ? normalizedOverrides.metadata
            : {};
        return Object.freeze({
            domain: {
                ...cloneValue(CATASTROPHE_SUSCEPTIBILITY_GENERATOR_OUTPUT_SPEC.outputShape.domain),
                ...(isPlainObject(normalizedOverrides.domain) ? cloneValue(normalizedOverrides.domain) : {})
            },
            metadata: {
                ...cloneValue(CATASTROPHE_SUSCEPTIBILITY_GENERATOR_OUTPUT_SPEC.outputShape.metadata),
                ...cloneValue(metadataOverrides)
            }
        });
    }

    function getPressureSynthesisContract() {
        return Object.freeze({
            moduleId: PRESSURE_SYNTHESIS_MODULE_ID,
            version: PRESSURE_SYNTHESIS_MODULE_VERSION,
            input: PRESSURE_SYNTHESIS_INPUT_SPEC,
            output: PRESSURE_SYNTHESIS_OUTPUT_SPEC
        });
    }

    function createPressureSynthesisOutputSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        const metadataOverrides = isPlainObject(normalizedOverrides.metadata)
            ? normalizedOverrides.metadata
            : {};
        return Object.freeze({
            synthesized: {
                ...cloneValue(PRESSURE_SYNTHESIS_OUTPUT_SPEC.outputShape.synthesized),
                ...(isPlainObject(normalizedOverrides.synthesized) ? cloneValue(normalizedOverrides.synthesized) : {})
            },
            domainLayers: {
                ...cloneValue(PRESSURE_SYNTHESIS_OUTPUT_SPEC.outputShape.domainLayers),
                ...(isPlainObject(normalizedOverrides.domainLayers) ? cloneValue(normalizedOverrides.domainLayers) : {})
            },
            metadata: {
                ...cloneValue(PRESSURE_SYNTHESIS_OUTPUT_SPEC.outputShape.metadata),
                ...cloneValue(metadataOverrides)
            }
        });
    }

    function createClimateBurdenInterpreter(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const interpreterSeed = Object.prototype.hasOwnProperty.call(normalizedOptions, 'deterministicSeed')
            ? normalizedOptions.deterministicSeed
            : null;

        return Object.freeze({
            moduleId: MODULE_ID,
            version: MODULE_VERSION,
            deterministic: true,
            seedPurpose: 'pressure',
            namespaceId: 'phase2.pressure.climate',
            deterministicSeed: interpreterSeed,
            input: CLIMATE_BURDEN_INTERPRETER_INPUT_SPEC,
            output: CLIMATE_BURDEN_INTERPRETER_OUTPUT_SPEC,
            run(input = {}) {
                const climateBands = resolveClimateBands(input);
                const recordBindingContextId = resolveBindingContextId(input);

                return createClimateBurdenInterpreterOutputSkeleton({
                    domain: {
                        coldPressure: buildClimatePressureField(
                            'coldPressure',
                            climateBands,
                            'coldSignal',
                            'Coarse climate burden from colder-side climate band truth only.',
                            interpreterSeed
                        ),
                        heatPressure: buildClimatePressureField(
                            'heatPressure',
                            climateBands,
                            'heatSignal',
                            'Coarse climate burden from hotter-side climate band truth only.',
                            interpreterSeed
                        ),
                        humidityPressure: buildClimatePressureField(
                            'humidityPressure',
                            climateBands,
                            'humiditySignal',
                            'Coarse climate burden from humidity-side climate band truth only.',
                            interpreterSeed
                        ),
                        climateExposurePressure: buildClimatePressureField(
                            'climateExposurePressure',
                            climateBands,
                            'climateExposureSignal',
                            'Coarse climate burden from combined thermal and moisture exposure truth only.',
                            interpreterSeed
                        )
                    },
                    metadata: {
                        deterministicSeedUsed: interpreterSeed,
                        inputAccepted: isPlainObject(input),
                        recordBindingContextId,
                        sourceClimateBandCount: climateBands.length,
                        sourceTruthOnly: true,
                        rebuiltClimateGeneration: false,
                        mixesTimingSemantics: false,
                        contrastPolicy: CLIMATE_BURDEN_CONTRAST_POLICY.policyId,
                        stubReason: ''
                    }
                });
            }
        });
    }

    function createTerrainHarshnessGenerator(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const generatorSeed = Object.prototype.hasOwnProperty.call(normalizedOptions, 'deterministicSeed')
            ? normalizedOptions.deterministicSeed
            : null;

        return Object.freeze({
            moduleId: TERRAIN_MODULE_ID,
            version: TERRAIN_MODULE_VERSION,
            deterministic: true,
            seedPurpose: 'pressure',
            namespaceId: 'phase2.pressure.terrain',
            deterministicSeed: generatorSeed,
            input: TERRAIN_HARSHNESS_GENERATOR_INPUT_SPEC,
            output: TERRAIN_HARSHNESS_GENERATOR_OUTPUT_SPEC,
            run(input = {}) {
                const reliefRegions = resolveReliefRegions(input);
                const mountainSystems = resolveMountainSystems(input);
                const mountainIndex = indexMountainSystemsByReliefRegion(mountainSystems);
                const recordBindingContextId = resolveBindingContextId(input);

                return createTerrainHarshnessGeneratorOutputSkeleton({
                    domain: {
                        terrainHarshness: buildTerrainPressureField(
                            'terrainHarshness',
                            reliefRegions,
                            mountainIndex,
                            'terrainHarshness',
                            'Coarse terrain burden from relief and mountain truth only.',
                            generatorSeed
                        ),
                        slopeBurden: buildTerrainPressureField(
                            'slopeBurden',
                            reliefRegions,
                            mountainIndex,
                            'slopeBurden',
                            'Coarse slope burden from relief elevation and mountain uplift truth only.',
                            generatorSeed
                        ),
                        fragmentationBurden: buildTerrainPressureField(
                            'fragmentationBurden',
                            reliefRegions,
                            mountainIndex,
                            'fragmentationBurden',
                            'Coarse fragmentation burden from ruggedness, coastal breakup, and mountain continuity truth only.',
                            generatorSeed
                        ),
                        mobilityTerrainPenalty: buildTerrainPressureField(
                            'mobilityTerrainPenalty',
                            reliefRegions,
                            mountainIndex,
                            'mobilityTerrainPenalty',
                            'Coarse mobility terrain penalty from relief and mountain terrain burden truth only.',
                            generatorSeed
                        )
                    },
                    metadata: {
                        deterministicSeedUsed: generatorSeed,
                        inputAccepted: isPlainObject(input),
                        recordBindingContextId,
                        sourceReliefRegionCount: reliefRegions.length,
                        sourceMountainSystemCount: mountainSystems.length,
                        sourceTruthOnly: true,
                        rebuiltTerrainGeneration: false,
                        mixesTimingSemantics: false,
                        contrastPolicy: TERRAIN_BURDEN_CONTRAST_POLICY.policyId,
                        stubReason: ''
                    }
                });
            }
        });
    }

    function createHydrologyStressGenerator(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const generatorSeed = Object.prototype.hasOwnProperty.call(normalizedOptions, 'deterministicSeed')
            ? normalizedOptions.deterministicSeed
            : null;

        return Object.freeze({
            moduleId: HYDROLOGY_MODULE_ID,
            version: HYDROLOGY_MODULE_VERSION,
            deterministic: true,
            seedPurpose: 'pressure',
            namespaceId: 'phase2.pressure.hydrology',
            deterministicSeed: generatorSeed,
            input: HYDROLOGY_STRESS_GENERATOR_INPUT_SPEC,
            output: HYDROLOGY_STRESS_GENERATOR_OUTPUT_SPEC,
            run(input = {}) {
                const riverBasins = resolveRiverBasins(input);
                const mountainSystems = resolveMountainSystems(input);
                const seaRegions = resolveSeaRegions(input);
                const mountainIndex = indexById(mountainSystems, 'mountainSystemId');
                const seaRegionIndex = indexById(seaRegions, 'seaRegionId');
                const recordBindingContextId = resolveBindingContextId(input);

                return createHydrologyStressGeneratorOutputSkeleton({
                    domain: {
                        waterReliabilityInverse: buildHydrologyPressureField(
                            'waterReliabilityInverse',
                            riverBasins,
                            mountainIndex,
                            seaRegionIndex,
                            'waterReliabilityInverse',
                            'Coarse hydrology burden from river basin reliability truth and physical support context only.',
                            generatorSeed
                        ),
                        waterStress: buildHydrologyPressureField(
                            'waterStress',
                            riverBasins,
                            mountainIndex,
                            seaRegionIndex,
                            'waterStress',
                            'Coarse hydrology stress from river basin continuity and drainage truth only.',
                            generatorSeed
                        ),
                        droughtPressure: buildHydrologyPressureField(
                            'droughtPressure',
                            riverBasins,
                            mountainIndex,
                            seaRegionIndex,
                            'droughtPressure',
                            'Coarse drought pressure from river basin reliability and catchment truth only.',
                            generatorSeed
                        ),
                        floodInstability: buildHydrologyPressureField(
                            'floodInstability',
                            riverBasins,
                            mountainIndex,
                            seaRegionIndex,
                            'floodInstability',
                            'Coarse flood instability from river basin scale, continuity, and terminal drainage truth only.',
                            generatorSeed
                        )
                    },
                    metadata: {
                        deterministicSeedUsed: generatorSeed,
                        inputAccepted: isPlainObject(input),
                        recordBindingContextId,
                        sourceRiverBasinCount: riverBasins.length,
                        sourceMountainSystemCount: mountainSystems.length,
                        sourceSeaRegionCount: seaRegions.length,
                        sourceTruthOnly: true,
                        rebuiltHydrologyGeneration: false,
                        mixesTimingSemantics: false,
                        contrastPolicy: HYDROLOGY_BURDEN_CONTRAST_POLICY.policyId,
                        stubReason: ''
                    }
                });
            }
        });
    }

    function createFoodReliabilityGenerator(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const generatorSeed = Object.prototype.hasOwnProperty.call(normalizedOptions, 'deterministicSeed')
            ? normalizedOptions.deterministicSeed
            : null;

        return Object.freeze({
            moduleId: FOOD_MODULE_ID,
            version: FOOD_MODULE_VERSION,
            deterministic: true,
            seedPurpose: 'pressure',
            namespaceId: 'phase2.pressure.food',
            deterministicSeed: generatorSeed,
            input: FOOD_RELIABILITY_GENERATOR_INPUT_SPEC,
            output: FOOD_RELIABILITY_GENERATOR_OUTPUT_SPEC,
            run(input = {}) {
                const climateBands = resolveClimateBands(input);
                const recordBindingContextId = resolveBindingContextId(input);

                const climateOutput = createClimateBurdenInterpreter({
                    deterministicSeed: generatorSeed
                }).run(input);
                const terrainOutput = createTerrainHarshnessGenerator({
                    deterministicSeed: generatorSeed
                }).run(input);
                const hydrologyOutput = createHydrologyStressGenerator({
                    deterministicSeed: generatorSeed
                }).run(input);

                const context = {
                    climateScores: {
                        coldPressure: createScoreMap(climateOutput.domain.coldPressure.perBandScores),
                        heatPressure: createScoreMap(climateOutput.domain.heatPressure.perBandScores),
                        humidityPressure: createScoreMap(climateOutput.domain.humidityPressure.perBandScores),
                        climateExposurePressure: createScoreMap(climateOutput.domain.climateExposurePressure.perBandScores)
                    },
                    terrainScores: {
                        terrainHarshness: createScoreMap(terrainOutput.domain.terrainHarshness.perReliefScores),
                        slopeBurden: createScoreMap(terrainOutput.domain.slopeBurden.perReliefScores),
                        fragmentationBurden: createScoreMap(terrainOutput.domain.fragmentationBurden.perReliefScores),
                        mobilityTerrainPenalty: createScoreMap(terrainOutput.domain.mobilityTerrainPenalty.perReliefScores)
                    },
                    hydrologyScores: {
                        waterReliabilityInverse: createScoreMap(hydrologyOutput.domain.waterReliabilityInverse.perBasinScores),
                        waterStress: createScoreMap(hydrologyOutput.domain.waterStress.perBasinScores),
                        droughtPressure: createScoreMap(hydrologyOutput.domain.droughtPressure.perBasinScores),
                        floodInstability: createScoreMap(hydrologyOutput.domain.floodInstability.perBasinScores)
                    }
                };

                return createFoodReliabilityGeneratorOutputSkeleton({
                    domain: {
                        foodStress: buildFoodPressureField(
                            'foodStress',
                            climateBands,
                            context,
                            'foodStress',
                            'Coarse food stress from climate, terrain, and hydrology burden interpretation only.',
                            generatorSeed
                        ),
                        foodReliabilityInverse: buildFoodPressureField(
                            'foodReliabilityInverse',
                            climateBands,
                            context,
                            'foodReliabilityInverse',
                            'Coarse inverse food reliability from climate, terrain, and hydrology burden interpretation only.',
                            generatorSeed
                        ),
                        fertilitySupportInverse: buildFoodPressureField(
                            'fertilitySupportInverse',
                            climateBands,
                            context,
                            'fertilitySupportInverse',
                            'Coarse inverse fertility support from climate, terrain, and hydrology burden interpretation only.',
                            generatorSeed
                        ),
                        scarcityBaseline: buildFoodPressureField(
                            'scarcityBaseline',
                            climateBands,
                            context,
                            'scarcityBaseline',
                            'Coarse baseline scarcity pressure from climate, terrain, and hydrology burden interpretation only.',
                            generatorSeed
                        )
                    },
                    metadata: {
                        deterministicSeedUsed: generatorSeed,
                        inputAccepted: isPlainObject(input),
                        recordBindingContextId,
                        sourceClimateBandCount: climateBands.length,
                        upstreamPressureInterpretationOnly: true,
                        upstreamModules: Object.freeze([
                            MODULE_ID,
                            TERRAIN_MODULE_ID,
                            HYDROLOGY_MODULE_ID
                        ]),
                        introducesScarcityTiming: false,
                        mixesTimingSemantics: false,
                        contrastPolicy: FOOD_BURDEN_CONTRAST_POLICY.policyId,
                        stubReason: ''
                    }
                });
            }
        });
    }

    function createTravelExposureGenerator(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const generatorSeed = Object.prototype.hasOwnProperty.call(normalizedOptions, 'deterministicSeed')
            ? normalizedOptions.deterministicSeed
            : null;

        return Object.freeze({
            moduleId: TRAVEL_MODULE_ID,
            version: TRAVEL_MODULE_VERSION,
            deterministic: true,
            seedPurpose: 'pressure',
            namespaceId: 'phase2.pressure.travel',
            deterministicSeed: generatorSeed,
            input: TRAVEL_EXPOSURE_GENERATOR_INPUT_SPEC,
            output: TRAVEL_EXPOSURE_GENERATOR_OUTPUT_SPEC,
            run(input = {}) {
                const macroRoutes = resolveMacroRoutes(input);
                const recordBindingContextId = resolveBindingContextId(input);
                const terrainOutput = createTerrainHarshnessGenerator({
                    deterministicSeed: generatorSeed
                }).run(input);
                const hydrologyOutput = createHydrologyStressGenerator({
                    deterministicSeed: generatorSeed
                }).run(input);

                const context = {
                    terrainScores: {
                        terrainHarshness: createScoreMap(terrainOutput.domain.terrainHarshness.perReliefScores),
                        slopeBurden: createScoreMap(terrainOutput.domain.slopeBurden.perReliefScores),
                        fragmentationBurden: createScoreMap(terrainOutput.domain.fragmentationBurden.perReliefScores),
                        mobilityTerrainPenalty: createScoreMap(terrainOutput.domain.mobilityTerrainPenalty.perReliefScores)
                    },
                    hydrologyScores: {
                        waterReliabilityInverse: createScoreMap(hydrologyOutput.domain.waterReliabilityInverse.perBasinScores),
                        waterStress: createScoreMap(hydrologyOutput.domain.waterStress.perBasinScores),
                        floodInstability: createScoreMap(hydrologyOutput.domain.floodInstability.perBasinScores)
                    }
                };

                return createTravelExposureGeneratorOutputSkeleton({
                    domain: {
                        travelExposure: buildTravelPressureField(
                            'travelExposure',
                            macroRoutes,
                            context,
                            'travelExposure',
                            'Coarse travel exposure from macro-route truth, terrain burden, and hydrology burden context only.',
                            generatorSeed
                        ),
                        routeReliabilityInverse: buildTravelPressureField(
                            'routeReliabilityInverse',
                            macroRoutes,
                            context,
                            'routeReliabilityInverse',
                            'Coarse inverse route reliability from macro-route fragility, redundancy, and related pressure context only.',
                            generatorSeed
                        ),
                        movementUncertaintyPressure: buildTravelPressureField(
                            'movementUncertaintyPressure',
                            macroRoutes,
                            context,
                            'movementUncertaintyPressure',
                            'Coarse movement uncertainty pressure from macro-route structure, terrain burden, and hydrology pressure context only.',
                            generatorSeed
                        ),
                        detourBurden: buildTravelPressureField(
                            'detourBurden',
                            macroRoutes,
                            context,
                            'detourBurden',
                            'Coarse detour burden from macro-route redundancy and related pressure context only.',
                            generatorSeed
                        )
                    },
                    metadata: {
                        deterministicSeedUsed: generatorSeed,
                        inputAccepted: isPlainObject(input),
                        recordBindingContextId,
                        sourceMacroRouteCount: macroRoutes.length,
                        explicitRouteAwareInputs: TRAVEL_EXPOSURE_GENERATOR_INPUT_SPEC.routeAwareInputs.slice(),
                        upstreamPressureDependencies: TRAVEL_EXPOSURE_GENERATOR_INPUT_SPEC.upstreamPressureDependencies.slice(),
                        upstreamPressureInterpretationOnly: true,
                        introducesTimingSemantics: false,
                        mixesTimingSemantics: false,
                        contrastPolicy: TRAVEL_BURDEN_CONTRAST_POLICY.policyId,
                        stubReason: ''
                    }
                });
            }
        });
    }

    function createChokepointPressureGenerator(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const generatorSeed = Object.prototype.hasOwnProperty.call(normalizedOptions, 'deterministicSeed')
            ? normalizedOptions.deterministicSeed
            : null;

        return Object.freeze({
            moduleId: CHOKEPOINT_MODULE_ID,
            version: CHOKEPOINT_MODULE_VERSION,
            deterministic: true,
            seedPurpose: 'pressure',
            namespaceId: 'phase2.pressure.chokepoints',
            deterministicSeed: generatorSeed,
            input: CHOKEPOINT_PRESSURE_GENERATOR_INPUT_SPEC,
            output: CHOKEPOINT_PRESSURE_GENERATOR_OUTPUT_SPEC,
            run(input = {}) {
                const chokepoints = resolveChokepoints(input);
                const recordBindingContextId = resolveBindingContextId(input);

                return createChokepointPressureGeneratorOutputSkeleton({
                    domain: {
                        chokepointPressure: buildChokepointPressureField(
                            'chokepointPressure',
                            chokepoints,
                            'chokepointPressure',
                            'Coarse chokepoint pressure from canonical chokepoint control, dependency, bypass, and collapse truth only.',
                            generatorSeed
                        ),
                        failureImpactPressure: buildChokepointPressureField(
                            'failureImpactPressure',
                            chokepoints,
                            'failureImpactPressure',
                            'Coarse failure impact pressure from canonical chokepoint collapse and dependency truth only.',
                            generatorSeed
                        ),
                        dependencyConcentration: buildChokepointPressureField(
                            'dependencyConcentration',
                            chokepoints,
                            'dependencyConcentration',
                            'Coarse dependency concentration from canonical chokepoint dependency and bypass truth only.',
                            generatorSeed
                        )
                    },
                    metadata: {
                        deterministicSeedUsed: generatorSeed,
                        inputAccepted: isPlainObject(input),
                        recordBindingContextId,
                        sourceChokepointCount: chokepoints.length,
                        explicitChokepointAwareInputs: CHOKEPOINT_PRESSURE_GENERATOR_INPUT_SPEC.chokepointAwareInputs.slice(),
                        upstreamPressureDependencies: CHOKEPOINT_PRESSURE_GENERATOR_INPUT_SPEC.upstreamPressureDependencies.slice(),
                        sourceTruthOnly: true,
                        introducesTimingSemantics: false,
                        mixesTimingSemantics: false,
                        contrastPolicy: CHOKEPOINT_BURDEN_CONTRAST_POLICY.policyId,
                        stubReason: ''
                    }
                });
            }
        });
    }

    function createIsolationBurdenGenerator(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const generatorSeed = Object.prototype.hasOwnProperty.call(normalizedOptions, 'deterministicSeed')
            ? normalizedOptions.deterministicSeed
            : null;

        return Object.freeze({
            moduleId: ISOLATION_MODULE_ID,
            version: ISOLATION_MODULE_VERSION,
            deterministic: true,
            seedPurpose: 'pressure',
            namespaceId: 'phase2.pressure.isolation',
            deterministicSeed: generatorSeed,
            input: ISOLATION_BURDEN_GENERATOR_INPUT_SPEC,
            output: ISOLATION_BURDEN_GENERATOR_OUTPUT_SPEC,
            run(input = {}) {
                const isolatedZones = resolveIsolatedZones(input);
                const recordBindingContextId = resolveBindingContextId(input);

                return createIsolationBurdenGeneratorOutputSkeleton({
                    domain: {
                        isolationPressure: buildIsolationPressureField(
                            'isolationPressure',
                            isolatedZones,
                            'isolationPressure',
                            'Coarse isolation pressure from canonical isolation truth and support delay context only.',
                            generatorSeed
                        ),
                        supportDelayBurden: buildIsolationPressureField(
                            'supportDelayBurden',
                            isolatedZones,
                            'supportDelayBurden',
                            'Coarse support-delay burden from canonical isolation and resupply difficulty truth only.',
                            generatorSeed
                        ),
                        peripheralExposure: buildIsolationPressureField(
                            'peripheralExposure',
                            isolatedZones,
                            'peripheralExposure',
                            'Coarse peripheral exposure from canonical isolation and collapse-likelihood truth only.',
                            generatorSeed
                        ),
                        accessFragility: buildIsolationPressureField(
                            'accessFragility',
                            isolatedZones,
                            'accessFragility',
                            'Coarse access fragility from canonical isolation and support-delay truth only.',
                            generatorSeed
                        )
                    },
                    metadata: {
                        deterministicSeedUsed: generatorSeed,
                        inputAccepted: isPlainObject(input),
                        recordBindingContextId,
                        sourceIsolatedZoneCount: isolatedZones.length,
                        explicitIsolationAwareInputs: ISOLATION_BURDEN_GENERATOR_INPUT_SPEC.isolationAwareInputs.slice(),
                        upstreamPressureDependencies: ISOLATION_BURDEN_GENERATOR_INPUT_SPEC.upstreamPressureDependencies.slice(),
                        sourceTruthOnly: true,
                        introducesTimingSemantics: false,
                        mixesTimingSemantics: false,
                        contrastPolicy: ISOLATION_BURDEN_CONTRAST_POLICY.policyId,
                        stubReason: ''
                    }
                });
            }
        });
    }

    function createEcologicalFragilityGenerator(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const generatorSeed = Object.prototype.hasOwnProperty.call(normalizedOptions, 'deterministicSeed')
            ? normalizedOptions.deterministicSeed
            : null;

        return Object.freeze({
            moduleId: ECOLOGY_MODULE_ID,
            version: ECOLOGY_MODULE_VERSION,
            deterministic: true,
            seedPurpose: 'pressure',
            namespaceId: 'phase2.pressure.ecology',
            deterministicSeed: generatorSeed,
            input: ECOLOGICAL_FRAGILITY_GENERATOR_INPUT_SPEC,
            output: ECOLOGICAL_FRAGILITY_GENERATOR_OUTPUT_SPEC,
            run(input = {}) {
                const reliefRegions = resolveReliefRegions(input);
                const climateBands = resolveClimateBands(input);
                const riverBasins = resolveRiverBasins(input);
                const isolatedZones = resolveIsolatedZones(input);
                const recordBindingContextId = resolveBindingContextId(input);
                const climateOutput = createClimateBurdenInterpreter({
                    deterministicSeed: generatorSeed
                }).run(input);
                const hydrologyOutput = createHydrologyStressGenerator({
                    deterministicSeed: generatorSeed
                }).run(input);
                const isolationOutput = createIsolationBurdenGenerator({
                    deterministicSeed: generatorSeed
                }).run(input);

                const climateBandIdsByReliefRegion = climateBands.reduce((index, climateBand) => {
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
                const riverBasinIdsByReliefRegion = riverBasins.reduce((index, riverBasin) => {
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

                return createEcologicalFragilityGeneratorOutputSkeleton({
                    domain: {
                        ecologicalFragility: buildEcologyPressureField(
                            'ecologicalFragility',
                            reliefRegions,
                            {
                                climateBandIdsByReliefRegion,
                                riverBasinIdsByReliefRegion,
                                isolationZonesByContinent: buildIsolationZoneIndexByContinent(isolatedZones),
                                climateScores: {
                                    climateExposurePressure: createScoreMap(climateOutput.domain.climateExposurePressure.perBandScores),
                                    humidityPressure: createScoreMap(climateOutput.domain.humidityPressure.perBandScores)
                                },
                                hydrologyScores: {
                                    waterStress: createScoreMap(hydrologyOutput.domain.waterStress.perBasinScores),
                                    droughtPressure: createScoreMap(hydrologyOutput.domain.droughtPressure.perBasinScores),
                                    floodInstability: createScoreMap(hydrologyOutput.domain.floodInstability.perBasinScores)
                                },
                                isolationScores: {
                                    isolationPressure: createScoreMap(isolationOutput.domain.isolationPressure.perZoneScores),
                                    supportDelayBurden: createScoreMap(isolationOutput.domain.supportDelayBurden.perZoneScores),
                                    accessFragility: createScoreMap(isolationOutput.domain.accessFragility.perZoneScores)
                                }
                            },
                            'ecologicalFragility',
                            'Coarse ecological fragility from support logic and physical context only.',
                            generatorSeed
                        ),
                        ecologicalStabilityInverse: buildEcologyPressureField(
                            'ecologicalStabilityInverse',
                            reliefRegions,
                            {
                                climateBandIdsByReliefRegion,
                                riverBasinIdsByReliefRegion,
                                isolationZonesByContinent: buildIsolationZoneIndexByContinent(isolatedZones),
                                climateScores: {
                                    climateExposurePressure: createScoreMap(climateOutput.domain.climateExposurePressure.perBandScores),
                                    humidityPressure: createScoreMap(climateOutput.domain.humidityPressure.perBandScores)
                                },
                                hydrologyScores: {
                                    waterStress: createScoreMap(hydrologyOutput.domain.waterStress.perBasinScores),
                                    droughtPressure: createScoreMap(hydrologyOutput.domain.droughtPressure.perBasinScores),
                                    floodInstability: createScoreMap(hydrologyOutput.domain.floodInstability.perBasinScores)
                                },
                                isolationScores: {
                                    isolationPressure: createScoreMap(isolationOutput.domain.isolationPressure.perZoneScores),
                                    supportDelayBurden: createScoreMap(isolationOutput.domain.supportDelayBurden.perZoneScores),
                                    accessFragility: createScoreMap(isolationOutput.domain.accessFragility.perZoneScores)
                                }
                            },
                            'ecologicalStabilityInverse',
                            'Coarse inverse ecological stability from support logic and physical context only.',
                            generatorSeed
                        ),
                        regenerationWeakness: buildEcologyPressureField(
                            'regenerationWeakness',
                            reliefRegions,
                            {
                                climateBandIdsByReliefRegion,
                                riverBasinIdsByReliefRegion,
                                isolationZonesByContinent: buildIsolationZoneIndexByContinent(isolatedZones),
                                climateScores: {
                                    climateExposurePressure: createScoreMap(climateOutput.domain.climateExposurePressure.perBandScores),
                                    humidityPressure: createScoreMap(climateOutput.domain.humidityPressure.perBandScores)
                                },
                                hydrologyScores: {
                                    waterStress: createScoreMap(hydrologyOutput.domain.waterStress.perBasinScores),
                                    droughtPressure: createScoreMap(hydrologyOutput.domain.droughtPressure.perBasinScores),
                                    floodInstability: createScoreMap(hydrologyOutput.domain.floodInstability.perBasinScores)
                                },
                                isolationScores: {
                                    isolationPressure: createScoreMap(isolationOutput.domain.isolationPressure.perZoneScores),
                                    supportDelayBurden: createScoreMap(isolationOutput.domain.supportDelayBurden.perZoneScores),
                                    accessFragility: createScoreMap(isolationOutput.domain.accessFragility.perZoneScores)
                                }
                            },
                            'regenerationWeakness',
                            'Coarse regeneration weakness from support logic and physical context only.',
                            generatorSeed
                        ),
                        carryingCapacityBrittleness: buildEcologyPressureField(
                            'carryingCapacityBrittleness',
                            reliefRegions,
                            {
                                climateBandIdsByReliefRegion,
                                riverBasinIdsByReliefRegion,
                                isolationZonesByContinent: buildIsolationZoneIndexByContinent(isolatedZones),
                                climateScores: {
                                    climateExposurePressure: createScoreMap(climateOutput.domain.climateExposurePressure.perBandScores),
                                    humidityPressure: createScoreMap(climateOutput.domain.humidityPressure.perBandScores)
                                },
                                hydrologyScores: {
                                    waterStress: createScoreMap(hydrologyOutput.domain.waterStress.perBasinScores),
                                    droughtPressure: createScoreMap(hydrologyOutput.domain.droughtPressure.perBasinScores),
                                    floodInstability: createScoreMap(hydrologyOutput.domain.floodInstability.perBasinScores)
                                },
                                isolationScores: {
                                    isolationPressure: createScoreMap(isolationOutput.domain.isolationPressure.perZoneScores),
                                    supportDelayBurden: createScoreMap(isolationOutput.domain.supportDelayBurden.perZoneScores),
                                    accessFragility: createScoreMap(isolationOutput.domain.accessFragility.perZoneScores)
                                }
                            },
                            'carryingCapacityBrittleness',
                            'Coarse carrying-capacity brittleness from support logic and physical context only.',
                            generatorSeed
                        )
                    },
                    metadata: {
                        deterministicSeedUsed: generatorSeed,
                        inputAccepted: isPlainObject(input),
                        recordBindingContextId,
                        sourceReliefRegionCount: reliefRegions.length,
                        sourceClimateBandCount: climateBands.length,
                        sourceRiverBasinCount: riverBasins.length,
                        sourceIsolatedZoneCount: isolatedZones.length,
                        explicitSupportSystemInputs: ECOLOGICAL_FRAGILITY_GENERATOR_INPUT_SPEC.supportSystemInputs.slice(),
                        upstreamPressureDependencies: ECOLOGICAL_FRAGILITY_GENERATOR_INPUT_SPEC.upstreamPressureDependencies.slice(),
                        upstreamPressureInterpretationOnly: true,
                        introducesTimingSemantics: false,
                        mixesTimingSemantics: false,
                        contrastPolicy: ECOLOGY_BURDEN_CONTRAST_POLICY.policyId,
                        stubReason: ''
                    }
                });
            }
        });
    }

    function createCatastropheSusceptibilityGenerator(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const generatorSeed = Object.prototype.hasOwnProperty.call(normalizedOptions, 'deterministicSeed')
            ? normalizedOptions.deterministicSeed
            : null;

        return Object.freeze({
            moduleId: CATASTROPHE_MODULE_ID,
            version: CATASTROPHE_MODULE_VERSION,
            deterministic: true,
            seedPurpose: 'pressure',
            namespaceId: 'phase2.pressure.catastrophe',
            deterministicSeed: generatorSeed,
            input: CATASTROPHE_SUSCEPTIBILITY_GENERATOR_INPUT_SPEC,
            output: CATASTROPHE_SUSCEPTIBILITY_GENERATOR_OUTPUT_SPEC,
            run(input = {}) {
                const reliefRegions = resolveReliefRegions(input);
                const climateBands = resolveClimateBands(input);
                const riverBasins = resolveRiverBasins(input);
                const volcanicZones = resolveVolcanicZones(input);
                const recordBindingContextId = resolveBindingContextId(input);
                const climateOutput = createClimateBurdenInterpreter({
                    deterministicSeed: generatorSeed
                }).run(input);
                const hydrologyOutput = createHydrologyStressGenerator({
                    deterministicSeed: generatorSeed
                }).run(input);

                const climateBandIdsByReliefRegion = climateBands.reduce((index, climateBand) => {
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
                const riverBasinIdsByReliefRegion = riverBasins.reduce((index, riverBasin) => {
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
                const context = {
                    climateBandIdsByReliefRegion,
                    riverBasinIdsByReliefRegion,
                    volcanicZonesByReliefRegion: buildVolcanicZoneIndexByReliefRegion(volcanicZones),
                    climateScores: {
                        climateExposurePressure: createScoreMap(climateOutput.domain.climateExposurePressure.perBandScores)
                    },
                    hydrologyScores: {
                        waterStress: createScoreMap(hydrologyOutput.domain.waterStress.perBasinScores),
                        droughtPressure: createScoreMap(hydrologyOutput.domain.droughtPressure.perBasinScores),
                        floodInstability: createScoreMap(hydrologyOutput.domain.floodInstability.perBasinScores)
                    }
                };

                return createCatastropheSusceptibilityGeneratorOutputSkeleton({
                    domain: {
                        catastrophePressure: buildCatastrophePressureField(
                            'catastrophePressure',
                            reliefRegions,
                            context,
                            'catastrophePressure',
                            'Coarse catastrophe pressure from canonical physical truth only.',
                            generatorSeed
                        ),
                        stormBreakRisk: buildCatastrophePressureField(
                            'stormBreakRisk',
                            reliefRegions,
                            context,
                            'stormBreakRisk',
                            'Coarse storm susceptibility from climate exposure and maritime physical truth only.',
                            generatorSeed
                        ),
                        volcanicInstability: buildCatastrophePressureField(
                            'volcanicInstability',
                            reliefRegions,
                            context,
                            'volcanicInstability',
                            'Coarse volcanic susceptibility from canonical volcanic-zone truth only.',
                            generatorSeed
                        ),
                        floodBreakRisk: buildCatastrophePressureField(
                            'floodBreakRisk',
                            reliefRegions,
                            context,
                            'floodBreakRisk',
                            'Coarse flood susceptibility from hydrology and coastal physical truth only.',
                            generatorSeed
                        ),
                        droughtBreakRisk: buildCatastrophePressureField(
                            'droughtBreakRisk',
                            reliefRegions,
                            context,
                            'droughtBreakRisk',
                            'Coarse drought susceptibility from hydrology and climate physical truth only.',
                            generatorSeed
                        )
                    },
                    metadata: {
                        deterministicSeedUsed: generatorSeed,
                        inputAccepted: isPlainObject(input),
                        recordBindingContextId,
                        sourceReliefRegionCount: reliefRegions.length,
                        sourceClimateBandCount: climateBands.length,
                        sourceRiverBasinCount: riverBasins.length,
                        sourceVolcanicZoneCount: volcanicZones.length,
                        explicitCauseSpecificInputs: CATASTROPHE_SUSCEPTIBILITY_GENERATOR_INPUT_SPEC.causeSpecificInputs.slice(),
                        upstreamPressureDependencies: CATASTROPHE_SUSCEPTIBILITY_GENERATOR_INPUT_SPEC.upstreamPressureDependencies.slice(),
                        upstreamPressureInterpretationOnly: true,
                        introducesTimingSemantics: false,
                        mixesTimingSemantics: false,
                        contrastPolicy: CATASTROPHE_BURDEN_CONTRAST_POLICY.policyId,
                        stubReason: ''
                    }
                });
            }
        });
    }

    function createPressureSynthesis(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const generatorSeed = Object.prototype.hasOwnProperty.call(normalizedOptions, 'deterministicSeed')
            ? normalizedOptions.deterministicSeed
            : null;

        return Object.freeze({
            moduleId: PRESSURE_SYNTHESIS_MODULE_ID,
            version: PRESSURE_SYNTHESIS_MODULE_VERSION,
            deterministic: true,
            seedPurpose: 'pressure',
            namespaceId: 'phase2.pressure.synthesis',
            deterministicSeed: generatorSeed,
            input: PRESSURE_SYNTHESIS_INPUT_SPEC,
            output: PRESSURE_SYNTHESIS_OUTPUT_SPEC,
            run(input = {}) {
                const recordBindingContextId = resolveBindingContextId(input);
                const domainLayers = buildPressureDomainLayers(input, generatorSeed);
                const synthesized = buildPressureSynthesizedFields(domainLayers, generatorSeed);

                return createPressureSynthesisOutputSkeleton({
                    synthesized,
                    domainLayers,
                    metadata: {
                        deterministicSeedUsed: generatorSeed,
                        inputAccepted: isPlainObject(input),
                        recordBindingContextId,
                        synthesizedFieldIds: PRESSURE_SYNTHESIZED_FIELD_IDS.slice(),
                        preservedDomainLayerIds: PRESSURE_DOMAIN_IDS.slice(),
                        domainLayerCount: PRESSURE_DOMAIN_IDS.length,
                        sourceDomainLayersPreserved: true,
                        replacesDomainLayers: false,
                        flattensToDifficultyScalar: false,
                        introducesTimingSemantics: false,
                        mixesTimingSemantics: false,
                        planningReadableProfiles: true,
                        preservesRecoveryPriority: true,
                        contrastPolicy: PRESSURE_SYNTHESIS_READABILITY_POLICY.policyId,
                        forbiddenTimingInputs: PRESSURE_SYNTHESIS_INPUT_SPEC.forbiddenInputs.slice(),
                        stubReason: ''
                    }
                });
            }
        });
    }

    function getPhase2PressureModuleStub() {
        return STUB;
    }

    phase2.__contractFirstStubs = phase2.__contractFirstStubs || {};
    phase2.__contractFirstStubs[GROUP_ID] = STUB;

    Object.assign(phase2, {
        getPhase2PressureModuleStub,
        getClimateBurdenInterpreterContract,
        createClimateBurdenInterpreterOutputSkeleton,
        createClimateBurdenInterpreter,
        getTerrainHarshnessGeneratorContract,
        createTerrainHarshnessGeneratorOutputSkeleton,
        createTerrainHarshnessGenerator,
        getHydrologyStressGeneratorContract,
        createHydrologyStressGeneratorOutputSkeleton,
        createHydrologyStressGenerator,
        getFoodReliabilityGeneratorContract,
        createFoodReliabilityGeneratorOutputSkeleton,
        createFoodReliabilityGenerator,
        getTravelExposureGeneratorContract,
        createTravelExposureGeneratorOutputSkeleton,
        createTravelExposureGenerator,
        getChokepointPressureGeneratorContract,
        createChokepointPressureGeneratorOutputSkeleton,
        createChokepointPressureGenerator,
        getIsolationBurdenGeneratorContract,
        createIsolationBurdenGeneratorOutputSkeleton,
        createIsolationBurdenGenerator,
        getEcologicalFragilityGeneratorContract,
        createEcologicalFragilityGeneratorOutputSkeleton,
        createEcologicalFragilityGenerator,
        getCatastropheSusceptibilityGeneratorContract,
        createCatastropheSusceptibilityGeneratorOutputSkeleton,
        createCatastropheSusceptibilityGenerator,
        getPressureSynthesisContract,
        createPressureSynthesisOutputSkeleton,
        createPressureSynthesis
    });
})();
