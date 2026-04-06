function stopActiveGameLoops() {
    const game = window.Game;

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

function initializeUiAndWorldFromCurrentState() {
    const mapRuntime = window.Game.systems.mapRuntime || null;

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

    generateVisibleChunksAroundPlayer();
    window.Game.systems.world.updatePlayerContext(window.Game.state.playerPos);
    window.Game.systems.render.centerCameraOn(window.Game.state.playerPos);

    if (mapRuntime && typeof mapRuntime.captureVisibleWorld === 'function') {
        const focusChunkX = Math.floor(window.Game.state.playerPos.x / window.Game.config.chunkSize);
        const focusChunkY = Math.floor(window.Game.state.playerPos.y / window.Game.config.chunkSize);
        mapRuntime.captureVisibleWorld(focusChunkX, focusChunkY);
    }

    if (mapRuntime && typeof mapRuntime.persistExploration === 'function') {
        mapRuntime.persistExploration();
    }

    setupEventListeners();
    window.Game.systems.render.render();
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
        if (mapRuntime && typeof mapRuntime.persistExploration === 'function') {
            mapRuntime.persistExploration();
        }
        // window.Game.debug.element = document.getElementById('debugPanel');
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

function generateVisibleChunksAroundPlayer() {
    const game = window.Game;
    const playerChunkX = Math.floor(game.state.playerPos.x / game.config.chunkSize);
    const playerChunkY = Math.floor(game.state.playerPos.y / game.config.chunkSize);

    for (let dx = -game.config.viewDistance; dx <= game.config.viewDistance; dx++) {
        for (let dy = -game.config.viewDistance; dy <= game.config.viewDistance; dy++) {
            game.systems.world.getChunk(playerChunkX + dx, playerChunkY + dy);
        }
    }
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
    if (document.readyState === 'complete') {
        initGame({ usePersistedWorld: false });
    } else {
        window.addEventListener('load', () => {
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
