(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const TODO_STATUS = macro.todoContractedCode || 'TODO_CONTRACTED';

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

    function getPhysicalDebugEntryPoints() {
        return freezeValue({
            layerId: 'physical',
            debugArtifacts: {
                seedProfileSnapshot: {
                    entry: 'buildSeedProfileDebugArtifact',
                    status: typeof macro.buildSeedProfileDebugArtifact === 'function'
                        ? 'implemented'
                        : TODO_STATUS
                },
                tectonicFieldSnapshots: {
                    entry: 'buildTectonicFieldSnapshots',
                    status: typeof macro.buildTectonicFieldSnapshots === 'function'
                        ? 'implemented'
                        : TODO_STATUS
                },
                platePressureHeatmap: {
                    entry: null,
                    status: TODO_STATUS
                },
                marineInvasionHeatmap: {
                    entry: null,
                    status: TODO_STATUS
                },
                climateStressHeatmap: {
                    entry: null,
                    status: TODO_STATUS
                },
                physicalLayerBundle: {
                    entry: null,
                    status: TODO_STATUS
                }
            }
        });
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('physicalDebugLayerScaffold', {
            entry: 'getPhysicalDebugEntryPoints',
            file: 'js/worldgen/macro/physical/debug/index.js',
            description: 'Scaffold entry point for Phase 1 physical-layer debug exports.',
            stub: false,
            scaffold: true
        });
    }

    Object.assign(macro, {
        getPhysicalDebugEntryPoints
    });
})();
