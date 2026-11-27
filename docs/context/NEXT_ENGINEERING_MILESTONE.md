# Next engineering milestone — prompt 05 / independent causal closure audit

Repository: gdrclm/game. Branch: worldgen/v1-foundation-closure. Evidence HEAD ef7718b; pinned full stress audit 0c11b75, production code 0260b5d. Verify actual HEAD. High / Standard recommended. Phase 0–2 only. No Phase 3, merge, gameplay runtime redesign or author approval.

## Scope and required reading

Read AGENTS.md, PLANS.md, docs/context/PROJECT_STATE.md, ACTIVE_CHECKLIST.md, HIGH_REASONING_REVIEW_QUEUE.md, AUTHOR_REVIEW_QUEUE.md and review/f8t/closure/prompt-04-stress-audit.md. Inspect targeted code and official Phase 0–2 contracts. Use compact extraction from the large JSON audit (do not ingest all 34k lines). Prior reports: review/f8r/macro-recovery-seasonality.md, review/f8t/local-water/island-overlap.md and review/f8t/regional-relief-diversity.md. Do not repeat established experiments or rewrite completed architecture.

Pinned baseline: 49/49 mandatory, 58/64 original, 60/64 independent, 7/7 edges, 4/11 additional. 173 unique seeds, 158 exports, 15 rejected, all pre-existing. Phase 0 1,031 seeds; causal audit 24/24; browser Phase 0 5/5, gameplay 270/270. Prompt 04 added diagnostics/tests and evidence, no production algorithm change.

## A. Priority: macro recovery causal defect

Audit actual dependencies from local hydrology and climate to pressure, recovery, rhythm and summaries. Ten excess recovery cases: 1240171611, 2094783996, 2917478163, 3206964149, 4286438917, 1289932853, 4144686569, 2666689910, 2030830666, 1683167796. Weak recovery: 2248663653. Preserve accepted 42, 16908799, 1431655765, 2964753490 and restored 3928839710, 1054323503.

1. Trace supportWindow, reliableRunoffSupport, persistentSupport, reliefPersistence, recovery tempo and repeated-stress forgiveness. Quantify causal contributions and double counting by intervention rather than simply summing weights. Existing seasonal split is verified; preserve it.
2. Use the measured macro shelter/replenishment diagnostic in tests/measure-worldgen-v1-macro-refuge.cjs as evidence, not as canonical physical truth. On 4144686569 two relief regions have about forty-fold difference in sheltered low-season input density with equal basin reliability; one-step upwind horizon does not establish wind attenuation or duration. Establish a minimally sufficient V1 representation of spatially coherent low-season refuge support. Keep habitat replenishment, source delivery, potential retention and temporal persistence distinct. No arbitrary duration units or invented water-loss properties.
3. Fixed geography: redistribute equal-total inflow among sheltered/open cells; independently reverse wind and change delivery geometry; verify expected independent mechanisms. Include weak recovery 2248663653 and zero sheltered-inflow accepted control 42/relief_003. Do not substitute a single global multiplier or reapply rejected duration caps. Demonstrate preservation of genuine relief and environmental variation.
4. Implement a narrow candidate only when mechanism and normalization are justified; run targeted failure/accepted controls and mandatory tests. If inputs cannot support real persistence, explicitly describe proxy semantics and limitations, and decide which missing facts actually block downstream V1. Do not mislabel unknown as measured. Unresolved author-policy questions stay open.

## B. Separate distribution and continental audits

1665754063: rankwise mean gap 0.036345. Trace axis-level physical causes and compare matched and sorted distributions; test independent navigation, scarcity and recovery inputs. Similar marginal distributions do not establish duplication. Correct proven coupling; keep existing gate until author decision if independent physical outputs legitimately coincide.

Continental minimum: 1122193213, 3479992453 cannot produce two minimum 819-cell continents from any measured pre-marine cutoff; 3418526133 achieves it only around 88–92% dry land, with zero independent volcanic islands on three tested slices. No forced split or fabricated islands. Verify existing evidence and present author choices with concrete consequences (generation rejection policy, changing world scope, or physical generator redesign). Do not implement a changed policy without explicit author approval.

## C. Independent audit of foundation and downstream sufficiency

Audit Phase 0 isolation, determinism, contracts/IDs/provenance, actual land/sea topology, regional island geometry and origin, hydrology conservation, climate and marine route causality, pressure/rhythm, handoff. Assess whether Phase 3–17 can consume physical factors without inventing alternative world truth. Do not implement historical phases.

Review outstanding macro plate/coastal artifacts, wind-band transitions, volcanic origin skew, practical access, path exposure, attenuation and water persistence. Classify each as:
- blocking causal/contract defect;
- V1 limitation requiring explicit author policy;
- nonblocking V2/local-materialization refinement with evidence and downstream impact.
Do not declare an issue nonblocking solely because CI passes. Conversely do not demand scientific fidelity irrelevant to V1. No open-ended simulator expansion. Fix narrow proven blockers; if major redesign needed, provide a bounded follow-up with acceptance tests.

## D. Evidence, verification and stopping gate

Create docs/context/FOUNDATION_FINAL_CAUSAL_AUDIT.md with exact current revision, findings by priority, causal traces, reproducible interventions, before/after controls, scope decisions, blockers and author questions. Update PROJECT_STATE.md, ACTIVE_CHECKLIST.md, HIGH_REASONING_REVIEW_QUEUE.md, AUTHOR_REVIEW_QUEUE.md. Commit only verified improvements. If production code changes, run mandatory CI and repeat the pinned original 64 + independent 64 + edges 7 + additional known controls on one stable revision before claiming final F8-S status (or leave explicit unexecuted tests for a bounded follow-up). Preserve existing tests, no threshold changes, no seed-specific corrections.

Stop at a defensible independent audit checkpoint. Prompt 06 author package may follow only if technical blockers are resolved or explicitly separated for author decision; do not mark F8/F9 accepted. Report in Russian. No global goal restart.
