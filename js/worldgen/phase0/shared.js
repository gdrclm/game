(() => {
    const game = window.Game;
    const worldgen = game.systems.worldgen = game.systems.worldgen || {};
    const phase0 = game.systems.worldgenPhase0 = game.systems.worldgenPhase0 || {};
    const expectedPipelineStepIds = Object.freeze([
        'inputIntake',
        'deterministicRng',
        'worldProfileSynthesis',
        'worldToneSynthesis',
        'derivedTendencies',
        'subSeedDerivation',
        'validationPass',
        'exportBundleAssembly'
    ]);
    const moduleRegistry = phase0._moduleRegistry instanceof Map
        ? phase0._moduleRegistry
        : new Map();
    const pipelineRegistry = phase0._pipelineRegistry instanceof Map
        ? phase0._pipelineRegistry
        : new Map();
    const PHASE_ID = 'phase0';
    const PHASE_VERSION = 'phase0-v1';
    const TODO_CONTRACTED_CODE = 'TODO_CONTRACTED';

    function cloneDescriptor(descriptor = {}) {
        return Object.freeze({ ...descriptor });
    }

    function normalizeSeed(seed) {
        const numericSeed = Number(seed);
        if (!Number.isFinite(numericSeed)) {
            return 0;
        }

        return numericSeed >>> 0;
    }

    function createTodoContractedError(entryId) {
        const error = new Error(`[worldgen/phase0] ${entryId} is a TODO CONTRACTED stub.`);
        error.code = TODO_CONTRACTED_CODE;
        return error;
    }

    function registerModule(moduleId, descriptor = {}) {
        if (typeof moduleId !== 'string' || !moduleId.trim()) {
            throw new Error('[worldgen/phase0] moduleId is required.');
        }

        const normalizedModuleId = moduleId.trim();
        const nextDescriptor = cloneDescriptor({
            moduleId: normalizedModuleId,
            phaseId: PHASE_ID,
            phaseVersion: PHASE_VERSION,
            stub: true,
            ...descriptor
        });

        moduleRegistry.set(normalizedModuleId, nextDescriptor);
        return nextDescriptor;
    }

    function registerPipelineStep(stepId, descriptor = {}) {
        if (typeof stepId !== 'string' || !stepId.trim()) {
            throw new Error('[worldgen/phase0] stepId is required.');
        }

        const normalizedStepId = stepId.trim();
        const order = expectedPipelineStepIds.indexOf(normalizedStepId);
        const nextDescriptor = cloneDescriptor({
            stepId: normalizedStepId,
            phaseId: PHASE_ID,
            phaseVersion: PHASE_VERSION,
            stub: true,
            order: order >= 0 ? order : Number.MAX_SAFE_INTEGER,
            ...descriptor
        });

        pipelineRegistry.set(normalizedStepId, nextDescriptor);
        return nextDescriptor;
    }

    function getRegisteredModules() {
        return Array.from(moduleRegistry.values()).sort((left, right) => left.moduleId.localeCompare(right.moduleId));
    }

    function getPipelineStepDescriptors() {
        return Array.from(pipelineRegistry.values()).sort((left, right) => {
            if (left.order !== right.order) {
                return left.order - right.order;
            }

            return left.stepId.localeCompare(right.stepId);
        });
    }

    function getExpectedPipelineStepIds() {
        return expectedPipelineStepIds.slice();
    }

    Object.assign(phase0, {
        _moduleRegistry: moduleRegistry,
        _pipelineRegistry: pipelineRegistry,
        phaseId: PHASE_ID,
        phaseVersion: PHASE_VERSION,
        todoContractedCode: TODO_CONTRACTED_CODE,
        normalizeSeed,
        createTodoContractedError,
        registerModule,
        registerPipelineStep,
        getRegisteredModules,
        getPipelineStepDescriptors,
        getExpectedPipelineStepIds
    });

    worldgen.phase0 = phase0;
})();
