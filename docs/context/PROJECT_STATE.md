# Project state · Paths WorldGen V1

Current checkpoint: `af7b610` (27 November 2026), branch `worldgen/v1-foundation-closure`. Latest verified production `cc06a00cadc4a8c5d1d3cb99d2f4876d1b54da95`. [04-C evidence](CRITICAL_RESIDUAL_RECOVERY.md) · [CI](https://github.com/gdrclm/game/actions/runs/45965882650). No Phase 3, merge, deployment or author acceptance.

## Current status

| System | Confirmed | Open |
|---|---|---|
| Phase 0 | 1,031 seeds, 14 namespaces, deterministic export | Historical consumers in later phases |
| Phase 1 | Signed relief/bathymetry, physical terrain/climate, regional inland slope reconstruction, actual drainage branches, conserved source allocation, measured delivery paths and supported shoreline search | Three unsupported continental profiles; macro contact/coastal morphology and atmospheric transitions |
| Phase 2 | Separate weather closure and static route burden; local shelter/replenishment and source delivery; macro refuge opportunity and distinct ecological tempo, route reentry, repeated-stress support | Actual attenuation, water losses, retention duration and practical access budgets; no known export failure among current valid Phase 1 inputs |
| V1 islands | Full footprints, stable IDs, physical origins, maritime connectivity and local environment | Robust physical archipelago in rejected profiles; playable size/density and selection remain unapproved |

## Latest pinned verification

On `cc06a00`, Node 22.23.5: **170/173 unique exports** (versus 165/173 on a3df0d2 and 158/173 on 0c11b75). Mandatory 49/49, causal checks 27/27, original stress 64/64, independent 62/64, edge 7/7, additional 8/11, restored regression cohorts 2/2 and 5/5. All 165 previous exports preserve Phase 0 and Phase 1 hashes. Every export and rejection repeats deterministically. Phase 0 audit 1,031 seeds; Chromium 5/5 Phase 0, gameplay harness 270/270 and game startup pass. [Exact register](review/f8t/closure/prompt-04c-verification.json).

All five residual Phase 2 targets `1240171611`, `4286438917`, `4144686569`, `1683167796`, `2248663653` now pass. The 170 fixed valid-geography inputs also pass Phase 2; no claim about untested seeds. The separate regressions protect the restored cases.

## Verified causal implementation

- 04-B: same-cell macro shelter and local replenishment, connected wet sheltered patches, distinct periodic weather closures, exact supported continental cutoff search, and p50/p90/max delivery path distance, ascent and unshielded length. [Evidence](CRITICAL_IMPLEMENTATION_CLOSURE.md).
- 04-C: ordinary inflow density q and low-season l use the same within-world reference r (maximum ordinary density across nonempty relief regions). q/(q+r) supports ecological fast recovery and l/(q+r) constrains recurring-stress support together with existing basin-risk limit. The route contribution remains independent of water and limited by regional workability. The index is relative within a world, not a physical volume or duration law. Scaling the entire world including r preserves indices. Fixed-input interventions preserve pressure, stabilization and refuge persistence. [Recovery evidence](CRITICAL_RESIDUAL_RECOVERY.md).
- Regional environment: exact shelter/source overlap, separate local inflow, allocation and potential retention; practical human cost remains undefined. On 293 earlier measured islands reachability is full or zero under unbounded dry-land tracing; measured path distributions now distinguish delivery effort.
- Regional morphology: inland interpolation reduces macro-grid slope seams 25.2–38.3 percentage points across 14 paired worlds; 1,115 footprints, physical origin and marine paths preserved. Broad coastal smoothing rejected due to loss of a genuine fault fragment. [Evidence](review/f8t/regional-relief-diversity.md).

## Next critical task — geography (04-D)

Three reproducible Phase 1 rejections remain, not a count of two islands:

- `1122193213`, `3479992453`: no pre-marine elevation cutoff yields two connected continental bodies of at least 819 cells.
- `3418526133`: pair exists only at roughly 88–92% dry land; three tested cutoffs lack independent supported volcanic islands.

Exact ordinary/highstand shoreline search already implemented; do not repeat threshold sweep as a new solution. First investigate physical landmass/uplift support and archipelago opportunity. Preserve the current two-continent contract until an explicit author decision; do not force a split, fabricate island bodies, silently retry seeds or discard failures. [04-D implementation task](NEXT_ENGINEERING_MILESTONE.md) · [Original diagnostic](review/f8t/closure/prompt-04-stress-audit.md).

## Physical carriers and author boundaries

On earlier `a3df0d2`, all accepted original 62/62 and independent 61/61 worlds had 30 connected candidates at 0.25 macro-cell area; 56/62 and 59/61 at 0.5; 22/62 and 26/61 at 1.0. These are conditional physical candidate counts, not playable island capacity. Recompute on current/final geography, including diagnostic rejected profiles where possible. Phase 16 still defines 30 roles, not a forced physical island count. Minimum playable area not selected.

Macro contact/coastal artifacts, wind-band transitions, origin skew, water loss, attenuation and actual duration remain open for evidence-based V1 impact classification. Do not reopen verified recovery purely to improve numerical scores. No implicit author acceptance, new threshold or policy. [Author queue](AUTHOR_REVIEW_QUEUE.md).

## Workflow

04-C completed its implementation and verification; 04-D is the next bounded High / Standard implementation checkpoint. Independent audit 05 remains deferred until geographic technical defects are addressed and any remaining policy choices are explicit. Final F8/F9 acceptance still requires author approval. No historical or runtime implementation.

[Active checklist](ACTIVE_CHECKLIST.md) · [High queue](HIGH_REASONING_REVIEW_QUEUE.md) · [Global goal](WORLDGEN_PHASE0_2_GLOBAL_GOAL.md) · [Coverage](FOUNDATION_PHYSICAL_COVERAGE.md) · [Physical plan](FOUNDATION_PHYSICAL_PLAN.md) · [Archipelago plan](FOUNDATION_ARCHIPELAGO_PLAN.md). Earlier revisions, detailed experiments and measurements are retained in linked reports and git, not repeated as current status.
