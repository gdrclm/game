function drawRoute() {
    const game = window.Game;
    const { tileWidth, tileHeight } = game.config;
    const route = game.state.route;

    if (route.length === 0) {
        return;
    }

    route.forEach((point, index) => {
        const { x: screenX, y: screenY } = game.systems.camera.isoToScreen(point.x, point.y);
        const routeBand = point && point.travelBand ? point.travelBand : 'normal';
        const bandStyle = game.systems.content.getRouteBandDefinition(routeBand);

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
        game.ctx.lineWidth = 2;
        game.ctx.strokeStyle = bandStyle.strokeStyle || '#5b2c06';
        game.ctx.stroke();

        if (index > 0) {
            game.ctx.fillStyle = bandStyle.textStyle || '#000';
            game.ctx.font = '10px Arial';
            game.ctx.textAlign = 'center';
            game.ctx.textBaseline = 'middle';
            game.ctx.fillText(index.toString(), 0, 0);
        }

        game.ctx.restore();
    });
}

function drawSelectedWorldTile() {
    const game = window.Game;
    const selectedTile = game.state.selectedWorldTile;

    if (!selectedTile || !Number.isFinite(selectedTile.x) || !Number.isFinite(selectedTile.y)) {
        return;
    }

    const { tileWidth, tileHeight } = game.config;
    const { x: screenX, y: screenY } = game.systems.camera.isoToScreen(selectedTile.x, selectedTile.y);

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
    const targetScreen = game.systems.camera.isoToScreen(target.x, target.y);

    game.ctx.save();
    game.ctx.font = '600 12px Arial';
    game.ctx.textAlign = 'center';
    game.ctx.textBaseline = 'middle';

    const paddingX = 10;
    const chipHeight = 24;
    const pointerSize = 6;
    const chipWidth = Math.ceil(game.ctx.measureText(label).width) + paddingX * 2;
    const chipX = Math.max(10, Math.min(targetScreen.x - chipWidth / 2, game.canvas.width - chipWidth - 10));
    const chipY = Math.max(10, Math.min(targetScreen.y - tileHeight * 0.95 - chipHeight, game.canvas.height - chipHeight - 18));
    const pointerX = Math.max(chipX + 10, Math.min(targetScreen.x, chipX + chipWidth - 10));

    drawRoundedRect(game.ctx, chipX, chipY, chipWidth, chipHeight, 11);
    game.ctx.fillStyle = palette.background;
    game.ctx.fill();
    game.ctx.lineWidth = 1.5;
    game.ctx.strokeStyle = palette.border;
    game.ctx.stroke();

    game.ctx.beginPath();
    game.ctx.moveTo(pointerX - pointerSize, chipY + chipHeight - 1);
    game.ctx.lineTo(pointerX + pointerSize, chipY + chipHeight - 1);
    game.ctx.lineTo(targetScreen.x, targetScreen.y - tileHeight * 0.2);
    game.ctx.closePath();
    game.ctx.fillStyle = palette.background;
    game.ctx.fill();
    game.ctx.strokeStyle = palette.border;
    game.ctx.stroke();

    game.ctx.fillStyle = palette.text;
    game.ctx.fillText(label, chipX + chipWidth / 2, chipY + chipHeight / 2 + 0.5);
    game.ctx.restore();
}

function drawSceneEntities(playerPos, focusChunkX, focusChunkY, activeHouse = null) {
    const game = window.Game;
    const activeHouseId = activeHouse ? activeHouse.id : null;
    const playerDepth = playerPos.x + playerPos.y + 0.35;

    game.systems.houses.drawInteriorHouses(focusChunkX, focusChunkY, activeHouseId);
    game.systems.houses.drawExteriorHouseSouthParts(focusChunkX, focusChunkY, activeHouseId);
    game.systems.interactionRenderer.drawInteractions(focusChunkX, focusChunkY, {
        activeHouseId,
        maxDepthInclusive: playerDepth
    });
    game.systems.playerRenderer.drawPlayer(playerPos);
    game.systems.interactionRenderer.drawInteractions(focusChunkX, focusChunkY, {
        activeHouseId,
        minDepthExclusive: playerDepth
    });
    game.systems.houses.drawExteriorHouseNorthParts(focusChunkX, focusChunkY, activeHouseId);
    drawRoute();
    drawSelectedWorldTile();
    drawRouteTargetChip();

    if (game.systems.effectRenderer) {
        game.systems.effectRenderer.drawEffects();
    }
}

window.Game.systems.entityRenderer = {
    drawRoute,
    drawSelectedWorldTile,
    drawSceneEntities
};
