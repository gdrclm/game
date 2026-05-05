# Phase_2_Rebalance_Rules
## Official selective rebalance rules for Phase 2
**Repository:** `gdrclm/game`  
**Status:** Draft source-of-truth rebalance document after completed Phase 1  
**Audience:** design, engineering, Codex implementation passes  
**Scope:** defines what Phase 2 may rebalance, what it must not touch, and how local corrections are triggered

---

# 1. Purpose

Phase 2 must be able to correct local failures without:
- rerolling completed Phase 1 truth;
- inventing missing upstream meaning;
- collapsing design intent into hand-tuned arbitrary fixes.

This document defines the allowed selective rebalance loops.

---

# 2. Core rule

Phase 2 may rebalance only its own interpretation layer.

Phase 2 may not:
- reroll Phase 1 physical world;
- mutate Phase 1 records;
- override official `MacroGeographyPackage`;
- silently reinterpret forbidden handoff semantics.

---

# 3. Rebalance triggers

## Trigger A — Pressure flattening
Symptoms:
- burden too uniform
- weak contrast between regions

Allowed rebalance:
- pressure weighting
- synthesis normalization
- contrast thresholds

## Trigger B — Rhythm monotony
Symptoms:
- cadence too similar everywhere
- predictability too samey
- low timing variation

Allowed rebalance:
- cadence synthesis
- storm timing thresholds
- scarcity timing thresholds

## Trigger C — Relief collapse
Symptoms:
- recovery globally too weak
- no stable windows
- environmental forgiveness absent

Allowed rebalance:
- recovery tempo
- relief thresholds
- stabilization interval logic

## Trigger D — Broken route logic
Symptoms:
- route pressure detached from `macroRoutes`
- chokepoint timing detached from `chokepoints`

Allowed rebalance:
- travel exposure interpretation
- chokepoint pressure interpretation
- navigation window interpretation

## Trigger E — Causal incoherence
Symptoms:
- fields look random relative to completed Phase 1 records

Allowed rebalance:
- weighting and source binding inside Phase 2
- normalization path
- record-binding aggregation logic

## Trigger F — Gameplay irrelevance
Symptoms:
- outputs exist but do not imply different planning styles
- downstream layers still need to invent environmental truth

Allowed rebalance:
- synthesized layer tuning
- summary logic
- gameplay projection compatibility thresholds

---

# 4. Forbidden rebalance actions

Phase 2 must never:
- reroll Phase 1 generators;
- mutate root-package record meaning;
- import political/history-facing handoff fields to patch environmental weakness;
- flatten the world to improve readability;
- remove recovery/relief to simplify tuning.

---

# 5. Rebalance execution order

Recommended order:
1. validate failure type
2. classify severity
3. select smallest valid rebalance loop
4. rerun only affected Phase 2 layer
5. rerun validation
6. record rebalance metadata

---

# 6. Rebalance metadata

Every rebalance pass must record:
- trigger id
- affected subgenerators
- changed thresholds/weights
- validation result before
- validation result after

---

# 7. Final statement

Selective rebalance exists to correct Phase 2 interpretation, not to compensate for unclear contracts or to secretly rewrite completed Phase 1 truth.
