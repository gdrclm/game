# PHASE_2_MASTER_INDEX
## Master index for the updated Phase 2 documentation kit
**Repository:** `gdrclm/game`
**Status:** Consolidated local doc-kit index
**Scope:** single entry point for the rebuilt and updated Phase 2 documentation stack after completed Phase 1

---

# 1. Purpose

This file exists to make Phase 2 readable as one coherent documentation stack and to package the latest local Phase 2 materials in one place.

It answers:
- which files belong to Phase 2;
- what each file is for;
- what order a human should read them in;
- what order Codex should read them in;
- which prompt pack is the latest structured one.

---

# 2. Recommended reading order for a human

## Step 1 — Governance and boundaries
1. `Phase_2_Overview.md`
2. `Phase_2_Handoff_From_Phase_1.md`
3. `Phase_2_Pipeline_updated.md`
4. `Phase_2_Codex_Execution_Protocol_updated.md`

## Step 2 — Contracts
5. `PressureFieldPackage.md`
6. `EnvironmentalRhythmPackage.md`
7. `Phase_2_Record_Binding_Contract.md`
8. `Phase_2_Field_Contracts_updated.md`

## Step 3 — Validation / testing / debug
9. `Phase_2_Validation_updated.md`
10. `Phase_2_Rebalance_Rules.md`
11. `Phase_2_Test_Strategy.md`
12. `Phase_2_Debug_And_Snapshots.md`

## Step 4 — Integration and design
13. `Phase_2_Runtime_Adapter_Mapping.md`
14. `Phase_2_Gameplay_Meaning_Guide.md`
15. `Phase_2_Gameplay_Projection_Contract_updated.md`
16. `Phase_2_Design_Risks.md`
17. `Phase_2_Profile_Families.md`

## Step 5 — Codex layer
18. `Phase_2_Task_Backlog.md`
19. `Phase_2_Task_Packs.md`
20. `Phase_2_Progress_Log.md`
21. `codex_phase2_prompts_95_sequenced.md`

---

# 3. Prompt-pack note

This folder includes multiple prompt-pack variants for reference:

- `codex_phase2_prompts.md` — compact rebuilt pack
- `codex_phase2_prompts_92.md` — expanded rebuilt pack
- `codex_phase2_prompts_95_sequenced.md` — latest version with explicit stage order and per-prompt launch rules

If using only one prompt-pack for implementation, prefer:
- `codex_phase2_prompts_95_sequenced.md`

---

# 4. Required read order for Codex

## Governance-first
- `Phase_2_Overview.md`
- `Phase_2_Handoff_From_Phase_1.md`
- `Phase_2_Pipeline_updated.md`
- `Phase_2_Codex_Execution_Protocol_updated.md`

## Contracts
- `PressureFieldPackage.md`
- `EnvironmentalRhythmPackage.md`
- `Phase_2_Record_Binding_Contract.md`
- `Phase_2_Field_Contracts_updated.md`

## Validation and gameplay relevance
- `Phase_2_Validation_updated.md`
- `Phase_2_Gameplay_Projection_Contract_updated.md`
- `Phase_2_Rebalance_Rules.md`

## Task execution layer
- `Phase_2_Task_Backlog.md`
- `Phase_2_Task_Packs.md`
- `Phase_2_Progress_Log.md`
- `codex_phase2_prompts_95_sequenced.md`

---

# 5. File roles

## Source-of-truth core docs
- `Phase_2_Overview.md` — role and boundaries of the phase
- `Phase_2_Handoff_From_Phase_1.md` — exact upstream intake rules from completed Phase 1
- `Phase_2_Pipeline_updated.md` — execution order and subsystem structure
- `Phase_2_Codex_Execution_Protocol_updated.md` — governance-first implementation discipline

## Source-of-truth contracts
- `PressureFieldPackage.md` — package contract for burden output
- `EnvironmentalRhythmPackage.md` — package contract for timing/recovery output
- `Phase_2_Record_Binding_Contract.md` — record-aware linkage to completed Phase 1 records
- `Phase_2_Field_Contracts_updated.md` — field vocabulary and semantics

## Source-of-truth quality control docs
- `Phase_2_Validation_updated.md` — validation framework
- `Phase_2_Rebalance_Rules.md` — allowed correction loops
- `Phase_2_Test_Strategy.md` — test stack and regression protection
- `Phase_2_Debug_And_Snapshots.md` — debug/snapshot discipline

## Source-of-truth integration/design docs
- `Phase_2_Runtime_Adapter_Mapping.md` — future runtime consumption paths
- `Phase_2_Gameplay_Meaning_Guide.md` — gameplay meaning of outputs
- `Phase_2_Gameplay_Projection_Contract_updated.md` — bridge to gameplay-facing semantics
- `Phase_2_Design_Risks.md` — main game-design failure modes
- `Phase_2_Profile_Families.md` — readable environmental profile families

## Execution support docs
- `Phase_2_Task_Backlog.md` — strict order of work
- `Phase_2_Task_Packs.md` — canonical microtask structure
- `Phase_2_Progress_Log.md` — audit trail for implementation
- `codex_phase2_prompts.md` — compact prompt pack
- `codex_phase2_prompts_92.md` — expanded prompt pack
- `codex_phase2_prompts_95_sequenced.md` — latest sequenced prompt pack

---

# 6. Minimum set to start implementation

If implementation must start with the smallest safe stack, read at minimum:
1. `Phase_2_Overview.md`
2. `Phase_2_Handoff_From_Phase_1.md`
3. `Phase_2_Pipeline_updated.md`
4. `Phase_2_Codex_Execution_Protocol_updated.md`
5. `PressureFieldPackage.md`
6. `EnvironmentalRhythmPackage.md`
7. `Phase_2_Record_Binding_Contract.md`
8. `Phase_2_Field_Contracts_updated.md`
9. `Phase_2_Validation_updated.md`
10. `Phase_2_Gameplay_Projection_Contract_updated.md`
11. `codex_phase2_prompts_95_sequenced.md`

---

# 7. Files included in this folder
- `Phase_2_Overview.md`
- `Phase_2_Handoff_From_Phase_1.md`
- `Phase_2_Pipeline_updated.md`
- `Phase_2_Codex_Execution_Protocol_updated.md`
- `PressureFieldPackage.md`
- `EnvironmentalRhythmPackage.md`
- `Phase_2_Record_Binding_Contract.md`
- `Phase_2_Field_Contracts_updated.md`
- `Phase_2_Validation_updated.md`
- `Phase_2_Rebalance_Rules.md`
- `Phase_2_Test_Strategy.md`
- `Phase_2_Debug_And_Snapshots.md`
- `Phase_2_Runtime_Adapter_Mapping.md`
- `Phase_2_Gameplay_Meaning_Guide.md`
- `Phase_2_Gameplay_Projection_Contract_updated.md`
- `Phase_2_Design_Risks.md`
- `Phase_2_Profile_Families.md`
- `Phase_2_Task_Backlog.md`
- `Phase_2_Task_Packs.md`
- `Phase_2_Progress_Log.md`
- `codex_phase2_prompts.md`
- `codex_phase2_prompts_92.md`
- `codex_phase2_prompts_95_sequenced.md`