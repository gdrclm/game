(() => {
    const game = window.Game;
    const actionUi = game.systems.actionUi = game.systems.actionUi || {};
    const bridge = game.systems.uiBridge;

    if (!bridge) {
        return;
    }

    function getInventoryRuntime() {
        return game.systems.inventoryRuntime || null;
    }

    function getItemEffects() {
        return game.systems.itemEffects || null;
    }

    function getDialogueRuntime() {
        return game.systems.dialogueRuntime || null;
    }

    function getResourceRegistry() {
        return game.systems.resourceRegistry || null;
    }

    function getContainerRegistry() {
        return game.systems.containerRegistry || null;
    }

    function getGameEvents() {
        return game.systems.gameEvents || null;
    }

    function getInteractionsRuntime() {
        return game.systems.interactions || null;
    }

    function getCurrentTimeOfDayAdvancesElapsed() {
        return Number.isFinite(game.state.timeOfDayAdvancesElapsed)
            ? Math.max(0, Math.floor(game.state.timeOfDayAdvancesElapsed))
            : 0;
    }

    function syncResourceNodeInteraction(interaction) {
        const interactions = getInteractionsRuntime();
        return interactions && typeof interactions.syncResourceNodeInteractionState === 'function'
            ? interactions.syncResourceNodeInteractionState(interaction)
            : interaction;
    }

    function isResourceNodeInteraction(interaction) {
        const interactions = getInteractionsRuntime();
        return interactions && typeof interactions.isResourceNodeInteraction === 'function'
            ? interactions.isResourceNodeInteraction(interaction)
            : Boolean(interaction && interaction.kind === 'resourceNode');
    }

    function cloneProfile(profile) {
        return profile && typeof profile === 'object'
            ? { ...profile }
            : null;
    }

    function getGridReachDistance(fromX, fromY, toX, toY) {
        return Math.max(
            Math.abs(Math.round(toX) - Math.round(fromX)),
            Math.abs(Math.round(toY) - Math.round(fromY))
        );
    }

    function getNearbyGridPositions(originX, originY, options = {}) {
        const includeOrigin = options.includeOrigin !== false;
        const positions = includeOrigin
            ? [{ x: Math.round(originX), y: Math.round(originY) }]
            : [];
        const roundedX = Math.round(originX);
        const roundedY = Math.round(originY);

        [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
            { dx: 1, dy: 1 },
            { dx: 1, dy: -1 },
            { dx: -1, dy: 1 },
            { dx: -1, dy: -1 }
        ].forEach((direction) => {
            positions.push({
                x: roundedX + direction.dx,
                y: roundedY + direction.dy
            });
        });

        return positions;
    }

    function buildResourceNodeRequirementMessage(profile, interaction, definition) {
        if (interaction && interaction.nodeStateReason === 'islandLimit' && interaction.islandLimitMax) {
            return `На этом острове лимит на "${interaction.label || definition.label || 'этот ресурс'}" исчерпан: ${interaction.islandLimitConsumed || interaction.islandLimitMax} из ${interaction.islandLimitMax}.`;
        }

        if (interaction && interaction.nodeState === 'depleted') {
            return `"${interaction.label || definition.label || 'Этот узел'}" исчерпан.`;
        }

        if (interaction && interaction.nodeState === 'regenerating') {
            const readyAtAdvance = Number.isFinite(interaction.regenerationReadyAtAdvance)
                ? interaction.regenerationReadyAtAdvance
                : null;
            const remainingAdvances = readyAtAdvance === null
                ? null
                : Math.max(0, readyAtAdvance - getCurrentTimeOfDayAdvancesElapsed());
            const regenerationHint = remainingAdvances === 1
                ? ' Он восстановится после следующей смены времени суток.'
                : (remainingAdvances && remainingAdvances > 1
                    ? ` Он восстановится через ${remainingAdvances} смены времени суток.`
                    : ' Он ещё восстанавливается.');
            return `"${interaction.label || definition.label || 'Этот узел'}" восстанавливается.${regenerationHint}`;
        }

        if (profile && profile.requiredInventoryItemId) {
            const itemLabel = profile.requiredInventoryItemLabel || profile.requiredInventoryItemId;
            return `Для "${interaction.label || definition.label || 'этого узла'}" нужен предмет "${itemLabel}".`;
        }

        return interaction.interactionHint
            || definition.interactionHint
            || `Сейчас "${interaction.label || definition.label || 'этот узел'}" использовать нельзя.`;
    }

    function buildResourceNodeGatherProfile(interaction, tileInfo) {
        if (!isResourceNodeInteraction(interaction)) {
            return null;
        }

        const syncedInteraction = syncResourceNodeInteraction(interaction) || interaction;
        const resourceRegistry = getResourceRegistry();
        const inventoryRuntime = getInventoryRuntime();
        const definition = resourceRegistry && typeof resourceRegistry.getResourceNodeDefinition === 'function'
            ? resourceRegistry.getResourceNodeDefinition(syncedInteraction.resourceNodeKind)
            : null;
        const tileType = tileInfo ? (tileInfo.baseTileType || tileInfo.tileType || '') : '';
        const resourceId = syncedInteraction.resourceId || (definition ? definition.resourceId : '') || '';
        const defaultCollectedLabelByResource = {
            grass: 'траву',
            reeds: 'тростник',
            stone: 'камень',
            rubble: 'щебень',
            wood: 'дерево',
            water: 'воду',
            fish: 'рыбу'
        };
        const defaultSourceLabel = (syncedInteraction.label || (definition ? definition.label : '') || 'ресурсный узел').toLowerCase();
        const profile = cloneProfile(syncedInteraction.gatherProfile || (definition ? definition.gatherProfile : null)) || {
            resourceId,
            resourceFamilyId: resourceId,
            itemId: '',
            sourceLabel: defaultSourceLabel,
            collectedLabel: defaultCollectedLabelByResource[resourceId] || defaultSourceLabel,
            adviceKey: resourceId,
            allowAdjacent: true
        };

        profile.resourceId = profile.resourceId || resourceId;
        profile.resourceFamilyId = profile.resourceFamilyId || profile.resourceId || resourceId;
        profile.sourceLabel = profile.sourceLabel || defaultSourceLabel;
        profile.collectedLabel = profile.collectedLabel || defaultCollectedLabelByResource[resourceId] || defaultSourceLabel;
        profile.adviceKey = profile.adviceKey || resourceId;
        profile.allowAdjacent = profile.allowAdjacent !== false;
        profile.nodeState = syncedInteraction.nodeState || 'fresh';
        profile.nodeStateReason = syncedInteraction.nodeStateReason || 'durability';
        profile.nodeStateLabel = syncedInteraction.nodeStateLabel || profile.nodeState;
        profile.durabilityRemaining = Number.isFinite(syncedInteraction.durabilityRemaining)
            ? syncedInteraction.durabilityRemaining
            : 0;
        profile.durabilityMax = Number.isFinite(syncedInteraction.durabilityMax)
            ? syncedInteraction.durabilityMax
            : Math.max(1, profile.durabilityRemaining || 1);
        profile.respawnPolicyMode = syncedInteraction.respawnPolicyMode || '';
        profile.respawnPolicyLabel = syncedInteraction.respawnPolicyLabel || '';
        profile.islandLimitConsumed = Number.isFinite(syncedInteraction.islandLimitConsumed)
            ? syncedInteraction.islandLimitConsumed
            : 0;
        profile.islandLimitMax = Number.isFinite(syncedInteraction.islandLimitMax)
            ? syncedInteraction.islandLimitMax
            : null;
        profile.islandLimitRemaining = Number.isFinite(syncedInteraction.islandLimitRemaining)
            ? syncedInteraction.islandLimitRemaining
            : null;
        profile.islandLimitExhausted = Boolean(syncedInteraction.islandLimitExhausted);

        if (syncedInteraction.resourceNodeKind === 'grassBush' && resourceRegistry && typeof resourceRegistry.getResourceSubtypeDefinition === 'function') {
            const subtypeId = tileType === 'reeds' ? 'lowlandGrass' : 'fieldGrass';
            const subtype = resourceRegistry.getResourceSubtypeDefinition(subtypeId);

            if (subtype) {
                profile.resourceId = subtype.familyResourceId || profile.resourceId || resourceId;
                profile.resourceFamilyId = subtype.familyResourceId || profile.resourceFamilyId || 'grass';
                profile.itemId = subtype.familyItemId || profile.itemId || 'raw_grass';
                profile.resourceSubtypeId = subtype.id;
                profile.resourceSubtypeLabel = subtype.label || '';
                profile.adviceKey = subtype.adviceKey || profile.adviceKey;
                profile.legacyHarvestItemIds = Array.isArray(subtype.legacyItemIds)
                    ? subtype.legacyItemIds.slice()
                    : [];
                profile.collectedLabel = subtype.collectedLabel || profile.collectedLabel;
                profile.sourceLabel = tileType === 'reeds'
                    ? 'заросли тростника'
                    : 'луговой куст травы';
            }
        }

        if (profile.resourceFamilyId === 'fish' && resourceRegistry && typeof resourceRegistry.resolveFishCatchDefinition === 'function') {
            const islandIndex = tileInfo && tileInfo.progression && Number.isFinite(tileInfo.progression.islandIndex)
                ? Math.max(1, Math.floor(tileInfo.progression.islandIndex))
                : (Number.isFinite(syncedInteraction.islandIndex) ? Math.max(1, Math.floor(syncedInteraction.islandIndex)) : Math.max(1, Math.floor(game.state.currentIslandIndex || 1)));
            const catchDefinition = resourceRegistry.resolveFishCatchDefinition(islandIndex);

            if (catchDefinition) {
                profile.itemId = catchDefinition.itemId || profile.itemId || 'raw_fish';
                profile.resourceCatchId = catchDefinition.id || '';
                profile.resourceCatchLabel = catchDefinition.label || '';
                profile.resourceCatchRarityLabel = catchDefinition.rarityLabel || '';
                profile.collectedLabel = catchDefinition.collectedLabel || profile.collectedLabel;
            }
        }

        if (!profile.itemId) {
            profile.canGather = false;
            profile.requirementMessage = buildResourceNodeRequirementMessage(profile, syncedInteraction, definition || {});
            return profile;
        }

        if (profile.nodeState === 'depleted' || profile.nodeState === 'regenerating') {
            profile.canGather = false;
            profile.requirementMessage = buildResourceNodeRequirementMessage(profile, syncedInteraction, definition || {});
            return profile;
        }

        if (
            profile.requiredInventoryItemId
            && inventoryRuntime
            && typeof inventoryRuntime.countInventoryItem === 'function'
            && inventoryRuntime.countInventoryItem(profile.requiredInventoryItemId) < 1
        ) {
            profile.canGather = false;
            profile.requirementMessage = buildResourceNodeRequirementMessage(profile, syncedInteraction, definition || {});
            return profile;
        }

        profile.canGather = true;
        return profile;
    }

    function isTerrainTargetGatherAvailable(target) {
        return Boolean(
            target
            && target.profile
            && target.profile.itemId
            && target.profile.canGather !== false
        );
    }

    function isDialogueEncounter(encounter, activeInteraction = game.state.activeInteraction) {
        const dialogueRuntime = getDialogueRuntime();
        return Boolean(
            encounter
            && activeInteraction
            && dialogueRuntime
            && typeof dialogueRuntime.canStartDialogue === 'function'
            && dialogueRuntime.canStartDialogue(activeInteraction)
        );
    }

    function getEncounterTalkPrompt(encounter) {
        if (!encounter) {
            return '';
        }

        if (encounter.kind === 'merchant') {
            return `${encounter.label}: ${encounter.summary} Нажми "Говорить", чтобы открыть меню торговли.`;
        }

        if (encounter.kind === 'craft_merchant' || encounter.kind === 'artisan') {
            return `${encounter.label}: ${encounter.summary} Нажми "Говорить", чтобы открыть заказ на расширение сумки.`;
        }

        if (encounter.kind === 'station_keeper') {
            return `${encounter.label}: ${encounter.summary} Нажми "Использовать", чтобы открыть окно станции.`;
        }

        if (encounter.kind === 'islandOriginalNpc') {
            return `${encounter.label}: ${encounter.summary} ${encounter.talkPrompt || 'Нажми "Говорить", чтобы поговорить.'}`;
        }

        return `${encounter.label}: ${encounter.summary} Нажми "Говорить", чтобы поговорить.`;
    }

    function getHarvestedTerrainState() {
        const state = game.state;
        state.harvestedTerrainKeys = state.harvestedTerrainKeys || {};
        return state.harvestedTerrainKeys;
    }

    function getSelectedInventoryItem() {
        const inventoryRuntime = getInventoryRuntime();
        return inventoryRuntime ? inventoryRuntime.getSelectedInventoryItem() : null;
    }

    function getTerrainGatherProfile(tileInfo) {
        if (!tileInfo || tileInfo.house) {
            return null;
        }

        const resourceNodeProfile = buildResourceNodeGatherProfile(tileInfo.interaction, tileInfo);
        if (resourceNodeProfile) {
            return resourceNodeProfile;
        }

        if (tileInfo.travelZoneKey === 'badSector') {
            return {
                resourceId: 'soil',
                resourceFamilyId: 'soil',
                itemId: 'soilClod',
                sourceLabel: 'плохой сектор',
                collectedLabel: 'комья земли',
                adviceKey: 'soil',
                conversionHint: 'Пять единиц этого сырья можно сжать руками в земляной ресурс.',
                allowAdjacent: false,
                gatherCost: {
                    routeCost: 1.25,
                    timeSteps: 2
                }
            };
        }

        return null;
    }

    function getTerrainGatherKey(tileInfo) {
        return tileInfo ? `${tileInfo.x},${tileInfo.y}` : '';
    }

    function getTerrainHarvestKeyIds(profile) {
        if (!profile || typeof profile !== 'object') {
            return [];
        }

        return [...new Set([
            typeof profile.itemId === 'string' ? profile.itemId : '',
            ...(Array.isArray(profile.legacyHarvestItemIds) ? profile.legacyHarvestItemIds : [])
        ].filter((itemId) => typeof itemId === 'string' && itemId.trim()))];
    }

    function isTerrainAlreadyHarvested(tileInfo, profile) {
        if (!tileInfo || !profile) {
            return false;
        }

        if (tileInfo.interaction && isResourceNodeInteraction(tileInfo.interaction)) {
            syncResourceNodeInteraction(tileInfo.interaction);
            return false;
        }

        const harvested = getHarvestedTerrainState();
        const harvestKeyIds = getTerrainHarvestKeyIds(profile);
        return Boolean(
            harvested[getTerrainGatherKey(tileInfo)]
            || harvestKeyIds.some((itemId) => harvested[`${itemId}:${tileInfo.x},${tileInfo.y}`])
        );
    }

    function markTerrainHarvested(tileInfo, profile) {
        if (!tileInfo || !profile) {
            return;
        }

        if (tileInfo.interaction && isResourceNodeInteraction(tileInfo.interaction)) {
            return;
        }

        const harvested = getHarvestedTerrainState();
        harvested[getTerrainGatherKey(tileInfo)] = true;
        getTerrainHarvestKeyIds(profile).forEach((itemId) => {
            harvested[`${itemId}:${tileInfo.x},${tileInfo.y}`] = true;
        });
    }

    function formatTempoStepLabel(stepCount) {
        const absoluteCount = Math.abs(Math.floor(stepCount));
        const lastDigit = absoluteCount % 10;
        const lastTwoDigits = absoluteCount % 100;

        if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
            return 'шагов маршрута';
        }

        if (lastDigit === 1) {
            return 'шаг маршрута';
        }

        if (lastDigit >= 2 && lastDigit <= 4) {
            return 'шага маршрута';
        }

        return 'шагов маршрута';
    }

    function buildGatherCostProfile(profile, tileInfo = game.state.activeTileInfo) {
        const sourceCost = profile && profile.gatherCost && typeof profile.gatherCost === 'object'
            ? profile.gatherCost
            : {};
        const fallbackRouteCost = tileInfo && Number.isFinite(tileInfo.travelWeight)
            ? Math.max(0.5, tileInfo.travelWeight)
            : 1;
        const routeCost = Number.isFinite(sourceCost.routeCost)
            ? Math.max(0.25, sourceCost.routeCost)
            : fallbackRouteCost;
        const timeSteps = Number.isFinite(sourceCost.timeSteps)
            ? Math.max(1, Math.floor(sourceCost.timeSteps))
            : 1;

        return {
            routeCost,
            routeCostLabel: bridge.formatRouteCost(routeCost),
            timeSteps,
            timeLabel: `+${timeSteps} ${formatTempoStepLabel(timeSteps)}`
        };
    }

    function getGatherCostSentence(profile, tileInfo = game.state.activeTileInfo) {
        const gatherCost = buildGatherCostProfile(profile, tileInfo);
        return `Цена сбора: x${gatherCost.routeCostLabel} и ${gatherCost.timeLabel}.`;
    }

    function applyGatherTempoCost(target) {
        if (!target || !target.profile) {
            return {
                gatherCost: buildGatherCostProfile(null, game.state.activeTileInfo),
                timeAdvances: 0,
                timeMessages: []
            };
        }

        const tileInfo = game.state.activeTileInfo || target.tileInfo;
        const gatherCost = buildGatherCostProfile(target.profile, tileInfo);
        const focusMultiplier = bridge.getFocusMultiplier();
        const criticalDrainMultiplier = bridge.getCriticalDepletionMultiplier();
        const traversalDrain = Math.max(0, gatherCost.routeCost * focusMultiplier * criticalDrainMultiplier);
        const openingHungerDrainMultiplier = bridge.getOpeningHungerDrainMultiplier();
        const energyDrain = Math.max(0.4 * gatherCost.timeSteps, traversalDrain * bridge.getStepEnergyDrainMultiplier(tileInfo));
        const hungerDrain = Math.max(0.4 * gatherCost.timeSteps * openingHungerDrainMultiplier, traversalDrain * openingHungerDrainMultiplier);
        const coldDelta = game.state.activeHouse
            ? 0
            : -Math.max(
                0.15 * gatherCost.timeSteps,
                game.systems.expedition.scaleTraversalDrain(gatherCost.routeCost / bridge.coldDrainDivider, tileInfo) * criticalDrainMultiplier
            );

        bridge.applyStatDeltas({
            energy: -energyDrain,
            hunger: -hungerDrain,
            cold: coldDelta
        });

        if (game.state.isGameOver) {
            return {
                gatherCost,
                timeAdvances: 0,
                timeMessages: []
            };
        }

        const movement = game.systems.movement || null;
        const timeOutcome = movement && typeof movement.consumeActionTempo === 'function'
            ? movement.consumeActionTempo({
                virtualSteps: gatherCost.timeSteps,
                silent: true,
                reasonLabel: 'за сбором'
            })
            : {
                virtualStepsApplied: 0,
                timeAdvances: 0,
                messages: []
            };

        return {
            gatherCost,
            timeAdvances: Number.isFinite(timeOutcome.timeAdvances) ? timeOutcome.timeAdvances : 0,
            timeMessages: Array.isArray(timeOutcome.messages) ? timeOutcome.messages.filter(Boolean) : []
        };
    }

    function getGatherRiskChanceLabel(chance) {
        return `${Math.round(Math.max(0, chance) * 100)}%`;
    }

    function buildGatherRiskProfile(profile, tileInfo = game.state.activeTileInfo) {
        const sourceRisk = profile && profile.gatherRisk && typeof profile.gatherRisk === 'object'
            ? profile.gatherRisk
            : null;

        if (!sourceRisk) {
            return null;
        }

        const islandIndex = tileInfo && tileInfo.progression && Number.isFinite(tileInfo.progression.islandIndex)
            ? Math.max(1, Math.floor(tileInfo.progression.islandIndex))
            : Math.max(1, Math.floor(game.state.currentIslandIndex || 1));
        const startIsland = Number.isFinite(sourceRisk.startIsland)
            ? Math.max(1, Math.floor(sourceRisk.startIsland))
            : 19;

        if (islandIndex < startIsland) {
            return null;
        }

        const rewardScaling = game.systems.rewardScaling || null;
        const pressureTier = rewardScaling && typeof rewardScaling.getIslandPressureTier === 'function'
            ? rewardScaling.getIslandPressureTier(tileInfo)
            : 0;
        const weather = rewardScaling && typeof rewardScaling.getWeather === 'function'
            ? rewardScaling.getWeather(tileInfo)
            : null;
        const baseChance = Number.isFinite(sourceRisk.baseChance) ? Math.max(0, sourceRisk.baseChance) : 0.12;
        const islandChanceStep = Number.isFinite(sourceRisk.islandChanceStep) ? Math.max(0, sourceRisk.islandChanceStep) : 0.01;
        const pressureChanceStep = Number.isFinite(sourceRisk.pressureChanceStep) ? Math.max(0, sourceRisk.pressureChanceStep) : 0.02;
        const badWeatherChanceBonus = Number.isFinite(sourceRisk.badWeatherChanceBonus) ? Math.max(0, sourceRisk.badWeatherChanceBonus) : 0.03;
        const maxChance = Number.isFinite(sourceRisk.maxChance) ? Math.max(baseChance, sourceRisk.maxChance) : 0.3;
        const weatherBonus = weather && weather.key && weather.key !== 'clear'
            ? badWeatherChanceBonus
            : 0;
        const chance = Math.min(
            maxChance,
            baseChance
                + Math.max(0, islandIndex - startIsland) * islandChanceStep
                + Math.max(0, pressureTier) * pressureChanceStep
                + weatherBonus
        );

        return {
            ...sourceRisk,
            islandIndex,
            startIsland,
            pressureTier,
            weatherKey: weather && weather.key ? weather.key : 'clear',
            chance,
            chanceLabel: getGatherRiskChanceLabel(chance),
            outcomes: sourceRisk.outcomes && typeof sourceRisk.outcomes === 'object'
                ? { ...sourceRisk.outcomes }
                : {
                    noise: 2,
                    extraDrain: 3,
                    loseTurn: 1,
                    localPressure: 2
                }
        };
    }

    function pickWeightedGatherRiskOutcome(outcomes = {}) {
        const normalizedEntries = Object.entries(outcomes)
            .map(([key, value]) => [key, Number.isFinite(value) ? Math.max(0, value) : 0])
            .filter(([, weight]) => weight > 0);

        if (normalizedEntries.length === 0) {
            return 'extraDrain';
        }

        const totalWeight = normalizedEntries.reduce((sum, [, weight]) => sum + weight, 0);
        let roll = Math.random() * totalWeight;

        for (const [key, weight] of normalizedEntries) {
            roll -= weight;
            if (roll <= 0) {
                return key;
            }
        }

        return normalizedEntries[normalizedEntries.length - 1][0];
    }

    function applyGatherRiskExtraDrain(target, riskProfile) {
        const tileInfo = game.state.activeTileInfo || target.tileInfo;
        const gatherCost = buildGatherCostProfile(target.profile, tileInfo);
        const extraDrainFactor = Number.isFinite(riskProfile.extraDrainFactor)
            ? Math.max(0.5, riskProfile.extraDrainFactor)
            : 0.8;
        const focusMultiplier = bridge.getFocusMultiplier();
        const criticalDrainMultiplier = bridge.getCriticalDepletionMultiplier();
        const traversalDrain = Math.max(0, gatherCost.routeCost * extraDrainFactor * focusMultiplier * criticalDrainMultiplier);
        const openingHungerDrainMultiplier = bridge.getOpeningHungerDrainMultiplier();
        const energyDrain = Math.max(0.65, traversalDrain * bridge.getStepEnergyDrainMultiplier(tileInfo));
        const hungerDrain = Math.max(0.65, traversalDrain * openingHungerDrainMultiplier);
        const coldDelta = game.state.activeHouse
            ? 0
            : -Math.max(
                0.25,
                game.systems.expedition.scaleTraversalDrain((gatherCost.routeCost * extraDrainFactor) / bridge.coldDrainDivider, tileInfo) * criticalDrainMultiplier
            );

        bridge.applyStatDeltas({
            energy: -energyDrain,
            hunger: -hungerDrain,
            cold: coldDelta
        });

        return {
            energyDrain,
            hungerDrain,
            coldDelta
        };
    }

    function getGatherRiskWarning(profile, tileInfo = game.state.activeTileInfo) {
        const riskProfile = buildGatherRiskProfile(profile, tileInfo);

        if (!riskProfile) {
            return '';
        }

        return ` На поздних островах риск сбора около ${riskProfile.chanceLabel}: возможны шум, лишний drain, потеря хода или рост local pressure.`;
    }

    function getResourceNodeYieldFact(profile, interaction) {
        if (interaction && interaction.resourceNodeKind === 'waterSource') {
            return 'Что даёт: сырую воду во фляге.';
        }

        if (profile && profile.collectedLabel) {
            return `Что даёт: ${profile.collectedLabel}.`;
        }

        return 'Что даёт: базовое сырьё этого узла.';
    }

    function getResourceNodeCostFact(profile, interaction, tileInfo = game.state.activeTileInfo) {
        if (profile && profile.gatherCost) {
            return getGatherCostSentence(profile, tileInfo);
        }

        if (interaction && interaction.resourceNodeKind === 'waterSource') {
            return 'Цена действия: без отдельного расхода, если уже стоишь рядом.';
        }

        return 'Цена действия: без отдельного расхода поверх подхода к узлу.';
    }

    function getResourceNodeToolFact(profile, interaction) {
        if (profile && profile.requiredInventoryItemLabel) {
            return `Чем собирается: нужна "${profile.requiredInventoryItemLabel}".`;
        }

        if (interaction && interaction.resourceNodeKind === 'waterSource') {
            return 'Чем собирается: пустой флягой.';
        }

        return 'Чем собирается: руками.';
    }

    function getResourceNodeRiskFact(profile, interaction, tileInfo = game.state.activeTileInfo) {
        const riskProfile = buildGatherRiskProfile(profile, tileInfo);

        if (riskProfile) {
            return `Чем рискуешь: на поздних островах шанс около ${riskProfile.chanceLabel} на шум, лишний drain, потерю хода или рост local pressure.`;
        }

        if (interaction && interaction.resourceNodeKind === 'waterSource') {
            return 'Чем рискуешь: только темпом маршрута, отдельного штрафа у точки воды нет.';
        }

        return 'Чем рискуешь: только темпом маршрута, отдельного штрафа на этом окне нет.';
    }

    function buildResourceNodeFactBlock(profile, interaction, tileInfo = game.state.activeTileInfo) {
        return [
            getResourceNodeYieldFact(profile, interaction),
            getResourceNodeCostFact(profile, interaction, tileInfo),
            getResourceNodeToolFact(profile, interaction),
            getResourceNodeRiskFact(profile, interaction, tileInfo)
        ].join(' ');
    }

    function applyGatherRiskOutcome(target) {
        const tileInfo = game.state.activeTileInfo || target.tileInfo;
        const riskProfile = buildGatherRiskProfile(target && target.profile, tileInfo);

        if (!riskProfile || Math.random() >= riskProfile.chance) {
            return {
                triggered: false,
                riskProfile
            };
        }

        const rewardScaling = game.systems.rewardScaling || null;
        const movement = game.systems.movement || null;
        const ui = game.systems.ui || null;
        const outcomeKey = pickWeightedGatherRiskOutcome(riskProfile.outcomes);
        let message = '';
        let timeAdvances = 0;
        let pressureAdded = 0;

        if (outcomeKey === 'noise') {
            const noiseSteps = Number.isFinite(riskProfile.noiseTimeSteps)
                ? Math.max(1, Math.floor(riskProfile.noiseTimeSteps))
                : 1;
            const timeOutcome = movement && typeof movement.consumeActionTempo === 'function'
                ? movement.consumeActionTempo({
                    virtualSteps: noiseSteps,
                    silent: true,
                    reasonLabel: 'из-за шума'
                })
                : { timeAdvances: 0, messages: [] };

            timeAdvances = Number.isFinite(timeOutcome.timeAdvances) ? timeOutcome.timeAdvances : 0;
            message = `Сбор вышел шумным: пришлось затаиться и потерять темп.${Array.isArray(timeOutcome.messages) && timeOutcome.messages.length > 0 ? ` ${timeOutcome.messages.join(' ')}` : ''}`;
        } else if (outcomeKey === 'extraDrain') {
            applyGatherRiskExtraDrain(target, riskProfile);
            message = 'Сбор дался тяжелее обычного: ушло больше сил и припасов, чем ожидалось.';
        } else if (outcomeKey === 'loseTurn') {
            const lostTurnSteps = Math.max(2, bridge.getRouteLengthLimit());
            const timeOutcome = movement && typeof movement.consumeActionTempo === 'function'
                ? movement.consumeActionTempo({
                    virtualSteps: lostTurnSteps,
                    silent: true,
                    reasonLabel: 'из-за сорванного сбора'
                })
                : { timeAdvances: 0, messages: [] };

            timeAdvances = Number.isFinite(timeOutcome.timeAdvances) ? timeOutcome.timeAdvances : 0;

            if (ui && typeof ui.applyPathCompletionCosts === 'function' && !game.state.isGameOver) {
                ui.applyPathCompletionCosts();
            }

            message = `Сбор затянулся: потерян целый ход на восстановление маршрута.${Array.isArray(timeOutcome.messages) && timeOutcome.messages.length > 0 ? ` ${timeOutcome.messages.join(' ')}` : ''}`;
        } else if (outcomeKey === 'localPressure') {
            pressureAdded = Number.isFinite(riskProfile.localPressureSteps)
                ? Math.max(1, Math.floor(riskProfile.localPressureSteps))
                : 2;

            if (rewardScaling && typeof rewardScaling.addIslandPressureSteps === 'function') {
                rewardScaling.addIslandPressureSteps(tileInfo, pressureAdded);
            }

            const pressureSummary = rewardScaling && typeof rewardScaling.getIslandPressureSummary === 'function'
                ? rewardScaling.getIslandPressureSummary(tileInfo)
                : '';
            message = `Сбор всколыхнул остров: местная нагрузка выросла${pressureSummary ? ` (${pressureSummary})` : ''}.`;
        } else {
            applyGatherRiskExtraDrain(target, riskProfile);
            message = 'Поздний сбор прошёл с лишними потерями.';
        }

        return {
            triggered: true,
            outcomeKey,
            message,
            riskProfile,
            timeAdvances,
            pressureAdded
        };
    }

    function invalidateTerrainTileRenderCache(worldX, worldY) {
        const world = game.systems.world;

        if (!world || typeof world.getChunkCoordinatesForWorld !== 'function' || typeof world.getChunk !== 'function') {
            return;
        }

        const { chunkX, chunkY } = world.getChunkCoordinatesForWorld(worldX, worldY);
        const chunk = world.getChunk(chunkX, chunkY, { generateIfMissing: false });

        if (chunk) {
            const chunkRenderer = game.systems.chunkRenderer || null;
            const render = game.systems.render || null;

            if (chunkRenderer && typeof chunkRenderer.invalidateChunkRenderCache === 'function') {
                chunkRenderer.invalidateChunkRenderCache(chunk, {
                    overlayChanged: true,
                    reason: 'harvestedTerrain'
                });
            } else {
                chunk.renderCache = null;
            }

            if (render && typeof render.markSceneLayersDirty === 'function') {
                render.markSceneLayersDirty({
                    world: true
                });
            }
        }
    }

    function buildTerrainTarget(tileInfo, profile, isHarvested) {
        const normalizedProfile = profile && typeof profile === 'object'
            ? {
                ...profile,
                gatherCost: buildGatherCostProfile(profile, game.state.activeTileInfo || tileInfo)
            }
            : profile;

        return {
            tileInfo,
            profile: normalizedProfile,
            isHarvested,
            interaction: tileInfo && isResourceNodeInteraction(tileInfo.interaction)
                ? tileInfo.interaction
                : null
        };
    }

    function shouldIncludeTerrainTarget(target, options = {}) {
        const { includeHarvested = false, includeUnavailable = false } = options;

        if (!target || !target.profile) {
            return false;
        }

        if (!includeHarvested && target.isHarvested) {
            return false;
        }

        if (!includeUnavailable && !isTerrainTargetGatherAvailable(target)) {
            return false;
        }

        return true;
    }

    function getTerrainTarget(options = {}) {
        const { includeHarvested = false, allowSelectedItem = false, includeUnavailable = false } = options;
        const world = game.systems.world;

        if (!world || typeof world.getTileInfo !== 'function') {
            return null;
        }

        if (!allowSelectedItem && getSelectedInventoryItem()) {
            return null;
        }

        const origin = game.state.playerPos;
        const currentTileInfo = world.getTileInfo(origin.x, origin.y, { generateIfMissing: false });
        const currentProfile = getTerrainGatherProfile(currentTileInfo);

        if (currentProfile) {
            const isHarvested = isTerrainAlreadyHarvested(currentTileInfo, currentProfile);
            const target = buildTerrainTarget(currentTileInfo, currentProfile, isHarvested);
            if (shouldIncludeTerrainTarget(target, { includeHarvested, includeUnavailable })) {
                return target;
            }
        }

        const adjacentPositions = getNearbyGridPositions(origin.x, origin.y, { includeOrigin: false });

        for (const position of adjacentPositions) {
            const tileInfo = world.getTileInfo(position.x, position.y, { generateIfMissing: false });
            const profile = getTerrainGatherProfile(tileInfo);

            if (!profile || !profile.allowAdjacent) {
                continue;
            }

            const isHarvested = isTerrainAlreadyHarvested(tileInfo, profile);
            const target = buildTerrainTarget(tileInfo, profile, isHarvested);
            if (shouldIncludeTerrainTarget(target, { includeHarvested, includeUnavailable })) {
                return target;
            }
        }

        return null;
    }

    function getGatherableTerrainTarget(options = {}) {
        const allowSelectedItem = Boolean(options.allowSelectedItem);
        const selectedTarget = getTerrainTargetForTile(getSelectedWorldTileInfo());

        if (selectedTarget && isTerrainTargetWithinGatherReach(selectedTarget)) {
            return selectedTarget;
        }

        return getTerrainTarget({ allowSelectedItem });
    }

    function getInspectableTerrainTarget() {
        return getTerrainTarget({ includeHarvested: true, allowSelectedItem: true, includeUnavailable: true });
    }

    function getRouteInspectTileInfo() {
        const world = game.systems.world;
        const route = Array.isArray(game.state.route) ? game.state.route : [];

        if (!world || typeof world.getTileInfo !== 'function' || route.length === 0) {
            return null;
        }

        const lastPoint = route[route.length - 1];
        return world.getTileInfo(lastPoint.x, lastPoint.y, { generateIfMissing: false });
    }

    function getSelectedWorldTileInfo() {
        const world = game.systems.world;
        const selectedTile = game.state.selectedWorldTile;

        if (!world || typeof world.getTileInfo !== 'function' || !selectedTile) {
            return null;
        }

        return world.getTileInfo(selectedTile.x, selectedTile.y, { generateIfMissing: false });
    }

    function getSelectedWorldInteraction(tileInfo = getSelectedWorldTileInfo()) {
        if (!tileInfo) {
            return null;
        }

        if (tileInfo.interaction) {
            return tileInfo.interaction;
        }

        const interactions = game.systems.interactions;
        return interactions && typeof interactions.getInteractionAtWorld === 'function'
            ? interactions.getInteractionAtWorld(tileInfo.x, tileInfo.y, { generateIfMissing: false })
            : null;
    }

    function getTerrainTargetForTile(tileInfo, options = {}) {
        const { includeHarvested = false, includeUnavailable = false } = options;
        const profile = getTerrainGatherProfile(tileInfo);

        if (!profile) {
            return null;
        }

        const isHarvested = isTerrainAlreadyHarvested(tileInfo, profile);
        const target = buildTerrainTarget(tileInfo, profile, isHarvested);

        if (!shouldIncludeTerrainTarget(target, { includeHarvested, includeUnavailable })) {
            return null;
        }

        return target;
    }

    function isTerrainTargetWithinGatherReach(target) {
        if (!target || !target.tileInfo || !target.profile) {
            return false;
        }

        const playerX = Math.round(game.state.playerPos.x);
        const playerY = Math.round(game.state.playerPos.y);
        const distance = getGridReachDistance(playerX, playerY, target.tileInfo.x, target.tileInfo.y);

        if (distance === 0) {
            return true;
        }

        return Boolean(target.profile.allowAdjacent && distance === 1);
    }

    function refreshPlayerContext() {
        const world = game.systems.world;

        if (world && typeof world.updatePlayerContext === 'function') {
            world.updatePlayerContext(game.state.playerPos);
        }
    }

    function collectTerrainResourceAtTarget(target, options = {}) {
        const inventoryRuntime = getInventoryRuntime();
        const itemEffects = getItemEffects();
        const registry = game.systems.itemRegistry || game.systems.loot || null;
        const requiredResourceFamilyId = typeof options.requiredResourceFamilyId === 'string'
            ? options.requiredResourceFamilyId.trim()
            : '';
        const mismatchMessage = typeof options.mismatchMessage === 'string' && options.mismatchMessage.trim()
            ? options.mismatchMessage.trim()
            : 'Рядом нет подходящего ресурса.';

        if (!inventoryRuntime || !target) {
            return false;
        }

        if (
            requiredResourceFamilyId
            && (!target.profile || target.profile.resourceFamilyId !== requiredResourceFamilyId)
        ) {
            bridge.setActionMessage(mismatchMessage);
            bridge.renderAfterStateChange();
            return {
                handled: true,
                success: false,
                message: mismatchMessage,
                effectDrops: []
            };
        }

        if (!isTerrainTargetGatherAvailable(target)) {
            const message = target.profile && target.profile.requirementMessage
                ? target.profile.requirementMessage
                : 'Сейчас этот ресурс собрать нельзя.';
            bridge.setActionMessage(message);
            bridge.renderAfterStateChange();
            return {
                handled: true,
                success: false,
                message,
                effectDrops: []
            };
        }

        const outcome = inventoryRuntime.addInventoryItem(target.profile.itemId, 1, {
            resourceFamilyId: target.profile.resourceFamilyId || target.profile.resourceId || '',
            resourceSubtypeId: target.profile.resourceSubtypeId || '',
            resourceSubtypeLabel: target.profile.resourceSubtypeLabel || ''
        });

        if (!outcome.added) {
            const message = 'Рюкзак полон. Сначала освободи слот, чтобы собрать материал.';
            bridge.setActionMessage(message);
            bridge.renderAfterStateChange();
            return {
                handled: true,
                success: false,
                message,
                effectDrops: []
            };
        }

        markTerrainHarvested(target.tileInfo, target.profile);
        let resourceNodeState = null;
        if (target.interaction && isResourceNodeInteraction(target.interaction)) {
            const interactions = getInteractionsRuntime();
            if (interactions && typeof interactions.consumeResourceNodeInteraction === 'function') {
                resourceNodeState = interactions.consumeResourceNodeInteraction(target.interaction);
            }
        }
        invalidateTerrainTileRenderCache(target.tileInfo.x, target.tileInfo.y);
        refreshPlayerContext();
        const gatherTempoOutcome = applyGatherTempoCost(target);
        const gatherRiskOutcome = applyGatherRiskOutcome(target);

        if (target.interaction && isResourceNodeInteraction(target.interaction)) {
            resourceNodeState = syncResourceNodeInteraction(target.interaction) || resourceNodeState;
        }

        const drops = [];
        if (itemEffects && typeof itemEffects.buildItemEffectDrop === 'function' && registry) {
            const rawItem = registry.createInventoryItem
                ? registry.createInventoryItem(target.profile.itemId, 1)
                : {
                    id: target.profile.itemId,
                    quantity: 1,
                    label: target.profile.collectedLabel,
                    icon: '?'
                };

            const rawDrop = itemEffects.buildItemEffectDrop(rawItem);
            if (rawDrop) {
                drops.push(rawDrop);
            }

            (outcome.conversions || []).forEach((conversion) => {
                if (!conversion.added || !conversion.item) {
                    return;
                }

                const conversionDrop = itemEffects.buildItemEffectDrop({
                    id: conversion.item.id,
                    label: conversion.item.label,
                    icon: conversion.item.icon,
                    quantity: 1
                });

                if (conversionDrop) {
                    drops.push(conversionDrop);
                }
            });
        }

        if (drops.length > 0 && game.systems.effects) {
            game.systems.effects.spawnInventoryUse(game.state.playerPos, drops);
        }

        const addedConversion = (outcome.conversions || []).find((conversion) => conversion.added && conversion.item);
        const gatherCostSummary = ` ${getGatherCostSentence(target.profile, game.state.activeTileInfo || target.tileInfo)}`;
        const conversionSummary = addedConversion
            ? ` Пять единиц автоматически объединены в "${addedConversion.item.label}".`
            : '';
        const nodeStateSummary = resourceNodeState && resourceNodeState.nodeState === 'used'
            ? ` Узел истощается: осталось ${resourceNodeState.durabilityRemaining} из ${resourceNodeState.durabilityMax} сборов.`
            : (resourceNodeState && resourceNodeState.nodeState === 'depleted'
                ? (resourceNodeState.nodeStateReason === 'islandLimit'
                    ? ` Лимит этого ресурса на острове исчерпан: ${resourceNodeState.islandLimitConsumed || resourceNodeState.islandLimitMax} из ${resourceNodeState.islandLimitMax}.`
                    : ' Узел полностью исчерпан.')
                : (resourceNodeState && resourceNodeState.nodeState === 'regenerating'
                    ? ' Узел переходит в восстановление.'
                    : ''));
        const timeAdvanceSummary = gatherTempoOutcome.timeMessages.length > 0
            ? ` ${gatherTempoOutcome.timeMessages.join(' ')}`
            : '';
        const gatherRiskSummary = gatherRiskOutcome.triggered
            ? ` Риск позднего сбора: ${gatherRiskOutcome.message}`
            : '';
        const gameEvents = getGameEvents();

        if (gameEvents && typeof gameEvents.emitResourceGathered === 'function') {
            gameEvents.emitResourceGathered({
                resourceId: target.profile.resourceId || '',
                resourceFamilyId: target.profile.resourceFamilyId || target.profile.resourceId || '',
                resourceSubtypeId: target.profile.resourceSubtypeId || '',
                resourceSubtypeLabel: target.profile.resourceSubtypeLabel || '',
                itemId: target.profile.itemId || '',
                quantity: 1,
                tile: target.tileInfo
                    ? { x: target.tileInfo.x, y: target.tileInfo.y, tileType: target.tileInfo.tileType || target.tileInfo.baseTileType || '' }
                    : null,
                sourceLabel: target.profile.sourceLabel || '',
                collectedLabel: target.profile.collectedLabel || '',
                gatherCost: {
                    routeCost: gatherTempoOutcome.gatherCost.routeCost,
                    routeCostLabel: gatherTempoOutcome.gatherCost.routeCostLabel,
                    timeSteps: gatherTempoOutcome.gatherCost.timeSteps,
                    timeAdvances: gatherTempoOutcome.timeAdvances
                },
                gatherRisk: gatherRiskOutcome.triggered
                    ? {
                        outcomeKey: gatherRiskOutcome.outcomeKey,
                        chance: gatherRiskOutcome.riskProfile ? gatherRiskOutcome.riskProfile.chance : 0,
                        chanceLabel: gatherRiskOutcome.riskProfile ? gatherRiskOutcome.riskProfile.chanceLabel : '0%',
                        pressureAdded: gatherRiskOutcome.pressureAdded || 0,
                        timeAdvances: gatherRiskOutcome.timeAdvances || 0
                    }
                    : null,
                nodeStateAfter: resourceNodeState
                    ? {
                        nodeState: resourceNodeState.nodeState,
                        durabilityRemaining: resourceNodeState.durabilityRemaining,
                        durabilityMax: resourceNodeState.durabilityMax
                    }
                    : null,
                conversions: (outcome.conversions || []).map((conversion) => ({
                    sourceItemId: conversion.sourceItemId || '',
                    targetItemId: conversion.targetItemId || '',
                    added: Boolean(conversion.added),
                    item: conversion.item
                        ? {
                            id: conversion.item.id,
                            label: conversion.item.label,
                            quantity: conversion.item.quantity
                        }
                        : null
                }))
            });
        }

        const message = `Собрано: ${target.profile.collectedLabel} с участка "${target.profile.sourceLabel}".${gatherCostSummary}${conversionSummary}${nodeStateSummary}${timeAdvanceSummary}${gatherRiskSummary}`;

        if (game.state.isGameOver) {
            bridge.renderAfterStateChange();
            return {
                handled: true,
                success: true,
                message,
                effectDrops: drops
            };
        }

        bridge.setActionMessage(message);
        bridge.renderAfterStateChange();
        return {
            handled: true,
            success: true,
            message,
            effectDrops: drops
        };
    }

    function collectTerrainResource(options = {}) {
        const selectedTileTarget = getTerrainTargetForTile(getSelectedWorldTileInfo(), { includeUnavailable: true });
        const selectedTarget = getTerrainTargetForTile(getSelectedWorldTileInfo(), { includeUnavailable: true });
        const requiredResourceFamilyId = typeof options.requiredResourceFamilyId === 'string'
            ? options.requiredResourceFamilyId.trim()
            : '';
        const allowSelectedItem = Boolean(options.allowSelectedItem);

        if (selectedTarget && !selectedTarget.isHarvested && isTerrainTargetWithinGatherReach(selectedTarget)) {
            return collectTerrainResourceAtTarget(selectedTarget, options);
        }

        const fallbackTarget = getTerrainTarget({ includeUnavailable: true, allowSelectedItem });

        if (
            requiredResourceFamilyId
            && selectedTileTarget
            && isTerrainTargetWithinGatherReach(selectedTileTarget)
            && selectedTileTarget.profile
            && selectedTileTarget.profile.resourceFamilyId === requiredResourceFamilyId
        ) {
            return collectTerrainResourceAtTarget(selectedTileTarget, options);
        }

        return collectTerrainResourceAtTarget(fallbackTarget, options);
    }

    function tryCollectClickedRock(tileInfo) {
        if (getSelectedInventoryItem()) {
            return false;
        }

        if (!tileInfo) {
            return false;
        }

        const target = getTerrainTargetForTile(tileInfo, { includeUnavailable: true });

        if (!target || !target.profile.clickToCollect || !isTerrainTargetWithinGatherReach(target)) {
            return false;
        }

        return collectTerrainResourceAtTarget(target);
    }

    function setActionButtonState(action, enabled, highlighted = false, visible = null) {
        const elements = bridge.getElements();
        const button = elements.actionButtons.find((item) => item.dataset.action === action);

        if (!button) {
            return;
        }

        button.disabled = !enabled;
        button.classList.toggle('hud-button--available', Boolean(enabled && highlighted));
    }

    function getShelterEncounter(activeInteraction = game.state.activeInteraction) {
        const activeEncounter = bridge.getHouseEncounter(activeInteraction);
        if (activeEncounter && activeEncounter.kind === 'shelter') {
            return activeEncounter;
        }

        const activeHouseEncounter = bridge.getHouseEncounter(game.state.activeHouse);
        if (activeHouseEncounter && activeHouseEncounter.kind === 'shelter') {
            return activeHouseEncounter;
        }

        return null;
    }

    function buildActionAvailabilityState(activeInteraction = game.state.activeInteraction) {
        const inventoryRuntime = getInventoryRuntime();
        const itemEffects = getItemEffects();
        const dialogueRuntime = getDialogueRuntime();
        const selectedItem = getSelectedInventoryItem();
        const groundItem = inventoryRuntime ? inventoryRuntime.getCurrentGroundItem() : null;
        const encounter = bridge.getHouseEncounter(activeInteraction);
        const canTalkInteraction = Boolean(
            encounter
            && dialogueRuntime
            && dialogueRuntime.canStartDialogue(activeInteraction)
        );
        const canUseInteraction = Boolean(
            encounter
            && !bridge.isHouseResolved(activeInteraction)
            && encounter.kind !== 'shelter'
            && !canTalkInteraction
        );
        const shelterEncounter = getShelterEncounter(activeInteraction);
        const canUseItem = Boolean(
            selectedItem
            && itemEffects
            && typeof itemEffects.canUseInventoryItem === 'function'
            && itemEffects.canUseInventoryItem(selectedItem)
        );
        const canUseBridgeCharge = Boolean(
            !selectedItem
            && itemEffects
            && typeof itemEffects.canUseBridgeCharge === 'function'
            && itemEffects.canUseBridgeCharge()
        );
        const canUseGroundItem = Boolean(groundItem);
        const canUseTerrain = Boolean(getGatherableTerrainTarget());
        const inspectableTerrain = getInspectableTerrainTarget();
        const selectedWorldTileInfo = getSelectedWorldTileInfo();
        const selectedWorldInteraction = getSelectedWorldInteraction(selectedWorldTileInfo);
        const selectedWorldTerrain = getTerrainTargetForTile(selectedWorldTileInfo, { includeHarvested: true });
        const canDropItem = Boolean(selectedItem);
        const baseEnabled = !game.state.isGameOver && !game.state.isMoving;
        const hasNearbyInteractionContext = Boolean(activeInteraction);
        const canWalkRoute = Boolean(
            baseEnabled
            && !game.state.isPaused
            && !game.state.isMapOpen
            && Array.isArray(game.state.route)
            && game.state.route.length > 0
        );
        const canUseNow = Boolean(canUseItem || canUseBridgeCharge || canUseGroundItem || canUseInteraction || canUseTerrain);
        const canInspectNow = Boolean(
            selectedItem
            || groundItem
            || inspectableTerrain
            || activeInteraction
            || selectedWorldInteraction
            || selectedWorldTerrain
            || selectedWorldTileInfo
        );
        const canSleepNow = baseEnabled;
        const highlightSleep = Boolean(shelterEncounter || game.state.activeHouse);
        const showDropInHud = Boolean(baseEnabled && canDropItem && hasNearbyInteractionContext);

        return {
            walk: {
                enabled: canWalkRoute,
                highlighted: canWalkRoute,
                visible: canWalkRoute
            },
            use: {
                enabled: baseEnabled && canUseNow,
                highlighted: canUseNow,
                visible: baseEnabled && canUseNow
            },
            talk: {
                enabled: baseEnabled && canTalkInteraction,
                highlighted: canTalkInteraction,
                visible: baseEnabled && canTalkInteraction
            },
            sleep: {
                enabled: canSleepNow,
                highlighted: highlightSleep,
                visible: canSleepNow
            },
            inspect: {
                enabled: baseEnabled && canInspectNow,
                highlighted: canInspectNow,
                visible: baseEnabled && canInspectNow
            },
            drop: {
                enabled: baseEnabled && canDropItem,
                highlighted: canDropItem,
                visible: showDropInHud
            }
        };
    }

    function getActionAvailability(action, activeInteraction = game.state.activeInteraction) {
        const actionState = buildActionAvailabilityState(activeInteraction)[action];

        if (!actionState) {
            return {
                enabled: false,
                highlighted: false,
                visible: false
            };
        }

        return { ...actionState };
    }

    function getTerrainActionHint(target) {
        if (!target) {
            return '';
        }

        const factBlock = buildResourceNodeFactBlock(
            target.profile,
            target.interaction || (target.tileInfo ? target.tileInfo.interaction : null),
            game.state.activeTileInfo || target.tileInfo
        );
        const conversionHint = target.profile && target.profile.conversionHint
            ? ` ${target.profile.conversionHint}`
            : '';
        const durabilityHint = target.profile && target.profile.nodeState === 'used'
            ? ` Узел уже надорван: осталось ${target.profile.durabilityRemaining} из ${target.profile.durabilityMax} сборов.`
            : '';
        const policyHint = target.profile && target.profile.respawnPolicyMode === 'hardLimited' && target.profile.islandLimitMax
            ? ` На острове осталось ${target.profile.islandLimitRemaining} из ${target.profile.islandLimitMax} сборов этого типа.`
            : '';

        if (target.isHarvested) {
            return `Здесь уже ничего не осталось: ${target.profile.sourceLabel} на этой клетке собраны.`;
        }

        if (!isTerrainTargetGatherAvailable(target)) {
            return `${target.profile.requirementMessage || `Рядом есть ${target.profile.sourceLabel}, но сейчас этот ресурс недоступен.`} ${factBlock}${conversionHint}${durabilityHint}${policyHint}`.trim();
        }

        if (target.profile.clickToCollect) {
            return `Рядом есть ${target.profile.sourceLabel}. Кликни по соседнему камню или нажми "Использовать", чтобы собрать ${target.profile.collectedLabel}. ${factBlock}${conversionHint}${durabilityHint}${policyHint}`;
        }

        return `Рядом есть ${target.profile.sourceLabel}. Нажми "Использовать", чтобы собрать ${target.profile.collectedLabel}. ${factBlock}${conversionHint}${durabilityHint}${policyHint}`;
    }

    function getTerrainInspectMessage(target) {
        return getTerrainInspectMessageSafe(target);
    }

    function getTerrainInspectMessageSafe(target) {
        if (!target) {
            return '';
        }

        const tileInfo = target.tileInfo;
        const positionLabel = tileInfo
            ? `\u043a\u043e\u043e\u0440\u0434\u0438\u043d\u0430\u0442\u044b ${tileInfo.x}, ${tileInfo.y}`
            : '\u044d\u0442\u0430 \u043a\u043b\u0435\u0442\u043a\u0430';
        const factBlock = buildResourceNodeFactBlock(
            target.profile,
            target.interaction || (tileInfo ? tileInfo.interaction : null),
            game.state.activeTileInfo || tileInfo
        );
        const conversionHint = target.profile && target.profile.conversionHint
            ? ` ${target.profile.conversionHint}`
            : '';
        const durabilityHint = target.profile && target.profile.nodeState === 'used'
            ? ` Узел уже частично снят: осталось ${target.profile.durabilityRemaining} из ${target.profile.durabilityMax} сборов.`
            : '';
        const policyHint = target.profile && target.profile.respawnPolicyMode === 'hardLimited' && target.profile.islandLimitMax
            ? ` Лимит острова: осталось ${target.profile.islandLimitRemaining} из ${target.profile.islandLimitMax} сборов этого типа.`
            : '';

        if (target.isHarvested) {
            return `\u041e\u0441\u043c\u043e\u0442\u0440: ${target.profile.sourceLabel}, ${positionLabel}. \u0417\u0434\u0435\u0441\u044c \u0443\u0436\u0435 \u043d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043e\u0441\u0442\u0430\u043b\u043e\u0441\u044c, \u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b \u0441\u043e\u0431\u0440\u0430\u043d.`;
        }

        if (!isTerrainTargetGatherAvailable(target)) {
            return `Осмотр: ${target.profile.sourceLabel}, ${positionLabel}. ${target.profile.requirementMessage || 'Сейчас этот узел недоступен.'} ${factBlock}${conversionHint}${durabilityHint}${policyHint}`.trim();
        }

        if (target.profile.clickToCollect) {
            return `Осмотр: ${target.profile.sourceLabel}, ${positionLabel}. Здесь можно собрать ${target.profile.collectedLabel}. ${factBlock} Кликни по соседнему камню или нажми "Использовать".${conversionHint}${durabilityHint}${policyHint}`;
        }

        return `\u041e\u0441\u043c\u043e\u0442\u0440: ${target.profile.sourceLabel}, ${positionLabel}. \u0417\u0434\u0435\u0441\u044c \u043c\u043e\u0436\u043d\u043e \u0441\u043e\u0431\u0440\u0430\u0442\u044c ${target.profile.collectedLabel}. ${factBlock}${conversionHint}${durabilityHint}${policyHint}`;
    }

    getTerrainInspectMessage = getTerrainInspectMessageSafe;

    function getResourceNodeInteractionDescription(interaction) {
        if (!interaction) {
            return '';
        }

        const syncedInteraction = syncResourceNodeInteraction(interaction) || interaction;
        const label = syncedInteraction.label || 'Ресурсный узел';
        const descriptionByResource = {
            grass: 'сырьевой куст травы. Здесь берут raw-слой для лечебной основы, травяной пасты и верёвки.',
            reeds: 'заросли тростника. Здесь берут сырой тростник под лечебную основу и верёвку.',
            stone: 'каменная куча. Даёт сырой камень под блоки и тяжёлые строительные рецепты.',
            rubble: 'щебёночная осыпь. Даёт сырой щебень для засыпки и ремонта.',
            wood: 'дерево или полезная коряга. Даёт сырое дерево под доски и каркасы.',
            water: 'точка воды. Здесь пустая фляга наполняется сырой водой, а для рецептов нужна уже чистая.',
            fish: 'рыболовная точка. Здесь ловят рыбу, если есть удочка.'
        };
        const stateDescription = syncedInteraction.nodeState === 'used'
            ? ` Состояние: ресурс уже частично снят, осталось ${syncedInteraction.durabilityRemaining} из ${syncedInteraction.durabilityMax}.`
            : (syncedInteraction.nodeState === 'depleted'
                ? (syncedInteraction.nodeStateReason === 'islandLimit' && syncedInteraction.islandLimitMax
                    ? ` Состояние: лимит этого ресурса на острове исчерпан (${syncedInteraction.islandLimitConsumed || syncedInteraction.islandLimitMax} из ${syncedInteraction.islandLimitMax}).`
                    : ' Состояние: узел исчерпан.')
                : (syncedInteraction.nodeState === 'regenerating'
                    ? ' Состояние: узел восстанавливается.'
                    : ' Состояние: свежий узел.'));
        const policyDescription = syncedInteraction.respawnPolicyLabel
            ? ` Политика: ${syncedInteraction.respawnPolicyLabel}.`
            : '';
        const gatherProfile = buildResourceNodeGatherProfile(syncedInteraction, game.state.activeTileInfo || null);
        const factBlock = buildResourceNodeFactBlock(
            gatherProfile,
            syncedInteraction,
            game.state.activeTileInfo || null
        );

        return `${label}: ${descriptionByResource[syncedInteraction.resourceId] || 'отдельный ресурсный узел для добычи сырья.'} ${factBlock}${stateDescription}${policyDescription}`;
    }

    function getResourceNodeInteractionAdvice(interaction) {
        if (!interaction) {
            return '';
        }

        const syncedInteraction = syncResourceNodeInteraction(interaction) || interaction;
        const label = syncedInteraction.label || 'Ресурсный узел';
        const adviceByResource = {
            grass: 'раннюю траву выгодно собирать в безопасной части маршрута, пока отклонение от пути ещё дешёвое.',
            reeds: 'тростник полезен у воды как запасной волокнистый ресурс: бери его, когда он закрывает лечение или верёвку без длинного крюка.',
            stone: 'камень лучше брать по дороге на средних островах, когда уже понятно, нужен ли тебе запас под блоки и мосты.',
            rubble: 'щебень хорош как дешёвый стройматериал, но отдельный крюк ради него окупается не всегда.',
            wood: 'дерево особенно ценно перед переправами и ремонтными рецептами, поэтому держи его в плане маршрута заранее.',
            water: 'такие точки воды полезны как опора маршрута: здесь набирают сырую воду, а после длинного крюка удобно восстановиться у колодца.',
            fish: 'к рыболовной точке лучше идти только с удочкой и когда маршрут уже проходит рядом с водой.'
        };
        const stateSuffix = syncedInteraction.nodeState === 'used'
            ? ' Узел уже частично снят, так что если он нужен, добирай остаток без лишнего крюка.'
            : (syncedInteraction.nodeState === 'depleted'
                ? (syncedInteraction.nodeStateReason === 'islandLimit'
                    ? ' Лимит этого ресурса на острове уже выработан.'
                    : ' Этот узел сейчас полностью пуст.')
                : (syncedInteraction.nodeState === 'regenerating'
                    ? ' Этот узел сейчас в фазе восстановления.'
                    : ''));
        const policySuffix = syncedInteraction.respawnPolicyMode === 'hardLimited' && syncedInteraction.islandLimitMax
            ? ` На острове осталось ${syncedInteraction.islandLimitRemaining} из ${syncedInteraction.islandLimitMax} сборов этого типа.`
            : '';
        const gatherProfile = buildResourceNodeGatherProfile(syncedInteraction, game.state.activeTileInfo || null);
        const factBlock = buildResourceNodeFactBlock(
            gatherProfile,
            syncedInteraction,
            game.state.activeTileInfo || null
        );

        return `Изучить: ${label}. Совет: ${adviceByResource[syncedInteraction.resourceId] || 'оценивай узел как часть маршрута, а не как бесплатный клик.'} ${factBlock}${stateSuffix}${policySuffix}`;
    }

    function getInteractionDescription(interaction) {
        if (!interaction) {
            return '';
        }

        const expedition = interaction.expedition || {};
        const label = expedition.label || interaction.label || 'объект';
        const workbenchDescription = expedition.stationId === 'workbench'
            ? 'явная мастерская. Рядом открывается отдельное окно станции только с рецептами мастерской.'
            : 'явный верстак. Рядом открывается отдельное окно станции с рецептами верстака.';

        switch (interaction.kind) {
            case 'merchant':
                return `${label}: странствующий торговец. Здесь можно купить припасы, продать находки и взять поручение.`;
            case 'craft_merchant':
            case 'artisan':
                return `${label}: ремесленный торговец. Он ведёт особые заказы, расширяет сумку и не смешивается с обычной торговлей.`;
            case 'station_keeper':
                return `${label}: хранитель станции. Он отвечает за отдельное ремесленное место и открывает только станционный крафт.`;
            case 'shelter':
                return `${label}: укрытие для отдыха. Здесь можно передохнуть и переждать тяжёлый участок пути.`;
            case 'camp':
                return `${label}: явный лагерный очаг. Здесь собираются походные рецепты, вода и еда.`;
            case 'workbench':
                return `${label}: ${workbenchDescription}`;
            case 'well':
                return `${label}: колодец с чистой водой. Он помогает восстановиться в длинном переходе и служит опорной точкой на маршруте.`;
            case 'forage':
                return `${label}: куст с полевыми ягодами. Ягоды быстро снимают часть голода.`;
            case 'resourceNode':
                return getResourceNodeInteractionDescription(interaction);
            case 'emptyHouse':
                return `${label}: пустой дом. Внутри может не оказаться пользы, но это укрытие и безопасная точка.`;
            case 'trapHouse':
                return `${label}: подозрительный дом-ловушка. Он выглядит рискованно и может дать неприятный исход.`;
            case 'groundItem':
                return inventoryRuntime && typeof inventoryRuntime.getGroundItemDescription === 'function'
                    ? `На земле лежит: ${inventoryRuntime.getGroundItemDescription(interaction)}.`
                    : 'На земле лежит предмет.';
            case 'finalChest':
                return `${label}: финальный сундук с очень редкой наградой. Такие сундуки стоит открывать с пустым местом в сумке.`;
            case 'jackpotChest':
                return `${label}: джекпот-сундук. У него особенно жирная добыча и высокий шанс ценной награды.`;
            case 'chest': {
                const chestTier = expedition.chestTier || 'ordinary';
                const tierLabels = {
                    ordinary: 'обычный сундук',
                    rich: 'богатый сундук',
                    hidden: 'скрытый сундук',
                    cursed: 'проклятый сундук',
                    elite: 'элитный сундук',
                    jackpot: 'джекпот-сундук'
                };
                return `${label}: ${tierLabels[chestTier] || 'сундук'} с наградой. Чем дальше остров, тем выше шанс редких вещей.`;
            }
            default:
                return `${label}: заметный объект на острове.`;
        }
    }

    function getInteractionAdvice(interaction) {
        if (!interaction) {
            return '';
        }

        const expedition = interaction.expedition || {};
        const label = expedition.label || interaction.label || 'объект';
        const workbenchAdvice = expedition.stationId === 'workbench'
            ? 'держи рядом сырьё и подходи к мастерской заранее: отдельное окно станции сразу покажет только рецепты мастерской.'
            : 'подходи к верстаку с сырьём заранее: отдельное окно станции сразу покажет, что собирается именно здесь, а не руками.';

        switch (interaction.kind) {
            case 'merchant':
                return `Изучить: ${label}. Совет: продавай лишние ценности, а дорогие припасы бери перед длинным островом или плохой погодой.`;
            case 'craft_merchant':
            case 'artisan':
                return `Изучить: ${label}. Совет: держи в сумке разные категории вещей, чтобы быстрее закрывать ремесленные заказы и открывать новые слоты.`;
            case 'station_keeper':
                return `Изучить: ${label}. Совет: подходи к хранителю с нужным сырьём заранее: он открывает только станционный крафт и не заменяет обычного торговца.`;
            case 'shelter':
                return `Изучить: ${label}. Совет: укрытие лучше использовать до полного истощения, чтобы не заходить в снежный ком штрафов.`;
            case 'camp':
                return `Изучить: ${label}. Совет: подходи к очагу с флягой, топливом и сырьём заранее: отдельное окно лагеря сразу покажет доступные походные рецепты.`;
            case 'workbench':
                return `Изучить: ${label}. Совет: ${workbenchAdvice}`;
            case 'well':
                return `Изучить: ${label}. Совет: запоминай колодцы на карте и строй маршрут так, чтобы они были промежуточной опорой на длинных островах.`;
            case 'forage':
                return `Изучить: ${label}. Совет: ягоды лучше срывать, когда голод уже заметно просел, а не тратить их заранее на почти полную шкалу.`;
            case 'resourceNode':
                return getResourceNodeInteractionAdvice(interaction);
            case 'emptyHouse':
                return `Изучить: ${label}. Совет: даже пустой дом полезен как безопасная точка и ориентир на карте.`;
            case 'trapHouse':
                return `Изучить: ${label}. Совет: в подозрительные дома лучше заходить с запасом энергии, места в сумке и возможностью быстро отступить.`;
            case 'groundItem':
                return 'Изучить: предмет на земле. Совет: сначала проверь место в сумке, чтобы не потерять более важную находку позже.';
            case 'finalChest':
            case 'jackpotChest':
                return `Изучить: ${label}. Совет: перед открытием освободи слот, проверь состояние героя и не оставляй такую награду на момент полного истощения.`;
            case 'chest': {
                const chestTier = expedition.chestTier || 'ordinary';

                if (chestTier === 'cursed') {
                    return `Изучить: ${label}. Совет: проклятые сундуки лучше трогать, когда у героя есть запас по характеристикам и выход к восстановлению.`;
                }

                if (chestTier === 'hidden') {
                    return `Изучить: ${label}. Совет: скрытые сундуки полезно подбирать по пути, если маршрут и так проходит рядом, без лишнего расхода клеток.`;
                }

                if (chestTier === 'elite' || chestTier === 'rich') {
                    return `Изучить: ${label}. Совет: богатые сундуки особенно выгодны на дальних островах, когда в сумке ещё есть свободный слот под редкий предмет.`;
                }

                return `Изучить: ${label}. Совет: обычный сундук лучше брать по дороге, если он не заставляет тратить лишний маршрут на опасные клетки.`;
            }
            default:
                return `Изучить: ${label}. Совет: оценивай этот объект вместе с маршрутом, погодой и запасом характеристик.`;
        }
    }

    function getTerrainAdviceMessage(target) {
        if (!target) {
            return '';
        }

        const tileInfo = target.tileInfo;
        const positionLabel = tileInfo ? `координаты ${tileInfo.x}, ${tileInfo.y}` : 'эта клетка';

        if (target.isHarvested) {
            return `Изучить: ${target.profile.sourceLabel}, ${positionLabel}. Совет: здесь уже пусто, лучше искать следующий такой ресурс по пути, а не возвращаться.`;
        }

        switch (target.profile.adviceKey || target.profile.itemId) {
            case 'grass':
                return `Изучить: ${target.profile.sourceLabel}, ${positionLabel}. Совет: полевую траву удобно собирать на старте острова, когда маршрут ещё короткий и вокруг много безопасных клеток.`;
            case 'reeds':
                return `Изучить: ${target.profile.sourceLabel}, ${positionLabel}. Совет: тростник хорош как запасной ресурс у воды: из него собирают лечебную основу и верёвку, но сам крюк в тростник должен окупаться маршрутом.`;
            case 'stone':
            case 'rubble':
                return `Изучить: ${target.profile.sourceLabel}, ${positionLabel}. Совет: камень и осыпь лучше брать по дороге, а не делать ради них отдельный дорогой заход.`;
            case 'soil':
            case 'soilClod':
                return `Изучить: ${target.profile.sourceLabel}, ${positionLabel}. Совет: плохой сектор полезен для земли, но заходить туда стоит только с запасом энергии и понятным выходом назад.`;
            case 'wood':
                return `Изучить: ${target.profile.sourceLabel}, ${positionLabel}. Совет: дерево лучше брать перед переправами, ремонтом и длинными островами, когда доски и каркасы могут резко окупить маршрут.`;
            case 'water':
                return `Изучить: ${target.profile.sourceLabel}, ${positionLabel}. Совет: точки воды полезно запоминать как опору маршрута и подводить к ним путь с пустой флягой.`;
            case 'fish':
                return `Изучить: ${target.profile.sourceLabel}, ${positionLabel}. Совет: рыбные точки окупаются, только если у тебя уже есть удочка и заход не ломает темп перехода.`;
            default:
                return `Изучить: ${target.profile.sourceLabel}, ${positionLabel}. Совет: оценивай, стоит ли ресурс лишних клеток и просадки характеристик.`;
        }
    }

    function getTileDisplayLabel(tileInfo) {
        if (!tileInfo) {
            return 'клетка';
        }

        const tileLabel = bridge.getTileLabel(tileInfo.tileType || 'grass');
        const travelLabel = tileInfo.travelLabel || tileLabel;
        return travelLabel !== tileLabel
            ? `${travelLabel} (${tileLabel})`
            : travelLabel;
    }

    function getTileInspectSummary(tileInfo) {
        if (!tileInfo) {
            return 'Выбрана клетка. Нажми "Изучить", чтобы получить совет по местности.';
        }

        const displayLabel = getTileDisplayLabel(tileInfo);
        const bandLabel = bridge.getTravelBandLabel(tileInfo.travelBand || 'normal');
        return `Выбрана клетка: ${displayLabel}. Это ${bandLabel}.`;
    }

    function getTileAdviceMessage(tileInfo) {
        if (!tileInfo) {
            return 'Изучить: местность рядом. Совет: смотри на клетку как на часть маршрута, а не как на отдельный шаг.';
        }

        const displayLabel = getTileDisplayLabel(tileInfo);
        const zoneAdviceByKey = {
            dryTrail: 'это хороший участок для длинного продвижения: по нему удобно экономить силы и выравнивать маршрут.',
            oldBridge: 'старый мост лучше проходить без лишних остановок: он хорош как короткая переправа, а не как место для манёвра.',
            collapseSpan: 'хрупкий пролёт стоит брать только тогда, когда уже виден безопасный выход с другой стороны.',
            coldFord: 'в холодный брод заходи только с запасом, чтобы следующая связка клеток не добила темп.',
            drainingLowland: 'истощающую низину лучше пересекать по делу, а не ради лишней разведки в сторону.',
            badSector: 'плохой сектор окупается только если на нём есть нужный ресурс или короткий путь дальше.',
            cursedTrail: 'заражённую тропу не стоит брать ради мелкой выгоды: вход сюда должен что-то реально выигрывать.',
            riskyProximity: 'рядом опасность, поэтому не задерживайся здесь дольше, чем нужно для прохода.',
            houseDebris: 'у завалов лучше держаться прямого курса и не тратить здесь лишние клетки без пользы.',
            deepMud: 'глубокую грязь стоит брать только при понятной выгоде и с запасом на выход.',
            swamp: 'болото съедает темп, поэтому лучше проходить его по самой короткой линии.',
            dangerPass: 'опасный проход хорош только тогда, когда заметно сокращает дорогу.',
            drainZone: 'зону истощения лучше пересекать быстро и не растягивать на ней манёвр.'
        };
        const tileAdviceByType = {
            trail: 'это удобная клетка для разгона и добора дистанции без лишних потерь.',
            grass: 'нейтральная местность: на ней удобно выравнивать путь перед тяжёлыми участками.',
            shore: 'берег полезен как подход к воде и мостам, но не всегда стоит отдельного крюка.',
            bridge: 'мост ценен как дешёвая переправа, поэтому думай не о нём, а о том, что ждёт сразу за ним.',
            reeds: 'тростник утяжеляет путь, поэтому заходи сюда только если клетка действительно что-то даёт.',
            rubble: 'осыпь лучше пересекать по делу, без длинных петель и лишних остановок.',
            mud: 'грязь быстро съедает темп, так что лишний заход сюда почти всегда плохая сделка.',
            water: 'по воде пешком не пройти: ищи мост, обход или способ быстро сделать переправу.',
            house: 'дом хорош как опорная точка, вокруг него удобно перестраивать дальнейший маршрут.'
        };
        const bandAdviceByKey = {
            cheap: 'это лёгкий участок, на котором удобно экономить силы и добирать ход.',
            normal: 'держи эту клетку в общем ритме маршрута и не делай ради неё лишний крюк.',
            rough: 'тяжёлую клетку лучше брать только тогда, когда она даёт явную выгоду.',
            hazard: 'опасную клетку не стоит брать без запаса и понятного выхода дальше.',
            blocked: 'эта клетка сама по себе не для прохода: нужен обход или специальный способ пересечения.'
        };
        const advice = zoneAdviceByKey[tileInfo.travelZoneKey]
            || tileAdviceByType[tileInfo.tileType]
            || bandAdviceByKey[tileInfo.travelBand]
            || 'смотри на эту местность как на часть маршрута: важен не один шаг, а связка следующих клеток.';

        return `Изучить: ${displayLabel}. Совет: ${advice}`;
    }

    function getInteractionDescriptionSafe(interaction) {
        if (!interaction) {
            return '';
        }

        const expedition = interaction.expedition || {};
        const label = expedition.label || interaction.label || '\u043e\u0431\u044a\u0435\u043a\u0442';
        const merchantDescriptionByRole = {
            fisherman: '\u0440\u044b\u0431\u0430\u043a \u0443 \u0432\u043e\u0434\u044b. \u0423 \u043d\u0435\u0433\u043e \u0435\u0434\u0430, \u0443\u043b\u043e\u0432 \u0438 \u0434\u043e\u0440\u043e\u0436\u043d\u044b\u0435 \u043c\u0435\u043b\u043e\u0447\u0438, \u043d\u043e \u043a\u0430\u0436\u0434\u0430\u044f \u0441\u0434\u0435\u043b\u043a\u0430 \u0434\u043e\u043b\u0436\u043d\u0430 \u043e\u043a\u0443\u043f\u0430\u0442\u044c \u043f\u0443\u0442\u044c.',
            bridgewright: '\u043c\u043e\u0441\u0442\u043e\u0432\u0438\u043a-\u043f\u043b\u043e\u0442\u043d\u0438\u043a. \u0414\u0435\u0440\u0436\u0438\u0442 \u0434\u043e\u0441\u043a\u0438, \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u044b \u0438 \u0432\u0435\u0449\u0438, \u043a\u043e\u0442\u043e\u0440\u044b\u0435 \u044d\u043a\u043e\u043d\u043e\u043c\u044f\u0442 \u0441\u0438\u043b\u044b \u043d\u0430 \u043f\u0435\u0440\u0435\u043f\u0440\u0430\u0432\u0430\u0445.',
            junkDealer: '\u0441\u0442\u0430\u0440\u044c\u0451\u0432\u0449\u0438\u043a. \u0421\u043a\u0443\u043f\u0430\u0435\u0442 \u0441\u043f\u043e\u0440\u043d\u044b\u0439 \u0445\u043b\u0430\u043c, \u0440\u0438\u0441\u043a\u043e\u0432\u0430\u043d\u043d\u044b\u0435 \u043d\u0430\u0445\u043e\u0434\u043a\u0438 \u0438 \u0447\u0430\u0441\u0442\u043e \u0442\u043e\u043b\u043a\u0430\u0435\u0442 \u043d\u0430 \u043d\u0435\u0440\u043e\u0432\u043d\u0443\u044e \u0441\u0434\u0435\u043b\u043a\u0443.',
            storyteller: '\u0441\u0442\u0440\u0430\u043d\u043d\u0438\u043a-\u0440\u0430\u0441\u0441\u043a\u0430\u0437\u0447\u0438\u043a. \u0422\u043e\u0440\u0433\u0443\u0435\u0442 \u0441\u043b\u0443\u0445\u0430\u043c\u0438, \u0440\u0435\u0434\u043a\u0438\u043c\u0438 \u0434\u043e\u0440\u043e\u0436\u043d\u044b\u043c\u0438 \u0432\u0435\u0449\u0430\u043c\u0438 \u0438 \u043f\u043e\u043b\u0435\u0437\u043d\u044b\u043c\u0438 \u043d\u0430\u043c\u0451\u043a\u0430\u043c\u0438.',
            exchanger: '\u043e\u0431\u043c\u0435\u043d\u0449\u0438\u043a. \u0417\u0434\u0435\u0441\u044c \u0432\u0441\u0435\u0433\u0434\u0430 \u0435\u0441\u0442\u044c \u0441\u0438\u043b\u044c\u043d\u0430\u044f \u0441\u0434\u0435\u043b\u043a\u0430, \u043d\u043e \u043e\u043d\u0430 \u043f\u043e\u0447\u0442\u0438 \u0432\u0441\u0435\u0433\u0434\u0430 \u043a\u0443\u0441\u0430\u0435\u0442\u0441\u044f \u0446\u0435\u043d\u043e\u0439.',
            quartermaster: '\u0438\u043d\u0442\u0435\u043d\u0434\u0430\u043d\u0442. \u0420\u0430\u0431\u043e\u0442\u0430\u0435\u0442 \u0441 \u0432\u044b\u0436\u0438\u0432\u0430\u043d\u0438\u0435\u043c, \u043f\u0440\u0438\u043f\u0430\u0441\u0430\u043c\u0438 \u0438 \u043f\u043e\u0445\u043e\u0434\u043d\u043e\u0439 \u0432\u044b\u043a\u043b\u0430\u0434\u043a\u043e\u0439 \u043f\u0435\u0440\u0435\u0434 \u0434\u0430\u043b\u044c\u043d\u0438\u043c\u0438 \u043e\u0441\u0442\u0440\u043e\u0432\u0430\u043c\u0438.',
            collector: '\u043a\u043e\u043b\u043b\u0435\u043a\u0446\u0438\u043e\u043d\u0435\u0440. \u0418\u0449\u0435\u0442 \u0440\u0435\u0434\u043a\u0438\u0435 \u0438 \u0434\u043e\u0440\u043e\u0433\u0438\u0435 \u0432\u0435\u0449\u0438, \u0430 \u0432 \u0435\u0433\u043e \u0442\u043e\u0440\u0433\u0435 \u043f\u043e\u0437\u0434\u043d\u044f\u044f \u0438\u0433\u0440\u0430 \u0443\u0436\u0435 \u0447\u0443\u0432\u0441\u0442\u0432\u0443\u0435\u0442\u0441\u044f \u043e\u0447\u0435\u043d\u044c \u044f\u0432\u043d\u043e.'
        };

        if (interaction.kind === 'groundItem') {
            const inventoryRuntime = getInventoryRuntime();
            return inventoryRuntime && typeof inventoryRuntime.getGroundItemDescription === 'function'
                ? `\u041d\u0430 \u0437\u0435\u043c\u043b\u0435 \u043b\u0435\u0436\u0438\u0442: ${inventoryRuntime.getGroundItemDescription(interaction)}.`
                : '\u041d\u0430 \u0437\u0435\u043c\u043b\u0435 \u043b\u0435\u0436\u0438\u0442 \u043f\u0440\u0435\u0434\u043c\u0435\u0442.';
        }

        if (interaction.kind === 'resourceNode') {
            return getResourceNodeInteractionDescription(interaction);
        }

        if (interaction.kind === 'chest') {
            const chestTier = expedition.chestTier || 'ordinary';
            const tierLabels = {
                ordinary: '\u043e\u0431\u044b\u0447\u043d\u044b\u0439 \u0441\u0443\u043d\u0434\u0443\u043a',
                rich: '\u0431\u043e\u0433\u0430\u0442\u044b\u0439 \u0441\u0443\u043d\u0434\u0443\u043a',
                hidden: '\u0441\u043a\u0440\u044b\u0442\u044b\u0439 \u0441\u0443\u043d\u0434\u0443\u043a',
                cursed: '\u043f\u0440\u043e\u043a\u043b\u044f\u0442\u044b\u0439 \u0441\u0443\u043d\u0434\u0443\u043a',
                elite: '\u044d\u043b\u0438\u0442\u043d\u044b\u0439 \u0441\u0443\u043d\u0434\u0443\u043a',
                jackpot: '\u0434\u0436\u0435\u043a\u043f\u043e\u0442-\u0441\u0443\u043d\u0434\u0443\u043a'
            };
            return `${label}: ${tierLabels[chestTier] || '\u0441\u0443\u043d\u0434\u0443\u043a'} \u0441 \u043d\u0430\u0433\u0440\u0430\u0434\u043e\u0439. \u0427\u0435\u043c \u0434\u0430\u043b\u044c\u0448\u0435 \u043e\u0441\u0442\u0440\u043e\u0432, \u0442\u0435\u043c \u0432\u044b\u0448\u0435 \u0448\u0430\u043d\u0441 \u0440\u0435\u0434\u043a\u0438\u0445 \u0432\u0435\u0449\u0435\u0439.`;
        }

        if (interaction.kind === 'merchant') {
            return `${label}: ${merchantDescriptionByRole[expedition.merchantRole] || '\u0441\u0442\u0440\u0430\u043d\u0441\u0442\u0432\u0443\u044e\u0449\u0438\u0439 \u0442\u043e\u0440\u0433\u043e\u0432\u0435\u0446. \u0417\u0434\u0435\u0441\u044c \u043c\u043e\u0436\u043d\u043e \u043a\u0443\u043f\u0438\u0442\u044c \u043f\u0440\u0438\u043f\u0430\u0441\u044b, \u043f\u0440\u043e\u0434\u0430\u0442\u044c \u043d\u0430\u0445\u043e\u0434\u043a\u0438 \u0438 \u0432\u0437\u044f\u0442\u044c \u043f\u043e\u0440\u0443\u0447\u0435\u043d\u0438\u0435.'}`;
        }

        if (interaction.kind === 'islandOriginalNpc') {
            return `${label}: ${expedition.description || expedition.summary || '\u043e\u0441\u0442\u0440\u043e\u0432\u043d\u043e\u0439 \u0436\u0438\u0442\u0435\u043b\u044c \u0441 \u0438\u0441\u0442\u043e\u0440\u0438\u0435\u0439 \u0438 \u043f\u043e\u043b\u0435\u0437\u043d\u044b\u043c \u0441\u043e\u0432\u0435\u0442\u043e\u043c.'}`;
        }

        const descriptionByKind = {
            craft_merchant: '\u0440\u0435\u043c\u0435\u0441\u043b\u0435\u043d\u043d\u044b\u0439 \u0442\u043e\u0440\u0433\u043e\u0432\u0435\u0446. \u041e\u043d \u0432\u0435\u0434\u0451\u0442 \u043e\u0441\u043e\u0431\u044b\u0435 \u0437\u0430\u043a\u0430\u0437\u044b, \u0440\u0430\u0441\u0448\u0438\u0440\u044f\u0435\u0442 \u0441\u0443\u043c\u043a\u0443 \u0438 \u043d\u0435 \u0441\u043c\u0435\u0448\u0438\u0432\u0430\u0435\u0442\u0441\u044f \u0441 \u043e\u0431\u044b\u0447\u043d\u043e\u0439 \u043b\u0430\u0432\u043a\u043e\u0439.',
            artisan: '\u0440\u0435\u043c\u0435\u0441\u043b\u0435\u043d\u043d\u0438\u043a \u043f\u043e \u0441\u0443\u043c\u043a\u0430\u043c. \u041e\u043d \u043e\u0442\u043a\u0440\u044b\u0432\u0430\u0435\u0442 \u043d\u043e\u0432\u044b\u0435 \u0441\u043b\u043e\u0442\u044b \u0438 \u0441\u043e\u0431\u0438\u0440\u0430\u0435\u0442 \u043e\u0441\u043e\u0431\u044b\u0435 \u043d\u0430\u0431\u043e\u0440\u044b \u0432\u0435\u0449\u0435\u0439.',
            station_keeper: '\u0445\u0440\u0430\u043d\u0438\u0442\u0435\u043b\u044c \u0441\u0442\u0430\u043d\u0446\u0438\u0438. \u041e\u043d \u043e\u0442\u0432\u0435\u0447\u0430\u0435\u0442 \u0437\u0430 \u043e\u0442\u0434\u0435\u043b\u044c\u043d\u043e\u0435 \u0440\u0435\u043c\u0435\u0441\u043b\u0435\u043d\u043d\u043e\u0435 \u043c\u0435\u0441\u0442\u043e \u0438 \u043e\u0442\u043a\u0440\u044b\u0432\u0430\u0435\u0442 \u0442\u043e\u043b\u044c\u043a\u043e \u0441\u0442\u0430\u043d\u0446\u0438\u043e\u043d\u043d\u044b\u0439 \u043a\u0440\u0430\u0444\u0442.',
            shelter: '\u0443\u043a\u0440\u044b\u0442\u0438\u0435 \u0434\u043b\u044f \u043e\u0442\u0434\u044b\u0445\u0430. \u0417\u0434\u0435\u0441\u044c \u043c\u043e\u0436\u043d\u043e \u043f\u0435\u0440\u0435\u0434\u043e\u0445\u043d\u0443\u0442\u044c \u0438 \u043f\u0435\u0440\u0435\u0436\u0434\u0430\u0442\u044c \u0442\u044f\u0436\u0451\u043b\u044b\u0439 \u0443\u0447\u0430\u0441\u0442\u043e\u043a \u043f\u0443\u0442\u0438.',
            camp: '\u044f\u0432\u043d\u044b\u0439 \u043b\u0430\u0433\u0435\u0440\u043d\u044b\u0439 \u043e\u0447\u0430\u0433. \u0418\u043c\u0435\u043d\u043d\u043e \u0437\u0434\u0435\u0441\u044c \u043e\u0442\u043a\u0440\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u043b\u0430\u0433\u0435\u0440\u043d\u044b\u0439 \u043a\u0440\u0430\u0444\u0442 \u0434\u043b\u044f \u0432\u043e\u0434\u044b, \u0435\u0434\u044b \u0438 \u043f\u043e\u0445\u043e\u0434\u043d\u044b\u0445 \u0440\u0435\u0446\u0435\u043f\u0442\u043e\u0432.',
            workbench: '\u044f\u0432\u043d\u044b\u0439 \u0432\u0435\u0440\u0441\u0442\u0430\u043a \u0438\u043b\u0438 \u043c\u0430\u0441\u0442\u0435\u0440\u0441\u043a\u0430\u044f. \u041e\u0442\u043a\u0440\u043e\u0439 \u0441\u0443\u043c\u043a\u0443 \u0440\u044f\u0434\u043e\u043c, \u0447\u0442\u043e\u0431\u044b \u0443\u0432\u0438\u0434\u0435\u0442\u044c \u0441\u043f\u0438\u0441\u043e\u043a \u0440\u0435\u0446\u0435\u043f\u0442\u043e\u0432 \u043f\u043e \u0441\u0442\u0430\u043d\u0446\u0438\u044f\u043c.',
            well: '\u043a\u043e\u043b\u043e\u0434\u0435\u0446 \u0441 \u0447\u0438\u0441\u0442\u043e\u0439 \u0432\u043e\u0434\u043e\u0439. \u041e\u043d \u043f\u043e\u043c\u043e\u0433\u0430\u0435\u0442 \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u044c\u0441\u044f \u0432 \u0434\u043b\u0438\u043d\u043d\u043e\u043c \u043f\u0435\u0440\u0435\u0445\u043e\u0434\u0435.',
            forage: '\u043a\u0443\u0441\u0442 \u0441 \u043f\u043e\u043b\u0435\u0432\u044b\u043c\u0438 \u044f\u0433\u043e\u0434\u0430\u043c\u0438. \u042f\u0433\u043e\u0434\u044b \u0431\u044b\u0441\u0442\u0440\u043e \u0441\u043d\u0438\u043c\u0430\u044e\u0442 \u0447\u0430\u0441\u0442\u044c \u0433\u043e\u043b\u043e\u0434\u0430.',
            emptyHouse: '\u043f\u0443\u0441\u0442\u043e\u0439 \u0434\u043e\u043c. \u0412\u043d\u0443\u0442\u0440\u0438 \u043c\u043e\u0436\u0435\u0442 \u043d\u0435 \u043e\u043a\u0430\u0437\u0430\u0442\u044c\u0441\u044f \u043f\u043e\u043b\u044c\u0437\u044b, \u043d\u043e \u044d\u0442\u043e \u0443\u043a\u0440\u044b\u0442\u0438\u0435 \u0438 \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u0430\u044f \u0442\u043e\u0447\u043a\u0430.',
            trapHouse: '\u043f\u043e\u0434\u043e\u0437\u0440\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u0434\u043e\u043c-\u043b\u043e\u0432\u0443\u0448\u043a\u0430. \u041e\u043d \u0432\u044b\u0433\u043b\u044f\u0434\u0438\u0442 \u0440\u0438\u0441\u043a\u043e\u0432\u0430\u043d\u043d\u043e \u0438 \u043c\u043e\u0436\u0435\u0442 \u0434\u0430\u0442\u044c \u043d\u0435\u043f\u0440\u0438\u044f\u0442\u043d\u044b\u0439 \u0438\u0441\u0445\u043e\u0434.',
            finalChest: '\u0444\u0438\u043d\u0430\u043b\u044c\u043d\u044b\u0439 \u0441\u0443\u043d\u0434\u0443\u043a \u0441 \u043e\u0447\u0435\u043d\u044c \u0440\u0435\u0434\u043a\u043e\u0439 \u043d\u0430\u0433\u0440\u0430\u0434\u043e\u0439. \u0422\u0430\u043a\u0438\u0435 \u0441\u0443\u043d\u0434\u0443\u043a\u0438 \u0441\u0442\u043e\u0438\u0442 \u043e\u0442\u043a\u0440\u044b\u0432\u0430\u0442\u044c \u0441 \u043f\u0443\u0441\u0442\u044b\u043c \u043c\u0435\u0441\u0442\u043e\u043c \u0432 \u0441\u0443\u043c\u043a\u0435.',
            jackpotChest: '\u0434\u0436\u0435\u043a\u043f\u043e\u0442-\u0441\u0443\u043d\u0434\u0443\u043a. \u0423 \u043d\u0435\u0433\u043e \u043e\u0441\u043e\u0431\u0435\u043d\u043d\u043e \u0436\u0438\u0440\u043d\u0430\u044f \u0434\u043e\u0431\u044b\u0447\u0430 \u0438 \u0432\u044b\u0441\u043e\u043a\u0438\u0439 \u0448\u0430\u043d\u0441 \u0446\u0435\u043d\u043d\u043e\u0439 \u043d\u0430\u0433\u0440\u0430\u0434\u044b.'
        };

        return `${label}: ${descriptionByKind[interaction.kind] || '\u0437\u0430\u043c\u0435\u0442\u043d\u044b\u0439 \u043e\u0431\u044a\u0435\u043a\u0442 \u043d\u0430 \u043e\u0441\u0442\u0440\u043e\u0432\u0435.'}`;
    }

    function getInteractionAdviceSafe(interaction) {
        if (!interaction) {
            return '';
        }

        const expedition = interaction.expedition || {};
        const label = expedition.label || interaction.label || '\u043e\u0431\u044a\u0435\u043a\u0442';
        const merchantAdviceByRole = {
            fisherman: '\u0434\u0435\u0440\u0436\u0438 \u0434\u043b\u044f \u043d\u0435\u0433\u043e \u0435\u0434\u0443, \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u044b \u0438 \u043f\u0440\u043e\u0441\u0442\u044b\u0435 \u0446\u0435\u043d\u043d\u043e\u0441\u0442\u0438: \u043e\u043d \u0445\u043e\u0440\u043e\u0448 \u0434\u043b\u044f \u043a\u043e\u0440\u043e\u0442\u043a\u043e\u0439 \u0434\u043e\u043e\u043a\u0443\u043f\u043a\u0438 \u043f\u0435\u0440\u0435\u0434 \u0434\u043b\u0438\u043d\u043d\u044b\u043c \u043c\u0430\u0440\u0448\u0440\u0443\u0442\u043e\u043c.',
            bridgewright: '\u0438\u0449\u0438 \u0443 \u043d\u0435\u0433\u043e \u0432\u0435\u0449\u0438 \u043d\u0430 \u0434\u0432\u0438\u0436\u0435\u043d\u0438\u0435 \u0438 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u044b, \u043a\u043e\u0433\u0434\u0430 \u0432\u043f\u0435\u0440\u0435\u0434\u0438 \u0443\u0437\u043a\u0438\u0435 \u043f\u0435\u0440\u0435\u0445\u043e\u0434\u044b, \u043c\u043e\u0441\u0442\u044b \u0438 \u0434\u043e\u0440\u043e\u0433\u0438\u0435 \u043a\u043b\u0435\u0442\u043a\u0438.',
            junkDealer: '\u043d\u0435 \u043d\u0435\u0441\u0438 \u0435\u043c\u0443 \u043b\u0443\u0447\u0448\u0438\u0435 \u0432\u0435\u0449\u0438 \u0431\u0435\u0437 \u0441\u0447\u0451\u0442\u0430: \u0443 \u0441\u0442\u0430\u0440\u044c\u0451\u0432\u0449\u0438\u043a\u0430 \u0432\u044b\u0433\u043e\u0434\u0430 \u0447\u0430\u0441\u0442\u043e \u043f\u0440\u044f\u0447\u0435\u0442\u0441\u044f \u0432 \u043d\u0435\u0440\u043e\u0432\u043d\u043e\u0439 \u0441\u0434\u0435\u043b\u043a\u0435.',
            storyteller: '\u0441\u044e\u0434\u0430 \u0441\u0442\u043e\u0438\u0442 \u0437\u0430\u0445\u043e\u0434\u0438\u0442\u044c, \u043a\u043e\u0433\u0434\u0430 \u043d\u0443\u0436\u043d\u044b \u0443\u0442\u0438\u043b\u0438\u0442\u0430, \u043f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0438 \u0438\u043b\u0438 \u0433\u0438\u0431\u043a\u0438\u0439 \u043f\u043e\u043a\u0443\u043f\u0430\u0442\u0435\u043b\u044c \u043f\u043e\u0434 \u043d\u0435\u043e\u0447\u0435\u0432\u0438\u0434\u043d\u0443\u044e \u0441\u0438\u0442\u0443\u0430\u0446\u0438\u044e.',
            exchanger: '\u0437\u0430\u0445\u043e\u0434\u0438 \u043a \u043d\u0435\u043c\u0443 \u0442\u043e\u043b\u044c\u043a\u043e \u0441 \u043f\u043e\u043d\u044f\u0442\u043d\u044b\u043c \u043f\u043b\u0430\u043d\u043e\u043c: \u043e\u043d \u043f\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u0436\u0430\u0434\u043d\u043e\u0441\u0442\u044c \u0432 \u043b\u0438\u0448\u043d\u0438\u0435 \u043f\u043e\u0442\u0435\u0440\u0438, \u0435\u0441\u043b\u0438 \u0431\u0440\u0430\u0442\u044c \u0432\u0441\u0451 \u043f\u043e\u0434\u0440\u044f\u0434.',
            quartermaster: '\u0443 \u0438\u043d\u0442\u0435\u043d\u0434\u0430\u043d\u0442\u0430 \u0431\u0435\u0440\u0438 \u0442\u043e, \u0447\u0442\u043e \u043d\u0430\u043f\u0440\u044f\u043c\u0443\u044e \u0443\u0434\u0435\u0440\u0436\u0438\u0442 \u0431\u0438\u043b\u0434 \u0432 \u0440\u0430\u0431\u043e\u0447\u0435\u043c \u0441\u043e\u0441\u0442\u043e\u044f\u043d\u0438\u0438, \u0430 \u043d\u0435 \u043f\u0440\u043e\u0441\u0442\u043e \u043f\u0440\u043e\u0435\u0441\u0442 \u0437\u043e\u043b\u043e\u0442\u043e.',
            collector: '\u0441\u044e\u0434\u0430 \u0441\u0442\u043e\u0438\u0442 \u0438\u0434\u0442\u0438 \u0441 \u0440\u0435\u0434\u043a\u043e\u0441\u0442\u044f\u043c\u0438 \u0438 \u043f\u043e\u043d\u0438\u043c\u0430\u043d\u0438\u0435\u043c, \u0447\u0442\u043e \u0442\u044b \u0433\u043e\u0442\u043e\u0432 \u043c\u0435\u043d\u044f\u0442\u044c \u0432 \u043f\u043e\u0437\u0434\u043d\u0435\u0439 \u0438\u0433\u0440\u0435.'
        };

        if (interaction.kind === 'merchant') {
            return `\u0418\u0437\u0443\u0447\u0438\u0442\u044c: ${label}. \u0421\u043e\u0432\u0435\u0442: ${merchantAdviceByRole[expedition.merchantRole] || '\u043f\u0440\u043e\u0434\u0430\u0432\u0430\u0439 \u043b\u0438\u0448\u043d\u0438\u0435 \u0446\u0435\u043d\u043d\u043e\u0441\u0442\u0438, \u0430 \u0434\u043e\u0440\u043e\u0433\u0438\u0435 \u043f\u0440\u0438\u043f\u0430\u0441\u044b \u0431\u0435\u0440\u0438 \u043f\u0435\u0440\u0435\u0434 \u0434\u043b\u0438\u043d\u043d\u044b\u043c \u043e\u0441\u0442\u0440\u043e\u0432\u043e\u043c \u0438\u043b\u0438 \u043f\u043b\u043e\u0445\u043e\u0439 \u043f\u043e\u0433\u043e\u0434\u043e\u0439.'}`;
        }

        if (interaction.kind === 'islandOriginalNpc') {
            return `\u0418\u0437\u0443\u0447\u0438\u0442\u044c: ${label}. \u0421\u043e\u0432\u0435\u0442: ${expedition.advice || '\u0441\u0442\u043e\u0438\u0442 \u0437\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u0442\u044c \u0442\u0430\u043a\u0438\u0445 \u043b\u044e\u0434\u0435\u0439: \u043e\u043d\u0438 \u0447\u0430\u0441\u0442\u043e \u0434\u0430\u044e\u0442 \u043f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0443 \u0438\u043b\u0438 \u0440\u0430\u0437\u043e\u0432\u0443\u044e \u0432\u0435\u0449\u044c, \u043a\u043e\u0442\u043e\u0440\u0430\u044f \u043e\u043a\u0443\u043f\u0430\u0435\u0442 \u0434\u0430\u043b\u044c\u043d\u0438\u0439 \u043c\u0430\u0440\u0448\u0440\u0443\u0442.'}`;
        }

        if (interaction.kind === 'craft_merchant' || interaction.kind === 'artisan') {
            return `\u0418\u0437\u0443\u0447\u0438\u0442\u044c: ${label}. \u0421\u043e\u0432\u0435\u0442: \u0434\u0435\u0440\u0436\u0438 \u0432 \u0441\u0443\u043c\u043a\u0435 \u0440\u0430\u0437\u043d\u044b\u0435 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438 \u0432\u0435\u0449\u0435\u0439, \u0447\u0442\u043e\u0431\u044b \u0431\u044b\u0441\u0442\u0440\u0435\u0435 \u0437\u0430\u043a\u0440\u044b\u0432\u0430\u0442\u044c \u0440\u0435\u043c\u0435\u0441\u043b\u0435\u043d\u043d\u044b\u0435 \u0437\u0430\u043a\u0430\u0437\u044b \u043d\u0430 \u043d\u043e\u0432\u044b\u0435 \u0441\u043b\u043e\u0442\u044b.`;
        }

        if (interaction.kind === 'station_keeper') {
            return `\u0418\u0437\u0443\u0447\u0438\u0442\u044c: ${label}. \u0421\u043e\u0432\u0435\u0442: \u0445\u0440\u0430\u043d\u0438 \u0443 \u0442\u0430\u043a\u043e\u0433\u043e NPC \u0438\u043c\u0435\u043d\u043d\u043e \u043f\u0440\u043e\u0444\u0438\u043b\u044c\u043d\u044b\u0435 \u043a\u043e\u043c\u043f\u043e\u043d\u0435\u043d\u0442\u044b: \u043e\u043d \u043e\u0442\u043a\u0440\u044b\u0432\u0430\u0435\u0442 \u0441\u0442\u0430\u043d\u0446\u0438\u043e\u043d\u043d\u044b\u0439 \u043a\u0440\u0430\u0444\u0442, \u0430 \u043d\u0435 \u043e\u0431\u044b\u0447\u043d\u0443\u044e \u0442\u043e\u0440\u0433\u043e\u0432\u043b\u044e.`;
        }

        if (interaction.kind === 'groundItem') {
            return '\u0418\u0437\u0443\u0447\u0438\u0442\u044c: \u043f\u0440\u0435\u0434\u043c\u0435\u0442 \u043d\u0430 \u0437\u0435\u043c\u043b\u0435. \u0421\u043e\u0432\u0435\u0442: \u0441\u043d\u0430\u0447\u0430\u043b\u0430 \u043f\u0440\u043e\u0432\u0435\u0440\u044c \u043c\u0435\u0441\u0442\u043e \u0432 \u0441\u0443\u043c\u043a\u0435, \u0447\u0442\u043e\u0431\u044b \u043d\u0435 \u043f\u043e\u0442\u0435\u0440\u044f\u0442\u044c \u0431\u043e\u043b\u0435\u0435 \u0432\u0430\u0436\u043d\u0443\u044e \u043d\u0430\u0445\u043e\u0434\u043a\u0443 \u043f\u043e\u0437\u0436\u0435.';
        }

        if (interaction.kind === 'resourceNode') {
            return getResourceNodeInteractionAdvice(interaction);
        }

        if (interaction.kind === 'chest' || interaction.kind === 'finalChest' || interaction.kind === 'jackpotChest') {
            const chestTier = expedition.chestTier || interaction.kind;
            if (chestTier === 'cursed') {
                return `\u0418\u0437\u0443\u0447\u0438\u0442\u044c: ${label}. \u0421\u043e\u0432\u0435\u0442: \u043f\u0440\u043e\u043a\u043b\u044f\u0442\u044b\u0435 \u0441\u0443\u043d\u0434\u0443\u043a\u0438 \u043b\u0443\u0447\u0448\u0435 \u0442\u0440\u043e\u0433\u0430\u0442\u044c, \u043a\u043e\u0433\u0434\u0430 \u0443 \u0433\u0435\u0440\u043e\u044f \u0435\u0441\u0442\u044c \u0437\u0430\u043f\u0430\u0441 \u043f\u043e \u0445\u0430\u0440\u0430\u043a\u0442\u0435\u0440\u0438\u0441\u0442\u0438\u043a\u0430\u043c \u0438 \u0432\u044b\u0445\u043e\u0434 \u043a \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u044e.`;
            }

            return `\u0418\u0437\u0443\u0447\u0438\u0442\u044c: ${label}. \u0421\u043e\u0432\u0435\u0442: \u043f\u0435\u0440\u0435\u0434 \u043e\u0442\u043a\u0440\u044b\u0442\u0438\u0435\u043c \u043e\u0441\u0432\u043e\u0431\u043e\u0434\u0438 \u0441\u043b\u043e\u0442, \u043f\u0440\u043e\u0432\u0435\u0440\u044c \u0441\u043e\u0441\u0442\u043e\u044f\u043d\u0438\u0435 \u0433\u0435\u0440\u043e\u044f \u0438 \u043d\u0435 \u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0439 \u0442\u0430\u043a\u0443\u044e \u043d\u0430\u0433\u0440\u0430\u0434\u0443 \u043d\u0430 \u043c\u043e\u043c\u0435\u043d\u0442 \u043f\u043e\u043b\u043d\u043e\u0433\u043e \u0438\u0441\u0442\u043e\u0449\u0435\u043d\u0438\u044f.`;
        }

        const adviceByKind = {
            shelter: '\u0443\u043a\u0440\u044b\u0442\u0438\u0435 \u043b\u0443\u0447\u0448\u0435 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c \u0434\u043e \u043f\u043e\u043b\u043d\u043e\u0433\u043e \u0438\u0441\u0442\u043e\u0449\u0435\u043d\u0438\u044f, \u0447\u0442\u043e\u0431\u044b \u043d\u0435 \u0437\u0430\u0445\u043e\u0434\u0438\u0442\u044c \u0432 \u0441\u043d\u0435\u0436\u043d\u044b\u0439 \u043a\u043e\u043c \u0448\u0442\u0440\u0430\u0444\u043e\u0432.',
            camp: '\u043f\u043e\u0434\u0445\u043e\u0434\u0438 \u043a \u043b\u0430\u0433\u0435\u0440\u043d\u043e\u043c\u0443 \u043e\u0447\u0430\u0433\u0443 \u0441 \u0444\u043b\u044f\u0433\u043e\u0439, \u0442\u043e\u043f\u043b\u0438\u0432\u043e\u043c \u0438 \u0441\u044b\u0440\u044c\u0451\u043c: \u0442\u043e\u043b\u044c\u043a\u043e \u043e\u043d \u043e\u0442\u043a\u0440\u044b\u0432\u0430\u0435\u0442 \u043b\u0430\u0433\u0435\u0440\u043d\u044b\u0435 \u0440\u0435\u0446\u0435\u043f\u0442\u044b.',
            workbench: '\u043f\u043e\u0434\u0445\u043e\u0434\u0438 \u043a \u0441\u0442\u0430\u043d\u0446\u0438\u0438 \u0441 \u0441\u044b\u0440\u044c\u0451\u043c \u0438 \u043e\u0442\u043a\u0440\u044b\u0432\u0430\u0439 \u0441\u0443\u043c\u043a\u0443 \u0440\u044f\u0434\u043e\u043c: \u0442\u0430\u043c \u0442\u0435\u043f\u0435\u0440\u044c \u0432\u0438\u0434\u043d\u043e, \u0447\u0442\u043e \u0441\u043e\u0431\u0438\u0440\u0430\u0435\u0442\u0441\u044f \u0438\u043c\u0435\u043d\u043d\u043e \u043d\u0430 \u0432\u0435\u0440\u0441\u0442\u0430\u043a\u0435 \u0438 \u0432 \u043c\u0430\u0441\u0442\u0435\u0440\u0441\u043a\u043e\u0439.',
            well: '\u0437\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u0439 \u043a\u043e\u043b\u043e\u0434\u0446\u044b \u043d\u0430 \u043a\u0430\u0440\u0442\u0435 \u0438 \u0441\u0442\u0440\u043e\u0439 \u043c\u0430\u0440\u0448\u0440\u0443\u0442 \u0442\u0430\u043a, \u0447\u0442\u043e\u0431\u044b \u043e\u043d\u0438 \u0431\u044b\u043b\u0438 \u043f\u0440\u043e\u043c\u0435\u0436\u0443\u0442\u043e\u0447\u043d\u043e\u0439 \u043e\u043f\u043e\u0440\u043e\u0439 \u043d\u0430 \u0434\u043b\u0438\u043d\u043d\u044b\u0445 \u043e\u0441\u0442\u0440\u043e\u0432\u0430\u0445.',
            forage: '\u044f\u0433\u043e\u0434\u044b \u043b\u0443\u0447\u0448\u0435 \u0441\u0440\u044b\u0432\u0430\u0442\u044c, \u043a\u043e\u0433\u0434\u0430 \u0433\u043e\u043b\u043e\u0434 \u0443\u0436\u0435 \u0437\u0430\u043c\u0435\u0442\u043d\u043e \u043f\u0440\u043e\u0441\u0435\u043b, \u0430 \u043d\u0435 \u0442\u0440\u0430\u0442\u0438\u0442\u044c \u0438\u0445 \u0437\u0430\u0440\u0430\u043d\u0435\u0435 \u043d\u0430 \u043f\u043e\u0447\u0442\u0438 \u043f\u043e\u043b\u043d\u0443\u044e \u0448\u043a\u0430\u043b\u0443.',
            emptyHouse: '\u0434\u0430\u0436\u0435 \u043f\u0443\u0441\u0442\u043e\u0439 \u0434\u043e\u043c \u043f\u043e\u043b\u0435\u0437\u0435\u043d \u043a\u0430\u043a \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u0430\u044f \u0442\u043e\u0447\u043a\u0430 \u0438 \u043e\u0440\u0438\u0435\u043d\u0442\u0438\u0440 \u043d\u0430 \u043a\u0430\u0440\u0442\u0435.',
            trapHouse: '\u0432 \u043f\u043e\u0434\u043e\u0437\u0440\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u0434\u043e\u043c\u0430 \u043b\u0443\u0447\u0448\u0435 \u0437\u0430\u0445\u043e\u0434\u0438\u0442\u044c \u0441 \u0437\u0430\u043f\u0430\u0441\u043e\u043c \u044d\u043d\u0435\u0440\u0433\u0438\u0438, \u043c\u0435\u0441\u0442\u0430 \u0432 \u0441\u0443\u043c\u043a\u0435 \u0438 \u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u044c\u044e \u0431\u044b\u0441\u0442\u0440\u043e \u043e\u0442\u0441\u0442\u0443\u043f\u0438\u0442\u044c.'
        };

        return `\u0418\u0437\u0443\u0447\u0438\u0442\u044c: ${label}. \u0421\u043e\u0432\u0435\u0442: ${adviceByKind[interaction.kind] || '\u043e\u0446\u0435\u043d\u0438\u0432\u0430\u0439 \u044d\u0442\u043e\u0442 \u043e\u0431\u044a\u0435\u043a\u0442 \u0432\u043c\u0435\u0441\u0442\u0435 \u0441 \u043c\u0430\u0440\u0448\u0440\u0443\u0442\u043e\u043c, \u043f\u043e\u0433\u043e\u0434\u043e\u0439 \u0438 \u0437\u0430\u043f\u0430\u0441\u043e\u043c \u0445\u0430\u0440\u0430\u043a\u0442\u0435\u0440\u0438\u0441\u0442\u0438\u043a.'}`;
    }

    function getContainerActionHint(item) {
        const containerRegistry = getContainerRegistry();
        const containerState = containerRegistry && typeof containerRegistry.getContainerStateByItemId === 'function'
            ? containerRegistry.getContainerStateByItemId(item && item.id ? item.id : '')
            : null;

        if (!containerState) {
            return '';
        }

        const activeInteraction = game.state.activeInteraction || null;
        const encounter = bridge.getHouseEncounter(activeInteraction);
        const interactions = getInteractionsRuntime();
        const world = game.systems.world || null;
        const playerPos = game.state.playerPos || { x: 0, y: 0 };
        const selectedTile = game.state.selectedWorldTile || null;
        const nearbyPositions = getNearbyGridPositions(playerPos.x, playerPos.y);
        if (selectedTile) {
            const selectedDistance = getGridReachDistance(playerPos.x, playerPos.y, selectedTile.x, selectedTile.y);
            if (selectedDistance <= 1) {
                nearbyPositions.unshift({
                    x: Math.round(selectedTile.x),
                    y: Math.round(selectedTile.y)
                });
            }
        }
        const seenPositions = new Set();
        let nearbyWaterSource = null;

        for (const position of nearbyPositions) {
            const key = `${position.x},${position.y}`;
            if (seenPositions.has(key)) {
                continue;
            }

            seenPositions.add(key);
            const tileInfo = world && typeof world.getTileInfo === 'function'
                ? world.getTileInfo(position.x, position.y, { generateIfMissing: false })
                : null;
            const interaction = tileInfo && tileInfo.interaction
                ? tileInfo.interaction
                : (interactions && typeof interactions.getInteractionAtWorld === 'function'
                    ? interactions.getInteractionAtWorld(position.x, position.y, { generateIfMissing: false })
                    : null);

            if (interaction && interaction.kind === 'resourceNode' && interaction.resourceNodeKind === 'waterSource') {
                nearbyWaterSource = interaction;
                break;
            }
        }

        if (
            containerState.id === 'waterFlaskEmpty'
            && nearbyWaterSource
        ) {
            return `Выбрана пустая фляга. Нажми "Использовать", чтобы набрать сырую воду у "${nearbyWaterSource.label || 'точки воды'}".`;
        }

        if (containerState.drinkable) {
            return `Выбран предмет: ${item.label}. Нажми "Использовать", чтобы выпить и вернуть пустую флягу.`;
        }

        return `Выбран предмет: ${item.label}. Нажми "Осмотреть", чтобы увидеть состояние контейнера.`;
    }

    function describeSelectedWorldTarget(selection = {}) {
        const tileInfo = selection.tileInfo || getSelectedWorldTileInfo();
        const interaction = selection.interaction || getSelectedWorldInteraction(tileInfo);
        const terrainTarget = getTerrainTargetForTile(tileInfo, { includeHarvested: true });

        if (interaction && interaction.kind !== 'groundItem') {
            bridge.setActionMessage(getInteractionDescriptionSafe(interaction));
            bridge.renderAfterStateChange(['location', 'actions', 'actionHint']);
            return true;
        }

        if (interaction && interaction.kind === 'groundItem') {
            bridge.setActionMessage(getInteractionDescriptionSafe(interaction));
            bridge.renderAfterStateChange(['location', 'actions', 'actionHint']);
            return true;
        }

        if (terrainTarget) {
            bridge.setActionMessage(getTerrainInspectMessageSafe(terrainTarget));
            bridge.renderAfterStateChange(['location', 'actions', 'actionHint']);
            return true;
        }

        if (tileInfo) {
            bridge.setActionMessage(`${getTileInspectSummary(tileInfo)} Нажми "Изучить", чтобы получить совет по этой клетке.`);
            bridge.renderAfterStateChange(['location', 'actions', 'actionHint']);
            return true;
        }

        return false;
    }

    function getDefaultActionHint(activeInteraction, tileInfo) {
        const inventoryRuntime = getInventoryRuntime();
        const itemEffects = getItemEffects();
        const selectedItem = getSelectedInventoryItem();
        const groundItem = inventoryRuntime ? inventoryRuntime.getCurrentGroundItem() : null;
        const encounter = bridge.getHouseEncounter(activeInteraction);
        const terrainTarget = getInspectableTerrainTarget();
        const selectedWorldTileInfo = getSelectedWorldTileInfo();
        const selectedWorldInteraction = getSelectedWorldInteraction(selectedWorldTileInfo);
        const selectedWorldTerrain = getTerrainTargetForTile(selectedWorldTileInfo, { includeHarvested: true });
        const penaltySummary = bridge.getActivePenaltySummary(tileInfo, 3);
        const hasRoute = Array.isArray(game.state.route) && game.state.route.length > 0 && !game.state.isMoving;

        if (selectedItem) {
            const containerHint = getContainerActionHint(selectedItem);
            if (containerHint) {
                return containerHint;
            }

            if (itemEffects && itemEffects.isBridgeBuilderItem(selectedItem.id)) {
                return `Выбран предмет: ${selectedItem.label}. Подойди к узкому водному проходу и нажми "Использовать", чтобы уложить мост.`;
            }

            if (itemEffects && typeof itemEffects.canUseInventoryItem === 'function' && itemEffects.canUseInventoryItem(selectedItem)) {
                return `Выбран предмет: ${selectedItem.label}. Нажми "Использовать" для активации или "Осмотреть" для описания.`;
            }

            return `Выбран предмет: ${selectedItem.label}. Нажми "Осмотреть", чтобы увидеть описание.`;
        }

        if (selectedWorldInteraction) {
            return `${getInteractionDescriptionSafe(selectedWorldInteraction)} Нажми "Изучить", чтобы получить совет по прохождению.`;
        }

        if (selectedWorldTerrain) {
            return `${getTerrainInspectMessageSafe(selectedWorldTerrain)} Нажми "Изучить", чтобы увидеть совет по этой клетке.`;
        }

        if (selectedWorldTileInfo) {
            return `${getTileInspectSummary(selectedWorldTileInfo)} Нажми "Изучить", чтобы получить совет по этой клетке.`;
        }

        if (hasRoute) {
            const previewSuffix = game.state.routePreviewLength > game.state.route.length
                ? ` из ${game.state.routePreviewLength}`
                : '';
            const totalCost = bridge.formatRouteCost(game.state.routeTotalCost);
            const isExactPreview = game.state.routePreviewIsExact !== false;
            const fullCostSuffix = isExactPreview && game.state.routePreviewLength > game.state.route.length
                ? ` Полный путь стоит ${bridge.formatRouteCost(game.state.routePreviewTotalCost)}.`
                : '';
            const previewPrefix = isExactPreview ? 'Маршрут готов' : 'Быстрый маршрут готов';
            const previewResolveSuffix = isExactPreview
                ? ''
                : ' Можно стартовать сразу: дальняя часть пути догрузится и уточнится по мере движения.';

            return `${previewPrefix}: ${game.state.route.length}${previewSuffix} клеток, цена ${totalCost}. Нажми кнопку движения, пробел или кликни по выбранной клетке ещё раз.${fullCostSuffix}${previewResolveSuffix}`;
        }

        if (groundItem && inventoryRuntime) {
            return `Под ногами лежит: ${inventoryRuntime.getGroundItemDescription(groundItem)}. Нажми "Использовать", чтобы подобрать.`;
        }

        if (itemEffects && typeof itemEffects.canUseBridgeCharge === 'function' && itemEffects.canUseBridgeCharge()) {
            return 'У тебя есть активный мостовой заряд. Подойди к воде и нажми "Использовать", чтобы построить ещё одну клетку моста.';
        }

        if (encounter) {
            if (isDialogueEncounter(encounter, activeInteraction)) {
                return getEncounterTalkPrompt(encounter);
            }

            if (encounter.kind === 'shelter') {
                return `${encounter.label}: ${encounter.summary} Подойди вплотную и нажми "Спать".`;
            }

            if (encounter.kind === 'camp') {
                return `${encounter.label}: ${encounter.summary} Подойди вплотную: откроется отдельное окно лагеря. Если закрыл его, нажми "Использовать", чтобы открыть снова.`;
            }

            if (encounter.kind === 'workbench') {
                return `${encounter.label}: ${encounter.summary} Подойди вплотную: откроется отдельное окно станции. Если закрыл его, нажми "Использовать", чтобы открыть снова.`;
            }

            if (encounter.kind === 'well') {
                return `${encounter.label}: ${encounter.summary} Подойди вплотную и нажми "Использовать", чтобы восстановиться.`;
            }

            if (encounter.kind === 'forage') {
                return `${encounter.label}: ${encounter.summary} Подойди вплотную и нажми "Использовать", чтобы собрать еду.`;
            }

            return `${encounter.label}: ${encounter.summary} Подойди вплотную и нажми "Использовать".`;
        }

        if (terrainTarget) {
            return getTerrainActionHint(terrainTarget);
        }

        if (tileInfo && tileInfo.tileType === 'bridge') {
            const expedition = game.systems.expedition;
            const durability = expedition ? expedition.getBridgeDurability(tileInfo) : 2;
            const maxDurability = expedition && typeof expedition.getBridgeMaxDurability === 'function'
                ? expedition.getBridgeMaxDurability(tileInfo)
                : 2;
            const placedBridgeRecord = expedition && typeof expedition.getPlacedBridgeRecord === 'function'
                ? expedition.getPlacedBridgeRecord(tileInfo.x, tileInfo.y)
                : null;
            const bridgeLabel = placedBridgeRecord && placedBridgeRecord.label
                ? placedBridgeRecord.label
                : 'мост';

            return durability <= 1
                ? 'Старый мост: после следующего прохода он развалится.'
                : maxDurability > 2
                    ? `${bridgeLabel}: осталось ${durability} из ${maxDurability} проходов.`
                : 'Обычный мост: первый проход состарит его, второй разрушит.';
        }

        if (penaltySummary) {
            return `Активные последствия: ${penaltySummary}.`;
        }

        return 'Дальние острова ускоряют расход ресурсов и снижают эффективность восстановления.';
    }

    function updateActionButtons(activeInteraction = game.state.activeInteraction) {
        const actionAvailability = buildActionAvailabilityState(activeInteraction);

        setActionButtonState('walk', actionAvailability.walk.enabled, actionAvailability.walk.highlighted, actionAvailability.walk.visible);
        setActionButtonState('use', actionAvailability.use.enabled, actionAvailability.use.highlighted, actionAvailability.use.visible);
        setActionButtonState('talk', actionAvailability.talk.enabled, actionAvailability.talk.highlighted, actionAvailability.talk.visible);
        setActionButtonState('sleep', actionAvailability.sleep.enabled, actionAvailability.sleep.highlighted, actionAvailability.sleep.visible);
        setActionButtonState('inspect', actionAvailability.inspect.enabled, actionAvailability.inspect.highlighted, actionAvailability.inspect.visible);
        setActionButtonState('drop', actionAvailability.drop.enabled, actionAvailability.drop.highlighted, actionAvailability.drop.visible);
    }

    function handleWalkAction() {
        if (game.state.isGameOver) {
            return;
        }

        if (game.state.isPaused || game.state.isMapOpen) {
            bridge.setActionMessage('Сначала закрой паузу или карту, потом подтверждай движение.');
            bridge.renderAfterStateChange();
            return;
        }

        if (game.state.isMoving) {
            return;
        }

        if (!Array.isArray(game.state.route) || game.state.route.length === 0) {
            bridge.setActionMessage('Сначала проложи маршрут по клеткам, потом нажми кнопку движения.');
            bridge.renderAfterStateChange();
            return;
        }

        game.systems.movement.startMovement();
    }

    function inspectInventoryItem(item) {
        if (!item) {
            bridge.setActionMessage('Этот слот пуст. Осматривать здесь пока нечего.');
            bridge.renderAfterStateChange();
            return;
        }

        bridge.setActionMessage(bridge.getItemDescription(item.id) || `Предмет "${item.label}" пока без описания.`);
        bridge.renderAfterStateChange();
    }

    function handleUseAction() {
        const inventoryRuntime = getInventoryRuntime();
        const itemEffects = getItemEffects();
        const selectedItem = getSelectedInventoryItem();
        const canUseSelectedItem = Boolean(
            selectedItem
            && itemEffects
            && typeof itemEffects.canUseInventoryItem === 'function'
            && itemEffects.canUseInventoryItem(selectedItem)
        );
        const groundItem = inventoryRuntime ? inventoryRuntime.getCurrentGroundItem() : null;

        if (canUseSelectedItem) {
            const outcome = itemEffects ? itemEffects.useInventoryItem(selectedItem) : null;
            bridge.setActionMessage(outcome ? outcome.message : 'Рядом нет объекта для использования.');

            if (outcome && outcome.effectDrops && game.systems.effects) {
                game.systems.effects.spawnInventoryUse(game.state.playerPos, outcome.effectDrops);
            }

            bridge.renderAfterStateChange();
            return;
        }

        if (groundItem && inventoryRuntime && itemEffects) {
            const outcome = inventoryRuntime.pickupGroundItem();

            if (!outcome.success) {
                bridge.setActionMessage(outcome.reason === 'full'
                    ? (outcome.capacityType === 'bulk'
                        ? 'Груз слишком тяжёлый: в сумке не хватает объёма.'
                        : 'Рюкзак полон, подобрать предметы не удалось.')
                    : 'Под ногами ничего не лежит.');
                bridge.renderAfterStateChange();
                return;
            }

            const pickedDrops = outcome.picked
                .map((item) => itemEffects.buildItemEffectDrop(item))
                .filter(Boolean);

            if (pickedDrops.length > 0 && game.systems.effects) {
                game.systems.effects.spawnInventoryUse(game.state.playerPos, pickedDrops);
            }

            const pickedSummary = outcome.picked
                .map((item) => `${item.label}${item.quantity > 1 ? ` x${item.quantity}` : ''}`)
                .join(', ');
            const remainingSummary = outcome.remaining.length > 0
                ? ` Рюкзак полон: осталось ${outcome.remaining.map((item) => item.label).join(', ')}.`
                : '';

            bridge.setActionMessage(`Подобрано: ${pickedSummary}.${remainingSummary}`);
            bridge.renderAfterStateChange();
            return;
        }

        if (!selectedItem && itemEffects && typeof itemEffects.canUseBridgeCharge === 'function' && itemEffects.canUseBridgeCharge()) {
            const outcome = itemEffects.useBridgeCharge();
            bridge.setActionMessage(outcome ? outcome.message : 'Не удалось использовать мостовой заряд.');
            bridge.renderAfterStateChange();
            return;
        }

        if (game.state.activeInteraction && !isResourceNodeInteraction(game.state.activeInteraction)) {
            const encounter = bridge.getHouseEncounter(game.state.activeInteraction);

            if (isDialogueEncounter(encounter, game.state.activeInteraction)) {
                bridge.setActionMessage(getEncounterTalkPrompt(encounter));
                bridge.renderAfterStateChange();
                return;
            }

            bridge.resolveHouseUse(game.state.activeInteraction);
            return;
        }

        if (collectTerrainResource()) {
            return;
        }

        if (selectedItem) {
            const outcome = itemEffects ? itemEffects.useInventoryItem(selectedItem) : null;
            bridge.setActionMessage(outcome ? outcome.message : `Предмет "${selectedItem.label}" пока не имеет отдельного активного эффекта.`);
            bridge.renderAfterStateChange();
            return;
        }

        bridge.setActionMessage('Рядом нет объекта для использования.');
        bridge.renderAfterStateChange();
    }

    function handleInspectAction() {
        const inventoryRuntime = getInventoryRuntime();
        const selectedItem = getSelectedInventoryItem();
        const groundItem = inventoryRuntime ? inventoryRuntime.getCurrentGroundItem() : null;
        const routeInspectTileInfo = getRouteInspectTileInfo();
        const routeTerrainTarget = getTerrainTargetForTile(routeInspectTileInfo, { includeHarvested: true });
        const terrainTarget = routeTerrainTarget || getInspectableTerrainTarget();

        if (selectedItem || game.state.selectedInventorySlot !== null) {
            inspectInventoryItem(selectedItem);
            return;
        }

        if (groundItem && inventoryRuntime) {
            bridge.setActionMessage(`Под ногами: ${inventoryRuntime.getGroundItemDescription(groundItem)}.`);
            bridge.renderAfterStateChange();
            return;
        }

        if (terrainTarget) {
            bridge.setActionMessage(getTerrainAdviceMessage(terrainTarget));
            bridge.renderAfterStateChange();
            return;
        }

        if (game.state.activeInteraction) {
            bridge.inspectActiveHouse();
            return;
        }

        const tileInfo = routeInspectTileInfo || game.state.activeTileInfo;
        bridge.setActionMessage(getTileAdviceMessage(tileInfo));
        bridge.renderAfterStateChange();
    }

    function handleTalkAction() {
        const dialogueRuntime = getDialogueRuntime();

        if (game.state.activeInteraction && dialogueRuntime) {
            const result = dialogueRuntime.startDialogue(game.state.activeInteraction);

            if (result) {
                bridge.renderAfterStateChange();
                return;
            }
        }

        bridge.setActionMessage('Рядом нет персонажей для разговора.');
        bridge.renderAfterStateChange();
    }

    function handleActionClick(event) {
        if (game.state.isGameOver) {
            return;
        }

        const inventoryRuntime = getInventoryRuntime();
        const action = event.currentTarget.dataset.action;

        if (action === 'sleep') {
            const shouldPlaySleepTransition = !game.state.isMoving;
            bridge.performSleep();

            if (shouldPlaySleepTransition && game.systems.statusUi && typeof game.systems.statusUi.playSleepTransition === 'function') {
                game.systems.statusUi.playSleepTransition();
            }

            return;
        }

        if (action === 'use') {
            handleUseAction();
            return;
        }

        if (action === 'walk') {
            handleWalkAction();
            return;
        }

        if (action === 'inspect') {
            handleInspectAction();
            return;
        }

        if (action === 'drop' && inventoryRuntime) {
            const outcome = inventoryRuntime.dropSelectedInventoryItem();

            if (!outcome.success) {
                bridge.setActionMessage('Сначала выбери предмет в инвентаре.');
                bridge.renderAfterStateChange();
                return;
            }

            bridge.setActionMessage(`Выброшен предмет: ${outcome.item.label}${outcome.item.quantity > 1 ? ` x${outcome.item.quantity}` : ''}.`);
            bridge.renderAfterStateChange();
            return;
        }

        if (action === 'talk') {
            handleTalkAction();
        }
    }

    getDefaultActionHint = function getDefaultActionHintSafe(activeInteraction, tileInfo) {
        const inventoryRuntime = getInventoryRuntime();
        const itemEffects = getItemEffects();
        const selectedItem = getSelectedInventoryItem();
        const groundItem = inventoryRuntime ? inventoryRuntime.getCurrentGroundItem() : null;
        const encounter = bridge.getHouseEncounter(activeInteraction);
        const terrainTarget = getInspectableTerrainTarget();
        const selectedWorldTileInfo = getSelectedWorldTileInfo();
        const selectedWorldInteraction = getSelectedWorldInteraction(selectedWorldTileInfo);
        const selectedWorldTerrain = getTerrainTargetForTile(selectedWorldTileInfo, { includeHarvested: true });
        const penaltySummary = bridge.getActivePenaltySummary(tileInfo, 3);
        const hasRoute = Array.isArray(game.state.route) && game.state.route.length > 0 && !game.state.isMoving;

        if (selectedItem) {
            if (itemEffects && itemEffects.isBridgeBuilderItem(selectedItem.id)) {
                return `Выбран предмет: ${selectedItem.label}. Подойди к узкому водному проходу и нажми "Использовать", чтобы уложить мост.`;
            }

            if (itemEffects && typeof itemEffects.canUseInventoryItem === 'function' && itemEffects.canUseInventoryItem(selectedItem)) {
                return `Выбран предмет: ${selectedItem.label}. Нажми "Использовать" для активации или "Изучить" для описания.`;
            }

            return `Выбран предмет: ${selectedItem.label}. Нажми "Изучить", чтобы увидеть описание.`;
        }

        if (selectedWorldInteraction) {
            return `${getInteractionDescriptionSafe(selectedWorldInteraction)} Нажми "Изучить", чтобы получить совет по прохождению.`;
        }

        if (selectedWorldTerrain) {
            return `${getTerrainInspectMessageSafe(selectedWorldTerrain)} Нажми "Изучить", чтобы увидеть совет по этой клетке.`;
        }

        if (selectedWorldTileInfo) {
            return `${getTileInspectSummary(selectedWorldTileInfo)} Нажми "Изучить", чтобы получить совет по этой клетке.`;
        }

        if (hasRoute) {
            const previewSuffix = game.state.routePreviewLength > game.state.route.length
                ? ` из ${game.state.routePreviewLength}`
                : '';
            const totalCost = bridge.formatRouteCost(game.state.routeTotalCost);
            const isExactPreview = game.state.routePreviewIsExact !== false;
            const fullCostSuffix = isExactPreview && game.state.routePreviewLength > game.state.route.length
                ? ` Полный путь стоит ${bridge.formatRouteCost(game.state.routePreviewTotalCost)}.`
                : '';
            const previewPrefix = isExactPreview ? 'Маршрут готов' : 'Быстрый маршрут готов';
            const previewResolveSuffix = isExactPreview
                ? ''
                : ' Можно стартовать сразу: дальняя часть пути догрузится и уточнится по мере движения.';

            return `${previewPrefix}: ${game.state.route.length}${previewSuffix} клеток, цена ${totalCost}. Нажми кнопку движения, пробел или кликни по выбранной клетке ещё раз.${fullCostSuffix}${previewResolveSuffix}`;
        }

        if (groundItem && inventoryRuntime) {
            return `Под ногами лежит: ${inventoryRuntime.getGroundItemDescription(groundItem)}. Нажми "Использовать", чтобы подобрать.`;
        }

        if (itemEffects && typeof itemEffects.canUseBridgeCharge === 'function' && itemEffects.canUseBridgeCharge()) {
            return 'У тебя есть активный мостовой заряд. Подойди к воде и нажми "Использовать", чтобы построить ещё одну клетку моста.';
        }

        if (encounter) {
            if (isDialogueEncounter(encounter, activeInteraction)) {
                return getEncounterTalkPrompt(encounter);
            }

            if (encounter.kind === 'shelter') {
                return `${encounter.label}: ${encounter.summary} Подойди вплотную и нажми "Спать".`;
            }

            if (encounter.kind === 'camp') {
                return `${encounter.label}: ${encounter.summary} Подойди вплотную: откроется отдельное окно лагеря. Если закрыл его, нажми "Использовать", чтобы открыть снова.`;
            }

            if (encounter.kind === 'workbench') {
                return `${encounter.label}: ${encounter.summary} Подойди вплотную: откроется отдельное окно станции. Если закрыл его, нажми "Использовать", чтобы открыть снова.`;
            }

            if (encounter.kind === 'well') {
                return `${encounter.label}: ${encounter.summary} Подойди вплотную и нажми "Использовать", чтобы восстановиться.`;
            }

            if (encounter.kind === 'forage') {
                return `${encounter.label}: ${encounter.summary} Подойди вплотную и нажми "Использовать", чтобы собрать еду.`;
            }

            return `${encounter.label}: ${encounter.summary} Подойди вплотную и нажми "Использовать".`;
        }

        if (terrainTarget) {
            return getTerrainActionHint(terrainTarget);
        }

        if (tileInfo && tileInfo.tileType === 'bridge') {
            const expedition = game.systems.expedition;
            const durability = expedition ? expedition.getBridgeDurability(tileInfo) : 2;

            return durability <= 1
                ? 'Старый мост: после следующего прохода он развалится.'
                : 'Обычный мост: первый проход состарит его, второй разрушит.';
        }

        if (penaltySummary) {
            return `Активные последствия: ${penaltySummary}.`;
        }

        return 'Дальние острова ускоряют расход ресурсов и снижают эффективность восстановления.';
    };

    updateActionButtons = function updateActionButtonsSafe(activeInteraction = game.state.activeInteraction) {
        const actionAvailability = buildActionAvailabilityState(activeInteraction);

        setActionButtonState('walk', actionAvailability.walk.enabled, actionAvailability.walk.highlighted, actionAvailability.walk.visible);
        setActionButtonState('use', actionAvailability.use.enabled, actionAvailability.use.highlighted, actionAvailability.use.visible);
        setActionButtonState('talk', actionAvailability.talk.enabled, actionAvailability.talk.highlighted, actionAvailability.talk.visible);
        setActionButtonState('sleep', actionAvailability.sleep.enabled, actionAvailability.sleep.highlighted, actionAvailability.sleep.visible);
        setActionButtonState('inspect', actionAvailability.inspect.enabled, actionAvailability.inspect.highlighted, actionAvailability.inspect.visible);
        setActionButtonState('drop', actionAvailability.drop.enabled, actionAvailability.drop.highlighted, actionAvailability.drop.visible);
    };

    handleInspectAction = function handleInspectActionSafe() {
        const inventoryRuntime = getInventoryRuntime();
        const selectedItem = getSelectedInventoryItem();
        const groundItem = inventoryRuntime ? inventoryRuntime.getCurrentGroundItem() : null;
        const selectedWorldTileInfo = getSelectedWorldTileInfo();
        const selectedWorldInteraction = getSelectedWorldInteraction(selectedWorldTileInfo);
        const selectedWorldTerrain = getTerrainTargetForTile(selectedWorldTileInfo, { includeHarvested: true });
        const routeInspectTileInfo = getRouteInspectTileInfo();
        const routeTerrainTarget = getTerrainTargetForTile(routeInspectTileInfo, { includeHarvested: true });
        const terrainTarget = routeTerrainTarget || getInspectableTerrainTarget();

        if (selectedItem || game.state.selectedInventorySlot !== null) {
            inspectInventoryItem(selectedItem);
            return;
        }

        if (groundItem && inventoryRuntime) {
            bridge.setActionMessage(`Под ногами: ${inventoryRuntime.getGroundItemDescription(groundItem)}.`);
            bridge.renderAfterStateChange();
            return;
        }

        if (selectedWorldInteraction) {
            bridge.setActionMessage(getInteractionAdviceSafe(selectedWorldInteraction));
            bridge.renderAfterStateChange();
            return;
        }

        if (selectedWorldTerrain) {
            bridge.setActionMessage(getTerrainAdviceMessage(selectedWorldTerrain));
            bridge.renderAfterStateChange();
            return;
        }

        if (terrainTarget) {
            bridge.setActionMessage(getTerrainAdviceMessage(terrainTarget));
            bridge.renderAfterStateChange();
            return;
        }

        if (game.state.activeInteraction) {
            bridge.inspectActiveHouse();
            return;
        }

        const tileInfo = selectedWorldTileInfo || routeInspectTileInfo || game.state.activeTileInfo;
        bridge.setActionMessage(getTileAdviceMessage(tileInfo));
        bridge.renderAfterStateChange();
    };

    Object.assign(actionUi, {
        describeSelectedWorldTarget,
        getDefaultActionHint,
        getActionAvailability,
        getGatherableTerrainTarget,
        collectTerrainResource,
        setActionButtonState,
        updateActionButtons,
        handleWalkAction,
        handleUseAction,
        handleInspectAction,
        handleTalkAction,
        handleActionClick,
        tryCollectClickedRock
    });
})();
