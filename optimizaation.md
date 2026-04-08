Phase 1 — Замеры и жёсткая диагностика

Цель: перестать оптимизировать вслепую.

1.1

Добавить простой runtime-profiler:

renderScene ms
drawWorld ms
drawSceneEntities ms
pathfinding ms
generateChunk ms
captureVisibleWorld ms
refreshDirty ms
1.2

Логировать:

сколько чанков загружено
сколько чанков реально нарисовано
сколько route steps
сколько interactions/house parts рисуется за кадр
1.3

Сделать debug toggle:

window.__perf = true/false
1.4

Собрать 3 сценария:

idle standing
long route preview
long movement across chunk borders
1.5

Зафиксировать baseline:

средний fps
p95 frame time
max chunk generation spike
max pathfinding spike

Профит: без этого ты легко потратишь 2 дня на узел, который даёт 5%, а не 50%.

Phase 2 — Самый быстрый профит: разгрузить кадр

Цель: убрать всё, что не должно происходить каждый кадр.

2.1

Вынести unloadDistantChunks() из animate().

Сейчас плохо:

вызывается на каждом animation frame.

Сделать:

вызывать только когда игрок пересёк границу чанка
либо раз в N шагов
либо раз в 250–500 мс во время движения
2.2

Вынести checkChunkLoading() из каждого кадра в step-level события.
Сейчас логичнее:

грузить соседние чанки после завершения шага
либо при входе в loading margin, но не каждый кадр
2.3

Ограничить captureVisibleWorldAtPlayer()
Сейчас после шага вызывается захват видимого мира.
Нужно:

вызывать только если игрок вошёл в новый чанк
или если changed visibility ring
или батчить раз в 2–3 шага
2.4

Не вызывать render.render() в местах, где уже будет кадр движения
Проверить цепочки:

movement step
ui renderAfterStateChange
camera settle
time of day transition

Нужно убрать двойные и тройные requestRender подряд.

2.5

Добавить флаг “scene changed / ui only changed”
Если меняется только текст/DOM:

не трогать canvas render вообще

Ожидаемый профит: очень высокий.
Это самый дешёвый этап по внедрению.

Phase 3 — Самый жирный CPU-узел: pathfinding

Цель: резко удешевить построение маршрута.

3.1

Заменить frontier-массив на binary min-heap
Сейчас popLowestCostNode() — O(n).
Нужно сделать:

push O(log n)
popMin O(log n)
3.2

Убрать лишние строки-ключи где возможно
Сейчас очень много:

${x},${y}

Это:

выделение строк
хэширование
мусор для GC

Сделать один из вариантов:

numeric packed key
y * WORLD_STRIDE + x если можно
либо fast integer hash
3.3

Ввести hard early exit по max allowed cost
Если игрок за ход может пройти только N клеток или cost limit известен:

не искать путь дальше разумного предела
3.4

Ввести A* вместо текущего Dijkstra-style frontier
У тебя есть target, значит эвристика уместна:

Manhattan / octile distance
с учётом диагонали
3.5

Кэшировать tileInfo не только внутри одного path query, но и локально на маршрутный запрос вокруг игрока
Если пользователь кликает рядом несколько раз подряд:

reuse local tile info window
3.6

Не пересчитывать путь, если:

выбран тот же target
player tile не изменился
relevant chunk state не изменился
3.7

Ввести “cheap preview mode”
При первом клике:

быстрый preview с лимитом глубины/стоимости
При подтверждении движения:
полный точный маршрут

Ожидаемый профит: очень высокий, особенно при длинных маршрутах и мобильных девайсах.

Phase 4 — Рендер: перейти от “рисую всё” к “рисую только что нужно”

Цель: снизить стоимость каждого canvas кадра.

4.1

Разделить canvas-слои
Сделать минимум 3 слоя:

background/world static
dynamic entities
ui overlays on canvas
либо отдельные offscreen canvases
4.2

Оставить chunk cache, но поднять уровень кэширования
Сейчас кэшируется чанк-тайловый canvas в chunk-renderer.js. Это хорошо.
Но не кэшируется:

combined visible world strip
часть house/interactions layer
4.3

Добавить dirty-флаги для chunk render cache
Перестраивать chunk.renderCache только если реально изменилось:

tile data
travel zone overlay
harvested terrain
placed/collapsed bridge
house/interactions if they baked into chunk layer
4.4

Разделить static и reactive overlay
Сейчас overlay для travel zones / harvested / island tint baked during cache build.
Нужно решить:

либо оставить в chunk cache и инвалидировать редко
либо сделать второй overlay cache per chunk
4.5

Видимость чанков считать заранее
До drawChunk:

вычислять screen bounds chunk cache
если не входит в viewport + margin — не рисовать
4.6

Для entity-слоя сделать screen culling
Не рисовать interaction/house parts, если их screen bbox вне экрана.

4.7

Маршрут рисовать упрощённо на длинных путях
Если route длинный:

не рисовать цифру на каждой клетке
не рисовать stroke на каждой клетке
оставить только endpoint chip + every Nth cell
4.8

Selected tile / route chip / effects рисовать только если есть изменение
Не гонять эти блоки при пустом состоянии.

4.9

Снизить стоимость полноэкранных overlay
drawTimeOfDayOverlay() и weather overlay — это fullscreen fill/gradient каждый кадр.
Нужно:

обновлять их только во время transition/weather animation
в idle без смены времени не перерисовывать мир из-за них

Ожидаемый профит: высокий.

Phase 5 — Генерация чанков без фризов

Цель: чтобы новые чанки не ломали тестирование.

5.1

Разделить generateChunk на стадии:

topology
structures
travel layer
interactions
finalization
5.2

Сделать lazy generation
При первом запросе:

генерить только минимально необходимое для коллизии и базового рендера
Декор/второстепенные interaction-слои — позже.
5.3

Сделать prewarm generation по маршруту
После построения route:

заранее генерить чанки пути
не в animation hot path
5.4

Поставить лимит новых чанков за тик
Например:

максимум 1–2 тяжёлых чанка за кадр/за шаг
5.5

Кэшировать deterministic sub-results
Если генерация сидовая и чистая, можно кэшировать:

chunkRecord-derived topology
house placement basis
trail meta basis
5.6

Проверить самые тяжёлые циклы в applyTravelTerrainLayer() и applyTravelZoneLayer()
Там много nested loops + neighbor scans + distance checks.
Нужно:

вынести повторяющиеся расчёты
не считать соседей по 5 раз для одной клетки
5.7

Предрассчитать карты соседства
Для chunk generation один раз собрать:

water neighbor counts
rock neighbor counts
edge distance
center distance

А не пересчитывать внутри разных этапов.

Ожидаемый профит: высокий на фризах, средний на среднем FPS.

Phase 6 — Микрооптимизация movement loop

Цель: облегчить горячую петлю движения.

6.1

В animate() оставить только:

delta
progress
step consume
interpolated render
6.2

Всё тяжёлое из moveToNextPoint() разбить:

essential movement state
deferred side effects
6.3

Отложить тяжёлые пост-эффекты шага
Например:

часть UI summary updates
часть persistence
часть exploration capture
6.4

Не дёргать world.updatePlayerContext() больше нужного
Проверить, нельзя ли:

делать один вызов на step completion
а не ещё повторно косвенно через другие ветки
6.5

Auto-rest, time-of-day, courier/perishable updates объединить в один пост-step pipeline
Сейчас логика дробится и может множить побочные вызовы.

6.6

playerRenderer.setFacingFromDelta() не вызывать каждый кадр интерполяции, если направление не изменилось

Ожидаемый профит: средний, но важный для плавности.

Phase 7 — UI и DOM

Цель: добить лишние лаги интерфейса, когда мир уже ускорен.

7.1

Разрезать ui-system.js
Сейчас это очень большой модуль со смешанной ответственностью.

7.2

Убрать legacy dead code и дубли
В файле видно много веток вида:

return module.method();
ниже старый код, который уже не используется

Это:

утяжеляет поддержку
мешает анализу реальных горячих мест
повышает риск двойной логики
7.3

Проверить refreshDirty() на лишние полные синки
Особенно:

merchant
dialogue
quests
map
mobile sync
7.4

mobileUi.sync() не вызывать на каждый refresh без проверки изменений

7.5

Inventory / merchant panel:

минимизировать innerHTML
где возможно обновлять точечно, а не целым блоком
7.6

Action hint не пересчитывать, если context key не изменился

Ожидаемый профит: средний.

Phase 8 — Память и GC

Цель: уменьшить микрофризы от сборщика мусора.

8.1

Сократить создание временных объектов в hot paths
Особенно:

route steps
screen positions
keys "x,y"
{ x, y } внутри циклов
8.2

Переиспользовать массивы/буферы где возможно

8.3

Проверить, не накапливаются ли:

renderCache canvas
effects
stale explored entries
merchant/ui strings
8.4

Добавить счётчик invalidated chunk caches
Если их слишком много перестраивается — это признак утечки производительности.

Ожидаемый профит: средний.