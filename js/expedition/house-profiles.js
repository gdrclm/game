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

    function getLootSystem() {
        return game.systems.loot || null;
    }

    function getShopRuntime() {
        return game.systems.shopRuntime || null;
    }

    function getBagUpgradeRuntime() {
        return game.systems.bagUpgradeRuntime || null;
    }

    function cloneRewardMap(rewardMap) {
        return rewardMap ? { ...rewardMap } : undefined;
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

    function createMerchantProfile(progression, random, options = {}) {
        const islandIndex = progression.islandIndex;
        const shopRuntime = getShopRuntime();
        const lootSystem = getLootSystem();
        const houseStyle = options.houseStyle || (progression.scenario === 'tradeIsland' ? 'rich' : 'ordinary');

        if (shopRuntime && typeof shopRuntime.createMerchantEncounterProfile === 'function') {
            const profile = shopRuntime.createMerchantEncounterProfile(islandIndex, random);
            profile.houseStyle = houseStyle;
            profile.label = progression.scenario === 'tradeIsland'
                ? 'Богатый торговый дом'
                : 'Странствующий торговец';
            profile.summary = progression.scenario === 'tradeIsland'
                ? 'Торговая точка с лучшим выбором снаряжения и заметно более богатой обстановкой.'
                : 'Торговец принимает заказы, скупает находки и продаёт полезные припасы для переходов.';
            return profile;
        }

        const stock = lootSystem && typeof lootSystem.createMerchantStock === 'function'
            ? lootSystem.createMerchantStock(islandIndex, random)
            : [];
        const quest = lootSystem && typeof lootSystem.createMerchantQuest === 'function'
            ? lootSystem.createMerchantQuest(islandIndex, random)
            : null;

        return {
            kind: 'merchant',
            houseStyle,
            label: progression.scenario === 'tradeIsland'
                ? 'Богатый торговый дом'
                : 'Странствующий торговец',
            summary: progression.scenario === 'tradeIsland'
                ? 'Торговая точка с лучшим выбором снаряжения и заметно более богатой обстановкой.'
                : 'Торговец принимает заказы, скупает находки и продаёт полезные припасы для переходов.',
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
        });

        const totalBudget = island.progression.islandHouseBudget || 0;
        if (totalBudget <= 0 || island.chunks.length === 0 || island.progression.scenario === 'noHouseIsland') {
            return;
        }

        const random = createIslandRandom(island.islandIndex, 701);
        const rankedChunks = [...island.chunks].sort((left, right) => {
            const weightDelta = getChunkHouseWeight(right) - getChunkHouseWeight(left);

            if (Math.abs(weightDelta) > 0.001) {
                return weightDelta;
            }

            return random() < 0.5 ? -1 : 1;
        });

        const selectedChunks = rankedChunks.slice(0, Math.min(totalBudget, rankedChunks.length));
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
                    score: getChunkHouseWeight(chunk) - houseIndex * 0.65
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
        assignHouseProfile,
        assignIslandHousePlan
    });
})();
