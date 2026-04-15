function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function mixChannel(from, to, amount) {
    return Math.round(from + (to - from) * amount);
}

const TIME_OF_DAY_CYCLE = [
    {
        key: 'dawn',
        label: 'Рассвет',
        skyTop: [204, 210, 214],
        skyMid: [188, 196, 200],
        skyBottom: [164, 174, 178],
        worldTint: 'rgba(218, 226, 224, 0.10)',
        fogTopTint: 'rgba(238, 244, 242, 0.30)',
        fogBottomTint: 'rgba(212, 220, 218, 0.18)',
        darknessTint: 'rgba(82, 90, 94, 0.06)'
    },
    {
        key: 'morning',
        label: 'Утро',
        skyTop: [210, 227, 196],
        skyMid: [188, 216, 182],
        skyBottom: [162, 201, 166],
        worldTint: 'rgba(255, 244, 220, 0.03)',
        darknessTint: null
    },
    {
        key: 'day',
        label: 'День',
        skyTop: [219, 241, 188],
        skyMid: [194, 234, 155],
        skyBottom: [167, 223, 124],
        worldTint: null,
        darknessTint: null
    },
    {
        key: 'evening',
        label: 'Вечер',
        skyTop: [190, 172, 156],
        skyMid: [160, 138, 126],
        skyBottom: [118, 96, 90],
        worldTint: 'rgba(122, 98, 88, 0.08)',
        darknessTint: 'rgba(30, 24, 28, 0.16)'
    },
    {
        key: 'sunset',
        label: 'Закат',
        skyTop: [230, 146, 96],
        skyMid: [196, 94, 62],
        skyBottom: [126, 54, 40],
        worldTint: 'rgba(242, 126, 58, 0.18)',
        darknessTint: 'rgba(36, 20, 18, 0.20)'
    },
    {
        key: 'night',
        label: 'Ночь',
        skyTop: [66, 110, 198],
        skyMid: [30, 62, 146],
        skyBottom: [8, 18, 60],
        worldTint: 'rgba(12, 44, 110, 0.30)',
        darknessTint: 'rgba(2, 8, 22, 0.28)'
    }
];
const TIME_OF_DAY_TRANSITION_MS = 900;
let timeOfDayTransition = null;

function getNow() {
    return typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
}

function parseColorStringToChannels(color) {
    if (!color || typeof color !== 'string') {
        return [0, 0, 0, 0];
    }

    const normalizedColor = color.replace(/\s+/g, '');
    const match = normalizedColor.match(/^rgba?\((\d+),(\d+),(\d+)(?:,([0-9.]+))?\)$/i);
    if (!match) {
        return [0, 0, 0, 0];
    }

    return [
        clamp(Number(match[1]), 0, 255),
        clamp(Number(match[2]), 0, 255),
        clamp(Number(match[3]), 0, 255),
        clamp(match[4] === undefined ? 1 : Number(match[4]), 0, 1)
    ];
}

function formatColorChannels(channels) {
    return `rgba(${Math.round(channels[0])}, ${Math.round(channels[1])}, ${Math.round(channels[2])}, ${channels[3].toFixed(3)})`;
}

function amplifyColorChannels(channels, alphaMultiplier = 1) {
    if (!Array.isArray(channels) || channels.length < 4) {
        return [0, 0, 0, 0];
    }

    return [
        channels[0],
        channels[1],
        channels[2],
        clamp(channels[3] * alphaMultiplier, 0, 1)
    ];
}

function hasVisibleColor(channels) {
    return Array.isArray(channels) && Number.isFinite(channels[3]) && channels[3] > 0.001;
}

function mixColorChannels(from, to, amount) {
    return [
        mixChannel(from[0], to[0], amount),
        mixChannel(from[1], to[1], amount),
        mixChannel(from[2], to[2], amount),
        from[3] + (to[3] - from[3]) * amount
    ];
}

function cloneTimeOfDayPalette(definition) {
    const source = definition || TIME_OF_DAY_CYCLE[0];
    return {
        skyTop: Array.isArray(source.skyTop) ? source.skyTop.slice(0, 3) : [0, 0, 0],
        skyMid: Array.isArray(source.skyMid) ? source.skyMid.slice(0, 3) : [0, 0, 0],
        skyBottom: Array.isArray(source.skyBottom) ? source.skyBottom.slice(0, 3) : [0, 0, 0],
        worldTint: parseColorStringToChannels(source.worldTint),
        fogTopTint: parseColorStringToChannels(source.fogTopTint),
        fogBottomTint: parseColorStringToChannels(source.fogBottomTint),
        darknessTint: parseColorStringToChannels(source.darknessTint)
    };
}

function mixTimeOfDayPalette(from, to, amount) {
    return {
        skyTop: [
            mixChannel(from.skyTop[0], to.skyTop[0], amount),
            mixChannel(from.skyTop[1], to.skyTop[1], amount),
            mixChannel(from.skyTop[2], to.skyTop[2], amount)
        ],
        skyMid: [
            mixChannel(from.skyMid[0], to.skyMid[0], amount),
            mixChannel(from.skyMid[1], to.skyMid[1], amount),
            mixChannel(from.skyMid[2], to.skyMid[2], amount)
        ],
        skyBottom: [
            mixChannel(from.skyBottom[0], to.skyBottom[0], amount),
            mixChannel(from.skyBottom[1], to.skyBottom[1], amount),
            mixChannel(from.skyBottom[2], to.skyBottom[2], amount)
        ],
        worldTint: mixColorChannels(from.worldTint, to.worldTint, amount),
        fogTopTint: mixColorChannels(from.fogTopTint, to.fogTopTint, amount),
        fogBottomTint: mixColorChannels(from.fogBottomTint, to.fogBottomTint, amount),
        darknessTint: mixColorChannels(from.darknessTint, to.darknessTint, amount)
    };
}

function getRenderedTimeOfDayPalette(timestamp = getNow()) {
    if (!timeOfDayTransition) {
        return cloneTimeOfDayPalette(getTimeOfDayDefinition());
    }

    const elapsed = timestamp - timeOfDayTransition.startedAt;
    const progress = clamp(elapsed / timeOfDayTransition.durationMs, 0, 1);

    if (progress >= 1) {
        timeOfDayTransition = null;
        return cloneTimeOfDayPalette(getTimeOfDayDefinition());
    }

    return mixTimeOfDayPalette(timeOfDayTransition.from, timeOfDayTransition.to, progress);
}

function isTimeOfDayTransitionActive(timestamp = getNow()) {
    if (!timeOfDayTransition) {
        return false;
    }

    if ((timestamp - timeOfDayTransition.startedAt) >= timeOfDayTransition.durationMs) {
        timeOfDayTransition = null;
        return false;
    }

    return true;
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

function getTimeOfDayIndex() {
    const state = window.Game.state || {};
    const cycleLength = TIME_OF_DAY_CYCLE.length;
    const rawIndex = typeof state.currentTimeOfDayIndex === 'number' ? state.currentTimeOfDayIndex : 0;

    return ((rawIndex % cycleLength) + cycleLength) % cycleLength;
}

function getTimeOfDayDefinition(index = getTimeOfDayIndex()) {
    return TIME_OF_DAY_CYCLE[index] || TIME_OF_DAY_CYCLE[0];
}

function advanceTimeOfDay(step = 1) {
    const cycleLength = TIME_OF_DAY_CYCLE.length;
    const currentIndex = getTimeOfDayIndex();
    const nextIndex = (currentIndex + step + cycleLength) % cycleLength;

    if (nextIndex === currentIndex) {
        return getTimeOfDayDefinition(nextIndex);
    }

    const transitionStart = getNow();
    const fromPalette = getRenderedTimeOfDayPalette(transitionStart);

    window.Game.state.currentTimeOfDayIndex = nextIndex;
    timeOfDayTransition = {
        from: fromPalette,
        to: cloneTimeOfDayPalette(getTimeOfDayDefinition(nextIndex)),
        startedAt: transitionStart,
        durationMs: TIME_OF_DAY_TRANSITION_MS
    };
    requestRender({
        playerPos: window.Game.state.playerPos
    });

    return getTimeOfDayDefinition(nextIndex);
}

function mixTimeColor(channelValues, targets, moodFactor) {
    return `rgb(${mixChannel(channelValues[0], targets[0], moodFactor)}, ${mixChannel(channelValues[1], targets[1], moodFactor)}, ${mixChannel(channelValues[2], targets[2], moodFactor)})`;
}

function drawIslandBackdrop(progression, timestamp = getNow()) {
    const game = window.Game;
    const moodFactor = getIslandMoodFactor(progression);
    const timeOfDay = getRenderedTimeOfDayPalette(timestamp);
    const gradient = game.ctx.createLinearGradient(0, 0, 0, game.canvas.height);

    gradient.addColorStop(
        0,
        mixTimeColor(timeOfDay.skyTop, [56, 78, 74], moodFactor)
    );
    gradient.addColorStop(
        0.55,
        mixTimeColor(timeOfDay.skyMid, [42, 62, 58], moodFactor)
    );
    gradient.addColorStop(
        1,
        mixTimeColor(timeOfDay.skyBottom, [28, 40, 38], moodFactor)
    );

    game.ctx.fillStyle = gradient;
    game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
}

function drawTimeOfDayOverlay(timestamp = getNow()) {
    const game = window.Game;
    const timeOfDay = getRenderedTimeOfDayPalette(timestamp);
    const worldTint = amplifyColorChannels(timeOfDay.worldTint, 1.22);
    const fogTopTint = amplifyColorChannels(timeOfDay.fogTopTint, 1.18);
    const fogBottomTint = amplifyColorChannels(timeOfDay.fogBottomTint, 1.18);
    const darknessTint = amplifyColorChannels(timeOfDay.darknessTint, 1.24);

    if (hasVisibleColor(worldTint)) {
        game.ctx.fillStyle = formatColorChannels(worldTint);
        game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    }

    if (hasVisibleColor(fogTopTint) || hasVisibleColor(fogBottomTint)) {
        const fogGradient = game.ctx.createLinearGradient(0, 0, 0, game.canvas.height);

        fogGradient.addColorStop(0, formatColorChannels(fogTopTint));
        fogGradient.addColorStop(
            0.45,
            formatColorChannels(hasVisibleColor(fogTopTint) ? fogTopTint : fogBottomTint)
        );
        fogGradient.addColorStop(1, formatColorChannels(fogBottomTint));
        game.ctx.fillStyle = fogGradient;
        game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    }

    if (hasVisibleColor(darknessTint)) {
        game.ctx.fillStyle = formatColorChannels(darknessTint);
        game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    }
}

function drawWeatherOverlay(progression) {
    const weatherRuntime = window.Game.systems.weatherRuntime || null;

    if (window.Game.state.activeHouse) {
        return;
    }

    if (!weatherRuntime || typeof weatherRuntime.drawCurrentWeatherOverlay !== 'function') {
        return;
    }

    weatherRuntime.drawCurrentWeatherOverlay(progression);
}

function rectsIntersect(first, second) {
    if (!first || !second) {
        return false;
    }

    return (
        first.x < (second.x + second.width)
        && (first.x + first.width) > second.x
        && first.y < (second.y + second.height)
        && (first.y + first.height) > second.y
    );
}

function createLayerState() {
    return {
        canvas: null,
        ctx: null,
        dirty: true,
        signature: ''
    };
}

const sceneLayers = {
    staticWorld: createLayerState(),
    dynamicEntities: createLayerState(),
    canvasOverlay: createLayerState(),
    combinedWorld: {
        canvas: null,
        ctx: null,
        signature: '',
        originX: 0,
        originY: 0,
        drawnChunkCount: 0,
        visibleSignature: ''
    }
};

function createLayerCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function ensureLayerCanvas(layer) {
    const game = window.Game;

    if (
        !layer.canvas
        || !layer.ctx
        || layer.canvas.width !== game.canvas.width
        || layer.canvas.height !== game.canvas.height
    ) {
        layer.canvas = createLayerCanvas(game.canvas.width, game.canvas.height);
        layer.ctx = layer.canvas.getContext('2d');
        layer.dirty = true;
        layer.signature = '';
        sceneLayers.combinedWorld.signature = '';
    }

    return layer;
}

function markSceneLayersDirty(options = {}) {
    const {
        world = false,
        entities = false,
        overlay = false,
        combinedWorld = false,
        all = false
    } = options;

    if (all || world) {
        sceneLayers.staticWorld.dirty = true;
        sceneLayers.staticWorld.signature = '';
    }

    if (all || entities) {
        sceneLayers.dynamicEntities.dirty = true;
        sceneLayers.dynamicEntities.signature = '';
    }

    if (all || overlay) {
        sceneLayers.canvasOverlay.dirty = true;
        sceneLayers.canvasOverlay.signature = '';
    }

    if (all || combinedWorld) {
        sceneLayers.combinedWorld.signature = '';
    }
}

function withRenderContext(context, callback) {
    const game = window.Game;
    const previousContext = game.ctx;
    game.ctx = context;

    try {
        return callback();
    } finally {
        game.ctx = previousContext;
    }
}

function getRenderZoom() {
    const game = window.Game;
    return game.systems.camera && typeof game.systems.camera.getZoom === 'function'
        ? game.systems.camera.getZoom()
        : 1;
}

function withZoomTransform(context, callback) {
    const game = window.Game;
    const zoom = getRenderZoom();

    if (Math.abs(zoom - 1) <= 0.001) {
        return callback();
    }

    const centerX = game.canvas.width / 2;
    const centerY = game.canvas.height / 2;

    context.save();
    context.translate(centerX, centerY);
    context.scale(zoom, zoom);
    context.translate(-centerX, -centerY);

    try {
        return callback();
    } finally {
        context.restore();
    }
}

function getChunkViewportBounds() {
    const game = window.Game;
    return {
        x: -game.canvas.width,
        y: -game.canvas.height,
        width: game.canvas.width * 3,
        height: game.canvas.height * 3
    };
}

function isChunkVisibleOnScreen(worldBounds) {
    if (!worldBounds) {
        return false;
    }

    const screenBounds = {
        x: worldBounds.x + window.Game.camera.offset.x,
        y: worldBounds.y + window.Game.camera.offset.y,
        width: worldBounds.width,
        height: worldBounds.height
    };

    return rectsIntersect(screenBounds, getChunkViewportBounds());
}

function collectVisibleChunkEntries(focusChunkX, focusChunkY) {
    const game = window.Game;
    const chunkRenderer = game.systems.chunkRenderer;
    const result = [];

    for (let chunkY = focusChunkY - game.config.viewDistance; chunkY <= focusChunkY + game.config.viewDistance; chunkY++) {
        for (let chunkX = focusChunkX - game.config.viewDistance; chunkX <= focusChunkX + game.config.viewDistance; chunkX++) {
            const chunk = game.state.loadedChunks[`${chunkX},${chunkY}`];

            if (!chunk) {
                continue;
            }

            const worldBounds = chunkRenderer.getChunkWorldBounds(chunk);

            if (!isChunkVisibleOnScreen(worldBounds)) {
                continue;
            }

            result.push({
                key: `${chunkX},${chunkY}`,
                chunk,
                worldBounds,
                renderSignature: chunkRenderer.getChunkRenderSignature(chunk)
            });
        }
    }

    return result.sort((left, right) => {
        if (left.chunk.y !== right.chunk.y) {
            return left.chunk.y - right.chunk.y;
        }

        return left.chunk.x - right.chunk.x;
    });
}

function buildVisibleChunkSignature(entries = []) {
    return entries.map((entry) => `${entry.key}:${entry.renderSignature}`).join('|');
}

function buildVisibleEntitySignature(focusChunkX, focusChunkY) {
    const game = window.Game;
    const result = [];

    for (let chunkY = focusChunkY - game.config.viewDistance; chunkY <= focusChunkY + game.config.viewDistance; chunkY++) {
        for (let chunkX = focusChunkX - game.config.viewDistance; chunkX <= focusChunkX + game.config.viewDistance; chunkX++) {
            const chunk = game.state.loadedChunks[`${chunkX},${chunkY}`];

            if (!chunk) {
                continue;
            }

            const worldBounds = game.systems.chunkRenderer.getChunkWorldBounds(chunk);

            if (!isChunkVisibleOnScreen(worldBounds)) {
                continue;
            }

            result.push([
                `${chunkX},${chunkY}`,
                Number(chunk.entityVersion || 0),
                Array.isArray(chunk.interactions) ? chunk.interactions.length : 0,
                Array.isArray(chunk.houses) ? chunk.houses.length : 0
            ].join(':'));
        }
    }

    return result.join('|');
}

function rebuildCombinedWorldCache(entries) {
    const chunkRenderer = window.Game.systems.chunkRenderer;

    if (!entries.length) {
        sceneLayers.combinedWorld.canvas = createLayerCanvas(1, 1);
        sceneLayers.combinedWorld.ctx = sceneLayers.combinedWorld.canvas.getContext('2d');
        sceneLayers.combinedWorld.originX = 0;
        sceneLayers.combinedWorld.originY = 0;
        sceneLayers.combinedWorld.drawnChunkCount = 0;
        return sceneLayers.combinedWorld;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    entries.forEach((entry) => {
        minX = Math.min(minX, entry.worldBounds.x);
        minY = Math.min(minY, entry.worldBounds.y);
        maxX = Math.max(maxX, entry.worldBounds.x + entry.worldBounds.width);
        maxY = Math.max(maxY, entry.worldBounds.y + entry.worldBounds.height);
    });

    const width = Math.max(1, Math.ceil(maxX - minX));
    const height = Math.max(1, Math.ceil(maxY - minY));
    const canvas = createLayerCanvas(width, height);
    const context = canvas.getContext('2d');

    entries.forEach((entry) => {
        chunkRenderer.drawChunkLayers(
            entry.chunk,
            context,
            entry.worldBounds.x - minX,
            entry.worldBounds.y - minY
        );
    });

    sceneLayers.combinedWorld.canvas = canvas;
    sceneLayers.combinedWorld.ctx = context;
    sceneLayers.combinedWorld.originX = minX;
    sceneLayers.combinedWorld.originY = minY;
    sceneLayers.combinedWorld.drawnChunkCount = entries.length;
    return sceneLayers.combinedWorld;
}

function ensureCombinedWorldCache(focusChunkX, focusChunkY) {
    const entries = collectVisibleChunkEntries(focusChunkX, focusChunkY);
    const visibleSignature = buildVisibleChunkSignature(entries);
    const signature = `${focusChunkX},${focusChunkY}|${visibleSignature}`;

    sceneLayers.combinedWorld.drawnChunkCount = entries.length;
    sceneLayers.combinedWorld.visibleSignature = visibleSignature;

    if (sceneLayers.combinedWorld.signature !== signature || !sceneLayers.combinedWorld.canvas) {
        rebuildCombinedWorldCache(entries);
        sceneLayers.combinedWorld.signature = signature;
        sceneLayers.staticWorld.dirty = true;
    }

    return sceneLayers.combinedWorld;
}

function getCameraSignature() {
    return [
        window.Game.camera.offset.x.toFixed(2),
        window.Game.camera.offset.y.toFixed(2),
        getRenderZoom().toFixed(3)
    ].join(':');
}

function buildPositionSignature(position) {
    if (!position) {
        return 'none';
    }

    return `${Number(position.x || 0).toFixed(2)},${Number(position.y || 0).toFixed(2)}`;
}

function buildRouteSignature() {
    const game = window.Game;
    const route = Array.isArray(game.state.route) ? game.state.route : [];

    if (!route.length) {
        return 'route:none';
    }

    const sampleStride = Math.max(1, Math.floor(route.length / 6));
    const samples = [];

    for (let index = 0; index < route.length; index += sampleStride) {
        const point = route[index];
        samples.push(`${index}:${point.x},${point.y}:${point.travelBand || 'normal'}`);
    }

    const lastPoint = route[route.length - 1];

    if (!samples.length || !samples[samples.length - 1].startsWith(`${route.length - 1}:`)) {
        samples.push(`${route.length - 1}:${lastPoint.x},${lastPoint.y}:${lastPoint.travelBand || 'normal'}`);
    }

    return [
        `route:${route.length}`,
        `cost:${Number(game.state.routeTotalCost || 0).toFixed(2)}`,
        `preview:${Number(game.state.routePreviewLength || 0)}`,
        `previewCost:${Number(game.state.routePreviewTotalCost || 0).toFixed(2)}`,
        samples.join('|')
    ].join('|');
}

function buildSelectionSignature() {
    const selectedTile = window.Game.state.selectedWorldTile;

    if (!selectedTile) {
        return 'selection:none';
    }

    return `selection:${selectedTile.x},${selectedTile.y}`;
}

function buildEffectsSignature(activeEffects = []) {
    if (!activeEffects.length) {
        return 'effects:none';
    }

    return activeEffects.map((effect) => [
        effect.type || 'effect',
        Number(effect.startTime || 0).toFixed(1),
        Number(effect.duration || 0).toFixed(1),
        effect.interaction ? `${effect.interaction.worldX},${effect.interaction.worldY}` : 'none'
    ].join(':')).join('|');
}

function getWeatherOverlayKey(progression) {
    const weatherRuntime = window.Game.systems.weatherRuntime || null;

    if (!weatherRuntime) {
        return 'clear';
    }

    const weather = progression && Number.isFinite(progression.islandIndex) && typeof weatherRuntime.getWeatherForIsland === 'function'
        ? weatherRuntime.getWeatherForIsland(progression.islandIndex)
        : (typeof weatherRuntime.getWeather === 'function'
            ? weatherRuntime.getWeather(window.Game.state.activeTileInfo || null)
            : null);
    return weather && weather.overlayKey ? weather.overlayKey : 'clear';
}

function hasAnimatedWeatherOverlay(progression) {
    return getWeatherOverlayKey(progression) !== 'clear';
}

function buildStaticWorldSignature(activeProgression, focusChunkX, focusChunkY, timestamp) {
    const timeSignature = isTimeOfDayTransitionActive(timestamp)
        ? `time:anim:${Math.round(timestamp / 16)}`
        : `time:${getTimeOfDayIndex()}`;

    return [
        `camera:${getCameraSignature()}`,
        `focus:${focusChunkX},${focusChunkY}`,
        `world:${sceneLayers.combinedWorld.signature}`,
        `island:${activeProgression && Number.isFinite(activeProgression.islandIndex) ? activeProgression.islandIndex : 0}`,
        timeSignature
    ].join('|');
}

function buildEntityLayerSignature(playerPos, focusChunkX, focusChunkY, activeHouse = null) {
    return [
        `camera:${getCameraSignature()}`,
        `player:${buildPositionSignature(playerPos)}`,
        `focus:${focusChunkX},${focusChunkY}`,
        `house:${activeHouse ? activeHouse.id : 'outside'}`,
        `world:${sceneLayers.combinedWorld.visibleSignature}`,
        `entities:${buildVisibleEntitySignature(focusChunkX, focusChunkY)}`,
        `activeInteraction:${window.Game.state.activeInteractionId || 'none'}`,
        `resolved:${Object.keys(window.Game.state.resolvedHouseIds || {}).length}`
    ].join('|');
}

function buildOverlayLayerSignature(activeProgression, activeEffects, timestamp) {
    const game = window.Game;
    const timeSignature = isTimeOfDayTransitionActive(timestamp)
        ? `time:anim:${Math.round(timestamp / 16)}`
        : `time:${getTimeOfDayIndex()}`;
    const weatherOverlayKey = getWeatherOverlayKey(activeProgression);
    const weatherSignature = hasAnimatedWeatherOverlay(activeProgression)
        ? `weather:${weatherOverlayKey}:${Math.round(timestamp / 16)}`
        : `weather:${weatherOverlayKey}`;
    const effectsAnimationSignature = activeEffects && activeEffects.length > 0
        ? `effectsFrame:${Math.round(timestamp / 16)}`
        : 'effectsFrame:static';

    const debugSignature = game && game.debug && game.debug.enabled
        ? `debug:${Math.round(timestamp / 250)}`
        : 'debug:off';

    return [
        `camera:${getCameraSignature()}`,
        buildRouteSignature(),
        buildSelectionSignature(),
        buildEffectsSignature(activeEffects),
        effectsAnimationSignature,
        timeSignature,
        weatherSignature,
        debugSignature
    ].join('|');
}

function drawStaticWorldLayer(activeProgression, focusChunkX, focusChunkY, timestamp) {
    const game = window.Game;
    const perf = game.systems.perf || null;
    const layer = ensureLayerCanvas(sceneLayers.staticWorld);
    const combinedWorld = ensureCombinedWorldCache(focusChunkX, focusChunkY);
    const signature = buildStaticWorldSignature(activeProgression, focusChunkX, focusChunkY, timestamp);

    if (!layer.dirty && layer.signature === signature) {
        return false;
    }

    const draw = () => {
        layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);

        withRenderContext(layer.ctx, () => {
            drawIslandBackdrop(activeProgression, timestamp);
        });

        withZoomTransform(layer.ctx, () => {
            layer.ctx.drawImage(
                combinedWorld.canvas,
                combinedWorld.originX + game.camera.offset.x,
                combinedWorld.originY + game.camera.offset.y
            );
        });

        layer.signature = signature;
        layer.dirty = false;
        return true;
    };

    if (perf && typeof perf.measure === 'function') {
        return perf.measure('drawWorld', draw);
    }

    return draw();
}

function drawDynamicEntityLayer(playerPos, focusChunkX, focusChunkY, activeHouse) {
    const game = window.Game;
    const perf = game.systems.perf || null;
    const layer = ensureLayerCanvas(sceneLayers.dynamicEntities);
    const signature = buildEntityLayerSignature(playerPos, focusChunkX, focusChunkY, activeHouse);

    if (!layer.dirty && layer.signature === signature) {
        return false;
    }

    const draw = () => {
        layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);

        withRenderContext(layer.ctx, () => {
            withZoomTransform(layer.ctx, () => {
                game.systems.entityRenderer.drawWorldEntities(playerPos, focusChunkX, focusChunkY, activeHouse);
            });
        });

        layer.signature = signature;
        layer.dirty = false;
        return true;
    };

    if (perf && typeof perf.measure === 'function') {
        return perf.measure('drawSceneEntities', draw);
    }

    return draw();
}

function drawCanvasOverlayLayer(activeProgression, activeEffects, timestamp, focusChunkX, focusChunkY, activeHouse) {
    const game = window.Game;
    const layer = ensureLayerCanvas(sceneLayers.canvasOverlay);
    const signature = buildOverlayLayerSignature(activeProgression, activeEffects, timestamp);

    if (!layer.dirty && layer.signature === signature) {
        return false;
    }

    layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);

    withRenderContext(layer.ctx, () => {
        if (game.systems.entityRenderer && typeof game.systems.entityRenderer.hasOverlayContent === 'function'
            && game.systems.entityRenderer.hasOverlayContent()) {
            withZoomTransform(layer.ctx, () => {
                game.systems.entityRenderer.drawWorldOverlays();
            });
        }

        if (game.systems.debugRenderer && typeof game.systems.debugRenderer.drawDebugOverlay === 'function') {
            withZoomTransform(layer.ctx, () => {
                game.systems.debugRenderer.drawDebugOverlay(focusChunkX, focusChunkY, activeHouse ? activeHouse.id : null);
            });
        }

        drawTimeOfDayOverlay(timestamp);
        drawWeatherOverlay(activeProgression);
    });

    layer.signature = signature;
    layer.dirty = false;
    return true;
}

function compositeLayers() {
    const game = window.Game;

    game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
    game.ctx.drawImage(sceneLayers.staticWorld.canvas, 0, 0);
    game.ctx.drawImage(sceneLayers.dynamicEntities.canvas, 0, 0);
    game.ctx.drawImage(sceneLayers.canvasOverlay.canvas, 0, 0);
}

let renderRequestId = null;
let pendingRenderOptions = null;
let lastRenderOptions = null;
let cameraSettling = false;

function renderScene(playerPos, options = {}) {
    const game = window.Game;
    const perf = game.systems.perf || null;
    const {
        cameraFocusPos = playerPos,
        shouldUpdateCamera = false,
        timestamp = getNow(),
        activeEffects = []
    } = options;

    const draw = () => {
        const activeHouse = game.state.activeHouse;
        const activeInteraction = game.state.activeInteraction;
        const activeProgression = game.state.activeTileInfo && game.state.activeTileInfo.progression
            ? game.state.activeTileInfo.progression
            : null;

        if (shouldUpdateCamera) {
            game.systems.camera.updateCamera(cameraFocusPos);
            markSceneLayersDirty({
                world: true,
                entities: true,
                overlay: true
            });
        }

        const focusChunkX = Math.floor(cameraFocusPos.x / game.config.chunkSize);
        const focusChunkY = Math.floor(cameraFocusPos.y / game.config.chunkSize);
        const combinedWorld = ensureCombinedWorldCache(focusChunkX, focusChunkY);

        if (perf && typeof perf.setFrameStat === 'function') {
            perf.setFrameStat('drawnChunks', combinedWorld.drawnChunkCount);
        }

        drawStaticWorldLayer(activeProgression, focusChunkX, focusChunkY, timestamp);
        drawDynamicEntityLayer(playerPos, focusChunkX, focusChunkY, activeHouse);
        drawCanvasOverlayLayer(activeProgression, activeEffects, timestamp, focusChunkX, focusChunkY, activeHouse);
        compositeLayers();
        game.systems.debugRenderer.updateDebugPanel(playerPos, activeHouse, activeInteraction, focusChunkX, focusChunkY);
    };

    if (perf && typeof perf.measure === 'function') {
        return perf.measure('renderScene', draw);
    }

    return draw();
}

function resolveRenderOptions() {
    const game = window.Game;
    const options = pendingRenderOptions || lastRenderOptions || {
        playerPos: game.state.playerPos
    };
    const playerPos = options.playerPos || game.state.playerPos;

    return {
        playerPos,
        cameraFocusPos: options.cameraFocusPos || playerPos,
        shouldUpdateCamera: Boolean(options.shouldUpdateCamera),
        shouldRenderScene: options.shouldRenderScene !== false
    };
}

function queueNextFrame() {
    if (renderRequestId) {
        return;
    }

    renderRequestId = requestAnimationFrame(flushRender);
}

function flushRender(timestamp) {
    const game = window.Game;
    const effects = game.systems.effects || null;
    const perf = game.systems.perf || null;
    const ui = game.systems.ui || null;
    const resolvedOptions = resolveRenderOptions();
    const activeHouse = game.state.activeHouse;
    const activeInteraction = game.state.activeInteraction;
    const activeProgression = game.state.activeTileInfo && game.state.activeTileInfo.progression
        ? game.state.activeTileInfo.progression
        : null;
    const activeEffects = effects && typeof effects.pruneExpiredEffects === 'function'
        ? effects.pruneExpiredEffects(timestamp)
        : [];
    const shouldAnimateWeather = hasAnimatedWeatherOverlay(activeProgression);

    renderRequestId = null;
    pendingRenderOptions = null;
    lastRenderOptions = resolvedOptions;

    if (perf && typeof perf.recordFrame === 'function') {
        perf.recordFrame(timestamp);
    }

    try {
        if (resolvedOptions.shouldRenderScene) {
            renderScene(resolvedOptions.playerPos, {
                ...resolvedOptions,
                timestamp,
                activeEffects
            });
        }

        if (ui && typeof ui.refreshDirty === 'function') {
            ui.refreshDirty(resolvedOptions.playerPos, activeHouse, activeInteraction);
        }

        if (cameraSettling && game.systems.camera.isCameraSettled()) {
            game.camera.offset.x = game.camera.target.x;
            game.camera.offset.y = game.camera.target.y;
            cameraSettling = false;
            requestRender({
                playerPos: game.state.playerPos
            });
            return;
        }

        if (cameraSettling) {
            requestRender({
                playerPos: game.state.playerPos,
                cameraFocusPos: game.state.playerPos,
                shouldUpdateCamera: true
            });
            return;
        }

        if (activeEffects.length > 0 || isTimeOfDayTransitionActive(timestamp) || shouldAnimateWeather) {
            requestRender({
                playerPos: resolvedOptions.playerPos,
                cameraFocusPos: resolvedOptions.cameraFocusPos,
                shouldUpdateCamera: resolvedOptions.shouldUpdateCamera,
                shouldRenderScene: true
            });
        }
    } finally {
        if (perf && typeof perf.finishFrame === 'function') {
            perf.finishFrame();
        }

        if (perf && typeof perf.updatePanel === 'function') {
            perf.updatePanel();
        }
    }
}

function requestRender(options = {}) {
    const game = window.Game;
    const nextOptions = {
        playerPos: options.playerPos || game.state.playerPos,
        cameraFocusPos: options.cameraFocusPos || options.playerPos || game.state.playerPos,
        shouldUpdateCamera: Boolean(options.shouldUpdateCamera),
        shouldRenderScene: options.shouldRenderScene !== false
    };

    pendingRenderOptions = pendingRenderOptions
        ? {
            playerPos: nextOptions.playerPos,
            cameraFocusPos: nextOptions.cameraFocusPos,
            shouldUpdateCamera: pendingRenderOptions.shouldUpdateCamera || nextOptions.shouldUpdateCamera,
            shouldRenderScene: pendingRenderOptions.shouldRenderScene || nextOptions.shouldRenderScene
        }
        : nextOptions;

    queueNextFrame();
}

function hasPendingRender() {
    return Boolean(renderRequestId || pendingRenderOptions);
}

function render() {
    requestRender({
        playerPos: window.Game.state.playerPos
    });
}

function renderWithInterpolation(position) {
    requestRender({
        playerPos: position,
        cameraFocusPos: position,
        shouldUpdateCamera: true
    });
}

function stopCameraAnimation() {
    const game = window.Game;

    cameraSettling = false;
    game.systems.camera.stopCameraAnimation();

    if (renderRequestId) {
        cancelAnimationFrame(renderRequestId);
        renderRequestId = null;
    }

    pendingRenderOptions = null;
}

function settleCameraOnPlayer() {
    const game = window.Game;

    stopCameraAnimation();
    cameraSettling = true;
    requestRender({
        playerPos: game.state.playerPos,
        cameraFocusPos: game.state.playerPos,
        shouldUpdateCamera: true
    });
}

window.Game.systems.render = {
    render,
    renderWithInterpolation,
    requestRender,
    hasPendingRender,
    timeOfDayCycle: TIME_OF_DAY_CYCLE,
    getTimeOfDayDefinition,
    advanceTimeOfDay,
    isoToScreen: window.Game.systems.camera.isoToScreen,
    centerCameraOn: window.Game.systems.camera.centerCameraOn,
    settleCameraOnPlayer,
    stopCameraAnimation,
    markSceneLayersDirty
};
