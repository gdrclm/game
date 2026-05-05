(() => {
    const game = window.Game;
    const phase2 = game.systems.worldgenPhase2 = game.systems.worldgenPhase2 || {};
    const GROUP_ID = 'binding';
    const PHASE_ID = 'PHASE_2';
    const RECORD_BINDING_LAYER_CONTRACT_ID = 'Phase2RecordBindingLayer';
    const RECORD_BINDING_LAYER_VERSION = 'phase2-record-binding-layer-v1';
    const RECORD_BINDING_PIPELINE_STEP_ID = 'Phase2RecordBindingLayer';
    const PRESSURE_PACKAGE_CONTRACT_ID = 'PressureFieldPackage';
    const RHYTHM_PACKAGE_CONTRACT_ID = 'EnvironmentalRhythmPackage';
    const INPUT_BUNDLE_CONTRACT_ID = 'Phase2InputBundle';
    const TIER_1_PRIMARY_CARRIER = 'tier1PrimaryCarrier';
    const TIER_2_STRUCTURAL_CARRIER = 'tier2StructuralCarrier';
    const TIER_3_CONTEXT_CARRIER = 'tier3ContextCarrier';
    const TARGET_MODE_DIRECT_RECORD_PROFILE = 'directRecordProfile';
    const TARGET_MODE_DERIVATIVE_RECORD_PROFILE = 'derivativeRecordProfile';
    const TARGET_MODE_SUMMARY_CONTEXT = 'summaryContext';
    const RECORD_INDEX_ERROR_INVALID_SOURCE_RECORD = 'invalid_phase2_binding_source_record';
    const RECORD_INDEX_ERROR_MISSING_RECORD_ID = 'missing_phase2_canonical_record_id';
    const RECORD_INDEX_ERROR_DUPLICATE_RECORD_ID = 'duplicate_phase2_canonical_record_id';
    const PRIMARY_CONTEXT_ERROR_INVALID_REFERENCE_FIELD = 'invalid_phase2_primary_context_reference_field';
    const PRIMARY_CONTEXT_ERROR_UNKNOWN_REFERENCE_ID = 'unknown_phase2_primary_context_reference_id';
    const PRIMARY_CONTEXT_ERROR_MISSING_CONTEXT_ENTRY = 'missing_phase2_primary_context_entry';
    const SECONDARY_CONTEXT_ERROR_INVALID_REFERENCE_FIELD = 'invalid_phase2_secondary_context_reference_field';
    const SECONDARY_CONTEXT_ERROR_UNKNOWN_REFERENCE_ID = 'unknown_phase2_secondary_context_reference_id';
    const SECONDARY_CONTEXT_ERROR_MISSING_CONTEXT_ENTRY = 'missing_phase2_secondary_context_entry';
    const SECONDARY_CONTEXT_ERROR_AMBIGUOUS_REFERENCE_ID = 'ambiguous_phase2_secondary_context_reference_id';
    const BINDING_TIER_CATALOG = Object.freeze({
        [TIER_1_PRIMARY_CARRIER]: Object.freeze({
            id: TIER_1_PRIMARY_CARRIER,
            label: 'Tier 1 - primary environmental carriers',
            description: 'Direct record carriers for the strongest burden and timing interpretation surfaces.'
        }),
        [TIER_2_STRUCTURAL_CARRIER]: Object.freeze({
            id: TIER_2_STRUCTURAL_CARRIER,
            label: 'Tier 2 - structural burden and timing carriers',
            description: 'Derivative record carriers for structural exposure, chokepoint, route, and isolation logic.'
        }),
        [TIER_3_CONTEXT_CARRIER]: Object.freeze({
            id: TIER_3_CONTEXT_CARRIER,
            label: 'Tier 3 - broader context carriers',
            description: 'Broader grouping records used as contextual summary surfaces rather than strongest direct carriers.'
        })
    });
    const PROFILE_TARGET_MODE_CATALOG = Object.freeze({
        [TARGET_MODE_DIRECT_RECORD_PROFILE]: Object.freeze({
            id: TARGET_MODE_DIRECT_RECORD_PROFILE,
            description: 'Direct per-record profile surface for primary environmental carriers.'
        }),
        [TARGET_MODE_DERIVATIVE_RECORD_PROFILE]: Object.freeze({
            id: TARGET_MODE_DERIVATIVE_RECORD_PROFILE,
            description: 'Derivative per-record profile surface for structural burden and rhythm carriers.'
        }),
        [TARGET_MODE_SUMMARY_CONTEXT]: Object.freeze({
            id: TARGET_MODE_SUMMARY_CONTEXT,
            description: 'Context-only summary grouping surface for broader regional aggregation.'
        })
    });
    const PACKAGE_PROFILE_SURFACE_CATALOG = Object.freeze({
        pressureRegionalProfiles: Object.freeze({
            surfaceId: 'pressureRegionalProfiles',
            packageContractId: PRESSURE_PACKAGE_CONTRACT_ID,
            targetPath: 'regionalProfiles',
            signalDomain: 'pressure',
            reservedSignalDomain: 'rhythm',
            description: 'Pressure-side record-aware profile target surface.'
        }),
        rhythmRegionalProfiles: Object.freeze({
            surfaceId: 'rhythmRegionalProfiles',
            packageContractId: RHYTHM_PACKAGE_CONTRACT_ID,
            targetPath: 'regionalProfiles',
            signalDomain: 'rhythm',
            reservedSignalDomain: 'pressure',
            description: 'Rhythm-side record-aware profile target surface.'
        })
    });
    const CANONICAL_RECORD_BINDING_DEFINITIONS = Object.freeze([
        Object.freeze({
            recordType: 'continents',
            sourceGroup: 'physical',
            sourceCollectionKey: 'continents',
            idField: 'continentId',
            sourceRecordContractId: 'continentRecord',
            bindingTierId: TIER_3_CONTEXT_CARRIER,
            targetMode: TARGET_MODE_SUMMARY_CONTEXT,
            packageProfileSurfaceIds: Object.freeze([
                'pressureRegionalProfiles',
                'rhythmRegionalProfiles'
            ]),
            description: 'Broad physical grouping used for context summaries rather than strongest direct environmental carriers.'
        }),
        Object.freeze({
            recordType: 'seaRegions',
            sourceGroup: 'physical',
            sourceCollectionKey: 'seaRegions',
            idField: 'seaRegionId',
            sourceRecordContractId: 'seaRegionRecord',
            bindingTierId: TIER_1_PRIMARY_CARRIER,
            targetMode: TARGET_MODE_DIRECT_RECORD_PROFILE,
            packageProfileSurfaceIds: Object.freeze([
                'pressureRegionalProfiles',
                'rhythmRegionalProfiles'
            ]),
            description: 'Primary marine carrier for storm, navigation, exposure, and rupture interpretation.'
        }),
        Object.freeze({
            recordType: 'mountainSystems',
            sourceGroup: 'physical',
            sourceCollectionKey: 'mountainSystems',
            idField: 'mountainSystemId',
            sourceRecordContractId: 'mountainSystemRecord',
            bindingTierId: TIER_1_PRIMARY_CARRIER,
            targetMode: TARGET_MODE_DIRECT_RECORD_PROFILE,
            packageProfileSurfaceIds: Object.freeze([
                'pressureRegionalProfiles',
                'rhythmRegionalProfiles'
            ]),
            description: 'Primary terrain carrier for harshness, mobility penalty, and ecological break interpretation.'
        }),
        Object.freeze({
            recordType: 'volcanicZones',
            sourceGroup: 'physical',
            sourceCollectionKey: 'volcanicZones',
            idField: 'volcanicZoneId',
            sourceRecordContractId: 'volcanicZoneRecord',
            bindingTierId: TIER_1_PRIMARY_CARRIER,
            targetMode: TARGET_MODE_DIRECT_RECORD_PROFILE,
            packageProfileSurfaceIds: Object.freeze([
                'pressureRegionalProfiles',
                'rhythmRegionalProfiles'
            ]),
            description: 'Primary catastrophe carrier for volcanic instability and related recovery interpretation.'
        }),
        Object.freeze({
            recordType: 'riverBasins',
            sourceGroup: 'physical',
            sourceCollectionKey: 'riverBasins',
            idField: 'riverBasinId',
            sourceRecordContractId: 'riverBasinRecord',
            bindingTierId: TIER_1_PRIMARY_CARRIER,
            targetMode: TARGET_MODE_DIRECT_RECORD_PROFILE,
            packageProfileSurfaceIds: Object.freeze([
                'pressureRegionalProfiles',
                'rhythmRegionalProfiles'
            ]),
            description: 'Primary hydrology carrier for water stress, scarcity cadence, and forgiveness context.'
        }),
        Object.freeze({
            recordType: 'climateBands',
            sourceGroup: 'physical',
            sourceCollectionKey: 'climateBands',
            idField: 'climateBandId',
            sourceRecordContractId: 'climateBandRecord',
            bindingTierId: TIER_1_PRIMARY_CARRIER,
            targetMode: TARGET_MODE_DIRECT_RECORD_PROFILE,
            packageProfileSurfaceIds: Object.freeze([
                'pressureRegionalProfiles',
                'rhythmRegionalProfiles'
            ]),
            description: 'Primary climate carrier for experienced burden, cadence, and predictability interpretation.'
        }),
        Object.freeze({
            recordType: 'reliefRegions',
            sourceGroup: 'physical',
            sourceCollectionKey: 'reliefRegions',
            idField: 'reliefRegionId',
            sourceRecordContractId: 'reliefRegionRecord',
            bindingTierId: TIER_1_PRIMARY_CARRIER,
            targetMode: TARGET_MODE_DIRECT_RECORD_PROFILE,
            packageProfileSurfaceIds: Object.freeze([
                'pressureRegionalProfiles',
                'rhythmRegionalProfiles'
            ]),
            description: 'Primary landform carrier for terrain pressure, hydrology support, and recovery tempo relevance.'
        }),
        Object.freeze({
            recordType: 'archipelagoRegions',
            sourceGroup: 'structural',
            sourceCollectionKey: 'archipelagoRegions',
            idField: 'archipelagoId',
            sourceRecordContractId: 'archipelagoRegionRecord',
            bindingTierId: TIER_2_STRUCTURAL_CARRIER,
            targetMode: TARGET_MODE_DERIVATIVE_RECORD_PROFILE,
            packageProfileSurfaceIds: Object.freeze([
                'pressureRegionalProfiles',
                'rhythmRegionalProfiles'
            ]),
            description: 'Structural carrier for distributed marine fragility, route exposure, and collapse sensitivity context.'
        }),
        Object.freeze({
            recordType: 'chokepoints',
            sourceGroup: 'structural',
            sourceCollectionKey: 'chokepoints',
            idField: 'chokepointId',
            sourceRecordContractId: 'chokepointRecord',
            bindingTierId: TIER_2_STRUCTURAL_CARRIER,
            targetMode: TARGET_MODE_DERIVATIVE_RECORD_PROFILE,
            packageProfileSurfaceIds: Object.freeze([
                'pressureRegionalProfiles',
                'rhythmRegionalProfiles'
            ]),
            description: 'Structural carrier for chokepoint pressure, failure impact, and blocked interval relevance.'
        }),
        Object.freeze({
            recordType: 'macroRoutes',
            sourceGroup: 'structural',
            sourceCollectionKey: 'macroRoutes',
            idField: 'routeId',
            sourceRecordContractId: 'macroRouteRecord',
            bindingTierId: TIER_2_STRUCTURAL_CARRIER,
            targetMode: TARGET_MODE_DERIVATIVE_RECORD_PROFILE,
            packageProfileSurfaceIds: Object.freeze([
                'pressureRegionalProfiles',
                'rhythmRegionalProfiles'
            ]),
            description: 'Structural carrier for movement exposure, route reliability, and navigation windows.'
        }),
        Object.freeze({
            recordType: 'isolatedZones',
            sourceGroup: 'structural',
            sourceCollectionKey: 'isolatedZones',
            idField: 'zoneId',
            sourceRecordContractId: 'isolatedZoneRecord',
            sourceRecordContractStatus: 'TODO_CONTRACTED',
            bindingTierId: TIER_2_STRUCTURAL_CARRIER,
            targetMode: TARGET_MODE_DERIVATIVE_RECORD_PROFILE,
            packageProfileSurfaceIds: Object.freeze([
                'pressureRegionalProfiles',
                'rhythmRegionalProfiles'
            ]),
            description: 'Structural carrier for remoteness burden, support delay, and environmental isolation timing.'
        }),
        Object.freeze({
            recordType: 'strategicRegions',
            sourceGroup: 'structural',
            sourceCollectionKey: 'strategicRegions',
            idField: 'regionId',
            sourceRecordContractId: 'strategicRegionRecord',
            bindingTierId: TIER_3_CONTEXT_CARRIER,
            targetMode: TARGET_MODE_SUMMARY_CONTEXT,
            packageProfileSurfaceIds: Object.freeze([
                'pressureRegionalProfiles',
                'rhythmRegionalProfiles'
            ]),
            description: 'Broader structural grouping used for context summaries without political or history-facing meaning.'
        })
    ]);
    const NON_PROFILE_SUPPORT_COLLECTIONS = Object.freeze([
        Object.freeze({
            collectionKey: 'coastalOpportunityMap',
            sourceGroup: 'structural',
            sourceCollectionPath: 'recordCollections.structural.coastalOpportunityMap',
            description: 'Support-only structural context. Not a canonical record-bound profile target.'
        })
    ]);
    const PRIMARY_CARRIER_RECORD_TYPES = Object.freeze([
        'reliefRegions',
        'climateBands',
        'riverBasins',
        'seaRegions',
        'mountainSystems',
        'volcanicZones'
    ]);
    const PRIMARY_CARRIER_CONTEXT_CONFIG = Object.freeze({
        reliefRegions: Object.freeze({
            descriptorFields: Object.freeze({
                strings: Object.freeze([
                    'reliefType'
                ]),
                numbers: Object.freeze([
                    'elevationBias',
                    'ruggednessBias',
                    'coastalInfluence'
                ])
            }),
            primaryCarrierLeadRefs: Object.freeze({}),
            primaryCarrierRefs: Object.freeze({
                seaRegions: 'adjacentSeaRegionIds'
            }),
            secondaryContextRefs: Object.freeze({
                continents: 'continentIds'
            })
        }),
        climateBands: Object.freeze({
            descriptorFields: Object.freeze({
                strings: Object.freeze([
                    'bandType'
                ]),
                numbers: Object.freeze([
                    'temperatureBias',
                    'humidityBias',
                    'seasonalityBias'
                ])
            }),
            primaryCarrierLeadRefs: Object.freeze({
                reliefRegions: 'primaryReliefRegionId'
            }),
            primaryCarrierRefs: Object.freeze({
                reliefRegions: 'reliefRegionIds',
                seaRegions: 'seaRegionIds'
            }),
            secondaryContextRefs: Object.freeze({})
        }),
        riverBasins: Object.freeze({
            descriptorFields: Object.freeze({
                strings: Object.freeze([
                    'basinType'
                ]),
                numbers: Object.freeze([
                    'catchmentScale',
                    'basinContinuity'
                ])
            }),
            primaryCarrierLeadRefs: Object.freeze({
                reliefRegions: 'primaryReliefRegionId',
                climateBands: 'primaryClimateBandId'
            }),
            primaryCarrierRefs: Object.freeze({
                reliefRegions: 'reliefRegionIds',
                climateBands: 'climateBandIds',
                seaRegions: 'terminalSeaRegionIds',
                mountainSystems: 'sourceMountainSystemIds'
            }),
            secondaryContextRefs: Object.freeze({})
        }),
        seaRegions: Object.freeze({
            descriptorFields: Object.freeze({
                strings: Object.freeze([
                    'basinType'
                ]),
                numbers: Object.freeze([
                    'stormPressure',
                    'navigability'
                ])
            }),
            primaryCarrierLeadRefs: Object.freeze({
                climateBands: 'primaryClimateBandId'
            }),
            primaryCarrierRefs: Object.freeze({
                climateBands: 'climateBandIds'
            }),
            secondaryContextRefs: Object.freeze({})
        }),
        mountainSystems: Object.freeze({
            descriptorFields: Object.freeze({
                strings: Object.freeze([
                    'systemType',
                    'spineOrientation'
                ]),
                numbers: Object.freeze([
                    'upliftBias',
                    'ridgeContinuity'
                ])
            }),
            primaryCarrierLeadRefs: Object.freeze({
                reliefRegions: 'primaryReliefRegionId'
            }),
            primaryCarrierRefs: Object.freeze({
                reliefRegions: 'reliefRegionIds'
            }),
            secondaryContextRefs: Object.freeze({})
        }),
        volcanicZones: Object.freeze({
            descriptorFields: Object.freeze({
                strings: Object.freeze([
                    'sourceType'
                ]),
                numbers: Object.freeze([
                    'activityBias',
                    'zoneContinuity'
                ])
            }),
            primaryCarrierLeadRefs: Object.freeze({
                reliefRegions: 'primaryReliefRegionId'
            }),
            primaryCarrierRefs: Object.freeze({
                reliefRegions: 'reliefRegionIds',
                mountainSystems: 'mountainSystemIds'
            }),
            secondaryContextRefs: Object.freeze({})
        })
    });
    const SECONDARY_CONTEXT_RECORD_TYPES = Object.freeze([
        'chokepoints',
        'macroRoutes',
        'isolatedZones',
        'archipelagoRegions',
        'strategicRegions',
        'continents'
    ]);
    const SECONDARY_DERIVATIVE_STRUCTURAL_RECORD_TYPES = Object.freeze([
        'chokepoints',
        'macroRoutes',
        'isolatedZones',
        'archipelagoRegions'
    ]);
    const SECONDARY_BROADER_CONTEXT_RECORD_TYPES = Object.freeze([
        'strategicRegions',
        'continents'
    ]);
    const SECONDARY_CONTEXT_PRIORITY_RULES = Object.freeze({
        primaryTruthSource: 'primaryCarrierContextTables',
        primaryCarrierRecordTypes: PRIMARY_CARRIER_RECORD_TYPES.slice(),
        secondaryContextRecordTypes: SECONDARY_CONTEXT_RECORD_TYPES.slice(),
        derivativeStructuralRecordTypes: SECONDARY_DERIVATIVE_STRUCTURAL_RECORD_TYPES.slice(),
        broaderContextRecordTypes: SECONDARY_BROADER_CONTEXT_RECORD_TYPES.slice(),
        secondaryMayOverridePrimaryTruth: false
    });
    const SECONDARY_CONTEXT_CONFIG = Object.freeze({
        chokepoints: Object.freeze({
            descriptorFields: Object.freeze({
                strings: Object.freeze([
                    'type'
                ]),
                numbers: Object.freeze([
                    'controlValue',
                    'tradeDependency',
                    'bypassDifficulty',
                    'collapseSensitivity'
                ])
            }),
            primaryCarrierLeadRefs: Object.freeze({}),
            primaryCarrierRefs: Object.freeze({}),
            secondaryContextRefs: Object.freeze({}),
            mixedLeadRefFields: Object.freeze([]),
            mixedArrayRefFields: Object.freeze([
                'adjacentRegions'
            ]),
            excludedSemanticFields: Object.freeze([])
        }),
        macroRoutes: Object.freeze({
            descriptorFields: Object.freeze({
                strings: Object.freeze([
                    'type'
                ]),
                numbers: Object.freeze([
                    'baseCost',
                    'fragility',
                    'redundancy'
                ])
            }),
            primaryCarrierLeadRefs: Object.freeze({}),
            primaryCarrierRefs: Object.freeze({}),
            secondaryContextRefs: Object.freeze({}),
            mixedLeadRefFields: Object.freeze([
                'fromRegion',
                'toRegion'
            ]),
            mixedArrayRefFields: Object.freeze([
                'through'
            ]),
            excludedSemanticFields: Object.freeze([
                'historicalImportance'
            ])
        }),
        isolatedZones: Object.freeze({
            descriptorFields: Object.freeze({
                strings: Object.freeze([
                    'type'
                ]),
                numbers: Object.freeze([
                    'isolation',
                    'resupplyDifficulty',
                    'autonomousSurvivalScore',
                    'lossInCollapseLikelihood'
                ])
            }),
            primaryCarrierLeadRefs: Object.freeze({}),
            primaryCarrierRefs: Object.freeze({}),
            secondaryContextRefs: Object.freeze({}),
            mixedLeadRefFields: Object.freeze([]),
            mixedArrayRefFields: Object.freeze([]),
            excludedSemanticFields: Object.freeze([
                'zoneClass',
                'culturalDriftPotential'
            ])
        }),
        archipelagoRegions: Object.freeze({
            descriptorFields: Object.freeze({
                strings: Object.freeze([
                    'morphologyType'
                ]),
                numbers: Object.freeze([
                    'connectiveValue',
                    'fragility'
                ])
            }),
            primaryCarrierLeadRefs: Object.freeze({
                seaRegions: 'primarySeaRegionId',
                climateBands: 'primaryClimateBandId'
            }),
            primaryCarrierRefs: Object.freeze({
                seaRegions: 'seaRegionIds',
                climateBands: 'climateBandIds'
            }),
            secondaryContextRefs: Object.freeze({
                macroRoutes: 'macroRouteIds',
                chokepoints: 'chokepointIds',
                strategicRegions: 'strategicRegionIds'
            }),
            mixedLeadRefFields: Object.freeze([]),
            mixedArrayRefFields: Object.freeze([]),
            excludedSemanticFields: Object.freeze([
                'roleProfile',
                'colonizationAppeal',
                'longTermSustainability',
                'historicalVolatility'
            ])
        }),
        strategicRegions: Object.freeze({
            descriptorFields: Object.freeze({
                strings: Object.freeze([]),
                numbers: Object.freeze([
                    'stabilityScore',
                    'expansionPressure'
                ]),
                objects: Object.freeze([
                    'valueMix'
                ])
            }),
            primaryCarrierLeadRefs: Object.freeze({}),
            primaryCarrierRefs: Object.freeze({}),
            secondaryContextRefs: Object.freeze({}),
            mixedLeadRefFields: Object.freeze([]),
            mixedArrayRefFields: Object.freeze([]),
            excludedSemanticFields: Object.freeze([
                'type'
            ])
        }),
        continents: Object.freeze({
            descriptorFields: Object.freeze({
                strings: Object.freeze([
                    'macroShape'
                ]),
                numbers: Object.freeze([])
            }),
            primaryCarrierLeadRefs: Object.freeze({
                reliefRegions: 'primaryReliefRegionId',
                climateBands: 'primaryClimateBandId'
            }),
            primaryCarrierRefs: Object.freeze({
                reliefRegions: 'reliefRegionIds',
                climateBands: 'climateBandIds'
            }),
            secondaryContextRefs: Object.freeze({}),
            mixedLeadRefFields: Object.freeze([]),
            mixedArrayRefFields: Object.freeze([]),
            excludedSemanticFields: Object.freeze([
                'nameSeed'
            ])
        })
    });
    const RECORD_BINDING_PIPELINE_STEP = Object.freeze({
        stepId: RECORD_BINDING_PIPELINE_STEP_ID,
        executionOrder: 2,
        inputContractId: INPUT_BUNDLE_CONTRACT_ID,
        required: true,
        implementsFieldLogic: false,
        preparesRecordIndexTables: true,
        preparesProfileTargetTables: true,
        preparesSummarySurfaceTables: true,
        supportsPerRecordSummaries: true,
        supportsPerRegionSummaries: true
    });
    const STUB = Object.freeze({
        groupId: GROUP_ID,
        status: 'partial_implemented_contract_first',
        canonicalPath: 'js/worldgen/phase2/binding/',
        uiCoupling: false,
        implementsFieldLogic: false,
        purpose: 'Phase2RecordBindingLayer scaffold for canonical Phase 1 record binding.'
    });

    function getPhase2BindingModuleStub() {
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

    function normalizeStringList(value) {
        return Array.isArray(value)
            ? value
                .map((entry) => normalizeString(entry, ''))
                .filter(Boolean)
            : [];
    }

    function uniqueStrings(values = []) {
        return Array.from(new Set(normalizeStringList(values)));
    }

    function addIssue(issues, severity, code, path, message) {
        issues.push({
            severity,
            code,
            path,
            message
        });
    }

    function getCanonicalPhase2RecordTypeIdsFromDefinitions() {
        return CANONICAL_RECORD_BINDING_DEFINITIONS.map((definition) => definition.recordType);
    }

    function ensureCanonicalBindingDefinitionConsistency() {
        if (typeof phase2.getCanonicalPhase2RecordTypeIds !== 'function') {
            return;
        }

        const contractRecordTypes = phase2.getCanonicalPhase2RecordTypeIds();
        const definitionRecordTypes = getCanonicalPhase2RecordTypeIdsFromDefinitions();
        const missingInDefinitions = contractRecordTypes.filter((recordType) => (
            !definitionRecordTypes.includes(recordType)
        ));
        const unexpectedDefinitions = definitionRecordTypes.filter((recordType) => (
            !contractRecordTypes.includes(recordType)
        ));

        if (missingInDefinitions.length || unexpectedDefinitions.length) {
            throw new Error(
                `[worldgen/phase2] Record binding definitions drifted from canonical Phase 2 record types. Missing in definitions: ${missingInDefinitions.join(', ') || 'none'}; unexpected in definitions: ${unexpectedDefinitions.join(', ') || 'none'}.`
            );
        }
    }

    function getCanonicalPhase2RecordBindingDefinitions() {
        ensureCanonicalBindingDefinitionConsistency();
        return CANONICAL_RECORD_BINDING_DEFINITIONS.map(cloneValue);
    }

    function getPhase2CanonicalBindingTierCatalog() {
        return cloneValue(BINDING_TIER_CATALOG);
    }

    function getPhase2RecordBindingPipelineStep() {
        return cloneValue(RECORD_BINDING_PIPELINE_STEP);
    }

    function getPhase2NonProfileSupportCollectionKeys() {
        return NON_PROFILE_SUPPORT_COLLECTIONS.map((collection) => collection.collectionKey);
    }

    function getPhase2PrimaryCarrierRecordTypes() {
        return PRIMARY_CARRIER_RECORD_TYPES.slice();
    }

    function getPhase2SecondaryContextRecordTypes() {
        return SECONDARY_CONTEXT_RECORD_TYPES.slice();
    }

    function getBindingDefinition(recordType) {
        return CANONICAL_RECORD_BINDING_DEFINITIONS.find((definition) => definition.recordType === recordType) || null;
    }

    function buildSourceCollectionPath(definition) {
        return `recordCollections.${definition.sourceGroup}.${definition.sourceCollectionKey}`;
    }

    function createBindingLayerId(bundle = {}) {
        const sourceBundleId = normalizeString(bundle.bundleId, 'bundle');
        return `phase2-record-binding:${sourceBundleId}:${RECORD_BINDING_LAYER_VERSION}`;
    }

    function getPhase2RecordBindingLayerContract() {
        ensureCanonicalBindingDefinitionConsistency();

        return deepFreeze({
            contractId: RECORD_BINDING_LAYER_CONTRACT_ID,
            version: RECORD_BINDING_LAYER_VERSION,
            phaseId: PHASE_ID,
            root: {
                requiredKeys: [
                    'bindingLayerId',
                    'recordBindingContextId',
                    'phaseId',
                    'version',
                    'sourceBundleId',
                    'sourceMacroGeographyPackageId',
                    'sourceMacroGeographyVersion',
                    'sourceHandoffPackageId',
                    'pipelineStep',
                    'bindingCatalog',
                    'recordIndexTables',
                    'primaryCarrierContextTables',
                    'secondaryContextTables',
                    'profileTargetTables',
                    'summarySurfaceTables',
                    'supportCollections',
                    'bindingMeta'
                ]
            },
            pipelineStep: cloneValue(RECORD_BINDING_PIPELINE_STEP),
            bindingTiers: cloneValue(BINDING_TIER_CATALOG),
            targetModes: cloneValue(PROFILE_TARGET_MODE_CATALOG),
            packageProfileSurfaces: cloneValue(PACKAGE_PROFILE_SURFACE_CATALOG),
            canonicalRecordBindings: getCanonicalPhase2RecordBindingDefinitions(),
            primaryCarrierRecordTypes: getPhase2PrimaryCarrierRecordTypes(),
            secondaryContextRecordTypes: getPhase2SecondaryContextRecordTypes(),
            secondaryContextPriorityRules: cloneValue(SECONDARY_CONTEXT_PRIORITY_RULES),
            nonProfileSupportCollections: cloneValue(NON_PROFILE_SUPPORT_COLLECTIONS)
        });
    }

    function buildRecordRef(definition, recordId, sourceIndex) {
        const recordRef = {
            recordType: definition.recordType,
            recordId,
            sourceIndex,
            idField: definition.idField,
            sourceGroup: definition.sourceGroup,
            sourceCollectionKey: definition.sourceCollectionKey,
            sourceCollectionPath: buildSourceCollectionPath(definition),
            sourceRecordContractId: definition.sourceRecordContractId,
            bindingTierId: definition.bindingTierId,
            targetMode: definition.targetMode,
            packageProfileSurfaceIds: definition.packageProfileSurfaceIds.slice()
        };

        if (definition.sourceRecordContractStatus) {
            recordRef.sourceRecordContractStatus = definition.sourceRecordContractStatus;
        }

        return recordRef;
    }

    function createRecordIndexEntry(bundle = {}, definition, issues = []) {
        const bundleCollections = isPlainObject(bundle.recordCollections)
            ? bundle.recordCollections
            : {};
        const groupedCollections = isPlainObject(bundleCollections[definition.sourceGroup])
            ? bundleCollections[definition.sourceGroup]
            : {};
        const collection = groupedCollections[definition.sourceCollectionKey];
        const recordRefs = [];
        const recordIds = [];
        const seenRecordIds = new Set();

        if (!Array.isArray(collection)) {
            addIssue(
                issues,
                'error',
                'missing_phase2_binding_source_collection',
                buildSourceCollectionPath(definition),
                `${buildSourceCollectionPath(definition)} must be an array before record binding can proceed.`
            );

            return deepFreeze({
                recordType: definition.recordType,
                sourceGroup: definition.sourceGroup,
                sourceCollectionKey: definition.sourceCollectionKey,
                sourceCollectionPath: buildSourceCollectionPath(definition),
                idField: definition.idField,
                sourceRecordContractId: definition.sourceRecordContractId,
                bindingTierId: definition.bindingTierId,
                targetMode: definition.targetMode,
                packageProfileSurfaceIds: definition.packageProfileSurfaceIds.slice(),
                sourceCount: 0,
                indexedCount: 0,
                skippedCount: 0,
                recordIds,
                recordRefs
            });
        }

        collection.forEach((record, sourceIndex) => {
            const issuePathPrefix = `${buildSourceCollectionPath(definition)}[${sourceIndex}]`;
            if (!isPlainObject(record)) {
                addIssue(
                    issues,
                    'error',
                    RECORD_INDEX_ERROR_INVALID_SOURCE_RECORD,
                    issuePathPrefix,
                    `${issuePathPrefix} must be an object to participate in Phase2RecordBindingLayer.`
                );
                return;
            }

            const recordId = normalizeString(record[definition.idField], '');
            if (!recordId) {
                addIssue(
                    issues,
                    'error',
                    RECORD_INDEX_ERROR_MISSING_RECORD_ID,
                    `${issuePathPrefix}.${definition.idField}`,
                    `${issuePathPrefix}.${definition.idField} is required for canonical Phase 2 record binding.`
                );
                return;
            }

            if (seenRecordIds.has(recordId)) {
                addIssue(
                    issues,
                    'error',
                    RECORD_INDEX_ERROR_DUPLICATE_RECORD_ID,
                    `${issuePathPrefix}.${definition.idField}`,
                    `Duplicate canonical record id "${recordId}" found in ${buildSourceCollectionPath(definition)}.`
                );
                return;
            }

            seenRecordIds.add(recordId);
            recordIds.push(recordId);
            recordRefs.push(buildRecordRef(definition, recordId, sourceIndex));
        });

        return deepFreeze({
            recordType: definition.recordType,
            sourceGroup: definition.sourceGroup,
            sourceCollectionKey: definition.sourceCollectionKey,
            sourceCollectionPath: buildSourceCollectionPath(definition),
            idField: definition.idField,
            sourceRecordContractId: definition.sourceRecordContractId,
            sourceRecordContractStatus: definition.sourceRecordContractStatus || null,
            bindingTierId: definition.bindingTierId,
            targetMode: definition.targetMode,
            packageProfileSurfaceIds: definition.packageProfileSurfaceIds.slice(),
            sourceCount: collection.length,
            indexedCount: recordRefs.length,
            skippedCount: Math.max(0, collection.length - recordRefs.length),
            recordIds,
            recordRefs
        });
    }

    function countIssuesByCode(issues = [], code) {
        return issues.filter((issue) => issue.code === code).length;
    }

    function createPhase2CanonicalRecordIndexTable(bundleCandidate = {}) {
        ensureCanonicalBindingDefinitionConsistency();
        if (typeof phase2.assertPhase2InputBundle === 'function') {
            phase2.assertPhase2InputBundle(bundleCandidate);
        }

        const issues = [];
        const byRecordType = {};
        const allRecordRefs = [];

        CANONICAL_RECORD_BINDING_DEFINITIONS.forEach((definition) => {
            const entry = createRecordIndexEntry(bundleCandidate, definition, issues);
            byRecordType[definition.recordType] = entry;
            allRecordRefs.push(...entry.recordRefs.map(cloneValue));
        });

        return deepFreeze({
            byRecordType,
            allRecordRefs,
            indexedRecordCount: allRecordRefs.length,
            issueCounts: {
                invalidSourceRecordCount: countIssuesByCode(issues, RECORD_INDEX_ERROR_INVALID_SOURCE_RECORD),
                missingCanonicalRecordIdCount: countIssuesByCode(issues, RECORD_INDEX_ERROR_MISSING_RECORD_ID),
                duplicateCanonicalRecordIdCount: countIssuesByCode(issues, RECORD_INDEX_ERROR_DUPLICATE_RECORD_ID)
            },
            isValid: !issues.some((issue) => issue.severity === 'error'),
            issues
        });
    }

    function getSourceCollection(bundleCandidate = {}, definition) {
        const bundleCollections = isPlainObject(bundleCandidate.recordCollections)
            ? bundleCandidate.recordCollections
            : {};
        const groupedCollections = isPlainObject(bundleCollections[definition.sourceGroup])
            ? bundleCollections[definition.sourceGroup]
            : {};
        return Array.isArray(groupedCollections[definition.sourceCollectionKey])
            ? groupedCollections[definition.sourceCollectionKey]
            : [];
    }

    function buildRecordIdSets(recordIndexTables = {}) {
        return getCanonicalPhase2RecordTypeIdsFromDefinitions().reduce((sets, recordType) => {
            const entry = isPlainObject(recordIndexTables.byRecordType)
                ? recordIndexTables.byRecordType[recordType]
                : null;
            sets[recordType] = new Set(Array.isArray(entry && entry.recordIds) ? entry.recordIds : []);
            return sets;
        }, {});
    }

    function buildDescriptorSnapshot(sourceRecord = {}, descriptorFields = {}) {
        const stringFields = Array.isArray(descriptorFields.strings)
            ? descriptorFields.strings
            : [];
        const numberFields = Array.isArray(descriptorFields.numbers)
            ? descriptorFields.numbers
            : [];
        const objectFields = Array.isArray(descriptorFields.objects)
            ? descriptorFields.objects
            : [];

        const stringSnapshot = stringFields.reduce((snapshot, fieldName) => {
            snapshot[fieldName] = normalizeString(sourceRecord[fieldName], '');
            return snapshot;
        }, {});
        const numberSnapshot = numberFields.reduce((snapshot, fieldName) => {
            snapshot[fieldName] = normalizeNumber(sourceRecord[fieldName], 0);
            return snapshot;
        }, {});
        const objectSnapshot = objectFields.reduce((snapshot, fieldName) => {
            if (isPlainObject(sourceRecord[fieldName])) {
                snapshot[fieldName] = cloneValue(sourceRecord[fieldName]);
                return snapshot;
            }

            snapshot[fieldName] = {};
            return snapshot;
        }, {});

        return {
            ...stringSnapshot,
            ...numberSnapshot,
            ...objectSnapshot
        };
    }

    function resolveCanonicalLeadRefs({
        sourceRecord = {},
        fieldMap = {},
        recordType = '',
        recordId = '',
        recordIdSets = {},
        sourcePath = '',
        issues = []
    } = {}) {
        return Object.entries(fieldMap).reduce((refs, [targetRecordType, fieldName]) => {
            const fieldPath = `${sourcePath}.${fieldName}`;
            const value = sourceRecord[fieldName];
            const normalizedValue = normalizeString(value, '');

            if (value === undefined || value === null || value === '') {
                refs[targetRecordType] = null;
                return refs;
            }

            if (!normalizedValue) {
                addIssue(
                    issues,
                    'error',
                    PRIMARY_CONTEXT_ERROR_INVALID_REFERENCE_FIELD,
                    fieldPath,
                    `${recordType}.${recordId} must use a non-empty string for canonical lead reference field "${fieldName}".`
                );
                refs[targetRecordType] = null;
                return refs;
            }

            if (!recordIdSets[targetRecordType] || !recordIdSets[targetRecordType].has(normalizedValue)) {
                addIssue(
                    issues,
                    'error',
                    PRIMARY_CONTEXT_ERROR_UNKNOWN_REFERENCE_ID,
                    fieldPath,
                    `${recordType}.${recordId} references unknown canonical ${targetRecordType} id "${normalizedValue}".`
                );
                refs[targetRecordType] = null;
                return refs;
            }

            refs[targetRecordType] = normalizedValue;
            return refs;
        }, {});
    }

    function resolveCanonicalRefLists({
        sourceRecord = {},
        fieldMap = {},
        recordType = '',
        recordId = '',
        recordIdSets = {},
        sourcePath = '',
        issues = []
    } = {}) {
        return Object.entries(fieldMap).reduce((refs, [targetRecordType, fieldName]) => {
            const fieldPath = `${sourcePath}.${fieldName}`;
            const value = sourceRecord[fieldName];

            if (value === undefined || value === null) {
                refs[targetRecordType] = [];
                return refs;
            }

            if (!Array.isArray(value)) {
                addIssue(
                    issues,
                    'error',
                    PRIMARY_CONTEXT_ERROR_INVALID_REFERENCE_FIELD,
                    fieldPath,
                    `${recordType}.${recordId} must use an array for canonical reference field "${fieldName}".`
                );
                refs[targetRecordType] = [];
                return refs;
            }

            const normalizedIds = uniqueStrings(value);
            refs[targetRecordType] = normalizedIds.filter((linkedRecordId) => {
                const knownIds = recordIdSets[targetRecordType];
                if (!knownIds || !knownIds.has(linkedRecordId)) {
                    addIssue(
                        issues,
                        'error',
                        PRIMARY_CONTEXT_ERROR_UNKNOWN_REFERENCE_ID,
                        fieldPath,
                        `${recordType}.${recordId} references unknown canonical ${targetRecordType} id "${linkedRecordId}".`
                    );
                    return false;
                }

                return true;
            });
            return refs;
        }, {});
    }

    function countLinkedRefs(refs = {}) {
        return Object.values(refs).reduce((count, value) => {
            if (Array.isArray(value)) {
                return count + value.length;
            }

            return value ? count + 1 : count;
        }, 0);
    }

    function buildPrimaryCarrierContextEntry({
        sourceRecord = {},
        recordRef = {},
        definition,
        recordIdSets = {},
        issues = []
    } = {}) {
        const recordType = definition.recordType;
        const recordId = normalizeString(recordRef.recordId, '');
        const sourcePath = `${buildSourceCollectionPath(definition)}[${recordRef.sourceIndex}]`;
        const config = PRIMARY_CARRIER_CONTEXT_CONFIG[recordType] || {};
        const primaryCarrierLeadRefs = resolveCanonicalLeadRefs({
            sourceRecord,
            fieldMap: config.primaryCarrierLeadRefs || {},
            recordType,
            recordId,
            recordIdSets,
            sourcePath,
            issues
        });
        const primaryCarrierRefs = resolveCanonicalRefLists({
            sourceRecord,
            fieldMap: config.primaryCarrierRefs || {},
            recordType,
            recordId,
            recordIdSets,
            sourcePath,
            issues
        });
        const secondaryContextRefs = resolveCanonicalRefLists({
            sourceRecord,
            fieldMap: config.secondaryContextRefs || {},
            recordType,
            recordId,
            recordIdSets,
            sourcePath,
            issues
        });

        return deepFreeze({
            recordType,
            recordId,
            sourceIndex: Number(recordRef.sourceIndex) || 0,
            sourceCollectionPath: buildSourceCollectionPath(definition),
            sourceRecordContractId: definition.sourceRecordContractId,
            bindingTierId: definition.bindingTierId,
            targetMode: definition.targetMode,
            packageProfileSurfaceIds: definition.packageProfileSurfaceIds.slice(),
            sourceDescriptorSnapshot: buildDescriptorSnapshot(
                sourceRecord,
                config.descriptorFields || {}
            ),
            primaryCarrierLeadRefs,
            primaryCarrierRefs,
            secondaryContextRefs,
            contextRefCounts: {
                primaryCarrierLeadRefCount: countLinkedRefs(primaryCarrierLeadRefs),
                primaryCarrierRefCount: countLinkedRefs(primaryCarrierRefs),
                secondaryContextRefCount: countLinkedRefs(secondaryContextRefs)
            }
        });
    }

    function createPrimaryCarrierContextTableEntry(bundleCandidate = {}, definition, recordIndexTables = {}, issues = []) {
        const recordIndexEntry = isPlainObject(recordIndexTables.byRecordType)
            ? recordIndexTables.byRecordType[definition.recordType]
            : null;
        const sourceCollection = getSourceCollection(bundleCandidate, definition);
        const recordIdSets = buildRecordIdSets(recordIndexTables);
        const byRecordId = {};

        const recordRefs = Array.isArray(recordIndexEntry && recordIndexEntry.recordRefs)
            ? recordIndexEntry.recordRefs
            : [];

        recordRefs.forEach((recordRef) => {
            const sourceRecord = sourceCollection[recordRef.sourceIndex];
            if (!isPlainObject(sourceRecord)) {
                addIssue(
                    issues,
                    'error',
                    PRIMARY_CONTEXT_ERROR_MISSING_CONTEXT_ENTRY,
                    `${buildSourceCollectionPath(definition)}[${recordRef.sourceIndex}]`,
                    `${definition.recordType} source record is missing while building primary carrier context tables.`
                );
                return;
            }

            byRecordId[recordRef.recordId] = buildPrimaryCarrierContextEntry({
                sourceRecord,
                recordRef,
                definition,
                recordIdSets,
                issues
            });
        });

        const recordIds = Array.isArray(recordIndexEntry && recordIndexEntry.recordIds)
            ? recordIndexEntry.recordIds.slice()
            : [];

        return deepFreeze({
            recordType: definition.recordType,
            contextTableId: `phase2-primary-carrier-context:${definition.recordType}`,
            sourceCollectionPath: buildSourceCollectionPath(definition),
            idField: definition.idField,
            bindingTierId: definition.bindingTierId,
            targetMode: definition.targetMode,
            indexedRecordCount: recordIds.length,
            recordIds,
            byRecordId
        });
    }

    function createPhase2PrimaryCarrierContextTables(bundleCandidate = {}, recordIndexTables = null) {
        ensureCanonicalBindingDefinitionConsistency();
        if (typeof phase2.assertPhase2InputBundle === 'function') {
            phase2.assertPhase2InputBundle(bundleCandidate);
        }

        const resolvedRecordIndexTables = recordIndexTables || createPhase2CanonicalRecordIndexTable(bundleCandidate);
        const issues = [];
        const byRecordType = {};

        PRIMARY_CARRIER_RECORD_TYPES.forEach((recordType) => {
            const definition = getBindingDefinition(recordType);
            byRecordType[recordType] = createPrimaryCarrierContextTableEntry(
                bundleCandidate,
                definition,
                resolvedRecordIndexTables,
                issues
            );
        });

        const boundRecordCount = PRIMARY_CARRIER_RECORD_TYPES.reduce((count, recordType) => {
            const table = byRecordType[recordType];
            return count + (Number(table && table.indexedRecordCount) || 0);
        }, 0);

        return deepFreeze({
            recordTypes: getPhase2PrimaryCarrierRecordTypes(),
            byRecordType,
            boundRecordCount,
            issueCounts: {
                invalidReferenceFieldCount: countIssuesByCode(issues, PRIMARY_CONTEXT_ERROR_INVALID_REFERENCE_FIELD),
                unknownReferenceIdCount: countIssuesByCode(issues, PRIMARY_CONTEXT_ERROR_UNKNOWN_REFERENCE_ID),
                missingContextEntryCount: countIssuesByCode(issues, PRIMARY_CONTEXT_ERROR_MISSING_CONTEXT_ENTRY)
            },
            isValid: !issues.some((issue) => issue.severity === 'error'),
            issues
        });
    }

    function isPrimaryCarrierRecordType(recordType) {
        return PRIMARY_CARRIER_RECORD_TYPES.includes(recordType);
    }

    function isSecondaryContextRecordType(recordType) {
        return SECONDARY_CONTEXT_RECORD_TYPES.includes(recordType);
    }

    function buildRecordIdentityIndex(recordIndexTables = {}) {
        const byRecordId = {};

        getCanonicalPhase2RecordTypeIdsFromDefinitions().forEach((recordType) => {
            const entry = isPlainObject(recordIndexTables.byRecordType)
                ? recordIndexTables.byRecordType[recordType]
                : null;
            const recordIds = Array.isArray(entry && entry.recordIds)
                ? entry.recordIds
                : [];

            recordIds.forEach((recordId) => {
                if (!byRecordId[recordId]) {
                    byRecordId[recordId] = [];
                }

                byRecordId[recordId].push(recordType);
            });
        });

        return byRecordId;
    }

    function createEmptyResolvedRefBuckets() {
        return {
            primaryCarrierRefs: {},
            secondaryContextRefs: {},
            orderedRefs: []
        };
    }

    function appendResolvedRef(bucket, recordType, recordId) {
        const targetGroup = isPrimaryCarrierRecordType(recordType)
            ? bucket.primaryCarrierRefs
            : bucket.secondaryContextRefs;

        if (!Array.isArray(targetGroup[recordType])) {
            targetGroup[recordType] = [];
        }

        if (!targetGroup[recordType].includes(recordId)) {
            targetGroup[recordType].push(recordId);
        }

        if (!bucket.orderedRefs.some((entry) => (
            entry.recordType === recordType && entry.recordId === recordId
        ))) {
            bucket.orderedRefs.push({
                recordType,
                recordId,
                contextPriority: isPrimaryCarrierRecordType(recordType)
                    ? 'primaryCarrier'
                    : 'secondaryContext'
            });
        }
    }

    function resolveSecondaryMixedRefs({
        sourceRecord = {},
        fieldName = '',
        expectsArray = false,
        recordType = '',
        recordId = '',
        recordIdentityIndex = {},
        sourcePath = '',
        issues = []
    } = {}) {
        const bucket = createEmptyResolvedRefBuckets();
        const fieldPath = `${sourcePath}.${fieldName}`;
        const rawValue = sourceRecord[fieldName];

        if (rawValue === undefined || rawValue === null || rawValue === '') {
            return bucket;
        }

        const rawValues = expectsArray
            ? rawValue
            : [rawValue];

        if (expectsArray && !Array.isArray(rawValue)) {
            addIssue(
                issues,
                'error',
                SECONDARY_CONTEXT_ERROR_INVALID_REFERENCE_FIELD,
                fieldPath,
                `${recordType}.${recordId} must use an array for secondary-context field "${fieldName}".`
            );
            return bucket;
        }

        if (!expectsArray && Array.isArray(rawValue)) {
            addIssue(
                issues,
                'error',
                SECONDARY_CONTEXT_ERROR_INVALID_REFERENCE_FIELD,
                fieldPath,
                `${recordType}.${recordId} must use a non-empty string for secondary-context field "${fieldName}".`
            );
            return bucket;
        }

        uniqueStrings(rawValues).forEach((linkedRecordId) => {
            const resolvedRecordTypes = Array.isArray(recordIdentityIndex[linkedRecordId])
                ? recordIdentityIndex[linkedRecordId].slice()
                : [];

            if (!resolvedRecordTypes.length) {
                addIssue(
                    issues,
                    'error',
                    SECONDARY_CONTEXT_ERROR_UNKNOWN_REFERENCE_ID,
                    fieldPath,
                    `${recordType}.${recordId} references unknown canonical record id "${linkedRecordId}".`
                );
                return;
            }

            if (resolvedRecordTypes.length > 1) {
                addIssue(
                    issues,
                    'error',
                    SECONDARY_CONTEXT_ERROR_AMBIGUOUS_REFERENCE_ID,
                    fieldPath,
                    `${recordType}.${recordId} references ambiguous canonical record id "${linkedRecordId}" across: ${resolvedRecordTypes.join(', ')}.`
                );
                return;
            }

            appendResolvedRef(bucket, resolvedRecordTypes[0], linkedRecordId);
        });

        return bucket;
    }

    function countMixedCanonicalRefs(mixedCanonicalRefs = {}) {
        return Object.values(mixedCanonicalRefs).reduce((count, bucket) => {
            if (!isPlainObject(bucket) || !Array.isArray(bucket.orderedRefs)) {
                return count;
            }

            return count + bucket.orderedRefs.length;
        }, 0);
    }

    function buildSecondaryContextEntry({
        sourceRecord = {},
        recordRef = {},
        definition,
        recordIdSets = {},
        recordIdentityIndex = {},
        issues = []
    } = {}) {
        const recordType = definition.recordType;
        const recordId = normalizeString(recordRef.recordId, '');
        const sourcePath = `${buildSourceCollectionPath(definition)}[${recordRef.sourceIndex}]`;
        const config = SECONDARY_CONTEXT_CONFIG[recordType] || {};
        const primaryCarrierLeadRefs = resolveCanonicalLeadRefs({
            sourceRecord,
            fieldMap: config.primaryCarrierLeadRefs || {},
            recordType,
            recordId,
            recordIdSets,
            sourcePath,
            issues
        });
        const primaryCarrierRefs = resolveCanonicalRefLists({
            sourceRecord,
            fieldMap: config.primaryCarrierRefs || {},
            recordType,
            recordId,
            recordIdSets,
            sourcePath,
            issues
        });
        const secondaryContextRefs = resolveCanonicalRefLists({
            sourceRecord,
            fieldMap: config.secondaryContextRefs || {},
            recordType,
            recordId,
            recordIdSets,
            sourcePath,
            issues
        });
        const mixedCanonicalRefs = {};

        (config.mixedLeadRefFields || []).forEach((fieldName) => {
            mixedCanonicalRefs[fieldName] = resolveSecondaryMixedRefs({
                sourceRecord,
                fieldName,
                expectsArray: false,
                recordType,
                recordId,
                recordIdentityIndex,
                sourcePath,
                issues
            });
        });

        (config.mixedArrayRefFields || []).forEach((fieldName) => {
            mixedCanonicalRefs[fieldName] = resolveSecondaryMixedRefs({
                sourceRecord,
                fieldName,
                expectsArray: true,
                recordType,
                recordId,
                recordIdentityIndex,
                sourcePath,
                issues
            });
        });

        return deepFreeze({
            recordType,
            recordId,
            sourceIndex: Number(recordRef.sourceIndex) || 0,
            sourceCollectionPath: buildSourceCollectionPath(definition),
            sourceRecordContractId: definition.sourceRecordContractId,
            sourceRecordContractStatus: definition.sourceRecordContractStatus || null,
            bindingTierId: definition.bindingTierId,
            targetMode: definition.targetMode,
            packageProfileSurfaceIds: definition.packageProfileSurfaceIds.slice(),
            contextPriority: 'secondaryContext',
            primaryTruthSource: SECONDARY_CONTEXT_PRIORITY_RULES.primaryTruthSource,
            mayOverridePrimaryTruth: false,
            sourceDescriptorSnapshot: buildDescriptorSnapshot(
                sourceRecord,
                config.descriptorFields || {}
            ),
            primaryCarrierLeadRefs,
            primaryCarrierRefs,
            secondaryContextRefs,
            mixedCanonicalRefs: deepFreeze(mixedCanonicalRefs),
            secondarySemanticExclusions: Array.isArray(config.excludedSemanticFields)
                ? config.excludedSemanticFields.slice()
                : [],
            contextRefCounts: {
                primaryCarrierLeadRefCount: countLinkedRefs(primaryCarrierLeadRefs),
                primaryCarrierRefCount: countLinkedRefs(primaryCarrierRefs),
                secondaryContextRefCount: countLinkedRefs(secondaryContextRefs),
                mixedCanonicalRefCount: countMixedCanonicalRefs(mixedCanonicalRefs)
            }
        });
    }

    function createSecondaryContextTableEntry(bundleCandidate = {}, definition, recordIndexTables = {}, issues = []) {
        const recordIndexEntry = isPlainObject(recordIndexTables.byRecordType)
            ? recordIndexTables.byRecordType[definition.recordType]
            : null;
        const sourceCollection = getSourceCollection(bundleCandidate, definition);
        const recordIdSets = buildRecordIdSets(recordIndexTables);
        const recordIdentityIndex = buildRecordIdentityIndex(recordIndexTables);
        const byRecordId = {};

        const recordRefs = Array.isArray(recordIndexEntry && recordIndexEntry.recordRefs)
            ? recordIndexEntry.recordRefs
            : [];

        recordRefs.forEach((recordRef) => {
            const sourceRecord = sourceCollection[recordRef.sourceIndex];
            if (!isPlainObject(sourceRecord)) {
                addIssue(
                    issues,
                    'error',
                    SECONDARY_CONTEXT_ERROR_MISSING_CONTEXT_ENTRY,
                    `${buildSourceCollectionPath(definition)}[${recordRef.sourceIndex}]`,
                    `${definition.recordType} source record is missing while building secondary context tables.`
                );
                return;
            }

            byRecordId[recordRef.recordId] = buildSecondaryContextEntry({
                sourceRecord,
                recordRef,
                definition,
                recordIdSets,
                recordIdentityIndex,
                issues
            });
        });

        const recordIds = Array.isArray(recordIndexEntry && recordIndexEntry.recordIds)
            ? recordIndexEntry.recordIds.slice()
            : [];

        return deepFreeze({
            recordType: definition.recordType,
            contextTableId: `phase2-secondary-context:${definition.recordType}`,
            sourceCollectionPath: buildSourceCollectionPath(definition),
            idField: definition.idField,
            bindingTierId: definition.bindingTierId,
            targetMode: definition.targetMode,
            indexedRecordCount: recordIds.length,
            recordIds,
            byRecordId
        });
    }

    function createPhase2SecondaryContextTables(bundleCandidate = {}, recordIndexTables = null) {
        ensureCanonicalBindingDefinitionConsistency();
        if (typeof phase2.assertPhase2InputBundle === 'function') {
            phase2.assertPhase2InputBundle(bundleCandidate);
        }

        const resolvedRecordIndexTables = recordIndexTables || createPhase2CanonicalRecordIndexTable(bundleCandidate);
        const issues = [];
        const byRecordType = {};

        SECONDARY_CONTEXT_RECORD_TYPES.forEach((recordType) => {
            const definition = getBindingDefinition(recordType);
            byRecordType[recordType] = createSecondaryContextTableEntry(
                bundleCandidate,
                definition,
                resolvedRecordIndexTables,
                issues
            );
        });

        const boundRecordCount = SECONDARY_CONTEXT_RECORD_TYPES.reduce((count, recordType) => {
            const table = byRecordType[recordType];
            return count + (Number(table && table.indexedRecordCount) || 0);
        }, 0);

        return deepFreeze({
            recordTypes: getPhase2SecondaryContextRecordTypes(),
            derivativeStructuralRecordTypes: SECONDARY_DERIVATIVE_STRUCTURAL_RECORD_TYPES.slice(),
            broaderContextRecordTypes: SECONDARY_BROADER_CONTEXT_RECORD_TYPES.slice(),
            priorityRules: cloneValue(SECONDARY_CONTEXT_PRIORITY_RULES),
            byRecordType,
            boundRecordCount,
            issueCounts: {
                invalidReferenceFieldCount: countIssuesByCode(issues, SECONDARY_CONTEXT_ERROR_INVALID_REFERENCE_FIELD),
                unknownReferenceIdCount: countIssuesByCode(issues, SECONDARY_CONTEXT_ERROR_UNKNOWN_REFERENCE_ID),
                ambiguousReferenceIdCount: countIssuesByCode(issues, SECONDARY_CONTEXT_ERROR_AMBIGUOUS_REFERENCE_ID),
                missingContextEntryCount: countIssuesByCode(issues, SECONDARY_CONTEXT_ERROR_MISSING_CONTEXT_ENTRY)
            },
            isValid: !issues.some((issue) => issue.severity === 'error'),
            issues
        });
    }

    function buildRecordIdsByType(recordTypes = [], recordIndexTables = {}) {
        return recordTypes.reduce((recordIdsByType, recordType) => {
            const entry = isPlainObject(recordIndexTables.byRecordType)
                ? recordIndexTables.byRecordType[recordType]
                : null;

            recordIdsByType[recordType] = Array.isArray(entry && entry.recordIds)
                ? entry.recordIds.slice()
                : [];
            return recordIdsByType;
        }, {});
    }

    function getRecordTypesForTargetMode(targetMode) {
        return CANONICAL_RECORD_BINDING_DEFINITIONS
            .filter((definition) => definition.targetMode === targetMode)
            .map((definition) => definition.recordType);
    }

    function buildProfileTargetTables(recordIndexTables = {}) {
        const byRecordType = CANONICAL_RECORD_BINDING_DEFINITIONS.reduce((profileTargets, definition) => {
            const recordIndexEntry = isPlainObject(recordIndexTables.byRecordType)
                ? recordIndexTables.byRecordType[definition.recordType]
                : null;

            profileTargets[definition.recordType] = {
                recordType: definition.recordType,
                bindingTierId: definition.bindingTierId,
                targetMode: definition.targetMode,
                packageProfileSurfaceIds: definition.packageProfileSurfaceIds.slice(),
                indexedRecordCount: Number(recordIndexEntry && recordIndexEntry.indexedCount) || 0,
                recordIds: Array.isArray(recordIndexEntry && recordIndexEntry.recordIds)
                    ? recordIndexEntry.recordIds.slice()
                    : [],
                sourceCollectionPath: buildSourceCollectionPath(definition),
                description: definition.description
            };

            return profileTargets;
        }, {});
        const byPackageProfileSurface = Object.values(PACKAGE_PROFILE_SURFACE_CATALOG).reduce((surfaces, surface) => {
            const recordTypes = CANONICAL_RECORD_BINDING_DEFINITIONS
                .filter((definition) => definition.packageProfileSurfaceIds.includes(surface.surfaceId))
                .map((definition) => definition.recordType);

            surfaces[surface.surfaceId] = {
                surfaceId: surface.surfaceId,
                packageContractId: surface.packageContractId,
                targetPath: surface.targetPath,
                signalDomain: surface.signalDomain,
                reservedSignalDomain: surface.reservedSignalDomain,
                recordTypes,
                recordIdsByType: buildRecordIdsByType(recordTypes, recordIndexTables)
            };

            return surfaces;
        }, {});
        const byTargetMode = Object.values(PROFILE_TARGET_MODE_CATALOG).reduce((targetModes, targetMode) => {
            const recordTypes = getRecordTypesForTargetMode(targetMode.id);
            targetModes[targetMode.id] = {
                targetMode: targetMode.id,
                recordTypes,
                recordIdsByType: buildRecordIdsByType(recordTypes, recordIndexTables)
            };
            return targetModes;
        }, {});

        return deepFreeze({
            byRecordType,
            byPackageProfileSurface,
            byTargetMode
        });
    }

    function buildSummarySurfaceTables(recordIndexTables = {}) {
        const directRecordTypes = getRecordTypesForTargetMode(TARGET_MODE_DIRECT_RECORD_PROFILE);
        const derivativeRecordTypes = getRecordTypesForTargetMode(TARGET_MODE_DERIVATIVE_RECORD_PROFILE);
        const contextRecordTypes = getRecordTypesForTargetMode(TARGET_MODE_SUMMARY_CONTEXT);

        return deepFreeze({
            perRecord: {
                directRecordProfiles: {
                    targetMode: TARGET_MODE_DIRECT_RECORD_PROFILE,
                    recordTypes: directRecordTypes,
                    recordIdsByType: buildRecordIdsByType(directRecordTypes, recordIndexTables)
                },
                derivativeRecordProfiles: {
                    targetMode: TARGET_MODE_DERIVATIVE_RECORD_PROFILE,
                    recordTypes: derivativeRecordTypes,
                    recordIdsByType: buildRecordIdsByType(derivativeRecordTypes, recordIndexTables)
                }
            },
            perRegion: {
                summaryContextGroups: {
                    targetMode: TARGET_MODE_SUMMARY_CONTEXT,
                    recordTypes: contextRecordTypes,
                    recordIdsByType: buildRecordIdsByType(contextRecordTypes, recordIndexTables)
                }
            }
        });
    }

    function buildSupportCollectionTable(bundleCandidate = {}) {
        const bundleCollections = isPlainObject(bundleCandidate.recordCollections)
            ? bundleCandidate.recordCollections
            : {};

        return deepFreeze({
            nonProfileCollections: NON_PROFILE_SUPPORT_COLLECTIONS.map((supportCollection) => {
                const groupedCollections = isPlainObject(bundleCollections[supportCollection.sourceGroup])
                    ? bundleCollections[supportCollection.sourceGroup]
                    : {};
                const collection = groupedCollections[supportCollection.collectionKey];

                return {
                    collectionKey: supportCollection.collectionKey,
                    sourceGroup: supportCollection.sourceGroup,
                    sourceCollectionPath: supportCollection.sourceCollectionPath,
                    count: Array.isArray(collection) ? collection.length : 0,
                    description: supportCollection.description
                };
            })
        });
    }

    function createBindingCatalog() {
        return deepFreeze({
            canonicalRecordTypes: getCanonicalPhase2RecordTypeIdsFromDefinitions(),
            primaryCarrierRecordTypes: getPhase2PrimaryCarrierRecordTypes(),
            secondaryContextRecordTypes: getPhase2SecondaryContextRecordTypes(),
            bindingTiers: getPhase2CanonicalBindingTierCatalog(),
            targetModes: cloneValue(PROFILE_TARGET_MODE_CATALOG),
            packageProfileSurfaces: cloneValue(PACKAGE_PROFILE_SURFACE_CATALOG),
            secondaryContextPriorityRules: cloneValue(SECONDARY_CONTEXT_PRIORITY_RULES),
            recordBindings: getCanonicalPhase2RecordBindingDefinitions()
        });
    }

    function createPhase2RecordBindingLayer(bundleCandidate = {}) {
        ensureCanonicalBindingDefinitionConsistency();
        if (typeof phase2.assertPhase2InputBundle === 'function') {
            phase2.assertPhase2InputBundle(bundleCandidate);
        }

        const recordIndexTables = createPhase2CanonicalRecordIndexTable(bundleCandidate);
        const primaryCarrierContextTables = createPhase2PrimaryCarrierContextTables(
            bundleCandidate,
            recordIndexTables
        );
        const secondaryContextTables = createPhase2SecondaryContextTables(
            bundleCandidate,
            recordIndexTables
        );
        const supportCollections = buildSupportCollectionTable(bundleCandidate);
        const bindingLayerId = createBindingLayerId(bundleCandidate);

        return deepFreeze({
            bindingLayerId,
            recordBindingContextId: bindingLayerId,
            phaseId: PHASE_ID,
            version: RECORD_BINDING_LAYER_VERSION,
            sourceBundleId: normalizeString(bundleCandidate.bundleId, ''),
            sourceMacroGeographyPackageId: normalizeString(bundleCandidate.sourceMacroGeographyPackageId, ''),
            sourceMacroGeographyVersion: normalizeString(bundleCandidate.sourceMacroGeographyVersion, ''),
            sourceHandoffPackageId: normalizeString(
                bundleCandidate.filteredHandoff && bundleCandidate.filteredHandoff.sourceHandoffPackageId,
                ''
            ) || null,
            pipelineStep: getPhase2RecordBindingPipelineStep(),
            bindingCatalog: createBindingCatalog(),
            recordIndexTables,
            primaryCarrierContextTables,
            secondaryContextTables,
            profileTargetTables: buildProfileTargetTables(recordIndexTables),
            summarySurfaceTables: buildSummarySurfaceTables(recordIndexTables),
            supportCollections,
            bindingMeta: {
                contractFirst: true,
                inventsRecordIds: false,
                crossRecordProjectionImplemented: false,
                perRecordEnvironmentalContextImplemented: (
                    primaryCarrierContextTables.isValid === true
                    && secondaryContextTables.isValid === true
                ),
                profileTargetScaffoldPrepared: true,
                summarySurfaceScaffoldPrepared: true,
                primaryCarrierBindingImplemented: primaryCarrierContextTables.isValid === true,
                primaryCarrierPerRecordContextImplemented: primaryCarrierContextTables.isValid === true,
                structuralCarrierBindingImplemented: secondaryContextTables.isValid === true,
                contextGroupingBindingImplemented: secondaryContextTables.isValid === true,
                secondaryContextBindingImplemented: secondaryContextTables.isValid === true,
                secondaryPriorityRulesPreserved: secondaryContextTables.priorityRules
                    && secondaryContextTables.priorityRules.secondaryMayOverridePrimaryTruth === false,
                nonProfileSupportCollections: getPhase2NonProfileSupportCollectionKeys(),
                recordIndexValid: recordIndexTables.isValid === true,
                recordIndexIssueCounts: cloneValue(recordIndexTables.issueCounts),
                primaryCarrierIssueCounts: cloneValue(primaryCarrierContextTables.issueCounts),
                secondaryContextIssueCounts: cloneValue(secondaryContextTables.issueCounts)
            }
        });
    }

    function compareNormalizedStringSets(actualValues = [], expectedValues = []) {
        const normalizedActualValues = actualValues
            .map((value) => normalizeString(value, ''))
            .filter(Boolean)
            .sort();
        const normalizedExpectedValues = expectedValues
            .map((value) => normalizeString(value, ''))
            .filter(Boolean)
            .sort();

        return normalizedActualValues.join('|') === normalizedExpectedValues.join('|');
    }

    function validateSecondaryPriorityRules(priorityRules, pathPrefix, issues = []) {
        if (!isPlainObject(priorityRules)) {
            addIssue(
                issues,
                'error',
                'missing_phase2_secondary_context_priority_rules',
                pathPrefix,
                `${pathPrefix} must be an object.`
            );
            return;
        }

        if (normalizeString(priorityRules.primaryTruthSource, '') !== SECONDARY_CONTEXT_PRIORITY_RULES.primaryTruthSource) {
            addIssue(
                issues,
                'error',
                'invalid_phase2_secondary_context_primary_truth_source',
                `${pathPrefix}.primaryTruthSource`,
                `${pathPrefix}.primaryTruthSource must equal "${SECONDARY_CONTEXT_PRIORITY_RULES.primaryTruthSource}".`
            );
        }

        [
            ['primaryCarrierRecordTypes', getPhase2PrimaryCarrierRecordTypes()],
            ['secondaryContextRecordTypes', getPhase2SecondaryContextRecordTypes()],
            ['derivativeStructuralRecordTypes', SECONDARY_DERIVATIVE_STRUCTURAL_RECORD_TYPES],
            ['broaderContextRecordTypes', SECONDARY_BROADER_CONTEXT_RECORD_TYPES]
        ].forEach(([key, expectedRecordTypes]) => {
            if (!Array.isArray(priorityRules[key])) {
                addIssue(
                    issues,
                    'error',
                    'invalid_phase2_secondary_context_priority_rule_record_types',
                    `${pathPrefix}.${key}`,
                    `${pathPrefix}.${key} must be an array.`
                );
                return;
            }

            if (!compareNormalizedStringSets(priorityRules[key], expectedRecordTypes)) {
                addIssue(
                    issues,
                    'error',
                    'invalid_phase2_secondary_context_priority_rule_record_type_set',
                    `${pathPrefix}.${key}`,
                    `${pathPrefix}.${key} must equal: ${expectedRecordTypes.join(', ')}.`
                );
            }
        });

        if (priorityRules.secondaryMayOverridePrimaryTruth !== false) {
            addIssue(
                issues,
                'error',
                'invalid_phase2_secondary_context_override_rule',
                `${pathPrefix}.secondaryMayOverridePrimaryTruth`,
                `${pathPrefix}.secondaryMayOverridePrimaryTruth must remain false so secondary context never overrides primary truth.`
            );
        }
    }

    function validatePhase2RecordBindingLayer(bindingLayerCandidate = {}) {
        const issues = [];
        const contract = getPhase2RecordBindingLayerContract();
        const recordIndexTables = bindingLayerCandidate.recordIndexTables;
        const recordIndexByRecordType = (
            isPlainObject(recordIndexTables)
            && isPlainObject(recordIndexTables.byRecordType)
        )
            ? recordIndexTables.byRecordType
            : {};

        contract.root.requiredKeys.forEach((key) => {
            if (!hasOwn(bindingLayerCandidate, key)) {
                addIssue(
                    issues,
                    'error',
                    'missing_phase2_record_binding_layer_key',
                    `phase2RecordBindingLayer.${key}`,
                    `Phase2RecordBindingLayer requires root key "${key}".`
                );
            }
        });

        if (normalizeString(bindingLayerCandidate.phaseId, '') !== PHASE_ID) {
            addIssue(
                issues,
                'error',
                'invalid_phase2_record_binding_phase_id',
                'phase2RecordBindingLayer.phaseId',
                `Phase2RecordBindingLayer.phaseId must equal "${PHASE_ID}".`
            );
        }

        if (normalizeString(bindingLayerCandidate.version, '') !== RECORD_BINDING_LAYER_VERSION) {
            addIssue(
                issues,
                'error',
                'invalid_phase2_record_binding_version',
                'phase2RecordBindingLayer.version',
                `Phase2RecordBindingLayer.version must equal "${RECORD_BINDING_LAYER_VERSION}".`
            );
        }

        if (!isPlainObject(bindingLayerCandidate.pipelineStep)) {
            addIssue(
                issues,
                'error',
                'missing_phase2_record_binding_pipeline_step',
                'phase2RecordBindingLayer.pipelineStep',
                'Phase2RecordBindingLayer.pipelineStep must be an object.'
            );
        } else {
            if (normalizeString(bindingLayerCandidate.pipelineStep.stepId, '') !== RECORD_BINDING_PIPELINE_STEP_ID) {
                addIssue(
                    issues,
                    'error',
                    'invalid_phase2_record_binding_pipeline_step_id',
                    'phase2RecordBindingLayer.pipelineStep.stepId',
                    `Phase2RecordBindingLayer.pipelineStep.stepId must equal "${RECORD_BINDING_PIPELINE_STEP_ID}".`
                );
            }

            if (bindingLayerCandidate.pipelineStep.implementsFieldLogic !== false) {
                addIssue(
                    issues,
                    'error',
                    'invalid_phase2_record_binding_pipeline_field_logic',
                    'phase2RecordBindingLayer.pipelineStep.implementsFieldLogic',
                    'Phase2RecordBindingLayer scaffold must not claim field logic implementation.'
                );
            }
        }

        if (!isPlainObject(bindingLayerCandidate.bindingCatalog)) {
            addIssue(
                issues,
                'error',
                'missing_phase2_binding_catalog',
                'phase2RecordBindingLayer.bindingCatalog',
                'Phase2RecordBindingLayer.bindingCatalog must be an object.'
            );
        } else {
            const bindingCatalog = bindingLayerCandidate.bindingCatalog;
            const expectedRecordTypes = getCanonicalPhase2RecordTypeIdsFromDefinitions();
            const expectedPrimaryRecordTypes = getPhase2PrimaryCarrierRecordTypes();
            const expectedSecondaryRecordTypes = getPhase2SecondaryContextRecordTypes();

            if (!Array.isArray(bindingCatalog.canonicalRecordTypes)) {
                addIssue(
                    issues,
                    'error',
                    'invalid_phase2_binding_catalog_record_types',
                    'phase2RecordBindingLayer.bindingCatalog.canonicalRecordTypes',
                    'Phase2RecordBindingLayer.bindingCatalog.canonicalRecordTypes must be an array.'
                );
            } else if (!compareNormalizedStringSets(bindingCatalog.canonicalRecordTypes, expectedRecordTypes)) {
                addIssue(
                    issues,
                    'error',
                    'invalid_phase2_binding_catalog_canonical_types',
                    'phase2RecordBindingLayer.bindingCatalog.canonicalRecordTypes',
                    `Phase2RecordBindingLayer.bindingCatalog.canonicalRecordTypes must equal: ${expectedRecordTypes.join(', ')}.`
                );
            }

            if (!Array.isArray(bindingCatalog.primaryCarrierRecordTypes)) {
                addIssue(
                    issues,
                    'error',
                    'invalid_phase2_binding_catalog_primary_carrier_types',
                    'phase2RecordBindingLayer.bindingCatalog.primaryCarrierRecordTypes',
                    'Phase2RecordBindingLayer.bindingCatalog.primaryCarrierRecordTypes must be an array.'
                );
            } else if (!compareNormalizedStringSets(bindingCatalog.primaryCarrierRecordTypes, expectedPrimaryRecordTypes)) {
                addIssue(
                    issues,
                    'error',
                    'invalid_phase2_binding_catalog_primary_carrier_type_set',
                    'phase2RecordBindingLayer.bindingCatalog.primaryCarrierRecordTypes',
                    `Phase2RecordBindingLayer.bindingCatalog.primaryCarrierRecordTypes must equal: ${expectedPrimaryRecordTypes.join(', ')}.`
                );
            }

            if (!Array.isArray(bindingCatalog.secondaryContextRecordTypes)) {
                addIssue(
                    issues,
                    'error',
                    'invalid_phase2_binding_catalog_secondary_context_types',
                    'phase2RecordBindingLayer.bindingCatalog.secondaryContextRecordTypes',
                    'Phase2RecordBindingLayer.bindingCatalog.secondaryContextRecordTypes must be an array.'
                );
            } else if (!compareNormalizedStringSets(bindingCatalog.secondaryContextRecordTypes, expectedSecondaryRecordTypes)) {
                addIssue(
                    issues,
                    'error',
                    'invalid_phase2_binding_catalog_secondary_context_type_set',
                    'phase2RecordBindingLayer.bindingCatalog.secondaryContextRecordTypes',
                    `Phase2RecordBindingLayer.bindingCatalog.secondaryContextRecordTypes must equal: ${expectedSecondaryRecordTypes.join(', ')}.`
                );
            }

            validateSecondaryPriorityRules(
                bindingCatalog.secondaryContextPriorityRules,
                'phase2RecordBindingLayer.bindingCatalog.secondaryContextPriorityRules',
                issues
            );
        }

        if (!isPlainObject(recordIndexTables)) {
            addIssue(
                issues,
                'error',
                'missing_phase2_record_index_tables',
                'phase2RecordBindingLayer.recordIndexTables',
                'Phase2RecordBindingLayer.recordIndexTables must be an object.'
            );
        } else {
            if (!isPlainObject(recordIndexTables.byRecordType)) {
                addIssue(
                    issues,
                    'error',
                    'missing_phase2_record_index_tables_by_record_type',
                    'phase2RecordBindingLayer.recordIndexTables.byRecordType',
                    'Phase2RecordBindingLayer.recordIndexTables.byRecordType must be an object.'
                );
            } else {
                getCanonicalPhase2RecordTypeIdsFromDefinitions().forEach((recordType) => {
                    const definition = getBindingDefinition(recordType);
                    const entry = recordIndexTables.byRecordType[recordType];

                    if (!isPlainObject(entry)) {
                        addIssue(
                            issues,
                            'error',
                            'missing_phase2_record_index_entry',
                            `phase2RecordBindingLayer.recordIndexTables.byRecordType.${recordType}`,
                            `Phase2RecordBindingLayer.recordIndexTables.byRecordType.${recordType} must exist.`
                        );
                        return;
                    }

                    if (normalizeString(entry.idField, '') !== definition.idField) {
                        addIssue(
                            issues,
                            'error',
                            'invalid_phase2_record_index_id_field',
                            `phase2RecordBindingLayer.recordIndexTables.byRecordType.${recordType}.idField`,
                            `${recordType} must bind through canonical id field "${definition.idField}".`
                        );
                    }

                    if (normalizeString(entry.bindingTierId, '') !== definition.bindingTierId) {
                        addIssue(
                            issues,
                            'error',
                            'invalid_phase2_record_index_binding_tier',
                            `phase2RecordBindingLayer.recordIndexTables.byRecordType.${recordType}.bindingTierId`,
                            `${recordType} must remain assigned to "${definition.bindingTierId}".`
                        );
                    }

                    if (normalizeString(entry.targetMode, '') !== definition.targetMode) {
                        addIssue(
                            issues,
                            'error',
                            'invalid_phase2_record_index_target_mode',
                            `phase2RecordBindingLayer.recordIndexTables.byRecordType.${recordType}.targetMode`,
                            `${recordType} must remain assigned to target mode "${definition.targetMode}".`
                        );
                    }

                    if (!Array.isArray(entry.recordIds)) {
                        addIssue(
                            issues,
                            'error',
                            'invalid_phase2_record_index_record_ids',
                            `phase2RecordBindingLayer.recordIndexTables.byRecordType.${recordType}.recordIds`,
                            `${recordType}.recordIds must be an array.`
                        );
                    } else {
                        const seenRecordIds = new Set();
                        entry.recordIds.forEach((recordId, index) => {
                            const normalizedRecordId = normalizeString(recordId, '');
                            if (!normalizedRecordId) {
                                addIssue(
                                    issues,
                                    'error',
                                    'invalid_phase2_record_index_record_id',
                                    `phase2RecordBindingLayer.recordIndexTables.byRecordType.${recordType}.recordIds[${index}]`,
                                    `${recordType}.recordIds[${index}] must be a non-empty string.`
                                );
                                return;
                            }

                            if (seenRecordIds.has(normalizedRecordId)) {
                                addIssue(
                                    issues,
                                    'error',
                                    'duplicate_phase2_record_index_record_id',
                                    `phase2RecordBindingLayer.recordIndexTables.byRecordType.${recordType}.recordIds[${index}]`,
                                    `${recordType}.recordIds contains duplicate record id "${normalizedRecordId}".`
                                );
                                return;
                            }

                            seenRecordIds.add(normalizedRecordId);
                        });
                    }
                });
            }

            if (!isPlainObject(recordIndexTables.issueCounts)) {
                addIssue(
                    issues,
                    'error',
                    'missing_phase2_record_index_issue_counts',
                    'phase2RecordBindingLayer.recordIndexTables.issueCounts',
                    'Phase2RecordBindingLayer.recordIndexTables.issueCounts must exist.'
                );
            } else {
                [
                    'invalidSourceRecordCount',
                    'missingCanonicalRecordIdCount',
                    'duplicateCanonicalRecordIdCount'
                ].forEach((issueCountKey) => {
                    const issueCountValue = Number(recordIndexTables.issueCounts[issueCountKey]);
                    if (!Number.isFinite(issueCountValue) || issueCountValue < 0) {
                        addIssue(
                            issues,
                            'error',
                            'invalid_phase2_record_index_issue_count',
                            `phase2RecordBindingLayer.recordIndexTables.issueCounts.${issueCountKey}`,
                            `${issueCountKey} must be a non-negative number.`
                        );
                    }
                });

                if ((Number(recordIndexTables.issueCounts.missingCanonicalRecordIdCount) || 0) > 0) {
                    addIssue(
                        issues,
                        'error',
                        'phase2_record_binding_missing_canonical_record_ids',
                        'phase2RecordBindingLayer.recordIndexTables.issueCounts.missingCanonicalRecordIdCount',
                        'Phase2RecordBindingLayer cannot be valid while canonical record ids are missing.'
                    );
                }

                if ((Number(recordIndexTables.issueCounts.duplicateCanonicalRecordIdCount) || 0) > 0) {
                    addIssue(
                        issues,
                        'error',
                        'phase2_record_binding_duplicate_canonical_record_ids',
                        'phase2RecordBindingLayer.recordIndexTables.issueCounts.duplicateCanonicalRecordIdCount',
                        'Phase2RecordBindingLayer cannot be valid while duplicate canonical record ids remain.'
                    );
                }
            }
        }

        if (!isPlainObject(bindingLayerCandidate.primaryCarrierContextTables)) {
            addIssue(
                issues,
                'error',
                'missing_phase2_primary_carrier_context_tables',
                'phase2RecordBindingLayer.primaryCarrierContextTables',
                'Phase2RecordBindingLayer.primaryCarrierContextTables must be an object.'
            );
        } else {
            const primaryCarrierContextTables = bindingLayerCandidate.primaryCarrierContextTables;
            const expectedPrimaryRecordTypes = getPhase2PrimaryCarrierRecordTypes()
                .slice()
                .sort();

            if (!Array.isArray(primaryCarrierContextTables.recordTypes)) {
                addIssue(
                    issues,
                    'error',
                    'invalid_phase2_primary_carrier_record_types',
                    'phase2RecordBindingLayer.primaryCarrierContextTables.recordTypes',
                    'Phase2RecordBindingLayer.primaryCarrierContextTables.recordTypes must be an array.'
                );
            } else {
                const actualPrimaryRecordTypes = primaryCarrierContextTables.recordTypes
                    .map((recordType) => normalizeString(recordType, ''))
                    .filter(Boolean)
                    .sort();

                if (actualPrimaryRecordTypes.join('|') !== expectedPrimaryRecordTypes.join('|')) {
                    addIssue(
                        issues,
                        'error',
                        'invalid_phase2_primary_carrier_record_type_set',
                        'phase2RecordBindingLayer.primaryCarrierContextTables.recordTypes',
                        `Phase2RecordBindingLayer.primaryCarrierContextTables.recordTypes must equal: ${expectedPrimaryRecordTypes.join(', ')}.`
                    );
                }
            }

            if (!isPlainObject(primaryCarrierContextTables.byRecordType)) {
                addIssue(
                    issues,
                    'error',
                    'missing_phase2_primary_carrier_context_tables_by_record_type',
                    'phase2RecordBindingLayer.primaryCarrierContextTables.byRecordType',
                    'Phase2RecordBindingLayer.primaryCarrierContextTables.byRecordType must be an object.'
                );
            } else {
                getPhase2PrimaryCarrierRecordTypes().forEach((recordType) => {
                    const table = primaryCarrierContextTables.byRecordType[recordType];
                    const definition = getBindingDefinition(recordType);
                    const indexEntry = recordIndexByRecordType[recordType] || null;
                    const expectedRecordIds = Array.isArray(indexEntry && indexEntry.recordIds)
                        ? indexEntry.recordIds.slice()
                        : [];

                    if (!isPlainObject(table)) {
                        addIssue(
                            issues,
                            'error',
                            'missing_phase2_primary_carrier_context_table',
                            `phase2RecordBindingLayer.primaryCarrierContextTables.byRecordType.${recordType}`,
                            `Phase2RecordBindingLayer.primaryCarrierContextTables.byRecordType.${recordType} must exist.`
                        );
                        return;
                    }

                    if (normalizeString(table.bindingTierId, '') !== TIER_1_PRIMARY_CARRIER) {
                        addIssue(
                            issues,
                            'error',
                            'invalid_phase2_primary_carrier_binding_tier',
                            `phase2RecordBindingLayer.primaryCarrierContextTables.byRecordType.${recordType}.bindingTierId`,
                            `${recordType} must remain a Tier 1 primary carrier.`
                        );
                    }

                    if (normalizeString(table.targetMode, '') !== TARGET_MODE_DIRECT_RECORD_PROFILE) {
                        addIssue(
                            issues,
                            'error',
                            'invalid_phase2_primary_carrier_target_mode',
                            `phase2RecordBindingLayer.primaryCarrierContextTables.byRecordType.${recordType}.targetMode`,
                            `${recordType} must remain bound as a direct record profile target.`
                        );
                    }

                    if (normalizeString(table.idField, '') !== definition.idField) {
                        addIssue(
                            issues,
                            'error',
                            'invalid_phase2_primary_carrier_id_field',
                            `phase2RecordBindingLayer.primaryCarrierContextTables.byRecordType.${recordType}.idField`,
                            `${recordType} must preserve canonical id field "${definition.idField}".`
                        );
                    }

                    if (!Array.isArray(table.recordIds)) {
                        addIssue(
                            issues,
                            'error',
                            'invalid_phase2_primary_carrier_record_ids',
                            `phase2RecordBindingLayer.primaryCarrierContextTables.byRecordType.${recordType}.recordIds`,
                            `${recordType} primary context recordIds must be an array.`
                        );
                        return;
                    }

                    if (table.recordIds.join('|') !== expectedRecordIds.join('|')) {
                        addIssue(
                            issues,
                            'error',
                            'invalid_phase2_primary_carrier_record_id_alignment',
                            `phase2RecordBindingLayer.primaryCarrierContextTables.byRecordType.${recordType}.recordIds`,
                            `${recordType} primary carrier context table must preserve the canonical record ids from recordIndexTables.byRecordType.${recordType}.recordIds.`
                        );
                    }

                    if (!isPlainObject(table.byRecordId)) {
                        addIssue(
                            issues,
                            'error',
                            'missing_phase2_primary_carrier_by_record_id',
                            `phase2RecordBindingLayer.primaryCarrierContextTables.byRecordType.${recordType}.byRecordId`,
                            `${recordType} primary carrier context table must expose byRecordId.`
                        );
                        return;
                    }

                    expectedRecordIds.forEach((recordId) => {
                        const contextEntry = table.byRecordId[recordId];
                        if (!isPlainObject(contextEntry)) {
                            addIssue(
                                issues,
                                'error',
                                'missing_phase2_primary_carrier_context_entry',
                                `phase2RecordBindingLayer.primaryCarrierContextTables.byRecordType.${recordType}.byRecordId.${recordId}`,
                                `${recordType}.${recordId} must exist in primary carrier context tables.`
                            );
                            return;
                        }

                        if (normalizeString(contextEntry.recordType, '') !== recordType) {
                            addIssue(
                                issues,
                                'error',
                                'invalid_phase2_primary_carrier_context_record_type',
                                `phase2RecordBindingLayer.primaryCarrierContextTables.byRecordType.${recordType}.byRecordId.${recordId}.recordType`,
                                `${recordType}.${recordId} must preserve its canonical recordType.`
                            );
                        }

                        if (normalizeString(contextEntry.recordId, '') !== recordId) {
                            addIssue(
                                issues,
                                'error',
                                'invalid_phase2_primary_carrier_context_record_id',
                                `phase2RecordBindingLayer.primaryCarrierContextTables.byRecordType.${recordType}.byRecordId.${recordId}.recordId`,
                                `${recordType}.${recordId} must preserve its canonical recordId.`
                            );
                        }

                        if (hasOwn(contextEntry, 'summary')) {
                            addIssue(
                                issues,
                                'error',
                                'invalid_phase2_primary_carrier_summary_presence',
                                `phase2RecordBindingLayer.primaryCarrierContextTables.byRecordType.${recordType}.byRecordId.${recordId}.summary`,
                                'Primary carrier context tables must not add summaries at this stage.'
                            );
                        }

                        if (hasOwn(contextEntry, 'gameplayMeaning')) {
                            addIssue(
                                issues,
                                'error',
                                'invalid_phase2_primary_carrier_gameplay_meaning_presence',
                                `phase2RecordBindingLayer.primaryCarrierContextTables.byRecordType.${recordType}.byRecordId.${recordId}.gameplayMeaning`,
                                'Primary carrier context tables must not derive gameplay meaning at this stage.'
                            );
                        }
                    });
                });
            }

            if (!isPlainObject(primaryCarrierContextTables.issueCounts)) {
                addIssue(
                    issues,
                    'error',
                    'missing_phase2_primary_carrier_issue_counts',
                    'phase2RecordBindingLayer.primaryCarrierContextTables.issueCounts',
                    'Phase2RecordBindingLayer.primaryCarrierContextTables.issueCounts must exist.'
                );
            } else {
                [
                    'invalidReferenceFieldCount',
                    'unknownReferenceIdCount',
                    'missingContextEntryCount'
                ].forEach((issueCountKey) => {
                    const issueCountValue = Number(primaryCarrierContextTables.issueCounts[issueCountKey]);
                    if (!Number.isFinite(issueCountValue) || issueCountValue < 0) {
                        addIssue(
                            issues,
                            'error',
                            'invalid_phase2_primary_carrier_issue_count',
                            `phase2RecordBindingLayer.primaryCarrierContextTables.issueCounts.${issueCountKey}`,
                            `${issueCountKey} must be a non-negative number.`
                        );
                    }
                });

                if ((Number(primaryCarrierContextTables.issueCounts.unknownReferenceIdCount) || 0) > 0) {
                    addIssue(
                        issues,
                        'error',
                        'phase2_primary_carrier_unknown_reference_ids',
                        'phase2RecordBindingLayer.primaryCarrierContextTables.issueCounts.unknownReferenceIdCount',
                        'Primary carrier context tables cannot remain valid while unknown canonical reference ids are present.'
                    );
                }
            }
        }

        if (!isPlainObject(bindingLayerCandidate.secondaryContextTables)) {
            addIssue(
                issues,
                'error',
                'missing_phase2_secondary_context_tables',
                'phase2RecordBindingLayer.secondaryContextTables',
                'Phase2RecordBindingLayer.secondaryContextTables must be an object.'
            );
        } else {
            const secondaryContextTables = bindingLayerCandidate.secondaryContextTables;
            const expectedSecondaryRecordTypes = getPhase2SecondaryContextRecordTypes();

            if (!Array.isArray(secondaryContextTables.recordTypes)) {
                addIssue(
                    issues,
                    'error',
                    'invalid_phase2_secondary_context_record_types',
                    'phase2RecordBindingLayer.secondaryContextTables.recordTypes',
                    'Phase2RecordBindingLayer.secondaryContextTables.recordTypes must be an array.'
                );
            } else if (!compareNormalizedStringSets(secondaryContextTables.recordTypes, expectedSecondaryRecordTypes)) {
                addIssue(
                    issues,
                    'error',
                    'invalid_phase2_secondary_context_record_type_set',
                    'phase2RecordBindingLayer.secondaryContextTables.recordTypes',
                    `Phase2RecordBindingLayer.secondaryContextTables.recordTypes must equal: ${expectedSecondaryRecordTypes.join(', ')}.`
                );
            }

            if (!Array.isArray(secondaryContextTables.derivativeStructuralRecordTypes)) {
                addIssue(
                    issues,
                    'error',
                    'invalid_phase2_derivative_structural_record_types',
                    'phase2RecordBindingLayer.secondaryContextTables.derivativeStructuralRecordTypes',
                    'Phase2RecordBindingLayer.secondaryContextTables.derivativeStructuralRecordTypes must be an array.'
                );
            } else if (!compareNormalizedStringSets(
                secondaryContextTables.derivativeStructuralRecordTypes,
                SECONDARY_DERIVATIVE_STRUCTURAL_RECORD_TYPES
            )) {
                addIssue(
                    issues,
                    'error',
                    'invalid_phase2_derivative_structural_record_type_set',
                    'phase2RecordBindingLayer.secondaryContextTables.derivativeStructuralRecordTypes',
                    `Phase2RecordBindingLayer.secondaryContextTables.derivativeStructuralRecordTypes must equal: ${SECONDARY_DERIVATIVE_STRUCTURAL_RECORD_TYPES.join(', ')}.`
                );
            }

            if (!Array.isArray(secondaryContextTables.broaderContextRecordTypes)) {
                addIssue(
                    issues,
                    'error',
                    'invalid_phase2_broader_context_record_types',
                    'phase2RecordBindingLayer.secondaryContextTables.broaderContextRecordTypes',
                    'Phase2RecordBindingLayer.secondaryContextTables.broaderContextRecordTypes must be an array.'
                );
            } else if (!compareNormalizedStringSets(
                secondaryContextTables.broaderContextRecordTypes,
                SECONDARY_BROADER_CONTEXT_RECORD_TYPES
            )) {
                addIssue(
                    issues,
                    'error',
                    'invalid_phase2_broader_context_record_type_set',
                    'phase2RecordBindingLayer.secondaryContextTables.broaderContextRecordTypes',
                    `Phase2RecordBindingLayer.secondaryContextTables.broaderContextRecordTypes must equal: ${SECONDARY_BROADER_CONTEXT_RECORD_TYPES.join(', ')}.`
                );
            }

            validateSecondaryPriorityRules(
                secondaryContextTables.priorityRules,
                'phase2RecordBindingLayer.secondaryContextTables.priorityRules',
                issues
            );

            if (!isPlainObject(secondaryContextTables.byRecordType)) {
                addIssue(
                    issues,
                    'error',
                    'missing_phase2_secondary_context_tables_by_record_type',
                    'phase2RecordBindingLayer.secondaryContextTables.byRecordType',
                    'Phase2RecordBindingLayer.secondaryContextTables.byRecordType must be an object.'
                );
            } else {
                getPhase2SecondaryContextRecordTypes().forEach((recordType) => {
                    const table = secondaryContextTables.byRecordType[recordType];
                    const definition = getBindingDefinition(recordType);
                    const config = SECONDARY_CONTEXT_CONFIG[recordType] || {};
                    const indexEntry = recordIndexByRecordType[recordType] || null;
                    const expectedRecordIds = Array.isArray(indexEntry && indexEntry.recordIds)
                        ? indexEntry.recordIds.slice()
                        : [];
                    const expectedExcludedSemanticFields = Array.isArray(config.excludedSemanticFields)
                        ? config.excludedSemanticFields
                        : [];
                    const expectedMixedFieldNames = [
                        ...(Array.isArray(config.mixedLeadRefFields) ? config.mixedLeadRefFields : []),
                        ...(Array.isArray(config.mixedArrayRefFields) ? config.mixedArrayRefFields : [])
                    ];

                    if (!isPlainObject(table)) {
                        addIssue(
                            issues,
                            'error',
                            'missing_phase2_secondary_context_table',
                            `phase2RecordBindingLayer.secondaryContextTables.byRecordType.${recordType}`,
                            `Phase2RecordBindingLayer.secondaryContextTables.byRecordType.${recordType} must exist.`
                        );
                        return;
                    }

                    if (normalizeString(table.bindingTierId, '') !== definition.bindingTierId) {
                        addIssue(
                            issues,
                            'error',
                            'invalid_phase2_secondary_context_binding_tier',
                            `phase2RecordBindingLayer.secondaryContextTables.byRecordType.${recordType}.bindingTierId`,
                            `${recordType} must remain assigned to binding tier "${definition.bindingTierId}".`
                        );
                    }

                    if (normalizeString(table.targetMode, '') !== definition.targetMode) {
                        addIssue(
                            issues,
                            'error',
                            'invalid_phase2_secondary_context_target_mode',
                            `phase2RecordBindingLayer.secondaryContextTables.byRecordType.${recordType}.targetMode`,
                            `${recordType} must remain assigned to target mode "${definition.targetMode}".`
                        );
                    }

                    if (normalizeString(table.idField, '') !== definition.idField) {
                        addIssue(
                            issues,
                            'error',
                            'invalid_phase2_secondary_context_id_field',
                            `phase2RecordBindingLayer.secondaryContextTables.byRecordType.${recordType}.idField`,
                            `${recordType} must preserve canonical id field "${definition.idField}".`
                        );
                    }

                    if (!Array.isArray(table.recordIds)) {
                        addIssue(
                            issues,
                            'error',
                            'invalid_phase2_secondary_context_record_ids',
                            `phase2RecordBindingLayer.secondaryContextTables.byRecordType.${recordType}.recordIds`,
                            `${recordType} secondary context recordIds must be an array.`
                        );
                        return;
                    }

                    if (table.recordIds.join('|') !== expectedRecordIds.join('|')) {
                        addIssue(
                            issues,
                            'error',
                            'invalid_phase2_secondary_context_record_id_alignment',
                            `phase2RecordBindingLayer.secondaryContextTables.byRecordType.${recordType}.recordIds`,
                            `${recordType} secondary context table must preserve the canonical record ids from recordIndexTables.byRecordType.${recordType}.recordIds.`
                        );
                    }

                    if (!isPlainObject(table.byRecordId)) {
                        addIssue(
                            issues,
                            'error',
                            'missing_phase2_secondary_context_by_record_id',
                            `phase2RecordBindingLayer.secondaryContextTables.byRecordType.${recordType}.byRecordId`,
                            `${recordType} secondary context table must expose byRecordId.`
                        );
                        return;
                    }

                    expectedRecordIds.forEach((recordId) => {
                        const contextEntry = table.byRecordId[recordId];
                        const contextEntryPath = `phase2RecordBindingLayer.secondaryContextTables.byRecordType.${recordType}.byRecordId.${recordId}`;

                        if (!isPlainObject(contextEntry)) {
                            addIssue(
                                issues,
                                'error',
                                'missing_phase2_secondary_context_entry',
                                contextEntryPath,
                                `${recordType}.${recordId} must exist in secondary context tables.`
                            );
                            return;
                        }

                        if (normalizeString(contextEntry.recordType, '') !== recordType) {
                            addIssue(
                                issues,
                                'error',
                                'invalid_phase2_secondary_context_record_type',
                                `${contextEntryPath}.recordType`,
                                `${recordType}.${recordId} must preserve its canonical recordType.`
                            );
                        }

                        if (normalizeString(contextEntry.recordId, '') !== recordId) {
                            addIssue(
                                issues,
                                'error',
                                'invalid_phase2_secondary_context_record_id',
                                `${contextEntryPath}.recordId`,
                                `${recordType}.${recordId} must preserve its canonical recordId.`
                            );
                        }

                        if (normalizeString(contextEntry.bindingTierId, '') !== definition.bindingTierId) {
                            addIssue(
                                issues,
                                'error',
                                'invalid_phase2_secondary_context_entry_binding_tier',
                                `${contextEntryPath}.bindingTierId`,
                                `${recordType}.${recordId} must preserve binding tier "${definition.bindingTierId}".`
                            );
                        }

                        if (normalizeString(contextEntry.targetMode, '') !== definition.targetMode) {
                            addIssue(
                                issues,
                                'error',
                                'invalid_phase2_secondary_context_entry_target_mode',
                                `${contextEntryPath}.targetMode`,
                                `${recordType}.${recordId} must preserve target mode "${definition.targetMode}".`
                            );
                        }

                        if (normalizeString(contextEntry.contextPriority, '') !== 'secondaryContext') {
                            addIssue(
                                issues,
                                'error',
                                'invalid_phase2_secondary_context_priority',
                                `${contextEntryPath}.contextPriority`,
                                `${recordType}.${recordId} must remain marked as secondaryContext.`
                            );
                        }

                        if (normalizeString(contextEntry.primaryTruthSource, '') !== SECONDARY_CONTEXT_PRIORITY_RULES.primaryTruthSource) {
                            addIssue(
                                issues,
                                'error',
                                'invalid_phase2_secondary_context_primary_truth_source',
                                `${contextEntryPath}.primaryTruthSource`,
                                `${recordType}.${recordId} must preserve primaryTruthSource "${SECONDARY_CONTEXT_PRIORITY_RULES.primaryTruthSource}".`
                            );
                        }

                        if (contextEntry.mayOverridePrimaryTruth !== false) {
                            addIssue(
                                issues,
                                'error',
                                'invalid_phase2_secondary_context_override',
                                `${contextEntryPath}.mayOverridePrimaryTruth`,
                                `${recordType}.${recordId} must not override primary carrier truth.`
                            );
                        }

                        if (!isPlainObject(contextEntry.sourceDescriptorSnapshot)) {
                            addIssue(
                                issues,
                                'error',
                                'missing_phase2_secondary_context_descriptor_snapshot',
                                `${contextEntryPath}.sourceDescriptorSnapshot`,
                                `${recordType}.${recordId} must expose sourceDescriptorSnapshot.`
                            );
                        } else {
                            expectedExcludedSemanticFields.forEach((fieldName) => {
                                if (hasOwn(contextEntry.sourceDescriptorSnapshot, fieldName)) {
                                    addIssue(
                                        issues,
                                        'error',
                                        'invalid_phase2_secondary_context_excluded_semantic_promotion',
                                        `${contextEntryPath}.sourceDescriptorSnapshot.${fieldName}`,
                                        `${recordType}.${recordId} must not promote excluded semantic field "${fieldName}" into sourceDescriptorSnapshot.`
                                    );
                                }
                            });
                        }

                        if (!Array.isArray(contextEntry.secondarySemanticExclusions)) {
                            addIssue(
                                issues,
                                'error',
                                'invalid_phase2_secondary_context_semantic_exclusions',
                                `${contextEntryPath}.secondarySemanticExclusions`,
                                `${recordType}.${recordId} must expose secondarySemanticExclusions as an array.`
                            );
                        } else if (!compareNormalizedStringSets(
                            contextEntry.secondarySemanticExclusions,
                            expectedExcludedSemanticFields
                        )) {
                            addIssue(
                                issues,
                                'error',
                                'invalid_phase2_secondary_context_semantic_exclusion_set',
                                `${contextEntryPath}.secondarySemanticExclusions`,
                                `${recordType}.${recordId} must preserve excluded semantic fields: ${expectedExcludedSemanticFields.join(', ') || 'none'}.`
                            );
                        }

                        if (!isPlainObject(contextEntry.primaryCarrierLeadRefs)) {
                            addIssue(
                                issues,
                                'error',
                                'missing_phase2_secondary_context_primary_carrier_lead_refs',
                                `${contextEntryPath}.primaryCarrierLeadRefs`,
                                `${recordType}.${recordId} must expose primaryCarrierLeadRefs as an object.`
                            );
                        }

                        if (!isPlainObject(contextEntry.primaryCarrierRefs)) {
                            addIssue(
                                issues,
                                'error',
                                'missing_phase2_secondary_context_primary_carrier_refs',
                                `${contextEntryPath}.primaryCarrierRefs`,
                                `${recordType}.${recordId} must expose primaryCarrierRefs as an object.`
                            );
                        }

                        if (!isPlainObject(contextEntry.secondaryContextRefs)) {
                            addIssue(
                                issues,
                                'error',
                                'missing_phase2_secondary_context_refs',
                                `${contextEntryPath}.secondaryContextRefs`,
                                `${recordType}.${recordId} must expose secondaryContextRefs as an object.`
                            );
                        }

                        if (!isPlainObject(contextEntry.mixedCanonicalRefs)) {
                            addIssue(
                                issues,
                                'error',
                                'missing_phase2_secondary_context_mixed_refs',
                                `${contextEntryPath}.mixedCanonicalRefs`,
                                `${recordType}.${recordId} must expose mixedCanonicalRefs as an object.`
                            );
                        } else {
                            const actualMixedFieldNames = Object.keys(contextEntry.mixedCanonicalRefs);

                            if (!compareNormalizedStringSets(actualMixedFieldNames, expectedMixedFieldNames)) {
                                addIssue(
                                    issues,
                                    'error',
                                    'invalid_phase2_secondary_context_mixed_ref_fields',
                                    `${contextEntryPath}.mixedCanonicalRefs`,
                                    `${recordType}.${recordId} must preserve mixed canonical ref fields: ${expectedMixedFieldNames.join(', ') || 'none'}.`
                                );
                            }

                            expectedMixedFieldNames.forEach((fieldName) => {
                                const refBucket = contextEntry.mixedCanonicalRefs[fieldName];
                                const refBucketPath = `${contextEntryPath}.mixedCanonicalRefs.${fieldName}`;

                                if (!isPlainObject(refBucket)) {
                                    addIssue(
                                        issues,
                                        'error',
                                        'invalid_phase2_secondary_context_mixed_ref_bucket',
                                        refBucketPath,
                                        `${recordType}.${recordId} must expose ${fieldName} as a mixed canonical ref bucket object.`
                                    );
                                    return;
                                }

                                if (!isPlainObject(refBucket.primaryCarrierRefs)) {
                                    addIssue(
                                        issues,
                                        'error',
                                        'invalid_phase2_secondary_context_mixed_primary_refs',
                                        `${refBucketPath}.primaryCarrierRefs`,
                                        `${recordType}.${recordId}.${fieldName} must expose primaryCarrierRefs as an object.`
                                    );
                                }

                                if (!isPlainObject(refBucket.secondaryContextRefs)) {
                                    addIssue(
                                        issues,
                                        'error',
                                        'invalid_phase2_secondary_context_mixed_secondary_refs',
                                        `${refBucketPath}.secondaryContextRefs`,
                                        `${recordType}.${recordId}.${fieldName} must expose secondaryContextRefs as an object.`
                                    );
                                }

                                if (!Array.isArray(refBucket.orderedRefs)) {
                                    addIssue(
                                        issues,
                                        'error',
                                        'invalid_phase2_secondary_context_mixed_ordered_refs',
                                        `${refBucketPath}.orderedRefs`,
                                        `${recordType}.${recordId}.${fieldName} must expose orderedRefs as an array.`
                                    );
                                    return;
                                }

                                refBucket.orderedRefs.forEach((resolvedRef, resolvedIndex) => {
                                    const resolvedRefPath = `${refBucketPath}.orderedRefs[${resolvedIndex}]`;
                                    const resolvedRecordType = normalizeString(resolvedRef && resolvedRef.recordType, '');
                                    const resolvedRecordId = normalizeString(resolvedRef && resolvedRef.recordId, '');
                                    const expectedContextPriority = isPrimaryCarrierRecordType(resolvedRecordType)
                                        ? 'primaryCarrier'
                                        : (isSecondaryContextRecordType(resolvedRecordType) ? 'secondaryContext' : '');
                                    const knownRecordIds = Array.isArray(recordIndexByRecordType[resolvedRecordType] && recordIndexByRecordType[resolvedRecordType].recordIds)
                                        ? recordIndexByRecordType[resolvedRecordType].recordIds
                                        : [];

                                    if (!expectedContextPriority) {
                                        addIssue(
                                            issues,
                                            'error',
                                            'invalid_phase2_secondary_context_mixed_record_type',
                                            `${resolvedRefPath}.recordType`,
                                            `${recordType}.${recordId}.${fieldName} must resolve only canonical primary or secondary record types.`
                                        );
                                        return;
                                    }

                                    if (!resolvedRecordId || !knownRecordIds.includes(resolvedRecordId)) {
                                        addIssue(
                                            issues,
                                            'error',
                                            'invalid_phase2_secondary_context_mixed_record_id',
                                            `${resolvedRefPath}.recordId`,
                                            `${recordType}.${recordId}.${fieldName} must resolve only known canonical record ids.`
                                        );
                                    }

                                    if (normalizeString(resolvedRef.contextPriority, '') !== expectedContextPriority) {
                                        addIssue(
                                            issues,
                                            'error',
                                            'invalid_phase2_secondary_context_mixed_context_priority',
                                            `${resolvedRefPath}.contextPriority`,
                                            `${recordType}.${recordId}.${fieldName} must preserve contextPriority "${expectedContextPriority}" for ${resolvedRecordType}.${resolvedRecordId}.`
                                        );
                                    }
                                });
                            });
                        }

                        if (!isPlainObject(contextEntry.contextRefCounts)) {
                            addIssue(
                                issues,
                                'error',
                                'missing_phase2_secondary_context_ref_counts',
                                `${contextEntryPath}.contextRefCounts`,
                                `${recordType}.${recordId} must expose contextRefCounts as an object.`
                            );
                        }

                        if (hasOwn(contextEntry, 'summary')) {
                            addIssue(
                                issues,
                                'error',
                                'invalid_phase2_secondary_context_summary_presence',
                                `${contextEntryPath}.summary`,
                                'Secondary context tables must not add summaries at this stage.'
                            );
                        }

                        if (hasOwn(contextEntry, 'gameplayMeaning')) {
                            addIssue(
                                issues,
                                'error',
                                'invalid_phase2_secondary_context_gameplay_meaning_presence',
                                `${contextEntryPath}.gameplayMeaning`,
                                'Secondary context tables must not derive gameplay meaning at this stage.'
                            );
                        }
                    });
                });
            }

            if (!isPlainObject(secondaryContextTables.issueCounts)) {
                addIssue(
                    issues,
                    'error',
                    'missing_phase2_secondary_context_issue_counts',
                    'phase2RecordBindingLayer.secondaryContextTables.issueCounts',
                    'Phase2RecordBindingLayer.secondaryContextTables.issueCounts must exist.'
                );
            } else {
                [
                    'invalidReferenceFieldCount',
                    'unknownReferenceIdCount',
                    'ambiguousReferenceIdCount',
                    'missingContextEntryCount'
                ].forEach((issueCountKey) => {
                    const issueCountValue = Number(secondaryContextTables.issueCounts[issueCountKey]);
                    if (!Number.isFinite(issueCountValue) || issueCountValue < 0) {
                        addIssue(
                            issues,
                            'error',
                            'invalid_phase2_secondary_context_issue_count',
                            `phase2RecordBindingLayer.secondaryContextTables.issueCounts.${issueCountKey}`,
                            `${issueCountKey} must be a non-negative number.`
                        );
                    }
                });

                if ((Number(secondaryContextTables.issueCounts.unknownReferenceIdCount) || 0) > 0) {
                    addIssue(
                        issues,
                        'error',
                        'phase2_secondary_context_unknown_reference_ids',
                        'phase2RecordBindingLayer.secondaryContextTables.issueCounts.unknownReferenceIdCount',
                        'Secondary context tables cannot remain valid while unknown canonical reference ids are present.'
                    );
                }

                if ((Number(secondaryContextTables.issueCounts.ambiguousReferenceIdCount) || 0) > 0) {
                    addIssue(
                        issues,
                        'error',
                        'phase2_secondary_context_ambiguous_reference_ids',
                        'phase2RecordBindingLayer.secondaryContextTables.issueCounts.ambiguousReferenceIdCount',
                        'Secondary context tables cannot remain valid while ambiguous canonical reference ids are present.'
                    );
                }
            }
        }

        if (!isPlainObject(bindingLayerCandidate.profileTargetTables)) {
            addIssue(
                issues,
                'error',
                'missing_phase2_profile_target_tables',
                'phase2RecordBindingLayer.profileTargetTables',
                'Phase2RecordBindingLayer.profileTargetTables must be an object.'
            );
        } else if (!isPlainObject(bindingLayerCandidate.profileTargetTables.byRecordType)) {
            addIssue(
                issues,
                'error',
                'missing_phase2_profile_target_tables_by_record_type',
                'phase2RecordBindingLayer.profileTargetTables.byRecordType',
                'Phase2RecordBindingLayer.profileTargetTables.byRecordType must be an object.'
            );
        } else {
            getCanonicalPhase2RecordTypeIdsFromDefinitions().forEach((recordType) => {
                const definition = getBindingDefinition(recordType);
                const targetEntry = bindingLayerCandidate.profileTargetTables.byRecordType[recordType];

                if (!isPlainObject(targetEntry)) {
                    addIssue(
                        issues,
                        'error',
                        'missing_phase2_profile_target_entry',
                        `phase2RecordBindingLayer.profileTargetTables.byRecordType.${recordType}`,
                        `Phase2RecordBindingLayer.profileTargetTables.byRecordType.${recordType} must exist.`
                    );
                    return;
                }

                if (normalizeString(targetEntry.targetMode, '') !== definition.targetMode) {
                    addIssue(
                        issues,
                        'error',
                        'invalid_phase2_profile_target_mode',
                        `phase2RecordBindingLayer.profileTargetTables.byRecordType.${recordType}.targetMode`,
                        `${recordType} must remain assigned to target mode "${definition.targetMode}".`
                    );
                }
            });
        }

        if (!isPlainObject(bindingLayerCandidate.summarySurfaceTables)) {
            addIssue(
                issues,
                'error',
                'missing_phase2_summary_surface_tables',
                'phase2RecordBindingLayer.summarySurfaceTables',
                'Phase2RecordBindingLayer.summarySurfaceTables must be an object.'
            );
        } else {
            if (!isPlainObject(bindingLayerCandidate.summarySurfaceTables.perRecord)) {
                addIssue(
                    issues,
                    'error',
                    'missing_phase2_summary_surface_tables_per_record',
                    'phase2RecordBindingLayer.summarySurfaceTables.perRecord',
                    'Phase2RecordBindingLayer.summarySurfaceTables.perRecord must be an object.'
                );
            }

            if (!isPlainObject(bindingLayerCandidate.summarySurfaceTables.perRegion)) {
                addIssue(
                    issues,
                    'error',
                    'missing_phase2_summary_surface_tables_per_region',
                    'phase2RecordBindingLayer.summarySurfaceTables.perRegion',
                    'Phase2RecordBindingLayer.summarySurfaceTables.perRegion must be an object.'
                );
            }
        }

        if (!isPlainObject(bindingLayerCandidate.supportCollections)) {
            addIssue(
                issues,
                'error',
                'missing_phase2_support_collections',
                'phase2RecordBindingLayer.supportCollections',
                'Phase2RecordBindingLayer.supportCollections must be an object.'
            );
        } else if (!Array.isArray(bindingLayerCandidate.supportCollections.nonProfileCollections)) {
            addIssue(
                issues,
                'error',
                'missing_phase2_non_profile_support_collections',
                'phase2RecordBindingLayer.supportCollections.nonProfileCollections',
                'Phase2RecordBindingLayer.supportCollections.nonProfileCollections must be an array.'
            );
        } else {
            const actualSupportKeys = bindingLayerCandidate.supportCollections.nonProfileCollections
                .map((collection) => normalizeString(collection && collection.collectionKey, ''))
                .filter(Boolean)
                .sort();
            const expectedSupportKeys = getPhase2NonProfileSupportCollectionKeys().slice().sort();

            if (actualSupportKeys.join('|') !== expectedSupportKeys.join('|')) {
                addIssue(
                    issues,
                    'error',
                    'invalid_phase2_non_profile_support_collection_keys',
                    'phase2RecordBindingLayer.supportCollections.nonProfileCollections',
                    `Phase2RecordBindingLayer support-only collection keys must equal: ${expectedSupportKeys.join(', ')}.`
                );
            }
        }

        if (!isPlainObject(bindingLayerCandidate.bindingMeta)) {
            addIssue(
                issues,
                'error',
                'missing_phase2_binding_meta',
                'phase2RecordBindingLayer.bindingMeta',
                'Phase2RecordBindingLayer.bindingMeta must be an object.'
            );
        } else if (bindingLayerCandidate.bindingMeta.inventsRecordIds !== false) {
            addIssue(
                issues,
                'error',
                'invalid_phase2_binding_meta_invents_record_ids',
                'phase2RecordBindingLayer.bindingMeta.inventsRecordIds',
                'Phase2RecordBindingLayer must not invent canonical record ids.'
            );
        }

        return deepFreeze({
            contractId: RECORD_BINDING_LAYER_CONTRACT_ID,
            version: RECORD_BINDING_LAYER_VERSION,
            isValid: !issues.some((issue) => issue.severity === 'error'),
            issues
        });
    }

    function assertPhase2RecordBindingLayer(bindingLayerCandidate = {}) {
        const validation = validatePhase2RecordBindingLayer(bindingLayerCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid Phase2RecordBindingLayer: ${detail}`);
        }

        return bindingLayerCandidate;
    }

    phase2.__contractFirstStubs = phase2.__contractFirstStubs || {};
    phase2.__contractFirstStubs[GROUP_ID] = STUB;
        phase2.binding = deepFreeze({
        getPhase2BindingModuleStub,
        getPhase2RecordBindingLayerContract,
        getPhase2RecordBindingPipelineStep,
        getCanonicalPhase2RecordBindingDefinitions,
        getPhase2CanonicalBindingTierCatalog,
        getPhase2PrimaryCarrierRecordTypes,
        getPhase2SecondaryContextRecordTypes,
        getPhase2NonProfileSupportCollectionKeys,
        createPhase2CanonicalRecordIndexTable,
        createPhase2PrimaryCarrierContextTables,
        createPhase2SecondaryContextTables,
        createPhase2RecordBindingLayer,
        validatePhase2RecordBindingLayer,
        assertPhase2RecordBindingLayer
    });

    Object.assign(phase2, {
        getPhase2BindingModuleStub,
        getPhase2RecordBindingLayerContract,
        getPhase2RecordBindingPipelineStep,
        getCanonicalPhase2RecordBindingDefinitions,
        getPhase2CanonicalBindingTierCatalog,
        getPhase2PrimaryCarrierRecordTypes,
        getPhase2SecondaryContextRecordTypes,
        getPhase2NonProfileSupportCollectionKeys,
        createPhase2CanonicalRecordIndexTable,
        createPhase2PrimaryCarrierContextTables,
        createPhase2SecondaryContextTables,
        createPhase2RecordBindingLayer,
        validatePhase2RecordBindingLayer,
        assertPhase2RecordBindingLayer
    });
})();
