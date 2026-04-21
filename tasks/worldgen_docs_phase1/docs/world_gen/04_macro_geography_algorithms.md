# MACRO GEOGRAPHY — ALGORITHMS AND DECISION LOGIC

## Задача документа
Этот файл фиксирует, **какие типы алгоритмов допустимы**, где использовать вероятности, где анализ графов, а где нужны более строгие процедурные шаги.

---

## 1. Не использовать систему “таблица пресетов” как основу
Пресеты допустимы только как:
- стартовые bias-профили;
- веса для параметров;
- validation targets.

Они не должны быть главной логикой формы мира.

---

## 2. Базовый стек алгоритмов

### A. Multi-field synthesis
Основа всей фазы.
Используется для:
- tectonic skeleton
- marine invasion
- climate pressure

### B. Graph extraction and analysis
Основа для:
- routes
- chokepoints
- isolation
- strategic dependency

### C. Utility scoring
Используется для:
- coastal opportunity
- core candidate scoring
- archipelago significance

### D. Constraint resolution
Используется для:
- validation
- targeted rebalance
- partial rerolls

---

## 3. Алгоритмы по подгенераторам

### 3.1. TectonicSkeletonGenerator
Рекомендуемые техники:
- ridge noise
- directional bias fields
- fracture masks
- Voronoi macro partitions
- multi-scale smoothing

Implemented micro-output:
- `plateSeedDistribution` uses deterministic jittered cell distribution under the `macro.tectonicSkeleton.plateSeedDistribution` namespace.
- Its job is only to create stable `plateId` / `plateClass` / `seedPoint` anchors for future tectonic passes.
- `plateMotionVectors` uses deterministic per-plate vector generation under the `macro.tectonicSkeleton.plateMotionVectors` namespace.
- Its job is only to create boundary-analysis-compatible `unitVector`, `magnitude`, and `motionVector` values attached to existing plate ids and seed points.
- `plateBoundaryClassification` uses deterministic nearest-seed boundary candidates plus relative-motion normal/tangential scoring under the `macro.tectonicSkeleton.plateBoundaryClassification` namespace.
- Its job is only to classify boundary candidates as `collision`, `divergence`, or `transform`, and to expose future `upliftPotential`, `subsidencePotential`, and `volcanicPotential` signals.
- `upliftField` uses deterministic boundary-distance falloff under the `macro.tectonicSkeleton.upliftField` namespace.
- Its job is only to materialize a scalar `[0, 1]` uplift tendency field from `plateBoundaryClassification.futureSignals.upliftPotential`.
- `subsidenceField` uses deterministic boundary-distance falloff under the `macro.tectonicSkeleton.subsidenceField` namespace.
- Its job is only to materialize a scalar `[0, 1]` subsidence tendency field from `plateBoundaryClassification.futureSignals.subsidencePotential` and expose compatibility metadata for later uplift/elevation composition.
- `fractureMaskField` uses deterministic boundary-distance falloff under the `macro.tectonicSkeleton.fractureField` namespace.
- Its job is only to materialize a scalar `[0, 1]` fracture mask from transform/shear-heavy boundary scoring and expose compatibility metadata for `upliftField` / `subsidenceField`.
- `ridgeDirectionField` uses deterministic line synthesis under the `macro.tectonicSkeleton.ridgeDirection` namespace.
- Its job is only to materialize a directional field plus explicit `ridgeLines` candidates from uplift-dominant classified boundaries for later mountain amplification.
- `basinSeeds` uses deterministic candidate selection under the `macro.tectonicSkeleton.basinSeeds` namespace.
- Its job is only to materialize basin seed points/areas from subsidence-dominant tectonic context for later basin tendency and river-basin extraction.
- `arcFormationHelper` uses deterministic curved-guide synthesis under the `macro.tectonicSkeleton.arcFormation` namespace.
- Its job is only to materialize arc guides, control points, and curve samples from volcanic arc candidates for later volcanic-arc extraction and curved tectonic-form interpretation.
- `hotspotVolcanicSeedHelper` uses deterministic plate-carried seed and trail synthesis under the `macro.tectonicSkeleton.hotspotVolcanicSeeds` namespace.
- Its job is only to materialize hotspot-like volcanic seed points, trail vectors, and trail samples for later hotspot volcanic-zone extraction, keeping arc-vs-hotspot separation available to downstream passes.
- `platePressureField` uses deterministic weighted field compositing under the `macro.tectonicSkeleton.platePressureComposite` namespace.
- Its job is only to materialize a reusable tectonic composite scalar field from uplift/subsidence/fracture/ridge/basin/arc inputs for later interpretation passes.
- `mountainBeltCandidates` uses deterministic ridge clustering under the `macro.tectonicSkeleton.mountainBelts` namespace.
- Its job is only to materialize large-system mountain candidates and `MountainSystemRecord`-ready drafts from ridge/pressure/arc tectonic context before relief-region linkage exists.
- `plainLowlandSmoothingField` uses deterministic broad-field smoothing under the `macro.tectonicSkeleton.plainLowlandSmoothing` namespace.
- Its job is only to materialize large plain/lowland smoothing candidates from quiet tectonic, subsidence, basin-seed, pressure, and mountain-belt context for later basin/plateau/relief logic.
- These implemented micro-outputs must not imply final landmass synthesis, land tendency generation, marine flood fill, basin depression, plateau extraction, basin extraction, full elevation composition, hydrology routing, basin tendency generation, fertility scoring, relief construction, climate effects, volcanic-zone extraction, geologic resource logic, or finalized mountain-system extraction.

### 3.2. ReliefElevationGenerator
Runtime scaffold:
- `ReliefElevationGenerator` is a partial pipeline under the `macro.reliefElevation` namespace.
- It declares deterministic seed hooks for dependency intake, mountain amplification, basin depression, macro elevation composite, domain warping, plateau candidates, sea level application, land/water split, and relief-region drafts.
- It accepts tectonic field dependencies from `upliftField`, `subsidenceField`, `fractureMaskField`, `ridgeDirectionField`, `platePressureField`, and `plainLowlandSmoothingField`.
- It also accepts `basinSeeds` and `mountainBeltCandidates` as required intermediate dependencies, with arc/hotspot helpers as optional context.

Implemented micro-output:
- `baseContinentalMassField` uses deterministic coarse synthesis under the `macro.reliefElevation.baseContinentalMass` namespace.
- Its job is only to materialize a continuous `[0, 1]` continental mass tendency field from `platePressureField`, uplift/subsidence/fracture/ridge context, and `plainLowlandSmoothingField`.
- The algorithm uses weighted multi-field synthesis plus broad smoothing and a small deterministic coarse seed-bias channel to avoid perfectly mechanical contours.
- `macroElevationField` uses deterministic large-scale composition under the `macro.reliefElevation.macroElevationComposite` namespace.
- Its job is only to materialize a continuous `[0, 1]` macro elevation map from `baseContinentalMassField` plus tectonic pressure/uplift/subsidence/fracture/ridge/plain-lowland context.
- The algorithm uses same-coordinate weighted composition plus broad smoothing. It intentionally does not use domain warping or coordinate displacement.
- `domainWarpedMacroElevationField` uses deterministic domain warping under the `macro.reliefElevation.domainWarping` namespace.
- Its job is only to distort large land and ridge forms by pull-sampling `macroElevationField` through coarse seed-noise displacement, ridge-aligned displacement, and fracture-perpendicular displacement.
- The pass is deterministic from `macroSeed`, `macroElevationField`, `baseContinentalMassField`, and tectonic fields; it does not run cleanup or infer regions.
- `mountainAmplificationField` uses deterministic mountain amplification synthesis under the `macro.reliefElevation.mountainAmplification` namespace.
- Its job is only to materialize a continuous `[0, 1]` amplification field for mountain-shaped elevation zones from `domainWarpedMacroElevationField`, `ridgeDirectionField`, `mountainBeltCandidates`, and tectonic pressure/uplift context.
- The pass is deterministic from `macroSeed`, relief/elevation source fields, and tectonic candidate data; it intentionally prepares later orographic/rain-shadow compatibility without computing climate logic.
- `basinDepressionField` uses deterministic basin-floor depression synthesis under the `macro.reliefElevation.basinDepression` namespace.
- Its job is only to materialize a continuous `[0, 1]` depression field for basin-permissive lowland regions from `basinSeeds`, `plainLowlandSmoothingField`, subsidence/uplift/fracture/pressure context, and already materialized relief fields.
- The pass is deterministic from `macroSeed`, relief/elevation source fields, and basin-seed data; it intentionally prepares later lake/marsh retention compatibility without computing river systems or inland seas.
- `plateauCandidateField` uses deterministic plateau-candidate synthesis under the `macro.reliefElevation.plateauCandidates` namespace.
- Its job is only to materialize a continuous `[0, 1]` candidate field for broad plateau/elevated areas from `domainWarpedMacroElevationField`, macro elevation, continental mass, and quiet tectonic/plain-lowland context.
- The pass is deterministic from `macroSeed`, relief/elevation source fields, and tectonic fields; it intentionally emits candidate values only, not records.
- `seaLevelAppliedElevationField` uses deterministic sea-level application under the `macro.reliefElevation.seaLevelApplication` namespace.
- Its job is only to materialize a continuous `[0, 1]` post-threshold elevation field by applying a primary sea-level cutoff to the coarse relief composition.
- The pass is deterministic from `macroSeed`, relief/elevation source fields, and the derived elevation distribution; it intentionally stops before sea fill, marine carving, and coastline cleanup.
- `landWaterMaskField` uses deterministic primary partitioning under the `macro.reliefElevation.landWaterSplit` namespace.
- Its job is only to materialize a binary `MaskField` / `ConstraintField` for land vs water based on `seaLevelAppliedElevationField`.
- The pass is deterministic from `macroSeed` and the already materialized sea-level-applied field; it intentionally stops before marine carving details, sea-region extraction, and continent cleanup.
- `landmassCleanupMaskField` uses deterministic artifact cleanup under the `macro.reliefElevation.landmassCleanup` namespace.
- Its job is only to clean small land/water noise from `landWaterMaskField` using already materialized relief support fields while preserving large-scale shapes.
- The pass is deterministic from `macroSeed`, `landWaterMaskField`, and the already materialized relief/elevation fields; it intentionally stops before marine carving details, final coastlines, whole-world shape scoring, and history-facing analysis.
- `landmassShapeInterestScores` uses deterministic large-landmass analysis under the `macro.reliefElevation.landmassShapeInterest` namespace.
- Its job is only to score major cleaned landmasses for future validation/rebalance consumers using shape size, coastline complexity, compactness/elongation, and relief contrast.
- The pass is deterministic from `macroSeed` and already materialized land/relief fields; it intentionally stops before whole-world validation, rebalance execution, strategic-region synthesis, and history-facing analysis.
- `continentBodies` uses deterministic connected-component synthesis under the `macro.reliefElevation.continentBodies` namespace.
- Its job is only to convert major cleaned landmasses into body geometry plus `ContinentRecord`-compatible drafts with unresolved relief/climate refs explicitly marked.
- The pass is deterministic from `macroSeed`, cleaned land/relief fields, and `plateSeedDistribution`; it intentionally stops before final `continents[]` export, whole-pipeline continent summaries, downstream history logic, and strategic-region synthesis.
- `reliefRegions` uses deterministic relief-type classification and connected-component extraction under the `macro.reliefElevation.reliefRegions` namespace.
- Its job is only to extract large mountain, plateau, plain, basin, and coastal-belt regions into `ReliefRegionRecord`-compatible records from already materialized cleaned land/elevation fields.
- The pass is deterministic from `macroSeed`, cleaned land/relief fields, `continentBodies`, and `plateSeedDistribution`; it intentionally stops before climate classification, sea-region adjacency resolution, terrain-cell emission, local biome placement, and downstream history logic.
- It currently does not compute final coastlines, final continent records, mountain records, plateau records, sea fill, marine flood fill, rain shadow, lake/marsh hydrology, full debug bundles, terrain cells, climate logic, world validation, or gameplay semantics.

#### Relief/elevation field debug snapshots
- `macro.reliefElevation.reliefElevationFieldSnapshots` exports UI-free scalar heatmap artifacts through `fieldDebugRegistry`.
- The export covers already materialized elevation fields, land/water masks, cleanup masks, and a derived relief-region type mask.
- The derived `reliefRegionTypeMaskField` encodes only large connected exported relief classes with the stable mapping `none = 0`, `mountain = 0.2`, `plateau = 0.4`, `plain = 0.6`, `basin = 0.8`, `coast = 1`.
- This debug pass does not create renderer state, a dev panel, a full `PhysicalWorldDebugBundle`, validation scoring, sea-region snapshots, terrain cells, or gameplay semantics.

### 3.3. HydrosphereGenerator
Runtime scaffold:
- `HydrosphereGenerator` is a partial pipeline under the `macro.hydrosphere` namespace.
- It declares deterministic seed hooks for dependency intake, future marine invasion, future ocean fill, future sea-region extraction, future river-basin extraction, and future debug export.
- It accepts elevation dependencies from `seaLevelAppliedElevationField`, `landWaterMaskField`, and `landmassCleanupMaskField`, with optional basin/mountain/plateau and relief-region context.
- `oceanBasinFloodFill` uses deterministic row-major connected-component flood-fill over water cells under the `macro.hydrosphere.oceanFill` namespace.
- Its job is only to identify water components and classify them as `open_ocean` when they touch the world edge or `enclosed_water` when fully surrounded by land.
- `oceanConnectivityMaskField` is derived from the same pass as a scalar classification view for later sea-region extraction.
- `seaRegionClusters` uses deterministic basin-to-cluster projection under the `macro.hydrosphere.seaRegions` namespace.
- Its job is to convert connected water basins into geometry-based sea-region clusters and `SeaRegionRecord`-compatible `recordDraft` payloads with unresolved climate and navigability fields explicitly marked.
- The same pass may refine basin typing into `inland_sea` and `semi_enclosed_sea` from large enclosed geometry and low-exposure edge-connected geometry, without invoking bay/strait detail.
- `seaNavigabilityTagging` uses deterministic geometry/enclosure metrics plus per-cluster seed nudges under `macro.hydrosphere.seaNavigability` to assign basic `navigability` and `hazard roughness` tags without constructing route graphs.
- `coastalDepthApproximation` uses deterministic water distance-to-land, sea-level shallowness, optional basin depression, and per-cell seed nudges under `macro.hydrosphere.coastalDepth` to approximate shelf-like coastal depth zones for later harbor/landing logic.
- `watershedSegmentation` uses deterministic nearest-terminal-water expansion under `macro.hydrosphere.riverBasins` to group cleaned land cells into watershed drafts and attach provisional terminal water plus relief-region references.
- It must not finalize `seaRegions[]`, build bays/straits, score fishing, publish final `riverBasins[]`, extract major rivers, route rivers, build river deltas, run macro-route logic, create lake/marsh systems, compute climate pressure, emit terrain cells, or add gameplay semantics during this microstep.

### 3.4. RiverSystemGenerator
Runtime scaffold:
- `RiverSystemGenerator` is a partial pipeline under the `macro.riverSystem` namespace.
- It declares deterministic seed hooks for dependency intake, downhill flow routing, flow accumulation, major-river candidate extraction, and future debug export.
- It accepts required elevation inputs from `seaLevelAppliedElevationField` and `landmassCleanupMaskField`, plus required hydrosphere input from `watershedSegmentation`.
- Optional future context includes `basinDepressionField`, `mountainAmplificationField`, `plateauCandidateField`, `oceanBasinFloodFill`, `seaRegionClusters`, `coastalDepthApproximation`, `reliefRegionExtraction`, `reliefRegions`, and future `seaRegions`.
- `downhillFlowRouting` uses deterministic strict-downhill neighbor selection under the `macro.riverSystem.riverRouting` namespace.
- Its job is only to resolve one direct downstream step per cleaned land cell from elevation: each routed cell records a downstream index, direction code, elevation drop, and slope.
- Ties are resolved with a tiny deterministic seed-derived tie breaker; flat cells and cells with no lower neighbor remain sinks for later hydrology passes.
- `flowAccumulationField` uses the existing downstream indices as a deterministic topological graph: each cleaned land cell starts with one contributor count, upstream counts are propagated to downstream land cells, and the field is normalized by the max land accumulation.
- `deltaLakeMarshTagging` uses deterministic structural tagging under the `macro.riverSystem.deltaLakeMarshTagging` namespace.
- Its job is only to mark candidate delta, lake, and marsh zones from terminal-water hints, accumulation, strict-downhill sinks, low-slope areas, and optional basin-depression context, then emit downstream summaries.
- `majorRiverCandidates` uses deterministic mainstem extraction under the `macro.riverSystem.majorRiverCandidates` namespace.
- Its job is only to pick high-accumulation mouth or sink anchors per watershed, trace a source-to-mouth mainstem line over the downstream graph, and link the line candidate to watershed, terminal-water, and `RiverBasinRecord` hint metadata.
- `riverBasins` materialization consumes `watershedSegmentation.recordDraft` payloads plus flow-accumulation summaries. Drafts that satisfy the runtime `RiverBasinRecord` contract become hydrology-stage records; incomplete drafts remain deferred with validation diagnostics.
- `hydrologyDebugExport` builds stable scalar snapshots for accumulation, watershed segmentation, and emitted basin-record coverage, with `deltaLakeMarshTagging` and `majorRiverCandidates` summary metadata. It can use the shared field debug registry when available and remains UI-free.
- The current river-system algorithm intentionally remains pre-climate and pre-package: it does not build route graphs, does not create final river-delta systems, does not simulate lake hydrology, does not construct marsh biomes, does not perform climate blend, and does not add settlement or gameplay semantics.
- It must not build `surfaceDrainageTendencyField`, `riverBasinDrafts`, river routing graphs, final river-delta systems, lake hydrology simulation, marsh biome construction, climate blend, full package assembly, local river placement, settlement logic, terrain cells, UI, or gameplay semantics during this microstep.

### 3.5. MarineCarvingGenerator
Рекомендуемые техники:
- coastline carve masks
- marine penetration iterators
- bay candidate growth
- strait forcing under fracture lines
- archipelago fragmentation pass

Runtime scaffold:
- `MarineCarvingGenerator` is currently a partial deterministic layer under the `macro.marineCarving` namespace.
- It consumes cleaned coastal land from `landmassCleanupMaskField` plus water connectivity context from `oceanConnectivityMaskField`, with optional coastal softness bias from `seaLevelAppliedElevationField`, `basinDepressionField`, `fractureMaskField`, and `platePressureField`.
- `marineInvasionField` uses deterministic weighted compositing under the `macro.marineCarving.marineInvasion` namespace.
- Its job is only to combine water-basin exposure, hydrosphere coastal-depth context, bay/strait carving outputs, island-chain fragmentation, and coast-jaggedness carve signals into one analyzer-facing scalar field.
- The composite is not a climate integration pass, not a final sea-region rebuild, and not final package assembly.
- `bayCarvedLandWaterMaskField` is the first implemented micro-output.
- The current algorithm performs bounded coastal bay notching: it scores coastal land cells by contiguous water-arc shape, open-water exposure, low-relief bias, basin support, and deterministic per-cell seed noise.
- Candidate safety is structural, not probabilistic: a bay candidate must see one contiguous surrounding water group, is rejected if water appears on opposite sides, and must retain inland land support behind the notch, so this microstep cannot quietly create straits.
- `bayCarvingSummary` records the bounded carve budget and the selected coastal carve cells for later analysis.
- `straitCarvedLandWaterMaskField` is the second implemented micro-output.
- The current strait algorithm performs bounded thin-corridor cuts: a candidate must connect opposite water sides, resolve to distinct water basins through `oceanBasinFloodFill`, preserve side-wall support, and pass a deterministic structural score derived from fracture, plate-pressure weakness, low relief, and basin support.
- `straitCarvingSummary` records carved passage cells with stable basin-linkage hints and `futureChokepointTypeHint = narrow_strait` for later chokepoint analysis.
- `islandChainFragmentedLandWaterMaskField` is the third implemented micro-output.
- The current archipelago-fragmentation algorithm performs bounded land-bar fragmentation: it finds same-basin coastal runs that are flanked by water, supported by fracture / pressure-weakness / low-relief context, and then opens deterministic break cells to leave chain-like island morphology.
- `archipelagoFragmentationSummary` records fragmented runs, carved break cells, projected island segments, and future archipelago-morphology hints without attaching significance or control semantics.
- `coastJaggednessControlledLandWaterMaskField` is the fourth implemented micro-output.
- The current coast-jaggedness algorithm measures coarse shoreline complexity, derives a seed-driven target blended with `phase1Constraints.coastJaggedness`, and then applies a bounded coastal carve-or-fill pass to move the shape toward that target without breaking major forms.
- `coastJaggednessControlSummary` records the validation control field, target/before/after jaggedness values, and bounded coastal adjustment cells for later validation/rebalance and harbor-landing preparation.
- The runtime intentionally stops before finalized island-chain records, archipelago significance, chokepoint control metrics, inland-sea reconstruction, climate integration, local tile shoreline logic, harbor scoring, route logic, final package assembly, river deltas, and gameplay semantics.

### 3.6. ClimateEnvelopeGenerator
Рекомендуемые техники:
- latitude-style gradient bias
- sea proximity modifiers
- storm corridor masks
- humidity overlays
- region-scale diffusion

Runtime partial:
- `ClimateEnvelopeGenerator` is a partial pipeline implementation under the `macro.climateEnvelope` namespace.
- It declares deterministic seed hooks for dependency intake, latitude bands, prevailing wind, humidity transport, temperature/cold-load, storm/decay/seasonality, climate-band classification, and debug export.
- It accepts required geography/hydrosphere field dependencies from `seaLevelAppliedElevationField`, `landmassCleanupMaskField`, and `oceanConnectivityMaskField`.
- Optional future context includes `mountainAmplificationField`, `basinDepressionField`, `coastalShelfDepthField`, `marineInvasionField`, `continentBodies`, `seaRegionClusters`, `coastalDepthApproximation`, `watershedSegmentation`, `majorRiverCandidates`, `reliefRegions`, `riverBasins`, and future `seaRegions`.
- The implemented `latitudeBandBaselineField` uses deterministic latitude distance, a seed-stable axial-tilt bias, and a seed-stable equator offset under the `macro.climateEnvelope.latitudeBands` namespace.
- The latitude output stores row-major scalar thermal baseline values plus per-row coarse band metadata and compatibility hints for future temperature/cold-load and wetness layers.
- The implemented `prevailingWindField` uses deterministic latitude-belt circulation plus seed-stable longitudinal/latitudinal wave nudges under the `macro.climateEnvelope.prevailingWind` namespace.
- The wind output stores row-major unit-vector arrays (`xValues`, `yValues`) and coarse `magnitudeValues`; it is prepared for future humidity and storm-corridor consumers.
- The implemented `humidityTransportField` uses deterministic upwind fetch sampling over `prevailingWindField` and hydrosphere context (`oceanConnectivityMaskField`, optional `coastalShelfDepthField`, optional `marineInvasionField`) under the `macro.climateEnvelope.humidityTransport` namespace.
- The implemented `temperatureColdLoadField` uses the latitude baseline plus elevation, optional mountain/basin bias, and coarse maritime moderation under the `macro.climateEnvelope.temperatureColdLoad` namespace.
- The implemented `stormCorridorField` uses prevailing wind, humidity transport, rain-shadow-adjusted wetness, temperature/cold-load, and maritime exposure with along-flow continuity under the `macro.climateEnvelope.stormDecaySeasonality` namespace.
- The implemented `coastalDecayBurdenField` uses storm corridors, rain-shadow-adjusted wetness, shoreline adjacency, maritime exposure, salt load, and coastal cold-load under the `macro.climateEnvelope.stormDecaySeasonality` namespace.
- The implemented `seasonalityField` uses latitude seasonality anchors, temperature/cold-load, storm corridors, coastal decay burden, land/ocean exposure, and maritime moderation under the `macro.climateEnvelope.stormDecaySeasonality` namespace, and it embeds regional summary buckets by latitude-band type and coarse surface regime.
- The implemented `climateZoneClassification` uses temperature, wetness, storm, and seasonality fields under the `macro.climateEnvelope.climateBands` namespace, segments coarse land climate zones, and assembles `ClimateBandRecord`-compatible records through relief-region geometry when available.
- The implemented `regionalClimateSummaries` output uses the same climate-band namespace to roll emitted `ClimateBandRecord` zones up by relief region, continent body, and sea-region cluster without finalizing `ContinentRecord`, finalizing `SeaRegionRecord`, assembling a full package, or generating pressure outputs.
- The implemented `rainShadowEffect` samples upwind mountain/elevation barrier strength from `mountainAmplificationField`, `seaLevelAppliedElevationField`, optional `landmassCleanupMaskField`, and optional `mountainSystems` record attribution under the `macro.climateEnvelope.rainShadow` namespace.
- The current `wetnessField` combines humidity transport, local hydrosphere moisture sources, latitude baseline, and rain-shadow drying/orographic boost into a pre-classification wetness layer for later analyzers.
- This climate-band microstep must not add biome envelope construction, Phase 2 pressure-package assembly, yearly simulation, gameplay time systems, terrain cells, gameplay weather systems, UI, or gameplay semantics.

### 3.7. Route / Flow Analyzer
Рекомендуемые техники:
- weighted hybrid graph
- Dijkstra / A* families
- all-pairs strategic probing on reduced graph
- route redundancy analysis
- edge betweenness-like scoring

### 3.8. Chokepoint Analyzer
Рекомендуемые техники:
- edge criticality
- articulation region detection
- bypass penalty scoring
- route dependency overlap

### 3.9. Isolation Analyzer
Рекомендуемые техники:
- distance from top strategic cores
- multi-factor path cost
- climatic penalty injection
- route collapse sensitivity

---

## 4. Где вероятности, а где нет

### Вероятности нужны там, где есть вариативность
- число континентальных масс
- степень marine carving
- плотность заливов
- coastal richness variance
- archipelago fragmentation intensity

### Вероятности не должны заменять логику там, где нужна причинность
Например, нельзя делать:
- “randomly create strategic strait”

Нужно делать:
- сначала route graph;
- потом dependency analysis;
- потом choke classification.

---

## 5. Где допустим minimax-like / foresight logic
В этой фазе чистый minimax почти не нужен.

Но допустимы **ограниченные прогнозные оценки**:
- как изменение одного пролива влияет на route dependency;
- как потеря archipelago corridor повлияет на связность мира;
- как перекос core/periphery влияет на исторический потенциал.

То есть здесь используется не adversarial game AI, а **forecast scoring under structural change**.

---

## 6. Validation as algorithm, not afterthought
Validation — часть алгоритма, а не финальная проверка.

### Что проверяется
- разнообразие континентов;
- значимость морей;
- наличие choke regions;
- значимость архипелага;
- наличие strong core / fragile periphery contrast;
- наличие условий для колонизации и распада.

### Что делать при провале
- reroll only marine layer;
- recalc coast opportunity;
- recompute route/choke fields;
- if critical fail, rebuild tectonic skeleton.

---

## 7. Что Codex не должен делать
1. Подменять field synthesis набором ручных if/else картинок.
2. Создавать “интересность” вручную через hard-coded hotspots.
3. Смешивать validation logic с UI/debug logic.
4. Зашивать значения в одном модуле без contracts и docs.
