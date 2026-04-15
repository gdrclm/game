(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};

    function analyzeCoastalOpportunity() {
        throw typeof macro.createTodoContractedError === 'function'
            ? macro.createTodoContractedError('coastalOpportunity.analyzeCoastalOpportunity')
            : new Error('[worldgen/macro] TODO CONTRACTED stub.');
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('coastalOpportunityAnalyzer', {
            entry: 'analyzeCoastalOpportunity',
            file: 'js/worldgen/macro/coastal-opportunity-analyzer.js',
            description: 'TODO CONTRACTED placeholder for coastal opportunity analysis.'
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep('coastalOpportunity', {
            moduleId: 'coastalOpportunityAnalyzer',
            file: 'js/worldgen/macro/coastal-opportunity-analyzer.js',
            description: 'TODO CONTRACTED pipeline entry for coastal opportunity.'
        });
    }

    Object.assign(macro, {
        analyzeCoastalOpportunity
    });
})();
