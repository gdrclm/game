(() => {
    const game = window.Game;
    const worldgen = game.systems.worldgen = game.systems.worldgen || {};
    const phase0 = game.systems.worldgenPhase0 = game.systems.worldgenPhase0 || {};
    const PUBLIC_ENTRY_POINT_IDS = Object.freeze([
        'intakeBaseRandomSeed',
        'intakeWorldPresetMode',
        'intakeHardConstraintsProfile',
        'normalizePhase0Options',
        'normalizePhase0Input',
        'assemblePhase0Bundle',
        'createPhase0World',
        'buildWorldSeedProfile',
        'synthesizeWorldTone',
        'deriveWorldTendencies',
        'getPhaseSubSeedNamingConventions',
        'getPhaseSubSeedNamespaceRegistry',
        'resolvePhaseSubSeedNamespace',
        'getDownstreamReadableSubSeedExportContract',
        'buildDownstreamReadableSubSeedExport',
        'resolveDownstreamReadableSubSeedEntry',
        'deriveWorldSubSeedMap',
        'buildPhase0ValidationReport',
        'validatePhase0Export',
        'createPhase0Rng',
        'assertPhase0BundleShape',
        'getPhase0DebugArtifactKinds',
        'buildPhase0JsonSnapshotExport',
        'buildPhase0DebugSummaryExport',
        'buildPhase0DebugArtifactBundle',
        'buildPhase0MarkdownSummary',
        'serializePhase0JsonSnapshot',
        'getPhase1SafeSummaryBundleContract',
        'buildPhase1SafeSummaryBundle',
        'getFrozenPhase0OutputWrappersContract',
        'buildFrozenPhase0OutputWrappers',
        'createPhase0OrchestrationAdapter',
        'getPhase0GenerationScaffoldStatus'
    ]);
    const ENTRY_POINT_GROUPS = Object.freeze({
        intakeBaseRandomSeed: 'input',
        intakeWorldPresetMode: 'input',
        intakeHardConstraintsProfile: 'input',
        normalizePhase0Options: 'input',
        normalizePhase0Input: 'input',
        assemblePhase0Bundle: 'assembly',
        createPhase0World: 'orchestration',
        buildWorldSeedProfile: 'profile',
        synthesizeWorldTone: 'tone',
        deriveWorldTendencies: 'derived',
        getPhaseSubSeedNamingConventions: 'subseeds',
        getPhaseSubSeedNamespaceRegistry: 'subseeds',
        resolvePhaseSubSeedNamespace: 'subseeds',
        getDownstreamReadableSubSeedExportContract: 'subseeds',
        buildDownstreamReadableSubSeedExport: 'subseeds',
        resolveDownstreamReadableSubSeedEntry: 'subseeds',
        deriveWorldSubSeedMap: 'subseeds',
        buildPhase0ValidationReport: 'validation',
        validatePhase0Export: 'validation',
        createPhase0Rng: 'rng',
        assertPhase0BundleShape: 'contracts',
        getPhase0DebugArtifactKinds: 'debug',
        buildPhase0JsonSnapshotExport: 'debug',
        buildPhase0DebugSummaryExport: 'debug',
        buildPhase0DebugArtifactBundle: 'debug',
        buildPhase0MarkdownSummary: 'debug',
        serializePhase0JsonSnapshot: 'debug',
        getPhase1SafeSummaryBundleContract: 'adapters',
        buildPhase1SafeSummaryBundle: 'adapters',
        getFrozenPhase0OutputWrappersContract: 'adapters',
        buildFrozenPhase0OutputWrappers: 'adapters',
        createPhase0OrchestrationAdapter: 'adapters',
        getPhase0GenerationScaffoldStatus: 'status'
    });

    function getPhase0EntryPoints() {
        return Object.freeze({
            intakeBaseRandomSeed: 'intakeBaseRandomSeed',
            intakeWorldPresetMode: 'intakeWorldPresetMode',
            intakeHardConstraintsProfile: 'intakeHardConstraintsProfile',
            normalizePhase0Options: 'normalizePhase0Options',
            normalizePhase0Input: 'normalizePhase0Input',
            assemblePhase0Bundle: 'assemblePhase0Bundle',
            createPhase0World: 'createPhase0World',
            buildWorldSeedProfile: 'buildWorldSeedProfile',
            synthesizeWorldTone: 'synthesizeWorldTone',
            deriveWorldTendencies: 'deriveWorldTendencies',
            getPhaseSubSeedNamingConventions: 'getPhaseSubSeedNamingConventions',
            getPhaseSubSeedNamespaceRegistry: 'getPhaseSubSeedNamespaceRegistry',
            resolvePhaseSubSeedNamespace: 'resolvePhaseSubSeedNamespace',
            getDownstreamReadableSubSeedExportContract: 'getDownstreamReadableSubSeedExportContract',
            buildDownstreamReadableSubSeedExport: 'buildDownstreamReadableSubSeedExport',
            resolveDownstreamReadableSubSeedEntry: 'resolveDownstreamReadableSubSeedEntry',
            deriveWorldSubSeedMap: 'deriveWorldSubSeedMap',
            buildPhase0ValidationReport: 'buildPhase0ValidationReport',
            validatePhase0Export: 'validatePhase0Export',
            createPhase0Rng: 'createPhase0Rng',
            assertPhase0BundleShape: 'assertPhase0BundleShape',
            getPhase0DebugArtifactKinds: 'getPhase0DebugArtifactKinds',
            buildPhase0JsonSnapshotExport: 'buildPhase0JsonSnapshotExport',
            buildPhase0DebugSummaryExport: 'buildPhase0DebugSummaryExport',
            buildPhase0DebugArtifactBundle: 'buildPhase0DebugArtifactBundle',
            buildPhase0MarkdownSummary: 'buildPhase0MarkdownSummary',
            serializePhase0JsonSnapshot: 'serializePhase0JsonSnapshot',
            getPhase1SafeSummaryBundleContract: 'getPhase1SafeSummaryBundleContract',
            buildPhase1SafeSummaryBundle: 'buildPhase1SafeSummaryBundle',
            getFrozenPhase0OutputWrappersContract: 'getFrozenPhase0OutputWrappersContract',
            buildFrozenPhase0OutputWrappers: 'buildFrozenPhase0OutputWrappers',
            createPhase0OrchestrationAdapter: 'createPhase0OrchestrationAdapter',
            getPhase0GenerationScaffoldStatus: 'getPhase0GenerationScaffoldStatus'
        });
    }

    function isPublicEntryPoint(entryPointId) {
        return typeof entryPointId === 'string'
            && PUBLIC_ENTRY_POINT_IDS.includes(entryPointId);
    }

    function resolvePhase0EntryPoint(entryPointId) {
        if (!isPublicEntryPoint(entryPointId)) {
            return null;
        }

        return typeof phase0[entryPointId] === 'function'
            ? phase0[entryPointId]
            : null;
    }

    function hasPhase0EntryPoint(entryPointId) {
        return typeof resolvePhase0EntryPoint(entryPointId) === 'function';
    }

    function getPhase0EntryPointDescriptors() {
        return PUBLIC_ENTRY_POINT_IDS.map((entryPointId) => Object.freeze({
            entryPointId,
            group: ENTRY_POINT_GROUPS[entryPointId] || 'runtime',
            available: hasPhase0EntryPoint(entryPointId),
            stub: true
        }));
    }

    function getPhase0PublicApi() {
        const entryPoints = getPhase0EntryPoints();
        const publicApi = {
            getPhase0EntryPoints,
            getPhase0EntryPointDescriptors,
            hasPhase0EntryPoint,
            resolvePhase0EntryPoint
        };

        Object.keys(entryPoints).forEach((alias) => {
            const entryPointId = entryPoints[alias];
            const implementation = resolvePhase0EntryPoint(entryPointId);

            if (typeof implementation === 'function') {
                publicApi[alias] = implementation;
            }
        });

        return Object.freeze(publicApi);
    }

    if (typeof phase0.registerModule === 'function') {
        phase0.registerModule('index', {
            entry: 'getPhase0PublicApi',
            file: 'js/worldgen/phase0/index.js',
            description: 'Top-level public export surface for the Phase 0 runtime scaffold.'
        });
    }

    Object.assign(phase0, {
        getPhase0EntryPoints,
        getPhase0EntryPointDescriptors,
        hasPhase0EntryPoint,
        resolvePhase0EntryPoint,
        getPhase0PublicApi
    });

    worldgen.phase0 = phase0;
    worldgen.getPhase0PublicApi = getPhase0PublicApi;
})();
