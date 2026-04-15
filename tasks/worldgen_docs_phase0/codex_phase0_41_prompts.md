# 41 готовый промт для Codex — ФАЗА 0: Master Seed Generator

Использование:
1. Выбирай один промт.
2. Отправляй его в Codex как отдельную задачу.
3. Не объединяй далёкие шаги в один запрос.
4. После каждого шага проверяй список изменённых файлов и progress log.

Общий контекст для всех промтов:
- Репозиторий: `gdrclm/game`
- Источник правды:
  - `docs/world_gen/00_context_and_repo_integration.md`
  - `docs/world_gen/01_master_seed_overview.md`
  - `docs/world_gen/02_master_seed_pipeline.md`
  - `docs/world_gen/03_world_seed_profile_fields.md`
  - `docs/world_gen/04_subseed_namespace_and_interfaces.md`
  - `docs/world_gen/05_master_seed_validation.md`
  - `docs/world_gen/06_codex_execution_protocol.md`
  - `docs/world_gen/contracts/*`
  - `docs/world_gen/tasks/phase0_backlog.md`
- Также изучать:
  - `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
  - `00_master_seed_generator.md`
  - `PHASE_INTERACTION_DOCUMENT.md`
  - `WORLD_GENERATION_ORCHESTRATION.md`
  - `js/worldgen/phase0/*`

Обязательные ограничения для всех промтов:
- Делай только указанный микрошаг.
- Не реализуй соседние будущие шаги заранее.
- Если нужен stub, делай минимальный stub и явно помечай его.
- Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
- Всё должно быть deterministic относительно seed.
- После выполнения:
  - покажи изменённые файлы;
  - кратко опиши, что сделано;
  - укажи, что осталось следующим шагам;
  - обнови `docs/progress_log.md`.


## Промт 1

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: создать папку и каркас модулей `worldgen/phase0` без логики синтеза профиля.

Нужно:
- создать структуру файлов/папок для ФАЗЫ 0;
- подготовить понятные entry points для следующих шагов.

Не делать:
- не генерировать latent axes;
- не строить world tone;
- не делать derived tendencies или sub-seeds.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 2

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: создать `index.js` как единый export surface для Phase 0.

Нужно:
- сделать публичные entry points Phase 0;
- подготовить безопасный API для следующих шагов.

Не делать:
- не добавлять реальную генерацию;
- не смешивать index с validation logic.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 3

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: создать `contracts.js` для runtime-side валидации контрактов Phase 0.

Нужно:
- подготовить runtime validators;
- собрать контрактные проверки в одном модуле.

Не делать:
- не реализовывать profile synthesis;
- не добавлять phase1/phase2-specific logic.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 4

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: создать deterministic RNG wrapper для Master Seed Generator.

Нужно:
- отдельный RNG-модуль;
- стабильное поведение по seed;
- удобный API для подмодулей Phase 0.

Не делать:
- не реализовывать sub-seed derivation;
- не делать world profile synthesis.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 5

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: создать phase0 export bundle assembler.

Нужно:
- подготовить сборку итогового Phase 0 bundle;
- сделать понятную структуру root export package.

Не делать:
- не наполнять bundle реальной логикой synthesis;
- не делать validation scoring.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 6

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: создать validation-report builder для Phase 0.

Нужно:
- описать builder для итогового validation report;
- подготовить структуру scoring/diagnostics export.

Не делать:
- не реализовывать сами scoring rules;
- не делать reroll advice.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 7

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: создать debug summary exporter для Phase 0.

Нужно:
- markdown/json-friendly summary export;
- подготовить безопасный debug surface.

Не делать:
- не строить visual debug UI;
- не делать heatmaps.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 8

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать base seed intake.

Нужно:
- отдельный ingestion step для `baseRandomSeed`;
- проверить корректную обработку обязательного seed input.

Не делать:
- не реализовывать preset mode;
- не реализовывать hard constraints intake.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 9

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать optional preset mode intake.

Нужно:
- поддержать optional `worldPresetMode`;
- нормализовать допустимые preset inputs.

Не делать:
- не превращать presets в финальную world truth;
- не смешивать presets с world tone output.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 10

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать hard constraints profile intake.

Нужно:
- поддержать optional `hardConstraintsProfile`;
- подготовить ingestion layer для constraint-driven runs.

Не делать:
- не реализовывать полную normalization bounds систему;
- не применять constraints к latent axes глубже необходимого stub-уровня.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 11

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать option normalization.

Нужно:
- привести input options к нормализованной форме;
- сделать безопасную обработку отсутствующих и частичных полей.

Не делать:
- не реализовывать invalid option rejection глубже базовой normalization;
- не делать latent axis synthesis.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 12

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать invalid option rejection.

Нужно:
- отклонять некорректные input options;
- возвращать читаемые ошибки для Phase 0 intake.

Не делать:
- не делать UI-handling;
- не расширять в сторону downstream adapters.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 13

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать latent axis generation.

Нужно:
- сгенерировать raw normalized values для canonical Phase 0 axes;
- использовать deterministic seed usage.

Не делать:
- не делать anti-flatness shaping;
- не делать correlation shaping;
- не делать world tone synthesis.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 14

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать normalized range enforcement для profile values.

Нужно:
- гарантировать диапазон `[0.0 .. 1.0]`;
- подготовить безопасный post-processing layer для latent axes.

Не делать:
- не делать anti-flatness shaping;
- не менять semantic meaning полей.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 15

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать anti-flatness shaping.

Нужно:
- убрать profile-sludge и overly-generic outputs;
- сделать controlled expressiveness shaping.

Не делать:
- не делать pair consistency adjustment;
- не synthesize world tone.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 16

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать correlation shaping.

Нужно:
- добавить correlated sampling / correlation-aware shaping между latent axes;
- сохранить deterministic behavior.

Не делать:
- не делать final pair consistency pass;
- не вводить geography or history logic.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 17

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать pair consistency adjustment.

Нужно:
- скорректировать конфликтующие пары осей;
- сохранить expressiveness без смысловых противоречий.

Не делать:
- не synthesize world tone;
- не запускать full validation loop.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 18

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать world tone synthesis.

Нужно:
- вывести readable `worldTone` из numeric profile;
- сделать tone descriptive, not preset-controlling.

Не делать:
- не подменять numeric profile текстовым label;
- не делать derived tendencies.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 19

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать likely world pattern synthesis.

Нужно:
- добавить первый derived tendency output;
- собрать readable world-pattern summary.

Не делать:
- не делать conflict/collapse/religious/archipelago derived outputs в этом шаге.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 20

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать likely conflict mode synthesis.

Нужно:
- добавить derived tendency для conflict mode;
- использовать существующий normalized profile.

Не делать:
- не делать collapse mode;
- не делать religious pattern synthesis.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 21

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать likely collapse mode synthesis.

Нужно:
- добавить derived tendency для collapse mode;
- сохранить descriptive output layer.

Не делать:
- не делать archipelago role synthesis;
- не реализовывать validation scoring.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 22

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать likely religious pattern synthesis.

Нужно:
- добавить derived tendency для religious pattern;
- использовать только upstream Phase 0 semantics.

Не делать:
- не строить formal religion systems;
- не делать Phase 3/4 logic.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 23

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать likely archipelago role synthesis.

Нужно:
- добавить derived tendency для archipelago role;
- сделать Phase 1/15-readable summary hint.

Не делать:
- не генерировать geography;
- не подменять future archipelago role generator.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 24

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать phase namespace registry.

Нужно:
- создать официальный registry имён downstream phase namespaces;
- подготовить stable naming conventions.

Не делать:
- не derive реальные sub-seeds в этом шаге;
- не смешивать registry с RNG wrapper.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 25

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать stable sub-seed derivation.

Нужно:
- получить deterministic sub-seeds из root seed/profile context;
- экспортировать sub-seeds для downstream phases.

Не делать:
- не делать collision-safe namespace derivation глубже необходимого шага;
- не делать downstream adapters.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 26

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать collision-safe namespace derivation.

Нужно:
- защитить namespace system от конфликтов;
- сделать стабильные distinct downstream seeds.

Не делать:
- не перепроектировать phase registry;
- не делать phase-specific consumers.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 27

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать downstream-readable sub-seed export.

Нужно:
- сделать `WorldSubSeedMap` удобным для downstream consumption;
- подготовить export contract.

Не делать:
- не строить реальные downstream generators;
- не делать Phase 1 bridge adapters.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 28

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать expressiveness scoring.

Нужно:
- добавить scoring для non-flatness / expressiveness;
- встроить в validation report builder.

Не делать:
- не делать extremeness/readability/archipelago/downstream scoring в этом шаге.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 29

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать controlled extremeness scoring.

Нужно:
- добавить проверку controlled extremeness;
- не допускать chaotic unusable profiles.

Не делать:
- не делать reroll advice;
- не изменять latent axes outside validation output.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 30

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать derived readability scoring.

Нужно:
- оценить читаемость derived tendencies;
- проверить, что world tone and tendencies не являются meaningless mush.

Не делать:
- не делать archipelago potential scoring;
- не переписывать world tone synthesis.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 31

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать archipelago potential scoring.

Нужно:
- оценить пригодность profile для archipelago-driven history;
- встроить score в validation report.

Не делать:
- не строить geography;
- не делать downstream usability scoring.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 32

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать downstream usability scoring.

Нужно:
- оценить пригодность Phase 0 output для later phase consumption;
- встроить diagnostics в validation report.

Не делать:
- не писать adapters к поздним фазам;
- не делать reroll advice в этом шаге.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 33

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать reroll advice generation.

Нужно:
- формировать рекомендации: latent reroll / correlation reroll / full Phase 0 reroll;
- использовать текущий validation context.

Не делать:
- не запускать автоматический reroll loop без явной orchestration;
- не менять frozen outputs silently.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 34

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать markdown summary export.

Нужно:
- сделать human-readable markdown summary Phase 0 output;
- ориентироваться на debug/review usage.

Не делать:
- не делать web UI;
- не делать final docs auto-write outside debug export.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 35

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: реализовать JSON snapshot export.

Нужно:
- сделать machine-readable JSON snapshot Phase 0 output;
- обеспечить deterministic serialization.

Не делать:
- не строить graphical debug tools;
- не смешивать snapshot export с validation mutation.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 36

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: добавить deterministic regression tests для Phase 0.

Нужно:
- покрыть seed-stability;
- проверить одинаковый output на одинаковом seed.

Не делать:
- не строить broad integration tests для поздних фаз;
- не добавлять flaky randomized expectations.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 37

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: добавить contract conformance checks.

Нужно:
- проверить соответствие `WorldSeedProfile`, `DerivedWorldTendencies`, `WorldSubSeedMap`, `Phase0ValidationReport` официальным contracts.

Не делать:
- не переписывать contracts;
- не добавлять unrelated runtime logic.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 38

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: добавить migration-note discipline.

Нужно:
- зафиксировать правило обновления docs/contracts при schema drift;
- встроить это в progress/changelog discipline.

Не делать:
- не запускать широкую refactor automation;
- не менять semantic meaning existing fields silently.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 39

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: добавить Phase 1-safe summary bundle export.

Нужно:
- экспортировать summary bundle, который удобно читать Фазе 1;
- не расширять его до geography generation.

Не делать:
- не строить Macro Geography logic;
- не добавлять phase1-specific world mutation.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 40

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: добавить frozen output wrappers.

Нужно:
- сделать Phase 0 outputs read-only/frozen after export;
- подготовить immutable handoff semantics.

Не делать:
- не менять downstream consumers;
- не делать bridge to local gameplay.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.


## Промт 41

Ты работаешь внутри репозитория `gdrclm/game`.

Сначала внимательно прочитай:
- `docs/world_gen/00_context_and_repo_integration.md`
- `docs/world_gen/01_master_seed_overview.md`
- `docs/world_gen/02_master_seed_pipeline.md`
- `docs/world_gen/03_world_seed_profile_fields.md`
- `docs/world_gen/04_subseed_namespace_and_interfaces.md`
- `docs/world_gen/05_master_seed_validation.md`
- `docs/world_gen/06_codex_execution_protocol.md`
- `docs/world_gen/contracts/*`
- `docs/world_gen/tasks/phase0_backlog.md`

Также изучи текущий репозиторий и особенно:
- `tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `js/worldgen/phase0/*`

Сделай только этот микрошаг: проверить Phase 1 consumption compatibility.

Нужно:
- убедиться, что Phase 0 outputs пригодны для потребления Macro Geography Generator;
- подготовить compatibility note/report.

Не делать:
- не реализовывать саму Фазу 1;
- не делать integration with UI/gameplay systems.

Общие ограничения:
1. Делай только этот микрошаг.
2. Не реализуй соседние будущие шаги заранее.
3. Если нужен stub, сделай минимальный stub и явно пометь его.
4. Не смешивай Phase 0 с geography generation, UI и локальной island gameplay logic.
5. Всё должно быть deterministic относительно seed.
6. Не ломай текущую игровую архитектуру.

После выполнения:
1. Покажи список изменённых файлов.
2. Кратко опиши, что именно сделано.
3. Укажи, что НЕ сделано и должно остаться на следующие шаги.
4. Если добавлены временные заглушки, явно пометь их.
5. Обнови `docs/progress_log.md`.
