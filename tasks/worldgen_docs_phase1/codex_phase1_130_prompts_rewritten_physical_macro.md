# 130 готовых промтов для Codex — ФАЗА 1: Physical + Macro Geography Generator

Использование:
1. Выбирай один промт.
2. Отправляй его в Codex как отдельную задачу.
3. Не объединяй дальние шаги в один запрос.
4. После каждого шага проверяй список изменённых файлов и phase-specific progress log.
5. Если при чтении выяснится, что какой-то governance-файл отсутствует, не выдумывай его содержание: зафиксируй отсутствие и продолжай только в границах доступных source-of-truth документов, если это не ломает текущий микрошаг.

Общий контекст для всех промтов:
- Репозиторий: `gdrclm/game`
- Фаза 1 понимается как **Physical + Macro Geography Generator**, а не только как стратегический анализ.
- Внутри Фазы 1 должны появиться:
  - физическая основа мира: океаны, моря, материки, архипелаги, горные системы, вулканические зоны, равнины/низины, речные бассейны, климатические пояса, relief regions;
  - поверх этой основы — макроисторические слои: coastal opportunity, macro routes, chokepoints, isolation/periphery, archipelago significance, strategic regions, validation.
- Итоговый пакет должен оставаться `MacroGeographyPackage`, но теперь включать как physical outputs, так и strategic outputs.

Обязательный read-first stack для каждого промта:
### Governance layer
- `docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md` *(если лежит в другом месте — сначала найди фактический путь)*
- `PHASE_INTERACTION_DOCUMENT.md` *(если лежит в другом месте — сначала найди фактический путь)*
- `WORLD_GENERATION_ORCHESTRATION.md` *(если лежит в другом месте — сначала найди фактический путь)*

### Repository / phase integration layer
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_macro_geography_overview.md`
- `docs/world_gen/02_macro_geography_pipeline.md`
- `docs/world_gen/03_macro_geography_fields.md`
- `docs/world_gen/04_macro_geography_algorithms.md`
- `docs/world_gen/05_macro_geography_validation.md`
- `docs/world_gen/06_codex_execution_protocol_v2.md`

### Contract layer
- `docs/world_gen/contracts/macro_geography_package.md`
- `docs/world_gen/contracts/macro_geography_handoff_package.md`
- `docs/world_gen/contracts/field_contracts.md`
- `docs/world_gen/contracts/region_contracts.md`

### Task / repo context
- `docs/world_gen/tasks/phase1_macro_backlog.md`
- `js/expedition/progression.js`
- `js/expedition/island-layout.js`
- `js/ui/map-ui.js`
- `js/interactions/world-spawn-runtime.js`

Общие ограничения для всех промтов:
- Делай только указанный микрошаг.
- Не реализуй соседние будущие шаги заранее.
- Если нужен stub, делай минимальный stub и явно помечай его.
- Не смешивай worldgen с UI и локальной island gameplay logic.
- Всё должно быть deterministic относительно seed.
- Не ломай текущую игровую архитектуру.
- Не меняй downstream truth без обновления contracts/handoff docs.
- Если шаг меняет shape/semantics package-а, обнови связанные contracts и коротко зафиксируй migration note.

После выполнения каждого промта:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).

## Блок A — Каркас, contracts и read-first дисциплина

## Промт 1

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать папку и каркас модулей `worldgen/macro` под новую Physical + Macro структуру Фазы 1.

Нужно:
- создать структуру файлов/папок для physical + macro layers;
- подготовить entry points для contracts, generators, analyzers, debug, orchestration;

Не делать:
- не реализовывать генераторную логику;
- не трогать UI и gameplay runtime.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 2

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: расширить `MacroGeographyPackage` contract/schema под physical + strategic outputs.

Нужно:
- описать итоговую структуру пакета;
- добавить physical outputs: plates/continents/sea regions/mountain systems/volcanic zones/river basins/climate bands/relief regions;
- сохранить strategic outputs и базовую валидацию;

Не делать:
- не заполнять пакет реальной генерацией;
- не изобретать downstream handoff вне contracts.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 3

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать `PlateRecord` contract/schema.

Нужно:
- описать поля тектонической плиты;
- добавить базовую валидацию и экспорт;

Не делать:
- не реализовывать plate simulation;
- не связывать с terrain runtime.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 4

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: обновить `ContinentRecord` contract/schema под relief и climate references.

Нужно:
- описать поля континента с привязкой к physical layers;
- добавить базовую валидацию и экспорт;

Не делать:
- не реализовывать генерацию континентов;
- не добавлять стратегический анализ в этот контракт.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 5

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: обновить `SeaRegionRecord` contract/schema под basin / navigability / climate references.

Нужно:
- описать поля морского региона;
- добавить basin type, navigability и climate-related references;
- подготовить валидацию и экспорт;

Не делать:
- не генерировать морские регионы;
- не реализовывать route graph.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 6

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: обновить `ArchipelagoRegionRecord` contract/schema под physical + strategic significance.

Нужно:
- описать поля архипелажной макрозоны;
- добавить physical morphology refs и strategic significance refs;
- подготовить контракт для исторических фаз;

Не делать:
- не считать significance;
- не строить downstream island histories.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 7

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать `MountainSystemRecord` contract/schema.

Нужно:
- описать поля горной системы;
- добавить базовую валидацию и экспорт;

Не делать:
- не вычислять горные цепи;
- не делать climate effects.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 8

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать `VolcanicZoneRecord` contract/schema.

Нужно:
- описать поля вулканической зоны;
- добавить классификацию источника: arc / hotspot / fissure при необходимости;
- подготовить валидацию и экспорт;

Не делать:
- не генерировать вулканы;
- не делать ресурсную/геймплейную семантику.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 9

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать `RiverBasinRecord` contract/schema.

Нужно:
- описать поля речного бассейна;
- подготовить базовую валидацию и экспорт;

Не делать:
- не строить river routing;
- не добавлять local river gameplay logic.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 10

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать `ClimateBandRecord` contract/schema.

Нужно:
- описать поля климатического пояса;
- подготовить валидацию и экспорт;

Не делать:
- не рассчитывать климат;
- не делать gameplay weather rules.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 11

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать `ReliefRegionRecord` contract/schema.

Нужно:
- описать поля крупных relief regions: mountain / plateau / plain / basin / coast и т.п.;
- подготовить валидацию и экспорт;

Не делать:
- не извлекать relief regions;
- не смешивать с local biome props.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 12

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать `ChokepointRecord` contract/schema.

Нужно:
- описать поля choke point;
- добавить базовую валидацию и экспорт;

Не делать:
- не искать choke points;
- не строить route metrics.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 13

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать `MacroRouteRecord` contract/schema.

Нужно:
- описать структуру макромаршрута;
- добавить базовую валидацию и экспорт;

Не делать:
- не строить маршруты;
- не трогать island traversal runtime.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 14

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать `StrategicRegionRecord` contract/schema.

Нужно:
- описать структуру стратегического региона;
- добавить базовую валидацию и экспорт;

Не делать:
- не синтезировать strategic regions;
- не писать исторические интерпретации.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 15

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать `ValidationReport` contract/schema.

Нужно:
- описать формат итоговой проверки Фазы 1;
- добавить поля для scoring, diagnostics и selective reroll recommendations;

Не делать:
- не реализовывать scoring;
- не добавлять orchestration.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 16

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать общий `macro-types.js` или аналогичный модуль с единым export API для contracts/validators.

Нужно:
- собрать contracts в одном месте;
- сделать единый экспортируемый API для future generators;

Не делать:
- не добавлять генераторную логику;
- не трогать runtime consumers.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Блок B — Seed, RNG и базовая инфраструктура

## Промт 17

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать deterministic RNG wrapper для Physical + Macro Geography Generator.

Нужно:
- сделать отдельный RNG модуль;
- обеспечить стабильное поведение по seed;
- дать удобный API для подгенераторов;

Не делать:
- не реализовывать sub-seed derivation;
- не делать phase-wide orchestrator.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 18

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать систему sub-seed derivation для подгенераторов Фазы 1.

Нужно:
- derive sub-seeds from master seed;
- зафиксировать naming/namespace conventions;

Не делать:
- не строить генераторы поверх этого;
- не менять внешние seed contracts без необходимости.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 19

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать `MacroSeedProfile` contract и ingestion layer для Фазы 1.

Нужно:
- описать контракт seed profile, который принимает world tendencies от Phase 0;
- сделать ingest и normalize внешних параметров;

Не делать:
- не запускать генерацию мира;
- не invent новых Phase 0 полей без contracts.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 20

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: описать default bounds / normalization для Phase 1 seed constraints.

Нужно:
- задать дефолтные границы и нормализацию для physical+macro constraints;
- подготовить переиспользуемый bounds module;

Не делать:
- не смешивать bounds с UI/options;
- не писать генераторную логику.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 21

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: сделать snapshot/export стартового seed profile для дебага.

Нужно:
- добавить сериализацию profile;
- сделать debug-friendly export без UI-зависимостей;

Не делать:
- не строить heatmaps;
- не делать orchestration.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 22

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать `PhysicalWorldDebugBundle` contract или аналогичный contract для debug exports Фазы 1.

Нужно:
- описать формат debug bundle для fields, summaries и промежуточных outputs;
- сделать экспортируемый contract/module;

Не делать:
- не собирать реальный bundle из генераторов;
- не строить debug panel.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Блок C — Field system и debug infrastructure

## Промт 23

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать базовую абстракцию `ScalarField`.

Нужно:
- сделать модуль ScalarField;
- дать API чтения/записи/сэмплинга;

Не делать:
- не реализовывать DirectionalField и composer логику;
- не добавлять domain-specific tectonic math.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 24

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать базовую абстракцию `DirectionalField`.

Нужно:
- сделать хранение направлений и базовый sample API;
- подготовить совместимость с future wind/current/plate motion слоями;

Не делать:
- не реализовывать mask/composer;
- не делать visual renderer.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 25

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать базовую абстракцию `MaskField` / `ConstraintField`.

Нужно:
- сделать модуль для ограничений/масок;
- дать понятный API для фильтрации областей;

Не делать:
- не связывать с terrain generation;
- не добавлять world-specific rules.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 26

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать `FieldComposer`.

Нужно:
- реализовать комбинирование нескольких полей;
- сделать deterministic compositing rules;

Не делать:
- не добавлять domain-specific tectonic logic;
- не делать debug UI.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 27

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать `FieldNormalizer`.

Нужно:
- сделать нормализацию диапазонов полей;
- дать единый API для future layers;

Не делать:
- не делать debug export;
- не реализовывать validation scoring.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 28

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать helpers для sampling / clamping / interpolation.

Нужно:
- добавить utility functions для field system;
- оставить API минимальным и повторно используемым;

Не делать:
- не расширять в сторону route logic;
- не смешивать с UI helpers.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 29

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать debug heatmap export для scalar fields.

Нужно:
- сделать экспорт scalar field в debug-friendly формат;
- обойтись без UI-зависимостей;

Не делать:
- не строить visual panel;
- не привязываться к конкретному renderer.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 30

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать debug export для directional fields.

Нужно:
- сделать экспорт directional data для анализа;
- зафиксировать стабильный формат;

Не делать:
- не делать полноценный renderer;
- не строить dev panel.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 31

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать единый field debug index/registry.

Нужно:
- сделать реестр debug-слоёв;
- подключить scalar/directional exports;

Не делать:
- не внедрять dev panel;
- не тащить worldgen в UI.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Блок D — Tectonic foundation

## Промт 32

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать модуль `TectonicSkeletonGenerator` с пустым pipeline.

Нужно:
- создать каркас генератора;
- явно описать вход/выход и seed hooks;

Не делать:
- не генерировать поля;
- не делать orchestration всей фазы.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 33

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `plate seed distribution`.

Нужно:
- создать детерминированное распределение plate seeds;
- подготовить output для следующих tectonic шагов;

Не делать:
- не моделировать plate motion;
- не строить uplift/subsidence.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 34

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `plate motion vectors`.

Нужно:
- сгенерировать plate motion vectors по seed;
- сделать формат совместимым с boundary analysis;

Не делать:
- не классифицировать границы;
- не строить рельеф.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 35

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `plate boundary classification`.

Нужно:
- классифицировать plate boundaries как collision/divergence/transform или аналогично;
- подготовить выход для uplift, subsidence и volcanic logic;

Не делать:
- не реализовывать конечный relief;
- не строить climate effects.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 36

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `uplift field`.

Нужно:
- сгенерировать uplift field из plate/boundary data;
- обеспечить deterministic seed usage;

Не делать:
- не делать subsidence field;
- не строить full elevation composite.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 37

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `subsidence field`.

Нужно:
- сгенерировать subsidence field;
- подготовить совместимость с uplift/elevation layers;

Не делать:
- не делать marine flood fill;
- не строить basins целиком.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 38

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `fracture field`.

Нужно:
- сгенерировать fracture field;
- сделать его совместимым с uplift/subsidence;

Не делать:
- не делать ridge line synthesis;
- не строить final landmasses.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 39

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `ridge line synthesis`.

Нужно:
- вычислить ridge lines на основе tectonic fields;
- подготовить данные для mountain amplification;

Не делать:
- не делать basin logic;
- не собирать final elevation.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 40

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `basin seeds`.

Нужно:
- создать basin seed points/areas;
- обеспечить deterministic output;

Не делать:
- не собирать continent bodies;
- не делать hydrology routing.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 41

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `arc formation helper`.

Нужно:
- сделать helper для island arcs / curved tectonic forms;
- подготовить совместимость с volcanic arcs;

Не делать:
- не строить полный tectonic composite;
- не делать ocean carving.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 42

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `hotspot volcanic seed helper`.

Нужно:
- сделать helper для hotspot-like volcanic seeds;
- подготовить данные для volcanic-zone extraction;

Не делать:
- не строить actual volcanic zones;
- не делать geologic resource logic.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 43

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: собрать `plate pressure composite field`.

Нужно:
- объединить uplift/subsidence/fracture/ridge/basin/arc data в composite field;
- подготовить export для следующих слоёв;

Не делать:
- не строить land tendency map;
- не делать final elevation.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 44

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: добавить экспорт промежуточных tectonic debug layers.

Нужно:
- экспортировать uplift/subsidence/fracture/ridge/basin/etc. layers;
- связать их с field debug registry;

Не делать:
- не строить dev panel;
- не делать end-to-end bundle.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 45

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: выделить `mountain-belt candidates` из tectonic layers.

Нужно:
- определить кандидаты на крупные mountain systems;
- подготовить структуру для `MountainSystemRecord`;

Не делать:
- не делать climate shadow;
- не извлекать relief regions.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 46

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: выделить `volcanic-zone candidates` из tectonic layers.

Нужно:
- определить кандидаты arc/hotspot/fissure zones;
- подготовить структуру для `VolcanicZoneRecord`;

Не делать:
- не делать catastrophe gameplay logic;
- не строить hydrology.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Блок E — Relief / elevation

## Промт 47

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать модуль `ReliefElevationGenerator` с пустым pipeline.

Нужно:
- создать каркас relief/elevation generator;
- явно определить входы/выходы и field dependencies;

Не делать:
- не генерировать elevation;
- не делать sea fill.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 48

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `base continental mass field`.

Нужно:
- сделать coarse field континентальных масс поверх tectonic composite;
- сохранить детерминированность по seed;

Не делать:
- не делать final coastlines;
- не извлекать continents.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 49

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `macro elevation composite`.

Нужно:
- собрать крупномасштабную elevation map;
- учесть tectonic and mass fields;

Не делать:
- не делать domain warping;
- не применять sea level.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 50

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `domain warping / distortion pass` для крупных форм.

Нужно:
- добавить крупномасштабное искажение форм суши/хребтов;
- не разрушить deterministic behavior;

Не делать:
- не делать cleanup pass;
- не извлекать relief regions.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 51

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `plateau candidate field`.

Нужно:
- сделать field кандидатов на плато/возвышенности;
- подготовить совместимость с relief classification;

Не делать:
- не извлекать plateaus в records;
- не делать climate logic.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 52

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `mountain elevation amplification pass`.

Нужно:
- усилить горные зоны на базе ridge/mountain candidates;
- подготовить совместимость с rain-shadow позже;

Не делать:
- не делать mountain records;
- не строить hydrology.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 53

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `plain / lowland smoothing pass`.

Нужно:
- сформировать крупные равнины и низины там, где это допустимо;
- сделать проход совместимым с basin/plateau logic;

Не делать:
- не делать fertility scoring;
- не добавлять gameplay semantics.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 54

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `basin depression pass`.

Нужно:
- углубить basin regions внутри elevation logic;
- подготовить совместимость с lake/marsh formation later;

Не делать:
- не строить river systems;
- не делать inland seas.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 55

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `sea level application` и базовое разделение land/water.

Нужно:
- применить sea level threshold к elevation map;
- получить первичное разделение суши и воды;

Не делать:
- не делать marine carving details;
- не извлекать sea regions.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 56

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `landmass cleanup pass`.

Нужно:
- очистить шумовые артефакты land/water output;
- сохранить крупные формы и deterministic behavior;

Не делать:
- не заниматься shape scoring всего мира;
- не строить history-facing analysis.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 57

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `shape-interest scoring` для крупных landmasses.

Нужно:
- оценить интересность крупных форм суши;
- подготовить входы для validation/rebalance later;

Не делать:
- не валидировать весь мир;
- не строить strategic regions.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 58

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `continent body synthesis`.

Нужно:
- построить тела континентов из cleaned landmass output;
- подготовить `ContinentRecord`-совместимый output;

Не делать:
- не делать continent summaries весь pipeline;
- не писать downstream history logic.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 59

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `relief region extraction`.

Нужно:
- извлечь крупные relief regions: mountains / plateaus / plains / basins / coastal belts;
- подготовить output под `ReliefRegionRecord`;

Не делать:
- не делать climate classification;
- не смешивать с local biome placement.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 60

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: добавить export elevation и relief debug layers.

Нужно:
- экспортировать elevation/land-water/relief outputs в debug registry;
- сохранить стабильный формат;

Не делать:
- не строить UI panel;
- не делать full debug bundle.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Блок F — Hydrosphere, oceans и river basins

## Промт 61

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать модуль `HydrosphereGenerator` с пустым pipeline.

Нужно:
- создать каркас hydrosphere layer;
- описать входы/выходы и зависимости от elevation output;

Не делать:
- не реализовывать моря и реки;
- не строить climate logic.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 62

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `ocean basin flood-fill`.

Нужно:
- заполнить океанические бассейны от water regions;
- подготовить различение open ocean vs enclosed water;

Не делать:
- не кластеризовать sea regions;
- не строить navigability.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 63

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `sea-region clustering`.

Нужно:
- кластеризовать морские регионы на основе water geometry;
- подготовить output под `SeaRegionRecord`;

Не делать:
- не делать bays/straits;
- не строить route graph.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 64

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `inland sea formation`.

Нужно:
- выделить inland seas и похожие полузамкнутые бассейны;
- подготовить флаги/типы для sea regions;

Не делать:
- не делать bays/straits detail;
- не строить river deltas.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 65

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `bay carving`.

Нужно:
- сформировать бухты на релевантных участках береговой линии;
- сделать deterministic coastal transformation;

Не делать:
- не резать проливы;
- не строить harbor scoring.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 66

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `strait carving`.

Нужно:
- сформировать узкие морские проходы там, где это оправдано physical layers;
- подготовить входы для future chokepoint analysis;

Не делать:
- не строить island chains;
- не считать control metrics.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 67

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `island-chain fragmentation`.

Нужно:
- сформировать цепочки островов/разрывов на релевантных участках суши;
- подготовить morphology для archipelago logic later;

Не делать:
- не делать archipelago significance;
- не строить choke metrics.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 68

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `coast jaggedness control`.

Нужно:
- настроить степень изрезанности берегов без разрушения крупных форм;
- сделать параметр seed-driven и валидационно контролируемым;

Не делать:
- не строить climate effects;
- не делать local tile coast logic.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 69

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `navigability tagging`.

Нужно:
- пометить морские области по navigability / hazard roughness базового уровня;
- подготовить данные для route graph later;

Не делать:
- не строить macro routes;
- не добавлять gameplay sailing rules.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 70

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `shelf / coastal depth approximation`.

Нужно:
- аппроксимировать shelf-like coastal depth zones;
- подготовить input для harbor/landing logic later;

Не делать:
- не делать fishing score;
- не строить route graph.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 71

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: собрать `marine invasion / hydrosphere composite field`.

Нужно:
- объединить water basin, coast carving, island-chain и coastal depth layers;
- подготовить export для следующих analyzers;

Не делать:
- не делать climate integration;
- не собирать final package.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 72

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать модуль `RiverSystemGenerator` с пустым pipeline.

Нужно:
- создать каркас generator-а рек и бассейнов;
- описать входы/выходы и зависимости от elevation/hydrosphere;

Не делать:
- не строить river routing;
- не делать climate logic.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 73

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `downhill flow routing`.

Нужно:
- построить routing стока на основе elevation;
- обеспечить deterministic output;

Не делать:
- не делать accumulation map;
- не извлекать major rivers.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 74

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `flow accumulation map`.

Нужно:
- посчитать accumulation поверх downhill routing;
- подготовить основу для river extraction;

Не делать:
- не делать watershed segmentation;
- не строить lake/marsh logic.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 75

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `watershed segmentation`.

Нужно:
- сегментировать водосборы/бассейны;
- подготовить output под `RiverBasinRecord`;

Не делать:
- не извлекать final major rivers;
- не делать delta logic.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 76

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `major river extraction`.

Нужно:
- извлечь крупные river lines из accumulation/watershed data;
- подготовить совместимость с basin records;

Не делать:
- не делать local river placement;
- не строить settlement logic.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 77

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `delta / lake / marsh tagging`.

Нужно:
- добавить теги/признаки дельт, озёр и болотных зон там, где это логично;
- подготовить summary для downstream phases;

Не делать:
- не делать gameplay resources;
- не строить biomes.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 78

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: собрать `RiverBasinRecord` output и hydrology debug export.

Нужно:
- вывести records речных бассейнов;
- добавить debug export гидрологических слоёв;

Не делать:
- не делать climate blend;
- не собирать full package.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Блок G — Climate envelope и coarse natural classes

## Промт 79

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать модуль `ClimateEnvelopeGenerator`.

Нужно:
- создать каркас climate generator-а;
- описать входы/выходы и зависимости от geography/hydrosphere;

Не делать:
- не реализовывать climate fields;
- не строить gameplay weather systems.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 80

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `latitude bands`.

Нужно:
- сгенерировать latitude-derived climate baseline;
- подготовить совместимость с temperature/wetness layers;

Не делать:
- не делать winds;
- не делать final climate zones.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).



## Промт 81

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `prevailing wind field`.

Нужно:
- сгенерировать базовый field господствующих ветров;
- сохранить deterministic поведение;

Не делать:
- не делать humidity transport;
- не строить ocean current simulation.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 82

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `humidity transport pass`.

Нужно:
- провести влажность через wind + hydrosphere context;
- подготовить wetness field;

Не делать:
- не делать rain shadow;
- не классифицировать климат.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 83

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `rain-shadow effect` от горных систем.

Нужно:
- учесть влияние mountain systems/elevation на влажность;
- обновить wetness-related outputs корректно;

Не делать:
- не делать final climate zones;
- не строить biome envelope.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 84

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `temperature / cold-load field`.

Нужно:
- создать temperature/cold-load field на базе latitude/elevation/other constraints;
- подготовить основу для climate band classification;

Не делать:
- не делать wetness bands;
- не строить seasonality.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 85

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `wetness field`.

Нужно:
- создать wetness field на базе humidity transport и geography;
- подготовить основу для climate/biome classification;

Не делать:
- не делать storm corridors;
- не строить gameplay weather.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 86

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `storm corridors`.

Нужно:
- сформировать крупные storm-prone corridors;
- подготовить input для route risk and isolation later;

Не делать:
- не строить route graph;
- не делать catastrophe systems.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 87

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `coastal decay burden`.

Нужно:
- оценить coastal decay pressure для береговых областей;
- подготовить input для pressure/history later;

Не делать:
- не делать building decay systems;
- не строить settlement logic.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 88

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `seasonality score`.

Нужно:
- добавить score сезонной изменчивости/предсказуемости;
- подготовить regional summary;

Не делать:
- не строить yearly simulation;
- не делать gameplay time systems.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 89

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `climate zone classification`.

Нужно:
- классифицировать крупные climate zones по полям температуры, влажности, штормовости и seasonality;
- подготовить output под `ClimateBandRecord`;

Не делать:
- не делать biome envelope;
- не строить pressure package Phase 2.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 90

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: вывести `ClimateBandRecord` output.

Нужно:
- собрать climate band records;
- подготовить summaries per region/continent/sea;

Не делать:
- не собирать full MacroGeographyPackage;
- не делать downstream pressure generator.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 91

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать `biome-envelope helper` для physical world layer.

Нужно:
- сделать helper для physical biome envelopes как coarse natural classes;
- явно отделить их от gameplay biomes и local realization;

Не делать:
- не строить local biome placement;
- не делать props/resources.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 92

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `biome envelope classification` на базе climate + elevation + wetness.

Нужно:
- классифицировать coarse natural envelopes для world-scale анализа;
- подготовить summaries для downstream phases;

Не делать:
- не делать local terrain decoration;
- не добавлять gameplay tags.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 93

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: собрать `ClimateStressField` и regional climate summaries.

Нужно:
- собрать climate stress outputs и summary tables per major region;
- подготовить экспорт для future Pressure phase;

Не делать:
- не строить PressureFieldPackage;
- не делать orchestration.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 94

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: добавить climate / biome debug export.

Нужно:
- экспортировать climate/wetness/storm/seasonality/biome envelope layers;
- связать их с debug registry;

Не делать:
- не строить dev panel;
- не собирать final end-to-end bundle.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Блок H — Continental cohesion и coastal opportunity

## Промт 95

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать модуль `ContinentalCohesionAnalyzer`.

Нужно:
- создать каркас analyzer-а связности суши;
- описать входы/выходы и зависимости от physical world layers;

Не делать:
- не делать реальный анализ;
- не строить strategic regions.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 96

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `interior passability analysis`.

Нужно:
- оценить проходность внутренних земель на coarse уровне;
- подготовить input для segmentation/core analysis;

Не делать:
- не делать route graph;
- не строить settlement viability.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 97

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `regional segmentation analysis`.

Нужно:
- разбить сушу на крупные сегменты/блоки по связности и барьерам;
- подготовить input для core/periphery analysis;

Не делать:
- не определять cores окончательно;
- не строить archipelago significance.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 98

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `core potential analysis`.

Нужно:
- оценить потенциальные land cores;
- подготовить входы для strategic region synthesis later;

Не делать:
- не определять imperial cores как финальный output;
- не строить trade belts.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 99

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `fractured-periphery analysis`.

Нужно:
- выделить расколотые окраины и трудно удерживаемые области;
- подготовить summaries per continent/region;

Не делать:
- не строить isolation model;
- не делать collapse logic.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 100

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: собрать `ContinentalCohesionField` и summaries per continent.

Нужно:
- собрать output analyzer-а связности;
- подготовить export для coast/graph/isolation modules;

Не делать:
- не собирать final package;
- не делать orchestration.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 101

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать модуль `CoastalOpportunityAnalyzer`.

Нужно:
- создать каркас analyzer-а береговых возможностей;
- описать входы/выходы и зависимости от coastal depth, hydrosphere, climate и cohesion;

Не делать:
- не делать реальный scoring;
- не строить harbor nodes.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 102

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `harbor quality score`.

Нужно:
- оценить качество естественных гаваней;
- подготовить совместимость с coastal node extraction;

Не делать:
- не делать landing/fishing scores;
- не строить trade routes.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 103

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `landing ease score`.

Нужно:
- оценить удобство высадки на побережьях;
- подготовить слой для combined coastal profile;

Не делать:
- не делать harbor quality tweaks;
- не строить route graph.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 104

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `fishing potential score`.

Нужно:
- оценить рыболовный потенциал coarse-scale;
- подготовить слой для coastal profile;

Не делать:
- не делать economy/loot implications;
- не строить settlements.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 105

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `shore defense score`.

Нужно:
- оценить береговую защищённость;
- подготовить слой для future strategic analysis;

Не делать:
- не делать military region synthesis;
- не строить choke metrics.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 106

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `inland-link bonus score`.

Нужно:
- оценить бонус связности побережья с внутренними регионами;
- подготовить combined coastal profile;

Не делать:
- не строить land graph;
- не делать strategic regions.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 107

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: собрать `coastal opportunity profile` и выделить `exceptional coastal nodes`.

Нужно:
- объединить harbor/landing/fishing/defense/inland-link scores;
- выделить exceptional coastal nodes и summaries;

Не делать:
- не строить macro routes;
- не делать settlement generation.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Блок I — Connectivity, routes и chokepoints

## Промт 108

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать модуль `ConnectivityGraphBuilder`.

Нужно:
- создать каркас builder-а связности;
- описать входы/выходы и coarse graph model;

Не делать:
- не строить графы;
- не делать route extraction.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 109

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: построить coarse `land graph`.

Нужно:
- собрать coarse graph суши на базе континентов/relief/passability;
- подготовить совместимость с hybrid graph later;

Не делать:
- не строить sea graph;
- не делать route costs.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 110

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: построить coarse `sea graph`.

Нужно:
- собрать coarse graph морской связности на базе sea regions/navigability/straits;
- подготовить совместимость с hybrid graph later;

Не делать:
- не строить land graph заново;
- не делать route sampling.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 111

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: собрать `hybrid land-sea graph`.

Нужно:
- объединить land и sea graph в общий connectivity model;
- подготовить входы для routes/corridors/chokepoints;

Не делать:
- не делать route cost model;
- не строить chokepoint metrics.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 112

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `route cost model`.

Нужно:
- ввести weighted cost model для hybrid graph;
- учесть climate, navigability, passability и relevant constraints;

Не делать:
- не сэмплировать маршруты;
- не делать chokepoint detection.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 113

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `route sampling between major regions`.

Нужно:
- просэмплировать coarse routes между major regions;
- подготовить данные для corridor extraction;

Не делать:
- не извлекать corridors;
- не строить chokepoints.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 114

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `macro corridor extraction`.

Нужно:
- выделить устойчивые macro corridors из sampled routes;
- подготовить summaries для choke/isolation/archipelago analyzers;

Не делать:
- не делать mandatory/redundant classification;
- не строить final route records.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 115

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `mandatory / redundant / brittle corridor detection`.

Нужно:
- классифицировать corridors по обязательности, избыточности и хрупкости;
- подготовить output для route and choke records;

Не делать:
- не считать choke metrics;
- не делать archipelago significance.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 116

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать модуль `ChokepointAnalyzer`.

Нужно:
- создать каркас analyzer-а choke points;
- описать входы/выходы и метрики;

Не делать:
- не искать choke points;
- не делать control/trade scores.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 117

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `narrow strait detection`.

Нужно:
- обнаружить узкие проливы на основе hydrosphere/graph data;
- подготовить кандидаты choke points;

Не делать:
- не искать island-chain locks;
- не делать choke metrics.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 118

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `island-chain lock detection`.

Нужно:
- обнаружить island-chain locks и обязательные цепи островов;
- подготовить кандидаты choke points;

Не делать:
- не искать inland bottlenecks;
- не делать choke metrics.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 119

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `inland bottleneck detection`.

Нужно:
- обнаружить inland bottlenecks на суше/coast transitions;
- подготовить кандидаты choke points;

Не делать:
- не считать choke metrics;
- не классифицировать choke points.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 120

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать choke metrics `controlValue` и `tradeDependency`.

Нужно:
- посчитать controlValue и tradeDependency для choke candidates;
- подготовить данные для final classification;

Не делать:
- не считать bypassDifficulty/collapseSensitivity;
- не собирать final records.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 121

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать choke metrics `bypassDifficulty` и `collapseSensitivity`, затем classification.

Нужно:
- посчитать оставшиеся choke metrics;
- сделать классификацию choke points;

Не делать:
- не собирать final records вне этого шага;
- не строить isolation model.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 122

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: собрать `ChokepointRecord` output.

Нужно:
- собрать финальный список choke records;
- подготовить export для downstream phases;

Не делать:
- не делать archipelago significance;
- не собирать final package.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Блок J — Isolation, archipelago significance, strategic synthesis, validation и orchestration

## Промт 123

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать модуль `IsolationAndPeripheryAnalyzer` и реализовать `distance-from-core`, `resupply cost`, `weather-adjusted isolation`.

Нужно:
- создать каркас analyzer-а изоляции и периферийности;
- реализовать distance-from-core model, resupply cost model и weather-adjusted isolation;

Не делать:
- не делать cultural drift / collapse scores;
- не собирать isolated zones.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 124

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `cultural drift potential`, `lost-in-collapse likelihood`, `autonomous survival score`, затем собрать `isolated zones` и `periphery clusters`.

Нужно:
- досчитать поведенческие/исторические метрики изоляции;
- собрать isolated zones и periphery clusters;

Не делать:
- не делать archipelago significance;
- не строить strategic regions.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 125

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать модуль `ArchipelagoSignificanceGenerator` и реализовать detection архипелажной макрозоны.

Нужно:
- создать каркас generator-а значимости архипелага;
- обнаружить archipelago macrozone на основе physical + route context;

Не делать:
- не считать significance metrics;
- не строить strategic regions.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 126

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `connectiveValue`, `fragility`, `colonizationAppeal`, `contestScore`, `collapseSusceptibility` и `archipelago role seed generation`.

Нужно:
- посчитать ключевые significance metrics архипелага;
- сгенерировать archipelago role seed/hints для downstream phases;

Не делать:
- не строить island roles/history;
- не делать final package orchestration.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 127

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать модуль `StrategicRegionSynthesizer` и реализовать `imperial core candidates`, `trade belt candidates`, `fragile peripheries`, `disputed strategic regions`.

Нужно:
- создать каркас synthesizer-а стратегических регионов;
- собрать ключевые типы strategic regions из physical + route + choke + isolation data;

Не делать:
- не писать позднюю историю регионов;
- не делать validation/rebalance.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 128

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: создать модуль `MacroValidationAndRebalance` и реализовать `macro diversity`, `route richness`, `choke usefulness`, `archipelago significance`, `center-periphery contrast`, `history-potential` scoring плюс diagnostics.

Нужно:
- создать каркас validation/rebalance layer;
- реализовать ключевые scoring passes и diagnostics;

Не делать:
- не делать partial regeneration;
- не собирать end-to-end orchestrator.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 129

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: реализовать `partial regeneration / rebalance pass`, затем создать `MacroGeographyGenerator` orchestrator и связать все outputs в `MacroGeographyPackage`.

Нужно:
- реализовать selective partial reroll/rebalance по согласованным правилам;
- создать orchestrator Фазы 1;
- связать physical generators, analyzers и final package assembly;

Не делать:
- не делать full random reroll всего мира при каждой локальной проблеме;
- не тащить worldgen в UI/runtime hooks.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).


## Промт 130

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай read-first stack из начала этого файла:
- governance layer;
- repository / phase integration layer;
- contract layer;
- task / repo context.

Также проверь фактические пути файлов в репозитории перед чтением, если какой-то путь из governance layer отличается от ожидаемого.

Сделай только этот микрошаг: добавить deterministic end-to-end generation by seed, end-to-end debug export, machine-readable summary for следующих фаз и integration hook для downstream generators.

Нужно:
- обеспечить deterministic end-to-end generation;
- собрать end-to-end debug export bundle;
- добавить machine-readable summary/handoff для следующих фаз;
- добавить integration hook для downstream generators без invent новой downstream truth;

Не делать:
- не строить поздние исторические фазы прямо здесь;
- не смешивать Macro Geography с local island gameplay runtime.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай worldgen с UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.
7. Если меняется shape или semantics contract-а, обнови связанный contract/handoff doc и коротко зафиксируй migration note.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови phase-specific progress log (`docs/world_gen/tasks/phase1_progress_log.md`, а если его нет — `docs/progress_log.md`).

