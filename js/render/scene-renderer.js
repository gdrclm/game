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
const TIME_OF_DAY_TRANSITION_MS = 900;
let timeOfDayTransition = null;

function getNow() {
    return typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
}

function parseColorStringToChannels(color) {
    if (!color || typeof color !== 'string') {
        return [0, 0, 0, 0];
    }

    const normalizedColor = color.replace(/\s+/g, '');
    const match = normalizedColor.match(/^rgba?\((\d+),(\d+),(\d+)(?:,([0-9.]+))?\)$/i);
    if (!match) {
        return [0, 0, 0, 0];
    }

    return [
        clamp(Number(match[1]), 0, 255),
        clamp(Number(match[2]), 0, 255),
        clamp(Number(match[3]), 0, 255),
        clamp(match[4] === undefined ? 1 : Number(match[4]), 0, 1)
    ];
}

function formatColorChannels(channels) {
    return `rgba(${Math.round(channels[0])}, ${Math.round(channels[1])}, ${Math.round(channels[2])}, ${channels[3].toFixed(3)})`;
}

function amplifyColorChannels(channels, alphaMultiplier = 1) {
    if (!Array.isArray(channels) || channels.length < 4) {
        return [0, 0, 0, 0];
    }

    return [
        channels[0],
        channels[1],
        channels[2],
        clamp(channels[3] * alphaMultiplier, 0, 1)
    ];
}

function hasVisibleColor(channels) {
    return Array.isArray(channels) && Number.isFinite(channels[3]) && channels[3] > 0.001;
}

function mixColorChannels(from, to, amount) {
    return [
        mixChannel(from[0], to[0], amount),
        mixChannel(from[1], to[1], amount),
        mixChannel(from[2], to[2], amount),
        from[3] + (to[3] - from[3]) * amount
    ];
}

function cloneTimeOfDayPalette(definition) {
    const source = definition || TIME_OF_DAY_CYCLE[0];
    return {
        skyTop: Array.isArray(source.skyTop) ? source.skyTop.slice(0, 3) : [0, 0, 0],
        skyMid: Array.isArray(source.skyMid) ? source.skyMid.slice(0, 3) : [0, 0, 0],
        skyBottom: Array.isArray(source.skyBottom) ? source.skyBottom.slice(0, 3) : [0, 0, 0],
        worldTint: parseColorStringToChannels(source.worldTint),
        fogTopTint: parseColorStringToChannels(source.fogTopTint),
        fogBottomTint: parseColorStringToChannels(source.fogBottomTint),
        darknessTint: parseColorStringToChannels(source.darknessTint)
    };
}

function mixTimeOfDayPalette(from, to, amount) {
    return {
        skyTop: [
            mixChannel(from.skyTop[0], to.skyTop[0], amount),
            mixChannel(from.skyTop[1], to.skyTop[1], amount),
            mixChannel(from.skyTop[2], to.skyTop[2], amount)
        ],
        skyMid: [
            mixChannel(from.skyMid[0], to.skyMid[0], amount),
            mixChannel(from.skyMid[1], to.skyMid[1], amount),
            mixChannel(from.skyMid[2], to.skyMid[2], amount)
        ],
        skyBottom: [
            mixChannel(from.skyBottom[0], to.skyBottom[0], amount),
            mixChannel(from.skyBottom[1], to.skyBottom[1], amount),
            mixChannel(from.skyBottom[2], to.skyBottom[2], amount)
        ],
        worldTint: mixColorChannels(from.worldTint, to.worldTint, amount),
        fogTopTint: mixColorChannels(from.fogTopTint, to.fogTopTint, amount),
        fogBottomTint: mixColorChannels(from.fogBottomTint, to.fogBottomTint, amount),
        darknessTint: mixColorChannels(from.darknessTint, to.darknessTint, amount)
    };
}

function getRenderedTimeOfDayPalette(timestamp = getNow()) {
    if (!timeOfDayTransition) {
        return cloneTimeOfDayPalette(getTimeOfDayDefinition());
    }

    const elapsed = timestamp - timeOfDayTransition.startedAt;
    const progress = clamp(elapsed / timeOfDayTransition.durationMs, 0, 1);

    if (progress >= 1) {
        timeOfDayTransition = null;
        return cloneTimeOfDayPalette(getTimeOfDayDefinition());
    }

    return mixTimeOfDayPalette(timeOfDayTransition.from, timeOfDayTransition.to, progress);
}

function isTimeOfDayTransitionActive(timestamp = getNow()) {
    if (!timeOfDayTransition) {
        return false;
    }

    if ((timestamp - timeOfDayTransition.startedAt) >= timeOfDayTransition.durationMs) {
        timeOfDayTransition = null;
        return false;
    }

    return true;
}

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
    const currentIndex = getTimeOfDayIndex();
    const nextIndex = (currentIndex + step + cycleLength) % cycleLength;

    if (nextIndex === currentIndex) {
        return getTimeOfDayDefinition(nextIndex);
    }

    const transitionStart = getNow();
    const fromPalette = getRenderedTimeOfDayPalette(transitionStart);

    window.Game.state.currentTimeOfDayIndex = nextIndex;
    timeOfDayTransition = {
        from: fromPalette,
        to: cloneTimeOfDayPalette(getTimeOfDayDefinition(nextIndex)),
        startedAt: transitionStart,
        durationMs: TIME_OF_DAY_TRANSITION_MS
    };
    requestRender({
        playerPos: window.Game.state.playerPos
    });

    return getTimeOfDayDefinition(nextIndex);
}

function mixTimeColor(channelValues, targets, moodFactor) {
    return `rgb(${mixChannel(channelValues[0], targets[0], moodFactor)}, ${mixChannel(channelValues[1], targets[1], moodFactor)}, ${mixChannel(channelValues[2], targets[2], moodFactor)})`;
}

function drawIslandBackdrop(progression, timestamp = getNow()) {
    const game = window.Game;
    const moodFactor = getIslandMoodFactor(progression);
    const timeOfDay = getRenderedTimeOfDayPalette(timestamp);
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

function drawTimeOfDayOverlay(timestamp = getNow()) {
    const game = window.Game;
    const timeOfDay = getRenderedTimeOfDayPalette(timestamp);
    const worldTint = amplifyColorChannels(timeOfDay.worldTint, 1.22);
    const fogTopTint = amplifyColorChannels(timeOfDay.fogTopTint, 1.18);
    const fogBottomTint = amplifyColorChannels(timeOfDay.fogBottomTint, 1.18);
    const darknessTint = amplifyColorChannels(timeOfDay.darknessTint, 1.24);

    if (hasVisibleColor(worldTint)) {
        game.ctx.fillStyle = formatColorChannels(worldTint);
        game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    }

    if (hasVisibleColor(fogTopTint) || hasVisibleColor(fogBottomTint)) {
        const fogGradient = game.ctx.createLinearGradient(0, 0, 0, game.canvas.height);

        fogGradient.addColorStop(0, formatColorChannels(fogTopTint));
        fogGradient.addColorStop(
            0.45,
            formatColorChannels(hasVisibleColor(fogTopTint) ? fogTopTint : fogBottomTint)
        );
        fogGradient.addColorStop(1, formatColorChannels(fogBottomTint));
        game.ctx.fillStyle = fogGradient;
        game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    }

    if (hasVisibleColor(darknessTint)) {
        game.ctx.fillStyle = formatColorChannels(darknessTint);
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

function drawWorld(playerPos, focusChunkX, focusChunkY, activeHouse) {
    const game = window.Game;

    for (let cy = focusChunkY - game.config.viewDistance; cy <= focusChunkY + game.config.viewDistance; cy++) {
        for (let cx = focusChunkX - game.config.viewDistance; cx <= focusChunkX + game.config.viewDistance; cx++) {
            const chunk = game.state.loadedChunks[`${cx},${cy}`];
            if (chunk) {
                game.systems.chunkRenderer.drawChunk(chunk);
            }
        }
    }

    game.systems.entityRenderer.drawSceneEntities(playerPos, focusChunkX, focusChunkY, activeHouse);
}

function drawZoomedWorld(playerPos, focusChunkX, focusChunkY, activeHouse) {
    const game = window.Game;
    const zoom = game.systems.camera && typeof game.systems.camera.getZoom === 'function'
        ? game.systems.camera.getZoom()
        : 1;

    if (Math.abs(zoom - 1) <= 0.001) {
        drawWorld(playerPos, focusChunkX, focusChunkY, activeHouse);
        return;
    }

    const centerX = game.canvas.width / 2;
    const centerY = game.canvas.height / 2;

    game.ctx.save();
    game.ctx.translate(centerX, centerY);
    game.ctx.scale(zoom, zoom);
    game.ctx.translate(-centerX, -centerY);
    drawWorld(playerPos, focusChunkX, focusChunkY, activeHouse);
    game.ctx.restore();
}

let renderRequestId = null;
let pendingRenderOptions = null;
let lastRenderOptions = null;
let cameraSettling = false;

function renderScene(playerPos, options = {}) {
    const game = window.Game;
    const {
        cameraFocusPos = playerPos,
        shouldUpdateCamera = false,
        timestamp = getNow()
    } = options;
    const activeHouse = game.state.activeHouse;
    const activeInteraction = game.state.activeInteraction;
    const activeProgression = game.state.activeTileInfo && game.state.activeTileInfo.progression
        ? game.state.activeTileInfo.progression
        : null;
    const focusChunkX = Math.floor(cameraFocusPos.x / game.config.chunkSize);
    const focusChunkY = Math.floor(cameraFocusPos.y / game.config.chunkSize);

    game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
    drawIslandBackdrop(activeProgression, timestamp);
    if (shouldUpdateCamera) {
        game.systems.camera.updateCamera(cameraFocusPos);
    }

    drawZoomedWorld(playerPos, focusChunkX, focusChunkY, activeHouse);
    drawTimeOfDayOverlay(timestamp);
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

    renderScene(resolvedOptions.playerPos, {
        ...resolvedOptions,
        timestamp
    });

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

    if (activeEffects.length > 0 || isTimeOfDayTransitionActive(timestamp)) {
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
