(() => {
    const game = window.Game;
    const shopRuntime = game.systems.shopRuntime = game.systems.shopRuntime || {};

    function getItemRegistry() {
        return game.systems.itemRegistry || game.systems.loot || null;
    }

    function getItemCatalog() {
        return game.systems.itemCatalog || null;
    }

    function getPricingSystem() {
        return game.systems.pricing || null;
    }

    function getRewardScalingSystem() {
        return game.systems.rewardScaling || null;
    }

    function getInventoryRuntime() {
        return game.systems.inventoryRuntime || null;
    }

    function getQuestRuntime() {
        return game.systems.questRuntime || null;
    }

    function getBagUpgradeRuntime() {
        return game.systems.bagUpgradeRuntime || null;
    }

    function getItemEffects() {
        return game.systems.itemEffects || null;
    }

    function getUiBridge() {
        return game.systems.uiBridge || null;
    }

    function getTierByIsland(islandIndex = game.state.currentIslandIndex || 1) {
        const registry = getItemRegistry();
        return registry && typeof registry.getTierByIsland === 'function'
            ? registry.getTierByIsland(islandIndex)
            : 0;
    }

    function getItemDefinition(itemId) {
        const itemRegistry = getItemRegistry();
        return itemRegistry && typeof itemRegistry.getItemDefinition === 'function'
            ? itemRegistry.getItemDefinition(itemId)
            : null;
    }

    function getMerchantEncounter(source) {
        const encounter = source && source.expedition ? source.expedition : null;
        return encounter && encounter.kind === 'merchant' ? encounter : null;
    }

    function getMerchantStateStore() {
        game.state.merchantStateByHouseId = game.state.merchantStateByHouseId || {};
        return game.state.merchantStateByHouseId;
    }

    function randomRange(random, min, max) {
        return min + Math.floor(random() * (max - min + 1));
    }

    function getTierWindowMinIsland(tier) {
        const catalog = getItemCatalog();
        const window = catalog && catalog.tierWindows ? catalog.tierWindows[tier] : null;
        return window && Number.isFinite(window.minIsland) ? window.minIsland : Math.max(1, tier);
    }

    function getMerchantCategoryBias(islandTier) {
        switch (islandTier) {
            case 1:
                return ['consumable', 'survival', 'tool'];
            case 2:
                return ['movement', 'consumable', 'tool', 'utility'];
            case 3:
                return ['movement', 'utility', 'value'];
            case 4:
                return ['artifact', 'movement', 'utility', 'risk'];
            case 5:
                return ['artifact', 'utility', 'survival', 'risk'];
            case 6:
                return ['legendary', 'artifact', 'utility', 'movement'];
            default:
                return ['consumable', 'tool'];
        }
    }

    function getMerchantQuestBias(islandTier) {
        switch (islandTier) {
            case 1:
                return ['value', 'tool'];
            case 2:
                return ['value', 'tool', 'movement', 'survival'];
            case 3:
                return ['value', 'movement', 'utility', 'tool'];
            case 4:
                return ['risk', 'movement', 'value', 'tool'];
            case 5:
                return ['value', 'utility', 'risk'];
            case 6:
                return ['value', 'utility', 'legendary', 'risk'];
            default:
                return ['value'];
        }
    }

    const merchantRoleProfiles = {
        merchant: {
            stockCategories: [],
            questCategories: [],
            stockCountDelta: 0
        },
        fisherman: {
            stockCategories: ['food', 'survival', 'consumable', 'utility'],
            questCategories: ['tool', 'survival', 'value'],
            stockCountDelta: -1
        },
        bridgewright: {
            stockCategories: ['movement', 'tool', 'utility'],
            questCategories: ['movement', 'tool', 'value'],
            stockCountDelta: 0
        },
        junkDealer: {
            stockCategories: ['value', 'risk', 'tool', 'material'],
            questCategories: ['value', 'risk', 'tool'],
            stockCountDelta: 1
        },
        storyteller: {
            stockCategories: ['utility', 'consumable', 'value'],
            questCategories: ['utility', 'value'],
            stockCountDelta: -1
        },
        exchanger: {
            stockCategories: ['value', 'utility', 'artifact', 'consumable'],
            questCategories: ['value', 'utility', 'movement'],
            stockCountDelta: 0,
            minTier: 2
        },
        quartermaster: {
            stockCategories: ['survival', 'food', 'tool', 'consumable'],
            questCategories: ['survival', 'tool', 'movement'],
            stockCountDelta: 0
        },
        collector: {
            stockCategories: ['value', 'artifact', 'legendary', 'utility'],
            questCategories: ['value', 'artifact', 'risk'],
            stockCountDelta: -1,
            minTier: 3
        }
    };

    function getMerchantRoleProfile(merchantRole = 'merchant') {
        return merchantRoleProfiles[merchantRole] || merchantRoleProfiles.merchant;
    }

    function getBaseQuantityForDefinition(definition, islandTier, random) {
        if (!definition) {
            return 1;
        }

        if (!definition.stackable) {
            return 1;
        }

        const categories = Array.isArray(definition.categories) ? definition.categories : [];
        if (categories.includes('resource') || categories.includes('material')) {
            return randomRange(random, 2, islandTier >= 3 ? 4 : 3);
        }

        if (categories.includes('consumable') || categories.includes('food')) {
            return randomRange(random, 1, islandTier >= 2 ? 3 : 2);
        }

        return randomRange(random, 1, 2);
    }

    function getCatalogSelectorOptions(weightKey, islandIndex, options = {}) {
        const islandTier = Math.max(1, getTierByIsland(islandIndex));
        const bagUpgradeRuntime = getBagUpgradeRuntime();
        const roleProfile = getMerchantRoleProfile(options.merchantRole);
        const activeQuestBias = bagUpgradeRuntime && typeof bagUpgradeRuntime.getActiveBagQuestGenerationBias === 'function'
            ? bagUpgradeRuntime.getActiveBagQuestGenerationBias(islandIndex)
            : null;
        const preferredCategories = [
            ...(weightKey === 'merchantQuestWeight'
                ? roleProfile.questCategories || []
                : roleProfile.stockCategories || []),
            ...(weightKey === 'merchantQuestWeight' ? getMerchantQuestBias(islandTier) : getMerchantCategoryBias(islandTier)),
            ...(activeQuestBias ? activeQuestBias.preferredCategories : [])
        ].filter((category, index, list) => category && list.indexOf(category) === index);
        const roleMinTier = Number.isFinite(roleProfile.minTier)
            ? Math.min(roleProfile.minTier, islandTier)
            : undefined;
        const activeQuestMinTier = activeQuestBias && Number.isFinite(activeQuestBias.minTier)
            ? Math.min(activeQuestBias.minTier, islandTier)
            : undefined;

        return {
            includeTierZero: weightKey === 'merchantQuestWeight',
            preferredCategories,
            preferredRequirements: activeQuestBias && Array.isArray(activeQuestBias.preferredRequirements)
                ? activeQuestBias.preferredRequirements
                : [],
            minTier: Number.isFinite(activeQuestMinTier)
                ? Math.max(activeQuestMinTier, roleMinTier || 0)
                : roleMinTier
        };
    }

    function buildLegacyPool(weightKey) {
        const registry = getItemRegistry();
        const definitions = registry && typeof registry.getCatalogDefinitions === 'function'
            ? registry.getCatalogDefinitions()
            : [];

        return definitions
            .filter((definition) => Number(definition[weightKey]) > 0)
            .map((definition) => ({
                itemId: definition.id,
                minIsland: getTierWindowMinIsland(Math.max(1, definition.lootTier || 1)),
                maxQuantity: definition.stackable ? 3 : 1
            }));
    }

    const merchantStockPool = buildLegacyPool('merchantWeight');
    const merchantQuestPool = buildLegacyPool('merchantQuestWeight');

    function buildShopId(source, encounter) {
        if (encounter && encounter.shopId) {
            return encounter.shopId;
        }

        if (source && source.houseId) {
            return `shop:${source.houseId}`;
        }

        if (source && source.id) {
            return `shop:${source.id}`;
        }

        if (encounter && encounter.islandIndex) {
            return `shop:island:${encounter.islandIndex}`;
        }

        return 'shop:merchant';
    }

    function ensureMerchantIdentity(source, encounter) {
        if (!encounter || encounter.kind !== 'merchant') {
            return null;
        }

        encounter.shopId = buildShopId(source, encounter);
        encounter.stock = Array.isArray(encounter.stock)
            ? encounter.stock.map((stockItem, index) => {
                const definition = getItemDefinition(stockItem.itemId);
                return {
                    ...stockItem,
                    label: stockItem.label || (definition ? definition.label : stockItem.itemId),
                    icon: stockItem.icon || (definition ? definition.icon : '?'),
                    stockId: stockItem.stockId || `${encounter.shopId}:stock:${index}:${stockItem.itemId}`
                };
            })
            : [];

        if (encounter.quest) {
            encounter.quest.shopId = encounter.shopId;
            encounter.quest.questType = encounter.quest.questType || 'merchantDelivery';
            encounter.quest.progressRequired = Math.max(1, encounter.quest.progressRequired || encounter.quest.quantity || 1);
            encounter.quest.quantity = encounter.quest.progressRequired;
        }

        return encounter.shopId;
    }

    function createMerchantStock(islandIndex, random, options = {}) {
        const registry = getItemRegistry();
        const pricing = getPricingSystem();
        const islandTier = Math.max(1, getTierByIsland(islandIndex));
        const selectorOptions = getCatalogSelectorOptions('merchantWeight', islandIndex, options);
        const roleProfile = getMerchantRoleProfile(options.merchantRole);
        const stockCount = Math.max(
            2,
            Math.min(7, 3 + Math.floor((Math.max(1, islandIndex) - 1) / 6) + (roleProfile.stockCountDelta || 0))
        );
        const definitions = registry && typeof registry.pickUniqueWeightedCatalogDefinitions === 'function'
            ? registry.pickUniqueWeightedCatalogDefinitions('merchantWeight', islandIndex, random, stockCount, selectorOptions)
            : [];

        return definitions.map((definition, index) => ({
            stockId: `merchant:stock:${islandIndex}:${index}:${definition.id}`,
            itemId: definition.id,
            label: definition.label,
            icon: definition.icon,
            quantity: getBaseQuantityForDefinition(definition, islandTier, random),
            price: pricing && typeof pricing.getMerchantBuyPrice === 'function'
                ? pricing.getMerchantBuyPrice(definition.id, islandIndex)
                : Math.max(1, definition.baseValue || 1)
        }));
    }

    function createMerchantQuest(islandIndex, random, options = {}) {
        const registry = getItemRegistry();
        const rewardScaling = getRewardScalingSystem();
        const selectorOptions = getCatalogSelectorOptions('merchantQuestWeight', islandIndex, options);
        const definition = registry && typeof registry.pickWeightedCatalogDefinition === 'function'
            ? registry.pickWeightedCatalogDefinition('merchantQuestWeight', islandIndex, random, selectorOptions)
            : null;

        if (!definition) {
            return null;
        }

        const quantity = getBaseQuantityForDefinition(definition, Math.max(1, getTierByIsland(islandIndex)), random);
        const rewardGold = rewardScaling && typeof rewardScaling.getMerchantQuestReward === 'function'
            ? rewardScaling.getMerchantQuestReward(definition.id, quantity, islandIndex)
            : Math.max(8, Math.round((definition.baseValue || 6) * quantity * 1.8 + islandIndex * 2));

        return {
            questType: 'merchantDelivery',
            itemId: definition.id,
            label: definition.label,
            icon: definition.icon,
            quantity,
            progressRequired: quantity,
            rewardGold,
            completed: false,
            repeatable: false,
            description: `Нужен предмет "${definition.label}" x${quantity}.`
        };
    }

    function createMerchantEncounterProfile(islandIndex, random, options = {}) {
        const merchantRole = options.merchantRole || 'merchant';
        return {
            kind: 'merchant',
            merchantRole,
            label: options.label || 'Странствующий торговец',
            summary: options.summary || 'Торговец принимает заказы, скупает находки и продаёт полезные припасы для переходов.',
            tradeCost: 10 + islandIndex * 4,
            tradeReward: {
                hunger: 12 + islandIndex,
                energy: 12 + islandIndex,
                sleep: 6 + Math.floor(islandIndex * 0.5),
                focus: 4 + Math.floor(islandIndex * 0.4)
            },
            stock: createMerchantStock(islandIndex, random, { merchantRole }),
            quest: createMerchantQuest(islandIndex, random, { merchantRole })
        };
    }

    function applySavedMerchantState(house, profile) {
        if (!house || !profile || profile.kind !== 'merchant') {
            return profile;
        }

        const savedState = getMerchantStateStore()[house.id];
        profile.shopId = profile.shopId || `shop:${house.id}`;

        if (!savedState) {
            return profile;
        }

        if (Array.isArray(savedState.stock)) {
            profile.stock = savedState.stock.map((stockItem) => ({ ...stockItem }));
        }

        if (savedState.quest) {
            profile.quest = {
                ...(profile.quest || {}),
                ...savedState.quest
            };
        }

        profile.shopId = savedState.shopId || profile.shopId;
        return profile;
    }

    function persistMerchantState(source) {
        const encounter = getMerchantEncounter(source);

        if (!source || !source.houseId || !encounter) {
            return null;
        }

        ensureMerchantIdentity(source, encounter);
        const questRuntime = getQuestRuntime();
        const persistedQuest = encounter.quest && questRuntime && typeof questRuntime.getEncounterQuest === 'function'
            ? questRuntime.getEncounterQuest(source)
            : encounter.quest;

        getMerchantStateStore()[source.houseId] = {
            shopId: encounter.shopId,
            stock: encounter.stock.map((stockItem) => ({ ...stockItem })),
            quest: persistedQuest ? { ...persistedQuest } : null
        };

        return getMerchantStateStore()[source.houseId];
    }

    function prepareMerchantEncounter(source) {
        const encounter = getMerchantEncounter(source);

        if (!encounter) {
            return null;
        }

        ensureMerchantIdentity(source, encounter);
        const questRuntime = getQuestRuntime();

        if (encounter.quest && questRuntime) {
            questRuntime.acceptQuest(source, encounter.quest);
            questRuntime.getQuestProgress(source, encounter.quest);
        }

        return encounter;
    }

    function completeMerchantQuest(source) {
        const encounter = prepareMerchantEncounter(source);
        const questRuntime = getQuestRuntime();
        const uiBridge = getUiBridge();
        const itemEffects = getItemEffects();

        if (!encounter || !encounter.quest || !questRuntime) {
            return {
                success: false,
                message: 'У этого торговца нет незавершённого квеста.'
            };
        }

        const result = questRuntime.completeQuest(source, encounter.quest, { consumeItems: true });
        if (!result || !result.success) {
            return result || {
                success: false,
                message: 'Квест сейчас нельзя завершить.'
            };
        }

        if (uiBridge && typeof uiBridge.changeGold === 'function') {
            uiBridge.changeGold(result.quest.rewardGold || 0);
        } else {
            game.state.gold = Math.max(0, (game.state.gold || 0) + (result.quest.rewardGold || 0));
        }

        persistMerchantState(source);

        return {
            success: true,
            gold: result.quest.rewardGold || 0,
            quest: result.quest,
            effectDrops: itemEffects
                ? [itemEffects.buildGoldEffectDrop(result.quest.rewardGold || 0)].filter(Boolean)
                : [],
            message: `Квест торговца выполнен. Получено золото: +${result.quest.rewardGold || 0}.`
        };
    }

    function buyMerchantStock(source, stockIndex) {
        const encounter = prepareMerchantEncounter(source);
        const inventoryRuntime = getInventoryRuntime();
        const uiBridge = getUiBridge();
        const itemEffects = getItemEffects();
        const entry = encounter && Array.isArray(encounter.stock) ? encounter.stock[stockIndex] : null;

        if (!encounter || !entry || entry.quantity <= 0 || !inventoryRuntime) {
            return {
                success: false,
                message: 'Этот товар уже закончился.'
            };
        }

        const currentGold = uiBridge && typeof uiBridge.getGold === 'function'
            ? uiBridge.getGold()
            : (typeof game.state.gold === 'number' ? game.state.gold : 0);

        if (currentGold < entry.price) {
            return {
                success: false,
                message: `Не хватает золота. Нужно ${entry.price}, сейчас есть ${currentGold}.`
            };
        }

        const outcome = inventoryRuntime.addInventoryItem(entry.itemId, 1);
        if (!outcome.added) {
            return {
                success: false,
                message: 'В рюкзаке нет места для покупки.'
            };
        }

        if (uiBridge && typeof uiBridge.changeGold === 'function') {
            uiBridge.changeGold(-entry.price);
        } else {
            game.state.gold = Math.max(0, currentGold - entry.price);
        }

        entry.quantity = Math.max(0, (entry.quantity || 0) - 1);
        persistMerchantState(source);

        return {
            success: true,
            stockItem: entry,
            effectDrops: itemEffects
                ? [itemEffects.buildItemEffectDrop({ id: entry.itemId, icon: entry.icon, label: entry.label, quantity: 1 })].filter(Boolean)
                : [],
            message: `Куплен предмет "${entry.label}" за ${entry.price} золота.`
        };
    }

    function sellInventoryItemToMerchant(source, inventoryIndex) {
        const encounter = prepareMerchantEncounter(source);
        const inventoryRuntime = getInventoryRuntime();
        const pricing = getPricingSystem();
        const uiBridge = getUiBridge();
        const itemEffects = getItemEffects();
        const item = inventoryRuntime
            ? inventoryRuntime.normalizeInventoryItem(inventoryRuntime.getInventory()[inventoryIndex])
            : null;

        if (!encounter || !item || !inventoryRuntime) {
            return {
                success: false,
                message: 'Продать этот предмет сейчас нельзя.'
            };
        }

        const sellPrice = pricing && typeof pricing.getMerchantSellPrice === 'function'
            ? pricing.getMerchantSellPrice(item.id, encounter.islandIndex || game.state.currentIslandIndex)
            : 1;
        const removedItem = inventoryRuntime.removeInventoryItemAtIndex(inventoryIndex, 1);

        if (!removedItem) {
            return {
                success: false,
                message: 'Продать этот предмет сейчас нельзя.'
            };
        }

        if (uiBridge && typeof uiBridge.changeGold === 'function') {
            uiBridge.changeGold(sellPrice);
        } else {
            game.state.gold = Math.max(0, (game.state.gold || 0) + sellPrice);
        }

        persistMerchantState(source);

        return {
            success: true,
            price: sellPrice,
            item,
            effectDrops: itemEffects
                ? [itemEffects.buildGoldEffectDrop(sellPrice)].filter(Boolean)
                : [],
            message: `Продан предмет "${item.label}" за ${sellPrice} золота.`
        };
    }

    Object.assign(shopRuntime, {
        merchantStockPool,
        merchantQuestPool,
        buildShopId,
        ensureMerchantIdentity,
        createMerchantStock,
        createMerchantQuest,
        createMerchantEncounterProfile,
        applySavedMerchantState,
        persistMerchantState,
        prepareMerchantEncounter,
        completeMerchantQuest,
        buyMerchantStock,
        sellInventoryItemToMerchant
    });
})();
