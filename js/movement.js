function captureVisibleWorldAtPlayer() {
    const game = window.Game;
    const runtime = game.systems.mapRuntime || null;

    if (!runtime || typeof runtime.captureVisibleWorld !== 'function') {
        return;
    }

    const focusChunkX = Math.floor(game.state.playerPos.x / game.config.chunkSize);
    const focusChunkY = Math.floor(game.state.playerPos.y / game.config.chunkSize);
    runtime.captureVisibleWorld(focusChunkX, focusChunkY);
}

function markMovementUiDirty(sections) {
    const ui = window.Game.systems.ui || null;

    if (!ui || typeof ui.markDirty !== 'function') {
        return;
    }

    ui.markDirty(sections);
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

    if (state.route.length > 0) {
        const firstTarget = state.route[0];
        window.Game.systems.playerRenderer.setFacingFromDelta(
            firstTarget.x - state.playerPos.x,
            firstTarget.y - state.playerPos.y
        );
    }

    if (window.Game.systems.ui && typeof window.Game.systems.ui.renderAfterStateChange === 'function') {
        window.Game.systems.ui.renderAfterStateChange(['character', 'actions', 'portrait']);
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

    checkChunkLoading();
    unloadDistantChunks();
    renderInterpolatedPosition();
    state.animationRequestId = requestAnimationFrame(animate);
}

function endMovement() {
    endMovementWithOptions({});
}

function endMovementWithOptions(options = {}) {
    const state = window.Game.state;
    const { completed = false } = options;

    state.isMoving = false;
    state.currentTargetIndex = 0;
    state.stepProgress = 0;
    state.lastFrameTime = null;

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
    window.Game.systems.world.updatePlayerContext();
    markMovementUiDirty([
        'stats',
        'location',
        'progress',
        'character',
        'actions',
        'portrait',
        'condition',
        'status',
        'merchant',
        'dialogue',
        'quests',
        'map',
        'actionHint'
    ]);
    window.Game.systems.render.settleCameraOnPlayer();
}

function moveToNextPoint() {
    const state = window.Game.state;
    const expedition = window.Game.systems.expedition;

    if (state.currentTargetIndex >= state.route.length) {
        endMovement();
        return;
    }

    const nextPoint = state.route[state.currentTargetIndex];
    const previousTileInfo = window.Game.systems.world.getTileInfo(
        state.playerPos.x,
        state.playerPos.y,
        { generateIfMissing: false }
    );
    const upcomingTileInfo = window.Game.systems.world.getTileInfo(
        nextPoint.x,
        nextPoint.y,
        { generateIfMissing: false }
    );
    const upcomingIslandIndex = upcomingTileInfo && upcomingTileInfo.progression
        ? upcomingTileInfo.progression.islandIndex
        : 1;
    const visitedIslandIds = state.visitedIslandIds || { 1: true };
    const isFirstVisitToIsland = !visitedIslandIds[upcomingIslandIndex];

    if (!window.Game.systems.pathfinding.canTraverseWorldStep(state.playerPos.x, state.playerPos.y, nextPoint.x, nextPoint.y)) {
        if (window.Game.systems.ui) {
            window.Game.systems.ui.setActionMessage('Путь изменился: проход впереди больше недоступен.');
        }
        endMovementWithOptions({ completed: false });
        return;
    }

    state.playerPos = { ...nextPoint };
    window.Game.systems.world.updatePlayerContext(state.playerPos);
    captureVisibleWorldAtPlayer();
    const currentTileInfo = state.activeTileInfo;
    state.traversedStepsInPath += 1;

    const bridgeTransition = expedition.handleTileTransition(previousTileInfo, currentTileInfo);
    if (window.Game.systems.ui) {
        if (bridgeTransition === 'weakened') {
            window.Game.systems.ui.setActionMessage('Обычный мост за спиной просел и стал старым.');
        } else if (bridgeTransition === 'collapsed') {
            window.Game.systems.ui.setActionMessage('Старый мост за спиной рухнул в воду.');
        }
    }

    const previousIslandIndex = previousTileInfo && previousTileInfo.progression
        ? previousTileInfo.progression.islandIndex
        : 1;
    const shouldShowIslandArrival = Boolean(
        currentTileInfo
        && currentTileInfo.progression
        && currentTileInfo.progression.islandIndex !== previousIslandIndex
        && window.Game.systems.ui
    );

    if (shouldShowIslandArrival) {
        const rewardScaling = window.Game.systems.rewardScaling || null;
        const weatherRuntime = window.Game.systems.weatherRuntime || null;
        const outsideDrainMultiplier = rewardScaling && typeof rewardScaling.getOutsidePreviewDrainMultiplier === 'function'
            ? rewardScaling.getOutsidePreviewDrainMultiplier(currentTileInfo)
            : currentTileInfo.progression.outsideDrainMultiplier;
        const weatherLabel = weatherRuntime && typeof weatherRuntime.getWeatherLabel === 'function'
            ? weatherRuntime.getWeatherLabel(currentTileInfo)
            : '';
        const islandPressureSummary = rewardScaling && typeof rewardScaling.getIslandPressureSummary === 'function'
            ? rewardScaling.getIslandPressureSummary(currentTileInfo)
            : '';
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

        window.Game.systems.ui.setActionMessage(arrivalMessage);
    }

    if (window.Game.systems.ui) {
        window.Game.systems.ui.applyMovementStepCosts();
        if (state.isGameOver) {
            endMovementWithOptions({ completed: false });
            return;
        }
    }

    markMovementUiDirty([
        'stats',
        'location',
        'progress',
        'character',
        'actions',
        'portrait',
        'condition',
        'status',
        'merchant',
        'dialogue',
        'quests',
        'map',
        'actionHint'
    ]);

    state.currentTargetIndex++;

    if (state.currentTargetIndex >= state.route.length) {
        endMovementWithOptions({ completed: true });
    }
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

    window.Game.systems.playerRenderer.setFacingFromDelta(
        targetPos.x - startPos.x,
        targetPos.y - startPos.y
    );
    window.Game.systems.render.renderWithInterpolation(interpolatedPos);
}

function checkChunkLoading() {
    const game = window.Game;
    const playerX = game.state.playerPos.x;
    const playerY = game.state.playerPos.y;
    const { chunkSize } = game.config;
    const { chunkX, chunkY } = game.systems.world.getChunkCoordinatesForWorld(playerX, playerY);
    const { localX: inChunkX, localY: inChunkY } = game.systems.world.getLocalCoordinatesForWorld(playerX, playerY);
    const loadingBorder = game.config.chunkLoadMargin;

    if (inChunkX <= loadingBorder) {
        game.systems.world.getChunk(chunkX - 1, chunkY);
    } else if (inChunkX >= chunkSize - loadingBorder - 1) {
        game.systems.world.getChunk(chunkX + 1, chunkY);
    }

    if (inChunkY <= loadingBorder) {
        game.systems.world.getChunk(chunkX, chunkY - 1);
    } else if (inChunkY >= chunkSize - loadingBorder - 1) {
        game.systems.world.getChunk(chunkX, chunkY + 1);
    }
}

function unloadDistantChunks() {
    const game = window.Game;
    const { chunkX: playerChunkX, chunkY: playerChunkY } = game.systems.world.getChunkCoordinatesForWorld(
        game.state.playerPos.x,
        game.state.playerPos.y
    );

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
    endMovement
};
