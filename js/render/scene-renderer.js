function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function mixChannel(from, to, amount) {
    return Math.round(from + (to - from) * amount);
}

const TIME_OF_DAY_CYCLE = [
    {
        key: 'dawn',
        label: 'Рассвет',
        skyTop: [204, 210, 214],
        skyMid: [188, 196, 200],
        skyBottom: [164, 174, 178],
        worldTint: 'rgba(218, 226, 224, 0.10)',
        fogTopTint: 'rgba(238, 244, 242, 0.30)',
        fogBottomTint: 'rgba(212, 220, 218, 0.18)',
        darknessTint: 'rgba(82, 90, 94, 0.06)'
    },
    {
        key: 'morning',
        label: 'Утро',
        skyTop: [210, 227, 196],
        skyMid: [188, 216, 182],
        skyBottom: [162, 201, 166],
        worldTint: 'rgba(255, 244, 220, 0.03)',
        darknessTint: null
    },
    {
        key: 'day',
        label: 'День',
        skyTop: [219, 241, 188],
        skyMid: [194, 234, 155],
        skyBottom: [167, 223, 124],
        worldTint: null,
        darknessTint: null
    },
    {
        key: 'evening',
        label: 'Вечер',
        skyTop: [190, 172, 156],
        skyMid: [160, 138, 126],
        skyBottom: [118, 96, 90],
        worldTint: 'rgba(122, 98, 88, 0.08)',
        darknessTint: 'rgba(30, 24, 28, 0.16)'
    },
    {
        key: 'sunset',
        label: 'Закат',
        skyTop: [230, 146, 96],
        skyMid: [196, 94, 62],
        skyBottom: [126, 54, 40],
        worldTint: 'rgba(242, 126, 58, 0.18)',
        darknessTint: 'rgba(36, 20, 18, 0.20)'
    },
    {
        key: 'night',
        label: 'Ночь',
        skyTop: [66, 110, 198],
        skyMid: [30, 62, 146],
        skyBottom: [8, 18, 60],
        worldTint: 'rgba(12, 44, 110, 0.30)',
        darknessTint: 'rgba(2, 8, 22, 0.28)'
    }
];

function getIslandMoodFactor(progression) {
    if (!progression || typeof progression !== 'object') {
        return 0;
    }

    const expedition = window.Game.systems.expedition;
    const finalIslandIndex = expedition ? expedition.finalIslandIndex : 30;
    const stage = Math.max(0, progression.islandIndex - 1);
    const byIsland = clamp(stage / Math.max(1, finalIslandIndex - 1), 0, 1);
    return stage === 0 ? 0 : clamp(0.18 + Math.sqrt(byIsland) * 0.82, 0, 1);
}

function getTimeOfDayIndex() {
    const state = window.Game.state || {};
    const cycleLength = TIME_OF_DAY_CYCLE.length;
    const rawIndex = typeof state.currentTimeOfDayIndex === 'number' ? state.currentTimeOfDayIndex : 0;

    return ((rawIndex % cycleLength) + cycleLength) % cycleLength;
}

function getTimeOfDayDefinition(index = getTimeOfDayIndex()) {
    return TIME_OF_DAY_CYCLE[index] || TIME_OF_DAY_CYCLE[0];
}

function advanceTimeOfDay(step = 1) {
    const cycleLength = TIME_OF_DAY_CYCLE.length;
    const nextIndex = (getTimeOfDayIndex() + step + cycleLength) % cycleLength;

    window.Game.state.currentTimeOfDayIndex = nextIndex;
    return getTimeOfDayDefinition(nextIndex);
}

function mixTimeColor(channelValues, targets, moodFactor) {
    return `rgb(${mixChannel(channelValues[0], targets[0], moodFactor)}, ${mixChannel(channelValues[1], targets[1], moodFactor)}, ${mixChannel(channelValues[2], targets[2], moodFactor)})`;
}

function drawIslandBackdrop(progression) {
    const game = window.Game;
    const moodFactor = getIslandMoodFactor(progression);
    const timeOfDay = getTimeOfDayDefinition();
    const gradient = game.ctx.createLinearGradient(0, 0, 0, game.canvas.height);

    gradient.addColorStop(
        0,
        mixTimeColor(timeOfDay.skyTop, [56, 78, 74], moodFactor)
    );
    gradient.addColorStop(
        0.55,
        mixTimeColor(timeOfDay.skyMid, [42, 62, 58], moodFactor)
    );
    gradient.addColorStop(
        1,
        mixTimeColor(timeOfDay.skyBottom, [28, 40, 38], moodFactor)
    );

    game.ctx.fillStyle = gradient;
    game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
}

function drawTimeOfDayOverlay() {
    const game = window.Game;
    const timeOfDay = getTimeOfDayDefinition();

    if (timeOfDay.worldTint) {
        game.ctx.fillStyle = timeOfDay.worldTint;
        game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    }

    if (timeOfDay.fogTopTint || timeOfDay.fogBottomTint) {
        const fogGradient = game.ctx.createLinearGradient(0, 0, 0, game.canvas.height);

        fogGradient.addColorStop(0, timeOfDay.fogTopTint || 'rgba(255, 255, 255, 0)');
        fogGradient.addColorStop(0.45, timeOfDay.fogTopTint || timeOfDay.fogBottomTint || 'rgba(255, 255, 255, 0)');
        fogGradient.addColorStop(1, timeOfDay.fogBottomTint || 'rgba(255, 255, 255, 0)');
        game.ctx.fillStyle = fogGradient;
        game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    }

    if (timeOfDay.darknessTint) {
        game.ctx.fillStyle = timeOfDay.darknessTint;
        game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    }
}

function drawWeatherOverlay(progression) {
    const weatherRuntime = window.Game.systems.weatherRuntime || null;

    if (window.Game.state.activeHouse) {
        return;
    }

    if (!weatherRuntime || typeof weatherRuntime.drawCurrentWeatherOverlay !== 'function') {
        return;
    }

    weatherRuntime.drawCurrentWeatherOverlay(progression);
}

let renderRequestId = null;
let pendingRenderOptions = null;
let lastRenderOptions = null;
let cameraSettling = false;

function renderScene(playerPos, options = {}) {
    const game = window.Game;
    const {
        cameraFocusPos = playerPos,
        shouldUpdateCamera = false
    } = options;
    const activeHouse = game.state.activeHouse;
    const activeInteraction = game.state.activeInteraction;
    const activeProgression = game.state.activeTileInfo && game.state.activeTileInfo.progression
        ? game.state.activeTileInfo.progression
        : null;
    const focusChunkX = Math.floor(cameraFocusPos.x / game.config.chunkSize);
    const focusChunkY = Math.floor(cameraFocusPos.y / game.config.chunkSize);

    game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
    drawIslandBackdrop(activeProgression);
    if (shouldUpdateCamera) {
        game.systems.camera.updateCamera(cameraFocusPos);
    }

    for (let cy = focusChunkY - game.config.viewDistance; cy <= focusChunkY + game.config.viewDistance; cy++) {
        for (let cx = focusChunkX - game.config.viewDistance; cx <= focusChunkX + game.config.viewDistance; cx++) {
            const chunk = game.state.loadedChunks[`${cx},${cy}`];
            if (chunk) {
                game.systems.chunkRenderer.drawChunk(chunk);
            }
        }
    }

    game.systems.entityRenderer.drawSceneEntities(playerPos, focusChunkX, focusChunkY, activeHouse);
    drawTimeOfDayOverlay();
    drawWeatherOverlay(activeProgression);
    game.systems.debugRenderer.updateDebugPanel(playerPos, activeHouse, activeInteraction);
}

function resolveRenderOptions() {
    const game = window.Game;
    const options = pendingRenderOptions || lastRenderOptions || {
        playerPos: game.state.playerPos
    };
    const playerPos = options.playerPos || game.state.playerPos;

    return {
        playerPos,
        cameraFocusPos: options.cameraFocusPos || playerPos,
        shouldUpdateCamera: Boolean(options.shouldUpdateCamera)
    };
}

function queueNextFrame() {
    if (renderRequestId) {
        return;
    }

    renderRequestId = requestAnimationFrame(flushRender);
}

function flushRender(timestamp) {
    const game = window.Game;
    const effects = game.systems.effects || null;
    const ui = game.systems.ui || null;
    const resolvedOptions = resolveRenderOptions();
    const activeHouse = game.state.activeHouse;
    const activeInteraction = game.state.activeInteraction;
    const activeEffects = effects && typeof effects.pruneExpiredEffects === 'function'
        ? effects.pruneExpiredEffects(timestamp)
        : [];

    renderRequestId = null;
    pendingRenderOptions = null;
    lastRenderOptions = resolvedOptions;

    renderScene(resolvedOptions.playerPos, resolvedOptions);

    if (ui && typeof ui.refreshDirty === 'function') {
        ui.refreshDirty(resolvedOptions.playerPos, activeHouse, activeInteraction);
    }

    if (cameraSettling && game.systems.camera.isCameraSettled()) {
        game.camera.offset.x = game.camera.target.x;
        game.camera.offset.y = game.camera.target.y;
        cameraSettling = false;
        requestRender({
            playerPos: game.state.playerPos
        });
        return;
    }

    if (cameraSettling) {
        requestRender({
            playerPos: game.state.playerPos,
            cameraFocusPos: game.state.playerPos,
            shouldUpdateCamera: true
        });
        return;
    }

    if (activeEffects.length > 0) {
        requestRender({
            playerPos: resolvedOptions.playerPos,
            cameraFocusPos: resolvedOptions.cameraFocusPos,
            shouldUpdateCamera: resolvedOptions.shouldUpdateCamera
        });
    }
}

function requestRender(options = {}) {
    const game = window.Game;
    const nextOptions = {
        playerPos: options.playerPos || game.state.playerPos,
        cameraFocusPos: options.cameraFocusPos || options.playerPos || game.state.playerPos,
        shouldUpdateCamera: Boolean(options.shouldUpdateCamera)
    };

    pendingRenderOptions = pendingRenderOptions
        ? {
            playerPos: nextOptions.playerPos,
            cameraFocusPos: nextOptions.cameraFocusPos,
            shouldUpdateCamera: pendingRenderOptions.shouldUpdateCamera || nextOptions.shouldUpdateCamera
        }
        : nextOptions;

    queueNextFrame();
}

function render() {
    requestRender({
        playerPos: window.Game.state.playerPos
    });
}

function renderWithInterpolation(position) {
    requestRender({
        playerPos: position,
        cameraFocusPos: position,
        shouldUpdateCamera: true
    });
}

function stopCameraAnimation() {
    const game = window.Game;

    cameraSettling = false;
    game.systems.camera.stopCameraAnimation();

    if (renderRequestId) {
        cancelAnimationFrame(renderRequestId);
        renderRequestId = null;
    }

    pendingRenderOptions = null;
}

function settleCameraOnPlayer() {
    const game = window.Game;

    stopCameraAnimation();
    cameraSettling = true;
    requestRender({
        playerPos: game.state.playerPos,
        cameraFocusPos: game.state.playerPos,
        shouldUpdateCamera: true
    });
}

window.Game.systems.render = {
    render,
    renderWithInterpolation,
    requestRender,
    timeOfDayCycle: TIME_OF_DAY_CYCLE,
    getTimeOfDayDefinition,
    advanceTimeOfDay,
    isoToScreen: window.Game.systems.camera.isoToScreen,
    centerCameraOn: window.Game.systems.camera.centerCameraOn,
    settleCameraOnPlayer,
    stopCameraAnimation
};
