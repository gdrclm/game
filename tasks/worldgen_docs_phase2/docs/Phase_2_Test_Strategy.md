# Phase_2_Test_Strategy
## Official test strategy for Phase 2
**Repository:** `gdrclm/game`  
**Status:** Draft source-of-truth test document after completed Phase 1  
**Audience:** design, engineering, Codex implementation passes  
**Scope:** defines the required testing stack for Phase 2

---

# 1. Purpose

Phase 2 needs tests that protect:
- structural validity;
- semantic validity;
- gameplay usefulness;
- contract discipline after completed Phase 1.

---

# 2. Test layers

## 2.1 Structural tests
Verify:
- package shape
- required fields
- normalized ranges
- deterministic output

## 2.2 Contract tests
Verify:
- field naming stability
- synthesized layer presence
- required recovery domain
- record-bound profile presence

## 2.3 Causal tests
Verify:
- climate burden matches `climateBands`
- terrain burden matches `reliefRegions` / `mountainSystems`
- route pressure matches `macroRoutes`
- chokepoint pressure matches `chokepoints`
- isolation burden matches `isolatedZones`

## 2.4 Boundary tests
Verify:
- no climate duplication
- no forbidden handoff leakage
- no narrative/ideological meaning in outputs

## 2.5 Design tests
Verify:
- pressure contrast exists
- rhythm contrast exists
- relief exists
- planning-style differentiation exists

## 2.6 Gameplay projection tests
Verify:
- traversal meaning can be projected
- survival meaning can be projected
- hazard meaning can be projected
- relief meaning can be projected

---

# 3. Required regression tests

Must include at minimum:
- anti-scalar-difficulty-collapse test
- anti-pressure-rhythm-collapse test
- anti-recovery-loss test
- anti-climate-duplication test
- anti-handoff-leakage test
- anti-record-binding-loss test

---

# 4. Smoke tests

Smoke suite should:
- run several representative seeds
- verify packages export successfully
- verify summaries generate
- verify validation report populates
- verify no obvious schema drift

Implemented code-level smoke coverage now includes:
- export-gate blocking on non-`pass` validation status;
- validation report family-population checks;
- rebalance metadata locality checks;
- representative snapshot helper availability checks.

---

# 5. Representative profile tests

Maintain representative seeds / world profiles for patterns such as:
- harsh but predictable
- route volatile
- scarcity cyclic
- low relief high burden
- calm until rupture
- isolation dominant

These are not final island themes. They are environmental planning profiles.

Implemented representative fixture seeds:
- `20101` harsh but predictable
- `20102` route volatile
- `20103` scarcity cyclic
- `20104` low relief high burden
- `20105` calm until rupture
- `20106` isolation dominant

These fixtures are support-only semantic regression anchors, not canonical world exports.

---

# 5.1 Final semantic regression coverage

The current code-level regression harness explicitly covers:
- anti-scalar-collapse
- anti-recovery-loss
- anti-pressure-rhythm-collapse
- anti-climate-duplication
- anti-handoff-leakage
- anti-record-binding-loss

The purpose of this layer is to make major semantic drift test-detectable without relying on manual inspection alone.

---

# 6. Final statement

The test strategy exists so Phase 2 cannot silently degrade into:
- punishment-only math,
- flat difficulty scaling,
- or detached environmental flavor with no downstream value.
