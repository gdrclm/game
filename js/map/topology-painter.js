(() => {
    const game = window.Game;
    const topologyPainter = game.systems.topologyPainter = game.systems.topologyPainter || {};

    const ROCK_SHAPES = [
        [[1]],
        [[1, 1]],
        [[1], [1]],
        [[1, 1], [1, 1]],
        [[1, 0], [1, 1]],
        [[0, 1], [1, 1]],
        [[1, 1, 1]],
        [[1, 1], [1, 0]]
    ];

    function randomInt(random, min, max) {
        return min + Math.floor(random() * (max - min + 1));
    }

    function buildChunkGrid(fill = 'water') {
        return Array.from(
            { length: game.config.chunkSize },
            () => Array(game.config.chunkSize).fill(fill)
        );
    }

    function buildTravelZoneGrid(fill = 'none') {
        return Array.from(
            { length: game.config.chunkSize },
            () => Array(game.config.chunkSize).fill(fill)
        );
    }

    function ensureSpawnArea(chunkData, chunkX, chunkY) {
        if (chunkX !== 0 || chunkY !== 0) {
            return;
        }

        const center = Math.floor(game.config.chunkSize / 2);
        const safeTiles = [
            [center, center],
            [center - 1, center],
            [center + 1, center],
            [center, center - 1],
            [center, center + 1]
        ];

        safeTiles.forEach(([x, y]) => {
            if (chunkData[y] && chunkData[y][x] !== 'bridge') {
                chunkData[y][x] = 'grass';
            }
        });
    }

    function flattenShape(shape) {
        return shape
            .flatMap((row, rowIndex) => row.map((value, columnIndex) => (
                value === 1
                    ? { x: columnIndex, y: rowIndex }
                    : null
            )))
            .filter(Boolean);
    }

    function canPlaceShape(chunkData, houses, shapeCells, startX, startY, padding = 1) {
        const chunkSize = game.config.chunkSize;

        for (const cell of shapeCells) {
            const x = startX + cell.x;
            const y = startY + cell.y;

            if (x < 0 || x >= chunkSize || y < 0 || y >= chunkSize) {
                return false;
            }

            if (chunkData[y][x] !== 'grass') {
                return false;
            }
        }

        return !game.systems.houses.doesShapeTouchHouse(houses, shapeCells, startX, startY, padding);
    }

    function stampShape(chunkData, shapeCells, startX, startY, tileType = 'rock') {
        shapeCells.forEach((cell) => {
            chunkData[startY + cell.y][startX + cell.x] = tileType;
        });
    }

    function placeShapeWithRandomAttempts(chunkData, houses, shapeCells, width, height, random, attempts, padding = 1, tileType = 'rock') {
        const chunkSize = game.config.chunkSize;

        for (let attempt = 0; attempt < attempts; attempt++) {
            const startX = Math.floor(random() * (chunkSize - width + 1));
            const startY = Math.floor(random() * (chunkSize - height + 1));

            if (canPlaceShape(chunkData, houses, shapeCells, startX, startY, padding)) {
                stampShape(chunkData, shapeCells, startX, startY, tileType);
                return true;
            }
        }

        return false;
    }

    function setTileIfPossible(chunkData, x, y, tileType) {
        const chunkSize = game.config.chunkSize;

        if (x < 0 || x >= chunkSize || y < 0 || y >= chunkSize) {
            return;
        }

        if (chunkData[y][x] === 'bridge' && tileType !== 'bridge') {
            return;
        }

        chunkData[y][x] = tileType;
    }

    function paintLandBrush(chunkData, centerX, centerY, radius = 1, tileType = 'grass') {
        for (let offsetY = -radius; offsetY <= radius; offsetY++) {
            for (let offsetX = -radius; offsetX <= radius; offsetX++) {
                if (Math.abs(offsetX) + Math.abs(offsetY) > radius + 0.5) {
                    continue;
                }

                setTileIfPossible(chunkData, centerX + offsetX, centerY + offsetY, tileType);
            }
        }
    }

    function clampValue(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function paintBlob(chunkData, centerX, centerY, radiusX, radiusY, random, tileType = 'grass') {
        const chunkSize = game.config.chunkSize;

        for (let y = 1; y < chunkSize - 1; y++) {
            for (let x = 1; x < chunkSize - 1; x++) {
                const noise = (random() - 0.5) * 0.14;
                const dx = (x - centerX) / radiusX;
                const dy = (y - centerY) / radiusY;
                const distance = dx * dx + dy * dy + noise;

                if (distance <= 1) {
                    setTileIfPossible(chunkData, x, y, tileType);
                }
            }
        }
    }

    function getChunkDirections(chunkRecord) {
        return new Set([...chunkRecord.internalDirections, ...chunkRecord.bridgeDirections]);
    }

    function getPrimaryAxis(chunkRecord) {
        const directions = getChunkDirections(chunkRecord);
        const horizontal = Number(directions.has('east')) + Number(directions.has('west'));
        const vertical = Number(directions.has('north')) + Number(directions.has('south'));
        return horizontal >= vertical ? 'horizontal' : 'vertical';
    }

    function paintDirectionalLobe(chunkData, direction, distance, radiusX, radiusY, random) {
        const center = (game.config.chunkSize - 1) / 2;
        const offsetByDirection = {
            north: { x: 0, y: -distance },
            south: { x: 0, y: distance },
            west: { x: -distance, y: 0 },
            east: { x: distance, y: 0 }
        };
        const offset = offsetByDirection[direction];

        if (!offset) {
            return;
        }

        paintBlob(chunkData, center + offset.x, center + offset.y, radiusX, radiusY, random);
    }

    function getCornerAnchor(chunkRecord, center, distance) {
        if (chunkRecord.internalDirections.has('east') && chunkRecord.internalDirections.has('south')) {
            return { x: center + distance, y: center + distance };
        }

        if (chunkRecord.internalDirections.has('east') && chunkRecord.internalDirections.has('north')) {
            return { x: center + distance, y: center - distance };
        }

        if (chunkRecord.internalDirections.has('west') && chunkRecord.internalDirections.has('south')) {
            return { x: center - distance, y: center + distance };
        }

        if (chunkRecord.internalDirections.has('west') && chunkRecord.internalDirections.has('north')) {
            return { x: center - distance, y: center - distance };
        }

        return null;
    }

    function getOutwardDirections(chunkRecord) {
        const directions = getChunkDirections(chunkRecord);
        const outward = [];

        if (directions.has('west') && !directions.has('east')) {
            outward.push('east');
        }

        if (directions.has('east') && !directions.has('west')) {
            outward.push('west');
        }

        if (directions.has('north') && !directions.has('south')) {
            outward.push('south');
        }

        if (directions.has('south') && !directions.has('north')) {
            outward.push('north');
        }

        return outward;
    }

    function getDirectionDelta(direction) {
        if (direction === 'north') {
            return { dx: 0, dy: -1 };
        }

        if (direction === 'south') {
            return { dx: 0, dy: 1 };
        }

        if (direction === 'west') {
            return { dx: -1, dy: 0 };
        }

        if (direction === 'east') {
            return { dx: 1, dy: 0 };
        }

        return null;
    }

    function getSharedEdgeBias(chunkRecord, direction) {
        const delta = getDirectionDelta(direction);

        if (!delta) {
            return 1;
        }

        const neighborX = chunkRecord.chunkX + delta.dx;
        const neighborY = chunkRecord.chunkY + delta.dy;
        const edgeX = Math.min(chunkRecord.chunkX, neighborX);
        const edgeY = Math.min(chunkRecord.chunkY, neighborY);
        const axisSeed = delta.dx !== 0 ? 19 : 31;
        const hash = (
            Math.imul(edgeX + 4099, 73856093)
            ^ Math.imul(edgeY + 8191, 19349663)
            ^ axisSeed
        ) >>> 0;

        return hash % 2 === 0 ? 1 : -1;
    }

    function getConnectionLaneOffset(chunkRecord, progression, direction) {
        if (!progression) {
            return 0;
        }

        if (chunkRecord.bridgeDirections.has(direction)) {
            return 0;
        }

        const expedition = game.systems.expedition;
        const delta = getDirectionDelta(direction);
        const neighborChunk = expedition && delta
            ? expedition.getIslandChunkRecord(chunkRecord.chunkX + delta.dx, chunkRecord.chunkY + delta.dy)
            : null;
        const bias = getSharedEdgeBias(chunkRecord, direction);
        const edgeTouchesRemote = chunkRecord.tags.has('remote')
            || chunkRecord.tags.has('tip')
            || (neighborChunk && (neighborChunk.tags.has('remote') || neighborChunk.tags.has('tip')));

        if (progression.routeStyle === 'arc') {
            return bias * 3;
        }

        if (progression.routeStyle === 'outerRing') {
            return bias * 5;
        }

        if (progression.routeStyle === 'branching') {
            return bias * (edgeTouchesRemote ? 4 : 2);
        }

        return 0;
    }

    function paintIslandBody(chunkData, chunkRecord, progression, random) {
        const chunkSize = game.config.chunkSize;
        const center = (chunkSize - 1) / 2;
        const directions = getChunkDirections(chunkRecord);
        const shiftX = (directions.has('east') ? 1.8 : 0) - (directions.has('west') ? 1.8 : 0);
        const shiftY = (directions.has('south') ? 1.8 : 0) - (directions.has('north') ? 1.8 : 0);
        const radiusX = Math.min(10.8, 8.9 + (directions.has('east') || directions.has('west') ? 1.35 : 0));
        const radiusY = Math.min(10.8, 8.9 + (directions.has('north') || directions.has('south') ? 1.35 : 0));
        const baseRadiusBoost = chunkRecord.tags.has('junction') ? 0.9 : 0;

        paintBlob(
            chunkData,
            center + shiftX * 0.45,
            center + shiftY * 0.45,
            radiusX + baseRadiusBoost,
            radiusY + baseRadiusBoost,
            random
        );

        directions.forEach((direction) => {
            paintDirectionalLobe(chunkData, direction, 4.2, 5.1, 4.9, random);
        });

        if (chunkRecord.tags.has('junction')) {
            paintBlob(chunkData, center, center, 7.4, 7.4, random);
        }

        if (chunkRecord.tags.has('corner')) {
            const anchor = getCornerAnchor(chunkRecord, center, 4.2);
            if (anchor) {
                paintBlob(chunkData, anchor.x, anchor.y, 5.4, 5.1, random);
            }
        }

        if (chunkRecord.tags.has('remote') || chunkRecord.tags.has('tip') || chunkRecord.tags.has('peninsula')) {
            getOutwardDirections(chunkRecord).forEach((direction, index) => {
                if (index === 0 || progression.routeStyle === 'branching') {
                    paintDirectionalLobe(chunkData, direction, 6.1, 5.4, 4.9, random);
                }
            });
        }
    }

    function paintEdgeOpening(chunkData, direction, laneOffset, halfWidth = 5, depth = 4) {
        const chunkSize = game.config.chunkSize;
        const center = Math.floor(chunkSize / 2);
        const laneX = clampValue(center + laneOffset, 2, chunkSize - 3);
        const laneY = clampValue(center + laneOffset, 2, chunkSize - 3);

        if (direction === 'north') {
            for (let y = 0; y <= depth; y++) {
                for (let x = laneX - halfWidth; x <= laneX + halfWidth; x++) {
                    setTileIfPossible(chunkData, x, y, 'grass');
                }
            }
            return;
        }

        if (direction === 'south') {
            for (let y = chunkSize - 1; y >= chunkSize - 1 - depth; y--) {
                for (let x = laneX - halfWidth; x <= laneX + halfWidth; x++) {
                    setTileIfPossible(chunkData, x, y, 'grass');
                }
            }
            return;
        }

        if (direction === 'west') {
            for (let x = 0; x <= depth; x++) {
                for (let y = laneY - halfWidth; y <= laneY + halfWidth; y++) {
                    setTileIfPossible(chunkData, x, y, 'grass');
                }
            }
            return;
        }

        for (let x = chunkSize - 1; x >= chunkSize - 1 - depth; x--) {
            for (let y = laneY - halfWidth; y <= laneY + halfWidth; y++) {
                setTileIfPossible(chunkData, x, y, 'grass');
            }
        }
    }

    function carveBridgeChannel(chunkData, direction, laneOffset, bridgeHalfWidth = 0) {
        const chunkSize = game.config.chunkSize;
        const center = Math.floor(chunkSize / 2);
        const lane = clampValue(center + laneOffset, 2, chunkSize - 3);

        if (direction === 'north' || direction === 'south') {
            const edgeY = direction === 'north' ? 0 : chunkSize - 1;
            const nearY = direction === 'north' ? 1 : chunkSize - 2;
            const bankY = direction === 'north' ? 2 : chunkSize - 3;

            for (let x = 0; x < chunkSize; x++) {
                if (Math.abs(x - lane) > bridgeHalfWidth) {
                    setTileIfPossible(chunkData, x, edgeY, 'water');
                }

                if (Math.abs(x - lane) > bridgeHalfWidth + 1) {
                    setTileIfPossible(chunkData, x, nearY, 'water');
                }
            }

            for (let x = lane - bridgeHalfWidth; x <= lane + bridgeHalfWidth; x++) {
                setTileIfPossible(chunkData, x, nearY, 'grass');
                chunkData[edgeY][x] = 'bridge';
            }

            paintLandBrush(chunkData, lane, bankY, bridgeHalfWidth > 0 ? 2 : 1, 'grass');
            return;
        }

        const edgeX = direction === 'west' ? 0 : chunkSize - 1;
        const nearX = direction === 'west' ? 1 : chunkSize - 2;
        const bankX = direction === 'west' ? 2 : chunkSize - 3;

        for (let y = 0; y < chunkSize; y++) {
            if (Math.abs(y - lane) > bridgeHalfWidth) {
                setTileIfPossible(chunkData, edgeX, y, 'water');
            }

            if (Math.abs(y - lane) > bridgeHalfWidth + 1) {
                setTileIfPossible(chunkData, nearX, y, 'water');
            }
        }

        for (let y = lane - bridgeHalfWidth; y <= lane + bridgeHalfWidth; y++) {
            setTileIfPossible(chunkData, nearX, y, 'grass');
            chunkData[y][edgeX] = 'bridge';
        }

        paintLandBrush(chunkData, bankX, lane, bridgeHalfWidth > 0 ? 2 : 1, 'grass');
    }

    function getBridgeProfile(progression) {
        const tutorialPhase = progression && progression.islandIndex <= 2;

        return {
            radius: tutorialPhase ? 2 : 1,
            halfWidth: tutorialPhase ? 1 : 0
        };
    }

    function carveConnectionToEdge(chunkData, direction, radius = 2, useBridge = false, laneOffset = 0) {
        const chunkSize = game.config.chunkSize;
        const center = Math.floor(chunkSize / 2);
        let currentX = direction === 'north' || direction === 'south'
            ? clampValue(center + laneOffset, 2, chunkSize - 3)
            : center;
        let currentY = direction === 'east' || direction === 'west'
            ? clampValue(center + laneOffset, 2, chunkSize - 3)
            : center;
        let targetX = currentX;
        let targetY = currentY;

        if (direction === 'north') {
            targetY = 0;
        } else if (direction === 'south') {
            targetY = chunkSize - 1;
        } else if (direction === 'west') {
            targetX = 0;
        } else if (direction === 'east') {
            targetX = chunkSize - 1;
        }

        while (currentX !== targetX || currentY !== targetY) {
            paintLandBrush(chunkData, currentX, currentY, radius, 'grass');

            if (currentX !== targetX) {
                currentX += Math.sign(targetX - currentX);
            } else if (currentY !== targetY) {
                currentY += Math.sign(targetY - currentY);
            }
        }

        paintLandBrush(chunkData, currentX, currentY, radius, 'grass');
        chunkData[currentY][currentX] = useBridge ? 'bridge' : 'grass';

        if (useBridge) {
            if (direction === 'north' || direction === 'south') {
                if (currentX - 1 >= 0) {
                    chunkData[currentY][currentX - 1] = 'water';
                }
                if (currentX + 1 < chunkSize) {
                    chunkData[currentY][currentX + 1] = 'water';
                }
            } else {
                if (currentY - 1 >= 0) {
                    chunkData[currentY - 1][currentX] = 'water';
                }
                if (currentY + 1 < chunkSize) {
                    chunkData[currentY + 1][currentX] = 'water';
                }
            }
        }
    }

    function addChunkConnections(chunkData, chunkRecord, progression) {
        chunkRecord.internalDirections.forEach((direction) => {
            const laneOffset = getConnectionLaneOffset(chunkRecord, progression, direction);
            paintEdgeOpening(chunkData, direction, laneOffset, chunkRecord.tags.has('junction') ? 6 : 5, 5);
            carveConnectionToEdge(chunkData, direction, chunkRecord.tags.has('junction') ? 4 : 3, false, laneOffset);
        });

        chunkRecord.bridgeDirections.forEach((direction) => {
            const bridgeProfile = getBridgeProfile(progression);
            const laneOffset = clampValue(Math.round(getConnectionLaneOffset(chunkRecord, progression, direction) * 0.65), -5, 5);
            carveConnectionToEdge(chunkData, direction, bridgeProfile.radius, true, laneOffset);
            carveBridgeChannel(chunkData, direction, laneOffset, bridgeProfile.halfWidth);
        });
    }

    function carveBay(chunkData, side, depth, from, to) {
        const chunkSize = game.config.chunkSize;

        if (side === 'north') {
            for (let y = 1; y <= depth; y++) {
                for (let x = from; x <= to; x++) {
                    setTileIfPossible(chunkData, x, y, 'water');
                }
            }
            return;
        }

        if (side === 'south') {
            for (let y = chunkSize - 2; y >= chunkSize - 1 - depth; y--) {
                for (let x = from; x <= to; x++) {
                    setTileIfPossible(chunkData, x, y, 'water');
                }
            }
            return;
        }

        if (side === 'west') {
            for (let x = 1; x <= depth; x++) {
                for (let y = from; y <= to; y++) {
                    setTileIfPossible(chunkData, x, y, 'water');
                }
            }
            return;
        }

        for (let x = chunkSize - 2; x >= chunkSize - 1 - depth; x--) {
            for (let y = from; y <= to; y++) {
                setTileIfPossible(chunkData, x, y, 'water');
            }
        }
    }

    function carveRockBarrier(chunkData, axis, lineIndex, gapStart, gapEnd) {
        const chunkSize = game.config.chunkSize;

        if (axis === 'vertical') {
            for (let y = 2; y < chunkSize - 2; y++) {
                if (y >= gapStart && y <= gapEnd) {
                    continue;
                }

                setTileIfPossible(chunkData, lineIndex, y, 'rock');
            }
            return;
        }

        for (let x = 2; x < chunkSize - 2; x++) {
            if (x >= gapStart && x <= gapEnd) {
                continue;
            }

            setTileIfPossible(chunkData, x, lineIndex, 'rock');
        }
    }

    function carveDiamondArea(chunkData, centerX, centerY, radius, tileType = 'water') {
        for (let offsetY = -radius; offsetY <= radius; offsetY++) {
            for (let offsetX = -radius; offsetX <= radius; offsetX++) {
                if (Math.abs(offsetX) + Math.abs(offsetY) > radius + 0.25) {
                    continue;
                }

                setTileIfPossible(chunkData, centerX + offsetX, centerY + offsetY, tileType);
            }
        }
    }

    function carveTopologyFeatures(chunkData, chunkRecord, progression, random) {
        const chunkSize = game.config.chunkSize;
        const axis = getPrimaryAxis(chunkRecord);
        const center = Math.floor(chunkSize / 2);
        const bendSign = ((chunkRecord.chunkX + chunkRecord.chunkY) % 2 === 0) ? 1 : -1;

        if (progression && progression.routeStyle === 'arc') {
            if (axis === 'horizontal') {
                carveBay(chunkData, bendSign > 0 ? 'north' : 'south', 5, 4, chunkSize - 5);
            } else {
                carveBay(chunkData, bendSign > 0 ? 'west' : 'east', 5, 4, chunkSize - 5);
            }
        }

        if (progression && progression.routeStyle === 'outerRing') {
            carveDiamondArea(chunkData, center, center, 3, 'water');
            carveDiamondArea(chunkData, center, center, 1, 'rock');
        }

        if (progression && progression.routeStyle === 'bottleneck') {
            if (axis === 'horizontal') {
                carveRockBarrier(chunkData, 'vertical', center + (bendSign > 0 ? -1 : 1), center - 1, center + 1);
            } else {
                carveRockBarrier(chunkData, 'horizontal', center + (bendSign > 0 ? -1 : 1), center - 1, center + 1);
            }
        }

        if (progression && progression.routeStyle === 'branching' && chunkRecord.tags.has('junction')) {
            if (axis === 'horizontal') {
                carveBay(chunkData, 'north', 3, 3, center - 1);
                carveBay(chunkData, 'south', 3, center + 1, chunkSize - 4);
            } else {
                carveBay(chunkData, 'west', 3, 3, center - 1);
                carveBay(chunkData, 'east', 3, center + 1, chunkSize - 4);
            }
        }

        if (chunkRecord.tags.has('neck')) {
            if (axis === 'horizontal') {
                carveBay(chunkData, 'north', 5, 4, chunkSize - 5);
                carveBay(chunkData, 'south', 5, 4, chunkSize - 5);
            } else {
                carveBay(chunkData, 'west', 5, 4, chunkSize - 5);
                carveBay(chunkData, 'east', 5, 4, chunkSize - 5);
            }
        }

        if (chunkRecord.tags.has('peninsula') || chunkRecord.tags.has('tip')) {
            if (axis === 'horizontal') {
                carveBay(chunkData, random() < 0.5 ? 'north' : 'south', 5, center - 2, chunkSize - 5);
            } else {
                carveBay(chunkData, random() < 0.5 ? 'west' : 'east', 5, center - 2, chunkSize - 5);
            }
        }

        if (chunkRecord.tags.has('corner')) {
            if (chunkRecord.internalDirections.has('east') && chunkRecord.internalDirections.has('south')) {
                carveBay(chunkData, 'north', 4, 2, center);
                carveBay(chunkData, 'west', 4, 2, center);
            } else if (chunkRecord.internalDirections.has('east') && chunkRecord.internalDirections.has('north')) {
                carveBay(chunkData, 'south', 4, 2, center);
                carveBay(chunkData, 'west', 4, center, game.config.chunkSize - 3);
            } else if (chunkRecord.internalDirections.has('west') && chunkRecord.internalDirections.has('south')) {
                carveBay(chunkData, 'north', 4, center, game.config.chunkSize - 3);
                carveBay(chunkData, 'east', 4, 2, center);
            } else if (chunkRecord.internalDirections.has('west') && chunkRecord.internalDirections.has('north')) {
                carveBay(chunkData, 'south', 4, center, game.config.chunkSize - 3);
                carveBay(chunkData, 'east', 4, center, game.config.chunkSize - 3);
            }
        }

        if (chunkRecord.tags.has('junction') && random() < 0.7) {
            if (axis === 'horizontal') {
                carveRockBarrier(chunkData, 'vertical', center + (random() < 0.5 ? -2 : 2), center - 2, center + 2);
            } else {
                carveRockBarrier(chunkData, 'horizontal', center + (random() < 0.5 ? -2 : 2), center - 2, center + 2);
            }
        }

        if (chunkRecord.tags.has('remote') && chunkRecord.tags.has('leaf')) {
            carveRockBarrier(chunkData, axis === 'horizontal' ? 'vertical' : 'horizontal', center, center - 1, center + 1);
            carveDiamondArea(chunkData, center + (axis === 'horizontal' ? 3 : 0), center + (axis === 'vertical' ? 3 : 0), 2, 'water');
        }
    }

    function addRandomRocks(chunkData, houses, progression, random) {
        if (!progression || progression.rockCountMax <= 0) {
            return;
        }

        const rockCount = progression.rockCountMin + Math.floor(random() * Math.max(1, progression.rockCountMax - progression.rockCountMin + 1));

        for (let index = 0; index < rockCount; index++) {
            const shape = ROCK_SHAPES[Math.floor(random() * ROCK_SHAPES.length)];
            const shapeCells = flattenShape(shape);
            const width = shape[0].length;
            const height = shape.length;

            placeShapeWithRandomAttempts(
                chunkData,
                houses,
                shapeCells,
                width,
                height,
                random,
                game.config.rockPlacementAttempts,
                1,
                'rock'
            );
        }
    }

    function addShoreline(chunkData) {
        const chunkSize = game.config.chunkSize;
        const directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];

        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                if (chunkData[y][x] !== 'grass') {
                    continue;
                }

                const touchesWater = directions.some(({ dx, dy }) => {
                    const nextX = x + dx;
                    const nextY = y + dy;

                    if (nextX < 0 || nextX >= chunkSize || nextY < 0 || nextY >= chunkSize) {
                        return true;
                    }

                    return chunkData[nextY][nextX] === 'water';
                });

                if (touchesWater) {
                    chunkData[y][x] = 'shore';
                }
            }
        }
    }

    Object.assign(topologyPainter, {
        ROCK_SHAPES,
        randomInt,
        buildChunkGrid,
        buildTravelZoneGrid,
        ensureSpawnArea,
        flattenShape,
        canPlaceShape,
        stampShape,
        placeShapeWithRandomAttempts,
        setTileIfPossible,
        paintLandBrush,
        clampValue,
        paintBlob,
        getChunkDirections,
        getPrimaryAxis,
        paintDirectionalLobe,
        getCornerAnchor,
        getOutwardDirections,
        getDirectionDelta,
        getSharedEdgeBias,
        getConnectionLaneOffset,
        paintIslandBody,
        paintEdgeOpening,
        carveBridgeChannel,
        getBridgeProfile,
        carveConnectionToEdge,
        addChunkConnections,
        carveBay,
        carveRockBarrier,
        carveDiamondArea,
        carveTopologyFeatures,
        addRandomRocks,
        addShoreline
    });
})();
