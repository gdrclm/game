(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};

    function generateMacroGeographyPackage(input = {}) {
        const normalizedSeed = typeof macro.normalizeSeed === 'function'
            ? macro.normalizeSeed(input.seed)
            : 0;

        throw typeof macro.createTodoContractedError === 'function'
            ? macro.createTodoContractedError(`macroGeographyGenerator.generateMacroGeographyPackage(seed=${normalizedSeed})`)
            : new Error('[worldgen/macro] TODO CONTRACTED stub.');
    }

    function getMacroGenerationScaffoldStatus() {
        const registeredModules = typeof macro.getRegisteredModules === 'function'
            ? macro.getRegisteredModules()
            : [];
        const pipelineSteps = typeof macro.getPipelineStepDescriptors === 'function'
            ? macro.getPipelineStepDescriptors()
            : [];
        const expectedPipeline = typeof macro.getExpectedPipelineStepIds === 'function'
            ? macro.getExpectedPipelineStepIds()
            : [];

        return {
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: macro.phaseVersion || 'phase1-v1',
            stub: true,
            registeredModuleCount: registeredModules.length,
            registeredModules,
            expectedPipeline,
            pipelineSteps
        };
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('macroGeographyGenerator', {
            entry: 'generateMacroGeographyPackage',
            file: 'js/worldgen/macro/macro-geography-generator.js',
            description: 'Phase 1 top-level generator entry point scaffold.'
        });
    }

    Object.assign(macro, {
        generateMacroGeographyPackage,
        getMacroGenerationScaffoldStatus
    });
})();
