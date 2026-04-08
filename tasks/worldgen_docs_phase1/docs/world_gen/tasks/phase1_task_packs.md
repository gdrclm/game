# PHASE 1 — TASK PACKS FOR CODEX

## Pack 1 — Foundation
Прочитать:
- 00_context_and_repo_integration.md
- 01_macro_geography_overview.md
- contracts/macro_geography_package.md

Сделать:
- модульную папку `js/worldgen/macro/`
- contracts runtime validator
- deterministic RNG wrapper
- package builder

Критерии:
- deterministic under seed
- basic package stub export works
- validation report always present

---

## Pack 2 — Fields
Прочитать:
- 03_macro_geography_fields.md
- contracts/field_contracts.md

Сделать:
- scalar field abstraction
- multi-channel field abstraction
- normalization/composition helpers
- debug heatmap export stubs

Критерии:
- fields are reproducible
- channels named exactly as in docs

---

## Pack 3 — Tectonic skeleton
Прочитать:
- 02_macro_geography_pipeline.md
- 04_macro_geography_algorithms.md
- contracts/region_contracts.md

Сделать:
- uplift / fracture / ridge / arc passes
- continent extraction
- basic continent records

Критерии:
- at least 2 continents
- deterministic output
- debug export exists

---

## Pack 4 — Marine carving
Сделать:
- bays
- straits
- island fragmentation
- sea region clustering

Критерии:
- coast not trivial
- at least one meaningful marine corridor or archipelago-like fragmentation

---

## Pack 5 — Climate pressure
Сделать:
- storm pressure
- wet decay
- cold drag
- seasonality

Критерии:
- climate actually differentiates regions historically

---

## Pack 6 — Cohesion / segmentation
Сделать:
- continental cohesion
- regional segmentation
- core candidate extraction

Критерии:
- world has strong cores and fragmented zones

---

## Pack 7 — Coastal opportunity
Сделать:
- harbor quality
- landing ease
- fishing potential
- shore defense
- inland link bonus

Критерии:
- coast zones differ in meaning

---

## Pack 8 — Routes and chokepoints
Сделать:
- hybrid graph
- macro routes
- chokepoint detection
- dependency scoring

Критерии:
- at least one meaningful route-through archipelago and at least two choke points

---

## Pack 9 — Isolation and periphery
Сделать:
- isolation maps
- peripheral clusters
- collapse-lost likelihood

Критерии:
- there are meaningful peripheries, not just random far regions

---

## Pack 10 — Archipelago significance + validation
Сделать:
- archipelago significance synthesis
- validation scoring
- partial reroll policies
- diagnostic exports

Критерии:
- archipelago is historically meaningful
- validation can reject weak worlds
