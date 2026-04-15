function buildResourceNodeSummary(focusChunkX, focusChunkY, activeHouseId = null) {
    const game = window.Game;
    const interactionRenderer = game.systems.interactionRenderer || null;
    const interactionsRuntime = game.systems.interactions || null;

    if (!interactionRenderer || typeof interactionRenderer.collectVisibleInteractions !== 'function') {
        return { total: 0, byResource: {}, nodes: [] };
    }

    const interactions = interactionRenderer.collectVisibleInteractions(focusChunkX, focusChunkY, {
        activeHouseId
    });
    const nodes = interactions.filter((interaction) => interaction && interaction.kind === 'resourceNode');
    const byResource = nodes.reduce((acc, node) => {
        const resourceId = node.resourceId || node.resourceNodeFamily || node.resourceNodeKind || 'resource';
        acc[resourceId] = (acc[resourceId] || 0) + 1;
        return acc;
    }, {});

    if (interactionsRuntime && typeof interactionsRuntime.syncResourceNodeInteractionState === 'function') {
        nodes.forEach((node) => interactionsRuntime.syncResourceNodeInteractionState(node));
    }

    return { total: nodes.length, byResource, nodes };
}

function buildCraftAvailabilitySummary() {
    const game = window.Game;
    const recipeRegistry = game.systems.recipeRegistry || null;
    const craftingRuntime = game.systems.craftingRuntime || null;
    const stationRuntime = game.systems.stationRuntime || null;

    if (!recipeRegistry || !craftingRuntime || typeof recipeRegistry.getActiveRecipeDefinitions !== 'function'
        || typeof craftingRuntime.evaluateRecipeAgainstInventory !== 'function') {
        return {
            total: 0,
            available: 0,
            missingIngredients: 0,
            wrongStation: 0,
            missingEnvironment: 0,
            unavailable: 0,
            stationLabels: []
        };
    }

    const availableStations = stationRuntime && typeof stationRuntime.resolveAvailableStations === 'function'
        ? stationRuntime.resolveAvailableStations({ activeInteraction: game.state.activeInteraction })
        : ['hand'];
    const stationLabels = stationRuntime && typeof stationRuntime.getStationLabel === 'function'
        ? availableStations.map((stationId) => stationRuntime.getStationLabel(stationId))
        : availableStations;
    const recipeDefinitions = recipeRegistry.getActiveRecipeDefinitions();
    const summary = {
        total: recipeDefinitions.length,
        available: 0,
        missingIngredients: 0,
        wrongStation: 0,
        missingEnvironment: 0,
        unavailable: 0,
        stationLabels
    };

    recipeDefinitions.forEach((recipe) => {
        const evaluation = craftingRuntime.evaluateRecipeAgainstInventory(recipe.recipeId, {
            availableStations,
            scanNearbyEnvironment: true
        });

        if (evaluation && evaluation.success) {
            summary.available += 1;
            return;
        }

        if (!evaluation) {
            summary.unavailable += 1;
            return;
        }

        if (evaluation.reason === 'missing-ingredients') {
            summary.missingIngredients += 1;
        } else if (evaluation.reason === 'wrong-station') {
            summary.wrongStation += 1;
        } else if (evaluation.reason === 'missing-environment') {
            summary.missingEnvironment += 1;
        } else {
            summary.unavailable += 1;
        }
    });

    return summary;
}

function updateDebugPanel(playerPos, activeHouse, activeInteraction, focusChunkX = null, focusChunkY = null) {
    const game = window.Game;

    if (!game.debug.enabled) {
        return;
    }

    const debugElement = game.debug.element || document.getElementById('debugPanel');
    if (!debugElement) {
        return;
    }

    const chunkX = Number.isFinite(focusChunkX) ? focusChunkX : Math.floor(playerPos.x / game.config.chunkSize);
    const chunkY = Number.isFinite(focusChunkY) ? focusChunkY : Math.floor(playerPos.y / game.config.chunkSize);
    const progression = game.state.activeTileInfo && game.state.activeTileInfo.progression
        ? game.state.activeTileInfo.progression
        : null;
    const timeOfDay = game.systems.render && typeof game.systems.render.getTimeOfDayDefinition === 'function'
        ? game.systems.render.getTimeOfDayDefinition()
        : null;
    const weatherRuntime = game.systems.weatherRuntime || null;
    const rewardScaling = game.systems.rewardScaling || null;
    const weatherLabel = weatherRuntime && typeof weatherRuntime.getWeatherLabel === 'function'
        ? weatherRuntime.getWeatherLabel(game.state.activeTileInfo)
        : 'Ясно';
    const islandPressureSummary = rewardScaling && typeof rewardScaling.getIslandPressureSummary === 'function'
        ? rewardScaling.getIslandPressureSummary(game.state.activeTileInfo)
        : 'Нагрузка острова 0/5';

    const resourceSummary = buildResourceNodeSummary(chunkX, chunkY, activeHouse ? activeHouse.id : null);
    const craftSummary = buildCraftAvailabilitySummary();
    const resourceList = Object.entries(resourceSummary.byResource)
        .map(([resourceId, count]) => `${resourceId}:${count}`)
        .join(', ');
    const craftIssues = [
        craftSummary.missingIngredients ? `ingredients:${craftSummary.missingIngredients}` : null,
        craftSummary.wrongStation ? `station:${craftSummary.wrongStation}` : null,
        craftSummary.missingEnvironment ? `env:${craftSummary.missingEnvironment}` : null
    ].filter(Boolean).join(' ');

    debugElement.textContent = [
        'Debug',
        `Seed: ${game.config.worldSeed}`,
        `Player: ${playerPos.x.toFixed(2)}, ${playerPos.y.toFixed(2)}`,
        `Chunk: ${chunkX}, ${chunkY}`,
        `Island: ${progression ? progression.islandIndex : 1}/${window.Game.systems.expedition.finalIslandIndex}`,
        `Time: ${timeOfDay ? timeOfDay.label : 'n/a'}`,
        `Weather: ${weatherLabel}`,
        `Pressure: ${islandPressureSummary}`,
        `Theme: ${progression ? progression.archetype : 'normal'}`,
        `House: ${activeHouse ? activeHouse.id : 'outside'}`,
        `Interaction: ${activeInteraction ? activeInteraction.kind : 'none'}`,
        `Resource nodes: ${resourceSummary.total}${resourceList ? ` (${resourceList})` : ''}`,
        `Craft: ${craftSummary.available}/${craftSummary.total} avail @ ${craftSummary.stationLabels.join(', ') || 'hand'}${craftIssues ? ` | ${craftIssues}` : ''}`,
        `Gold: ${game.state.gold}`,
        `Route length: ${game.state.route.length}`,
        `Route cost: ${Number.isFinite(game.state.routeTotalCost) ? game.state.routeTotalCost.toFixed(2) : '0.00'}`,
        `Loaded chunks: ${game.state.loadedChunkCount}`,
        `Camera: ${game.camera.offset.x.toFixed(1)}, ${game.camera.offset.y.toFixed(1)}`,
        `Step progress: ${game.state.stepProgress.toFixed(2)}`
    ].join('\n');
}

function drawResourceNodeOverlays(resourceNodes = []) {
    const game = window.Game;
    const ctx = game.ctx;
    const camera = game.systems.camera;
    const { tileWidth, tileHeight } = game.config;
    const viewportPadding = tileWidth * 2;
    const viewLeft = -viewportPadding;
    const viewTop = -viewportPadding;
    const viewRight = game.canvas.width + viewportPadding;
    const viewBottom = game.canvas.height + viewportPadding;

    const resourceColors = {
        grass: '#5bd472',
        reeds: '#7dcc6a',
        stone: '#c2c7cd',
        rubble: '#b7926a',
        wood: '#9b6c3f',
        water: '#4da8ff',
        fish: '#4bb3c4',
        resourceNode: '#9aa4b2'
    };
    const stateAlpha = {
        fresh: 0.6,
        used: 0.35,
        regenerating: 0.25,
        depleted: 0.12
    };

    resourceNodes.forEach((node) => {
        if (!node || !camera || typeof camera.isoToScreenTo !== 'function') {
            return;
        }

        const screenPoint = camera.isoToScreenTo(node.worldX, node.worldY, { x: 0, y: 0 });
        const screenX = screenPoint.x;
        const screenY = screenPoint.y;

        if (screenX < viewLeft || screenX > viewRight || screenY < viewTop || screenY > viewBottom) {
            return;
        }

        const resourceId = node.resourceId || node.resourceNodeFamily || node.resourceNodeKind || 'resourceNode';
        const baseColor = resourceColors[resourceId] || resourceColors.resourceNode;
        const alpha = stateAlpha[node.nodeState] || 0.45;
        const size = Math.max(4, Math.floor(tileWidth * 0.12));

        ctx.save();
        ctx.translate(screenX, screenY + tileHeight * 0.08);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    });
}

function drawCraftAvailabilityChip(summary) {
    const game = window.Game;
    const ctx = game.ctx;
    const text = `Craft ${summary.available}/${summary.total}`;
    const padding = 8;
    const fontSize = 12;
    const x = 16;
    const y = 16;

    ctx.save();
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';
    const textWidth = ctx.measureText(text).width;
    const boxWidth = textWidth + padding * 2;
    const boxHeight = fontSize + padding * 2;
    ctx.fillStyle = 'rgba(10, 16, 24, 0.72)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.strokeRect(x + 0.5, y + 0.5, boxWidth - 1, boxHeight - 1);
    ctx.fillStyle = summary.available > 0 ? '#9ef0a8' : '#f5c542';
    ctx.fillText(text, x + padding, y + padding);
    ctx.restore();
}

function drawDebugOverlay(focusChunkX, focusChunkY, activeHouseId = null) {
    const game = window.Game;

    if (!game.debug.enabled) {
        return;
    }

    const resourceSummary = buildResourceNodeSummary(focusChunkX, focusChunkY, activeHouseId);
    drawResourceNodeOverlays(resourceSummary.nodes);
    drawCraftAvailabilityChip(buildCraftAvailabilitySummary());
}

window.Game.systems.debugRenderer = {
    updateDebugPanel,
    drawDebugOverlay
};
