(() => {
    const game = window.Game;
    const itemEffects = game.systems.itemEffects = game.systems.itemEffects || {};
    const bridge = game.systems.uiBridge;

    if (!bridge) {
        return;
    }

    function getInventoryRuntime() {
        return game.systems.inventoryRuntime || null;
    }

    function getItemRegistry() {
        return game.systems.itemRegistry || game.systems.loot || null;
    }

    function getContainerRegistry() {
        return game.systems.containerRegistry || null;
    }

    function getInteractionsRuntime() {
        return game.systems.interactions || null;
    }

    function getGameEvents() {
        return game.systems.gameEvents || null;
    }

    function getWorld() {
        return game.systems.world || null;
    }

    function getMapRuntime() {
        return game.systems.mapRuntime || null;
    }

    function getExpedition() {
        return game.systems.expedition || null;
    }

    function getActiveEffectsState() {
        game.state.activeItemEffects = Array.isArray(game.state.activeItemEffects)
            ? game.state.activeItemEffects
            : [];
        return game.state.activeItemEffects;
    }

    function getItemDefinition(itemId) {
        const registry = getItemRegistry();
        return registry && typeof registry.getItemDefinition === 'function'
            ? registry.getItemDefinition(itemId)
            : null;
    }

    function cloneEffect(effect) {
        return effect ? {
            ...effect,
            ignoreTravelZones: normalizeIgnoredTravelZones(effect.ignoreTravelZones)
        } : null;
    }

    function normalizeIgnoredTravelZones(value) {
        if (Array.isArray(value)) {
            return value.slice();
        }

        if (value === true) {
            const content = game.systems.content || null;
            const registry = content && content.travelZoneRegistry ? content.travelZoneRegistry : {};
            return Object.keys(registry).filter((key) => key && key !== 'none');
        }

        return [];
    }

    function buildEmptyModifierSnapshot() {
        return {
            travelCostMultiplier: 1,
            longRouteTravelCostMultiplier: 1,
            roughTravelCostMultiplier: 1,
            bridgeTravelCostMultiplier: 1,
            recoveryMultiplier: 1,
            foodRecoveryMultiplier: 1,
            drainMultiplier: 1,
            merchantBuyMultiplier: 1,
            merchantSellMultiplier: 1,
            goldLootMultiplier: 1,
            chestLuck: 0,
            routeLengthBonus: 0,
            freeOpeningSteps: 0,
            chainTravelDiscount: 0,
            ignoreTravelZones: [],
            showHouseValue: false,
            synergyMultiplier: 1
        };
    }

    function combineModifierSnapshot(snapshot, modifier) {
        if (!modifier) {
            return snapshot;
        }

        const ignoredZones = new Set(snapshot.ignoreTravelZones || []);
        const multiplyKeys = [
            'travelCostMultiplier',
            'longRouteTravelCostMultiplier',
            'roughTravelCostMultiplier',
            'bridgeTravelCostMultiplier',
            'recoveryMultiplier',
            'foodRecoveryMultiplier',
            'drainMultiplier',
            'merchantBuyMultiplier',
            'merchantSellMultiplier',
            'goldLootMultiplier',
            'synergyMultiplier'
        ];
        const additiveKeys = [
            'chestLuck',
            'routeLengthBonus',
            'freeOpeningSteps',
            'chainTravelDiscount'
        ];

        multiplyKeys.forEach((key) => {
            if (Number.isFinite(modifier[key])) {
                snapshot[key] *= modifier[key];
            }
        });

        additiveKeys.forEach((key) => {
            if (Number.isFinite(modifier[key])) {
                snapshot[key] += modifier[key];
            }
        });

        if (modifier.showHouseValue) {
            snapshot.showHouseValue = true;
        }

        (modifier.ignoreTravelZones || []).forEach((zoneKey) => {
            if (zoneKey) {
                ignoredZones.add(zoneKey);
            }
        });
        snapshot.ignoreTravelZones = Array.from(ignoredZones);
        return snapshot;
    }

    function getConsumableEffectForUse(item) {
        const registry = getItemRegistry();
        const effect = item && registry && typeof registry.getConsumableEffect === 'function'
            ? registry.getConsumableEffect(item.id)
            : null;

        return effect ? { ...effect } : null;
    }

    function getActiveEffectForUse(item) {
        const definition = item && item.id ? getItemDefinition(item.id) : null;
        return definition && definition.activeEffect ? cloneEffect(definition.activeEffect) : null;
    }

    function applyInventoryConsumableEffect(effect, tileInfo = game.state.activeTileInfo) {
        if (!effect) {
            return {};
        }

        const { ignoreRecoveryScaling, allowPartialHunger, ...stats } = effect;
        const applied = {};
        const energySource = !ignoreRecoveryScaling && typeof stats.hunger === 'number' && stats.hunger > 0
            ? 'food'
            : 'general';

        Object.entries(stats).forEach(([key, value]) => {
            if (typeof value !== 'number' || value <= 0) {
                return;
            }

            if (key === 'hunger' && !allowPartialHunger) {
                const before = bridge.getStatValue('hunger');
                const after = bridge.setStatValue('hunger', 100);
                const actualGain = Math.max(0, after - before);

                if (actualGain > 0) {
                    applied.hunger = actualGain;
                }

                return;
            }

            const delta = bridge.getAdjustedRecoveryAmount(key, value, tileInfo, {
                ignoreRecoveryScaling,
                energySource
            });

            if (delta <= 0) {
                return;
            }

            const before = bridge.getStatValue(key);
            const after = bridge.setStatValue(key, before + delta);
            const actualGain = Math.max(0, after - before);

            if (actualGain > 0) {
                applied[key] = actualGain;
            }
        });

        bridge.ensureGameOverState();
        return applied;
    }

    function buildRewardEffectDrops(appliedRewards) {
        return Object.entries(appliedRewards || {})
            .filter(([, value]) => value > 0)
            .map(([key, value]) => ({
                type: 'stat',
                statKey: key,
                label: bridge.getStatLabel(key) || key,
                amount: value,
                icon: bridge.getStatEffectIcon(key) || '+'
            }));
    }

    function buildItemEffectDrop(item) {
        const inventoryRuntime = getInventoryRuntime();
        const normalizedItem = inventoryRuntime ? inventoryRuntime.normalizeInventoryItem(item) : item;

        if (!normalizedItem) {
            return null;
        }

        return {
            type: 'item',
            itemId: normalizedItem.id,
            label: normalizedItem.label,
            icon: normalizedItem.icon,
            quantity: Math.max(1, normalizedItem.quantity || 1)
        };
    }

    function buildGoldEffectDrop(amount) {
        return {
            type: 'gold',
            label: 'Золото',
            icon: '$',
            amount: Math.max(1, amount)
        };
    }

    function isBridgeBuilderItem(itemId) {
        const activeEffect = getActiveEffectForUse({ id: itemId });
        return Boolean(
            activeEffect && activeEffect.kind === 'bridgeBuilder'
        ) || itemId === 'ferryBoard' || itemId === 'roughBridge';
    }

    function getContainerStateForItem(itemOrId) {
        const itemId = itemOrId && typeof itemOrId === 'object'
            ? itemOrId.id
            : itemOrId;
        const containerRegistry = getContainerRegistry();
        return containerRegistry && typeof containerRegistry.getContainerStateByItemId === 'function'
            ? containerRegistry.getContainerStateByItemId(itemId)
            : null;
    }

    function getInteractionAtWorld(x, y) {
        const world = getWorld();
        const interactions = getInteractionsRuntime();
        const tileInfo = world && typeof world.getTileInfo === 'function'
            ? world.getTileInfo(x, y, { generateIfMissing: false })
            : null;

        if (tileInfo && tileInfo.interaction) {
            return tileInfo.interaction;
        }

        return interactions && typeof interactions.getInteractionAtWorld === 'function'
            ? interactions.getInteractionAtWorld(x, y, { generateIfMissing: false })
            : null;
    }

    function findNearbyWaterSourceInteraction() {
        const playerPos = game.state.playerPos || { x: 0, y: 0 };
        const selectedTile = game.state.selectedWorldTile || null;
        const positions = [
            { x: Math.round(playerPos.x), y: Math.round(playerPos.y) },
            { x: Math.round(playerPos.x) + 1, y: Math.round(playerPos.y) },
            { x: Math.round(playerPos.x) - 1, y: Math.round(playerPos.y) },
            { x: Math.round(playerPos.x), y: Math.round(playerPos.y) + 1 },
            { x: Math.round(playerPos.x), y: Math.round(playerPos.y) - 1 }
        ];

        if (selectedTile) {
            const selectedDistance = Math.abs(Math.round(selectedTile.x) - Math.round(playerPos.x)) + Math.abs(Math.round(selectedTile.y) - Math.round(playerPos.y));
            if (selectedDistance <= 1) {
                positions.unshift({
                    x: Math.round(selectedTile.x),
                    y: Math.round(selectedTile.y)
                });
            }
        }

        const seen = new Set();
        for (const position of positions) {
            const key = `${position.x},${position.y}`;
            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            const interaction = getInteractionAtWorld(position.x, position.y);
            if (interaction && interaction.kind === 'resourceNode' && interaction.resourceNodeKind === 'waterSource') {
                return interaction;
            }
        }

        return null;
    }

    function getActiveContainerFillContext(containerState) {
        if (!containerState || !containerState.id) {
            return null;
        }

        const containerRegistry = getContainerRegistry();
        const interactions = getInteractionsRuntime();
        const nearbyWaterSource = findNearbyWaterSourceInteraction();

        if (
            nearbyWaterSource
            && nearbyWaterSource.kind === 'resourceNode'
            && nearbyWaterSource.resourceNodeKind === 'waterSource'
        ) {
            const syncedInteraction = interactions && typeof interactions.syncResourceNodeInteractionState === 'function'
                ? interactions.syncResourceNodeInteractionState(nearbyWaterSource)
                : nearbyWaterSource;
            const targetStateId = containerRegistry && typeof containerRegistry.getFillTargetStateId === 'function'
                ? containerRegistry.getFillTargetStateId(containerState.id, 'waterSource')
                : '';

            if (
                targetStateId
                && syncedInteraction.nodeState !== 'depleted'
                && syncedInteraction.nodeState !== 'regenerating'
                && !syncedInteraction.islandLimitExhausted
            ) {
                return {
                    sourceKind: 'waterSource',
                    sourceLabel: syncedInteraction.label || 'точка воды',
                    targetStateId,
                    interaction: syncedInteraction
                };
            }
        }

        return null;
    }

    function getContainerUseContext(item) {
        const containerState = getContainerStateForItem(item);
        if (!containerState) {
            return null;
        }

        const fillContext = getActiveContainerFillContext(containerState);
        if (fillContext) {
            return {
                kind: 'fill',
                containerState,
                fillContext
            };
        }

        if (containerState.drinkable) {
            return {
                kind: 'drink',
                containerState
            };
        }

        return null;
    }

    function buildContainerTransformFailureMessage(targetLabel, reason) {
        if (reason === 'full') {
            return `В сумке нет места, чтобы получить "${targetLabel}". Освободи слот или собери такой же предмет в существующую стопку.`;
        }

        return `Не удалось получить "${targetLabel}".`;
    }

    function buildContainerNodeStateSummary(resourceNodeState) {
        if (!resourceNodeState) {
            return '';
        }

        if (resourceNodeState.nodeState === 'used') {
            return ` Источник надорван: осталось ${resourceNodeState.durabilityRemaining} из ${resourceNodeState.durabilityMax}.`;
        }

        if (resourceNodeState.nodeState === 'depleted') {
            return resourceNodeState.nodeStateReason === 'islandLimit' && resourceNodeState.islandLimitMax
                ? ` Лимит этого источника на острове исчерпан: ${resourceNodeState.islandLimitConsumed || resourceNodeState.islandLimitMax} из ${resourceNodeState.islandLimitMax}.`
                : ' Источник сейчас исчерпан.';
        }

        if (resourceNodeState.nodeState === 'regenerating') {
            return ' Источник ушёл в восстановление.';
        }

        return '';
    }

    function emitContainerGatherEvent(fillContext, targetState, resourceNodeState = null) {
        const gameEvents = getGameEvents();
        if (!gameEvents || typeof gameEvents.emitResourceGathered !== 'function') {
            return;
        }

        const sourceTile = fillContext && fillContext.interaction && Number.isFinite(fillContext.interaction.worldX) && Number.isFinite(fillContext.interaction.worldY)
            ? {
                x: fillContext.interaction.worldX,
                y: fillContext.interaction.worldY,
                tileType: fillContext.interaction.tileType || fillContext.interaction.baseTileType || ''
            }
            : (game.state.activeTileInfo
                ? {
                    x: game.state.activeTileInfo.x,
                    y: game.state.activeTileInfo.y,
                    tileType: game.state.activeTileInfo.tileType || game.state.activeTileInfo.baseTileType || ''
                }
                : null);

        gameEvents.emitResourceGathered({
            resourceId: 'water',
            resourceFamilyId: 'water',
            itemId: targetState && targetState.itemId ? targetState.itemId : '',
            quantity: 1,
            sourceLabel: fillContext && fillContext.sourceLabel ? fillContext.sourceLabel : 'источник воды',
            collectedLabel: targetState && targetState.label ? targetState.label : 'воду',
            tile: sourceTile,
            nodeStateAfter: resourceNodeState
                ? {
                    nodeState: resourceNodeState.nodeState,
                    durabilityRemaining: resourceNodeState.durabilityRemaining,
                    durabilityMax: resourceNodeState.durabilityMax
                }
                : null,
            gatherCost: null,
            gatherRisk: null,
            sourceKind: fillContext && fillContext.sourceKind ? fillContext.sourceKind : ''
        });
    }

    function useContainerItem(item) {
        const inventoryRuntime = getInventoryRuntime();
        const containerRegistry = getContainerRegistry();
        const selectedIndex = game.state.selectedInventorySlot;
        const useContext = getContainerUseContext(item);

        if (!useContext || !inventoryRuntime || typeof selectedIndex !== 'number') {
            return null;
        }

        const currentState = useContext.containerState;

        if (useContext.kind === 'fill') {
            const targetState = containerRegistry && typeof containerRegistry.getContainerStateDefinition === 'function'
                ? containerRegistry.getContainerStateDefinition(useContext.fillContext.targetStateId)
                : null;
            const targetDefinition = targetState && targetState.itemId ? getItemDefinition(targetState.itemId) : null;

            if (!targetState || !targetState.itemId) {
                return {
                    success: false,
                    message: 'Для этой фляги не найдено состояние наполнения.',
                    effectDrops: []
                };
            }

            const transformOutcome = typeof inventoryRuntime.transformInventoryItemAtIndex === 'function'
                ? inventoryRuntime.transformInventoryItemAtIndex(selectedIndex, targetState.itemId, 1, {
                    useCount: Math.max(0, item.useCount || 0) + 1
                })
                : { success: false, reason: 'unavailable', item: null };

            if (!transformOutcome.success) {
                return {
                    success: false,
                    message: buildContainerTransformFailureMessage(targetState.label || 'наполненная фляга', transformOutcome.reason),
                    effectDrops: []
                };
            }

            let resourceNodeState = null;
            const interactions = getInteractionsRuntime();
            if (
                useContext.fillContext.sourceKind === 'waterSource'
                && interactions
                && typeof interactions.consumeResourceNodeInteraction === 'function'
            ) {
                resourceNodeState = interactions.consumeResourceNodeInteraction(useContext.fillContext.interaction);
            }

            if (game.systems.world && typeof game.systems.world.updatePlayerContext === 'function') {
                game.systems.world.updatePlayerContext(game.state.playerPos);
            }

            emitContainerGatherEvent(useContext.fillContext, targetState, resourceNodeState);
            game.state.selectedInventorySlot = null;

            return {
                success: true,
                message: `Фляга набрана у "${useContext.fillContext.sourceLabel}": получена сырая вода.${buildContainerNodeStateSummary(resourceNodeState)}`,
                effectDrops: targetState
                    ? [buildItemEffectDrop({
                        id: targetState.itemId,
                        label: targetDefinition && targetDefinition.label ? targetDefinition.label : targetState.label,
                        icon: targetDefinition && targetDefinition.icon ? targetDefinition.icon : '?',
                        quantity: 1
                    })].filter(Boolean)
                    : []
            };
        }

        if (useContext.kind === 'drink') {
            const nextState = currentState.useTransitionStateId && containerRegistry && typeof containerRegistry.getContainerStateDefinition === 'function'
                ? containerRegistry.getContainerStateDefinition(currentState.useTransitionStateId)
                : null;
            const nextDefinition = nextState && nextState.itemId ? getItemDefinition(nextState.itemId) : null;

            if (!nextState || !nextState.itemId) {
                return {
                    success: false,
                    message: `Для "${item.label}" не найдено состояние пустого контейнера.`,
                    effectDrops: []
                };
            }

            const consumableEffect = getConsumableEffectForUse(item);
            const transformOutcome = typeof inventoryRuntime.transformInventoryItemAtIndex === 'function'
                ? inventoryRuntime.transformInventoryItemAtIndex(selectedIndex, nextState.itemId, 1, {
                    useCount: Math.max(0, item.useCount || 0) + 1
                })
                : { success: false, reason: 'unavailable', item: null };

            if (!transformOutcome.success) {
                return {
                    success: false,
                    message: buildContainerTransformFailureMessage(nextState.label || 'пустая фляга', transformOutcome.reason),
                    effectDrops: []
                };
            }

            const applied = consumableEffect ? applyInventoryConsumableEffect(consumableEffect) : {};
            game.state.selectedInventorySlot = null;
            const messageParts = [`Использован предмет "${item.label}". Фляга опустела.`];

            if (Object.keys(applied).length > 0) {
                messageParts.push(`Получено: ${bridge.describeAppliedRewards(applied)}.`);
            }

            return {
                success: true,
                message: messageParts.join(' '),
                applied,
                effectDrops: buildRewardEffectDrops(applied).concat(
                    nextState ? [buildItemEffectDrop({
                        id: nextState.itemId,
                        label: nextDefinition && nextDefinition.label ? nextDefinition.label : nextState.label,
                        icon: nextDefinition && nextDefinition.icon ? nextDefinition.icon : '?',
                        quantity: 1
                    })].filter(Boolean) : []
                )
            };
        }

        return null;
    }

    function canUseInventoryItem(item) {
        return Boolean(
            item
            && (
                getContainerUseContext(item)
                || getConsumableEffectForUse(item)
                || getActiveEffectForUse(item)
            )
        );
    }

    function getBuildDirectionCandidates() {
        const facing = game.state.playerFacing || 'south';
        const directionMap = {
            north: [{ dx: 0, dy: -1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }],
            south: [{ dx: 0, dy: 1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: -1 }],
            east: [{ dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }],
            west: [{ dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }],
            northEast: [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }],
            southEast: [{ dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 0, dy: -1 }],
            northWest: [{ dx: -1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }],
            southWest: [{ dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }]
        };

        return directionMap[facing] || directionMap.south;
    }

    function getBuildableBridgeTarget() {
        const playerTile = game.systems.world.getTileInfo(game.state.playerPos.x, game.state.playerPos.y, { generateIfMissing: false });

        if (!playerTile || playerTile.house) {
            return null;
        }

        const directionCandidates = getBuildDirectionCandidates();

        for (const direction of directionCandidates) {
            const waterTile = game.systems.world.getTileInfo(playerTile.x + direction.dx, playerTile.y + direction.dy, { generateIfMissing: false });

            if (!waterTile || waterTile.baseTileType !== 'water' || waterTile.house) {
                continue;
            }

            const landingTile = game.systems.world.getTileInfo(waterTile.x + direction.dx, waterTile.y + direction.dy, { generateIfMissing: false });

            if (!landingTile || landingTile.house) {
                continue;
            }

            if (!game.systems.content.isPassableTile(landingTile.tileType) || landingTile.baseTileType === 'water') {
                continue;
            }

            return waterTile;
        }

        return null;
    }

    function buildBridgeAtTarget(targetTile) {
        if (!targetTile) {
            return false;
        }

        if (!game.systems.expedition || !game.systems.expedition.placeBridgeAt(targetTile.x, targetTile.y)) {
            return false;
        }

        game.systems.world.updatePlayerContext(game.state.playerPos);
        return true;
    }

    function normalizeStoredEffect(record) {
        return {
            id: record.id || `${record.kind}:${Date.now()}:${Math.random()}`,
            kind: record.kind,
            label: record.label || '',
            islandIndex: Number.isFinite(record.islandIndex) ? record.islandIndex : game.state.currentIslandIndex,
            remainingSteps: Number.isFinite(record.remainingSteps) ? record.remainingSteps : null,
            freeSteps: Number.isFinite(record.freeSteps) ? record.freeSteps : 0,
            discountMultiplier: Number.isFinite(record.discountMultiplier) ? record.discountMultiplier : null,
            travelCostMultiplier: Number.isFinite(record.travelCostMultiplier) ? record.travelCostMultiplier : null,
            drainMultiplier: Number.isFinite(record.drainMultiplier) ? record.drainMultiplier : null,
            recoveryMultiplier: Number.isFinite(record.recoveryMultiplier) ? record.recoveryMultiplier : null,
            foodRecoveryMultiplier: Number.isFinite(record.foodRecoveryMultiplier) ? record.foodRecoveryMultiplier : null,
            ignoreTravelZones: normalizeIgnoredTravelZones(record.ignoreTravelZones),
            charges: Number.isFinite(record.charges) ? record.charges : 0,
            preventEmpty: Boolean(record.preventEmpty),
            duplicateBestDrop: Boolean(record.duplicateBestDrop),
            extraRolls: Number.isFinite(record.extraRolls) ? record.extraRolls : 0
        };
    }

    function addActiveEffect(record) {
        const normalized = normalizeStoredEffect(record);
        getActiveEffectsState().push(normalized);
        return normalized;
    }

    function pruneExpiredEffects(currentIslandIndex = game.state.currentIslandIndex) {
        const effects = getActiveEffectsState();
        const nextEffects = effects.filter((effect) => {
            if (!effect || !effect.kind) {
                return false;
            }

            if (effect.kind === 'islandBuff') {
                return effect.islandIndex === currentIslandIndex;
            }

            if (effect.kind === 'travelBuff') {
                const remainingSteps = Number.isFinite(effect.remainingSteps) ? effect.remainingSteps : 0;
                const freeSteps = Number.isFinite(effect.freeSteps) ? effect.freeSteps : 0;
                const hasModifier = Number.isFinite(effect.discountMultiplier) || effect.ignoreTravelZones.length > 0;
                return (remainingSteps > 0 || freeSteps > 0) && (hasModifier || freeSteps > 0);
            }

            if (effect.kind === 'bridgeBuilder' || effect.kind === 'trapWard') {
                return (effect.charges || 0) > 0;
            }

            if (effect.kind === 'nextChestBuff') {
                return effect.preventEmpty || effect.duplicateBestDrop || (effect.extraRolls || 0) > 0;
            }

            return false;
        });

        game.state.activeItemEffects = nextEffects;
        return nextEffects;
    }

    function getModifierSnapshot(context = {}) {
        const registry = getItemRegistry();
        const currentIslandIndex = Number.isFinite(context.currentIslandIndex)
            ? context.currentIslandIndex
            : game.state.currentIslandIndex;
        const routeStepIndex = Number.isFinite(context.routeStepIndex)
            ? Math.max(1, context.routeStepIndex)
            : 1;
        const snapshot = registry && typeof registry.getCurrentModifierSnapshot === 'function'
            ? registry.getCurrentModifierSnapshot(context)
            : buildEmptyModifierSnapshot();

        pruneExpiredEffects(currentIslandIndex).forEach((effect) => {
            if (!effect) {
                return;
            }

            if (effect.kind === 'islandBuff' && effect.islandIndex === currentIslandIndex) {
                combineModifierSnapshot(snapshot, effect);
                return;
            }

            if (effect.kind === 'travelBuff') {
                const activeForStep = !Number.isFinite(effect.remainingSteps) || routeStepIndex <= effect.remainingSteps;

                if (!activeForStep) {
                    return;
                }

                if (Number.isFinite(effect.discountMultiplier)) {
                    snapshot.travelCostMultiplier *= effect.discountMultiplier;
                }

                if (Array.isArray(effect.ignoreTravelZones) && effect.ignoreTravelZones.length > 0) {
                    combineModifierSnapshot(snapshot, { ignoreTravelZones: effect.ignoreTravelZones });
                }

                if (Number.isFinite(effect.freeSteps) && effect.freeSteps > 0) {
                    snapshot.freeOpeningSteps += effect.freeSteps;
                }
            }
        });

        return snapshot;
    }

    function getBridgeBuilderCharges() {
        return pruneExpiredEffects().reduce((sum, effect) => {
            if (effect.kind !== 'bridgeBuilder') {
                return sum;
            }
            return sum + Math.max(0, effect.charges || 0);
        }, 0);
    }

    function consumeBridgeBuilderCharge() {
        const effects = pruneExpiredEffects();

        for (const effect of effects) {
            if (effect.kind !== 'bridgeBuilder' || (effect.charges || 0) <= 0) {
                continue;
            }

            effect.charges -= 1;
            pruneExpiredEffects();
            return true;
        }

        return false;
    }

    function canUseBridgeCharge() {
        return getBridgeBuilderCharges() > 0 && Boolean(getBuildableBridgeTarget());
    }

    function useBridgeCharge() {
        const targetTile = getBuildableBridgeTarget();

        if (!targetTile) {
            return {
                success: false,
                message: 'Рядом нет подходящего узкого водного прохода для мостового набора.',
                effectDrops: []
            };
        }

        if (!consumeBridgeBuilderCharge() || !buildBridgeAtTarget(targetTile)) {
            return {
                success: false,
                message: 'Не удалось израсходовать мостовой заряд.',
                effectDrops: []
            };
        }

        return {
            success: true,
            message: `Уложена ещё одна клетка моста. Осталось зарядов: ${getBridgeBuilderCharges()}.`,
            effectDrops: []
        };
    }

    function consumeTravelStep() {
        pruneExpiredEffects().forEach((effect) => {
            if (effect.kind !== 'travelBuff') {
                return;
            }

            if (Number.isFinite(effect.remainingSteps) && effect.remainingSteps > 0) {
                effect.remainingSteps -= 1;
            }

            if (Number.isFinite(effect.freeSteps) && effect.freeSteps > 0) {
                effect.freeSteps -= 1;
            }
        });

        pruneExpiredEffects();
    }

    function getTrapWardCharges() {
        return pruneExpiredEffects().reduce((sum, effect) => {
            if (effect.kind !== 'trapWard') {
                return sum;
            }
            return sum + Math.max(0, effect.charges || 0);
        }, 0);
    }

    function consumeTrapWardCharge() {
        const effects = pruneExpiredEffects();

        for (const effect of effects) {
            if (effect.kind !== 'trapWard' || (effect.charges || 0) <= 0) {
                continue;
            }

            effect.charges -= 1;
            pruneExpiredEffects();
            return true;
        }

        return false;
    }

    function consumeNextChestBuffs() {
        const effects = pruneExpiredEffects();
        const summary = {
            preventEmpty: false,
            duplicateBestDrop: false,
            extraRolls: 0
        };
        const remaining = [];

        effects.forEach((effect) => {
            if (effect.kind !== 'nextChestBuff') {
                remaining.push(effect);
                return;
            }

            summary.preventEmpty = summary.preventEmpty || Boolean(effect.preventEmpty);
            summary.duplicateBestDrop = summary.duplicateBestDrop || Boolean(effect.duplicateBestDrop);
            summary.extraRolls += Math.max(0, effect.extraRolls || 0);
        });

        game.state.activeItemEffects = remaining;
        return summary;
    }

    function applyChestBuffsToLootPlan(lootPlan) {
        if (!lootPlan || !Array.isArray(lootPlan.drops) || !lootPlan.chestTier) {
            return lootPlan;
        }

        const buffs = consumeNextChestBuffs();
        const nextPlan = {
            ...lootPlan,
            drops: lootPlan.drops.map((drop) => ({ ...drop })),
            rewardDelta: lootPlan.rewardDelta ? { ...lootPlan.rewardDelta } : {},
            statDelta: lootPlan.statDelta ? { ...lootPlan.statDelta } : {}
        };

        if (buffs.preventEmpty && nextPlan.drops.length === 0) {
            nextPlan.drops.push(buildGoldEffectDrop(Math.max(8, 6 + (nextPlan.islandIndex || game.state.currentIslandIndex) * 2)));
            nextPlan.outcomeType = 'reward';
        }

        if (buffs.extraRolls > 0 && nextPlan.drops.length > 0) {
            const sortedDrops = nextPlan.drops.slice().sort((left, right) => {
                const leftValue = left.type === 'gold' ? (left.amount || 0) : 1;
                const rightValue = right.type === 'gold' ? (right.amount || 0) : 1;
                return rightValue - leftValue;
            });

            for (let index = 0; index < buffs.extraRolls; index++) {
                nextPlan.drops.push({ ...sortedDrops[index % sortedDrops.length] });
            }
        }

        if (buffs.duplicateBestDrop && nextPlan.drops.length > 0) {
            const duplicateSource = nextPlan.drops.slice().sort((left, right) => {
                const leftValue = left.type === 'gold' ? (left.amount || 0) : 1;
                const rightValue = right.type === 'gold' ? (right.amount || 0) : 1;
                return rightValue - leftValue;
            })[0];

            if (duplicateSource) {
                nextPlan.drops.push({ ...duplicateSource });
            }
        }

        return nextPlan;
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

    function getCurrentIslandRecord() {
        const expedition = getExpedition();
        return expedition && typeof expedition.getIslandRecord === 'function'
            ? expedition.getIslandRecord(game.state.currentIslandIndex)
            : null;
    }

    function findSafeTeleportTarget() {
        const island = getCurrentIslandRecord();
        if (!island || !Array.isArray(island.chunks)) {
            return null;
        }

        const safeChunk = island.chunks.find((chunkRecord) => Array.isArray(chunkRecord.houseProfiles) && chunkRecord.houseProfiles.some((profile) => profile && (
            profile.kind === 'shelter' || profile.kind === 'well' || profile.kind === 'forage' || profile.kind === 'merchant' || profile.kind === 'artisan'
        )));

        return findChunkCenterLanding(safeChunk || island.chunks[0]);
    }

    function findEntryTeleportTarget() {
        const island = getCurrentIslandRecord();
        if (!island || !(island.entryChunkKeys instanceof Set) || island.entryChunkKeys.size === 0) {
            return null;
        }

        const entryKey = Array.from(island.entryChunkKeys)[0];
        return findChunkCenterLanding(island.chunkMap.get(entryKey));
    }

    function teleportPlayer(target, label) {
        if (!target) {
            return {
                success: false,
                message: `Не удалось найти точку для эффекта "${label}".`,
                effectDrops: []
            };
        }

        game.state.route = [];
        game.state.routeTotalCost = 0;
        game.state.routePreviewLength = 0;
        game.state.routePreviewTotalCost = 0;
        game.state.isMoving = false;
        game.state.playerPos = { x: target.x, y: target.y };
        game.systems.world.updatePlayerContext(game.state.playerPos);

        const mapRuntime = getMapRuntime();
        if (mapRuntime && typeof mapRuntime.captureVisibleWorld === 'function') {
            const focusChunkX = Math.floor(target.x / game.config.chunkSize);
            const focusChunkY = Math.floor(target.y / game.config.chunkSize);
            mapRuntime.captureVisibleWorld(focusChunkX, focusChunkY);
        }

        return {
            success: true,
            message: label,
            effectDrops: []
        };
    }

    function handleRevealMapEffect(activeEffect) {
        const mapRuntime = getMapRuntime();
        const island = getCurrentIslandRecord();

        if (!mapRuntime || !island) {
            return {
                success: false,
                message: 'Карту сейчас раскрыть не удалось.',
                effectDrops: []
            };
        }

        const chunkCount = island.chunks.length;
        let revealed = 0;

        if (activeEffect.mode === 'fullIsland') {
            revealed = mapRuntime.revealIslandByIndex(game.state.currentIslandIndex);
        } else if (activeEffect.mode === 'halfIsland') {
            revealed = mapRuntime.revealIslandByIndex(game.state.currentIslandIndex, {
                chunkLimit: Math.max(1, Math.ceil(chunkCount / 2))
            });
        } else {
            revealed = mapRuntime.revealIslandByIndex(game.state.currentIslandIndex, {
                chunkLimit: Math.min(chunkCount, 3)
            });
        }

        return {
            success: true,
            message: revealed > 0
                ? `Карта обновлена: открыто ${revealed} новых клеток текущего острова.`
                : 'Карта текущего острова уже разведана настолько, насколько это возможно этим предметом.',
            effectDrops: []
        };
    }

    function handleRevealMerchantEffect() {
        const mapRuntime = getMapRuntime();
        const revealed = mapRuntime && typeof mapRuntime.revealMerchantOnIsland === 'function'
            ? mapRuntime.revealMerchantOnIsland(game.state.currentIslandIndex)
            : 0;

        return {
            success: true,
            message: revealed > 0
                ? 'На карте отмечено местоположение торговца текущего острова.'
                : 'Торговец на этом острове уже найден или здесь его нет.',
            effectDrops: []
        };
    }

    function handleRevealBestHouseEffect() {
        const mapRuntime = getMapRuntime();
        const revealed = mapRuntime && typeof mapRuntime.revealBestHouseOnIsland === 'function'
            ? mapRuntime.revealBestHouseOnIsland(game.state.currentIslandIndex)
            : 0;

        return {
            success: true,
            message: revealed > 0
                ? 'На карте отмечена лучшая находка текущего острова.'
                : 'Подходящий ценный дом или сундук уже разведан.',
            effectDrops: []
        };
    }

    function handleCheapestRouteHint() {
        if (game.state.routePreviewLength > 0) {
            return {
                success: true,
                message: `Текущий маршрут уже пересчитан по полной стоимости: ${bridge.formatRouteCost(game.state.routePreviewTotalCost)} за ${game.state.routePreviewLength} клеток.`,
                effectDrops: []
            };
        }

        return {
            success: true,
            message: 'Кликни по цели, и стоимость пути будет пересчитана с учётом всех модификаторов маршрута.',
            effectDrops: []
        };
    }

    function handleClearTravelPenalty() {
        const currentIslandIndex = Math.max(1, game.state.currentIslandIndex || 1);
        game.state.islandPressureStepsByIndex = game.state.islandPressureStepsByIndex || {};
        game.state.islandPressureStepsByIndex[currentIslandIndex] = Math.max(
            0,
            (game.state.islandPressureStepsByIndex[currentIslandIndex] || 0) - 7
        );
        game.state.criticalDepletionStepStreak = 0;
        game.state.activeItemEffects = pruneExpiredEffects().filter((effect) => {
            if (effect.kind !== 'travelBuff' && effect.kind !== 'islandBuff') {
                return true;
            }

            const isNegativeTravel = Number.isFinite(effect.discountMultiplier) && effect.discountMultiplier > 1;
            const isNegativeIsland = Number.isFinite(effect.travelCostMultiplier) && effect.travelCostMultiplier > 1;
            const isNegativeDrain = Number.isFinite(effect.drainMultiplier) && effect.drainMultiplier > 1;
            return !(isNegativeTravel || isNegativeIsland || isNegativeDrain);
        });

        return {
            success: true,
            message: 'Дорожные штрафы частично сброшены, а местная нагрузка острова стала мягче.',
            effectDrops: []
        };
    }

    function activateEffectFromItem(item, activeEffect) {
        if (!activeEffect) {
            return {
                success: false,
                message: '',
                effectDrops: [],
                consumeItem: false
            };
        }

        if (activeEffect.kind === 'travelBuff') {
            const freeSteps = Math.max(0, activeEffect.freeSteps || 0);
            const messageParts = [];

            if (freeSteps > 0) {
                messageParts.push(`Следующие ${freeSteps} шагов бесплатны.`);
            }

            if (Number.isFinite(activeEffect.discountMultiplier) && activeEffect.discountMultiplier < 1) {
                const savedPercent = Math.round((1 - activeEffect.discountMultiplier) * 100);
                const durationSteps = Number.isFinite(activeEffect.durationSteps) && activeEffect.durationSteps > 0
                    ? activeEffect.durationSteps
                    : null;
                messageParts.push(durationSteps
                    ? `Цена маршрута снижена на ${savedPercent}% на ${durationSteps} шагов.`
                    : `Цена маршрута снижена на ${savedPercent}%.`);
            }

            if (Array.isArray(activeEffect.ignoreTravelZones) && activeEffect.ignoreTravelZones.length > 0) {
                messageParts.push('Часть тяжёлых зон временно игнорируется.');
            }

            addActiveEffect({
                kind: 'travelBuff',
                label: activeEffect.label || item.label,
                remainingSteps: Number.isFinite(activeEffect.durationSteps)
                    ? activeEffect.durationSteps
                    : freeSteps,
                freeSteps,
                discountMultiplier: activeEffect.discountMultiplier,
                ignoreTravelZones: normalizeIgnoredTravelZones(activeEffect.ignoreTravelZones)
            });
            return {
                success: true,
                message: messageParts.join(' ') || `Активирован дорожный эффект "${item.label}".`,
                effectDrops: [],
                consumeItem: true
            };
        }

        if (activeEffect.kind === 'islandBuff') {
            addActiveEffect({
                kind: 'islandBuff',
                label: activeEffect.label || item.label,
                islandIndex: game.state.currentIslandIndex,
                travelCostMultiplier: activeEffect.travelCostMultiplier,
                drainMultiplier: activeEffect.drainMultiplier,
                recoveryMultiplier: activeEffect.recoveryMultiplier,
                foodRecoveryMultiplier: activeEffect.foodRecoveryMultiplier
            });
            return {
                success: true,
                message: `До конца острова активирован эффект "${activeEffect.label || item.label}".`,
                effectDrops: [],
                consumeItem: true
            };
        }

        if (activeEffect.kind === 'trapWard') {
            addActiveEffect({
                kind: 'trapWard',
                label: activeEffect.label || item.label,
                charges: Math.max(1, activeEffect.charges || 1)
            });
            return {
                success: true,
                message: `Получена защита от ловушек: ${Math.max(1, activeEffect.charges || 1)} заряд.`,
                effectDrops: [],
                consumeItem: true
            };
        }

        if (activeEffect.kind === 'nextChestBuff') {
            addActiveEffect({
                kind: 'nextChestBuff',
                label: activeEffect.label || item.label,
                extraRolls: Math.max(0, activeEffect.extraRolls || 0),
                preventEmpty: Boolean(activeEffect.preventEmpty),
                duplicateBestDrop: Boolean(activeEffect.duplicateBestDrop)
            });
            return {
                success: true,
                message: `Следующий сундук усилен эффектом "${item.label}".`,
                effectDrops: [],
                consumeItem: true
            };
        }

        if (activeEffect.kind === 'bridgeBuilder') {
            const totalCharges = Math.max(1, activeEffect.charges || 1);
            const targetTile = getBuildableBridgeTarget();
            let spentImmediately = 0;

            if (targetTile && buildBridgeAtTarget(targetTile)) {
                spentImmediately = 1;
            }

            if (totalCharges - spentImmediately > 0) {
                addActiveEffect({
                    kind: 'bridgeBuilder',
                    label: activeEffect.label || item.label,
                    charges: totalCharges - spentImmediately
                });
            }

            return {
                success: true,
                message: spentImmediately > 0
                    ? `Мостовой набор использован. Построено 1 клетка моста, в запасе осталось ${getBridgeBuilderCharges()} зарядов.`
                    : `Мостовой набор подготовлен. В запасе ${getBridgeBuilderCharges() + spentImmediately} зарядов для укладки мостов.`,
                effectDrops: [],
                consumeItem: true
            };
        }

        if (activeEffect.kind === 'revealMap') {
            return {
                ...handleRevealMapEffect(activeEffect),
                consumeItem: true
            };
        }

        if (activeEffect.kind === 'revealMerchant') {
            return {
                ...handleRevealMerchantEffect(),
                consumeItem: true
            };
        }

        if (activeEffect.kind === 'revealBestHouse') {
            return {
                ...handleRevealBestHouseEffect(),
                consumeItem: true
            };
        }

        if (activeEffect.kind === 'teleportToEntry') {
            return {
                ...teleportPlayer(findEntryTeleportTarget(), 'Перенос к входу острова выполнен.'),
                consumeItem: true
            };
        }

        if (activeEffect.kind === 'teleportToSafe') {
            return {
                ...teleportPlayer(findSafeTeleportTarget(), 'Перенос к безопасной точке острова выполнен.'),
                consumeItem: true
            };
        }

        if (activeEffect.kind === 'cheapestRouteHint') {
            return {
                ...handleCheapestRouteHint(),
                consumeItem: true
            };
        }

        if (activeEffect.kind === 'clearTravelPenalty') {
            return {
                ...handleClearTravelPenalty(),
                consumeItem: true
            };
        }

        return {
            success: false,
            message: '',
            effectDrops: [],
            consumeItem: false
        };
    }

    function useInventoryItem(item) {
        const inventoryRuntime = getInventoryRuntime();

        if (!item) {
            return {
                success: false,
                message: 'Выбранный слот пуст.',
                effectDrops: []
            };
        }

        const containerOutcome = useContainerItem(item);
        if (containerOutcome) {
            return containerOutcome;
        }

        const consumableEffect = getConsumableEffectForUse(item);
        const activeEffect = getActiveEffectForUse(item);
        const applied = consumableEffect ? applyInventoryConsumableEffect(consumableEffect) : {};
        const activationResult = activeEffect ? activateEffectFromItem(item, activeEffect) : null;
        const shouldConsume = Boolean(consumableEffect) || Boolean(activationResult && activationResult.consumeItem);
        const selectedIndex = game.state.selectedInventorySlot;

        if (shouldConsume && inventoryRuntime) {
            if (typeof selectedIndex === 'number') {
                inventoryRuntime.markInventoryItemUsed(selectedIndex);
            }
            inventoryRuntime.consumeSelectedInventoryItem(1);
        }

        if (consumableEffect || (activationResult && activationResult.success)) {
            game.state.selectedInventorySlot = null;
            const messageParts = [`Использован предмет "${item.label}".`];

            if (Object.keys(applied).length > 0) {
                messageParts.push(`Получено: ${bridge.describeAppliedRewards(applied)}.`);
            }

            if (activationResult && activationResult.message) {
                messageParts.push(activationResult.message);
            }

            return {
                success: true,
                message: messageParts.join(' '),
                applied,
                effectDrops: buildRewardEffectDrops(applied).concat(activationResult && activationResult.effectDrops ? activationResult.effectDrops : [])
            };
        }

        const registry = getItemRegistry();
        const description = registry && typeof registry.describeItem === 'function'
            ? registry.describeItem(item.id)
            : '';

        return {
            success: false,
            message: description || `Предмет "${item.label}" пока не имеет отдельного активного эффекта.`,
            effectDrops: []
        };
    }

    Object.assign(itemEffects, {
        getConsumableEffectForUse,
        getActiveEffectForUse,
        getModifierSnapshot,
        applyInventoryConsumableEffect,
        buildRewardEffectDrops,
        buildItemEffectDrop,
        buildGoldEffectDrop,
        isBridgeBuilderItem,
        canUseInventoryItem,
        getBuildDirectionCandidates,
        getBuildableBridgeTarget,
        getBridgeBuilderCharges,
        canUseBridgeCharge,
        useBridgeCharge,
        consumeTravelStep,
        getTrapWardCharges,
        consumeTrapWardCharge,
        consumeNextChestBuffs,
        applyChestBuffsToLootPlan,
        useInventoryItem
    });
})();
