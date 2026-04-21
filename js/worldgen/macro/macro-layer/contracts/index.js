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

    function getMacroLayerContractEntryPoints() {
        return freezeValue({
            layerId: 'macro-layer',
            packageKeys: [
                'archipelagoRegions',
                'coastalOpportunityMap',
                'chokepoints',
                'macroRoutes',
                'isolatedZones',
                'strategicRegions',
                'validationReport'
            ],
            records: {
                archipelagoRegionRecord: {
                    contract: 'getArchipelagoRegionRecordContract',
                    status: typeof macro.getArchipelagoRegionRecordContract === 'function'
                        ? 'implemented'
                        : TODO_STATUS
                },
                chokepointRecord: {
                    contract: 'getChokepointRecordContract',
                    status: typeof macro.getChokepointRecordContract === 'function'
                        ? 'implemented'
                        : TODO_STATUS
                },
                macroRouteRecord: {
                    contract: 'getMacroRouteRecordContract',
                    status: typeof macro.getMacroRouteRecordContract === 'function'
                        ? 'implemented'
                        : TODO_STATUS
                },
                isolatedZoneRecord: {
                    contract: null,
                    status: TODO_STATUS
                },
                strategicRegionRecord: {
                    contract: 'getStrategicRegionRecordContract',
                    status: typeof macro.getStrategicRegionRecordContract === 'function'
                        ? 'implemented'
                        : TODO_STATUS
                },
                validationReport: {
                    contract: 'getValidationReportContract',
                    status: typeof macro.getValidationReportContract === 'function'
                        ? 'implemented'
                        : TODO_STATUS
                }
            }
        });
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('macroLayerContractScaffold', {
            entry: 'getMacroLayerContractEntryPoints',
            file: 'js/worldgen/macro/macro-layer/contracts/index.js',
            description: 'Scaffold entry point for Phase 1 macro-layer contracts.',
            stub: false,
            scaffold: true
        });
    }

    Object.assign(macro, {
        getMacroLayerContractEntryPoints
    });
})();
