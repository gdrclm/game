(() => {
    const game = window.Game;
    const mapRuntime = game.systems.mapRuntime = game.systems.mapRuntime || {};
    const MAP_STORAGE_KEY = 'iso_game_map_exploration_v2';
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

    function persistExploration() {
        if (typeof localStorage === 'undefined') {
            return false;
        }

        try {
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
            if (shouldRestoreExploredEntry(entry, allowedIslandIndexes)) {
                explored[key] = entry;
            }
        });
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
        if (!game.systems.camera || typeof game.systems.camera.isoToScreen !== 'function') {
            return false;
        }

        const screen = game.systems.camera.isoToScreen(worldX, worldY);
        const marginX = game.config.tileWidth;
        const marginY = game.config.tileHeight * 2;

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
        const hasQuest = (expedition.kind === 'merchant' || expedition.kind === 'artisan')
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

        if (interaction.kind === 'well') {
            return 'well';
        }

        if (interaction.kind === 'forage') {
            return 'berries';
        }

        return '';
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
            && previousEntry.interactionLabel === nextEntry.interactionLabel;
    }

    function getResourceKind(baseTileType, travelZoneKey, worldX, worldY, interaction) {
        const interactionResourceKind = getInteractionResourceKind(interaction);

        if (interactionResourceKind) {
            return interactionResourceKind;
        }

        if ((baseTileType === 'rubble' || baseTileType === 'rock') && !isTerrainHarvested(worldX, worldY, getLegacyHarvestItemIds(baseTileType))) {
            return 'stone';
        }

        if (travelZoneKey === 'badSector' && !isTerrainHarvested(worldX, worldY, 'soilClod')) {
            return 'soil';
        }

        if (baseTileType === 'reeds' && !isTerrainHarvested(worldX, worldY, getLegacyHarvestItemIds('reeds'))) {
            return 'grass';
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
        if (game.state.activeHouse) {
            return 0;
        }

        let capturedCount = 0;
        let changedCount = 0;

        for (let chunkY = focusChunkY - game.config.viewDistance; chunkY <= focusChunkY + game.config.viewDistance; chunkY++) {
            for (let chunkX = focusChunkX - game.config.viewDistance; chunkX <= focusChunkX + game.config.viewDistance; chunkX++) {
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
    }

    function getExploredTiles() {
        return Object.values(getExploredTilesState());
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
        const merchantChunk = findPriorityChunk(islandIndex, (profile) => profile && profile.kind === 'merchant');
        return merchantChunk ? revealChunkRecord(merchantChunk) : 0;
    }

    function revealBestHouseOnIsland(islandIndex = game.state.currentIslandIndex) {
        const bestChunk = findPriorityChunk(islandIndex, (profile) => profile && (
            profile.kind === 'finalChest'
            || (profile.kind === 'chest' && ['elite', 'jackpot', 'rich'].includes(profile.chestTier))
            || profile.kind === 'merchant'
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
