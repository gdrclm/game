function updateDebugPanel(playerPos, activeHouse, activeInteraction) {
    const game = window.Game;

    if (!game.debug.enabled) {
        return;
    }

    const debugElement = game.debug.element || document.getElementById('debugPanel');
    if (!debugElement) {
        return;
    }

    const chunkX = Math.floor(playerPos.x / game.config.chunkSize);
    const chunkY = Math.floor(playerPos.y / game.config.chunkSize);
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
        `Gold: ${game.state.gold}`,
        `Route length: ${game.state.route.length}`,
        `Route cost: ${Number.isFinite(game.state.routeTotalCost) ? game.state.routeTotalCost.toFixed(2) : '0.00'}`,
        `Loaded chunks: ${game.state.loadedChunkCount}`,
        `Camera: ${game.camera.offset.x.toFixed(1)}, ${game.camera.offset.y.toFixed(1)}`,
        `Step progress: ${game.state.stepProgress.toFixed(2)}`
    ].join('\n');
}

window.Game.systems.debugRenderer = {
    updateDebugPanel
};
