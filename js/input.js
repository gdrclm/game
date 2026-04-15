const ROUTE_PREVIEW_EXTRA_STEPS = 6;
const ROUTE_PREVIEW_COST_BUFFER = 1.75;

function handleClick(event) {
    const game = window.Game;

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

    if (
        game.systems.actionUi
        && typeof game.systems.actionUi.tryCollectClickedRock === 'function'
        && game.systems.actionUi.tryCollectClickedRock(clickedTileInfo)
    ) {
        return;
    }

    const existingRoute = Array.isArray(game.state.route) ? game.state.route : [];
    const selectedWorldTile = game.state.selectedWorldTile;
    const isRepeatClickOnSelectedTile = Boolean(
        selectedWorldTile
        && selectedWorldTile.x === targetX
        && selectedWorldTile.y === targetY
    );

    if (
        isRepeatClickOnSelectedTile
        && existingRoute.length > 0
        && !game.state.isMoving
        && game.systems.movement
        && typeof game.systems.movement.startMovement === 'function'
    ) {
        game.state.selectedWorldTile = { x: targetX, y: targetY };
        game.state.selectedWorldInteractionId = clickedInteraction ? clickedInteraction.id : null;
        game.systems.movement.startMovement();
        return;
    }

    game.state.selectedWorldTile = { x: targetX, y: targetY };
    game.state.selectedWorldInteractionId = clickedInteraction ? clickedInteraction.id : null;
    const routePlan = planRouteToTarget(targetX, targetY, {
        showRouteWarning: true,
        clearActionMessage: true,
        queryMode: 'preview',
        preloadTarget: false
    });

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
    const chunkCoordinates = [];

    for (let dx = -game.config.chunkPreloadRadius; dx <= game.config.chunkPreloadRadius; dx++) {
        for (let dy = -game.config.chunkPreloadRadius; dy <= game.config.chunkPreloadRadius; dy++) {
            chunkCoordinates.push({
                chunkX: chunkX + dx,
                chunkY: chunkY + dy
            });
        }
    }

    if (game.systems.chunkGenerator && typeof game.systems.chunkGenerator.prewarmChunks === 'function') {
        game.systems.chunkGenerator.prewarmChunks(chunkCoordinates, {
            detailLevel: 'base',
            priority: 'high'
        });
        return;
    }

    chunkCoordinates.forEach((entry) => {
        game.systems.world.getChunk(entry.chunkX, entry.chunkY, {
            detailLevel: 'base',
            queueDeferred: false,
            priority: 'high'
        });
    });
}

function getBaseMoveCellsPerTurn() {
    const game = window.Game;
    return Math.max(1, game.config.maxMoveCellsPerTurn || 5);
}

function getRouteLengthLimit() {
    const game = window.Game;
    return game.systems.ui && typeof game.systems.ui.getRouteLengthLimit === 'function'
        ? game.systems.ui.getRouteLengthLimit()
        : getBaseMoveCellsPerTurn();
}

function clearPlannedRoute() {
    const game = window.Game;
    game.state.route = [];
    game.state.routeTotalCost = 0;
    game.state.routePreviewLength = 0;
    game.state.routePreviewTotalCost = 0;
    game.state.routePreviewIsExact = true;
}

function getRoutePreviewStepLimit(routeLengthLimit = getRouteLengthLimit()) {
    const game = window.Game;

    return Math.max(
        routeLengthLimit,
        Math.min(
            game.config.maxPathLength,
            Math.max(routeLengthLimit * 2, routeLengthLimit + ROUTE_PREVIEW_EXTRA_STEPS)
        )
    );
}

function getRoutePreviewCostLimit(startX, startY, previewStepLimit) {
    const game = window.Game;
    const startTileInfo = game.systems.world.getTileInfo(startX, startY, { generateIfMissing: false });
    const baselineStepCost = Number.isFinite(startTileInfo && startTileInfo.travelWeight) && startTileInfo.travelWeight > 0
        ? startTileInfo.travelWeight
        : 1;

    return Math.max(previewStepLimit, previewStepLimit * baselineStepCost * ROUTE_PREVIEW_COST_BUFFER);
}

function buildPathQueryOptions(startX, startY, maxMoveCellsPerTurn, options = {}) {
    const queryMode = options.queryMode === 'exact' ? 'exact' : 'preview';

    if (queryMode === 'exact') {
        return { queryMode };
    }

    const previewStepLimit = getRoutePreviewStepLimit(maxMoveCellsPerTurn);
    return {
        queryMode,
        maxPathLength: previewStepLimit,
        maxAllowedCost: getRoutePreviewCostLimit(startX, startY, previewStepLimit),
        tileQueryOptions: {
            generateIfMissing: false
        }
    };
}

function planRouteToTarget(targetX, targetY, options = {}) {
    const game = window.Game;
    const showRouteWarning = options.showRouteWarning !== false;
    const clearActionMessage = options.clearActionMessage !== false;

    if (options.preloadTarget) {
        preloadChunkAndNeighbors(targetX, targetY);
    }

    const startX = Math.round(game.state.playerPos.x);
    const startY = Math.round(game.state.playerPos.y);
    const resolvedTarget = game.systems.interactions
        ? game.systems.interactions.resolveClickTarget(startX, startY, targetX, targetY)
        : { x: targetX, y: targetY };
    const baseMoveCellsPerTurn = getBaseMoveCellsPerTurn();
    const maxMoveCellsPerTurn = getRouteLengthLimit();
    const pathResult = game.systems.pathfinding.findPathResult(
        startX,
        startY,
        resolvedTarget.x,
        resolvedTarget.y,
        buildPathQueryOptions(startX, startY, maxMoveCellsPerTurn, options)
    );

    game.state.routePreviewLength = pathResult.path.length;
    game.state.routePreviewTotalCost = pathResult.totalCost;
    game.state.routePreviewIsExact = Boolean(pathResult.isExact);
    game.state.route = pathResult.path.slice(0, maxMoveCellsPerTurn);
    game.state.routeTotalCost = game.systems.pathfinding.calculatePathCost(game.state.route);

    const isTruncated = Boolean(pathResult.isExact && pathResult.path.length > maxMoveCellsPerTurn);
    let hasRouteWarning = false;

    if (isTruncated && showRouteWarning && game.systems.ui) {
        game.systems.ui.setActionMessage(
            maxMoveCellsPerTurn < baseMoveCellsPerTurn
                ? `Из-за недосыпа за ход удаётся спланировать только ${maxMoveCellsPerTurn} клетки.`
                : `За один ход можно пройти не больше ${maxMoveCellsPerTurn} клеток.`
        );
        hasRouteWarning = true;
    }

    if (pathResult.path.length > 0) {
        preloadChunksAlongRoute(pathResult.path);
    } else {
        clearPlannedRoute();
    }

    if (
        !hasRouteWarning
        && clearActionMessage
        && game.systems.ui
        && typeof game.systems.ui.setActionMessage === 'function'
    ) {
        game.systems.ui.setActionMessage('');
    }

    return {
        hasRoute: game.state.route.length > 0,
        hasRouteWarning,
        isTruncated,
        requiresExactResolve: !pathResult.isExact,
        pathResult,
        resolvedTarget
    };
}

function planRouteToSelectedTile(options = {}) {
    const game = window.Game;
    const selectedWorldTile = game.state.selectedWorldTile;

    if (!selectedWorldTile || !Number.isFinite(selectedWorldTile.x) || !Number.isFinite(selectedWorldTile.y)) {
        return {
            hasRoute: false,
            hasRouteWarning: false,
            isTruncated: false,
            pathResult: null,
            resolvedTarget: null
        };
    }

    return planRouteToTarget(selectedWorldTile.x, selectedWorldTile.y, {
        preloadTarget: true,
        ...options
    });
}

function ensureExactRouteToSelectedTile(options = {}) {
    return planRouteToSelectedTile({
        queryMode: 'exact',
        ...options
    });
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

    if (event.code === 'Space' && !game.state.isMoving) {
        const routeReady = Array.isArray(game.state.route) && game.state.route.length > 0;

        if (routeReady) {
            event.preventDefault();
            game.systems.movement.startMovement();
        }
    }
}

function preloadChunksAlongRoute(path = window.Game.state.route) {
    const game = window.Game;
    const chunksToLoad = new Set();

    (Array.isArray(path) ? path : []).forEach((point) => {
        const { chunkX, chunkY } = game.systems.world.getChunkCoordinatesForWorld(point.x, point.y);
        chunksToLoad.add(`${chunkX},${chunkY}`);
    });

    const chunkCoordinates = Array.from(chunksToLoad, (chunkKey) => {
        const [chunkX, chunkY] = chunkKey.split(',').map(Number);
        return { chunkX, chunkY };
    });

    if (game.systems.chunkGenerator && typeof game.systems.chunkGenerator.prewarmChunks === 'function') {
        game.systems.chunkGenerator.prewarmChunks(chunkCoordinates, {
            detailLevel: 'base',
            priority: 'normal'
        });
        return;
    }

    chunkCoordinates.forEach((entry) => {
        game.systems.world.getChunk(entry.chunkX, entry.chunkY, {
            detailLevel: 'base',
            queueDeferred: false,
            priority: 'normal'
        });
    });
}

window.Game.systems.input = {
    handleClick,
    handleKeyDown,
    planRouteToTarget,
    planRouteToSelectedTile,
    ensureExactRouteToSelectedTile,
    clearPlannedRoute,
    preloadChunkAndNeighbors,
    preloadChunksAlongRoute
};
