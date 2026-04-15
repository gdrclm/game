(() => {
    const game = window.Game;
    const mapRuntime = game.systems.mapRuntime = game.systems.mapRuntime || {};
    const MAP_STORAGE_KEY = 'iso_game_map_exploration_v2';
    const mapScreenPointBuffer = { x: 0, y: 0 };
    let persistTimerId = null;
    let hasRestoredPersistedState = false;

    function getExploredTilesState() {
        const state = game.state;
        state.exploredMapTilesByKey = state.exploredMapTilesByKey || {};
        return state.exploredMapTilesByKey;
    }

    function getTileKey(x, y) {
        return `${x},${y}`;
    }

    function getChunkKey(chunkX, chunkY) {
        return `${chunkX},${chunkY}`;
    }

    function getHouseAtChunkTile(chunk, localX, localY) {
        if (!chunk) {
            return null;
        }

        if (chunk.houseTileMap instanceof Map) {
            return chunk.houseTileMap.get(getTileKey(localX, localY)) || null;
        }

        return Array.isArray(chunk.houses)
            ? chunk.houses.find((house) => house && house.localCellSet && house.localCellSet.has(getTileKey(localX, localY))) || null
            : null;
    }

    function getHarvestedTerrainState() {
        const state = game.state;
        state.harvestedTerrainKeys = state.harvestedTerrainKeys || {};
        return state.harvestedTerrainKeys;
    }

    function getHarvestedTerrainKey(x, y) {
        return `${x},${y}`;
    }

    function getLegacyHarvestItemIds(tileType) {
        const resourceRegistry = game.systems.resourceRegistry || null;
        return resourceRegistry && typeof resourceRegistry.getTerrainGatherLegacyItemIds === 'function'
            ? resourceRegistry.getTerrainGatherLegacyItemIds(tileType)
            : [];
    }

    function isTerrainHarvested(x, y, legacyItemIds = []) {
        const harvested = getHarvestedTerrainState();
        const ids = Array.isArray(legacyItemIds)
            ? legacyItemIds
            : (legacyItemIds ? [legacyItemIds] : []);
        return Boolean(
            harvested[getHarvestedTerrainKey(x, y)]
            || ids.some((legacyItemId) => legacyItemId && harvested[`${legacyItemId}:${x},${y}`])
        );
    }

    function readPersistedSnapshot() {
        if (typeof localStorage === 'undefined') {
            return null;
        }

        try {
            const rawSnapshot = localStorage.getItem(MAP_STORAGE_KEY);
            return rawSnapshot ? JSON.parse(rawSnapshot) : null;
        } catch (error) {
            console.warn('Map persistence read failed:', error);
            return null;
        }
    }

    function getPersistedWorldSeed() {
        const snapshot = readPersistedSnapshot();
        return snapshot && Number.isFinite(snapshot.worldSeed)
            ? snapshot.worldSeed
            : null;
    }

    function getAllowedRestoredIslandIndexes() {
        const visitedIslandIds = game.state.visitedIslandIds || {};
        const allowed = new Set();

        Object.keys(visitedIslandIds).forEach((key) => {
            if (visitedIslandIds[key]) {
                const islandIndex = Number(key);
                if (Number.isFinite(islandIndex)) {
                    allowed.add(islandIndex);
                }
            }
        });

        if (!allowed.size && Number.isFinite(game.state.currentIslandIndex)) {
            allowed.add(game.state.currentIslandIndex);
        }

        return allowed;
    }

    function shouldRestoreExploredEntry(entry, allowedIslandIndexes) {
        if (!entry || typeof entry !== 'object') {
            return false;
        }

        if (!allowedIslandIndexes || allowedIslandIndexes.size === 0) {
            return true;
        }

        if (!Number.isFinite(entry.islandIndex)) {
            return true;
        }

        return allowedIslandIndexes.has(entry.islandIndex);
    }

    function isValidExploredEntryKey(key, entry) {
        if (!entry || typeof entry !== 'object') {
            return false;
        }

        if (!Number.isFinite(entry.x) || !Number.isFinite(entry.y)) {
            return false;
        }

        return key === getTileKey(entry.x, entry.y);
    }

    function pruneExploredTilesState() {
        const explored = getExploredTilesState();
        let removedCount = 0;

        Object.keys(explored).forEach((key) => {
            if (isValidExploredEntryKey(key, explored[key])) {
                return;
            }

            delete explored[key];
            removedCount += 1;
        });

        return removedCount;
    }

    function persistExploration() {
        if (typeof localStorage === 'undefined') {
            return false;
        }

        try {
            pruneExploredTilesState();
            localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify({
                version: 2,
                worldSeed: game.config.worldSeed,
                currentIslandIndex: game.state.currentIslandIndex,
                highestIslandIndex: game.state.highestIslandIndex,
                visitedIslandIds: game.state.visitedIslandIds || {},
                exploredMapTilesByKey: getExploredTilesState()
            }));
            return true;
        } catch (error) {
            console.warn('Map persistence write failed:', error);
            return false;
        }
    }

    function schedulePersistExploration() {
        if (persistTimerId) {
            return;
        }

        persistTimerId = window.setTimeout(() => {
            persistTimerId = null;
            persistExploration();
        }, 200);
    }

    function restorePersistedExploration() {
        if (hasRestoredPersistedState) {
            return Object.keys(getExploredTilesState()).length;
        }

        hasRestoredPersistedState = true;
        const snapshot = readPersistedSnapshot();

        if (!snapshot || !snapshot.exploredMapTilesByKey || typeof snapshot.exploredMapTilesByKey !== 'object') {
            return 0;
        }

        const expectedSeed = snapshot.worldSeed;
        if (Number.isFinite(expectedSeed) && Number.isFinite(game.config.worldSeed) && expectedSeed !== game.config.worldSeed) {
            return 0;
        }

        const explored = getExploredTilesState();
        const allowedIslandIndexes = getAllowedRestoredIslandIndexes();
        Object.keys(explored).forEach((key) => {
            delete explored[key];
        });

        Object.entries(snapshot.exploredMapTilesByKey).forEach(([key, entry]) => {
            if (shouldRestoreExploredEntry(entry, allowedIslandIndexes) && isValidExploredEntryKey(key, entry)) {
                explored[key] = entry;
            }
        });
        pruneExploredTilesState();
        return Object.keys(explored).length;
    }

    function clearPersistedExploration() {
        hasRestoredPersistedState = false;

        if (persistTimerId) {
            window.clearTimeout(persistTimerId);
            persistTimerId = null;
        }

        if (typeof localStorage === 'undefined') {
            return false;
        }

        try {
            localStorage.removeItem(MAP_STORAGE_KEY);
            return true;
        } catch (error) {
            console.warn('Map persistence clear failed:', error);
            return false;
        }
    }

    function isVisibleOnScreen(worldX, worldY) {
        const camera = game.systems.camera || null;

        if (!camera) {
            return false;
        }

        const screen = typeof camera.isoToScreenTo === 'function'
            ? camera.isoToScreenTo(worldX, worldY, mapScreenPointBuffer)
            : (typeof camera.isoToScreen === 'function'
                ? camera.isoToScreen(worldX, worldY)
                : null);
        const marginX = game.config.tileWidth;
        const marginY = game.config.tileHeight * 2;

        if (!screen) {
            return false;
        }

        return screen.x >= -marginX
            && screen.x <= game.canvas.width + marginX
            && screen.y >= -marginY
            && screen.y <= game.canvas.height + marginY;
    }

    function getHouseMarkerData(house) {
        if (!house) {
            return null;
        }

        const expedition = house.expedition || {};
        const worldCells = Array.isArray(house.worldCells) && house.worldCells.length > 0
            ? house.worldCells
            : [{ x: house.worldOriginX || 0, y: house.worldOriginY || 0 }];
        const markerX = worldCells.reduce((sum, cell) => sum + cell.x, 0) / worldCells.length;
        const markerY = worldCells.reduce((sum, cell) => sum + cell.y, 0) / worldCells.length;
        const hasQuest = (
            expedition.kind === 'merchant'
            || expedition.kind === 'craft_merchant'
            || expedition.kind === 'artisan'
        )
            && Boolean(expedition.quest && !expedition.quest.completed);

        return {
            houseId: house.id,
            houseKind: expedition.kind || 'house',
            houseLabel: expedition.locationLabel || expedition.label || 'Дом',
            markerX,
            markerY,
            isQuestGiver: hasQuest
        };
    }

    function getInteractionAtChunkTile(chunk, localX, localY) {
        if (!chunk) {
            return null;
        }

        if (chunk.interactionTileMap instanceof Map) {
            return chunk.interactionTileMap.get(getTileKey(localX, localY)) || null;
        }

        return Array.isArray(chunk.interactions)
            ? chunk.interactions.find((interaction) => interaction && interaction.localX === localX && interaction.localY === localY) || null
            : null;
    }

    function getInteractionResourceKind(interaction) {
        if (!interaction || interaction.placement === 'interior') {
            return '';
        }

        if (interaction.kind === 'resourceNode') {
            return interaction.resourceId || '';
        }

        if (interaction.kind === 'well') {
            return 'well';
        }

        if (interaction.kind === 'forage') {
            return 'berries';
        }

        return '';
    }

    function normalizeStationId(stationId) {
        const stationRuntime = game.systems.stationRuntime || null;
        return stationRuntime && typeof stationRuntime.normalizeStationId === 'function'
            ? stationRuntime.normalizeStationId(stationId)
            : (typeof stationId === 'string' ? stationId.trim().toLowerCase() : '');
    }

    function getInteractionFamily(interaction) {
        return interaction && interaction.expedition && typeof interaction.expedition.family === 'string'
            ? interaction.expedition.family.trim().toLowerCase()
            : '';
    }

    function getInteractionStationIds(interaction) {
        const expedition = interaction && interaction.expedition && typeof interaction.expedition === 'object'
            ? interaction.expedition
            : null;
        const normalizedIds = [];
        const seen = new Set();
        const sourceIds = expedition && Array.isArray(expedition.stationIds)
            ? expedition.stationIds
            : [expedition && expedition.stationId];

        sourceIds.forEach((stationId) => {
            const normalizedStationId = normalizeStationId(stationId);
            if (!normalizedStationId || seen.has(normalizedStationId)) {
                return;
            }
            seen.add(normalizedStationId);
            normalizedIds.push(normalizedStationId);
        });

        return normalizedIds;
    }

    function getInteractionStationId(interaction) {
        const stationIds = getInteractionStationIds(interaction);
        return stationIds[0] || '';
    }

    function areExploredEntriesEqual(previousEntry, nextEntry) {
        if (!previousEntry || !nextEntry) {
            return false;
        }

        return previousEntry.x === nextEntry.x
            && previousEntry.y === nextEntry.y
            && previousEntry.islandIndex === nextEntry.islandIndex
            && previousEntry.baseTileType === nextEntry.baseTileType
            && previousEntry.tileType === nextEntry.tileType
            && previousEntry.travelZoneKey === nextEntry.travelZoneKey
            && previousEntry.resourceKind === nextEntry.resourceKind
            && previousEntry.houseId === nextEntry.houseId
            && previousEntry.houseKind === nextEntry.houseKind
            && previousEntry.houseLabel === nextEntry.houseLabel
            && previousEntry.houseMarkerX === nextEntry.houseMarkerX
            && previousEntry.houseMarkerY === nextEntry.houseMarkerY
            && previousEntry.isQuestGiver === nextEntry.isQuestGiver
            && previousEntry.interactionKind === nextEntry.interactionKind
            && previousEntry.interactionFamily === nextEntry.interactionFamily
            && previousEntry.interactionStationId === nextEntry.interactionStationId
            && previousEntry.interactionStationIds === nextEntry.interactionStationIds
            && previousEntry.interactionLabel === nextEntry.interactionLabel;
    }

    function getResourceKind(baseTileType, travelZoneKey, worldX, worldY, interaction) {
        const interactionResourceKind = getInteractionResourceKind(interaction);

        if (interactionResourceKind) {
            return interactionResourceKind;
        }

        if (travelZoneKey === 'badSector' && !isTerrainHarvested(worldX, worldY, 'soilClod')) {
            return 'soil';
        }

        return '';
    }

    function buildExploredTileEntry(chunk, localX, localY, options = {}) {
        const { ignoreVisibility = false } = options;
        const chunkSize = game.config.chunkSize;
        const worldX = chunk.x * chunkSize + localX;
        const worldY = chunk.y * chunkSize + localY;

        if (!ignoreVisibility && !isVisibleOnScreen(worldX, worldY)) {
            return null;
        }

        const baseTileType = chunk.data[localY][localX];
        const travelZoneKey = chunk.travelZones && chunk.travelZones[localY]
            ? chunk.travelZones[localY][localX] || 'none'
            : 'none';
        const house = getHouseAtChunkTile(chunk, localX, localY);
        const interaction = getInteractionAtChunkTile(chunk, localX, localY);
        const houseMarker = getHouseMarkerData(house);
        const isStructureHouse = Boolean(houseMarker && houseMarker.houseKind !== 'well' && houseMarker.houseKind !== 'forage');

        return {
            x: worldX,
            y: worldY,
            islandIndex: chunk.progression ? chunk.progression.islandIndex : 1,
            baseTileType,
            tileType: isStructureHouse ? 'house' : baseTileType,
            travelZoneKey,
            resourceKind: getResourceKind(baseTileType, travelZoneKey, worldX, worldY, interaction),
            houseId: houseMarker ? houseMarker.houseId : '',
            houseKind: houseMarker ? houseMarker.houseKind : '',
            houseLabel: houseMarker ? houseMarker.houseLabel : '',
            houseMarkerX: houseMarker ? houseMarker.markerX : 0,
            houseMarkerY: houseMarker ? houseMarker.markerY : 0,
            isQuestGiver: houseMarker ? houseMarker.isQuestGiver : false,
            interactionKind: interaction ? interaction.kind || '' : '',
            interactionFamily: interaction ? getInteractionFamily(interaction) : '',
            interactionStationId: interaction ? getInteractionStationId(interaction) : '',
            interactionStationIds: interaction ? getInteractionStationIds(interaction).join(',') : '',
            interactionLabel: interaction && interaction.expedition
                ? interaction.expedition.locationLabel || interaction.expedition.label || ''
                : ''
        };
    }

    function captureChunk(chunk, options = {}) {
        if (!chunk || !Array.isArray(chunk.data)) {
            return {
                capturedCount: 0,
                changedCount: 0
            };
        }

        let capturedCount = 0;
        let changedCount = 0;
        const explored = getExploredTilesState();

        for (let localY = 0; localY < chunk.data.length; localY++) {
            const row = chunk.data[localY];

            for (let localX = 0; localX < row.length; localX++) {
                const entry = buildExploredTileEntry(chunk, localX, localY, options);

                if (!entry) {
                    continue;
                }

                const key = getTileKey(entry.x, entry.y);
                const previousEntry = explored[key];

                if (!areExploredEntriesEqual(previousEntry, entry)) {
                    explored[key] = entry;
                    changedCount++;
                }

                capturedCount++;
            }
        }

        return {
            capturedCount,
            changedCount
        };
    }

    function captureVisibleWorld(focusChunkX, focusChunkY, options = {}) {
        const perf = game.systems.perf || null;
        const capture = () => {
            if (game.state.activeHouse) {
                return 0;
            }

            const chunkRadius = Number.isFinite(options.chunkRadius)
                ? Math.max(0, Math.floor(options.chunkRadius))
                : game.config.viewDistance;
            let capturedCount = 0;
            let changedCount = 0;

            for (let chunkY = focusChunkY - chunkRadius; chunkY <= focusChunkY + chunkRadius; chunkY++) {
                for (let chunkX = focusChunkX - chunkRadius; chunkX <= focusChunkX + chunkRadius; chunkX++) {
                    const chunk = game.state.loadedChunks[getChunkKey(chunkX, chunkY)];

                    if (!chunk) {
                        continue;
                    }

                    const result = captureChunk(chunk, options);
                    capturedCount += result.capturedCount;
                    changedCount += result.changedCount;
                }
            }

            if (changedCount > 0) {
                schedulePersistExploration();
            }

            return capturedCount;
        };

        if (perf && typeof perf.measure === 'function') {
            return perf.measure('captureVisibleWorld', capture);
        }

        return capture();
    }

    function getExploredTiles() {
        return Object.values(getExploredTilesState());
    }

    function getResourceLabel(resourceKind = '') {
        const resourceRegistry = game.systems.resourceRegistry || null;
        const resourceDefinition = resourceRegistry && typeof resourceRegistry.getBaseResourceDefinition === 'function'
            ? resourceRegistry.getBaseResourceDefinition(resourceKind)
            : null;
        return resourceDefinition && resourceDefinition.label
            ? resourceDefinition.label
            : (resourceKind || 'Ресурс');
    }

    function getStationLabel(stationId = '', fallback = '') {
        const stationRuntime = game.systems.stationRuntime || null;
        return stationRuntime && typeof stationRuntime.getStationLabel === 'function'
            ? stationRuntime.getStationLabel(stationId, fallback || stationId)
            : (fallback || stationId || '');
    }

    function buildExploredResourceZones(exploredTiles = []) {
        const tileMap = new Map();
        const pointZones = new Map();
        const visited = new Set();
        const zones = [];
        const directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
            { dx: 1, dy: 1 },
            { dx: 1, dy: -1 },
            { dx: -1, dy: 1 },
            { dx: -1, dy: -1 }
        ];

        exploredTiles.forEach((entry) => {
            if (!entry || !Number.isFinite(entry.x) || !Number.isFinite(entry.y)) {
                return;
            }

            if (entry.resourceKind) {
                tileMap.set(getTileKey(entry.x, entry.y), {
                    x: entry.x,
                    y: entry.y,
                    islandIndex: Number.isFinite(entry.islandIndex) ? Math.floor(entry.islandIndex) : null,
                    resourceKind: entry.resourceKind
                });
            }

            if ((entry.houseKind === 'well' || entry.houseKind === 'forage') && entry.houseId) {
                const resourceKind = entry.houseKind === 'well' ? 'well' : 'berries';
                const pointKey = `poi:${resourceKind}:${entry.houseId}`;

                if (!pointZones.has(pointKey)) {
                    pointZones.set(pointKey, {
                        id: pointKey,
                        resourceKind,
                        resourceLabel: getResourceLabel(resourceKind),
                        islandIndex: Number.isFinite(entry.islandIndex) ? Math.floor(entry.islandIndex) : null,
                        centerX: Number.isFinite(entry.houseMarkerX) ? entry.houseMarkerX : entry.x,
                        centerY: Number.isFinite(entry.houseMarkerY) ? entry.houseMarkerY : entry.y,
                        minX: Number.isFinite(entry.houseMarkerX) ? entry.houseMarkerX : entry.x,
                        maxX: Number.isFinite(entry.houseMarkerX) ? entry.houseMarkerX : entry.x,
                        minY: Number.isFinite(entry.houseMarkerY) ? entry.houseMarkerY : entry.y,
                        maxY: Number.isFinite(entry.houseMarkerY) ? entry.houseMarkerY : entry.y,
                        size: 1,
                        isPointOfInterest: true,
                        tiles: []
                    });
                }
            }
        });

        tileMap.forEach((origin, originKey) => {
            if (visited.has(originKey)) {
                return;
            }

            const component = [];
            const queue = [origin];
            visited.add(originKey);

            while (queue.length > 0) {
                const current = queue.shift();
                component.push(current);

                directions.forEach(({ dx, dy }) => {
                    const neighborKey = getTileKey(current.x + dx, current.y + dy);
                    const neighbor = tileMap.get(neighborKey);

                    if (
                        !neighbor
                        || visited.has(neighborKey)
                        || neighbor.resourceKind !== origin.resourceKind
                        || neighbor.islandIndex !== origin.islandIndex
                    ) {
                        return;
                    }

                    visited.add(neighborKey);
                    queue.push(neighbor);
                });
            }

            const totals = component.reduce((aggregate, tile) => {
                aggregate.x += tile.x;
                aggregate.y += tile.y;
                aggregate.minX = Math.min(aggregate.minX, tile.x);
                aggregate.maxX = Math.max(aggregate.maxX, tile.x);
                aggregate.minY = Math.min(aggregate.minY, tile.y);
                aggregate.maxY = Math.max(aggregate.maxY, tile.y);
                return aggregate;
            }, {
                x: 0,
                y: 0,
                minX: Infinity,
                maxX: -Infinity,
                minY: Infinity,
                maxY: -Infinity
            });

            zones.push({
                id: `zone:${origin.resourceKind}:${origin.islandIndex || 0}:${origin.x},${origin.y}`,
                resourceKind: origin.resourceKind,
                resourceLabel: getResourceLabel(origin.resourceKind),
                islandIndex: origin.islandIndex,
                centerX: totals.x / component.length,
                centerY: totals.y / component.length,
                minX: totals.minX,
                maxX: totals.maxX,
                minY: totals.minY,
                maxY: totals.maxY,
                size: component.length,
                isPointOfInterest: false,
                tiles: component.map((tile) => ({ x: tile.x, y: tile.y }))
            });
        });

        return zones.concat(Array.from(pointZones.values()));
    }

    function buildExploredCraftStations(exploredTiles = []) {
        const stationsByKey = new Map();

        exploredTiles.forEach((entry) => {
            if (!entry || !Number.isFinite(entry.x) || !Number.isFinite(entry.y)) {
                return;
            }

            const stationId = normalizeStationId(entry.interactionStationId);
            const interactionFamily = typeof entry.interactionFamily === 'string'
                ? entry.interactionFamily.trim().toLowerCase()
                : '';
            const isCraftStation = interactionFamily === 'station'
                || entry.interactionKind === 'camp'
                || entry.interactionKind === 'workbench';

            if (!isCraftStation) {
                return;
            }

            const stationIds = typeof entry.interactionStationIds === 'string'
                ? entry.interactionStationIds.split(',').map((value) => normalizeStationId(value)).filter(Boolean)
                : [];
            const normalizedStationId = stationId || stationIds[0] || normalizeStationId(entry.interactionKind);
            const key = `${normalizedStationId}:${entry.x},${entry.y}`;

            if (stationsByKey.has(key)) {
                return;
            }

            stationsByKey.set(key, {
                id: key,
                x: entry.x,
                y: entry.y,
                islandIndex: Number.isFinite(entry.islandIndex) ? Math.floor(entry.islandIndex) : null,
                stationId: normalizedStationId,
                stationIds,
                stationLabel: entry.interactionLabel || getStationLabel(normalizedStationId, normalizedStationId),
                interactionKind: entry.interactionKind || ''
            });
        });

        return Array.from(stationsByKey.values());
    }

    function buildExplorationHighlights(exploredTiles = getExploredTiles()) {
        return {
            resourceZones: buildExploredResourceZones(exploredTiles),
            craftStations: buildExploredCraftStations(exploredTiles)
        };
    }

    function getIslandRecord(islandIndex = game.state.currentIslandIndex) {
        const expedition = game.systems.expedition || null;
        return expedition && typeof expedition.getIslandRecord === 'function'
            ? expedition.getIslandRecord(islandIndex)
            : null;
    }

    function ensureChunkLoaded(chunkRecord) {
        if (!chunkRecord || !game.systems.world || typeof game.systems.world.getChunk !== 'function') {
            return null;
        }

        return game.systems.world.getChunk(chunkRecord.chunkX, chunkRecord.chunkY, { generateIfMissing: true });
    }

    function revealChunkRecord(chunkRecord) {
        const chunk = ensureChunkLoaded(chunkRecord);
        if (!chunk) {
            return 0;
        }

        const result = captureChunk(chunk, { ignoreVisibility: true });
        if (result.changedCount > 0) {
            schedulePersistExploration();
        }
        return result.changedCount;
    }

    function revealIslandByIndex(islandIndex = game.state.currentIslandIndex, options = {}) {
        const island = getIslandRecord(islandIndex);
        if (!island || !Array.isArray(island.chunks)) {
            return 0;
        }

        const chunkLimit = Number.isFinite(options.chunkLimit)
            ? Math.max(1, options.chunkLimit)
            : island.chunks.length;
        const sortedChunks = island.chunks.slice().sort((left, right) => {
            const leftDistance = Math.abs(left.chunkX - Math.floor(game.state.playerPos.x / game.config.chunkSize))
                + Math.abs(left.chunkY - Math.floor(game.state.playerPos.y / game.config.chunkSize));
            const rightDistance = Math.abs(right.chunkX - Math.floor(game.state.playerPos.x / game.config.chunkSize))
                + Math.abs(right.chunkY - Math.floor(game.state.playerPos.y / game.config.chunkSize));
            return leftDistance - rightDistance;
        });

        let revealed = 0;
        sortedChunks.slice(0, chunkLimit).forEach((chunkRecord) => {
            revealed += revealChunkRecord(chunkRecord);
        });
        return revealed;
    }

    function findPriorityChunk(islandIndex, predicate) {
        const island = getIslandRecord(islandIndex);
        if (!island || !Array.isArray(island.chunks)) {
            return null;
        }

        const matches = island.chunks
            .map((chunkRecord) => ({
                chunkRecord,
                bestProfile: Array.isArray(chunkRecord.houseProfiles)
                    ? chunkRecord.houseProfiles.find((profile) => predicate(profile))
                    : null
            }))
            .filter((entry) => entry.bestProfile);

        if (matches.length === 0) {
            return null;
        }

        matches.sort((left, right) => {
            const scoreLeft = (left.chunkRecord.tags.has('vault') ? 5 : 0) + (left.chunkRecord.distanceFromEntry || 0);
            const scoreRight = (right.chunkRecord.tags.has('vault') ? 5 : 0) + (right.chunkRecord.distanceFromEntry || 0);
            return scoreRight - scoreLeft;
        });

        return matches[0].chunkRecord;
    }

    function revealMerchantOnIsland(islandIndex = game.state.currentIslandIndex) {
        const merchantChunk = findPriorityChunk(islandIndex, (profile) => profile && (
            profile.kind === 'merchant'
            || profile.kind === 'craft_merchant'
        ));
        return merchantChunk ? revealChunkRecord(merchantChunk) : 0;
    }

    function revealBestHouseOnIsland(islandIndex = game.state.currentIslandIndex) {
        const bestChunk = findPriorityChunk(islandIndex, (profile) => profile && (
            profile.kind === 'finalChest'
            || (profile.kind === 'chest' && ['elite', 'jackpot', 'rich'].includes(profile.chestTier))
            || profile.kind === 'merchant'
            || profile.kind === 'craft_merchant'
            || profile.kind === 'station_keeper'
            || profile.kind === 'artisan'
        ));

        return bestChunk ? revealChunkRecord(bestChunk) : 0;
    }

    Object.assign(mapRuntime, {
        MAP_STORAGE_KEY,
        getExploredTilesState,
        captureChunk,
        captureVisibleWorld,
        getExploredTiles,
        buildExplorationHighlights,
        revealChunkRecord,
        revealIslandByIndex,
        revealMerchantOnIsland,
        revealBestHouseOnIsland,
        clearPersistedExploration,
        getPersistedWorldSeed,
        persistExploration,
        restorePersistedExploration
    });
})();
