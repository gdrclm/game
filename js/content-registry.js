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

function mixRgb(from, to, amount) {
    return [
        mixChannel(from[0], to[0], amount),
        mixChannel(from[1], to[1], amount),
        mixChannel(from[2], to[2], amount)
    ];
}

function rgbToCss(rgb, alpha = 1) {
    if (!Array.isArray(rgb) || rgb.length < 3) {
        return alpha < 1 ? 'rgba(0, 0, 0, 0)' : 'rgb(0, 0, 0)';
    }

    return alpha < 1
        ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha.toFixed(3)})`
        : `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function shadeRgb(rgb, amount, target = amount >= 0 ? [255, 244, 214] : [0, 0, 0]) {
    return mixRgb(rgb, target, clamp(Math.abs(amount), 0, 1));
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

function buildTilePalette(baseRgb, detailRgb, accentRgb = detailRgb) {
    const base = Array.isArray(baseRgb) ? baseRgb : [96, 96, 96];
    const detail = Array.isArray(detailRgb) ? detailRgb : [42, 42, 42];
    const accent = Array.isArray(accentRgb) ? accentRgb : detail;
    const highlightRgb = shadeRgb(base, 0.14);
    const midRgb = shadeRgb(base, 0.06);
    const shadowRgb = shadeRgb(base, -0.16);
    const deepShadowRgb = shadeRgb(detail, -0.26);
    const outlineRgb = shadeRgb(mixRgb(detail, base, 0.35), -0.14);
    const accentShadowRgb = shadeRgb(accent, -0.12);
    const sparkRgb = shadeRgb(accent, 0.16);

    return {
        baseRgb: base,
        detailRgb: detail,
        accentRgb: accent,
        highlightRgb,
        midRgb,
        shadowRgb,
        deepShadowRgb,
        outlineRgb,
        accentShadowRgb,
        sparkRgb,
        base: rgbToCss(base),
        detail: rgbToCss(detail),
        accent: rgbToCss(accent),
        highlight: rgbToCss(highlightRgb),
        mid: rgbToCss(midRgb),
        shadow: rgbToCss(shadowRgb),
        deepShadow: rgbToCss(deepShadowRgb),
        outline: rgbToCss(outlineRgb),
        accentShadow: rgbToCss(accentShadowRgb),
        spark: rgbToCss(sparkRgb)
    };
}

function getTilePalette(game, tileType, progression) {
    const moodFactor = getIslandMoodFactor(progression);

    if (tileType === 'grass') {
        return buildTilePalette(
            [
                mixChannel(151, 40, moodFactor),
                mixChannel(252, 58, moodFactor),
                mixChannel(151, 54, moodFactor)
            ],
            [
                mixChannel(76, 20, moodFactor),
                mixChannel(175, 82, moodFactor),
                mixChannel(80, 66, moodFactor)
            ],
            [236, 231, 129]
        );
    }

    if (tileType === 'trail') {
        return buildTilePalette(
            [
                mixChannel(206, 112, moodFactor),
                mixChannel(182, 108, moodFactor),
                mixChannel(120, 96, moodFactor)
            ],
            [
                mixChannel(166, 88, moodFactor),
                mixChannel(132, 80, moodFactor),
                mixChannel(78, 70, moodFactor)
            ],
            [235, 201, 146]
        );
    }

    if (tileType === 'shore') {
        return buildTilePalette(
            [
                mixChannel(213, 84, moodFactor),
                mixChannel(196, 96, moodFactor),
                mixChannel(138, 90, moodFactor)
            ],
            [
                mixChannel(182, 60, moodFactor),
                mixChannel(159, 74, moodFactor),
                mixChannel(97, 66, moodFactor)
            ],
            [240, 210, 166]
        );
    }

    if (tileType === 'water') {
        return buildTilePalette(
            [
                mixChannel(91, 33, moodFactor),
                mixChannel(192, 78, moodFactor),
                mixChannel(222, 96, moodFactor)
            ],
            [
                mixChannel(32, 12, moodFactor),
                mixChannel(114, 34, moodFactor),
                mixChannel(176, 58, moodFactor)
            ],
            [225, 249, 255]
        );
    }

    if (tileType === 'rock') {
        return buildTilePalette(
            [
                mixChannel(139, 52, moodFactor),
                mixChannel(69, 62, moodFactor),
                mixChannel(19, 60, moodFactor)
            ],
            [
                mixChannel(93, 32, moodFactor),
                mixChannel(41, 40, moodFactor),
                mixChannel(6, 39, moodFactor)
            ],
            [216, 206, 176]
        );
    }

    if (tileType === 'bridge') {
        return buildTilePalette(
            [
                mixChannel(93, 70, moodFactor),
                mixChannel(41, 58, moodFactor),
                mixChannel(6, 44, moodFactor)
            ],
            [
                mixChannel(160, 120, moodFactor),
                mixChannel(82, 98, moodFactor),
                mixChannel(45, 76, moodFactor)
            ],
            [232, 191, 136]
        );
    }

    if (tileType === 'reeds') {
        return buildTilePalette(
            [
                mixChannel(126, 54, moodFactor),
                mixChannel(156, 82, moodFactor),
                mixChannel(96, 64, moodFactor)
            ],
            [
                mixChannel(82, 32, moodFactor),
                mixChannel(102, 54, moodFactor),
                mixChannel(52, 42, moodFactor)
            ],
            [244, 227, 139]
        );
    }

    if (tileType === 'rubble') {
        return buildTilePalette(
            [
                mixChannel(152, 90, moodFactor),
                mixChannel(136, 90, moodFactor),
                mixChannel(122, 86, moodFactor)
            ],
            [
                mixChannel(104, 68, moodFactor),
                mixChannel(98, 70, moodFactor),
                mixChannel(92, 68, moodFactor)
            ],
            [218, 196, 162]
        );
    }

    if (tileType === 'mud') {
        return buildTilePalette(
            [
                mixChannel(129, 74, moodFactor),
                mixChannel(108, 72, moodFactor),
                mixChannel(76, 68, moodFactor)
            ],
            [
                mixChannel(88, 48, moodFactor),
                mixChannel(74, 48, moodFactor),
                mixChannel(48, 46, moodFactor)
            ],
            [205, 171, 128]
        );
    }

    if (tileType === 'house') {
        return buildTilePalette(
            [
                mixChannel(168, 74, moodFactor),
                mixChannel(154, 86, moodFactor),
                mixChannel(126, 78, moodFactor)
            ],
            [
                mixChannel(102, 38, moodFactor),
                mixChannel(90, 48, moodFactor),
                mixChannel(70, 44, moodFactor)
            ],
            [242, 214, 174]
        );
    }

    if (tileType === 'unloaded') {
        return buildTilePalette(
            [
                mixChannel(108, 54, moodFactor),
                mixChannel(108, 54, moodFactor),
                mixChannel(118, 64, moodFactor)
            ],
            [
                mixChannel(58, 26, moodFactor),
                mixChannel(58, 28, moodFactor),
                mixChannel(66, 36, moodFactor)
            ],
            [183, 178, 184]
        );
    }

    return buildTilePalette([151, 252, 151], [76, 175, 80], [236, 231, 129]);
}

function hashTileSeed(tileType, worldX, worldY) {
    const key = `${tileType}:${worldX}:${worldY}`;
    let hash = 0;

    for (let index = 0; index < key.length; index += 1) {
        hash = ((hash << 5) - hash) + key.charCodeAt(index);
        hash |= 0;
    }

    return Math.abs(hash);
}

function seededUnit(seed, salt = 0) {
    const value = Math.sin((seed + 1) * 12.9898 + salt * 78.233) * 43758.5453;
    return value - Math.floor(value);
}

function withDiamondClip(context, game, drawFn) {
    const { tileWidth, tileHeight } = game.config;
    context.save();
    drawDiamondPath(context, tileWidth, tileHeight);
    context.clip();
    drawFn();
    context.restore();
}

function fillDiamondShape(context, game, fillStyle) {
    const { tileWidth, tileHeight } = game.config;
    drawDiamondPath(context, tileWidth, tileHeight);
    context.fillStyle = fillStyle;
    context.fill();
}

function strokeDiamondShape(context, game, strokeStyle, lineWidth = 1.2) {
    const { tileWidth, tileHeight } = game.config;
    drawDiamondPath(context, tileWidth, tileHeight);
    context.lineWidth = lineWidth;
    context.strokeStyle = strokeStyle;
    context.stroke();
}

function makeVerticalGradient(context, y0, y1, stops) {
    const gradient = context.createLinearGradient(0, y0, 0, y1);
    stops.forEach((stop) => {
        gradient.addColorStop(stop.offset, stop.color);
    });
    return gradient;
}

function lerpPoint(from, to, amount) {
    return {
        x: from.x + (to.x - from.x) * amount,
        y: from.y + (to.y - from.y) * amount
    };
}

function getDiamondPoints(tileWidth, tileHeight) {
    return {
        top: { x: 0, y: 0 },
        right: { x: tileWidth / 2, y: tileHeight / 2 },
        bottom: { x: 0, y: tileHeight },
        left: { x: -tileWidth / 2, y: tileHeight / 2 },
        center: { x: 0, y: tileHeight / 2 }
    };
}

function getTileMaterialFamily(tileType) {
    if (tileType === 'water') {
        return 'water';
    }

    if (tileType === 'unloaded') {
        return 'void';
    }

    if (tileType === 'grass') {
        return 'meadow';
    }

    if (tileType === 'reeds') {
        return 'wetGrowth';
    }

    if (tileType === 'trail' || tileType === 'shore' || tileType === 'mud') {
        return 'earth';
    }

    if (tileType === 'rock' || tileType === 'rubble') {
        return 'mineral';
    }

    if (tileType === 'bridge' || tileType === 'house') {
        return 'structure';
    }

    return 'misc';
}

function isSoftBlendFamily(family) {
    return family === 'meadow'
        || family === 'wetGrowth'
        || family === 'earth'
        || family === 'mineral';
}

function getEdgeSideKey(direction) {
    if (direction === 'north') {
        return 'topRight';
    }

    if (direction === 'east') {
        return 'bottomRight';
    }

    if (direction === 'south') {
        return 'bottomLeft';
    }

    return 'topLeft';
}

function getCornerKey(direction) {
    if (direction === 'northwest') {
        return 'top';
    }

    if (direction === 'northeast') {
        return 'right';
    }

    if (direction === 'southeast') {
        return 'bottom';
    }

    return 'left';
}

function buildEdgeGeometry(tileWidth, tileHeight, sideKey, inset = 0.23) {
    const points = getDiamondPoints(tileWidth, tileHeight);
    const edgePointMap = {
        topLeft: [points.top, points.left],
        topRight: [points.top, points.right],
        bottomRight: [points.right, points.bottom],
        bottomLeft: [points.left, points.bottom]
    };
    const [start, end] = edgePointMap[sideKey] || edgePointMap.topLeft;
    const innerStart = lerpPoint(start, points.center, inset);
    const innerEnd = lerpPoint(end, points.center, inset);

    return {
        start,
        end,
        innerStart,
        innerEnd,
        outerMid: {
            x: (start.x + end.x) / 2,
            y: (start.y + end.y) / 2
        },
        innerMid: {
            x: (innerStart.x + innerEnd.x) / 2,
            y: (innerStart.y + innerEnd.y) / 2
        }
    };
}

function buildCornerGeometry(tileWidth, tileHeight, cornerKey, span = 0.46, inset = 0.18) {
    const points = getDiamondPoints(tileWidth, tileHeight);

    if (cornerKey === 'top') {
        const sideA = lerpPoint(points.top, points.left, span);
        const sideB = lerpPoint(points.top, points.right, span);
        return {
            vertex: points.top,
            sideA,
            sideB,
            inner: lerpPoint(points.top, points.center, inset)
        };
    }

    if (cornerKey === 'right') {
        const sideA = lerpPoint(points.right, points.top, span);
        const sideB = lerpPoint(points.right, points.bottom, span);
        return {
            vertex: points.right,
            sideA,
            sideB,
            inner: lerpPoint(points.right, points.center, inset)
        };
    }

    if (cornerKey === 'bottom') {
        const sideA = lerpPoint(points.bottom, points.right, span);
        const sideB = lerpPoint(points.bottom, points.left, span);
        return {
            vertex: points.bottom,
            sideA,
            sideB,
            inner: lerpPoint(points.bottom, points.center, inset)
        };
    }

    const sideA = lerpPoint(points.left, points.top, span);
    const sideB = lerpPoint(points.left, points.bottom, span);
    return {
        vertex: points.left,
        sideA,
        sideB,
        inner: lerpPoint(points.left, points.center, inset)
    };
}

function getEdgeBlendStrength(tileType, neighborTileType) {
    if (!neighborTileType || neighborTileType === tileType) {
        return 0;
    }

    if (neighborTileType === 'unloaded') {
        return tileType === 'water' ? 0.1 : 0.06;
    }

    if (tileType === 'water') {
        return 0.38;
    }

    if (neighborTileType === 'water') {
        return 0.44;
    }

    const tileFamily = getTileMaterialFamily(tileType);
    const neighborFamily = getTileMaterialFamily(neighborTileType);

    if (tileFamily === neighborFamily) {
        return 0.14;
    }

    if (isSoftBlendFamily(tileFamily) && isSoftBlendFamily(neighborFamily)) {
        return 0.26;
    }

    if (
        (tileFamily === 'structure' && isSoftBlendFamily(neighborFamily))
        || (neighborFamily === 'structure' && isSoftBlendFamily(tileFamily))
    ) {
        return 0.18;
    }

    return 0.1;
}

function getTransitionMode(tileType, neighborTileType) {
    if (neighborTileType === 'unloaded') {
        return 'void';
    }

    if (tileType === 'water') {
        return 'waterInner';
    }

    if (neighborTileType === 'water') {
        return 'shoreEdge';
    }

    const tileFamily = getTileMaterialFamily(tileType);
    const neighborFamily = getTileMaterialFamily(neighborTileType);

    if (tileFamily === 'structure' || neighborFamily === 'structure') {
        return 'structure';
    }

    if (tileFamily === neighborFamily) {
        return 'soft';
    }

    return 'mixed';
}

function buildTransitionStops(currentPalette, neighborPalette, mode, strength) {
    const softenedStrength = clamp(strength, 0, 0.55);

    if (mode === 'shoreEdge') {
        return {
            outer: rgbToCss(mixRgb(currentPalette.shadowRgb, neighborPalette.baseRgb, 0.42), 0.24 + softenedStrength * 0.22),
            middle: rgbToCss(mixRgb(currentPalette.baseRgb, neighborPalette.highlightRgb, 0.5), 0.11 + softenedStrength * 0.1),
            inner: rgbToCss(mixRgb(currentPalette.highlightRgb, neighborPalette.highlightRgb, 0.34), 0),
            line: rgbToCss(mixRgb(currentPalette.sparkRgb, neighborPalette.sparkRgb, 0.4), 0.1 + softenedStrength * 0.1)
        };
    }

    if (mode === 'waterInner') {
        return {
            outer: rgbToCss(mixRgb(currentPalette.baseRgb, neighborPalette.highlightRgb, 0.48), 0.18 + softenedStrength * 0.18),
            middle: rgbToCss(mixRgb(currentPalette.highlightRgb, neighborPalette.highlightRgb, 0.58), 0.08 + softenedStrength * 0.08),
            inner: rgbToCss(mixRgb(currentPalette.sparkRgb, neighborPalette.highlightRgb, 0.48), 0),
            line: rgbToCss(mixRgb(currentPalette.sparkRgb, neighborPalette.sparkRgb, 0.52), 0.08 + softenedStrength * 0.08)
        };
    }

    if (mode === 'void') {
        return {
            outer: rgbToCss(mixRgb(currentPalette.shadowRgb, [26, 28, 36], 0.55), 0.08 + softenedStrength * 0.12),
            middle: rgbToCss(mixRgb(currentPalette.deepShadowRgb, [40, 44, 54], 0.42), 0.02 + softenedStrength * 0.04),
            inner: rgbToCss(currentPalette.baseRgb, 0),
            line: rgbToCss(currentPalette.deepShadowRgb, 0.05 + softenedStrength * 0.04)
        };
    }

    if (mode === 'structure') {
        return {
            outer: rgbToCss(mixRgb(currentPalette.baseRgb, neighborPalette.baseRgb, 0.52), 0.12 + softenedStrength * 0.1),
            middle: rgbToCss(mixRgb(currentPalette.highlightRgb, neighborPalette.highlightRgb, 0.45), 0.04 + softenedStrength * 0.05),
            inner: rgbToCss(currentPalette.highlightRgb, 0),
            line: rgbToCss(currentPalette.accentShadowRgb, 0.06 + softenedStrength * 0.05)
        };
    }

    if (mode === 'soft') {
        return {
            outer: rgbToCss(mixRgb(currentPalette.baseRgb, neighborPalette.baseRgb, 0.54), 0.12 + softenedStrength * 0.08),
            middle: rgbToCss(mixRgb(currentPalette.highlightRgb, neighborPalette.highlightRgb, 0.38), 0.03 + softenedStrength * 0.04),
            inner: rgbToCss(currentPalette.highlightRgb, 0),
            line: rgbToCss(currentPalette.detailRgb, 0.04 + softenedStrength * 0.03)
        };
    }

    return {
        outer: rgbToCss(mixRgb(currentPalette.baseRgb, neighborPalette.baseRgb, 0.58), 0.16 + softenedStrength * 0.12),
        middle: rgbToCss(mixRgb(currentPalette.highlightRgb, neighborPalette.highlightRgb, 0.44), 0.05 + softenedStrength * 0.05),
        inner: rgbToCss(currentPalette.highlightRgb, 0),
        line: rgbToCss(mixRgb(currentPalette.detailRgb, neighborPalette.detailRgb, 0.5), 0.05 + softenedStrength * 0.04)
    };
}

function drawEdgeBlend(context, game, sideKey, stops, strength, inset = 0.23) {
    const { tileWidth, tileHeight } = game.config;
    const edge = buildEdgeGeometry(tileWidth, tileHeight, sideKey, inset);
    const gradient = context.createLinearGradient(edge.outerMid.x, edge.outerMid.y, edge.innerMid.x, edge.innerMid.y);

    gradient.addColorStop(0, stops.outer);
    gradient.addColorStop(0.58, stops.middle);
    gradient.addColorStop(1, stops.inner);

    context.beginPath();
    context.moveTo(edge.start.x, edge.start.y);
    context.lineTo(edge.end.x, edge.end.y);
    context.lineTo(edge.innerEnd.x, edge.innerEnd.y);
    context.lineTo(edge.innerStart.x, edge.innerStart.y);
    context.closePath();
    context.fillStyle = gradient;
    context.fill();

    if (!stops.line) {
        return;
    }

    context.save();
    context.globalAlpha = 0.72;
    context.beginPath();
    context.moveTo(
        edge.start.x + (edge.innerStart.x - edge.start.x) * 0.18,
        edge.start.y + (edge.innerStart.y - edge.start.y) * 0.18
    );
    context.lineTo(
        edge.end.x + (edge.innerEnd.x - edge.end.x) * 0.18,
        edge.end.y + (edge.innerEnd.y - edge.end.y) * 0.18
    );
    context.strokeStyle = stops.line;
    context.lineWidth = 0.8 + strength * 0.55;
    context.stroke();
    context.restore();
}

function selectCornerBlendTile(tileType, neighborA, neighborB, diagonal) {
    const neighbors = [neighborA, neighborB, diagonal].filter(Boolean);
    if (neighbors.length === 0) {
        return null;
    }

    if (neighbors.filter((neighborTileType) => neighborTileType === 'water').length >= 2) {
        return 'water';
    }

    if (neighborA === neighborB && neighborA !== tileType) {
        return neighborA;
    }

    if (diagonal && diagonal !== tileType && (diagonal === neighborA || diagonal === neighborB)) {
        return diagonal;
    }

    return null;
}

function drawCornerBlend(context, game, cornerKey, stops, strength) {
    const { tileWidth, tileHeight } = game.config;
    const geometry = buildCornerGeometry(tileWidth, tileHeight, cornerKey);
    const gradient = context.createLinearGradient(
        geometry.vertex.x,
        geometry.vertex.y,
        geometry.inner.x,
        geometry.inner.y
    );

    gradient.addColorStop(0, stops.outer);
    gradient.addColorStop(0.6, stops.middle);
    gradient.addColorStop(1, stops.inner);

    context.beginPath();
    context.moveTo(geometry.vertex.x, geometry.vertex.y);
    context.lineTo(geometry.sideA.x, geometry.sideA.y);
    context.lineTo(geometry.inner.x, geometry.inner.y);
    context.lineTo(geometry.sideB.x, geometry.sideB.y);
    context.closePath();
    context.fillStyle = gradient;
    context.fill();

    if (!stops.line) {
        return;
    }

    context.save();
    context.globalAlpha = 0.6;
    context.beginPath();
    context.moveTo(
        geometry.vertex.x + (geometry.inner.x - geometry.vertex.x) * 0.18,
        geometry.vertex.y + (geometry.inner.y - geometry.vertex.y) * 0.18
    );
    context.lineTo(
        (geometry.sideA.x + geometry.sideB.x) / 2,
        (geometry.sideA.y + geometry.sideB.y) / 2
    );
    context.strokeStyle = stops.line;
    context.lineWidth = 0.7 + strength * 0.45;
    context.stroke();
    context.restore();
}

function drawTileTransitions(context, game, tileType, progression, palette, renderContext) {
    if (!renderContext || !renderContext.neighbors) {
        return;
    }

    const cardinalDirections = ['north', 'east', 'south', 'west'];
    const cornerDefinitions = {
        northwest: { cardinals: ['north', 'west'] },
        northeast: { cardinals: ['north', 'east'] },
        southeast: { cardinals: ['south', 'east'] },
        southwest: { cardinals: ['south', 'west'] }
    };
    const neighborPalettes = {};

    function getNeighborPalette(neighborTileType) {
        if (!neighborTileType) {
            return palette;
        }

        if (!neighborPalettes[neighborTileType]) {
            neighborPalettes[neighborTileType] = getTilePalette(game, neighborTileType, progression);
        }

        return neighborPalettes[neighborTileType];
    }

    withDiamondClip(context, game, () => {
        cardinalDirections.forEach((direction) => {
            const neighborTileType = renderContext.neighbors[direction];
            const strength = getEdgeBlendStrength(tileType, neighborTileType);

            if (strength <= 0) {
                return;
            }

            const stops = buildTransitionStops(
                palette,
                getNeighborPalette(neighborTileType),
                getTransitionMode(tileType, neighborTileType),
                strength
            );
            drawEdgeBlend(context, game, getEdgeSideKey(direction), stops, strength);
        });

        Object.keys(cornerDefinitions).forEach((direction) => {
            const definition = cornerDefinitions[direction];
            const neighborA = renderContext.neighbors[definition.cardinals[0]];
            const neighborB = renderContext.neighbors[definition.cardinals[1]];
            const diagonal = renderContext.neighbors[direction];
            const blendTileType = selectCornerBlendTile(tileType, neighborA, neighborB, diagonal);

            if (!blendTileType || blendTileType === tileType) {
                return;
            }

            const edgeStrengthA = getEdgeBlendStrength(tileType, neighborA);
            const edgeStrengthB = getEdgeBlendStrength(tileType, neighborB);
            const strength = Math.max(edgeStrengthA, edgeStrengthB) * 0.88;

            if (strength <= 0.08) {
                return;
            }

            const stops = buildTransitionStops(
                palette,
                getNeighborPalette(blendTileType),
                getTransitionMode(tileType, blendTileType),
                strength
            );
            drawCornerBlend(context, game, getCornerKey(direction), stops, strength);
        });
    });
}

function drawSubtleSurfacePanels(context, game, seed, palette) {
    const { tileWidth, tileHeight } = game.config;

    withDiamondClip(context, game, () => {
        context.save();
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.lineWidth = 0.85;

        for (let index = 0; index < 4; index += 1) {
            const width = tileWidth * (0.08 + seededUnit(seed, 190 + index) * 0.08);
            const height = tileHeight * (0.06 + seededUnit(seed, 200 + index) * 0.08);
            const x = -tileWidth * 0.2 + seededUnit(seed, 210 + index) * tileWidth * 0.4;
            const y = tileHeight * (0.16 + seededUnit(seed, 220 + index) * 0.48);
            const alpha = 0.04 + seededUnit(seed, 230 + index) * 0.04;

            context.strokeStyle = rgbToCss(
                index % 2 === 0 ? palette.detailRgb : palette.highlightRgb,
                alpha
            );
            context.beginPath();
            context.moveTo(x - width, y);
            context.lineTo(x, y);
            context.lineTo(x, y + height);
            context.stroke();
        }

        context.restore();
    });
}

function drawMaterialSpecks(context, game, seed, palette, count, radiusRange = [1.2, 2.8], alpha = 0.1) {
    const { tileWidth, tileHeight } = game.config;
    withDiamondClip(context, game, () => {
        context.save();
        context.globalAlpha = alpha;

        for (let index = 0; index < count; index += 1) {
            const x = -tileWidth * 0.24 + seededUnit(seed, index * 2 + 1) * tileWidth * 0.48;
            const y = tileHeight * 0.16 + seededUnit(seed, index * 2 + 2) * tileHeight * 0.62;
            const radius = radiusRange[0] + seededUnit(seed, index * 3 + 3) * (radiusRange[1] - radiusRange[0]);
            context.beginPath();
            context.ellipse(x, y, radius, radius * 0.7, seededUnit(seed, index * 4 + 4) * Math.PI, 0, Math.PI * 2);
            context.fillStyle = index % 3 === 0 ? palette.highlight : palette.detail;
            context.fill();
        }

        context.restore();
    });
}

function drawTileBase(context, game, tileType, palette, seed, renderContext = null, options = {}) {
    const { tileWidth, tileHeight } = game.config;
    const topColor = options.topColor || palette.highlight;
    const midColor = options.midColor || palette.base;
    const bottomColor = options.bottomColor || palette.shadow;
    const gradient = makeVerticalGradient(context, 0, tileHeight, [
        { offset: 0, color: topColor },
        { offset: 0.48, color: midColor },
        { offset: 1, color: bottomColor }
    ]);

    fillDiamondShape(context, game, gradient);
    drawTileTransitions(context, game, tileType, renderContext ? renderContext.progression || null : null, palette, renderContext);

    withDiamondClip(context, game, () => {
        const lightGradient = context.createLinearGradient(-tileWidth * 0.38, tileHeight * 0.08, tileWidth * 0.18, tileHeight * 0.72);
        lightGradient.addColorStop(0, rgbToCss(palette.highlightRgb, 0.2));
        lightGradient.addColorStop(1, rgbToCss(palette.highlightRgb, 0));
        context.fillStyle = lightGradient;
        context.fillRect(-tileWidth / 2, 0, tileWidth, tileHeight);

        const shadowGradient = context.createLinearGradient(tileWidth * 0.3, tileHeight * 0.18, 0, tileHeight);
        shadowGradient.addColorStop(0, rgbToCss(palette.deepShadowRgb, 0));
        shadowGradient.addColorStop(1, rgbToCss(palette.deepShadowRgb, 0.18));
        context.fillStyle = shadowGradient;
        context.fillRect(-tileWidth / 2, 0, tileWidth, tileHeight);

        context.save();
        context.globalAlpha = 0.04 + seededUnit(seed, 1) * 0.03;
        context.fillStyle = palette.detail;
        context.beginPath();
        context.ellipse(-tileWidth * 0.14, tileHeight * 0.28, tileWidth * 0.21, tileHeight * 0.12, -0.18, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.ellipse(tileWidth * 0.11, tileHeight * 0.62, tileWidth * 0.26, tileHeight * 0.14, 0.12, 0, Math.PI * 2);
        context.fill();
        context.restore();
    });
    if (options.surfacePanels !== false) {
        drawSubtleSurfacePanels(context, game, seed, palette);
    }

    context.save();
    context.globalAlpha = 0.14;
    context.beginPath();
    context.moveTo(0, 1.5);
    context.lineTo(tileWidth / 2 - 3, tileHeight / 2);
    context.strokeStyle = palette.highlight;
    context.lineWidth = 0.8;
    context.stroke();
    context.beginPath();
    context.moveTo(0, 1.5);
    context.lineTo(-(tileWidth / 2 - 3), tileHeight / 2);
    context.stroke();
    context.globalAlpha = 0.08;
    context.beginPath();
    context.moveTo(-tileWidth / 2 + 2, tileHeight / 2 + 1);
    context.lineTo(0, tileHeight - 2);
    context.lineTo(tileWidth / 2 - 2, tileHeight / 2 + 1);
    context.strokeStyle = palette.deepShadow;
    context.lineWidth = 0.9;
    context.stroke();
    context.restore();
}

function drawGrassTile(context, game, x, y, palette, renderContext = null) {
    const seed = hashTileSeed('grass', x, y);
    drawTileBase(context, game, 'grass', palette, seed, renderContext);
    drawMaterialSpecks(context, game, seed, palette, 6, [1.2, 2.3], 0.08);

    withDiamondClip(context, game, () => {
        context.save();
        context.lineCap = 'round';
        context.lineJoin = 'round';

        for (let index = 0; index < 6; index += 1) {
            const baseX = -game.config.tileWidth * 0.22 + seededUnit(seed, 10 + index) * game.config.tileWidth * 0.44;
            const baseY = game.config.tileHeight * (0.5 + seededUnit(seed, 20 + index) * 0.26);
            const height = 5 + Math.floor(seededUnit(seed, 30 + index) * 6);
            const lean = (seededUnit(seed, 40 + index) - 0.5) * 5;

            context.beginPath();
            context.moveTo(baseX, baseY);
            context.quadraticCurveTo(baseX + lean * 0.5, baseY - height * 0.55, baseX + lean, baseY - height);
            context.strokeStyle = index % 2 === 0
                ? rgbToCss(palette.detailRgb, 0.72)
                : rgbToCss(palette.accentRgb, 0.68);
            context.lineWidth = 1.15;
            context.stroke();
        }

        context.restore();
    });
}

function drawTrailTile(context, game, x, y, palette, renderContext = null) {
    const seed = hashTileSeed('trail', x, y);
    drawTileBase(context, game, 'trail', palette, seed, renderContext, {
        topColor: palette.mid,
        midColor: palette.base,
        bottomColor: palette.shadow
    });
    drawMaterialSpecks(context, game, seed, palette, 5, [1.4, 2.6], 0.09);

    withDiamondClip(context, game, () => {
        const { tileWidth, tileHeight } = game.config;
        const bandGradient = makeVerticalGradient(context, tileHeight * 0.14, tileHeight * 0.9, [
            { offset: 0, color: rgbToCss(palette.highlightRgb, 0.4) },
            { offset: 0.55, color: rgbToCss(palette.baseRgb, 0.54) },
            { offset: 1, color: rgbToCss(palette.shadowRgb, 0.6) }
        ]);
        context.beginPath();
        context.moveTo(0, tileHeight * 0.08);
        context.bezierCurveTo(tileWidth * 0.15, tileHeight * 0.3, tileWidth * 0.2, tileHeight * 0.58, 0, tileHeight * 0.92);
        context.bezierCurveTo(-tileWidth * 0.18, tileHeight * 0.58, -tileWidth * 0.16, tileHeight * 0.3, 0, tileHeight * 0.08);
        context.closePath();
        context.fillStyle = bandGradient;
        context.fill();
    });
}

function drawWaterTile(context, game, x, y, palette, renderContext = null) {
    const seed = hashTileSeed('water', x, y);
    drawTileBase(context, game, 'water', palette, seed, renderContext, {
        topColor: palette.mid,
        midColor: palette.base,
        bottomColor: palette.deepShadow,
        surfacePanels: false
    });

    withDiamondClip(context, game, () => {
        const { tileWidth, tileHeight } = game.config;
        context.save();
        context.lineCap = 'round';

        for (let wave = 0; wave < 4; wave += 1) {
            const yPos = tileHeight * (0.24 + wave * 0.16 + seededUnit(seed, 50 + wave) * 0.04);
            const amplitude = 1.2 + seededUnit(seed, 60 + wave) * 2.2;
            context.beginPath();
            context.moveTo(-tileWidth * 0.34, yPos);
            context.bezierCurveTo(-tileWidth * 0.18, yPos - amplitude, tileWidth * 0.06, yPos + amplitude, tileWidth * 0.28, yPos - amplitude * 0.35);
            context.strokeStyle = wave % 2 === 0
                ? rgbToCss(palette.sparkRgb, 0.42)
                : rgbToCss(palette.highlightRgb, 0.28);
            context.lineWidth = 1.05;
            context.stroke();
        }

        const sheen = context.createLinearGradient(-tileWidth * 0.18, tileHeight * 0.16, tileWidth * 0.24, tileHeight * 0.92);
        sheen.addColorStop(0, rgbToCss(palette.highlightRgb, 0.14));
        sheen.addColorStop(1, rgbToCss(palette.highlightRgb, 0));
        context.fillStyle = sheen;
        context.fillRect(-tileWidth / 2, 0, tileWidth, tileHeight);
        context.restore();
    });
}

function drawShoreTile(context, game, x, y, palette, renderContext = null) {
    const seed = hashTileSeed('shore', x, y);
    drawTileBase(context, game, 'shore', palette, seed, renderContext, {
        topColor: palette.highlight,
        midColor: palette.base,
        bottomColor: palette.shadow
    });
    drawMaterialSpecks(context, game, seed, palette, 5, [1.2, 2.1], 0.07);

    withDiamondClip(context, game, () => {
        const { tileWidth, tileHeight } = game.config;
        context.beginPath();
        context.moveTo(-tileWidth * 0.28, tileHeight * 0.68);
        context.quadraticCurveTo(-tileWidth * 0.06, tileHeight * 0.58, tileWidth * 0.2, tileHeight * 0.7);
        context.lineTo(tileWidth * 0.34, tileHeight);
        context.lineTo(-tileWidth * 0.08, tileHeight);
        context.closePath();
        context.fillStyle = rgbToCss(palette.shadowRgb, 0.2);
        context.fill();

        context.beginPath();
        context.moveTo(-tileWidth * 0.22, tileHeight * 0.63);
        context.quadraticCurveTo(0, tileHeight * 0.56, tileWidth * 0.2, tileHeight * 0.66);
        context.strokeStyle = rgbToCss(palette.sparkRgb, 0.44);
        context.lineWidth = 1.2;
        context.stroke();
    });
}

function drawRockTile(context, game, x, y, palette, renderContext = null) {
    const seed = hashTileSeed('rock', x, y);
    drawTileBase(context, game, 'rock', palette, seed, renderContext, {
        topColor: palette.mid,
        midColor: palette.shadow,
        bottomColor: palette.deepShadow
    });

    withDiamondClip(context, game, () => {
        const { tileWidth, tileHeight } = game.config;
        const stones = [
            { cx: -tileWidth * 0.14, cy: tileHeight * 0.38, rx: tileWidth * 0.12, ry: tileHeight * 0.16 },
            { cx: tileWidth * 0.1, cy: tileHeight * 0.48, rx: tileWidth * 0.14, ry: tileHeight * 0.18 },
            { cx: 0, cy: tileHeight * 0.67, rx: tileWidth * 0.18, ry: tileHeight * 0.16 }
        ];

        stones.forEach((stone, index) => {
            context.beginPath();
            context.ellipse(stone.cx, stone.cy, stone.rx, stone.ry, seededUnit(seed, 80 + index) * 0.4 - 0.2, 0, Math.PI * 2);
            const gradient = context.createLinearGradient(stone.cx - stone.rx, stone.cy - stone.ry, stone.cx + stone.rx, stone.cy + stone.ry);
            gradient.addColorStop(0, palette.highlight);
            gradient.addColorStop(0.45, palette.base);
            gradient.addColorStop(1, palette.deepShadow);
            context.fillStyle = gradient;
            context.fill();
            context.strokeStyle = rgbToCss(palette.outlineRgb, 0.42);
            context.lineWidth = 0.9;
            context.stroke();
        });
    });
}

function drawBridgeTile(context, game, x, y, palette, renderContext = null) {
    const seed = hashTileSeed('bridge', x, y);
    drawTileBase(context, game, 'bridge', palette, seed, renderContext, {
        topColor: palette.mid,
        midColor: palette.base,
        bottomColor: palette.deepShadow,
        surfacePanels: false
    });

    withDiamondClip(context, game, () => {
        const { tileWidth, tileHeight } = game.config;
        context.save();
        context.globalAlpha = 0.78;

        for (let plank = 0; plank < 4; plank += 1) {
            const yPos = tileHeight * (0.2 + plank * 0.19);
            context.beginPath();
            context.moveTo(-tileWidth * 0.22, yPos);
            context.lineTo(tileWidth * 0.22, yPos);
            context.lineTo(tileWidth * 0.18, yPos + tileHeight * 0.09);
            context.lineTo(-tileWidth * 0.18, yPos + tileHeight * 0.09);
            context.closePath();
            context.fillStyle = plank % 2 === 0 ? palette.highlight : palette.base;
            context.fill();
            context.strokeStyle = rgbToCss(palette.accentShadowRgb, 0.28);
            context.lineWidth = 0.8;
            context.stroke();
        }

        context.beginPath();
        context.moveTo(-tileWidth * 0.25, tileHeight * 0.26);
        context.lineTo(-tileWidth * 0.19, tileHeight * 0.86);
        context.moveTo(tileWidth * 0.25, tileHeight * 0.26);
        context.lineTo(tileWidth * 0.19, tileHeight * 0.86);
        context.strokeStyle = rgbToCss(palette.deepShadowRgb, 0.36);
        context.lineWidth = 1;
        context.stroke();
        context.restore();
    });
}

function drawReedsTile(context, game, x, y, palette, renderContext = null) {
    const seed = hashTileSeed('reeds', x, y);
    drawTileBase(context, game, 'reeds', palette, seed, renderContext, {
        topColor: palette.highlight,
        midColor: palette.base,
        bottomColor: palette.shadow
    });

    withDiamondClip(context, game, () => {
        const { tileWidth, tileHeight } = game.config;
        context.fillStyle = rgbToCss(palette.deepShadowRgb, 0.1);
        context.fillRect(-tileWidth / 2, tileHeight * 0.72, tileWidth, tileHeight * 0.28);
        context.save();
        context.lineCap = 'round';

        for (let stalk = 0; stalk < 8; stalk += 1) {
            const baseX = -tileWidth * 0.24 + seededUnit(seed, 100 + stalk) * tileWidth * 0.5;
            const baseY = tileHeight * (0.52 + seededUnit(seed, 110 + stalk) * 0.22);
            const topY = tileHeight * (0.1 + seededUnit(seed, 120 + stalk) * 0.18);
            const bend = (seededUnit(seed, 130 + stalk) - 0.5) * 7;
            context.beginPath();
            context.moveTo(baseX, baseY);
            context.quadraticCurveTo(baseX + bend * 0.4, (baseY + topY) / 2, baseX + bend, topY);
            context.strokeStyle = stalk % 3 === 0
                ? rgbToCss(palette.sparkRgb, 0.64)
                : rgbToCss(palette.accentRgb, 0.7);
            context.lineWidth = 1.05;
            context.stroke();
        }

        context.restore();
    });
}

function drawRubbleTile(context, game, x, y, palette, renderContext = null) {
    const seed = hashTileSeed('rubble', x, y);
    drawTileBase(context, game, 'rubble', palette, seed, renderContext, {
        topColor: palette.mid,
        midColor: palette.base,
        bottomColor: palette.shadow
    });
    drawMaterialSpecks(context, game, seed, palette, 7, [1.4, 3], 0.12);

    withDiamondClip(context, game, () => {
        const { tileWidth, tileHeight } = game.config;
        for (let pile = 0; pile < 4; pile += 1) {
            const cx = -tileWidth * 0.2 + seededUnit(seed, 140 + pile) * tileWidth * 0.4;
            const cy = tileHeight * (0.34 + seededUnit(seed, 150 + pile) * 0.42);
            const size = tileWidth * (0.05 + seededUnit(seed, 160 + pile) * 0.05);
            context.beginPath();
            context.moveTo(cx, cy - size * 0.9);
            context.lineTo(cx + size, cy);
            context.lineTo(cx, cy + size * 0.85);
            context.lineTo(cx - size * 0.95, cy);
            context.closePath();
            context.fillStyle = pile % 2 === 0 ? palette.highlight : palette.detail;
            context.fill();
            context.strokeStyle = rgbToCss(palette.outlineRgb, 0.38);
            context.lineWidth = 0.75;
            context.stroke();
        }
    });
}

function drawMudTile(context, game, x, y, palette, renderContext = null) {
    const seed = hashTileSeed('mud', x, y);
    drawTileBase(context, game, 'mud', palette, seed, renderContext, {
        topColor: palette.mid,
        midColor: palette.base,
        bottomColor: palette.deepShadow
    });

    withDiamondClip(context, game, () => {
        const { tileWidth, tileHeight } = game.config;
        const puddles = [
            { x: -tileWidth * 0.12, y: tileHeight * 0.44, rx: tileWidth * 0.16, ry: tileHeight * 0.12 },
            { x: tileWidth * 0.1, y: tileHeight * 0.68, rx: tileWidth * 0.12, ry: tileHeight * 0.09 }
        ];

        puddles.forEach((puddle, index) => {
            context.beginPath();
            context.ellipse(puddle.x, puddle.y, puddle.rx, puddle.ry, seededUnit(seed, 170 + index) * 0.3 - 0.15, 0, Math.PI * 2);
            const gradient = context.createLinearGradient(puddle.x - puddle.rx, puddle.y - puddle.ry, puddle.x + puddle.rx, puddle.y + puddle.ry);
            gradient.addColorStop(0, rgbToCss(palette.shadowRgb, 0.72));
            gradient.addColorStop(1, rgbToCss(palette.deepShadowRgb, 0.78));
            context.fillStyle = gradient;
            context.fill();
            context.strokeStyle = rgbToCss(palette.sparkRgb, 0.18);
            context.lineWidth = 0.9;
            context.stroke();
        });
    });
}

function drawHouseTile(context, game, x, y, palette, renderContext = null) {
    const seed = hashTileSeed('house', x, y);
    drawTileBase(context, game, 'house', palette, seed, renderContext, {
        topColor: palette.highlight,
        midColor: palette.base,
        bottomColor: palette.shadow,
        surfacePanels: false
    });

    withDiamondClip(context, game, () => {
        const { tileWidth, tileHeight } = game.config;
        context.save();
        context.globalAlpha = 0.26;
        for (let board = 0; board < 4; board += 1) {
            const yPos = tileHeight * (0.22 + board * 0.18);
            context.beginPath();
            context.moveTo(-tileWidth * 0.26, yPos);
            context.lineTo(tileWidth * 0.26, yPos);
            context.strokeStyle = board % 2 === 0 ? palette.detail : palette.accentShadow;
            context.lineWidth = 1.1;
            context.stroke();
        }
        context.restore();
    });
}

function drawUnloadedTile(context, game, x, y, palette, renderContext = null) {
    const seed = hashTileSeed('unloaded', x, y);
    drawTileBase(context, game, 'unloaded', palette, seed, renderContext, {
        topColor: palette.mid,
        midColor: palette.base,
        bottomColor: palette.deepShadow,
        surfacePanels: false
    });

    withDiamondClip(context, game, () => {
        const { tileWidth, tileHeight } = game.config;
        context.save();
        context.globalAlpha = 0.14;
        context.strokeStyle = palette.detail;
        context.lineWidth = 1;
        for (let line = -2; line < 6; line += 1) {
            context.beginPath();
            context.moveTo(-tileWidth * 0.42 + line * 7, tileHeight * 0.1);
            context.lineTo(-tileWidth * 0.1 + line * 7, tileHeight * 0.9);
            context.stroke();
        }
        context.restore();
    });
}

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
        draw: drawHouseTile
    },
    unloaded: {
        key: 'unloaded',
        label: 'не загружено',
        passable: false,
        ground: false,
        movementFactor: Infinity,
        routeBand: 'blocked',
        draw: drawUnloadedTile
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

function drawTileAtContext(context, screenX, screenY, tileType, worldX, worldY, progression = null, renderContext = null) {
    const game = window.Game;
    const definition = getTileDefinition(tileType);
    const palette = getTilePalette(game, tileType, progression);

    context.save();
    context.translate(screenX, screenY);
    definition.draw(context, game, worldX, worldY, palette, renderContext);
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
