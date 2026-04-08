(() => {
    const game = window.Game;
    const expedition = game.systems.expedition = game.systems.expedition || {};
    const bridgeRuntime = game.systems.bridgeRuntime = game.systems.bridgeRuntime || {};
    const progression = game.systems.expeditionProgression || {};
    const LEGACY_BRIDGE_MAX_DURABILITY = 2;
    const BRIDGE_ITEM_WORLD_PROFILES = Object.freeze({
        bridge_kit: {
            sourceItemId: 'bridge_kit',
            label: 'Мост-комплект',
            bridgeFamily: 'portable',
            bridgeUpgradeStage: 0,
            bridgeReady: false,
            maxDurability: 2
        },
        portableBridge: {
            sourceItemId: 'portableBridge',
            label: 'Переносной мост',
            bridgeFamily: 'portable',
            bridgeUpgradeStage: 1,
            bridgeReady: true,
            maxDurability: 2
        },
        reinforcedBridge: {
            sourceItemId: 'reinforcedBridge',
            label: 'Усиленный мост',
            bridgeFamily: 'portable',
            bridgeUpgradeStage: 2,
            bridgeReady: true,
            maxDurability: 3
        },
        fieldBridge: {
            sourceItemId: 'fieldBridge',
            label: 'Полевой мостик',
            bridgeFamily: 'portable',
            bridgeUpgradeStage: 3,
            bridgeReady: true,
            maxDurability: 3
        },
        absoluteBridge: {
            sourceItemId: 'absoluteBridge',
            label: 'Абсолютный мост',
            bridgeFamily: 'portable',
            bridgeUpgradeStage: 4,
            bridgeReady: true,
            maxDurability: 4
        },
        ferryBoard: {
            sourceItemId: 'ferryBoard',
            label: 'Доска переправы',
            bridgeFamily: 'portable',
            bridgeUpgradeStage: 0,
            bridgeReady: true,
            maxDurability: 2
        },
        roughBridge: {
            sourceItemId: 'roughBridge',
            label: 'Грубый мостик',
            bridgeFamily: 'portable',
            bridgeUpgradeStage: 1,
            bridgeReady: true,
            maxDurability: 2
        }
    });

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

    function getPlacedBridgeStateByKey() {
        const state = game.state;
        state.placedBridgeStateByKey = state.placedBridgeStateByKey || {};
        return state.placedBridgeStateByKey;
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

    function getBridgeKey(worldX, worldY) {
        return `${worldX},${worldY}`;
    }

    function cloneRecord(record) {
        return record ? JSON.parse(JSON.stringify(record)) : null;
    }

    function getBridgeItemDefinition(itemId = '') {
        const itemRegistry = game.systems.itemRegistry || null;
        return itemRegistry && typeof itemRegistry.getItemDefinition === 'function'
            ? itemRegistry.getItemDefinition(itemId)
            : null;
    }

    function buildBridgePlacementProfile(itemId = '', overrides = {}) {
        const profileByItemId = BRIDGE_ITEM_WORLD_PROFILES[itemId] || BRIDGE_ITEM_WORLD_PROFILES.portableBridge;
        const definition = itemId ? getBridgeItemDefinition(itemId) : null;
        const extra = definition && definition.extra && typeof definition.extra === 'object'
            ? definition.extra
            : {};

        return {
            sourceItemId: typeof overrides.sourceItemId === 'string' && overrides.sourceItemId.trim()
                ? overrides.sourceItemId.trim()
                : profileByItemId.sourceItemId,
            label: typeof overrides.label === 'string' && overrides.label.trim()
                ? overrides.label.trim()
                : (definition && definition.label) || extra.label || profileByItemId.label,
            bridgeFamily: typeof overrides.bridgeFamily === 'string' && overrides.bridgeFamily.trim()
                ? overrides.bridgeFamily.trim()
                : (typeof extra.bridgeFamily === 'string' && extra.bridgeFamily.trim()
                    ? extra.bridgeFamily.trim()
                    : profileByItemId.bridgeFamily),
            bridgeUpgradeStage: Number.isFinite(overrides.bridgeUpgradeStage)
                ? Math.max(0, Math.floor(overrides.bridgeUpgradeStage))
                : (Number.isFinite(extra.bridgeUpgradeStage)
                    ? Math.max(0, Math.floor(extra.bridgeUpgradeStage))
                    : profileByItemId.bridgeUpgradeStage),
            bridgeReady: typeof overrides.bridgeReady === 'boolean'
                ? overrides.bridgeReady
                : (typeof extra.bridgeReady === 'boolean'
                    ? extra.bridgeReady
                    : profileByItemId.bridgeReady),
            maxDurability: Number.isFinite(overrides.maxDurability)
                ? Math.max(1, Math.floor(overrides.maxDurability))
                : profileByItemId.maxDurability
        };
    }

    function sanitizePlacedBridgeRecord(record = {}, worldX = 0, worldY = 0) {
        const baseProfile = buildBridgePlacementProfile(record.sourceItemId || 'portableBridge', record);
        const currentDurability = Number.isFinite(record.currentDurability)
            ? Math.max(0, Math.min(baseProfile.maxDurability, Math.floor(record.currentDurability)))
            : baseProfile.maxDurability;

        return {
            worldX,
            worldY,
            sourceItemId: baseProfile.sourceItemId,
            label: baseProfile.label,
            bridgeFamily: baseProfile.bridgeFamily,
            bridgeUpgradeStage: baseProfile.bridgeUpgradeStage,
            bridgeReady: baseProfile.bridgeReady,
            maxDurability: baseProfile.maxDurability,
            currentDurability
        };
    }

    function ensurePlacedBridgeRecord(worldX, worldY) {
        const key = getBridgeKey(worldX, worldY);
        const placedBridgeState = getPlacedBridgeStateByKey();
        const existingRecord = placedBridgeState[key];

        if (existingRecord) {
            const sanitized = sanitizePlacedBridgeRecord(existingRecord, worldX, worldY);
            placedBridgeState[key] = sanitized;
            return sanitized;
        }

        if (!getPlacedBridgeState()[key]) {
            return null;
        }

        const fallbackRecord = sanitizePlacedBridgeRecord({
            sourceItemId: 'portableBridge',
            label: 'Переносной мост',
            bridgeFamily: 'portable',
            bridgeUpgradeStage: 1,
            bridgeReady: true,
            maxDurability: LEGACY_BRIDGE_MAX_DURABILITY,
            currentDurability: getWeakenedBridgeState()[key]
                ? 1
                : LEGACY_BRIDGE_MAX_DURABILITY
        }, worldX, worldY);

        placedBridgeState[key] = fallbackRecord;
        return fallbackRecord;
    }

    function getPlacedBridgeRecord(worldX, worldY) {
        return cloneRecord(ensurePlacedBridgeRecord(worldX, worldY));
    }

    function getBridgeMaxDurability(tileInfo = game.state.activeTileInfo) {
        if (!tileInfo || tileInfo.tileType !== 'bridge') {
            return 0;
        }

        const placedRecord = ensurePlacedBridgeRecord(tileInfo.x, tileInfo.y);
        if (placedRecord) {
            return placedRecord.maxDurability;
        }

        return LEGACY_BRIDGE_MAX_DURABILITY;
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

        const placedRecord = ensurePlacedBridgeRecord(tileInfo.x, tileInfo.y);
        if (placedRecord) {
            return placedRecord.currentDurability;
        }

        const chunkZoneKey = tileInfo.chunk && tileInfo.chunk.travelZones && tileInfo.chunk.travelZones[tileInfo.localY]
            ? tileInfo.chunk.travelZones[tileInfo.localY][tileInfo.localX]
            : 'none';
        const runtimeZoneKey = progression.getTraversalZoneKey
            ? progression.getTraversalZoneKey(tileInfo)
            : 'none';
        const zoneKey = runtimeZoneKey && runtimeZoneKey !== 'none'
            ? runtimeZoneKey
            : (tileInfo.travelZoneKey || chunkZoneKey || 'none');

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
        const placedBridgeState = getPlacedBridgeState();
        const placedBridgeRecords = getPlacedBridgeStateByKey();
        const weakenedBridgeState = getWeakenedBridgeState();
        const key = getBridgeKey(worldX, worldY);

        if (bridgeState[key]) {
            return false;
        }

        const tileInfo = game.systems.world.getTileInfo(worldX, worldY, { generateIfMissing: false });

        if (!tileInfo || tileInfo.tileType !== 'bridge' || !tileInfo.chunk) {
            return false;
        }

        bridgeState[key] = true;
        delete placedBridgeState[key];
        delete placedBridgeRecords[key];
        delete weakenedBridgeState[key];
        tileInfo.tileType = 'water';
        tileInfo.baseTileType = 'water';
        tileInfo.travelZoneKey = 'none';
        tileInfo.chunk.data[tileInfo.localY][tileInfo.localX] = 'water';
        if (tileInfo.chunk.travelZones && tileInfo.chunk.travelZones[tileInfo.localY]) {
            tileInfo.chunk.travelZones[tileInfo.localY][tileInfo.localX] = 'none';
        }
        tileInfo.chunk.renderCache = null;
        return true;
    }

    function weakenBridgeAt(worldX, worldY) {
        const weakenedBridgeState = getWeakenedBridgeState();
        const key = getBridgeKey(worldX, worldY);
        const tileInfo = game.systems.world.getTileInfo(worldX, worldY, { generateIfMissing: false });

        if (!tileInfo || tileInfo.tileType !== 'bridge' || !tileInfo.chunk) {
            return false;
        }

        const placedRecord = ensurePlacedBridgeRecord(worldX, worldY);

        if (placedRecord) {
            if (placedRecord.currentDurability <= 1) {
                return false;
            }

            placedRecord.currentDurability -= 1;
            getPlacedBridgeStateByKey()[key] = placedRecord;

            if (placedRecord.currentDurability <= 1) {
                weakenedBridgeState[key] = true;
                tileInfo.travelZoneKey = 'oldBridge';
                if (tileInfo.chunk.travelZones && tileInfo.chunk.travelZones[tileInfo.localY]) {
                    tileInfo.chunk.travelZones[tileInfo.localY][tileInfo.localX] = 'oldBridge';
                }
            } else {
                delete weakenedBridgeState[key];
                tileInfo.travelZoneKey = 'none';
                if (tileInfo.chunk.travelZones && tileInfo.chunk.travelZones[tileInfo.localY]) {
                    tileInfo.chunk.travelZones[tileInfo.localY][tileInfo.localX] = 'none';
                }
            }

            tileInfo.chunk.renderCache = null;
            return true;
        }

        weakenedBridgeState[key] = true;
        tileInfo.travelZoneKey = 'oldBridge';
        if (tileInfo.chunk.travelZones && tileInfo.chunk.travelZones[tileInfo.localY]) {
            tileInfo.chunk.travelZones[tileInfo.localY][tileInfo.localX] = 'oldBridge';
        }
        tileInfo.chunk.renderCache = null;
        return true;
    }

    function placeBridgeAt(worldX, worldY, profile = {}) {
        const placedBridgeState = getPlacedBridgeState();
        const placedBridgeStateByKey = getPlacedBridgeStateByKey();
        const collapsedBridgeState = getCollapsedBridgeState();
        const weakenedBridgeState = getWeakenedBridgeState();
        const key = getBridgeKey(worldX, worldY);

        if (placedBridgeState[key]) {
            return false;
        }

        const tileInfo = game.systems.world.getTileInfo(worldX, worldY, { generateIfMissing: false });

        if (!tileInfo || tileInfo.baseTileType !== 'water' || !tileInfo.chunk || tileInfo.house) {
            return false;
        }

        placedBridgeState[key] = true;
        placedBridgeStateByKey[key] = sanitizePlacedBridgeRecord(profile, worldX, worldY);
        delete collapsedBridgeState[key];
        delete weakenedBridgeState[key];
        tileInfo.tileType = 'bridge';
        tileInfo.baseTileType = 'bridge';
        tileInfo.travelZoneKey = 'none';
        tileInfo.chunk.data[tileInfo.localY][tileInfo.localX] = 'bridge';
        if (tileInfo.chunk.travelZones && tileInfo.chunk.travelZones[tileInfo.localY]) {
            tileInfo.chunk.travelZones[tileInfo.localY][tileInfo.localX] = 'none';
        }
        tileInfo.chunk.renderCache = null;
        return true;
    }

    function repairBridgeAt(worldX, worldY) {
        const key = getBridgeKey(worldX, worldY);
        const tileInfo = game.systems.world.getTileInfo(worldX, worldY, { generateIfMissing: false });

        if (!tileInfo || tileInfo.tileType !== 'bridge' || !tileInfo.chunk) {
            return false;
        }

        const placedRecord = ensurePlacedBridgeRecord(worldX, worldY);
        if (placedRecord) {
            placedRecord.currentDurability = placedRecord.maxDurability;
            getPlacedBridgeStateByKey()[key] = placedRecord;
        }

        delete getWeakenedBridgeState()[key];
        delete getCollapsedBridgeState()[key];
        tileInfo.tileType = 'bridge';
        tileInfo.baseTileType = 'bridge';
        tileInfo.travelZoneKey = 'none';

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
        const maxDurability = getBridgeMaxDurability(fromInfo);

        if (durability <= 0) {
            return null;
        }

        if (durability <= 1) {
            return collapseBridgeAt(fromInfo.x, fromInfo.y)
                ? {
                    status: 'collapsed',
                    durabilityRemaining: 0,
                    maxDurability
                }
                : null;
        }

        if (!weakenBridgeAt(fromInfo.x, fromInfo.y)) {
            return null;
        }

        const durabilityRemaining = getBridgeDurability(fromInfo);
        return {
            status: durabilityRemaining <= 1 ? 'weakened' : 'worn',
            durabilityRemaining,
            maxDurability
        };
    }

    Object.assign(bridgeRuntime, {
        getCollapsedBridgeState,
        getPlacedBridgeState,
        getPlacedBridgeStateByKey,
        getWeakenedBridgeState,
        isFragileBridgeTile,
        isBridgeCollapsed,
        isBridgeWeakened,
        buildBridgePlacementProfile,
        getPlacedBridgeRecord,
        getBridgeMaxDurability,
        getBridgeDurability,
        applyPlacedBridges,
        applyWeakenedBridges,
        applyCollapsedBridges,
        placeBridgeAt,
        repairBridgeAt,
        collapseBridgeAt,
        weakenBridgeAt,
        handleTileTransition
    });

    Object.assign(expedition, {
        bridgeRuntime,
        isFragileBridgeTile,
        isBridgeCollapsed,
        isBridgeWeakened,
        buildBridgePlacementProfile,
        getPlacedBridgeRecord,
        getBridgeMaxDurability,
        getBridgeDurability,
        applyPlacedBridges,
        applyWeakenedBridges,
        applyCollapsedBridges,
        placeBridgeAt,
        repairBridgeAt,
        collapseBridgeAt,
        handleTileTransition
    });
})();
