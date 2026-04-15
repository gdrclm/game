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
    const occupiedChunkKeys = new Set();
    let nextIslandIndexToBuild = 1;
    let previousIsland = null;
    let archipelagoReady = false;
    let archipelagoMetadataCache = null;
    const CRAFT_REQUIREMENT_PHASES = Object.freeze({
        survival: 'survival',
        bridge: 'bridge',
        advanced: 'advanced'
    });

    function getIslandNeedProfileSystem() {
        return game.systems.islandNeedProfile || null;
    }

    function cloneValue(value) {
        if (Array.isArray(value)) {
            return value.map(cloneValue);
        }

        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)])
            );
        }

        return value;
    }

    function normalizeStringList(list) {
        return Array.isArray(list)
            ? list.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim())
            : [];
    }

    function buildFallbackNeedWindow(islandIndex) {
        const islandNeedProfile = getIslandNeedProfileSystem();
        return islandNeedProfile && typeof islandNeedProfile.getIslandNeedWindow === 'function'
            ? islandNeedProfile.getIslandNeedWindow(islandIndex)
            : null;
    }

    function resolveNeedWindow(progressionRecordOrIslandIndex) {
        if (progressionRecordOrIslandIndex && typeof progressionRecordOrIslandIndex === 'object') {
            const islandIndex = Number.isFinite(progressionRecordOrIslandIndex.islandIndex)
                ? Math.max(1, Math.floor(progressionRecordOrIslandIndex.islandIndex))
                : 1;
            const mandatory = {
                resources: normalizeStringList(progressionRecordOrIslandIndex.craftNeedMandatoryResources),
                branches: normalizeStringList(progressionRecordOrIslandIndex.craftNeedMandatoryBranches)
            };
            const recommended = {
                resources: normalizeStringList(progressionRecordOrIslandIndex.craftNeedRecommendedResources),
                branches: normalizeStringList(progressionRecordOrIslandIndex.craftNeedRecommendedBranches)
            };
            const optional = {
                resources: normalizeStringList(progressionRecordOrIslandIndex.craftNeedOptionalResources),
                branches: normalizeStringList(progressionRecordOrIslandIndex.craftNeedOptionalBranches)
            };

            if (
                progressionRecordOrIslandIndex.craftNeedWindowId
                || mandatory.resources.length
                || mandatory.branches.length
                || recommended.resources.length
                || recommended.branches.length
                || optional.resources.length
                || optional.branches.length
            ) {
                return {
                    islandIndex,
                    windowId: progressionRecordOrIslandIndex.craftNeedWindowId || '',
                    focus: progressionRecordOrIslandIndex.craftNeedFocus || '',
                    rule: progressionRecordOrIslandIndex.craftNeedRule || '',
                    avoid: progressionRecordOrIslandIndex.craftNeedAvoid || '',
                    mandatory,
                    recommended,
                    optional
                };
            }

            return buildFallbackNeedWindow(islandIndex);
        }

        const islandIndex = Math.max(1, Math.floor(Number(progressionRecordOrIslandIndex) || game.state.currentIslandIndex || 1));
        return buildFallbackNeedWindow(islandIndex);
    }

    function resolveCraftRequirementPhaseId(islandIndex) {
        const normalizedIslandIndex = Math.max(1, Math.floor(Number(islandIndex) || 1));

        if (normalizedIslandIndex <= 3) {
            return CRAFT_REQUIREMENT_PHASES.survival;
        }

        if (normalizedIslandIndex <= 15) {
            return CRAFT_REQUIREMENT_PHASES.bridge;
        }

        return CRAFT_REQUIREMENT_PHASES.advanced;
    }

    function getCraftRequirementPhaseLabels(phaseId) {
        switch (phaseId) {
        case CRAFT_REQUIREMENT_PHASES.survival:
            return {
                phaseLabel: 'Раннее выживание',
                summaryLabel: 'вода и еда',
                headline: 'вода и еда'
            };
        case CRAFT_REQUIREMENT_PHASES.bridge:
            return {
                phaseLabel: 'Маршрут и мосты',
                summaryLabel: 'мосты и маршрут',
                headline: 'мосты и маршрутные заготовки'
            };
        case CRAFT_REQUIREMENT_PHASES.advanced:
        default:
            return {
                phaseLabel: 'Поздняя логистика',
                summaryLabel: 'лодка, ремонт и сильные расходники',
                headline: 'лодка, ремонт и сильные расходники'
            };
        }
    }

    function getIslandCraftRequirementSummary(progressionRecordOrIslandIndex) {
        const needWindow = resolveNeedWindow(progressionRecordOrIslandIndex);
        const islandIndex = Number.isFinite(progressionRecordOrIslandIndex && progressionRecordOrIslandIndex.islandIndex)
            ? Math.max(1, Math.floor(progressionRecordOrIslandIndex.islandIndex))
            : (needWindow && Number.isFinite(needWindow.islandIndex)
                ? Math.max(1, Math.floor(needWindow.islandIndex))
                : Math.max(1, Math.floor(Number(progressionRecordOrIslandIndex) || game.state.currentIslandIndex || 1)));
        const phaseId = resolveCraftRequirementPhaseId(islandIndex);
        const phaseLabels = getCraftRequirementPhaseLabels(phaseId);
        const mandatoryResources = normalizeStringList(needWindow && needWindow.mandatory ? needWindow.mandatory.resources : []);
        const mandatoryBranches = normalizeStringList(needWindow && needWindow.mandatory ? needWindow.mandatory.branches : []);
        const recommendedResources = normalizeStringList(needWindow && needWindow.recommended ? needWindow.recommended.resources : []);
        const recommendedBranches = normalizeStringList(needWindow && needWindow.recommended ? needWindow.recommended.branches : []);
        const optionalResources = normalizeStringList(needWindow && needWindow.optional ? needWindow.optional.resources : []);
        const optionalBranches = normalizeStringList(needWindow && needWindow.optional ? needWindow.optional.branches : []);

        return {
            islandIndex,
            windowId: needWindow && typeof needWindow.windowId === 'string' ? needWindow.windowId : '',
            focus: needWindow && typeof needWindow.focus === 'string' ? needWindow.focus : '',
            rule: needWindow && typeof needWindow.rule === 'string' ? needWindow.rule : '',
            avoid: needWindow && typeof needWindow.avoid === 'string' ? needWindow.avoid : '',
            phaseId,
            phaseLabel: phaseLabels.phaseLabel,
            summaryLabel: phaseLabels.summaryLabel,
            headline: phaseLabels.headline,
            mandatoryResources,
            mandatoryBranches,
            recommendedResources,
            recommendedBranches,
            optionalResources,
            optionalBranches,
            requiresWaterFood: phaseId === CRAFT_REQUIREMENT_PHASES.survival,
            requiresBridgeLayer: phaseId === CRAFT_REQUIREMENT_PHASES.bridge,
            requiresAdvancedLogistics: phaseId === CRAFT_REQUIREMENT_PHASES.advanced
        };
    }

    function decorateProgressionWithCraftRequirements(progressionRecord) {
        if (!progressionRecord || !Number.isFinite(progressionRecord.islandIndex)) {
            return progressionRecord || null;
        }

        const summary = getIslandCraftRequirementSummary(progressionRecord);

        Object.assign(progressionRecord, {
            craftNeedWindowId: summary.windowId,
            craftNeedFocus: summary.focus,
            craftNeedRule: summary.rule,
            craftNeedAvoid: summary.avoid,
            craftNeedMandatoryResources: cloneValue(summary.mandatoryResources),
            craftNeedMandatoryBranches: cloneValue(summary.mandatoryBranches),
            craftNeedRecommendedResources: cloneValue(summary.recommendedResources),
            craftNeedRecommendedBranches: cloneValue(summary.recommendedBranches),
            craftNeedOptionalResources: cloneValue(summary.optionalResources),
            craftNeedOptionalBranches: cloneValue(summary.optionalBranches),
            craftRequirementPhaseId: summary.phaseId,
            craftRequirementPhaseLabel: summary.phaseLabel,
            craftRequirementSummary: summary.summaryLabel,
            craftRequirementHeadline: summary.headline
        });

        return progressionRecord;
    }

    function decorateIslandRecord(islandRecord) {
        if (islandRecord && islandRecord.progression) {
            decorateProgressionWithCraftRequirements(islandRecord.progression);
        }

        return islandRecord || null;
    }

    function markArchipelagoReadyIfComplete() {
        if (nextIslandIndexToBuild > finalIslandIndex) {
            archipelagoReady = true;
        }
    }

    function buildNextIsland() {
        if (archipelagoReady || nextIslandIndexToBuild > finalIslandIndex) {
            archipelagoReady = true;
            return null;
        }

        const islandIndex = nextIslandIndexToBuild;
        nextIslandIndexToBuild += 1;

        const island = islandLayout.buildPlacedIsland(islandIndex, previousIsland, occupiedChunkKeys);

        if (!island) {
            archipelagoReady = true;
            return null;
        }

        island.chunks.forEach((chunk) => {
            const key = chunkKey(chunk.chunkX, chunk.chunkY);
            occupiedChunkKeys.add(key);
            islandChunkMap.set(key, chunk);
        });

        islandMap.set(islandIndex, island);
        previousIsland = island;
        markArchipelagoReadyIfComplete();
        return island;
    }

    function ensureArchipelagoUpTo(targetIslandIndex = finalIslandIndex) {
        const normalizedTarget = Math.max(1, Math.min(finalIslandIndex, Math.floor(targetIslandIndex || finalIslandIndex)));

        while (!archipelagoReady && nextIslandIndexToBuild <= normalizedTarget) {
            if (!buildNextIsland()) {
                break;
            }
        }
    }

    function ensureArchipelagoContainsChunk(chunkX, chunkY) {
        const key = chunkKey(chunkX, chunkY);

        if (islandChunkMap.has(key)) {
            return islandChunkMap.get(key) || null;
        }

        while (!archipelagoReady) {
            if (!buildNextIsland()) {
                break;
            }

            if (islandChunkMap.has(key)) {
                return islandChunkMap.get(key) || null;
            }
        }

        return islandChunkMap.get(key) || null;
    }

    function ensureArchipelago() {
        ensureArchipelagoUpTo(finalIslandIndex);
    }

    function ensureIslandConnectivity(islandIndex) {
        if (!Number.isFinite(islandIndex)) {
            return;
        }

        const normalizedIslandIndex = Math.max(1, Math.min(finalIslandIndex, Math.floor(islandIndex)));
        const connectivityTarget = normalizedIslandIndex >= finalIslandIndex
            ? normalizedIslandIndex
            : normalizedIslandIndex + 1;

        ensureArchipelagoUpTo(connectivityTarget);
    }

    function resetArchipelago() {
        islandMap.clear();
        islandChunkMap.clear();
        occupiedChunkKeys.clear();
        nextIslandIndexToBuild = 1;
        previousIsland = null;
        archipelagoReady = false;
        archipelagoMetadataCache = null;

        if (typeof islandLayout.resetLayoutState === 'function') {
            islandLayout.resetLayoutState();
        }
    }

    function peekIslandChunkRecord(chunkX, chunkY) {
        return islandChunkMap.get(chunkKey(chunkX, chunkY)) || null;
    }

    function getIslandChunkRecord(chunkX, chunkY) {
        const record = ensureArchipelagoContainsChunk(chunkX, chunkY);

        if (record) {
            ensureIslandConnectivity(record.islandIndex);
        }

        return islandChunkMap.get(chunkKey(chunkX, chunkY)) || record;
    }

    function getIslandRecord(islandIndex) {
        ensureIslandConnectivity(islandIndex);
        return decorateIslandRecord(islandMap.get(islandIndex) || null);
    }

    function buildIslandMetadata(islandRecord) {
        if (!islandRecord) {
            return null;
        }

        const progression = islandRecord.progression || {};

        return {
            islandIndex: islandRecord.islandIndex,
            label: progression.label || `Остров ${islandRecord.islandIndex}`,
            scenario: progression.scenario || '',
            archetype: progression.archetype || '',
            contourKind: progression.contourKind || '',
            craftPhaseLabel: progression.craftRequirementPhaseLabel || '',
            craftSummary: progression.craftRequirementSummary || '',
            chunkCount: Array.isArray(islandRecord.chunks) ? islandRecord.chunks.length : 0,
            hasVisited: Boolean(game.state.visitedIslandIds && game.state.visitedIslandIds[islandRecord.islandIndex])
        };
    }

    function getArchipelagoMetadata(options = {}) {
        if (archipelagoMetadataCache && !options.force) {
            return cloneValue(archipelagoMetadataCache);
        }

        ensureArchipelagoUpTo(finalIslandIndex);

        const metadata = [];

        for (let islandIndex = 1; islandIndex <= finalIslandIndex; islandIndex += 1) {
            const record = getIslandRecord(islandIndex);
            const entry = buildIslandMetadata(record);
            if (entry) {
                metadata.push(entry);
            }
        }

        archipelagoMetadataCache = metadata;
        return cloneValue(metadata);
    }

    function findChunkCenterLanding(chunkRecord) {
        if (!chunkRecord || !game.systems.world || typeof game.systems.world.getChunk !== 'function') {
            return null;
        }

        const chunk = game.systems.world.getChunk(chunkRecord.chunkX, chunkRecord.chunkY, { generateIfMissing: true });

        if (!chunk || !Array.isArray(chunk.data)) {
            return null;
        }

        const center = Math.floor(game.config.chunkSize / 2);
        const candidates = [];

        for (let localY = 0; localY < chunk.data.length; localY++) {
            for (let localX = 0; localX < chunk.data[localY].length; localX++) {
                const tileType = chunk.data[localY][localX];
                if (!game.systems.content.isPassableTile(tileType) || tileType === 'water') {
                    continue;
                }

                candidates.push({
                    x: chunkRecord.chunkX * game.config.chunkSize + localX,
                    y: chunkRecord.chunkY * game.config.chunkSize + localY,
                    distance: Math.abs(localX - center) + Math.abs(localY - center)
                });
            }
        }

        candidates.sort((left, right) => left.distance - right.distance);
        return candidates[0] || null;
    }

    function getIslandEntryTeleportTarget(islandIndex) {
        const record = getIslandRecord(islandIndex);
        if (!record) {
            return null;
        }

        if (record.entryChunkKeys instanceof Set && record.entryChunkKeys.size > 0) {
            const entryKey = Array.from(record.entryChunkKeys)[0];
            return findChunkCenterLanding(record.chunkMap.get(entryKey));
        }

        return findChunkCenterLanding(record.chunks && record.chunks[0]);
    }

    function fastTravelToIsland(islandIndex, options = {}) {
        const normalizedIslandIndex = Math.max(1, Math.min(finalIslandIndex, Math.floor(Number(islandIndex) || 1)));
        const target = getIslandEntryTeleportTarget(normalizedIslandIndex);

        if (!target) {
            return {
                success: false,
                message: `Не удалось найти точку входа для острова ${normalizedIslandIndex}.`
            };
        }

        game.state.route = [];
        game.state.routeTotalCost = 0;
        game.state.routePreviewLength = 0;
        game.state.routePreviewTotalCost = 0;
        game.state.routePreviewIsExact = true;
        game.state.isMoving = false;
        game.state.suppressFastTravelCosts = true;
        game.state.playerPos = { x: target.x, y: target.y };
        if (game.systems.world && typeof game.systems.world.updatePlayerContext === 'function') {
            game.systems.world.updatePlayerContext(game.state.playerPos);
        }

        const focusChunkX = Math.floor(target.x / game.config.chunkSize);
        const focusChunkY = Math.floor(target.y / game.config.chunkSize);
        const unloadRadius = Math.max(0, Math.max(game.config.viewDistance || 0, game.config.chunkUnloadDistance || 0));
        if (game.systems.world && typeof game.systems.world.unloadChunk === 'function') {
            Object.keys(game.state.loadedChunks || {}).forEach((key) => {
                const [chunkX, chunkY] = key.split(',').map(Number);
                if (
                    !Number.isFinite(chunkX)
                    || !Number.isFinite(chunkY)
                    || Math.abs(chunkX - focusChunkX) > unloadRadius
                    || Math.abs(chunkY - focusChunkY) > unloadRadius
                ) {
                    game.systems.world.unloadChunk(chunkX, chunkY);
                }
            });
        }
        const chunkCoordinates = [];
        for (let dx = -game.config.viewDistance; dx <= game.config.viewDistance; dx += 1) {
            for (let dy = -game.config.viewDistance; dy <= game.config.viewDistance; dy += 1) {
                chunkCoordinates.push({
                    chunkX: focusChunkX + dx,
                    chunkY: focusChunkY + dy
                });
            }
        }

        if (game.systems.chunkGenerator && typeof game.systems.chunkGenerator.prewarmChunks === 'function') {
            game.systems.chunkGenerator.prewarmChunks(chunkCoordinates, {
                detailLevel: 'base',
                priority: 'high'
            });
        } else if (game.systems.world && typeof game.systems.world.getChunk === 'function') {
            chunkCoordinates.forEach((entry) => {
                game.systems.world.getChunk(entry.chunkX, entry.chunkY, {
                    detailLevel: 'base',
                    queueDeferred: false,
                    priority: 'high'
                });
            });
        }

        const mapRuntime = game.systems.mapRuntime || null;
        if (mapRuntime && typeof mapRuntime.captureVisibleWorld === 'function') {
            mapRuntime.captureVisibleWorld(focusChunkX, focusChunkY);
        }

        const record = getIslandRecord(normalizedIslandIndex);
        const label = record && record.progression && record.progression.label
            ? record.progression.label
            : `Остров ${normalizedIslandIndex}`;

        return {
            success: true,
            message: `Перенос на ${label} выполнен.`,
            islandIndex: normalizedIslandIndex
        };
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
        return island && island.progression
            ? decorateProgressionWithCraftRequirements(island.progression)
            : null;
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
        const boatRuntime = game.systems.boatRuntime || null;
        const weatherRuntime = game.systems.weatherRuntime || null;
        const baseTileType = tileInfo.baseTileType || tileInfo.tileType;
        const canTraverseWaterByBoat = baseTileType === 'water'
            && boatRuntime
            && typeof boatRuntime.canTraverseTileInfo === 'function'
            && boatRuntime.canTraverseTileInfo(tileInfo);
        let multiplier = canTraverseWaterByBoat && typeof boatRuntime.getWaterTraversalMultiplier === 'function'
            ? boatRuntime.getWaterTraversalMultiplier(tileInfo)
            : (content ? content.getTileMovementFactor(baseTileType) : 1);
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
        const boatRuntime = game.systems.boatRuntime || null;
        const baseTileType = tileInfo.baseTileType || tileInfo.tileType;
        const canTraverseWaterByBoat = baseTileType === 'water'
            && boatRuntime
            && typeof boatRuntime.canTraverseTileInfo === 'function'
            && boatRuntime.canTraverseTileInfo(tileInfo);
        if (canTraverseWaterByBoat && typeof boatRuntime.getWaterTraversalBand === 'function') {
            return boatRuntime.getWaterTraversalBand(tileInfo) || 'normal';
        }
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
        const boatRuntime = game.systems.boatRuntime || null;
        const travelZoneKey = getTraversalZoneKey(tileInfo);
        const travelZoneDefinition = content ? content.getTravelZoneDefinition(travelZoneKey) : null;
        const baseTileType = tileInfo.baseTileType || tileInfo.tileType;
        const canTraverseWaterByBoat = baseTileType === 'water'
            && boatRuntime
            && typeof boatRuntime.canTraverseTileInfo === 'function'
            && boatRuntime.canTraverseTileInfo(tileInfo);

        if (canTraverseWaterByBoat && typeof boatRuntime.getWaterTraversalLabel === 'function') {
            return boatRuntime.getWaterTraversalLabel(tileInfo) || 'вода';
        }

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
        CRAFT_REQUIREMENT_PHASES,
        finalIslandIndex,
        decorateProgressionWithCraftRequirements,
        ensureArchipelago,
        getArchipelagoMetadata,
        getIslandCraftRequirementSummary,
        resetArchipelago,
        peekIslandChunkRecord,
        getIslandChunkRecord,
        getIslandRecord,
        getIslandEntryTeleportTarget,
        fastTravelToIsland,
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
        CRAFT_REQUIREMENT_PHASES,
        progression,
        decorateProgressionWithCraftRequirements,
        finalIslandIndex,
        ensureArchipelago,
        getArchipelagoMetadata,
        getIslandCraftRequirementSummary,
        resetArchipelago,
        peekIslandChunkRecord,
        getIslandChunkRecord,
        getIslandRecord,
        getIslandEntryTeleportTarget,
        fastTravelToIsland,
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
