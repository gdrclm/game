(() => {
    const game = window.Game;
    const interactions = game.systems.interactions = game.systems.interactions || {};
    const router = game.systems.interactionRouter || {};
    const spawns = game.systems.worldSpawnRuntime || {};

    Object.assign(interactions, {
        router,
        spawns,
        getInteractionAtChunkTile: router.getInteractionAtChunkTile,
        getInteractionAtWorld: router.getInteractionAtWorld,
        getGroundItemAtWorld: router.getGroundItemAtWorld,
        getAdjacentInteraction: router.getAdjacentInteraction,
        isAdjacentToInteraction: router.isAdjacentToInteraction,
        resolveClickTarget: router.resolveClickTarget,
        createChunkInteractions: spawns.createChunkInteractions,
        buildInteractionTileMap: spawns.buildInteractionTileMap,
        addGroundItemDrop: spawns.addGroundItemDrop,
        replaceGroundItemAtWorld: spawns.replaceGroundItemAtWorld,
        removeInteraction: spawns.removeInteraction
    });
})();
