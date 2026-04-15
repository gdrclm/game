# PHASE 0 — MASTER SEED GENERATOR OVERVIEW

## Purpose
Master Seed Generator creates the **foundational genetic profile** of a world run.

This phase answers:

> What kind of world is even allowed to exist before geography or history are generated?

It does that by producing:
- a normalized `WorldSeedProfile`;
- `DerivedWorldTendencies`;
- a deterministic `WorldSubSeedMap`;
- a validation report on expressiveness and archipelago potential.

---

## Phase 0 outputs

### 1. `WorldSeedProfile`
The official set of latent axes that define world-scale biases.

### 2. `DerivedWorldTendencies`
A readable synthesis layer for debug, validation, and downstream interpretation.

### 3. `WorldSubSeedMap`
Stable sub-seed namespaces for downstream phases.

### 4. `Phase0ValidationReport`
Validation of:
- expressiveness;
- non-flatness;
- controlled extremeness;
- downstream usefulness.

---

## Why this phase exists

Without Phase 0:
- downstream phases invent their own laws;
- world identity becomes inconsistent;
- seeds stop being meaningfully expressive;
- late-world content starts contradicting early-world assumptions.

---

## Phase 0 is not content generation

Phase 0 does not create:
- continents;
- seas;
- archipelagos;
- states;
- religions;
- dynasties;
- islands;
- settlements;
- NPCs.

It creates the **conditions** from which those can later emerge.

---

## Required properties

Phase 0 must be:
- deterministic under fixed seed;
- expressive;
- frozen after export;
- downstream-readable;
- validation-aware;
- documented by contracts, not folklore.

---

## Acceptance criteria

Phase 0 is acceptable only if:
1. same base seed => same full output;
2. different seeds create meaningful contrast;
3. the profile is not generic 0.5 sludge;
4. the profile can support archipelago-driven history;
5. later phases can consume it without guessing missing logic.
