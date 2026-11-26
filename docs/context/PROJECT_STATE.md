# Project state · Paths WorldGen V1

Current checkpoint: `c0406d1`, macro recovery on branch `worldgen/v1-foundation-closure` (26 November 2026). Verified baseline HEAD `d0b44e7`. The verified code is `c642b9b`; mandatory CI completed successfully. [Mandatory CI](https://github.com/gdrclm/game/actions/runs/45853942907)

## Current status

| System | Confirmed | Open |
|---|---|---|
| Phase 0 | 1,031 seeds, 14 namespaces, deterministic export | Later historical consumers |
| Phase 1 | Signed relief and bathymetry, physical terrain and climate, regional islands, actual drainage branches, potential retention and conserved source allocation | Tectonic/coastal morphology, atmospheric transitions, physical water persistence |
| Phase 2 | Record-bound pressure and rhythm, local island water/shelter interpretation, measured seasonal limit for recurring stress | Refuge persistence semantics, macro shelter and remaining Phase 2 stress rejections |
| V1 islands | Physical carriers, complete footprints and stable IDs, maritime connectivity and individual physical environment | Playable area/density and final island selection (Phase 16 onward) |

## Latest verified tests

- `c642b9b`: GitHub Actions completed successfully with 49/49 mandatory worlds and the Phase 0 audit. The 12 fresh targeted worlds have 4 passing exports versus 2 at `d0b44e7`. On Node 22.23.5 the paired Phase 0 bundles, Phase 1 packages, physical diagnostics and pressure field values match. An additional four predeclared worlds yield 3/4 on both revisions; `2030830666` is a retained independent tension/relief rejection. [CI](https://github.com/gdrclm/game/actions/runs/45853942907) · [Metrics](review/f8r/macro-recovery-seasonality.md)
- `fd84d39`: 49/49 mandatory worlds and 22/22 substantive checks in local audit, Phase 0 1,031 seeds. GitHub Actions 45844786657 completed successfully.
- Three accepted controls `42`, `16908799`, `640306144`: 220 island records, deterministic repeated exports; Phase 0–1 and previous Phase 2 fields unchanged relative to `28e0f47`.
- Four predeclared new seeds: 3/4 on both revisions. `2666689910` reproducibly rejects on tension_vs_relief; not introduced by the latest change.
- Original stress set: 56/64 on `1bb7f39`, all eight remaining rejections in Phase 2. Four continental cases fixed by observed highstand fallback; `1715244351` fixed by denser supported drift-track search; `3840024598` fixed by excluding edge-only macro sea; mandatory cohort grew to 49. [Scale report](review/f8t/closure/highstand-scale-audit.json).
- Earlier pinned checkpoint `4ff1f8f`: original stress 54/64, independent stress 54/64, edge 7/7. These are historical measurements, not a fresh full stress result for latest HEAD. [Independent report](review/f8t/closure/independent-holdout-audit.json).
- Chromium Phase 0 5/5 and existing runtime harness 270/270 reported at `27eebca`. [CI](https://github.com/gdrclm/game/actions/runs/45838652344).

## Local water and island interpretation

Phase 1 measures final downhill branches, terminal intersections, potential storage under first and linked spill saddles, normal/low-season inflow, allocated supply without double counting nested sources, dry-land reachability, distance and elevation gain. Island climate includes local elevation adjustment, windward terrain barriers and inherited storm exposure.

Phase 2 `regionalIslandEnvironmentalProjection` now additionally exports seasonal inflow reduction, exposed-land storm contribution, allocated low-season supply per entire island area, and lower/upper bounds of wind-sheltered land with source access. The intersection is not known exactly when the bounds differ. This is not an estimate of freshwater potability, actual water storage duration, or full recovery dynamics. The island projection remains separate in scale from the macro recovery model.

In the island checkpoint the three control worlds retained their earlier macro recovery scores (42: 0.180365; 16908799: 0.189504; 640306144: 0.204803). Positive inflow can coexist with no reachable source. [Measurements and maps](review/f8t/local-water/README.md).

## Macro recovery causal checkpoint

Measured low-season inflow caps the recurring-stress runoff contribution. The recovery tempo capacity uses structural reliability when local inflow is available. Basin drought still enters scarcity and the recurring-stress ceiling. The model retains the existing inputs for refuge persistence and stabilization interval. Recovery diagnostics keep local inflow, source reachability, allocated budget, delivery geometry and potential retention separate.

On fixed Phase 1 inputs `42` and `16908799` pass with recovery 0.182541 and 0.186435. `3928839710` and `1054323503` pass the original validation. `4144686569` and `2666689910` still reject. The stronger variant that also capped refuge duration caused regressions on mandatory `1431655765` and `2964753490`. The committed split passes both in fixed-input replay. [Causal trace and before/after evidence](review/f8r/macro-recovery-seasonality.md)

## Remaining engineering blockers

- Macro refuge persistence still uses catchment scale and continuity. The 9,407 land cells of `4144686569/basin_001` drain to 443 terminals. Two distinct relief regions inherit the same structural support despite different source budgets and paths.
- Five original tension/relief cases remain in targeted replay, together with additional controls `4144686569`, `2666689910` and `2030830666`. `1665754063` still fails differentiation. [Exact evidence and competing hypotheses](HIGH_REASONING_REVIEW_QUEUE.md).
- Exact spatial overlap between shelter and water access, actual persistence and recovery timing; geometry/atmospheric diversity remain open. Previous atmosphere candidates were not merged because of maritime regressions.
- Full original and independent stress cohorts must be rerun on a stabilized final candidate before F8 closure. Do not repeatedly run full cohorts during exploratory changes.

## Island scale and author gates

Historical 54 accepted original stress worlds: 54/54 with 30 connected candidates at 0.25 macro-cell area, 48/54 at 0.5, 19/54 at 1.0. Independent cohort: 54/54, 52/54, 23/54 respectively. These are not playable island counts. 30 V1 roles remain the contract; minimum physical area is advisory, not selected. Verified erosion/fault fragments, shelf connectivity and volcanic provenance preserved. [Regional atlas](review/f8t/archipelago/README.md).

Author decisions remain open on playable scale, physical acceptance, single-continent policy if a physically supported second continent is unavailable, interpretation of differentiation gate, and shelter/water access in harsh worlds. No threshold relaxation or design changes without approval. [Author queue](AUTHOR_REVIEW_QUEUE.md).

## Next action

Prompt 01 produced a verified seasonal split, but the macro refuge persistence item remains open. Continue with prompt 02 (Medium / Standard), [island environment spatial closure](NEXT_ENGINEERING_MILESTONE.md). The exact spatial evidence should also support the later macro refuge audit. Do not rerun the completed seasonal experiment. Return to macro integration only after its missing physical support is measured; separate differentiation audit remains pending. Full stress results have NOT been rerun at c642b9b: six original failures remain in targeted replays, not a newly certified 58/64. [Review queue](HIGH_REASONING_REVIEW_QUEUE.md).

[Active checklist](ACTIVE_CHECKLIST.md) · [Global goal](WORLDGEN_PHASE0_2_GLOBAL_GOAL.md) · [Coverage](FOUNDATION_PHYSICAL_COVERAGE.md) · [Physical plan](FOUNDATION_PHYSICAL_PLAN.md) · [F8-Q evidence](review/f8q/README.md) · [F8-R evidence](review/f8r/README.md) · [F8-T evidence](review/f8t/README.md).
