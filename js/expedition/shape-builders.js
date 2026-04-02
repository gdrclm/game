(() => {
    const game = window.Game;
    const shapes = game.systems.expeditionShapeBuilders = game.systems.expeditionShapeBuilders || {};
    const shared = game.systems.expeditionShared || {};
    const DIRECTIONS = shared.DIRECTIONS || [];
    const directionByName = shared.directionByName || {};
    const chunkKey = shared.chunkKey || ((x, y) => `${x},${y}`);

    function getForwardProgress(chunks, directionName) {
        if (directionName === 'east') {
            return Math.max(...chunks.map((chunk) => chunk.chunkX));
        }

        if (directionName === 'west') {
            return -Math.min(...chunks.map((chunk) => chunk.chunkX));
        }

        if (directionName === 'south') {
            return Math.max(...chunks.map((chunk) => chunk.chunkY));
        }

        return -Math.min(...chunks.map((chunk) => chunk.chunkY));
    }

    function getLateralSpread(chunks, directionName) {
        if (directionName === 'east' || directionName === 'west') {
            return Math.max(...chunks.map((chunk) => chunk.chunkY))
                - Math.min(...chunks.map((chunk) => chunk.chunkY));
        }

        return Math.max(...chunks.map((chunk) => chunk.chunkX))
            - Math.min(...chunks.map((chunk) => chunk.chunkX));
    }

    function getChunkAxisValue(chunk, directionName) {
        return directionName === 'east' || directionName === 'west'
            ? chunk.chunkY
            : chunk.chunkX;
    }

    function createChunkRecordMap() {
        return new Map();
    }

    function addRelativeChunk(chunkMap, x, y, tags = []) {
        const key = chunkKey(x, y);
        const existing = chunkMap.get(key) || { relX: x, relY: y, tags: new Set() };
        tags.forEach((tag) => existing.tags.add(tag));
        chunkMap.set(key, existing);
    }

    function hasRelativeChunk(chunkMap, x, y) {
        return chunkMap.has(chunkKey(x, y));
    }

    function normalizeRelativeChunks(chunkMap) {
        const values = [...chunkMap.values()];
        const minX = Math.min(...values.map((value) => value.relX));
        const minY = Math.min(...values.map((value) => value.relY));

        return values.map((value) => ({
            relX: value.relX - minX,
            relY: value.relY - minY,
            tags: new Set(value.tags)
        }));
    }

    function appendCompactCluster(chunkMap, count, anchorX, anchorY, random, tags = []) {
        if (count <= 0) {
            return;
        }

        if (chunkMap.size === 0) {
            addRelativeChunk(chunkMap, anchorX, anchorY, tags);
        }

        while ([...chunkMap.values()].filter((value) => tags.every((tag) => value.tags.has(tag))).length < count) {
            const candidates = [];

            chunkMap.forEach((value) => {
                DIRECTIONS.forEach(({ dx, dy }) => {
                    const nextX = value.relX + dx;
                    const nextY = value.relY + dy;

                    if (chunkMap.has(chunkKey(nextX, nextY))) {
                        return;
                    }

                    let adjacency = 0;
                    DIRECTIONS.forEach(({ dx: nx, dy: ny }) => {
                        if (chunkMap.has(chunkKey(nextX + nx, nextY + ny))) {
                            adjacency++;
                        }
                    });

                    const score = (
                        Math.abs(nextX - anchorX)
                        + Math.abs(nextY - anchorY)
                        - adjacency * 0.65
                        + random() * 0.35
                    );

                    candidates.push({ x: nextX, y: nextY, score });
                });
            });

            candidates.sort((left, right) => left.score - right.score);
            const picked = candidates[0];

            if (!picked) {
                break;
            }

            addRelativeChunk(chunkMap, picked.x, picked.y, tags);
        }
    }

    function buildElongatedShape(count) {
        const chunkMap = createChunkRecordMap();
        const spineLength = count <= 3
            ? count
            : Math.max(3, Math.ceil(count * 0.65));

        for (let x = 0; x < spineLength && chunkMap.size < count; x++) {
            addRelativeChunk(chunkMap, x, 0, ['spine']);
        }

        const sideOrder = [];
        for (let x = 1; x < spineLength - 1 && sideOrder.length < count * 2; x++) {
            sideOrder.push({ x, y: x % 2 === 0 ? 1 : -1 });
            sideOrder.push({ x, y: x % 2 === 0 ? -1 : 1 });
        }

        let index = 0;
        while (chunkMap.size < count && index < sideOrder.length) {
            const candidate = sideOrder[index++];
            addRelativeChunk(chunkMap, candidate.x, candidate.y, ['branch']);
        }

        return normalizeRelativeChunks(chunkMap);
    }

    function expandShapeToTarget(relativeChunks, count, random, preferredAxis = 'horizontal') {
        if (relativeChunks.length >= count) {
            return relativeChunks;
        }

        const chunkMap = createChunkRecordMap();
        relativeChunks.forEach((chunk) => {
            addRelativeChunk(chunkMap, chunk.relX, chunk.relY, [...chunk.tags]);
        });

        while (chunkMap.size < count) {
            const candidates = [];

            chunkMap.forEach((value) => {
                DIRECTIONS.forEach(({ dx, dy }) => {
                    const nextX = value.relX + dx;
                    const nextY = value.relY + dy;

                    if (chunkMap.has(chunkKey(nextX, nextY))) {
                        return;
                    }

                    let adjacency = 0;
                    DIRECTIONS.forEach(({ dx: nx, dy: ny }) => {
                        if (chunkMap.has(chunkKey(nextX + nx, nextY + ny))) {
                            adjacency++;
                        }
                    });

                    const axisPenalty = preferredAxis === 'horizontal'
                        ? Math.abs(nextY) * 0.25
                        : Math.abs(nextX) * 0.25;
                    const score = axisPenalty - adjacency * 0.8 + random() * 0.3;

                    candidates.push({ x: nextX, y: nextY, score });
                });
            });

            candidates.sort((left, right) => left.score - right.score);
            const picked = candidates[0];

            if (!picked) {
                break;
            }

            addRelativeChunk(chunkMap, picked.x, picked.y, ['branch']);
        }

        return normalizeRelativeChunks(chunkMap);
    }

    function buildLShapedShape(count, random) {
        const chunkMap = createChunkRecordMap();
        const trunkLength = Math.max(2, Math.ceil(count * 0.6));
        const branchDirection = random() < 0.5 ? 1 : -1;

        for (let x = 0; x < trunkLength && chunkMap.size < count; x++) {
            addRelativeChunk(chunkMap, x, 0, ['spine']);
        }

        for (let step = 1; chunkMap.size < count; step++) {
            addRelativeChunk(chunkMap, trunkLength - 1, branchDirection * step, ['corner', 'branch']);
        }

        return normalizeRelativeChunks(chunkMap);
    }

    function buildNeckShape(count, random) {
        const clamp = shared.clamp || ((value) => value);
        const chunkMap = createChunkRecordMap();
        const coreCount = clamp(count <= 4 ? 2 : Math.floor(count * 0.45), 2, Math.max(2, count - 1));
        const neckLength = Math.min(count - coreCount, count >= 7 ? 2 : 1);
        const lobeCount = Math.max(0, count - coreCount - neckLength);

        appendCompactCluster(chunkMap, coreCount, 0, 0, random, ['core']);
        const maxCoreX = Math.max(...[...chunkMap.values()].map((value) => value.relX));

        for (let step = 1; step <= neckLength && chunkMap.size < count; step++) {
            addRelativeChunk(chunkMap, maxCoreX + step, 0, ['neck', 'spine']);
        }

        if (lobeCount > 0 && chunkMap.size < count) {
            const lobeAnchorX = maxCoreX + neckLength + 1;
            addRelativeChunk(chunkMap, lobeAnchorX, 0, ['lobe']);
            appendCompactCluster(chunkMap, lobeCount, lobeAnchorX, 0, random, ['lobe']);
        }

        return normalizeRelativeChunks(chunkMap);
    }

    function buildPeninsulaShape(count, random) {
        const clamp = shared.clamp || ((value) => value);
        const chunkMap = createChunkRecordMap();
        const coreCount = clamp(count <= 4 ? 2 : Math.floor(count * 0.52), 2, Math.max(2, count - 1));
        const bridgeLength = Math.min(count - coreCount, Math.max(1, Math.floor((count - coreCount) / 2)));
        const tipCount = Math.max(0, count - coreCount - bridgeLength);

        appendCompactCluster(chunkMap, coreCount, 0, 0, random, ['core']);
        const maxCoreX = Math.max(...[...chunkMap.values()].map((value) => value.relX));

        for (let step = 1; step <= bridgeLength && chunkMap.size < count; step++) {
            addRelativeChunk(chunkMap, maxCoreX + step, 0, ['peninsula', 'neck']);
        }

        if (tipCount > 0 && chunkMap.size < count) {
            const tipAnchorX = maxCoreX + bridgeLength + 1;
            addRelativeChunk(chunkMap, tipAnchorX, 0, ['tip', 'peninsula']);
            appendCompactCluster(chunkMap, tipCount, tipAnchorX, 0, random, ['tip', 'peninsula']);
        }

        return normalizeRelativeChunks(chunkMap);
    }

    function buildForkedShape(count, random) {
        const clamp = shared.clamp || ((value) => value);
        const chunkMap = createChunkRecordMap();
        const trunkLength = clamp(Math.max(2, Math.floor(count * 0.42)), 2, Math.max(2, count - 1));

        for (let x = 0; x < trunkLength && chunkMap.size < count; x++) {
            addRelativeChunk(chunkMap, x, 0, ['spine']);
        }

        const forkX = trunkLength - 1;
        const branchOrder = random() < 0.5 ? [-1, 1] : [1, -1];

        branchOrder.forEach((branchY) => {
            if (chunkMap.size < count) {
                addRelativeChunk(chunkMap, forkX, branchY, ['branch', 'fork']);
            }
        });

        let step = 1;
        while (chunkMap.size < count) {
            branchOrder.forEach((branchY) => {
                if (chunkMap.size < count) {
                    addRelativeChunk(chunkMap, forkX + step, branchY, ['branch', 'fork']);
                }
            });
            step++;
        }

        return normalizeRelativeChunks(chunkMap);
    }

    function buildRelativeChunkMap(relativeChunks) {
        const map = new Map();
        relativeChunks.forEach((chunk) => {
            map.set(chunkKey(chunk.relX, chunk.relY), chunk);
        });
        return map;
    }

    function isRelativeShapeConnected(relativeChunks) {
        if (relativeChunks.length <= 1) {
            return true;
        }

        const relativeMap = buildRelativeChunkMap(relativeChunks);
        const queue = [relativeChunks[0]];
        const visited = new Set([chunkKey(relativeChunks[0].relX, relativeChunks[0].relY)]);

        while (queue.length > 0) {
            const current = queue.shift();

            DIRECTIONS.forEach(({ dx, dy }) => {
                const neighborKey = chunkKey(current.relX + dx, current.relY + dy);

                if (!relativeMap.has(neighborKey) || visited.has(neighborKey)) {
                    return;
                }

                visited.add(neighborKey);
                queue.push(relativeMap.get(neighborKey));
            });
        }

        return visited.size === relativeChunks.length;
    }

    function buildRelativeIslandShape(count, contourKind, random) {
        if (count <= 1) {
            return [{ relX: 0, relY: 0, tags: new Set(['entry']) }];
        }

        let relativeChunks;

        if (contourKind === 'lShaped') {
            relativeChunks = buildLShapedShape(count, random);
        } else if (contourKind === 'neck') {
            relativeChunks = buildNeckShape(count, random);
        } else if (contourKind === 'peninsula') {
            relativeChunks = buildPeninsulaShape(count, random);
        } else if (contourKind === 'forked') {
            relativeChunks = buildForkedShape(count, random);
        } else {
            relativeChunks = buildElongatedShape(count, random);
        }

        let finalizedChunks = expandShapeToTarget(
            relativeChunks,
            count,
            random,
            contourKind === 'forked' ? 'vertical' : 'horizontal'
        );

        if (!isRelativeShapeConnected(finalizedChunks)) {
            finalizedChunks = expandShapeToTarget(buildElongatedShape(count), count, random, 'horizontal');
        }

        return finalizedChunks;
    }

    function getRelativeBoundaryChunks(relativeChunks, directionName) {
        const direction = directionByName[directionName];
        const relativeMap = buildRelativeChunkMap(relativeChunks);

        return relativeChunks.filter(
            (chunk) => !relativeMap.has(chunkKey(chunk.relX + direction.dx, chunk.relY + direction.dy))
        );
    }

    function getAbsoluteBoundaryChunks(island, directionName) {
        const direction = directionByName[directionName];

        return island.chunks.filter(
            (chunk) => !island.chunkMap.has(chunkKey(chunk.chunkX + direction.dx, chunk.chunkY + direction.dy))
        );
    }

    function collectAdjacencyPairs(previousIsland, translatedChunks) {
        const pairs = [];

        translatedChunks.forEach((chunk) => {
            DIRECTIONS.forEach((direction) => {
                const neighborKey = chunkKey(chunk.chunkX - direction.dx, chunk.chunkY - direction.dy);
                if (previousIsland.chunkMap.has(neighborKey)) {
                    pairs.push({
                        previousChunkKey: neighborKey,
                        nextChunkKey: chunkKey(chunk.chunkX, chunk.chunkY),
                        directionFromPrevious: direction.name
                    });
                }
            });
        });

        return pairs;
    }

    function buildTranslatedChunks(relativeChunks, offsetX, offsetY) {
        return relativeChunks.map((chunk) => ({
            chunkX: chunk.relX + offsetX,
            chunkY: chunk.relY + offsetY,
            tags: new Set(chunk.tags)
        }));
    }

    Object.assign(shapes, {
        getForwardProgress,
        getLateralSpread,
        getChunkAxisValue,
        createChunkRecordMap,
        addRelativeChunk,
        hasRelativeChunk,
        normalizeRelativeChunks,
        appendCompactCluster,
        buildElongatedShape,
        expandShapeToTarget,
        buildLShapedShape,
        buildNeckShape,
        buildPeninsulaShape,
        buildForkedShape,
        buildRelativeChunkMap,
        isRelativeShapeConnected,
        buildRelativeIslandShape,
        getRelativeBoundaryChunks,
        getAbsoluteBoundaryChunks,
        collectAdjacencyPairs,
        buildTranslatedChunks
    });
})();
