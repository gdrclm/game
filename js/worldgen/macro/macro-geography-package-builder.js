(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};

    function buildMacroGeographyPackage() {
        throw typeof macro.createTodoContractedError === 'function'
            ? macro.createTodoContractedError('macroGeographyPackageBuilder.buildMacroGeographyPackage')
            : new Error('[worldgen/macro] TODO CONTRACTED stub.');
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('macroGeographyPackageBuilder', {
            entry: 'buildMacroGeographyPackage',
            file: 'js/worldgen/macro/macro-geography-package-builder.js',
            description: 'Export-package builder entry point placeholder for Phase 1.'
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep('exportPackage', {
            moduleId: 'macroGeographyPackageBuilder',
            file: 'js/worldgen/macro/macro-geography-package-builder.js',
            description: 'TODO CONTRACTED export-package step placeholder.'
        });
    }

    Object.assign(macro, {
        buildMacroGeographyPackage
    });
})();
