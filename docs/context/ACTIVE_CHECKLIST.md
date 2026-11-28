# Active checklist — WorldGen V1 Foundation Closure

Current engineering work only. Past iterations and measurements are preserved in git and the linked reports. Updated 2026-11-28 for the 05-B checkpoint and 05-C scope clarification.

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
- [x] 04-C absolute recharge: ordinary inflow supports ecological tempo and low-season inflow limits recurring stress on a common density scale. Route reentry keeps its separate physical support. Fixed inputs cover five restored recovery cases and preserve the pressure fields, stabilization timing and shelter-based persistence. [Recovery implementation and tests](CRITICAL_RESIDUAL_RECOVERY.md)
- [x] 04-C verification on `cc06a00` exported 170/173 unique worlds and preserved Phase 0 and Phase 1 hashes for all 165 prior exports. Mandatory 49/49 and 27/27 checks, original stress 64/64, independent 62/64, edges 7/7, additional 8/11, and separate regressions 2/2 and 5/5. Deterministic repeats, browser and GitHub Actions passed. [Pinned verification](review/f8t/closure/prompt-04c-verification.json) · [GitHub Actions](https://github.com/gdrclm/game/actions/runs/45965882650)
- [x] 04-D tectonic contacts: on otherwise single-body relief, generate a shared-face reading of the same plate positions and motions before hydrosphere. The three targeted worlds have a supported split, offshore chain and full exports. Preserve the three in the separate plate-contact regression cohort. [Plate measurements and maps](CRITICAL_GEOGRAPHY_CLOSURE.md)
- [x] 04-D physical route continuity: export existing water paths and adjacent land cells by route ID. Tests compare each route with its source and real land/water raster. Physical overlap, repeated-stress support and route reopening keep their independent carriers. [Physical inputs for later phases](CRITICAL_GEOGRAPHY_CLOSURE.md#физические-данные-для-будущих-фаз)

- [x] 04-D full verification on `3289ac9`: 173/173 unique exports, all 170 prior packages byte-identical apart from the new marine path field in Phase 1. Mandatory 49/49 with 28/28 checks, fixed stress 64/64 and 64/64, edges 7/7, additional 11/11, and separate controls 2/2, 5/5 and 3/3. Deterministic repeats, browser and GitHub Actions passed. [Pinned verification](review/f8t/closure/prompt-04d-verification.json)

- [x] 05 G2: bind the complete current marine export to source graph orientation and signed land/water at assembly. Reject omissions, nonphysical paths and inconsistent preserved evidence. Accept legacy geometry at its historical format.
- [x] 05 R1 and R2: expose route-specific path timing and split numerical causal axes from the display profile. Hold fixed water, pressure and regional weather in separate counterfactuals. [Audit and counterfactuals](FOUNDATION_FINAL_CAUSAL_AUDIT.md)

- [x] 05 pinned verification on `06738ab`. Preserve 173/173 prior worlds and run 14/16 fresh exports, 31/31 required checks, deterministic repeats, browser and CI. [Verification](review/f8t/closure/prompt-05-causal-verification.json)

- [x] F8-C / 05 G2, R1, R2: authoritative marine raster/graph validation and current-format survey integrity; measured path-local weather; canonical numerical axes distinct from readability calibration. 31/31 checks and all 173 prior exports preserved. [05 evidence](FOUNDATION_FINAL_CAUSAL_AUDIT.md)

## Active technical work (do not restart completed milestones)

The 05-B checkpoint follows two source fixes and a bounded deformation experiment. [05-B closure](FOUNDATION_RESIDUAL_GEOGRAPHY_CLOSURE.md)

- [x] 05-B A: preserve the signed isolated inland water at `813476365`, its local climate samples, catchments and ordinary/low-season source budgets. Closed-shore and boundary-water counterfactuals pass.
- [x] 05-B B: measure the previously missed island transect and two continental inlets at `3224355349`. Original routes remain measured on the same surface. Require independent rerouting or disconnection evidence and open terminal access. Open-coast negative control passes.
- [x] 05-B C experiment: implement and test a common clipped contact carrier, normal motion, shear and ridge orientation under fixed kinematics. Retain the diagnostic entry.
- [ ] G1 / 05-C: compare existing hybrid and 05-B experimental contact carrier by demonstrated downstream physical utility and losses. Candidate loses `regional_island_1251_668` on `2546155002` and reduces connected capacity at >=1.0 from 36 to 25 on `1122193213`. Preserve controls and canonical hybrid unless a justified replacement is verified or an explicit V1 policy is approved. No scientific precision for its own sake.
- [x] 05-B pinned verification: 189/189 known exports, 187/187 prior exports, 49/49 mandatory worlds with 34/34 checks, deterministic repeats, Phase 0 audit, Chromium/runtime and CI. [Pinned evidence](review/f8t/closure/prompt-05b-residual-geography-verification.json)

- [ ] 05-C: confirm sufficient independent existing water, shelter, route and recovery carriers for current scope. Actual attenuation, loss, retention duration, practical access budgets and recovery timing remain documented limitations, deferred unless a specific critical causal/contract need is shown. Preserve measured source access and delivery. [Scope](WORLDGEN_GAMEPLAY_PHYSICAL_SUFFICIENCY.md).
- [ ] F8-D / 05-C: quantify meaningful functional effects of rectilinear morphology, wind-band discontinuities and origin skew on terrain diversity, pathways, climate and water; correct demonstrated defects, defer unsupported refinements. Preserve verified process controls; no quotas.
- [ ] 05-C: produce FOUNDATION_GAMEPLAY_SUFFICIENCY_REVIEW.md with real metrics/maps, precise dispositions and author decisions; [current task](NEXT_ENGINEERING_MILESTONE.md).
- [ ] F8-D: the V1 area rule accepts two new second landmasses with entirely oceanic plate labels. Continental crust composition, minimum playable island scale and diversity of origin remain under author review. [Implementation register](CRITICAL_GEOGRAPHY_CLOSURE.md) · [Author queue](AUTHOR_REVIEW_QUEUE.md)

- [ ] F8: author approval of physical coherence, scale of playable islands and explicit design decisions. [Queue](AUTHOR_REVIEW_QUEUE.md)
- [ ] F9: final reconciliation of contracts, code, evidence and phase readiness. Explicit approval before Phase 3 or merge.

## Boundaries
No Phase 3, new history or player runtime integration before their respective gates. Do not change main. One archipelago and 30 V1 playable roles are existing scope; the physical candidate threshold is advisory. [Global goal](WORLDGEN_PHASE0_2_GLOBAL_GOAL.md) · [Current state](PROJECT_STATE.md).
