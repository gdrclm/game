(() => {
    const game = window.Game;
    const phase2 = game.systems.worldgenPhase2 = game.systems.worldgenPhase2 || {};
    const phase0 = game.systems.worldgenPhase0 || {};
    const RNG_MODULUS = 4294967296;
    const RNG_MULTIPLIER = 1664525;
    const RNG_INCREMENT = 1013904223;
    const DEFAULT_SCOPE_ID = 'phase2';
    const DEFAULT_SEED_PURPOSE = 'generic';
    const NAMESPACE_ROOT = 'phase2';
    const NAMESPACE_SEPARATOR = '.';
    const NAMESPACE_SEGMENT_PATTERN = /^[a-z][A-Za-z0-9]*$/;
    const SEED_CONTAINER_KEYS = Object.freeze([
        'worldSubSeedMap',
        'subSeedMap',
        'subSeeds'
    ]);
    const PHASE2_LOCAL_SUB_SEED_GROUPS = Object.freeze({
        intake: Object.freeze([
            'inputBundle',
            'handoffScan',
            'worldBounds'
        ]),
        binding: Object.freeze([
            'recordIndex',
            'profileBinding',
            'regionProjection'
        ]),
        pressure: Object.freeze([
            'climate',
            'terrain',
            'hydrology',
            'food',
            'travel',
            'chokepoints',
            'isolation',
            'ecology',
            'catastrophe',
            'synthesis'
        ]),
        recovery: Object.freeze([
            'tempo',
            'reliefWindows',
            'stabilization',
            'forgiveness'
        ]),
        rhythm: Object.freeze([
            'seasonality',
            'storms',
            'navigation',
            'scarcity',
            'predictability',
            'synthesis'
        ]),
        validation: Object.freeze([
            'packageShape',
            'recordBinding',
            'separation',
            'normalization',
            'determinism'
        ]),
        snapshots: Object.freeze([
            'pressure',
            'rhythm',
            'recordBound',
            'validation'
        ])
    });
    const PHASE2_ALLOWED_SEED_INPUTS = Object.freeze([
        Object.freeze({
            key: 'pressureSeed',
            sourcePath: 'WorldSubSeedMap.pressureSeed',
            namespaceId: 'phase2.pressure',
            sourceKind: 'phase0_downstream_sub_seed',
            productionUse: true,
            allowedPurposes: Object.freeze([
                'pressure'
            ]),
            description: 'Canonical Phase 0 downstream seed for Phase 2 pressure-side generators.'
        }),
        Object.freeze({
            key: 'rhythmSeed',
            sourcePath: 'WorldSubSeedMap.rhythmSeed',
            namespaceId: 'phase2.rhythm',
            sourceKind: 'phase0_downstream_sub_seed',
            productionUse: true,
            allowedPurposes: Object.freeze([
                'rhythm',
                'recovery'
            ]),
            description: 'Canonical Phase 0 downstream seed for Phase 2 rhythm and recovery generators.'
        }),
        Object.freeze({
            key: 'macroSeed',
            sourcePath: 'MacroGeographyPackage.macroSeed',
            namespaceId: null,
            sourceKind: 'phase1_macro_seed_fallback',
            productionUse: true,
            allowedPurposes: Object.freeze([
                'generic',
                'pressure',
                'rhythm',
                'recovery',
                'validation',
                'debug'
            ]),
            description: 'Phase 1 macro seed fallback for deterministic Phase 2 scaffolding until a side-specific sub-seed is provided.'
        }),
        Object.freeze({
            key: 'testSeed',
            sourcePath: 'testSeed',
            namespaceId: null,
            sourceKind: 'test_debug_seed',
            productionUse: false,
            allowedPurposes: Object.freeze([
                'generic',
                'pressure',
                'rhythm',
                'recovery',
                'validation',
                'debug'
            ]),
            description: 'Explicit deterministic seed for tests, debug snapshots, and fixtures only.'
        })
    ]);
    const SEED_PURPOSE_PRIORITIES = Object.freeze({
        generic: Object.freeze([
            'macroSeed',
            'testSeed'
        ]),
        pressure: Object.freeze([
            'pressureSeed',
            'macroSeed',
            'testSeed'
        ]),
        rhythm: Object.freeze([
            'rhythmSeed',
            'macroSeed',
            'testSeed'
        ]),
        recovery: Object.freeze([
            'rhythmSeed',
            'macroSeed',
            'testSeed'
        ]),
        validation: Object.freeze([
            'macroSeed',
            'testSeed'
        ]),
        debug: Object.freeze([
            'testSeed',
            'macroSeed'
        ])
    });

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function clamp01(value) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 0;
        }

        return Math.max(0, Math.min(1, numericValue));
    }

    function normalizeInteger(value, fallback = 0) {
        const numericValue = Number(value);
        return Number.isFinite(numericValue)
            ? Math.trunc(numericValue)
            : fallback;
    }

    function normalizeSeed(seed) {
        if (typeof phase0.normalizeSeed === 'function') {
            return phase0.normalizeSeed(seed);
        }

        const numericSeed = Number(seed);
        if (!Number.isFinite(numericSeed)) {
            return 0;
        }

        return numericSeed >>> 0;
    }

    function isSeedLike(value) {
        if (typeof value === 'number') {
            return Number.isFinite(value);
        }

        return typeof value === 'string'
            && value.trim().length > 0
            && Number.isFinite(Number(value));
    }

    function normalizeList(list) {
        return Array.isArray(list) ? list.slice() : [];
    }

    function stepState(state) {
        return (Math.imul(state, RNG_MULTIPLIER) + RNG_INCREMENT) >>> 0;
    }

    function splitNamespaceInput(namespaceLike) {
        if (Array.isArray(namespaceLike)) {
            return namespaceLike.flatMap(splitNamespaceInput);
        }

        if (typeof namespaceLike !== 'string') {
            return [];
        }

        return namespaceLike
            .split(NAMESPACE_SEPARATOR)
            .map((segment) => segment.trim())
            .filter(Boolean);
    }

    function normalizeNamespaceSegment(segment) {
        if (typeof segment !== 'string' || !segment.trim()) {
            throw new Error('[worldgen/phase2] namespace segment is required.');
        }

        const normalizedSegment = segment.trim();
        if (!NAMESPACE_SEGMENT_PATTERN.test(normalizedSegment)) {
            throw new Error(`[worldgen/phase2] Invalid namespace segment "${normalizedSegment}".`);
        }

        return normalizedSegment;
    }

    function buildPhase2SubSeedNamespace(...parts) {
        const rawSegments = parts.flatMap(splitNamespaceInput);
        const normalizedSegments = rawSegments.map(normalizeNamespaceSegment);

        if (!normalizedSegments.length) {
            return NAMESPACE_ROOT;
        }

        const startsWithRoot = normalizedSegments[0] === NAMESPACE_ROOT;
        const namespaceSegments = startsWithRoot
            ? normalizedSegments
            : [NAMESPACE_ROOT, ...normalizedSegments];

        return namespaceSegments.join(NAMESPACE_SEPARATOR);
    }

    function hashNamespace(namespace) {
        let hash = 2166136261;

        for (let index = 0; index < namespace.length; index += 1) {
            hash ^= namespace.charCodeAt(index);
            hash = Math.imul(hash, 16777619) >>> 0;
        }

        return hash >>> 0;
    }

    function mixSeed(seed, namespaceHash) {
        let mixed = (normalizeSeed(seed) ^ namespaceHash ^ 0x9e3779b9) >>> 0;
        mixed = Math.imul(mixed ^ (mixed >>> 16), 2246822507) >>> 0;
        mixed = Math.imul(mixed ^ (mixed >>> 13), 3266489909) >>> 0;
        mixed = (mixed ^ (mixed >>> 16)) >>> 0;
        return mixed >>> 0;
    }

    function getNamespaceGroup(namespace) {
        const segments = splitNamespaceInput(buildPhase2SubSeedNamespace(namespace));
        return segments.length > 1 ? segments[1] : null;
    }

    function inferSeedPurposeFromNamespace(namespace) {
        const namespaceGroup = getNamespaceGroup(namespace);

        if (namespaceGroup === 'pressure') {
            return 'pressure';
        }

        if (namespaceGroup === 'recovery') {
            return 'recovery';
        }

        if (namespaceGroup === 'rhythm') {
            return 'rhythm';
        }

        if (namespaceGroup === 'validation') {
            return 'validation';
        }

        if (namespaceGroup === 'snapshots') {
            return 'debug';
        }

        return DEFAULT_SEED_PURPOSE;
    }

    function cloneSeedInputContractEntry(entry) {
        return Object.freeze({
            key: entry.key,
            sourcePath: entry.sourcePath,
            namespaceId: entry.namespaceId,
            sourceKind: entry.sourceKind,
            productionUse: entry.productionUse,
            allowedPurposes: Object.freeze(entry.allowedPurposes.slice()),
            description: entry.description
        });
    }

    function getAllowedSeedInputKeys() {
        return PHASE2_ALLOWED_SEED_INPUTS.map((entry) => entry.key);
    }

    function getSeedInputContractEntry(seedKey) {
        return PHASE2_ALLOWED_SEED_INPUTS.find((entry) => entry.key === seedKey) || null;
    }

    function normalizeSeedPurpose(seedPurpose) {
        return Object.prototype.hasOwnProperty.call(SEED_PURPOSE_PRIORITIES, seedPurpose)
            ? seedPurpose
            : DEFAULT_SEED_PURPOSE;
    }

    function normalizeScopeId(scopeId) {
        return typeof scopeId === 'string' && scopeId.trim()
            ? scopeId.trim()
            : DEFAULT_SCOPE_ID;
    }

    function normalizeAllowedSeedKeys(seedPurpose, allowedSeedKeys) {
        const preferredKeys = Array.isArray(allowedSeedKeys) && allowedSeedKeys.length > 0
            ? allowedSeedKeys
            : SEED_PURPOSE_PRIORITIES[seedPurpose];

        return preferredKeys.filter((seedKey) => {
            const entry = getSeedInputContractEntry(seedKey);
            return Boolean(entry) && entry.allowedPurposes.includes(seedPurpose);
        });
    }

    function readSeedCandidate(seedInput, seedKey) {
        if (!isPlainObject(seedInput)) {
            return null;
        }

        if (Object.prototype.hasOwnProperty.call(seedInput, seedKey)) {
            return {
                value: seedInput[seedKey],
                sourcePath: seedKey
            };
        }

        for (const containerKey of SEED_CONTAINER_KEYS) {
            const container = seedInput[containerKey];
            if (isPlainObject(container) && Object.prototype.hasOwnProperty.call(container, seedKey)) {
                return {
                    value: container[seedKey],
                    sourcePath: `${containerKey}.${seedKey}`
                };
            }
        }

        return null;
    }

    function buildSeedResolution(seed, entry, sourcePath, seedPurpose, allowedSeedInputKeys, warnings = []) {
        return Object.freeze({
            seed: normalizeSeed(seed),
            seedPurpose,
            sourceKey: entry.key,
            sourceKind: entry.sourceKind,
            sourcePath,
            namespaceId: entry.namespaceId,
            productionUse: entry.productionUse,
            allowedSeedInputKeys: Object.freeze(allowedSeedInputKeys.slice()),
            warnings: Object.freeze(warnings.slice()),
            usesFallback: false
        });
    }

    function buildDirectSeedResolution(seed, seedPurpose, allowedSeedInputKeys) {
        return Object.freeze({
            seed: normalizeSeed(seed),
            seedPurpose,
            sourceKey: 'directNumericSeed',
            sourceKind: 'direct_test_debug_seed',
            sourcePath: 'direct',
            namespaceId: null,
            productionUse: false,
            allowedSeedInputKeys: Object.freeze(allowedSeedInputKeys.slice()),
            warnings: Object.freeze([
                'direct_numeric_seed_is_for_tests_and_debug_only'
            ]),
            usesFallback: false
        });
    }

    function buildMissingSeedResolution(seedPurpose, allowedSeedInputKeys, fallbackSeed) {
        return Object.freeze({
            seed: normalizeSeed(fallbackSeed),
            seedPurpose,
            sourceKey: 'fallbackSeed',
            sourceKind: 'deterministic_zero_fallback',
            sourcePath: null,
            namespaceId: null,
            productionUse: false,
            allowedSeedInputKeys: Object.freeze(allowedSeedInputKeys.slice()),
            warnings: Object.freeze([
                'missing_allowed_phase2_seed_input'
            ]),
            usesFallback: true
        });
    }

    function resolvePhase2SeedInput(seedInput, options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const seedPurpose = normalizeSeedPurpose(normalizedOptions.seedPurpose);
        const allowedSeedInputKeys = normalizeAllowedSeedKeys(
            seedPurpose,
            normalizedOptions.allowedSeedKeys
        );

        if (isSeedLike(seedInput)) {
            return buildDirectSeedResolution(seedInput, seedPurpose, allowedSeedInputKeys);
        }

        if (isPlainObject(seedInput)) {
            for (const seedKey of allowedSeedInputKeys) {
                const candidate = readSeedCandidate(seedInput, seedKey);
                const entry = getSeedInputContractEntry(seedKey);
                if (candidate && entry && isSeedLike(candidate.value)) {
                    return buildSeedResolution(
                        candidate.value,
                        entry,
                        candidate.sourcePath,
                        seedPurpose,
                        allowedSeedInputKeys
                    );
                }
            }
        }

        return buildMissingSeedResolution(
            seedPurpose,
            allowedSeedInputKeys,
            normalizedOptions.fallbackSeed
        );
    }

    function getPhase2AllowedSeedInputContract() {
        return Object.freeze({
            acceptedObjectKeys: Object.freeze(getAllowedSeedInputKeys()),
            acceptedContainers: SEED_CONTAINER_KEYS,
            directNumericSeed: Object.freeze({
                sourceKey: 'directNumericSeed',
                productionUse: false,
                allowedFor: Object.freeze([
                    'tests',
                    'debug',
                    'fixtures'
                ])
            }),
            purposePriorities: Object.freeze(Object.fromEntries(
                Object.entries(SEED_PURPOSE_PRIORITIES).map(([purpose, seedKeys]) => {
                    return [purpose, Object.freeze(seedKeys.slice())];
                })
            )),
            seedInputs: Object.freeze(PHASE2_ALLOWED_SEED_INPUTS.map(cloneSeedInputContractEntry)),
            phase0SeedSystemOwnership: 'Phase 0 owns downstream sub-seed registration and derivation.',
            implementsPhase0SeedDerivation: false,
            implementsLocalSubSeedDerivation: true,
            localSubSeedRootNamespace: NAMESPACE_ROOT
        });
    }

    function getPhase2SubSeedNamespaceCatalog() {
        const namespacesByGroup = Object.freeze(Object.fromEntries(
            Object.entries(PHASE2_LOCAL_SUB_SEED_GROUPS).map(([groupId, childScopes]) => {
                const rootNamespace = buildPhase2SubSeedNamespace(groupId);
                return [groupId, Object.freeze([
                    rootNamespace,
                    ...childScopes.map((childScope) => buildPhase2SubSeedNamespace(groupId, childScope))
                ])];
            })
        ));
        const layerRoots = Object.freeze(Object.keys(PHASE2_LOCAL_SUB_SEED_GROUPS).map((groupId) => {
            return buildPhase2SubSeedNamespace(groupId);
        }));
        const allNamespaces = Object.freeze([
            NAMESPACE_ROOT,
            ...Object.values(namespacesByGroup).flat()
        ]);

        return Object.freeze({
            rootNamespace: NAMESPACE_ROOT,
            layerRoots,
            namespacesByGroup,
            intake: namespacesByGroup.intake,
            binding: namespacesByGroup.binding,
            pressure: namespacesByGroup.pressure,
            recovery: namespacesByGroup.recovery,
            rhythm: namespacesByGroup.rhythm,
            validation: namespacesByGroup.validation,
            snapshots: namespacesByGroup.snapshots,
            allNamespaces
        });
    }

    function getPhase2SubSeedConventions() {
        const namespaceCatalog = getPhase2SubSeedNamespaceCatalog();

        return Object.freeze({
            rootNamespace: NAMESPACE_ROOT,
            separator: NAMESPACE_SEPARATOR,
            segmentPattern: NAMESPACE_SEGMENT_PATTERN.source,
            style: 'dot-separated lowerCamelCase segments under the phase2 root namespace',
            phase0Boundary: 'Phase 0 exports pressureSeed and rhythmSeed; Phase 2 local sub-seeds are derived below those supplied seeds only.',
            layerRoots: namespaceCatalog.layerRoots,
            requiredGroups: Object.freeze(Object.keys(PHASE2_LOCAL_SUB_SEED_GROUPS)),
            examples: Object.freeze([
                buildPhase2SubSeedNamespace('intake', 'inputBundle'),
                buildPhase2SubSeedNamespace('binding', 'recordIndex'),
                buildPhase2SubSeedNamespace('pressure', 'climate'),
                buildPhase2SubSeedNamespace('recovery', 'reliefWindows'),
                buildPhase2SubSeedNamespace('rhythm', 'seasonality'),
                buildPhase2SubSeedNamespace('validation', 'determinism'),
                buildPhase2SubSeedNamespace('snapshots', 'recordBound')
            ])
        });
    }

    function getPhase2RngDescriptor() {
        return Object.freeze({
            moduleId: 'deterministicRng',
            canonicalEntry: 'createPhase2Rng',
            auxiliaryEntries: Object.freeze([
                'resolvePhase2SeedInput',
                'getPhase2AllowedSeedInputContract',
                'buildPhase2SubSeedNamespace',
                'getPhase2SubSeedNamespaceCatalog',
                'getPhase2SubSeedConventions',
                'resolvePhase2SubSeed',
                'derivePhase2SubSeed',
                'derivePhase2SubSeedMap',
                'createPhase2SeedScope'
            ]),
            purpose: 'Deterministic RNG wrapper for Phase 2 subgenerators.',
            deterministicBy: 'allowed Phase 2 seed input',
            implementsGenerators: false,
            implementsPhase0SeedDerivation: false,
            implementsLocalSubSeedDerivation: true,
            convenienceMethods: Object.freeze([
                'next',
                'nextFloat',
                'nextRange',
                'nextInt',
                'nextBool',
                'nextIndex',
                'pick',
                'shuffle',
                'getSeed',
                'getState',
                'getDrawCount',
                'snapshot'
            ])
        });
    }

    function createPhase2RngFromSeedResolution(seedResolution, scopeId) {
        const normalizedSeed = seedResolution.seed;
        const normalizedScopeId = normalizeScopeId(scopeId);
        let state = normalizedSeed;
        let drawCount = 0;

        function nextFloat() {
            state = stepState(state);
            drawCount += 1;
            return state / RNG_MODULUS;
        }

        function nextRange(min = 0, max = 1) {
            const normalizedMin = Number(min);
            const normalizedMax = Number(max);

            if (!Number.isFinite(normalizedMin) || !Number.isFinite(normalizedMax)) {
                throw new Error('[worldgen/phase2] nextRange requires finite min/max.');
            }

            if (normalizedMax <= normalizedMin) {
                return normalizedMin;
            }

            return normalizedMin + (normalizedMax - normalizedMin) * nextFloat();
        }

        function nextInt(minOrMax = 0, maxExclusive = null) {
            let min = 0;
            let max = 0;

            if (maxExclusive === null || maxExclusive === undefined) {
                max = normalizeInteger(minOrMax, 0);
            } else {
                min = normalizeInteger(minOrMax, 0);
                max = normalizeInteger(maxExclusive, 0);
            }

            if (max <= min) {
                return min;
            }

            return min + Math.floor(nextFloat() * (max - min));
        }

        function nextBool(probability = 0.5) {
            return nextFloat() < clamp01(probability);
        }

        function nextIndex(length) {
            const normalizedLength = normalizeInteger(length, 0);
            if (normalizedLength <= 0) {
                return -1;
            }

            return nextInt(normalizedLength);
        }

        function pick(list, fallback = null) {
            const normalizedList = normalizeList(list);
            const index = nextIndex(normalizedList.length);
            return index >= 0 ? normalizedList[index] : fallback;
        }

        function shuffle(list) {
            const normalizedList = normalizeList(list);

            for (let index = normalizedList.length - 1; index > 0; index -= 1) {
                const swapIndex = nextInt(index + 1);
                const currentValue = normalizedList[index];
                normalizedList[index] = normalizedList[swapIndex];
                normalizedList[swapIndex] = currentValue;
            }

            return normalizedList;
        }

        function getState() {
            return state >>> 0;
        }

        function getSeed() {
            return normalizedSeed;
        }

        function getDrawCount() {
            return drawCount;
        }

        function snapshot() {
            return {
                seed: normalizedSeed,
                scopeId: normalizedScopeId,
                state: getState(),
                drawCount: getDrawCount(),
                seedResolution
            };
        }

        return Object.freeze({
            scopeId: normalizedScopeId,
            seedResolution,
            next: nextFloat,
            nextFloat,
            nextRange,
            nextInt,
            nextBool,
            nextIndex,
            pick,
            shuffle,
            getSeed,
            getState,
            getDrawCount,
            snapshot
        });
    }

    function createPhase2Rng(seedInput, options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const seedResolution = resolvePhase2SeedInput(seedInput, normalizedOptions);
        if (normalizedOptions.requireSeed === true && seedResolution.usesFallback) {
            throw new Error('[worldgen/phase2] Missing allowed deterministic seed input.');
        }

        return createPhase2RngFromSeedResolution(seedResolution, normalizedOptions.scopeId);
    }

    function buildLocalSubSeedResolution(parentSeedResolution, namespace, seed) {
        return Object.freeze({
            seed: normalizeSeed(seed),
            seedPurpose: parentSeedResolution.seedPurpose,
            sourceKey: 'phase2LocalSubSeed',
            sourceKind: 'phase2_local_sub_seed',
            sourcePath: namespace,
            namespaceId: namespace,
            productionUse: parentSeedResolution.productionUse,
            allowedSeedInputKeys: Object.freeze(parentSeedResolution.allowedSeedInputKeys.slice()),
            warnings: Object.freeze(parentSeedResolution.warnings.slice()),
            usesFallback: parentSeedResolution.usesFallback,
            parentSeedResolution
        });
    }

    function normalizeSubSeedOptions(namespace, options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const normalizedNamespace = buildPhase2SubSeedNamespace(namespace);
        const seedPurpose = normalizeSeedPurpose(
            normalizedOptions.seedPurpose || inferSeedPurposeFromNamespace(normalizedNamespace)
        );

        return {
            ...normalizedOptions,
            namespace: normalizedNamespace,
            seedPurpose
        };
    }

    function resolvePhase2SubSeed(seedInput, namespace = NAMESPACE_ROOT, options = {}) {
        const normalizedOptions = normalizeSubSeedOptions(namespace, options);
        const parentSeedResolution = resolvePhase2SeedInput(seedInput, normalizedOptions);
        if (normalizedOptions.requireSeed === true && parentSeedResolution.usesFallback) {
            throw new Error('[worldgen/phase2] Missing allowed deterministic seed input for sub-seed derivation.');
        }

        const derivedSeed = normalizedOptions.namespace === NAMESPACE_ROOT
            ? parentSeedResolution.seed
            : mixSeed(parentSeedResolution.seed, hashNamespace(normalizedOptions.namespace));

        return buildLocalSubSeedResolution(
            parentSeedResolution,
            normalizedOptions.namespace,
            derivedSeed
        );
    }

    function derivePhase2SubSeed(seedInput, namespace = NAMESPACE_ROOT, options = {}) {
        return resolvePhase2SubSeed(seedInput, namespace, options).seed;
    }

    function derivePhase2SubSeedMap(seedInput, namespaces = [], options = {}) {
        if (Array.isArray(namespaces)) {
            return namespaces.reduce((seedMap, namespace) => {
                const normalizedNamespace = buildPhase2SubSeedNamespace(namespace);
                seedMap[normalizedNamespace] = derivePhase2SubSeed(seedInput, normalizedNamespace, options);
                return seedMap;
            }, {});
        }

        if (isPlainObject(namespaces)) {
            return Object.entries(namespaces).reduce((seedMap, [key, namespace]) => {
                seedMap[key] = derivePhase2SubSeed(seedInput, namespace, options);
                return seedMap;
            }, {});
        }

        return {};
    }

    function createPhase2SeedScope(seedInput, scopeId = NAMESPACE_ROOT, options = {}) {
        const normalizedScopeId = buildPhase2SubSeedNamespace(scopeId);
        const localScopeId = normalizedScopeId === NAMESPACE_ROOT
            ? NAMESPACE_ROOT
            : normalizedScopeId.slice(NAMESPACE_ROOT.length + 1);
        const seedResolution = resolvePhase2SubSeed(seedInput, normalizedScopeId, options);

        function deriveSubSeed(childScopeId = NAMESPACE_ROOT) {
            const childNamespace = buildPhase2SubSeedNamespace(normalizedScopeId, childScopeId);
            return derivePhase2SubSeed(seedInput, childNamespace, {
                ...options,
                seedPurpose: seedResolution.seedPurpose
            });
        }

        function resolveSubSeed(childScopeId = NAMESPACE_ROOT) {
            const childNamespace = buildPhase2SubSeedNamespace(normalizedScopeId, childScopeId);
            return resolvePhase2SubSeed(seedInput, childNamespace, {
                ...options,
                seedPurpose: seedResolution.seedPurpose
            });
        }

        function createSubScope(childScopeId) {
            return createPhase2SeedScope(seedInput, buildPhase2SubSeedNamespace(normalizedScopeId, childScopeId), {
                ...options,
                seedPurpose: seedResolution.seedPurpose
            });
        }

        function createRng() {
            return createPhase2RngFromSeedResolution(seedResolution, normalizedScopeId);
        }

        function createChildRng(childScopeId) {
            const childSeedResolution = resolveSubSeed(childScopeId);
            return createPhase2RngFromSeedResolution(childSeedResolution, childSeedResolution.namespaceId);
        }

        function snapshot() {
            return {
                seed: seedResolution.seed,
                scopeId: localScopeId,
                namespace: normalizedScopeId,
                seedResolution
            };
        }

        return Object.freeze({
            seed: seedResolution.seed,
            scopeId: localScopeId,
            namespace: normalizedScopeId,
            seedResolution,
            deriveSubSeed,
            resolveSubSeed,
            createSubScope,
            createRng,
            createChildRng,
            snapshot
        });
    }

    phase2.rng = Object.freeze({
        getPhase2RngDescriptor,
        getPhase2AllowedSeedInputContract,
        resolvePhase2SeedInput,
        createPhase2Rng,
        buildPhase2SubSeedNamespace,
        getPhase2SubSeedNamespaceCatalog,
        getPhase2SubSeedConventions,
        resolvePhase2SubSeed,
        derivePhase2SubSeed,
        derivePhase2SubSeedMap,
        createPhase2SeedScope
    });

    Object.assign(phase2, {
        getPhase2RngDescriptor,
        getPhase2AllowedSeedInputContract,
        resolvePhase2SeedInput,
        createPhase2Rng,
        buildPhase2SubSeedNamespace,
        getPhase2SubSeedNamespaceCatalog,
        getPhase2SubSeedConventions,
        resolvePhase2SubSeed,
        derivePhase2SubSeed,
        derivePhase2SubSeedMap,
        createPhase2SeedScope
    });
})();
