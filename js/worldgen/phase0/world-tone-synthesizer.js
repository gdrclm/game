(() => {
    const game = window.Game;
    const phase0 = game.systems.worldgenPhase0 = game.systems.worldgenPhase0 || {};
    const WORLD_TONE_FALLBACK = 'fractured_maritime_age';
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
    const WORLD_TONE_DESCRIPTORS = Object.freeze([
        Object.freeze({
            id: 'storm_shattered_trade_world',
            positive: Object.freeze({
                maritimeDependence: 0.26,
                environmentalVolatility: 0.24,
                routeFragilityBias: 0.2,
                collapseIntensity: 0.14,
                culturalPermeability: 0.08,
                migrationPressure: 0.08
            }),
            negative: Object.freeze({
                centralizationBias: 0.06
            }),
            synergyFields: Object.freeze([
                'maritimeDependence',
                'environmentalVolatility',
                'routeFragilityBias'
            ]),
            synergyWeight: 0.12
        }),
        Object.freeze({
            id: 'fractured_maritime_age',
            positive: Object.freeze({
                maritimeDependence: 0.28,
                routeFragilityBias: 0.2,
                conflictPressure: 0.16,
                collapseIntensity: 0.14,
                migrationPressure: 0.1,
                culturalPermeability: 0.06
            }),
            negative: Object.freeze({
                centralizationBias: 0.06
            }),
            synergyFields: Object.freeze([
                'maritimeDependence',
                'routeFragilityBias',
                'conflictPressure'
            ]),
            synergyWeight: 0.1
        }),
        Object.freeze({
            id: 'dynastic_collapse_frontier',
            positive: Object.freeze({
                dynastyPressure: 0.24,
                collapseIntensity: 0.22,
                heroicAgencyBias: 0.16,
                migrationPressure: 0.14,
                conflictPressure: 0.12,
                centralizationBias: 0.06
            }),
            negative: Object.freeze({
                religiousInertia: 0.06
            }),
            synergyFields: Object.freeze([
                'dynastyPressure',
                'collapseIntensity',
                'heroicAgencyBias'
            ]),
            synergyWeight: 0.1
        }),
        Object.freeze({
            id: 'continental_iron_order',
            positive: Object.freeze({
                centralizationBias: 0.26,
                dynastyPressure: 0.16,
                conflictPressure: 0.14,
                memoryPersistence: 0.12,
                religiousInertia: 0.08
            }),
            negative: Object.freeze({
                maritimeDependence: 0.1,
                culturalPermeability: 0.08,
                institutionalPlasticity: 0.06
            }),
            synergyFields: Object.freeze([
                'centralizationBias',
                'dynastyPressure',
                'conflictPressure'
            ]),
            synergyWeight: 0.12
        }),
        Object.freeze({
            id: 'ritual_basin_civilization',
            positive: Object.freeze({
                religiousInertia: 0.28,
                memoryPersistence: 0.18,
                centralizationBias: 0.12,
                dynastyPressure: 0.1
            }),
            negative: Object.freeze({
                environmentalVolatility: 0.12,
                routeFragilityBias: 0.1,
                institutionalPlasticity: 0.1
            }),
            synergyFields: Object.freeze([
                'religiousInertia',
                'memoryPersistence',
                'centralizationBias'
            ]),
            synergyWeight: 0.1
        }),
        Object.freeze({
            id: 'migratory_open_world',
            positive: Object.freeze({
                migrationPressure: 0.24,
                culturalPermeability: 0.24,
                institutionalPlasticity: 0.18,
                maritimeDependence: 0.08,
                heroicAgencyBias: 0.08
            }),
            negative: Object.freeze({
                routeFragilityBias: 0.08,
                religiousInertia: 0.1
            }),
            synergyFields: Object.freeze([
                'migrationPressure',
                'culturalPermeability',
                'institutionalPlasticity'
            ]),
            synergyWeight: 0.1
        }),
        Object.freeze({
            id: 'heroic_shatterbelt_age',
            positive: Object.freeze({
                heroicAgencyBias: 0.22,
                conflictPressure: 0.18,
                collapseIntensity: 0.18,
                institutionalPlasticity: 0.12,
                culturalPermeability: 0.12,
                migrationPressure: 0.08
            }),
            negative: Object.freeze({
                centralizationBias: 0.1
            }),
            synergyFields: Object.freeze([
                'heroicAgencyBias',
                'conflictPressure',
                'collapseIntensity'
            ]),
            synergyWeight: 0.1
        })
    ]);

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

    function getAxisFieldIds() {
        if (typeof phase0.getWorldSeedProfileAxisFieldIds === 'function') {
            const fieldIds = phase0.getWorldSeedProfileAxisFieldIds();
            if (Array.isArray(fieldIds) && fieldIds.length > 0) {
                return fieldIds.slice();
            }
        }

        return WORLD_SEED_PROFILE_AXIS_FIELD_IDS.slice();
    }

    function normalizeWorldToneProfile(worldSeedProfile) {
        const normalizedProfile = isPlainObject(worldSeedProfile)
            ? worldSeedProfile
            : {};

        return getAxisFieldIds().reduce((numericProfile, fieldId) => {
            numericProfile[fieldId] = clampUnitInterval(normalizedProfile[fieldId]);
            return numericProfile;
        }, {});
    }

    function resolveSynergyScore(normalizedProfile, descriptor) {
        if (!Array.isArray(descriptor.synergyFields) || descriptor.synergyFields.length === 0) {
            return 0;
        }

        const synergyBase = descriptor.synergyFields.reduce((lowestValue, fieldId) => {
            return Math.min(lowestValue, clampUnitInterval(normalizedProfile[fieldId]));
        }, 1);

        return synergyBase * clampUnitInterval(descriptor.synergyWeight);
    }

    function scoreWorldToneDescriptor(normalizedProfile, descriptor) {
        const positiveScore = Object.keys(descriptor.positive).reduce((score, fieldId) => {
            return score + clampUnitInterval(normalizedProfile[fieldId]) * descriptor.positive[fieldId];
        }, 0);
        const negativeScore = Object.keys(descriptor.negative).reduce((score, fieldId) => {
            return score + (1 - clampUnitInterval(normalizedProfile[fieldId])) * descriptor.negative[fieldId];
        }, 0);

        return positiveScore + negativeScore + resolveSynergyScore(normalizedProfile, descriptor);
    }

    function selectWorldToneDescriptor(normalizedProfile) {
        return WORLD_TONE_DESCRIPTORS.reduce((bestDescriptor, descriptor) => {
            const descriptorScore = scoreWorldToneDescriptor(normalizedProfile, descriptor);
            if (!bestDescriptor || descriptorScore > bestDescriptor.score) {
                return {
                    id: descriptor.id,
                    score: descriptorScore
                };
            }

            return bestDescriptor;
        }, null);
    }

    function synthesizeWorldTone(worldSeedProfile) {
        const normalizedProfile = normalizeWorldToneProfile(worldSeedProfile);
        const descriptor = selectWorldToneDescriptor(normalizedProfile);

        return descriptor && typeof descriptor.id === 'string'
            ? descriptor.id
            : WORLD_TONE_FALLBACK;
    }

    if (typeof phase0.registerModule === 'function') {
        phase0.registerModule('worldToneSynthesizer', {
            entry: 'synthesizeWorldTone',
            file: 'js/worldgen/phase0/world-tone-synthesizer.js',
            description: 'Readable worldTone synthesis derived from the numeric Phase 0 profile without using preset modes as final truth.',
            stub: false
        });
        phase0.registerPipelineStep('worldToneSynthesis', {
            entry: 'synthesizeWorldTone',
            file: 'js/worldgen/phase0/world-tone-synthesizer.js',
            description: 'Readable descriptive worldTone synthesis derived from the numeric profile without replacing or controlling the profile itself.',
            stub: false
        });
    }

    Object.assign(phase0, {
        synthesizeWorldTone
    });
})();
