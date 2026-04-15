(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};

    function generateClimatePressure() {
        throw typeof macro.createTodoContractedError === 'function'
            ? macro.createTodoContractedError('climatePressure.generateClimatePressure')
            : new Error('[worldgen/macro] TODO CONTRACTED stub.');
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('climatePressureGenerator', {
            entry: 'generateClimatePressure',
            file: 'js/worldgen/macro/climate-pressure-generator.js',
            description: 'TODO CONTRACTED placeholder for climate pressure generation.'
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep('climatePressure', {
            moduleId: 'climatePressureGenerator',
            file: 'js/worldgen/macro/climate-pressure-generator.js',
            description: 'TODO CONTRACTED pipeline entry for climate pressure.'
        });
    }

    Object.assign(macro, {
        generateClimatePressure
    });
})();
