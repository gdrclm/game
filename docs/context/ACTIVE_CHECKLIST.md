# Active checklist — WorldGen V1 Foundation Closure

Only current work and acceptance. Historical implementation details belong in git and PROJECT_STATE.md.

- [x] Separate working branch, CI and baseline diagnostic.
- [x] Implement official Phase 0 creation, export validation and adapter; deterministic cohort checks.
- [x] Fix Phase 1 intake/coast profile and hydrosphere RNG namespace.
- [x] Historical baseline captured on three deterministic canonical seeds, including validation failures.
- [x] First maritime causal unit and read-only counterfactual instrumentation.
- [x] F1: Diagnose missing connectivity/archipelago/chokepoint records. Inspect land/water masks, regional segmentation, coastal opportunity nodes, sea graph, hybrid graph, route endpoints/edges, fragmentation runs, archipelago detection, package record assembly and validation. Capture actual stage counts and rejected candidates, identify first loss; verify required minima against Phase 1/2 contracts. See [baseline stage trace](FOUNDATION_EXECUTION_PLAN.md#исходная-трассировка-f1).
- [x] F2: Correct generation/assembly with narrow regression tests; all canonical seeds pass Phase 1 validation and satisfy required root records/references, with no silent master seed changes. Preserve genuinely varied morphology. If documented rebalance needed, make bounded, reproducible and logged; review quality rather than threshold lowering.
- [x] F3: Real Phase 2 intake/pressure/recovery/rhythm/export on valid Phase 1 worlds; run twice, compare hashes, inspect record binding, physical causality, pressure and recovery; test invalid input rejected. Fixture harness remains green.
- [x] F4: Exercise maritime intervention on real eligible worlds (status pass, not not_exercised); verify no geometry/control drift. Trace other documented input channels: environmentalVolatility, routeFragilityBias, conflictPressure, collapseIntensity; map semantic inputs to relevant phases, avoid forcing physical effects from social tendencies. Add missing contracts only with rationale; no arbitrary coefficient inflation.
- [x] F5: One narrow Phase 0→1→2 orchestrator, fail closed; canonical outputs and immutable handoffs; opt-in debug exports. Not player runtime. No integration with expedition progression before Phase 17.5.
- [x] F6: Run predeclared holdout cohort (suggest 8 distributed seed values distinct from canonical and document before running); report success/failure per seed, determinism, diversity, causal effect coverage, generation time. Scale cohort after performance check. Do not hide failed seeds.
- [x] F7: Five read-only atlases and the fixed-seed storm comparison checked against actual PhysicalWorldDebugBundle and Phase 2 exports. See [author review packet](review/README.md).
- [x] F8-Q: Investigate and refine physical passage closures, transport independence, morphology and center/periphery contrast. Compare the baseline and candidate on the same 27 seeds and four untouched seeds. Publish [maps, causes, and evidence](review/f8q/README.md).
- [ ] F8-R: Resolve the two technical Phase 2 blockers found by F8-Q. Seed `16908799` falls below relief checks; `2764796977` fails tension versus relief. Keep existing gates. [Recovery diagnosis and acceptance](FOUNDATION_RECOVERY_CLOSURE.md). The mandatory regression cohort now includes all 31 reviewed seeds; retain new predeclared holdouts separately.
- [ ] F8-T: Terrain and bathymetry capability audit, causal implementation of missing V1 coverage and actual maps.
- [ ] F8-C: Phase 0–2 causal channel and handoff audit.
- [ ] F8-D: Real-world physical and environmental diversity evidence.
- [ ] F8-S: Full regression and predeclared fresh holdout stress tests; profile performance.
- [ ] F8-V: Real visual evidence, coverage matrix and author review packet.
- [ ] F8: Author review of physical coherence, causal meaning, variation and downstream narrative potential. Record decision or requested rule changes and retest unseen seeds. Do not claim author acceptance.
- [ ] F9: Final reconciliation of docs/code/tests/phase readiness; explicit approval before Phase 3 expansion or merge.

## Milestone boundary
F1–F7 passed on `04f5b5c`. The F8-Q repeat on `808ac3a` passed 25/27 in the main comparison, with all canonical seeds, and 4/4 on the untouched cohort. See [project state](PROJECT_STATE.md) and the [F8-Q review packet](review/f8q/README.md). F8 and F9 require the author's decision before Phase 3 or merge.

Active global objective: [WORLDGEN_PHASE0_2_GLOBAL_GOAL.md](WORLDGEN_PHASE0_2_GLOBAL_GOAL.md). Engineering steps may be interleaved, but resolve known F8-R failures first and preserve F8-Q. These review tasks are not additional WorldGen phases.
