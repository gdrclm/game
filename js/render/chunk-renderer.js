function createRenderCanvas(width, height) {
    const renderCanvas = document.createElement('canvas');
    renderCanvas.width = width;
    renderCanvas.height = height;
    return renderCanvas;
}

function drawOverlayDiamond(context, tileWidth, tileHeight, fillStyle) {
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(tileWidth / 2, tileHeight / 2);
    context.lineTo(0, tileHeight);
    context.lineTo(-tileWidth / 2, tileHeight / 2);
    context.closePath();
    context.fillStyle = fillStyle;
    context.fill();
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function mixChannel(from, to, amount) {
    return Math.round(from + (to - from) * amount);
}

function getIslandMoodFactor(progression) {
    if (!progression || typeof progression !== 'object') {
        return 0;
    }

    const expedition = window.Game.systems.expedition;
    const finalIslandIndex = expedition ? expedition.finalIslandIndex : 30;
    const stage = Math.max(0, progression.islandIndex - 1);
    const byIsland = clamp(stage / Math.max(1, finalIslandIndex - 1), 0, 1);
    return stage === 0 ? 0 : clamp(0.18 + Math.sqrt(byIsland) * 0.82, 0, 1);
}

function getIslandOverlayColor(chunk, tileType) {
    if (!chunk.progression) {
        return null;
    }

    const moodFactor = getIslandMoodFactor(chunk.progression);

    if (tileType === 'bridge') {
        return `rgba(${mixChannel(122, 92, moodFactor)}, ${mixChannel(84, 76, moodFactor)}, ${mixChannel(42, 58, moodFactor)}, ${(0.024 + moodFactor * 0.042).toFixed(3)})`;
    }

    if (tileType === 'shore') {
        return `rgba(${mixChannel(255, 172, moodFactor)}, ${mixChannel(243, 154, moodFactor)}, ${mixChannel(214, 134, moodFactor)}, ${(0.022 + moodFactor * 0.05).toFixed(3)})`;
    }

    if (tileType === 'trail') {
        return `rgba(${mixChannel(255, 188, moodFactor)}, ${mixChannel(216, 162, moodFactor)}, ${mixChannel(148, 124, moodFactor)}, ${(0.024 + moodFactor * 0.044).toFixed(3)})`;
    }

    if (tileType === 'water') {
        return `rgba(${mixChannel(210, 96, moodFactor)}, ${mixChannel(240, 128, moodFactor)}, ${mixChannel(255, 142, moodFactor)}, ${(0.024 + moodFactor * 0.05).toFixed(3)})`;
    }

    if (tileType === 'rock') {
        return `rgba(${mixChannel(176, 92, moodFactor)}, ${mixChannel(156, 98, moodFactor)}, ${mixChannel(132, 100, moodFactor)}, ${(0.024 + moodFactor * 0.042).toFixed(3)})`;
    }

    if (tileType === 'reeds') {
        return `rgba(${mixChannel(164, 84, moodFactor)}, ${mixChannel(194, 112, moodFactor)}, ${mixChannel(136, 94, moodFactor)}, ${(0.022 + moodFactor * 0.045).toFixed(3)})`;
    }

    if (tileType === 'rubble') {
        return `rgba(${mixChannel(198, 116, moodFactor)}, ${mixChannel(184, 118, moodFactor)}, ${mixChannel(170, 112, moodFactor)}, ${(0.026 + moodFactor * 0.04).toFixed(3)})`;
    }

    if (tileType === 'mud') {
        return `rgba(${mixChannel(160, 92, moodFactor)}, ${mixChannel(130, 90, moodFactor)}, ${mixChannel(98, 86, moodFactor)}, ${(0.028 + moodFactor * 0.048).toFixed(3)})`;
    }

    return `rgba(${mixChannel(255, 126, moodFactor)}, ${mixChannel(252, 142, moodFactor)}, ${mixChannel(218, 132, moodFactor)}, ${(0.022 + moodFactor * 0.046 + chunk.progression.grassTone * 0.032).toFixed(3)})`;
}

function drawTravelZoneOverlay(context, tileWidth, tileHeight, zoneDefinition) {
    if (!zoneDefinition || !zoneDefinition.overlayFillStyle) {
        return;
    }

    drawOverlayDiamond(context, tileWidth, tileHeight, zoneDefinition.overlayFillStyle);

    if (
        !zoneDefinition.markerText
        || (zoneDefinition.routeBand !== 'hazard' && zoneDefinition.key !== 'oldBridge')
    ) {
        return;
    }

    context.fillStyle = 'rgba(34, 24, 20, 0.8)';
    context.font = '10px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(zoneDefinition.markerText, 0, tileHeight / 2 - 2);
}

function isTerrainHarvested(worldX, worldY) {
    const state = window.Game.state;
    const harvested = state && state.harvestedTerrainKeys ? state.harvestedTerrainKeys : null;
    const resourceRegistry = window.Game.systems.resourceRegistry || null;
    const legacyTerrainGatherItemIds = resourceRegistry && typeof resourceRegistry.getLegacyTerrainGatherItemIds === 'function'
        ? resourceRegistry.getLegacyTerrainGatherItemIds()
        : ['rubbleChunk', 'lowlandGrass', 'fieldGrass'];

    if (!harvested) {
        return false;
    }

    return Boolean(
        harvested[`${worldX},${worldY}`]
        || harvested[`soilClod:${worldX},${worldY}`]
        || legacyTerrainGatherItemIds.some((itemId) => harvested[`${itemId}:${worldX},${worldY}`])
    );
}

function buildChunkRenderCache(chunk) {
    const game = window.Game;
    const { chunkSize, tileWidth, tileHeight } = game.config;
    const padding = 2;
    const originX = chunkSize * tileWidth / 2 + padding;
    const originY = padding;
    const canvas = createRenderCanvas(chunkSize * tileWidth + padding * 2, chunkSize * tileHeight + padding * 2);
    const context = canvas.getContext('2d');
    const baseWorldX = chunk.x * chunkSize;
    const baseWorldY = chunk.y * chunkSize;
    const tileTypeCache = new Map();

    function getBaseTileTypeAt(worldX, worldY) {
        const key = `${worldX},${worldY}`;

        if (tileTypeCache.has(key)) {
            return tileTypeCache.get(key);
        }

        const localX = worldX - baseWorldX;
        const localY = worldY - baseWorldY;
        let tileType = 'unloaded';

        if (localX >= 0 && localX < chunkSize && localY >= 0 && localY < chunkSize) {
            tileType = chunk.data[localY][localX];
        } else if (game.systems.world && typeof game.systems.world.getTileInfo === 'function') {
            const tileInfo = game.systems.world.getTileInfo(worldX, worldY, { generateIfMissing: false });
            tileType = tileInfo && tileInfo.baseTileType ? tileInfo.baseTileType : 'unloaded';
        }

        tileTypeCache.set(key, tileType);
        return tileType;
    }

    function buildTileRenderContext(worldX, worldY, tileType) {
        return {
            tileType,
            progression: chunk.progression || null,
            neighbors: {
                north: getBaseTileTypeAt(worldX, worldY - 1),
                east: getBaseTileTypeAt(worldX + 1, worldY),
                south: getBaseTileTypeAt(worldX, worldY + 1),
                west: getBaseTileTypeAt(worldX - 1, worldY),
                northwest: getBaseTileTypeAt(worldX - 1, worldY - 1),
                northeast: getBaseTileTypeAt(worldX + 1, worldY - 1),
                southeast: getBaseTileTypeAt(worldX + 1, worldY + 1),
                southwest: getBaseTileTypeAt(worldX - 1, worldY + 1)
            }
        };
    }

    for (let y = 0; y < chunkSize; y++) {
        for (let x = 0; x < chunkSize; x++) {
            const localScreenX = originX + (x - y) * tileWidth / 2;
            const localScreenY = originY + (x + y) * tileHeight / 2;
            const worldX = baseWorldX + x;
            const worldY = baseWorldY + y;
            const tileType = chunk.data[y][x];
            game.systems.content.drawTileAtContext(
                context,
                localScreenX,
                localScreenY,
                tileType,
                worldX,
                worldY,
                chunk.progression || null,
                buildTileRenderContext(worldX, worldY, tileType)
            );

            const overlay = getIslandOverlayColor(chunk, tileType);
            if (overlay) {
                context.save();
                context.translate(localScreenX, localScreenY);
                drawOverlayDiamond(context, tileWidth, tileHeight, overlay);
                context.restore();
            }

            let travelZoneKey = chunk.travelZones && chunk.travelZones[y]
                ? chunk.travelZones[y][x]
                : 'none';

            if (travelZoneKey === 'none' && tileType === 'bridge' && chunk.progression) {
                const bridgeInfo = {
                    x: worldX,
                    y: worldY,
                    tileType: 'bridge',
                    baseTileType: 'bridge',
                    progression: chunk.progression,
                    house: null,
                    travelZoneKey: 'none'
                };

                if (game.systems.expedition.isFragileBridgeTile(bridgeInfo)) {
                    travelZoneKey = 'collapseSpan';
                }
            }

            const travelZone = game.systems.content.getTravelZoneDefinition(travelZoneKey);
            if (travelZone && travelZoneKey !== 'none') {
                context.save();
                context.translate(localScreenX, localScreenY);
                drawTravelZoneOverlay(context, tileWidth, tileHeight, travelZone);
                context.restore();
            }

            if (isTerrainHarvested(worldX, worldY)) {
                context.save();
                context.translate(localScreenX, localScreenY);
                drawOverlayDiamond(context, tileWidth, tileHeight, 'rgba(0, 0, 0, 0.3)');
                context.restore();
            }
        }
    }

    chunk.renderCache = {
        canvas,
        originX,
        originY
    };
}

function drawChunk(chunk) {
    const chunkSize = window.Game.config.chunkSize;
    const startX = chunk.x * chunkSize;
    const startY = chunk.y * chunkSize;
    const cache = chunk.renderCache;
    const worldTop = window.Game.systems.camera.projectIso(startX, startY);

    if (!cache) {
        buildChunkRenderCache(chunk);
    }

    window.Game.ctx.drawImage(
        chunk.renderCache.canvas,
        worldTop.x + window.Game.camera.offset.x - chunk.renderCache.originX,
        worldTop.y + window.Game.camera.offset.y - chunk.renderCache.originY
    );
}

window.Game.systems.chunkRenderer = {
    createRenderCanvas,
    buildChunkRenderCache,
    drawChunk
};
