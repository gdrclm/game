(() => {
    const game = window.Game;
    const worldSpawnRuntime = game.systems.worldSpawnRuntime = game.systems.worldSpawnRuntime || {};
    const interactionShared = game.systems.interactionShared = game.systems.interactionShared || {};

    function tileKey(x, y) {
        return game.systems.houseLayout.tileKey(x, y);
    }

    function isGroundTile(tileType) {
        return game.systems.content.isGroundTile(tileType);
    }

    function getLootSystem() {
        return game.systems.loot || null;
    }

    function isInteriorInteractionKind(kind) {
        return kind === 'merchant'
            || kind === 'artisan'
            || kind === 'chest'
            || kind === 'emptyHouse'
            || kind === 'trapHouse'
            || kind === 'jackpotChest'
            || kind === 'finalChest';
    }

    function isGroundItemInteraction(interaction) {
        return Boolean(interaction && interaction.kind === 'groundItem');
    }

    function getGroundItemsState() {
        const state = game.state;
        state.groundItemsByKey = state.groundItemsByKey || {};
        return state.groundItemsByKey;
    }

    function cloneGroundItemBundle(item) {
        return item
            ? {
                id: item.id,
                icon: item.icon,
                label: item.label,
                quantity: Math.max(1, item.quantity || 1)
            }
            : null;
    }

    function cloneRewardMap(rewardMap) {
        return rewardMap ? { ...rewardMap } : undefined;
    }

    function cloneLootPlan(plan) {
        if (!plan) {
            return undefined;
        }

        return {
            ...plan,
            drops: Array.isArray(plan.drops) ? plan.drops.map((drop) => ({ ...drop })) : [],
            statDelta: cloneRewardMap(plan.statDelta),
            rewardDelta: cloneRewardMap(plan.rewardDelta)
        };
    }

    function getDoorVectors(doorType) {
        if (doorType === 'east') {
            return {
                forward: { x: 1, y: 0 },
                laterals: [{ x: 0, y: -1 }, { x: 0, y: 1 }]
            };
        }

        return {
            forward: { x: 0, y: 1 },
            laterals: [{ x: -1, y: 0 }, { x: 1, y: 0 }]
        };
    }

    function getHouseCellSet(houses) {
        const set = new Set();

        houses.forEach((house) => {
            house.localCells.forEach((cell) => {
                set.add(tileKey(cell.x, cell.y));
            });
        });

        return set;
    }

    function isValidInteractionTile(chunkData, x, y, houseCellSet, occupiedKeys) {
        const chunkSize = game.config.chunkSize;

        if (x < 0 || x >= chunkSize || y < 0 || y >= chunkSize) {
            return false;
        }

        if (!isGroundTile(chunkData[y][x])) {
            return false;
        }

        const key = tileKey(x, y);

        if (houseCellSet.has(key) || occupiedKeys.has(key)) {
            return false;
        }

        return true;
    }

    function addCandidate(candidates, seen, chunkData, x, y, baseScore, houseCellSet, occupiedKeys, random) {
        const key = tileKey(x, y);

        if (seen.has(key)) {
            return;
        }

        seen.add(key);

        if (!isValidInteractionTile(chunkData, x, y, houseCellSet, occupiedKeys)) {
            return;
        }

        candidates.push({
            x,
            y,
            score: baseScore + random() * 0.05
        });
    }

    function collectDoorCandidates(house, chunkData, houseCellSet, occupiedKeys, random) {
        const candidates = [];
        const seen = new Set();

        if (!house.door) {
            return candidates;
        }

        const vectors = getDoorVectors(house.door.type);
        const outside = house.door.localOutside;
        const forward = vectors.forward;
        const [lateralA, lateralB] = vectors.laterals;

        addCandidate(candidates, seen, chunkData, outside.x + forward.x, outside.y + forward.y, 12, houseCellSet, occupiedKeys, random);
        addCandidate(candidates, seen, chunkData, outside.x, outside.y, 10, houseCellSet, occupiedKeys, random);
        addCandidate(candidates, seen, chunkData, outside.x + lateralA.x, outside.y + lateralA.y, 9, houseCellSet, occupiedKeys, random);
        addCandidate(candidates, seen, chunkData, outside.x + lateralB.x, outside.y + lateralB.y, 9, houseCellSet, occupiedKeys, random);
        addCandidate(
            candidates,
            seen,
            chunkData,
            outside.x + forward.x + lateralA.x,
            outside.y + forward.y + lateralA.y,
            8,
            houseCellSet,
            occupiedKeys,
            random
        );
        addCandidate(
            candidates,
            seen,
            chunkData,
            outside.x + forward.x + lateralB.x,
            outside.y + forward.y + lateralB.y,
            8,
            houseCellSet,
            occupiedKeys,
            random
        );
        addCandidate(candidates, seen, chunkData, outside.x + forward.x * 2, outside.y + forward.y * 2, 7, houseCellSet, occupiedKeys, random);

        for (let radius = 1; radius <= 2; radius++) {
            for (let offsetY = -radius; offsetY <= radius; offsetY++) {
                for (let offsetX = -radius; offsetX <= radius; offsetX++) {
                    const distance = Math.abs(offsetX) + Math.abs(offsetY);

                    if (distance === 0 || distance > radius + 1) {
                        continue;
                    }

                    addCandidate(
                        candidates,
                        seen,
                        chunkData,
                        outside.x + offsetX,
                        outside.y + offsetY,
                        6 - distance,
                        houseCellSet,
                        occupiedKeys,
                        random
                    );
                }
            }
        }

        return candidates;
    }

    function collectPerimeterCandidates(house, chunkData, houseCellSet, occupiedKeys, random) {
        const candidates = [];
        const seen = new Set();
        const seedX = house.localOriginX + Math.floor(house.footprint.widthTiles / 2);
        const seedY = house.localOriginY + Math.floor(house.footprint.depthTiles / 2);
        const offsets = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 },
            { x: 1, y: 1 },
            { x: 1, y: -1 },
            { x: -1, y: 1 },
            { x: -1, y: -1 }
        ];

        house.localCells.forEach((cell) => {
            offsets.forEach((offset) => {
                const x = cell.x + offset.x;
                const y = cell.y + offset.y;
                const distancePenalty = Math.abs(x - seedX) + Math.abs(y - seedY);

                addCandidate(
                    candidates,
                    seen,
                    chunkData,
                    x,
                    y,
                    4 - distancePenalty * 0.15,
                    houseCellSet,
                    occupiedKeys,
                    random
                );
            });
        });

        return candidates;
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

    function collectWildernessCandidates(chunkData, houseCellSet, occupiedKeys, houses, random, options = {}) {
        const candidates = [];
        const chunkSize = game.config.chunkSize;
        const requireGrass = Boolean(options.requireGrass);

        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                if (!isValidInteractionTile(chunkData, x, y, houseCellSet, occupiedKeys)) {
                    continue;
                }

                if (requireGrass && chunkData[y][x] !== 'grass') {
                    continue;
                }

                const nearestHouseDistance = getNearestHouseDistance(x, y, houses);
                const safeNearestHouseDistance = Number.isFinite(nearestHouseDistance) ? nearestHouseDistance : 6;
                const edgeDistance = Math.min(x, y, chunkSize - 1 - x, chunkSize - 1 - y);

                if (safeNearestHouseDistance < 3 || edgeDistance < 1) {
                    continue;
                }

                candidates.push({
                    x,
                    y,
                    score: safeNearestHouseDistance * 0.9 + Math.min(edgeDistance, 4) * 0.2 + random() * 0.2
                });
            }
        }

        return candidates;
    }

    function collectInteriorCandidates(house, occupiedKeys, random) {
        const candidates = [];
        const doorInsideKey = house.door ? tileKey(house.door.localInside.x, house.door.localInside.y) : null;

        house.localCells.forEach((cell) => {
            const key = tileKey(cell.x, cell.y);

            if (key === doorInsideKey || occupiedKeys.has(key)) {
                return;
            }

            candidates.push({
                x: cell.x,
                y: cell.y,
                score: random()
            });
        });

        return candidates;
    }

    function countNeighborTiles(chunkData, x, y, predicate, includeDiagonals = false) {
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

    function collectSpecialInteractionCandidates(chunkData, houseCellSet, occupiedKeys, houses, random, plan = {}) {
        const candidates = [];
        const chunkSize = game.config.chunkSize;
        const spawnHint = plan.spawnHint || 'trail';

        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                if (!isValidInteractionTile(chunkData, x, y, houseCellSet, occupiedKeys)) {
                    continue;
                }

                const tileType = chunkData[y][x];
                const nearestHouseDistance = getNearestHouseDistance(x, y, houses);
                const safeNearestHouseDistance = Number.isFinite(nearestHouseDistance) ? nearestHouseDistance : 6;
                const edgeDistance = Math.min(x, y, chunkSize - 1 - x, chunkSize - 1 - y);
                const trailNeighbors = countNeighborTiles(
                    chunkData,
                    x,
                    y,
                    (candidate) => candidate === 'trail' || candidate === 'bridge'
                );
                const bridgeNeighbors = countNeighborTiles(chunkData, x, y, (candidate) => candidate === 'bridge');
                const waterNeighbors = countNeighborTiles(chunkData, x, y, (candidate) => candidate === 'water');
                const shoreBias = tileType === 'shore' || tileType === 'reeds' ? 1.75 : 0;
                let score = random() * 0.15 + Math.min(edgeDistance, 4) * 0.12;

                switch (spawnHint) {
                case 'water':
                    score += waterNeighbors * 3.6 + shoreBias * 2.2 + trailNeighbors * 0.45;
                    score += safeNearestHouseDistance > 0 ? 0.35 * safeNearestHouseDistance : -1.5;
                    if (tileType === 'bridge') {
                        score -= 2.5;
                    }
                    break;
                case 'bridge':
                    score += bridgeNeighbors * 4.2 + trailNeighbors * 1.7 + (tileType === 'trail' ? 1.15 : 0);
                    score += waterNeighbors > 0 ? 0.65 : 0;
                    score += safeNearestHouseDistance > 0 ? 0.25 * Math.min(safeNearestHouseDistance, 4) : -1;
                    break;
                case 'meadow':
                    score += tileType === 'grass' ? 2.8 : 0;
                    score += tileType === 'reeds' ? 2.2 : 0;
                    score += Math.max(0, safeNearestHouseDistance - 1) * 0.8;
                    score += waterNeighbors * 0.35 + trailNeighbors * 0.25;
                    break;
                case 'settlement':
                    score += trailNeighbors * 2.4 + (tileType === 'trail' ? 1.3 : 0);
                    score += Math.max(0, 3.5 - Math.abs(safeNearestHouseDistance - 2.5)) * 0.9;
                    if (edgeDistance < 1) {
                        score -= 1.6;
                    }
                    break;
                case 'remote':
                    score += safeNearestHouseDistance * 1.15 + edgeDistance * 0.7;
                    score += waterNeighbors * 0.5;
                    score -= trailNeighbors * 0.25;
                    if (tileType === 'trail') {
                        score -= 0.7;
                    }
                    break;
                case 'trail':
                default:
                    score += trailNeighbors * 2.9 + (tileType === 'trail' ? 2.35 : 0);
                    score += Math.max(0, 3 - Math.abs(safeNearestHouseDistance - 2)) * 0.75;
                    break;
                }

                if (score <= 0.2) {
                    continue;
                }

                candidates.push({ x, y, score });
            }
        }

        return candidates;
    }

    function createInteractionRecord(house, chunkX, chunkY, localX, localY, placement = 'exterior') {
        const chunkSize = game.config.chunkSize;
        const expedition = house.expedition || {};
        const worldX = chunkX * chunkSize + localX;
        const worldY = chunkY * chunkSize + localY;

        return {
            id: `interaction:${house.id}`,
            houseId: house.id,
            house,
            chunkX,
            chunkY,
            localX,
            localY,
            worldX,
            worldY,
            renderDepth: worldX + worldY + 0.35,
            placement,
            kind: expedition.kind || 'shelter',
            expedition
        };
    }

    function createStandaloneInteractionRecord(chunkX, chunkY, localX, localY, expedition = {}, options = {}) {
        const chunkSize = game.config.chunkSize;
        const worldX = chunkX * chunkSize + localX;
        const worldY = chunkY * chunkSize + localY;
        const interactionId = options.id || `interaction:${chunkX}:${chunkY}:${localX}:${localY}`;

        return {
            id: interactionId,
            houseId: options.houseId || interactionId,
            house: null,
            chunkX,
            chunkY,
            localX,
            localY,
            worldX,
            worldY,
            renderDepth: worldX + worldY + (Number.isFinite(options.renderDepthOffset) ? options.renderDepthOffset : 0.35),
            placement: options.placement || 'exterior',
            kind: expedition.kind || options.kind || 'chest',
            label: expedition.label || options.label || 'Тайник',
            expedition
        };
    }

    function createGroundItemInteractionRecord(worldX, worldY, itemBundles, options = {}) {
        const world = game.systems.world;
        const { chunkX, chunkY } = world.getChunkCoordinatesForWorld(worldX, worldY);
        const { localX, localY } = world.getLocalCoordinatesForWorld(worldX, worldY);
        const targetChunk = options.chunk || world.getChunk(chunkX, chunkY, { generateIfMissing: false });
        const house = options.house !== undefined
            ? options.house
            : (targetChunk ? game.systems.houses.getHouseAtChunkTile(targetChunk, localX, localY) : null);
        const items = Array.isArray(itemBundles)
            ? itemBundles.map((item) => cloneGroundItemBundle(item)).filter(Boolean)
            : [];
        const preview = items[0] || null;

        return {
            id: `ground:${worldX},${worldY}`,
            houseId: house ? house.id : null,
            house,
            chunkX,
            chunkY,
            localX,
            localY,
            worldX,
            worldY,
            renderDepth: worldX + worldY + 0.22,
            placement: house ? 'interior' : 'exterior',
            kind: 'groundItem',
            items,
            label: preview ? preview.label : 'Р‘СЂРѕС€РµРЅРЅС‹Р№ РїСЂРµРґРјРµС‚',
            icon: preview ? preview.icon : '?'
        };
    }

    function getGroundItemStateAtWorld(worldX, worldY) {
        return getGroundItemsState()[`${worldX},${worldY}`] || null;
    }

    function setGroundItemStateAtWorld(worldX, worldY, items) {
        const state = getGroundItemsState();
        const key = `${worldX},${worldY}`;

        if (!Array.isArray(items) || items.length === 0) {
            delete state[key];
            return null;
        }

        state[key] = items.map((item) => cloneGroundItemBundle(item)).filter(Boolean);
        return state[key];
    }

    function mergeGroundItemBundles(items, bundle) {
        const nextItems = Array.isArray(items)
            ? items.map((item) => cloneGroundItemBundle(item)).filter(Boolean)
            : [];
        const nextBundle = cloneGroundItemBundle(bundle);
        const lootSystem = game.systems.loot;
        const isStackable = nextBundle && lootSystem && typeof lootSystem.isItemStackable === 'function'
            ? lootSystem.isItemStackable(nextBundle.id)
            : false;

        if (!nextBundle) {
            return nextItems;
        }

        const existing = isStackable ? nextItems.find((item) => item.id === nextBundle.id) : null;

        if (existing) {
            existing.quantity += nextBundle.quantity;
        } else {
            nextItems.push(nextBundle);
        }

        return nextItems;
    }

    function appendPersistentGroundItems(result, chunkX, chunkY, houses = []) {
        const chunkSize = game.config.chunkSize;
        const baseWorldX = chunkX * chunkSize;
        const baseWorldY = chunkY * chunkSize;

        Object.entries(getGroundItemsState()).forEach(([key, items]) => {
            const [worldX, worldY] = key.split(',').map(Number);

            if (
                worldX < baseWorldX
                || worldX >= baseWorldX + chunkSize
                || worldY < baseWorldY
                || worldY >= baseWorldY + chunkSize
            ) {
                return;
            }

            const localX = worldX - baseWorldX;
            const localY = worldY - baseWorldY;
            const house = houses.find((candidate) => candidate && candidate.localCellSet && candidate.localCellSet.has(tileKey(localX, localY))) || null;

            result.push(createGroundItemInteractionRecord(worldX, worldY, items, { house }));
        });
    }

    function buildTrailCacheExpedition(cacheId, progression, chunkRecord, random) {
        if (!progression) {
            return null;
        }

        const lootSystem = getLootSystem();
        const chestTier = chunkRecord && chunkRecord.tags && chunkRecord.tags.has('vault') && random() < 0.24
            ? 'rich'
            : 'hidden';
        const lootPlan = lootSystem && typeof lootSystem.createChestLootPlan === 'function'
            ? lootSystem.createChestLootPlan(
                progression.islandIndex,
                chestTier,
                progression.archetype,
                random,
                {
                    scenario: progression.scenario,
                    remote: Boolean(chunkRecord && chunkRecord.tags && (chunkRecord.tags.has('remote') || chunkRecord.tags.has('tip'))),
                    vault: Boolean(chunkRecord && chunkRecord.tags && chunkRecord.tags.has('vault'))
                }
            )
            : null;

        return {
            id: cacheId,
            islandIndex: progression.islandIndex,
            archetype: progression.archetype,
            scenario: progression.scenario,
            kind: 'chest',
            chestTier,
            label: chestTier === 'rich' ? 'Схрон у тропы' : 'Спрятанный тайник',
            summary: 'Небольшой схрон за ложной тропой. Такие тайники лежат чуть в стороне от удобного маршрута.',
            lootPlan: cloneLootPlan(lootPlan)
        };
    }

    function appendTrailCacheInteractions(result, chunkX, chunkY, chunkData, houses, occupiedKeys, random, options = {}) {
        const trailMeta = options.trailMeta && Array.isArray(options.trailMeta.deadEndBranches)
            ? options.trailMeta
            : null;
        const progression = options.progression || null;
        const chunkRecord = options.chunkRecord || null;
        const resolvedMap = game.state.resolvedHouseIds || {};
        const houseCellSet = getHouseCellSet(houses);

        if (!trailMeta || !progression) {
            return;
        }

        trailMeta.deadEndBranches.forEach((branch) => {
            const cachePoint = branch && branch.cachePoint ? branch.cachePoint : null;

            if (!cachePoint) {
                return;
            }

            const cacheId = `trail-cache:${chunkX}:${chunkY}:${cachePoint.x}:${cachePoint.y}`;
            if (resolvedMap[cacheId]) {
                return;
            }

            if (!isValidInteractionTile(chunkData, cachePoint.x, cachePoint.y, houseCellSet, occupiedKeys)) {
                return;
            }

            const expedition = buildTrailCacheExpedition(cacheId, progression, chunkRecord, random);
            if (!expedition) {
                return;
            }

            occupiedKeys.add(tileKey(cachePoint.x, cachePoint.y));
            result.push(createStandaloneInteractionRecord(
                chunkX,
                chunkY,
                cachePoint.x,
                cachePoint.y,
                expedition,
                {
                    id: cacheId,
                    houseId: cacheId,
                    placement: 'exterior',
                    renderDepthOffset: 0.32
                }
            ));
        });
    }

    function appendSpecialInteractionPlans(result, chunkX, chunkY, chunkData, houses, occupiedKeys, random, options = {}) {
        const chunkRecord = options.chunkRecord || null;
        const plans = chunkRecord && Array.isArray(chunkRecord.specialInteractionPlans)
            ? chunkRecord.specialInteractionPlans
            : [];
        const houseCellSet = getHouseCellSet(houses);

        if (plans.length === 0) {
            return;
        }

        plans.forEach((plan, index) => {
            const candidates = collectSpecialInteractionCandidates(
                chunkData,
                houseCellSet,
                occupiedKeys,
                houses,
                random,
                plan
            )
                .concat(collectWildernessCandidates(chunkData, houseCellSet, occupiedKeys, houses, random))
                .sort((left, right) => right.score - left.score);
            const picked = candidates[0];

            if (!picked) {
                return;
            }

            const interactionId = `island-npc:${plan.npcId || plan.id || index}:${chunkX}:${chunkY}:${picked.x}:${picked.y}`;
            occupiedKeys.add(tileKey(picked.x, picked.y));
            result.push(createStandaloneInteractionRecord(
                chunkX,
                chunkY,
                picked.x,
                picked.y,
                plan,
                {
                    id: interactionId,
                    houseId: interactionId,
                    placement: 'exterior',
                    renderDepthOffset: 0.41
                }
            ));
        });
    }

    function createChunkInteractions(chunkX, chunkY, chunkData, houses, random, options = {}) {
        const result = [];
        const occupiedKeys = new Set();
        const houseCellSet = getHouseCellSet(houses);

        houses
            .filter((house) => house && house.expedition)
            .forEach((house) => {
                const interactionKind = house.expedition ? house.expedition.kind : 'shelter';
                const useInteriorPlacement = isInteriorInteractionKind(interactionKind);
                const useOutdoorGrassPlacement = interactionKind === 'well' || interactionKind === 'forage';
                const exteriorCandidates = collectDoorCandidates(house, chunkData, houseCellSet, occupiedKeys, random)
                    .concat(collectPerimeterCandidates(house, chunkData, houseCellSet, occupiedKeys, random));
                const wildernessCandidates = collectWildernessCandidates(
                    chunkData,
                    houseCellSet,
                    occupiedKeys,
                    houses,
                    random,
                    { requireGrass: useOutdoorGrassPlacement }
                );
                const candidates = (
                    interactionKind === 'shelter'
                        ? wildernessCandidates.concat(exteriorCandidates)
                        : (
                            useOutdoorGrassPlacement
                                ? wildernessCandidates
                                : (
                                    useInteriorPlacement
                                        ? collectInteriorCandidates(house, occupiedKeys, random)
                                        : exteriorCandidates
                                )
                        )
                ).sort((left, right) => right.score - left.score);
                const picked = candidates[0];

                if (!picked) {
                    return;
                }

                occupiedKeys.add(tileKey(picked.x, picked.y));
                const interaction = createInteractionRecord(
                    house,
                    chunkX,
                    chunkY,
                    picked.x,
                    picked.y,
                    interactionKind === 'shelter' || useOutdoorGrassPlacement
                        ? 'exterior'
                        : (useInteriorPlacement ? 'interior' : 'exterior')
                );
                house.interactionId = interaction.id;
                result.push(interaction);
            });

        appendSpecialInteractionPlans(result, chunkX, chunkY, chunkData, houses, occupiedKeys, random, options);
        appendTrailCacheInteractions(result, chunkX, chunkY, chunkData, houses, occupiedKeys, random, options);
        appendPersistentGroundItems(result, chunkX, chunkY, houses);
        return result;
    }

    function buildInteractionTileMap(interactionList) {
        const map = new Map();

        interactionList.forEach((interaction) => {
            map.set(tileKey(interaction.localX, interaction.localY), interaction);
        });

        return map;
    }

    function syncGroundItemInteraction(worldX, worldY) {
        const chunkInfo = game.systems.world.getChunkCoordinatesForWorld(worldX, worldY);
        const chunk = game.systems.world.getChunk(chunkInfo.chunkX, chunkInfo.chunkY, { generateIfMissing: false });

        if (!chunk) {
            return null;
        }

        const { localX, localY } = game.systems.world.getLocalCoordinatesForWorld(worldX, worldY);
        const key = tileKey(localX, localY);
        const existing = chunk.interactionTileMap instanceof Map
            ? chunk.interactionTileMap.get(key) || null
            : null;
        const stateItems = getGroundItemStateAtWorld(worldX, worldY);

        if (!stateItems || stateItems.length === 0) {
            if (existing && isGroundItemInteraction(existing)) {
                removeInteraction(existing);
            }

            return null;
        }

        if (existing && !isGroundItemInteraction(existing)) {
            return existing;
        }

        const interaction = createGroundItemInteractionRecord(worldX, worldY, stateItems, { chunk });

        if (existing && isGroundItemInteraction(existing)) {
            Object.assign(existing, interaction);
        } else {
            chunk.interactions = Array.isArray(chunk.interactions) ? chunk.interactions : [];
            chunk.interactions.push(interaction);
        }

        chunk.interactionTileMap = buildInteractionTileMap(chunk.interactions || []);
        chunk.renderCache = null;
        return interaction;
    }

    function addGroundItemDrop(worldX, worldY, item) {
        const nextItems = mergeGroundItemBundles(getGroundItemStateAtWorld(worldX, worldY), item);
        setGroundItemStateAtWorld(worldX, worldY, nextItems);
        return syncGroundItemInteraction(worldX, worldY);
    }

    function replaceGroundItemAtWorld(worldX, worldY, items) {
        setGroundItemStateAtWorld(worldX, worldY, items);
        return syncGroundItemInteraction(worldX, worldY);
    }

    function removeInteraction(interactionOrId) {
        const interaction = typeof interactionOrId === 'string'
            ? null
            : interactionOrId;
        const targetId = typeof interactionOrId === 'string'
            ? interactionOrId
            : (interaction ? interaction.id : null);

        if (!targetId) {
            return false;
        }

        const chunkX = interaction ? interaction.chunkX : null;
        const chunkY = interaction ? interaction.chunkY : null;
        const candidateChunks = chunkX === null || chunkY === null
            ? Object.values(game.state.loadedChunks || {})
            : [game.systems.world.getChunk(chunkX, chunkY, { generateIfMissing: false })];

        for (const chunk of candidateChunks) {
            if (!chunk || !Array.isArray(chunk.interactions)) {
                continue;
            }

            const index = chunk.interactions.findIndex((item) => item.id === targetId);

            if (index === -1) {
                continue;
            }

            const [removed] = chunk.interactions.splice(index, 1);

            if (chunk.interactionTileMap instanceof Map) {
                chunk.interactionTileMap.delete(tileKey(removed.localX, removed.localY));
            } else {
                chunk.interactionTileMap = buildInteractionTileMap(chunk.interactions);
            }

            chunk.renderCache = null;

            if (game.state.activeInteractionId === targetId) {
                game.state.activeInteraction = null;
                game.state.activeInteractionId = null;
            }

            return true;
        }

        return false;
    }

    Object.assign(interactionShared, {
        tileKey,
        isGroundItemInteraction,
        buildInteractionTileMap
    });

    Object.assign(worldSpawnRuntime, {
        createChunkInteractions,
        buildInteractionTileMap,
        addGroundItemDrop,
        replaceGroundItemAtWorld,
        removeInteraction
    });

    const interactions = game.systems.interactions = game.systems.interactions || {};
    Object.assign(interactions, {
        spawns: worldSpawnRuntime,
        createChunkInteractions,
        buildInteractionTileMap,
        addGroundItemDrop,
        replaceGroundItemAtWorld,
        removeInteraction
    });
})();
