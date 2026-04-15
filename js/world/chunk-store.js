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
        const {
            generateIfMissing = true,
            immediate = true,
            priority = 'normal',
            queueDeferred
        } = options;
        const requestedDetailLevel = Object.prototype.hasOwnProperty.call(options, 'detailLevel')
            ? options.detailLevel
            : (generateIfMissing ? 'full' : 'base');
        const state = window.Game.state;
        const chunkKey = getChunkKey(chunkX, chunkY);
        const chunkGenerator = window.Game.systems.chunkGenerator || null;

        if (state.loadedChunks[chunkKey]) {
            const chunk = state.loadedChunks[chunkKey];

            if (
                chunkGenerator
                && typeof chunkGenerator.ensureChunkGenerationLevel === 'function'
                && requestedDetailLevel === 'full'
            ) {
                return chunkGenerator.ensureChunkGenerationLevel(chunk, {
                    detailLevel: requestedDetailLevel,
                    immediate,
                    priority
                });
            }

            return chunk;
        }

        if (!generateIfMissing || typeof window.Game.systems.generateChunk !== 'function') {
            return null;
        }

        return window.Game.systems.generateChunk(chunkX, chunkY, {
            detailLevel: requestedDetailLevel,
            immediate,
            priority,
            queueDeferred
        });
    }

    function storeChunk(chunk) {
        const state = window.Game.state;
        const chunkKey = getChunkKey(chunk.x, chunk.y);
        const pathfinding = window.Game.systems.pathfinding || null;

        if (!state.loadedChunks[chunkKey]) {
            state.loadedChunkCount++;
        }

        state.loadedChunks[chunkKey] = chunk;

        if (pathfinding && typeof pathfinding.invalidateCaches === 'function') {
            pathfinding.invalidateCaches();
        }

        return chunk;
    }

    function unloadChunk(chunkX, chunkY) {
        const state = window.Game.state;
        const chunkKey = getChunkKey(chunkX, chunkY);
        const pathfinding = window.Game.systems.pathfinding || null;

        if (!state.loadedChunks[chunkKey]) {
            return false;
        }

        delete state.loadedChunks[chunkKey];
        state.loadedChunkCount = Math.max(0, state.loadedChunkCount - 1);

        if (pathfinding && typeof pathfinding.invalidateCaches === 'function') {
            pathfinding.invalidateCaches();
        }

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
