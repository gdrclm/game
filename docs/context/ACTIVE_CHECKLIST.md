# Active checklist — WorldGen V1 Foundation Closure

Current engineering work only. Past iterations and measurements are preserved in git and the linked reports. Updated 2026-11-26 for the bounded macro recovery change `c642b9b`.

## Confirmed
- [x] F1–F7: official Phase 0 intake, Phase 1 geography and physical links, Phase 2 export, deterministic orchestration, fail-closed contracts and original review packet. [Evidence](review/README.md)
- [x] F8-Q: physical passage closure with accessible terminals, transport alternatives and center/periphery measurements. [Evidence](review/f8q/README.md)
- [x] F8-R: original recovery regressions 16908799, 2764796977 and area weighting case 3508323923. [Evidence](review/f8r/README.md)
- [x] F8-T regional carriers: canonical regional terrain, complete island geometry, sources, water connectivity, inheritance and capacity sensitivity; actual fragment counterfactuals. [Atlas](review/f8t/archipelago/README.md)
- [x] F8-T island environment: inherited climate, local downhill catchments, coverage-weighted Phase 2 projection. [Evidence](review/f8t/archipelago/saddle-audit.json)
- [x] F8-C: Phase 0 1,031 seed and namespace audit; fixed-seed physical causal checks and immutable handoffs.
- [x] F8-V: actual physical and regional diagnostic atlases, including rejection and intervention cases. Author inspection remains pending.
- [x] Mandatory 43-world CI and browser checks on 4f23a9f. [CI](https://github.com/gdrclm/game/actions/runs/45780913571)
- [x] Final-drainage spatial bridge: exact terminal and carrier intersections, normalized sill storage and dry-land source reachability, at both macro and island resolution. Phase 2 carries the validated physical factors. Four focused accepted worlds and the intentional Phase 2 rejection `4144686569` exercised.
- [x] Island physical setting: normalized thermal-ranges from local elevation, windward barrier and landfall paths, plus upstream flow at reached sources. Focused counterfactuals keep climate, shelter, water supply and transport independent.

- [x] F8-S pinned checkpoint on `4ff1f8f`: 43/43 mandatory, 54/64 original stress, 7/7 edges, unchanged rejection causes. Independent holdout pinned to `4ff1f8f`: 54/64, with all repeated exports and failures accounted for. [Maps and exact rejections](review/f8t/local-water/README.md)
- [x] Linked-basin retention on `bd3eb9b`: capacity before first saddle and capacity on the spill path to existing water are distinct. Four focused worlds and an intentional rejection exercised.

- [x] Sea boundary regression: retain polar boundary-only water as measured geometry and require an interior cell for a macro sea; `3840024598` now belongs to the mandatory cohort. [Evidence](review/f8t/closure/README.md)

- [x] Canonical inland bottleneck endpoints and observed highstand fallback. Four full targeted exports exercise previously rejected continental cases and expand the mandatory cohort to 48. [Evidence](review/f8t/continental-shoreline/README.md)

- [x] Refined drift-track search and conserved water allocation. Fixed-seed reruns on `27eebca` pass for 1715244351 and 640306144. CI on `27eebca` passes 49/49 mandatory worlds. Chromium Phase 0 5/5 and runtime harness 270/270 pass. [CI](https://github.com/gdrclm/game/actions/runs/45838652344) · [Current maps](review/f8t/closure/README.md)
- [x] F8-T island interpretation: local seasonal inflow reduction, exposed-land contribution to storm pressure, low-season budget across all island land, and bounds on sheltered land with source access. Fixed-wind, fixed-water and older input cases exercised. Three accepted control worlds retain their exports. [Measurements](review/f8t/local-water/README.md)
- [x] Local mandatory audit for `fd84d39` on Node 22.23.5: 49/49 worlds and 22/22 checks with causal interventions. Phase 0 audit covers 1,031 seeds. Additional four-world cohort yields 3/4 on both revisions, with the pre-existing rejection tracked. [Measurements](review/f8t/local-water/README.md) · [CI success](https://github.com/gdrclm/game/actions/runs/45844786657)

- [x] F8-R macro seasonality: fixed-input tests isolate repeated water stress from tempo capacity, source delivery, retention and island wind. Two original tension/relief failures pass. [Causal evidence](review/f8r/macro-recovery-seasonality.md)
- [x] Mandatory CI at `c642b9b`: 49/49 worlds, deterministic generation, Phase 0 audit and fixed-input causal interventions. [GitHub Actions](https://github.com/gdrclm/game/actions/runs/45853942907)

## Active technical work (do not restart completed milestones)

Prompt 01 has a verified implementation checkpoint, but not full macro closure. Next execute [prompt 02 — island spatial environment](NEXT_ENGINEERING_MILESTONE.md); use its measured joint shelter/replenishment evidence for a later focused macro refuge follow-up. Keep all six open items until their respective evidence and author gates are satisfied.

- [ ] F8-T macro water closure: derive refuge persistence from spatial replenishment and macro wind shelter. Keep source access and delivery separate. [Open hypotheses and exact rejections](HIGH_REASONING_REVIEW_QUEUE.md)
- [ ] F8-T local environment: spatial overlap where the exported bounds differ, storm attenuation, actual water persistence and recovery timing require further physical evidence.
- [ ] F8-D: resolve or explain rectilinear tectonic/coastal features and narrow origin distributions; preserve actual regional fragments and measured marine paths. Test candidate atmospheric changes only against full causal/transport controls.
- [ ] F8-S: investigate the six remaining original Phase 2 stress failures, additional controls 4144686569, 2666689910 and 2030830666, and independent holdout failures. Repeat the fixed cohorts after changes to macro pressure, recovery, terrain or climate. [Pinned 56/64 stress evidence](review/f8t/closure/highstand-scale-audit.json) · [Current Phase 2 failures](HIGH_REASONING_REVIEW_QUEUE.md)
- [ ] F8: author approval of physical coherence, scale of playable islands and explicit design decisions. [Queue](AUTHOR_REVIEW_QUEUE.md)
- [ ] F9: final reconciliation of contracts, code, evidence and phase readiness. Explicit approval before Phase 3 or merge.

## Boundaries
No Phase 3, new history or player runtime integration before their respective gates. Do not change main. One archipelago and 30 V1 playable roles are existing scope; the physical candidate threshold is advisory. [Global goal](WORLDGEN_PHASE0_2_GLOBAL_GOAL.md) · [Current state](PROJECT_STATE.md).
