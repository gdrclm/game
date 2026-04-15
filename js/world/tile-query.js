(() => {
    const tileQuery = window.Game.systems.worldTileQuery = window.Game.systems.worldTileQuery || {};
    const chunkStore = window.Game.systems.worldChunkStore;

    function getTileInfo(x, y, options = {}) {
        const { generateIfMissing = true } = options;
        const roundedX = Math.round(x);
        const roundedY = Math.round(y);
        const { chunkX, chunkY } = chunkStore.getChunkCoordinatesForWorld(roundedX, roundedY);
        const chunkOptions = {
            generateIfMissing,
            immediate: options.immediate
        };

        if (options.detailLevel) {
            chunkOptions.detailLevel = options.detailLevel;
        } else if (generateIfMissing) {
            chunkOptions.detailLevel = 'base';
        }

        const chunk = chunkStore.getChunk(chunkX, chunkY, chunkOptions);

        if (!chunk) {
            return {
                x: roundedX,
                y: roundedY,
                chunkX,
                chunkY,
                localX: null,
                localY: null,
                chunk: null,
                house: null,
                tileType: 'unloaded',
                baseTileType: 'unloaded',
                terrainLabel: 'не загружено',
                terrainFactor: Infinity,
                terrainBand: 'blocked',
                travelZoneKey: 'none',
                travelLabel: 'не загружено',
                travelBand: 'blocked',
                travelFactor: Infinity,
                travelWeight: Infinity
            };
        }

        const { localX, localY } = chunkStore.getLocalCoordinatesForWorld(roundedX, roundedY);
        const house = window.Game.systems.houses.getHouseAtChunkTile(chunk, localX, localY);
        const interaction = window.Game.systems.interactions
            ? window.Game.systems.interactions.getInteractionAtChunkTile(chunk, localX, localY)
            : null;
        const baseTileType = chunk.data[localY][localX];
        const rawTravelZoneKey = chunk.travelZones && chunk.travelZones[localY]
            ? chunk.travelZones[localY][localX] || 'none'
            : 'none';
        const content = window.Game.systems.content;
        const expedition = window.Game.systems.expedition;
        const tileInfo = {
            x: roundedX,
            y: roundedY,
            chunkX,
            chunkY,
            localX,
            localY,
            chunk,
            house,
            interaction,
            progression: chunk && chunk.progression ? chunk.progression : null,
            baseTileType,
            travelZoneKey: rawTravelZoneKey,
            tileType: house ? 'house' : baseTileType
        };

        tileInfo.terrainLabel = content ? content.getTileLabel(baseTileType) : baseTileType;
        tileInfo.terrainFactor = content ? content.getTileMovementFactor(baseTileType) : 1;
        tileInfo.terrainBand = content ? content.getTileRouteBand(baseTileType) : 'normal';
        tileInfo.travelZoneKey = expedition ? expedition.getTraversalZoneKey(tileInfo) : rawTravelZoneKey;
        tileInfo.travelZone = content ? content.getTravelZoneDefinition(tileInfo.travelZoneKey) : null;
        tileInfo.travelLabel = expedition ? expedition.getTraversalLabel(tileInfo) : tileInfo.terrainLabel;
        tileInfo.travelBand = expedition ? expedition.getTraversalBand(tileInfo) : tileInfo.terrainBand;
        tileInfo.travelFactor = expedition ? expedition.getTileTravelMultiplier(tileInfo) : tileInfo.terrainFactor;
        tileInfo.travelWeight = expedition ? expedition.getTraversalWeight(tileInfo) : tileInfo.travelFactor;

        return tileInfo;
    }

    function updatePlayerContext(position = window.Game.state.playerPos) {
        const state = window.Game.state;
        const tileInfo = getTileInfo(position.x, position.y, { generateIfMissing: false });
        const islandIndex = tileInfo.progression ? tileInfo.progression.islandIndex : 1;
        state.visitedIslandIds = state.visitedIslandIds || { 1: true };

        state.activeTileInfo = tileInfo;
        state.activeHouse = tileInfo.house || null;
        state.activeHouseId = tileInfo.house ? tileInfo.house.id : null;
        state.activeGroundItem = tileInfo.interaction && tileInfo.interaction.kind === 'groundItem'
            ? tileInfo.interaction
            : null;
        state.activeGroundItemId = state.activeGroundItem ? state.activeGroundItem.id : null;
        state.activeInteraction = window.Game.systems.interactions
            ? window.Game.systems.interactions.getAdjacentInteraction(position)
            : null;
        state.activeInteractionId = state.activeInteraction ? state.activeInteraction.id : null;
        state.currentIslandIndex = islandIndex;
        state.visitedIslandIds[islandIndex] = true;
        state.highestIslandIndex = Math.max(state.highestIslandIndex || 1, state.currentIslandIndex);

        return tileInfo;
    }

    Object.assign(tileQuery, {
        getTileInfo,
        updatePlayerContext
    });
})();
