# PHASE 0 — TASK PACKS FOR CODEX

## Pack 1 — Foundation
Read:
- 00_context_and_repo_integration.md
- 01_master_seed_overview.md
- contracts/phase0_runtime_interfaces.md

Do:
- create folder skeleton
- create deterministic RNG wrapper
- create export bundle builder

Acceptance:
- deterministic under seed
- basic bundle export works

---

## Pack 2 — Profile fields
Read:
- 03_world_seed_profile_fields.md
- contracts/world_seed_profile.md

Do:
- implement raw latent axis generation
- enforce normalized ranges
- create world tone derivation

Acceptance:
- fields match contract names
- stable output per seed

---

## Pack 3 — Consistency shaping
Read:
- 02_master_seed_pipeline.md
- 05_master_seed_validation.md

Do:
- implement correlation shaping
- implement anti-flatness
- implement controlled extremeness rules

Acceptance:
- profile is not gray mush
- validation scores become meaningful

---

## Pack 4 — Derived tendencies
Do:
- implement tendency synthesis

Acceptance:
- readable deterministic tendency package exists

---

## Pack 5 — Sub-seed map
Do:
- implement deterministic phase sub-seeds

Acceptance:
- stable namespace map exported

---

## Pack 6 — Validation and debug
Do:
- implement full validation report
- add debug export summaries

Acceptance:
- failed worlds produce actionable reroll advice

---

## Pack 7 — Freeze and downstream compatibility
Do:
- freeze successful exports
- verify compatibility with Phase 1 inputs

Acceptance:
- Phase 1 can read official Phase 0 outputs without guessing
