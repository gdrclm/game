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

    function getMacroLayerDebugEntryPoints() {
        return freezeValue({
            layerId: 'macro-layer',
            debugArtifacts: {
                coastalOpportunitySnapshot: {
                    entry: null,
                    status: TODO_STATUS
                },
                routeGraphSnapshot: {
                    entry: null,
                    status: TODO_STATUS
                },
                chokepointOverlay: {
                    entry: null,
                    status: TODO_STATUS
                },
                archipelagoSignificanceSummary: {
                    entry: null,
                    status: TODO_STATUS
                },
                validationReport: {
                    entry: 'buildMacroValidationReport',
                    status: typeof macro.buildMacroValidationReport === 'function'
                        ? 'stub_registered'
                        : TODO_STATUS
                },
                macroLayerBundle: {
                    entry: 'buildDebugArtifactBundle',
                    status: typeof macro.buildDebugArtifactBundle === 'function'
                        ? 'stub_registered'
                        : TODO_STATUS
                }
            }
        });
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('macroLayerDebugScaffold', {
            entry: 'getMacroLayerDebugEntryPoints',
            file: 'js/worldgen/macro/macro-layer/debug/index.js',
            description: 'Scaffold entry point for Phase 1 macro-layer debug exports.',
            stub: false,
            scaffold: true
        });
    }

    Object.assign(macro, {
        getMacroLayerDebugEntryPoints
    });
})();
