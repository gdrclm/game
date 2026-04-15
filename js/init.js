const INITIAL_VISIBLE_CHUNK_DETAIL_LEVEL = 'base';
const INITIAL_SYNC_CHUNK_RADIUS = 0;
const STARTUP_WARMUP_DELAY_MS = 1200;
const STARTUP_PREWARM_CHUNK_RADIUS = 1;
let startupWarmupFrameId = null;
let startupWarmupTimerId = null;
let startupWarmupIdleId = null;

function cancelPostFirstRenderStartupWork() {
    if (startupWarmupFrameId) {
        cancelAnimationFrame(startupWarmupFrameId);
        startupWarmupFrameId = null;
    }

    if (startupWarmupTimerId) {
        window.clearTimeout(startupWarmupTimerId);
        startupWarmupTimerId = null;
    }

    if (startupWarmupIdleId) {
        if (typeof window.cancelIdleCallback === 'function') {
            window.cancelIdleCallback(startupWarmupIdleId);
        } else {
            window.clearTimeout(startupWarmupIdleId);
        }
        startupWarmupIdleId = null;
    }
}

function scheduleStartupIdleCallback(callback, timeout = 1500) {
    if (typeof callback !== 'function') {
        return null;
    }

    if (typeof window.requestIdleCallback === 'function') {
        return window.requestIdleCallback(callback, { timeout });
    }

    return window.setTimeout(() => {
        callback({
            didTimeout: true,
            timeRemaining: () => 0
        });
    }, timeout);
}

function stopActiveGameLoops() {
    const game = window.Game;
    const chunkGenerator = game && game.systems ? game.systems.chunkGenerator || null : null;

    cancelPostFirstRenderStartupWork();

    if (chunkGenerator && typeof chunkGenerator.resetGenerationRuntime === 'function') {
        chunkGenerator.resetGenerationRuntime({
            clearCaches: true
        });
    }

    if (!game || !game.state) {
        return;
    }

    if ((game.state.isMoving || game.state.animationRequestId) && game.systems.movement && typeof game.systems.movement.endMovement === 'function') {
        game.systems.movement.endMovement();
    } else if (game.state.animationRequestId) {
        cancelAnimationFrame(game.state.animationRequestId);
        game.state.animationRequestId = null;
    }

    if (game.systems.render && typeof game.systems.render.stopCameraAnimation === 'function') {
        game.systems.render.stopCameraAnimation();
    }
}

function getChunkCoordinatesAroundPlayer(radius = window.Game.config.viewDistance) {
    const game = window.Game;
    const playerChunkX = Math.floor(game.state.playerPos.x / game.config.chunkSize);
    const playerChunkY = Math.floor(game.state.playerPos.y / game.config.chunkSize);
    const chunkCoordinates = [];

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            chunkCoordinates.push({
                chunkX: playerChunkX + dx,
                chunkY: playerChunkY + dy
            });
        }
    }

    return chunkCoordinates;
}

function schedulePostFirstRenderStartupWork() {
    const game = window.Game;
    const mapRuntime = game.systems.mapRuntime || null;
    const chunkGenerator = game.systems.chunkGenerator || null;

    cancelPostFirstRenderStartupWork();

    startupWarmupFrameId = requestAnimationFrame(() => {
        startupWarmupFrameId = null;
        startupWarmupTimerId = window.setTimeout(() => {
            startupWarmupTimerId = null;
            startupWarmupIdleId = scheduleStartupIdleCallback(() => {
                startupWarmupIdleId = null;
                const focusChunkX = Math.floor(game.state.playerPos.x / game.config.chunkSize);
                const focusChunkY = Math.floor(game.state.playerPos.y / game.config.chunkSize);

                if (chunkGenerator && typeof chunkGenerator.prewarmChunks === 'function') {
                    chunkGenerator.prewarmChunks(
                        getChunkCoordinatesAroundPlayer(STARTUP_PREWARM_CHUNK_RADIUS),
                        {
                            detailLevel: 'base',
                            priority: 'low'
                        }
                    );
                }

                if (mapRuntime && typeof mapRuntime.captureVisibleWorld === 'function') {
                    mapRuntime.captureVisibleWorld(focusChunkX, focusChunkY, {
                        chunkRadius: INITIAL_SYNC_CHUNK_RADIUS
                    });
                }
            });
        }, STARTUP_WARMUP_DELAY_MS);
    });
}

function initializeUiAndWorldFromCurrentState() {
    if (window.Game.systems.playerRenderer) {
        window.Game.systems.playerRenderer.resetFacing();
    }

    if (window.Game.systems.effects) {
        window.Game.systems.effects.clearAllEffects();
    }

    if (window.Game.systems.ui) {
        window.Game.systems.ui.lastActionMessage = '';
        window.Game.systems.ui.lastActionContextKey = '';
        window.Game.systems.ui.initializeLayout();
    }

    generateVisibleChunksAroundPlayer({
        radius: INITIAL_SYNC_CHUNK_RADIUS,
        detailLevel: INITIAL_VISIBLE_CHUNK_DETAIL_LEVEL,
        queueDeferred: false,
        priority: 'high'
    });
    window.Game.systems.world.updatePlayerContext(window.Game.state.playerPos);
    window.Game.systems.render.centerCameraOn(window.Game.state.playerPos);

    setupEventListeners();
    window.Game.systems.render.render();
    schedulePostFirstRenderStartupWork();
}

function applyLoadedSnapshot(snapshot, options = {}) {
    const saveLoad = window.Game.systems.saveLoad || null;
    const mapRuntime = window.Game.systems.mapRuntime || null;

    if (!saveLoad || typeof saveLoad.applySnapshotToState !== 'function') {
        throw new Error('Save/load system is unavailable');
    }

    stopActiveGameLoops();

    if (Number.isFinite(options.worldSeed)) {
        window.Game.config.worldSeed = options.worldSeed;
    } else if (!Number.isFinite(window.Game.config.worldSeed)) {
        window.Game.config.worldSeed = window.Game.systems.utils.generateWorldSeed();
    }

    if (window.Game.systems.expedition && typeof window.Game.systems.expedition.resetArchipelago === 'function') {
        window.Game.systems.expedition.resetArchipelago();
    }

    if (mapRuntime && typeof mapRuntime.clearPersistedExploration === 'function') {
        mapRuntime.clearPersistedExploration();
    }

    saveLoad.applySnapshotToState(window.Game.state, snapshot);
    window.Game.state.isPaused = false;
    window.Game.state.isMapOpen = false;
    window.Game.state.openMerchantHouseId = null;

    initializeUiAndWorldFromCurrentState();
}

function initGame(options = {}) {
    try {
        if (!window.Game || !window.Game.canvas || !window.Game.state) {
            throw new Error('Missing dependencies');
        }

        const {
            usePersistedWorld = false,
            snapshot = null,
            worldSeed = null
        } = options;
        const mapRuntime = window.Game.systems.mapRuntime || null;

        if (snapshot && typeof snapshot === 'object') {
            applyLoadedSnapshot(snapshot, {
                worldSeed
            });
            return;
        }

        const persistedWorldSeed = usePersistedWorld && mapRuntime && typeof mapRuntime.getPersistedWorldSeed === 'function'
            ? mapRuntime.getPersistedWorldSeed()
            : null;

        stopActiveGameLoops();
        window.Game.config.worldSeed = Number.isFinite(persistedWorldSeed)
            ? persistedWorldSeed
            : window.Game.systems.utils.generateWorldSeed();
        if (window.Game.systems.expedition && typeof window.Game.systems.expedition.resetArchipelago === 'function') {
            window.Game.systems.expedition.resetArchipelago();
        }
        if (window.Game.systems.saveLoad) {
            window.Game.systems.saveLoad.resetRuntimeState(window.Game.state);
        }
        if (usePersistedWorld && mapRuntime && typeof mapRuntime.restorePersistedExploration === 'function') {
            mapRuntime.restorePersistedExploration();
        }
        window.Game.systems.playerRenderer.resetFacing();
        if (window.Game.systems.effects) {
            window.Game.systems.effects.clearAllEffects();
        }
        initializeUiAndWorldFromCurrentState();
    } catch (error) {
        console.error('Init error:', error);
        showErrorToUser(error.message);
    }
}

function clearTransientRunPersistence() {
    const game = window.Game;
    const saveLoad = game && game.systems ? game.systems.saveLoad || null : null;
    const mapRuntime = game && game.systems ? game.systems.mapRuntime || null : null;

    if (saveLoad && typeof saveLoad.clearStorage === 'function') {
        saveLoad.clearStorage();
    }

    if (mapRuntime && typeof mapRuntime.clearPersistedExploration === 'function') {
        mapRuntime.clearPersistedExploration();
    }
}

function startNewGame() {
    clearTransientRunPersistence();

    initGame({ usePersistedWorld: false });
}

function loadGameFromSlot(slotId) {
    const game = window.Game;
    const saveLoad = game && game.systems ? game.systems.saveLoad || null : null;

    if (!saveLoad || typeof saveLoad.loadFromSlot !== 'function') {
        return false;
    }

    const slotRecord = saveLoad.loadFromSlot(slotId);
    if (!slotRecord || !slotRecord.snapshot) {
        return false;
    }

    initGame({
        snapshot: slotRecord.snapshot,
        worldSeed: slotRecord.worldSeed
    });
    return true;
}

function generateVisibleChunksAroundPlayer(options = {}) {
    const game = window.Game;

    getChunkCoordinatesAroundPlayer(options.radius).forEach(({ chunkX, chunkY }) => {
        game.systems.world.getChunk(chunkX, chunkY, {
            detailLevel: options.detailLevel || INITIAL_VISIBLE_CHUNK_DETAIL_LEVEL,
            immediate: options.immediate,
            priority: options.priority || 'normal',
            queueDeferred: options.queueDeferred
        });
    });
}

function handleWindowResize() {
    if (window.Game && window.Game.systems.ui) {
        window.Game.systems.ui.handleResize();
    }

    if (window.Game && window.Game.systems.render) {
        window.Game.systems.render.render();
    }
}

function setupEventListeners() {
    const input = window.Game.systems.input;

    window.removeEventListener('resize', handleWindowResize);
    window.Game.canvas.removeEventListener('click', input.handleClick);
    window.removeEventListener('keydown', input.handleKeyDown);

    window.addEventListener('resize', handleWindowResize);
    window.Game.canvas.addEventListener('click', input.handleClick);
    window.addEventListener('keydown', input.handleKeyDown);
}

function showErrorToUser(message) {
    const errorElement = document.getElementById('error-message') || document.getElementById('instructions');
    if (errorElement) {
        errorElement.textContent = `Error: ${message}`;
        errorElement.style.color = 'red';
    }
}

function initializeGame() {
    if (document.readyState !== 'loading') {
        initGame({ usePersistedWorld: false });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            initGame({ usePersistedWorld: false });
        }, { once: true });
    }
}

window.Game.systems.gameLifecycle = Object.assign(window.Game.systems.gameLifecycle || {}, {
    initGame,
    loadGameFromSlot,
    startNewGame,
    initializeGame
});

initializeGame();
