(() => {
    const game = window.Game;
    const inventoryRuntime = game.systems.inventoryRuntime = game.systems.inventoryRuntime || {};
    const BULK_CAPACITY_PER_SLOT = 4;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function getItemRegistry() {
        return game.systems.itemRegistry || game.systems.loot || null;
    }

    function getInventory() {
        const inventory = Array.isArray(game.state.inventory) ? game.state.inventory : [];

        while (inventory.length < 10) {
            inventory.push(null);
        }

        game.state.inventory = inventory;
        return inventory;
    }

    function getUnlockedInventorySlots() {
        return clamp(game.state.unlockedInventorySlots || 4, 0, 10);
    }

    function getSelectedInventoryItem() {
        const index = game.state.selectedInventorySlot;
        if (typeof index !== 'number' || index < 0 || index >= getUnlockedInventorySlots()) {
            return null;
        }

        return getInventory()[index] || null;
    }

    function getItemDefinition(itemId) {
        const registry = getItemRegistry();
        return registry && typeof registry.getItemDefinition === 'function'
            ? registry.getItemDefinition(itemId)
            : null;
    }

    function normalizeBulkValue(bulk) {
        return Math.max(0, Math.floor(Number.isFinite(bulk) ? bulk : 0));
    }

    function getItemBulk(itemOrId, quantity = null) {
        const itemId = typeof itemOrId === 'string'
            ? itemOrId
            : (itemOrId && typeof itemOrId.id === 'string' ? itemOrId.id : '');
        const definition = itemId ? getItemDefinition(itemId) : null;
        const normalizedQuantity = Number.isFinite(quantity)
            ? Math.max(1, Math.floor(quantity))
            : Math.max(1, Math.floor(itemOrId && Number.isFinite(itemOrId.quantity) ? itemOrId.quantity : 1));

        return normalizeBulkValue(definition && definition.bulk) * normalizedQuantity;
    }

    function getInventoryBulkCapacity(slotCount = getUnlockedInventorySlots()) {
        return Math.max(0, Math.floor(slotCount)) * BULK_CAPACITY_PER_SLOT;
    }

    function getInventoryBulkUsage(inventoryItems = getInventory(), options = {}) {
        const slotCount = Number.isFinite(options.slotCount)
            ? Math.max(0, Math.floor(options.slotCount))
            : getUnlockedInventorySlots();
        const normalizedInventory = Array.isArray(inventoryItems) ? inventoryItems : [];
        let totalBulk = 0;

        for (let index = 0; index < slotCount; index++) {
            const item = normalizedInventory[index];
            if (!item || !item.id) {
                continue;
            }

            totalBulk += getItemBulk(item);
        }

        return totalBulk;
    }

    function hasInventoryBulkCapacityForAddition(itemId, quantity = 1, options = {}) {
        const inventoryItems = Array.isArray(options.inventoryItems) ? options.inventoryItems : getInventory();
        const slotCount = Number.isFinite(options.slotCount)
            ? Math.max(0, Math.floor(options.slotCount))
            : getUnlockedInventorySlots();
        const projectedBulkUsage = getInventoryBulkUsage(inventoryItems, { slotCount }) + getItemBulk(itemId, quantity);

        return projectedBulkUsage <= getInventoryBulkCapacity(slotCount);
    }

    function getItemConversionRecipe(itemId) {
        const registry = getItemRegistry();
        return registry && typeof registry.getItemConversionRecipe === 'function'
            ? registry.getItemConversionRecipe(itemId)
            : null;
    }

    function getCurrentTimeOfDayAdvanceCount() {
        const rawValue = game.state && typeof game.state.timeOfDayAdvancesElapsed === 'number'
            ? game.state.timeOfDayAdvancesElapsed
            : 0;
        return Math.max(0, Math.floor(rawValue));
    }

    function getItemSpoilageProfile(itemOrId) {
        const itemId = typeof itemOrId === 'string'
            ? itemOrId
            : (itemOrId && typeof itemOrId.id === 'string' ? itemOrId.id : '');
        const definition = itemId ? getItemDefinition(itemId) : null;
        const spoilage = definition && definition.spoilage && typeof definition.spoilage === 'object'
            ? definition.spoilage
            : null;
        const spoilsAfterAdvances = spoilage && Number.isFinite(spoilage.spoilsAfterAdvances)
            ? Math.max(1, Math.floor(spoilage.spoilsAfterAdvances))
            : 0;
        const spoiledItemId = spoilage && typeof spoilage.spoiledItemId === 'string'
            ? spoilage.spoiledItemId.trim()
            : '';

        if (!definition || !spoilage || !spoilsAfterAdvances || !spoiledItemId) {
            return null;
        }

        return {
            itemId,
            spoilsAfterAdvances,
            spoiledItemId,
            spoilageLabel: typeof spoilage.spoilageLabel === 'string' ? spoilage.spoilageLabel.trim() : ''
        };
    }

    function ensurePerishableMetadata(item) {
        if (!item || !item.id) {
            return item;
        }

        const spoilageProfile = getItemSpoilageProfile(item);
        if (!spoilageProfile) {
            if (Object.prototype.hasOwnProperty.call(item, 'spoilsAtAdvance')) {
                delete item.spoilsAtAdvance;
            }
            return item;
        }

        if (!Number.isFinite(item.spoilsAtAdvance)) {
            item.spoilsAtAdvance = getCurrentTimeOfDayAdvanceCount() + spoilageProfile.spoilsAfterAdvances;
        } else {
            item.spoilsAtAdvance = Math.max(0, Math.floor(item.spoilsAtAdvance));
        }

        return item;
    }

    function mergeSpoilageMetadata(stack, incomingItem) {
        const spoilageProfile = getItemSpoilageProfile(stack);
        if (!spoilageProfile || !stack) {
            return;
        }

        const incomingSpoilsAtAdvance = incomingItem && Number.isFinite(incomingItem.spoilsAtAdvance)
            ? Math.max(0, Math.floor(incomingItem.spoilsAtAdvance))
            : null;

        if (incomingSpoilsAtAdvance === null) {
            ensurePerishableMetadata(stack);
            return;
        }

        stack.spoilsAtAdvance = Number.isFinite(stack.spoilsAtAdvance)
            ? Math.min(Math.max(0, Math.floor(stack.spoilsAtAdvance)), incomingSpoilsAtAdvance)
            : incomingSpoilsAtAdvance;
    }

    function formatAdvanceLabel(remainingAdvances) {
        const normalizedAdvances = Math.max(0, Math.floor(remainingAdvances));

        if (normalizedAdvances <= 0) {
            return 'уже испорчено';
        }

        if (normalizedAdvances === 1) {
            return 'испортится к следующей смене времени';
        }

        return `испортится через ${normalizedAdvances} смены времени`;
    }

    function getItemSpoilageState(item) {
        if (!item || !item.id) {
            return null;
        }

        const spoilageProfile = getItemSpoilageProfile(item);
        if (!spoilageProfile) {
            return null;
        }

        ensurePerishableMetadata(item);
        const currentAdvance = getCurrentTimeOfDayAdvanceCount();
        const spoilsAtAdvance = Number.isFinite(item.spoilsAtAdvance)
            ? Math.max(0, Math.floor(item.spoilsAtAdvance))
            : currentAdvance + spoilageProfile.spoilsAfterAdvances;
        const remainingAdvances = Math.max(0, spoilsAtAdvance - currentAdvance);

        return {
            ...spoilageProfile,
            currentAdvance,
            spoilsAtAdvance,
            remainingAdvances,
            isSpoiled: remainingAdvances <= 0,
            statusLabel: formatAdvanceLabel(remainingAdvances)
        };
    }

    function normalizeInventoryItem(item) {
        if (!item || !item.id) {
            return item;
        }

        const definition = getItemDefinition(item.id);
        const normalizedItem = {
            ...item,
            icon: item.icon || (definition ? definition.icon : '?'),
            label: item.label || (definition ? definition.label : item.id),
            quantity: Math.max(1, item.quantity || 1),
            obtainedIslandIndex: Math.max(1, item.obtainedIslandIndex || game.state.currentIslandIndex || 1),
            useCount: Math.max(0, item.useCount || 0)
        };

        return ensurePerishableMetadata(normalizedItem);
    }

    function mergeStackMetadata(stack, options = {}) {
        if (!stack || !options || typeof options !== 'object') {
            return;
        }

        mergeSpoilageMetadata(stack, options);

        const resourceFamilyId = typeof options.resourceFamilyId === 'string' && options.resourceFamilyId.trim()
            ? options.resourceFamilyId.trim()
            : '';
        const resourceSubtypeId = typeof options.resourceSubtypeId === 'string' && options.resourceSubtypeId.trim()
            ? options.resourceSubtypeId.trim()
            : '';
        const resourceSubtypeLabel = typeof options.resourceSubtypeLabel === 'string' && options.resourceSubtypeLabel.trim()
            ? options.resourceSubtypeLabel.trim()
            : '';

        if (resourceFamilyId) {
            stack.resourceFamilyId = resourceFamilyId;
        }

        if (!resourceSubtypeId) {
            if (stack.resourceSubtypeId) {
                delete stack.resourceSubtypeId;
                delete stack.resourceSubtypeLabel;
            }
            return;
        }

        if (!stack.resourceSubtypeId) {
            stack.resourceSubtypeId = resourceSubtypeId;
            if (resourceSubtypeLabel) {
                stack.resourceSubtypeLabel = resourceSubtypeLabel;
            }
            return;
        }

        if (stack.resourceSubtypeId !== resourceSubtypeId) {
            delete stack.resourceSubtypeId;
            delete stack.resourceSubtypeLabel;
            return;
        }

        if (!stack.resourceSubtypeLabel && resourceSubtypeLabel) {
            stack.resourceSubtypeLabel = resourceSubtypeLabel;
        }
    }

    function addInventoryItem(itemId, quantity = 1, options = {}) {
        const registry = getItemRegistry();
        const definition = getItemDefinition(itemId);
        if (!definition) {
            return {
                added: false,
                reason: 'unknown',
                item: null,
                conversions: []
            };
        }

        if (!hasInventoryBulkCapacityForAddition(itemId, quantity)) {
            return {
                added: false,
                reason: 'full',
                capacityType: 'bulk',
                item: null,
                conversions: []
            };
        }

        const inventory = getInventory();
        const nextItem = registry && typeof registry.createInventoryItem === 'function'
            ? registry.createInventoryItem(itemId, quantity, options)
            : normalizeInventoryItem({ ...options, id: itemId, quantity });
        const normalizedNextItem = normalizeInventoryItem(nextItem);
        const isStackable = registry && typeof registry.isItemStackable === 'function'
            ? registry.isItemStackable(itemId)
            : false;

        if (isStackable) {
            const stack = inventory.find((item) => item && item.id === itemId);
            if (stack) {
                stack.quantity = Math.max(1, (stack.quantity || 1) + (normalizedNextItem.quantity || quantity));
                stack.icon = definition.icon;
                stack.label = definition.label;
                stack.obtainedIslandIndex = Math.min(
                    Math.max(1, stack.obtainedIslandIndex || game.state.currentIslandIndex || 1),
                    Math.max(1, normalizedNextItem.obtainedIslandIndex || game.state.currentIslandIndex || 1)
                );
                stack.useCount = Math.max(0, stack.useCount || 0);
                mergeStackMetadata(stack, normalizedNextItem);
                return {
                    added: true,
                    reason: 'stacked',
                    item: stack,
                    conversions: []
                };
            }
        }

        const emptyIndex = inventory.findIndex((item, index) => index < getUnlockedInventorySlots() && !item);
        if (emptyIndex === -1) {
            return {
                added: false,
                reason: 'full',
                item: null,
                conversions: []
            };
        }

        inventory[emptyIndex] = normalizedNextItem;
        return {
            added: true,
            reason: 'new',
            item: inventory[emptyIndex],
            conversions: []
        };
    }

    function findEmptyInventorySlot(excludeIndex = -1) {
        return getInventory().findIndex((item, index) => index < getUnlockedInventorySlots() && index !== excludeIndex && !item);
    }

    function buildTransformedInventoryItemMetadata(item, metadata = {}) {
        const reservedKeys = new Set([
            'id',
            'icon',
            'label',
            'quantity',
            'obtainedIslandIndex',
            'useCount',
            'spoilsAtAdvance',
            'spoiledAtAdvance',
            'spoiledFromItemId'
        ]);
        const passthroughMetadata = Object.fromEntries(
            Object.entries(item || {}).filter(([key]) => !reservedKeys.has(key))
        );

        return {
            ...passthroughMetadata,
            obtainedIslandIndex: Number.isFinite(metadata.obtainedIslandIndex)
                ? metadata.obtainedIslandIndex
                : Math.max(1, item && item.obtainedIslandIndex ? item.obtainedIslandIndex : game.state.currentIslandIndex || 1),
            useCount: Math.max(0, Number.isFinite(metadata.useCount) ? metadata.useCount : (item && item.useCount) || 0),
            ...metadata
        };
    }

    function removeInventoryItemAtIndex(index, quantity = 1) {
        if (typeof index !== 'number' || index < 0 || index >= getUnlockedInventorySlots()) {
            return null;
        }

        const inventory = getInventory();
        const item = inventory[index];

        if (!item) {
            return null;
        }

        const removedQuantity = Math.max(1, quantity);
        const currentQuantity = Math.max(1, item.quantity || 1);
        const nextQuantity = currentQuantity - removedQuantity;
        const removedItem = normalizeInventoryItem({
            ...item,
            quantity: Math.min(currentQuantity, removedQuantity)
        });

        if (nextQuantity > 0) {
            item.quantity = nextQuantity;
        } else {
            inventory[index] = null;
            if (game.state.selectedInventorySlot === index) {
                game.state.selectedInventorySlot = null;
            }
        }

        return removedItem;
    }

    function transformInventoryItemAtIndex(index, nextItemId, quantity = 1, metadata = {}) {
        if (typeof index !== 'number' || index < 0 || index >= getUnlockedInventorySlots()) {
            return {
                success: false,
                reason: 'invalid-index',
                item: null,
                targetIndex: null
            };
        }

        const currentItem = getInventory()[index];
        const nextDefinition = getItemDefinition(nextItemId);
        if (!currentItem) {
            return {
                success: false,
                reason: 'missing',
                item: null,
                targetIndex: null
            };
        }

        if (!nextDefinition) {
            return {
                success: false,
                reason: 'unknown',
                item: null,
                targetIndex: null
            };
        }

        if (currentItem.id === nextItemId) {
            return {
                success: true,
                reason: 'same-item',
                item: normalizeInventoryItem(currentItem),
                targetIndex: index
            };
        }

        const registry = getItemRegistry();
        const inventory = getInventory();
        const currentQuantity = Math.max(1, currentItem.quantity || 1);
        const transformQuantity = Math.max(1, Math.min(currentQuantity, quantity));
        const bulkDelta = getItemBulk(nextItemId, transformQuantity) - getItemBulk(currentItem, transformQuantity);
        if (bulkDelta > 0 && getInventoryBulkUsage() + bulkDelta > getInventoryBulkCapacity()) {
            return {
                success: false,
                reason: 'full',
                capacityType: 'bulk',
                item: null,
                targetIndex: null
            };
        }
        const isTargetStackable = registry && typeof registry.isItemStackable === 'function'
            ? registry.isItemStackable(nextItemId)
            : false;
        const existingTargetIndex = isTargetStackable
            ? inventory.findIndex((item, itemIndex) => itemIndex !== index && item && item.id === nextItemId)
            : -1;
        const needsSeparateSlot = currentQuantity > transformQuantity && existingTargetIndex === -1;
        const emptyIndex = needsSeparateSlot ? findEmptyInventorySlot(index) : -1;

        if (needsSeparateSlot && emptyIndex === -1) {
            return {
                success: false,
                reason: 'full',
                item: null,
                targetIndex: null
            };
        }

        const nextItemMetadata = buildTransformedInventoryItemMetadata(currentItem, metadata);
        const createdItem = registry && typeof registry.createInventoryItem === 'function'
            ? registry.createInventoryItem(nextItemId, transformQuantity, nextItemMetadata)
            : normalizeInventoryItem({
                ...nextItemMetadata,
                id: nextItemId,
                quantity: transformQuantity
            });

        if (currentQuantity <= transformQuantity) {
            if (existingTargetIndex >= 0) {
                inventory[existingTargetIndex].quantity = Math.max(1, (inventory[existingTargetIndex].quantity || 1) + transformQuantity);
                inventory[index] = null;
                if (game.state.selectedInventorySlot === index) {
                    game.state.selectedInventorySlot = null;
                }
                return {
                    success: true,
                    reason: 'merged',
                    item: normalizeInventoryItem(inventory[existingTargetIndex]),
                    targetIndex: existingTargetIndex
                };
            }

            inventory[index] = normalizeInventoryItem(createdItem);
            return {
                success: true,
                reason: 'replaced',
                item: normalizeInventoryItem(inventory[index]),
                targetIndex: index
            };
        }

        currentItem.quantity = currentQuantity - transformQuantity;

        if (existingTargetIndex >= 0) {
            inventory[existingTargetIndex].quantity = Math.max(1, (inventory[existingTargetIndex].quantity || 1) + transformQuantity);
            return {
                success: true,
                reason: 'merged',
                item: normalizeInventoryItem(inventory[existingTargetIndex]),
                targetIndex: existingTargetIndex
            };
        }

        inventory[emptyIndex] = normalizeInventoryItem(createdItem);
        return {
            success: true,
            reason: 'split',
            item: normalizeInventoryItem(inventory[emptyIndex]),
            targetIndex: emptyIndex
        };
    }

    function countInventoryItem(itemId) {
        return getInventory().reduce((sum, item) => {
            if (!item || item.id !== itemId) {
                return sum;
            }

            return sum + Math.max(1, item.quantity || 1);
        }, 0);
    }

    function canAddInventoryItem(itemId, quantity = 1) {
        const definition = getItemDefinition(itemId);

        if (!definition) {
            return false;
        }

        if (!hasInventoryBulkCapacityForAddition(itemId, quantity)) {
            return false;
        }

        const registry = getItemRegistry();
        const inventory = getInventory();
        const isStackable = registry && typeof registry.isItemStackable === 'function'
            ? registry.isItemStackable(itemId)
            : false;

        if (isStackable && inventory.some((item) => item && item.id === itemId)) {
            return true;
        }

        return inventory.some((item, index) => index < getUnlockedInventorySlots() && !item);
    }

    function applyAutoConversions(itemId) {
        return [];
    }

    function consumeInventoryItemById(itemId, quantity = 1) {
        let remaining = Math.max(1, quantity);
        const removed = [];

        for (let index = 0; index < getUnlockedInventorySlots() && remaining > 0; index++) {
            const item = getInventory()[index];

            if (!item || item.id !== itemId) {
                continue;
            }

            const available = Math.max(1, item.quantity || 1);
            const removedItem = removeInventoryItemAtIndex(index, Math.min(available, remaining));

            if (removedItem) {
                removed.push(removedItem);
                remaining -= removedItem.quantity || 1;
            }
        }

        return {
            success: remaining <= 0,
            removed,
            remaining
        };
    }

    function consumeSelectedInventoryItem(quantity = 1) {
        const index = game.state.selectedInventorySlot;
        return removeInventoryItemAtIndex(index, quantity);
    }

    function markInventoryItemUsed(index) {
        if (typeof index !== 'number' || index < 0 || index >= getUnlockedInventorySlots()) {
            return null;
        }

        const item = getInventory()[index];

        if (!item) {
            return null;
        }

        item.useCount = Math.max(0, item.useCount || 0) + 1;
        return item;
    }

    function getCurrentGroundItem() {
        return game.state.activeGroundItem || null;
    }

    function getGroundItemDescription(groundItem) {
        if (!groundItem || !Array.isArray(groundItem.items) || groundItem.items.length === 0) {
            return '';
        }

        return groundItem.items
            .map((item) => `${item.label}${item.quantity > 1 ? ` x${item.quantity}` : ''}`)
            .join(', ');
    }

    function pickupGroundItem() {
        const groundItem = getCurrentGroundItem();

        if (!groundItem || !Array.isArray(groundItem.items) || groundItem.items.length === 0) {
            return {
                success: false,
                reason: 'empty',
                picked: [],
                remaining: []
            };
        }

        const picked = [];
        const remaining = [];
        let blockedCapacityType = '';

        groundItem.items.forEach((item) => {
            const outcome = addInventoryItem(item.id, item.quantity || 1);

            if (outcome.added) {
                picked.push(normalizeInventoryItem(item));
                return;
            }

            if (!blockedCapacityType && outcome && outcome.capacityType) {
                blockedCapacityType = outcome.capacityType;
            }
            remaining.push(normalizeInventoryItem(item));
        });

        if (game.systems.interactions) {
            game.systems.interactions.replaceGroundItemAtWorld(groundItem.worldX, groundItem.worldY, remaining);
        }

        if (game.systems.world) {
            game.systems.world.updatePlayerContext(game.state.playerPos);
        }

        return {
            success: picked.length > 0,
            reason: picked.length > 0
                ? (remaining.length > 0 ? 'partial' : 'picked')
                : 'full',
            capacityType: blockedCapacityType || '',
            picked,
            remaining
        };
    }

    function dropSelectedInventoryItem(quantity = 1) {
        const selectedItem = getSelectedInventoryItem();

        if (!selectedItem || game.state.selectedInventorySlot === null) {
            return {
                success: false,
                reason: 'no-selection',
                item: null
            };
        }

        const removedItem = removeInventoryItemAtIndex(game.state.selectedInventorySlot, quantity);

        if (!removedItem) {
            return {
                success: false,
                reason: 'missing',
                item: null
            };
        }

        if (game.systems.interactions) {
            game.systems.interactions.addGroundItemDrop(game.state.playerPos.x, game.state.playerPos.y, removedItem);
        }

        if (game.systems.world) {
            game.systems.world.updatePlayerContext(game.state.playerPos);
        }

        return {
            success: true,
            reason: 'dropped',
            item: normalizeInventoryItem(removedItem)
        };
    }

    function processPerishableItems(options = {}) {
        const currentAdvance = Number.isFinite(options.currentAdvance)
            ? Math.max(0, Math.floor(options.currentAdvance))
            : getCurrentTimeOfDayAdvanceCount();
        const spoiledEntries = [];
        const inventory = getInventory();

        for (let index = 0; index < getUnlockedInventorySlots(); index++) {
            const item = inventory[index];
            const spoilageState = getItemSpoilageState(item);

            if (!spoilageState || !spoilageState.isSpoiled) {
                continue;
            }

            const quantity = Math.max(1, item.quantity || 1);
            const transformed = transformInventoryItemAtIndex(index, spoilageState.spoiledItemId, quantity, {
                spoiledFromItemId: item.id,
                spoiledAtAdvance: currentAdvance
            });

            if (!transformed || !transformed.success) {
                continue;
            }

            spoiledEntries.push({
                itemId: item.id,
                label: item.label || spoilageState.itemId,
                quantity
            });
        }

        const groupedSpoilage = spoiledEntries.reduce((map, entry) => {
            const currentEntry = map.get(entry.itemId) || {
                label: entry.label,
                quantity: 0
            };
            currentEntry.quantity += entry.quantity;
            map.set(entry.itemId, currentEntry);
            return map;
        }, new Map());

        const summary = [...groupedSpoilage.values()]
            .map((entry) => `${entry.label}${entry.quantity > 1 ? ` x${entry.quantity}` : ''}`)
            .join(', ');

        return {
            transformedCount: spoiledEntries.length,
            entries: spoiledEntries,
            message: summary ? `Часть сырой рыбы испортилась: ${summary}.` : ''
        };
    }

    Object.assign(inventoryRuntime, {
        getInventory,
        getUnlockedInventorySlots,
        getSelectedInventoryItem,
        getItemDefinition,
        getItemBulk,
        getInventoryBulkUsage,
        getInventoryBulkCapacity,
        normalizeInventoryItem,
        getItemSpoilageState,
        addInventoryItem,
        removeInventoryItemAtIndex,
        transformInventoryItemAtIndex,
        countInventoryItem,
        canAddInventoryItem,
        getItemConversionRecipe,
        applyAutoConversions,
        consumeInventoryItemById,
        consumeSelectedInventoryItem,
        markInventoryItemUsed,
        getCurrentGroundItem,
        getGroundItemDescription,
        pickupGroundItem,
        dropSelectedInventoryItem,
        processPerishableItems
    });
})();
