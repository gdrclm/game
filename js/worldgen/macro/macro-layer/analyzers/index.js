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

    function getMacroLayerAnalyzerEntryPoints() {
        return freezeValue({
            layerId: 'macro-layer',
            analyzers: {
                continentalCohesion: {
                    entry: 'analyzeContinentalCohesion',
                    moduleId: 'continentalCohesionAnalyzer',
                    pipelineStep: 'continentalCohesion',
                    file: 'js/worldgen/macro/continental-cohesion-analyzer.js',
                    status: typeof macro.analyzeContinentalCohesion === 'function'
                        ? 'stub_registered'
                        : TODO_STATUS
                },
                coastalOpportunity: {
                    entry: 'analyzeCoastalOpportunity',
                    moduleId: 'coastalOpportunityAnalyzer',
                    pipelineStep: 'coastalOpportunity',
                    file: 'js/worldgen/macro/coastal-opportunity-analyzer.js',
                    status: typeof macro.analyzeCoastalOpportunity === 'function'
                        ? 'stub_registered'
                        : TODO_STATUS
                },
                flowRoutes: {
                    entry: 'analyzeFlowRoutes',
                    moduleId: 'flowRouteAnalyzer',
                    pipelineStep: 'flowRoutes',
                    file: 'js/worldgen/macro/flow-route-analyzer.js',
                    status: typeof macro.analyzeFlowRoutes === 'function'
                        ? 'stub_registered'
                        : TODO_STATUS
                },
                chokepoints: {
                    entry: 'analyzeChokepoints',
                    moduleId: 'chokepointAnalyzer',
                    pipelineStep: 'chokepoints',
                    file: 'js/worldgen/macro/chokepoint-analyzer.js',
                    status: typeof macro.analyzeChokepoints === 'function'
                        ? 'stub_registered'
                        : TODO_STATUS
                },
                isolationPeriphery: {
                    entry: 'analyzeIsolationPeriphery',
                    moduleId: 'isolationPeripheryAnalyzer',
                    pipelineStep: 'isolationPeriphery',
                    file: 'js/worldgen/macro/isolation-periphery-analyzer.js',
                    status: typeof macro.analyzeIsolationPeriphery === 'function'
                        ? 'stub_registered'
                        : TODO_STATUS
                },
                archipelagoSignificance: {
                    entry: 'generateArchipelagoSignificance',
                    moduleId: 'archipelagoSignificanceGenerator',
                    pipelineStep: 'archipelagoSignificance',
                    file: 'js/worldgen/macro/archipelago-significance-generator.js',
                    status: typeof macro.generateArchipelagoSignificance === 'function'
                        ? 'stub_registered'
                        : TODO_STATUS
                },
                validationRebalance: {
                    entry: 'validateAndRebalanceMacroWorld',
                    moduleId: 'macroValidationAndRebalance',
                    pipelineStep: 'validationRebalance',
                    file: 'js/worldgen/macro/macro-validation-and-rebalance.js',
                    status: typeof macro.validateAndRebalanceMacroWorld === 'function'
                        ? 'stub_registered'
                        : TODO_STATUS
                }
            }
        });
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('macroLayerAnalyzerScaffold', {
            entry: 'getMacroLayerAnalyzerEntryPoints',
            file: 'js/worldgen/macro/macro-layer/analyzers/index.js',
            description: 'Scaffold entry point for Phase 1 macro-layer analyzers.',
            stub: false,
            scaffold: true
        });
    }

    Object.assign(macro, {
        getMacroLayerAnalyzerEntryPoints
    });
})();
