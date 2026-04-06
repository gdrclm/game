(() => {
    const game = window.Game;
    const rewardScaling = game.systems.rewardScaling = game.systems.rewardScaling || {};
    const islandPressureThreshold = 7;
    const islandPressureTierCap = 5;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function getPricingSystem() {
        return game.systems.pricing || null;
    }

    function getWeatherRuntime() {
        return game.systems.weatherRuntime || null;
    }

    function getModifierSnapshot(context = {}) {
        const itemEffects = game.systems.itemEffects || null;
        return itemEffects && typeof itemEffects.getModifierSnapshot === 'function'
            ? itemEffects.getModifierSnapshot(context)
            : {
                drainMultiplier: 1,
                recoveryMultiplier: 1,
                foodRecoveryMultiplier: 1,
                routeLengthBonus: 0
            };
    }

    function getStatValue(key) {
        const stats = game.state.survivalStats || {};
        return clamp(typeof stats[key] === 'number' ? stats[key] : 0, 0, 100);
    }

    function isStatDepleted(key) {
        return getStatValue(key) <= 0;
    }

    function resetCriticalDepletionStepStreak() {
        game.state.criticalDepletionStepStreak = 0;
    }

    function countDepletedStats() {
        return ['hunger', 'energy', 'sleep', 'cold', 'focus']
            .reduce((count, key) => count + (isStatDepleted(key) ? 1 : 0), 0);
    }

    function getIslandIndex(tileInfo = game.state.activeTileInfo) {
        if (tileInfo && tileInfo.progression && Number.isFinite(tileInfo.progression.islandIndex)) {
            return tileInfo.progression.islandIndex;
        }

        return Math.max(1, game.state.currentIslandIndex || 1);
    }

    function getIslandPressureState() {
        game.state.islandPressureStepsByIndex = game.state.islandPressureStepsByIndex || {};
        return game.state.islandPressureStepsByIndex;
    }

    function getIslandPressureSteps(tileInfo = game.state.activeTileInfo) {
        const islandIndex = typeof tileInfo === 'number' ? tileInfo : getIslandIndex(tileInfo);
        return Math.max(0, getIslandPressureState()[islandIndex] || 0);
    }

    function getIslandPressureTier(tileInfo = game.state.activeTileInfo) {
        return clamp(Math.floor(getIslandPressureSteps(tileInfo) / islandPressureThreshold), 0, islandPressureTierCap);
    }

    function getIslandPressureDrainMultiplier(tileInfo = game.state.activeTileInfo) {
        return 1 + getIslandPressureTier(tileInfo) * 0.04;
    }

    function getIslandPressureRecoveryMultiplier(tileInfo = game.state.activeTileInfo) {
        return clamp(1 - getIslandPressureTier(tileInfo) * 0.03, 0.82, 1);
    }

    function getIslandPressureSummary(tileInfo = game.state.activeTileInfo) {
        const tier = getIslandPressureTier(tileInfo);
        return `Нагрузка острова ${tier}/${islandPressureTierCap}`;
    }

    function addIslandPressureSteps(tileInfo = game.state.activeTileInfo, steps = 1) {
        if (!tileInfo || tileInfo.house || !tileInfo.progression) {
            return getIslandPressureSteps(tileInfo);
        }

        const islandIndex = getIslandIndex(tileInfo);
        const pressureState = getIslandPressureState();
        const maxSteps = islandPressureThreshold * (islandPressureTierCap + 1);
        const normalizedSteps = Number.isFinite(steps)
            ? Math.max(0, Math.floor(steps))
            : 0;
        pressureState[islandIndex] = clamp((pressureState[islandIndex] || 0) + normalizedSteps, 0, maxSteps);
        return pressureState[islandIndex];
    }

    function recordIslandTraversalStep(tileInfo = game.state.activeTileInfo) {
        return addIslandPressureSteps(tileInfo, 1);
    }

    function getWeather(tileInfo = game.state.activeTileInfo) {
        const weatherRuntime = getWeatherRuntime();
        return weatherRuntime && typeof weatherRuntime.getWeather === 'function'
            ? weatherRuntime.getWeather(tileInfo)
            : {
                key: 'clear',
                label: 'Ясно',
                routeMultiplier: 1,
                drainMultiplier: 1,
                recoveryMultiplier: 1,
                coldDrainMultiplier: 1,
                sleepDrainMultiplier: 1
            };
    }

    function getWeatherRouteMultiplier(tileInfo = game.state.activeTileInfo) {
        return getWeather(tileInfo).routeMultiplier || 1;
    }

    function getWeatherDrainMultiplier(tileInfo = game.state.activeTileInfo) {
        return getWeather(tileInfo).drainMultiplier || 1;
    }

    function getWeatherRecoveryMultiplier(tileInfo = game.state.activeTileInfo) {
        return getWeather(tileInfo).recoveryMultiplier || 1;
    }

    function getWeatherColdDrainMultiplier(tileInfo = game.state.activeTileInfo) {
        return getWeather(tileInfo).coldDrainMultiplier || 1;
    }

    function getWeatherSleepDrainMultiplier(tileInfo = game.state.activeTileInfo) {
        return getWeather(tileInfo).sleepDrainMultiplier || 1;
    }

    function getBaseOutsideDrainMultiplier(tileInfo = game.state.activeTileInfo) {
        if (!tileInfo || !tileInfo.progression) {
            return 1;
        }

        const modifiers = getModifierSnapshot({
            currentIslandIndex: getIslandIndex(tileInfo)
        });
        return tileInfo.progression.outsideDrainMultiplier
            * getIslandPressureDrainMultiplier(tileInfo)
            * getWeatherDrainMultiplier(tileInfo)
            * (modifiers.drainMultiplier || 1);
    }

    function getBaseOutsideRecoveryMultiplier(tileInfo = game.state.activeTileInfo) {
        if (!tileInfo || !tileInfo.progression) {
            return 1;
        }

        const modifiers = getModifierSnapshot({
            currentIslandIndex: getIslandIndex(tileInfo)
        });
        return tileInfo.progression.recoveryMultiplier
            * getIslandPressureRecoveryMultiplier(tileInfo)
            * getWeatherRecoveryMultiplier(tileInfo)
            * (modifiers.recoveryMultiplier || 1);
    }

    function getBaseDrainMultiplier(tileInfo = game.state.activeTileInfo) {
        if (!tileInfo || !tileInfo.progression) {
            return 1;
        }

        return tileInfo.house ? 1 : getBaseOutsideDrainMultiplier(tileInfo);
    }

    function getBaseRecoveryMultiplier(tileInfo = game.state.activeTileInfo) {
        if (!tileInfo || !tileInfo.progression) {
            return 1;
        }

        return tileInfo.house ? 1 : getBaseOutsideRecoveryMultiplier(tileInfo);
    }

    function getOutsidePreviewDrainMultiplier(tileInfo = game.state.activeTileInfo) {
        return getBaseOutsideDrainMultiplier(tileInfo);
    }

    function getOutsidePreviewRecoveryMultiplier(tileInfo = game.state.activeTileInfo) {
        return getBaseOutsideRecoveryMultiplier(tileInfo);
    }

    function getDrainMultiplier(tileInfo = game.state.activeTileInfo) {
        return getBaseDrainMultiplier(tileInfo);
    }

    function getRecoveryMultiplier(tileInfo = game.state.activeTileInfo) {
        return getBaseRecoveryMultiplier(tileInfo);
    }

    function scaleDrain(value, tileInfo = game.state.activeTileInfo) {
        return Math.max(1, Math.round(value * getDrainMultiplier(tileInfo)));
    }

    function scaleRecovery(value, tileInfo = game.state.activeTileInfo) {
        return Math.max(0, Math.round(value * getRecoveryMultiplier(tileInfo)));
    }

    function isOutsideExposure(tileInfo = game.state.activeTileInfo) {
        if (game.state.activeHouse) {
            return false;
        }

        return Boolean(!tileInfo || !tileInfo.house);
    }

    function getFocusMultiplier() {
        return isStatDepleted('focus') ? 1.65 : 1;
    }

    function getCriticalDepletionMultiplier() {
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
        const adjustedOptions = options || {};
        let adjusted = adjustedOptions.ignoreRecoveryScaling
            ? value
            : scaleRecovery(value, tileInfo);

        if (adjusted <= 0) {
            return 0;
        }

        if (key === 'energy') {
            adjusted = Math.round(adjusted * getEnergyRecoveryMultiplier(adjustedOptions.energySource || 'general'));
        } else if (key === 'focus') {
            adjusted = Math.round(adjusted * getFocusRecoveryMultiplier());
        }

        if ((adjustedOptions.energySource || 'general') === 'food') {
            const modifiers = getModifierSnapshot({
                currentIslandIndex: getIslandIndex(tileInfo)
            });
            adjusted = Math.round(adjusted * (modifiers.foodRecoveryMultiplier || 1));
        }

        return Math.max(0, adjusted);
    }

    function getStepEnergyDrainMultiplier(tileInfo = game.state.activeTileInfo) {
        let multiplier = 1;

        if (isStatDepleted('energy')) {
            multiplier *= 1.25;
        }

        if (isStatDepleted('cold') && isOutsideExposure(tileInfo)) {
            multiplier *= 1.35;
        }

        if (isOutsideExposure(tileInfo)) {
            multiplier *= getWeatherColdDrainMultiplier(tileInfo);
        }

        return multiplier;
    }

    function getSleepDrainMultiplier(tileInfo = game.state.activeTileInfo) {
        let multiplier = 1;

        if (isStatDepleted('cold') && isOutsideExposure(tileInfo)) {
            multiplier *= 1.3;
        }

        if (isOutsideExposure(tileInfo)) {
            multiplier *= getWeatherSleepDrainMultiplier(tileInfo);
        }

        return multiplier;
    }

    function getRouteLengthLimit() {
        const modifiers = getModifierSnapshot({
            currentIslandIndex: game.state.currentIslandIndex
        });
        const baseLimit = Math.max(1, (game.config.maxMoveCellsPerTurn || 5) + (modifiers.routeLengthBonus || 0));

        if (isStatDepleted('sleep')) {
            return Math.max(2, baseLimit - 1);
        }

        return baseLimit;
    }

    function getActivePenaltyTags(tileInfo = game.state.activeTileInfo) {
        const tags = [];
        const weather = getWeather(tileInfo);
        const islandPressureTier = getIslandPressureTier(tileInfo);

        if (weather && weather.key !== 'clear') {
            tags.push(`погода: ${weather.label.toLowerCase()}`);
        }

        if (islandPressureTier > 0) {
            tags.push(getIslandPressureSummary(tileInfo).toLowerCase());
        }

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
        const tags = getActivePenaltyTags(tileInfo);

        if (tags.length === 0) {
            return '';
        }

        if (!Number.isFinite(maxEntries) || maxEntries <= 0 || tags.length <= maxEntries) {
            return tags.join(' · ');
        }

        return `${tags.slice(0, maxEntries).join(' · ')} · +${tags.length - maxEntries}`;
    }

    function getMerchantQuestReward(itemId, quantity = 1, islandIndex = 1) {
        const pricing = getPricingSystem();
        const baseValue = pricing && typeof pricing.getItemBaseValue === 'function'
            ? pricing.getItemBaseValue(itemId)
            : 1;

        return Math.max(8, Math.round(baseValue * quantity * 1.8 + islandIndex * 2));
    }

    Object.assign(rewardScaling, {
        getDrainMultiplier,
        getRecoveryMultiplier,
        getOutsidePreviewDrainMultiplier,
        getOutsidePreviewRecoveryMultiplier,
        scaleDrain,
        scaleRecovery,
        getFocusMultiplier,
        getCriticalDepletionMultiplier,
        getAdjustedRecoveryAmount,
        getStepEnergyDrainMultiplier,
        getSleepDrainMultiplier,
        getRouteLengthLimit,
        getIslandPressureSteps,
        getIslandPressureTier,
        getIslandPressureSummary,
        addIslandPressureSteps,
        recordIslandTraversalStep,
        getWeather,
        getWeatherLabel: (tileInfo = game.state.activeTileInfo) => getWeather(tileInfo).label,
        getActivePenaltyTags,
        getActivePenaltySummary,
        getMerchantQuestReward
    });
})();
