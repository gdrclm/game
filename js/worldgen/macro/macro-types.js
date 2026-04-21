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
            physicalWorldDebugBundle: getContractSnapshot('getPhysicalWorldDebugBundleContract'),
            scalarFieldHeatmapArtifact: getContractSnapshot('getScalarFieldHeatmapArtifactContract'),
            directionalFieldVectorArtifact: getContractSnapshot('getDirectionalFieldVectorArtifactContract'),
            macroSeedProfile: getContractSnapshot('getMacroSeedProfileContract'),
            macroGeographyPackage: getContractSnapshot('getMacroGeographyPackageContract'),
            validationReport: getContractSnapshot('getValidationReportContract'),
            plateRecord: getContractSnapshot('getPlateRecordContract'),
            continentRecord: getContractSnapshot('getContinentRecordContract'),
            seaRegionRecord: getContractSnapshot('getSeaRegionRecordContract'),
            mountainSystemRecord: getContractSnapshot('getMountainSystemRecordContract'),
            volcanicZoneRecord: getContractSnapshot('getVolcanicZoneRecordContract'),
            riverBasinRecord: getContractSnapshot('getRiverBasinRecordContract'),
            climateBandRecord: getContractSnapshot('getClimateBandRecordContract'),
            reliefRegionRecord: getContractSnapshot('getReliefRegionRecordContract'),
            archipelagoRegionRecord: getContractSnapshot('getArchipelagoRegionRecordContract'),
            chokepointRecord: getContractSnapshot('getChokepointRecordContract'),
            macroRouteRecord: getContractSnapshot('getMacroRouteRecordContract'),
            strategicRegionRecord: getContractSnapshot('getStrategicRegionRecordContract')
        });
    }

    function getMacroTypeFactories() {
        return freezeSection({
            physicalWorldDebugBundle: getRequiredFunction('createPhysicalWorldDebugBundleSkeleton'),
            scalarFieldHeatmapArtifact: getRequiredFunction('createScalarFieldHeatmapArtifactSkeleton'),
            directionalFieldVectorArtifact: getRequiredFunction('createDirectionalFieldVectorArtifactSkeleton'),
            macroSeedProfile: getRequiredFunction('createMacroSeedProfileSkeleton'),
            macroGeographyPackage: getRequiredFunction('createMacroGeographyPackageSkeleton'),
            validationReport: getRequiredFunction('createValidationReportSkeleton'),
            plateRecord: getRequiredFunction('createPlateRecordSkeleton'),
            continentRecord: getRequiredFunction('createContinentRecordSkeleton'),
            seaRegionRecord: getRequiredFunction('createSeaRegionRecordSkeleton'),
            mountainSystemRecord: getRequiredFunction('createMountainSystemRecordSkeleton'),
            volcanicZoneRecord: getRequiredFunction('createVolcanicZoneRecordSkeleton'),
            riverBasinRecord: getRequiredFunction('createRiverBasinRecordSkeleton'),
            climateBandRecord: getRequiredFunction('createClimateBandRecordSkeleton'),
            reliefRegionRecord: getRequiredFunction('createReliefRegionRecordSkeleton'),
            archipelagoRegionRecord: getRequiredFunction('createArchipelagoRegionRecordSkeleton'),
            chokepointRecord: getRequiredFunction('createChokepointRecordSkeleton'),
            macroRouteRecord: getRequiredFunction('createMacroRouteRecordSkeleton'),
            strategicRegionRecord: getRequiredFunction('createStrategicRegionRecordSkeleton')
        });
    }

    function getMacroTypeValidators() {
        return freezeSection({
            physicalWorldDebugBundle: getRequiredFunction('validatePhysicalWorldDebugBundle'),
            scalarFieldHeatmapArtifact: getRequiredFunction('validateScalarFieldHeatmapArtifact'),
            directionalFieldVectorArtifact: getRequiredFunction('validateDirectionalFieldVectorArtifact'),
            macroSeedProfile: getRequiredFunction('validateMacroSeedProfile'),
            macroGeographyPackage: getRequiredFunction('validateMacroGeographyPackage'),
            validationReport: getRequiredFunction('validateValidationReport'),
            plateRecord: getRequiredFunction('validatePlateRecord'),
            continentRecord: getRequiredFunction('validateContinentRecord'),
            seaRegionRecord: getRequiredFunction('validateSeaRegionRecord'),
            mountainSystemRecord: getRequiredFunction('validateMountainSystemRecord'),
            volcanicZoneRecord: getRequiredFunction('validateVolcanicZoneRecord'),
            riverBasinRecord: getRequiredFunction('validateRiverBasinRecord'),
            climateBandRecord: getRequiredFunction('validateClimateBandRecord'),
            reliefRegionRecord: getRequiredFunction('validateReliefRegionRecord'),
            archipelagoRegionRecord: getRequiredFunction('validateArchipelagoRegionRecord'),
            chokepointRecord: getRequiredFunction('validateChokepointRecord'),
            macroRouteRecord: getRequiredFunction('validateMacroRouteRecord'),
            strategicRegionRecord: getRequiredFunction('validateStrategicRegionRecord')
        });
    }

    function getMacroTypeAssertions() {
        return freezeSection({
            physicalWorldDebugBundle: getRequiredFunction('assertPhysicalWorldDebugBundle'),
            scalarFieldHeatmapArtifact: getRequiredFunction('assertScalarFieldHeatmapArtifact'),
            directionalFieldVectorArtifact: getRequiredFunction('assertDirectionalFieldVectorArtifact'),
            macroSeedProfile: getRequiredFunction('assertMacroSeedProfile'),
            macroGeographyPackage: getRequiredFunction('assertMacroGeographyPackage'),
            validationReport: getRequiredFunction('assertValidationReport'),
            plateRecord: getRequiredFunction('assertPlateRecord'),
            continentRecord: getRequiredFunction('assertContinentRecord'),
            seaRegionRecord: getRequiredFunction('assertSeaRegionRecord'),
            mountainSystemRecord: getRequiredFunction('assertMountainSystemRecord'),
            volcanicZoneRecord: getRequiredFunction('assertVolcanicZoneRecord'),
            riverBasinRecord: getRequiredFunction('assertRiverBasinRecord'),
            climateBandRecord: getRequiredFunction('assertClimateBandRecord'),
            reliefRegionRecord: getRequiredFunction('assertReliefRegionRecord'),
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
                : {},
            fieldDebugLayers: typeof macro.getFieldDebugLayerRegistry === 'function'
                ? macro.getFieldDebugLayerRegistry()
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
