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

    function getPhysicalContractEntryPoints() {
        return freezeValue({
            layerId: 'physical',
            packageKeys: [
                'plates',
                'continents',
                'seaRegions',
                'mountainSystems',
                'volcanicZones',
                'riverBasins',
                'climateBands',
                'reliefRegions'
            ],
            records: {
                plateRecord: {
                    contract: 'getPlateRecordContract',
                    status: typeof macro.getPlateRecordContract === 'function'
                        ? 'implemented'
                        : TODO_STATUS
                },
                continentRecord: {
                    contract: 'getContinentRecordContract',
                    status: typeof macro.getContinentRecordContract === 'function'
                        ? 'implemented'
                        : TODO_STATUS
                },
                seaRegionRecord: {
                    contract: 'getSeaRegionRecordContract',
                    status: typeof macro.getSeaRegionRecordContract === 'function'
                        ? 'implemented'
                        : TODO_STATUS
                },
                mountainSystemRecord: {
                    contract: 'getMountainSystemRecordContract',
                    status: typeof macro.getMountainSystemRecordContract === 'function'
                        ? 'implemented'
                        : TODO_STATUS
                },
                volcanicZoneRecord: {
                    contract: 'getVolcanicZoneRecordContract',
                    status: typeof macro.getVolcanicZoneRecordContract === 'function'
                        ? 'implemented'
                        : TODO_STATUS
                },
                riverBasinRecord: {
                    contract: 'getRiverBasinRecordContract',
                    status: typeof macro.getRiverBasinRecordContract === 'function'
                        ? 'implemented'
                        : TODO_STATUS
                },
                climateBandRecord: {
                    contract: 'getClimateBandRecordContract',
                    status: typeof macro.getClimateBandRecordContract === 'function'
                        ? 'implemented'
                        : TODO_STATUS
                },
                reliefRegionRecord: {
                    contract: 'getReliefRegionRecordContract',
                    status: typeof macro.getReliefRegionRecordContract === 'function'
                        ? 'implemented'
                        : TODO_STATUS
                }
            }
        });
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('physicalContractLayerScaffold', {
            entry: 'getPhysicalContractEntryPoints',
            file: 'js/worldgen/macro/physical/contracts/index.js',
            description: 'Scaffold entry point for Phase 1 physical-layer contracts.',
            stub: false,
            scaffold: true
        });
    }

    Object.assign(macro, {
        getPhysicalContractEntryPoints
    });
})();
