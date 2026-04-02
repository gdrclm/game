function normalizeModulo(value, base) {
    return ((value % base) + base) % base;
}

function screenToIso(screenX, screenY, offsetX = 0, offsetY = 0) {
    const adjustedX = screenX - offsetX;
    const adjustedY = screenY - offsetY;
    const { tileWidth, tileHeight } = window.Game.config;

    return {
        x: (adjustedX / (tileWidth / 2) + adjustedY / (tileHeight / 2)) / 2,
        y: (adjustedY / (tileHeight / 2) - adjustedX / (tileWidth / 2)) / 2
    };
}

function hashCoordinates(x, y, seed) {
    let hash = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0;
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177) >>> 0;
    hash = (hash ^ (hash >>> 16)) >>> 0;
    return hash || 1;
}

function createSeededRandom(chunkX, chunkY) {
    let state = hashCoordinates(chunkX, chunkY, window.Game.config.worldSeed);

    return function nextRandom() {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 4294967296;
    };
}

function generateWorldSeed() {
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
        const values = new Uint32Array(1);
        window.crypto.getRandomValues(values);
        return values[0];
    }

    return (Date.now() ^ Math.floor(Math.random() * 4294967295)) >>> 0;
}

window.Game.systems.utils = {
    normalizeModulo,
    screenToIso,
    createSeededRandom,
    generateWorldSeed
};
