# Paths execution protocol

Use a focused execution plan per bounded milestone, not a plan to implement all 26 phases in one run. For the current milestone, start from docs/context/ACTIVE_CHECKLIST.md and PROJECT_STATE.md.

Each plan records objective, non-goals, authoritative contract paths, baseline commit, reproduction command, observed failures, tasks, tests, evidence exports, risks, provisional decisions, and author review gates. Keep it current as evidence changes. It must be usable by a new agent without chat history.

## Loop
1. Verify branch, working tree, dependencies and baseline; reproduce the actual failure.
2. Trace the first causal divergence using stage input/output counts, identifiers, fields, thresholds and assembly diagnostics. Differentiate absent generation, lost assembly, invalid references and validation thresholds.
3. Make the smallest justified fix with regression tests, preserving semantic contracts.
4. Run focused tests, then end-to-end on canonical seeds, then a predeclared holdout cohort. Use actual generation, not fixture-only success.
5. Inspect real results (including failed worlds), invariants, runtime and causal response. Keep failed seeds visible. If selective regeneration is necessary, log targets, namespace seed deltas and attempt bounds; never silently swap the master seed.
6. Iterate until the milestone gate is satisfied or an evidence-backed blocker requires author judgment. Do not weaken gates just to complete a plan.
7. Commit focused changes to the working branch when authorized. Update context/state and provide evidence for author review. Do not merge main.

## Definition of done
Technical completion and author approval are separate. For Phase 0–2, valid deterministic end-to-end packages, exercised counterfactuals and readable real maps are required. For later phases, the same causal facts must support coherent history and material consequences. At 17.5 evaluate gameplay projection; 18–25 evaluate realization; 26 evaluate actual sessions and regeneration. See WORLDGEN_V1_CAUSAL_AUTHOR_ACCEPTANCE.md in the Phase 1 docs. Do not mark an author gate accepted without actual author feedback.
