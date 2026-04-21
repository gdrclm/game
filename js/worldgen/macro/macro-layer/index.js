(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};

    function freezeValue(value) {
        if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
            return value;
        }

        Object.freeze(value);
        Object.values(value).forEach((nestedValue) => {
            freezeValue(nestedValue);
        });
        return value;
    }

    function getMacroLayerEntryPoints() {
        return freezeValue({
            layerId: 'macro-layer',
            contracts: typeof macro.getMacroLayerContractEntryPoints === 'function'
                ? macro.getMacroLayerContractEntryPoints()
                : null,
            analyzers: typeof macro.getMacroLayerAnalyzerEntryPoints === 'function'
                ? macro.getMacroLayerAnalyzerEntryPoints()
                : null,
            debug: typeof macro.getMacroLayerDebugEntryPoints === 'function'
                ? macro.getMacroLayerDebugEntryPoints()
                : null
        });
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('macroLayerScaffold', {
            entry: 'getMacroLayerEntryPoints',
            file: 'js/worldgen/macro/macro-layer/index.js',
            description: 'Top-level scaffold entry point for the Phase 1 macro layer.',
            stub: false,
            scaffold: true
        });
    }

    Object.assign(macro, {
        getMacroLayerEntryPoints
    });
})();
