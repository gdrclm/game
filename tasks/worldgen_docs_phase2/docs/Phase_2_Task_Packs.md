# Phase_2_Task_Packs
## Official task-pack format for Codex implementation of Phase 2
**Repository:** `gdrclm/game`  
**Status:** Draft task-pack document  
**Audience:** Codex implementation passes  
**Scope:** defines the canonical structure for individual task packs used to implement Phase 2

---

# 1. Purpose

Task packs exist to keep Codex focused on one contract-safe microstep at a time.

They prevent:
- giant blended tasks;
- local intuition overriding docs;
- hidden schema drift;
- pressure/rhythm mixing;
- silent loss of recovery / relief.

---

# 2. Mandatory read-first stack for every task pack

## Governance
- `Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`

## Upstream Phase 1
- `macro_geography_package.md`
- `macro_geography_handoff_package.md`
- relevant Phase 1 docs and validation docs

## Phase 2 docs
- `Phase_2_Overview.md`
- `Phase_2_Handoff_From_Phase_1.md`
- `Phase_2_Pipeline.md`
- `Phase_2_Field_Contracts.md`
- `Phase_2_Validation.md`
- `Phase_2_Gameplay_Projection_Contract.md`
- `Phase_2_Codex_Execution_Protocol.md`

## Integration
- `ROADMAP.md`
- relevant runtime files if task needs downstream awareness

---

# 3. Canonical task-pack format

```md
# Task Pack ID
PH2-XXX-00

# Scope
One exact microstep only.

# Read first
[list of required docs]

# Goal
What exactly must be implemented.

# Allowed changes
Precise modules/files that may be touched.

# Forbidden changes
Things Codex must not change.

# Acceptance
Concrete technical and design acceptance points.

# Output discipline
- changed files
- what was done
- what was intentionally not done
- progress-log entry
- migration note if needed
```

---

# 4. Required task-pack rules

## Rule A
One pack = one microstep.

## Rule B
If contracts change, docs must be updated in the same task.

## Rule C
If validation meaning changes, validation docs must be updated in the same task.

## Rule D
If gameplay-facing meaning changes, gameplay projection docs must be updated in the same task.

## Rule E
If missing Phase 1 input is discovered, stop and fix upstream contracts first.

---

# 5. Example task-pack skeleton

```md
# Task Pack ID
PH2-TRAVEL-01

# Scope
Implement only `TravelExposureGenerator`.

# Read first
- macro_geography_package.md
- Phase_2_Handoff_From_Phase_1.md
- Phase_2_Pipeline.md
- Phase_2_Field_Contracts.md
- Phase_2_Validation.md

# Goal
Implement pressure-side travel exposure interpretation from completed Phase 1 route + terrain truth.

# Allowed changes
- js/worldgen/phase2/pressure/travel-exposure-generator.js
- docs/world_gen/Phase_2_Field_Contracts.md
- docs/world_gen/Phase_2_Validation.md
- docs/world_gen/tasks/Phase_2_Progress_Log.md

# Forbidden changes
- no navigation-window logic
- no rhythm changes
- no changes to Phase 1 contracts

# Acceptance
- deterministic output
- correlated with `macroRoutes`
- no pressure/rhythm mixing
- validation updated if needed
```

---

# 6. Final statement

Task packs exist so Codex always works against explicit contracts and never improvises Phase 2 architecture.
