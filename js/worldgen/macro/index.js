(() => {
    const game = window.Game;
    const worldgen = game.systems.worldgen = game.systems.worldgen || {};
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};

    function getMacroEntryPoints() {
        return Object.freeze({
            generateMacroGeographyPackage: 'generateMacroGeographyPackage',
            buildMacroGeographyPackage: 'buildMacroGeographyPackage',
            buildMacroValidationReport: 'buildMacroValidationReport',
            buildDebugArtifactBundle: 'buildDebugArtifactBundle',
            createMacroRng: 'createMacroRng',
            createMacroSeedScope: 'createMacroSeedScope',
            buildMacroSubSeedNamespace: 'buildMacroSubSeedNamespace',
            getMacroSubSeedConventions: 'getMacroSubSeedConventions',
            deriveMacroSubSeed: 'deriveMacroSubSeed',
            deriveMacroSubSeedMap: 'deriveMacroSubSeedMap',
            createScalarField: 'createScalarField',
            getScalarFieldDescriptor: 'getScalarFieldDescriptor',
            createDirectionalField: 'createDirectionalField',
            getDirectionalFieldDescriptor: 'getDirectionalFieldDescriptor',
            createMaskField: 'createMaskField',
            getMaskFieldDescriptor: 'getMaskFieldDescriptor',
            createConstraintField: 'createConstraintField',
            getConstraintFieldDescriptor: 'getConstraintFieldDescriptor',
            createFieldComposer: 'createFieldComposer',
            getFieldComposerDescriptor: 'getFieldComposerDescriptor',
            createFieldNormalizer: 'createFieldNormalizer',
            getFieldNormalizerDescriptor: 'getFieldNormalizerDescriptor',
            normalizeFieldValue: 'normalizeFieldValue',
            normalizeFieldSample: 'normalizeFieldSample',
            normalizeScalarField: 'normalizeScalarField',
            getWorldSeedConstraintFieldIds: 'getWorldSeedConstraintFieldIds',
            getDefaultWorldSeedConstraintBounds: 'getDefaultWorldSeedConstraintBounds',
            createDefaultWorldSeedConstraints: 'createDefaultWorldSeedConstraints',
            normalizeWorldSeedConstraintValue: 'normalizeWorldSeedConstraintValue',
            normalizeWorldSeedConstraints: 'normalizeWorldSeedConstraints',
            getMacroSeedProfileContract: 'getMacroSeedProfileContract',
            createMacroSeedProfileSkeleton: 'createMacroSeedProfileSkeleton',
            ingestMacroSeedProfile: 'ingestMacroSeedProfile',
            serializeMacroSeedProfile: 'serializeMacroSeedProfile',
            buildMacroSeedProfileDebugExport: 'buildMacroSeedProfileDebugExport',
            buildSeedProfileDebugArtifact: 'buildSeedProfileDebugArtifact',
            validateMacroSeedProfile: 'validateMacroSeedProfile',
            assertMacroSeedProfile: 'assertMacroSeedProfile',
            getMacroTypesApi: 'getMacroTypesApi',
            getMacroTypeContracts: 'getMacroTypeContracts',
            getMacroTypeFactories: 'getMacroTypeFactories',
            getMacroTypeValidators: 'getMacroTypeValidators',
            getMacroTypeAssertions: 'getMacroTypeAssertions',
            getMacroGeographyPackageContract: 'getMacroGeographyPackageContract',
            getValidationReportContract: 'getValidationReportContract',
            createValidationReportSkeleton: 'createValidationReportSkeleton',
            validateValidationReport: 'validateValidationReport',
            assertValidationReport: 'assertValidationReport',
            createMacroGeographyPackageSkeleton: 'createMacroGeographyPackageSkeleton',
            validateMacroGeographyPackage: 'validateMacroGeographyPackage',
            assertMacroGeographyPackage: 'assertMacroGeographyPackage',
            getContinentRecordContract: 'getContinentRecordContract',
            createContinentRecordSkeleton: 'createContinentRecordSkeleton',
            validateContinentRecord: 'validateContinentRecord',
            assertContinentRecord: 'assertContinentRecord',
            getSeaRegionRecordContract: 'getSeaRegionRecordContract',
            createSeaRegionRecordSkeleton: 'createSeaRegionRecordSkeleton',
            validateSeaRegionRecord: 'validateSeaRegionRecord',
            assertSeaRegionRecord: 'assertSeaRegionRecord',
            getArchipelagoRegionRecordContract: 'getArchipelagoRegionRecordContract',
            createArchipelagoRegionRecordSkeleton: 'createArchipelagoRegionRecordSkeleton',
            validateArchipelagoRegionRecord: 'validateArchipelagoRegionRecord',
            assertArchipelagoRegionRecord: 'assertArchipelagoRegionRecord',
            getChokepointRecordContract: 'getChokepointRecordContract',
            createChokepointRecordSkeleton: 'createChokepointRecordSkeleton',
            validateChokepointRecord: 'validateChokepointRecord',
            assertChokepointRecord: 'assertChokepointRecord',
            getMacroRouteRecordContract: 'getMacroRouteRecordContract',
            createMacroRouteRecordSkeleton: 'createMacroRouteRecordSkeleton',
            validateMacroRouteRecord: 'validateMacroRouteRecord',
            assertMacroRouteRecord: 'assertMacroRouteRecord',
            getStrategicRegionRecordContract: 'getStrategicRegionRecordContract',
            createStrategicRegionRecordSkeleton: 'createStrategicRegionRecordSkeleton',
            validateStrategicRegionRecord: 'validateStrategicRegionRecord',
            assertStrategicRegionRecord: 'assertStrategicRegionRecord'
        });
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('index', {
            entry: 'getMacroEntryPoints',
            file: 'js/worldgen/macro/index.js',
            description: 'Top-level entry point index for Phase 1 macro worldgen scaffold.'
        });
    }

    Object.assign(macro, {
        getMacroEntryPoints
    });

    worldgen.macro = macro;
})();
