# codex_phase2_prompts_92
## Rebuilt prompt-pack for Codex — Phase 2 after completed Phase 1
**Repository:** `gdrclm/game`  
**Prompt count target:** 85–100  
**Actual prompt count:** 95  
**Goal:** give Codex narrow, contract-safe, low-ambiguity microtasks for implementing Phase 2 on top of the rebuilt documentation stack.

---

# 0. Global read-first stack for every prompt

Before each prompt, Codex must read:

## Governance
- `Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`

## Completed Phase 1
- `macro_geography_package.md`
- `macro_geography_handoff_package.md`
- relevant Phase 1 overview / pipeline / validation docs
- `00_context_and_repo_integration.md`

## Phase 2 core docs
- `Phase_2_Overview.md`
- `Phase_2_Handoff_From_Phase_1.md`
- `Phase_2_Pipeline_updated.md`
- `Phase_2_Codex_Execution_Protocol_updated.md`

## Phase 2 contracts
- `PressureFieldPackage.md`
- `EnvironmentalRhythmPackage.md`
- `Phase_2_Record_Binding_Contract.md`
- `Phase_2_Field_Contracts_updated.md`

## Phase 2 quality / integration docs
- `Phase_2_Validation_updated.md`
- `Phase_2_Rebalance_Rules.md`
- `Phase_2_Test_Strategy.md`
- `Phase_2_Debug_And_Snapshots.md`
- `Phase_2_Runtime_Adapter_Mapping.md`
- `Phase_2_Gameplay_Meaning_Guide.md`
- `Phase_2_Gameplay_Projection_Contract_updated.md`
- `Phase_2_Design_Risks.md`
- `Phase_2_Profile_Families.md`

## Codex execution layer
- `Phase_2_Task_Backlog.md`
- `Phase_2_Task_Packs.md`
- `Phase_2_Progress_Log.md`

---

# 1. Global prohibitions for every prompt

Codex must not:
- mix pressure and rhythm;
- weaken or postpone recovery / relief;
- duplicate climate generation already owned by completed Phase 1;
- import forbidden political or history-facing handoff semantics;
- ignore record binding;
- flatten Phase 2 into scalar difficulty;
- bypass validation;
- export invalid packages;
- silently drift contracts or summaries.

After each prompt, Codex must:
- list changed files;
- state what was done;
- state what was intentionally not done;
- update `Phase_2_Progress_Log.md`;
- note contract / validation / gameplay-meaning impact.

---

# 2. Prompt pack


# 1A. Mandatory launch order

Run prompts in this exact order.

## Stage A — Foundations
Run:
- Prompt 1 -> 16

Do not start Prompt 17 until:
- all Stage A prompts are completed;
- package schemas exist;
- `Phase2InputBundle` exists;
- `Phase2RecordBindingLayer` exists;
- normalization and validation-report scaffolding exist.

## Stage B — Code-level contracts and schemas
Run:
- Prompt 17 -> 32

Do not start Prompt 33 until:
- all domain schemas exist;
- synthesized schema helpers exist;
- no field naming drift remains unresolved.

## Stage C — Pressure side
Run:
- Prompt 33 -> 60

Do not start Prompt 61 until:
- pressure domains are implemented;
- pressure synthesis exists;
- no unresolved pressure-side schema conflicts remain.

## Stage D — Recovery / Rhythm side
Run:
- Prompt 61 -> 78

Do not start Prompt 79 until:
- recovery / relief is implemented as real field truth;
- rhythm synthesis exists;
- pressure/rhythm separation still passes review.

## Stage E — Summaries / Validation / Rebalance
Run:
- Prompt 79 -> 89

Do not start Prompt 90 until:
- validation families exist;
- summary generation exists;
- rebalance shell exists.

## Stage F — Orchestration / Export / Tests / Final sync
Run:
- Prompt 90 -> 95

This final stage must remain last.

---

# 1B. Per-prompt dependency rule

Inside each stage:
- run prompts in numeric order;
- do not skip forward;
- do not merge neighboring prompts into one larger task;
- do not treat later calibration prompts as optional;
- do not begin a prompt if the previous prompt in the same stage failed acceptance.

## Hard stop rules
- If a prompt changes contracts, update docs in the same prompt.
- If a prompt reveals missing Phase 1 truth, stop and repair upstream contracts first.
- If a prompt breaks pressure/rhythm separation, stop and fix before continuing.
- If a prompt weakens recovery / relief, stop and fix before continuing.
- If validation says `fail`, do not proceed to the next stage.

## Prompt 1

**Stage:** Stage A — Foundations

**Launch rule:** Run after reading the full global read-first stack.


**Task:** Audit existing repo structure and choose canonical code path for Phase 2 modules

Need:
- determine final folder/module location for Phase 2 implementation inside `gdrclm/game`
- check whether shared helpers/field abstractions already exist and should be reused
- write the architectural decision into `Phase_2_Progress_Log.md`

Do not:
- create generators
- change runtime behavior
- invent new global architecture unrelated to repo patterns

Acceptance:
- canonical path is explicit
- decision does not conflict with existing repo structure
- progress log entry created



## Prompt 2

**Stage:** Stage A — Foundations

**Launch rule:** Run only after **Prompt 1** is completed and its acceptance conditions are satisfied.


**Task:** Create Phase 2 folder skeleton separated into contracts, intake, binding, pressure, recovery, rhythm, validation, rebalance, debug, export, orchestration, tests

Need:
- create directories and minimal module entry files
- mark all placeholders as contract-first stubs

Do not:
- implement field logic
- touch runtime systems

Acceptance:
- pressure/recovery/rhythm physically separated
- stubs are clearly marked
- no UI coupling



## Prompt 3

**Stage:** Stage A — Foundations

**Launch rule:** Run only after **Prompt 2** is completed and its acceptance conditions are satisfied.


**Task:** Create code-level schema for `PressureFieldPackage`

Need:
- implement stable root shape matching docs
- add basic schema validator
- fail on missing required domains

Do not:
- add rhythm fields
- implement burden calculations

Acceptance:
- validator catches missing domains
- shape matches package doc
- no burden/timing mixing



## Prompt 4

**Stage:** Stage A — Foundations

**Launch rule:** Run only after **Prompt 3** is completed and its acceptance conditions are satisfied.


**Task:** Create code-level schema for `EnvironmentalRhythmPackage`

Need:
- implement stable root shape matching docs
- add validator
- make recovery domain mandatory

Do not:
- add pressure semantics
- make recovery optional

Acceptance:
- validator rejects missing recovery domain
- shape matches docs
- timing semantics preserved



## Prompt 5

**Stage:** Stage A — Foundations

**Launch rule:** Run only after **Prompt 4** is completed and its acceptance conditions are satisfied.


**Task:** Create code-level schema for record-bound profile payloads shared by both packages

Need:
- implement stable shape for record-aware profiles
- include `recordType`, `recordId`, signal sections, summary fields

Do not:
- invent new record families
- allow profile ids without canonical record ids

Acceptance:
- profile schema is reusable
- canonical record binding required



## Prompt 6

**Stage:** Stage A — Foundations

**Launch rule:** Run only after **Prompt 5** is completed and its acceptance conditions are satisfied.


**Task:** Create shared contract export index for Phase 2

Need:
- export package schemas, domain schemas, profile schemas, validators from a single import point

Do not:
- implement generators
- mix export index with runtime adapter code

Acceptance:
- single contract import surface exists
- no circular imports



## Prompt 7

**Stage:** Stage A — Foundations

**Launch rule:** Run only after **Prompt 6** is completed and its acceptance conditions are satisfied.


**Task:** Create deterministic Phase 2 RNG helper

Need:
- implement deterministic RNG wrapper for Phase 2
- document allowed seed inputs

Do not:
- use `Math.random` directly
- rebuild Phase 0 seed system

Acceptance:
- deterministic helper exists
- API is reusable across subgenerators



## Prompt 8

**Stage:** Stage A — Foundations

**Launch rule:** Run only after **Prompt 7** is completed and its acceptance conditions are satisfied.


**Task:** Create Phase 2 sub-seed derivation helper

Need:
- derive stable local sub-seeds for intake, binding, pressure, recovery, rhythm, validation, snapshots

Do not:
- change Phase 0 contracts
- generate fields here

Acceptance:
- stable sub-seed namespaces exist
- naming is documented



## Prompt 9

**Stage:** Stage A — Foundations

**Launch rule:** Run only after **Prompt 8** is completed and its acceptance conditions are satisfied.


**Task:** Create `Phase2InputBundle` root-package intake module

Need:
- read completed `MacroGeographyPackage`
- verify required root-package records exist
- store canonical bundle shape

Do not:
- scrape random Phase 1 internals
- invent missing records

Acceptance:
- missing required root records fail fast
- bundle shape is explicit



## Prompt 10

**Stage:** Stage A — Foundations

**Launch rule:** Run only after **Prompt 9** is completed and its acceptance conditions are satisfied.


**Task:** Extend `Phase2InputBundle` with filtered handoff intake

Need:
- allow only explicitly permitted `MacroGeographyHandoffPackage` sections
- reject forbidden political/history-facing fields
- log blocked categories in debug metadata if useful

Do not:
- treat all handoff fields as allowed
- promote handoff hints to root truth

Acceptance:
- forbidden handoff fields are blocked
- allowed sections are explicit and documented in code



## Prompt 11

**Stage:** Stage A — Foundations

**Launch rule:** Run only after **Prompt 10** is completed and its acceptance conditions are satisfied.


**Task:** Create `Phase2RecordBindingLayer` scaffold

Need:
- define pipeline step and code shape for record binding
- prepare canonical binding tables for record ids and profile targets

Do not:
- skip record binding
- invent non-canonical ids

Acceptance:
- record-binding scaffold exists
- code shape matches contract



## Prompt 12

**Stage:** Stage A — Foundations

**Launch rule:** Run only after **Prompt 11** is completed and its acceptance conditions are satisfied.


**Task:** Implement primary record binding for physical record families

Need:
- bind `reliefRegions`, `climateBands`, `riverBasins`, `seaRegions`, `mountainSystems`, `volcanicZones` into internal context tables

Do not:
- add summaries yet
- derive gameplay meaning yet

Acceptance:
- primary record families are bound
- canonical ids preserved



## Prompt 13

**Stage:** Stage A — Foundations

**Launch rule:** Run only after **Prompt 12** is completed and its acceptance conditions are satisfied.


**Task:** Implement secondary record binding for structural record families

Need:
- bind `chokepoints`, `macroRoutes`, `isolatedZones`, `archipelagoRegions`, `strategicRegions`, `continents` as secondary context

Do not:
- treat secondary records as overriding primary truth
- invent role/history semantics

Acceptance:
- secondary bindings exist
- priority rules preserved



## Prompt 14

**Stage:** Stage A — Foundations

**Launch rule:** Run only after **Prompt 13** is completed and its acceptance conditions are satisfied.


**Task:** Create normalization layer scaffold

Need:
- build reusable scalar normalization helpers
- support provenance metadata
- preserve contrast intentionally

Do not:
- apply heavy smoothing
- hardcode generator-specific weights

Acceptance:
- normalizer exists
- contrast-preservation hooks documented in code



## Prompt 15

**Stage:** Stage A — Foundations

**Launch rule:** Run only after **Prompt 14** is completed and its acceptance conditions are satisfied.


**Task:** Create debug snapshot scaffold

Need:
- prepare UI-free snapshot export helpers for fields and record-bound profiles
- define stable naming helpers

Do not:
- build visualization UI
- make snapshots canonical gameplay truth

Acceptance:
- snapshot helpers exist
- naming is stable and explicit



## Prompt 16

**Stage:** Stage A — Foundations

**Launch rule:** Run only after **Prompt 15** is completed and its acceptance conditions are satisfied.


**Task:** Create `Phase2ValidationReport` schema and shared report helpers

Need:
- implement report structure, status enums, recommendation collectors, blocking reason support

Do not:
- reduce validation to boolean
- embed design logic here

Acceptance:
- report helper exists
- all main validation families supported



## Prompt 17

**Stage:** Stage B — Code-level contracts and schemas

**Launch rule:** Run only after **all prompts from previous stages** are complete.


**Task:** Create code-level climate pressure domain schema

Need:
- implement exact field set: coldPressure, heatPressure, humidityPressure, climateExposurePressure
- add domain validator support
- document field meanings in code comments

Do not:
- add calculations
- rename fields ad hoc

Acceptance:
- domain/schema validator exists
- field names match docs exactly
- no semantic drift



## Prompt 18

**Stage:** Stage B — Code-level contracts and schemas

**Launch rule:** Run only after **Prompt 17** is completed and its acceptance conditions are satisfied.


**Task:** Create code-level terrain pressure domain schema

Need:
- implement exact field set: terrainHarshness, slopeBurden, fragmentationBurden, mobilityTerrainPenalty
- add domain validator support
- document field meanings in code comments

Do not:
- add calculations
- rename fields ad hoc

Acceptance:
- domain/schema validator exists
- field names match docs exactly
- no semantic drift



## Prompt 19

**Stage:** Stage B — Code-level contracts and schemas

**Launch rule:** Run only after **Prompt 18** is completed and its acceptance conditions are satisfied.


**Task:** Create code-level hydrology pressure domain schema

Need:
- implement exact field set: waterReliabilityInverse, waterStress, droughtPressure, floodInstability
- add domain validator support
- document field meanings in code comments

Do not:
- add calculations
- rename fields ad hoc

Acceptance:
- domain/schema validator exists
- field names match docs exactly
- no semantic drift



## Prompt 20

**Stage:** Stage B — Code-level contracts and schemas

**Launch rule:** Run only after **Prompt 19** is completed and its acceptance conditions are satisfied.


**Task:** Create code-level food pressure domain schema

Need:
- implement exact field set: foodStress, foodReliabilityInverse, fertilitySupportInverse, scarcityBaseline
- add domain validator support
- document field meanings in code comments

Do not:
- add calculations
- rename fields ad hoc

Acceptance:
- domain/schema validator exists
- field names match docs exactly
- no semantic drift



## Prompt 21

**Stage:** Stage B — Code-level contracts and schemas

**Launch rule:** Run only after **Prompt 20** is completed and its acceptance conditions are satisfied.


**Task:** Create code-level travel pressure domain schema

Need:
- implement exact field set: travelExposure, routeReliabilityInverse, movementUncertaintyPressure, detourBurden
- add domain validator support
- document field meanings in code comments

Do not:
- add calculations
- rename fields ad hoc

Acceptance:
- domain/schema validator exists
- field names match docs exactly
- no semantic drift



## Prompt 22

**Stage:** Stage B — Code-level contracts and schemas

**Launch rule:** Run only after **Prompt 21** is completed and its acceptance conditions are satisfied.


**Task:** Create code-level chokepoint pressure domain schema

Need:
- implement exact field set: chokepointPressure, failureImpactPressure, dependencyConcentration
- add domain validator support
- document field meanings in code comments

Do not:
- add calculations
- rename fields ad hoc

Acceptance:
- domain/schema validator exists
- field names match docs exactly
- no semantic drift



## Prompt 23

**Stage:** Stage B — Code-level contracts and schemas

**Launch rule:** Run only after **Prompt 22** is completed and its acceptance conditions are satisfied.


**Task:** Create code-level isolation pressure domain schema

Need:
- implement exact field set: isolationPressure, supportDelayBurden, peripheralExposure, accessFragility
- add domain validator support
- document field meanings in code comments

Do not:
- add calculations
- rename fields ad hoc

Acceptance:
- domain/schema validator exists
- field names match docs exactly
- no semantic drift



## Prompt 24

**Stage:** Stage B — Code-level contracts and schemas

**Launch rule:** Run only after **Prompt 23** is completed and its acceptance conditions are satisfied.


**Task:** Create code-level ecology pressure domain schema

Need:
- implement exact field set: ecologicalFragility, ecologicalStabilityInverse, regenerationWeakness, carryingCapacityBrittleness
- add domain validator support
- document field meanings in code comments

Do not:
- add calculations
- rename fields ad hoc

Acceptance:
- domain/schema validator exists
- field names match docs exactly
- no semantic drift



## Prompt 25

**Stage:** Stage B — Code-level contracts and schemas

**Launch rule:** Run only after **Prompt 24** is completed and its acceptance conditions are satisfied.


**Task:** Create code-level catastrophe pressure domain schema

Need:
- implement exact field set: catastrophePressure, stormBreakRisk, volcanicInstability, floodBreakRisk, droughtBreakRisk
- add domain validator support
- document field meanings in code comments

Do not:
- add calculations
- rename fields ad hoc

Acceptance:
- domain/schema validator exists
- field names match docs exactly
- no semantic drift



## Prompt 26

**Stage:** Stage B — Code-level contracts and schemas

**Launch rule:** Run only after **Prompt 25** is completed and its acceptance conditions are satisfied.


**Task:** Create code-level seasonality rhythm domain schema

Need:
- implement exact field set: seasonalityStrength, annualSwingStrength, environmentalCycleClarity
- add domain validator support
- document field meanings in code comments

Do not:
- add calculations
- rename fields ad hoc

Acceptance:
- domain/schema validator exists
- field names match docs exactly
- no semantic drift



## Prompt 27

**Stage:** Stage B — Code-level contracts and schemas

**Launch rule:** Run only after **Prompt 26** is completed and its acceptance conditions are satisfied.


**Task:** Create code-level storm cadence domain schema

Need:
- implement exact field set: stormCadence, stormBurstClustering, calmToStormTransitionSharpness
- add domain validator support
- document field meanings in code comments

Do not:
- add calculations
- rename fields ad hoc

Acceptance:
- domain/schema validator exists
- field names match docs exactly
- no semantic drift



## Prompt 28

**Stage:** Stage B — Code-level contracts and schemas

**Launch rule:** Run only after **Prompt 27** is completed and its acceptance conditions are satisfied.


**Task:** Create code-level navigation rhythm domain schema

Need:
- implement exact field set: navigationWindowReliability, blockedIntervalFrequency, safeRouteIntervalStrength
- add domain validator support
- document field meanings in code comments

Do not:
- add calculations
- rename fields ad hoc

Acceptance:
- domain/schema validator exists
- field names match docs exactly
- no semantic drift



## Prompt 29

**Stage:** Stage B — Code-level contracts and schemas

**Launch rule:** Run only after **Prompt 28** is completed and its acceptance conditions are satisfied.


**Task:** Create code-level scarcity cadence domain schema

Need:
- implement exact field set: scarcityCadence, deficitPersistence, shortageRecurrence
- add domain validator support
- document field meanings in code comments

Do not:
- add calculations
- rename fields ad hoc

Acceptance:
- domain/schema validator exists
- field names match docs exactly
- no semantic drift



## Prompt 30

**Stage:** Stage B — Code-level contracts and schemas

**Launch rule:** Run only after **Prompt 29** is completed and its acceptance conditions are satisfied.


**Task:** Create code-level predictability rhythm domain schema

Need:
- implement exact field set: predictability, ruptureFrequency, cadenceIrregularity, temporalTrustworthiness
- add domain validator support
- document field meanings in code comments

Do not:
- add calculations
- rename fields ad hoc

Acceptance:
- domain/schema validator exists
- field names match docs exactly
- no semantic drift



## Prompt 31

**Stage:** Stage B — Code-level contracts and schemas

**Launch rule:** Run only after **Prompt 30** is completed and its acceptance conditions are satisfied.


**Task:** Create code-level recovery rhythm domain schema

Need:
- implement exact field set: recoveryTempo, stabilizationInterval, reliefPersistence, environmentalForgiveness
- add domain validator support
- document field meanings in code comments

Do not:
- add calculations
- rename fields ad hoc

Acceptance:
- domain/schema validator exists
- field names match docs exactly
- no semantic drift



## Prompt 32

**Stage:** Stage B — Code-level contracts and schemas

**Launch rule:** Run only after **Prompt 31** is completed and its acceptance conditions are satisfied.


**Task:** Create code-level synthesized pressure and synthesized rhythm schema helpers

Need:
- implement exact field set: survivabilityPressure, mobilityPressure, supplyPressure, chokepointStress, remotenessBurden, ecologicalBurden, catastropheSusceptibility, seasonalityProfile, stormRhythm, navigationRhythm, scarcityRhythm, predictabilityProfile, ruptureProfile, recoveryProfile
- add domain validator support
- document field meanings in code comments

Do not:
- add calculations
- rename fields ad hoc

Acceptance:
- domain/schema validator exists
- field names match docs exactly
- no semantic drift



## Prompt 33

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **all prompts from previous stages** are complete.


**Task:** Create scaffold for `ClimateBurdenInterpreter`

Need:
- implement only module shell, explicit inputs/outputs, deterministic stub
- update progress log

Do not:
- compute burden fields
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 34

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 33** is completed and its acceptance conditions are satisfied.


**Task:** Implement coarse `ClimateBurdenInterpreter`

Need:
- derive climate burden fields from completed Phase 1 climate truth only
- update progress log

Do not:
- rebuild climate generation
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 35

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 34** is completed and its acceptance conditions are satisfied.


**Task:** Calibrate `ClimateBurdenInterpreter` against flattening

Need:
- improve contrast and keep interpretation-only semantics
- update progress log

Do not:
- touch rhythm cadence
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 36

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 35** is completed and its acceptance conditions are satisfied.


**Task:** Create scaffold for `TerrainHarshnessGenerator`

Need:
- implement shell and explicit inputs/outputs
- update progress log

Do not:
- compute fields
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 37

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 36** is completed and its acceptance conditions are satisfied.


**Task:** Implement `TerrainHarshnessGenerator`

Need:
- derive terrain burden from relief and mountain truth
- update progress log

Do not:
- use route timing
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 38

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 37** is completed and its acceptance conditions are satisfied.


**Task:** Calibrate `TerrainHarshnessGenerator` against micro-noise

Need:
- clean artifacts while preserving macro barriers
- update progress log

Do not:
- over-smooth field
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 39

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 38** is completed and its acceptance conditions are satisfied.


**Task:** Create scaffold for `HydrologyStressGenerator`

Need:
- implement shell and inputs/outputs
- update progress log

Do not:
- compute fields
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 40

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 39** is completed and its acceptance conditions are satisfied.


**Task:** Implement `HydrologyStressGenerator`

Need:
- derive hydrology stress from river basin truth and related physical context
- update progress log

Do not:
- add cadence
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 41

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 40** is completed and its acceptance conditions are satisfied.


**Task:** Calibrate `HydrologyStressGenerator` for basin sensitivity

Need:
- improve distinction between stable and brittle water support
- update progress log

Do not:
- change unrelated domains
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 42

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 41** is completed and its acceptance conditions are satisfied.


**Task:** Create scaffold for `FoodReliabilityGenerator`

Need:
- implement shell and inputs/outputs
- update progress log

Do not:
- compute fields
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 43

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 42** is completed and its acceptance conditions are satisfied.


**Task:** Implement `FoodReliabilityGenerator`

Need:
- derive food burden from hydrology, terrain, and climate burden interpretation
- update progress log

Do not:
- add scarcity timing
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 44

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 43** is completed and its acceptance conditions are satisfied.


**Task:** Calibrate `FoodReliabilityGenerator` for support-rich vs brittle contrast

Need:
- improve readability of support zones
- update progress log

Do not:
- move scarcity into rhythm
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 45

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 44** is completed and its acceptance conditions are satisfied.


**Task:** Create scaffold for `TravelExposureGenerator`

Need:
- implement shell and explicit route-aware inputs
- update progress log

Do not:
- compute fields
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 46

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 45** is completed and its acceptance conditions are satisfied.


**Task:** Implement `TravelExposureGenerator`

Need:
- derive travel burden from `macroRoutes`, terrain, and related burden context
- update progress log

Do not:
- add navigation windows
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 47

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 46** is completed and its acceptance conditions are satisfied.


**Task:** Calibrate `TravelExposureGenerator` for route readability

Need:
- improve safe vs hostile route differentiation
- update progress log

Do not:
- touch rhythm modules
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 48

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 47** is completed and its acceptance conditions are satisfied.


**Task:** Create scaffold for `ChokepointPressureGenerator`

Need:
- implement shell and chokepoint-aware inputs
- update progress log

Do not:
- compute fields
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 49

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 48** is completed and its acceptance conditions are satisfied.


**Task:** Implement `ChokepointPressureGenerator`

Need:
- derive chokepoint burden from canonical chokepoint truth
- update progress log

Do not:
- invent political significance
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 50

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 49** is completed and its acceptance conditions are satisfied.


**Task:** Calibrate `ChokepointPressureGenerator` against false positives

Need:
- separate chokepoint stress from generic route stress
- update progress log

Do not:
- add cadence
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 51

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 50** is completed and its acceptance conditions are satisfied.


**Task:** Create scaffold for `IsolationBurdenGenerator`

Need:
- implement shell and isolation-aware inputs
- update progress log

Do not:
- compute fields
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 52

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 51** is completed and its acceptance conditions are satisfied.


**Task:** Implement `IsolationBurdenGenerator`

Need:
- derive isolation burden from canonical isolation truth and support delay context
- update progress log

Do not:
- add periphery lore
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 53

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 52** is completed and its acceptance conditions are satisfied.


**Task:** Calibrate `IsolationBurdenGenerator` for core-periphery readability

Need:
- improve readable gradients without inventing politics
- update progress log

Do not:
- touch rhythm semantics
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 54

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 53** is completed and its acceptance conditions are satisfied.


**Task:** Create scaffold for `EcologicalFragilityGenerator`

Need:
- implement shell and explicit support-system inputs
- update progress log

Do not:
- compute fields
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 55

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 54** is completed and its acceptance conditions are satisfied.


**Task:** Implement `EcologicalFragilityGenerator`

Need:
- derive ecological brittleness from support logic and physical context
- update progress log

Do not:
- add post-history collapse story
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 56

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 55** is completed and its acceptance conditions are satisfied.


**Task:** Calibrate `EcologicalFragilityGenerator` for resilient vs brittle contrast

Need:
- improve contrast while staying environmental
- update progress log

Do not:
- flatten into generic harshness
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 57

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 56** is completed and its acceptance conditions are satisfied.


**Task:** Create scaffold for `CatastropheSusceptibilityGenerator`

Need:
- implement shell and explicit cause-specific inputs
- update progress log

Do not:
- compute fields
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 58

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 57** is completed and its acceptance conditions are satisfied.


**Task:** Implement `CatastropheSusceptibilityGenerator`

Need:
- derive storm/volcanic/flood/drought susceptibility from canonical physical truth
- update progress log

Do not:
- generate actual disasters
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 59

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 58** is completed and its acceptance conditions are satisfied.


**Task:** Calibrate `CatastropheSusceptibilityGenerator` for cause separation

Need:
- prevent cause-specific susceptibility from collapsing into one map
- update progress log

Do not:
- add rupture timing
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 60

**Stage:** Stage C — Pressure side

**Launch rule:** Run only after **Prompt 59** is completed and its acceptance conditions are satisfied.


**Task:** Implement `PressureSynthesis`

Need:
- combine pressure domains into synthesized burden axes and preserve domain layers
- update progress log

Do not:
- flatten to one difficulty scalar
- mix burden with timing

Acceptance:
- task stays within scope
- contracts remain intact
- progress log updated



## Prompt 61

**Stage:** Stage D — Recovery / Rhythm side

**Launch rule:** Run only after **all prompts from previous stages** are complete.


**Task:** Calibrate `PressureSynthesis` for planning-style readability

Need:
- improve readability of synthesized pressure profiles
- protect against global flattening

Do not:
- modify rhythm package
- weaken recovery priority

Acceptance:
- pressure synthesis supports distinct burden profiles



## Prompt 62

**Stage:** Stage D — Recovery / Rhythm side

**Launch rule:** Run only after **Prompt 61** is completed and its acceptance conditions are satisfied.


**Task:** Create scaffold for `RecoveryReliefSynthesis`

Need:
- implement shell and mandatory recovery outputs
- update progress log

Do not:
- treat recovery as optional
- mix pressure and rhythm

Acceptance:
- task stays in scope
- timing semantics preserved



## Prompt 63

**Stage:** Stage D — Recovery / Rhythm side

**Launch rule:** Run only after **Prompt 62** is completed and its acceptance conditions are satisfied.


**Task:** Implement `RecoveryReliefSynthesis`

Need:
- derive recovery tempo, stabilization, relief persistence, forgiveness from burden/support context
- update progress log

Do not:
- leave recovery summary-only
- mix pressure and rhythm

Acceptance:
- task stays in scope
- timing semantics preserved



## Prompt 64

**Stage:** Stage D — Recovery / Rhythm side

**Launch rule:** Run only after **Prompt 63** is completed and its acceptance conditions are satisfied.


**Task:** Calibrate `RecoveryReliefSynthesis` against punishment-only world

Need:
- restore meaningful relief where justified while keeping contrast
- update progress log

Do not:
- soften whole world
- mix pressure and rhythm

Acceptance:
- task stays in scope
- timing semantics preserved



## Prompt 65

**Stage:** Stage D — Recovery / Rhythm side

**Launch rule:** Run only after **Prompt 64** is completed and its acceptance conditions are satisfied.


**Task:** Create scaffold for `SeasonalityInterpreter`

Need:
- implement shell and timing-only outputs
- update progress log

Do not:
- compute burden here
- mix pressure and rhythm

Acceptance:
- task stays in scope
- timing semantics preserved



## Prompt 66

**Stage:** Stage D — Recovery / Rhythm side

**Launch rule:** Run only after **Prompt 65** is completed and its acceptance conditions are satisfied.


**Task:** Implement `SeasonalityInterpreter`

Need:
- derive seasonality from completed Phase 1 climate truth
- update progress log

Do not:
- rebuild climate bands
- mix pressure and rhythm

Acceptance:
- task stays in scope
- timing semantics preserved



## Prompt 67

**Stage:** Stage D — Recovery / Rhythm side

**Launch rule:** Run only after **Prompt 66** is completed and its acceptance conditions are satisfied.


**Task:** Calibrate `SeasonalityInterpreter` for cycle readability

Need:
- improve weak vs strong cycle contrast
- update progress log

Do not:
- touch scarcity cadence
- mix pressure and rhythm

Acceptance:
- task stays in scope
- timing semantics preserved



## Prompt 68

**Stage:** Stage D — Recovery / Rhythm side

**Launch rule:** Run only after **Prompt 67** is completed and its acceptance conditions are satisfied.


**Task:** Create scaffold for `StormCadenceInterpreter`

Need:
- implement shell and timing outputs
- update progress log

Do not:
- compute hazard burden
- mix pressure and rhythm

Acceptance:
- task stays in scope
- timing semantics preserved



## Prompt 69

**Stage:** Stage D — Recovery / Rhythm side

**Launch rule:** Run only after **Prompt 68** is completed and its acceptance conditions are satisfied.


**Task:** Implement `StormCadenceInterpreter`

Need:
- derive cadence from climate/sea context
- update progress log

Do not:
- flatten cadence into intensity
- mix pressure and rhythm

Acceptance:
- task stays in scope
- timing semantics preserved



## Prompt 70

**Stage:** Stage D — Recovery / Rhythm side

**Launch rule:** Run only after **Prompt 69** is completed and its acceptance conditions are satisfied.


**Task:** Calibrate `StormCadenceInterpreter` for calm-to-burst readability

Need:
- improve regular vs clustered patterns
- update progress log

Do not:
- write gameplay presets
- mix pressure and rhythm

Acceptance:
- task stays in scope
- timing semantics preserved



## Prompt 71

**Stage:** Stage D — Recovery / Rhythm side

**Launch rule:** Run only after **Prompt 70** is completed and its acceptance conditions are satisfied.


**Task:** Create scaffold for `NavigationWindowGenerator`

Need:
- implement shell and route-timing outputs
- update progress log

Do not:
- overwrite travel burden
- mix pressure and rhythm

Acceptance:
- task stays in scope
- timing semantics preserved



## Prompt 72

**Stage:** Stage D — Recovery / Rhythm side

**Launch rule:** Run only after **Prompt 71** is completed and its acceptance conditions are satisfied.


**Task:** Implement `NavigationWindowGenerator`

Need:
- derive route windows from storm cadence + route/chokepoint context
- update progress log

Do not:
- flatten into route difficulty
- mix pressure and rhythm

Acceptance:
- task stays in scope
- timing semantics preserved



## Prompt 73

**Stage:** Stage D — Recovery / Rhythm side

**Launch rule:** Run only after **Prompt 72** is completed and its acceptance conditions are satisfied.


**Task:** Calibrate `NavigationWindowGenerator` for route coherence

Need:
- remove timing artifacts detached from route structure
- update progress log

Do not:
- touch pressure domains
- mix pressure and rhythm

Acceptance:
- task stays in scope
- timing semantics preserved



## Prompt 74

**Stage:** Stage D — Recovery / Rhythm side

**Launch rule:** Run only after **Prompt 73** is completed and its acceptance conditions are satisfied.


**Task:** Create scaffold for `ScarcityCadenceGenerator`

Need:
- implement shell and timing outputs
- update progress log

Do not:
- duplicate scarcity baseline
- mix pressure and rhythm

Acceptance:
- task stays in scope
- timing semantics preserved



## Prompt 75

**Stage:** Stage D — Recovery / Rhythm side

**Launch rule:** Run only after **Prompt 74** is completed and its acceptance conditions are satisfied.


**Task:** Implement `ScarcityCadenceGenerator`

Need:
- derive shortage timing from support burden + seasonal context
- update progress log

Do not:
- modify pressure baseline
- mix pressure and rhythm

Acceptance:
- task stays in scope
- timing semantics preserved



## Prompt 76

**Stage:** Stage D — Recovery / Rhythm side

**Launch rule:** Run only after **Prompt 75** is completed and its acceptance conditions are satisfied.


**Task:** Calibrate `ScarcityCadenceGenerator` for shortage-relief alternation

Need:
- improve planning value of scarcity timing
- update progress log

Do not:
- implement recovery here
- mix pressure and rhythm

Acceptance:
- task stays in scope
- timing semantics preserved



## Prompt 77

**Stage:** Stage D — Recovery / Rhythm side

**Launch rule:** Run only after **Prompt 76** is completed and its acceptance conditions are satisfied.


**Task:** Create scaffold for `PredictabilityRuptureAnalyzer`

Need:
- implement shell and timing-trust outputs
- update progress log

Do not:
- compute burden
- mix pressure and rhythm

Acceptance:
- task stays in scope
- timing semantics preserved



## Prompt 78

**Stage:** Stage D — Recovery / Rhythm side

**Launch rule:** Run only after **Prompt 77** is completed and its acceptance conditions are satisfied.


**Task:** Implement `PredictabilityRuptureAnalyzer`

Need:
- derive predictability/rupture from cadence layers
- update progress log

Do not:
- mirror pressure
- mix pressure and rhythm

Acceptance:
- task stays in scope
- timing semantics preserved



## Prompt 79

**Stage:** Stage E — Summaries / Validation / Rebalance

**Launch rule:** Run only after **all prompts from previous stages** are complete.


**Task:** Calibrate `PredictabilityRuptureAnalyzer` for planning value

Need:
- make predictable vs rupture-prone regimes gameplay-readable
- preserve distinction from burden

Do not:
- add final gameplay labels
- modify pressure contracts

Acceptance:
- predictability and rupture become downstream-meaningful



## Prompt 80

**Stage:** Stage E — Summaries / Validation / Rebalance

**Launch rule:** Run only after **Prompt 79** is completed and its acceptance conditions are satisfied.


**Task:** Implement `EnvironmentalRhythmSynthesis`

Need:
- combine rhythm domains into synthesized timing/recovery layer
- preserve domain timing meaning
- keep recovery explicit

Do not:
- flatten to one volatility scalar
- remove domain outputs

Acceptance:
- synthesized rhythm exists
- recovery remains explicit
- timing meaning preserved



## Prompt 81

**Stage:** Stage E — Summaries / Validation / Rebalance

**Launch rule:** Run only after **Prompt 80** is completed and its acceptance conditions are satisfied.


**Task:** Calibrate `EnvironmentalRhythmSynthesis` against rhythm collapse

Need:
- improve readability of rhythm profile families
- protect timing meaning against flattening

Do not:
- touch pressure semantics
- weaken recovery

Acceptance:
- rhythm family contrast improves



## Prompt 82

**Stage:** Stage E — Summaries / Validation / Rebalance

**Launch rule:** Run only after **Prompt 81** is completed and its acceptance conditions are satisfied.


**Task:** Create summary generator scaffold

Need:
- implement shell for pressure, rhythm, phase-level, and record-bound summaries
- update progress log

Do not:
- invent ideology or narrative
- silently drift contracts

Acceptance:
- summary scaffold exists
- progress log updated



## Prompt 83

**Stage:** Stage E — Summaries / Validation / Rebalance

**Launch rule:** Run only after **Prompt 82** is completed and its acceptance conditions are satisfied.


**Task:** Implement pressure summaries

Need:
- generate burden-focused summaries from pressure domains and synthesized axes and support record-bound summaries
- update progress log

Do not:
- add rhythm meaning here
- silently drift contracts

Acceptance:
- pressure summaries are specific and field-backed
- progress log updated



## Prompt 84

**Stage:** Stage E — Summaries / Validation / Rebalance

**Launch rule:** Run only after **Prompt 83** is completed and its acceptance conditions are satisfied.


**Task:** Implement rhythm/recovery summaries

Need:
- generate timing, rupture, window, and recovery summaries from rhythm fields and support record-bound summaries
- update progress log

Do not:
- reduce all outputs to 'unstable' or 'dangerous'
- silently drift contracts

Acceptance:
- rhythm summaries explain timing and relief clearly
- progress log updated



## Prompt 85

**Stage:** Stage E — Summaries / Validation / Rebalance

**Launch rule:** Run only after **Prompt 84** is completed and its acceptance conditions are satisfied.


**Task:** Implement validator orchestration shell

Need:
- wire structural, causal, boundary, distribution, design, gameplay, and summary validation families into one flow
- update progress log

Do not:
- collapse validation into one file with no structure
- silently drift contracts

Acceptance:
- validator orchestration exists
- progress log updated



## Prompt 86

**Stage:** Stage E — Summaries / Validation / Rebalance

**Launch rule:** Run only after **Prompt 85** is completed and its acceptance conditions are satisfied.


**Task:** Implement structural validation

Need:
- validate package completeness, ranges, determinism, schema stability, and record-profile presence
- update progress log

Do not:
- implement design judgments here
- silently drift contracts

Acceptance:
- structural failures are explicit
- progress log updated



## Prompt 87

**Stage:** Stage E — Summaries / Validation / Rebalance

**Launch rule:** Run only after **Prompt 86** is completed and its acceptance conditions are satisfied.


**Task:** Implement causal validation

Need:
- validate correlation with completed Phase 1 root-package truth and record-binding integrity
- update progress log

Do not:
- check handoff leakage here
- silently drift contracts

Acceptance:
- causal failures are explicit and debuggable
- progress log updated



## Prompt 88

**Stage:** Stage E — Summaries / Validation / Rebalance

**Launch rule:** Run only after **Prompt 87** is completed and its acceptance conditions are satisfied.


**Task:** Implement boundary validation

Need:
- validate anti-climate-duplication, anti-handoff-leakage, and non-invention rules
- update progress log

Do not:
- add gameplay heuristics here
- silently drift contracts

Acceptance:
- boundary failures are explicit
- progress log updated



## Prompt 89

**Stage:** Stage E — Summaries / Validation / Rebalance

**Launch rule:** Run only after **Prompt 88** is completed and its acceptance conditions are satisfied.


**Task:** Implement distribution validation

Need:
- validate pressure contrast, rhythm contrast, relief presence, and pressure/rhythm differentiation
- update progress log

Do not:
- patch failures with summary text only
- silently drift contracts

Acceptance:
- flattening and monotony become detectable
- progress log updated



## Prompt 90

**Stage:** Stage F — Orchestration / Export / Tests / Final sync

**Launch rule:** Run only after **all prompts from previous stages** are complete.


**Task:** Implement design validation

Need:
- validate tension vs relief, planning-style differentiation, progression usefulness, and profile readability
- update progress log

Do not:
- implement runtime bridge here
- silently drift contracts

Acceptance:
- design failures are explicit
- progress log updated



## Prompt 91

**Stage:** Stage F — Orchestration / Export / Tests / Final sync

**Launch rule:** Run only after **Prompt 90** is completed and its acceptance conditions are satisfied.


**Task:** Implement gameplay projection validation

Need:
- validate traversal, survival, hazard, relief, and runtime-adapter sufficiency against updated projection contract
- update progress log

Do not:
- implement full runtime bridge
- silently drift contracts

Acceptance:
- gameplay relevance becomes checkable
- progress log updated



## Prompt 92

**Stage:** Stage F — Orchestration / Export / Tests / Final sync

**Launch rule:** Run only after **Prompt 91** is completed and its acceptance conditions are satisfied.


**Task:** Implement summary validation and selective rebalance scaffold

Need:
- validate summary correctness/usefulness and implement trigger family shell for selective rebalance using updated rebalance rules
- update progress log

Do not:
- reroll completed Phase 1
- silently drift contracts

Acceptance:
- summary validation exists and rebalance shell exists
- progress log updated



## Prompt 93

**Stage:** Stage F — Orchestration / Export / Tests / Final sync

**Launch rule:** Run only after **Prompt 92** is completed and its acceptance conditions are satisfied.


**Task:** Implement selective rebalance trigger paths

Need:
- implement local response paths for triggers A-F using Phase 2-only reruns
- record rebalance metadata

Do not:
- reroll completed Phase 1 truth
- import forbidden handoff semantics to patch weakness

Acceptance:
- rebalance stays local
- metadata recorded



## Prompt 94

**Stage:** Stage F — Orchestration / Export / Tests / Final sync

**Launch rule:** Run only after **Prompt 93** is completed and its acceptance conditions are satisfied.


**Task:** Implement Phase 2 engine and export

Need:
- wire official execution order from intake to export
- block export on invalid validation status
- export both packages plus summaries and report

Do not:
- export invalid packages
- skip record binding
- skip validation gate

Acceptance:
- execution order matches pipeline
- invalid outputs are blocked



## Prompt 95

**Stage:** Stage F — Orchestration / Export / Tests / Final sync

**Launch rule:** Run only after **Prompt 94** is completed and its acceptance conditions are satisfied.


**Task:** Implement smoke tests, regression tests, representative profile snapshots, and final docs/code sync with downstream readiness note

Need:
- cover anti-scalar-collapse, anti-recovery-loss, anti-pressure-rhythm-collapse, anti-climate-duplication, anti-handoff-leakage, anti-record-binding-loss
- create representative profile seeds/snapshots
- sync code with updated Phase 2 docs
- write clear readiness note for later downstream consumers

Do not:
- rely only on manual inspection
- start Phase 17.5 implementation
- silently drift contracts

Acceptance:
- major semantic drift becomes test-detectable
- docs and code align
- readiness note says what is ready and what is still foundation-only