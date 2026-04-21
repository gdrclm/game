# DATA CONTRACT — FIELD CONTRACTS

## General field rules
Все поля должны:
- быть deterministic under seed;
- быть экспортируемыми для debug;
- иметь явно описанный диапазон значений.

---

## Field Utility Helpers

```json
{
  "type": "FieldHelpers",
  "deterministic": true,
  "intendedLayers": ["physical", "macro"],
  "defaultRange": [0, 1],
  "defaultSampleMode": "nearest",
  "defaultEdgeMode": "clamp",
  "supportedSampleModes": ["nearest", "bilinear"],
  "supportedEdgeModes": ["clamp", "zero"],
  "api": [
    "normalizeFieldRange",
    "clampFieldValue",
    "normalizeFieldSampleMode",
    "normalizeFieldEdgeMode",
    "lerpFieldValue",
    "inverseLerpFieldValue",
    "bilinearInterpolateFieldValue"
  ]
}
```

### Notes
- Это reusable utility layer для field system, а не domain-specific contract для route, terrain или UI logic.
- Helpers intentionally ограничены базовыми операциями sampling/clamping/interpolation, чтобы future field layers могли переиспользовать один и тот же math surface.
- Этот слой не материализует field objects сам по себе и не добавляет gameplay semantics.

---

## ScalarField Heatmap Debug Export

```json
{
  "contractId": "scalarFieldHeatmapArtifact",
  "artifactKind": "fieldSnapshot",
  "snapshotType": "scalarHeatmap",
  "valueEncoding": "rowMajorFloatArray",
  "rootKeys": [
    "artifactId",
    "artifactKind",
    "stageId",
    "sourceLayerId",
    "payload"
  ],
  "payloadKeys": [
    "snapshotType",
    "fieldType",
    "fieldId",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats"
  ]
}
```

### Notes
- Это UI-free debug export contract для `ScalarField`, совместимый с `fieldSnapshots` внутри `PhysicalWorldDebugBundle`.
- Heatmap export intentionally остаётся renderer-agnostic: он хранит row-major numeric values и summary stats, но не навязывает palette, canvas или panel semantics.
- Export builder должен быть deterministic и не зависеть от gameplay/runtime consumers.

---

## DirectionalField Vector Debug Export

```json
{
  "contractId": "directionalFieldVectorArtifact",
  "artifactKind": "fieldSnapshot",
  "snapshotType": "directionalVectors",
  "vectorEncoding": "rowMajorUnitVectorArrays",
  "rootKeys": [
    "artifactId",
    "artifactKind",
    "stageId",
    "sourceLayerId",
    "payload"
  ],
  "payloadKeys": [
    "snapshotType",
    "fieldType",
    "fieldId",
    "width",
    "height",
    "size",
    "vectorEncoding",
    "xValues",
    "yValues",
    "stats"
  ]
}
```

### Notes
- Это UI-free debug export contract для `DirectionalField`, совместимый с `fieldSnapshots` внутри `PhysicalWorldDebugBundle`.
- Directional export intentionally хранит анализируемые row-major `xValues` / `yValues`, но не навязывает arrow renderer, panel, color scale или canvas semantics.
- Summary stats помогают быстро анализировать покрытие и направление слоя без запуска visual renderer.

---

## Field Debug Registry

```json
{
  "registryId": "fieldDebugRegistry",
  "artifactKind": "fieldSnapshot",
  "layers": {
    "scalarHeatmap": {
      "fieldType": "ScalarField",
      "snapshotType": "scalarHeatmap",
      "builder": "buildScalarFieldHeatmapArtifact"
    },
    "directionalVectors": {
      "fieldType": "DirectionalField",
      "snapshotType": "directionalVectors",
      "builder": "buildDirectionalFieldVectorArtifact"
    }
  },
  "api": [
    "getFieldDebugLayerIds",
    "getFieldDebugLayerRegistry",
    "getFieldDebugLayerEntry",
    "buildFieldDebugArtifact",
    "validateFieldDebugArtifact",
    "assertFieldDebugArtifact"
  ]
}
```

### Notes
- Registry объединяет UI-free field debug exports и не является dev panel или renderer surface.
- Dispatch может идти либо по явному `layerId`, либо по типу field (`ScalarField` / `DirectionalField`), либо по `payload.snapshotType` при validation.
- Новые field debug layers должны добавляться сюда как contract-safe `fieldSnapshot` exports, не подтягивая UI или gameplay dependencies.
- `buildTectonicFieldSnapshots()` is the first tectonic-stage consumer of this registry: it exports deterministic intermediate tectonic `fieldSnapshot[]` artifacts without constructing a full `PhysicalWorldDebugBundle`.
- `buildReliefElevationFieldSnapshots()` is the first relief/elevation-stage consumer of this registry: it exports deterministic elevation, land/water, cleanup, and relief-type `fieldSnapshot[]` artifacts without constructing a full `PhysicalWorldDebugBundle`.
- `buildClimateBiomeFieldSnapshots()` exports deterministic climate scalar/vector layers plus climate-zone and biome-envelope classification heatmaps through the same `fieldSnapshot[]` registry format without constructing a dev panel or full bundle.

---

## Relief Elevation Field Snapshots

```json
{
  "contractId": "reliefElevationFieldSnapshots",
  "artifactKind": "fieldSnapshot",
  "registryId": "fieldDebugRegistry",
  "snapshotType": "scalarHeatmap",
  "sourceLayerIds": [
    "baseContinentalMassField",
    "macroElevationField",
    "domainWarpedMacroElevationField",
    "mountainAmplificationField",
    "basinDepressionField",
    "plateauCandidateField",
    "seaLevelAppliedElevationField",
    "landWaterMaskField",
    "landmassCleanupMaskField",
    "reliefRegions"
  ],
  "reliefRegionTypeMaskEncoding": {
    "none": 0,
    "mountain": 0.2,
    "plateau": 0.4,
    "plain": 0.6,
    "basin": 0.8,
    "coast": 1
  }
}
```

### Notes
- This export is a stable UI-free debug surface for `ReliefElevationGenerator`.
- Elevation, land/water, and cleanup outputs use the canonical `scalarFieldHeatmapArtifact` format.
- `reliefRegionTypeMaskField` is debug-derived from `reliefRegions.reliefRegionBodies`; it is not a terrain-cell output and not a new gameplay surface.
- This export intentionally does not build a dev panel, visual renderer, full debug bundle, sea-region snapshot, route graph, or validation score.

---

## Climate / Biome Field Snapshots

```json
{
  "contractId": "climateBiomeFieldSnapshots",
  "artifactKind": "fieldSnapshot",
  "registryId": "fieldDebugRegistry",
  "outputShape": "fieldSnapshot[]",
  "snapshotTypes": [
    "scalarHeatmap",
    "directionalVectors"
  ],
  "sourceLayerIds": [
    "latitudeBandBaselineField",
    "prevailingWindField",
    "humidityTransportField",
    "temperatureColdLoadField",
    "wetnessField",
    "stormCorridorField",
    "coastalDecayBurdenField",
    "seasonalityField",
    "climateStressField",
    "rainShadowEffect",
    "climateZoneClassification",
    "biomeEnvelopeClassification"
  ],
  "intentionallyAbsent": [
    "debugPanel",
    "fullPhysicalWorldDebugBundle",
    "fullMacroGeographyPackage",
    "uiOverlays",
    "rendererState",
    "gameplaySemantics"
  ]
}
```

### Notes
- This export is a stable UI-free debug surface for climate and biome-envelope layers.
- Scalar climate fields use the canonical `scalarFieldHeatmapArtifact` format; `prevailingWindField` uses the canonical `directionalFieldVectorArtifact` format.
- `climateZoneClassification` and `biomeEnvelopeClassification` are exported as scalar heatmaps with normalized class values and metadata for the original classification legend.
- This output intentionally does not build a dev panel, renderer state, full `PhysicalWorldDebugBundle`, full package export, terrain cells, or gameplay semantics.

---

## Hydrosphere Generator Scaffold

```json
{
  "contractId": "hydrosphereOutput",
  "status": "PARTIAL_IMPLEMENTED",
  "seedNamespace": "macro.hydrosphere",
  "requiredFieldDependencies": [
    "seaLevelAppliedElevationField",
    "landWaterMaskField",
    "landmassCleanupMaskField"
  ],
  "optionalDependencies": [
    "basinDepressionField",
    "mountainAmplificationField",
    "plateauCandidateField",
    "continentBodies",
    "reliefRegionExtraction",
    "reliefRegions"
  ],
  "plannedOutputs": {
    "fields": [
      "marineInvasionField",
      "oceanConnectivityMaskField",
      "coastalShelfDepthField",
      "surfaceDrainageTendencyField"
    ],
    "records": [
      "seaRegions",
      "riverBasins"
    ],
    "debugArtifacts": [
      "hydrosphereFieldSnapshots"
    ]
  },
  "implementedOutputs": {
    "fields": [
      "oceanConnectivityMaskField",
      "coastalShelfDepthField"
    ],
    "intermediateOutputs": [
      "oceanBasinFloodFill",
      "seaRegionClusters",
      "seaNavigabilityTagging",
      "coastalDepthApproximation",
      "watershedSegmentation"
    ],
    "records": [],
    "debugArtifacts": []
  }
}
```

### Notes
- This is a partial pipeline scaffold for the future hydrosphere layer.
- `oceanBasinFloodFill` is the first implemented hydrosphere output. It uses cardinal connected-component flood-fill over water cells from `landmassCleanupMaskField`.
- `oceanConnectivityMaskField` is a scalar classification field produced from the same pass.
- `seaRegionClusters` is the second implemented hydrosphere output. It converts water-basin geometry into `SeaRegionRecord`-compatible draft clusters without finalizing `seaRegions[]`.
- That clustering pass also performs inland-sea formation by refining `recordDraft.basinType` plus geometry-derived flags for `inland_sea` and `semi_enclosed_sea`.
- `seaNavigabilityTagging` is the third implemented hydrosphere output. It enriches sea-region clusters with basic `navigability` and `hazard roughness` tags plus route-graph preparation hints while keeping climate fields unresolved.
- `coastalShelfDepthField` / `coastalDepthApproximation` are the fourth implemented hydrosphere output pair. They approximate shelf-like shallow coastal water zones for later harbor/landing consumers without computing harbor, landing, or fishing scores.
- `watershedSegmentation` is the fifth implemented hydrosphere output. It groups cleaned land cells by nearest terminal water basin and emits `RiverBasinRecord`-compatible drafts, with climate/mountain/final record linkage still pending.
- The scaffold may report dependency availability and seed hooks, but it must not materialize final `seaRegions[]`, final `riverBasins[]`, major rivers, bay/strait detail, fishing scores, macro routes, route graphs, river routing, river deltas, climate logic, terrain cells, UI, or gameplay semantics.
- Migration note: this adds the first hydrosphere intermediate/field outputs without changing `MacroGeographyPackage` or `MacroGeographyHandoffPackage` semantics.

## OceanBasinFloodFill

```json
{
  "contractId": "oceanBasinFloodFill",
  "stageId": "oceanBasinFloodFill",
  "seedNamespace": "macro.hydrosphere.oceanFill",
  "sourceKeys": [
    "landmassCleanupMaskField",
    "landWaterMaskField",
    "seaLevelAppliedElevationField"
  ],
  "classificationModel": "touchesWorldEdgeOpenOceanV1",
  "floodFillModel": "cardinalConnectedWaterComponentsV1",
  "basinKinds": [
    "open_ocean",
    "enclosed_water"
  ],
  "requiredKeys": [
    "floodFillId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "waterThreshold",
    "connectivityFieldId",
    "connectivityEncoding",
    "basinCount",
    "openOceanBasinCount",
    "enclosedWaterBasinCount",
    "waterCellCount",
    "landCellCount",
    "waterBasins",
    "summary",
    "compatibility"
  ],
  "waterBasinKeys": [
    "basinId",
    "basinKind",
    "touchesWorldEdge",
    "cellCount",
    "normalizedArea",
    "boundingBox",
    "centroidPoint",
    "normalizedCentroid",
    "cellIndices"
  ],
  "intentionallyAbsent": [
    "seaRegions",
    "seaRegionClustering",
    "navigability",
    "macroRoutes",
    "riverRouting",
    "climateLogic",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- This output is deterministic from the cleaned land/water mask and does not consume UI or gameplay state.
- Components touching the world edge are classified as `open_ocean`; fully enclosed water components are classified as `enclosed_water`.
- This is a flood-fill/intermediate layer only and must not be treated as finalized `SeaRegionRecord` output.

## OceanConnectivityMaskField

```json
{
  "contractId": "oceanConnectivityMaskField",
  "fieldType": "ScalarField",
  "sourceKeys": [
    "landmassCleanupMaskField",
    "landWaterMaskField",
    "seaLevelAppliedElevationField"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "classificationEncoding": {
    "land": 0,
    "enclosedWater": 0.5,
    "openOcean": 1
  },
  "intentionallyAbsent": [
    "seaRegions",
    "seaRegionClustering",
    "navigability",
    "riverRouting",
    "climateLogic",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- This scalar field mirrors `OceanBasinFloodFill` classification for debug/future-analysis consumers.
- It is not a sea-region cluster map, not a navigability field, and not a route graph.

## SeaRegionClusters

```json
{
  "contractId": "seaRegionClusters",
  "stageId": "seaRegionClustering",
  "seedNamespace": "macro.hydrosphere.seaRegions",
  "sourceKeys": [
    "oceanBasinFloodFill",
    "oceanConnectivityMaskField"
  ],
  "requiredKeys": [
    "seaRegionClusterSetId",
    "stageId",
    "sourceOutputIds",
    "worldBounds",
    "clusterCount",
    "clusteringModel",
    "seaRegionClusters",
    "summary",
    "compatibility"
  ],
  "seaRegionClusterKeys": [
    "seaRegionClusterId",
    "sourceBasinId",
    "sourceBasinKind",
    "recordDraft",
    "pendingRecordFields",
    "basinKind",
    "basinType",
    "cellCount",
    "cellIndices",
    "normalizedArea",
    "boundingBox",
    "centroidPoint",
    "normalizedCentroid",
    "touchesWorldEdge",
    "geometryClass",
    "geometryMetrics",
    "seaRegionFlags",
    "classificationSignals",
    "namespace",
    "seed"
  ],
  "intentionallyAbsent": [
    "seaRegions",
    "bays",
    "straits",
    "routeGraph",
    "macroRoutes",
    "riverRouting",
    "climateLogic",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- This output is deterministic from connected water geometry and stays one step above raw flood-fill without claiming finalized maritime semantics.
- `recordDraft` is aligned to `SeaRegionRecord`, but `stormPressure`, `navigability`, `climateBandIds`, and `primaryClimateBandId` remain intentionally unresolved in `pendingRecordFields`.
- `recordDraft.basinType` may already be refined to `inland_sea` or `semi_enclosed_sea`; `seaRegionFlags` and `classificationSignals` explain why that refinement was applied.
- The clustering pass does not carve bays/straits, build route graphs, build river deltas, or emit final `seaRegions[]`.

## SeaNavigabilityTagging

```json
{
  "contractId": "seaNavigabilityTagging",
  "stageId": "seaNavigabilityTagging",
  "seedNamespace": "macro.hydrosphere.seaNavigability",
  "sourceKeys": [
    "seaRegionClusters",
    "oceanBasinFloodFill",
    "oceanConnectivityMaskField"
  ],
  "requiredKeys": [
    "seaNavigabilityTaggingId",
    "stageId",
    "sourceOutputIds",
    "worldBounds",
    "taggedClusterCount",
    "taggingModel",
    "taggedSeaRegionClusters",
    "summary",
    "compatibility"
  ],
  "taggedSeaRegionClusterKeys": [
    "seaRegionClusterId",
    "sourceBasinId",
    "sourceBasinKind",
    "recordDraft",
    "pendingRecordFields",
    "basinKind",
    "basinType",
    "cellCount",
    "cellIndices",
    "normalizedArea",
    "boundingBox",
    "centroidPoint",
    "normalizedCentroid",
    "touchesWorldEdge",
    "geometryClass",
    "geometryMetrics",
    "seaRegionFlags",
    "classificationSignals",
    "navigability",
    "navigabilityClass",
    "hazardRoughness",
    "hazardRoughnessClass",
    "navigabilityTags",
    "routeGraphPreparation",
    "navigabilitySignals",
    "namespace",
    "seed"
  ],
  "intentionallyAbsent": [
    "seaRegions",
    "macroRoutes",
    "routeGraph",
    "gameplaySailingRules",
    "climateLogic",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- This output is deterministic from `seaRegionClusters` plus per-cluster seed hooks and remains pre-route-graph.
- `recordDraft` is still aligned to `SeaRegionRecord`, but only `stormPressure` and `navigability` are resolved here; `climateBandIds` and `primaryClimateBandId` remain intentionally pending.
- `hazardRoughness` is a basic physical routing/hazard tag, not a gameplay sailing rule-set and not a final weather system.
- `routeGraphPreparation` is future-facing metadata only and must not be treated as built `macroRoutes[]` or a finalized route graph.

## CoastalShelfDepthField

```json
{
  "contractId": "coastalShelfDepthField",
  "fieldId": "coastalShelfDepthField",
  "stageId": "coastalDepthApproximation",
  "seedNamespace": "macro.hydrosphere.coastalDepth",
  "fieldType": "ScalarField",
  "sourceKeys": [
    "oceanBasinFloodFill",
    "seaRegionClusters",
    "seaNavigabilityTagging",
    "seaLevelAppliedElevationField",
    "basinDepressionField"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "valueMeaning": "0 = land/deep/unresolved, 1 = strongest shelf-like shallow coastal water",
  "intentionallyAbsent": [
    "fishingScore",
    "harborQuality",
    "landingEase",
    "macroRoutes",
    "routeGraph",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

## CoastalDepthApproximation

```json
{
  "contractId": "coastalDepthApproximation",
  "stageId": "coastalDepthApproximation",
  "fieldId": "coastalShelfDepthField",
  "seedNamespace": "macro.hydrosphere.coastalDepth",
  "sourceKeys": [
    "coastalShelfDepthField",
    "seaNavigabilityTagging",
    "seaRegionClusters",
    "oceanBasinFloodFill"
  ],
  "shelfDepthZoneKeys": [
    "seaRegionClusterId",
    "basinType",
    "cellCount",
    "meanShelfScore",
    "maxShelfScore",
    "shelfCellRatio",
    "dominantDepthZone",
    "zoneCounts",
    "harborLandingPreparation"
  ],
  "compatibility": {
    "futureHarborLandingInput": true,
    "futureCoastalOpportunityInput": true,
    "futureMarineCompositeInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "fishingScore",
    "harborQuality",
    "landingEase",
    "macroRoutes",
    "routeGraph",
    "gameplaySailingRules",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `CoastalShelfDepthField` is a deterministic coarse shelf-likeness approximation, not real bathymetry.
- `CoastalDepthApproximation` groups the field by sea-region cluster so later harbor/landing analyzers have stable physical inputs.
- This micro-output must not be read as fishing potential, harbor quality, landing ease, route cost, or gameplay sailing logic.

---

## WatershedSegmentation

```json
{
  "contractId": "watershedSegmentation",
  "stageId": "watershedSegmentation",
  "seedNamespace": "macro.hydrosphere.riverBasins",
  "sourceKeys": [
    "landmassCleanupMaskField",
    "seaLevelAppliedElevationField",
    "basinDepressionField",
    "mountainAmplificationField",
    "plateauCandidateField",
    "oceanBasinFloodFill",
    "seaRegionClusters",
    "seaNavigabilityTagging",
    "coastalDepthApproximation",
    "reliefRegionExtraction"
  ],
  "segmentationModel": "deterministicNearestTerminalWaterWatershedsV1",
  "watershedKeys": [
    "watershedId",
    "sourceAssignmentId",
    "recordDraft",
    "pendingRecordFields",
    "cellCount",
    "cellIndices",
    "normalizedArea",
    "boundingBox",
    "centroidPoint",
    "normalizedCentroid",
    "compactness",
    "reliefRegionIds",
    "primaryReliefRegionId",
    "reliefRegionOverlap",
    "headwaterHint",
    "terminalWaterHint",
    "drainageSignals",
    "namespace",
    "seed"
  ],
  "recordDraftContract": "RiverBasinRecord",
  "compatibility": {
    "futureRiverBasinRecordInput": true,
    "emitsRecordDraftsOnly": true,
    "requiresClimateBandLinkage": true,
    "requiresMountainSystemLinkage": true,
    "futureMajorRiverExtractionInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "riverBasins",
    "majorRivers",
    "riverRouting",
    "riverDeltas",
    "lakeFormation",
    "marshFormation",
    "climateLogic",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `WatershedSegmentation` is a pre-record hydrology layer: it segments cleaned land cells and prepares `recordDraft` payloads aligned to `RiverBasinRecord`.
- The segmentation groups land by nearest terminal water basin from `oceanBasinFloodFill` and can attach provisional terminal sea-region IDs from `seaRegionClusters`.
- `pendingRecordFields` must remain explicit because climate bands, source mountain systems, and final `riverBasins[]` publication are later steps.
- This micro-output must not extract final major rivers, route rivers, create deltas, build lake/marsh systems, or add gameplay semantics.

---

## RiverSystemGenerator

```json
{
  "contractId": "riverSystemOutput",
  "pipelineStep": "riverSystem",
  "moduleId": "riverSystemGenerator",
  "status": "PARTIAL_IMPLEMENTED",
  "stub": false,
  "partial": true,
  "seedNamespace": "macro.riverSystem",
  "requiredInputs": ["macroSeed"],
  "fieldDependencies": [
    "seaLevelAppliedElevationField",
    "landmassCleanupMaskField"
  ],
  "intermediateDependencies": [
    "watershedSegmentation"
  ],
  "plannedOutputs": {
    "fields": [
      "flowAccumulationField",
      "surfaceDrainageTendencyField"
    ],
    "intermediateOutputs": [
      "riverSystemCompositionPlan",
      "downhillFlowRouting",
      "deltaLakeMarshTagging",
      "riverBasinDrafts",
      "majorRiverCandidates",
      "riverRoutingGraph"
    ],
    "records": [
      "riverBasins"
    ],
    "debugArtifacts": [
      "hydrologyDebugExport",
      "riverSystemDebugArtifacts"
    ]
  },
  "implementedOutputs": {
    "fields": ["flowAccumulationField"],
    "intermediateOutputs": [
      "downhillFlowRouting",
      "deltaLakeMarshTagging",
      "majorRiverCandidates",
      "riverBasinRecordOutput"
    ],
    "records": ["riverBasins"],
    "debugArtifacts": ["hydrologyDebugExport"]
  },
  "intentionallyAbsent": [
    "surfaceDrainageTendencyField",
    "riverBasinDrafts",
    "riverRoutingGraph",
    "finalRiverDeltaSystems",
    "lakeHydrologySimulation",
    "marshBiomeConstruction",
    "biomes",
    "gameplayResources",
    "climateBlend",
    "fullPackageAssembly",
    "localRiverPlacement",
    "settlementLogic",
    "terrainCells",
    "uiOverlays",
    "gameplaySemantics"
  ]
}
```

### Notes
- `RiverSystemGenerator` is a partial pipeline for future river and basin generation.
- It depends on elevation/relief context and hydrosphere `watershedSegmentation`; it materializes `downhillFlowRouting`, `flowAccumulationField`, structural `deltaLakeMarshTagging`, macro-scale `majorRiverCandidates`, hydrology-stage `riverBasins`, and `hydrologyDebugExport`.
- The canonical runtime module exports `getRiverSystemGeneratorDescriptor()`, `getRiverSystemInputContract()`, `getRiverSystemOutputContract()`, `getDownhillFlowRoutingContract()`, `getFlowAccumulationFieldContract()`, `getDeltaLakeMarshTaggingContract()`, `getMajorRiverCandidatesContract()`, `getRiverBasinRecordOutputContract()`, `getHydrologyDebugExportContract()`, `getRiverSystemSeedHooks()`, `describeRiverSystemDependencyAvailability()`, `generateDownhillFlowRouting()`, `generateFlowAccumulationField()`, `generateDeltaLakeMarshTagging()`, `generateMajorRiverCandidates()`, `generateRiverBasinRecordOutput()`, `generateHydrologyDebugExport()`, `createRiverSystemPipeline()`, and `generateRiverSystem()` from `js/worldgen/macro/river-system-generator.js`.
- Migration note: this upgrades the additive `riverSystem` step with major-river candidate extraction, structural delta/lake/marsh tags, hydrology-stage basin records, and debug export. Climate linkage may remain pending on `RiverBasinRecord` until a later climate blend step; `MacroGeographyPackage` and `MacroGeographyHandoffPackage` assembly semantics are unchanged.

## DownhillFlowRouting

```json
{
  "contractId": "downhillFlowRouting",
  "pipelineStep": "riverSystem",
  "moduleId": "riverSystemGenerator",
  "status": "PARTIAL_IMPLEMENTED",
  "seedNamespace": "macro.riverSystem.riverRouting",
  "sourceKeys": [
    "seaLevelAppliedElevationField",
    "landmassCleanupMaskField",
    "watershedSegmentation"
  ],
  "routingModel": "deterministicSteepestDescentEightNeighborV1",
  "neighborModel": "eightNeighborStrictDownhill",
  "valueEncoding": "rowMajorFloatArray",
  "requiredKeys": [
    "downhillFlowRoutingId",
    "stageId",
    "sourceFieldIds",
    "sourceOutputIds",
    "worldBounds",
    "seedNamespace",
    "seed",
    "routingModel",
    "neighborModel",
    "flowDirectionEncoding",
    "downstreamIndices",
    "flowDirectionCodes",
    "dropValues",
    "slopeValues",
    "summary",
    "compatibility"
  ],
  "arraySemantics": {
    "downstreamIndices": "row-major downstream cell index for each cell; -1 means water, sink, or unresolved downstream step",
    "flowDirectionCodes": "row-major direction code matching flowDirectionEncoding; 0 means none",
    "dropValues": "row-major positive elevation drop for routed land cells; 0 otherwise",
    "slopeValues": "row-major positive drop divided by neighbor distance for routed land cells; 0 otherwise"
  },
  "intentionallyAbsent": [
    "accumulationMap",
    "surfaceDrainageTendencyField",
    "riverBasinDrafts",
    "riverBasins",
    "majorRiverCandidates",
    "riverRoutingGraph",
    "riverDeltas",
    "lakeFormation",
    "marshFormation",
    "climateLogic",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `downhillFlowRouting` is a deterministic one-step routing layer over cleaned land cells.
- It chooses the strict-downhill neighbor with the highest slope; equal-slope ties are resolved by seed-derived deterministic noise.
- Flat cells and cells without a lower neighbor remain sinks for later hydrology logic.
- This output must not be treated as an accumulation map, major-river graph, final river-basin export, climate output, terrain-cell output, or gameplay sailing/traversal rule.

## FlowAccumulationField

```json
{
  "contractId": "flowAccumulationField",
  "pipelineStep": "riverSystem",
  "moduleId": "riverSystemGenerator",
  "status": "PARTIAL_IMPLEMENTED",
  "seedNamespace": "macro.riverSystem.flowAccumulation",
  "sourceKeys": [
    "downhillFlowRouting",
    "seaLevelAppliedElevationField",
    "landmassCleanupMaskField",
    "watershedSegmentation"
  ],
  "fieldType": "ScalarField",
  "stageId": "flowAccumulationMap",
  "valueEncoding": "rowMajorFloatArray",
  "range": [0, 1],
  "normalization": "divideByMaxLandAccumulation",
  "accumulationModel": "deterministicTopologicalDownstreamAccumulationV1",
  "requiredKeys": [
    "fieldId",
    "fieldType",
    "stageId",
    "sourceFieldIds",
    "sourceOutputIds",
    "worldBounds",
    "seedNamespace",
    "seed",
    "accumulationModel",
    "downstreamRoutingId",
    "valueEncoding",
    "range",
    "normalization",
    "values",
    "rawAccumulationValues",
    "stats",
    "summary",
    "compatibility"
  ],
  "arraySemantics": {
    "values": "row-major normalized upstream-contributor accumulation for land cells; water cells are 0",
    "rawAccumulationValues": "row-major integer count of contributing land cells before normalization; water cells are 0"
  },
  "intentionallyAbsent": [
    "surfaceDrainageTendencyField",
    "riverBasinDrafts",
    "riverBasins",
    "majorRiverCandidates",
    "riverRoutingGraph",
    "riverDeltas",
    "lakeFormation",
    "marshFormation",
    "climateLogic",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `flowAccumulationField` is a deterministic accumulation map over `downhillFlowRouting`.
- Each cleaned land cell starts with one raw contributor count; counts propagate downstream through land cells only, while water cells remain zero-valued terminal receivers.
- `values` are normalized by max land accumulation for future field composition, while `rawAccumulationValues` preserve contributor counts for future river extraction.
- This output must not be treated as major-river extraction, river-basin publication, lake/marsh formation, delta logic, climate output, terrain-cell output, or gameplay traversal rule.

## DeltaLakeMarshTagging

```json
{
  "contractId": "deltaLakeMarshTagging",
  "pipelineStep": "riverSystem",
  "moduleId": "riverSystemGenerator",
  "status": "PARTIAL_IMPLEMENTED",
  "seedNamespace": "macro.riverSystem.deltaLakeMarshTagging",
  "sourceKeys": [
    "downhillFlowRouting",
    "flowAccumulationField",
    "watershedSegmentation",
    "seaLevelAppliedElevationField",
    "landmassCleanupMaskField",
    "basinDepressionField"
  ],
  "featureTypes": ["delta", "lake", "marsh"],
  "taggingModel": "deterministicDeltaLakeMarshTaggingV1",
  "requiredKeys": [
    "deltaLakeMarshTaggingId",
    "stageId",
    "sourceFieldIds",
    "sourceOutputIds",
    "worldBounds",
    "seedNamespace",
    "seed",
    "taggingModel",
    "featureTypes",
    "featureTags",
    "downstreamSummary",
    "summary",
    "compatibility"
  ],
  "featureTagKeys": [
    "featureTagId",
    "featureType",
    "watershedId",
    "riverBasinIdHint",
    "basinType",
    "cellIndices",
    "centroidPoint",
    "normalizedCentroid",
    "strength",
    "confidence",
    "signals",
    "downstreamSummary"
  ],
  "intentionallyAbsent": [
    "majorRiverExtraction",
    "riverRoutingGraph",
    "finalRiverDeltaSystems",
    "lakeHydrologySimulation",
    "marshBiomeConstruction",
    "biomes",
    "gameplayResources",
    "climateBlend",
    "fullPackageAssembly",
    "localRiverPlacement",
    "settlementLogic",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `deltaLakeMarshTagging` is a deterministic structural tagging layer, not a final hydrology-system builder.
- Delta tags require terminal-water context plus high accumulation near water adjacency or terminal water steps.
- Lake tags rely on internal-sink or basin-depression signals, without simulating lake levels or outlet changes.
- Marsh tags rely on low-slope wet retention signals from accumulation, basin depression, and water adjacency, without creating biomes or gameplay resources.
- The output is designed as summary input for later river-basin enrichment, climate blend, and hydrology review; it does not mutate `RiverBasinRecord` shape and does not assemble `MacroGeographyPackage`.

## MajorRiverCandidates

```json
{
  "contractId": "majorRiverCandidates",
  "pipelineStep": "riverSystem",
  "moduleId": "riverSystemGenerator",
  "status": "PARTIAL_IMPLEMENTED",
  "seedNamespace": "macro.riverSystem.majorRiverCandidates",
  "sourceKeys": [
    "downhillFlowRouting",
    "flowAccumulationField",
    "watershedSegmentation",
    "deltaLakeMarshTagging",
    "majorRiverCandidates",
    "riverBasinRecordOutput"
  ],
  "extractionModel": "deterministicMainstemFromAccumulationWatershedV1",
  "lineEncoding": "rowMajorCellPathSourceToMouth",
  "requiredKeys": [
    "majorRiverCandidatesId",
    "stageId",
    "sourceFieldIds",
    "sourceOutputIds",
    "worldBounds",
    "seedNamespace",
    "seed",
    "extractionModel",
    "lineEncoding",
    "majorRiverCandidates",
    "summary",
    "compatibility"
  ],
  "candidateKeys": [
    "majorRiverCandidateId",
    "lineType",
    "lineEncoding",
    "watershedId",
    "riverBasinIdHint",
    "basinType",
    "sourceCellIndex",
    "mouthCellIndex",
    "lineCellIndices",
    "linePoints",
    "normalizedLinePoints",
    "rawDischarge",
    "normalizedDischarge",
    "candidateScore",
    "recordLink",
    "compatibility"
  ],
  "intentionallyAbsent": [
    "riverRoutingGraph",
    "localRiverPlacement",
    "settlementLogic",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `majorRiverCandidates` is a deterministic macro-scale analysis output, not final local river placement.
- Candidate lines are encoded as source-to-mouth row-major cell paths and paired with normalized point paths for downstream analyzers.
- Each candidate can link back to `watershedId`, `riverBasinIdHint`, terminal-water hints, and optional `RiverBasinRecord` validation metadata without mutating `RiverBasinRecord` keys.
- This output prepares major-river line candidates for future basin enrichment and route analysis, but it does not create `riverRoutingGraph`, settlement logic, terrain cells, local river paths, or gameplay semantics.
- Migration note: additive River System intermediate-output drift only. `MacroGeographyPackage`, `MacroGeographyHandoffPackage`, and `RiverBasinRecord` required keys are unchanged.

## RiverBasinRecordOutput

```json
{
  "contractId": "riverBasinRecordOutput",
  "pipelineStep": "riverSystem",
  "moduleId": "riverSystemGenerator",
  "status": "PARTIAL_IMPLEMENTED",
  "seedNamespace": "macro.riverSystem.riverBasins",
  "sourceKeys": [
    "watershedSegmentation",
    "flowAccumulationField"
  ],
  "recordSetId": "riverBasins",
  "recordContract": "RiverBasinRecord",
  "materializationModel": "deterministicWatershedDraftToRiverBasinRecordV1",
  "requiredKeys": [
    "riverBasinRecordOutputId",
    "stageId",
    "recordSetId",
    "recordContract",
    "sourceFieldIds",
    "sourceOutputIds",
    "worldBounds",
    "seedNamespace",
    "seed",
    "materializationModel",
    "riverBasins",
    "recordLinks",
    "deferredRiverBasinDrafts",
    "summary",
    "compatibility"
  ],
  "compatibility": {
    "macroGeographyPackageRecordInput": true,
    "hydrologyStageRecordOutput": true,
    "climateLinkageMayBePending": true,
    "futureClimateBlendInput": true,
    "futureMajorRiverLinkageInput": true,
    "fullPackageAssemblyOutput": false
  },
  "intentionallyAbsent": [
    "climateBlend",
    "fullPackageAssembly",
    "localRiverPlacement",
    "settlementLogic",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `riverBasinRecordOutput` materializes hydrology-stage `RiverBasinRecord` objects from `watershedSegmentation.recordDraft` payloads.
- Only contract-valid records are emitted into `riverBasins[]`; incomplete drafts remain in `deferredRiverBasinDrafts` with validation diagnostics.
- `recordLinks` preserve non-record hydrology metadata such as watershed id, terminal-water hints, headwater hints, and accumulation summaries.
- Climate refs may remain empty until the later climate blend step. This output must not assemble the full `MacroGeographyPackage`, place local rivers, create settlements, or add gameplay semantics.

## HydrologyDebugExport

```json
{
  "contractId": "hydrologyDebugExport",
  "pipelineStep": "riverSystem",
  "moduleId": "riverSystemGenerator",
  "artifactKind": "hydrologyDebugExport",
  "registryId": "fieldDebugRegistry",
  "sourceKeys": [
    "downhillFlowRouting",
    "flowAccumulationField",
    "watershedSegmentation",
    "deltaLakeMarshTagging",
    "riverBasinRecordOutput"
  ],
  "fieldSnapshots": [
    "flowAccumulationField",
    "watershedSegmentationMaskField",
    "riverBasinRecordMaskField"
  ],
  "intentionallyAbsent": [
    "debugPanel",
    "fullPhysicalWorldDebugBundle",
    "climateBlend",
    "fullPackageAssembly",
    "localRiverPlacement",
    "settlementLogic",
    "gameplaySemantics"
  ]
}
```

### Notes
- `hydrologyDebugExport` is a UI-free debug artifact set for River System hydrology layers.
- It emits scalar field snapshots for flow accumulation, watershed segmentation coverage, and emitted river-basin record coverage.
- It also includes `deltaLakeMarshTagging` and `majorRiverCandidates` summary metadata without creating a renderer, dev panel, or full debug bundle.
- This output is not a debug panel and not a full physical-world debug bundle.

---

## Climate Envelope Generator Partial Output

```json
{
  "contractId": "climateEnvelopeOutput",
  "pipelineStep": "climateEnvelope",
  "moduleId": "climateEnvelopeGenerator",
  "status": "PARTIAL_IMPLEMENTED",
  "stub": false,
  "partial": true,
  "seedNamespace": "macro.climateEnvelope",
  "requiredInputs": ["macroSeed"],
  "fieldDependencies": [
    "seaLevelAppliedElevationField",
    "landmassCleanupMaskField",
    "oceanConnectivityMaskField"
  ],
  "optionalFieldDependencies": [
    "mountainAmplificationField",
    "basinDepressionField",
    "coastalShelfDepthField",
    "marineInvasionField"
  ],
  "optionalIntermediateDependencies": [
    "continentBodies",
    "seaRegionClusters",
    "coastalDepthApproximation",
    "watershedSegmentation",
    "majorRiverCandidates"
  ],
  "optionalRecordDependencies": [
    "mountainSystems",
    "reliefRegions",
    "riverBasins",
    "seaRegions"
  ],
  "plannedOutputs": {
    "fields": [
      "latitudeBandBaselineField",
      "prevailingWindField",
      "humidityTransportField",
      "temperatureColdLoadField",
      "wetnessField",
      "stormCorridorField",
      "coastalDecayBurdenField",
      "seasonalityField",
      "climateStressField"
    ],
    "intermediateOutputs": [
      "climateEnvelopeCompositionPlan",
      "rainShadowEffect",
      "climateZoneClassification",
      "regionalClimateSummaries",
      "climateStressRegionalSummaries"
    ],
    "records": ["climateBands"],
    "debugArtifacts": [
      "climateEnvelopeFieldSnapshots",
      "climateBiomeFieldSnapshots",
      "climateEnvelopeDebugArtifacts"
    ]
  },
  "implementedOutputs": {
    "fields": [
      "latitudeBandBaselineField",
      "prevailingWindField",
      "humidityTransportField",
      "temperatureColdLoadField",
      "stormCorridorField",
      "coastalDecayBurdenField",
      "seasonalityField",
      "wetnessField",
      "climateStressField"
    ],
    "intermediateOutputs": [
      "rainShadowEffect",
      "climateZoneClassification",
      "regionalClimateSummaries",
      "climateStressRegionalSummaries"
    ],
    "records": ["climateBands"],
    "debugArtifacts": [
      "climateBiomeFieldSnapshots"
    ]
  },
  "intentionallyAbsent": [
    "biomeEnvelope",
    "gameplayWeatherSystems",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `ClimateEnvelopeGenerator` is now partial: it emits `latitudeBandBaselineField`, `prevailingWindField`, `humidityTransportField`, `temperatureColdLoadField`, `stormCorridorField`, `coastalDecayBurdenField`, `seasonalityField`, `climateStressField`, `climateZoneClassification`, `climateBands[]`, `regionalClimateSummaries`, `climateStressRegionalSummaries`, `climateBiomeFieldSnapshots`, `rainShadowEffect`, and rain-shadow-adjusted `wetnessField`.
- The partial module still declares geography and hydrosphere dependencies so future climate microsteps can consume official Phase 1 physical outputs instead of inventing local climate inputs.
- `latitudeBandBaselineField` is seed-stable from `macroSeed` / `worldBounds`; it provides a latitude-derived thermal baseline and compatibility hints for future temperature/wetness layers.
- `prevailingWindField` is seed-driven from `macroSeed` / `worldBounds`; it does not move humidity, simulate currents, classify climate zones, or create weather gameplay.
- `humidityTransportField` deterministically samples hydrosphere moisture sources upwind through `prevailingWindField`; it is the moisture source for rain-shadow adjustment.
- `temperatureColdLoadField` deterministically blends latitude warmth, elevation penalty, and maritime moderation into warmth plus cold-burden arrays for later climate-band classification.
- `stormCorridorField` deterministically blends prevailing wind, humidity transport, adjusted wetness, temperature/cold-load, and maritime exposure into large storm-prone corridors for later route-risk and isolation analyzers.
- `coastalDecayBurdenField` deterministically blends shoreline exposure, storm pressure, wetness, salt load, and coastal cold-load into a coastal pressure baseline for later history analyzers.
- `seasonalityField` deterministically blends latitude seasonality anchors, continentality, storm/coastal volatility, and maritime moderation into seasonal-variability and predictability scores with embedded regional summary buckets.
- `climateZoneClassification` deterministically classifies coarse land climate zones from temperature, wetness, storm, and seasonality context and prepares zone summaries plus `ClimateBandRecord`-compatible record assembly.
- `rainShadowEffect` deterministically estimates leeward drying and local orographic wetness boost from mountain/elevation context and prevailing wind.
- `wetnessField` is a rain-shadow-adjusted wetness baseline derived from humidity transport, latitude context, and orographic effects; it is not final climate classification.
- `climateBands[]` are now emitted as physical `ClimateBandRecord` outputs when relief geometry is available; the classification output may still defer some zones when those geometry links are absent.
- `regionalClimateSummaries` now emits UI-free summary tables by relief region, continent body, and sea-region cluster from emitted `ClimateBandRecord` zones, without mutating record shapes or assembling the full package.
- `climateStressField` now emits a row-major physical stress scalar from dry/cold/heat/storm/coastal/seasonal pressure and optional `biomeEnvelopeClassification` context.
- `climateStressRegionalSummaries` is a stable internal output that links `ClimateStressField` aggregates to `regionalClimateSummaries` rows by relief region, continent body, and adjacent sea-region cluster.
- `climateBiomeFieldSnapshots` exports climate and biome-envelope layers through `fieldDebugRegistry` as machine-readable `fieldSnapshot[]` artifacts only.
- `biomeEnvelopeClassification`, when produced, is emitted by the separate physical-world `BiomeEnvelopeHelper` over climate/elevation/wetness outputs rather than by `ClimateEnvelopeGenerator`.
- This partial output must not be interpreted as yearly simulation, gameplay time systems, gameplay weather, biome placement, terrain-cell output, Phase 2 pressure packaging, full package assembly, UI, or runtime weather rules.
- Migration note: additive `climateBiomeFieldSnapshots` debug-output drift on top of the prior `climateStressField` / `climateStressRegionalSummaries` semantics. `MacroGeographyPackage` and `MacroGeographyHandoffPackage` semantics are unchanged.

---

## LatitudeBandBaselineField

```json
{
  "contractId": "latitudeBandBaselineField",
  "pipelineStep": "climateEnvelope",
  "moduleId": "climateEnvelopeGenerator",
  "fieldType": "ScalarField",
  "deterministic": true,
  "seedNamespace": "macro.climateEnvelope.latitudeBands",
  "modelId": "deterministicLatitudeBaselineV1",
  "sourceKeys": ["macroSeed", "worldBounds"],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "requiredKeys": [
    "fieldId",
    "stageId",
    "modelId",
    "seedNamespace",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats",
    "axialTiltBias",
    "equatorOffset",
    "rowBands",
    "summary",
    "compatibility"
  ],
  "intentionallyAbsent": [
    "windFieldMutation",
    "humidityTransportField",
    "wetnessField",
    "temperatureColdLoadField",
    "climateZoneClassification",
    "climateBands",
    "gameplayWeatherSystems",
    "terrainCells",
    "uiOverlays"
  ]
}
```

### Notes
- `latitudeBandBaselineField` is a renderer-agnostic scalar field where `0` is a cold polar baseline and `1` is a warm equatorial baseline.
- It also emits `rowBands` with coarse latitude-band metadata and compatibility hints for implemented temperature/cold-load plus future wetness layers.
- This field is not a wind model, not humidity transport, not final climate-zone classification, and not `ClimateBandRecord` output.

---

## PrevailingWindField

```json
{
  "contractId": "prevailingWindField",
  "pipelineStep": "climateEnvelope",
  "moduleId": "climateEnvelopeGenerator",
  "fieldType": "DirectionalField",
  "deterministic": true,
  "seedNamespace": "macro.climateEnvelope.prevailingWind",
  "modelId": "deterministicLatitudeBeltWindV1",
  "sourceKeys": ["macroSeed", "worldBounds"],
  "vectorEncoding": "rowMajorUnitVectorArrays",
  "magnitudeEncoding": "rowMajorFloatArray",
  "requiredKeys": [
    "fieldId",
    "stageId",
    "modelId",
    "seedNamespace",
    "worldBounds",
    "width",
    "height",
    "size",
    "vectorEncoding",
    "magnitudeEncoding",
    "xValues",
    "yValues",
    "magnitudeValues",
    "stats",
    "summary",
    "compatibility"
  ],
  "intentionallyAbsent": [
    "humidityTransportField",
    "oceanCurrentSimulation",
    "rainShadowEffect",
    "stormCorridorField",
    "gameplayWeatherSystems",
    "terrainCells",
    "uiOverlays"
  ]
}
```

### Notes
- `prevailingWindField` is a renderer-agnostic directional field with row-major `xValues` / `yValues` unit vectors and separate coarse `magnitudeValues`.
- The current model uses deterministic latitude-belt circulation plus seed-stable wave/nudge terms, so same seed and bounds produce the same field.
- The field feeds the implemented humidity transport pass and remains prepared for future storm-corridor consumers, but this microstep intentionally does not implement ocean currents, rain shadow, climate-band classification, UI, terrain cells, or gameplay weather systems.

---

## HumidityTransportField

```json
{
  "contractId": "humidityTransportField",
  "pipelineStep": "climateEnvelope",
  "moduleId": "climateEnvelopeGenerator",
  "fieldType": "ScalarField",
  "deterministic": true,
  "seedNamespace": "macro.climateEnvelope.humidityTransport",
  "modelId": "deterministicWindHydrosphereHumidityTransportV1",
  "sourceKeys": [
    "macroSeed",
    "worldBounds",
    "latitudeBandBaselineField",
    "prevailingWindField",
    "oceanConnectivityMaskField",
    "coastalShelfDepthField",
    "marineInvasionField"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "requiredKeys": [
    "fieldId",
    "stageId",
    "modelId",
    "seedNamespace",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats",
    "summary",
    "compatibility"
  ],
  "intentionallyAbsent": [
    "rainShadowEffect",
    "temperatureColdLoadField",
    "climateZoneClassification",
    "climateBands",
    "stormCorridorField",
    "oceanCurrentSimulation",
    "gameplayWeatherSystems",
    "terrainCells",
    "uiOverlays"
  ]
}
```

### Notes
- `humidityTransportField` is a renderer-agnostic scalar field where `0` is dry/no hydrosphere fetch and `1` is strong wind-carried moisture availability.
- The pass samples local hydrosphere moisture and upwind cells through `prevailingWindField`; when required hydrosphere fields are missing, the generator emits dry fallback values while dependency diagnostics still report missing inputs.
- This field is not rain-shadow adjusted, not a storm corridor, not climate-zone classification, not gameplay weather, and not terrain-cell output.

---

## TemperatureColdLoadField

```json
{
  "contractId": "temperatureColdLoadField",
  "pipelineStep": "climateEnvelope",
  "moduleId": "climateEnvelopeGenerator",
  "fieldType": "ScalarField",
  "deterministic": true,
  "seedNamespace": "macro.climateEnvelope.temperatureColdLoad",
  "modelId": "deterministicLatitudeElevationColdLoadV1",
  "sourceKeys": [
    "macroSeed",
    "worldBounds",
    "latitudeBandBaselineField",
    "seaLevelAppliedElevationField",
    "landmassCleanupMaskField",
    "mountainAmplificationField",
    "basinDepressionField",
    "oceanConnectivityMaskField",
    "coastalShelfDepthField"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "requiredKeys": [
    "fieldId",
    "stageId",
    "modelId",
    "seedNamespace",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "coldLoadValues",
    "elevationPenaltyValues",
    "maritimeModerationValues",
    "stats",
    "coldLoadStats",
    "summary",
    "compatibility"
  ],
  "intentionallyAbsent": [
    "wetnessBands",
    "seasonalityField",
    "stormCorridorField",
    "climateZoneClassification",
    "climateBands",
    "biomeEnvelope",
    "gameplayWeatherSystems",
    "terrainCells",
    "uiOverlays"
  ]
}
```

### Notes
- `temperatureColdLoadField.values` encode coarse warmth where `0` is very cold and `1` is very warm before climate-band classification.
- `coldLoadValues` encode coarse cold burden, while `elevationPenaltyValues` and `maritimeModerationValues` keep the baseline explainable for later analyzers.
- The field deterministically combines latitude baseline, elevation, optional mountain/basin context, and hydrosphere-adjacent maritime moderation; it does not classify wetness bands, seasonality, or final climate zones.

---

## StormCorridorField

```json
{
  "contractId": "stormCorridorField",
  "pipelineStep": "climateEnvelope",
  "moduleId": "climateEnvelopeGenerator",
  "fieldType": "ScalarField",
  "deterministic": true,
  "seedNamespace": "macro.climateEnvelope.stormDecaySeasonality",
  "modelId": "deterministicWindWetnessStormCorridorV1",
  "sourceKeys": [
    "macroSeed",
    "worldBounds",
    "prevailingWindField",
    "humidityTransportField",
    "temperatureColdLoadField",
    "wetnessField",
    "oceanConnectivityMaskField",
    "coastalShelfDepthField",
    "marineInvasionField",
    "landmassCleanupMaskField"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "requiredKeys": [
    "fieldId",
    "stageId",
    "modelId",
    "seedNamespace",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "basePotentialValues",
    "continuityValues",
    "maritimeExposureValues",
    "stats",
    "summary",
    "compatibility"
  ],
  "intentionallyAbsent": [
    "routeGraph",
    "catastropheSystems",
    "climateZoneClassification",
    "climateBands",
    "biomeEnvelope",
    "gameplayWeatherSystems",
    "terrainCells",
    "uiOverlays"
  ]
}
```

### Notes
- `stormCorridorField.values` encode coarse storm-prone corridor pressure where `0` is low exposure and `1` is strong corridor pressure for later route-risk and isolation analyzers.
- `basePotentialValues`, `continuityValues`, and `maritimeExposureValues` keep the storm baseline explainable without introducing a route graph or catastrophe system.
- The field deterministically combines prevailing wind, humidity transport, adjusted wetness, temperature/cold-load, and maritime exposure; it is not gameplay weather and not final climate classification.

---

## CoastalDecayBurdenField

```json
{
  "contractId": "coastalDecayBurdenField",
  "pipelineStep": "climateEnvelope",
  "moduleId": "climateEnvelopeGenerator",
  "fieldType": "ScalarField",
  "deterministic": true,
  "seedNamespace": "macro.climateEnvelope.stormDecaySeasonality",
  "modelId": "deterministicCoastalStormWearBurdenV1",
  "sourceKeys": [
    "macroSeed",
    "worldBounds",
    "stormCorridorField",
    "wetnessField",
    "temperatureColdLoadField",
    "seaLevelAppliedElevationField",
    "landmassCleanupMaskField",
    "oceanConnectivityMaskField",
    "coastalShelfDepthField",
    "marineInvasionField"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "requiredKeys": [
    "fieldId",
    "stageId",
    "modelId",
    "seedNamespace",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "shorelineExposureValues",
    "saltLoadValues",
    "wetWearValues",
    "freezeThawValues",
    "stats",
    "summary",
    "compatibility"
  ],
  "intentionallyAbsent": [
    "buildingDecaySystems",
    "settlementLogic",
    "climateZoneClassification",
    "climateBands",
    "biomeEnvelope",
    "gameplayWeatherSystems",
    "terrainCells",
    "uiOverlays"
  ]
}
```

### Notes
- `coastalDecayBurdenField.values` encode coarse coastal pressure where `0` is low burden and `1` is high coastal decay burden for later pressure/history analyzers.
- `shorelineExposureValues`, `saltLoadValues`, `wetWearValues`, and `freezeThawValues` keep the burden explainable without introducing building decay systems or settlement logic.
- The field deterministically combines storm pressure, shoreline adjacency, maritime exposure, wetness, and coastal cold-load; it is not a gameplay decay system and not climate-zone classification.

---

## SeasonalityField

```json
{
  "contractId": "seasonalityField",
  "pipelineStep": "climateEnvelope",
  "moduleId": "climateEnvelopeGenerator",
  "fieldType": "ScalarField",
  "deterministic": true,
  "seedNamespace": "macro.climateEnvelope.stormDecaySeasonality",
  "modelId": "deterministicLatitudeContinentalSeasonalityV1",
  "sourceKeys": [
    "macroSeed",
    "worldBounds",
    "latitudeBandBaselineField",
    "temperatureColdLoadField",
    "wetnessField",
    "stormCorridorField",
    "coastalDecayBurdenField",
    "landmassCleanupMaskField",
    "oceanConnectivityMaskField",
    "coastalShelfDepthField",
    "seaLevelAppliedElevationField"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "requiredKeys": [
    "fieldId",
    "stageId",
    "modelId",
    "seedNamespace",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "predictabilityValues",
    "continentalityValues",
    "volatilityValues",
    "stats",
    "summary",
    "compatibility"
  ],
  "intentionallyAbsent": [
    "yearlySimulation",
    "climateZoneClassification",
    "climateBands",
    "biomeEnvelope",
    "gameplayTimeSystems",
    "terrainCells",
    "uiOverlays"
  ]
}
```

### Notes
- `seasonalityField.values` encode coarse seasonal variability where `0` is low seasonal swing / high stability and `1` is high seasonal swing or burden.
- `predictabilityValues`, `continentalityValues`, and `volatilityValues` keep the seasonality baseline explainable without introducing yearly simulation or gameplay time systems.
- `summary.regionalSummary` embeds coarse bucketed summaries by latitude-band type and surface regime so downstream climate/biome classification can consume regional seasonality hints without a separate summary artifact in this microstep.
- The field deterministically combines latitude seasonality anchors, temperature/cold-load, land/ocean exposure, coastal moderation, storm corridors, and coastal-decay volatility; it is not final climate-zone classification and not biome output.

---

## ClimateZoneClassification

```json
{
  "contractId": "climateZoneClassification",
  "pipelineStep": "climateEnvelope",
  "moduleId": "climateEnvelopeGenerator",
  "outputType": "ClimateZoneClassification",
  "deterministic": true,
  "seedNamespace": "macro.climateEnvelope.climateBands",
  "modelId": "deterministicClimateBandClassificationV1",
  "sourceKeys": [
    "macroSeed",
    "worldBounds",
    "latitudeBandBaselineField",
    "temperatureColdLoadField",
    "humidityTransportField",
    "wetnessField",
    "stormCorridorField",
    "coastalDecayBurdenField",
    "seasonalityField",
    "landmassCleanupMaskField",
    "seaLevelAppliedElevationField",
    "reliefRegionExtraction",
    "seaRegionClusters"
  ],
  "classificationEncoding": "rowMajorIntegerArray",
  "requiredKeys": [
    "outputId",
    "stageId",
    "modelId",
    "seedNamespace",
    "worldBounds",
    "width",
    "height",
    "size",
    "classificationEncoding",
    "unclassifiedValue",
    "classificationIndices",
    "classificationLegend",
    "zoneSummaries",
    "summary",
    "compatibility"
  ],
  "intentionallyAbsent": [
    "biomeEnvelope",
    "phase2PressurePackage",
    "gameplayWeatherSystems",
    "terrainCells",
    "uiOverlays"
  ]
}
```

### Notes
- `classificationIndices` use `-1` for unclassified water / missing land context and non-negative values as indexes into `classificationLegend`.
- `classificationLegend` stores stable band-type labels and mean biases for each legend entry, while `zoneSummaries` store connected coarse land-zone summaries and record-compatibility diagnostics.
- The output deterministically classifies coarse land climate zones from temperature, wetness, storm, and seasonality context; when `reliefRegionExtraction` geometry is available, it also drives `ClimateBandRecord` assembly.
- This output is not a biome envelope, not a Phase 2 pressure package, not a terrain-cell system, and not gameplay weather runtime behavior.

---

## RegionalClimateSummaries

```json
{
  "contractId": "regionalClimateSummaries",
  "pipelineStep": "climateEnvelope",
  "moduleId": "climateEnvelopeGenerator",
  "outputType": "RegionalClimateSummaries",
  "deterministic": true,
  "seedNamespace": "macro.climateEnvelope.climateBands",
  "modelId": "deterministicClimateBandRegionalSummariesV1",
  "sourceKeys": [
    "macroSeed",
    "worldBounds",
    "climateZoneClassification",
    "climateBands",
    "reliefRegionExtraction",
    "continentBodies",
    "seaRegionClusters"
  ],
  "requiredKeys": [
    "outputId",
    "stageId",
    "modelId",
    "seedNamespace",
    "sourceFieldIds",
    "sourceIntermediateOutputIds",
    "sourceRecordIds",
    "worldBounds",
    "regionSummaries",
    "continentSummaries",
    "seaSummaries",
    "summary",
    "compatibility"
  ],
  "intentionallyAbsent": [
    "fullMacroGeographyPackage",
    "phase2PressurePackage",
    "biomeEnvelope",
    "gameplayWeatherSystems",
    "terrainCells",
    "uiOverlays"
  ]
}
```

### Notes
- `regionSummaries` are relief-region-scale rows keyed by `reliefRegionId`; `continentSummaries` are continent-body rows keyed by draft `continentId`; `seaSummaries` are sea-region-cluster rows keyed by draft `seaRegionId`.
- Summary rows expose `climateBandIds`, `primaryClimateBandId`, `dominantBandType`, mean temperature/humidity/seasonality biases, and deterministic band-type breakdowns.
- Sea summaries use adjacent land-edge counts as a coarse climate-contact proxy; they do not finalize `SeaRegionRecord.climateBandIds`.
- This output rolls up emitted `ClimateBandRecord` zones only. It is not full package assembly, not a stress rollup, not Phase 2 pressure packaging, and not gameplay weather; stress linkage lives in `climateStressRegionalSummaries`.

---

## ClimateStressField

```json
{
  "contractId": "climateStressField",
  "pipelineStep": "climateEnvelope",
  "moduleId": "climateEnvelopeGenerator",
  "fieldType": "ScalarField",
  "deterministic": true,
  "seedNamespace": "macro.climateEnvelope.climateStress",
  "modelId": "deterministicClimateStressCompositeV1",
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "sourceKeys": [
    "macroSeed",
    "worldBounds",
    "temperatureColdLoadField",
    "wetnessField",
    "stormCorridorField",
    "coastalDecayBurdenField",
    "seasonalityField",
    "landmassCleanupMaskField",
    "seaLevelAppliedElevationField",
    "climateZoneClassification",
    "regionalClimateSummaries",
    "biomeEnvelopeClassification"
  ],
  "requiredKeys": [
    "fieldId",
    "stageId",
    "modelId",
    "seedNamespace",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "drynessStressValues",
    "coldStressValues",
    "heatStressValues",
    "stormStressValues",
    "coastalDecayStressValues",
    "seasonalityStressValues",
    "biomeEnvelopeStressValues",
    "landCellMaskValues",
    "stats",
    "summary",
    "compatibility"
  ],
  "intentionallyAbsent": [
    "fullMacroGeographyPackage",
    "phase2PressurePackage",
    "downstreamPressureGenerator",
    "debugPanel",
    "gameplayWeatherSystems",
    "terrainCells",
    "uiOverlays"
  ]
}
```

### Notes
- `values` encode coarse physical climate stress where `0` means low combined stress and `1` means high combined dry/cold/heat/storm/coastal/seasonal/envelope stress.
- Component arrays keep deterministic explainability for dryness, cold, heat, storm, coastal decay, seasonality, and optional biome-envelope pressure.
- `biomeEnvelopeClassification` is optional context only; this field does not own biome-envelope classification and does not create gameplay biome, ecology, or resource truth.
- This output is not a downstream pressure generator, not a Phase 2 pressure package, not a debug panel, and not gameplay weather.

---

## ClimateStressRegionalSummaries

```json
{
  "contractId": "climateStressRegionalSummaries",
  "pipelineStep": "climateEnvelope",
  "moduleId": "climateEnvelopeGenerator",
  "outputType": "ClimateStressRegionalSummaries",
  "deterministic": true,
  "seedNamespace": "macro.climateEnvelope.climateStress",
  "modelId": "deterministicClimateStressRegionalSummariesV1",
  "sourceKeys": [
    "macroSeed",
    "worldBounds",
    "climateStressField",
    "regionalClimateSummaries",
    "reliefRegionExtraction",
    "continentBodies",
    "seaRegionClusters"
  ],
  "requiredKeys": [
    "outputId",
    "stageId",
    "modelId",
    "seedNamespace",
    "sourceFieldIds",
    "sourceIntermediateOutputIds",
    "sourceRecordIds",
    "worldBounds",
    "climateStressFieldId",
    "sourceRegionalClimateSummariesId",
    "regionSummaries",
    "continentSummaries",
    "seaSummaries",
    "summary",
    "compatibility"
  ],
  "intentionallyAbsent": [
    "fullMacroGeographyPackage",
    "phase2PressurePackage",
    "downstreamPressureGenerator",
    "debugPanel",
    "gameplayWeatherSystems",
    "terrainCells",
    "uiOverlays"
  ]
}
```

### Notes
- `regionSummaries`, `continentSummaries`, and `seaSummaries` reuse the same stable summary-row shape for stress aggregates and keep `sourceClimateSummaryId` links back to `regionalClimateSummaries`.
- Region and continent rows aggregate over land cells in the matching geometry; sea rows aggregate adjacent land-edge stress around the sea-region cluster.
- This is an internal physical-world format only. It does not mutate `ContinentRecord` / `SeaRegionRecord`, assemble `MacroGeographyPackage`, emit a debug panel, or run downstream pressure generation.

---

## BiomeEnvelopeClassification

```json
{
  "contractId": "biomeEnvelopeClassification",
  "moduleId": "biomeEnvelopeHelper",
  "outputType": "BiomeEnvelopeClassification",
  "deterministic": true,
  "modelId": "deterministicPhysicalBiomeEnvelopeV1",
  "sourceKeys": [
    "temperatureColdLoadField",
    "wetnessField",
    "seasonalityField",
    "seaLevelAppliedElevationField",
    "landmassCleanupMaskField",
    "stormCorridorField",
    "coastalDecayBurdenField",
    "mountainAmplificationField",
    "basinDepressionField",
    "climateZoneClassification",
    "regionalClimateSummaries",
    "reliefRegionExtraction",
    "climateBands",
    "reliefRegions"
  ],
  "classificationEncoding": "rowMajorIntegerArray",
  "unclassifiedValue": -1,
  "requiredKeys": [
    "outputId",
    "helperId",
    "moduleId",
    "worldBounds",
    "width",
    "height",
    "size",
    "modelId",
    "classificationEncoding",
    "unclassifiedValue",
    "classificationIndices",
    "classificationLegend",
    "envelopeSummaries",
    "summary",
    "compatibility"
  ],
  "intentionallyAbsent": [
    "localBiomePlacement",
    "gameplayBiomes",
    "resourceProps",
    "ecologySimulation",
    "terrainCells",
    "uiOverlays"
  ]
}
```

### Notes
- `classificationIndices` use `-1` for water or unavailable land context and non-negative values as indexes into `classificationLegend`.
- The output classifies coarse physical natural envelopes from temperature, wetness, seasonality, elevation, and cleaned land mask inputs.
- Optional storm/coastal/relief fields may be carried in `inputBundle.sourceFieldIds` for downstream traceability, but they do not turn this output into local biome placement or gameplay terrain data.
- `envelopeSummaries` and optional `reliefRegionSummaries` are world-scale summary tables only; they must not be read as local biome placement, resources, props, or ecology simulation truth.
- Migration note: additive helper-level output drift only. `MacroGeographyPackage` and `MacroGeographyHandoffPackage` semantics are unchanged.

---

## WetnessField

```json
{
  "contractId": "wetnessField",
  "pipelineStep": "climateEnvelope",
  "moduleId": "climateEnvelopeGenerator",
  "fieldType": "ScalarField",
  "deterministic": true,
  "seedNamespace": "macro.climateEnvelope.rainShadow",
  "modelId": "deterministicRainShadowAdjustedWetnessV1",
  "sourceKeys": [
    "macroSeed",
    "worldBounds",
    "humidityTransportField",
    "rainShadowEffect",
    "latitudeBandBaselineField",
    "prevailingWindField",
    "oceanConnectivityMaskField",
    "coastalShelfDepthField",
    "marineInvasionField",
    "mountainAmplificationField",
    "seaLevelAppliedElevationField",
    "landmassCleanupMaskField"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "requiredKeys": [
    "fieldId",
    "stageId",
    "modelId",
    "seedNamespace",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats",
    "summary",
    "compatibility"
  ],
  "intentionallyAbsent": [
    "climateZoneClassification",
    "climateBands",
    "biomeEnvelope",
    "gameplayWeatherSystems",
    "terrainCells",
    "uiOverlays"
  ]
}
```

### Notes
- `wetnessField` is a rain-shadow-adjusted baseline for downstream climate analyzers, combining humidity transport, local hydrosphere source strength, latitude baseline, and coarse orographic drying/boost.
- It is explicitly pre-biome; climate-band extraction is now implemented separately, but later steps must still perform biome-envelope work and any downstream climate-stress synthesis.
- This field is not biome placement, not marsh/lake gameplay logic, not `ClimateBandRecord` output, and not weather runtime behavior.

---

## RainShadowEffect

```json
{
  "contractId": "rainShadowEffect",
  "pipelineStep": "climateEnvelope",
  "moduleId": "climateEnvelopeGenerator",
  "effectType": "OrographicRainShadowEffect",
  "deterministic": true,
  "seedNamespace": "macro.climateEnvelope.rainShadow",
  "modelId": "deterministicOrographicRainShadowV1",
  "sourceKeys": [
    "humidityTransportField",
    "wetnessField",
    "prevailingWindField",
    "mountainAmplificationField",
    "seaLevelAppliedElevationField",
    "landmassCleanupMaskField",
    "mountainSystems"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "requiredKeys": [
    "effectId",
    "stageId",
    "modelId",
    "seedNamespace",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "barrierValues",
    "orographicBoostValues",
    "adjustedWetnessValues",
    "stats",
    "summary",
    "compatibility"
  ],
  "intentionallyAbsent": [
    "climateZoneClassification",
    "climateBands",
    "biomeEnvelope",
    "terrainCells",
    "gameplayWeatherSystems",
    "uiOverlays"
  ]
}
```

### Notes
- `rainShadowEffect.values` encode leeward drying intensity, while `barrierValues`, `orographicBoostValues`, and `adjustedWetnessValues` keep the wetness adjustment explainable for later analyzers/debug exports.
- The effect reads mountain/elevation context from `mountainAmplificationField`, `seaLevelAppliedElevationField`, optional `landmassCleanupMaskField`, and optional `mountainSystems` attribution.
- This intermediate output is not climate-zone classification, not biome envelope construction, not local terrain simulation, and not gameplay weather.

---

## ScalarField Base Abstraction

```json
{
  "type": "ScalarField",
  "storageType": "Float32Array",
  "deterministic": true,
  "intendedLayers": ["physical", "macro"],
  "range": [0, 1],
  "valueNormalization": "clampToRange",
  "sampleModes": ["nearest", "bilinear"],
  "edgeModes": ["clamp", "zero"],
  "api": [
    "read",
    "write",
    "fill",
    "sample"
  ]
}
```

### Notes
- Это базовая field abstraction для numeric grids Phase 1, а не domain-specific tectonic/climate contract.
- `ScalarField` intentionally does not encode channels, directional semantics or composer logic.
- Concrete fields such as `PlatePressureField` or `ClimateStressField` may be materialized on top of this abstraction.

---

## DirectionalField Base Abstraction

```json
{
  "type": "DirectionalField",
  "storageType": "Float32ArrayPair",
  "deterministic": true,
  "intendedLayers": ["physical", "macro"],
  "futureCompatibleLayers": ["wind", "current", "plateMotion"],
  "vectorNormalization": "unitVectorOrZero",
  "sampleModes": ["nearest", "bilinear"],
  "edgeModes": ["clamp", "zero"],
  "api": [
    "read",
    "write",
    "fill",
    "sample"
  ]
}
```

### Notes
- Это базовая vector-field abstraction для направлений, а не domain-specific contract для ветров, течений или движения плит.
- Каждая запись нормализуется до unit vector или zero vector, поэтому downstream layers могут безопасно переиспользовать единый sample API.
- `DirectionalField` intentionally does not include mask, composer or visual-renderer semantics.

---

## MaskField / ConstraintField Base Abstraction

```json
{
  "type": "MaskField",
  "aliases": ["ConstraintField"],
  "storageType": "Float32Array",
  "deterministic": true,
  "intendedLayers": ["physical", "macro"],
  "range": [0, 1],
  "semantics": {
    "allowed": 1,
    "blocked": 0
  },
  "filteringSemantics": "thresholdedMask",
  "sampleModes": ["nearest", "bilinear"],
  "edgeModes": ["clamp", "zero"],
  "api": [
    "read",
    "write",
    "fill",
    "allow",
    "block",
    "sample",
    "isAllowed",
    "isBlocked"
  ]
}
```

### Notes
- Это базовая abstraction для ограничений и масок областей, а не terrain-specific contract.
- `MaskField` и `ConstraintField` являются одним runtime surface с разными именами для более читаемого downstream intent.
- Filtering decisions строятся через thresholded sampling и не включают world-specific rules или terrain-generation semantics.

---

## FieldComposer Base Abstraction

```json
{
  "type": "FieldComposer",
  "deterministic": true,
  "intendedLayers": ["physical", "macro"],
  "supportedRules": ["sum", "average", "min", "max", "multiply"],
  "defaultRule": "average",
  "outputType": "ScalarField",
  "supportedInputContract": "field.sample(x, y, sampleOptions) -> finite number",
  "entryTransformStages": ["sample", "gain", "bias", "weight"],
  "api": [
    "composeSample",
    "composeScalarField"
  ]
}
```

### Notes
- Это базовая abstraction для deterministic compositing нескольких scalar-compatible field sources.
- `FieldComposer` intentionally does not include tectonic, climate, marine или другой domain-specific logic.
- Output materialization ограничен generic `ScalarField`; vector/mask-specialized composition остаётся следующими шагами.

---

## FieldNormalizer Base Abstraction

```json
{
  "type": "FieldNormalizer",
  "deterministic": true,
  "intendedLayers": ["physical", "macro"],
  "supportedModes": ["clamp", "remap", "remapClamp"],
  "defaultMode": "remapClamp",
  "defaultSourceRange": [0, 1],
  "defaultTargetRange": [0, 1],
  "outputType": "ScalarField",
  "supportedInputContract": "field.sample(x, y, sampleOptions) -> finite number",
  "normalizationStages": ["read", "resolveSourceRange", "normalizeMode", "mapOrClamp"],
  "api": [
    "normalizeValue",
    "normalizeSample",
    "normalizeScalarField"
  ]
}
```

### Notes
- Это базовая abstraction для deterministic range normalization scalar-compatible field values и sampled outputs.
- `FieldNormalizer` intentionally does not include debug export, scoring или domain-specific evaluation semantics.
- Поле может нормализоваться как на уровне single value/sample, так и в materialized `ScalarField` output для future layers.

---

## PlatePressureField

```json
{
  "fieldId": "platePressure",
  "range": [0, 1],
  "channels": [
    "uplift",
    "fracture",
    "compression",
    "driftBias",
    "arcFormation"
  ]
}
```

## UpliftField

```json
{
  "fieldId": "upliftField",
  "fieldType": "ScalarField",
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "sourceContract": "plateBoundaryClassification",
  "sourceSignal": "futureSignals.upliftPotential",
  "generationModel": "boundaryUpliftFalloffV1",
  "requiredKeys": [
    "fieldId",
    "stageId",
    "sourceClassificationId",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats"
  ],
  "intentionallyAbsent": [
    "elevationComposite",
    "reliefRegions",
    "climateEffects"
  ]
}
```

### Notes
- `UpliftField` is deterministic from `macroSeed` and `plateBoundaryClassification.boundaryClassifications`.
- It is a physical preparation layer only: the field does not imply final land elevation, terrain cells, relief regions, climate effects, or gameplay semantics.
- The canonical runtime module exports `getUpliftFieldContract()` and `generateUpliftField()` from `js/worldgen/macro/tectonic-skeleton-generator.js`.

## SubsidenceField

```json
{
  "fieldId": "subsidenceField",
  "fieldType": "ScalarField",
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "sourceContract": "plateBoundaryClassification",
  "sourceSignal": "futureSignals.subsidencePotential",
  "generationModel": "boundarySubsidenceFalloffV1",
  "requiredKeys": [
    "fieldId",
    "stageId",
    "sourceClassificationId",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats",
    "compatibility"
  ],
  "compatibility": {
    "upliftFieldId": "upliftField",
    "futureElevationCompositeOperation": "upliftField - subsidenceField",
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "marineFloodFill",
    "basinRegions",
    "elevationComposite",
    "reliefRegions",
    "climateEffects"
  ]
}
```

### Notes
- `SubsidenceField` is deterministic from `macroSeed` and `plateBoundaryClassification.boundaryClassifications`.
- It is a physical preparation layer only: the field does not imply marine flooding, basin extraction, final elevation, relief regions, climate effects, or gameplay semantics.
- The canonical runtime module exports `getSubsidenceFieldContract()` and `generateSubsidenceField()` from `js/worldgen/macro/tectonic-skeleton-generator.js`.

## FractureField

```json
{
  "contractId": "fractureField",
  "fieldId": "fractureMaskField",
  "aliases": ["fractureMaskField"],
  "fieldType": "ScalarField",
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "sourceContract": "plateBoundaryClassification",
  "sourceSignals": [
    "scores.transform",
    "scores.collision",
    "scores.divergence",
    "relativeMotion.magnitude"
  ],
  "generationModel": "boundaryFractureFalloffV1",
  "requiredKeys": [
    "fieldId",
    "stageId",
    "sourceClassificationId",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats",
    "compatibility"
  ],
  "compatibility": {
    "upliftFieldId": "upliftField",
    "subsidenceFieldId": "subsidenceField",
    "futureRidgeInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "ridgeLines",
    "landmasses",
    "elevationComposite",
    "reliefRegions",
    "climateEffects"
  ]
}
```

### Notes
- `FractureField` is deterministic from `macroSeed` and `plateBoundaryClassification.boundaryClassifications`.
- The runtime output key remains `fractureMaskField` to preserve the scaffold's planned output shape, while the exported API is `getFractureFieldContract()` / `generateFractureField()`.
- It is a physical preparation layer only: the field does not imply ridge line synthesis, final landmass synthesis, final elevation, relief regions, climate effects, or gameplay semantics.

## RidgeDirectionField

```json
{
  "contractId": "ridgeDirectionField",
  "fieldId": "ridgeDirectionField",
  "fieldType": "DirectionalField",
  "vectorEncoding": "rowMajorUnitVectorArrays",
  "sourceContract": "plateBoundaryClassification",
  "sourceKeys": [
    "plateBoundaryClassification",
    "upliftField",
    "subsidenceField",
    "fractureMaskField"
  ],
  "generationModel": "tectonicRidgeLineSynthesisV1",
  "requiredKeys": [
    "fieldId",
    "stageId",
    "sourceClassificationId",
    "worldBounds",
    "width",
    "height",
    "size",
    "vectorEncoding",
    "xValues",
    "yValues",
    "stats",
    "ridgeLines",
    "compatibility"
  ],
  "ridgeLineKeys": [
    "ridgeLineId",
    "boundaryId",
    "plateIds",
    "sourceBoundaryType",
    "startPoint",
    "endPoint",
    "normalizedStartPoint",
    "normalizedEndPoint",
    "orientationVector",
    "ridgeStrength",
    "ridgeLength",
    "influenceRadius",
    "mountainAmplificationBias",
    "sourceSignals",
    "namespace",
    "seed"
  ],
  "compatibility": {
    "upliftFieldId": "upliftField",
    "subsidenceFieldId": "subsidenceField",
    "fractureFieldId": "fractureMaskField",
    "futureMountainAmplificationInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "basinRegions",
    "elevationComposite",
    "mountainSystems",
    "climateEffects"
  ]
}
```

### Notes
- `RidgeDirectionField` is deterministic from `macroSeed`, classified plate boundaries, and the already materialized `upliftField` / `subsidenceField` / `fractureMaskField`.
- The field stores tangent-oriented ridge vectors in `xValues` / `yValues` and also exports explicit `ridgeLines` candidates for later mountain amplification.
- It is a physical preparation layer only: the field does not imply basin logic, final elevation composition, final `MountainSystemRecord` extraction, climate effects, or gameplay semantics.

## BasinSeeds

```json
{
  "contractId": "basinSeeds",
  "basinSeedSetId": "basinSeeds",
  "stageId": "basinSeedPlacement",
  "sourceContract": "plateBoundaryClassification",
  "sourceKeys": [
    "plateSeedDistribution",
    "plateBoundaryClassification",
    "upliftField",
    "subsidenceField",
    "fractureMaskField",
    "ridgeDirectionField"
  ],
  "requiredKeys": [
    "basinSeedSetId",
    "stageId",
    "sourceClassificationId",
    "worldBounds",
    "basinSeedCount",
    "selectionModel",
    "basinSeeds",
    "compatibility"
  ],
  "basinSeedKeys": [
    "basinSeedId",
    "sourceKind",
    "sourceBoundaryId",
    "sourcePlateIds",
    "seedPoint",
    "normalizedPoint",
    "seedArea",
    "basinSeedStrength",
    "basinRetentionBias",
    "basinTypeHint",
    "sourceSignals",
    "namespace",
    "seed"
  ],
  "compatibility": {
    "futureBasinTendencyInput": true,
    "futureRiverBasinInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "continentBodies",
    "hydrologyRouting",
    "basinRegions",
    "climateEffects"
  ]
}
```

### Notes
- `BasinSeeds` is deterministic from `macroSeed`, tectonic boundary classification, and the already materialized `upliftField` / `subsidenceField` / `fractureMaskField` / `ridgeDirectionField`.
- It exports only candidate seed points/areas plus strength metadata; it is not a basin extraction, continent-body pass, hydrology routing pass, or final `RiverBasinRecord` synthesis.
- The canonical runtime module exports `getBasinSeedsContract()` and `generateBasinSeeds()` from `js/worldgen/macro/tectonic-skeleton-generator.js`.

## ArcFormationHelper

```json
{
  "contractId": "arcFormationHelper",
  "arcHelperId": "arcFormationHelper",
  "stageId": "arcFormationHelper",
  "sourceContract": "plateBoundaryClassification",
  "sourceKeys": [
    "plateBoundaryClassification",
    "upliftField",
    "subsidenceField",
    "fractureMaskField",
    "ridgeDirectionField"
  ],
  "requiredKeys": [
    "arcHelperId",
    "stageId",
    "sourceClassificationId",
    "worldBounds",
    "arcGuideCount",
    "guideSelectionModel",
    "arcGuides",
    "compatibility"
  ],
  "arcGuideKeys": [
    "arcGuideId",
    "sourceBoundaryId",
    "sourcePlateIds",
    "sourceHint",
    "carrierPlateId",
    "carrierPlateClass",
    "startPoint",
    "endPoint",
    "midpoint",
    "apexPoint",
    "normalizedApexPoint",
    "controlPoints",
    "curveSamples",
    "guideArea",
    "tangentVector",
    "bowVector",
    "arcStrength",
    "arcCurvature",
    "curvedFormBias",
    "volcanicArcBias",
    "sourceSignals",
    "namespace",
    "seed"
  ],
  "compatibility": {
    "futureVolcanicArcInput": true,
    "futureVolcanicZoneSourceType": "arc",
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "tectonicComposite",
    "oceanCarving",
    "volcanicZones",
    "climateEffects"
  ]
}
```

### Notes
- `ArcFormationHelper` is deterministic from `macroSeed`, tectonic boundary classification, and the already materialized `upliftField` / `subsidenceField` / `fractureMaskField` / `ridgeDirectionField`.
- It exports only curved arc guides plus helper geometry (`controlPoints`, `curveSamples`, `guideArea`) for later volcanic-arc extraction and curved tectonic-form interpretation.
- It is not a volcanic-zone pass, not a full tectonic composite, and not an ocean-carving pass.
- The canonical runtime module exports `getArcFormationHelperContract()` and `generateArcFormationHelper()` from `js/worldgen/macro/tectonic-skeleton-generator.js`.

## HotspotVolcanicSeedHelper

```json
{
  "contractId": "hotspotVolcanicSeedHelper",
  "hotspotHelperId": "hotspotVolcanicSeedHelper",
  "stageId": "hotspotVolcanicSeedHelper",
  "sourceContract": "plateMotionVectors",
  "sourceKeys": [
    "plateSeedDistribution",
    "plateMotionVectors",
    "upliftField",
    "subsidenceField",
    "fractureMaskField",
    "ridgeDirectionField",
    "arcFormationHelper"
  ],
  "requiredKeys": [
    "hotspotHelperId",
    "stageId",
    "sourceDistributionId",
    "sourceVectorSetId",
    "worldBounds",
    "hotspotSeedCount",
    "selectionModel",
    "hotspotSeeds",
    "compatibility"
  ],
  "hotspotSeedKeys": [
    "hotspotSeedId",
    "sourcePlateId",
    "sourcePlateClass",
    "sourceKind",
    "seedPoint",
    "normalizedPoint",
    "seedArea",
    "trailVector",
    "trailLength",
    "trailSamples",
    "hotspotStrength",
    "persistenceBias",
    "volcanicZoneBias",
    "arcAvoidanceBias",
    "sourceSignals",
    "namespace",
    "seed"
  ],
  "compatibility": {
    "futureVolcanicZoneInput": true,
    "futureVolcanicZoneSourceType": "hotspot",
    "supportsTrailChains": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "volcanicZones",
    "geologicResources",
    "oceanCarving",
    "tectonicComposite"
  ]
}
```

### Notes
- `HotspotVolcanicSeedHelper` is deterministic from `macroSeed`, `plateSeedDistribution`, `plateMotionVectors`, and the already materialized `upliftField` / `subsidenceField` / `fractureMaskField` / `ridgeDirectionField`, optionally separated from arc helpers via `arcFormationHelper`.
- It exports only hotspot-like seed points, seed areas, trail vectors, and sampled trail geometry for later hotspot volcanic-zone extraction.
- It is not an actual `VolcanicZoneRecord` pass, not a geology/resource pass, and not an ocean-carving or tectonic-composite pass.
- The canonical runtime module exports `getHotspotVolcanicSeedHelperContract()` and `generateHotspotVolcanicSeedHelper()` from `js/worldgen/macro/tectonic-skeleton-generator.js`.

## PlatePressureField

```json
{
  "contractId": "platePressureField",
  "fieldId": "platePressureField",
  "stageId": "platePressureCompositeField",
  "sourceKeys": [
    "upliftField",
    "subsidenceField",
    "fractureMaskField",
    "ridgeDirectionField",
    "basinSeeds",
    "arcFormationHelper"
  ],
  "requiredKeys": [
    "fieldId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats",
    "compositionModel",
    "compatibility"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "compatibility": {
    "futureLandTendencyInput": true,
    "futureMountainAmplificationInput": true,
    "futureReliefInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "landTendencyMap",
    "finalElevation",
    "marineFloodFill",
    "climateEffects"
  ]
}
```

### Notes
- `PlatePressureField` is deterministic from the already materialized `upliftField` / `subsidenceField` / `fractureMaskField` / `ridgeDirectionField` plus `basinSeeds` and `arcFormationHelper`.
- It exports only a composite tectonic scalar field and transparent composition metadata for later interpretation layers.
- It is not a land tendency map, not a final elevation pass, and not a marine flood-fill or climate pass.
- The canonical runtime module exports `getPlatePressureFieldContract()` and `generatePlatePressureField()` from `js/worldgen/macro/tectonic-skeleton-generator.js`.

## MountainBeltCandidates

```json
{
  "contractId": "mountainBeltCandidates",
  "stageId": "mountainBeltCandidates",
  "sourceKeys": [
    "ridgeDirectionField",
    "upliftField",
    "subsidenceField",
    "fractureMaskField",
    "platePressureField",
    "arcFormationHelper"
  ],
  "requiredKeys": [
    "candidateSetId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "mountainBeltCandidateCount",
    "selectionModel",
    "mountainBeltCandidates",
    "compatibility"
  ],
  "compatibility": {
    "futureMountainSystemRecordInput": true,
    "futureMountainAmplificationInput": true,
    "requiresReliefRegionLinkage": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "climateShadow",
    "reliefRegions",
    "finalElevation",
    "mountainSystemFinalization"
  ]
}
```

### Notes
- `MountainBeltCandidates` is deterministic from the already materialized `ridgeDirectionField`, `upliftField`, `subsidenceField`, `fractureMaskField`, `platePressureField`, and optional `arcFormationHelper`.
- It exports only mountain-belt candidates plus `recordDraft` objects aligned with `MountainSystemRecord`; the drafts intentionally keep `reliefRegionIds` and `primaryReliefRegionId` unresolved until a later physical-relief pass.
- It is not climate shadow, not relief-region extraction, and not final mountain-system extraction.
- The canonical runtime module exports `getMountainBeltCandidatesContract()` and `generateMountainBeltCandidates()` from `js/worldgen/macro/tectonic-skeleton-generator.js`.

## PlainLowlandSmoothingField

```json
{
  "contractId": "plainLowlandSmoothingField",
  "fieldId": "plainLowlandSmoothingField",
  "stageId": "plainLowlandSmoothingPass",
  "fieldType": "ScalarField",
  "sourceKeys": [
    "upliftField",
    "subsidenceField",
    "fractureMaskField",
    "ridgeDirectionField",
    "platePressureField",
    "basinSeeds",
    "mountainBeltCandidates"
  ],
  "requiredKeys": [
    "fieldId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats",
    "smoothingModel",
    "compatibility"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "compatibility": {
    "futureBasinTendencyInput": true,
    "futurePlateauLogicCompatible": true,
    "futureReliefRegionInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "fertilityScoring",
    "gameplaySemantics",
    "basinDepression",
    "plateauExtraction",
    "reliefRegions"
  ]
}
```

### Notes
- `PlainLowlandSmoothingField` is deterministic from already materialized tectonic fields, basin seeds, and mountain-belt candidates.
- It exports only a broad scalar smoothing layer for places where plains/lowlands are physically allowed; it is not a basin depression pass, not a plateau extraction pass, and not a `ReliefRegionRecord` extraction.
- The field intentionally carries compatibility metadata for later basin/plateau/relief logic and does not encode fertility, settlement, traversal, or other gameplay semantics.
- The canonical runtime module exports `getPlainLowlandSmoothingFieldContract()` and `generatePlainLowlandSmoothingField()` from `js/worldgen/macro/tectonic-skeleton-generator.js`.

## BaseContinentalMassField

```json
{
  "contractId": "baseContinentalMassField",
  "fieldId": "baseContinentalMassField",
  "stageId": "baseContinentalMassField",
  "fieldType": "ScalarField",
  "sourceKeys": [
    "platePressureField",
    "upliftField",
    "subsidenceField",
    "fractureMaskField",
    "ridgeDirectionField",
    "plainLowlandSmoothingField"
  ],
  "requiredKeys": [
    "fieldId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats",
    "compositionModel",
    "compatibility"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "compatibility": {
    "futureLandmassSynthesisInput": true,
    "futureMarineCarvingInput": true,
    "futureContinentExtractionInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "finalCoastlines",
    "continents",
    "seaFill",
    "marineFloodFill",
    "finalElevation",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `BaseContinentalMassField` is deterministic from `macroSeed` and already materialized tectonic composite context.
- It exports only a continuous coarse continental-mass tendency field; values must not be read as a final land/water mask.
- It is not final coastline generation, not marine fill, not `ContinentRecord` extraction, and not local terrain or gameplay semantics.
- The canonical runtime module exports `getBaseContinentalMassFieldContract()` and `generateBaseContinentalMassField()` from `js/worldgen/macro/relief-elevation-generator.js`.

## MacroElevationField

```json
{
  "contractId": "macroElevationField",
  "fieldId": "macroElevationField",
  "stageId": "macroElevationField",
  "fieldType": "ScalarField",
  "sourceKeys": [
    "baseContinentalMassField",
    "platePressureField",
    "upliftField",
    "subsidenceField",
    "fractureMaskField",
    "ridgeDirectionField",
    "plainLowlandSmoothingField"
  ],
  "requiredKeys": [
    "fieldId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats",
    "compositionModel",
    "compatibility"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "compatibility": {
    "futureMountainAmplificationInput": true,
    "futureBasinDepressionInput": true,
    "futurePlateauCandidateInput": true,
    "futureReliefRegionInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "finalElevation",
    "domainWarping",
    "seaLevel",
    "seaFill",
    "marineFloodFill",
    "finalCoastlines",
    "continents",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `MacroElevationField` is deterministic from `macroSeed`, `baseContinentalMassField`, and already materialized tectonic field context.
- It exports only a continuous normalized large-scale elevation composite; values must not be read as final terrain height after sea-level application.
- It intentionally does not perform domain warping, sea-level thresholding, marine flood fill, coastline extraction, terrain-cell emission, or gameplay semantics.
- The canonical runtime module exports `getMacroElevationFieldContract()` and `generateMacroElevationField()` from `js/worldgen/macro/relief-elevation-generator.js`.

## DomainWarpedMacroElevationField

```json
{
  "contractId": "domainWarpedMacroElevationField",
  "fieldId": "domainWarpedMacroElevationField",
  "stageId": "domainWarpedMacroElevationField",
  "fieldType": "ScalarField",
  "sourceKeys": [
    "macroElevationField",
    "baseContinentalMassField",
    "ridgeDirectionField",
    "platePressureField",
    "fractureMaskField",
    "upliftField",
    "subsidenceField",
    "plainLowlandSmoothingField"
  ],
  "requiredKeys": [
    "fieldId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats",
    "distortionModel",
    "compatibility"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "compatibility": {
    "futureMountainAmplificationInput": true,
    "futureBasinDepressionInput": true,
    "futurePlateauCandidateInput": true,
    "futureReliefRegionInput": true,
    "futureCleanupPassInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "cleanupPass",
    "reliefRegions",
    "finalElevation",
    "seaLevel",
    "seaFill",
    "marineFloodFill",
    "finalCoastlines",
    "continents",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `DomainWarpedMacroElevationField` is deterministic from `macroSeed`, `macroElevationField`, `baseContinentalMassField`, and already materialized tectonic field context.
- It exports only a continuous normalized distortion pass over large land and ridge forms.
- The field intentionally does not perform cleanup, sea-level thresholding, marine flood fill, coastline extraction, relief-region extraction, terrain-cell emission, or gameplay semantics.
- The canonical runtime module exports `getDomainWarpedMacroElevationFieldContract()` and `generateDomainWarpedMacroElevationField()` from `js/worldgen/macro/relief-elevation-generator.js`.

## MountainAmplificationField

```json
{
  "contractId": "mountainAmplificationField",
  "fieldId": "mountainAmplificationField",
  "stageId": "mountainAmplificationField",
  "fieldType": "ScalarField",
  "sourceKeys": [
    "domainWarpedMacroElevationField",
    "macroElevationField",
    "ridgeDirectionField",
    "platePressureField",
    "upliftField",
    "subsidenceField",
    "fractureMaskField",
    "mountainBeltCandidates"
  ],
  "requiredKeys": [
    "fieldId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats",
    "amplificationModel",
    "compatibility"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "compatibility": {
    "futureRainShadowInput": true,
    "futureReliefRegionInput": true,
    "futureMountainSystemLinkageInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "mountainRecords",
    "rainShadow",
    "climateLogic",
    "hydrology",
    "reliefRegions",
    "finalElevation",
    "seaLevel",
    "seaFill",
    "marineFloodFill",
    "finalCoastlines",
    "continents",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `MountainAmplificationField` is deterministic from `macroSeed`, relief/elevation source fields, and `mountainBeltCandidates`.
- It exports only a continuous normalized amplification field for mountain-shaped elevation zones.
- The field intentionally does not build `MountainSystemRecord`, rain-shadow, hydrology, climate logic, relief-region extraction, or final terrain semantics.
- The canonical runtime module exports `getMountainAmplificationFieldContract()` and `generateMountainAmplificationField()` from `js/worldgen/macro/relief-elevation-generator.js`.

## BasinDepressionField

```json
{
  "contractId": "basinDepressionField",
  "fieldId": "basinDepressionField",
  "stageId": "basinDepressionField",
  "fieldType": "ScalarField",
  "sourceKeys": [
    "domainWarpedMacroElevationField",
    "macroElevationField",
    "plainLowlandSmoothingField",
    "subsidenceField",
    "upliftField",
    "fractureMaskField",
    "platePressureField",
    "mountainAmplificationField",
    "basinSeeds"
  ],
  "requiredKeys": [
    "fieldId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats",
    "depressionModel",
    "compatibility"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "compatibility": {
    "futureLakeFormationInput": true,
    "futureMarshFormationInput": true,
    "futureWetlandRetentionInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "riverSystems",
    "lakeFormation",
    "marshFormation",
    "inlandSeas",
    "hydrology",
    "reliefRegions",
    "finalElevation",
    "seaLevel",
    "seaFill",
    "marineFloodFill",
    "finalCoastlines",
    "continents",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `BasinDepressionField` is deterministic from `macroSeed`, relief/elevation source fields, and `basinSeeds`.
- It exports only a continuous normalized basin-floor depression field for basin-permissive lowland regions.
- The field intentionally does not build lake systems, marsh systems, river routing, inland seas, hydrology, or final terrain semantics.
- The canonical runtime module exports `getBasinDepressionFieldContract()` and `generateBasinDepressionField()` from `js/worldgen/macro/relief-elevation-generator.js`.

## PlateauCandidateField

```json
{
  "contractId": "plateauCandidateField",
  "fieldId": "plateauCandidateField",
  "stageId": "plateauCandidateField",
  "fieldType": "ScalarField",
  "sourceKeys": [
    "domainWarpedMacroElevationField",
    "macroElevationField",
    "baseContinentalMassField",
    "platePressureField",
    "upliftField",
    "subsidenceField",
    "fractureMaskField",
    "ridgeDirectionField",
    "plainLowlandSmoothingField"
  ],
  "requiredKeys": [
    "fieldId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats",
    "candidateModel",
    "compatibility"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "compatibility": {
    "futureReliefClassificationInput": true,
    "futurePlateauReliefTypeInput": true,
    "futureReliefRegionInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "plateauRecords",
    "reliefRegions",
    "climateLogic",
    "finalElevation",
    "seaLevel",
    "seaFill",
    "marineFloodFill",
    "finalCoastlines",
    "continents",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `PlateauCandidateField` is deterministic from `macroSeed`, relief/elevation fields, and already materialized tectonic context.
- It exports only a continuous normalized candidate field for broad plateau/elevated areas.
- The field intentionally does not extract plateau records, synthesize `ReliefRegionRecord`, apply climate logic, perform sea-level thresholding, or emit terrain/gameplay semantics.
- The canonical runtime module exports `getPlateauCandidateFieldContract()` and `generatePlateauCandidateField()` from `js/worldgen/macro/relief-elevation-generator.js`.

## SeaLevelAppliedElevationField

```json
{
  "contractId": "seaLevelAppliedElevationField",
  "fieldId": "seaLevelAppliedElevationField",
  "stageId": "seaLevelAppliedElevationField",
  "fieldType": "ScalarField",
  "sourceKeys": [
    "domainWarpedMacroElevationField",
    "mountainAmplificationField",
    "basinDepressionField",
    "plateauCandidateField",
    "baseContinentalMassField",
    "plainLowlandSmoothingField"
  ],
  "requiredKeys": [
    "fieldId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats",
    "seaLevelModel",
    "compatibility"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "compatibility": {
    "futureSeaFillInput": true,
    "futureMarineFloodFillInput": true,
    "futureContinentExtractionInput": true,
    "futureLandWaterMaskInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "finalElevation",
    "seaFill",
    "marineFloodFill",
    "finalCoastlines",
    "seaRegions",
    "inlandSeas",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `SeaLevelAppliedElevationField` is deterministic from `macroSeed` and the already materialized coarse relief/elevation fields.
- It exports only a continuous post-threshold elevation field after a primary sea-level cutoff.
- The field intentionally does not perform sea fill, marine flood fill, coastline refinement, sea-region extraction, inland-sea correction, or final terrain semantics.
- The canonical runtime module exports `getSeaLevelAppliedElevationFieldContract()` and `generateSeaLevelAppliedElevationField()` from `js/worldgen/macro/relief-elevation-generator.js`.

## LandWaterMaskField

```json
{
  "contractId": "landWaterMaskField",
  "fieldId": "landWaterMaskField",
  "stageId": "landWaterMaskField",
  "fieldType": "MaskField",
  "aliases": ["ConstraintField"],
  "sourceKeys": [
    "seaLevelAppliedElevationField"
  ],
  "requiredKeys": [
    "fieldId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats",
    "threshold",
    "semantics",
    "classificationModel",
    "compatibility"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "compatibility": {
    "futureMarineCarvingInput": true,
    "futureContinentExtractionInput": true,
    "futureCoastlineRefinementInput": true,
    "futureSeaRegionClusteringInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "marineCarving",
    "seaRegions",
    "inlandSeas",
    "riverSystems",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `LandWaterMaskField` is deterministic from `macroSeed` and `SeaLevelAppliedElevationField`.
- It exports only a binary primary land/water partition as a `MaskField` / `ConstraintField`.
- The field intentionally does not perform marine carving, coastline refinement, sea-region extraction, inland-sea synthesis, or gameplay semantics.
- The canonical runtime module exports `getLandWaterMaskFieldContract()` and `generateLandWaterMaskField()` from `js/worldgen/macro/relief-elevation-generator.js`.

## LandmassCleanupMaskField

```json
{
  "contractId": "landmassCleanupMaskField",
  "fieldId": "landmassCleanupMaskField",
  "stageId": "landmassCleanupMaskField",
  "fieldType": "MaskField",
  "aliases": ["ConstraintField"],
  "sourceKeys": [
    "landWaterMaskField",
    "seaLevelAppliedElevationField",
    "baseContinentalMassField",
    "mountainAmplificationField",
    "basinDepressionField"
  ],
  "requiredKeys": [
    "fieldId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats",
    "threshold",
    "semantics",
    "cleanupModel",
    "compatibility"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "compatibility": {
    "futureContinentExtractionInput": true,
    "futureMarineCarvingInput": true,
    "futureCoastlineRefinementInput": true,
    "futureSeaRegionClusteringInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "marineCarving",
    "finalCoastlines",
    "seaRegions",
    "continents",
    "shapeScoring",
    "historyFacingAnalysis",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `LandmassCleanupMaskField` is deterministic from `macroSeed`, `LandWaterMaskField`, and already materialized coarse relief support fields.
- It exports only a cleaned binary land/water partition that removes small noise artifacts while preserving large-scale landmass structure.
- The field intentionally does not perform marine carving, final coastline synthesis, whole-world shape scoring, history-facing analysis, or gameplay semantics.
- The canonical runtime module exports `getLandmassCleanupMaskFieldContract()` and `generateLandmassCleanupMaskField()` from `js/worldgen/macro/relief-elevation-generator.js`.

## LandmassShapeInterestScores

```json
{
  "contractId": "landmassShapeInterestScores",
  "stageId": "landmassShapeInterestScores",
  "sourceKeys": [
    "landmassCleanupMaskField",
    "landWaterMaskField",
    "seaLevelAppliedElevationField",
    "baseContinentalMassField",
    "mountainAmplificationField",
    "basinDepressionField"
  ],
  "requiredKeys": [
    "scoringId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "minimumLandmassCellCount",
    "landmassCount",
    "scoredLandmassCount",
    "selectionModel",
    "scoreModel",
    "landmassScores",
    "summary",
    "compatibility"
  ],
  "compatibility": {
    "futureValidationInput": true,
    "futureRebalanceInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "wholeWorldValidation",
    "validationReport",
    "rebalanceActions",
    "strategicRegions",
    "historyFacingAnalysis",
    "gameplaySemantics"
  ]
}
```

### Notes
- `LandmassShapeInterestScores` is deterministic from `macroSeed` and already materialized cleaned land/relief fields.
- It exports only per-landmass local scoring for major cleaned landmasses, not full-world validation.
- The output intentionally does not validate the world, does not execute rebalance, does not synthesize strategic regions, and does not add gameplay semantics.
- The canonical runtime module exports `getLandmassShapeInterestScoresContract()` and `generateLandmassShapeInterestScores()` from `js/worldgen/macro/relief-elevation-generator.js`.

## ContinentBodies

```json
{
  "contractId": "continentBodies",
  "stageId": "continentBodies",
  "sourceKeys": [
    "landmassCleanupMaskField",
    "landWaterMaskField",
    "seaLevelAppliedElevationField",
    "baseContinentalMassField",
    "mountainAmplificationField",
    "basinDepressionField",
    "plateauCandidateField",
    "plateSeedDistribution"
  ],
  "requiredKeys": [
    "continentBodySetId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "minimumContinentCellCount",
    "continentBodyCount",
    "selectionModel",
    "synthesisModel",
    "summary",
    "continentBodies",
    "compatibility"
  ],
  "continentBodyKeys": [
    "continentBodyId",
    "recordDraft",
    "pendingRecordFields",
    "cellCount",
    "cellIndices",
    "normalizedArea",
    "boundingBox",
    "centroidPoint",
    "normalizedCentroid",
    "touchesBorder",
    "coastlineEdgeCount",
    "coastalCellCount",
    "coastalCellRatio",
    "dominantPlateId",
    "plateIds",
    "plateComposition",
    "macroShape",
    "macroShapeSignals",
    "sourceSignals",
    "namespace",
    "seed"
  ],
  "compatibility": {
    "futureContinentRecordInput": true,
    "requiresReliefRegionLinkage": true,
    "requiresClimateBandLinkage": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "continents",
    "continentSummaries",
    "historyFacingAnalysis",
    "strategicRegions",
    "seaRegions",
    "gameplaySemantics"
  ]
}
```

### Notes
- `ContinentBodies` is deterministic from `macroSeed`, cleaned landmass output, supporting relief/elevation fields, and `plateSeedDistribution`.
- It exports connected major landmass bodies plus `recordDraft` objects aligned with `ContinentRecord`.
- The draft records intentionally leave `reliefRegionIds`, `climateBandIds`, `primaryReliefRegionId`, and `primaryClimateBandId` in `pendingRecordFields` until later physical linkage microsteps.
- The output intentionally does not export final `continents[]`, does not build whole-pipeline continent summaries, does not synthesize strategic regions, and does not add history or gameplay semantics.
- The canonical runtime module exports `getContinentBodiesContract()` and `generateContinentBodies()` from `js/worldgen/macro/relief-elevation-generator.js`.

## ReliefRegionExtraction

```json
{
  "contractId": "reliefRegionExtraction",
  "stageId": "reliefRegionExtraction",
  "recordContract": "ReliefRegionRecord",
  "sourceKeys": [
    "landmassCleanupMaskField",
    "landWaterMaskField",
    "seaLevelAppliedElevationField",
    "mountainAmplificationField",
    "basinDepressionField",
    "plateauCandidateField",
    "baseContinentalMassField",
    "fractureMaskField",
    "ridgeDirectionField",
    "plainLowlandSmoothingField",
    "continentBodies",
    "plateSeedDistribution"
  ],
  "requiredKeys": [
    "reliefRegionSetId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "minimumReliefRegionCellCount",
    "classificationModel",
    "extractionModel",
    "summary",
    "reliefRegions",
    "reliefRegionBodies",
    "compatibility"
  ],
  "reliefTypes": [
    "mountain",
    "plateau",
    "plain",
    "basin",
    "coast"
  ],
  "compatibility": {
    "producesReliefRegionRecords": true,
    "futureContinentReliefLinkageInput": true,
    "futureMountainSystemReliefLinkageInput": true,
    "futureSeaRegionAdjacencyLinkageInput": true,
    "climateClassificationRequiredLater": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "climateClassification",
    "localBiomePlacement",
    "riverSystems",
    "seaRegions",
    "terrainCells",
    "historyFacingAnalysis",
    "gameplaySemantics"
  ]
}
```

### Notes
- `ReliefRegionExtraction` is deterministic from `macroSeed`, cleaned land/elevation fields, `continentBodies`, and `plateSeedDistribution`.
- It extracts large connected regions classified as `mountain`, `plateau`, `plain`, `basin`, or `coast`.
- It emits `reliefRegions[]` as `ReliefRegionRecord`-compatible records and keeps `reliefRegionBodies[]` as geometry/diagnostic metadata for later linkage.
- Coastal records intentionally leave `adjacentSeaRegionIds` empty until sea-region extraction/linkage exists.
- The output intentionally does not classify climate, place local biome props, build river systems, extract sea regions, emit terrain cells, or add history/gameplay semantics.
- The canonical runtime module exports `getReliefRegionExtractionContract()` and `generateReliefRegions()` from `js/worldgen/macro/relief-elevation-generator.js`.

## ReliefElevationGenerator Scaffold

```json
{
  "contractId": "reliefElevationOutput",
  "pipelineStepId": "reliefElevation",
  "status": "PARTIAL_IMPLEMENTED",
  "fieldDependencies": [
    "upliftField",
    "subsidenceField",
    "fractureMaskField",
    "ridgeDirectionField",
    "platePressureField",
    "plainLowlandSmoothingField"
  ],
  "intermediateDependencies": [
    "plateSeedDistribution",
    "basinSeeds",
    "mountainBeltCandidates",
    "arcFormationHelper",
    "hotspotVolcanicSeedHelper"
  ],
  "plannedOutputs": {
    "fields": [
      "baseContinentalMassField",
      "macroElevationField",
      "domainWarpedMacroElevationField",
      "mountainAmplificationField",
      "basinDepressionField",
      "plateauCandidateField",
      "seaLevelAppliedElevationField",
      "landWaterMaskField",
      "landmassCleanupMaskField"
    ],
    "intermediateOutputs": [
      "reliefElevationCompositionPlan",
      "landmassShapeInterestScores",
      "continentBodies",
      "reliefRegionExtraction"
    ],
    "records": [
      "reliefRegions"
    ],
    "debugArtifacts": [
      "reliefElevationFieldSnapshots"
    ]
  },
  "implementedOutputs": {
    "fields": [
      "baseContinentalMassField",
      "macroElevationField",
      "domainWarpedMacroElevationField",
      "mountainAmplificationField",
      "basinDepressionField",
      "plateauCandidateField",
      "seaLevelAppliedElevationField",
      "landWaterMaskField",
      "landmassCleanupMaskField"
    ],
    "intermediateOutputs": [
      "landmassShapeInterestScores",
      "continentBodies",
      "reliefRegionExtraction"
    ],
    "records": [
      "reliefRegions"
    ],
    "debugArtifacts": [
      "reliefElevationFieldSnapshots"
    ]
  },
  "intentionallyAbsent": [
    "finalElevation",
    "seaFill",
    "marineFloodFill",
    "finalCoastlines",
    "continents",
    "continentSummaries",
    "lakeFormation",
    "marshFormation",
    "riverSystems",
    "inlandSeas",
    "seaRegions",
    "mountainRecords",
    "plateauRecords",
    "terrainCells",
    "validationReport",
    "strategicRegions",
    "historyFacingAnalysis",
    "gameplaySemantics"
  ]
}
```

### Notes
- `ReliefElevationGenerator` currently exports `baseContinentalMassField`, `macroElevationField`, `domainWarpedMacroElevationField`, `mountainAmplificationField`, `basinDepressionField`, `plateauCandidateField`, `seaLevelAppliedElevationField`, `landWaterMaskField`, `landmassCleanupMaskField`, `landmassShapeInterestScores`, `continentBodies`, `reliefRegionExtraction`, `records.reliefRegions`, `reliefElevationFieldSnapshots`, and a dependency availability report.
- It defines the physical field dependencies needed for later elevation composition while still leaving final elevation outputs absent.
- It is not a sea-fill pass, not a coastline generator, not a terrain generator, not whole-world validation, not strategic-region synthesis, not history-facing analysis, not lake/marsh hydrology, not mountain record extraction, not plateau record extraction, not rain-shadow, not climate classification, not final `ContinentRecord` extraction, not a full debug bundle, and not a UI/debug panel.
- The canonical runtime module exports `getReliefElevationGeneratorDescriptor()`, `getReliefElevationInputContract()`, `getReliefElevationOutputContract()`, `getBaseContinentalMassFieldContract()`, `getMacroElevationFieldContract()`, `getDomainWarpedMacroElevationFieldContract()`, `getMountainAmplificationFieldContract()`, `getBasinDepressionFieldContract()`, `getPlateauCandidateFieldContract()`, `getSeaLevelAppliedElevationFieldContract()`, `getLandWaterMaskFieldContract()`, `getLandmassCleanupMaskFieldContract()`, `getLandmassShapeInterestScoresContract()`, `getContinentBodiesContract()`, `getReliefRegionExtractionContract()`, `getReliefElevationFieldSnapshotsContract()`, `getReliefElevationSeedHooks()`, `createReliefElevationPipeline()`, `generateBaseContinentalMassField()`, `generateMacroElevationField()`, `generateDomainWarpedMacroElevationField()`, `generateMountainAmplificationField()`, `generateBasinDepressionField()`, `generatePlateauCandidateField()`, `generateSeaLevelAppliedElevationField()`, `generateLandWaterMaskField()`, `generateLandmassCleanupMaskField()`, `generateLandmassShapeInterestScores()`, `generateContinentBodies()`, `generateReliefRegions()`, `buildReliefElevationFieldSnapshots()`, and `generateReliefElevation()` from `js/worldgen/macro/relief-elevation-generator.js`.

## MarineInvasionField

```json
{
  "contractId": "marineInvasionField",
  "fieldId": "marineInvasionField",
  "stageId": "marineInvasionComposite",
  "fieldType": "ScalarField",
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "sourceKeys": [
    "oceanBasinFloodFill",
    "oceanConnectivityMaskField",
    "coastalShelfDepthField",
    "coastalDepthApproximation",
    "bayCarvedLandWaterMaskField",
    "straitCarvedLandWaterMaskField",
    "islandChainFragmentedLandWaterMaskField",
    "coastJaggednessControlledLandWaterMaskField",
    "bayCarvingSummary",
    "straitCarvingSummary",
    "archipelagoFragmentationSummary",
    "coastJaggednessControlSummary"
  ],
  "componentWeights": {
    "finalWaterPresence": 0.04,
    "basinWaterExposure": 0.1,
    "coastalShelfDepth": 0.24,
    "newlyCarvedWater": 0.26,
    "bayCarving": 0.1,
    "straitCarving": 0.16,
    "islandChainFragmentation": 0.14,
    "coastJaggednessCarve": 0.06,
    "deterministicNudge": 0.025
  },
  "compatibility": {
    "futureCoastalOpportunityInput": true,
    "futureChokepointAnalysisInput": true,
    "futureArchipelagoMorphologyInput": true,
    "futureHydrosphereAnalyzerInput": true,
    "futureSeaRegionRebuildInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "climateIntegration",
    "finalPackage",
    "seaRegions",
    "macroRoutes",
    "routeGraph",
    "harborScoring",
    "fishingScore",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `MarineInvasionField` is now a concrete deterministic scalar composite field emitted by `MarineCarvingGenerator`.
- The field unifies hydrosphere basin/depth context with bay, strait, island-chain, and coast-jaggedness carving outputs so later analyzers have one stable physical input.
- This field remains analyzer-facing only: it is not climate integration, not a final sea-region rebuild, not route graph construction, and not final package assembly.

## MarineCarvingGenerator

```json
{
  "contractId": "marineCarvingOutput",
  "phaseId": "phase1",
  "phaseVersion": "phase1-v1",
  "status": "PARTIAL_IMPLEMENTED",
  "implementedOutputs": {
    "fields": [
      "marineInvasionField",
      "bayCarvedLandWaterMaskField",
      "straitCarvedLandWaterMaskField",
      "islandChainFragmentedLandWaterMaskField",
      "coastJaggednessControlledLandWaterMaskField"
    ],
    "intermediateOutputs": [
      "bayCarvingSummary",
      "straitCarvingSummary",
      "archipelagoFragmentationSummary",
      "coastJaggednessControlSummary"
    ],
    "records": [],
    "debugArtifacts": []
  },
  "intentionallyAbsent": [
    "inlandSeas",
    "islandChains",
    "chokepoints",
    "controlMetrics",
    "archipelagoCorridors",
    "seaRegions",
    "routeGraph",
    "climateIntegration",
    "finalPackage",
    "harborScoring",
    "riverDeltas",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `MarineCarvingGenerator` currently exports a deterministic marine-invasion composite field, a deterministic bay-carving pass, a deterministic narrow-strait carving pass, a deterministic island-chain fragmentation pass, and a deterministic coast-jaggedness control pass over cleaned coastal land.
- Required field dependencies are `landmassCleanupMaskField` and `oceanConnectivityMaskField`; optional support fields are `seaLevelAppliedElevationField`, `basinDepressionField`, `fractureMaskField`, `platePressureField`, and `coastalShelfDepthField`.
- The canonical runtime module exports `getMarineCarvingGeneratorDescriptor()`, `getMarineCarvingInputContract()`, `getMarineCarvingOutputContract()`, `getMarineInvasionFieldContract()`, `getBayCarvedLandWaterMaskFieldContract()`, `getBayCarvingSummaryContract()`, `getStraitCarvedLandWaterMaskFieldContract()`, `getStraitCarvingSummaryContract()`, `getIslandChainFragmentedLandWaterMaskFieldContract()`, `getArchipelagoFragmentationSummaryContract()`, `getCoastJaggednessControlledLandWaterMaskFieldContract()`, `getCoastJaggednessControlSummaryContract()`, `getMarineCarvingSeedHooks()`, `describeMarineCarvingDependencyAvailability()`, `generateMarineInvasionField()`, `generateBayCarvedLandWaterMaskField()`, `generateBayCarvingSummary()`, `generateStraitCarvedLandWaterMaskField()`, `generateStraitCarvingSummary()`, `generateIslandChainFragmentedLandWaterMaskField()`, `generateArchipelagoFragmentationSummary()`, `generateCoastJaggednessControlledLandWaterMaskField()`, `generateCoastJaggednessControlSummary()`, `createMarineCarvingPipeline()`, and `generateMarineCarving()` from `js/worldgen/macro/marine-carving-generator.js`.

## BayCarvedLandWaterMaskField

```json
{
  "contractId": "bayCarvedLandWaterMaskField",
  "fieldId": "bayCarvedLandWaterMaskField",
  "stageId": "bayCarving",
  "fieldType": "MaskField",
  "aliases": ["ConstraintField"],
  "sourceKeys": [
    "landmassCleanupMaskField",
    "oceanConnectivityMaskField",
    "seaLevelAppliedElevationField",
    "basinDepressionField"
  ],
  "requiredKeys": [
    "fieldId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats",
    "threshold",
    "semantics",
    "carvingModel",
    "compatibility"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "compatibility": {
    "futureStraitCarvingInput": true,
    "futureSeaRegionRebuildInput": true,
    "futureCoastalOpportunityInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "straits",
    "harborScoring",
    "routeGraph",
    "riverDeltas",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `BayCarvedLandWaterMaskField` is deterministic from `macroSeed`, `landmassCleanupMaskField`, `oceanConnectivityMaskField`, and optional low-relief support fields.
- It applies a bounded bay-notching transformation over coastal land only.
- Candidate selection explicitly rejects opposite-side water exposure, so the field is not a hidden strait-carving pass.
- The field intentionally does not rebuild sea regions, create `SeaRegionRecord` outputs, score harbors, or emit gameplay semantics.

## BayCarvingSummary

```json
{
  "contractId": "bayCarvingSummary",
  "stageId": "bayCarving",
  "sourceKeys": [
    "landmassCleanupMaskField",
    "oceanConnectivityMaskField",
    "seaLevelAppliedElevationField",
    "basinDepressionField"
  ],
  "requiredKeys": [
    "bayCarvingId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "coastalLandCellCount",
    "candidateCount",
    "carveBudget",
    "carvedCellCount",
    "carvingModel",
    "carvedCells",
    "summary",
    "compatibility"
  ],
  "intentionallyAbsent": [
    "straits",
    "harborScoring",
    "routeGraph",
    "riverDeltas",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `BayCarvingSummary` is a UI-free deterministic analysis artifact for the bay-carving pass.
- It records the bounded carve budget and the selected carved coastal cells, including score and coastal-context attributes for later physical analysis.
- It is not a route summary, not a harbor summary, and not a gameplay-facing coastal descriptor.

## StraitCarvedLandWaterMaskField

```json
{
  "contractId": "straitCarvedLandWaterMaskField",
  "fieldId": "straitCarvedLandWaterMaskField",
  "stageId": "straitCarving",
  "fieldType": "MaskField",
  "aliases": ["ConstraintField"],
  "sourceKeys": [
    "bayCarvedLandWaterMaskField",
    "oceanBasinFloodFill",
    "fractureMaskField",
    "platePressureField",
    "seaLevelAppliedElevationField",
    "basinDepressionField"
  ],
  "requiredKeys": [
    "fieldId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats",
    "threshold",
    "semantics",
    "carvingModel",
    "compatibility"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "compatibility": {
    "futureChokepointAnalysisInput": true,
    "futureSeaRegionRebuildInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "chokepoints",
    "controlMetrics",
    "islandChains",
    "routeGraph",
    "harborScoring",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `StraitCarvedLandWaterMaskField` is deterministic from `macroSeed`, the bay-carved coast mask, hydrosphere basin topology, and optional tectonic weakness fields.
- It only cuts narrow corridor cells that connect distinct water basins and have sufficient physical support.
- It is a physical transformation layer only; it does not emit `ChokepointRecord`, does not compute control values, and does not build island chains.

## IslandChainFragmentedLandWaterMaskField

```json
{
  "contractId": "islandChainFragmentedLandWaterMaskField",
  "fieldId": "islandChainFragmentedLandWaterMaskField",
  "stageId": "archipelagoFragmentation",
  "fieldType": "MaskField",
  "aliases": ["ConstraintField"],
  "sourceKeys": [
    "straitCarvedLandWaterMaskField",
    "oceanConnectivityMaskField",
    "oceanBasinFloodFill",
    "fractureMaskField",
    "platePressureField",
    "seaLevelAppliedElevationField",
    "basinDepressionField"
  ],
  "requiredKeys": [
    "fieldId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats",
    "threshold",
    "semantics",
    "carvingModel",
    "compatibility"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "compatibility": {
    "futureArchipelagoMorphologyInput": true,
    "futureSeaRegionRebuildInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "archipelagoSignificance",
    "chokepoints",
    "controlMetrics",
    "routeGraph",
    "harborScoring",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `IslandChainFragmentedLandWaterMaskField` is deterministic from `macroSeed`, the strait-carved coast mask, hydrosphere connectivity context, and optional tectonic weakness fields.
- It only fragments narrow coastal land-bar runs and opens deterministic break cells so future passes can read archipelago morphology.
- If opposite flanks resolve to distinct water basins, the candidate is rejected here so this pass stays separate from explicit strait carving.
- It does not emit finalized island-chain records, does not compute archipelago significance, and does not compute choke/control metrics.

## StraitCarvingSummary

```json
{
  "contractId": "straitCarvingSummary",
  "stageId": "straitCarving",
  "sourceKeys": [
    "bayCarvedLandWaterMaskField",
    "oceanBasinFloodFill",
    "fractureMaskField",
    "platePressureField",
    "seaLevelAppliedElevationField",
    "basinDepressionField"
  ],
  "requiredKeys": [
    "straitCarvingId",
    "stageId",
    "sourceFieldIds",
    "sourceOutputIds",
    "worldBounds",
    "thinCorridorCellCount",
    "candidateCount",
    "carveBudget",
    "carvedStraitCount",
    "carvingModel",
    "straitPassages",
    "summary",
    "compatibility"
  ],
  "intentionallyAbsent": [
    "chokepoints",
    "controlMetrics",
    "islandChains",
    "routeGraph",
    "harborScoring",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `StraitCarvingSummary` is a UI-free deterministic analysis artifact for the strait-carving pass.
- It records carved passage cells, connected basin ids / kinds, structural support, and a stable `futureChokepointTypeHint = narrow_strait`.
- It is explicitly not a chokepoint-analysis result and does not include control, trade, bypass, or collapse metrics.

## ArchipelagoFragmentationSummary

```json
{
  "contractId": "archipelagoFragmentationSummary",
  "stageId": "archipelagoFragmentation",
  "sourceKeys": [
    "straitCarvedLandWaterMaskField",
    "oceanConnectivityMaskField",
    "oceanBasinFloodFill",
    "fractureMaskField",
    "platePressureField",
    "seaLevelAppliedElevationField",
    "basinDepressionField"
  ],
  "requiredKeys": [
    "archipelagoFragmentationId",
    "stageId",
    "sourceFieldIds",
    "sourceOutputIds",
    "worldBounds",
    "candidateCount",
    "runCount",
    "fragmentationBudget",
    "fragmentedRunCount",
    "fragmentedCellCount",
    "fragmentationModel",
    "fragmentationRuns",
    "summary",
    "compatibility"
  ],
  "intentionallyAbsent": [
    "archipelagoSignificance",
    "chokepoints",
    "controlMetrics",
    "routeGraph",
    "harborScoring",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `ArchipelagoFragmentationSummary` is a UI-free deterministic analysis artifact for the island-chain fragmentation pass.
- It records fragmented coastal runs, carved break cells, projected island-segment counts, and future archipelago-morphology hints.
- It is explicitly not an `ArchipelagoRegionRecord`, not an archipelago-significance result, and not a chokepoint-analysis result.

## CoastJaggednessControlledLandWaterMaskField

```json
{
  "contractId": "coastJaggednessControlledLandWaterMaskField",
  "fieldId": "coastJaggednessControlledLandWaterMaskField",
  "stageId": "coastJaggednessControl",
  "fieldType": "MaskField",
  "aliases": ["ConstraintField"],
  "sourceKeys": [
    "islandChainFragmentedLandWaterMaskField",
    "oceanConnectivityMaskField",
    "fractureMaskField",
    "platePressureField",
    "seaLevelAppliedElevationField",
    "basinDepressionField"
  ],
  "requiredKeys": [
    "fieldId",
    "stageId",
    "sourceFieldIds",
    "worldBounds",
    "width",
    "height",
    "size",
    "range",
    "valueEncoding",
    "values",
    "stats",
    "threshold",
    "semantics",
    "carvingModel",
    "compatibility"
  ],
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "compatibility": {
    "futureCoastalOpportunityInput": true,
    "futureHarborLandingInput": true,
    "futureValidationRebalanceInput": true,
    "futureSeaRegionRebuildInput": true,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "climateEffects",
    "localTileCoastLogic",
    "routeGraph",
    "fishingScore",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `CoastJaggednessControlledLandWaterMaskField` is deterministic from `macroSeed`, the fragmented coast mask, and optional tectonic/coastal support fields.
- It applies a bounded coarse coastal carve-or-fill adjustment so shoreline complexity moves toward a target without destroying major forms.
- The target is both seed-driven and validation-controllable through `phase1Constraints.coastJaggedness`.
- It does not compute climate effects, local tile coast logic, harbor/fishing scores, or gameplay semantics.

## CoastJaggednessControlSummary

```json
{
  "contractId": "coastJaggednessControlSummary",
  "stageId": "coastJaggednessControl",
  "sourceKeys": [
    "islandChainFragmentedLandWaterMaskField",
    "oceanConnectivityMaskField",
    "fractureMaskField",
    "platePressureField",
    "seaLevelAppliedElevationField",
    "basinDepressionField",
    "phase1Constraints.coastJaggedness"
  ],
  "requiredKeys": [
    "coastJaggednessControlId",
    "stageId",
    "sourceFieldIds",
    "sourceOutputIds",
    "worldBounds",
    "jaggednessControl",
    "coastlineMetricsBefore",
    "coastlineMetricsAfter",
    "adjustmentMode",
    "candidateCount",
    "adjustmentBudget",
    "adjustedCellCount",
    "deltaToTargetBefore",
    "deltaToTargetAfter",
    "controlModel",
    "adjustedCells",
    "summary",
    "compatibility"
  ],
  "intentionallyAbsent": [
    "climateEffects",
    "localTileCoastLogic",
    "routeGraph",
    "fishingScore",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `CoastJaggednessControlSummary` is a UI-free deterministic analysis artifact for the coast-jaggedness pass.
- It records the seed baseline, validation control field, target jaggedness, coastline metrics before/after, and bounded adjustment cells.
- It is explicitly not a climate surface, not a harbor/fishing score, and not a local tile shoreline descriptor.

## ContinentalCohesionField

```json
{
  "contractId": "continentalCohesionOutput",
  "status": "PARTIAL_IMPLEMENTED",
  "seedNamespace": "macro.continentalCohesion",
  "implementedMetrics": [
    "interiorPassability",
    "regionalSegmentation",
    "corePotential",
    "fracturedPeriphery"
  ],
  "plannedMetrics": [
    "basinConnectivity",
    "ridgeBarrier",
    "stateScalePotential"
  ],
  "fields": [
    "interiorPassabilityField",
    "regionalSegmentMaskField",
    "corePotentialField",
    "fracturedPeripheryField",
    "continentalCohesionField"
  ],
  "intermediateOutputs": [
    "interiorPassabilityAnalysis",
    "regionalSegmentationAnalysis",
    "corePotentialAnalysis",
    "fracturedPeripheryAnalysis",
    "continentalCohesionSummaries",
    "continentalCohesionAnalysisPlan"
  ],
  "intentionallyAbsent": [
    "basinConnectivity",
    "ridgeBarrier",
    "stateScalePotential",
    "continentCoreDetection",
    "peripheryClassification",
    "fragmentationScoring",
    "routeGraph",
    "localTraversalRuntime",
    "ContinentRecordMutation",
    "MacroGeographyPackageAssembly",
    "historyFacingAnalysis",
    "terrainCells",
    "uiOverlays",
    "gameplaySemantics"
  ]
}
```

### Notes
- `ContinentalCohesionAnalyzer` currently emits coarse `interiorPassability`, coarse `regionalSegmentation`, physical `corePotential`, coarse `fracturedPeriphery`, and a unified `continentalCohesionField` with per-continent summaries; the remaining cohesion metrics stay planned.
- The analyzer reads physical/intermediate dependencies only: `continentBodies`, `reliefRegionExtraction` / optional `reliefRegions`, `climateStressField`, optional climate-stress summaries, and optional hydrology hints.
- This output is analyzer-local. It does not add a root `MacroGeographyPackage` field and does not change `MacroGeographyHandoffPackage`.

## InteriorPassabilityField

```json
{
  "fieldId": "interiorPassabilityField",
  "stageId": "interiorPassability",
  "fieldType": "ScalarField",
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "maskEncoding": "analyzedMaskValues",
  "modelId": "coarseReliefClimateHydrologyCompositeV1",
  "sourceKeys": [
    "continentBodies",
    "reliefRegionExtraction",
    "reliefRegions",
    "climateStressField",
    "climateStressRegionalSummaries",
    "watershedSegmentation",
    "flowAccumulationField",
    "majorRiverCandidates",
    "deltaLakeMarshTagging"
  ],
  "continentSummaryKeys": [
    "continentId",
    "continentBodyId",
    "meanInteriorPassability",
    "passabilityClass",
    "lowPassabilityCellRatio",
    "highPassabilityCellRatio",
    "meanClimateStress",
    "meanRuggednessPenalty",
    "meanHydrologySupport",
    "riverCorridorCellRatio",
    "waterFringeCellRatio",
    "dominantReliefType",
    "reliefTypeMix"
  ],
  "intentionallyAbsent": [
    "regionalSegmentation",
    "corePotential",
    "fracturedPeriphery",
    "routeGraph",
    "localTraversalRuntime",
    "ContinentRecordMutation",
    "MacroGeographyPackageAssembly",
    "historyFacingAnalysis",
    "gameplaySemantics"
  ]
}
```

### Notes
- `interiorPassabilityField` encodes coarse physical passability for continent-body cells only; cells outside analyzed continent bodies remain `0` with `analyzedMaskValues = 0`.
- Relief type and ruggedness provide the base obstruction signal; `climateStressField` applies physical climate burden; flow accumulation, major-river candidates, watershed scale, and delta/lake/marsh fringe tags provide bounded hydrology support.
- The field is not local traversal runtime, not a route graph, and not a core/periphery detector.

## RegionalSegmentMaskField

```json
{
  "fieldId": "regionalSegmentMaskField",
  "stageId": "regionalSegmentation",
  "fieldType": "ScalarField",
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "maskEncodings": [
    "analyzedMaskValues",
    "barrierMaskValues"
  ],
  "modelId": "continentInteriorPassabilityBarrierComponentsV1",
  "sourceKeys": [
    "interiorPassabilityField",
    "interiorPassabilityAnalysis",
    "continentBodies",
    "reliefRegionExtraction",
    "reliefRegions",
    "climateStressField"
  ],
  "regionalSegmentKeys": [
    "regionalSegmentId",
    "continentId",
    "continentBodyId",
    "segmentIndex",
    "cellCount",
    "continentCellRatio",
    "meanInteriorPassability",
    "passabilityClass",
    "meanClimateStress",
    "barrierEdgeCount",
    "barrierContactCellRatio",
    "exteriorEdgeCount",
    "dominantReliefType",
    "reliefTypeMix",
    "barrierSeparatedNeighborSegmentIds"
  ],
  "continentSummaryKeys": [
    "continentId",
    "continentBodyId",
    "sourceCellCount",
    "minimumSegmentCellCount",
    "candidateComponentCount",
    "regionalSegmentCount",
    "skippedSmallSegmentCellCount",
    "segmentedCellCount"
  ],
  "intentionallyAbsent": [
    "corePotential",
    "peripheryClassification",
    "fracturedPeriphery",
    "routeGraph",
    "localTraversalRuntime",
    "ContinentRecordMutation",
    "MacroGeographyPackageAssembly",
    "historyFacingAnalysis",
    "gameplaySemantics"
  ]
}
```

### Notes
- `regionalSegmentMaskField` encodes coarse segment membership only for selected large continent-internal components; barrier cells, tiny skipped components, and unanalyzed cells remain `0`.
- `barrierMaskValues` marks the cells treated as macro barriers during segmentation, derived from interior passability plus rugged mountain/plateau context rather than from local pathfinding.
- The field is not core detection, not fractured-periphery classification, not a route graph, and not a local traversal runtime.

## CorePotentialField

```json
{
  "fieldId": "corePotentialField",
  "stageId": "corePotential",
  "fieldType": "ScalarField",
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "maskEncoding": "analyzedMaskValues",
  "modelId": "regionalSegmentCorePotentialCompositeV1",
  "sourceKeys": [
    "regionalSegmentMaskField",
    "regionalSegmentationAnalysis",
    "continentBodies",
    "regionalClimateSummaries",
    "climateStressRegionalSummaries"
  ],
  "segmentPotentialKeys": [
    "regionalSegmentId",
    "continentId",
    "continentBodyId",
    "segmentIndex",
    "cellCount",
    "continentCellRatio",
    "meanInteriorPassability",
    "meanClimateStress",
    "barrierSeparatedNeighborCount",
    "areaSupport",
    "passabilitySupport",
    "connectivitySupport",
    "climateSupport",
    "interioritySupport",
    "coastalAccessSupport",
    "corePotentialScore",
    "corePotentialClass"
  ],
  "continentSummaryKeys": [
    "continentId",
    "continentBodyId",
    "segmentCount",
    "leadingCorePotentialSegmentId",
    "leadingCorePotentialScore",
    "strongCorePotentialSegmentIds",
    "supportingCorePotentialSegmentIds",
    "meanCorePotential"
  ],
  "intentionallyAbsent": [
    "continentCoreDetection",
    "peripheryClassification",
    "fracturedPeriphery",
    "routeGraph",
    "localTraversalRuntime",
    "ContinentRecordMutation",
    "MacroGeographyPackageAssembly",
    "historyFacingAnalysis",
    "gameplaySemantics"
  ]
}
```

### Notes
- `corePotentialField` paints each selected regional segment with one coarse physical `corePotentialScore`; cells outside analyzed or segmented continental interiors remain `0`.
- The score is derived from regional segment size, passability, barrier-separated connectivity, coastal access context, and continent-level climate summaries only.
- The field is not actual core detection, not polity inference, not fractured-periphery classification, not a route graph, and not a local traversal runtime.

## FracturedPeripheryField

```json
{
  "fieldId": "fracturedPeripheryField",
  "stageId": "fracturedPeriphery",
  "fieldType": "ScalarField",
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "maskEncoding": "analyzedMaskValues",
  "modelId": "regionalSegmentFracturedPeripheryCompositeV1",
  "sourceKeys": [
    "regionalSegmentMaskField",
    "corePotentialField",
    "corePotentialAnalysis",
    "climateStressField",
    "climateStressRegionalSummaries",
    "watershedSegmentation",
    "flowAccumulationField",
    "majorRiverCandidates",
    "deltaLakeMarshTagging"
  ],
  "segmentPeripheryKeys": [
    "regionalSegmentId",
    "continentId",
    "continentBodyId",
    "segmentIndex",
    "cellCount",
    "continentCellRatio",
    "meanInteriorPassability",
    "meanClimateStress",
    "corePotentialScore",
    "edgeExposure",
    "connectivityFragility",
    "climateBurden",
    "hydrologyBurden",
    "sizeFragility",
    "coreDistance",
    "meanFlowAccumulation",
    "riverCorridorCellRatio",
    "waterFringeCellRatio",
    "fracturedPeripheryScore",
    "fracturedPeripheryClass"
  ],
  "continentSummaryKeys": [
    "continentId",
    "continentBodyId",
    "segmentCount",
    "leadingFracturedPeripherySegmentId",
    "leadingFracturedPeripheryScore",
    "fracturedPeripherySegmentIds",
    "weaklyConnectedPeripheralSegmentIds",
    "peripheralCellRatio",
    "meanFracturedPeriphery"
  ],
  "intentionallyAbsent": [
    "peripheryClassification",
    "strategicRegions",
    "routeGraph",
    "localTraversalRuntime",
    "ContinentRecordMutation",
    "MacroGeographyPackageAssembly",
    "historyFacingAnalysis",
    "gameplaySemantics"
  ]
}
```

### Notes
- `fracturedPeripheryField` paints each selected regional segment with one coarse physical `fracturedPeripheryScore`; cells outside analyzed or segmented continental interiors remain `0`.
- The score is derived from outer-edge exposure, weak barrier-separated connectivity, distance from leading core-potential segments, climate burden, and hydrology burden only.
- The field is not a strategic-region synthesis, not a route graph, not local traversal runtime, and not a full generic periphery-classification package.

## ContinentalCohesionField

```json
{
  "fieldId": "continentalCohesionField",
  "stageId": "continentalCohesion",
  "fieldType": "ScalarField",
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "maskEncoding": "analyzedMaskValues",
  "modelId": "cohesionSuboutputCompositeV1",
  "sourceKeys": [
    "interiorPassabilityField",
    "regionalSegmentMaskField",
    "corePotentialField",
    "fracturedPeripheryField",
    "interiorPassabilityAnalysis",
    "regionalSegmentationAnalysis",
    "corePotentialAnalysis",
    "fracturedPeripheryAnalysis",
    "continentBodies"
  ],
  "continentSummaryKeys": [
    "continentId",
    "continentBodyId",
    "sourceCellCount",
    "analyzedCellCount",
    "meanContinentalCohesion",
    "cohesionClass",
    "meanInteriorPassability",
    "passabilityClass",
    "regionalSegmentCount",
    "segmentedCellRatio",
    "leadingCorePotentialSegmentId",
    "leadingCorePotentialScore",
    "meanCorePotential",
    "leadingFracturedPeripherySegmentId",
    "leadingFracturedPeripheryScore",
    "peripheralCellRatio",
    "dominantReliefType",
    "dominantBandType",
    "stressRegime"
  ],
  "intentionallyAbsent": [
    "strategicRegions",
    "routeGraph",
    "localTraversalRuntime",
    "ContinentRecordMutation",
    "MacroGeographyPackageAssembly",
    "historyFacingAnalysis",
    "gameplaySemantics"
  ]
}
```

### Notes
- `continentalCohesionField` fuses the already materialized cohesion subfields into one coarse physical scalar across analyzed continental cells only.
- `continentalCohesionSummaries.continentSummaries[]` are concise analyzer-local continent rows; they summarize the unified field and the already emitted cohesion suboutputs without mutating `ContinentRecord`.
- The field is not a strategic-region synthesis, not a route graph, not local traversal runtime, and not package assembly.

## CoastalOpportunityOutput

```json
{
  "contractId": "coastalOpportunityOutput",
  "status": "PARTIAL_IMPLEMENTED",
  "actualOutputs": {
    "fields": [
      "harborQualityField",
      "landingEaseField",
      "fishingPotentialField",
      "shoreDefenseField",
      "inlandLinkField",
      "coastalOpportunityMap"
    ],
    "intermediateOutputs": [
      "harborQualityAnalysis",
      "landingEaseAnalysis",
      "fishingPotentialAnalysis",
      "shoreDefenseAnalysis",
      "inlandLinkAnalysis",
      "coastalOpportunityProfile",
      "exceptionalCoastalNodes",
      "coastalOpportunityAnalysisPlan"
    ],
    "records": [],
    "debugArtifacts": []
  },
  "implementedSubScores": [
    "harborQuality",
    "landingEase",
    "fishingPotential",
    "shoreDefense",
    "inlandLink"
  ],
  "plannedSubScores": [],
  "intentionallyAbsent": [
    "coastalOpportunityRegionalSummaries",
    "coastalSettlementSuitability",
    "routeGraph",
    "macroRoutes",
    "strategicRegionSynthesis",
    "terrainCells",
    "uiOverlays",
    "gameplaySemantics"
  ]
}
```

### Notes
- `CoastalOpportunityAnalyzer` currently emits coarse harbor-quality scoring, separate coarse landing-ease scoring, separate coarse fishing-potential scoring, separate coarse natural shore-defense scoring, separate coarse inland-link scoring, a unified `coastalOpportunityMap`, `coastalOpportunityProfile`, `exceptionalCoastalNodes`, and the analyzer-local analysis plan.
- The route graph, macro routes, strategic-region synthesis, and gameplay-facing coastal semantics stay deferred.

## HarborQualityField

```json
{
  "fieldId": "harborQualityField",
  "stageId": "harborQuality",
  "fieldType": "ScalarField",
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "maskEncoding": "analyzedMaskValues",
  "modelId": "deterministicCoarseHarborQualityCompositeV1",
  "sourceKeys": [
    "seaRegionClusters",
    "coastalShelfDepthField",
    "coastalDepthApproximation",
    "seaNavigabilityTagging",
    "stormCorridorField",
    "coastalDecayBurdenField"
  ],
  "clusterSummaryKeys": [
    "seaRegionClusterId",
    "basinType",
    "cellCount",
    "analyzedCoastalCellCount",
    "meanShelfScore",
    "shallowShelfRatio",
    "meanStormExposure",
    "meanCoastalDecayBurden",
    "enclosureSupport",
    "shelterSupport",
    "approachSupport",
    "climateStability",
    "navigabilitySupport",
    "hazardRoughness",
    "dominantDepthZone",
    "harborQualityScore",
    "harborQualityClass",
    "peakHarborCellScore"
  ],
  "intentionallyAbsent": [
    "landingEase",
    "fishingPotential",
    "shoreDefense",
    "inlandLink",
    "portSettlementSynthesis",
    "routeGraph",
    "macroRoutes",
    "strategicRegions",
    "gameplaySemantics"
  ]
}
```

### Notes
- `harborQualityField` paints only shelf-supporting coastal water cells; deep offshore water, inland land, and unanalyzed cells remain `0`.
- The score is derived from sea-cluster shelter, enclosure, low exposure, shelf-like shallow-water support, and coastal climate burden only.
- The field is not landing-ease logic, not fishing potential, not shore-defense scoring, not route logic, and not settlement synthesis.

## LandingEaseField

```json
{
  "fieldId": "landingEaseField",
  "stageId": "landingEase",
  "fieldType": "ScalarField",
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "maskEncoding": "analyzedMaskValues",
  "modelId": "deterministicCoarseLandingEaseCompositeV1",
  "sourceKeys": [
    "seaRegionClusters",
    "coastalShelfDepthField",
    "coastalDepthApproximation",
    "seaNavigabilityTagging"
  ],
  "clusterSummaryKeys": [
    "seaRegionClusterId",
    "basinType",
    "cellCount",
    "analyzedLandingCellCount",
    "meanShelfScore",
    "shelfApproachBias",
    "shallowShelfRatio",
    "coastalSlopeRatio",
    "offshoreTransitionRatio",
    "edgeExposure",
    "enclosureScore",
    "exposureWindowSupport",
    "navigabilitySupport",
    "hazardRoughness",
    "maneuverSupport",
    "approachDepthSupport",
    "dominantDepthZone",
    "landingEaseScore",
    "landingEaseClass",
    "peakLandingCellScore"
  ],
  "intentionallyAbsent": [
    "harborQualityComposite",
    "fishingPotential",
    "shoreDefense",
    "inlandLink",
    "portSettlementSynthesis",
    "routeGraph",
    "macroRoutes",
    "strategicRegions",
    "gameplaySemantics"
  ]
}
```

### Notes
- `landingEaseField` paints only shelf-supporting coastal water cells; deep offshore water, inland land, and unanalyzed cells remain `0`.
- The score is derived from shelf/depth access, coastal openness, and hydrosphere approach conditions only.
- The field is scored independently from `harborQualityField`; it is not folded into harbor quality in this microstep.
- The field is not fishing potential, not shore-defense scoring, not route logic, and not settlement synthesis.

## FishingPotentialField

```json
{
  "fieldId": "fishingPotentialField",
  "stageId": "fishingPotential",
  "fieldType": "ScalarField",
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "maskEncoding": "analyzedMaskValues",
  "modelId": "deterministicCoarseFishingPotentialCompositeV1",
  "sourceKeys": [
    "seaRegionClusters",
    "coastalShelfDepthField",
    "coastalDepthApproximation",
    "seaNavigabilityTagging",
    "regionalClimateSummaries"
  ],
  "clusterSummaryKeys": [
    "seaRegionClusterId",
    "basinType",
    "cellCount",
    "analyzedFishingCellCount",
    "meanShelfScore",
    "shelfCellRatio",
    "shallowShelfRatio",
    "coastalSlopeRatio",
    "offshoreTransitionRatio",
    "basinHabitatSupport",
    "navigabilitySupport",
    "hazardRoughness",
    "waterConditionSupport",
    "adjacentLandEdgeRatio",
    "meanTemperatureBias",
    "meanHumidityBias",
    "meanSeasonalityBias",
    "dominantBandType",
    "climateProductivitySupport",
    "coastalNutrientSupport",
    "shelfBiologySupport",
    "fishingPotentialScore",
    "fishingPotentialClass",
    "peakFishingCellScore"
  ],
  "intentionallyAbsent": [
    "harborQualityComposite",
    "landingEaseComposite",
    "shoreDefense",
    "inlandLink",
    "fishingEconomySimulation",
    "routeGraph",
    "macroRoutes",
    "strategicRegions",
    "gameplaySemantics"
  ]
}
```

### Notes
- `fishingPotentialField` paints only shelf-supporting coastal water cells; deep offshore water, inland land, and unanalyzed cells remain `0`.
- The score is derived from shelf/depth habitat support, navigability and hazard water-condition proxies, coastal-contact nutrient proxies, and optional sea-climate summaries only.
- The field is scored independently from both `harborQualityField` and `landingEaseField`; it is not merged into either layer in this microstep.
- The field is not gameplay fishing economy, not shore-defense scoring, not route logic, and not settlement synthesis.

## ShoreDefenseField

```json
{
  "fieldId": "shoreDefenseField",
  "stageId": "shoreDefense",
  "fieldType": "ScalarField",
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "maskEncoding": "analyzedMaskValues",
  "modelId": "deterministicCoarseShoreDefenseCompositeV1",
  "sourceKeys": [
    "seaRegionClusters",
    "coastalShelfDepthField",
    "coastalDepthApproximation",
    "seaNavigabilityTagging",
    "stormCorridorField",
    "coastalDecayBurdenField"
  ],
  "clusterSummaryKeys": [
    "seaRegionClusterId",
    "basinType",
    "cellCount",
    "analyzedDefenseCellCount",
    "meanShelfScore",
    "shelfCellRatio",
    "shallowShelfRatio",
    "coastalSlopeRatio",
    "offshoreTransitionRatio",
    "enclosureScore",
    "edgeExposure",
    "shorelineComplexity",
    "containmentSupport",
    "navigabilitySupport",
    "hazardRoughness",
    "approachFrictionSupport",
    "meanStormExposure",
    "meanCoastalDecayBurden",
    "shorelinePersistenceSupport",
    "shoreDefenseScore",
    "shoreDefenseClass",
    "peakShoreDefenseCellScore"
  ],
  "intentionallyAbsent": [
    "harborQualityComposite",
    "landingEaseComposite",
    "fishingEconomySimulation",
    "inlandLink",
    "militaryInterpretation",
    "politicalInterpretation",
    "routeGraph",
    "macroRoutes",
    "strategicRegions",
    "gameplaySemantics"
  ]
}
```

### Notes
- `shoreDefenseField` paints only shelf-supporting coastal water cells; deep offshore water, inland land, and unanalyzed cells remain `0`.
- The score is derived from enclosed coastal geometry, harder approach conditions, and lower shoreline exposure/decay only.
- The field is scored independently from `harborQualityField`, `landingEaseField`, and `fishingPotentialField`; it is not merged into those layers in this microstep.
- The field is a macro-geographic natural-defensibility proxy only. It is not military logic, not political interpretation, not route logic, and not settlement synthesis.

## InlandLinkField

```json
{
  "fieldId": "inlandLinkField",
  "stageId": "inlandLink",
  "fieldType": "ScalarField",
  "range": [0, 1],
  "valueEncoding": "rowMajorFloatArray",
  "maskEncoding": "analyzedMaskValues",
  "modelId": "deterministicCoarseInlandLinkBonusCompositeV1",
  "sourceKeys": [
    "seaRegionClusters",
    "coastalShelfDepthField",
    "watershedSegmentation",
    "majorRiverCandidates",
    "flowAccumulationField",
    "continentBodies",
    "continentalCohesionSummaries"
  ],
  "clusterSummaryKeys": [
    "seaRegionClusterId",
    "continentId",
    "basinType",
    "cellCount",
    "analyzedInlandLinkCellCount",
    "meanShelfScore",
    "linkedMajorRiverCount",
    "linkedWatershedCount",
    "meanNormalizedDischarge",
    "meanMajorRiverCandidateScore",
    "meanMouthAccumulation",
    "normalizedWatershedArea",
    "meanBasinContinuity",
    "meanHeadwaterScore",
    "meanContinentalCohesion",
    "meanInteriorPassability",
    "hydrologyAnchorSupport",
    "riverMouthSupport",
    "watershedReachSupport",
    "interiorCohesionSupport",
    "coastalNodeProxySupport",
    "inlandLinkBonusScore",
    "inlandLinkClass",
    "peakInlandLinkCellScore"
  ],
  "intentionallyAbsent": [
    "harborQualityComposite",
    "landingEaseComposite",
    "fishingEconomySimulation",
    "shoreDefenseInterpretation",
    "routeGraph",
    "macroRoutes",
    "strategicRegions",
    "directCoastalNodeCandidates",
    "gameplaySemantics"
  ]
}
```

### Notes
- `inlandLinkField` paints only shelf-supporting coastal water cells; deep offshore water, inland land, and unanalyzed cells remain `0`.
- The score is derived from linked major-river mouths, watershed reach, optional continent-scale cohesion, and a shelf-and-river-mouth coastal-node proxy only.
- The field is scored independently from `harborQualityField`, `landingEaseField`, `fishingPotentialField`, and `shoreDefenseField`; it is not merged into those layers in this microstep.
- The current implementation does not introduce a dedicated `coastalNodeCandidates` output; it uses a deterministic proxy until that runtime layer exists.

## CoastalOpportunityField

```json
{
  "fieldId": "coastalOpportunityMap",
  "stageId": "compositeSynthesis",
  "range": [0, 1],
  "channels": [
    "harborQuality",
    "fishingPotential",
    "landingEase",
    "shoreDefense",
    "inlandLinkBonus"
  ],
  "modelId": "deterministicCoastalOpportunityCompositeProfileV1",
  "status": "implemented_composite"
}
```

### Notes
- `coastalOpportunityMap` is a deterministic analyzer-local weighted composite over the five implemented coastal sub-score fields.
- `coastalOpportunityProfile.clusterProfiles[]` emits per-sea-cluster unified rows keyed by `seaRegionClusterId`, including `coastalOpportunityScore`, `dominantDriverIds`, anchor cells, and exceptionality metrics.
- `exceptionalCoastalNodes.exceptionalCoastalNodes[]` emits shortlisted standout node candidates for downstream route/strategic layers only; it does not build a connectivity graph in this microstep.

## CoastalOpportunityProfile

```json
{
  "outputId": "coastalOpportunityProfile",
  "stageId": "compositeSynthesis",
  "modelId": "deterministicCoastalOpportunityCompositeProfileV1",
  "clusterProfileKeys": [
    "seaRegionClusterId",
    "continentId",
    "basinType",
    "cellCount",
    "analyzedCoastalCellCount",
    "meanCoastalOpportunityCellScore",
    "peakCoastalOpportunityCellScore",
    "anchorCellIndex",
    "anchorPoint",
    "normalizedAnchorPoint",
    "harborQualityScore",
    "landingEaseScore",
    "fishingPotentialScore",
    "shoreDefenseScore",
    "inlandLinkBonusScore",
    "dominantDepthZone",
    "dominantBandType",
    "dominantDriverIds",
    "supportiveDriverCount",
    "highSupportDriverCount",
    "coastalOpportunityScore",
    "coastalOpportunityClass",
    "exceptionalityScore",
    "exceptionalityClass",
    "futureRouteGraphInput",
    "futureStrategicLayerInput"
  ],
  "intentionallyAbsent": [
    "routeGraph",
    "macroRoutes",
    "strategicRegions",
    "localTraversalRuntime",
    "gameplaySemantics"
  ]
}
```

## ExceptionalCoastalNodes

```json
{
  "outputId": "exceptionalCoastalNodes",
  "stageId": "compositeSynthesis",
  "modelId": "deterministicCoastalOpportunityCompositeProfileV1",
  "exceptionalNodeKeys": [
    "coastalNodeId",
    "nodeRank",
    "selectionMode",
    "seaRegionClusterId",
    "continentId",
    "basinType",
    "anchorCellIndex",
    "anchorPoint",
    "normalizedAnchorPoint",
    "coastalOpportunityScore",
    "exceptionalityScore",
    "exceptionalityClass",
    "dominantDriverIds",
    "harborQualityScore",
    "landingEaseScore",
    "fishingPotentialScore",
    "shoreDefenseScore",
    "inlandLinkBonusScore",
    "futureRouteGraphInput",
    "futureStrategicLayerInput",
    "connectivityGraphBuilt"
  ],
  "intentionallyAbsent": [
    "routeGraph",
    "macroRoutes",
    "strategicRegions",
    "connectivityEdges",
    "gameplaySemantics"
  ]
}
```

## ConnectivityGraphOutput

```json
{
  "contractId": "connectivityGraphOutput",
  "status": "PARTIAL_IMPLEMENTED",
  "actualOutputs": {
    "fields": [],
    "intermediateOutputs": [
      "connectivityGraphBuildPlan",
      "landConnectivityGraph",
      "seaConnectivityGraph",
      "hybridConnectivityGraph",
      "routeCostSurface",
      "macroRoutes",
      "macroCorridors"
    ],
    "records": [],
    "debugArtifacts": []
  },
  "plannedOutputs": [
    "connectivityNodeRegistry",
    "connectivityEdgeRegistry"
  ],
  "intentionallyAbsent": [
    "connectivityNodeRegistry",
    "connectivityEdgeRegistry",
    "strategicRegionSynthesis",
    "terrainCells",
    "uiOverlays",
    "gameplaySemantics"
  ]
}
```

### Notes
- `ConnectivityGraphBuilder` currently emits `connectivityGraphBuildPlan` plus coarse `landConnectivityGraph`, `seaConnectivityGraph`, `hybridConnectivityGraph`, `routeCostSurface`, `macroRoutes`, and `macroCorridors` outputs.
- The standalone node/edge registries remain deferred; official chokepoint records are now synthesized downstream by `ChokepointAnalyzer`.

## LandConnectivityGraph

```json
{
  "outputId": "landConnectivityGraph",
  "stageId": "graphAssembly",
  "modelId": "deterministicCoarseLandConnectivityGraphV1",
  "graphFamily": "land",
  "nodeKeys": [
    "nodeId",
    "nodeType",
    "nodeRole",
    "continentId",
    "sourceRegionalSegmentId",
    "sourceCoastalNodeId",
    "centroidPoint",
    "normalizedCentroid",
    "anchorPoint",
    "normalizedAnchorPoint",
    "meanInteriorPassability",
    "meanContinentalCohesion",
    "corePotentialScore",
    "fracturedPeripheryScore",
    "attachmentSegmentId",
    "attachmentStrength",
    "futureSeaGraphBridge",
    "futureHybridGraphBridge"
  ],
  "edgeKeys": [
    "edgeId",
    "edgeType",
    "fromNodeId",
    "toNodeId",
    "fromRegionalSegmentId",
    "toRegionalSegmentId",
    "fromCoastalNodeId",
    "continentId",
    "coarseConnectivityStrength",
    "connectionClass",
    "crossesBarrierBand",
    "routeCostComputed",
    "futureMacroRouteInput",
    "futureSeaGraphBridge",
    "futureHybridGraphBridge"
  ],
  "intentionallyAbsent": [
    "connectivityNodeRegistry",
    "connectivityEdgeRegistry",
    "routeCostSurface",
    "macroRoutes",
    "gameplaySemantics"
  ]
}
```

### Notes
- `landConnectivityGraph.nodes[]` contains coarse inland region nodes from `regionalSegmentationAnalysis` plus attached coastal terminal nodes from `exceptionalCoastalNodes`.
- `landConnectivityGraph.edges[]` contains only coarse interregional links and land-side coastal attachment links; it does not encode sea traversal or hybrid costs.
- The graph is deterministic and physical-only. It is not a macro-route output and it is not a route-cost surface.

## SeaConnectivityGraph

```json
{
  "outputId": "seaConnectivityGraph",
  "stageId": "graphAssembly",
  "modelId": "deterministicCoarseSeaConnectivityGraphV1",
  "graphFamily": "sea",
  "nodeKeys": [
    "nodeId",
    "nodeType",
    "nodeRole",
    "seaRegionClusterId",
    "seaRegionId",
    "basinType",
    "touchesWorldEdge",
    "normalizedArea",
    "normalizedCentroid",
    "navigability",
    "hazardRoughness",
    "openWaterBias",
    "constrainedWaterBias",
    "linkedCoastalOpportunityScore",
    "sourceCoastalNodeId",
    "attachmentSeaRegionClusterId",
    "attachmentStrength",
    "futureLandGraphBridge",
    "futureHybridGraphBridge"
  ],
  "edgeKeys": [
    "edgeId",
    "edgeType",
    "fromNodeId",
    "toNodeId",
    "fromSeaRegionClusterId",
    "toSeaRegionClusterId",
    "fromCoastalNodeId",
    "coarseConnectivityStrength",
    "connectionClass",
    "routeCostComputed",
    "futureMacroRouteInput",
    "futureLandGraphBridge",
    "futureHybridGraphBridge"
  ],
  "intentionallyAbsent": [
    "connectivityNodeRegistry",
    "connectivityEdgeRegistry",
    "routeCostSurface",
    "macroRoutes",
    "gameplaySemantics"
  ]
}
```

### Notes
- `seaConnectivityGraph.nodes[]` contains coarse marine basin nodes from `seaRegionClusters` / `seaNavigabilityTagging` plus sea-side coastal terminal nodes from `exceptionalCoastalNodes` when the node maps to a known `seaRegionClusterId`.
- `seaConnectivityGraph.edges[]` contains only coarse inter-basin links and exact coastal-to-basin attachment links; it does not encode hybrid traversal or route costs.
- The graph is deterministic and physical-only. It is not a macro-route output and it is not a route-cost surface.

## HybridConnectivityGraph

```json
{
  "outputId": "hybridConnectivityGraph",
  "stageId": "graphAssembly",
  "modelId": "deterministicCoarseHybridConnectivityGraphV1",
  "graphFamily": "hybrid",
  "nodeKeys": [
    "nodeId",
    "nodeType",
    "nodeRole",
    "sourceGraphFamily",
    "sourceRegionalSegmentId",
    "sourceCoastalNodeId",
    "continentId",
    "seaRegionClusterId",
    "attachmentNodeId",
    "attachmentSegmentId",
    "attachmentSeaRegionClusterId",
    "futureHybridGraphBridge"
  ],
  "edgeKeys": [
    "edgeId",
    "edgeType",
    "fromNodeId",
    "toNodeId",
    "sourceGraphFamily",
    "sourceGraphEdgeId",
    "sourceCoastalNodeId",
    "continentId",
    "seaRegionClusterId",
    "coarseConnectivityStrength",
    "connectionClass",
    "routeCostComputed",
    "coarseRouteCost",
    "routeCostClass",
    "dominantRouteCostDriverIds",
    "landGraphEdge",
    "seaGraphEdge",
    "transitionEdge"
  ],
  "intentionallyAbsent": [
    "connectivityNodeRegistry",
    "connectivityEdgeRegistry",
    "macroRoutes",
    "gameplaySemantics"
  ]
}
```

### Notes
- `hybridConnectivityGraph.nodes[]` combines the already materialized land-graph and sea-graph nodes and tags each row with its `sourceGraphFamily`.
- `hybridConnectivityGraph.edges[]` combines projected land/sea graph edges and adds explicit `land_sea_transition` edges wherever a shared `sourceCoastalNodeId` anchors both a land-side and sea-side coastal terminal.
- `hybridConnectivityGraph.edges[]` now also carries coarse route-cost annotations keyed from `routeCostSurface`, but route sampling and corridor extraction live in separate outputs.
- The graph is deterministic and physical-only. It is not itself a sampled-route output and it does not itself extract corridors.

## RouteCostSurface

```json
{
  "outputId": "routeCostSurface",
  "stageId": "routeCostModeling",
  "modelId": "deterministicCoarseHybridRouteCostModelV1",
  "hybridGraphOutputId": "hybridConnectivityGraph",
  "nodePressureKeys": [
    "nodeId",
    "nodeType",
    "nodeRole",
    "sourceGraphFamily",
    "sourceCoastalNodeId",
    "sourceRegionalSegmentId",
    "seaRegionClusterId",
    "normalizedAnchorPoint",
    "climateStress",
    "stormExposure",
    "coastalDecayBurden",
    "chokePressure",
    "coastalOpportunityRelief",
    "routePressureScore"
  ],
  "edgeCostKeys": [
    "edgeId",
    "edgeType",
    "fromNodeId",
    "toNodeId",
    "sourceGraphFamily",
    "sourceGraphEdgeId",
    "transitionEdge",
    "landGraphEdge",
    "seaGraphEdge",
    "coarseRouteCost",
    "routeCostClass",
    "routeCostComputed",
    "climateStress",
    "stormExposure",
    "coastalDecayBurden",
    "chokePressure",
    "connectivityFriction",
    "coastalOpportunityRelief",
    "dominantRouteCostDriverIds"
  ],
  "intentionallyAbsent": [
    "connectivityNodeRegistry",
    "connectivityEdgeRegistry",
    "macroRoutes",
    "corridorExtraction",
    "gameplaySemantics"
  ]
}
```

### Notes
- `routeCostSurface` is a deterministic coarse route-cost model over the already built `hybridConnectivityGraph`; it does not sample paths and it does not extract corridors.
- `nodePressures[]` aggregates climate/coastal/choke pressure at hybrid node anchors from `climateStressField`, `stormCorridorField`, `coastalDecayBurdenField`, and optional `straitCarvingSummary` hints.
- `edgeCosts[]` turns hybrid-edge connectivity, node pressure, coastal relief, and strait pressure into coarse `coarseRouteCost` estimates and dominant driver ids for downstream route analyzers.

## MacroRoutes

```json
{
  "outputId": "macroRoutes",
  "stageId": "routeSampling",
  "modelId": "deterministicMajorRegionRouteSamplingV1",
  "routeEndpointKeys": [
    "endpointId",
    "nodeId",
    "nodeRole",
    "continentId",
    "sourceRegionalSegmentId",
    "routeEndpointScore",
    "routeEndpointRank",
    "selectionReason"
  ],
  "candidateRouteKeys": [
    "routeId",
    "fromEndpointId",
    "toEndpointId",
    "fromNodeId",
    "toNodeId",
    "fromContinentId",
    "toContinentId",
    "fromRegionalSegmentId",
    "toRegionalSegmentId",
    "nodePathIds",
    "edgePathIds",
    "intermediateCoastalNodeIds",
    "hopCount",
    "totalRouteCost",
    "meanEdgeRouteCost",
    "peakEdgeRouteCost",
    "routeCostClass",
    "routeMode",
    "landEdgeCount",
    "seaEdgeCount",
    "transitionEdgeCount",
    "crossContinentRoute",
    "dominantRouteDriverIds"
  ],
  "intentionallyAbsent": [
    "connectivityNodeRegistry",
    "connectivityEdgeRegistry",
    "macroCorridors",
    "brittlenessAnalysis",
    "gameplaySemantics"
  ]
}
```

### Notes
- `macroRoutes.majorRouteEndpoints[]` selects deterministic major inland-region endpoints from the already built graph using coarse inland prominence only.
- `macroRoutes.candidateRoutes[]` stores deterministic sampled candidate routes between endpoint pairs as ordered `nodePathIds` and `edgePathIds` over the hybrid graph plus route-cost annotations.
- This output does not extract corridors and does not detect brittleness; it is route sampling only.

## MacroCorridors

```json
{
  "outputId": "macroCorridors",
  "stageId": "corridorExtraction",
  "modelId": "deterministicMacroCorridorExtractionV1",
  "corridorKeys": [
    "corridorId",
    "corridorEdgeIds",
    "corridorNodeIds",
    "anchorNodeIds",
    "branchNodeIds",
    "branchNodeCount",
    "supportingRouteIds",
    "sampledRouteCount",
    "edgeCount",
    "supportScore",
    "corridorStrengthClass",
    "meanEdgeRouteCost",
    "peakEdgeRouteCost",
    "routeMode",
    "landEdgeCount",
    "seaEdgeCount",
    "transitionEdgeCount",
    "dominantRouteDriverIds",
    "sourceCoastalNodeIds",
    "affectedRouteCount",
    "blockedRouteCount",
    "alternativeRouteCount",
    "severeDetourCount",
    "blockedRouteRatio",
    "alternativeRouteRatio",
    "severeDetourRatio",
    "meanAlternativeDetourPenalty",
    "routeDependenceScore",
    "alternativeSupportScore",
    "structureFragilityScore",
    "corridorDependenceClass",
    "mandatoryCorridor",
    "redundantCorridor",
    "brittleCorridor"
  ],
  "intentionallyAbsent": [
    "connectivityNodeRegistry",
    "connectivityEdgeRegistry",
    "chokepointRecords",
    "strategicRegionSynthesis",
    "gameplaySemantics"
  ]
}
```

### Notes
- `macroCorridors.macroCorridors[]` clusters repeated or strong route-supported hybrid edges into coarse macro-corridor components.
- Corridor dependence is now classified from corridor-removal re-sampling of affected route pairs plus coarse structural fragility, yielding `mandatoryCorridor`, `redundantCorridor`, `brittleCorridor`, and a primary `corridorDependenceClass`.
- This output is deterministic and physical-only. It is not gameplay logistics, not strategic synthesis, and it does not create chokepoint records.

## ChokepointAnalyzerOutput

```json
{
  "contractId": "chokepointAnalyzerOutput",
  "status": "PARTIAL_IMPLEMENTED",
  "actualOutputs": {
    "fields": [],
    "intermediateOutputs": [
      "chokepointAnalysisPlan",
      "straitChokepointCandidates",
      "islandChainChokepointCandidates",
      "inlandBottleneckChokepointCandidates",
      "chokepointRecords"
    ],
    "records": [
      "chokepoints"
    ],
    "debugArtifacts": []
  },
  "plannedOutputs": [],
  "intentionallyAbsent": [
    "chokepointPressureField",
    "strategicRegionSynthesis",
    "terrainCells",
    "uiOverlays",
    "gameplaySemantics"
  ]
}
```

### Notes
- `ChokepointAnalyzer` currently emits `chokepointAnalysisPlan`, all three chokepoint candidate families, and official `chokepointRecords`.
- Narrow-strait candidates are built from `straitCarvingSummary` and coarse `seaConnectivityGraph` context, and each row carries a `recordDraft` aligned with `ChokepointRecord`.
- Island-chain candidates are built from `archipelagoFragmentationSummary` and coarse route/corridor plus fragility support, and they now expose the full four choke metrics before stopping ahead of `recordDraft` synthesis.
- Inland-bottleneck candidates are built from `regionalSegmentationAnalysis`, `landConnectivityGraph`, `macroRoutes`, and `macroCorridors`, and they now expose the full four choke metrics before stopping ahead of `recordDraft` synthesis.
- `chokepointRecords.recordLinks[]` provides the minimal debug-friendly mapping from emitted records back to source candidates and family-class metadata, so no separate chokepoint debug artifact is needed in this microstep.

## ChokepointAnalysisPlan

```json
{
  "outputId": "chokepointAnalysisPlan",
  "stageId": "dependencyIntake",
  "modelId": "deterministicChokepointScaffoldPlanV1",
  "sourceCountKeys": [
    "straitPassageHintCount",
    "archipelagoRunHintCount",
    "regionalSegmentCount",
    "landGraphNodeCount",
    "seaGraphNodeCount",
    "hybridGraphNodeCount",
    "routeCostEdgeCount",
    "macroRouteCount",
    "macroCorridorCount",
    "straitChokepointCandidateCount",
    "islandChainLockCandidateCount",
    "inlandBottleneckCandidateCount",
    "chokepointRecordCount"
  ],
  "passPlanKeys": [
    "passId",
    "detectorFamily",
    "plannedOutputId",
    "actualOutputId",
    "status",
    "detectorImplemented",
    "dependencyGroupIds",
    "availableDependencyIds",
    "detectedCandidateCount",
    "signalCount",
    "readyForDetectorHandoff"
  ],
  "intentionallyAbsent": [
    "chokepointPressureField",
    "gameplaySemantics"
  ]
}
```

### Notes
- `chokepointAnalysisPlan` is a deterministic dependency-intake and detector-planning scaffold only.
- `passPlans[]` now marks narrow-strait, island-chain lock, and inland-bottleneck detection as implemented, and the summary also reports record synthesis as implemented.
- The plan now reports `recordSynthesisImplemented: true` alongside detector status and candidate/record counts.

## StraitChokepointCandidates

```json
{
  "outputId": "straitChokepointCandidates",
  "stageId": "straitDetection",
  "modelId": "deterministicNarrowStraitChokepointDetectorV1",
  "candidateKeys": [
    "candidateId",
    "sourceStraitPassageId",
    "chokepointType",
    "chokepointClass",
    "cellIndex",
    "x",
    "y",
    "orientation",
    "widthCells",
    "connectedBasinIds",
    "connectedBasinKinds",
    "matchedSeaRegionClusterIds",
    "matchedSeaRegionIds",
    "matchedSeaNodeIds",
    "supportingSeaEdgeIds",
    "supportingSeaEdgeCount",
    "seaGraphMatchMode",
    "seaGraphMatchConfidence",
    "score",
    "wallSupport",
    "fractureSupport",
    "pressureWeakness",
    "basinSupport",
    "structuralSupport",
    "passageNarrowness",
    "basinSeparationSupport",
    "marineAttachmentSupport",
    "constrainedWaterSupport",
    "openWaterSupport",
    "controlValue",
    "tradeDependency",
    "bypassDifficulty",
    "collapseSensitivity",
    "adjacentRegions",
    "recordDraft",
    "futureChokepointRecordInput"
  ],
  "intentionallyAbsent": [
    "islandChainChokepointCandidates",
    "inlandBottleneckChokepointCandidates",
    "chokepointRecords",
    "gameplaySemantics"
  ]
}
```

### Notes
- `straitChokepointCandidates.candidates[]` materializes narrow straits as first-class chokepoint candidates from `straitCarvingSummary`.
- Sea-side linkage is enriched from `seaConnectivityGraph` through a deterministic basin-kind heuristic; this is coarse graph context, not a local passage solver.
- Each candidate carries a `recordDraft` aligned with `ChokepointRecord`, and the official `chokepointRecords` output reuses that draft during record synthesis.

## IslandChainChokepointCandidates

```json
{
  "outputId": "islandChainChokepointCandidates",
  "stageId": "islandChainLockDetection",
  "modelId": "deterministicIslandChainLockDetectorV1",
  "candidateKeys": [
    "candidateId",
    "sourceFragmentationRunId",
    "chokepointType",
    "lockClass",
    "orientation",
    "candidateCellCount",
    "runCellIndices",
    "carvedBreakCellIndices",
    "projectedIslandSegmentCount",
    "averageScore",
    "strongestScore",
    "openWaterExposure",
    "fractureSupport",
    "pressureWeakness",
    "lowReliefBias",
    "basinSupport",
    "flankingBasinIds",
    "flankingBasinKinds",
    "matchedSeaRegionClusterIds",
    "matchedSeaRegionIds",
    "matchedSeaNodeIds",
    "supportingSeaEdgeIds",
    "supportingSeaEdgeCount",
    "seaGraphMatchMode",
    "seaGraphMatchConfidence",
    "marineRouteSupportCount",
    "marineCorridorSupportCount",
    "marineRouteSupportScore",
    "marineCorridorSupportScore",
    "marineCorridorStrengthClass",
    "supportingMarineCorridorIds",
    "supportingMarineRouteIds",
    "fragmentationSpanSupport",
    "islandSegmentLockSupport",
    "basinSeparationSupport",
    "morphologyLockSupport",
    "routeLockSupport",
    "marineAttachmentSupport",
    "constrainedWaterSupport",
    "openWaterSupport",
    "controlValue",
    "tradeDependency",
    "bypassDifficulty",
    "collapseSensitivity",
    "lockRelevanceScore",
    "adjacentRegions",
    "futureChokepointRecordInput"
  ],
  "intentionallyAbsent": [
    "inlandBottleneckChokepointCandidates",
    "chokepointRecords",
    "gameplaySemantics"
  ]
}
```

### Notes
- `islandChainChokepointCandidates.candidates[]` materializes archipelagic lock candidates from `archipelagoFragmentationSummary.fragmentationRuns`.
- Sea-side linkage is enriched from `seaConnectivityGraph` through a deterministic basin-kind heuristic, while route relevance is enriched from `macroRoutes` and `macroCorridors`.
- This detector now computes `controlValue`, `tradeDependency`, `bypassDifficulty`, and `collapseSensitivity`, then resolves final `lockClass`; official records are synthesized from those finalized candidate metrics in the current runtime.

## InlandBottleneckChokepointCandidates

```json
{
  "outputId": "inlandBottleneckChokepointCandidates",
  "stageId": "inlandBottleneckDetection",
  "modelId": "deterministicInlandBottleneckDetectorV1",
  "candidateKeys": [
    "candidateId",
    "sourceLandEdgeId",
    "chokepointType",
    "bottleneckClass",
    "continentId",
    "fromNodeId",
    "toNodeId",
    "fromRegionalSegmentId",
    "toRegionalSegmentId",
    "fromNodeRole",
    "toNodeRole",
    "fromDegree",
    "toDegree",
    "edgeConnectivityStrength",
    "connectionClass",
    "crossesBarrierBand",
    "fromCellCount",
    "toCellCount",
    "meanInteriorPassability",
    "meanBarrierContactCellRatio",
    "bridgeConstraintSupport",
    "passabilityCompressionSupport",
    "neighborPinchSupport",
    "landRouteSupportCount",
    "landCorridorSupportCount",
    "landRouteSupportScore",
    "landCorridorSupportScore",
    "landCorridorStrengthClass",
    "supportingLandRouteIds",
    "supportingLandCorridorIds",
    "routeConstraintSupport",
    "controlValue",
    "tradeDependency",
    "bypassDifficulty",
    "collapseSensitivity",
    "bottleneckRelevanceScore",
    "adjacentRegions",
    "futureChokepointRecordInput"
  ],
  "intentionallyAbsent": [
    "chokepointRecords",
    "recordDraft",
    "gameplaySemantics"
  ]
}
```

### Notes
- `inlandBottleneckChokepointCandidates.candidates[]` materializes dry-land bottleneck candidates from `regionalSegmentationAnalysis`, `landConnectivityGraph`, `macroRoutes`, and `macroCorridors`.
- The detector uses coarse land-topology, barrier-contact, passability-compression, and route/corridor concentration signals to identify isthmus-like or otherwise compressed inland links.
- This detector now computes `controlValue`, `tradeDependency`, `bypassDifficulty`, and `collapseSensitivity`, then resolves final `bottleneckClass`; official records are synthesized from those finalized candidate metrics in the current runtime.

## ChokepointRecordOutput

```json
{
  "contractId": "chokepointRecordOutput",
  "pipelineStep": "chokepoints",
  "moduleId": "chokepointAnalyzer",
  "status": "PARTIAL_IMPLEMENTED",
  "seedNamespace": "macro.chokepoints.records",
  "sourceKeys": [
    "straitChokepointCandidates",
    "islandChainChokepointCandidates",
    "inlandBottleneckChokepointCandidates"
  ],
  "recordSetId": "chokepoints",
  "recordContract": "ChokepointRecord",
  "materializationModel": "deterministicChokepointCandidateToRecordV1",
  "requiredKeys": [
    "chokepointRecordOutputId",
    "stageId",
    "recordSetId",
    "recordContract",
    "sourceFieldIds",
    "sourceOutputIds",
    "worldBounds",
    "seedNamespace",
    "seed",
    "materializationModel",
    "chokepoints",
    "recordLinks",
    "deferredChokepointDrafts",
    "summary",
    "compatibility"
  ],
  "compatibility": {
    "macroGeographyPackageRecordInput": true,
    "chokepointStageRecordOutput": true,
    "futureIsolationPeripheryInput": true,
    "futureStrategicLayerInput": true,
    "fullPackageAssemblyOutput": false,
    "sameWorldBoundsRequired": true
  },
  "intentionallyAbsent": [
    "fullPackageAssembly",
    "terrainCells",
    "gameplaySemantics"
  ]
}
```

### Notes
- `chokepointRecords` materializes official `ChokepointRecord` rows from all currently implemented chokepoint candidate families.
- Only contract-valid records are emitted into `chokepoints[]`; incomplete drafts remain in `deferredChokepointDrafts` with validation diagnostics.
- `recordLinks` preserve the debug-friendly mapping from emitted records back to candidate ids, source output ids, source reference ids, family-class fields, and per-record validation snapshots.
- This output does not assemble the full `MacroGeographyPackage`, does not enter isolation/periphery logic, and does not add gameplay semantics.

## IsolationAndPeripheryAnalyzerOutput

```json
{
  "moduleId": "isolationPeripheryAnalyzer",
  "pipelineStepId": "isolationPeriphery",
  "status": "PARTIAL_IMPLEMENTED",
  "actualOutputs": {
    "fields": [
      "isolationField"
    ],
    "intermediateOutputs": [
      "isolationAnalysis",
      "isolatedZones",
      "peripheryClusters"
    ],
    "records": [],
    "debugArtifacts": []
  },
  "intentionallyAbsent": [
    "chokepointDependenceField",
    "peripheryClassification",
    "archipelagoSignificance",
    "terrainCells",
    "uiOverlays",
    "gameplaySemantics"
  ]
}
```

- `IsolationAndPeripheryAnalyzer` now implements `distanceFromCore`, `resupplyCost`, `weatherAdjustedIsolation`, `culturalDriftPotential`, `autonomousSurvivalScore`, and local `lossInCollapseLikelihood`.
- This microstep also emits `isolatedZones` and `peripheryClusters`, but it still does not emit a standalone chokepoint-dependence field, archipelago-significance synthesis, or final gameplay semantics.

## IsolationField

```json
{
  "fieldId": "isolationField",
  "fieldType": "MultiChannelScalarField",
  "primaryChannelId": "weatherAdjustedIsolation",
  "range": [0, 1],
  "channels": [
    "distanceFromCore",
    "resupplyCost",
    "weatherAdjustedIsolation",
    "culturalDriftPotential",
    "autonomousSurvivalScore",
    "lossInCollapseLikelihood"
  ],
  "channelValues": {
    "distanceFromCore": [],
    "resupplyCost": [],
    "weatherAdjustedIsolation": [],
    "culturalDriftPotential": [],
    "autonomousSurvivalScore": [],
    "lossInCollapseLikelihood": []
  },
  "values": []
}
```

- `values[]` mirrors the primary `weatherAdjustedIsolation` channel as a debug-friendly single-channel fallback.
- `channelValues.distanceFromCore[]` is projected from hybrid-graph node distance to the strongest available inland core anchors.
- `channelValues.resupplyCost[]` combines graph distance, route-pressure friction, and route-coverage deficit.
- `channelValues.weatherAdjustedIsolation[]` layers `climateStressField` and `stormCorridorField` burden over `resupplyCost`.
- `channelValues.culturalDriftPotential[]` combines sustained separation with route fragility and local autonomous-survival support.
- `channelValues.autonomousSurvivalScore[]` estimates coarse local survivability under reduced resupply from core-potential, passability, climate burden, and lower fragility dependence.
- `channelValues.lossInCollapseLikelihood[]` is the local field/runtime name for the prompt's lost-in-collapse metric and combines weather burden, route fragility, and chokepoint collapse exposure.
- This field intentionally excludes a standalone `chokepointDependence` channel and final gameplay semantics in the current runtime.

## IsolationAnalysis

```json
{
  "outputId": "isolationAnalysis",
  "stageId": "isolationMetrics",
  "modelId": "deterministicIsolationAndPeripheryCoreDistanceV1",
  "coreAnchorNodeIds": [],
  "nodeIsolationRows": [
    {
      "nodeId": "hybrid_land_region_001",
      "distanceFromCore": 0.18,
      "resupplyCost": 0.31,
      "weatherAdjustedIsolation": 0.39,
      "culturalDriftPotential": 0.48,
      "autonomousSurvivalScore": 0.57,
      "lossInCollapseLikelihood": 0.41,
      "dominantIsolationDriverIds": [
        "distance_from_core",
        "route_pressure",
        "climate_stress"
      ]
    }
  ],
  "summary": {
    "metricsImplemented": [
      "distanceFromCore",
      "resupplyCost",
      "weatherAdjustedIsolation",
      "culturalDriftPotential",
      "autonomousSurvivalScore",
      "lossInCollapseLikelihood"
    ]
  }
}
```

- `nodeIsolationRows[]` is the node-level analysis surface backing `IsolationField`.
- `coreAnchorNodeIds[]` exposes which hybrid nodes were selected as deterministic core origins for distance propagation.
- `nodeIsolationRows[]` now also carries route-fragility and official chokepoint exposure signals that feed drift/autonomy/collapse scoring.
- The current analysis is still analyzer-local; it does not assemble final package records in this microstep.

## IsolatedZones

```json
{
  "outputId": "isolatedZones",
  "stageId": "isolatedZoneExtraction",
  "modelId": "deterministicIsolatedZoneExtractionV1",
  "zones": [
    {
      "zoneId": "iso_001",
      "type": "coastal_periphery",
      "zoneClass": "fragile",
      "isolation": 0.71,
      "resupplyDifficulty": 0.68,
      "culturalDriftPotential": 0.63,
      "autonomousSurvivalScore": 0.44,
      "lossInCollapseLikelihood": 0.74
    }
  ]
}
```

- `isolatedZones.zones[]` is a deterministic connected-component extraction over projectable hybrid nodes with elevated isolation/drift/collapse signatures.
- These rows are analyzer-local outputs shaped to be future package-compatible, but they are not official package records in this microstep.

## PeripheryClusters

```json
{
  "outputId": "peripheryClusters",
  "stageId": "peripheryClusterExtraction",
  "modelId": "deterministicPeripheryClusterExtractionV1",
  "clusters": [
    {
      "clusterId": "periphery_cluster_001",
      "clusterClass": "drifting_margin",
      "peripheryScore": 0.62,
      "meanWeatherAdjustedIsolation": 0.58,
      "meanCulturalDriftPotential": 0.66,
      "meanAutonomousSurvivalScore": 0.52,
      "meanLossInCollapseLikelihood": 0.49
    }
  ]
}
```

- `peripheryClusters.clusters[]` is a broader deterministic connected-component layer over projectable hybrid nodes with elevated periphery intensity.
- Clusters may reference overlapping `isolatedZoneIds`, but they remain analyzer-local rollups rather than final strategic-region synthesis.

## ArchipelagoSignificanceGeneratorOutput

```json
{
  "moduleId": "archipelagoSignificanceGenerator",
  "pipelineStepId": "archipelagoSignificance",
  "status": "PARTIAL_IMPLEMENTED",
  "actualOutputs": {
    "fields": [],
    "intermediateOutputs": [
      "archipelagoMacroZones"
    ],
    "records": [],
    "debugArtifacts": []
  },
  "plannedOutputs": [],
  "intentionallyAbsent": [
    "longTermSustainability",
    "historicalVolatility",
    "archipelagoRegionRecords",
    "strategicSynthesis",
    "terrainCells",
    "uiOverlays",
    "gameplaySemantics"
  ]
}
```

- `ArchipelagoSignificanceGenerator` now implements deterministic archipelago-macrozone detection plus five significance metrics and role-seed generation.
- The runtime consumes `archipelagoFragmentationSummary` plus optional `seaRegionClusters`, `seaNavigabilityTagging`, `macroRoutes`, `macroCorridors`, `islandChainChokepointCandidates`, `chokepointRecords`, `isolationAnalysis`, `isolatedZones`, and `peripheryClusters`.
- It still intentionally stops before final `ArchipelagoRegionRecord` export, strategic-region synthesis, and gameplay semantics.

## ArchipelagoMacroZones

```json
{
  "outputId": "archipelagoMacroZones",
  "stageId": "macrozoneDetection",
  "modelId": "deterministicArchipelagoMacrozoneDetectionV1",
  "macroZones": [
    {
      "archipelagoId": "arch_001",
      "morphologyType": "broken_chain",
      "sourceFragmentationRunIds": [
        "archipelago_run_001"
      ],
      "sourceIslandChainCandidateIds": [
        "island_chain_lock_001"
      ],
      "seaRegionClusterIds": [
        "sea_cluster_001"
      ],
      "seaRegionIds": [
        "sea_03"
      ],
      "primarySeaRegionId": "sea_03",
      "macroRouteIds": [
        "route_011"
      ],
      "macroCorridorIds": [
        "corridor_004"
      ],
      "linkedChokepointIds": [
        "chk_island_chain_001"
      ],
      "linkedIsolatedZoneIds": [
        "iso_001"
      ],
      "linkedPeripheryClusterIds": [
        "periphery_cluster_001"
      ],
      "connectiveValue": 0.74,
      "fragility": 0.41,
      "colonizationAppeal": 0.63,
      "contestScore": 0.58,
      "collapseSusceptibility": 0.49,
      "roleSeedHints": {
        "primaryRoleSeed": "bridge_chain",
        "secondaryRoleSeedIds": [
          "corridor_lattice"
        ],
        "seedStrength": 0.71,
        "seedTags": [
          "connected",
          "multi_basin",
          "chokepoint_linked"
        ],
        "dominantRoleDriverIds": [
          "route_support",
          "sea_region_reach",
          "chokepoint_control"
        ],
        "historicalInterpretationDeferred": true
      },
      "recordDraftHints": {
        "archipelagoId": "arch_001",
        "morphologyType": "broken_chain",
        "roleProfile": "",
        "seaRegionIds": [
          "sea_03"
        ],
        "climateBandIds": [],
        "primarySeaRegionId": "sea_03",
        "primaryClimateBandId": "",
        "macroRouteIds": [
          "route_011"
        ],
        "chokepointIds": [
          "chk_island_chain_001"
        ],
        "strategicRegionIds": [],
        "connectiveValue": 0.74,
        "fragility": 0.41,
        "colonizationAppeal": 0.63,
        "longTermSustainability": 0,
        "historicalVolatility": 0
      },
      "pendingRecordFields": [
        "roleProfile",
        "climateBandIds",
        "primaryClimateBandId",
        "longTermSustainability",
        "historicalVolatility",
        "strategicRegionIds"
      ],
      "significanceMetricsComputed": true,
      "futureArchipelagoRegionRecordInput": true
    }
  ],
  "summary": {
    "macrozoneCount": 1,
    "detectedRunCount": 1,
    "routedMacrozoneCount": 1,
    "chokepointLinkedMacrozoneCount": 1,
    "strongestMacrozoneId": "arch_001",
    "roleSeedGenerationImplemented": true,
    "significanceMetricsComputed": true
  }
}
```

- `macroZones[]` groups related island-fragmentation runs into coarse archipelagic macrozones.
- The same rows now also carry five analyzer-local significance metrics plus `roleSeedHints`, but those hints intentionally stop before historical or strategic interpretation.
- `recordDraftHints` is debug-friendly and `ArchipelagoRegionRecord`-aligned, but it is still not a finalized record export in this microstep.
- `contestScore` and `collapseSusceptibility` are intermediate-output-only metrics in this step; they are not final record fields.

## StrategicRegionSynthesizerOutput

```json
{
  "moduleId": "strategicRegionSynthesizer",
  "pipelineStepId": "strategicRegionSynthesis",
  "status": "PARTIAL_IMPLEMENTED",
  "actualOutputs": {
    "fields": [],
    "intermediateOutputs": [
      "strategicRegionCandidates"
    ],
    "records": [],
    "debugArtifacts": []
  },
  "plannedOutputs": [],
  "intentionallyAbsent": [
    "strategicRegionRecords",
    "validationRebalance",
    "packageAssembly",
    "terrainCells",
    "uiOverlays",
    "gameplaySemantics"
  ]
}
```

- `StrategicRegionSynthesizer` currently emits only candidate-group synthesis and intentionally stops before final `strategicRegions[]`.
- The runtime consumes already-materialized cohesion, coastal-opportunity, route/corridor, official chokepoint, isolation/periphery, and archipelago-significance outputs.
- Validation/rebalance is explicitly outside this microstep.

## StrategicRegionCandidates

```json
{
  "outputId": "strategicRegionCandidates",
  "stageId": "candidateSynthesis",
  "modelId": "deterministicStrategicRegionCandidateSynthesisV1",
  "imperialCoreCandidates": [
    {
      "strategicCandidateId": "candidate_imperial_core_001",
      "type": "imperial_core_candidate",
      "candidateScore": 0.74,
      "sourceContinentIds": [
        "cont_01"
      ],
      "sourceRegionalSegmentIds": [
        "regseg_001"
      ],
      "valueMix": {
        "food": 0.71,
        "routes": 0.56,
        "defense": 0.77,
        "coast": 0.34
      },
      "stabilityScore": 0.73,
      "expansionPressure": 0.67
    }
  ],
  "tradeBeltCandidates": [
    {
      "strategicCandidateId": "candidate_trade_belt_001",
      "type": "trade_belt_candidate",
      "candidateScore": 0.69,
      "sourceRouteIds": [
        "macro_route_001"
      ],
      "sourceCorridorIds": [
        "macro_corridor_001"
      ],
      "sourceArchipelagoIds": [
        "arch_001"
      ]
    }
  ],
  "fragilePeripheryCandidates": [
    {
      "strategicCandidateId": "candidate_fragile_periphery_001",
      "type": "fragile_periphery_candidate",
      "candidateScore": 0.66,
      "sourcePeripheryClusterIds": [
        "periphery_cluster_001"
      ],
      "sourceIsolatedZoneIds": [
        "iso_001"
      ]
    }
  ],
  "disputedStrategicRegionCandidates": [
    {
      "strategicCandidateId": "candidate_disputed_region_001",
      "type": "disputed_strategic_region_candidate",
      "candidateScore": 0.72,
      "sourceChokepointIds": [
        "chk_strait_001"
      ],
      "sourceArchipelagoIds": [
        "arch_002"
      ]
    }
  ],
  "summary": {
    "imperialCoreCandidateCount": 1,
    "tradeBeltCandidateCount": 1,
    "fragilePeripheryCandidateCount": 1,
    "disputedStrategicRegionCandidateCount": 1,
    "totalCandidateCount": 4,
    "validationRebalancePerformed": false,
    "strategicRegionRecordOutputGenerated": false
  }
}
```

- `strategicRegionCandidates` groups deterministic structural candidates into four families only: imperial cores, trade belts, fragile peripheries, and disputed regions.
- Every candidate carries `StrategicRegionRecord`-aligned `recordDraftHints`, but those hints are not final records in this microstep.
- The output is strategic-structural only and intentionally stops before validation/rebalance.

## MacroValidationAndRebalanceOutput

```json
{
  "moduleId": "macroValidationAndRebalance",
  "pipelineStepId": "validationRebalance",
  "status": "PARTIAL_IMPLEMENTED",
  "actualOutputs": {
    "fields": [],
    "intermediateOutputs": [
      "validationReport",
      "macroValidationDiagnostics",
      "partialRegenerationRebalancePass"
    ],
    "records": [],
    "debugArtifacts": []
  },
  "plannedOutputs": [],
  "intentionallyAbsent": [
    "packageAssembly",
    "wholePhaseOrchestration",
    "terrainCells",
    "uiOverlays",
    "gameplaySemantics"
  ]
}
}
```

- `MacroValidationAndRebalance` now emits a package-ready `validationReport`, a richer diagnostics surface, and a deterministic controlled `partialRegenerationRebalancePass`.
- The runtime consumes already-materialized major Phase 1 outputs from cohesion, coastal opportunity, connectivity, chokepoints, isolation/periphery, archipelago significance, and strategic candidate synthesis.
- Package assembly and whole-phase orchestration remain explicitly outside this microstep.

## MacroValidationDiagnostics

```json
{
  "outputId": "macroValidationDiagnostics",
  "stageId": "scoreDiagnostics",
  "modelId": "deterministicMacroValidationScoringV1",
  "scoreBreakdown": {
    "diversity": {
      "score": 0.68,
      "band": "healthy",
      "dominantDriverIds": [
        "continent_variety",
        "strategic_family_coverage",
        "macro_feature_density"
      ]
    },
    "routeRichness": {
      "score": 0.64,
      "band": "healthy"
    },
    "chokeValue": {
      "score": 0.61,
      "band": "healthy"
    },
    "archipelagoSignificance": {
      "score": 0.66,
      "band": "healthy"
    },
    "centerPeripheryContrast": {
      "score": 0.58,
      "band": "healthy"
    },
    "historyPotential": {
      "score": 0.7,
      "band": "strong"
    }
  },
  "summary": {
    "meanScore": 0.645,
    "validationPassed": true,
    "rebalancePassImplemented": true,
    "recommendationCount": 1
  }
}
```

- `validationReport` follows the official contract from `MacroGeographyPackage`: six normalized score keys, `failReasons`, deterministic `rebalanceActions[]`, `diagnostics`, and `selectiveRerollRecommendations`.
- `macroValidationDiagnostics` is analyzer-local and carries the richer breakdown layer needed for review/debug flows without mutating package or orchestration semantics.
- This step intentionally validates only:
  - `diversity`
  - `routeRichness`
  - `chokeValue`
  - `archipelagoSignificance`
  - `centerPeripheryContrast`
  - `historyPotential`
- The diagnostics layer still does not execute upstream reruns by itself; it materializes deterministic partial-regeneration actions for a later orchestrator.

## PartialRegenerationRebalancePass

```json
{
  "outputId": "partialRegenerationRebalancePass",
  "stageId": "partialRegenerationRebalance",
  "modelId": "deterministicPartialRegenerationRebalanceV1",
  "plannedActions": [
    {
      "actionId": "rebalance_action_001",
      "actionType": "selective_partial_regeneration",
      "priority": "high",
      "targetLayerIds": [
        "marineCarving",
        "archipelagoSignificance"
      ],
      "deterministicSeedDelta": 2654435761,
      "pipelineReentryMode": "targeted_recompute",
      "upstreamRerunExecuted": false
    }
  ],
  "summary": {
    "plannedActionCount": 1,
    "partialRegenerationSupported": true,
    "upstreamRerunExecuted": false,
    "rebalancePassImplemented": true
  }
}
```

- `partialRegenerationRebalancePass` is the controlled rebalance surface for Phase 1: it converts validation pressure into deterministic targeted actions without performing a whole-world reroll.
- The pass is intentionally orchestrator-facing. It does not mutate root package semantics by itself and does not become a downstream gameplay/debug bundle surface.

## StrategicFrictionField

```json
{
  "fieldId": "strategicFriction",
  "range": [0, 1],
  "channels": [
    "overlapOfRouteInterests",
    "controlDifficulty",
    "multiAccessPressure",
    "prestigeValue",
    "contestProbability"
  ]
}
```

## Phase1SeedConstraints

```json
{
  "groupId": "phase1SeedConstraints",
  "range": [0, 1],
  "normalization": "clamp",
  "defaultValue": 0.5,
  "fields": [
    "conflictPressure",
    "maritimeDependence",
    "environmentalVolatility",
    "coastJaggedness",
    "collapseIntensity"
  ]
}
```

### Notes
- This group is a seed/profile intake contract, not a UI options schema.
- The bounds are reused by Phase 1 physical and macro generators through a dedicated runtime bounds module.
- Descriptive tendency labels such as `worldTone` or `DerivedWorldTendencies` are not normalized through numeric bounds and remain separate from this constraint group.
