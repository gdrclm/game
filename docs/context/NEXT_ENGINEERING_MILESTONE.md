# Next engineering milestone — macro recovery causal audit

Branch: worldgen/v1-foundation-closure. Baseline evidence: b6c3f4a; latest verified code fd84d39. Always verify actual HEAD before work. Phase 0–2 only. Main and gameplay runtime unchanged.

Recommended execution: one bounded High-reasoning session for causal audit and a narrowly justified candidate; subsequent Medium session for implementation/testing if required. Do not restart the global goal or reimplement island hydrology.

## Read first

AGENTS.md, PLANS.md, PROJECT_STATE.md, ACTIVE_CHECKLIST.md, HIGH_REASONING_REVIEW_QUEUE.md, review/f8t/local-water/README.md. Read targeted code in js/worldgen/phase2/rhythm/index.js, pressure/index.js, environmental-context.js and recovery/index.js as relevant; source measurements in js/worldgen/macro/local-water.js and final-drainage.js. Do not load whole diagnostic snapshots or historical atlases into model context unless essential. Extract named metrics via scripts.

## Problem

Latest island interpretation is already implemented and verified. Macro recovery still uses aggregated catchment scale and continuity, which can incorrectly confer identical support on distinct physical branches. Earlier moisture weighting, reachability multiplication and direct allocated-budget substitution caused regressions. Do not try these again with different arbitrary constants.

1. Trace actual dependency graph from hydrology pressure to recovery and rhythm, including shared multipliers and downstream consumers. Identify and quantify repeated or conflated contributions; do not assume duplication without tracing.
2. Separate local ecological replenishment, access to an upstream source, shelter and delivery cost, and temporal persistence. Preserve unknown water retention/availability; no invented geology, consumption or potability.
3. Compare 42, 16908799, 4144686569 first. Use fixed Phase 1 inputs and targeted interventions on inflow, wind, route/access and retention, maintaining existing invariants. Establish which recovery components may change and which must not.
4. Design a bounded candidate with explicit source fields, dimensionless normalization rationale, independent causal tests, compatibility/validation and rejection criteria. Do not alter thresholds to pass. Implement only if causality is defensible and accepted controls are preserved; otherwise document why and isolate the remaining decision.
5. Check remaining original seven tension/relief failures and new control 2666689910; distinguish physics defect from author policy. Leave 1665754063 differentiation to a separate focused milestone unless direct shared dependencies are established.

## Completion

Verified causal trace, before/after compact table, reproducible tests, safe code commit if supported, or precise unresolved alternative if not. Preserve 49 mandatory regressions; run full CI after candidate stabilizes. No repeated full stress run during hypothesis exploration. Full 64 original + 64 independent + 7 edge runs reserved for stable final candidate. Update PROJECT_STATE, ACTIVE_CHECKLIST and HIGH_REASONING_REVIEW_QUEUE with evidence; record head/test versions. Stop at this bounded checkpoint, not the global completion target. No Phase 3, no merge, no author acceptance.

Report in Russian. No self-assigned new design thresholds or tasks unrelated to macro recovery.
