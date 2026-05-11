# WORLDGEN V1 DOCUMENTATION AND CODEX STRATEGY

## Status
Source-of-truth planning document for the compressed V1 worldgen implementation pass.

## Purpose

This document defines the minimal documentation stack and Codex prompt-pack strategy required to implement the V1 causal worldgen skeleton with the least possible Codex load while preserving correctness.

The goal is not to repeat the Phase 2 pattern of ~90 micro-prompts per phase.

The goal is to implement the V1 skeleton from Phase 0 to Phase 17.5 in roughly 30-40 Codex prompts, while keeping:

```text
causal inheritance
stable ids
validation
debug visibility
Phase 0-2 visual proof
compressed 200-year prehistory
disease diagnosis projection
V2 extension slots
manual/visual test readiness
```

---

# Core Implementation Rule

V1 implementation must use phase wrappers and shared engines.

Do not implement each phase as a fully separate custom architecture.

Use this model:

```text
Shared framework
-> Phase wrapper contracts
-> Minimum real generators
-> Debug/test surfaces
-> Validation
-> Manual visual review
```

Every phase from Phase 0 to Phase 17.5 must exist, but Phase 3-17.5 can start as a Level-1 minimum valid wrapper.

---

# Required Read-First Stack For Codex

Codex should not read the entire repository for every prompt.

Use a compressed read-first stack instead.

## Always read

```text
tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_COMPRESSED_26_PHASE_CAUSAL_PLAN.md
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_MINIMUM_PHASE_WRAPPERS_0_TO_17_5.md
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_SKELETON_AND_V2_EXTENSION_SCOPE.md
```

## Read when touching Phase 0-2

```text
tasks/worldgen_docs_phase0/world_gen/00_context_and_repo_integration.md
tasks/worldgen_docs_phase0/world_gen/01_master_seed_overview.md
tasks/worldgen_docs_phase0/world_gen/02_master_seed_pipeline.md
tasks/worldgen_docs_phase2/docs/Phase_2_Pipeline_updated.md
tasks/worldgen_docs_phase2/docs/Phase_2_Validation_updated.md
```

## Read when touching gameplay projection / disease

```text
tasks/worldgen_docs_phase1/docs/world_gen/ARCHIPELAGO_GAMEPLAY_PROJECTION_BRIDGE.md
docs/design/DISEASE_DIAGNOSIS_ISLAND_EXPERIENCE_RULES.md
```

## Read when touching runtime integration

```text
ARCHITECTURE.md
ROADMAP.md
js/expedition/progression.js
js/state/game-state-schema.js
```

---

# Required New Documentation For V1

Only a small documentation set is required before implementation.

## 1. V1 Shared Framework Contract

Path:

```text
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_SHARED_FRAMEWORK_CONTRACT.md
```

Must define:

```text
CausalPhaseWrapper
CausalPackageFactory
PhaseWrapperRegistry
RecordReferenceResolver
EventGrammarEngine
ActorLineageEngine
MemoryPropagationEngine
ProjectionResolver
ValidationFactory
DebugSnapshotFactory
```

## 2. V1 Package Contract Index

Path:

```text
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_PACKAGE_CONTRACT_INDEX.md
```

Must define compact package shapes for:

```text
ProtoCosmologyPackage
ReligiousLandscapePackage
ReligiousInstitutionPackage
MentalLandscapePackage
SocialNormsPackage
CivilizationSeedPackage
PopulationBehaviorPackage
PowerStructurePackage
DynastyPackage
ElitePackage
RulerRosterPackage
DecisionTracePackage
EpochPackage
HistoricalEventLog
CulturalMemoryPackage
TraumaMap
CulturalDriftPackage
GlobalTragedyPackage
TriggerChainPackage
CollapseCascadePackage
LateWorldStatePackage
ArchipelagoConvergencePackage
IslandRolePackage
IslandHistoryRecord[]
ArchipelagoGameplayProjectionPackage
IslandGameplayProjectionRecord[]
DiseaseTruthProfile
IslandDiagnosisProjectionRecord[]
FriendLetterProjection[]
EvidenceSlot[]
FalseCausalityProfile
DiagnosisEndingConditionMatrix
```

## 3. V1 Manual Visual Test Plan

Path:

```text
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_MANUAL_VISUAL_TEST_PLAN.md
```

Must define how to manually inspect:

```text
Phase 0 profile panel
Phase 1 macro maps
Phase 2 pressure/rhythm overlays
Phase 3-12 compressed history chain
Phase 13 tragedy chain
Phase 14 collapse chain
Phase 15 archipelago role
Phase 16 30 island roles
Phase 17 30 island histories
Phase 17.5 gameplay/disease projection
seed comparison snapshots
```

## 4. V1 Codex Prompt Pack

Path:

```text
tasks/worldgen_docs_phase1/docs/world_gen/codex_worldgen_v1_38_prompts.md
```

Must contain the compressed 30-40 prompt sequence.

---

# Codex Load Reduction Rules

## Rule 1 — One prompt must create grouped output

Bad:

```text
Prompt A: create Phase 3 schema
Prompt B: create Phase 3 validator
Prompt C: create Phase 3 generator shell
Prompt D: implement Phase 3 generator
Prompt E: debug Phase 3
```

Correct:

```text
Prompt A: create Phase 3 minimum wrapper with schema, generator, validation, debug snapshot, and V2 slots.
```

## Rule 2 — Shared framework first

Do not create separate validation/debug/export code per phase.

Shared helpers must be created first, then reused by every wrapper.

## Rule 3 — Stages must be manually reviewed

Codex must stop after these gates:

```text
Gate A: shared framework created
Gate B: Phase 0-2 visual proof stable
Gate C: Phase 3-6 meaning/society chain created
Gate D: Phase 7-12 200-year compressed history created
Gate E: Phase 13-17 archipelago chain created
Gate F: Phase 17.5 gameplay/disease projection created
Gate G: manual visual test/debug snapshot ready
```

## Rule 4 — No phase may be schema-only

Every phase wrapper must produce at least one real seeded output record, except phases that naturally produce global singletons.

## Rule 5 — V2 extension slots are mandatory

Every package must include empty V2 extension slots where future depth will expand.

## Rule 6 — Debug visibility is not optional

Every major stage must have a debug snapshot or readable export.

V1 is not ready if the causal chain cannot be manually inspected.

---

# Recommended 38-Prompt Budget

```text
Stage 0 — Reconciliation and docs: 4 prompts
Stage 1 — Shared framework: 5 prompts
Stage 2 — Phase 0-2 visual proof hardening: 5 prompts
Stage 3 — Phase 3-6 meaning/society wrappers: 4 prompts
Stage 4 — Phase 7-12 civilization/history wrappers: 6 prompts
Stage 5 — Phase 13-17 tragedy/archipelago/island wrappers: 6 prompts
Stage 6 — Phase 17.5 gameplay + disease projection: 4 prompts
Stage 7 — validation/debug/manual testing: 4 prompts
```

Total:

```text
38 prompts
```

This is the target. Do not expand beyond 40 prompts unless a blocker appears.

---

# What V1 Must Be Able To Show After The Pack

After the 38-prompt pass, the project should be able to show at least three seeds with:

```text
1. distinct Phase 0 world profiles;
2. distinct but coherent macro geography;
3. readable mountains/rivers/seas/routes/chokepoints/archipelago systems;
4. pressure/rhythm overlays derived from geography;
5. compressed cosmology/religion/social logic;
6. compressed civilizations/power/dynasty lines;
7. compressed 200-year history;
8. memory/trauma from that history;
9. tragedy derived from accumulated causes;
10. collapse derived from tragedy;
11. archipelago role derived from collapse/history/geography;
12. 30 island roles;
13. 30 island histories;
14. gameplay projection records;
15. disease diagnosis projection records;
16. friend objectives conflicting with survival/trust/access/morality;
17. ending condition matrix;
18. debug snapshots ready for manual review.
```

---

# Hard Stop Conditions

Stop the prompt sequence if any of these occur:

```text
A phase wrapper outputs dummy/static records.
A downstream phase invents missing upstream history.
Phase 13 tragedy has no references to Phase 7-12 history.
Phase 15 archipelago role is not derived from geography/history/collapse.
Phase 17 island histories are generic themes instead of role/history/collapse outputs.
Phase 17.5 disease projection is not derived from earlier worldgen causes.
Debug output cannot show the causal chain.
Phase 0-2 visual proof is missing.
V2 extension slots are missing from package contracts.
```

---

# Final Statement

The V1 Codex strategy is:

```text
few prompts,
large but bounded deliverables,
shared framework first,
phase wrappers second,
visual/debug proof always,
manual test readiness by the end.
```

The purpose is to make V1 implementable in 30-40 Codex prompts without weakening the causal design of the world generator.
