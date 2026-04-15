const screenViewportBoundsBuffer = { x: 0, y: 0, width: 0, height: 0 };
const routeScreenPointBuffer = { x: 0, y: 0 };
const selectedTileScreenPointBuffer = { x: 0, y: 0 };
const routeTargetScreenPointBuffer = { x: 0, y: 0 };

function fillScreenPoint(x, y, out) {
    const camera = window.Game.systems.camera;

    if (camera && typeof camera.isoToScreenTo === 'function') {
        return camera.isoToScreenTo(x, y, out);
    }

    const point = camera && typeof camera.isoToScreen === 'function'
        ? camera.isoToScreen(x, y)
        : null;

    out.x = point ? point.x : 0;
    out.y = point ? point.y : 0;
    return out;
}

function getScreenViewportBounds() {
    const game = window.Game;
    const { tileWidth, tileHeight } = game.config;

    screenViewportBoundsBuffer.x = -tileWidth * 2;
    screenViewportBoundsBuffer.y = -tileHeight * 5;
    screenViewportBoundsBuffer.width = game.canvas.width + tileWidth * 4;
    screenViewportBoundsBuffer.height = game.canvas.height + tileHeight * 10;
    return screenViewportBoundsBuffer;
}

function rectContainsPoint(rect, x, y) {
    if (!rect) {
        return false;
    }

    return (
        x >= rect.x
        && x <= (rect.x + rect.width)
        && y >= rect.y
        && y <= (rect.y + rect.height)
    );
}

function getRouteRenderStride(routeLength) {
    if (routeLength <= 20) {
        return 1;
    }

    if (routeLength <= 36) {
        return 3;
    }

    if (routeLength <= 60) {
        return 4;
    }

    if (routeLength <= 96) {
        return 6;
    }

    return 8;
}

function drawRouteStep(point, index, options = {}) {
    const game = window.Game;
    const { tileWidth, tileHeight } = game.config;
    fillScreenPoint(point.x, point.y, routeScreenPointBuffer);
    const screenX = routeScreenPointBuffer.x;
    const screenY = routeScreenPointBuffer.y;
    const routeBand = point && point.travelBand ? point.travelBand : 'normal';
    const bandStyle = game.systems.content.getRouteBandDefinition(routeBand);
    const showStroke = options.showStroke !== false;
    const showNumber = options.showNumber === true;

    if (!rectContainsPoint(getScreenViewportBounds(), screenX, screenY + tileHeight / 2)) {
        return false;
    }

    game.ctx.save();
    game.ctx.translate(screenX, screenY);
    game.ctx.beginPath();
    game.ctx.moveTo(0, 0);
    game.ctx.lineTo(tileWidth / 2, tileHeight / 2);
    game.ctx.lineTo(0, tileHeight);
    game.ctx.lineTo(-tileWidth / 2, tileHeight / 2);
    game.ctx.closePath();
    game.ctx.fillStyle = bandStyle.fillStyle || game.colors.route;
    game.ctx.fill();

    if (showStroke) {
        game.ctx.lineWidth = 2;
        game.ctx.strokeStyle = bandStyle.strokeStyle || '#5b2c06';
        game.ctx.stroke();
    }

    if (showNumber && index > 0) {
        game.ctx.fillStyle = bandStyle.textStyle || '#000';
        game.ctx.font = '10px Arial';
        game.ctx.textAlign = 'center';
        game.ctx.textBaseline = 'middle';
        game.ctx.fillText(index.toString(), 0, 0);
    }

    game.ctx.restore();
    return true;
}

function drawRoute() {
    const game = window.Game;
    const route = Array.isArray(game.state.route) ? game.state.route : [];

    if (route.length === 0) {
        return;
    }

    const stride = getRouteRenderStride(route.length);
    const simplified = stride > 1;

    route.forEach((point, index) => {
        const isStart = index === 0;
        const isEnd = index === route.length - 1;
        const isSample = !simplified || isStart || isEnd || index % stride === 0;

        if (!isSample) {
            return;
        }

        const showStroke = !simplified || isEnd || index % (stride * 2) === 0;
        const showNumber = !simplified
            ? index > 0
            : (isEnd || (index > 0 && index % (stride * 2) === 0));

        drawRouteStep(point, index, {
            showStroke,
            showNumber
        });
    });
}

function drawSelectedWorldTile() {
    const game = window.Game;
    const selectedTile = game.state.selectedWorldTile;

    if (!selectedTile || !Number.isFinite(selectedTile.x) || !Number.isFinite(selectedTile.y)) {
        return;
    }

    const { tileWidth, tileHeight } = game.config;
    fillScreenPoint(selectedTile.x, selectedTile.y, selectedTileScreenPointBuffer);
    const screenX = selectedTileScreenPointBuffer.x;
    const screenY = selectedTileScreenPointBuffer.y;

    if (!rectContainsPoint(getScreenViewportBounds(), screenX, screenY + tileHeight / 2)) {
        return;
    }

    game.ctx.save();
    game.ctx.translate(screenX, screenY);
    game.ctx.beginPath();
    game.ctx.moveTo(0, 0);
    game.ctx.lineTo(tileWidth / 2, tileHeight / 2);
    game.ctx.lineTo(0, tileHeight);
    game.ctx.lineTo(-tileWidth / 2, tileHeight / 2);
    game.ctx.closePath();
    game.ctx.lineWidth = 3;
    game.ctx.strokeStyle = 'rgba(255, 255, 255, 0.96)';
    game.ctx.stroke();
    game.ctx.beginPath();
    game.ctx.moveTo(0, 2);
    game.ctx.lineTo(tileWidth / 2 - 2, tileHeight / 2);
    game.ctx.lineTo(0, tileHeight - 2);
    game.ctx.lineTo(-(tileWidth / 2 - 2), tileHeight / 2);
    game.ctx.closePath();
    game.ctx.lineWidth = 1;
    game.ctx.strokeStyle = 'rgba(36, 58, 78, 0.85)';
    game.ctx.stroke();
    game.ctx.restore();
}

function formatRouteCost(value) {
    return Number.isFinite(value) ? value.toFixed(1) : '0.0';
}

function getRouteChipAccent(route) {
    let highestBand = 'normal';

    route.forEach((step) => {
        const band = step && step.travelBand ? step.travelBand : 'normal';

        if (band === 'hazard') {
            highestBand = 'hazard';
        } else if (band === 'rough' && highestBand !== 'hazard') {
            highestBand = 'rough';
        } else if (band === 'cheap' && highestBand === 'normal') {
            highestBand = 'cheap';
        }
    });

    switch (highestBand) {
        case 'hazard':
            return {
                background: 'rgba(43, 17, 12, 0.92)',
                border: '#e07a4b',
                text: '#fff3ec'
            };
        case 'rough':
            return {
                background: 'rgba(39, 26, 12, 0.90)',
                border: '#d9a153',
                text: '#fff7ea'
            };
        case 'cheap':
            return {
                background: 'rgba(18, 34, 22, 0.88)',
                border: '#7bc48b',
                text: '#eefbf1'
            };
        default:
            return {
                background: 'rgba(23, 20, 18, 0.88)',
                border: '#d4c0a1',
                text: '#fff8ef'
            };
    }
}

function drawRoundedRect(context, x, y, width, height, radius) {
    const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));

    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.lineTo(x + width - safeRadius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
    context.lineTo(x + width, y + height - safeRadius);
    context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
    context.lineTo(x + safeRadius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
    context.lineTo(x, y + safeRadius);
    context.quadraticCurveTo(x, y, x + safeRadius, y);
    context.closePath();
}

function getRouteChipLabel() {
    const game = window.Game;
    const visibleLength = game.state.route.length;
    const previewLength = Math.max(visibleLength, game.state.routePreviewLength || 0);
    const visibleCost = formatRouteCost(game.state.routeTotalCost);
    const previewCost = formatRouteCost(Math.max(game.state.routeTotalCost, game.state.routePreviewTotalCost || 0));

    if (previewLength > visibleLength) {
        return `${visibleLength}/${previewLength} кл · ${visibleCost}/${previewCost}`;
    }

    return `${visibleLength} кл · ${visibleCost}`;
}

function drawRouteTargetChip() {
    const game = window.Game;
    const route = game.state.route;

    if (!route || route.length === 0) {
        return;
    }

    const { tileHeight } = game.config;
    const target = route[route.length - 1];
    const label = getRouteChipLabel();
    const palette = getRouteChipAccent(route);
    fillScreenPoint(target.x, target.y, routeTargetScreenPointBuffer);
    const targetScreenX = routeTargetScreenPointBuffer.x;
    const targetScreenY = routeTargetScreenPointBuffer.y;

    game.ctx.save();
    game.ctx.font = '600 12px Arial';
    game.ctx.textAlign = 'center';
    game.ctx.textBaseline = 'middle';

    const paddingX = 10;
    const chipHeight = 24;
    const pointerSize = 6;
    const chipWidth = Math.ceil(game.ctx.measureText(label).width) + paddingX * 2;
    const chipX = Math.max(10, Math.min(targetScreenX - chipWidth / 2, game.canvas.width - chipWidth - 10));
    const chipY = Math.max(10, Math.min(targetScreenY - tileHeight * 0.95 - chipHeight, game.canvas.height - chipHeight - 18));
    const pointerX = Math.max(chipX + 10, Math.min(targetScreenX, chipX + chipWidth - 10));

    drawRoundedRect(game.ctx, chipX, chipY, chipWidth, chipHeight, 11);
    game.ctx.fillStyle = palette.background;
    game.ctx.fill();
    game.ctx.lineWidth = 1.5;
    game.ctx.strokeStyle = palette.border;
    game.ctx.stroke();

    game.ctx.beginPath();
    game.ctx.moveTo(pointerX - pointerSize, chipY + chipHeight - 1);
    game.ctx.lineTo(pointerX + pointerSize, chipY + chipHeight - 1);
    game.ctx.lineTo(targetScreenX, targetScreenY - tileHeight * 0.2);
    game.ctx.closePath();
    game.ctx.fillStyle = palette.background;
    game.ctx.fill();
    game.ctx.strokeStyle = palette.border;
    game.ctx.stroke();

    game.ctx.fillStyle = palette.text;
    game.ctx.fillText(label, chipX + chipWidth / 2, chipY + chipHeight / 2 + 0.5);
    game.ctx.restore();
}

function hasOverlayContent() {
    const game = window.Game;
    const effects = game.systems.effects || null;
    const now = effects && typeof effects.getNow === 'function'
        ? effects.getNow()
        : null;
    const activeEffects = effects && typeof effects.getActiveEffects === 'function'
        ? effects.getActiveEffects(now || undefined)
        : [];

    return Boolean(
        (Array.isArray(game.state.route) && game.state.route.length > 0)
        || game.state.selectedWorldTile
        || activeEffects.length > 0
    );
}

function drawWorldEntities(playerPos, focusChunkX, focusChunkY, activeHouse = null) {
    const game = window.Game;
    const activeHouseId = activeHouse ? activeHouse.id : null;
    const playerDepth = playerPos.x + playerPos.y + 0.35;
    const interiorHouses = game.systems.houses.collectVisibleInteriorHouses(focusChunkX, focusChunkY, activeHouseId);
    const exteriorHouses = game.systems.houses.collectVisibleExteriorHouses(focusChunkX, focusChunkY, activeHouseId);
    const lowerInteractions = game.systems.interactionRenderer.collectVisibleInteractions(focusChunkX, focusChunkY, {
        activeHouseId,
        maxDepthInclusive: playerDepth
    });
    const upperInteractions = game.systems.interactionRenderer.collectVisibleInteractions(focusChunkX, focusChunkY, {
        activeHouseId,
        minDepthExclusive: playerDepth
    });
    const perf = game.systems.perf || null;

    if (perf && typeof perf.incrementFrameStat === 'function') {
        perf.incrementFrameStat('housePartsDrawn', interiorHouses.length);
        perf.incrementFrameStat('housePartsDrawn', exteriorHouses.length);
        perf.incrementFrameStat('housePartsDrawn', exteriorHouses.length);
        perf.incrementFrameStat('interactionsDrawn', lowerInteractions.length + upperInteractions.length);
    }

    game.systems.houses.drawInteriorHouseList(interiorHouses);
    game.systems.houses.drawExteriorHouseSouthList(exteriorHouses);
    game.systems.interactionRenderer.drawInteractionList(lowerInteractions);
    game.systems.playerRenderer.drawPlayer(playerPos);
    game.systems.interactionRenderer.drawInteractionList(upperInteractions);
    game.systems.houses.drawExteriorHouseNorthList(exteriorHouses);
}

function drawWorldOverlays() {
    const game = window.Game;

    if (!hasOverlayContent()) {
        return;
    }

    if (Array.isArray(game.state.route) && game.state.route.length > 0) {
        drawRoute();
    }

    if (game.state.selectedWorldTile) {
        drawSelectedWorldTile();
    }

    if (Array.isArray(game.state.route) && game.state.route.length > 0) {
        drawRouteTargetChip();
    }

    if (game.systems.effectRenderer) {
        game.systems.effectRenderer.drawEffects();
    }
}

function drawSceneEntities(playerPos, focusChunkX, focusChunkY, activeHouse = null) {
    const game = window.Game;
    const perf = game.systems.perf || null;

    const draw = () => {
        drawWorldEntities(playerPos, focusChunkX, focusChunkY, activeHouse);
        drawWorldOverlays();
    };

    if (perf && typeof perf.measure === 'function') {
        return perf.measure('drawSceneEntities', draw);
    }

    return draw();
}

window.Game.systems.entityRenderer = {
    drawRoute,
    drawSelectedWorldTile,
    drawWorldEntities,
    drawWorldOverlays,
    hasOverlayContent,
    drawSceneEntities
};
