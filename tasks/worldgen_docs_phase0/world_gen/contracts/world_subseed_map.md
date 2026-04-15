# DATA CONTRACT — WORLD SUB-SEED MAP

## Root contract

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

## Rules
1. all keys are deterministic under base seed;
2. sub-seeds must remain phase-namespaced;
3. later phases may read but not mutate this map;
4. adding new downstream namespaces requires contract update.
