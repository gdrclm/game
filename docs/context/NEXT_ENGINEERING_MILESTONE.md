# Next engineering milestone — prompt 04-B / critical implementation closure before audit

Repository: gdrclm/game. Branch: worldgen/v1-foundation-closure. Start from actual HEAD; documentation baseline 21c833a, pinned stress evidence ef7718b / 0c11b75, latest verified production code 0260b5d. High / Standard recommended. Phase 0–2 only. No main, merge, deployment, Phase 3 or author approval. This is an implementation stage, not the independent audit (prompt 05).

## Read first

AGENTS.md, PLANS.md, docs/context/PROJECT_STATE.md, ACTIVE_CHECKLIST.md, HIGH_REASONING_REVIEW_QUEUE.md, AUTHOR_REVIEW_QUEUE.md and review/f8t/closure/prompt-04-stress-audit.md. Read targeted source and contracts. Use compact script extraction from the large JSON; don't load all snapshots or reread historical documents. Existing verified work: seasonal recovery split, exact island shelter/source overlap, regional interior slope reconstruction. Preserve these.

Baseline: 49/49 mandatory, 58/64 original, 60/64 independent, 7/7 edges, 4/11 additional; 158/173 unique accepted, 15 rejects. Phase 0 1,031 seeds, 24/24 causal audit, browser Phase 0 5/5 and gameplay 270/270. All rejects pre-existed. Prompt 04 added evidence and diagnostics, not production fixes.

## Work package A — P0 macro refuge and recovery (first implementation priority)

Ten excess recovery cases: 1240171611, 2094783996, 2917478163, 3206964149, 4286438917, 1289932853, 4144686569, 2666689910, 2030830666, 1683167796. Weak relief: 2248663653. Preserve 42, 16908799, 1431655765, 2964753490 and restored 3928839710, 1054323503. Refer to review/f8r/macro-recovery-seasonality.md and prior rejected experiments.

1. Trace actual dependencies in pressure, rhythm, environmental-context, final-drainage and local-water; identify the earliest causal distinction lost (catchment-wide structural reliability reused as persistence). Trace supportWindow, reliableRunoffSupport, persistentSupport, reliefPersistence, tempo and environmentalForgiveness. Don't repeat global water multiplier or blanket duration cap experiments.
2. Use tests/measure-worldgen-v1-macro-refuge.cjs to prototype exact macro relief overlap of wind shelter and ordinary/low-season replenishment, independent from source delivery and storage. Assess whether spatially coherent sheltered patches and local branches support a distinct ecological refuge signal. The one-step horizon is a geometric proxy, not measured wind attenuation. Define a minimal sufficient dimensionless V1 proxy and its physical provenance; do not invent actual water losses, time units, geology or potability.
3. If supported, integrate measurements into canonical Phase 1 data, intake and relevant Phase 2 channels with validation, compatibility, deterministic IDs and explicit unknowns. Don't duplicate or silently override existing physical truth. Separate replenishment, access to sources, allocated supply, path cost, retention potential and temporal response. Keep fast recovery and recurring seasonal deficit separate as in c642b9b.
4. Add fixed-input tests with equal total inflow redistributed between sheltered/open areas, independent wind intervention, delivery cost changes, varying retention potential and repeated seasonal stress. Test both excess and weak recovery; accepted dry-shelter control 42/relief_003 must not be automatically invalidated by zero sheltered inflow. Demonstrate causal response, not just pass rate.
5. Implement and commit the defensible candidate. If evidence disproves the candidate, revert it, try a materially different supported hypothesis or isolate exact missing physical input/author decision. Do not stop at another generic audit if a verified technical correction is implementable.

## Work package B — P0 pressure/rhythm distinction

1665754063: sorted rank gap 0.036345. Trace actual named axes and common inputs. Test independent interventions in navigation, scarcity, seasonal timing and recovery. Correct demonstrated duplicated dependencies, preserving meaningful shared physical causes. Sorted marginal similarity alone is not proof of coupling. If valid independent outputs still fail the current gate, keep the gate and record exact evidence and author decision needed. No threshold tuning or injecting artificial differences.

## Work package C — P0 continental contract

1122193213 and 3479992453: no two >=819-cell continents at any measured pre-marine cutoff. 3418526133: only at ~88–92% dry land; three tested cuts produce no independent volcanic islands. No forced land splitting or fabricated islands. Investigate a narrow physically supported solution within the current generator contract if evidence exists. Otherwise document explicit author options with tradeoffs: keep current world constraints and reject unsupported seeds (including implications for future deterministic generation/retry), change admissible geography, or redesign physical uplift. Do not implement a new policy or hide failures without author approval. Keep all three in the register.

## Work package D — P1 remaining causal physical deficiencies

Inspect actual downstream consumers and physical sources. Prioritize local source accessibility (currently all 293 measured islands are entirely reachable or unreachable), travel distance/ascent/exposure, seasonal supply, sheltered-area replenishment and retention/persistence limits. Provide quantitative, independently usable path metrics rather than arbitrary cutoff. A connected path is not practical access. Do not impose population or player-specific costs before their phase. Wind shelter is not proof of actual attenuation or ecological duration.

Check macro plate/contact, coast and atmospheric transition defects that materially bias settlement, climate, hydrology or transport. Use existing rejected prototypes and compare real maps/metrics on 137, 180816365, 16908799, 2546155002 and other relevant controls. Correct proven causal defects with narrow changes; preserve marine connectivity, fragment provenance, inland slope fix and regional exact overlap. Do not force nonvolcanic island quotas or minimum playable area. If an issue is a visual approximation or an unsupported future process, document evidence and V1 boundary; don't auto-transfer blocking work to V2. Do not expand into a complete hydrology/geology simulator.

## Verification and completion

Work sequentially A -> B -> C -> D, skipping only already proven completed work. Use small targeted candidate tests; run mandatory CI at each stable production checkpoint, then full pinned original 64 + independent 64 + edge 7 + known additional controls, browser/runtime and determinism after final stabilization. Keep exact denominators and all failures, including previously rejected seeds; preserve original baseline. Do not change validation thresholds, seed-specific rules or hide candidate failures. Add newly restored worlds to regressions where appropriate.

Create docs/context/CRITICAL_IMPLEMENTATION_CLOSURE.md with per-work-package actual changes, commits, causal tests, before/after metrics, all remaining failure families, and disposition: corrected / technical blocker / explicit author decision / evidence-supported nonblocking limitation. Update PROJECT_STATE.md, ACTIVE_CHECKLIST.md, HIGH_REASONING_REVIEW_QUEUE.md, AUTHOR_REVIEW_QUEUE.md. Report in Russian. Do not claim all 15 are bugs or guarantee all pass by changing the contract.

Stop at verified implementation checkpoint. Do not run prompt 05 or mark F8/F9 accepted. If resource limit or missing author input prevents closure, commit safe verified work and identify the precise next unfinished implementation task; do not restart the global goal. Prompt 05 is reserved for independent audit after this stage; remaining hard blockers prevent author acceptance.
