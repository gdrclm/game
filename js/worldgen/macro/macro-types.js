(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};

    function freezeSection(section = {}) {
        return Object.freeze({ ...section });
    }

    function getContractSnapshot(getterName) {
        return typeof macro[getterName] === 'function'
            ? macro[getterName]()
            : null;
    }

    function getRequiredFunction(functionName) {
        return typeof macro[functionName] === 'function'
            ? macro[functionName]
            : null;
    }

    function getMacroTypeContracts() {
        return freezeSection({
            macroSeedProfile: getContractSnapshot('getMacroSeedProfileContract'),
            macroGeographyPackage: getContractSnapshot('getMacroGeographyPackageContract'),
            validationReport: getContractSnapshot('getValidationReportContract'),
            continentRecord: getContractSnapshot('getContinentRecordContract'),
            seaRegionRecord: getContractSnapshot('getSeaRegionRecordContract'),
            archipelagoRegionRecord: getContractSnapshot('getArchipelagoRegionRecordContract'),
            chokepointRecord: getContractSnapshot('getChokepointRecordContract'),
            macroRouteRecord: getContractSnapshot('getMacroRouteRecordContract'),
            strategicRegionRecord: getContractSnapshot('getStrategicRegionRecordContract')
        });
    }

    function getMacroTypeFactories() {
        return freezeSection({
            macroSeedProfile: getRequiredFunction('createMacroSeedProfileSkeleton'),
            macroGeographyPackage: getRequiredFunction('createMacroGeographyPackageSkeleton'),
            validationReport: getRequiredFunction('createValidationReportSkeleton'),
            continentRecord: getRequiredFunction('createContinentRecordSkeleton'),
            seaRegionRecord: getRequiredFunction('createSeaRegionRecordSkeleton'),
            archipelagoRegionRecord: getRequiredFunction('createArchipelagoRegionRecordSkeleton'),
            chokepointRecord: getRequiredFunction('createChokepointRecordSkeleton'),
            macroRouteRecord: getRequiredFunction('createMacroRouteRecordSkeleton'),
            strategicRegionRecord: getRequiredFunction('createStrategicRegionRecordSkeleton')
        });
    }

    function getMacroTypeValidators() {
        return freezeSection({
            macroSeedProfile: getRequiredFunction('validateMacroSeedProfile'),
            macroGeographyPackage: getRequiredFunction('validateMacroGeographyPackage'),
            validationReport: getRequiredFunction('validateValidationReport'),
            continentRecord: getRequiredFunction('validateContinentRecord'),
            seaRegionRecord: getRequiredFunction('validateSeaRegionRecord'),
            archipelagoRegionRecord: getRequiredFunction('validateArchipelagoRegionRecord'),
            chokepointRecord: getRequiredFunction('validateChokepointRecord'),
            macroRouteRecord: getRequiredFunction('validateMacroRouteRecord'),
            strategicRegionRecord: getRequiredFunction('validateStrategicRegionRecord')
        });
    }

    function getMacroTypeAssertions() {
        return freezeSection({
            macroSeedProfile: getRequiredFunction('assertMacroSeedProfile'),
            macroGeographyPackage: getRequiredFunction('assertMacroGeographyPackage'),
            validationReport: getRequiredFunction('assertValidationReport'),
            continentRecord: getRequiredFunction('assertContinentRecord'),
            seaRegionRecord: getRequiredFunction('assertSeaRegionRecord'),
            archipelagoRegionRecord: getRequiredFunction('assertArchipelagoRegionRecord'),
            chokepointRecord: getRequiredFunction('assertChokepointRecord'),
            macroRouteRecord: getRequiredFunction('assertMacroRouteRecord'),
            strategicRegionRecord: getRequiredFunction('assertStrategicRegionRecord')
        });
    }

    function getMacroTypeRegistries() {
        return freezeSection({
            macroContracts: typeof macro.getMacroContractRegistry === 'function'
                ? macro.getMacroContractRegistry()
                : {},
            regionContracts: typeof macro.getRegionContractRegistry === 'function'
                ? macro.getRegionContractRegistry()
                : {},
            regionEntryPoints: typeof macro.getRegionRecordEntryPoints === 'function'
                ? macro.getRegionRecordEntryPoints()
                : {}
        });
    }

    function getMacroTypesApi() {
        return freezeSection({
            phaseId: macro.phaseId || 'phase1',
            phaseVersion: macro.phaseVersion || 'phase1-v1',
            contracts: getMacroTypeContracts(),
            create: getMacroTypeFactories(),
            validate: getMacroTypeValidators(),
            assert: getMacroTypeAssertions(),
            registries: getMacroTypeRegistries()
        });
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('macroTypes', {
            entry: 'getMacroTypesApi',
            file: 'js/worldgen/macro/macro-types.js',
            description: 'Unified contract and validator export API for Phase 1 macro worldgen types.',
            stub: false
        });
    }

    Object.assign(macro, {
        getMacroTypeContracts,
        getMacroTypeFactories,
        getMacroTypeValidators,
        getMacroTypeAssertions,
        getMacroTypeRegistries,
        getMacroTypesApi
    });
})();
