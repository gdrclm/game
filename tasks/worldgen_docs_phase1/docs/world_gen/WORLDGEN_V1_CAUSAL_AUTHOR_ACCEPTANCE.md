# WorldGen V1 — author review and causal acceptance

Status: working acceptance protocol; no new gameplay phase or player-facing UI.
Extends WORLDGEN_V1_PHASE0_2_VISUAL_PRODUCTION_REGISTER and
ARCHIPELAGO_GAMEPLAY_PROJECTION_BRIDGE. Existing phase contracts remain authoritative.

## Iteration rule

1. Implement a minimal causal mechanism based on upstream records.
2. Validate structure, determinism, reference integrity and fail-closed handoffs.
3. Run paired counterfactuals with a fixed local seed and upstream context. Change one
   semantic input at a time; report the expected effect and independent controls.
4. Review real exported worlds, including atypical cases and negative examples.
5. Author reviews meaning, variety, narrative potential, and eventually gameplay.
6. Translate accepted feedback into rule/contract changes and repeat on unseen seeds.
   Never patch an individual generated story to make a seed pass.

## Causal evidence, not merely variety

A different map from a different seed is not proof of a specific influence.
Phase 0 → 1 may change both profile and derived sub-seeds; a diagnostic intervention
must freeze downstream randomness to distinguish these pathways.
An input appearing in a contract is not proof it is consumed by the algorithm.

Initial implemented intervention: maritimeDependence changes the strategic
connective value of existing archipelago zones, gated by actual supported marine
routes and sea-region reach. No geometry, route creation, or physical danger is
changed by this social/strategic tendency. The neutral value preserves the former
formula. The bounded 0.20 coefficient is provisional, to be calibrated from
real seed distributions and author review. Missing supported cases are reported as
not_exercised, never treated as positive evidence.

Other documented inputs (environmentalVolatility, conflictPressure, routeFragilityBias,
collapseIntensity, etc.) require their own channel-specific evidence; do not claim
they are implemented merely because the master profile transports them.

## Visual and author gates

- Phase 0–2: read-only diagnostics of actual seed profiles, geography, pressure,
  seasonality and recovery; inspect maps, metrics, local context and paired deltas.
- Phase 3–17: review generated facts and causal chains, cultural/individual variation,
  contradictions, mundane life, history and material consequences; no invented
  examples presented as canonical generation, no premature gameplay realization.
- Phase 17.5: review whether established history projects into distinct travel,
  survival, resources, social access and investigation choices. No rewriting history.
- Phase 18–25: review actual isometric spatial realization and narrative carriers.
- Phase 26: test real gameplay and new seeds, not only valid JSON.

The Observatory consumes debug exports. It must neither mutate generator packages
nor add player-facing functionality. Gameplay/narrative previews before 17.5 are
explicitly hypotheses derived from available facts, not runtime content.

## Author feedback

Report seed, phase, actual evidence, observed problem, expected qualitative change,
proposed rule, invariant to preserve, and regression/holdout test. Distinguish
technical decisions from decisions requiring author approval. Living narrative
requires autonomy, ordinary life, ambiguity, contradictions, material consequences,
and meaningful non-combat decisions. No requirement to make every event tragic,
every conversation a quest, or every story resolve to one interpretation.

## Settlement history acceptance (future historical phases)

Apply the [author direction](../../../../docs/context/SETTLEMENT_MIGRATION_AND_TERRITORIAL_CONTINUITY.md) at its relevant gates. Use controlled pairs to distinguish physical ability to move from willingness to move; verify migration feasibility, optional vacancy, persistence of population identity across a move and valid ordering of occupation layers. Demonstrate different cultural/social decisions under similar physical circumstances, and material traces that reference established historical facts. Cases are proposed checks, not mandatory per-world plot outcomes. Do not require implementation during the current Phase 0–2 milestone.
