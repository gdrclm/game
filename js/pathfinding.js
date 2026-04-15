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
const PATH_EPSILON = 0.001;
const PATH_RESULT_CACHE_LIMIT = 24;
let worldPathRevision = 0;
let sharedTileInfoWindow = null;
let heuristicBoundsCache = null;
const pathResultCache = new Map();

class BinaryMinHeap {
    constructor(compare) {
        this.compare = compare;
        this.items = [];
    }

    isEmpty() {
        return this.items.length === 0;
    }

    push(value) {
        this.items.push(value);
        this.bubbleUp(this.items.length - 1);
    }

    pop() {
        if (this.items.length === 0) {
            return null;
        }

        const first = this.items[0];
        const last = this.items.pop();

        if (this.items.length > 0) {
            this.items[0] = last;
            this.bubbleDown(0);
        }

        return first;
    }

    bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);

            if (this.compare(this.items[index], this.items[parentIndex]) >= 0) {
                break;
            }

            [this.items[index], this.items[parentIndex]] = [this.items[parentIndex], this.items[index]];
            index = parentIndex;
        }
    }

    bubbleDown(index) {
        const lastIndex = this.items.length - 1;

        while (true) {
            const leftIndex = index * 2 + 1;
            const rightIndex = leftIndex + 1;
            let smallestIndex = index;

            if (
                leftIndex <= lastIndex
                && this.compare(this.items[leftIndex], this.items[smallestIndex]) < 0
            ) {
                smallestIndex = leftIndex;
            }

            if (
                rightIndex <= lastIndex
                && this.compare(this.items[rightIndex], this.items[smallestIndex]) < 0
            ) {
                smallestIndex = rightIndex;
            }

            if (smallestIndex === index) {
                return;
            }

            [this.items[index], this.items[smallestIndex]] = [this.items[smallestIndex], this.items[index]];
            index = smallestIndex;
        }
    }
}

function isTraversableTile(info) {
    const boatRuntime = window.Game.systems.boatRuntime || null;
    const isBoatTraversable = boatRuntime && typeof boatRuntime.canTraverseTileInfo === 'function'
        ? boatRuntime.canTraverseTileInfo(info)
        : false;

    return (window.Game.systems.content.isPassableTile(info.tileType) || isBoatTraversable)
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

function normalizeCoordinate(value) {
    return Math.round(value);
}

function toNaturalCoordinate(value) {
    const normalized = normalizeCoordinate(value);
    return normalized >= 0 ? normalized * 2 : (-normalized * 2) - 1;
}

function getNodeKey(x, y) {
    const a = toNaturalCoordinate(x);
    const b = toNaturalCoordinate(y);
    return a >= b ? a * a + a + b : a + b * b;
}

function comparePathNodes(left, right) {
    if (left.estimatedTotalCost !== right.estimatedTotalCost) {
        return left.estimatedTotalCost - right.estimatedTotalCost;
    }

    if (left.totalCost !== right.totalCost) {
        return left.totalCost - right.totalCost;
    }

    return left.steps - right.steps;
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

function cloneRouteStep(step) {
    return step ? { ...step } : step;
}

function createEmptyPathResult(extra = {}) {
    return {
        path: [],
        totalCost: 0,
        isExact: false,
        reachedTarget: false,
        stoppedReason: 'unreachable',
        ...extra
    };
}

function clonePathResult(result) {
    if (!result) {
        return createEmptyPathResult();
    }

    return {
        ...result,
        path: Array.isArray(result.path)
            ? result.path.map((step) => cloneRouteStep(step))
            : []
    };
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

function reconstructPath(targetKey, startKey, parents, getCachedTileInfo, totalCost, extra = {}) {
    const path = [];
    let currentKey = targetKey;

    while (currentKey !== startKey) {
        const current = parents.get(currentKey);

        if (!current) {
            return createEmptyPathResult(extra);
        }

        path.unshift(createRouteStep(getCachedTileInfo(current.x, current.y), current.stepCost));
        currentKey = current.parentKey;
    }

    return {
        path,
        totalCost,
        isExact: false,
        reachedTarget: false,
        stoppedReason: 'unreachable',
        ...extra
    };
}

function calculatePathCost(path = []) {
    return path.reduce((sum, step) => sum + (step && Number.isFinite(step.travelCost) ? step.travelCost : 0), 0);
}

function getPositiveFiniteMinimum(values = [], fallback = 1) {
    let minimum = Infinity;

    values.forEach((value) => {
        if (Number.isFinite(value) && value > 0) {
            minimum = Math.min(minimum, value);
        }
    });

    return Number.isFinite(minimum) ? minimum : fallback;
}

function getHeuristicBounds() {
    if (heuristicBoundsCache) {
        return heuristicBoundsCache;
    }

    const content = window.Game.systems.content || null;
    const itemRegistry = window.Game.systems.itemRegistry || null;
    const tileDefinitions = content && content.tileRegistry ? Object.values(content.tileRegistry) : [];
    const travelZoneDefinitions = content && content.travelZoneRegistry ? Object.values(content.travelZoneRegistry) : [];
    const itemDefinitions = itemRegistry && itemRegistry.itemDefinitions
        ? Object.values(itemRegistry.itemDefinitions)
        : [];

    const minTileFactor = getPositiveFiniteMinimum(
        tileDefinitions
            .filter((definition) => definition && content && content.isPassableTile(definition.key))
            .map((definition) => definition.movementFactor),
        1
    );
    const minTravelZoneFactor = getPositiveFiniteMinimum(
        [1].concat(travelZoneDefinitions.map((definition) => definition && definition.movementFactor)),
        1
    );
    let minActiveTravelDiscount = 1;
    let minIslandTravelDiscount = 1;
    let hasPassiveTravelDiscount = false;
    let hasPassiveLongRouteDiscount = false;
    let hasPassiveRoughDiscount = false;
    let hasPassiveBridgeDiscount = false;
    let hasChainDiscount = false;
    let maxFreeOpeningSteps = 0;

    itemDefinitions.forEach((definition) => {
        if (!definition) {
            return;
        }

        const passive = definition.passive && typeof definition.passive === 'object'
            ? definition.passive
            : null;
        const activeEffect = definition.activeEffect && typeof definition.activeEffect === 'object'
            ? definition.activeEffect
            : null;

        if (passive) {
            if (Number.isFinite(passive.travelCostMultiplier) && passive.travelCostMultiplier < 1) {
                hasPassiveTravelDiscount = true;
            }

            if (Number.isFinite(passive.longRouteTravelCostMultiplier) && passive.longRouteTravelCostMultiplier < 1) {
                hasPassiveLongRouteDiscount = true;
            }

            if (Number.isFinite(passive.roughTravelCostMultiplier) && passive.roughTravelCostMultiplier < 1) {
                hasPassiveRoughDiscount = true;
            }

            if (Number.isFinite(passive.bridgeTravelCostMultiplier) && passive.bridgeTravelCostMultiplier < 1) {
                hasPassiveBridgeDiscount = true;
            }

            if (Number.isFinite(passive.chainTravelDiscount) && passive.chainTravelDiscount > 0) {
                hasChainDiscount = true;
            }
        }

        if (!activeEffect) {
            return;
        }

        if (
            activeEffect.kind === 'travelBuff'
            && Number.isFinite(activeEffect.discountMultiplier)
            && activeEffect.discountMultiplier > 0
        ) {
            minActiveTravelDiscount = Math.min(minActiveTravelDiscount, activeEffect.discountMultiplier);
        }

        if (activeEffect.kind === 'travelBuff' && Number.isFinite(activeEffect.freeSteps)) {
            maxFreeOpeningSteps = Math.max(maxFreeOpeningSteps, Math.floor(activeEffect.freeSteps));
        }

        if (
            activeEffect.kind === 'islandBuff'
            && Number.isFinite(activeEffect.travelCostMultiplier)
            && activeEffect.travelCostMultiplier > 0
        ) {
            minIslandTravelDiscount = Math.min(minIslandTravelDiscount, activeEffect.travelCostMultiplier);
        }
    });

    heuristicBoundsCache = {
        minTileFactor,
        minTravelZoneFactor,
        minActiveTravelDiscount,
        minIslandTravelDiscount,
        passiveTravelFloor: hasPassiveTravelDiscount ? 0.35 : 1,
        passiveLongRouteFloor: hasPassiveLongRouteDiscount ? 0.35 : 1,
        passiveRoughFloor: hasPassiveRoughDiscount ? 0.35 : 1,
        passiveBridgeFloor: hasPassiveBridgeDiscount ? 0.35 : 1,
        chainDiscountFloor: hasChainDiscount ? 0.35 : 1,
        maxFreeOpeningSteps
    };
    return heuristicBoundsCache;
}

function estimateRemainingSteps(fromX, fromY, targetX, targetY) {
    const dx = Math.abs(targetX - fromX);
    const dy = Math.abs(targetY - fromY);
    const diagonalSteps = Math.min(dx, dy);
    const straightSteps = Math.max(dx, dy) - diagonalSteps;

    return diagonalSteps + straightSteps;
}

function estimateExactRemainingCost(fromX, fromY, targetX, targetY) {
    const remainingSteps = estimateRemainingSteps(fromX, fromY, targetX, targetY);
    const bounds = getHeuristicBounds();
    const paidSteps = Math.max(0, remainingSteps - bounds.maxFreeOpeningSteps);

    if (paidSteps <= 0) {
        return 0;
    }

    return paidSteps
        * bounds.minTileFactor
        * bounds.minTravelZoneFactor
        * bounds.minActiveTravelDiscount
        * bounds.minIslandTravelDiscount
        * bounds.passiveTravelFloor
        * bounds.passiveLongRouteFloor
        * bounds.passiveRoughFloor
        * bounds.passiveBridgeFloor
        * bounds.chainDiscountFloor;
}

function estimatePreviewRemainingCost(fromX, fromY, targetX, targetY, previewStepFloor) {
    return estimateRemainingSteps(fromX, fromY, targetX, targetY) * previewStepFloor;
}

function buildPathModifierSignature(startInfo = null) {
    const game = window.Game;
    const itemEffects = game.systems.itemEffects || null;
    const currentIslandIndex = startInfo && startInfo.progression
        ? startInfo.progression.islandIndex
        : (game.state.currentIslandIndex || 1);
    const snapshot = itemEffects && typeof itemEffects.getModifierSnapshot === 'function'
        ? itemEffects.getModifierSnapshot({
            currentIslandIndex,
            routeStepIndex: 1
        })
        : {
            travelCostMultiplier: 1,
            longRouteTravelCostMultiplier: 1,
            roughTravelCostMultiplier: 1,
            bridgeTravelCostMultiplier: 1,
            freeOpeningSteps: 0,
            chainTravelDiscount: 0,
            ignoreTravelZones: []
        };

    return [
        currentIslandIndex,
        snapshot.travelCostMultiplier ?? 1,
        snapshot.longRouteTravelCostMultiplier ?? 1,
        snapshot.roughTravelCostMultiplier ?? 1,
        snapshot.bridgeTravelCostMultiplier ?? 1,
        snapshot.freeOpeningSteps ?? 0,
        snapshot.chainTravelDiscount ?? 0,
        Array.isArray(snapshot.ignoreTravelZones)
            ? snapshot.ignoreTravelZones.slice().sort().join(',')
            : ''
    ].join('|');
}

function createPathResultCacheKey({
    revision,
    modifierSignature,
    startKey,
    targetKey,
    queryMode,
    maxPathLength,
    maxAllowedCost
}) {
    return [
        revision,
        modifierSignature,
        startKey,
        targetKey,
        queryMode,
        maxPathLength,
        Number.isFinite(maxAllowedCost) ? maxAllowedCost.toFixed(3) : 'inf'
    ].join('|');
}

function getCachedPathResult(cacheKey) {
    const cached = pathResultCache.get(cacheKey);
    return cached ? clonePathResult(cached) : null;
}

function setCachedPathResult(cacheKey, result) {
    pathResultCache.delete(cacheKey);
    pathResultCache.set(cacheKey, clonePathResult(result));

    while (pathResultCache.size > PATH_RESULT_CACHE_LIMIT) {
        const oldestKey = pathResultCache.keys().next();

        if (oldestKey.done) {
            return;
        }

        pathResultCache.delete(oldestKey.value);
    }
}

function getReusableTileInfoCache(startKey, modifierSignature, revision) {
    if (
        sharedTileInfoWindow
        && sharedTileInfoWindow.revision === revision
        && sharedTileInfoWindow.startKey === startKey
        && sharedTileInfoWindow.modifierSignature === modifierSignature
        && sharedTileInfoWindow.tileInfoCache instanceof Map
    ) {
        return sharedTileInfoWindow.tileInfoCache;
    }

    return new Map();
}

function promoteTileInfoCache(startKey, modifierSignature, tileInfoCache) {
    sharedTileInfoWindow = {
        startKey,
        modifierSignature,
        revision: worldPathRevision,
        tileInfoCache
    };
}

function createTileInfoAccessor(tileInfoCache, tileQueryOptions = null) {
    const world = window.Game.systems.world;

    return function getCachedTileInfo(x, y) {
        const key = getNodeKey(x, y);

        if (!tileInfoCache.has(key)) {
            tileInfoCache.set(key, world.getTileInfo(x, y, tileQueryOptions || undefined));
        }

        return tileInfoCache.get(key);
    };
}

function isBetterPath(nextCost, nextSteps, bestKnownCost, bestKnownSteps) {
    const isBetterCost = bestKnownCost === undefined || nextCost < bestKnownCost - PATH_EPSILON;
    const isEqualCostButShorter = bestKnownCost !== undefined
        && Math.abs(nextCost - bestKnownCost) < PATH_EPSILON
        && nextSteps < (bestKnownSteps ?? Infinity);

    return isBetterCost || isEqualCostButShorter;
}

function isBetterPreviewNode(candidate, currentBest, targetX, targetY) {
    if (!candidate || candidate.steps <= 0) {
        return false;
    }

    if (!currentBest) {
        return true;
    }

    const candidateDistance = estimateRemainingSteps(candidate.x, candidate.y, targetX, targetY);
    const bestDistance = estimateRemainingSteps(currentBest.x, currentBest.y, targetX, targetY);

    if (candidateDistance !== bestDistance) {
        return candidateDistance < bestDistance;
    }

    if (Math.abs(candidate.totalCost - currentBest.totalCost) >= PATH_EPSILON) {
        return candidate.totalCost < currentBest.totalCost;
    }

    return candidate.steps > currentBest.steps;
}

function resolvePreviewStepFloor(startInfo) {
    const fallback = Number.isFinite(startInfo && startInfo.travelWeight) && startInfo.travelWeight > 0
        ? startInfo.travelWeight
        : 1;

    return Math.max(0.35, Math.min(fallback, 1.75) * 0.75);
}

function invalidateCaches() {
    worldPathRevision += 1;
    sharedTileInfoWindow = null;
    pathResultCache.clear();
}

function findPathResult(startX, startY, targetX, targetY, options = {}) {
    const perf = window.Game.systems.perf || null;
    const find = () => {
        const game = window.Game;
        const config = game.config;
        const expedition = game.systems.expedition;
        const world = game.systems.world;
        const tileQueryOptions = options.tileQueryOptions || null;
        const roundedStartX = normalizeCoordinate(startX);
        const roundedStartY = normalizeCoordinate(startY);
        const roundedTargetX = normalizeCoordinate(targetX);
        const roundedTargetY = normalizeCoordinate(targetY);
        const queryMode = options.queryMode === 'preview' ? 'preview' : 'exact';
        const maxPathLength = Number.isFinite(options.maxPathLength)
            ? Math.max(1, Math.min(config.maxPathLength, Math.floor(options.maxPathLength)))
            : config.maxPathLength;
        const maxAllowedCost = Number.isFinite(options.maxAllowedCost)
            ? Math.max(0, Number(options.maxAllowedCost))
            : Infinity;
        const startKey = getNodeKey(roundedStartX, roundedStartY);
        const targetKey = getNodeKey(roundedTargetX, roundedTargetY);
        const startInfo = world.getTileInfo(roundedStartX, roundedStartY, tileQueryOptions || undefined);
        const targetInfo = world.getTileInfo(roundedTargetX, roundedTargetY, tileQueryOptions || undefined);
        const modifierSignature = buildPathModifierSignature(startInfo);
        const lookupRevision = worldPathRevision;
        const initialCacheKey = createPathResultCacheKey({
            revision: lookupRevision,
            modifierSignature,
            startKey,
            targetKey,
            queryMode,
            maxPathLength,
            maxAllowedCost
        });
        const cached = options.useResultCache === false
            ? null
            : getCachedPathResult(initialCacheKey);

        if (cached) {
            return cached;
        }

        if (startKey === targetKey) {
            return createEmptyPathResult({
                isExact: true,
                reachedTarget: true,
                stoppedReason: 'atTarget'
            });
        }

        if (!isTraversableTile(startInfo) || !isTraversableTile(targetInfo)) {
            return createEmptyPathResult({
                stoppedReason: 'blocked'
            });
        }

        const tileInfoCache = getReusableTileInfoCache(startKey, modifierSignature, lookupRevision);
        tileInfoCache.set(startKey, startInfo);
        tileInfoCache.set(targetKey, targetInfo);
        const getCachedTileInfo = createTileInfoAccessor(tileInfoCache, tileQueryOptions);
        const previewStepFloor = resolvePreviewStepFloor(startInfo);
        const frontier = new BinaryMinHeap(comparePathNodes);
        const bestCosts = new Map([[startKey, 0]]);
        const bestSteps = new Map([[startKey, 0]]);
        const parents = new Map();
        let bestPreviewNode = null;
        let stoppedByStepLimit = false;
        let stoppedByCostLimit = false;

        frontier.push({
            key: startKey,
            x: roundedStartX,
            y: roundedStartY,
            totalCost: 0,
            estimatedTotalCost: queryMode === 'preview'
                ? estimatePreviewRemainingCost(roundedStartX, roundedStartY, roundedTargetX, roundedTargetY, previewStepFloor)
                : estimateExactRemainingCost(roundedStartX, roundedStartY, roundedTargetX, roundedTargetY),
            steps: 0
        });

        while (!frontier.isEmpty()) {
            const current = frontier.pop();
            const bestKnownCost = bestCosts.get(current.key);
            const bestKnownSteps = bestSteps.get(current.key);

            if (
                current.totalCost > (bestKnownCost ?? Infinity) + PATH_EPSILON
                || (
                    bestKnownCost !== undefined
                    && Math.abs(current.totalCost - bestKnownCost) < PATH_EPSILON
                    && current.steps > (bestKnownSteps ?? Infinity)
                )
            ) {
                continue;
            }

            if (queryMode === 'preview' && isBetterPreviewNode(current, bestPreviewNode, roundedTargetX, roundedTargetY)) {
                bestPreviewNode = current;
            }

            if (current.key === targetKey) {
                const exactResult = reconstructPath(targetKey, startKey, parents, getCachedTileInfo, current.totalCost, {
                    isExact: true,
                    reachedTarget: true,
                    stoppedReason: 'targetReached'
                });
                const finalRevision = worldPathRevision;
                const finalCacheKey = createPathResultCacheKey({
                    revision: finalRevision,
                    modifierSignature,
                    startKey,
                    targetKey,
                    queryMode,
                    maxPathLength,
                    maxAllowedCost
                });
                promoteTileInfoCache(startKey, modifierSignature, tileInfoCache);

                if (options.useResultCache !== false) {
                    setCachedPathResult(finalCacheKey, exactResult);
                }

                return exactResult;
            }

            if (current.steps >= maxPathLength) {
                stoppedByStepLimit = true;
                continue;
            }

            if (current.totalCost > maxAllowedCost + PATH_EPSILON) {
                stoppedByCostLimit = true;
                continue;
            }

            const currentInfo = getCachedTileInfo(current.x, current.y);

            MOVEMENT_DIRECTIONS.forEach((direction) => {
                const nextX = current.x + direction.dx;
                const nextY = current.y + direction.dy;
                const nextKey = getNodeKey(nextX, nextY);
                const nextSteps = current.steps + 1;

                if (nextSteps > maxPathLength) {
                    stoppedByStepLimit = true;
                    return;
                }

                if (!canTraverseDirection(currentInfo, direction, getCachedTileInfo)) {
                    return;
                }

                const nextInfo = getCachedTileInfo(nextX, nextY);
                const stepCost = expedition.getTraversalWeight(nextInfo, nextSteps);

                if (!Number.isFinite(stepCost) || stepCost < 0) {
                    return;
                }

                const nextCost = current.totalCost + stepCost;

                if (nextCost > maxAllowedCost + PATH_EPSILON) {
                    stoppedByCostLimit = true;
                    return;
                }

                const existingCost = bestCosts.get(nextKey);
                const existingSteps = bestSteps.get(nextKey);

                if (!isBetterPath(nextCost, nextSteps, existingCost, existingSteps)) {
                    return;
                }

                bestCosts.set(nextKey, nextCost);
                bestSteps.set(nextKey, nextSteps);
                parents.set(nextKey, {
                    x: nextX,
                    y: nextY,
                    parentKey: current.key,
                    stepCost
                });

                frontier.push({
                    key: nextKey,
                    x: nextX,
                    y: nextY,
                    totalCost: nextCost,
                    estimatedTotalCost: nextCost + (
                        queryMode === 'preview'
                            ? estimatePreviewRemainingCost(nextX, nextY, roundedTargetX, roundedTargetY, previewStepFloor)
                            : estimateExactRemainingCost(nextX, nextY, roundedTargetX, roundedTargetY)
                    ),
                    steps: nextSteps
                });
            });
        }

        const stoppedReason = stoppedByCostLimit
            ? 'costLimit'
            : (stoppedByStepLimit ? 'stepLimit' : 'unreachable');
        const fallbackPreviewResult = queryMode === 'preview' && bestPreviewNode && bestPreviewNode.key !== startKey
            ? reconstructPath(bestPreviewNode.key, startKey, parents, getCachedTileInfo, bestPreviewNode.totalCost, {
                isExact: false,
                reachedTarget: false,
                stoppedReason
            })
            : createEmptyPathResult({ stoppedReason });
        const finalRevision = worldPathRevision;
        const finalCacheKey = createPathResultCacheKey({
            revision: finalRevision,
            modifierSignature,
            startKey,
            targetKey,
            queryMode,
            maxPathLength,
            maxAllowedCost
        });

        promoteTileInfoCache(startKey, modifierSignature, tileInfoCache);

        if (options.useResultCache !== false) {
            setCachedPathResult(finalCacheKey, fallbackPreviewResult);
        }

        return fallbackPreviewResult;
    };

    if (perf && typeof perf.measure === 'function') {
        return perf.measure('pathfinding', find);
    }

    return find();
}

function findPath(startX, startY, targetX, targetY, options = {}) {
    return findPathResult(startX, startY, targetX, targetY, options).path;
}

function createSingleQueryTileInfoAccessor() {
    const tileInfoCache = new Map();
    return createTileInfoAccessor(tileInfoCache);
}

function canTraverseWorldStep(fromX, fromY, toX, toY) {
    const roundedFromX = normalizeCoordinate(fromX);
    const roundedFromY = normalizeCoordinate(fromY);
    const roundedToX = normalizeCoordinate(toX);
    const roundedToY = normalizeCoordinate(toY);
    const dx = roundedToX - roundedFromX;
    const dy = roundedToY - roundedFromY;

    if (Math.abs(dx) > 1 || Math.abs(dy) > 1 || (dx === 0 && dy === 0)) {
        return false;
    }

    const getCachedTileInfo = createSingleQueryTileInfoAccessor();
    const fromInfo = getCachedTileInfo(roundedFromX, roundedFromY);

    return canTraverseDirection(fromInfo, { dx, dy }, getCachedTileInfo);
}

window.Game.systems.pathfinding = {
    canMoveTo,
    getTileType,
    findPath,
    findPathResult,
    calculatePathCost,
    canTraverseWorldStep,
    invalidateCaches
};
