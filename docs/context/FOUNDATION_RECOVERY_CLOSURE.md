# F8-R — recovery closure before author acceptance

Baseline: F8-Q evidence revision 808ac3a; source state da358dbf. F8-Q improves causal geometry; do not undo it to restore green CI. F8/F9 remain pending. No Phase 3 or runtime integration.

## Confirmed failures
- 16908799: recoveryProfileMean 0.170, recoveryFieldMax 0.181, reliefPersistence 0.178; distribution.relief_presence and gameplay.relief_relevance fail.
- 2764796977: pressureMean 0.202, recoveryMean 0.289, delta -0.087; design.tension_vs_relief requires rebalance.
- 25/27 main cohort and 4/4 former blind pass. Latest CI 45692803868 fails; previous CI's 19-seed cohort omitted the second failure. Both must become permanent regressions.
- Keep all validation thresholds, original seed and upstream geometry unchanged. Existing rebalance rules allow Phase 2 local interpretation, not rewriting physical truth.

## Instrumentation added
`node tests/worldgen-v1-foundation-audit.cjs --cohort regression --causal --snapshots ../f8r-data > ../f8r-report.json` includes 31 unique previously reviewed seeds. Historical `--cohort all` still selects the original 19. CI now uses regression. For focused diagnosis:
`node tests/worldgen-v1-foundation-audit.cjs --snapshots ../f8r-failures 16908799 2764796977 > ../f8r-failures.json`.
Failure snapshots include rejectedPhase2Candidate under diagnostics only, with upstream records, bindings, provisional packages, summaries and rebalance attempt outcomes; not a legal downstream handoff. Non-debug calls omit rejected candidate. Synthetic boundary checks passed; full integration CI pending.

## Investigate, then correct
1. Reproduce both seeds and trace each relief region's area/geometry, climate carriers, basin area and continuity, ruggedness, water stress, actual route, choke and isolated-zone associations. Compare harsh and mild controls from passing worlds.
2. Inspect inferRecoverySignals in rhythm/index.js: runoffAvailability = continuity * area/(area+0.04); recoveryCapacity multiplies terrain access by 0.25*supportWindow + 0.75*runoffContinuity. Three local signals multiply this same capacity. Inspect source record coverage and aggregation bias (unweighted means across unequal regions; missing record values treated as no signal; region-specific isolation combined with continent-wide isolation). These are hypotheses, not established root causes. Distinguish absence of access from absent data; test locality and monotonicity. Do not invent water or recovery to hit a threshold.
3. Trace synthesized recoveryProfile weights and stabilization delay; pressure domain aggregation and tension delta. Inspect whether local rebalance responses actually change relevant inputs and improve their failing check, or merely repeat a deterministic calculation. Verify both initial and final reports. Explain physical interpretation of any change with evidence.
4. Apply smallest justified fix in Phase 2 (or explicitly documented upstream contract bug only if independently established). Test independent controls, valid and invalid cases, fixed-seed causal comparisons, local variation, and genuine scarcity/recovery tradeoffs. No seed-specific branches, hard clamping recovery to validator bounds, unconditional floor boosts, hidden rerolls, threshold relaxation, or uniform compression of world differences. If the physical world is genuinely outside design policy, present an author decision instead of falsifying its interpretation.
5. Run all 31 twice, full causal checks, fixtures, browser boot; predeclare fresh distributed holdouts before running and report every failure. Preserve verified passage endpoints, route geometry, periphery gains and original seed, and confirm no debug/canonical hash drift. Publish before/after recovery field distributions, provenance, actual maps and timing.
6. If technical checks pass, request F8 author assessment, with explicit alternatives for keeping one archipelago in V1 vs future multiple archipelagos. Do not extend architecture automatically. F9/Phase 3 require explicit acceptance.

## Evidence boundary
No generator coefficient or validation threshold changed by this instrumentation commit. Current repository connector cannot independently decode binary atlas images. Technical diagnosis is not visual approval or proof of gameplay. 

## Verified F8-R outcome

`16908799` and `2764796977` pass the original Phase 2 validation on the first attempt. The final regression includes all 31 previously reviewed worlds and `3508323923`, the land-area case exposed by the first predeclared holdout. GitHub Actions passed all 32. Two new cohorts passed 5/8 and 8/8. All three failures are baseline Phase 1 semantic blocks with matching physical diagnostics. The [review packet](review/f8r/README.md) contains the evidence, remaining scope limits and author questions. F8 and F9 remain pending.
