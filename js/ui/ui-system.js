(() => {
    const game = window.Game;
    const ui = game.systems.ui = game.systems.ui || {};
    const statMaximum = 100;
    const coldDrainDivider = 3;
    const OPENING_HUNGER_DRAIN_MULTIPLIER = 0.5;
    const OPENING_HUNGER_DRAIN_ADVANCE_LIMIT = 9;
    const OPENING_HUNGER_DRAIN_FADE_ADVANCES = 2;
    const tileLabels = {
        trail: 'тропа',
        grass: 'трава',
        water: 'вода',
        shore: 'берег',
        rock: 'камни',
        bridge: 'мост',
        reeds: 'тростник',
        rubble: 'осыпь',
        mud: 'грязь',
        house: 'дом',
        unloaded: 'не загружено'
    };
    const statLabels = {
        hunger: 'голод',
        energy: 'энергия',
        sleep: 'сон',
        cold: 'холод',
        focus: 'фокус'
    };
    const statEffectIcons = {
        hunger: 'HP',
        energy: 'EN',
        sleep: 'SN',
        cold: 'CL',
        focus: 'FC'
    };

    function getItemRegistrySystem() {
        return game.systems.itemRegistry || game.systems.loot || null;
    }

    function getPricingSystem() {
        return game.systems.pricing || game.systems.loot || null;
    }

    function getRewardScalingSystem() {
        return game.systems.rewardScaling || null;
    }

    function getStatusUiModule() {
        return game.systems.statusUi;
    }

    function getInventoryUiModule() {
        return game.systems.inventoryUi;
    }

    function getActionUiModule() {
        return game.systems.actionUi;
    }

    function getMerchantUiModule() {
        return game.systems.merchantUi;
    }

    function getStationUiModule() {
        return game.systems.stationUi;
    }

    function getDialogueUiModule() {
        return game.systems.dialogueUi;
    }

    function getQuestUiModule() {
        return game.systems.questUi;
    }

    function getMapUiModule() {
        return game.systems.mapUi;
    }

    function getMobileUiModule() {
        return game.systems.mobileUi;
    }

    function getInventoryRuntime() {
        return game.systems.inventoryRuntime;
    }

    function getItemEffectsModule() {
        return game.systems.itemEffects;
    }

    const inventoryDescriptions = {
        map: 'Карта местности. Помогает держать курс, но пока не даёт отдельного бонуса.',
        ration: 'Паёк. Восстанавливает голод, но дальние острова уменьшают эффективность припасов.',
        bedroll: 'Спальник. Позже здесь можно будет хранить усиления для лагеря.',
        notes: 'Записи. Подготовлено место под заметки и подсказки экспедиции.'
    };
    const itemRegistry = getItemRegistrySystem();
    if (itemRegistry && itemRegistry.itemDefinitions) {
        Object.values(itemRegistry.itemDefinitions).forEach((definition) => {
            if (definition && definition.id && definition.description) {
                inventoryDescriptions[definition.id] = definition.description;
            }
        });
    }
    let elements = {};
    let eventsBound = false;
    ui.openMerchantHouseId = ui.openMerchantHouseId || null;
    ui.merchantDescriptionByHouseId = ui.merchantDescriptionByHouseId || {};
    ui.lastRenderedActionHintText = typeof ui.lastRenderedActionHintText === 'string'
        ? ui.lastRenderedActionHintText
        : '';
    ui.lastRenderedActionHintContextKey = typeof ui.lastRenderedActionHintContextKey === 'string'
        ? ui.lastRenderedActionHintContextKey
        : '';
    const DIRTY_UI_SECTIONS = [
        'stats',
        'location',
        'progress',
        'character',
        'actions',
        'inventory',
        'portrait',
        'condition',
        'status',
        'merchant',
        'dialogue',
        'quests',
        'map',
        'actionHint'
    ];
    const MOBILE_SYNC_SECTIONS = new Set([
        'stats',
        'actions',
        'inventory',
        'merchant',
        'dialogue',
        'quests',
        'actionHint'
    ]);
    const DEFAULT_INSTRUCTIONS_TEXT = 'Кликайте по клеткам, чтобы выбрать маршрут. Кнопка движения, пробел или повторный клик по той же клетке запускают выбранный путь. Тропа и мосты экономят силы, тростник и осыпь утяжеляют путь, а грязь и хрупкие мосты лучше обходить.';
    const CRAFT_ONBOARDING_MAX_ISLAND = 6;

    function countInventoryItem(itemId) {
        const inventoryRuntime = getInventoryRuntime();
        return inventoryRuntime && typeof inventoryRuntime.countInventoryItem === 'function'
            ? inventoryRuntime.countInventoryItem(itemId)
            : 0;
    }

    function buildCraftOnboardingState() {
        const islandIndex = Math.max(1, Math.floor(game.state.currentIslandIndex || 1));
        if (islandIndex > CRAFT_ONBOARDING_MAX_ISLAND) {
            return null;
        }

        const steps = [
            {
                id: 'gatherGrass',
                label: 'Собери траву',
                isComplete: countInventoryItem('raw_grass') > 0
            },
            {
                id: 'fillFlask',
                label: 'Наполни флягу у воды',
                isComplete: countInventoryItem('flask_water_dirty') > 0
                    || countInventoryItem('flask_water_full') > 0
                    || countInventoryItem('flask_water_alchemy') > 0
            },
            {
                id: 'weakHealing',
                label: 'Сделай слабое лечение',
                isComplete: countInventoryItem('healing_base') > 0
                    || countInventoryItem('healingBrew') > 0
            },
            {
                id: 'planks',
                label: 'Собери доски',
                isComplete: countInventoryItem('wood_plank_basic') > 0
            },
            {
                id: 'bridge',
                label: 'Собери мост',
                isComplete: countInventoryItem('bridge_kit') > 0
                    || countInventoryItem('portableBridge') > 0
            }
        ];

        const currentIndex = steps.findIndex((step) => !step.isComplete);

        return {
            steps,
            currentIndex,
            isComplete: currentIndex === -1
        };
    }

    function buildCraftOnboardingText(state) {
        if (!state) {
            return DEFAULT_INSTRUCTIONS_TEXT;
        }

        if (state.isComplete) {
            return 'Крафт-цикл освоен: травы, фляга, лечение, доски и мост уже собраны. Дальше важно держать темп и готовить улучшенные версии заранее.';
        }

        const currentStep = state.steps[state.currentIndex];
        const stepList = state.steps.map((step, index) => {
            const statusSuffix = step.isComplete
                ? ' (готово)'
                : (index === state.currentIndex ? ' (сейчас)' : '');
            return `${index + 1}. ${step.label}${statusSuffix}`;
        }).join(' · ');

        return `Крафт-цикл: ${currentStep ? currentStep.label : 'следующий шаг'}. ${stepList}`;
    }

    function ensureDirtySections() {
        if (!(ui.dirtySections instanceof Set)) {
            ui.dirtySections = new Set(DIRTY_UI_SECTIONS);
        }

        return ui.dirtySections;
    }

    function normalizeDirtySections(sections) {
        if (!sections) {
            return DIRTY_UI_SECTIONS;
        }

        const normalized = Array.isArray(sections) ? sections : [sections];

        if (normalized.includes('all')) {
            return DIRTY_UI_SECTIONS;
        }

        return normalized.filter((section) => DIRTY_UI_SECTIONS.includes(section));
    }

    function markDirty(sections) {
        normalizeDirtySections(sections).forEach((section) => {
            ensureDirtySections().add(section);
        });
    }

    function hasDirtySections() {
        return ensureDirtySections().size > 0;
    }

    function consumeDirtySections() {
        const dirtySections = new Set(ensureDirtySections());
        ensureDirtySections().clear();
        return dirtySections;
    }

    function shouldSyncMobileUi(dirtySections, shouldResetActionMessage = false) {
        if (shouldResetActionMessage) {
            return true;
        }

        return Array.from(MOBILE_SYNC_SECTIONS).some((section) => dirtySections.has(section));
    }

    function syncActionHint(activeInteraction, tileInfo, contextKey, dirtySections, shouldResetActionMessage) {
        if (game.state.isMoving) {
            return false;
        }

        if (!elements.actionHint || (!shouldResetActionMessage && !dirtySections.has('actionHint'))) {
            return false;
        }

        const nextActionHintText = ui.lastActionMessage || getDefaultActionHint(activeInteraction, tileInfo);

        if (
            ui.lastRenderedActionHintContextKey === contextKey
            && ui.lastRenderedActionHintText === nextActionHintText
            && elements.actionHint.textContent === nextActionHintText
        ) {
            return false;
        }

        elements.actionHint.textContent = nextActionHintText;
        ui.lastRenderedActionHintContextKey = contextKey;
        ui.lastRenderedActionHintText = nextActionHintText;
        return true;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function getStats() {
        game.state.survivalStats = game.state.survivalStats || {};
        return game.state.survivalStats;
    }

    function getStatValue(key) {
        const stats = getStats();
        return clamp(typeof stats[key] === 'number' ? stats[key] : 0, 0, statMaximum);
    }

    function resetCriticalDepletionStepStreak() {
        game.state.criticalDepletionStepStreak = 0;
    }

    function setStatValue(key, value) {
        const stats = getStats();
        const previousValue = getStatValue(key);
        stats[key] = clamp(value, 0, statMaximum);

        if (stats[key] > previousValue) {
            resetCriticalDepletionStepStreak();
        }

        return stats[key];
    }

    function changeStatValue(key, delta) {
        return setStatValue(key, getStatValue(key) + delta);
    }

    function getResolvedHouseMap() {
        game.state.resolvedHouseIds = game.state.resolvedHouseIds || {};
        return game.state.resolvedHouseIds;
    }

    function getTradedHouseMap() {
        game.state.tradedHouseIds = game.state.tradedHouseIds || {};
        return game.state.tradedHouseIds;
    }

    function getHouseOwner(target) {
        return target && target.house ? target.house : target;
    }

    function isHouseResolved(house) {
        const owner = getHouseOwner(house);
        return Boolean(owner && getResolvedHouseMap()[owner.id]);
    }

    function isHouseTradeResolved(house) {
        const owner = getHouseOwner(house);
        return Boolean(owner && getTradedHouseMap()[owner.id]);
    }

    function markHouseResolved(house) {
        const owner = getHouseOwner(house);
        if (owner) {
            getResolvedHouseMap()[owner.id] = true;
        }
    }

    function markHouseTradeResolved(house) {
        const owner = getHouseOwner(house);
        if (owner) {
            getTradedHouseMap()[owner.id] = true;
        }
    }

    function getGold() {
        return typeof game.state.gold === 'number' ? game.state.gold : 0;
    }

    function changeGold(delta) {
        game.state.gold = Math.max(0, getGold() + delta);
        return game.state.gold;
    }

    function isStatDepleted(key) {
        return getStatValue(key) <= 0;
    }

    function getFocusMultiplier() {
        const rewardScaling = getRewardScalingSystem();

        if (rewardScaling && typeof rewardScaling.getFocusMultiplier === 'function') {
            return rewardScaling.getFocusMultiplier();
        }

        return isStatDepleted('focus') ? 1.65 : 1;
    }

    function getCurrentProgression(tileInfo = game.state.activeTileInfo) {
        const currentProgression = tileInfo && tileInfo.progression ? tileInfo.progression : null;
        const expeditionProgression = game.systems.expeditionProgression || null;

        return currentProgression
            && expeditionProgression
            && typeof expeditionProgression.decorateProgressionWithCraftRequirements === 'function'
            ? expeditionProgression.decorateProgressionWithCraftRequirements(currentProgression)
            : currentProgression;
    }

    function getTimeOfDayAdvancesElapsed() {
        const rawValue = typeof game.state.timeOfDayAdvancesElapsed === 'number'
            ? game.state.timeOfDayAdvancesElapsed
            : 0;
        const normalizedValue = Math.max(0, Math.floor(rawValue));
        game.state.timeOfDayAdvancesElapsed = normalizedValue;
        return normalizedValue;
    }

    function getOpeningHungerDrainMultiplier() {
        const elapsedAdvances = getTimeOfDayAdvancesElapsed();

        if (elapsedAdvances < OPENING_HUNGER_DRAIN_ADVANCE_LIMIT) {
            return OPENING_HUNGER_DRAIN_MULTIPLIER;
        }

        const fadeProgress = OPENING_HUNGER_DRAIN_FADE_ADVANCES > 0
            ? Math.min(
                1,
                Math.max(0, (elapsedAdvances - OPENING_HUNGER_DRAIN_ADVANCE_LIMIT + 1) / OPENING_HUNGER_DRAIN_FADE_ADVANCES)
            )
            : 1;

        return OPENING_HUNGER_DRAIN_MULTIPLIER
            + (1 - OPENING_HUNGER_DRAIN_MULTIPLIER) * fadeProgress;
    }

    function scaleDrain(value, tileInfo = game.state.activeTileInfo) {
        return game.systems.expedition.scaleDrain(value, tileInfo);
    }

    function scaleRecovery(value, tileInfo = game.state.activeTileInfo) {
        return game.systems.expedition.scaleRecovery(value, tileInfo);
    }

    function getColdDrain(tileInfo = game.state.activeTileInfo) {
        return scaleDrain(1, tileInfo) / coldDrainDivider;
    }

    function countDepletedStats() {
        return ['hunger', 'energy', 'sleep', 'cold', 'focus']
            .reduce((count, key) => count + (isStatDepleted(key) ? 1 : 0), 0);
    }

    function getCriticalDepletionMultiplier() {
        const rewardScaling = getRewardScalingSystem();

        if (rewardScaling && typeof rewardScaling.getCriticalDepletionMultiplier === 'function') {
            return rewardScaling.getCriticalDepletionMultiplier();
        }

        if (countDepletedStats() <= 2) {
            resetCriticalDepletionStepStreak();
            return 1;
        }

        game.state.criticalDepletionStepStreak = (game.state.criticalDepletionStepStreak || 0) + 1;
        return clamp(1 + game.state.criticalDepletionStepStreak * 0.03, 1, 1.21);
    }

    function getEnergyRecoveryMultiplier(source = 'general') {
        if ((source === 'sleep' || source === 'food') && isStatDepleted('hunger')) {
            return 0.55;
        }

        return 1;
    }

    function getFocusRecoveryMultiplier() {
        return isStatDepleted('sleep') ? 0.65 : 1;
    }

    function getAdjustedRecoveryAmount(key, value, tileInfo = game.state.activeTileInfo, options = {}) {
        const rewardScaling = getRewardScalingSystem();

        if (rewardScaling && typeof rewardScaling.getAdjustedRecoveryAmount === 'function') {
            return rewardScaling.getAdjustedRecoveryAmount(key, value, tileInfo, options);
        }

        const {
            ignoreRecoveryScaling = false,
            energySource = 'general'
        } = options;
        let adjusted = ignoreRecoveryScaling
            ? value
            : scaleRecovery(value, tileInfo);

        if (adjusted <= 0) {
            return 0;
        }

        if (key === 'energy') {
            adjusted = Math.round(adjusted * getEnergyRecoveryMultiplier(energySource));
        } else if (key === 'focus') {
            adjusted = Math.round(adjusted * getFocusRecoveryMultiplier());
        }

        return Math.max(0, adjusted);
    }

    function isOutsideExposure(tileInfo = game.state.activeTileInfo) {
        if (game.state.activeHouse) {
            return false;
        }

        return Boolean(!tileInfo || !tileInfo.house);
    }

    function getStepEnergyDrainMultiplier(tileInfo = game.state.activeTileInfo) {
        const rewardScaling = getRewardScalingSystem();

        if (rewardScaling && typeof rewardScaling.getStepEnergyDrainMultiplier === 'function') {
            return rewardScaling.getStepEnergyDrainMultiplier(tileInfo);
        }

        let multiplier = 1;

        if (isStatDepleted('energy')) {
            multiplier *= 1.25;
        }

        if (isStatDepleted('cold') && isOutsideExposure(tileInfo)) {
            multiplier *= 1.35;
        }

        return multiplier;
    }

    function getSleepDrainMultiplier(tileInfo = game.state.activeTileInfo) {
        const rewardScaling = getRewardScalingSystem();

        if (rewardScaling && typeof rewardScaling.getSleepDrainMultiplier === 'function') {
            return rewardScaling.getSleepDrainMultiplier(tileInfo);
        }

        if (isStatDepleted('cold') && isOutsideExposure(tileInfo)) {
            return 1.3;
        }

        return 1;
    }

    function getRouteLengthLimit() {
        const rewardScaling = getRewardScalingSystem();

        if (rewardScaling && typeof rewardScaling.getRouteLengthLimit === 'function') {
            return rewardScaling.getRouteLengthLimit();
        }

        const baseLimit = Math.max(1, game.config.maxMoveCellsPerTurn || 5);

        if (isStatDepleted('sleep')) {
            return Math.max(2, baseLimit - 1);
        }

        return baseLimit;
    }

    function getActivePenaltyTags(tileInfo = game.state.activeTileInfo) {
        const rewardScaling = getRewardScalingSystem();

        if (rewardScaling && typeof rewardScaling.getActivePenaltyTags === 'function') {
            return rewardScaling.getActivePenaltyTags(tileInfo);
        }

        const tags = [];

        if (isStatDepleted('hunger')) {
            tags.push('голод 0: еда и сон слабее восстанавливают энергию');
        }

        if (isStatDepleted('energy')) {
            tags.push('энергия 0: каждый шаг тяжелее');
        }

        if (isStatDepleted('cold')) {
            tags.push(isOutsideExposure(tileInfo)
                ? 'холод 0: на улице сильнее тратятся силы и сон'
                : 'холод 0: снаружи будет тяжелее');
        }

        if (isStatDepleted('sleep')) {
            tags.push(`сон 0: маршрут сокращён до ${getRouteLengthLimit()} клеток`);
        }

        if (isStatDepleted('focus')) {
            tags.push(`фокус 0: расход повышен до x${getFocusMultiplier().toFixed(2)}`);
        }

        if (countDepletedStats() > 2) {
            tags.push('истощение: штраф расхода постепенно нарастает');
        }

        return tags;
    }

    function getActivePenaltySummary(tileInfo = game.state.activeTileInfo, maxEntries = 2) {
        const rewardScaling = getRewardScalingSystem();

        if (rewardScaling && typeof rewardScaling.getActivePenaltySummary === 'function') {
            return rewardScaling.getActivePenaltySummary(tileInfo, maxEntries);
        }

        const tags = getActivePenaltyTags(tileInfo);

        if (tags.length === 0) {
            return '';
        }

        if (!Number.isFinite(maxEntries) || maxEntries <= 0 || tags.length <= maxEntries) {
            return tags.join(' · ');
        }

        return `${tags.slice(0, maxEntries).join(' · ')} · +${tags.length - maxEntries}`;
    }

    function getAverageStatRatio() {
        return ['hunger', 'energy', 'sleep', 'cold', 'focus']
            .reduce((sum, key) => sum + getStatValue(key), 0) / (statMaximum * 5);
    }

    function getConditionScreenState() {
        const depletedStats = countDepletedStats();
        const averageRatio = getAverageStatRatio();
        const remainingRatios = ['hunger', 'energy', 'sleep', 'cold', 'focus']
            .map((key) => getStatValue(key) / statMaximum)
            .filter((ratio) => ratio > 0);
        const remainingRatio = remainingRatios.length > 0
            ? remainingRatios.reduce((sum, ratio) => sum + ratio, 0) / remainingRatios.length
            : 0;
        const collapseFactor = clamp(1 - averageRatio, 0, 1);
        const remainingCollapse = clamp(1 - remainingRatio, 0, 1);
        const zeroPressure = clamp((depletedStats - 3) / 2, 0, 1);
        const isDeath = Boolean(!game.state.hasWon && isAllStatsDepleted());

        if (isDeath) {
            return {
                mode: 'death',
                canvasFilter: 'contrast(2.55) brightness(0.02) saturate(0.25)',
                redOpacity: 0.08,
                darkOpacity: 1,
                glitchOpacity: 0
            };
        }

        if (depletedStats < 3) {
            return {
                mode: 'normal',
                canvasFilter: 'contrast(1) brightness(1) saturate(1)',
                redOpacity: 0,
                darkOpacity: 0,
                glitchOpacity: 0
            };
        }

        const stressFactor = clamp(
            remainingCollapse * 0.72
            + collapseFactor * 0.18
            + zeroPressure * 0.1,
            0,
            1
        );
        const contrast = (1.22 + stressFactor * 0.9 + zeroPressure * 0.2).toFixed(2);
        const brightness = Math.max(0.3, 0.98 - stressFactor * 0.52 - zeroPressure * 0.08).toFixed(2);
        const saturation = (1.02 + stressFactor * 0.12).toFixed(2);

        return {
            mode: 'critical',
            canvasFilter: `contrast(${contrast}) brightness(${brightness}) saturate(${saturation})`,
            redOpacity: (0.24 + stressFactor * 0.18 + zeroPressure * 0.1).toFixed(3),
            darkOpacity: (0.08 + stressFactor * 0.42 + zeroPressure * 0.08).toFixed(3),
            glitchOpacity: (0.14 + stressFactor * 0.18 + zeroPressure * 0.1).toFixed(3)
        };
    }

    function restoreFullEnergy(appliedRewards) {
        const rewards = appliedRewards || {};
        if (isStatDepleted('hunger')) {
            return rewards;
        }
        const energyBefore = getStatValue('energy');
        const energyAfter = setStatValue('energy', statMaximum);
        const gained = Math.max(0, energyAfter - energyBefore);

        if (gained > 0) {
            rewards.energy = (rewards.energy || 0) + gained;
        }

        return rewards;
    }

    function getConsumableEffectForUse(item) {
        const itemEffects = getItemEffectsModule();
        if (itemEffects && typeof itemEffects.getConsumableEffectForUse === 'function') {
            return itemEffects.getConsumableEffectForUse(item);
        }
        const effect = item ? getItemConsumableEffect(item.id) : null;

        if (!effect) {
            return null;
        }

        return { ...effect };
    }

    function roundPosition(position) {
        return {
            x: Math.round(position.x),
            y: Math.round(position.y)
        };
    }

    function getTileLabel(tileType) {
        if (game.systems.content && typeof game.systems.content.getTileLabel === 'function') {
            return game.systems.content.getTileLabel(tileType);
        }

        return tileLabels[tileType] || 'местность';
    }

    function getTravelBandLabel(routeBand) {
        if (game.systems.content && typeof game.systems.content.getRouteBandLabel === 'function') {
            return game.systems.content.getRouteBandLabel(routeBand);
        }

        return 'обычный ход';
    }

    function formatRouteCost(value) {
        return Number.isFinite(value) ? value.toFixed(1) : '0.0';
    }

    function getTimeOfDayLabel() {
        if (game.systems.render && typeof game.systems.render.getTimeOfDayDefinition === 'function') {
            const timeOfDay = game.systems.render.getTimeOfDayDefinition();

            if (timeOfDay && timeOfDay.label) {
                return timeOfDay.label;
            }
        }

        return 'Рассвет';
    }

    function getRouteBandBreakdown(route = game.state.route) {
        return route.reduce((summary, step) => {
            const band = step && step.travelBand ? step.travelBand : 'normal';

            summary[band] = (summary[band] || 0) + 1;
            return summary;
        }, {});
    }

    function getRouteReasonBreakdown(route = game.state.route) {
        return route.reduce((summary, step) => {
            if (!step || !step.travelZoneKey || step.travelZoneKey === 'none') {
                return summary;
            }

            const label = step.travelLabel || step.travelZoneKey;
            summary[label] = (summary[label] || 0) + 1;
            return summary;
        }, {});
    }

    function getInventory() {
        const inventoryRuntime = getInventoryRuntime();
        if (inventoryRuntime && typeof inventoryRuntime.getInventory === 'function') {
            return inventoryRuntime.getInventory();
        }
        return Array.isArray(game.state.inventory) ? game.state.inventory : [];
    }

    function getUnlockedInventorySlots() {
        const inventoryRuntime = getInventoryRuntime();
        if (inventoryRuntime && typeof inventoryRuntime.getUnlockedInventorySlots === 'function') {
            return inventoryRuntime.getUnlockedInventorySlots();
        }
        return clamp(game.state.unlockedInventorySlots || 4, 0, 8);
    }

    function getInventoryBulkUsage() {
        const inventoryRuntime = getInventoryRuntime();
        return inventoryRuntime && typeof inventoryRuntime.getInventoryBulkUsage === 'function'
            ? inventoryRuntime.getInventoryBulkUsage()
            : 0;
    }

    function getInventoryBulkCapacity() {
        const inventoryRuntime = getInventoryRuntime();
        return inventoryRuntime && typeof inventoryRuntime.getInventoryBulkCapacity === 'function'
            ? inventoryRuntime.getInventoryBulkCapacity()
            : 0;
    }

    function getItemBulk(itemOrId, quantity = null) {
        const inventoryRuntime = getInventoryRuntime();
        return inventoryRuntime && typeof inventoryRuntime.getItemBulk === 'function'
            ? inventoryRuntime.getItemBulk(itemOrId, quantity)
            : 0;
    }

    function getSelectedInventoryItem() {
        const inventoryRuntime = getInventoryRuntime();
        if (inventoryRuntime && typeof inventoryRuntime.getSelectedInventoryItem === 'function') {
            return inventoryRuntime.getSelectedInventoryItem();
        }
        const index = game.state.selectedInventorySlot;
        if (typeof index !== 'number' || index < 0 || index >= getUnlockedInventorySlots()) {
            return null;
        }

        return getInventory()[index] || null;
    }

    function getItemDefinition(itemId) {
        const registry = getItemRegistrySystem();
        return registry && typeof registry.getItemDefinition === 'function'
            ? registry.getItemDefinition(itemId)
            : null;
    }

    function getItemDescription(itemId) {
        const registry = getItemRegistrySystem();
        if (registry && typeof registry.describeItem === 'function') {
            const description = registry.describeItem(itemId);
            if (description) {
                return description;
            }
        }

        return inventoryDescriptions[itemId] || '';
    }

    function getItemConsumableEffect(itemId) {
        const registry = getItemRegistrySystem();
        return registry && typeof registry.getConsumableEffect === 'function'
            ? registry.getConsumableEffect(itemId)
            : null;
    }

    function getMerchantSellPrice(itemId, islandIndex) {
        const pricing = getPricingSystem();
        return pricing && typeof pricing.getMerchantSellPrice === 'function'
            ? pricing.getMerchantSellPrice(itemId, islandIndex)
            : 1;
    }

    function normalizeInventoryItem(item) {
        const inventoryRuntime = getInventoryRuntime();
        if (inventoryRuntime && typeof inventoryRuntime.normalizeInventoryItem === 'function') {
            return inventoryRuntime.normalizeInventoryItem(item);
        }
        if (!item || !item.id) {
            return item;
        }

        const definition = getItemDefinition(item.id);
        return {
            ...item,
            icon: item.icon || (definition ? definition.icon : '?'),
            label: item.label || (definition ? definition.label : item.id),
            quantity: Math.max(1, item.quantity || 1)
        };
    }

    function addInventoryItem(itemId, quantity = 1) {
        const inventoryRuntime = getInventoryRuntime();
        if (inventoryRuntime && typeof inventoryRuntime.addInventoryItem === 'function') {
            return inventoryRuntime.addInventoryItem(itemId, quantity);
        }
        const definition = getItemDefinition(itemId);
        if (!definition) {
            return {
                added: false,
                reason: 'unknown',
                item: null
            };
        }

        const inventory = getInventory();
        const isStackable = game.systems.loot && game.systems.loot.isItemStackable(itemId);

        if (isStackable) {
            const stack = inventory.find((item) => item && item.id === itemId);
            if (stack) {
                stack.quantity = Math.max(1, (stack.quantity || 1) + quantity);
                stack.icon = definition.icon;
                stack.label = definition.label;
                return {
                    added: true,
                    reason: 'stacked',
                    item: stack
                };
            }
        }

        const emptyIndex = inventory.findIndex((item, index) => index < getUnlockedInventorySlots() && !item);
        if (emptyIndex === -1) {
            return {
                added: false,
                reason: 'full',
                item: null
            };
        }

        const nextItem = game.systems.loot
            ? game.systems.loot.createInventoryItem(itemId, quantity)
            : normalizeInventoryItem({ id: itemId, quantity });

        inventory[emptyIndex] = normalizeInventoryItem(nextItem);
        return {
            added: true,
            reason: 'new',
            item: inventory[emptyIndex]
        };
    }

    function removeInventoryItemAtIndex(index, quantity = 1) {
        const inventoryRuntime = getInventoryRuntime();
        if (inventoryRuntime && typeof inventoryRuntime.removeInventoryItemAtIndex === 'function') {
            return inventoryRuntime.removeInventoryItemAtIndex(index, quantity);
        }
        if (typeof index !== 'number' || index < 0 || index >= getUnlockedInventorySlots()) {
            return null;
        }

        const inventory = getInventory();
        const item = inventory[index];

        if (!item) {
            return null;
        }

        const removedQuantity = Math.max(1, quantity);
        const currentQuantity = Math.max(1, item.quantity || 1);
        const nextQuantity = currentQuantity - removedQuantity;
        const removedItem = normalizeInventoryItem({
            ...item,
            quantity: Math.min(currentQuantity, removedQuantity)
        });

        if (nextQuantity > 0) {
            item.quantity = nextQuantity;
        } else {
            inventory[index] = null;
            if (game.state.selectedInventorySlot === index) {
                game.state.selectedInventorySlot = null;
            }
        }

        return removedItem;
    }

    function countInventoryItem(itemId) {
        const inventoryRuntime = getInventoryRuntime();
        if (inventoryRuntime && typeof inventoryRuntime.countInventoryItem === 'function') {
            return inventoryRuntime.countInventoryItem(itemId);
        }
        return getInventory().reduce((sum, item) => {
            if (!item || item.id !== itemId) {
                return sum;
            }

            return sum + Math.max(1, item.quantity || 1);
        }, 0);
    }

    function consumeInventoryItemById(itemId, quantity = 1) {
        const inventoryRuntime = getInventoryRuntime();
        if (inventoryRuntime && typeof inventoryRuntime.consumeInventoryItemById === 'function') {
            return inventoryRuntime.consumeInventoryItemById(itemId, quantity);
        }
        let remaining = Math.max(1, quantity);
        const removed = [];

        for (let index = 0; index < getUnlockedInventorySlots() && remaining > 0; index++) {
            const item = getInventory()[index];

            if (!item || item.id !== itemId) {
                continue;
            }

            const available = Math.max(1, item.quantity || 1);
            const removedItem = removeInventoryItemAtIndex(index, Math.min(available, remaining));

            if (removedItem) {
                removed.push(removedItem);
                remaining -= removedItem.quantity || 1;
            }
        }

        return {
            success: remaining <= 0,
            removed,
            remaining
        };
    }

    function consumeSelectedInventoryItem(quantity = 1) {
        const inventoryRuntime = getInventoryRuntime();
        if (inventoryRuntime && typeof inventoryRuntime.consumeSelectedInventoryItem === 'function') {
            return inventoryRuntime.consumeSelectedInventoryItem(quantity);
        }
        const index = game.state.selectedInventorySlot;
        return removeInventoryItemAtIndex(index, quantity);
    }

    function applyLootPlan(lootPlan) {
        const itemEffects = game.systems.itemEffects || null;
        const lootSystem = game.systems.lootSystem || null;
        const buffedLootPlan = itemEffects && typeof itemEffects.applyChestBuffsToLootPlan === 'function'
            ? (itemEffects.applyChestBuffsToLootPlan(lootPlan) || lootPlan)
            : lootPlan;
        const shouldBlockTrapPenalty = itemEffects
            && buffedLootPlan
            && buffedLootPlan.statDelta
            && Object.values(buffedLootPlan.statDelta).some((value) => typeof value === 'number' && value < 0)
            && typeof itemEffects.getTrapWardCharges === 'function'
            && itemEffects.getTrapWardCharges() > 0
            && typeof itemEffects.consumeTrapWardCharge === 'function'
            && itemEffects.consumeTrapWardCharge();
        const effectiveLootPlan = shouldBlockTrapPenalty
            ? {
                ...buffedLootPlan,
                statDelta: {},
                flavorText: `${buffedLootPlan && buffedLootPlan.flavorText ? `${buffedLootPlan.flavorText} ` : ''}Оберег от ловушек принял удар на себя.`
            }
            : buffedLootPlan;
        const results = {
            gold: 0,
            itemsAdded: [],
            itemsDropped: [],
            displayDrops: [],
            unlockedRecipes: [],
            unlockedStations: [],
            statChanges: {},
            flavorText: effectiveLootPlan && effectiveLootPlan.flavorText ? effectiveLootPlan.flavorText : '',
            outcomeType: effectiveLootPlan && effectiveLootPlan.outcomeType ? effectiveLootPlan.outcomeType : 'reward'
        };

        if (!effectiveLootPlan || !Array.isArray(effectiveLootPlan.drops)) {
            return results;
        }

        function addInventoryDrop(drop) {
            const outcome = addInventoryItem(drop.itemId, drop.quantity || 1);
            const definition = getItemDefinition(drop.itemId);
            const displayDrop = {
                ...drop,
                label: definition ? definition.label : drop.label,
                icon: definition ? definition.icon : drop.icon
            };

            if (outcome.added) {
                results.itemsAdded.push(displayDrop);
                results.displayDrops.push(displayDrop);
                return;
            }

            results.itemsDropped.push(displayDrop);
        }

        effectiveLootPlan.drops.forEach((drop) => {
            if (!drop) {
                return;
            }

            if (drop.type === 'gold') {
                changeGold(drop.amount || 0);
                results.gold += drop.amount || 0;
                results.displayDrops.push({ ...drop });
                return;
            }

            if (drop.type === 'item' || drop.type === 'resource_tool' || drop.type === 'structure_part') {
                addInventoryDrop(drop);
                return;
            }

            const unlockResult = lootSystem && typeof lootSystem.applyCraftUnlockDrop === 'function'
                ? lootSystem.applyCraftUnlockDrop(drop, {
                    islandIndex: game.state.currentIslandIndex || 1
                })
                : null;

            if (unlockResult && unlockResult.handled) {
                if (unlockResult.success && unlockResult.displayDrop) {
                    if (unlockResult.unlockType === 'recipe') {
                        results.unlockedRecipes.push(unlockResult.displayDrop);
                    } else if (unlockResult.unlockType === 'station') {
                        results.unlockedStations.push(unlockResult.displayDrop);
                    }
                    results.displayDrops.push(unlockResult.displayDrop);
                }
                return;
            }

            if (drop.type === 'component_bundle') {
                (Array.isArray(drop.entries) ? drop.entries : []).forEach((entry) => {
                    if (!entry || !entry.itemId) {
                        return;
                    }

                    addInventoryDrop({
                        type: 'item',
                        itemId: entry.itemId,
                        label: entry.label,
                        icon: entry.icon,
                        quantity: entry.quantity || 1
                    });
                });
                return;
            }
        });

        Object.entries(effectiveLootPlan.rewardDelta || {}).forEach(([key, value]) => {
            if (typeof value !== 'number' || value === 0) {
                return;
            }

            const before = getStatValue(key);
            const after = changeStatValue(key, value);
            const actualDelta = after - before;

            if (actualDelta !== 0) {
                results.statChanges[key] = (results.statChanges[key] || 0) + actualDelta;
            }
        });

        Object.entries(effectiveLootPlan.statDelta || {}).forEach(([key, value]) => {
            if (typeof value !== 'number' || value === 0) {
                return;
            }

            const before = getStatValue(key);
            const after = changeStatValue(key, value);
            const actualDelta = after - before;

            if (actualDelta !== 0) {
                results.statChanges[key] = (results.statChanges[key] || 0) + actualDelta;
            }
        });

        ensureGameOverState();

        return results;
    }

    function describeLootResults(results) {
        const segments = [];

        if (results.flavorText) {
            segments.push(results.flavorText);
        }

        if (results.gold > 0) {
            segments.push(`золото +${results.gold}`);
        }

        results.itemsAdded.forEach((drop) => {
            segments.push(drop.quantity > 1 ? `${drop.label} x${drop.quantity}` : drop.label);
        });

        results.unlockedRecipes.forEach((drop) => {
            segments.push(drop.label);
        });

        results.unlockedStations.forEach((drop) => {
            segments.push(drop.label);
        });

        if (results.itemsDropped.length > 0) {
            segments.push(`рюкзак полон: ${results.itemsDropped.map((drop) => drop.label).join(', ')}`);
        }

        const positiveChanges = Object.entries(results.statChanges || {}).filter(([, value]) => value > 0);
        const negativeChanges = Object.entries(results.statChanges || {}).filter(([, value]) => value < 0);

        if (positiveChanges.length > 0) {
            segments.push(positiveChanges.map(([key, value]) => `${statLabels[key] || key} +${value}`).join(', '));
        }

        if (negativeChanges.length > 0) {
            segments.push(`потери: ${negativeChanges.map(([key, value]) => `${statLabels[key] || key} ${value}`).join(', ')}`);
        }

        return segments.join(', ');
    }

    function describeLootResultsClean(results) {
        const segments = [];

        if (results.flavorText) {
            segments.push(results.flavorText);
        }

        if (results.gold > 0) {
            segments.push(`золото +${results.gold}`);
        }

        results.itemsAdded.forEach((drop) => {
            segments.push(drop.quantity > 1 ? `${drop.label} x${drop.quantity}` : drop.label);
        });

        if (results.itemsDropped.length > 0) {
            segments.push(`рюкзак полон: ${results.itemsDropped.map((drop) => drop.label).join(', ')}`);
        }

        const positiveChanges = Object.entries(results.statChanges || {}).filter(([, value]) => value > 0);
        const negativeChanges = Object.entries(results.statChanges || {}).filter(([, value]) => value < 0);

        if (positiveChanges.length > 0) {
            segments.push(positiveChanges.map(([key, value]) => `${statLabels[key] || key} +${value}`).join(', '));
        }

        if (negativeChanges.length > 0) {
            segments.push(`потери: ${negativeChanges.map(([key, value]) => `${statLabels[key] || key} ${value}`).join(', ')}`);
        }

        return segments.join(', ');
    }

    function getActiveInteraction() {
        return game.state.activeInteraction || null;
    }

    function getEncounterSource(source = getActiveInteraction() || game.state.activeHouse) {
        return source || null;
    }

    function getHouseEncounter(source = getEncounterSource()) {
        return source && source.expedition ? source.expedition : null;
    }

    function isAllStatsDepleted() {
        return ['hunger', 'energy', 'sleep', 'cold', 'focus'].every((key) => getStatValue(key) <= 0);
    }

    function setActionMessage(message) {
        const nextMessage = typeof message === 'string' ? message : '';
        ui.lastActionMessage = nextMessage;
        markDirty('actionHint');

        if (elements.actionHint && elements.actionHint.textContent !== nextMessage) {
            elements.actionHint.textContent = nextMessage;
        }

        ui.lastRenderedActionHintText = nextMessage;
    }

    function ensureGameOverState() {
        if (game.state.hasWon || !isAllStatsDepleted() || game.state.isGameOver) {
            return false;
        }

        game.state.isGameOver = true;
        game.state.isPaused = false;
        game.state.route = [];
        game.state.routeTotalCost = 0;
        game.state.routePreviewLength = 0;
        game.state.routePreviewTotalCost = 0;
        game.state.routePreviewIsExact = true;
        setActionMessage('Все характеристики исчерпаны. Экспедиция закончилась.');
        return true;
    }

    function triggerVictory(message) {
        game.state.hasWon = true;
        game.state.isGameOver = true;
        game.state.isPaused = false;
        game.state.route = [];
        game.state.routeTotalCost = 0;
        game.state.routePreviewLength = 0;
        game.state.routePreviewTotalCost = 0;
        game.state.routePreviewIsExact = true;
        game.state.victoryMessage = message;
        setActionMessage(message);
    }

    function applyStatDeltas(deltas) {
        Object.entries(deltas).forEach(([key, delta]) => {
            changeStatValue(key, delta);
        });

        ensureGameOverState();
    }

    function applyScaledRewardStats(rewards, tileInfo = game.state.activeTileInfo, options = {}) {
        if (!rewards) {
            return {};
        }

        const applied = {};

        Object.entries(rewards).forEach(([key, value]) => {
            const scaled = getAdjustedRecoveryAmount(key, value, tileInfo, options);
            if (scaled > 0) {
                const before = getStatValue(key);
                const after = changeStatValue(key, scaled);
                const actualGain = Math.max(0, after - before);

                if (actualGain > 0) {
                    applied[key] = actualGain;
                }
            }
        });

        ensureGameOverState();
        return applied;
    }

    function applyDirectRecoveryStats(rewards) {
        if (!rewards) {
            return {};
        }

        const applied = {};

        Object.entries(rewards).forEach(([key, value]) => {
            if (typeof value !== 'number' || value <= 0) {
                return;
            }

            const before = getStatValue(key);
            const after = setStatValue(key, before + value);
            const actualGain = Math.max(0, after - before);

            if (actualGain > 0) {
                applied[key] = actualGain;
            }
        });

        ensureGameOverState();
        return applied;
    }

    function mergeAppliedRewards(...rewardGroups) {
        return rewardGroups.reduce((merged, rewards) => {
            Object.entries(rewards || {}).forEach(([key, value]) => {
                if (typeof value !== 'number' || value <= 0) {
                    return;
                }

                merged[key] = (merged[key] || 0) + value;
            });

            return merged;
        }, {});
    }

    function applyInventoryConsumableEffect(effect, tileInfo = game.state.activeTileInfo) {
        const itemEffects = getItemEffectsModule();
        if (itemEffects && typeof itemEffects.applyInventoryConsumableEffect === 'function') {
            return itemEffects.applyInventoryConsumableEffect(effect, tileInfo);
        }
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
                const before = getStatValue('hunger');
                const after = setStatValue('hunger', statMaximum);
                const actualGain = Math.max(0, after - before);

                if (actualGain > 0) {
                    applied.hunger = actualGain;
                }

                return;
            }

            const delta = getAdjustedRecoveryAmount(key, value, tileInfo, {
                ignoreRecoveryScaling,
                energySource
            });

            if (delta <= 0) {
                return;
            }

            const before = getStatValue(key);
            const after = setStatValue(key, before + delta);
            const actualGain = Math.max(0, after - before);

            if (actualGain > 0) {
                applied[key] = actualGain;
            }
        });

        ensureGameOverState();
        return applied;
    }

    function describeAppliedRewards(appliedRewards) {
        const entries = Object.entries(appliedRewards || {});
        if (entries.length === 0) {
            return '';
        }

        return entries
            .map(([key, value]) => `${statLabels[key] || key} +${value}`)
            .join(', ');
    }

    function buildRewardEffectDrops(appliedRewards) {
        const itemEffects = getItemEffectsModule();
        if (itemEffects && typeof itemEffects.buildRewardEffectDrops === 'function') {
            return itemEffects.buildRewardEffectDrops(appliedRewards);
        }
        return Object.entries(appliedRewards || {})
            .filter(([, value]) => value > 0)
            .map(([key, value]) => ({
                type: 'stat',
                statKey: key,
                label: statLabels[key] || key,
                amount: value,
                icon: statEffectIcons[key] || '+'
            }));
    }

    function buildItemEffectDrop(item) {
        const itemEffects = getItemEffectsModule();
        if (itemEffects && typeof itemEffects.buildItemEffectDrop === 'function') {
            return itemEffects.buildItemEffectDrop(item);
        }
        const normalizedItem = normalizeInventoryItem(item);

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

    function getCurrentGroundItem() {
        const inventoryRuntime = getInventoryRuntime();
        if (inventoryRuntime && typeof inventoryRuntime.getCurrentGroundItem === 'function') {
            return inventoryRuntime.getCurrentGroundItem();
        }
        return game.state.activeGroundItem || null;
    }

    function getGroundItemDescription(groundItem) {
        const inventoryRuntime = getInventoryRuntime();
        if (inventoryRuntime && typeof inventoryRuntime.getGroundItemDescription === 'function') {
            return inventoryRuntime.getGroundItemDescription(groundItem);
        }
        if (!groundItem || !Array.isArray(groundItem.items) || groundItem.items.length === 0) {
            return '';
        }

        return groundItem.items
            .map((item) => `${item.label}${item.quantity > 1 ? ` x${item.quantity}` : ''}`)
            .join(', ');
    }

    function isBridgeBuilderItem(itemId) {
        const itemEffects = getItemEffectsModule();
        if (itemEffects && typeof itemEffects.isBridgeBuilderItem === 'function') {
            return itemEffects.isBridgeBuilderItem(itemId);
        }
        return false;
    }

    function getDefaultActionHint(activeInteraction, tileInfo) {
        const actionUi = getActionUiModule();
        if (actionUi && typeof actionUi.getDefaultActionHint === 'function') {
            return actionUi.getDefaultActionHint(activeInteraction, tileInfo);
        }
        const selectedItem = getSelectedInventoryItem();
        const groundItem = getCurrentGroundItem();
        const encounter = getHouseEncounter(activeInteraction);

        if (selectedItem) {
            if (isBridgeBuilderItem(selectedItem.id)) {
                return `Выбран предмет: ${selectedItem.label}. Подойди к берегу рядом с водой и нажми "Использовать", чтобы уложить одну клетку моста.`;
            }
            return `Выбран предмет: ${selectedItem.label}. Нажми "Использовать" или "Осмотреть".`;
        }

        if (groundItem) {
            return `Под ногами лежит: ${getGroundItemDescription(groundItem)}. Нажми "Использовать", чтобы поднять.`;
        }

        if (encounter) {
            if (encounter.kind === 'merchant') {
                return `${encounter.label}: ${encounter.summary} Нажми "Говорить", чтобы открыть меню торговли.`;
            }

            if (encounter.kind === 'craft_merchant' || encounter.kind === 'artisan') {
                return `${encounter.label}: ${encounter.summary} Нажми "Говорить", чтобы открыть ремесленный заказ.`;
            }

            if (encounter.kind === 'shelter') {
                return `${encounter.label}: ${encounter.summary} Подойди вплотную и нажми "Спать".`;
            }

            if (encounter.kind === 'station_keeper') {
                return `${encounter.label}: ${encounter.summary} Подойди вплотную и нажми "Использовать".`;
            }

            return `${encounter.label}: ${encounter.summary} Подойди вплотную и нажми "Использовать".`;
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

            if (durability <= 1) {
                return 'Старый мост: после следующего прохода он развалится.';
            }

            if (maxDurability > 2) {
                return `${bridgeLabel}: осталось ${durability} из ${maxDurability} проходов.`;
            }

            return 'Обычный мост: первый проход состарит его, второй разрушит.';
        }

        return 'Дальние острова ускоряют расход ресурсов и снижают эффективность восстановления.';
    }

    function queryElements() {
        elements = {
            sceneViewport: document.getElementById('sceneViewport'),
            conditionOverlay: document.getElementById('conditionOverlay'),
            conditionDeathLabel: document.getElementById('conditionDeathLabel'),
            pauseOverlay: document.getElementById('pauseOverlay'),
            pauseMainActions: document.getElementById('pauseMainActions'),
            pauseSlotMenu: document.getElementById('pauseSlotMenu'),
            pauseSlotMenuSummary: document.getElementById('pauseSlotMenuSummary'),
            pauseSlotMenuStatus: document.getElementById('pauseSlotMenuStatus'),
            pauseSlotList: document.getElementById('pauseSlotList'),
            pauseTravelMenu: document.getElementById('pauseTravelMenu'),
            pauseTravelMenuSummary: document.getElementById('pauseTravelMenuSummary'),
            pauseTravelMenuStatus: document.getElementById('pauseTravelMenuStatus'),
            pauseTravelList: document.getElementById('pauseTravelList'),
            pwaStatus: document.getElementById('pwaStatus'),
            merchantPanel: document.getElementById('merchantPanel'),
            merchantPanelTitle: document.getElementById('merchantPanelTitle'),
            merchantPanelSummary: document.getElementById('merchantPanelSummary'),
            merchantPanelGold: document.getElementById('merchantPanelGold'),
            merchantPanelContent: document.getElementById('merchantPanelContent'),
            merchantPanelClose: document.getElementById('merchantPanelClose'),
            statusOverlayKicker: document.getElementById('statusOverlayKicker'),
            statusOverlayTitle: document.getElementById('statusOverlayTitle'),
            statusOverlayMessage: document.getElementById('statusOverlayMessage'),
            pauseButton: document.getElementById('pauseButton'),
            zoomOutButton: document.getElementById('zoomOutButton'),
            zoomInButton: document.getElementById('zoomInButton'),
            pauseResumeButton: document.getElementById('pauseResumeButton'),
            pauseSaveButton: document.getElementById('pauseSaveButton'),
            pauseLoadButton: document.getElementById('pauseLoadButton'),
            pauseTravelButton: document.getElementById('pauseTravelButton'),
            pauseBackButton: document.getElementById('pauseBackButton'),
            pauseTravelBackButton: document.getElementById('pauseTravelBackButton'),
            newGameButton: document.getElementById('newGameButton'),
            inventoryGrid: document.getElementById('inventoryGrid'),
            selectedCharacterPortrait: document.getElementById('selectedCharacterPortrait'),
            selectedCharacterName: document.getElementById('selectedCharacterName'),
            selectedCharacterRole: document.getElementById('selectedCharacterRole'),
            selectedCharacterState: document.getElementById('selectedCharacterState'),
            selectedCharacterTile: document.getElementById('selectedCharacterTile'),
            locationSummary: document.getElementById('locationSummary'),
            routeSummary: document.getElementById('routeSummary'),
            progressSummary: document.getElementById('progressSummary'),
            economySummary: document.getElementById('economySummary'),
            productionGoalsSummary: document.getElementById('productionGoalsSummary'),
            productionGoalsList: document.getElementById('productionGoalsList'),
            instructions: document.getElementById('instructions'),
            instructionsText: document.getElementById('instructionsText'),
            instructionsClose: document.getElementById('instructionsClose'),
            actionHint: document.getElementById('actionHint'),
            statHungerValue: document.getElementById('statHungerValue'),
            statHungerBar: document.getElementById('statHungerBar'),
            statEnergyValue: document.getElementById('statEnergyValue'),
            statEnergyBar: document.getElementById('statEnergyBar'),
            statSleepValue: document.getElementById('statSleepValue'),
            statSleepBar: document.getElementById('statSleepBar'),
            statColdValue: document.getElementById('statColdValue'),
            statColdBar: document.getElementById('statColdBar'),
            statFocusValue: document.getElementById('statFocusValue'),
            statFocusBar: document.getElementById('statFocusBar'),
            actionButtons: Array.from(document.querySelectorAll('.hud-button[data-action]'))
        };
    }

    function setStat(valueElement, barElement, value) {
        const clampedValue = clamp(value, 0, statMaximum);
        if (valueElement) {
            valueElement.textContent = `${Math.round(clampedValue)}%`;
            const valueCard = valueElement.closest('.stat-card');
            if (valueCard) {
                valueCard.style.setProperty('--stat-progress', `${clampedValue}%`);
            }
        }

        if (barElement) {
            barElement.style.width = `${clampedValue}%`;
            const barCard = barElement.closest('.stat-card');
            if (barCard) {
                barCard.style.setProperty('--stat-progress', `${clampedValue}%`);
            }
        }
    }

    function buildInventorySlot(item, index) {
        return getInventoryUiModule().buildInventorySlot(item, index);
    }

    function renderInventory() {
        return getInventoryUiModule().renderInventory();
    }

    function updateStats() {
        return getStatusUiModule().updateStats();
    }

    function updateLocationSummaries(displayPosition, tileInfo, activeHouse, activeInteraction) {
        return getStatusUiModule().updateLocationSummaries(displayPosition, tileInfo, activeHouse, activeInteraction);
    }

    function updateProgressSummaries(tileInfo) {
        return getStatusUiModule().updateProgressSummaries(tileInfo);
    }

    function syncProductionGoalsPanel(tileInfo) {
        return getStatusUiModule().syncProductionGoalsPanel(tileInfo);
    }

    function updateCharacterCard(displayPosition, tileInfo, activeHouse, activeInteraction) {
        return getStatusUiModule().updateCharacterCard(displayPosition, tileInfo, activeHouse, activeInteraction);
    }

    function drawPortrait() {
        return getInventoryUiModule().drawPortrait();
    }

    function syncStatusOverlay() {
        return getStatusUiModule().syncStatusOverlay();
    }

    function syncConditionOverlay() {
        return getStatusUiModule().syncConditionOverlay();
    }

    function setActionButtonState(action, enabled, highlighted = false, visible = null) {
        const actionUi = getActionUiModule();
        if (!actionUi || typeof actionUi.setActionButtonState !== 'function') {
            return;
        }
        return actionUi.setActionButtonState(action, enabled, highlighted, visible);
    }

    function updateActionButtons(activeInteraction = getActiveInteraction()) {
        const actionUi = getActionUiModule();
        if (!actionUi || typeof actionUi.updateActionButtons !== 'function') {
            return;
        }
        return actionUi.updateActionButtons(activeInteraction);
    }

    function resizeCanvasToViewport() {
        if (!elements.sceneViewport) {
            return false;
        }

        const nextWidth = Math.max(320, Math.floor(elements.sceneViewport.clientWidth));
        const nextHeight = Math.max(240, Math.floor(elements.sceneViewport.clientHeight));

        if (game.canvas.width === nextWidth && game.canvas.height === nextHeight) {
            return false;
        }

        game.canvas.width = nextWidth;
        game.canvas.height = nextHeight;
        game.config.canvasWidth = nextWidth;
        game.config.canvasHeight = nextHeight;

        if (game.systems.camera && game.state && game.state.playerPos) {
            game.systems.camera.centerCameraOn(game.state.playerPos);
        }

        return true;
    }

    function isMobileViewport() {
        return window.matchMedia('(max-width: 760px)').matches;
    }

    function clampSceneZoom(value) {
        return clamp(
            Number.isFinite(value) ? value : 1,
            game.config.cameraZoomMin || 0.7,
            game.config.cameraZoomMax || 1.4
        );
    }

    function getSceneZoom() {
        if (game.systems.camera && typeof game.systems.camera.getZoom === 'function') {
            return game.systems.camera.getZoom();
        }

        return clampSceneZoom(game.camera.zoom);
    }

    function getDefaultSceneZoom() {
        return clampSceneZoom(
            isMobileViewport()
                ? game.config.cameraZoomMobileDefault
                : game.config.cameraZoomDefault
        );
    }

    function syncSceneZoomControls() {
        const zoom = getSceneZoom();
        const zoomMin = clampSceneZoom(game.config.cameraZoomMin || 0.7);
        const zoomMax = clampSceneZoom(game.config.cameraZoomMax || 1.4);
        const zoomPercent = `${Math.round(zoom * 100)}%`;

        if (elements.zoomOutButton) {
            elements.zoomOutButton.disabled = zoom <= zoomMin + 0.001;
            elements.zoomOutButton.setAttribute('title', `Отдалить камеру (${zoomPercent})`);
            elements.zoomOutButton.setAttribute('aria-label', `Отдалить камеру. Текущий масштаб ${zoomPercent}`);
        }

        if (elements.zoomInButton) {
            elements.zoomInButton.disabled = zoom >= zoomMax - 0.001;
            elements.zoomInButton.setAttribute('title', `Приблизить камеру (${zoomPercent})`);
            elements.zoomInButton.setAttribute('aria-label', `Приблизить камеру. Текущий масштаб ${zoomPercent}`);
        }
    }

    function setSceneZoom(value, options = {}) {
        const nextZoom = clampSceneZoom(value);
        const currentZoom = getSceneZoom();
        const changed = Math.abs(nextZoom - currentZoom) > 0.001;

        if (game.systems.camera && typeof game.systems.camera.setZoom === 'function') {
            game.systems.camera.setZoom(nextZoom);
        } else {
            game.camera.zoom = nextZoom;
        }

        if (options.isManual) {
            game.camera.hasManualZoom = true;
        }

        syncSceneZoomControls();

        if (changed && !options.skipRender) {
            renderAfterStateChange();
        }

        return changed;
    }

    function syncSceneZoomForViewport(options = {}) {
        if (!game.camera.hasManualZoom || options.force) {
            return setSceneZoom(getDefaultSceneZoom(), {
                isManual: false,
                skipRender: options.skipRender
            });
        }

        syncSceneZoomControls();
        return false;
    }

    function adjustSceneZoom(stepDelta) {
        const step = Number.isFinite(game.config.cameraZoomStep) ? game.config.cameraZoomStep : 0.1;
        return setSceneZoom(getSceneZoom() + (step * stepDelta), {
            isManual: true
        });
    }

    function renderAfterStateChange(sections, options = {}) {
        const sceneChanged = options.sceneChanged !== false;
        markDirty(sections);

        if (game.systems.render) {
            if (sceneChanged) {
                game.systems.render.render();
                return;
            }

            if (
                typeof game.systems.render.hasPendingRender === 'function'
                && game.systems.render.hasPendingRender()
            ) {
                return;
            }
        }

        refreshDirty();
    }

    function persistMerchantState(source) {
        const merchantUi = getMerchantUiModule();
        if (merchantUi && typeof merchantUi.persistMerchantState === 'function') {
            return merchantUi.persistMerchantState(source);
        }

        const shopRuntime = game.systems.shopRuntime || null;
        return shopRuntime && typeof shopRuntime.persistMerchantState === 'function'
            ? shopRuntime.persistMerchantState(source)
            : null;
    }

    function closeMerchantPanel() {
        const merchantUi = getMerchantUiModule();
        if (merchantUi && typeof merchantUi.closeMerchantPanel === 'function') {
            return merchantUi.closeMerchantPanel();
        }

        ui.openMerchantHouseId = null;

        if (elements.merchantPanel) {
            elements.merchantPanel.hidden = true;
        }
    }

    function closeStationPanel(options = {}) {
        const stationUi = getStationUiModule();
        if (!stationUi || typeof stationUi.closeStationPanel !== 'function') {
            return;
        }

        return stationUi.closeStationPanel(options);
    }

    function renderMerchantPanel(activeInteraction = getActiveInteraction()) {
        const merchantUi = getMerchantUiModule();
        if (!merchantUi || typeof merchantUi.renderMerchantPanel !== 'function') {
            return;
        }
        return merchantUi.renderMerchantPanel(activeInteraction);
    }

    function renderStationPanel(activeInteraction = getActiveInteraction()) {
        const stationUi = getStationUiModule();
        if (!stationUi || typeof stationUi.renderStationPanel !== 'function') {
            return;
        }

        return stationUi.renderStationPanel(activeInteraction);
    }

    function openMerchantPanel(source) {
        const merchantUi = getMerchantUiModule();
        if (!merchantUi || typeof merchantUi.openMerchantPanel !== 'function') {
            setActionMessage('Рядом нет торговца или ремесленника.');
            renderAfterStateChange();
            return;
        }
        return merchantUi.openMerchantPanel(source);
    }

    function openStationPanel(source, options = {}) {
        const stationUi = getStationUiModule();
        if (!stationUi || typeof stationUi.openStationPanel !== 'function') {
            setActionMessage('Рядом нет лагеря или станции с отдельным интерфейсом.');
            renderAfterStateChange(['actions', 'inventory', 'actionHint'], {
                sceneChanged: false
            });
            return false;
        }

        return stationUi.openStationPanel(source, options);
    }

    function handleMerchantPanelClick(event) {
        const merchantUi = getMerchantUiModule();
        if (!merchantUi || typeof merchantUi.handleMerchantPanelClick !== 'function') {
            return;
        }
        return merchantUi.handleMerchantPanelClick(event);
    }

    function getBuildDirectionCandidates() {
        const itemEffects = getItemEffectsModule();
        if (itemEffects && typeof itemEffects.getBuildDirectionCandidates === 'function') {
            return itemEffects.getBuildDirectionCandidates();
        }
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
        const itemEffects = getItemEffectsModule();
        if (itemEffects && typeof itemEffects.getBuildableBridgeTarget === 'function') {
            return itemEffects.getBuildableBridgeTarget();
        }
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

    function buildBridgeFromInventoryItem(item) {
        const itemEffects = getItemEffectsModule();
        if (itemEffects && typeof itemEffects.buildBridgeFromInventoryItem === 'function') {
            const outcome = itemEffects.buildBridgeFromInventoryItem(item);
            return Boolean(outcome && outcome.handled);
        }
        const targetTile = getBuildableBridgeTarget();

        if (!item || !isBridgeBuilderItem(item.id)) {
            return false;
        }

        if (!targetTile) {
            setActionMessage('Здесь нельзя уложить мостик: нужен край берега и узкий водный проход.');
            renderAfterStateChange();
            return true;
        }

        if (!game.systems.expedition || !game.systems.expedition.placeBridgeAt(targetTile.x, targetTile.y)) {
            setActionMessage('Не удалось поставить клетку моста.');
            renderAfterStateChange();
            return true;
        }

        consumeSelectedInventoryItem(1);
        game.systems.world.updatePlayerContext(game.state.playerPos);
        setActionMessage(`Из предмета "${item.label}" построена одна клетка моста.`);
        renderAfterStateChange();
        return true;
    }

    function useInventoryItem(item) {
        const itemEffects = getItemEffectsModule();
        if (itemEffects && typeof itemEffects.useInventoryItem === 'function') {
            const outcome = itemEffects.useInventoryItem(item);
            setActionMessage(outcome ? outcome.message : 'Рядом нет объекта для использования.');

            if (outcome && outcome.effectDrops && game.systems.effects) {
                game.systems.effects.spawnInventoryUse(game.state.playerPos, outcome.effectDrops);
            }

            renderAfterStateChange();
            return;
        }
        if (!item) {
            setActionMessage('Выбранный слот пуст.');
            renderAfterStateChange();
            return;
        }

        if (buildBridgeFromInventoryItem(item)) {
            return;
        }

        const effect = getConsumableEffectForUse(item);
        if (effect) {
            const applied = applyInventoryConsumableEffect(effect);
            consumeSelectedInventoryItem(1);

            if (game.systems.effects) {
                game.systems.effects.spawnInventoryUse(game.state.playerPos, buildRewardEffectDrops(applied));
            }
            setActionMessage(`Использован предмет "${item.label}". Получено: ${describeAppliedRewards(applied)}.`);
            ensureGameOverState();
            renderAfterStateChange();
            return;
        }


        setActionMessage(`Предмет "${item.label}" пока не имеет отдельного активного эффекта.`);
        const description = getItemDescription(item.id);
        if (description) {
            setActionMessage(description);
        }
        renderAfterStateChange();
    }

    function selectInventorySlot(index) {
        return getInventoryUiModule().selectInventorySlot(index);
    }

    function handleInventoryClick(event) {
        return getInventoryUiModule().handleInventoryClick(event);
    }

    function performSleep() {
        if (game.state.isMoving) {
            setActionMessage('Сначала нужно завершить движение.');
            renderAfterStateChange();
            return;
        }

        const movementRuntime = game.systems.movement || null;
        const activeInteraction = getActiveInteraction();
        const encounter = getHouseEncounter(activeInteraction);
        let applied;
        let sleepReasonLabel = 'после сна';

        if (encounter && encounter.kind === 'shelter') {
            applied = mergeAppliedRewards(
                applyDirectRecoveryStats({
                    sleep: 50,
                    energy: 50
                }),
                applyScaledRewardStats({
                    focus: 12,
                    cold: 16
                }, game.state.activeTileInfo, { energySource: 'sleep' })
            );
            sleepReasonLabel = 'после привала';

            if (!game.state.isGameOver) {
                setActionMessage(`Привал у укрытия дал: ${describeAppliedRewards(applied)}.`);
            }
        } else if (game.state.activeHouse) {
            applied = mergeAppliedRewards(
                applyDirectRecoveryStats({
                    sleep: 100,
                    energy: 100
                }),
                applyScaledRewardStats({
                    focus: 20,
                    cold: 24
                }, game.state.activeTileInfo, { energySource: 'sleep' })
            );
            sleepReasonLabel = 'после отдыха';

            if (!game.state.isGameOver) {
                setActionMessage(`Отдых в доме дал: ${describeAppliedRewards(applied)}.`);
            }
        } else {
            applied = applyDirectRecoveryStats({
                sleep: 50,
                energy: 50
            });
            applyStatDeltas({
                focus: -12,
                cold: -12
            });
            sleepReasonLabel = 'после сна под открытым небом';

            if (!game.state.isGameOver) {
                setActionMessage(`Сон под открытым небом дал: ${describeAppliedRewards(applied)}. Но стало холоднее и тяжелее собраться.`);
            }
        }

        if (
            !game.state.isGameOver
            && movementRuntime
            && typeof movementRuntime.advanceTimeOfDay === 'function'
        ) {
            movementRuntime.advanceTimeOfDay({
                messagePrefix: typeof ui.lastActionMessage === 'string' ? ui.lastActionMessage : '',
                reasonLabel: sleepReasonLabel
            });
        }

        renderAfterStateChange();
    }

    function resolveHouseUse(source) {
        const encounter = getHouseEncounter(source);
        const dialogueRuntime = game.systems.dialogueRuntime || null;

        if (!encounter) {
            setActionMessage('Внутри пусто. Здесь нет полезного события.');
            renderAfterStateChange();
            return;
        }

        if (
            source
            && encounter.kind !== 'shelter'
            && dialogueRuntime
            && typeof dialogueRuntime.canStartDialogue === 'function'
            && dialogueRuntime.canStartDialogue(source)
        ) {
            dialogueRuntime.startDialogue(source);
            renderAfterStateChange();
            return;
        }

        if (encounter.kind === 'merchant') {
            const merchantQuestStatus = encounter.quest && encounter.quest.completed
                ? 'Квест уже выполнен.'
                : 'Есть квест, покупки и скупка товаров.';
            setActionMessage(`${encounter.label}: ${encounter.summary} ${merchantQuestStatus}`);
            renderAfterStateChange();
            return;
        }

        if (encounter.kind === 'craft_merchant' || encounter.kind === 'artisan') {
            const craftQuestStatus = encounter.quest && encounter.quest.completed
                ? 'Ремесленный заказ уже выполнен.'
                : 'Есть ремесленный заказ и расширение сумки.';
            setActionMessage(`${encounter.label}: ${encounter.summary} ${craftQuestStatus}`);
            renderAfterStateChange();
            return;
        }

        if (encounter.kind === 'shelter') {
            setActionMessage(`Укрытие: ${encounter.summary} Нажми "Спать", чтобы передохнуть.`);
            renderAfterStateChange();
            return;
        }

        if (encounter.kind === 'camp') {
            openStationPanel(source);
            return;
        }

        if (encounter.kind === 'workbench') {
            openStationPanel(source);
            return;
        }

        if (encounter.kind === 'station_keeper') {
            openStationPanel(source);
            return;
        }

        if (isHouseResolved(source)) {
            setActionMessage(`Дом уже исчерпан: ${encounter.label}.`);
            renderAfterStateChange();
            return;
        }

        if (encounter.lootPlan) {
            const lootResults = applyLootPlan(encounter.lootPlan);
            const lootSummary = describeLootResultsClean(lootResults);

            markHouseResolved(source);

            if (game.systems.interactions && (
                encounter.kind === 'chest'
                || encounter.kind === 'jackpotChest'
                || encounter.kind === 'finalChest'
            )) {
                game.systems.interactions.removeInteraction(source);
            }

            if (game.systems.world) {
                game.systems.world.updatePlayerContext(game.state.playerPos);
            }

            if (game.systems.effects && (
                encounter.kind === 'chest'
                || encounter.kind === 'jackpotChest'
                || encounter.kind === 'finalChest'
            )) {
                game.systems.effects.spawnChestResolution(source, lootResults.displayDrops);
            }

            if (encounter.kind === 'finalChest') {
                triggerVictory(
                    `Главный сундук открыт на острове ${encounter.islandIndex}. ${lootSummary || 'Награда найдена.'}`
                );
            } else {
                setActionMessage(`${encounter.label}: ${lootSummary || encounter.summary}`);
            }

            renderAfterStateChange();
            return;
        }

        let message = `${encounter.label}: ${encounter.summary}`;
        let appliedRewards;

        if (encounter.kind === 'forage') {
            const restoreMin = Math.max(1, encounter.hungerRestoreMin || 50);
            const restoreMax = Math.max(restoreMin, encounter.hungerRestoreMax || 75);
            const encounterRandom = game.systems.utils.createSeededRandom(source.worldX || 0, source.worldY || 0);
            const hungerRestore = restoreMin + Math.floor(encounterRandom() * (restoreMax - restoreMin + 1));

            appliedRewards = mergeAppliedRewards(
                applyDirectRecoveryStats({ hunger: hungerRestore }),
                applyScaledRewardStats(
                    encounter.statReward || {},
                    game.state.activeTileInfo,
                    { energySource: 'food' }
                )
            );
        } else {
            appliedRewards = applyScaledRewardStats(
                encounter.statReward || {},
                game.state.activeTileInfo,
                { energySource: 'general' }
            );
        }
        const rewardSummary = describeAppliedRewards(appliedRewards);

        if (encounter.goldReward) {
            changeGold(encounter.goldReward);
            message += ` Получено золото: +${encounter.goldReward}.`;
        }

        if (rewardSummary) {
            message += ` Получено: ${rewardSummary}.`;
        }

        markHouseResolved(source);

        if (encounter.kind === 'finalChest') {
            triggerVictory(`Главный сундук открыт на острове ${encounter.islandIndex}. Экспедиция завершена.`);
        } else {
            setActionMessage(message);
        }

        renderAfterStateChange();
    }

    function inspectActiveHouse() {
        const source = getActiveInteraction();
        const encounter = getHouseEncounter(source);
        const house = source;

        if (!source || !encounter) {
            setActionMessage('Внутри дома нет заметных следов полезного события.');
            renderAfterStateChange();
            return;
        }

        if (encounter.kind === 'merchant') {
            const questStatus = encounter.quest && encounter.quest.completed
                ? 'Квест уже выполнен.'
                : 'Есть квест, покупки и скупка товаров.';
            setActionMessage(`${encounter.label}: ${encounter.summary} ${questStatus}`);
            renderAfterStateChange();
            return;
        }

        if (encounter.kind === 'craft_merchant' || encounter.kind === 'artisan') {
            const craftQuestStatus = encounter.quest && encounter.quest.completed
                ? 'Ремесленный заказ уже выполнен.'
                : 'Есть ремесленный заказ на сумку и особые заготовки.';
            setActionMessage(`${encounter.label}: ${encounter.summary} ${craftQuestStatus}`);
            renderAfterStateChange();
            return;
        }

        if (encounter.kind === 'islandOriginalNpc') {
            setActionMessage(`${encounter.label}: ${encounter.advice || encounter.description || encounter.summary}`);
            renderAfterStateChange();
            return;
        }

        if (encounter.kind === 'camp') {
            setActionMessage(`${encounter.label}: ${encounter.summary} Это отдельная лагерная станция с собственным окном интерфейса.`);
            renderAfterStateChange();
            return;
        }

        if (encounter.kind === 'workbench') {
            setActionMessage(`${encounter.label}: ${encounter.summary} Это отдельная станция с собственным окном интерфейса, а не часть сумки.`);
            renderAfterStateChange();
            return;
        }

        if (encounter.kind === 'station_keeper') {
            setActionMessage(`${encounter.label}: ${encounter.summary} Это отдельный хранитель станции, который открывает только станционный интерфейс.`);
            renderAfterStateChange();
            return;
        }

        const status = isHouseResolved(house) ? 'Дом уже опустошён.' : 'Награда ещё на месте.';
        setActionMessage(`${encounter.label}: ${encounter.summary} ${status}`);
        renderAfterStateChange();
    }

    function handleUseAction() {
        const actionUi = getActionUiModule();
        if (!actionUi || typeof actionUi.handleUseAction !== 'function') {
            return;
        }
        return actionUi.handleUseAction();
    }

    function handleInspectAction() {
        const actionUi = getActionUiModule();
        if (!actionUi || typeof actionUi.handleInspectAction !== 'function') {
            return;
        }
        return actionUi.handleInspectAction();
    }

    function handleTalkAction() {
        const actionUi = getActionUiModule();
        if (!actionUi || typeof actionUi.handleTalkAction !== 'function') {
            return;
        }
        return actionUi.handleTalkAction();
    }

    function handleActionClick(event) {
        const actionUi = getActionUiModule();
        if (!actionUi || typeof actionUi.handleActionClick !== 'function') {
            return;
        }
        return actionUi.handleActionClick(event);
    }

    function bindEvents() {
        if (eventsBound) {
            return;
        }

        if (elements.pauseButton) {
            elements.pauseButton.addEventListener('click', () => {
                togglePause();
            });
        }

        if (elements.zoomOutButton) {
            elements.zoomOutButton.addEventListener('click', () => {
                adjustSceneZoom(-1);
            });
        }

        if (elements.zoomInButton) {
            elements.zoomInButton.addEventListener('click', () => {
                adjustSceneZoom(1);
            });
        }

        if (elements.pauseResumeButton) {
            elements.pauseResumeButton.addEventListener('click', () => {
                togglePause();
            });
        }

        if (elements.pauseSaveButton) {
            elements.pauseSaveButton.addEventListener('click', () => {
                const statusUi = getStatusUiModule();

                if (statusUi && typeof statusUi.openPauseSaveMenu === 'function') {
                    statusUi.openPauseSaveMenu();
                }
            });
        }

        if (elements.pauseLoadButton) {
            elements.pauseLoadButton.addEventListener('click', () => {
                const statusUi = getStatusUiModule();

                if (statusUi && typeof statusUi.openPauseLoadMenu === 'function') {
                    statusUi.openPauseLoadMenu();
                }
            });
        }

        if (elements.pauseTravelButton) {
            elements.pauseTravelButton.addEventListener('click', () => {
                const statusUi = getStatusUiModule();

                if (statusUi && typeof statusUi.openPauseTravelMenu === 'function') {
                    statusUi.openPauseTravelMenu();
                }
            });
        }

        if (elements.pauseBackButton) {
            elements.pauseBackButton.addEventListener('click', () => {
                const statusUi = getStatusUiModule();

                if (statusUi && typeof statusUi.closePauseSlotMenu === 'function') {
                    statusUi.closePauseSlotMenu();
                }
            });
        }

        if (elements.pauseTravelBackButton) {
            elements.pauseTravelBackButton.addEventListener('click', () => {
                const statusUi = getStatusUiModule();

                if (statusUi && typeof statusUi.closePauseTravelMenu === 'function') {
                    statusUi.closePauseTravelMenu();
                }
            });
        }

        if (elements.newGameButton) {
            elements.newGameButton.addEventListener('click', () => {
                const statusUi = getStatusUiModule();

                if (statusUi && typeof statusUi.startNewGame === 'function') {
                    statusUi.startNewGame();
                }
            });
        }

        if (elements.pauseSlotList) {
            elements.pauseSlotList.addEventListener('click', (event) => {
                const statusUi = getStatusUiModule();

                if (statusUi && typeof statusUi.handlePauseSlotListClick === 'function') {
                    statusUi.handlePauseSlotListClick(event);
                }
            });
        }

        if (elements.pauseTravelList) {
            elements.pauseTravelList.addEventListener('click', (event) => {
                const statusUi = getStatusUiModule();

                if (statusUi && typeof statusUi.handlePauseTravelListClick === 'function') {
                    statusUi.handlePauseTravelListClick(event);
                }
            });
        }

        if (elements.inventoryGrid) {
            elements.inventoryGrid.addEventListener('click', handleInventoryClick);
        }

        if (elements.merchantPanel) {
            elements.merchantPanel.addEventListener('click', handleMerchantPanelClick);
        }

        if (elements.merchantPanelClose) {
            elements.merchantPanelClose.addEventListener('click', () => {
                closeMerchantPanel();
                renderAfterStateChange();
            });
        }

        if (elements.instructionsClose) {
            elements.instructionsClose.addEventListener('click', () => {
                dismissInstructions();
            });
        }

        elements.actionButtons.forEach((button) => {
            button.addEventListener('click', handleActionClick);
        });

        eventsBound = true;
    }

    function refreshDirty(
        displayPosition = game.state.playerPos,
        activeHouse = game.state.activeHouse,
        activeInteraction = game.state.activeInteraction
    ) {
        const perf = game.systems.perf || null;
        const refresh = () => {
            if (!elements.sceneViewport) {
                queryElements();
                bindEvents();
            }

            const tileInfo = game.state.activeTileInfo;
            const roundedPosition = roundPosition(displayPosition);
            const contextKey = [
                roundedPosition.x,
                roundedPosition.y,
                activeHouse ? activeHouse.id : 'none',
                activeInteraction ? activeInteraction.id : 'none',
                game.state.activeGroundItemId || 'none',
                game.state.selectedInventorySlot === null ? 'none' : game.state.selectedInventorySlot,
                game.state.isMoving ? 'moving' : 'idle'
            ].join('|');

            const shouldResetActionMessage = ui.lastActionContextKey !== contextKey;

            if (shouldResetActionMessage && !game.state.isMoving) {
                ui.lastActionContextKey = contextKey;
                ui.lastActionMessage = '';
            }

            if (!hasDirtySections() && !shouldResetActionMessage) {
                return false;
            }

            const dirtySections = consumeDirtySections();
            const dialogueUi = getDialogueUiModule();
            const questUi = getQuestUiModule();
            const mapUi = getMapUiModule();
            const mobileUi = getMobileUiModule();

            if (dirtySections.has('stats')) {
                updateStats();
            }

            if (dirtySections.has('location')) {
                updateLocationSummaries(displayPosition, tileInfo, activeHouse, activeInteraction);
            }

            if (dirtySections.has('progress')) {
                updateProgressSummaries(tileInfo);
            }

            if (dirtySections.has('progress') || dirtySections.has('inventory') || dirtySections.has('location')) {
                updateInstructionsText();
            }

            if (
                dirtySections.has('progress')
                || dirtySections.has('inventory')
                || dirtySections.has('location')
            ) {
                syncProductionGoalsPanel(tileInfo);
            }

            if (dirtySections.has('character')) {
                updateCharacterCard(displayPosition, tileInfo, activeHouse, activeInteraction);
            }

            if (dirtySections.has('actions')) {
                updateActionButtons(activeInteraction);
            }

            if (dirtySections.has('inventory')) {
                renderInventory();
            }

            if (dirtySections.has('portrait')) {
                drawPortrait();
            }

            if (dirtySections.has('condition')) {
                syncConditionOverlay();
            }

            if (dirtySections.has('status')) {
                syncStatusOverlay();
            }

            if (dirtySections.has('merchant')) {
                renderMerchantPanel(activeInteraction);
            }

            if (
                shouldResetActionMessage
                || dirtySections.has('location')
                || dirtySections.has('actions')
                || dirtySections.has('inventory')
                || dirtySections.has('merchant')
                || dirtySections.has('map')
            ) {
                renderStationPanel(activeInteraction);
            }

            if (dirtySections.has('dialogue') && dialogueUi && typeof dialogueUi.syncDialogueState === 'function') {
                dialogueUi.syncDialogueState();
            }

            if (dirtySections.has('quests') && questUi && typeof questUi.syncQuestState === 'function') {
                questUi.syncQuestState();
            }

            if (dirtySections.has('map') && mapUi && typeof mapUi.syncMapState === 'function') {
                mapUi.syncMapState();
            }

            syncActionHint(activeInteraction, tileInfo, contextKey, dirtySections, shouldResetActionMessage);

            if (mobileUi && typeof mobileUi.sync === 'function' && shouldSyncMobileUi(dirtySections, shouldResetActionMessage)) {
                mobileUi.sync({
                    dirtySections: Array.from(dirtySections),
                    shouldResetActionMessage
                });
            }

            return true;
        };

        if (perf && typeof perf.measure === 'function') {
            return perf.measure('refreshDirty', refresh);
        }

        return refresh();
    }

    function refresh(
        displayPosition = game.state.playerPos,
        activeHouse = game.state.activeHouse,
        activeInteraction = game.state.activeInteraction
    ) {
        markDirty();
        return refreshDirty(displayPosition, activeHouse, activeInteraction);
    }

    function syncInstructionsOverlay() {
        if (!elements.instructions) {
            return;
        }

        elements.instructions.hidden = Boolean(game.state.isInstructionsDismissed);
    }

    function updateInstructionsText() {
        if (!elements.instructionsText) {
            return;
        }

        if (game.state.isInstructionsDismissed) {
            return;
        }

        const onboardingState = buildCraftOnboardingState();
        elements.instructionsText.textContent = buildCraftOnboardingText(onboardingState);
    }

    function dismissInstructions() {
        game.state.isInstructionsDismissed = true;
        syncInstructionsOverlay();
        renderAfterStateChange();
    }

    function initializeLayout() {
        queryElements();
        bindEvents();
        resizeCanvasToViewport();
        syncSceneZoomForViewport({
            force: true,
            skipRender: true
        });
        if (getMobileUiModule() && typeof getMobileUiModule().initialize === 'function') {
            getMobileUiModule().initialize();
        }
        updateInstructionsText();
        syncInstructionsOverlay();
        markDirty();
    }

    function handleResize() {
        const resized = resizeCanvasToViewport();
        const zoomChanged = syncSceneZoomForViewport({
            skipRender: true
        });

        if (resized || zoomChanged) {
            markDirty();
            if (game.systems.render) {
                game.systems.render.render();
            }
        }

        if (getMobileUiModule() && typeof getMobileUiModule().sync === 'function') {
            getMobileUiModule().sync();
        }
    }

    function togglePause(forceValue) {
        return getStatusUiModule().togglePause(forceValue);
    }

    function applyMovementStepCosts() {
        return getStatusUiModule().applyMovementStepCosts();
    }

    function applyPathCompletionCosts() {
        return getStatusUiModule().applyPathCompletionCosts();
    }

    const uiBridge = game.systems.uiBridge = game.systems.uiBridge || {};

    Object.assign(uiBridge, {
        coldDrainDivider,
        applyScaledRewardStats,
        getGame: () => game,
        getUi: () => ui,
        getElements: () => elements,
        applyStatDeltas,
        clamp,
        changeGold,
        describeAppliedRewards,
        ensureGameOverState,
        formatRouteCost,
        getAdjustedRecoveryAmount,
        getActivePenaltySummary,
        getActivePenaltyTags,
        getConditionScreenState,
        getCriticalDepletionMultiplier,
        getCurrentProgression,
        getCurrentGroundItem,
        getDefaultActionHint,
        getFocusMultiplier,
        getGold,
        getHouseEncounter,
        getInventory,
        getInventoryBulkCapacity,
        getInventoryBulkUsage,
        getGroundItemDescription,
        getItemDefinition,
        getItemBulk,
        getItemDescription,
        getOpeningHungerDrainMultiplier,
        getRouteBandBreakdown,
        getRouteLengthLimit,
        getRouteReasonBreakdown,
        getSelectedInventoryItem,
        getSleepDrainMultiplier,
        getStatEffectIcon: (key) => statEffectIcons[key] || '+',
        getStatLabel: (key) => statLabels[key] || key,
        getStatValue,
        getStepEnergyDrainMultiplier,
        getTileLabel,
        getTimeOfDayAdvancesElapsed,
        getTimeOfDayLabel,
        getSceneZoom,
        getTravelBandLabel,
        getUnlockedInventorySlots,
        isAllStatsDepleted,
        isHouseResolved,
        isStatDepleted,
        inspectActiveHouse,
        markDirty,
        markHouseResolved,
        normalizeInventoryItem,
        openStationPanel,
        performSleep,
        renderAfterStateChange,
        refreshDirty,
        resolveHouseUse,
        restoreFullEnergy,
        roundPosition,
        scaleDrain,
        scaleRecovery,
        setActionMessage,
        setStat,
        setStatValue,
        triggerVictory
    });

    Object.assign(ui, {
        markDirty,
        refresh,
        refreshDirty,
        initializeLayout,
        handleResize,
        getSceneZoom,
        setSceneZoom,
        adjustSceneZoom,
        togglePause,
        applyMovementStepCosts,
        applyPathCompletionCosts,
        performSleep,
        getRouteLengthLimit,
        renderAfterStateChange,
        useInventoryItem,
        setActionMessage
    });
})();
