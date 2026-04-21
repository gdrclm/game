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

`archipelagoRegions[]` may blend physical morphology summary with strategic-significance references. They may point to shaping `seaRegions[]` / `climateBands[]` and to already-derived route/chokepoint/strategic-region context, but they must not encode downstream island histories directly inside the root package.

`chokepoints[]` is a strategic structural layer. `ChokepointRecord` should describe narrow straits, island-chain locks, or other macro bottlenecks through control/dependency/sensitivity descriptors and adjacency refs, without encoding derived route metrics or local traversal gameplay rules inside the root contract.

`macroRoutes[]` is a strategic structural layer. `MacroRouteRecord` should describe high-level corridors through endpoint refs, ordered intermediate refs, and normalized cost/fragility/redundancy descriptors, without encoding built route graphs or island traversal runtime semantics inside the root contract.

`strategicRegions[]` is a strategic structural layer. `StrategicRegionRecord` should summarize high-level region roles and normalized value balance through `valueMix`, `stabilityScore`, and `expansionPressure`, without embedding historical interpretation or named-polity meaning inside the root contract.

`debugArtifacts`, when present, should stay UI-free and contract-safe. `debugArtifacts.physicalWorldDebugBundle` is the canonical container for Phase 1 debug exports such as seed artifacts, field snapshots, graph snapshots, summaries, intermediate outputs, and validation-facing artifacts. Inside `fieldSnapshots`, canonical `fieldSnapshot` payloads may use `snapshotType: "scalarHeatmap"` for renderer-agnostic `ScalarField` exports or `snapshotType: "directionalVectors"` for renderer-agnostic `DirectionalField` exports. These field exports are discoverable through the UI-free `fieldDebugRegistry`; the registry must not become a dev panel or gameplay dependency. Relief/elevation debug snapshots may expose elevation, land/water, cleanup, and relief-region type-mask views through the same registry format without constructing a full bundle. This bundle is optional and must not become a downstream gameplay dependency.

`validationReport` is the official final validation contract for Phase 1. It should expose normalized scores, diagnostics, and selective reroll recommendations, but it must not execute orchestration decisions by itself.
