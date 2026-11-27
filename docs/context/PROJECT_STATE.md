# Project state · Paths WorldGen V1

Current checkpoint: prompt 04-B implementation on branch `worldgen/v1-foundation-closure` (27 November 2026). Program revision `a3df0d21ecbad979b1253611ab93621dbd6b0157`. Baseline verification remains recorded on `0c11b75`. [Implementation and verification](CRITICAL_IMPLEMENTATION_CLOSURE.md) · [Baseline stress audit](review/f8t/closure/prompt-04-stress-audit.md)

## Current status

| System | Confirmed | Open |
|---|---|---|
| Phase 0 | 1,031 seeds, 14 namespaces, deterministic export | Later historical consumers |
| Phase 1 | Signed relief and bathymetry, physical terrain and climate, regional inland slope reconstruction, measured dry-land water delivery, supported continental fallback, actual drainage branches and conserved source allocation | Tectonic/coastal morphology, atmospheric transitions, physical water persistence and unsupported continental candidates |
| Phase 2 | Record-bound pressure and rhythm, distinct static route reliability and weather-driven closures, exact island shelter/source overlap, measured macro shelter/replenishment, seasonal limit for recurring stress | Absolute replenishment and duration of macro refuges, remaining weak/excess recovery rejections |
| V1 islands | Physical carriers, complete footprints and stable IDs, maritime connectivity and individual physical environment | Playable area/density and final island selection (Phase 16 onward) |

## Latest verified tests

- On `a3df0d2` and Node 22.23.5, 49/49 mandatory, 62/64 original stress, 61/64 independent, 7/7 edges and 6/11 additional worlds pass. All 158 prior exports are preserved, and seven seed cases are restored for 165/173 unique exports. The mandatory suite passes 27/27 checks. Phase 0 covers 1,031 seeds, Chromium passes 5 Phase 0 and 270 gameplay tests and game startup, and GitHub Actions passes. [Verified results and remaining failures](CRITICAL_IMPLEMENTATION_CLOSURE.md) · [GitHub Actions](https://github.com/gdrclm/game/actions/runs/45952961529)
- The macro refuge checkpoint `c2e6d87` passed 49/49 mandatory worlds and 25/25 checks. On fixed Phase 1 input, `7c24b60` restores the rhythm differentiation case `1665754063` with identical pressure axes. The definite restores `1665754063` and `2666689910` are covered by a separate CI cohort. [Exact controls](CRITICAL_IMPLEMENTATION_CLOSURE.md)
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

Across 220 islands in three accepted control worlds, 32,817 regional cells satisfy both shelter and source reachability. A separate rejected macro control contains 73 islands and 22,867 joint cells. All 293 islands have either full or zero dry-land source reachability under the unbounded path model. As of 04-B Phase 1 and the Phase 2 island projection also carry p50, p90 and maximum distance, ascent and distance without measured wind shelter along the selected route. Practical access budgets, attenuation and physical retention duration remain open. [Measured examples and geometry controls](CRITICAL_IMPLEMENTATION_CLOSURE.md#d-геометрия-доставки-воды-и-физическая-среда)

Macro recovery scores before and after the exact island measurement are identical for the three passing controls (42: 0.182541, 16908799: 0.186435, 640306144: 0.207774).

## Macro recovery causal checkpoint

Measured low-season inflow caps the recurring-stress runoff contribution. The recovery tempo capacity uses structural reliability when local inflow is available. Basin drought still enters scarcity and the recurring-stress ceiling. Measured refuge persistence now uses the share of wind-sheltered land multiplied by the seasonal fraction of input in that shelter. The general support window allows dry refuges. The canonical Phase 1 layer also records wet sheltered patches inside final drainage branches. Recovery diagnostics keep local inflow, source reachability, allocated budget, delivery geometry and potential retention separate.

On fixed Phase 1 inputs `42` and `16908799` pass with recovery 0.182541 and 0.186435. `3928839710` and `1054323503` pass the original validation. `4144686569` and `2666689910` still reject. The stronger variant that also capped refuge duration caused regressions on mandatory `1431655765` and `2964753490`. The committed split passes both in fixed-input replay. [Causal trace and before/after evidence](review/f8r/macro-recovery-seasonality.md)

## Remaining engineering blockers

- On `4144686569`, the measured macro refuge index distinguishes relief regions that previously shared identical inherited support. Its seasonal fraction still needs explicit absolute replenishment and duration semantics for the remaining excess recovery cases. Weak relief on `2248663653` now passes presence and continues to fail gameplay relevance. [Fixed-input effects and registry](CRITICAL_IMPLEMENTATION_CLOSURE.md)
- Actual wind attenuation, practical access budgets using measured path geometry, physical retention duration and ecological recovery timing remain open. Geometry and atmospheric diversity are tracked independently.
- The original unsupported continental cases still require an explicit policy about admissible worlds or a physically justified uplift redesign. The bounded exact-cutoff fallback fixes skipped supported opportunities within current bounds. [Counterexample and supported controls](CRITICAL_IMPLEMENTATION_CLOSURE.md#c-поддержанный-континентальный-срез)
- Repeat the fixed cohorts after any production change affecting these mechanisms and keep F8-S open pending architectural resolution and author review of documented design cases.

## Island scale and author gates

On baseline `0c11b75`, the original stress set supplied at least 30 connected candidates in 58/58 accepted worlds at 0.25 macro-cell area, 52/58 at 0.5 and 19/58 at 1.0. The independent set yielded 60/60, 58/60 and 26/60. Mandatory counts were 49/49, 45/49 and 15/49. Edge counts were 7/7, 7/7 and 1/7. These are physical candidate counts among accepted worlds. The contract retains 30 V1 roles and the physical area thresholds are diagnostic. Verified erosion/fault fragments, shelf connectivity and volcanic provenance preserved. [Regional atlas](review/f8t/archipelago/README.md).

Author decisions remain open on playable scale, physical acceptance, single-continent policy if a physically supported second continent is unavailable, interpretation of differentiation gate, and shelter/water access in harsh worlds. No threshold relaxation or design changes without approval. [Author queue](AUTHOR_REVIEW_QUEUE.md).

## Bounded checkpoint

[Prompt 03](review/f8t/regional-relief-diversity.md) reduces coarse-grid slope seams in high regional interiors, with a taper at the boundary of the existing coastal processes. The broad interpolation was rejected after losing the fault fragment on `2546155002`. In 14 paired snapshots the retained reconstruction reduces the share of inland slope change concentrated on macro grid lines by 25.2–38.3 percentage points. F8-D remains open for macro plate contacts, shoreline form, atmospheric transitions and origin diversity. In 14 paired worlds, 1,115 island footprints, provenance, sea depths and marine paths are preserved. The refined interior relief changes 46 island sheltered-water summaries while preserving the macro packages. Capacity at 0.125/0.25/0.5/1.0 macro-cell area is 14/14, 14/14, 11/14, 4/14 worlds with at least 30 connected bodies, including the diagnostic rejected world. This is not playable area acceptance. This checkpoint preceded the macro refuge and path-delivery measurements in 04-B. Actual local persistence remains open. [Maps](review/f8t/regional-relief-diversity.pdf) · [Review queue](HIGH_REASONING_REVIEW_QUEUE.md)

## Pending review

The [prompt 04 checkpoint](review/f8t/closure/prompt-04-stress-audit.md) captures the fixed stress runs and distinguishes measured causal gaps from author policy. The High queue specifies controlled interventions on spatial replenishment, shelter and source delivery and retains the weak-recovery and distribution controls. Macro refuge persistence, practical local environment, coastal and tectonic morphology, atmospheric transitions and origin diversity remain open. [High review queue](HIGH_REASONING_REVIEW_QUEUE.md)

## Implementation boundary

The 04-B checkpoint records implemented physical corrections and the remaining technical and author-policy blockers. F8-S stays open while those cases remain. Testing is scoped to Phase 0–2. [Closure evidence](CRITICAL_IMPLEMENTATION_CLOSURE.md) · [High review queue](HIGH_REASONING_REVIEW_QUEUE.md)
[Active checklist](ACTIVE_CHECKLIST.md) · [Global goal](WORLDGEN_PHASE0_2_GLOBAL_GOAL.md) · [Coverage](FOUNDATION_PHYSICAL_COVERAGE.md) · [Physical plan](FOUNDATION_PHYSICAL_PLAN.md) · [F8-Q evidence](review/f8q/README.md) · [F8-R evidence](review/f8r/README.md) · [F8-T evidence](review/f8t/README.md).
