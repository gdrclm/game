# DATA CONTRACT — REGION CONTRACTS

## ContinentRecord

```json
{
  "continentId": "cont_01",
  "nameSeed": "culture_group_a",
  "macroShape": "crescent_mass",
  "cohesion": 0.72,
  "coastalFragmentation": 0.41,
  "interiorAccessibility": 0.66,
  "climateLoad": 0.48,
  "maritimeExposure": 0.63,
  "dominantRelief": "ridge_and_basin",
  "strategicProfile": "centralizing_core"
}
```

## SeaRegionRecord

```json
{
  "seaRegionId": "sea_03",
  "type": "labyrinth_sea",
  "stormPressure": 0.61,
  "navigability": 0.57,
  "tradePotential": 0.81,
  "militaryContestValue": 0.74,
  "archipelagoDensity": 0.68
}
```

## ArchipelagoRegionRecord

```json
{
  "archipelagoId": "arch_01",
  "roleProfile": "strategic_bridge_periphery",
  "connectiveValue": 0.89,
  "fragility": 0.77,
  "colonizationAppeal": 0.74,
  "longTermSustainability": 0.43,
  "historicalVolatility": 0.82
}
```

## ChokepointRecord

```json
{
  "chokepointId": "chk_07",
  "type": "narrow_strait",
  "controlValue": 0.92,
  "tradeDependency": 0.88,
  "bypassDifficulty": 0.79,
  "collapseSensitivity": 0.83,
  "adjacentRegions": ["sea_03", "arch_01"]
}
```

## MacroRouteRecord

```json
{
  "routeId": "route_11",
  "type": "sea_major",
  "fromRegion": "cont_01",
  "toRegion": "cont_03",
  "through": ["sea_03", "arch_01", "chk_07"],
  "baseCost": 0.56,
  "fragility": 0.74,
  "redundancy": 0.22,
  "historicalImportance": 0.88
}
```

## IsolatedZoneRecord

```json
{
  "zoneId": "iso_02",
  "type": "archipelago_periphery",
  "isolation": 0.81,
  "resupplyDifficulty": 0.77,
  "culturalDriftPotential": 0.72,
  "lossInCollapseLikelihood": 0.84
}
```

## StrategicRegionRecord

```json
{
  "regionId": "str_04",
  "type": "imperial_core_candidate",
  "valueMix": {
    "food": 0.72,
    "routes": 0.85,
    "defense": 0.68,
    "coast": 0.66
  },
  "stabilityScore": 0.71,
  "expansionPressure": 0.64
}
```

## ValidationReport

```json
{
  "isValid": true,
  "scores": {
    "diversity": 0.0,
    "routeRichness": 0.0,
    "chokeValue": 0.0,
    "archipelagoSignificance": 0.0,
    "centerPeripheryContrast": 0.0,
    "historyPotential": 0.0
  },
  "failReasons": [],
  "rebalanceActions": []
}
```
