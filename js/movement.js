const AUTO_REST_STEP_COOLDOWN = 30;
const AUTO_REST_RECOVERY_AMOUNT = 50;
const TIME_OF_DAY_STEP_INTERVAL = 30;
const MOVEMENT_VISIBLE_CAPTURE_STEP_BATCH = 3;
const MOVEMENT_CHUNK_UNLOAD_INTERVAL_MS = 400;
const MOVEMENT_STEP_UI_SECTIONS = [
    'stats',
    'location',
    'progress',
    'character',
    'actions',
    'portrait',
    'condition',
    'status',
    'actionHint'
];
const MOVEMENT_EXTENDED_UI_SECTIONS = [
    ...MOVEMENT_STEP_UI_SECTIONS,
    'merchant',
    'dialogue',
    'quests'
];
const MOVEMENT_MAP_UI_SECTIONS = ['map'];
let lastMovementChunkKey = null;
let lastMovementLoadingMarginKey = null;
let lastMovementVisibleCaptureChunkKey = null;
let movementStepsSinceVisibleCapture = 0;
let lastMovementChunkUnloadAt = 0;
let lastMovementFacingKey = '';
let deferredMovementWorkRequestId = null;
let pendingVisibleCaptureChunkState = null;

function getMovementNow() {
    return typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
}

function getChunkKey(chunkX, chunkY) {
    return `${chunkX},${chunkY}`;
}

function getPlayerChunkState(position = window.Game.state.playerPos) {
    const world = window.Game.systems.world;
    const { chunkX, chunkY } = world.getChunkCoordinatesForWorld(position.x, position.y);
    const { localX, localY } = world.getLocalCoordinatesForWorld(position.x, position.y);

    return {
        chunkX,
        chunkY,
        localX,
        localY,
        key: getChunkKey(chunkX, chunkY)
    };
}

function getChunkLoadingMarginKey(chunkState = getPlayerChunkState()) {
    const game = window.Game;
    const loadingBorder = game.config.chunkLoadMargin;
    const left = chunkState.localX <= loadingBorder ? 'L' : '-';
    const right = chunkState.localX >= game.config.chunkSize - loadingBorder - 1 ? 'R' : '-';
    const top = chunkState.localY <= loadingBorder ? 'T' : '-';
    const bottom = chunkState.localY >= game.config.chunkSize - loadingBorder - 1 ? 'B' : '-';

    return `${chunkState.key}|${left}${right}${top}${bottom}`;
}

function isInsideChunkLoadingMargin(chunkState = getPlayerChunkState()) {
    const game = window.Game;
    const loadingBorder = game.config.chunkLoadMargin;

    return (
        chunkState.localX <= loadingBorder
        || chunkState.localX >= game.config.chunkSize - loadingBorder - 1
        || chunkState.localY <= loadingBorder
        || chunkState.localY >= game.config.chunkSize - loadingBorder - 1
    );
}

function resetMovementStreamingState() {
    lastMovementChunkKey = null;
    lastMovementLoadingMarginKey = null;
    lastMovementVisibleCaptureChunkKey = null;
    movementStepsSinceVisibleCapture = 0;
    lastMovementChunkUnloadAt = 0;
    lastMovementFacingKey = '';
}

function primeMovementStreamingState() {
    const chunkState = getPlayerChunkState();

    lastMovementChunkKey = chunkState.key;
    lastMovementLoadingMarginKey = getChunkLoadingMarginKey(chunkState);
    lastMovementVisibleCaptureChunkKey = chunkState.key;
    movementStepsSinceVisibleCapture = 0;
    lastMovementChunkUnloadAt = getMovementNow();

    if (isInsideChunkLoadingMargin(chunkState)) {
        checkChunkLoading(chunkState);
    }
}

function captureVisibleWorldAtPlayer(chunkState = null) {
    const game = window.Game;
    const runtime = game.systems.mapRuntime || null;

    if (!runtime || typeof runtime.captureVisibleWorld !== 'function') {
        return;
    }

    const resolvedChunkState = chunkState || getPlayerChunkState();
    const focusChunkX = resolvedChunkState.chunkX;
    const focusChunkY = resolvedChunkState.chunkY;
    runtime.captureVisibleWorld(focusChunkX, focusChunkY);
}

function markMovementUiDirty(sections) {
    const ui = window.Game.systems.ui || null;

    if (!ui || typeof ui.markDirty !== 'function') {
        return;
    }

    ui.markDirty(sections);
}

function hasFreshPlayerContext(position = window.Game.state.playerPos) {
    const state = window.Game.state;
    const activeTileInfo = state.activeTileInfo || null;

    if (!activeTileInfo) {
        return false;
    }

    return (
        activeTileInfo.x === Math.round(position.x)
        && activeTileInfo.y === Math.round(position.y)
    );
}

function refreshPlayerContext(position = window.Game.state.playerPos, options = {}) {
    if (!options.force && hasFreshPlayerContext(position)) {
        return window.Game.state.activeTileInfo || null;
    }

    return window.Game.systems.world.updatePlayerContext(position);
}

function getFacingKey(dx, dy) {
    const stepX = Math.sign(dx);
    const stepY = Math.sign(dy);

    if (stepX === 0 && stepY === 0) {
        return '';
    }

    return `${stepX},${stepY}`;
}

function updateFacingFromDelta(dx, dy) {
    const nextFacingKey = getFacingKey(dx, dy);

    if (!nextFacingKey || nextFacingKey === lastMovementFacingKey) {
        return false;
    }

    lastMovementFacingKey = nextFacingKey;
    window.Game.systems.playerRenderer.setFacingFromDelta(dx, dy);
    return true;
}

function scheduleDeferredMovementWork() {
    if (deferredMovementWorkRequestId) {
        return;
    }

    deferredMovementWorkRequestId = requestAnimationFrame(flushDeferredMovementWork);
}

function queueVisibleWorldCapture(chunkState) {
    if (!chunkState) {
        return;
    }

    pendingVisibleCaptureChunkState = {
        chunkX: chunkState.chunkX,
        chunkY: chunkState.chunkY,
        localX: chunkState.localX,
        localY: chunkState.localY,
        key: chunkState.key
    };
    scheduleDeferredMovementWork();
}

function flushDeferredMovementWork() {
    deferredMovementWorkRequestId = null;

    if (pendingVisibleCaptureChunkState) {
        const captureChunkState = pendingVisibleCaptureChunkState;
        pendingVisibleCaptureChunkState = null;
        captureVisibleWorldAtPlayer(captureChunkState);
        markMovementUiDirty(MOVEMENT_MAP_UI_SECTIONS);
    }
}

function flushDeferredMovementWorkNow() {
    if (deferredMovementWorkRequestId) {
        cancelAnimationFrame(deferredMovementWorkRequestId);
        deferredMovementWorkRequestId = null;
    }

    flushDeferredMovementWork();
}

function getStepsSinceAutoRest() {
    const state = window.Game.state;
    const rawValue = typeof state.stepsSinceAutoRest === 'number'
        ? state.stepsSinceAutoRest
        : AUTO_REST_STEP_COOLDOWN;
    const normalizedValue = Math.max(0, Math.floor(rawValue));

    state.stepsSinceAutoRest = normalizedValue;
    return normalizedValue;
}

function incrementAutoRestStepCounter() {
    const state = window.Game.state;
    state.stepsSinceAutoRest = Math.min(AUTO_REST_STEP_COOLDOWN, getStepsSinceAutoRest() + 1);
    return state.stepsSinceAutoRest;
}

function resetAutoRestStepCounter() {
    window.Game.state.stepsSinceAutoRest = 0;
}

function getStepsSinceTimeOfDayChange() {
    const state = window.Game.state;
    const rawValue = typeof state.stepsSinceTimeOfDayChange === 'number'
        ? state.stepsSinceTimeOfDayChange
        : 0;
    const normalizedValue = Math.max(0, Math.floor(rawValue));

    state.stepsSinceTimeOfDayChange = normalizedValue;
    return normalizedValue;
}

function incrementTimeOfDayStepCounter() {
    const state = window.Game.state;
    state.stepsSinceTimeOfDayChange = Math.min(TIME_OF_DAY_STEP_INTERVAL, getStepsSinceTimeOfDayChange() + 1);
    return state.stepsSinceTimeOfDayChange;
}

function resetTimeOfDayStepCounter() {
    window.Game.state.stepsSinceTimeOfDayChange = 0;
}

function getTimeOfDayAdvancesElapsed() {
    const state = window.Game.state;
    const rawValue = typeof state.timeOfDayAdvancesElapsed === 'number'
        ? state.timeOfDayAdvancesElapsed
        : 0;
    const normalizedValue = Math.max(0, Math.floor(rawValue));

    state.timeOfDayAdvancesElapsed = normalizedValue;
    return normalizedValue;
}

function incrementTimeOfDayAdvancesElapsed(step = 1) {
    const state = window.Game.state;
    state.timeOfDayAdvancesElapsed = getTimeOfDayAdvancesElapsed() + Math.max(0, Math.floor(step));
    return state.timeOfDayAdvancesElapsed;
}

function getCurrentActionContextKey() {
    const state = window.Game.state;
    return [
        Math.round(state.playerPos.x),
        Math.round(state.playerPos.y),
        state.activeHouse ? state.activeHouse.id : 'none',
        state.activeInteraction ? state.activeInteraction.id : 'none',
        state.activeGroundItemId || 'none',
        state.selectedInventorySlot === null ? 'none' : state.selectedInventorySlot,
        state.isMoving ? 'moving' : 'idle'
    ].join('|');
}

function getAdjacentShelter(position) {
    const game = window.Game;
    const interactions = game.systems.interactions || null;

    if (!position || !interactions || typeof interactions.isAdjacentToInteraction !== 'function') {
        return null;
    }

    const roundedX = Math.round(position.x);
    const roundedY = Math.round(position.y);
    let bestMatch = null;

    for (let offsetY = -1; offsetY <= 1; offsetY++) {
        for (let offsetX = -1; offsetX <= 1; offsetX++) {
            if (offsetX === 0 && offsetY === 0) {
                continue;
            }

            const tileInfo = game.systems.world.getTileInfo(
                roundedX + offsetX,
                roundedY + offsetY,
                { generateIfMissing: false }
            );
            const interaction = tileInfo ? tileInfo.interaction : null;

            if (!interaction || interaction.kind !== 'shelter') {
                continue;
            }

            if (!interactions.isAdjacentToInteraction(position, interaction)) {
                continue;
            }

            const distance = Math.abs(roundedX - interaction.worldX) + Math.abs(roundedY - interaction.worldY);

            if (
                !bestMatch
                || distance < bestMatch.distance
                || (
                    distance === bestMatch.distance
                    && (interaction.renderDepth || 0) < (bestMatch.interaction.renderDepth || 0)
                )
            ) {
                bestMatch = {
                    interaction,
                    distance
                };
            }
        }
    }

    return bestMatch ? bestMatch.interaction : null;
}

function getAutoRestTrigger(previousContext = {}, currentShelter = undefined) {
    const state = window.Game.state;

    if (getStepsSinceAutoRest() < AUTO_REST_STEP_COOLDOWN) {
        return null;
    }

    if (state.activeHouse && state.activeHouseId && state.activeHouseId !== previousContext.houseId) {
        return {
            kind: 'house'
        };
    }

    const resolvedCurrentShelter = currentShelter === undefined
        ? getAdjacentShelter(state.playerPos)
        : currentShelter;

    if (resolvedCurrentShelter && resolvedCurrentShelter.id !== previousContext.shelterId) {
        return {
            kind: 'shelter'
        };
    }

    return null;
}

function applyAutoRest(trigger, options = {}) {
    const bridge = window.Game.systems.uiBridge || null;
    const ui = window.Game.systems.ui || null;
    const { messagePrefix = '' } = options;

    if (
        !trigger
        || !bridge
        || typeof bridge.getStatValue !== 'function'
        || typeof bridge.setStatValue !== 'function'
    ) {
        return false;
    }

    const applied = {};
    ['sleep', 'focus'].forEach((key) => {
        const before = bridge.getStatValue(key);
        const after = bridge.setStatValue(key, before + AUTO_REST_RECOVERY_AMOUNT);
        const actualGain = Math.max(0, after - before);

        if (actualGain > 0) {
            applied[key] = actualGain;
        }
    });

    resetAutoRestStepCounter();

    const rewardSummary = typeof bridge.describeAppliedRewards === 'function'
        ? bridge.describeAppliedRewards(applied)
        : Object.entries(applied)
            .map(([key, value]) => `${key} +${value}`)
            .join(', ');
    const restMessageBase = trigger.kind === 'house'
        ? 'В доме удалось перевести дух'
        : 'У костра удалось перевести дух';
    const restMessage = rewardSummary
        ? `${restMessageBase}: ${rewardSummary}.`
        : `${restMessageBase}.`;
    const trimmedPrefix = typeof messagePrefix === 'string' ? messagePrefix.trim() : '';

    if (ui && typeof ui.setActionMessage === 'function') {
        ui.lastActionContextKey = getCurrentActionContextKey();
        ui.setActionMessage(trimmedPrefix ? `${trimmedPrefix} ${restMessage}` : restMessage);
    }

    markMovementUiDirty(MOVEMENT_STEP_UI_SECTIONS);
    return true;
}

function shouldAdvanceTimeOfDayAfterStep() {
    return getStepsSinceTimeOfDayChange() >= TIME_OF_DAY_STEP_INTERVAL;
}

function advanceTimeOfDayAfterMovement(options = {}) {
    const render = window.Game.systems.render || null;
    const courierRuntime = window.Game.systems.courierRuntime || null;
    const inventoryRuntime = window.Game.systems.inventoryRuntime || null;
    const ui = window.Game.systems.ui || null;
    const {
        messagePrefix = '',
        silent = false,
        reasonLabel = 'в пути'
    } = options;

    if (!render || typeof render.advanceTimeOfDay !== 'function') {
        return false;
    }

    const nextTimeOfDay = render.advanceTimeOfDay(1);
    const currentAdvance = incrementTimeOfDayAdvancesElapsed(1);
    resetTimeOfDayStepCounter();
    const courierOutcome = courierRuntime && typeof courierRuntime.processDueCourierJobs === 'function'
        ? courierRuntime.processDueCourierJobs()
        : null;
    const perishableOutcome = inventoryRuntime && typeof inventoryRuntime.processPerishableItems === 'function'
        ? inventoryRuntime.processPerishableItems({ currentAdvance })
        : null;

    const trimmedPrefix = typeof messagePrefix === 'string' ? messagePrefix.trim() : '';
    const messageParts = [];

    if (nextTimeOfDay && nextTimeOfDay.label) {
        const normalizedReasonLabel = typeof reasonLabel === 'string' && reasonLabel.trim()
            ? reasonLabel.trim()
            : 'в пути';
        messageParts.push(`Прошло время ${normalizedReasonLabel}. Теперь ${nextTimeOfDay.label.toLowerCase()}.`);
    }

    if (perishableOutcome && perishableOutcome.message) {
        messageParts.push(perishableOutcome.message);
    }

    if (courierOutcome && Array.isArray(courierOutcome.messages) && courierOutcome.messages.length > 0) {
        messageParts.push(...courierOutcome.messages);
    }

    const combinedMessage = messageParts.length > 0 ? messageParts.join(' ') : '';

    if (!silent && ui && typeof ui.setActionMessage === 'function' && combinedMessage) {
        ui.lastActionContextKey = getCurrentActionContextKey();
        ui.setActionMessage(trimmedPrefix ? `${trimmedPrefix} ${combinedMessage}` : combinedMessage);
    }

    markMovementUiDirty(MOVEMENT_EXTENDED_UI_SECTIONS);
    return {
        nextTimeOfDay,
        courierOutcome,
        perishableOutcome,
        message: combinedMessage
    };
}

function advanceTimeOfDay(options = {}) {
    return advanceTimeOfDayAfterMovement(options);
}

function consumeActionTempo(options = {}) {
    const {
        virtualSteps = 1,
        silent = true,
        messagePrefix = '',
        reasonLabel = 'в пути'
    } = options;
    const normalizedSteps = Math.max(0, Math.floor(virtualSteps));

    if (normalizedSteps <= 0) {
        return {
            virtualStepsApplied: 0,
            timeAdvances: 0,
            messages: []
        };
    }

    for (let stepIndex = 0; stepIndex < normalizedSteps; stepIndex++) {
        incrementTimeOfDayStepCounter();
    }

    const timeMessages = [];
    let timeAdvances = 0;

    while (shouldAdvanceTimeOfDayAfterStep()) {
        const outcome = advanceTimeOfDayAfterMovement({
            messagePrefix,
            silent,
            reasonLabel
        });

        if (outcome && outcome.message) {
            timeMessages.push(outcome.message);
        }

        timeAdvances++;
    }

    if (timeAdvances === 0) {
        markMovementUiDirty(MOVEMENT_STEP_UI_SECTIONS);
    }

    return {
        virtualStepsApplied: normalizedSteps,
        timeAdvances,
        messages: timeMessages
    };
}

function startMovement() {
    const state = window.Game.state;

    if (state.isMoving || state.route.length === 0 || state.isGameOver) {
        return;
    }

    window.Game.systems.render.stopCameraAnimation();
    state.isMoving = true;
    state.currentTargetIndex = 0;
    state.stepProgress = 0;
    state.lastFrameTime = null;
    state.traversedStepsInPath = 0;
    primeMovementStreamingState();

    if (state.route.length > 0) {
        const firstTarget = state.route[0];
        updateFacingFromDelta(
            firstTarget.x - state.playerPos.x,
            firstTarget.y - state.playerPos.y
        );
    }

    if (window.Game.systems.ui && typeof window.Game.systems.ui.renderAfterStateChange === 'function') {
        window.Game.systems.ui.renderAfterStateChange(['character', 'actions', 'portrait'], {
            sceneChanged: false
        });
    }

    if (state.animationRequestId) {
        cancelAnimationFrame(state.animationRequestId);
    }

    state.animationRequestId = requestAnimationFrame(animate);
}

function animate(timestamp) {
    const game = window.Game;
    const state = game.state;

    if (!state.isMoving || state.currentTargetIndex >= state.route.length) {
        endMovement();
        return;
    }

    if (state.isGameOver) {
        endMovementWithOptions({ completed: false });
        return;
    }

    if (state.isPaused) {
        state.lastFrameTime = timestamp;
        state.animationRequestId = requestAnimationFrame(animate);
        return;
    }

    if (state.lastFrameTime === null) {
        state.lastFrameTime = timestamp;
    }

    const deltaMs = Math.min(timestamp - state.lastFrameTime, game.config.maxFrameDeltaMs);
    state.lastFrameTime = timestamp;
    state.stepProgress += deltaMs / game.config.moveDurationMs;
    let processedSteps = 0;

    while (
        state.stepProgress >= 1 &&
        state.isMoving &&
        processedSteps < game.config.maxMovementStepsPerFrame
    ) {
        state.stepProgress -= 1;
        moveToNextPoint();
        processedSteps++;
    }

    if (state.stepProgress >= 1) {
        state.stepProgress = 0.999;
    }

    if (!state.isMoving) {
        return;
    }

    renderInterpolatedPosition();
    state.animationRequestId = requestAnimationFrame(animate);
}

function endMovement() {
    endMovementWithOptions({});
}

function endMovementWithOptions(options = {}) {
    const state = window.Game.state;
    const {
        completed = false,
        skipPlayerContextRefresh = false
    } = options;

    state.isMoving = false;
    state.currentTargetIndex = 0;
    state.stepProgress = 0;
    state.lastFrameTime = null;
    flushDeferredMovementWorkNow();
    resetMovementStreamingState();

    if (state.animationRequestId) {
        cancelAnimationFrame(state.animationRequestId);
        state.animationRequestId = null;
    }

    if (completed && state.traversedStepsInPath > 0 && window.Game.systems.ui) {
        window.Game.systems.ui.applyPathCompletionCosts();
    }

    state.traversedStepsInPath = 0;
    state.route = [];
    state.routeTotalCost = 0;
    state.routePreviewLength = 0;
    state.routePreviewTotalCost = 0;
    state.routePreviewIsExact = true;

    if (completed && !state.isGameOver) {
        const inputSystem = window.Game.systems.input || null;
        if (inputSystem && typeof inputSystem.planRouteToSelectedTile === 'function') {
            inputSystem.planRouteToSelectedTile({
                showRouteWarning: false,
                clearActionMessage: false
            });
        }
    }

    if (!skipPlayerContextRefresh) {
        refreshPlayerContext(state.playerPos);
    }

    markMovementUiDirty(MOVEMENT_STEP_UI_SECTIONS);
    window.Game.systems.render.settleCameraOnPlayer();
}

function handleMovementStreamingStep() {
    const chunkState = getPlayerChunkState();
    const nextLoadingMarginKey = getChunkLoadingMarginKey(chunkState);
    const chunkChanged = chunkState.key !== lastMovementChunkKey;
    const loadingMarginChanged = nextLoadingMarginKey !== lastMovementLoadingMarginKey;
    const shouldLoadChunks = chunkChanged || loadingMarginChanged;
    const shouldUnloadChunks = chunkChanged || (getMovementNow() - lastMovementChunkUnloadAt) >= MOVEMENT_CHUNK_UNLOAD_INTERVAL_MS;

    if (chunkChanged) {
        window.Game.systems.world.getChunk(chunkState.chunkX, chunkState.chunkY, {
            detailLevel: 'base'
        });
    }

    if (shouldLoadChunks) {
        checkChunkLoading(chunkState);
    }

    if (shouldUnloadChunks) {
        unloadDistantChunks(chunkState);
        lastMovementChunkUnloadAt = getMovementNow();
    }

    movementStepsSinceVisibleCapture += 1;

    if (
        chunkChanged
        || loadingMarginChanged
        || chunkState.key !== lastMovementVisibleCaptureChunkKey
        || movementStepsSinceVisibleCapture >= MOVEMENT_VISIBLE_CAPTURE_STEP_BATCH
    ) {
        queueVisibleWorldCapture(chunkState);
        lastMovementVisibleCaptureChunkKey = chunkState.key;
        movementStepsSinceVisibleCapture = 0;
    }

    lastMovementChunkKey = chunkState.key;
    lastMovementLoadingMarginKey = nextLoadingMarginKey;
}

function buildBridgeTransitionMessage(bridgeTransition) {
    if (!bridgeTransition) {
        return '';
    }

    if (bridgeTransition.status === 'worn') {
        return `Мост за спиной износился: осталось ${bridgeTransition.durabilityRemaining} из ${bridgeTransition.maxDurability} проходов.`;
    }

    if (bridgeTransition.status === 'weakened') {
        return 'Обычный мост за спиной просел и стал старым.';
    }

    if (bridgeTransition.status === 'collapsed') {
        return 'Старый мост за спиной рухнул в воду.';
    }

    return '';
}

function buildBoatTransitionMessage(boatTransition) {
    if (!boatTransition) {
        return '';
    }

    if (boatTransition.status === 'worn') {
        return `Лодка изнашивается на воде: осталось ${boatTransition.durabilityRemaining} из ${boatTransition.maxDurability} переходов.`;
    }

    if (boatTransition.status === 'damaged') {
        return `Лодка сильно потрёпана: остался ${boatTransition.durabilityRemaining} водный переход из ${boatTransition.maxDurability}.`;
    }

    if (boatTransition.status === 'broken') {
        return 'Лодка окончательно разбита. Нужен ремкомплект лодки.';
    }

    return '';
}

function buildIslandArrivalMessage(previousTileInfo, currentTileInfo, isFirstVisitToIsland) {
    if (
        !currentTileInfo
        || !currentTileInfo.progression
        || !previousTileInfo
        || !window.Game.systems.ui
    ) {
        return '';
    }

    const previousIslandIndex = previousTileInfo.progression
        ? previousTileInfo.progression.islandIndex
        : 1;

    if (currentTileInfo.progression.islandIndex === previousIslandIndex) {
        return '';
    }

    const rewardScaling = window.Game.systems.rewardScaling || null;
    const weatherRuntime = window.Game.systems.weatherRuntime || null;
    const expeditionProgression = window.Game.systems.expeditionProgression || null;
    const outsideDrainMultiplier = rewardScaling && typeof rewardScaling.getOutsidePreviewDrainMultiplier === 'function'
        ? rewardScaling.getOutsidePreviewDrainMultiplier(currentTileInfo)
        : currentTileInfo.progression.outsideDrainMultiplier;
    const weatherLabel = weatherRuntime && typeof weatherRuntime.getWeatherLabel === 'function'
        ? weatherRuntime.getWeatherLabel(currentTileInfo)
        : '';
    const islandPressureSummary = rewardScaling && typeof rewardScaling.getIslandPressureSummary === 'function'
        ? rewardScaling.getIslandPressureSummary(currentTileInfo)
        : '';
    const craftRequirement = expeditionProgression && typeof expeditionProgression.getIslandCraftRequirementSummary === 'function'
        ? expeditionProgression.getIslandCraftRequirementSummary(currentTileInfo.progression)
        : null;
    const drainLabel = `x${outsideDrainMultiplier.toFixed(2)}`;
    let arrivalMessage = `Остров ${currentTileInfo.progression.islandIndex}: ${currentTileInfo.progression.label}. `;

    if (isFirstVisitToIsland) {
        arrivalMessage += `Вне укрытий расход теперь ${drainLabel}.`;
    } else {
        arrivalMessage += `Возврат на остров возвращает его местный темп расхода: ${drainLabel}.`;
    }

    if (weatherLabel && weatherLabel !== 'Ясно') {
        arrivalMessage += ` Погода: ${weatherLabel}.`;
    }

    if (islandPressureSummary) {
        arrivalMessage += ` ${islandPressureSummary}.`;
    }

    if (craftRequirement && craftRequirement.headline) {
        arrivalMessage += ` Сейчас критично: ${craftRequirement.headline}.`;
    }

    return arrivalMessage;
}

function resolveAutoRestTriggerForStep(stepContext) {
    if (!stepContext || !stepContext.shouldCheckAutoRest) {
        return null;
    }

    const previousShelter = getAdjacentShelter(stepContext.previousPosition);
    const currentShelter = window.Game.state.activeHouse
        ? null
        : getAdjacentShelter(window.Game.state.playerPos);

    return getAutoRestTrigger({
        houseId: stepContext.previousTileInfo && stepContext.previousTileInfo.house
            ? stepContext.previousTileInfo.house.id
            : null,
        shelterId: previousShelter ? previousShelter.id : null
    }, currentShelter);
}

function getMovementMessagePrefix() {
    const ui = window.Game.systems.ui || null;

    return ui && typeof ui.lastActionMessage === 'string'
        ? ui.lastActionMessage
        : '';
}

function consumeMovementStep() {
    const game = window.Game;
    const state = game.state;

    if (state.currentTargetIndex >= state.route.length) {
        endMovement();
        return null;
    }

    const nextPoint = state.route[state.currentTargetIndex];
    const previousPosition = {
        x: state.playerPos.x,
        y: state.playerPos.y
    };
    const previousTileInfo = hasFreshPlayerContext(previousPosition)
        ? state.activeTileInfo
        : game.systems.world.getTileInfo(previousPosition.x, previousPosition.y, { generateIfMissing: false });
    const visitedIslandIdsSnapshot = { ...(state.visitedIslandIds || { 1: true }) };

    if (!game.systems.pathfinding.canTraverseWorldStep(previousPosition.x, previousPosition.y, nextPoint.x, nextPoint.y)) {
        if (game.systems.ui) {
            game.systems.ui.setActionMessage('Путь изменился: проход впереди больше недоступен.');
        }

        endMovementWithOptions({
            completed: false,
            skipPlayerContextRefresh: true
        });
        return null;
    }

    state.playerPos = { ...nextPoint };
    refreshPlayerContext(state.playerPos, { force: true });
    handleMovementStreamingStep();
    state.traversedStepsInPath += 1;
    incrementAutoRestStepCounter();
    incrementTimeOfDayStepCounter();

    const currentTileInfo = state.activeTileInfo;
    const currentIslandIndex = currentTileInfo && currentTileInfo.progression
        ? currentTileInfo.progression.islandIndex
        : 1;

    return {
        previousPosition,
        previousTileInfo,
        currentTileInfo,
        isFirstVisitToIsland: !visitedIslandIdsSnapshot[currentIslandIndex],
        isFinalStepInRoute: state.currentTargetIndex + 1 >= state.route.length,
        shouldCheckAutoRest: getStepsSinceAutoRest() >= AUTO_REST_STEP_COOLDOWN
    };
}

function applyMovementStepSideEffects(stepContext) {
    if (!stepContext) {
        return;
    }

    const state = window.Game.state;
    const expedition = window.Game.systems.expedition;
    const ui = window.Game.systems.ui || null;
    const bridgeTransition = expedition.handleTileTransition(stepContext.previousTileInfo, stepContext.currentTileInfo);
    const boatTransition = expedition && typeof expedition.handleBoatTransition === 'function'
        ? expedition.handleBoatTransition(stepContext.previousTileInfo, stepContext.currentTileInfo)
        : null;
    const bridgeMessage = buildBridgeTransitionMessage(bridgeTransition);
    const boatMessage = buildBoatTransitionMessage(boatTransition);
    const islandArrivalMessage = buildIslandArrivalMessage(
        stepContext.previousTileInfo,
        stepContext.currentTileInfo,
        stepContext.isFirstVisitToIsland
    );
    const stepMessage = [bridgeMessage, boatMessage, islandArrivalMessage].filter(Boolean).join(' ');

    if (ui && stepMessage) {
        ui.setActionMessage(stepMessage);
    }

    if (ui && typeof ui.applyMovementStepCosts === 'function') {
        ui.applyMovementStepCosts();

        if (state.isGameOver) {
            endMovementWithOptions({
                completed: false,
                skipPlayerContextRefresh: true
            });
            return;
        }
    }

    const autoRestTrigger = resolveAutoRestTriggerForStep(stepContext);
    const shouldAdvanceTimeOfDay = shouldAdvanceTimeOfDayAfterStep();

    if (!stepContext.isFinalStepInRoute) {
        if (autoRestTrigger) {
            applyAutoRest(autoRestTrigger, {
                messagePrefix: getMovementMessagePrefix()
            });
        }

        if (shouldAdvanceTimeOfDay) {
            advanceTimeOfDayAfterMovement({
                messagePrefix: getMovementMessagePrefix()
            });
        }

        markMovementUiDirty(
            shouldAdvanceTimeOfDay
                ? MOVEMENT_EXTENDED_UI_SECTIONS
                : MOVEMENT_STEP_UI_SECTIONS
        );
    }

    state.currentTargetIndex++;

    if (state.currentTargetIndex >= state.route.length) {
        endMovementWithOptions({
            completed: true,
            skipPlayerContextRefresh: true
        });

        if (autoRestTrigger) {
            applyAutoRest(autoRestTrigger, {
                messagePrefix: getMovementMessagePrefix()
            });
        }

        if (shouldAdvanceTimeOfDay) {
            advanceTimeOfDayAfterMovement({
                messagePrefix: getMovementMessagePrefix()
            });
        }
    }
}

function moveToNextPoint() {
    const stepContext = consumeMovementStep();

    if (!stepContext) {
        return;
    }

    applyMovementStepSideEffects(stepContext);
}

function renderInterpolatedPosition() {
    const state = window.Game.state;

    if (state.currentTargetIndex >= state.route.length) {
        window.Game.systems.render.render();
        return;
    }

    const startPos = state.currentTargetIndex === 0
        ? state.playerPos
        : state.route[state.currentTargetIndex - 1];
    const targetPos = state.route[state.currentTargetIndex];

    if (!startPos || !targetPos) {
        window.Game.systems.render.render();
        return;
    }

    const interpolatedPos = {
        x: startPos.x + (targetPos.x - startPos.x) * state.stepProgress,
        y: startPos.y + (targetPos.y - startPos.y) * state.stepProgress
    };

    updateFacingFromDelta(
        targetPos.x - startPos.x,
        targetPos.y - startPos.y
    );
    window.Game.systems.render.renderWithInterpolation(interpolatedPos);
}

function checkChunkLoading(chunkState = getPlayerChunkState()) {
    const game = window.Game;
    const { chunkSize } = game.config;
    const { chunkX, chunkY } = chunkState;
    const inChunkX = chunkState.localX;
    const inChunkY = chunkState.localY;
    const loadingBorder = game.config.chunkLoadMargin;
    const chunkCoordinates = [];

    if (inChunkX <= loadingBorder) {
        chunkCoordinates.push({ chunkX: chunkX - 1, chunkY });
    } else if (inChunkX >= chunkSize - loadingBorder - 1) {
        chunkCoordinates.push({ chunkX: chunkX + 1, chunkY });
    }

    if (inChunkY <= loadingBorder) {
        chunkCoordinates.push({ chunkX, chunkY: chunkY - 1 });
    } else if (inChunkY >= chunkSize - loadingBorder - 1) {
        chunkCoordinates.push({ chunkX, chunkY: chunkY + 1 });
    }

    if (chunkCoordinates.length === 0) {
        return;
    }

    if (game.systems.chunkGenerator && typeof game.systems.chunkGenerator.prewarmChunks === 'function') {
        game.systems.chunkGenerator.prewarmChunks(chunkCoordinates, {
            detailLevel: 'base',
            priority: 'high'
        });
        return;
    }

    chunkCoordinates.forEach((entry) => {
        game.systems.world.getChunk(entry.chunkX, entry.chunkY, {
            detailLevel: 'base',
            queueDeferred: false,
            priority: 'high'
        });
    });
}

function unloadDistantChunks(chunkState = getPlayerChunkState()) {
    const game = window.Game;
    const { chunkX: playerChunkX, chunkY: playerChunkY } = chunkState;

    Object.keys(game.state.loadedChunks).forEach((key) => {
        const [chunkX, chunkY] = key.split(',').map(Number);
        if (
            Math.abs(chunkX - playerChunkX) > game.config.chunkUnloadDistance ||
            Math.abs(chunkY - playerChunkY) > game.config.chunkUnloadDistance
        ) {
            game.systems.world.unloadChunk(chunkX, chunkY);
        }
    });
}

window.Game.systems.movement = {
    startMovement,
    endMovement,
    consumeActionTempo,
    advanceTimeOfDay
};
