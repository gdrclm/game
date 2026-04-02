(() => {
    const game = window.Game;
    const expedition = game.systems.expedition = game.systems.expedition || {};
    const expeditionShared = game.systems.expeditionShared = game.systems.expeditionShared || {};
    const finalIslandIndex = 30;
    const DIRECTIONS = [
        { name: 'east', dx: 1, dy: 0, opposite: 'west' },
        { name: 'west', dx: -1, dy: 0, opposite: 'east' },
        { name: 'south', dx: 0, dy: 1, opposite: 'north' },
        { name: 'north', dx: 0, dy: -1, opposite: 'south' }
    ];
    const directionByName = Object.fromEntries(
        DIRECTIONS.map((direction) => [direction.name, direction])
    );

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function chunkKey(chunkX, chunkY) {
        return `${chunkX},${chunkY}`;
    }

    function createIslandRandom(islandIndex, salt = 0) {
        return game.systems.utils.createSeededRandom(
            islandIndex * 173 + salt * 31,
            islandIndex * -97 - salt * 19
        );
    }

    Object.assign(expeditionShared, {
        finalIslandIndex,
        DIRECTIONS,
        directionByName,
        clamp,
        chunkKey,
        createIslandRandom
    });

    expedition.finalIslandIndex = finalIslandIndex;
})();
