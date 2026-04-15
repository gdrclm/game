# DATA CONTRACT — PHASE 0 RUNTIME INTERFACES

## Required interface signatures

```js
createPhase0World(baseSeed, options?)
buildWorldSeedProfile(baseSeed, options?)
deriveWorldTendencies(worldSeedProfile)
deriveWorldSubSeedMap(baseSeed, worldSeedProfile)
validatePhase0Export(phase0Bundle)
buildPhase1SafeSummaryBundle(phase0Bundle)
buildFrozenPhase0OutputWrappers(phase0Bundle)
```

## Export bundle shape

```json
{
  "worldSeedProfile": {},
  "derivedWorldTendencies": {},
  "worldSubSeedMap": {},
  "validationReport": {}
}
```

## Phase 1-safe summary bundle shape

```json
{
  "exportKind": "phase0.phase1_safe_summary_bundle",
  "phaseId": "phase0",
  "phaseVersion": "phase0-v1",
  "freezePoint": "A",
  "immutable": true,
  "phase1Input": {
    "worldSeedProfile": {},
    "derivedWorldTendencies": {},
    "macroGeographySeed": 0
  },
  "summary": {
    "worldSeed": 0,
    "worldTone": "fractured_maritime_age",
    "macroGeographySeed": 0,
    "likelyWorldPattern": "trade_heavy_but_fragile",
    "likelyConflictMode": "dynastic_and_route_driven",
    "likelyArchipelagoRole": "bridge_then_wound",
    "geographyBiasSnapshot": {}
  }
}
```

## Frozen output wrappers shape

```json
{
  "exportKind": "phase0.frozen_output_wrappers",
  "phaseId": "phase0",
  "phaseVersion": "phase0-v1",
  "freezePoint": "A",
  "handoffSemantics": "read_only_frozen",
  "immutable": true,
  "outputs": {
    "phase0Bundle": {},
    "phase1SafeSummaryBundle": {}
  }
}
```

## Rules
1. interfaces must be pure and deterministic;
2. no UI dependency is allowed;
3. no gameplay runtime state is allowed as input;
4. outputs must match the official contracts.
5. Phase 1-safe summary exports may expose upstream-ready Phase 0 inputs for PHASE 1, but may not contain generated macro geography.
6. frozen output wrappers may add immutable handoff metadata, but may not rewrite the wrapped exports.
