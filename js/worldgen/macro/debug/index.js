(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const debugArtifactKinds = Object.freeze([
        'seedProfileSnapshot',
        'fieldSnapshot',
        'graphSnapshot',
        'summary',
        'validationReport'
    ]);

    function getDebugArtifactKinds() {
        return debugArtifactKinds.slice();
    }

    function buildSeedProfileDebugArtifact(input = {}, options = {}) {
        if (typeof macro.buildMacroSeedProfileDebugExport === 'function') {
            return macro.buildMacroSeedProfileDebugExport(input, options);
        }

        throw typeof macro.createTodoContractedError === 'function'
            ? macro.createTodoContractedError('debug.buildSeedProfileDebugArtifact')
            : new Error('[worldgen/macro] TODO CONTRACTED stub.');
    }

    function buildDebugArtifactBundle() {
        throw typeof macro.createTodoContractedError === 'function'
            ? macro.createTodoContractedError('debug.buildDebugArtifactBundle')
            : new Error('[worldgen/macro] TODO CONTRACTED stub.');
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('debugArtifacts', {
            entry: 'buildDebugArtifactBundle',
            file: 'js/worldgen/macro/debug/index.js',
            description: 'Debug artifact export helpers plus placeholder bundle builder for future Phase 1 layers.'
        });
    }

    Object.assign(macro, {
        getDebugArtifactKinds,
        buildSeedProfileDebugArtifact,
        buildDebugArtifactBundle
    });
})();
