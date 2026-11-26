# DATA CONTRACT — MACRO GEOGRAPHY PACKAGE

## Root contract

```json
{
  "macroSeed": 0,
  "version": "phase1-v1",
  "worldBounds": {
    "width": 0,
    "height": 0
  },
  "plates": [],
  "continents": [],
  "seaRegions": [],
  "mountainSystems": [],
  "volcanicZones": [],
  "riverBasins": [],
  "climateBands": [],
  "reliefRegions": [],
  "archipelagoRegions": [],
  "coastalOpportunityMap": [],
  "chokepoints": [],
  "macroRoutes": [],
  "isolatedZones": [],
  "strategicRegions": [],
  "debugArtifacts": {},
  "validationReport": {}
}
```

## Required keys
- `macroSeed`
- `version`
- `plates`
- `continents`
- `seaRegions`
- `mountainSystems`
- `volcanicZones`
- `riverBasins`
- `climateBands`
- `reliefRegions`
- `archipelagoRegions`
- `chokepoints`
- `macroRoutes`
- `strategicRegions`
- `validationReport`

## Optional but recommended
- `climateBands`
- `coastalOpportunityMap`
- `isolatedZones`
- `environmentalCoverage`
- `regionalArchipelago`
- `debugArtifacts`

## Physical outputs
- `plates`
- `continents`
- `seaRegions`
- `mountainSystems`
- `volcanicZones`
- `riverBasins`
- `climateBands`
- `reliefRegions`

## Strategic outputs
- `archipelagoRegions`
- `coastalOpportunityMap`
- `chokepoints`
- `macroRoutes`
- `isolatedZones`
- `strategicRegions`

## Semantic constraints
1. `plates.length >= 1`
2. `continents.length >= 2`
3. `seaRegions.length >= 1`
4. `mountainSystems.length >= 1`
5. `riverBasins.length >= 1`
6. `climateBands.length >= 1`
7. `reliefRegions.length >= 1`
8. `archipelagoRegions.length >= 1`
9. `chokepoints.length >= 1`
10. `macroRoutes.length >= 1`
11. `strategicRegions.length >= 1`
12. validation report must always exist even on failed generation.

## Contract note
The root package now carries both physical outputs and strategic outputs in the same flat `MacroGeographyPackage`.

`continents[]` is a physical summary layer. `ContinentRecord` should link into upstream physical records such as `plates`, `reliefRegions`, and `climateBands`, while strategic interpretation stays in downstream macro analyzers and handoff layers.

`seaRegions[]` is also a physical summary layer. `SeaRegionRecord` should describe basin type, preliminary navigability, and climate-band references, while route, rivalry, and other strategic marine semantics stay in downstream analyzers and handoff outputs.

`mountainSystems[]` is a physical summary layer. `MountainSystemRecord` should link into upstream `plates` and `reliefRegions` while exposing only uplift/ridge descriptors, without encoding downstream climate effects or traversal logic inside the root contract.

`volcanicZones[]` is a physical summary layer. `VolcanicZoneRecord` should classify source origin such as `arc`, `hotspot`, or `fissure` and link into upstream `plates`, `reliefRegions`, and optional `mountainSystems`, without encoding resource or gameplay semantics inside the root contract.

`riverBasins[]` is a physical summary layer. `RiverBasinRecord` should link into upstream `reliefRegions`, optional `climateBands`, optional source `mountainSystems`, and optional terminal `seaRegions`, without encoding river routing or local gameplay semantics inside the root contract. During hydrology-stage output, climate references may remain empty until the later climate blend step; final package validation may still require climate completeness when that phase is implemented.

`climateBands[]` is a physical summary layer. `ClimateBandRecord` should link into upstream `reliefRegions` and optional `seaRegions` while exposing only normalized thermal/moisture/seasonality descriptors, without encoding climate simulation or gameplay weather rules inside the root contract.

`reliefRegions[]` is a physical summary layer. `ReliefRegionRecord` should classify large landform families such as `mountain`, `plateau`, `plain`, `basin`, or `coast` and link into upstream `plates`, optional `continents`, and optional `seaRegions`, without encoding extracted terrain cells or local biome props inside the root contract.

`environmentalCoverage` version `1` records intersections of the final land mask with the exported relief, climate and watershed footprints. Each of `reliefRegions`, `climateBands` and `riverBasins` maps the corresponding exported IDs to a nonnegative integer `landCellCount`. Climate bands may have zero land coverage. A relief entry can carry `climateBandCells` and `riverBasinCells`. A climate entry can carry `riverBasinCells`. The maps count only positive intersections. Their counts fit within the source and target land areas, and an absent intersection map describes an empty measured intersection. Earlier roots may omit the whole block. Generation uses the same physical sources in normal and diagnostic runs.

Optional `environmentalCoverage.localWater` version `1` publishes the terminal branches routed on the final signed surface. `branches[]` have stable `drainage_outlet_<cell>` IDs, receiver cells or an unresolved land depression, exact contributing cell counts and measured intersections with the legacy river basins and relief records. Every branch can be linked to more than one record, and every represented carrier conserves its measured area across the branches.

`inputPotential` sums the upstream wetness index times sample area. `lowInputPotential` attenuates the source at each sample by its seasonality index and is a sensitivity bound. An inland depression may record its first edge spill elevation and `storageSpace` under that sill, in normalized elevation times macro-cell area. Water already above sea level, lake levels, infiltration, potability and permeability require further sources. `reliefRegions` summarizes local source cells and reachable land. A source is a confluence of at least two positive feeder flows or a depression with both input and sill space. Access follows cardinal dry-land steps to the nearest source, preferring lower cumulative ascent among equally short paths. `meanDistance` in macro-cell lengths and `meanAscent` in normalized elevation are null if the carrier cannot reach a source.

### Regional archipelago

`regionalArchipelago` version `1` is a prehistorical refinement of an existing `ArchipelagoRegionRecord`. It includes the parent ID, source hotspot, macro-island identities, namespace-derived regional seed, crop origin in macro cells and grid subdivision. Height and depth use the same normalized sea-level datum as `finalRelativeElevationField`. Footprint area and shoreline length use macro-cell units.

Each `islandRecords` entry is a connected land component. Its ID uses its highest grid anchor in world coordinates. The record includes the anchor and centroid, footprint runs `[rowMajorStart, length]`, shoreline land/water pairs, area, elevation range, mean slope, nearshore depth and physical provenance. The water network publishes a representative landfall where open water is present and paths using cardinal water neighbors on the same refined grid. Links have measured length and depths. The largest connected component and several minimum-area counts are diagnostics of physical capacity.

`elevationRaster` is the row-major regional surface. `encoding` is `float32-le-base64` and `samplesBase64` contains four little-endian IEEE 754 bytes per grid sample. A positive sample is land. Zero and negative samples denote water at or below sea level. The sample index is shared with footprint runs, coastline edges and paths. `decodeRegionalElevation(regionalArchipelago)` returns the original signed raster as a `Float32Array`. Earlier regional records may omit the raster. Newly generated records include it in the canonical Phase 1 package without requiring a debug export.

For new exports, `sourcePeaks` and `sourceVents` are canonical physical source records, not debug-only evidence. Vent records retain parent peak cell, world coordinates, effective rise and radius. Island vent references resolve to these records. `summary.areaSensitivity[].largestConnectedEligibleCount` counts the largest number of area-eligible landfalls in one actual water-network component; transit through smaller physical islands is allowed. The area thresholds remain sensitivity diagnostics, not a gameplay size or vessel capability policy. A raster-backed island must be one complete connected land component, have its entire true shoreline, and match measured elevation, slope, centroid, anchor and depths. Legacy records may omit the additive source/capacity fields, but new foundation exports require them.

The regional surface keeps shared macro samples and protects macro land and water continuity. Sub-resolution volcanic uplift uses local permeability maxima on the source plume and a volume budget derived from resolved uplift. Fracture and shore erosion affect the low-relief margin. If emergence joins inherited bodies, the regional model retains higher terrain first and restores inherited depths only at newly raised cells that would complete a land connection. A diagnostic process attempt reports the count as `restoredSeparationCells`. If constraints remain, the bounded source attenuation path is still available. The inherited raster, change mechanisms and vent positions remain available in the spatial debug bundle. Historical phases may use the physical records as carriers. Thirty roles, expedition order and playability remain separate decisions. Earlier Phase 1 packages may omit this versioned block.

An island generated through fault uplift has newly raised land. If fault displacement or erosion separates preexisting land, the generated `fault_fragment` or `erosional_fragment` record includes `physicalOrigin.restoredSeparationPath`. The path begins in the island, crosses drowned cells of the named mechanism and reaches a distinct component of the current land mask. Every intermediate sample was above the inherited sea level. A shoreline change without a severed connection does not qualify as fragmentation. When either mechanism independently supplies such a path, the shorter path determines the primary recorded mechanism, with fault displacement first on ties.

`islandEnvironment.records[]` may carry the access summary as `waterAccess`, plus seasonal input and spill measurements on the island's own `catchments[]`. Area uses the squared regional subdivision and distance uses the linear subdivision. Routing and storage use regional heights and a land path cannot connect separate islands. The macro and regional measurements use the same routing rules on their respective surfaces.

A volcanic satellite records the `primaryRegionalVentId` attributed to the most newly raised cells. `parentPeakCell` resolves to that vent's parent. An inherited island keeps the peak of its macro island. Older geographic records can lack a primary vent reference.

`archipelagoRegions[]` may blend physical morphology summary with strategic-significance references. They may point to shaping `seaRegions[]` / `climateBands[]` and to already-derived route/chokepoint/strategic-region context, but they must not encode downstream island histories directly inside the root package.

`chokepoints[]` is a strategic structural layer. `ChokepointRecord` should describe narrow straits, island-chain locks, or other macro bottlenecks through control/dependency/sensitivity descriptors and adjacency refs, without encoding derived route metrics or local traversal gameplay rules inside the root contract.

`macroRoutes[]` is a strategic structural layer. `MacroRouteRecord` should describe high-level corridors through endpoint refs, ordered intermediate refs, and normalized cost/fragility/redundancy descriptors, without encoding built route graphs or island traversal runtime semantics inside the root contract.

`strategicRegions[]` is a strategic structural layer. `StrategicRegionRecord` should summarize high-level region roles and normalized value balance through `valueMix`, `stabilityScore`, and `expansionPressure`, without embedding historical interpretation or named-polity meaning inside the root contract.

`debugArtifacts`, when present, should stay UI-free and contract-safe. `debugArtifacts.physicalWorldDebugBundle` is the canonical container for Phase 1 debug exports such as seed artifacts, field snapshots, graph snapshots, summaries, intermediate outputs, and validation-facing artifacts. Inside `fieldSnapshots`, canonical `fieldSnapshot` payloads may use `snapshotType: "scalarHeatmap"` for renderer-agnostic `ScalarField` exports or `snapshotType: "directionalVectors"` for renderer-agnostic `DirectionalField` exports. These field exports are discoverable through the UI-free `fieldDebugRegistry`; the registry must not become a dev panel or gameplay dependency. Relief/elevation debug snapshots may expose elevation, land/water, cleanup, and relief-region type-mask views through the same registry format without constructing a full bundle. This bundle is optional and must not become a downstream gameplay dependency.

`validationReport` is the official final validation contract for Phase 1. It should expose normalized scores, diagnostics, and selective reroll recommendations, but it must not execute orchestration decisions by itself.

### Regional island environment (additive V1)
`regionalArchipelago.islandEnvironment` records the physical climate baseline for each island, measured by bilinear sampling of macro temperature, cold load, wetness, storm and seasonality fields. These are normalized signals, not a resolved local climate simulation. Nearest macro samples bind only to actual canonical climate-band IDs; missing coverage is counted explicitly. Strictly downhill drainage on each complete island's signed raster partitions its land into outlets, with ocean, inland-water and unresolved depression receivers. Runoff potential is wetness multiplied by macro-cell area, not fresh-water volume, storage, or potability. No mainland watershed is copied to an island. New foundation exports require one record per island; earlier packages may omit the block.
