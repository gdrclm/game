# CODEX EXECUTION PROTOCOL FOR PHASE 1 — V2

## Статус
This document supersedes the earlier Phase 1 execution protocol for all new Codex tasking.

Its purpose is to prevent:
- governance-blind implementation;
- silent schema drift;
- hidden coupling;
- phase-local hacks that ignore worldgen source-of-truth docs.

---

## 1. Mandatory governance-first reading rule

No Phase 1 task is allowed to start unless Codex has first read the top-level governance layer.

This is a hard rule.

Codex must not begin work from:
- task packs only;
- Phase 1 docs only;
- contracts only;
- codebase context only.

Phase 1 implementation is invalid if governance docs were skipped.

---

## 2. Required read-first stack

For **every** Phase 1 task, Codex must read in this order:

### Governance layer
1. `docs/world_gen/Phase_Map_Document.md`
2. `00_master_seed_generator.md`
3. `PHASE_INTERACTION_DOCUMENT.md`
4. `WORLD_GENERATION_ORCHESTRATION.md`

### Repository / phase integration layer
5. `docs/world_gen/00_context_and_repo_integration.md`
6. `docs/world_gen/01_macro_geography_overview.md`
7. `docs/world_gen/02_macro_geography_pipeline.md`
8. `docs/world_gen/03_macro_geography_fields.md`
9. `docs/world_gen/05_macro_geography_validation.md`

### Contract layer
10. `docs/world_gen/contracts/macro_geography_package.md`
11. `docs/world_gen/contracts/macro_geography_handoff_package.md`
12. `docs/world_gen/contracts/field_contracts.md`
13. `docs/world_gen/contracts/region_contracts.md`

### Task layer
14. relevant task pack
15. relevant backlog section
16. progress log if it exists

---

## 3. Governance gate before any implementation

Before touching code, Codex must explicitly verify:

1. What Phase 0 is allowed to define.
2. What Phase 1 is allowed to derive.
3. What Phase 1 is forbidden to invent.
4. What freeze points exist upstream.
5. What downstream phases expect as official handoff.
6. Whether this task changes only `MacroGeographyPackage` or also handoff contracts.

If any of these are unclear, Codex must stop and update docs/contracts first.

---

## 4. Absolute prohibition

Codex is forbidden to execute a Phase 1 task if top-level governance docs were not read first.

That means:
- no quick patching from task pack only;
- no contract changes from local context only;
- no output-field additions from code intuition only;
- no bridge assumptions invented without checking official downstream docs.

If governance was skipped, the task result is considered architecturally invalid.

---

## 5. Task format

Each task should still be given as a focused task pack.

```md
# Task Pack ID
PH1-COAST-01

# Governance read first
- docs/world_gen/Phase_Map_Document.md
- 00_master_seed_generator.md
- PHASE_INTERACTION_DOCUMENT.md
- WORLD_GENERATION_ORCHESTRATION.md

# Local read first
- docs/world_gen/00_context_and_repo_integration.md
- docs/world_gen/03_macro_geography_fields.md
- docs/world_gen/contracts/field_contracts.md
- docs/world_gen/contracts/macro_geography_handoff_package.md

# Goal
Implement coastal harbor quality scoring and region clustering.

# Change targets
- js/worldgen/macro/coastal-opportunity-generator.js
- js/worldgen/macro/contracts.js
- docs/world_gen/contracts/field_contracts.md
- docs/world_gen/contracts/macro_geography_package.md
- docs/world_gen/contracts/macro_geography_handoff_package.md
- docs/world_gen/tasks/phase1_progress_log.md

# Acceptance
- deterministic under seed
- debug heatmap exists
- exported scores written into MacroGeographyPackage
- handoff fields updated if affected
- validation updated if needed
```

---

## 6. What Codex must update after each task

Minimum required updates:
- module code;
- contract docs if fields changed;
- handoff contract if downstream meaning changed;
- progress log;
- changelog / migration note;
- tests or debug snapshot hooks;
- validation logic if strategic output meaning changed.

---

## 7. Rule: no silent schema drift

If Codex changes:
- field name;
- value range;
- structure type;
- semantic meaning of output;
- downstream handoff meaning;

then Codex must:
1. update the relevant contracts;
2. update overview / pipeline / validation docs if required;
3. update the handoff contract if downstream consumers are affected;
4. write a migration note in the progress log.

---

## 8. Rule: no hidden coupling

Phase 1 modules must not directly depend on:
- map UI;
- local island layout runtime;
- loot / crafting systems;
- NPC systems;
- late realization systems.

Allowed dependencies are only:
- seed/profile input;
- macro contracts;
- other macro generators;
- explicit bridge / handoff contracts.

---

## 9. Rule: no invented downstream truth

Phase 1 may export seeds, hints, and structural pressure summaries.

Phase 1 may not:
- invent final island history;
- invent settlement graphs;
- invent NPC truth;
- invent playable routes for the final world;
- bypass later bridge and realization phases.

Phase 1 must only prepare officially contracted handoff for downstream systems.

---

## 10. Recommended execution order for Codex

1. Governance alignment
2. Contracts
3. Handoff contract
4. Field abstractions
5. Tectonic skeleton
6. Marine carving
7. Climate pressure
8. Cohesion
9. Coast opportunities
10. Route graph
11. Chokepoints
12. Isolation
13. Archipelago significance
14. Validation
15. Debug tools
16. Handoff export verification

---

## 11. If the task is too large

If the task is too large, Codex must:
- split it into smaller contracted tasks;
- avoid partial hidden implementation;
- use `TODO CONTRACTED` only where the contract is already official;
- not invent shortcuts around governance docs;
- not change package shape informally just to complete the task faster.

---

## 12. Final rule

Phase 1 execution is valid only if:
- governance docs were read first;
- phase contracts were respected;
- handoff contract stayed explicit;
- downstream truth was not invented prematurely.
