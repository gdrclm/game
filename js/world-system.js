(() => {
    const world = window.Game.systems.world = window.Game.systems.world || {};

    Object.assign(
        world,
        window.Game.systems.worldChunkStore || {},
        window.Game.systems.worldTileQuery || {}
    );
})();
