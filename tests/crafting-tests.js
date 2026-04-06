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
    const itemEffects = game.systems.itemEffects;
    const rewardScaling = game.systems.rewardScaling;
    const worldSpawnRuntime = game.systems.worldSpawnRuntime;
    const interactionRenderer = game.systems.interactionRenderer;
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

    function cloneValue(value) {
        if (Array.isArray(value)) {
            return value.map(cloneValue);
        }

        if (!value || typeof value !== 'object') {
            return value;
        }

        return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)]));
    }

    function resetHarness() {
        game.state = stateSchema.createInitialState();
        game.state.currentIslandIndex = 1;
        game.state.loadedChunks = {};

        if (gameEvents && typeof gameEvents.clearAll === 'function') {
            gameEvents.clearAll();
        }

        if (bridge) {
            bridge.lastActionMessage = '';
            bridge.renderCallCount = 0;
            bridge.pathCompletionCostCount = 0;
        }

        if (game.systems.ui) {
            game.systems.ui.lastActionMessage = '';
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

    function buildProgression(islandIndex = game.state.currentIslandIndex || 1, extra = {}) {
        return {
            islandIndex,
            label: `Остров ${islandIndex}`,
            outsideDrainMultiplier: 1,
            recoveryMultiplier: 1,
            ...cloneValue(extra)
        };
    }

    function createTileInfo(x, y, tileType, extra = {}) {
        return {
            x,
            y,
            tileType,
            baseTileType: extra.baseTileType || tileType,
            house: extra.house || null,
            interaction: extra.interaction || null,
            travelZoneKey: extra.travelZoneKey || 'none',
            travelWeight: Number.isFinite(extra.travelWeight) ? extra.travelWeight : 1,
            weatherKey: extra.weatherKey || 'clear',
            progression: extra.progression || buildProgression(extra.islandIndex || game.state.currentIslandIndex || 1)
        };
    }

    function installWorld(tileInfos = [], options = {}) {
        const tiles = Object.create(null);
        const chunkStore = Object.create(null);
        const defaultTileType = options.defaultTileType || 'grass';
        const islandIndex = Number.isFinite(options.islandIndex)
            ? options.islandIndex
            : Math.max(1, game.state.currentIslandIndex || 1);
        const defaultProgression = buildProgression(islandIndex);

        (Array.isArray(tileInfos) ? tileInfos : []).forEach((tileInfo) => {
            tiles[`${tileInfo.x},${tileInfo.y}`] = createTileInfo(tileInfo.x, tileInfo.y, tileInfo.tileType || tileInfo.baseTileType || defaultTileType, tileInfo);
        });

        function getTileInfo(x, y) {
            const key = `${x},${y}`;
            if (tiles[key]) {
                return tiles[key];
            }

            const fallback = createTileInfo(x, y, defaultTileType, {
                progression: defaultProgression,
                travelWeight: options.defaultTravelWeight || 1,
                weatherKey: options.weatherKey || 'clear'
            });
            tiles[key] = fallback;
            return fallback;
        }

        game.state.currentIslandIndex = islandIndex;
        game.state.playerPos = options.playerPos || { x: 0, y: 0 };
        game.systems.world = {
            getTileInfo,
            updatePlayerContext(playerPos = game.state.playerPos) {
                game.state.activeTileInfo = getTileInfo(Math.round(playerPos.x), Math.round(playerPos.y));
                return game.state.activeTileInfo;
            },
            getChunkCoordinatesForWorld(x, y) {
                return {
                    chunkX: Math.floor(x / game.config.chunkSize),
                    chunkY: Math.floor(y / game.config.chunkSize)
                };
            },
            getLocalCoordinatesForWorld(x, y) {
                return {
                    localX: ((x % game.config.chunkSize) + game.config.chunkSize) % game.config.chunkSize,
                    localY: ((y % game.config.chunkSize) + game.config.chunkSize) % game.config.chunkSize
                };
            },
            getChunk(chunkX, chunkY, { generateIfMissing = false } = {}) {
                const key = `${chunkX},${chunkY}`;

                if (!chunkStore[key] && generateIfMissing) {
                    chunkStore[key] = {
                        interactions: [],
                        renderCache: null
                    };
                }

                return chunkStore[key] || null;
            }
        };
        game.systems.world.updatePlayerContext(game.state.playerPos);
        return {
            tiles,
            getTileInfo,
            chunkStore
        };
    }

    function buildResourceNodeInteraction(resourceNodeKind, options = {}) {
        const definition = resourceRegistry.getResourceNodeDefinition(resourceNodeKind);
        const x = Number.isFinite(options.x) ? options.x : 1;
        const y = Number.isFinite(options.y) ? options.y : 0;
        const islandIndex = Number.isFinite(options.islandIndex)
            ? options.islandIndex
            : Math.max(1, game.state.currentIslandIndex || 1);

        assert(definition, `Не найден resource node ${resourceNodeKind}.`);

        const interaction = {
            id: options.id || `resource-node:test:${resourceNodeKind}:${x}:${y}`,
            houseId: options.id || `resource-node:test:${resourceNodeKind}:${x}:${y}`,
            chunkX: 0,
            chunkY: 0,
            localX: x,
            localY: y,
            worldX: x,
            worldY: y,
            renderDepth: Number.isFinite(options.renderDepth) ? options.renderDepth : x + y + 0.29,
            placement: 'exterior',
            kind: 'resourceNode',
            label: definition.label,
            expedition: {
                kind: 'resourceNode',
                label: definition.label,
                summary: definition.summary || '',
                resourceId: definition.resourceId,
                resourceNodeKind: definition.id,
                family: definition.family || 'resourceNode',
                islandIndex
            },
            family: 'resourceNode',
            resourceId: definition.resourceId,
            resourceNodeKind: definition.id,
            resourceNodeFamily: definition.family || 'resourceNode',
            renderKind: definition.renderKind || definition.id,
            summary: definition.summary || '',
            islandIndex,
            gatherProfile: definition.gatherProfile ? cloneValue(definition.gatherProfile) : null,
            interactionHint: definition.interactionHint || '',
            durabilityProfile: definition.durabilityProfile ? cloneValue(definition.durabilityProfile) : null,
            respawnPolicy: definition.respawnPolicy ? cloneValue(definition.respawnPolicy) : null
        };

        if (options.stateEntry) {
            game.state.craftingState.resourceNodesState[interaction.id] = cloneValue(options.stateEntry);
        }

        return game.systems.interactions.syncResourceNodeInteractionState(interaction);
    }

    function installResourceNodeWorld(resourceNodeKind, options = {}) {
        const interaction = options.interaction || buildResourceNodeInteraction(resourceNodeKind, {
            x: Number.isFinite(options.x) ? options.x : 1,
            y: Number.isFinite(options.y) ? options.y : 0,
            islandIndex: options.islandIndex
        });
        const islandIndex = Number.isFinite(options.islandIndex)
            ? options.islandIndex
            : interaction.islandIndex;
        const progression = buildProgression(islandIndex);
        const targetTileType = options.targetTileType
            || (resourceRegistry.getResourceNodeDefinition(resourceNodeKind).sourceTileTypes || ['grass'])[0]
            || 'grass';
        const playerTile = createTileInfo(0, 0, options.playerTileType || 'trail', {
            progression,
            weatherKey: options.weatherKey || 'clear',
            travelWeight: Number.isFinite(options.playerTravelWeight) ? options.playerTravelWeight : 1
        });
        const targetTile = createTileInfo(interaction.worldX, interaction.worldY, targetTileType, {
            progression,
            interaction,
            weatherKey: options.weatherKey || 'clear',
            travelWeight: Number.isFinite(options.targetTravelWeight) ? options.targetTravelWeight : 1.2
        });

        installWorld([playerTile, targetTile], {
            islandIndex,
            playerPos: { x: 0, y: 0 },
            defaultTileType: options.defaultTileType || 'grass',
            weatherKey: options.weatherKey || 'clear'
        });

        return {
            interaction,
            targetTile
        };
    }

    function installGatherTestWorld() {
        const { targetTile } = installResourceNodeWorld('stonePile', {
            islandIndex: 8,
            targetTileType: 'rock'
        });
        return targetTile;
    }

    function buildChunkData(fillTileType = 'grass') {
        return Array.from(
            { length: game.config.chunkSize },
            () => Array.from({ length: game.config.chunkSize }, () => fillTileType)
        );
    }

    function buildTravelZones(fillZoneKey = 'none') {
        return Array.from(
            { length: game.config.chunkSize },
            () => Array.from({ length: game.config.chunkSize }, () => fillZoneKey)
        );
    }

    function fillChunkRect(chunkData, xFrom, yFrom, width, height, tileType) {
        for (let y = yFrom; y < yFrom + height; y++) {
            for (let x = xFrom; x < xFrom + width; x++) {
                if (chunkData[y] && typeof chunkData[y][x] === 'string') {
                    chunkData[y][x] = tileType;
                }
            }
        }
    }

    function fillZoneRect(travelZones, xFrom, yFrom, width, height, zoneKey) {
        for (let y = yFrom; y < yFrom + height; y++) {
            for (let x = xFrom; x < xFrom + width; x++) {
                if (travelZones[y] && typeof travelZones[y][x] === 'string') {
                    travelZones[y][x] = zoneKey;
                }
            }
        }
    }

    function buildResourceBiomeChunk() {
        const chunkData = buildChunkData('grass');
        const travelZones = buildTravelZones('none');

        fillChunkRect(chunkData, 2, 2, 4, 4, 'water');
        fillChunkRect(chunkData, 2, 6, 4, 2, 'reeds');
        fillChunkRect(chunkData, 8, 8, 4, 4, 'rock');
        fillChunkRect(chunkData, 13, 8, 4, 4, 'rubble');
        fillChunkRect(chunkData, 4, 10, 5, 3, 'shore');
        fillChunkRect(chunkData, 9, 2, 6, 1, 'trail');
        fillZoneRect(travelZones, 13, 8, 4, 4, 'badSector');

        return {
            chunkData,
            travelZones
        };
    }

    function buildDryChunk(tileType = 'grass') {
        return {
            chunkData: buildChunkData(tileType),
            travelZones: buildTravelZones('none')
        };
    }

    function buildTestHouse(kind, originX, originY) {
        const localCells = [
            { x: originX, y: originY },
            { x: originX + 1, y: originY },
            { x: originX, y: originY + 1 },
            { x: originX + 1, y: originY + 1 }
        ];

        return {
            id: `house:${kind}:${originX}:${originY}`,
            localOriginX: originX,
            localOriginY: originY,
            localCells,
            localCellSet: new Set(localCells.map((cell) => `${cell.x},${cell.y}`)),
            footprint: {
                widthTiles: 2,
                depthTiles: 2
            },
            door: {
                type: 'south',
                localOutside: { x: originX, y: originY + 2 },
                localInside: { x: originX, y: originY + 1 }
            },
            expedition: {
                kind,
                label: kind === 'merchant' ? 'Торговец' : 'Сундук',
                summary: 'Тестовая точка интереса'
            }
        };
    }

    function createChunkInteractionsForTest(options = {}) {
        const source = options.chunkSource || buildResourceBiomeChunk();
        return worldSpawnRuntime.createChunkInteractions(
            0,
            0,
            source.chunkData,
            Array.isArray(options.houses) ? options.houses : [],
            options.random || (() => 0.5),
            {
                travelZones: source.travelZones,
                progression: options.progression || buildProgression(options.islandIndex || game.state.currentIslandIndex || 1),
                chunkRecord: options.chunkRecord || null
            }
        );
    }

    function countNeighbors(chunkData, x, y, predicate, includeDiagonals = true) {
        const directions = includeDiagonals
            ? [
                { dx: 1, dy: 0 },
                { dx: -1, dy: 0 },
                { dx: 0, dy: 1 },
                { dx: 0, dy: -1 },
                { dx: 1, dy: 1 },
                { dx: 1, dy: -1 },
                { dx: -1, dy: 1 },
                { dx: -1, dy: -1 }
            ]
            : [
                { dx: 1, dy: 0 },
                { dx: -1, dy: 0 },
                { dx: 0, dy: 1 },
                { dx: 0, dy: -1 }
            ];

        return directions.reduce((count, direction) => {
            const nextX = x + direction.dx;
            const nextY = y + direction.dy;
            const row = chunkData[nextY];
            const value = row ? row[nextX] : undefined;
            return predicate(value, nextX, nextY) ? count + 1 : count;
        }, 0);
    }

    function createRecordingContext() {
        return {
            ops: [],
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 1,
            font: '',
            textAlign: 'center',
            textBaseline: 'middle',
            save() {
                this.ops.push(['save']);
            },
            restore() {
                this.ops.push(['restore']);
            },
            translate(x, y) {
                this.ops.push(['translate', x, y]);
            },
            beginPath() {
                this.ops.push(['beginPath']);
            },
            moveTo(x, y) {
                this.ops.push(['moveTo', x, y]);
            },
            lineTo(x, y) {
                this.ops.push(['lineTo', x, y]);
            },
            closePath() {
                this.ops.push(['closePath']);
            },
            fill() {
                this.ops.push(['fill']);
            },
            stroke() {
                this.ops.push(['stroke']);
            },
            fillRect(x, y, width, height) {
                this.ops.push(['fillRect', x, y, width, height]);
            },
            arc(x, y, radius, startAngle, endAngle) {
                this.ops.push(['arc', x, y, radius, startAngle, endAngle]);
            },
            ellipse(x, y, radiusX, radiusY) {
                this.ops.push(['ellipse', x, y, radiusX, radiusY]);
            },
            quadraticCurveTo(controlX, controlY, x, y) {
                this.ops.push(['quadraticCurveTo', controlX, controlY, x, y]);
            },
            fillText(text, x, y) {
                this.ops.push(['fillText', text, x, y]);
            }
        };
    }

    function installInteractionRenderChunk(interactions = []) {
        game.state.loadedChunks = {
            '0,0': {
                interactions: interactions.map((interaction) => cloneValue(interaction))
            }
        };
    }

    function withMockedRandom(sequence, fn) {
        const originalRandom = Math.random;
        let index = 0;
        const values = Array.isArray(sequence) ? sequence.slice() : [sequence];

        Math.random = () => {
            const safeIndex = Math.min(index, values.length - 1);
            index += 1;
            return Number.isFinite(values[safeIndex]) ? values[safeIndex] : 0;
        };

        try {
            return fn();
        } finally {
            Math.random = originalRandom;
        }
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

    addTest('9. raw_* ресурсы', 'Сбор травы даёт raw_grass, а не готовый компонент', () => {
        resetHarness();
        installResourceNodeWorld('grassBush', {
            islandIndex: 3,
            targetTileType: 'grass'
        });

        actionUi.handleUseAction();

        assertEqual(inventoryRuntime.countInventoryItem('raw_grass'), 1, 'Сбор травы должен давать raw_grass.');
        assertEqual(inventoryRuntime.countInventoryItem('healingBase'), 0, 'Готовый компонент не должен появляться сразу при сборе травы.');
        assertEqual(inventoryRuntime.countInventoryItem('rope'), 0, 'Верёвка не должна выпадать напрямую при сборе травы.');
    });

    addTest('9. raw_* ресурсы', 'Сбор дерева даёт raw_wood, а не доски', () => {
        resetHarness();
        installResourceNodeWorld('woodTree', {
            islandIndex: 12,
            targetTileType: 'grass'
        });

        actionUi.handleUseAction();

        assertEqual(inventoryRuntime.countInventoryItem('raw_wood'), 1, 'Сбор дерева должен давать raw_wood.');
        assertEqual(inventoryRuntime.countInventoryItem('board'), 0, 'Доска не должна появляться напрямую при сборе дерева.');
    });

    addTest('9. raw_* ресурсы', 'Старые места кода не подменяют raw-resource на старые item ids', () => {
        const grassDefinition = resourceRegistry.getBaseResourceDefinition('grass');
        const stoneDefinition = resourceRegistry.getBaseResourceDefinition('stone');
        const rubbleDefinition = resourceRegistry.getBaseResourceDefinition('rubble');

        assertDeepEqual(grassDefinition.currentInventoryItemIds, ['raw_grass'], 'Grass должен ссылаться только на raw_grass.');
        assertDeepEqual(stoneDefinition.currentInventoryItemIds, ['raw_stone'], 'Stone должен ссылаться только на raw_stone.');
        assertDeepEqual(rubbleDefinition.currentInventoryItemIds, ['raw_rubble'], 'Rubble должен ссылаться только на raw_rubble.');
        assertEqual(itemRegistry.getItemDefinition('grassResource'), null, 'Легаси grassResource больше не должен быть item definition.');
        assertEqual(itemRegistry.getItemDefinition('stoneResource'), null, 'Легаси stoneResource больше не должен быть item definition.');
        assertEqual(itemRegistry.getItemDefinition('rubbleChunk'), null, 'Легаси rubbleChunk больше не должен быть item definition.');
    });

    addTest('10. семейство сырья травы', 'Оба источника конвертируются в общий pipeline без рассинхрона', () => {
        resetHarness();
        installResourceNodeWorld('grassBush', {
            islandIndex: 4,
            targetTileType: 'grass'
        });

        actionUi.handleUseAction();
        installResourceNodeWorld('grassBush', {
            islandIndex: 4,
            targetTileType: 'reeds'
        });
        actionUi.handleUseAction();

        const rawGrassStacks = inventoryRuntime.getInventory().filter((item) => item && item.id === 'raw_grass');

        assertEqual(inventoryRuntime.countInventoryItem('raw_grass'), 2, 'Оба источника должны сходиться в raw_grass.');
        assertEqual(rawGrassStacks.length, 1, 'Оба подтипа должны стекаться в один стек raw_grass.');
        assert(!rawGrassStacks[0].resourceSubtypeId, 'При смешивании подтипов не должно оставаться рассинхроненного subtypeId.');
    });

    addTest('10. семейство сырья травы', 'Старые предметы мигрируются, а legacy ids не остаются активными', () => {
        const legacySnapshot = buildLegacySnapshot({
            player: {
                ...buildLegacySnapshot().player,
                inventory: [
                    { id: 'lowlandGrass', icon: 'TR', label: 'Низинная трава', quantity: 1 },
                    { id: 'fieldGrass', icon: 'TR', label: 'Полевая трава', quantity: 1 },
                    null,
                    null
                ]
            }
        });
        const migratedSnapshot = saveLoad.migrateSnapshot(legacySnapshot);
        const migratedItems = (migratedSnapshot.player.inventory || []).filter(Boolean);

        assertEqual(migratedItems.length, 1, 'Легаси трава должна мигрировать в один стек.');
        assertEqual(migratedItems[0].id, 'raw_grass', 'Легаси трава должна мигрировать в raw_grass.');
        assertEqual(migratedItems[0].quantity, 2, 'Количество raw_grass после миграции рассчитано неверно.');
        assertEqual(itemRegistry.getItemDefinition('lowlandGrass'), null, 'lowlandGrass не должен оставаться активным item id.');
        assertEqual(itemRegistry.getItemDefinition('fieldGrass'), null, 'fieldGrass не должен оставаться активным item id.');
    });

    addTest('10. семейство сырья травы', 'Рецепты используют новый общий тип, а не старые отдельные ids', () => {
        const recipeDefinitions = recipeRegistry.getRecipeDefinitions();
        const legacyIds = new Set(['lowlandGrass', 'fieldGrass', 'grassResource']);
        const grassRecipes = recipeDefinitions.filter((recipe) => ['grass-to-healing-base', 'grass-to-herbal-paste', 'grass-to-rope'].includes(recipe.recipeId));

        recipeDefinitions.forEach((recipe) => {
            recipe.ingredients.forEach((ingredient) => {
                assert(!legacyIds.has(ingredient.id), `Рецепт ${recipe.recipeId} всё ещё использует legacy id ${ingredient.id}.`);
            });

            if (recipe.result) {
                assert(!legacyIds.has(recipe.result.id), `Рецепт ${recipe.recipeId} всё ещё выдаёт legacy id ${recipe.result.id}.`);
            }
        });

        assert(grassRecipes.every((recipe) => recipe.ingredients.some((ingredient) => ingredient.kind === 'resource' && ingredient.id === 'grass')), 'Травяные рецепты должны использовать общий ресурс grass.');
    });

    addTest('11. compression pipeline', 'Ровно 5 единиц сырья дают 1 компонент', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('raw_stone', 5);

        const outcome = compressionRuntime.compressSourceItem('raw_stone', {
            availableStations: ['hand']
        });

        assert(outcome.success, 'Сжатие 5 raw_stone должно завершиться успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_stone'), 0, 'После сжатия не должно оставаться raw_stone.');
        assertEqual(inventoryRuntime.countInventoryItem('stoneBlock'), 1, 'Из 5 raw_stone должен получаться 1 stoneBlock.');
    });

    addTest('11. compression pipeline', '4 единицы не позволяют сделать конверсию', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('raw_rubble', 4);

        const outcome = compressionRuntime.compressSourceItem('raw_rubble', {
            availableStations: ['hand']
        });

        assertEqual(outcome.success, false, '4 raw_rubble не должны сжиматься успешно.');
        assertEqual(outcome.reason, 'missing-ingredients', 'Для 4 raw_rubble ожидалась нехватка ингредиентов.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_rubble'), 4, 'Сырьё не должно расходоваться при неуспешной конверсии.');
        assertEqual(inventoryRuntime.countInventoryItem('gravelFill'), 0, 'Компонент не должен появляться из 4 единиц сырья.');
    });

    addTest('11. compression pipeline', '10 единиц дают 2 компонента без остаточной ошибки', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('raw_stone', 10);

        const firstOutcome = compressionRuntime.compressSourceItem('raw_stone', {
            availableStations: ['hand']
        });
        const secondOutcome = compressionRuntime.compressSourceItem('raw_stone', {
            availableStations: ['hand']
        });

        assert(firstOutcome.success && secondOutcome.success, 'Два последовательных сжатия 10 raw_stone должны быть успешными.');
        assertEqual(inventoryRuntime.countInventoryItem('stoneBlock'), 2, 'Из 10 raw_stone должно получаться 2 stoneBlock.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_stone'), 0, 'После двух сжатий не должно оставаться сырья.');
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

    addTest('12. resourceNode interactions', 'В мире появляются новые interaction kinds для ресурсов', () => {
        resetHarness();
        const interactions = createChunkInteractionsForTest({
            islandIndex: 8,
            chunkSource: buildResourceBiomeChunk()
        });
        const resourceNodes = interactions.filter((interaction) => interaction.kind === 'resourceNode');
        const nodeKinds = resourceNodes.map((interaction) => interaction.resourceNodeKind);

        assert(resourceNodes.length > 0, 'В чанке не появились resourceNode interactions.');
        assert(nodeKinds.includes('stonePile'), 'Не появился stonePile.');
        assert(nodeKinds.includes('rubbleScree'), 'Не появился rubbleScree.');
        assert(nodeKinds.includes('woodTree'), 'Не появился woodTree.');
        assert(nodeKinds.includes('waterSource'), 'Не появился waterSource.');
        assert(nodeKinds.includes('fishingSpot'), 'Не появился fishingSpot.');
    });

    addTest('12. resourceNode interactions', 'Игрок может кликнуть по ресурсу и получить корректный action hint', () => {
        resetHarness();
        installResourceNodeWorld('stonePile', {
            islandIndex: 8,
            targetTileType: 'rock'
        });

        const hint = actionUi.getDefaultActionHint(null, game.state.activeTileInfo);

        assert(/каменная куча/i.test(hint), 'В action hint не показан label ресурса.');
        assert(/цена сбора/i.test(hint), 'В action hint не показана цена сбора.');
        assert(/использовать|кликни/i.test(hint), 'В action hint нет инструкции по взаимодействию.');
    });

    addTest('12. resourceNode interactions', 'Resource nodes не конфликтуют с chest/merchant interactions на одной клетке', () => {
        resetHarness();
        const houses = [
            buildTestHouse('merchant', 9, 12),
            buildTestHouse('chest', 3, 13)
        ];
        const interactions = createChunkInteractionsForTest({
            islandIndex: 8,
            chunkSource: buildResourceBiomeChunk(),
            houses
        });
        const interactionKeys = interactions.map((interaction) => `${interaction.localX},${interaction.localY}`);

        assert(interactions.some((interaction) => interaction.kind === 'merchant'), 'Тестовый merchant interaction не появился.');
        assert(interactions.some((interaction) => interaction.kind === 'chest'), 'Тестовый chest interaction не появился.');
        assert(interactions.some((interaction) => interaction.kind === 'resourceNode'), 'В чанке нет resource nodes.');
        assertEqual(new Set(interactionKeys).size, interactionKeys.length, 'Interaction-слой дал конфликт нескольких объектов на одной клетке.');
    });

    addTest('13. визуальные типы resource nodes', 'У каждого resource node есть видимый renderKind и рендер не падает', () => {
        resetHarness();
        const definitions = resourceRegistry.getResourceNodeDefinitions();

        definitions.forEach((definition, index) => {
            const interaction = buildResourceNodeInteraction(definition.id, {
                x: index + 1,
                y: 0,
                islandIndex: 10
            });
            const context = createRecordingContext();
            game.ctx = context;
            installInteractionRenderChunk([interaction]);

            interactionRenderer.drawInteractions(0, 0);

            assert(definition.renderKind, `У ${definition.id} не задан renderKind.`);
            assert(context.ops.some((operation) => operation[0] === 'fill' || operation[0] === 'stroke'), `Рендер ${definition.id} не выполнил ни одной видимой операции.`);
        });
    });

    addTest('13. визуальные типы resource nodes', 'Узел после истощения меняет визуальное состояние', () => {
        resetHarness();
        const freshInteraction = buildResourceNodeInteraction('stonePile', {
            id: 'render:fresh:stone',
            islandIndex: 8
        });
        const depletedInteraction = buildResourceNodeInteraction('stonePile', {
            id: 'render:depleted:stone',
            islandIndex: 8,
            stateEntry: {
                nodeState: 'depleted',
                durabilityRemaining: 0,
                regenerationReadyAtAdvance: null
            }
        });
        const freshContext = createRecordingContext();
        const depletedContext = createRecordingContext();

        game.ctx = freshContext;
        installInteractionRenderChunk([freshInteraction]);
        interactionRenderer.drawInteractions(0, 0);

        game.ctx = depletedContext;
        installInteractionRenderChunk([depletedInteraction]);
        interactionRenderer.drawInteractions(0, 0);

        const freshStrokeCount = freshContext.ops.filter((operation) => operation[0] === 'stroke').length;
        const depletedStrokeCount = depletedContext.ops.filter((operation) => operation[0] === 'stroke').length;

        assert(depletedStrokeCount > freshStrokeCount, 'Истощённый узел не получил отдельный визуальный слой.');
    });

    addTest('13. визуальные типы resource nodes', 'Рендер не ломает depth sorting сцены', () => {
        resetHarness();
        const farInteraction = buildResourceNodeInteraction('woodTree', {
            id: 'render:far',
            x: 9,
            y: 0,
            islandIndex: 12,
            renderDepth: 20
        });
        const nearInteraction = buildResourceNodeInteraction('stonePile', {
            id: 'render:near',
            x: 1,
            y: 0,
            islandIndex: 8,
            renderDepth: 5
        });
        const context = createRecordingContext();

        game.ctx = context;
        installInteractionRenderChunk([farInteraction, nearInteraction]);
        interactionRenderer.drawInteractions(0, 0);

        const translateOps = context.ops.filter((operation) => operation[0] === 'translate');

        assert(translateOps.length >= 2, 'Рендер не выполнил translate-операции для interactions.');
        assertEqual(translateOps[0][1], 1, 'Первым должен рисоваться interaction с меньшим renderDepth.');
    });

    addTest('14. состояния resource node', 'Узел проходит путь fresh -> used/depleted', () => {
        resetHarness();
        const grassBush = buildResourceNodeInteraction('grassBush', {
            id: 'state:grassBush',
            islandIndex: 3
        });
        const stonePile = buildResourceNodeInteraction('stonePile', {
            id: 'state:stonePile',
            islandIndex: 8
        });

        assertEqual(grassBush.nodeState, 'fresh', 'Grass bush должен начинаться в fresh.');
        assertEqual(stonePile.nodeState, 'fresh', 'Stone pile должен начинаться в fresh.');
        assertEqual(game.systems.interactions.consumeResourceNodeInteraction(grassBush).nodeState, 'used', 'После первого сбора grass bush должен стать used.');
        assertEqual(game.systems.interactions.consumeResourceNodeInteraction(stonePile).nodeState, 'depleted', 'Stone pile после сбора должен стать depleted.');
    });

    addTest('14. состояния resource node', 'Истощённый узел не даёт ресурс повторно', () => {
        resetHarness();
        const { targetTile } = installResourceNodeWorld('stonePile', {
            islandIndex: 8,
            targetTileType: 'rock'
        });

        assert(actionUi.tryCollectClickedRock(targetTile), 'Первый сбор stonePile не выполнился.');
        const collectedOnce = inventoryRuntime.countInventoryItem('raw_stone');
        actionUi.tryCollectClickedRock(targetTile);

        assertEqual(inventoryRuntime.countInventoryItem('raw_stone'), collectedOnce, 'Истощённый узел не должен выдавать ресурс повторно.');
        assert(/исчерпан|нельзя/i.test(bridge.lastActionMessage), 'После повторного сбора игрок должен получить сообщение о недоступности узла.');
    });

    addTest('14. состояния resource node', 'После regen policy узел возвращается в валидное состояние', () => {
        resetHarness();
        const grassBush = buildResourceNodeInteraction('grassBush', {
            id: 'state:regen:bush',
            islandIndex: 3
        });

        game.systems.interactions.consumeResourceNodeInteraction(grassBush);
        const regeneratingState = game.systems.interactions.consumeResourceNodeInteraction(grassBush);

        assertEqual(regeneratingState.nodeState, 'regenerating', 'После исчерпания grass bush должен перейти в regenerating.');

        game.state.timeOfDayAdvancesElapsed = regeneratingState.regenerationReadyAtAdvance;
        const refreshed = game.systems.interactions.syncResourceNodeInteractionState(grassBush);

        assertEqual(refreshed.nodeState, 'fresh', 'После времени регенерации узел должен вернуться в fresh.');
        assertEqual(refreshed.durabilityRemaining, refreshed.durabilityMax, 'После регенерации durability должна восстановиться полностью.');
    });

    addTest('15. respawn policy', 'Одноразовый узел не появляется повторно в том же забеге', () => {
        resetHarness();
        const stonePile = buildResourceNodeInteraction('stonePile', {
            id: 'respawn:single-use',
            islandIndex: 8
        });

        game.systems.interactions.consumeResourceNodeInteraction(stonePile);
        const synced = game.systems.interactions.syncResourceNodeInteractionState(stonePile);
        const repeatedConsume = game.systems.interactions.consumeResourceNodeInteraction(stonePile);

        assertEqual(synced.nodeState, 'depleted', 'Одноразовый узел должен остаться depleted в текущем забеге.');
        assertEqual(repeatedConsume.nodeState, 'depleted', 'Повторное потребление одноразового узла не должно оживлять его.');
    });

    addTest('15. respawn policy', 'Regenerating узел восстанавливается по заданному правилу', () => {
        resetHarness();
        const grassBush = buildResourceNodeInteraction('grassBush', {
            id: 'respawn:regenerating',
            islandIndex: 3
        });

        game.systems.interactions.consumeResourceNodeInteraction(grassBush);
        const secondState = game.systems.interactions.consumeResourceNodeInteraction(grassBush);

        assertEqual(secondState.nodeState, 'regenerating', 'Grass bush должен перейти в regenerating.');

        game.state.timeOfDayAdvancesElapsed = secondState.regenerationReadyAtAdvance;
        const restoredState = game.systems.interactions.syncResourceNodeInteractionState(grassBush);

        assertEqual(restoredState.nodeState, 'fresh', 'После достижения regenerationReadyAtAdvance узел должен стать fresh.');
    });

    addTest('15. respawn policy', 'При новом забеге состояние узлов корректно сохраняется в сейве и сбрасывается новым run', () => {
        resetHarness();
        const grassBush = buildResourceNodeInteraction('grassBush', {
            id: 'respawn:save-and-reset',
            islandIndex: 3
        });

        game.systems.interactions.consumeResourceNodeInteraction(grassBush);
        const snapshot = saveLoad.buildSaveSnapshot(game.state);
        const hydratedState = saveLoad.hydrateStateFromSnapshot(snapshot);

        assert(hydratedState.craftingState.resourceNodesState[grassBush.id], 'Состояние узла должно сохраняться в сейве.');

        resetHarness();
        const newRunGrassBush = buildResourceNodeInteraction('grassBush', {
            id: 'respawn:save-and-reset',
            islandIndex: 3
        });

        assertEqual(newRunGrassBush.nodeState, 'fresh', 'Новый забег должен стартовать с fresh-состоянием узла.');
    });

    addTest('16. биом и топология resource nodes', 'Рыбные узлы спавнятся у воды, а не в сухой зоне', () => {
        resetHarness();
        const wetInteractions = createChunkInteractionsForTest({
            islandIndex: 8,
            chunkSource: buildResourceBiomeChunk()
        });
        const dryInteractions = createChunkInteractionsForTest({
            islandIndex: 8,
            chunkSource: buildDryChunk('grass')
        });

        assert(wetInteractions.some((interaction) => interaction.resourceNodeKind === 'fishingSpot'), 'У воды должен появляться fishingSpot.');
        assert(!dryInteractions.some((interaction) => interaction.resourceNodeKind === 'fishingSpot'), 'В сухой зоне fishingSpot появляться не должен.');
    });

    addTest('16. биом и топология resource nodes', 'Трава не спавнится на неподходящих тайлах', () => {
        resetHarness();
        const rockyChunk = buildDryChunk('rock');
        const interactions = createChunkInteractionsForTest({
            islandIndex: 6,
            chunkSource: rockyChunk
        });

        assert(!interactions.some((interaction) => interaction.resourceNodeKind === 'grassBush'), 'Grass bush не должен появляться на rock-only чанке.');
    });

    addTest('16. биом и топология resource nodes', 'Дерево и щебень obey biome rules при генерации 100+ чанков', () => {
        resetHarness();
        let woodCount = 0;
        let rubbleCount = 0;

        for (let index = 0; index < 120; index++) {
            const source = buildResourceBiomeChunk();
            const offset = index % 4;

            fillChunkRect(source.chunkData, 5 + offset, 12, 3, 2, 'rubble');
            fillZoneRect(source.travelZones, 5 + offset, 12, 3, 2, 'badSector');

            const interactions = createChunkInteractionsForTest({
                islandIndex: 10,
                chunkSource: source,
                random: () => (index % 7) / 10
            });

            interactions
                .filter((interaction) => interaction.kind === 'resourceNode')
                .forEach((interaction) => {
                    const tileType = source.chunkData[interaction.localY][interaction.localX];
                    const travelZoneKey = source.travelZones[interaction.localY][interaction.localX];
                    const travelBand = travelZoneKey === 'badSector'
                        ? 'hazard'
                        : game.systems.content.getTileRouteBand(tileType);

                    if (interaction.resourceNodeKind === 'woodTree') {
                        woodCount += 1;
                        assert(['grass', 'shore', 'reeds'].includes(tileType), `Wood tree появился на неподходящем тайле ${tileType}.`);
                        assert(['normal', 'rough'].includes(travelBand), `Wood tree появился в неподходящем band ${travelBand}.`);
                    }

                    if (interaction.resourceNodeKind === 'rubbleScree') {
                        rubbleCount += 1;
                        assert(tileType === 'rubble' || travelZoneKey === 'badSector', 'Rubble scree должен быть привязан к badSector или rubble.');
                        assert(
                            countNeighbors(
                                source.chunkData,
                                interaction.localX,
                                interaction.localY,
                                (candidate) => candidate === 'rubble' || candidate === 'rock',
                                true
                            ) >= 1,
                            'Rubble scree должен иметь рядом rubble/rock топологию.'
                        );
                    }
                });
        }

        assert(woodCount > 0, 'За 120 чанков не сгенерировалось ни одного woodTree.');
        assert(rubbleCount > 0, 'За 120 чанков не сгенерировалось ни одного rubbleScree.');
    });

    addTest('17. стоимость и время сбора', 'Сбор снижает нужный стат и тратит tempo времени', () => {
        resetHarness();
        const { targetTile } = installResourceNodeWorld('stonePile', {
            islandIndex: 8,
            targetTileType: 'rock'
        });
        const beforeStats = cloneValue(game.state.survivalStats);
        const beforeSteps = game.state.stepsSinceTimeOfDayChange;

        actionUi.tryCollectClickedRock(targetTile);

        assert(game.state.survivalStats.energy < beforeStats.energy, 'Сбор должен снижать энергию.');
        assert(game.state.survivalStats.hunger < beforeStats.hunger, 'Сбор должен снижать голод.');
        assert(game.state.survivalStats.cold < beforeStats.cold, 'Сбор должен снижать холод вне дома.');
        assert(game.state.stepsSinceTimeOfDayChange > beforeSteps, 'Сбор должен тратить tempo времени.');
    });

    addTest('17. стоимость и время сбора', 'Почти исчерпанное время добивает сбором до новой смены фазы, а не остаётся бесплатным', () => {
        resetHarness();
        game.state.stepsSinceTimeOfDayChange = 29;
        installResourceNodeWorld('grassBush', {
            islandIndex: 3,
            targetTileType: 'grass'
        });

        actionUi.handleUseAction();

        assertEqual(game.state.timeOfDayAdvancesElapsed, 1, 'Сбор должен продвигать время суток при исчерпании tempo-буфера.');
        assert(/прошло время/i.test(bridge.lastActionMessage), 'Игрок должен видеть, что сбор сдвинул фазу времени.');
    });

    addTest('17. стоимость и время сбора', 'UI показывает цену сбора до действия', () => {
        resetHarness();
        installResourceNodeWorld('woodTree', {
            islandIndex: 10,
            targetTileType: 'grass'
        });

        const hint = actionUi.getDefaultActionHint(null, game.state.activeTileInfo);

        assert(/цена сбора/i.test(hint), 'В хинте не показана цена сбора.');
        assert(/x1\.55|x1\.5|шага маршрута/i.test(hint), 'В хинте не показана route/time стоимость сбора.');
    });

    addTest('18. риск позднего сбора', 'На поздних островах опасный сбор иногда даёт штраф', () => {
        resetHarness();
        installResourceNodeWorld('woodTree', {
            islandIndex: 24,
            targetTileType: 'grass'
        });
        let gatheredEvent = null;
        gameEvents.on(gameEvents.EVENTS.RESOURCE_GATHERED, (event) => {
            gatheredEvent = event.payload;
        });

        withMockedRandom([0, 0], () => {
            actionUi.handleUseAction();
        });

        assert(gatheredEvent && gatheredEvent.gatherRisk, 'На позднем острове должен сработать gather risk.');
        assert(/риск позднего сбора/i.test(bridge.lastActionMessage), 'Игрок должен увидеть сообщение о риске позднего сбора.');
    });

    addTest('18. риск позднего сбора', 'На ранних островах этот штраф не срабатывает, если не должен', () => {
        resetHarness();
        installResourceNodeWorld('woodTree', {
            islandIndex: 10,
            targetTileType: 'grass'
        });
        let gatheredEvent = null;
        gameEvents.on(gameEvents.EVENTS.RESOURCE_GATHERED, (event) => {
            gatheredEvent = event.payload;
        });

        withMockedRandom([0, 0], () => {
            actionUi.handleUseAction();
        });

        assert(gatheredEvent, 'Событие сбора должно прийти и на раннем острове.');
        assertEqual(gatheredEvent.gatherRisk, null, 'На раннем острове gather risk не должен срабатывать.');
    });

    addTest('18. риск позднего сбора', 'Штрафы корректно масштабируются по tier и острову', () => {
        resetHarness();
        let baselineChance = 0;
        let scaledChance = 0;

        installResourceNodeWorld('woodTree', {
            islandIndex: 19,
            targetTileType: 'grass',
            weatherKey: 'clear'
        });
        gameEvents.on(gameEvents.EVENTS.RESOURCE_GATHERED, (event) => {
            baselineChance = event.payload && event.payload.gatherRisk ? event.payload.gatherRisk.chance : 0;
        });

        withMockedRandom([0, 0], () => {
            actionUi.handleUseAction();
        });

        resetHarness();
        installResourceNodeWorld('woodTree', {
            islandIndex: 24,
            targetTileType: 'grass',
            weatherKey: 'storm'
        });
        rewardScaling.addIslandPressureSteps(game.state.activeTileInfo, 14);
        gameEvents.on(gameEvents.EVENTS.RESOURCE_GATHERED, (event) => {
            scaledChance = event.payload && event.payload.gatherRisk ? event.payload.gatherRisk.chance : 0;
        });

        withMockedRandom([0, 0], () => {
            actionUi.handleUseAction();
        });

        assert(scaledChance > baselineChance, 'Шанс позднего штрафа должен расти с островом, pressure tier и плохой погодой.');
    });

    addTest('21. fill_flask у water-source', 'Наполнение фляги недоступно без water-source даже рядом с колодцем', () => {
        resetHarness();
        installWorld([
            createTileInfo(0, 0, 'trail', {
                progression: buildProgression(4),
                interaction: {
                    id: 'well:test',
                    kind: 'well',
                    label: 'Тестовый колодец',
                    expedition: {
                        kind: 'well',
                        label: 'Тестовый колодец',
                        summary: 'Колодец с чистой водой.'
                    }
                }
            })
        ], {
            islandIndex: 4,
            playerPos: { x: 0, y: 0 },
            defaultTileType: 'trail'
        });
        game.state.activeInteraction = game.state.activeTileInfo.interaction;
        inventoryRuntime.addInventoryItem('flask_empty', 1);

        const flaskIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'flask_empty');
        const flask = flaskIndex >= 0 ? inventoryRuntime.getInventory()[flaskIndex] : null;
        game.state.selectedInventorySlot = flaskIndex;
        const recipeEvaluation = craftingRuntime.evaluateRecipeAgainstInventory('fill-water-flask', {
            availableStations: ['hand'],
            scanNearbyEnvironment: true
        });
        const defaultHint = actionUi.getDefaultActionHint(game.state.activeInteraction, game.state.activeTileInfo);

        assert(flask, 'В тестовом инвентаре не появилась пустая фляга.');
        assertEqual(recipeEvaluation.success, false, 'Без water-source рецепт наполнения не должен быть доступен.');
        assertEqual(recipeEvaluation.reason, 'missing-environment', 'Без water-source ожидалась ошибка missing-environment.');
        assertEqual(itemEffects.canUseInventoryItem(flask), false, 'Пустая фляга не должна активироваться у одного только колодца.');
        assert(!/набрать/i.test(defaultHint), 'UI не должен обещать набор воды у колодца.');
    });

    addTest('21. fill_flask у water-source', 'Наполнение фляги работает рядом с water-source и даёт сырую воду', () => {
        resetHarness();
        installResourceNodeWorld('waterSource', {
            islandIndex: 4,
            targetTileType: 'shore'
        });
        inventoryRuntime.addInventoryItem('flask_empty', 1);

        const flaskIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'flask_empty');
        const flask = flaskIndex >= 0 ? inventoryRuntime.getInventory()[flaskIndex] : null;
        game.state.selectedInventorySlot = flaskIndex;
        const recipeEvaluation = craftingRuntime.evaluateRecipeAgainstInventory('fill-water-flask', {
            availableStations: ['hand'],
            scanNearbyEnvironment: true
        });
        const canUseBeforeFill = itemEffects.canUseInventoryItem(flask);
        const outcome = itemEffects.useInventoryItem(flask);

        assert(recipeEvaluation.success, 'Рядом с water-source рецепт наполнения должен быть доступен.');
        assertEqual(canUseBeforeFill, true, 'Пустая фляга должна активироваться рядом с water-source.');
        assert(outcome && outcome.success, 'Использование пустой фляги рядом с water-source должно быть успешным.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_empty'), 0, 'Пустая фляга должна перейти в наполненное состояние.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_water_dirty'), 1, 'У water-source должна получаться именно фляга сырой воды.');
    });

    addTest('22. boil_water на camp', 'Рецепт кипячения воды живёт на лагере и требует топливную связку', () => {
        const recipe = recipeRegistry.getRecipeDefinition('boil-water');

        assert(recipe, 'Рецепт boil-water должен существовать.');
        assertEqual(recipe.station, 'camp', 'Варка воды должна выполняться только на лагере.');
        assert(Array.isArray(recipe.ingredients) && recipe.ingredients.some((ingredient) => ingredient.id === 'waterFlaskDirty'), 'Рецепт должен требовать сырую воду во фляге.');
        assert(Array.isArray(recipe.ingredients) && recipe.ingredients.some((ingredient) => ingredient.id === 'fuelBundle'), 'Рецепт должен требовать топливную связку.');
        assert(recipe.result && recipe.result.id === 'waterFlaskFull', 'Результатом кипячения должна быть чистая вода во фляге.');
    });

    addTest('22. boil_water на camp', 'На лагере грязная вода кипятится в чистую и сжигает fuel bundle', () => {
        game.state.activeHouse = {
            id: 'shelter:test',
            expedition: {
                kind: 'shelter',
                label: 'Тестовый лагерь',
                locationLabel: 'Тестовый лагерь'
            }
        };
        inventoryRuntime.addInventoryItem('flask_water_dirty', 1);
        inventoryRuntime.addInventoryItem('fuelBundle', 1);

        const evaluation = craftingRuntime.evaluateRecipeAgainstInventory('boil-water');
        const outcome = craftingRuntime.craftRecipeAgainstInventory('boil-water');

        assert(evaluation.success, 'На лагере с сырой водой и топливом рецепт должен быть доступен.');
        assert(outcome && outcome.success, 'Варка воды на лагере должна завершаться успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_water_dirty'), 0, 'Сырая вода должна быть израсходована.');
        assertEqual(inventoryRuntime.countInventoryItem('fuelBundle'), 0, 'Топливная связка должна сгорать при кипячении.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_water_full'), 1, 'После варки должна появляться кипячёная вода.');
    });

    addTest('22. boil_water на camp', 'Без лагеря или без топлива варка воды недоступна', () => {
        inventoryRuntime.addInventoryItem('flask_water_dirty', 1);

        const noCampEvaluation = craftingRuntime.evaluateRecipeAgainstInventory('boil-water');
        assertEqual(noCampEvaluation.success, false, 'Без лагеря рецепт не должен быть доступен.');
        assertEqual(noCampEvaluation.reason, 'wrong-station', 'Без лагеря должна возвращаться ошибка станции.');

        game.state.activeHouse = {
            id: 'shelter:test',
            expedition: {
                kind: 'shelter',
                label: 'Тестовый лагерь',
                locationLabel: 'Тестовый лагерь'
            }
        };

        const noFuelEvaluation = craftingRuntime.evaluateRecipeAgainstInventory('boil-water');
        assertEqual(noFuelEvaluation.success, false, 'Без топлива рецепт не должен быть доступен даже в лагере.');
        assertEqual(noFuelEvaluation.reason, 'missing-ingredients', 'Без топлива должна возвращаться ошибка missing-ingredients.');
        assert(noFuelEvaluation.missingIngredients.some((ingredient) => ingredient.id === 'fuelBundle'), 'В списке недостающих ингредиентов должна быть топливная связка.');
    });

    addTest('23. full_flask в рецептах', 'Часть лагерных рецептов использует именно полную флягу', () => {
        const recipeIds = ['prepare-alchemy-water', 'hearty-ration', 'strong-broth'];

        recipeIds.forEach((recipeId) => {
            const recipe = recipeRegistry.getRecipeDefinition(recipeId);
            assert(recipe, `Не найден рецепт ${recipeId}.`);
            assert(
                Array.isArray(recipe.ingredients) && recipe.ingredients.some((ingredient) => ingredient.kind === 'itemState' && ingredient.id === 'waterFlaskFull'),
                `Рецепт ${recipeId} должен требовать именно waterFlaskFull.`
            );
        });
    });

    addTest('23. full_flask в рецептах', 'Крафт с полной флягой возвращает пустую флягу после рецепта', () => {
        game.state.activeHouse = {
            id: 'shelter:test',
            expedition: {
                kind: 'shelter',
                label: 'Тестовый лагерь',
                locationLabel: 'Тестовый лагерь'
            }
        };
        inventoryRuntime.addInventoryItem('flask_water_full', 1);
        inventoryRuntime.addInventoryItem('fishMeat', 1);
        inventoryRuntime.addInventoryItem('fuelBundle', 1);

        const outcome = craftingRuntime.craftRecipeAgainstInventory('hearty-ration');

        assert(outcome && outcome.success, 'Лагерный пищевой рецепт с полной флягой должен крафтиться успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_water_full'), 0, 'Полная фляга должна израсходоваться рецептом.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_empty'), 1, 'После рецепта должна вернуться пустая фляга.');
        assertEqual(inventoryRuntime.countInventoryItem('heartyRation'), 1, 'Игрок должен получить итоговый предмет рецепта.');
        assert(Array.isArray(outcome.returnedContainers) && outcome.returnedContainers.some((entry) => entry.itemId === 'flask_empty'), 'Крафт должен явно вернуть empty flask в returnedContainers.');
        assert(/Возвращено: Пустая фляга/i.test(outcome.message), 'Сообщение крафта должно говорить о возврате пустой фляги.');
    });

    addTest('23. full_flask в рецептах', 'Сырая вода не подменяет полную флягу в рецептах, которым нужна чистая вода', () => {
        game.state.activeHouse = {
            id: 'shelter:test',
            expedition: {
                kind: 'shelter',
                label: 'Тестовый лагерь',
                locationLabel: 'Тестовый лагерь'
            }
        };
        inventoryRuntime.addInventoryItem('flask_water_dirty', 1);
        inventoryRuntime.addInventoryItem('fishMeat', 1);
        inventoryRuntime.addInventoryItem('fuelBundle', 1);

        const evaluation = craftingRuntime.evaluateRecipeAgainstInventory('hearty-ration');

        assertEqual(evaluation.success, false, 'Сырая вода не должна подходить для рецепта с чистой водой.');
        assertEqual(evaluation.reason, 'missing-ingredients', 'Для dirty flask должна возвращаться ошибка missing-ingredients.');
        assert(evaluation.missingIngredients.some((entry) => entry.id === 'waterFlaskFull'), 'Система должна явно просить полную флягу.');
    });

    addTest('24. уровни воды', 'Вода разделена на сырую, кипячёную и алхимическую, а лечебная база остаётся отдельным компонентом', () => {
        const rawState = game.systems.containerRegistry.getContainerStateDefinition('waterFlaskDirty');
        const boiledState = game.systems.containerRegistry.getContainerStateDefinition('waterFlaskFull');
        const alchemyState = game.systems.containerRegistry.getContainerStateDefinition('waterFlaskAlchemy');
        const healingBase = componentRegistry.getComponentDefinition('healingBase');

        assert(rawState && rawState.itemId === 'flask_water_dirty', 'Сырая вода должна существовать как отдельное состояние фляги.');
        assert(boiledState && boiledState.itemId === 'flask_water_full', 'Кипячёная вода должна существовать как отдельное состояние фляги.');
        assert(alchemyState && alchemyState.itemId === 'flask_water_alchemy', 'Алхимическая вода должна существовать как отдельное состояние фляги.');
        assert(healingBase && healingBase.id === 'healingBase', 'Лечебная база должна оставаться отдельным компонентом.');
    });

    addTest('24. уровни воды', 'Кипячёная вода отдельно переводится в алхимическую без возврата пустой фляги', () => {
        game.state.activeHouse = {
            id: 'shelter:test',
            expedition: {
                kind: 'shelter',
                label: 'Тестовый лагерь',
                locationLabel: 'Тестовый лагерь'
            }
        };
        inventoryRuntime.addInventoryItem('flask_water_full', 1);

        const outcome = craftingRuntime.craftRecipeAgainstInventory('prepare-alchemy-water');

        assert(outcome && outcome.success, 'Подготовка алхимической воды должна быть успешной.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_water_full'), 0, 'Кипячёная вода должна уйти в алхимическую форму.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_water_alchemy'), 1, 'После подготовки должна появляться алхимическая вода.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_empty'), 0, 'При переводе кипячёной воды в алхимическую пустая фляга возвращаться не должна.');
    });

    addTest('24. уровни воды', 'Алхимические рецепты требуют специальную воду, а не обычную кипячёную', () => {
        const alchemyRecipeIds = ['healing-brew', 'energy-tonic', 'second-wind'];
        const foodRecipeIds = ['hearty-ration', 'strong-broth'];

        alchemyRecipeIds.forEach((recipeId) => {
            const recipe = recipeRegistry.getRecipeDefinition(recipeId);
            assert(
                Array.isArray(recipe.ingredients) && recipe.ingredients.some((ingredient) => ingredient.kind === 'itemState' && ingredient.id === 'waterFlaskAlchemy'),
                `Алхимический рецепт ${recipeId} должен требовать waterFlaskAlchemy.`
            );
        });

        foodRecipeIds.forEach((recipeId) => {
            const recipe = recipeRegistry.getRecipeDefinition(recipeId);
            assert(
                Array.isArray(recipe.ingredients) && recipe.ingredients.some((ingredient) => ingredient.kind === 'itemState' && ingredient.id === 'waterFlaskFull'),
                `Пищевой рецепт ${recipeId} должен оставаться на waterFlaskFull.`
            );
        });
    });

    addTest('24. уровни воды', 'Алхимический рецепт с особой водой возвращает пустую флягу', () => {
        game.state.activeHouse = {
            id: 'shelter:test',
            expedition: {
                kind: 'shelter',
                label: 'Тестовый лагерь',
                locationLabel: 'Тестовый лагерь'
            }
        };
        inventoryRuntime.addInventoryItem('flask_water_alchemy', 1);
        inventoryRuntime.addInventoryItem('healingBase', 1);

        const outcome = craftingRuntime.craftRecipeAgainstInventory('healing-brew');

        assert(outcome && outcome.success, 'Алхимический рецепт должен успешно крафтиться на специальной воде.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_water_alchemy'), 0, 'Алхимическая вода должна расходоваться рецептом.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_empty'), 1, 'После алхимического рецепта должна возвращаться пустая фляга.');
        assertEqual(inventoryRuntime.countInventoryItem('healingBrew'), 1, 'Игрок должен получить алхимический результат рецепта.');
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
