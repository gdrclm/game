# Phase_2_Validation
## Official validation framework for Phase 2 — Pressure & Environmental Rhythm Generator
**Repository:** `gdrclm/game`  
**Status:** Updated draft source-of-truth validation document after completed Phase 1  
**Audience:** design, engineering, Codex implementation passes  
**Scope:** defines mandatory validation logic, failure modes, rebalance triggers, and acceptance standards for Phase 2 outputs

---

# 1. Purpose

This document defines the official validation framework for Phase 2 after completed Phase 1.

Phase 2 is invalid if it merely produces:
- abstract environmental math;
- generic burden fields;
- timing fields with no gameplay meaning;
- uniform hostility;
- pressure without relief;
- rhythm without planning consequences;
- record-blind field outputs detached from completed Phase 1 records;
- climate-side duplication of already completed Phase 1 climate truth;
- semantic leakage from Phase 1 handoff hints.

This validation layer exists to answer:

> Is Phase 2 producing a world that is causally coherent, semantically readable, mechanically useful, and worth passing downstream?

---

# 2. Core validation principle

Phase 2 must be validated across six different dimensions:

1. **Structural validity**
2. **Causal validity**
3. **Boundary validity**
4. **Distribution validity**
5. **Design validity**
6. **Gameplay projection validity**

A phase that passes only structural checks is still not valid.

---

# 3. Required validation artifacts

Phase 2 validation must output a `Phase2ValidationReport`.

Minimum structure:

```json
{
  "validationId": "string",
  "contractId": "Phase2ValidationReport",
  "phaseId": "PHASE_2",
  "version": "phase2-validation-report-v1",
  "sourcePressureFieldPackageId": "string",
  "sourceEnvironmentalRhythmPackageId": "string",
  "sourceMacroGeographyPackageId": "string",
  "sourceMacroGeographyHandoffPackageId": "string | null",
  "structuralChecks": {},
  "causalChecks": {},
  "boundaryChecks": {},
  "distributionChecks": {},
  "designChecks": {},
  "gameplayChecks": {},
  "summaryChecks": {},
  "rebalanceRecommendations": [],
  "blockingReasons": [],
  "finalStatus": "pass | rebalance_required | fail"
}
```

All seven family sections are mandatory even before detailed checks are populated:
- `structuralChecks`
- `causalChecks`
- `boundaryChecks`
- `distributionChecks`
- `designChecks`
- `gameplayChecks`
- `summaryChecks`

Each family section uses the same support shape:

```json
{
  "familyId": "structural | causal | boundary | distribution | design | gameplay | summary",
  "status": "not_run | pass | warning | rebalance_required | fail",
  "checks": [],
  "notes": [],
  "recommendationIds": [],
  "blockingReasonIds": [],
  "meta": {}
}
```

Each check entry uses a shared scaffold shape:

```json
{
  "checkId": "string",
  "status": "not_run | pass | warning | rebalance_required | fail",
  "message": "string",
  "details": [],
  "affectedPaths": [],
  "meta": {}
}
```

Rebalance recommendations and blocking reasons must be collected as structured arrays rather than ad hoc text:

```json
{
  "rebalanceRecommendations": [
    {
      "recommendationId": "string",
      "familyId": "structural | causal | boundary | distribution | design | gameplay | summary",
      "recommendationType": "string",
      "priority": "low | medium | high | critical",
      "message": "string",
      "targetIds": [],
      "meta": {}
    }
  ],
  "blockingReasons": [
    {
      "blockingReasonId": "string",
      "familyId": "structural | causal | boundary | distribution | design | gameplay | summary",
      "reasonCode": "string",
      "message": "string",
      "affectedPaths": [],
      "meta": {}
    }
  ]
}
```

The shared report helpers may update family statuses, append checks, collect structured rebalance recommendations, collect structured blocking reasons, and finalize `finalStatus`, but they must not perform design interpretation by themselves.

---

# 4. Structural validation

## 4.1 Package completeness
Must verify:
- `PressureFieldPackage` exists
- `EnvironmentalRhythmPackage` exists
- all mandatory domains exist
- all mandatory synthesized axes exist
- all required summaries exist
- `validationMeta` exists in both packages
- record-bound profiles exist in both packages

## 4.2 Range validity
Must verify:
- all primary scalar fields are normalized
- no values escape allowed ranges
- no NaN / null / invalid numbers in primary fields
- no field is silently uninitialized
- normalization keeps contrast rather than flattening meaningful variation

## 4.3 Determinism validity
Must verify:
- same seed + same upstream inputs -> same Phase 2 output
- no hidden non-seeded randomness
- summaries remain stable under same inputs

## 4.4 Schema stability
Must verify:
- no silent field renames
- no silent field merges
- no uncontracted new fields in package
- no changed semantic meaning without contract update

---

# 5. Causal validation

## 5.1 Root-package causality correlation
Phase 2 must be visibly caused by completed Phase 1 root-package truth.

Required checks:
- climate burden correlates with `climateBands`
- terrain harshness correlates with `reliefRegions` / `mountainSystems`
- water stress correlates with `riverBasins`
- travel exposure correlates with `macroRoutes`
- chokepoint pressure correlates with `chokepoints`
- isolation burden correlates with `isolatedZones`
- catastrophe susceptibility correlates with `volcanicZones` / sea/coast context

## 5.2 Record-binding integrity
Must verify:
- record-bound profiles point to canonical record ids
- summaries remain consistent with the referenced records
- primary record families are actually represented in profile coverage
- `Phase2RecordBindingLayer.primaryCarrierContextTables` exists for `reliefRegions`, `climateBands`, `riverBasins`, `seaRegions`, `mountainSystems`, and `volcanicZones`
- primary carrier context tables preserve canonical record ids and only keep canonical linked ids that exist in the consumed root package
- primary carrier context tables do not smuggle in summary text or gameplay meaning before summary-generation prompts
- `Phase2RecordBindingLayer.secondaryContextTables` exists for `chokepoints`, `macroRoutes`, `isolatedZones`, `archipelagoRegions`, `strategicRegions`, and `continents`
- secondary context tables preserve canonical record ids, preserve mixed canonical refs where structural records point across record families, and reject unknown or ambiguous canonical ids
- secondary context priority rules keep `primaryCarrierContextTables` as the truth source and do not allow secondary records to override primary truth
- secondary context tables do not promote blocked role/history-facing semantic fields into descriptor snapshots and do not add summaries or gameplay meaning before later prompts

---

# 6. Boundary validation

## 6.1 Anti-climate-duplication checks
Must verify:
- Phase 2 interprets climate truth, not rebuilds climate generation
- no new climate-generation semantics appear inside Phase 2 fields
- climate burden and climate cadence remain derivations from completed Phase 1 climate outputs

## 6.2 Anti-handoff-leakage checks
Must verify:
- forbidden political/history-facing handoff fields are not consumed as environmental truth
- summaries do not import strategic/political language
- only explicitly allowed handoff hints are used

## 6.3 Non-invention rule
Must verify Phase 2 does not invent:
- ideology
- religion
- narrative meaning
- faction intention
- island role truth
- historical story content

---

# 7. Distribution validation

## 7.1 Pressure contrast check
Must verify:
- the world is not uniformly harsh
- meaningful variation exists between regions
- high pressure is not globally universal
- low pressure is not globally absent

## 7.2 Rhythm contrast check
Must verify:
- rhythm is not one-note
- predictability varies meaningfully
- cadence varies meaningfully
- recovery tempo varies meaningfully
- calm vs rupture structures both exist somewhere

## 7.3 Relief presence check
Must verify:
- some regions have identifiable relief windows
- some regions have meaningful stable periods
- some regions provide environmental forgiveness
- relief is not globally absent

### Hard rule
If relief is globally absent, Phase 2 automatically fails design validation.

## 7.4 Pressure / rhythm differentiation check
Must verify:
- burden and timing are not collapsed into one scalar
- high burden can coexist with readable rhythm
- low burden can coexist with unstable rhythm
- recovery can be distinct from predictability

---

# 8. Design validation

## 8.1 Tension vs relief check
Must verify Phase 2 outputs create:
- strain
- planning tension
- moments of vulnerability
- moments of release
- different environmental play textures

## 8.2 Planning-style differentiation
Different regional outputs must imply different player behaviors:
- endurance planning
- timing-window planning
- route-risk planning
- shelter dependency planning
- scarcity conservation planning

## 8.3 Progression usefulness
Phase 2 must support island progression without collapsing into:
- flat difficulty growth
- generic “later islands harder”
- one-band environmental identity

## 8.4 Environmental identity readability
Profiles and summaries must make distinct environmental identities readable.

---

# 9. Gameplay projection validation

## 9.1 Traversal relevance
Must verify projection into:
- traversal burden
- route timing
- detour expectation
- chokepoint traversal stress

## 9.2 Survival relevance
Must verify projection into:
- water reliability
- food reliability
- shelter expectation
- recovery tempo
- exposure persistence

## 9.3 Hazard relevance
Must verify projection into:
- hazard intensity
- hazard volatility
- weather aggression
- rupture cadence

## 9.4 Relief relevance
Must verify projection into:
- safe windows
- stable zone likelihood
- recovery windows
- navigable intervals
- temporary calm

## 9.5 Runtime adapter sufficiency
Must verify progression / layout / spawn / future bridge layers can use Phase 2 outputs without inventing new environmental truth.

---

# 10. Summary validation

## 10.1 Summary correctness
Must verify:
- summaries are derived from actual fields
- summaries do not invent social meaning
- summaries are stable under same input
- summaries are readable by designers

## 10.2 Summary usefulness
Summaries must help answer:
- what makes this region hard?
- what makes this region readable or unreadable?
- where does relief exist?
- what planning style does this region imply?

---

# 11. Severity levels

## Level 1 — Warning
Valid but weaker than target.

## Level 2 — Rebalance required
Structurally valid, but design/gameplay value is insufficient.

## Level 3 — Hard fail
Must not pass downstream.

Examples:
- missing recovery fields
- no determinism
- pressure/rhythm collapse
- schema drift
- physical causality broken
- forbidden handoff leakage
- record-binding absent

---

# 12. Mandatory acceptance tests

1. Determinism test
2. Contrast test
3. Relief test
4. Root-package causal linkage test
5. Planning-style test
6. Non-invention test
7. Anti-climate-duplication test
8. Anti-handoff-leakage test
9. Record-binding completeness test
10. Gameplay projection sufficiency test
11. Summary usefulness test

---

# 13. Final statement

Phase 2 is only valuable if it survives ruthless validation.

A valid Phase 2 must prove all of the following:
- it is structurally real;
- it is caused by completed Phase 1 world truth;
- it respects package and handoff boundaries;
- it creates contrast;
- it creates relief;
- it changes planning;
- it can reach gameplay;
- it does not invade later meaning phases.
