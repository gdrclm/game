# PHASE 0 — CONTEXT AND REPO INTEGRATION

## Goal
This document explains how **Master Seed Generator** should be integrated into `gdrclm/game` without:
- breaking the current expedition runtime;
- leaking late-world logic into early generation;
- allowing Codex to invent architecture ad hoc.

Phase 0 must behave like a **foundational, isolated source-of-truth layer**.

---

## What already exists in the project

The current repository already has:
- expedition progression over 30 islands;
- island layout generation;
- map/debug UI layers;
- world/chunk runtime systems;
- strong separation between runtime APIs and UI;
- a growing worldgen documentation stack for Phase 1.

This means Phase 0 must be introduced as a **world-law layer above everything else**, not as a gameplay system.

---

## What Phase 0 is allowed to do

Phase 0 may:
1. take a base seed;
2. produce deterministic foundational world laws;
3. produce derived tendencies;
4. produce deterministic sub-seed namespaces;
5. validate whether the world profile is expressive enough;
6. export debug-friendly foundational summaries.

---

## What Phase 0 is NOT allowed to do

Phase 0 must not:
1. generate continents or seas;
2. generate archipelago roles directly;
3. generate religions or civilizations;
4. generate local island history;
5. read current chunk state;
6. depend on UI modules;
7. patch gameplay difficulty directly.

---

## Integration order

### Stage A — docs and contracts
First create only:
- docs
- contracts
- task packs
- runtime skeleton
- validation model
- debug model

### Stage B — isolated runtime module
Create a standalone runtime under:
- `js/worldgen/phase0/`

It should accept only:
- base seed
- optional preset mode
- optional hard constraints profile

It should return only:
- `WorldSeedProfile`
- `DerivedWorldTendencies`
- `WorldSubSeedMap`
- `Phase0ValidationReport`

### Stage C — bridge into Phase 1
Only after Phase 0 is stable, Phase 1 may read:
- `WorldSeedProfile`
- `DerivedWorldTendencies`
- `WorldSubSeedMap.macroGeographySeed`

### Stage D — orchestration integration
Only after both Phase 0 and Phase 1 contracts are stable should orchestration runners and validation gates consume them together.

---

## Required repository pathing

Recommended repo paths:

```text
tasks/worldgen_docs_phase0/docs/world_gen/
js/worldgen/phase0/
```

This mirrors the Phase 1 discipline:
- docs live in a dedicated task/document pack;
- runtime lives in a dedicated worldgen folder;
- contracts stay explicit;
- tasking remains Codex-safe.

---

## Anti-hallucination rules

Codex must not:
- invent new Phase 0 outputs without contract updates;
- hardcode “cool world presets” as final truth;
- mix Phase 0 with macro geography;
- use hidden randomness outside deterministic sub-seed rules;
- allow late phases to overwrite Phase 0 outputs.

---

## Success criteria

Phase 0 integration is successful only if:
- the same base seed always produces the same foundational profile;
- the profile is expressive, not flat gray mush;
- sub-seeds are deterministic and phase-specific;
- downstream phases can consume Phase 0 without inventing missing laws.
