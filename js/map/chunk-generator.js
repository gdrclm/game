(() => {
    const game = window.Game;
    const chunkGenerator = game.systems.chunkGenerator = game.systems.chunkGenerator || {};

    function getPainter() {
        return game.systems.topologyPainter || {};
    }

    function getHouseCellSet(houses = []) {
        const set = new Set();

        houses.forEach((house) => {
            if (!house || !Array.isArray(house.localCells)) {
                return;
            }

            house.localCells.forEach((cell) => {
                set.add(`${cell.x},${cell.y}`);
            });
        });

        return set;
    }

    function canAssignTravelZone(chunkData, x, y, houseTileSet) {
        const chunkSize = game.config.chunkSize;

        if (x < 0 || x >= chunkSize || y < 0 || y >= chunkSize) {
            return false;
        }

        if (houseTileSet.has(`${x},${y}`)) {
            return false;
        }

        return game.systems.content.isPassableTile(chunkData[y][x]);
    }

    function assignTravelZone(travelZones, chunkData, x, y, zoneKey, houseTileSet) {
        if (!canAssignTravelZone(chunkData, x, y, houseTileSet)) {
            return false;
        }

        const content = game.systems.content;
        const currentKey = travelZones[y][x] || 'none';
        const currentDefinition = content.getTravelZoneDefinition(currentKey);
        const nextDefinition = content.getTravelZoneDefinition(zoneKey);

        if (currentKey !== 'none' && nextDefinition.movementFactor < currentDefinition.movementFactor) {
            return false;
        }

        travelZones[y][x] = zoneKey;
        return true;
    }

    function clearTravelZoneArea(travelZones, centerX, centerY, radius = 1) {
        const chunkSize = game.config.chunkSize;

        for (let offsetY = -radius; offsetY <= radius; offsetY++) {
            for (let offsetX = -radius; offsetX <= radius; offsetX++) {
                if (Math.abs(offsetX) + Math.abs(offsetY) > radius + 0.25) {
                    continue;
                }

                const x = centerX + offsetX;
                const y = centerY + offsetY;

                if (x < 0 || x >= chunkSize || y < 0 || y >= chunkSize) {
                    continue;
                }

                travelZones[y][x] = 'none';
            }
        }
    }

    function isDecoratableTravelTile(tileType) {
        return tileType === 'grass'
            || tileType === 'shore'
            || tileType === 'trail'
            || tileType === 'reeds'
            || tileType === 'rubble'
            || tileType === 'mud';
    }

    function countNeighborsByType(chunkData, x, y, predicate, includeDiagonals = false) {
        const directions = includeDiagonals
            ? [
                { dx: 1, dy: 0 },
                { dx: -1, dy: 0 },
                { dx: 0, dy: 1 },
                { dx: 0, dy: -1 },
                { dx: 1, dy: 1 },
                { dx: 1, dy: -1 },
                { dx: -1, dy: 1 },
                { dx: -1, dy: -1 }
            ]
            : [
                { dx: 1, dy: 0 },
                { dx: -1, dy: 0 },
                { dx: 0, dy: 1 },
                { dx: 0, dy: -1 }
            ];
        const chunkSize = game.config.chunkSize;

        return directions.reduce((count, direction) => {
            const nextX = x + direction.dx;
            const nextY = y + direction.dy;

            if (nextX < 0 || nextX >= chunkSize || nextY < 0 || nextY >= chunkSize) {
                return count;
            }

            return predicate(chunkData[nextY][nextX], nextX, nextY) ? count + 1 : count;
        }, 0);
    }

    function canPaintTravelTile(chunkData, x, y, houseTileSet) {
        const chunkSize = game.config.chunkSize;

        if (x < 0 || x >= chunkSize || y < 0 || y >= chunkSize) {
            return false;
        }

        if (houseTileSet.has(`${x},${y}`)) {
            return false;
        }

        return isDecoratableTravelTile(chunkData[y][x]);
    }

    function paintTravelTile(chunkData, x, y, tileType, houseTileSet) {
        if (!canPaintTravelTile(chunkData, x, y, houseTileSet)) {
            return false;
        }

        chunkData[y][x] = tileType;
        return true;
    }

    function paintTravelTrailLine(chunkData, startX, startY, targetX, targetY, houseTileSet) {
        let currentX = startX;
        let currentY = startY;

        paintTravelTile(chunkData, currentX, currentY, 'trail', houseTileSet);

        while (currentX !== targetX || currentY !== targetY) {
            if (currentX !== targetX) {
                currentX += Math.sign(targetX - currentX);
            } else if (currentY !== targetY) {
                currentY += Math.sign(targetY - currentY);
            }

            paintTravelTile(chunkData, currentX, currentY, 'trail', houseTileSet);
        }
    }

    function pointKey(x, y) {
        return `${x},${y}`;
    }

    function getPointDistance(from, to) {
        return Math.abs((from ? from.x : 0) - (to ? to.x : 0)) + Math.abs((from ? from.y : 0) - (to ? to.y : 0));
    }

    function getNearestHouseDistance(x, y, houses = []) {
        if (!Array.isArray(houses) || houses.length === 0) {
            return Infinity;
        }

        return houses.reduce((bestDistance, house) => {
            const houseDistance = house.localCells.reduce((cellBest, cell) => {
                const distance = Math.abs(cell.x - x) + Math.abs(cell.y - y);
                return Math.min(cellBest, distance);
            }, Infinity);

            return Math.min(bestDistance, houseDistance);
        }, Infinity);
    }

    function countTrailNeighbors(chunkData, x, y) {
        return countNeighborsByType(
            chunkData,
            x,
            y,
            (candidate) => candidate === 'trail' || candidate === 'bridge'
        );
    }

    function buildTrailTileSet(chunkData) {
        const trailTiles = new Set();
        const chunkSize = game.config.chunkSize;

        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                if (chunkData[y][x] === 'trail') {
                    trailTiles.add(pointKey(x, y));
                }
            }
        }

        return trailTiles;
    }

    function getCardinalDirections() {
        return [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];
    }

    function getHouseTrailAnchors(houses = []) {
        return houses
            .filter((house) => house && house.door && house.door.localOutside)
            .map((house) => ({
                x: house.door.localOutside.x,
                y: house.door.localOutside.y,
                houseId: house.id
            }));
    }

    function getTravelConnectionTargets(chunkRecord, progression) {
        const painter = getPainter();
        const chunkSize = game.config.chunkSize;
        const center = Math.floor(chunkSize / 2);
        const targets = [];

        painter.getChunkDirections(chunkRecord).forEach((direction) => {
            const laneOffset = painter.getConnectionLaneOffset(chunkRecord, progression, direction);
            const laneX = painter.clampValue(center + laneOffset, 2, chunkSize - 3);
            const laneY = painter.clampValue(center + laneOffset, 2, chunkSize - 3);
            const isBridge = chunkRecord.bridgeDirections.has(direction);

            if (direction === 'north') {
                targets.push({ x: laneX, y: 2, direction, isBridge });
                return;
            }

            if (direction === 'south') {
                targets.push({ x: laneX, y: chunkSize - 3, direction, isBridge });
                return;
            }

            if (direction === 'west') {
                targets.push({ x: 2, y: laneY, direction, isBridge });
                return;
            }

            if (direction === 'east') {
                targets.push({ x: chunkSize - 3, y: laneY, direction, isBridge });
            }
        });

        return targets;
    }

    function getDeadEndBranchCount(chunkRecord, progression) {
        if (!progression || progression.islandIndex < 4) {
            return 0;
        }

        let count = progression.islandIndex >= 8 ? 1 : 0;

        if (chunkRecord.tags.has('remote') || chunkRecord.tags.has('tip')) {
            count += 1;
        }

        if (chunkRecord.tags.has('vault') || progression.routeStyle === 'branching' || progression.scenario === 'trapIsland') {
            count += 1;
        }

        return Math.min(3, count);
    }

    function canPaintDeadEndBranchTile(chunkData, x, y, houseTileSet, houses, reservedKeys) {
        if (!canPaintTravelTile(chunkData, x, y, houseTileSet)) {
            return false;
        }

        if (chunkData[y][x] === 'trail' || chunkData[y][x] === 'bridge') {
            return false;
        }

        if (reservedKeys.has(pointKey(x, y))) {
            return false;
        }

        if (getNearestHouseDistance(x, y, houses) < 2) {
            return false;
        }

        if (countTrailNeighbors(chunkData, x, y) > 1) {
            return false;
        }

        return true;
    }

    function chooseDeadEndCacheSpot(chunkData, endPoint, centerPoint, houseTileSet, houses, reservedKeys, random) {
        const offsets = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
            { dx: 1, dy: 1 },
            { dx: 1, dy: -1 },
            { dx: -1, dy: 1 },
            { dx: -1, dy: -1 }
        ];
        const candidates = [];
        const chunkSize = game.config.chunkSize;

        offsets.forEach((offset) => {
            const x = endPoint.x + offset.dx;
            const y = endPoint.y + offset.dy;

            if (x < 0 || x >= chunkSize || y < 0 || y >= chunkSize) {
                return;
            }

            if (!canPaintTravelTile(chunkData, x, y, houseTileSet)) {
                return;
            }

            if (chunkData[y][x] === 'trail' || chunkData[y][x] === 'bridge') {
                return;
            }

            if (reservedKeys.has(pointKey(x, y)) || getNearestHouseDistance(x, y, houses) < 3) {
                return;
            }

            const trailNeighbors = countTrailNeighbors(chunkData, x, y);
            if (trailNeighbors > 2) {
                return;
            }

            const centerDistance = getPointDistance({ x, y }, centerPoint);
            const endDistance = getPointDistance({ x, y }, endPoint);
            candidates.push({
                x,
                y,
                score: centerDistance * 1.2 + endDistance * 0.8 - trailNeighbors * 0.5 + random() * 0.25
            });
        });

        candidates.sort((left, right) => right.score - left.score);
        return candidates[0] || null;
    }

    function paintDeadEndTrailBranches(chunkData, houses, chunkRecord, progression, houseTileSet, random, centerPoint) {
        const branchCount = getDeadEndBranchCount(chunkRecord, progression);
        const reservedKeys = new Set();
        const trailCandidates = [];
        const chunkSize = game.config.chunkSize;

        if (branchCount <= 0) {
            return [];
        }

        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                if (chunkData[y][x] !== 'trail') {
                    continue;
                }

                const trailNeighbors = countTrailNeighbors(chunkData, x, y);
                const centerDistance = getPointDistance({ x, y }, centerPoint);

                if (trailNeighbors < 2 || centerDistance < 4 || getNearestHouseDistance(x, y, houses) < 2) {
                    continue;
                }

                trailCandidates.push({
                    x,
                    y,
                    score: centerDistance
                        + (chunkRecord.tags.has('remote') || chunkRecord.tags.has('tip') ? 3 : 0)
                        + (chunkRecord.tags.has('vault') ? 2 : 0)
                        + random() * 0.2
                });
            }
        }

        trailCandidates.sort((left, right) => right.score - left.score);

        const branches = [];
        for (const start of trailCandidates) {
            if (branches.length >= branchCount || reservedKeys.has(pointKey(start.x, start.y))) {
                continue;
            }

            const minLength = progression.islandIndex >= 10 ? 3 : 2;
            const maxLength = Math.min(6, 2 + Math.floor(progression.islandIndex / 6) + (chunkRecord.tags.has('vault') ? 1 : 0));
            const branchTiles = [];
            let previous = null;
            let current = { x: start.x, y: start.y };

            for (let step = 0; step < maxLength; step++) {
                const candidates = getCardinalDirections()
                    .map((direction) => {
                        const x = current.x + direction.dx;
                        const y = current.y + direction.dy;

                        if (previous && x === previous.x && y === previous.y) {
                            return null;
                        }

                        if (!canPaintDeadEndBranchTile(chunkData, x, y, houseTileSet, houses, reservedKeys)) {
                            return null;
                        }

                        const edgeDistance = Math.min(x, y, chunkSize - 1 - x, chunkSize - 1 - y);
                        const currentDistance = getPointDistance(current, centerPoint);
                        const nextDistance = getPointDistance({ x, y }, centerPoint);
                        const outwardGain = nextDistance - currentDistance;

                        return {
                            x,
                            y,
                            score: outwardGain * 1.6 + Math.min(edgeDistance, 4) * 0.22 + random() * 0.3
                        };
                    })
                    .filter(Boolean)
                    .sort((left, right) => right.score - left.score);

                if (candidates.length === 0) {
                    break;
                }

                const next = candidates[0];
                const originalType = chunkData[next.y][next.x];

                paintTravelTile(chunkData, next.x, next.y, 'trail', houseTileSet);
                reservedKeys.add(pointKey(next.x, next.y));
                branchTiles.push({
                    x: next.x,
                    y: next.y,
                    originalType
                });
                previous = current;
                current = { x: next.x, y: next.y };
            }

            if (branchTiles.length < minLength) {
                branchTiles.forEach((tile) => {
                    chunkData[tile.y][tile.x] = tile.originalType;
                    reservedKeys.delete(pointKey(tile.x, tile.y));
                });
                continue;
            }

            const endPoint = branchTiles[branchTiles.length - 1];
            const cachePoint = chooseDeadEndCacheSpot(
                chunkData,
                endPoint,
                centerPoint,
                houseTileSet,
                houses,
                reservedKeys,
                random
            ) || { x: endPoint.x, y: endPoint.y };

            reservedKeys.add(pointKey(cachePoint.x, cachePoint.y));
            branches.push({
                start: { x: start.x, y: start.y },
                end: { x: endPoint.x, y: endPoint.y },
                cachePoint
            });
        }

        return branches;
    }

    function paintTravelTrailNetwork(chunkData, houses, chunkRecord, progression, houseTileSet, random) {
        const chunkSize = game.config.chunkSize;
        const center = Math.floor(chunkSize / 2);
        const centerPoint = { x: center, y: center };
        const connectionTargets = getTravelConnectionTargets(chunkRecord, progression);
        const networkAnchors = [{
            x: center,
            y: center,
            anchorType: 'center',
            isBridge: false
        }];

        for (let offsetY = -1; offsetY <= 1; offsetY++) {
            for (let offsetX = -1; offsetX <= 1; offsetX++) {
                if (Math.abs(offsetX) + Math.abs(offsetY) > 1.5) {
                    continue;
                }

                paintTravelTile(chunkData, center + offsetX, center + offsetY, 'trail', houseTileSet);
            }
        }

        connectionTargets.forEach((target) => {
            paintTravelTrailLine(chunkData, center, center, target.x, target.y, houseTileSet);
            networkAnchors.push({
                x: target.x,
                y: target.y,
                anchorType: 'exit',
                isBridge: Boolean(target.isBridge)
            });
        });

        getHouseTrailAnchors(houses)
            .sort((left, right) => getPointDistance(right, centerPoint) - getPointDistance(left, centerPoint))
            .forEach((anchor) => {
                let bestTarget = centerPoint;
                let bestScore = Infinity;

                networkAnchors.forEach((target) => {
                    const distance = getPointDistance(anchor, target);
                    const bridgeBonus = target.isBridge ? 0.9 : 0;
                    const chainedDoorBonus = target.anchorType === 'door' ? 0.35 : 0;
                    const centerPenalty = target.anchorType === 'center' && networkAnchors.length > 2 ? 0.25 : 0;
                    const score = distance - bridgeBonus - chainedDoorBonus + centerPenalty;

                    if (score < bestScore) {
                        bestScore = score;
                        bestTarget = target;
                    }
                });

                paintTravelTrailLine(
                    chunkData,
                    anchor.x,
                    anchor.y,
                    bestTarget.x,
                    bestTarget.y,
                    houseTileSet
                );

                networkAnchors.push({
                    x: anchor.x,
                    y: anchor.y,
                    anchorType: 'door',
                    isBridge: false,
                    houseId: anchor.houseId
                });
            });

        const deadEndBranches = paintDeadEndTrailBranches(
            chunkData,
            houses,
            chunkRecord,
            progression,
            houseTileSet,
            random,
            centerPoint
        );

        return {
            center: centerPoint,
            connectionTargets: connectionTargets.map((target) => ({ ...target })),
            houseAnchors: getHouseTrailAnchors(houses),
            deadEndBranches
        };
    }

    function applyTravelTerrainLayer(chunkData, houses, chunkRecord, progression, random) {
        const chunkSize = game.config.chunkSize;
        const center = Math.floor(chunkSize / 2);
        const islandIndex = progression ? progression.islandIndex : 1;
        const houseTileSet = getHouseCellSet(houses);
        const remoteBias = chunkRecord.tags.has('remote') || chunkRecord.tags.has('peninsula') || chunkRecord.tags.has('tip')
            ? 0.14
            : 0;
        const bottleneckBias = chunkRecord.tags.has('neck') || (progression && progression.routeStyle === 'bottleneck')
            ? 0.16
            : 0;
        const ruggedBias = chunkRecord.tags.has('junction') ? 0.08 : 0;

        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                if (!canPaintTravelTile(chunkData, x, y, houseTileSet)) {
                    continue;
                }

                const tileType = chunkData[y][x];
                const edgeDistance = Math.min(x, y, chunkSize - 1 - x, chunkSize - 1 - y);
                const centerDistance = Math.abs(x - center) + Math.abs(y - center);
                const waterNeighbors = countNeighborsByType(chunkData, x, y, (candidate) => candidate === 'water', true);
                const rockNeighbors = countNeighborsByType(chunkData, x, y, (candidate) => candidate === 'rock', true);

                if (
                    islandIndex >= 6
                    && tileType !== 'trail'
                    && waterNeighbors >= 2
                    && centerDistance >= 7
                    && random() < 0.1 + remoteBias + bottleneckBias
                ) {
                    chunkData[y][x] = 'mud';
                    continue;
                }

                if (
                    islandIndex >= 4
                    && tileType !== 'trail'
                    && rockNeighbors >= 1
                    && waterNeighbors <= 2
                    && random() < 0.22 + bottleneckBias + ruggedBias
                ) {
                    chunkData[y][x] = 'rubble';
                    continue;
                }

                if (
                    islandIndex >= 3
                    && tileType === 'shore'
                    && waterNeighbors >= 2
                    && edgeDistance >= 1
                    && random() < 0.34 + remoteBias
                ) {
                    chunkData[y][x] = 'reeds';
                }
            }
        }

        return paintTravelTrailNetwork(chunkData, houses, chunkRecord, progression, houseTileSet, random);
    }

    function applyTravelZoneLayer(chunkData, travelZones, houses, chunkRecord, progression, random) {
        const chunkSize = game.config.chunkSize;
        const center = Math.floor(chunkSize / 2);
        const islandIndex = progression ? progression.islandIndex : 1;
        const houseTileSet = getHouseCellSet(houses);
        const expedition = game.systems.expedition;
        const island = progression ? expedition.getIslandRecord(progression.islandIndex) : null;
        const fragileBridgeIsland = Boolean(
            progression
            && progression.islandIndex > 2
            && island
            && island.exitChunkKeys
            && island.exitChunkKeys.size >= 3
        );
        const remoteBias = chunkRecord.tags.has('remote') || chunkRecord.tags.has('peninsula') || chunkRecord.tags.has('tip')
            ? 0.14
            : 0;
        const bottleneckBias = chunkRecord.tags.has('neck') || (progression && progression.routeStyle === 'bottleneck')
            ? 0.16
            : 0;

        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                if (!canAssignTravelZone(chunkData, x, y, houseTileSet)) {
                    continue;
                }

                const tileType = chunkData[y][x];
                const centerDistance = Math.abs(x - center) + Math.abs(y - center);
                const edgeDistance = Math.min(x, y, chunkSize - 1 - x, chunkSize - 1 - y);
                const waterNeighbors = countNeighborsByType(chunkData, x, y, (candidate) => candidate === 'water', true);
                const rockNeighbors = countNeighborsByType(chunkData, x, y, (candidate) => candidate === 'rock', true);

                if (tileType === 'bridge') {
                    if (fragileBridgeIsland) {
                        assignTravelZone(travelZones, chunkData, x, y, 'collapseSpan', houseTileSet);
                    } else if (islandIndex >= 4 && random() < 0.42) {
                        assignTravelZone(travelZones, chunkData, x, y, 'oldBridge', houseTileSet);
                    }
                }

                if (tileType === 'trail' && islandIndex >= 2 && random() < 0.18) {
                    assignTravelZone(travelZones, chunkData, x, y, 'dryTrail', houseTileSet);
                }

                if (
                    tileType === 'shore'
                    && islandIndex >= 5
                    && waterNeighbors >= 2
                    && (chunkRecord.tags.has('neck') || chunkRecord.tags.has('peninsula') || edgeDistance <= 2)
                    && random() < 0.18 + remoteBias
                ) {
                    assignTravelZone(travelZones, chunkData, x, y, 'coldFord', houseTileSet);
                }

                if (
                    (tileType === 'mud' || tileType === 'reeds')
                    && islandIndex >= 6
                    && waterNeighbors >= 2
                    && random() < 0.2 + remoteBias + bottleneckBias
                ) {
                    assignTravelZone(travelZones, chunkData, x, y, 'drainingLowland', houseTileSet);
                }

                if (tileType === 'mud' && islandIndex >= 8 && random() < 0.2 + remoteBias) {
                    assignTravelZone(travelZones, chunkData, x, y, 'deepMud', houseTileSet);
                }

                if (
                    tileType === 'reeds'
                    && islandIndex >= 5
                    && waterNeighbors >= 3
                    && random() < 0.24 + remoteBias
                ) {
                    assignTravelZone(travelZones, chunkData, x, y, 'swamp', houseTileSet);
                }

                if (
                    rockNeighbors >= 1
                    && islandIndex >= 4
                    && (chunkRecord.tags.has('neck') || progression.routeStyle === 'bottleneck' || chunkRecord.tags.has('junction'))
                    && random() < 0.22 + bottleneckBias
                ) {
                    assignTravelZone(travelZones, chunkData, x, y, 'dangerPass', houseTileSet);
                }

                if (
                    islandIndex >= 7
                    && (chunkRecord.tags.has('remote') || chunkRecord.tags.has('tip'))
                    && centerDistance >= 8
                    && random() < 0.16 + remoteBias
                ) {
                    assignTravelZone(travelZones, chunkData, x, y, 'badSector', houseTileSet);
                }

                if (
                    tileType === 'trail'
                    && islandIndex >= 9
                    && (chunkRecord.tags.has('vault') || chunkRecord.tags.has('remote'))
                    && centerDistance >= 6
                    && random() < 0.14 + remoteBias
                ) {
                    assignTravelZone(travelZones, chunkData, x, y, 'cursedTrail', houseTileSet);
                }

                if (
                    islandIndex >= 10
                    && centerDistance >= 7
                    && waterNeighbors >= 1
                    && random() < 0.12 + remoteBias + bottleneckBias
                ) {
                    assignTravelZone(travelZones, chunkData, x, y, 'drainZone', houseTileSet);
                }

                if (
                    fragileBridgeIsland
                    && tileType !== 'bridge'
                    && countNeighborsByType(chunkData, x, y, (candidate) => candidate === 'bridge', true) >= 1
                ) {
                    assignTravelZone(travelZones, chunkData, x, y, 'riskyProximity', houseTileSet);
                }
            }
        }

        houses.forEach((house) => {
            if (!house || !house.door || !house.door.localOutside) {
                return;
            }

            if (islandIndex >= 3 && random() < 0.72) {
                for (let offsetY = -1; offsetY <= 1; offsetY++) {
                    for (let offsetX = -1; offsetX <= 1; offsetX++) {
                        if (Math.abs(offsetX) + Math.abs(offsetY) > 1.5) {
                            continue;
                        }

                        assignTravelZone(
                            travelZones,
                            chunkData,
                            house.door.localOutside.x + offsetX,
                            house.door.localOutside.y + offsetY,
                            'houseDebris',
                            houseTileSet
                        );
                    }
                }
            }

            if (
                islandIndex >= 6
                && house.expedition
                && (
                    house.expedition.kind === 'jackpotChest'
                    || house.expedition.kind === 'finalChest'
                    || (
                        house.expedition.kind === 'chest'
                        && (
                            house.expedition.chestTier === 'elite'
                            || house.expedition.chestTier === 'jackpot'
                            || house.expedition.chestTier === 'cursed'
                            || random() < 0.35
                        )
                    )
                )
            ) {
                for (let offsetY = -2; offsetY <= 2; offsetY++) {
                    for (let offsetX = -2; offsetX <= 2; offsetX++) {
                        if (Math.abs(offsetX) + Math.abs(offsetY) > 3) {
                            continue;
                        }

                        assignTravelZone(
                            travelZones,
                            chunkData,
                            house.door.localOutside.x + offsetX,
                            house.door.localOutside.y + offsetY,
                            'riskyProximity',
                            houseTileSet
                        );
                    }
                }
            }
        });

        clearTravelZoneArea(travelZones, center, center, 1);
    }

    function buildHouseTileMap(houses) {
        const map = new Map();

        houses.forEach((house) => {
            house.localCells.forEach((cell) => {
                map.set(`${cell.x},${cell.y}`, house);
            });
        });

        return map;
    }

    function buildInteractionTileMap(interactions) {
        return game.systems.interactions.buildInteractionTileMap(interactions || []);
    }

    function createOceanChunk(chunkX, chunkY) {
        const painter = getPainter();

        return game.systems.world.storeChunk({
            x: chunkX,
            y: chunkY,
            data: painter.buildChunkGrid('water'),
            travelZones: painter.buildTravelZoneGrid(),
            houses: [],
            houseTileMap: new Map(),
            interactions: [],
            interactionTileMap: new Map(),
            trailMeta: null,
            progression: null,
            renderCache: null
        });
    }

    function generateChunk(chunkX, chunkY) {
        const painter = getPainter();
        const world = game.systems.world;
        const existingChunk = world.getChunk(chunkX, chunkY, { generateIfMissing: false });

        if (existingChunk) {
            return existingChunk;
        }

        const expedition = game.systems.expedition;
        const chunkRecord = expedition.getIslandChunkRecord(chunkX, chunkY);

        if (!chunkRecord) {
            return createOceanChunk(chunkX, chunkY);
        }

        const islandRecord = expedition.getIslandRecord(chunkRecord.islandIndex);
        const progression = islandRecord ? islandRecord.progression : null;
        const random = game.systems.utils.createSeededRandom(chunkX, chunkY);
        const chunkData = painter.buildChunkGrid('water');

        painter.paintIslandBody(chunkData, chunkRecord, progression, random);
        painter.addChunkConnections(chunkData, chunkRecord, progression);
        painter.carveTopologyFeatures(chunkData, chunkRecord, progression, random);
        painter.addChunkConnections(chunkData, chunkRecord, progression);
        painter.ensureSpawnArea(chunkData, chunkX, chunkY);

        const houses = game.systems.houses.createChunkHouses(chunkX, chunkY, chunkData, random, progression, chunkRecord);
        houses.forEach((house, houseIndex) => {
            expedition.assignHouseProfile(house, progression, chunkRecord, houseIndex);
        });

        painter.addRandomRocks(chunkData, houses, progression, random);
        painter.addChunkConnections(chunkData, chunkRecord, progression);
        painter.addShoreline(chunkData);
        const trailMeta = applyTravelTerrainLayer(chunkData, houses, chunkRecord, progression, random);
        painter.ensureSpawnArea(chunkData, chunkX, chunkY);
        const travelZones = painter.buildTravelZoneGrid();
        applyTravelZoneLayer(chunkData, travelZones, houses, chunkRecord, progression, random);
        const interactions = game.systems.interactions.createChunkInteractions(
            chunkX,
            chunkY,
            chunkData,
            houses,
            random,
            {
                progression,
                chunkRecord,
                trailMeta
            }
        );
        expedition.applyCollapsedBridges(chunkData, travelZones, chunkX, chunkY);
        expedition.applyPlacedBridges(chunkData, chunkX, chunkY);
        expedition.applyWeakenedBridges(chunkData, travelZones, chunkX, chunkY);

        const chunk = {
            x: chunkX,
            y: chunkY,
            data: chunkData,
            travelZones,
            houses,
            houseTileMap: buildHouseTileMap(houses),
            interactions,
            interactionTileMap: buildInteractionTileMap(interactions),
            trailMeta,
            progression,
            renderCache: null
        };

        return world.storeChunk(chunk);
    }

    Object.assign(chunkGenerator, {
        getHouseCellSet,
        canAssignTravelZone,
        assignTravelZone,
        clearTravelZoneArea,
        isDecoratableTravelTile,
        countNeighborsByType,
        canPaintTravelTile,
        paintTravelTile,
        paintTravelTrailLine,
        getTravelConnectionTargets,
        paintTravelTrailNetwork,
        applyTravelTerrainLayer,
        applyTravelZoneLayer,
        buildHouseTileMap,
        buildInteractionTileMap,
        createOceanChunk,
        generateChunk
    });

    game.systems.map = game.systems.map || {};
    game.systems.map.topologyPainter = game.systems.topologyPainter || null;
    game.systems.map.chunkGenerator = chunkGenerator;
    game.systems.generateChunk = (...args) => chunkGenerator.generateChunk(...args);
})();
