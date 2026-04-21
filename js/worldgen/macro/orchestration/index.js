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

    function getPhysicalMacroOrchestrationEntryPoints() {
        return freezeValue({
            phaseId: macro.phaseId || 'phase1',
            layerOrder: ['physical', 'macro-layer'],
            intake: {
                entry: 'intakeMasterConstraints',
                moduleId: 'masterConstraintsIntake',
                pipelineStep: 'masterConstraintsIntake',
                file: 'js/worldgen/macro/master-constraints-intake.js',
                status: typeof macro.intakeMasterConstraints === 'function'
                    ? 'stub_registered'
                    : TODO_STATUS
            },
            physicalLayer: {
                entry: 'getPhysicalLayerEntryPoints',
                status: typeof macro.getPhysicalLayerEntryPoints === 'function'
                    ? 'implemented'
                    : TODO_STATUS
            },
            macroLayer: {
                entry: 'getMacroLayerEntryPoints',
                status: typeof macro.getMacroLayerEntryPoints === 'function'
                    ? 'implemented'
                    : TODO_STATUS
            },
            validationReportBuilder: {
                entry: 'buildMacroValidationReport',
                moduleId: 'validationReportBuilder',
                file: 'js/worldgen/macro/validation-report-builder.js',
                status: typeof macro.buildMacroValidationReport === 'function'
                    ? 'stub_registered'
                    : TODO_STATUS
            },
            exportPackageBuilder: {
                entry: 'buildMacroGeographyPackage',
                moduleId: 'macroGeographyPackageBuilder',
                pipelineStep: 'exportPackage',
                file: 'js/worldgen/macro/macro-geography-package-builder.js',
                status: typeof macro.buildMacroGeographyPackage === 'function'
                    ? 'stub_registered'
                    : TODO_STATUS
            },
            topLevelGenerator: {
                entry: 'generateMacroGeographyPackage',
                moduleId: 'macroGeographyGenerator',
                file: 'js/worldgen/macro/macro-geography-generator.js',
                status: typeof macro.generateMacroGeographyPackage === 'function'
                    ? 'stub_registered'
                    : TODO_STATUS
            }
        });
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('physicalMacroOrchestrationScaffold', {
            entry: 'getPhysicalMacroOrchestrationEntryPoints',
            file: 'js/worldgen/macro/orchestration/index.js',
            description: 'Scaffold entry point for Phase 1 physical + macro orchestration.',
            stub: false,
            scaffold: true
        });
    }

    Object.assign(macro, {
        getPhysicalMacroOrchestrationEntryPoints
    });
})();
