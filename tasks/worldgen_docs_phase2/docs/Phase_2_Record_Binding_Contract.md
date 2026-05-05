# Phase_2_Record_Binding_Contract
## Official record-binding contract for Phase 2
**Repository:** `gdrclm/game`  
**Status:** Draft source-of-truth record-binding contract after completed Phase 1  
**Audience:** design, engineering, Codex implementation passes  
**Scope:** defines how Phase 2 environmental outputs must bind to completed Phase 1 records

---

# 1. Purpose

Completed Phase 1 exports rich records, not just abstract world fields.

That means Phase 2 must not remain a free-floating scalar-field sandbox.  
It must bind its environmental interpretations to canonical macro-world records from `MacroGeographyPackage`. fileciteturn31file0

This contract prevents:
- record-blind implementation;
- summaries detached from world entities;
- environmental truth that cannot be consumed downstream;
- hidden drift between field maps and official record layers.

---

# 2. Core rule

Every Phase 2 package must have a **record-aware interpretation layer**.

This means:
- fields may still exist as scalar outputs;
- but those fields must be associated with official record ids and stable region families;
- summaries must be able to say burden/timing truth about actual macro records, not only about anonymous coordinates.

---

# 3. Canonical record sources

Phase 2 may bind to the following completed Phase 1 root-package record families:

## Physical records
- `continents`
- `seaRegions`
- `mountainSystems`
- `volcanicZones`
- `riverBasins`
- `climateBands`
- `reliefRegions`

## Structural records
- `archipelagoRegions`
- `chokepoints`
- `macroRoutes`
- `isolatedZones`
- `strategicRegions`

These are the canonical record-binding targets. fileciteturn31file0

---

# 4. Required record-binding layer

Phase 2 must construct an internal `Phase2RecordBindingLayer` before final package export.

This layer must:
- map scalar interpretations to record ids;
- support per-record summaries;
- support grouped regional profiles;
- preserve provenance from root-package records.

---

# 5. Binding hierarchy

## Tier 1 — primary environmental carriers
These should receive the strongest environmental interpretation binding:
- `reliefRegions`
- `climateBands`
- `riverBasins`
- `seaRegions`
- `mountainSystems`
- `volcanicZones`

## Tier 2 — structural burden/timing carriers
These should receive secondary or derivative binding:
- `chokepoints`
- `macroRoutes`
- `isolatedZones`
- `archipelagoRegions`

## Tier 3 — broader context records
These may provide broader grouping or summary context:
- `continents`
- `strategicRegions`

---

# 6. Canonical record-id fields

`Phase2RecordBindingLayer` must index canonical Phase 1 records through their existing root-record id fields. It must not invent fallback ids.

- `continents` -> `continentId`
- `seaRegions` -> `seaRegionId`
- `mountainSystems` -> `mountainSystemId`
- `volcanicZones` -> `volcanicZoneId`
- `riverBasins` -> `riverBasinId`
- `climateBands` -> `climateBandId`
- `reliefRegions` -> `reliefRegionId`
- `archipelagoRegions` -> `archipelagoId`
- `chokepoints` -> `chokepointId`
- `macroRoutes` -> `routeId`
- `isolatedZones` -> `zoneId`
- `strategicRegions` -> `regionId`

`coastalOpportunityMap` may remain in the input bundle as support-only structural context, but it is not a canonical record-bound profile target.

---

# 7. Minimum record-binding scaffold shape

Before pressure or rhythm synthesis begins, the binding layer scaffold must at minimum expose:

```json
{
  "bindingLayerId": "string",
  "recordBindingContextId": "string",
  "phaseId": "PHASE_2",
  "version": "phase2-record-binding-layer-v1",
  "sourceBundleId": "string",
  "sourceMacroGeographyPackageId": "string",
  "pipelineStep": {
    "stepId": "Phase2RecordBindingLayer",
    "inputContractId": "Phase2InputBundle"
  },
  "recordIndexTables": {
    "byRecordType": {
      "reliefRegions": {
        "idField": "reliefRegionId",
        "recordIds": []
      }
    }
  },
  "primaryCarrierContextTables": {
    "recordTypes": [
      "reliefRegions",
      "climateBands",
      "riverBasins",
      "seaRegions",
      "mountainSystems",
      "volcanicZones"
    ],
    "byRecordType": {}
  },
  "secondaryContextTables": {
    "recordTypes": [
      "chokepoints",
      "macroRoutes",
      "isolatedZones",
      "archipelagoRegions",
      "strategicRegions",
      "continents"
    ],
    "derivativeStructuralRecordTypes": [
      "chokepoints",
      "macroRoutes",
      "isolatedZones",
      "archipelagoRegions"
    ],
    "broaderContextRecordTypes": [
      "strategicRegions",
      "continents"
    ],
    "priorityRules": {
      "primaryTruthSource": "primaryCarrierContextTables",
      "secondaryMayOverridePrimaryTruth": false
    },
    "byRecordType": {}
  },
  "profileTargetTables": {
    "byRecordType": {
      "reliefRegions": {
        "targetMode": "directRecordProfile",
        "packageProfileSurfaceIds": [
          "pressureRegionalProfiles",
          "rhythmRegionalProfiles"
        ]
      }
    }
  },
  "summarySurfaceTables": {},
  "supportCollections": {
    "nonProfileCollections": [
      "coastalOpportunityMap"
    ]
  },
  "bindingMeta": {}
}
```

At scaffold stage this layer may remain contract-first and field-light, but it must already:
- index canonical record ids by canonical root collection;
- define profile target modes for each record family;
- keep pressure and rhythm target surfaces distinct;
- preserve non-profile support context separately from record-bound targets.

## 7.1 Primary carrier binding step

The next binding pass must populate `primaryCarrierContextTables` for these Tier 1 physical carriers:
- `reliefRegions`
- `climateBands`
- `riverBasins`
- `seaRegions`
- `mountainSystems`
- `volcanicZones`

Each primary carrier context entry must preserve:
- canonical `recordType`;
- canonical `recordId`;
- source collection provenance;
- source descriptor snapshots from the root record;
- canonical linked ids to other root records when those refs already exist upstream.

At this stage the primary carrier context tables must not add:
- summaries;
- gameplay meaning;
- political/history interpretation;
- invented fallback ids.

## 7.2 Secondary context binding step

The next binding pass must populate `secondaryContextTables` for these structural and broader-context families:
- `chokepoints`
- `macroRoutes`
- `isolatedZones`
- `archipelagoRegions`
- `strategicRegions`
- `continents`

Secondary context entries must preserve:
- canonical `recordType`;
- canonical `recordId`;
- source collection provenance;
- safe descriptor snapshots from the root record;
- canonical refs back to already indexed primary carriers or other canonical secondary-context records;
- explicit priority rules showing that secondary context never overrides primary truth from `primaryCarrierContextTables`.

For mixed-id structural fields such as route endpoints or chokepoint adjacency, binding must resolve those refs into canonical record families rather than leaving them as anonymous ids.

Secondary context binding must not promote:
- role seeds;
- colonization or polity-facing hints;
- historical volatility or historical-importance semantics;
- summaries;
- gameplay meaning;
- any fallback rule that can override primary carrier truth.

---

# 8. Minimum record-bound profile shape

Each regional or record-bound profile must minimally support:

```json
{
  "profileId": "string",
  "recordType": "continents | seaRegions | mountainSystems | volcanicZones | riverBasins | climateBands | reliefRegions | archipelagoRegions | chokepoints | macroRoutes | isolatedZones | strategicRegions",
  "recordId": "string",
  "sourcePackageId": "string",
  "pressureSignals": {},
  "rhythmSignals": {},
  "dominantEnvironmentalTraits": [],
  "summary": "string"
}
```

`recordType` must be the canonical `MacroGeographyPackage` root collection id from Section 3. Exported profiles must not use invented record families or profile ids without a canonical `recordType` + `recordId` pair.

---

# 9. Required binding semantics

## 9.1 Provenance
Every record-bound profile must retain:
- source package id
- source record id
- source record type

## 9.2 Signal split
Pressure and rhythm signals must remain distinct inside record-bound profiles.

## 9.3 Summary grounding
The summary must be derivable from official fields, not improvised text.

## 9.4 No semantic leakage
Record-bound profiles must remain environmental.  
They must not infer:
- polity;
- religion;
- cultural meaning;
- named historical role.

---

# 10. Binding examples

## Relief region example
A `reliefRegion` may bind:
- terrain harshness
- mobility terrain penalty
- ecological fragility
- recovery tempo relevance

## Sea region example
A `seaRegion` may bind:
- storm cadence
- navigation window reliability
- route exposure context
- catastrophe susceptibility relevance

## River basin example
A `riverBasin` may bind:
- water stress
- food reliability context
- scarcity cadence relevance
- environmental forgiveness relevance

## Chokepoint example
A `chokepoint` may bind:
- chokepoint pressure
- failure impact pressure
- blocked interval frequency relevance
- detour burden relevance

---

# 11. Validation requirements

Record binding is valid only if:
1. every exported regional profile points to a canonical root-package record id;
2. profile summaries are field-backed;
3. pressure and rhythm remain separated;
4. no record-bound profile invents non-environmental meaning;
5. profile coverage is sufficient for downstream use.

---

# 12. Failure conditions

Phase 2 fails record-binding expectations if:
- packages export only global fields with no record-aware layer;
- profiles use unstable or invented ids;
- summaries do not match fields;
- pressure and rhythm are blended inside profiles;
- profiles become narrative/political in interpretation.

---

# 13. Downstream purpose

This layer exists so that later phases and runtime bridges can consume environmental truth in a form that is aligned with the actual completed macro world.

Without this layer:
- gameplay projection stays vague;
- validation stays weaker;
- summaries become decorative;
- Phase 2 becomes hard to connect to future island or route logic.

---

# 14. Final statement

After completed Phase 1, Phase 2 must become record-aware.

That means:
- not only fields,
- not only math,
- not only summaries,

but an environmental interpretation layer that can point to actual world records and describe how they are lived.
