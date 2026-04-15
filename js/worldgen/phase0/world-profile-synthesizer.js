(() => {
    const game = window.Game;
    const phase0 = game.systems.worldgenPhase0 = game.systems.worldgenPhase0 || {};
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
    const NORMALIZED_AXIS_RANGE = Object.freeze({
        min: 0,
        max: 1
    });
    const ANTI_FLATNESS_CENTER = 0.5;
    const ANTI_FLATNESS_CONFIG = Object.freeze({
        deadzoneRadius: 0.18,
        minimumExpressiveDistance: 0.1,
        expansionExponent: 0.82
    });
    const RAW_AXIS_SCOPE_ID = 'phase0.worldProfile.rawAxes';
    const CORRELATION_SCOPE_ID = 'phase0.worldProfile.correlation';
    const CORRELATION_CLUSTER_IDS = Object.freeze([
        'stressCluster',
        'continuityCluster',
        'mobilityCluster',
        'volatilityCluster'
    ]);
    const CORRELATION_SHAPING_CONFIG = Object.freeze({
        conflictPressure: Object.freeze({
            selfWeight: 0.62,
            sources: Object.freeze([
                Object.freeze({ type: 'axis', id: 'collapseIntensity', weight: 0.12 }),
                Object.freeze({ type: 'axis', id: 'routeFragilityBias', weight: 0.11 }),
                Object.freeze({ type: 'cluster', id: 'stressCluster', weight: 0.15 })
            ])
        }),
        dynastyPressure: Object.freeze({
            selfWeight: 0.66,
            sources: Object.freeze([
                Object.freeze({ type: 'axis', id: 'memoryPersistence', weight: 0.12 }),
                Object.freeze({ type: 'axis', id: 'religiousInertia', weight: 0.1 }),
                Object.freeze({ type: 'cluster', id: 'continuityCluster', weight: 0.12 })
            ])
        }),
        maritimeDependence: Object.freeze({
            selfWeight: 0.6,
            sources: Object.freeze([
                Object.freeze({ type: 'axis', id: 'routeFragilityBias', weight: 0.12 }),
                Object.freeze({ type: 'axis', id: 'migrationPressure', weight: 0.08 }),
                Object.freeze({ type: 'cluster', id: 'mobilityCluster', weight: 0.1 }),
                Object.freeze({ type: 'cluster', id: 'stressCluster', weight: 0.1 })
            ])
        }),
        environmentalVolatility: Object.freeze({
            selfWeight: 0.6,
            sources: Object.freeze([
                Object.freeze({ type: 'axis', id: 'collapseIntensity', weight: 0.1 }),
                Object.freeze({ type: 'axis', id: 'routeFragilityBias', weight: 0.08 }),
                Object.freeze({ type: 'cluster', id: 'volatilityCluster', weight: 0.12 }),
                Object.freeze({ type: 'cluster', id: 'stressCluster', weight: 0.1 })
            ])
        }),
        collapseIntensity: Object.freeze({
            selfWeight: 0.58,
            sources: Object.freeze([
                Object.freeze({ type: 'axis', id: 'environmentalVolatility', weight: 0.1 }),
                Object.freeze({ type: 'axis', id: 'routeFragilityBias', weight: 0.12 }),
                Object.freeze({ type: 'axis', id: 'conflictPressure', weight: 0.08 }),
                Object.freeze({ type: 'cluster', id: 'stressCluster', weight: 0.12 })
            ])
        }),
        religiousInertia: Object.freeze({
            selfWeight: 0.64,
            sources: Object.freeze([
                Object.freeze({ type: 'axis', id: 'dynastyPressure', weight: 0.1 }),
                Object.freeze({ type: 'axis', id: 'memoryPersistence', weight: 0.12 }),
                Object.freeze({ type: 'cluster', id: 'continuityCluster', weight: 0.14 })
            ])
        }),
        institutionalPlasticity: Object.freeze({
            selfWeight: 0.62,
            sources: Object.freeze([
                Object.freeze({ type: 'axis', id: 'heroicAgencyBias', weight: 0.1 }),
                Object.freeze({ type: 'axis', id: 'culturalPermeability', weight: 0.12 }),
                Object.freeze({ type: 'cluster', id: 'mobilityCluster', weight: 0.16 })
            ])
        }),
        migrationPressure: Object.freeze({
            selfWeight: 0.62,
            sources: Object.freeze([
                Object.freeze({ type: 'axis', id: 'maritimeDependence', weight: 0.08 }),
                Object.freeze({ type: 'axis', id: 'culturalPermeability', weight: 0.1 }),
                Object.freeze({ type: 'cluster', id: 'mobilityCluster', weight: 0.2 })
            ])
        }),
        centralizationBias: Object.freeze({
            selfWeight: 0.66,
            sources: Object.freeze([
                Object.freeze({ type: 'axis', id: 'dynastyPressure', weight: 0.1 }),
                Object.freeze({ type: 'axis', id: 'memoryPersistence', weight: 0.1 }),
                Object.freeze({ type: 'cluster', id: 'continuityCluster', weight: 0.14 })
            ])
        }),
        memoryPersistence: Object.freeze({
            selfWeight: 0.62,
            sources: Object.freeze([
                Object.freeze({ type: 'axis', id: 'dynastyPressure', weight: 0.12 }),
                Object.freeze({ type: 'axis', id: 'religiousInertia', weight: 0.1 }),
                Object.freeze({ type: 'cluster', id: 'continuityCluster', weight: 0.16 })
            ])
        }),
        heroicAgencyBias: Object.freeze({
            selfWeight: 0.68,
            sources: Object.freeze([
                Object.freeze({ type: 'axis', id: 'institutionalPlasticity', weight: 0.1 }),
                Object.freeze({ type: 'axis', id: 'conflictPressure', weight: 0.08 }),
                Object.freeze({ type: 'cluster', id: 'mobilityCluster', weight: 0.14 })
            ])
        }),
        routeFragilityBias: Object.freeze({
            selfWeight: 0.58,
            sources: Object.freeze([
                Object.freeze({ type: 'axis', id: 'maritimeDependence', weight: 0.14 }),
                Object.freeze({ type: 'axis', id: 'collapseIntensity', weight: 0.12 }),
                Object.freeze({ type: 'cluster', id: 'volatilityCluster', weight: 0.08 }),
                Object.freeze({ type: 'cluster', id: 'stressCluster', weight: 0.08 })
            ])
        }),
        culturalPermeability: Object.freeze({
            selfWeight: 0.62,
            sources: Object.freeze([
                Object.freeze({ type: 'axis', id: 'migrationPressure', weight: 0.12 }),
                Object.freeze({ type: 'axis', id: 'institutionalPlasticity', weight: 0.1 }),
                Object.freeze({ type: 'cluster', id: 'mobilityCluster', weight: 0.16 })
            ])
        })
    });
    const PAIR_CONSISTENCY_RULES = Object.freeze([
        Object.freeze({
            ruleId: 'maritimeRouteFragilityTension',
            fields: Object.freeze(['maritimeDependence', 'routeFragilityBias']),
            threshold: 0.82,
            scale: 0.45,
            maxAdjustment: 0.06,
            adjustmentWeights: Object.freeze({
                maritimeDependence: 0.25,
                routeFragilityBias: 0.75
            })
        }),
        Object.freeze({
            ruleId: 'religiousInstitutionalTension',
            fields: Object.freeze(['religiousInertia', 'institutionalPlasticity']),
            threshold: 0.84,
            scale: 0.4,
            maxAdjustment: 0.05,
            adjustmentWeights: Object.freeze({
                religiousInertia: 0.35,
                institutionalPlasticity: 0.65
            })
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

    function hasOwn(objectValue, key) {
        return Boolean(objectValue) && Object.prototype.hasOwnProperty.call(objectValue, key);
    }

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function normalizeSeed(seed) {
        return typeof phase0.normalizeSeed === 'function'
            ? phase0.normalizeSeed(seed)
            : 0;
    }

    function enforceNormalizedProfileValueRange(value) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return NORMALIZED_AXIS_RANGE.min;
        }

        return Math.max(
            NORMALIZED_AXIS_RANGE.min,
            Math.min(NORMALIZED_AXIS_RANGE.max, numericValue)
        );
    }

    function getWorldSeedProfileAxisFieldIds() {
        return WORLD_SEED_PROFILE_AXIS_FIELD_IDS.slice();
    }

    function getWorldSeedProfileAxisRange() {
        return {
            min: NORMALIZED_AXIS_RANGE.min,
            max: NORMALIZED_AXIS_RANGE.max
        };
    }

    function getAntiFlatnessShapingConfig() {
        return {
            center: ANTI_FLATNESS_CENTER,
            deadzoneRadius: ANTI_FLATNESS_CONFIG.deadzoneRadius,
            minimumExpressiveDistance: ANTI_FLATNESS_CONFIG.minimumExpressiveDistance,
            expansionExponent: ANTI_FLATNESS_CONFIG.expansionExponent
        };
    }

    function getCorrelationShapingConfig() {
        return {
            scopeId: CORRELATION_SCOPE_ID,
            clusterIds: CORRELATION_CLUSTER_IDS.slice(),
            descriptors: CORRELATION_SHAPING_CONFIG
        };
    }

    function getPairConsistencyConfig() {
        return {
            rules: PAIR_CONSISTENCY_RULES
        };
    }

    function getDeferredWorldSeedProfileFields() {
        return getWorldSeedProfileAxisFieldIds();
    }

    function resolveNormalizedPhase0Input(baseSeed, options = {}) {
        if (typeof phase0.normalizePhase0Input === 'function') {
            return phase0.normalizePhase0Input(baseSeed, options);
        }

        return deepFreeze({
            baseRandomSeed: normalizeSeed(baseSeed),
            worldPresetMode: null,
            hardConstraintsProfile: null
        });
    }

    function createRawAxisRng(seed) {
        if (typeof phase0.createPhase0Rng !== 'function') {
            throw new Error('[worldgen/phase0] buildWorldSeedProfile requires createPhase0Rng().');
        }

        return phase0.createPhase0Rng(seed, {
            scopeId: RAW_AXIS_SCOPE_ID
        });
    }

    function createCorrelationRng(seed) {
        if (typeof phase0.createPhase0Rng !== 'function') {
            throw new Error('[worldgen/phase0] applyCorrelationShaping requires createPhase0Rng().');
        }

        return phase0.createPhase0Rng(seed, {
            scopeId: CORRELATION_SCOPE_ID
        });
    }

    function createRawLatentAxisMap(normalizedInput) {
        const rng = createRawAxisRng(normalizedInput.baseRandomSeed);
        const hardConstraintsProfile = isPlainObject(normalizedInput.hardConstraintsProfile)
            ? normalizedInput.hardConstraintsProfile
            : {};

        // TODO CONTRACTED: later shaping passes may reshape these raw values,
        // but this stage only produces deterministic seeded draws.
        return deepFreeze(
            WORLD_SEED_PROFILE_AXIS_FIELD_IDS.reduce((rawAxes, fieldId) => {
                const seededSample = rng.nextFloat();
                rawAxes[fieldId] = hasOwn(hardConstraintsProfile, fieldId)
                    ? hardConstraintsProfile[fieldId]
                    : seededSample;
                return rawAxes;
            }, {})
        );
    }

    function sampleCorrelationClusters(seed) {
        const rng = createCorrelationRng(seed);

        return deepFreeze(
            CORRELATION_CLUSTER_IDS.reduce((clusters, clusterId) => {
                clusters[clusterId] = rng.nextFloat();
                return clusters;
            }, {})
        );
    }

    function enforceNormalizedLatentAxisRanges(rawLatentAxes = {}) {
        const normalizedRawLatentAxes = isPlainObject(rawLatentAxes)
            ? rawLatentAxes
            : {};

        // TODO CONTRACTED: later shaping passes may transform the values
        // inside the range, but this layer only enforces [0, 1] safety.
        return deepFreeze(
            WORLD_SEED_PROFILE_AXIS_FIELD_IDS.reduce((normalizedAxes, fieldId) => {
                normalizedAxes[fieldId] = enforceNormalizedProfileValueRange(
                    normalizedRawLatentAxes[fieldId]
                );
                return normalizedAxes;
            }, {})
        );
    }

    function resolveCorrelationSourceValue(sourceDescriptor, normalizedLatentAxes, correlationClusters) {
        if (!sourceDescriptor || typeof sourceDescriptor !== 'object') {
            return ANTI_FLATNESS_CENTER;
        }

        if (sourceDescriptor.type === 'cluster') {
            return enforceNormalizedProfileValueRange(
                correlationClusters[sourceDescriptor.id]
            );
        }

        return enforceNormalizedProfileValueRange(
            normalizedLatentAxes[sourceDescriptor.id]
        );
    }

    function shapeCorrelatedAxisValue(fieldId, normalizedLatentAxes, correlationClusters) {
        const axisDescriptor = CORRELATION_SHAPING_CONFIG[fieldId];
        const baseValue = enforceNormalizedProfileValueRange(
            normalizedLatentAxes[fieldId]
        );

        if (!axisDescriptor) {
            return baseValue;
        }

        const correlatedValue = axisDescriptor.sources.reduce((sum, sourceDescriptor) => {
            return sum + resolveCorrelationSourceValue(
                sourceDescriptor,
                normalizedLatentAxes,
                correlationClusters
            ) * sourceDescriptor.weight;
        }, baseValue * axisDescriptor.selfWeight);

        return enforceNormalizedProfileValueRange(correlatedValue);
    }

    function applyCorrelationShaping(normalizedLatentAxes = {}, seed = 0, hardConstraintsProfile = null) {
        const normalizedAxisMap = isPlainObject(normalizedLatentAxes)
            ? normalizedLatentAxes
            : {};
        const normalizedHardConstraintsProfile = isPlainObject(hardConstraintsProfile)
            ? hardConstraintsProfile
            : {};
        const correlationClusters = sampleCorrelationClusters(seed);

        // TODO CONTRACTED: final pair consistency adjustment remains a
        // separate pass; this layer only applies deterministic correlations.
        return deepFreeze(
            WORLD_SEED_PROFILE_AXIS_FIELD_IDS.reduce((correlatedAxes, fieldId) => {
                const axisValue = enforceNormalizedProfileValueRange(
                    normalizedAxisMap[fieldId]
                );
                correlatedAxes[fieldId] = hasOwn(normalizedHardConstraintsProfile, fieldId)
                    ? axisValue
                    : shapeCorrelatedAxisValue(
                        fieldId,
                        normalizedAxisMap,
                        correlationClusters
                    );
                return correlatedAxes;
            }, {})
        );
    }

    function resolveAntiFlatnessDirection(fieldId, value) {
        if (value > ANTI_FLATNESS_CENTER) {
            return 1;
        }

        if (value < ANTI_FLATNESS_CENTER) {
            return -1;
        }

        const fieldIndex = WORLD_SEED_PROFILE_AXIS_FIELD_IDS.indexOf(fieldId);
        return fieldIndex % 2 === 0 ? 1 : -1;
    }

    function shapeAntiFlatnessValue(fieldId, value) {
        const clampedValue = enforceNormalizedProfileValueRange(value);
        const direction = resolveAntiFlatnessDirection(fieldId, clampedValue);
        const distanceFromCenter = Math.abs(clampedValue - ANTI_FLATNESS_CENTER);
        const normalizedDistance = distanceFromCenter / ANTI_FLATNESS_CENTER;
        const expandedDistance = Math.pow(normalizedDistance, ANTI_FLATNESS_CONFIG.expansionExponent)
            * ANTI_FLATNESS_CENTER;
        const expressiveFloor = distanceFromCenter < ANTI_FLATNESS_CONFIG.deadzoneRadius
            ? ANTI_FLATNESS_CONFIG.minimumExpressiveDistance
                + (distanceFromCenter / ANTI_FLATNESS_CONFIG.deadzoneRadius)
                    * (ANTI_FLATNESS_CONFIG.deadzoneRadius - ANTI_FLATNESS_CONFIG.minimumExpressiveDistance)
            : distanceFromCenter;
        const shapedDistance = Math.max(expandedDistance, expressiveFloor);

        return enforceNormalizedProfileValueRange(
            ANTI_FLATNESS_CENTER + direction * shapedDistance
        );
    }

    function applyAntiFlatnessShaping(normalizedLatentAxes = {}, hardConstraintsProfile = null) {
        const normalizedAxisMap = isPlainObject(normalizedLatentAxes)
            ? normalizedLatentAxes
            : {};
        const normalizedHardConstraintsProfile = isPlainObject(hardConstraintsProfile)
            ? hardConstraintsProfile
            : {};

        // TODO CONTRACTED: pair consistency remains a later pass; this layer
        // only fights flat mid-range sludge after correlation shaping.
        return deepFreeze(
            WORLD_SEED_PROFILE_AXIS_FIELD_IDS.reduce((shapedAxes, fieldId) => {
                const axisValue = enforceNormalizedProfileValueRange(
                    normalizedAxisMap[fieldId]
                );
                shapedAxes[fieldId] = hasOwn(normalizedHardConstraintsProfile, fieldId)
                    ? axisValue
                    : shapeAntiFlatnessValue(fieldId, axisValue);
                return shapedAxes;
            }, {})
        );
    }

    function cloneAxisMap(axisMap = {}) {
        return WORLD_SEED_PROFILE_AXIS_FIELD_IDS.reduce((nextAxisMap, fieldId) => {
            nextAxisMap[fieldId] = enforceNormalizedProfileValueRange(axisMap[fieldId]);
            return nextAxisMap;
        }, {});
    }

    function resolvePairAdjustmentMagnitude(leftValue, rightValue, rule) {
        const lowerValue = Math.min(leftValue, rightValue);
        if (lowerValue <= rule.threshold) {
            return 0;
        }

        return Math.min(
            rule.maxAdjustment,
            (lowerValue - rule.threshold) * rule.scale
        );
    }

    function applyPairConsistencyRule(axisMap, rule, hardConstraintsProfile) {
        const nextAxisMap = cloneAxisMap(axisMap);
        const normalizedHardConstraintsProfile = isPlainObject(hardConstraintsProfile)
            ? hardConstraintsProfile
            : {};
        const [leftFieldId, rightFieldId] = rule.fields;
        const leftValue = nextAxisMap[leftFieldId];
        const rightValue = nextAxisMap[rightFieldId];
        const adjustmentMagnitude = resolvePairAdjustmentMagnitude(leftValue, rightValue, rule);

        if (adjustmentMagnitude <= 0) {
            return nextAxisMap;
        }

        const leftLocked = hasOwn(normalizedHardConstraintsProfile, leftFieldId);
        const rightLocked = hasOwn(normalizedHardConstraintsProfile, rightFieldId);

        if (leftLocked && rightLocked) {
            return nextAxisMap;
        }

        if (!leftLocked) {
            nextAxisMap[leftFieldId] = enforceNormalizedProfileValueRange(
                leftValue - adjustmentMagnitude * rule.adjustmentWeights[leftFieldId]
            );
        }

        if (!rightLocked) {
            nextAxisMap[rightFieldId] = enforceNormalizedProfileValueRange(
                rightValue - adjustmentMagnitude * rule.adjustmentWeights[rightFieldId]
            );
        }

        return nextAxisMap;
    }

    function applyPairConsistencyAdjustment(shapedLatentAxes = {}, hardConstraintsProfile = null) {
        const baseAxisMap = cloneAxisMap(
            isPlainObject(shapedLatentAxes)
                ? shapedLatentAxes
                : {}
        );

        // TODO CONTRACTED: this is a local contradiction softener, not a full
        // validation loop or a world-tone-aware semantic adjudication pass.
        const adjustedAxisMap = PAIR_CONSISTENCY_RULES.reduce((workingAxisMap, rule) => {
            return applyPairConsistencyRule(
                workingAxisMap,
                rule,
                hardConstraintsProfile
            );
        }, baseAxisMap);

        return deepFreeze(adjustedAxisMap);
    }

    function resolveSynthesizedWorldTone(worldSeedProfile) {
        if (typeof phase0.synthesizeWorldTone !== 'function') {
            return worldSeedProfile.worldTone;
        }

        return phase0.synthesizeWorldTone(worldSeedProfile);
    }

    function buildWorldSeedProfile(baseSeed, options = {}) {
        const normalizedInput = resolveNormalizedPhase0Input(baseSeed, options);
        const rawLatentAxes = createRawLatentAxisMap(normalizedInput);
        const normalizedLatentAxes = enforceNormalizedLatentAxisRanges(rawLatentAxes);
        const correlatedLatentAxes = applyCorrelationShaping(
            normalizedLatentAxes,
            normalizedInput.baseRandomSeed,
            normalizedInput.hardConstraintsProfile
        );
        const shapedLatentAxes = applyAntiFlatnessShaping(
            correlatedLatentAxes,
            normalizedInput.hardConstraintsProfile
        );
        const pairAdjustedLatentAxes = applyPairConsistencyAdjustment(
            shapedLatentAxes,
            normalizedInput.hardConstraintsProfile
        );

        if (typeof phase0.createWorldSeedProfileSkeleton !== 'function') {
            throw new Error('[worldgen/phase0] buildWorldSeedProfile requires createWorldSeedProfileSkeleton().');
        }

        const preliminaryWorldSeedProfile = phase0.createWorldSeedProfileSkeleton({
            worldSeed: normalizedInput.baseRandomSeed,
            ...pairAdjustedLatentAxes
        });
        const worldTone = resolveSynthesizedWorldTone(preliminaryWorldSeedProfile);
        const worldSeedProfile = phase0.createWorldSeedProfileSkeleton({
            ...preliminaryWorldSeedProfile,
            worldTone
        });

        if (typeof phase0.assertWorldSeedProfile === 'function') {
            phase0.assertWorldSeedProfile(worldSeedProfile);
        }

        return deepFreeze(worldSeedProfile);
    }

    if (typeof phase0.registerModule === 'function') {
        phase0.registerModule('worldProfileSynthesizer', {
            entry: 'buildWorldSeedProfile',
            file: 'js/worldgen/phase0/world-profile-synthesizer.js',
            description: 'WorldSeedProfile synthesis with deterministic raw latent-axis generation, range enforcement, correlation shaping, anti-flatness shaping, pair consistency adjustment, and derived descriptive worldTone synthesis.',
            stub: false
        });
        phase0.registerPipelineStep('worldProfileSynthesis', {
            entry: 'buildWorldSeedProfile',
            file: 'js/worldgen/phase0/world-profile-synthesizer.js',
            description: 'Phase 0 profile synthesis with deterministic raw latent-axis generation, explicit [0, 1] range enforcement, correlation shaping, anti-flatness shaping, pair consistency adjustment, and derived worldTone synthesis.',
            stub: false
        });
    }

    Object.assign(phase0, {
        getAntiFlatnessShapingConfig,
        getCorrelationShapingConfig,
        getPairConsistencyConfig,
        enforceNormalizedProfileValueRange,
        enforceNormalizedLatentAxisRanges,
        sampleCorrelationClusters,
        shapeCorrelatedAxisValue,
        applyCorrelationShaping,
        shapeAntiFlatnessValue,
        applyAntiFlatnessShaping,
        applyPairConsistencyAdjustment,
        getWorldSeedProfileAxisFieldIds,
        getWorldSeedProfileAxisRange,
        getDeferredWorldSeedProfileFields,
        buildWorldSeedProfile
    });
})();
