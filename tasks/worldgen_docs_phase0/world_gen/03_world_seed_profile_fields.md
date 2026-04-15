# PHASE 0 — WORLD SEED PROFILE FIELDS

## Purpose
This document defines the canonical fields of `WorldSeedProfile`.

All normalized numeric values are in:

```text
[0.0 .. 1.0]
```

---

## Required fields

### `worldSeed`
The stable root seed identifier for the world run.

### `worldTone`
Readable summary label derived from the numeric profile.
Examples:
- `fractured_maritime_age`
- `dynastic_collapse_frontier`
- `storm_shattered_trade_world`

### `conflictPressure`
Bias toward competition, territorial disputes, war escalation, and force-first resolution.

### `dynastyPressure`
Bias toward bloodline logic, inheritance crises, legitimacy through houses, and marriage politics.

### `maritimeDependence`
How strongly the world depends on maritime routes, coasts, ports, archipelagos, and naval structure.

### `environmentalVolatility`
How unstable, destructive, and disruptive the environment tends to be.

### `collapseIntensity`
How deep systemic failure can become once collapse thresholds are crossed.

### `religiousInertia`
How hard religious or cosmological systems are to reform.

### `institutionalPlasticity`
How easily the world can rebuild, reform, or invent institutions after crisis.

### `migrationPressure`
Bias toward migration waves, demographic shifts, colonization, and displacement.

### `centralizationBias`
Bias toward large political cores, empires, and integrated orders.

### `memoryPersistence`
How long trauma, myth, grievance, and civilizational memory endure.

### `heroicAgencyBias`
How strongly singular figures can bend historical outcomes.

### `routeFragilityBias`
How easily routes collapse and how systemically damaging route death becomes.

### `culturalPermeability`
How easily cultures mix, absorb, and hybridize.

---

## Design rules
1. No field may be renamed silently.
2. New fields require contract updates.
3. No downstream phase may reinterpret ranges ad hoc.
4. `worldTone` is descriptive, not a hard preset controller.
