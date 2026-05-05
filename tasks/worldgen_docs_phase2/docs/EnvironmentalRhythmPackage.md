# EnvironmentalRhythmPackage
## Official package contract for Phase 2 timing and recovery output
**Repository:** `gdrclm/game`  
**Status:** Draft source-of-truth package contract after completed Phase 1  
**Audience:** design, engineering, Codex implementation passes  
**Scope:** defines the canonical structure, semantics, downstream assumptions, and validation expectations for `EnvironmentalRhythmPackage`

---

# 1. Purpose

`EnvironmentalRhythmPackage` is the official output package for the **timing side** of Phase 2.

Its job is to convert completed Phase 1 world truth into **temporal environmental truth**:
- how the world cycles;
- how it ruptures;
- how predictable it is;
- how scarcity rises and falls;
- when movement is more viable;
- how and when recovery becomes possible.

This package is what prevents the world from degenerating into:
- constant punishment;
- flat hardship;
- scalar difficulty with no timing logic.

---

# 2. Upstream basis

This package is derived from official Phase 1 exports, especially:
- `climateBands`
- `seaRegions`
- `riverBasins`
- `reliefRegions`
- `macroRoutes`
- `chokepoints`
- `isolatedZones`
- `archipelagoRegions`

These are part of the completed `MacroGeographyPackage` and form the canonical structural truth for timing interpretation. fileciteturn31file0

Like `PressureFieldPackage`, it may use only explicitly allowed hints from `MacroGeographyHandoffPackage`, and must not import political or role-interpretive semantics. fileciteturn32file0

---

# 3. Core rule

`EnvironmentalRhythmPackage` describes **timing structure**.

It may describe:
- cadence
- recurrence
- timing windows
- predictability
- rupture
- stabilization
- recovery tempo
- relief persistence

It may not describe:
- burden magnitude
- raw harshness
- static supply pressure
- generic danger score

Those belong to `PressureFieldPackage`.

---

# 4. Root contract

```json
{
  "packageId": "string",
  "phaseId": "PHASE_2",
  "version": "phase2-rhythm-v1",
  "sourceMacroGeographyPackageId": "string",
  "sourceMacroGeographyVersion": "string",
  "sourceHandoffPackageId": "string | null",
  "sourceWorldSeedProfileId": "string | null",
  "recordBindingContextId": "string",
  "domains": {
    "seasonality": {},
    "storms": {},
    "navigation": {},
    "scarcity": {},
    "predictability": {},
    "recovery": {}
  },
  "synthesized": {},
  "regionalProfiles": [],
  "summaries": {},
  "validationMeta": {}
}
```

---

# 5. Required domains

## 5.1 Seasonality domain
Required fields:
- `seasonalityStrength`
- `annualSwingStrength`
- `environmentalCycleClarity`

## 5.2 Storm cadence domain
Required fields:
- `stormCadence`
- `stormBurstClustering`
- `calmToStormTransitionSharpness`

## 5.3 Navigation domain
Required fields:
- `navigationWindowReliability`
- `blockedIntervalFrequency`
- `safeRouteIntervalStrength`

## 5.4 Scarcity cadence domain
Required fields:
- `scarcityCadence`
- `deficitPersistence`
- `shortageRecurrence`

## 5.5 Predictability domain
Required fields:
- `predictability`
- `ruptureFrequency`
- `cadenceIrregularity`
- `temporalTrustworthiness`

## 5.6 Recovery domain
Required fields:
- `recoveryTempo`
- `stabilizationInterval`
- `reliefPersistence`
- `environmentalForgiveness`

### Hard rule
Recovery domain is mandatory.  
It must never be optional.

---

# 6. Required synthesized layer

`synthesized` must contain:

- `seasonalityProfile`
- `stormRhythm`
- `navigationRhythm`
- `scarcityRhythm`
- `predictabilityProfile`
- `ruptureProfile`
- `recoveryProfile`

## Rule
This layer may compact rhythm meaning, but must not flatten timing structure into one volatility scalar.

---

# 7. Scalar conventions

All primary scalar values must be normalized:
- `0.0` = minimal meaningful presence
- `1.0` = maximal meaningful presence

Higher values must consistently mean **more of the contracted timing meaning**.

Examples:
- higher `predictability` = more timing trust
- higher `ruptureFrequency` = more ruptures
- higher `recoveryTempo` = stronger/faster environmental recovery support according to the chosen contract semantics

The exact semantic polarity must be fixed and consistent across code and docs.

---

# 8. Record binding requirement

`regionalProfiles[]` must bind timing and recovery interpretations to official record ids or stable region ids.

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
  "dominantRhythms": [],
  "recoverySnapshot": {},
  "summary": "string"
}
```

`recordType` must use the canonical `MacroGeographyPackage` root collection id. For this rhythm package, `rhythmSignals` carries timing/recovery signal excerpts while `pressureSignals` remains an empty reserved split section; burden truth belongs to `PressureFieldPackage`.

## Hard rule
`EnvironmentalRhythmPackage` is invalid if timing structure exists only as anonymous fields with no record-aware regional interpretation.

---

# 9. Summaries

Required summaries:
- `rhythmSummary`
- `timingSummary`
- `recoverySummary`
- `windowSummary`

Summaries must be field-derived only. They must not contain:
- ideology
- politics
- island history
- scenario authorship

---

# 10. Validation expectations

`validationMeta` must minimally track:
- `fieldRangeStatus`
- `determinismStatus`
- `distributionStatus`
- `cadenceStatus`
- `reliefStatus`
- `recordBindingStatus`
- `summaryStatus`

Package-level rhythm validation should ensure:
- rhythm is not flattened into burden;
- recovery is not lost;
- timing profiles differ meaningfully;
- predictability and rupture are not trivial mirrors of pressure;
- record-bound rhythm summaries exist.

---

# 11. Downstream assumptions allowed

Downstream systems may assume:
- timing semantics are stable;
- recovery is explicit;
- higher values follow documented meaning;
- synthesized layer is consistent with domains;
- regionalProfiles are bound to canonical record ids;
- summaries are field-backed.

Downstream systems may not assume:
- burden magnitude from rhythm fields;
- ideology/history meaning;
- final scenario type.

---

# 12. Failure conditions

`EnvironmentalRhythmPackage` fails if:
- any required domain is missing;
- recovery domain is missing or weakened;
- timing collapses into one scalar volatility score;
- package contains burden semantics that belong to pressure;
- package is not record-aware;
- summaries are vague, decorative, or non-field-backed.

---

# 13. Final statement

`EnvironmentalRhythmPackage` is the official timing and recovery contract of Phase 2.

It exists so later phases and runtime layers do not have to guess:
- when the world tightens,
- when it loosens,
- how predictable it is,
- how scarcity cycles,
- when routes are more viable,
- and whether recovery is possible at all.
