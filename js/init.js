function initGame() {
    try {
        if (!window.Game || !window.Game.canvas || !window.Game.state) {
            throw new Error('Missing dependencies');
        }

        const mapRuntime = window.Game.systems.mapRuntime || null;
        const persistedWorldSeed = mapRuntime && typeof mapRuntime.getPersistedWorldSeed === 'function'
            ? mapRuntime.getPersistedWorldSeed()
            : null;

        window.Game.config.worldSeed = Number.isFinite(persistedWorldSeed)
            ? persistedWorldSeed
            : window.Game.systems.utils.generateWorldSeed();
        if (window.Game.systems.expedition && typeof window.Game.systems.expedition.resetArchipelago === 'function') {
            window.Game.systems.expedition.resetArchipelago();
        }
        if (window.Game.systems.saveLoad) {
            window.Game.systems.saveLoad.resetRuntimeState(window.Game.state);
        }
        if (mapRuntime && typeof mapRuntime.restorePersistedExploration === 'function') {
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
        setupEventListeners();
        window.Game.systems.render.render();
    } catch (error) {
        console.error('Init error:', error);
        showErrorToUser(error.message);
    }
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
        initGame();
    } else {
        window.addEventListener('load', initGame);
    }
}

initializeGame();
