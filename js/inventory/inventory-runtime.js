(() => {
    const game = window.Game;
    const inventoryRuntime = game.systems.inventoryRuntime = game.systems.inventoryRuntime || {};

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

    function getItemConversionRecipe(itemId) {
        const registry = getItemRegistry();
        return registry && typeof registry.getItemConversionRecipe === 'function'
            ? registry.getItemConversionRecipe(itemId)
            : null;
    }

    function normalizeInventoryItem(item) {
        if (!item || !item.id) {
            return item;
        }

        const definition = getItemDefinition(item.id);
        return {
            ...item,
            icon: item.icon || (definition ? definition.icon : '?'),
            label: item.label || (definition ? definition.label : item.id),
            quantity: Math.max(1, item.quantity || 1),
            obtainedIslandIndex: Math.max(1, item.obtainedIslandIndex || game.state.currentIslandIndex || 1),
            useCount: Math.max(0, item.useCount || 0)
        };
    }

    function mergeStackMetadata(stack, options = {}) {
        if (!stack || !options || typeof options !== 'object') {
            return;
        }

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

        const inventory = getInventory();
        const isStackable = registry && typeof registry.isItemStackable === 'function'
            ? registry.isItemStackable(itemId)
            : false;

        if (isStackable) {
            const stack = inventory.find((item) => item && item.id === itemId);
            if (stack) {
                stack.quantity = Math.max(1, (stack.quantity || 1) + quantity);
                stack.icon = definition.icon;
                stack.label = definition.label;
                stack.obtainedIslandIndex = Math.min(
                    Math.max(1, stack.obtainedIslandIndex || game.state.currentIslandIndex || 1),
                    Math.max(1, options.obtainedIslandIndex || game.state.currentIslandIndex || 1)
                );
                stack.useCount = Math.max(0, stack.useCount || 0);
                mergeStackMetadata(stack, options);
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

        const nextItem = registry && typeof registry.createInventoryItem === 'function'
            ? registry.createInventoryItem(itemId, quantity, options)
            : normalizeInventoryItem({ id: itemId, quantity });

        inventory[emptyIndex] = normalizeInventoryItem(nextItem);
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
            'useCount'
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

    function canAddInventoryItem(itemId) {
        const definition = getItemDefinition(itemId);

        if (!definition) {
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

        groundItem.items.forEach((item) => {
            const outcome = addInventoryItem(item.id, item.quantity || 1);

            if (outcome.added) {
                picked.push(normalizeInventoryItem(item));
                return;
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

    Object.assign(inventoryRuntime, {
        getInventory,
        getUnlockedInventorySlots,
        getSelectedInventoryItem,
        getItemDefinition,
        normalizeInventoryItem,
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
        dropSelectedInventoryItem
    });
})();
