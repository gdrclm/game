# Phase_2_Handoff_From_Phase_1
## Official input contract from completed Phase 1 into Phase 2
**Repository:** `gdrclm/game`  
**Status:** Draft source-of-truth handoff document  
**Audience:** design, engineering, Codex implementation passes  
**Scope:** defines exactly what Phase 2 may read from completed Phase 1, what is optional, and what is forbidden

---

# 1. Purpose

This document exists because Phase 1 is now completed and exports both:
- `MacroGeographyPackage`
- `MacroGeographyHandoffPackage`

Phase 2 must therefore stop behaving like a speculative consumer of incomplete geography and instead become an explicit downstream consumer of official Phase 1 exports.

This document prevents:
- ad-hoc upstream assumptions;
- climate duplication;
- political/history leakage into Phase 2;
- direct dependence on unstable intermediate outputs;
- record-blind environmental math.

---

# 2. Core rule

Phase 2 reads **official exports** from completed Phase 1.

Phase 2 must not:
- bypass root package and scrape arbitrary implementation internals;
- invent missing physical truth;
- treat handoff hints as historical canon;
- read political meaning as environmental truth.

---

# 3. Allowed inputs from `MacroGeographyPackage`

## 3.1 Physical summary records
- `continents`
- `seaRegions`
- `mountainSystems`
- `volcanicZones`
- `riverBasins`
- `climateBands`
- `reliefRegions`

## 3.2 Structural / macro records
- `archipelagoRegions`
- `coastalOpportunityMap`
- `chokepoints`
- `macroRoutes`
- `isolatedZones`
- `strategicRegions`

## 3.3 Root-level support
- `macroSeed`
- `version`
- `worldBounds`
- `validationReport`
- `environmentalCoverage` when present

`environmentalCoverage` provides exact land cell counts and intersections of relief regions, climate bands and watershed footprints at the macro grid resolution. Pressure and rhythm use those intersections to carry water stress into food stress and to bind environmental conditions to the local relief. Environmental pressure and recovery summaries can then weight local values by their measured land area. Travel, chokepoint and isolation pressure keep their structural carriers. Phase 2 intake accepts earlier roots without the optional coverage block and uses the record links they provide.

## 3.4 Debug artifacts
Phase 2 may read `debugArtifacts.physicalWorldDebugBundle` only:
1. when explicitly needed by a documented subgenerator or validator;
2. never as replacement for canonical records;
3. never as hidden dependency that makes root-package records optional.

---

# 4. Inputs Phase 2 should treat as primary

Primary environmental truth sources:
- `reliefRegions`
- `mountainSystems`
- `riverBasins`
- `seaRegions`
- `volcanicZones`
- `climateBands`
- `chokepoints`
- `macroRoutes`
- `isolatedZones`

---

# 5. Inputs Phase 2 should treat as secondary context

May inform weighting, clustering, or summaries, but must not override primary truth:
- `continents`
- `archipelagoRegions`
- `coastalOpportunityMap`
- `strategicRegions`
- package-level validation summaries

---

# 6. Allowed inputs from `MacroGeographyHandoffPackage`

## 6.1 Conditionally allowed
Potentially allowed, if documented per use-case:
- `collapsePressureSeeds.routeCascadeCandidates`
- `collapsePressureSeeds.specialistLossSensitiveRegions`
- `collapsePressureSeeds.peripheryLossCandidates`
- `collapsePressureSeeds.archipelagoCollapseSensitivity`

## 6.2 Limited structural summaries
Potentially allowed for coarse context weighting only:
- `summaryForHistoryPhase.fragilePeripheries`
- `summaryForHistoryPhase.routeBelts`
- `summaryForHistoryPhase.chokeBelts`

These may be used only if:
- they strengthen already-existing environmental structural interpretation;
- they do not become substitutes for root-package records;
- they are documented in Phase 2 contracts.

---

# 7. Forbidden handoff inputs for Phase 2

Phase 2 must not directly consume the following as environmental truth:
- `strategicHintsForPolitics.*`
- `colonizationHints.*`
- `archipelagoRoleSeeds.historicalRoleBias`
- `empireCandidates`
- `maritimeRivalryZones`
- `coalitionPressureRegions`
- any handoff field whose meaning is already political, historical, or role-interpretive

These belong to later phases.

---

# 8. Climate duplication rule

Phase 1 already exports climate truth through:
- `climateBands`
- related climate-envelope-derived physical results

Therefore:

## Phase 1 owns
- climate formation
- climate envelopes
- climate bands
- large climate differentiation

## Phase 2 owns
- lived burden from climate
- exposure from climate
- timing relevance from climate
- predictability / rupture relevance from climate
- recovery / relief consequences of climate interaction with other systems

### Hard prohibition
Phase 2 must not reimplement climate generation as if Phase 1 had not already done it.

---

# 9. Record-binding requirement

Because Phase 1 now exports rich records, Phase 2 must include a record-binding layer.

Phase 2 is invalid if it treats completed Phase 1 only as anonymous scalar source fields.

---

# 10. Input hierarchy

## Tier 1 — Canonical root records
- `reliefRegions`
- `mountainSystems`
- `riverBasins`
- `seaRegions`
- `volcanicZones`
- `climateBands`
- `chokepoints`
- `macroRoutes`
- `isolatedZones`

## Tier 2 — Root structural context
- `continents`
- `archipelagoRegions`
- `coastalOpportunityMap`
- `strategicRegions`

## Tier 3 — Explicitly permitted handoff hints
Only when contracted:
- `collapsePressureSeeds.*`
- limited summary belts/periphery hints

## Tier 4 — Debug support
Only if explicitly needed:
- `debugArtifacts.physicalWorldDebugBundle`

---

# 11. Required downstream discipline

If Phase 2 implementation needs some Phase 1 truth that is not available in the official exports, the correct action is:
1. stop;
2. identify missing upstream contract;
3. update Phase 1 docs/contracts first;
4. resume only after explicit handoff exists.

Missing upstream truth must never be invented locally inside Phase 2.


## Foundation Closure record links

`seaRegions[].stormPressure` combines the actual Phase 1 storm corridor field
over the basin and its hydrosphere roughness. Coastal relief regions cite
adjacent `seaRegionId` values from spatial contact and measured island landfalls.
Storm break risk uses those linked sea records, and storm cadence uses the sea
references on climate bands. Both domains preserve their distinct outputs.

`isolatedZones[].seaRegionIds` can carry canonical sea references measured at
the underlying coastal nodes. The references support environmental profiles
for offshore isolation. Empty input remains valid for inland zones.

`isolatedZones[].reliefRegionIds` optionally links those nodes to their
physical relief. Recovery reads those local links alongside existing
continent references. Routes use the canonical waypoint sequence in
`macroRoutes[].through`. Record binding resolves relief, sea, and measured
chokepoint references for travel exposure, navigation windows, and recovery.
A measured chokepoint enters the sequence when the sampled route crosses its
aperture and closing it increases the cost or breaks that route.

Pressure and rhythm packages may carry `summaryMetadata.pressure` or
`summaryMetadata.rhythm` respectively. The generator records the field IDs
used by its summaries. Every exported regional summary retains the source
package and canonical record ID.

The capacity for recovery uses the accessible fraction of the relief and the
freshwater support of its attached catchments. Catchment area limits the
amount of water available even where runoff stays connected. The synthesized
readiness field accounts for the interval before stabilization. Local timing
fields remain directly visible.

## Regional island environmental interpretation (additive)
Phase 2 intake carries the validated Phase 1 `regionalArchipelago.islandEnvironment` in root support. The gated export bundle may include `regionalIslandEnvironmentalProjection` with one row per physical island. Inherited climate-band pressure and seasonality signals are weighted by measured covered land cells and are null at zero coverage. The interpolated local climate and physical source measurements remain available on the same row.

- `localPressure.seasonalInflowReduction` measures the difference between ordinary and low-season input in wetness times macro-cell area. `exposedLandStormContribution` is the exposed land's area-weighted contribution to the island-wide inherited storm index.
- `localRecovery.lowSeasonAllocatedSupplyPerLandArea` normalizes the conserved low-season budget over all island land. Phase 1's optional `shelteredWaterAccess` summarizes the same water measurements over the cells measured as wind-sheltered. Its `reachableCellCount` is the joint count on the regional grid. Allocation to the subset uses the full dry-land service area of each source.
- `windShelteredLandWithSourceAccess.exactLandCells` gives the measured overlap when present. The two compatible bounds then equal this count. Earlier packages without the subset keep their bounds from the two marginal counts. `habitatInflowPerLandArea` normalizes ordinary and low-season input for the whole island and sheltered land, using `cellAreaInMacroCells`. `lowSeasonAllocatedSupplyPerShelteredLandArea` uses the budget allocated to reachable sheltered cells divided by all sheltered area. A measured empty sheltered area has null densities.

Local fields use the island's own measurements regardless of its climate-band coverage. Missing measurements omit the dependent fields. The joint count describes the location from which the dry-land path starts. Geometry, storage capacity, landfall and sea links remain physical context. Potability, storage duration, attenuation on sheltered land, the exposure of the path to the source, and the amount of incoming external supply require additional evidence. The local interpretation is separate in scale from the synthesized macro recovery profile.

New inputs can carry validated `reliefWaterAccess` from Phase 1 `environmentalCoverage.localWater.reliefRegions`. The gated export carries these summaries and the island projection includes `waterAccess` when present. Full macro branch records stay in the Phase 1 source. Precipitation proxy, low-season sensitivity, sill space, reachable area, route length and ascent remain distinct measurements. The ratio of the two measured inflows constrains the hydrological contribution to recovery under repeated stress in each relief region. The existing pressure model continues to use the basin layer. When measured inflow is available, recovery tempo uses basin structural reliability for capacity and retains drought in its scarcity response. Earlier inputs without relief water observations retain the previous basin interpretation.

The regional projection also carries `physicalSetting`. Wind-relative terrain shelter, heat and cold ranges, sea connectivity, landfall distance and ascent remain independent of water input and seasonal flow. The source flow at the nearest reachable feature is available in `waterAccess` where Phase 1 measured it.
