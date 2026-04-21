(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const RNG_MODULUS = 4294967296;
    const RNG_MULTIPLIER = 1664525;
    const RNG_INCREMENT = 1013904223;
    const NAMESPACE_ROOT = 'macro';
    const NAMESPACE_SEPARATOR = '.';
    const NAMESPACE_SEGMENT_PATTERN = /^[a-z][A-Za-z0-9]*$/;

    function clamp01(value) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 0;
        }

        return Math.max(0, Math.min(1, numericValue));
    }

    function normalizeInteger(value, fallback = 0) {
        return Number.isFinite(value)
            ? Math.trunc(value)
            : fallback;
    }

    function normalizeSeed(seed) {
        return typeof macro.normalizeSeed === 'function'
            ? macro.normalizeSeed(seed)
            : 0;
    }

    function stepState(state) {
        return (Math.imul(state, RNG_MULTIPLIER) + RNG_INCREMENT) >>> 0;
    }

    function normalizeList(list) {
        return Array.isArray(list) ? list.slice() : [];
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
            throw new Error('[worldgen/macro] namespace segment is required.');
        }

        const normalizedSegment = segment.trim();
        if (!NAMESPACE_SEGMENT_PATTERN.test(normalizedSegment)) {
            throw new Error(`[worldgen/macro] Invalid namespace segment "${normalizedSegment}".`);
        }

        return normalizedSegment;
    }

    function buildMacroSubSeedNamespace(...parts) {
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

    function getMacroPipelineSubSeedNamespaces() {
        const stepIds = typeof macro.getExpectedPipelineStepIds === 'function'
            ? macro.getExpectedPipelineStepIds()
            : [];

        return stepIds.map((stepId) => buildMacroSubSeedNamespace(stepId));
    }

    function getMacroSubSeedNamespaceCatalog() {
        return Object.freeze({
            layerRoots: Object.freeze([
                buildMacroSubSeedNamespace('physical'),
                buildMacroSubSeedNamespace('macroLayer'),
                buildMacroSubSeedNamespace('validation'),
                buildMacroSubSeedNamespace('debug'),
                buildMacroSubSeedNamespace('contracts'),
                buildMacroSubSeedNamespace('orchestration')
            ]),
            physicalOutputs: Object.freeze([
                buildMacroSubSeedNamespace('physical', 'plates'),
                buildMacroSubSeedNamespace('physical', 'continents'),
                buildMacroSubSeedNamespace('physical', 'seaRegions'),
                buildMacroSubSeedNamespace('physical', 'mountainSystems'),
                buildMacroSubSeedNamespace('physical', 'volcanicZones'),
                buildMacroSubSeedNamespace('physical', 'riverBasins'),
                buildMacroSubSeedNamespace('physical', 'climateBands'),
                buildMacroSubSeedNamespace('physical', 'reliefRegions')
            ]),
            strategicOutputs: Object.freeze([
                buildMacroSubSeedNamespace('macroLayer', 'archipelagoRegions'),
                buildMacroSubSeedNamespace('macroLayer', 'chokepoints'),
                buildMacroSubSeedNamespace('macroLayer', 'macroRoutes'),
                buildMacroSubSeedNamespace('macroLayer', 'strategicRegions'),
                buildMacroSubSeedNamespace('macroLayer', 'validationReport')
            ]),
            utilityScopes: Object.freeze([
                buildMacroSubSeedNamespace('validation'),
                buildMacroSubSeedNamespace('debug'),
                buildMacroSubSeedNamespace('contracts'),
                buildMacroSubSeedNamespace('orchestration')
            ])
        });
    }

    function getMacroSubSeedConventions() {
        const namespaceCatalog = getMacroSubSeedNamespaceCatalog();

        return Object.freeze({
            rootNamespace: NAMESPACE_ROOT,
            separator: NAMESPACE_SEPARATOR,
            segmentPattern: NAMESPACE_SEGMENT_PATTERN.source,
            style: 'dot-separated lowerCamelCase segments under the macro root namespace',
            reservedNamespaces: namespaceCatalog.utilityScopes,
            layerRoots: namespaceCatalog.layerRoots,
            outputNamespaces: Object.freeze({
                physical: namespaceCatalog.physicalOutputs,
                strategic: namespaceCatalog.strategicOutputs
            }),
            pipelineNamespaces: Object.freeze(getMacroPipelineSubSeedNamespaces()),
            examples: Object.freeze([
                buildMacroSubSeedNamespace('physical', 'plates'),
                buildMacroSubSeedNamespace('macroLayer', 'macroRoutes'),
                buildMacroSubSeedNamespace('tectonicSkeleton'),
                buildMacroSubSeedNamespace('marineCarving'),
                buildMacroSubSeedNamespace('tectonicSkeleton', 'ridgePass')
            ])
        });
    }

    function hashNamespace(namespace) {
        let hash = 2166136261;

        for (let index = 0; index < namespace.length; index += 1) {
            hash ^= namespace.charCodeAt(index);
            hash = Math.imul(hash, 16777619) >>> 0;
        }

        return hash >>> 0;
    }

    function mixSeed(masterSeed, namespaceHash) {
        let mixed = (normalizeSeed(masterSeed) ^ namespaceHash ^ 0x9e3779b9) >>> 0;
        mixed = Math.imul(mixed ^ (mixed >>> 16), 2246822507) >>> 0;
        mixed = Math.imul(mixed ^ (mixed >>> 13), 3266489909) >>> 0;
        mixed = (mixed ^ (mixed >>> 16)) >>> 0;
        return mixed >>> 0;
    }

    function deriveMacroSubSeed(masterSeed, namespace) {
        const normalizedMasterSeed = normalizeSeed(masterSeed);
        const normalizedNamespace = buildMacroSubSeedNamespace(namespace);

        if (normalizedNamespace === NAMESPACE_ROOT) {
            return normalizedMasterSeed;
        }

        return mixSeed(normalizedMasterSeed, hashNamespace(normalizedNamespace));
    }

    function deriveMacroSubSeedMap(masterSeed, namespaces = []) {
        if (Array.isArray(namespaces)) {
            return namespaces.reduce((seedMap, namespace) => {
                const normalizedNamespace = buildMacroSubSeedNamespace(namespace);
                seedMap[normalizedNamespace] = deriveMacroSubSeed(masterSeed, normalizedNamespace);
                return seedMap;
            }, {});
        }

        if (namespaces && typeof namespaces === 'object') {
            return Object.entries(namespaces).reduce((seedMap, [key, namespace]) => {
                seedMap[key] = deriveMacroSubSeed(masterSeed, namespace);
                return seedMap;
            }, {});
        }

        return {};
    }

    function getMacroRngDescriptor() {
        return Object.freeze({
            moduleId: 'deterministicRng',
            canonicalEntry: 'createMacroRng',
            auxiliaryEntries: Object.freeze([
                'createMacroSeedScope',
                'buildMacroSubSeedNamespace',
                'getMacroSubSeedNamespaceCatalog',
                'getMacroSubSeedConventions',
                'deriveMacroSubSeed',
                'deriveMacroSubSeedMap'
            ]),
            purpose: 'Deterministic RNG wrapper for Phase 1 Physical + Macro Geography subgenerators.',
            deterministicBy: 'seed',
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

    function createMacroRng(seed, options = {}) {
        const normalizedSeed = normalizeSeed(seed);
        const normalizedOptions = options && typeof options === 'object' ? options : {};
        const scopeId = typeof normalizedOptions.scopeId === 'string' && normalizedOptions.scopeId.trim()
            ? normalizedOptions.scopeId.trim()
            : NAMESPACE_ROOT;
        const namespace = buildMacroSubSeedNamespace(scopeId);
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
                throw new Error('[worldgen/macro] nextRange requires finite min/max.');
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
                scopeId,
                namespace,
                state: getState(),
                drawCount: getDrawCount()
            };
        }

        return Object.freeze({
            scopeId,
            namespace,
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

    function createMacroSeedScope(masterSeed, scopeId = NAMESPACE_ROOT) {
        const normalizedMasterSeed = normalizeSeed(masterSeed);
        const namespace = buildMacroSubSeedNamespace(scopeId);
        const localScopeId = namespace === NAMESPACE_ROOT
            ? NAMESPACE_ROOT
            : namespace.slice(NAMESPACE_ROOT.length + 1);
        const derivedSeed = deriveMacroSubSeed(normalizedMasterSeed, namespace);

        function deriveSubSeed(childScopeId = NAMESPACE_ROOT) {
            const childNamespace = buildMacroSubSeedNamespace(namespace, childScopeId);
            return deriveMacroSubSeed(normalizedMasterSeed, childNamespace);
        }

        function createSubScope(childScopeId) {
            return createMacroSeedScope(normalizedMasterSeed, buildMacroSubSeedNamespace(namespace, childScopeId));
        }

        function createRng() {
            return createMacroRng(derivedSeed, {
                scopeId: namespace
            });
        }

        function createChildRng(childScopeId) {
            const childNamespace = buildMacroSubSeedNamespace(namespace, childScopeId);
            return createMacroRng(deriveSubSeed(childScopeId), {
                scopeId: childNamespace
            });
        }

        function snapshot() {
            return {
                masterSeed: normalizedMasterSeed,
                seed: derivedSeed,
                scopeId: localScopeId,
                namespace
            };
        }

        return Object.freeze({
            masterSeed: normalizedMasterSeed,
            seed: derivedSeed,
            scopeId: localScopeId,
            namespace,
            deriveSubSeed,
            createSubScope,
            createRng,
            createChildRng,
            snapshot
        });
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('deterministicRng', {
            entry: 'createMacroRng',
            file: 'js/worldgen/macro/deterministic-rng.js',
            description: 'Deterministic RNG wrapper for Phase 1 Physical + Macro Geography generation.',
            stub: false
        });
    }

    Object.assign(macro, {
        getMacroRngDescriptor,
        createMacroRng,
        createMacroSeedScope,
        buildMacroSubSeedNamespace,
        getMacroSubSeedNamespaceCatalog,
        getMacroSubSeedConventions,
        deriveMacroSubSeed,
        deriveMacroSubSeedMap
    });
})();
