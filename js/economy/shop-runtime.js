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

    function getComponentRegistry() {
        return game.systems.componentRegistry || null;
    }

    function getUiBridge() {
        return game.systems.uiBridge || null;
    }

    const COMPONENT_INTEREST_SELL_MULTIPLIERS = Object.freeze({
        ordinary: 1.08,
        enhanced: 1.18,
        stable: 1.18,
        rare: 1.28
    });

    function getItemLabel(itemId, fallback = '') {
        const definition = getItemDefinition(itemId);
        return definition && definition.label ? definition.label : (fallback || itemId);
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

    function getMerchantPreferredComponentItemIds(merchantRole = 'merchant') {
        const componentRegistry = getComponentRegistry();
        const componentDefinitions = componentRegistry && typeof componentRegistry.getComponentsByMerchantInterest === 'function'
            ? componentRegistry.getComponentsByMerchantInterest(merchantRole)
            : [];

        return componentDefinitions
            .map((component) => component && component.inventoryItem ? component.inventoryItem.id : '')
            .filter(Boolean);
    }

    function getMerchantAdviceTemplate(merchantRole = 'merchant') {
        const bridgeKitLabel = getItemLabel('bridge_kit', 'Мост-комплект');
        const portableBridgeLabel = getItemLabel('portableBridge', 'Переносной мост');
        const reinforcedBridgeLabel = getItemLabel('reinforcedBridge', 'Усиленный мост');
        const fieldBridgeLabel = getItemLabel('fieldBridge', 'Полевой мостик');
        const absoluteBridgeLabel = getItemLabel('absoluteBridge', 'Абсолютный мост');
        const ferryBoardLabel = getItemLabel('ferryBoard', 'Доска переправы');
        const roughBridgeLabel = getItemLabel('roughBridge', 'Грубый мостик');
        const signalWhistleLabel = getItemLabel('signalWhistle', 'Сигнальный свисток');
        const pathMarkerLabel = getItemLabel('pathMarker', 'Маркер пути');
        const fishingRodLabel = getItemLabel('fishingRod', 'Удочка путника');
        const rawGrassLabel = getItemLabel('raw_grass', 'Трава');
        const rawStoneLabel = getItemLabel('raw_stone', 'Камень');
        const rawRubbleLabel = getItemLabel('raw_rubble', 'Щебень');
        const rawWoodLabel = getItemLabel('raw_wood', 'Дерево');
        const rawFishLabel = getItemLabel('raw_fish', 'Рыба');
        const soilClodLabel = getItemLabel('soilClod', 'Комья земли');
        const soilResourceLabel = getItemLabel('soilResource', 'Земляной ресурс');

        const adviceByRole = {
            merchant: {
                id: 'merchant:auto-conversion',
                title: 'Сырьё и сжатие',
                hook: 'Как теперь работают базовые raw-ресурсы и почему их не стоит копить просто так.',
                basePrice: 6,
                text: `Базовое сырьё теперь хранится явно: "${rawGrassLabel}", "${rawStoneLabel}", "${rawRubbleLabel}", "${rawWoodLabel}" и "${rawFishLabel}" не склеиваются сами в товар. Их смысл — быстро пройти слой 5 к 1: собрать, сжать в компонент и сразу пустить в крафт. "${soilClodLabel}" тоже проходит через тот же слой сжатия и даёт "${soilResourceLabel}".`
            },
            fisherman: {
                id: 'fisherman:survival-route',
                title: 'Запас на длинный остров',
                hook: 'Что покупать перед тяжёлым переходом через несколько зон.',
                basePrice: 6,
                text: `У рыбака лучше добирать еду, выживание и простые инструменты. Если увидишь "${fishingRodLabel}", бери её перед водным или длинным островом: она открывает рыбалку у воды. Пять единиц улова идут в мясо, а десять — в рыбий жир: он нужен не только для лодки, но и для фонарей, маяков и выгодного обмена.`
            },
            bridgewright: {
                id: 'bridgewright:bridges',
                title: 'Где брать мосты',
                hook: 'Про переправы, старые версии мостов и честный ответ про крафт.',
                basePrice: 8,
                text: `На верстаке сначала собирается "${bridgeKitLabel}", а затем из него можно довести предмет до "${portableBridgeLabel}". Дальше мостовая ветка уже апгрейдится: "${reinforcedBridgeLabel}" и "${fieldBridgeLabel}" собираются поверх базового моста, а поздний "${absoluteBridgeLabel}" — это уже отдельная тяжёлая сборка. Старые ready-made версии всё ещё можно найти у мостовиков, у торговцев движения и у некоторых NPC; помни, что обычный мост стареет после первого прохода и рушится после второго.`
            },
            junkDealer: {
                id: 'junkDealer:risky-loot',
                title: 'Что нести старьёвщику',
                hook: 'Когда сомнительная находка ценнее аккуратного расходника.',
                basePrice: 7,
                text: 'Старьёвщик чаще работает с рискованным хламом, материалами и странными ценностями. К нему выгоднее приходить не с аккуратным пайком, а с тем, что жалко держать в билде, но полезно обменять или сдать по торговому квесту.'
            },
            storyteller: {
                id: 'storyteller:info-tools',
                title: 'Наводки на острове',
                hook: 'Какие мелкие вещи экономят больше шагов, чем кажется.',
                basePrice: 8,
                text: `"${signalWhistleLabel}" точно показывает торговца текущего острова, а "${pathMarkerLabel}" помогает проложить самый дешёвый путь к цели. У рассказчика такие информационные вещи появляются чаще, чем у обычной лавки.`
            },
            exchanger: {
                id: 'exchanger:greed-trap',
                title: 'Когда окупается обменщик',
                hook: 'Почему к нему лучше идти с планом, а не с пустой сумкой.',
                basePrice: 9,
                text: 'К обменщику выгодно заходить, когда у тебя уже есть понятная цель сборки и запас золота. Он сильнее обычного торговца на поздних вещах и утилите, но без плана легко превратить жадность в дорогую ошибку.'
            },
            quartermaster: {
                id: 'quartermaster:working-build',
                title: 'Рабочий комплект',
                hook: 'Как собирать сумку под длинный маршрут, а не под красивую витрину.',
                basePrice: 8,
                text: 'У интенданта чаще всего лежат вещи на выживание, инструменты и движение. Перед длинным маршрутом лучше покупать то, что держит темп острова и цену шага, а не просто дорогие ценности, которые не помогают идти.'
            },
            collector: {
                id: 'collector:late-value',
                title: 'Что любит коллекционер',
                hook: 'Когда редкость и странность важнее простой выгоды.',
                basePrice: 10,
                text: 'Коллекционер полезен тем, кто уже носит поздние ценности, артефакты и редкие находки. Обычный расходник у него почти никогда не лучший обмен; сюда стоит идти с вещами, которые жалко продавать обычной лавке.'
            }
        };

        return adviceByRole[merchantRole] || adviceByRole.merchant;
    }

    function getMerchantAdvicePrice(template, islandIndex = game.state.currentIslandIndex || 1) {
        const basePrice = Math.max(4, template && Number.isFinite(template.basePrice) ? template.basePrice : 6);
        return basePrice + Math.floor((Math.max(1, islandIndex) - 1) / 6);
    }

    function buildMerchantAdvice(encounter, savedAdvice = null) {
        const template = getMerchantAdviceTemplate(encounter && encounter.merchantRole ? encounter.merchantRole : 'merchant');
        const islandIndex = Math.max(1, encounter && encounter.islandIndex ? encounter.islandIndex : (game.state.currentIslandIndex || 1));

        return {
            adviceId: template.id,
            title: template.title,
            hook: template.hook || '',
            text: template.text || '',
            price: savedAdvice && Number.isFinite(savedAdvice.price)
                ? savedAdvice.price
                : getMerchantAdvicePrice(template, islandIndex),
            purchased: Boolean(savedAdvice && savedAdvice.purchased),
            purchasedAtIslandIndex: savedAdvice && Number.isFinite(savedAdvice.purchasedAtIslandIndex)
                ? savedAdvice.purchasedAtIslandIndex
                : null
        };
    }

    function ensureMerchantAdvice(encounter) {
        if (!encounter || encounter.kind !== 'merchant') {
            return null;
        }

        encounter.advice = buildMerchantAdvice(encounter, encounter.advice || null);
        return encounter.advice;
    }

    function getDefinitionCategories(definition) {
        return Array.isArray(definition && definition.categories) ? definition.categories : [];
    }

    function isBasicResourceQuestDefinition(definition) {
        const categories = getDefinitionCategories(definition);
        const lootTier = Number.isFinite(definition && definition.lootTier) ? definition.lootTier : 0;

        return Boolean(
            definition
            && Boolean(definition.stackable)
            && lootTier <= 2
            && (categories.includes('resource') || categories.includes('material'))
            && !categories.includes('artifact')
            && !categories.includes('legendary')
        );
    }

    function getMerchantQuestBonusRewardPool(islandIndex = game.state.currentIslandIndex || 1) {
        const islandTier = Math.max(1, getTierByIsland(islandIndex));
        const itemIds = [
            'portableBridge',
            'hookRope',
            'roadChalk',
            'pathMarker',
            'signalWhistle'
        ];

        if (islandTier >= 3) {
            itemIds.push(
                'reinforcedBridge',
                'fogLantern',
                'merchantBeacon',
                'returnMarker',
                'lightBoat'
            );
        }

        if (islandTier >= 4) {
            itemIds.push(
                'fieldBridge',
                'crossingCable',
                'climberHook',
                'bypassCompass',
                'foldingBoat',
                'emergencyTeleport'
            );
        }

        return itemIds;
    }

    function pickMerchantQuestBonusReward(definition, islandIndex, random = Math.random) {
        if (!isBasicResourceQuestDefinition(definition)) {
            return null;
        }

        const registry = getItemRegistry();
        const rewardPool = getMerchantQuestBonusRewardPool(islandIndex);
        const pickedReward = registry && typeof registry.pickWeightedCatalogDefinition === 'function'
            ? registry.pickWeightedCatalogDefinition('merchantWeight', islandIndex, random, {
                includeItemIds: rewardPool,
                nonStackableOnly: true,
                preferredCategories: ['movement', 'utility'],
                allowFutureTiers: true,
                maxFutureDistance: 1
            })
            : null;

        return pickedReward || getItemDefinition('portableBridge');
    }

    function ensureMerchantQuestBonusReward(quest, islandIndex = game.state.currentIslandIndex || 1, random = Math.random) {
        if (!quest || (quest.questType && quest.questType !== 'merchantDelivery')) {
            return false;
        }

        const hasRewardItem = Boolean(quest.rewardItemId) && Math.max(0, Math.round(quest.rewardItemQuantity || 0)) > 0;
        if (hasRewardItem) {
            return false;
        }

        const definition = getItemDefinition(quest.itemId);
        const bonusRewardDefinition = pickMerchantQuestBonusReward(definition, islandIndex, random);
        if (!bonusRewardDefinition) {
            return false;
        }

        quest.rewardItemId = bonusRewardDefinition.id;
        quest.rewardItemLabel = bonusRewardDefinition.label;
        quest.rewardItemIcon = bonusRewardDefinition.icon;
        quest.rewardItemQuantity = 1;
        return true;
    }

    function buildRewardItemPreview(itemId, quantity = 1, overrides = {}) {
        const definition = getItemDefinition(itemId);
        return {
            id: itemId,
            icon: overrides.icon || (definition ? definition.icon : '?'),
            label: overrides.label || (definition ? definition.label : itemId),
            quantity: Math.max(1, Math.round(quantity || 1))
        };
    }

    function formatRewardItemSummary(itemLabel, quantity = 1) {
        if (!itemLabel) {
            return '';
        }

        return quantity > 1 ? `${itemLabel} x${quantity}` : itemLabel;
    }

    function grantQuestRewardItem(itemId, quantity = 1, overrides = {}) {
        const inventoryRuntime = getInventoryRuntime();
        const itemEffects = getItemEffects();
        const preview = buildRewardItemPreview(itemId, quantity, overrides);

        if (!itemId || !inventoryRuntime || typeof inventoryRuntime.addInventoryItem !== 'function') {
            return {
                granted: false,
                inventoryQuantity: 0,
                droppedQuantity: 0,
                item: preview,
                effectDrops: []
            };
        }

        let inventoryQuantity = 0;
        const targetQuantity = Math.max(1, preview.quantity);

        for (let index = 0; index < targetQuantity; index++) {
            const outcome = inventoryRuntime.addInventoryItem(itemId, 1);

            if (!outcome || !outcome.added) {
                break;
            }

            inventoryQuantity += 1;
        }

        const droppedQuantity = Math.max(0, targetQuantity - inventoryQuantity);
        if (droppedQuantity > 0 && game.systems.interactions && game.state.playerPos) {
            game.systems.interactions.addGroundItemDrop(
                game.state.playerPos.x,
                game.state.playerPos.y,
                {
                    ...preview,
                    quantity: droppedQuantity
                }
            );

            if (game.systems.world && typeof game.systems.world.updatePlayerContext === 'function') {
                game.systems.world.updatePlayerContext(game.state.playerPos);
            }
        }

        const deliveredQuantity = inventoryQuantity + droppedQuantity;
        return {
            granted: deliveredQuantity > 0,
            inventoryQuantity,
            droppedQuantity,
            item: {
                ...preview,
                quantity: deliveredQuantity
            },
            effectDrops: deliveredQuantity > 0 && itemEffects && typeof itemEffects.buildItemEffectDrop === 'function'
                ? [itemEffects.buildItemEffectDrop({
                    ...preview,
                    quantity: deliveredQuantity
                })].filter(Boolean)
                : []
        };
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
        const preferredItemIds = getMerchantPreferredComponentItemIds(options.merchantRole);
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
            preferredItemIds,
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
        const bonusRewardDefinition = pickMerchantQuestBonusReward(definition, islandIndex, random);

        return {
            questType: 'merchantDelivery',
            itemId: definition.id,
            label: definition.label,
            icon: definition.icon,
            quantity,
            progressRequired: quantity,
            rewardGold,
            rewardItemId: bonusRewardDefinition ? bonusRewardDefinition.id : '',
            rewardItemLabel: bonusRewardDefinition ? bonusRewardDefinition.label : '',
            rewardItemIcon: bonusRewardDefinition ? bonusRewardDefinition.icon : '',
            rewardItemQuantity: bonusRewardDefinition ? 1 : 0,
            completed: false,
            repeatable: false,
            description: `Нужен предмет "${definition.label}" x${quantity}.`
        };
    }

    function createMerchantEncounterProfile(islandIndex, random, options = {}) {
        const merchantRole = options.merchantRole || 'merchant';
        const profile = {
            kind: 'merchant',
            islandIndex,
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

        profile.advice = buildMerchantAdvice(profile);
        return profile;
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
            ensureMerchantQuestBonusReward(profile.quest, profile.islandIndex);
        }

        if (savedState.advice) {
            profile.advice = {
                ...(profile.advice || {}),
                ...savedState.advice
            };
        }

        profile.shopId = savedState.shopId || profile.shopId;
        ensureMerchantAdvice(profile);
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
            quest: persistedQuest ? { ...persistedQuest } : null,
            advice: encounter.advice ? { ...encounter.advice } : null
        };

        return getMerchantStateStore()[source.houseId];
    }

    function prepareMerchantEncounter(source) {
        const encounter = getMerchantEncounter(source);

        if (!encounter) {
            return null;
        }

        ensureMerchantIdentity(source, encounter);
        ensureMerchantAdvice(encounter);
        const backfilledQuestReward = encounter.quest
            ? ensureMerchantQuestBonusReward(encounter.quest, encounter.islandIndex)
            : false;
        const questRuntime = getQuestRuntime();

        if (encounter.quest && questRuntime) {
            questRuntime.acceptQuest(source, encounter.quest);
            questRuntime.getQuestProgress(source, encounter.quest);
        }

        if (backfilledQuestReward) {
            persistMerchantState(source);
        }

        return encounter;
    }

    function getMerchantComponentSellMultiplier(componentDefinition) {
        if (!componentDefinition || !componentDefinition.qualityLevel) {
            return 1;
        }

        return COMPONENT_INTEREST_SELL_MULTIPLIERS[componentDefinition.qualityLevel] || 1.12;
    }

    function getMerchantSellOffer(encounterOrSource, itemId, options = {}) {
        const encounter = encounterOrSource && encounterOrSource.kind === 'merchant'
            ? encounterOrSource
            : prepareMerchantEncounter(encounterOrSource);
        const pricing = getPricingSystem();
        const componentRegistry = getComponentRegistry();
        const islandIndex = encounter && Number.isFinite(encounter.islandIndex)
            ? encounter.islandIndex
            : (game.state.currentIslandIndex || 1);
        const basePrice = pricing && typeof pricing.getMerchantSellPrice === 'function'
            ? pricing.getMerchantSellPrice(itemId, islandIndex)
            : 1;
        const componentDefinition = componentRegistry && typeof componentRegistry.getComponentDefinitionByInventoryItemId === 'function'
            ? componentRegistry.getComponentDefinitionByInventoryItemId(itemId)
            : null;

        if (!encounter) {
            return {
                accepted: false,
                price: 0,
                itemId,
                isComponent: Boolean(componentDefinition),
                matchedInterest: false,
                componentDefinition,
                message: 'Рядом нет торговца.'
            };
        }

        if (!componentDefinition) {
            return {
                accepted: true,
                price: basePrice,
                itemId,
                isComponent: false,
                matchedInterest: false,
                componentDefinition: null,
                merchantRole: encounter.merchantRole || 'merchant',
                message: ''
            };
        }

        const componentInterest = Array.isArray(componentDefinition.merchantInterest)
            ? componentDefinition.merchantInterest
            : [];
        const merchantRole = encounter.merchantRole || 'merchant';
        const matchedInterest = componentInterest.includes(merchantRole);

        if (!matchedInterest) {
            return {
                accepted: false,
                price: 0,
                itemId,
                isComponent: true,
                matchedInterest: false,
                componentDefinition,
                merchantRole,
                message: 'Этого торговца такая заготовка не интересует.'
            };
        }

        const sellMultiplier = getMerchantComponentSellMultiplier(componentDefinition);
        const sellPrice = Math.max(basePrice, Math.round(basePrice * sellMultiplier));

        return {
            accepted: true,
            price: sellPrice,
            itemId,
            isComponent: true,
            matchedInterest: true,
            componentDefinition,
            merchantRole,
            sellMultiplier,
            message: 'Торговца интересует эта заготовка.'
        };
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

        const rewardItemGrant = result.quest && result.quest.rewardItemId
            ? grantQuestRewardItem(
                result.quest.rewardItemId,
                result.quest.rewardItemQuantity || 1,
                {
                    label: result.quest.rewardItemLabel,
                    icon: result.quest.rewardItemIcon
                }
            )
            : null;

        persistMerchantState(source);

        const rewardSummary = [`+${result.quest.rewardGold || 0} золота`];
        if (rewardItemGrant && rewardItemGrant.granted) {
            rewardSummary.push(formatRewardItemSummary(
                rewardItemGrant.item && rewardItemGrant.item.label ? rewardItemGrant.item.label : result.quest.rewardItemLabel,
                rewardItemGrant.item && rewardItemGrant.item.quantity ? rewardItemGrant.item.quantity : (result.quest.rewardItemQuantity || 1)
            ));
        }

        const rewardItemSuffix = rewardItemGrant && rewardItemGrant.droppedQuantity > 0
            ? ` Предмет "${rewardItemGrant.item.label}" не поместился в сумку и лежит под ногами.`
            : '';

        return {
            success: true,
            gold: result.quest.rewardGold || 0,
            quest: result.quest,
            rewardItemGrant,
            effectDrops: [
                ...(itemEffects ? [itemEffects.buildGoldEffectDrop(result.quest.rewardGold || 0)].filter(Boolean) : []),
                ...((rewardItemGrant && Array.isArray(rewardItemGrant.effectDrops)) ? rewardItemGrant.effectDrops : [])
            ],
            message: `Квест торговца выполнен. Получено: ${rewardSummary.join(' и ')}.${rewardItemSuffix}`
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

    function buyMerchantAdvice(source) {
        const encounter = prepareMerchantEncounter(source);
        const uiBridge = getUiBridge();

        if (!encounter || !encounter.advice) {
            return {
                success: false,
                message: 'У этого торговца сейчас нет совета.'
            };
        }

        if (encounter.advice.purchased) {
            return {
                success: false,
                message: 'Этот совет уже куплен.'
            };
        }

        const currentGold = uiBridge && typeof uiBridge.getGold === 'function'
            ? uiBridge.getGold()
            : (typeof game.state.gold === 'number' ? game.state.gold : 0);
        const price = Math.max(0, Math.round(encounter.advice.price || 0));

        if (currentGold < price) {
            return {
                success: false,
                message: `Не хватает золота на совет. Нужно ${price}, сейчас есть ${currentGold}.`
            };
        }

        if (uiBridge && typeof uiBridge.changeGold === 'function') {
            uiBridge.changeGold(-price);
        } else {
            game.state.gold = Math.max(0, currentGold - price);
        }

        encounter.advice.purchased = true;
        encounter.advice.purchasedAtIslandIndex = Math.max(1, game.state.currentIslandIndex || 1);
        persistMerchantState(source);

        return {
            success: true,
            advice: { ...encounter.advice },
            message: `${encounter.label || 'Торговец'} делится советом: ${encounter.advice.text}`
        };
    }

    function sellInventoryItemToMerchant(source, inventoryIndex) {
        const encounter = prepareMerchantEncounter(source);
        const inventoryRuntime = getInventoryRuntime();
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

        const sellOffer = getMerchantSellOffer(encounter, item.id);
        if (!sellOffer || !sellOffer.accepted) {
            return {
                success: false,
                message: sellOffer && sellOffer.message ? sellOffer.message : 'Продать этот предмет сейчас нельзя.'
            };
        }

        const sellPrice = Math.max(1, Math.round(sellOffer.price || 1));
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
            sellOffer,
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
        getMerchantPreferredComponentItemIds,
        getMerchantSellOffer,
        completeMerchantQuest,
        buyMerchantStock,
        sellInventoryItemToMerchant,
        buyMerchantAdvice,
        grantQuestRewardItem,
        formatRewardItemSummary
    });
})();
