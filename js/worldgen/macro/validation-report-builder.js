(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};

    function buildMacroValidationReport() {
        throw typeof macro.createTodoContractedError === 'function'
            ? macro.createTodoContractedError('validationReportBuilder.buildMacroValidationReport')
            : new Error('[worldgen/macro] TODO CONTRACTED stub.');
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('validationReportBuilder', {
            entry: 'buildMacroValidationReport',
            file: 'js/worldgen/macro/validation-report-builder.js',
            description: 'Validation report builder placeholder for future Phase 1 scoring.'
        });
    }

    Object.assign(macro, {
        buildMacroValidationReport
    });
})();
