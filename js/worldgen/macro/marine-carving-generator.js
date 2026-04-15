(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};

    function generateMarineCarving() {
        throw typeof macro.createTodoContractedError === 'function'
            ? macro.createTodoContractedError('marineCarving.generateMarineCarving')
            : new Error('[worldgen/macro] TODO CONTRACTED stub.');
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('marineCarvingGenerator', {
            entry: 'generateMarineCarving',
            file: 'js/worldgen/macro/marine-carving-generator.js',
            description: 'TODO CONTRACTED placeholder for marine carving generation.'
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep('marineCarving', {
            moduleId: 'marineCarvingGenerator',
            file: 'js/worldgen/macro/marine-carving-generator.js',
            description: 'TODO CONTRACTED pipeline entry for marine carving.'
        });
    }

    Object.assign(macro, {
        generateMarineCarving
    });
})();
