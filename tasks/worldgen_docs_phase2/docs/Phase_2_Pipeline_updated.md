# Phase_2_Pipeline
## Official pipeline for Phase 2 — Pressure & Environmental Rhythm Generator
**Repository:** `gdrclm/game`  
**Status:** Draft source-of-truth pipeline document after completed Phase 1  
**Audience:** design, engineering, Codex implementation passes  
**Scope:** defines the official execution order, subgenerators, handoffs, validation loops, and ownership boundaries of Phase 2

---

# 1. Purpose

Phase 2 transforms the completed outputs of Phase 1 into the **experienced environmental logic** of the world.

Phase 2 must generate:
- `PressureFieldPackage`
- `EnvironmentalRhythmPackage`

It must explicitly consume:
- `MacroGeographyPackage`
- explicitly permitted sections of `MacroGeographyHandoffPackage`

and turn those into:
- environmental burden truth;
- environmental timing truth;
- environmental recovery/relief truth;
- downstream-usable environmental summaries.

---

# 2. Core principle

Phase 2 generates only:
- environmental burden;
- environmental variability;
- environmental timing;
- environmental recoverability;
- environmental tension;
- environmental relief.

It must not generate ideology, religion, social norms, island history, local layouts, or NPC motives.

---

# 3. Upstream inputs

## 3.1 Required root-package inputs
### Physical records
- `continents`
- `seaRegions`
- `mountainSystems`
- `volcanicZones`
- `riverBasins`
- `climateBands`
- `reliefRegions`

### Structural records
- `archipelagoRegions`
- `coastalOpportunityMap`
- `chokepoints`
- `macroRoutes`
- `isolatedZones`
- `strategicRegions`

### Root support fields
- `macroSeed`
- `worldBounds`
- `validationReport`

## 3.2 Deterministic seed inputs
Phase 2 deterministic helpers may accept only the following seed inputs:
- `pressureSeed` from the Phase 0 downstream-readable sub-seed export namespace `phase2.pressure`, for pressure-side generators.
- `rhythmSeed` from the Phase 0 downstream-readable sub-seed export namespace `phase2.rhythm`, for recovery and rhythm generators.
- `macroSeed` from `MacroGeographyPackage` as a deterministic fallback while Phase 2 intake wiring is still contract-first.
- direct numeric / `testSeed` values only for tests, debug snapshots, and fixtures.

Phase 2 must not derive, register, or rename Phase 0 downstream sub-seeds. Local Phase 2 sub-seed splitting, when introduced, must remain below whichever allowed seed was supplied.

## 3.3 Local sub-seed namespaces
Phase 2 local sub-seeds use dot-separated lowerCamelCase namespaces under the `phase2` root.

Required root namespaces:
- `phase2.intake`
- `phase2.binding`
- `phase2.pressure`
- `phase2.recovery`
- `phase2.rhythm`
- `phase2.validation`
- `phase2.snapshots`

Required child namespaces:
- intake: `phase2.intake.inputBundle`, `phase2.intake.handoffScan`, `phase2.intake.worldBounds`
- binding: `phase2.binding.recordIndex`, `phase2.binding.profileBinding`, `phase2.binding.regionProjection`
- pressure: `phase2.pressure.climate`, `phase2.pressure.terrain`, `phase2.pressure.hydrology`, `phase2.pressure.food`, `phase2.pressure.travel`, `phase2.pressure.chokepoints`, `phase2.pressure.isolation`, `phase2.pressure.ecology`, `phase2.pressure.catastrophe`, `phase2.pressure.synthesis`
- recovery: `phase2.recovery.tempo`, `phase2.recovery.reliefWindows`, `phase2.recovery.stabilization`, `phase2.recovery.forgiveness`
- rhythm: `phase2.rhythm.seasonality`, `phase2.rhythm.storms`, `phase2.rhythm.navigation`, `phase2.rhythm.scarcity`, `phase2.rhythm.predictability`, `phase2.rhythm.synthesis`
- validation: `phase2.validation.packageShape`, `phase2.validation.recordBinding`, `phase2.validation.separation`, `phase2.validation.normalization`, `phase2.validation.determinism`
- snapshots: `phase2.snapshots.pressure`, `phase2.snapshots.rhythm`, `phase2.snapshots.recordBound`, `phase2.snapshots.validation`

Pressure child namespaces must derive below the supplied pressure seed. Recovery and rhythm child namespaces must derive below the supplied rhythm seed. Intake, binding, validation, and snapshot namespaces must not introduce new upstream truth.

## 3.4 Conditionally allowed handoff inputs
Only if separately allowed by `Phase_2_Handoff_From_Phase_1.md`:
- selected `collapsePressureSeeds`
- selected structural summary hints

## 3.5 Optional debug support
Support-only, never primary truth:
- `debugArtifacts.physicalWorldDebugBundle`

### Hard rule
Phase 2 may not invent missing physical truth.

---

# 4. New mandatory pre-generator layer

Before any pressure/rhythm generator runs, Phase 2 must create two upstream interpretation layers:

## 4.1 `Phase2InputBundle`
Canonical bundle of all allowed Phase 1 inputs.

Minimum root-package bundle shape:

```json
{
  "bundleId": "string",
  "phaseId": "PHASE_2",
  "version": "phase2-input-bundle-v1",
  "sourceMacroGeographyPackageId": "string",
  "sourceMacroGeographyVersion": "string",
  "sourceMacroSeed": 0,
  "rootSupport": {
    "macroSeed": 0,
    "version": "string",
    "worldBounds": {
      "width": 0,
      "height": 0
    },
    "validationReport": {}
  },
  "recordCollections": {
    "physical": {
      "continents": [],
      "seaRegions": [],
      "mountainSystems": [],
      "volcanicZones": [],
      "riverBasins": [],
      "climateBands": [],
      "reliefRegions": []
    },
    "structural": {
      "archipelagoRegions": [],
      "coastalOpportunityMap": [],
      "chokepoints": [],
      "macroRoutes": [],
      "isolatedZones": [],
      "strategicRegions": []
    }
  },
  "recordCounts": {},
  "filteredHandoff": {
    "sourceHandoffPackageId": "string | null",
    "sourceHandoffVersion": "string | null",
    "sourceHandoffContractId": "MacroGeographyHandoffPackage",
    "allowedSections": {
      "collapsePressureSeeds": {
        "routeCascadeCandidates": [],
        "specialistLossSensitiveRegions": [],
        "peripheryLossCandidates": [],
        "archipelagoCollapseSensitivity": 0.0
      },
      "summaryForHistoryPhase": {
        "fragilePeripheries": [],
        "routeBelts": [],
        "chokeBelts": []
      }
    },
    "blockedSections": [],
    "intakeMeta": {}
  },
  "optionalDebugArtifacts": {
    "physicalWorldDebugBundle": null
  },
  "intakeMeta": {}
}
```

Root-package intake must fail fast if any required root record collection is missing, non-array, or empty according to Phase 2 minimums. `continents` must contain at least two records; all other required Phase 2 root collections must contain at least one record.

This bundle may not scrape Phase 1 intermediate outputs and may not invent missing records. `MacroGeographyHandoffPackage` sections are not part of the Prompt 9 root-package bundle and must be added only through the explicit filtered handoff intake step.

Filtered handoff intake may copy only these paths:
- `collapsePressureSeeds.routeCascadeCandidates`
- `collapsePressureSeeds.specialistLossSensitiveRegions`
- `collapsePressureSeeds.peripheryLossCandidates`
- `collapsePressureSeeds.archipelagoCollapseSensitivity`
- `summaryForHistoryPhase.fragilePeripheries`
- `summaryForHistoryPhase.routeBelts`
- `summaryForHistoryPhase.chokeBelts`

Filtered handoff intake must block at minimum:
- `colonizationHints`
- `strategicHintsForPolitics`
- `archipelagoRoleSeeds`
- `validationSummary`
- any unlisted subfields under `summaryForHistoryPhase` or `collapsePressureSeeds`

Blocked handoff sections may be logged in `filteredHandoff.blockedSections` and `intakeMeta.blockedHandoffPaths`, but they must not appear inside `filteredHandoff.allowedSections` and must never be promoted to root truth.

## 4.2 `Phase2RecordBindingLayer`
Mandatory layer that:
- binds region ids and record ids;
- aligns scalar support fields with record ownership;
- builds per-record environmental context tables;
- prepares per-record and per-region summary surfaces.

At scaffold stage this layer must already expose:
- canonical record-index tables keyed by root record type and canonical root-record id field;
- primary carrier context tables for `reliefRegions`, `climateBands`, `riverBasins`, `seaRegions`, `mountainSystems`, and `volcanicZones`;
- secondary context tables for `chokepoints`, `macroRoutes`, `isolatedZones`, `archipelagoRegions`, `strategicRegions`, and `continents`;
- profile target tables that keep `PressureFieldPackage.regionalProfiles` and `EnvironmentalRhythmPackage.regionalProfiles` distinct;
- summary-surface tables for direct record profiles, derivative structural profiles, and broader context groups;
- explicit support-only handling for `coastalOpportunityMap`, which remains available to the pipeline but is not a canonical record-bound profile target.

Minimum scaffold shape:

```json
{
  "bindingLayerId": "string",
  "recordBindingContextId": "string",
  "phaseId": "PHASE_2",
  "version": "phase2-record-binding-layer-v1",
  "sourceBundleId": "string",
  "recordIndexTables": {},
  "primaryCarrierContextTables": {},
  "secondaryContextTables": {},
  "profileTargetTables": {},
  "summarySurfaceTables": {},
  "supportCollections": {},
  "bindingMeta": {}
}
```

Primary carrier context tables must remain pre-summary and pre-gameplay at this stage. They exist to bind canonical physical records into internal context surfaces, not to generate environmental prose or downstream interpretation yet.
Secondary context tables must remain subordinate to primary carrier truth. They may widen structural context and group context, but they must not override the Tier 1 physical carriers.

---

# 5. Official outputs

## 5.1 PressureFieldPackage
Mandatory domains:
- climate hostility
- terrain harshness
- water stress
- food stress
- travel exposure
- chokepoint pressure
- isolation burden
- ecological fragility
- catastrophe susceptibility

## 5.2 EnvironmentalRhythmPackage
Mandatory domains:
- seasonality
- storm cadence
- scarcity cadence
- navigation windows
- predictability vs rupture
- recovery tempo
- alternation between stability and disruption

## 5.3 Required support outputs
- record-bound environmental summaries
- regional diagnostics
- debug snapshots
- rebalance metadata
- validation report

---

# 6. Phase division

## Phase 2A — Pressure Synthesis
Generates burden, risk, fragility, and persistence.

## Phase 2B — Recovery / Relief Synthesis
Protected subsystem that generates:
- recovery tempo
- stabilization interval
- relief persistence
- environmental forgiveness
- meaningful recovery structure

## Phase 2C — Rhythm Synthesis
Generates cadence, timing, windows, predictability, and rupture.

### Important rule
Pressure and rhythm must be related, but not collapsed into one scalar system.  
Recovery/relief must not be treated as an optional afterthought inside rhythm.

---

# 7. Climate ownership clarification

## Phase 1 owns
- climate formation
- climate envelopes
- climate bands
- storm corridors
- coarse seasonality at physical-world level

## Phase 2 owns
- lived burden from climate truth
- lived timing relevance from climate truth
- recovery/relief implications of climate interacting with other systems

### Hard prohibition
Phase 2 must not rebuild climate generation.

---

# 8. Official execution order

```text
phase1 package intake
→ allowed handoff intake
→ record binding
→ normalization
→ climate burden interpretation
→ terrain harshness
→ hydrology stress
→ food reliability burden
→ travel exposure
→ chokepoint pressure
→ isolation burden
→ ecological fragility
→ catastrophe susceptibility
→ pressure synthesis
→ recovery / relief synthesis
→ seasonality interpretation
→ storm cadence interpretation
→ navigation windows
→ scarcity cadence
→ predictability / rupture
→ rhythm synthesis
→ summaries
→ validation
→ selective rebalance
→ export
```

---

# 9. Detailed pipeline

## 9.1 Phase1PackageIntake
Collect official `MacroGeographyPackage`, allowed handoff sections, and optional debug support.

## 9.2 Phase2RecordBindingLayer
Bind Phase 1 records to Phase 2 environmental interpretation through canonical record-index tables, primary carrier context tables, secondary context tables, profile target tables, and summary-surface scaffolds.

## 9.3 FieldNormalizationLayer
Normalize heterogeneous upstream fields and record-derived scalars through reusable scalar helpers that keep provenance metadata and preserve contrast by default without smoothing.

## 9.4 ClimateBurdenInterpreter
Interpret Phase 1 climate truth as lived burden.

## 9.5 TerrainHarshnessGenerator
Generate burden from terrain form.

## 9.6 HydrologyStressGenerator
Generate environmental pressure from water logic.

## 9.7 FoodReliabilityGenerator
Translate terrain, water, and climate interpretation into food pressure.

## 9.8 TravelExposureGenerator
Generate burden of movement through the world.

## 9.9 ChokepointPressureGenerator
Generate pressure created by narrow dependencies.

## 9.10 IsolationBurdenGenerator
Generate burden from remoteness and disconnection.

## 9.11 EcologicalFragilityGenerator
Model how easily local support systems destabilize.

## 9.12 CatastropheSusceptibilityGenerator
Generate large-scale environmental break risk.

## 9.13 PressureSynthesis
Combine pressure-domain subfields into official environmental burden truth.

## 9.14 RecoveryReliefSynthesis
Generate explicit environmental recovery structure.

## 9.15 SeasonalityInterpreter
Interpret existing seasonal structure as lived environmental cycle.

## 9.16 StormCadenceInterpreter
Interpret climatic/storm structural truth as timing and burst logic.

## 9.17 NavigationWindowGenerator
Generate when movement is realistically reliable.

## 9.18 ScarcityCadenceGenerator
Generate how scarcity rises and relaxes across time.

## 9.19 PredictabilityRuptureAnalyzer
Measure whether the world feels cyclical, stable, erratic, or rupture-prone.

## 9.20 EnvironmentalRhythmSynthesis
Combine rhythm-domain subfields into official temporal environmental truth.

## 9.21 SummaryGeneration
Generate readable summaries from official fields and record bindings.

## 9.22 Validation
Verify structure, causality, design-usefulness, gameplay-relevance, anti-leakage, anti-duplication, and record-binding completeness.

## 9.23 SelectiveRebalance
Correct local failure without rerolling upstream truth.

## 9.24 Export
Export final packages and validation-facing metadata.

---

# 10. Ownership boundaries

## Phase 2 owns
- environmental burden
- environmental timing
- environmental recoverability
- environmental pressure profiles
- environmental rhythm profiles
- gameplay-adjacent but pre-narrative environmental truth
- record-bound environmental summaries

## Phase 2 does not own
- religion
- moral interpretation
- political structure
- island history
- settlement graphs
- NPC intention
- final scenario authorship

---

# 11. Acceptance criteria

## Pipeline criteria
- every official subgenerator exists with clear ownership
- `Phase2RecordBindingLayer` exists
- pressure and rhythm are distinct
- recovery/relief is present as protected subsystem
- export happens only after validation

## Design criteria
- the phase generates both tension and relief
- the phase preserves causal linkage to completed Phase 1 structure
- the phase does not flatten the world into uniform hostility
- different regions can support different environmental play styles
- climate is interpreted, not regenerated

## Failure criteria
Phase 2 fails if:
- it is implemented as one monolithic generator;
- it produces only difficulty scalars;
- it exports punishment without recovery logic;
- it duplicates climate generation;
- it remains record-blind.
