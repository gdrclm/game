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
    const PHASE_SUB_SEED_NAMING_CONVENTIONS = Object.freeze({
        namespaceFormat: 'phase{number}.{slug}',
        contractKeyFormat: '{camelCaseName}Seed',
        phaseNumberPadding: 0,
        phaseSlugStyle: 'snake_case',
        namespaceSeparator: '.',
        contractKeySuffix: 'Seed'
    });
    const DOWNSTREAM_READABLE_SUB_SEED_EXPORT_KIND = 'phase0.downstream_readable_sub_seed_export';
    const PHASE_SUB_SEED_NAMESPACE_REGISTRY = Object.freeze([
        Object.freeze({
            contractKey: 'macroGeographySeed',
            namespaceId: 'phase1.macro_geography',
            phaseNumber: 1,
            phaseSlug: 'macro_geography',
            phaseLabel: 'Macro Geography'
        }),
        Object.freeze({
            contractKey: 'pressureSeed',
            namespaceId: 'phase2.pressure',
            phaseNumber: 2,
            phaseSlug: 'pressure',
            phaseLabel: 'Pressure'
        }),
        Object.freeze({
            contractKey: 'rhythmSeed',
            namespaceId: 'phase2.rhythm',
            phaseNumber: 2,
            phaseSlug: 'rhythm',
            phaseLabel: 'Environmental Rhythm'
        }),
        Object.freeze({
            contractKey: 'religionSeed',
            namespaceId: 'phase4.religion',
            phaseNumber: 4,
            phaseSlug: 'religion',
            phaseLabel: 'Religious Cosmology'
        }),
        Object.freeze({
            contractKey: 'mentalSeed',
            namespaceId: 'phase5.mental',
            phaseNumber: 5,
            phaseSlug: 'mental',
            phaseLabel: 'Mental Model'
        }),
        Object.freeze({
            contractKey: 'civilizationSeed',
            namespaceId: 'phase7.civilization',
            phaseNumber: 7,
            phaseSlug: 'civilization',
            phaseLabel: 'Civilization Emergence'
        }),
        Object.freeze({
            contractKey: 'dynastySeed',
            namespaceId: 'phase9.dynasty',
            phaseNumber: 9,
            phaseSlug: 'dynasty',
            phaseLabel: 'Dynasty and Elite'
        }),
        Object.freeze({
            contractKey: 'eventSeed',
            namespaceId: 'phase11.event',
            phaseNumber: 11,
            phaseSlug: 'event',
            phaseLabel: 'Era Simulation'
        }),
        Object.freeze({
            contractKey: 'collapseSeed',
            namespaceId: 'phase14.collapse',
            phaseNumber: 14,
            phaseSlug: 'collapse',
            phaseLabel: 'Collapse Cascade'
        }),
        Object.freeze({
            contractKey: 'archipelagoSeed',
            namespaceId: 'phase15.archipelago',
            phaseNumber: 15,
            phaseSlug: 'archipelago',
            phaseLabel: 'Archipelago Role'
        }),
        Object.freeze({
            contractKey: 'islandHistorySeed',
            namespaceId: 'phase17.island_history',
            phaseNumber: 17,
            phaseSlug: 'island_history',
            phaseLabel: 'Island History'
        }),
        Object.freeze({
            contractKey: 'settlementSeed',
            namespaceId: 'phase20.settlement',
            phaseNumber: 20,
            phaseSlug: 'settlement',
            phaseLabel: 'Settlement'
        }),
        Object.freeze({
            contractKey: 'spatialSeed',
            namespaceId: 'phase22.spatial',
            phaseNumber: 22,
            phaseSlug: 'spatial',
            phaseLabel: 'Spatial Consequence'
        }),
        Object.freeze({
            contractKey: 'npcSeed',
            namespaceId: 'phase24.npc',
            phaseNumber: 24,
            phaseSlug: 'npc',
            phaseLabel: 'Local NPC'
        })
    ]);

    function cloneRegistryEntry(entry) {
        return {
            contractKey: entry.contractKey,
            namespaceId: entry.namespaceId,
            phaseNumber: entry.phaseNumber,
            phaseSlug: entry.phaseSlug,
            phaseLabel: entry.phaseLabel
        };
    }

    function cloneReadableExportEntry(entry) {
        return {
            contractKey: entry.contractKey,
            namespaceId: entry.namespaceId,
            phaseNumber: entry.phaseNumber,
            phaseSlug: entry.phaseSlug,
            phaseLabel: entry.phaseLabel,
            seed: entry.seed
        };
    }

    function getPhaseSubSeedNamingConventions() {
        return {
            namespaceFormat: PHASE_SUB_SEED_NAMING_CONVENTIONS.namespaceFormat,
            contractKeyFormat: PHASE_SUB_SEED_NAMING_CONVENTIONS.contractKeyFormat,
            phaseNumberPadding: PHASE_SUB_SEED_NAMING_CONVENTIONS.phaseNumberPadding,
            phaseSlugStyle: PHASE_SUB_SEED_NAMING_CONVENTIONS.phaseSlugStyle,
            namespaceSeparator: PHASE_SUB_SEED_NAMING_CONVENTIONS.namespaceSeparator,
            contractKeySuffix: PHASE_SUB_SEED_NAMING_CONVENTIONS.contractKeySuffix
        };
    }

    function getPhaseSubSeedNamespaceRegistry() {
        return PHASE_SUB_SEED_NAMESPACE_REGISTRY.map((entry) => Object.freeze(cloneRegistryEntry(entry)));
    }

    function resolvePhaseSubSeedNamespace(contractKeyOrNamespaceId) {
        if (typeof contractKeyOrNamespaceId !== 'string' || contractKeyOrNamespaceId.length === 0) {
            return null;
        }

        const matchedEntry = PHASE_SUB_SEED_NAMESPACE_REGISTRY.find((entry) => {
            return entry.contractKey === contractKeyOrNamespaceId
                || entry.namespaceId === contractKeyOrNamespaceId;
        });

        return matchedEntry
            ? Object.freeze(cloneRegistryEntry(matchedEntry))
            : null;
    }

    function getDownstreamReadableSubSeedExportContract() {
        return {
            exportKind: DOWNSTREAM_READABLE_SUB_SEED_EXPORT_KIND,
            requiredKeys: Object.freeze([
                'exportKind',
                'namingConventions',
                'entries',
                'seedsByContractKey',
                'seedsByNamespaceId'
            ]),
            entryShape: Object.freeze([
                'contractKey',
                'namespaceId',
                'phaseNumber',
                'phaseSlug',
                'phaseLabel',
                'seed'
            ])
        };
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

    function normalizeSeed(value) {
        return typeof phase0.normalizeSeed === 'function'
            ? phase0.normalizeSeed(value)
            : 0;
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

    function resolveWorldSeedProfileContext(baseSeed, worldSeedProfile) {
        const normalizedBaseSeed = normalizeSeed(baseSeed);
        const normalizedProfile = isPlainObject(worldSeedProfile)
            ? worldSeedProfile
            : {};

        if (typeof phase0.createWorldSeedProfileSkeleton === 'function') {
            return phase0.createWorldSeedProfileSkeleton({
                ...normalizedProfile,
                worldSeed: normalizedBaseSeed
            });
        }

        return {
            worldSeed: normalizedBaseSeed,
            worldTone: typeof normalizedProfile.worldTone === 'string'
                ? normalizedProfile.worldTone
                : 'fractured_maritime_age'
        };
    }

    function createWorldProfileContextSignature(baseSeed, worldSeedProfile) {
        const resolvedProfile = resolveWorldSeedProfileContext(baseSeed, worldSeedProfile);
        const axisSignature = getWorldSeedProfileAxisFieldIds().map((fieldId) => {
            return `${fieldId}:${clampUnitInterval(resolvedProfile[fieldId]).toFixed(6)}`;
        }).join('|');

        return [
            `root:${normalizeSeed(baseSeed)}`,
            `worldSeed:${normalizeSeed(resolvedProfile.worldSeed)}`,
            `worldTone:${resolvedProfile.worldTone}`,
            axisSignature
        ].join('|');
    }

    function hashStringToUint32(input) {
        let hash = 2166136261;

        for (let index = 0; index < input.length; index += 1) {
            hash ^= input.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }

        return hash >>> 0;
    }

    function deriveStableNamespaceSeed(baseSeed, worldSeedProfile, namespaceEntry) {
        const profileContextSignature = createWorldProfileContextSignature(baseSeed, worldSeedProfile);
        const namespaceSignature = [
            profileContextSignature,
            `namespace:${namespaceEntry.namespaceId}`,
            `contractKey:${namespaceEntry.contractKey}`
        ].join('|');

        return normalizeSeed(
            hashStringToUint32(namespaceSignature)
        );
    }

    function createNamespaceCollisionSignature(baseSeed, worldSeedProfile, namespaceEntry, collisionIndex) {
        return [
            createWorldProfileContextSignature(baseSeed, worldSeedProfile),
            `namespace:${namespaceEntry.namespaceId}`,
            `contractKey:${namespaceEntry.contractKey}`,
            `collisionIndex:${collisionIndex}`
        ].join('|');
    }

    function deriveCollisionSafeNamespaceSeed(baseSeed, worldSeedProfile, namespaceEntry, usedSeeds) {
        const reservedSeeds = usedSeeds instanceof Set
            ? usedSeeds
            : new Set();
        const initialSeed = deriveStableNamespaceSeed(
            baseSeed,
            worldSeedProfile,
            namespaceEntry
        );

        if (!reservedSeeds.has(initialSeed)) {
            return initialSeed;
        }

        for (let collisionIndex = 1; collisionIndex <= PHASE_SUB_SEED_NAMESPACE_REGISTRY.length; collisionIndex += 1) {
            const collisionSafeSeed = normalizeSeed(
                hashStringToUint32(
                    createNamespaceCollisionSignature(
                        baseSeed,
                        worldSeedProfile,
                        namespaceEntry,
                        collisionIndex
                    )
                )
            );

            if (!reservedSeeds.has(collisionSafeSeed)) {
                return collisionSafeSeed;
            }
        }

        throw new Error(`[worldgen/phase0] Unable to derive a distinct downstream seed for ${namespaceEntry.contractKey}.`);
    }

    function normalizeWorldSubSeedMapForExport(worldSubSeedMap) {
        if (typeof phase0.createWorldSubSeedMapSkeleton !== 'function') {
            throw new Error('[worldgen/phase0] downstream sub-seed export requires createWorldSubSeedMapSkeleton().');
        }

        const normalizedWorldSubSeedMap = phase0.createWorldSubSeedMapSkeleton(
            isPlainObject(worldSubSeedMap)
                ? worldSubSeedMap
                : {}
        );

        if (typeof phase0.assertWorldSubSeedMap === 'function') {
            phase0.assertWorldSubSeedMap(normalizedWorldSubSeedMap);
        }

        return normalizedWorldSubSeedMap;
    }

    function buildDownstreamReadableSubSeedExport(worldSubSeedMap) {
        const normalizedWorldSubSeedMap = normalizeWorldSubSeedMapForExport(worldSubSeedMap);
        const entries = getPhaseSubSeedNamespaceRegistry().map((namespaceEntry) => Object.freeze({
            ...cloneRegistryEntry(namespaceEntry),
            seed: normalizedWorldSubSeedMap[namespaceEntry.contractKey]
        }));
        const seedsByContractKey = entries.reduce((seedMap, entry) => {
            seedMap[entry.contractKey] = entry.seed;
            return seedMap;
        }, {});
        const seedsByNamespaceId = entries.reduce((seedMap, entry) => {
            seedMap[entry.namespaceId] = entry.seed;
            return seedMap;
        }, {});

        return deepFreeze({
            exportKind: DOWNSTREAM_READABLE_SUB_SEED_EXPORT_KIND,
            namingConventions: getPhaseSubSeedNamingConventions(),
            entries: entries.map((entry) => Object.freeze(cloneReadableExportEntry(entry))),
            seedsByContractKey,
            seedsByNamespaceId
        });
    }

    function resolveDownstreamReadableSubSeedEntry(worldSubSeedMap, contractKeyOrNamespaceId) {
        const readableExport = buildDownstreamReadableSubSeedExport(worldSubSeedMap);
        const matchedEntry = readableExport.entries.find((entry) => {
            return entry.contractKey === contractKeyOrNamespaceId
                || entry.namespaceId === contractKeyOrNamespaceId;
        });

        return matchedEntry
            ? Object.freeze(cloneReadableExportEntry(matchedEntry))
            : null;
    }

    function deriveWorldSubSeedMap(baseSeed, worldSeedProfile) {
        const normalizedSeed = normalizeSeed(baseSeed);
        const registry = getPhaseSubSeedNamespaceRegistry();
        const usedSeeds = new Set();
        const derivedSeeds = registry.reduce((worldSubSeedMap, namespaceEntry) => {
            const namespaceSeed = deriveCollisionSafeNamespaceSeed(
                normalizedSeed,
                worldSeedProfile,
                namespaceEntry,
                usedSeeds
            );
            usedSeeds.add(namespaceSeed);
            worldSubSeedMap[namespaceEntry.contractKey] = namespaceSeed;
            return worldSubSeedMap;
        }, {});

        if (typeof phase0.createWorldSubSeedMapSkeleton !== 'function') {
            throw new Error('[worldgen/phase0] deriveWorldSubSeedMap requires createWorldSubSeedMapSkeleton().');
        }

        const worldSubSeedMap = phase0.createWorldSubSeedMapSkeleton(derivedSeeds);

        if (typeof phase0.assertWorldSubSeedMap === 'function') {
            phase0.assertWorldSubSeedMap(worldSubSeedMap);
        }

        return deepFreeze(worldSubSeedMap);
    }

    if (typeof phase0.registerModule === 'function') {
        phase0.registerModule('subseedDeriver', {
            entry: 'deriveWorldSubSeedMap',
            file: 'js/worldgen/phase0/subseed-deriver.js',
            description: 'Phase 0 sub-seed namespace registry with stable derivation, collision-safe distinct seeds, and downstream-readable export helpers.',
            stub: false
        });
        phase0.registerPipelineStep('subSeedDerivation', {
            entry: 'deriveWorldSubSeedMap',
            file: 'js/worldgen/phase0/subseed-deriver.js',
            description: 'Stable phase-namespaced sub-seeds are derived as distinct downstream seeds and can be exported in a downstream-readable shape.',
            stub: false
        });
    }

    Object.assign(phase0, {
        getPhaseSubSeedNamingConventions,
        getPhaseSubSeedNamespaceRegistry,
        resolvePhaseSubSeedNamespace,
        getDownstreamReadableSubSeedExportContract,
        buildDownstreamReadableSubSeedExport,
        resolveDownstreamReadableSubSeedEntry,
        deriveCollisionSafeNamespaceSeed,
        deriveWorldSubSeedMap
    });
})();
