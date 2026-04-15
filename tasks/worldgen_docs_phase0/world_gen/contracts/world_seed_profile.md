# DATA CONTRACT — WORLD SEED PROFILE

## Root contract

```json
{
  "worldSeed": 0,
  "worldTone": "fractured_maritime_age",
  "conflictPressure": 0.0,
  "dynastyPressure": 0.0,
  "maritimeDependence": 0.0,
  "environmentalVolatility": 0.0,
  "collapseIntensity": 0.0,
  "religiousInertia": 0.0,
  "institutionalPlasticity": 0.0,
  "migrationPressure": 0.0,
  "centralizationBias": 0.0,
  "memoryPersistence": 0.0,
  "heroicAgencyBias": 0.0,
  "routeFragilityBias": 0.0,
  "culturalPermeability": 0.0
}
```

## Required keys
All keys are required.

## Semantic rules
1. All normalized values must remain in `[0.0 .. 1.0]`.
2. `worldTone` is derived, not manually preset as final truth.
3. No downstream phase may mutate this profile after freeze.
