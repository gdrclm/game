# DATA CONTRACT — MACRO GEOGRAPHY HANDOFF PACKAGE

## Статус
This contract defines the **explicit downstream handoff** exported by Phase 1.

It exists so that Phase 1 does not stop at static macro records only.
It must provide structured bridge-ready outputs for later historical and archipelago phases.

This document complements:
- `macro_geography_package.md`
- `field_contracts.md`
- `region_contracts.md`

---

## 1. Purpose

`MacroGeographyPackage` describes the generated macro world itself.

`MacroGeographyHandoffPackage` describes what later phases are officially allowed to consume from Phase 1 as **derived strategic handoff**.

This separation prevents:
- dumping ad-hoc hint fields into the root package;
- silent expansion of downstream dependencies;
- phase-local inventions that later become de facto canon.

---

## 2. Root contract

```json
{
  "version": "phase1-handoff-v1",
  "summaryForHistoryPhase": {
    "coreRegions": [],
    "fragilePeripheries": [],
    "strategicSeas": [],
    "routeBelts": [],
    "chokeBelts": [],
    "archipelagoSignificanceBand": "high"
  },
  "colonizationHints": {
    "highAppealCorridors": [],
    "replicationFriendlyCoasts": [],
    "frontierPressureZones": []
  },
  "strategicHintsForPolitics": {
    "empireCandidates": [],
    "maritimeRivalryZones": [],
    "controlSensitiveChokepoints": [],
    "coalitionPressureRegions": []
  },
  "collapsePressureSeeds": {
    "routeCascadeCandidates": [],
    "specialistLossSensitiveRegions": [],
    "peripheryLossCandidates": [],
    "archipelagoCollapseSensitivity": 0.0
  },
  "archipelagoRoleSeeds": {
    "archipelagoCandidates": [],
    "connectiveValue": 0.0,
    "fragility": 0.0,
    "contestValue": 0.0,
    "historicalRoleBias": "strategic_bridge_periphery"
  },
  "validationSummary": {
    "isUsableDownstream": true,
    "warnings": [],
    "blockedPhases": []
  }
}
```

---

## 3. Required keys

- `version`
- `summaryForHistoryPhase`
- `colonizationHints`
- `strategicHintsForPolitics`
- `collapsePressureSeeds`
- `archipelagoRoleSeeds`
- `validationSummary`

---

## 4. Semantic meaning of each section

## 4.1 `summaryForHistoryPhase`
Compressed structural summary for:
- civilization emergence;
- power formation;
- historical simulation;
- archipelago convergence.

This section should answer:
- where major cores can form;
- where fragile peripheral worlds can emerge;
- which routes bind the macro world together;
- whether the archipelago is structurally central or marginal.

## 4.2 `colonizationHints`
Derived expansion-friendly macro signals.

This section should answer:
- where outward maritime pressure is likely;
- what coasts invite repeated settlement attempts;
- what frontier belts create delayed colony or outpost logic.

## 4.3 `strategicHintsForPolitics`
Derived political and rivalry-facing signals.

This section should answer:
- where great-power competition is likely;
- where chokepoint politics become mandatory;
- where maritime coalition logic is plausible.

## 4.4 `collapsePressureSeeds`
Phase 1 contribution to later collapse logic.

This section should answer:
- which route systems are brittle;
- where loss of a corridor cascades system-wide;
- which peripheries are first candidates for disappearance;
- how sensitive the archipelago is to route death.

## 4.5 `archipelagoRoleSeeds`
Explicit Phase 1 handoff into archipelago convergence.

This section should answer:
- which archipelago candidate matters most;
- how structurally connective it is;
- how fragile it is;
- why later phases should treat it as strategically contested or wounded.

## 4.6 `validationSummary`
Downstream-facing availability status.

This section exists so later phases can detect whether:
- Phase 1 output is strong enough to consume;
- some historical pathways should be blocked;
- a reroll should happen before history simulation continues.

---

## 5. Field rules

1. All handoff fields must be deterministic under seed.
2. All handoff fields must be derived only from official Phase 1 outputs.
3. No handoff field may invent named civilizations, dynasties, events, or island stories.
4. Handoff fields are structural hints and seeds, not world-truth replacements for later phases.
5. If a handoff field becomes required by multiple later phases, it must stay documented here.

---

## 6. Relationship to `MacroGeographyPackage`

`MacroGeographyPackage` is the full Phase 1 world output.

`MacroGeographyHandoffPackage` is the official extracted downstream interface.

Phase 1 code may generate both from the same internal analysis, but downstream phases should consume the handoff package when they need:
- historical summaries;
- politics-facing hints;
- collapse-facing seeds;
- archipelago convergence seeds.

This keeps the root package cleaner and prevents uncontrolled dependency spread.

---

## 7. Minimum downstream consumers

This handoff package is intended for at least:
- Phase 7 — Civilization Emergence
- Phase 8 — Power Structure
- Phase 10 — Strategic Decision
- Phase 13 — Global Tragedy
- Phase 14 — Collapse Cascade
- Phase 15 — Archipelago Role

---

## 8. Codex rules

Codex must not:
- dump new hint fields into `MacroGeographyPackage` silently;
- add downstream-facing summary fields without updating this contract;
- treat handoff hints as final historical truth;
- bypass this contract by inventing local adapters ad hoc.

Codex must:
- update this contract whenever downstream semantics change;
- keep the handoff package explicit and minimal;
- keep separation between world description and downstream handoff.
