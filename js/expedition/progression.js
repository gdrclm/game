(() => {
    const game = window.Game;
    const expedition = game.systems.expedition = game.systems.expedition || {};
    const progression = game.systems.expeditionProgression = game.systems.expeditionProgression || {};
    const shared = game.systems.expeditionShared || {};
    const islandLayout = game.systems.islandLayout || {};
    const chunkKey = shared.chunkKey || ((x, y) => `${x},${y}`);
    const finalIslandIndex = shared.finalIslandIndex || 30;
    const islandMap = new Map();
    const islandChunkMap = new Map();
    let archipelagoReady = false;

    function ensureArchipelago() {
        if (archipelagoReady) {
            return;
        }

        const occupiedKeys = new Set();
        let previousIsland = null;

        for (let islandIndex = 1; islandIndex <= finalIslandIndex; islandIndex++) {
            const island = islandLayout.buildPlacedIsland(islandIndex, previousIsland, occupiedKeys);

            if (!island) {
                break;
            }

            island.chunks.forEach((chunk) => {
                const key = chunkKey(chunk.chunkX, chunk.chunkY);
                occupiedKeys.add(key);
                islandChunkMap.set(key, chunk);
            });

            islandMap.set(islandIndex, island);
            previousIsland = island;
        }

        archipelagoReady = true;
    }

    function resetArchipelago() {
        islandMap.clear();
        islandChunkMap.clear();
        archipelagoReady = false;

        if (typeof islandLayout.resetLayoutState === 'function') {
            islandLayout.resetLayoutState();
        }
    }

    function getIslandChunkRecord(chunkX, chunkY) {
        ensureArchipelago();
        return islandChunkMap.get(chunkKey(chunkX, chunkY)) || null;
    }

    function getIslandRecord(islandIndex) {
        ensureArchipelago();
        return islandMap.get(islandIndex) || null;
    }

    function getIslandIndex(chunkX, chunkY) {
        const record = getIslandChunkRecord(chunkX, chunkY);
        return record ? record.islandIndex : 0;
    }

    function getChunkProgression(chunkX, chunkY) {
        const record = getIslandChunkRecord(chunkX, chunkY);
        if (!record) {
            return null;
        }

        const island = getIslandRecord(record.islandIndex);
        return island ? island.progression : null;
    }

    function getModifierSnapshot(context = {}) {
        const itemEffects = game.systems.itemEffects || null;
        return itemEffects && typeof itemEffects.getModifierSnapshot === 'function'
            ? itemEffects.getModifierSnapshot(context)
            : {
                travelCostMultiplier: 1,
                longRouteTravelCostMultiplier: 1,
                roughTravelCostMultiplier: 1,
                bridgeTravelCostMultiplier: 1,
                freeOpeningSteps: 0,
                chainTravelDiscount: 0,
                ignoreTravelZones: []
            };
    }

    function getDrainMultiplier(tileInfo = game.state.activeTileInfo) {
        const rewardScaling = game.systems.rewardScaling || null;

        if (rewardScaling && typeof rewardScaling.getDrainMultiplier === 'function') {
            return rewardScaling.getDrainMultiplier(tileInfo);
        }

        if (!tileInfo || !tileInfo.progression) {
            return 1;
        }

        return tileInfo.house ? 1 : tileInfo.progression.outsideDrainMultiplier;
    }

    function getTileTravelMultiplier(tileInfo = game.state.activeTileInfo, routeStepIndex = 1) {
        if (!tileInfo || tileInfo.house) {
            return 1;
        }

        const content = game.systems.content;
        const weatherRuntime = game.systems.weatherRuntime || null;
        const baseTileType = tileInfo.baseTileType || tileInfo.tileType;
        let multiplier = content ? content.getTileMovementFactor(baseTileType) : 1;
        const travelZoneKey = getTraversalZoneKey(tileInfo);
        const travelZoneDefinition = content ? content.getTravelZoneDefinition(travelZoneKey) : null;

        if (!Number.isFinite(multiplier) || multiplier <= 0) {
            multiplier = 1;
        }

        const modifiers = getModifierSnapshot({
            currentIslandIndex: tileInfo.progression ? tileInfo.progression.islandIndex : game.state.currentIslandIndex,
            routeStepIndex
        });
        const ignoredZones = new Set(modifiers.ignoreTravelZones || []);

        if (travelZoneDefinition && Number.isFinite(travelZoneDefinition.movementFactor) && !ignoredZones.has(travelZoneKey)) {
            multiplier *= travelZoneDefinition.movementFactor;
        }

        if (weatherRuntime && typeof weatherRuntime.getWeather === 'function') {
            const weather = weatherRuntime.getWeather(tileInfo);
            if (weather && Number.isFinite(weather.routeMultiplier)) {
                multiplier *= weather.routeMultiplier;
            }
        }

        return multiplier;
    }

    function getTraversalZoneKey(tileInfo = game.state.activeTileInfo) {
        if (!tileInfo || tileInfo.house) {
            return 'none';
        }

        return tileInfo.travelZoneKey || 'none';
    }

    function getTraversalBand(tileInfo = game.state.activeTileInfo) {
        if (!tileInfo || tileInfo.house) {
            return 'normal';
        }

        const content = game.systems.content;
        const baseTileType = tileInfo.baseTileType || tileInfo.tileType;
        const baseBand = content ? content.getTileRouteBand(baseTileType) : 'normal';
        const travelZoneKey = getTraversalZoneKey(tileInfo);
        const travelZoneDefinition = content ? content.getTravelZoneDefinition(travelZoneKey) : null;

        if (travelZoneDefinition && travelZoneKey !== 'none') {
            return travelZoneDefinition.routeBand || baseBand || 'normal';
        }

        return baseBand || 'normal';
    }

    function getTraversalLabel(tileInfo = game.state.activeTileInfo) {
        if (!tileInfo) {
            return 'местность';
        }

        if (tileInfo.house) {
            return 'дом';
        }

        const content = game.systems.content;
        const travelZoneKey = getTraversalZoneKey(tileInfo);
        const travelZoneDefinition = content ? content.getTravelZoneDefinition(travelZoneKey) : null;
        const baseTileType = tileInfo.baseTileType || tileInfo.tileType;

        if (travelZoneDefinition && travelZoneKey !== 'none' && travelZoneDefinition.label) {
            return travelZoneDefinition.label;
        }

        return content ? content.getTileLabel(baseTileType) : 'местность';
    }

    function getTraversalWeight(tileInfo = game.state.activeTileInfo, routeStepIndex = 1) {
        const islandIndex = tileInfo && tileInfo.progression
            ? tileInfo.progression.islandIndex
            : game.state.currentIslandIndex;
        const modifiers = getModifierSnapshot({
            currentIslandIndex: islandIndex,
            routeStepIndex
        });
        const travelZoneKey = getTraversalZoneKey(tileInfo);
        let weight = getDrainMultiplier(tileInfo) * getTileTravelMultiplier(tileInfo, routeStepIndex);

        if (routeStepIndex <= Math.max(0, modifiers.freeOpeningSteps || 0)) {
            return 0;
        }

        if (!tileInfo || !tileInfo.house) {
            if (tileInfo.baseTileType === 'bridge' || tileInfo.tileType === 'bridge') {
                weight *= modifiers.bridgeTravelCostMultiplier || 1;
            }

            if (travelZoneKey !== 'none' && !(modifiers.ignoreTravelZones || []).includes(travelZoneKey)) {
                weight *= modifiers.roughTravelCostMultiplier || 1;
            }

            if (routeStepIndex >= 4) {
                weight *= modifiers.longRouteTravelCostMultiplier || 1;
            }

            if (routeStepIndex > 1 && Number.isFinite(modifiers.chainTravelDiscount) && modifiers.chainTravelDiscount > 0) {
                weight *= Math.max(0.35, 1 - modifiers.chainTravelDiscount * (routeStepIndex - 1));
            }
        }

        weight *= modifiers.travelCostMultiplier || 1;
        return Math.max(0, weight);
    }

    function getRecoveryMultiplier(tileInfo = game.state.activeTileInfo) {
        const rewardScaling = game.systems.rewardScaling || null;

        if (rewardScaling && typeof rewardScaling.getRecoveryMultiplier === 'function') {
            return rewardScaling.getRecoveryMultiplier(tileInfo);
        }

        return tileInfo && tileInfo.progression ? tileInfo.progression.recoveryMultiplier : 1;
    }

    function scaleDrain(value, tileInfo = game.state.activeTileInfo) {
        const rewardScaling = game.systems.rewardScaling || null;

        if (rewardScaling && typeof rewardScaling.scaleDrain === 'function') {
            return rewardScaling.scaleDrain(value, tileInfo);
        }

        return Math.max(1, Math.round(value * getDrainMultiplier(tileInfo)));
    }

    function scaleRecovery(value, tileInfo = game.state.activeTileInfo) {
        const rewardScaling = game.systems.rewardScaling || null;

        if (rewardScaling && typeof rewardScaling.scaleRecovery === 'function') {
            return rewardScaling.scaleRecovery(value, tileInfo);
        }

        return Math.max(0, Math.round(value * getRecoveryMultiplier(tileInfo)));
    }

    function scaleTraversalDrain(value, tileInfo = game.state.activeTileInfo) {
        return value * getTraversalWeight(tileInfo);
    }

    Object.assign(progression, {
        finalIslandIndex,
        ensureArchipelago,
        resetArchipelago,
        getIslandChunkRecord,
        getIslandRecord,
        getIslandIndex,
        getChunkProgression,
        getDrainMultiplier,
        getTileTravelMultiplier,
        getTraversalZoneKey,
        getTraversalBand,
        getTraversalLabel,
        getTraversalWeight,
        getRecoveryMultiplier,
        scaleDrain,
        scaleTraversalDrain,
        scaleRecovery
    });

    Object.assign(expedition, {
        progression,
        finalIslandIndex,
        ensureArchipelago,
        resetArchipelago,
        getIslandChunkRecord,
        getIslandRecord,
        getIslandIndex,
        getChunkProgression,
        getDrainMultiplier,
        getTileTravelMultiplier,
        getTraversalZoneKey,
        getTraversalBand,
        getTraversalLabel,
        getTraversalWeight,
        getRecoveryMultiplier,
        scaleDrain,
        scaleTraversalDrain,
        scaleRecovery
    });
})();
