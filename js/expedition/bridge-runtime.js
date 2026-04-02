(() => {
    const game = window.Game;
    const expedition = game.systems.expedition = game.systems.expedition || {};
    const bridgeRuntime = game.systems.bridgeRuntime = game.systems.bridgeRuntime || {};
    const progression = game.systems.expeditionProgression || {};

    function getCollapsedBridgeState() {
        const state = game.state;
        state.collapsedBridgeKeys = state.collapsedBridgeKeys || {};
        return state.collapsedBridgeKeys;
    }

    function getPlacedBridgeState() {
        const state = game.state;
        state.placedBridgeKeys = state.placedBridgeKeys || {};
        return state.placedBridgeKeys;
    }

    function getWeakenedBridgeState() {
        const state = game.state;
        state.weakenedBridgeKeys = state.weakenedBridgeKeys || {};
        return state.weakenedBridgeKeys;
    }

    function isBridgeCollapsed(worldX, worldY) {
        return Boolean(getCollapsedBridgeState()[`${worldX},${worldY}`]);
    }

    function isBridgeWeakened(worldX, worldY) {
        return Boolean(getWeakenedBridgeState()[`${worldX},${worldY}`]);
    }

    function isFragileBridgeTile(tileInfo) {
        if (!tileInfo || tileInfo.tileType !== 'bridge' || !tileInfo.progression) {
            return false;
        }

        if (tileInfo.progression.islandIndex <= 2) {
            return false;
        }

        const island = progression.getIslandRecord
            ? progression.getIslandRecord(tileInfo.progression.islandIndex)
            : null;
        if (!island) {
            return false;
        }

        return island.exitChunkKeys.size >= 3;
    }

    function getBridgeDurability(tileInfo = game.state.activeTileInfo) {
        if (!tileInfo || tileInfo.tileType !== 'bridge') {
            return 0;
        }

        const zoneKey = progression.getTraversalZoneKey
            ? progression.getTraversalZoneKey(tileInfo)
            : 'none';

        if (zoneKey === 'oldBridge' || zoneKey === 'collapseSpan') {
            return 1;
        }

        return 2;
    }

    function applyCollapsedBridges(chunkData, travelZones, chunkX, chunkY) {
        const chunkSize = game.config.chunkSize;

        for (let localY = 0; localY < chunkSize; localY++) {
            for (let localX = 0; localX < chunkSize; localX++) {
                if (chunkData[localY][localX] !== 'bridge') {
                    continue;
                }

                const worldX = chunkX * chunkSize + localX;
                const worldY = chunkY * chunkSize + localY;

                if (isBridgeCollapsed(worldX, worldY)) {
                    chunkData[localY][localX] = 'water';
                    if (travelZones && travelZones[localY]) {
                        travelZones[localY][localX] = 'none';
                    }
                }
            }
        }
    }

    function applyWeakenedBridges(chunkData, travelZones, chunkX, chunkY) {
        const chunkSize = game.config.chunkSize;
        const weakenedBridgeState = getWeakenedBridgeState();

        Object.keys(weakenedBridgeState).forEach((key) => {
            if (!weakenedBridgeState[key]) {
                return;
            }

            const [worldX, worldY] = key.split(',').map(Number);
            const targetChunkX = Math.floor(worldX / chunkSize);
            const targetChunkY = Math.floor(worldY / chunkSize);

            if (targetChunkX !== chunkX || targetChunkY !== chunkY) {
                return;
            }

            const localX = worldX - chunkX * chunkSize;
            const localY = worldY - chunkY * chunkSize;

            if (localX < 0 || localX >= chunkSize || localY < 0 || localY >= chunkSize) {
                return;
            }

            if (chunkData[localY][localX] === 'bridge' && travelZones && travelZones[localY]) {
                travelZones[localY][localX] = 'oldBridge';
            }
        });
    }

    function applyPlacedBridges(chunkData, chunkX, chunkY) {
        const chunkSize = game.config.chunkSize;
        const placedBridgeState = getPlacedBridgeState();

        Object.keys(placedBridgeState).forEach((key) => {
            if (!placedBridgeState[key]) {
                return;
            }

            const [worldX, worldY] = key.split(',').map(Number);
            const targetChunkX = Math.floor(worldX / chunkSize);
            const targetChunkY = Math.floor(worldY / chunkSize);

            if (targetChunkX !== chunkX || targetChunkY !== chunkY) {
                return;
            }

            const localX = worldX - chunkX * chunkSize;
            const localY = worldY - chunkY * chunkSize;

            if (localX < 0 || localX >= chunkSize || localY < 0 || localY >= chunkSize) {
                return;
            }

            chunkData[localY][localX] = 'bridge';
        });
    }

    function collapseBridgeAt(worldX, worldY) {
        const bridgeState = getCollapsedBridgeState();
        const weakenedBridgeState = getWeakenedBridgeState();
        const key = `${worldX},${worldY}`;

        if (bridgeState[key]) {
            return false;
        }

        const tileInfo = game.systems.world.getTileInfo(worldX, worldY, { generateIfMissing: false });

        if (!tileInfo || tileInfo.tileType !== 'bridge' || !tileInfo.chunk) {
            return false;
        }

        bridgeState[key] = true;
        delete weakenedBridgeState[key];
        tileInfo.chunk.data[tileInfo.localY][tileInfo.localX] = 'water';
        if (tileInfo.chunk.travelZones && tileInfo.chunk.travelZones[tileInfo.localY]) {
            tileInfo.chunk.travelZones[tileInfo.localY][tileInfo.localX] = 'none';
        }
        tileInfo.chunk.renderCache = null;
        return true;
    }

    function weakenBridgeAt(worldX, worldY) {
        const weakenedBridgeState = getWeakenedBridgeState();
        const key = `${worldX},${worldY}`;
        const tileInfo = game.systems.world.getTileInfo(worldX, worldY, { generateIfMissing: false });

        if (!tileInfo || tileInfo.tileType !== 'bridge' || !tileInfo.chunk) {
            return false;
        }

        weakenedBridgeState[key] = true;
        if (tileInfo.chunk.travelZones && tileInfo.chunk.travelZones[tileInfo.localY]) {
            tileInfo.chunk.travelZones[tileInfo.localY][tileInfo.localX] = 'oldBridge';
        }
        tileInfo.chunk.renderCache = null;
        return true;
    }

    function placeBridgeAt(worldX, worldY) {
        const placedBridgeState = getPlacedBridgeState();
        const weakenedBridgeState = getWeakenedBridgeState();
        const key = `${worldX},${worldY}`;

        if (placedBridgeState[key]) {
            return false;
        }

        const tileInfo = game.systems.world.getTileInfo(worldX, worldY, { generateIfMissing: false });

        if (!tileInfo || tileInfo.baseTileType !== 'water' || !tileInfo.chunk || tileInfo.house) {
            return false;
        }

        placedBridgeState[key] = true;
        delete weakenedBridgeState[key];
        tileInfo.chunk.data[tileInfo.localY][tileInfo.localX] = 'bridge';
        if (tileInfo.chunk.travelZones && tileInfo.chunk.travelZones[tileInfo.localY]) {
            tileInfo.chunk.travelZones[tileInfo.localY][tileInfo.localX] = 'none';
        }
        tileInfo.chunk.renderCache = null;
        return true;
    }

    function handleTileTransition(fromInfo, toInfo) {
        if (!fromInfo || !toInfo || fromInfo.tileType !== 'bridge') {
            return null;
        }

        if (fromInfo.x === toInfo.x && fromInfo.y === toInfo.y) {
            return null;
        }

        const durability = getBridgeDurability(fromInfo);

        if (durability <= 0) {
            return null;
        }

        if (durability <= 1) {
            return collapseBridgeAt(fromInfo.x, fromInfo.y) ? 'collapsed' : null;
        }

        return weakenBridgeAt(fromInfo.x, fromInfo.y) ? 'weakened' : null;
    }

    Object.assign(bridgeRuntime, {
        getCollapsedBridgeState,
        getPlacedBridgeState,
        getWeakenedBridgeState,
        isFragileBridgeTile,
        isBridgeCollapsed,
        isBridgeWeakened,
        getBridgeDurability,
        applyPlacedBridges,
        applyWeakenedBridges,
        applyCollapsedBridges,
        placeBridgeAt,
        collapseBridgeAt,
        weakenBridgeAt,
        handleTileTransition
    });

    Object.assign(expedition, {
        bridgeRuntime,
        isFragileBridgeTile,
        isBridgeCollapsed,
        isBridgeWeakened,
        getBridgeDurability,
        applyPlacedBridges,
        applyWeakenedBridges,
        applyCollapsedBridges,
        placeBridgeAt,
        collapseBridgeAt,
        handleTileTransition
    });
})();
