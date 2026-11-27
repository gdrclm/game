# Project state · Paths WorldGen V1

Current checkpoint: `ef7718b`, prompt 04 stress audit on branch `worldgen/v1-foundation-closure` (27 November 2026). Pinned program revision `0c11b75890f86354dec208066e95c862ff81fe87`; program code matches the verified regional reconstruction `0260b5d`. [Stress audit and reproducible controls](review/f8t/closure/prompt-04-stress-audit.md) · [Mandatory CI on `0260b5d`](https://github.com/gdrclm/game/actions/runs/45866373220)

## Current status

| System | Confirmed | Open |
|---|---|---|
| Phase 0 | 1,031 seeds, 14 namespaces, deterministic export | Later historical consumers |
| Phase 1 | Signed relief and bathymetry, physical terrain and climate, regional islands with improved inland slope reconstruction, actual drainage branches, potential retention and conserved source allocation | Tectonic/coastal morphology, atmospheric transitions, physical water persistence |
| Phase 2 | Record-bound pressure and rhythm, exact regional island shelter/source overlap and areal inflow, measured seasonal limit for recurring stress | Refuge persistence semantics, macro shelter and remaining Phase 2 stress rejections |
| V1 islands | Physical carriers, complete footprints and stable IDs, maritime connectivity and individual physical environment | Playable area/density and final island selection (Phase 16 onward) |

## Latest verified tests

- On `0c11b75` and Node 22.23.5, all 49 mandatory worlds and 24 checks pass, including causal interventions and deterministic exports. Phase 0 passes on 1,031 seeds in 14 namespaces. Chromium passes 5 Phase 0 and 270 gameplay tests, and game startup. [Exact cohort membership, metrics and hashes](review/f8t/closure/prompt-04-stress-audit.json)
- On the same revision the fixed original stress cohort passes 58/64, independent holdout 60/64, uint32 edges 7/7 and additional controls 4/11. Rejected worlds repeat the same gates. `3928839710` and `1054323503` remain restored. [Failure families and physical measurements](review/f8t/closure/prompt-04-stress-audit.md)
- `0260b5d`: GitHub Actions passed the mandatory audit. On Node 22.23.5 the local suite passed 49/49 worlds and 24/24 checks, and the Phase 0 audit passed on 1,031 seeds. Fourteen paired worlds preserve regional footprints, sea depths, source provenance and marine networks. Thirteen export and the existing `4144686569` rejection repeats. Phase 0, the macro part of Phase 1 and the macro pressure and rhythm packages match. A predeclared four-world holdout has three passing worlds and the same `1683167796` tension/relief rejection on both revisions. [Evidence](review/f8t/regional-relief-diversity.md)
- `15bfdbb`: local mandatory audit on Node 22.23.5 passed 49/49 worlds, 24/24 checks and the separate Phase 0 audit of 1,031 seeds. Accepted and deterministic controls `42`, `16908799`, `640306144`; repeatable existing rejection `4144686569`. Paired snapshots preserve prior physical and macro recovery fields. The four predeclared holdouts pass, and the intake test accepts legacy bounds and rejects malformed overlap. [Maps and counts](review/f8t/local-water/island-overlap.md) · [CI](https://github.com/gdrclm/game/actions/runs/45859419936)
- `c642b9b`: GitHub Actions completed successfully with 49/49 mandatory worlds and the Phase 0 audit. The 12 fresh targeted worlds have 4 passing exports versus 2 at `d0b44e7`. On Node 22.23.5 the paired Phase 0 bundles, Phase 1 packages, physical diagnostics and pressure field values match. An additional four predeclared worlds yield 3/4 on both revisions; `2030830666` is a retained independent tension/relief rejection. [CI](https://github.com/gdrclm/game/actions/runs/45853942907) · [Metrics](review/f8r/macro-recovery-seasonality.md)
- `fd84d39`: 49/49 mandatory worlds and 22/22 substantive checks in local audit, Phase 0 1,031 seeds. GitHub Actions 45844786657 completed successfully.
- Three accepted controls `42`, `16908799`, `640306144`: 220 island records, deterministic repeated exports; Phase 0–1 and previous Phase 2 fields unchanged relative to `28e0f47`.
- Four predeclared new seeds: 3/4 on both revisions. `2666689910` reproducibly rejects on tension_vs_relief; not introduced by the latest change.
- Original stress set: 56/64 on `1bb7f39`, all eight remaining rejections in Phase 2. Four continental cases fixed by observed highstand fallback; `1715244351` fixed by denser supported drift-track search; `3840024598` fixed by excluding edge-only macro sea; mandatory cohort grew to 49. [Scale report](review/f8t/closure/highstand-scale-audit.json).
- Earlier pinned checkpoint `4ff1f8f`: original stress 54/64, independent stress 54/64, edge 7/7. [Historical independent report](review/f8t/closure/independent-holdout-audit.json).
- Chromium Phase 0 5/5 and existing runtime harness 270/270 reported at `27eebca`. [CI](https://github.com/gdrclm/game/actions/runs/45838652344).

## Local water and island interpretation

Phase 1 measures final downhill branches, terminal intersections, potential storage under first and linked spill saddles, normal/low-season inflow, allocated supply without double counting nested sources, dry-land reachability, distance and elevation gain. Island climate includes local elevation adjustment, windward terrain barriers and inherited storm exposure.

Phase 1 sums `shelteredWaterAccess` from the same cells as the wind shelter measurement and the same service areas as the whole-island water allocation. Phase 2 carries the exact shelter/source overlap, whole and sheltered ordinary and low-season areal inflow, and allocated low-season supply per sheltered area. Legacy inputs provide the earlier bounds. On `640306144/regional_island_1117_495`, 22 of 27 cells are sheltered and have positive local inflow. Source access is zero and the island has a verified landfall. [Measurements and maps](review/f8t/local-water/island-overlap.md)

Across 220 islands in three accepted control worlds, 32,817 regional cells satisfy both shelter and source reachability; a separate rejected macro control contains 73 islands and 22,867 joint cells. All 293 islands have either full or zero dry-land source reachability under the current unbounded path model. Thus the older overlap bounds already coincided in these actual examples; the new measurement enables joint water metrics and future partial reachability, not evidence of more differentiated accessibility yet. Synthetic disjoint/overlapping masks test the general case. Path exposure, finite practical access and physical retention are unresolved; no implied drinkability or viable settlement claim.

Macro recovery scores before and after the exact island measurement are identical for the three passing controls (42: 0.182541, 16908799: 0.186435, 640306144: 0.207774).

## Macro recovery causal checkpoint

Measured low-season inflow caps the recurring-stress runoff contribution. The recovery tempo capacity uses structural reliability when local inflow is available. Basin drought still enters scarcity and the recurring-stress ceiling. The model retains the existing inputs for refuge persistence and stabilization interval. Recovery diagnostics keep local inflow, source reachability, allocated budget, delivery geometry and potential retention separate.

On fixed Phase 1 inputs `42` and `16908799` pass with recovery 0.182541 and 0.186435. `3928839710` and `1054323503` pass the original validation. `4144686569` and `2666689910` still reject. The stronger variant that also capped refuge duration caused regressions on mandatory `1431655765` and `2964753490`. The committed split passes both in fixed-input replay. [Causal trace and before/after evidence](review/f8r/macro-recovery-seasonality.md)

## Remaining engineering blockers

- Macro refuge persistence still uses catchment scale and continuity. The 9,407 land cells of `4144686569/basin_001` drain to 443 terminals. Two relief regions inherit identical runoff reliability despite about a forty-fold difference in low-season replenishment per wind-sheltered cell. A wind reversal at fixed replenishment changes the overlap. Persistence still needs a separately supported model for time and water loss. [Spatial macro counterfactual](review/f8t/closure/prompt-04-stress-audit.md)
- The recurring excess recovery group and the weak relief signals on `2248663653` constrain both directions of any persistence model change. The sorted-distribution failure on `1665754063` requires an independent trace of its synthesized axes. [Exact evidence and competing hypotheses](HIGH_REASONING_REVIEW_QUEUE.md)
- Shelter attenuation, exposure along the path to a source, actual persistence and ecological recovery timing remain open. Geometry and atmospheric diversity are tracked independently.
- Repeat the fixed cohorts after any production change affecting these mechanisms and keep F8-S open pending architectural resolution and author review of documented design cases.

## Island scale and author gates

Current pinned audit `0c11b75`: original stress accepted worlds 58/58 with 30 connected candidates at 0.25 macro-cell area, 52/58 at 0.5, 19/58 at 1.0; independent accepted worlds 60/60, 58/60, 26/60 respectively. Mandatory 49/49, 45/49, 15/49; edges 7/7, 7/7, 1/7. Denominators are accepted worlds, not all sampled seeds. These are not playable island counts. 30 V1 roles remain the contract; minimum physical area is advisory, not selected. Verified erosion/fault fragments, shelf connectivity and volcanic provenance preserved. [Regional atlas](review/f8t/archipelago/README.md).

Author decisions remain open on playable scale, physical acceptance, single-continent policy if a physically supported second continent is unavailable, interpretation of differentiation gate, and shelter/water access in harsh worlds. No threshold relaxation or design changes without approval. [Author queue](AUTHOR_REVIEW_QUEUE.md).

## Bounded checkpoint

[Prompt 03](review/f8t/regional-relief-diversity.md) reduces coarse-grid slope seams in high regional interiors, with a taper at the boundary of the existing coastal processes. The broad interpolation was rejected after losing the fault fragment on `2546155002`. In 14 paired snapshots the retained reconstruction reduces the share of inland slope change concentrated on macro grid lines by 25.2–38.3 percentage points. F8-D remains open for macro plate contacts, shoreline form, atmospheric transitions and origin diversity. In 14 paired worlds, 1,115 island footprints, provenance, sea depths and marine paths are preserved. Forty-six island sheltered-water summaries change on the refined interior relief; macro packages are unchanged. Capacity at 0.125/0.25/0.5/1.0 macro-cell area is 14/14, 14/14, 11/14, 4/14 worlds with at least 30 connected bodies, including the diagnostic rejected world. This is not playable area acceptance. Physical measurements for macro refuges and actual local persistence remain open. [Maps](review/f8t/regional-relief-diversity.pdf) · [Review queue](HIGH_REASONING_REVIEW_QUEUE.md)

## Pending review

The [prompt 04 checkpoint](review/f8t/closure/prompt-04-stress-audit.md) captures the fixed stress runs and distinguishes measured causal gaps from author policy. The High queue specifies controlled interventions on spatial replenishment, shelter and source delivery and retains the weak-recovery and distribution controls. Macro refuge persistence, practical local environment, coastal and tectonic morphology, atmospheric transitions and origin diversity remain open. [High review queue](HIGH_REASONING_REVIEW_QUEUE.md)

## Next action

[Prompt 04-B — critical implementation closure](NEXT_ENGINEERING_MILESTONE.md), High / Standard, inserted between the completed diagnostic stress audit and prompt 05. The full baseline covers 173 unique seeds, 158 exports and 15 reproducible rejections (10 excess recovery, one weak relief, one sorted pressure/rhythm comparison, three continental minima). First implement verified corrections to recovery and any demonstrated axis coupling; establish a contract-consistent treatment of unsupported continental profiles or present explicit author-policy blockers. Address remaining local and macro physical gaps that materially affect downstream causality. Do not require scientific fidelity irrelevant to V1; do not hide defects as V2. Preserve original evidence and all mandatory controls, rerun fixed cohorts after code changes. The [independent audit, prompt 05](PROMPT_05_INDEPENDENT_CAUSAL_AUDIT.md) is deferred until implementation and its verification checkpoint; it is not a substitute for fixing known defects. No Phase 3 or author acceptance.
[Active checklist](ACTIVE_CHECKLIST.md) · [Global goal](WORLDGEN_PHASE0_2_GLOBAL_GOAL.md) · [Coverage](FOUNDATION_PHYSICAL_COVERAGE.md) · [Physical plan](FOUNDATION_PHYSICAL_PLAN.md) · [F8-Q evidence](review/f8q/README.md) · [F8-R evidence](review/f8r/README.md) · [F8-T evidence](review/f8t/README.md).
