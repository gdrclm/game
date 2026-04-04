(() => {
    const game = window.Game;
    const houseProfiles = game.systems.expeditionHouseProfiles = game.systems.expeditionHouseProfiles || {};
    const shared = game.systems.expeditionShared || {};
    const createIslandRandom = shared.createIslandRandom || (() => Math.random);
    const clamp = shared.clamp || ((value) => value);

    const chestTierLabels = {
        ordinary: 'Обычный сундук',
        rich: 'Богатый сундук',
        hidden: 'Скрытый сундук',
        cursed: 'Проклятый сундук',
        elite: 'Элитный сундук',
        jackpot: 'Джекпот-сундук',
        final: 'Главный сундук'
    };

    const merchantRoleDefinitions = {
        merchant: {
            label: 'Странствующий торговец',
            summary: 'Торговец принимает заказы, скупает находки и продаёт полезные припасы для переходов.',
            houseStyle: 'ordinary',
            buildingTypes: ['shop', 'market']
        },
        fisherman: {
            label: 'Рыбак у берега',
            summary: 'Меняет улов и дорожные припасы так, будто каждая сделка должна помочь пережить ещё один остров.',
            houseStyle: 'poor',
            buildingTypes: ['fisherHouse', 'shed', 'barn']
        },
        bridgewright: {
            label: 'Мостовик-плотник',
            summary: 'Следит за переправами, запасом досок и инструментами, которые экономят силы на дальних переходах.',
            houseStyle: 'ordinary',
            buildingTypes: ['bridgeHouse', 'workshop', 'storehouse']
        },
        junkDealer: {
            label: 'Старьёвщик',
            summary: 'Скупает сомнительные находки, любит рискованный хлам и почти всегда предлагает неровную сделку.',
            houseStyle: 'ordinary',
            buildingTypes: ['storehouse', 'shed', 'sealedHouse']
        },
        storyteller: {
            label: 'Странник-рассказчик',
            summary: 'Собирает слухи о дальних островах, держит редкие дорожные мелочи и торгует намёками не дешевле золота.',
            houseStyle: 'ordinary',
            buildingTypes: ['inn', 'chapel', 'tower']
        },
        exchanger: {
            label: 'Обменщик',
            summary: 'Работает на обмене и давит на жадность: сильные вещи есть, но почти каждая сделка кусается.',
            houseStyle: 'rich',
            buildingTypes: ['market', 'shop', 'headmanHouse']
        },
        quartermaster: {
            label: 'Интендант',
            summary: 'Держит экспедиционную выкладку под контролем и любит, когда каждая вещь в сумке оправдывает своё место.',
            houseStyle: 'ordinary',
            buildingTypes: ['storehouse', 'inn', 'headmanHouse']
        },
        collector: {
            label: 'Коллекционер',
            summary: 'Охотится за дорогими и странными вещами. Полезен только тем, кто уже научился носить на себе позднюю игру.',
            houseStyle: 'rich',
            buildingTypes: ['collectorHouse', 'tower', 'richHouse']
        }
    };

    const buildingTypeDefinitions = {
        fisherHouse: {
            label: 'Рыбацкий дом',
            summary: 'Небольшой дом у кромки воды с сетями, снастями и запасами еды.',
            houseStyle: 'poor'
        },
        workshop: {
            label: 'Мастерская',
            summary: 'Рабочий дом с инструментами, верстаком и запахом тяжёлой полезной работы.',
            houseStyle: 'ordinary'
        },
        storehouse: {
            label: 'Склад',
            summary: 'Хранилище тяжёлых запасов, где почти каждая полезная вещь стоит лишних шагов.',
            houseStyle: 'ordinary'
        },
        shop: {
            label: 'Лавка',
            summary: 'Тесная торговая точка с вещами для дороги и несколькими дорогими решениями.',
            houseStyle: 'ordinary'
        },
        barn: {
            label: 'Амбар',
            summary: 'Грубый амбар с припасами, остатками еды и ощущением, что здесь давно экономят на всём.',
            houseStyle: 'poor'
        },
        market: {
            label: 'Рынок',
            summary: 'Островная торговая точка, где выбор большой, но ресурсов всё равно хватает только на часть возможностей.',
            houseStyle: 'rich'
        },
        inn: {
            label: 'Постоялый двор',
            summary: 'Хороший ночлег с короткой передышкой, который никогда не становится бесплатным спасением.',
            houseStyle: 'rich'
        },
        chapel: {
            label: 'Часовня с алтарём',
            summary: 'Тихое место, где можно собраться с мыслями и частично прийти в себя перед следующим переходом.',
            houseStyle: 'ordinary'
        },
        headmanHouse: {
            label: 'Дом старосты',
            summary: 'Крупный дом у центральной точки поселения, где всегда ощущается чужой контроль над ресурсами.',
            houseStyle: 'rich'
        },
        tower: {
            label: 'Старая башня',
            summary: 'Каменный дом-башня, где ценные вещи почти никогда не лежат близко и дёшево.',
            houseStyle: 'rich'
        },
        sealedHouse: {
            label: 'Запечатанный дом',
            summary: 'Закрытый и недружелюбный дом, где полезная находка почти всегда идёт рядом с риском.',
            houseStyle: 'trap'
        },
        collectorHouse: {
            label: 'Дом коллекционера',
            summary: 'Тихий дом, в котором редкости важнее простого выживания и поэтому стоят особенно дорого.',
            houseStyle: 'rich'
        },
        bridgeHouse: {
            label: 'Дом мостовика',
            summary: 'Рабочий дом у переправ и дорожных развилок, где каждая доска будто знает цену лишнего шага.',
            houseStyle: 'ordinary'
        },
        shed: {
            label: 'Сарай',
            summary: 'Небольшая пристройка со случайными остатками, хламом и редкой полезной мелочью.',
            houseStyle: 'poor'
        },
        richHouse: {
            label: 'Богатый дом',
            summary: 'Добротный большой дом, где шанс на сильную находку чувствуется сразу, как и цена ошибки.',
            houseStyle: 'rich'
        },
        abandonedHut: {
            label: 'Заброшенная хижина',
            summary: 'Старый дом, где жизнь уже ушла, но оставила после себя следы и редкие остатки.',
            houseStyle: 'empty'
        }
    };

    const artisanBuildingByNpcKind = {
        bagNovice: 'workshop',
        roadLeatherworker: 'workshop',
        quartermaster: 'storehouse',
        smuggler: 'sealedHouse',
        collector: 'collectorHouse',
        legendaryBagmaster: 'tower'
    };

    function getMerchantRoleDefinition(role = 'merchant') {
        return merchantRoleDefinitions[role] || merchantRoleDefinitions.merchant;
    }

    function getBuildingTypeDefinition(buildingType) {
        return buildingTypeDefinitions[buildingType] || null;
    }

    function pickListEntry(list, random, fallback = null) {
        if (!Array.isArray(list) || list.length === 0) {
            return fallback;
        }

        return list[Math.floor(random() * list.length)] || fallback;
    }

    function getSettlementStage(progression) {
        if (!progression) {
            return 'wild';
        }

        return progression.settlementStage || (
            progression.islandIndex >= 21
                ? 'village'
                : (progression.islandIndex >= 18
                    ? 'protoVillage'
                    : (progression.islandIndex >= 13
                        ? 'hamlet'
                        : (progression.islandIndex >= 8 ? 'outpost' : 'wild')))
        );
    }

    function getSettlementType(progression) {
        return progression && progression.settlementType ? progression.settlementType : null;
    }

    function getSlotDistrict(slot) {
        if (!slot || !slot.chunk || !slot.chunk.tags) {
            return 'outer';
        }

        if (slot.chunk.tags.has('vault')) {
            return 'depth';
        }

        if (slot.chunk.tags.has('junction')) {
            return 'center';
        }

        if (slot.chunk.tags.has('entry')) {
            return 'landing';
        }

        if (slot.chunk.tags.has('tip')) {
            return 'waterfront';
        }

        if (slot.chunk.tags.has('remote')) {
            return 'depth';
        }

        if (slot.chunk.tags.has('neck')) {
            return 'corridor';
        }

        if (slot.chunk.tags.has('leaf')) {
            return 'edge';
        }

        return 'outer';
    }

    function getLootSystem() {
        return game.systems.loot || null;
    }

    function getShopRuntime() {
        return game.systems.shopRuntime || null;
    }

    function getBagUpgradeRuntime() {
        return game.systems.bagUpgradeRuntime || null;
    }

    function getNpcRegistry() {
        return game.systems.npcRegistry || null;
    }

    function cloneRewardMap(rewardMap) {
        return rewardMap ? { ...rewardMap } : undefined;
    }

    function cloneNpcReward(reward) {
        return reward ? { ...reward } : undefined;
    }

    function cloneNpcDialogueProfile(profile) {
        if (!profile) {
            return undefined;
        }

        return {
            ...profile,
            repeatScenes: Array.isArray(profile.repeatScenes) ? profile.repeatScenes.slice() : []
        };
    }

    function cloneNpcEncounterProfile(profile) {
        if (!profile) {
            return null;
        }

        return {
            ...profile,
            reward: cloneNpcReward(profile.reward),
            dialogueProfile: cloneNpcDialogueProfile(profile.dialogueProfile)
        };
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

    function getChunkKey(chunk) {
        return chunk ? `${chunk.chunkX},${chunk.chunkY}` : '';
    }

    function ensureSpecialInteractionPlanList(chunk) {
        if (!chunk) {
            return [];
        }

        chunk.specialInteractionPlans = Array.isArray(chunk.specialInteractionPlans)
            ? chunk.specialInteractionPlans
            : [];
        return chunk.specialInteractionPlans;
    }

    function pickWeightedProfile(entries, random) {
        const candidates = (entries || []).filter((entry) => entry && entry.profile && Number.isFinite(entry.weight) && entry.weight > 0);
        const totalWeight = candidates.reduce((sum, entry) => sum + entry.weight, 0);

        if (candidates.length === 0 || totalWeight <= 0) {
            return candidates[0] ? candidates[0].profile : null;
        }

        let roll = random() * totalWeight;

        for (const entry of candidates) {
            roll -= entry.weight;
            if (roll <= 0) {
                return entry.profile;
            }
        }

        return candidates[candidates.length - 1].profile;
    }

    function getIslandOriginalNpcChunkWeight(chunk, progression, profile) {
        if (!chunk || !progression || !profile) {
            return 0;
        }

        let weight = getSettlementChunkSelectionWeight(chunk, progression);

        switch (profile.spawnHint) {
        case 'water':
            if (chunk.tags.has('tip')) {
                weight += 4.6;
            }
            if (chunk.tags.has('entry')) {
                weight += 2.2;
            }
            if (chunk.tags.has('junction')) {
                weight += 0.9;
            }
            if (chunk.tags.has('vault')) {
                weight -= 0.8;
            }
            break;
        case 'bridge':
            if (chunk.tags.has('neck')) {
                weight += 4.4;
            }
            if (chunk.tags.has('junction')) {
                weight += 3.1;
            }
            if (chunk.tags.has('entry')) {
                weight += 1.6;
            }
            if (chunk.tags.has('tip')) {
                weight += 0.6;
            }
            break;
        case 'meadow':
            if (chunk.tags.has('leaf')) {
                weight += 3.1;
            }
            if (chunk.tags.has('remote')) {
                weight += 2.2;
            }
            if (chunk.tags.has('tip')) {
                weight += 1.3;
            }
            if (chunk.tags.has('junction')) {
                weight += 0.5;
            }
            break;
        case 'settlement':
            if (chunk.tags.has('junction')) {
                weight += 4;
            }
            if (chunk.tags.has('entry')) {
                weight += 2;
            }
            if (chunk.tags.has('tip')) {
                weight += 1;
            }
            if (chunk.tags.has('remote')) {
                weight -= 0.7;
            }
            break;
        case 'remote':
            if (chunk.tags.has('remote')) {
                weight += 4.4;
            }
            if (chunk.tags.has('vault')) {
                weight += 2.8;
            }
            if (chunk.tags.has('leaf')) {
                weight += 2.2;
            }
            if (chunk.tags.has('entry')) {
                weight -= 2;
            }
            break;
        case 'trail':
        default:
            if (chunk.tags.has('junction')) {
                weight += 3.5;
            }
            if (chunk.tags.has('entry')) {
                weight += 2.1;
            }
            if (chunk.tags.has('neck')) {
                weight += 1.8;
            }
            if (chunk.tags.has('leaf')) {
                weight += 1.2;
            }
            break;
        }

        return weight;
    }

    function pickIslandOriginalNpcChunk(island, profile, random, usedChunkKeys = new Set()) {
        if (!island || !Array.isArray(island.chunks) || island.chunks.length === 0 || !profile) {
            return null;
        }

        const rankedChunks = [...island.chunks].sort((left, right) => {
            const weightDelta = getIslandOriginalNpcChunkWeight(right, island.progression, profile)
                - getIslandOriginalNpcChunkWeight(left, island.progression, profile);

            if (Math.abs(weightDelta) > 0.001) {
                return weightDelta;
            }

            return random() < 0.5 ? -1 : 1;
        });

        const availableChunk = rankedChunks.find((chunk) => !usedChunkKeys.has(getChunkKey(chunk)));
        return availableChunk || rankedChunks[0] || null;
    }

    function buildIslandOriginalNpcEncounter(profile, islandIndex, options = {}) {
        const repeatAppearance = Boolean(options.repeatAppearance);
        const summary = repeatAppearance
            ? `${profile.summary} По нему видно, что такие дальние острова для него уже стали привычной землёй.`
            : profile.summary;

        return cloneNpcEncounterProfile({
            ...profile,
            islandIndex,
            summary,
            repeatAppearance
        });
    }

    function chooseRepeatIslandOriginalNpcProfile(islandIndex, featuredProfile, random) {
        const npcRegistry = getNpcRegistry();
        const roster = npcRegistry && typeof npcRegistry.getIslandOriginalNpcRoster === 'function'
            ? npcRegistry.getIslandOriginalNpcRoster(islandIndex - 1)
            : [];
        const featuredId = featuredProfile ? featuredProfile.id : null;
        const weightedProfiles = roster
            .filter((profile) => profile && profile.introIsland >= 5 && profile.id !== featuredId)
            .map((profile) => ({
                profile,
                weight: 1
                    + (profile.introIsland >= islandIndex - 5 ? 1.7 : 0.5)
                    + (profile.introIsland <= islandIndex - 10 ? 0.3 : 0)
                    + (featuredProfile && profile.visualRole !== featuredProfile.visualRole ? 0.45 : 0)
            }));

        return pickWeightedProfile(weightedProfiles, random);
    }

    function assignIslandSpecialNpcPlan(island, random) {
        const npcRegistry = getNpcRegistry();
        if (
            !island
            || !npcRegistry
            || typeof npcRegistry.getIslandOriginalNpcProfileByIntroIsland !== 'function'
            || island.islandIndex < 5
        ) {
            return;
        }

        const featuredProfile = npcRegistry.getIslandOriginalNpcProfileByIntroIsland(island.islandIndex);
        if (!featuredProfile) {
            return;
        }

        const usedChunkKeys = new Set();
        const featuredChunk = pickIslandOriginalNpcChunk(island, featuredProfile, random, usedChunkKeys);

        if (featuredChunk) {
            ensureSpecialInteractionPlanList(featuredChunk).push(
                buildIslandOriginalNpcEncounter(featuredProfile, island.islandIndex)
            );
            usedChunkKeys.add(getChunkKey(featuredChunk));
        }

        if (island.islandIndex < 9 || random() >= 0.46) {
            return;
        }

        const repeatProfile = chooseRepeatIslandOriginalNpcProfile(island.islandIndex, featuredProfile, random);
        if (!repeatProfile) {
            return;
        }

        const repeatChunk = pickIslandOriginalNpcChunk(island, repeatProfile, random, usedChunkKeys);
        if (!repeatChunk) {
            return;
        }

        ensureSpecialInteractionPlanList(repeatChunk).push(
            buildIslandOriginalNpcEncounter(repeatProfile, island.islandIndex, { repeatAppearance: true })
        );
    }

    function cloneHouseProfile(profile) {
        return {
            ...profile,
            statReward: cloneRewardMap(profile.statReward),
            tradeReward: cloneRewardMap(profile.tradeReward),
            statPenalty: cloneRewardMap(profile.statPenalty),
            quest: profile.quest ? { ...profile.quest } : undefined,
            stock: Array.isArray(profile.stock)
                ? profile.stock.map((stockItem) => ({ ...stockItem }))
                : undefined,
            lootPlan: cloneLootPlan(profile.lootPlan)
        };
    }

    function getChunkHouseWeight(chunk) {
        let weight = 1 + chunk.distanceFromEntry * 1.25;

        if (chunk.tags.has('remote')) {
            weight += 2.6;
        }

        if (chunk.tags.has('tip')) {
            weight += 1.8;
        }

        if (chunk.tags.has('vault')) {
            weight += 4;
        }

        if (chunk.tags.has('junction')) {
            weight += 1.1;
        }

        if (chunk.tags.has('entry')) {
            weight -= 1.75;
        }

        return weight;
    }

    function getChestHouseStyle(chestTier) {
        switch (chestTier) {
        case 'rich':
        case 'elite':
        case 'jackpot':
        case 'final':
            return 'rich';
        case 'hidden':
            return 'empty';
        case 'cursed':
            return 'trap';
        default:
            return 'ordinary';
        }
    }

    function pickWeightedKey(weightMap, random) {
        const entries = Object.entries(weightMap).filter(([, weight]) => Number.isFinite(weight) && weight > 0);
        const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);

        if (entries.length === 0 || totalWeight <= 0) {
            return entries[0] ? entries[0][0] : 'ordinary';
        }

        let roll = random() * totalWeight;

        for (const [key, weight] of entries) {
            roll -= weight;
            if (roll <= 0) {
                return key;
            }
        }

        return entries[entries.length - 1][0];
    }

    function chooseChestTier(progression, random, options = {}) {
        if (options.forcedChestTier) {
            return options.forcedChestTier;
        }

        const islandIndex = progression.islandIndex;
        const scenario = progression.scenario || 'normal';
        const remote = Boolean(options.remote);
        const vault = Boolean(options.vault);
        const weights = {
            ordinary: Math.max(14, 78 - islandIndex * 4),
            rich: islandIndex >= 3 ? 12 + islandIndex * 2.2 : 0,
            hidden: islandIndex >= 4 ? 8 + islandIndex * 1.4 : 0,
            cursed: islandIndex >= 5 ? 5 + islandIndex * 1.35 : 0,
            elite: islandIndex >= 7 ? 2 + islandIndex * 0.95 : 0,
            jackpot: islandIndex >= 10 ? 0.5 + islandIndex * 0.18 : 0
        };

        if (remote) {
            weights.hidden += 6;
            weights.rich += 5;
            weights.elite += 2.5;
        }

        if (vault) {
            weights.rich += 8;
            weights.elite += 7;
            weights.jackpot += 3.5;
            weights.ordinary = Math.max(2, weights.ordinary - 18);
        }

        if (scenario === 'tradeIsland') {
            weights.rich += 10;
            weights.elite += 3;
            weights.hidden = Math.max(0, weights.hidden - 2);
            weights.cursed = Math.max(0, weights.cursed - 2);
        } else if (scenario === 'trapIsland') {
            weights.hidden += 10;
            weights.cursed += 16;
            weights.rich = Math.max(1, weights.rich - 3);
            weights.ordinary = Math.max(4, weights.ordinary - 10);
        } else if (scenario === 'jackpotIsland') {
            weights.rich += 14;
            weights.elite += 14;
            weights.jackpot += 7;
            weights.ordinary = Math.max(2, weights.ordinary - 16);
        }

        return pickWeightedKey(weights, random);
    }

    function buildChestSummary(chestTier) {
        switch (chestTier) {
        case 'rich':
            return 'Внутри слышен звон монет и видно богатое убранство.';
        case 'hidden':
            return 'Спрятанный тайник, замаскированный среди пыли и досок.';
        case 'cursed':
            return 'От сундука веет опасностью. Он выглядит ценным, но ненадёжным.';
        case 'elite':
            return 'Редкая богатая находка с лучшей добычей, чем у обычных сундуков.';
        case 'jackpot':
            return 'Особенно щедрый сундук с дорогой и редкой добычей.';
        default:
            return 'Надёжный тайник с припасами и полезными вещами.';
        }
    }

    function createChestProfile(progression, random, options = {}) {
        const chestTier = chooseChestTier(progression, random, options);
        const houseStyle = options.houseStyle || getChestHouseStyle(chestTier);

        return {
            kind: 'chest',
            chestTier,
            houseStyle,
            label: chestTierLabels[chestTier] || chestTierLabels.ordinary,
            summary: buildChestSummary(chestTier)
        };
    }

    function createFinalChestProfile() {
        return {
            kind: 'finalChest',
            chestTier: 'final',
            houseStyle: 'rich',
            label: chestTierLabels.final,
            summary: 'Центральная награда архипелага. Его открытие завершает экспедицию.'
        };
    }

    function createCampProfile(islandIndex, options = {}) {
        return {
            kind: 'shelter',
            houseStyle: options.houseStyle || 'poor',
            label: 'Полевой лагерь',
            summary: 'Небольшая стоянка с палаткой и костром. Здесь можно переждать холод и выспаться.',
            guaranteedSafePoint: Boolean(options.guaranteedSafePoint),
            statReward: {
                sleep: 8 + Math.floor(islandIndex * 0.5),
                energy: 5 + Math.floor(islandIndex * 0.35)
            }
        };
    }

    function createWellProfile(islandIndex, options = {}) {
        return {
            kind: 'well',
            houseStyle: options.houseStyle || 'ordinary',
            label: 'Колодец',
            summary: 'Чистая вода и короткая передышка помогают привести себя в порядок перед следующим переходом.',
            guaranteedSafePoint: Boolean(options.guaranteedSafePoint),
            statReward: {
                hunger: 14 + Math.floor(islandIndex * 0.7),
                focus: 10 + Math.floor(islandIndex * 0.5),
                cold: 6 + Math.floor(islandIndex * 0.35)
            }
        };
    }

    function createForageProfile(islandIndex, options = {}) {
        return {
            kind: 'forage',
            houseStyle: options.houseStyle || 'ordinary',
            label: 'Куст полевых ягод',
            summary: 'Невысокий куст с ягодами. Здесь можно быстро собрать еду прямо в поле.',
            guaranteedSafePoint: Boolean(options.guaranteedSafePoint),
            hungerRestoreMin: 50,
            hungerRestoreMax: 75,
            statReward: {
                energy: 8 + Math.floor(islandIndex * 0.45)
            }
        };
    }

    function chooseOutpostMerchantRole(random) {
        return pickListEntry(['fisherman', 'storyteller', 'merchant'], random, 'merchant');
    }

    function chooseHamletMerchantRole(random) {
        return pickListEntry(['fisherman', 'bridgewright', 'junkDealer', 'merchant', 'storyteller'], random, 'merchant');
    }

    function chooseSettlementPrimaryMerchantRole(progression, random) {
        const islandIndex = progression && progression.islandIndex ? progression.islandIndex : 1;
        const settlementType = getSettlementType(progression);

        switch (settlementType) {
        case 'fishing':
            return pickListEntry(['fisherman', 'bridgewright', 'merchant'], random, 'fisherman');
        case 'trade':
            return islandIndex >= 20
                ? pickListEntry(['exchanger', 'merchant', 'quartermaster', 'junkDealer'], random, 'exchanger')
                : pickListEntry(['exchanger', 'merchant', 'junkDealer'], random, 'exchanger');
        case 'craft':
            return islandIndex >= 20
                ? pickListEntry(['bridgewright', 'quartermaster', 'merchant'], random, 'bridgewright')
                : pickListEntry(['bridgewright', 'merchant', 'storyteller'], random, 'bridgewright');
        case 'rich':
            return islandIndex >= 20
                ? pickListEntry(['exchanger', 'collector', 'storyteller'], random, 'exchanger')
                : pickListEntry(['exchanger', 'merchant', 'storyteller'], random, 'exchanger');
        case 'ruined':
            return pickListEntry(['junkDealer', 'storyteller', 'fisherman'], random, 'junkDealer');
        default:
            return pickListEntry(['merchant', 'storyteller', 'fisherman'], random, 'merchant');
        }
    }

    function chooseSettlementSecondaryMerchantRole(progression, random) {
        const islandIndex = progression && progression.islandIndex ? progression.islandIndex : 1;
        const settlementType = getSettlementType(progression);

        switch (settlementType) {
        case 'fishing':
            return pickListEntry(['merchant', 'storyteller', 'bridgewright'], random, 'merchant');
        case 'trade':
            return islandIndex >= 20
                ? pickListEntry(['merchant', 'junkDealer', 'quartermaster', 'collector'], random, 'merchant')
                : pickListEntry(['merchant', 'junkDealer', 'quartermaster'], random, 'merchant');
        case 'craft':
            return islandIndex >= 20
                ? pickListEntry(['merchant', 'junkDealer', 'fisherman', 'bridgewright'], random, 'merchant')
                : pickListEntry(['merchant', 'junkDealer', 'fisherman'], random, 'merchant');
        case 'rich':
            return islandIndex >= 20
                ? pickListEntry(['collector', 'merchant', 'storyteller'], random, 'merchant')
                : pickListEntry(['merchant', 'storyteller', 'exchanger'], random, 'merchant');
        case 'ruined':
            return islandIndex >= 20
                ? pickListEntry(['junkDealer', 'merchant', 'storyteller', 'collector'], random, 'junkDealer')
                : pickListEntry(['junkDealer', 'merchant', 'storyteller'], random, 'junkDealer');
        default:
            return 'merchant';
        }
    }

    function createMerchantProfile(progression, random, options = {}) {
        const islandIndex = progression.islandIndex;
        const shopRuntime = getShopRuntime();
        const lootSystem = getLootSystem();
        const merchantRole = options.merchantRole || 'merchant';
        const roleDefinition = getMerchantRoleDefinition(merchantRole);
        const houseStyle = options.houseStyle
            || roleDefinition.houseStyle
            || (progression.scenario === 'tradeIsland' ? 'rich' : 'ordinary');
        const label = options.label
            || (merchantRole !== 'merchant' ? roleDefinition.label : null)
            || (progression.scenario === 'tradeIsland' ? 'Богатый торговый дом' : 'Странствующий торговец');
        const summary = options.summary
            || (merchantRole !== 'merchant' ? roleDefinition.summary : null)
            || (progression.scenario === 'tradeIsland'
                ? 'Торговая точка с лучшим выбором снаряжения и заметно более богатой обстановкой.'
                : 'Торговец принимает заказы, скупает находки и продаёт полезные припасы для переходов.');

        if (shopRuntime && typeof shopRuntime.createMerchantEncounterProfile === 'function') {
            const profile = shopRuntime.createMerchantEncounterProfile(islandIndex, random, {
                merchantRole,
                label,
                summary
            });
            profile.houseStyle = houseStyle;
            profile.merchantRole = merchantRole;
            profile.label = label;
            profile.summary = summary;
            return profile;
        }

        const stock = lootSystem && typeof lootSystem.createMerchantStock === 'function'
            ? lootSystem.createMerchantStock(islandIndex, random, { merchantRole })
            : [];
        const quest = lootSystem && typeof lootSystem.createMerchantQuest === 'function'
            ? lootSystem.createMerchantQuest(islandIndex, random, { merchantRole })
            : null;

        return {
            kind: 'merchant',
            merchantRole,
            houseStyle,
            label,
            summary,
            tradeCost: 10 + islandIndex * 4,
            tradeReward: {
                hunger: 12 + islandIndex,
                energy: 12 + islandIndex,
                sleep: 6 + Math.floor(islandIndex * 0.5),
                focus: 4 + Math.floor(islandIndex * 0.4)
            },
            stock,
            quest
        };
    }

    function createStageAnchorMerchantProfile(progression, random) {
        const stage = getSettlementStage(progression);

        if (stage === 'outpost') {
            return createMerchantProfile(progression, random, {
                merchantRole: chooseOutpostMerchantRole(random)
            });
        }

        if (stage === 'hamlet') {
            return createMerchantProfile(progression, random, {
                merchantRole: chooseHamletMerchantRole(random)
            });
        }

        if (stage === 'protoVillage' || stage === 'village') {
            return createMerchantProfile(progression, random, {
                merchantRole: chooseSettlementPrimaryMerchantRole(progression, random)
            });
        }

        return null;
    }

    function createSettlementSecondaryMerchantProfile(progression, random) {
        const stage = getSettlementStage(progression);

        if (stage === 'hamlet') {
            return createMerchantProfile(progression, random, {
                merchantRole: pickListEntry(['merchant', 'fisherman', 'bridgewright'], random, 'merchant')
            });
        }

        if (stage === 'protoVillage' || stage === 'village') {
            return createMerchantProfile(progression, random, {
                merchantRole: chooseSettlementSecondaryMerchantRole(progression, random)
            });
        }

        return null;
    }

    function createSettlementSupportProfile(progression, random) {
        const stage = getSettlementStage(progression);
        const islandIndex = progression && progression.islandIndex ? progression.islandIndex : 1;
        const settlementType = getSettlementType(progression);

        if (stage === 'hamlet') {
            return random() < 0.55
                ? createForageProfile(progression.islandIndex)
                : createWellProfile(progression.islandIndex);
        }

        if (stage !== 'protoVillage' && stage !== 'village') {
            return null;
        }

        if (settlementType === 'fishing') {
            return random() < 0.7
                ? createForageProfile(progression.islandIndex, { houseStyle: 'poor' })
                : createCampProfile(progression.islandIndex, { houseStyle: 'ordinary' });
        }

        if (settlementType === 'trade') {
            return random() < 0.5
                ? createWellProfile(progression.islandIndex, { houseStyle: 'ordinary' })
                : createCampProfile(progression.islandIndex, { houseStyle: 'rich' });
        }

        if (settlementType === 'craft') {
            return random() < 0.55
                ? createWellProfile(progression.islandIndex, { houseStyle: 'ordinary' })
                : createForageProfile(progression.islandIndex, { houseStyle: 'ordinary' });
        }

        if (settlementType === 'rich') {
            return random() < 0.65
                ? createCampProfile(progression.islandIndex, { houseStyle: 'rich' })
                : createWellProfile(progression.islandIndex, { houseStyle: 'ordinary' });
        }

        return random() < 0.5
            ? createCampProfile(progression.islandIndex, { houseStyle: 'poor' })
            : createWellProfile(progression.islandIndex, { houseStyle: 'ordinary' });
    }

    function resolveMerchantRoleForSlot(profile, progression, district, random) {
        if (!profile || profile.kind !== 'merchant') {
            return null;
        }

        if (profile.merchantRole) {
            return profile.merchantRole;
        }

        const stage = getSettlementStage(progression);
        const islandIndex = progression && progression.islandIndex ? progression.islandIndex : 1;
        const settlementType = getSettlementType(progression);

        if (stage === 'outpost') {
            if (district === 'landing' || district === 'waterfront') {
                return random() < 0.72 ? 'fisherman' : 'merchant';
            }

            return random() < 0.4 ? 'storyteller' : 'merchant';
        }

        if (stage === 'hamlet') {
            if (district === 'waterfront') {
                return random() < 0.55 ? 'fisherman' : 'merchant';
            }

            if (district === 'center') {
                return pickListEntry(['merchant', 'bridgewright', 'storyteller'], random, 'merchant');
            }

            if (district === 'edge' || district === 'corridor') {
                return pickListEntry(['junkDealer', 'merchant', 'fisherman'], random, 'merchant');
            }

            return chooseHamletMerchantRole(random);
        }

        if (stage === 'protoVillage' || stage === 'village') {
            if (settlementType === 'fishing') {
                if (district === 'waterfront' || district === 'landing') {
                    return random() < 0.7 ? 'fisherman' : 'bridgewright';
                }

                if (district === 'center') {
                    return pickListEntry(['merchant', 'storyteller'], random, 'merchant');
                }

                return pickListEntry(['bridgewright', 'merchant', 'junkDealer'], random, 'merchant');
            }

            if (settlementType === 'trade') {
                if (district === 'center') {
                    return pickListEntry(['exchanger', 'merchant', 'quartermaster'], random, 'exchanger');
                }

                if (district === 'depth') {
                    return islandIndex >= 20
                        ? pickListEntry(['collector', 'merchant', 'storyteller'], random, 'merchant')
                        : pickListEntry(['merchant', 'storyteller', 'junkDealer'], random, 'merchant');
                }

                return pickListEntry(['junkDealer', 'merchant', 'quartermaster'], random, 'merchant');
            }

            if (settlementType === 'craft') {
                if (district === 'center') {
                    return pickListEntry(['bridgewright', 'quartermaster', 'merchant'], random, 'bridgewright');
                }

                if (district === 'depth') {
                    return islandIndex >= 20
                        ? pickListEntry(['collector', 'merchant'], random, 'merchant')
                        : pickListEntry(['merchant', 'bridgewright'], random, 'merchant');
                }

                return pickListEntry(['bridgewright', 'junkDealer', 'merchant'], random, 'merchant');
            }

            if (settlementType === 'rich') {
                if (district === 'depth') {
                    return islandIndex >= 20
                        ? pickListEntry(['collector', 'exchanger', 'storyteller'], random, 'collector')
                        : pickListEntry(['exchanger', 'merchant', 'storyteller'], random, 'exchanger');
                }

                if (district === 'center') {
                    return pickListEntry(['exchanger', 'merchant', 'quartermaster'], random, 'exchanger');
                }

                return pickListEntry(['merchant', 'storyteller'], random, 'merchant');
            }

            if (district === 'depth') {
                return islandIndex >= 20
                    ? pickListEntry(['junkDealer', 'storyteller', 'collector'], random, 'junkDealer')
                    : pickListEntry(['junkDealer', 'storyteller', 'merchant'], random, 'junkDealer');
            }

            return pickListEntry(['junkDealer', 'merchant', 'fisherman'], random, 'junkDealer');
        }

        return 'merchant';
    }

    function getSettlementChunkSelectionWeight(chunk, progression) {
        const stage = getSettlementStage(progression);
        const settlementType = getSettlementType(progression);
        let weight = getChunkHouseWeight(chunk);

        if (!chunk || !chunk.tags) {
            return weight;
        }

        if (stage === 'outpost') {
            if (chunk.tags.has('entry')) {
                weight += 1.8;
            }

            if (chunk.tags.has('tip')) {
                weight += 1.5;
            }
        } else if (stage === 'hamlet') {
            if (chunk.tags.has('junction')) {
                weight += 2.1;
            }

            if (chunk.tags.has('tip')) {
                weight += 1.1;
            }

            if (chunk.tags.has('entry')) {
                weight += 0.8;
            }
        } else if (stage === 'protoVillage' || stage === 'village') {
            if (chunk.tags.has('junction')) {
                weight += 3;
            }

            if (chunk.tags.has('tip')) {
                weight += 2.4;
            }

            if (chunk.tags.has('entry')) {
                weight += 1.1;
            }

            if (chunk.tags.has('leaf')) {
                weight += 0.7;
            }

            if (chunk.tags.has('neck')) {
                weight += 0.7;
            }
        }

        if (settlementType === 'fishing') {
            if (chunk.tags.has('tip')) {
                weight += 2.2;
            }

            if (chunk.tags.has('entry')) {
                weight += 0.5;
            }
        } else if (settlementType === 'trade') {
            if (chunk.tags.has('junction')) {
                weight += 1.7;
            }

            if (chunk.tags.has('neck')) {
                weight += 1;
            }
        } else if (settlementType === 'craft') {
            if (chunk.tags.has('junction')) {
                weight += 1.1;
            }

            if (chunk.tags.has('neck') || chunk.tags.has('remote')) {
                weight += 1.2;
            }
        } else if (settlementType === 'rich') {
            if (chunk.tags.has('vault') || chunk.tags.has('remote')) {
                weight += 1.5;
            }
        } else if (settlementType === 'ruined') {
            if (chunk.tags.has('remote')) {
                weight += 1.6;
            }

            if (chunk.tags.has('tip')) {
                weight += 0.8;
            }
        }

        return weight;
    }

    function ensurePreferredChunkSelection(selectedChunks, rankedChunks, progression, predicate) {
        if (!Array.isArray(selectedChunks) || selectedChunks.length === 0 || typeof predicate !== 'function') {
            return;
        }

        if (selectedChunks.some((chunk) => predicate(chunk))) {
            return;
        }

        const candidate = rankedChunks.find((chunk) => !selectedChunks.includes(chunk) && predicate(chunk));
        if (!candidate) {
            return;
        }

        let replaceIndex = -1;
        let lowestWeight = Infinity;

        selectedChunks.forEach((chunk, index) => {
            if (predicate(chunk)) {
                return;
            }

            const chunkWeight = getSettlementChunkSelectionWeight(chunk, progression);
            if (chunkWeight < lowestWeight) {
                lowestWeight = chunkWeight;
                replaceIndex = index;
            }
        });

        if (replaceIndex >= 0) {
            selectedChunks[replaceIndex] = candidate;
        }
    }

    function applySettlementChunkCoverage(selectedChunks, rankedChunks, progression) {
        const stage = getSettlementStage(progression);
        const settlementType = getSettlementType(progression);

        if (stage === 'outpost') {
            ensurePreferredChunkSelection(selectedChunks, rankedChunks, progression, (chunk) => chunk.tags.has('entry') || chunk.tags.has('tip'));
            return;
        }

        if (stage === 'hamlet') {
            ensurePreferredChunkSelection(selectedChunks, rankedChunks, progression, (chunk) => chunk.tags.has('junction'));
            ensurePreferredChunkSelection(selectedChunks, rankedChunks, progression, (chunk) => chunk.tags.has('tip') || chunk.tags.has('entry'));
            return;
        }

        if (stage !== 'protoVillage' && stage !== 'village') {
            return;
        }

        ensurePreferredChunkSelection(selectedChunks, rankedChunks, progression, (chunk) => chunk.tags.has('junction'));
        ensurePreferredChunkSelection(selectedChunks, rankedChunks, progression, (chunk) => chunk.tags.has('tip') || chunk.tags.has('entry'));
        ensurePreferredChunkSelection(selectedChunks, rankedChunks, progression, (chunk) => chunk.tags.has('leaf') || chunk.tags.has('neck') || chunk.tags.has('remote'));

        if (settlementType === 'rich') {
            ensurePreferredChunkSelection(selectedChunks, rankedChunks, progression, (chunk) => chunk.tags.has('vault') || chunk.tags.has('remote'));
        } else if (settlementType === 'trade') {
            ensurePreferredChunkSelection(selectedChunks, rankedChunks, progression, (chunk) => chunk.tags.has('neck') || chunk.tags.has('leaf'));
        } else if (settlementType === 'craft') {
            ensurePreferredChunkSelection(selectedChunks, rankedChunks, progression, (chunk) => chunk.tags.has('neck') || chunk.tags.has('remote'));
        } else if (settlementType === 'ruined') {
            ensurePreferredChunkSelection(selectedChunks, rankedChunks, progression, (chunk) => chunk.tags.has('remote') || chunk.tags.has('tip'));
        }
    }

    function chooseBuildingTypeForProfile(profile, progression, district, random) {
        if (!profile) {
            return null;
        }

        if (profile.buildingType) {
            return profile.buildingType;
        }

        const stage = getSettlementStage(progression);
        const settlementType = getSettlementType(progression);

        if (profile.kind === 'merchant') {
            const roleDefinition = getMerchantRoleDefinition(profile.merchantRole || 'merchant');

            if (settlementType === 'trade' && district === 'center') {
                return 'market';
            }

            if (settlementType === 'rich' && district === 'depth' && profile.merchantRole === 'collector') {
                return pickListEntry(['collectorHouse', 'tower'], random, 'collectorHouse');
            }

            return pickListEntry(roleDefinition.buildingTypes, random, 'shop');
        }

        if (profile.kind === 'artisan') {
            return artisanBuildingByNpcKind[profile.npcKind] || 'workshop';
        }

        if (profile.kind === 'shelter') {
            if (stage === 'protoVillage' || stage === 'village') {
                return settlementType === 'ruined' ? 'shed' : 'inn';
            }

            if (stage === 'hamlet') {
                return 'shed';
            }
        }

        if (profile.kind === 'well') {
            return stage === 'protoVillage' || stage === 'village' ? 'chapel' : null;
        }

        if (profile.kind === 'forage') {
            if (settlementType === 'fishing') {
                return pickListEntry(['barn', 'fisherHouse'], random, 'barn');
            }

            return stage === 'hamlet' || stage === 'protoVillage' || stage === 'village'
                ? pickListEntry(['barn', 'storehouse'], random, 'barn')
                : null;
        }

        if (profile.kind === 'emptyHouse') {
            if (settlementType === 'ruined') {
                return pickListEntry(['abandonedHut', 'sealedHouse', 'shed'], random, 'abandonedHut');
            }

            if (district === 'depth') {
                return 'storehouse';
            }

            return stage === 'hamlet' || stage === 'protoVillage' || stage === 'village'
                ? pickListEntry(['abandonedHut', 'barn', 'storehouse'], random, 'abandonedHut')
                : null;
        }

        if (profile.kind === 'trapHouse') {
            return settlementType === 'ruined'
                ? pickListEntry(['sealedHouse', 'tower'], random, 'sealedHouse')
                : pickListEntry(['sealedHouse', 'tower', 'abandonedHut'], random, 'sealedHouse');
        }

        if (profile.kind === 'chest' || profile.kind === 'finalChest') {
            if (profile.kind === 'finalChest') {
                return 'tower';
            }

            if (profile.chestTier === 'cursed') {
                return 'sealedHouse';
            }

            if (settlementType === 'rich') {
                return pickListEntry(['richHouse', 'collectorHouse', 'tower'], random, 'richHouse');
            }

            if (settlementType === 'ruined') {
                return pickListEntry(['sealedHouse', 'abandonedHut', 'tower'], random, 'sealedHouse');
            }

            if (district === 'depth') {
                return pickListEntry(['richHouse', 'tower', 'headmanHouse'], random, 'richHouse');
            }

            return stage === 'hamlet' || stage === 'protoVillage' || stage === 'village'
                ? pickListEntry(['richHouse', 'storehouse', 'headmanHouse'], random, 'richHouse')
                : null;
        }

        return null;
    }

    function applySettlementDecoration(profile, progression, slot, random) {
        if (!profile || !progression) {
            return profile;
        }

        const district = getSlotDistrict(slot);
        const stage = getSettlementStage(progression);
        const settlementType = getSettlementType(progression);

        profile.settlementStage = stage;
        profile.settlementType = settlementType;
        profile.district = district;

        if (profile.kind === 'merchant') {
            const merchantRole = resolveMerchantRoleForSlot(profile, progression, district, random);
            const roleDefinition = getMerchantRoleDefinition(merchantRole);
            profile.merchantRole = merchantRole;
            profile.label = roleDefinition.label;
            profile.summary = roleDefinition.summary;
            profile.houseStyle = roleDefinition.houseStyle || profile.houseStyle;
        }

        const buildingType = chooseBuildingTypeForProfile(profile, progression, district, random);
        const buildingDefinition = getBuildingTypeDefinition(buildingType);

        if (buildingType && buildingDefinition) {
            profile.buildingType = buildingType;
            profile.buildingLabel = buildingDefinition.label;
            profile.locationLabel = buildingDefinition.label;

            if (
                buildingDefinition.houseStyle
                && (
                    !profile.houseStyle
                    || profile.houseStyle === 'ordinary'
                    || (profile.houseStyle === 'poor' && buildingDefinition.houseStyle !== 'poor')
                    || profile.kind === 'emptyHouse'
                    || profile.kind === 'trapHouse'
                )
            ) {
                profile.houseStyle = buildingDefinition.houseStyle;
            }

            if (profile.kind === 'merchant' || profile.kind === 'artisan') {
                profile.summary = `${buildingDefinition.label}. ${profile.summary}`;
            } else if (profile.kind === 'shelter' || profile.kind === 'well' || profile.kind === 'forage') {
                profile.label = buildingDefinition.label;
                profile.summary = buildingDefinition.summary;
            } else if (profile.kind === 'emptyHouse' || profile.kind === 'trapHouse') {
                profile.label = buildingDefinition.label;
                profile.summary = buildingDefinition.summary;
            } else if (profile.kind === 'chest' || profile.kind === 'finalChest') {
                profile.summary = `${buildingDefinition.summary} ${profile.summary}`;
            }
        }

        if (!profile.locationLabel) {
            profile.locationLabel = profile.label;
        }

        return profile;
    }

    function createArtisanProfile(progression, random) {
        const bagUpgradeRuntime = getBagUpgradeRuntime();

        if (!bagUpgradeRuntime || typeof bagUpgradeRuntime.createArtisanEncounterProfile !== 'function') {
            return null;
        }

        const profile = bagUpgradeRuntime.createArtisanEncounterProfile(progression.islandIndex, random);

        if (!profile) {
            return null;
        }

        return {
            ...profile,
            houseStyle: profile.houseStyle || (progression.islandIndex >= 18 ? 'rich' : 'ordinary')
        };
    }

    function createEmptyHouseProfile(progression, options = {}) {
        return {
            kind: 'emptyHouse',
            houseStyle: options.houseStyle || 'empty',
            label: 'Пустой дом',
            summary: 'В доме пыль, пустые ящики и почти ничего полезного. Похоже, его уже давно вынесли.'
        };
    }

    function createTrapHouseProfile(progression, random, options = {}) {
        const islandIndex = progression.islandIndex;
        const severity = Math.max(8, Math.round(8 + islandIndex * 1.6));
        return {
            kind: 'trapHouse',
            houseStyle: options.houseStyle || 'trap',
            trapSeverity: severity,
            label: 'Дом-ловушка',
            summary: 'Подозрительно тихий дом с явными следами ловушек и плохими тайниками.'
        };
    }

    function attachLootPlanToProfile(profile, progression, random, options = {}) {
        const lootSystem = getLootSystem();

        if (!lootSystem || !profile) {
            return profile;
        }

        const lootOptions = {
            scenario: progression.scenario,
            remote: Boolean(options.remote),
            vault: Boolean(options.vault),
            guaranteed: Boolean(options.guaranteed)
        };

        if (profile.kind === 'chest' || profile.kind === 'finalChest') {
            profile.lootPlan = lootSystem.createChestLootPlan(
                progression.islandIndex,
                profile.chestTier || (profile.kind === 'finalChest' ? 'final' : 'ordinary'),
                progression.archetype,
                random,
                lootOptions
            );
            return profile;
        }

        if (profile.kind === 'emptyHouse' && typeof lootSystem.createHouseOutcomePlan === 'function') {
            profile.lootPlan = lootSystem.createHouseOutcomePlan(
                progression.islandIndex,
                'emptyHouse',
                random,
                lootOptions
            );
            return profile;
        }

        if (profile.kind === 'trapHouse' && typeof lootSystem.createHouseOutcomePlan === 'function') {
            profile.lootPlan = lootSystem.createHouseOutcomePlan(
                progression.islandIndex,
                'trapHouse',
                random,
                {
                    ...lootOptions,
                    severity: profile.trapSeverity || 10
                }
            );
        }

        return profile;
    }

    function shouldGuaranteeSafePoint(island) {
        return island.progression.scenario !== 'noHouseIsland'
            && island.progression.islandIndex >= 4
            && (
                island.progression.chunkCount >= 6
                || island.progression.archetype === 'emptyGiant'
                || island.progression.routeStyle === 'outerRing'
                || island.progression.routeStyle === 'branching'
            );
    }

    function createGuaranteedSafeProfile(progression, random) {
        if (progression.scenario === 'tradeIsland') {
            return createWellProfile(progression.islandIndex, { guaranteedSafePoint: true, houseStyle: 'ordinary' });
        }

        if (progression.islandIndex >= 6 || progression.islandIndex % 2 === 0 || random() < 0.72) {
            return createWellProfile(progression.islandIndex, { guaranteedSafePoint: true });
        }

        return createCampProfile(progression.islandIndex, { guaranteedSafePoint: true });
    }

    function createGuaranteedChestProfile(progression, random, options = {}) {
        if (options.forcedChestTier) {
            return createChestProfile(progression, random, options);
        }

        if (progression.scenario === 'jackpotIsland') {
            return createChestProfile(progression, random, {
                forcedChestTier: random() < 0.32 ? 'jackpot' : 'elite'
            });
        }

        if (progression.scenario === 'trapIsland') {
            return createChestProfile(progression, random, {
                forcedChestTier: random() < 0.55 ? 'cursed' : 'hidden'
            });
        }

        if (progression.scenario === 'tradeIsland') {
            return createChestProfile(progression, random, {
                forcedChestTier: random() < 0.35 ? 'elite' : 'rich'
            });
        }

        if (progression.islandIndex >= 10 && random() < 0.18) {
            return createChestProfile(progression, random, {
                forcedChestTier: random() < 0.22 ? 'jackpot' : 'elite'
            });
        }

        if (progression.islandIndex >= 6 && random() < 0.24) {
            return createChestProfile(progression, random, {
                forcedChestTier: random() < 0.38 ? 'elite' : 'rich'
            });
        }

        return createChestProfile(progression, random, { forcedChestTier: 'ordinary' });
    }

    function buildHouseProfile(progression, random, options = {}) {
        const islandIndex = progression.islandIndex;
        const scenario = progression.scenario || 'normal';
        const settlementStage = getSettlementStage(progression);
        const settlementType = getSettlementType(progression);
        const remote = Boolean(options.remote);
        const vault = Boolean(options.vault);
        const roll = random();

        if (scenario === 'tradeIsland') {
            if (roll < 0.4) {
                return createMerchantProfile(progression, random, { houseStyle: 'rich' });
            }
            if (roll < 0.74) {
                return createChestProfile(progression, random, {
                    forcedChestTier: remote || vault ? 'elite' : 'rich'
                });
            }
            if (roll < 0.9) {
                return createEmptyHouseProfile(progression, { houseStyle: 'ordinary' });
            }
            return random() < 0.5
                ? createWellProfile(islandIndex)
                : createCampProfile(islandIndex, { houseStyle: 'ordinary' });
        }

        if (scenario === 'trapIsland') {
            if (roll < 0.3) {
                return createTrapHouseProfile(progression, random);
            }
            if (roll < 0.72) {
                return createChestProfile(progression, random, {
                    forcedChestTier: random() < 0.58 ? 'cursed' : 'hidden'
                });
            }
            if (roll < 0.88) {
                return createEmptyHouseProfile(progression);
            }
            return random() < 0.45
                ? createCampProfile(islandIndex, { houseStyle: 'poor' })
                : createWellProfile(islandIndex);
        }

        if (scenario === 'jackpotIsland') {
            if (roll < 0.58) {
                return createChestProfile(progression, random, {
                    forcedChestTier: random() < 0.2 ? 'jackpot' : (random() < 0.55 ? 'elite' : 'rich')
                });
            }
            if (roll < 0.8) {
                return createMerchantProfile(progression, random, { houseStyle: 'rich' });
            }
            if (roll < 0.92) {
                return createEmptyHouseProfile(progression, { houseStyle: 'ordinary' });
            }
            return createWellProfile(islandIndex, { houseStyle: 'ordinary' });
        }

        let chestChance = clamp(0.08 + islandIndex * 0.03, 0.08, 0.56);
        let merchantChance = clamp(0.12 + islandIndex * 0.011, 0.12, 0.3);
        let emptyHouseChance = islandIndex >= 4 ? clamp(0.08 + islandIndex * 0.005, 0.08, 0.16) : 0;
        let trapHouseChance = islandIndex >= 6 ? clamp(0.04 + islandIndex * 0.005, 0.04, 0.11) : 0;

        if (settlementStage === 'outpost') {
            merchantChance += 0.04;
            emptyHouseChance += 0.02;
        } else if (settlementStage === 'hamlet') {
            merchantChance += 0.08;
            emptyHouseChance += 0.03;
        } else if (settlementStage === 'protoVillage') {
            merchantChance += 0.12;
            chestChance += 0.04;
            emptyHouseChance += 0.03;
        } else if (settlementStage === 'village') {
            merchantChance += 0.15;
            chestChance += 0.06;
            emptyHouseChance += 0.02;
        }

        if (settlementType === 'fishing') {
            merchantChance += 0.03;
            trapHouseChance = Math.max(0.02, trapHouseChance - 0.01);
        } else if (settlementType === 'trade') {
            merchantChance += 0.08;
            chestChance += 0.05;
        } else if (settlementType === 'craft') {
            merchantChance += 0.05;
            trapHouseChance += 0.01;
        } else if (settlementType === 'rich') {
            chestChance += 0.1;
            merchantChance += 0.05;
            emptyHouseChance = Math.max(0.04, emptyHouseChance - 0.03);
        } else if (settlementType === 'ruined') {
            emptyHouseChance += 0.08;
            trapHouseChance += 0.03;
            merchantChance = Math.max(0.08, merchantChance - 0.04);
            chestChance = Math.max(0.06, chestChance - 0.02);
        }

        if (islandIndex >= 18) {
            trapHouseChance += 0.01;
        }

        if (islandIndex >= 20) {
            emptyHouseChance += 0.02;
            trapHouseChance += 0.02;
        }

        if (islandIndex >= 23) {
            emptyHouseChance += 0.03;
            trapHouseChance += 0.03;
            merchantChance = Math.max(0.08, merchantChance - 0.02);
        }

        if (progression.archetype === 'golden') {
            chestChance += 0.16;
        } else if (progression.archetype === 'greedy') {
            chestChance += 0.08;
            merchantChance -= 0.03;
            trapHouseChance += 0.03;
        } else if (progression.archetype === 'emptyGiant') {
            chestChance -= 0.06;
            merchantChance += 0.04;
            emptyHouseChance += 0.05;
        }

        if (roll < chestChance) {
            return createChestProfile(progression, random, {
                forcedChestTier: vault ? 'elite' : undefined,
                houseStyle: vault ? 'rich' : undefined,
                remote,
                vault
            });
        }

        if (roll < chestChance + merchantChance) {
            return createMerchantProfile(progression, random);
        }

        if (roll < chestChance + merchantChance + trapHouseChance) {
            return createTrapHouseProfile(progression, random);
        }

        if (roll < chestChance + merchantChance + trapHouseChance + emptyHouseChance) {
            return createEmptyHouseProfile(progression);
        }

        const safeRoll = random();

        if (settlementType === 'fishing' && safeRoll < 0.56) {
            return createForageProfile(islandIndex, { houseStyle: 'poor' });
        }

        if ((settlementType === 'trade' || settlementType === 'rich') && safeRoll < 0.34) {
            return createCampProfile(islandIndex, { houseStyle: settlementType === 'rich' ? 'rich' : 'ordinary' });
        }

        if (settlementType === 'craft' && safeRoll < 0.4) {
            return createWellProfile(islandIndex, { houseStyle: 'ordinary' });
        }

        if (islandIndex >= 4 && safeRoll < 0.5) {
            return createWellProfile(islandIndex);
        }

        if (islandIndex >= 3 && safeRoll < 0.84) {
            return createForageProfile(islandIndex);
        }

        return createCampProfile(islandIndex);
    }

    function applySavedMerchantState(house, profile) {
        const shopRuntime = getShopRuntime();

        if (shopRuntime && typeof shopRuntime.applySavedMerchantState === 'function') {
            return shopRuntime.applySavedMerchantState(house, profile);
        }

        if (!house || !profile || profile.kind !== 'merchant') {
            return profile;
        }

        const state = game.state;
        const merchantStateByHouseId = state && state.merchantStateByHouseId
            ? state.merchantStateByHouseId
            : {};
        const savedState = merchantStateByHouseId[house.id];

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

        return profile;
    }

    function applyHouseVisualStyle(house, profile) {
        if (!house || !profile) {
            return;
        }

        if (profile.houseStyle === 'rich') {
            house.paletteIndex = 2;
        } else if (profile.houseStyle === 'poor') {
            house.paletteIndex = 0;
        } else if (profile.houseStyle === 'empty' || profile.houseStyle === 'trap') {
            house.paletteIndex = 1;
        }
    }

    function assignHouseProfile(house, progression, chunkRecord, houseIndex = 0) {
        const random = createIslandRandom(
            progression.islandIndex,
            houseIndex + chunkRecord.chunkX * 3 + chunkRecord.chunkY * 5 + 11
        );
        const preplannedProfile = chunkRecord.houseProfiles && chunkRecord.houseProfiles[houseIndex]
            ? cloneHouseProfile(chunkRecord.houseProfiles[houseIndex])
            : null;
        const profile = preplannedProfile || buildHouseProfile(progression, random, {
            remote: chunkRecord.tags.has('remote') || chunkRecord.tags.has('tip'),
            vault: chunkRecord.tags.has('vault')
        });

        if (progression.isFinalIsland && chunkRecord.tags.has('vault') && houseIndex === 0) {
            house.expedition = {
                islandIndex: progression.islandIndex,
                archetype: progression.archetype,
                scenario: progression.scenario,
                ...createFinalChestProfile()
            };
            attachLootPlanToProfile(house.expedition, progression, random, {
                remote: true,
                vault: true,
                guaranteed: true
            });
            applySettlementDecoration(house.expedition, progression, {
                chunk: chunkRecord,
                houseIndex
            }, random);
            applyHouseVisualStyle(house, house.expedition);
            return house;
        }

        if (chunkRecord.tags.has('remote') || chunkRecord.tags.has('tip')) {
            if (profile.kind === 'emptyHouse' && random() < 0.45) {
                profile.kind = 'chest';
                profile.chestTier = progression.scenario === 'trapIsland' ? 'hidden' : 'rich';
                profile.houseStyle = getChestHouseStyle(profile.chestTier);
                profile.label = chestTierLabels[profile.chestTier];
                profile.summary = buildChestSummary(profile.chestTier);
            } else if (profile.kind === 'chest' && profile.chestTier === 'ordinary' && random() < 0.5) {
                profile.chestTier = progression.scenario === 'trapIsland' ? 'hidden' : 'rich';
                profile.houseStyle = getChestHouseStyle(profile.chestTier);
                profile.label = chestTierLabels[profile.chestTier];
                profile.summary = buildChestSummary(profile.chestTier);
            }
        }

        if (chunkRecord.tags.has('vault') && profile.kind === 'chest' && profile.chestTier !== 'jackpot') {
            profile.chestTier = progression.scenario === 'jackpotIsland' ? 'jackpot' : 'elite';
            profile.houseStyle = getChestHouseStyle(profile.chestTier);
            profile.label = chestTierLabels[profile.chestTier];
            profile.summary = buildChestSummary(profile.chestTier);
        }

        attachLootPlanToProfile(profile, progression, random, {
            remote: chunkRecord.tags.has('remote') || chunkRecord.tags.has('tip'),
            vault: chunkRecord.tags.has('vault')
        });
        applySavedMerchantState(house, profile);
        applySettlementDecoration(profile, progression, {
            chunk: chunkRecord,
            houseIndex
        }, random);

        house.expedition = {
            islandIndex: progression.islandIndex,
            archetype: progression.archetype,
            scenario: progression.scenario,
            ...profile
        };
        applyHouseVisualStyle(house, house.expedition);
        return house;
    }

    function assignIslandHousePlan(island) {
        island.chunks.forEach((chunk) => {
            chunk.houseQuota = 0;
            chunk.houseProfiles = [];
            chunk.specialInteractionPlans = [];
        });

        const totalBudget = island.progression.islandHouseBudget || 0;
        const random = createIslandRandom(island.islandIndex, 701);
        if (totalBudget <= 0 || island.chunks.length === 0 || island.progression.scenario === 'noHouseIsland') {
            assignIslandSpecialNpcPlan(island, random);
            return;
        }

        const rankedChunks = [...island.chunks].sort((left, right) => {
            const weightDelta = getSettlementChunkSelectionWeight(right, island.progression)
                - getSettlementChunkSelectionWeight(left, island.progression);

            if (Math.abs(weightDelta) > 0.001) {
                return weightDelta;
            }

            return random() < 0.5 ? -1 : 1;
        });

        const selectedChunks = rankedChunks.slice(0, Math.min(totalBudget, rankedChunks.length));
        applySettlementChunkCoverage(selectedChunks, rankedChunks, island.progression);
        selectedChunks.forEach((chunk) => {
            chunk.houseQuota = 1;
        });

        let remainingHouses = totalBudget - selectedChunks.length;
        let cursor = 0;

        while (remainingHouses > 0 && selectedChunks.length > 0) {
            selectedChunks[cursor % selectedChunks.length].houseQuota += 1;
            remainingHouses--;
            cursor++;
        }

        const slots = [];
        selectedChunks.forEach((chunk) => {
            for (let houseIndex = 0; houseIndex < chunk.houseQuota; houseIndex++) {
                slots.push({
                    chunk,
                    houseIndex,
                    score: getSettlementChunkSelectionWeight(chunk, island.progression) - houseIndex * 0.65
                });
            }
        });

        slots.sort((left, right) => right.score - left.score);

        const profiles = [];
        const artisanProfile = createArtisanProfile(island.progression, random);

        if (slots.length > 0 && artisanProfile) {
            profiles.push(artisanProfile);
        }

        if (slots.length > profiles.length && island.islandIndex >= 2) {
            if (island.progression.scenario === 'tradeIsland') {
                profiles.push(createMerchantProfile(island.progression, random, { houseStyle: 'rich' }));
            } else if (island.progression.scenario === 'trapIsland') {
                profiles.push(createTrapHouseProfile(island.progression, random));
            } else if (island.progression.scenario === 'jackpotIsland') {
                profiles.push(createGuaranteedChestProfile(island.progression, random, {
                    forcedChestTier: random() < 0.28 ? 'jackpot' : 'elite'
                }));
            } else {
                profiles.push(createGuaranteedChestProfile(island.progression, random));
            }
        }

        if (slots.length > profiles.length && island.islandIndex >= 8) {
            const stageAnchorProfile = createStageAnchorMerchantProfile(island.progression, random);

            if (stageAnchorProfile) {
                profiles.push(stageAnchorProfile);
            }
        }

        if (slots.length > profiles.length && island.islandIndex >= 13) {
            const supportProfile = createSettlementSupportProfile(island.progression, random);

            if (supportProfile) {
                profiles.push(supportProfile);
            }
        }

        if (slots.length > profiles.length && island.islandIndex >= 18) {
            const secondaryMerchantProfile = createSettlementSecondaryMerchantProfile(island.progression, random);

            if (secondaryMerchantProfile) {
                profiles.push(secondaryMerchantProfile);
            }
        }

        if (slots.length > profiles.length && shouldGuaranteeSafePoint(island)) {
            profiles.push(createGuaranteedSafeProfile(island.progression, random));
        }

        while (profiles.length < slots.length) {
            const slot = slots[profiles.length];
            profiles.push(buildHouseProfile(island.progression, random, {
                remote: slot.chunk.tags.has('remote') || slot.chunk.tags.has('tip'),
                vault: slot.chunk.tags.has('vault')
            }));
        }

        const profilePriority = {
            finalChest: 6,
            chest: 5,
            artisan: 4.6,
            merchant: 4,
            trapHouse: 3.3,
            shelter: 2.7,
            well: 2.6,
            forage: 2.4,
            emptyHouse: 1.8
        };

        profiles.sort((left, right) => {
            const priorityDelta = (profilePriority[right.kind] || 0) - (profilePriority[left.kind] || 0);
            if (Math.abs(priorityDelta) > 0.001) {
                return priorityDelta;
            }

            const rightTier = right.chestTier === 'jackpot' ? 5
                : right.chestTier === 'elite' ? 4
                    : right.chestTier === 'cursed' ? 3.5
                        : right.chestTier === 'rich' ? 3
                            : right.chestTier === 'hidden' ? 2.5
                                : right.chestTier === 'ordinary' ? 2
                                    : 0;
            const leftTier = left.chestTier === 'jackpot' ? 5
                : left.chestTier === 'elite' ? 4
                    : left.chestTier === 'cursed' ? 3.5
                        : left.chestTier === 'rich' ? 3
                            : left.chestTier === 'hidden' ? 2.5
                                : left.chestTier === 'ordinary' ? 2
                                    : 0;
            return rightTier - leftTier;
        });

        slots.forEach((slot, index) => {
            slot.chunk.houseProfiles[slot.houseIndex] = cloneHouseProfile(profiles[index]);
        });

        assignIslandSpecialNpcPlan(island, random);
    }

    Object.assign(houseProfiles, {
        cloneRewardMap,
        cloneHouseProfile,
        attachLootPlanToProfile,
        getChunkHouseWeight,
        createCampProfile,
        createWellProfile,
        createForageProfile,
        createArtisanProfile,
        createMerchantProfile,
        createEmptyHouseProfile,
        createTrapHouseProfile,
        createChestProfile,
        createGuaranteedSafeProfile,
        createGuaranteedChestProfile,
        shouldGuaranteeSafePoint,
        buildHouseProfile,
        applySavedMerchantState,
        assignIslandSpecialNpcPlan,
        assignHouseProfile,
        assignIslandHousePlan
    });
})();
