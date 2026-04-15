(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};

    function generateArchipelagoSignificance() {
        throw typeof macro.createTodoContractedError === 'function'
            ? macro.createTodoContractedError('archipelagoSignificance.generateArchipelagoSignificance')
            : new Error('[worldgen/macro] TODO CONTRACTED stub.');
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('archipelagoSignificanceGenerator', {
            entry: 'generateArchipelagoSignificance',
            file: 'js/worldgen/macro/archipelago-significance-generator.js',
            description: 'TODO CONTRACTED placeholder for archipelago significance generation.'
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep('archipelagoSignificance', {
            moduleId: 'archipelagoSignificanceGenerator',
            file: 'js/worldgen/macro/archipelago-significance-generator.js',
            description: 'TODO CONTRACTED pipeline entry for archipelago significance.'
        });
    }

    Object.assign(macro, {
        generateArchipelagoSignificance
    });
})();
