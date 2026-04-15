# PHASE 0 — VALIDATION, DEBUG, ANTI-HALLUCINATION

## Goal
Phase 0 is not complete when it outputs “some profile”.
It is complete only when that profile is:
- expressive;
- deterministic;
- useful for downstream phases;
- archipelago-capable.

---

## Validation targets

### 1. Expressiveness target
The profile must not collapse into mid-range sameness.

### 2. Controlled extremeness target
The profile may be extreme, but not in a way that destroys downstream readability.

### 3. Derived readability target
`DerivedWorldTendencies` must be readable and meaningful.

### 4. Archipelago potential target
The profile must not structurally kill the usefulness of an archipelago-driven late world.

### 5. Downstream usability target
Phase 1 and later phases must be able to consume the profile without inventing missing global truth.

---

## Validation report structure

```json
{
  "isValid": true,
  "warnings": [],
  "scores": {
    "expressiveness": 0.0,
    "controlledExtremeness": 0.0,
    "derivedReadability": 0.0,
    "archipelagoPotential": 0.0,
    "downstreamUsability": 0.0
  },
  "rerollAdvice": [],
  "blockedDownstreamPhases": []
}
```

---

## Debug exports
Per seed, Phase 0 should be able to export:
- raw axis values;
- correlated axis values;
- world tone;
- derived tendencies;
- sub-seed map;
- validation report;
- concise markdown summary.

---

## Codex must
1. keep validation deterministic;
2. update validation docs if profile fields change;
3. never replace validation with “looks good enough”.

## Codex must not
1. invent secret bias fields;
2. silently reinterpret semantics;
3. skip validation when profile generation changes.
