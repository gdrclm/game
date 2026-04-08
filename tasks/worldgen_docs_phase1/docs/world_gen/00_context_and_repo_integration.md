# ФАЗА 1 — CONTEXT AND REPO INTEGRATION

## Цель
Этот документ фиксирует, как новая фаза **Macro Geography Generator** должна встраиваться в текущий проект `gdrclm/game`, чтобы Codex не придумывал лишнюю архитектуру и не ломал уже работающие системы.

## Что уже есть в проекте
По просмотренным ключевым файлам видно следующее:

### 1. Уже существует островная прогрессия на 30 островов
Файл `js/expedition/progression.js` уже создаёт архипелаг как последовательность островов до `finalIslandIndex = 30`, хранит `islandRecord`, `chunkRecord`, progression-данные и метрики traversal/drain/recovery. Значит новая фаза не должна напрямую подменять gameplay-layer, а должна поставлять ему более богатые метаданные.

### 2. Уже существует генератор island layout
Файл `js/expedition/island-layout.js` уже генерирует:
- shape/contour island level
- archetype/scenario
- settlementType/settlementStage
- bridge pairs
- entry/exit chunks
- chunk tags
- basic house planning handoff

Сейчас это относительно компактная островная логика. Новая фаза должна стоять **выше** неё и в будущем подменять не весь код сразу, а постепенно:
- сначала поставлять macro-level world package
- потом archipelago role package
- потом island historical seed
- потом только расширять layout decisions

### 3. Уже существует карта как отдельный UI-слой
`js/ui/map-ui.js` уже умеет:
- explored tiles
- houses
- quest markers
- resources
- bookmarks
- island labels
- world bounds

Это значит, что макрогенератор должен не только создавать данные для будущей истории, но и иметь **debug views / overlays / summaries**, которые можно позже подать в map/debug UI.

### 4. Уже есть interaction/world spawn слой
`js/interactions/world-spawn-runtime.js` уже ставит meaningful world points. Это хороший целевой слой для более поздних фаз, но **не цель текущей фазы**.

### 5. Уже есть content-ориентированная архитектура
По текущему коду видно паттерн:
- `game.systems.<module>`
- state хранится отдельно
- есть registry/runtime split
- UI не должен забирать себе бизнес-логику

Новая фаза должна придерживаться того же принципа.

---

## Что новая фаза НЕ должна делать сразу
Codex не должен в рамках этой фазы:

1. Переписывать `map-ui.js` под финальные исторические карты.
2. Переписывать `item-effects.js`, loot, крафт, NPC и дома.
3. Подменять существующий `island-layout.js` целиком.
4. Сразу строить реальные дома, пропсы, биомы, POI.
5. Сразу строить финальную историческую симуляцию на 400 лет.

Сначала нужен **каркас макрогеографической причинности**.

---

## Порядок интеграции в репозиторий

### Этап A. Документация и контракты
Сначала появляются только:
- docs
- contracts
- placeholder modules
- debug exports

### Этап B. Чистый offline/worldgen layer
Потом пишется изолированный модуль:
- не зависит от UI
- не зависит от gameplay state
- принимает только seed/profile
- отдаёт `MacroGeographyPackage`

### Этап C. Bridge layer
Дальше появляется слой, который сможет преобразовать macro-package в более поздние генераторы:
- archipelago role generator
- island history generator
- future era simulator

### Этап D. Постепенное встраивание вниз
Только после этого логика начнёт влиять на:
- existing island layout
- settlement selection
- scenario selection
- future district/build zone generators

---

## Обязательное правило против галлюцинаций
Любой новый модуль этой фазы должен соответствовать этим ограничениям:

1. **Не изменять существующий gameplay contract без явного bridge layer.**
2. **Не писать “магические” поля без схемы данных.**
3. **Не создавать ad-hoc random branches вне описанных генераторов.**
4. **Не смешивать macro world generation с local tile generation.**
5. **Не тащить UI-зависимости в worldgen runtime.**
6. **Не писать новые типы данных без обновления `contracts/`.**

---

## Предлагаемая папочная структура

```text
/docs/world_gen/
  00_context_and_repo_integration.md
  01_macro_geography_overview.md
  02_macro_geography_pipeline.md
  03_macro_geography_fields.md
  04_macro_geography_algorithms.md
  05_macro_geography_validation.md
  06_codex_execution_protocol.md
  /contracts/
    macro_geography_package.md
    field_contracts.md
    region_contracts.md
  /tasks/
    phase1_macro_backlog.md
    phase1_task_packs.md
```

---

## Что именно должна отдавать эта фаза наружу
Минимум:
- continent records
- sea region records
- archipelago region records
- strategic regions
- chokepoints
- macro routes
- isolation clusters
- validation report
- debug export bundle

---

## Что считать успехом фазы
Фаза успешна, если:
- на одном и том же seed worldgen детерминирован;
- разные seeds дают действительно разные макромиры;
- архипелаг исторически значим;
- есть choke points, периферии, ядра и route belts;
- следующий генератор может опереться на эти данные без изобретения новых сущностей.
