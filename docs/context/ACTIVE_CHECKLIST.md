# Active checklist — WorldGen V1 Foundation Closure

Current engineering work only; past iterations and measurements are preserved in git and the linked reports. Updated 2026-11-26 against 73fb7a8.

## Confirmed
- [x] F1–F7: official Phase 0 intake, Phase 1 geography and physical links, Phase 2 export, deterministic orchestration, fail-closed contracts and original review packet. [Evidence](review/README.md)
- [x] F8-Q: physical passage closure with accessible terminals, transport alternatives and center/periphery measurements. [Evidence](review/f8q/README.md)
- [x] F8-R: original recovery regressions 16908799, 2764796977 and area weighting case 3508323923. [Evidence](review/f8r/README.md)
- [x] F8-T regional carriers: canonical regional terrain, complete island geometry, sources, water connectivity, inheritance and capacity sensitivity; actual fragment counterfactuals. [Atlas](review/f8t/archipelago/README.md)
- [x] F8-T island environment: inherited climate, local downhill catchments, coverage-weighted Phase 2 projection. [Evidence](review/f8t/archipelago/saddle-audit.json)
- [x] F8-C: Phase 0 1,031 seed and namespace audit; fixed-seed physical causal checks and immutable handoffs.
- [x] F8-V: actual physical and regional diagnostic atlases, including rejection and intervention cases. Author inspection remains pending.
- [x] Mandatory 43-world CI and browser checks on 4f23a9f. [CI](https://github.com/gdrclm/game/actions/runs/45780913571)

## Active technical work (do not restart completed milestones)
- [ ] F8-T water closure: trace actual terminal branches, local access and climate coverage; separate water support from shelter and recovery. Retain 42, 16908799 and all confirmed regression controls; no global coefficient patch to force acceptance.
- [ ] F8-T local environment: per-island water persistence/access, climate refinement and physical recovery interpretation; report unresolved data, not guessed potable-water availability.
- [ ] F8-D: resolve or explain rectilinear tectonic/coastal features and narrow origin distributions; preserve actual regional fragments and measured marine paths. Test candidate atmospheric changes only against full causal/transport controls.
- [ ] F8-S: resolve or present explicit author-policy blockers for 10 stress failures (2 Phase 1, 8 Phase 2) and other retained controls. Repeat full 43-world CI, same 64 stress + 7 edges on a single candidate revision and new predeclared holdouts. [Current 54/64 evidence](review/f8t/foundation-scale-latest.json)
- [ ] F8: author approval of physical coherence, scale of playable islands and explicit design decisions. [Queue](AUTHOR_REVIEW_QUEUE.md)
- [ ] F9: final reconciliation of contracts, code, evidence and phase readiness. Explicit approval before Phase 3 or merge.

## Boundaries
No Phase 3, new history or player runtime integration before their respective gates. Do not change main. One archipelago and 30 V1 playable roles are existing scope; the physical candidate threshold is advisory. [Global goal](WORLDGEN_PHASE0_2_GLOBAL_GOAL.md) · [Current state](PROJECT_STATE.md).
