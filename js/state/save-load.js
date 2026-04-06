(() => {
    const saveLoad = window.Game.systems.saveLoad = window.Game.systems.saveLoad || {};
    const stateSchema = window.Game.systems.stateSchema;
    const STORAGE_KEY = 'iso_game_save';
    const SAVE_SLOT_PREFIX = 'iso_game_save_slot_';
    const SAVE_SLOT_RECORD_VERSION = 1;
    const SAVE_SLOT_COUNT = 6;
    const DOMAIN_SAVE_VERSION = 1;
    const CRAFTING_STATE_SAVE_VERSION = 2;
    const RAW_RESOURCE_LAYER_SAVE_VERSION = 3;
    const RESOURCE_NODE_RESPAWN_POLICY_SAVE_VERSION = 4;
    const WATER_FLASK_CONTAINER_SAVE_VERSION = 5;
    const REEDS_RESOURCE_SPLIT_SAVE_VERSION = 6;
    const LEGACY_RAW_RESOURCE_ITEM_MIGRATIONS = Object.freeze({
        lowlandGrass: {
            itemId: 'raw_reeds',
            label: 'Тростник',
            icon: 'RT',
            quantityMultiplier: 1,
            resourceFamilyId: 'reeds'
        },
        fieldGrass: {
            itemId: 'raw_grass',
            label: 'Трава',
            icon: 'TR',
            quantityMultiplier: 1,
            resourceFamilyId: 'grass',
            resourceSubtypeId: 'fieldGrass',
            resourceSubtypeLabel: 'Полевая трава'
        },
        grassResource: { itemId: 'raw_grass', label: 'Трава', icon: 'TR', quantityMultiplier: 5, resourceFamilyId: 'grass' },
        rubbleChunk: { itemId: 'raw_rubble', label: 'Щебень', icon: 'OS', quantityMultiplier: 1, resourceFamilyId: 'rubble' },
        stoneResource: { itemId: 'raw_stone', label: 'Камень', icon: 'KS', quantityMultiplier: 5, resourceFamilyId: 'stone' },
        waterFlask: { itemId: 'flask_water_full', label: 'Фляга кипячёной воды', icon: 'FW', quantityMultiplier: 1, resourceFamilyId: 'water' }
    });
    const RAW_STACKABLE_ITEM_IDS = new Set([
        'raw_grass',
        'raw_reeds',
        'raw_stone',
        'raw_rubble',
        'raw_wood',
        'raw_fish',
        'flask_empty',
        'flask_water_dirty',
        'flask_water_full',
        'flask_water_alchemy'
    ]);

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function cloneValue(value) {
        return stateSchema.cloneValue(value);
    }

    function migrateLegacyResourceItem(item) {
        if (!isPlainObject(item) || typeof item.id !== 'string') {
            return cloneValue(item);
        }

        const migration = LEGACY_RAW_RESOURCE_ITEM_MIGRATIONS[item.id];
        if (!migration) {
            return cloneValue(item);
        }

        return {
            ...cloneValue(item),
            id: migration.itemId,
            icon: migration.icon,
            label: migration.label,
            quantity: Math.max(1, Number.isFinite(item.quantity) ? item.quantity : 1) * migration.quantityMultiplier,
            resourceFamilyId: migration.resourceFamilyId || item.resourceFamilyId || '',
            resourceSubtypeId: migration.resourceSubtypeId || item.resourceSubtypeId || '',
            resourceSubtypeLabel: migration.resourceSubtypeLabel || item.resourceSubtypeLabel || ''
        };
    }

    function clearRawSubtypeMetadata(item) {
        if (!item || typeof item !== 'object') {
            return;
        }

        delete item.resourceSubtypeId;
        delete item.resourceSubtypeLabel;
    }

    function mergeRawFamilyMetadata(targetItem, sourceItem) {
        if (!targetItem || !sourceItem) {
            return;
        }

        const familyId = targetItem.resourceFamilyId || sourceItem.resourceFamilyId || '';
        if (familyId) {
            targetItem.resourceFamilyId = familyId;
        }

        const targetSubtypeId = typeof targetItem.resourceSubtypeId === 'string' ? targetItem.resourceSubtypeId : '';
        const sourceSubtypeId = typeof sourceItem.resourceSubtypeId === 'string' ? sourceItem.resourceSubtypeId : '';

        if (!targetSubtypeId && sourceSubtypeId) {
            targetItem.resourceSubtypeId = sourceSubtypeId;
            targetItem.resourceSubtypeLabel = sourceItem.resourceSubtypeLabel || '';
            return;
        }

        if (targetSubtypeId && !sourceSubtypeId) {
            clearRawSubtypeMetadata(targetItem);
            return;
        }

        if (targetSubtypeId && sourceSubtypeId && targetSubtypeId !== sourceSubtypeId) {
            clearRawSubtypeMetadata(targetItem);
            return;
        }

        if (targetSubtypeId && sourceSubtypeId === targetSubtypeId && !targetItem.resourceSubtypeLabel && sourceItem.resourceSubtypeLabel) {
            targetItem.resourceSubtypeLabel = sourceItem.resourceSubtypeLabel;
        }
    }

    function migrateSplitReedResourceItem(item) {
        if (!isPlainObject(item) || typeof item.id !== 'string') {
            return cloneValue(item);
        }

        const migratedItem = cloneValue(item);
        const subtypeId = typeof migratedItem.resourceSubtypeId === 'string'
            ? migratedItem.resourceSubtypeId.trim()
            : '';

        if (migratedItem.id === 'raw_grass' && subtypeId === 'lowlandGrass') {
            migratedItem.id = 'raw_reeds';
            migratedItem.label = 'Тростник';
            migratedItem.icon = 'RT';
            migratedItem.resourceFamilyId = 'reeds';
            clearRawSubtypeMetadata(migratedItem);
        }

        return migratedItem;
    }

    function mergeMigratedStackableItems(items = []) {
        const migratedItems = (Array.isArray(items) ? items : []).map((item) => item ? migrateLegacyResourceItem(item) : item);
        const firstIndexById = Object.create(null);

        migratedItems.forEach((item, index) => {
            if (!item || !RAW_STACKABLE_ITEM_IDS.has(item.id)) {
                return;
            }

            if (!Number.isInteger(firstIndexById[item.id])) {
                firstIndexById[item.id] = index;
                return;
            }

            const targetItem = migratedItems[firstIndexById[item.id]];
            targetItem.quantity = Math.max(1, targetItem.quantity || 1) + Math.max(1, item.quantity || 1);
            mergeRawFamilyMetadata(targetItem, item);
            migratedItems[index] = null;
        });

        return migratedItems;
    }

    function migrateGroundItemList(items = []) {
        const mergedItems = [];
        const indexById = Object.create(null);

        (Array.isArray(items) ? items : []).forEach((item) => {
            const migratedItem = migrateLegacyResourceItem(item);

            if (!migratedItem || typeof migratedItem.id !== 'string') {
                return;
            }

            if (RAW_STACKABLE_ITEM_IDS.has(migratedItem.id) && Number.isInteger(indexById[migratedItem.id])) {
                mergedItems[indexById[migratedItem.id]].quantity += Math.max(1, migratedItem.quantity || 1);
                mergeRawFamilyMetadata(mergedItems[indexById[migratedItem.id]], migratedItem);
                return;
            }

            if (RAW_STACKABLE_ITEM_IDS.has(migratedItem.id)) {
                indexById[migratedItem.id] = mergedItems.length;
            }

            mergedItems.push(migratedItem);
        });

        return mergedItems;
    }

    function migrateGroundItemsByKey(groundItemsByKey = {}) {
        const migratedGroundItems = {};

        Object.entries(isPlainObject(groundItemsByKey) ? groundItemsByKey : {}).forEach(([worldKey, items]) => {
            migratedGroundItems[worldKey] = migrateGroundItemList(items);
        });

        return migratedGroundItems;
    }

    function extractLegacyCraftingState(snapshot = {}) {
        return {
            resources: snapshot.resources,
            containers: snapshot.containers,
            knownRecipes: snapshot.knownRecipes,
            stationUnlocks: snapshot.stationUnlocks,
            resourceNodesState: snapshot.resourceNodesState,
            resourceNodeIslandState: snapshot.resourceNodeIslandState
        };
    }

    function buildMigratedCraftingState(snapshot = {}) {
        const defaults = stateSchema.createDomainState().craftingState;
        const source = isPlainObject(snapshot.craftingState)
            ? snapshot.craftingState
            : extractLegacyCraftingState(snapshot);

        return {
            resources: isPlainObject(source.resources) ? cloneValue(source.resources) : cloneValue(defaults.resources),
            containers: isPlainObject(source.containers) ? cloneValue(source.containers) : cloneValue(defaults.containers),
            knownRecipes: isPlainObject(source.knownRecipes) ? cloneValue(source.knownRecipes) : cloneValue(defaults.knownRecipes),
            stationUnlocks: isPlainObject(source.stationUnlocks) ? cloneValue(source.stationUnlocks) : cloneValue(defaults.stationUnlocks),
            resourceNodesState: isPlainObject(source.resourceNodesState)
                ? cloneValue(source.resourceNodesState)
                : cloneValue(defaults.resourceNodesState),
            resourceNodeIslandState: isPlainObject(source.resourceNodeIslandState)
                ? cloneValue(source.resourceNodeIslandState)
                : cloneValue(defaults.resourceNodeIslandState)
        };
    }

    function buildSaveSnapshot(state = window.Game.state) {
        const domains = stateSchema.splitStateByDomain(state);
        const uiSystem = window.Game.systems.ui;

        return {
            saveVersion: stateSchema.SAVE_VERSION,
            player: cloneValue(domains.player),
            craftingState: cloneValue(domains.craftingState),
            world: cloneValue(domains.world),
            narrative: cloneValue(domains.narrative),
            ui: {
                ...cloneValue(domains.ui),
                isPaused: false,
                isMapOpen: false,
                lastActionMessage: uiSystem && typeof uiSystem.lastActionMessage === 'string'
                    ? uiSystem.lastActionMessage
                    : domains.ui.lastActionMessage,
                openMerchantHouseId: null
            }
        };
    }

    function normalizeSlotId(slotId) {
        const normalized = Number(slotId);

        if (!Number.isInteger(normalized) || normalized < 1 || normalized > SAVE_SLOT_COUNT) {
            return null;
        }

        return normalized;
    }

    function getSaveSlotStorageKey(slotId) {
        const normalizedSlotId = normalizeSlotId(slotId);
        return normalizedSlotId === null ? '' : `${SAVE_SLOT_PREFIX}${normalizedSlotId}`;
    }

    function countOccupiedInventorySlots(inventory = []) {
        return (Array.isArray(inventory) ? inventory : []).reduce((count, item) => (
            item ? count + 1 : count
        ), 0);
    }

    function buildSaveSlotMetadata(state = window.Game.state, slotId = 1, savedAt = new Date().toISOString()) {
        return {
            slotId,
            savedAt,
            islandIndex: Number.isFinite(state.currentIslandIndex) ? Math.max(1, Math.floor(state.currentIslandIndex)) : 1,
            highestIslandIndex: Number.isFinite(state.highestIslandIndex) ? Math.max(1, Math.floor(state.highestIslandIndex)) : 1,
            gold: Number.isFinite(state.gold) ? Math.max(0, Math.floor(state.gold)) : 0,
            currentTimeOfDayIndex: Number.isFinite(state.currentTimeOfDayIndex) ? Math.max(0, Math.floor(state.currentTimeOfDayIndex)) : 0,
            occupiedInventorySlots: countOccupiedInventorySlots(state.inventory),
            hasWon: Boolean(state.hasWon),
            isGameOver: Boolean(state.isGameOver)
        };
    }

    function buildSaveSlotRecord(slotId, state = window.Game.state) {
        const normalizedSlotId = normalizeSlotId(slotId);
        if (normalizedSlotId === null) {
            return null;
        }

        const savedAt = new Date().toISOString();

        return {
            format: 'iso-game-save-slot',
            version: SAVE_SLOT_RECORD_VERSION,
            slotId: normalizedSlotId,
            savedAt,
            worldSeed: Number.isFinite(window.Game && window.Game.config ? window.Game.config.worldSeed : null)
                ? window.Game.config.worldSeed
                : null,
            metadata: buildSaveSlotMetadata(state, normalizedSlotId, savedAt),
            snapshot: buildSaveSnapshot(state)
        };
    }

    function parseSaveSlotRecord(slotId, serializedValue) {
        const normalizedSlotId = normalizeSlotId(slotId);
        if (normalizedSlotId === null || typeof serializedValue !== 'string' || serializedValue.trim() === '') {
            return null;
        }

        try {
            const parsed = JSON.parse(serializedValue);
            if (!parsed || typeof parsed !== 'object') {
                return null;
            }

            if (parsed.format !== 'iso-game-save-slot' || !parsed.snapshot || typeof parsed.snapshot !== 'object') {
                return null;
            }

            const savedAt = typeof parsed.savedAt === 'string'
                ? parsed.savedAt
                : (parsed.metadata && typeof parsed.metadata.savedAt === 'string' ? parsed.metadata.savedAt : null);
            const metadata = isPlainObject(parsed.metadata)
                ? cloneValue(parsed.metadata)
                : buildSaveSlotMetadata(parsed.snapshot, normalizedSlotId, savedAt || new Date().toISOString());

            metadata.slotId = normalizedSlotId;
            if (savedAt && !metadata.savedAt) {
                metadata.savedAt = savedAt;
            }

            return {
                format: parsed.format,
                version: Number.isFinite(parsed.version) ? parsed.version : SAVE_SLOT_RECORD_VERSION,
                slotId: normalizedSlotId,
                savedAt: savedAt || metadata.savedAt || null,
                worldSeed: Number.isFinite(parsed.worldSeed) ? parsed.worldSeed : null,
                metadata,
                snapshot: cloneValue(parsed.snapshot)
            };
        } catch (error) {
            console.warn(`Save slot ${normalizedSlotId} parse failed:`, error);
            return null;
        }
    }

    function getSaveSlotRecord(slotId) {
        if (typeof localStorage === 'undefined') {
            return null;
        }

        const storageKey = getSaveSlotStorageKey(slotId);
        if (!storageKey) {
            return null;
        }

        try {
            return parseSaveSlotRecord(slotId, localStorage.getItem(storageKey));
        } catch (error) {
            console.warn(`Save slot ${slotId} read failed:`, error);
            return null;
        }
    }

    function listSaveSlots(slotCount = SAVE_SLOT_COUNT) {
        const limit = Number.isInteger(slotCount) && slotCount > 0
            ? Math.min(slotCount, SAVE_SLOT_COUNT)
            : SAVE_SLOT_COUNT;

        return Array.from({ length: limit }, (_, index) => {
            const slotId = index + 1;
            const record = getSaveSlotRecord(slotId);

            return {
                slotId,
                occupied: Boolean(record),
                savedAt: record ? record.savedAt : null,
                worldSeed: record ? record.worldSeed : null,
                metadata: record ? cloneValue(record.metadata) : null
            };
        });
    }

    function saveToSlot(slotId, state = window.Game.state) {
        if (typeof localStorage === 'undefined') {
            return null;
        }

        const record = buildSaveSlotRecord(slotId, state);
        if (!record) {
            return null;
        }

        try {
            localStorage.setItem(getSaveSlotStorageKey(record.slotId), JSON.stringify(record));
            return {
                slotId: record.slotId,
                savedAt: record.savedAt,
                worldSeed: record.worldSeed,
                metadata: cloneValue(record.metadata)
            };
        } catch (error) {
            console.warn(`Save slot ${record.slotId} write failed:`, error);
            return null;
        }
    }

    function loadFromSlot(slotId) {
        const record = getSaveSlotRecord(slotId);
        if (!record) {
            return null;
        }

        return {
            slotId: record.slotId,
            savedAt: record.savedAt,
            worldSeed: record.worldSeed,
            metadata: cloneValue(record.metadata),
            snapshot: cloneValue(record.snapshot)
        };
    }

    function migrateLegacyStateToVersion1(state) {
        const domains = stateSchema.splitStateByDomain(state);
        const legacyCraftingState = extractLegacyCraftingState(state);

        return {
            saveVersion: DOMAIN_SAVE_VERSION,
            player: domains.player,
            world: domains.world,
            narrative: domains.narrative,
            ui: domains.ui,
            resources: cloneValue(legacyCraftingState.resources),
            containers: cloneValue(legacyCraftingState.containers),
            knownRecipes: cloneValue(legacyCraftingState.knownRecipes),
            stationUnlocks: cloneValue(legacyCraftingState.stationUnlocks),
            resourceNodesState: cloneValue(legacyCraftingState.resourceNodesState)
        };
    }

    function migrateSnapshotToVersion2(snapshot) {
        return {
            saveVersion: CRAFTING_STATE_SAVE_VERSION,
            player: isPlainObject(snapshot.player) ? cloneValue(snapshot.player) : {},
            craftingState: buildMigratedCraftingState(snapshot),
            world: isPlainObject(snapshot.world) ? cloneValue(snapshot.world) : {},
            narrative: isPlainObject(snapshot.narrative) ? cloneValue(snapshot.narrative) : {},
            ui: isPlainObject(snapshot.ui) ? cloneValue(snapshot.ui) : {}
        };
    }

    function migrateSnapshotToVersion3(snapshot) {
        const player = isPlainObject(snapshot.player) ? cloneValue(snapshot.player) : {};
        const world = isPlainObject(snapshot.world) ? cloneValue(snapshot.world) : {};

        if (Array.isArray(player.inventory)) {
            player.inventory = mergeMigratedStackableItems(player.inventory);

            if (typeof player.selectedInventorySlot === 'number' && !player.inventory[player.selectedInventorySlot]) {
                player.selectedInventorySlot = null;
            }
        }

        if (isPlainObject(world.groundItemsByKey)) {
            world.groundItemsByKey = migrateGroundItemsByKey(world.groundItemsByKey);
        }

        return {
            saveVersion: RAW_RESOURCE_LAYER_SAVE_VERSION,
            player,
            craftingState: isPlainObject(snapshot.craftingState) ? cloneValue(snapshot.craftingState) : {},
            world,
            narrative: isPlainObject(snapshot.narrative) ? cloneValue(snapshot.narrative) : {},
            ui: isPlainObject(snapshot.ui) ? cloneValue(snapshot.ui) : {}
        };
    }

    function migrateSnapshotToVersion4(snapshot) {
        const craftingState = buildMigratedCraftingState(snapshot);

        if (!isPlainObject(craftingState.resourceNodeIslandState)) {
            craftingState.resourceNodeIslandState = {};
        }

        return {
            saveVersion: RESOURCE_NODE_RESPAWN_POLICY_SAVE_VERSION,
            player: isPlainObject(snapshot.player) ? cloneValue(snapshot.player) : {},
            craftingState,
            world: isPlainObject(snapshot.world) ? cloneValue(snapshot.world) : {},
            narrative: isPlainObject(snapshot.narrative) ? cloneValue(snapshot.narrative) : {},
            ui: isPlainObject(snapshot.ui) ? cloneValue(snapshot.ui) : {}
        };
    }

    function migrateSnapshotToVersion5(snapshot) {
        const player = isPlainObject(snapshot.player) ? cloneValue(snapshot.player) : {};
        const world = isPlainObject(snapshot.world) ? cloneValue(snapshot.world) : {};

        if (Array.isArray(player.inventory)) {
            player.inventory = mergeMigratedStackableItems(player.inventory);

            if (typeof player.selectedInventorySlot === 'number' && !player.inventory[player.selectedInventorySlot]) {
                player.selectedInventorySlot = null;
            }
        }

        if (isPlainObject(world.groundItemsByKey)) {
            world.groundItemsByKey = migrateGroundItemsByKey(world.groundItemsByKey);
        }

        return {
            saveVersion: WATER_FLASK_CONTAINER_SAVE_VERSION,
            player,
            craftingState: buildMigratedCraftingState(snapshot),
            world,
            narrative: isPlainObject(snapshot.narrative) ? cloneValue(snapshot.narrative) : {},
            ui: isPlainObject(snapshot.ui) ? cloneValue(snapshot.ui) : {}
        };
    }

    function migrateSnapshotToVersion6(snapshot) {
        const player = isPlainObject(snapshot.player) ? cloneValue(snapshot.player) : {};
        const world = isPlainObject(snapshot.world) ? cloneValue(snapshot.world) : {};

        if (Array.isArray(player.inventory)) {
            player.inventory = mergeMigratedStackableItems(player.inventory.map((item) => (
                item ? migrateSplitReedResourceItem(item) : item
            )));

            if (typeof player.selectedInventorySlot === 'number' && !player.inventory[player.selectedInventorySlot]) {
                player.selectedInventorySlot = null;
            }
        }

        if (isPlainObject(world.groundItemsByKey)) {
            world.groundItemsByKey = Object.fromEntries(Object.entries(world.groundItemsByKey).map(([worldKey, items]) => [
                worldKey,
                migrateGroundItemList((Array.isArray(items) ? items : []).map((item) => (
                    item ? migrateSplitReedResourceItem(item) : item
                )))
            ]));
        }

        return {
            saveVersion: REEDS_RESOURCE_SPLIT_SAVE_VERSION,
            player,
            craftingState: buildMigratedCraftingState(snapshot),
            world,
            narrative: isPlainObject(snapshot.narrative) ? cloneValue(snapshot.narrative) : {},
            ui: isPlainObject(snapshot.ui) ? cloneValue(snapshot.ui) : {}
        };
    }

    function normalizeSnapshot(snapshot) {
        const normalizedDomains = stateSchema.normalizeDomains({
            meta: {
                saveVersion: typeof snapshot.saveVersion === 'number'
                    ? snapshot.saveVersion
                    : stateSchema.SAVE_VERSION
            },
            player: isPlainObject(snapshot.player) ? snapshot.player : {},
            craftingState: isPlainObject(snapshot.craftingState)
                ? snapshot.craftingState
                : extractLegacyCraftingState(snapshot),
            world: isPlainObject(snapshot.world) ? snapshot.world : {},
            narrative: isPlainObject(snapshot.narrative) ? snapshot.narrative : {},
            ui: isPlainObject(snapshot.ui) ? snapshot.ui : {}
        });

        return {
            saveVersion: normalizedDomains.meta.saveVersion,
            player: normalizedDomains.player,
            craftingState: normalizedDomains.craftingState,
            world: normalizedDomains.world,
            narrative: normalizedDomains.narrative,
            ui: normalizedDomains.ui
        };
    }

    function migrateSnapshot(rawSnapshot) {
        if (!rawSnapshot || typeof rawSnapshot !== 'object') {
            return normalizeSnapshot(buildSaveSnapshot(stateSchema.createInitialState()));
        }

        let snapshot = null;

        if (rawSnapshot.player || rawSnapshot.craftingState || rawSnapshot.world || rawSnapshot.narrative || rawSnapshot.ui) {
            snapshot = {
                ...rawSnapshot,
                saveVersion: typeof rawSnapshot.saveVersion === 'number'
                    ? rawSnapshot.saveVersion
                    : DOMAIN_SAVE_VERSION
            };
        } else {
            snapshot = migrateLegacyStateToVersion1(rawSnapshot);
        }

        let version = typeof snapshot.saveVersion === 'number'
            ? snapshot.saveVersion
            : DOMAIN_SAVE_VERSION;

        while (version < stateSchema.SAVE_VERSION) {
            if (version === DOMAIN_SAVE_VERSION) {
                snapshot = migrateSnapshotToVersion2(snapshot);
                version = snapshot.saveVersion;
                continue;
            }

            if (version === CRAFTING_STATE_SAVE_VERSION) {
                snapshot = migrateSnapshotToVersion3(snapshot);
                version = snapshot.saveVersion;
                continue;
            }

            if (version === RAW_RESOURCE_LAYER_SAVE_VERSION) {
                snapshot = migrateSnapshotToVersion4(snapshot);
                version = snapshot.saveVersion;
                continue;
            }

            if (version === RESOURCE_NODE_RESPAWN_POLICY_SAVE_VERSION) {
                snapshot = migrateSnapshotToVersion5(snapshot);
                version = snapshot.saveVersion;
                continue;
            }

            if (version === WATER_FLASK_CONTAINER_SAVE_VERSION) {
                snapshot = migrateSnapshotToVersion6(snapshot);
                version = snapshot.saveVersion;
                continue;
            }

            break;
        }

        return normalizeSnapshot(snapshot);
    }

    function hydrateStateFromSnapshot(snapshot) {
        const migrated = migrateSnapshot(snapshot);

        return stateSchema.createStateFromDomains({
            meta: {
                saveVersion: migrated.saveVersion
            },
            player: migrated.player,
            craftingState: migrated.craftingState,
            world: migrated.world,
            narrative: migrated.narrative,
            ui: migrated.ui,
            runtime: stateSchema.createDomainState().runtime
        });
    }

    function resetRuntimeState(targetState) {
        const nextState = stateSchema.createInitialState();
        const destination = targetState && typeof targetState === 'object' ? targetState : {};

        Object.keys(destination).forEach((key) => {
            delete destination[key];
        });
        Object.assign(destination, nextState);
        return destination;
    }

    function applySnapshotToState(targetState, snapshot) {
        const nextState = hydrateStateFromSnapshot(snapshot);
        const destination = targetState && typeof targetState === 'object' ? targetState : {};

        Object.keys(destination).forEach((key) => {
            delete destination[key];
        });
        Object.assign(destination, nextState);
        return destination;
    }

    function serializeState(state = window.Game.state) {
        return JSON.stringify(buildSaveSnapshot(state));
    }

    function parseState(serializedState) {
        return hydrateStateFromSnapshot(JSON.parse(serializedState));
    }

    function saveToStorage(state = window.Game.state, storageKey = STORAGE_KEY) {
        if (typeof localStorage === 'undefined') {
            return false;
        }

        localStorage.setItem(storageKey, serializeState(state));
        return true;
    }

    function loadFromStorage(storageKey = STORAGE_KEY) {
        if (typeof localStorage === 'undefined') {
            return null;
        }

        const serializedState = localStorage.getItem(storageKey);
        if (!serializedState) {
            return null;
        }

        return parseState(serializedState);
    }

    function clearStorage(storageKey = STORAGE_KEY) {
        if (typeof localStorage === 'undefined') {
            return false;
        }

        localStorage.removeItem(storageKey);
        return true;
    }

    Object.assign(saveLoad, {
        SAVE_SLOT_COUNT,
        SAVE_SLOT_PREFIX,
        STORAGE_KEY,
        applySnapshotToState,
        buildSaveSlotMetadata,
        buildSaveSnapshot,
        clearStorage,
        hydrateStateFromSnapshot,
        getSaveSlotStorageKey,
        listSaveSlots,
        loadFromStorage,
        loadFromSlot,
        migrateLegacyStateToVersion1,
        migrateSnapshotToVersion2,
        migrateSnapshotToVersion3,
        migrateSnapshotToVersion4,
        migrateSnapshotToVersion5,
        migrateSnapshotToVersion6,
        migrateSnapshot,
        parseState,
        resetRuntimeState,
        saveToSlot,
        saveToStorage,
        serializeState
    });
})();
