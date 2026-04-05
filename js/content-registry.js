function drawDiamondPath(context, tileWidth, tileHeight) {
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(tileWidth / 2, tileHeight / 2);
    context.lineTo(0, tileHeight);
    context.lineTo(-tileWidth / 2, tileHeight / 2);
    context.closePath();
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

function getTilePalette(game, tileType, progression) {
    const moodFactor = getIslandMoodFactor(progression);

    if (tileType === 'grass' || tileType === 'house' || tileType === 'unloaded') {
        return {
            base: `rgb(${mixChannel(151, 40, moodFactor)}, ${mixChannel(252, 58, moodFactor)}, ${mixChannel(151, 54, moodFactor)})`,
            detail: `rgb(${mixChannel(76, 20, moodFactor)}, ${mixChannel(175, 82, moodFactor)}, ${mixChannel(80, 66, moodFactor)})`
        };
    }

    if (tileType === 'trail') {
        return {
            base: `rgb(${mixChannel(206, 112, moodFactor)}, ${mixChannel(182, 108, moodFactor)}, ${mixChannel(120, 96, moodFactor)})`,
            detail: `rgb(${mixChannel(166, 88, moodFactor)}, ${mixChannel(132, 80, moodFactor)}, ${mixChannel(78, 70, moodFactor)})`
        };
    }

    if (tileType === 'shore') {
        return {
            base: `rgb(${mixChannel(213, 84, moodFactor)}, ${mixChannel(196, 96, moodFactor)}, ${mixChannel(138, 90, moodFactor)})`,
            detail: `rgb(${mixChannel(182, 60, moodFactor)}, ${mixChannel(159, 74, moodFactor)}, ${mixChannel(97, 66, moodFactor)})`
        };
    }

    if (tileType === 'water') {
        return {
            base: `rgb(${mixChannel(91, 33, moodFactor)}, ${mixChannel(192, 78, moodFactor)}, ${mixChannel(222, 96, moodFactor)})`,
            detail: `rgba(${mixChannel(255, 118, moodFactor)}, ${mixChannel(255, 158, moodFactor)}, ${mixChannel(255, 172, moodFactor)}, ${clamp(0.2 - moodFactor * 0.06, 0.1, 0.2).toFixed(3)})`
        };
    }

    if (tileType === 'rock') {
        return {
            base: `rgb(${mixChannel(139, 52, moodFactor)}, ${mixChannel(69, 62, moodFactor)}, ${mixChannel(19, 60, moodFactor)})`,
            detail: `rgb(${mixChannel(93, 32, moodFactor)}, ${mixChannel(41, 40, moodFactor)}, ${mixChannel(6, 39, moodFactor)})`
        };
    }

    if (tileType === 'bridge') {
        return {
            base: `rgb(${mixChannel(93, 70, moodFactor)}, ${mixChannel(41, 58, moodFactor)}, ${mixChannel(6, 44, moodFactor)})`,
            detail: `rgb(${mixChannel(160, 120, moodFactor)}, ${mixChannel(82, 98, moodFactor)}, ${mixChannel(45, 76, moodFactor)})`
        };
    }

    if (tileType === 'reeds') {
        return {
            base: `rgb(${mixChannel(126, 54, moodFactor)}, ${mixChannel(156, 82, moodFactor)}, ${mixChannel(96, 64, moodFactor)})`,
            detail: `rgb(${mixChannel(82, 32, moodFactor)}, ${mixChannel(102, 54, moodFactor)}, ${mixChannel(52, 42, moodFactor)})`
        };
    }

    if (tileType === 'rubble') {
        return {
            base: `rgb(${mixChannel(152, 90, moodFactor)}, ${mixChannel(136, 90, moodFactor)}, ${mixChannel(122, 86, moodFactor)})`,
            detail: `rgb(${mixChannel(104, 68, moodFactor)}, ${mixChannel(98, 70, moodFactor)}, ${mixChannel(92, 68, moodFactor)})`
        };
    }

    if (tileType === 'mud') {
        return {
            base: `rgb(${mixChannel(129, 74, moodFactor)}, ${mixChannel(108, 72, moodFactor)}, ${mixChannel(76, 68, moodFactor)})`,
            detail: `rgb(${mixChannel(88, 48, moodFactor)}, ${mixChannel(74, 48, moodFactor)}, ${mixChannel(48, 46, moodFactor)})`
        };
    }

    return {
        base: game.colors.grass,
        detail: '#4CAF50'
    };
}

const tileDetailAssetUrls = Object.freeze({
    grass: 'assets/tiles/grass-detail.svg',
    trail: 'assets/tiles/trail-detail.svg',
    water: 'assets/tiles/water-detail.svg',
    shore: 'assets/tiles/shore-detail.svg',
    rock: 'assets/tiles/rock-detail.svg',
    bridge: 'assets/tiles/bridge-detail.svg',
    reeds: 'assets/tiles/reeds-detail.svg',
    rubble: 'assets/tiles/rubble-detail.svg',
    mud: 'assets/tiles/mud-detail.svg'
});

const tileDetailAssets = new Map();
const tileDetailTintCache = new Map();
let tileDetailRenderQueued = false;

function queueSceneRender() {
    if (tileDetailRenderQueued) {
        return;
    }

    tileDetailRenderQueued = true;

    window.requestAnimationFrame(() => {
        tileDetailRenderQueued = false;
        const game = window.Game;

        if (game && game.systems && game.systems.render && typeof game.systems.render.render === 'function') {
            game.systems.render.render();
        }
    });
}

function ensureTileDetailAsset(assetKey) {
    if (!tileDetailAssetUrls[assetKey]) {
        return null;
    }

    let assetState = tileDetailAssets.get(assetKey);

    if (!assetState) {
        const image = new Image();
        assetState = {
            image,
            loaded: false,
            failed: false
        };

        image.decoding = 'async';
        image.addEventListener('load', () => {
            assetState.loaded = true;
            queueSceneRender();
        });
        image.addEventListener('error', () => {
            assetState.failed = true;
        });
        image.src = tileDetailAssetUrls[assetKey];
        tileDetailAssets.set(assetKey, assetState);
    }

    if (assetState.failed || !assetState.loaded) {
        return null;
    }

    return assetState.image;
}

function getTintedTileDetail(assetKey, detailColor, tileWidth, tileHeight) {
    const sourceImage = ensureTileDetailAsset(assetKey);

    if (!sourceImage) {
        return null;
    }

    const cacheKey = `${assetKey}|${detailColor}|${tileWidth}x${tileHeight}`;
    const cached = tileDetailTintCache.get(cacheKey);

    if (cached) {
        return cached;
    }

    const tintedCanvas = document.createElement('canvas');
    tintedCanvas.width = tileWidth;
    tintedCanvas.height = tileHeight;
    const tintedContext = tintedCanvas.getContext('2d');

    tintedContext.clearRect(0, 0, tileWidth, tileHeight);
    tintedContext.drawImage(sourceImage, 0, 0, tileWidth, tileHeight);
    tintedContext.globalCompositeOperation = 'source-in';
    tintedContext.fillStyle = detailColor;
    tintedContext.fillRect(0, 0, tileWidth, tileHeight);
    tintedContext.globalCompositeOperation = 'source-over';

    tileDetailTintCache.set(cacheKey, tintedCanvas);
    return tintedCanvas;
}

function drawPatternTile(context, game, palette, assetKey) {
    const { tileWidth, tileHeight } = game.config;

    context.fillStyle = palette.base;
    context.fill();

    const detailPattern = getTintedTileDetail(assetKey, palette.detail, tileWidth, tileHeight);

    if (!detailPattern) {
        return;
    }

    context.drawImage(detailPattern, -tileWidth / 2, 0, tileWidth, tileHeight);
}

function drawGrassTile(context, game, x, y, palette) {
    drawPatternTile(context, game, palette, 'grass');
}

function drawTrailTile(context, game, x, y, palette) {
    drawPatternTile(context, game, palette, 'trail');
}

function drawWaterTile(context, game, x, y, palette) {
    drawPatternTile(context, game, palette, 'water');
}

function drawShoreTile(context, game, x, y, palette) {
    drawPatternTile(context, game, palette, 'shore');
}

function drawRockTile(context, game, x, y, palette) {
    drawPatternTile(context, game, palette, 'rock');
}

function drawBridgeTile(context, game, x, y, palette) {
    drawPatternTile(context, game, palette, 'bridge');
}

function drawReedsTile(context, game, x, y, palette) {
    drawPatternTile(context, game, palette, 'reeds');
}

function drawRubbleTile(context, game, x, y, palette) {
    drawPatternTile(context, game, palette, 'rubble');
}

function drawMudTile(context, game, x, y, palette) {
    drawPatternTile(context, game, palette, 'mud');
}

Object.keys(tileDetailAssetUrls).forEach((assetKey) => {
    ensureTileDetailAsset(assetKey);
});

const tileRegistry = {
    trail: {
        key: 'trail',
        label: 'тропа',
        passable: true,
        ground: true,
        movementFactor: 0.72,
        routeBand: 'cheap',
        draw: drawTrailTile
    },
    grass: {
        key: 'grass',
        label: 'трава',
        passable: true,
        ground: true,
        movementFactor: 1,
        routeBand: 'normal',
        draw: drawGrassTile
    },
    water: {
        key: 'water',
        label: 'вода',
        passable: false,
        ground: false,
        movementFactor: Infinity,
        routeBand: 'blocked',
        draw: drawWaterTile
    },
    shore: {
        key: 'shore',
        label: 'берег',
        passable: true,
        ground: true,
        movementFactor: 1.12,
        routeBand: 'normal',
        draw: drawShoreTile
    },
    rock: {
        key: 'rock',
        label: 'камни',
        passable: false,
        ground: false,
        movementFactor: Infinity,
        routeBand: 'blocked',
        draw: drawRockTile
    },
    bridge: {
        key: 'bridge',
        label: 'мост',
        passable: true,
        ground: false,
        movementFactor: 0.84,
        routeBand: 'cheap',
        draw: drawBridgeTile
    },
    reeds: {
        key: 'reeds',
        label: 'тростник',
        passable: true,
        ground: true,
        movementFactor: 1.35,
        routeBand: 'rough',
        draw: drawReedsTile
    },
    rubble: {
        key: 'rubble',
        label: 'осыпь',
        passable: true,
        ground: true,
        movementFactor: 1.7,
        routeBand: 'rough',
        draw: drawRubbleTile
    },
    mud: {
        key: 'mud',
        label: 'грязь',
        passable: true,
        ground: true,
        movementFactor: 2.2,
        routeBand: 'hazard',
        draw: drawMudTile
    },
    house: {
        key: 'house',
        label: 'дом',
        passable: true,
        ground: false,
        movementFactor: 1,
        routeBand: 'normal',
        draw: drawGrassTile
    },
    unloaded: {
        key: 'unloaded',
        label: 'не загружено',
        passable: false,
        ground: false,
        movementFactor: Infinity,
        routeBand: 'blocked',
        draw: drawGrassTile
    }
};

const routeBandRegistry = {
    cheap: {
        key: 'cheap',
        label: 'легкий ход',
        fillStyle: 'rgba(98, 190, 118, 0.58)',
        strokeStyle: 'rgba(31, 88, 42, 0.92)',
        textStyle: '#12331a'
    },
    normal: {
        key: 'normal',
        label: 'обычный ход',
        fillStyle: 'rgba(255, 170, 62, 0.52)',
        strokeStyle: 'rgba(122, 74, 18, 0.9)',
        textStyle: '#2e1a07'
    },
    rough: {
        key: 'rough',
        label: 'тяжелый ход',
        fillStyle: 'rgba(228, 123, 64, 0.58)',
        strokeStyle: 'rgba(134, 64, 28, 0.92)',
        textStyle: '#3d1706'
    },
    hazard: {
        key: 'hazard',
        label: 'опасный ход',
        fillStyle: 'rgba(204, 77, 61, 0.62)',
        strokeStyle: 'rgba(112, 24, 18, 0.94)',
        textStyle: '#3a0804'
    },
    blocked: {
        key: 'blocked',
        label: 'непроходимо',
        fillStyle: 'rgba(72, 72, 72, 0.55)',
        strokeStyle: 'rgba(28, 28, 28, 0.92)',
        textStyle: '#111'
    }
};

const travelZoneRegistry = {
    none: {
        key: 'none',
        label: '',
        movementFactor: 1,
        routeBand: 'normal',
        overlayFillStyle: null,
        markerText: ''
    },
    dryTrail: {
        key: 'dryTrail',
        label: 'сухая тропа',
        movementFactor: 0.88,
        routeBand: 'cheap',
        overlayFillStyle: 'rgba(224, 210, 128, 0.22)',
        markerText: ''
    },
    oldBridge: {
        key: 'oldBridge',
        label: 'старый мост',
        movementFactor: 1.7,
        routeBand: 'rough',
        overlayFillStyle: 'rgba(186, 132, 88, 0.26)',
        markerText: '!'
    },
    collapseSpan: {
        key: 'collapseSpan',
        label: 'хрупкий пролет',
        movementFactor: 2.75,
        routeBand: 'hazard',
        overlayFillStyle: 'rgba(196, 76, 58, 0.3)',
        markerText: '!'
    },
    coldFord: {
        key: 'coldFord',
        label: 'холодный брод',
        movementFactor: 1.85,
        routeBand: 'hazard',
        overlayFillStyle: 'rgba(92, 150, 198, 0.24)',
        markerText: '~'
    },
    drainingLowland: {
        key: 'drainingLowland',
        label: 'истощающая низина',
        movementFactor: 1.42,
        routeBand: 'rough',
        overlayFillStyle: 'rgba(94, 114, 158, 0.22)',
        markerText: 'v'
    },
    badSector: {
        key: 'badSector',
        label: 'плохой сектор',
        movementFactor: 1.35,
        routeBand: 'rough',
        overlayFillStyle: 'rgba(162, 84, 74, 0.2)',
        markerText: ''
    },
    cursedTrail: {
        key: 'cursedTrail',
        label: 'зараженная тропа',
        movementFactor: 2.05,
        routeBand: 'hazard',
        overlayFillStyle: 'rgba(122, 146, 86, 0.26)',
        markerText: 'x'
    },
    riskyProximity: {
        key: 'riskyProximity',
        label: 'риск рядом',
        movementFactor: 1.26,
        routeBand: 'rough',
        overlayFillStyle: 'rgba(188, 110, 92, 0.2)',
        markerText: ''
    },
    houseDebris: {
        key: 'houseDebris',
        label: 'завал у дома',
        movementFactor: 1.22,
        routeBand: 'rough',
        overlayFillStyle: 'rgba(180, 120, 94, 0.2)',
        markerText: ''
    },
    deepMud: {
        key: 'deepMud',
        label: 'глубокая грязь',
        movementFactor: 1.34,
        routeBand: 'hazard',
        overlayFillStyle: 'rgba(108, 82, 68, 0.24)',
        markerText: '·'
    },
    swamp: {
        key: 'swamp',
        label: 'болото',
        movementFactor: 1.3,
        routeBand: 'rough',
        overlayFillStyle: 'rgba(98, 140, 92, 0.2)',
        markerText: '~'
    },
    dangerPass: {
        key: 'dangerPass',
        label: 'опасный проход',
        movementFactor: 1.34,
        routeBand: 'rough',
        overlayFillStyle: 'rgba(192, 136, 72, 0.2)',
        markerText: ''
    },
    drainZone: {
        key: 'drainZone',
        label: 'зона истощения',
        movementFactor: 1.48,
        routeBand: 'hazard',
        overlayFillStyle: 'rgba(116, 106, 152, 0.24)',
        markerText: '!'
    }
};

function getTileDefinition(tileType) {
    return tileRegistry[tileType] || tileRegistry.grass;
}

function isPassableTile(tileType) {
    return getTileDefinition(tileType).passable;
}

function isGroundTile(tileType) {
    return Boolean(getTileDefinition(tileType).ground);
}

function getTileLabel(tileType) {
    return getTileDefinition(tileType).label || 'местность';
}

function getTileMovementFactor(tileType) {
    return getTileDefinition(tileType).movementFactor;
}

function getTileRouteBand(tileType) {
    return getTileDefinition(tileType).routeBand || 'normal';
}

function getRouteBandDefinition(routeBand) {
    return routeBandRegistry[routeBand] || routeBandRegistry.normal;
}

function getRouteBandLabel(routeBand) {
    return getRouteBandDefinition(routeBand).label;
}

function getTravelZoneDefinition(zoneKey) {
    return travelZoneRegistry[zoneKey] || travelZoneRegistry.none;
}

function getTravelZoneLabel(zoneKey) {
    return getTravelZoneDefinition(zoneKey).label;
}

function drawTileAtContext(context, screenX, screenY, tileType, worldX, worldY, progression = null) {
    const game = window.Game;
    const definition = getTileDefinition(tileType);
    const { tileWidth, tileHeight } = game.config;
    const palette = getTilePalette(game, tileType, progression);

    context.save();
    context.translate(screenX, screenY);
    drawDiamondPath(context, tileWidth, tileHeight);
    definition.draw(context, game, worldX, worldY, palette);
    context.strokeStyle = '#333';
    context.stroke();
    context.restore();
}

window.Game.systems.content = {
    tileRegistry,
    routeBandRegistry,
    travelZoneRegistry,
    getTileDefinition,
    isPassableTile,
    isGroundTile,
    getTileLabel,
    getTileMovementFactor,
    getTileRouteBand,
    getRouteBandDefinition,
    getRouteBandLabel,
    getTravelZoneDefinition,
    getTravelZoneLabel,
    drawTileAtContext
};
