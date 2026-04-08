# DATA CONTRACT — FIELD CONTRACTS

## General field rules
Все поля должны:
- быть deterministic under seed;
- быть экспортируемыми для debug;
- иметь явно описанный диапазон значений.

---

## PlatePressureField

```json
{
  "fieldId": "platePressure",
  "range": [0, 1],
  "channels": [
    "uplift",
    "fracture",
    "compression",
    "driftBias",
    "arcFormation"
  ]
}
```

## MarineInvasionField

```json
{
  "fieldId": "marineInvasion",
  "range": [0, 1],
  "channels": [
    "incisionDepth",
    "coastalBreakup",
    "bayFormation",
    "straitLikelihood",
    "islandFragmentation"
  ]
}
```

## ContinentalCohesionField

```json
{
  "fieldId": "continentalCohesion",
  "range": [0, 1],
  "channels": [
    "interiorPassability",
    "basinConnectivity",
    "ridgeBarrier",
    "regionalSegmentation",
    "stateScalePotential"
  ]
}
```

## ClimateStressField

```json
{
  "fieldId": "climateStress",
  "range": [0, 1],
  "channels": [
    "stormPressure",
    "wetDecay",
    "coldDrag",
    "harvestRisk",
    "maritimeSeasonality"
  ]
}
```

## CoastalOpportunityField

```json
{
  "fieldId": "coastalOpportunity",
  "range": [0, 1],
  "channels": [
    "harborQuality",
    "fishingPotential",
    "landingEase",
    "shoreDefense",
    "inlandLinkBonus"
  ]
}
```

## IsolationField

```json
{
  "fieldId": "isolation",
  "range": [0, 1],
  "channels": [
    "distanceFromCore",
    "resupplyCost",
    "weatherIsolation",
    "chokepointDependence",
    "culturalDriftPotential"
  ]
}
```

## StrategicFrictionField

```json
{
  "fieldId": "strategicFriction",
  "range": [0, 1],
  "channels": [
    "overlapOfRouteInterests",
    "controlDifficulty",
    "multiAccessPressure",
    "prestigeValue",
    "contestProbability"
  ]
}
```
