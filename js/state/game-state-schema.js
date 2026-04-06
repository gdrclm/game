(() => {
    const stateSchema = window.Game.systems.stateSchema = window.Game.systems.stateSchema || {};
    const SAVE_VERSION = 5;

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function cloneValue(value) {
        if (Array.isArray(value)) {
            return value.map(cloneValue);
        }

        if (!isPlainObject(value)) {
            return value;
        }

        const result = {};
        Object.keys(value).forEach((key) => {
            result[key] = cloneValue(value[key]);
        });
        return result;
    }

    function mergeWithDefaults(defaultValue, providedValue) {
        if (providedValue === undefined) {
            return cloneValue(defaultValue);
        }

        if (Array.isArray(defaultValue)) {
            return Array.isArray(providedValue) ? providedValue.map(cloneValue) : cloneValue(defaultValue);
        }

        if (isPlainObject(defaultValue)) {
            if (!isPlainObject(providedValue)) {
                return cloneValue(defaultValue);
            }

            const result = {};
            const keys = new Set([
                ...Object.keys(defaultValue),
                ...Object.keys(providedValue)
            ]);

            keys.forEach((key) => {
                result[key] = mergeWithDefaults(defaultValue[key], providedValue[key]);
            });

            return result;
        }

        return cloneValue(providedValue);
    }

    function getDefaultPlayerPosition() {
        const center = Math.floor(window.Game.config.chunkSize / 2);
        return { x: center, y: center };
    }

    function createStarterInventory() {
        return [
            { id: 'ration', icon: 'SP', label: 'Сухпаёк', quantity: 1 },
            null,
            null,
            null,
            null,
            null,
            null,
            null
        ];
    }

    function createDefaultCraftingState() {
        return {
            resources: {},
            containers: {},
            knownRecipes: {},
            stationUnlocks: {},
            resourceNodesState: {},
            resourceNodeIslandState: {}
        };
    }

    function extractLegacyCraftingState(state = {}) {
        return {
            resources: state.resources,
            containers: state.containers,
            knownRecipes: state.knownRecipes,
            stationUnlocks: state.stationUnlocks,
            resourceNodesState: state.resourceNodesState,
            resourceNodeIslandState: state.resourceNodeIslandState
        };
    }

    function createDomainState() {
        return {
            meta: {
                saveVersion: SAVE_VERSION
            },
            player: {
                playerPos: getDefaultPlayerPosition(),
                playerFacing: 'south',
                playerProfile: {
                    name: 'Путешественник',
                    role: 'Исследователь архипелага'
                },
                stats: {
                    hunger: 84,
                    energy: 76,
                    sleep: 68,
                    cold: 72,
                    focus: 91
                },
                gold: 0,
                inventory: createStarterInventory(),
                unlockedInventorySlots: 4,
                selectedInventorySlot: null,
                stepsSinceAutoRest: 30
            },
            craftingState: createDefaultCraftingState(),
            world: {
                currentIslandIndex: 1,
                visitedIslandIds: { 1: true },
                highestIslandIndex: 1,
                resolvedHouseIds: {},
                tradedHouseIds: {},
                merchantStateByHouseId: {},
                courierJobsById: {},
                courierResultLog: [],
                placedBridgeKeys: {},
                collapsedBridgeKeys: {},
                weakenedBridgeKeys: {},
                harvestedTerrainKeys: {},
                islandPressureStepsByIndex: {},
                exploredMapTilesByKey: {},
                mapBookmarksByKey: {},
                groundItemsByKey: {},
                currentTimeOfDayIndex: 0,
                stepsSinceTimeOfDayChange: 0,
                timeOfDayAdvancesElapsed: 0
            },
            narrative: {
                activeDialogueId: null,
                activeDialogueNodeId: null,
                activeQuestIds: [],
                completedQuestIds: [],
                questStateById: {},
                npcStateByNpcId: {}
            },
            ui: {
                isPaused: false,
                isGameOver: false,
                hasWon: false,
                victoryMessage: '',
                lastActionMessage: '',
                openMerchantHouseId: null,
                isMapOpen: false,
                isInstructionsDismissed: false,
                isInventoryPanelCollapsed: false,
                isQuestPanelCollapsed: false,
                collapsedQuestEntryIds: {}
            },
            runtime: {
                route: [],
                routeTotalCost: 0,
                routePreviewLength: 0,
                routePreviewTotalCost: 0,
                selectedWorldTile: null,
                selectedWorldInteractionId: null,
                activeItemEffects: [],
                isMoving: false,
                stepProgress: 0,
                currentTargetIndex: 0,
                traversedStepsInPath: 0,
                animationRequestId: null,
                cameraAnimationRequestId: null,
                effectAnimationRequestId: null,
                lastFrameTime: null,
                loadedChunks: {},
                loadedChunkCount: 0,
                activeTileInfo: null,
                activeHouse: null,
                activeHouseId: null,
                activeInteraction: null,
                activeInteractionId: null,
                activeGroundItem: null,
                activeGroundItemId: null,
                transientEffects: [],
                criticalDepletionStepStreak: 0
            }
        };
    }

    function normalizeDomains(domains = {}) {
        const defaults = createDomainState();
        return {
            meta: mergeWithDefaults(defaults.meta, domains.meta || {}),
            player: mergeWithDefaults(defaults.player, domains.player || {}),
            craftingState: mergeWithDefaults(defaults.craftingState, domains.craftingState || {}),
            world: mergeWithDefaults(defaults.world, domains.world || {}),
            narrative: mergeWithDefaults(defaults.narrative, domains.narrative || {}),
            ui: mergeWithDefaults(defaults.ui, domains.ui || {}),
            runtime: mergeWithDefaults(defaults.runtime, domains.runtime || {})
        };
    }

    function splitStateByDomain(state = {}) {
        const defaults = createDomainState();

        return {
            meta: {
                saveVersion: typeof state.saveVersion === 'number'
                    ? state.saveVersion
                    : defaults.meta.saveVersion
            },
            player: {
                playerPos: mergeWithDefaults(defaults.player.playerPos, state.playerPos),
                playerFacing: typeof state.playerFacing === 'string'
                    ? state.playerFacing
                    : defaults.player.playerFacing,
                playerProfile: mergeWithDefaults(defaults.player.playerProfile, state.playerProfile),
                stats: mergeWithDefaults(defaults.player.stats, state.survivalStats),
                gold: typeof state.gold === 'number' ? state.gold : defaults.player.gold,
                inventory: mergeWithDefaults(defaults.player.inventory, state.inventory),
                unlockedInventorySlots: typeof state.unlockedInventorySlots === 'number'
                    ? state.unlockedInventorySlots
                    : defaults.player.unlockedInventorySlots,
                selectedInventorySlot: typeof state.selectedInventorySlot === 'number'
                    ? state.selectedInventorySlot
                    : defaults.player.selectedInventorySlot,
                stepsSinceAutoRest: typeof state.stepsSinceAutoRest === 'number'
                    ? state.stepsSinceAutoRest
                    : defaults.player.stepsSinceAutoRest
            },
            craftingState: mergeWithDefaults(
                defaults.craftingState,
                isPlainObject(state.craftingState)
                    ? state.craftingState
                    : extractLegacyCraftingState(state)
            ),
            world: {
                currentIslandIndex: typeof state.currentIslandIndex === 'number'
                    ? state.currentIslandIndex
                    : defaults.world.currentIslandIndex,
                visitedIslandIds: mergeWithDefaults(defaults.world.visitedIslandIds, state.visitedIslandIds),
                highestIslandIndex: typeof state.highestIslandIndex === 'number'
                    ? state.highestIslandIndex
                    : defaults.world.highestIslandIndex,
                resolvedHouseIds: mergeWithDefaults(defaults.world.resolvedHouseIds, state.resolvedHouseIds),
                tradedHouseIds: mergeWithDefaults(defaults.world.tradedHouseIds, state.tradedHouseIds),
                merchantStateByHouseId: mergeWithDefaults(defaults.world.merchantStateByHouseId, state.merchantStateByHouseId),
                courierJobsById: mergeWithDefaults(defaults.world.courierJobsById, state.courierJobsById),
                courierResultLog: mergeWithDefaults(defaults.world.courierResultLog, state.courierResultLog),
                placedBridgeKeys: mergeWithDefaults(
                    defaults.world.placedBridgeKeys,
                    state.placedBridgeKeys || state.placedBridgeTiles
                ),
                collapsedBridgeKeys: mergeWithDefaults(
                    defaults.world.collapsedBridgeKeys,
                    state.collapsedBridgeKeys || state.collapsedBridgeTiles
                ),
                weakenedBridgeKeys: mergeWithDefaults(defaults.world.weakenedBridgeKeys, state.weakenedBridgeKeys),
                harvestedTerrainKeys: mergeWithDefaults(defaults.world.harvestedTerrainKeys, state.harvestedTerrainKeys),
                islandPressureStepsByIndex: mergeWithDefaults(defaults.world.islandPressureStepsByIndex, state.islandPressureStepsByIndex),
                exploredMapTilesByKey: mergeWithDefaults(defaults.world.exploredMapTilesByKey, state.exploredMapTilesByKey),
                mapBookmarksByKey: mergeWithDefaults(defaults.world.mapBookmarksByKey, state.mapBookmarksByKey),
                groundItemsByKey: mergeWithDefaults(
                    defaults.world.groundItemsByKey,
                    state.groundItemsByKey || state.groundItemsByWorldKey
                ),
                currentTimeOfDayIndex: typeof state.currentTimeOfDayIndex === 'number'
                    ? state.currentTimeOfDayIndex
                    : defaults.world.currentTimeOfDayIndex,
                stepsSinceTimeOfDayChange: typeof state.stepsSinceTimeOfDayChange === 'number'
                    ? state.stepsSinceTimeOfDayChange
                    : defaults.world.stepsSinceTimeOfDayChange,
                timeOfDayAdvancesElapsed: typeof state.timeOfDayAdvancesElapsed === 'number'
                    ? state.timeOfDayAdvancesElapsed
                    : defaults.world.timeOfDayAdvancesElapsed
            },
            narrative: {
                activeDialogueId: typeof state.activeDialogueId === 'string'
                    ? state.activeDialogueId
                    : defaults.narrative.activeDialogueId,
                activeDialogueNodeId: typeof state.activeDialogueNodeId === 'string'
                    ? state.activeDialogueNodeId
                    : defaults.narrative.activeDialogueNodeId,
                activeQuestIds: mergeWithDefaults(defaults.narrative.activeQuestIds, state.activeQuestIds),
                completedQuestIds: mergeWithDefaults(defaults.narrative.completedQuestIds, state.completedQuestIds),
                questStateById: mergeWithDefaults(defaults.narrative.questStateById, state.questStateById),
                npcStateByNpcId: mergeWithDefaults(defaults.narrative.npcStateByNpcId, state.npcStateByNpcId)
            },
            ui: {
                isPaused: typeof state.isPaused === 'boolean' ? state.isPaused : defaults.ui.isPaused,
                isGameOver: typeof state.isGameOver === 'boolean' ? state.isGameOver : defaults.ui.isGameOver,
                hasWon: typeof state.hasWon === 'boolean' ? state.hasWon : defaults.ui.hasWon,
                victoryMessage: typeof state.victoryMessage === 'string'
                    ? state.victoryMessage
                    : defaults.ui.victoryMessage,
                lastActionMessage: typeof state.lastActionMessage === 'string'
                    ? state.lastActionMessage
                    : defaults.ui.lastActionMessage,
                openMerchantHouseId: typeof state.openMerchantHouseId === 'string'
                    ? state.openMerchantHouseId
                    : defaults.ui.openMerchantHouseId,
                isMapOpen: typeof state.isMapOpen === 'boolean'
                    ? state.isMapOpen
                    : defaults.ui.isMapOpen,
                isInstructionsDismissed: typeof state.isInstructionsDismissed === 'boolean'
                    ? state.isInstructionsDismissed
                    : defaults.ui.isInstructionsDismissed,
                isInventoryPanelCollapsed: typeof state.isInventoryPanelCollapsed === 'boolean'
                    ? state.isInventoryPanelCollapsed
                    : defaults.ui.isInventoryPanelCollapsed,
                isQuestPanelCollapsed: typeof state.isQuestPanelCollapsed === 'boolean'
                    ? state.isQuestPanelCollapsed
                    : defaults.ui.isQuestPanelCollapsed,
                collapsedQuestEntryIds: mergeWithDefaults(
                    defaults.ui.collapsedQuestEntryIds,
                    state.collapsedQuestEntryIds
                )
            },
            runtime: {
                route: mergeWithDefaults(defaults.runtime.route, state.route),
                routeTotalCost: typeof state.routeTotalCost === 'number'
                    ? state.routeTotalCost
                    : defaults.runtime.routeTotalCost,
                routePreviewLength: typeof state.routePreviewLength === 'number'
                    ? state.routePreviewLength
                    : defaults.runtime.routePreviewLength,
                routePreviewTotalCost: typeof state.routePreviewTotalCost === 'number'
                    ? state.routePreviewTotalCost
                    : defaults.runtime.routePreviewTotalCost,
                selectedWorldTile: state.selectedWorldTile ? cloneValue(state.selectedWorldTile) : defaults.runtime.selectedWorldTile,
                selectedWorldInteractionId: typeof state.selectedWorldInteractionId === 'string'
                    ? state.selectedWorldInteractionId
                    : defaults.runtime.selectedWorldInteractionId,
                isMoving: typeof state.isMoving === 'boolean' ? state.isMoving : defaults.runtime.isMoving,
                stepProgress: typeof state.stepProgress === 'number' ? state.stepProgress : defaults.runtime.stepProgress,
                currentTargetIndex: typeof state.currentTargetIndex === 'number'
                    ? state.currentTargetIndex
                    : defaults.runtime.currentTargetIndex,
                traversedStepsInPath: typeof state.traversedStepsInPath === 'number'
                    ? state.traversedStepsInPath
                    : defaults.runtime.traversedStepsInPath,
                animationRequestId: state.animationRequestId || defaults.runtime.animationRequestId,
                cameraAnimationRequestId: state.cameraAnimationRequestId || defaults.runtime.cameraAnimationRequestId,
                effectAnimationRequestId: state.effectAnimationRequestId || defaults.runtime.effectAnimationRequestId,
                lastFrameTime: typeof state.lastFrameTime === 'number'
                    ? state.lastFrameTime
                    : defaults.runtime.lastFrameTime,
                loadedChunks: mergeWithDefaults(defaults.runtime.loadedChunks, state.loadedChunks),
                loadedChunkCount: typeof state.loadedChunkCount === 'number'
                    ? state.loadedChunkCount
                    : defaults.runtime.loadedChunkCount,
                activeTileInfo: state.activeTileInfo ? cloneValue(state.activeTileInfo) : defaults.runtime.activeTileInfo,
                activeHouse: state.activeHouse ? cloneValue(state.activeHouse) : defaults.runtime.activeHouse,
                activeHouseId: typeof state.activeHouseId === 'string'
                    ? state.activeHouseId
                    : defaults.runtime.activeHouseId,
                activeInteraction: state.activeInteraction ? cloneValue(state.activeInteraction) : defaults.runtime.activeInteraction,
                activeInteractionId: typeof state.activeInteractionId === 'string'
                    ? state.activeInteractionId
                    : defaults.runtime.activeInteractionId,
                activeGroundItem: state.activeGroundItem ? cloneValue(state.activeGroundItem) : defaults.runtime.activeGroundItem,
                activeGroundItemId: typeof state.activeGroundItemId === 'string'
                    ? state.activeGroundItemId
                    : defaults.runtime.activeGroundItemId,
                activeItemEffects: mergeWithDefaults(defaults.runtime.activeItemEffects, state.activeItemEffects),
                transientEffects: mergeWithDefaults(defaults.runtime.transientEffects, state.transientEffects),
                criticalDepletionStepStreak: typeof state.criticalDepletionStepStreak === 'number'
                    ? state.criticalDepletionStepStreak
                    : defaults.runtime.criticalDepletionStepStreak
            }
        };
    }

    function createStateFromDomains(domains = createDomainState()) {
        const normalized = normalizeDomains(domains);

        return {
            saveVersion: normalized.meta.saveVersion,
            playerPos: normalized.player.playerPos,
            playerFacing: normalized.player.playerFacing,
            playerProfile: normalized.player.playerProfile,
            survivalStats: normalized.player.stats,
            gold: normalized.player.gold,
            inventory: normalized.player.inventory,
            unlockedInventorySlots: normalized.player.unlockedInventorySlots,
            selectedInventorySlot: normalized.player.selectedInventorySlot,
            stepsSinceAutoRest: normalized.player.stepsSinceAutoRest,
            craftingState: normalized.craftingState,
            currentIslandIndex: normalized.world.currentIslandIndex,
            visitedIslandIds: normalized.world.visitedIslandIds,
            highestIslandIndex: normalized.world.highestIslandIndex,
            resolvedHouseIds: normalized.world.resolvedHouseIds,
            tradedHouseIds: normalized.world.tradedHouseIds,
            merchantStateByHouseId: normalized.world.merchantStateByHouseId,
            courierJobsById: normalized.world.courierJobsById,
            courierResultLog: normalized.world.courierResultLog,
            placedBridgeKeys: normalized.world.placedBridgeKeys,
            collapsedBridgeKeys: normalized.world.collapsedBridgeKeys,
            weakenedBridgeKeys: normalized.world.weakenedBridgeKeys,
            harvestedTerrainKeys: normalized.world.harvestedTerrainKeys,
            islandPressureStepsByIndex: normalized.world.islandPressureStepsByIndex,
            exploredMapTilesByKey: normalized.world.exploredMapTilesByKey,
            mapBookmarksByKey: normalized.world.mapBookmarksByKey,
            groundItemsByKey: normalized.world.groundItemsByKey,
            currentTimeOfDayIndex: normalized.world.currentTimeOfDayIndex,
            stepsSinceTimeOfDayChange: normalized.world.stepsSinceTimeOfDayChange,
            timeOfDayAdvancesElapsed: normalized.world.timeOfDayAdvancesElapsed,
            activeDialogueId: normalized.narrative.activeDialogueId,
            activeDialogueNodeId: normalized.narrative.activeDialogueNodeId,
            activeQuestIds: normalized.narrative.activeQuestIds,
            completedQuestIds: normalized.narrative.completedQuestIds,
            questStateById: normalized.narrative.questStateById,
            npcStateByNpcId: normalized.narrative.npcStateByNpcId,
            isPaused: normalized.ui.isPaused,
            isGameOver: normalized.ui.isGameOver,
            hasWon: normalized.ui.hasWon,
            victoryMessage: normalized.ui.victoryMessage,
            lastActionMessage: normalized.ui.lastActionMessage,
            openMerchantHouseId: normalized.ui.openMerchantHouseId,
            isMapOpen: normalized.ui.isMapOpen,
            isInstructionsDismissed: normalized.ui.isInstructionsDismissed,
            isInventoryPanelCollapsed: normalized.ui.isInventoryPanelCollapsed,
            isQuestPanelCollapsed: normalized.ui.isQuestPanelCollapsed,
            route: normalized.runtime.route,
            routeTotalCost: normalized.runtime.routeTotalCost,
            routePreviewLength: normalized.runtime.routePreviewLength,
            routePreviewTotalCost: normalized.runtime.routePreviewTotalCost,
            selectedWorldTile: normalized.runtime.selectedWorldTile,
            selectedWorldInteractionId: normalized.runtime.selectedWorldInteractionId,
            isMoving: normalized.runtime.isMoving,
            stepProgress: normalized.runtime.stepProgress,
            currentTargetIndex: normalized.runtime.currentTargetIndex,
            traversedStepsInPath: normalized.runtime.traversedStepsInPath,
            animationRequestId: normalized.runtime.animationRequestId,
            cameraAnimationRequestId: normalized.runtime.cameraAnimationRequestId,
            effectAnimationRequestId: normalized.runtime.effectAnimationRequestId,
            lastFrameTime: normalized.runtime.lastFrameTime,
            loadedChunks: normalized.runtime.loadedChunks,
            loadedChunkCount: normalized.runtime.loadedChunkCount,
            activeTileInfo: normalized.runtime.activeTileInfo,
            activeHouse: normalized.runtime.activeHouse,
            activeHouseId: normalized.runtime.activeHouseId,
            activeInteraction: normalized.runtime.activeInteraction,
            activeInteractionId: normalized.runtime.activeInteractionId,
            activeGroundItem: normalized.runtime.activeGroundItem,
            activeGroundItemId: normalized.runtime.activeGroundItemId,
            activeItemEffects: normalized.runtime.activeItemEffects,
            transientEffects: normalized.runtime.transientEffects,
            criticalDepletionStepStreak: normalized.runtime.criticalDepletionStepStreak
        };
    }

    function createInitialState() {
        return createStateFromDomains(createDomainState());
    }

    function normalizeState(state = {}) {
        return createStateFromDomains(splitStateByDomain(state));
    }

    Object.assign(stateSchema, {
        SAVE_VERSION,
        cloneValue,
        createDomainState,
        createInitialState,
        createStateFromDomains,
        normalizeDomains,
        normalizeState,
        splitStateByDomain
    });
})();
