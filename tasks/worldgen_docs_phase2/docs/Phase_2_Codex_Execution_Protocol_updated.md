# Phase_2_Codex_Execution_Protocol
## Official Codex execution protocol for Phase 2 — Pressure & Environmental Rhythm Generator
**Repository:** `gdrclm/game`  
**Status:** Draft source-of-truth execution protocol after completed Phase 1  
**Audience:** Codex implementation passes, engineering, design  
**Scope:** defines mandatory read-first order, governance gates, forbidden shortcuts, schema discipline, and implementation sequencing for Phase 2

---

# Status

This document is the official execution protocol for **Phase 2 — Pressure & Environmental Rhythm Generator** after completed Phase 1.

Its purpose is to prevent:
- governance-blind implementation;
- pressure/rhythm collapse;
- silent schema drift;
- recovery / relief loss;
- gameplay-detached environmental math;
- climate duplication;
- record-blind implementation;
- handoff semantic leakage from Phase 1;
- phase-local hacks that bypass the official contracts.

---

# 1. Mandatory governance-first reading rule

No Phase 2 task is allowed to start unless Codex has first read the top-level governance layer.

Phase 2 implementation is invalid if governance docs were skipped.

---

# 2. Required read-first stack

## Governance layer
1. `docs/world_gen/Phase_Map_Document.md`
2. `00_master_seed_generator.md`
3. `PHASE_INTERACTION_DOCUMENT.md`
4. `WORLD_GENERATION_ORCHESTRATION.md`

## Upstream dependency layer
5. Phase 1 overview / pipeline / contracts / validation docs
6. the official Phase 1 execution protocol
7. `macro_geography_package.md`
8. `macro_geography_handoff_package.md`
9. `00_context_and_repo_integration.md`

## Phase 2 source-of-truth layer
10. `Phase_2_Overview.md`
11. `Phase_2_Handoff_From_Phase_1.md`
12. `Phase_2_Pipeline.md`
13. `Phase_2_Field_Contracts.md`
14. `Phase_2_Validation.md`
15. `Phase_2_Gameplay_Projection_Contract.md`

## Repository / integration layer
16. `ROADMAP.md`
17. relevant expedition/progression/layout/spawn/map boundaries
18. progress log if it exists

---

# 3. Governance gate before any implementation

Before touching code, Codex must explicitly verify:
1. What completed Phase 1 is allowed to define.
2. What Phase 2 is allowed to derive.
3. What Phase 2 is forbidden to invent.
4. Which root-package records are required.
5. Which handoff-package hints are allowed.
6. Which handoff-package hints are forbidden.
7. Whether this task affects official contracts.
8. Whether this task affects validation logic.
9. Whether this task affects gameplay projection meaning.

If any of these are unclear, Codex must stop and update docs/contracts first.

---

# 4. Absolute prohibitions

Codex is also forbidden to:
- add fields without updating field contracts;
- merge pressure and rhythm concepts informally;
- delete or weaken recovery/relief logic without validation and contract update;
- collapse environmental logic into generic scalar difficulty;
- invent ideology, religion, social norms, or narrative truth inside Phase 2;
- bypass official Phase 1 exports and scrape arbitrary upstream implementation internals;
- infer missing Phase 1 physical truth instead of updating upstream contracts;
- use Phase 1 handoff political or history-facing hints as environmental truth;
- rebuild climate generation that Phase 1 already owns.

If any of this happens, the result is architecturally invalid.

---

# 5. Mandatory conceptual separation rule

Phase 2 has three protected subsystems:
- **Pressure Synthesis**
- **Recovery / Relief Synthesis**
- **Environmental Rhythm Synthesis**

## Pressure owns
- burden;
- exposure;
- fragility;
- reliability loss;
- persistence of strain;
- catastrophe susceptibility.

## Recovery / Relief owns
- recovery tempo;
- stabilization intervals;
- relief persistence;
- environmental forgiveness;
- recoverability structure.

## Rhythm owns
- cadence;
- timing;
- windows;
- predictability;
- rupture.

### Hard prohibition
Codex must not use rhythm fields as mere burden multipliers.  
Codex must not use pressure fields as substitutes for timing structure.  
Codex must not bury recovery inside summaries or optional fields.

---

# 6. Mandatory completed-Phase-1 rule

Phase 1 is completed.  
Therefore Phase 2 must consume official Phase 1 exports as canonical upstream truth.

Required canonical inputs:
- `MacroGeographyPackage`
- explicitly allowed parts of `MacroGeographyHandoffPackage`

Forbidden shortcuts:
- scraping arbitrary unfinished Phase 1 intermediate state;
- inventing replacement climate logic;
- inventing replacement route logic;
- re-deriving already-exported physical record truth from scratch.

---

# 7. Mandatory record-binding rule

Because Phase 1 now exports rich record sets, Phase 2 must include record-binding logic.

Codex must not implement Phase 2 as anonymous scalar-only math detached from:
- `reliefRegions`
- `climateBands`
- `riverBasins`
- `seaRegions`
- `mountainSystems`
- `volcanicZones`
- `chokepoints`
- `macroRoutes`
- `isolatedZones`

### Hard prohibition
Phase 2 is invalid if it remains record-blind after completed Phase 1.

---

# 8. Mandatory climate-interpretation rule

Phase 1 already owns climate formation.

Therefore Phase 2 must only:
- interpret climate into burden;
- interpret climate into timing;
- interpret climate into recovery relevance;
- interpret climate into planning relevance.

### Hard prohibition
Codex must not re-implement climate generation as if Phase 1 had not produced climate truth.

---

# 9. Mandatory relief / recovery rule

Phase 2 is invalid if it produces punishment without relief.

Codex must preserve and implement all officially contracted recovery / relief semantics, including at minimum:
- recovery tempo;
- stabilization interval;
- relief persistence;
- environmental forgiveness;
- meaningful distinction between constant burden and recoverable burden.

If recovery/relief fields are missing, the task must fail validation.

---

# 10. Rule: no handoff semantic leakage

`MacroGeographyHandoffPackage` contains downstream-facing hints.  
Codex must not blindly import them as environmental truth.

## Allowed only when explicitly contracted
- selected collapse pressure seeds
- selected structural summary belts/peripheries

## Forbidden
- strategic politics hints
- empire candidates
- rivalry zones
- historical role bias
- any named or interpretive political/historical meaning

If a handoff field is not explicitly allowed by `Phase_2_Handoff_From_Phase_1.md`, it is forbidden.

---

# 11. Rule: no silent schema drift

If Codex changes:
- field name;
- field range meaning;
- field structure type;
- domain ownership;
- synthesized axis semantics;
- summary semantics;
- gameplay projection meaning;
- record-binding meaning;

then Codex must:
1. update `Phase_2_Field_Contracts.md`;
2. update `Phase_2_Pipeline.md` if dependency or execution order changed;
3. update `Phase_2_Validation.md` if checks changed;
4. update `Phase_2_Gameplay_Projection_Contract.md` if downstream meaning changed;
5. write a migration note in the progress log.

---

# 12. Recommended execution order for Codex

1. Governance alignment
2. Upstream root/handoff verification
3. Phase 2 contracts
4. Validation contracts
5. Input bundle
6. Record binding layer
7. Pressure subgenerators
8. Pressure synthesis
9. Recovery / relief subsystem
10. Rhythm subgenerators
11. Rhythm synthesis
12. Summary generation
13. Validation layer
14. Selective rebalance rules
15. Gameplay projection compatibility checks
16. Debug exports / snapshots
17. Final handoff verification

---

# 13. Required validation gate before merge or acceptance

No Phase 2 task is considered valid until Codex verifies all of the following.

## Structural gate
- field ranges valid;
- schema valid;
- determinism preserved.

## Causal gate
- outputs correlate with completed Phase 1 physical and macro inputs.

## Boundary gate
- no forbidden handoff semantics leaked in;
- no climate duplication occurred;
- no record-binding omission occurred.

## Design gate
- pressure and rhythm are distinct;
- recovery/relief exists;
- world contrast is meaningful.

## Gameplay gate
- outputs can be projected into traversal / survival / hazard / relief expectations;
- runtime layers do not need to invent missing environmental truth.

If any gate fails, the task must not be treated as complete.

---

# 14. Required anti-pattern checks

Codex must explicitly avoid:
- scalar difficulty collapse;
- rhythm flattening;
- punishment-only phase;
- climate duplication;
- handoff leakage;
- record blindness;
- summary hallucination.

---

# 15. Final rule

Phase 2 execution is valid only if:
- governance docs were read first;
- completed Phase 1 handoff was verified first;
- pressure and rhythm stayed distinct;
- recovery/relief stayed explicit;
- field contracts were respected;
- record binding stayed explicit;
- validation gates were passed;
- downstream truth was not invented prematurely;
- runtime systems were not forced to invent missing environmental logic.
