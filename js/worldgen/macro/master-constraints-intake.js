(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};

    function intakeMasterConstraints() {
        throw typeof macro.createTodoContractedError === 'function'
            ? macro.createTodoContractedError('masterConstraintsIntake.intakeMasterConstraints')
            : new Error('[worldgen/macro] TODO CONTRACTED stub.');
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('masterConstraintsIntake', {
            entry: 'intakeMasterConstraints',
            file: 'js/worldgen/macro/master-constraints-intake.js',
            description: 'TODO CONTRACTED placeholder for Phase 1 master constraints intake.'
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep('masterConstraintsIntake', {
            moduleId: 'masterConstraintsIntake',
            file: 'js/worldgen/macro/master-constraints-intake.js',
            description: 'TODO CONTRACTED pipeline entry for master constraints intake.'
        });
    }

    Object.assign(macro, {
        intakeMasterConstraints
    });
})();
