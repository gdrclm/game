(() => {
    const game = window.Game;
    const phase0 = game.systems.worldgenPhase0 = game.systems.worldgenPhase0 || {};
    const LIKELY_WORLD_PATTERN_FALLBACK = 'trade_heavy_but_fragile';
    const LIKELY_CONFLICT_MODE_FALLBACK = 'dynastic_and_route_driven';
    const LIKELY_COLLAPSE_MODE_FALLBACK = 'cascading_peripheral_failure';
    const LIKELY_RELIGIOUS_PATTERN_FALLBACK = 'adaptive_but_memory_bound';
    const LIKELY_ARCHIPELAGO_ROLE_FALLBACK = 'bridge_then_wound';
    const WORLD_SEED_PROFILE_AXIS_FIELD_IDS = Object.freeze([
        'conflictPressure',
        'dynastyPressure',
        'maritimeDependence',
        'environmentalVolatility',
        'collapseIntensity',
        'religiousInertia',
        'institutionalPlasticity',
        'migrationPressure',
        'centralizationBias',
        'memoryPersistence',
        'heroicAgencyBias',
        'routeFragilityBias',
        'culturalPermeability'
    ]);
    const WORLD_PATTERN_DESCRIPTORS = Object.freeze([
        Object.freeze({
            id: 'trade_heavy_but_fragile',
            positive: Object.freeze({
                maritimeDependence: 0.3,
                routeFragilityBias: 0.24,
                migrationPressure: 0.12,
                culturalPermeability: 0.1,
                collapseIntensity: 0.08,
                conflictPressure: 0.06
            }),
            negative: Object.freeze({
                centralizationBias: 0.1
            }),
            synergyFields: Object.freeze([
                'maritimeDependence',
                'routeFragilityBias',
                'migrationPressure'
            ]),
            synergyWeight: 0.1
        }),
        Object.freeze({
            id: 'continental_hierarchy',
            positive: Object.freeze({
                centralizationBias: 0.3,
                dynastyPressure: 0.22,
                religiousInertia: 0.12,
                memoryPersistence: 0.1
            }),
            negative: Object.freeze({
                maritimeDependence: 0.1,
                culturalPermeability: 0.08,
                institutionalPlasticity: 0.08
            }),
            synergyFields: Object.freeze([
                'centralizationBias',
                'dynastyPressure',
                'religiousInertia'
            ]),
            synergyWeight: 0.12
        }),
        Object.freeze({
            id: 'fragmented_maritime_rivals',
            positive: Object.freeze({
                maritimeDependence: 0.24,
                conflictPressure: 0.22,
                routeFragilityBias: 0.18,
                collapseIntensity: 0.1,
                migrationPressure: 0.08
            }),
            negative: Object.freeze({
                centralizationBias: 0.12
            }),
            synergyFields: Object.freeze([
                'maritimeDependence',
                'conflictPressure',
                'routeFragilityBias'
            ]),
            synergyWeight: 0.12
        }),
        Object.freeze({
            id: 'ritual_stable_basins',
            positive: Object.freeze({
                religiousInertia: 0.26,
                memoryPersistence: 0.18,
                centralizationBias: 0.12,
                dynastyPressure: 0.1
            }),
            negative: Object.freeze({
                environmentalVolatility: 0.14,
                collapseIntensity: 0.12,
                conflictPressure: 0.08
            }),
            synergyFields: Object.freeze([
                'religiousInertia',
                'memoryPersistence',
                'centralizationBias'
            ]),
            synergyWeight: 0.1
        }),
        Object.freeze({
            id: 'high_memory_collapse_world',
            positive: Object.freeze({
                memoryPersistence: 0.22,
                collapseIntensity: 0.2,
                environmentalVolatility: 0.16,
                conflictPressure: 0.12,
                routeFragilityBias: 0.08
            }),
            negative: Object.freeze({
                institutionalPlasticity: 0.1
            }),
            synergyFields: Object.freeze([
                'memoryPersistence',
                'collapseIntensity',
                'environmentalVolatility'
            ]),
            synergyWeight: 0.12
        })
    ]);
    const CONFLICT_MODE_DESCRIPTORS = Object.freeze([
        Object.freeze({
            id: 'route_conflict',
            positive: Object.freeze({
                conflictPressure: 0.24,
                maritimeDependence: 0.18,
                routeFragilityBias: 0.22,
                migrationPressure: 0.1,
                collapseIntensity: 0.08
            }),
            negative: Object.freeze({
                centralizationBias: 0.06
            }),
            synergyFields: Object.freeze([
                'conflictPressure',
                'maritimeDependence',
                'routeFragilityBias'
            ]),
            synergyWeight: 0.12
        }),
        Object.freeze({
            id: 'dynastic_conflict',
            positive: Object.freeze({
                dynastyPressure: 0.28,
                conflictPressure: 0.16,
                centralizationBias: 0.12,
                memoryPersistence: 0.1,
                heroicAgencyBias: 0.08
            }),
            negative: Object.freeze({
                culturalPermeability: 0.08
            }),
            synergyFields: Object.freeze([
                'dynastyPressure',
                'conflictPressure',
                'centralizationBias'
            ]),
            synergyWeight: 0.12
        }),
        Object.freeze({
            id: 'frontier_pressure_conflict',
            positive: Object.freeze({
                conflictPressure: 0.2,
                migrationPressure: 0.18,
                environmentalVolatility: 0.14,
                heroicAgencyBias: 0.1,
                centralizationBias: 0.08
            }),
            negative: Object.freeze({
                religiousInertia: 0.06
            }),
            synergyFields: Object.freeze([
                'conflictPressure',
                'migrationPressure',
                'environmentalVolatility'
            ]),
            synergyWeight: 0.1
        }),
        Object.freeze({
            id: 'religious_fragmentation',
            positive: Object.freeze({
                conflictPressure: 0.18,
                religiousInertia: 0.2,
                memoryPersistence: 0.14,
                culturalPermeability: 0.1
            }),
            negative: Object.freeze({
                institutionalPlasticity: 0.1,
                centralizationBias: 0.06
            }),
            synergyFields: Object.freeze([
                'religiousInertia',
                'memoryPersistence',
                'conflictPressure'
            ]),
            synergyWeight: 0.1
        }),
        Object.freeze({
            id: 'resource_and_isolation_conflict',
            positive: Object.freeze({
                conflictPressure: 0.18,
                environmentalVolatility: 0.18,
                routeFragilityBias: 0.14,
                maritimeDependence: 0.12,
                collapseIntensity: 0.1
            }),
            negative: Object.freeze({
                culturalPermeability: 0.1,
                institutionalPlasticity: 0.08
            }),
            synergyFields: Object.freeze([
                'environmentalVolatility',
                'routeFragilityBias',
                'conflictPressure'
            ]),
            synergyWeight: 0.1
        })
    ]);
    const COLLAPSE_MODE_DESCRIPTORS = Object.freeze([
        Object.freeze({
            id: 'slow_periphery_fade',
            positive: Object.freeze({
                centralizationBias: 0.22,
                memoryPersistence: 0.18,
                collapseIntensity: 0.14,
                dynastyPressure: 0.1,
                routeFragilityBias: 0.08
            }),
            negative: Object.freeze({
                environmentalVolatility: 0.08,
                conflictPressure: 0.08
            }),
            synergyFields: Object.freeze([
                'centralizationBias',
                'memoryPersistence',
                'collapseIntensity'
            ]),
            synergyWeight: 0.1
        }),
        Object.freeze({
            id: 'sudden_route_cascade',
            positive: Object.freeze({
                maritimeDependence: 0.24,
                routeFragilityBias: 0.24,
                collapseIntensity: 0.18,
                migrationPressure: 0.08,
                conflictPressure: 0.06
            }),
            negative: Object.freeze({
                institutionalPlasticity: 0.08
            }),
            synergyFields: Object.freeze([
                'maritimeDependence',
                'routeFragilityBias',
                'collapseIntensity'
            ]),
            synergyWeight: 0.12
        }),
        Object.freeze({
            id: 'dynastic_disintegration',
            positive: Object.freeze({
                dynastyPressure: 0.24,
                collapseIntensity: 0.2,
                centralizationBias: 0.12,
                memoryPersistence: 0.1,
                conflictPressure: 0.08
            }),
            negative: Object.freeze({
                institutionalPlasticity: 0.1
            }),
            synergyFields: Object.freeze([
                'dynastyPressure',
                'collapseIntensity',
                'centralizationBias'
            ]),
            synergyWeight: 0.1
        }),
        Object.freeze({
            id: 'ecological_shock_breakdown',
            positive: Object.freeze({
                environmentalVolatility: 0.28,
                collapseIntensity: 0.2,
                migrationPressure: 0.12,
                routeFragilityBias: 0.08,
                conflictPressure: 0.06
            }),
            negative: Object.freeze({
                institutionalPlasticity: 0.08,
                centralizationBias: 0.06
            }),
            synergyFields: Object.freeze([
                'environmentalVolatility',
                'collapseIntensity',
                'migrationPressure'
            ]),
            synergyWeight: 0.12
        }),
        Object.freeze({
            id: 'compound_collapse',
            positive: Object.freeze({
                collapseIntensity: 0.22,
                environmentalVolatility: 0.14,
                conflictPressure: 0.14,
                routeFragilityBias: 0.12,
                memoryPersistence: 0.08,
                maritimeDependence: 0.06
            }),
            negative: Object.freeze({
                institutionalPlasticity: 0.1
            }),
            synergyFields: Object.freeze([
                'collapseIntensity',
                'environmentalVolatility',
                'conflictPressure',
                'routeFragilityBias'
            ]),
            synergyWeight: 0.12
        })
    ]);
    const RELIGIOUS_PATTERN_DESCRIPTORS = Object.freeze([
        Object.freeze({
            id: 'high_orthodoxy',
            positive: Object.freeze({
                religiousInertia: 0.3,
                memoryPersistence: 0.16,
                centralizationBias: 0.1,
                dynastyPressure: 0.08
            }),
            negative: Object.freeze({
                institutionalPlasticity: 0.12,
                culturalPermeability: 0.1
            }),
            synergyFields: Object.freeze([
                'religiousInertia',
                'memoryPersistence',
                'centralizationBias'
            ]),
            synergyWeight: 0.12
        }),
        Object.freeze({
            id: 'reform_prone',
            positive: Object.freeze({
                institutionalPlasticity: 0.26,
                culturalPermeability: 0.18,
                heroicAgencyBias: 0.12,
                migrationPressure: 0.08
            }),
            negative: Object.freeze({
                religiousInertia: 0.16,
                memoryPersistence: 0.08
            }),
            synergyFields: Object.freeze([
                'institutionalPlasticity',
                'culturalPermeability',
                'heroicAgencyBias'
            ]),
            synergyWeight: 0.12
        }),
        Object.freeze({
            id: 'fear_and_appeasement',
            positive: Object.freeze({
                environmentalVolatility: 0.22,
                collapseIntensity: 0.18,
                religiousInertia: 0.16,
                memoryPersistence: 0.1
            }),
            negative: Object.freeze({
                institutionalPlasticity: 0.1
            }),
            synergyFields: Object.freeze([
                'environmentalVolatility',
                'collapseIntensity',
                'religiousInertia'
            ]),
            synergyWeight: 0.12
        }),
        Object.freeze({
            id: 'trade_syncretic',
            positive: Object.freeze({
                culturalPermeability: 0.24,
                maritimeDependence: 0.16,
                migrationPressure: 0.16,
                institutionalPlasticity: 0.1
            }),
            negative: Object.freeze({
                religiousInertia: 0.12,
                centralizationBias: 0.06
            }),
            synergyFields: Object.freeze([
                'culturalPermeability',
                'maritimeDependence',
                'migrationPressure'
            ]),
            synergyWeight: 0.12
        }),
        Object.freeze({
            id: 'memory_bound_ancestral',
            positive: Object.freeze({
                memoryPersistence: 0.24,
                religiousInertia: 0.2,
                dynastyPressure: 0.1,
                conflictPressure: 0.08
            }),
            negative: Object.freeze({
                culturalPermeability: 0.08,
                institutionalPlasticity: 0.08
            }),
            synergyFields: Object.freeze([
                'memoryPersistence',
                'religiousInertia'
            ]),
            synergyWeight: 0.1
        })
    ]);
    const ARCHIPELAGO_ROLE_DESCRIPTORS = Object.freeze([
        Object.freeze({
            id: 'bridge',
            positive: Object.freeze({
                maritimeDependence: 0.24,
                culturalPermeability: 0.18,
                migrationPressure: 0.14,
                institutionalPlasticity: 0.1,
                heroicAgencyBias: 0.06
            }),
            negative: Object.freeze({
                routeFragilityBias: 0.1
            }),
            synergyFields: Object.freeze([
                'maritimeDependence',
                'culturalPermeability',
                'migrationPressure'
            ]),
            synergyWeight: 0.12
        }),
        Object.freeze({
            id: 'customs_belt',
            positive: Object.freeze({
                maritimeDependence: 0.22,
                centralizationBias: 0.18,
                routeFragilityBias: 0.12,
                dynastyPressure: 0.1,
                conflictPressure: 0.06
            }),
            negative: Object.freeze({
                collapseIntensity: 0.08,
                environmentalVolatility: 0.06
            }),
            synergyFields: Object.freeze([
                'maritimeDependence',
                'centralizationBias',
                'routeFragilityBias'
            ]),
            synergyWeight: 0.1
        }),
        Object.freeze({
            id: 'wound_of_world',
            positive: Object.freeze({
                maritimeDependence: 0.18,
                routeFragilityBias: 0.2,
                collapseIntensity: 0.18,
                conflictPressure: 0.14,
                environmentalVolatility: 0.12
            }),
            negative: Object.freeze({
                institutionalPlasticity: 0.08
            }),
            synergyFields: Object.freeze([
                'maritimeDependence',
                'routeFragilityBias',
                'collapseIntensity'
            ]),
            synergyWeight: 0.12
        }),
        Object.freeze({
            id: 'imperial_chain',
            positive: Object.freeze({
                maritimeDependence: 0.22,
                centralizationBias: 0.18,
                dynastyPressure: 0.14,
                memoryPersistence: 0.08,
                conflictPressure: 0.08
            }),
            negative: Object.freeze({
                culturalPermeability: 0.06,
                institutionalPlasticity: 0.06
            }),
            synergyFields: Object.freeze([
                'maritimeDependence',
                'centralizationBias',
                'dynastyPressure'
            ]),
            synergyWeight: 0.12
        }),
        Object.freeze({
            id: 'remnant_core',
            positive: Object.freeze({
                memoryPersistence: 0.24,
                centralizationBias: 0.16,
                religiousInertia: 0.14,
                collapseIntensity: 0.12,
                maritimeDependence: 0.08
            }),
            negative: Object.freeze({
                migrationPressure: 0.08,
                institutionalPlasticity: 0.06
            }),
            synergyFields: Object.freeze([
                'memoryPersistence',
                'centralizationBias',
                'collapseIntensity'
            ]),
            synergyWeight: 0.1
        }),
        Object.freeze({
            id: 'exilic_edge',
            positive: Object.freeze({
                migrationPressure: 0.24,
                culturalPermeability: 0.18,
                environmentalVolatility: 0.12,
                collapseIntensity: 0.1,
                maritimeDependence: 0.08
            }),
            negative: Object.freeze({
                centralizationBias: 0.12
            }),
            synergyFields: Object.freeze([
                'migrationPressure',
                'culturalPermeability',
                'environmentalVolatility'
            ]),
            synergyWeight: 0.12
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

    function getAxisFieldIds() {
        if (typeof phase0.getWorldSeedProfileAxisFieldIds === 'function') {
            const fieldIds = phase0.getWorldSeedProfileAxisFieldIds();
            if (Array.isArray(fieldIds) && fieldIds.length > 0) {
                return fieldIds.slice();
            }
        }

        return WORLD_SEED_PROFILE_AXIS_FIELD_IDS.slice();
    }

    function normalizeWorldSeedProfile(worldSeedProfile) {
        const normalizedProfile = isPlainObject(worldSeedProfile)
            ? worldSeedProfile
            : {};

        return getAxisFieldIds().reduce((numericProfile, fieldId) => {
            numericProfile[fieldId] = clampUnitInterval(normalizedProfile[fieldId]);
            return numericProfile;
        }, {});
    }

    function resolveDescriptorSynergy(normalizedProfile, descriptor) {
        if (!Array.isArray(descriptor.synergyFields) || descriptor.synergyFields.length === 0) {
            return 0;
        }

        const synergyBase = descriptor.synergyFields.reduce((lowestValue, fieldId) => {
            return Math.min(lowestValue, clampUnitInterval(normalizedProfile[fieldId]));
        }, 1);

        return synergyBase * clampUnitInterval(descriptor.synergyWeight);
    }

    function scoreWorldPatternDescriptor(normalizedProfile, descriptor) {
        const positiveScore = Object.keys(descriptor.positive).reduce((score, fieldId) => {
            return score + clampUnitInterval(normalizedProfile[fieldId]) * descriptor.positive[fieldId];
        }, 0);
        const negativeScore = Object.keys(descriptor.negative).reduce((score, fieldId) => {
            return score + (1 - clampUnitInterval(normalizedProfile[fieldId])) * descriptor.negative[fieldId];
        }, 0);

        return positiveScore + negativeScore + resolveDescriptorSynergy(normalizedProfile, descriptor);
    }

    function scoreConflictModeDescriptor(normalizedProfile, descriptor) {
        const positiveScore = Object.keys(descriptor.positive).reduce((score, fieldId) => {
            return score + clampUnitInterval(normalizedProfile[fieldId]) * descriptor.positive[fieldId];
        }, 0);
        const negativeScore = Object.keys(descriptor.negative).reduce((score, fieldId) => {
            return score + (1 - clampUnitInterval(normalizedProfile[fieldId])) * descriptor.negative[fieldId];
        }, 0);

        return positiveScore + negativeScore + resolveDescriptorSynergy(normalizedProfile, descriptor);
    }

    function scoreCollapseModeDescriptor(normalizedProfile, descriptor) {
        const positiveScore = Object.keys(descriptor.positive).reduce((score, fieldId) => {
            return score + clampUnitInterval(normalizedProfile[fieldId]) * descriptor.positive[fieldId];
        }, 0);
        const negativeScore = Object.keys(descriptor.negative).reduce((score, fieldId) => {
            return score + (1 - clampUnitInterval(normalizedProfile[fieldId])) * descriptor.negative[fieldId];
        }, 0);

        return positiveScore + negativeScore + resolveDescriptorSynergy(normalizedProfile, descriptor);
    }

    function scoreReligiousPatternDescriptor(normalizedProfile, descriptor) {
        const positiveScore = Object.keys(descriptor.positive).reduce((score, fieldId) => {
            return score + clampUnitInterval(normalizedProfile[fieldId]) * descriptor.positive[fieldId];
        }, 0);
        const negativeScore = Object.keys(descriptor.negative).reduce((score, fieldId) => {
            return score + (1 - clampUnitInterval(normalizedProfile[fieldId])) * descriptor.negative[fieldId];
        }, 0);

        return positiveScore + negativeScore + resolveDescriptorSynergy(normalizedProfile, descriptor);
    }

    function scoreArchipelagoRoleDescriptor(normalizedProfile, descriptor) {
        const positiveScore = Object.keys(descriptor.positive).reduce((score, fieldId) => {
            return score + clampUnitInterval(normalizedProfile[fieldId]) * descriptor.positive[fieldId];
        }, 0);
        const negativeScore = Object.keys(descriptor.negative).reduce((score, fieldId) => {
            return score + (1 - clampUnitInterval(normalizedProfile[fieldId])) * descriptor.negative[fieldId];
        }, 0);

        return positiveScore + negativeScore + resolveDescriptorSynergy(normalizedProfile, descriptor);
    }

    function synthesizeLikelyWorldPattern(worldSeedProfile) {
        const normalizedProfile = normalizeWorldSeedProfile(worldSeedProfile);
        const bestDescriptor = WORLD_PATTERN_DESCRIPTORS.reduce((bestMatch, descriptor) => {
            const descriptorScore = scoreWorldPatternDescriptor(normalizedProfile, descriptor);
            if (!bestMatch || descriptorScore > bestMatch.score) {
                return {
                    id: descriptor.id,
                    score: descriptorScore
                };
            }

            return bestMatch;
        }, null);

        return bestDescriptor && typeof bestDescriptor.id === 'string'
            ? bestDescriptor.id
            : LIKELY_WORLD_PATTERN_FALLBACK;
    }

    function synthesizeLikelyConflictMode(worldSeedProfile) {
        const normalizedProfile = normalizeWorldSeedProfile(worldSeedProfile);
        const bestDescriptor = CONFLICT_MODE_DESCRIPTORS.reduce((bestMatch, descriptor) => {
            const descriptorScore = scoreConflictModeDescriptor(normalizedProfile, descriptor);
            if (!bestMatch || descriptorScore > bestMatch.score) {
                return {
                    id: descriptor.id,
                    score: descriptorScore
                };
            }

            return bestMatch;
        }, null);

        return bestDescriptor && typeof bestDescriptor.id === 'string'
            ? bestDescriptor.id
            : LIKELY_CONFLICT_MODE_FALLBACK;
    }

    function synthesizeLikelyCollapseMode(worldSeedProfile) {
        const normalizedProfile = normalizeWorldSeedProfile(worldSeedProfile);
        const bestDescriptor = COLLAPSE_MODE_DESCRIPTORS.reduce((bestMatch, descriptor) => {
            const descriptorScore = scoreCollapseModeDescriptor(normalizedProfile, descriptor);
            if (!bestMatch || descriptorScore > bestMatch.score) {
                return {
                    id: descriptor.id,
                    score: descriptorScore
                };
            }

            return bestMatch;
        }, null);

        return bestDescriptor && typeof bestDescriptor.id === 'string'
            ? bestDescriptor.id
            : LIKELY_COLLAPSE_MODE_FALLBACK;
    }

    function synthesizeLikelyReligiousPattern(worldSeedProfile) {
        const normalizedProfile = normalizeWorldSeedProfile(worldSeedProfile);
        const bestDescriptor = RELIGIOUS_PATTERN_DESCRIPTORS.reduce((bestMatch, descriptor) => {
            const descriptorScore = scoreReligiousPatternDescriptor(normalizedProfile, descriptor);
            if (!bestMatch || descriptorScore > bestMatch.score) {
                return {
                    id: descriptor.id,
                    score: descriptorScore
                };
            }

            return bestMatch;
        }, null);

        return bestDescriptor && typeof bestDescriptor.id === 'string'
            ? bestDescriptor.id
            : LIKELY_RELIGIOUS_PATTERN_FALLBACK;
    }

    function synthesizeLikelyArchipelagoRole(worldSeedProfile) {
        const normalizedProfile = normalizeWorldSeedProfile(worldSeedProfile);
        const bestDescriptor = ARCHIPELAGO_ROLE_DESCRIPTORS.reduce((bestMatch, descriptor) => {
            const descriptorScore = scoreArchipelagoRoleDescriptor(normalizedProfile, descriptor);
            if (!bestMatch || descriptorScore > bestMatch.score) {
                return {
                    id: descriptor.id,
                    score: descriptorScore
                };
            }

            return bestMatch;
        }, null);

        return bestDescriptor && typeof bestDescriptor.id === 'string'
            ? bestDescriptor.id
            : LIKELY_ARCHIPELAGO_ROLE_FALLBACK;
    }

    function deriveWorldTendencies(worldSeedProfile) {
        if (typeof phase0.createDerivedWorldTendenciesSkeleton !== 'function') {
            throw new Error('[worldgen/phase0] deriveWorldTendencies requires createDerivedWorldTendenciesSkeleton().');
        }

        const likelyWorldPattern = synthesizeLikelyWorldPattern(worldSeedProfile);
        const likelyConflictMode = synthesizeLikelyConflictMode(worldSeedProfile);
        const likelyCollapseMode = synthesizeLikelyCollapseMode(worldSeedProfile);
        const likelyReligiousPattern = synthesizeLikelyReligiousPattern(worldSeedProfile);
        const likelyArchipelagoRole = synthesizeLikelyArchipelagoRole(worldSeedProfile);
        const derivedWorldTendencies = phase0.createDerivedWorldTendenciesSkeleton({
            likelyWorldPattern,
            likelyConflictMode,
            likelyCollapseMode,
            likelyReligiousPattern,
            likelyArchipelagoRole
        });

        if (typeof phase0.assertDerivedWorldTendencies === 'function') {
            phase0.assertDerivedWorldTendencies(derivedWorldTendencies);
        }

        return deepFreeze(derivedWorldTendencies);
    }

    if (typeof phase0.registerModule === 'function') {
        phase0.registerModule('derivedTendencies', {
            entry: 'deriveWorldTendencies',
            file: 'js/worldgen/phase0/derived-tendencies.js',
            description: 'DerivedWorldTendencies synthesis with deterministic readable summaries for world pattern, conflict mode, collapse mode, religious pattern, and archipelago role.',
            stub: false
        });
        phase0.registerPipelineStep('derivedTendencies', {
            entry: 'deriveWorldTendencies',
            file: 'js/worldgen/phase0/derived-tendencies.js',
            description: 'Derived tendency synthesis with readable Phase 0 summaries for world pattern, conflict mode, collapse mode, religious pattern, and archipelago role.',
            stub: false
        });
    }

    Object.assign(phase0, {
        synthesizeLikelyWorldPattern,
        synthesizeLikelyConflictMode,
        synthesizeLikelyCollapseMode,
        synthesizeLikelyReligiousPattern,
        synthesizeLikelyArchipelagoRole,
        deriveWorldTendencies
    });
})();
