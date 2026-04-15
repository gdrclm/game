(() => {
    const loot = window.Game.systems.loot = window.Game.systems.loot || {};

    const SPECIAL_DROP_ICONS = Object.freeze({
        recipe_unlock: 'RC',
        component_bundle: 'KB',
        structure_part: 'SP',
        station_unlock: 'ST',
        resource_tool: 'RT'
    });

    const CHEST_REWARD_CLASS_WEIGHTS = Object.freeze({
        ordinary: {
            item: 6.2,
            component_bundle: 2.1,
            resource_tool: 0.55,
            recipe_unlock: 0.12,
            station_unlock: 0.06,
            structure_part: 0.42
        },
        rich: {
            item: 5.2,
            component_bundle: 3.1,
            resource_tool: 0.95,
            recipe_unlock: 0.4,
            station_unlock: 0.12,
            structure_part: 0.95
        },
        hidden: {
            item: 1.9,
            component_bundle: 4.5,
            resource_tool: 1.9,
            recipe_unlock: 2.35,
            station_unlock: 0.45,
            structure_part: 1.8
        },
        cursed: {
            item: 1.35,
            component_bundle: 4.1,
            resource_tool: 0.9,
            recipe_unlock: 1.55,
            station_unlock: 0.2,
            structure_part: 2.8
        },
        elite: {
            item: 2.8,
            component_bundle: 4.25,
            resource_tool: 1.15,
            recipe_unlock: 1.55,
            station_unlock: 0.35,
            structure_part: 2.35
        },
        jackpot: {
            item: 1.9,
            component_bundle: 3.8,
            resource_tool: 1.0,
            recipe_unlock: 2.95,
            station_unlock: 0.75,
            structure_part: 3.25
        },
        final: {
            item: 1.4,
            component_bundle: 3.5,
            resource_tool: 0.8,
            recipe_unlock: 3.5,
            station_unlock: 1.05,
            structure_part: 3.6
        }
    });

    const RECIPE_UNLOCK_REWARDS = Object.freeze([
        { recipeId: 'portable-bridge-assembly', minIsland: 9, chestTiers: ['hidden', 'elite', 'jackpot', 'final'], weight: 2.7, goalKeys: ['bridge'] },
        { recipeId: 'bridge-repair-kit', minIsland: 10, chestTiers: ['hidden', 'cursed', 'elite', 'jackpot', 'final'], weight: 2.8, goalKeys: ['bridge', 'repair'] },
        { recipeId: 'boat-frame', minIsland: 14, chestTiers: ['elite', 'jackpot', 'final'], weight: 2.8, goalKeys: ['boat'] },
        { recipeId: 'boat', minIsland: 16, chestTiers: ['elite', 'jackpot', 'final'], weight: 3.3, goalKeys: ['boat'] },
        { recipeId: 'boat-repair-kit', minIsland: 16, chestTiers: ['cursed', 'elite', 'jackpot', 'final'], weight: 3.0, goalKeys: ['boat', 'repair'] },
        { recipeId: 'wood-plank-to-trade-papers', minIsland: 10, chestTiers: ['rich', 'hidden', 'elite', 'jackpot', 'final'], weight: 2.35, goalKeys: ['trade', 'scribe'] },
        { recipeId: 'stone-block-to-market-seal', minIsland: 12, chestTiers: ['rich', 'hidden', 'elite', 'jackpot', 'final'], weight: 2.45, goalKeys: ['trade', 'scribe'] },
        { recipeId: 'road-chalk', minIsland: 8, chestTiers: ['hidden', 'elite', 'jackpot', 'final'], weight: 2.2, goalKeys: ['route', 'scribe'] },
        { recipeId: 'path-marker', minIsland: 9, chestTiers: ['hidden', 'elite', 'jackpot', 'final'], weight: 2.5, goalKeys: ['route', 'scribe'] },
        { recipeId: 'safe-house-seal', minIsland: 12, chestTiers: ['hidden', 'elite', 'jackpot', 'final'], weight: 2.7, goalKeys: ['route', 'scribe'] },
        { recipeId: 'fog-lantern', minIsland: 18, chestTiers: ['cursed', 'elite', 'jackpot', 'final'], weight: 3.25, goalKeys: ['legendary', 'lateCraft'] },
        { recipeId: 'merchant-beacon', minIsland: 18, chestTiers: ['elite', 'jackpot', 'final'], weight: 3.1, goalKeys: ['legendary', 'lateCraft', 'scribe'] },
        { recipeId: 'reinforced-bridge-upgrade', minIsland: 18, chestTiers: ['cursed', 'elite', 'jackpot', 'final'], weight: 3.15, goalKeys: ['bridge', 'lateCraft'] },
        { recipeId: 'field-bridge-upgrade', minIsland: 20, chestTiers: ['elite', 'jackpot', 'final'], weight: 3.15, goalKeys: ['bridge', 'lateCraft'] },
        { recipeId: 'absolute-bridge-upgrade', minIsland: 24, chestTiers: ['jackpot', 'final'], weight: 3.65, goalKeys: ['bridge', 'legendary', 'lateCraft'] }
    ]);

    const STATION_UNLOCK_REWARDS = Object.freeze([
        { stationId: 'bench', minIsland: 4, chestTiers: ['hidden', 'elite', 'jackpot', 'final'], weight: 3.1 },
        { stationId: 'scribe', minIsland: 8, chestTiers: ['hidden', 'elite', 'jackpot', 'final'], weight: 2.8 }
    ]);

    const RESOURCE_TOOL_REWARDS = Object.freeze([
        { itemId: 'fishingRod', minIsland: 6, chestTiers: ['hidden', 'elite', 'jackpot', 'final'], weight: 3.8, goalKeys: ['boat', 'fishing'] },
        { itemId: 'smallPickaxe', minIsland: 8, chestTiers: ['rich', 'hidden', 'elite', 'jackpot', 'final'], weight: 2.8, goalKeys: ['bridge', 'repair'] },
        { itemId: 'doublePickaxe', minIsland: 16, chestTiers: ['elite', 'jackpot', 'final'], weight: 2.3, goalKeys: ['bridge', 'lateCraft'] }
    ]);

    const STRUCTURE_PART_REWARDS = Object.freeze([
        { itemId: 'bridge_kit', minIsland: 10, chestTiers: ['rich', 'hidden', 'elite', 'jackpot', 'final'], weight: 3.7, goalKeys: ['bridge'] },
        { itemId: 'repair_kit_bridge', minIsland: 10, chestTiers: ['rich', 'hidden', 'cursed', 'elite', 'jackpot', 'final'], weight: 3.35, goalKeys: ['bridge', 'repair'] },
        { itemId: 'portableBridge', minIsland: 12, chestTiers: ['hidden', 'elite', 'jackpot', 'final'], weight: 2.5, goalKeys: ['bridge'] },
        { itemId: 'reinforcedBridge', minIsland: 18, chestTiers: ['cursed', 'elite', 'jackpot', 'final'], weight: 2.35, goalKeys: ['bridge', 'lateCraft'] },
        { itemId: 'fieldBridge', minIsland: 21, chestTiers: ['elite', 'jackpot', 'final'], weight: 2.2, goalKeys: ['bridge', 'lateCraft'] },
        { itemId: 'absoluteBridge', minIsland: 25, chestTiers: ['jackpot', 'final'], weight: 1.85, goalKeys: ['bridge', 'legendary', 'lateCraft'] },
        { itemId: 'boat_ready', minIsland: 16, chestTiers: ['elite', 'jackpot', 'final'], weight: 3.2, goalKeys: ['boat'] },
        { itemId: 'repair_kit_boat', minIsland: 16, chestTiers: ['rich', 'hidden', 'cursed', 'elite', 'jackpot', 'final'], weight: 3.0, goalKeys: ['boat', 'repair'] }
    ]);

    const emptyChestTable = [
        { key: 'dust', weight: 54, flavorText: 'Внутри только пыль и мусор.' },
        { key: 'scraps', weight: 28, flavorText: 'Сундук почти пуст, но в углу завалялся небольшой припас.' },
        { key: 'coins', weight: 18, flavorText: 'Сундук почти вынесли, но несколько монет всё же осталось.' }
    ];

    const riskyChestTable = [
        {
            key: 'needleTrap',
            weight: 34,
            flavorText: 'Сработала ловушка с иглами.',
            statDelta: { energy: -8, focus: -7 }
        },
        {
            key: 'coldDust',
            weight: 22,
            flavorText: 'Из сундука вырвался холодный едкий порошок.',
            statDelta: { cold: -10, focus: -6 }
        },
        {
            key: 'collapse',
            weight: 24,
            flavorText: 'Крышка дёрнула механизм, и обстановка вокруг просела.',
            statDelta: { energy: -10, sleep: -8 }
        },
        {
            key: 'greedBite',
            weight: 20,
            flavorText: 'Лёгкая добыча оказалась опасной приманкой.',
            statDelta: { hunger: -8, energy: -8, focus: -5 }
        }
    ];

    const chestTierConfig = {
        ordinary: {
            extraRolls: 0,
            goldMultiplier: 1,
            emptyChance: 0.08,
            riskyChance: 0.05
        },
        rich: {
            extraRolls: 1,
            goldMultiplier: 1.2,
            emptyChance: 0.03,
            riskyChance: 0.07
        },
        hidden: {
            extraRolls: 0,
            goldMultiplier: 1.08,
            emptyChance: 0.18,
            riskyChance: 0.18
        },
        cursed: {
            extraRolls: 1,
            goldMultiplier: 1.15,
            emptyChance: 0.08,
            riskyChance: 0.44
        },
        elite: {
            extraRolls: 2,
            goldMultiplier: 1.4,
            emptyChance: 0.02,
            riskyChance: 0.1
        },
        jackpot: {
            extraRolls: 3,
            goldMultiplier: 1.8,
            emptyChance: 0,
            riskyChance: 0.04
        },
        final: {
            extraRolls: 4,
            goldMultiplier: 2.2,
            emptyChance: 0,
            riskyChance: 0
        }
    };

    function getItemRegistry() {
        return window.Game.systems.itemRegistry || null;
    }

    function getPricingSystem() {
        return window.Game.systems.pricing || null;
    }

    function getShopRuntime() {
        return window.Game.systems.shopRuntime || null;
    }

    function getItemEffects() {
        return window.Game.systems.itemEffects || null;
    }

    function getComponentRegistry() {
        return window.Game.systems.componentRegistry || null;
    }

    function getRecipeRegistry() {
        return window.Game.systems.recipeRegistry || null;
    }

    function getCraftingRuntime() {
        return window.Game.systems.craftingRuntime || null;
    }

    function getStationRuntime() {
        return window.Game.systems.stationRuntime || null;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function cloneValue(value) {
        if (Array.isArray(value)) {
            return value.map(cloneValue);
        }

        if (!value || typeof value !== 'object') {
            return value;
        }

        return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)]));
    }

    function listUnique(values = []) {
        return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
    }

    function getModifierSnapshot(islandIndex) {
        const itemEffects = getItemEffects();
        return itemEffects && typeof itemEffects.getModifierSnapshot === 'function'
            ? itemEffects.getModifierSnapshot({ currentIslandIndex: islandIndex })
            : {
                goldLootMultiplier: 1,
                chestLuck: 0
            };
    }

    function getItemDefinition(itemId) {
        const itemRegistry = getItemRegistry();
        return itemRegistry && typeof itemRegistry.getItemDefinition === 'function'
            ? itemRegistry.getItemDefinition(itemId)
            : null;
    }

    function createInventoryItem(itemId, quantity = 1) {
        const itemRegistry = getItemRegistry();
        return itemRegistry && typeof itemRegistry.createInventoryItem === 'function'
            ? itemRegistry.createInventoryItem(itemId, quantity)
            : null;
    }

    function describeItem(itemId) {
        const itemRegistry = getItemRegistry();
        return itemRegistry && typeof itemRegistry.describeItem === 'function'
            ? itemRegistry.describeItem(itemId)
            : '';
    }

    function getConsumableEffect(itemId) {
        const itemRegistry = getItemRegistry();
        return itemRegistry && typeof itemRegistry.getConsumableEffect === 'function'
            ? itemRegistry.getConsumableEffect(itemId)
            : null;
    }

    function isItemStackable(itemId) {
        const itemRegistry = getItemRegistry();
        return itemRegistry && typeof itemRegistry.isItemStackable === 'function'
            ? itemRegistry.isItemStackable(itemId)
            : false;
    }

    function getItemBaseValue(itemId) {
        const itemRegistry = getItemRegistry();
        return itemRegistry && typeof itemRegistry.getItemBaseValue === 'function'
            ? itemRegistry.getItemBaseValue(itemId)
            : 1;
    }

    function getMerchantBuyPrice(itemId, islandIndex = 1) {
        const pricing = getPricingSystem();

        if (pricing && pricing !== loot && typeof pricing.getMerchantBuyPrice === 'function') {
            return pricing.getMerchantBuyPrice(itemId, islandIndex);
        }

        return Math.max(2, Math.round(getItemBaseValue(itemId) * 1.22 + islandIndex * 0.35));
    }

    function getMerchantSellPrice(itemId, islandIndex = 1) {
        const pricing = getPricingSystem();

        if (pricing && pricing !== loot && typeof pricing.getMerchantSellPrice === 'function') {
            return pricing.getMerchantSellPrice(itemId, islandIndex);
        }

        return Math.max(1, Math.round(getMerchantBuyPrice(itemId, islandIndex) * 0.55));
    }

    function randomRange(random, min, max) {
        return min + Math.floor(random() * (max - min + 1));
    }

    function pickWeightedEntry(entries, random) {
        const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
        let roll = random() * totalWeight;

        for (const entry of entries) {
            roll -= entry.weight;
            if (roll <= 0) {
                return entry;
            }
        }

        return entries[entries.length - 1] || null;
    }

    function getTierByIsland(islandIndex = window.Game.state.currentIslandIndex || 1) {
        const itemRegistry = getItemRegistry();
        return itemRegistry && typeof itemRegistry.getTierByIsland === 'function'
            ? itemRegistry.getTierByIsland(islandIndex)
            : Math.max(1, Math.floor((Math.max(1, islandIndex) - 1) / 6) + 1);
    }

    function getTierDistributionWeight(itemTier, islandTier, options = {}) {
        const normalizedIslandTier = Math.max(1, islandTier || 1);
        const normalizedItemTier = Math.max(1, itemTier || 1);
        const allowFutureTiers = Boolean(options.allowFutureTiers);
        const maxFutureDistance = Number.isFinite(options.maxFutureDistance)
            ? Math.max(0, options.maxFutureDistance)
            : 1;

        if (normalizedItemTier > normalizedIslandTier) {
            const forwardDistance = normalizedItemTier - normalizedIslandTier;
            if (!allowFutureTiers || forwardDistance > maxFutureDistance) {
                return 0;
            }

            return forwardDistance === 1 ? 0.18 : 0.06;
        }

        const distance = normalizedIslandTier - normalizedItemTier;
        const weights = [1, 0.72, 0.48, 0.3, 0.18, 0.12];
        return weights[distance] || 0.08;
    }

    function createGoldDrop(label, random, islandIndex, multiplier = 1, min = 6, max = 12) {
        const scaleBonus = islandIndex >= 8 ? Math.floor((islandIndex - 7) * 1.5) : 0;
        const modifierSnapshot = getModifierSnapshot(islandIndex);
        const totalMultiplier = multiplier * (modifierSnapshot.goldLootMultiplier || 1);
        const amount = Math.round((randomRange(random, min, max) + scaleBonus) * totalMultiplier);

        return {
            type: 'gold',
            label,
            icon: '$',
            amount: Math.max(1, amount)
        };
    }

    function createItemDropFromDefinition(definition, quantity = 1, type = 'item', extra = {}) {
        if (!definition) {
            return null;
        }

        return {
            type,
            itemId: definition.id,
            label: definition.label,
            icon: definition.icon,
            quantity: Math.max(1, quantity),
            ...cloneValue(extra)
        };
    }

    function buildRewardKey(drop) {
        if (!drop) {
            return '';
        }

        if ((drop.type === 'item' || drop.type === 'resource_tool' || drop.type === 'structure_part') && drop.itemId) {
            return `${drop.type}:${drop.itemId}`;
        }

        if (drop.type === 'recipe_unlock' && drop.recipeId) {
            return `recipe:${drop.recipeId}`;
        }

        if (drop.type === 'station_unlock' && drop.stationId) {
            return `station:${drop.stationId}`;
        }

        if (drop.type === 'component_bundle' && Array.isArray(drop.entries)) {
            return drop.entries
                .map((entry) => `bundle:${entry.itemId}`)
                .join('|');
        }

        return '';
    }

    function mergeDrops(drops) {
        const result = [];
        const mergeableItemMap = new Map();

        drops.forEach((drop) => {
            if (!drop) {
                return;
            }

            if ((drop.type === 'item' || drop.type === 'resource_tool' || drop.type === 'structure_part') && drop.itemId) {
                const key = `${drop.type}:${drop.itemId}`;
                if (!mergeableItemMap.has(key)) {
                    const nextDrop = { ...drop };
                    mergeableItemMap.set(key, nextDrop);
                    result.push(nextDrop);
                    return;
                }

                mergeableItemMap.get(key).quantity += drop.quantity || 1;
                return;
            }

            result.push(cloneValue(drop));
        });

        return result;
    }

    function getCraftingStateStore() {
        if (!window.Game.state || typeof window.Game.state !== 'object') {
            return {};
        }

        if (!window.Game.state.craftingState || typeof window.Game.state.craftingState !== 'object') {
            window.Game.state.craftingState = {
                resources: {},
                containers: {},
                knownRecipes: {},
                stationUnlocks: {},
                resourceNodesState: {},
                resourceNodeIslandState: {}
            };
        }

        return window.Game.state.craftingState;
    }

    function getKnownRecipeIds() {
        const craftingRuntime = getCraftingRuntime();
        const runtimeRecipeIds = craftingRuntime && typeof craftingRuntime.getUnlockedRecipeIds === 'function'
            ? craftingRuntime.getUnlockedRecipeIds()
            : [];
        const storedRecipeIds = Object.keys(getCraftingStateStore().knownRecipes || {});
        return listUnique([...runtimeRecipeIds, ...storedRecipeIds]);
    }

    function getUnlockedStationIds() {
        const craftingRuntime = getCraftingRuntime();
        const runtimeStationIds = craftingRuntime && typeof craftingRuntime.getUnlockedStationIds === 'function'
            ? craftingRuntime.getUnlockedStationIds()
            : [];
        const storedStationIds = Object.keys(getCraftingStateStore().stationUnlocks || {});
        return listUnique([...runtimeStationIds, ...storedStationIds]);
    }

    function getComponentCatalogItemIds() {
        const componentRegistry = getComponentRegistry();
        return componentRegistry && Array.isArray(componentRegistry.componentCatalogItems)
            ? componentRegistry.componentCatalogItems.map((item) => item.id).filter(Boolean)
            : [];
    }

    function getGeneratedCraftingOutputItemIds() {
        const componentRegistry = getComponentRegistry();
        return componentRegistry && Array.isArray(componentRegistry.generatedCraftingOutputCatalogItems)
            ? componentRegistry.generatedCraftingOutputCatalogItems.map((item) => item.id).filter(Boolean)
            : [];
    }

    function getActiveCraftGoalBias(islandIndex) {
        const knownRecipeIds = new Set(getKnownRecipeIds());
        const result = {
            goalKeys: [],
            preferredComponentItemIds: [],
            preferredStructureItemIds: [],
            preferredRecipeIds: [],
            preferredToolItemIds: [],
            preferredCategories: [],
            preferredRequirements: [],
            forceCraftBias: false
        };

        function addGoal(goalKey, entries = {}) {
            result.goalKeys.push(goalKey);
            result.forceCraftBias = true;
            result.preferredComponentItemIds.push(...(entries.preferredComponentItemIds || []));
            result.preferredStructureItemIds.push(...(entries.preferredStructureItemIds || []));
            result.preferredRecipeIds.push(...(entries.preferredRecipeIds || []));
            result.preferredToolItemIds.push(...(entries.preferredToolItemIds || []));
            result.preferredCategories.push(...(entries.preferredCategories || []));
            result.preferredRequirements.push(...(entries.preferredRequirements || []));
        }

        if (['portable-bridge', 'portable-bridge-assembly', 'bridge-repair-kit', 'reinforced-bridge-upgrade', 'field-bridge-upgrade', 'absolute-bridge-upgrade']
            .some((recipeId) => knownRecipeIds.has(recipeId))) {
            addGoal('bridge', {
                preferredComponentItemIds: ['wood_plank_basic', 'stone_block', 'gravel_fill', 'fiber_rope'],
                preferredStructureItemIds: ['bridge_kit', 'repair_kit_bridge', 'portableBridge', 'reinforcedBridge', 'fieldBridge', 'absoluteBridge'],
                preferredRecipeIds: ['portable-bridge-assembly', 'bridge-repair-kit', 'reinforced-bridge-upgrade', 'field-bridge-upgrade', 'absolute-bridge-upgrade'],
                preferredToolItemIds: ['smallPickaxe'],
                preferredCategories: ['utility', 'movement', 'tool'],
                preferredRequirements: [{ craftingTags: ['building', 'repair', 'route'] }]
            });
        }

        if (['boat-frame', 'boat', 'boat-repair-kit']
            .some((recipeId) => knownRecipeIds.has(recipeId))) {
            addGoal('boat', {
                preferredComponentItemIds: ['wood_plank_basic', 'fiber_rope', 'fish_oil', 'boatFrame'],
                preferredStructureItemIds: ['boat_ready', 'repair_kit_boat'],
                preferredRecipeIds: ['boat-frame', 'boat', 'boat-repair-kit', 'fog-lantern', 'merchant-beacon'],
                preferredToolItemIds: ['fishingRod'],
                preferredCategories: ['tool', 'utility', 'movement'],
                preferredRequirements: [{ craftingTags: ['water', 'route', 'repair'] }]
            });
        }

        if (['road-chalk', 'path-marker', 'safe-house-seal', 'merchant-beacon']
            .some((recipeId) => knownRecipeIds.has(recipeId))) {
            addGoal('route', {
                preferredRecipeIds: ['road-chalk', 'path-marker', 'safe-house-seal', 'merchant-beacon'],
                preferredCategories: ['info', 'utility', 'tool'],
                preferredRequirements: [{ craftingTags: ['route', 'survival', 'merchant'] }]
            });
        }

        if (['fog-lantern', 'merchant-beacon', 'absolute-bridge-upgrade']
            .some((recipeId) => knownRecipeIds.has(recipeId))) {
            addGoal('lateCraft', {
                preferredRecipeIds: ['fog-lantern', 'merchant-beacon', 'absolute-bridge-upgrade'],
                preferredStructureItemIds: ['absoluteBridge'],
                preferredCategories: ['artifact', 'legendary', 'utility'],
                preferredRequirements: [{ craftingTags: ['merchant', 'route', 'repair'] }]
            });
        }

        return {
            goalKeys: listUnique(result.goalKeys),
            preferredComponentItemIds: listUnique(result.preferredComponentItemIds),
            preferredStructureItemIds: listUnique(result.preferredStructureItemIds),
            preferredRecipeIds: listUnique(result.preferredRecipeIds),
            preferredToolItemIds: listUnique(result.preferredToolItemIds),
            preferredCategories: listUnique(result.preferredCategories),
            preferredRequirements: cloneValue(result.preferredRequirements),
            forceCraftBias: result.forceCraftBias
        };
    }

    function matchesChestTier(rewardDefinition, chestTier) {
        return Array.isArray(rewardDefinition && rewardDefinition.chestTiers)
            && rewardDefinition.chestTiers.includes(chestTier);
    }

    function getCatalogDefinitionCategories(definition) {
        return Array.isArray(definition && definition.categories) ? definition.categories : [];
    }

    function buildComponentBundleCandidatePool(islandIndex, chestTier, options = {}) {
        const componentRegistry = getComponentRegistry();
        const islandTier = getTierByIsland(islandIndex);
        const goalBias = getActiveCraftGoalBias(islandIndex);
        const knownRecipeIds = new Set(getKnownRecipeIds());
        const hasBridgeGoal = ['portable-bridge', 'portable-bridge-assembly', 'bridge-repair-kit', 'reinforced-bridge-upgrade', 'field-bridge-upgrade', 'absolute-bridge-upgrade']
            .some((recipeId) => knownRecipeIds.has(recipeId));
        const hasBoatGoal = ['boat-frame', 'boat', 'boat-repair-kit']
            .some((recipeId) => knownRecipeIds.has(recipeId));
        const excludedItemIds = new Set(Array.isArray(options.excludeItemIds) ? options.excludeItemIds : []);
        const modifierSnapshot = getModifierSnapshot(islandIndex);
        const chestLuck = Math.max(0, modifierSnapshot.chestLuck || 0);
        const allowFutureTiers = chestTier === 'elite' || chestTier === 'jackpot' || chestTier === 'final';
        const maxFutureDistance = chestTier === 'final' ? 2 : 1;

        if (!componentRegistry || typeof componentRegistry.getComponentDefinitions !== 'function') {
            return [];
        }

        return componentRegistry.getComponentDefinitions()
            .map((component) => {
                const itemId = component && component.inventoryItem ? component.inventoryItem.id : '';
                const definition = getItemDefinition(itemId);
                const categories = getCatalogDefinitionCategories(definition);
                const lootTier = Number.isFinite(definition && definition.lootTier) ? definition.lootTier : 0;
                const rawChestWeight = Number(component && component.inventoryItem && component.inventoryItem.extra
                    ? component.inventoryItem.extra.chestWeight
                    : 0);
                let weight = Number.isFinite(rawChestWeight) ? rawChestWeight : 0;

                if (!itemId || excludedItemIds.has(itemId) || !definition) {
                    return null;
                }

                if (weight <= 0) {
                    weight = 1.4;
                }

                weight *= getTierDistributionWeight(lootTier || 1, islandTier, {
                    allowFutureTiers,
                    maxFutureDistance
                });

                if (weight <= 0) {
                    return null;
                }

                if (goalBias.preferredComponentItemIds.includes(itemId)) {
                    weight *= 1.65;
                }

                if (hasBoatGoal && ['fish_oil', 'fiber_rope', 'wood_plank_basic', 'boatFrame'].includes(itemId)) {
                    weight *= 1.35;
                }

                if (hasBridgeGoal && ['wood_plank_basic', 'stone_block', 'gravel_fill', 'fiber_rope'].includes(itemId)) {
                    weight *= 1.28;
                }

                if (Array.isArray(component.tags) && component.tags.some((tag) => ['building', 'repair', 'route', 'water', 'merchant'].includes(tag))) {
                    weight *= chestTier === 'hidden' ? 1.25 : 1.12;
                }

                if (component.qualityLevel === 'rare' || component.qualityLevel === 'stable') {
                    weight *= chestTier === 'cursed' ? 1.35 : 1.12;
                }

                if (chestTier === 'ordinary' && categories.includes('value')) {
                    weight *= 0.86;
                }

                if ((chestTier === 'hidden' || chestTier === 'cursed') && categories.includes('food')) {
                    weight *= 0.35;
                }

                if (options.scenario === 'tradeIsland') {
                    if (Array.isArray(component.tags) && component.tags.some((tag) => ['merchant', 'route', 'bagQuest'].includes(tag))) {
                        weight *= chestTier === 'rich' ? 1.22 : 1.34;
                    }

                    if (categories.includes('value') || categories.includes('trade')) {
                        weight *= 1.18;
                    }
                }

                if (chestLuck > 0 && lootTier >= islandTier) {
                    weight *= 1 + chestLuck * 0.08;
                }

                return {
                    type: 'component_bundle_entry',
                    itemId,
                    componentId: component.id,
                    label: definition.label,
                    icon: definition.icon,
                    lootTier,
                    weight,
                    qualityLevel: component.qualityLevel,
                    tags: cloneValue(component.tags || [])
                };
            })
            .filter(Boolean);
    }

    function buildStructurePartRewardPool(islandIndex, chestTier, options = {}) {
        const goalBias = getActiveCraftGoalBias(islandIndex);
        const excludedKeys = new Set(Array.isArray(options.excludeKeys) ? options.excludeKeys : []);
        const islandTier = getTierByIsland(islandIndex);
        const allowFutureTiers = chestTier === 'elite' || chestTier === 'jackpot' || chestTier === 'final';
        const maxFutureDistance = chestTier === 'final' ? 2 : 1;

        return STRUCTURE_PART_REWARDS
            .map((entry) => {
                const definition = getItemDefinition(entry.itemId);
                const rewardKey = `structure_part:${entry.itemId}`;
                const lootTier = Number.isFinite(definition && definition.lootTier) ? definition.lootTier : 1;
                let weight = entry.weight;

                if (!definition || excludedKeys.has(rewardKey) || islandIndex < entry.minIsland || !matchesChestTier(entry, chestTier)) {
                    return null;
                }

                weight *= getTierDistributionWeight(lootTier, islandTier, {
                    allowFutureTiers,
                    maxFutureDistance
                });

                if (goalBias.preferredStructureItemIds.includes(entry.itemId)) {
                    weight *= 1.55;
                }

                if ((chestTier === 'jackpot' || chestTier === 'final') && entry.goalKeys.includes('legendary')) {
                    weight *= 1.45;
                }

                if (chestTier === 'cursed' && entry.goalKeys.includes('repair')) {
                    weight *= 1.2;
                }

                return {
                    rewardClass: 'structure_part',
                    rewardKey,
                    itemId: entry.itemId,
                    label: definition.label,
                    icon: definition.icon,
                    structureFamily: definition.bridgeFamily || definition.boatFamily || '',
                    weight
                };
            })
            .filter(Boolean);
    }

    function buildRecipeUnlockRewardPool(islandIndex, chestTier, options = {}) {
        const recipeRegistry = getRecipeRegistry();
        const knownRecipeIds = new Set(getKnownRecipeIds());
        const goalBias = getActiveCraftGoalBias(islandIndex);
        const excludedKeys = new Set(Array.isArray(options.excludeKeys) ? options.excludeKeys : []);
        const islandTier = getTierByIsland(islandIndex);
        const allowFutureTiers = chestTier === 'elite' || chestTier === 'jackpot' || chestTier === 'final';
        const maxFutureDistance = chestTier === 'final' ? 2 : 1;

        if (!recipeRegistry || typeof recipeRegistry.getRecipeDefinition !== 'function') {
            return [];
        }

        return RECIPE_UNLOCK_REWARDS
            .map((entry) => {
                const recipe = recipeRegistry.getRecipeDefinition(entry.recipeId);
                const rewardKey = `recipe_unlock:${entry.recipeId}`;
                let weight = entry.weight;

                if (!recipe || excludedKeys.has(rewardKey) || knownRecipeIds.has(entry.recipeId) || islandIndex < entry.minIsland || !matchesChestTier(entry, chestTier)) {
                    return null;
                }

                weight *= getTierDistributionWeight(recipe.tier || 1, islandTier, {
                    allowFutureTiers,
                    maxFutureDistance
                });

                if (goalBias.preferredRecipeIds.includes(entry.recipeId)) {
                    weight *= 1.65;
                }

                if (options.scenario === 'tradeIsland' && (entry.goalKeys.includes('scribe') || entry.goalKeys.includes('route') || entry.goalKeys.includes('trade'))) {
                    weight *= entry.goalKeys.includes('trade') ? 1.42 : 1.28;
                }

                if ((chestTier === 'jackpot' || chestTier === 'final') && entry.goalKeys.includes('lateCraft')) {
                    weight *= 1.3;
                }

                if (chestTier === 'cursed' && (entry.goalKeys.includes('bridge') || entry.goalKeys.includes('lateCraft'))) {
                    weight *= 1.18;
                }

                return {
                    rewardClass: 'recipe_unlock',
                    rewardKey,
                    recipeId: entry.recipeId,
                    label: recipe.label,
                    icon: SPECIAL_DROP_ICONS.recipe_unlock,
                    recipeTier: recipe.tier || 1,
                    weight
                };
            })
            .filter(Boolean);
    }

    function buildStationUnlockRewardPool(islandIndex, chestTier, options = {}) {
        const stationRuntime = getStationRuntime();
        const unlockedStationIds = new Set(getUnlockedStationIds());
        const excludedKeys = new Set(Array.isArray(options.excludeKeys) ? options.excludeKeys : []);
        const rewardDefinitions = [
            ...cloneValue(STATION_UNLOCK_REWARDS),
            ...(stationRuntime && typeof stationRuntime.getStationUnlockRewardDefinitions === 'function'
                ? stationRuntime.getStationUnlockRewardDefinitions()
                : [])
        ].filter((entry, index, list) => list.findIndex((candidate) => candidate.stationId === entry.stationId) === index);

        if (!stationRuntime || typeof stationRuntime.getStationDefinition !== 'function') {
            return [];
        }

        return rewardDefinitions
            .map((entry) => {
                const station = stationRuntime.getStationDefinition(entry.stationId);
                const rewardKey = `station_unlock:${entry.stationId}`;

                if (!station || excludedKeys.has(rewardKey) || unlockedStationIds.has(entry.stationId) || islandIndex < entry.minIsland || !matchesChestTier(entry, chestTier)) {
                    return null;
                }

                let weight = entry.weight;
                if (options.scenario === 'tradeIsland' && entry.stationId === 'scribe') {
                    weight *= 1.34;
                }

                return {
                    rewardClass: 'station_unlock',
                    rewardKey,
                    stationId: entry.stationId,
                    label: `Открыта станция: ${station.label}`,
                    stationLabel: station.label,
                    icon: SPECIAL_DROP_ICONS.station_unlock,
                    weight
                };
            })
            .filter(Boolean);
    }

    function buildResourceToolRewardPool(islandIndex, chestTier, options = {}) {
        const goalBias = getActiveCraftGoalBias(islandIndex);
        const excludedKeys = new Set(Array.isArray(options.excludeKeys) ? options.excludeKeys : []);
        const islandTier = getTierByIsland(islandIndex);
        const allowFutureTiers = chestTier === 'elite' || chestTier === 'jackpot' || chestTier === 'final';
        const maxFutureDistance = chestTier === 'final' ? 2 : 1;

        return RESOURCE_TOOL_REWARDS
            .map((entry) => {
                const definition = getItemDefinition(entry.itemId);
                const rewardKey = `resource_tool:${entry.itemId}`;
                const lootTier = Number.isFinite(definition && definition.lootTier) ? definition.lootTier : 1;
                let weight = entry.weight;

                if (!definition || excludedKeys.has(rewardKey) || islandIndex < entry.minIsland || !matchesChestTier(entry, chestTier)) {
                    return null;
                }

                weight *= getTierDistributionWeight(lootTier, islandTier, {
                    allowFutureTiers,
                    maxFutureDistance
                });

                if (goalBias.preferredToolItemIds.includes(entry.itemId)) {
                    weight *= 1.8;
                }

                return {
                    rewardClass: 'resource_tool',
                    rewardKey,
                    itemId: entry.itemId,
                    label: definition.label,
                    icon: definition.icon,
                    weight
                };
            })
            .filter(Boolean);
    }

    function getGeneralChestExcludedItemIds() {
        return listUnique([
            ...getComponentCatalogItemIds(),
            ...getGeneratedCraftingOutputItemIds(),
            ...RESOURCE_TOOL_REWARDS.map((entry) => entry.itemId)
        ]);
    }

    function getChestRollOptions(chestTier, archetype, islandIndex, options = {}) {
        const modifierSnapshot = getModifierSnapshot(islandIndex);
        const bagUpgradeRuntime = window.Game.systems.bagUpgradeRuntime || null;
        const activeQuestBias = bagUpgradeRuntime && typeof bagUpgradeRuntime.getActiveBagQuestGenerationBias === 'function'
            ? bagUpgradeRuntime.getActiveBagQuestGenerationBias(islandIndex)
            : null;
        const activeCraftGoalBias = getActiveCraftGoalBias(islandIndex);
        const chestLuck = Math.max(0, modifierSnapshot.chestLuck || 0);
        const preferredCategories = [];
        const allowFutureTiers = chestTier === 'elite' || chestTier === 'jackpot' || chestTier === 'final';
        let maxFutureDistance = chestTier === 'final' ? 2 : 1;
        let valueBias = 1;
        let riskBias = 1;
        const forbiddenCategories = ['resource'];

        if (chestTier === 'rich') {
            preferredCategories.push('value', 'survival', 'consumable');
            valueBias = 1.1;
        } else if (chestTier === 'hidden') {
            preferredCategories.push('utility', 'info', 'tool');
            forbiddenCategories.push('food');
        } else if (chestTier === 'cursed') {
            preferredCategories.push('risk', 'artifact');
            forbiddenCategories.push('food');
            riskBias = 1.4;
        } else if (chestTier === 'elite') {
            preferredCategories.push('artifact', 'movement', 'utility');
            valueBias = 1.15;
        } else if (chestTier === 'jackpot') {
            preferredCategories.push('legendary', 'value', 'artifact', 'utility');
            valueBias = 1.3;
            maxFutureDistance = 2;
        } else if (chestTier === 'final') {
            preferredCategories.push('legendary', 'artifact', 'movement', 'utility');
            valueBias = 1.35;
            maxFutureDistance = 2;
        }

        if (archetype === 'golden') {
            preferredCategories.push('value');
            valueBias *= 1.1;
        }

        if (options.scenario === 'jackpotIsland') {
            preferredCategories.push('value', 'utility');
            valueBias *= 1.1;
        }

        if (options.scenario === 'tradeIsland') {
            preferredCategories.push('value', 'utility', 'info', 'trade');
            preferredCategories.push(islandIndex >= 19 ? 'trade' : 'route');
        }

        if (options.scenario === 'depletedIsland') {
            preferredCategories.push('survival', 'utility');
            forbiddenCategories.push('food');
            valueBias *= 0.92;
        }

        if (options.scenario === 'trapIsland') {
            preferredCategories.push('risk');
            riskBias *= 1.15;
        }

        if (activeQuestBias && Array.isArray(activeQuestBias.preferredCategories)) {
            activeQuestBias.preferredCategories.forEach((category) => {
                preferredCategories.push(category);
            });
        }

        if (Array.isArray(activeCraftGoalBias.preferredCategories)) {
            activeCraftGoalBias.preferredCategories.forEach((category) => {
                preferredCategories.push(category);
            });
        }

        return {
            preferredCategories: preferredCategories.filter((category, index, list) => category && list.indexOf(category) === index),
            preferredItemIds: cloneValue(activeCraftGoalBias.preferredToolItemIds || []),
            preferredRequirements: [
                ...(activeQuestBias && Array.isArray(activeQuestBias.preferredRequirements)
                    ? activeQuestBias.preferredRequirements
                    : []),
                ...(options.scenario === 'tradeIsland'
                    ? [
                        { sourceRecipeTags: ['economy', 'trade'] },
                        { sourceRecipeTags: ['route', 'info'] },
                        { craftingTags: ['merchant', 'route'] }
                    ]
                    : []),
                ...(options.scenario === 'depletedIsland'
                    ? [{ craftingTags: ['survival', 'water'] }]
                    : []),
                ...(Array.isArray(activeCraftGoalBias.preferredRequirements)
                    ? activeCraftGoalBias.preferredRequirements
                    : [])
            ],
            forbiddenCategories: forbiddenCategories.filter((category, index, list) => list.indexOf(category) === index),
            allowFutureTiers,
            maxFutureDistance,
            chestLuck,
            valueBias,
            riskBias,
            minTier: activeQuestBias && Number.isFinite(activeQuestBias.minTier)
                ? Math.min(activeQuestBias.minTier, Math.max(1, Math.floor((Math.max(1, islandIndex) - 1) / 5) + 1))
                : undefined
        };
    }

    function createGeneralChestItemDrop(islandIndex, chestTier, archetype, random, options = {}) {
        const itemRegistry = getItemRegistry();
        const excludedItemIds = new Set([
            ...getGeneralChestExcludedItemIds(),
            ...(Array.isArray(options.excludeItemIds) ? options.excludeItemIds : [])
        ]);

        if (!itemRegistry || typeof itemRegistry.pickWeightedCatalogDefinition !== 'function') {
            return null;
        }

        const rollOptions = getChestRollOptions(chestTier, archetype, islandIndex, options);
        const definition = itemRegistry.pickWeightedCatalogDefinition('chestWeight', islandIndex, random, {
            preferredCategories: rollOptions.preferredCategories,
            preferredItemIds: rollOptions.preferredItemIds,
            preferredRequirements: rollOptions.preferredRequirements,
            forbiddenCategories: rollOptions.forbiddenCategories,
            allowFutureTiers: rollOptions.allowFutureTiers,
            maxFutureDistance: rollOptions.maxFutureDistance,
            chestLuck: rollOptions.chestLuck,
            valueBias: rollOptions.valueBias,
            riskBias: rollOptions.riskBias,
            minTier: rollOptions.minTier,
            excludeItemIds: [...excludedItemIds]
        });

        return createItemDropFromDefinition(definition);
    }

    function createComponentBundleDrop(islandIndex, chestTier, random, options = {}) {
        const excludedItemIds = new Set(Array.isArray(options.excludeItemIds) ? options.excludeItemIds : []);
        const candidates = buildComponentBundleCandidatePool(islandIndex, chestTier, {
            excludeItemIds: [...excludedItemIds]
        });

        if (candidates.length === 0) {
            return null;
        }

        const entryCount = chestTier === 'elite' || chestTier === 'jackpot' || chestTier === 'final'
            ? 2
            : ((chestTier === 'hidden' || chestTier === 'cursed') && random() < 0.48 ? 2 : 1);
        const selectedEntries = [];
        const selectedItemIds = new Set();

        while (selectedEntries.length < entryCount) {
            const availableEntries = candidates.filter((entry) => !selectedItemIds.has(entry.itemId));
            const chosen = pickWeightedEntry(availableEntries, random);

            if (!chosen) {
                break;
            }

            selectedItemIds.add(chosen.itemId);
            selectedEntries.push({
                itemId: chosen.itemId,
                componentId: chosen.componentId,
                label: chosen.label,
                icon: chosen.icon,
                quantity: 1,
                qualityLevel: chosen.qualityLevel,
                tags: cloneValue(chosen.tags || [])
            });
        }

        if (selectedEntries.length === 0) {
            return null;
        }

        return {
            type: 'component_bundle',
            label: selectedEntries.length > 1 ? 'Набор заготовок' : `Заготовка: ${selectedEntries[0].label}`,
            icon: SPECIAL_DROP_ICONS.component_bundle,
            entries: selectedEntries
        };
    }

    function createStructurePartDrop(islandIndex, chestTier, random, options = {}) {
        const pool = buildStructurePartRewardPool(islandIndex, chestTier, options);
        const chosen = pickWeightedEntry(pool, random);

        return chosen
            ? {
                type: 'structure_part',
                itemId: chosen.itemId,
                label: chosen.label,
                icon: chosen.icon,
                quantity: 1,
                structureFamily: chosen.structureFamily
            }
            : null;
    }

    function createRecipeUnlockDrop(islandIndex, chestTier, random, options = {}) {
        const pool = buildRecipeUnlockRewardPool(islandIndex, chestTier, options);
        const chosen = pickWeightedEntry(pool, random);

        return chosen
            ? {
                type: 'recipe_unlock',
                recipeId: chosen.recipeId,
                label: chosen.label,
                icon: chosen.icon
            }
            : null;
    }

    function createStationUnlockDrop(islandIndex, chestTier, random, options = {}) {
        const pool = buildStationUnlockRewardPool(islandIndex, chestTier, options);
        const chosen = pickWeightedEntry(pool, random);

        return chosen
            ? {
                type: 'station_unlock',
                stationId: chosen.stationId,
                stationLabel: chosen.stationLabel,
                label: chosen.label,
                icon: chosen.icon
            }
            : null;
    }

    function createResourceToolDrop(islandIndex, chestTier, random, options = {}) {
        const pool = buildResourceToolRewardPool(islandIndex, chestTier, options);
        const chosen = pickWeightedEntry(pool, random);

        return chosen
            ? {
                type: 'resource_tool',
                itemId: chosen.itemId,
                label: chosen.label,
                icon: chosen.icon,
                quantity: 1
            }
            : null;
    }

    function buildChestRewardClassPool(islandIndex, chestTier, archetype, options = {}) {
        const goalBias = getActiveCraftGoalBias(islandIndex);
        const excludedKeys = new Set(Array.isArray(options.excludeKeys) ? options.excludeKeys : []);
        const baseWeights = CHEST_REWARD_CLASS_WEIGHTS[chestTier] || CHEST_REWARD_CLASS_WEIGHTS.ordinary;
        const pool = [];
        const availability = {
            item: Boolean(createGeneralChestItemDrop(islandIndex, chestTier, archetype, () => 0.5, {
                ...options,
                excludeItemIds: (options.excludeItemIds || []).slice()
            })),
            component_bundle: buildComponentBundleCandidatePool(islandIndex, chestTier, {
                ...options,
                excludeItemIds: options.excludeItemIds || []
            }).length > 0,
            structure_part: buildStructurePartRewardPool(islandIndex, chestTier, { ...options, excludeKeys: [...excludedKeys] }).length > 0,
            recipe_unlock: buildRecipeUnlockRewardPool(islandIndex, chestTier, { ...options, excludeKeys: [...excludedKeys] }).length > 0,
            station_unlock: buildStationUnlockRewardPool(islandIndex, chestTier, { ...options, excludeKeys: [...excludedKeys] }).length > 0,
            resource_tool: buildResourceToolRewardPool(islandIndex, chestTier, { excludeKeys: [...excludedKeys] }).length > 0
        };

        Object.entries(baseWeights).forEach(([rewardClass, baseWeight]) => {
            let weight = baseWeight;

            if (weight <= 0 || !availability[rewardClass]) {
                return;
            }

            if (goalBias.forceCraftBias && rewardClass !== 'item') {
                weight *= 1.08;
            }

            if ((chestTier === 'hidden' || chestTier === 'cursed') && rewardClass === 'item') {
                weight *= 0.8;
            }

            if (options.scenario === 'depletedIsland') {
                if (rewardClass === 'item') {
                    weight *= 0.42;
                } else if (rewardClass === 'component_bundle') {
                    weight *= 1.45;
                } else if (rewardClass === 'resource_tool') {
                    weight *= 1.22;
                } else if (rewardClass === 'recipe_unlock') {
                    weight *= 1.14;
                }
            }

            if (options.scenario === 'tradeIsland') {
                if (rewardClass === 'item') {
                    weight *= 0.72;
                } else if (rewardClass === 'component_bundle') {
                    weight *= 1.32;
                } else if (rewardClass === 'recipe_unlock') {
                    weight *= 1.38;
                } else if (rewardClass === 'station_unlock') {
                    weight *= 1.24;
                }
            }

            if ((chestTier === 'jackpot' || chestTier === 'final') && (rewardClass === 'recipe_unlock' || rewardClass === 'structure_part')) {
                weight *= 1.18;
            }

            pool.push({
                rewardClass,
                weight
            });
        });

        return pool;
    }

    function createChestRewardDropByClass(rewardClass, islandIndex, chestTier, random, options = {}) {
        if (rewardClass === 'component_bundle') {
            return createComponentBundleDrop(islandIndex, chestTier, random, options);
        }

        if (rewardClass === 'structure_part') {
            return createStructurePartDrop(islandIndex, chestTier, random, options);
        }

        if (rewardClass === 'recipe_unlock') {
            return createRecipeUnlockDrop(islandIndex, chestTier, random, options);
        }

        if (rewardClass === 'station_unlock') {
            return createStationUnlockDrop(islandIndex, chestTier, random, options);
        }

        if (rewardClass === 'resource_tool') {
            return createResourceToolDrop(islandIndex, chestTier, random, options);
        }

        return createGeneralChestItemDrop(islandIndex, chestTier, options.archetype || 'ordinary', random, options);
    }

    function getBaseChestRollCount(islandIndex, chestTier, options = {}) {
        const config = chestTierConfig[chestTier] || chestTierConfig.ordinary;
        let rollCount = islandIndex <= 4 ? 1 : 2;

        if (islandIndex >= 8) {
            rollCount += 1;
        }

        if (islandIndex >= 16) {
            rollCount += 1;
        }

        rollCount += config.extraRolls || 0;

        if (options.remote) {
            rollCount += 1;
        }

        if (options.vault) {
            rollCount += 1;
        }

        return rollCount;
    }

    function buildForceCraftRewardDrop(islandIndex, chestTier, archetype, random, options = {}) {
        const preferredClassOrder = chestTier === 'jackpot' || chestTier === 'final'
            ? ['recipe_unlock', 'structure_part', 'component_bundle', 'resource_tool']
            : ['component_bundle', 'recipe_unlock', 'structure_part', 'resource_tool'];

        for (const rewardClass of preferredClassOrder) {
            const drop = createChestRewardDropByClass(rewardClass, islandIndex, chestTier, random, {
                ...options,
                archetype
            });
            if (drop) {
                return drop;
            }
        }

        return null;
    }

    function collectExcludedItemIds(usedDrops = []) {
        return usedDrops.reduce((result, drop) => {
            if (!drop) {
                return result;
            }

            if ((drop.type === 'item' || drop.type === 'resource_tool' || drop.type === 'structure_part') && drop.itemId) {
                result.push(drop.itemId);
            } else if (drop.type === 'component_bundle' && Array.isArray(drop.entries)) {
                drop.entries.forEach((entry) => {
                    if (entry && entry.itemId) {
                        result.push(entry.itemId);
                    }
                });
            }

            return result;
        }, []);
    }

    function buildChestRewardPlan(islandIndex, chestTier, archetype, random, options = {}) {
        const config = chestTierConfig[chestTier] || chestTierConfig.ordinary;
        const modifierSnapshot = getModifierSnapshot(islandIndex);
        const drops = [];
        const usedKeys = new Set();
        const itemRollCount = getBaseChestRollCount(islandIndex, chestTier, options) + Math.floor((modifierSnapshot.chestLuck || 0) / 2);
        const goldMultiplier = (config.goldMultiplier || 1)
            + (archetype === 'golden' ? 0.25 : 0)
            + (options.vault ? 0.3 : 0)
            + (options.scenario === 'jackpotIsland' ? 0.22 : 0);

        for (let index = 0; index < itemRollCount; index++) {
            const classPool = buildChestRewardClassPool(islandIndex, chestTier, archetype, {
                ...options,
                excludeKeys: [...usedKeys],
                excludeItemIds: collectExcludedItemIds(drops)
            });
            const chosenClass = pickWeightedEntry(classPool, random);

            if (!chosenClass) {
                continue;
            }

            const drop = createChestRewardDropByClass(chosenClass.rewardClass, islandIndex, chestTier, random, {
                ...options,
                archetype,
                excludeKeys: [...usedKeys],
                excludeItemIds: collectExcludedItemIds(drops)
            });

            if (!drop) {
                continue;
            }

            const rewardKey = buildRewardKey(drop);
            if (rewardKey) {
                usedKeys.add(rewardKey);
            }

            drops.push(drop);
        }

        const hasCraftReward = drops.some((drop) => drop && drop.type !== 'item' && drop.type !== 'gold');
        const hasLateCraftReward = drops.some((drop) => drop && (drop.type === 'recipe_unlock' || drop.type === 'structure_part'));
        if ((chestTier === 'hidden' || chestTier === 'cursed') && !hasCraftReward) {
            const forcedDrop = buildForceCraftRewardDrop(islandIndex, chestTier, archetype, random, {
                ...options,
                excludeKeys: [...usedKeys],
                excludeItemIds: collectExcludedItemIds(drops)
            });
            if (forcedDrop) {
                const rewardKey = buildRewardKey(forcedDrop);
                if (rewardKey) {
                    usedKeys.add(rewardKey);
                }
                drops.push(forcedDrop);
            }
        }

        if ((chestTier === 'jackpot' || chestTier === 'final') && !hasLateCraftReward) {
            const forcedLateDrop = createChestRewardDropByClass(random() < 0.56 ? 'recipe_unlock' : 'structure_part', islandIndex, chestTier, random, {
                ...options,
                archetype,
                excludeKeys: [...usedKeys],
                excludeItemIds: collectExcludedItemIds(drops)
            }) || buildForceCraftRewardDrop(islandIndex, chestTier, archetype, random, {
                ...options,
                excludeKeys: [...usedKeys],
                excludeItemIds: collectExcludedItemIds(drops)
            });

            if (forcedLateDrop) {
                const rewardKey = buildRewardKey(forcedLateDrop);
                if (rewardKey) {
                    usedKeys.add(rewardKey);
                }
                drops.push(forcedLateDrop);
            }
        }

        const baseGoldMin = 8 + Math.max(0, islandIndex - 1) * 2;
        const baseGoldMax = baseGoldMin + 8 + Math.max(0, islandIndex - 1);
        drops.push(createGoldDrop('Найденное золото', random, islandIndex, goldMultiplier, baseGoldMin, baseGoldMax));

        if (chestTier === 'rich' || chestTier === 'elite' || chestTier === 'jackpot' || chestTier === 'final') {
            drops.push(createGoldDrop('Кошель с золотом', random, islandIndex, goldMultiplier + 0.15, baseGoldMin + 6, baseGoldMax + 8));
        }

        if (chestTier === 'jackpot' || chestTier === 'final') {
            drops.push(createGoldDrop('Запечатанный кошель', random, islandIndex, goldMultiplier + 0.25, baseGoldMin + 12, baseGoldMax + 18));
        }

        return {
            islandIndex,
            chestTier,
            outcomeType: 'reward',
            flavorText: '',
            drops: mergeDrops(drops),
            statDelta: {}
        };
    }

    function buildEmptyChestPlan(islandIndex, chestTier, random, options = {}) {
        const result = pickWeightedEntry(emptyChestTable, random) || emptyChestTable[0];
        const drops = [];
        const scenario = typeof options.scenario === 'string' ? options.scenario : '';

        if (result.key === 'scraps') {
            const fallbackDefinition = scenario === 'depletedIsland'
                ? getItemDefinition(random() < 0.55 ? 'fuel_bundle' : 'flask_empty')
                : getItemDefinition(islandIndex >= 4 ? 'breadRation' : 'driedSnack');
            drops.push(createItemDropFromDefinition(fallbackDefinition));
        } else if (result.key === 'coins') {
            drops.push(createGoldDrop('Пара забытых монет', random, islandIndex, 1, 2, 6));
        }

        return {
            islandIndex,
            chestTier,
            outcomeType: 'empty',
            flavorText: result.flavorText,
            drops: mergeDrops(drops),
            statDelta: {}
        };
    }

    function buildRiskyChestPlan(islandIndex, chestTier, random, options = {}) {
        const result = pickWeightedEntry(riskyChestTable, random) || riskyChestTable[0];
        const severity = 1 + Math.max(0, islandIndex - 1) * 0.05 + (chestTier === 'cursed' ? 0.22 : 0) + (options.scenario === 'trapIsland' ? 0.18 : 0);
        const statDelta = Object.entries(result.statDelta || {}).reduce((next, [key, value]) => {
            next[key] = -Math.max(1, Math.round(value * severity));
            return next;
        }, {});
        const drops = [];

        if (chestTier === 'elite' || chestTier === 'jackpot') {
            drops.push(createGoldDrop('Уцелевший кошель', random, islandIndex, 1, 8, 16));
        } else if (random() < 0.2) {
            const shortcutDrop = createChestRewardDropByClass(random() < 0.5 ? 'component_bundle' : 'structure_part', islandIndex, chestTier, random, {
                excludeItemIds: collectExcludedItemIds(drops),
                excludeKeys: []
            });
            if (shortcutDrop) {
                drops.push(shortcutDrop);
            }
        } else if (random() < 0.35) {
            if (options.scenario === 'depletedIsland') {
                const fallbackDefinition = getItemDefinition(random() < 0.5 ? 'fuel_bundle' : 'flask_empty');
                if (fallbackDefinition) {
                    drops.push(createItemDropFromDefinition(fallbackDefinition));
                }
            } else {
                const definition = getItemDefinition(islandIndex >= 4 ? 'breadRation' : 'driedSnack');
                if (definition) {
                    drops.push(createItemDropFromDefinition(definition));
                }
            }
        }

        return {
            islandIndex,
            chestTier,
            outcomeType: 'risky',
            flavorText: result.flavorText,
            drops: mergeDrops(drops),
            statDelta
        };
    }

    function chooseChestOutcomeType(chestTier, islandIndex, random, options = {}) {
        const config = chestTierConfig[chestTier] || chestTierConfig.ordinary;
        const modifierSnapshot = getModifierSnapshot(islandIndex);

        if (chestTier === 'final') {
            return 'reward';
        }

        let emptyChance = config.emptyChance || 0;
        let riskyChance = config.riskyChance || 0;

        if (options.scenario === 'trapIsland') {
            riskyChance += 0.08;
            emptyChance += chestTier === 'hidden' ? 0.05 : 0;
        }

        if (options.scenario === 'jackpotIsland') {
            emptyChance = Math.max(0, emptyChance - 0.03);
            riskyChance = Math.max(0, riskyChance - 0.02);
        }

        if (options.vault) {
            emptyChance = Math.max(0, emptyChance - 0.02);
        }

        emptyChance = Math.max(0, emptyChance - (modifierSnapshot.chestLuck || 0) * 0.02);
        riskyChance = Math.max(0, riskyChance - (modifierSnapshot.chestLuck || 0) * 0.012);

        const roll = random();

        if (roll < emptyChance) {
            return 'empty';
        }

        if (roll < emptyChance + riskyChance) {
            return 'risky';
        }

        return 'reward';
    }

    function createChestLootPlan(islandIndex, chestTier, archetype, random, options = {}) {
        const outcomeType = chooseChestOutcomeType(chestTier, islandIndex, random, options);

        if (outcomeType === 'empty') {
            return buildEmptyChestPlan(islandIndex, chestTier, random, options);
        }

        if (outcomeType === 'risky') {
            return buildRiskyChestPlan(islandIndex, chestTier, random, options);
        }

        return buildChestRewardPlan(islandIndex, chestTier, archetype, random, options);
    }

    function createHouseOutcomePlan(islandIndex, encounterKind, random, options = {}) {
        if (encounterKind === 'emptyHouse') {
            return {
                islandIndex,
                encounterKind,
                outcomeType: 'emptyHouse',
                flavorText: 'Внутри только пыль, пустые ящики и следы старого разграбления.',
                drops: random() < 0.16
                    ? mergeDrops([createItemDropFromDefinition(getItemDefinition(islandIndex >= 4 ? 'breadRation' : 'driedSnack'))])
                    : [],
                statDelta: {}
            };
        }

        const severity = Math.max(6, Math.round(options.severity || (8 + islandIndex * 1.4)));
        const trapProfile = random() < 0.5
            ? { hunger: -Math.round(severity * 0.65), energy: -severity, focus: -Math.round(severity * 0.55) }
            : { cold: -Math.round(severity * 0.75), sleep: -Math.round(severity * 0.7), energy: -Math.round(severity * 0.55) };

        return {
            islandIndex,
            encounterKind,
            outcomeType: 'trapHouse',
            flavorText: 'Старый механизм внутри дома сработал как ловушка.',
            drops: random() < 0.22
                ? mergeDrops([createGoldDrop('Случайно уцелевшие монеты', random, islandIndex, 1, 4, 10)])
                : [],
            statDelta: trapProfile
        };
    }

    function describeBundleEntries(entries = []) {
        return (Array.isArray(entries) ? entries : [])
            .map((entry) => {
                if (!entry) {
                    return '';
                }

                const quantity = Number.isFinite(entry.quantity) && entry.quantity > 1
                    ? ` x${entry.quantity}`
                    : '';
                return `${entry.label}${quantity}`;
            })
            .filter(Boolean)
            .join(', ');
    }

    function describeDrop(drop) {
        if (!drop) {
            return '';
        }

        if (drop.type === 'gold') {
            return `${drop.label} (+${drop.amount} золота)`;
        }

        if (drop.type === 'recipe_unlock') {
            return `Чертёж: ${drop.label}`;
        }

        if (drop.type === 'station_unlock') {
            return drop.label;
        }

        if (drop.type === 'component_bundle') {
            const bundleSummary = describeBundleEntries(drop.entries);
            return bundleSummary ? `${drop.label}: ${bundleSummary}` : drop.label;
        }

        if (drop.type === 'resource_tool') {
            return `Инструмент: ${drop.label}`;
        }

        if (drop.type === 'structure_part') {
            return `Структурная деталь: ${drop.label}`;
        }

        return drop.quantity > 1
            ? `${drop.label} x${drop.quantity}`
            : drop.label;
    }

    function describeLootPlan(lootPlan) {
        if (!lootPlan) {
            return '';
        }

        const parts = [];

        if (lootPlan.flavorText) {
            parts.push(lootPlan.flavorText);
        }

        if (Array.isArray(lootPlan.drops) && lootPlan.drops.length > 0) {
            parts.push(lootPlan.drops.map(describeDrop).join(', '));
        }

        return parts.join(' ');
    }

    function applyCraftUnlockDrop(drop, options = {}) {
        if (!drop || (drop.type !== 'recipe_unlock' && drop.type !== 'station_unlock')) {
            return { handled: false };
        }

        const craftingRuntime = options.craftingRuntime || getCraftingRuntime();
        const stationRuntime = options.stationRuntime || getStationRuntime();
        const islandIndex = Number.isFinite(options.islandIndex) ? options.islandIndex : (options.islandIndex || 1);

        if (drop.type === 'recipe_unlock') {
            if (!craftingRuntime || typeof craftingRuntime.unlockRecipe !== 'function') {
                return { handled: true, success: false, unlockType: 'recipe' };
            }

            const unlockResult = craftingRuntime.unlockRecipe(drop.recipeId, { islandIndex });

            if (unlockResult && unlockResult.success) {
                const displayDrop = {
                    ...drop,
                    label: `Чертёж: ${drop.label}`,
                    icon: drop.icon || SPECIAL_DROP_ICONS.recipe_unlock || 'RC'
                };
                return {
                    handled: true,
                    success: true,
                    unlockType: 'recipe',
                    displayDrop
                };
            }

            return { handled: true, success: false, unlockType: 'recipe' };
        }

        if (!craftingRuntime || typeof craftingRuntime.unlockStation !== 'function') {
            return { handled: true, success: false, unlockType: 'station' };
        }

        const unlockResult = craftingRuntime.unlockStation(drop.stationId, { islandIndex });

        if (unlockResult && unlockResult.success) {
            const stationLabel = stationRuntime && typeof stationRuntime.getStationLabel === 'function'
                ? stationRuntime.getStationLabel(drop.stationId, drop.stationLabel || drop.stationId)
                : (drop.stationLabel || drop.stationId);
            const displayDrop = {
                ...drop,
                label: `Открыта станция: ${stationLabel}`,
                icon: drop.icon || SPECIAL_DROP_ICONS.station_unlock || 'ST'
            };
            return {
                handled: true,
                success: true,
                unlockType: 'station',
                displayDrop
            };
        }

        return { handled: true, success: false, unlockType: 'station' };
    }

    function createMerchantStock(islandIndex, random, options = {}) {
        const shopRuntime = getShopRuntime();

        if (shopRuntime && typeof shopRuntime.createMerchantStock === 'function') {
            return shopRuntime.createMerchantStock(islandIndex, random, options);
        }

        return [];
    }

    function createMerchantQuest(islandIndex, random, options = {}) {
        const shopRuntime = getShopRuntime();

        if (shopRuntime && typeof shopRuntime.createMerchantQuest === 'function') {
            return shopRuntime.createMerchantQuest(islandIndex, random, options);
        }

        return null;
    }

    Object.assign(loot, {
        SPECIAL_DROP_ICONS,
        getItemDefinition,
        createInventoryItem,
        describeItem,
        getConsumableEffect,
        isItemStackable,
        getItemBaseValue,
        getMerchantBuyPrice,
        getMerchantSellPrice,
        getChestRollOptions,
        getActiveCraftGoalBias,
        buildChestRewardClassPool,
        buildComponentBundleCandidatePool,
        buildStructurePartRewardPool,
        buildRecipeUnlockRewardPool,
        buildStationUnlockRewardPool,
        buildResourceToolRewardPool,
        createChestRewardDropByClass,
        createChestLootPlan,
        createHouseOutcomePlan,
        createMerchantStock,
        createMerchantQuest,
        applyCraftUnlockDrop,
        describeLootPlan,
        describeDrop,
        merchantStockPool: getShopRuntime() && getShopRuntime().merchantStockPool ? getShopRuntime().merchantStockPool : [],
        merchantQuestPool: getShopRuntime() && getShopRuntime().merchantQuestPool ? getShopRuntime().merchantQuestPool : []
    });
})();
