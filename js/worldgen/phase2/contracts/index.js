(() => {
    const game = window.Game;
    const phase2 = game.systems.worldgenPhase2 = game.systems.worldgenPhase2 || {};
    const GROUP_ID = 'contracts';
    const PRESSURE_PACKAGE_CONTRACT_ID = 'PressureFieldPackage';
    const PRESSURE_PACKAGE_VERSION = 'phase2-pressure-v1';
    const PRESSURE_PACKAGE_PHASE_ID = 'PHASE_2';
    const RHYTHM_PACKAGE_CONTRACT_ID = 'EnvironmentalRhythmPackage';
    const RHYTHM_PACKAGE_VERSION = 'phase2-rhythm-v1';
    const RECORD_BOUND_PROFILE_CONTRACT_ID = 'RecordBoundEnvironmentalProfile';
    const RECORD_BOUND_PROFILE_VERSION = 'phase2-record-profile-v1';
    const VALIDATION_REPORT_CONTRACT_ID = 'Phase2ValidationReport';
    const VALIDATION_REPORT_VERSION = 'phase2-validation-report-v1';
    const CONTRACT_EXPORT_INDEX_ID = 'Phase2ContractExportIndex';
    const CONTRACT_EXPORT_INDEX_VERSION = 'phase2-contract-index-v1';
    const CANONICAL_RECORD_TYPE_IDS = Object.freeze([
        'continents',
        'seaRegions',
        'mountainSystems',
        'volcanicZones',
        'riverBasins',
        'climateBands',
        'reliefRegions',
        'archipelagoRegions',
        'chokepoints',
        'macroRoutes',
        'isolatedZones',
        'strategicRegions'
    ]);
    const RECORD_BOUND_PROFILE_BASE_KEYS = Object.freeze([
        'profileId',
        'recordType',
        'recordId',
        'sourcePackageId',
        'pressureSignals',
        'rhythmSignals',
        'dominantEnvironmentalTraits',
        'summary'
    ]);
    const RECORD_BOUND_PROFILE_SIGNAL_KEYS = Object.freeze([
        'pressureSignals',
        'rhythmSignals'
    ]);
    const VALIDATION_FAMILY_IDS = Object.freeze([
        'structural',
        'causal',
        'boundary',
        'distribution',
        'design',
        'gameplay',
        'summary'
    ]);
    const VALIDATION_FAMILY_KEY_BY_ID = deepFreeze({
        structural: 'structuralChecks',
        causal: 'causalChecks',
        boundary: 'boundaryChecks',
        distribution: 'distributionChecks',
        design: 'designChecks',
        gameplay: 'gameplayChecks',
        summary: 'summaryChecks'
    });
    const VALIDATION_FAMILY_ROOT_KEYS = Object.freeze(
        VALIDATION_FAMILY_IDS.map((familyId) => VALIDATION_FAMILY_KEY_BY_ID[familyId])
    );
    const VALIDATION_STATUS_IDS = Object.freeze([
        'not_run',
        'pass',
        'warning',
        'rebalance_required',
        'fail'
    ]);
    const VALIDATION_FINAL_STATUS_IDS = Object.freeze([
        'pass',
        'rebalance_required',
        'fail'
    ]);
    const VALIDATION_RECOMMENDATION_PRIORITY_IDS = Object.freeze([
        'low',
        'medium',
        'high',
        'critical'
    ]);
    const VALIDATION_CHECK_REQUIRED_KEYS = Object.freeze([
        'checkId',
        'status',
        'message',
        'details',
        'affectedPaths',
        'meta'
    ]);
    const VALIDATION_RECOMMENDATION_REQUIRED_KEYS = Object.freeze([
        'recommendationId',
        'familyId',
        'recommendationType',
        'priority',
        'message',
        'targetIds',
        'meta'
    ]);
    const VALIDATION_BLOCKING_REASON_REQUIRED_KEYS = Object.freeze([
        'blockingReasonId',
        'familyId',
        'reasonCode',
        'message',
        'affectedPaths',
        'meta'
    ]);
    const VALIDATION_FAMILY_REQUIRED_KEYS = Object.freeze([
        'familyId',
        'status',
        'checks',
        'notes',
        'recommendationIds',
        'blockingReasonIds',
        'meta'
    ]);
    const VALIDATION_REPORT_REQUIRED_KEYS = Object.freeze([
        'validationId',
        'contractId',
        'phaseId',
        'version',
        'sourcePressureFieldPackageId',
        'sourceEnvironmentalRhythmPackageId',
        'sourceMacroGeographyPackageId',
        'sourceMacroGeographyHandoffPackageId',
        ...VALIDATION_FAMILY_ROOT_KEYS,
        'rebalanceRecommendations',
        'blockingReasons',
        'finalStatus'
    ]);
    const PRESSURE_DOMAIN_FIELDS = Object.freeze({
        climate: Object.freeze([
            'coldPressure',
            'heatPressure',
            'humidityPressure',
            'climateExposurePressure'
        ]),
        terrain: Object.freeze([
            'terrainHarshness',
            'slopeBurden',
            'fragmentationBurden',
            'mobilityTerrainPenalty'
        ]),
        hydrology: Object.freeze([
            'waterReliabilityInverse',
            'waterStress',
            'droughtPressure',
            'floodInstability'
        ]),
        food: Object.freeze([
            'foodStress',
            'foodReliabilityInverse',
            'fertilitySupportInverse',
            'scarcityBaseline'
        ]),
        travel: Object.freeze([
            'travelExposure',
            'routeReliabilityInverse',
            'movementUncertaintyPressure',
            'detourBurden'
        ]),
        chokepoints: Object.freeze([
            'chokepointPressure',
            'failureImpactPressure',
            'dependencyConcentration'
        ]),
        isolation: Object.freeze([
            'isolationPressure',
            'supportDelayBurden',
            'peripheralExposure',
            'accessFragility'
        ]),
        ecology: Object.freeze([
            'ecologicalFragility',
            'ecologicalStabilityInverse',
            'regenerationWeakness',
            'carryingCapacityBrittleness'
        ]),
        catastrophe: Object.freeze([
            'catastrophePressure',
            'stormBreakRisk',
            'volcanicInstability',
            'floodBreakRisk',
            'droughtBreakRisk'
        ])
    });
    const RHYTHM_DOMAIN_FIELDS = Object.freeze({
        seasonality: Object.freeze([
            'seasonalityStrength',
            'annualSwingStrength',
            'environmentalCycleClarity'
        ]),
        storms: Object.freeze([
            'stormCadence',
            'stormBurstClustering',
            'calmToStormTransitionSharpness'
        ]),
        navigation: Object.freeze([
            'navigationWindowReliability',
            'blockedIntervalFrequency',
            'safeRouteIntervalStrength'
        ]),
        scarcity: Object.freeze([
            'scarcityCadence',
            'deficitPersistence',
            'shortageRecurrence'
        ]),
        predictability: Object.freeze([
            'predictability',
            'ruptureFrequency',
            'cadenceIrregularity',
            'temporalTrustworthiness'
        ]),
        recovery: Object.freeze([
            'recoveryTempo',
            'stabilizationInterval',
            'reliefPersistence',
            'environmentalForgiveness'
        ])
    });
    const PRESSURE_DOMAIN_IDS = Object.freeze(Object.keys(PRESSURE_DOMAIN_FIELDS));
    const RHYTHM_DOMAIN_IDS = Object.freeze(Object.keys(RHYTHM_DOMAIN_FIELDS));
    const CLIMATE_PRESSURE_DOMAIN_CONTRACT_ID = 'Phase2ClimatePressureDomain';
    const CLIMATE_PRESSURE_DOMAIN_VERSION = 'phase2-pressure-domain-climate-v1';
    const CLIMATE_PRESSURE_DOMAIN_FIELD_IDS = PRESSURE_DOMAIN_FIELDS.climate.slice();
    // Climate pressure remains an interpretive burden layer built on completed
    // Phase 1 climate truth. These slots must never turn into new climate-generation outputs.
    const CLIMATE_PRESSURE_DOMAIN_FIELD_DESCRIPTORS = deepFreeze({
        // Burden caused by sustained cold exposure as experienced in the contracted climate bands.
        coldPressure: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by cold environmental exposure.'
        },
        // Burden caused by sustained heat exposure as experienced in the contracted climate bands.
        heatPressure: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by heat environmental exposure.'
        },
        // Burden caused by dampness, saturation, and humidity-driven discomfort or fragility.
        humidityPressure: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by humidity-heavy environmental stress.'
        },
        // Combined burden of direct climate exposure where buffering and shelter are weak.
        climateExposurePressure: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Combined exposure burden from direct contact with climate-side stressors.'
        }
    });
    const CLIMATE_PRESSURE_DOMAIN_CONTRACT = deepFreeze({
        contractId: CLIMATE_PRESSURE_DOMAIN_CONTRACT_ID,
        packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
        phaseId: PRESSURE_PACKAGE_PHASE_ID,
        version: CLIMATE_PRESSURE_DOMAIN_VERSION,
        domainId: 'climate',
        interpretiveOnly: true,
        rebuildsClimateGeneration: false,
        exactFieldSet: CLIMATE_PRESSURE_DOMAIN_FIELD_IDS.slice(),
        requiredFields: CLIMATE_PRESSURE_DOMAIN_FIELD_IDS.slice(),
        fields: cloneValue(CLIMATE_PRESSURE_DOMAIN_FIELD_DESCRIPTORS)
    });
    const TERRAIN_PRESSURE_DOMAIN_CONTRACT_ID = 'Phase2TerrainPressureDomain';
    const TERRAIN_PRESSURE_DOMAIN_VERSION = 'phase2-pressure-domain-terrain-v1';
    const TERRAIN_PRESSURE_DOMAIN_FIELD_IDS = PRESSURE_DOMAIN_FIELDS.terrain.slice();
    // Terrain pressure remains a burden interpretation of completed Phase 1
    // relief and mountain truth. It must not invent new terrain formation semantics.
    const TERRAIN_PRESSURE_DOMAIN_FIELD_DESCRIPTORS = deepFreeze({
        // Aggregate terrain-side harshness from difficult topography and environmental roughness.
        terrainHarshness: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by harsh overall terrain conditions.'
        },
        // Direct burden imposed by steep gradients, elevation shifts, and exhausting slope traversal.
        slopeBurden: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by steep or exhausting slope conditions.'
        },
        // Burden caused by broken, discontinuous, or highly segmented terrain structure.
        fragmentationBurden: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by fragmented terrain continuity.'
        },
        // Terrain-specific movement penalty after harshness and fragmentation are projected onto mobility.
        mobilityTerrainPenalty: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Mobility penalty caused specifically by terrain structure and movement friction.'
        }
    });
    const TERRAIN_PRESSURE_DOMAIN_CONTRACT = deepFreeze({
        contractId: TERRAIN_PRESSURE_DOMAIN_CONTRACT_ID,
        packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
        phaseId: PRESSURE_PACKAGE_PHASE_ID,
        version: TERRAIN_PRESSURE_DOMAIN_VERSION,
        domainId: 'terrain',
        interpretiveOnly: true,
        rebuildsTerrainGeneration: false,
        exactFieldSet: TERRAIN_PRESSURE_DOMAIN_FIELD_IDS.slice(),
        requiredFields: TERRAIN_PRESSURE_DOMAIN_FIELD_IDS.slice(),
        fields: cloneValue(TERRAIN_PRESSURE_DOMAIN_FIELD_DESCRIPTORS)
    });
    const HYDROLOGY_PRESSURE_DOMAIN_CONTRACT_ID = 'Phase2HydrologyPressureDomain';
    const HYDROLOGY_PRESSURE_DOMAIN_VERSION = 'phase2-pressure-domain-hydrology-v1';
    const HYDROLOGY_PRESSURE_DOMAIN_FIELD_IDS = PRESSURE_DOMAIN_FIELDS.hydrology.slice();
    // Hydrology pressure remains a burden interpretation of completed Phase 1
    // river basin and water-distribution truth. It must not invent new water-cycle generation.
    const HYDROLOGY_PRESSURE_DOMAIN_FIELD_DESCRIPTORS = deepFreeze({
        // Inverse reliability burden when dependable water access becomes scarce or unstable.
        waterReliabilityInverse: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Inverse burden scale for how unreliable water support becomes.'
        },
        // Overall stress caused by hydrology failing to support routine survival and planning.
        waterStress: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by general water-related stress.'
        },
        // Pressure caused by drought-side water shortage, depletion, and prolonged dry vulnerability.
        droughtPressure: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by drought-like water shortage conditions.'
        },
        // Instability burden caused by flood-side disruption, overflow, and unreliable wet extremes.
        floodInstability: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by flood-driven hydrological instability.'
        }
    });
    const HYDROLOGY_PRESSURE_DOMAIN_CONTRACT = deepFreeze({
        contractId: HYDROLOGY_PRESSURE_DOMAIN_CONTRACT_ID,
        packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
        phaseId: PRESSURE_PACKAGE_PHASE_ID,
        version: HYDROLOGY_PRESSURE_DOMAIN_VERSION,
        domainId: 'hydrology',
        interpretiveOnly: true,
        rebuildsHydrologyGeneration: false,
        exactFieldSet: HYDROLOGY_PRESSURE_DOMAIN_FIELD_IDS.slice(),
        requiredFields: HYDROLOGY_PRESSURE_DOMAIN_FIELD_IDS.slice(),
        fields: cloneValue(HYDROLOGY_PRESSURE_DOMAIN_FIELD_DESCRIPTORS)
    });
    const FOOD_PRESSURE_DOMAIN_CONTRACT_ID = 'Phase2FoodPressureDomain';
    const FOOD_PRESSURE_DOMAIN_VERSION = 'phase2-pressure-domain-food-v1';
    const FOOD_PRESSURE_DOMAIN_FIELD_IDS = PRESSURE_DOMAIN_FIELDS.food.slice();
    // Food pressure remains a burden interpretation of completed Phase 1
    // fertility and support truth. It must not invent new food-production generation semantics.
    const FOOD_PRESSURE_DOMAIN_FIELD_DESCRIPTORS = deepFreeze({
        // Overall burden when food support becomes unreliable, thin, or hard to sustain.
        foodStress: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by general food-related stress.'
        },
        // Inverse reliability burden when dependable food access cannot be counted on.
        foodReliabilityInverse: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Inverse burden scale for how unreliable food support becomes.'
        },
        // Burden caused by weak fertility support and poor environmental capacity to replenish food.
        fertilitySupportInverse: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Inverse burden scale for how weak local fertility support becomes.'
        },
        // Baseline scarcity burden before timing-side rhythm variation is considered.
        scarcityBaseline: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Baseline burden intensity from persistent food scarcity conditions.'
        }
    });
    const FOOD_PRESSURE_DOMAIN_CONTRACT = deepFreeze({
        contractId: FOOD_PRESSURE_DOMAIN_CONTRACT_ID,
        packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
        phaseId: PRESSURE_PACKAGE_PHASE_ID,
        version: FOOD_PRESSURE_DOMAIN_VERSION,
        domainId: 'food',
        interpretiveOnly: true,
        rebuildsFoodGeneration: false,
        exactFieldSet: FOOD_PRESSURE_DOMAIN_FIELD_IDS.slice(),
        requiredFields: FOOD_PRESSURE_DOMAIN_FIELD_IDS.slice(),
        fields: cloneValue(FOOD_PRESSURE_DOMAIN_FIELD_DESCRIPTORS)
    });
    const TRAVEL_PRESSURE_DOMAIN_CONTRACT_ID = 'Phase2TravelPressureDomain';
    const TRAVEL_PRESSURE_DOMAIN_VERSION = 'phase2-pressure-domain-travel-v1';
    const TRAVEL_PRESSURE_DOMAIN_FIELD_IDS = PRESSURE_DOMAIN_FIELDS.travel.slice();
    // Travel pressure remains a burden interpretation of completed Phase 1
    // route, chokepoint, and connectivity truth. It must not invent new movement-network generation semantics.
    const TRAVEL_PRESSURE_DOMAIN_FIELD_DESCRIPTORS = deepFreeze({
        // Direct exposure burden faced while traversing open, risky, or poorly protected routes.
        travelExposure: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by exposed travel conditions.'
        },
        // Inverse reliability burden when expected routes cannot be trusted to stay usable or safe.
        routeReliabilityInverse: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Inverse burden scale for how unreliable route access becomes.'
        },
        // Pressure caused by uncertainty in movement outcomes, timing, and safe passage planning.
        movementUncertaintyPressure: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by uncertain movement outcomes and route planning risk.'
        },
        // Burden imposed by forced rerouting, long bypasses, and inefficient detour requirements.
        detourBurden: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by detours, bypasses, and extended rerouting.'
        }
    });
    const TRAVEL_PRESSURE_DOMAIN_CONTRACT = deepFreeze({
        contractId: TRAVEL_PRESSURE_DOMAIN_CONTRACT_ID,
        packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
        phaseId: PRESSURE_PACKAGE_PHASE_ID,
        version: TRAVEL_PRESSURE_DOMAIN_VERSION,
        domainId: 'travel',
        interpretiveOnly: true,
        rebuildsTravelGeneration: false,
        exactFieldSet: TRAVEL_PRESSURE_DOMAIN_FIELD_IDS.slice(),
        requiredFields: TRAVEL_PRESSURE_DOMAIN_FIELD_IDS.slice(),
        fields: cloneValue(TRAVEL_PRESSURE_DOMAIN_FIELD_DESCRIPTORS)
    });
    const CHOKEPOINT_PRESSURE_DOMAIN_CONTRACT_ID = 'Phase2ChokepointPressureDomain';
    const CHOKEPOINT_PRESSURE_DOMAIN_VERSION = 'phase2-pressure-domain-chokepoints-v1';
    const CHOKEPOINT_PRESSURE_DOMAIN_FIELD_IDS = PRESSURE_DOMAIN_FIELDS.chokepoints.slice();
    // Chokepoint pressure remains a burden interpretation of completed Phase 1
    // chokepoint and route-dependency truth. It must not invent new chokepoint-generation semantics.
    const CHOKEPOINT_PRESSURE_DOMAIN_FIELD_DESCRIPTORS = deepFreeze({
        // Core pressure concentrated at narrow access gates whose failure or control shapes movement.
        chokepointPressure: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity concentrated at chokepoint-dependent access paths.'
        },
        // Pressure caused by the scale of disruption if a chokepoint becomes blocked, contested, or unusable.
        failureImpactPressure: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by high-impact chokepoint failure outcomes.'
        },
        // Pressure caused by too much route or support dependence converging on the same chokepoints.
        dependencyConcentration: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by concentrated dependence on a narrow set of chokepoints.'
        }
    });
    const CHOKEPOINT_PRESSURE_DOMAIN_CONTRACT = deepFreeze({
        contractId: CHOKEPOINT_PRESSURE_DOMAIN_CONTRACT_ID,
        packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
        phaseId: PRESSURE_PACKAGE_PHASE_ID,
        version: CHOKEPOINT_PRESSURE_DOMAIN_VERSION,
        domainId: 'chokepoints',
        interpretiveOnly: true,
        rebuildsChokepointGeneration: false,
        exactFieldSet: CHOKEPOINT_PRESSURE_DOMAIN_FIELD_IDS.slice(),
        requiredFields: CHOKEPOINT_PRESSURE_DOMAIN_FIELD_IDS.slice(),
        fields: cloneValue(CHOKEPOINT_PRESSURE_DOMAIN_FIELD_DESCRIPTORS)
    });
    const ISOLATION_PRESSURE_DOMAIN_CONTRACT_ID = 'Phase2IsolationPressureDomain';
    const ISOLATION_PRESSURE_DOMAIN_VERSION = 'phase2-pressure-domain-isolation-v1';
    const ISOLATION_PRESSURE_DOMAIN_FIELD_IDS = PRESSURE_DOMAIN_FIELDS.isolation.slice();
    // Isolation pressure remains a burden interpretation of completed Phase 1
    // remoteness and access truth. It must not invent new isolation-generation semantics.
    const ISOLATION_PRESSURE_DOMAIN_FIELD_DESCRIPTORS = deepFreeze({
        // Core burden created by being environmentally isolated from support, exchange, or relief routes.
        isolationPressure: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by environmental isolation from support and access networks.'
        },
        // Burden caused by support arriving too slowly when conditions deteriorate or needs increase.
        supportDelayBurden: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by delayed support response under isolated conditions.'
        },
        // Burden created by peripheral placement where routes, redundancy, and fallback access are weak.
        peripheralExposure: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by exposed peripheral positioning.'
        },
        // Burden caused by fragile access links that can fail, degrade, or become unavailable too easily.
        accessFragility: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by fragile or failure-prone access paths.'
        }
    });
    const ISOLATION_PRESSURE_DOMAIN_CONTRACT = deepFreeze({
        contractId: ISOLATION_PRESSURE_DOMAIN_CONTRACT_ID,
        packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
        phaseId: PRESSURE_PACKAGE_PHASE_ID,
        version: ISOLATION_PRESSURE_DOMAIN_VERSION,
        domainId: 'isolation',
        interpretiveOnly: true,
        rebuildsIsolationGeneration: false,
        exactFieldSet: ISOLATION_PRESSURE_DOMAIN_FIELD_IDS.slice(),
        requiredFields: ISOLATION_PRESSURE_DOMAIN_FIELD_IDS.slice(),
        fields: cloneValue(ISOLATION_PRESSURE_DOMAIN_FIELD_DESCRIPTORS)
    });
    const ECOLOGY_PRESSURE_DOMAIN_CONTRACT_ID = 'Phase2EcologyPressureDomain';
    const ECOLOGY_PRESSURE_DOMAIN_VERSION = 'phase2-pressure-domain-ecology-v1';
    const ECOLOGY_PRESSURE_DOMAIN_FIELD_IDS = PRESSURE_DOMAIN_FIELDS.ecology.slice();
    // Ecology pressure remains a burden interpretation of completed Phase 1
    // ecological support truth. It must not invent new ecosystem-generation semantics.
    const ECOLOGY_PRESSURE_DOMAIN_FIELD_DESCRIPTORS = deepFreeze({
        // Core burden created when local ecosystems are easy to damage or unable to absorb strain.
        ecologicalFragility: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by ecologically fragile environmental conditions.'
        },
        // Inverse stability burden when ecological systems cannot hold steady under recurring pressure.
        ecologicalStabilityInverse: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Inverse burden scale for how weak ecological stability becomes.'
        },
        // Burden caused by poor regenerative recovery after extraction, disruption, or repeated stress.
        regenerationWeakness: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by weak ecological regeneration capacity.'
        },
        // Burden caused by brittle carrying capacity that fails under sustained survival demand.
        carryingCapacityBrittleness: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by brittle environmental carrying capacity.'
        }
    });
    const ECOLOGY_PRESSURE_DOMAIN_CONTRACT = deepFreeze({
        contractId: ECOLOGY_PRESSURE_DOMAIN_CONTRACT_ID,
        packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
        phaseId: PRESSURE_PACKAGE_PHASE_ID,
        version: ECOLOGY_PRESSURE_DOMAIN_VERSION,
        domainId: 'ecology',
        interpretiveOnly: true,
        rebuildsEcologyGeneration: false,
        exactFieldSet: ECOLOGY_PRESSURE_DOMAIN_FIELD_IDS.slice(),
        requiredFields: ECOLOGY_PRESSURE_DOMAIN_FIELD_IDS.slice(),
        fields: cloneValue(ECOLOGY_PRESSURE_DOMAIN_FIELD_DESCRIPTORS)
    });
    const CATASTROPHE_PRESSURE_DOMAIN_CONTRACT_ID = 'Phase2CatastrophePressureDomain';
    const CATASTROPHE_PRESSURE_DOMAIN_VERSION = 'phase2-pressure-domain-catastrophe-v1';
    const CATASTROPHE_PRESSURE_DOMAIN_FIELD_IDS = PRESSURE_DOMAIN_FIELDS.catastrophe.slice();
    // Catastrophe pressure remains a burden interpretation of completed Phase 1
    // hazard exposure truth. It must not invent new catastrophe-generation semantics.
    const CATASTROPHE_PRESSURE_DOMAIN_FIELD_DESCRIPTORS = deepFreeze({
        // Aggregate burden from catastrophic environmental disruption risk across hazard channels.
        catastrophePressure: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by broad catastrophe-side environmental disruption risk.'
        },
        // Break-risk burden driven specifically by severe storm failure events and abrupt weather collapse.
        stormBreakRisk: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by storm-driven break and disruption risk.'
        },
        // Instability burden driven specifically by volcanic disruption and nearby eruptive threat.
        volcanicInstability: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by volcanic instability and eruption-side disruption.'
        },
        // Break-risk burden driven specifically by flood events that can overwhelm routes, shelter, or support systems.
        floodBreakRisk: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by flood-driven break and disruption risk.'
        },
        // Break-risk burden driven specifically by drought events that can collapse support over time.
        droughtBreakRisk: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            description: 'Burden intensity caused by drought-driven break and support-failure risk.'
        }
    });
    const CATASTROPHE_PRESSURE_DOMAIN_CONTRACT = deepFreeze({
        contractId: CATASTROPHE_PRESSURE_DOMAIN_CONTRACT_ID,
        packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
        phaseId: PRESSURE_PACKAGE_PHASE_ID,
        version: CATASTROPHE_PRESSURE_DOMAIN_VERSION,
        domainId: 'catastrophe',
        interpretiveOnly: true,
        rebuildsCatastropheGeneration: false,
        exactFieldSet: CATASTROPHE_PRESSURE_DOMAIN_FIELD_IDS.slice(),
        requiredFields: CATASTROPHE_PRESSURE_DOMAIN_FIELD_IDS.slice(),
        fields: cloneValue(CATASTROPHE_PRESSURE_DOMAIN_FIELD_DESCRIPTORS)
    });
    const SEASONALITY_RHYTHM_DOMAIN_CONTRACT_ID = 'Phase2SeasonalityRhythmDomain';
    const SEASONALITY_RHYTHM_DOMAIN_VERSION = 'phase2-rhythm-domain-seasonality-v1';
    const SEASONALITY_RHYTHM_DOMAIN_FIELD_IDS = RHYTHM_DOMAIN_FIELDS.seasonality.slice();
    // Seasonality rhythm remains a timing interpretation of completed Phase 1
    // climate and environmental-cycle truth. It must not invent new climate-generation semantics.
    const SEASONALITY_RHYTHM_DOMAIN_FIELD_DESCRIPTORS = deepFreeze({
        // Strength of recurring seasonal timing patterns that shape when conditions shift.
        seasonalityStrength: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            description: 'Timing intensity of recurring seasonal environmental patterning.'
        },
        // Strength of broad annual swing between comparatively calmer and harsher periods.
        annualSwingStrength: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            description: 'Timing intensity of the annual environmental swing across the year.'
        },
        // Clarity with which environmental cycles can be read, anticipated, and planned around.
        environmentalCycleClarity: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            description: 'Clarity of readable environmental cycle timing.'
        }
    });
    const SEASONALITY_RHYTHM_DOMAIN_CONTRACT = deepFreeze({
        contractId: SEASONALITY_RHYTHM_DOMAIN_CONTRACT_ID,
        packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
        phaseId: PRESSURE_PACKAGE_PHASE_ID,
        version: SEASONALITY_RHYTHM_DOMAIN_VERSION,
        domainId: 'seasonality',
        interpretiveOnly: true,
        rebuildsClimateGeneration: false,
        exactFieldSet: SEASONALITY_RHYTHM_DOMAIN_FIELD_IDS.slice(),
        requiredFields: SEASONALITY_RHYTHM_DOMAIN_FIELD_IDS.slice(),
        fields: cloneValue(SEASONALITY_RHYTHM_DOMAIN_FIELD_DESCRIPTORS)
    });
    const STORM_CADENCE_RHYTHM_DOMAIN_CONTRACT_ID = 'Phase2StormCadenceRhythmDomain';
    const STORM_CADENCE_RHYTHM_DOMAIN_VERSION = 'phase2-rhythm-domain-storm-cadence-v1';
    const STORM_CADENCE_RHYTHM_DOMAIN_FIELD_IDS = RHYTHM_DOMAIN_FIELDS.storms.slice();
    // Storm cadence rhythm remains a timing interpretation of completed Phase 1
    // storm-exposure and climate-cycle truth. It must not invent new hazard-generation semantics.
    const STORM_CADENCE_RHYTHM_DOMAIN_FIELD_DESCRIPTORS = deepFreeze({
        // Cadence strength of meaningful storm recurrence across a region over time.
        stormCadence: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            description: 'Timing intensity of recurring storm cadence across the environment.'
        },
        // Degree to which storms arrive in clustered bursts rather than evenly spaced intervals.
        stormBurstClustering: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            description: 'Timing intensity of storm burst clustering and grouped storm intervals.'
        },
        // Sharpness of transitions between calmer intervals and active storm periods.
        calmToStormTransitionSharpness: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            description: 'Sharpness of timing transitions between calmer and storm-active periods.'
        }
    });
    const STORM_CADENCE_RHYTHM_DOMAIN_CONTRACT = deepFreeze({
        contractId: STORM_CADENCE_RHYTHM_DOMAIN_CONTRACT_ID,
        packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
        phaseId: PRESSURE_PACKAGE_PHASE_ID,
        version: STORM_CADENCE_RHYTHM_DOMAIN_VERSION,
        domainId: 'storms',
        interpretiveOnly: true,
        rebuildsHazardGeneration: false,
        exactFieldSet: STORM_CADENCE_RHYTHM_DOMAIN_FIELD_IDS.slice(),
        requiredFields: STORM_CADENCE_RHYTHM_DOMAIN_FIELD_IDS.slice(),
        fields: cloneValue(STORM_CADENCE_RHYTHM_DOMAIN_FIELD_DESCRIPTORS)
    });
    const NAVIGATION_RHYTHM_DOMAIN_CONTRACT_ID = 'Phase2NavigationRhythmDomain';
    const NAVIGATION_RHYTHM_DOMAIN_VERSION = 'phase2-rhythm-domain-navigation-v1';
    const NAVIGATION_RHYTHM_DOMAIN_FIELD_IDS = RHYTHM_DOMAIN_FIELDS.navigation.slice();
    // Navigation rhythm remains a timing interpretation of completed Phase 1
    // route, sea, and access-window truth. It must not invent new traversal-generation semantics.
    const NAVIGATION_RHYTHM_DOMAIN_FIELD_DESCRIPTORS = deepFreeze({
        // Reliability of usable navigation windows across expected timing cycles.
        navigationWindowReliability: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            description: 'Timing reliability of usable navigation windows across the environment.'
        },
        // Frequency with which intervals become blocked or unavailable for navigation.
        blockedIntervalFrequency: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            description: 'Timing frequency of blocked navigation intervals and access closures.'
        },
        // Strength of recurring intervals where safer or more dependable route use becomes possible.
        safeRouteIntervalStrength: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            description: 'Timing strength of recurring safer route intervals.'
        }
    });
    const NAVIGATION_RHYTHM_DOMAIN_CONTRACT = deepFreeze({
        contractId: NAVIGATION_RHYTHM_DOMAIN_CONTRACT_ID,
        packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
        phaseId: PRESSURE_PACKAGE_PHASE_ID,
        version: NAVIGATION_RHYTHM_DOMAIN_VERSION,
        domainId: 'navigation',
        interpretiveOnly: true,
        rebuildsTraversalGeneration: false,
        exactFieldSet: NAVIGATION_RHYTHM_DOMAIN_FIELD_IDS.slice(),
        requiredFields: NAVIGATION_RHYTHM_DOMAIN_FIELD_IDS.slice(),
        fields: cloneValue(NAVIGATION_RHYTHM_DOMAIN_FIELD_DESCRIPTORS)
    });
    const SCARCITY_CADENCE_RHYTHM_DOMAIN_CONTRACT_ID = 'Phase2ScarcityCadenceRhythmDomain';
    const SCARCITY_CADENCE_RHYTHM_DOMAIN_VERSION = 'phase2-rhythm-domain-scarcity-cadence-v1';
    const SCARCITY_CADENCE_RHYTHM_DOMAIN_FIELD_IDS = RHYTHM_DOMAIN_FIELDS.scarcity.slice();
    // Scarcity cadence rhythm remains a timing interpretation of completed Phase 1
    // support, food, and water pattern truth. It must not invent new scarcity-generation semantics.
    const SCARCITY_CADENCE_RHYTHM_DOMAIN_FIELD_DESCRIPTORS = deepFreeze({
        // Cadence strength with which scarcity pressure rises and returns across time.
        scarcityCadence: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            description: 'Timing intensity of recurring scarcity cadence across the environment.'
        },
        // Persistence of deficit periods once scarcity conditions begin to take hold.
        deficitPersistence: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            description: 'Timing persistence of scarcity-driven deficit intervals.'
        },
        // Recurrence strength of discrete shortage episodes over longer cycles.
        shortageRecurrence: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            description: 'Timing recurrence of shortage episodes across environmental cycles.'
        }
    });
    const SCARCITY_CADENCE_RHYTHM_DOMAIN_CONTRACT = deepFreeze({
        contractId: SCARCITY_CADENCE_RHYTHM_DOMAIN_CONTRACT_ID,
        packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
        phaseId: PRESSURE_PACKAGE_PHASE_ID,
        version: SCARCITY_CADENCE_RHYTHM_DOMAIN_VERSION,
        domainId: 'scarcity',
        interpretiveOnly: true,
        rebuildsScarcityGeneration: false,
        exactFieldSet: SCARCITY_CADENCE_RHYTHM_DOMAIN_FIELD_IDS.slice(),
        requiredFields: SCARCITY_CADENCE_RHYTHM_DOMAIN_FIELD_IDS.slice(),
        fields: cloneValue(SCARCITY_CADENCE_RHYTHM_DOMAIN_FIELD_DESCRIPTORS)
    });
    const PREDICTABILITY_RHYTHM_DOMAIN_CONTRACT_ID = 'Phase2PredictabilityRhythmDomain';
    const PREDICTABILITY_RHYTHM_DOMAIN_VERSION = 'phase2-rhythm-domain-predictability-v1';
    const PREDICTABILITY_RHYTHM_DOMAIN_FIELD_IDS = RHYTHM_DOMAIN_FIELDS.predictability.slice();
    // Predictability rhythm remains a timing interpretation of completed Phase 1
    // environmental regularity and rupture pattern truth. It must not invent new volatility-generation semantics.
    const PREDICTABILITY_RHYTHM_DOMAIN_FIELD_DESCRIPTORS = deepFreeze({
        // Overall trust that environmental timing can be read and anticipated consistently.
        predictability: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            description: 'Timing trust that environmental behavior can be anticipated consistently.'
        },
        // Frequency of timing ruptures that break expected cadence or environmental trust.
        ruptureFrequency: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            description: 'Timing frequency of ruptures that break expected environmental cadence.'
        },
        // Degree to which cadence departs from smooth or stable recurring intervals.
        cadenceIrregularity: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            description: 'Timing irregularity across environmental cadence patterns.'
        },
        // Trustworthiness of temporal signals used for planning around environmental timing.
        temporalTrustworthiness: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            description: 'Trustworthiness of temporal environmental signals for planning.'
        }
    });
    const PREDICTABILITY_RHYTHM_DOMAIN_CONTRACT = deepFreeze({
        contractId: PREDICTABILITY_RHYTHM_DOMAIN_CONTRACT_ID,
        packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
        phaseId: PRESSURE_PACKAGE_PHASE_ID,
        version: PREDICTABILITY_RHYTHM_DOMAIN_VERSION,
        domainId: 'predictability',
        interpretiveOnly: true,
        rebuildsVolatilityGeneration: false,
        exactFieldSet: PREDICTABILITY_RHYTHM_DOMAIN_FIELD_IDS.slice(),
        requiredFields: PREDICTABILITY_RHYTHM_DOMAIN_FIELD_IDS.slice(),
        fields: cloneValue(PREDICTABILITY_RHYTHM_DOMAIN_FIELD_DESCRIPTORS)
    });
    const RECOVERY_RHYTHM_DOMAIN_CONTRACT_ID = 'Phase2RecoveryRhythmDomain';
    const RECOVERY_RHYTHM_DOMAIN_VERSION = 'phase2-rhythm-domain-recovery-v1';
    const RECOVERY_RHYTHM_DOMAIN_FIELD_IDS = RHYTHM_DOMAIN_FIELDS.recovery.slice();
    // Recovery rhythm remains a timing interpretation of completed Phase 1
    // environmental relief and stabilization truth. It must not weaken or postpone recovery semantics.
    const RECOVERY_RHYTHM_DOMAIN_FIELD_DESCRIPTORS = deepFreeze({
        // Strength or speed with which environmental conditions recover into more workable states.
        recoveryTempo: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            description: 'Timing support for how quickly environmental recovery becomes available.'
        },
        // Length or pattern of intervals needed before stabilization meaningfully holds.
        stabilizationInterval: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            description: 'Timing structure of stabilization intervals before recovery meaningfully holds.'
        },
        // Persistence of relief once a recovery-supporting window has emerged.
        reliefPersistence: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            description: 'Persistence of relief timing once recovery-supporting conditions appear.'
        },
        // Degree to which the environment allows mistakes or renewed movement without immediate punishment.
        environmentalForgiveness: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            description: 'Timing support for environmental forgiveness during recovery windows.'
        }
    });
    const RECOVERY_RHYTHM_DOMAIN_CONTRACT = deepFreeze({
        contractId: RECOVERY_RHYTHM_DOMAIN_CONTRACT_ID,
        packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
        phaseId: PRESSURE_PACKAGE_PHASE_ID,
        version: RECOVERY_RHYTHM_DOMAIN_VERSION,
        domainId: 'recovery',
        interpretiveOnly: true,
        weakensRecovery: false,
        exactFieldSet: RECOVERY_RHYTHM_DOMAIN_FIELD_IDS.slice(),
        requiredFields: RECOVERY_RHYTHM_DOMAIN_FIELD_IDS.slice(),
        fields: cloneValue(RECOVERY_RHYTHM_DOMAIN_FIELD_DESCRIPTORS)
    });
    const PRESSURE_SYNTHESIZED_FIELD_IDS = Object.freeze([
        'survivabilityPressure',
        'mobilityPressure',
        'supplyPressure',
        'chokepointStress',
        'remotenessBurden',
        'ecologicalBurden',
        'catastropheSusceptibility'
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
    const PRESSURE_SYNTHESIZED_SCHEMA_CONTRACT_ID = 'Phase2PressureSynthesizedSchema';
    const PRESSURE_SYNTHESIZED_SCHEMA_VERSION = 'phase2-pressure-synthesized-v1';
    // Pressure synthesized axes compact burden-side meaning without replacing the underlying pressure domains.
    const PRESSURE_SYNTHESIZED_FIELD_DESCRIPTORS = deepFreeze({
        // Aggregated burden pressure on staying alive across the current environmental burden mix.
        survivabilityPressure: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            synthesized: true,
            description: 'Synthesized burden pressure on survivability across multiple pressure domains.'
        },
        // Aggregated burden pressure on movement, traversal, and route usability.
        mobilityPressure: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            synthesized: true,
            description: 'Synthesized burden pressure on mobility and movement viability.'
        },
        // Aggregated burden pressure on supply continuity, provisioning, and support availability.
        supplyPressure: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            synthesized: true,
            description: 'Synthesized burden pressure on supply continuity and provisioning support.'
        },
        // Aggregated stress centered on chokepoints and concentrated route dependency.
        chokepointStress: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            synthesized: true,
            description: 'Synthesized burden stress centered on chokepoints and route concentration.'
        },
        // Aggregated burden from remoteness, delay, and access fragility.
        remotenessBurden: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            synthesized: true,
            description: 'Synthesized burden from remoteness, delay, and access fragility.'
        },
        // Aggregated burden from ecological brittleness and reduced regenerative stability.
        ecologicalBurden: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            synthesized: true,
            description: 'Synthesized burden from ecological fragility and regeneration weakness.'
        },
        // Aggregated susceptibility to catastrophic disruption across hazard channels.
        catastropheSusceptibility: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'pressure',
            synthesized: true,
            description: 'Synthesized susceptibility to catastrophic environmental disruption.'
        }
    });
    const PRESSURE_SYNTHESIZED_SCHEMA_CONTRACT = deepFreeze({
        contractId: PRESSURE_SYNTHESIZED_SCHEMA_CONTRACT_ID,
        packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
        phaseId: PRESSURE_PACKAGE_PHASE_ID,
        version: PRESSURE_SYNTHESIZED_SCHEMA_VERSION,
        interpretiveOnly: true,
        replacesDomainFields: false,
        exactFieldSet: PRESSURE_SYNTHESIZED_FIELD_IDS.slice(),
        requiredFields: PRESSURE_SYNTHESIZED_FIELD_IDS.slice(),
        fields: cloneValue(PRESSURE_SYNTHESIZED_FIELD_DESCRIPTORS)
    });
    const RHYTHM_SYNTHESIZED_SCHEMA_CONTRACT_ID = 'Phase2RhythmSynthesizedSchema';
    const RHYTHM_SYNTHESIZED_SCHEMA_VERSION = 'phase2-rhythm-synthesized-v1';
    // Rhythm synthesized axes compact timing meaning without flattening temporal structure into a single scalar.
    const RHYTHM_SYNTHESIZED_FIELD_DESCRIPTORS = deepFreeze({
        // Synthesized profile of seasonal timing structure across the environment.
        seasonalityProfile: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            synthesized: true,
            description: 'Synthesized profile of seasonality timing structure.'
        },
        // Synthesized rhythm of storm recurrence, clustering, and transition behavior.
        stormRhythm: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            synthesized: true,
            description: 'Synthesized rhythm of storm cadence and transition behavior.'
        },
        // Synthesized rhythm of navigation windows, closures, and safer intervals.
        navigationRhythm: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            synthesized: true,
            description: 'Synthesized rhythm of navigation timing windows and closures.'
        },
        // Synthesized rhythm of scarcity return, persistence, and shortage recurrence.
        scarcityRhythm: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            synthesized: true,
            description: 'Synthesized rhythm of scarcity cadence and deficit persistence.'
        },
        // Synthesized profile of timing trust and expected environmental regularity.
        predictabilityProfile: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            synthesized: true,
            description: 'Synthesized profile of predictability and temporal trust.'
        },
        // Synthesized profile of rupture behavior across timing patterns.
        ruptureProfile: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            synthesized: true,
            description: 'Synthesized profile of rupture frequency and cadence breaks.'
        },
        // Synthesized profile of recovery timing, relief persistence, and stabilization support.
        recoveryProfile: {
            type: 'phase2ScalarField',
            nullableUntilGenerated: true,
            normalizedRange: [0, 1],
            ownership: 'rhythm',
            synthesized: true,
            description: 'Synthesized profile of recovery timing and relief support.'
        }
    });
    const RHYTHM_SYNTHESIZED_SCHEMA_CONTRACT = deepFreeze({
        contractId: RHYTHM_SYNTHESIZED_SCHEMA_CONTRACT_ID,
        packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
        phaseId: PRESSURE_PACKAGE_PHASE_ID,
        version: RHYTHM_SYNTHESIZED_SCHEMA_VERSION,
        interpretiveOnly: true,
        flattensTimingStructure: false,
        exactFieldSet: RHYTHM_SYNTHESIZED_FIELD_IDS.slice(),
        requiredFields: RHYTHM_SYNTHESIZED_FIELD_IDS.slice(),
        fields: cloneValue(RHYTHM_SYNTHESIZED_FIELD_DESCRIPTORS)
    });
    const PRESSURE_SUMMARY_KEYS = Object.freeze([
        'pressureSummary',
        'traversalSummary',
        'survivalSummary',
        'fragilitySummary'
    ]);
    const RHYTHM_SUMMARY_KEYS = Object.freeze([
        'rhythmSummary',
        'timingSummary',
        'recoverySummary',
        'windowSummary'
    ]);
    const PRESSURE_VALIDATION_META_KEYS = Object.freeze([
        'fieldRangeStatus',
        'determinismStatus',
        'distributionStatus',
        'correlationStatus',
        'recordBindingStatus',
        'summaryStatus'
    ]);
    const RHYTHM_VALIDATION_META_KEYS = Object.freeze([
        'fieldRangeStatus',
        'determinismStatus',
        'distributionStatus',
        'cadenceStatus',
        'reliefStatus',
        'recordBindingStatus',
        'summaryStatus'
    ]);
    const PRESSURE_REGIONAL_PROFILE_KEYS = Object.freeze([
        ...RECORD_BOUND_PROFILE_BASE_KEYS,
        'dominantBurdens',
        'synthesizedSnapshot'
    ]);
    const RHYTHM_REGIONAL_PROFILE_KEYS = Object.freeze([
        ...RECORD_BOUND_PROFILE_BASE_KEYS,
        'dominantRhythms',
        'recoverySnapshot'
    ]);
    const PRESSURE_REGIONAL_PROFILE_PACKAGE_KEYS = Object.freeze([
        'dominantBurdens',
        'synthesizedSnapshot'
    ]);
    const RHYTHM_REGIONAL_PROFILE_PACKAGE_KEYS = Object.freeze([
        'dominantRhythms',
        'recoverySnapshot'
    ]);
    const ROOT_REQUIRED_KEYS = Object.freeze([
        'packageId',
        'phaseId',
        'version',
        'sourceMacroGeographyPackageId',
        'sourceMacroGeographyVersion',
        'sourceHandoffPackageId',
        'sourceWorldSeedProfileId',
        'recordBindingContextId',
        'domains',
        'synthesized',
        'regionalProfiles',
        'summaries',
        'validationMeta'
    ]);
    const FORBIDDEN_RHYTHM_BURDEN_KEYS = Object.freeze([
        'coldPressure',
        'heatPressure',
        'humidityPressure',
        'climateExposurePressure',
        'terrainHarshness',
        'slopeBurden',
        'fragmentationBurden',
        'mobilityTerrainPenalty',
        'waterReliabilityInverse',
        'waterStress',
        'droughtPressure',
        'floodInstability',
        'foodStress',
        'foodReliabilityInverse',
        'fertilitySupportInverse',
        'scarcityBaseline',
        'travelExposure',
        'routeReliabilityInverse',
        'movementUncertaintyPressure',
        'detourBurden',
        'chokepointPressure',
        'failureImpactPressure',
        'dependencyConcentration',
        'isolationPressure',
        'supportDelayBurden',
        'peripheralExposure',
        'accessFragility',
        'ecologicalFragility',
        'ecologicalStabilityInverse',
        'regenerationWeakness',
        'carryingCapacityBrittleness',
        'catastrophePressure',
        'stormBreakRisk',
        'volcanicInstability',
        'floodBreakRisk',
        'droughtBreakRisk',
        'survivabilityPressure',
        'mobilityPressure',
        'supplyPressure',
        'chokepointStress',
        'remotenessBurden',
        'ecologicalBurden',
        'catastropheSusceptibility',
        'pressureFieldPackage',
        'pressure',
        'dominantBurdens',
        'pressureSummary',
        'traversalSummary',
        'survivalSummary',
        'fragilitySummary'
    ]);
    const FORBIDDEN_PRESSURE_TIMING_KEYS = Object.freeze([
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
        'shortageRecurrence',
        'predictability',
        'ruptureFrequency',
        'cadenceIrregularity',
        'temporalTrustworthiness',
        'recoveryTempo',
        'stabilizationInterval',
        'reliefPersistence',
        'environmentalForgiveness',
        'seasonalityProfile',
        'stormRhythm',
        'navigationRhythm',
        'scarcityRhythm',
        'predictabilityProfile',
        'ruptureProfile',
        'recoveryProfile',
        'environmentalRhythmPackage',
        'rhythm',
        'recovery'
    ]);
    const STUB = Object.freeze({
        groupId: GROUP_ID,
        status: 'contract_first_stub',
        canonicalPath: 'js/worldgen/phase2/contracts/',
        uiCoupling: false,
        implementsFieldLogic: false,
        purpose: 'Phase 2 package, domain, profile, and validation contract entry point.'
    });

    function getPhase2ContractsModuleStub() {
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

    function normalizeString(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function normalizeStringArray(values = []) {
        return Array.isArray(values)
            ? values
                .map((value) => normalizeString(value))
                .filter(Boolean)
            : [];
    }

    function uniqueStrings(values = []) {
        const seen = new Set();
        return normalizeStringArray(values).filter((value) => {
            if (seen.has(value)) {
                return false;
            }

            seen.add(value);
            return true;
        });
    }

    function isEmptyObject(value) {
        return isPlainObject(value) && Object.keys(value).length === 0;
    }

    function createKeyedObject(keys, fallbackValue = null) {
        return keys.reduce((result, key) => {
            result[key] = fallbackValue;
            return result;
        }, {});
    }

    function normalizePhase2ValidationFamilyId(value) {
        const normalizedValue = normalizeString(value);
        return VALIDATION_FAMILY_IDS.includes(normalizedValue) ? normalizedValue : '';
    }

    function normalizePhase2ValidationStatus(value, fallbackValue = 'not_run') {
        const normalizedValue = normalizeString(value);
        return VALIDATION_STATUS_IDS.includes(normalizedValue) ? normalizedValue : fallbackValue;
    }

    function normalizePhase2ValidationFinalStatus(value, fallbackValue = 'pass') {
        const normalizedValue = normalizeString(value);
        return VALIDATION_FINAL_STATUS_IDS.includes(normalizedValue) ? normalizedValue : fallbackValue;
    }

    function normalizePhase2ValidationRecommendationPriority(value, fallbackValue = 'medium') {
        const normalizedValue = normalizeString(value);
        return VALIDATION_RECOMMENDATION_PRIORITY_IDS.includes(normalizedValue)
            ? normalizedValue
            : fallbackValue;
    }

    function createPhase2ValidationCheck(check = {}) {
        const normalizedCheck = isPlainObject(check) ? check : {};

        return deepFreeze({
            checkId: normalizeString(normalizedCheck.checkId),
            status: normalizePhase2ValidationStatus(normalizedCheck.status),
            message: normalizeString(normalizedCheck.message),
            details: normalizeStringArray(normalizedCheck.details),
            affectedPaths: uniqueStrings(normalizedCheck.affectedPaths),
            meta: isPlainObject(normalizedCheck.meta)
                ? cloneValue(normalizedCheck.meta)
                : {}
        });
    }

    function createPhase2ValidationRecommendation(recommendation = {}) {
        const normalizedRecommendation = isPlainObject(recommendation) ? recommendation : {};

        return deepFreeze({
            recommendationId: normalizeString(normalizedRecommendation.recommendationId),
            familyId: normalizePhase2ValidationFamilyId(normalizedRecommendation.familyId),
            recommendationType: normalizeString(normalizedRecommendation.recommendationType),
            priority: normalizePhase2ValidationRecommendationPriority(normalizedRecommendation.priority),
            message: normalizeString(normalizedRecommendation.message),
            targetIds: uniqueStrings(normalizedRecommendation.targetIds),
            meta: isPlainObject(normalizedRecommendation.meta)
                ? cloneValue(normalizedRecommendation.meta)
                : {}
        });
    }

    function createPhase2ValidationBlockingReason(blockingReason = {}) {
        const normalizedBlockingReason = isPlainObject(blockingReason) ? blockingReason : {};

        return deepFreeze({
            blockingReasonId: normalizeString(normalizedBlockingReason.blockingReasonId),
            familyId: normalizePhase2ValidationFamilyId(normalizedBlockingReason.familyId),
            reasonCode: normalizeString(normalizedBlockingReason.reasonCode),
            message: normalizeString(normalizedBlockingReason.message),
            affectedPaths: uniqueStrings(normalizedBlockingReason.affectedPaths),
            meta: isPlainObject(normalizedBlockingReason.meta)
                ? cloneValue(normalizedBlockingReason.meta)
                : {}
        });
    }

    function createPhase2ValidationFamilySection(familyId, section = {}) {
        const normalizedSection = isPlainObject(section) ? section : {};
        const normalizedFamilyId = normalizePhase2ValidationFamilyId(familyId)
            || normalizePhase2ValidationFamilyId(normalizedSection.familyId);

        return deepFreeze({
            familyId: normalizedFamilyId,
            status: normalizePhase2ValidationStatus(normalizedSection.status),
            checks: Array.isArray(normalizedSection.checks)
                ? normalizedSection.checks.map((check) => createPhase2ValidationCheck(check))
                : [],
            notes: normalizeStringArray(normalizedSection.notes),
            recommendationIds: uniqueStrings(normalizedSection.recommendationIds),
            blockingReasonIds: uniqueStrings(normalizedSection.blockingReasonIds),
            meta: isPlainObject(normalizedSection.meta)
                ? cloneValue(normalizedSection.meta)
                : {}
        });
    }

    function createPhase2ValidationReportSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};

        return deepFreeze({
            validationId: normalizeString(normalizedInput.validationId),
            contractId: VALIDATION_REPORT_CONTRACT_ID,
            phaseId: PRESSURE_PACKAGE_PHASE_ID,
            version: VALIDATION_REPORT_VERSION,
            sourcePressureFieldPackageId: normalizeString(normalizedInput.sourcePressureFieldPackageId),
            sourceEnvironmentalRhythmPackageId: normalizeString(normalizedInput.sourceEnvironmentalRhythmPackageId),
            sourceMacroGeographyPackageId: normalizeString(normalizedInput.sourceMacroGeographyPackageId),
            sourceMacroGeographyHandoffPackageId: hasOwn(normalizedInput, 'sourceMacroGeographyHandoffPackageId')
                ? (normalizeString(normalizedInput.sourceMacroGeographyHandoffPackageId) || null)
                : null,
            structuralChecks: createPhase2ValidationFamilySection(
                'structural',
                normalizedInput.structuralChecks
            ),
            causalChecks: createPhase2ValidationFamilySection(
                'causal',
                normalizedInput.causalChecks
            ),
            boundaryChecks: createPhase2ValidationFamilySection(
                'boundary',
                normalizedInput.boundaryChecks
            ),
            distributionChecks: createPhase2ValidationFamilySection(
                'distribution',
                normalizedInput.distributionChecks
            ),
            designChecks: createPhase2ValidationFamilySection(
                'design',
                normalizedInput.designChecks
            ),
            gameplayChecks: createPhase2ValidationFamilySection(
                'gameplay',
                normalizedInput.gameplayChecks
            ),
            summaryChecks: createPhase2ValidationFamilySection(
                'summary',
                normalizedInput.summaryChecks
            ),
            rebalanceRecommendations: Array.isArray(normalizedInput.rebalanceRecommendations)
                ? normalizedInput.rebalanceRecommendations.map((recommendation) => {
                    return createPhase2ValidationRecommendation(recommendation);
                })
                : [],
            blockingReasons: Array.isArray(normalizedInput.blockingReasons)
                ? normalizedInput.blockingReasons.map((blockingReason) => {
                    return createPhase2ValidationBlockingReason(blockingReason);
                })
                : [],
            finalStatus: normalizePhase2ValidationFinalStatus(normalizedInput.finalStatus)
        });
    }

    function createRecordBoundProfileExtras(overrides = {}) {
        const sharedKeys = new Set(RECORD_BOUND_PROFILE_BASE_KEYS);
        return Object.fromEntries(
            Object.entries(overrides)
                .filter(([key]) => !sharedKeys.has(key))
                .map(([key, value]) => [key, cloneValue(value)])
        );
    }

    function createRecordBoundProfileSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            profileId: normalizedOverrides.profileId || '',
            recordType: normalizedOverrides.recordType || '',
            recordId: normalizedOverrides.recordId || '',
            sourcePackageId: normalizedOverrides.sourcePackageId || '',
            pressureSignals: isPlainObject(normalizedOverrides.pressureSignals)
                ? cloneValue(normalizedOverrides.pressureSignals)
                : {},
            rhythmSignals: isPlainObject(normalizedOverrides.rhythmSignals)
                ? cloneValue(normalizedOverrides.rhythmSignals)
                : {},
            dominantEnvironmentalTraits: Array.isArray(normalizedOverrides.dominantEnvironmentalTraits)
                ? cloneValue(normalizedOverrides.dominantEnvironmentalTraits)
                : [],
            summary: normalizedOverrides.summary || '',
            ...createRecordBoundProfileExtras(normalizedOverrides)
        });
    }

    function createClimatePressureDomainSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            ...createKeyedObject(CLIMATE_PRESSURE_DOMAIN_FIELD_IDS, null),
            ...cloneValue(normalizedOverrides)
        });
    }

    function createTerrainPressureDomainSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            ...createKeyedObject(TERRAIN_PRESSURE_DOMAIN_FIELD_IDS, null),
            ...cloneValue(normalizedOverrides)
        });
    }

    function createHydrologyPressureDomainSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            ...createKeyedObject(HYDROLOGY_PRESSURE_DOMAIN_FIELD_IDS, null),
            ...cloneValue(normalizedOverrides)
        });
    }

    function createFoodPressureDomainSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            ...createKeyedObject(FOOD_PRESSURE_DOMAIN_FIELD_IDS, null),
            ...cloneValue(normalizedOverrides)
        });
    }

    function createTravelPressureDomainSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            ...createKeyedObject(TRAVEL_PRESSURE_DOMAIN_FIELD_IDS, null),
            ...cloneValue(normalizedOverrides)
        });
    }

    function createChokepointPressureDomainSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            ...createKeyedObject(CHOKEPOINT_PRESSURE_DOMAIN_FIELD_IDS, null),
            ...cloneValue(normalizedOverrides)
        });
    }

    function createIsolationPressureDomainSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            ...createKeyedObject(ISOLATION_PRESSURE_DOMAIN_FIELD_IDS, null),
            ...cloneValue(normalizedOverrides)
        });
    }

    function createEcologyPressureDomainSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            ...createKeyedObject(ECOLOGY_PRESSURE_DOMAIN_FIELD_IDS, null),
            ...cloneValue(normalizedOverrides)
        });
    }

    function createCatastrophePressureDomainSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            ...createKeyedObject(CATASTROPHE_PRESSURE_DOMAIN_FIELD_IDS, null),
            ...cloneValue(normalizedOverrides)
        });
    }

    function createSeasonalityRhythmDomainSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            ...createKeyedObject(SEASONALITY_RHYTHM_DOMAIN_FIELD_IDS, null),
            ...cloneValue(normalizedOverrides)
        });
    }

    function createStormCadenceRhythmDomainSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            ...createKeyedObject(STORM_CADENCE_RHYTHM_DOMAIN_FIELD_IDS, null),
            ...cloneValue(normalizedOverrides)
        });
    }

    function createNavigationRhythmDomainSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            ...createKeyedObject(NAVIGATION_RHYTHM_DOMAIN_FIELD_IDS, null),
            ...cloneValue(normalizedOverrides)
        });
    }

    function createScarcityCadenceRhythmDomainSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            ...createKeyedObject(SCARCITY_CADENCE_RHYTHM_DOMAIN_FIELD_IDS, null),
            ...cloneValue(normalizedOverrides)
        });
    }

    function createPredictabilityRhythmDomainSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            ...createKeyedObject(PREDICTABILITY_RHYTHM_DOMAIN_FIELD_IDS, null),
            ...cloneValue(normalizedOverrides)
        });
    }

    function createRecoveryRhythmDomainSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            ...createKeyedObject(RECOVERY_RHYTHM_DOMAIN_FIELD_IDS, null),
            ...cloneValue(normalizedOverrides)
        });
    }

    function createPressureDomainSkeletons(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return PRESSURE_DOMAIN_IDS.reduce((domains, domainId) => {
            const domainOverrides = isPlainObject(normalizedOverrides[domainId])
                ? normalizedOverrides[domainId]
                : {};
            if (domainId === 'climate') {
                domains[domainId] = createClimatePressureDomainSkeleton(domainOverrides);
                return domains;
            }

            if (domainId === 'terrain') {
                domains[domainId] = createTerrainPressureDomainSkeleton(domainOverrides);
                return domains;
            }

            if (domainId === 'hydrology') {
                domains[domainId] = createHydrologyPressureDomainSkeleton(domainOverrides);
                return domains;
            }

            if (domainId === 'food') {
                domains[domainId] = createFoodPressureDomainSkeleton(domainOverrides);
                return domains;
            }

            if (domainId === 'travel') {
                domains[domainId] = createTravelPressureDomainSkeleton(domainOverrides);
                return domains;
            }

            if (domainId === 'chokepoints') {
                domains[domainId] = createChokepointPressureDomainSkeleton(domainOverrides);
                return domains;
            }

            if (domainId === 'isolation') {
                domains[domainId] = createIsolationPressureDomainSkeleton(domainOverrides);
                return domains;
            }

            if (domainId === 'ecology') {
                domains[domainId] = createEcologyPressureDomainSkeleton(domainOverrides);
                return domains;
            }

            if (domainId === 'catastrophe') {
                domains[domainId] = createCatastrophePressureDomainSkeleton(domainOverrides);
                return domains;
            }

            domains[domainId] = {
                ...createKeyedObject(PRESSURE_DOMAIN_FIELDS[domainId], null),
                ...cloneValue(domainOverrides)
            };
            return domains;
        }, {});
    }

    function createPressureSynthesizedSchemaSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            ...createKeyedObject(PRESSURE_SYNTHESIZED_FIELD_IDS, null),
            ...cloneValue(normalizedOverrides)
        });
    }

    function createPressureFieldPackageSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            packageId: normalizedOverrides.packageId || '',
            phaseId: PRESSURE_PACKAGE_PHASE_ID,
            version: PRESSURE_PACKAGE_VERSION,
            sourceMacroGeographyPackageId: normalizedOverrides.sourceMacroGeographyPackageId || '',
            sourceMacroGeographyVersion: normalizedOverrides.sourceMacroGeographyVersion || '',
            sourceHandoffPackageId: hasOwn(normalizedOverrides, 'sourceHandoffPackageId')
                ? normalizedOverrides.sourceHandoffPackageId
                : null,
            sourceWorldSeedProfileId: hasOwn(normalizedOverrides, 'sourceWorldSeedProfileId')
                ? normalizedOverrides.sourceWorldSeedProfileId
                : null,
            recordBindingContextId: normalizedOverrides.recordBindingContextId || '',
            domains: createPressureDomainSkeletons(normalizedOverrides.domains),
            synthesized: createPressureSynthesizedSchemaSkeleton(normalizedOverrides.synthesized),
            regionalProfiles: Array.isArray(normalizedOverrides.regionalProfiles)
                ? cloneValue(normalizedOverrides.regionalProfiles)
                : [],
            summaries: {
                ...createKeyedObject(PRESSURE_SUMMARY_KEYS, ''),
                ...(isPlainObject(normalizedOverrides.summaries)
                    ? cloneValue(normalizedOverrides.summaries)
                    : {})
            },
            validationMeta: {
                ...createKeyedObject(PRESSURE_VALIDATION_META_KEYS, ''),
                ...(isPlainObject(normalizedOverrides.validationMeta)
                    ? cloneValue(normalizedOverrides.validationMeta)
                    : {})
            }
        });
    }

    function createRhythmDomainSkeletons(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return RHYTHM_DOMAIN_IDS.reduce((domains, domainId) => {
            const domainOverrides = isPlainObject(normalizedOverrides[domainId])
                ? normalizedOverrides[domainId]
                : {};
            if (domainId === 'seasonality') {
                domains[domainId] = createSeasonalityRhythmDomainSkeleton(domainOverrides);
                return domains;
            }
            if (domainId === 'storms') {
                domains[domainId] = createStormCadenceRhythmDomainSkeleton(domainOverrides);
                return domains;
            }
            if (domainId === 'navigation') {
                domains[domainId] = createNavigationRhythmDomainSkeleton(domainOverrides);
                return domains;
            }
            if (domainId === 'scarcity') {
                domains[domainId] = createScarcityCadenceRhythmDomainSkeleton(domainOverrides);
                return domains;
            }
            if (domainId === 'predictability') {
                domains[domainId] = createPredictabilityRhythmDomainSkeleton(domainOverrides);
                return domains;
            }
            if (domainId === 'recovery') {
                domains[domainId] = createRecoveryRhythmDomainSkeleton(domainOverrides);
                return domains;
            }

            domains[domainId] = {
                ...createKeyedObject(RHYTHM_DOMAIN_FIELDS[domainId], null),
                ...cloneValue(domainOverrides)
            };
            return domains;
        }, {});
    }

    function createRhythmSynthesizedSchemaSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            ...createKeyedObject(RHYTHM_SYNTHESIZED_FIELD_IDS, null),
            ...cloneValue(normalizedOverrides)
        });
    }

    function createEnvironmentalRhythmPackageSkeleton(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};
        return deepFreeze({
            packageId: normalizedOverrides.packageId || '',
            phaseId: PRESSURE_PACKAGE_PHASE_ID,
            version: RHYTHM_PACKAGE_VERSION,
            sourceMacroGeographyPackageId: normalizedOverrides.sourceMacroGeographyPackageId || '',
            sourceMacroGeographyVersion: normalizedOverrides.sourceMacroGeographyVersion || '',
            sourceHandoffPackageId: hasOwn(normalizedOverrides, 'sourceHandoffPackageId')
                ? normalizedOverrides.sourceHandoffPackageId
                : null,
            sourceWorldSeedProfileId: hasOwn(normalizedOverrides, 'sourceWorldSeedProfileId')
                ? normalizedOverrides.sourceWorldSeedProfileId
                : null,
            recordBindingContextId: normalizedOverrides.recordBindingContextId || '',
            domains: createRhythmDomainSkeletons(normalizedOverrides.domains),
            synthesized: createRhythmSynthesizedSchemaSkeleton(normalizedOverrides.synthesized),
            regionalProfiles: Array.isArray(normalizedOverrides.regionalProfiles)
                ? cloneValue(normalizedOverrides.regionalProfiles)
                : [],
            summaries: {
                ...createKeyedObject(RHYTHM_SUMMARY_KEYS, ''),
                ...(isPlainObject(normalizedOverrides.summaries)
                    ? cloneValue(normalizedOverrides.summaries)
                    : {})
            },
            validationMeta: {
                ...createKeyedObject(RHYTHM_VALIDATION_META_KEYS, ''),
                ...(isPlainObject(normalizedOverrides.validationMeta)
                    ? cloneValue(normalizedOverrides.validationMeta)
                    : {})
            }
        });
    }

    function addIssue(issues, severity, code, path, message) {
        issues.push({
            severity,
            code,
            path,
            message
        });
    }

    function validateExactFieldSetInto(candidate, requiredFieldIds, issues, path, codePrefix) {
        const requiredFieldSet = new Set(requiredFieldIds);

        requiredFieldIds.forEach((fieldId) => {
            if (!hasOwn(candidate, fieldId)) {
                addIssue(
                    issues,
                    'error',
                    `missing_required_${codePrefix}_field`,
                    `${path}.${fieldId}`,
                    `${path} is missing required ${codePrefix} field: ${fieldId}.`
                );
            }
        });

        Object.keys(candidate).forEach((fieldId) => {
            if (!requiredFieldSet.has(fieldId)) {
                addIssue(
                    issues,
                    'error',
                    `unexpected_${codePrefix}_field`,
                    `${path}.${fieldId}`,
                    `${path} contains uncontracted ${codePrefix} field: ${fieldId}.`
                );
            }
        });
    }

    function validateClimatePressureFieldValueInto(fieldValue, fieldId, issues, path) {
        if (fieldValue !== null && (!isPlainObject(fieldValue) || Array.isArray(fieldValue))) {
            addIssue(
                issues,
                'error',
                'invalid_climate_pressure_field_slot',
                `${path}.${fieldId}`,
                'Climate pressure field slots must be null placeholders or field descriptor objects.'
            );
        }
    }

    function validateTerrainPressureFieldValueInto(fieldValue, fieldId, issues, path) {
        if (fieldValue !== null && (!isPlainObject(fieldValue) || Array.isArray(fieldValue))) {
            addIssue(
                issues,
                'error',
                'invalid_terrain_pressure_field_slot',
                `${path}.${fieldId}`,
                'Terrain pressure field slots must be null placeholders or field descriptor objects.'
            );
        }
    }

    function validateHydrologyPressureFieldValueInto(fieldValue, fieldId, issues, path) {
        if (fieldValue !== null && (!isPlainObject(fieldValue) || Array.isArray(fieldValue))) {
            addIssue(
                issues,
                'error',
                'invalid_hydrology_pressure_field_slot',
                `${path}.${fieldId}`,
                'Hydrology pressure field slots must be null placeholders or field descriptor objects.'
            );
        }
    }

    function validateFoodPressureFieldValueInto(fieldValue, fieldId, issues, path) {
        if (fieldValue !== null && (!isPlainObject(fieldValue) || Array.isArray(fieldValue))) {
            addIssue(
                issues,
                'error',
                'invalid_food_pressure_field_slot',
                `${path}.${fieldId}`,
                'Food pressure field slots must be null placeholders or field descriptor objects.'
            );
        }
    }

    function validateTravelPressureFieldValueInto(fieldValue, fieldId, issues, path) {
        if (fieldValue !== null && (!isPlainObject(fieldValue) || Array.isArray(fieldValue))) {
            addIssue(
                issues,
                'error',
                'invalid_travel_pressure_field_slot',
                `${path}.${fieldId}`,
                'Travel pressure field slots must be null placeholders or field descriptor objects.'
            );
        }
    }

    function validateChokepointPressureFieldValueInto(fieldValue, fieldId, issues, path) {
        if (fieldValue !== null && (!isPlainObject(fieldValue) || Array.isArray(fieldValue))) {
            addIssue(
                issues,
                'error',
                'invalid_chokepoint_pressure_field_slot',
                `${path}.${fieldId}`,
                'Chokepoint pressure field slots must be null placeholders or field descriptor objects.'
            );
        }
    }

    function validateIsolationPressureFieldValueInto(fieldValue, fieldId, issues, path) {
        if (fieldValue !== null && (!isPlainObject(fieldValue) || Array.isArray(fieldValue))) {
            addIssue(
                issues,
                'error',
                'invalid_isolation_pressure_field_slot',
                `${path}.${fieldId}`,
                'Isolation pressure field slots must be null placeholders or field descriptor objects.'
            );
        }
    }

    function validateEcologyPressureFieldValueInto(fieldValue, fieldId, issues, path) {
        if (fieldValue !== null && (!isPlainObject(fieldValue) || Array.isArray(fieldValue))) {
            addIssue(
                issues,
                'error',
                'invalid_ecology_pressure_field_slot',
                `${path}.${fieldId}`,
                'Ecology pressure field slots must be null placeholders or field descriptor objects.'
            );
        }
    }

    function validateCatastrophePressureFieldValueInto(fieldValue, fieldId, issues, path) {
        if (fieldValue !== null && (!isPlainObject(fieldValue) || Array.isArray(fieldValue))) {
            addIssue(
                issues,
                'error',
                'invalid_catastrophe_pressure_field_slot',
                `${path}.${fieldId}`,
                'Catastrophe pressure field slots must be null placeholders or field descriptor objects.'
            );
        }
    }

    function validateSeasonalityRhythmFieldValueInto(fieldValue, fieldId, issues, path) {
        if (fieldValue !== null && (!isPlainObject(fieldValue) || Array.isArray(fieldValue))) {
            addIssue(
                issues,
                'error',
                'invalid_seasonality_rhythm_field_slot',
                `${path}.${fieldId}`,
                'Seasonality rhythm field slots must be null placeholders or field descriptor objects.'
            );
        }
    }

    function validateStormCadenceRhythmFieldValueInto(fieldValue, fieldId, issues, path) {
        if (fieldValue !== null && (!isPlainObject(fieldValue) || Array.isArray(fieldValue))) {
            addIssue(
                issues,
                'error',
                'invalid_storm_cadence_rhythm_field_slot',
                `${path}.${fieldId}`,
                'Storm cadence rhythm field slots must be null placeholders or field descriptor objects.'
            );
        }
    }

    function validateNavigationRhythmFieldValueInto(fieldValue, fieldId, issues, path) {
        if (fieldValue !== null && (!isPlainObject(fieldValue) || Array.isArray(fieldValue))) {
            addIssue(
                issues,
                'error',
                'invalid_navigation_rhythm_field_slot',
                `${path}.${fieldId}`,
                'Navigation rhythm field slots must be null placeholders or field descriptor objects.'
            );
        }
    }

    function validateScarcityCadenceRhythmFieldValueInto(fieldValue, fieldId, issues, path) {
        if (fieldValue !== null && (!isPlainObject(fieldValue) || Array.isArray(fieldValue))) {
            addIssue(
                issues,
                'error',
                'invalid_scarcity_cadence_rhythm_field_slot',
                `${path}.${fieldId}`,
                'Scarcity cadence rhythm field slots must be null placeholders or field descriptor objects.'
            );
        }
    }

    function validatePredictabilityRhythmFieldValueInto(fieldValue, fieldId, issues, path) {
        if (fieldValue !== null && (!isPlainObject(fieldValue) || Array.isArray(fieldValue))) {
            addIssue(
                issues,
                'error',
                'invalid_predictability_rhythm_field_slot',
                `${path}.${fieldId}`,
                'Predictability rhythm field slots must be null placeholders or field descriptor objects.'
            );
        }
    }

    function validateRecoveryRhythmFieldValueInto(fieldValue, fieldId, issues, path) {
        if (fieldValue !== null && (!isPlainObject(fieldValue) || Array.isArray(fieldValue))) {
            addIssue(
                issues,
                'error',
                'invalid_recovery_rhythm_field_slot',
                `${path}.${fieldId}`,
                'Recovery rhythm field slots must be null placeholders or field descriptor objects.'
            );
        }
    }

    function validatePressureSynthesizedFieldValueInto(fieldValue, fieldId, issues, path) {
        if (fieldValue !== null && (!isPlainObject(fieldValue) || Array.isArray(fieldValue))) {
            addIssue(
                issues,
                'error',
                'invalid_synthesized_pressure_field_slot',
                `${path}.${fieldId}`,
                'Synthesized pressure field slots must be null placeholders or field descriptor objects.'
            );
        }
    }

    function validateRhythmSynthesizedFieldValueInto(fieldValue, fieldId, issues, path) {
        if (fieldValue !== null && (!isPlainObject(fieldValue) || Array.isArray(fieldValue))) {
            addIssue(
                issues,
                'error',
                'invalid_synthesized_rhythm_field_slot',
                `${path}.${fieldId}`,
                'Synthesized rhythm field slots must be null placeholders or field descriptor objects.'
            );
        }
    }

    function validateClimatePressureDomainInto(domainCandidate, issues, path = 'climatePressureDomain') {
        if (!isPlainObject(domainCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_climate_pressure_domain',
                path,
                'Climate pressure domain must be an object.'
            );
            return;
        }

        validateExactFieldSetInto(
            domainCandidate,
            CLIMATE_PRESSURE_DOMAIN_FIELD_IDS,
            issues,
            path,
            'climate_pressure_domain'
        );

        CLIMATE_PRESSURE_DOMAIN_FIELD_IDS.forEach((fieldId) => {
            if (hasOwn(domainCandidate, fieldId)) {
                validateClimatePressureFieldValueInto(
                    domainCandidate[fieldId],
                    fieldId,
                    issues,
                    path
                );
            }
        });
    }

    function validateTerrainPressureDomainInto(domainCandidate, issues, path = 'terrainPressureDomain') {
        if (!isPlainObject(domainCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_terrain_pressure_domain',
                path,
                'Terrain pressure domain must be an object.'
            );
            return;
        }

        validateExactFieldSetInto(
            domainCandidate,
            TERRAIN_PRESSURE_DOMAIN_FIELD_IDS,
            issues,
            path,
            'terrain_pressure_domain'
        );

        TERRAIN_PRESSURE_DOMAIN_FIELD_IDS.forEach((fieldId) => {
            if (hasOwn(domainCandidate, fieldId)) {
                validateTerrainPressureFieldValueInto(
                    domainCandidate[fieldId],
                    fieldId,
                    issues,
                    path
                );
            }
        });
    }

    function validateHydrologyPressureDomainInto(domainCandidate, issues, path = 'hydrologyPressureDomain') {
        if (!isPlainObject(domainCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_hydrology_pressure_domain',
                path,
                'Hydrology pressure domain must be an object.'
            );
            return;
        }

        validateExactFieldSetInto(
            domainCandidate,
            HYDROLOGY_PRESSURE_DOMAIN_FIELD_IDS,
            issues,
            path,
            'hydrology_pressure_domain'
        );

        HYDROLOGY_PRESSURE_DOMAIN_FIELD_IDS.forEach((fieldId) => {
            if (hasOwn(domainCandidate, fieldId)) {
                validateHydrologyPressureFieldValueInto(
                    domainCandidate[fieldId],
                    fieldId,
                    issues,
                    path
                );
            }
        });
    }

    function validateFoodPressureDomainInto(domainCandidate, issues, path = 'foodPressureDomain') {
        if (!isPlainObject(domainCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_food_pressure_domain',
                path,
                'Food pressure domain must be an object.'
            );
            return;
        }

        validateExactFieldSetInto(
            domainCandidate,
            FOOD_PRESSURE_DOMAIN_FIELD_IDS,
            issues,
            path,
            'food_pressure_domain'
        );

        FOOD_PRESSURE_DOMAIN_FIELD_IDS.forEach((fieldId) => {
            if (hasOwn(domainCandidate, fieldId)) {
                validateFoodPressureFieldValueInto(
                    domainCandidate[fieldId],
                    fieldId,
                    issues,
                    path
                );
            }
        });
    }

    function validateTravelPressureDomainInto(domainCandidate, issues, path = 'travelPressureDomain') {
        if (!isPlainObject(domainCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_travel_pressure_domain',
                path,
                'Travel pressure domain must be an object.'
            );
            return;
        }

        validateExactFieldSetInto(
            domainCandidate,
            TRAVEL_PRESSURE_DOMAIN_FIELD_IDS,
            issues,
            path,
            'travel_pressure_domain'
        );

        TRAVEL_PRESSURE_DOMAIN_FIELD_IDS.forEach((fieldId) => {
            if (hasOwn(domainCandidate, fieldId)) {
                validateTravelPressureFieldValueInto(
                    domainCandidate[fieldId],
                    fieldId,
                    issues,
                    path
                );
            }
        });
    }

    function validateChokepointPressureDomainInto(domainCandidate, issues, path = 'chokepointPressureDomain') {
        if (!isPlainObject(domainCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_chokepoint_pressure_domain',
                path,
                'Chokepoint pressure domain must be an object.'
            );
            return;
        }

        validateExactFieldSetInto(
            domainCandidate,
            CHOKEPOINT_PRESSURE_DOMAIN_FIELD_IDS,
            issues,
            path,
            'chokepoint_pressure_domain'
        );

        CHOKEPOINT_PRESSURE_DOMAIN_FIELD_IDS.forEach((fieldId) => {
            if (hasOwn(domainCandidate, fieldId)) {
                validateChokepointPressureFieldValueInto(
                    domainCandidate[fieldId],
                    fieldId,
                    issues,
                    path
                );
            }
        });
    }

    function validateIsolationPressureDomainInto(domainCandidate, issues, path = 'isolationPressureDomain') {
        if (!isPlainObject(domainCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_isolation_pressure_domain',
                path,
                'Isolation pressure domain must be an object.'
            );
            return;
        }

        validateExactFieldSetInto(
            domainCandidate,
            ISOLATION_PRESSURE_DOMAIN_FIELD_IDS,
            issues,
            path,
            'isolation_pressure_domain'
        );

        ISOLATION_PRESSURE_DOMAIN_FIELD_IDS.forEach((fieldId) => {
            if (hasOwn(domainCandidate, fieldId)) {
                validateIsolationPressureFieldValueInto(
                    domainCandidate[fieldId],
                    fieldId,
                    issues,
                    path
                );
            }
        });
    }

    function validateEcologyPressureDomainInto(domainCandidate, issues, path = 'ecologyPressureDomain') {
        if (!isPlainObject(domainCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_ecology_pressure_domain',
                path,
                'Ecology pressure domain must be an object.'
            );
            return;
        }

        validateExactFieldSetInto(
            domainCandidate,
            ECOLOGY_PRESSURE_DOMAIN_FIELD_IDS,
            issues,
            path,
            'ecology_pressure_domain'
        );

        ECOLOGY_PRESSURE_DOMAIN_FIELD_IDS.forEach((fieldId) => {
            if (hasOwn(domainCandidate, fieldId)) {
                validateEcologyPressureFieldValueInto(
                    domainCandidate[fieldId],
                    fieldId,
                    issues,
                    path
                );
            }
        });
    }

    function validateCatastrophePressureDomainInto(domainCandidate, issues, path = 'catastrophePressureDomain') {
        if (!isPlainObject(domainCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_catastrophe_pressure_domain',
                path,
                'Catastrophe pressure domain must be an object.'
            );
            return;
        }

        validateExactFieldSetInto(
            domainCandidate,
            CATASTROPHE_PRESSURE_DOMAIN_FIELD_IDS,
            issues,
            path,
            'catastrophe_pressure_domain'
        );

        CATASTROPHE_PRESSURE_DOMAIN_FIELD_IDS.forEach((fieldId) => {
            if (hasOwn(domainCandidate, fieldId)) {
                validateCatastrophePressureFieldValueInto(
                    domainCandidate[fieldId],
                    fieldId,
                    issues,
                    path
                );
            }
        });
    }

    function validateSeasonalityRhythmDomainInto(domainCandidate, issues, path = 'seasonalityRhythmDomain') {
        if (!isPlainObject(domainCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_seasonality_rhythm_domain',
                path,
                'Seasonality rhythm domain must be an object.'
            );
            return;
        }

        validateExactFieldSetInto(
            domainCandidate,
            SEASONALITY_RHYTHM_DOMAIN_FIELD_IDS,
            issues,
            path,
            'seasonality_rhythm_domain'
        );

        SEASONALITY_RHYTHM_DOMAIN_FIELD_IDS.forEach((fieldId) => {
            if (hasOwn(domainCandidate, fieldId)) {
                validateSeasonalityRhythmFieldValueInto(
                    domainCandidate[fieldId],
                    fieldId,
                    issues,
                    path
                );
            }
        });
    }

    function validateStormCadenceRhythmDomainInto(domainCandidate, issues, path = 'stormCadenceRhythmDomain') {
        if (!isPlainObject(domainCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_storm_cadence_rhythm_domain',
                path,
                'Storm cadence rhythm domain must be an object.'
            );
            return;
        }

        validateExactFieldSetInto(
            domainCandidate,
            STORM_CADENCE_RHYTHM_DOMAIN_FIELD_IDS,
            issues,
            path,
            'storm_cadence_rhythm_domain'
        );

        STORM_CADENCE_RHYTHM_DOMAIN_FIELD_IDS.forEach((fieldId) => {
            if (hasOwn(domainCandidate, fieldId)) {
                validateStormCadenceRhythmFieldValueInto(
                    domainCandidate[fieldId],
                    fieldId,
                    issues,
                    path
                );
            }
        });
    }

    function validateNavigationRhythmDomainInto(domainCandidate, issues, path = 'navigationRhythmDomain') {
        if (!isPlainObject(domainCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_navigation_rhythm_domain',
                path,
                'Navigation rhythm domain must be an object.'
            );
            return;
        }

        validateExactFieldSetInto(
            domainCandidate,
            NAVIGATION_RHYTHM_DOMAIN_FIELD_IDS,
            issues,
            path,
            'navigation_rhythm_domain'
        );

        NAVIGATION_RHYTHM_DOMAIN_FIELD_IDS.forEach((fieldId) => {
            if (hasOwn(domainCandidate, fieldId)) {
                validateNavigationRhythmFieldValueInto(
                    domainCandidate[fieldId],
                    fieldId,
                    issues,
                    path
                );
            }
        });
    }

    function validateScarcityCadenceRhythmDomainInto(domainCandidate, issues, path = 'scarcityCadenceRhythmDomain') {
        if (!isPlainObject(domainCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_scarcity_cadence_rhythm_domain',
                path,
                'Scarcity cadence rhythm domain must be an object.'
            );
            return;
        }

        validateExactFieldSetInto(
            domainCandidate,
            SCARCITY_CADENCE_RHYTHM_DOMAIN_FIELD_IDS,
            issues,
            path,
            'scarcity_cadence_rhythm_domain'
        );

        SCARCITY_CADENCE_RHYTHM_DOMAIN_FIELD_IDS.forEach((fieldId) => {
            if (hasOwn(domainCandidate, fieldId)) {
                validateScarcityCadenceRhythmFieldValueInto(
                    domainCandidate[fieldId],
                    fieldId,
                    issues,
                    path
                );
            }
        });
    }

    function validatePredictabilityRhythmDomainInto(domainCandidate, issues, path = 'predictabilityRhythmDomain') {
        if (!isPlainObject(domainCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_predictability_rhythm_domain',
                path,
                'Predictability rhythm domain must be an object.'
            );
            return;
        }

        validateExactFieldSetInto(
            domainCandidate,
            PREDICTABILITY_RHYTHM_DOMAIN_FIELD_IDS,
            issues,
            path,
            'predictability_rhythm_domain'
        );

        PREDICTABILITY_RHYTHM_DOMAIN_FIELD_IDS.forEach((fieldId) => {
            if (hasOwn(domainCandidate, fieldId)) {
                validatePredictabilityRhythmFieldValueInto(
                    domainCandidate[fieldId],
                    fieldId,
                    issues,
                    path
                );
            }
        });
    }

    function validateRecoveryRhythmDomainInto(domainCandidate, issues, path = 'recoveryRhythmDomain') {
        if (!isPlainObject(domainCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_recovery_rhythm_domain',
                path,
                'Recovery rhythm domain must be an object.'
            );
            return;
        }

        validateExactFieldSetInto(
            domainCandidate,
            RECOVERY_RHYTHM_DOMAIN_FIELD_IDS,
            issues,
            path,
            'recovery_rhythm_domain'
        );

        RECOVERY_RHYTHM_DOMAIN_FIELD_IDS.forEach((fieldId) => {
            if (hasOwn(domainCandidate, fieldId)) {
                validateRecoveryRhythmFieldValueInto(
                    domainCandidate[fieldId],
                    fieldId,
                    issues,
                    path
                );
            }
        });
    }

    function validatePressureSynthesizedSchemaInto(synthesizedCandidate, issues, path = 'pressureSynthesizedSchema') {
        if (!isPlainObject(synthesizedCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_synthesized_pressure_schema',
                path,
                'Pressure synthesized schema must be an object.'
            );
            return;
        }

        validateExactFieldSetInto(
            synthesizedCandidate,
            PRESSURE_SYNTHESIZED_FIELD_IDS,
            issues,
            path,
            'synthesized_pressure_schema'
        );

        PRESSURE_SYNTHESIZED_FIELD_IDS.forEach((fieldId) => {
            if (hasOwn(synthesizedCandidate, fieldId)) {
                validatePressureSynthesizedFieldValueInto(
                    synthesizedCandidate[fieldId],
                    fieldId,
                    issues,
                    path
                );
            }
        });
    }

    function validateRhythmSynthesizedSchemaInto(synthesizedCandidate, issues, path = 'rhythmSynthesizedSchema') {
        if (!isPlainObject(synthesizedCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_synthesized_rhythm_schema',
                path,
                'Rhythm synthesized schema must be an object.'
            );
            return;
        }

        validateExactFieldSetInto(
            synthesizedCandidate,
            RHYTHM_SYNTHESIZED_FIELD_IDS,
            issues,
            path,
            'synthesized_rhythm_schema'
        );

        RHYTHM_SYNTHESIZED_FIELD_IDS.forEach((fieldId) => {
            if (hasOwn(synthesizedCandidate, fieldId)) {
                validateRhythmSynthesizedFieldValueInto(
                    synthesizedCandidate[fieldId],
                    fieldId,
                    issues,
                    path
                );
            }
        });
    }

    function validateClimatePressureDomain(domainCandidate = {}) {
        const issues = [];
        validateClimatePressureDomainInto(domainCandidate, issues);
        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: CLIMATE_PRESSURE_DOMAIN_CONTRACT_ID,
            domainId: 'climate',
            version: CLIMATE_PRESSURE_DOMAIN_VERSION,
            requiredFieldIds: CLIMATE_PRESSURE_DOMAIN_FIELD_IDS.slice(),
            issues
        });
    }

    function assertClimatePressureDomain(domainCandidate = {}) {
        const validation = validateClimatePressureDomain(domainCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid climate pressure domain: ${detail}`);
        }

        return domainCandidate;
    }

    function validateTerrainPressureDomain(domainCandidate = {}) {
        const issues = [];
        validateTerrainPressureDomainInto(domainCandidate, issues);
        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: TERRAIN_PRESSURE_DOMAIN_CONTRACT_ID,
            domainId: 'terrain',
            version: TERRAIN_PRESSURE_DOMAIN_VERSION,
            requiredFieldIds: TERRAIN_PRESSURE_DOMAIN_FIELD_IDS.slice(),
            issues
        });
    }

    function assertTerrainPressureDomain(domainCandidate = {}) {
        const validation = validateTerrainPressureDomain(domainCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid terrain pressure domain: ${detail}`);
        }

        return domainCandidate;
    }

    function validateHydrologyPressureDomain(domainCandidate = {}) {
        const issues = [];
        validateHydrologyPressureDomainInto(domainCandidate, issues);
        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: HYDROLOGY_PRESSURE_DOMAIN_CONTRACT_ID,
            domainId: 'hydrology',
            version: HYDROLOGY_PRESSURE_DOMAIN_VERSION,
            requiredFieldIds: HYDROLOGY_PRESSURE_DOMAIN_FIELD_IDS.slice(),
            issues
        });
    }

    function assertHydrologyPressureDomain(domainCandidate = {}) {
        const validation = validateHydrologyPressureDomain(domainCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid hydrology pressure domain: ${detail}`);
        }

        return domainCandidate;
    }

    function validateFoodPressureDomain(domainCandidate = {}) {
        const issues = [];
        validateFoodPressureDomainInto(domainCandidate, issues);
        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: FOOD_PRESSURE_DOMAIN_CONTRACT_ID,
            domainId: 'food',
            version: FOOD_PRESSURE_DOMAIN_VERSION,
            requiredFieldIds: FOOD_PRESSURE_DOMAIN_FIELD_IDS.slice(),
            issues
        });
    }

    function assertFoodPressureDomain(domainCandidate = {}) {
        const validation = validateFoodPressureDomain(domainCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid food pressure domain: ${detail}`);
        }

        return domainCandidate;
    }

    function validateTravelPressureDomain(domainCandidate = {}) {
        const issues = [];
        validateTravelPressureDomainInto(domainCandidate, issues);
        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: TRAVEL_PRESSURE_DOMAIN_CONTRACT_ID,
            domainId: 'travel',
            version: TRAVEL_PRESSURE_DOMAIN_VERSION,
            requiredFieldIds: TRAVEL_PRESSURE_DOMAIN_FIELD_IDS.slice(),
            issues
        });
    }

    function assertTravelPressureDomain(domainCandidate = {}) {
        const validation = validateTravelPressureDomain(domainCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid travel pressure domain: ${detail}`);
        }

        return domainCandidate;
    }

    function validateChokepointPressureDomain(domainCandidate = {}) {
        const issues = [];
        validateChokepointPressureDomainInto(domainCandidate, issues);
        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: CHOKEPOINT_PRESSURE_DOMAIN_CONTRACT_ID,
            domainId: 'chokepoints',
            version: CHOKEPOINT_PRESSURE_DOMAIN_VERSION,
            requiredFieldIds: CHOKEPOINT_PRESSURE_DOMAIN_FIELD_IDS.slice(),
            issues
        });
    }

    function assertChokepointPressureDomain(domainCandidate = {}) {
        const validation = validateChokepointPressureDomain(domainCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid chokepoint pressure domain: ${detail}`);
        }

        return domainCandidate;
    }

    function validateIsolationPressureDomain(domainCandidate = {}) {
        const issues = [];
        validateIsolationPressureDomainInto(domainCandidate, issues);
        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: ISOLATION_PRESSURE_DOMAIN_CONTRACT_ID,
            domainId: 'isolation',
            version: ISOLATION_PRESSURE_DOMAIN_VERSION,
            requiredFieldIds: ISOLATION_PRESSURE_DOMAIN_FIELD_IDS.slice(),
            issues
        });
    }

    function assertIsolationPressureDomain(domainCandidate = {}) {
        const validation = validateIsolationPressureDomain(domainCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid isolation pressure domain: ${detail}`);
        }

        return domainCandidate;
    }

    function validateEcologyPressureDomain(domainCandidate = {}) {
        const issues = [];
        validateEcologyPressureDomainInto(domainCandidate, issues);
        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: ECOLOGY_PRESSURE_DOMAIN_CONTRACT_ID,
            domainId: 'ecology',
            version: ECOLOGY_PRESSURE_DOMAIN_VERSION,
            requiredFieldIds: ECOLOGY_PRESSURE_DOMAIN_FIELD_IDS.slice(),
            issues
        });
    }

    function assertEcologyPressureDomain(domainCandidate = {}) {
        const validation = validateEcologyPressureDomain(domainCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid ecology pressure domain: ${detail}`);
        }

        return domainCandidate;
    }

    function validateCatastrophePressureDomain(domainCandidate = {}) {
        const issues = [];
        validateCatastrophePressureDomainInto(domainCandidate, issues);
        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: CATASTROPHE_PRESSURE_DOMAIN_CONTRACT_ID,
            domainId: 'catastrophe',
            version: CATASTROPHE_PRESSURE_DOMAIN_VERSION,
            requiredFieldIds: CATASTROPHE_PRESSURE_DOMAIN_FIELD_IDS.slice(),
            issues
        });
    }

    function assertCatastrophePressureDomain(domainCandidate = {}) {
        const validation = validateCatastrophePressureDomain(domainCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid catastrophe pressure domain: ${detail}`);
        }

        return domainCandidate;
    }

    function validateSeasonalityRhythmDomain(domainCandidate = {}) {
        const issues = [];
        validateSeasonalityRhythmDomainInto(domainCandidate, issues);
        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: SEASONALITY_RHYTHM_DOMAIN_CONTRACT_ID,
            domainId: 'seasonality',
            version: SEASONALITY_RHYTHM_DOMAIN_VERSION,
            requiredFieldIds: SEASONALITY_RHYTHM_DOMAIN_FIELD_IDS.slice(),
            issues
        });
    }

    function assertSeasonalityRhythmDomain(domainCandidate = {}) {
        const validation = validateSeasonalityRhythmDomain(domainCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid seasonality rhythm domain: ${detail}`);
        }

        return domainCandidate;
    }

    function validateStormCadenceRhythmDomain(domainCandidate = {}) {
        const issues = [];
        validateStormCadenceRhythmDomainInto(domainCandidate, issues);
        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: STORM_CADENCE_RHYTHM_DOMAIN_CONTRACT_ID,
            domainId: 'storms',
            version: STORM_CADENCE_RHYTHM_DOMAIN_VERSION,
            requiredFieldIds: STORM_CADENCE_RHYTHM_DOMAIN_FIELD_IDS.slice(),
            issues
        });
    }

    function assertStormCadenceRhythmDomain(domainCandidate = {}) {
        const validation = validateStormCadenceRhythmDomain(domainCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid storm cadence rhythm domain: ${detail}`);
        }

        return domainCandidate;
    }

    function validateNavigationRhythmDomain(domainCandidate = {}) {
        const issues = [];
        validateNavigationRhythmDomainInto(domainCandidate, issues);
        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: NAVIGATION_RHYTHM_DOMAIN_CONTRACT_ID,
            domainId: 'navigation',
            version: NAVIGATION_RHYTHM_DOMAIN_VERSION,
            requiredFieldIds: NAVIGATION_RHYTHM_DOMAIN_FIELD_IDS.slice(),
            issues
        });
    }

    function assertNavigationRhythmDomain(domainCandidate = {}) {
        const validation = validateNavigationRhythmDomain(domainCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid navigation rhythm domain: ${detail}`);
        }

        return domainCandidate;
    }

    function validateScarcityCadenceRhythmDomain(domainCandidate = {}) {
        const issues = [];
        validateScarcityCadenceRhythmDomainInto(domainCandidate, issues);
        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: SCARCITY_CADENCE_RHYTHM_DOMAIN_CONTRACT_ID,
            domainId: 'scarcity',
            version: SCARCITY_CADENCE_RHYTHM_DOMAIN_VERSION,
            requiredFieldIds: SCARCITY_CADENCE_RHYTHM_DOMAIN_FIELD_IDS.slice(),
            issues
        });
    }

    function assertScarcityCadenceRhythmDomain(domainCandidate = {}) {
        const validation = validateScarcityCadenceRhythmDomain(domainCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid scarcity cadence rhythm domain: ${detail}`);
        }

        return domainCandidate;
    }

    function validatePredictabilityRhythmDomain(domainCandidate = {}) {
        const issues = [];
        validatePredictabilityRhythmDomainInto(domainCandidate, issues);
        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: PREDICTABILITY_RHYTHM_DOMAIN_CONTRACT_ID,
            domainId: 'predictability',
            version: PREDICTABILITY_RHYTHM_DOMAIN_VERSION,
            requiredFieldIds: PREDICTABILITY_RHYTHM_DOMAIN_FIELD_IDS.slice(),
            issues
        });
    }

    function assertPredictabilityRhythmDomain(domainCandidate = {}) {
        const validation = validatePredictabilityRhythmDomain(domainCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid predictability rhythm domain: ${detail}`);
        }

        return domainCandidate;
    }

    function validateRecoveryRhythmDomain(domainCandidate = {}) {
        const issues = [];
        validateRecoveryRhythmDomainInto(domainCandidate, issues);
        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: RECOVERY_RHYTHM_DOMAIN_CONTRACT_ID,
            domainId: 'recovery',
            version: RECOVERY_RHYTHM_DOMAIN_VERSION,
            requiredFieldIds: RECOVERY_RHYTHM_DOMAIN_FIELD_IDS.slice(),
            issues
        });
    }

    function assertRecoveryRhythmDomain(domainCandidate = {}) {
        const validation = validateRecoveryRhythmDomain(domainCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid recovery rhythm domain: ${detail}`);
        }

        return domainCandidate;
    }

    function validatePressureSynthesizedSchema(synthesizedCandidate = {}) {
        const issues = [];
        validatePressureSynthesizedSchemaInto(synthesizedCandidate, issues);
        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: PRESSURE_SYNTHESIZED_SCHEMA_CONTRACT_ID,
            version: PRESSURE_SYNTHESIZED_SCHEMA_VERSION,
            requiredFieldIds: PRESSURE_SYNTHESIZED_FIELD_IDS.slice(),
            issues
        });
    }

    function assertPressureSynthesizedSchema(synthesizedCandidate = {}) {
        const validation = validatePressureSynthesizedSchema(synthesizedCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid pressure synthesized schema: ${detail}`);
        }

        return synthesizedCandidate;
    }

    function validateRhythmSynthesizedSchema(synthesizedCandidate = {}) {
        const issues = [];
        validateRhythmSynthesizedSchemaInto(synthesizedCandidate, issues);
        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: RHYTHM_SYNTHESIZED_SCHEMA_CONTRACT_ID,
            version: RHYTHM_SYNTHESIZED_SCHEMA_VERSION,
            requiredFieldIds: RHYTHM_SYNTHESIZED_FIELD_IDS.slice(),
            issues
        });
    }

    function assertRhythmSynthesizedSchema(synthesizedCandidate = {}) {
        const validation = validateRhythmSynthesizedSchema(synthesizedCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid rhythm synthesized schema: ${detail}`);
        }

        return synthesizedCandidate;
    }

    function validateRecordBoundProfileInto(profile, issues, path = 'recordBoundProfile', options = {}) {
        const requiredPackageKeys = Array.isArray(options.requiredPackageKeys)
            ? options.requiredPackageKeys
            : [];
        const forbiddenNonEmptySignalSections = Array.isArray(options.forbiddenNonEmptySignalSections)
            ? options.forbiddenNonEmptySignalSections
            : [];

        if (!isPlainObject(profile)) {
            addIssue(
                issues,
                'error',
                'invalid_record_bound_profile',
                path,
                'Record-bound profile must be an object.'
            );
            return;
        }

        RECORD_BOUND_PROFILE_BASE_KEYS.concat(requiredPackageKeys).forEach((key) => {
            if (!hasOwn(profile, key)) {
                addIssue(
                    issues,
                    'error',
                    'missing_record_bound_profile_key',
                    `${path}.${key}`,
                    `Record-bound profile is missing required key: ${key}.`
                );
            }
        });

        if (!normalizeString(profile.profileId)) {
            addIssue(
                issues,
                'error',
                'missing_profile_id',
                `${path}.profileId`,
                'Record-bound profile requires a stable profileId.'
            );
        }

        if (!normalizeString(profile.recordId)) {
            addIssue(
                issues,
                'error',
                'missing_canonical_record_id',
                `${path}.recordId`,
                'Record-bound profile requires a canonical Phase 1 recordId.'
            );
        }

        if (!normalizeString(profile.sourcePackageId)) {
            addIssue(
                issues,
                'error',
                'missing_source_package_id',
                `${path}.sourcePackageId`,
                'Record-bound profile requires the source MacroGeographyPackage id.'
            );
        }

        const recordType = normalizeString(profile.recordType);
        if (!recordType) {
            addIssue(
                issues,
                'error',
                'missing_canonical_record_type',
                `${path}.recordType`,
                'Record-bound profile requires a canonical Phase 1 recordType.'
            );
        } else if (!CANONICAL_RECORD_TYPE_IDS.includes(recordType)) {
            addIssue(
                issues,
                'error',
                'invalid_canonical_record_type',
                `${path}.recordType`,
                `Record-bound profile recordType must be one of: ${CANONICAL_RECORD_TYPE_IDS.join(', ')}.`
            );
        }

        if (normalizeString(profile.profileId) && (!recordType || !normalizeString(profile.recordId))) {
            addIssue(
                issues,
                'error',
                'profile_id_without_canonical_record_binding',
                path,
                'Record-bound profile cannot expose profileId without canonical recordType and recordId.'
            );
        }

        RECORD_BOUND_PROFILE_SIGNAL_KEYS.forEach((key) => {
            if (!isPlainObject(profile[key])) {
                addIssue(
                    issues,
                    'error',
                    'invalid_record_profile_signal_section',
                    `${path}.${key}`,
                    `Record-bound profile signal section must be an object: ${key}.`
                );
            }
        });

        forbiddenNonEmptySignalSections.forEach((key) => {
            if (hasOwn(profile, key) && !isEmptyObject(profile[key])) {
                addIssue(
                    issues,
                    'error',
                    'forbidden_record_profile_signal_section',
                    `${path}.${key}`,
                    `Record-bound profile must not carry ${key} data in this package.`
                );
            }
        });

        if (!Array.isArray(profile.dominantEnvironmentalTraits)) {
            addIssue(
                issues,
                'error',
                'invalid_dominant_environmental_traits',
                `${path}.dominantEnvironmentalTraits`,
                'Record-bound profile dominantEnvironmentalTraits must be an array.'
            );
        }

        if (typeof profile.summary !== 'string') {
            addIssue(
                issues,
                'error',
                'invalid_record_profile_summary',
                `${path}.summary`,
                'Record-bound profile summary must be a string.'
            );
        }

        if (requiredPackageKeys.includes('dominantBurdens') && !Array.isArray(profile.dominantBurdens)) {
            addIssue(
                issues,
                'error',
                'invalid_pressure_profile_burdens',
                `${path}.dominantBurdens`,
                'Pressure regional profile dominantBurdens must be an array.'
            );
        }

        if (requiredPackageKeys.includes('synthesizedSnapshot') && !isPlainObject(profile.synthesizedSnapshot)) {
            addIssue(
                issues,
                'error',
                'invalid_pressure_profile_synthesized_snapshot',
                `${path}.synthesizedSnapshot`,
                'Pressure regional profile synthesizedSnapshot must be an object.'
            );
        }

        if (requiredPackageKeys.includes('dominantRhythms') && !Array.isArray(profile.dominantRhythms)) {
            addIssue(
                issues,
                'error',
                'invalid_rhythm_profile_rhythms',
                `${path}.dominantRhythms`,
                'Rhythm regional profile dominantRhythms must be an array.'
            );
        }

        if (requiredPackageKeys.includes('recoverySnapshot') && !isPlainObject(profile.recoverySnapshot)) {
            addIssue(
                issues,
                'error',
                'invalid_rhythm_profile_recovery_snapshot',
                `${path}.recoverySnapshot`,
                'Rhythm regional profile recoverySnapshot must be an object.'
            );
        }
    }

    function validateRecordBoundProfile(profileCandidate = {}) {
        const issues = [];
        validateRecordBoundProfileInto(profileCandidate, issues);
        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: RECORD_BOUND_PROFILE_CONTRACT_ID,
            version: RECORD_BOUND_PROFILE_VERSION,
            canonicalRecordTypes: CANONICAL_RECORD_TYPE_IDS.slice(),
            issues
        });
    }

    function assertRecordBoundProfile(profileCandidate = {}) {
        const validation = validateRecordBoundProfile(profileCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid RecordBoundEnvironmentalProfile: ${detail}`);
        }

        return profileCandidate;
    }

    function validateStringListInto(value, issues, path, code, message) {
        if (!Array.isArray(value)) {
            addIssue(issues, 'error', code, path, message);
            return;
        }

        value.forEach((entry, index) => {
            if (!normalizeString(entry)) {
                addIssue(
                    issues,
                    'error',
                    `${code}_item`,
                    `${path}[${index}]`,
                    `${message} Items must be non-empty strings.`
                );
            }
        });
    }

    function validatePhase2ValidationCheckInto(check, issues, path) {
        if (!isPlainObject(check)) {
            addIssue(
                issues,
                'error',
                'invalid_validation_check',
                path,
                'Validation check entry must be an object.'
            );
            return;
        }

        VALIDATION_CHECK_REQUIRED_KEYS.forEach((key) => {
            if (!hasOwn(check, key)) {
                addIssue(
                    issues,
                    'error',
                    'missing_validation_check_key',
                    `${path}.${key}`,
                    `Validation check is missing required key: ${key}.`
                );
            }
        });

        if (!normalizeString(check.checkId)) {
            addIssue(
                issues,
                'error',
                'missing_validation_check_id',
                `${path}.checkId`,
                'Validation check requires a stable checkId.'
            );
        }

        if (!VALIDATION_STATUS_IDS.includes(normalizeString(check.status))) {
            addIssue(
                issues,
                'error',
                'invalid_validation_check_status',
                `${path}.status`,
                `Validation check status must be one of: ${VALIDATION_STATUS_IDS.join(', ')}.`
            );
        }

        if (typeof check.message !== 'string') {
            addIssue(
                issues,
                'error',
                'invalid_validation_check_message',
                `${path}.message`,
                'Validation check message must be a string.'
            );
        }

        validateStringListInto(
            check.details,
            issues,
            `${path}.details`,
            'invalid_validation_check_details',
            'Validation check details must be an array.'
        );
        validateStringListInto(
            check.affectedPaths,
            issues,
            `${path}.affectedPaths`,
            'invalid_validation_check_affected_paths',
            'Validation check affectedPaths must be an array.'
        );

        if (!isPlainObject(check.meta)) {
            addIssue(
                issues,
                'error',
                'invalid_validation_check_meta',
                `${path}.meta`,
                'Validation check meta must be an object.'
            );
        }
    }

    function validatePhase2ValidationRecommendationInto(recommendation, issues, path) {
        if (!isPlainObject(recommendation)) {
            addIssue(
                issues,
                'error',
                'invalid_validation_recommendation',
                path,
                'Validation recommendation must be an object.'
            );
            return;
        }

        VALIDATION_RECOMMENDATION_REQUIRED_KEYS.forEach((key) => {
            if (!hasOwn(recommendation, key)) {
                addIssue(
                    issues,
                    'error',
                    'missing_validation_recommendation_key',
                    `${path}.${key}`,
                    `Validation recommendation is missing required key: ${key}.`
                );
            }
        });

        if (!normalizeString(recommendation.recommendationId)) {
            addIssue(
                issues,
                'error',
                'missing_validation_recommendation_id',
                `${path}.recommendationId`,
                'Validation recommendation requires a stable recommendationId.'
            );
        }

        if (!VALIDATION_FAMILY_IDS.includes(normalizeString(recommendation.familyId))) {
            addIssue(
                issues,
                'error',
                'invalid_validation_recommendation_family',
                `${path}.familyId`,
                `Validation recommendation familyId must be one of: ${VALIDATION_FAMILY_IDS.join(', ')}.`
            );
        }

        if (!normalizeString(recommendation.recommendationType)) {
            addIssue(
                issues,
                'error',
                'missing_validation_recommendation_type',
                `${path}.recommendationType`,
                'Validation recommendation requires a recommendationType.'
            );
        }

        if (!VALIDATION_RECOMMENDATION_PRIORITY_IDS.includes(normalizeString(recommendation.priority))) {
            addIssue(
                issues,
                'error',
                'invalid_validation_recommendation_priority',
                `${path}.priority`,
                `Validation recommendation priority must be one of: ${VALIDATION_RECOMMENDATION_PRIORITY_IDS.join(', ')}.`
            );
        }

        if (typeof recommendation.message !== 'string') {
            addIssue(
                issues,
                'error',
                'invalid_validation_recommendation_message',
                `${path}.message`,
                'Validation recommendation message must be a string.'
            );
        }

        validateStringListInto(
            recommendation.targetIds,
            issues,
            `${path}.targetIds`,
            'invalid_validation_recommendation_target_ids',
            'Validation recommendation targetIds must be an array.'
        );

        if (!isPlainObject(recommendation.meta)) {
            addIssue(
                issues,
                'error',
                'invalid_validation_recommendation_meta',
                `${path}.meta`,
                'Validation recommendation meta must be an object.'
            );
        }
    }

    function validatePhase2ValidationBlockingReasonInto(blockingReason, issues, path) {
        if (!isPlainObject(blockingReason)) {
            addIssue(
                issues,
                'error',
                'invalid_validation_blocking_reason',
                path,
                'Validation blocking reason must be an object.'
            );
            return;
        }

        VALIDATION_BLOCKING_REASON_REQUIRED_KEYS.forEach((key) => {
            if (!hasOwn(blockingReason, key)) {
                addIssue(
                    issues,
                    'error',
                    'missing_validation_blocking_reason_key',
                    `${path}.${key}`,
                    `Validation blocking reason is missing required key: ${key}.`
                );
            }
        });

        if (!normalizeString(blockingReason.blockingReasonId)) {
            addIssue(
                issues,
                'error',
                'missing_validation_blocking_reason_id',
                `${path}.blockingReasonId`,
                'Validation blocking reason requires a stable blockingReasonId.'
            );
        }

        if (!VALIDATION_FAMILY_IDS.includes(normalizeString(blockingReason.familyId))) {
            addIssue(
                issues,
                'error',
                'invalid_validation_blocking_reason_family',
                `${path}.familyId`,
                `Validation blocking reason familyId must be one of: ${VALIDATION_FAMILY_IDS.join(', ')}.`
            );
        }

        if (!normalizeString(blockingReason.reasonCode)) {
            addIssue(
                issues,
                'error',
                'missing_validation_blocking_reason_code',
                `${path}.reasonCode`,
                'Validation blocking reason requires a reasonCode.'
            );
        }

        if (typeof blockingReason.message !== 'string') {
            addIssue(
                issues,
                'error',
                'invalid_validation_blocking_reason_message',
                `${path}.message`,
                'Validation blocking reason message must be a string.'
            );
        }

        validateStringListInto(
            blockingReason.affectedPaths,
            issues,
            `${path}.affectedPaths`,
            'invalid_validation_blocking_reason_paths',
            'Validation blocking reason affectedPaths must be an array.'
        );

        if (!isPlainObject(blockingReason.meta)) {
            addIssue(
                issues,
                'error',
                'invalid_validation_blocking_reason_meta',
                `${path}.meta`,
                'Validation blocking reason meta must be an object.'
            );
        }
    }

    function validatePhase2ValidationFamilySectionInto(section, issues, path, expectedFamilyId) {
        if (!isPlainObject(section)) {
            addIssue(
                issues,
                'error',
                'invalid_validation_family_section',
                path,
                'Validation family section must be an object.'
            );
            return;
        }

        VALIDATION_FAMILY_REQUIRED_KEYS.forEach((key) => {
            if (!hasOwn(section, key)) {
                addIssue(
                    issues,
                    'error',
                    'missing_validation_family_key',
                    `${path}.${key}`,
                    `Validation family section is missing required key: ${key}.`
                );
            }
        });

        if (normalizeString(section.familyId) !== expectedFamilyId) {
            addIssue(
                issues,
                'error',
                'invalid_validation_family_id',
                `${path}.familyId`,
                `Validation family section must declare familyId ${expectedFamilyId}.`
            );
        }

        if (!VALIDATION_STATUS_IDS.includes(normalizeString(section.status))) {
            addIssue(
                issues,
                'error',
                'invalid_validation_family_status',
                `${path}.status`,
                `Validation family status must be one of: ${VALIDATION_STATUS_IDS.join(', ')}.`
            );
        }

        if (!Array.isArray(section.checks)) {
            addIssue(
                issues,
                'error',
                'invalid_validation_family_checks',
                `${path}.checks`,
                'Validation family checks must be an array.'
            );
        } else {
            section.checks.forEach((check, index) => {
                validatePhase2ValidationCheckInto(check, issues, `${path}.checks[${index}]`);
            });
        }

        validateStringListInto(
            section.notes,
            issues,
            `${path}.notes`,
            'invalid_validation_family_notes',
            'Validation family notes must be an array.'
        );
        validateStringListInto(
            section.recommendationIds,
            issues,
            `${path}.recommendationIds`,
            'invalid_validation_family_recommendation_ids',
            'Validation family recommendationIds must be an array.'
        );
        validateStringListInto(
            section.blockingReasonIds,
            issues,
            `${path}.blockingReasonIds`,
            'invalid_validation_family_blocking_reason_ids',
            'Validation family blockingReasonIds must be an array.'
        );

        if (!isPlainObject(section.meta)) {
            addIssue(
                issues,
                'error',
                'invalid_validation_family_meta',
                `${path}.meta`,
                'Validation family meta must be an object.'
            );
        }
    }

    function validatePhase2ValidationReport(reportCandidate = {}) {
        const issues = [];

        if (!isPlainObject(reportCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_validation_report',
                'phase2ValidationReport',
                'Phase2ValidationReport must be an object.'
            );
            return deepFreeze({
                isValid: false,
                contractId: VALIDATION_REPORT_CONTRACT_ID,
                version: VALIDATION_REPORT_VERSION,
                supportedFamilies: VALIDATION_FAMILY_IDS.slice(),
                issues
            });
        }

        VALIDATION_REPORT_REQUIRED_KEYS.forEach((key) => {
            if (!hasOwn(reportCandidate, key)) {
                addIssue(
                    issues,
                    'error',
                    'missing_validation_report_key',
                    key,
                    `Phase2ValidationReport is missing required root key: ${key}.`
                );
            }
        });

        if (reportCandidate.contractId !== VALIDATION_REPORT_CONTRACT_ID) {
            addIssue(
                issues,
                'error',
                'invalid_validation_report_contract_id',
                'contractId',
                `Phase2ValidationReport.contractId must be ${VALIDATION_REPORT_CONTRACT_ID}.`
            );
        }

        if (reportCandidate.phaseId !== PRESSURE_PACKAGE_PHASE_ID) {
            addIssue(
                issues,
                'error',
                'invalid_validation_report_phase_id',
                'phaseId',
                `Phase2ValidationReport.phaseId must be ${PRESSURE_PACKAGE_PHASE_ID}.`
            );
        }

        if (reportCandidate.version !== VALIDATION_REPORT_VERSION) {
            addIssue(
                issues,
                'error',
                'invalid_validation_report_version',
                'version',
                `Phase2ValidationReport.version must be ${VALIDATION_REPORT_VERSION}.`
            );
        }

        [
            'validationId',
            'sourcePressureFieldPackageId',
            'sourceEnvironmentalRhythmPackageId',
            'sourceMacroGeographyPackageId'
        ].forEach((key) => {
            if (!normalizeString(reportCandidate[key])) {
                addIssue(
                    issues,
                    'error',
                    'missing_validation_report_source_id',
                    key,
                    `Phase2ValidationReport.${key} must be a non-empty string.`
                );
            }
        });

        if (
            reportCandidate.sourceMacroGeographyHandoffPackageId !== null
            && typeof reportCandidate.sourceMacroGeographyHandoffPackageId !== 'string'
        ) {
            addIssue(
                issues,
                'error',
                'invalid_validation_report_handoff_source',
                'sourceMacroGeographyHandoffPackageId',
                'Phase2ValidationReport.sourceMacroGeographyHandoffPackageId must be null or a string.'
            );
        }

        VALIDATION_FAMILY_IDS.forEach((familyId) => {
            const familyKey = VALIDATION_FAMILY_KEY_BY_ID[familyId];
            validatePhase2ValidationFamilySectionInto(
                reportCandidate[familyKey],
                issues,
                familyKey,
                familyId
            );
        });

        if (!Array.isArray(reportCandidate.rebalanceRecommendations)) {
            addIssue(
                issues,
                'error',
                'invalid_validation_recommendations',
                'rebalanceRecommendations',
                'Phase2ValidationReport.rebalanceRecommendations must be an array.'
            );
        } else {
            reportCandidate.rebalanceRecommendations.forEach((recommendation, index) => {
                validatePhase2ValidationRecommendationInto(
                    recommendation,
                    issues,
                    `rebalanceRecommendations[${index}]`
                );
            });
        }

        if (!Array.isArray(reportCandidate.blockingReasons)) {
            addIssue(
                issues,
                'error',
                'invalid_validation_blocking_reasons',
                'blockingReasons',
                'Phase2ValidationReport.blockingReasons must be an array.'
            );
        } else {
            reportCandidate.blockingReasons.forEach((blockingReason, index) => {
                validatePhase2ValidationBlockingReasonInto(
                    blockingReason,
                    issues,
                    `blockingReasons[${index}]`
                );
            });
        }

        if (!VALIDATION_FINAL_STATUS_IDS.includes(normalizeString(reportCandidate.finalStatus))) {
            addIssue(
                issues,
                'error',
                'invalid_validation_final_status',
                'finalStatus',
                `Phase2ValidationReport.finalStatus must be one of: ${VALIDATION_FINAL_STATUS_IDS.join(', ')}.`
            );
        }

        if (Array.isArray(reportCandidate.rebalanceRecommendations)) {
            const recommendationIds = new Set(
                reportCandidate.rebalanceRecommendations
                    .map((recommendation) => normalizeString(recommendation && recommendation.recommendationId))
                    .filter(Boolean)
            );

            VALIDATION_FAMILY_IDS.forEach((familyId) => {
                const familyKey = VALIDATION_FAMILY_KEY_BY_ID[familyId];
                const familySection = reportCandidate[familyKey];

                if (!isPlainObject(familySection) || !Array.isArray(familySection.recommendationIds)) {
                    return;
                }

                familySection.recommendationIds.forEach((recommendationId, index) => {
                    if (!recommendationIds.has(recommendationId)) {
                        addIssue(
                            issues,
                            'error',
                            'unknown_family_recommendation_reference',
                            `${familyKey}.recommendationIds[${index}]`,
                            `Validation family ${familyId} references unknown recommendationId: ${recommendationId}.`
                        );
                    }
                });
            });
        }

        if (Array.isArray(reportCandidate.blockingReasons)) {
            const blockingReasonIds = new Set(
                reportCandidate.blockingReasons
                    .map((blockingReason) => normalizeString(blockingReason && blockingReason.blockingReasonId))
                    .filter(Boolean)
            );

            VALIDATION_FAMILY_IDS.forEach((familyId) => {
                const familyKey = VALIDATION_FAMILY_KEY_BY_ID[familyId];
                const familySection = reportCandidate[familyKey];

                if (!isPlainObject(familySection) || !Array.isArray(familySection.blockingReasonIds)) {
                    return;
                }

                familySection.blockingReasonIds.forEach((blockingReasonId, index) => {
                    if (!blockingReasonIds.has(blockingReasonId)) {
                        addIssue(
                            issues,
                            'error',
                            'unknown_family_blocking_reason_reference',
                            `${familyKey}.blockingReasonIds[${index}]`,
                            `Validation family ${familyId} references unknown blockingReasonId: ${blockingReasonId}.`
                        );
                    }
                });
            });
        }

        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: VALIDATION_REPORT_CONTRACT_ID,
            version: VALIDATION_REPORT_VERSION,
            supportedFamilies: VALIDATION_FAMILY_IDS.slice(),
            statusEnums: deepFreeze({
                familyAndCheck: VALIDATION_STATUS_IDS.slice(),
                final: VALIDATION_FINAL_STATUS_IDS.slice(),
                recommendationPriority: VALIDATION_RECOMMENDATION_PRIORITY_IDS.slice()
            }),
            issues
        });
    }

    function assertPhase2ValidationReport(reportCandidate = {}) {
        const validation = validatePhase2ValidationReport(reportCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid Phase2ValidationReport: ${detail}`);
        }

        return reportCandidate;
    }

    function findForbiddenTimingKeys(value, path = 'pressureFieldPackage') {
        if (!value || typeof value !== 'object') {
            return [];
        }

        if (Array.isArray(value)) {
            return value.flatMap((entry, index) => {
                return findForbiddenTimingKeys(entry, `${path}[${index}]`);
            });
        }

        return Object.keys(value).flatMap((key) => {
            const currentPath = `${path}.${key}`;
            const currentIssue = FORBIDDEN_PRESSURE_TIMING_KEYS.includes(key)
                ? [{
                    path: currentPath,
                    key
                }]
                : [];
            return currentIssue.concat(findForbiddenTimingKeys(value[key], currentPath));
        });
    }

    function findForbiddenBurdenKeys(value, path = 'environmentalRhythmPackage') {
        if (!value || typeof value !== 'object') {
            return [];
        }

        if (Array.isArray(value)) {
            return value.flatMap((entry, index) => {
                return findForbiddenBurdenKeys(entry, `${path}[${index}]`);
            });
        }

        return Object.keys(value).flatMap((key) => {
            const currentPath = `${path}.${key}`;
            const currentIssue = FORBIDDEN_RHYTHM_BURDEN_KEYS.includes(key)
                ? [{
                    path: currentPath,
                    key
                }]
                : [];
            return currentIssue.concat(findForbiddenBurdenKeys(value[key], currentPath));
        });
    }

    function validatePressureRegionalProfiles(regionalProfiles, issues) {
        if (!Array.isArray(regionalProfiles)) {
            addIssue(
                issues,
                'error',
                'invalid_regional_profiles',
                'regionalProfiles',
                'PressureFieldPackage.regionalProfiles must be an array.'
            );
            return;
        }

        regionalProfiles.forEach((profile, index) => {
            const profilePath = `regionalProfiles[${index}]`;
            if (!isPlainObject(profile)) {
                addIssue(
                    issues,
                    'error',
                    'invalid_regional_profile',
                    profilePath,
                    'Pressure regional profile must be an object.'
                );
                return;
            }

            validateRecordBoundProfileInto(profile, issues, profilePath, {
                requiredPackageKeys: PRESSURE_REGIONAL_PROFILE_PACKAGE_KEYS,
                forbiddenNonEmptySignalSections: ['rhythmSignals']
            });
        });
    }

    function validateRhythmRegionalProfiles(regionalProfiles, issues) {
        if (!Array.isArray(regionalProfiles)) {
            addIssue(
                issues,
                'error',
                'invalid_regional_profiles',
                'regionalProfiles',
                'EnvironmentalRhythmPackage.regionalProfiles must be an array.'
            );
            return;
        }

        regionalProfiles.forEach((profile, index) => {
            const profilePath = `regionalProfiles[${index}]`;
            if (!isPlainObject(profile)) {
                addIssue(
                    issues,
                    'error',
                    'invalid_regional_profile',
                    profilePath,
                    'Rhythm regional profile must be an object.'
                );
                return;
            }

            validateRecordBoundProfileInto(profile, issues, profilePath, {
                requiredPackageKeys: RHYTHM_REGIONAL_PROFILE_PACKAGE_KEYS,
                forbiddenNonEmptySignalSections: ['pressureSignals']
            });
        });
    }

    function validatePressureFieldPackage(packageCandidate = {}) {
        const issues = [];

        if (!isPlainObject(packageCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_package',
                'pressureFieldPackage',
                'PressureFieldPackage must be an object.'
            );
            return deepFreeze({
                isValid: false,
                contractId: PRESSURE_PACKAGE_CONTRACT_ID,
                issues
            });
        }

        ROOT_REQUIRED_KEYS.forEach((key) => {
            if (!hasOwn(packageCandidate, key)) {
                addIssue(
                    issues,
                    'error',
                    'missing_root_key',
                    key,
                    `PressureFieldPackage is missing required root key: ${key}.`
                );
            }
        });

        if (packageCandidate.phaseId !== PRESSURE_PACKAGE_PHASE_ID) {
            addIssue(
                issues,
                'error',
                'invalid_phase_id',
                'phaseId',
                `PressureFieldPackage.phaseId must be ${PRESSURE_PACKAGE_PHASE_ID}.`
            );
        }

        if (packageCandidate.version !== PRESSURE_PACKAGE_VERSION) {
            addIssue(
                issues,
                'error',
                'invalid_version',
                'version',
                `PressureFieldPackage.version must be ${PRESSURE_PACKAGE_VERSION}.`
            );
        }

        if (!isPlainObject(packageCandidate.domains)) {
            addIssue(
                issues,
                'error',
                'invalid_domains',
                'domains',
                'PressureFieldPackage.domains must be an object.'
            );
        } else {
            PRESSURE_DOMAIN_IDS.forEach((domainId) => {
                const domainPath = `domains.${domainId}`;
                const domain = packageCandidate.domains[domainId];
                if (!hasOwn(packageCandidate.domains, domainId)) {
                    addIssue(
                        issues,
                        'error',
                        'missing_required_domain',
                        domainPath,
                        `PressureFieldPackage.domains is missing required pressure domain: ${domainId}.`
                    );
                    return;
                }

                if (!isPlainObject(domain)) {
                    addIssue(
                        issues,
                        'error',
                        'invalid_domain',
                        domainPath,
                        `Pressure domain must be an object: ${domainId}.`
                    );
                    return;
                }

                if (domainId === 'climate') {
                    validateClimatePressureDomainInto(domain, issues, domainPath);
                    return;
                }

                if (domainId === 'terrain') {
                    validateTerrainPressureDomainInto(domain, issues, domainPath);
                    return;
                }

                if (domainId === 'hydrology') {
                    validateHydrologyPressureDomainInto(domain, issues, domainPath);
                    return;
                }

                if (domainId === 'food') {
                    validateFoodPressureDomainInto(domain, issues, domainPath);
                    return;
                }

                if (domainId === 'travel') {
                    validateTravelPressureDomainInto(domain, issues, domainPath);
                    return;
                }

                if (domainId === 'chokepoints') {
                    validateChokepointPressureDomainInto(domain, issues, domainPath);
                    return;
                }

                if (domainId === 'isolation') {
                    validateIsolationPressureDomainInto(domain, issues, domainPath);
                    return;
                }

                if (domainId === 'ecology') {
                    validateEcologyPressureDomainInto(domain, issues, domainPath);
                    return;
                }

                if (domainId === 'catastrophe') {
                    validateCatastrophePressureDomainInto(domain, issues, domainPath);
                    return;
                }

                PRESSURE_DOMAIN_FIELDS[domainId].forEach((fieldId) => {
                    if (!hasOwn(domain, fieldId)) {
                        addIssue(
                            issues,
                            'error',
                            'missing_required_pressure_field',
                            `${domainPath}.${fieldId}`,
                            `Pressure domain ${domainId} is missing required field: ${fieldId}.`
                        );
                    }
                });
            });
        }

        if (!isPlainObject(packageCandidate.synthesized)) {
            addIssue(
                issues,
                'error',
                'invalid_synthesized',
                'synthesized',
                'PressureFieldPackage.synthesized must be an object.'
            );
        } else {
            validatePressureSynthesizedSchemaInto(packageCandidate.synthesized, issues, 'synthesized');
        }

        if (!isPlainObject(packageCandidate.summaries)) {
            addIssue(
                issues,
                'error',
                'invalid_summaries',
                'summaries',
                'PressureFieldPackage.summaries must be an object.'
            );
        } else {
            PRESSURE_SUMMARY_KEYS.forEach((key) => {
                if (!hasOwn(packageCandidate.summaries, key)) {
                    addIssue(
                        issues,
                        'error',
                        'missing_required_pressure_summary',
                        `summaries.${key}`,
                        `PressureFieldPackage.summaries is missing required summary: ${key}.`
                    );
                }
            });
        }

        if (!isPlainObject(packageCandidate.validationMeta)) {
            addIssue(
                issues,
                'error',
                'invalid_validation_meta',
                'validationMeta',
                'PressureFieldPackage.validationMeta must be an object.'
            );
        } else {
            PRESSURE_VALIDATION_META_KEYS.forEach((key) => {
                if (!hasOwn(packageCandidate.validationMeta, key)) {
                    addIssue(
                        issues,
                        'error',
                        'missing_required_validation_meta',
                        `validationMeta.${key}`,
                        `PressureFieldPackage.validationMeta is missing required key: ${key}.`
                    );
                }
            });
        }

        validatePressureRegionalProfiles(packageCandidate.regionalProfiles, issues);

        findForbiddenTimingKeys(packageCandidate).forEach((entry) => {
            addIssue(
                issues,
                'error',
                'pressure_timing_field_mixing',
                entry.path,
                `PressureFieldPackage must not contain rhythm/recovery timing field: ${entry.key}.`
            );
        });

        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: PRESSURE_PACKAGE_CONTRACT_ID,
            requiredDomainIds: PRESSURE_DOMAIN_IDS.slice(),
            issues
        });
    }

    function validateEnvironmentalRhythmPackage(packageCandidate = {}) {
        const issues = [];

        if (!isPlainObject(packageCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_package',
                'environmentalRhythmPackage',
                'EnvironmentalRhythmPackage must be an object.'
            );
            return deepFreeze({
                isValid: false,
                contractId: RHYTHM_PACKAGE_CONTRACT_ID,
                issues
            });
        }

        ROOT_REQUIRED_KEYS.forEach((key) => {
            if (!hasOwn(packageCandidate, key)) {
                addIssue(
                    issues,
                    'error',
                    'missing_root_key',
                    key,
                    `EnvironmentalRhythmPackage is missing required root key: ${key}.`
                );
            }
        });

        if (packageCandidate.phaseId !== PRESSURE_PACKAGE_PHASE_ID) {
            addIssue(
                issues,
                'error',
                'invalid_phase_id',
                'phaseId',
                `EnvironmentalRhythmPackage.phaseId must be ${PRESSURE_PACKAGE_PHASE_ID}.`
            );
        }

        if (packageCandidate.version !== RHYTHM_PACKAGE_VERSION) {
            addIssue(
                issues,
                'error',
                'invalid_version',
                'version',
                `EnvironmentalRhythmPackage.version must be ${RHYTHM_PACKAGE_VERSION}.`
            );
        }

        if (!isPlainObject(packageCandidate.domains)) {
            addIssue(
                issues,
                'error',
                'invalid_domains',
                'domains',
                'EnvironmentalRhythmPackage.domains must be an object.'
            );
        } else {
            RHYTHM_DOMAIN_IDS.forEach((domainId) => {
                const domainPath = `domains.${domainId}`;
                const domain = packageCandidate.domains[domainId];
                if (!hasOwn(packageCandidate.domains, domainId)) {
                    addIssue(
                        issues,
                        'error',
                        domainId === 'recovery'
                            ? 'missing_required_recovery_domain'
                            : 'missing_required_domain',
                        domainPath,
                        `EnvironmentalRhythmPackage.domains is missing required rhythm domain: ${domainId}.`
                    );
                    return;
                }

                if (!isPlainObject(domain)) {
                    addIssue(
                        issues,
                        'error',
                        'invalid_domain',
                        domainPath,
                        `Rhythm domain must be an object: ${domainId}.`
                    );
                    return;
                }

                if (domainId === 'seasonality') {
                    validateSeasonalityRhythmDomainInto(domain, issues, domainPath);
                    return;
                }
                if (domainId === 'storms') {
                    validateStormCadenceRhythmDomainInto(domain, issues, domainPath);
                    return;
                }
                if (domainId === 'navigation') {
                    validateNavigationRhythmDomainInto(domain, issues, domainPath);
                    return;
                }
                if (domainId === 'scarcity') {
                    validateScarcityCadenceRhythmDomainInto(domain, issues, domainPath);
                    return;
                }
                if (domainId === 'predictability') {
                    validatePredictabilityRhythmDomainInto(domain, issues, domainPath);
                    return;
                }
                if (domainId === 'recovery') {
                    validateRecoveryRhythmDomainInto(domain, issues, domainPath);
                    return;
                }

                RHYTHM_DOMAIN_FIELDS[domainId].forEach((fieldId) => {
                    if (!hasOwn(domain, fieldId)) {
                        addIssue(
                            issues,
                            'error',
                            domainId === 'recovery'
                                ? 'missing_required_recovery_field'
                                : 'missing_required_rhythm_field',
                            `${domainPath}.${fieldId}`,
                            `Rhythm domain ${domainId} is missing required field: ${fieldId}.`
                        );
                    }
                });
            });
        }

        if (!isPlainObject(packageCandidate.synthesized)) {
            addIssue(
                issues,
                'error',
                'invalid_synthesized',
                'synthesized',
                'EnvironmentalRhythmPackage.synthesized must be an object.'
            );
        } else {
            validateRhythmSynthesizedSchemaInto(packageCandidate.synthesized, issues, 'synthesized');
        }

        if (!isPlainObject(packageCandidate.summaries)) {
            addIssue(
                issues,
                'error',
                'invalid_summaries',
                'summaries',
                'EnvironmentalRhythmPackage.summaries must be an object.'
            );
        } else {
            RHYTHM_SUMMARY_KEYS.forEach((key) => {
                if (!hasOwn(packageCandidate.summaries, key)) {
                    addIssue(
                        issues,
                        'error',
                        key === 'recoverySummary'
                            ? 'missing_required_recovery_summary'
                            : 'missing_required_rhythm_summary',
                        `summaries.${key}`,
                        `EnvironmentalRhythmPackage.summaries is missing required summary: ${key}.`
                    );
                }
            });
        }

        if (!isPlainObject(packageCandidate.validationMeta)) {
            addIssue(
                issues,
                'error',
                'invalid_validation_meta',
                'validationMeta',
                'EnvironmentalRhythmPackage.validationMeta must be an object.'
            );
        } else {
            RHYTHM_VALIDATION_META_KEYS.forEach((key) => {
                if (!hasOwn(packageCandidate.validationMeta, key)) {
                    addIssue(
                        issues,
                        'error',
                        key === 'reliefStatus'
                            ? 'missing_required_relief_validation_meta'
                            : 'missing_required_validation_meta',
                        `validationMeta.${key}`,
                        `EnvironmentalRhythmPackage.validationMeta is missing required key: ${key}.`
                    );
                }
            });
        }

        validateRhythmRegionalProfiles(packageCandidate.regionalProfiles, issues);

        findForbiddenBurdenKeys(packageCandidate).forEach((entry) => {
            addIssue(
                issues,
                'error',
                'rhythm_pressure_field_mixing',
                entry.path,
                `EnvironmentalRhythmPackage must not contain pressure/burden field: ${entry.key}.`
            );
        });

        return deepFreeze({
            isValid: !issues.some((issue) => issue.severity === 'error'),
            contractId: RHYTHM_PACKAGE_CONTRACT_ID,
            requiredDomainIds: RHYTHM_DOMAIN_IDS.slice(),
            requiredRecoveryDomainId: 'recovery',
            issues
        });
    }

    function assertPressureFieldPackage(packageCandidate = {}) {
        const validation = validatePressureFieldPackage(packageCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid PressureFieldPackage: ${detail}`);
        }

        return packageCandidate;
    }

    function assertEnvironmentalRhythmPackage(packageCandidate = {}) {
        const validation = validateEnvironmentalRhythmPackage(packageCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid EnvironmentalRhythmPackage: ${detail}`);
        }

        return packageCandidate;
    }

    function getPressureFieldPackageContract() {
        return deepFreeze({
            contractId: PRESSURE_PACKAGE_CONTRACT_ID,
            phaseId: PRESSURE_PACKAGE_PHASE_ID,
            version: PRESSURE_PACKAGE_VERSION,
            rootRequiredKeys: ROOT_REQUIRED_KEYS.slice(),
            requiredDomains: cloneValue(PRESSURE_DOMAIN_FIELDS),
            climateDomainContractId: CLIMATE_PRESSURE_DOMAIN_CONTRACT_ID,
            terrainDomainContractId: TERRAIN_PRESSURE_DOMAIN_CONTRACT_ID,
            hydrologyDomainContractId: HYDROLOGY_PRESSURE_DOMAIN_CONTRACT_ID,
            foodDomainContractId: FOOD_PRESSURE_DOMAIN_CONTRACT_ID,
            travelDomainContractId: TRAVEL_PRESSURE_DOMAIN_CONTRACT_ID,
            chokepointsDomainContractId: CHOKEPOINT_PRESSURE_DOMAIN_CONTRACT_ID,
            isolationDomainContractId: ISOLATION_PRESSURE_DOMAIN_CONTRACT_ID,
            ecologyDomainContractId: ECOLOGY_PRESSURE_DOMAIN_CONTRACT_ID,
            catastropheDomainContractId: CATASTROPHE_PRESSURE_DOMAIN_CONTRACT_ID,
            synthesizedSchemaContractId: PRESSURE_SYNTHESIZED_SCHEMA_CONTRACT_ID,
            synthesizedRequiredFields: PRESSURE_SYNTHESIZED_FIELD_IDS.slice(),
            requiredSummaries: PRESSURE_SUMMARY_KEYS.slice(),
            requiredValidationMeta: PRESSURE_VALIDATION_META_KEYS.slice(),
            regionalProfileRequiredKeys: PRESSURE_REGIONAL_PROFILE_KEYS.slice(),
            regionalProfileContractId: RECORD_BOUND_PROFILE_CONTRACT_ID,
            regionalProfileCanonicalRecordTypes: CANONICAL_RECORD_TYPE_IDS.slice(),
            forbiddenTimingKeys: FORBIDDEN_PRESSURE_TIMING_KEYS.slice()
        });
    }

    function getRecordBoundProfileContract() {
        return deepFreeze({
            contractId: RECORD_BOUND_PROFILE_CONTRACT_ID,
            phaseId: PRESSURE_PACKAGE_PHASE_ID,
            version: RECORD_BOUND_PROFILE_VERSION,
            requiredKeys: RECORD_BOUND_PROFILE_BASE_KEYS.slice(),
            signalSections: RECORD_BOUND_PROFILE_SIGNAL_KEYS.slice(),
            canonicalRecordTypes: CANONICAL_RECORD_TYPE_IDS.slice(),
            sourceRecordContract: 'MacroGeographyPackage',
            summaryKeys: [
                'dominantEnvironmentalTraits',
                'summary'
            ]
        });
    }

    function getCanonicalPhase2RecordTypeIds() {
        return CANONICAL_RECORD_TYPE_IDS.slice();
    }

    function getEnvironmentalRhythmPackageContract() {
        return deepFreeze({
            contractId: RHYTHM_PACKAGE_CONTRACT_ID,
            phaseId: PRESSURE_PACKAGE_PHASE_ID,
            version: RHYTHM_PACKAGE_VERSION,
            rootRequiredKeys: ROOT_REQUIRED_KEYS.slice(),
            requiredDomains: cloneValue(RHYTHM_DOMAIN_FIELDS),
            seasonalityDomainContractId: SEASONALITY_RHYTHM_DOMAIN_CONTRACT_ID,
            stormsDomainContractId: STORM_CADENCE_RHYTHM_DOMAIN_CONTRACT_ID,
            navigationDomainContractId: NAVIGATION_RHYTHM_DOMAIN_CONTRACT_ID,
            scarcityDomainContractId: SCARCITY_CADENCE_RHYTHM_DOMAIN_CONTRACT_ID,
            predictabilityDomainContractId: PREDICTABILITY_RHYTHM_DOMAIN_CONTRACT_ID,
            recoveryDomainContractId: RECOVERY_RHYTHM_DOMAIN_CONTRACT_ID,
            synthesizedSchemaContractId: RHYTHM_SYNTHESIZED_SCHEMA_CONTRACT_ID,
            requiredRecoveryDomainId: 'recovery',
            synthesizedRequiredFields: RHYTHM_SYNTHESIZED_FIELD_IDS.slice(),
            requiredSummaries: RHYTHM_SUMMARY_KEYS.slice(),
            requiredValidationMeta: RHYTHM_VALIDATION_META_KEYS.slice(),
            regionalProfileRequiredKeys: RHYTHM_REGIONAL_PROFILE_KEYS.slice(),
            regionalProfileContractId: RECORD_BOUND_PROFILE_CONTRACT_ID,
            regionalProfileCanonicalRecordTypes: CANONICAL_RECORD_TYPE_IDS.slice(),
            forbiddenBurdenKeys: FORBIDDEN_RHYTHM_BURDEN_KEYS.slice()
        });
    }

    function getClimatePressureDomainContract() {
        return CLIMATE_PRESSURE_DOMAIN_CONTRACT;
    }

    function getTerrainPressureDomainContract() {
        return TERRAIN_PRESSURE_DOMAIN_CONTRACT;
    }

    function getHydrologyPressureDomainContract() {
        return HYDROLOGY_PRESSURE_DOMAIN_CONTRACT;
    }

    function getFoodPressureDomainContract() {
        return FOOD_PRESSURE_DOMAIN_CONTRACT;
    }

    function getTravelPressureDomainContract() {
        return TRAVEL_PRESSURE_DOMAIN_CONTRACT;
    }

    function getChokepointPressureDomainContract() {
        return CHOKEPOINT_PRESSURE_DOMAIN_CONTRACT;
    }

    function getIsolationPressureDomainContract() {
        return ISOLATION_PRESSURE_DOMAIN_CONTRACT;
    }

    function getEcologyPressureDomainContract() {
        return ECOLOGY_PRESSURE_DOMAIN_CONTRACT;
    }

    function getCatastrophePressureDomainContract() {
        return CATASTROPHE_PRESSURE_DOMAIN_CONTRACT;
    }

    function getSeasonalityRhythmDomainContract() {
        return SEASONALITY_RHYTHM_DOMAIN_CONTRACT;
    }

    function getStormCadenceRhythmDomainContract() {
        return STORM_CADENCE_RHYTHM_DOMAIN_CONTRACT;
    }

    function getNavigationRhythmDomainContract() {
        return NAVIGATION_RHYTHM_DOMAIN_CONTRACT;
    }

    function getScarcityCadenceRhythmDomainContract() {
        return SCARCITY_CADENCE_RHYTHM_DOMAIN_CONTRACT;
    }

    function getPredictabilityRhythmDomainContract() {
        return PREDICTABILITY_RHYTHM_DOMAIN_CONTRACT;
    }

    function getRecoveryRhythmDomainContract() {
        return RECOVERY_RHYTHM_DOMAIN_CONTRACT;
    }

    function getPhase2ValidationReportContract() {
        return deepFreeze({
            contractId: VALIDATION_REPORT_CONTRACT_ID,
            phaseId: PRESSURE_PACKAGE_PHASE_ID,
            version: VALIDATION_REPORT_VERSION,
            familyIds: VALIDATION_FAMILY_IDS.slice(),
            familyRootKeys: VALIDATION_FAMILY_ROOT_KEYS.slice(),
            familyRootKeyById: cloneValue(VALIDATION_FAMILY_KEY_BY_ID),
            requiredRootKeys: VALIDATION_REPORT_REQUIRED_KEYS.slice(),
            requiredFamilyKeys: VALIDATION_FAMILY_REQUIRED_KEYS.slice(),
            checkRequiredKeys: VALIDATION_CHECK_REQUIRED_KEYS.slice(),
            recommendationRequiredKeys: VALIDATION_RECOMMENDATION_REQUIRED_KEYS.slice(),
            blockingReasonRequiredKeys: VALIDATION_BLOCKING_REASON_REQUIRED_KEYS.slice(),
            statusEnums: deepFreeze({
                familyAndCheck: VALIDATION_STATUS_IDS.slice(),
                final: VALIDATION_FINAL_STATUS_IDS.slice(),
                recommendationPriority: VALIDATION_RECOMMENDATION_PRIORITY_IDS.slice()
            }),
            sourcePackageKeys: [
                'sourcePressureFieldPackageId',
                'sourceEnvironmentalRhythmPackageId',
                'sourceMacroGeographyPackageId',
                'sourceMacroGeographyHandoffPackageId'
            ],
            recommendationRootKey: 'rebalanceRecommendations',
            blockingReasonRootKey: 'blockingReasons'
        });
    }

    function getPhase2ValidationFamilyIds() {
        return VALIDATION_FAMILY_IDS.slice();
    }

    function getPhase2ValidationStatusEnums() {
        return deepFreeze({
            familyAndCheck: VALIDATION_STATUS_IDS.slice(),
            final: VALIDATION_FINAL_STATUS_IDS.slice(),
            recommendationPriority: VALIDATION_RECOMMENDATION_PRIORITY_IDS.slice()
        });
    }

    function getPressureDomainFieldIds() {
        return cloneValue(PRESSURE_DOMAIN_FIELDS);
    }

    function getRhythmDomainFieldIds() {
        return cloneValue(RHYTHM_DOMAIN_FIELDS);
    }

    function getPressureSynthesizedFieldIds() {
        return PRESSURE_SYNTHESIZED_FIELD_IDS.slice();
    }

    function getRhythmSynthesizedFieldIds() {
        return RHYTHM_SYNTHESIZED_FIELD_IDS.slice();
    }

    function getPressureSynthesizedSchemaContract() {
        return PRESSURE_SYNTHESIZED_SCHEMA_CONTRACT;
    }

    function getRhythmSynthesizedSchemaContract() {
        return RHYTHM_SYNTHESIZED_SCHEMA_CONTRACT;
    }

    function getPhase2ContractExportIndex() {
        return deepFreeze({
            indexId: CONTRACT_EXPORT_INDEX_ID,
            phaseId: PRESSURE_PACKAGE_PHASE_ID,
            version: CONTRACT_EXPORT_INDEX_VERSION,
            canonicalImportSurface: 'window.Game.systems.worldgenPhase2.contracts',
            canonicalPath: 'js/worldgen/phase2/contracts/index.js',
            moduleImports: [],
            runtimeAdapterCoupling: false,
            implementsGenerators: false,
            packageSchemas: {
                pressureFieldPackage: getPressureFieldPackageContract(),
                environmentalRhythmPackage: getEnvironmentalRhythmPackageContract()
            },
            domainSchemas: {
                pressure: {
                    domainIds: PRESSURE_DOMAIN_IDS.slice(),
                    domainFields: getPressureDomainFieldIds(),
                    synthesizedFieldIds: getPressureSynthesizedFieldIds(),
                    synthesizedSchema: getPressureSynthesizedSchemaContract(),
                    contracts: {
                        climate: getClimatePressureDomainContract(),
                        terrain: getTerrainPressureDomainContract(),
                        hydrology: getHydrologyPressureDomainContract(),
                        food: getFoodPressureDomainContract(),
                        travel: getTravelPressureDomainContract(),
                        chokepoints: getChokepointPressureDomainContract(),
                        isolation: getIsolationPressureDomainContract(),
                        ecology: getEcologyPressureDomainContract(),
                        catastrophe: getCatastrophePressureDomainContract()
                    }
                },
                rhythm: {
                    domainIds: RHYTHM_DOMAIN_IDS.slice(),
                    domainFields: getRhythmDomainFieldIds(),
                    synthesizedFieldIds: getRhythmSynthesizedFieldIds(),
                    synthesizedSchema: getRhythmSynthesizedSchemaContract(),
                    contracts: {
                        seasonality: getSeasonalityRhythmDomainContract(),
                        storms: getStormCadenceRhythmDomainContract(),
                        navigation: getNavigationRhythmDomainContract(),
                        scarcity: getScarcityCadenceRhythmDomainContract(),
                        predictability: getPredictabilityRhythmDomainContract(),
                        recovery: getRecoveryRhythmDomainContract()
                    },
                    requiredRecoveryDomainId: 'recovery'
                }
            },
            profileSchemas: {
                recordBoundEnvironmentalProfile: getRecordBoundProfileContract(),
                canonicalRecordTypes: getCanonicalPhase2RecordTypeIds()
            },
            validationSchemas: {
                phase2ValidationReport: getPhase2ValidationReportContract()
            },
            validators: {
                validatePressureFieldPackage,
                assertPressureFieldPackage,
                validateClimatePressureDomain,
                assertClimatePressureDomain,
                validateTerrainPressureDomain,
                assertTerrainPressureDomain,
                validateHydrologyPressureDomain,
                assertHydrologyPressureDomain,
                validateFoodPressureDomain,
                assertFoodPressureDomain,
                validateTravelPressureDomain,
                assertTravelPressureDomain,
                validateChokepointPressureDomain,
                assertChokepointPressureDomain,
                validateIsolationPressureDomain,
                assertIsolationPressureDomain,
                validateEcologyPressureDomain,
                assertEcologyPressureDomain,
                validateCatastrophePressureDomain,
                assertCatastrophePressureDomain,
                validatePressureSynthesizedSchema,
                assertPressureSynthesizedSchema,
                validateSeasonalityRhythmDomain,
                assertSeasonalityRhythmDomain,
                validateStormCadenceRhythmDomain,
                assertStormCadenceRhythmDomain,
                validateNavigationRhythmDomain,
                assertNavigationRhythmDomain,
                validateScarcityCadenceRhythmDomain,
                assertScarcityCadenceRhythmDomain,
                validatePredictabilityRhythmDomain,
                assertPredictabilityRhythmDomain,
                validateRecoveryRhythmDomain,
                assertRecoveryRhythmDomain,
                validateRhythmSynthesizedSchema,
                assertRhythmSynthesizedSchema,
                validateEnvironmentalRhythmPackage,
                assertEnvironmentalRhythmPackage,
                validateRecordBoundProfile,
                assertRecordBoundProfile,
                validatePhase2ValidationReport,
                assertPhase2ValidationReport
            },
            factories: {
                createPressureFieldPackageSkeleton,
                createEnvironmentalRhythmPackageSkeleton,
                createClimatePressureDomainSkeleton,
                createTerrainPressureDomainSkeleton,
                createHydrologyPressureDomainSkeleton,
                createFoodPressureDomainSkeleton,
                createTravelPressureDomainSkeleton,
                createChokepointPressureDomainSkeleton,
                createIsolationPressureDomainSkeleton,
                createEcologyPressureDomainSkeleton,
                createCatastrophePressureDomainSkeleton,
                createPressureSynthesizedSchemaSkeleton,
                createSeasonalityRhythmDomainSkeleton,
                createStormCadenceRhythmDomainSkeleton,
                createNavigationRhythmDomainSkeleton,
                createScarcityCadenceRhythmDomainSkeleton,
                createPredictabilityRhythmDomainSkeleton,
                createRecoveryRhythmDomainSkeleton,
                createRhythmSynthesizedSchemaSkeleton,
                createRecordBoundProfileSkeleton,
                createPhase2ValidationCheck,
                createPhase2ValidationRecommendation,
                createPhase2ValidationBlockingReason,
                createPhase2ValidationFamilySection,
                createPhase2ValidationReportSkeleton
            }
        });
    }

    phase2.__contractFirstStubs = phase2.__contractFirstStubs || {};
    phase2.__contractFirstStubs[GROUP_ID] = STUB;
    phase2.contracts = getPhase2ContractExportIndex();

    Object.assign(phase2, {
        getPhase2ContractsModuleStub,
        getPhase2ContractExportIndex,
        getRecordBoundProfileContract,
        createRecordBoundProfileSkeleton,
        validateRecordBoundProfile,
        assertRecordBoundProfile,
        getCanonicalPhase2RecordTypeIds,
        getPressureFieldPackageContract,
        createPressureFieldPackageSkeleton,
        validatePressureFieldPackage,
        assertPressureFieldPackage,
        getClimatePressureDomainContract,
        createClimatePressureDomainSkeleton,
        validateClimatePressureDomain,
        assertClimatePressureDomain,
        getTerrainPressureDomainContract,
        createTerrainPressureDomainSkeleton,
        validateTerrainPressureDomain,
        assertTerrainPressureDomain,
        getHydrologyPressureDomainContract,
        createHydrologyPressureDomainSkeleton,
        validateHydrologyPressureDomain,
        assertHydrologyPressureDomain,
        getFoodPressureDomainContract,
        createFoodPressureDomainSkeleton,
        validateFoodPressureDomain,
        assertFoodPressureDomain,
        getTravelPressureDomainContract,
        createTravelPressureDomainSkeleton,
        validateTravelPressureDomain,
        assertTravelPressureDomain,
        getChokepointPressureDomainContract,
        createChokepointPressureDomainSkeleton,
        validateChokepointPressureDomain,
        assertChokepointPressureDomain,
        getIsolationPressureDomainContract,
        createIsolationPressureDomainSkeleton,
        validateIsolationPressureDomain,
        assertIsolationPressureDomain,
        getEcologyPressureDomainContract,
        createEcologyPressureDomainSkeleton,
        validateEcologyPressureDomain,
        assertEcologyPressureDomain,
        getCatastrophePressureDomainContract,
        createCatastrophePressureDomainSkeleton,
        validateCatastrophePressureDomain,
        assertCatastrophePressureDomain,
        getPressureSynthesizedSchemaContract,
        createPressureSynthesizedSchemaSkeleton,
        validatePressureSynthesizedSchema,
        assertPressureSynthesizedSchema,
        getSeasonalityRhythmDomainContract,
        createSeasonalityRhythmDomainSkeleton,
        validateSeasonalityRhythmDomain,
        assertSeasonalityRhythmDomain,
        getStormCadenceRhythmDomainContract,
        createStormCadenceRhythmDomainSkeleton,
        validateStormCadenceRhythmDomain,
        assertStormCadenceRhythmDomain,
        getNavigationRhythmDomainContract,
        createNavigationRhythmDomainSkeleton,
        validateNavigationRhythmDomain,
        assertNavigationRhythmDomain,
        getScarcityCadenceRhythmDomainContract,
        createScarcityCadenceRhythmDomainSkeleton,
        validateScarcityCadenceRhythmDomain,
        assertScarcityCadenceRhythmDomain,
        getPredictabilityRhythmDomainContract,
        createPredictabilityRhythmDomainSkeleton,
        validatePredictabilityRhythmDomain,
        assertPredictabilityRhythmDomain,
        getRecoveryRhythmDomainContract,
        createRecoveryRhythmDomainSkeleton,
        validateRecoveryRhythmDomain,
        assertRecoveryRhythmDomain,
        getRhythmSynthesizedSchemaContract,
        createRhythmSynthesizedSchemaSkeleton,
        validateRhythmSynthesizedSchema,
        assertRhythmSynthesizedSchema,
        getPressureDomainFieldIds,
        getPressureSynthesizedFieldIds,
        getEnvironmentalRhythmPackageContract,
        createEnvironmentalRhythmPackageSkeleton,
        validateEnvironmentalRhythmPackage,
        assertEnvironmentalRhythmPackage,
        getRhythmDomainFieldIds,
        getRhythmSynthesizedFieldIds,
        getPhase2ValidationReportContract,
        getPhase2ValidationFamilyIds,
        getPhase2ValidationStatusEnums,
        createPhase2ValidationCheck,
        createPhase2ValidationRecommendation,
        createPhase2ValidationBlockingReason,
        createPhase2ValidationFamilySection,
        createPhase2ValidationReportSkeleton,
        validatePhase2ValidationReport,
        assertPhase2ValidationReport
    });
})();
