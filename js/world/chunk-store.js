(() => {
    const chunkStore = window.Game.systems.worldChunkStore = window.Game.systems.worldChunkStore || {};

    function getChunkKey(chunkX, chunkY) {
        return `${chunkX},${chunkY}`;
    }

    function getChunkCoordinatesForWorld(x, y) {
        const chunkSize = window.Game.config.chunkSize;

        return {
            chunkX: Math.floor(x / chunkSize),
            chunkY: Math.floor(y / chunkSize)
        };
    }

    function getLocalCoordinatesForWorld(x, y) {
        const chunkSize = window.Game.config.chunkSize;
        const { normalizeModulo } = window.Game.systems.utils;

        return {
            localX: normalizeModulo(x, chunkSize),
            localY: normalizeModulo(y, chunkSize)
        };
    }

    function getChunk(chunkX, chunkY, options = {}) {
        const { generateIfMissing = true } = options;
        const state = window.Game.state;
        const chunkKey = getChunkKey(chunkX, chunkY);

        if (state.loadedChunks[chunkKey]) {
            return state.loadedChunks[chunkKey];
        }

        if (!generateIfMissing || typeof window.Game.systems.generateChunk !== 'function') {
            return null;
        }

        return window.Game.systems.generateChunk(chunkX, chunkY);
    }

    function storeChunk(chunk) {
        const state = window.Game.state;
        const chunkKey = getChunkKey(chunk.x, chunk.y);

        if (!state.loadedChunks[chunkKey]) {
            state.loadedChunkCount++;
        }

        state.loadedChunks[chunkKey] = chunk;
        return chunk;
    }

    function unloadChunk(chunkX, chunkY) {
        const state = window.Game.state;
        const chunkKey = getChunkKey(chunkX, chunkY);

        if (!state.loadedChunks[chunkKey]) {
            return false;
        }

        delete state.loadedChunks[chunkKey];
        state.loadedChunkCount = Math.max(0, state.loadedChunkCount - 1);
        return true;
    }

    Object.assign(chunkStore, {
        getChunkKey,
        getChunkCoordinatesForWorld,
        getLocalCoordinatesForWorld,
        getChunk,
        storeChunk,
        unloadChunk
    });
})();
