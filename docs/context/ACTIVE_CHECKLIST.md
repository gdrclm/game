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
- [ ] F8-Q: Quality refinement and independent review before author acceptance; see [FOUNDATION_QUALITY_REVIEW.md](FOUNDATION_QUALITY_REVIEW.md). Verify passage closure endpoints, actual topology/shape diversity and center-periphery contrast without weakening validators.
- [ ] F8: Author review of physical coherence, causal meaning, variation and downstream narrative potential. Record decision or requested rule changes and retest unseen seeds. Do not claim author acceptance.
- [ ] F9: Final reconciliation of docs/code/tests/phase readiness; explicit approval before Phase 3 expansion or merge.

## Milestone boundary
F1–F7 passed on generator revision `04f5b5c`. The 19 worlds include three canonical seeds and 16 previously declared holdout seeds. Start with [the atlas and F8 questions](review/README.md). The latest observations and reproduction commands are in [project state](PROJECT_STATE.md). F8 and F9 require the author's decision before Phase 3 or merge.
