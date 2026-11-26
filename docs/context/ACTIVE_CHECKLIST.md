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
- [x] F8-R: Fix both original Phase 2 failures and the area-weighting regression `3508323923`. Verify all 31 known worlds plus two predeclared cohorts. CI passed 32/32. The holdouts passed 13/16 with three reproducible Phase 1 failures present on the baseline. [Recovery evidence and maps](review/f8r/README.md)
- [ ] F8-T: Signed relief, morphology, bathymetry and final drainage are implemented and mapped. Canonical basin coverage and the straight tectonic footprints remain open. [Coverage](FOUNDATION_PHYSICAL_COVERAGE.md)
- [x] F8-T regional archipelago: Prehistorical coordinates, island footprints, elevations, physical sources, shore depths and measured water links. Twelve real worlds preserve macro-island identities through regional refinement. Thirty candidates depend on the target physical area. [Regional atlas](review/f8t/archipelago/README.md)
- [x] F8-C: Inventory all Phase 0 channels, evaluate 1,031 inputs and reverse order, verify fixed-seed causality and immutable fail-closed handoffs. The extreme storm case that crosses a Phase 1 validation limit is reported separately. [Evidence](review/f8t/README.md)
- [ ] F8-D: Map and measure diversity, including the unresolved rectilinear stretches of coast, extreme water support and distinctions among physical opportunities.
- [ ] F8-S: The 32 original regressions pass twice and the expanded CI suite passes 39/39. The 64-seed stress suite and seven edge seeds have executed. Preserve and diagnose held-out failures before closing the technical gate.
- [x] F8-V: Physical atlas for 13 actual worlds, including rejected candidates, source matrix, and evidence for author examination. [Packet](review/f8t/README.md)
- [ ] F8: Author review of physical coherence, causal meaning, variation and downstream narrative potential. Record decision or requested rule changes and retest unseen seeds. Do not claim author acceptance.
- [ ] F9: Final reconciliation of docs/code/tests/phase readiness; explicit approval before Phase 3 expansion or merge.

## Milestone boundary
F1–F7 passed on `04f5b5c`. F8-Q established physical passage, route and center/periphery evidence. F8-R closed the scoped Phase 2 regressions on `9f5da47`. F8 and F9 require the author's decision before Phase 3 or merge. [Project state](PROJECT_STATE.md) · [F8-Q review packet](review/f8q/README.md) · [F8-R review packet](review/f8r/README.md)

Active global objective: [WORLDGEN_PHASE0_2_GLOBAL_GOAL.md](WORLDGEN_PHASE0_2_GLOBAL_GOAL.md). Engineering steps may be interleaved, but resolve known F8-R failures first and preserve F8-Q. These review tasks are not additional WorldGen phases.

- [ ] F8-T regional carrier closure: verify canonical physical source records, complete island footprints/shorelines/measurements and connected eligible counts on current CI; then establish per-island environmental carriers (climate, freshwater, local access) before historical consumers. Keep area sensitivity advisory until author approves playable scale. No Phase 16 implementation.

- [x] F8-T island environment: inherited climate, local downhill catchments and coverage-weighted Phase 2 projection passed CI on 40 worlds and repeat export on eight local worlds. [Evidence](review/f8t/archipelago/saddle-audit.json)
- [x] F8-T regional fragmentation: measured traces reconnect two erosion fragments and one fault fragment when only the drowned cells of their originating process are restored. [Evidence](review/f8t/archipelago/fragment-audit.json)
- [ ] F8-T local environmental limits: detailed local climate, freshwater persistence and island recovery/access still require physical interpretation. Keep unmatched macro climate cells visible in subsequent work.
