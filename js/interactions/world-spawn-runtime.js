(() => {
    const game = window.Game;
    const worldSpawnRuntime = game.systems.worldSpawnRuntime = game.systems.worldSpawnRuntime || {};
    const interactionShared = game.systems.interactionShared = game.systems.interactionShared || {};

    function cloneValue(value) {
        if (Array.isArray(value)) {
            return value.map(cloneValue);
        }

        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)])
            );
        }

        return value;
    }

    function tileKey(x, y) {
        return game.systems.houseLayout.tileKey(x, y);
    }

    function isGroundTile(tileType) {
        return game.systems.content.isGroundTile(tileType);
    }

    function getLootSystem() {
        return game.systems.loot || null;
    }

    function getResourceRegistry() {
        return game.systems.resourceRegistry || null;
    }

    function getStateSchema() {
        return game.systems.stateSchema || null;
    }

    function getCraftingStateStore() {
        if (!game.state || typeof game.state !== 'object') {
            return {};
        }

        if (!game.state.craftingState || typeof game.state.craftingState !== 'object') {
            const stateSchema = getStateSchema();
            const defaultCraftingState = stateSchema && typeof stateSchema.createDomainState === 'function'
                ? stateSchema.createDomainState().craftingState
                : {
                    resources: {},
                    containers: {},
                    knownRecipes: {},
                    stationUnlocks: {},
                    resourceNodesState: {},
                    resourceNodeIslandState: {}
                };

            game.state.craftingState = cloneValue(defaultCraftingState);
        }

        return game.state.craftingState;
    }

    function getResourceNodeStateStore() {
        const craftingState = getCraftingStateStore();

        if (!craftingState.resourceNodesState || typeof craftingState.resourceNodesState !== 'object') {
            craftingState.resourceNodesState = {};
        }

        return craftingState.resourceNodesState;
    }

    function getResourceNodeIslandStateStore() {
        const craftingState = getCraftingStateStore();

        if (!craftingState.resourceNodeIslandState || typeof craftingState.resourceNodeIslandState !== 'object') {
            craftingState.resourceNodeIslandState = {};
        }

        return craftingState.resourceNodeIslandState;
    }

    function getCurrentTimeOfDayAdvancesElapsed() {
        return Number.isFinite(game.state.timeOfDayAdvancesElapsed)
            ? Math.max(0, Math.floor(game.state.timeOfDayAdvancesElapsed))
            : 0;
    }

    function getResourceNodeDefinition(resourceNodeKind) {
        const resourceRegistry = getResourceRegistry();
        return resourceRegistry && typeof resourceRegistry.getResourceNodeDefinition === 'function'
            ? resourceRegistry.getResourceNodeDefinition(resourceNodeKind)
            : null;
    }

    function getResourceNodeRespawnPolicy(definition) {
        const resourceRegistry = getResourceRegistry();
        if (resourceRegistry && typeof resourceRegistry.getResourceNodeRespawnPolicy === 'function') {
            return resourceRegistry.getResourceNodeRespawnPolicy(definition);
        }

        return {
            mode: 'singleUse',
            islandLimit: null,
            limitGroupId: definition && definition.resourceId ? definition.resourceId : ''
        };
    }

    function getResourceNodeRespawnPolicyLabel(policy) {
        const resourceRegistry = getResourceRegistry();
        if (resourceRegistry && typeof resourceRegistry.getResourceNodeRespawnPolicyLabel === 'function') {
            return resourceRegistry.getResourceNodeRespawnPolicyLabel(policy);
        }

        return 'одноразовый узел';
    }

    function getResourceNodeDurabilityProfile(definition) {
        const profile = definition && definition.durabilityProfile && typeof definition.durabilityProfile === 'object'
            ? definition.durabilityProfile
            : {};
        return {
            maxHarvests: Math.max(1, Math.floor(Number(profile.maxHarvests) || 1)),
            regenerationTimeAdvances: Math.max(0, Math.floor(Number(profile.regenerationTimeAdvances) || 0))
        };
    }

    function getResourceNodeStateLabel(nodeState) {
        switch (nodeState) {
            case 'used':
                return 'used';
            case 'depleted':
                return 'depleted';
            case 'regenerating':
                return 'regenerating';
            case 'fresh':
            default:
                return 'fresh';
        }
    }

    function getInteractionIslandIndex(interaction, definition = null) {
        if (interaction && Number.isFinite(interaction.islandIndex)) {
            return Math.max(1, Math.floor(interaction.islandIndex));
        }

        if (interaction && interaction.expedition && Number.isFinite(interaction.expedition.islandIndex)) {
            return Math.max(1, Math.floor(interaction.expedition.islandIndex));
        }

        const resolvedDefinition = definition || (interaction ? getResourceNodeDefinition(interaction.resourceNodeKind) : null);
        const window = resolvedDefinition && resolvedDefinition.requiredIslands ? resolvedDefinition.requiredIslands : null;
        if (window && Number.isFinite(window.from)) {
            return Math.max(1, Math.floor(window.from));
        }

        return Number.isFinite(game.state.currentIslandIndex)
            ? Math.max(1, Math.floor(game.state.currentIslandIndex))
            : 1;
    }

    function buildResourceNodeIslandLimitKey(interaction, definition, policy) {
        if (!policy || policy.mode !== 'hardLimited') {
            return '';
        }

        const islandIndex = getInteractionIslandIndex(interaction, definition);
        const limitGroupId = policy.limitGroupId || (definition && definition.resourceId) || (definition && definition.id) || 'resourceNode';
        return `${islandIndex}:${limitGroupId}`;
    }

    function resolveResourceNodeIslandLimitEntry(entry, policy) {
        return {
            consumed: Number.isFinite(entry && entry.consumed)
                ? Math.max(0, Math.floor(entry.consumed))
                : 0,
            islandLimit: Number.isFinite(policy && policy.islandLimit)
                ? Math.max(1, Math.floor(policy.islandLimit))
                : null
        };
    }

    function persistResourceNodeIslandLimitEntry(limitKey, entry) {
        if (!limitKey) {
            return null;
        }

        const stateStore = getResourceNodeIslandStateStore();
        if (!entry || !Number.isFinite(entry.consumed) || entry.consumed <= 0) {
            delete stateStore[limitKey];
            return null;
        }

        stateStore[limitKey] = {
            consumed: Math.max(0, Math.floor(entry.consumed)),
            islandLimit: Number.isFinite(entry.islandLimit) ? Math.max(1, Math.floor(entry.islandLimit)) : null
        };
        return stateStore[limitKey];
    }

    function getResourceNodeIslandLimitSnapshot(interaction, definition, policy) {
        const limitKey = buildResourceNodeIslandLimitKey(interaction, definition, policy);
        const entry = limitKey
            ? getResourceNodeIslandStateStore()[limitKey]
            : null;
        const resolved = resolveResourceNodeIslandLimitEntry(entry, policy);
        const remaining = resolved.islandLimit === null
            ? null
            : Math.max(0, resolved.islandLimit - resolved.consumed);

        return {
            limitKey,
            islandIndex: getInteractionIslandIndex(interaction, definition),
            consumed: resolved.consumed,
            islandLimit: resolved.islandLimit,
            remaining,
            exhausted: resolved.islandLimit !== null && resolved.consumed >= resolved.islandLimit
        };
    }

    function consumeResourceNodeIslandLimit(interaction, definition, policy, amount = 1) {
        const snapshot = getResourceNodeIslandLimitSnapshot(interaction, definition, policy);
        if (!snapshot.limitKey || !Number.isFinite(snapshot.islandLimit)) {
            return snapshot;
        }

        const nextEntry = {
            consumed: snapshot.consumed + Math.max(0, Math.floor(amount)),
            islandLimit: snapshot.islandLimit
        };
        persistResourceNodeIslandLimitEntry(snapshot.limitKey, nextEntry);
        return getResourceNodeIslandLimitSnapshot(interaction, definition, policy);
    }

    function buildDefaultResourceNodeStateEntry(definition) {
        const durabilityProfile = getResourceNodeDurabilityProfile(definition);
        return {
            nodeState: 'fresh',
            nodeStateReason: 'durability',
            durabilityRemaining: durabilityProfile.maxHarvests,
            durabilityMax: durabilityProfile.maxHarvests,
            regenerationTimeAdvances: durabilityProfile.regenerationTimeAdvances,
            regenerationReadyAtAdvance: null
        };
    }

    function resolveResourceNodeStateEntry(entry, definition) {
        const defaults = buildDefaultResourceNodeStateEntry(definition);
        const normalizedEntry = entry && typeof entry === 'object'
            ? cloneValue(entry)
            : {};
        const resolved = {
            nodeState: typeof normalizedEntry.nodeState === 'string'
                ? normalizedEntry.nodeState.trim().toLowerCase()
                : defaults.nodeState,
            nodeStateReason: 'durability',
            durabilityRemaining: Number.isFinite(normalizedEntry.durabilityRemaining)
                ? Math.max(0, Math.floor(normalizedEntry.durabilityRemaining))
                : defaults.durabilityRemaining,
            durabilityMax: defaults.durabilityMax,
            regenerationTimeAdvances: defaults.regenerationTimeAdvances,
            regenerationReadyAtAdvance: Number.isFinite(normalizedEntry.regenerationReadyAtAdvance)
                ? Math.max(0, Math.floor(normalizedEntry.regenerationReadyAtAdvance))
                : null
        };
        const currentAdvance = getCurrentTimeOfDayAdvancesElapsed();

        if (resolved.nodeState === 'regenerating' && resolved.regenerationTimeAdvances > 0 && resolved.regenerationReadyAtAdvance === null) {
            resolved.regenerationReadyAtAdvance = currentAdvance + resolved.regenerationTimeAdvances;
        }

        if (
            resolved.nodeState === 'regenerating'
            && resolved.regenerationReadyAtAdvance !== null
            && currentAdvance >= resolved.regenerationReadyAtAdvance
        ) {
            resolved.nodeState = 'fresh';
            resolved.durabilityRemaining = resolved.durabilityMax;
            resolved.regenerationReadyAtAdvance = null;
        }

        if (resolved.durabilityRemaining >= resolved.durabilityMax && resolved.nodeState !== 'regenerating') {
            resolved.nodeState = 'fresh';
        } else if (resolved.durabilityRemaining > 0 && resolved.nodeState !== 'regenerating') {
            resolved.nodeState = 'used';
        } else if (resolved.durabilityRemaining <= 0 && resolved.nodeState !== 'regenerating') {
            resolved.nodeState = resolved.regenerationTimeAdvances > 0 ? 'regenerating' : 'depleted';
        }

        if (resolved.nodeState === 'regenerating' && resolved.regenerationTimeAdvances <= 0) {
            resolved.nodeState = 'depleted';
            resolved.regenerationReadyAtAdvance = null;
        }

        resolved.nodeStateLabel = getResourceNodeStateLabel(resolved.nodeState);
        return resolved;
    }

    function isDefaultResourceNodeStateEntry(entry) {
        return Boolean(
            entry
            && entry.nodeState === 'fresh'
            && entry.durabilityRemaining >= entry.durabilityMax
            && entry.regenerationReadyAtAdvance === null
        );
    }

    function persistResourceNodeStateEntry(interactionId, entry) {
        if (!interactionId) {
            return null;
        }

        const stateStore = getResourceNodeStateStore();

        if (!entry || isDefaultResourceNodeStateEntry(entry)) {
            delete stateStore[interactionId];
            return null;
        }

        stateStore[interactionId] = {
            nodeState: entry.nodeState,
            durabilityRemaining: entry.durabilityRemaining,
            regenerationReadyAtAdvance: entry.regenerationReadyAtAdvance
        };
        return stateStore[interactionId];
    }

    function syncResourceNodeInteractionState(interaction, definition = null) {
        if (!isResourceNodeInteraction(interaction)) {
            return interaction;
        }

        const resolvedDefinition = definition || getResourceNodeDefinition(interaction.resourceNodeKind);
        const stateStore = getResourceNodeStateStore();
        const resolvedState = resolveResourceNodeStateEntry(stateStore[interaction.id], resolvedDefinition);
        const respawnPolicy = getResourceNodeRespawnPolicy(resolvedDefinition);
        const limitSnapshot = getResourceNodeIslandLimitSnapshot(interaction, resolvedDefinition, respawnPolicy);
        const nextState = {
            ...resolvedState,
            respawnPolicyMode: respawnPolicy.mode,
            respawnPolicyLabel: getResourceNodeRespawnPolicyLabel(respawnPolicy),
            islandLimitConsumed: limitSnapshot.consumed,
            islandLimitMax: limitSnapshot.islandLimit,
            islandLimitRemaining: limitSnapshot.remaining,
            islandLimitExhausted: limitSnapshot.exhausted
        };

        if (limitSnapshot.exhausted && respawnPolicy.mode === 'hardLimited') {
            nextState.nodeState = 'depleted';
            nextState.nodeStateLabel = getResourceNodeStateLabel('depleted');
            nextState.nodeStateReason = 'islandLimit';
            nextState.regenerationReadyAtAdvance = null;
        }

        persistResourceNodeStateEntry(interaction.id, resolvedState);
        interaction.nodeState = nextState.nodeState;
        interaction.nodeStateReason = nextState.nodeStateReason;
        interaction.nodeStateLabel = nextState.nodeStateLabel;
        interaction.durabilityRemaining = nextState.durabilityRemaining;
        interaction.durabilityMax = nextState.durabilityMax;
        interaction.regenerationTimeAdvances = nextState.regenerationTimeAdvances;
        interaction.regenerationReadyAtAdvance = nextState.regenerationReadyAtAdvance;
        interaction.respawnPolicyMode = nextState.respawnPolicyMode;
        interaction.respawnPolicyLabel = nextState.respawnPolicyLabel;
        interaction.islandLimitConsumed = nextState.islandLimitConsumed;
        interaction.islandLimitMax = nextState.islandLimitMax;
        interaction.islandLimitRemaining = nextState.islandLimitRemaining;
        interaction.islandLimitExhausted = nextState.islandLimitExhausted;
        return interaction;
    }

    function consumeResourceNodeInteraction(interaction) {
        if (!isResourceNodeInteraction(interaction)) {
            return null;
        }

        const definition = getResourceNodeDefinition(interaction.resourceNodeKind);
        const respawnPolicy = getResourceNodeRespawnPolicy(definition);
        const currentState = resolveResourceNodeStateEntry(
            getResourceNodeStateStore()[interaction.id],
            definition
        );
        const limitSnapshot = getResourceNodeIslandLimitSnapshot(interaction, definition, respawnPolicy);

        if (
            currentState.nodeState === 'depleted'
            || currentState.nodeState === 'regenerating'
            || (respawnPolicy.mode === 'hardLimited' && limitSnapshot.exhausted)
        ) {
            syncResourceNodeInteractionState(interaction, definition);
            return cloneValue({
                ...currentState,
                respawnPolicyMode: respawnPolicy.mode,
                respawnPolicyLabel: getResourceNodeRespawnPolicyLabel(respawnPolicy),
                islandLimitConsumed: limitSnapshot.consumed,
                islandLimitMax: limitSnapshot.islandLimit,
                islandLimitRemaining: limitSnapshot.remaining,
                islandLimitExhausted: limitSnapshot.exhausted,
                nodeStateReason: limitSnapshot.exhausted ? 'islandLimit' : currentState.nodeStateReason
            });
        }

        const nextRemaining = Math.max(0, currentState.durabilityRemaining - 1);
        const nextState = {
            ...currentState,
            durabilityRemaining: nextRemaining,
            nodeState: 'fresh',
            regenerationReadyAtAdvance: null
        };

        if (nextRemaining <= 0) {
            if (currentState.regenerationTimeAdvances > 0) {
                nextState.nodeState = 'regenerating';
                nextState.regenerationReadyAtAdvance = getCurrentTimeOfDayAdvancesElapsed() + currentState.regenerationTimeAdvances;
            } else {
                nextState.nodeState = 'depleted';
            }
        } else if (nextRemaining < currentState.durabilityMax) {
            nextState.nodeState = 'used';
        }

        const nextLimitSnapshot = respawnPolicy.mode === 'hardLimited'
            ? consumeResourceNodeIslandLimit(interaction, definition, respawnPolicy, 1)
            : limitSnapshot;

        if (respawnPolicy.mode === 'hardLimited' && nextLimitSnapshot.exhausted) {
            nextState.nodeState = 'depleted';
            nextState.nodeStateReason = 'islandLimit';
            nextState.regenerationReadyAtAdvance = null;
        }

        nextState.nodeStateLabel = getResourceNodeStateLabel(nextState.nodeState);
        persistResourceNodeStateEntry(interaction.id, nextState);
        Object.assign(interaction, nextState, {
            respawnPolicyMode: respawnPolicy.mode,
            respawnPolicyLabel: getResourceNodeRespawnPolicyLabel(respawnPolicy),
            islandLimitConsumed: nextLimitSnapshot.consumed,
            islandLimitMax: nextLimitSnapshot.islandLimit,
            islandLimitRemaining: nextLimitSnapshot.remaining,
            islandLimitExhausted: nextLimitSnapshot.exhausted
        });
        return cloneValue({
            ...nextState,
            respawnPolicyMode: respawnPolicy.mode,
            respawnPolicyLabel: getResourceNodeRespawnPolicyLabel(respawnPolicy),
            islandLimitConsumed: nextLimitSnapshot.consumed,
            islandLimitMax: nextLimitSnapshot.islandLimit,
            islandLimitRemaining: nextLimitSnapshot.remaining,
            islandLimitExhausted: nextLimitSnapshot.exhausted
        });
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

    function isResourceNodeInteraction(interaction) {
        return Boolean(interaction && interaction.kind === 'resourceNode');
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

    function normalizeDescriptorValue(value) {
        return typeof value === 'string'
            ? value.trim().toLowerCase()
            : '';
    }

    function shouldSpawnWorkbenchInteraction(house) {
        const expedition = house && house.expedition ? house.expedition : null;
        const kind = normalizeDescriptorValue(expedition && expedition.kind);
        const buildingType = normalizeDescriptorValue(expedition && expedition.buildingType);

        return kind === 'artisan'
            || buildingType === 'workshop'
            || buildingType === 'bridgehouse';
    }

    function shouldSpawnCampInteraction(house) {
        const expedition = house && house.expedition ? house.expedition : null;
        return normalizeDescriptorValue(expedition && expedition.kind) === 'shelter';
    }

    function buildCampInteractionExpedition(house) {
        const expedition = house && house.expedition ? house.expedition : {};
        const ownerLabel = expedition.label || expedition.locationLabel || '';
        const ownerSuffix = ownerLabel ? ` Рядом: ${ownerLabel}.` : '';

        return {
            kind: 'camp',
            family: 'station',
            label: 'Лагерный очаг',
            locationLabel: 'Лагерь',
            summary: `Явная лагерная станция для воды, пищи и походных рецептов.${ownerSuffix}`,
            stationId: 'camp',
            stationIds: ['camp'],
            stationSourceHouseId: house && house.id ? house.id : null
        };
    }

    function buildWorkbenchInteractionExpedition(house) {
        const expedition = house && house.expedition ? house.expedition : {};
        const buildingType = normalizeDescriptorValue(expedition.buildingType);
        const primaryStationId = buildingType === 'workshop' || buildingType === 'bridgehouse'
            ? 'workbench'
            : 'bench';
        const stationIds = primaryStationId === 'workbench'
            ? ['bench', 'workbench']
            : ['bench'];
        const label = primaryStationId === 'workbench' ? 'Мастерская' : 'Верстак';
        const ownerLabel = expedition.label || expedition.locationLabel || '';
        const ownerSuffix = ownerLabel ? ` Рядом: ${ownerLabel}.` : '';

        return {
            kind: 'workbench',
            family: 'station',
            label,
            locationLabel: label,
            summary: primaryStationId === 'workbench'
                ? `Явная ремесленная станция для строительства, ремонта и тяжёлой утилиты.${ownerSuffix}`
                : `Явный полевой верстак для верёвок, мостов и простых сборок.${ownerSuffix}`,
            stationId: primaryStationId,
            stationIds,
            buildingType: primaryStationId === 'workbench' ? 'workshop' : 'bench',
            stationSourceHouseId: house && house.id ? house.id : null
        };
    }

    function appendWorkbenchInteractionForHouse(result, chunkX, chunkY, chunkData, house, houseCellSet, occupiedKeys, random) {
        if (!shouldSpawnWorkbenchInteraction(house)) {
            return;
        }

        const candidates = collectDoorCandidates(house, chunkData, houseCellSet, occupiedKeys, random)
            .concat(collectPerimeterCandidates(house, chunkData, houseCellSet, occupiedKeys, random))
            .sort((left, right) => right.score - left.score);
        const picked = candidates[0];

        if (!picked) {
            return;
        }

        const interactionId = `station:${house.id}:${picked.x}:${picked.y}`;
        occupiedKeys.add(tileKey(picked.x, picked.y));
        result.push(createStandaloneInteractionRecord(
            chunkX,
            chunkY,
            picked.x,
            picked.y,
            buildWorkbenchInteractionExpedition(house),
            {
                id: interactionId,
                houseId: interactionId,
                placement: 'exterior',
                renderDepthOffset: 0.38
            }
        ));
    }

    function appendCampInteractionForHouse(result, chunkX, chunkY, chunkData, house, houseCellSet, occupiedKeys, random) {
        if (!shouldSpawnCampInteraction(house)) {
            return;
        }

        const candidates = collectDoorCandidates(house, chunkData, houseCellSet, occupiedKeys, random)
            .concat(collectPerimeterCandidates(house, chunkData, houseCellSet, occupiedKeys, random))
            .sort((left, right) => right.score - left.score);
        const picked = candidates[0];

        if (!picked) {
            return;
        }

        const interactionId = `camp:${house.id}:${picked.x}:${picked.y}`;
        occupiedKeys.add(tileKey(picked.x, picked.y));
        result.push(createStandaloneInteractionRecord(
            chunkX,
            chunkY,
            picked.x,
            picked.y,
            buildCampInteractionExpedition(house),
            {
                id: interactionId,
                houseId: interactionId,
                placement: 'exterior',
                renderDepthOffset: 0.37
            }
        ));
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

    function getResourceNodeDefinitions() {
        const resourceRegistry = getResourceRegistry();
        return resourceRegistry && typeof resourceRegistry.getResourceNodeDefinitions === 'function'
            ? resourceRegistry.getResourceNodeDefinitions()
            : [];
    }

    function getResourceNodePlacementProfile(definition) {
        return definition && definition.placementProfile && typeof definition.placementProfile === 'object'
            ? definition.placementProfile
            : null;
    }

    function getResourceNodeClusterProfile(definition) {
        const placementProfile = getResourceNodePlacementProfile(definition);
        const clusterProfile = placementProfile && placementProfile.clusterProfile && typeof placementProfile.clusterProfile === 'object'
            ? placementProfile.clusterProfile
            : null;

        if (!clusterProfile) {
            return null;
        }

        const minCount = Number.isFinite(clusterProfile.minCount)
            ? Math.max(2, Math.floor(clusterProfile.minCount))
            : 2;
        const maxCount = Number.isFinite(clusterProfile.maxCount)
            ? Math.max(minCount, Math.floor(clusterProfile.maxCount))
            : minCount;
        const radius = Number.isFinite(clusterProfile.radius)
            ? Math.max(1, Math.floor(clusterProfile.radius))
            : 1;

        return {
            minCount,
            maxCount,
            radius,
            includeDiagonals: clusterProfile.includeDiagonals !== false
        };
    }

    function getGridDistance(fromX, fromY, toX, toY, includeDiagonals = false) {
        const deltaX = Math.abs(fromX - toX);
        const deltaY = Math.abs(fromY - toY);

        return includeDiagonals
            ? Math.max(deltaX, deltaY)
            : (deltaX + deltaY);
    }

    function countNearbyPlacedResourceNodes(placedResourceNodes, x, y, requirement = {}) {
        const resourceNodes = Array.isArray(placedResourceNodes) ? placedResourceNodes : [];
        const matchKinds = Array.isArray(requirement.matchResourceNodeKinds)
            ? requirement.matchResourceNodeKinds
            : [];
        const matchFamilies = Array.isArray(requirement.matchFamilies)
            ? requirement.matchFamilies
            : [];
        const matchResourceIds = Array.isArray(requirement.matchResourceIds)
            ? requirement.matchResourceIds
            : [];
        const includeDiagonals = requirement.includeDiagonals !== false;
        const maxDistance = Number.isFinite(requirement.maxDistance)
            ? Math.max(1, Math.floor(requirement.maxDistance))
            : 1;

        return resourceNodes.reduce((count, resourceNode) => {
            if (!resourceNode) {
                return count;
            }

            if (matchKinds.length > 0 && !matchKinds.includes(resourceNode.resourceNodeKind)) {
                return count;
            }

            if (matchFamilies.length > 0 && !matchFamilies.includes(resourceNode.family)) {
                return count;
            }

            if (matchResourceIds.length > 0 && !matchResourceIds.includes(resourceNode.resourceId)) {
                return count;
            }

            const distance = getGridDistance(x, y, resourceNode.x, resourceNode.y, includeDiagonals);
            return distance <= maxDistance ? count + 1 : count;
        }, 0);
    }

    function isResourceNodeCandidateSupportedByPlacedNodes(definition, x, y, placedResourceNodes) {
        const placementProfile = getResourceNodePlacementProfile(definition);
        const nearbyNodeRequirements = placementProfile && Array.isArray(placementProfile.nearbyNodeRequirements)
            ? placementProfile.nearbyNodeRequirements
            : [];

        for (const requirement of nearbyNodeRequirements) {
            const minCount = Number.isFinite(requirement && requirement.minCount)
                ? Math.max(0, Math.floor(requirement.minCount))
                : 0;

            if (minCount <= 0) {
                continue;
            }

            if (countNearbyPlacedResourceNodes(placedResourceNodes, x, y, requirement) < minCount) {
                return false;
            }
        }

        return true;
    }

    function getTravelZoneKeyAt(travelZones, x, y) {
        return Array.isArray(travelZones) && Array.isArray(travelZones[y])
            ? travelZones[y][x] || 'none'
            : 'none';
    }

    function getTravelBandForSpawnTile(tileType, travelZoneKey) {
        const content = game.systems.content || null;
        const tileBand = content && typeof content.getTileRouteBand === 'function'
            ? content.getTileRouteBand(tileType)
            : 'normal';

        if (!content || typeof content.getTravelZoneDefinition !== 'function' || !travelZoneKey || travelZoneKey === 'none') {
            return tileBand || 'normal';
        }

        const zoneDefinition = content.getTravelZoneDefinition(travelZoneKey);
        return zoneDefinition && zoneDefinition.routeBand
            ? zoneDefinition.routeBand
            : (tileBand || 'normal');
    }

    function countPlacementRequirementMatches(chunkData, travelZones, x, y, requirement = {}) {
        const matchTileTypes = Array.isArray(requirement.matchTileTypes)
            ? requirement.matchTileTypes
            : [];
        const matchTravelZoneKeys = Array.isArray(requirement.matchTravelZoneKeys)
            ? requirement.matchTravelZoneKeys
            : [];
        const matchTravelBands = Array.isArray(requirement.matchTravelBands)
            ? requirement.matchTravelBands
            : [];

        return countNeighborTiles(
            chunkData,
            x,
            y,
            (candidateTileType, candidateX, candidateY) => {
                const candidateTravelZoneKey = getTravelZoneKeyAt(travelZones, candidateX, candidateY);
                const candidateTravelBand = getTravelBandForSpawnTile(candidateTileType, candidateTravelZoneKey);

                if (matchTileTypes.length > 0 && matchTileTypes.includes(candidateTileType)) {
                    return true;
                }

                if (matchTravelZoneKeys.length > 0 && matchTravelZoneKeys.includes(candidateTravelZoneKey)) {
                    return true;
                }

                if (matchTravelBands.length > 0 && matchTravelBands.includes(candidateTravelBand)) {
                    return true;
                }

                return false;
            },
            requirement.includeDiagonals !== false
        );
    }

    function isResourceNodeTileAllowed(definition, tileType, travelZoneKey = 'none', travelBand = 'normal', chunkData = null, travelZones = null, x = 0, y = 0, chunkRecord = null) {
        if (!definition) {
            return false;
        }

        const sourceTileTypes = Array.isArray(definition.sourceTileTypes)
            ? definition.sourceTileTypes
            : [];
        const sourceTileMatch = sourceTileTypes.length === 0 || sourceTileTypes.includes(tileType);
        const placementProfile = getResourceNodePlacementProfile(definition);

        if (!placementProfile) {
            return sourceTileMatch;
        }

        const allowedTravelZoneKeys = Array.isArray(placementProfile.allowedTravelZoneKeys)
            ? placementProfile.allowedTravelZoneKeys
            : [];
        const travelZoneMatch = allowedTravelZoneKeys.includes(travelZoneKey);
        const allowTravelZoneFallback = Boolean(placementProfile.allowTravelZoneFallback && travelZoneMatch);

        if (!sourceTileMatch && !allowTravelZoneFallback) {
            return false;
        }

        const allowedTravelBands = Array.isArray(placementProfile.allowedTravelBands)
            ? placementProfile.allowedTravelBands
            : [];
        if (allowedTravelBands.length > 0 && !allowedTravelBands.includes(travelBand)) {
            return false;
        }

        const requiredChunkTags = Array.isArray(placementProfile.requiredChunkTags)
            ? placementProfile.requiredChunkTags
            : [];
        if (requiredChunkTags.length > 0) {
            const chunkTags = chunkRecord && chunkRecord.tags instanceof Set ? chunkRecord.tags : new Set();
            if (!requiredChunkTags.every((tag) => chunkTags.has(tag))) {
                return false;
            }
        }

        const neighborRequirements = Array.isArray(placementProfile.neighborRequirements)
            ? placementProfile.neighborRequirements
            : [];
        for (const requirement of neighborRequirements) {
            const minCount = Number.isFinite(requirement && requirement.minCount)
                ? Math.max(0, Math.floor(requirement.minCount))
                : 0;

            if (minCount <= 0) {
                continue;
            }

            if (countPlacementRequirementMatches(chunkData, travelZones, x, y, requirement) < minCount) {
                return false;
            }
        }

        return true;
    }

    function isIslandWithinWindow(definition, progression) {
        if (!progression || !Number.isFinite(progression.islandIndex)) {
            return true;
        }

        const window = definition && definition.requiredIslands ? definition.requiredIslands : null;
        if (!window) {
            return true;
        }

        const fromIsland = Number.isFinite(window.from) ? window.from : 1;
        const toIsland = Number.isFinite(window.to) ? window.to : Infinity;
        return progression.islandIndex >= fromIsland && progression.islandIndex <= toIsland;
    }

    function getResourceNodeSpawnLimit(definition, progression, chunkData, random = Math.random) {
        if (!definition || !isIslandWithinWindow(definition, progression)) {
            return 0;
        }

        const islandIndex = progression && Number.isFinite(progression.islandIndex)
            ? progression.islandIndex
            : 1;
        const hasTileType = (matchers) => Array.isArray(chunkData)
            && chunkData.some((row) => Array.isArray(row) && row.some((tileType) => matchers.includes(tileType)));
        const hasWaterTiles = hasTileType(['water', 'shore', 'reeds']);
        const hasDeepWaterTiles = hasTileType(['water']);
        const hasShoreTiles = hasTileType(['shore']);
        const hasReedsTiles = hasTileType(['reeds']);

        switch (definition.id) {
            case 'grassBush':
                return islandIndex <= 6 ? 3 : 2;
            case 'reedPatch':
                return hasWaterTiles ? 2 : 0;
            case 'stonePile':
                return islandIndex <= 15 ? 2 : 1;
            case 'rubbleScree':
                return islandIndex >= 7 && islandIndex <= 24 ? 2 : 1;
            case 'woodTree':
                return islandIndex >= 2 ? 2 : 0;
            case 'waterSource':
                return hasWaterTiles ? 2 : 0;
            case 'fishingSpot':
                return islandIndex >= 6 && islandIndex <= 30 && hasShoreTiles ? 1 : 0;
            case 'fishingReedsSpot':
                return islandIndex >= 6 && islandIndex <= 30 && hasReedsTiles ? 1 : 0;
            case 'fishingCalmSpot':
                return islandIndex >= 6 && islandIndex <= 30 && hasDeepWaterTiles ? 1 : 0;
            case 'fishingRareSpot':
                return islandIndex >= 10 && islandIndex <= 30 && hasDeepWaterTiles && random() <= 0.2 ? 1 : 0;
            default:
                return 0;
        }
    }

    function scoreResourceNodeCandidate(definition, chunkData, travelZones, x, y, houses, random, placedResourceNodes = []) {
        const tileType = chunkData[y][x];
        const travelZoneKey = getTravelZoneKeyAt(travelZones, x, y);
        const travelBand = getTravelBandForSpawnTile(tileType, travelZoneKey);
        const nearestHouseDistance = getNearestHouseDistance(x, y, houses);
        const safeNearestHouseDistance = Number.isFinite(nearestHouseDistance) ? nearestHouseDistance : 6;
        const edgeDistance = Math.min(x, y, game.config.chunkSize - 1 - x, game.config.chunkSize - 1 - y);
        const trailNeighbors = countNeighborTiles(chunkData, x, y, (candidate) => candidate === 'trail' || candidate === 'bridge', true);
        const waterNeighbors = countNeighborTiles(chunkData, x, y, (candidate) => candidate === 'water', true);
        const rockNeighbors = countNeighborTiles(chunkData, x, y, (candidate) => candidate === 'rock', true);
        const grassNeighbors = countNeighborTiles(chunkData, x, y, (candidate) => candidate === 'grass', true);
        const reedsNeighbors = countNeighborTiles(chunkData, x, y, (candidate) => candidate === 'reeds', true);
        const rubbleNeighbors = countNeighborTiles(chunkData, x, y, (candidate) => candidate === 'rubble', true);
        let score = random() * 0.2 + Math.min(edgeDistance, 4) * 0.08;

        if (Array.isArray(definition.preferredTileTypes) && definition.preferredTileTypes.includes(tileType)) {
            score += 1.6;
        }

        switch (definition.id) {
            case 'grassBush':
                score += tileType === 'grass' ? 2.6 : 1.8;
                score += Math.max(0, safeNearestHouseDistance - 1) * 0.55;
                score += trailNeighbors * 0.35 + waterNeighbors * 0.2;
                score += (grassNeighbors + reedsNeighbors) * 0.18;
                break;
            case 'reedPatch':
                score += tileType === 'reeds' ? 3 : 1.6;
                score += reedsNeighbors * 0.7 + waterNeighbors * 0.55 + trailNeighbors * 0.22;
                score += Math.max(0, safeNearestHouseDistance - 1) * 0.32;
                break;
            case 'stonePile':
                score += tileType === 'rock' ? 3.4 : 0;
                score += rockNeighbors * 0.5 + trailNeighbors * 0.4;
                score += Math.max(0, safeNearestHouseDistance - 1) * 0.2;
                break;
            case 'rubbleScree':
                score += tileType === 'rubble' ? 3 : 0;
                score += travelZoneKey === 'badSector' ? 2.4 : 0;
                score += rubbleNeighbors * 0.4;
                score += trailNeighbors * 0.55 + rockNeighbors * 0.2;
                score += Math.max(0, safeNearestHouseDistance - 1) * 0.18;
                break;
            case 'woodTree':
                score += countNearbyPlacedResourceNodes(
                    placedResourceNodes,
                    x,
                    y,
                    {
                        matchResourceNodeKinds: ['grassBush', 'reedPatch'],
                        minCount: 0,
                        maxDistance: 2,
                        includeDiagonals: true
                    }
                ) * 1.1;
                score += tileType === 'grass' ? 2.1 : (tileType === 'shore' ? 1.8 : 1.5);
                score += travelBand === 'normal' ? 1.2 : (travelBand === 'rough' ? 0.7 : -2.8);
                score += waterNeighbors * 0.45;
                score += Math.max(0, safeNearestHouseDistance - 1) * 0.42;
                score -= trailNeighbors * 0.08;
                break;
            case 'waterSource':
                score += tileType === 'water' ? 2.6 : 2.1;
                score += reedsNeighbors * 0.35;
                score += waterNeighbors * 1.25 + trailNeighbors * 0.25;
                break;
            case 'fishingSpot':
                score += tileType === 'shore' ? 3.1 : 0;
                score += waterNeighbors * 0.55 + reedsNeighbors * 0.3 + trailNeighbors * 0.24;
                break;
            case 'fishingReedsSpot':
                score += tileType === 'reeds' ? 3.2 : 0;
                score += reedsNeighbors * 0.88 + waterNeighbors * 0.7 + trailNeighbors * 0.1;
                break;
            case 'fishingCalmSpot':
                score += tileType === 'water' ? 3.15 : 0;
                score += waterNeighbors * 1.55;
                score -= trailNeighbors * 0.16;
                break;
            case 'fishingRareSpot':
                score += tileType === 'water' ? 3 : 0;
                score += waterNeighbors * 1.9;
                score -= reedsNeighbors * 0.12;
                score -= trailNeighbors * 0.3;
                break;
            default:
                score += safeNearestHouseDistance * 0.15;
                break;
        }

        return score;
    }

    function collectResourceNodeCandidates(chunkData, travelZones, houseCellSet, occupiedKeys, houses, random, definition, chunkRecord = null, placedResourceNodes = []) {
        const candidates = [];
        const chunkSize = game.config.chunkSize;

        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                const key = tileKey(x, y);
                const tileType = chunkData[y][x];
                const travelZoneKey = getTravelZoneKeyAt(travelZones, x, y);
                const travelBand = getTravelBandForSpawnTile(tileType, travelZoneKey);

                if (
                    houseCellSet.has(key)
                    || occupiedKeys.has(key)
                    || !isResourceNodeTileAllowed(definition, tileType, travelZoneKey, travelBand, chunkData, travelZones, x, y, chunkRecord)
                    || !isResourceNodeCandidateSupportedByPlacedNodes(definition, x, y, placedResourceNodes)
                ) {
                    continue;
                }

                const score = scoreResourceNodeCandidate(definition, chunkData, travelZones, x, y, houses, random, placedResourceNodes);
                if (score <= 0.4) {
                    continue;
                }

                candidates.push({ x, y, score, key });
            }
        }

        return candidates.sort((left, right) => right.score - left.score);
    }

    function pickClusteredResourceNodeCandidates(candidates, spawnLimit, clusterProfile) {
        if (!Array.isArray(candidates) || candidates.length === 0 || !clusterProfile) {
            return [];
        }

        const maxCount = Math.min(
            Math.max(0, Math.floor(spawnLimit) || 0),
            clusterProfile.maxCount
        );
        if (maxCount < clusterProfile.minCount) {
            return [];
        }

        for (const seed of candidates) {
            const picked = [seed];
            const usedKeys = new Set([seed.key]);

            while (picked.length < maxCount) {
                const nextCandidate = candidates.find((candidate) => {
                    if (!candidate || usedKeys.has(candidate.key)) {
                        return false;
                    }

                    return picked.some((entry) => getGridDistance(
                        entry.x,
                        entry.y,
                        candidate.x,
                        candidate.y,
                        clusterProfile.includeDiagonals
                    ) <= clusterProfile.radius);
                });

                if (!nextCandidate) {
                    break;
                }

                picked.push(nextCandidate);
                usedKeys.add(nextCandidate.key);
            }

            if (picked.length >= clusterProfile.minCount) {
                return picked;
            }
        }

        return [];
    }

    function pickResourceNodeCandidates(definition, candidates, spawnLimit) {
        const clusterProfile = getResourceNodeClusterProfile(definition);

        if (clusterProfile) {
            return pickClusteredResourceNodeCandidates(candidates, spawnLimit, clusterProfile);
        }

        const picked = [];

        candidates.forEach((candidate) => {
            if (picked.length >= spawnLimit) {
                return;
            }

            const isTooClose = picked.some((entry) => Math.abs(entry.x - candidate.x) + Math.abs(entry.y - candidate.y) < 2);
            if (isTooClose) {
                return;
            }

            picked.push(candidate);
        });

        return picked;
    }

    function createResourceNodeInteractionRecord(chunkX, chunkY, localX, localY, definition, progression = null) {
        const interactionId = `resource-node:${definition.id}:${chunkX}:${chunkY}:${localX}:${localY}`;
        const islandIndex = progression && Number.isFinite(progression.islandIndex)
            ? Math.max(1, Math.floor(progression.islandIndex))
            : (Number.isFinite(game.state.currentIslandIndex) ? Math.max(1, Math.floor(game.state.currentIslandIndex)) : 1);
        const expedition = {
            kind: 'resourceNode',
            label: definition.label,
            summary: definition.summary || '',
            resourceId: definition.resourceId,
            resourceNodeKind: definition.id,
            family: definition.family || 'resourceNode',
            islandIndex
        };
        const interaction = createStandaloneInteractionRecord(
            chunkX,
            chunkY,
            localX,
            localY,
            expedition,
            {
                id: interactionId,
                houseId: interactionId,
                kind: 'resourceNode',
                label: definition.label,
                placement: 'exterior',
                renderDepthOffset: 0.29
            }
        );

        interaction.family = 'resourceNode';
        interaction.resourceId = definition.resourceId;
        interaction.resourceNodeKind = definition.id;
        interaction.resourceNodeFamily = definition.family || 'resourceNode';
        interaction.renderKind = definition.renderKind || definition.id;
        interaction.summary = definition.summary || '';
        interaction.islandIndex = islandIndex;
        interaction.gatherProfile = definition.gatherProfile ? cloneValue(definition.gatherProfile) : null;
        interaction.interactionHint = definition.interactionHint || '';
        interaction.durabilityProfile = definition.durabilityProfile ? cloneValue(definition.durabilityProfile) : null;
        interaction.respawnPolicy = definition.respawnPolicy ? cloneValue(definition.respawnPolicy) : null;

        return syncResourceNodeInteractionState(interaction, definition);
    }

    function appendResourceNodeInteractions(result, chunkX, chunkY, chunkData, houses, occupiedKeys, random, options = {}) {
        const progression = options.progression || null;
        const chunkRecord = options.chunkRecord || null;
        const travelZones = Array.isArray(options.travelZones) ? options.travelZones : null;
        const houseCellSet = getHouseCellSet(houses);
        const placedResourceNodes = [];

        getResourceNodeDefinitions().forEach((definition) => {
            const spawnLimit = getResourceNodeSpawnLimit(definition, progression, chunkData, random);
            const candidates = spawnLimit > 0
                ? collectResourceNodeCandidates(chunkData, travelZones, houseCellSet, occupiedKeys, houses, random, definition, chunkRecord, placedResourceNodes)
                : [];
            const picked = pickResourceNodeCandidates(definition, candidates, spawnLimit);

            picked.forEach((candidate) => {
                occupiedKeys.add(tileKey(candidate.x, candidate.y));
                result.push(createResourceNodeInteractionRecord(chunkX, chunkY, candidate.x, candidate.y, definition, progression));
                placedResourceNodes.push({
                    x: candidate.x,
                    y: candidate.y,
                    resourceNodeKind: definition.id,
                    family: definition.family || 'resourceNode',
                    resourceId: definition.resourceId
                });
            });
        });
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
                appendCampInteractionForHouse(result, chunkX, chunkY, chunkData, house, houseCellSet, occupiedKeys, random);
                appendWorkbenchInteractionForHouse(result, chunkX, chunkY, chunkData, house, houseCellSet, occupiedKeys, random);
            });

        appendSpecialInteractionPlans(result, chunkX, chunkY, chunkData, houses, occupiedKeys, random, options);
        appendTrailCacheInteractions(result, chunkX, chunkY, chunkData, houses, occupiedKeys, random, options);
        appendResourceNodeInteractions(result, chunkX, chunkY, chunkData, houses, occupiedKeys, random, options);
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

            if (game.state.selectedWorldInteractionId === targetId) {
                game.state.selectedWorldInteractionId = null;
            }

            return true;
        }

        return false;
    }

    Object.assign(interactionShared, {
        tileKey,
        isGroundItemInteraction,
        isResourceNodeInteraction,
        buildInteractionTileMap,
        syncResourceNodeInteractionState
    });

    Object.assign(worldSpawnRuntime, {
        createChunkInteractions,
        buildInteractionTileMap,
        addGroundItemDrop,
        replaceGroundItemAtWorld,
        removeInteraction,
        isResourceNodeInteraction,
        syncResourceNodeInteractionState,
        consumeResourceNodeInteraction,
        getResourceNodeStateLabel
    });

    const interactions = game.systems.interactions = game.systems.interactions || {};
    Object.assign(interactions, {
        spawns: worldSpawnRuntime,
        createChunkInteractions,
        buildInteractionTileMap,
        addGroundItemDrop,
        replaceGroundItemAtWorld,
        removeInteraction,
        isResourceNodeInteraction,
        syncResourceNodeInteractionState,
        consumeResourceNodeInteraction,
        getResourceNodeStateLabel
    });
})();
