(() => {
    const game = window.Game;
    const expedition = game.systems.expedition = game.systems.expedition || {};
    const boatRuntime = game.systems.boatRuntime = game.systems.boatRuntime || {};
    const DEFAULT_BOAT_MAX_DURABILITY = 3;
    const DEFAULT_WATER_TRAVEL_MULTIPLIER = 1.34;
    const DEFAULT_WATER_ROUTE_BAND = 'hazard';
    const DEFAULT_WATER_TRAVEL_LABEL = 'вода на лодке';
    const BOAT_ITEM_TRAVERSAL_PROFILES = Object.freeze({
        boat_ready: {
            sourceItemId: 'boat_ready',
            label: 'Готовая лодка',
            boatFamily: 'expedition',
            boatUpgradeStage: 1,
            maxDurability: DEFAULT_BOAT_MAX_DURABILITY,
            waterTravelMultiplier: DEFAULT_WATER_TRAVEL_MULTIPLIER,
            waterRouteBand: DEFAULT_WATER_ROUTE_BAND,
            waterTraversalLabel: DEFAULT_WATER_TRAVEL_LABEL
        }
    });

    function cloneRecord(record) {
        return record ? JSON.parse(JSON.stringify(record)) : null;
    }

    function getBoatTraversalState() {
        const state = game.state;
        state.boatTraversalState = state.boatTraversalState && typeof state.boatTraversalState === 'object'
            ? state.boatTraversalState
            : null;
        return state.boatTraversalState;
    }

    function invalidatePathCaches() {
        const pathfinding = game.systems.pathfinding || null;
        if (pathfinding && typeof pathfinding.invalidateCaches === 'function') {
            pathfinding.invalidateCaches();
        }
    }

    function refreshPlayerContext() {
        const world = game.systems.world || null;
        if (world && typeof world.updatePlayerContext === 'function') {
            world.updatePlayerContext(game.state.playerPos);
        }
    }

    function getBoatItemDefinition(itemId = '') {
        const itemRegistry = game.systems.itemRegistry || null;
        return itemRegistry && typeof itemRegistry.getItemDefinition === 'function'
            ? itemRegistry.getItemDefinition(itemId)
            : null;
    }

    function buildBoatTraversalProfile(itemId = '', overrides = {}) {
        const profileByItemId = BOAT_ITEM_TRAVERSAL_PROFILES[itemId] || BOAT_ITEM_TRAVERSAL_PROFILES.boat_ready;
        const definition = itemId ? getBoatItemDefinition(itemId) : null;
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
            boatFamily: typeof overrides.boatFamily === 'string' && overrides.boatFamily.trim()
                ? overrides.boatFamily.trim()
                : (typeof extra.boatFamily === 'string' && extra.boatFamily.trim()
                    ? extra.boatFamily.trim()
                    : profileByItemId.boatFamily),
            boatUpgradeStage: Number.isFinite(overrides.boatUpgradeStage)
                ? Math.max(0, Math.floor(overrides.boatUpgradeStage))
                : (Number.isFinite(extra.boatUpgradeStage)
                    ? Math.max(0, Math.floor(extra.boatUpgradeStage))
                    : profileByItemId.boatUpgradeStage),
            maxDurability: Number.isFinite(overrides.maxDurability)
                ? Math.max(1, Math.floor(overrides.maxDurability))
                : (Number.isFinite(extra.boatMaxDurability)
                    ? Math.max(1, Math.floor(extra.boatMaxDurability))
                    : profileByItemId.maxDurability),
            waterTravelMultiplier: Number.isFinite(overrides.waterTravelMultiplier)
                ? Math.max(0.5, overrides.waterTravelMultiplier)
                : (Number.isFinite(extra.waterTravelMultiplier)
                    ? Math.max(0.5, extra.waterTravelMultiplier)
                    : profileByItemId.waterTravelMultiplier),
            waterRouteBand: typeof overrides.waterRouteBand === 'string' && overrides.waterRouteBand.trim()
                ? overrides.waterRouteBand.trim()
                : (typeof extra.waterRouteBand === 'string' && extra.waterRouteBand.trim()
                    ? extra.waterRouteBand.trim()
                    : profileByItemId.waterRouteBand),
            waterTraversalLabel: typeof overrides.waterTraversalLabel === 'string' && overrides.waterTraversalLabel.trim()
                ? overrides.waterTraversalLabel.trim()
                : (typeof extra.waterTraversalLabel === 'string' && extra.waterTraversalLabel.trim()
                    ? extra.waterTraversalLabel.trim()
                    : profileByItemId.waterTraversalLabel)
        };
    }

    function sanitizeBoatTraversalRecord(record = {}) {
        const baseProfile = buildBoatTraversalProfile(record.sourceItemId || 'boat_ready', record);
        const currentDurability = Number.isFinite(record.currentDurability)
            ? Math.max(0, Math.min(baseProfile.maxDurability, Math.floor(record.currentDurability)))
            : baseProfile.maxDurability;

        return {
            sourceItemId: baseProfile.sourceItemId,
            label: baseProfile.label,
            boatFamily: baseProfile.boatFamily,
            boatUpgradeStage: baseProfile.boatUpgradeStage,
            maxDurability: baseProfile.maxDurability,
            currentDurability,
            waterTravelMultiplier: baseProfile.waterTravelMultiplier,
            waterRouteBand: baseProfile.waterRouteBand,
            waterTraversalLabel: baseProfile.waterTraversalLabel
        };
    }

    function getActiveBoatRecord() {
        const rawState = getBoatTraversalState();
        if (!rawState) {
            return null;
        }

        const sanitized = sanitizeBoatTraversalRecord(rawState);
        game.state.boatTraversalState = sanitized;
        return cloneRecord(sanitized);
    }

    function hasActiveBoatTraversal() {
        const record = getActiveBoatRecord();
        return Boolean(record && record.currentDurability > 0);
    }

    function hasRepairableBoatTraversal() {
        const record = getActiveBoatRecord();
        return Boolean(record && record.currentDurability < record.maxDurability);
    }

    function canActivateBoatTraversal() {
        const record = getActiveBoatRecord();
        return !record || record.currentDurability <= 0;
    }

    function getBoatDurability() {
        const record = getActiveBoatRecord();
        return record ? record.currentDurability : 0;
    }

    function getBoatMaxDurability() {
        const record = getActiveBoatRecord();
        return record ? record.maxDurability : 0;
    }

    function getWaterTraversalMultiplier(tileInfo = null) {
        const record = getActiveBoatRecord();
        if (!record) {
            return Infinity;
        }

        if (tileInfo && !canTraverseTileInfo(tileInfo)) {
            return Infinity;
        }

        return record.waterTravelMultiplier;
    }

    function getWaterTraversalBand() {
        const record = getActiveBoatRecord();
        return record ? record.waterRouteBand : 'blocked';
    }

    function getWaterTraversalLabel() {
        const record = getActiveBoatRecord();
        return record ? record.waterTraversalLabel : 'вода';
    }

    function activateBoatTraversal(profile = {}) {
        const nextRecord = sanitizeBoatTraversalRecord(profile);
        game.state.boatTraversalState = nextRecord;
        invalidatePathCaches();
        refreshPlayerContext();
        return cloneRecord(nextRecord);
    }

    function repairBoatTraversal() {
        const record = getActiveBoatRecord();
        if (!record) {
            return null;
        }

        const repairedRecord = {
            ...record,
            currentDurability: record.maxDurability
        };
        game.state.boatTraversalState = repairedRecord;
        invalidatePathCaches();
        refreshPlayerContext();
        return cloneRecord(repairedRecord);
    }

    function isWaterTile(tileInfo) {
        return Boolean(tileInfo) && (
            tileInfo.tileType === 'water'
            || tileInfo.baseTileType === 'water'
        );
    }

    function canTraverseTileInfo(tileInfo) {
        return Boolean(
            tileInfo
            && !tileInfo.house
            && isWaterTile(tileInfo)
            && hasActiveBoatTraversal()
        );
    }

    function handleBoatTransition(fromInfo, toInfo) {
        if (!fromInfo || !toInfo) {
            return null;
        }

        if (fromInfo.x === toInfo.x && fromInfo.y === toInfo.y) {
            return null;
        }

        if (!isWaterTile(fromInfo)) {
            return null;
        }

        const record = getActiveBoatRecord();
        if (!record || record.currentDurability <= 0) {
            return null;
        }

        const nextRecord = {
            ...record,
            currentDurability: Math.max(0, record.currentDurability - 1)
        };
        game.state.boatTraversalState = nextRecord;
        invalidatePathCaches();
        refreshPlayerContext();

        return {
            status: nextRecord.currentDurability <= 0
                ? 'broken'
                : (nextRecord.currentDurability === 1 ? 'damaged' : 'worn'),
            durabilityRemaining: nextRecord.currentDurability,
            maxDurability: nextRecord.maxDurability,
            label: nextRecord.label
        };
    }

    Object.assign(boatRuntime, {
        getBoatTraversalState,
        buildBoatTraversalProfile,
        getActiveBoatRecord,
        hasActiveBoatTraversal,
        hasRepairableBoatTraversal,
        canActivateBoatTraversal,
        getBoatDurability,
        getBoatMaxDurability,
        getWaterTraversalMultiplier,
        getWaterTraversalBand,
        getWaterTraversalLabel,
        activateBoatTraversal,
        repairBoatTraversal,
        canTraverseTileInfo,
        handleBoatTransition
    });

    Object.assign(expedition, {
        boatRuntime,
        buildBoatTraversalProfile,
        getActiveBoatRecord,
        hasActiveBoatTraversal,
        hasRepairableBoatTraversal,
        canActivateBoatTraversal,
        getBoatDurability,
        getBoatMaxDurability,
        getWaterTraversalMultiplier,
        getWaterTraversalBand,
        getWaterTraversalLabel,
        activateBoatTraversal,
        repairBoatTraversal,
        canTraverseTileInfo,
        handleBoatTransition
    });
})();
