(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const debugArtifactKinds = Object.freeze([
        'seedProfileSnapshot',
        'physicalWorldDebugBundle',
        'fieldSnapshot',
        'graphSnapshot',
        'summary',
        'validationReport'
    ]);
    const buildRegisteredFieldDebugArtifact = typeof macro.buildFieldDebugArtifact === 'function'
        ? macro.buildFieldDebugArtifact
        : null;

    function getDebugArtifactKinds() {
        return debugArtifactKinds.slice();
    }

    function buildSeedProfileSnapshotArtifact(input = {}, options = {}) {
        if (typeof macro.createMacroSeedProfileSnapshot === 'function') {
            return macro.createMacroSeedProfileSnapshot(input, options);
        }

        throw typeof macro.createTodoContractedError === 'function'
            ? macro.createTodoContractedError('debug.buildSeedProfileSnapshotArtifact')
            : new Error('[worldgen/macro] TODO CONTRACTED stub.');
    }

    function buildSeedProfileDebugArtifact(input = {}, options = {}) {
        if (typeof macro.buildMacroSeedProfileDebugExport === 'function') {
            return macro.buildMacroSeedProfileDebugExport(input, options);
        }

        throw typeof macro.createTodoContractedError === 'function'
            ? macro.createTodoContractedError('debug.buildSeedProfileDebugArtifact')
            : new Error('[worldgen/macro] TODO CONTRACTED stub.');
    }

    function buildScalarFieldHeatmapDebugArtifact(field, options = {}) {
        if (typeof macro.buildScalarFieldHeatmapArtifact === 'function') {
            return macro.buildScalarFieldHeatmapArtifact(field, options);
        }

        throw typeof macro.createTodoContractedError === 'function'
            ? macro.createTodoContractedError('debug.buildScalarFieldHeatmapDebugArtifact')
            : new Error('[worldgen/macro] TODO CONTRACTED stub.');
    }

    function buildDirectionalFieldVectorDebugArtifact(field, options = {}) {
        if (typeof macro.buildDirectionalFieldVectorArtifact === 'function') {
            return macro.buildDirectionalFieldVectorArtifact(field, options);
        }

        throw typeof macro.createTodoContractedError === 'function'
            ? macro.createTodoContractedError('debug.buildDirectionalFieldVectorDebugArtifact')
            : new Error('[worldgen/macro] TODO CONTRACTED stub.');
    }

    function buildFieldDebugArtifact(field, options = {}) {
        if (buildRegisteredFieldDebugArtifact) {
            return buildRegisteredFieldDebugArtifact(field, options);
        }

        throw typeof macro.createTodoContractedError === 'function'
            ? macro.createTodoContractedError('debug.buildFieldDebugArtifact')
            : new Error('[worldgen/macro] TODO CONTRACTED stub.');
    }

    function buildDebugArtifactBundle(input = {}, options = {}) {
        if (typeof macro.buildPhysicalWorldDebugBundle === 'function') {
            return macro.buildPhysicalWorldDebugBundle({
                ...(input || {}),
                debugOptions: options || {}
            });
        }

        throw typeof macro.createTodoContractedError === 'function'
            ? macro.createTodoContractedError('debug.buildDebugArtifactBundle')
            : new Error('[worldgen/macro] buildPhysicalWorldDebugBundle is unavailable.');
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('debugArtifacts', {
            entry: 'buildDebugArtifactBundle',
            file: 'js/worldgen/macro/debug/index.js',
            description: 'Debug artifact export helpers plus deterministic end-to-end Phase 1 debug bundle assembly.'
        });
    }

    Object.assign(macro, {
        getDebugArtifactKinds,
        buildSeedProfileSnapshotArtifact,
        buildSeedProfileDebugArtifact,
        buildScalarFieldHeatmapDebugArtifact,
        buildDirectionalFieldVectorDebugArtifact,
        buildFieldDebugArtifact,
        buildDebugArtifactBundle
    });
})();
