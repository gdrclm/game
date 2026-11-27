# Active checklist — WorldGen V1 Foundation Closure

Current engineering work only. Past iterations and measurements are preserved in git and the linked reports. Updated 2026-11-27 for the 04-B implementation checkpoint.

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
- [x] F8-T prompt 02 regional environment: exact cell overlap of wind shelter and dry-land access to potential water sources, ordinary and low-season replenishment, and conserved allocated budget for sheltered land. Three accepted controls and one Phase 2 rejection measured, legacy projections and malformed input exercised, four independent holdout worlds passed. [Maps and evidence](review/f8t/local-water/island-overlap.md)
- [x] Mandatory audit on `15bfdbb` passed locally with Node 22.23.5, 49/49 worlds, 24/24 checks and the Phase 0 audit. [GitHub Actions](https://github.com/gdrclm/game/actions/runs/45859419936)
- [x] F8-D prompt 03 inland slope seam: measured reduction on 14 paired worlds with the same island shapes, fracture and erosion provenance, registered sea paths and capacity counts. [Paired maps and measures](review/f8t/regional-relief-diversity.md)
- [x] Mandatory audit at `0260b5d`: 49/49 worlds, 24/24 local checks, deterministic exports and the Phase 0 audit. [GitHub Actions](https://github.com/gdrclm/game/actions/runs/45866373220)
- [x] F8-S prompt 04 pinned mandatory audit at `0c11b75`: 49/49 worlds, 24/24 checks, 1,031 Phase 0 seeds, Chromium Phase 0 5/5, gameplay 270/270 and game startup. [Reproduction and evidence](review/f8t/closure/prompt-04-stress-audit.md)
- [x] F8-S prompt 04 fixed cohorts at `0c11b75`: 58/64 original, 60/64 independent, 7/7 edge and 4/11 additional controls. Export hashes and rejection reports reproduced. [Cohorts and remaining failures](review/f8t/closure/prompt-04-stress-audit.json)
- [x] F8-T macro diagnosis: measure the joint wind shelter and low-season replenishment on the same signed macro relief cells. Fixed-replenishment wind reversal and four accepted recovery controls exercised. [Spatial measurements](review/f8t/closure/prompt-04-stress-audit.md#макровосстановление-и-укрытия)
- [x] 04-B recovery: use measured macro shelter and its local seasonal replenishment in refuge persistence. Fixed-total changes affect local persistence independently of pressure, delivery, retention, tempo and recurring stress. The intermediate checkpoint passes all 49 mandatory worlds. [Implementation evidence](CRITICAL_IMPLEMENTATION_CLOSURE.md)
- [x] 04-B differentiation: separate constant route cost from periodic weather closures. The formerly rejected `1665754063` now passes the same gate with identical pressure axes on fixed input. [Named axes and counterfactuals](CRITICAL_IMPLEMENTATION_CLOSURE.md)
- [x] 04-B continental search: recover an actual ordinary sea-level split skipped by discrete sampling. Keep positive island support, existing bounds and continental size constraints. [Exact cutoff test](CRITICAL_IMPLEMENTATION_CLOSURE.md)
- [x] 04-B island delivery: preserve measured distance, ascent and unshielded path distance distributions through the Phase 2 island projection, with validation and legacy compatibility. Preserve four paired geography controls and 302 island footprints. [Paired maps](review/f8t/closure/prompt-04b-physical-controls.pdf)
- [x] 04-B verification on `a3df0d2`: 49/49 mandatory and 27/27 checks, 62/64 original stress, 61/64 independent, 7/7 edges, 6/11 additional. Preserve all 158 prior exports and restore seven cases. Browser and GitHub Actions pass. [Pinned verification](review/f8t/closure/prompt-04b-implementation-audit.json) · [GitHub Actions](https://github.com/gdrclm/game/actions/runs/45952961529)

## Active technical work (do not restart completed milestones)

Next execute [04-C — residual recovery implementation](NEXT_ENGINEERING_MILESTONE.md) before [prompt 05](PROMPT_05_INDEPENDENT_CAUSAL_AUDIT.md). The 04-B implementation restores seven unique rejected seeds; 49 mandatory + two separately protected restored seeds pass CI. Five technical recovery rejects and three author-policy continental cases remain. Do not repeat resolved navigation separation, exact-cutoff search or delivery measurement.

The [04-B implementation checkpoint](CRITICAL_IMPLEMENTATION_CLOSURE.md) adds measured physical inputs and separates temporal navigation from static route cost. Keep macro refuge, local environment, macro physical diversity and F8-S open until their evidence or explicit author-policy gates are resolved.

- [ ] F8-T macro water closure: establish how absolute replenishment, coherent sheltered area and loss determine refuge duration. Keep source access and delivery separate. Retain both excess and weak recovery controls. [Open hypotheses and exact rejections](HIGH_REASONING_REVIEW_QUEUE.md)
- [ ] F8-T local environment: storm attenuation, practical access budgets applied to measured route geometry, actual water persistence and recovery timing require further physical evidence.
- [ ] F8-D: resolve or explain rectilinear tectonic/coastal features and narrow origin distributions; preserve actual regional fragments and measured marine paths. Test candidate atmospheric changes only against full causal/transport controls.
- [ ] F8-S: resolve or record the explicit disposition of four excess-recovery cases, one weak gameplay signal and three unsupported continental cases. Repeat the fixed cohorts after relevant production changes. [Implementation register](CRITICAL_IMPLEMENTATION_CLOSURE.md) · [Review queue](HIGH_REASONING_REVIEW_QUEUE.md)
- [ ] F8: author approval of physical coherence, scale of playable islands and explicit design decisions. [Queue](AUTHOR_REVIEW_QUEUE.md)
- [ ] F9: final reconciliation of contracts, code, evidence and phase readiness. Explicit approval before Phase 3 or merge.

## Boundaries
No Phase 3, new history or player runtime integration before their respective gates. Do not change main. One archipelago and 30 V1 playable roles are existing scope; the physical candidate threshold is advisory. [Global goal](WORLDGEN_PHASE0_2_GLOBAL_GOAL.md) · [Current state](PROJECT_STATE.md).
