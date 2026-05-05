# PressureFieldPackage
## Official package contract for Phase 2 environmental burden output
**Repository:** `gdrclm/game`  
**Status:** Draft source-of-truth package contract after completed Phase 1  
**Audience:** design, engineering, Codex implementation passes  
**Scope:** defines the canonical structure, semantics, downstream assumptions, and validation expectations for `PressureFieldPackage`

---

# 1. Purpose

`PressureFieldPackage` is the official output package for the **burden side** of Phase 2.

Its job is to convert completed Phase 1 physical + macro world truth into **environmental burden truth** that later systems can trust.

This package must answer questions such as:
- how harsh is movement here;
- how fragile is survival support here;
- how punishing is access failure here;
- how exposed are routes here;
- how environmentally brittle is this region.

It must **not** answer:
- what ideology emerges here;
- what political actor controls this region;
- what island story happened here;
- what faction identity this implies.

---

# 2. Upstream basis

This package is derived from official Phase 1 exports, especially:
- `reliefRegions`
- `mountainSystems`
- `riverBasins`
- `seaRegions`
- `volcanicZones`
- `climateBands`
- `chokepoints`
- `macroRoutes`
- `isolatedZones`

These are already part of the completed `MacroGeographyPackage` root contract. They are the canonical physical and macro structural truth feeding Phase 2. fileciteturn31file0

The package may also use explicitly allowed structural hints from `MacroGeographyHandoffPackage`, but must not import political or history-facing semantics into burden fields. fileciteturn32file0

---

# 3. Core rule

`PressureFieldPackage` describes **burden magnitude and persistence**.

It may describe:
- exposure
- harshness
- reliability loss
- fragility
- catastrophe susceptibility
- supply stress
- remoteness burden

It may not describe:
- cadence
- timing windows
- predictability
- rupture timing
- recovery tempo

Those belong to `EnvironmentalRhythmPackage`.

---

# 4. Root contract

```json
{
  "packageId": "string",
  "phaseId": "PHASE_2",
  "version": "phase2-pressure-v1",
  "sourceMacroGeographyPackageId": "string",
  "sourceMacroGeographyVersion": "string",
  "sourceHandoffPackageId": "string | null",
  "sourceWorldSeedProfileId": "string | null",
  "recordBindingContextId": "string",
  "domains": {
    "climate": {},
    "terrain": {},
    "hydrology": {},
    "food": {},
    "travel": {},
    "chokepoints": {},
    "isolation": {},
    "ecology": {},
    "catastrophe": {}
  },
  "synthesized": {},
  "regionalProfiles": [],
  "summaries": {},
  "validationMeta": {}
}
```

---

# 5. Required domains

## 5.1 Climate domain
Required fields:
- `coldPressure`
- `heatPressure`
- `humidityPressure`
- `climateExposurePressure`

## 5.2 Terrain domain
Required fields:
- `terrainHarshness`
- `slopeBurden`
- `fragmentationBurden`
- `mobilityTerrainPenalty`

## 5.3 Hydrology domain
Required fields:
- `waterReliabilityInverse`
- `waterStress`
- `droughtPressure`
- `floodInstability`

## 5.4 Food domain
Required fields:
- `foodStress`
- `foodReliabilityInverse`
- `fertilitySupportInverse`
- `scarcityBaseline`

## 5.5 Travel domain
Required fields:
- `travelExposure`
- `routeReliabilityInverse`
- `movementUncertaintyPressure`
- `detourBurden`

## 5.6 Chokepoints domain
Required fields:
- `chokepointPressure`
- `failureImpactPressure`
- `dependencyConcentration`

## 5.7 Isolation domain
Required fields:
- `isolationPressure`
- `supportDelayBurden`
- `peripheralExposure`
- `accessFragility`

## 5.8 Ecology domain
Required fields:
- `ecologicalFragility`
- `ecologicalStabilityInverse`
- `regenerationWeakness`
- `carryingCapacityBrittleness`

## 5.9 Catastrophe domain
Required fields:
- `catastrophePressure`
- `stormBreakRisk`
- `volcanicInstability`
- `floodBreakRisk`
- `droughtBreakRisk`

---

# 6. Required synthesized layer

`synthesized` must contain:

- `survivabilityPressure`
- `mobilityPressure`
- `supplyPressure`
- `chokepointStress`
- `remotenessBurden`
- `ecologicalBurden`
- `catastropheSusceptibility`

## Rule
The synthesized layer is required, but it may not replace domain fields.

---

# 7. Scalar conventions

All primary scalar values must be normalized:
- `0.0` = minimal meaningful presence
- `1.0` = maximal meaningful presence

No hidden mixed scales are allowed.

Higher values must consistently mean **more of the contracted burden meaning**.

---

# 8. Record binding requirement

Because Phase 1 now exports rich records, this package must include region/record-aware context.

`regionalProfiles[]` must bind burden interpretations to official record ids or stable region ids.

Minimum shape:

```json
{
  "profileId": "string",
  "recordType": "continents | seaRegions | mountainSystems | volcanicZones | riverBasins | climateBands | reliefRegions | archipelagoRegions | chokepoints | macroRoutes | isolatedZones | strategicRegions",
  "recordId": "string",
  "sourcePackageId": "string",
  "pressureSignals": {},
  "rhythmSignals": {},
  "dominantEnvironmentalTraits": [],
  "dominantBurdens": [],
  "synthesizedSnapshot": {},
  "summary": "string"
}
```

`recordType` must use the canonical `MacroGeographyPackage` root collection id. For this pressure package, `pressureSignals` carries burden-side signal excerpts while `rhythmSignals` remains an empty reserved split section; timing truth belongs to `EnvironmentalRhythmPackage`.

## Hard rule
`PressureFieldPackage` is invalid if it exists only as anonymous global scalar maps with no record-aware profile layer.

---

# 9. Summaries

Required summaries:
- `pressureSummary`
- `traversalSummary`
- `survivalSummary`
- `fragilitySummary`

Summaries must be field-derived only. They must not contain ideology, faction logic, or history interpretation.

---

# 10. Validation expectations

`validationMeta` must minimally track:
- `fieldRangeStatus`
- `determinismStatus`
- `distributionStatus`
- `correlationStatus`
- `recordBindingStatus`
- `summaryStatus`

Package-level burden validation should ensure:
- no scalar-difficulty collapse;
- meaningful regional contrast;
- correct correlation with completed Phase 1 records;
- no pressure/rhythm semantic blending.

---

# 11. Downstream assumptions allowed

Downstream systems may assume:
- burden semantics are stable;
- higher values mean more burden;
- synthesized layer is consistent with domains;
- regionalProfiles are bound to canonical record ids;
- summaries are field-backed.

Downstream systems may not assume:
- timing structure;
- recovery windows;
- ideological meaning;
- island history.

---

# 12. Failure conditions

`PressureFieldPackage` fails if:
- any required domain is missing;
- synthesized layer replaces domains;
- pressure collapses into one generic difficulty scalar;
- package contains rhythm semantics;
- package is not record-aware;
- summaries invent non-environmental meaning.

---

# 13. Final statement

`PressureFieldPackage` is the official burden contract of Phase 2.

It exists so later phases and runtime layers do not have to guess:
- how harsh the world is,
- how fragile support is,
- how punishing movement is,
- where environmental burden is concentrated,
- and how that burden differs across the completed macro world.
