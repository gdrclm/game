# CODEX EXECUTION PROTOCOL FOR PHASE 1

## Цель
Этот документ нужен как рабочая инструкция для Codex, чтобы он выполнял задачи Phase 1 без расползания архитектуры и без галлюцинаций.

---

## 1. Обязательный порядок чтения перед задачей
Для любого task pack по Phase 1 Codex должен сначала читать:
1. `docs/world_gen/00_context_and_repo_integration.md`
2. `docs/world_gen/01_macro_geography_overview.md`
3. `docs/world_gen/02_macro_geography_pipeline.md`
4. `docs/world_gen/contracts/macro_geography_package.md`
5. `docs/world_gen/contracts/field_contracts.md`
6. `docs/world_gen/05_macro_geography_validation.md`

---

## 2. Формат задач
Каждая задача должна задаваться как отдельный пакет:

```md
# Task Pack ID
PH1-COAST-01

# Read first
- docs/world_gen/00_context_and_repo_integration.md
- docs/world_gen/03_macro_geography_fields.md
- docs/world_gen/contracts/field_contracts.md

# Goal
Implement coastal harbor quality scoring and region clustering.

# Change targets
- js/worldgen/macro/coastal-opportunity-generator.js
- js/worldgen/macro/contracts.js
- docs/world_gen/contracts/field_contracts.md
- docs/world_gen/tasks/phase1_progress_log.md

# Acceptance
- deterministic under seed
- debug heatmap exists
- exported scores written into MacroGeographyPackage
- validation updated if needed
```

---

## 3. Что Codex должен обновлять после каждой задачи
Минимум:
- код модуля;
- схемы контрактов, если менялись поля;
- progress log;
- changelog note;
- tests/debug snapshot hooks.

---

## 4. Правило “No silent schema drift”
Если Codex меняет:
- имя поля;
- диапазон значений;
- тип структуры;
- смысл output слоя;

он обязан:
1. обновить contracts;
2. обновить docs overview/pipeline/validation при необходимости;
3. написать migration note в progress log.

---

## 5. Правило “No hidden coupling”
Модули Phase 1 не должны напрямую зависеть от:
- map UI;
- local island layout;
- loot/crafting systems;
- NPC systems.

Разрешены только:
- seed/profile input;
- contracts;
- other macro generators.

---

## 6. Recommended execution order for Codex
1. Contracts
2. Field abstractions
3. Tectonic skeleton
4. Marine carving
5. Climate pressure
6. Cohesion
7. Coast opportunities
8. Route graph
9. Chokepoints
10. Isolation
11. Archipelago significance
12. Validation
13. Debug tools

---

## 7. What to do when task is too large
Если задача слишком большая, Codex должен:
- дробить её на подзадачи;
- не оставлять partial hidden implementations;
- временно ставить `TODO CONTRACTED` только в местах, где контракт уже описан;
- не изобретать новый путь в обход документации.
