(() => {
    const game = window.Game;
    const itemRegistry = game.systems.itemRegistry = game.systems.itemRegistry || {};

    function getCatalog() {
        return game.systems.itemCatalog || null;
    }

    function getDefinitionsMap() {
        const catalog = getCatalog();
        return catalog && catalog.itemById ? catalog.itemById : {};
    }

    function getItemDefinition(itemId) {
        return getDefinitionsMap()[itemId] || null;
    }

    function getTierByIsland(islandIndex = game.state.currentIslandIndex || 1) {
        const catalog = getCatalog();
        return catalog && typeof catalog.getTierByIsland === 'function'
            ? catalog.getTierByIsland(islandIndex)
            : 0;
    }

    function getQuestCategoryLabels() {
        const catalog = getCatalog();
        return catalog && catalog.questCategoryLabels ? catalog.questCategoryLabels : {};
    }

    function getQuestCategoryLabel(category) {
        return getQuestCategoryLabels()[category] || category;
    }

    function buildQuestCategories(definition) {
        const categories = new Set(definition && Array.isArray(definition.categories) ? definition.categories : []);
        const questCategories = new Set();
        const tier = Math.max(0, definition && definition.lootTier ? definition.lootTier : 0);

        if (categories.has('food')) {
            questCategories.add('food');
            questCategories.add('survival');
            questCategories.add('consumable');
        }

        if (categories.has('consumable')) {
            questCategories.add('consumable');
        }

        if (categories.has('survival')) {
            questCategories.add('survival');
        }

        if (categories.has('tool')) {
            questCategories.add('tool');
            questCategories.add('utility');
        }

        if (categories.has('utility') || categories.has('info')) {
            questCategories.add('utility');
        }

        if (categories.has('movement')) {
            questCategories.add('movement');
        }

        if (categories.has('value') || categories.has('material') || categories.has('resource')) {
            questCategories.add('value');
        }

        if (categories.has('risk') || definition.rarity === 'cursed') {
            questCategories.add('risk');
        }

        if (tier >= 2 && questCategories.has('consumable')) {
            questCategories.add('rareConsumable');
        }

        if (tier >= 4 && questCategories.has('consumable')) {
            questCategories.add('strongConsumable');
        }

        if (tier >= 4 && questCategories.has('movement')) {
            questCategories.add('topMovement');
        }

        if (tier >= 4 && questCategories.has('survival')) {
            questCategories.add('strongSurvival');
        }

        if (tier >= 5 && questCategories.has('utility')) {
            questCategories.add('topUtility');
        }

        if (tier >= 3 && questCategories.has('value')) {
            questCategories.add('rareValue');
        }

        if (tier >= 5 && questCategories.has('value')) {
            questCategories.add('uniqueValue');
        }

        if (tier >= 5 && questCategories.has('risk')) {
            questCategories.add('topRisk');
        }

        return [...questCategories];
    }

    function getItemQuestCategories(itemId) {
        const definition = getItemDefinition(itemId);
        return definition ? buildQuestCategories(definition) : [];
    }

    function isUniqueValue(definition) {
        if (!definition) {
            return false;
        }

        return (definition.lootTier || 0) >= 5
            && (definition.rarity === 'legendary' || (definition.categories || []).includes('value'));
    }

    function definitionMatchesRequirement(definition, requirement, context = {}) {
        if (!definition || !requirement) {
            return false;
        }

        if (Array.isArray(requirement.matchAny) && requirement.matchAny.length > 0) {
            return requirement.matchAny.some((rule) => definitionMatchesRequirement(definition, rule, context));
        }

        const catalogCategories = new Set([
            ...(Array.isArray(definition.categories) ? definition.categories : []),
            ...buildQuestCategories(definition)
        ]);
        const craftingTags = new Set(Array.isArray(definition.craftingTags) ? definition.craftingTags : []);
        if (Array.isArray(requirement.questCategories) && requirement.questCategories.length > 0) {
            const intersects = requirement.questCategories.some((category) => catalogCategories.has(category));
            if (!intersects) {
                return false;
            }
        }

        if (Array.isArray(requirement.craftingTags) && requirement.craftingTags.length > 0) {
            const intersects = requirement.craftingTags.some((tag) => craftingTags.has(tag));
            if (!intersects) {
                return false;
            }
        }

        if (Number.isFinite(requirement.minTier) && (definition.lootTier || 0) < requirement.minTier) {
            return false;
        }

        if (Number.isFinite(requirement.maxTier) && (definition.lootTier || 0) > requirement.maxTier) {
            return false;
        }

        if (requirement.uniqueOnly && !isUniqueValue(definition)) {
            return false;
        }

        return true;
    }

    function itemMatchesRequirement(item, requirement, context = {}) {
        const definition = item && item.id ? getItemDefinition(item.id) : null;
        if (!definition || !requirement || !definitionMatchesRequirement(definition, requirement, context)) {
            return false;
        }
        const currentIslandIndex = Math.max(1, context.currentIslandIndex || game.state.currentIslandIndex || 1);

        if (requirement.unusedOnly && Math.max(0, item.useCount || 0) > 0) {
            return false;
        }

        if (Number.isFinite(requirement.minCarriedIslands)) {
            const obtainedIslandIndex = Math.max(1, item.obtainedIslandIndex || currentIslandIndex);
            if (currentIslandIndex - obtainedIslandIndex < requirement.minCarriedIslands) {
                return false;
            }
        }

        return true;
    }

    function requirementMatchesItem(item, requirement, context = {}) {
        if (!requirement) {
            return false;
        }

        if (Array.isArray(requirement.matchAny) && requirement.matchAny.length > 0) {
            return requirement.matchAny.some((rule) => itemMatchesRequirement(item, rule, context));
        }

        return itemMatchesRequirement(item, requirement, context);
    }

    function evaluateRequirementMatches(inventoryItems, requirements, context = {}) {
        const normalizedItems = Array.isArray(inventoryItems)
            ? inventoryItems.filter(Boolean)
            : [];
        const requirementList = Array.isArray(requirements) ? requirements : [];
        const memo = new Map();

        function scoreAssignment(matches) {
            return matches.reduce((score, entry) => score + (entry && entry.satisfied ? 1 : 0), 0);
        }

        function search(index, usedKey) {
            const memoKey = `${index}:${usedKey}`;
            if (memo.has(memoKey)) {
                return memo.get(memoKey);
            }

            if (index >= requirementList.length) {
                const result = [];
                memo.set(memoKey, result);
                return result;
            }

            const requirement = requirementList[index];
            const usedIndices = usedKey ? usedKey.split(',').filter(Boolean).map(Number) : [];
            const usedSet = new Set(usedIndices);
            let best = null;

            const fallback = search(index + 1, usedKey).slice();
            fallback.unshift({
                requirement,
                satisfied: false,
                itemIndex: null,
                item: null,
                optional: Boolean(requirement.optional)
            });
            best = fallback;

            normalizedItems.forEach((item, itemIndex) => {
                if (usedSet.has(itemIndex) || !requirementMatchesItem(item, requirement, context)) {
                    return;
                }

                const nextUsed = [...usedIndices, itemIndex].sort((left, right) => left - right).join(',');
                const candidate = search(index + 1, nextUsed).slice();
                candidate.unshift({
                    requirement,
                    satisfied: true,
                    itemIndex,
                    item,
                    optional: Boolean(requirement.optional)
                });

                const candidateScore = scoreAssignment(candidate);
                const bestScore = scoreAssignment(best);
                if (
                    candidateScore > bestScore
                    || (candidateScore === bestScore && candidate.filter((entry) => entry.satisfied).length > best.filter((entry) => entry.satisfied).length)
                ) {
                    best = candidate;
                }
            });

            memo.set(memoKey, best);
            return best;
        }

        const matches = search(0, '');
        const requiredCount = requirementList.filter((requirement) => !requirement.optional).length;
        const matchedRequiredCount = matches.filter((entry) => entry.satisfied && !entry.optional).length;
        const missingRequirements = matches
            .filter((entry) => !entry.satisfied && !entry.optional)
            .map((entry) => entry.requirement);

        return {
            matches,
            requiredCount,
            matchedRequiredCount,
            isComplete: matchedRequiredCount >= requiredCount,
            missingRequirements
        };
    }

    function buildDefaultDescription(definition) {
        const categories = definition && Array.isArray(definition.categories) ? definition.categories : [];
        const parts = [];

        if (categories.includes('movement')) {
            parts.push('влияет на маршрут');
        }

        if (categories.includes('utility') || categories.includes('info')) {
            parts.push('даёт полезный утилитарный эффект');
        }

        if (categories.includes('risk')) {
            parts.push('связан с риском');
        }

        if (categories.includes('value')) {
            parts.push('подходит для обмена и квестов');
        }

        return parts.length > 0
            ? `${definition.label}. Этот предмет ${parts.join(', ')}.`
            : definition.label;
    }

    function createInventoryItem(itemId, quantity = 1, metadata = {}) {
        const definition = getItemDefinition(itemId);

        if (!definition) {
            return null;
        }

        const currentIslandIndex = Math.max(1, game.state.currentIslandIndex || 1);
        const passthroughMetadata = Object.fromEntries(Object.entries(metadata || {}).filter(([key]) => ![
            'id',
            'icon',
            'label',
            'quantity',
            'obtainedIslandIndex',
            'useCount'
        ].includes(key)));
        return {
            ...passthroughMetadata,
            id: definition.id,
            icon: definition.icon,
            label: definition.label,
            quantity: Math.max(1, quantity),
            obtainedIslandIndex: Number.isFinite(metadata.obtainedIslandIndex)
                ? metadata.obtainedIslandIndex
                : currentIslandIndex,
            useCount: Math.max(0, metadata.useCount || 0)
        };
    }

    function describeItem(itemId) {
        const definition = getItemDefinition(itemId);
        return definition ? (definition.description || buildDefaultDescription(definition)) : '';
    }

    function getConsumableEffect(itemId) {
        const definition = getItemDefinition(itemId);
        return definition && definition.consumable ? { ...definition.consumable } : null;
    }

    function isItemStackable(itemId) {
        const definition = getItemDefinition(itemId);
        return Boolean(definition && definition.stackable);
    }

    function getItemBaseValue(itemId) {
        const definition = getItemDefinition(itemId);
        if (!definition) {
            return 1;
        }

        if (definition.baseValue > 0) {
            return definition.baseValue;
        }

        const tier = Math.max(0, definition.lootTier || 0);
        const categories = definition.categories || [];
        const tierValue = tier <= 0 ? 4 : 6 + tier * 6;

        if (categories.includes('legendary')) {
            return 60 + tier * 2;
        }

        if (categories.includes('artifact')) {
            return tierValue + 8;
        }

        if (categories.includes('tool')) {
            return tierValue + 4;
        }

        if (categories.includes('value')) {
            return tierValue + 6;
        }

        if (categories.includes('consumable')) {
            return definition.stackable ? tierValue : tierValue + 2;
        }

        return tierValue;
    }

    function combineLessThanOne(current, value) {
        return current * value;
    }

    function buildInventoryModifierSnapshot(inventoryItems, context = {}) {
        const snapshot = {
            travelCostMultiplier: 1,
            longRouteTravelCostMultiplier: 1,
            roughTravelCostMultiplier: 1,
            bridgeTravelCostMultiplier: 1,
            recoveryMultiplier: 1,
            foodRecoveryMultiplier: 1,
            drainMultiplier: 1,
            merchantBuyMultiplier: 1,
            merchantSellMultiplier: 1,
            goldLootMultiplier: 1,
            chestLuck: 0,
            routeLengthBonus: 0,
            freeOpeningSteps: 0,
            chainTravelDiscount: 0,
            ignoreTravelZones: [],
            showHouseValue: false,
            synergyMultiplier: 1
        };
        const ignoredZones = new Set();

        (inventoryItems || []).filter(Boolean).forEach((item) => {
            const definition = getItemDefinition(item.id);
            const passive = definition && definition.passive ? definition.passive : null;

            if (!passive) {
                return;
            }

            if (Number.isFinite(passive.travelCostMultiplier)) {
                snapshot.travelCostMultiplier = combineLessThanOne(snapshot.travelCostMultiplier, passive.travelCostMultiplier);
            }

            if (Number.isFinite(passive.longRouteTravelCostMultiplier)) {
                snapshot.longRouteTravelCostMultiplier = combineLessThanOne(
                    snapshot.longRouteTravelCostMultiplier,
                    passive.longRouteTravelCostMultiplier
                );
            }

            if (Number.isFinite(passive.roughTravelCostMultiplier)) {
                snapshot.roughTravelCostMultiplier = combineLessThanOne(
                    snapshot.roughTravelCostMultiplier,
                    passive.roughTravelCostMultiplier
                );
            }

            if (Number.isFinite(passive.bridgeTravelCostMultiplier)) {
                snapshot.bridgeTravelCostMultiplier = combineLessThanOne(
                    snapshot.bridgeTravelCostMultiplier,
                    passive.bridgeTravelCostMultiplier
                );
            }

            if (Number.isFinite(passive.recoveryMultiplier)) {
                snapshot.recoveryMultiplier *= passive.recoveryMultiplier;
            }

            if (Number.isFinite(passive.foodRecoveryMultiplier)) {
                snapshot.foodRecoveryMultiplier *= passive.foodRecoveryMultiplier;
            }

            if (Number.isFinite(passive.drainMultiplier)) {
                snapshot.drainMultiplier *= passive.drainMultiplier;
            }

            if (Number.isFinite(passive.merchantBuyMultiplier)) {
                snapshot.merchantBuyMultiplier *= passive.merchantBuyMultiplier;
            }

            if (Number.isFinite(passive.merchantSellMultiplier)) {
                snapshot.merchantSellMultiplier *= passive.merchantSellMultiplier;
            }

            if (Number.isFinite(passive.goldLootMultiplier)) {
                snapshot.goldLootMultiplier *= passive.goldLootMultiplier;
            }

            if (Number.isFinite(passive.chestLuck)) {
                snapshot.chestLuck += passive.chestLuck;
            }

            if (Number.isFinite(passive.routeLengthBonus)) {
                snapshot.routeLengthBonus += passive.routeLengthBonus;
            }

            if (Number.isFinite(passive.freeOpeningSteps)) {
                snapshot.freeOpeningSteps += passive.freeOpeningSteps;
            }

            if (Number.isFinite(passive.chainTravelDiscount)) {
                snapshot.chainTravelDiscount += passive.chainTravelDiscount;
            }

            if (passive.showHouseValue) {
                snapshot.showHouseValue = true;
            }

            if (Number.isFinite(passive.synergyMultiplier)) {
                snapshot.synergyMultiplier *= passive.synergyMultiplier;
            }

            (passive.ignoreTravelZones || []).forEach((zoneKey) => {
                ignoredZones.add(zoneKey);
            });
        });

        if (snapshot.synergyMultiplier > 1) {
            const amplifyBelowOne = (value) => 1 - (1 - value) * snapshot.synergyMultiplier;
            snapshot.travelCostMultiplier = Math.max(0.35, amplifyBelowOne(snapshot.travelCostMultiplier));
            snapshot.longRouteTravelCostMultiplier = Math.max(0.35, amplifyBelowOne(snapshot.longRouteTravelCostMultiplier));
            snapshot.roughTravelCostMultiplier = Math.max(0.35, amplifyBelowOne(snapshot.roughTravelCostMultiplier));
            snapshot.bridgeTravelCostMultiplier = Math.max(0.35, amplifyBelowOne(snapshot.bridgeTravelCostMultiplier));
            snapshot.recoveryMultiplier = 1 + (snapshot.recoveryMultiplier - 1) * snapshot.synergyMultiplier;
            snapshot.foodRecoveryMultiplier = 1 + (snapshot.foodRecoveryMultiplier - 1) * snapshot.synergyMultiplier;
            snapshot.goldLootMultiplier = 1 + (snapshot.goldLootMultiplier - 1) * snapshot.synergyMultiplier;
        }

        snapshot.ignoreTravelZones = [...ignoredZones];
        snapshot.contextIslandTier = getTierByIsland(context.currentIslandIndex || game.state.currentIslandIndex || 1);
        return snapshot;
    }

    function getCurrentModifierSnapshot(context = {}) {
        const inventoryRuntime = game.systems.inventoryRuntime || null;
        const inventoryItems = inventoryRuntime && typeof inventoryRuntime.getInventory === 'function'
            ? inventoryRuntime.getInventory()
                .slice(0, inventoryRuntime.getUnlockedInventorySlots())
                .map((item) => inventoryRuntime.normalizeInventoryItem(item))
                .filter(Boolean)
            : [];

        return buildInventoryModifierSnapshot(inventoryItems, context);
    }

    function getCatalogDefinitions() {
        return Object.values(getDefinitionsMap());
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

    function buildWeightedCatalogPool(weightKey, islandIndex = game.state.currentIslandIndex || 1, options = {}) {
        const islandTier = getTierByIsland(islandIndex);
        const normalizedTier = Math.max(1, islandTier || 1);
        const includeTierZero = Boolean(options.includeTierZero);
        const requiredCategories = Array.isArray(options.requiredCategories) ? options.requiredCategories : [];
        const preferredCategories = Array.isArray(options.preferredCategories) ? options.preferredCategories : [];
        const preferredItemIds = Array.isArray(options.preferredItemIds) && options.preferredItemIds.length > 0
            ? new Set(options.preferredItemIds)
            : null;
        const preferredRequirements = Array.isArray(options.preferredRequirements) ? options.preferredRequirements.filter(Boolean) : [];
        const forbiddenCategories = Array.isArray(options.forbiddenCategories) ? options.forbiddenCategories : [];
        const excludedItemIds = new Set(Array.isArray(options.excludeItemIds) ? options.excludeItemIds : []);
        const includeItemIds = Array.isArray(options.includeItemIds) && options.includeItemIds.length > 0
            ? new Set(options.includeItemIds)
            : null;
        const chestLuck = Math.max(0, options.chestLuck || 0);

        return getCatalogDefinitions()
            .map((definition) => {
                if (!definition) {
                    return null;
                }

                if (includeItemIds && !includeItemIds.has(definition.id)) {
                    return null;
                }

                if (excludedItemIds.has(definition.id)) {
                    return null;
                }

                if (options.stackableOnly && !definition.stackable) {
                    return null;
                }

                if (options.nonStackableOnly && definition.stackable) {
                    return null;
                }

                const baseWeight = Number(definition[weightKey]) || 0;
                if (baseWeight <= 0) {
                    return null;
                }

                const categories = Array.isArray(definition.categories) ? definition.categories : [];
                const questCategories = buildQuestCategories(definition);
                const catalogCategories = new Set([...categories, ...questCategories]);

                if (requiredCategories.length > 0 && !requiredCategories.some((category) => catalogCategories.has(category))) {
                    return null;
                }

                if (forbiddenCategories.some((category) => catalogCategories.has(category))) {
                    return null;
                }

                const itemTier = Number.isFinite(definition.lootTier) ? definition.lootTier : 0;
                if (itemTier <= 0 && !includeTierZero) {
                    return null;
                }

                if (Number.isFinite(options.minTier) && itemTier < options.minTier) {
                    return null;
                }

                if (Number.isFinite(options.maxTier) && itemTier > options.maxTier) {
                    return null;
                }

                let weight = baseWeight * getTierDistributionWeight(itemTier, normalizedTier, options);
                if (weight <= 0) {
                    return null;
                }

                if (preferredCategories.length > 0) {
                    const matchCount = preferredCategories.filter((category) => catalogCategories.has(category)).length;
                    weight *= matchCount > 0 ? 1 + Math.min(0.9, matchCount * 0.28) : 0.8;
                }

                if (preferredItemIds && preferredItemIds.has(definition.id)) {
                    weight *= 1.9;
                }

                if (preferredRequirements.length > 0) {
                    const matchedRequirementCount = preferredRequirements.filter((requirement) => definitionMatchesRequirement(definition, requirement, {
                        currentIslandIndex: islandIndex
                    })).length;
                    weight *= matchedRequirementCount > 0
                        ? 1 + Math.min(1.1, matchedRequirementCount * 0.42)
                        : 0.86;
                }

                if (weightKey === 'chestWeight' && chestLuck > 0) {
                    if (itemTier >= normalizedTier) {
                        weight *= 1 + chestLuck * 0.12;
                    }

                    if (categories.includes('artifact') || categories.includes('legendary')) {
                        weight *= 1 + chestLuck * 0.08;
                    }
                }

                if (options.valueBias && categories.includes('value')) {
                    weight *= options.valueBias;
                }

                if (options.riskBias && categories.includes('risk')) {
                    weight *= options.riskBias;
                }

                if (definition.rarity === 'legendary' && normalizedTier < 6 && !options.allowFutureTiers) {
                    weight *= 0.5;
                }

                return {
                    definition,
                    weight
                };
            })
            .filter(Boolean);
    }

    function pickWeightedCatalogDefinition(weightKey, islandIndex = game.state.currentIslandIndex || 1, random = Math.random, options = {}) {
        const pool = buildWeightedCatalogPool(weightKey, islandIndex, options);

        if (pool.length === 0) {
            return null;
        }

        const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
        let roll = random() * totalWeight;

        for (const entry of pool) {
            roll -= entry.weight;
            if (roll <= 0) {
                return entry.definition;
            }
        }

        return pool[pool.length - 1].definition;
    }

    function pickUniqueWeightedCatalogDefinitions(weightKey, islandIndex = game.state.currentIslandIndex || 1, random = Math.random, count = 1, options = {}) {
        const result = [];
        const excluded = new Set(Array.isArray(options.excludeItemIds) ? options.excludeItemIds : []);

        while (result.length < Math.max(0, count)) {
            const definition = pickWeightedCatalogDefinition(weightKey, islandIndex, random, {
                ...options,
                excludeItemIds: [...excluded]
            });

            if (!definition) {
                break;
            }

            excluded.add(definition.id);
            result.push(definition);
        }

        return result;
    }

    Object.assign(itemRegistry, {
        getItemDefinition,
        getTierByIsland,
        getQuestCategoryLabel,
        getItemQuestCategories,
        definitionMatchesRequirement,
        itemMatchesRequirement,
        requirementMatchesItem,
        evaluateRequirementMatches,
        createInventoryItem,
        describeItem,
        getConsumableEffect,
        isItemStackable,
        getItemBaseValue,
        buildInventoryModifierSnapshot,
        getCurrentModifierSnapshot,
        getCatalogDefinitions,
        buildWeightedCatalogPool,
        pickWeightedCatalogDefinition,
        pickUniqueWeightedCatalogDefinitions,
        itemDefinitions: getDefinitionsMap()
    });
})();
