# Phase_2_Handoff_From_Phase_1
## Official input contract from completed Phase 1 into Phase 2
**Repository:** `gdrclm/game`  
**Status:** Draft source-of-truth handoff document  
**Audience:** design, engineering, Codex implementation passes  
**Scope:** defines exactly what Phase 2 may read from completed Phase 1, what is optional, and what is forbidden

---

# 1. Purpose

This document exists because Phase 1 is now completed and exports both:
- `MacroGeographyPackage`
- `MacroGeographyHandoffPackage`

Phase 2 must therefore stop behaving like a speculative consumer of incomplete geography and instead become an explicit downstream consumer of official Phase 1 exports.

This document prevents:
- ad-hoc upstream assumptions;
- climate duplication;
- political/history leakage into Phase 2;
- direct dependence on unstable intermediate outputs;
- record-blind environmental math.

---

# 2. Core rule

Phase 2 reads **official exports** from completed Phase 1.

Phase 2 must not:
- bypass root package and scrape arbitrary implementation internals;
- invent missing physical truth;
- treat handoff hints as historical canon;
- read political meaning as environmental truth.

---

# 3. Allowed inputs from `MacroGeographyPackage`

## 3.1 Physical summary records
- `continents`
- `seaRegions`
- `mountainSystems`
- `volcanicZones`
- `riverBasins`
- `climateBands`
- `reliefRegions`

## 3.2 Structural / macro records
- `archipelagoRegions`
- `coastalOpportunityMap`
- `chokepoints`
- `macroRoutes`
- `isolatedZones`
- `strategicRegions`

## 3.3 Root-level support
- `macroSeed`
- `version`
- `worldBounds`
- `validationReport`

## 3.4 Debug artifacts
Phase 2 may read `debugArtifacts.physicalWorldDebugBundle` only:
1. when explicitly needed by a documented subgenerator or validator;
2. never as replacement for canonical records;
3. never as hidden dependency that makes root-package records optional.

---

# 4. Inputs Phase 2 should treat as primary

Primary environmental truth sources:
- `reliefRegions`
- `mountainSystems`
- `riverBasins`
- `seaRegions`
- `volcanicZones`
- `climateBands`
- `chokepoints`
- `macroRoutes`
- `isolatedZones`

---

# 5. Inputs Phase 2 should treat as secondary context

May inform weighting, clustering, or summaries, but must not override primary truth:
- `continents`
- `archipelagoRegions`
- `coastalOpportunityMap`
- `strategicRegions`
- package-level validation summaries

---

# 6. Allowed inputs from `MacroGeographyHandoffPackage`

## 6.1 Conditionally allowed
Potentially allowed, if documented per use-case:
- `collapsePressureSeeds.routeCascadeCandidates`
- `collapsePressureSeeds.specialistLossSensitiveRegions`
- `collapsePressureSeeds.peripheryLossCandidates`
- `collapsePressureSeeds.archipelagoCollapseSensitivity`

## 6.2 Limited structural summaries
Potentially allowed for coarse context weighting only:
- `summaryForHistoryPhase.fragilePeripheries`
- `summaryForHistoryPhase.routeBelts`
- `summaryForHistoryPhase.chokeBelts`

These may be used only if:
- they strengthen already-existing environmental structural interpretation;
- they do not become substitutes for root-package records;
- they are documented in Phase 2 contracts.

---

# 7. Forbidden handoff inputs for Phase 2

Phase 2 must not directly consume the following as environmental truth:
- `strategicHintsForPolitics.*`
- `colonizationHints.*`
- `archipelagoRoleSeeds.historicalRoleBias`
- `empireCandidates`
- `maritimeRivalryZones`
- `coalitionPressureRegions`
- any handoff field whose meaning is already political, historical, or role-interpretive

These belong to later phases.

---

# 8. Climate duplication rule

Phase 1 already exports climate truth through:
- `climateBands`
- related climate-envelope-derived physical results

Therefore:

## Phase 1 owns
- climate formation
- climate envelopes
- climate bands
- large climate differentiation

## Phase 2 owns
- lived burden from climate
- exposure from climate
- timing relevance from climate
- predictability / rupture relevance from climate
- recovery / relief consequences of climate interaction with other systems

### Hard prohibition
Phase 2 must not reimplement climate generation as if Phase 1 had not already done it.

---

# 9. Record-binding requirement

Because Phase 1 now exports rich records, Phase 2 must include a record-binding layer.

Phase 2 is invalid if it treats completed Phase 1 only as anonymous scalar source fields.

---

# 10. Input hierarchy

## Tier 1 — Canonical root records
- `reliefRegions`
- `mountainSystems`
- `riverBasins`
- `seaRegions`
- `volcanicZones`
- `climateBands`
- `chokepoints`
- `macroRoutes`
- `isolatedZones`

## Tier 2 — Root structural context
- `continents`
- `archipelagoRegions`
- `coastalOpportunityMap`
- `strategicRegions`

## Tier 3 — Explicitly permitted handoff hints
Only when contracted:
- `collapsePressureSeeds.*`
- limited summary belts/periphery hints

## Tier 4 — Debug support
Only if explicitly needed:
- `debugArtifacts.physicalWorldDebugBundle`

---

# 11. Required downstream discipline

If Phase 2 implementation needs some Phase 1 truth that is not available in the official exports, the correct action is:
1. stop;
2. identify missing upstream contract;
3. update Phase 1 docs/contracts first;
4. resume only after explicit handoff exists.

Missing upstream truth must never be invented locally inside Phase 2.
