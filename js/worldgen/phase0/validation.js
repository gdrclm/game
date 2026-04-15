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
    const EXPRESSIVENESS_CENTER = 0.5;
    const EXPRESSIVENESS_SCORING_CONFIG = Object.freeze({
        meanDistanceWeight: 0.7,
        rangeWeight: 0.3
    });
    const CONTROLLED_EXTREMENESS_CONFIG = Object.freeze({
        extremeThreshold: 0.88,
        cautionThreshold: 0.76,
        cautionPenaltyWeight: 0.35,
        extremePenaltyWeight: 0.65
    });
    const DERIVED_READABILITY_CONFIG = Object.freeze({
        coverageWeight: 0.26,
        descriptorShapeWeight: 0.26,
        uniquenessWeight: 0.16,
        tokenVarietyWeight: 0.12,
        canonicalConsistencyWeight: 0.2,
        preferredSingleTokenMinLength: 5,
        maxDescriptorTokenCount: 4
    });
    const DOWNSTREAM_USABILITY_CONFIG = Object.freeze({
        profileAvailabilityWeight: 0.24,
        worldToneAvailabilityWeight: 0.08,
        derivedCoverageWeight: 0.18,
        subSeedCoverageWeight: 0.24,
        subSeedDistinctnessWeight: 0.12,
        canonicalConsistencyWeight: 0.14
    });
    const REROLL_ADVICE_CONFIG = Object.freeze({
        latentExpressivenessMax: 0.42,
        correlationExpressivenessMin: 0.42,
        correlationControlledExtremenessMax: 0.58,
        correlationDerivedReadabilityMax: 0.68,
        fullPhase0DownstreamUsabilityMax: 0.5,
        fullPhase0ArchipelagoPotentialMax: 0.28,
        fullPhase0ControlledExtremenessMax: 0.24,
        fullPhase0DerivedReadabilityMax: 0.34,
        fullPhase0SevereFailureCountMin: 2
    });
    const ARCHIPELAGO_POTENTIAL_CONFIG = Object.freeze({
        maritimeWeight: 0.4,
        routeFragilityWeight: 0.18,
        migrationWeight: 0.16,
        culturalPermeabilityWeight: 0.14,
        collapseSupportWeight: 0.12,
        synergyWeight: 0.15,
        maritimeFloorThreshold: 0.3
    });
    const DERIVED_TENDENCY_FIELD_IDS = Object.freeze([
        'likelyWorldPattern',
        'likelyConflictMode',
        'likelyCollapseMode',
        'likelyReligiousPattern',
        'likelyArchipelagoRole'
    ]);
    const validationScoreIds = Object.freeze([
        'expressiveness',
        'controlledExtremeness',
        'derivedReadability',
        'archipelagoPotential',
        'downstreamUsability'
    ]);
    const validationDiagnosticFieldIds = Object.freeze([
        'warnings',
        'rerollAdvice',
        'blockedDownstreamPhases'
    ]);
    const PHASE0_REROLL_ADVICE_IDS = Object.freeze([
        'latent_reroll',
        'correlation_reroll',
        'full_phase0_reroll'
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

    function hasOwn(objectValue, key) {
        return Boolean(objectValue) && Object.prototype.hasOwnProperty.call(objectValue, key);
    }

    function isUint32(value) {
        return Number.isInteger(value) && value >= 0 && value <= 0xffffffff;
    }

    function clampUnitInterval(value) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 0;
        }

        return Math.max(0, Math.min(1, numericValue));
    }

    function normalizeStringArray(value) {
        return Array.isArray(value)
            ? value.map((entry) => `${entry}`)
            : [];
    }

    function uniqueStringArray(values) {
        return Array.from(new Set(normalizeStringArray(values).filter(Boolean)));
    }

    function getWorldSeedProfileAxisFieldIds() {
        if (typeof phase0.getWorldSeedProfileAxisFieldIds === 'function') {
            const fieldIds = phase0.getWorldSeedProfileAxisFieldIds();
            if (Array.isArray(fieldIds) && fieldIds.length > 0) {
                return fieldIds.slice();
            }
        }

        return WORLD_SEED_PROFILE_AXIS_FIELD_IDS.slice();
    }

    function getPhase0ExpressivenessScoringConfig() {
        return {
            center: EXPRESSIVENESS_CENTER,
            meanDistanceWeight: EXPRESSIVENESS_SCORING_CONFIG.meanDistanceWeight,
            rangeWeight: EXPRESSIVENESS_SCORING_CONFIG.rangeWeight
        };
    }

    function getPhase0ControlledExtremenessScoringConfig() {
        return {
            extremeThreshold: CONTROLLED_EXTREMENESS_CONFIG.extremeThreshold,
            cautionThreshold: CONTROLLED_EXTREMENESS_CONFIG.cautionThreshold,
            cautionPenaltyWeight: CONTROLLED_EXTREMENESS_CONFIG.cautionPenaltyWeight,
            extremePenaltyWeight: CONTROLLED_EXTREMENESS_CONFIG.extremePenaltyWeight
        };
    }

    function getPhase0DerivedReadabilityScoringConfig() {
        return {
            coverageWeight: DERIVED_READABILITY_CONFIG.coverageWeight,
            descriptorShapeWeight: DERIVED_READABILITY_CONFIG.descriptorShapeWeight,
            uniquenessWeight: DERIVED_READABILITY_CONFIG.uniquenessWeight,
            tokenVarietyWeight: DERIVED_READABILITY_CONFIG.tokenVarietyWeight,
            canonicalConsistencyWeight: DERIVED_READABILITY_CONFIG.canonicalConsistencyWeight,
            preferredSingleTokenMinLength: DERIVED_READABILITY_CONFIG.preferredSingleTokenMinLength,
            maxDescriptorTokenCount: DERIVED_READABILITY_CONFIG.maxDescriptorTokenCount
        };
    }

    function getPhase0DownstreamUsabilityScoringConfig() {
        return {
            profileAvailabilityWeight: DOWNSTREAM_USABILITY_CONFIG.profileAvailabilityWeight,
            worldToneAvailabilityWeight: DOWNSTREAM_USABILITY_CONFIG.worldToneAvailabilityWeight,
            derivedCoverageWeight: DOWNSTREAM_USABILITY_CONFIG.derivedCoverageWeight,
            subSeedCoverageWeight: DOWNSTREAM_USABILITY_CONFIG.subSeedCoverageWeight,
            subSeedDistinctnessWeight: DOWNSTREAM_USABILITY_CONFIG.subSeedDistinctnessWeight,
            canonicalConsistencyWeight: DOWNSTREAM_USABILITY_CONFIG.canonicalConsistencyWeight
        };
    }

    function getPhase0RerollAdviceConfig() {
        return {
            latentExpressivenessMax: REROLL_ADVICE_CONFIG.latentExpressivenessMax,
            correlationExpressivenessMin: REROLL_ADVICE_CONFIG.correlationExpressivenessMin,
            correlationControlledExtremenessMax: REROLL_ADVICE_CONFIG.correlationControlledExtremenessMax,
            correlationDerivedReadabilityMax: REROLL_ADVICE_CONFIG.correlationDerivedReadabilityMax,
            fullPhase0DownstreamUsabilityMax: REROLL_ADVICE_CONFIG.fullPhase0DownstreamUsabilityMax,
            fullPhase0ArchipelagoPotentialMax: REROLL_ADVICE_CONFIG.fullPhase0ArchipelagoPotentialMax,
            fullPhase0ControlledExtremenessMax: REROLL_ADVICE_CONFIG.fullPhase0ControlledExtremenessMax,
            fullPhase0DerivedReadabilityMax: REROLL_ADVICE_CONFIG.fullPhase0DerivedReadabilityMax,
            fullPhase0SevereFailureCountMin: REROLL_ADVICE_CONFIG.fullPhase0SevereFailureCountMin
        };
    }

    function getPhase0ArchipelagoPotentialScoringConfig() {
        return {
            maritimeWeight: ARCHIPELAGO_POTENTIAL_CONFIG.maritimeWeight,
            routeFragilityWeight: ARCHIPELAGO_POTENTIAL_CONFIG.routeFragilityWeight,
            migrationWeight: ARCHIPELAGO_POTENTIAL_CONFIG.migrationWeight,
            culturalPermeabilityWeight: ARCHIPELAGO_POTENTIAL_CONFIG.culturalPermeabilityWeight,
            collapseSupportWeight: ARCHIPELAGO_POTENTIAL_CONFIG.collapseSupportWeight,
            synergyWeight: ARCHIPELAGO_POTENTIAL_CONFIG.synergyWeight,
            maritimeFloorThreshold: ARCHIPELAGO_POTENTIAL_CONFIG.maritimeFloorThreshold
        };
    }

    function normalizeWorldSeedProfileForValidation(worldSeedProfile) {
        if (typeof phase0.createWorldSeedProfileSkeleton === 'function') {
            return phase0.createWorldSeedProfileSkeleton(
                isPlainObject(worldSeedProfile)
                    ? worldSeedProfile
                    : {}
            );
        }

        return isPlainObject(worldSeedProfile)
            ? worldSeedProfile
            : {};
    }

    function resolveValidationWorldSeedProfile(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};

        if (isPlainObject(normalizedInput.worldSeedProfile)) {
            return normalizeWorldSeedProfileForValidation(normalizedInput.worldSeedProfile);
        }

        return null;
    }

    function normalizeDescriptorId(value) {
        return typeof value === 'string' && value.trim()
            ? value.trim()
            : '';
    }

    function tokenizeDescriptorId(descriptorId) {
        const normalizedDescriptorId = normalizeDescriptorId(descriptorId);
        if (!/^[a-z]+(?:_[a-z]+)*$/.test(normalizedDescriptorId)) {
            return [];
        }

        return normalizedDescriptorId.split('_').filter(Boolean);
    }

    function normalizeDerivedWorldTendenciesForValidation(derivedWorldTendencies) {
        if (typeof phase0.createDerivedWorldTendenciesSkeleton === 'function') {
            return phase0.createDerivedWorldTendenciesSkeleton(
                isPlainObject(derivedWorldTendencies)
                    ? derivedWorldTendencies
                    : {}
            );
        }

        return isPlainObject(derivedWorldTendencies)
            ? derivedWorldTendencies
            : {};
    }

    function resolveValidationWorldTone(input = {}, resolvedWorldSeedProfile = null) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const explicitWorldTone = normalizeDescriptorId(normalizedInput.worldTone);
        if (explicitWorldTone) {
            return explicitWorldTone;
        }

        const profileWorldTone = normalizeDescriptorId(
            resolvedWorldSeedProfile && resolvedWorldSeedProfile.worldTone
        );
        if (profileWorldTone) {
            return profileWorldTone;
        }

        if (resolvedWorldSeedProfile && typeof phase0.synthesizeWorldTone === 'function') {
            return normalizeDescriptorId(
                phase0.synthesizeWorldTone(resolvedWorldSeedProfile)
            );
        }

        return '';
    }

    function resolveValidationDerivedWorldTendencies(input = {}, resolvedWorldSeedProfile = null) {
        const normalizedInput = isPlainObject(input) ? input : {};
        if (isPlainObject(normalizedInput.derivedWorldTendencies)) {
            return normalizeDerivedWorldTendenciesForValidation(normalizedInput.derivedWorldTendencies);
        }

        if (resolvedWorldSeedProfile && typeof phase0.deriveWorldTendencies === 'function') {
            return normalizeDerivedWorldTendenciesForValidation(
                phase0.deriveWorldTendencies(resolvedWorldSeedProfile)
            );
        }

        return null;
    }

    function normalizeWorldSubSeedMapForValidation(worldSubSeedMap) {
        if (typeof phase0.createWorldSubSeedMapSkeleton === 'function') {
            return phase0.createWorldSubSeedMapSkeleton(
                isPlainObject(worldSubSeedMap)
                    ? worldSubSeedMap
                    : {}
            );
        }

        return isPlainObject(worldSubSeedMap)
            ? worldSubSeedMap
            : {};
    }

    function resolveValidationWorldSubSeedMap(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        if (!isPlainObject(normalizedInput.worldSubSeedMap)) {
            return null;
        }

        return normalizeWorldSubSeedMapForValidation(normalizedInput.worldSubSeedMap);
    }

    function getDownstreamPhaseNamespaceRegistry() {
        if (typeof phase0.getPhaseSubSeedNamespaceRegistry === 'function') {
            const registry = phase0.getPhaseSubSeedNamespaceRegistry();
            if (Array.isArray(registry) || isPlainObject(registry)) {
                return registry;
            }
        }

        return [];
    }

    function getDownstreamPhaseNamespaceEntries() {
        const registry = getDownstreamPhaseNamespaceRegistry();
        const rawEntries = Array.isArray(registry)
            ? registry.map((entry) => {
                return [entry && entry.contractKey, entry];
            })
            : Object.entries(registry);

        return rawEntries.map(([contractKey, entry]) => {
            return {
                contractKey,
                namespaceId: normalizeDescriptorId(entry && entry.namespaceId),
                phaseNumber: Number(entry && entry.phaseNumber),
                phaseSlug: normalizeDescriptorId(entry && entry.phaseSlug),
                phaseLabel: normalizeDescriptorId(entry && entry.phaseLabel)
            };
        }).sort((leftEntry, rightEntry) => {
            return leftEntry.phaseNumber - rightEntry.phaseNumber;
        });
    }

    function resolveDownstreamUsabilityContext(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const resolvedWorldSeedProfile = resolveValidationWorldSeedProfile(normalizedInput);
        const resolvedWorldTone = resolveValidationWorldTone(normalizedInput, resolvedWorldSeedProfile);
        const resolvedDerivedWorldTendencies = resolveValidationDerivedWorldTendencies(
            normalizedInput,
            resolvedWorldSeedProfile
        );
        const resolvedWorldSubSeedMap = resolveValidationWorldSubSeedMap(normalizedInput);
        const canonicalWorldTone = resolvedWorldSeedProfile && typeof phase0.synthesizeWorldTone === 'function'
            ? normalizeDescriptorId(phase0.synthesizeWorldTone(resolvedWorldSeedProfile))
            : resolvedWorldTone;
        const canonicalDerivedWorldTendencies = resolvedWorldSeedProfile && typeof phase0.deriveWorldTendencies === 'function'
            ? normalizeDerivedWorldTendenciesForValidation(
                phase0.deriveWorldTendencies(resolvedWorldSeedProfile)
            )
            : resolvedDerivedWorldTendencies;
        const canonicalWorldSubSeedMap = resolvedWorldSeedProfile
            && typeof phase0.deriveWorldSubSeedMap === 'function'
            && isUint32(resolvedWorldSeedProfile.worldSeed)
            ? normalizeWorldSubSeedMapForValidation(
                phase0.deriveWorldSubSeedMap(resolvedWorldSeedProfile.worldSeed, resolvedWorldSeedProfile)
            )
            : null;

        return {
            resolvedWorldSeedProfile,
            resolvedWorldTone,
            resolvedDerivedWorldTendencies,
            resolvedWorldSubSeedMap,
            canonicalWorldTone,
            canonicalDerivedWorldTendencies,
            canonicalWorldSubSeedMap,
            namespaceEntries: getDownstreamPhaseNamespaceEntries()
        };
    }

    function resolveDerivedReadabilityContext(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const resolvedWorldSeedProfile = resolveValidationWorldSeedProfile(normalizedInput);
        const resolvedWorldTone = resolveValidationWorldTone(normalizedInput, resolvedWorldSeedProfile);
        const resolvedDerivedWorldTendencies = resolveValidationDerivedWorldTendencies(
            normalizedInput,
            resolvedWorldSeedProfile
        );
        const canonicalWorldTone = resolvedWorldSeedProfile && typeof phase0.synthesizeWorldTone === 'function'
            ? normalizeDescriptorId(phase0.synthesizeWorldTone(resolvedWorldSeedProfile))
            : resolvedWorldTone;
        const canonicalDerivedWorldTendencies = resolvedWorldSeedProfile && typeof phase0.deriveWorldTendencies === 'function'
            ? normalizeDerivedWorldTendenciesForValidation(
                phase0.deriveWorldTendencies(resolvedWorldSeedProfile)
            )
            : resolvedDerivedWorldTendencies;

        return {
            resolvedWorldSeedProfile,
            resolvedWorldTone,
            resolvedDerivedWorldTendencies,
            canonicalWorldTone,
            canonicalDerivedWorldTendencies
        };
    }

    function scoreReadableDescriptorShape(descriptorId) {
        const descriptorTokens = tokenizeDescriptorId(descriptorId);
        if (descriptorTokens.length === 0) {
            return 0;
        }

        if (descriptorTokens.length === 1) {
            return descriptorTokens[0].length >= DERIVED_READABILITY_CONFIG.preferredSingleTokenMinLength
                ? 0.82
                : 0.66;
        }

        const tokenCountScore = Math.min(
            descriptorTokens.length,
            DERIVED_READABILITY_CONFIG.maxDescriptorTokenCount
        ) / DERIVED_READABILITY_CONFIG.maxDescriptorTokenCount;
        const longTokenRatio = descriptorTokens.filter((token) => token.length >= 3).length / descriptorTokens.length;
        const uniquenessRatio = new Set(descriptorTokens).size / descriptorTokens.length;

        return clampUnitInterval(
            0.45 + tokenCountScore * 0.25 + longTokenRatio * 0.15 + uniquenessRatio * 0.15
        );
    }

    function scoreDescriptorTokenVariety(descriptorIds) {
        const descriptorTokens = descriptorIds.flatMap((descriptorId) => {
            return tokenizeDescriptorId(descriptorId);
        });

        if (descriptorTokens.length === 0) {
            return 0;
        }

        return clampUnitInterval(new Set(descriptorTokens).size / descriptorTokens.length);
    }

    function resolveDerivedCoverageScore(derivedWorldTendencies) {
        if (!derivedWorldTendencies) {
            return 0;
        }

        const filledFieldCount = DERIVED_TENDENCY_FIELD_IDS.filter((fieldId) => {
            return Boolean(normalizeDescriptorId(derivedWorldTendencies[fieldId]));
        }).length;

        return DERIVED_TENDENCY_FIELD_IDS.length > 0
            ? filledFieldCount / DERIVED_TENDENCY_FIELD_IDS.length
            : 0;
    }

    function resolveWorldSubSeedMapCoverage(worldSubSeedMap, namespaceEntries) {
        if (!worldSubSeedMap || namespaceEntries.length === 0) {
            return {
                validSeeds: [],
                missingEntries: namespaceEntries.slice(),
                coverageScore: 0,
                distinctnessScore: 0,
                duplicateNamespaceIds: []
            };
        }

        const validSeeds = [];
        const missingEntries = [];
        const namespacesBySeed = new Map();

        namespaceEntries.forEach((namespaceEntry) => {
            const candidateSeed = worldSubSeedMap[namespaceEntry.contractKey];
            if (!isUint32(candidateSeed)) {
                missingEntries.push(namespaceEntry);
                return;
            }

            validSeeds.push(candidateSeed);
            const existingNamespaceIds = namespacesBySeed.get(candidateSeed) || [];
            existingNamespaceIds.push(namespaceEntry.namespaceId);
            namespacesBySeed.set(candidateSeed, existingNamespaceIds);
        });

        const duplicateNamespaceIds = Array.from(namespacesBySeed.values()).flatMap((namespaceIds) => {
            return namespaceIds.length > 1 ? namespaceIds : [];
        });
        const coverageScore = validSeeds.length / namespaceEntries.length;
        const distinctnessScore = validSeeds.length > 0
            ? new Set(validSeeds).size / validSeeds.length
            : 0;

        return {
            validSeeds,
            missingEntries,
            coverageScore,
            distinctnessScore,
            duplicateNamespaceIds
        };
    }

    function resolveDownstreamCanonicalConsistencyScore(downstreamContext) {
        const consistencyScores = [];

        if (downstreamContext.canonicalWorldTone && downstreamContext.resolvedWorldTone) {
            consistencyScores.push(
                downstreamContext.canonicalWorldTone === downstreamContext.resolvedWorldTone
                    ? 1
                    : 0
            );
        }

        if (downstreamContext.canonicalDerivedWorldTendencies && downstreamContext.resolvedDerivedWorldTendencies) {
            const derivedConsistencyScore = DERIVED_TENDENCY_FIELD_IDS.reduce((score, fieldId) => {
                return score + (
                    normalizeDescriptorId(downstreamContext.canonicalDerivedWorldTendencies[fieldId])
                    === normalizeDescriptorId(downstreamContext.resolvedDerivedWorldTendencies[fieldId])
                        ? 1
                        : 0
                );
            }, 0) / DERIVED_TENDENCY_FIELD_IDS.length;
            consistencyScores.push(derivedConsistencyScore);
        }

        if (downstreamContext.canonicalWorldSubSeedMap && downstreamContext.resolvedWorldSubSeedMap && downstreamContext.namespaceEntries.length > 0) {
            const subSeedConsistencyScore = downstreamContext.namespaceEntries.reduce((score, namespaceEntry) => {
                return score + (
                    downstreamContext.canonicalWorldSubSeedMap[namespaceEntry.contractKey]
                    === downstreamContext.resolvedWorldSubSeedMap[namespaceEntry.contractKey]
                        ? 1
                        : 0
                );
            }, 0) / downstreamContext.namespaceEntries.length;
            consistencyScores.push(subSeedConsistencyScore);
        }

        if (consistencyScores.length === 0) {
            return 0;
        }

        return consistencyScores.reduce((score, entry) => score + entry, 0) / consistencyScores.length;
    }

    function scorePhase0Expressiveness(worldSeedProfile) {
        const normalizedProfile = normalizeWorldSeedProfileForValidation(worldSeedProfile);
        const axisFieldIds = getWorldSeedProfileAxisFieldIds();
        const axisValues = axisFieldIds.map((fieldId) => {
            return clampUnitInterval(normalizedProfile[fieldId]);
        });

        if (axisValues.length === 0) {
            return 0;
        }

        const meanDistanceScore = axisValues.reduce((sum, axisValue) => {
            return sum + Math.abs(axisValue - EXPRESSIVENESS_CENTER) / EXPRESSIVENESS_CENTER;
        }, 0) / axisValues.length;
        const rangeScore = Math.max(...axisValues) - Math.min(...axisValues);

        return clampUnitInterval(
            meanDistanceScore * EXPRESSIVENESS_SCORING_CONFIG.meanDistanceWeight
            + rangeScore * EXPRESSIVENESS_SCORING_CONFIG.rangeWeight
        );
    }

    function scorePhase0ControlledExtremeness(worldSeedProfile) {
        const normalizedProfile = normalizeWorldSeedProfileForValidation(worldSeedProfile);
        const axisFieldIds = getWorldSeedProfileAxisFieldIds();
        const axisValues = axisFieldIds.map((fieldId) => {
            return clampUnitInterval(normalizedProfile[fieldId]);
        });

        if (axisValues.length === 0) {
            return 0;
        }

        const cautionCount = axisValues.filter((axisValue) => {
            return axisValue <= (1 - CONTROLLED_EXTREMENESS_CONFIG.cautionThreshold)
                || axisValue >= CONTROLLED_EXTREMENESS_CONFIG.cautionThreshold;
        }).length;
        const extremeCount = axisValues.filter((axisValue) => {
            return axisValue <= (1 - CONTROLLED_EXTREMENESS_CONFIG.extremeThreshold)
                || axisValue >= CONTROLLED_EXTREMENESS_CONFIG.extremeThreshold;
        }).length;
        const cautionPenalty = (cautionCount / axisValues.length) * CONTROLLED_EXTREMENESS_CONFIG.cautionPenaltyWeight;
        const extremePenalty = (extremeCount / axisValues.length) * CONTROLLED_EXTREMENESS_CONFIG.extremePenaltyWeight;

        return clampUnitInterval(
            1 - Math.min(1, cautionPenalty + extremePenalty)
        );
    }

    function scorePhase0DerivedReadability(input = {}) {
        const readabilityContext = resolveDerivedReadabilityContext(input);
        const readableDescriptorIds = [];
        if (readabilityContext.resolvedWorldTone) {
            readableDescriptorIds.push(readabilityContext.resolvedWorldTone);
        }

        if (readabilityContext.resolvedDerivedWorldTendencies) {
            DERIVED_TENDENCY_FIELD_IDS.forEach((fieldId) => {
                const fieldValue = normalizeDescriptorId(
                    readabilityContext.resolvedDerivedWorldTendencies[fieldId]
                );
                if (fieldValue) {
                    readableDescriptorIds.push(fieldValue);
                }
            });
        }

        const expectedDescriptorCount = 1 + DERIVED_TENDENCY_FIELD_IDS.length;
        if (readableDescriptorIds.length === 0) {
            return 0;
        }

        const coverageScore = readableDescriptorIds.length / expectedDescriptorCount;
        const descriptorShapeScore = readableDescriptorIds.reduce((score, descriptorId) => {
            return score + scoreReadableDescriptorShape(descriptorId);
        }, 0) / readableDescriptorIds.length;
        const uniquenessScore = new Set(readableDescriptorIds).size / readableDescriptorIds.length;
        const tokenVarietyScore = scoreDescriptorTokenVariety(readableDescriptorIds);

        const canonicalComparisons = [];
        if (readabilityContext.canonicalWorldTone) {
            canonicalComparisons.push(
                readabilityContext.resolvedWorldTone === readabilityContext.canonicalWorldTone
                    ? 1
                    : 0
            );
        }

        if (readabilityContext.resolvedDerivedWorldTendencies && readabilityContext.canonicalDerivedWorldTendencies) {
            DERIVED_TENDENCY_FIELD_IDS.forEach((fieldId) => {
                canonicalComparisons.push(
                    normalizeDescriptorId(readabilityContext.resolvedDerivedWorldTendencies[fieldId])
                    === normalizeDescriptorId(readabilityContext.canonicalDerivedWorldTendencies[fieldId])
                        ? 1
                        : 0
                );
            });
        }

        const canonicalConsistencyScore = canonicalComparisons.length > 0
            ? canonicalComparisons.reduce((score, entry) => score + entry, 0) / canonicalComparisons.length
            : 1;

        return clampUnitInterval(
            coverageScore * DERIVED_READABILITY_CONFIG.coverageWeight
            + descriptorShapeScore * DERIVED_READABILITY_CONFIG.descriptorShapeWeight
            + uniquenessScore * DERIVED_READABILITY_CONFIG.uniquenessWeight
            + tokenVarietyScore * DERIVED_READABILITY_CONFIG.tokenVarietyWeight
            + canonicalConsistencyScore * DERIVED_READABILITY_CONFIG.canonicalConsistencyWeight
        );
    }

    function scorePhase0ArchipelagoPotential(worldSeedProfile) {
        const normalizedProfile = normalizeWorldSeedProfileForValidation(worldSeedProfile);
        const maritimeDependence = clampUnitInterval(normalizedProfile.maritimeDependence);
        const routeFragilityBias = clampUnitInterval(normalizedProfile.routeFragilityBias);
        const migrationPressure = clampUnitInterval(normalizedProfile.migrationPressure);
        const culturalPermeability = clampUnitInterval(normalizedProfile.culturalPermeability);
        const collapseIntensity = clampUnitInterval(normalizedProfile.collapseIntensity);
        const weightedBaseScore =
            maritimeDependence * ARCHIPELAGO_POTENTIAL_CONFIG.maritimeWeight
            + routeFragilityBias * ARCHIPELAGO_POTENTIAL_CONFIG.routeFragilityWeight
            + migrationPressure * ARCHIPELAGO_POTENTIAL_CONFIG.migrationWeight
            + culturalPermeability * ARCHIPELAGO_POTENTIAL_CONFIG.culturalPermeabilityWeight
            + collapseIntensity * ARCHIPELAGO_POTENTIAL_CONFIG.collapseSupportWeight;
        const archipelagoSynergyScore = Math.min(
            maritimeDependence,
            Math.max(routeFragilityBias, migrationPressure),
            Math.max(culturalPermeability, collapseIntensity)
        ) * ARCHIPELAGO_POTENTIAL_CONFIG.synergyWeight;
        const maritimeFloorPenalty = maritimeDependence < ARCHIPELAGO_POTENTIAL_CONFIG.maritimeFloorThreshold
            ? maritimeDependence / ARCHIPELAGO_POTENTIAL_CONFIG.maritimeFloorThreshold
            : 1;

        return clampUnitInterval(
            (weightedBaseScore + archipelagoSynergyScore) * maritimeFloorPenalty
        );
    }

    function scorePhase0DownstreamUsability(input = {}) {
        const downstreamContext = resolveDownstreamUsabilityContext(input);
        const subSeedCoverage = resolveWorldSubSeedMapCoverage(
            downstreamContext.resolvedWorldSubSeedMap,
            downstreamContext.namespaceEntries
        );
        const canonicalConsistencyScore = resolveDownstreamCanonicalConsistencyScore(downstreamContext);

        return clampUnitInterval(
            (downstreamContext.resolvedWorldSeedProfile ? 1 : 0) * DOWNSTREAM_USABILITY_CONFIG.profileAvailabilityWeight
            + (downstreamContext.resolvedWorldTone ? 1 : 0) * DOWNSTREAM_USABILITY_CONFIG.worldToneAvailabilityWeight
            + resolveDerivedCoverageScore(downstreamContext.resolvedDerivedWorldTendencies) * DOWNSTREAM_USABILITY_CONFIG.derivedCoverageWeight
            + subSeedCoverage.coverageScore * DOWNSTREAM_USABILITY_CONFIG.subSeedCoverageWeight
            + subSeedCoverage.distinctnessScore * DOWNSTREAM_USABILITY_CONFIG.subSeedDistinctnessWeight
            + canonicalConsistencyScore * DOWNSTREAM_USABILITY_CONFIG.canonicalConsistencyWeight
        );
    }

    function getPhase0RerollAdviceIds() {
        return PHASE0_REROLL_ADVICE_IDS.slice();
    }

    function getPhase0ValidationScoreIds() {
        return validationScoreIds.slice();
    }

    function getPhase0ValidationDiagnosticFieldIds() {
        return validationDiagnosticFieldIds.slice();
    }

    function createPhase0ValidationScoreMap(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};

        return validationScoreIds.reduce((scoreMap, scoreId) => {
            scoreMap[scoreId] = clampUnitInterval(normalizedOverrides[scoreId]);
            return scoreMap;
        }, {});
    }

    function buildPhase0DownstreamUsabilityDiagnostics(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const downstreamContext = resolveDownstreamUsabilityContext(normalizedInput);
        const subSeedCoverage = resolveWorldSubSeedMapCoverage(
            downstreamContext.resolvedWorldSubSeedMap,
            downstreamContext.namespaceEntries
        );
        const warnings = [];
        const blockedDownstreamPhases = [];

        if (!downstreamContext.resolvedWorldSeedProfile) {
            warnings.push('Missing WorldSeedProfile; later phases would have to invent core global truth.');
            blockedDownstreamPhases.push(...downstreamContext.namespaceEntries.map((entry) => entry.namespaceId));
        }

        if (!downstreamContext.resolvedWorldTone) {
            warnings.push('Missing worldTone; later phases lose a stable descriptive global summary.');
        }

        if (!downstreamContext.resolvedDerivedWorldTendencies) {
            warnings.push('Missing DerivedWorldTendencies; readable global interpretation is incomplete for downstream consumers.');
        } else if (resolveDerivedCoverageScore(downstreamContext.resolvedDerivedWorldTendencies) < 1) {
            warnings.push('DerivedWorldTendencies is incomplete; some readable global summaries are missing.');
        }

        if (!downstreamContext.resolvedWorldSubSeedMap) {
            warnings.push('Missing WorldSubSeedMap; downstream phases do not have stable namespace-specific seeds.');
            blockedDownstreamPhases.push(...downstreamContext.namespaceEntries.map((entry) => entry.namespaceId));
        } else {
            if (subSeedCoverage.missingEntries.length > 0) {
                warnings.push('WorldSubSeedMap is incomplete; some downstream phase seeds are missing.');
                blockedDownstreamPhases.push(...subSeedCoverage.missingEntries.map((entry) => entry.namespaceId));
            }

            if (subSeedCoverage.duplicateNamespaceIds.length > 0) {
                warnings.push('WorldSubSeedMap contains duplicate downstream seeds; phase isolation is weakened.');
                blockedDownstreamPhases.push(...subSeedCoverage.duplicateNamespaceIds);
            }
        }

        if (
            downstreamContext.canonicalWorldTone
            && downstreamContext.resolvedWorldTone
            && downstreamContext.canonicalWorldTone !== downstreamContext.resolvedWorldTone
        ) {
            warnings.push('Provided worldTone drifts from canonical Phase 0 synthesis for the supplied WorldSeedProfile.');
        }

        if (downstreamContext.canonicalDerivedWorldTendencies && downstreamContext.resolvedDerivedWorldTendencies) {
            const hasDerivedDrift = DERIVED_TENDENCY_FIELD_IDS.some((fieldId) => {
                return normalizeDescriptorId(downstreamContext.canonicalDerivedWorldTendencies[fieldId])
                    !== normalizeDescriptorId(downstreamContext.resolvedDerivedWorldTendencies[fieldId]);
            });
            if (hasDerivedDrift) {
                warnings.push('Provided DerivedWorldTendencies drift from canonical Phase 0 synthesis for the supplied WorldSeedProfile.');
            }
        }

        if (downstreamContext.canonicalWorldSubSeedMap && downstreamContext.resolvedWorldSubSeedMap) {
            const hasSubSeedDrift = downstreamContext.namespaceEntries.some((namespaceEntry) => {
                return downstreamContext.canonicalWorldSubSeedMap[namespaceEntry.contractKey]
                    !== downstreamContext.resolvedWorldSubSeedMap[namespaceEntry.contractKey];
            });
            if (hasSubSeedDrift) {
                warnings.push('Provided WorldSubSeedMap drifts from canonical Phase 0 namespace derivation for the supplied WorldSeedProfile.');
            }
        }

        return {
            warnings: uniqueStringArray(warnings),
            blockedDownstreamPhases: uniqueStringArray(blockedDownstreamPhases)
        };
    }

    function buildPhase0RerollAdvice(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const validationScores = buildPhase0CoreValidationScoreMap(normalizedInput);
        const downstreamDiagnostics = buildPhase0DownstreamUsabilityDiagnostics(normalizedInput);
        const severeFailureCount = [
            validationScores.controlledExtremeness <= REROLL_ADVICE_CONFIG.fullPhase0ControlledExtremenessMax,
            validationScores.derivedReadability <= REROLL_ADVICE_CONFIG.fullPhase0DerivedReadabilityMax,
            validationScores.archipelagoPotential <= REROLL_ADVICE_CONFIG.fullPhase0ArchipelagoPotentialMax
        ].filter(Boolean).length;

        if (
            downstreamDiagnostics.blockedDownstreamPhases.length > 0
            || validationScores.downstreamUsability <= REROLL_ADVICE_CONFIG.fullPhase0DownstreamUsabilityMax
            || severeFailureCount >= REROLL_ADVICE_CONFIG.fullPhase0SevereFailureCountMin
        ) {
            return ['full_phase0_reroll'];
        }

        if (validationScores.expressiveness <= REROLL_ADVICE_CONFIG.latentExpressivenessMax) {
            return ['latent_reroll'];
        }

        if (
            validationScores.expressiveness >= REROLL_ADVICE_CONFIG.correlationExpressivenessMin
            && (
                validationScores.controlledExtremeness <= REROLL_ADVICE_CONFIG.correlationControlledExtremenessMax
                || validationScores.derivedReadability <= REROLL_ADVICE_CONFIG.correlationDerivedReadabilityMax
            )
        ) {
            return ['correlation_reroll'];
        }

        return [];
    }

    function createPhase0ValidationDiagnosticsExport(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const downstreamDiagnostics = buildPhase0DownstreamUsabilityDiagnostics(normalizedInput);
        const rerollAdvice = buildPhase0RerollAdvice(normalizedInput);

        return deepFreeze({
            warnings: uniqueStringArray([
                ...normalizeStringArray(normalizedInput.warnings),
                ...downstreamDiagnostics.warnings
            ]),
            rerollAdvice: uniqueStringArray([
                ...normalizeStringArray(normalizedInput.rerollAdvice),
                ...rerollAdvice
            ]),
            blockedDownstreamPhases: uniqueStringArray([
                ...normalizeStringArray(normalizedInput.blockedDownstreamPhases),
                ...downstreamDiagnostics.blockedDownstreamPhases
            ])
        });
    }

    function resolveValidationScoreOverrides(input = {}) {
        return isPlainObject(input.scores)
            ? input.scores
            : {};
    }

    function buildPhase0ExpressivenessScoreMap(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const scoreOverrides = resolveValidationScoreOverrides(normalizedInput);
        const resolvedWorldSeedProfile = resolveValidationWorldSeedProfile(normalizedInput);
        const computedExpressivenessScore = resolvedWorldSeedProfile
            ? scorePhase0Expressiveness(resolvedWorldSeedProfile)
            : 0;

        return createPhase0ValidationScoreMap({
            ...scoreOverrides,
            expressiveness: hasOwn(scoreOverrides, 'expressiveness')
                ? scoreOverrides.expressiveness
                : computedExpressivenessScore
        });
    }

    function buildPhase0ControlledExtremenessScoreMap(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const scoreOverrides = resolveValidationScoreOverrides(normalizedInput);
        const resolvedWorldSeedProfile = resolveValidationWorldSeedProfile(normalizedInput);
        const computedControlledExtremenessScore = resolvedWorldSeedProfile
            ? scorePhase0ControlledExtremeness(resolvedWorldSeedProfile)
            : 0;

        return createPhase0ValidationScoreMap({
            ...scoreOverrides,
            controlledExtremeness: hasOwn(scoreOverrides, 'controlledExtremeness')
                ? scoreOverrides.controlledExtremeness
                : computedControlledExtremenessScore
        });
    }

    function buildPhase0DerivedReadabilityScoreMap(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const scoreOverrides = resolveValidationScoreOverrides(normalizedInput);
        const computedDerivedReadabilityScore = scorePhase0DerivedReadability(normalizedInput);

        return createPhase0ValidationScoreMap({
            ...scoreOverrides,
            derivedReadability: hasOwn(scoreOverrides, 'derivedReadability')
                ? scoreOverrides.derivedReadability
                : computedDerivedReadabilityScore
        });
    }

    function buildPhase0ArchipelagoPotentialScoreMap(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const scoreOverrides = resolveValidationScoreOverrides(normalizedInput);
        const resolvedWorldSeedProfile = resolveValidationWorldSeedProfile(normalizedInput);
        const computedArchipelagoPotentialScore = resolvedWorldSeedProfile
            ? scorePhase0ArchipelagoPotential(resolvedWorldSeedProfile)
            : 0;

        return createPhase0ValidationScoreMap({
            ...scoreOverrides,
            archipelagoPotential: hasOwn(scoreOverrides, 'archipelagoPotential')
                ? scoreOverrides.archipelagoPotential
                : computedArchipelagoPotentialScore
        });
    }

    function buildPhase0DownstreamUsabilityScoreMap(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const scoreOverrides = resolveValidationScoreOverrides(normalizedInput);
        const computedDownstreamUsabilityScore = scorePhase0DownstreamUsability(normalizedInput);

        return createPhase0ValidationScoreMap({
            ...scoreOverrides,
            downstreamUsability: hasOwn(scoreOverrides, 'downstreamUsability')
                ? scoreOverrides.downstreamUsability
                : computedDownstreamUsabilityScore
        });
    }

    function buildPhase0CoreValidationScoreMap(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const expressivenessScoreMap = buildPhase0ExpressivenessScoreMap(normalizedInput);
        const controlledExtremenessScoreMap = buildPhase0ControlledExtremenessScoreMap(normalizedInput);
        const derivedReadabilityScoreMap = buildPhase0DerivedReadabilityScoreMap(normalizedInput);
        const archipelagoPotentialScoreMap = buildPhase0ArchipelagoPotentialScoreMap(normalizedInput);
        const downstreamUsabilityScoreMap = buildPhase0DownstreamUsabilityScoreMap(normalizedInput);

        return createPhase0ValidationScoreMap({
            ...expressivenessScoreMap,
            controlledExtremeness: controlledExtremenessScoreMap.controlledExtremeness,
            derivedReadability: derivedReadabilityScoreMap.derivedReadability,
            archipelagoPotential: archipelagoPotentialScoreMap.archipelagoPotential,
            downstreamUsability: downstreamUsabilityScoreMap.downstreamUsability
        });
    }

    function buildPhase0ValidationReport(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const contractFactories = typeof phase0.getPhase0ContractFactories === 'function'
            ? phase0.getPhase0ContractFactories()
            : {};
        const createPhase0ValidationReportSkeleton = typeof contractFactories.createPhase0ValidationReportSkeleton === 'function'
            ? contractFactories.createPhase0ValidationReportSkeleton
            : phase0.createPhase0ValidationReportSkeleton;

        if (typeof createPhase0ValidationReportSkeleton !== 'function') {
            throw new Error('[worldgen/phase0] Validation report builder requires contract skeleton factories.');
        }

        const diagnostics = createPhase0ValidationDiagnosticsExport(normalizedInput);
        const validationReport = createPhase0ValidationReportSkeleton({
            isValid: normalizedInput.isValid === true,
            warnings: diagnostics.warnings,
            scores: buildPhase0CoreValidationScoreMap(normalizedInput),
            rerollAdvice: diagnostics.rerollAdvice,
            blockedDownstreamPhases: diagnostics.blockedDownstreamPhases
        });

        if (typeof phase0.assertPhase0ValidationReport === 'function') {
            phase0.assertPhase0ValidationReport(validationReport);
        }

        return deepFreeze(validationReport);
    }

    function validatePhase0Export(phase0Bundle) {
        void phase0Bundle;

        throw typeof phase0.createTodoContractedError === 'function'
            ? phase0.createTodoContractedError('validation.validatePhase0Export')
            : new Error('[worldgen/phase0] TODO CONTRACTED stub.');
    }

    if (typeof phase0.registerModule === 'function') {
        phase0.registerModule('validation', {
            entry: 'buildPhase0ValidationReport',
            file: 'js/worldgen/phase0/validation.js',
            description: 'Phase 0 validation report builder with deterministic expressiveness, controlled-extremeness, derived-readability, archipelago-potential, downstream-usability scoring, and reroll advice generation from validation context.'
        });
        phase0.registerPipelineStep('validationPass', {
            entry: 'buildPhase0ValidationReport',
            file: 'js/worldgen/phase0/validation.js',
            description: 'Validation report assembly layer with expressiveness/non-flatness scoring, controlled-extremeness scoring, derived-readability scoring, archipelago-potential scoring, downstream-usability scoring, and deterministic reroll advice generation without auto-reroll execution.'
        });
    }

    Object.assign(phase0, {
        getPhase0ExpressivenessScoringConfig,
        getPhase0ControlledExtremenessScoringConfig,
        getPhase0DerivedReadabilityScoringConfig,
        getPhase0DownstreamUsabilityScoringConfig,
        getPhase0RerollAdviceConfig,
        getPhase0ArchipelagoPotentialScoringConfig,
        scorePhase0Expressiveness,
        scorePhase0ControlledExtremeness,
        scorePhase0DerivedReadability,
        scorePhase0DownstreamUsability,
        scorePhase0ArchipelagoPotential,
        getPhase0RerollAdviceIds,
        getPhase0ValidationScoreIds,
        getPhase0ValidationDiagnosticFieldIds,
        createPhase0ValidationScoreMap,
        buildPhase0ExpressivenessScoreMap,
        buildPhase0ControlledExtremenessScoreMap,
        buildPhase0DerivedReadabilityScoreMap,
        buildPhase0DownstreamUsabilityScoreMap,
        buildPhase0ArchipelagoPotentialScoreMap,
        buildPhase0CoreValidationScoreMap,
        buildPhase0DownstreamUsabilityDiagnostics,
        buildPhase0RerollAdvice,
        createPhase0ValidationDiagnosticsExport,
        buildPhase0ValidationReport,
        validatePhase0Export
    });
})();
