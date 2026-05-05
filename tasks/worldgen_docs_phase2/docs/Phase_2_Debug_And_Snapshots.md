# Phase_2_Debug_And_Snapshots
## Official debug and snapshot rules for Phase 2
**Repository:** `gdrclm/game`  
**Status:** Draft source-of-truth debug document after completed Phase 1  
**Audience:** design, engineering, Codex implementation passes  
**Scope:** defines debug exports, snapshot naming, and semantic inspection rules for Phase 2

---

# 1. Purpose

Phase 2 needs a UI-free debug layer so designers and Codex can inspect:
- whether burden fields are meaningful;
- whether timing fields are meaningful;
- whether relief exists;
- whether outputs stay aligned with completed Phase 1 records.

---

# 2. Core rule

Debug artifacts are support-only.  
They must not become canonical truth or downstream gameplay dependencies.

---

# 3. Required snapshot families

## 3.1 Pressure snapshots
Should cover:
- climate burden
- terrain harshness
- hydrology stress
- food stress
- travel exposure
- chokepoint pressure
- isolation burden
- ecological fragility
- catastrophe susceptibility
- synthesized pressure axes

## 3.2 Rhythm snapshots
Should cover:
- seasonality
- storm cadence
- navigation windows
- scarcity cadence
- predictability
- rupture
- recovery tempo
- synthesized rhythm axes

## 3.3 Record-bound snapshots
Should cover:
- per-record pressure summaries
- per-record rhythm summaries
- coverage by record family
- dominant environmental traits per profile

---

# 4. Required snapshot metadata

Each snapshot should minimally include:
- `snapshotId`
- `phaseId`
- `snapshotType`
- `sourcePackageId`
- `fieldOrProfileName`
- `seedContext`
- `summary`

---

# 5. Naming rules

Names must be:
- stable
- explicit
- contract-aware

Good examples:
- `pressure_climate_coldPressure`
- `pressure_travel_travelExposure`
- `rhythm_recovery_recoveryTempo`
- `profile_reliefRegions_<id>`
- `profiles_pressureRegionalProfiles`

Bad examples:
- `dangerMap`
- `weirdField`
- `v2_temp_debug`

Code-level snapshot helpers should keep these naming rules explicit through:
- a field snapshot name helper using `<snapshotFamily>_<domainId>_<fieldId>`;
- a record-profile snapshot name helper using `profile_<recordType>_<recordId>`;
- a record-profile collection snapshot name helper using `profiles_<collectionId>`.

For profile snapshots, `recordType` should use the canonical Phase 1 / Phase 2 record family id from the binding contract, not an improvised singular alias.

## 5.1 Scaffold rule

The initial debug scaffold may export UI-free snapshot envelopes and payload previews only.

It should:
- include the required snapshot metadata from Section 4;
- expose stable naming helpers;
- remain support-only;
- avoid becoming canonical gameplay truth.

It should not:
- build a debug panel;
- require runtime adapters;
- reinterpret snapshots as authoritative world state.

---

# 6. Required summary overlays

Even when no UI is built, snapshots should be able to answer:
- where is burden concentrated?
- where is timing unstable?
- where does recovery exist?
- which record families dominate this profile?
- what planning style does this imply?

---

# 7. Representative semantic snapshot set

Maintain a small snapshot set for:
- harsh but predictable
- route volatile
- scarcity cyclic
- calm until rupture
- low relief high burden

This makes semantic drift easier to detect during implementation.

Current representative fixture set also includes:
- isolation dominant

Implemented snapshot support now includes:
- stable field snapshot helpers;
- stable record-profile snapshot helpers;
- stable record-profile collection snapshot helpers;
- representative fixture seeds for reproducible support-only snapshots.

Representative snapshot fixtures are for semantic inspection and regression support only.  
They are not runtime bridge output and must not be treated as canonical downstream gameplay truth.

---

# 8. Final statement

The debug/snapshot layer exists so Phase 2 can be inspected as a meaningful environmental system rather than a black box.
