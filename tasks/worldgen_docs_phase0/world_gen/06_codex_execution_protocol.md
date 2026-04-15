# CODEX EXECUTION PROTOCOL FOR PHASE 0

## Goal
This document defines how Codex must implement Phase 0 safely.

---

## Mandatory read-first stack

For every Phase 0 task, Codex must read:

### Governance layer
1. `Phase_Map_Document.md`
2. `00_master_seed_generator.md`
3. `PHASE_INTERACTION_DOCUMENT.md`
4. `WORLD_GENERATION_ORCHESTRATION.md`

### Phase 0 local layer
5. `docs/world_gen/00_context_and_repo_integration.md`
6. `docs/world_gen/01_master_seed_overview.md`
7. `docs/world_gen/02_master_seed_pipeline.md`
8. `docs/world_gen/03_world_seed_profile_fields.md`
9. `docs/world_gen/05_master_seed_validation.md`

### Contract layer
10. `docs/world_gen/contracts/world_seed_profile.md`
11. `docs/world_gen/contracts/derived_world_tendencies.md`
12. `docs/world_gen/contracts/world_subseed_map.md`
13. `docs/world_gen/contracts/phase0_validation_report.md`
14. `docs/world_gen/contracts/phase0_runtime_interfaces.md`

### Task layer
15. task pack
16. backlog section
17. progress log if present

---

## Hard prohibition
No Phase 0 task is valid if governance docs were skipped.

---

## Phase 0-specific rules

Codex must not:
- invent new world profile fields silently;
- move geography logic into Phase 0;
- use static preset tables as core generation logic;
- expose mutable downstream seed maps;
- let late phases overwrite Phase 0 truth.

Codex must:
- preserve deterministic behavior;
- update contracts when fields or semantics change;
- update validation docs when thresholds change;
- keep the runtime isolated from gameplay/UI modules.

---

## Schema drift and migration-note discipline

If any Phase 0 task changes schema shape, contract keys, interface signatures, field requirements, threshold semantics, or the meaning of an existing exported field, Codex must treat that work as schema drift.

For every schema-drift change, Codex must:
- update the affected runtime contract docs under `docs/world_gen/contracts/*`;
- update any directly affected local protocol/validation docs under `docs/world_gen/*`;
- add an explicit migration note to the current progress/changelog entry;
- state whether the change is additive, renaming, removal, or semantic reinterpretation;
- state whether downstream phases must re-read the updated contract before further implementation.

Codex must not:
- change contract-visible field meaning silently;
- change exported schema shape without documenting the drift in both contracts and progress log;
- rely on code-only changes as sufficient documentation for Phase 0 schema evolution.

---

## Task pack format

```md
# Task Pack ID
PH0-PROFILE-01

# Governance read first
- Phase_Map_Document.md
- 00_master_seed_generator.md
- PHASE_INTERACTION_DOCUMENT.md
- WORLD_GENERATION_ORCHESTRATION.md

# Local read first
- docs/world_gen/01_master_seed_overview.md
- docs/world_gen/03_world_seed_profile_fields.md
- docs/world_gen/contracts/world_seed_profile.md

# Goal
Implement normalized profile synthesis with consistency shaping.

# Change targets
- js/worldgen/phase0/world-profile-synthesizer.js
- js/worldgen/phase0/contracts.js
- docs/world_gen/contracts/world_seed_profile.md
- docs/world_gen/tasks/phase0_progress_log_template.md

# Acceptance
- deterministic under seed
- fields match contract names
- validation passes or reroll advice is returned
```
