const MOVEMENT_DIRECTIONS = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 1 },
    { dx: -1, dy: -1 }
];

function isTraversableTile(info) {
    return window.Game.systems.content.isPassableTile(info.tileType)
        && (!info.interaction || info.interaction.kind === 'groundItem');
}

function canTraverse(fromInfo, toInfo) {
    if (!isTraversableTile(toInfo)) {
        return false;
    }

    if (fromInfo.house || toInfo.house) {
        return window.Game.systems.houses.canTraverseBetweenTiles(fromInfo, toInfo);
    }

    return true;
}

function canMoveTo(x, y) {
    return isTraversableTile(window.Game.systems.world.getTileInfo(x, y));
}

function getTileType(x, y) {
    return window.Game.systems.world.getTileInfo(x, y).tileType;
}

function createTileInfoCache() {
    const tileInfoCache = new Map();
    const world = window.Game.systems.world;

    return function getCachedTileInfo(x, y) {
        const key = `${x},${y}`;

        if (!tileInfoCache.has(key)) {
            tileInfoCache.set(key, world.getTileInfo(x, y));
        }

        return tileInfoCache.get(key);
    };
}

function canTraverseDirection(currentInfo, direction, getCachedTileInfo) {
    const nextInfo = getCachedTileInfo(currentInfo.x + direction.dx, currentInfo.y + direction.dy);

    if (!canTraverse(currentInfo, nextInfo)) {
        return false;
    }

    if (direction.dx === 0 || direction.dy === 0) {
        return true;
    }

    if (!currentInfo.house && !nextInfo.house) {
        return true;
    }

    const horizontalInfo = getCachedTileInfo(currentInfo.x + direction.dx, currentInfo.y);
    const verticalInfo = getCachedTileInfo(currentInfo.x, currentInfo.y + direction.dy);
    const viaHorizontal = canTraverse(currentInfo, horizontalInfo) && canTraverse(horizontalInfo, nextInfo);
    const viaVertical = canTraverse(currentInfo, verticalInfo) && canTraverse(verticalInfo, nextInfo);

    return viaHorizontal || viaVertical;
}

function createEmptyPathResult() {
    return {
        path: [],
        totalCost: 0
    };
}

function popLowestCostNode(frontier) {
    let bestIndex = 0;

    for (let index = 1; index < frontier.length; index++) {
        const current = frontier[index];
        const best = frontier[bestIndex];

        if (
            current.totalCost < best.totalCost
            || (
                Math.abs(current.totalCost - best.totalCost) < 0.001
                && current.steps < best.steps
            )
        ) {
            bestIndex = index;
        }
    }

    const [bestNode] = frontier.splice(bestIndex, 1);
    return bestNode;
}

function createRouteStep(tileInfo, travelCost = null) {
    return {
        x: tileInfo.x,
        y: tileInfo.y,
        tileType: tileInfo.tileType,
        baseTileType: tileInfo.baseTileType,
        travelZoneKey: tileInfo.travelZoneKey || 'none',
        travelBand: tileInfo.travelBand || 'normal',
        travelLabel: tileInfo.travelLabel || tileInfo.terrainLabel || tileInfo.tileType,
        travelCost: Number.isFinite(travelCost) ? travelCost : (tileInfo.travelWeight || 1)
    };
}

function reconstructPath(targetKey, startKey, parents, getCachedTileInfo, totalCost) {
    const path = [];
    let currentKey = targetKey;

    while (currentKey !== startKey) {
        const current = parents.get(currentKey);

        if (!current) {
            return createEmptyPathResult();
        }

        path.unshift(createRouteStep(getCachedTileInfo(current.x, current.y), current.stepCost));
        currentKey = current.parentKey;
    }

    return {
        path,
        totalCost
    };
}

function calculatePathCost(path = []) {
    return path.reduce((sum, step) => sum + (step && Number.isFinite(step.travelCost) ? step.travelCost : 0), 0);
}

function findPathResult(startX, startY, targetX, targetY) {
    const config = window.Game.config;
    const expedition = window.Game.systems.expedition;
    const roundedStartX = Math.round(startX);
    const roundedStartY = Math.round(startY);
    const roundedTargetX = Math.round(targetX);
    const roundedTargetY = Math.round(targetY);
    const getCachedTileInfo = createTileInfoCache();
    const startKey = `${roundedStartX},${roundedStartY}`;
    const targetKey = `${roundedTargetX},${roundedTargetY}`;

    if (startKey === targetKey) {
        return createEmptyPathResult();
    }

    const startInfo = getCachedTileInfo(roundedStartX, roundedStartY);
    const targetInfo = getCachedTileInfo(roundedTargetX, roundedTargetY);

    if (!isTraversableTile(startInfo) || !isTraversableTile(targetInfo)) {
        return createEmptyPathResult();
    }

    const frontier = [{ x: roundedStartX, y: roundedStartY, totalCost: 0, steps: 0 }];
    const bestCosts = new Map([[startKey, 0]]);
    const bestSteps = new Map([[startKey, 0]]);
    const parents = new Map();

    while (frontier.length > 0) {
        const current = popLowestCostNode(frontier);
        const currentKey = `${current.x},${current.y}`;

        if (current.totalCost > (bestCosts.get(currentKey) ?? Infinity) + 0.001) {
            continue;
        }

        if (current.x === roundedTargetX && current.y === roundedTargetY) {
            return reconstructPath(targetKey, startKey, parents, getCachedTileInfo, current.totalCost);
        }

        if (current.steps >= config.maxPathLength) {
            continue;
        }

        const currentInfo = getCachedTileInfo(current.x, current.y);

        MOVEMENT_DIRECTIONS.forEach((direction) => {
            const nextX = current.x + direction.dx;
            const nextY = current.y + direction.dy;
            const nextKey = `${nextX},${nextY}`;

            if (!canTraverseDirection(currentInfo, direction, getCachedTileInfo)) {
                return;
            }

            const nextInfo = getCachedTileInfo(nextX, nextY);
            const nextSteps = current.steps + 1;
            const stepCost = expedition.getTraversalWeight(nextInfo, nextSteps);

            if (!Number.isFinite(stepCost) || stepCost <= 0) {
                return;
            }

            const nextCost = current.totalCost + stepCost;
            const bestKnownCost = bestCosts.get(nextKey);
            const bestKnownSteps = bestSteps.get(nextKey);
            const isBetterCost = bestKnownCost === undefined || nextCost < bestKnownCost - 0.001;
            const isEqualCostButShorter = bestKnownCost !== undefined
                && Math.abs(nextCost - bestKnownCost) < 0.001
                && nextSteps < (bestKnownSteps ?? Infinity);

            if (!isBetterCost && !isEqualCostButShorter) {
                return;
            }

            bestCosts.set(nextKey, nextCost);
            bestSteps.set(nextKey, nextSteps);
            parents.set(nextKey, {
                x: nextX,
                y: nextY,
                parentKey: currentKey,
                stepCost
            });
            frontier.push({
                x: nextX,
                y: nextY,
                totalCost: nextCost,
                steps: nextSteps
            });
        });
    }

    return createEmptyPathResult();
}

function findPath(startX, startY, targetX, targetY) {
    return findPathResult(startX, startY, targetX, targetY).path;
}

function canTraverseWorldStep(fromX, fromY, toX, toY) {
    const roundedFromX = Math.round(fromX);
    const roundedFromY = Math.round(fromY);
    const roundedToX = Math.round(toX);
    const roundedToY = Math.round(toY);
    const dx = roundedToX - roundedFromX;
    const dy = roundedToY - roundedFromY;

    if (Math.abs(dx) > 1 || Math.abs(dy) > 1 || (dx === 0 && dy === 0)) {
        return false;
    }

    const getCachedTileInfo = createTileInfoCache();
    const fromInfo = getCachedTileInfo(roundedFromX, roundedFromY);

    return canTraverseDirection(fromInfo, { dx, dy }, getCachedTileInfo);
}

window.Game.systems.pathfinding = {
    canMoveTo,
    getTileType,
    findPath,
    findPathResult,
    calculatePathCost,
    canTraverseWorldStep
};
