(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};

    function analyzeFlowRoutes() {
        throw typeof macro.createTodoContractedError === 'function'
            ? macro.createTodoContractedError('flowRoutes.analyzeFlowRoutes')
            : new Error('[worldgen/macro] TODO CONTRACTED stub.');
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('flowRouteAnalyzer', {
            entry: 'analyzeFlowRoutes',
            file: 'js/worldgen/macro/flow-route-analyzer.js',
            description: 'TODO CONTRACTED placeholder for route and flow analysis.'
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep('flowRoutes', {
            moduleId: 'flowRouteAnalyzer',
            file: 'js/worldgen/macro/flow-route-analyzer.js',
            description: 'TODO CONTRACTED pipeline entry for route and flow analysis.'
        });
    }

    Object.assign(macro, {
        analyzeFlowRoutes
    });
})();
