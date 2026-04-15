(() => {
    const statusUi = window.Game.systems.statusUi = window.Game.systems.statusUi || {};
    const bridge = window.Game.systems.uiBridge;
    const PAUSE_MENU_MODE_MAIN = 'main';
    const PAUSE_MENU_MODE_SAVE = 'save';
    const PAUSE_MENU_MODE_LOAD = 'load';
    const PAUSE_MENU_MODE_TRAVEL = 'travel';
    const TIME_OF_DAY_LABELS = Object.freeze(['Рассвет', 'День', 'Сумерки', 'Ночь']);
    let sleepOverlayAnimationFrameId = null;
    let pauseMenuMode = PAUSE_MENU_MODE_MAIN;
    let pauseMenuStatusMessage = '';

    if (!bridge) {
        return;
    }

    function getSaveLoadSystem() {
        const game = bridge.getGame();
        return game && game.systems ? game.systems.saveLoad || null : null;
    }

    function getGameLifecycle() {
        return window.Game && window.Game.systems ? window.Game.systems.gameLifecycle || null : null;
    }

    function getInventoryRuntime() {
        const game = bridge.getGame();
        return game && game.systems ? game.systems.inventoryRuntime || null : null;
    }

    function getItemRegistry() {
        const game = bridge.getGame();
        return game && game.systems ? game.systems.itemRegistry || null : null;
    }

    function getCraftingRuntime() {
        const game = bridge.getGame();
        return game && game.systems ? game.systems.craftingRuntime || null : null;
    }

    function getStationRuntime() {
        const game = bridge.getGame();
        return game && game.systems ? game.systems.stationRuntime || null : null;
    }

    function getBagUpgradeRuntime() {
        const game = bridge.getGame();
        return game && game.systems ? game.systems.bagUpgradeRuntime || null : null;
    }

    function getExpeditionProgression() {
        const game = bridge.getGame();
        return game && game.systems
            ? (game.systems.expeditionProgression || game.systems.expedition || null)
            : null;
    }

    function getBoatRuntime() {
        const game = bridge.getGame();
        return game && game.systems ? game.systems.boatRuntime || null : null;
    }

    function getBridgeRuntime() {
        const game = bridge.getGame();
        return game && game.systems ? game.systems.bridgeRuntime || null : null;
    }

    function getIslandNeedProfileSystem() {
        const game = bridge.getGame();
        return game && game.systems ? game.systems.islandNeedProfile || null : null;
    }

    const PRODUCTION_PRIORITY_ORDER = Object.freeze({
        mandatory: 0,
        recommended: 1,
        optional: 2,
        active: 3,
        later: 4,
        complete: 5
    });
    const PRODUCTION_STATUS_ORDER = Object.freeze({
        urgent: 0,
        ready: 1,
        craftable: 2,
        assembling: 3,
        active: 4,
        later: 5,
        missing: 6
    });
    const PRODUCTION_GOAL_DEFINITIONS = Object.freeze([
        {
            id: 'bridge',
            label: 'Мост',
            branchIds: ['first_bridge', 'endgame_route', 'guaranteed_route'],
            readyItemIds: ['bridge_kit', 'portableBridge', 'reinforcedBridge', 'fieldBridge', 'absoluteBridge'],
            partialItemIds: ['wood_plank_basic', 'fiber_rope', 'stone_block'],
            recipeIds: ['portable-bridge', 'portable-bridge-assembly', 'reinforced-bridge-upgrade', 'field-bridge-upgrade', 'absolute-bridge-upgrade'],
            emptyHint: 'Держи мостовой комплект к разломам и островам переправ.'
        },
        {
            id: 'repair',
            label: 'Ремонт',
            branchIds: ['bridge_repair', 'repair_support'],
            readyItemIds: ['repair_kit_bridge', 'repair_kit_boat'],
            partialItemIds: ['wood_plank_basic', 'gravel_fill', 'fiber_rope', 'fish_oil'],
            recipeIds: ['bridge-repair-kit', 'boat-repair-kit'],
            emptyHint: 'Ремкомплект нужен раньше, чем маршрут окончательно сломается.'
        },
        {
            id: 'boat',
            label: 'Лодка',
            branchIds: ['boat_frame', 'boat_ready', 'water_escape'],
            readyItemIds: ['boat_ready'],
            partialItemIds: ['boatFrame', 'fish_oil', 'fiber_rope', 'wood_frame_basic', 'wood_plank_basic'],
            recipeIds: ['boat-frame', 'boat'],
            emptyHint: 'К водной фазе лодка должна быть уже собрана, а не только задумана.'
        },
        {
            id: 'potion',
            label: 'Зелье',
            branchIds: ['cheap_healing', 'tempo_boost', 'strong_survival', 'final_survival'],
            readyItemIds: ['healingBrew', 'energyTonic', 'secondWind'],
            partialItemIds: ['healing_base', 'herb_paste', 'flask_water_alchemy'],
            recipeIds: ['healing-brew', 'energy-tonic', 'second-wind'],
            emptyHint: 'Хотя бы одна лечебная или темповая варка должна быть под рукой.'
        },
        {
            id: 'bagQuest',
            label: 'Сумочный квест',
            branchIds: ['collector_loadout'],
            readyItemIds: [],
            partialItemIds: [],
            recipeIds: [],
            emptyHint: 'Следи за ремесленным заказом на следующий слот сумки.'
        }
    ]);

    function canUseSaveSlots() {
        return typeof localStorage !== 'undefined'
            && Boolean(getSaveLoadSystem());
    }

    function resetPauseMenuState() {
        pauseMenuMode = PAUSE_MENU_MODE_MAIN;
        pauseMenuStatusMessage = '';
    }

    function setPauseMenuMode(nextMode) {
        pauseMenuMode = nextMode;
        pauseMenuStatusMessage = '';
    }

    function setPauseMenuStatus(message) {
        pauseMenuStatusMessage = typeof message === 'string' ? message : '';
    }

    function getPauseModeSummary() {
        if (pauseMenuMode === PAUSE_MENU_MODE_SAVE) {
            return 'Выбери слот, чтобы сохранить текущее прохождение или перезаписать существующее.';
        }

        if (pauseMenuMode === PAUSE_MENU_MODE_LOAD) {
            return 'Выбери сохранённый слот, чтобы загрузить прохождение.';
        }

        if (pauseMenuMode === PAUSE_MENU_MODE_TRAVEL) {
            return 'Выбери остров, чтобы мгновенно перейти на него.';
        }

        return '';
    }

    function getTimeOfDayLabelByIndex(index) {
        if (!Number.isFinite(index)) {
            return 'Неизвестно';
        }

        return TIME_OF_DAY_LABELS[Math.max(0, Math.floor(index)) % TIME_OF_DAY_LABELS.length] || 'Неизвестно';
    }

    function formatSavedAt(savedAt) {
        if (typeof savedAt !== 'string' || !savedAt) {
            return 'Нет даты';
        }

        const parsedDate = new Date(savedAt);
        if (Number.isNaN(parsedDate.getTime())) {
            return 'Нет даты';
        }

        try {
            return new Intl.DateTimeFormat('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(parsedDate);
        } catch (error) {
            return parsedDate.toLocaleString('ru-RU');
        }
    }

    function buildPauseSlotMetaParts(slot) {
        const metadata = slot && slot.metadata ? slot.metadata : null;

        if (!metadata) {
            return [];
        }

        return [
            `Остров ${metadata.islandIndex || 1}`,
            getTimeOfDayLabelByIndex(metadata.currentTimeOfDayIndex),
            `Золото ${metadata.gold || 0}`,
            `Сумка ${metadata.occupiedInventorySlots || 0}`
        ];
    }

    function normalizeStringList(list) {
        return Array.isArray(list)
            ? list
                .filter((entry) => typeof entry === 'string' && entry.trim())
                .map((entry) => entry.trim())
            : [];
    }

    function countTruthyEntries(record) {
        if (!record || typeof record !== 'object') {
            return 0;
        }

        return Object.values(record).reduce((sum, value) => sum + (value ? 1 : 0), 0);
    }

    function countInventoryItem(itemId) {
        const inventoryRuntime = getInventoryRuntime();
        return inventoryRuntime && typeof inventoryRuntime.countInventoryItem === 'function'
            ? inventoryRuntime.countInventoryItem(itemId)
            : 0;
    }

    function countAnyInventoryItems(itemIds = []) {
        return (Array.isArray(itemIds) ? itemIds : []).reduce((sum, itemId) => sum + countInventoryItem(itemId), 0);
    }

    function getItemLabel(itemId, fallback = '') {
        const itemRegistry = getItemRegistry();
        const definition = itemRegistry && typeof itemRegistry.getItemDefinition === 'function'
            ? itemRegistry.getItemDefinition(itemId)
            : null;
        return definition && definition.label
            ? definition.label
            : (fallback || itemId);
    }

    function formatInventoryItemSummary(itemIds = []) {
        const parts = (Array.isArray(itemIds) ? itemIds : [])
            .map((itemId) => ({
                itemId,
                quantity: countInventoryItem(itemId)
            }))
            .filter((entry) => entry.quantity > 0)
            .map((entry) => `${getItemLabel(entry.itemId)} x${entry.quantity}`);

        return parts.join(', ');
    }

    function getActiveStationContext(activeInteraction = bridge.getGame().state.activeInteraction, activeHouse = bridge.getGame().state.activeHouse) {
        const stationRuntime = getStationRuntime();
        if (!stationRuntime || typeof stationRuntime.getActiveStationContext !== 'function') {
            return {
                availableStations: ['hand'],
                availableStationLabels: ['Руки'],
                activeStationId: 'hand',
                activeStationLabel: 'Руки'
            };
        }

        return stationRuntime.getActiveStationContext({
            activeInteraction: activeInteraction || null,
            activeHouse: activeHouse || null
        });
    }

    function buildRecipeEvaluationEntries(recipeIds = [], stationContext, activeInteraction = bridge.getGame().state.activeInteraction, activeHouse = bridge.getGame().state.activeHouse) {
        const craftingRuntime = getCraftingRuntime();

        if (
            !craftingRuntime
            || typeof craftingRuntime.getCompiledRecipe !== 'function'
            || typeof craftingRuntime.evaluateRecipeAgainstInventory !== 'function'
        ) {
            return [];
        }

        return (Array.isArray(recipeIds) ? recipeIds : [])
            .map((recipeId) => {
                const recipe = craftingRuntime.getCompiledRecipe(recipeId);
                if (!recipe) {
                    return null;
                }

                return {
                    recipeId,
                    recipe,
                    evaluation: craftingRuntime.evaluateRecipeAgainstInventory(recipeId, {
                        activeInteraction: activeInteraction || null,
                        activeHouse: activeHouse || null,
                        availableStations: stationContext && Array.isArray(stationContext.availableStations)
                            ? stationContext.availableStations
                            : undefined,
                        scanNearbyEnvironment: true
                    })
                };
            })
            .filter(Boolean);
    }

    function getGoalPriorityLevel(goalDefinition, craftRequirementSummary, stage) {
        if (goalDefinition.id === 'bagQuest') {
            if (stage && Number.isFinite(stage.targetSlots)) {
                return 'active';
            }

            return 'later';
        }

        const mandatoryBranches = new Set(normalizeStringList(craftRequirementSummary && craftRequirementSummary.mandatoryBranches));
        const recommendedBranches = new Set(normalizeStringList(craftRequirementSummary && craftRequirementSummary.recommendedBranches));
        const optionalBranches = new Set(normalizeStringList(craftRequirementSummary && craftRequirementSummary.optionalBranches));
        const branchIds = Array.isArray(goalDefinition && goalDefinition.branchIds) ? goalDefinition.branchIds : [];

        if (branchIds.some((branchId) => mandatoryBranches.has(branchId))) {
            return 'mandatory';
        }

        if (branchIds.some((branchId) => recommendedBranches.has(branchId))) {
            return 'recommended';
        }

        if (branchIds.some((branchId) => optionalBranches.has(branchId))) {
            return 'optional';
        }

        return 'later';
    }

    function getGoalPriorityLabel(priorityLevel, stage = null) {
        switch (priorityLevel) {
        case 'mandatory':
            return 'Жёстко нужно';
        case 'recommended':
            return 'Желательно';
        case 'optional':
            return 'Опционально';
        case 'active':
            return stage && Number.isFinite(stage.targetSlots)
                ? `Слот ${stage.targetSlots}`
                : 'Активно';
        case 'complete':
            return 'Закрыто';
        default:
            return 'Позже';
        }
    }

    function buildGenericGoalState(goalDefinition, recipeEvaluations) {
        const readySummary = formatInventoryItemSummary(goalDefinition.readyItemIds);
        const partialSummary = formatInventoryItemSummary(goalDefinition.partialItemIds);
        const readyCount = countAnyInventoryItems(goalDefinition.readyItemIds);
        const partialCount = countAnyInventoryItems(goalDefinition.partialItemIds);
        const successfulRecipe = recipeEvaluations.find((entry) => entry.evaluation && entry.evaluation.success);
        const stationLockedRecipe = recipeEvaluations.find((entry) => entry.evaluation && entry.evaluation.reason === 'wrong-station');

        if (readyCount > 0) {
            return {
                status: 'ready',
                statusLabel: 'Готово',
                detail: `В сумке уже есть: ${readySummary}.`
            };
        }

        if (successfulRecipe) {
            return {
                status: 'craftable',
                statusLabel: 'Можно собрать',
                detail: `Сейчас можно собрать: ${successfulRecipe.recipe.label}.`
            };
        }

        if (partialCount > 0) {
            return {
                status: 'assembling',
                statusLabel: 'Готовим',
                detail: `Есть заготовки: ${partialSummary}.`
            };
        }

        if (stationLockedRecipe) {
            return {
                status: 'later',
                statusLabel: 'Нужна станция',
                detail: `Следующий шаг на станции "${stationLockedRecipe.recipe.stationLabel}".`
            };
        }

        return {
            status: 'missing',
            statusLabel: 'Пока пусто',
            detail: goalDefinition.emptyHint || 'Эта ветка ещё не подготовлена.'
        };
    }

    function buildBridgeGoalState(goalDefinition, recipeEvaluations) {
        return buildGenericGoalState(goalDefinition, recipeEvaluations);
    }

    function buildPotionGoalState(goalDefinition, recipeEvaluations) {
        return buildGenericGoalState(goalDefinition, recipeEvaluations);
    }

    function buildBoatGoalState(goalDefinition, recipeEvaluations) {
        const boatRuntime = getBoatRuntime();
        const activeBoatTraversal = boatRuntime && typeof boatRuntime.hasActiveBoatTraversal === 'function'
            ? boatRuntime.hasActiveBoatTraversal()
            : false;
        const boatDurability = boatRuntime && typeof boatRuntime.getBoatDurability === 'function'
            ? boatRuntime.getBoatDurability()
            : 0;
        const boatMaxDurability = boatRuntime && typeof boatRuntime.getBoatMaxDurability === 'function'
            ? boatRuntime.getBoatMaxDurability()
            : 0;
        const boatReadyCount = countAnyInventoryItems(goalDefinition.readyItemIds);
        const boatFrameCount = countInventoryItem('boatFrame');
        const buildBoatEntry = recipeEvaluations.find((entry) => entry.recipeId === 'boat' && entry.evaluation && entry.evaluation.success);
        const buildFrameEntry = recipeEvaluations.find((entry) => entry.recipeId === 'boat-frame' && entry.evaluation && entry.evaluation.success);
        const stationLockedEntry = recipeEvaluations.find((entry) => entry.evaluation && entry.evaluation.reason === 'wrong-station');
        const partialSummary = formatInventoryItemSummary(goalDefinition.partialItemIds);

        if (activeBoatTraversal) {
            return {
                status: 'ready',
                statusLabel: 'На ходу',
                detail: boatMaxDurability > 0
                    ? `Лодка уже активна: прочность ${boatDurability}/${boatMaxDurability}.`
                    : 'Лодка уже активна и даёт проход по воде.'
            };
        }

        if (boatReadyCount > 0) {
            return {
                status: 'ready',
                statusLabel: 'Готово',
                detail: `В сумке уже есть: ${formatInventoryItemSummary(goalDefinition.readyItemIds)}.`
            };
        }

        if (buildBoatEntry) {
            return {
                status: 'craftable',
                statusLabel: 'Можно собрать',
                detail: 'Каркас и компоненты на месте, готовую лодку можно собрать прямо сейчас.'
            };
        }

        if (boatFrameCount > 0) {
            return {
                status: 'assembling',
                statusLabel: 'Каркас готов',
                detail: `Рама лодки уже собрана. Осталось добрать жир и верёвку.`
            };
        }

        if (buildFrameEntry) {
            return {
                status: 'assembling',
                statusLabel: 'Можно начать',
                detail: 'Сейчас можно собрать каркас лодки как первый шаг водной ветки.'
            };
        }

        if (countAnyInventoryItems(goalDefinition.partialItemIds) > 0) {
            return {
                status: 'assembling',
                statusLabel: 'Готовим',
                detail: `Есть заготовки: ${partialSummary}.`
            };
        }

        if (stationLockedEntry) {
            return {
                status: 'later',
                statusLabel: 'Нужна станция',
                detail: `Следующий шаг на станции "${stationLockedEntry.recipe.stationLabel}".`
            };
        }

        return {
            status: 'missing',
            statusLabel: 'Пока пусто',
            detail: goalDefinition.emptyHint
        };
    }

    function buildRepairGoalState(goalDefinition, recipeEvaluations) {
        const bridgeRuntime = getBridgeRuntime();
        const boatRuntime = getBoatRuntime();
        const weakenedBridgeCount = bridgeRuntime && typeof bridgeRuntime.getWeakenedBridgeState === 'function'
            ? countTruthyEntries(bridgeRuntime.getWeakenedBridgeState())
            : 0;
        const boatNeedsRepair = boatRuntime && typeof boatRuntime.hasRepairableBoatTraversal === 'function'
            ? boatRuntime.hasRepairableBoatTraversal()
            : false;
        const boatDurability = boatRuntime && typeof boatRuntime.getBoatDurability === 'function'
            ? boatRuntime.getBoatDurability()
            : 0;
        const boatMaxDurability = boatRuntime && typeof boatRuntime.getBoatMaxDurability === 'function'
            ? boatRuntime.getBoatMaxDurability()
            : 0;
        const readyCount = countAnyInventoryItems(goalDefinition.readyItemIds);
        const successfulRecipe = recipeEvaluations.find((entry) => entry.evaluation && entry.evaluation.success);
        const partialCount = countAnyInventoryItems(goalDefinition.partialItemIds);
        const activeProblems = [];

        if (weakenedBridgeCount > 0) {
            activeProblems.push(`мосты ${weakenedBridgeCount}`);
        }

        if (boatNeedsRepair) {
            activeProblems.push(
                boatMaxDurability > 0
                    ? `лодка ${boatDurability}/${boatMaxDurability}`
                    : 'лодка'
            );
        }

        if (readyCount > 0) {
            return {
                status: activeProblems.length > 0 ? 'urgent' : 'ready',
                statusLabel: activeProblems.length > 0 ? 'Чинить можно' : 'Готово',
                detail: activeProblems.length > 0
                    ? `Есть чем чинить: ${activeProblems.join(', ')}.`
                    : `В сумке уже есть: ${formatInventoryItemSummary(goalDefinition.readyItemIds)}.`
            };
        }

        if (activeProblems.length > 0 && successfulRecipe) {
            return {
                status: 'craftable',
                statusLabel: 'Собирай сейчас',
                detail: `Уже есть что чинить: ${activeProblems.join(', ')}. Ремкомплект можно собрать прямо сейчас.`
            };
        }

        if (activeProblems.length > 0 && partialCount > 0) {
            return {
                status: 'assembling',
                statusLabel: 'Срочно готовим',
                detail: `Есть заготовки под ремонт: ${formatInventoryItemSummary(goalDefinition.partialItemIds)}.`
            };
        }

        if (activeProblems.length > 0) {
            return {
                status: 'urgent',
                statusLabel: 'Нет ремнабора',
                detail: `Есть что чинить, но ремкомплекта нет: ${activeProblems.join(', ')}.`
            };
        }

        return buildGenericGoalState(goalDefinition, recipeEvaluations);
    }

    function buildBagQuestGoalState(goalDefinition, islandIndex) {
        const bagUpgradeRuntime = getBagUpgradeRuntime();
        const inventoryRuntime = getInventoryRuntime();
        const currentSlots = inventoryRuntime && typeof inventoryRuntime.getUnlockedInventorySlots === 'function'
            ? inventoryRuntime.getUnlockedInventorySlots()
            : (bridge.getGame().state.unlockedInventorySlots || 4);

        if (
            !bagUpgradeRuntime
            || typeof bagUpgradeRuntime.getAvailableStageForIsland !== 'function'
            || typeof bagUpgradeRuntime.getStageEvaluation !== 'function'
        ) {
            return {
                priorityLevel: 'later',
                priorityLabel: 'Позже',
                status: 'later',
                statusLabel: 'Нет данных',
                detail: goalDefinition.emptyHint
            };
        }

        const stage = bagUpgradeRuntime.getAvailableStageForIsland(islandIndex, {
            currentSlots
        });

        if (!stage) {
            return {
                priorityLevel: currentSlots >= 10 ? 'complete' : 'later',
                priorityLabel: currentSlots >= 10 ? 'Закрыто' : 'Позже',
                status: currentSlots >= 10 ? 'ready' : 'later',
                statusLabel: currentSlots >= 10 ? 'Максимум' : 'Ещё рано',
                detail: currentSlots >= 10
                    ? 'Линия расширения сумки уже доведена до предела.'
                    : goalDefinition.emptyHint
            };
        }

        const evaluation = bagUpgradeRuntime.getStageEvaluation(stage, {
            currentIslandIndex: islandIndex
        });
        const displayState = typeof bagUpgradeRuntime.buildQuestDisplayState === 'function'
            ? bagUpgradeRuntime.buildQuestDisplayState(stage, evaluation)
            : null;

        if (evaluation && evaluation.isComplete) {
            return {
                priorityLevel: 'active',
                priorityLabel: `Слот ${stage.targetSlots}`,
                status: 'ready',
                statusLabel: 'Можно сдавать',
                detail: `Комплект ${stage.sourceSlots}→${stage.targetSlots} уже собран.`
            };
        }

        if (evaluation && evaluation.progressCurrent > 0) {
            return {
                priorityLevel: 'active',
                priorityLabel: `Слот ${stage.targetSlots}`,
                status: 'assembling',
                statusLabel: `${evaluation.progressCurrent}/${evaluation.progressRequired}`,
                detail: displayState && displayState.missingSummaryLabel
                    ? displayState.missingSummaryLabel
                    : `Собираем комплект для слота ${stage.targetSlots}.`
            };
        }

        return {
            priorityLevel: 'active',
            priorityLabel: `Слот ${stage.targetSlots}`,
            status: 'active',
            statusLabel: 'Активен',
            detail: displayState && displayState.progressHeadline
                ? displayState.progressHeadline
                : `Нужно подготовить комплект для расширения сумки до ${stage.targetSlots} слотов.`
        };
    }

    function buildProductionGoalState(goalDefinition, context = {}) {
        if (goalDefinition.id === 'bagQuest') {
            return buildBagQuestGoalState(goalDefinition, context.islandIndex);
        }

        const priorityLevel = getGoalPriorityLevel(goalDefinition, context.craftRequirementSummary, null);
        const priorityLabel = getGoalPriorityLabel(priorityLevel);
        let goalState = null;

        switch (goalDefinition.id) {
        case 'bridge':
            goalState = buildBridgeGoalState(goalDefinition, context.recipeEvaluations);
            break;
        case 'repair':
            goalState = buildRepairGoalState(goalDefinition, context.recipeEvaluations);
            break;
        case 'boat':
            goalState = buildBoatGoalState(goalDefinition, context.recipeEvaluations);
            break;
        case 'potion':
            goalState = buildPotionGoalState(goalDefinition, context.recipeEvaluations);
            break;
        default:
            goalState = buildGenericGoalState(goalDefinition, context.recipeEvaluations);
            break;
        }

        return {
            priorityLevel,
            priorityLabel,
            ...goalState
        };
    }

    function buildProductionGoalsSummary(goals, craftRequirementSummary) {
        const windowLabel = craftRequirementSummary && craftRequirementSummary.windowId
            ? craftRequirementSummary.windowId.replace(/-/g, ' ').replace(/\b([a-z])/g, (match) => match.toUpperCase())
            : '';
        const focus = craftRequirementSummary && craftRequirementSummary.focus
            ? craftRequirementSummary.focus
            : (craftRequirementSummary && craftRequirementSummary.phaseLabel ? craftRequirementSummary.phaseLabel : 'Текущая фаза');
        const mandatoryGoals = goals.filter((goal) => goal.priorityLevel === 'mandatory').map((goal) => goal.label.toLowerCase());
        const recommendedGoals = goals.filter((goal) => goal.priorityLevel === 'recommended').map((goal) => goal.label.toLowerCase());
        const activeBagGoal = goals.find((goal) => goal.id === 'bagQuest' && goal.priorityLevel === 'active');
        const parts = [];

        parts.push(windowLabel ? `${windowLabel}: ${focus}.` : `${focus}.`);

        if (mandatoryGoals.length > 0) {
            parts.push(`Жёстко держи: ${mandatoryGoals.join(', ')}.`);
        } else if (recommendedGoals.length > 0) {
            parts.push(`Сейчас важнее держать рядом: ${recommendedGoals.join(', ')}.`);
        } else {
            parts.push('Это окно больше про подготовку и перенос заготовок, чем про срочный крафт.');
        }

        if (activeBagGoal && activeBagGoal.status !== 'ready') {
            parts.push('Сумочный заказ тоже уже можно вести параллельно.');
        }

        return parts.join(' ');
    }

    function buildProductionGoalsState(tileInfo = bridge.getGame().state.activeTileInfo) {
        const game = bridge.getGame();
        const progression = bridge.getCurrentProgression(tileInfo);
        const islandIndex = progression && Number.isFinite(progression.islandIndex)
            ? Math.max(1, Math.floor(progression.islandIndex))
            : Math.max(1, Math.floor(Number(game.state.currentIslandIndex) || 1));
        const expeditionProgression = game.systems.expeditionProgression || null;
        const craftRequirementSummary = expeditionProgression && typeof expeditionProgression.getIslandCraftRequirementSummary === 'function'
            ? expeditionProgression.getIslandCraftRequirementSummary(progression || islandIndex)
            : {
                islandIndex,
                focus: progression && progression.craftNeedFocus ? progression.craftNeedFocus : '',
                phaseLabel: progression && progression.craftRequirementPhaseLabel ? progression.craftRequirementPhaseLabel : '',
                windowId: progression && progression.craftNeedWindowId ? progression.craftNeedWindowId : '',
                mandatoryBranches: normalizeStringList(progression && progression.craftNeedMandatoryBranches),
                recommendedBranches: normalizeStringList(progression && progression.craftNeedRecommendedBranches),
                optionalBranches: normalizeStringList(progression && progression.craftNeedOptionalBranches)
            };
        const islandNeedProfile = getIslandNeedProfileSystem();
        const expandedNeedWindow = islandNeedProfile && typeof islandNeedProfile.getExpandedNeedWindow === 'function'
            ? islandNeedProfile.getExpandedNeedWindow(islandIndex)
            : null;
        const stationContext = getActiveStationContext(game.state.activeInteraction, game.state.activeHouse);
        const goals = PRODUCTION_GOAL_DEFINITIONS.map((goalDefinition) => {
            const recipeEvaluations = buildRecipeEvaluationEntries(
                goalDefinition.recipeIds,
                stationContext,
                game.state.activeInteraction,
                game.state.activeHouse
            );
            const goalState = buildProductionGoalState(goalDefinition, {
                islandIndex,
                progression,
                craftRequirementSummary,
                expandedNeedWindow,
                stationContext,
                recipeEvaluations
            });

            return {
                id: goalDefinition.id,
                label: goalDefinition.label,
                priorityLevel: goalState.priorityLevel,
                priorityLabel: goalState.priorityLabel,
                status: goalState.status,
                statusLabel: goalState.statusLabel,
                detail: goalState.detail
            };
        });

        goals.sort((left, right) => {
            const leftPriority = PRODUCTION_PRIORITY_ORDER[left.priorityLevel] ?? 99;
            const rightPriority = PRODUCTION_PRIORITY_ORDER[right.priorityLevel] ?? 99;

            if (leftPriority !== rightPriority) {
                return leftPriority - rightPriority;
            }

            const leftStatus = PRODUCTION_STATUS_ORDER[left.status] ?? 99;
            const rightStatus = PRODUCTION_STATUS_ORDER[right.status] ?? 99;

            if (leftStatus !== rightStatus) {
                return leftStatus - rightStatus;
            }

            return left.label.localeCompare(right.label, 'ru');
        });

        return {
            islandIndex,
            windowId: craftRequirementSummary && craftRequirementSummary.windowId ? craftRequirementSummary.windowId : '',
            focus: craftRequirementSummary && craftRequirementSummary.focus ? craftRequirementSummary.focus : '',
            summary: buildProductionGoalsSummary(goals, craftRequirementSummary),
            goals
        };
    }

    function buildProductionGoalNode(goal) {
        const item = document.createElement('article');
        item.className = 'production-goals__item';
        item.classList.add(`production-goals__item--${goal.priorityLevel || 'later'}`);
        item.classList.add(`production-goals__item--status-${goal.status || 'missing'}`);

        const header = document.createElement('div');
        header.className = 'production-goals__header';

        const title = document.createElement('h3');
        title.className = 'production-goals__title';
        title.textContent = goal.label;

        const badges = document.createElement('div');
        badges.className = 'production-goals__badges';

        const priorityBadge = document.createElement('span');
        priorityBadge.className = 'production-goals__badge production-goals__badge--priority';
        priorityBadge.textContent = goal.priorityLabel;

        const statusBadge = document.createElement('span');
        statusBadge.className = 'production-goals__badge production-goals__badge--status';
        statusBadge.textContent = goal.statusLabel;

        badges.append(priorityBadge, statusBadge);
        header.append(title, badges);

        const detail = document.createElement('p');
        detail.className = 'production-goals__detail';
        detail.textContent = goal.detail || '';

        item.append(header, detail);
        return item;
    }

    function syncProductionGoalsPanel(tileInfo = bridge.getGame().state.activeTileInfo) {
        const elements = bridge.getElements();
        const panelState = buildProductionGoalsState(tileInfo);

        if (elements.productionGoalsSummary) {
            elements.productionGoalsSummary.textContent = panelState.summary;
        }

        if (elements.productionGoalsList) {
            elements.productionGoalsList.replaceChildren(
                ...panelState.goals.map((goal) => buildProductionGoalNode(goal))
            );
        }

        return panelState;
    }

    function createPauseSlotCard(slot) {
        const article = document.createElement('article');
        const top = document.createElement('div');
        const label = document.createElement('div');
        const savedAt = document.createElement('div');
        const meta = document.createElement('div');
        const note = document.createElement('p');
        const actionButton = document.createElement('button');
        const isSaveMode = pauseMenuMode === PAUSE_MENU_MODE_SAVE;
        const isOccupied = Boolean(slot && slot.occupied);
        const metaParts = buildPauseSlotMetaParts(slot);

        article.className = 'pause-save-slot';
        if (!isOccupied) {
            article.classList.add('pause-save-slot--empty');
        }

        top.className = 'pause-save-slot__top';
        label.className = 'pause-save-slot__label';
        label.textContent = `Слот ${slot.slotId}`;
        savedAt.className = 'pause-save-slot__saved-at';
        savedAt.textContent = isOccupied ? formatSavedAt(slot.savedAt) : 'Пустой слот';
        top.append(label, savedAt);

        meta.className = 'pause-save-slot__meta';
        if (metaParts.length > 0) {
            metaParts.forEach((part) => {
                const chip = document.createElement('span');
                chip.textContent = part;
                meta.appendChild(chip);
            });
        } else {
            const chip = document.createElement('span');
            chip.textContent = 'Сохранения ещё нет';
            meta.appendChild(chip);
        }

        note.className = 'pause-save-slot__note';
        note.textContent = isSaveMode
            ? (isOccupied ? 'Перезапишет содержимое этого слота.' : 'Сохранит текущее прохождение в этот слот.')
            : (isOccupied ? 'Загрузит прохождение из этого слота.' : 'Этот слот пока пуст.');

        actionButton.type = 'button';
        actionButton.className = 'hud-button pause-save-slot__action';
        actionButton.setAttribute('data-pause-slot-id', String(slot.slotId));
        actionButton.textContent = isSaveMode
            ? (isOccupied ? 'Перезаписать' : 'Сохранить')
            : (isOccupied ? 'Загрузить' : 'Пусто');
        actionButton.disabled = !isSaveMode && !isOccupied;

        article.append(top, meta, note, actionButton);
        return article;
    }

    function renderPauseSlotMenu() {
        const elements = bridge.getElements();
        const saveLoad = getSaveLoadSystem();
        const isMainMode = pauseMenuMode === PAUSE_MENU_MODE_MAIN;
        const isTravelMode = pauseMenuMode === PAUSE_MENU_MODE_TRAVEL;
        const showSlotMenu = (pauseMenuMode === PAUSE_MENU_MODE_SAVE || pauseMenuMode === PAUSE_MENU_MODE_LOAD)
            && canUseSaveSlots()
            && saveLoad
            && typeof saveLoad.listSaveSlots === 'function';
        const slots = showSlotMenu ? saveLoad.listSaveSlots() : [];
        const expeditionProgression = getExpeditionProgression();
        const travelEntries = isTravelMode && expeditionProgression && typeof expeditionProgression.getArchipelagoMetadata === 'function'
            ? expeditionProgression.getArchipelagoMetadata()
            : [];

        if (elements.pauseMainActions) {
            elements.pauseMainActions.hidden = !isMainMode;
        }

        if (elements.pauseSlotMenu) {
            elements.pauseSlotMenu.hidden = !showSlotMenu;
        }

        if (elements.pauseTravelMenu) {
            elements.pauseTravelMenu.hidden = !isTravelMode;
        }

        if (elements.pwaStatus) {
            elements.pwaStatus.hidden = !isMainMode;
        }

        if (elements.pauseSlotMenuSummary) {
            elements.pauseSlotMenuSummary.textContent = getPauseModeSummary();
        }

        if (elements.pauseSlotMenuStatus) {
            const shouldShowStatus = typeof pauseMenuStatusMessage === 'string' && pauseMenuStatusMessage.trim() !== '';
            elements.pauseSlotMenuStatus.textContent = shouldShowStatus ? pauseMenuStatusMessage : '';
            elements.pauseSlotMenuStatus.hidden = !shouldShowStatus;
        }

        if (elements.pauseTravelMenuSummary) {
            elements.pauseTravelMenuSummary.textContent = getPauseModeSummary();
        }

        if (elements.pauseTravelMenuStatus) {
            const shouldShowStatus = typeof pauseMenuStatusMessage === 'string' && pauseMenuStatusMessage.trim() !== '';
            elements.pauseTravelMenuStatus.textContent = shouldShowStatus ? pauseMenuStatusMessage : '';
            elements.pauseTravelMenuStatus.hidden = !shouldShowStatus;
        }

        if (elements.pauseSlotList) {
            elements.pauseSlotList.replaceChildren();
            slots.forEach((slot) => {
                elements.pauseSlotList.appendChild(createPauseSlotCard(slot));
            });
        }

        if (elements.pauseTravelList) {
            elements.pauseTravelList.replaceChildren();
            if (isTravelMode) {
                const currentIslandIndex = Math.max(1, Math.floor(bridge.getGame().state.currentIslandIndex || 1));
                travelEntries.forEach((entry) => {
                    elements.pauseTravelList.appendChild(createPauseTravelCard(entry, currentIslandIndex));
                });
            }
        }
    }

    function openPauseSaveMenu() {
        if (!canUseSaveSlots()) {
            return false;
        }

        setPauseMenuMode(PAUSE_MENU_MODE_SAVE);
        bridge.renderAfterStateChange(['status'], {
            sceneChanged: false
        });
        return true;
    }

    function openPauseLoadMenu() {
        if (!canUseSaveSlots()) {
            return false;
        }

        setPauseMenuMode(PAUSE_MENU_MODE_LOAD);
        bridge.renderAfterStateChange(['status'], {
            sceneChanged: false
        });
        return true;
    }

    function closePauseSlotMenu() {
        resetPauseMenuState();
        bridge.renderAfterStateChange(['status'], {
            sceneChanged: false
        });
    }

    function openPauseTravelMenu() {
        setPauseMenuMode(PAUSE_MENU_MODE_TRAVEL);
        const expeditionProgression = getExpeditionProgression();
        if (expeditionProgression && typeof expeditionProgression.getArchipelagoMetadata === 'function') {
            expeditionProgression.getArchipelagoMetadata();
        }
        bridge.renderAfterStateChange(['status'], {
            sceneChanged: false
        });
        return true;
    }

    function closePauseTravelMenu() {
        resetPauseMenuState();
        bridge.renderAfterStateChange(['status'], {
            sceneChanged: false
        });
    }

    function handlePauseSlotListClick(event) {
        const actionButton = event.target.closest('[data-pause-slot-id]');
        const slotId = Number(actionButton && actionButton.getAttribute('data-pause-slot-id'));

        if (!actionButton || actionButton.disabled || !Number.isInteger(slotId)) {
            return false;
        }

        const saveLoad = getSaveLoadSystem();
        if (!saveLoad) {
            return false;
        }

        if (pauseMenuMode === PAUSE_MENU_MODE_SAVE) {
            const savedRecord = typeof saveLoad.saveToSlot === 'function'
                ? saveLoad.saveToSlot(slotId, bridge.getGame().state)
                : null;

            setPauseMenuStatus(savedRecord
                ? `Слот ${slotId} сохранён.`
                : `Не удалось сохранить слот ${slotId}.`);
            bridge.renderAfterStateChange(['status'], {
                sceneChanged: false
            });
            return Boolean(savedRecord);
        }

        if (pauseMenuMode === PAUSE_MENU_MODE_LOAD) {
            const lifecycle = getGameLifecycle();
            const loaded = lifecycle && typeof lifecycle.loadGameFromSlot === 'function'
                ? lifecycle.loadGameFromSlot(slotId)
                : false;

            if (!loaded) {
                setPauseMenuStatus(`Слот ${slotId} пуст или повреждён.`);
                bridge.renderAfterStateChange(['status'], {
                    sceneChanged: false
                });
                return false;
            }

            resetPauseMenuState();
            return true;
        }

        return false;
    }

    function createPauseTravelCard(entry, currentIslandIndex) {
        const islandIndex = entry && Number.isFinite(entry.islandIndex) ? entry.islandIndex : 0;
        const isCurrent = islandIndex === currentIslandIndex;
        const article = document.createElement('article');
        article.className = 'pause-save-slot pause-save-slot--travel';

        if (!entry || !entry.hasVisited) {
            article.classList.add('pause-save-slot--empty');
        }

        const top = document.createElement('div');
        top.className = 'pause-save-slot__top';

        const label = document.createElement('strong');
        label.className = 'pause-save-slot__label';
        label.textContent = entry
            ? `Остров ${islandIndex}: ${entry.label || `Остров ${islandIndex}`}`
            : 'Неизвестный остров';

        top.appendChild(label);

        const meta = document.createElement('div');
        meta.className = 'pause-save-slot__meta';
        const metaLines = [];

        if (entry && entry.craftPhaseLabel) {
            metaLines.push(entry.craftPhaseLabel);
        }

        if (entry && entry.craftSummary) {
            metaLines.push(entry.craftSummary);
        }

        if (entry && entry.scenario) {
            metaLines.push(entry.scenario);
        }

        if (entry && Number.isFinite(entry.chunkCount)) {
            metaLines.push(`Чанков: ${entry.chunkCount}`);
        }

        meta.textContent = metaLines.filter(Boolean).join(' · ');

        const note = document.createElement('p');
        note.className = 'pause-save-slot__note';
        note.textContent = isCurrent ? 'Текущий остров.' : 'Мгновенный перенос к входу острова.';

        const actionButton = document.createElement('button');
        actionButton.className = 'hud-button pause-save-slot__action';
        actionButton.type = 'button';
        actionButton.textContent = isCurrent ? 'Сейчас здесь' : 'Перейти';
        actionButton.disabled = isCurrent || !entry;
        actionButton.setAttribute('data-travel-island-id', String(islandIndex));

        article.append(top, meta, note, actionButton);
        return article;
    }

    function handlePauseTravelListClick(event) {
        const actionButton = event.target.closest('[data-travel-island-id]');
        const islandIndex = Number(actionButton && actionButton.getAttribute('data-travel-island-id'));

        if (!actionButton || actionButton.disabled || !Number.isInteger(islandIndex)) {
            return false;
        }

        const expeditionProgression = getExpeditionProgression();
        if (!expeditionProgression || typeof expeditionProgression.fastTravelToIsland !== 'function') {
            return false;
        }

        const result = expeditionProgression.fastTravelToIsland(islandIndex);
        setPauseMenuStatus(result && result.message ? result.message : 'Переход выполнен.');
        bridge.renderAfterStateChange(['status', 'character', 'map', 'actionHint', 'actions'], {
            sceneChanged: true
        });

        if (result && result.success) {
            resetPauseMenuState();
            togglePause(false);
        }

        return Boolean(result && result.success);
    }

    function ensureSleepOverlay() {
        const elements = bridge.getElements();
        const sceneViewport = elements.sceneViewport;

        if (!sceneViewport) {
            return null;
        }

        let overlay = document.getElementById('sleepTransitionOverlay');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'sleepTransitionOverlay';
            overlay.className = 'sleep-transition-overlay';
            overlay.hidden = true;
            overlay.setAttribute('aria-hidden', 'true');
            sceneViewport.appendChild(overlay);
        }

        return overlay;
    }

    function playSleepTransition() {
        const overlay = ensureSleepOverlay();

        if (!overlay) {
            return false;
        }

        if (sleepOverlayAnimationFrameId) {
            cancelAnimationFrame(sleepOverlayAnimationFrameId);
            sleepOverlayAnimationFrameId = null;
        }

        overlay.hidden = false;
        overlay.classList.remove('is-active');
        overlay.removeEventListener('animationend', handleSleepTransitionEnd);
        void overlay.offsetWidth;

        sleepOverlayAnimationFrameId = requestAnimationFrame(() => {
            overlay.classList.add('is-active');
            overlay.addEventListener('animationend', handleSleepTransitionEnd, { once: true });
            sleepOverlayAnimationFrameId = null;
        });

        return true;
    }

    function handleSleepTransitionEnd(event) {
        const overlay = event.currentTarget;

        if (!overlay) {
            return;
        }

        overlay.classList.remove('is-active');
        overlay.hidden = true;
    }

    function updateStats() {
        const elements = bridge.getElements();
        bridge.setStat(elements.statHungerValue, elements.statHungerBar, bridge.getStatValue('hunger'));
        bridge.setStat(elements.statEnergyValue, elements.statEnergyBar, bridge.getStatValue('energy'));
        bridge.setStat(elements.statSleepValue, elements.statSleepBar, bridge.getStatValue('sleep'));
        bridge.setStat(elements.statColdValue, elements.statColdBar, bridge.getStatValue('cold'));
        bridge.setStat(elements.statFocusValue, elements.statFocusBar, bridge.getStatValue('focus'));
    }

    function updateLocationSummaries(displayPosition, tileInfo, activeHouse, activeInteraction) {
        const game = bridge.getGame();
        const elements = bridge.getElements();
        const encounter = bridge.getHouseEncounter(activeInteraction);

        if (elements.locationSummary) {
            if (encounter) {
                elements.locationSummary.textContent = `Рядом: ${encounter.label}`;
            } else {
                elements.locationSummary.textContent = activeHouse
                    ? `Локация: ${activeHouse.expedition ? (activeHouse.expedition.locationLabel || activeHouse.expedition.label) : activeHouse.id}`
                    : `Локация: ${bridge.getTileLabel(tileInfo ? tileInfo.tileType : 'grass')}`;
            }
        }

        if (!elements.routeSummary) {
            return;
        }

        const position = bridge.roundPosition(displayPosition);
        const routeBreakdown = bridge.getRouteBandBreakdown();
        const routeReasons = bridge.getRouteReasonBreakdown();
        const warningParts = [];

        if ((routeBreakdown.rough || 0) > 0) {
            warningParts.push(`тяжёлых ${routeBreakdown.rough}`);
        }

        if ((routeBreakdown.hazard || 0) > 0) {
            warningParts.push(`опасных ${routeBreakdown.hazard}`);
        }

        const reasonSummary = Object.entries(routeReasons)
            .sort((left, right) => right[1] - left[1])
            .slice(0, 2)
            .map(([label, count]) => `${label} ${count}`)
            .join(', ');

        if (game.state.route.length > 0) {
            const previewSuffix = game.state.routePreviewLength > game.state.route.length
                ? ` из ${game.state.routePreviewLength}`
                : '';
            const isExactPreview = game.state.routePreviewIsExact !== false;
            const fullCostSuffix = isExactPreview && game.state.routePreviewLength > game.state.route.length
                ? ` (всего ${bridge.formatRouteCost(game.state.routePreviewTotalCost)})`
                : '';
            const warningSuffix = warningParts.length > 0
                ? ` · ${warningParts.join(', ')}`
                : '';
            const reasonSuffix = reasonSummary
                ? ` · ${reasonSummary}`
                : '';
            const previewPrefix = isExactPreview ? 'Маршрут' : 'Быстрый маршрут';
            const previewResolveSuffix = isExactPreview
                ? ''
                : ' · можно идти сразу';

            elements.routeSummary.textContent = `${previewPrefix}: ${game.state.route.length}${previewSuffix} клеток · цена ${bridge.formatRouteCost(game.state.routeTotalCost)}${fullCostSuffix}${warningSuffix}${reasonSuffix}${previewResolveSuffix}`;
            return;
        }

        const travelLabel = tileInfo ? tileInfo.travelLabel || bridge.getTileLabel(tileInfo.tileType) : bridge.getTileLabel('grass');
        const bandLabel = tileInfo ? bridge.getTravelBandLabel(tileInfo.travelBand) : bridge.getTravelBandLabel('normal');
        const tileCost = tileInfo ? bridge.formatRouteCost(tileInfo.travelWeight) : '1.0';
        elements.routeSummary.textContent = `Координаты: ${position.x}, ${position.y} · ${travelLabel} · ${bandLabel} · x${tileCost}`;
    }

    function updateProgressSummaries(tileInfo) {
        const game = bridge.getGame();
        const elements = bridge.getElements();
        const progression = bridge.getCurrentProgression(tileInfo);
        const finalIslandIndex = game.systems.expedition.finalIslandIndex;
        const timeOfDayLabel = bridge.getTimeOfDayLabel();
        const penaltySummary = bridge.getActivePenaltySummary(tileInfo, 2);
        const rewardScaling = game.systems.rewardScaling || null;
        const weatherRuntime = game.systems.weatherRuntime || null;
        const weatherLabel = weatherRuntime && typeof weatherRuntime.getWeatherLabel === 'function'
            ? weatherRuntime.getWeatherLabel(tileInfo)
            : 'Ясно';
        const islandPressureSummary = rewardScaling && typeof rewardScaling.getIslandPressureSummary === 'function'
            ? rewardScaling.getIslandPressureSummary(tileInfo)
            : 'Нагрузка острова 0/5';
        const outsideDrainMultiplier = rewardScaling && typeof rewardScaling.getOutsidePreviewDrainMultiplier === 'function'
            ? rewardScaling.getOutsidePreviewDrainMultiplier(tileInfo)
            : (progression ? progression.movementCostMultiplier : 1);
        const outsideRecoveryMultiplier = rewardScaling && typeof rewardScaling.getOutsidePreviewRecoveryMultiplier === 'function'
            ? rewardScaling.getOutsidePreviewRecoveryMultiplier(tileInfo)
            : (progression ? progression.recoveryMultiplier : 1);

        if (elements.progressSummary) {
            elements.progressSummary.textContent = progression
                ? `Остров ${progression.islandIndex} из ${finalIslandIndex} · ${progression.chunkCount} чанков · ${timeOfDayLabel} · ${weatherLabel} · ${progression.label}${progression.craftRequirementSummary ? ` · Фокус: ${progression.craftRequirementSummary}` : ''}`
                : `Остров 1 из ${finalIslandIndex} · ${timeOfDayLabel}`;
        }

        if (elements.economySummary) {
            elements.economySummary.textContent = progression
                ? `Золото: ${bridge.getGold()} · Вне дома x${outsideDrainMultiplier.toFixed(2)} · ${islandPressureSummary} · Клетка x${bridge.formatRouteCost(tileInfo ? tileInfo.travelFactor : 1)} · Эффективность ${Math.round(outsideRecoveryMultiplier * 100)}%${penaltySummary ? ` · ${penaltySummary}` : ''}`
                : `Золото: ${bridge.getGold()} · Цена шага x1.00${penaltySummary ? ` · ${penaltySummary}` : ''}`;
        }
    }

    function updateCharacterCard(displayPosition, tileInfo, activeHouse, activeInteraction) {
        const game = bridge.getGame();
        const elements = bridge.getElements();
        const profile = game.state.playerProfile || {};
        const roundedPosition = bridge.roundPosition(displayPosition);
        const tileLabel = bridge.getTileLabel(tileInfo ? tileInfo.tileType : 'grass');
        const encounter = bridge.getHouseEncounter(activeInteraction);
        let stateLabel = 'Ожидает команду';

        if (game.state.hasWon) {
            stateLabel = 'Экспедиция завершена';
        } else if (game.state.isGameOver) {
            stateLabel = 'Состояние критическое';
        } else if (game.state.isPaused) {
            stateLabel = 'Игра на паузе';
        } else if (game.state.isMoving) {
            stateLabel = 'Идёт по маршруту';
        } else if (encounter) {
            stateLabel = `Рядом: ${encounter.label}`;
        } else if (activeHouse && activeHouse.expedition) {
            stateLabel = `В доме: ${activeHouse.expedition.locationLabel || activeHouse.expedition.label}`;
        }

        if (elements.selectedCharacterName) {
            elements.selectedCharacterName.textContent = profile.name || 'Путешественник';
        }

        if (elements.selectedCharacterRole) {
            elements.selectedCharacterRole.textContent = profile.role || 'Исследователь архипелага';
        }

        if (elements.selectedCharacterState) {
            elements.selectedCharacterState.textContent = stateLabel;
        }

        if (elements.selectedCharacterTile) {
            const bandLabel = tileInfo ? bridge.getTravelBandLabel(tileInfo.travelBand) : bridge.getTravelBandLabel('normal');
            const weightLabel = tileInfo ? bridge.formatRouteCost(tileInfo.travelWeight) : '1.0';
            const travelLabel = tileInfo ? tileInfo.travelLabel || tileLabel : tileLabel;
            elements.selectedCharacterTile.textContent = `Коорд: ${roundedPosition.x}, ${roundedPosition.y} · ${travelLabel} · ${bandLabel} · x${weightLabel}`;
        }
    }

    function syncStatusOverlay() {
        const game = bridge.getGame();
        const elements = bridge.getElements();
        const showOverlay = Boolean(game.state.isPaused || game.state.hasWon || game.state.isGameOver);
        const isDefeat = Boolean(!game.state.hasWon && bridge.isAllStatsDepleted());
        const isSaveMode = pauseMenuMode === PAUSE_MENU_MODE_SAVE;
        const isLoadMode = pauseMenuMode === PAUSE_MENU_MODE_LOAD;
        const isTravelMode = pauseMenuMode === PAUSE_MENU_MODE_TRAVEL;
        const isMainMode = pauseMenuMode === PAUSE_MENU_MODE_MAIN;
        const canUseSlots = canUseSaveSlots();

        if (!showOverlay) {
            resetPauseMenuState();
        }

        if (elements.pauseOverlay) {
            elements.pauseOverlay.classList.toggle('is-visible', showOverlay);
            elements.pauseOverlay.setAttribute('aria-hidden', showOverlay ? 'false' : 'true');
        }

        if (elements.statusOverlayKicker) {
            elements.statusOverlayKicker.textContent = isSaveMode
                ? 'Меню сохранения'
                : (
                    isLoadMode
                        ? 'Меню загрузки'
                        : (
                            isTravelMode
                                ? 'Быстрый переход'
                                : (
                                    game.state.hasWon
                                        ? 'Экспедиция'
                                        : (isDefeat ? '' : (game.state.isGameOver ? 'Статус' : 'Пауза'))
                                )
                        )
                );
        }

        if (elements.statusOverlayTitle) {
            elements.statusOverlayTitle.textContent = isSaveMode
                ? 'Сохранить'
                : (
                    isLoadMode
                        ? 'Загрузить'
                        : (
                            isTravelMode
                                ? 'Острова'
                                : (
                                    game.state.hasWon
                                        ? 'Победа'
                                        : (isDefeat ? 'Ты умер' : 'Пауза')
                                )
                        )
                );
        }

        if (elements.statusOverlayMessage) {
            const overlayMessage = isSaveMode
                ? 'Текущее прохождение сохранится в выбранный слот.'
                : (
                    isLoadMode
                        ? 'Загрузка заменит текущее прохождение состоянием выбранного слота.'
                        : (
                            isTravelMode
                                ? 'Выберите остров для мгновенного перехода.'
                                : (
                                    game.state.hasWon
                                        ? (game.state.victoryMessage || 'Главный сундук найден. Экспедиция завершена.')
                                        : (
                                            isDefeat
                                                ? ''
                                                : (
                                                    game.state.isGameOver
                                                        ? 'Все характеристики упали до нуля. Нажми "Новая игра", чтобы начать заново.'
                                                        : ''
                                                )
                                        )
                                )
                        )
                );

            elements.statusOverlayMessage.textContent = overlayMessage;
            elements.statusOverlayMessage.hidden = !overlayMessage;
        }

        if (elements.pauseResumeButton) {
            const canResume = Boolean(game.state.isPaused && !game.state.isGameOver && !game.state.hasWon && !isDefeat && isMainMode);
            elements.pauseResumeButton.hidden = !canResume;
            elements.pauseResumeButton.disabled = !canResume;
        }

        if (elements.pauseSaveButton) {
            elements.pauseSaveButton.disabled = !canUseSlots;
        }

        if (elements.pauseLoadButton) {
            elements.pauseLoadButton.disabled = !canUseSlots;
        }

        renderPauseSlotMenu();

        if (elements.pauseButton) {
            const pauseLabel = game.state.isPaused ? 'Продолжить' : 'Пауза';
            elements.pauseButton.textContent = pauseLabel;
            elements.pauseButton.setAttribute('aria-label', pauseLabel);
            elements.pauseButton.setAttribute('title', pauseLabel);
            elements.pauseButton.disabled = Boolean(game.state.isGameOver);
        }

        document.body.classList.toggle('is-paused', Boolean(game.state.isPaused));
        document.body.classList.toggle('is-game-over', Boolean(game.state.isGameOver));
        document.body.classList.toggle('is-defeat', isDefeat);
    }

    function syncConditionOverlay() {
        const elements = bridge.getElements();
        if (!elements.sceneViewport) {
            return;
        }

        const state = bridge.getConditionScreenState();

        elements.sceneViewport.style.setProperty('--scene-canvas-filter', state.canvasFilter);
        elements.sceneViewport.style.setProperty('--condition-red-opacity', state.redOpacity);
        elements.sceneViewport.style.setProperty('--condition-dark-opacity', state.darkOpacity);
        elements.sceneViewport.style.setProperty('--condition-glitch-opacity', state.glitchOpacity);

        if (elements.conditionOverlay) {
            const isOverlayActive = state.mode === 'critical' || state.mode === 'death';
            elements.conditionOverlay.classList.toggle('is-active', isOverlayActive);
            elements.conditionOverlay.setAttribute('aria-hidden', isOverlayActive ? 'false' : 'true');
        }

        if (elements.conditionDeathLabel) {
            elements.conditionDeathLabel.hidden = state.mode !== 'death';
        }
    }

    function togglePause(forceValue) {
        const game = bridge.getGame();
        if (game.state.isGameOver) {
            return false;
        }

        const nextValue = typeof forceValue === 'boolean' ? forceValue : !game.state.isPaused;

        if (!nextValue || (nextValue && !game.state.isPaused)) {
            resetPauseMenuState();
        }

        game.state.isPaused = nextValue;

        if (typeof bridge.renderAfterStateChange === 'function') {
            bridge.renderAfterStateChange([
                'status',
                'character',
                'actions',
                'merchant',
                'dialogue',
                'quests',
                'map',
                'actionHint'
            ], {
                sceneChanged: false
            });
        }

        return nextValue;
    }

    function startNewGame() {
        const lifecycle = window.Game.systems.gameLifecycle || null;

        if (!lifecycle || typeof lifecycle.startNewGame !== 'function') {
            return false;
        }

        resetPauseMenuState();
        lifecycle.startNewGame();
        return true;
    }

    function applyMovementStepCosts() {
        const game = bridge.getGame();

        if (game.state.suppressFastTravelCosts) {
            game.state.suppressFastTravelCosts = false;
            return;
        }

        const tileInfo = game.state.activeTileInfo;
        const routeStep = Array.isArray(game.state.route) ? game.state.route[game.state.currentTargetIndex] : null;
        const focusMultiplier = bridge.getFocusMultiplier();
        const criticalDrainMultiplier = bridge.getCriticalDepletionMultiplier();
        const baseTraversalCost = Number.isFinite(routeStep && routeStep.travelCost)
            ? routeStep.travelCost
            : game.systems.expedition.getTraversalWeight(tileInfo);
        const traversalDrain = Math.max(0, baseTraversalCost * focusMultiplier * criticalDrainMultiplier);
        const energyDrain = Math.max(0.45, traversalDrain * bridge.getStepEnergyDrainMultiplier(tileInfo));
        const openingHungerDrainMultiplier = bridge.getOpeningHungerDrainMultiplier();
        const hungerDrain = Math.max(0.45 * openingHungerDrainMultiplier, traversalDrain * openingHungerDrainMultiplier);
        const coldDelta = game.state.activeHouse
            ? bridge.scaleRecovery(3)
            : -Math.max(0.2, game.systems.expedition.scaleTraversalDrain(1 / bridge.coldDrainDivider, tileInfo) * criticalDrainMultiplier);

        bridge.applyStatDeltas({
            energy: -energyDrain,
            hunger: -hungerDrain,
            cold: coldDelta
        });

        if (game.systems.rewardScaling && typeof game.systems.rewardScaling.recordIslandTraversalStep === 'function') {
            game.systems.rewardScaling.recordIslandTraversalStep(tileInfo);
        }

        if (game.systems.itemEffects && typeof game.systems.itemEffects.consumeTravelStep === 'function') {
            game.systems.itemEffects.consumeTravelStep();
        }
    }

    function applyPathCompletionCosts() {
        const game = bridge.getGame();

        if (game.state.suppressFastTravelCosts) {
            game.state.suppressFastTravelCosts = false;
            return;
        }

        const focusMultiplier = bridge.getFocusMultiplier();
        const sleepDrain = Math.max(1, bridge.scaleDrain(focusMultiplier) * bridge.getSleepDrainMultiplier(game.state.activeTileInfo));

        bridge.applyStatDeltas({
            sleep: -sleepDrain,
            focus: -Math.max(1, Math.round(bridge.scaleDrain(1) * 0.75))
        });

        if (!game.state.isGameOver) {
            bridge.setActionMessage('Путь завершён. Сон и фокус немного снизились.');
        }
    }

    Object.assign(statusUi, {
        closePauseSlotMenu,
        closePauseTravelMenu,
        handlePauseSlotListClick,
        handlePauseTravelListClick,
        openPauseLoadMenu,
        openPauseSaveMenu,
        openPauseTravelMenu,
        updateStats,
        updateLocationSummaries,
        updateProgressSummaries,
        buildProductionGoalsState,
        syncProductionGoalsPanel,
        updateCharacterCard,
        syncStatusOverlay,
        syncConditionOverlay,
        playSleepTransition,
        startNewGame,
        togglePause,
        applyMovementStepCosts,
        applyPathCompletionCosts
    });
})();
