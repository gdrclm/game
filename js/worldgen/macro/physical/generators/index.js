(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const TODO_STATUS = macro.todoContractedCode || 'TODO_CONTRACTED';

    function freezeValue(value) {
        if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
            return value;
        }

        Object.freeze(value);
        Object.values(value).forEach((nestedValue) => {
            freezeValue(nestedValue);
        });
        return value;
    }

    function getPhysicalGeneratorEntryPoints() {
        return freezeValue({
            layerId: 'physical',
            generators: {
                tectonicSkeleton: {
                    entry: 'generateTectonicSkeleton',
                    moduleId: 'tectonicSkeletonGenerator',
                    pipelineStep: 'tectonicSkeleton',
                    file: 'js/worldgen/macro/tectonic-skeleton-generator.js',
                    status: typeof macro.getTectonicSkeletonGeneratorDescriptor === 'function'
                        ? macro.getTectonicSkeletonGeneratorDescriptor().status
                        : typeof macro.generateTectonicSkeleton === 'function'
                            ? 'stub_registered'
                            : TODO_STATUS
                },
                reliefElevation: {
                    entry: 'generateReliefElevation',
                    moduleId: 'reliefElevationGenerator',
                    pipelineStep: 'reliefElevation',
                    file: 'js/worldgen/macro/relief-elevation-generator.js',
                    status: typeof macro.getReliefElevationGeneratorDescriptor === 'function'
                        ? macro.getReliefElevationGeneratorDescriptor().status
                        : typeof macro.generateReliefElevation === 'function'
                            ? 'stub_registered'
                            : TODO_STATUS
                },
                hydrosphere: {
                    entry: 'generateHydrosphere',
                    moduleId: 'hydrosphereGenerator',
                    pipelineStep: 'hydrosphere',
                    file: 'js/worldgen/macro/hydrosphere-generator.js',
                    status: typeof macro.getHydrosphereGeneratorDescriptor === 'function'
                        ? macro.getHydrosphereGeneratorDescriptor().status
                        : typeof macro.generateHydrosphere === 'function'
                            ? 'stub_registered'
                            : TODO_STATUS
                },
                riverSystem: {
                    entry: 'generateRiverSystem',
                    moduleId: 'riverSystemGenerator',
                    pipelineStep: 'riverSystem',
                    file: 'js/worldgen/macro/river-system-generator.js',
                    status: typeof macro.getRiverSystemGeneratorDescriptor === 'function'
                        ? macro.getRiverSystemGeneratorDescriptor().status
                        : typeof macro.generateRiverSystem === 'function'
                            ? 'stub_registered'
                            : TODO_STATUS
                },
                marineCarving: {
                    entry: 'generateMarineCarving',
                    moduleId: 'marineCarvingGenerator',
                    pipelineStep: 'marineCarving',
                    file: 'js/worldgen/macro/marine-carving-generator.js',
                    status: typeof macro.getMarineCarvingGeneratorDescriptor === 'function'
                        ? macro.getMarineCarvingGeneratorDescriptor().status
                        : typeof macro.generateMarineCarving === 'function'
                            ? 'stub_registered'
                            : TODO_STATUS
                },
                climateEnvelope: {
                    entry: 'generateClimateEnvelope',
                    moduleId: 'climateEnvelopeGenerator',
                    pipelineStep: 'climateEnvelope',
                    file: 'js/worldgen/macro/climate-envelope-generator.js',
                    status: typeof macro.getClimateEnvelopeGeneratorDescriptor === 'function'
                        ? macro.getClimateEnvelopeGeneratorDescriptor().status
                        : typeof macro.generateClimateEnvelope === 'function'
                            ? 'stub_registered'
                            : TODO_STATUS
                },
                climatePressure: {
                    entry: 'generateClimatePressure',
                    moduleId: 'climatePressureGenerator',
                    pipelineStep: 'climatePressure',
                    file: 'js/worldgen/macro/climate-pressure-generator.js',
                    status: typeof macro.generateClimatePressure === 'function'
                        ? 'stub_registered'
                        : TODO_STATUS
                }
            }
        });
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('physicalGeneratorLayerScaffold', {
            entry: 'getPhysicalGeneratorEntryPoints',
            file: 'js/worldgen/macro/physical/generators/index.js',
            description: 'Scaffold entry point for Phase 1 physical-layer generators.',
            stub: false,
            scaffold: true
        });
    }

    Object.assign(macro, {
        getPhysicalGeneratorEntryPoints
    });
})();
