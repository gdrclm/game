(() => {
    const loot = window.Game.systems.loot = window.Game.systems.loot || {};

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

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
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

    function createItemDropFromDefinition(definition) {
        if (!definition) {
            return null;
        }

        return {
            type: 'item',
            itemId: definition.id,
            label: definition.label,
            icon: definition.icon,
            quantity: 1
        };
    }

    function mergeDrops(drops) {
        const result = [];
        const itemMap = new Map();

        drops.forEach((drop) => {
            if (!drop) {
                return;
            }

            if (drop.type === 'item') {
                if (!itemMap.has(drop.itemId)) {
                    const itemDrop = { ...drop };
                    itemMap.set(drop.itemId, itemDrop);
                    result.push(itemDrop);
                    return;
                }

                itemMap.get(drop.itemId).quantity += drop.quantity || 1;
                return;
            }

            result.push({ ...drop });
        });

        return result;
    }

    function getChestRollOptions(chestTier, archetype, islandIndex, options = {}) {
        const modifierSnapshot = getModifierSnapshot(islandIndex);
        const bagUpgradeRuntime = window.Game.systems.bagUpgradeRuntime || null;
        const activeQuestBias = bagUpgradeRuntime && typeof bagUpgradeRuntime.getActiveBagQuestGenerationBias === 'function'
            ? bagUpgradeRuntime.getActiveBagQuestGenerationBias(islandIndex)
            : null;
        const chestLuck = Math.max(0, modifierSnapshot.chestLuck || 0);
        const preferredCategories = [];
        const allowFutureTiers = chestTier === 'elite' || chestTier === 'jackpot' || chestTier === 'final';
        let maxFutureDistance = chestTier === 'final' ? 2 : 1;
        let valueBias = 1;
        let riskBias = 1;

        if (chestTier === 'rich') {
            preferredCategories.push('value', 'survival', 'consumable');
            valueBias = 1.1;
        } else if (chestTier === 'hidden') {
            preferredCategories.push('utility', 'info', 'tool');
        } else if (chestTier === 'cursed') {
            preferredCategories.push('risk', 'artifact');
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

        if (options.scenario === 'trapIsland') {
            preferredCategories.push('risk');
            riskBias *= 1.15;
        }

        if (activeQuestBias && Array.isArray(activeQuestBias.preferredCategories)) {
            activeQuestBias.preferredCategories.forEach((category) => {
                preferredCategories.push(category);
            });
        }

        return {
            preferredCategories: preferredCategories.filter((category, index, list) => category && list.indexOf(category) === index),
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

    function pickChestItemDefinition(islandIndex, chestTier, archetype, random, usedIds, options = {}) {
        const itemRegistry = getItemRegistry();

        if (!itemRegistry || typeof itemRegistry.pickWeightedCatalogDefinition !== 'function') {
            return null;
        }

        const rollOptions = getChestRollOptions(chestTier, archetype, islandIndex, options);
        return itemRegistry.pickWeightedCatalogDefinition('chestWeight', islandIndex, random, {
            preferredCategories: rollOptions.preferredCategories,
            allowFutureTiers: rollOptions.allowFutureTiers,
            maxFutureDistance: rollOptions.maxFutureDistance,
            chestLuck: rollOptions.chestLuck,
            valueBias: rollOptions.valueBias,
            riskBias: rollOptions.riskBias,
            minTier: rollOptions.minTier,
            excludeItemIds: Array.from(usedIds || [])
        });
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

    function buildChestRewardPlan(islandIndex, chestTier, archetype, random, options = {}) {
        const config = chestTierConfig[chestTier] || chestTierConfig.ordinary;
        const modifierSnapshot = getModifierSnapshot(islandIndex);
        const usedIds = new Set();
        const drops = [];
        const itemRollCount = getBaseChestRollCount(islandIndex, chestTier, options) + Math.floor((modifierSnapshot.chestLuck || 0) / 2);
        const goldMultiplier = (config.goldMultiplier || 1)
            + (archetype === 'golden' ? 0.25 : 0)
            + (options.vault ? 0.3 : 0)
            + (options.scenario === 'jackpotIsland' ? 0.22 : 0);

        for (let index = 0; index < itemRollCount; index++) {
            const definition = pickChestItemDefinition(islandIndex, chestTier, archetype, random, usedIds, options);

            if (!definition) {
                continue;
            }

            usedIds.add(definition.id);
            drops.push(createItemDropFromDefinition(definition));
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

    function buildEmptyChestPlan(islandIndex, chestTier, random) {
        const result = pickWeightedEntry(emptyChestTable, random) || emptyChestTable[0];
        const drops = [];

        if (result.key === 'scraps') {
            drops.push(createItemDropFromDefinition(getItemDefinition(islandIndex >= 4 ? 'breadRation' : 'driedSnack')));
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
        } else if (random() < 0.35) {
            const definition = getItemDefinition(islandIndex >= 4 ? 'breadRation' : 'driedSnack');
            if (definition) {
                drops.push(createItemDropFromDefinition(definition));
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
            return buildEmptyChestPlan(islandIndex, chestTier, random);
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

    function describeDrop(drop) {
        if (!drop) {
            return '';
        }

        if (drop.type === 'gold') {
            return `${drop.label} (+${drop.amount} золота)`;
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

    function createMerchantStock(islandIndex, random) {
        const shopRuntime = getShopRuntime();

        if (shopRuntime && typeof shopRuntime.createMerchantStock === 'function') {
            return shopRuntime.createMerchantStock(islandIndex, random);
        }

        return [];
    }

    function createMerchantQuest(islandIndex, random) {
        const shopRuntime = getShopRuntime();

        if (shopRuntime && typeof shopRuntime.createMerchantQuest === 'function') {
            return shopRuntime.createMerchantQuest(islandIndex, random);
        }

        return null;
    }

    Object.assign(loot, {
        getItemDefinition,
        createInventoryItem,
        describeItem,
        getConsumableEffect,
        isItemStackable,
        getItemBaseValue,
        getMerchantBuyPrice,
        getMerchantSellPrice,
        createChestLootPlan,
        createHouseOutcomePlan,
        createMerchantStock,
        createMerchantQuest,
        describeLootPlan,
        describeDrop,
        merchantStockPool: getShopRuntime() && getShopRuntime().merchantStockPool ? getShopRuntime().merchantStockPool : [],
        merchantQuestPool: getShopRuntime() && getShopRuntime().merchantQuestPool ? getShopRuntime().merchantQuestPool : []
    });
})();
