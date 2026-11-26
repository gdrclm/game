# Project state · Paths WorldGen V1

Current checkpoint: `b6c3f4a` (26 November 2026), branch `worldgen/v1-foundation-closure`. Latest code `fd84d39`: [CI success](https://github.com/gdrclm/game/actions/runs/45844786657). No author acceptance, Phase 3 expansion, merge or deployment. This document is a reconciliation of saved evidence, not a new generation run.

## Current status

| System | Confirmed | Open |
|---|---|---|
| Phase 0 | 1,031 seeds, 14 namespaces, deterministic export | Later historical consumers |
| Phase 1 | Signed relief and bathymetry, physical terrain and climate, regional islands, actual drainage branches, potential retention and conserved source allocation | Tectonic/coastal morphology, atmospheric transitions, physical water persistence |
| Phase 2 | Record-bound pressure and rhythm, local island water/shelter interpretation; original F8-R regressions fixed | Macro water/recovery semantics, eight original Phase 2 stress rejections |
| V1 islands | Physical carriers, complete footprints and stable IDs, maritime connectivity and individual physical environment | Playable area/density and final island selection (Phase 16 onward) |

## Latest verified tests

- `fd84d39`: 49/49 mandatory worlds and 22/22 substantive checks in local audit, Phase 0 1,031 seeds. GitHub Actions 45844786657 completed successfully.
- Three accepted controls `42`, `16908799`, `640306144`: 220 island records, deterministic repeated exports; Phase 0–1 and previous Phase 2 fields unchanged relative to `28e0f47`.
- Four predeclared new seeds: 3/4 on both revisions. `2666689910` reproducibly rejects on tension_vs_relief; not introduced by the latest change.
- Original stress set: 56/64 on `1bb7f39`, all eight remaining rejections in Phase 2. Four continental cases fixed by observed highstand fallback; `1715244351` fixed by denser supported drift-track search; `3840024598` fixed by excluding edge-only macro sea; mandatory cohort grew to 49. [Scale report](review/f8t/closure/highstand-scale-audit.json).
- Earlier pinned checkpoint `4ff1f8f`: original stress 54/64, independent stress 54/64, edge 7/7. These are historical measurements, not a fresh full stress result for latest HEAD. [Independent report](review/f8t/closure/independent-holdout-audit.json).
- Chromium Phase 0 5/5 and existing runtime harness 270/270 reported at `27eebca`. [CI](https://github.com/gdrclm/game/actions/runs/45838652344).

## Local water and island interpretation

Phase 1 measures final downhill branches, terminal intersections, potential storage under first and linked spill saddles, normal/low-season inflow, allocated supply without double counting nested sources, dry-land reachability, distance and elevation gain. Island climate includes local elevation adjustment, windward terrain barriers and inherited storm exposure.

Phase 2 `regionalIslandEnvironmentalProjection` now additionally exports seasonal inflow reduction, exposed-land storm contribution, allocated low-season supply per entire island area, and lower/upper bounds of wind-sheltered land with source access. The intersection is not known exactly when the bounds differ. This is not an estimate of freshwater potability, actual water storage duration, or full recovery dynamics. The existing macro recovery formulas remain unchanged.

The current three controls retain their macro recovery scores (42: 0.180365; 16908799: 0.189504; 640306144: 0.204803). Positive inflow can coexist with no reachable source. [Measurements and maps](review/f8t/local-water/README.md).

## Remaining engineering blockers

- Macro recovery conflates catchment size/continuity and water support with multiple recovery channels. On 4144686569, legacy basin_001 spans 9,407 land cells and 443 terminals; equal long-term support is assigned to regions with very different source budgets and access. Three earlier replacement strategies failed accepted controls 42 and/or 16908799. Do not repeat the same global multiplier experiments.
- `1665754063`: differentiation of sorted pressure/rhythm distributions remains rejected. Requires a distinct causal audit, not a water-only fix.
- Original seven tension_vs_relief failures: `1240171611`, `3928839710`, `1054323503`, `2094783996`, `2917478163`, `3206964149`, `4286438917`. Additional controls `4144686569`, `2666689910` reproduce the same gate failure. All eight original Phase 2 rejections and 4144686569 unchanged before/after island interpretation. [Exact evidence and competing hypotheses](HIGH_REASONING_REVIEW_QUEUE.md).
- Exact spatial overlap between shelter and water access, actual persistence and recovery timing; geometry/atmospheric diversity remain open. Previous atmosphere candidates were not merged because of maritime regressions.
- Full original and independent stress cohorts must be rerun on a stabilized final candidate before F8 closure. Do not repeatedly run full cohorts during exploratory changes.

## Island scale and author gates

Historical 54 accepted original stress worlds: 54/54 with 30 connected candidates at 0.25 macro-cell area, 48/54 at 0.5, 19/54 at 1.0. Independent cohort: 54/54, 52/54, 23/54 respectively. These are not playable island counts. 30 V1 roles remain the contract; minimum physical area is advisory, not selected. Verified erosion/fault fragments, shelf connectivity and volcanic provenance preserved. [Regional atlas](review/f8t/archipelago/README.md).

Author decisions remain open on playable scale, physical acceptance, single-continent policy if a physically supported second continent is unavailable, interpretation of differentiation gate, and shelter/water access in harsh worlds. No threshold relaxation or design changes without approval. [Author queue](AUTHOR_REVIEW_QUEUE.md).

## Next action

[NEXT_ENGINEERING_MILESTONE.md](NEXT_ENGINEERING_MILESTONE.md): bounded High-reasoning macro recovery audit and candidate design. Medium for subsequent narrow implementation/verification. Reasoning level is a workflow recommendation, not a measured cost guarantee.

[Active checklist](ACTIVE_CHECKLIST.md) · [Global goal](WORLDGEN_PHASE0_2_GLOBAL_GOAL.md) · [Coverage](FOUNDATION_PHYSICAL_COVERAGE.md) · [Physical plan](FOUNDATION_PHYSICAL_PLAN.md) · [F8-Q evidence](review/f8q/README.md) · [F8-R evidence](review/f8r/README.md) · [F8-T evidence](review/f8t/README.md).
