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
    const inventoryUi = game.systems.inventoryUi;
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

    function countInventoryByIds(itemIds) {
        return (Array.isArray(itemIds) ? itemIds : []).reduce((sum, itemId) => sum + inventoryRuntime.countInventoryItem(itemId), 0);
    }

    function installInventoryUiHarness(options = {}) {
        const root = document.createElement('section');
        root.className = 'hud-card';
        root.id = `inventoryHarness-${Math.random().toString(16).slice(2)}`;
        root.innerHTML = `
            <p class="hud-kicker">Сумка</p>
            <h3 class="hud-title">Инвентарь</h3>
            <div id="inventoryGrid"></div>
        `;
        document.body.appendChild(root);

        const inventoryGrid = root.querySelector('#inventoryGrid');
        const useButton = document.createElement('button');
        useButton.type = 'button';
        useButton.className = 'hud-button';
        useButton.dataset.action = 'use';
        useButton.disabled = Boolean(options.useDisabled);

        const dropButton = document.createElement('button');
        dropButton.type = 'button';
        dropButton.className = 'hud-button';
        dropButton.dataset.action = 'drop';
        dropButton.disabled = Boolean(options.dropDisabled);

        const previousBridgeState = {
            getElements: bridge.getElements,
            getGame: bridge.getGame,
            getUnlockedInventorySlots: bridge.getUnlockedInventorySlots,
            getInventory: bridge.getInventory,
            getSelectedInventoryItem: bridge.getSelectedInventoryItem,
            getItemDefinition: bridge.getItemDefinition,
            normalizeInventoryItem: bridge.normalizeInventoryItem,
            getDefaultActionHint: bridge.getDefaultActionHint
        };

        Object.assign(bridge, {
            getElements() {
                return {
                    actionButtons: [useButton, dropButton],
                    inventoryGrid,
                    selectedCharacterPortrait: null
                };
            },
            getGame() {
                return game;
            },
            getUnlockedInventorySlots() {
                return inventoryRuntime.getUnlockedInventorySlots();
            },
            getInventory() {
                return inventoryRuntime.getInventory();
            },
            getSelectedInventoryItem() {
                return inventoryRuntime.getSelectedInventoryItem();
            },
            getItemDefinition(itemId = '') {
                return itemRegistry.getItemDefinition(itemId);
            },
            normalizeInventoryItem(item) {
                return inventoryRuntime.normalizeInventoryItem(item);
            },
            getDefaultActionHint(activeInteraction, tileInfo) {
                return actionUi.getDefaultActionHint(activeInteraction, tileInfo);
            }
        });

        return {
            root,
            inventoryGrid,
            useButton,
            dropButton,
            cleanup() {
                Object.assign(bridge, previousBridgeState);
                root.remove();
            }
        };
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

    function buildTestHouse(kind, originX, originY, expeditionOverrides = {}) {
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
                label: kind === 'merchant' ? 'Торговец' : (kind === 'artisan' ? 'Ремесленник' : 'Сундук'),
                summary: 'Тестовая точка интереса',
                ...cloneValue(expeditionOverrides)
            }
        };
    }

    function buildStationInteraction(kind, overrides = {}) {
        const { expedition: expeditionOverrides = {}, ...restOverrides } = overrides;
        const defaultExpedition = kind === 'camp'
            ? {
                kind: 'camp',
                label: 'Лагерный очаг',
                stationId: 'camp',
                stationIds: ['camp'],
                summary: 'Тестовая лагерная станция'
            }
            : {
                kind: 'workbench',
                label: 'Верстак',
                stationId: 'bench',
                stationIds: ['bench'],
                summary: 'Тестовая станция'
            };

        return {
            id: `${kind}:test`,
            kind,
            houseId: `${kind}:test`,
            localX: 0,
            localY: 1,
            worldX: 0,
            worldY: 1,
            renderDepth: 1.35,
            placement: 'exterior',
            expedition: {
                ...defaultExpedition,
                ...cloneValue(expeditionOverrides)
            },
            ...cloneValue(restOverrides)
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
            rotate(angle) {
                this.ops.push(['rotate', angle]);
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
        const requiredIds = ['grass', 'reeds', 'stone', 'rubble', 'wood', 'water', 'fish'];

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

    addTest('5. station-runtime.js', 'Активный верстак становится явной станцией для bench/workbench', () => {
        resetHarness();
        game.state.activeInteraction = buildStationInteraction('workbench', {
            expedition: {
                label: 'Мастерская',
                stationId: 'workbench',
                stationIds: ['bench', 'workbench']
            }
        });

        const stationContext = stationRuntime.getActiveStationContext();
        const availableStations = craftingRuntime.resolveAvailableStations();

        assertEqual(stationContext.activeSourceLabel, 'Мастерская', 'Активная станция сверху должна называться "Мастерская".');
        assertEqual(stationContext.activeStationId, 'workbench', 'Текущая активная станция должна определяться как workbench.');
        assert(availableStations.includes('bench'), 'Явный верстак должен открывать bench.');
        assert(availableStations.includes('workbench'), 'Явный верстак должен открывать workbench.');
    });

    addTest('5. station-runtime.js', 'Shelter сам по себе больше не открывает camp без отдельного лагерного объекта', () => {
        resetHarness();
        game.state.activeHouse = buildTestHouse('shelter', 4, 4, {
            label: 'Тестовое укрытие',
            locationLabel: 'Тестовое укрытие'
        });

        const withoutCampStations = craftingRuntime.resolveAvailableStations();
        assertEqual(withoutCampStations.includes('camp'), false, 'Shelter не должен сам по себе открывать станцию camp.');

        game.state.activeInteraction = buildStationInteraction('camp');
        const withCampStations = craftingRuntime.resolveAvailableStations();

        assert(withCampStations.includes('camp'), 'Отдельный лагерный объект должен открывать станцию camp.');
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

    addTest('9. raw_* ресурсы', 'Сбор тростника даёт raw_reeds, а не траву или готовый компонент', () => {
        resetHarness();
        installResourceNodeWorld('reedPatch', {
            islandIndex: 3,
            targetTileType: 'reeds'
        });

        actionUi.handleUseAction();

        assertEqual(inventoryRuntime.countInventoryItem('raw_reeds'), 1, 'Сбор тростника должен давать raw_reeds.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_grass'), 0, 'Тростник не должен подменяться в raw_grass.');
        assertEqual(inventoryRuntime.countInventoryItem('healingBase'), 0, 'Готовый лечебный компонент не должен выпадать сразу при сборе тростника.');
    });

    addTest('9. raw_* ресурсы', 'Старые места кода не подменяют raw-resource на старые item ids', () => {
        const grassDefinition = resourceRegistry.getBaseResourceDefinition('grass');
        const reedsDefinition = resourceRegistry.getBaseResourceDefinition('reeds');
        const stoneDefinition = resourceRegistry.getBaseResourceDefinition('stone');
        const rubbleDefinition = resourceRegistry.getBaseResourceDefinition('rubble');

        assertDeepEqual(grassDefinition.currentInventoryItemIds, ['raw_grass'], 'Grass должен ссылаться только на raw_grass.');
        assertDeepEqual(reedsDefinition.currentInventoryItemIds, ['raw_reeds'], 'Reeds должен ссылаться только на raw_reeds.');
        assertDeepEqual(stoneDefinition.currentInventoryItemIds, ['raw_stone'], 'Stone должен ссылаться только на raw_stone.');
        assertDeepEqual(rubbleDefinition.currentInventoryItemIds, ['raw_rubble'], 'Rubble должен ссылаться только на raw_rubble.');
        assertEqual(itemRegistry.getItemDefinition('grassResource'), null, 'Легаси grassResource больше не должен быть item definition.');
        assertEqual(itemRegistry.getItemDefinition('stoneResource'), null, 'Легаси stoneResource больше не должен быть item definition.');
        assertEqual(itemRegistry.getItemDefinition('rubbleChunk'), null, 'Легаси rubbleChunk больше не должен быть item definition.');
    });

    addTest('10. тростник как отдельное сырьё', 'Трава и тростник собираются в разные raw-ресурсы без смешивания', () => {
        resetHarness();
        installResourceNodeWorld('grassBush', {
            islandIndex: 4,
            targetTileType: 'grass'
        });

        actionUi.handleUseAction();
        installResourceNodeWorld('reedPatch', {
            islandIndex: 4,
            targetTileType: 'reeds'
        });
        actionUi.handleUseAction();

        assertEqual(inventoryRuntime.countInventoryItem('raw_grass'), 1, 'Полевой куст должен давать raw_grass.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_reeds'), 1, 'Тростниковый куст должен давать raw_reeds.');
    });

    addTest('10. тростник как отдельное сырьё', 'Старые предметы мигрируются в raw_grass/raw_reeds, а legacy ids не остаются активными', () => {
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
        const migratedIds = migratedItems.map((item) => item.id);

        assertEqual(migratedItems.length, 2, 'Полевая трава и тростник должны мигрировать в два разных ресурса.');
        assert(migratedIds.includes('raw_grass'), 'fieldGrass должен мигрировать в raw_grass.');
        assert(migratedIds.includes('raw_reeds'), 'lowlandGrass должен мигрировать в raw_reeds.');
        assertEqual(itemRegistry.getItemDefinition('lowlandGrass'), null, 'lowlandGrass не должен оставаться активным item id.');
        assertEqual(itemRegistry.getItemDefinition('fieldGrass'), null, 'fieldGrass не должен оставаться активным item id.');
    });

    addTest('10. тростник как отдельное сырьё', 'Рецепты используют grass/reeds вместо legacy ids и дают нужные выходы', () => {
        const recipeDefinitions = recipeRegistry.getRecipeDefinitions();
        const legacyIds = new Set(['lowlandGrass', 'fieldGrass', 'grassResource']);
        const grassRecipes = recipeDefinitions.filter((recipe) => ['grass-to-healing-base', 'grass-to-herbal-paste', 'grass-to-rope'].includes(recipe.recipeId));
        const reedsRecipes = recipeDefinitions.filter((recipe) => ['reeds-to-healing-base', 'reeds-to-rope'].includes(recipe.recipeId));

        recipeDefinitions.forEach((recipe) => {
            recipe.ingredients.forEach((ingredient) => {
                assert(!legacyIds.has(ingredient.id), `Рецепт ${recipe.recipeId} всё ещё использует legacy id ${ingredient.id}.`);
            });

            if (recipe.result) {
                assert(!legacyIds.has(recipe.result.id), `Рецепт ${recipe.recipeId} всё ещё выдаёт legacy id ${recipe.result.id}.`);
            }
        });

        assert(grassRecipes.every((recipe) => recipe.ingredients.some((ingredient) => ingredient.kind === 'resource' && ingredient.id === 'grass')), 'Травяные рецепты должны использовать общий ресурс grass.');
        assert(reedsRecipes.every((recipe) => recipe.ingredients.some((ingredient) => ingredient.kind === 'resource' && ingredient.id === 'reeds')), 'Тростниковые рецепты должны использовать ресурс reeds.');
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

    addTest('11. compression pipeline', 'raw_reeds сжимается в healingBase через явный recipeId', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('raw_reeds', 5);

        const outcome = compressionRuntime.compressSourceItem('raw_reeds', {
            recipeId: 'reeds-to-healing-base',
            availableStations: ['hand']
        });

        assert(outcome.success, 'Сжатие raw_reeds в healingBase не завершилось успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_reeds'), 0, 'Тростник не был израсходован полностью.');
        assertEqual(inventoryRuntime.countInventoryItem('healingBase'), 1, 'healingBase не появился после сжатия тростника.');
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

    addTest('11. compression pipeline', 'reeds-to-rope требует bench и использует raw_reeds', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('raw_reeds', 10);

        const handEvaluations = compressionRuntime.evaluateCompressionForSourceItem('raw_reeds', {
            availableStations: ['hand']
        });
        const handRopeEvaluation = handEvaluations.find((entry) => entry && entry.recipe && entry.recipe.recipeId === 'reeds-to-rope');

        assert(handRopeEvaluation, 'Оценка recipe reeds-to-rope не найдена.');
        assertEqual(handRopeEvaluation.success, false, 'Верёвка из тростника не должна быть доступна без bench.');
        assertEqual(handRopeEvaluation.reason, 'wrong-station', 'Для reeds-to-rope ожидалась ошибка wrong-station.');

        const benchOutcome = compressionRuntime.compressSourceItem('raw_reeds', {
            recipeId: 'reeds-to-rope',
            availableStations: ['bench']
        });

        assert(benchOutcome.success, 'На bench верёвка из тростника должна крафтиться успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_reeds'), 0, 'Тростник должен быть полностью израсходован на верёвку.');
        assertEqual(inventoryRuntime.countInventoryItem('rope'), 1, 'После крафта из тростника должна появиться верёвка.');
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
        assert(nodeKinds.includes('fishingSpot'), 'Не появился береговой fishingSpot.');
        assert(nodeKinds.includes('fishingReedsSpot'), 'Не появился fishingReedsSpot.');
        assert(nodeKinds.includes('fishingCalmSpot'), 'Не появился fishingCalmSpot.');
        assert(nodeKinds.includes('reedPatch'), 'Не появился reedPatch.');
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

    addTest('12. resourceNode interactions', 'Рядом с мастерской появляется отдельный workbench interaction', () => {
        resetHarness();
        const houses = [
            buildTestHouse('artisan', 9, 12, {
                label: 'Ремесленник',
                locationLabel: 'Мастерская',
                buildingType: 'workshop',
                summary: 'Тестовая мастерская'
            })
        ];
        const interactions = createChunkInteractionsForTest({
            islandIndex: 8,
            chunkSource: buildResourceBiomeChunk(),
            houses
        });
        const artisanInteraction = interactions.find((interaction) => interaction.kind === 'artisan');
        const workbenchInteraction = interactions.find((interaction) => interaction.kind === 'workbench');

        assert(artisanInteraction, 'В чанке должен появиться artisan interaction.');
        assert(workbenchInteraction, 'Рядом с мастерской должен появиться отдельный workbench interaction.');
        assert(Array.isArray(workbenchInteraction.expedition.stationIds) && workbenchInteraction.expedition.stationIds.includes('workbench'), 'У workbench interaction должна быть явная станция workbench.');
        assert(
            artisanInteraction.localX !== workbenchInteraction.localX || artisanInteraction.localY !== workbenchInteraction.localY,
            'Workbenсh не должен накладываться на artisan interaction.'
        );
    });

    addTest('12. resourceNode interactions', 'Рядом с shelter появляется отдельный camp interaction', () => {
        resetHarness();
        const houses = [
            buildTestHouse('shelter', 8, 10, {
                label: 'Укрытие',
                locationLabel: 'Укрытие',
                summary: 'Тестовое укрытие'
            })
        ];
        const interactions = createChunkInteractionsForTest({
            islandIndex: 8,
            chunkSource: buildResourceBiomeChunk(),
            houses
        });
        const shelterInteraction = interactions.find((interaction) => interaction.kind === 'shelter');
        const campInteraction = interactions.find((interaction) => interaction.kind === 'camp');

        assert(shelterInteraction, 'В чанке должен появиться shelter interaction.');
        assert(campInteraction, 'Рядом с shelter должен появиться отдельный camp interaction.');
        assertEqual(campInteraction.expedition.stationId, 'camp', 'Camp interaction должен открывать только станцию camp.');
        assert(
            shelterInteraction.localX !== campInteraction.localX || shelterInteraction.localY !== campInteraction.localY,
            'Camp interaction не должен накладываться на shelter interaction.'
        );
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

    addTest('13. визуальные типы resource nodes', 'Отдельный workbench interaction имеет видимый рендер', () => {
        resetHarness();
        const interaction = {
            id: 'render:workbench',
            kind: 'workbench',
            worldX: 4,
            worldY: 4,
            localX: 4,
            localY: 4,
            houseId: 'render:workbench',
            renderDepth: 8.35,
            expedition: {
                kind: 'workbench',
                label: 'Мастерская',
                stationId: 'workbench',
                stationIds: ['bench', 'workbench']
            }
        };
        const context = createRecordingContext();

        game.ctx = context;
        installInteractionRenderChunk([interaction]);
        interactionRenderer.drawInteractions(0, 0);

        assert(
            context.ops.some((operation) => operation[0] === 'fillRect' || operation[0] === 'fill'),
            'Рендер workbench interaction не выполнил ни одной видимой операции.'
        );
    });

    addTest('13. визуальные типы resource nodes', 'Отдельный camp interaction имеет видимый рендер', () => {
        resetHarness();
        const interaction = buildStationInteraction('camp');
        const context = createRecordingContext();

        game.ctx = context;
        installInteractionRenderChunk([interaction]);
        interactionRenderer.drawInteractions(0, 0);

        assert(
            context.ops.some((operation) => operation[0] === 'fillRect' || operation[0] === 'fill'),
            'Рендер camp interaction не выполнил ни одной видимой операции.'
        );
    });

    addTest('13. визуальные типы resource nodes', 'Дерево визуально занимает две клетки по высоте', () => {
        resetHarness();
        const interaction = buildResourceNodeInteraction('woodTree', {
            id: 'render:tall-tree',
            x: 4,
            y: 4,
            islandIndex: 10
        });
        const context = createRecordingContext();

        game.ctx = context;
        installInteractionRenderChunk([interaction]);
        interactionRenderer.drawInteractions(0, 0);

        assert(
            context.ops.some((operation) => (
                (operation[0] === 'arc' || operation[0] === 'ellipse')
                && operation[2] <= -(game.config.tileHeight + 8)
            )),
            'Дерево должно иметь верхнюю декоративную крону на одну клетку выше базовой.'
        );
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
        const fishingNodeKinds = ['fishingSpot', 'fishingReedsSpot', 'fishingCalmSpot', 'fishingRareSpot'];

        assert(
            wetInteractions.some((interaction) => fishingNodeKinds.includes(interaction.resourceNodeKind)),
            'У воды должен появляться хотя бы один fishingSpot.'
        );
        assert(
            !dryInteractions.some((interaction) => fishingNodeKinds.includes(interaction.resourceNodeKind)),
            'В сухой зоне fishing spots появляться не должны.'
        );
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

    addTest('16. биом и топология resource nodes', 'Кусты травы спавнятся кучкой из нескольких соседних клеток', () => {
        resetHarness();
        const interactions = createChunkInteractionsForTest({
            islandIndex: 4,
            chunkSource: buildResourceBiomeChunk(),
            random: () => 0.4
        });
        const grassBushes = interactions.filter((interaction) => interaction.resourceNodeKind === 'grassBush');

        assert(grassBushes.length >= 2, 'Grass bush должен появляться группой минимум из двух клеток.');
        assert(
            grassBushes.every((interaction) => grassBushes.some((candidate) => (
                candidate !== interaction
                && Math.max(
                    Math.abs(candidate.localX - interaction.localX),
                    Math.abs(candidate.localY - interaction.localY)
                ) <= 1
            ))),
            'Grass bush не должен оставаться одиночной точкой без соседнего куста.'
        );
    });

    addTest('16. биом и топология resource nodes', 'Дерево не спавнится там, где рядом нет кустов растений', () => {
        resetHarness();
        const shorelineChunk = buildDryChunk('shore');
        const interactions = createChunkInteractionsForTest({
            islandIndex: 6,
            chunkSource: shorelineChunk,
            random: () => 0.4
        });

        assert(!interactions.some((interaction) => interaction.resourceNodeKind === 'grassBush'), 'На shore-only чанке не должно быть grassBush.');
        assert(!interactions.some((interaction) => interaction.resourceNodeKind === 'woodTree'), 'Wood tree не должен появляться без nearby grass bush.');
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
                        assert(
                            countNeighbors(
                                source.chunkData,
                                interaction.localX,
                                interaction.localY,
                                (candidate) => candidate === 'grass' || candidate === 'reeds',
                                true
                            ) >= 2,
                            'Wood tree должен иметь рядом кустистую растительность.'
                        );
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

    addTest('19. stateful waterFlask', 'Пустую флягу можно наполнить у water-source', () => {
        resetHarness();
        installResourceNodeWorld('waterSource', {
            islandIndex: 4,
            targetTileType: 'shore'
        });
        inventoryRuntime.addInventoryItem('flask_empty', 1);

        const flaskIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'flask_empty');
        const flask = inventoryRuntime.getInventory()[flaskIndex];
        game.state.selectedInventorySlot = flaskIndex;
        const outcome = itemEffects.useInventoryItem(flask);

        assert(outcome && outcome.success, 'Пустая фляга должна наполняться у water-source.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_empty'), 0, 'Пустая фляга должна уйти из исходного состояния.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_water_dirty'), 1, 'После наполнения должна появляться фляга сырой воды.');
    });

    addTest('19. stateful waterFlask', 'Использование полной фляги возвращает flask_empty', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('flask_water_full', 1);

        const flaskIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'flask_water_full');
        const flask = inventoryRuntime.getInventory()[flaskIndex];
        game.state.selectedInventorySlot = flaskIndex;
        const outcome = itemEffects.useInventoryItem(flask);

        assert(outcome && outcome.success, 'Полная фляга должна использоваться успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_water_full'), 0, 'После питья полная фляга должна исчезать.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_empty'), 1, 'После питья должна возвращаться пустая фляга.');
    });

    addTest('19. stateful waterFlask', 'Полная фляга не стакается некорректно с пустой', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('flask_empty', 1);
        inventoryRuntime.addInventoryItem('flask_water_full', 1);

        const activeStacks = inventoryRuntime.getInventory().filter(Boolean);

        assertEqual(inventoryRuntime.countInventoryItem('flask_empty'), 1, 'Пустая фляга должна остаться отдельным контейнером.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_water_full'), 1, 'Полная фляга должна остаться отдельным контейнером.');
        assert(activeStacks.some((item) => item.id === 'flask_empty'), 'В инвентаре должен быть стек пустой фляги.');
        assert(activeStacks.some((item) => item.id === 'flask_water_full'), 'В инвентаре должен быть стек полной фляги.');
        assert(activeStacks.filter((item) => item.id === 'flask_empty' || item.id === 'flask_water_full').length >= 2, 'Пустая и полная фляги не должны схлопываться в один стек.');
    });

    addTest('20. container model', 'Container item хранит состояние отдельно от обычного consumable', () => {
        const containerRegistry = game.systems.containerRegistry;
        const dirtyState = containerRegistry.getContainerStateByItemId('flask_water_dirty');
        const rationState = containerRegistry.getContainerStateByItemId('ration');
        const dirtyDefinition = itemRegistry.getItemDefinition('flask_water_dirty');

        assert(containerRegistry.isContainerItem('flask_water_dirty'), 'Фляга с водой должна распознаваться как container item.');
        assertEqual(Boolean(rationState), false, 'Обычный ration не должен считаться контейнером.');
        assert(dirtyState && dirtyState.id === 'waterFlaskDirty', 'Состояние контейнера должно читаться отдельно от обычного consumable.');
        assert((dirtyDefinition.categories || []).includes('container'), 'Container item должен сохранять категорию container в каталоге.');
    });

    addTest('20. container model', 'Рецепты могут требовать конкретное состояние контейнера', () => {
        const boilRecipe = recipeRegistry.getRecipeDefinition('boil-water');
        const brothRecipe = recipeRegistry.getRecipeDefinition('fish-broth');
        const healingRecipe = recipeRegistry.getRecipeDefinition('healing-brew');

        assert(boilRecipe.ingredients.some((ingredient) => ingredient.kind === 'itemState' && ingredient.id === 'waterFlaskDirty'), 'boil-water должен требовать именно dirty flask.');
        assert(brothRecipe.ingredients.some((ingredient) => ingredient.kind === 'itemState' && ingredient.id === 'waterFlaskFull'), 'fish-broth должен требовать именно full flask.');
        assert(healingRecipe.ingredients.some((ingredient) => ingredient.kind === 'itemState' && ingredient.id === 'waterFlaskAlchemy'), 'healing-brew должен требовать именно алхимическую воду.');
    });

    addTest('20. container model', 'Сейв/лоад не теряет состояние контейнера', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('flask_water_dirty', 1);
        inventoryRuntime.addInventoryItem('flask_water_full', 1);
        inventoryRuntime.addInventoryItem('flask_empty', 1);

        const snapshot = saveLoad.buildSaveSnapshot(game.state);
        const hydratedState = saveLoad.hydrateStateFromSnapshot(snapshot);
        const hydratedInventory = Array.isArray(hydratedState.inventory) ? hydratedState.inventory : [];

        assert(hydratedInventory.some((item) => item && item.id === 'flask_water_dirty'), 'После загрузки должна сохраниться dirty flask.');
        assert(hydratedInventory.some((item) => item && item.id === 'flask_water_full'), 'После загрузки должна сохраниться full flask.');
        assert(hydratedInventory.some((item) => item && item.id === 'flask_empty'), 'После загрузки должна сохраниться empty flask.');
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

    addTest('21. fill_flask у water-source', 'Action button корректно дизейблится вне valid zone', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('flask_empty', 1);
        game.state.selectedInventorySlot = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'flask_empty');
        const uiHarness = installInventoryUiHarness();

        try {
            actionUi.updateActionButtons();
            const availability = actionUi.getActionAvailability('use');

            assertEqual(availability.enabled, false, 'Вне water-source use action не должен быть доступен для empty flask.');
            assertEqual(uiHarness.useButton.disabled, true, 'Кнопка use должна быть disabled вне valid zone.');
        } finally {
            uiHarness.cleanup();
        }
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
        game.state.activeInteraction = buildStationInteraction('camp');
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

        game.state.activeInteraction = buildStationInteraction('camp');

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
        game.state.activeInteraction = buildStationInteraction('camp');
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
        game.state.activeInteraction = buildStationInteraction('camp');
        inventoryRuntime.addInventoryItem('flask_water_dirty', 1);
        inventoryRuntime.addInventoryItem('fishMeat', 1);
        inventoryRuntime.addInventoryItem('fuelBundle', 1);

        const evaluation = craftingRuntime.evaluateRecipeAgainstInventory('hearty-ration');

        assertEqual(evaluation.success, false, 'Сырая вода не должна подходить для рецепта с чистой водой.');
        assertEqual(evaluation.reason, 'missing-ingredients', 'Для dirty flask должна возвращаться ошибка missing-ingredients.');
        assert(evaluation.missingIngredients.some((entry) => entry.id === 'waterFlaskFull'), 'Система должна явно просить полную флягу.');
    });

    addTest('23. full_flask в рецептах', 'Количество контейнеров остаётся консистентным после серии use/craft', () => {
        resetHarness();
        installResourceNodeWorld('waterSource', {
            islandIndex: 6,
            targetTileType: 'shore'
        });
        inventoryRuntime.addInventoryItem('flask_empty', 1);
        inventoryRuntime.addInventoryItem('fuelBundle', 1);
        inventoryRuntime.addInventoryItem('healingBase', 1);

        const containerIds = ['flask_empty', 'flask_water_dirty', 'flask_water_full', 'flask_water_alchemy'];
        const emptyFlaskIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'flask_empty');
        game.state.selectedInventorySlot = emptyFlaskIndex;
        const fillOutcome = itemEffects.useInventoryItem(inventoryRuntime.getInventory()[emptyFlaskIndex]);

        assert(fillOutcome && fillOutcome.success, 'Фляга должна успешно наполниться перед серией крафтов.');
        assertEqual(countInventoryByIds(containerIds), 1, 'После наполнения количество контейнеров должно остаться равным одному.');

        game.state.activeInteraction = buildStationInteraction('camp');
        const boilOutcome = craftingRuntime.craftRecipeAgainstInventory('boil-water');
        assert(boilOutcome && boilOutcome.success, 'boil-water должен успешно пройти в серии.');
        assertEqual(countInventoryByIds(containerIds), 1, 'После кипячения количество контейнеров должно остаться равным одному.');

        const alchemyOutcome = craftingRuntime.craftRecipeAgainstInventory('prepare-alchemy-water');
        assert(alchemyOutcome && alchemyOutcome.success, 'prepare-alchemy-water должен успешно пройти в серии.');
        assertEqual(countInventoryByIds(containerIds), 1, 'После алхимической подготовки количество контейнеров должно остаться равным одному.');

        const healingOutcome = craftingRuntime.craftRecipeAgainstInventory('healing-brew');
        assert(healingOutcome && healingOutcome.success, 'healing-brew должен успешно пройти в серии.');
        assertEqual(countInventoryByIds(containerIds), 1, 'После серии use/craft игрок должен сохранить ровно один контейнер.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_empty'), 1, 'После серии контейнер должен вернуться в empty flask.');
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
        game.state.activeInteraction = buildStationInteraction('camp');
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
        game.state.activeInteraction = buildStationInteraction('camp');
        inventoryRuntime.addInventoryItem('flask_water_alchemy', 1);
        inventoryRuntime.addInventoryItem('healingBase', 1);

        const outcome = craftingRuntime.craftRecipeAgainstInventory('healing-brew');

        assert(outcome && outcome.success, 'Алхимический рецепт должен успешно крафтиться на специальной воде.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_water_alchemy'), 0, 'Алхимическая вода должна расходоваться рецептом.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_empty'), 1, 'После алхимического рецепта должна возвращаться пустая фляга.');
        assertEqual(inventoryRuntime.countInventoryItem('healingBrew'), 1, 'Игрок должен получить алхимический результат рецепта.');
    });

    addTest('24. уровни воды', 'Простое питьё принимает только допустимые типы воды', () => {
        assertEqual(itemEffects.canUseInventoryItem({ id: 'flask_empty', label: 'Пустая фляга' }), false, 'Пустая фляга не должна считаться drinkable.');
        assertEqual(itemEffects.canUseInventoryItem({ id: 'flask_water_dirty', label: 'Фляга сырой воды' }), true, 'Сырая вода должна быть пригодна для простого питья.');
        assertEqual(itemEffects.canUseInventoryItem({ id: 'flask_water_full', label: 'Фляга кипячёной воды' }), true, 'Кипячёная вода должна быть пригодна для простого питья.');
        assertEqual(itemEffects.canUseInventoryItem({ id: 'flask_water_alchemy', label: 'Фляга алхимической воды' }), false, 'Алхимическая вода не должна считаться drinkable.');
    });

    addTest('24. уровни воды', 'UI различает типы воды по названию и иконке', () => {
        const rawDefinition = itemRegistry.getItemDefinition('flask_water_dirty');
        const fullDefinition = itemRegistry.getItemDefinition('flask_water_full');
        const alchemyDefinition = itemRegistry.getItemDefinition('flask_water_alchemy');

        assert(rawDefinition && fullDefinition && alchemyDefinition, 'Все типы воды должны существовать в item catalog.');
        assert(rawDefinition.label !== fullDefinition.label, 'Сырая и кипячёная вода должны различаться по названию.');
        assert(fullDefinition.label !== alchemyDefinition.label, 'Кипячёная и алхимическая вода должны различаться по названию.');
        assert(rawDefinition.icon !== fullDefinition.icon, 'Сырая и кипячёная вода должны различаться по иконке.');
        assert(fullDefinition.icon !== alchemyDefinition.icon, 'Кипячёная и алхимическая вода должны различаться по иконке.');
    });

    addTest('25. UI контейнеров', 'В инвентаре видно состояние фляги', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('flask_water_full', 1);
        game.state.selectedInventorySlot = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'flask_water_full');
        const uiHarness = installInventoryUiHarness();

        try {
            inventoryUi.renderInventory();
            const factsText = document.getElementById('inventorySelectionFacts').textContent || '';

            assert(/полная/i.test(factsText), 'В selection panel должна быть видна наполненность фляги.');
            assert(/кипяч[её]ная вода/i.test(factsText), 'В selection panel должно быть видно состояние кипячёной воды.');
        } finally {
            uiHarness.cleanup();
        }
    });

    addTest('25. UI контейнеров', 'Inspect показывает корректное содержимое контейнера', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('flask_water_dirty', 1);
        game.state.selectedInventorySlot = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'flask_water_dirty');
        const uiHarness = installInventoryUiHarness();

        try {
            inventoryUi.renderInventory();
            const title = document.getElementById('inventorySelectionTitle').textContent || '';
            const factsText = document.getElementById('inventorySelectionFacts').textContent || '';

            assert(/сырой воды/i.test(title), 'Название выбранного контейнера должно показывать сырую воду.');
            assert(/пригодна для питья/i.test(factsText), 'Inspect должен показывать, что сырая вода пригодна для питья.');
            assert(!/пригодна для рецепта/i.test(factsText), 'Inspect не должен ошибочно помечать сырую воду как recipe-ready.');
        } finally {
            uiHarness.cleanup();
        }
    });

    addTest('25. UI контейнеров', 'После использования отображение обновляется сразу', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('flask_water_full', 1);
        const flaskIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'flask_water_full');
        game.state.selectedInventorySlot = flaskIndex;
        const uiHarness = installInventoryUiHarness({
            useDisabled: false
        });

        try {
            inventoryUi.renderInventory();
            const outcome = itemEffects.useInventoryItem(inventoryRuntime.getInventory()[flaskIndex]);
            assert(outcome && outcome.success, 'Полная фляга должна использоваться успешно в UI-тесте.');

            inventoryUi.renderInventory();
            const emptyFlaskSlotLabel = uiHarness.inventoryGrid.querySelector('.inventory-slot[data-item-id="flask_empty"] .inventory-slot__label');
            const selectionPanel = document.getElementById('inventorySelectionPanel');

            assert(emptyFlaskSlotLabel && /Пустая фляга/i.test(emptyFlaskSlotLabel.textContent || ''), 'После использования инвентарь должен сразу показать empty flask.');
            assert(selectionPanel && selectionPanel.hidden, 'После использования selection panel должна сразу обновиться и скрыться.');
        } finally {
            uiHarness.cleanup();
        }
    });

    addTest('26. fishingRod как unlock рыбалки', 'Удочка больше не даёт пассивный бонус к еде и отдыху', () => {
        const definition = itemRegistry.getItemDefinition('fishingRod');

        assert(definition, 'fishingRod должен существовать в каталоге.');
        assertEqual(Boolean(definition.passive), false, 'Удочка больше не должна жить как passive-бафф.');
        assert(Array.isArray(definition.resourceNodeUnlocks) && definition.resourceNodeUnlocks.includes('fishingSpot'), 'Удочка должна явно отмечаться как unlock для fishingSpot.');
        assert(definition.resourceNodeUnlocks.includes('fishingReedsSpot'), 'Удочка должна открывать fishingReedsSpot.');
        assert(definition.resourceNodeUnlocks.includes('fishingCalmSpot'), 'Удочка должна открывать fishingCalmSpot.');
        assert(definition.resourceNodeUnlocks.includes('fishingRareSpot'), 'Удочка должна открывать fishingRareSpot.');
        assertEqual((definition.categories || []).includes('food'), false, 'Удочка не должна оставаться food-предметом.');
    });

    addTest('27. fishing spots по типам воды', 'Береговая, тростниковая и спокойная точки спавнятся на своих тайлах', () => {
        resetHarness();
        const source = buildResourceBiomeChunk();
        const interactions = createChunkInteractionsForTest({
            islandIndex: 12,
            chunkSource: source,
            random: () => 0.4
        });
        const shoreSpot = interactions.find((interaction) => interaction.resourceNodeKind === 'fishingSpot');
        const reedsSpot = interactions.find((interaction) => interaction.resourceNodeKind === 'fishingReedsSpot');
        const calmSpot = interactions.find((interaction) => interaction.resourceNodeKind === 'fishingCalmSpot');

        assert(shoreSpot, 'На береговом биоме должен появляться fishingSpot.');
        assert(reedsSpot, 'В тростнике должен появляться fishingReedsSpot.');
        assert(calmSpot, 'На спокойной воде должен появляться fishingCalmSpot.');
        assertEqual(source.chunkData[shoreSpot.localY][shoreSpot.localX], 'shore', 'Береговой fishingSpot должен стоять на shore.');
        assertEqual(source.chunkData[reedsSpot.localY][reedsSpot.localX], 'reeds', 'Тростниковый fishing spot должен стоять на reeds.');
        assertEqual(source.chunkData[calmSpot.localY][calmSpot.localX], 'water', 'Спокойный fishing spot должен стоять на water.');
    });

    addTest('27. fishing spots по типам воды', 'Редкая точка появляется только на подходящем водном узле и не обязана появляться всегда', () => {
        resetHarness();
        const source = buildResourceBiomeChunk();
        const regularInteractions = createChunkInteractionsForTest({
            islandIndex: 12,
            chunkSource: source,
            random: () => 0.5
        });
        const rareInteractions = createChunkInteractionsForTest({
            islandIndex: 12,
            chunkSource: source,
            random: () => 0.0
        });
        const rareSpot = rareInteractions.find((interaction) => interaction.resourceNodeKind === 'fishingRareSpot');

        assert(!regularInteractions.some((interaction) => interaction.resourceNodeKind === 'fishingRareSpot'), 'Редкая точка не должна появляться в каждом обычном спавне.');
        assert(rareSpot, 'При редком ролле должна появляться fishingRareSpot.');
        assertEqual(source.chunkData[rareSpot.localY][rareSpot.localX], 'water', 'Редкая рыболовная точка должна стоять на water.');
    });

    addTest('27. fishing spots по типам воды', 'Игрок взаимодействует с fishing spot как с отдельным resource node', () => {
        resetHarness();
        const { interaction, targetTile } = installResourceNodeWorld('fishingSpot', {
            islandIndex: 8,
            targetTileType: 'shore'
        });

        assert(interaction, 'Fishing spot должен существовать как interaction-объект.');
        assert(targetTile && targetTile.interaction, 'Fishing spot должен быть привязан к отдельной клетке мира.');
        assertEqual(interaction.kind, 'resourceNode', 'Fishing spot должен жить как отдельный resourceNode interaction.');
        assertEqual(interaction.resourceNodeKind, 'fishingSpot', 'Fishing spot должен сохранять собственный resourceNodeKind.');
    });

    addTest('27. fishing spots по типам воды', 'После исчерпания fishing spot меняет состояние', () => {
        resetHarness();
        const { interaction } = installResourceNodeWorld('fishingSpot', {
            islandIndex: 8,
            targetTileType: 'shore'
        });

        const firstState = game.systems.interactions.consumeResourceNodeInteraction(interaction);
        assert(['used', 'depleted'].includes(firstState.nodeState), 'После первого сбора fishing spot должен сменить состояние.');

        const secondState = game.systems.interactions.consumeResourceNodeInteraction(interaction);
        assert(['regenerating', 'depleted'].includes(secondState.nodeState), 'После исчерпания fishing spot должен перейти в конечное недоступное состояние.');
    });

    addTest('28. реальные входы/выходы рыбы', 'raw_fish напрямую превращается в fishMeat и fishOil на лагере', () => {
        resetHarness();
        game.state.activeInteraction = buildStationInteraction('camp');
        inventoryRuntime.addInventoryItem('raw_fish', 15);

        const meatEvaluation = craftingRuntime.evaluateRecipeAgainstInventory('fish-to-fish-meat');
        const meatOutcome = craftingRuntime.craftRecipeAgainstInventory('fish-to-fish-meat');
        const oilEvaluation = craftingRuntime.evaluateRecipeAgainstInventory('fish-to-fish-oil');
        const oilOutcome = craftingRuntime.craftRecipeAgainstInventory('fish-to-fish-oil');

        assert(meatEvaluation.success, 'Рецепт fish-to-fish-meat должен быть доступен по raw_fish.');
        assert(meatOutcome && meatOutcome.success, 'Крафт fish-to-fish-meat должен завершаться успешно.');
        assert(oilEvaluation.success, 'Рецепт fish-to-fish-oil должен быть доступен по raw_fish.');
        assert(oilOutcome && oilOutcome.success, 'Крафт fish-to-fish-oil должен завершаться успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_fish'), 0, 'После двух рецептов весь raw_fish должен быть израсходован.');
        assertEqual(inventoryRuntime.countInventoryItem('fishMeat'), 1, 'Из 5 raw_fish должно получаться 1 fishMeat.');
        assertEqual(inventoryRuntime.countInventoryItem('fishOil'), 1, 'Из 10 raw_fish должно получаться 1 fishOil.');
    });

    addTest('28. реальные входы/выходы рыбы', 'raw_fish + fuel_bundle даёт ration как прямой лагерный shortcut', () => {
        resetHarness();
        game.state.activeInteraction = buildStationInteraction('camp');
        inventoryRuntime.addInventoryItem('raw_fish', 5);
        inventoryRuntime.addInventoryItem('fuelBundle', 1);
        const rationCountBefore = inventoryRuntime.countInventoryItem('ration');

        const evaluation = craftingRuntime.evaluateRecipeAgainstInventory('raw-fish-ration');
        const outcome = craftingRuntime.craftRecipeAgainstInventory('raw-fish-ration');

        assert(evaluation.success, 'Рецепт raw-fish-ration должен быть доступен на лагере.');
        assert(outcome && outcome.success, 'Прямой сухпаёк из raw_fish должен крафтиться успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_fish'), 0, 'raw_fish должен полностью расходоваться на ration.');
        assertEqual(inventoryRuntime.countInventoryItem('fuelBundle'), 0, 'fuelBundle должен сгорать при крафте ration.');
        assertEqual(inventoryRuntime.countInventoryItem('ration'), rationCountBefore + 1, 'Игрок должен получить ещё один ration.');
    });

    addTest('28. реальные входы/выходы рыбы', 'Рыба участвует в food recipes только через crafting runtime', () => {
        resetHarness();
        game.state.activeInteraction = buildStationInteraction('camp');
        inventoryRuntime.addInventoryItem('raw_fish', 5);
        inventoryRuntime.addInventoryItem('fuelBundle', 1);
        inventoryRuntime.addInventoryItem('flask_water_full', 1);

        const meatOutcome = craftingRuntime.craftRecipeAgainstInventory('fish-to-fish-meat');
        const brothEvaluation = craftingRuntime.evaluateRecipeAgainstInventory('fish-broth');
        const brothOutcome = craftingRuntime.craftRecipeAgainstInventory('fish-broth');

        assert(meatOutcome && meatOutcome.success, 'Рыба должна сначала пройти через fish-to-fish-meat.');
        assert(brothEvaluation.success, 'После переработки fishMeat должен участвовать в food recipe через crafting runtime.');
        assert(brothOutcome && brothOutcome.success, 'Рыбный бульон должен крафтиться через crafting runtime, а не обходным путём.');
        assertEqual(inventoryRuntime.countInventoryItem('fishBroth'), 1, 'После food recipe игрок должен получить fishBroth.');
    });

    addTest('26. fishingRod как unlock рыбалки', 'Без удочки рыболовная точка не даёт рыбу и сообщает о требовании инструмента', () => {
        resetHarness();
        installResourceNodeWorld('fishingSpot', {
            islandIndex: 8,
            targetTileType: 'water'
        });

        actionUi.handleUseAction();

        assertEqual(inventoryRuntime.countInventoryItem('raw_fish'), 0, 'Без удочки рыба не должна собираться.');
        assert(/Удочка путника/i.test(bridge.lastActionMessage), 'Игрок должен получить понятное сообщение, что нужна удочка.');
    });

    addTest('26. fishingRod как unlock рыбалки', 'С удочкой открывается сбор рыбы, но не появляются старые баффы восстановления', () => {
        resetHarness();
        installResourceNodeWorld('fishingSpot', {
            islandIndex: 8,
            targetTileType: 'water'
        });
        inventoryRuntime.addInventoryItem('fishingRod', 1);

        const modifiersBeforeGather = itemRegistry.getCurrentModifierSnapshot();
        actionUi.handleUseAction();
        const modifiersAfterGather = itemRegistry.getCurrentModifierSnapshot();

        assertEqual(modifiersBeforeGather.foodRecoveryMultiplier, 1, 'Удочка не должна усиливать еду до начала рыбалки.');
        assertEqual(modifiersBeforeGather.recoveryMultiplier, 1, 'Удочка не должна усиливать отдых до начала рыбалки.');
        assertEqual(modifiersAfterGather.foodRecoveryMultiplier, 1, 'Удочка не должна давать foodRecoveryMultiplier и после подбора.');
        assertEqual(modifiersAfterGather.recoveryMultiplier, 1, 'Удочка не должна давать recoveryMultiplier и после подбора.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_fish'), 1, 'С удочкой рыболовная точка должна давать raw_fish.');
    });

    addTest('29. fish_oil как лодка / лампы / поздние рецепты / торговля', 'Рыбий жир остаётся обязательным ингредиентом лодки и лодочного ремонта', () => {
        const boatRecipe = recipeRegistry.getRecipeDefinition('boat');
        const boatRepairRecipe = recipeRegistry.getRecipeDefinition('boat-repair-kit');
        const boatIngredientIds = (boatRecipe && Array.isArray(boatRecipe.ingredients) ? boatRecipe.ingredients : []).map((ingredient) => ingredient.id);
        const repairIngredientIds = (boatRepairRecipe && Array.isArray(boatRepairRecipe.ingredients) ? boatRepairRecipe.ingredients : []).map((ingredient) => ingredient.id);

        assert(boatIngredientIds.includes('fishOil'), 'Готовая лодка должна требовать fishOil.');
        assert(repairIngredientIds.includes('fishOil'), 'Ремкомплект лодки должен требовать fishOil.');
    });

    addTest('29. fish_oil как лодка / лампы / поздние рецепты / торговля', 'Фонарь тумана и Маяк торговца крафтятся через fishOil на мастерской', () => {
        resetHarness();
        game.state.unlockedInventorySlots = 8;
        game.state.activeInteraction = buildStationInteraction('workbench', {
            expedition: {
                stationId: 'workbench',
                stationIds: ['bench', 'workbench']
            }
        });
        inventoryRuntime.addInventoryItem('board', 1);
        inventoryRuntime.addInventoryItem('stoneBlock', 1);
        inventoryRuntime.addInventoryItem('rope', 2);
        inventoryRuntime.addInventoryItem('fishOil', 2);

        const lanternEvaluation = craftingRuntime.evaluateRecipeAgainstInventory('fog-lantern');
        const lanternOutcome = craftingRuntime.craftRecipeAgainstInventory('fog-lantern');
        const beaconEvaluation = craftingRuntime.evaluateRecipeAgainstInventory('merchant-beacon');
        const beaconOutcome = craftingRuntime.craftRecipeAgainstInventory('merchant-beacon');
        const beaconRecipe = recipeRegistry.getRecipeDefinition('merchant-beacon');

        assert(lanternEvaluation.success, 'Фонарь тумана должен собираться через fishOil на мастерской.');
        assert(lanternOutcome && lanternOutcome.success, 'Крафт фонаря тумана должен завершаться успешно.');
        assert(beaconEvaluation.success, 'Маяк торговца должен собираться через fishOil на мастерской.');
        assert(beaconOutcome && beaconOutcome.success, 'Крафт маяка торговца должен завершаться успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('fogLantern'), 1, 'После крафта должен появляться fogLantern.');
        assertEqual(inventoryRuntime.countInventoryItem('merchantBeacon'), 1, 'После крафта должен появляться merchantBeacon.');
        assert(beaconRecipe && Array.isArray(beaconRecipe.tags) && beaconRecipe.tags.includes('late'), 'Маяк торговца должен быть помечен как поздний fishOil-рецепт.');
    });

    addTest('29. fish_oil как лодка / лампы / поздние рецепты / торговля', 'Рыбий жир получил торговую ценность и вес в merchant-экономике', () => {
        resetHarness();
        game.state.currentIslandIndex = 18;
        const pricing = game.systems.pricing;
        const fishOilDefinition = itemRegistry.getItemDefinition('fishOil');
        const rawFishDefinition = itemRegistry.getItemDefinition('raw_fish');
        const fishOilSellPrice = pricing.getMerchantSellPrice('fishOil', 18);
        const rawFishSellPrice = pricing.getMerchantSellPrice('raw_fish', 18);

        assert(fishOilDefinition, 'Предмет fishOil должен существовать в каталоге.');
        assert(rawFishDefinition, 'Предмет raw_fish должен существовать в каталоге.');
        assert((fishOilDefinition.categories || []).includes('value'), 'fishOil должен считаться торговой ценностью.');
        assert(fishOilDefinition.merchantWeight > 0, 'fishOil должен попадать в merchant stock.');
        assert(fishOilDefinition.merchantQuestWeight > 0, 'fishOil должен попадать в merchant quests.');
        assert(fishOilSellPrice > rawFishSellPrice, 'Продавать fishOil должно быть выгоднее, чем raw_fish.');
    });

    addTest('30. tier windows рыбы', 'Островные окна разделяют обычную, редкую и трофейную рыбу', () => {
        const commonFish = resourceRegistry.resolveFishCatchDefinition(8);
        const rareFish = resourceRegistry.resolveFishCatchDefinition(18);
        const trophyFish = resourceRegistry.resolveFishCatchDefinition(27);

        assert(commonFish, 'Для раннего окна должна находиться обычная рыба.');
        assert(rareFish, 'Для среднего окна должна находиться редкая рыба.');
        assert(trophyFish, 'Для позднего окна должна находиться трофейная рыба.');
        assertEqual(commonFish.itemId, 'raw_fish', 'Раннее окно должно давать обычную рыбу.');
        assertEqual(rareFish.itemId, 'raw_fish_rare', 'Среднее окно должно давать редкую рыбу.');
        assertEqual(trophyFish.itemId, 'raw_fish_trophy', 'Позднее окно должно давать трофейную рыбу.');
    });

    addTest('30. tier windows рыбы', 'Рыболовная точка выдаёт нужный тип рыбы по окну островов', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('fishingRod', 1);
        installResourceNodeWorld('fishingSpot', {
            islandIndex: 8,
            targetTileType: 'shore'
        });
        actionUi.handleUseAction();
        assertEqual(inventoryRuntime.countInventoryItem('raw_fish'), 1, 'На раннем окне должна ловиться обычная рыба.');

        resetHarness();
        inventoryRuntime.addInventoryItem('fishingRod', 1);
        installResourceNodeWorld('fishingCalmSpot', {
            islandIndex: 18,
            targetTileType: 'water'
        });
        actionUi.handleUseAction();
        assertEqual(inventoryRuntime.countInventoryItem('raw_fish_rare'), 1, 'На среднем окне должна ловиться редкая рыба.');

        resetHarness();
        inventoryRuntime.addInventoryItem('fishingRod', 1);
        installResourceNodeWorld('fishingRareSpot', {
            islandIndex: 27,
            targetTileType: 'water'
        });
        actionUi.handleUseAction();
        assertEqual(inventoryRuntime.countInventoryItem('raw_fish_trophy'), 1, 'На позднем окне должна ловиться трофейная рыба.');
    });

    addTest('30. tier windows рыбы', 'Редкая и трофейная рыба входят в общий fish pipeline для мяса и жира', () => {
        resetHarness();
        game.state.activeInteraction = buildStationInteraction('camp');
        inventoryRuntime.addInventoryItem('raw_fish_rare', 5);
        inventoryRuntime.addInventoryItem('raw_fish_trophy', 10);

        const meatEvaluation = craftingRuntime.evaluateRecipeAgainstInventory('fish-to-fish-meat');
        const meatOutcome = craftingRuntime.craftRecipeAgainstInventory('fish-to-fish-meat');
        const oilEvaluation = craftingRuntime.evaluateRecipeAgainstInventory('fish-to-fish-oil');
        const oilOutcome = craftingRuntime.craftRecipeAgainstInventory('fish-to-fish-oil');

        assert(meatEvaluation.success, 'Редкая рыба должна входить в общий рецепт fish-to-fish-meat.');
        assert(meatOutcome && meatOutcome.success, 'Из редкой рыбы должен крафтиться fishMeat.');
        assert(oilEvaluation.success, 'Трофейная рыба должна входить в общий рецепт fish-to-fish-oil.');
        assert(oilOutcome && oilOutcome.success, 'Из трофейной рыбы должен крафтиться fishOil.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_fish_rare'), 0, 'Редкая рыба должна полностью расходоваться в мясе.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_fish_trophy'), 0, 'Трофейная рыба должна полностью расходоваться в жире.');
        assertEqual(inventoryRuntime.countInventoryItem('fishMeat'), 1, 'Из редкой рыбы должен появляться fishMeat.');
        assertEqual(inventoryRuntime.countInventoryItem('fishOil'), 1, 'Из трофейной рыбы должен появляться fishOil.');
    });

    addTest('30. tier windows рыбы', 'Таблица типов рыбы obey island windows по всей шкале островов', () => {
        for (let islandIndex = 6; islandIndex <= 30; islandIndex++) {
            const catchDefinition = resourceRegistry.resolveFishCatchDefinition(islandIndex);

            assert(catchDefinition, `Для острова ${islandIndex} должен находиться тип рыбы.`);

            if (islandIndex <= 12) {
                assertEqual(catchDefinition.itemId, 'raw_fish', `Остров ${islandIndex} должен оставаться в окне обычной рыбы.`);
                continue;
            }

            if (islandIndex <= 24) {
                assertEqual(catchDefinition.itemId, 'raw_fish_rare', `Остров ${islandIndex} должен оставаться в окне редкой рыбы.`);
                continue;
            }

            assertEqual(catchDefinition.itemId, 'raw_fish_trophy', `Остров ${islandIndex} должен оставаться в окне трофейной рыбы.`);
        }
    });

    addTest('31. spoilage рыбы', 'Обычная сырая рыба портится после первой смены времени суток', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('raw_fish', 1);
        game.state.stepsSinceTimeOfDayChange = 29;

        const outcome = game.systems.movement.consumeActionTempo({
            virtualSteps: 1,
            silent: false,
            reasonLabel: 'во время теста'
        });

        assertEqual(outcome.timeAdvances, 1, 'Тест должен сдвинуть время суток ровно на одну фазу.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_fish'), 0, 'После первой смены времени обычная рыба не должна оставаться сырой.');
        assertEqual(inventoryRuntime.countInventoryItem('spoiledFish'), 1, 'Обычная сырая рыба должна перейти в spoiledFish.');
        assert(/испорт/i.test(bridge.lastActionMessage), 'Игрок должен получить сообщение о порче улова.');
    });

    addTest('31. spoilage рыбы', 'Редкая рыба переживает первую смену времени, но портится на второй', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('raw_fish_rare', 1);
        game.state.stepsSinceTimeOfDayChange = 29;

        game.systems.movement.consumeActionTempo({
            virtualSteps: 1,
            silent: true,
            reasonLabel: 'во время теста'
        });

        assertEqual(inventoryRuntime.countInventoryItem('raw_fish_rare'), 1, 'После первой смены времени редкая рыба должна остаться свежей.');
        assertEqual(inventoryRuntime.countInventoryItem('spoiledFish'), 0, 'На первой смене времени редкая рыба не должна портиться.');

        game.state.stepsSinceTimeOfDayChange = 29;
        game.systems.movement.consumeActionTempo({
            virtualSteps: 1,
            silent: true,
            reasonLabel: 'во время теста'
        });

        assertEqual(inventoryRuntime.countInventoryItem('raw_fish_rare'), 0, 'После второй смены времени редкая рыба должна исчезнуть из сырого стека.');
        assertEqual(inventoryRuntime.countInventoryItem('spoiledFish'), 1, 'После второй смены времени редкая рыба должна перейти в spoiledFish.');
    });

    addTest('31. spoilage рыбы', 'Трофейная рыба не получает spoilage-профиль и не портится от времени', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('raw_fish_trophy', 1);

        for (let step = 0; step < 3; step++) {
            game.state.stepsSinceTimeOfDayChange = 29;
            game.systems.movement.consumeActionTempo({
                virtualSteps: 1,
                silent: true,
                reasonLabel: 'во время теста'
            });
        }

        assertEqual(inventoryRuntime.countInventoryItem('raw_fish_trophy'), 1, 'Трофейная рыба не должна портиться от обычного течения времени.');
        assertEqual(inventoryRuntime.countInventoryItem('spoiledFish'), 0, 'Трофейная рыба не должна превращаться в spoiledFish.');
    });

    addTest('31. spoilage рыбы', 'Переработанные рыбные продукты не подменяются системой spoilage', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('fishMeat', 1);
        const initialRationCount = inventoryRuntime.countInventoryItem('ration');

        for (let step = 0; step < 2; step++) {
            game.state.stepsSinceTimeOfDayChange = 29;
            game.systems.movement.consumeActionTempo({
                virtualSteps: 1,
                silent: true,
                reasonLabel: 'во время теста'
            });
        }

        assertEqual(inventoryRuntime.countInventoryItem('fishMeat'), 1, 'fishMeat не должен портиться через новый raw-fish spoilage слой.');
        assertEqual(inventoryRuntime.countInventoryItem('ration'), initialRationCount, 'ration не должен портиться через новый raw-fish spoilage слой.');
        assertEqual(inventoryRuntime.countInventoryItem('spoiledFish'), 0, 'Новый слой порчи не должен самопроизвольно создавать spoiledFish из готовых продуктов.');
    });

    addTest('31. spoilage рыбы', 'Сейв/лоад сохраняет таймер порчи сырой рыбы', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('raw_fish', 1);
        const fishStack = inventoryRuntime.getInventory().find((item) => item && item.id === 'raw_fish');
        const spoilageState = inventoryRuntime.getItemSpoilageState(fishStack);
        const snapshot = saveLoad.buildSaveSnapshot(game.state);
        const hydratedState = saveLoad.hydrateStateFromSnapshot(snapshot);
        const hydratedFish = hydratedState.inventory.find((item) => item && item.id === 'raw_fish');

        assert(spoilageState, 'Для сырой рыбы должен существовать spoilage state.');
        assert(hydratedFish, 'После загрузки сырая рыба должна сохраниться в инвентаре.');
        assertEqual(hydratedFish.spoilsAtAdvance, fishStack.spoilsAtAdvance, 'Таймер порчи должен переживать сейв/лоад.');
    });

    addTest('32. аварийная еда из рыбы', 'Прямой сухпаёк из улова помечен как аварийная рыбная еда', () => {
        const recipe = recipeRegistry.getRecipeDefinition('raw-fish-ration');

        assert(recipe, 'Рецепт raw-fish-ration должен существовать.');
        assert(Array.isArray(recipe.tags) && recipe.tags.includes('emergency'), 'raw-fish-ration должен быть помечен как emergency.');
        assert(recipe.tags.includes('fish'), 'raw-fish-ration должен оставаться рыбным рецептом.');
    });

    addTest('32. аварийная еда из рыбы', 'Рыбный бульон крафтится на лагере и возвращает пустую флягу', () => {
        resetHarness();
        game.state.activeInteraction = buildStationInteraction('camp');
        inventoryRuntime.addInventoryItem('fishMeat', 1);
        inventoryRuntime.addInventoryItem('fuelBundle', 1);
        inventoryRuntime.addInventoryItem('flask_water_full', 1);
        const emptyFlaskBefore = inventoryRuntime.countInventoryItem('flask_empty');

        const evaluation = craftingRuntime.evaluateRecipeAgainstInventory('fish-broth');
        const outcome = craftingRuntime.craftRecipeAgainstInventory('fish-broth');

        assert(evaluation.success, 'Рецепт fish-broth должен быть доступен на лагере.');
        assert(outcome && outcome.success, 'Рецепт fish-broth должен крафтиться успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('fishBroth'), 1, 'Игрок должен получить fishBroth.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_empty'), emptyFlaskBefore + 1, 'После fish-broth должна вернуться пустая фляга.');
    });

    addTest('32. аварийная еда из рыбы', 'Солёная рыба крафтится из рыбного мяса и соли выживания', () => {
        resetHarness();
        game.state.activeInteraction = buildStationInteraction('camp');
        inventoryRuntime.addInventoryItem('fishMeat', 1);
        inventoryRuntime.addInventoryItem('survivalSalt', 1);

        const evaluation = craftingRuntime.evaluateRecipeAgainstInventory('salted-fish');
        const outcome = craftingRuntime.craftRecipeAgainstInventory('salted-fish');

        assert(evaluation.success, 'Рецепт salted-fish должен быть доступен на лагере.');
        assert(outcome && outcome.success, 'Рецепт salted-fish должен крафтиться успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('fishMeat'), 0, 'На salted-fish должно уходить рыбное мясо.');
        assertEqual(inventoryRuntime.countInventoryItem('survivalSalt'), 0, 'На salted-fish должна уходить Соль выживания.');
        assertEqual(inventoryRuntime.countInventoryItem('saltedFish'), 1, 'Игрок должен получить saltedFish.');
    });

    addTest('32. аварийная еда из рыбы', 'Все рыбные emergency-рецепты доступны на нужной станции', () => {
        const recipeIds = ['raw-fish-ration', 'fish-broth', 'salted-fish'];

        recipeIds.forEach((recipeId) => {
            const recipe = recipeRegistry.getRecipeDefinition(recipeId);
            assert(recipe, `Не найден emergency-рецепт ${recipeId}.`);
            assertEqual(recipe.station, 'camp', `Рецепт ${recipeId} должен собираться на лагере.`);
        });
    });

    addTest('32. аварийная еда из рыбы', 'Рыбные emergency-рецепты различаются по стоимости и пользе', () => {
        const rationRecipe = recipeRegistry.getRecipeDefinition('raw-fish-ration');
        const brothRecipe = recipeRegistry.getRecipeDefinition('fish-broth');
        const saltedRecipe = recipeRegistry.getRecipeDefinition('salted-fish');
        const rationEffect = itemRegistry.getConsumableEffect('ration');
        const brothEffect = itemRegistry.getConsumableEffect('fishBroth');
        const saltedEffect = itemRegistry.getConsumableEffect('saltedFish');

        assert(rationRecipe.ingredients.length !== brothRecipe.ingredients.length || rationRecipe.ingredients.some((ingredient, index) => ingredient.id !== brothRecipe.ingredients[index].id), 'Сухпаёк и бульон не должны иметь одинаковую стоимость входов.');
        assert(saltedRecipe.ingredients.some((ingredient) => ingredient.id === 'survivalSalt'), 'Солёная рыба должна отличаться рецептом через Соль выживания.');
        assert(rationEffect && brothEffect && saltedEffect, 'Все три emergency-еды должны иметь consumable-эффект.');
        assert((brothEffect.energy || 0) > (saltedEffect.energy || 0), 'Рыбный бульон должен давать больше энергии, чем солёная рыба.');
        assert((rationEffect.hunger || 0) >= (brothEffect.hunger || 0), 'Сухпаёк должен оставаться самым сильным закрытием голода среди дешёвых emergency-вариантов.');
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
