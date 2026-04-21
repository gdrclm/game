# MACRO GEOGRAPHY — FIELD SYSTEM

## Назначение
Этот документ фиксирует, какие поля существуют в Phase 1 и что они значат.

Поле — это не gameplay entity, а распределённый слой значений на world-scale grid.

---

## 1. PlatePressureField

### Смысл
Определяет фундаментальный каркас мира:
- где суша поднимается;
- где она ломается;
- где возникают дуги и массивы;
- где будет скелет континентов.

### Подметрики
- `uplift`
- `fracture`
- `compression`
- `driftBias`
- `arcFormation`

### Использование
Используется для построения первичного land tendency map.

### Runtime concrete field: `platePressureField`
- `platePressureField` is the fourth concrete tectonic scalar field materialized by the runtime scaffold and the first composite tectonic scalar field assembled from other tectonic outputs.
- Sources: `upliftField`, `subsidenceField`, `fractureMaskField`, `ridgeDirectionField`, `basinSeeds`, and `arcFormationHelper`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`.
- Model: deterministic weighted composite where uplift/fracture/ridge/arc act as pressure-concentration channels and subsidence/basin act as pressure-release channels.
- Compatibility: it exposes future interpretation hooks for land-tendency-adjacent passes, mountain amplification, and relief synthesis while staying separate from those downstream layers.
- It does not perform land tendency mapping, final elevation composition, marine flood fill, relief-region extraction, or climate effects.

### Runtime concrete field: `upliftField`
- `upliftField` is the first concrete tectonic scalar field materialized by the runtime scaffold.
- Source: `plateBoundaryClassification.futureSignals.upliftPotential`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`.
- Model: deterministic boundary-distance falloff around classified plate boundary candidates.
- It remains separate from subsidence, full elevation composition, relief regions, and climate effects.

### Runtime concrete field: `subsidenceField`
- `subsidenceField` is the second concrete tectonic scalar field materialized by the runtime scaffold.
- Source: `plateBoundaryClassification.futureSignals.subsidencePotential`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`.
- Model: deterministic boundary-distance falloff around divergent classified plate boundary candidates.
- Compatibility: it pairs with `upliftField` for future elevation composition through `upliftField - subsidenceField`.
- It does not perform marine flood fill, basin extraction, full elevation composition, relief region synthesis, or climate effects.

### Runtime concrete field: `fractureMaskField`
- `fractureMaskField` is the third concrete tectonic scalar field materialized by the runtime scaffold.
- Source: `plateBoundaryClassification.scores.transform`, blended with coarse normal stress and relative-motion magnitude.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`.
- Model: deterministic boundary-distance falloff around classified plate boundary candidates, with transform/shear weighted highest.
- Compatibility: it shares `worldBounds` with `upliftField` and `subsidenceField` for future ridge, carving, and landmass layers.
- It does not perform ridge line synthesis, final landmass synthesis, full elevation composition, relief region synthesis, or climate effects.

### Runtime concrete field: `ridgeDirectionField`
- `ridgeDirectionField` is the first concrete tectonic directional field materialized by the runtime scaffold.
- Sources: `plateBoundaryClassification.boundaryClassifications`, `upliftField`, `subsidenceField`, and `fractureMaskField`.
- Encoding: `rowMajorUnitVectorArrays` via parallel `xValues` / `yValues`.
- Model: deterministic ridge-line synthesis that projects tangent-oriented vectors along uplift-dominant boundary segments and stores explicit `ridgeLines` candidates.
- Compatibility: it shares `worldBounds` with upstream tectonic scalar fields and exposes `futureMountainAmplificationInput`.
- It does not perform basin logic, final elevation composition, climate effects, or final `MountainSystemRecord` extraction.

### Tectonic intermediate: `mountainBeltCandidates`
- `mountainBeltCandidates` is a deterministic tectonic candidate layer built on top of `ridgeDirectionField`, `platePressureField`, `upliftField`, `subsidenceField`, `fractureMaskField`, and `arcFormationHelper`.
- Model: coarse mountain-belt clustering that groups compatible `ridgeLines` into large-system candidates and emits `recordDraft` objects aligned with `MountainSystemRecord`.
- Output semantics: every candidate already has stable `mountainSystemId`, `systemType`, `plateIds`, `spineOrientation`, `upliftBias`, and `ridgeContinuity`, but still leaves `reliefRegionIds` / `primaryReliefRegionId` intentionally unresolved.
- Compatibility: it is a bridge layer for future mountain amplification and finalized `MountainSystemRecord` extraction.
- It does not perform climate shadow, relief-region extraction, or final elevation synthesis.

### Runtime concrete field: `plainLowlandSmoothingField`
- `plainLowlandSmoothingField` is a deterministic scalar smoothing pass built after `mountainBeltCandidates`.
- Sources: `upliftField`, `subsidenceField`, `fractureMaskField`, `ridgeDirectionField`, `platePressureField`, `basinSeeds`, and `mountainBeltCandidates`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`.
- Model: broad weighted smoothing that favors quiet tectonic areas, subsidence, and basin-seed support, while suppressing rugged/ridge/mountain-belt influence.
- Compatibility: it exposes future hooks for basin tendency, plateau-compatible relief logic, and later `ReliefRegionRecord` extraction.
- It does not perform fertility scoring, basin depression, plateau extraction, final relief-region synthesis, or gameplay semantics.

### Runtime scaffold: `ReliefElevationGenerator`
- `ReliefElevationGenerator` is the partial consumer scaffold for future macro elevation composition.
- Required field dependencies: `upliftField`, `subsidenceField`, `fractureMaskField`, `ridgeDirectionField`, `platePressureField`, and `plainLowlandSmoothingField`.
- Required intermediate dependencies: `basinSeeds` and `mountainBeltCandidates`; optional interpretation context may come from `arcFormationHelper` and `hotspotVolcanicSeedHelper`.
- `baseContinentalMassField` is implemented as the first relief/elevation micro-output.
- `macroElevationField` is implemented as the second relief/elevation micro-output.
- `domainWarpedMacroElevationField` is implemented as the third relief/elevation micro-output.
- `mountainAmplificationField` is implemented as the fourth relief/elevation micro-output.
- `basinDepressionField` is implemented as the fifth relief/elevation micro-output.
- `plateauCandidateField` is implemented as the sixth relief/elevation micro-output.
- `seaLevelAppliedElevationField` is implemented as the seventh relief/elevation micro-output.
- `landWaterMaskField` is implemented as the eighth relief/elevation micro-output.
- `landmassCleanupMaskField` is implemented as the ninth relief/elevation micro-output.
- `landmassShapeInterestScores` is implemented as the first relief/elevation intermediate analysis output.
- `continentBodies` is implemented as the second relief/elevation intermediate output for continent-body draft synthesis.
- `reliefRegions` is implemented as the first relief/elevation physical record output for large relief-region extraction.
- `reliefElevationFieldSnapshots` is implemented as a UI-free debug export set through `fieldDebugRegistry` for elevation fields, land/water masks, cleanup masks, and a debug-only relief-region type mask.
- Current runtime output intentionally has no cleaned final elevation grid after marine/cleanup passes, no sea fill, no final coastlines, no sea-region records, no final continent records, no climate-classified relief records, no full debug bundle, no visual panel, no whole-world validation, and no terrain/gameplay semantics.

### Runtime concrete field: `baseContinentalMassField`
- `baseContinentalMassField` is a deterministic coarse scalar field built by `ReliefElevationGenerator`.
- Sources: `platePressureField`, `upliftField`, `subsidenceField`, `fractureMaskField`, `ridgeDirectionField`, and `plainLowlandSmoothingField`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`.
- Model: broad weighted synthesis over tectonic composite context, smoothed with a coarse kernel and a small deterministic seed-bias channel.
- Compatibility: it exposes future hooks for landmass synthesis, marine carving, and continent extraction while staying separate from those downstream passes.
- It does not perform final coastlines, land/water thresholding, sea fill, continent extraction, final elevation, terrain cells, or gameplay semantics.

### Runtime concrete field: `macroElevationField`
- `macroElevationField` is a deterministic large-scale scalar field built by `ReliefElevationGenerator`.
- Sources: `baseContinentalMassField`, `platePressureField`, `upliftField`, `subsidenceField`, `fractureMaskField`, `ridgeDirectionField`, and `plainLowlandSmoothingField`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`.
- Model: weighted macro-scale elevation composition with broad smoothing, preserving tectonic uplift/pressure and continental-mass support while suppressing subsidence, fracture pressure, and oceanic mass gaps.
- Compatibility: it exposes future hooks for mountain amplification, basin depression, plateau candidates, and `ReliefRegionRecord` extraction.
- It does not perform domain warping, sea-level application, coastline thresholding, marine flood fill, final elevation, terrain cells, or gameplay semantics.

### Runtime concrete field: `domainWarpedMacroElevationField`
- `domainWarpedMacroElevationField` is a deterministic large-scale scalar field built by `ReliefElevationGenerator`.
- Sources: `macroElevationField`, `baseContinentalMassField`, `ridgeDirectionField`, `platePressureField`, `fractureMaskField`, `upliftField`, `subsidenceField`, and `plainLowlandSmoothingField`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`.
- Model: coarse domain-warping pass that pull-samples `macroElevationField` through deterministic low-frequency displacement, ridge-aligned displacement, and fracture-perpendicular displacement.
- Compatibility: it exposes future hooks for mountain amplification, basin depression, plateau candidates, cleanup, and `ReliefRegionRecord` extraction.
- It does not perform cleanup, sea-level application, coastline thresholding, marine flood fill, final elevation, relief-region extraction, terrain cells, or gameplay semantics.

### Runtime concrete field: `mountainAmplificationField`
- `mountainAmplificationField` is a deterministic scalar amplification field built by `ReliefElevationGenerator`.
- Sources: `domainWarpedMacroElevationField`, `macroElevationField`, `ridgeDirectionField`, `platePressureField`, `upliftField`, `subsidenceField`, `fractureMaskField`, and `mountainBeltCandidates`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`.
- Model: mountain-zone amplification synthesis that strengthens ridge-aligned and mountain-belt-supported regions while suppressing subsidence and fracture-heavy areas.
- Compatibility: it exposes future hooks for rain-shadow/orographic analysis, later relief classification, and downstream mountain-system linkage.
- It does not build `MountainSystemRecord`, rain-shadow, hydrology, final elevation, terrain-cell emission, or gameplay semantics.

### Runtime concrete field: `basinDepressionField`
- `basinDepressionField` is a deterministic scalar depression field built by `ReliefElevationGenerator`.
- Sources: `domainWarpedMacroElevationField`, `macroElevationField`, `plainLowlandSmoothingField`, `subsidenceField`, `upliftField`, `fractureMaskField`, `platePressureField`, `mountainAmplificationField`, and `basinSeeds`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`.
- Model: basin-floor deepening synthesis that favors basin-seed support, subsidence, and lowland permission while suppressing mountain amplification, uplift, pressure, and fracture-heavy tectonic areas.
- Compatibility: it exposes future hooks for lake formation, marsh formation, and wetland-retention logic.
- It does not build lake systems, marsh systems, river routing, inland seas, final elevation, terrain-cell emission, or gameplay semantics.

### Runtime concrete field: `plateauCandidateField`
- `plateauCandidateField` is a deterministic scalar candidate field built by `ReliefElevationGenerator`.
- Sources: `domainWarpedMacroElevationField`, `macroElevationField`, `baseContinentalMassField`, `platePressureField`, `upliftField`, `subsidenceField`, `fractureMaskField`, `ridgeDirectionField`, and `plainLowlandSmoothingField`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`.
- Model: broad weighted candidate synthesis that favors elevated, continental, quiet tectonic surfaces while suppressing subsidence, fracture, ridge ruggedness, and oceanic-mass gaps.
- Compatibility: it exposes future hooks for relief classification, plateau relief typing, and later `ReliefRegionRecord` extraction.
- It does not extract plateau records, apply climate logic, perform final relief-region synthesis, sea-level application, terrain-cell emission, or gameplay semantics.

### Runtime concrete field: `seaLevelAppliedElevationField`
- `seaLevelAppliedElevationField` is a deterministic scalar field built by `ReliefElevationGenerator`.
- Sources: `domainWarpedMacroElevationField`, `mountainAmplificationField`, `basinDepressionField`, `plateauCandidateField`, `baseContinentalMassField`, and `plainLowlandSmoothingField`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`.
- Model: coarse relief synthesis plus deterministic percentile-based sea-level thresholding that remaps only above-water terrain into post-threshold elevation values.
- Compatibility: it exposes future hooks for sea fill, marine flood fill, continent extraction, and downstream land/water masking.
- It does not perform marine carving, sea fill, final coastlines, sea-region extraction, inland-sea correction, terrain-cell emission, or gameplay semantics.

### Runtime concrete field: `landWaterMaskField`
- `landWaterMaskField` is a deterministic `MaskField` / `ConstraintField` built by `ReliefElevationGenerator`.
- Sources: `seaLevelAppliedElevationField`.
- Range: `[0, 1]` with `allowed = 1` for land and `blocked = 0` for water.
- Encoding: `rowMajorFloatArray`.
- Model: binary thresholded primary land/water partition derived directly from post-sea-level elevation values.
- Compatibility: it exposes future hooks for marine carving, sea-region clustering, coastline refinement, and continent extraction.
- It does not perform marine carving details, sea-region extraction, inland-sea synthesis, terrain-cell emission, or gameplay semantics.

### Runtime concrete field: `landmassCleanupMaskField`
- `landmassCleanupMaskField` is a deterministic `MaskField` / `ConstraintField` built by `ReliefElevationGenerator`.
- Sources: `landWaterMaskField`, `seaLevelAppliedElevationField`, `baseContinentalMassField`, `mountainAmplificationField`, and `basinDepressionField`.
- Range: `[0, 1]` with `allowed = 1` for land and `blocked = 0` for water.
- Encoding: `rowMajorFloatArray`.
- Model: small-component cleanup pass that removes tiny isolated land artifacts and fills tiny interior water pockets only when large-form support remains strong.
- Compatibility: it exposes future hooks for continent extraction, marine carving, coastline refinement, and sea-region clustering.
- It does not perform marine carving details, final coastline synthesis, whole-world shape scoring, history-facing analysis, terrain-cell emission, or gameplay semantics.

### Runtime intermediate output: `landmassShapeInterestScores`
- `landmassShapeInterestScores` is a deterministic intermediate analysis output built by `ReliefElevationGenerator`.
- Sources: `landmassCleanupMaskField`, `landWaterMaskField`, `seaLevelAppliedElevationField`, `baseContinentalMassField`, `mountainAmplificationField`, and `basinDepressionField`.
- Selection policy: only major cleaned landmass components above a deterministic cell-count threshold are scored.
- Model: per-landmass shape scoring over area, coastline complexity, compactness/elongation, and relief contrast.
- Compatibility: it exposes future hooks for validation and rebalance layers.
- It does not validate the whole world, does not execute rebalance, does not synthesize strategic regions, and does not add gameplay semantics.

### Runtime intermediate output: `continentBodies`
- `continentBodies` is a deterministic intermediate synthesis output built by `ReliefElevationGenerator`.
- Sources: `landmassCleanupMaskField`, `landWaterMaskField`, `seaLevelAppliedElevationField`, `baseContinentalMassField`, `mountainAmplificationField`, `basinDepressionField`, `plateauCandidateField`, and `plateSeedDistribution`.
- Selection policy: only major connected cleaned landmass components become continent bodies; tiny islands and noise artifacts remain outside this output.
- Model: connected-component body extraction with centroid/bounding-box geometry, coastline metrics, nearest-plate attribution, macro-shape hinting, and `ContinentRecord`-compatible `recordDraft` objects.
- Compatibility: it exposes future hooks for final `ContinentRecord` extraction and marks `reliefRegionIds`, `climateBandIds`, `primaryReliefRegionId`, and `primaryClimateBandId` as pending.
- It does not export final `continents[]`, does not build whole-pipeline continent summaries, does not classify climate, and does not add history or gameplay semantics.

### Runtime physical record output: `reliefRegions`
- `reliefRegions` is a deterministic physical record output built by `ReliefElevationGenerator`.
- Sources: `landmassCleanupMaskField`, `landWaterMaskField`, `seaLevelAppliedElevationField`, `mountainAmplificationField`, `basinDepressionField`, `plateauCandidateField`, `baseContinentalMassField`, `fractureMaskField`, `ridgeDirectionField`, `plainLowlandSmoothingField`, `continentBodies`, and `plateSeedDistribution`.
- Selection policy: only large connected cells classified as `mountain`, `plateau`, `plain`, `basin`, or `coast` become relief-region records.
- Model: field-threshold relief classification followed by connected-component extraction, plate attribution, continent-overlap attribution, and `ReliefRegionRecord` skeleton creation.
- Compatibility: it emits `ReliefRegionRecord`-compatible records and keeps sea-region adjacency / climate interpretation for later dedicated passes.
- It does not classify climate, does not place local biome props, does not build river systems, does not extract sea regions, and does not emit terrain cells or gameplay semantics.

### Runtime debug output: `reliefElevationFieldSnapshots`
- `reliefElevationFieldSnapshots` is a deterministic `fieldSnapshot[]` export built by `ReliefElevationGenerator` through the shared `fieldDebugRegistry`.
- Snapshot layers: `baseContinentalMassField`, `macroElevationField`, `domainWarpedMacroElevationField`, `mountainAmplificationField`, `basinDepressionField`, `plateauCandidateField`, `seaLevelAppliedElevationField`, `landWaterMaskField`, `landmassCleanupMaskField`, and `reliefRegionTypeMaskField`.
- Format: each entry is a renderer-agnostic scalar heatmap artifact using `rowMajorFloatArray` values and standard `fieldSnapshot` root keys.
- Relief type mask encoding: `none = 0`, `mountain = 0.2`, `plateau = 0.4`, `plain = 0.6`, `basin = 0.8`, `coast = 1`.
- This is debug/export data only; it does not create a `PhysicalWorldDebugBundle`, dev panel, renderer, validation score, sea-region snapshot, terrain-cell output, or gameplay dependency.

### Runtime scaffold: `HydrosphereGenerator`
- `HydrosphereGenerator` is the partial Phase 1 consumer scaffold for future ocean, sea-region, and river-basin layers.
- Required elevation dependencies: `seaLevelAppliedElevationField`, `landWaterMaskField`, and `landmassCleanupMaskField`.
- Optional elevation/relief dependencies: `basinDepressionField`, `mountainAmplificationField`, `plateauCandidateField`, `continentBodies`, `reliefRegionExtraction`, and `reliefRegions`.
- `oceanBasinFloodFill` is implemented as the first hydrosphere intermediate output. It flood-fills cardinally connected water cells from the cleaned land/water mask and classifies each component as `open_ocean` if it touches the world edge or `enclosed_water` otherwise.
- `oceanConnectivityMaskField` is implemented as a scalar classification field with stable values: land = `0`, enclosed water = `0.5`, open ocean = `1`.
- `seaRegionClusters` is implemented as the second hydrosphere intermediate output. It maps each connected water basin to a geometry-based sea cluster and emits a `SeaRegionRecord`-compatible `recordDraft` with unresolved climate and navigability fields explicitly listed in `pendingRecordFields`.
- The clustering layer now also derives inland-sea-related flags and basin typing. Large enclosed basins may be promoted to `inland_sea`, while lightly edge-exposed open basins may be tagged as `semi_enclosed_sea`.
- `seaNavigabilityTagging` is implemented as the third hydrosphere intermediate output. It takes `seaRegionClusters` and resolves preliminary `recordDraft.navigability` / `recordDraft.stormPressure`, emits basic `hazardRoughness` tagging, and leaves only climate references in `pendingRecordFields`.
- `coastalShelfDepthField` is implemented as the second hydrosphere scalar field. It approximates shelf-like shallow coastal water from water distance-to-land, sea-level shallowness, basin depression, and deterministic seed nudge.
- `coastalDepthApproximation` is implemented as the fourth hydrosphere intermediate output. It summarizes shelf/depth zones per sea-region cluster and exposes future harbor/landing and marine-invasion composite input metadata without scoring harbors or landing quality.
- `watershedSegmentation` is implemented as the fifth hydrosphere intermediate output. It groups cleaned land cells by nearest terminal water basin, attaches relief overlaps when available, and emits `RiverBasinRecord`-compatible drafts with unresolved climate/mountain/final-record fields listed in `pendingRecordFields`.
- Planned but not implemented fields: `surfaceDrainageTendencyField`.
- Planned but not implemented records: `seaRegions` and `riverBasins`.
- Current runtime output intentionally remains pre-final and does not convert cluster drafts into finalized `seaRegions[]`.
- It does not perform bay/strait carving, fishing scoring, macro-route synthesis, route-graph construction, final major-river extraction, river routing, river deltas, lake/marsh formation, climate logic, terrain-cell emission, UI, or gameplay semantics.

---

### Runtime scaffold: `RiverSystemGenerator`
- `RiverSystemGenerator` is the partial Phase 1 scaffold for river and basin generation.
- Required dependency: `watershedSegmentation` from `HydrosphereGenerator`.
- Required elevation dependencies: `seaLevelAppliedElevationField` and `landmassCleanupMaskField`.
- Optional support dependencies: `basinDepressionField`, `mountainAmplificationField`, `plateauCandidateField`, `oceanBasinFloodFill`, `seaRegionClusters`, `coastalDepthApproximation`, `reliefRegionExtraction`, `reliefRegions`, and future `seaRegions`.
- `downhillFlowRouting` is implemented as the first river-system intermediate output. It stores deterministic row-major downstream cell indices, direction codes, positive drop values, and positive slope values for direct strict-downhill routing over cleaned land cells.
- `flowAccumulationField` is implemented as a normalized `ScalarField` over `downhillFlowRouting`. It stores row-major upstream-contributor accumulation values plus raw contributor counts for future river extraction.
- `deltaLakeMarshTagging` is implemented as a river-system intermediate output. It stores deterministic structural feature tags for delta, lake, and marsh candidates, plus watershed-level downstream summaries for later hydrology/climate consumers.
- `majorRiverCandidates` is implemented as a river-system intermediate output. It extracts macro-scale source-to-mouth mainstem line candidates from accumulation, downhill routing, and watershed data, with `RiverBasinRecord`-compatible id hints.
- `riverBasins` is implemented as a hydrology-stage record output. It materializes `RiverBasinRecord` objects from contract-valid `watershedSegmentation.recordDraft` payloads, preserving flow-accumulation summaries in record-link metadata and deferring incomplete drafts.
- `hydrologyDebugExport` is implemented as a UI-free debug artifact set. It exports scalar snapshots for accumulation, watershed segmentation coverage, and emitted river-basin record coverage through the shared field debug format, with `deltaLakeMarshTagging` and `majorRiverCandidates` summary metadata included in the debug summaries.
- Planned but not implemented fields: `surfaceDrainageTendencyField`.
- Planned but not implemented intermediate outputs: `riverSystemCompositionPlan`, `riverBasinDrafts`, and `riverRoutingGraph`.
- Planned but not implemented debug artifacts: full `riverSystemDebugArtifacts` bundle beyond the hydrology snapshot export.
- Current runtime output intentionally stops at hydrology-stage basin records, macro major-river candidates, structural delta/lake/marsh tags, and UI-free debug export.
- It does not perform climate blend, river-routing graph construction, final river-delta systems, lake hydrology simulation, marsh biome construction, full package assembly, local river placement, settlement logic, terrain-cell emission, UI, or gameplay semantics.

---

## 2. MarineInvasionField

### Смысл
Показывает, где море может глубоко врезаться в сушу и раздробить её.

### Подметрики
- `incisionDepth`
- `coastalBreakup`
- `bayFormation`
- `straitLikelihood`
- `islandFragmentation`

### Использование
Из него рождаются:
- заливы
- проливы
- внутренние моря
- архипелажные коридоры
- ломанные побережья

### Runtime scaffold: `MarineCarvingGenerator`
- `MarineCarvingGenerator` is the partial Phase 1 consumer scaffold for deterministic coastal carving after `HydrosphereGenerator`.
- Required field dependencies: `landmassCleanupMaskField` and `oceanConnectivityMaskField`.
- Optional support fields: `seaLevelAppliedElevationField`, `basinDepressionField`, `fractureMaskField`, `platePressureField`, and `coastalShelfDepthField`.
- `marineInvasionField` is implemented as the first concrete marine-invasion scalar composite over hydrosphere and marine-carving outputs.
- Sources: `oceanBasinFloodFill`, `oceanConnectivityMaskField`, `coastalShelfDepthField`, `coastalDepthApproximation`, `bayCarvedLandWaterMaskField`, `straitCarvedLandWaterMaskField`, `islandChainFragmentedLandWaterMaskField`, `coastJaggednessControlledLandWaterMaskField`, and the matching carving summaries.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`.
- Model: weighted deterministic composite of basin water exposure, shelf-like coastal depth, newly carved water, bay cells, strait passages, island-chain break/run cells, and coast-jaggedness carve cells.
- Compatibility: it exposes future hooks for coastal opportunity, chokepoint analysis, archipelago morphology, hydrosphere analyzers, and sea-region rebuilds.
- It does not perform climate integration, final package assembly, final sea-region export, macro-route construction, harbor/fishing scoring, terrain-cell emission, or gameplay semantics.
- `bayCarvedLandWaterMaskField` is implemented as the first marine-carving concrete field.
- `bayCarvingSummary` is implemented as the first marine-carving intermediate summary output.
- `straitCarvedLandWaterMaskField` is implemented as the second marine-carving concrete field.
- `straitCarvingSummary` is implemented as the second marine-carving intermediate summary output and the first explicit bridge into future chokepoint analysis.
- `islandChainFragmentedLandWaterMaskField` is implemented as the third marine-carving concrete field.
- `archipelagoFragmentationSummary` is implemented as the third marine-carving intermediate summary output and the first explicit bridge into future archipelago morphology logic.
- `coastJaggednessControlledLandWaterMaskField` is implemented as the fourth marine-carving concrete field.
- `coastJaggednessControlSummary` is implemented as the fourth marine-carving intermediate summary output and the first explicit bridge into future coastline-validation / harbor-landing preparation logic.
- Planned but not implemented outputs remain inland-sea reconstruction, finalized island-chain records, archipelago significance, coastal-opportunity scoring, climate integration, and final package assembly.
- Current runtime output intentionally does not rebuild sea regions, does not build finalized island chains, does not compute archipelago significance or chokepoint control metrics, does not score harbors, and does not add terrain/gameplay semantics.

### Runtime concrete field: `bayCarvedLandWaterMaskField`
- `bayCarvedLandWaterMaskField` is a deterministic `MaskField` / `ConstraintField` built by `MarineCarvingGenerator`.
- Sources: `landmassCleanupMaskField`, `oceanConnectivityMaskField`, and optional `seaLevelAppliedElevationField` / `basinDepressionField`.
- Range: `[0, 1]` with `allowed = 1` for land and `blocked = 0` for water.
- Encoding: `rowMajorFloatArray`.
- Model: bounded coastal bay-notching over cleaned land/water output, biased toward coherent coastal water arcs and low-relief coastal cells.
- Strait safety: opposite-side water exposure is explicitly rejected at the candidate stage, so this pass does not double as strait carving.
- Compatibility: it exposes future hooks for strait carving, sea-region rebuilds, and coastal-opportunity analysis.
- It does not perform strait carving, inland-sea synthesis, route analysis, harbor scoring, river deltas, terrain-cell emission, or gameplay semantics.

### Runtime concrete field: `straitCarvedLandWaterMaskField`
- `straitCarvedLandWaterMaskField` is a deterministic `MaskField` / `ConstraintField` built by `MarineCarvingGenerator` on top of `bayCarvedLandWaterMaskField`.
- Sources: `bayCarvedLandWaterMaskField`, `oceanBasinFloodFill`, and optional `fractureMaskField`, `platePressureField`, `seaLevelAppliedElevationField`, `basinDepressionField`.
- Range: `[0, 1]` with `allowed = 1` for land and `blocked = 0` for water.
- Encoding: `rowMajorFloatArray`.
- Model: thin-corridor strait cutting that only opens one-cell marine passages where opposite water sides resolve to distinct basins and the local physical weakness score is sufficient.
- Compatibility: it exposes future hooks for sea-region rebuilds and chokepoint analysis.
- It does not build island chains, does not emit `ChokepointRecord`, does not compute control metrics, and does not add gameplay semantics.

### Runtime concrete field: `islandChainFragmentedLandWaterMaskField`
- `islandChainFragmentedLandWaterMaskField` is a deterministic `MaskField` / `ConstraintField` built by `MarineCarvingGenerator` on top of `straitCarvedLandWaterMaskField`.
- Sources: `straitCarvedLandWaterMaskField`, `oceanConnectivityMaskField`, `oceanBasinFloodFill`, and optional `fractureMaskField`, `platePressureField`, `seaLevelAppliedElevationField`, `basinDepressionField`.
- Range: `[0, 1]` with `allowed = 1` for land and `blocked = 0` for water.
- Encoding: `rowMajorFloatArray`.
- Model: narrow land-bar fragmentation that opens deterministic break cells along selected coastal runs, leaving segmented island-chain morphology for future archipelago interpretation.
- Basin safety: if opposite flanks resolve to distinct water basins, the candidate is rejected here so this pass does not overlap the explicit strait-carving step.
- Compatibility: it exposes future hooks for archipelago morphology analysis and sea-region rebuilds.
- It does not compute archipelago significance, does not emit `ArchipelagoRegionRecord`, does not compute choke metrics, and does not add gameplay semantics.

### Runtime concrete field: `coastJaggednessControlledLandWaterMaskField`
- `coastJaggednessControlledLandWaterMaskField` is a deterministic `MaskField` / `ConstraintField` built by `MarineCarvingGenerator` on top of `islandChainFragmentedLandWaterMaskField`.
- Sources: `islandChainFragmentedLandWaterMaskField`, `oceanConnectivityMaskField`, and optional `fractureMaskField`, `platePressureField`, `seaLevelAppliedElevationField`, `basinDepressionField`.
- Range: `[0, 1]` with `allowed = 1` for land and `blocked = 0` for water.
- Encoding: `rowMajorFloatArray`.
- Model: bounded coast-shape control that either carves a few extra coastal notches or fills sheltered coastal pockets so the resulting shoreline moves toward a seed-driven target jaggedness.
- Control channel: target jaggedness is derived from seed plus normalized `phase1Constraints.coastJaggedness`, which keeps the pass validation-controllable without turning it into UI/options logic.
- Compatibility: it exposes future hooks for coastal-opportunity, harbor/landing, sea-region rebuild, and validation/rebalance consumers.
- It does not compute climate effects, does not implement local tile coast logic, does not score fishing/harbors, and does not add gameplay semantics.

---

## 3. ContinentalCohesionField

### Смысл
Оценивает физическую связность континентального блока без политической интерпретации.

### Подметрики
- `interiorPassability`
- `basinConnectivity`
- `ridgeBarrier`
- `regionalSegmentation`
- `corePotential`
- `fracturedPeriphery`
- `stateScalePotential`

### Runtime concrete field: `continentalCohesionField`
- `continentalCohesionField` is the fifth implemented Continental Cohesion Analyzer scalar field.
- Sources: `interiorPassabilityField`, `regionalSegmentMaskField`, `corePotentialField`, `fracturedPeripheryField`, and their matching analyzer summaries.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`, plus `analyzedMaskValues`.
- Model: coarse physical synthesis where stronger passability, stronger core-potential support, stable segment structure, and lower fractured-periphery pressure increase cohesion while barrier-separated disruption lowers it.
- Output summary: `continentalCohesionSummaries.continentSummaries[]` reports concise continent-level cohesion rows with mean cohesion, cohesion class, segment coverage, leading core/periphery ids, and peripheral pressure context.
- Compatibility: it prepares later analyzer-facing continent summaries and downstream strategic synthesis while remaining physical-only.
- It does not mutate `ContinentRecord`, does not synthesize strategic regions, does not build route graphs, does not run local traversal runtime, and does not add history/gameplay semantics.

### Runtime concrete field: `interiorPassabilityField`
- `interiorPassabilityField` is the first implemented Continental Cohesion Analyzer scalar field.
- Sources: `continentBodies`, `reliefRegionExtraction` / optional `reliefRegions`, `climateStressField`, optional `climateStressRegionalSummaries`, optional `watershedSegmentation`, optional `flowAccumulationField`, optional `majorRiverCandidates`, and optional `deltaLakeMarshTagging`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`, plus `analyzedMaskValues` for continent-body cells.
- Model: coarse relief/climate/hydrology composite where plains/coasts/basins tend to increase passability, mountains/plateaus/ruggedness and climate stress reduce it, and hydrology corridor hints add bounded support.
- Output summary: `interiorPassabilityAnalysis.continentSummaries[]` reports mean passability, passability class, low/high passability ratios, climate stress, ruggedness penalty, hydrology support, river-corridor ratio, water-fringe ratio, and relief type mix by continent body.
- Compatibility: it prepares later basin-connectivity, ridge-barrier, segmentation, and core-potential consumers.
- It does not build route graphs, does not run local traversal runtime, does not extract cores/peripheries, does not mutate `ContinentRecord`, and does not add history/gameplay semantics.

### Runtime concrete field: `regionalSegmentMaskField`
- `regionalSegmentMaskField` is the second implemented Continental Cohesion Analyzer scalar field.
- Sources: `interiorPassabilityField`, `continentBodies`, `reliefRegionExtraction` / optional `reliefRegions`, and optional `climateStressField`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`, plus `analyzedMaskValues` and `barrierMaskValues`.
- Model: coarse continent-internal connected-component segmentation over passable cells, where very low-passability cells and rugged mountain/plateau cells act as barrier separators.
- Output summary: `regionalSegmentationAnalysis.regionalSegments[]` reports segment geometry, mean interior passability, climate stress, barrier contact, exterior exposure, dominant relief type, and barrier-separated neighboring segment ids; `regionalSegmentationAnalysis.continentSummaries[]` reports per-continent segment counts and segmented coverage.
- Compatibility: it prepares later core-potential and periphery-analysis consumers while remaining physical-only.
- It does not compute core potential, does not classify fractured peripheries, does not build route graphs, does not run local traversal runtime, does not mutate `ContinentRecord`, and does not add history/gameplay semantics.

### Runtime concrete field: `corePotentialField`
- `corePotentialField` is the third implemented Continental Cohesion Analyzer scalar field.
- Sources: `regionalSegmentMaskField`, `regionalSegmentationAnalysis`, `continentBodies` coastal context, and optional `regionalClimateSummaries` / `climateStressRegionalSummaries`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`, plus `analyzedMaskValues`.
- Model: coarse physical segment scoring where larger, better-connected, more passable, lower-stress segments with usable coastal access context receive higher core-potential values.
- Output summary: `corePotentialAnalysis.segmentPotentials[]` reports per-segment support factors and final `corePotentialScore`; `corePotentialAnalysis.continentSummaries[]` reports leading segment ids and coarse per-continent core-potential spread.
- Compatibility: it prepares later state-scale-potential and periphery-analysis consumers while remaining physical-only.
- It does not detect actual continent cores, does not classify fractured peripheries, does not build route graphs, does not run local traversal runtime, does not mutate `ContinentRecord`, and does not add history/gameplay semantics.

### Runtime concrete field: `fracturedPeripheryField`
- `fracturedPeripheryField` is the fourth implemented Continental Cohesion Analyzer scalar field.
- Sources: `regionalSegmentMaskField`, `corePotentialField`, `corePotentialAnalysis`, optional `climateStressRegionalSummaries`, and optional hydrology burden context from `flowAccumulationField`, `majorRiverCandidates`, `deltaLakeMarshTagging`, and `watershedSegmentation`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`, plus `analyzedMaskValues`.
- Model: coarse physical periphery scoring where more edge-exposed, more weakly connected, lower-core-potential, higher-stress, and hydrologically burdened outer segments receive stronger fractured-periphery values.
- Output summary: `fracturedPeripheryAnalysis.segmentPeripheries[]` reports per-segment exposure, connectivity fragility, climate burden, hydrology burden, and final `fracturedPeripheryScore`; `fracturedPeripheryAnalysis.continentSummaries[]` reports leading peripheral segment ids plus weakly connected and fractured segment coverage per continent.
- Compatibility: it prepares later strategic synthesis and downstream isolation/periphery interpretation while remaining physical-only.
- It does not synthesize strategic regions, does not build route graphs, does not run local traversal runtime, does not mutate `ContinentRecord`, and does not add history/gameplay semantics.

### Использование
Нужен для будущих фаз:
- basin connectivity
- ridge barrier analysis
- regional segmentation
- core potential analysis
- fractured-periphery analysis
- unified continent cohesion summaries
- state scale potential scoring

---

## 4. ClimateStressField

### Runtime scaffold: `ClimateEnvelopeGenerator`
- `ClimateEnvelopeGenerator` is the partial Phase 1 implementation for climate envelope and coarse natural-class generation.
- Required dependency fields: `seaLevelAppliedElevationField`, `landmassCleanupMaskField`, and `oceanConnectivityMaskField`.
- Optional geography/hydrosphere context: `mountainAmplificationField`, `basinDepressionField`, `coastalShelfDepthField`, `marineInvasionField`, `continentBodies`, `seaRegionClusters`, `coastalDepthApproximation`, `watershedSegmentation`, `majorRiverCandidates`, `reliefRegions`, `riverBasins`, and future `seaRegions`.
- Implemented fields: `latitudeBandBaselineField`, encoded as row-major scalar thermal baseline values with per-row latitude-band metadata; `prevailingWindField`, encoded as row-major unit-vector `xValues` / `yValues` plus coarse `magnitudeValues`; `humidityTransportField`, encoded as row-major scalar upwind moisture transport; `temperatureColdLoadField`, encoded as row-major scalar warmth values plus `coldLoadValues` for coarse cold burden; `stormCorridorField`, encoded as row-major scalar storm pressure plus corridor-support channels; `coastalDecayBurdenField`, encoded as row-major scalar coastal pressure plus coastal-exposure channels; `seasonalityField`, encoded as row-major scalar seasonal variability plus predictability/continentality/volatility channels and embedded regional summary buckets; `climateStressField`, encoded as row-major scalar physical stress plus dry/cold/heat/storm/coastal/seasonal stress channels; and `wetnessField`, encoded as row-major scalar baseline wetness after rain-shadow adjustment but before biome work.
- Implemented intermediate outputs: `rainShadowEffect`, encoded as row-major drying intensity plus barrier, orographic boost, and adjusted wetness arrays; `climateZoneClassification`, encoded as row-major classification indices plus classification legend and zone summaries; `regionalClimateSummaries`, encoded as UI-free summary tables by relief region, continent body, and sea-region cluster; `climateStressRegionalSummaries`, encoded as UI-free stress rollups by relief region, continent body, and adjacent sea-region cluster.
- Planned but not implemented fields: none in the current climate-stress dependency surface.
- Implemented records: `climateBands`.
- Current runtime output emits contracts, dependency availability, seed hooks, planned stages, `outputs.fields.latitudeBandBaselineField`, `outputs.fields.prevailingWindField`, `outputs.fields.humidityTransportField`, `outputs.fields.temperatureColdLoadField`, `outputs.fields.stormCorridorField`, `outputs.fields.coastalDecayBurdenField`, `outputs.fields.seasonalityField`, `outputs.fields.climateStressField`, `outputs.intermediateOutputs.climateZoneClassification`, `outputs.intermediateOutputs.regionalClimateSummaries`, `outputs.intermediateOutputs.climateStressRegionalSummaries`, `outputs.intermediateOutputs.rainShadowEffect`, `outputs.records.climateBands`, and `outputs.fields.wetnessField`.
- The temperature/wetness/storm/coastal baseline now includes coarse cold-load, storm corridors, coastal decay burden, seasonality scoring with embedded regional summary, climate-zone classification, `ClimateBandRecord`-compatible output, region/continent/sea climate summaries, and rain-shadow-adjusted moisture for later biome, route-risk, and pressure/history layers, but it does not simulate yearly time, does not build biome envelopes, and does not create gameplay weather systems or a Phase 2 pressure package.

### Смысл
Это не картинка погоды, а историческое давление среды.

### Подметрики
- `stormPressure`
- `wetDecay`
- `coldDrag`
- `harvestRisk`
- `maritimeSeasonality`

### Использование
Влияет на:
- долговечность портов
- надёжность морских путей
- устойчивость колоний
- collapse vulnerability

---

## 5. CoastalOpportunityField

### Runtime concrete field: `harborQualityField`
- `harborQualityField` is the first implemented concrete coastal-opportunity scalar field built by `CoastalOpportunityAnalyzer`.
- Sources: `seaRegionClusters`, `coastalShelfDepthField`, optional `coastalDepthApproximation`, optional `seaNavigabilityTagging`, `coastalDecayBurdenField`, and optional `stormCorridorField`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`.
- Model: deterministic coarse harbor-support synthesis where sheltered sea-cluster type, enclosure, low edge exposure, shelf-like shallow-water support, calmer storm exposure, and lower coastal-decay burden raise the score.
- Coverage: the field paints only shelf-supporting coastal water cells; deep offshore water, inland land cells, and unanalyzed cells remain `0`.
- Compatibility: it remains a standalone coastal sub-score while also feeding the implemented `coastalOpportunityMap` composite alongside later `landingEase`, fishing, shore-defense, and inland-link layering.
- It does not create ports, settlements, route graphs, macro routes, strategic regions, terrain cells, or gameplay semantics.

### Runtime intermediate output: `harborQualityAnalysis`
- `harborQualityAnalysis` is a deterministic analyzer-local summary output built alongside `harborQualityField`.
- Sources: `harborQualityField`, `seaRegionClusters`, optional `seaNavigabilityTagging`, optional `coastalDepthApproximation`, `coastalShelfDepthField`, `coastalDecayBurdenField`, and optional `stormCorridorField`.
- Model: per-sea-cluster coarse harbor scoring with analyzer-local summaries such as shelter support, approach support, climate stability, and final `harborQualityScore`.
- Compatibility: it exposes later rollup hooks for coastal summaries without mutating `SeaRegionRecord` or `MacroGeographyPackage`.
- It does not classify landing, fishing, defense, inland-link, route logic, or strategic synthesis.

### Runtime concrete field: `landingEaseField`
- `landingEaseField` is the second implemented concrete coastal-opportunity scalar field built by `CoastalOpportunityAnalyzer`.
- Sources: `seaRegionClusters`, `coastalShelfDepthField`, optional `coastalDepthApproximation`, and optional `seaNavigabilityTagging`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`.
- Model: deterministic coarse landing-support synthesis where shelf/depth access, shallow/coastal-slope approach support, coastal openness, and manageable hydrosphere approach conditions raise the score.
- Coverage: the field paints only shelf-supporting coastal water cells; deep offshore water, inland land cells, and unanalyzed cells remain `0`.
- Compatibility: it is kept separate from `harborQualityField` while also feeding the implemented `coastalOpportunityMap` composite alongside later fishing, shore-defense, and inland-link layering.
- It does not create ports, settlements, route graphs, macro routes, strategic regions, terrain cells, or gameplay semantics.

### Runtime intermediate output: `landingEaseAnalysis`
- `landingEaseAnalysis` is a deterministic analyzer-local summary output built alongside `landingEaseField`.
- Sources: `landingEaseField`, `seaRegionClusters`, optional `seaNavigabilityTagging`, optional `coastalDepthApproximation`, and `coastalShelfDepthField`.
- Model: per-sea-cluster coarse landing scoring with analyzer-local summaries such as approach-depth support, exposure-window support, maneuver support, and final `landingEaseScore`.
- Compatibility: it stays separate from `harborQualityAnalysis` and exposes later rollup hooks for coastal summaries without mutating `SeaRegionRecord` or `MacroGeographyPackage`.
- It does not classify fishing, defense, inland-link, route logic, or strategic synthesis.

### Runtime concrete field: `fishingPotentialField`
- `fishingPotentialField` is the third implemented concrete coastal-opportunity scalar field built by `CoastalOpportunityAnalyzer`.
- Sources: `seaRegionClusters`, `coastalShelfDepthField`, optional `coastalDepthApproximation`, optional `seaNavigabilityTagging`, and optional `regionalClimateSummaries.seaSummaries`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`.
- Model: deterministic coarse fishing-support synthesis where shelf habitat support, manageable water conditions, coastal-contact nutrient proxies, and moderate sea-climate productivity raise the score.
- Coverage: the field paints only shelf-supporting coastal water cells; deep offshore water, inland land cells, and unanalyzed cells remain `0`.
- Compatibility: it is kept separate from `harborQualityField` and `landingEaseField` while also feeding the implemented `coastalOpportunityMap` composite alongside later shore-defense and inland-link layering.
- It does not create fishing economies, ports, settlements, route graphs, macro routes, strategic regions, terrain cells, or gameplay semantics.

### Runtime intermediate output: `fishingPotentialAnalysis`
- `fishingPotentialAnalysis` is a deterministic analyzer-local summary output built alongside `fishingPotentialField`.
- Sources: `fishingPotentialField`, `seaRegionClusters`, optional `seaNavigabilityTagging`, optional `coastalDepthApproximation`, `coastalShelfDepthField`, and optional `regionalClimateSummaries`.
- Model: per-sea-cluster coarse fishing scoring with analyzer-local summaries such as shelf-biology support, water-condition support, climate-productivity support, coastal-nutrient support, and final `fishingPotentialScore`.
- Compatibility: it stays separate from `harborQualityAnalysis` and `landingEaseAnalysis` and exposes later rollup hooks for coastal summaries without mutating `SeaRegionRecord` or `MacroGeographyPackage`.
- It does not classify shore defense, inland-link, route logic, strategic synthesis, or gameplay resource economy.

### Runtime concrete field: `shoreDefenseField`
- `shoreDefenseField` is the fourth implemented concrete coastal-opportunity scalar field built by `CoastalOpportunityAnalyzer`.
- Sources: `seaRegionClusters`, `coastalShelfDepthField`, optional `coastalDepthApproximation`, optional `seaNavigabilityTagging`, `coastalDecayBurdenField`, and optional `stormCorridorField`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`.
- Model: deterministic coarse natural-defensibility synthesis where enclosed coastal geometry, harder approach conditions, and lower shoreline exposure/decay raise the score.
- Coverage: the field paints only shelf-supporting coastal water cells; deep offshore water, inland land cells, and unanalyzed cells remain `0`.
- Compatibility: it is kept separate from `harborQualityField`, `landingEaseField`, and `fishingPotentialField` while also feeding the implemented `coastalOpportunityMap` composite alongside later inland-link layering.
- It does not create military logic, ports, settlements, route graphs, macro routes, strategic regions, terrain cells, or gameplay semantics.

### Runtime intermediate output: `shoreDefenseAnalysis`
- `shoreDefenseAnalysis` is a deterministic analyzer-local summary output built alongside `shoreDefenseField`.
- Sources: `shoreDefenseField`, `seaRegionClusters`, optional `seaNavigabilityTagging`, optional `coastalDepthApproximation`, `coastalShelfDepthField`, `coastalDecayBurdenField`, and optional `stormCorridorField`.
- Model: per-sea-cluster coarse natural-defense scoring with analyzer-local summaries such as containment support, approach friction support, shoreline persistence support, and final `shoreDefenseScore`.
- Compatibility: it stays separate from `harborQualityAnalysis`, `landingEaseAnalysis`, and `fishingPotentialAnalysis` and exposes later rollup hooks for coastal summaries without mutating `SeaRegionRecord` or `MacroGeographyPackage`.
- It does not add military interpretation, inland-link logic, route logic, strategic synthesis, or gameplay semantics.

### Runtime concrete field: `inlandLinkField`
- `inlandLinkField` is the fifth implemented concrete coastal-opportunity scalar field built by `CoastalOpportunityAnalyzer`.
- Sources: `seaRegionClusters`, `coastalShelfDepthField`, optional `watershedSegmentation`, optional `majorRiverCandidates`, optional `flowAccumulationField`, optional `continentBodies`, and optional `continentalCohesionSummaries`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`.
- Model: deterministic coarse coast-to-interior connectivity synthesis where linked river mouths, larger watershed reach, and higher continent-scale interior cohesion raise the bonus.
- Coverage: the field paints only shelf-supporting coastal water cells; deep offshore water, inland land cells, and unanalyzed cells remain `0`.
- Compatibility: it is kept separate from `harborQualityField`, `landingEaseField`, `fishingPotentialField`, and `shoreDefenseField` while also feeding the implemented `coastalOpportunityMap` composite.
- It does not create route graphs, transport corridors, settlements, package assembly, or gameplay semantics.

### Runtime intermediate output: `inlandLinkAnalysis`
- `inlandLinkAnalysis` is a deterministic analyzer-local summary output built alongside `inlandLinkField`.
- Sources: `inlandLinkField`, `seaRegionClusters`, optional `watershedSegmentation`, optional `majorRiverCandidates`, optional `flowAccumulationField`, optional `continentBodies`, and optional `continentalCohesionSummaries`.
- Model: per-sea-cluster coarse inland-link scoring with analyzer-local summaries such as river-mouth support, watershed-reach support, interior-cohesion support, coastal-node proxy support, and final `inlandLinkBonusScore`.
- Compatibility: it stays separate from the other coastal-opportunity analyses and does not mutate `SeaRegionRecord`, `ContinentRecord`, or `MacroGeographyPackage`.
- It currently uses a shelf-and-river-mouth proxy because a dedicated `coastalNodeCandidates` output is not yet materialized.

### Runtime composite field: `coastalOpportunityMap`
- `coastalOpportunityMap` is the first implemented unified coastal-opportunity composite field built by `CoastalOpportunityAnalyzer`.
- Sources: `harborQualityField`, `landingEaseField`, `fishingPotentialField`, `shoreDefenseField`, `inlandLinkField`, their paired analyzer summaries, and `seaRegionClusters`.
- Range: `[0, 1]`.
- Encoding: `rowMajorFloatArray`.
- Model: deterministic weighted composite synthesis where harbor quality, landing ease, fishing potential, shore defense, and inland-link bonus are combined into one analyzer-local coastal-opportunity scalar.
- Coverage: the field paints only analyzed shelf-supporting coastal water cells; deep offshore water, inland land cells, and unanalyzed cells remain `0`.
- Compatibility: it stays pre-route and pre-strategy; it is a downstream input layer for later route/strategic analyzers, not a connectivity graph.

### Runtime intermediate output: `coastalOpportunityProfile`
- `coastalOpportunityProfile` is a deterministic analyzer-local profile output built alongside `coastalOpportunityMap`.
- Sources: `coastalOpportunityMap`, all five coastal sub-score analyses, and `seaRegionClusters`.
- Model: per-sea-cluster rollup with unified `coastalOpportunityScore`, dominant driver ids, anchor cells, and exceptionality scoring.
- Compatibility: it stays analyzer-local and does not mutate `SeaRegionRecord`, `ContinentRecord`, or `MacroGeographyPackage`.

### Runtime intermediate output: `exceptionalCoastalNodes`
- `exceptionalCoastalNodes` is a deterministic analyzer-local shortlist of standout coastal-node candidates built from `coastalOpportunityProfile`.
- Sources: `coastalOpportunityProfile`, `coastalOpportunityMap`, and the already materialized coastal sub-scores.
- Model: threshold-first exceptional-node extraction with anchor cell selection and fallback-to-best-available behavior when no cluster clears the primary threshold.
- Compatibility: it prepares inputs for downstream route/strategic layers without building a connectivity graph in this microstep.

---

## 6. IsolationField

### Смысл
Показывает не просто расстояние, а трудность удержания и снабжения региона.

### Подметрики
- `distanceFromCore`
- `resupplyCost`
- `weatherAdjustedIsolation`
- `culturalDriftPotential`
- `autonomousSurvivalScore`
- `lossInCollapseLikelihood`

### Использование
Нужен для:
- будущих периферий
- автономных зон
- поздних осколков мира

### Runtime notes
- Current runtime also extracts `isolatedZones` and `peripheryClusters` from the node-level isolation surface.
- Route fragility and official chokepoint metrics now feed drift/autonomy/collapse scoring, but a standalone `chokepointDependence` field is still not emitted in this microstep.

---

## 7. StrategicFrictionField

### Смысл
Показывает, где интересы держав будут неизбежно сталкиваться.

### Подметрики
- `overlapOfRouteInterests`
- `controlDifficulty`
- `multiAccessPressure`
- `prestigeValue`
- `contestProbability`

### Использование
Будет фундаментом для:
- choke wars
- coalition logic
- contested archipelagos
- imperial frontiers

---

## Field constraints

### Общие правила
1. Все поля должны быть seed-stable.
2. Все поля должны экспортироваться в debug snapshots.
3. Ни одно поле не должно иметь смысл только в рамках одного модуля.
4. Все поля обязаны иметь нормализованный диапазон 0..1 либо чётко описанный signed range.
5. Комбинация полей должна быть прозрачной и документированной.

---

## Требования к Codex
Codex при реализации не должен:
- вводить поля без записи в contracts;
- использовать ad-hoc random modifiers без имени и схемы;
- склеивать field generation и final region synthesis в один модуль.

---

## 8. Phase 1 seed constraints

До генерации world-scale fields Phase 1 принимает небольшой набор normalized seed constraints:
- `conflictPressure`
- `maritimeDependence`
- `environmentalVolatility`
- `coastJaggedness`
- `collapseIntensity`

Для этого intake-слоя действуют правила:
1. canonical range is `[0.0 .. 1.0]`;
2. default neutral value is `0.5`;
3. normalization mode is `clamp`;
4. constraints belong to the shared Physical + Macro input layer, not to UI/options;
5. descriptive labels such as `worldTone` and `DerivedWorldTendencies` are not part of numeric bounds.
