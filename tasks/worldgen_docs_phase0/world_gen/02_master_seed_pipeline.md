# MASTER SEED GENERATOR — PIPELINE

## Overall structure
Phase 0 should be split into focused submodules rather than one giant file.

---

## Pipeline

### 1. Input intake
Reads:
- `baseRandomSeed`
- optional `worldPresetMode`
- optional `hardConstraintsProfile`

### 2. Deterministic RNG initialization
Creates a stable root random context for the whole world run.

### 3. Latent axis synthesis
Generates the raw normalized values for:
- conflict pressure
- dynasty pressure
- maritime dependence
- environmental volatility
- collapse intensity
- religious inertia
- institutional plasticity
- migration pressure
- centralization bias
- memory persistence
- heroic agency bias
- route fragility bias
- cultural permeability

### 4. Correlation shaping
Applies:
- correlated sampling
- clustering
- pair constraints
- anti-flatness shaping
- allowed extremeness rules

### 5. World tone synthesis
Produces a readable `worldTone` summary label.

### 6. Derived tendency synthesis
Produces:
- likely world pattern
- likely conflict mode
- likely collapse mode
- likely religious pattern
- likely archipelago role

### 7. Sub-seed derivation
Derives stable namespace seeds for downstream phases.

### 8. Validation pass
Checks:
- expressiveness
- archipelago potential
- controlled extremeness
- downstream usability

### 9. Export package assembly
Exports:
- `WorldSeedProfile`
- `DerivedWorldTendencies`
- `WorldSubSeedMap`
- `Phase0ValidationReport`

---

## Allowed feedback loops

### Loop A — validation -> latent axis synthesis
If the profile is too flat, regenerate latent axes only.

### Loop B — validation -> correlation shaping
If the profile is expressive but contradictory, recompute consistency shaping only.

### Loop C — validation -> full Phase 0 reroll
If the profile fails foundational thresholds, rerun Phase 0 only.

---

## What is forbidden
1. leaking geography generation into Phase 0;
2. using preset buckets as final logic;
3. changing downstream phase seeds ad hoc after export;
4. allowing late phases to mutate Phase 0 outputs.
