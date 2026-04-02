(() => {
    const game = window.Game;
    const chunkGenerator = game.systems.chunkGenerator || null;

    if (!chunkGenerator || typeof chunkGenerator.generateChunk !== 'function') {
        return;
    }

    game.systems.map = game.systems.map || {};
    game.systems.map.chunkGenerator = chunkGenerator;
    game.systems.generateChunk = (...args) => chunkGenerator.generateChunk(...args);
})();
