# Phase_2_Runtime_Adapter_Mapping
## Official runtime adapter mapping for Phase 2
**Repository:** `gdrclm/game`  
**Status:** Draft source-of-truth integration document after completed Phase 1  
**Audience:** design, engineering, Codex implementation passes  
**Scope:** defines how Phase 2 environmental outputs should later map into existing runtime layers of `gdrclm/game`

---

# 1. Purpose

This document explains how Phase 2 should connect to the **existing game runtime** without prematurely overriding it.

The project already has active gameplay/runtime layers such as:
- expedition progression
- island layout
- world spawn runtime
- map UI

Phase 2 must not replace those systems directly.  
Instead, it must provide a **stable environmental vocabulary** that later adapter layers can consume.

---

# 2. Core rule

Phase 2 does **not** directly modify:
- `js/expedition/progression.js`
- `js/expedition/island-layout.js`
- `js/interactions/world-spawn-runtime.js`
- `js/ui/map-ui.js`

Phase 2 only provides:
- pressure semantics
- rhythm semantics
- recovery / relief semantics
- record-bound environmental profiles
- summaries and validation-friendly metadata

A later bridge/adaptation layer must map those outputs into runtime logic.

---

# 3. Runtime layers that Phase 2 must support

## 3.1 Expedition progression
Phase 2 should later be able to inform:
- island-run burden profile
- traversal expectation
- endurance vs timing emphasis
- scarcity expectation
- recovery rarity / strength
- environmental planning style

## 3.2 Island layout
Phase 2 should later be able to inform:
- route openness vs constriction
- corridor readability
- refuge likelihood
- risk pockets
- stable vs unstable traversal regions
- scenario bias inputs

## 3.3 World spawn runtime
Phase 2 should later be able to inform:
- camp weighting
- forage weighting
- safe-point rarity
- crossing / repair relevance
- shelter expectation
- environmental support density

## 3.4 Map/debug UI
Phase 2 should later be able to inform:
- readable environmental summaries
- region warnings
- route timing hints
- recovery/readability overlays
- profile-family debug surfaces

---

# 4. Mapping principles

## 4.1 Pressure -> runtime burden
Pressure-side outputs should map into:
- traversal tax
- supply fragility
- shelter unreliability
- route stress
- catastrophe sensitivity

## 4.2 Rhythm -> runtime timing
Rhythm-side outputs should map into:
- timing windows
- planning cadence
- scarcity recurrence
- route availability rhythm
- predictability vs rupture behavior

## 4.3 Recovery / relief -> runtime decision-space
Recovery-side outputs should map into:
- meaningful rest opportunities
- temporary calm periods
- environmental forgiveness
- stabilization windows
- strategic recovery planning

### Hard rule
If recovery stays only as text summary and never becomes runtime-usable meaning, the mapping layer is incomplete.

---

# 5. Adapter targets by package field family

## 5.1 Pressure-facing targets
Likely adapter consumers:
- progression burden tuning
- island-run classification
- spawn support density
- route stress interpretation

## 5.2 Rhythm-facing targets
Likely adapter consumers:
- route-window logic
- timing-sensitive scenario bias
- scarcity cycle signaling
- readability vs volatility classification

## 5.3 Record-bound profiles
Likely adapter consumers:
- island profile summaries
- map/debug overlays
- future scenario weighting
- region-specific runtime hints

---

# 6. Required adapter outputs

A future adapter layer should be able to derive from Phase 2:

```json
{
  "runtimeEnvironmentalProfileId": "string",
  "traversalStyle": "string",
  "scarcityStyle": "string",
  "recoveryStyle": "string",
  "hazardStyle": "string",
  "planningStyle": "string",
  "summary": "string"
}
```

This is not the final bridge contract yet, but it is the minimum design target.

---

# 7. Forbidden shortcuts

The runtime adapter mapping must not:
- invent new environmental truth unrelated to Phase 2 outputs;
- patch missing Phase 2 meaning with arbitrary hand-authored labels;
- flatten pressure/rhythm/recovery into one difficulty level;
- bypass record-bound profiles and summaries.

---

# 8. Integration milestones

## Milestone A
Phase 2 produces valid packages and summaries.

## Milestone B
Phase 2 packages prove gameplay projection sufficiency.

## Milestone C
Adapter layer begins mapping environmental outputs into existing runtime systems.

## Milestone D
Runtime uses environmental truth consistently without reinterpreting the world ad hoc.

---

# 8.1 Current readiness note for downstream consumers

Ready now:
- contract-backed `PressureFieldPackage` and `EnvironmentalRhythmPackage` surfaces;
- record-bound environmental profiles;
- field-backed pressure/rhythm summaries;
- validation orchestration across structural, causal, boundary, distribution, design, gameplay, and summary families;
- selective rebalance trigger classification and local response paths;
- validation-gated Phase 2 engine/export flow.

Still foundation-only:
- runtime adapter bridge is not yet implemented;
- representative snapshots are support-only fixture/debug surfaces;
- local rebalance paths rerun Phase 2 layers but do not autonomously retune the world.

Not ready yet:
- direct expedition progression integration;
- direct island-layout integration;
- direct world-spawn-runtime integration;
- any Phase 17.5 or later downstream gameplay implementation.

Practical rule for consumers:
Treat current Phase 2 output as validated environmental vocabulary plus support metadata.  
Do not assume runtime behavior mapping already exists, and do not elevate debug/snapshot artifacts into gameplay truth.

---

# 9. Final statement

This document exists so Phase 2 grows toward the real game instead of becoming an isolated environmental simulation layer.
