# Context map — read before work

Purpose: shared context between ChatGPT Project and Codex; navigation rather than duplicate specifications. Source provenance: repository at afc59830bb4e40ea953572e80f6dbf625faddcab plus available project-chat summaries and current discussion. Full historical chat archive has NOT been reviewed or exported. Missing/ambiguous details remain open; do not invent them.

## Session startup (bounded tasks)
Read AGENTS.md, PLANS.md, [PROJECT_STATE.md](PROJECT_STATE.md), [ACTIVE_CHECKLIST.md](ACTIVE_CHECKLIST.md) and [NEXT_ENGINEERING_MILESTONE.md](NEXT_ENGINEERING_MILESTONE.md). Consult [HIGH_REASONING_REVIEW_QUEUE.md](HIGH_REASONING_REVIEW_QUEUE.md) for unresolved causal problems. The full reading order below is a reference map, not a requirement to reread every document per session. Use targeted file ranges and extracted metrics.

## Reading order
1. [Authorial vision](PATHS_AUTHORIAL_VISION.md) and [design decisions](DESIGN_DECISIONS.md): distilled author direction and uncertainty. [Settlement migration and territorial continuity](SETTLEMENT_MIGRATION_AND_TERRITORIAL_CONTINUITY.md): author direction for historical migration, abandonment, reoccupation and causal material traces; required when designing Phase 3–17 and later materialization.
2. [Project state](PROJECT_STATE.md), [active checklist](ACTIVE_CHECKLIST.md), [author review queue](AUTHOR_REVIEW_QUEUE.md): current handoff.
   [Foundation execution plan](FOUNDATION_EXECUTION_PLAN.md) and [author review packet](review/README.md) contain the current tests and actual maps.
   [Physical work plan](FOUNDATION_PHYSICAL_PLAN.md) and [coverage matrix](FOUNDATION_PHYSICAL_COVERAGE.md) describe the F8-T/C/D/S/V checkpoints.
   [Regional archipelago plan](FOUNDATION_ARCHIPELAGO_PLAN.md) traces physical island geography from Phase 1 to the input boundary of Phase 16.
3. [Architecture](../../ARCHITECTURE.md), [runtime roadmap](../../ROADMAP.md), [GDD](../../tasks/GDD.md), [craft design](../../tasks/craft_design.md), [craft rules](../../tasks/craft_rules.md).
4. Worldgen scope: [phase map](../../tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md), [compressed causal plan](../../tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_COMPRESSED_26_PHASE_CAUSAL_PLAN.md), [V1 skeleton/V2 extensions](../../tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_SKELETON_AND_V2_EXTENSION_SCOPE.md), [minimum wrappers](../../tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_MINIMUM_PHASE_WRAPPERS_0_TO_17_5.md), [documentation strategy](../../tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_DOCUMENTATION_AND_CODEX_STRATEGY.md).
5. [Phase 0 pipeline](../../tasks/worldgen_docs_phase0/world_gen/02_master_seed_pipeline.md), [runtime interfaces](../../tasks/worldgen_docs_phase0/world_gen/contracts/phase0_runtime_interfaces.md), [validation](../../tasks/worldgen_docs_phase0/world_gen/05_master_seed_validation.md); read neighboring field/contract docs when editing.
6. [Phase 1 pipeline](../../tasks/worldgen_docs_phase1/docs/world_gen/02_macro_geography_pipeline.md), [algorithms](../../tasks/worldgen_docs_phase1/docs/world_gen/04_macro_geography_algorithms.md), [validation](../../tasks/worldgen_docs_phase1/docs/world_gen/05_macro_geography_validation.md), [package](../../tasks/worldgen_docs_phase1/docs/world_gen/contracts/macro_geography_package.md), [handoff](../../tasks/worldgen_docs_phase1/docs/world_gen/contracts/macro_geography_handoff_package.md).
7. [Phase 2 master index](../../tasks/worldgen_docs_phase2/docs/PHASE_2_MASTER_INDEX_UPDATED.md), [handoff](../../tasks/worldgen_docs_phase2/docs/Phase_2_Handoff_From_Phase_1.md), [pipeline](../../tasks/worldgen_docs_phase2/docs/Phase_2_Pipeline_updated.md), [test strategy](../../tasks/worldgen_docs_phase2/docs/Phase_2_Test_Strategy.md), [progress log](../../tasks/worldgen_docs_phase2/docs/Phase_2_Progress_Log.md). Progress log is historical, not evidence of live integration.
8. Experience: [Phase 17.5 bridge](../../tasks/worldgen_docs_phase1/docs/world_gen/ARCHIPELAGO_GAMEPLAY_PROJECTION_BRIDGE.md), [detective](../../tasks/worldgen_docs_phase1/docs/world_gen/DETECTIVE_MODE_V1_CORE_GAMEPLAY_RU.md), [disease island experience](../../docs/design/DISEASE_DIAGNOSIS_ISLAND_EXPERIENCE_RULES.md).
9. Acceptance: [causal author protocol](../../tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_CAUSAL_AUTHOR_ACCEPTANCE.md), [physical visual register](../../tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_PHASE0_2_VISUAL_PRODUCTION_REGISTER.md), [UI boundary](../../tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_VISUAL_UI_BOUNDARY_AND_SOCIAL_MARKERS_CORRECTION.md), [visual register](../../tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_VISUAL_ASSET_REGISTER_0_TO_26.md).

## Cross-phase evolution
[WorldGen phase evolution protocol](WORLDGEN_PHASE_EVOLUTION_PROTOCOL.md) — mandatory development direction when a later feature needs upstream changes. Read with AGENTS.md and PLANS.md; phase acceptance does not prohibit later improvements. Preserve causal generation and instance consistency.

[Underwater extension direction](WORLDGEN_UNDERWATER_EXTENSION_DIRECTION.md) — future example of cross-phase evolution: underwater content shares the established world and historical facts; not current implementation scope.

[Landscape history and memory](WORLDGEN_LANDSCAPE_HISTORY_AND_MEMORY.md) — author direction for past physical states, tectonic transitions, historical consequences and fallible intergenerational knowledge. Required when designing historical memory or temporal geography extensions; not current implementation scope.

[Numerical causal foundation](WORLDGEN_NUMERICAL_CAUSAL_FOUNDATION.md) — turn-based detective strategy quality principle; preserve useful independent physical measurements, semantics and provenance for future gameplay consumers.

## Conflict resolution
Latest explicit author decision takes precedence for design, subject to documenting contract consequences; official contracts for interface semantics; executable tests and observed outputs for actual state. The older runtime roadmap has a separate phase numbering from WorldGen. Do not conflate them. Old prompt packs and completed checklists are not proof of runtime readiness. If a contradiction changes game design or historical causality, flag it instead of silently choosing. Existing GDD/craft docs may predate the diagnosis and worldgen expansion; keep relevant mechanics, don't assume all old final-goal language is current.

## Current autonomous goal
[WORLDGEN_PHASE0_2_GLOBAL_GOAL.md](WORLDGEN_PHASE0_2_GLOBAL_GOAL.md) — active Phase 0–2 engineering objective, including F8-R and terrain/bathymetry/causality/diversity/scale/visual review. Use it with AGENTS.md and the current state; it does not supersede author approval gates or phase contracts.
