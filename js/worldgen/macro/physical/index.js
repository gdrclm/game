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

    function getPhysicalLayerEntryPoints() {
        return freezeValue({
            layerId: 'physical',
            contracts: typeof macro.getPhysicalContractEntryPoints === 'function'
                ? macro.getPhysicalContractEntryPoints()
                : null,
            generators: typeof macro.getPhysicalGeneratorEntryPoints === 'function'
                ? macro.getPhysicalGeneratorEntryPoints()
                : null,
            debug: typeof macro.getPhysicalDebugEntryPoints === 'function'
                ? macro.getPhysicalDebugEntryPoints()
                : null
        });
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('physicalLayerScaffold', {
            entry: 'getPhysicalLayerEntryPoints',
            file: 'js/worldgen/macro/physical/index.js',
            description: 'Top-level scaffold entry point for the Phase 1 physical layer.',
            stub: false,
            scaffold: true
        });
    }

    Object.assign(macro, {
        getPhysicalLayerEntryPoints
    });
})();
