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

    function getExpeditionProgressionSystem() {
        return game.systems.expeditionProgression || game.systems.expedition || null;
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

    function getIslandScenario(islandIndex = game.state.currentIslandIndex || 1, fallbackScenario = '') {
        if (typeof fallbackScenario === 'string' && fallbackScenario.trim()) {
            return fallbackScenario.trim();
        }

        const expedition = getExpeditionProgressionSystem();
        const islandRecord = expedition && typeof expedition.getIslandRecord === 'function'
            ? expedition.getIslandRecord(islandIndex)
            : null;
        const progression = islandRecord && islandRecord.progression ? islandRecord.progression : null;
        return progression && typeof progression.scenario === 'string' && progression.scenario.trim()
            ? progression.scenario.trim()
            : 'normal';
    }

    function isTradeIslandEconomyScenario(islandIndex = game.state.currentIslandIndex || 1, scenario = '') {
        return getIslandScenario(islandIndex, scenario) === 'tradeIsland' && Math.max(1, Math.floor(islandIndex || 1)) >= 10;
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

    const merchantIslandWindowProfiles = Object.freeze({
        quartermaster: [
            {
                windowId: 'early-sustain',
                label: 'Ранний интендант',
                islandFrom: 1,
                islandTo: 6,
                preferredCategories: ['survival', 'consumable', 'utility'],
                preferredItemIds: ['fuel_bundle', 'flask_empty', 'flask_water_full'],
                guaranteedItemIds: ['fuel_bundle', 'flask_water_full', 'flask_empty'],
                summary: 'Держит воду, пустые фляги и топливо для стартовой стабилизации.'
            },
            {
                windowId: 'mid-route',
                label: 'Средний интендант',
                islandFrom: 7,
                islandTo: 18,
                preferredCategories: ['movement', 'utility', 'building'],
                preferredItemIds: ['wood_plank_basic', 'fiber_rope', 'stone_block', 'gravel_fill'],
                guaranteedItemIds: ['wood_plank_basic', 'fiber_rope'],
                summary: 'Смещается в маршрутные заготовки: доски, верёвки и стройпакеты под мосты, воду и ремонт.'
            },
            {
                windowId: 'late-catalyst',
                label: 'Поздний интендант',
                islandFrom: 19,
                islandTo: 30,
                preferredCategories: ['utility', 'value', 'building'],
                preferredItemIds: ['fish_oil', 'wood_frame_basic', 'boatFrame'],
                guaranteedItemIds: ['fish_oil', 'wood_frame_basic', 'boatFrame'],
                summary: 'Переходит в редкие катализаторы и качественные компоненты для поздней логистики и снижения риска.'
            }
        ]
    });

    function getMerchantRoleProfile(merchantRole = 'merchant') {
        return merchantRoleProfiles[merchantRole] || merchantRoleProfiles.merchant;
    }

    function getMerchantIslandWindowProfile(merchantRole = 'merchant', islandIndex = game.state.currentIslandIndex || 1) {
        const normalizedIslandIndex = Math.max(1, Math.floor(islandIndex || 1));
        const windows = merchantIslandWindowProfiles[merchantRole];

        if (!Array.isArray(windows) || windows.length === 0) {
            return null;
        }

        return windows.find((windowProfile) => (
            Number.isFinite(windowProfile.islandFrom)
            && Number.isFinite(windowProfile.islandTo)
            && normalizedIslandIndex >= windowProfile.islandFrom
            && normalizedIslandIndex <= windowProfile.islandTo
        )) || null;
    }

    function getMerchantPreferredComponentItemIds(merchantRole = 'merchant', islandIndex = game.state.currentIslandIndex || 1) {
        const componentRegistry = getComponentRegistry();
        const islandWindowProfile = getMerchantIslandWindowProfile(merchantRole, islandIndex);
        const preferredWindowItemIds = islandWindowProfile && Array.isArray(islandWindowProfile.preferredItemIds)
            ? islandWindowProfile.preferredItemIds
            : [];

        if (
            preferredWindowItemIds.length > 0
            && componentRegistry
            && typeof componentRegistry.getMerchantInterestForInventoryItemId === 'function'
        ) {
            return preferredWindowItemIds.filter((itemId, index, list) => (
                itemId
                && list.indexOf(itemId) === index
                && componentRegistry.getMerchantInterestForInventoryItemId(itemId).length > 0
            ));
        }

        return componentRegistry && typeof componentRegistry.getMerchantInterestedInventoryItemIds === 'function'
            ? componentRegistry.getMerchantInterestedInventoryItemIds(merchantRole)
            : [];
    }

    function getMerchantAdviceTemplate(merchantRole = 'merchant', islandIndex = game.state.currentIslandIndex || 1) {
        const bridgeKitLabel = getItemLabel('bridge_kit', 'Мост-комплект');
        const portableBridgeLabel = getItemLabel('portableBridge', 'Переносной мост');
        const reinforcedBridgeLabel = getItemLabel('reinforcedBridge', 'Усиленный мост');
        const fieldBridgeLabel = getItemLabel('fieldBridge', 'Полевой мостик');
        const absoluteBridgeLabel = getItemLabel('absoluteBridge', 'Абсолютный мост');
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
        const quartermasterWindow = getMerchantIslandWindowProfile('quartermaster', islandIndex);
        const earlyQuartermaster = quartermasterWindow && quartermasterWindow.windowId === 'early-sustain';
        const midQuartermaster = quartermasterWindow && quartermasterWindow.windowId === 'mid-route';
        const lateQuartermaster = quartermasterWindow && quartermasterWindow.windowId === 'late-catalyst';
        const fuelBundleLabel = getItemLabel('fuel_bundle', 'Топливная связка');
        const fullFlaskLabel = getItemLabel('flask_water_full', 'Фляга кипячёной воды');
        const emptyFlaskLabel = getItemLabel('flask_empty', 'Пустая фляга');
        const plankLabel = getItemLabel('wood_plank_basic', 'Доска');
        const ropeLabel = getItemLabel('fiber_rope', 'Верёвка');
        const fishOilLabel = getItemLabel('fish_oil', 'Рыбий жир');
        const frameLabel = getItemLabel('wood_frame_basic', 'Каркас');
        const boatFrameLabel = getItemLabel('boatFrame', 'Рама лодки');

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
                hook: 'Про переправы и честный ответ про крафт.',
                basePrice: 8,
                text: `На верстаке сначала собирается "${bridgeKitLabel}", а затем из него можно довести предмет до "${portableBridgeLabel}". Дальше мостовая ветка уже апгрейдится: "${reinforcedBridgeLabel}" и "${fieldBridgeLabel}" собираются поверх базового моста, а поздний "${absoluteBridgeLabel}" — это отдельная тяжёлая сборка. Так переправы становятся частью крафтовой цепочки, а не случайным лутом.`
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
                title: earlyQuartermaster
                    ? 'Стартовый комплект'
                    : (midQuartermaster ? 'Маршрутные заготовки' : 'Поздний комплект'),
                hook: earlyQuartermaster
                    ? 'На ранних островах интендант полезен не роскошью, а водой и топливом под первую стабилизацию.'
                    : (midQuartermaster
                        ? 'В середине архипелага интендант должен помогать не едой, а мостовыми заготовками.'
                        : 'На поздних островах интендант уже работает как поставщик редких и качественных компонентов.'),
                basePrice: 8,
                text: earlyQuartermaster
                    ? `Ранний интендант должен стабилизировать забег: смотри на "${fuelBundleLabel}", "${fullFlaskLabel}" и "${emptyFlaskLabel}". Это не красивый лут, а прямой способ пережить стартовые острова и не сорвать темп на воде и лагере.`
                    : (midQuartermaster
                        ? `Средний интендант уже полезен как склад заготовок. Если в продаже видишь "${plankLabel}" и "${ropeLabel}", бери их под окно первого моста, воды и ремонта: они экономят сбор и быстрее переводят дерево с травой в готовый маршрутный инструмент.`
                        : `Поздний интендант должен держать не стартовые расходники, а "${fishOilLabel}", "${frameLabel}" и "${boatFrameLabel}". Это уже не просто товар, а редкие катализаторы и качественные компоненты под лодку, фонари, ремонт и позднюю логистику.`)
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
        const islandIndex = Math.max(1, encounter && encounter.islandIndex ? encounter.islandIndex : (game.state.currentIslandIndex || 1));
        const template = getMerchantAdviceTemplate(encounter && encounter.merchantRole ? encounter.merchantRole : 'merchant', islandIndex);

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
                'boat_ready'
            );
        }

        if (islandTier >= 4) {
            itemIds.push(
                'fieldBridge',
                'crossingCable',
                'climberHook',
                'bypassCompass',
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
        const islandWindowProfile = getMerchantIslandWindowProfile(options.merchantRole, islandIndex);
        const islandScenario = getIslandScenario(islandIndex, options.scenario);
        const preferredItemIds = [
            ...getMerchantPreferredComponentItemIds(options.merchantRole, islandIndex),
            ...(islandWindowProfile && Array.isArray(islandWindowProfile.preferredItemIds) ? islandWindowProfile.preferredItemIds : [])
        ].filter((itemId, index, list) => itemId && list.indexOf(itemId) === index);
        const activeQuestBias = bagUpgradeRuntime && typeof bagUpgradeRuntime.getActiveBagQuestGenerationBias === 'function'
            ? bagUpgradeRuntime.getActiveBagQuestGenerationBias(islandIndex)
            : null;
        const preferredCategories = [
            ...(weightKey === 'merchantQuestWeight'
                ? roleProfile.questCategories || []
                : roleProfile.stockCategories || []),
            ...(islandWindowProfile && Array.isArray(islandWindowProfile.preferredCategories)
                ? islandWindowProfile.preferredCategories
                : []),
            ...(weightKey === 'merchantQuestWeight' ? getMerchantQuestBias(islandTier) : getMerchantCategoryBias(islandTier)),
            ...(activeQuestBias ? activeQuestBias.preferredCategories : [])
        ].filter((category, index, list) => category && list.indexOf(category) === index);
        const roleMinTier = Number.isFinite(roleProfile.minTier)
            ? Math.min(roleProfile.minTier, islandTier)
            : undefined;
        const activeQuestMinTier = activeQuestBias && Number.isFinite(activeQuestBias.minTier)
            ? Math.min(activeQuestBias.minTier, islandTier)
            : undefined;
        const includeTierZero = weightKey === 'merchantQuestWeight'
            || preferredItemIds.length > 0;

        if (isTradeIslandEconomyScenario(islandIndex, islandScenario)) {
            preferredCategories.push('value', 'trade', 'utility', 'info');
            preferredItemIds.push('trade_papers', 'market_seal', 'roadChalk', 'pathMarker', 'safeHouseSeal');

            if (islandIndex >= 18) {
                preferredItemIds.push('merchantBeacon');
            }
        }

        const preferredRequirements = [
            ...(activeQuestBias && Array.isArray(activeQuestBias.preferredRequirements)
                ? activeQuestBias.preferredRequirements
                : [])
        ];

        if (isTradeIslandEconomyScenario(islandIndex, islandScenario)) {
            preferredRequirements.push(
                { sourceRecipeTags: ['economy', 'trade'] },
                { sourceRecipeTags: ['route', 'info'] },
                { craftingTags: ['merchant', 'route'] }
            );
        }

        return {
            includeTierZero,
            preferredCategories: preferredCategories.filter((category, index, list) => category && list.indexOf(category) === index),
            preferredItemIds: preferredItemIds.filter((itemId, index, list) => itemId && list.indexOf(itemId) === index),
            preferredRequirements,
            minTier: Number.isFinite(activeQuestMinTier)
                ? Math.max(activeQuestMinTier, roleMinTier || 0)
                : roleMinTier,
            islandWindowProfile,
            islandScenario
        };
    }

    function pickMerchantWindowAnchor(weightKey, islandIndex, random, selectorOptions = {}) {
        const registry = getItemRegistry();
        const islandWindowProfile = selectorOptions && selectorOptions.islandWindowProfile;

        if (
            !registry
            || typeof registry.pickWeightedCatalogDefinition !== 'function'
            || !islandWindowProfile
            || !Array.isArray(islandWindowProfile.guaranteedItemIds)
            || islandWindowProfile.guaranteedItemIds.length === 0
        ) {
            return null;
        }

        return registry.pickWeightedCatalogDefinition(weightKey, islandIndex, random, {
            ...selectorOptions,
            includeItemIds: islandWindowProfile.guaranteedItemIds
        });
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
        const anchorDefinition = pickMerchantWindowAnchor('merchantWeight', islandIndex, random, selectorOptions);
        const definitions = [];

        if (anchorDefinition) {
            definitions.push(anchorDefinition);
        }

        const remainingDefinitions = registry && typeof registry.pickUniqueWeightedCatalogDefinitions === 'function'
            ? registry.pickUniqueWeightedCatalogDefinitions(
                'merchantWeight',
                islandIndex,
                random,
                Math.max(0, stockCount - definitions.length),
                {
                    ...selectorOptions,
                    excludeItemIds: [
                        ...(anchorDefinition ? [anchorDefinition.id] : []),
                        ...(Array.isArray(selectorOptions.excludeItemIds) ? selectorOptions.excludeItemIds : [])
                    ]
                }
            )
            : [];

        definitions.push(...remainingDefinitions);

        return definitions.map((definition, index) => ({
            stockId: `merchant:stock:${islandIndex}:${index}:${definition.id}`,
            itemId: definition.id,
            label: definition.label,
            icon: definition.icon,
            quantity: getBaseQuantityForDefinition(definition, islandTier, random),
            price: pricing && typeof pricing.getMerchantBuyPrice === 'function'
                ? pricing.getMerchantBuyPrice(definition.id, islandIndex)
                : Math.max(1, definition.baseValue || 1),
            islandWindowLabel: selectorOptions && selectorOptions.islandWindowProfile
                ? selectorOptions.islandWindowProfile.label
                : ''
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
            scenario: options.scenario || getIslandScenario(islandIndex),
            label: options.label || 'Странствующий торговец',
            summary: options.summary || 'Торговец принимает заказы, скупает находки и продаёт полезные припасы для переходов.',
            tradeCost: 10 + islandIndex * 4,
            tradeReward: {
                hunger: 12 + islandIndex,
                energy: 12 + islandIndex,
                sleep: 6 + Math.floor(islandIndex * 0.5),
                focus: 4 + Math.floor(islandIndex * 0.4)
            },
            stock: createMerchantStock(islandIndex, random, {
                merchantRole,
                scenario: options.scenario || getIslandScenario(islandIndex)
            }),
            quest: createMerchantQuest(islandIndex, random, {
                merchantRole,
                scenario: options.scenario || getIslandScenario(islandIndex)
            })
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

    function getMerchantCraftingOutputSellMultiplier(itemDefinition) {
        const categories = Array.isArray(itemDefinition && itemDefinition.categories) ? itemDefinition.categories : [];

        if (categories.includes('value') || categories.includes('trade')) {
            return 1.22;
        }

        if (categories.includes('repair') || categories.includes('movement') || categories.includes('bridge') || categories.includes('water')) {
            return 1.16;
        }

        return 1.12;
    }

    function getTradeIslandCraftingSellMultiplier({ islandIndex = 1, scenario = '', merchantRole = 'merchant', itemDefinition = null, componentDefinition = null, craftingOutputDefinition = null } = {}) {
        if (!isTradeIslandEconomyScenario(islandIndex, scenario)) {
            return 1;
        }

        const normalizedIslandIndex = Math.max(1, Math.floor(islandIndex || 1));
        const categories = new Set(Array.isArray(itemDefinition && itemDefinition.categories) ? itemDefinition.categories : []);
        const craftingTags = new Set([
            ...(Array.isArray(componentDefinition && componentDefinition.tags) ? componentDefinition.tags : []),
            ...(Array.isArray(itemDefinition && itemDefinition.craftingTags) ? itemDefinition.craftingTags : [])
        ]);
        let multiplier = 1;

        if (craftingOutputDefinition) {
            if (categories.has('value') || categories.has('trade')) {
                multiplier *= normalizedIslandIndex >= 19 ? 1.26 : 1.18;
            } else if (categories.has('utility') || categories.has('info') || craftingTags.has('route')) {
                multiplier *= normalizedIslandIndex >= 19 ? 1.14 : 1.08;
            }
        } else if (componentDefinition) {
            if (craftingTags.has('merchant') || craftingTags.has('bagQuest')) {
                multiplier *= normalizedIslandIndex >= 19 ? 1.18 : 1.1;
            } else if (craftingTags.has('route')) {
                multiplier *= 1.08;
            }
        }

        if (merchantRole === 'exchanger' || merchantRole === 'collector') {
            multiplier *= 1.04;
        }

        return multiplier;
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
        const craftingOutputDefinition = componentRegistry && typeof componentRegistry.getGeneratedCraftingOutputDefinitionByInventoryItemId === 'function'
            ? componentRegistry.getGeneratedCraftingOutputDefinitionByInventoryItemId(itemId)
            : null;
        const itemDefinition = getItemDefinition(itemId);
        const islandScenario = encounter && typeof encounter.scenario === 'string'
            ? encounter.scenario
            : getIslandScenario(islandIndex);

        if (!encounter) {
            return {
                accepted: false,
                price: 0,
                itemId,
                isComponent: Boolean(componentDefinition),
                isCraftedOutput: Boolean(craftingOutputDefinition),
                matchedInterest: false,
                componentDefinition,
                craftingOutputDefinition,
                message: 'Рядом нет торговца.'
            };
        }

        if (!componentDefinition && !craftingOutputDefinition) {
            return {
                accepted: true,
                price: basePrice,
                itemId,
                isComponent: false,
                isCraftedOutput: false,
                matchedInterest: false,
                componentDefinition: null,
                craftingOutputDefinition: null,
                merchantRole: encounter.merchantRole || 'merchant',
                message: ''
            };
        }

        const craftingDefinition = componentDefinition || craftingOutputDefinition;
        const componentInterest = Array.isArray(craftingDefinition.merchantInterest)
            ? craftingDefinition.merchantInterest
            : [];
        const merchantRole = encounter.merchantRole || 'merchant';
        const matchedInterest = componentInterest.includes(merchantRole);

        if (componentDefinition && !matchedInterest) {
            return {
                accepted: false,
                price: 0,
                itemId,
                isComponent: true,
                isCraftedOutput: false,
                matchedInterest: false,
                componentDefinition,
                craftingOutputDefinition: null,
                merchantRole,
                message: 'Этого торговца такая заготовка не интересует.'
            };
        }

        if (craftingOutputDefinition && !matchedInterest) {
            const scenarioSellMultiplier = getTradeIslandCraftingSellMultiplier({
                islandIndex,
                scenario: islandScenario,
                merchantRole,
                itemDefinition,
                componentDefinition: null,
                craftingOutputDefinition
            });
            const sellPrice = scenarioSellMultiplier > 1
                ? Math.max(basePrice, Math.round(basePrice * scenarioSellMultiplier))
                : basePrice;
            return {
                accepted: true,
                price: sellPrice,
                itemId,
                isComponent: false,
                isCraftedOutput: true,
                matchedInterest: false,
                componentDefinition: null,
                craftingOutputDefinition,
                merchantRole,
                message: scenarioSellMultiplier > 1
                    ? 'На торговом острове эта сборка ценится выше обычного.'
                    : 'Этот торговец купит сборку, но без особой наценки.'
            };
        }

        const sellMultiplier = componentDefinition
            ? getMerchantComponentSellMultiplier(componentDefinition)
            : getMerchantCraftingOutputSellMultiplier(itemDefinition);
        const scenarioSellMultiplier = getTradeIslandCraftingSellMultiplier({
            islandIndex,
            scenario: islandScenario,
            merchantRole,
            itemDefinition,
            componentDefinition,
            craftingOutputDefinition
        });
        const totalSellMultiplier = sellMultiplier * scenarioSellMultiplier;
        const sellPrice = Math.max(basePrice, Math.round(basePrice * totalSellMultiplier));

        return {
            accepted: true,
            price: sellPrice,
            itemId,
            isComponent: Boolean(componentDefinition),
            isCraftedOutput: Boolean(craftingOutputDefinition),
            matchedInterest: true,
            componentDefinition: componentDefinition || null,
            craftingOutputDefinition: craftingOutputDefinition || null,
            merchantRole,
            sellMultiplier: totalSellMultiplier,
            message: componentDefinition
                ? (scenarioSellMultiplier > 1
                    ? 'На торговом острове эта заготовка особенно ценится.'
                    : 'Торговца интересует эта заготовка.')
                : (scenarioSellMultiplier > 1
                    ? 'На торговом острове эта сборка особенно ценится.'
                    : 'Торговца интересует эта сборка.')
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
        getMerchantIslandWindowProfile,
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
