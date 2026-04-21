# MACRO GEOGRAPHY GENERATOR — PIPELINE

## Общая структура
Фаза должна быть разбита на подгенераторы, чтобы Codex не смешивал понятия и не строил всё внутри одного файла.

---

## Pipeline

### 1. Master Constraints Intake
Получает глобальные параметры мира:
- maritimeDependence
- conflictPressure
- environmentalVolatility
- collapseIntensity
- worldTone
- likelyWorldPattern
- likelyConflictMode
- likelyCollapseMode
- likelyReligiousPattern
- likelyArchipelagoRole

Эти descriptive tendencies должны приходить только из официального Phase 0 handoff:
- `DerivedWorldTendencies`
- либо `phase1Input.derivedWorldTendencies` внутри frozen `Phase 1-safe summary bundle`

### 2. Tectonic Skeleton Generator
Строит:
- массивы суши
- линии разломов
- зоны подъёма и провалов
- дуги и хребты

Runtime scaffold note:
- `TectonicSkeletonGenerator` exposes a partial pipeline contract before real field generation exists.
- Required input: `macroSeed`; optional inputs: `macroSeedProfile`, `phase1Constraints`, `worldBounds`, `plateSeedOptions`, `debugOptions`.
- Seed hooks are namespaced under `macro.tectonicSkeleton` with planned child scopes for plate seed distribution, plate motion vectors, uplift, subsidence, fractures, ridges, basin seeds, arc formation, hotspot volcanic seeds, plate pressure composite, and basin tendency.
- `plateSeedDistribution` is the first implemented micro-output: it deterministically creates plate ids and `seedPoint` anchors for `PlateRecord` consumers.
- `plateMotionVectors` is the second implemented micro-output: it deterministically creates per-plate `unitVector`, `magnitude`, and `motionVector` data for future boundary analysis.
- `plateBoundaryClassification` is the third implemented micro-output: it deterministically classifies nearest-seed plate boundaries as `collision`, `divergence`, or `transform` and exposes future uplift/subsidence/volcanic signal slots.
- `upliftField` is the fourth implemented micro-output: it deterministically materializes a `[0, 1]` scalar field from `plateBoundaryClassification.futureSignals.upliftPotential` using a boundary-distance falloff model.
- `subsidenceField` is the fifth implemented micro-output: it deterministically materializes a `[0, 1]` scalar field from `plateBoundaryClassification.futureSignals.subsidencePotential` and carries compatibility metadata for future uplift/elevation composition.
- `fractureMaskField` is the sixth implemented micro-output: it deterministically materializes a `[0, 1]` scalar fracture mask from boundary shear/stress scoring and carries compatibility metadata for `upliftField` / `subsidenceField`.
- `ridgeDirectionField` is the seventh implemented micro-output: it deterministically materializes ridge-line candidates and a directional field from boundary classification plus uplift/subsidence/fracture context for later mountain amplification.
- `basinSeeds` is the eighth implemented micro-output: it deterministically materializes basin seed points/areas from tectonic subsidence context for later basin tendency and river-basin extraction.
- `arcFormationHelper` is the ninth implemented micro-output: it deterministically materializes curved arc guides from tectonic boundary volcanic hints plus uplift/subsidence/fracture/ridge context for later volcanic-arc extraction.
- `hotspotVolcanicSeedHelper` is the tenth implemented micro-output: it deterministically materializes hotspot-like volcanic seed points plus trail geometry from plate motion and tectonic field context for later hotspot volcanic-zone extraction.
- `platePressureField` is the eleventh implemented micro-output: it deterministically materializes a composite scalar field from uplift/subsidence/fracture/ridge/basin/arc inputs for later tectonic interpretation and land-tendency-adjacent passes.
- `mountainBeltCandidates` is the twelfth implemented micro-output: it deterministically clusters ridge/pressure/arc tectonic signals into `MountainSystemRecord`-ready drafts while intentionally leaving `reliefRegionIds` unresolved for a later physical-relief pass.
- `plainLowlandSmoothingField` is the thirteenth implemented micro-output: it deterministically smooths broad plain/lowland candidates from quiet tectonic, subsidence, basin-seed, pressure, and mountain-belt context while preserving compatibility with later basin and plateau logic.
- `tectonicFieldSnapshots` export is implemented as a UI-free `fieldSnapshot[]` set built through the shared `fieldDebugRegistry` for uplift/subsidence/fracture/ridge/platePressure plus derived basin/arc/hotspot influence views.
- Final landmass synthesis, marine flood fill, basin depression, plateau extraction, basin extraction, full elevation composition, relief construction, fertility scoring, records beyond neutral `plates[]`, end-to-end debug bundles, and phase orchestration must remain `TODO_CONTRACTED` until their own microsteps.

### 3. Relief Elevation Generator
Собирает будущий рельефный слой:
- mountain amplification
- basin depression
- plateau candidates
- macro elevation composite
- relief region drafts

Runtime scaffold note:
- `ReliefElevationGenerator` is a partial pipeline scaffold.
- Required input: `macroSeed`; optional inputs: `macroSeedProfile`, `phase1Constraints`, `worldBounds`, `tectonicSkeleton`, `fields`, `intermediateOutputs`, `debugOptions`.
- Field dependencies are explicitly declared as `upliftField`, `subsidenceField`, `fractureMaskField`, `ridgeDirectionField`, `platePressureField`, and `plainLowlandSmoothingField`.
- Intermediate dependencies are explicitly declared as `basinSeeds`, `mountainBeltCandidates`, and optional volcanic/arc context from `arcFormationHelper` / `hotspotVolcanicSeedHelper`.
- Seed hooks are namespaced under `macro.reliefElevation` with planned child scopes for dependency intake, mountain amplification, basin depression, macro elevation composite, domain warping, plateau candidates, sea level application, land/water split, and relief-region drafts.
- `baseContinentalMassField` is the first implemented micro-output: it deterministically materializes a coarse `[0, 1]` scalar field for continental mass tendency over tectonic composite context.
- The field is continuous and non-binary; it is not a coastline threshold, not a land/water mask, and not continent extraction.
- `macroElevationField` is the second implemented micro-output: it deterministically materializes a large-scale normalized elevation composite from `baseContinentalMassField` plus tectonic field context.
- `macroElevationField` is still not final elevation: it is the pre-warp macro elevation composite and does not apply sea level, coastline thresholding, marine flood fill, or terrain/gameplay semantics.
- `domainWarpedMacroElevationField` is the third implemented micro-output: it deterministically applies a large-scale domain-warping/distortion pass over `macroElevationField`, using coarse seed noise plus ridge/fracture/pressure context.
- The distortion pass bends broad land and ridge forms only; it does not run cleanup, sea level, coastline thresholding, `ReliefRegionRecord` extraction, or terrain/gameplay semantics.
- `mountainAmplificationField` is the fourth implemented relief/elevation micro-output: it deterministically amplifies mountain-shaped elevation zones from `ridgeDirectionField`, `mountainBeltCandidates`, tectonic pressure/uplift context, and already materialized macro relief fields.
- `mountainAmplificationField` is amplification input only; it does not build `MountainSystemRecord`, rain-shadow, hydrology, or final elevation.
- `basinDepressionField` is the fifth implemented relief/elevation micro-output: it deterministically deepens basin-permissive regions from `basinSeeds`, `plainLowlandSmoothingField`, subsidence-heavy tectonic context, and already materialized relief fields.
- `basinDepressionField` is depression input only; it does not build lake/marsh systems, river routing, inland seas, or final elevation.
- `plateauCandidateField` is the sixth implemented relief/elevation micro-output: it deterministically materializes broad plateau/elevated-area candidates from `domainWarpedMacroElevationField`, macro elevation, continental mass, and quiet tectonic/plain-lowland context.
- `plateauCandidateField` is classification input only; it does not extract plateau records, infer `ReliefRegionRecord`, or apply climate logic.
- `seaLevelAppliedElevationField` is the seventh implemented relief/elevation micro-output: it deterministically applies a primary sea-level threshold over the coarse relief composition and emits a post-threshold elevation tendency field.
- `seaLevelAppliedElevationField` is thresholded elevation input only; it does not run sea fill, marine flood fill, coastline refinement, or sea-region extraction.
- `landWaterMaskField` is the eighth implemented relief/elevation micro-output: it deterministically converts `seaLevelAppliedElevationField` into a primary binary land/water split.
- `landWaterMaskField` is initial partitioning input only; it does not perform marine carving, sea-region clustering, continent cleanup, or coastline opportunity analysis.
- `landmassCleanupMaskField` is the ninth implemented relief/elevation micro-output: it deterministically cleans small land/water noise artifacts from `landWaterMaskField` while preserving large-scale landmass structure.
- `landmassCleanupMaskField` is cleanup input only; it does not perform marine carving details, final coastline synthesis, sea-region extraction, whole-world shape scoring, or history-facing analysis.
- `landmassShapeInterestScores` is the first implemented relief/elevation analysis intermediate output: it deterministically scores only major cleaned landmasses for later validation/rebalance consumers.
- `landmassShapeInterestScores` is local-shape analysis input only; it does not validate the whole world, does not execute rebalance, and does not synthesize strategic regions.
- `continentBodies` is the second implemented relief/elevation intermediate output: it deterministically synthesizes connected continent-body drafts from `landmassCleanupMaskField` and plate-seed attribution.
- `continentBodies` prepares `ContinentRecord`-compatible `recordDraft` objects with unresolved relief/climate refs explicitly marked in `pendingRecordFields`; it does not export final `continents[]`, full continent summaries, or downstream history semantics.
- `reliefRegions` is the first implemented relief/elevation physical record output: it deterministically extracts large connected `ReliefRegionRecord`-compatible regions for mountains, plateaus, plains, basins, and coastal belts.
- `reliefElevationFieldSnapshots` export is implemented as a UI-free `fieldSnapshot[]` set built through the shared `fieldDebugRegistry` for elevation fields, land/water masks, cleanup masks, and a debug-only relief-region type mask.
- `reliefRegions` uses cleaned landmasses plus relief/elevation signal fields and continent/plate attribution; it does not perform climate classification, sea-region extraction, local biome placement, terrain-cell emission, or downstream history semantics.
- `finalElevation`, `seaFill`, `marineFloodFill`, final coastlines, lake/marsh hydrology, sea-region extraction, final `ContinentRecord` export, climate classification, terrain cells, whole-world validation, strategic regions, UI, and gameplay semantics remain absent until later microsteps.

### 4. Hydrosphere Generator
Prepares the future hydrosphere layer:
- ocean / sea fill dependencies;
- coarse water connectivity dependencies;
- sea-region extraction inputs;
- river-basin extraction inputs.

Runtime scaffold note:
- `HydrosphereGenerator` is a partial pipeline scaffold.
- Required input: `macroSeed`; optional inputs: `macroSeedProfile`, `phase1Constraints`, `worldBounds`, `reliefElevation`, `fields`, `intermediateOutputs`, `records`, and `debugOptions`.
- Elevation dependencies are explicitly declared as `seaLevelAppliedElevationField`, `landWaterMaskField`, and `landmassCleanupMaskField`, with optional `basinDepressionField`, `mountainAmplificationField`, and `plateauCandidateField` context.
- Optional record/intermediate dependencies are `reliefRegions`, `continentBodies`, and `reliefRegionExtraction`.
- Seed hooks are namespaced under `macro.hydrosphere` with planned child scopes for dependency intake, marine invasion, ocean fill, sea regions, river basins, and debug export.
- `oceanBasinFloodFill` is the first implemented hydrosphere micro-output: it deterministically flood-fills connected water components from cleaned land/water output and separates `open_ocean` basins from `enclosed_water` basins.
- `oceanConnectivityMaskField` is emitted alongside the flood-fill as a stable scalar classification field where land = `0`, enclosed water = `0.5`, and open ocean = `1`.
- `seaRegionClusters` is the second implemented hydrosphere micro-output: it deterministically converts connected water basins into geometry-based cluster drafts with `SeaRegionRecord`-compatible `recordDraft` payloads.
- The same clustering layer now also performs inland-sea formation: large enclosed basins are flagged as `inland_sea`, and edge-connected but weakly exposed basins may be flagged as `semi_enclosed_sea`.
- `seaNavigabilityTagging` is the third implemented hydrosphere micro-output: it deterministically enriches sea-region clusters with preliminary `navigability` and `hazard roughness` tags plus route-graph-ready preparation hints, while climate references remain unresolved.
- `coastalShelfDepthField` and `coastalDepthApproximation` are the fourth implemented hydrosphere micro-output pair: they approximate shelf-like shallow coastal water zones for later harbor/landing consumers and later marine-invasion composite consumers without scoring those consumers yet.
- `watershedSegmentation` is the fifth implemented hydrosphere micro-output: it segments cleaned land into terminal-water watershed groups and prepares `RiverBasinRecord`-compatible `recordDraft` payloads without publishing final `riverBasins[]`.
- Current runtime output intentionally stops before finalized sea-region and river-basin export: no final `seaRegions[]`, no final `riverBasins[]`, no major rivers, no bay/strait detail, no fishing score, no macro routes, no route graph, no river routing, no river deltas, no climate logic, no terrain cells, and no gameplay semantics are produced.
- Migration note: the Phase 1 pipeline shape now includes a dedicated `hydrosphere` scaffold between `reliefElevation` and later marine/climate layers. This is an additive scaffold only and does not change `MacroGeographyPackage` or `MacroGeographyHandoffPackage` semantics.

### 5. River System Generator
Prepares the future river and basin layer:
- river-system dependency intake;
- watershed-to-basin draft handoff;
- major river candidate extraction;
- future river debug/export hooks.

Runtime scaffold note:
- `RiverSystemGenerator` is a partial pipeline scaffold.
- Required input: `macroSeed`; optional inputs: `macroSeedProfile`, `phase1Constraints`, `worldBounds`, `reliefElevation`, `hydrosphere`, `fields`, `intermediateOutputs`, `records`, and `debugOptions`.
- Elevation dependencies are declared as `seaLevelAppliedElevationField` and `landmassCleanupMaskField`, with optional `basinDepressionField`, `mountainAmplificationField`, and `plateauCandidateField`.
- Hydrosphere dependency is declared as required `watershedSegmentation`, with optional `oceanBasinFloodFill`, `seaRegionClusters`, and `coastalDepthApproximation`.
- Optional record/intermediate dependencies are `reliefRegionExtraction`, `reliefRegions`, and future `seaRegions`.
- Seed hooks are namespaced under `macro.riverSystem` with planned child scopes for dependency intake, downstream flow routing, major-river candidate extraction, and debug export.
- `downhillFlowRouting` is the first implemented River System micro-output: it deterministically resolves one strict-downhill downstream neighbor for each cleaned land cell from `seaLevelAppliedElevationField` and `landmassCleanupMaskField`, with watershed-level summaries when `watershedSegmentation` is available.
- `flowAccumulationField` is the second implemented River System micro-output: it deterministically sums upstream land contributors over `downhillFlowRouting` and normalizes the result as a row-major `ScalarField` basis for future river extraction.
- `deltaLakeMarshTagging` is the third implemented River System micro-output: it deterministically tags structural delta, lake, and marsh candidate zones from downhill routing, accumulation, watershed terminal hints, and optional basin-depression context.
- `deltaLakeMarshTagging` emits downstream summaries only; it does not build final river-delta systems, lake hydrology simulation, marsh biomes, resources, climate blend, or gameplay semantics.
- `majorRiverCandidates` is the fourth implemented River System micro-output: it deterministically extracts macro-scale source-to-mouth mainstem river-line candidates from accumulation and watershed data, linked back to `RiverBasinRecord` hints.
- `majorRiverCandidates` is basin-record-compatible analysis output only; it does not build a river routing graph, local river placement, settlement logic, terrain cells, or gameplay semantics.
- `riverBasins` is the first implemented River System record output: it deterministically finalizes contract-valid watershed drafts into hydrology-stage `RiverBasinRecord` objects and keeps incomplete drafts deferred with validation diagnostics.
- `hydrologyDebugExport` is the first implemented River System debug export: it emits UI-free scalar field snapshots for `flowAccumulationField`, watershed segmentation coverage, exported river-basin record coverage, and includes `deltaLakeMarshTagging` plus `majorRiverCandidates` summary metadata.
- Current runtime output intentionally stops before climate blend and full package assembly: no `surfaceDrainageTendencyField`, no `riverBasinDrafts`, no river routing graph, no final river-delta systems, no lake hydrology simulation, no marsh biome construction, no resources, no local river placement, no settlement logic, no terrain cells, and no gameplay semantics are produced.
- Migration note: this upgrades the additive `riverSystem` scaffold with major-river candidates, delta/lake/marsh structural tags, hydrology-stage `RiverBasinRecord` output, and debug export. `RiverBasinRecord` climate references may remain empty until the later climate blend step; `MacroGeographyPackage` and `MacroGeographyHandoffPackage` assembly semantics remain unchanged.

### 6. Marine Carving Generator
Строит:
- заливы
- проливы
- внутренние моря
- archipelago corridors
- побережья

Runtime scaffold note:
- `MarineCarvingGenerator` is a partial pipeline scaffold under the `macro.marineCarving` namespace.
- Required input: `macroSeed`; optional inputs: `macroSeedProfile`, `phase1Constraints`, `worldBounds`, `reliefElevation`, `hydrosphere`, `fields`, `intermediateOutputs`, `records`, and `debugOptions`.
- Required field dependencies are `landmassCleanupMaskField` and `oceanConnectivityMaskField`; optional support comes from `seaLevelAppliedElevationField`, `basinDepressionField`, `fractureMaskField`, and `platePressureField`.
- Seed hooks are namespaced under `macro.marineCarving` with child scopes for dependency intake, marine invasion composite, bay carving, strait carving, archipelago fragmentation, and coast jaggedness control.
- `marineInvasionField` is the fifth implemented marine-carving micro-output: it deterministically combines water-basin exposure, bay/strait carving, island-chain fragmentation, coast-jaggedness carve signals, and hydrosphere coastal-depth context into one analyzer-facing scalar field.
- The marine-invasion composite is export-only for future analyzers: it does not perform climate integration, does not rebuild sea regions, and does not assemble the final package.
- `bayCarvedLandWaterMaskField` is the first implemented marine-carving micro-output: it deterministically notches selected coastal land cells into water to form coarse bays.
- `bayCarvingSummary` is emitted alongside the field and records the bounded carve budget plus the selected coastal carve cells in a stable, UI-free format.
- The current carve model is intentionally conservative: it requires one contiguous water arc around a candidate coastal cell, rejects opposite-side water exposure, and requires minimum inland land support so this step does not cut straits on thin corridors.
- `straitCarvedLandWaterMaskField` is the second implemented marine-carving micro-output: it deterministically cuts only thin corridor cells that connect distinct water basins and have supporting physical weakness signals.
- `straitCarvingSummary` is emitted alongside the field and records narrow-passage drafts with stable basin-linkage hints for future chokepoint analysis.
- The strait carve pass intentionally stays pre-analytic: it does not build island chains and does not compute control, trade, bypass, or collapse metrics.
- `islandChainFragmentedLandWaterMaskField` is the third implemented marine-carving micro-output: it deterministically fragments selected narrow coastal land-bar runs into island-chain morphology.
- `archipelagoFragmentationSummary` is emitted alongside the field and records fragmented runs, carved break cells, projected island segments, and stable morphology hints for later archipelago logic.
- The archipelago-fragmentation pass intentionally stays morphology-only: it does not compute archipelago significance, does not build `ArchipelagoRegionRecord`, and does not compute choke/control metrics.
- `coastJaggednessControlledLandWaterMaskField` is the fourth implemented marine-carving micro-output: it deterministically adjusts coastline jaggedness toward a bounded target without breaking large continental forms.
- `coastJaggednessControlSummary` is emitted alongside the field and records seed-driven target jaggedness, validation-control state through `phase1Constraints.coastJaggedness`, coastline metrics before/after, and bounded coastal adjustments.
- The jaggedness-control pass intentionally stays world-scale and validation-facing: it does not compute climate effects and does not implement local tile shoreline logic.
- Current runtime output intentionally stops before inland-sea reconstruction, finalized island-chain records, archipelago corridors, harbor scoring, route logic, river deltas, climate integration, final package assembly, terrain cells, UI, and gameplay semantics.

### 7. Climate Envelope Generator
Накладывает:
- влажность
- холод
- штормовость
- сезонную нестабильность
- coastal decay burden

Runtime scaffold note:
- `ClimateEnvelopeGenerator` is a partial implementation under the `macro.climateEnvelope` namespace.
- Required input: `macroSeed`; optional inputs: `macroSeedProfile`, `phase1Constraints`, `worldBounds`, `reliefElevation`, `hydrosphere`, `riverSystem`, `marineCarving`, `fields`, `intermediateOutputs`, `records`, and `debugOptions`.
- Geography dependencies are declared from relief/elevation outputs such as `seaLevelAppliedElevationField`, `landmassCleanupMaskField`, optional `mountainAmplificationField`, and optional `basinDepressionField`.
- Hydrosphere and marine dependencies are declared from `oceanConnectivityMaskField`, optional `coastalShelfDepthField`, optional `seaRegionClusters`, optional `coastalDepthApproximation`, optional `watershedSegmentation`, optional `majorRiverCandidates`, and optional `marineInvasionField`.
- Planned outputs are explicitly named for later prompts: latitude baseline, prevailing wind, humidity transport, temperature/cold-load, wetness, storm corridors, coastal decay burden, seasonality, climate zone classification, `climateBands`, climate stress, climate summaries, and UI-free climate debug artifacts.
- Current runtime output materializes `latitudeBandBaselineField`, deterministic `prevailingWindField`, `humidityTransportField`, `temperatureColdLoadField`, `stormCorridorField`, `coastalDecayBurdenField`, `seasonalityField`, `climateZoneClassification`, `climateBands[]`, `regionalClimateSummaries`, `rainShadowEffect`, and rain-shadow-adjusted `wetnessField`.
- `humidityTransportField` samples hydrosphere moisture sources through the prevailing wind field; `temperatureColdLoadField` derives warmth plus cold burden from latitude, elevation, and maritime context; `stormCorridorField` derives large storm-prone belts from wind, humidity, wetness, temperature, and maritime exposure; `coastalDecayBurdenField` derives coastal pressure from shoreline exposure, storm pressure, wetness, salt load, and cold-load; `seasonalityField` derives seasonal variability plus predictability and embeds regional summary buckets from latitude anchors, continentality, storm/coastal volatility, and maritime moderation; `climateZoneClassification` classifies coarse land climate zones from temperature, wetness, storm, and seasonality context and assembles `ClimateBandRecord`-compatible records when relief geometry is available; `regionalClimateSummaries` rolls emitted climate-band records up by relief region, continent body, and sea-region cluster; `rainShadowEffect` applies mountain/elevation orographic drying and local wetness boost; `wetnessField` remains pre-biome.
- Current runtime output intentionally stops before ocean current simulation, route graph construction, catastrophe systems, building decay systems, settlement logic, yearly simulation, gameplay time systems, climate stress synthesis, debug heatmaps, biome envelope, Phase 2 pressure package assembly, gameplay weather systems, terrain cells, UI, and gameplay semantics.
- Migration note: additive `climateZoneClassification` / `climateBands[]` / `regionalClimateSummaries` output drift on top of the existing partial `climateEnvelope` runtime. `MacroGeographyPackage` and `MacroGeographyHandoffPackage` semantics remain unchanged in this microstep.

### 8. Continental Cohesion Analyzer
Считает поэтапно:
- насколько внутренности материков физически проходимы;
- насколько материки связны;
- где позже могут быть выделены ядра;
- где позже регионы могут распадаться на отдельные блоки.

Runtime partial note:
- `ContinentalCohesionAnalyzer` is a partial macro-layer analyzer under the `macro.continentalCohesion` namespace.
- Required input: `macroSeed`; optional inputs: `macroSeedProfile`, `phase1Constraints`, `worldBounds`, `reliefElevation`, `hydrosphere`, `riverSystem`, `climateEnvelope`, `fields`, `intermediateOutputs`, `records`, and `debugOptions`.
- Explicit input groups are `continentBodies`, relief context (`reliefRegionExtraction`, optional `reliefRegions`), climate-stress context (`climateStressField`, optional `climateStressRegionalSummaries` / `regionalClimateSummaries`), and hydrology context (`watershedSegmentation`, optional downhill routing, flow accumulation, major rivers, delta/lake/marsh tags, and `riverBasins`).
- Current runtime output materializes `interiorPassabilityField`, `interiorPassabilityAnalysis`, `regionalSegmentMaskField`, `regionalSegmentationAnalysis`, `corePotentialField`, `corePotentialAnalysis`, `fracturedPeripheryField`, `fracturedPeripheryAnalysis`, `continentalCohesionField`, and `continentalCohesionSummaries`.
- `interiorPassabilityField` is a coarse physical scalar over continent-body cells, composed from relief type/ruggedness, physical climate stress, flow accumulation, major-river candidate lines, watershed scale, and delta/lake/marsh fringe hints.
- `regionalSegmentationAnalysis` groups large continent-internal blocks by running connected-component extraction over passable interior cells while treating very low-passability and rugged relief cells as coarse barriers.
- `corePotentialAnalysis` ranks those regional blocks by coarse physical support from passability, segment connectivity, coastal access context, and climate summaries; it remains a physical potential layer, not a polity/core detector.
- `fracturedPeripheryAnalysis` marks weakly connected continent-edge segments from coarse edge exposure, distance from leading core-potential segments, climate burden, and hydrology burden; it remains physical-only and does not synthesize strategic regions.
- `continentalCohesionField` fuses those suboutputs into one coarse physical cohesion scalar, while `continentalCohesionSummaries` rolls the same layer back up into concise continent-level summary rows without mutating `ContinentRecord`.
- The pass is not a pathfinder: it does not build a route graph, does not run local traversal, and does not emit terrain cells.
- Planned metrics such as `basinConnectivity`, `ridgeBarrier`, and `stateScalePotential` remain deferred.
- This partial analyzer does not detect continent cores, perform generic periphery classification, synthesize strategic regions, build route graphs, mutate `ContinentRecord`, assemble `MacroGeographyPackage`, emit terrain cells, add UI, or add gameplay semantics.
- Migration note: additive analyzer-output drift only. `ContinentRecord`, `MacroGeographyPackage`, and `MacroGeographyHandoffPackage` semantics remain unchanged.

### 9. Coastal Opportunity Analyzer
Считает:
- harbor quality
- landing ease
- fishing potential
- shore defense
- inland link bonus

Runtime scaffold note:
- `CoastalOpportunityAnalyzer` is a partial macro-layer analyzer under the `macro.coastalOpportunity` namespace.
- Required input: `macroSeed`; optional inputs: `macroSeedProfile`, `phase1Constraints`, `worldBounds`, `reliefElevation`, `hydrosphere`, `riverSystem`, `climateEnvelope`, `fields`, `intermediateOutputs`, `records`, and `debugOptions`.
- Explicit input groups are coastal sea-geometry context (`seaRegionClusters`, `coastalShelfDepthField`, optional `coastalDepthApproximation`, optional `seaNavigabilityTagging`), hydrology context (`watershedSegmentation`, optional `majorRiverCandidates`, optional `flowAccumulationField`), climate context (`coastalDecayBurdenField`, optional `stormCorridorField`, optional `climateStressField`), and optional continent/climate-summary context (`continentBodies`, `regionalClimateSummaries`).
- Current runtime output materializes `harborQualityField`, `harborQualityAnalysis`, `landingEaseField`, `landingEaseAnalysis`, `fishingPotentialField`, `fishingPotentialAnalysis`, `shoreDefenseField`, `shoreDefenseAnalysis`, `inlandLinkField`, `inlandLinkAnalysis`, `coastalOpportunityMap`, `coastalOpportunityProfile`, `exceptionalCoastalNodes`, and `coastalOpportunityAnalysisPlan`.
- `harborQualityField` is a coarse coastal-water harbor-support score built from sea-cluster shelter, coastal shelf support, optional navigability roughness, storm exposure, and coastal-decay burden; it remains physical-only and does not synthesize ports, settlements, or route logic.
- `landingEaseField` is a separate coarse coastal-water landing-support score built from shelf/depth access, coastal openness, and hydrosphere approach conditions only; it is not merged into `harborQualityField` in this microstep.
- `fishingPotentialField` is a separate coarse coastal-water fishing-support score built from shelf/depth habitat support, navigability and hazard water-condition proxies, and optional `regionalClimateSummaries.seaSummaries`; it stays physical-only and does not synthesize a gameplay fishing economy.
- `shoreDefenseField` is a separate coarse coastal-water natural-defensibility score built from enclosed coastal geometry, approach friction, and lower storm/decay exposure; it stays macro-geographic and does not imply military or political interpretation.
- `inlandLinkField` is a separate coarse coast-to-interior connectivity bonus built from linked river mouths, watershed reach, optional `continentalCohesionSummaries`, and a shelf-based coastal-node proxy because no dedicated `coastalNodeCandidates` output exists yet.
- `coastalOpportunityMap` is a unified analyzer-local composite field built from the five implemented coastal sub-scores; `coastalOpportunityProfile` rolls the same layer up into per-sea-cluster profile rows, and `exceptionalCoastalNodes` emits shortlisted downstream node candidates with anchor cells and dominant drivers.
- The analysis plan now marks all five coastal sub-scores and the composite stage as implemented.
- This partial analyzer does not build a connectivity graph; and it does not add route logic, strategic synthesis, terrain cells, UI, or gameplay semantics.
- Migration note: additive analyzer-output drift only. `MacroGeographyPackage` and `MacroGeographyHandoffPackage` semantics remain unchanged.

### 10. Flow and Route Analyzer
Строит:
- macro routes
- естественные коридоры
- зависимые маршруты
- route fragility and redundancy

Runtime scaffold note:
- `ConnectivityGraphBuilder` is a partial macro-layer builder under the `macro.connectivityGraph` namespace.
- Required input: `macroSeed`; optional inputs: `macroSeedProfile`, `phase1Constraints`, `worldBounds`, `reliefElevation`, `continentalCohesion`, `hydrosphere`, `coastalOpportunity`, `fields`, `intermediateOutputs`, `records`, and `debugOptions`.
- Explicit input groups are land-region context (`regionalSegmentationAnalysis`, optional `continentalCohesionSummaries`, optional `corePotentialAnalysis`, optional `fracturedPeripheryAnalysis`), marine-basin context (`seaRegionClusters`, optional `seaNavigabilityTagging`), coastal-bridge context (`exceptionalCoastalNodes`, optional `coastalOpportunityProfile`), and optional record-linkage context (`continentBodies`).
- Current runtime output materializes `connectivityGraphBuildPlan`, `landConnectivityGraph`, `seaConnectivityGraph`, `hybridConnectivityGraph`, `routeCostSurface`, `macroRoutes`, and `macroCorridors`.
- `connectivityGraphBuildPlan` reports dependency readiness, source counts for land-region / sea-region / coastal-node candidates, and planned output ids for `landConnectivityGraph`, `seaConnectivityGraph`, `hybridConnectivityGraph`, implemented `routeCostSurface`, implemented `macroRoutes`, implemented `macroCorridors`, future `connectivityNodeRegistry`, and future `connectivityEdgeRegistry`.
- `landConnectivityGraph` is a coarse land-only graph over major regional inland segments plus attached exceptional coastal terminals. Inter-segment edges are derived from barrier-separated regional neighbors, while coastal terminal attachments are derived from continent-matched inland segments without sea traversal or hybrid-cost modeling.
- `seaConnectivityGraph` is a coarse sea-only graph over marine basin nodes plus relevant exceptional coastal nodes whose `seaRegionClusterId` matches a known sea basin. Inter-basin links are derived from conservative coarse navigability/open-water/proximity heuristics, while coastal sea attachments use exact sea-cluster linkage only.
- `hybridConnectivityGraph` combines the land and sea graph structures and adds explicit `land_sea_transition` edges wherever a shared exceptional coastal node anchors both graph families; its hybrid edges now carry coarse route-cost annotations.
- `routeCostSurface` models coarse hybrid-edge friction from connectivity strength, climate stress, storm exposure, coastal decay burden, and narrow-strait hints without sampling routes or extracting corridors.
- `macroRoutes` deterministically samples candidate routes between selected major inland-region endpoints using the already built hybrid graph plus route-cost annotations.
- `macroCorridors` now classifies extracted corridors as `mandatory`, `redundant`, or `brittle` from corridor removal re-sampling plus coarse structural fragility over the hybrid graph.
- The current runtime is still deliberately partial: it does not register a standalone edge registry and it does not emit chokepoint records.
- This partial builder does not emit chokepoint records, strategic synthesis, terrain cells, UI, or gameplay semantics.
- Migration note: additive builder-output drift only. `MacroGeographyPackage` and `MacroGeographyHandoffPackage` semantics remain unchanged.

### 11. Chokepoint Analyzer
Выделяет:
- узкие проливы
- обязательные островные цепи
- перешейки
- choke dependencies

Runtime scaffold note:
- `ChokepointAnalyzer` is a partial macro-layer analyzer under the `macro.chokepoints` namespace.
- Required input: `macroSeed`; optional inputs: `macroSeedProfile`, `phase1Constraints`, `worldBounds`, `marineCarving`, `connectivityGraph`, `continentalCohesion`, `fields`, `intermediateOutputs`, `records`, and `debugOptions`.
- Explicit input groups are strait-signal context (`straitCarvingSummary`, optional `seaConnectivityGraph`, optional `routeCostSurface`), island-chain context (`archipelagoFragmentationSummary`, optional `macroCorridors`, optional `seaConnectivityGraph`), inland-bottleneck context (`regionalSegmentationAnalysis`, optional `landConnectivityGraph`, optional `macroRoutes`, optional `macroCorridors`), and route-dependence context (`hybridConnectivityGraph`, optional `routeCostSurface`, optional `macroRoutes`, optional `macroCorridors`).
- Current runtime output materializes `chokepointAnalysisPlan`, `straitChokepointCandidates`, `islandChainChokepointCandidates`, `inlandBottleneckChokepointCandidates`, and official `chokepointRecords`.
- `straitChokepointCandidates` detects narrow straits from `straitCarvingSummary` and enriches them with coarse `seaConnectivityGraph` context, emitting first-class chokepoint candidate rows plus `recordDraft` objects aligned with `ChokepointRecord`.
- `islandChainChokepointCandidates` detects archipelagic lock passages from `archipelagoFragmentationSummary` and enriches them with coarse `seaConnectivityGraph`, `macroRoutes`, and `macroCorridors`, then adds `bypassDifficulty` and `collapseSensitivity` from route/corridor fragility before final family classification.
- `inlandBottleneckChokepointCandidates` detects dry-land bottleneck links from `regionalSegmentationAnalysis`, `landConnectivityGraph`, `macroRoutes`, and `macroCorridors`, then adds `bypassDifficulty` and `collapseSensitivity` from graph/corridor fragility before final family classification.
- `chokepointRecords` synthesizes official `ChokepointRecord` rows from all three candidate families; straits reuse aligned `recordDraft` payloads, while island-chain and inland families are materialized from their finalized four-metric candidate rows.
- `chokepointRecords.recordLinks` acts as the minimal debug-friendly export for source-candidate tracing, so this step does not add a separate chokepoint debug artifact.
- `chokepointAnalysisPlan` now reports dependency availability, source counts, pass status for the implemented strait, island-chain, and inland detectors, plus `recordSynthesisImplemented: true` and emitted record counts.
- The current runtime is still deliberately partial: `ChokepointRecord` synthesis is now implemented, but isolation/periphery logic, strategic synthesis, terrain cells, UI, and gameplay semantics remain downstream.
- This partial analyzer does not emit strategic synthesis, terrain cells, UI, or gameplay semantics.
- Migration note: additive analyzer-output drift only. `MacroGeographyPackage`, `MacroGeographyHandoffPackage`, and `ChokepointRecord` semantics remain unchanged.

### 12. Isolation and Periphery Analyzer
- Explicit input groups are graph context (`hybridConnectivityGraph`, optional `routeCostSurface`, optional `macroRoutes`, optional `macroCorridors`), core context (`corePotentialAnalysis`, optional `continentalCohesionSummaries`), climate context (`climateStressField`, optional `stormCorridorField`, optional `coastalDecayBurdenField`), and chokepoint fragility context (`chokepointRecords`).
- Current runtime output materializes `isolationField`, `isolationAnalysis`, `isolatedZones`, and `peripheryClusters`.
- `distanceFromCore` now measures coarse deterministic graph distance from the strongest available inland core-potential anchors across the already built hybrid connectivity graph.
- `resupplyCost` now combines distance-from-core, route-pressure friction, and route-coverage deficit into a deterministic coarse resupply burden without local traversal runtime.
- `weatherAdjustedIsolation` now layers climate-stress and storm exposure over resupply burden as the third implemented isolation metric.
- `culturalDriftPotential`, `autonomousSurvivalScore`, and local `lossInCollapseLikelihood` now add the remaining drift/autonomy/collapse layer on top of route fragility and official chokepoint metrics.
- `isolatedZones` and `peripheryClusters` are now extracted as deterministic graph-connected components over projectable hybrid nodes; they remain analyzer-local outputs and do not assemble package records in this step.
- Archipelago significance and gameplay semantics remain deferred in this step.

### 13. Archipelago Significance Generator
Текущий runtime materializes `archipelagoMacroZones` as the only intermediate output.

- Explicit input groups are marine-morphology context (`archipelagoFragmentationSummary`, optional `seaRegionClusters`, optional `seaNavigabilityTagging`), route context (`macroRoutes`, optional `macroCorridors`), chokepoint context (`chokepointRecords`), island-chain context (`islandChainChokepointCandidates`), and isolation context (`isolationAnalysis`, optional `isolatedZones`, optional `peripheryClusters`).
- `archipelagoMacroZones` still detects archipelagic macrozones by merging related `archipelagoFragmentationSummary.fragmentationRuns` through shared basin identity, shared sea-region linkage, optional route/corridor support, and coarse geometric proximity.
- The same output now also computes five deterministic significance metrics per macrozone: `connectiveValue`, `fragility`, `colonizationAppeal`, `contestScore`, and `collapseSusceptibility`.
- Role work intentionally stops at seed-level hints: each macrozone now carries `roleSeedHints` for later interpretation, but it does not finalize historical or strategic role semantics.
- `recordDraftHints` stays aligned with `ArchipelagoRegionRecord` and now pre-fills contract-safe `connectiveValue`, `fragility`, `colonizationAppeal`, `macroRouteIds`, and linked `chokepointIds`.
- This microstep intentionally stops before final `ArchipelagoRegionRecord` export, `longTermSustainability`, `historicalVolatility`, strategic-region synthesis, terrain cells, UI, and gameplay semantics.

### 14. Strategic Region Synthesizer
Текущий runtime materializes only `strategicRegionCandidates`.

- Explicit input groups are cohesion context (`continentalCohesionSummaries`, optional `corePotentialAnalysis`, optional `fracturedPeripheryAnalysis`), coastal context (`coastalOpportunityProfile`, optional `exceptionalCoastalNodes`), connectivity context (`macroRoutes`, `macroCorridors`), choke context (`chokepointRecords`), isolation context (`isolatedZones`, `peripheryClusters`), and archipelago context (`archipelagoMacroZones`).
- `strategicRegionCandidates` currently synthesizes only four candidate families:
  - `imperialCoreCandidates`
  - `tradeBeltCandidates`
  - `fragilePeripheryCandidates`
  - `disputedStrategicRegionCandidates`
- The output remains candidate-only: each row carries `StrategicRegionRecord`-aligned `recordDraftHints`, but the module does not export final `strategicRegions[]` in this microstep.
- This step intentionally stops before validation/rebalance, final strategic-region records, package assembly, terrain cells, UI, and gameplay semantics.

### 15. Macro Validation and Rebalance
Текущий runtime materializes contract-aligned `validationReport`, analyzer-local `macroValidationDiagnostics`, and deterministic `partialRegenerationRebalancePass`.

- Explicit input groups are structural-diversity context (`continentalCohesionSummaries`, optional `seaRegionClusters`, optional `regionalClimateSummaries`), connectivity context (`coastalOpportunityProfile`, optional `exceptionalCoastalNodes`, `macroRoutes`, `macroCorridors`), choke/archipelago context (`chokepointRecords`, `archipelagoMacroZones`), center-periphery context (`corePotentialAnalysis`, `fracturedPeripheryAnalysis`, `isolatedZones`, `peripheryClusters`), and strategic context (`strategicRegionCandidates`).
- `validationReport` computes exactly six normalized validation scores for the official package contract:
  - `diversity`
  - `routeRichness`
  - `chokeValue`
  - `archipelagoSignificance`
  - `centerPeripheryContrast`
  - `historyPotential`
- `macroValidationDiagnostics` carries the richer validation-layer surface: dependency availability, source counts, per-score breakdowns, thresholds, warnings, blocked downstream phases, and selective reroll recommendations.
- `partialRegenerationRebalancePass` now turns low-score diagnostics into deterministic targeted actions with `targetLayerIds`, priority, and `deterministicSeedDelta`. Upstream reruns still remain orchestrator-controlled and are not executed inside the validation module.
- This step intentionally stops before whole-phase reroll orchestration, end-to-end debug bundle assembly, terrain cells, UI, and gameplay semantics.

### 16. Export Package
Текущий runtime materializes contract-valid `MacroGeographyPackage` through `MacroGeographyPackageBuilder`, while `MacroGeographyGenerator` now closes the deterministic Phase 1 end-to-end assembly path.

- `MacroGeographyGenerator` now normalizes seed/bounds, deterministically materializes any missing upstream stage bundles in pipeline order, reuses an incoming `validationRebalance` bundle when present, otherwise calls `validateAndRebalanceMacroWorld()`, and then delegates package assembly to `buildMacroGeographyPackage()`.
- `MacroGeographyPackageBuilder` still reuses official `outputs.records` where they already exist (`plates`, `reliefRegions`, `riverBasins`, `climateBands`, `chokepoints`) and synthesizes contract-safe rows from intermediate outputs where final record passes remain deferred (`continents`, `seaRegions`, `mountainSystems`, `volcanicZones`, `archipelagoRegions`, `macroRoutes`, `strategicRegions`).
- The same orchestrator layer now also builds the official machine-readable `MacroGeographyHandoffPackage`, the canonical `physicalWorldDebugBundle`, and a minimal downstream integration hook that points later generators at the existing handoff sections without inventing new downstream truth.
- Package assembly remains contract-safe: `debugArtifacts.physicalWorldDebugBundle` stays optional and UI-free, handoff semantics stay constrained to the official `MacroGeographyHandoffPackage`, and no gameplay/runtime systems are expanded in this step.

---

## Важный принцип интеграции
Каждый подгенератор:
- принимает только контрактные данные;
- не имеет права генерировать поля “по ходу” без схемы;
- экспортирует промежуточный слой в debug form;
- должен быть детерминирован по seed.

---

## Execution order
```text
master constraints
  -> tectonic skeleton
  -> relief elevation
  -> hydrosphere
  -> river system
  -> marine carving
  -> climate envelope
  -> climate pressure
  -> cohesion analysis
  -> coastal opportunity
  -> route graph
  -> chokepoints
  -> isolation/periphery
  -> archipelago significance
  -> strategic region synthesis
  -> validation
  -> export
```

---

## Возможные feedback loops
Разрешены только контролируемые loops:

### Loop A. Validation -> Marine Carving
Если архипелаг незначим, можно перегенерировать только marine carving.

### Loop B. Validation -> Chokepoint weighting
Если choke regions недостаточно интересны, можно изменить weighting и пересчитать только route/choke слои.

### Loop C. Validation -> Coastal Opportunity
Если мир не даёт морской исторической глубины, можно частично пересчитать coast opportunity без слома тектоники.

---

## Что запрещено
1. Полный reroll мира при каждой локальной неудаче.
2. Прямое изменение уже экспортированных downstream контрактов без пересчёта validation.
3. Смешивание climate и political logic в этой фазе.
4. Использование local island data до завершения macro package.
