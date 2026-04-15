# PHASE 0 — SUB-SEED NAMESPACE DESIGN AND INTERFACES

## Purpose
This document defines:
- how sub-seeds are organized;
- what runtime interfaces Phase 0 should expose;
- how downstream phases consume deterministic namespaces safely.

---

## Sub-seed map design

Phase 0 must derive stable per-phase namespaces such as:

```json
{
  "macroGeographySeed": 0,
  "pressureSeed": 0,
  "rhythmSeed": 0,
  "religionSeed": 0,
  "mentalSeed": 0,
  "civilizationSeed": 0,
  "dynastySeed": 0,
  "eventSeed": 0,
  "collapseSeed": 0,
  "archipelagoSeed": 0,
  "islandHistorySeed": 0,
  "settlementSeed": 0,
  "spatialSeed": 0,
  "npcSeed": 0
}
```

---

## Interface set

### `createPhase0World(baseSeed, options)`
Returns the full Phase 0 export bundle.

### `buildWorldSeedProfile(baseSeed, options)`
Returns only `WorldSeedProfile`.

### `deriveWorldTendencies(worldSeedProfile)`
Returns only `DerivedWorldTendencies`.

### `deriveWorldSubSeedMap(baseSeed, worldSeedProfile)`
Returns only deterministic downstream seeds.

### `validatePhase0Export(bundle)`
Returns `Phase0ValidationReport`.

### `buildPhase1SafeSummaryBundle(phase0Bundle)`
Returns a frozen Phase 1-safe summary bundle containing only the upstream Phase 0 truths and the deterministic `macroGeographySeed` needed by PHASE 1.

### `buildFrozenPhase0OutputWrappers(phase0Bundle)`
Returns a frozen immutable handoff package wrapping the canonical Phase 0 export bundle and the frozen Phase 1-safe summary bundle.

---

## Interface rules
1. interfaces must be pure and deterministic;
2. runtime modules must not depend on UI;
3. exported bundles must be frozen after successful validation;
4. downstream phases may read Phase 0 outputs but may not mutate them.
5. Phase 1-safe exports may summarize Phase 0 inputs for PHASE 1 readability, but may not generate macro geography or mutate world truth.
6. frozen output wrappers may add handoff metadata, but may not change payload semantics or mutate the wrapped exports.

---

## Recommended runtime modules

```text
js/worldgen/phase0/
  master-seed-generator.js
  deterministic-rng.js
  world-profile-synthesizer.js
  world-tone-synthesizer.js
  derived-tendencies.js
  subseed-deriver.js
  validation.js
  contracts.js
  debug/
  adapters/
```
