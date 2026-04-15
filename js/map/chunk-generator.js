(() => {
    const game = window.Game;
    const chunkGenerator = game.systems.chunkGenerator = game.systems.chunkGenerator || {};
    const MAX_HEAVY_CHUNKS_PER_TICK = 1;
    const MAX_STAGE_CACHE_ENTRIES = 48;
    const GENERATION_QUEUE_FLUSH_DELAY_MS = 0;
    const generationBasisCache = {
        topology: new Map(),
        structures: new Map(),
        travel: new Map()
    };
    const generationQueue = [];
    const queuedGenerationTasks = new Map();
    let generationQueueRequestId = null;
    let nextGenerationTaskId = 1;

    function getPainter() {
        return game.systems.topologyPainter || {};
    }

    function getGenerationCacheKey(chunkX, chunkY) {
        return `${Number.isFinite(game.config.worldSeed) ? game.config.worldSeed : 'seedless'}:${chunkX},${chunkY}`;
    }

    function cloneGenerationValue(value) {
        if (Array.isArray(value)) {
            return value.map((entry) => cloneGenerationValue(entry));
        }

        if (value instanceof Set) {
            return new Set(Array.from(value).map((entry) => cloneGenerationValue(entry)));
        }

        if (value instanceof Map) {
            return new Map(Array.from(value.entries()).map(([key, entry]) => [key, cloneGenerationValue(entry)]));
        }

        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value).map(([key, entry]) => [key, cloneGenerationValue(entry)])
            );
        }

        return value;
    }

    function getCachedBasis(cache, cacheKey) {
        if (!cache.has(cacheKey)) {
            return null;
        }

        const cachedValue = cache.get(cacheKey);
        cache.delete(cacheKey);
        cache.set(cacheKey, cachedValue);
        return cloneGenerationValue(cachedValue);
    }

    function setCachedBasis(cache, cacheKey, value) {
        cache.delete(cacheKey);
        cache.set(cacheKey, cloneGenerationValue(value));

        while (cache.size > MAX_STAGE_CACHE_ENTRIES) {
            const oldestKey = cache.keys().next();

            if (oldestKey.done) {
                return;
            }

            cache.delete(oldestKey.value);
        }
    }

    function createMetricGrid(fill = 0) {
        return Array.from(
            { length: game.config.chunkSize },
            () => Array(game.config.chunkSize).fill(fill)
        );
    }

    function buildChunkGenerationMaps(chunkData) {
        const chunkSize = game.config.chunkSize;
        const center = Math.floor(chunkSize / 2);
        const edgeDistance = createMetricGrid(0);
        const centerDistance = createMetricGrid(0);
        const waterNeighbors = createMetricGrid(0);
        const rockNeighbors = createMetricGrid(0);
        const bridgeNeighbors = createMetricGrid(0);
        const directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
            { dx: 1, dy: 1 },
            { dx: 1, dy: -1 },
            { dx: -1, dy: 1 },
            { dx: -1, dy: -1 }
        ];

        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                edgeDistance[y][x] = Math.min(x, y, chunkSize - 1 - x, chunkSize - 1 - y);
                centerDistance[y][x] = Math.abs(x - center) + Math.abs(y - center);

                directions.forEach((direction) => {
                    const nextX = x + direction.dx;
                    const nextY = y + direction.dy;

                    if (nextX < 0 || nextX >= chunkSize || nextY < 0 || nextY >= chunkSize) {
                        return;
                    }

                    const neighborTile = chunkData[nextY][nextX];

                    if (neighborTile === 'water') {
                        waterNeighbors[y][x] += 1;
                    }

                    if (neighborTile === 'rock') {
                        rockNeighbors[y][x] += 1;
                    }

                    if (neighborTile === 'bridge') {
                        bridgeNeighbors[y][x] += 1;
                    }
                });
            }
        }

        return {
            edgeDistance,
            centerDistance,
            waterNeighbors,
            rockNeighbors,
            bridgeNeighbors
        };
    }

    function normalizeGenerationPriority(priority = 'normal') {
        if (priority === 'high') {
            return 2;
        }

        if (priority === 'low') {
            return 0;
        }

        return 1;
    }

    function normalizeGenerationDetail(detailLevel = 'full') {
        return detailLevel === 'base' ? 'base' : 'full';
    }

    function getGenerationDetailRank(detailLevel = 'base') {
        return normalizeGenerationDetail(detailLevel) === 'full' ? 2 : 1;
    }

    function mergeGenerationDetails(leftDetail = 'base', rightDetail = 'base') {
        return getGenerationDetailRank(leftDetail) >= getGenerationDetailRank(rightDetail)
            ? normalizeGenerationDetail(leftDetail)
            : normalizeGenerationDetail(rightDetail);
    }

    function createStageRandom(chunkX, chunkY, stageSalt = 0) {
        const salt = Math.max(1, Math.floor(Number(stageSalt) || 0) + 1);
        return game.systems.utils.createSeededRandom(
            chunkX * 131 + salt * 977,
            chunkY * -149 - salt * 613
        );
    }

    function getQueuedGenerationKey(chunkX, chunkY) {
        return `${chunkX},${chunkY}`;
    }

    function scheduleGenerationQueueFlush() {
        if (generationQueueRequestId) {
            return;
        }

        generationQueueRequestId = window.setTimeout(flushGenerationQueue, GENERATION_QUEUE_FLUSH_DELAY_MS);
    }

    function resetGenerationRuntime(options = {}) {
        const clearCaches = options.clearCaches !== false;

        if (generationQueueRequestId) {
            window.clearTimeout(generationQueueRequestId);
            generationQueueRequestId = null;
        }

        generationQueue.length = 0;
        queuedGenerationTasks.clear();
        nextGenerationTaskId = 1;

        if (clearCaches) {
            generationBasisCache.topology.clear();
            generationBasisCache.structures.clear();
            generationBasisCache.travel.clear();
        }
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

    function getBridgeConnectionLane(chunkRecord, progression, direction) {
        const painter = getPainter();
        const chunkSize = game.config.chunkSize;
        const center = Math.floor(chunkSize / 2);
        const rawLaneOffset = painter && typeof painter.getConnectionLaneOffset === 'function'
            ? painter.getConnectionLaneOffset(chunkRecord, progression, direction)
            : 0;
        const normalizedLaneOffset = painter && typeof painter.clampValue === 'function'
            ? painter.clampValue(Math.round(rawLaneOffset * 0.65), -5, 5)
            : Math.max(-5, Math.min(5, Math.round(rawLaneOffset * 0.65)));

        return painter && typeof painter.clampValue === 'function'
            ? painter.clampValue(center + normalizedLaneOffset, 2, chunkSize - 3)
            : Math.max(2, Math.min(chunkSize - 3, center + normalizedLaneOffset));
    }

    function getCrossingIslandBreakSites(chunkRecord, progression) {
        if (
            !chunkRecord
            || !progression
            || progression.scenario !== 'crossingIsland'
            || !chunkRecord.tags
            || !chunkRecord.tags.has('entry')
            || !(chunkRecord.bridgeDirections instanceof Set)
            || chunkRecord.bridgeDirections.size === 0
        ) {
            return [];
        }

        return Array.from(chunkRecord.bridgeDirections)
            .sort()
            .map((direction) => {
                const lane = getBridgeConnectionLane(chunkRecord, progression, direction);

                if (direction === 'north') {
                    return { direction, localX: lane, localY: 0 };
                }

                if (direction === 'south') {
                    return { direction, localX: lane, localY: game.config.chunkSize - 1 };
                }

                if (direction === 'west') {
                    return { direction, localX: 0, localY: lane };
                }

                if (direction === 'east') {
                    return { direction, localX: game.config.chunkSize - 1, localY: lane };
                }

                return null;
            })
            .filter(Boolean);
    }

    function applyCrossingIslandForcedBridgeBreaks(chunkData, chunkRecord, progression) {
        const breakSites = getCrossingIslandBreakSites(chunkRecord, progression);

        breakSites.forEach((site) => {
            if (!chunkData[site.localY] || chunkData[site.localY][site.localX] !== 'bridge') {
                return;
            }

            chunkData[site.localY][site.localX] = 'water';
        });

        return breakSites;
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

    function applyTravelTerrainLayer(chunkData, houses, chunkRecord, progression, random, stageMaps = buildChunkGenerationMaps(chunkData)) {
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
        const supplyWaterBias = chunkRecord.tags.has('supplyWater') ? 0.16 : 0;
        const supplyFishingBias = chunkRecord.tags.has('supplyFishing') ? 0.18 : 0;
        const supplyWoodBias = chunkRecord.tags.has('supplyWood') ? 0.1 : 0;
        const supplyRubbleBias = chunkRecord.tags.has('supplyRubble') ? 0.18 : 0;

        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                if (!canPaintTravelTile(chunkData, x, y, houseTileSet)) {
                    continue;
                }

                const tileType = chunkData[y][x];
                const edgeDistance = stageMaps.edgeDistance[y][x];
                const centerDistance = stageMaps.centerDistance[y][x];
                const waterNeighbors = stageMaps.waterNeighbors[y][x];
                const rockNeighbors = stageMaps.rockNeighbors[y][x];

                if (
                    islandIndex >= 6
                    && tileType !== 'trail'
                    && waterNeighbors >= 2
                    && centerDistance >= 7
                    && random() < Math.max(0.03, 0.1 + remoteBias + bottleneckBias - supplyFishingBias * 0.45 - supplyWoodBias * 0.35)
                ) {
                    chunkData[y][x] = 'mud';
                    continue;
                }

                if (
                    islandIndex >= 4
                    && tileType !== 'trail'
                    && rockNeighbors >= 1
                    && waterNeighbors <= 2
                    && random() < 0.22 + bottleneckBias + ruggedBias + supplyRubbleBias
                ) {
                    chunkData[y][x] = 'rubble';
                    continue;
                }

                if (
                    islandIndex >= 3
                    && tileType === 'shore'
                    && waterNeighbors >= 2
                    && edgeDistance >= 1
                    && random() < 0.34 + remoteBias + supplyWaterBias + supplyFishingBias
                ) {
                    chunkData[y][x] = 'reeds';
                }
            }
        }

        return paintTravelTrailNetwork(chunkData, houses, chunkRecord, progression, houseTileSet, random);
    }

    function applyTravelZoneLayer(chunkData, travelZones, houses, chunkRecord, progression, random, stageMaps = buildChunkGenerationMaps(chunkData)) {
        const chunkSize = game.config.chunkSize;
        const center = Math.floor(chunkSize / 2);
        const islandIndex = progression ? progression.islandIndex : 1;
        const houseTileSet = getHouseCellSet(houses);
        const expedition = game.systems.expedition;
        const island = progression ? expedition.getIslandRecord(progression.islandIndex) : null;
        const crossingPressureLevel = progression && progression.scenario === 'crossingIsland'
            ? Math.max(1, Math.floor(progression.crossingPressureLevel || 1))
            : 0;
        const fragileBridgeIsland = Boolean(
            progression
            && progression.islandIndex > 2
            && island
            && island.exitChunkKeys
            && (island.exitChunkKeys.size >= 3 || crossingPressureLevel > 0)
        );
        const remoteBias = chunkRecord.tags.has('remote') || chunkRecord.tags.has('peninsula') || chunkRecord.tags.has('tip')
            ? 0.14
            : 0;
        const bottleneckBias = chunkRecord.tags.has('neck') || (progression && progression.routeStyle === 'bottleneck')
            ? 0.16
            : 0;
        const supplyRubbleBias = chunkRecord.tags.has('supplyRubble') ? 0.14 : 0;
        const crossingBias = crossingPressureLevel > 0
            ? 0.12 + crossingPressureLevel * 0.05
            : 0;

        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                if (!canAssignTravelZone(chunkData, x, y, houseTileSet)) {
                    continue;
                }

                const tileType = chunkData[y][x];
                const centerDistance = stageMaps.centerDistance[y][x];
                const edgeDistance = stageMaps.edgeDistance[y][x];
                const waterNeighbors = stageMaps.waterNeighbors[y][x];
                const rockNeighbors = stageMaps.rockNeighbors[y][x];

                if (tileType === 'bridge') {
                    if (crossingPressureLevel > 0) {
                        assignTravelZone(
                            travelZones,
                            chunkData,
                            x,
                            y,
                            random() < 0.42 + crossingPressureLevel * 0.08 ? 'collapseSpan' : 'oldBridge',
                            houseTileSet
                        );
                    } else if (fragileBridgeIsland) {
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
                    && random() < 0.18 + remoteBias + crossingBias
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
                    && random() < 0.22 + bottleneckBias + supplyRubbleBias + crossingBias * 0.45
                ) {
                    assignTravelZone(travelZones, chunkData, x, y, 'dangerPass', houseTileSet);
                }

                if (
                    islandIndex >= 7
                    && (chunkRecord.tags.has('remote') || chunkRecord.tags.has('tip') || chunkRecord.tags.has('supplyRubble'))
                    && centerDistance >= 8
                    && random() < 0.16 + remoteBias + supplyRubbleBias
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
                    && stageMaps.bridgeNeighbors[y][x] >= 1
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

    function buildGenerationContext(chunkX, chunkY, chunkRecord = null) {
        const expedition = game.systems.expedition;
        const resolvedChunkRecord = chunkRecord || expedition.getIslandChunkRecord(chunkX, chunkY);
        const islandRecord = resolvedChunkRecord ? expedition.getIslandRecord(resolvedChunkRecord.islandIndex) : null;

        return {
            chunkX,
            chunkY,
            cacheKey: getGenerationCacheKey(chunkX, chunkY),
            painter: getPainter(),
            expedition,
            chunkRecord: resolvedChunkRecord,
            progression: islandRecord ? islandRecord.progression : null,
            chunkData: null,
            houses: [],
            trailMeta: null,
            travelZones: null,
            interactions: [],
            stageMaps: null,
            topologyReady: false,
            structuresReady: false,
            travelReady: false
        };
    }

    function runTopologyStage(context) {
        if (!context || context.topologyReady) {
            return context;
        }

        const cachedBasis = getCachedBasis(generationBasisCache.topology, context.cacheKey);

        if (cachedBasis && Array.isArray(cachedBasis.chunkData)) {
            context.chunkData = cachedBasis.chunkData;
            context.topologyReady = true;
            return context;
        }

        const { painter, chunkData, chunkRecord, progression, chunkX, chunkY } = {
            painter: context.painter,
            chunkData: context.painter.buildChunkGrid('water'),
            chunkRecord: context.chunkRecord,
            progression: context.progression,
            chunkX: context.chunkX,
            chunkY: context.chunkY
        };
        const random = createStageRandom(chunkX, chunkY, 0);

        painter.paintIslandBody(chunkData, chunkRecord, progression, random);
        painter.addChunkConnections(chunkData, chunkRecord, progression);
        painter.carveTopologyFeatures(chunkData, chunkRecord, progression, random);
        painter.addChunkConnections(chunkData, chunkRecord, progression);
        painter.ensureSpawnArea(chunkData, chunkX, chunkY);

        context.chunkData = chunkData;
        context.topologyReady = true;
        setCachedBasis(generationBasisCache.topology, context.cacheKey, {
            chunkData
        });
        return context;
    }

    function runStructuresStage(context) {
        if (!context) {
            return context;
        }

        if (context.structuresReady) {
            return context;
        }

        const cachedBasis = getCachedBasis(generationBasisCache.structures, context.cacheKey);

        if (cachedBasis && Array.isArray(cachedBasis.chunkData) && Array.isArray(cachedBasis.houses)) {
            context.chunkData = cachedBasis.chunkData;
            context.houses = cachedBasis.houses;
            context.topologyReady = true;
            context.structuresReady = true;
            return context;
        }

        runTopologyStage(context);

        const random = createStageRandom(context.chunkX, context.chunkY, 1);
        const houses = game.systems.houses.createChunkHouses(
            context.chunkX,
            context.chunkY,
            context.chunkData,
            random,
            context.progression,
            context.chunkRecord
        );

        houses.forEach((house, houseIndex) => {
            context.expedition.assignHouseProfile(house, context.progression, context.chunkRecord, houseIndex);
        });

        context.painter.addRandomRocks(context.chunkData, houses, context.progression, random);
        context.painter.addChunkConnections(context.chunkData, context.chunkRecord, context.progression);
        context.painter.addShoreline(context.chunkData);

        context.houses = houses;
        context.structuresReady = true;
        setCachedBasis(generationBasisCache.structures, context.cacheKey, {
            chunkData: context.chunkData,
            houses
        });
        return context;
    }

    function runTravelStage(context) {
        if (!context) {
            return context;
        }

        if (context.travelReady) {
            return context;
        }

        const cachedBasis = getCachedBasis(generationBasisCache.travel, context.cacheKey);

        if (cachedBasis && Array.isArray(cachedBasis.chunkData) && Array.isArray(cachedBasis.travelZones)) {
            context.chunkData = cachedBasis.chunkData;
            context.houses = Array.isArray(cachedBasis.houses) ? cachedBasis.houses : [];
            context.trailMeta = cachedBasis.trailMeta || null;
            context.travelZones = cachedBasis.travelZones;
            context.stageMaps = buildChunkGenerationMaps(context.chunkData);
            context.topologyReady = true;
            context.structuresReady = true;
            context.travelReady = true;
            return context;
        }

        runStructuresStage(context);

        const random = createStageRandom(context.chunkX, context.chunkY, 2);
        let stageMaps = buildChunkGenerationMaps(context.chunkData);
        const trailMeta = applyTravelTerrainLayer(
            context.chunkData,
            context.houses,
            context.chunkRecord,
            context.progression,
            random,
            stageMaps
        );

        context.painter.ensureSpawnArea(context.chunkData, context.chunkX, context.chunkY);
        applyCrossingIslandForcedBridgeBreaks(context.chunkData, context.chunkRecord, context.progression);
        stageMaps = buildChunkGenerationMaps(context.chunkData);

        const travelZones = context.painter.buildTravelZoneGrid();
        applyTravelZoneLayer(
            context.chunkData,
            travelZones,
            context.houses,
            context.chunkRecord,
            context.progression,
            random,
            stageMaps
        );

        context.trailMeta = trailMeta;
        context.travelZones = travelZones;
        context.stageMaps = stageMaps;
        context.travelReady = true;

        setCachedBasis(generationBasisCache.travel, context.cacheKey, {
            chunkData: context.chunkData,
            houses: context.houses,
            trailMeta,
            travelZones
        });
        return context;
    }

    function buildInteractionSet(context, detailLevel = 'base') {
        runTravelStage(context);

        return game.systems.interactions.createChunkInteractions(
            context.chunkX,
            context.chunkY,
            context.chunkData,
            context.houses,
            createStageRandom(context.chunkX, context.chunkY, 3),
            {
                progression: context.progression,
                chunkRecord: context.chunkRecord,
                trailMeta: context.trailMeta,
                travelZones: context.travelZones,
                interactionMode: normalizeGenerationDetail(detailLevel) === 'full' ? 'full' : 'base'
            }
        );
    }

    function runInteractionStage(context, detailLevel = 'base') {
        if (!context) {
            return context;
        }

        context.interactions = buildInteractionSet(context, detailLevel);
        return context;
    }

    function applyChunkBridgeState(context) {
        if (!context || !context.chunkRecord) {
            return context;
        }

        context.expedition.applyCollapsedBridges(context.chunkData, context.travelZones, context.chunkX, context.chunkY);
        context.expedition.applyPlacedBridges(context.chunkData, context.chunkX, context.chunkY);
        context.expedition.applyWeakenedBridges(context.chunkData, context.travelZones, context.chunkX, context.chunkY);
        return context;
    }

    function buildChunkRecordFromContext(context, detailLevel = 'base') {
        return {
            x: context.chunkX,
            y: context.chunkY,
            data: context.chunkData,
            travelZones: context.travelZones,
            houses: context.houses,
            houseTileMap: buildHouseTileMap(context.houses),
            interactions: context.interactions,
            interactionTileMap: buildInteractionTileMap(context.interactions),
            trailMeta: context.trailMeta,
            progression: context.progression,
            renderCache: null,
            entityVersion: 0,
            generationStage: 'finalized',
            generationDetail: normalizeGenerationDetail(detailLevel),
            pendingGenerationDetail: null
        };
    }

    function runFinalizationStage(context, detailLevel = 'base') {
        applyChunkBridgeState(context);
        return buildChunkRecordFromContext(context, detailLevel);
    }

    function invalidateChunkPathfindingAndRender(chunk, options = {}) {
        if (!chunk) {
            return;
        }

        const chunkRenderer = game.systems.chunkRenderer || null;
        if (options.entitiesOnly) {
            chunk.entityVersion = Number(chunk.entityVersion || 0) + 1;
        } else {
            if (chunkRenderer && typeof chunkRenderer.invalidateChunkRenderCache === 'function') {
                chunkRenderer.invalidateChunkRenderCache(chunk, {
                    reset: true,
                    reason: options.reason || 'chunkGenerator'
                });
            } else {
                chunk.renderCache = null;
            }
        }

        const pathfinding = game.systems.pathfinding || null;
        if (pathfinding && typeof pathfinding.invalidateCaches === 'function') {
            pathfinding.invalidateCaches();
        }

        const render = game.systems.render || null;
        if (render && typeof render.markSceneLayersDirty === 'function') {
            render.markSceneLayersDirty(
                options.entitiesOnly
                    ? { entities: true, overlay: true }
                    : { world: true, entities: true, overlay: true }
            );
        }
    }

    function completeDeferredChunkGeneration(chunk) {
        if (!chunk) {
            return null;
        }

        if (getGenerationDetailRank(chunk.generationDetail || 'base') >= getGenerationDetailRank('full')) {
            chunk.pendingGenerationDetail = null;
            return chunk;
        }

        const expedition = game.systems.expedition;
        const chunkRecord = expedition.getIslandChunkRecord(chunk.x, chunk.y);

        if (!chunkRecord) {
            chunk.generationDetail = 'full';
            chunk.pendingGenerationDetail = null;
            return chunk;
        }

        const context = buildGenerationContext(chunk.x, chunk.y, chunkRecord);
        context.chunkData = chunk.data;
        context.houses = Array.isArray(chunk.houses) ? chunk.houses : [];
        context.trailMeta = chunk.trailMeta || null;
        context.travelZones = Array.isArray(chunk.travelZones) ? chunk.travelZones : context.painter.buildTravelZoneGrid();
        context.topologyReady = true;
        context.structuresReady = true;
        context.travelReady = true;

        runInteractionStage(context, 'full');

        chunk.interactions = context.interactions;
        chunk.interactionTileMap = buildInteractionTileMap(context.interactions);
        chunk.generationDetail = 'full';
        chunk.pendingGenerationDetail = null;
        invalidateChunkPathfindingAndRender(chunk, { entitiesOnly: true });
        return chunk;
    }

    function queueChunkGeneration(chunkX, chunkY, options = {}) {
        const detailLevel = normalizeGenerationDetail(options.detailLevel || 'full');
        const priority = normalizeGenerationPriority(options.priority);
        const taskKey = getQueuedGenerationKey(chunkX, chunkY);
        const existingChunk = game.systems.world.getChunk(chunkX, chunkY, { generateIfMissing: false });

        if (existingChunk && getGenerationDetailRank(existingChunk.generationDetail || 'base') >= getGenerationDetailRank(detailLevel)) {
            existingChunk.pendingGenerationDetail = null;
            return existingChunk;
        }

        if (existingChunk) {
            existingChunk.pendingGenerationDetail = mergeGenerationDetails(existingChunk.pendingGenerationDetail || 'base', detailLevel);
        }

        const existingTask = queuedGenerationTasks.get(taskKey);

        if (existingTask) {
            existingTask.detailLevel = mergeGenerationDetails(existingTask.detailLevel, detailLevel);
            existingTask.priority = Math.max(existingTask.priority, priority);
            scheduleGenerationQueueFlush();
            return existingChunk;
        }

        const task = {
            key: taskKey,
            chunkX,
            chunkY,
            detailLevel,
            priority,
            sequence: nextGenerationTaskId++
        };

        generationQueue.push(task);
        queuedGenerationTasks.set(taskKey, task);
        scheduleGenerationQueueFlush();
        return existingChunk;
    }

    function prewarmChunks(chunkCoordinates = [], options = {}) {
        const uniqueKeys = new Set();

        chunkCoordinates.forEach((entry) => {
            if (!entry || !Number.isFinite(entry.chunkX) || !Number.isFinite(entry.chunkY)) {
                return;
            }

            const taskKey = getQueuedGenerationKey(entry.chunkX, entry.chunkY);
            if (uniqueKeys.has(taskKey)) {
                return;
            }

            uniqueKeys.add(taskKey);
            queueChunkGeneration(entry.chunkX, entry.chunkY, options);
        });
    }

    function ensureChunkGenerationLevel(chunk, options = {}) {
        const detailLevel = normalizeGenerationDetail(options.detailLevel || 'full');

        if (!chunk || getGenerationDetailRank(chunk.generationDetail || 'base') >= getGenerationDetailRank(detailLevel)) {
            if (chunk) {
                chunk.pendingGenerationDetail = null;
            }

            return chunk;
        }

        if (detailLevel !== 'full') {
            return chunk;
        }

        if (options.immediate === false) {
            queueChunkGeneration(chunk.x, chunk.y, {
                detailLevel,
                priority: options.priority
            });
            return chunk;
        }

        return completeDeferredChunkGeneration(chunk);
    }

    function flushGenerationQueue() {
        generationQueueRequestId = null;

        if (!generationQueue.length) {
            return;
        }

        generationQueue.sort((left, right) => right.priority - left.priority || left.sequence - right.sequence);
        let processedCount = 0;
        let shouldRenderAfterFlush = false;

        while (generationQueue.length > 0 && processedCount < MAX_HEAVY_CHUNKS_PER_TICK) {
            const task = generationQueue.shift();
            queuedGenerationTasks.delete(task.key);

            try {
                generateChunk(task.chunkX, task.chunkY, {
                    detailLevel: task.detailLevel,
                    immediate: true,
                    queueDeferred: false
                });
            } catch (error) {
                console.error('Failed to prewarm chunk generation', error);
            }

            const playerChunk = game.systems.world.getChunkCoordinatesForWorld(
                game.state.playerPos.x,
                game.state.playerPos.y
            );
            if (
                Math.abs(task.chunkX - playerChunk.chunkX) <= game.config.viewDistance + 1
                && Math.abs(task.chunkY - playerChunk.chunkY) <= game.config.viewDistance + 1
            ) {
                shouldRenderAfterFlush = true;
            }

            processedCount += 1;
        }

        if (processedCount > 0 && shouldRenderAfterFlush) {
            const render = game.systems.render || null;
            if (render && typeof render.render === 'function') {
                render.render();
            }
        }

        if (generationQueue.length > 0) {
            scheduleGenerationQueueFlush();
        }
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
            renderCache: null,
            entityVersion: 0,
            generationStage: 'finalized',
            generationDetail: 'full',
            pendingGenerationDetail: null
        });
    }

    function generateChunk(chunkX, chunkY, options = {}) {
        const perf = game.systems.perf || null;
        const generate = () => {
            const world = game.systems.world;
            const detailLevel = normalizeGenerationDetail(options.detailLevel || 'full');
            const existingChunk = world.getChunk(chunkX, chunkY, { generateIfMissing: false });

            if (existingChunk) {
                return ensureChunkGenerationLevel(existingChunk, {
                    detailLevel,
                    immediate: options.immediate,
                    priority: options.priority
                });
            }

            const expedition = game.systems.expedition;
            const chunkRecord = expedition.getIslandChunkRecord(chunkX, chunkY);

            if (!chunkRecord) {
                return createOceanChunk(chunkX, chunkY);
            }

            const context = buildGenerationContext(chunkX, chunkY, chunkRecord);
            runTopologyStage(context);
            runStructuresStage(context);
            runTravelStage(context);
            runInteractionStage(context, 'base');

            const chunk = world.storeChunk(runFinalizationStage(context, 'base'));

            if (detailLevel === 'full') {
                return options.immediate === false
                    ? ensureChunkGenerationLevel(chunk, {
                        detailLevel,
                        immediate: false,
                        priority: options.priority
                    })
                    : completeDeferredChunkGeneration(chunk);
            }

            if (options.queueDeferred !== false) {
                queueChunkGeneration(chunkX, chunkY, {
                    detailLevel: 'full',
                    priority: options.priority || 'low'
                });
            }

            return chunk;
        };

        if (perf && typeof perf.measure === 'function') {
            return perf.measure('generateChunk', generate);
        }

        return generate();
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
        getCrossingIslandBreakSites,
        applyCrossingIslandForcedBridgeBreaks,
        paintTravelTrailNetwork,
        applyTravelTerrainLayer,
        applyTravelZoneLayer,
        buildHouseTileMap,
        buildInteractionTileMap,
        buildGenerationContext,
        runTopologyStage,
        runStructuresStage,
        runTravelStage,
        runInteractionStage,
        runFinalizationStage,
        ensureChunkGenerationLevel,
        completeDeferredChunkGeneration,
        queueChunkGeneration,
        prewarmChunks,
        flushGenerationQueue,
        resetGenerationRuntime,
        createOceanChunk,
        generateChunk
    });

    game.systems.map = game.systems.map || {};
    game.systems.map.topologyPainter = game.systems.topologyPainter || null;
    game.systems.map.chunkGenerator = chunkGenerator;
    game.systems.generateChunk = (...args) => chunkGenerator.generateChunk(...args);
})();
