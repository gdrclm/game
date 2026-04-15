(() => {
    const game = window.Game;
    const stateSchema = game.systems.stateSchema;
    const saveLoad = game.systems.saveLoad;
    const resourceRegistry = game.systems.resourceRegistry;
    const componentRegistry = game.systems.componentRegistry;
    const islandNeedProfile = game.systems.islandNeedProfile;
    const craftBalanceRuntime = game.systems.craftBalanceRuntime;
    const recipeRegistry = game.systems.recipeRegistry;
    const craftingRuntime = game.systems.craftingRuntime;
    const compressionRuntime = game.systems.compressionRuntime;
    const stationRuntime = game.systems.stationRuntime;
    const npcRegistry = game.systems.npcRegistry;
    const bagUpgradeRuntime = game.systems.bagUpgradeRuntime;
    const itemRegistry = game.systems.itemRegistry;
    const inventoryRuntime = game.systems.inventoryRuntime;
    const gameEvents = game.systems.gameEvents;
    const actionUi = game.systems.actionUi;
    const inventoryUi = game.systems.inventoryUi;
    const stationUi = game.systems.stationUi;
    const statusUi = game.systems.statusUi;
    const bridge = game.systems.uiBridge;
    const itemEffects = game.systems.itemEffects;
    const rewardScaling = game.systems.rewardScaling;
    const shopRuntime = game.systems.shopRuntime;
    const loot = game.systems.loot;
    const mapRuntime = game.systems.mapRuntime;
    const islandLayout = game.systems.islandLayout;
    const expeditionProgression = game.systems.expeditionProgression;
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

    function getRewardClassWeight(pool, rewardClass) {
        const entry = (Array.isArray(pool) ? pool : []).find((candidate) => candidate.rewardClass === rewardClass);
        return entry ? entry.weight : 0;
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

    function getCollapsedNodeText(node) {
        return node && typeof node.textContent === 'string'
            ? node.textContent.replace(/\s+/g, ' ').trim()
            : '';
    }

    function resetHarness() {
        game.state = stateSchema.createInitialState();
        game.state.currentIslandIndex = 25;
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
                label: kind === 'merchant'
                    ? 'Торговец'
                    : (kind === 'craft_merchant'
                        ? 'Ремесленный торговец'
                        : (kind === 'station_keeper'
                            ? 'Хранитель станции'
                            : (kind === 'artisan' ? 'Ремесленник' : 'Сундук'))),
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
                chunkRecord: options.chunkRecord || null,
                interactionMode: options.interactionMode || 'full'
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

    function getDefinitionCategories(definition) {
        if (!definition) {
            return [];
        }

        if (Array.isArray(definition.categories)) {
            return definition.categories.slice();
        }

        if (typeof definition.categories === 'string') {
            return definition.categories.split(/\s+/g).filter(Boolean);
        }

        return [];
    }

    function withTemporaryRecipeRegistry(extraDefinitions, fn) {
        const previousRegistry = game.systems.recipeRegistry;
        const mergedDefinitions = [
            ...previousRegistry.getRecipeDefinitions(),
            ...(Array.isArray(extraDefinitions) ? extraDefinitions : [extraDefinitions]).filter(Boolean)
        ];
        const builtRegistry = recipeRegistry.createValidatedRecipeRegistry(mergedDefinitions, {
            resourceRegistry,
            componentRegistry,
            devMode: true
        });
        const tempDefinitions = builtRegistry.definitions.map((definition) => cloneValue(definition));
        const tempById = Object.fromEntries(tempDefinitions.map((definition) => [definition.recipeId, cloneValue(definition)]));

        game.systems.recipeRegistry = {
            ...previousRegistry,
            recipes: tempDefinitions.map((definition) => cloneValue(definition)),
            getRecipeDefinition(recipeId) {
                const definition = tempById[recipeId];
                return definition ? cloneValue(definition) : null;
            },
            getRecipeDefinitions() {
                return tempDefinitions.map((definition) => cloneValue(definition));
            },
            getActiveRecipeDefinitions() {
                return tempDefinitions.map((definition) => cloneValue(definition));
            }
        };

        try {
            return fn(game.systems.recipeRegistry);
        } finally {
            game.systems.recipeRegistry = previousRegistry;
        }
    }

    function withTemporaryRecipeProfile(profileId, fn) {
        const previousProfileId = game && game.config ? game.config.craftingRecipeProfile : undefined;

        if (game && game.config) {
            game.config.craftingRecipeProfile = profileId;
        }

        try {
            return fn();
        } finally {
            if (game && game.config) {
                game.config.craftingRecipeProfile = previousProfileId;
            }
        }
    }

    function withTemporaryItemDefinitions(extraDefinitions, fn) {
        const definitions = Array.isArray(extraDefinitions) ? extraDefinitions : [extraDefinitions];
        const tempById = Object.fromEntries(definitions.filter(Boolean).map((definition) => [definition.id, cloneValue(definition)]));
        const previousGetItemDefinition = itemRegistry.getItemDefinition;
        const previousDescribeItem = itemRegistry.describeItem;
        const previousCreateInventoryItem = itemRegistry.createInventoryItem;
        const previousIsItemStackable = itemRegistry.isItemStackable;

        itemRegistry.getItemDefinition = function getItemDefinitionWithTemp(itemId) {
            const normalizedId = typeof itemId === 'string' ? itemId.trim() : '';
            if (tempById[normalizedId]) {
                return cloneValue(tempById[normalizedId]);
            }

            return typeof previousGetItemDefinition === 'function'
                ? previousGetItemDefinition.call(itemRegistry, itemId)
                : null;
        };

        itemRegistry.describeItem = function describeItemWithTemp(itemId) {
            const normalizedId = typeof itemId === 'string' ? itemId.trim() : '';
            if (tempById[normalizedId]) {
                return tempById[normalizedId].description || tempById[normalizedId].label || normalizedId;
            }

            return typeof previousDescribeItem === 'function'
                ? previousDescribeItem.call(itemRegistry, itemId)
                : '';
        };

        itemRegistry.createInventoryItem = function createInventoryItemWithTemp(itemId, quantity = 1, metadata = {}) {
            const normalizedId = typeof itemId === 'string' ? itemId.trim() : '';
            const tempDefinition = tempById[normalizedId];

            if (tempDefinition) {
                const passthroughMetadata = Object.fromEntries(Object.entries(metadata || {}).filter(([key]) => ![
                    'id',
                    'icon',
                    'label',
                    'quantity',
                    'obtainedIslandIndex',
                    'useCount'
                ].includes(key)));

                return {
                    ...passthroughMetadata,
                    id: tempDefinition.id,
                    icon: tempDefinition.icon || '?',
                    label: tempDefinition.label || tempDefinition.id,
                    quantity: Math.max(1, quantity || 1),
                    obtainedIslandIndex: Number.isFinite(metadata.obtainedIslandIndex)
                        ? metadata.obtainedIslandIndex
                        : Math.max(1, game.state.currentIslandIndex || 1),
                    useCount: Math.max(0, metadata.useCount || 0)
                };
            }

            return typeof previousCreateInventoryItem === 'function'
                ? previousCreateInventoryItem.call(itemRegistry, itemId, quantity, metadata)
                : null;
        };

        itemRegistry.isItemStackable = function isItemStackableWithTemp(itemId) {
            const normalizedId = typeof itemId === 'string' ? itemId.trim() : '';
            if (tempById[normalizedId]) {
                return Boolean(tempById[normalizedId].stackable);
            }

            return typeof previousIsItemStackable === 'function'
                ? previousIsItemStackable.call(itemRegistry, itemId)
                : false;
        };

        try {
            return fn();
        } finally {
            itemRegistry.getItemDefinition = previousGetItemDefinition;
            itemRegistry.describeItem = previousDescribeItem;
            itemRegistry.createInventoryItem = previousCreateInventoryItem;
            itemRegistry.isItemStackable = previousIsItemStackable;
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
        const requiredIds = ['healing_base', 'herb_paste', 'fiber_rope', 'wood_plank_basic', 'wood_frame_basic', 'boatFrame', 'gravel_fill', 'stone_block', 'fuel_bundle', 'fish_meat', 'fish_oil'];

        requiredIds.forEach((componentId) => {
            const component = componentRegistry.getComponentDefinition(componentId);
            assert(component, `Не найден компонент ${componentId}.`);
            assert(Array.isArray(component.ingredients) && component.ingredients.length > 0, `У компонента ${componentId} нет ingredients.`);
            assert(Array.isArray(component.sourceTags) && component.sourceTags.length > 0, `У компонента ${componentId} нет sourceTags.`);
        });
    });

    addTest('2. component-registry.js', 'Каждый промежуточный компонент имеет первоклассный inventory-item прямо в registry', () => {
        componentRegistry.getComponentDefinitions().forEach((component) => {
            assert(component.inventoryItem && component.inventoryItem.id, `У компонента ${component.id} нет inventoryItem.id.`);
            assert(component.inventoryItem && component.inventoryItem.icon, `У компонента ${component.id} нет inventoryItem.icon.`);
            assert(component.inventoryItem && component.inventoryItem.categories, `У компонента ${component.id} нет inventoryItem.categories.`);
            assert(componentRegistry.isComponentInventoryItem(component.inventoryItem.id), `Item ${component.inventoryItem.id} не распознан как компонентный.`);
            assertEqual(componentRegistry.getComponentDefinitionByInventoryItemId(component.inventoryItem.id).id, component.id, `Lookup по item id сломан для ${component.id}.`);
            assert(itemRegistry.getItemDefinition(component.inventoryItem.id), `Каталог предметов не содержит компонентный item ${component.inventoryItem.id}.`);
        });
    });

    addTest('33. registry ownership компонентов', 'Компонентные item definitions больше не живут ad-hoc вне registry', () => {
        const registryComponentItemIds = new Set(componentRegistry.getComponentDefinitions()
            .map((component) => component && component.inventoryItem && component.inventoryItem.id)
            .filter(Boolean));
        const catalogComponentDefinitions = itemRegistry.getCatalogDefinitions()
            .filter((definition) => getDefinitionCategories(definition).includes('component'));

        catalogComponentDefinitions.forEach((definition) => {
            assert(registryComponentItemIds.has(definition.id), `Компонентный item ${definition.id} найден в каталоге вне component-registry.`);
            assert(componentRegistry.isComponentInventoryItem(definition.id), `Компонентный item ${definition.id} не распознан как registry-owned.`);
        });

        assertEqual(catalogComponentDefinitions.length, registryComponentItemIds.size, 'В item catalog не должно оставаться лишних ad-hoc component items.');
    });

    addTest('33. registry ownership компонентов', 'Любой runtime берёт component только из registry', () => {
        craftingRuntime.getCompiledRecipes().forEach((recipe) => {
            recipe.ingredients
                .filter((ingredient) => ingredient && ingredient.kind === 'component')
                .forEach((ingredient) => {
                    assert(componentRegistry.getComponentDefinition(ingredient.id), `Runtime-рецепт ${recipe.recipeId} использует неописанный компонент ${ingredient.id}.`);
                    assert(ingredient.gameplaySupport && ingredient.gameplaySupport.supported, `Runtime-рецепт ${recipe.recipeId} не получил gameplay binding для компонента ${ingredient.id}.`);
                });

            if (recipe.result && recipe.result.kind === 'component') {
                assert(componentRegistry.getComponentDefinition(recipe.result.id), `Runtime-рецепт ${recipe.recipeId} выдаёт неописанный компонент ${recipe.result.id}.`);
                assert(recipe.resultGameplaySupport && recipe.resultGameplaySupport.supported, `Runtime-рецепт ${recipe.recipeId} не получил output binding для компонента ${recipe.result.id}.`);
            }
        });
    });

    addTest('33. registry ownership компонентов', 'Dev-check ловит дубли component ids', () => {
        assertThrows(() => componentRegistry.createValidatedComponentRegistry([
            {
                id: 'duplicate_component',
                label: 'Дубль 1',
                qualityLevel: 'ordinary',
                merchantInterest: ['merchant'],
                bulk: 1,
                craftMethod: 'hand',
                sourceResourceIds: ['grass'],
                resourceInputs: [{ resourceId: 'grass', quantity: 5 }],
                tags: ['healing'],
                inventoryItem: {
                    id: 'duplicateComponentA',
                    icon: 'D1',
                    categories: 'component material'
                }
            },
            {
                id: 'duplicate_component',
                label: 'Дубль 2',
                qualityLevel: 'ordinary',
                merchantInterest: ['merchant'],
                bulk: 1,
                craftMethod: 'hand',
                sourceResourceIds: ['grass'],
                resourceInputs: [{ resourceId: 'grass', quantity: 5 }],
                tags: ['survival'],
                inventoryItem: {
                    id: 'duplicateComponentB',
                    icon: 'D2',
                    categories: 'component material'
                }
            }
        ], {
            resourceRegistry,
            devMode: true
        }), /Duplicate component id "duplicate_component"/i);
    });

    addTest('2. component-registry.js', 'Компоненты поздней игры получают канонический qualityLevel и пробрасывают его в item definition', () => {
        const qualityCases = [
            ['healing_base', 'ordinary', 'обычный'],
            ['fiber_rope', 'enhanced', 'усиленный'],
            ['stone_block', 'stable', 'стабильный'],
            ['fish_oil', 'rare', 'редкий'],
            ['boatFrame', 'rare', 'редкий']
        ];

        qualityCases.forEach(([componentId, expectedQualityLevel, expectedQualityLabel]) => {
            const component = componentRegistry.getComponentDefinition(componentId);
            const itemDefinition = component && component.inventoryItem && component.inventoryItem.id
                ? itemRegistry.getItemDefinition(component.inventoryItem.id)
                : null;

            assert(component, `Не найден компонент ${componentId}.`);
            assertEqual(component.qualityLevel, expectedQualityLevel, `У ${componentId} неверный qualityLevel.`);
            assertEqual(component.qualityLabel, expectedQualityLabel, `У ${componentId} неверный qualityLabel.`);
            assert(itemDefinition, `У ${componentId} отсутствует item definition.`);
            assertEqual(itemDefinition.qualityLevel, expectedQualityLevel, `Item definition ${componentId} не получил qualityLevel.`);
            assertEqual(itemDefinition.qualityLabel, expectedQualityLabel, `Item definition ${componentId} не получил qualityLabel.`);
        });
    });

    addTest('2. component-registry.js', 'Компонент не может ссылаться на несуществующий raw-resource', () => {
        assertThrows(() => componentRegistry.createValidatedComponentRegistry([
            {
                id: 'broken-component',
                label: 'Сломанный компонент',
                qualityLevel: 'ordinary',
                merchantInterest: ['merchant'],
                bulk: 1,
                craftMethod: 'hand',
                sourceResourceIds: ['ghostResource'],
                resourceInputs: [{ resourceId: 'ghostResource', quantity: 5 }],
                tags: ['building'],
                inventoryItem: {
                    id: 'brokenComponent',
                    icon: 'BC',
                    categories: 'component material'
                }
            }
        ], {
            resourceRegistry,
            devMode: true
        }), /unknown raw resource "ghostResource"/i);
    });

    addTest('2. component-registry.js', 'Компонент не принимает неизвестный qualityLevel', () => {
        assertThrows(() => componentRegistry.createValidatedComponentRegistry([
            {
                id: 'broken-quality-component',
                label: 'Сломанный quality-компонент',
                qualityLevel: 'mythic',
                merchantInterest: ['merchant'],
                bulk: 1,
                craftMethod: 'hand',
                sourceResourceIds: ['grass'],
                resourceInputs: [{ resourceId: 'grass', quantity: 5 }],
                tags: ['healing'],
                inventoryItem: {
                    id: 'brokenQualityComponent',
                    icon: 'BQ',
                    categories: 'component material'
                }
            }
        ], {
            resourceRegistry,
            devMode: true
        }), /qualityLevel/i);
    });

    addTest('2. component-registry.js', 'Компонент не принимает неизвестный crafting tag', () => {
        assertThrows(() => componentRegistry.createValidatedComponentRegistry([
            {
                id: 'broken-tag-component',
                label: 'Сломанный tag-компонент',
                qualityLevel: 'ordinary',
                merchantInterest: ['merchant'],
                bulk: 1,
                craftMethod: 'hand',
                sourceResourceIds: ['grass'],
                resourceInputs: [{ resourceId: 'grass', quantity: 5 }],
                tags: ['healing', 'alchemy'],
                inventoryItem: {
                    id: 'brokenTagComponent',
                    icon: 'BT',
                    categories: 'component material'
                }
            }
        ], {
            resourceRegistry,
            devMode: true
        }), /unknown crafting tags: alchemy/i);
    });

    addTest('38. bulk pressure', 'Строительные компоненты и мостовые сборки получают каноничный bulk', () => {
        const componentCases = [
            ['fiber_rope', 1],
            ['wood_plank_basic', 2],
            ['wood_frame_basic', 4],
            ['boatFrame', 6],
            ['gravel_fill', 2],
            ['stone_block', 3]
        ];

        componentCases.forEach(([componentId, expectedBulk]) => {
            const component = componentRegistry.getComponentDefinition(componentId);
            const itemDefinition = itemRegistry.getItemDefinition(componentId);

            assert(component, `Компонент ${componentId} не найден.`);
            assert(itemDefinition, `Item definition ${componentId} не найден.`);
            assertEqual(component.bulk, expectedBulk, `У ${componentId} неверный bulk.`);
            assertEqual(itemDefinition.bulk, expectedBulk, `Item definition ${componentId} не получил bulk.`);
        });

        const portableBridge = itemRegistry.getItemDefinition('portableBridge');
        assert(portableBridge, 'portableBridge должен существовать в каталоге.');
        assertEqual(portableBridge.bulk, 6, 'portableBridge должен иметь тяжёлый bulk.');
    });

    addTest('38. bulk pressure', 'Сумка может упереться в bulk даже при свободных слотах', () => {
        resetHarness();
        game.state.unlockedInventorySlots = 4;
        const occupiedSlotsBefore = inventoryRuntime.getInventory()
            .slice(0, inventoryRuntime.getUnlockedInventorySlots())
            .filter(Boolean)
            .length;

        const firstOutcome = inventoryRuntime.addInventoryItem('boatFrame', 2);
        assert(firstOutcome && firstOutcome.added, 'Первые лодочные рамы должны добавиться.');
        assertEqual(inventoryRuntime.getInventoryBulkCapacity(), 16, 'Стартовая bulk-вместимость должна масштабироваться от слотов.');
        assertEqual(inventoryRuntime.getInventoryBulkUsage(), 12, 'Две рамы лодки должны заметно нагрузить сумку.');
        assertEqual(
            inventoryRuntime.getInventory().slice(0, inventoryRuntime.getUnlockedInventorySlots()).filter(Boolean).length,
            occupiedSlotsBefore + 1,
            'Лодочные рамы должны добавиться одним визуальным стеком и не съесть несколько слотов.'
        );

        const failedOutcome = inventoryRuntime.addInventoryItem('portableBridge', 1);
        assert(failedOutcome && !failedOutcome.added, 'Переносной мост не должен влезать по bulk.');
        assertEqual(failedOutcome.reason, 'full', 'Отказ должен проходить через обычный inventory-full канал.');
        assertEqual(failedOutcome.capacityType, 'bulk', 'Отказ должен быть именно по bulk, а не по слотам.');
        assertEqual(
            inventoryRuntime.getInventory().slice(0, inventoryRuntime.getUnlockedInventorySlots()).filter(Boolean).length,
            occupiedSlotsBefore + 1,
            'После отказа по bulk количество занятых визуальных слотов не должно меняться.'
        );
    });

    addTest('38. bulk pressure', 'Compression и craft runtime не обходят bulk-лимит сумки', () => {
        resetHarness();
        game.state.unlockedInventorySlots = 4;

        inventoryRuntime.addInventoryItem('boatFrame', 2);
        inventoryRuntime.addInventoryItem('fish_oil', 2);
        inventoryRuntime.addInventoryItem('raw_wood', 5);

        const plankEvaluation = compressionRuntime.evaluateCompressionForSourceItem('raw_wood')
            .find((entry) => entry && entry.recipe && entry.recipe.result && entry.recipe.result.id === 'wood_plank_basic');

        assert(plankEvaluation, 'Должна существовать compression-проверка на wood_plank_basic.');
        assert(!plankEvaluation.success, 'Compression не должен проходить при перегрузе по bulk.');
        assertEqual(plankEvaluation.reason, 'inventory-full', 'Compression должен отказывать через inventory-full.');
        assertEqual(plankEvaluation.capacityType, 'bulk', 'Compression должен видеть именно bulk-перегруз.');
    });

    addTest('38. bulk pressure', 'Bulk не ломает stack logic для тяжёлых компонентов', () => {
        resetHarness();
        const firstOutcome = inventoryRuntime.addInventoryItem('stone_block', 1);
        const secondOutcome = inventoryRuntime.addInventoryItem('stone_block', 2);
        const activeStacks = inventoryRuntime.getInventory()
            .slice(0, inventoryRuntime.getUnlockedInventorySlots())
            .filter((item) => item && item.id === 'stone_block');

        assert(firstOutcome && firstOutcome.added, 'Первый stone_block должен добавиться.');
        assert(secondOutcome && secondOutcome.added, 'Повторное добавление stone_block должно стакаться.');
        assertEqual(activeStacks.length, 1, 'Тяжёлый компонент должен оставаться одним стеком.');
        assertEqual(activeStacks[0].quantity, 3, 'Количество в тяжёлом стеке должно суммироваться корректно.');
        assertEqual(inventoryRuntime.getInventoryBulkUsage(), 9, 'Bulk usage должен учитывать количество внутри тяжёлого стека.');
    });

    addTest('39. merchant_interest', 'Компоненты получают канонический merchant_interest и пробрасывают его в item definition', () => {
        const cases = [
            ['fiber_rope', ['bridgewright', 'quartermaster', 'junkDealer']],
            ['wood_plank_basic', ['bridgewright', 'quartermaster']],
            ['fish_oil', ['fisherman', 'bridgewright', 'collector']]
        ];

        cases.forEach(([componentId, expectedMerchantInterest]) => {
            const component = componentRegistry.getComponentDefinition(componentId);
            const itemDefinition = itemRegistry.getItemDefinition(componentId);

            assert(component, `Компонент ${componentId} должен существовать.`);
            assert(itemDefinition, `Item definition ${componentId} должен существовать.`);
            assertDeepEqual(component.merchantInterest, expectedMerchantInterest, `У ${componentId} неверный merchantInterest.`);
            assertDeepEqual(itemDefinition.merchantInterest, expectedMerchantInterest, `Item definition ${componentId} не получил merchantInterest.`);
        });
    });

    addTest('39. merchant_interest', 'Заинтересованный торговец принимает качественную заготовку, а неподходящий отказывает', () => {
        resetHarness();
        game.state.currentIslandIndex = 14;
        const bridgewrightEncounter = shopRuntime.prepareMerchantEncounter(buildTestHouse('merchant', 6, 6, {
            merchantRole: 'bridgewright',
            stock: [],
            quest: null
        }));
        const storytellerEncounter = shopRuntime.prepareMerchantEncounter(buildTestHouse('merchant', 8, 8, {
            merchantRole: 'storyteller',
            stock: [],
            quest: null
        }));
        const basePlankPrice = game.systems.pricing.getMerchantSellPrice('wood_plank_basic', 14);
        const acceptedOffer = shopRuntime.getMerchantSellOffer(bridgewrightEncounter, 'wood_plank_basic');
        const rejectedOffer = shopRuntime.getMerchantSellOffer(storytellerEncounter, 'wood_plank_basic');
        const rationOffer = shopRuntime.getMerchantSellOffer(storytellerEncounter, 'ration');

        assert(acceptedOffer && acceptedOffer.accepted, 'Мостовик должен принимать строительную заготовку.');
        assert(acceptedOffer.matchedInterest, 'Принятая заготовка должна идти именно по merchant_interest.');
        assert(acceptedOffer.price > basePlankPrice, 'Заинтересованный торговец должен платить за качественную заготовку больше базовой цены.');
        assert(rejectedOffer && !rejectedOffer.accepted, 'Неподходящий торговец не должен принимать чужую заготовку.');
        assert(/заготовк/i.test(rejectedOffer.message || ''), 'Отказ должен явно объяснять, что торговца не интересует эта заготовка.');
        assert(rationOffer && rationOffer.accepted, 'Обычный товар без component-layer должен продаваться как раньше.');
    });

    addTest('39. merchant_interest', 'Bridgewright и similar роли получают bias к компонентным заказам через merchant_interest', () => {
        const preferredBridgewrightIds = new Set(shopRuntime.getMerchantPreferredComponentItemIds('bridgewright'));
        const neutralPreferredIds = shopRuntime.getMerchantPreferredComponentItemIds('storyteller');
        const basePool = itemRegistry.buildWeightedCatalogPool('merchantQuestWeight', 14, {
            includeTierZero: true
        });
        const biasedPool = itemRegistry.buildWeightedCatalogPool('merchantQuestWeight', 14, {
            includeTierZero: true,
            preferredItemIds: [...preferredBridgewrightIds]
        });
        const basePlankEntry = basePool.find((entry) => entry && entry.definition && entry.definition.id === 'wood_plank_basic');
        const biasedPlankEntry = biasedPool.find((entry) => entry && entry.definition && entry.definition.id === 'wood_plank_basic');

        assert(preferredBridgewrightIds.has('wood_plank_basic') && preferredBridgewrightIds.has('fiber_rope'), 'Bridgewright должен явно интересоваться досками и верёвкой.');
        assert(neutralPreferredIds.length === 0, 'Storyteller не должен получать строительный component-interest.');
        assert(basePlankEntry && biasedPlankEntry, 'wood_plank_basic должен присутствовать в merchant quest pool.');
        assert(biasedPlankEntry.weight > basePlankEntry.weight, 'merchant_interest должен реально усиливать вес нужных компонентных заказов.');
    });

    addTest('39. merchant_interest', 'Компоненты участвуют в merchant quest/category matching через registry-веса', () => {
        const bridgewrightPool = itemRegistry.buildWeightedCatalogPool('merchantQuestWeight', 14, {
            includeTierZero: true,
            preferredItemIds: shopRuntime.getMerchantPreferredComponentItemIds('bridgewright')
        });
        const ropeEntry = bridgewrightPool.find((entry) => entry && entry.definition && entry.definition.id === 'fiber_rope');
        const oilEntry = bridgewrightPool.find((entry) => entry && entry.definition && entry.definition.id === 'fish_oil');

        assert(ropeEntry && ropeEntry.weight > 0, 'fiber_rope должен участвовать в matching торговых заказов.');
        assert(oilEntry && oilEntry.weight > 0, 'fish_oil должен участвовать в matching торговых заказов.');
    });

    addTest('70. merchant island windows', 'Интендант получает отдельные раннее, среднее и позднее окна ассортимента', () => {
        const earlyWindow = shopRuntime.getMerchantIslandWindowProfile('quartermaster', 3);
        const midWindow = shopRuntime.getMerchantIslandWindowProfile('quartermaster', 10);
        const lateWindow = shopRuntime.getMerchantIslandWindowProfile('quartermaster', 23);

        assert(earlyWindow, 'Для раннего интенданта должен существовать island window profile.');
        assert(midWindow, 'Для среднего интенданта должен существовать island window profile.');
        assert(lateWindow, 'Для позднего интенданта должен существовать island window profile.');
        assertEqual(earlyWindow.windowId, 'early-sustain', 'Раннее окно интенданта выбрано неверно.');
        assertEqual(midWindow.windowId, 'mid-route', 'Среднее окно интенданта выбрано неверно.');
        assertEqual(lateWindow.windowId, 'late-catalyst', 'Позднее окно интенданта выбрано неверно.');
        assert(earlyWindow.guaranteedItemIds.includes('fuel_bundle') && earlyWindow.guaranteedItemIds.includes('flask_water_full'), 'Ранний интендант должен держать воду и топливо.');
        assert(midWindow.guaranteedItemIds.includes('wood_plank_basic') && midWindow.guaranteedItemIds.includes('fiber_rope'), 'Средний интендант должен держать доски и верёвки.');
        assert(lateWindow.guaranteedItemIds.includes('fish_oil') && lateWindow.guaranteedItemIds.includes('wood_frame_basic'), 'Поздний интендант должен держать редкие катализаторы и качественные компоненты.');
    });

    addTest('70. merchant island windows', 'Интендант реально получает якорный товар своего окна в stock generation', () => {
        const earlyStock = shopRuntime.createMerchantStock(3, () => 0.15, { merchantRole: 'quartermaster' });
        const midStock = shopRuntime.createMerchantStock(10, () => 0.15, { merchantRole: 'quartermaster' });
        const lateStock = shopRuntime.createMerchantStock(23, () => 0.15, { merchantRole: 'quartermaster' });
        const earlyIds = earlyStock.map((entry) => entry.itemId);
        const midIds = midStock.map((entry) => entry.itemId);
        const lateIds = lateStock.map((entry) => entry.itemId);

        assert(
            earlyIds.some((itemId) => ['fuel_bundle', 'flask_empty', 'flask_water_full'].includes(itemId)),
            'Ранний интендант должен реально держать воду или топливо.'
        );
        assert(
            midIds.some((itemId) => ['wood_plank_basic', 'fiber_rope'].includes(itemId)),
            'Средний интендант должен реально держать доски или верёвки.'
        );
        assert(
            lateIds.some((itemId) => ['fish_oil', 'wood_frame_basic', 'boatFrame'].includes(itemId)),
            'Поздний интендант должен реально держать редкий катализатор или качественный компонент.'
        );
    });

    addTest('70. merchant island windows', 'Component bias quartermaster меняется вместе с окном островов', () => {
        const earlyPreferredIds = shopRuntime.getMerchantPreferredComponentItemIds('quartermaster', 3);
        const midPreferredIds = shopRuntime.getMerchantPreferredComponentItemIds('quartermaster', 10);
        const latePreferredIds = shopRuntime.getMerchantPreferredComponentItemIds('quartermaster', 23);

        assert(earlyPreferredIds.includes('fuel_bundle'), 'Ранний quartermaster должен предпочитать fuel_bundle.');
        assertEqual(earlyPreferredIds.includes('wood_plank_basic'), false, 'Ранний quartermaster не должен жить в средних строительных заготовках.');
        assert(midPreferredIds.includes('wood_plank_basic') && midPreferredIds.includes('fiber_rope'), 'Средний quartermaster должен предпочитать доски и верёвки.');
        assertEqual(midPreferredIds.includes('fuel_bundle'), false, 'Средний quartermaster не должен оставаться в чистом раннем survival bias.');
        assert(latePreferredIds.includes('fish_oil') && latePreferredIds.includes('wood_frame_basic'), 'Поздний quartermaster должен предпочитать поздние качественные компоненты.');
    });

    addTest('75. island need profile', 'Таблица покрывает острова 1-30 без дыр и отдаёт правильные окна', () => {
        const windows = islandNeedProfile.islandNeedWindows;
        const firstWindow = islandNeedProfile.getIslandNeedWindow(1);
        const firstBridgeWindow = islandNeedProfile.getIslandNeedWindow(5);
        const waterWindow = islandNeedProfile.getIslandNeedWindow(17);
        const finalWindow = islandNeedProfile.getIslandNeedWindow(30);

        assert(Array.isArray(windows) && windows.length === 11, 'Должно существовать 11 окон островной need-table.');
        assertEqual(windows[0].islandFrom, 1, 'Покрытие должно начинаться с острова 1.');
        assertEqual(windows[0].islandTo, 3, 'Первое окно должно закрывать острова 1-3.');
        assertEqual(windows[windows.length - 1].islandFrom, 30, 'Последнее окно должно начинаться на острове 30.');
        assertEqual(windows[windows.length - 1].islandTo, 30, 'Последнее окно должно закрывать только финальный остров.');
        assertEqual(firstWindow.windowId, '1-3-survival', 'Остров 1 должен попадать в стартовое окно.');
        assertEqual(firstBridgeWindow.windowId, '4-6-first-bridge', 'Остров 5 должен попадать в окно первого моста.');
        assertEqual(waterWindow.windowId, '16-18-water-stage', 'Остров 17 должен попадать в водное окно.');
        assertEqual(finalWindow.windowId, '30-finale', 'Остров 30 должен попадать в финальное окно.');
    });

    addTest('75. island need profile', 'Окна первого моста, лодки и коллекционерского этапа раскладывают mandatory/recommended/optional по дизайну', () => {
        const firstBridgeWindow = islandNeedProfile.getIslandNeedWindow(5);
        const waterWindow = islandNeedProfile.getIslandNeedWindow(17);
        const collectorWindow = islandNeedProfile.getIslandNeedWindow(23);

        assertDeepEqual(
            firstBridgeWindow.mandatory.resources,
            ['raw_wood', 'raw_grass', 'raw_stone'],
            'Окно 4-6 должно требовать дерево, траву и камень как базу первого моста.'
        );
        assertDeepEqual(
            firstBridgeWindow.mandatory.branches,
            ['fiber_rope', 'first_bridge', 'survival_food'],
            'Окно 4-6 должно собираться вокруг верёвки, первого моста и еды.'
        );
        assertDeepEqual(
            firstBridgeWindow.recommended.branches,
            ['cheap_healing', 'fuel_prep'],
            'В окне первого моста лечение и топливо должны быть рекомендованными, а не базовыми ветками.'
        );
        assertDeepEqual(
            waterWindow.mandatory.resources,
            ['raw_wood', 'fish_oil', 'raw_grass'],
            'Окно 16-18 должно жёстко требовать дерево, рыбий жир и траву.'
        );
        assertDeepEqual(
            waterWindow.mandatory.branches,
            ['boat_ready', 'water_escape', 'safehouse_protection'],
            'Окно 16-18 должно жёстко держаться на лодке, воде и защите укрытий.'
        );
        assertDeepEqual(
            collectorWindow.mandatory.resources,
            ['raw_wood', 'paper', 'valuables'],
            'Окно 22-24 должно переносить фокус на бумагу и ценности.'
        );
        assertDeepEqual(
            collectorWindow.optional.branches,
            ['repair_support'],
            'Коллекционерское окно должно держать ремонт как вторичную ветку, а не как основу.'
        );
    });

    addTest('75. island need profile', 'Expanded view отдаёт человекочитаемые ресурсы и убирает greed из финала', () => {
        const expandedWaterWindow = islandNeedProfile.getExpandedNeedWindow(17);
        const expandedFinalWindow = islandNeedProfile.getExpandedNeedWindow(30);
        const mandatoryBranchLabels = expandedWaterWindow.mandatory.branches.map((branch) => branch.label);
        const finalOptionalBranchLabels = expandedFinalWindow.optional.branches.map((branch) => branch.label);
        const finalMandatoryResourceLabels = expandedFinalWindow.mandatory.resources.map((resource) => resource.label);

        assert(mandatoryBranchLabels.includes('Готовая лодка'), 'Expanded view должен отдавать лодку как человекочитаемую обязательную ветку.');
        assert(mandatoryBranchLabels.includes('Запас воды и спасение'), 'Expanded view должен отдавать спасательную водную ветку.');
        assert(finalMandatoryResourceLabels.includes('Вода'), 'Финальное окно должно явно оставлять воду в обязательных ресурсах.');
        assertEqual(finalOptionalBranchLabels.length, 0, 'На финальном острове не должно оставаться optional greed-веток.');
    });

    addTest('76. progression craft requirements', 'Progression runtime сводит ранние, средние и поздние острова к разным craft-pressure фазам', () => {
        const earlySummary = expeditionProgression.getIslandCraftRequirementSummary(2);
        const midSummary = expeditionProgression.getIslandCraftRequirementSummary(8);
        const lateSummary = expeditionProgression.getIslandCraftRequirementSummary(17);

        assertEqual(earlySummary.phaseId, expeditionProgression.CRAFT_REQUIREMENT_PHASES.survival, 'Ранние острова должны жить в survival-фазе.');
        assertEqual(midSummary.phaseId, expeditionProgression.CRAFT_REQUIREMENT_PHASES.bridge, 'Средние острова должны жить в мостовой фазе.');
        assertEqual(lateSummary.phaseId, expeditionProgression.CRAFT_REQUIREMENT_PHASES.advanced, 'Поздние острова должны жить в поздней логистической фазе.');
        assertEqual(earlySummary.summaryLabel, 'вода и еда', 'Ранняя фаза должна явно требовать воду и еду.');
        assertEqual(midSummary.summaryLabel, 'мосты и маршрут', 'Средняя фаза должна явно требовать мосты и маршрут.');
        assertEqual(lateSummary.summaryLabel, 'лодка, ремонт и сильные расходники', 'Поздняя фаза должна явно требовать лодку, ремонт и сильные расходники.');
        assert(earlySummary.mandatoryResources.includes('water') && earlySummary.mandatoryBranches.includes('survival_food'), 'Ранний runtime-слой должен включать воду и еду.');
        assert(midSummary.mandatoryBranches.includes('bridge_repair') && midSummary.recommendedBranches.includes('boat_frame'), 'Средняя фаза должна вести через мостовой ремонт и подготовку лодки.');
        assert(lateSummary.mandatoryBranches.includes('boat_ready'), 'Поздняя фаза должна явно требовать готовую лодку.');
        assert(lateSummary.recommendedBranches.includes('repair_support') && lateSummary.recommendedBranches.includes('strong_survival'), 'Поздняя фаза должна тащить ремонт и сильные расходники.');
    });

    addTest('76. progression craft requirements', 'Island progression records получают встроенный craft-need snapshot и phase summary', () => {
        resetHarness();
        expeditionProgression.resetArchipelago();

        const earlyIsland = expeditionProgression.getIslandRecord(2);
        const midIsland = expeditionProgression.getIslandRecord(8);
        const lateIsland = expeditionProgression.getIslandRecord(17);

        assert(earlyIsland && earlyIsland.progression, 'Остров 2 должен собраться вместе с progression record.');
        assert(midIsland && midIsland.progression, 'Остров 8 должен собраться вместе с progression record.');
        assert(lateIsland && lateIsland.progression, 'Остров 17 должен собраться вместе с progression record.');
        assertEqual(earlyIsland.progression.craftNeedWindowId, '1-3-survival', 'Ранний island record должен получать survival-window.');
        assertEqual(midIsland.progression.craftNeedWindowId, '7-9-repair-and-fish', 'Остров 8 должен получать своё среднее need-window.');
        assertEqual(lateIsland.progression.craftNeedWindowId, '16-18-water-stage', 'Остров 17 должен получать водное need-window.');
        assertEqual(midIsland.progression.craftRequirementPhaseId, expeditionProgression.CRAFT_REQUIREMENT_PHASES.bridge, 'Остров 8 должен маркироваться как bridge-фаза.');
        assertEqual(lateIsland.progression.craftRequirementSummary, 'лодка, ремонт и сильные расходники', 'Остров 17 должен иметь поздний craft summary.');
        assert(lateIsland.progression.craftNeedMandatoryBranches.includes('boat_ready'), 'Лодочная ветка должна быть встроена прямо в progression record.');
    });

    addTest('76. progression craft requirements', 'Arrival message использует progression craft pressure для островных подсказок', () => {
        resetHarness();
        const previousTile = createTileInfo(0, 0, 'grass', {
            progression: expeditionProgression.decorateProgressionWithCraftRequirements(buildProgression(3))
        });
        const currentTile = createTileInfo(1, 0, 'grass', {
            progression: expeditionProgression.decorateProgressionWithCraftRequirements(buildProgression(8))
        });
        const arrivalMessage = buildIslandArrivalMessage(previousTile, currentTile, true);

        assert(/мост/i.test(arrivalMessage), 'Arrival message должен подсказывать мостовой фокус средних островов.');
        assert(/маршрут/i.test(arrivalMessage), 'Arrival message должен подсказывать маршрутный фокус средних островов.');
    });

    addTest('84. craft balance audit', 'Базовый completion-path существует без требования закрывать весь craft tree', () => {
        const audit = craftBalanceRuntime.buildCraftTreeBalanceAudit();

        assertEqual(audit.pass, true, 'Баланс-аудит должен проходить на реальных данных.');
        assertEqual(audit.baselineCompletionPossible, true, 'Игра должна оставаться проходимой по базовому completion-path.');
        assertEqual(audit.requiresFullCraftTree, false, 'Полное закрытие всех craft branches не должно быть обязательным.');
        assert(audit.baselineBranchIds.includes('water_cycle') && audit.baselineBranchIds.includes('first_bridge') && audit.baselineBranchIds.includes('boat_ready'), 'Базовый completion-path должен держаться на воде, мосте и лодке.');
        assert(audit.specializationBranchIds.includes('trade_values') && audit.specializationBranchIds.includes('collector_loadout') && audit.specializationBranchIds.includes('heavy_utility'), 'Вне baseline должны оставаться специализационные ветки.');
    });

    addTest('84. craft balance audit', 'Аудит падает, если из базового прохождения выпадает обязательная ветка', () => {
        const brokenWindows = islandNeedProfile.islandNeedWindows.map((windowDefinition) => ({
            ...windowDefinition,
            mandatory: {
                ...(windowDefinition.mandatory || {}),
                branches: (windowDefinition.mandatory && Array.isArray(windowDefinition.mandatory.branches)
                    ? windowDefinition.mandatory.branches
                    : []).filter((branchId) => branchId !== 'first_bridge')
            },
            recommended: {
                ...(windowDefinition.recommended || {}),
                branches: (windowDefinition.recommended && Array.isArray(windowDefinition.recommended.branches)
                    ? windowDefinition.recommended.branches
                    : []).filter((branchId) => branchId !== 'first_bridge')
            }
        }));
        const audit = craftBalanceRuntime.buildCraftTreeBalanceAudit({
            needWindows: brokenWindows
        });

        assertEqual(audit.pass, false, 'Без first_bridge балансный check должен падать.');
        assertEqual(audit.baselineCompletionPossible, false, 'Без базового мостового слоя completion-path ломается.');
        assert(audit.errors.some((message) => /first_bridge/i.test(message)), 'Аудит должен явно показывать, что выпала базовая мостовая ветка.');
    });

    addTest('84. craft balance audit', 'Аудит падает, если baseline-путь совпадает со всем деревом и не остаётся специализаций', () => {
        const baselineBranchIds = new Set(
            craftBalanceRuntime.BASELINE_COMPLETION_GROUPS.flatMap((group) => group.branchIds)
        );
        const baselineOnlyBranches = islandNeedProfile.craftBranchDefinitions
            .filter((definition) => baselineBranchIds.has(definition.id));
        const audit = craftBalanceRuntime.buildCraftTreeBalanceAudit({
            branchDefinitions: baselineOnlyBranches
        });

        assertEqual(audit.requiresFullCraftTree, true, 'Если вне baseline не остаётся веток, аудит должен считать это полным craft tree.');
        assertEqual(audit.pass, false, 'При схлопывании дерева в одну обязательную линию балансный check должен падать.');
    });

    addTest('77. supply points в island/chunk generation', 'Island generation размечает обязательные supply chunks по craft pressure окна', () => {
        resetHarness();
        expeditionProgression.resetArchipelago();

        const earlyIsland = expeditionProgression.getIslandRecord(2);
        const midIsland = expeditionProgression.getIslandRecord(8);
        const lateIsland = expeditionProgression.getIslandRecord(17);
        const hasSupplyTag = (island, tag) => Array.isArray(island && island.chunks) && island.chunks.some((chunk) => chunk && chunk.tags && chunk.tags.has(tag));

        assert(hasSupplyTag(earlyIsland, 'supplyWater'), 'Ранний остров должен получать хотя бы один supplyWater chunk.');
        assert(hasSupplyTag(earlyIsland, 'supplyWood'), 'Ранний остров должен получать хотя бы один supplyWood chunk.');
        assert(hasSupplyTag(midIsland, 'supplyFishing'), 'Средний остров должен получать ограниченный fishing supply chunk.');
        assert(hasSupplyTag(midIsland, 'supplyWood'), 'Средний остров должен сохранять древесную supply-зону.');
        assert(hasSupplyTag(midIsland, 'supplyRubble'), 'Средний остров должен получать supply-зону под осыпи.');
        assert(hasSupplyTag(lateIsland, 'supplyWater'), 'Поздний остров должен снова получать обязательный water supply.');
        assert(hasSupplyTag(lateIsland, 'supplyFishing'), 'Поздний остров должен сохранять fishing supply.');
    });

    addTest('77. supply points в island/chunk generation', 'SupplyWater гарантирует точку воды, а supplyFishing ограничивает fishing spots выделенными чанками', () => {
        resetHarness();
        const waterInteractions = createChunkInteractionsForTest({
            islandIndex: 8,
            chunkSource: buildResourceBiomeChunk(),
            chunkRecord: { tags: new Set(['supplyWater']) },
            random: () => 0.4
        });
        const regularFishingInteractions = createChunkInteractionsForTest({
            islandIndex: 8,
            chunkSource: buildResourceBiomeChunk(),
            chunkRecord: { tags: new Set() },
            random: () => 0.4
        });
        const supplyFishingInteractions = createChunkInteractionsForTest({
            islandIndex: 8,
            chunkSource: buildResourceBiomeChunk(),
            chunkRecord: { tags: new Set(['supplyFishing']) },
            random: () => 0.4
        });
        const fishingNodeKinds = ['fishingSpot', 'fishingReedsSpot', 'fishingCalmSpot', 'fishingRareSpot'];
        const regularFishingCount = regularFishingInteractions.filter((interaction) => fishingNodeKinds.includes(interaction.resourceNodeKind)).length;
        const supplyFishingCount = supplyFishingInteractions.filter((interaction) => fishingNodeKinds.includes(interaction.resourceNodeKind)).length;

        assert(waterInteractions.some((interaction) => interaction.resourceNodeKind === 'waterSource'), 'SupplyWater chunk должен стабильно получать waterSource при подходящем биоме.');
        assertEqual(regularFishingCount, 0, 'Без supplyFishing тегов рыболовные точки не должны размазываться по каждому чанку.');
        assert(supplyFishingCount >= 1, 'SupplyFishing chunk должен получать хотя бы одну рыболовную точку.');
        assert(supplyFishingCount <= 2, 'До поздней логистики рыболовные точки должны оставаться ограниченными.');
    });

    addTest('77. supply points в island/chunk generation', 'SupplyWood и supplyRubble собирают древесные зоны и осыпи в выделенных чанках', () => {
        resetHarness();
        const neutralInteractions = createChunkInteractionsForTest({
            islandIndex: 8,
            chunkSource: buildResourceBiomeChunk(),
            chunkRecord: { tags: new Set() },
            random: () => 0.35
        });
        const zonedInteractions = createChunkInteractionsForTest({
            islandIndex: 8,
            chunkSource: buildResourceBiomeChunk(),
            chunkRecord: { tags: new Set(['supplyWood', 'supplyRubble']) },
            random: () => 0.35
        });
        const neutralWoodCount = neutralInteractions.filter((interaction) => interaction.resourceNodeKind === 'woodTree').length;
        const zonedWoodCount = zonedInteractions.filter((interaction) => interaction.resourceNodeKind === 'woodTree').length;
        const neutralRubbleCount = neutralInteractions.filter((interaction) => interaction.resourceNodeKind === 'rubbleScree').length;
        const zonedRubbleCount = zonedInteractions.filter((interaction) => interaction.resourceNodeKind === 'rubbleScree').length;

        assert(zonedWoodCount >= 2, 'SupplyWood chunk должен собирать заметную древесную зону, а не одиночное дерево.');
        assert(neutralWoodCount <= 1, 'Вне supplyWood древесина не должна дублироваться как полноценная зона.');
        assert(zonedRubbleCount >= 1, 'SupplyRubble chunk должен гарантировать хотя бы одну осыпь.');
        assert(zonedRubbleCount >= neutralRubbleCount, 'SupplyRubble не должен быть слабее обычного спавна.');
    });

    addTest('77. supply points в island/chunk generation', 'Chunk terrain generation усиливает reeds и rubble на supply чанках', () => {
        resetHarness();
        const buildSupplyTerrainChunk = () => {
            const chunkData = buildChunkData('shore');
            fillChunkRect(chunkData, 2, 2, 4, 4, 'water');
            fillChunkRect(chunkData, 10, 9, 4, 4, 'grass');
            fillChunkRect(chunkData, 10, 8, 4, 1, 'rock');
            fillChunkRect(chunkData, 9, 9, 1, 4, 'rock');
            return chunkData;
        };
        const neutralChunk = buildSupplyTerrainChunk();
        const supplyChunk = buildSupplyTerrainChunk();
        const progression = buildProgression(8);
        const buildChunkRecord = (tags = []) => ({
            tags: new Set(tags),
            internalDirections: new Set(),
            bridgeDirections: new Set()
        });
        const countTiles = (chunkData, tileType) => chunkData.reduce((sum, row) => {
            return sum + row.filter((candidate) => candidate === tileType).length;
        }, 0);

        game.systems.chunkGenerator.applyTravelTerrainLayer(neutralChunk, [], buildChunkRecord(), progression, () => 0.35);
        game.systems.chunkGenerator.applyTravelTerrainLayer(supplyChunk, [], buildChunkRecord(['supplyFishing', 'supplyRubble']), progression, () => 0.35);

        assert(countTiles(supplyChunk, 'reeds') > countTiles(neutralChunk, 'reeds'), 'SupplyFishing chunk должен получать больше прибрежного reeds-слоя.');
        assert(countTiles(supplyChunk, 'rubble') > countTiles(neutralChunk, 'rubble'), 'SupplyRubble chunk должен получать более заметную осыпь.');
    });

    addTest('78. archetype/scenario density', 'Resource node density profile получает отдельные бонусы от scenario и archetype', () => {
        const tradeProfile = islandLayout.buildResourceNodeDensityProfile({
            islandIndex: 10,
            archetype: 'normal',
            scenario: 'tradeIsland'
        });
        const trapProfile = islandLayout.buildResourceNodeDensityProfile({
            islandIndex: 12,
            archetype: 'greedy',
            scenario: 'trapIsland'
        });
        const noHouseProfile = islandLayout.buildResourceNodeDensityProfile({
            islandIndex: 8,
            archetype: 'emptyGiant',
            scenario: 'noHouseIsland'
        });

        assert(tradeProfile.supplyTagBonuses.supplyWater > 0, 'Trade island должен усиливать water supply.');
        assert(tradeProfile.resourceNodeSpawnBonuses.waterSource > 0, 'Trade island должен усиливать сами waterSource nodes.');
        assert(trapProfile.supplyTagBonuses.supplyRubble > 0, 'Trap/greedy island должен усиливать rubble supply.');
        assert(trapProfile.resourceNodeSpawnBonuses.rubbleScree > 0 && trapProfile.resourceNodeSpawnBonuses.stonePile > 0, 'Trap/greedy island должен усиливать осыпи и камень.');
        assert(noHouseProfile.supplyTagBonuses.supplyWater > 0 && noHouseProfile.supplyTagBonuses.supplyWood > 0, 'No-house giant должен получать больше water и wood supply.');
        assert(noHouseProfile.resourceNodeSpawnBonuses.woodTree > 0 && noHouseProfile.resourceNodeSpawnBonuses.waterSource > 0, 'No-house giant должен усиливать базовые узлы снабжения.');
    });

    addTest('78. archetype/scenario density', 'No-house giant делает water и wood узлы плотнее обычного острова', () => {
        resetHarness();
        const normalInteractions = createChunkInteractionsForTest({
            chunkSource: buildResourceBiomeChunk(),
            progression: buildProgression(8, {
                archetype: 'normal',
                scenario: 'normal'
            }),
            chunkRecord: {
                tags: new Set(['supplyWater', 'supplyWood'])
            },
            random: () => 0.35
        });
        const boostedInteractions = createChunkInteractionsForTest({
            chunkSource: buildResourceBiomeChunk(),
            progression: buildProgression(8, {
                archetype: 'emptyGiant',
                scenario: 'noHouseIsland'
            }),
            chunkRecord: {
                tags: new Set(['supplyWater', 'supplyWood'])
            },
            random: () => 0.35
        });
        const normalWaterCount = normalInteractions.filter((interaction) => interaction.resourceNodeKind === 'waterSource').length;
        const boostedWaterCount = boostedInteractions.filter((interaction) => interaction.resourceNodeKind === 'waterSource').length;
        const normalWoodCount = normalInteractions.filter((interaction) => interaction.resourceNodeKind === 'woodTree').length;
        const boostedWoodCount = boostedInteractions.filter((interaction) => interaction.resourceNodeKind === 'woodTree').length;

        assert(boostedWaterCount > normalWaterCount, 'No-house giant должен давать более плотные water sources.');
        assert(boostedWoodCount > normalWoodCount, 'No-house giant должен давать более плотные древесные зоны.');
    });

    addTest('78. archetype/scenario density', 'Trap/greedy island уплотняет камень и осыпи относительно обычного сценария', () => {
        resetHarness();
        const normalInteractions = createChunkInteractionsForTest({
            chunkSource: buildResourceBiomeChunk(),
            progression: buildProgression(12, {
                archetype: 'normal',
                scenario: 'normal'
            }),
            chunkRecord: {
                tags: new Set(['supplyRubble'])
            },
            random: () => 0.35
        });
        const trapInteractions = createChunkInteractionsForTest({
            chunkSource: buildResourceBiomeChunk(),
            progression: buildProgression(12, {
                archetype: 'greedy',
                scenario: 'trapIsland'
            }),
            chunkRecord: {
                tags: new Set(['supplyRubble'])
            },
            random: () => 0.35
        });
        const normalStoneCount = normalInteractions.filter((interaction) => interaction.resourceNodeKind === 'stonePile').length;
        const trapStoneCount = trapInteractions.filter((interaction) => interaction.resourceNodeKind === 'stonePile').length;
        const normalRubbleCount = normalInteractions.filter((interaction) => interaction.resourceNodeKind === 'rubbleScree').length;
        const trapRubbleCount = trapInteractions.filter((interaction) => interaction.resourceNodeKind === 'rubbleScree').length;

        assert(trapStoneCount > normalStoneCount, 'Trap/greedy island должен чаще давать stone piles.');
        assert(trapRubbleCount >= normalRubbleCount, 'Trap/greedy island не должен терять осыпи относительно обычного острова.');
    });

    addTest('79. crossing islands', 'Остров переправ получает отдельный сценарий и жёстко поднимает мостовую ветку в progression', () => {
        const crossingProgression = islandLayout.buildIslandProgression(5, 'neck', () => 0.4, 4);
        const midCrossingProgression = islandLayout.buildIslandProgression(14, 'forked', () => 0.4, 7);

        assertEqual(crossingProgression.scenario, 'crossingIsland', 'Пятый остров должен становиться якорным crossingIsland.');
        assertEqual(crossingProgression.routeStyle, 'bottleneck', 'Остров переправ должен форсировать bottleneck-маршрут.');
        assert(crossingProgression.requiresBridgeKit, 'Остров переправ должен явно требовать bridge kit.');
        assertEqual(crossingProgression.crossingPressureLevel, 1, 'Ранний crossingIsland должен иметь первый уровень мостового давления.');
        assert(crossingProgression.craftNeedMandatoryBranches.includes('first_bridge'), 'На crossingIsland ветка первого моста должна становиться обязательной.');
        assert(crossingProgression.craftNeedMandatoryResources.includes('raw_wood'), 'На crossingIsland дерево должно подниматься в обязательный ресурс.');
        assert(midCrossingProgression.craftNeedMandatoryBranches.includes('bridge_repair'), 'Средний crossingIsland должен делать bridge_repair обязательным.');
        assert(midCrossingProgression.craftNeedRecommendedBranches.includes('repair_support'), 'Средний crossingIsland должен заранее подталкивать к repair_support.');
    });

    addTest('79. crossing islands', 'Entry chunks острова переправ ломают входные мосты в воду, чтобы вход реально требовал bridge_kit', () => {
        resetHarness();
        expeditionProgression.resetArchipelago();

        const crossingIsland = expeditionProgression.getIslandRecord(5);
        assert(crossingIsland && crossingIsland.progression && crossingIsland.progression.scenario === 'crossingIsland', 'Пятый остров должен собираться как crossingIsland.');

        const entryChunk = crossingIsland.chunks.find((chunk) => {
            return chunk
                && chunk.tags
                && chunk.tags.has('entry')
                && chunk.bridgeDirections instanceof Set
                && chunk.bridgeDirections.size > 0;
        });
        assert(entryChunk, 'У crossingIsland должен существовать entry chunk с переправой.');

        const context = game.systems.chunkGenerator.buildGenerationContext(entryChunk.chunkX, entryChunk.chunkY, entryChunk);
        game.systems.chunkGenerator.runTopologyStage(context);
        game.systems.chunkGenerator.applyCrossingIslandForcedBridgeBreaks(context.chunkData, entryChunk, crossingIsland.progression);
        const breakSites = game.systems.chunkGenerator.getCrossingIslandBreakSites(entryChunk, crossingIsland.progression);

        assert(breakSites.length >= 1, 'Crossing island должен отдавать хотя бы одну обязательную точку сломанной переправы.');
        assert(breakSites.every((site) => context.chunkData[site.localY][site.localX] === 'water'), 'Сценарий переправ должен превращать входной bridge edge в воду под bridgeBuilder.');
    });

    addTest('81. depleted islands', 'Истощённый остров поднимает survival через сбор и крафт в progression', () => {
        const earlyDepleted = islandLayout.buildIslandProgression(3, 'elongated', () => 0.4, 3);
        const lateDepleted = islandLayout.buildIslandProgression(19, 'forked', () => 0.4, 7);

        assertEqual(earlyDepleted.scenario, 'depletedIsland', 'Третий остров должен становиться якорным depletedIsland.');
        assert(earlyDepleted.requiresCraftedSurvival, 'Истощённый остров должен явно требовать crafted survival.');
        assert(earlyDepleted.foodLootScarcity, 'Истощённый остров должен отмечать scarcity обычной еды.');
        assert(earlyDepleted.craftNeedMandatoryBranches.includes('cheap_healing'), 'Истощённый остров должен жёстко требовать дешёвое лечение.');
        assert(earlyDepleted.craftNeedMandatoryBranches.includes('survival_food'), 'Истощённый остров должен жёстко требовать survival food.');
        assert(earlyDepleted.craftNeedMandatoryResources.includes('water') && earlyDepleted.craftNeedMandatoryResources.includes('raw_grass'), 'Истощённый остров должен повышать воду и траву в mandatory ресурсы.');
        assert(lateDepleted.craftNeedMandatoryBranches.includes('strong_survival'), 'Поздний depletedIsland должен усиливать strong survival.');
        assert(lateDepleted.craftNeedMandatoryResources.includes('raw_fish'), 'Поздний depletedIsland должен подталкивать к рыбе как survival-ресурсу.');
    });

    addTest('81. depleted islands', 'Resource density depletedIsland смещает остров к сбору воды, травы и рыбы', () => {
        const normalProfile = islandLayout.buildResourceNodeDensityProfile({
            islandIndex: 19,
            archetype: 'normal',
            scenario: 'normal'
        });
        const depletedProfile = islandLayout.buildResourceNodeDensityProfile({
            islandIndex: 19,
            archetype: 'normal',
            scenario: 'depletedIsland'
        });

        assert(depletedProfile.resourceNodeSpawnBonuses.grassBush > normalProfile.resourceNodeSpawnBonuses.grassBush, 'depletedIsland должен усиливать grassBush.');
        assert(depletedProfile.resourceNodeSpawnBonuses.waterSource > normalProfile.resourceNodeSpawnBonuses.waterSource, 'depletedIsland должен усиливать waterSource.');
        assert(depletedProfile.resourceNodeSpawnBonuses.fishingSpot > normalProfile.resourceNodeSpawnBonuses.fishingSpot, 'depletedIsland должен усиливать fishing spots.');
        assert(depletedProfile.supplyTagBonuses.supplyWater > 0 && depletedProfile.supplyTagBonuses.supplyWood > 0, 'depletedIsland должен усиливать water и wood supply.');
    });

    addTest('81. depleted islands', 'Сундуки и safe points на depletedIsland не подменяют выживание обычной едой', () => {
        const depletedRollOptions = loot.getChestRollOptions('ordinary', 'normal', 19, {
            scenario: 'depletedIsland'
        });
        const normalPool = loot.buildChestRewardClassPool(19, 'ordinary', 'normal', {
            scenario: 'normal'
        });
        const depletedPool = loot.buildChestRewardClassPool(19, 'ordinary', 'normal', {
            scenario: 'depletedIsland'
        });
        const buildSequenceRandom = (values) => {
            let index = 0;
            return () => {
                const safeIndex = Math.min(index, values.length - 1);
                index += 1;
                return values[safeIndex];
            };
        };
        const emptyPlan = loot.createChestLootPlan(
            19,
            'ordinary',
            'normal',
            buildSequenceRandom([0.001, 0.6, 0.3]),
            { scenario: 'depletedIsland' }
        );
        const guaranteedSafeProfile = game.systems.expeditionHouseProfiles.createGuaranteedSafeProfile(
            buildProgression(19, { scenario: 'depletedIsland' }),
            () => 0.3
        );
        const depletedItemWeight = (depletedPool.find((entry) => entry.rewardClass === 'item') || {}).weight || 0;
        const depletedBundleWeight = (depletedPool.find((entry) => entry.rewardClass === 'component_bundle') || {}).weight || 0;
        const normalItemWeight = (normalPool.find((entry) => entry.rewardClass === 'item') || {}).weight || 0;
        const droppedIds = (emptyPlan.drops || []).map((drop) => drop && drop.itemId).filter(Boolean);

        assert(depletedRollOptions.forbiddenCategories.includes('food'), 'depletedIsland должен запрещать обычную еду в chest item roll.');
        assert(depletedRollOptions.preferredCategories.includes('survival'), 'depletedIsland должен смещать chest roll к survival-категориям.');
        assert(depletedItemWeight < normalItemWeight, 'depletedIsland должен ослаблять обычный item reward class.');
        assert(depletedBundleWeight > depletedItemWeight, 'На depletedIsland component_bundle должен быть важнее обычного item drop.');
        assert(!droppedIds.includes('breadRation') && !droppedIds.includes('driedSnack'), 'Пустой depleted chest не должен подсовывать обычную готовую еду.');
        assert(guaranteedSafeProfile.kind === 'well' || guaranteedSafeProfile.kind === 'shelter', 'Guaranteed safe point на depletedIsland должен быть водой или лагерем, а не бесплатной едой.');
    });

    addTest('82. trade islands', 'Торговый остров смещает progression в crafted values и ремесленную экономику', () => {
        const midTrade = islandLayout.buildIslandProgression(15, 'elongated', () => 0.4, 5);
        const lateTrade = islandLayout.buildIslandProgression(25, 'forked', () => 0.4, 8);

        assertEqual(midTrade.scenario, 'tradeIsland', 'Пятнадцатый остров должен становиться tradeIsland.');
        assert(midTrade.prefersCraftedValuables, 'Trade island должен явно предпочитать crafted valuables.');
        assertEqual(midTrade.tradeEconomyPressureLevel, 1, 'Средний trade island должен давать первый уровень экономического давления.');
        assert(midTrade.craftNeedRecommendedBranches.includes('trade_values'), 'Trade island должен тянуть в trade_values.');
        assert(midTrade.craftNeedRecommendedBranches.includes('route_info'), 'Trade island должен тянуть в route_info.');
        assert(lateTrade.craftNeedMandatoryBranches.includes('trade_values'), 'Поздний trade island должен делать trade_values обязательной веткой.');
        assert(lateTrade.craftNeedRecommendedBranches.includes('collector_loadout'), 'Поздний trade island должен рекомендовать collector loadout.');
        assert(lateTrade.craftNeedRecommendedResources.includes('paper'), 'Поздний trade island должен поднимать бумагу и маршрутные носители.');
    });

    addTest('82. trade islands', 'Сундуки tradeIsland чаще ведут в recipe/component shortcuts, а не в прямой item loot', () => {
        const normalPool = loot.buildChestRewardClassPool(25, 'rich', 'normal', {
            scenario: 'normal'
        });
        const tradePool = loot.buildChestRewardClassPool(25, 'rich', 'normal', {
            scenario: 'tradeIsland'
        });
        const normalRecipePool = loot.buildRecipeUnlockRewardPool(25, 'hidden', {
            scenario: 'normal'
        });
        const tradeRecipePool = loot.buildRecipeUnlockRewardPool(25, 'hidden', {
            scenario: 'tradeIsland'
        });
        const normalStationPool = loot.buildStationUnlockRewardPool(25, 'hidden', {
            scenario: 'normal'
        });
        const tradeStationPool = loot.buildStationUnlockRewardPool(25, 'hidden', {
            scenario: 'tradeIsland'
        });
        const tradeRollOptions = loot.getChestRollOptions('rich', 'normal', 25, {
            scenario: 'tradeIsland'
        });
        const normalItemWeight = (normalPool.find((entry) => entry.rewardClass === 'item') || {}).weight || 0;
        const tradeItemWeight = (tradePool.find((entry) => entry.rewardClass === 'item') || {}).weight || 0;
        const normalRecipeWeight = (normalPool.find((entry) => entry.rewardClass === 'recipe_unlock') || {}).weight || 0;
        const tradeRecipeWeight = (tradePool.find((entry) => entry.rewardClass === 'recipe_unlock') || {}).weight || 0;
        const normalTradePapersUnlock = normalRecipePool.find((entry) => entry.recipeId === 'wood-plank-to-trade-papers');
        const tradeTradePapersUnlock = tradeRecipePool.find((entry) => entry.recipeId === 'wood-plank-to-trade-papers');
        const normalScribeUnlock = normalStationPool.find((entry) => entry.stationId === 'scribe');
        const tradeScribeUnlock = tradeStationPool.find((entry) => entry.stationId === 'scribe');

        assert(tradeRollOptions.preferredCategories.includes('trade') && tradeRollOptions.preferredCategories.includes('info'), 'Trade island должен смещать chest roll к trade/info категориям.');
        assert(tradeRollOptions.preferredRequirements.some((requirement) => Array.isArray(requirement.sourceRecipeTags) && requirement.sourceRecipeTags.includes('economy')), 'Trade island должен тащить economy source recipes в chest roll.');
        assert(tradeItemWeight < normalItemWeight, 'Trade island должен ослаблять прямой item loot.');
        assert(tradeRecipeWeight > normalRecipeWeight, 'Trade island должен усиливать recipe unlock reward class.');
        assert(normalTradePapersUnlock && tradeTradePapersUnlock, 'Экономические recipe unlock должны присутствовать в reward pool.');
        assert(tradeTradePapersUnlock.weight > normalTradePapersUnlock.weight, 'Trade island должен сильнее тянуть unlock торговых бумаг.');
        assert(normalScribeUnlock && tradeScribeUnlock && tradeScribeUnlock.weight > normalScribeUnlock.weight, 'Trade island должен сильнее тянуть unlock писаря.');
    });

    addTest('82. trade islands', 'На торговом острове crafted values продаются выгоднее прямого лута', () => {
        resetHarness();
        game.state.currentIslandIndex = 25;
        const tradeEncounter = shopRuntime.prepareMerchantEncounter(buildTestHouse('merchant', 6, 6, {
            merchantRole: 'exchanger',
            islandIndex: 25,
            scenario: 'tradeIsland',
            stock: [],
            quest: null
        }));
        const normalEncounter = shopRuntime.prepareMerchantEncounter(buildTestHouse('merchant', 8, 8, {
            merchantRole: 'exchanger',
            islandIndex: 25,
            scenario: 'normal',
            stock: [],
            quest: null
        }));
        const tradePapersTradeOffer = shopRuntime.getMerchantSellOffer(tradeEncounter, 'trade_papers');
        const tradePapersNormalOffer = shopRuntime.getMerchantSellOffer(normalEncounter, 'trade_papers');
        const rationTradeOffer = shopRuntime.getMerchantSellOffer(tradeEncounter, 'ration');
        const rationNormalOffer = shopRuntime.getMerchantSellOffer(normalEncounter, 'ration');

        assert(tradePapersTradeOffer && tradePapersTradeOffer.accepted, 'На trade island crafted value должен продаваться.');
        assert(tradePapersNormalOffer && tradePapersNormalOffer.accepted, 'Вне trade island crafted value тоже должен продаваться.');
        assert(tradePapersTradeOffer.price > tradePapersNormalOffer.price, 'Trade island должен платить за crafted value больше обычного.');
        assertEqual(rationTradeOffer.price, rationNormalOffer.price, 'Прямой обычный лут не должен получать ту же торговую премию.');
    });

    addTest('83. late-game style recipes', 'Окна 21–30 получают recipe-driven предметы, которые меняют late-game стиль, а не только двигают multiplier', () => {
        const relicCaseRecipe = recipeRegistry.getRecipeDefinition('relic-case');
        const toolHolsterRecipe = recipeRegistry.getRecipeDefinition('tool-holster');
        const stormBootsRecipe = recipeRegistry.getRecipeDefinition('storm-boots');
        const anchorLineRecipe = recipeRegistry.getRecipeDefinition('anchor-line');
        const islandDrillRecipe = recipeRegistry.getRecipeDefinition('island-drill');
        const blackCupRecipe = recipeRegistry.getRecipeDefinition('black-cup');
        const lastVowRecipe = recipeRegistry.getRecipeDefinition('last-vow');

        const relicCaseDefinition = itemRegistry.getItemDefinition('relicCase');
        const toolHolsterDefinition = itemRegistry.getItemDefinition('toolHolster');
        const stormBootsDefinition = itemRegistry.getItemDefinition('stormBoots');
        const anchorLineDefinition = itemRegistry.getItemDefinition('anchorLine');
        const islandDrillDefinition = itemRegistry.getItemDefinition('islandDrill');
        const blackCupDefinition = itemRegistry.getItemDefinition('blackCup');
        const lastVowDefinition = itemRegistry.getItemDefinition('lastVow');

        assertEqual(relicCaseRecipe.station, 'scribe', 'Футляр реликвий должен собираться через экономическую станцию.');
        assertEqual(toolHolsterRecipe.station, 'workbench', 'Кобура инструмента должна собираться в мастерской.');
        assertEqual(stormBootsRecipe.station, 'smithy', 'Штормовые сапоги должны быть поздним кузнечным рецептом.');
        assertEqual(anchorLineRecipe.station, 'smithy', 'Якорная линия должна идти через кузницу.');
        assertEqual(islandDrillRecipe.station, 'smithy', 'Островная дрель должна быть поздней кузнечной утилитой.');
        assertEqual(blackCupRecipe.station, 'altar', 'Чёрный кубок должен собираться только на алтаре.');
        assertEqual(lastVowRecipe.station, 'altar', 'Последний обет должен собираться только на алтаре.');

        assert(componentRegistry.isGeneratedCraftingOutputItem('relicCase'), 'Футляр реликвий должен быть generated crafting output.');
        assert(componentRegistry.isGeneratedCraftingOutputItem('toolHolster'), 'Кобура инструмента должна быть generated crafting output.');
        assert(componentRegistry.isGeneratedCraftingOutputItem('anchorLine'), 'Якорная линия должна быть generated crafting output.');
        assert(componentRegistry.isGeneratedCraftingOutputItem('islandDrill'), 'Островная дрель должна быть generated crafting output.');
        assert(componentRegistry.isGeneratedCraftingOutputItem('blackCup'), 'Чёрный кубок должен быть generated crafting output.');
        assert(componentRegistry.isGeneratedCraftingOutputItem('lastVow'), 'Последний обет должен быть generated crafting output.');

        assert(relicCaseDefinition && relicCaseDefinition.passive && relicCaseDefinition.passive.showHouseValue, 'Футляр реликвий должен менять стиль игры через чтение дорогих домов.');
        assert(toolHolsterDefinition && toolHolsterDefinition.passive && (toolHolsterDefinition.passive.routeLengthBonus || 0) > 0, 'Кобура инструмента должна менять late-game loadout маршрута.');
        assert(stormBootsDefinition && stormBootsDefinition.passive && Array.isArray(stormBootsDefinition.passive.ignoreTravelZones) && stormBootsDefinition.passive.ignoreTravelZones.includes('badSector'), 'Штормовые сапоги должны менять маршрут через игнор тяжёлых зон.');
        assert(anchorLineDefinition && anchorLineDefinition.activeEffect && anchorLineDefinition.activeEffect.kind === 'teleportToSafe', 'Якорная линия должна давать safe-teleport, а не просто бонус к числам.');
        assert(islandDrillDefinition && islandDrillDefinition.activeEffect && islandDrillDefinition.activeEffect.kind === 'clearTravelPenalty', 'Островная дрель должна сбрасывать дорожное давление.');
        assert(blackCupDefinition && blackCupDefinition.activeEffect && blackCupDefinition.activeEffect.kind === 'islandBuff', 'Чёрный кубок должен работать как ритуальный islandBuff.');
        assert(lastVowDefinition && lastVowDefinition.activeEffect && lastVowDefinition.activeEffect.kind === 'travelBuff', 'Последний обет должен давать финальный travel buff.');
        assert(Array.isArray(lastVowDefinition.activeEffect.ignoreTravelZones) && lastVowDefinition.activeEffect.ignoreTravelZones.includes('cursedTrail'), 'Последний обет должен уметь прорываться через поздние тяжёлые зоны.');

        assertEqual(relicCaseRecipe.islandNeedProfile.earliestIsland, 22, 'Футляр реликвий должен быть привязан к collector window.');
        assertEqual(stormBootsRecipe.islandNeedProfile.earliestIsland, 25, 'Штормовые сапоги должны начинаться с эндгейм-маршрута.');
        assertEqual(lastVowRecipe.islandNeedProfile.earliestIsland, 28, 'Последний обет должен жить только в финальных окнах.');

        ['relic-case', 'tool-holster', 'storm-boots', 'anchor-line', 'island-drill', 'black-cup', 'last-vow'].forEach((recipeId) => {
            assertEqual(recipeRegistry.isRecipeActive(recipeId, recipeRegistry.RECIPE_PROFILE_IDS.wave1Minimal), true, `Late-game рецепт ${recipeId} должен быть доступен в активном progression-профиле.`);
        });
    });

    addTest('2. component-registry.js', 'Компоненты используют каноничные crafting tags и корректно фильтруются по ним', () => {
        const healingIds = componentRegistry.getComponentsByTag('healing').map((component) => component.id);
        const repairIds = componentRegistry.getComponentsByTag('repair').map((component) => component.id);
        const buildingIds = componentRegistry.getComponentsByTag('building').map((component) => component.id);
        const waterIds = componentRegistry.getComponentsByTag('water').map((component) => component.id);
        const routeIds = componentRegistry.getComponentsByTag('route').map((component) => component.id);
        const survivalIds = componentRegistry.getComponentsByTag('survival').map((component) => component.id);
        const merchantIds = componentRegistry.getComponentsByTag('merchant').map((component) => component.id);
        const bagQuestIds = componentRegistry.getComponentsByTag('bagQuest').map((component) => component.id);
        const ropeDefinition = itemRegistry.getItemDefinition('fiber_rope');
        const fuelDefinition = itemRegistry.getItemDefinition('fuel_bundle');

        assert(healingIds.includes('healing_base') && healingIds.includes('herb_paste'), 'healing-тег фильтруется неверно.');
        assert(repairIds.includes('gravel_fill') && repairIds.includes('fiber_rope'), 'repair-тег фильтруется неверно.');
        assert(buildingIds.includes('wood_plank_basic') && buildingIds.includes('boatFrame') && buildingIds.includes('stone_block'), 'building-тег фильтруется неверно.');
        assert(waterIds.includes('fuel_bundle') && waterIds.includes('boatFrame') && waterIds.includes('fish_oil'), 'water-тег фильтруется неверно.');
        assert(routeIds.includes('fiber_rope') && routeIds.includes('wood_plank_basic') && routeIds.includes('fish_oil'), 'route-тег фильтруется неверно.');
        assert(survivalIds.includes('healing_base') && survivalIds.includes('fish_meat') && survivalIds.includes('fuel_bundle'), 'survival-тег фильтруется неверно.');
        assert(merchantIds.includes('fiber_rope') && merchantIds.includes('wood_frame_basic') && merchantIds.includes('fish_oil'), 'merchant-тег фильтруется неверно.');
        assert(bagQuestIds.includes('healing_base') && bagQuestIds.includes('fiber_rope') && bagQuestIds.includes('fuel_bundle'), 'bagQuest-тег фильтруется неверно.');
        assertDeepEqual(ropeDefinition.craftingTags, ['building', 'repair', 'route', 'merchant', 'bagQuest'], 'Item definition fiber_rope должен получить craftingTags из registry.');
        assertDeepEqual(fuelDefinition.craftingTags, ['water', 'survival', 'bagQuest'], 'Item definition fuel_bundle должен получить craftingTags из registry.');
    });

    addTest('40. crafting tags компонентов', 'Recipe matching по crafting tags работает корректно', () => {
        const waterRecipeIds = recipeRegistry.getRecipesByComponentTag('water').map((recipe) => recipe.recipeId);
        const buildingResultRecipeIds = recipeRegistry.getRecipesByComponentTag('building', { scope: 'result' }).map((recipe) => recipe.recipeId);

        assert(waterRecipeIds.includes('boil-water'), 'Тег water должен находить рецепты с fuel_bundle.');
        assert(waterRecipeIds.includes('merchant-beacon'), 'Тег water должен находить поздние fish_oil-рецепты.');
        assert(!waterRecipeIds.includes('grass-to-healing-base'), 'Тег water не должен подмешивать нерелевантные рецепты.');
        assert(buildingResultRecipeIds.includes('stone-to-stone-block'), 'Scope result должен видеть component-result stone_block.');
        assert(buildingResultRecipeIds.includes('boat-frame'), 'Scope result должен видеть component-result boatFrame.');
    });

    addTest('40. crafting tags компонентов', 'Bag quest matcher может опираться на craftingTags без хака', () => {
        const inventoryItems = [
            itemRegistry.createInventoryItem('fiber_rope', 1),
            itemRegistry.createInventoryItem('fish_oil', 1),
            itemRegistry.createInventoryItem('ration', 1)
        ].filter(Boolean);
        const evaluation = itemRegistry.evaluateRequirementMatches(inventoryItems, [
            { craftingTags: ['bagQuest'] },
            { craftingTags: ['merchant'] }
        ], {
            currentIslandIndex: 14
        });
        const matchedIds = evaluation.matches
            .map((entry) => entry && entry.item && entry.item.id)
            .filter(Boolean);

        assert(evaluation.isComplete, 'Matcher должен уметь закрывать требования только по craftingTags.');
        assert(matchedIds.includes('fiber_rope'), 'bagQuest-тег должен подбирать fiber_rope.');
        assert(matchedIds.includes('fish_oil'), 'merchant-тег должен подбирать fish_oil.');
    });

    addTest('34. каноничные компоненты', 'Каждый каноничный компонент имеет валидный source path и recipe path', () => {
        const requiredIds = ['healing_base', 'herb_paste', 'fiber_rope', 'stone_block', 'gravel_fill', 'wood_plank_basic', 'wood_frame_basic', 'fish_meat', 'fish_oil', 'fuel_bundle'];

        requiredIds.forEach((componentId) => {
            const component = componentRegistry.getComponentDefinition(componentId);
            const recipeMatches = recipeRegistry.getRecipesByResultId(componentId);
            const hasSourcePath = (Array.isArray(component && component.sourceResourceIds) && component.sourceResourceIds.length > 0)
                || (Array.isArray(component && component.componentInputs) && component.componentInputs.length > 0);

            assert(component, `Не найден каноничный компонент ${componentId}.`);
            assert(hasSourcePath, `У каноничного компонента ${componentId} нет валидного source path.`);
            assert(recipeMatches.length > 0, `Для каноничного компонента ${componentId} не найден recipe path.`);
        });
    });

    addTest('34. каноничные компоненты', 'Ни один рецепт не ссылается на неописанный компонент', () => {
        recipeRegistry.getRecipeDefinitions().forEach((recipe) => {
            recipe.ingredients
                .filter((ingredient) => ingredient && ingredient.kind === 'component')
                .forEach((ingredient) => {
                    assert(componentRegistry.getComponentDefinition(ingredient.id), `Рецепт ${recipe.recipeId} ссылается на неописанный компонент ${ingredient.id}.`);
                });

            if (recipe.result && recipe.result.kind === 'component') {
                assert(componentRegistry.getComponentDefinition(recipe.result.id), `Рецепт ${recipe.recipeId} выдаёт неописанный компонент ${recipe.result.id}.`);
            }
        });
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
                result: { kind: 'component', id: 'fiber_rope', label: 'Верёвка', quantity: 1 },
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

    addTest('production первой волны', 'Активный профиль включает только минимальный production-набор первой волны', () => {
        const expectedRecipeIds = [
            'fill-water-flask',
            'boil-water',
            'prepare-alchemy-water',
            'grass-to-healing-base',
            'reeds-to-healing-base',
            'grass-to-herbal-paste',
            'grass-to-rope',
            'reeds-to-rope',
            'stone-to-stone-block',
            'rubble-to-gravel-fill',
            'stone-rubble-to-gravel-fill',
            'wood-to-board',
            'wood-to-frame',
            'wood-to-fuel-bundle',
            'fish-to-fish-meat',
            'fish-to-fish-oil',
            'healing-brew',
            'dried-ration',
            'second-wind',
            'portable-bridge',
            'portable-bridge-assembly',
            'bridge-repair-kit',
            'boat-frame',
            'boat',
            'boat-repair-kit',
            'relic-case',
            'tool-holster',
            'storm-boots',
            'anchor-line',
            'island-drill',
            'black-cup',
            'last-vow'
        ].sort();

        withTemporaryRecipeProfile(recipeRegistry.RECIPE_PROFILE_IDS.wave1Minimal, () => {
            const previousIslandIndex = game.state.currentIslandIndex;

            try {
                game.state.currentIslandIndex = 30;
                assertEqual(recipeRegistry.getActiveRecipeProfileId(), recipeRegistry.RECIPE_PROFILE_IDS.wave1Minimal, 'По умолчанию должен активироваться профиль первой волны.');

                const activeProfile = recipeRegistry.getRecipeProfile(recipeRegistry.RECIPE_PROFILE_IDS.wave1Minimal);
                const activeRecipeIds = recipeRegistry.getActiveRecipeDefinitions()
                    .map((recipe) => recipe.recipeId)
                    .sort();

                assert(activeProfile, 'Активный progression-профиль должен существовать.');
                assertDeepEqual(activeRecipeIds, expectedRecipeIds, 'Активный progression-профиль должен включать раннюю базу и поздние style-рецепты.');

                ['energy-tonic', 'hearty-ration', 'strong-broth', 'fish-broth', 'salted-fish', 'fog-lantern', 'merchant-beacon'].forEach((recipeId) => {
                    assert(!activeRecipeIds.includes(recipeId), `Расширенный рецепт ${recipeId} не должен входить в активный progression-профиль по умолчанию.`);
                    assert(recipeRegistry.getRecipeDefinition(recipeId), `Рецепт ${recipeId} должен оставаться в полном реестре для следующих волн.`);
                });
            } finally {
                game.state.currentIslandIndex = previousIslandIndex;
            }
        });
    });

    addTest('98. recipe unlock by island tier', 'Поздние рецепты открываются только после нужного окна островов', () => {
        const previousIslandIndex = game.state.currentIslandIndex;

        try {
            game.state.currentIslandIndex = 8;
            const earlyRecipeIds = recipeRegistry.getActiveRecipeDefinitions()
                .map((recipe) => recipe.recipeId);
            assert(!earlyRecipeIds.includes('boat'), 'Готовая лодка не должна быть доступна до 16 острова.');

            game.state.currentIslandIndex = 18;
            const midRecipeIds = recipeRegistry.getActiveRecipeDefinitions()
                .map((recipe) => recipe.recipeId);
            assert(midRecipeIds.includes('boat'), 'После 16 острова рецепт лодки должен быть доступен.');
            assert(midRecipeIds.includes('bridge-repair-kit'), 'После 7 острова ремкомплект моста должен быть доступен.');
        } finally {
            game.state.currentIslandIndex = previousIslandIndex;
        }
    });

    addTest('production первой волны', 'Runtime и compression используют активный профиль, а не весь каталог', () => {
        withTemporaryRecipeProfile(recipeRegistry.RECIPE_PROFILE_IDS.wave1Minimal, () => {
            const compiledRecipeIds = craftingRuntime.getCompiledRecipes().map((recipe) => recipe.recipeId);
            const woodCompressionRecipeIds = compressionRuntime.getCompressionRecipesForSourceItem('raw_wood')
                .map((recipe) => recipe.recipeId)
                .sort();

            assert(compiledRecipeIds.includes('portable-bridge'), 'Ключевой рецепт первой волны должен попадать в runtime.');
            assert(!compiledRecipeIds.includes('fog-lantern'), 'Поздний рецепт не должен попадать в runtime первой волны.');
            assertDeepEqual(woodCompressionRecipeIds, ['wood-to-board', 'wood-to-frame', 'wood-to-fuel-bundle'].sort(), 'Compression runtime должен видеть только актуальные wood-рецепты первой волны.');
        });

        withTemporaryRecipeProfile(recipeRegistry.RECIPE_PROFILE_IDS.allRecipes, () => {
            const compiledRecipeIds = craftingRuntime.getCompiledRecipes().map((recipe) => recipe.recipeId);
            assert(compiledRecipeIds.includes('fog-lantern'), 'Полный профиль должен возвращать и поздние рецепты.');
        });
    });

    addTest('42. healing_base из травы', 'Базовое правило системы: 5 травы сжимаются в healing_base', () => {
        const recipe = recipeRegistry.getRecipeDefinition('grass-to-healing-base');

        assert(recipe, 'Рецепт grass-to-healing-base должен существовать.');
        assertEqual(recipe.station, 'hand', 'Базовый травяной рецепт должен быть доступен руками.');
        assertEqual(recipe.tier, recipeRegistry.RECIPE_TIERS.baseConversion, 'Рецепт healing_base из травы должен быть базовой конверсией.');
        assertEqual(recipe.ingredients.length, 1, 'У grass-to-healing-base должен быть один базовый ингредиент.');
        assertEqual(recipe.ingredients[0].kind, 'resource', 'grass-to-healing-base должен брать именно ресурс.');
        assertEqual(recipe.ingredients[0].id, 'grass', 'grass-to-healing-base должен использовать ресурс grass.');
        assertEqual(recipe.ingredients[0].quantity, 5, 'grass-to-healing-base должен требовать ровно 5 травы.');
        assert(recipe.result && recipe.result.kind === 'component', 'grass-to-healing-base должен давать компонент.');
        assertEqual(recipe.result.id, 'healing_base', 'grass-to-healing-base должен давать healing_base.');
        assert(recipeRegistry.isRecipeActive('grass-to-healing-base', recipeRegistry.RECIPE_PROFILE_IDS.wave1Minimal), 'grass-to-healing-base должен входить в минимальный production-профиль первой волны.');
    });

    addTest('43. fiber_rope из травы', 'Базовое правило системы: 10 травы сжимаются в fiber_rope', () => {
        const recipe = recipeRegistry.getRecipeDefinition('grass-to-rope');

        assert(recipe, 'Рецепт grass-to-rope должен существовать.');
        assertEqual(recipe.station, 'bench', 'Базовый верёвочный рецепт должен идти через bench.');
        assertEqual(recipe.tier, recipeRegistry.RECIPE_TIERS.baseConversion, 'Рецепт fiber_rope из травы должен быть базовой конверсией.');
        assertEqual(recipe.ingredients.length, 1, 'У grass-to-rope должен быть один базовый ингредиент.');
        assertEqual(recipe.ingredients[0].kind, 'resource', 'grass-to-rope должен брать именно ресурс.');
        assertEqual(recipe.ingredients[0].id, 'grass', 'grass-to-rope должен использовать ресурс grass.');
        assertEqual(recipe.ingredients[0].quantity, 10, 'grass-to-rope должен требовать ровно 10 травы.');
        assert(recipe.result && recipe.result.kind === 'component', 'grass-to-rope должен давать компонент.');
        assertEqual(recipe.result.id, 'fiber_rope', 'grass-to-rope должен давать fiber_rope.');
        assert(recipeRegistry.isRecipeActive('grass-to-rope', recipeRegistry.RECIPE_PROFILE_IDS.wave1Minimal), 'grass-to-rope должен входить в минимальный production-профиль первой волны.');
    });

    addTest('43. fiber_rope из травы', 'Bridge и boat recipes завязаны на fiber_rope, а не на raw grass', () => {
        const recipeIds = ['portable-bridge', 'bridge-repair-kit', 'boat-frame', 'boat', 'boat-repair-kit'];

        recipeIds.forEach((recipeId) => {
            const recipe = recipeRegistry.getRecipeDefinition(recipeId);
            const ingredientIds = Array.isArray(recipe && recipe.ingredients)
                ? recipe.ingredients.map((ingredient) => ingredient && ingredient.id).filter(Boolean)
                : [];

            assert(recipe, `Рецепт ${recipeId} должен существовать.`);
            assert(ingredientIds.includes('fiber_rope'), `Рецепт ${recipeId} должен требовать fiber_rope.`);
            assert(!ingredientIds.includes('grass'), `Рецепт ${recipeId} не должен брать grass напрямую.`);
            assert(!ingredientIds.includes('raw_grass'), `Рецепт ${recipeId} не должен брать raw_grass напрямую.`);
        });
    });

    addTest('44. дерево в базовые компоненты', '5 дерева -> доска, 10 дерева -> каркас, 5 дерева -> топливо', () => {
        const boardRecipe = recipeRegistry.getRecipeDefinition('wood-to-board');
        const frameRecipe = recipeRegistry.getRecipeDefinition('wood-to-frame');
        const fuelRecipe = recipeRegistry.getRecipeDefinition('wood-to-fuel-bundle');

        assert(boardRecipe && frameRecipe && fuelRecipe, 'Все базовые деревянные рецепты должны существовать.');
        assertEqual(boardRecipe.ingredients[0].id, 'wood', 'wood-to-board должен использовать wood.');
        assertEqual(boardRecipe.ingredients[0].quantity, 5, 'wood-to-board должен требовать 5 дерева.');
        assertEqual(boardRecipe.result.id, 'wood_plank_basic', 'wood-to-board должен давать wood_plank_basic.');

        assertEqual(frameRecipe.ingredients[0].id, 'wood', 'wood-to-frame должен использовать wood.');
        assertEqual(frameRecipe.ingredients[0].quantity, 10, 'wood-to-frame должен требовать 10 дерева.');
        assertEqual(frameRecipe.result.id, 'wood_frame_basic', 'wood-to-frame должен давать wood_frame_basic.');

        assertEqual(fuelRecipe.ingredients[0].id, 'wood', 'wood-to-fuel-bundle должен использовать wood.');
        assertEqual(fuelRecipe.ingredients[0].quantity, 5, 'wood-to-fuel-bundle должен требовать 5 дерева.');
        assertEqual(fuelRecipe.result.id, 'fuel_bundle', 'wood-to-fuel-bundle должен давать fuel_bundle.');

        ['wood-to-board', 'wood-to-frame', 'wood-to-fuel-bundle'].forEach((recipeId) => {
            assert(recipeRegistry.isRecipeActive(recipeId, recipeRegistry.RECIPE_PROFILE_IDS.wave1Minimal), `Рецепт ${recipeId} должен входить в первую волну.`);
        });
    });

    addTest('45. камень и щебень в ремонтные компоненты', '5 камня -> stone_block, 5 щебня -> gravel_fill, mixed stone+rubble -> repair filler', () => {
        const stoneRecipe = recipeRegistry.getRecipeDefinition('stone-to-stone-block');
        const rubbleRecipe = recipeRegistry.getRecipeDefinition('rubble-to-gravel-fill');
        const mixedRepairRecipe = recipeRegistry.getRecipeDefinition('stone-rubble-to-gravel-fill');

        assert(stoneRecipe && rubbleRecipe && mixedRepairRecipe, 'Все базовые каменно-ремонтные рецепты должны существовать.');
        assertEqual(stoneRecipe.ingredients[0].id, 'stone', 'stone-to-stone-block должен использовать stone.');
        assertEqual(stoneRecipe.ingredients[0].quantity, 5, 'stone-to-stone-block должен требовать 5 камня.');
        assertEqual(stoneRecipe.result.id, 'stone_block', 'stone-to-stone-block должен давать stone_block.');

        assertEqual(rubbleRecipe.ingredients[0].id, 'rubble', 'rubble-to-gravel-fill должен использовать rubble.');
        assertEqual(rubbleRecipe.ingredients[0].quantity, 5, 'rubble-to-gravel-fill должен требовать 5 щебня.');
        assertEqual(rubbleRecipe.result.id, 'gravel_fill', 'rubble-to-gravel-fill должен давать gravel_fill.');

        assertDeepEqual(
            mixedRepairRecipe.ingredients.map((ingredient) => ({ id: ingredient.id, quantity: ingredient.quantity })),
            [{ id: 'stone', quantity: 2 }, { id: 'rubble', quantity: 3 }],
            'Смешанный ремонтный рецепт должен требовать 2 камня и 3 щебня.'
        );
        assertEqual(mixedRepairRecipe.result.id, 'gravel_fill', 'Смешанный ремонтный рецепт должен давать gravel_fill.');
        assert(recipeRegistry.isRecipeActive('stone-rubble-to-gravel-fill', recipeRegistry.RECIPE_PROFILE_IDS.wave1Minimal), 'Смешанный ремонтный рецепт должен входить в первую волну.');
    });

    addTest('45. камень и щебень в ремонтные компоненты', 'Mixed repair filler крафтится через runtime и даёт gravel_fill', () => {
        const outcome = craftingRuntime.craftRecipeAgainstStock('stone-rubble-to-gravel-fill', {
            stockEntries: [
                craftingRuntime.buildStockEntry('resource', 'stone', 'Камень', 2),
                craftingRuntime.buildStockEntry('resource', 'rubble', 'Щебень', 3)
            ],
            availableStations: ['hand']
        });

        assert(outcome && outcome.success, 'Смешанный ремонтный рецепт должен успешно крафтиться.');
        assert(outcome.result && outcome.result.id === 'gravel_fill', 'Смешанный ремонтный рецепт должен возвращать gravel_fill.');
    });

    addTest('35. компонентное правило рецептов', 'Практический рецепт из raw-ресурса без явного исключения не загружается', () => {
        assertThrows(() => recipeRegistry.createValidatedRecipeRegistry([
            {
                recipeId: 'broken-practical-raw-recipe',
                label: 'Сломанный практический raw-рецепт',
                station: 'camp',
                stationLabel: 'Лагерь',
                tier: recipeRegistry.RECIPE_TIERS.survivalAndEnergy,
                ingredients: [
                    { kind: 'resource', id: 'fish', label: 'Рыба', quantity: 5 }
                ],
                result: { kind: 'item', id: 'ration', label: 'Сухпаёк', quantity: 1 },
                tags: ['survival', 'food', 'camp'],
                islandNeedProfile: { windows: [] }
            }
        ], {
            resourceRegistry,
            componentRegistry,
            devMode: true
        }), /practical recipes must consume components/i);
    });

    addTest('35. компонентное правило рецептов', 'Практические рецепты работают через компоненты, а raw остаётся только у явного emergency-shortcut', () => {
        const practicalRecipes = recipeRegistry.getRecipeDefinitions()
            .filter((recipe) => recipeRegistry.isPracticalRecipeTier(recipe.tier));
        const practicalRawRecipes = practicalRecipes
            .filter((recipe) => recipeRegistry.getRawResourceIngredients(recipe).length > 0);

        assert(practicalRawRecipes.length > 0, 'Должен существовать хотя бы один осознанный raw-shortcut для проверки правила.');
        assert(practicalRawRecipes.every((recipe) => recipeRegistry.allowsPracticalRawShortcut(recipe)), 'Любой практический raw-рецепт должен быть явно помечен как emergency raw-shortcut.');
        assert(practicalRawRecipes.some((recipe) => recipe.recipeId === 'raw-fish-ration'), 'raw-fish-ration должен оставаться явным исключением из компонентного правила.');

        const heartyRation = recipeRegistry.getRecipeDefinition('hearty-ration');
        const strongBroth = recipeRegistry.getRecipeDefinition('strong-broth');
        const portableBridge = recipeRegistry.getRecipeDefinition('portable-bridge');

        assert(recipeRegistry.getRawResourceIngredients(heartyRation).length === 0, 'Сытный паёк должен работать через компоненты, а не через raw-ресурс.');
        assert(recipeRegistry.getRawResourceIngredients(strongBroth).length === 0, 'Крепкий бульон должен работать через компоненты, а не через raw-ресурс.');
        assert(recipeRegistry.getRawResourceIngredients(portableBridge).length === 0, 'Переносной мост должен работать через компоненты, а не через raw-ресурс.');
    });

    addTest('35. компонентное правило рецептов', 'Переносной мост не крафтится напрямую из raw-wood, если нужны компонентные заготовки', () => {
        const evaluation = craftingRuntime.evaluateRecipeAgainstStock('portable-bridge', {
            stockEntries: [
                craftingRuntime.buildStockEntry('resource', 'wood', 'Дерево', 10),
                craftingRuntime.buildStockEntry('resource', 'stone', 'Камень', 5),
                craftingRuntime.buildStockEntry('resource', 'grass', 'Трава', 5)
            ],
            availableStations: ['bench']
        });

        assertEqual(evaluation.success, false, 'Переносной мост не должен собираться прямо из raw-ресурсов.');
        assertEqual(evaluation.reason, 'missing-ingredients', 'При попытке крафта из raw-ресурсов должна возвращаться нехватка компонентных ингредиентов.');
        assert(evaluation.missingIngredients.some((entry) => entry.id === 'wood_plank_basic'), 'Система должна явно просить wood_plank_basic.');
    });

    addTest('35. компонентное правило рецептов', 'Лечебный рецепт не крафтится напрямую из raw grass, если нужен healing_base', () => {
        const evaluation = craftingRuntime.evaluateRecipeAgainstStock('healing-brew', {
            stockEntries: [
                craftingRuntime.buildStockEntry('resource', 'grass', 'Трава', 5),
                craftingRuntime.buildStockEntry('itemState', 'waterFlaskAlchemy', 'Фляга алхимической воды', 1, {
                    gameplayItemId: 'flask_water_alchemy'
                })
            ],
            availableStations: ['camp']
        });

        assertEqual(evaluation.success, false, 'Лечебный рецепт не должен принимать raw grass вместо healing_base.');
        assertEqual(evaluation.reason, 'missing-ingredients', 'Для raw grass должна возвращаться ошибка missing-ingredients.');
        assert(evaluation.missingIngredients.some((entry) => entry.id === 'healing_base'), 'Система должна явно просить healing_base.');
    });

    addTest('36. generated crafting outputs', 'Craft-native output items приходят в каталог через component-registry, а не как компоненты', () => {
        const outputIds = [
            'healingBrew',
            'energyTonic',
            'fishBroth',
            'bridge_kit',
            'portableBridge',
            'reinforcedBridge',
            'fieldBridge',
            'absoluteBridge',
            'repair_kit_bridge',
            'boat_ready',
            'repair_kit_boat',
            'soilResource',
            'roadChalk',
            'pathMarker',
            'safeHouseSeal',
            'fogLantern',
            'merchantBeacon'
        ];

        outputIds.forEach((itemId) => {
            assert(componentRegistry.isGeneratedCraftingOutputItem(itemId), `Предмет ${itemId} должен быть отмечен как generated crafting output.`);
            assert(!componentRegistry.isComponentInventoryItem(itemId), `Предмет ${itemId} не должен считаться промежуточным компонентом.`);
            assert(componentRegistry.getCatalogCraftingOutputItemDefinition(itemId), `Для ${itemId} должно существовать generated output catalog definition.`);
            assert(itemRegistry.getItemDefinition(itemId), `Item registry должен видеть generated output ${itemId}.`);
        });
    });

    addTest('36. generated crafting outputs', 'Generated crafting outputs сохраняют эффекты и ценность после удаления ручных блоков из item-catalog', () => {
        const fishBrothEffect = itemRegistry.getConsumableEffect('fishBroth');
        const bridgeKitDefinition = itemRegistry.getItemDefinition('bridge_kit');
        const portableBridgeDefinition = itemRegistry.getItemDefinition('portableBridge');
        const reinforcedBridgeDefinition = itemRegistry.getItemDefinition('reinforcedBridge');
        const fieldBridgeDefinition = itemRegistry.getItemDefinition('fieldBridge');
        const absoluteBridgeDefinition = itemRegistry.getItemDefinition('absoluteBridge');
        const bridgeRepairKitDefinition = itemRegistry.getItemDefinition('repair_kit_bridge');
        const boatReadyDefinition = itemRegistry.getItemDefinition('boat_ready');
        const boatRepairKitDefinition = itemRegistry.getItemDefinition('repair_kit_boat');
        const roadChalkDefinition = itemRegistry.getItemDefinition('roadChalk');
        const pathMarkerDefinition = itemRegistry.getItemDefinition('pathMarker');
        const safeHouseSealDefinition = itemRegistry.getItemDefinition('safeHouseSeal');
        const fogLanternDefinition = itemRegistry.getItemDefinition('fogLantern');
        const merchantBeaconDefinition = itemRegistry.getItemDefinition('merchantBeacon');
        const soilResourceDefinition = itemRegistry.getItemDefinition('soilResource');

        assert(fishBrothEffect && (fishBrothEffect.hunger || 0) > 0, 'fishBroth должен сохранять consumable-эффект из generated output registry.');
        assert(bridgeKitDefinition && bridgeKitDefinition.activeEffect && bridgeKitDefinition.activeEffect.kind === 'bridgeBuilder', 'bridge_kit должен сохранять bridgeBuilder-эффект как craft output.');
        assert(portableBridgeDefinition && portableBridgeDefinition.activeEffect && portableBridgeDefinition.activeEffect.kind === 'bridgeBuilder', 'portableBridge должен приходить из crafting output и сохранять bridgeBuilder-эффект.');
        assert(reinforcedBridgeDefinition && reinforcedBridgeDefinition.activeEffect && reinforcedBridgeDefinition.activeEffect.charges === 2, 'reinforcedBridge должен быть craft-driven мостовым апгрейдом на 2 заряда.');
        assert(fieldBridgeDefinition && fieldBridgeDefinition.activeEffect && fieldBridgeDefinition.activeEffect.charges === 2, 'fieldBridge должен быть craft-driven мостовым апгрейдом на 2 заряда.');
        assert(absoluteBridgeDefinition && absoluteBridgeDefinition.activeEffect && absoluteBridgeDefinition.activeEffect.charges === 4, 'absoluteBridge должен быть craft-driven поздним мостовым апгрейдом на 4 заряда.');
        assert(bridgeRepairKitDefinition && /ремкомплект/i.test(bridgeRepairKitDefinition.label), 'repair_kit_bridge должен существовать как реальный утилитарный craft output.');
        assert(boatReadyDefinition && /лодк/i.test(boatReadyDefinition.label), 'boat_ready должен существовать как generated output готовой лодки.');
        assert(boatRepairKitDefinition && /repair|ремонт|ремкомплект/i.test(`${boatRepairKitDefinition.categories} ${boatRepairKitDefinition.label}`), 'repair_kit_boat должен существовать как реальный лодочный ремкомплект.');
        assert(roadChalkDefinition && roadChalkDefinition.activeEffect && roadChalkDefinition.activeEffect.kind === 'cheapestRouteHint', 'roadChalk должен сохранять route-hint эффект.');
        assert(pathMarkerDefinition && pathMarkerDefinition.activeEffect && pathMarkerDefinition.activeEffect.kind === 'cheapestRouteHint', 'pathMarker должен сохранять route-hint эффект.');
        assert(safeHouseSealDefinition && safeHouseSealDefinition.activeEffect && safeHouseSealDefinition.activeEffect.kind === 'trapWard', 'safeHouseSeal должен сохранять защитный trapWard-эффект.');
        assert(fogLanternDefinition && fogLanternDefinition.activeEffect && fogLanternDefinition.activeEffect.kind === 'revealMap', 'fogLantern должен сохранять revealMap-эффект.');
        assert(merchantBeaconDefinition && merchantBeaconDefinition.activeEffect && merchantBeaconDefinition.activeEffect.kind === 'revealMerchant', 'merchantBeacon должен сохранять revealMerchant-эффект.');
        assert(soilResourceDefinition && soilResourceDefinition.merchantQuestWeight === 2, 'soilResource должен сохранять торговую ценность и quest-вес.');
    });

    addTest('36. generated crafting outputs', 'Item catalog и loot pools больше не содержат старые resource shortcuts', () => {
        const removedIds = ['grassResource', 'stoneResource', 'rubbleChunk', 'lowlandGrass', 'fieldGrass'];
        const catalogIds = new Set(itemRegistry.getCatalogDefinitions().map((definition) => definition.id));
        const chestPoolIds = new Set(itemRegistry.buildWeightedCatalogPool('chestWeight', 12, {
            includeTierZero: true,
            allowFutureTiers: true
        }).map((entry) => entry.definition.id));
        const merchantPoolIds = new Set(itemRegistry.buildWeightedCatalogPool('merchantWeight', 12, {
            includeTierZero: true,
            allowFutureTiers: true
        }).map((entry) => entry.definition.id));

        removedIds.forEach((itemId) => {
            assertEqual(catalogIds.has(itemId), false, `Item catalog не должен содержать legacy shortcut ${itemId}.`);
            assertEqual(chestPoolIds.has(itemId), false, `Chest loot pool не должен содержать legacy shortcut ${itemId}.`);
            assertEqual(merchantPoolIds.has(itemId), false, `Merchant loot pool не должен содержать legacy shortcut ${itemId}.`);
        });
    });

    addTest('36. generated crafting outputs', 'Старые ready-resource items мигрируют в новую raw/container форму', () => {
        const legacyDomains = buildLegacySnapshot();
        const migratedSnapshot = saveLoad.migrateSnapshot(buildLegacySnapshot({
            player: {
                ...legacyDomains.player,
                inventory: [
                    { id: 'grassResource', icon: 'TR', label: 'Трава', quantity: 2 },
                    { id: 'stoneResource', icon: 'KS', label: 'Камень', quantity: 1 },
                    { id: 'rubbleChunk', icon: 'OS', label: 'Щебень', quantity: 3 },
                    { id: 'waterFlask', icon: 'FW', label: 'Фляга воды', quantity: 1 }
                ]
            }
        }));
        const migratedInventory = (migratedSnapshot.player.inventory || []).filter(Boolean);
        const grassItem = migratedInventory.find((item) => item.id === 'raw_grass');
        const stoneItem = migratedInventory.find((item) => item.id === 'raw_stone');
        const rubbleItem = migratedInventory.find((item) => item.id === 'raw_rubble');
        const flaskItem = migratedInventory.find((item) => item.id === 'flask_water_full');

        assert(grassItem && grassItem.quantity === 10, 'grassResource должен мигрировать в raw_grass с коэффициентом 5 к 1.');
        assert(stoneItem && stoneItem.quantity === 5, 'stoneResource должен мигрировать в raw_stone с коэффициентом 5 к 1.');
        assert(rubbleItem && rubbleItem.quantity === 3, 'rubbleChunk должен мигрировать в raw_rubble без потери количества.');
        assert(flaskItem && flaskItem.quantity === 1, 'waterFlask должен мигрировать в полную флягу новой контейнерной модели.');
    });

    addTest('37. quality level компонентов', 'Рецепт, требующий rare quality, не принимает ordinary quality', () => {
        withTemporaryRecipeRegistry([
            {
                recipeId: 'quality-ordinary-healing-check',
                label: 'Обычная лечебная база',
                station: 'camp',
                stationLabel: 'Лагерь',
                tier: recipeRegistry.RECIPE_TIERS.survivalAndEnergy,
                ingredients: [
                    { kind: 'component', id: 'healing_base', label: 'Травяная база лечения', quantity: 1, qualityLevel: 'ordinary' }
                ],
                result: { kind: 'item', id: 'ration', label: 'Сухпаёк', quantity: 1, gameplayItemId: 'ration' },
                tags: ['test'],
                islandNeedProfile: { windows: [] }
            },
            {
                recipeId: 'quality-rare-healing-check',
                label: 'Редкая лечебная база',
                station: 'camp',
                stationLabel: 'Лагерь',
                tier: recipeRegistry.RECIPE_TIERS.survivalAndEnergy,
                ingredients: [
                    { kind: 'component', id: 'healing_base', label: 'Травяная база лечения', quantity: 1, qualityLevel: 'rare' }
                ],
                result: { kind: 'item', id: 'ration', label: 'Сухпаёк', quantity: 1, gameplayItemId: 'ration' },
                tags: ['test'],
                islandNeedProfile: { windows: [] }
            }
        ], () => {
            const stockEntries = [
                craftingRuntime.buildStockEntry('component', 'healing_base', 'Травяная база лечения', 1)
            ];
            const ordinaryEvaluation = craftingRuntime.evaluateRecipeAgainstStock('quality-ordinary-healing-check', {
                stockEntries,
                availableStations: ['camp']
            });
            const rareEvaluation = craftingRuntime.evaluateRecipeAgainstStock('quality-rare-healing-check', {
                stockEntries,
                availableStations: ['camp']
            });

            assert(ordinaryEvaluation.success, 'Рецепт с ordinary quality должен принимать обычный компонент.');
            assertEqual(rareEvaluation.success, false, 'Рецепт с rare quality не должен принимать ordinary компонент.');
            assertEqual(rareEvaluation.reason, 'missing-ingredients', 'Для mismatch по quality должна возвращаться missing-ingredients.');
        });
    });

    addTest('37. quality level компонентов', 'UI показывает quality компонента без двусмысленности', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('fish_oil', 1);
        game.state.selectedInventorySlot = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'fish_oil');
        const uiHarness = installInventoryUiHarness();

        try {
            inventoryUi.renderInventory();
            const factsText = document.getElementById('inventorySelectionFacts').textContent || '';

            assert(/качество:\s*редкий/i.test(factsText), 'В UI должно явно показываться качество "редкий".');
            assert(!/quality:\s*rare/i.test(factsText), 'UI не должен выводить двусмысленное английское качество вместо локализованного.');
        } finally {
            uiHarness.cleanup();
        }
    });

    addTest('88. inventory item markers', 'Raw-ресурс помечается как raw и не маскируется под component/crafted', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('raw_wood', 1);
        game.state.selectedInventorySlot = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'raw_wood');
        const uiHarness = installInventoryUiHarness();

        try {
            inventoryUi.renderInventory();
            const markerTags = Array.from(document.querySelectorAll('#inventorySelectionFacts .inventory-selection-panel__fact-tag'))
                .map((node) => (node.textContent || '').trim())
                .filter(Boolean);

            assert(markerTags.includes('raw'), 'Raw-ресурс должен иметь явную маркировку raw.');
            assert(!markerTags.includes('component'), 'Raw-ресурс не должен помечаться как component.');
            assert(!markerTags.includes('crafted'), 'Raw-ресурс не должен помечаться как crafted.');
        } finally {
            uiHarness.cleanup();
        }
    });

    addTest('88. inventory item markers', 'Компонент со станцией и bag-line получает component / station-only / bag-quest relevant', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('fiber_rope', 1);
        game.state.selectedInventorySlot = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'fiber_rope');
        const uiHarness = installInventoryUiHarness();

        try {
            inventoryUi.renderInventory();
            const markerTags = Array.from(document.querySelectorAll('#inventorySelectionFacts .inventory-selection-panel__fact-tag'))
                .map((node) => (node.textContent || '').trim())
                .filter(Boolean);

            assert(markerTags.includes('component'), 'Компонент должен иметь явную маркировку component.');
            assert(markerTags.includes('station-only'), 'Верёвка с верстачным происхождением должна помечаться как station-only.');
            assert(markerTags.includes('bag-quest relevant'), 'Предмет для bag-upgrade линии должен помечаться как bag-quest relevant.');
        } finally {
            uiHarness.cleanup();
        }
    });

    addTest('88. inventory item markers', 'Ремонтный craft-output получает crafted / station-only / repair-only', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('repair_kit_bridge', 1);
        game.state.selectedInventorySlot = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'repair_kit_bridge');
        const uiHarness = installInventoryUiHarness();

        try {
            inventoryUi.renderInventory();
            const markerTags = Array.from(document.querySelectorAll('#inventorySelectionFacts .inventory-selection-panel__fact-tag'))
                .map((node) => (node.textContent || '').trim())
                .filter(Boolean);

            assert(markerTags.includes('crafted'), 'Craft-output должен иметь явную маркировку crafted.');
            assert(markerTags.includes('station-only'), 'Ремонтный craft-output должен помечаться как station-only.');
            assert(markerTags.includes('repair-only'), 'Ремонтный craft-output должен помечаться как repair-only.');
        } finally {
            uiHarness.cleanup();
        }
    });

    addTest('4. crafting-runtime.js', 'При наличии всех ингредиентов рецепт успешно крафтится', () => {
        const outcome = craftingRuntime.craftRecipeAgainstStock('portable-bridge', {
            stockEntries: [
                craftingRuntime.buildStockEntry('component', 'wood_plank_basic', 'Доска', 2),
                craftingRuntime.buildStockEntry('component', 'fiber_rope', 'Верёвка', 1),
                craftingRuntime.buildStockEntry('component', 'stone_block', 'Каменный блок', 1)
            ],
            availableStations: ['bench']
        });

        assert(outcome.success, 'Крафт не завершился успешно.');
        assertEqual(outcome.result.id, 'bridge_kit', 'Создан неверный результат рецепта.');
    });

    addTest('46. bridge_kit как отдельный craft output', 'Рецепт portable-bridge выдаёт bridge_kit, а portableBridge собирается отдельным шагом поверх него', () => {
        const recipe = recipeRegistry.getRecipeDefinition('portable-bridge');
        const assemblyRecipe = recipeRegistry.getRecipeDefinition('portable-bridge-assembly');
        const bridgeKitDefinition = itemRegistry.getItemDefinition('bridge_kit');
        const portableBridgeDefinition = itemRegistry.getItemDefinition('portableBridge');

        assert(recipe, 'Рецепт portable-bridge должен существовать.');
        assert(assemblyRecipe, 'Рецепт portable-bridge-assembly должен существовать.');
        assert(recipe.result && recipe.result.id === 'bridge_kit', 'Рецепт portable-bridge должен выдавать bridge_kit.');
        assert(assemblyRecipe.result && assemblyRecipe.result.id === 'portableBridge', 'Сборка готового моста должна выдавать portableBridge.');
        assert((assemblyRecipe.ingredients || []).some((ingredient) => ingredient.id === 'bridge_kit'), 'portableBridge должен собираться именно поверх bridge_kit.');
        assert(componentRegistry.isGeneratedCraftingOutputItem('bridge_kit'), 'bridge_kit должен быть generated crafting output.');
        assert(componentRegistry.isGeneratedCraftingOutputItem('portableBridge'), 'portableBridge теперь тоже должен быть generated crafting output.');
        assert(bridgeKitDefinition && bridgeKitDefinition.activeEffect && bridgeKitDefinition.activeEffect.kind === 'bridgeBuilder', 'bridge_kit должен быть полноценным мостовым предметом для использования.');
        assert(portableBridgeDefinition && portableBridgeDefinition.activeEffect && portableBridgeDefinition.activeEffect.kind === 'bridgeBuilder', 'portableBridge должен оставаться готовым к использованию мостовым предметом.');
        assertEqual(portableBridgeDefinition.bridgeUpgradeStage, 1, 'portableBridge должен быть первой готовой стадией мостовой ветки.');
    });

    addTest('47. boat_ready как отдельный craft output', 'Рецепт boat собирает boat_ready из boatFrame, fish_oil и fiber_rope', () => {
        const recipe = recipeRegistry.getRecipeDefinition('boat');
        const ingredientIds = Array.isArray(recipe && recipe.ingredients)
            ? recipe.ingredients.map((ingredient) => ingredient && ingredient.id).filter(Boolean)
            : [];

        assert(recipe, 'Рецепт boat должен существовать.');
        assert(recipe.result && recipe.result.kind === 'item', 'Финальный лодочный рецепт должен выдавать item-результат.');
        assertEqual(recipe.result.id, 'boat_ready', 'Финальный лодочный рецепт должен выдавать boat_ready.');
        assert(ingredientIds.includes('boatFrame'), 'Рецепт boat должен требовать boatFrame.');
        assert(ingredientIds.includes('fish_oil'), 'Рецепт boat должен требовать fish_oil.');
        assert(ingredientIds.includes('fiber_rope'), 'Рецепт boat должен требовать fiber_rope.');
        assert(componentRegistry.isGeneratedCraftingOutputItem('boat_ready'), 'boat_ready должен быть generated crafting output.');
    });

    addTest('47. boat_ready как отдельный craft output', 'Лодочная ветка становится полноценной production-цепочкой через inventory-backed output', () => {
        const outcome = craftingRuntime.craftRecipeAgainstStock('boat', {
            stockEntries: [
                craftingRuntime.buildStockEntry('component', 'boatFrame', 'Рама лодки', 1),
                craftingRuntime.buildStockEntry('component', 'fish_oil', 'Рыбий жир', 1),
                craftingRuntime.buildStockEntry('component', 'fiber_rope', 'Верёвка', 1)
            ],
            availableStations: ['workbench']
        });

        const boatReadyDefinition = itemRegistry.getItemDefinition('boat_ready');

        assert(outcome && outcome.success, 'Финальный лодочный крафт должен проходить успешно.');
        assert(outcome.result && outcome.result.id === 'boat_ready', 'Финальный лодочный крафт должен возвращать boat_ready.');
        assert(boatReadyDefinition && boatReadyDefinition.bulk >= 1, 'boat_ready должен существовать в item registry как реальный инвентарный output.');
    });

    addTest('48. repair kits как отдельные craft outputs', 'Рецепты ремонта выдают каноничные repair_kit_bridge и repair_kit_boat', () => {
        const bridgeRepairRecipe = recipeRegistry.getRecipeDefinition('bridge-repair-kit');
        const boatRepairRecipe = recipeRegistry.getRecipeDefinition('boat-repair-kit');

        assert(bridgeRepairRecipe, 'Рецепт bridge-repair-kit должен существовать.');
        assert(boatRepairRecipe, 'Рецепт boat-repair-kit должен существовать.');
        assertEqual(bridgeRepairRecipe.result.id, 'repair_kit_bridge', 'Ремонт моста должен выдавать repair_kit_bridge.');
        assertEqual(boatRepairRecipe.result.id, 'repair_kit_boat', 'Ремонт лодки должен выдавать repair_kit_boat.');
        assert(componentRegistry.isGeneratedCraftingOutputItem('repair_kit_bridge'), 'repair_kit_bridge должен быть generated crafting output.');
        assert(componentRegistry.isGeneratedCraftingOutputItem('repair_kit_boat'), 'repair_kit_boat должен быть generated crafting output.');
        assert(itemRegistry.getItemDefinition('repair_kit_bridge'), 'Item registry должен видеть repair_kit_bridge.');
        assert(itemRegistry.getItemDefinition('repair_kit_boat'), 'Item registry должен видеть repair_kit_boat.');
    });

    addTest('48. repair kits как отдельные craft outputs', 'Старые bridgeRepairKit и boatRepairKit в сейвах мигрируют в новые canonical ids', () => {
        const migratedSnapshot = saveLoad.migrateSnapshot({
            saveVersion: 7,
            player: {
                inventory: [
                    { id: 'bridgeRepairKit', icon: 'RM', label: 'Ремкомплект моста', quantity: 1 },
                    { id: 'boatRepairKit', icon: 'RL', label: 'Ремкомплект лодки', quantity: 1 },
                    null
                ],
                selectedInventorySlot: 0
            },
            craftingState: stateSchema.createDomainState().craftingState,
            world: {
                groundItemsByKey: {
                    '0,0': [
                        { id: 'bridgeRepairKit', icon: 'RM', label: 'Ремкомплект моста', quantity: 1 },
                        { id: 'boatRepairKit', icon: 'RL', label: 'Ремкомплект лодки', quantity: 1 }
                    ]
                }
            },
            narrative: {},
            ui: {}
        });

        assertEqual(migratedSnapshot.saveVersion, stateSchema.SAVE_VERSION, 'Сейв с legacy repair kit ids должен мигрировать до актуальной версии.');
        assertEqual(migratedSnapshot.player.inventory[0].id, 'repair_kit_bridge', 'bridgeRepairKit должен мигрировать в repair_kit_bridge.');
        assertEqual(migratedSnapshot.player.inventory[1].id, 'repair_kit_boat', 'boatRepairKit должен мигрировать в repair_kit_boat.');
        assertEqual(migratedSnapshot.world.groundItemsByKey['0,0'][0].id, 'repair_kit_bridge', 'bridgeRepairKit на земле должен мигрировать в repair_kit_bridge.');
        assertEqual(migratedSnapshot.world.groundItemsByKey['0,0'][1].id, 'repair_kit_boat', 'boatRepairKit на земле должен мигрировать в repair_kit_boat.');
    });

    addTest('51. мостовая ветка как craft outputs и upgrades', 'portableBridge, reinforcedBridge, fieldBridge и absoluteBridge собраны в единую production-цепочку', () => {
        const portableRecipe = recipeRegistry.getRecipeDefinition('portable-bridge-assembly');
        const reinforcedRecipe = recipeRegistry.getRecipeDefinition('reinforced-bridge-upgrade');
        const fieldRecipe = recipeRegistry.getRecipeDefinition('field-bridge-upgrade');
        const absoluteRecipe = recipeRegistry.getRecipeDefinition('absolute-bridge-upgrade');

        assert(portableRecipe, 'Рецепт portable-bridge-assembly должен существовать.');
        assert(reinforcedRecipe, 'Рецепт reinforced-bridge-upgrade должен существовать.');
        assert(fieldRecipe, 'Рецепт field-bridge-upgrade должен существовать.');
        assert(absoluteRecipe, 'Рецепт absolute-bridge-upgrade должен существовать.');

        assertEqual(portableRecipe.result.id, 'portableBridge', 'portable-bridge-assembly должен выдавать portableBridge.');
        assertEqual(reinforcedRecipe.result.id, 'reinforcedBridge', 'reinforced-bridge-upgrade должен выдавать reinforcedBridge.');
        assertEqual(fieldRecipe.result.id, 'fieldBridge', 'field-bridge-upgrade должен выдавать fieldBridge.');
        assertEqual(absoluteRecipe.result.id, 'absoluteBridge', 'absolute-bridge-upgrade должен выдавать absoluteBridge.');

        assert((portableRecipe.ingredients || []).some((ingredient) => ingredient.id === 'bridge_kit'), 'portableBridge должен собираться из bridge_kit.');
        assert((reinforcedRecipe.ingredients || []).some((ingredient) => ingredient.id === 'portableBridge'), 'reinforcedBridge должен апгрейдиться из portableBridge.');
        assert((fieldRecipe.ingredients || []).some((ingredient) => ingredient.id === 'portableBridge'), 'fieldBridge должен апгрейдиться из portableBridge.');
        assert((absoluteRecipe.ingredients || []).some((ingredient) => ingredient.id === 'reinforcedBridge'), 'absoluteBridge должен требовать reinforcedBridge.');
        assert((absoluteRecipe.ingredients || []).some((ingredient) => ingredient.id === 'fieldBridge'), 'absoluteBridge должен требовать fieldBridge.');
    });

    addTest('51. мостовая ветка как craft outputs и upgrades', 'bridge item definitions хранят upgrade-метаданные, а не только activeEffect', () => {
        const portableBridgeDefinition = itemRegistry.getItemDefinition('portableBridge');
        const reinforcedBridgeDefinition = itemRegistry.getItemDefinition('reinforcedBridge');
        const fieldBridgeDefinition = itemRegistry.getItemDefinition('fieldBridge');
        const absoluteBridgeDefinition = itemRegistry.getItemDefinition('absoluteBridge');

        assertEqual(portableBridgeDefinition.bridgeFamily, 'portable', 'portableBridge должен быть частью каноничной bridgeFamily.');
        assertEqual(reinforcedBridgeDefinition.bridgeFamily, 'portable', 'reinforcedBridge должен быть частью каноничной bridgeFamily.');
        assertEqual(fieldBridgeDefinition.bridgeFamily, 'portable', 'fieldBridge должен быть частью каноничной bridgeFamily.');
        assertEqual(absoluteBridgeDefinition.bridgeFamily, 'portable', 'absoluteBridge должен быть частью каноничной bridgeFamily.');

        assertEqual(reinforcedBridgeDefinition.bridgeUpgradeStage, 2, 'reinforcedBridge должен быть второй стадией апгрейда.');
        assertEqual(fieldBridgeDefinition.bridgeUpgradeStage, 3, 'fieldBridge должен быть третьей стадией апгрейда.');
        assertEqual(absoluteBridgeDefinition.bridgeUpgradeStage, 4, 'absoluteBridge должен быть финальной стадией апгрейда.');

        assert(Array.isArray(reinforcedBridgeDefinition.upgradeFromItemIds) && reinforcedBridgeDefinition.upgradeFromItemIds.includes('portableBridge'), 'reinforcedBridge должен явно хранить upgradeFrom portableBridge.');
        assert(Array.isArray(fieldBridgeDefinition.upgradeFromItemIds) && fieldBridgeDefinition.upgradeFromItemIds.includes('portableBridge'), 'fieldBridge должен явно хранить upgradeFrom portableBridge.');
        assert(Array.isArray(absoluteBridgeDefinition.upgradeFromItemIds) && absoluteBridgeDefinition.upgradeFromItemIds.includes('reinforcedBridge') && absoluteBridgeDefinition.upgradeFromItemIds.includes('fieldBridge'), 'absoluteBridge должен явно хранить оба входных апгрейда.');
    });

    addTest('49. economic craft', 'Дешёвая ценность идёт через controlled scribe-рецепты из 5x resource-equivalent компонентов', () => {
        const tradePapersRecipe = recipeRegistry.getRecipeDefinition('wood-plank-to-trade-papers');
        const marketSealRecipe = recipeRegistry.getRecipeDefinition('stone-block-to-market-seal');
        const tradePapersDefinition = itemRegistry.getItemDefinition('trade_papers');
        const marketSealDefinition = itemRegistry.getItemDefinition('market_seal');

        assert(tradePapersRecipe, 'Рецепт wood-plank-to-trade-papers должен существовать.');
        assert(marketSealRecipe, 'Рецепт stone-block-to-market-seal должен существовать.');
        assertEqual(tradePapersRecipe.station, 'scribe', 'Торговые бумаги должны собираться у писаря.');
        assertEqual(marketSealRecipe.station, 'scribe', 'Рыночная печать должна собираться у писаря.');
        assertEqual(tradePapersRecipe.ingredients[0].kind, 'component', 'Экономический крафт не должен брать raw ресурс напрямую.');
        assertEqual(marketSealRecipe.ingredients[0].kind, 'component', 'Экономический крафт не должен брать raw ресурс напрямую.');
        assertEqual(tradePapersRecipe.ingredients[0].id, 'wood_plank_basic', 'Торговые бумаги должны идти из компонентного эквивалента 5 дерева.');
        assertEqual(marketSealRecipe.ingredients[0].id, 'stone_block', 'Рыночная печать должна идти из компонентного эквивалента 5 камня.');
        assertEqual(tradePapersRecipe.result.id, 'trade_papers', 'Рецепт должен выдавать trade_papers.');
        assertEqual(marketSealRecipe.result.id, 'market_seal', 'Рецепт должен выдавать market_seal.');
        assert(componentRegistry.isGeneratedCraftingOutputItem('trade_papers'), 'trade_papers должен быть generated crafting output.');
        assert(componentRegistry.isGeneratedCraftingOutputItem('market_seal'), 'market_seal должен быть generated crafting output.');
        assert(tradePapersDefinition && tradePapersDefinition.baseValue >= 8, 'trade_papers должен оставаться дешёвой, но реальной ценностью.');
        assert(marketSealDefinition && marketSealDefinition.baseValue >= 8, 'market_seal должен оставаться дешёвой, но реальной ценностью.');
        assert((tradePapersDefinition.categories || []).includes('value'), 'trade_papers должен считаться value-предметом.');
        assert((marketSealDefinition.categories || []).includes('value'), 'market_seal должен считаться value-предметом.');
    });

    addTest('49. economic craft', 'Экономический крафт не входит в wave1Minimal и не принимает raw напрямую', () => {
        const rawTradeEvaluation = craftingRuntime.evaluateRecipeAgainstStock('wood-plank-to-trade-papers', {
            stockEntries: [
                craftingRuntime.buildStockEntry('resource', 'wood', 'Дерево', 5)
            ],
            availableStations: ['scribe']
        });
        const rawSealEvaluation = craftingRuntime.evaluateRecipeAgainstStock('stone-block-to-market-seal', {
            stockEntries: [
                craftingRuntime.buildStockEntry('resource', 'stone', 'Камень', 5)
            ],
            availableStations: ['scribe']
        });

        assertEqual(recipeRegistry.isRecipeActive('wood-plank-to-trade-papers', recipeRegistry.RECIPE_PROFILE_IDS.wave1Minimal), false, 'Дешёвый экономический крафт не должен попадать в первую production-волну.');
        assertEqual(recipeRegistry.isRecipeActive('stone-block-to-market-seal', recipeRegistry.RECIPE_PROFILE_IDS.wave1Minimal), false, 'Дешёвый экономический крафт не должен попадать в первую production-волну.');
        assertEqual(rawTradeEvaluation.success, false, 'Торговые бумаги не должны крафтиться напрямую из raw_wood.');
        assertEqual(rawSealEvaluation.success, false, 'Рыночная печать не должна крафтиться напрямую из raw_stone.');
        assert(rawTradeEvaluation.missingIngredients.some((entry) => entry.id === 'wood_plank_basic'), 'Система должна явно просить wood_plank_basic вместо raw_wood.');
        assert(rawSealEvaluation.missingIngredients.some((entry) => entry.id === 'stone_block'), 'Система должна явно просить stone_block вместо raw_stone.');
    });

    addTest('4. crafting-runtime.js', 'При нехватке хотя бы одного ингредиента результат не создаётся', () => {
        const outcome = craftingRuntime.craftRecipeAgainstStock('portable-bridge', {
            stockEntries: [
                craftingRuntime.buildStockEntry('component', 'wood_plank_basic', 'Доска', 2),
                craftingRuntime.buildStockEntry('component', 'stone_block', 'Каменный блок', 1)
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
        const beforeRope = inventoryRuntime.countInventoryItem('fiber_rope');
        const outcome = craftingRuntime.craftRecipeAgainstInventory('grass-to-rope', {
            availableStations: ['bench']
        });

        assert(outcome.success, 'Крафт через игровой инвентарь не завершился.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_grass'), beforeRawGrass - 10, 'Ингредиенты списались неверно.');
        assertEqual(inventoryRuntime.countInventoryItem('fiber_rope'), beforeRope + 1, 'Результат добавился неверно.');
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
                craftingRuntime.buildStockEntry('component', 'wood_plank_basic', 'Доска', 2),
                craftingRuntime.buildStockEntry('component', 'fiber_rope', 'Верёвка', 1),
                craftingRuntime.buildStockEntry('component', 'stone_block', 'Каменный блок', 1)
            ],
            availableStations: ['bench']
        });

        assert(outcome.success, 'Рецепт должен быть доступен на верстаке.');
    });

    addTest('5. station-runtime.js', 'Список доступных рецептов меняется при смене станции', () => {
        withTemporaryRecipeProfile(recipeRegistry.RECIPE_PROFILE_IDS.allRecipes, () => {
            const campRecipeIds = craftingRuntime.getRecipesForStation('camp').map((recipe) => recipe.recipeId);
            const smithyRecipeIds = craftingRuntime.getRecipesForStation('smithy').map((recipe) => recipe.recipeId);

            assert(campRecipeIds.includes('healing-brew'), 'В лагере должен быть рецепт healing-brew.');
            assert(!campRecipeIds.includes('island-drill'), 'Кузнечный рецепт не должен быть в лагере.');
            assert(smithyRecipeIds.includes('island-drill'), 'В кузнице должен быть island-drill.');
        });
    });

    addTest('5. station-runtime.js', 'Активная мастерская остаётся отдельной явной станцией без рецептов верстака', () => {
        resetHarness();
        game.state.currentIslandIndex = 8;
        game.state.activeInteraction = buildStationInteraction('workbench', {
            expedition: {
                label: 'Мастерская',
                stationId: 'workbench',
                stationIds: ['workbench']
            }
        });

        const stationContext = stationRuntime.getActiveStationContext();
        const availableStations = craftingRuntime.resolveAvailableStations();

        assertEqual(stationContext.activeSourceLabel, 'Мастерская', 'Активная станция сверху должна называться "Мастерская".');
        assertEqual(stationContext.activeStationId, 'workbench', 'Текущая активная станция должна определяться как workbench.');
        assertEqual(availableStations.includes('bench'), false, 'Мастерская не должна открывать рецепты верстака.');
        assert(availableStations.includes('workbench'), 'Мастерская должна открывать только workbench.');
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

    addTest('50. системное разделение рецептов по станциям', 'Станции имеют явные craft-tracks и не смешивают выживание, маршрут, строительство и экономику', () => {
        assert(stationRuntime.stationSupportsCraftTrack('hand', 'compression'), 'Руки должны поддерживать compression.');
        assert(stationRuntime.stationSupportsCraftTrack('camp', 'survival'), 'Лагерь должен поддерживать survival.');
        assert(stationRuntime.stationSupportsCraftTrack('bench', 'route'), 'Верстак должен поддерживать route.');
        assert(stationRuntime.stationSupportsCraftTrack('workbench', 'construction'), 'Мастерская должна поддерживать construction.');
        assert(stationRuntime.stationSupportsCraftTrack('scribe', 'economy'), 'Писарь должен поддерживать economy.');
        assert(stationRuntime.stationSupportsCraftTrack('smithy', 'heavy'), 'Кузница должна поддерживать heavy.');

        assertEqual(stationRuntime.stationSupportsCraftTrack('camp', 'construction'), false, 'Лагерь не должен поддерживать construction.');
        assertEqual(stationRuntime.stationSupportsCraftTrack('workbench', 'survival'), false, 'Мастерская не должна поддерживать survival.');
        assertEqual(stationRuntime.stationSupportsCraftTrack('scribe', 'construction'), false, 'Писарь не должен поддерживать construction.');
    });

    addTest('50. системное разделение рецептов по станциям', 'Рецепты получают системный craftTrack и registry валит несовместимую станцию', () => {
        assertEqual(recipeRegistry.getRecipeDefinition('grass-to-healing-base').craftTrack, 'compression', 'Базовая компрессия должна идти через compression.');
        assertEqual(recipeRegistry.getRecipeDefinition('prepare-alchemy-water').craftTrack, 'survival', 'Алхимическая вода должна идти через survival.');
        assertEqual(recipeRegistry.getRecipeDefinition('portable-bridge').craftTrack, 'route', 'Переносной мост должен идти через route.');
        assertEqual(recipeRegistry.getRecipeDefinition('boat').craftTrack, 'construction', 'Лодка должна идти через construction.');
        assertEqual(recipeRegistry.getRecipeDefinition('bridge-repair-kit').craftTrack, 'construction', 'Ремонт моста должен идти через construction.');
        assertEqual(recipeRegistry.getRecipeDefinition('wood-plank-to-trade-papers').craftTrack, 'economy', 'Экономический рецепт должен идти через economy.');
        assertEqual(recipeRegistry.getRecipeDefinition('island-drill').craftTrack, 'heavy', 'Тяжёлая утилита должна идти через heavy.');

        assertThrows(() => recipeRegistry.createValidatedRecipeRegistry([
            {
                recipeId: 'invalid-camp-bridge',
                label: 'Неверный мост в лагере',
                station: 'camp',
                craftTrack: 'construction',
                tier: recipeRegistry.RECIPE_TIERS.buildWaterAndRepair,
                ingredients: [
                    { kind: 'component', id: 'wood_plank_basic', label: 'Доска', quantity: 2 },
                    { kind: 'component', id: 'fiber_rope', label: 'Верёвка', quantity: 1 },
                    { kind: 'component', id: 'stone_block', label: 'Каменный блок', quantity: 1 }
                ],
                result: { kind: 'item', id: 'bridge_kit', label: 'Мост-комплект', quantity: 1 },
                tags: ['test'],
                islandNeedProfile: { windows: [] }
            }
        ]), /incompatible station/);
    });

    addTest('50. системное разделение рецептов по станциям', 'Runtime не даёт крафтить алхимию, лодку и экономику на чужих станциях', () => {
        const healingAtWorkbench = craftingRuntime.evaluateRecipeAgainstStock('healing-brew', {
            stockEntries: [
                craftingRuntime.buildStockEntry('itemState', 'waterFlaskAlchemy', 'Фляга алхимической воды', 1, {
                    gameplayItemId: 'flask_water_alchemy'
                }),
                craftingRuntime.buildStockEntry('component', 'healing_base', 'Травяная база лечения', 1)
            ],
            availableStations: ['workbench']
        });
        const boatAtCamp = craftingRuntime.evaluateRecipeAgainstStock('boat', {
            stockEntries: [
                craftingRuntime.buildStockEntry('component', 'boatFrame', 'Рама лодки', 1),
                craftingRuntime.buildStockEntry('component', 'fish_oil', 'Рыбий жир', 1),
                craftingRuntime.buildStockEntry('component', 'fiber_rope', 'Верёвка', 1)
            ],
            availableStations: ['camp']
        });
        const economyAtCamp = craftingRuntime.evaluateRecipeAgainstStock('wood-plank-to-trade-papers', {
            stockEntries: [
                craftingRuntime.buildStockEntry('component', 'wood_plank_basic', 'Доска', 1)
            ],
            availableStations: ['camp']
        });

        assertEqual(healingAtWorkbench.success, false, 'Алхимический лагерный рецепт не должен крафтиться в мастерской.');
        assertEqual(healingAtWorkbench.reason, 'wrong-station', 'Лагерный рецепт в мастерской должен валиться по wrong-station.');
        assertEqual(boatAtCamp.success, false, 'Лодка не должна крафтиться в лагере.');
        assertEqual(boatAtCamp.reason, 'wrong-station', 'Лодка в лагере должна валиться по wrong-station.');
        assertEqual(economyAtCamp.success, false, 'Экономический рецепт не должен крафтиться в лагере.');
        assertEqual(economyAtCamp.reason, 'wrong-station', 'Экономический рецепт в лагере должен валиться по wrong-station.');
    });

    addTest('52. утилитарные recipe outputs', 'safeHouseSeal, fogLantern, merchantBeacon, pathMarker и roadChalk существуют как recipe-driven generated outputs', () => {
        const recipeIds = [
            'road-chalk',
            'path-marker',
            'safe-house-seal',
            'fog-lantern',
            'merchant-beacon'
        ];
        const outputIds = [
            'roadChalk',
            'pathMarker',
            'safeHouseSeal',
            'fogLantern',
            'merchantBeacon'
        ];

        recipeIds.forEach((recipeId) => {
            const recipe = recipeRegistry.getRecipeDefinition(recipeId);
            assert(recipe, `Рецепт ${recipeId} должен существовать в registry.`);
            assert(recipe.result && recipe.result.kind === 'item', `Рецепт ${recipeId} должен выдавать item output.`);
            assert(typeof recipe.result.id === 'string' && recipe.result.id.length > 0, `Рецепт ${recipeId} должен иметь валидный output item id.`);
        });

        outputIds.forEach((itemId) => {
            assert(componentRegistry.isGeneratedCraftingOutputItem(itemId), `${itemId} должен приходить как generated crafting output.`);
            assert(componentRegistry.getCatalogCraftingOutputItemDefinition(itemId), `Для ${itemId} должна существовать generated output catalog definition.`);
            assert(itemRegistry.getItemDefinition(itemId), `Item registry должен видеть ${itemId} через generated output layer.`);
        });
    });

    addTest('52. утилитарные recipe outputs', 'Утилитарные рецепты собираются из компонентов и не попадают в wave1Minimal', () => {
        const roadChalkRecipe = recipeRegistry.getRecipeDefinition('road-chalk');
        const pathMarkerRecipe = recipeRegistry.getRecipeDefinition('path-marker');
        const safeHouseSealRecipe = recipeRegistry.getRecipeDefinition('safe-house-seal');
        const fogLanternRecipe = recipeRegistry.getRecipeDefinition('fog-lantern');
        const merchantBeaconRecipe = recipeRegistry.getRecipeDefinition('merchant-beacon');

        const roadChalkIngredientIds = roadChalkRecipe.ingredients.map((ingredient) => ingredient.id);
        const pathMarkerIngredientIds = pathMarkerRecipe.ingredients.map((ingredient) => ingredient.id);
        const safeHouseSealIngredientIds = safeHouseSealRecipe.ingredients.map((ingredient) => ingredient.id);
        const fogLanternIngredientIds = fogLanternRecipe.ingredients.map((ingredient) => ingredient.id);
        const merchantBeaconIngredientIds = merchantBeaconRecipe.ingredients.map((ingredient) => ingredient.id);

        assertEqual(roadChalkRecipe.station, 'bench', 'Мел дорожника должен собираться на верстаке.');
        assertEqual(pathMarkerRecipe.station, 'bench', 'Маркер пути должен собираться на верстаке.');
        assertEqual(safeHouseSealRecipe.station, 'workbench', 'Печать безопасного дома должна собираться в мастерской.');
        assertEqual(fogLanternRecipe.station, 'workbench', 'Фонарь тумана должен собираться в мастерской.');
        assertEqual(merchantBeaconRecipe.station, 'workbench', 'Маяк торговца должен собираться в мастерской.');

        assertEqual(roadChalkIngredientIds.includes('stone_block'), true, 'Мел дорожника должен требовать stone_block.');
        assertEqual(pathMarkerIngredientIds.includes('roadChalk'), true, 'Маркер пути должен требовать roadChalk.');
        assertEqual(pathMarkerIngredientIds.includes('fiber_rope'), true, 'Маркер пути должен требовать fiber_rope.');
        assertEqual(safeHouseSealIngredientIds.includes('wood_plank_basic'), true, 'Печать должна требовать wood_plank_basic.');
        assertEqual(safeHouseSealIngredientIds.includes('fish_oil'), true, 'Печать должна требовать fish_oil.');
        assertEqual(safeHouseSealIngredientIds.includes('healing_base'), true, 'Печать должна требовать healing_base.');
        assertEqual(fogLanternIngredientIds.includes('fish_oil'), true, 'Фонарь тумана должен требовать fish_oil.');
        assertEqual(merchantBeaconIngredientIds.includes('fish_oil'), true, 'Маяк торговца должен требовать fish_oil.');

        ['road-chalk', 'path-marker', 'safe-house-seal', 'fog-lantern', 'merchant-beacon'].forEach((recipeId) => {
            assertEqual(recipeRegistry.isRecipeActive(recipeId, recipeRegistry.RECIPE_PROFILE_IDS.wave1Minimal), false, `Рецепт ${recipeId} не должен попадать в первую волну.`);
        });
    });

    addTest('52. утилитарные recipe outputs', 'Runtime может собрать roadChalk, pathMarker и safeHouseSeal как реальные utility items', () => {
        resetHarness();
        game.state.unlockedInventorySlots = 10;
        game.state.activeInteraction = buildStationInteraction('bench');
        inventoryRuntime.addInventoryItem('stone_block', 1);
        inventoryRuntime.addInventoryItem('fiber_rope', 1);

        const roadChalkEvaluation = craftingRuntime.evaluateRecipeAgainstInventory('road-chalk');
        const roadChalkOutcome = craftingRuntime.craftRecipeAgainstInventory('road-chalk');
        const pathMarkerEvaluation = craftingRuntime.evaluateRecipeAgainstInventory('path-marker');
        const pathMarkerOutcome = craftingRuntime.craftRecipeAgainstInventory('path-marker');

        assert(roadChalkEvaluation.success, 'Мел дорожника должен крафтиться на верстаке из stone_block.');
        assert(roadChalkOutcome && roadChalkOutcome.success, 'Крафт roadChalk должен завершаться успешно.');
        assert(pathMarkerEvaluation.success, 'Маркер пути должен крафтиться из roadChalk и fiber_rope.');
        assert(pathMarkerOutcome && pathMarkerOutcome.success, 'Крафт pathMarker должен завершаться успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('roadChalk'), 0, 'После сборки pathMarker мел должен быть израсходован.');
        assertEqual(inventoryRuntime.countInventoryItem('pathMarker'), 1, 'После крафта должен появляться pathMarker.');

        game.state.currentIslandIndex = 12;
        game.state.activeInteraction = buildStationInteraction('workbench', {
            expedition: {
                stationId: 'workbench',
                stationIds: ['workbench']
            }
        });
        inventoryRuntime.addInventoryItem('wood_plank_basic', 1);
        inventoryRuntime.addInventoryItem('fish_oil', 1);
        inventoryRuntime.addInventoryItem('healing_base', 1);

        const safeHouseSealEvaluation = craftingRuntime.evaluateRecipeAgainstInventory('safe-house-seal');
        const safeHouseSealOutcome = craftingRuntime.craftRecipeAgainstInventory('safe-house-seal');

        assert(safeHouseSealEvaluation.success, 'Печать безопасного дома должна собираться в мастерской из компонентных входов.');
        assert(safeHouseSealOutcome && safeHouseSealOutcome.success, 'Крафт safeHouseSeal должен завершаться успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('safeHouseSeal'), 1, 'После крафта должен появляться safeHouseSeal.');
    });

    addTest('54. новые kinds в item-effects', 'fishingRod и repair kits подключены к новым activeEffect kinds', () => {
        const fishingRodDefinition = itemRegistry.getItemDefinition('fishingRod');
        const boatReadyDefinition = itemRegistry.getItemDefinition('boat_ready');
        const bridgeRepairKitDefinition = itemRegistry.getItemDefinition('repair_kit_bridge');
        const boatRepairKitDefinition = itemRegistry.getItemDefinition('repair_kit_boat');

        assert(fishingRodDefinition && fishingRodDefinition.activeEffect && fishingRodDefinition.activeEffect.kind === 'startFishing', 'fishingRod должен использовать kind startFishing.');
        assert(boatReadyDefinition && boatReadyDefinition.activeEffect && boatReadyDefinition.activeEffect.kind === 'boatTraversal', 'boat_ready должен использовать kind boatTraversal.');
        assert(bridgeRepairKitDefinition && bridgeRepairKitDefinition.activeEffect && bridgeRepairKitDefinition.activeEffect.kind === 'repairStructure', 'repair_kit_bridge должен использовать kind repairStructure.');
        assertEqual(bridgeRepairKitDefinition.activeEffect.structureKind, 'bridge', 'repair_kit_bridge должен ремонтировать bridge.');
        assert(boatRepairKitDefinition && boatRepairKitDefinition.activeEffect && boatRepairKitDefinition.activeEffect.kind === 'repairStructure', 'repair_kit_boat должен использовать kind repairStructure.');
        assertEqual(boatRepairKitDefinition.activeEffect.structureKind, 'boat', 'repair_kit_boat должен ремонтировать boat.');
    });

    addTest('54. новые kinds в item-effects', 'startFishing запускает рыбалку через item-effects и не расходует удочку', () => {
        resetHarness();
        installResourceNodeWorld('fishingSpot', {
            islandIndex: 8,
            targetTileType: 'shore'
        });
        inventoryRuntime.addInventoryItem('fishingRod', 1);

        const rodIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'fishingRod');
        const rod = inventoryRuntime.getInventory()[rodIndex];
        game.state.selectedInventorySlot = rodIndex;
        const outcome = itemEffects.useInventoryItem(rod);

        assert(outcome && outcome.success, 'Использование удочки у fishing spot должно быть успешным.');
        assert(/собрано|точк/i.test(outcome.message || ''), 'Сообщение должно говорить о результате рыбалки.');
        assertEqual(inventoryRuntime.countInventoryItem('fishingRod'), 1, 'Удочка не должна расходоваться как инструмент запуска рыбалки.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_fish'), 1, 'Ранняя рыбалка должна давать обычную raw_fish.');
    });

    addTest('54. новые kinds в item-effects', 'startGather может запускать сбор ближайшего ресурсного узла без расхода инструмента', () => {
        resetHarness();
        installResourceNodeWorld('grassBush', {
            islandIndex: 5,
            targetTileType: 'grass'
        });

        withTemporaryItemDefinitions({
            id: 'gatherTotem',
            label: 'Тотем сбора',
            icon: 'TG',
            categories: ['tool', 'utility'],
            description: 'Тестовый предмет для запуска сбора.',
            activeEffect: { kind: 'startGather' }
        }, () => {
            inventoryRuntime.addInventoryItem('gatherTotem', 1);

            const toolIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'gatherTotem');
            const tool = inventoryRuntime.getInventory()[toolIndex];
            game.state.selectedInventorySlot = toolIndex;
            const outcome = itemEffects.useInventoryItem(tool);

            assert(
                outcome && outcome.success,
                `startGather должен запускать сбор ближайшего ресурса. ${outcome && outcome.message ? outcome.message : 'Нет результата.'}`
            );
            assertEqual(inventoryRuntime.countInventoryItem('gatherTotem'), 1, 'Тестовый инструмент сбора не должен расходоваться.');
            assertEqual(inventoryRuntime.countInventoryItem('raw_grass'), 1, 'После startGather должна добавляться собранная трава.');
        });
    });

    addTest('54. новые kinds в item-effects', 'Диагональный ресурс тоже считается соседним для startGather и обычного action UI', () => {
        resetHarness();
        installResourceNodeWorld('grassBush', {
            islandIndex: 5,
            targetTileType: 'grass',
            x: 1,
            y: 1
        });

        const target = actionUi.getGatherableTerrainTarget({ allowSelectedItem: true });
        assert(target && target.tileInfo && target.tileInfo.x === 1 && target.tileInfo.y === 1, 'Диагональный ресурс должен считаться в радиусе сбора для action UI.');

        withTemporaryItemDefinitions({
            id: 'gatherTotemDiagonal',
            label: 'Диагональный тотем сбора',
            icon: 'TD',
            categories: ['tool', 'utility'],
            description: 'Тестовый предмет для диагонального сбора.',
            activeEffect: { kind: 'startGather' }
        }, () => {
            inventoryRuntime.addInventoryItem('gatherTotemDiagonal', 1);

            const toolIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'gatherTotemDiagonal');
            const tool = inventoryRuntime.getInventory()[toolIndex];
            game.state.selectedInventorySlot = toolIndex;
            const outcome = itemEffects.useInventoryItem(tool);

            assert(outcome && outcome.success, 'startGather должен уметь собирать диагональный ресурс.');
            assertEqual(inventoryRuntime.countInventoryItem('raw_grass'), 1, 'Диагональный сбор должен добавлять ресурс в инвентарь.');
        });
    });

    addTest('54. новые kinds в item-effects', 'fillContainer может вести container cycle через отдельный управляющий effect kind', () => {
        resetHarness();
        installResourceNodeWorld('waterSource', {
            islandIndex: 4,
            targetTileType: 'shore'
        });
        inventoryRuntime.addInventoryItem('flask_empty', 1);

        withTemporaryItemDefinitions({
            id: 'fillHarness',
            label: 'Контроль наполнения',
            icon: 'KN',
            categories: ['tool', 'utility'],
            description: 'Тестовый предмет для запуска fillContainer.',
            activeEffect: { kind: 'fillContainer', containerItemId: 'flask_empty' }
        }, () => {
            inventoryRuntime.addInventoryItem('fillHarness', 1);

            const harnessIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'fillHarness');
            const harnessItem = inventoryRuntime.getInventory()[harnessIndex];
            game.state.selectedInventorySlot = harnessIndex;
            const outcome = itemEffects.useInventoryItem(harnessItem);

            assert(
                outcome && outcome.success,
                `fillContainer должен уметь вести fill cycle для целевого контейнера. ${outcome && outcome.message ? outcome.message : 'Нет результата.'}`
            );
            assertEqual(inventoryRuntime.countInventoryItem('fillHarness'), 1, 'Управляющий предмет fillContainer не должен расходоваться.');
            assertEqual(inventoryRuntime.countInventoryItem('flask_empty'), 0, 'Пустая фляга должна уйти в заполненное состояние.');
            assertEqual(inventoryRuntime.countInventoryItem('flask_water_dirty'), 1, 'После fillContainer должна появляться фляга сырой воды.');
        });
    });

    addTest('54. новые kinds в item-effects', 'openCraftPanel открывает инвентарь и craft panel без расхода предмета', () => {
        resetHarness();
        game.state.isInventoryPanelCollapsed = true;

        withTemporaryItemDefinitions({
            id: 'craftManual',
            label: 'Полевой справочник крафта',
            icon: 'CK',
            categories: ['tool', 'utility', 'info'],
            description: 'Тестовый предмет для открытия панели крафта.',
            activeEffect: { kind: 'openCraftPanel' }
        }, () => {
            inventoryRuntime.addInventoryItem('craftManual', 1);

            const manualIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'craftManual');
            const manualItem = inventoryRuntime.getInventory()[manualIndex];
            game.state.selectedInventorySlot = manualIndex;
            const outcome = itemEffects.useInventoryItem(manualItem);

            assert(
                outcome && outcome.success,
                `openCraftPanel должен успешно открывать сумку. ${outcome && outcome.message ? outcome.message : 'Нет результата.'}`
            );
            assertEqual(game.state.isInventoryPanelCollapsed, false, 'После openCraftPanel панель инвентаря должна быть раскрыта.');
            assertEqual(inventoryRuntime.countInventoryItem('craftManual'), 1, 'Предмет открытия craft panel не должен расходоваться.');
        });
    });

    addTest('54. новые kinds в item-effects', 'repairStructure чинит повреждённый мост и расходует repair_kit_bridge', () => {
        resetHarness();
        const world = installWorld([
            createTileInfo(0, 0, 'trail', {
                progression: buildProgression(6)
            }),
            createTileInfo(1, 0, 'bridge', {
                progression: buildProgression(6),
                travelZoneKey: 'oldBridge'
            })
        ], {
            islandIndex: 6,
            playerPos: { x: 0, y: 0 },
            defaultTileType: 'trail'
        });
        const bridgeTile = world.getTileInfo(1, 0);
        bridgeTile.localX = 1;
        bridgeTile.localY = 0;
        bridgeTile.chunk = {
            data: [['trail', 'bridge']],
            travelZones: [['none', 'oldBridge']],
            renderCache: {}
        };
        game.state.selectedWorldTile = { x: 1, y: 0 };
        inventoryRuntime.addInventoryItem('repair_kit_bridge', 1);

        const kitIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'repair_kit_bridge');
        const repairKit = inventoryRuntime.getInventory()[kitIndex];
        game.state.selectedInventorySlot = kitIndex;
        const outcome = itemEffects.useInventoryItem(repairKit);

        assert(
            outcome && outcome.success,
            `repairStructure должен чинить повреждённый мост. ${outcome && outcome.message ? outcome.message : 'Нет результата.'}`
        );
        assertEqual(inventoryRuntime.countInventoryItem('repair_kit_bridge'), 0, 'repair_kit_bridge должен расходоваться после ремонта.');
        assertEqual(game.systems.expedition.getBridgeDurability(bridgeTile), 2, 'После ремонта мост должен вернуться к полной прочности.');
        assertEqual(bridgeTile.travelZoneKey, 'none', 'После ремонта у моста должен сниматься старый travel zone.');
        assertEqual(bridgeTile.chunk.travelZones[0][1], 'none', 'Chunk travelZones тоже должны обновляться после ремонта.');
    });

    addTest('57. bridge-builder chain', 'Мостовая ветка проходит полный цикл: recipe output -> inventory item -> world placement -> degradation -> repair recipe', () => {
        resetHarness();
        game.state.unlockedInventorySlots = 8;
        game.state.inventory = Array.from({ length: 10 }, () => null);
        game.state.playerFacing = 'east';

        const progression = buildProgression(8);
        const world = installWorld([
            createTileInfo(0, 0, 'trail', { progression }),
            createTileInfo(1, 0, 'water', { baseTileType: 'water', progression }),
            createTileInfo(2, 0, 'trail', { progression })
        ], {
            islandIndex: 8,
            playerPos: { x: 0, y: 0 },
            defaultTileType: 'trail'
        });
        const sharedChunk = {
            data: [['trail', 'water', 'trail']],
            travelZones: [['none', 'none', 'none']],
            renderCache: {}
        };

        [0, 1, 2].forEach((x) => {
            const tileInfo = world.getTileInfo(x, 0);
            tileInfo.localX = x;
            tileInfo.localY = 0;
            tileInfo.chunk = sharedChunk;
        });

        inventoryRuntime.addInventoryItem('wood_plank_basic', 3);
        inventoryRuntime.addInventoryItem('fiber_rope', 2);
        inventoryRuntime.addInventoryItem('stone_block', 1);
        inventoryRuntime.addInventoryItem('gravel_fill', 1);

        const bridgeKitOutcome = craftingRuntime.craftRecipeAgainstInventory('portable-bridge', {
            availableStations: ['bench']
        });
        assert(bridgeKitOutcome && bridgeKitOutcome.success, 'bridge_kit должен крафтиться в инвентарь.');
        assertEqual(inventoryRuntime.countInventoryItem('bridge_kit'), 1, 'После первого шага должен появиться bridge_kit.');

        const portableBridgeOutcome = craftingRuntime.craftRecipeAgainstInventory('portable-bridge-assembly', {
            availableStations: ['bench']
        });
        assert(portableBridgeOutcome && portableBridgeOutcome.success, 'Из bridge_kit должен собираться portableBridge.');
        assertEqual(inventoryRuntime.countInventoryItem('portableBridge'), 1, 'После сборки в сумке должен лежать portableBridge.');

        const bridgeIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'portableBridge');
        const bridgeItem = inventoryRuntime.getInventory()[bridgeIndex];
        game.state.selectedInventorySlot = bridgeIndex;
        const bridgeUseOutcome = itemEffects.useInventoryItem(bridgeItem);

        assert(bridgeUseOutcome && bridgeUseOutcome.success, 'portableBridge должен укладываться в мир как bridgeBuilder-предмет.');
        assertEqual(sharedChunk.data[0][1], 'bridge', 'После использования bridgeBuilder на воде должна появиться клетка моста.');

        const placedBridgeRecord = game.systems.expedition.getPlacedBridgeRecord(1, 0);
        assert(placedBridgeRecord, 'После world placement должен сохраняться placed bridge record.');
        assertEqual(placedBridgeRecord.sourceItemId, 'portableBridge', 'Placed bridge должен помнить исходный craft-output item.');
        assertEqual(placedBridgeRecord.currentDurability, 2, 'Новый portable bridge должен иметь базовую прочность 2.');
        assertEqual(game.state.placedBridgeKeys['1,0'], true, 'Поставленный мост должен жить в world state.');

        const bridgeTile = world.getTileInfo(1, 0);
        const landingTile = world.getTileInfo(2, 0);
        const degradationOutcome = game.systems.expedition.handleTileTransition(bridgeTile, landingTile);

        assert(degradationOutcome, 'Мост должен деградировать после прохода.');
        assertEqual(degradationOutcome.status, 'weakened', 'После первого прохода portable bridge должен стать повреждённым.');
        assertEqual(game.systems.expedition.getBridgeDurability(bridgeTile), 1, 'Повреждённый portable bridge должен иметь 1 оставшийся проход.');
        assertEqual(sharedChunk.travelZones[0][1], 'oldBridge', 'После деградации мир должен показать старый мост через travel zone.');

        const repairKitOutcome = craftingRuntime.craftRecipeAgainstInventory('bridge-repair-kit', {
            availableStations: ['workbench']
        });
        assert(repairKitOutcome && repairKitOutcome.success, 'Ремкомплект моста должен крафтиться из оставшихся компонентов.');
        assertEqual(inventoryRuntime.countInventoryItem('repair_kit_bridge'), 1, 'После repair recipe должен появиться repair_kit_bridge.');

        const repairKitIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'repair_kit_bridge');
        const repairKit = inventoryRuntime.getInventory()[repairKitIndex];
        game.state.selectedWorldTile = { x: 1, y: 0 };
        game.state.selectedInventorySlot = repairKitIndex;
        const repairOutcome = itemEffects.useInventoryItem(repairKit);

        assert(repairOutcome && repairOutcome.success, 'repair_kit_bridge должен ремонтировать деградировавший placed bridge.');
        assertEqual(inventoryRuntime.countInventoryItem('repair_kit_bridge'), 0, 'repair_kit_bridge должен расходоваться после ремонта.');
        assertEqual(game.systems.expedition.getBridgeDurability(bridgeTile), 2, 'После ремонта placed bridge должен вернуть полную прочность.');
        assertEqual(sharedChunk.travelZones[0][1], 'none', 'После ремонта у world bridge должен сниматься аварийный travel zone.');
    });

    addTest('57. bridge-builder chain', 'Старый сейв с placedBridgeKeys мигрирует в placedBridgeStateByKey без потери деградации', () => {
        const migratedSnapshot = saveLoad.migrateSnapshot({
            saveVersion: 8,
            player: { inventory: [] },
            craftingState: {},
            world: {
                placedBridgeKeys: { '4,7': true },
                weakenedBridgeKeys: { '4,7': true },
                collapsedBridgeKeys: {}
            },
            narrative: {},
            ui: {}
        });

        assertEqual(migratedSnapshot.saveVersion, stateSchema.SAVE_VERSION, 'Сейв с legacy placedBridgeKeys должен мигрировать до актуальной версии.');
        assert(migratedSnapshot.world.placedBridgeStateByKey && migratedSnapshot.world.placedBridgeStateByKey['4,7'], 'После миграции должен появиться placedBridgeStateByKey.');
        assertEqual(migratedSnapshot.world.placedBridgeStateByKey['4,7'].sourceItemId, 'portableBridge', 'Legacy placed bridge должен получить базовый portableBridge-профиль.');
        assertEqual(migratedSnapshot.world.placedBridgeStateByKey['4,7'].currentDurability, 1, 'Legacy weakened bridge должен сохранить деградацию при миграции.');
        assertEqual(migratedSnapshot.world.placedBridgeStateByKey['4,7'].maxDurability, 2, 'Legacy placed bridge должен получить стандартную прочность 2.');
    });

    addTest('55. защита recipe-only items', 'recipe-only предмет без consumable и active effect не считается используемым напрямую', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('trade_papers', 1);

        const valueItemIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'trade_papers');
        const valueItem = inventoryRuntime.getInventory()[valueItemIndex];
        game.state.selectedInventorySlot = valueItemIndex;
        const outcome = itemEffects.useInventoryItem(valueItem);

        assertEqual(itemEffects.canUseInventoryItem(valueItem), false, 'trade_papers не должен считаться используемым предметом.');
        assert(outcome && !outcome.success, 'trade_papers не должен активироваться напрямую.');
        assert(/заготовк|рецептн|нельзя использовать напрямую/i.test(outcome.message || ''), 'Игрок должен получить понятное сообщение, что это craft-only предмет.');
        assertEqual(inventoryRuntime.countInventoryItem('trade_papers'), 1, 'trade_papers не должен расходоваться при прямом use.');
    });

    addTest('58. boat traversal chain', 'Лодочная ветка проходит полный цикл: recipe output -> water traversal -> damage state -> repair path', () => {
        resetHarness();
        game.state.unlockedInventorySlots = 10;
        game.state.inventory = Array.from({ length: 12 }, () => null);

        const progression = buildProgression(17);
        const world = installWorld([
            createTileInfo(0, 0, 'shore', { progression }),
            createTileInfo(1, 0, 'water', { baseTileType: 'water', progression }),
            createTileInfo(2, 0, 'water', { baseTileType: 'water', progression }),
            createTileInfo(3, 0, 'shore', { progression })
        ], {
            islandIndex: 17,
            playerPos: { x: 0, y: 0 },
            defaultTileType: 'shore'
        });
        const sharedChunk = {
            data: [['shore', 'water', 'water', 'shore']],
            travelZones: [['none', 'none', 'none', 'none']],
            renderCache: {}
        };

        [0, 1, 2, 3].forEach((x) => {
            const tileInfo = world.getTileInfo(x, 0);
            tileInfo.localX = x;
            tileInfo.localY = 0;
            tileInfo.chunk = sharedChunk;
        });

        inventoryRuntime.addInventoryItem('boatFrame', 1);
        inventoryRuntime.addInventoryItem('fish_oil', 2);
        inventoryRuntime.addInventoryItem('fiber_rope', 2);
        inventoryRuntime.addInventoryItem('wood_plank_basic', 1);

        assertEqual(game.systems.pathfinding.canTraverseWorldStep(0, 0, 1, 0), false, 'Без активной лодки путь по воде должен быть закрыт.');

        const boatOutcome = craftingRuntime.craftRecipeAgainstInventory('boat', {
            availableStations: ['workbench']
        });
        assert(boatOutcome && boatOutcome.success, 'boat_ready должен крафтиться в инвентарь.');
        assertEqual(inventoryRuntime.countInventoryItem('boat_ready'), 1, 'После рецепта должен появиться boat_ready.');

        const boatIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'boat_ready');
        const boatItem = inventoryRuntime.getInventory()[boatIndex];
        game.state.selectedInventorySlot = boatIndex;
        const boatUseOutcome = itemEffects.useInventoryItem(boatItem);

        assert(boatUseOutcome && boatUseOutcome.success, 'boat_ready должен активировать водный traversal runtime.');
        assertEqual(inventoryRuntime.countInventoryItem('boat_ready'), 0, 'После активации лодка должна выйти из инвентаря в runtime-состояние.');
        assertEqual(game.systems.boatRuntime.getBoatDurability(), 3, 'Новая лодка должна получать стартовую прочность 3.');
        assertEqual(game.systems.pathfinding.canTraverseWorldStep(0, 0, 1, 0), true, 'После активации лодки первый шаг по воде должен стать доступен.');
        assertEqual(game.systems.pathfinding.canTraverseWorldStep(1, 0, 2, 0), true, 'Маршрут по воде должен продолжаться через второй водный тайл.');

        const firstWaterTile = world.getTileInfo(1, 0);
        const secondWaterTile = world.getTileInfo(2, 0);
        const landingTile = world.getTileInfo(3, 0);
        const firstBoatTransition = game.systems.expedition.handleBoatTransition(firstWaterTile, secondWaterTile);
        const secondBoatTransition = game.systems.expedition.handleBoatTransition(secondWaterTile, landingTile);

        assert(firstBoatTransition, 'Лодка должна получать износ после водного перехода.');
        assertEqual(firstBoatTransition.status, 'worn', 'После первого перехода лодка должна остаться рабочей, но изношенной.');
        assertEqual(secondBoatTransition.status, 'damaged', 'После второй водной клетки лодка должна перейти в повреждённое состояние.');
        assertEqual(game.systems.boatRuntime.getBoatDurability(), 1, 'После двух водных клеток у лодки должен остаться 1 переход.');

        const waterTileAfterDamage = world.getTileInfo(1, 0);
        assertEqual(game.systems.boatRuntime.getWaterTraversalLabel(waterTileAfterDamage), 'вода на лодке', 'Водная клетка должна получать специальный traversal label при активной лодке.');

        const repairKitOutcome = craftingRuntime.craftRecipeAgainstInventory('boat-repair-kit', {
            availableStations: ['workbench']
        });
        assert(repairKitOutcome && repairKitOutcome.success, 'repair_kit_boat должен крафтиться из компонентных входов.');
        assertEqual(inventoryRuntime.countInventoryItem('repair_kit_boat'), 1, 'После repair recipe должен появиться repair_kit_boat.');

        const repairKitIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'repair_kit_boat');
        const repairKit = inventoryRuntime.getInventory()[repairKitIndex];
        game.state.selectedInventorySlot = repairKitIndex;
        const repairOutcome = itemEffects.useInventoryItem(repairKit);

        assert(repairOutcome && repairOutcome.success, 'repair_kit_boat должен восстанавливать активную лодку.');
        assertEqual(inventoryRuntime.countInventoryItem('repair_kit_boat'), 0, 'repair_kit_boat должен расходоваться после ремонта.');
        assertEqual(game.systems.boatRuntime.getBoatDurability(), 3, 'После ремонта лодка должна вернуть полную прочность.');
    });

    addTest('58. boat traversal chain', 'Старый сейв мигрирует к новой схеме и не теряет состояние активной лодки', () => {
        const migratedSnapshot = saveLoad.migrateSnapshot({
            saveVersion: 9,
            player: {
                inventory: [],
                boatTraversalState: {
                    sourceItemId: 'boat_ready',
                    label: 'Готовая лодка',
                    currentDurability: 1,
                    maxDurability: 3,
                    waterTravelMultiplier: 1.34,
                    waterRouteBand: 'hazard',
                    waterTraversalLabel: 'вода на лодке'
                }
            },
            craftingState: {},
            world: {},
            narrative: {},
            ui: {}
        });

        assertEqual(migratedSnapshot.saveVersion, stateSchema.SAVE_VERSION, 'Сейв с лодочным state должен мигрировать до актуальной версии.');
        assert(migratedSnapshot.player.boatTraversalState, 'После миграции лодочное состояние не должно теряться.');
        assertEqual(migratedSnapshot.player.boatTraversalState.sourceItemId, 'boat_ready', 'После миграции должна сохраниться ссылка на source boat item.');
        assertEqual(migratedSnapshot.player.boatTraversalState.currentDurability, 1, 'После миграции должна сохраняться текущая прочность лодки.');
    });

    addTest('55. защита recipe-only items', 'value output из рецепта не пытается прожиматься как расходник', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('trade_papers', 1);

        const papersIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'trade_papers');
        const papersItem = inventoryRuntime.getInventory()[papersIndex];
        game.state.selectedInventorySlot = papersIndex;
        const outcome = itemEffects.useInventoryItem(papersItem);

        assertEqual(itemEffects.canUseInventoryItem(papersItem), false, 'trade_papers не должны считаться consumable.');
        assert(outcome && !outcome.success, 'trade_papers не должны использоваться как активный предмет.');
        assert(/обмен|рецепт|нельзя использовать напрямую/i.test(outcome.message || ''), 'Для trade_papers должно быть явное сообщение про обмен/рецепты.');
        assertEqual(inventoryRuntime.countInventoryItem('trade_papers'), 1, 'trade_papers не должны расходоваться от прямого use.');
    });

    addTest('55. защита recipe-only items', 'recipe-driven consumable остаётся используемым, если у него есть реальный consumable profile', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('energyTonic', 1);

        const tonicIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'energyTonic');
        const tonicItem = inventoryRuntime.getInventory()[tonicIndex];
        game.state.selectedInventorySlot = tonicIndex;
        const beforeEnergy = bridge.getStatValue('energy');
        const outcome = itemEffects.useInventoryItem(tonicItem);

        assertEqual(itemEffects.canUseInventoryItem(tonicItem), true, 'energyTonic должен оставаться используемым recipe-driven consumable.');
        assert(outcome && outcome.success, 'energyTonic должен использоваться успешно.');
        assert(bridge.getStatValue('energy') > beforeEnergy, 'energyTonic должен реально восстанавливать энергию.');
        assertEqual(inventoryRuntime.countInventoryItem('energyTonic'), 0, 'energyTonic должен расходоваться как обычный consumable.');
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

    addTest('34. каноничные компоненты', 'Старые component item ids в сейве мигрируют в каноничные без потери количества', () => {
        const migratedSnapshot = saveLoad.migrateSnapshot({
            saveVersion: 6,
            player: {
                inventory: [
                    { id: 'rope', icon: 'VR', label: 'Верёвка', quantity: 2 },
                    { id: 'fiber_rope', icon: 'VR', label: 'Верёвка', quantity: 1 },
                    { id: 'fishOil', icon: 'FO', label: 'Рыбий жир', quantity: 1 },
                    { id: 'board', icon: 'BD', label: 'Доска', quantity: 3 },
                    null
                ],
                selectedInventorySlot: 0
            },
            craftingState: stateSchema.createDomainState().craftingState,
            world: {
                groundItemsByKey: {
                    '0,0': [
                        { id: 'fuelBundle', icon: 'TB', label: 'Топливная связка', quantity: 1 },
                        { id: 'fuel_bundle', icon: 'TB', label: 'Топливная связка', quantity: 2 }
                    ]
                }
            },
            narrative: {},
            ui: {}
        });

        assertEqual(migratedSnapshot.saveVersion, stateSchema.SAVE_VERSION, 'Сейв должен мигрировать до актуальной версии.');
        assertEqual(migratedSnapshot.player.inventory[0].id, 'fiber_rope', 'rope должен мигрировать в fiber_rope.');
        assertEqual(migratedSnapshot.player.inventory[0].quantity, 3, 'Количество rope и fiber_rope должно объединяться.');
        assertEqual(migratedSnapshot.player.inventory[2].id, 'fish_oil', 'fishOil должен мигрировать в fish_oil.');
        assertEqual(migratedSnapshot.player.inventory[3].id, 'wood_plank_basic', 'board должен мигрировать в wood_plank_basic.');
        assertEqual(migratedSnapshot.world.groundItemsByKey['0,0'][0].id, 'fuel_bundle', 'fuelBundle на земле должен мигрировать в fuel_bundle.');
        assertEqual(migratedSnapshot.world.groundItemsByKey['0,0'][0].quantity, 3, 'Старый и новый fuel_bundle на земле должны объединяться.');
    });

    addTest('8. event bus для крафта', 'craft:completed эмитится после успешного крафта', () => {
        resetHarness();
        let eventPayload = null;
        gameEvents.on(gameEvents.EVENTS.CRAFT_COMPLETED, (event) => {
            eventPayload = event.payload;
        });

        craftingRuntime.craftRecipeAgainstStock('portable-bridge', {
            stockEntries: [
                craftingRuntime.buildStockEntry('component', 'wood_plank_basic', 'Доска', 2),
                craftingRuntime.buildStockEntry('component', 'fiber_rope', 'Верёвка', 1),
                craftingRuntime.buildStockEntry('component', 'stone_block', 'Каменный блок', 1)
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
                craftingRuntime.buildStockEntry('component', 'wood_plank_basic', 'Доска', 2),
                craftingRuntime.buildStockEntry('component', 'fiber_rope', 'Верёвка', 1),
                craftingRuntime.buildStockEntry('component', 'stone_block', 'Каменный блок', 1)
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
        assertEqual(inventoryRuntime.countInventoryItem('healing_base'), 0, 'Готовый компонент не должен появляться сразу при сборе травы.');
        assertEqual(inventoryRuntime.countInventoryItem('fiber_rope'), 0, 'Верёвка не должна выпадать напрямую при сборе травы.');
    });

    addTest('9. raw_* ресурсы', 'Сбор дерева даёт raw_wood, а не доски', () => {
        resetHarness();
        installResourceNodeWorld('woodTree', {
            islandIndex: 12,
            targetTileType: 'grass'
        });

        actionUi.handleUseAction();

        assertEqual(inventoryRuntime.countInventoryItem('raw_wood'), 1, 'Сбор дерева должен давать raw_wood.');
        assertEqual(inventoryRuntime.countInventoryItem('wood_plank_basic'), 0, 'Доска не должна появляться напрямую при сборе дерева.');
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
        assertEqual(inventoryRuntime.countInventoryItem('healing_base'), 0, 'Готовый лечебный компонент не должен выпадать сразу при сборе тростника.');
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
        assertEqual(inventoryRuntime.countInventoryItem('stone_block'), 1, 'Из 5 raw_stone должен получаться 1 stone_block.');
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
        assertEqual(inventoryRuntime.countInventoryItem('gravel_fill'), 0, 'Компонент не должен появляться из 4 единиц сырья.');
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
        assertEqual(inventoryRuntime.countInventoryItem('stone_block'), 2, 'Из 10 raw_stone должно получаться 2 stone_block.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_stone'), 0, 'После двух сжатий не должно оставаться сырья.');
    });

    addTest('11. compression pipeline', 'простые конверсии ресурсов больше не живут в item catalog', () => {
        ['raw_grass', 'raw_reeds', 'raw_stone', 'raw_rubble', 'raw_wood', 'raw_fish', 'soilClod'].forEach((itemId) => {
            const definition = itemRegistry.getItemDefinition(itemId);
            assert(definition, `Не найден item definition для ${itemId}.`);
            assertEqual(Boolean(definition.conversion), false, `${itemId} не должен хранить conversion внутри item catalog.`);
        });

        const soilRecipeIds = withTemporaryRecipeProfile('allRecipes', () => compressionRuntime.getCompressionRecipesForSourceItem('soilClod', {
            station: 'hand'
        }).map((recipe) => recipe.recipeId));

        assert(soilRecipeIds.includes('soil-clod-to-soil-resource'), 'soilClod должен находить conversion через compression/runtime-рецепт в полном craft-реестре.');
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

    addTest('11. compression pipeline', 'raw_grass сжимается в healing_base через явный recipeId', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('raw_grass', 5);

        const outcome = compressionRuntime.compressSourceItem('raw_grass', {
            recipeId: 'grass-to-healing-base',
            availableStations: ['hand']
        });

        assert(outcome.success, 'Сжатие raw_grass в healing_base не завершилось успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_grass'), 0, 'Трава не была израсходована полностью.');
        assertEqual(inventoryRuntime.countInventoryItem('healing_base'), 1, 'healing_base не появился после сжатия.');
    });

    addTest('11. compression pipeline', 'raw_reeds сжимается в healing_base через явный recipeId', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('raw_reeds', 5);

        const outcome = compressionRuntime.compressSourceItem('raw_reeds', {
            recipeId: 'reeds-to-healing-base',
            availableStations: ['hand']
        });

        assert(outcome.success, 'Сжатие raw_reeds в healing_base не завершилось успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_reeds'), 0, 'Тростник не был израсходован полностью.');
        assertEqual(inventoryRuntime.countInventoryItem('healing_base'), 1, 'healing_base не появился после сжатия тростника.');
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
        assertEqual(inventoryRuntime.countInventoryItem('fiber_rope'), 1, 'После крафта из тростника должна появиться верёвка.');
    });

    addTest('11. compression pipeline', 'soilClod сжимается через единый pipeline и даёт soilResource', () => {
        withTemporaryRecipeProfile(recipeRegistry.RECIPE_PROFILE_IDS.allRecipes, () => {
            resetHarness();
            inventoryRuntime.addInventoryItem('soilClod', 5);

            const outcome = compressionRuntime.compressSourceItem('soilClod', {
                availableStations: ['hand']
            });

            assert(outcome.success, 'Сжатие soilClod не завершилось успешно.');
            assertEqual(inventoryRuntime.countInventoryItem('soilClod'), 0, 'Комья земли не были израсходованы полностью.');
            assertEqual(inventoryRuntime.countInventoryItem('soilResource'), 1, 'Результат soilResource не появился после сжатия.');
        });
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

    addTest('12. resourceNode interactions', 'Base generation сохраняет обычные кусты и деревья, но откладывает рыболовные точки', () => {
        resetHarness();
        const fullInteractions = createChunkInteractionsForTest({
            islandIndex: 4,
            chunkSource: buildResourceBiomeChunk(),
            interactionMode: 'full',
            random: () => 0.4
        });
        const interactions = createChunkInteractionsForTest({
            islandIndex: 4,
            chunkSource: buildResourceBiomeChunk(),
            interactionMode: 'base',
            random: () => 0.4
        });
        const fullNodeKinds = fullInteractions
            .filter((interaction) => interaction.kind === 'resourceNode')
            .map((interaction) => interaction.resourceNodeKind);
        const nodeKinds = interactions
            .filter((interaction) => interaction.kind === 'resourceNode')
            .map((interaction) => interaction.resourceNodeKind);

        assert(fullNodeKinds.includes('grassBush'), 'Контрольный full-спавн должен содержать grassBush.');
        assert(nodeKinds.includes('grassBush'), 'В base-режиме должен оставаться grassBush.');
        assert(nodeKinds.includes('reedPatch'), 'В base-режиме должен оставаться reedPatch.');
        if (fullNodeKinds.includes('woodTree')) {
            assert(nodeKinds.includes('woodTree'), 'Если full-спавн дал woodTree, base-режим не должен его терять.');
        }
        assertEqual(nodeKinds.includes('fishingSpot'), false, 'Береговой fishingSpot должен откладываться до full generation.');
        assertEqual(nodeKinds.includes('fishingReedsSpot'), false, 'Тростниковый fishingSpot должен откладываться до full generation.');
        assertEqual(nodeKinds.includes('fishingCalmSpot'), false, 'Спокойный fishingSpot должен откладываться до full generation.');
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

    addTest('67. craft_merchant и station_keeper', 'Новые NPC типы есть в registry и не сваливаются обратно в обычный merchant/artisan поток', () => {
        const craftMerchantDefinition = npcRegistry.getNpcDefinition('craft_merchant');
        const stationKeeperDefinition = npcRegistry.getNpcDefinition('station_keeper');

        assert(craftMerchantDefinition, 'В registry должен существовать craft_merchant.');
        assertEqual(craftMerchantDefinition.kind, 'craft_merchant', 'craft_merchant должен иметь собственный kind.');
        assert(stationKeeperDefinition, 'В registry должен существовать station_keeper.');
        assertEqual(stationKeeperDefinition.kind, 'station_keeper', 'station_keeper должен иметь собственный kind.');
    });

    addTest('67. craft_merchant и station_keeper', 'Bag upgrade профиль создаёт craft_merchant, а station_keeper открывает станцию отдельно', () => {
        resetHarness();
        const encounter = bagUpgradeRuntime.createArtisanEncounterProfile(4, () => 0.5);
        assertEqual(encounter.kind, 'craft_merchant', 'Ремесленный заказ на сумку должен использовать craft_merchant.');

        game.state.activeInteraction = buildTestHouse('station_keeper', 6, 6, {
            label: 'Хранитель верстака',
            locationLabel: 'Хранитель верстака',
            summary: 'Держит явную станцию',
            stationId: 'bench',
            stationIds: ['bench']
        });

        const stationContext = stationRuntime.getActiveStationContext();
        const availableStations = craftingRuntime.resolveAvailableStations();

        assertEqual(stationContext.activeSourceLabel, 'Хранитель станции', 'Для station_keeper должен собираться отдельный station source context.');
        assertEqual(stationContext.activeStationId, 'bench', 'station_keeper должен открывать привязанную станцию.');
        assert(availableStations.includes('bench'), 'station_keeper должен реально открывать station runtime.');
    });

    addTest('67. craft_merchant и station_keeper', 'Рядом со station_keeper появляется отдельный workbench interaction', () => {
        resetHarness();
        const houses = [
            buildTestHouse('station_keeper', 9, 12, {
                label: 'Хранитель мастерской',
                locationLabel: 'Хранитель мастерской',
                buildingType: 'workshop',
                stationId: 'workbench',
                stationIds: ['workbench'],
                summary: 'Тестовая станция'
            })
        ];
        const interactions = createChunkInteractionsForTest({
            islandIndex: 8,
            chunkSource: buildResourceBiomeChunk(),
            houses
        });
        const keeperInteraction = interactions.find((interaction) => interaction.kind === 'station_keeper');
        const workbenchInteraction = interactions.find((interaction) => interaction.kind === 'workbench');

        assert(keeperInteraction, 'В чанке должен появиться station_keeper interaction.');
        assert(workbenchInteraction, 'Рядом со station_keeper должен появиться отдельный workbench interaction.');
        assert(Array.isArray(workbenchInteraction.expedition.stationIds) && workbenchInteraction.expedition.stationIds.includes('workbench'), 'У workbench interaction должна быть явная станция workbench.');
        assert(
            keeperInteraction.localX !== workbenchInteraction.localX || keeperInteraction.localY !== workbenchInteraction.localY,
            'Workbench не должен накладываться на station_keeper interaction.'
        );
    });

    addTest('71. bag upgrade artisans', 'Ранний ремесленник сумки принимает crafted loadout через новую крафтовую экономику', () => {
        resetHarness();
        const stage = bagUpgradeRuntime.getStageById('bagUpgrade_4_5');
        const inventoryItems = [
            itemRegistry.createInventoryItem('ration', 1),
            itemRegistry.createInventoryItem('roadChalk', 1),
            itemRegistry.createInventoryItem('healing_base', 1)
        ].filter(Boolean);
        const evaluation = bagUpgradeRuntime.getStageEvaluation(stage, {
            inventoryItems,
            unlockedSlots: 4,
            currentIslandIndex: 4
        });
        const displayState = bagUpgradeRuntime.buildQuestDisplayState(stage, evaluation);

        assert(evaluation.isComplete, 'Ранний crafted loadout должен закрывать базовый апгрейд сумки.');
        assert(
            displayState.collectedSummaryLabel.includes('Травяная база лечения'),
            'В UI bag upgrade должен показываться человекочитаемый crafted предмет, а не абстрактная категория.'
        );
    });

    addTest('71. bag upgrade artisans', 'Средние стадии сумки умеют матчить маршрутные и логистические crafted loadouts', () => {
        resetHarness();
        const routeStage = bagUpgradeRuntime.getStageById('bagUpgrade_5_6');
        const logisticsStage = bagUpgradeRuntime.getStageById('bagUpgrade_6_7');
        const routeEvaluation = bagUpgradeRuntime.getStageEvaluation(routeStage, {
            inventoryItems: [
                itemRegistry.createInventoryItem('portableBridge', 1),
                itemRegistry.createInventoryItem('healing_base', 1),
                itemRegistry.createInventoryItem('market_seal', 1),
                itemRegistry.createInventoryItem('fiber_rope', 1)
            ].filter(Boolean),
            unlockedSlots: 5,
            currentIslandIndex: 8
        });
        const routeMatchedIds = routeEvaluation.requirementMatches.matches
            .filter((entry) => entry && entry.satisfied)
            .map((entry) => entry.item && entry.item.id)
            .filter(Boolean);

        const logisticsEvaluation = bagUpgradeRuntime.getStageEvaluation(logisticsStage, {
            inventoryItems: [
                itemRegistry.createInventoryItem('portableBridge', 1),
                itemRegistry.createInventoryItem('healing_base', 1),
                itemRegistry.createInventoryItem('roadChalk', 1),
                itemRegistry.createInventoryItem('fish_oil', 1)
            ].filter(Boolean),
            unlockedSlots: 6,
            currentIslandIndex: 12
        });
        const logisticsMatchedIds = logisticsEvaluation.requirementMatches.matches
            .filter((entry) => entry && entry.satisfied)
            .map((entry) => entry.item && entry.item.id)
            .filter(Boolean);

        assert(routeEvaluation.isComplete, 'Маршрутный crafted loadout должен закрывать стадию 5→6.');
        assert(routeMatchedIds.includes('fiber_rope'), 'Stage 5→6 должен реально принимать fiber_rope как crafted route-loadout.');
        assert(logisticsEvaluation.isComplete, 'Логистический crafted loadout должен закрывать стадию 6→7.');
        assert(logisticsMatchedIds.includes('fish_oil'), 'Stage 6→7 должен реально принимать fish_oil как crafted logistics-loadout.');
    });

    addTest('71. bag upgrade artisans', 'Bias под bag upgrade теперь умеет вести генерацию в сторону crafted loadouts', () => {
        resetHarness();
        const previousSlots = game.state.unlockedInventorySlots;

        try {
            game.state.unlockedInventorySlots = 6;

            const bias = bagUpgradeRuntime.getActiveBagQuestGenerationBias(12);
            const preferredRequirementItemIds = (bias && Array.isArray(bias.preferredRequirements) ? bias.preferredRequirements : [])
                .flatMap((requirement) => {
                    const directItemIds = Array.isArray(requirement && requirement.itemIds) ? requirement.itemIds : [];
                    const nestedItemIds = Array.isArray(requirement && requirement.matchAny)
                        ? requirement.matchAny.flatMap((rule) => Array.isArray(rule && rule.itemIds) ? rule.itemIds : [])
                        : [];
                    return [...directItemIds, ...nestedItemIds];
                });

            assert(bias, 'Для активной bag-upgrade стадии должен собираться generation bias.');
            assert(
                preferredRequirementItemIds.includes('fish_oil') || preferredRequirementItemIds.includes('wood_frame_basic'),
                'Generation bias bag upgrade должен сохранять crafted itemIds для подыгрывания новой крафтовой экономике.'
            );
        } finally {
            game.state.unlockedInventorySlots = previousSlots;
        }
    });

    addTest('72. artisan orders crafted loadouts', 'Bag upgrade data хранит именованные crafted loadout profiles для artisan orders', () => {
        const bagUpgradeData = game.systems.bagUpgradeData;
        const survivorKit = bagUpgradeData.getCraftedLoadoutProfile('survivorKit');
        const bridgeKit = bagUpgradeData.getCraftedLoadoutProfile('bridgeKit');
        const longRouteKit = bagUpgradeData.getCraftedLoadoutProfile('longRouteKit');

        assert(survivorKit, 'Должен существовать профиль survivorKit.');
        assert(bridgeKit, 'Должен существовать профиль bridgeKit.');
        assert(longRouteKit, 'Должен существовать профиль longRouteKit.');
        assertEqual(survivorKit.label, 'Комплект выжившего', 'survivorKit должен иметь человекочитаемое имя.');
        assertEqual(bridgeKit.label, 'Мостовой набор', 'bridgeKit должен иметь человекочитаемое имя.');
        assertEqual(longRouteKit.label, 'Комплект дальнего маршрута', 'longRouteKit должен иметь человекочитаемое имя.');
    });

    addTest('72. artisan orders crafted loadouts', 'Matcher artisan orders умеет читать sourceRecipeTags у собранных наборов', () => {
        const bridgeEvaluation = itemRegistry.evaluateRequirementMatches([
            itemRegistry.createInventoryItem('portableBridge', 1)
        ].filter(Boolean), [
            { sourceRecipeTags: ['bridge'] }
        ], {
            currentIslandIndex: 8
        });
        const survivorEvaluation = itemRegistry.evaluateRequirementMatches([
            itemRegistry.createInventoryItem('healingBrew', 1)
        ].filter(Boolean), [
            { sourceRecipeTags: ['survival', 'healing'] }
        ], {
            currentIslandIndex: 8
        });
        const routeEvaluation = itemRegistry.evaluateRequirementMatches([
            itemRegistry.createInventoryItem('roadChalk', 1)
        ].filter(Boolean), [
            { sourceRecipeTags: ['route', 'info'] }
        ], {
            currentIslandIndex: 12
        });

        assert(bridgeEvaluation.isComplete, 'Мостовой собранный предмет должен матчиться по sourceRecipeTags.');
        assert(survivorEvaluation.isComplete, 'Выживательный собранный предмет должен матчиться по sourceRecipeTags.');
        assert(routeEvaluation.isComplete, 'Маршрутный собранный предмет должен матчиться по sourceRecipeTags.');
    });

    addTest('72. artisan orders crafted loadouts', 'Artisan orders используют наборы выжившего, моста и дальнего маршрута в реальных стадиях', () => {
        const earlyStage = bagUpgradeRuntime.getStageById('bagUpgrade_4_5');
        const bridgeStage = bagUpgradeRuntime.getStageById('bagUpgrade_5_6');
        const routeStage = bagUpgradeRuntime.getStageById('bagUpgrade_6_7');
        const earlyEvaluation = bagUpgradeRuntime.getStageEvaluation(earlyStage, {
            inventoryItems: [
                itemRegistry.createInventoryItem('ration', 1),
                itemRegistry.createInventoryItem('roadChalk', 1),
                itemRegistry.createInventoryItem('healingBrew', 1)
            ].filter(Boolean),
            unlockedSlots: 4,
            currentIslandIndex: 4
        });
        const bridgeEvaluation = bagUpgradeRuntime.getStageEvaluation(bridgeStage, {
            inventoryItems: [
                itemRegistry.createInventoryItem('portableBridge', 1),
                itemRegistry.createInventoryItem('healing_base', 1),
                itemRegistry.createInventoryItem('market_seal', 1),
                itemRegistry.createInventoryItem('fiber_rope', 1)
            ].filter(Boolean),
            unlockedSlots: 5,
            currentIslandIndex: 8
        });
        const routeDisplay = bagUpgradeRuntime.buildQuestDisplayState(routeStage, bagUpgradeRuntime.getStageEvaluation(routeStage, {
            inventoryItems: [
                itemRegistry.createInventoryItem('portableBridge', 1),
                itemRegistry.createInventoryItem('healing_base', 1),
                itemRegistry.createInventoryItem('roadChalk', 1),
                itemRegistry.createInventoryItem('fish_oil', 1)
            ].filter(Boolean),
            unlockedSlots: 6,
            currentIslandIndex: 12
        }));

        assert(earlyEvaluation.isComplete, 'Комплект выжившего должен реально закрывать ранний artisan order.');
        assert(bridgeEvaluation.isComplete, 'Мостовой набор должен реально закрывать средний artisan order.');
        assert(
            routeDisplay.missingSummaryLabel.includes('Комплект дальнего маршрута')
                || routeDisplay.collectedSummaryLabel.includes('Мел дорожника')
                || routeDisplay.questCategoryLabels.includes('дальний маршрут'),
            'UI artisan order должен показывать дальний маршрут как именованный набор, а не как безымянный список предметов.'
        );
    });

    addTest('68. station recipes in UI', 'Станция показывает рецепты, ингредиенты и причину недоступности', () => {
        resetHarness();
        assert(stationUi && typeof stationUi.openStationPanel === 'function', 'stationUi должен быть доступен в тестовом окружении.');

        game.state.activeInteraction = buildStationInteraction('camp');

        const opened = stationUi.openStationPanel(game.state.activeInteraction, { silent: true });
        const rendered = stationUi.renderStationPanel(game.state.activeInteraction);
        const stationPanel = document.getElementById('stationPanel');
        const content = document.getElementById('stationPanelContent');
        const recipeButton = content ? content.querySelector('[data-crafting-recipe-id="boil-water"]') : null;
        const text = getCollapsedNodeText(content);

        assert(opened, 'Лагерная станция должна открывать station panel.');
        assert(rendered, 'Station panel должен успешно отрисоваться.');
        assert(stationPanel && stationPanel.hidden === false, 'Station panel должен стать видимым.');
        assert(text.includes('Вскипятить воду'), 'В панели должен быть виден рецепт boil-water.');
        assert(text.includes('Фляга сырой воды'), 'В панели должен быть виден список нужных ингредиентов.');
        assert(text.includes('Топливная связка'), 'В панели должны отображаться все нужные ингредиенты.');
        assert(text.includes('Не хватает ингредиентов'), 'Для недоступного рецепта должна показываться явная причина недоступности.');
        assert(recipeButton, 'У рецепта должна быть кнопка действия.');
        assert(recipeButton.disabled, 'Без ингредиентов кнопка рецепта должна быть отключена.');
    });

    addTest('68. station recipes in UI', 'station_keeper показывает только рецепты своей станции и помечает доступные сборки', () => {
        resetHarness();
        assert(stationUi && typeof stationUi.openStationPanel === 'function', 'stationUi должен быть доступен в тестовом окружении.');

        game.state.activeInteraction = buildTestHouse('station_keeper', 6, 6, {
            label: 'Хранитель верстака',
            locationLabel: 'Хранитель верстака',
            summary: 'Показывает рецепты верстака',
            stationId: 'bench',
            stationIds: ['bench']
        });
        inventoryRuntime.addInventoryItem('raw_grass', 10);

        const opened = stationUi.openStationPanel(game.state.activeInteraction, { silent: true });
        const rendered = stationUi.renderStationPanel(game.state.activeInteraction);
        const content = document.getElementById('stationPanelContent');
        const recipeButton = content ? content.querySelector('[data-crafting-recipe-id="grass-to-rope"]') : null;
        const text = getCollapsedNodeText(content);

        assert(opened, 'station_keeper должен открывать station panel.');
        assert(rendered, 'station_keeper должен успешно отрисовывать свою станцию.');
        assert(text.includes('Верёвка из волокна'), 'У хранителя станции должен быть виден рецепт его станции.');
        assert(text.includes('Трава'), 'У рецепта должны показываться нужные ингредиенты.');
        assert(text.includes('Готово к сборке'), 'Доступный рецепт должен помечаться как готовый.');
        assert(!text.includes('Травяная база лечения'), 'Панель станции не должна подмешивать hand-рецепты, если открыт верстак.');
        assert(recipeButton, 'У доступного station recipe должна быть кнопка.');
        assertEqual(recipeButton.disabled, false, 'Доступный рецепт не должен быть заблокирован.');
    });

    addTest('85. craft panel UI', 'Отдельная панель крафта показывает фильтры по станциям и ролям', () => {
        resetHarness();
        assert(stationUi && typeof stationUi.openCraftPanel === 'function', 'stationUi должен уметь открывать отдельную панель крафта.');

        const opened = stationUi.openCraftPanel({ silent: true });
        const rendered = stationUi.renderStationPanel();
        const content = document.getElementById('stationPanelContent');
        const stationFilter = content ? content.querySelector('[data-station-panel-filter-type="station"][data-station-panel-filter-id="camp"]') : null;
        const roleFilter = content ? content.querySelector('[data-station-panel-filter-type="role"][data-station-panel-filter-id="food"]') : null;
        const text = getCollapsedNodeText(content);

        assert(opened, 'Глобальная панель крафта должна открываться без привязки к конкретной станции.');
        assert(rendered, 'Глобальная панель крафта должна успешно отрисовываться.');
        assert(stationFilter, 'В craft panel должен быть виден фильтр по станциям.');
        assert(roleFilter, 'В craft panel должен быть виден фильтр по ролям.');
        assert(text.includes('Все станции'), 'Панель должна содержать список станционных фильтров.');
        assert(text.includes('Utility'), 'Панель должна содержать role-фильтр utility.');
    });

    addTest('85. craft panel UI', 'Фильтры по станциям и ролям реально меняют список рецептов', () => {
        resetHarness();
        assert(stationUi && typeof stationUi.openCraftPanel === 'function', 'stationUi должен уметь открывать отдельную панель крафта.');

        game.state.activeInteraction = buildStationInteraction('camp');

        const opened = stationUi.openCraftPanel({ silent: true });
        const rendered = stationUi.renderStationPanel(game.state.activeInteraction);
        let content = document.getElementById('stationPanelContent');
        let stationFilter = content ? content.querySelector('[data-station-panel-filter-type="station"][data-station-panel-filter-id="bench"]') : null;

        assert(opened, 'Панель крафта должна открываться в глобальном режиме рядом со станцией.');
        assert(rendered, 'Панель крафта должна успешно рисоваться рядом со станцией.');
        assert(stationFilter, 'В панели должен быть доступен фильтр верстака.');

        stationFilter.click();
        content = document.getElementById('stationPanelContent');

        let text = getCollapsedNodeText(content);
        assert(text.includes('Мост-комплект'), 'После фильтра верстака должны быть видны мостовые рецепты.');
        assert(!text.includes('Вскипятить воду'), 'После фильтра верстака не должны оставаться лагерные рецепты.');
        assert(text.includes('Нужна другая станция'), 'Панель должна честно показывать причину недоступности для чужой станции.');

        const roleFilter = content ? content.querySelector('[data-station-panel-filter-type="role"][data-station-panel-filter-id="bridge"]') : null;
        assert(roleFilter, 'После выбора станции должен оставаться доступен role-фильтр мостов.');

        roleFilter.click();
        content = document.getElementById('stationPanelContent');
        text = getCollapsedNodeText(content);

        assert(text.includes('Мост-комплект'), 'После role-фильтра мостовые рецепты должны остаться.');
        assert(!text.includes('Готовая лодка'), 'Role-фильтр мостов должен отсеивать лодочную ветку.');
    });

    addTest('86. recipe card details', 'Карточка рецепта показывает название, требования, где применять и островные окна', () => {
        resetHarness();
        assert(stationUi && typeof stationUi.openStationPanel === 'function', 'stationUi должен быть доступен в тестовом окружении.');

        game.state.activeInteraction = buildTestHouse('station_keeper', 6, 6, {
            label: 'Хранитель верстака',
            locationLabel: 'Хранитель верстака',
            summary: 'Показывает рецепты верстака',
            stationId: 'bench',
            stationIds: ['bench']
        });

        const opened = stationUi.openStationPanel(game.state.activeInteraction, { silent: true });
        const rendered = stationUi.renderStationPanel(game.state.activeInteraction);
        const content = document.getElementById('stationPanelContent');
        const text = getCollapsedNodeText(content);

        assert(opened, 'Панель станции должна открываться для recipe card details.');
        assert(rendered, 'Панель станции должна успешно рисоваться для recipe card details.');
        assert(text.includes('Переносной мост'), 'Карточка должна показывать русское название рецепта.');
        assert(text.includes('Требования'), 'Карточка должна явно показывать блок требований.');
        assert(text.includes('Станция'), 'Карточка должна показывать, где рецепт собирается.');
        assert(text.includes('Где применять'), 'Карточка должна показывать, где применять результат рецепта.');
        assert(text.includes('Особенно нужен'), 'Карточка должна показывать островные окна важности.');
        assert(text.includes('острова 4-6'), 'Карточка должна выводить критическое окно из craft_design.');
        assert(text.includes('на разломах, переправах'), 'Карточка должна давать понятную подсказку по применению мостовой ветки.');
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
                stationIds: ['workbench']
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

    addTest('19. stateful waterFlask', 'Пустую флягу можно наполнить и по диагонали от water-source', () => {
        resetHarness();
        installResourceNodeWorld('waterSource', {
            islandIndex: 4,
            targetTileType: 'shore',
            x: 1,
            y: 1
        });
        inventoryRuntime.addInventoryItem('flask_empty', 1);

        const flaskIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'flask_empty');
        const flask = inventoryRuntime.getInventory()[flaskIndex];
        game.state.selectedInventorySlot = flaskIndex;
        const outcome = itemEffects.useInventoryItem(flask);

        assert(outcome && outcome.success, 'Пустая фляга должна наполняться и по диагонали от water-source.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_empty'), 0, 'После диагонального наполнения исходная пустая фляга должна исчезать.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_water_dirty'), 1, 'После диагонального наполнения должна появляться фляга сырой воды.');
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

    addTest('19. stateful waterFlask', 'item-effects ведёт полную флягу через container cycle, а не как обычный consumable', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('flask_water_full', 1);

        const flaskIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'flask_water_full');
        const flask = inventoryRuntime.getInventory()[flaskIndex];
        game.state.selectedInventorySlot = flaskIndex;
        const outcome = itemEffects.useInventoryItem(flask);

        assert(outcome && outcome.success, 'Полная фляга должна использоваться через item-effects успешно.');
        assert(/опустел/i.test(outcome.message || ''), 'Сообщение item-effects должно явно говорить, что фляга опустела.');
        assert(Array.isArray(outcome.effectDrops) && outcome.effectDrops.some((entry) => entry && entry.itemId === 'flask_empty'), 'item-effects должен вернуть empty flask в effectDrops.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_water_full'), 0, 'После item-effects use полная фляга должна уйти.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_empty'), 1, 'После item-effects use должна вернуться пустая фляга.');
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
        assert(Array.isArray(recipe.ingredients) && recipe.ingredients.some((ingredient) => ingredient.id === 'fuel_bundle'), 'Рецепт должен требовать топливную связку.');
        assert(recipe.result && recipe.result.id === 'waterFlaskFull', 'Результатом кипячения должна быть чистая вода во фляге.');
    });

    addTest('22. boil_water на camp', 'На лагере грязная вода кипятится в чистую и сжигает fuel bundle', () => {
        game.state.activeInteraction = buildStationInteraction('camp');
        inventoryRuntime.addInventoryItem('flask_water_dirty', 1);
        inventoryRuntime.addInventoryItem('fuel_bundle', 1);

        const evaluation = craftingRuntime.evaluateRecipeAgainstInventory('boil-water');
        const outcome = craftingRuntime.craftRecipeAgainstInventory('boil-water');

        assert(evaluation.success, 'На лагере с сырой водой и топливом рецепт должен быть доступен.');
        assert(outcome && outcome.success, 'Варка воды на лагере должна завершаться успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_water_dirty'), 0, 'Сырая вода должна быть израсходована.');
        assertEqual(inventoryRuntime.countInventoryItem('fuel_bundle'), 0, 'Топливная связка должна сгорать при кипячении.');
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
        assert(noFuelEvaluation.missingIngredients.some((ingredient) => ingredient.id === 'fuel_bundle'), 'В списке недостающих ингредиентов должна быть топливная связка.');
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
        inventoryRuntime.addInventoryItem('fish_meat', 1);
        inventoryRuntime.addInventoryItem('fuel_bundle', 1);

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
        inventoryRuntime.addInventoryItem('fish_meat', 1);
        inventoryRuntime.addInventoryItem('fuel_bundle', 1);

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
        inventoryRuntime.addInventoryItem('fuel_bundle', 1);
        inventoryRuntime.addInventoryItem('healing_base', 1);

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
        const healingBase = componentRegistry.getComponentDefinition('healing_base');

        assert(rawState && rawState.itemId === 'flask_water_dirty', 'Сырая вода должна существовать как отдельное состояние фляги.');
        assert(boiledState && boiledState.itemId === 'flask_water_full', 'Кипячёная вода должна существовать как отдельное состояние фляги.');
        assert(alchemyState && alchemyState.itemId === 'flask_water_alchemy', 'Алхимическая вода должна существовать как отдельное состояние фляги.');
        assert(healingBase && healingBase.id === 'healing_base', 'Лечебная база должна оставаться отдельным компонентом.');
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
        inventoryRuntime.addInventoryItem('healing_base', 1);

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

    addTest('87. hover/inspect подсказки resource nodes', 'Hover по рыболовной точке показывает улов, цену, инструмент и риск', () => {
        resetHarness();
        installResourceNodeWorld('fishingSpot', {
            islandIndex: 23,
            targetTileType: 'shore'
        });
        game.state.selectedWorldTile = { x: 1, y: 0 };

        const hint = actionUi.getDefaultActionHint(null, game.state.activeTileInfo);

        assert(/Что даёт:\s*редкую рыбу/i.test(hint), 'В hover-подсказке должно быть явно сказано, что даёт fishing spot.');
        assert(/Цена сбора:/i.test(hint), 'В hover-подсказке должна быть указана цена сбора.');
        assert(/Чем собирается:\s*нужна "Удочка путника"/i.test(hint), 'В hover-подсказке должен быть указан нужный инструмент.');
        assert(/Чем рискуешь:/i.test(hint), 'В hover-подсказке должен быть явно показан риск сбора.');
    });

    addTest('87. hover/inspect подсказки resource nodes', 'Inspect у water-source показывает результат, контейнер и отсутствие отдельного риска', () => {
        resetHarness();
        installResourceNodeWorld('waterSource', {
            islandIndex: 4,
            targetTileType: 'shore'
        });
        game.state.selectedWorldTile = { x: 1, y: 0 };

        actionUi.handleInspectAction();

        assert(/Что даёт:\s*сырую воду во фляге/i.test(bridge.lastActionMessage), 'Inspect по water-source должен объяснять, что именно даёт точка воды.');
        assert(/Цена действия:/i.test(bridge.lastActionMessage), 'Inspect по water-source должен показывать стоимость действия.');
        assert(/Чем собирается:\s*пустой флягой/i.test(bridge.lastActionMessage), 'Inspect по water-source должен указывать контейнер.');
        assert(/Чем рискуешь:\s*только темпом маршрута/i.test(bridge.lastActionMessage), 'Inspect по water-source должен показывать отсутствие отдельного штрафа кроме темпа.');
    });

    addTest('28. реальные входы/выходы рыбы', 'raw_fish напрямую превращается в fish_meat и fish_oil на лагере', () => {
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
        assertEqual(inventoryRuntime.countInventoryItem('fish_meat'), 1, 'Из 5 raw_fish должно получаться 1 fish_meat.');
        assertEqual(inventoryRuntime.countInventoryItem('fish_oil'), 1, 'Из 10 raw_fish должно получаться 1 fish_oil.');
    });

    addTest('28. реальные входы/выходы рыбы', 'raw_fish + fuel_bundle даёт ration как прямой лагерный shortcut', () => {
        resetHarness();
        game.state.activeInteraction = buildStationInteraction('camp');
        inventoryRuntime.addInventoryItem('raw_fish', 5);
        inventoryRuntime.addInventoryItem('fuel_bundle', 1);
        const rationCountBefore = inventoryRuntime.countInventoryItem('ration');

        const evaluation = craftingRuntime.evaluateRecipeAgainstInventory('raw-fish-ration');
        const outcome = craftingRuntime.craftRecipeAgainstInventory('raw-fish-ration');

        assert(evaluation.success, 'Рецепт raw-fish-ration должен быть доступен на лагере.');
        assert(outcome && outcome.success, 'Прямой сухпаёк из raw_fish должен крафтиться успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_fish'), 0, 'raw_fish должен полностью расходоваться на ration.');
        assertEqual(inventoryRuntime.countInventoryItem('fuel_bundle'), 0, 'fuel_bundle должен сгорать при крафте ration.');
        assertEqual(inventoryRuntime.countInventoryItem('ration'), rationCountBefore + 1, 'Игрок должен получить ещё один ration.');
    });

    addTest('28. реальные входы/выходы рыбы', 'Рыба участвует в food recipes только через crafting runtime', () => {
        resetHarness();
        game.state.activeInteraction = buildStationInteraction('camp');
        inventoryRuntime.addInventoryItem('raw_fish', 5);
        inventoryRuntime.addInventoryItem('fuel_bundle', 1);
        inventoryRuntime.addInventoryItem('flask_water_full', 1);

        const meatOutcome = craftingRuntime.craftRecipeAgainstInventory('fish-to-fish-meat');
        const brothEvaluation = craftingRuntime.evaluateRecipeAgainstInventory('fish-broth');
        const brothOutcome = craftingRuntime.craftRecipeAgainstInventory('fish-broth');

        assert(meatOutcome && meatOutcome.success, 'Рыба должна сначала пройти через fish-to-fish-meat.');
        assert(brothEvaluation.success, 'После переработки fish_meat должен участвовать в food recipe через crafting runtime.');
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

        assert(boatIngredientIds.includes('fish_oil'), 'Готовая лодка должна требовать fish_oil.');
        assert(repairIngredientIds.includes('fish_oil'), 'Ремкомплект лодки должен требовать fish_oil.');
    });

    addTest('29. fish_oil как лодка / лампы / поздние рецепты / торговля', 'Фонарь тумана и Маяк торговца крафтятся через fish_oil на мастерской', () => {
        resetHarness();
        game.state.unlockedInventorySlots = 8;
        game.state.currentIslandIndex = 18;
        game.state.activeInteraction = buildStationInteraction('workbench', {
            expedition: {
                stationId: 'workbench',
                stationIds: ['workbench']
            }
        });
        inventoryRuntime.addInventoryItem('wood_plank_basic', 1);
        inventoryRuntime.addInventoryItem('stone_block', 1);
        inventoryRuntime.addInventoryItem('fiber_rope', 2);
        inventoryRuntime.addInventoryItem('fish_oil', 2);

        const lanternEvaluation = craftingRuntime.evaluateRecipeAgainstInventory('fog-lantern');
        const lanternOutcome = craftingRuntime.craftRecipeAgainstInventory('fog-lantern');
        const beaconEvaluation = craftingRuntime.evaluateRecipeAgainstInventory('merchant-beacon');
        const beaconOutcome = craftingRuntime.craftRecipeAgainstInventory('merchant-beacon');
        const beaconRecipe = recipeRegistry.getRecipeDefinition('merchant-beacon');

        assert(lanternEvaluation.success, 'Фонарь тумана должен собираться через fish_oil на мастерской.');
        assert(lanternOutcome && lanternOutcome.success, 'Крафт фонаря тумана должен завершаться успешно.');
        assert(beaconEvaluation.success, 'Маяк торговца должен собираться через fish_oil на мастерской.');
        assert(beaconOutcome && beaconOutcome.success, 'Крафт маяка торговца должен завершаться успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('fogLantern'), 1, 'После крафта должен появляться fogLantern.');
        assertEqual(inventoryRuntime.countInventoryItem('merchantBeacon'), 1, 'После крафта должен появляться merchantBeacon.');
        assert(beaconRecipe && Array.isArray(beaconRecipe.tags) && beaconRecipe.tags.includes('late'), 'Маяк торговца должен быть помечен как поздний fish_oil-рецепт.');
    });

    addTest('73. station unlock progression', 'Мастерская не включается раньше mid-window, но явный unlock обходит это ограничение', () => {
        resetHarness();
        game.state.currentIslandIndex = 4;
        game.state.activeInteraction = buildStationInteraction('workbench', {
            expedition: {
                label: 'Ранняя мастерская',
                stationId: 'workbench',
                stationIds: ['workbench']
            }
        });

        const earlyStatus = stationRuntime.buildStationProgressionStatus('workbench');
        const earlyStations = stationRuntime.resolveAvailableStations();

        assert(earlyStatus && earlyStatus.reason === 'progression-locked', 'До mid-window мастерская должна считаться progression-locked.');
        assertEqual(earlyStations.includes('workbench'), false, 'До середины маршрута workbench не должен открываться автоматически.');

        const unlockResult = craftingRuntime.unlockStation('workbench', { islandIndex: 4 });
        const unlockedStations = stationRuntime.resolveAvailableStations();

        assert(unlockResult && unlockResult.success, 'Редкий unlock мастерской должен отработать успешно.');
        assert(unlockedStations.includes('workbench'), 'Явный station unlock должен открывать мастерскую раньше mid-window.');
    });

    addTest('73. station unlock progression', 'Workbench interaction начинает спавниться только с середины маршрута', () => {
        resetHarness();
        const earlyHouse = buildTestHouse('station_keeper', 9, 12, {
            buildingType: 'workshop',
            stationId: 'workbench',
            stationIds: ['workbench'],
            islandIndex: 4
        });
        const midHouse = buildTestHouse('station_keeper', 9, 12, {
            buildingType: 'workshop',
            stationId: 'workbench',
            stationIds: ['workbench'],
            islandIndex: 8
        });

        const earlyInteractions = createChunkInteractionsForTest({
            islandIndex: 4,
            chunkSource: buildResourceBiomeChunk(),
            houses: [earlyHouse]
        });
        const midInteractions = createChunkInteractionsForTest({
            islandIndex: 8,
            chunkSource: buildResourceBiomeChunk(),
            houses: [midHouse]
        });

        assertEqual(earlyInteractions.some((interaction) => interaction.kind === 'workbench'), false, 'До середины маршрута отдельный workbench interaction не должен спавниться.');
        assert(midInteractions.some((interaction) => interaction.kind === 'workbench'), 'С mid-window отдельный workbench interaction должен появляться стабильно.');
    });

    addTest('73. station unlock progression', 'Smithy открывается поздно, а altar появляется в reward pool только в эндгейме', () => {
        resetHarness();
        const midPool = loot.buildStationUnlockRewardPool(12, 'elite');
        const latePool = loot.buildStationUnlockRewardPool(19, 'elite');
        const endgamePool = loot.buildStationUnlockRewardPool(27, 'jackpot');

        assertEqual(midPool.some((entry) => entry.stationId === 'smithy'), false, 'Кузница не должна выпадать в среднем окне.');
        assert(latePool.some((entry) => entry.stationId === 'smithy'), 'Кузница должна появляться как поздний station unlock.');
        assertEqual(latePool.some((entry) => entry.stationId === 'altar'), false, 'Алтарь не должен появляться до эндгейма.');
        assert(endgamePool.some((entry) => entry.stationId === 'altar'), 'Алтарь должен попадать в station unlock pool только в эндгейме.');
    });

    addTest('29. fish_oil как лодка / лампы / поздние рецепты / торговля', 'Рыбий жир получил торговую ценность и вес в merchant-экономике', () => {
        resetHarness();
        game.state.currentIslandIndex = 18;
        const pricing = game.systems.pricing;
        const fishOilDefinition = itemRegistry.getItemDefinition('fish_oil');
        const rawFishDefinition = itemRegistry.getItemDefinition('raw_fish');
        const fishOilSellPrice = pricing.getMerchantSellPrice('fish_oil', 18);
        const rawFishSellPrice = pricing.getMerchantSellPrice('raw_fish', 18);

        assert(fishOilDefinition, 'Предмет fish_oil должен существовать в каталоге.');
        assert(rawFishDefinition, 'Предмет raw_fish должен существовать в каталоге.');
        assert((fishOilDefinition.categories || []).includes('value'), 'fish_oil должен считаться торговой ценностью.');
        assert(fishOilDefinition.merchantWeight > 0, 'fish_oil должен попадать в merchant stock.');
        assert(fishOilDefinition.merchantQuestWeight > 0, 'fish_oil должен попадать в merchant quests.');
        assert(fishOilSellPrice > rawFishSellPrice, 'Продавать fish_oil должно быть выгоднее, чем raw_fish.');
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
        assert(meatOutcome && meatOutcome.success, 'Из редкой рыбы должен крафтиться fish_meat.');
        assert(oilEvaluation.success, 'Трофейная рыба должна входить в общий рецепт fish-to-fish-oil.');
        assert(oilOutcome && oilOutcome.success, 'Из трофейной рыбы должен крафтиться fish_oil.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_fish_rare'), 0, 'Редкая рыба должна полностью расходоваться в мясе.');
        assertEqual(inventoryRuntime.countInventoryItem('raw_fish_trophy'), 0, 'Трофейная рыба должна полностью расходоваться в жире.');
        assertEqual(inventoryRuntime.countInventoryItem('fish_meat'), 1, 'Из редкой рыбы должен появляться fish_meat.');
        assertEqual(inventoryRuntime.countInventoryItem('fish_oil'), 1, 'Из трофейной рыбы должен появляться fish_oil.');
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
        inventoryRuntime.addInventoryItem('fish_meat', 1);
        const initialRationCount = inventoryRuntime.countInventoryItem('ration');

        for (let step = 0; step < 2; step++) {
            game.state.stepsSinceTimeOfDayChange = 29;
            game.systems.movement.consumeActionTempo({
                virtualSteps: 1,
                silent: true,
                reasonLabel: 'во время теста'
            });
        }

        assertEqual(inventoryRuntime.countInventoryItem('fish_meat'), 1, 'fish_meat не должен портиться через новый raw-fish spoilage слой.');
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
        inventoryRuntime.addInventoryItem('fish_meat', 1);
        inventoryRuntime.addInventoryItem('fuel_bundle', 1);
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
        inventoryRuntime.addInventoryItem('fish_meat', 1);
        inventoryRuntime.addInventoryItem('survivalSalt', 1);

        const evaluation = craftingRuntime.evaluateRecipeAgainstInventory('salted-fish');
        const outcome = craftingRuntime.craftRecipeAgainstInventory('salted-fish');

        assert(evaluation.success, 'Рецепт salted-fish должен быть доступен на лагере.');
        assert(outcome && outcome.success, 'Рецепт salted-fish должен крафтиться успешно.');
        assertEqual(inventoryRuntime.countInventoryItem('fish_meat'), 0, 'На salted-fish должно уходить рыбное мясо.');
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

    addTest('59–66. сундуковый крафт-лут', 'Скрытые и проклятые сундуки смещены в craft shortcuts, а не в обычную еду', () => {
        const hiddenPool = loot.buildChestRewardClassPool(12, 'hidden', 'ordinary');
        const cursedPool = loot.buildChestRewardClassPool(18, 'cursed', 'ordinary');
        const hiddenCraftWeight = getRewardClassWeight(hiddenPool, 'component_bundle')
            + getRewardClassWeight(hiddenPool, 'recipe_unlock')
            + getRewardClassWeight(hiddenPool, 'structure_part')
            + getRewardClassWeight(hiddenPool, 'resource_tool');
        const cursedCraftWeight = getRewardClassWeight(cursedPool, 'component_bundle')
            + getRewardClassWeight(cursedPool, 'recipe_unlock')
            + getRewardClassWeight(cursedPool, 'structure_part')
            + getRewardClassWeight(cursedPool, 'resource_tool');

        assert(hiddenCraftWeight > getRewardClassWeight(hiddenPool, 'item'), 'Hidden chest должен сильнее тянуться к крафтовым shortcut-наградам, чем к обычным item drops.');
        assert(cursedCraftWeight > getRewardClassWeight(cursedPool, 'item'), 'Cursed chest должен чаще вести в risky craft-награды, чем в обычный item pool.');
    });

    addTest('59–66. сундуковый крафт-лут', 'component_bundle выдаёт компоненты, а не raw-ресурсы', () => {
        resetHarness();
        const drop = loot.createChestRewardDropByClass('component_bundle', 14, 'hidden', () => 0);

        assert(drop && drop.type === 'component_bundle', 'Система должна уметь создать drop типа component_bundle.');
        assert(Array.isArray(drop.entries) && drop.entries.length > 0, 'component_bundle должен содержать хотя бы один компонент.');
        drop.entries.forEach((entry) => {
            assert(entry.itemId && !/^raw_/.test(entry.itemId), 'Сундук не должен подменять component_bundle на raw-ресурс.');
            assert(componentRegistry.getComponentDefinitionByInventoryItemId(entry.itemId), `Элемент bundle ${entry.itemId} должен быть зарегистрирован как компонент.`);
        });
    });

    addTest('59–66. сундуковый крафт-лут', 'recipe_unlock теперь является отдельным chest reward class', () => {
        resetHarness();
        const recipePool = loot.buildRecipeUnlockRewardPool(24, 'final');

        assert(recipePool.length > 0, 'Для поздних сундуков должен существовать pool recipe_unlock.');
        assert(recipePool.some((entry) => entry.recipeId === 'absolute-bridge-upgrade'), 'Final chest должен уметь раскрывать поздние bridge recipes.');
        assert(recipePool.some((entry) => entry.recipeId === 'merchant-beacon' || entry.recipeId === 'fog-lantern'), 'Final chest должен содержать craft-only поздние ветки, а не только готовые предметы.');
    });

    addTest('59–66. сундуковый крафт-лут', 'structure_part покрывает мосты, лодки и ремонт', () => {
        const structurePool = loot.buildStructurePartRewardPool(20, 'elite');
        const structureItemIds = new Set(structurePool.map((entry) => entry.itemId));

        assert(structureItemIds.has('bridge_kit') || structureItemIds.has('portableBridge'), 'Elite chest должен иметь bridge structure parts.');
        assert(structureItemIds.has('boat_ready') || structureItemIds.has('repair_kit_boat'), 'Elite chest должен иметь boat structure parts.');
        assert(structureItemIds.has('repair_kit_bridge') || structureItemIds.has('repair_kit_boat'), 'Structure-part pool должен покрывать repair path.');
    });

    addTest('59–66. сундуковый крафт-лут', 'station unlock сохраняется и делает станцию доступной в runtime', () => {
        resetHarness();
        const unlockResult = craftingRuntime.unlockStation('scribe', { islandIndex: 12 });
        const availableStations = stationRuntime.resolveAvailableStations();

        assert(unlockResult && unlockResult.success, 'Станция должна успешно разблокироваться.');
        assert(availableStations.includes('scribe'), 'После unlock станция должна появляться среди доступных станций.');
        assert(craftingRuntime.getUnlockedStationIds().includes('scribe'), 'Разблокированная станция должна сохраняться в craftingState.');
    });

    addTest('59–66. сундуковый крафт-лут', 'Активная craft goal даёт мягкий bias на нужные компоненты, но не бесплатно', () => {
        resetHarness();
        const baselinePool = loot.buildComponentBundleCandidatePool(18, 'elite');
        const baselineFishOil = baselinePool.find((entry) => entry.itemId === 'fish_oil');

        craftingRuntime.unlockRecipe('boat', { islandIndex: 18 });
        const biasedPool = loot.buildComponentBundleCandidatePool(18, 'elite');
        const biasedFishOil = biasedPool.find((entry) => entry.itemId === 'fish_oil');

        assert(baselineFishOil && biasedFishOil, 'fish_oil должен присутствовать в component pool для проверки bias.');
        assert(biasedFishOil.weight > baselineFishOil.weight, 'После unlock лодки вес нужного boat-компонента должен стать выше.');
        assert(biasedFishOil.weight < baselineFishOil.weight * 3, 'Bias должен быть мягким и не превращаться в бесплатную выдачу нужного компонента.');
    });

    addTest('59–66. сундуковый крафт-лут', 'Обычный chest item pool не дублирует raw-сбор и crafting outputs один-в-один', () => {
        const generalDrop = loot.createChestRewardDropByClass('item', 12, 'rich', () => 0);
        const categories = new Set((itemRegistry.getItemDefinition(generalDrop.itemId).categories || []));

        assert(generalDrop && generalDrop.type === 'item', 'Обычный chest drop должен создаваться как item.');
        assert(!categories.has('resource'), 'Обычный chest item pool не должен отдавать raw/resource предметы как прямую замену сбору.');
        assert(!componentRegistry.getComponentDefinitionByInventoryItemId(generalDrop.itemId), 'Обычный chest item pool не должен дублировать component_bundle через прямой component item.');
        assert(!componentRegistry.getCatalogCraftingOutputItemDefinition(generalDrop.itemId), 'Обычный chest item pool не должен дублировать structure/craft outputs из специальных reward classes.');
    });

    addTest('59–66. сундуковый крафт-лут', 'Jackpot/final сундуки привязаны к legendary craft branches, а не только к готовому легендарному луту', () => {
        const finalClassPool = loot.buildChestRewardClassPool(27, 'final', 'ordinary');
        const finalRecipePool = loot.buildRecipeUnlockRewardPool(27, 'final');

        assert(getRewardClassWeight(finalClassPool, 'recipe_unlock') > 0, 'Final chest должен иметь явный класс recipe_unlock.');
        assert(getRewardClassWeight(finalClassPool, 'structure_part') > 0, 'Final chest должен иметь явный класс structure_part.');
        assert(finalRecipePool.some((entry) => entry.recipeId === 'absolute-bridge-upgrade'), 'Final chest должен тянуться к легендарной bridge craft-ветке.');
    });

    addTest('Время суток', 'Ручной сдвиг фазы времени через sleep-like runtime сбрасывает tempo-счётчик и двигает фазу', () => {
        resetHarness();
        game.state.timeOfDayIndex = 0;
        game.state.stepsSinceTimeOfDayChange = 17;
        game.state.timeOfDayAdvancesElapsed = 0;

        const outcome = game.systems.movement.advanceTimeOfDay({
            silent: false,
            reasonLabel: 'после отдыха'
        });

        assert(outcome && outcome.nextTimeOfDay, 'Ручной переход времени должен возвращать новую фазу.');
        assertEqual(game.state.timeOfDayIndex, 1, 'Ручной переход времени должен перевести игру на следующую фазу.');
        assertEqual(game.state.stepsSinceTimeOfDayChange, 0, 'После ручной смены фазы tempo-счётчик должен сбрасываться.');
        assertEqual(game.state.timeOfDayAdvancesElapsed, 1, 'Счётчик смен времени суток должен увеличиваться.');
        assert(/после отдыха/i.test(bridge.lastActionMessage), 'Сообщение о смене времени должно содержать причину ручного перехода.');
    });

    addTest('Карта разведки', 'Разведанные ресурсные тайлы собираются в зоны и отдельные точки снабжения', () => {
        assert(mapRuntime && typeof mapRuntime.buildExplorationHighlights === 'function', 'Map runtime должен уметь строить exploration highlights.');

        const highlights = mapRuntime.buildExplorationHighlights([
            {
                x: 10,
                y: 10,
                islandIndex: 8,
                resourceKind: 'grass'
            },
            {
                x: 11,
                y: 10,
                islandIndex: 8,
                resourceKind: 'grass'
            },
            {
                x: 18,
                y: 18,
                islandIndex: 8,
                resourceKind: 'wood'
            },
            {
                x: 30,
                y: 30,
                islandIndex: 8,
                houseKind: 'well',
                houseId: 'well:test',
                houseMarkerX: 30,
                houseMarkerY: 30
            }
        ]);

        assertEqual(highlights.resourceZones.length, 3, 'Должны собираться отдельные зоны для кластера травы, отдельного дерева и точки колодца.');

        const grassZone = highlights.resourceZones.find((zone) => zone.resourceKind === 'grass');
        assert(grassZone, 'Кластер травы должен появиться в highlights.');
        assertEqual(grassZone.size, 2, 'Соседние разведанные клетки одного ресурса должны собираться в общую зону.');
        assert(!grassZone.isPointOfInterest, 'Обычный ресурсный кластер не должен считаться point-of-interest.');

        const wellZone = highlights.resourceZones.find((zone) => zone.resourceKind === 'well');
        assert(wellZone && wellZone.isPointOfInterest, 'Колодец должен попадать в отдельную точку снабжения.');
    });

    addTest('Карта разведки', 'Разведанные craft stations выделяются отдельно от обычных домов', () => {
        assert(mapRuntime && typeof mapRuntime.buildExplorationHighlights === 'function', 'Map runtime должен уметь строить exploration highlights.');

        const highlights = mapRuntime.buildExplorationHighlights([
            {
                x: 5,
                y: 6,
                islandIndex: 12,
                interactionKind: 'camp',
                interactionFamily: 'station',
                interactionStationId: 'camp',
                interactionStationIds: 'camp',
                interactionLabel: 'Лагерь'
            },
            {
                x: 12,
                y: 7,
                islandIndex: 12,
                interactionKind: 'workbench',
                interactionFamily: 'station',
                interactionStationId: 'workbench',
                interactionStationIds: 'workbench',
                interactionLabel: 'Мастерская'
            },
            {
                x: 20,
                y: 9,
                islandIndex: 12,
                houseKind: 'merchant',
                houseId: 'merchant:test',
                houseMarkerX: 20,
                houseMarkerY: 9
            }
        ]);

        assertEqual(highlights.craftStations.length, 2, 'Обычный дом не должен попадать в craft station highlights.');
        assert(highlights.craftStations.some((station) => station.stationId === 'camp'), 'Лагерный очаг должен выделяться как craft station.');
        assert(highlights.craftStations.some((station) => station.stationId === 'workbench'), 'Верстак или мастерская должны выделяться как craft station.');
    });

    addTest('Производственные цели', 'В водном окне блок поднимает лодку и ремонт как ключевые цели', () => {
        assert(statusUi && typeof statusUi.buildProductionGoalsState === 'function', 'Status UI должен уметь строить состояние производственных целей.');

        const progression = expeditionProgression.decorateProgressionWithCraftRequirements(buildProgression(17));
        game.state.currentIslandIndex = 17;
        game.state.activeTileInfo = createTileInfo(0, 0, 'grass', {
            progression
        });

        const panelState = statusUi.buildProductionGoalsState(game.state.activeTileInfo);
        const boatGoal = panelState.goals.find((goal) => goal.id === 'boat');
        const repairGoal = panelState.goals.find((goal) => goal.id === 'repair');
        const bridgeGoal = panelState.goals.find((goal) => goal.id === 'bridge');

        assert(boatGoal, 'Цель лодки должна существовать.');
        assert(repairGoal, 'Цель ремонта должна существовать.');
        assert(bridgeGoal, 'Цель моста должна существовать.');
        assertEqual(boatGoal.priorityLevel, 'mandatory', 'В окне 16–18 лодка должна быть жёстко необходимой.');
        assert(['recommended', 'mandatory'].includes(repairGoal.priorityLevel), 'В водном окне ремонт должен быть как минимум желательной целью.');
        assert(bridgeGoal.priorityLevel !== 'mandatory', 'После входа в водную фазу мост не должен оставаться главным обязательным фокусом.');
    });

    addTest('Производственные цели', 'Готовые лодка, ремонт и зелье сразу отражаются в правом блоке', () => {
        const progression = expeditionProgression.decorateProgressionWithCraftRequirements(buildProgression(17));
        game.state.currentIslandIndex = 17;
        game.state.activeTileInfo = createTileInfo(0, 0, 'grass', {
            progression
        });

        inventoryRuntime.addInventoryItem('boat_ready', 1);
        inventoryRuntime.addInventoryItem('repair_kit_bridge', 1);
        inventoryRuntime.addInventoryItem('healingBrew', 1);

        const panelState = statusUi.buildProductionGoalsState(game.state.activeTileInfo);
        const boatGoal = panelState.goals.find((goal) => goal.id === 'boat');
        const repairGoal = panelState.goals.find((goal) => goal.id === 'repair');
        const potionGoal = panelState.goals.find((goal) => goal.id === 'potion');

        assertEqual(boatGoal.status, 'ready', 'Готовая лодка в инвентаре должна помечать лодочную цель как готовую.');
        assertEqual(repairGoal.status, 'ready', 'Ремкомплект в инвентаре должен закрывать цель ремонта.');
        assertEqual(potionGoal.status, 'ready', 'Готовое лечебное зелье должно закрывать цель зелья.');
    });

    addTest('Производственные цели', 'Сумочный квест показывает активную стадию и готовность к сдаче', () => {
        const progression = expeditionProgression.decorateProgressionWithCraftRequirements(buildProgression(4));
        game.state.currentIslandIndex = 4;
        game.state.activeTileInfo = createTileInfo(0, 0, 'grass', {
            progression
        });
        game.state.unlockedInventorySlots = 4;

        inventoryRuntime.addInventoryItem('ration', 1);
        inventoryRuntime.addInventoryItem('fishingRod', 1);
        inventoryRuntime.addInventoryItem('healing_base', 1);

        const panelState = statusUi.buildProductionGoalsState(game.state.activeTileInfo);
        const bagGoal = panelState.goals.find((goal) => goal.id === 'bagQuest');

        assert(bagGoal, 'Цель сумочного квеста должна существовать.');
        assertEqual(bagGoal.priorityLevel, 'active', 'При активной стадии сумочного квеста цель должна быть помечена как активная.');
        assertEqual(bagGoal.status, 'ready', 'Когда комплект уже собран, сумочный квест должен переходить в готовность к сдаче.');
    });

    addTest('Производственные цели', 'Панель рендерит все пять целей и итоговую сводку', () => {
        const progression = expeditionProgression.decorateProgressionWithCraftRequirements(buildProgression(17));
        game.state.currentIslandIndex = 17;
        game.state.activeTileInfo = createTileInfo(0, 0, 'grass', {
            progression
        });

        const summaryNode = document.getElementById('productionGoalsSummary');
        const listNode = document.getElementById('productionGoalsList');

        assert(summaryNode && listNode, 'DOM узлы production goals должны существовать в test harness.');

        statusUi.syncProductionGoalsPanel(game.state.activeTileInfo);

        assertEqual(listNode.children.length, 5, 'Правая production-панель должна рендерить пять фиксированных целей.');
        assert(/жёстко/i.test(getCollapsedNodeText(summaryNode)), 'Сводка должна явно подсвечивать обязательные цели текущего окна.');
    });

    addTest('Craft UI', 'Ошибка по рецепту показывает, чего не хватает и какую станцию нужно', () => {
        const recipe = craftingRuntime.getCompiledRecipe('portable-bridge');
        assert(recipe, 'Рецепт portable-bridge должен существовать.');

        const stationDescriptor = inventoryUi.resolveRecipeStationDescriptor(recipe);
        const missingEvaluation = craftingRuntime.evaluateRecipeAgainstInventory('portable-bridge', {
            availableStations: ['bench'],
            scanNearbyEnvironment: true
        });

        const missingStatus = inventoryUi.buildOptionStatusFromEvaluation(missingEvaluation, {
            stationDescriptor
        });

        assert(/Нужно:|Нужно\s+\d+/.test(missingStatus.statusLabel), 'Статус по отсутствующим ингредиентам должен говорить, что именно нужно.');
        assert(/Не хватает/.test(missingStatus.detailMessage), 'Детальное сообщение должно объяснять, чего не хватает.');

        inventoryRuntime.addInventoryItem('wood_plank_basic', 2);
        inventoryRuntime.addInventoryItem('fiber_rope', 1);
        inventoryRuntime.addInventoryItem('stone_block', 1);

        const stationLockedEvaluation = craftingRuntime.evaluateRecipeAgainstInventory('portable-bridge', {
            availableStations: ['hand'],
            scanNearbyEnvironment: true
        });
        const stationLockedStatus = inventoryUi.buildOptionStatusFromEvaluation(stationLockedEvaluation, {
            stationDescriptor
        });

        assert(/Нужна станция/.test(stationLockedStatus.statusLabel), 'При неверной станции статус должен подсказать, где крафтить.');
        assert(stationLockedStatus.detailMessage.includes(stationDescriptor.stationLabel), 'Детальное сообщение должно содержать нужную станцию.');
    });

    addTest('Catalog', 'Каждый предмет имеет валидный статус', () => {
        const catalog = game.systems.itemCatalog;
        const definitions = catalog && Array.isArray(catalog.items) ? catalog.items : [];
        const allowed = new Set(['raw', 'component', 'crafted', 'loot-only', 'merchant-only', 'quest-only', 'deprecated']);

        definitions.forEach((definition) => {
            assert(definition && definition.id, 'Каждый предмет должен иметь id.');
            assert(allowed.has(definition.status), `Предмет ${definition.id} должен иметь валидный статус.`);
        });
    });

    addTest('Catalog', 'Legacy дубликаты удалены из каталога', () => {
        const catalog = game.systems.itemCatalog;
        const definitions = catalog && Array.isArray(catalog.items) ? catalog.items : [];
        const idSet = new Set(definitions.map((definition) => definition.id));
        ['ferryBoard', 'roughBridge', 'lightBoat', 'foldingBoat'].forEach((legacyId) => {
            assert(!idSet.has(legacyId), `Дубликат ${legacyId} не должен оставаться в каталоге.`);
        });
    });

    addTest('Economy', 'Crafted outputs получают базовую ценность по дизайн-диапазонам', () => {
        const expected = {
            heartyRation: 12,
            strongBroth: 12,
            fishBroth: 11,
            saltedFish: 10,
            secondWind: 12,
            bridge_kit: 14,
            portableBridge: 15,
            reinforcedBridge: 16,
            fieldBridge: 16,
            absoluteBridge: 34,
            repair_kit_bridge: 12,
            boat_ready: 22,
            repair_kit_boat: 13,
            roadChalk: 12,
            pathMarker: 13,
            safeHouseSeal: 18,
            fogLantern: 18,
            merchantBeacon: 16,
            relicCase: 30,
            toolHolster: 28,
            anchorLine: 26,
            islandDrill: 30,
            blackCup: 30,
            lastVow: 34,
            soilResource: 6
        };

        Object.entries(expected).forEach(([itemId, baseValue]) => {
            const definition = itemRegistry.getItemDefinition(itemId);
            assert(definition, `Предмет ${itemId} должен существовать.`);
            assertEqual(definition.baseValue, baseValue, `Базовая ценность ${itemId} должна быть ${baseValue}.`);
        });
    });

    addTest('Smoke', 'Вода: фляга наполняется у воды и кипятится в лагере', () => {
        resetHarness();
        installResourceNodeWorld('waterSource', {
            islandIndex: 6,
            targetTileType: 'shore'
        });
        inventoryRuntime.addInventoryItem('flask_empty', 1);
        const emptyFlaskIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'flask_empty');
        game.state.selectedInventorySlot = emptyFlaskIndex;

        const fillOutcome = itemEffects.useInventoryItem(inventoryRuntime.getInventory()[emptyFlaskIndex]);
        assert(fillOutcome && fillOutcome.success, 'Фляга должна наполниться у источника воды.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_water_dirty'), 1, 'После наполнения должна появиться сырая вода.');

        game.state.activeInteraction = buildStationInteraction('camp');
        inventoryRuntime.addInventoryItem('fuel_bundle', 1);
        const boilOutcome = craftingRuntime.craftRecipeAgainstInventory('boil-water');
        assert(boilOutcome && boilOutcome.success, 'Сырая вода должна кипятиться в лагере.');
        assertEqual(inventoryRuntime.countInventoryItem('flask_water_full'), 1, 'После кипячения должна появиться полная фляга.');
    });

    addTest('Smoke', 'Трава -> лечебная база -> отвар лечения', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('raw_grass', 5);
        const compressionOutcome = compressionRuntime.compressSourceItem('raw_grass', {
            recipeId: 'grass-to-healing-base',
            availableStations: ['hand']
        });
        assert(compressionOutcome && compressionOutcome.success, 'Трава должна сжиматься в healing_base.');
        assertEqual(inventoryRuntime.countInventoryItem('healing_base'), 1, 'После сжатия должна появиться healing_base.');

        game.state.activeInteraction = buildStationInteraction('camp');
        inventoryRuntime.addInventoryItem('flask_water_alchemy', 1);
        const brewOutcome = craftingRuntime.craftRecipeAgainstInventory('healing-brew');
        assert(brewOutcome && brewOutcome.success, 'Отвар лечения должен крафтиться из healing_base и алхимической воды.');
        assertEqual(inventoryRuntime.countInventoryItem('healingBrew'), 1, 'После крафта должен появиться healingBrew.');
    });

    addTest('Smoke', 'Дерево -> переносной мост', () => {
        resetHarness();
        inventoryRuntime.addInventoryItem('wood_plank_basic', 3);
        inventoryRuntime.addInventoryItem('fiber_rope', 2);
        inventoryRuntime.addInventoryItem('stone_block', 1);

        const kitOutcome = craftingRuntime.craftRecipeAgainstInventory('portable-bridge', {
            availableStations: ['bench']
        });
        assert(kitOutcome && kitOutcome.success, 'bridge_kit должен крафтиться на верстаке.');

        const bridgeOutcome = craftingRuntime.craftRecipeAgainstInventory('portable-bridge-assembly', {
            availableStations: ['bench']
        });
        assert(bridgeOutcome && bridgeOutcome.success, 'portableBridge должен собираться из bridge_kit.');
        assertEqual(inventoryRuntime.countInventoryItem('portableBridge'), 1, 'В сумке должен появиться portableBridge.');
    });

    addTest('Smoke', 'Дерево + рыбий жир -> готовая лодка', () => {
        resetHarness();
        game.state.unlockedInventorySlots = 8;
        game.state.inventory = Array.from({ length: 10 }, () => null);
        inventoryRuntime.addInventoryItem('wood_frame_basic', 1);
        inventoryRuntime.addInventoryItem('wood_plank_basic', 2);
        inventoryRuntime.addInventoryItem('fiber_rope', 3);
        inventoryRuntime.addInventoryItem('fish_oil', 1);

        const frameOutcome = craftingRuntime.craftRecipeAgainstInventory('boat-frame', {
            availableStations: ['workbench']
        });
        assert(frameOutcome && frameOutcome.success, 'boatFrame должен собираться на мастерской.');

        const boatOutcome = craftingRuntime.craftRecipeAgainstInventory('boat', {
            availableStations: ['workbench']
        });
        assert(boatOutcome && boatOutcome.success, 'boat_ready должен собираться из boatFrame, fish_oil и fiber_rope.');
        assertEqual(inventoryRuntime.countInventoryItem('boat_ready'), 1, 'После крафта должна появиться boat_ready.');
    });

    addTest('Smoke', 'Bridge repair: ремкомплект чинит повреждённый мост', () => {
        resetHarness();
        game.state.unlockedInventorySlots = 8;
        game.state.inventory = Array.from({ length: 10 }, () => null);
        game.state.playerPos = { x: 0, y: 0 };

        const progression = buildProgression(8);
        const world = installWorld([
            createTileInfo(0, 0, 'trail', { progression }),
            createTileInfo(1, 0, 'water', { baseTileType: 'water', progression })
        ], {
            islandIndex: 8,
            playerPos: { x: 0, y: 0 },
            defaultTileType: 'trail'
        });
        const sharedChunk = {
            data: [['trail', 'water']],
            travelZones: [['none', 'none']],
            renderCache: {}
        };
        [0, 1].forEach((x) => {
            const tileInfo = world.getTileInfo(x, 0);
            tileInfo.localX = x;
            tileInfo.localY = 0;
            tileInfo.chunk = sharedChunk;
        });

        game.systems.bridgeRuntime.placeBridgeAt(1, 0, { sourceItemId: 'portableBridge' });
        game.systems.bridgeRuntime.weakenBridgeAt(1, 0);

        inventoryRuntime.addInventoryItem('wood_plank_basic', 1);
        inventoryRuntime.addInventoryItem('gravel_fill', 1);
        inventoryRuntime.addInventoryItem('fiber_rope', 1);
        const repairOutcome = craftingRuntime.craftRecipeAgainstInventory('bridge-repair-kit', {
            availableStations: ['workbench']
        });
        assert(repairOutcome && repairOutcome.success, 'repair_kit_bridge должен крафтиться на мастерской.');

        const kitIndex = inventoryRuntime.getInventory().findIndex((item) => item && item.id === 'repair_kit_bridge');
        game.state.selectedInventorySlot = kitIndex;
        game.state.selectedWorldTile = { x: 1, y: 0 };
        const useOutcome = itemEffects.useInventoryItem(inventoryRuntime.getInventory()[kitIndex]);
        assert(useOutcome && useOutcome.success, 'repair_kit_bridge должен чинить повреждённый мост.');
        assertEqual(sharedChunk.travelZones[0][1], 'none', 'После ремонта у моста должен сниматься travel zone.');
    });

    addTest('Smoke', 'Bag quest принимает crafted loadout', () => {
        resetHarness();
        const stage = bagUpgradeRuntime.getStageById('bagUpgrade_4_5');
        const evaluation = bagUpgradeRuntime.getStageEvaluation(stage, {
            inventoryItems: [
                itemRegistry.createInventoryItem('ration', 1),
                itemRegistry.createInventoryItem('roadChalk', 1),
                itemRegistry.createInventoryItem('healing_base', 1)
            ].filter(Boolean),
            unlockedSlots: 4,
            currentIslandIndex: 4
        });

        assert(evaluation.isComplete, 'Crafted loadout должен закрывать bag quest стадию.');
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
