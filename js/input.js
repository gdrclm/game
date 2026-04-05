function handleClick(event) {
    const game = window.Game;
    let hasRouteWarning = false;

    if (game.state.isPaused || game.state.isGameOver || game.state.isMapOpen) {
        return;
    }

    const rect = game.canvas.getBoundingClientRect();
    const isoPosition = game.systems.utils.screenToIso(
        event.clientX - rect.left,
        event.clientY - rect.top,
        game.camera.offset.x,
        game.camera.offset.y
    );
    const targetX = Math.round(isoPosition.x);
    const targetY = Math.round(isoPosition.y);
    const clickedInteraction = game.systems.interactions
        ? game.systems.interactions.getInteractionAtWorld(targetX, targetY, { generateIfMissing: false })
        : null;
    const clickedTileInfo = game.systems.world && typeof game.systems.world.getTileInfo === 'function'
        ? game.systems.world.getTileInfo(targetX, targetY, { generateIfMissing: false })
        : null;

    if (game.state.isMoving) {
        game.systems.movement.endMovement();
    }

    preloadChunkAndNeighbors(targetX, targetY);

    if (
        game.systems.actionUi
        && typeof game.systems.actionUi.tryCollectClickedRock === 'function'
        && game.systems.actionUi.tryCollectClickedRock(clickedTileInfo)
    ) {
        return;
    }

    const startX = Math.round(game.state.playerPos.x);
    const startY = Math.round(game.state.playerPos.y);
    const resolvedTarget = game.systems.interactions
        ? game.systems.interactions.resolveClickTarget(startX, startY, targetX, targetY)
        : { x: targetX, y: targetY };
    const baseMoveCellsPerTurn = Math.max(1, game.config.maxMoveCellsPerTurn || 5);
    const maxMoveCellsPerTurn = game.systems.ui && typeof game.systems.ui.getRouteLengthLimit === 'function'
        ? game.systems.ui.getRouteLengthLimit()
        : baseMoveCellsPerTurn;
    const pathResult = game.systems.pathfinding.findPathResult(startX, startY, resolvedTarget.x, resolvedTarget.y);
    const existingRoute = Array.isArray(game.state.route) ? game.state.route : [];
    const selectedWorldTile = game.state.selectedWorldTile;
    const isRepeatClickOnSelectedTile = Boolean(
        selectedWorldTile
        && selectedWorldTile.x === targetX
        && selectedWorldTile.y === targetY
    );

    game.state.selectedWorldTile = { x: targetX, y: targetY };
    game.state.selectedWorldInteractionId = clickedInteraction ? clickedInteraction.id : null;

    game.state.routePreviewLength = pathResult.path.length;
    game.state.routePreviewTotalCost = pathResult.totalCost;
    game.state.route = pathResult.path.slice(0, maxMoveCellsPerTurn);
    game.state.routeTotalCost = game.systems.pathfinding.calculatePathCost(game.state.route);

    if (
        game.state.route.length === maxMoveCellsPerTurn
        && (resolvedTarget.x !== game.state.route[game.state.route.length - 1].x
            || resolvedTarget.y !== game.state.route[game.state.route.length - 1].y)
        && game.systems.ui
    ) {
        game.systems.ui.setActionMessage(
            maxMoveCellsPerTurn < baseMoveCellsPerTurn
                ? `Из-за недосыпа за ход удаётся спланировать только ${maxMoveCellsPerTurn} клетки.`
                : `За один ход можно пройти не больше ${maxMoveCellsPerTurn} клеток.`
        );
        hasRouteWarning = true;
    }

    if (game.state.route.length > 0) {
        preloadChunksAlongRoute();
    } else {
        game.state.routePreviewLength = 0;
        game.state.routePreviewTotalCost = 0;
        game.state.routeTotalCost = 0;
    }

    if (
        !hasRouteWarning
        && game.systems.ui
        && typeof game.systems.ui.setActionMessage === 'function'
    ) {
        game.systems.ui.setActionMessage('');
    }

    if (
        isRepeatClickOnSelectedTile
        && existingRoute.length > 0
        && game.state.route.length > 0
        && !game.state.isMoving
        && game.systems.movement
        && typeof game.systems.movement.startMovement === 'function'
    ) {
        game.systems.movement.startMovement();
        return;
    }

    if (game.systems.actionUi && typeof game.systems.actionUi.describeSelectedWorldTarget === 'function') {
        const describedSelection = game.systems.actionUi.describeSelectedWorldTarget({
            tileInfo: clickedTileInfo,
            interaction: clickedInteraction
        });

        if (describedSelection) {
            return;
        }
    }

    if (game.systems.ui && typeof game.systems.ui.renderAfterStateChange === 'function') {
        game.systems.ui.renderAfterStateChange(['location', 'actions', 'actionHint']);
        return;
    }

    game.systems.render.render();
}

function preloadChunkAndNeighbors(x, y) {
    const game = window.Game;
    const { chunkX, chunkY } = game.systems.world.getChunkCoordinatesForWorld(x, y);

    for (let dx = -game.config.chunkPreloadRadius; dx <= game.config.chunkPreloadRadius; dx++) {
        for (let dy = -game.config.chunkPreloadRadius; dy <= game.config.chunkPreloadRadius; dy++) {
            game.systems.world.getChunk(chunkX + dx, chunkY + dy);
        }
    }
}

function handleKeyDown(event) {
    const game = window.Game;
    const mapUi = game.systems.mapUi || null;

    if (game.state.isGameOver) {
        return;
    }

    if ((event.code === 'Escape' || event.code === 'KeyM') && game.state.isMapOpen && mapUi && typeof mapUi.toggleMapPanel === 'function') {
        event.preventDefault();
        mapUi.toggleMapPanel(false);
        return;
    }

    if (event.code === 'KeyM' && mapUi && typeof mapUi.toggleMapPanel === 'function') {
        event.preventDefault();
        mapUi.toggleMapPanel();
        return;
    }

    if (event.code === 'Escape' && game.systems.ui) {
        event.preventDefault();
        game.systems.ui.togglePause();
        return;
    }

    if (game.state.isPaused || game.state.isMapOpen) {
        return;
    }

    if (event.code === 'Space' && game.state.route.length > 0 && !game.state.isMoving) {
        event.preventDefault();
        game.systems.movement.startMovement();
    }
}

function preloadChunksAlongRoute() {
    const game = window.Game;
    const chunksToLoad = new Set();

    game.state.route.forEach((point) => {
        const { chunkX, chunkY } = game.systems.world.getChunkCoordinatesForWorld(point.x, point.y);
        chunksToLoad.add(`${chunkX},${chunkY}`);
    });

    chunksToLoad.forEach((chunkKey) => {
        const [chunkX, chunkY] = chunkKey.split(',').map(Number);
        game.systems.world.getChunk(chunkX, chunkY);
    });
}

window.Game.systems.input = {
    handleClick,
    handleKeyDown,
    preloadChunkAndNeighbors,
    preloadChunksAlongRoute
};
