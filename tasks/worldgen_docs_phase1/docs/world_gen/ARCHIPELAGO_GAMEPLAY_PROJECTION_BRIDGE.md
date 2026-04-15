# ARCHIPELAGO GAMEPLAY PROJECTION BRIDGE

## Статус
Source-of-truth document for the bridge between:
- large-scale world history;
- archipelago convergence;
- the current 30-island expedition runtime in `gdrclm/game`.

This document defines the missing handoff between:
- `IslandHistoryRecord[]`
- historical convergence packages
- current progression / island-layout / future local realization systems

---

# 1. Purpose

The world generator already defines a deep causal chain:
- world laws
- macro geography
- pressure
- religion
- mentality
- civilizations
- dynasties
- history
- tragedy
- collapse
- archipelago role
- island role
- island history

But the current game runtime does not consume those layers directly.

The game currently operates through expedition-facing systems such as:
- island progression;
- island layout;
- scenario selection;
- settlement presence;
- map summaries;
- travel pressure;
- bridge traversal and local route meaning.

Therefore a **projection bridge** is required.

Its job is not to rewrite history.  
Its job is to translate historical causality into **gameplay-facing island progression contracts**.

---

# 2. Why this document is necessary

Without this bridge, the system falls into one of two bad states:

## Bad state A — deep lore with no gameplay handoff
Island history becomes rich, but the game still runs on local handcrafted heuristics.

## Bad state B — late gameplay phases invent upstream meaning
Local generation starts inventing:
- why the island is dangerous;
- why a settlement exists;
- why a merchant appears;
- why an island belongs in a certain progression band;
- why island 30 is the final convergence node.

Both are forbidden.

This bridge solves that by creating a formal projection layer.

---

# 3. Bridge position in the pipeline

Official position:

```text
PHASE 15  Archipelago Role
PHASE 16  Island Role
PHASE 17  Island History
PHASE 17.5 Archipelago Gameplay Projection Bridge
PHASE 18  Natural Evolution
PHASE 19  Terrain Transformation
PHASE 20  Settlement
PHASE 21  Social AI
PHASE 22  Spatial Consequence
PHASE 23  Building & Prop Narrative
PHASE 24  Local NPC
PHASE 25  Final Realization
```

The bridge is the handoff between:
- historical convergence layers;
- expedition-facing gameplay layers.

---

# 4. Inputs

The bridge may consume:
- `ArchipelagoConvergencePackage`
- `IslandRolePackage`
- `IslandHistoryRecord[]`
- `LateWorldStatePackage`
- relevant pressure/collapse summaries
- current runtime integration constraints from `gdrclm/game`

It may also consult project integration realities such as:
- 30-island progression structure
- existing expedition difficulty logic
- island-layout runtime expectations
- map/debug overlay expectations

But it may not invent new upstream history.

---

# 5. Outputs

The bridge produces two levels of output.

## 5.1 Archipelago-level package

```json
{
  "version": "archipelago-projection-v1",
  "archipelagoGameplayProjection": {
    "finalIslandIndex": 30,
    "globalPressureCurve": [],
    "merchantPresenceCurve": [],
    "settlementDensityCurve": [],
    "ruinDensityCurve": [],
    "bridgeDependencyCurve": [],
    "resourcePressureCurve": [],
    "narrativeConvergenceCurve": [],
    "mapSummaryBiases": []
  }
}
```

## 5.2 Per-island records

```json
{
  "islandIndex": 1,
  "sourceIslandId": "island_01",
  "progressionBand": "outer_low_pressure",
  "travelPressure": 0.22,
  "survivalPressure": 0.31,
  "settlementPresence": 0.44,
  "merchantLikelihood": 0.28,
  "refugeLikelihood": 0.41,
  "hazardBias": ["fog", "route_fragility"],
  "scenarioBiases": ["ruined_outpost", "thin_fishing_edge"],
  "layoutHints": {
    "preferredCoastality": 0.71,
    "chokepointPotential": 0.36,
    "ruinAnchorDensity": 0.24,
    "bridgeUsePressure": 0.33,
    "districtFragmentationBias": 0.18
  },
  "mapNarrativeSummary": {
    "roleLabel": "outer refuge",
    "historicalReading": "peripheral recovery edge",
    "playerFacingReadabilityGoal": "safe but fading"
  }
}
```

---

# 6. Main responsibilities of the bridge

## 6.1 Progression translation
Translate island history into gameplay progression logic.

Examples:
- outer refuge history -> lower early pressure with fading stability
- former customs island -> higher route dependency and contested layout bias
- near-core remnant -> richer ruins, stronger tension, higher narrative density
- final heart island -> maximum convergence and strongest causal residue

## 6.2 Pressure curve projection
Translate late-world history into:
- survival pressure
- travel pressure
- route fragility pressure
- settlement viability pressure
- island-to-island progression intensity

## 6.3 Scenario bias projection
Translate historical contradictions into scenario hints.

Examples:
- abandoned military waypoint -> barricades / broken logistics / patrol remains
- collapsed market island -> plazas / storage ruins / merchant traces / dead routes
- fishing colony under decline -> shoreline labor traces / food pressure / fragmented shelter clusters

## 6.4 Layout hint projection
Translate history into layout-facing but non-final hints.

This bridge does not create final chunk layout.

It only exports biases such as:
- coast-facing pressure
- chokepoint tendency
- ruin anchor density
- district fragmentation bias
- settlement clustering tendency
- bridge reliance tendency

## 6.5 Readability projection
Translate complex history into clear player-facing readability goals.

Each island should not only be historically valid.  
It should also be readable in play.

---

# 7. What the bridge must NOT do

The bridge must not:
- generate final terrain;
- generate final settlements;
- generate final props;
- generate final NPCs;
- replace local realization phases;
- rewrite island history;
- invent new global laws;
- flatten all islands into difficulty-only buckets.

It must remain a projection layer.

---

# 8. Downstream consumers

The bridge is intended to feed at least:

## `progression.js`
Needs:
- island pressure banding
- convergence gradient toward island 30
- travel/recovery expectations

## `island-layout.js`
Needs:
- layout hints
- coastality bias
- chokepoint tendency
- district fragmentation bias
- scenario bias hints

## map/debug layers
Needs:
- readable role summaries
- progression visualization
- narrative map overlays

## future settlement / scenario / bridge / merchant adapters
Need:
- projected settlement presence
- merchant likelihood
- refuge likelihood
- collapse residue and route tension bands

---

# 9. Recommended package split

## 9.1 `ArchipelagoGameplayProjectionPackage`
Global curves and archipelago-wide progression logic.

## 9.2 `IslandGameplayProjectionRecord[]`
Per-island records for runtime adapters.

This split is required because:
- some systems need archipelago-wide scaling;
- others need only island-local guidance.

---

# 10. Projection rules

## Rule 1 — derived only
Every gameplay-facing field must be derived from official upstream history and convergence packages.

## Rule 2 — no handcrafted rescue layer
The bridge must not compensate for weak history by inventing attractive but unsupported island flavor.

## Rule 3 — progression must remain causal
Island pressure should rise because of historical convergence, collapse residue, and route centrality — not because a designer arbitrarily marked later islands as harder.

## Rule 4 — projection stays abstract enough for local generation
The bridge must not over-specify final local layouts.
It exports tendencies, not final geometry.

## Rule 5 — final island convergence must be explicit
The bridge must clearly explain why island 30 is the final convergence island.

---

# 11. Validation targets

The bridge is valid only if:

1. island-to-island progression is readable;
2. later islands show increasing convergence pressure;
3. historical role still reads through gameplay-facing hints;
4. layout hints are useful but not over-prescriptive;
5. scenario biases differ across islands;
6. island 30 clearly feels like the final causal node;
7. the bridge can feed current expedition systems without inventing upstream truth.

---

# 12. Failure cases

## Failure A — projection too flat
All islands become generic tiers with different numbers only.

## Failure B — projection too literal
The bridge exports so much detail that local generators lose flexibility.

## Failure C — projection too detached
Gameplay hints do not actually reflect island history.

## Failure D — projection bypassed
Later systems ignore the bridge and invent island meaning locally.

---

# 13. Codex rules

Codex must:
- treat this bridge as mandatory between island history and local realization;
- update this doc if gameplay projection semantics change;
- keep bridge outputs deterministic;
- preserve separation between historical truth and local realization.

Codex must not:
- merge this bridge into final realization as an implicit hidden step;
- push final terrain/settlement generation into this phase;
- invent progression labels without upstream support;
- bypass the bridge with direct local heuristics.

---

# 14. Relationship to other documents

## `Phase_Map_Document.md`
Defines this bridge as Phase 17.5 in the official phase list.

## `PHASE_INTERACTION_DOCUMENT.md`
Should define what this bridge may derive and what it may not invent.

## `WORLD_GENERATION_ORCHESTRATION.md`
Should include this bridge in stage execution and rebalance logic.

## `00_context_and_repo_integration.md`
Provides the current project-side constraints this bridge must respect.

---

# 15. Final statement

This document exists because the game does not consume raw historical packages directly.

The project needs a formal translation layer from:
- world history,
- to archipelago convergence,
- to island progression,
- to layout bias,
- to readable playable islands.

That translation layer is the **Archipelago Gameplay Projection Bridge**.
