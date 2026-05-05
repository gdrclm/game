# Phase_2_Field_Contracts
## Official field contracts for Phase 2 — Pressure & Environmental Rhythm Generator
**Repository:** `gdrclm/game`  
**Status:** Updated draft source-of-truth contract document after completed Phase 1  
**Audience:** design, engineering, Codex implementation passes  
**Scope:** defines the official field vocabulary, structures, ranges, normalization rules, semantics, and ownership boundaries for Phase 2 outputs

---

# 1. Purpose

This document defines the official field contracts for Phase 2 after completed Phase 1.

Phase 2 must export two core packages:
- `PressureFieldPackage`
- `EnvironmentalRhythmPackage`

This file specifies:
- what fields are allowed;
- what each field means;
- how values are normalized;
- what downstream systems may assume;
- what Phase 2 is forbidden to invent.

---

# 2. New post-Phase-1 rule

Phase 2 fields now exist on top of a completed upstream that already exports:
- physical records;
- structural records;
- filtered downstream handoff hints.

Therefore every Phase 2 field must be understood as:
- **derived from official Phase 1 truth**;
- optionally **bound to official record ids** through the record-binding layer;
- forbidden from re-creating upstream climate or importing political/history meaning.

---

# 3. Field ownership boundary

## Phase 2 fields may describe
- burden
- exposure
- reliability
- recoverability
- fragility
- cadence
- predictability
- rupture
- timing windows
- environmental relief

## Phase 2 fields may not describe
- religion
- morality
- worldview
- legitimacy
- social custom
- faction intention
- island story meaning
- NPC psychology
- handcrafted scenario identity

If a field crosses into those meanings, it is not a valid Phase 2 field.

---

# 4. Normalization rules

All official Phase 2 primary scalar fields must use:
- `0.0` → minimum meaningful presence
- `1.0` → maximum meaningful presence

Normalization must preserve contrast.

No mixed scales are allowed across sibling fields unless separately contracted.

Normalization helpers may attach provenance metadata describing source range, source record context, and applied normalization mode, but that metadata is explanatory support only and not new gameplay truth.

---

# 5. Package-level split

## PressureFieldPackage
Stores burden magnitude and persistence.

## EnvironmentalRhythmPackage
Stores timing structure and recovery logic.

### Hard rule
Pressure and rhythm fields must never silently merge.

---

# 6. Climate ownership clarification

Phase 1 already owns climate formation and exports climate truth through root-package climate records. fileciteturn31file0

Therefore Phase 2 climate-side fields are **interpretive environmental fields**, not fresh climate-generation fields.

Examples:
- `coldPressure` is valid
- `stormCadence` is valid
- “new climate zone generator output” is not valid Phase 2 field ownership

---

# 7. Record-binding requirement

Because completed Phase 1 exports rich records, Phase 2 field use must support a record-binding layer.

This means:
- field semantics remain canonical;
- but packages must support record-bound profiles and summaries;
- fields may be projected onto record ids without changing their meaning.

This requirement is complemented by:
- `PressureFieldPackage.md`
- `EnvironmentalRhythmPackage.md`
- `Phase_2_Record_Binding_Contract.md`

---

# 8. Pressure domain contracts

## 8.1 Climate domain
Fields:
- `coldPressure`
- `heatPressure`
- `humidityPressure`
- `climateExposurePressure`

Code-level schema rule:
- the climate pressure domain must export this exact field set with no silent renames and no uncontracted extra climate pressure fields;
- code-level validator support should fail if any required climate pressure field is missing or if an uncontracted field is introduced;
- climate pressure remains an interpretive burden domain built on completed Phase 1 climate truth, not new climate-generation output.

## 8.2 Terrain domain
Fields:
- `terrainHarshness`
- `slopeBurden`
- `fragmentationBurden`
- `mobilityTerrainPenalty`

Code-level schema rule:
- the terrain pressure domain must export this exact field set with no silent renames and no uncontracted extra terrain pressure fields;
- code-level validator support should fail if any required terrain pressure field is missing or if an uncontracted field is introduced;
- terrain pressure remains an interpretive burden domain built on completed Phase 1 terrain truth, not new terrain-generation output.

## 8.3 Hydrology domain
Fields:
- `waterReliabilityInverse`
- `waterStress`
- `droughtPressure`
- `floodInstability`

Code-level schema rule:
- the hydrology pressure domain must export this exact field set with no silent renames and no uncontracted extra hydrology pressure fields;
- code-level validator support should fail if any required hydrology pressure field is missing or if an uncontracted field is introduced;
- hydrology pressure remains an interpretive burden domain built on completed Phase 1 water-distribution truth, not new hydrology-generation output.

## 8.4 Food domain
Fields:
- `foodStress`
- `foodReliabilityInverse`
- `fertilitySupportInverse`
- `scarcityBaseline`

Code-level schema rule:
- the food pressure domain must export this exact field set with no silent renames and no uncontracted extra food pressure fields;
- code-level validator support should fail if any required food pressure field is missing or if an uncontracted field is introduced;
- food pressure remains an interpretive burden domain built on completed Phase 1 fertility/support truth, not new food-generation output.

## 8.5 Travel domain
Fields:
- `travelExposure`
- `routeReliabilityInverse`
- `movementUncertaintyPressure`
- `detourBurden`

Code-level schema rule:
- the travel pressure domain must export this exact field set with no silent renames and no uncontracted extra travel pressure fields;
- code-level validator support should fail if any required travel pressure field is missing or if an uncontracted field is introduced;
- travel pressure remains an interpretive burden domain built on completed Phase 1 route/connectivity truth, not new travel-generation output.

## 8.6 Chokepoint domain
Fields:
- `chokepointPressure`
- `failureImpactPressure`
- `dependencyConcentration`

Code-level schema rule:
- the chokepoint pressure domain must export this exact field set with no silent renames and no uncontracted extra chokepoint pressure fields;
- code-level validator support should fail if any required chokepoint pressure field is missing or if an uncontracted field is introduced;
- chokepoint pressure remains an interpretive burden domain built on completed Phase 1 chokepoint/dependency truth, not new chokepoint-generation output.

## 8.7 Isolation domain
Fields:
- `isolationPressure`
- `supportDelayBurden`
- `peripheralExposure`
- `accessFragility`

Code-level schema rule:
- the isolation pressure domain must export this exact field set with no silent renames and no uncontracted extra isolation pressure fields;
- code-level validator support should fail if any required isolation pressure field is missing or if an uncontracted field is introduced;
- isolation pressure remains an interpretive burden domain built on completed Phase 1 remoteness/access truth, not new isolation-generation output.

## 8.8 Ecology domain
Fields:
- `ecologicalFragility`
- `ecologicalStabilityInverse`
- `regenerationWeakness`
- `carryingCapacityBrittleness`

Code-level schema rule:
- the ecology pressure domain must export this exact field set with no silent renames and no uncontracted extra ecology pressure fields;
- code-level validator support should fail if any required ecology pressure field is missing or if an uncontracted field is introduced;
- ecology pressure remains an interpretive burden domain built on completed Phase 1 ecological-support truth, not new ecology-generation output.

## 8.9 Catastrophe domain
Fields:
- `catastrophePressure`
- `stormBreakRisk`
- `volcanicInstability`
- `floodBreakRisk`
- `droughtBreakRisk`

Code-level schema rule:
- the catastrophe pressure domain must export this exact field set with no silent renames and no uncontracted extra catastrophe pressure fields;
- code-level validator support should fail if any required catastrophe pressure field is missing or if an uncontracted field is introduced;
- catastrophe pressure remains an interpretive burden domain built on completed Phase 1 hazard truth, not new catastrophe-generation output.

### Rule
All above remain pressure-only fields.

---

# 9. Synthesized pressure axes

Mandatory:
- `survivabilityPressure`
- `mobilityPressure`
- `supplyPressure`
- `chokepointStress`
- `remotenessBurden`
- `ecologicalBurden`
- `catastropheSusceptibility`

These do not replace domain fields.

Code-level schema rule:
- the synthesized pressure schema must export this exact field set with no silent renames and no uncontracted extra synthesized pressure fields;
- code-level validator support should fail if any required synthesized pressure field is missing or if an uncontracted field is introduced;
- synthesized pressure axes remain interpretive burden compaction only and must not replace the underlying pressure domains.

---

# 10. Rhythm domain contracts

## 10.1 Seasonality domain
Fields:
- `seasonalityStrength`
- `annualSwingStrength`
- `environmentalCycleClarity`

Code-level schema rule:
- the seasonality rhythm domain must export this exact field set with no silent renames and no uncontracted extra seasonality rhythm fields;
- code-level validator support should fail if any required seasonality rhythm field is missing or if an uncontracted field is introduced;
- seasonality rhythm remains an interpretive timing domain built on completed Phase 1 climate/environment-cycle truth, not new climate-generation output.

## 10.2 Storm cadence domain
Fields:
- `stormCadence`
- `stormBurstClustering`
- `calmToStormTransitionSharpness`

Code-level schema rule:
- the storm cadence rhythm domain must export this exact field set with no silent renames and no uncontracted extra storm cadence rhythm fields;
- code-level validator support should fail if any required storm cadence rhythm field is missing or if an uncontracted field is introduced;
- storm cadence rhythm remains an interpretive timing domain built on completed Phase 1 storm-exposure and climate-cycle truth, not new hazard-generation output.

## 10.3 Navigation domain
Fields:
- `navigationWindowReliability`
- `blockedIntervalFrequency`
- `safeRouteIntervalStrength`

Code-level schema rule:
- the navigation rhythm domain must export this exact field set with no silent renames and no uncontracted extra navigation rhythm fields;
- code-level validator support should fail if any required navigation rhythm field is missing or if an uncontracted field is introduced;
- navigation rhythm remains an interpretive timing domain built on completed Phase 1 route, sea, and access-window truth, not new traversal-generation output.

## 10.4 Scarcity cadence domain
Fields:
- `scarcityCadence`
- `deficitPersistence`
- `shortageRecurrence`

Code-level schema rule:
- the scarcity cadence rhythm domain must export this exact field set with no silent renames and no uncontracted extra scarcity cadence rhythm fields;
- code-level validator support should fail if any required scarcity cadence rhythm field is missing or if an uncontracted field is introduced;
- scarcity cadence rhythm remains an interpretive timing domain built on completed Phase 1 support, food, and water pattern truth, not new scarcity-generation output.

## 10.5 Predictability domain
Fields:
- `predictability`
- `ruptureFrequency`
- `cadenceIrregularity`
- `temporalTrustworthiness`

Code-level schema rule:
- the predictability rhythm domain must export this exact field set with no silent renames and no uncontracted extra predictability rhythm fields;
- code-level validator support should fail if any required predictability rhythm field is missing or if an uncontracted field is introduced;
- predictability rhythm remains an interpretive timing domain built on completed Phase 1 environmental regularity and rupture pattern truth, not new volatility-generation output.

## 10.6 Recovery domain
Fields:
- `recoveryTempo`
- `stabilizationInterval`
- `reliefPersistence`
- `environmentalForgiveness`

Code-level schema rule:
- the recovery rhythm domain must export this exact field set with no silent renames and no uncontracted extra recovery rhythm fields;
- code-level validator support should fail if any required recovery rhythm field is missing or if an uncontracted field is introduced;
- recovery rhythm remains an interpretive timing domain built on completed Phase 1 environmental relief and stabilization truth, and it must not weaken, postpone, or make recovery optional.

### Hard rule
Recovery fields are mandatory and protected.

---

# 11. Synthesized rhythm axes

Mandatory:
- `seasonalityProfile`
- `stormRhythm`
- `navigationRhythm`
- `scarcityRhythm`
- `predictabilityProfile`
- `ruptureProfile`
- `recoveryProfile`

These must preserve timing meaning.

Code-level schema rule:
- the synthesized rhythm schema must export this exact field set with no silent renames and no uncontracted extra synthesized rhythm fields;
- code-level validator support should fail if any required synthesized rhythm field is missing or if an uncontracted field is introduced;
- synthesized rhythm axes remain timing compaction only and must not flatten timing structure into a single volatility scalar or weaken recovery meaning.

---

# 12. New anti-leakage rule from handoff package

Because `MacroGeographyHandoffPackage` now exists as an explicit downstream interface, Phase 2 fields must not silently absorb:
- political hints;
- historical-role hints;
- named strategic interpretation.

Allowed handoff influence must remain strictly structural/environment-safe and explicitly documented. fileciteturn32file0

---

# 13. Field naming rules

All field names must satisfy:
1. singular semantic meaning
2. lowerCamelCase
3. domain-consistent suffix style
4. no vague generic words like `difficulty`
5. no synonyms for the same concept across sibling domains

Good:
- `coldPressure`
- `routeReliabilityInverse`
- `stormCadence`
- `recoveryTempo`

Bad:
- `danger`
- `worldHarshness`
- `difficulty`
- `instabilityScore` without domain-specific distinction

---

# 14. Forbidden drift

Forbidden without contract update:
- changing range meaning
- renaming fields silently
- merging pressure and rhythm meanings
- collapsing recovery into predictability
- collapsing food and water into generic scarcity
- using catastrophe as rhythm
- using rhythm as burden intensity
- using handoff politics/history hints as field truth
- reintroducing climate-generation semantics into Phase 2 fields

---

# 15. Downstream assumptions allowed

Downstream systems are allowed to assume:
- all scalar fields are normalized;
- higher values mean more of the documented meaning;
- pressure fields describe burden magnitude/persistence;
- rhythm fields describe temporal structure/timing;
- recovery fields are valid rhythm fields;
- synthesized fields are stable projections of domain fields;
- record-binding layers may attach these fields to canonical record ids without changing field meaning.

Downstream systems are not allowed to assume:
- hidden ideology
- hidden story meaning
- implied scenario type
- implied NPC behavior
- implied faction identity

---

# 16. Acceptance criteria

This field-contract layer is valid only if:
1. every mandatory field has one stable meaning;
2. pressure and rhythm fields are fully separated;
3. all primary scalars use normalized ranges;
4. recovery is explicitly contracted;
5. no field invents social or narrative meaning;
6. synthesized fields do not replace domain fields;
7. field semantics remain compatible with record binding after completed Phase 1;
8. no field silently imports forbidden handoff semantics.

---

# 17. Final statement

Phase 2 vocabulary is only useful if it stays stable after completed Phase 1.

This document exists to ensure that:
- pressure stays pressure;
- rhythm stays rhythm;
- recovery is not forgotten;
- climate is interpreted rather than regenerated;
- record-bound environmental truth stays compatible with the completed macro world;
- downstream phases inherit causes instead of inventing replacements.
