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
                const edgeDistance = Math.min(x, y, chunkSize - 1 - x, chunkSize - 1 - y);

                if (nearestHouseDistance < 3 || edgeDistance < 1) {
                    continue;
                }

                candidates.push({
                    x,
                    y,
                    score: nearestHouseDistance * 0.9 + Math.min(edgeDistance, 4) * 0.2 + random() * 0.2
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

    function createChunkInteractions(chunkX, chunkY, chunkData, houses, random) {
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
