# DATA CONTRACT — MACRO GEOGRAPHY PACKAGE

## Root contract

```json
{
  "macroSeed": 0,
  "version": "phase1-v1",
  "worldBounds": {
    "width": 0,
    "height": 0
  },
  "continents": [],
  "seaRegions": [],
  "archipelagoRegions": [],
  "climateBands": [],
  "coastalOpportunityMap": [],
  "chokepoints": [],
  "macroRoutes": [],
  "isolatedZones": [],
  "strategicRegions": [],
  "debugArtifacts": {},
  "validationReport": {}
}
```

## Required keys
- `macroSeed`
- `version`
- `continents`
- `seaRegions`
- `archipelagoRegions`
- `chokepoints`
- `macroRoutes`
- `strategicRegions`
- `validationReport`

## Optional but recommended
- `climateBands`
- `coastalOpportunityMap`
- `isolatedZones`
- `debugArtifacts`

## Semantic constraints
1. `continents.length >= 2`
2. `archipelagoRegions.length >= 1`
3. `chokepoints.length >= 1`
4. `macroRoutes.length >= 1`
5. validation report must always exist even on failed generation.
