(() => {
    const game = window.Game;
    const phase0 = game.systems.worldgenPhase0 = game.systems.worldgenPhase0 || {};
    const RNG_MODULUS = 4294967296;
    const RNG_MULTIPLIER = 1664525;
    const RNG_INCREMENT = 1013904223;
    const ROOT_SCOPE_ID = 'phase0';

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

    function normalizeList(list) {
        return Array.isArray(list) ? list.slice() : [];
    }

    function normalizeSeed(seed) {
        return typeof phase0.normalizeSeed === 'function'
            ? phase0.normalizeSeed(seed)
            : 0;
    }

    function normalizeScopeId(scopeId) {
        return typeof scopeId === 'string' && scopeId.trim()
            ? scopeId.trim()
            : ROOT_SCOPE_ID;
    }

    function stepState(state) {
        return (Math.imul(state, RNG_MULTIPLIER) + RNG_INCREMENT) >>> 0;
    }

    function createPhase0Rng(seed, options = {}) {
        const normalizedSeed = normalizeSeed(seed);
        const normalizedOptions = options && typeof options === 'object' ? options : {};
        const scopeId = normalizeScopeId(normalizedOptions.scopeId);
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
                throw new Error('[worldgen/phase0] nextRange requires finite min/max.');
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

        function getSeed() {
            return normalizedSeed;
        }

        function getState() {
            return state >>> 0;
        }

        function getDrawCount() {
            return drawCount;
        }

        function snapshot() {
            return {
                seed: normalizedSeed,
                scopeId,
                state: getState(),
                drawCount: getDrawCount()
            };
        }

        return Object.freeze({
            scopeId,
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

    function getPhase0RngDescriptor() {
        return Object.freeze({
            phaseId: phase0.phaseId || 'phase0',
            phaseVersion: phase0.phaseVersion || 'phase0-v1',
            deterministic: true,
            rootScopeId: ROOT_SCOPE_ID,
            api: Object.freeze([
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
            ]),
            deferredCapabilities: Object.freeze([
                'sub-seed derivation'
            ])
        });
    }

    if (typeof phase0.registerModule === 'function') {
        phase0.registerModule('deterministicRng', {
            entry: 'createPhase0Rng',
            file: 'js/worldgen/phase0/deterministic-rng.js',
            description: 'Deterministic RNG wrapper for Phase 0 with seed-stable draw helpers and no sub-seed derivation.',
            stub: false
        });
        phase0.registerPipelineStep('deterministicRng', {
            entry: 'createPhase0Rng',
            file: 'js/worldgen/phase0/deterministic-rng.js',
            description: 'Seed-stable RNG initialization layer for the future Master Seed Generator pipeline.',
            stub: false
        });
    }

    Object.assign(phase0, {
        createPhase0Rng,
        getPhase0RngDescriptor
    });
})();
