(() => {
    const game = window.Game;
    const stateSchema = game.systems.stateSchema;
    const saveLoad = game.systems.saveLoad;
    const resourceRegistry = game.systems.resourceRegistry;
    const componentRegistry = game.systems.componentRegistry;
    const recipeRegistry = game.systems.recipeRegistry;
    const craftingRuntime = game.systems.craftingRuntime;
    const compressionRuntime = game.systems.compressionRuntime;
    const stationRuntime = game.systems.stationRuntime;
    const itemRegistry = game.systems.itemRegistry;
    const inventoryRuntime = game.systems.inventoryRuntime;
    const gameEvents = game.systems.gameEvents;
    const actionUi = game.systems.actionUi;
    const bridge = game.systems.uiBridge;
    const summaryElement = document.getElementById('summary');
    const resultsElement = document.getElementById('results');
    const tests = [];

    function addTest(group, name, fn) {
        tests.push({ group, name, fn });
    }

    function stableStringify(value) {
        if (Array.isArray(value)) {
            return `[${value.map(stableStringify).join(',')}]`;
        }

        if (!value || typeof value !== 'object') {
            return JSON.stringify(value);
        }

        return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
    }

    function assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed.');
        }
    }

    function assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}.`);
        }
    }

    function assertDeepEqual(actual, expected, message) {
        if (stableStringify(actual) !== stableStringify(expected)) {
            throw new Error(message || `Expected ${stableStringify(expected)}, got ${stableStringify(actual)}.`);
        }
    }

    function assertThrows(fn, pattern, message) {
        let didThrow = false;

        try {
            fn();
        } catch (error) {
            didThrow = true;

            if (pattern && !pattern.test(String(error && error.message ? error.message : error))) {
                throw new Error(message || `Unexpected error: ${error.message || error}`);
            }
        }

        if (!didThrow) {
            throw new Error(message || 'Expected function to throw.');
        }
    }

    function resetHarness() {
        game.state = stateSchema.createInitialState();

        if (gameEvents && typeof gameEvents.clearAll === 'function') {
            gameEvents.clearAll();
        }

        if (bridge) {
            bridge.lastActionMessage = '';
            bridge.renderCallCount = 0;
        }

        delete game.systems.world;
    }

    function buildLegacySnapshot(overrides = {}) {
        const domains = stateSchema.splitStateByDomain(stateSchema.createInitialState());
        return {
            saveVersion: 1,
            player: domains.player,
            world: domains.world,
            narrative: domains.narrative,
            ui: domains.ui,
            ...overrides
        };
    }

    function installGatherTestWorld() {
        const tiles = {
            '0,0': { x: 0, y: 0, tileType: 'grass', baseTileType: 'grass', house: null },
            '1,0': { x: 1, y: 0, tileType: 'rock', baseTileType: 'rock', house: null }
        };

        game.state.playerPos = { x: 0, y: 0 };
        game.systems.world = {
            getTileInfo(x, y) {
                return tiles[`${x},${y}`] || { x, y, tileType: 'grass', baseTileType: 'grass', house: null };
            },
            updatePlayerContext() {}
        };

        return tiles['1,0'];
    }

    addTest('1. resource-registry.js', 'Возвращает все базовые ресурсы по id без undefined', () => {
        resetHarness();
        const requiredIds = ['grass', 'stone', 'rubble', 'wood', 'water', 'fish'];

        requiredIds.forEach((resourceId) => {
            assert(resourceRegistry.getBaseResourceDefinition(resourceId), `Не найден ресурс ${resourceId}.`);
        });
    });

    addTest('1. resource-registry.js', 'Дублирующий resourceId валится с понятной ошибкой в dev-режиме', () => {
        assertThrows(() => resourceRegistry.createValidatedResourceRegistry([
            { id: 'grass', type: 'raw', label: 'Трава', source: 'Луг' },
            { resourceId: 'grass', type: 'raw', label: 'Трава 2', source: 'Луг 2' }
        ], { devMode: true }), /Duplicate resourceId "grass"/);
    });

    addTest('1. resource-registry.js', 'У ресурса без обязательных полей срабатывает валидация', () => {
        assertThrows(() => resourceRegistry.validateBaseResourceDefinition({
            id: 'broken-resource'
        }), /label, type, source/);
    });

    addTest('2. component-registry.js', 'Каждый компонент доступен по id и содержит ingredients/sourceTags', () => {
        const requiredIds = ['healingBase', 'herbalPaste', 'rope', 'board', 'boatFrame', 'gravelFill', 'stoneBlock', 'fishMeat', 'fishOil'];

        requiredIds.forEach((componentId) => {
            const component = componentRegistry.getComponentDefinition(componentId);
            assert(component, `Не найден компонент ${componentId}.`);
            assert(Array.isArray(component.ingredients) && component.ingredients.length > 0, `У компонента ${componentId} нет ingredients.`);
            assert(Array.isArray(component.sourceTags) && component.sourceTags.length > 0, `У компонента ${componentId} нет sourceTags.`);
        });
    });

    addTest('2. component-registry.js', 'Компонент не может ссылаться на несуществующий raw-resource', () => {
        assertThrows(() => componentRegistry.createValidatedComponentRegistry([
            {
                id: 'broken-component',
                label: 'Сломанный компонент',
                craftMethod: 'hand',
                sourceResourceIds: ['ghostResource'],
                resourceInputs: [{ resourceId: 'ghostResource', quantity: 5 }],
                tags: ['building']
            }
        ], {
            resourceRegistry,
            devMode: true
        }), /unknown raw resource "ghostResource"/i);
    });

    addTest('2. component-registry.js', 'Компоненты корректно фильтруются по тегам healing, repair, building', () => {
        const healingIds = componentRegistry.getComponentsByTag('healing').map((component) => component.id);
        const repairIds = componentRegistry.getComponentsByTag('repair').map((component) => component.id);
        const buildingIds = componentRegistry.getComponentsByTag('building').map((component) => component.id);

        assert(healingIds.includes('healingBase') && healingIds.includes('herbalPaste'), 'healing-тег фильтруется неверно.');
        assert(repairIds.includes('gravelFill') && repairIds.includes('rope'), 'repair-тег фильтруется неверно.');
        assert(buildingIds.includes('board') && buildingIds.includes('boatFrame') && buildingIds.includes('stoneBlock'), 'building-тег фильтруется неверно.');
    });

    addTest('3. recipe-registry.js', 'Любой рецепт находится по recipeId', () => {
        recipeRegistry.getRecipeDefinitions().forEach((recipe) => {
            assert(recipeRegistry.getRecipeDefinition(recipe.recipeId), `Не найден рецепт ${recipe.recipeId}.`);
        });
    });

    addTest('3. recipe-registry.js', 'Рецепт с несуществующим ингредиентом не загружается', () => {
        assertThrows(() => recipeRegistry.createValidatedRecipeRegistry([
            {
                recipeId: 'broken-recipe',
                label: 'Сломанный рецепт',
                station: 'hand',
                stationLabel: 'Руки',
                tier: recipeRegistry.RECIPE_TIERS.baseConversion,
                ingredients: [
                    { kind: 'component', id: 'ghostComponent', label: 'Призрак', quantity: 1 }
                ],
                result: { kind: 'component', id: 'rope', label: 'Верёвка', quantity: 1 },
                tags: ['test'],
                islandNeedProfile: { windows: [] }
            }
        ], {
            resourceRegistry,
            componentRegistry,
            devMode: true
        }), /unknown ingredient component "ghostComponent"/i);
    });

    addTest('3. recipe-registry.js', 'Рецепты корректно фильтруются по станции и tier', () => {
        const campRecipes = recipeRegistry.getRecipesByStation('camp');
        const tierTwoRecipes = recipeRegistry.getRecipesByTier(recipeRegistry.RECIPE_TIERS.survivalAndEnergy);

        assert(campRecipes.length > 0 && campRecipes.every((recipe) => recipe.stationOptions.includes('camp')), 'Фильтр по станции camp работает неверно.');
        assert(tierTwoRecipes.length > 0 && tierTwoRecipes.every((recipe) => recipe.tier === recipeRegistry.RECIPE_TIERS.survivalAndEnergy), 'Фильтр по tier работает неверно.');
    });

    addTest('4. crafting-runtime.js', 'При наличии всех ингредиентов рецепт успешно крафтится', () => {
        const outcome = craftingRuntime.craftRecipeAgainstStock('portable-bridge', {
            stockEntries: [
                craftingRuntime.buildStockEntry('component', 'board', 'Доска', 2),
                craftingRuntime.buildStockEntry('component', 'rope', 'Верёвка', 1),
                craftingRuntime.buildStockEntry('component', 'stoneBlock', 'Каменный блок', 1)
            ],
            availableStations: ['bench']
        });

        assert(outcome.success, 'Крафт не завершился успешно.');
        assertEqual(outcome.result.id, 'portableBridge', 'Создан неверный результат рецепта.');
    });

    addTest('4. crafting-runtime.js', 'При нехватке хотя бы одного ингредиента результат не создаётся', () => {
        const outcome = craftingRuntime.craftRecipeAgainstStock('portable-bridge', {
            stockEntries: [
                craftingRuntime.buildStockEntry('component', 'board', 'Доска', 2),
                craftingRuntime.buildStockEntry('component', 'stoneBlock', 'Каменный блок', 1)
            ],
            availableStations: ['bench']
        });

        assert(!outcome.success, 'Крафт не должен был завершиться успешно.');
        assertEqual(outcome.reason, 'missing-ingredients', 'Ожидалась ошибка нехватки ингредиентов.');
        assert(!outcome.result, 'Результат не должен создаваться при нехватке ингредиентов.');
    });

    addTest('4. crafting-runtime.js', 'После крафта инвентарь уменьшается строго на нужные количества', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('raw_grass', 10);

        const beforeRawGrass = inventoryRuntime.countInventoryItem('raw_grass');
        const beforeRope = inventoryRuntime.countInventoryItem('rope');
        const outcome = craftingRuntime.craftRecipeAgainstInventory('grass-to-rope', {
            availableStations: ['bench']
        });

        assert(outcome.success, 'Крафт через игровой инвентарь не завершился.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_grass'), beforeRawGrass - 10, 'Ингредиенты списались неверно.');
        assertEqual(inventoryRuntime.countInventoryItem('rope'), beforeRope + 1, 'Результат добавился неверно.');
    });

    addTest('5. station-runtime.js', 'Рецепт недоступен на неверной станции', () => {
        const outcome = craftingRuntime.evaluateRecipeAgainstStock('portable-bridge', {
            stockEntries: [],
            availableStations: ['camp']
        });

        assert(!outcome.success, 'Рецепт не должен быть доступен на лагере.');
        assertEqual(outcome.reason, 'wrong-station', 'Ожидалась ошибка wrong-station.');
    });

    addTest('5. station-runtime.js', 'Рецепт доступен на правильной станции', () => {
        const outcome = craftingRuntime.evaluateRecipeAgainstStock('portable-bridge', {
            stockEntries: [
                craftingRuntime.buildStockEntry('component', 'board', 'Доска', 2),
                craftingRuntime.buildStockEntry('component', 'rope', 'Верёвка', 1),
                craftingRuntime.buildStockEntry('component', 'stoneBlock', 'Каменный блок', 1)
            ],
            availableStations: ['bench']
        });

        assert(outcome.success, 'Рецепт должен быть доступен на верстаке.');
    });

    addTest('5. station-runtime.js', 'Список доступных рецептов меняется при смене станции', () => {
        const campRecipeIds = craftingRuntime.getRecipesForStation('camp').map((recipe) => recipe.recipeId);
        const smithyRecipeIds = craftingRuntime.getRecipesForStation('smithy').map((recipe) => recipe.recipeId);

        assert(campRecipeIds.includes('healing-brew'), 'В лагере должен быть рецепт healing-brew.');
        assert(!campRecipeIds.includes('island-drill'), 'Кузнечный рецепт не должен быть в лагере.');
        assert(smithyRecipeIds.includes('island-drill'), 'В кузнице должен быть island-drill.');
    });

    addTest('6. craftingState в save schema', 'Новый сейв содержит craftingState с дефолтной структурой', () => {
        const snapshot = saveLoad.buildSaveSnapshot(stateSchema.createInitialState());

        assert(snapshot.craftingState, 'В snapshot отсутствует craftingState.');
        ['resources', 'containers', 'knownRecipes', 'stationUnlocks', 'resourceNodesState'].forEach((key) => {
            assert(snapshot.craftingState[key] && typeof snapshot.craftingState[key] === 'object', `В craftingState отсутствует поле ${key}.`);
        });
    });

    addTest('6. craftingState в save schema', 'Старый сейв без craftingState мигрируется без краша', () => {
        const legacySnapshot = buildLegacySnapshot();
        const hydratedState = saveLoad.hydrateStateFromSnapshot(legacySnapshot);

        assert(hydratedState && hydratedState.craftingState, 'Старый сейв не получил craftingState.');
    });

    addTest('6. craftingState в save schema', 'После загрузки crafted state не теряется', () => {
        resetHarness();
        game.state.craftingState.knownRecipes['grass-to-rope'] = { recipeId: 'grass-to-rope' };
        game.state.craftingState.stationUnlocks.bench = { stationId: 'bench', unlockedAtIslandIndex: 3 };
        const snapshot = saveLoad.buildSaveSnapshot(game.state);
        const hydratedState = saveLoad.hydrateStateFromSnapshot(snapshot);

        assert(hydratedState.craftingState.knownRecipes['grass-to-rope'], 'knownRecipes потерялись после загрузки.');
        assert(hydratedState.craftingState.stationUnlocks.bench, 'stationUnlocks потерялись после загрузки.');
    });

    addTest('7. migration под новую форму сейва', 'Сейв старой версии поднимается в новую без потери инвентаря', () => {
        const legacySnapshot = buildLegacySnapshot();
        legacySnapshot.player.inventory = [
            { id: 'ration', icon: 'SP', label: 'Сухпаёк', quantity: 2 },
            null,
            null,
            null
        ];
        const migratedSnapshot = saveLoad.migrateSnapshot(legacySnapshot);

        assertEqual(migratedSnapshot.saveVersion, stateSchema.SAVE_VERSION, 'Сейв не поднялся до актуальной версии.');
        assertDeepEqual(migratedSnapshot.player.inventory, legacySnapshot.player.inventory, 'Инвентарь изменился при миграции.');
    });

    addTest('7. migration под новую форму сейва', 'Поля knownRecipes, stationUnlocks, resourceNodesState появляются после миграции', () => {
        const legacySnapshot = buildLegacySnapshot({
            knownRecipes: { 'grass-to-rope': { recipeId: 'grass-to-rope' } },
            stationUnlocks: { bench: { stationId: 'bench' } },
            resourceNodesState: { '1,0': { state: 'depleted' } }
        });
        const migratedSnapshot = saveLoad.migrateSnapshot(legacySnapshot);

        assert(migratedSnapshot.craftingState.knownRecipes['grass-to-rope'], 'knownRecipes не перенеслись в craftingState.');
        assert(migratedSnapshot.craftingState.stationUnlocks.bench, 'stationUnlocks не перенеслись в craftingState.');
        assert(migratedSnapshot.craftingState.resourceNodesState['1,0'], 'resourceNodesState не перенеслись в craftingState.');
    });

    addTest('7. migration под новую форму сейва', 'Повторная миграция одного и того же сейва не ломает данные', () => {
        const legacySnapshot = buildLegacySnapshot({
            knownRecipes: { 'grass-to-rope': { recipeId: 'grass-to-rope' } }
        });
        const onceMigrated = saveLoad.migrateSnapshot(legacySnapshot);
        const twiceMigrated = saveLoad.migrateSnapshot(onceMigrated);

        assertDeepEqual(twiceMigrated, onceMigrated, 'Повторная миграция изменила уже мигрированный сейв.');
    });

    addTest('8. event bus для крафта', 'craft:completed эмитится после успешного крафта', () => {
        resetHarness();
        let eventPayload = null;
        gameEvents.on(gameEvents.EVENTS.CRAFT_COMPLETED, (event) => {
            eventPayload = event.payload;
        });

        craftingRuntime.craftRecipeAgainstStock('portable-bridge', {
            stockEntries: [
                craftingRuntime.buildStockEntry('component', 'board', 'Доска', 2),
                craftingRuntime.buildStockEntry('component', 'rope', 'Верёвка', 1),
                craftingRuntime.buildStockEntry('component', 'stoneBlock', 'Каменный блок', 1)
            ],
            availableStations: ['bench']
        });

        assert(eventPayload, 'Событие craft:completed не пришло.');
        assertEqual(eventPayload.recipeId, 'portable-bridge', 'В событии пришёл неверный recipeId.');
    });

    addTest('8. event bus для крафта', 'resource:gathered эмитится после сбора узла', () => {
        resetHarness();
        const clickedRockTile = installGatherTestWorld();
        let eventPayload = null;
        gameEvents.on(gameEvents.EVENTS.RESOURCE_GATHERED, (event) => {
            eventPayload = event.payload;
        });

        const collected = actionUi.tryCollectClickedRock(clickedRockTile);

        assert(collected, 'Сбор ресурса не выполнился.');
        assert(eventPayload, 'Событие resource:gathered не пришло.');
        assertEqual(eventPayload.resourceId, 'stone', 'В событии пришёл неверный resourceId.');
    });

    addTest('8. event bus для крафта', 'UI подписчик обновляется без прямого вызова из runtime', () => {
        resetHarness();
        const uiSubscriber = { updates: 0 };
        gameEvents.on(gameEvents.EVENTS.CRAFT_COMPLETED, () => {
            uiSubscriber.updates += 1;
        });

        craftingRuntime.craftRecipeAgainstStock('portable-bridge', {
            stockEntries: [
                craftingRuntime.buildStockEntry('component', 'board', 'Доска', 2),
                craftingRuntime.buildStockEntry('component', 'rope', 'Верёвка', 1),
                craftingRuntime.buildStockEntry('component', 'stoneBlock', 'Каменный блок', 1)
            ],
            availableStations: ['bench']
        });

        assertEqual(uiSubscriber.updates, 1, 'Подписчик UI не обновился через event bus.');
    });

    addTest('11. compression pipeline', 'soilClod больше не хранит ad-hoc conversion в item catalog', () => {
        assertEqual(itemRegistry.getItemConversionRecipe('soilClod'), null, 'soilClod не должен хранить conversion внутри item catalog.');
    });

    addTest('11. compression pipeline', 'raw_stone и raw_rubble находят единый compression-рецепт 5 к 1', () => {
        const stoneRecipeIds = compressionRuntime.getCompressionRecipesForSourceItem('raw_stone', {
            station: 'hand'
        }).map((recipe) => recipe.recipeId);
        const rubbleRecipeIds = compressionRuntime.getCompressionRecipesForSourceItem('raw_rubble', {
            station: 'hand'
        }).map((recipe) => recipe.recipeId);

        assert(stoneRecipeIds.includes('stone-to-stone-block'), 'Для raw_stone не найден compression-рецепт каменного блока.');
        assert(rubbleRecipeIds.includes('rubble-to-gravel-fill'), 'Для raw_rubble не найден compression-рецепт гравийной засыпки.');
    });

    addTest('11. compression pipeline', 'raw_grass больше не схлопывается в один grassResource, а отдаёт варианты компонента', () => {
        const recipeIds = compressionRuntime.getCompressionRecipesForSourceItem('raw_grass', {
            station: 'hand'
        }).map((recipe) => recipe.recipeId);

        assert(recipeIds.includes('grass-to-healing-base'), 'Для raw_grass не найден рецепт healing base.');
        assert(recipeIds.includes('grass-to-herbal-paste'), 'Для raw_grass не найден рецепт herbal paste.');
        assertEqual(recipeIds.includes('grass-to-rope'), false, 'Верёвка не должна попадать в hand-compression для raw_grass.');
    });

    addTest('11. compression pipeline', 'raw_grass сжимается в healingBase через явный recipeId', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('raw_grass', 5);

        const outcome = compressionRuntime.compressSourceItem('raw_grass', {
            recipeId: 'grass-to-healing-base',
            availableStations: ['hand']
        });

        assert(outcome.success, 'Сжатие raw_grass в healingBase не завершилось успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_grass'), 0, 'Трава не была израсходована полностью.');
        assertEqual(inventoryRuntime.countInventoryItem('healingBase'), 1, 'healingBase не появился после сжатия.');
    });

    addTest('11. compression pipeline', 'grass-to-rope требует bench и не доступен только на hand', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('raw_grass', 10);

        const evaluations = compressionRuntime.evaluateCompressionForSourceItem('raw_grass', {
            availableStations: ['hand']
        });
        const ropeEvaluation = evaluations.find((entry) => entry && entry.recipe && entry.recipe.recipeId === 'grass-to-rope');

        assert(ropeEvaluation, 'Оценка recipe grass-to-rope не найдена.');
        assertEqual(ropeEvaluation.success, false, 'Верёвка не должна быть доступна без bench.');
        assertEqual(ropeEvaluation.reason, 'wrong-station', 'Для grass-to-rope ожидалась ошибка wrong-station.');
    });

    addTest('11. compression pipeline', 'soilClod сжимается через единый pipeline и даёт soilResource', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('soilClod', 5);

        const outcome = compressionRuntime.compressSourceItem('soilClod', {
            availableStations: ['hand']
        });

        assert(outcome.success, 'Сжатие soilClod не завершилось успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('soilClod'), 0, 'Комья земли не были израсходованы полностью.');
        assertEqual(inventoryRuntime.countInventoryItem('soilResource'), 1, 'Результат soilResource не появился после сжатия.');
    });

    function renderResults(results) {
        const groupedResults = new Map();

        results.forEach((result) => {
            groupedResults.set(result.group, [...(groupedResults.get(result.group) || []), result]);
        });

        resultsElement.innerHTML = '';
        [...groupedResults.entries()].forEach(([group, groupResults]) => {
            const groupElement = document.createElement('section');
            groupElement.className = 'group';

            const titleElement = document.createElement('h2');
            titleElement.textContent = group;
            groupElement.appendChild(titleElement);

            groupResults.forEach((result) => {
                const testElement = document.createElement('div');
                testElement.className = `test ${result.status}`;
                testElement.textContent = `${result.status === 'pass' ? 'PASS' : 'FAIL'}  ${result.name}${result.error ? ` — ${result.error}` : ''}`;
                groupElement.appendChild(testElement);
            });

            resultsElement.appendChild(groupElement);
        });
    }

    function runTests() {
        const results = [];

        tests.forEach((testCase) => {
            try {
                resetHarness();
                testCase.fn();
                results.push({
                    group: testCase.group,
                    name: testCase.name,
                    status: 'pass'
                });
            } catch (error) {
                results.push({
                    group: testCase.group,
                    name: testCase.name,
                    status: 'fail',
                    error: error && error.message ? error.message : String(error)
                });
            }
        });

        const passedCount = results.filter((result) => result.status === 'pass').length;
        const failedCount = results.length - passedCount;
        summaryElement.textContent = `Всего: ${results.length}. Пройдено: ${passedCount}. Провалено: ${failedCount}.`;
        renderResults(results);
    }

    runTests();
})();
